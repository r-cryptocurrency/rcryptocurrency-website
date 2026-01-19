'use server';

import { redirect } from 'next/navigation';
import { prisma } from '@rcryptocurrency/database';
import {
  createAdminSession,
  destroyAdminSession,
  validatePassword,
  verifyAdminSession,
} from '@/lib/admin-auth';

interface LoginResult {
  success: boolean;
  error?: string;
}

export async function adminLogin(password: string): Promise<LoginResult> {
  if (!password) {
    return { success: false, error: 'Password is required.' };
  }

  if (!validatePassword(password)) {
    return { success: false, error: 'Invalid password.' };
  }

  await createAdminSession();
  return { success: true };
}

export async function adminLogout(): Promise<void> {
  await destroyAdminSession();
  redirect('/admin');
}

// Slug generation helper
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 100);
}

interface CreatePostResult {
  success: boolean;
  error?: string;
  slug?: string;
}

export async function createNewsletterPost(
  title: string,
  body: string,
  excerpt?: string,
  authorName?: string,
  publish?: boolean
): Promise<CreatePostResult> {
  const isAdmin = await verifyAdminSession();
  if (!isAdmin) {
    return { success: false, error: 'Unauthorized' };
  }

  if (!title?.trim()) {
    return { success: false, error: 'Title is required.' };
  }

  if (!body?.trim()) {
    return { success: false, error: 'Body is required.' };
  }

  try {
    // Generate unique slug
    let baseSlug = generateSlug(title);
    let slug = baseSlug;
    let counter = 1;

    // Check for existing slugs and make unique
    while (await prisma.newsletterPost.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const post = await prisma.newsletterPost.create({
      data: {
        slug,
        title: title.trim(),
        body: body.trim(),
        excerpt: excerpt?.trim() || null,
        authorName: authorName?.trim() || null,
        publishedAt: publish ? new Date() : null,
      },
    });

    return { success: true, slug: post.slug };
  } catch (error) {
    console.error('Create post error:', error);
    return { success: false, error: 'Failed to create post.' };
  }
}

interface UpdatePostResult {
  success: boolean;
  error?: string;
}

export async function updateNewsletterPost(
  id: number,
  title: string,
  body: string,
  excerpt?: string,
  authorName?: string,
  publish?: boolean
): Promise<UpdatePostResult> {
  const isAdmin = await verifyAdminSession();
  if (!isAdmin) {
    return { success: false, error: 'Unauthorized' };
  }

  if (!title?.trim()) {
    return { success: false, error: 'Title is required.' };
  }

  if (!body?.trim()) {
    return { success: false, error: 'Body is required.' };
  }

  try {
    const existing = await prisma.newsletterPost.findUnique({ where: { id } });
    if (!existing) {
      return { success: false, error: 'Post not found.' };
    }

    await prisma.newsletterPost.update({
      where: { id },
      data: {
        title: title.trim(),
        body: body.trim(),
        excerpt: excerpt?.trim() || null,
        authorName: authorName?.trim() || null,
        publishedAt: publish ? (existing.publishedAt || new Date()) : null,
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Update post error:', error);
    return { success: false, error: 'Failed to update post.' };
  }
}

export async function deleteNewsletterPost(id: number): Promise<UpdatePostResult> {
  const isAdmin = await verifyAdminSession();
  if (!isAdmin) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    await prisma.newsletterPost.delete({ where: { id } });
    return { success: true };
  } catch (error) {
    console.error('Delete post error:', error);
    return { success: false, error: 'Failed to delete post.' };
  }
}

// Broadcast a post as newsletter
export async function broadcastPost(id: number): Promise<UpdatePostResult> {
  const isAdmin = await verifyAdminSession();
  if (!isAdmin) {
    return { success: false, error: 'Unauthorized' };
  }

  const post = await prisma.newsletterPost.findUnique({ where: { id } });
  if (!post) {
    return { success: false, error: 'Post not found.' };
  }

  if (!post.publishedAt) {
    return { success: false, error: 'Post must be published before broadcasting.' };
  }

  if (post.isSent) {
    return { success: false, error: 'Post has already been sent.' };
  }

  // Check Resend configuration
  if (!process.env.RESEND_API_KEY || !process.env.RESEND_SEGMENT_ID) {
    return { success: false, error: 'Resend is not configured. Set RESEND_API_KEY and RESEND_SEGMENT_ID.' };
  }

  try {
    // Create broadcast via Resend API
    // Note: Broadcasts require a segmentId (create a segment in Resend dashboard first)
    const broadcastResponse = await fetch('https://api.resend.com/broadcasts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        segmentId: process.env.RESEND_SEGMENT_ID,
        from: process.env.RESEND_FROM_EMAIL || 'updates@updates.rcryptocurrency.com',
        subject: post.title,
        html: formatPostAsEmail(post.title, post.body),
      }),
    });

    if (!broadcastResponse.ok) {
      const errorData = await broadcastResponse.json().catch(() => ({}));
      console.error('Resend broadcast error:', errorData);
      return { success: false, error: 'Failed to create broadcast.' };
    }

    const broadcastData = await broadcastResponse.json();

    // Send the broadcast
    const sendResponse = await fetch(`https://api.resend.com/broadcasts/${broadcastData.id}/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      },
    });

    if (!sendResponse.ok) {
      const errorData = await sendResponse.json().catch(() => ({}));
      console.error('Resend send error:', errorData);
      return { success: false, error: 'Failed to send broadcast.' };
    }

    // Mark as sent in database
    await prisma.newsletterPost.update({
      where: { id },
      data: { isSent: true },
    });

    return { success: true };
  } catch (error) {
    console.error('Broadcast error:', error);
    return { success: false, error: 'Failed to broadcast post.' };
  }
}

// Format post content as HTML email
function formatPostAsEmail(title: string, body: string): string {
  // Basic markdown to HTML conversion
  const htmlBody = body
    .replace(/^### (.*$)/gim, '<h3 style="font-size: 18px; margin-top: 24px;">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 style="font-size: 22px; margin-top: 32px;">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 style="font-size: 26px; margin-top: 32px;">$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color: #ea580c;">$1</a>')
    .replace(/\n\n/g, '</p><p style="margin: 16px 0;">')
    .replace(/\n/g, '<br />');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #111827; color: #e5e7eb; padding: 40px 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #1f2937; border-radius: 12px; padding: 32px;">
    <h1 style="color: #ffffff; font-size: 28px; margin-bottom: 24px;">${title}</h1>
    <div style="color: #d1d5db; line-height: 1.6;">
      <p style="margin: 16px 0;">${htmlBody}</p>
    </div>
    <hr style="border: none; border-top: 1px solid #374151; margin: 32px 0;" />
    <p style="color: #9ca3af; font-size: 12px;">
      You're receiving this because you subscribed to r/CryptoCurrency updates.<br />
      <a href="{{{RESEND_UNSUBSCRIBE_URL}}}" style="color: #9ca3af;">Unsubscribe</a>
    </p>
  </div>
</body>
</html>
  `.trim();
}
