'use server';

import { redirect } from 'next/navigation';
import { prisma } from '@rcryptocurrency/database';
import { render } from '@react-email/components';
import {
  createAdminSession,
  destroyAdminSession,
  validatePassword,
  verifyAdminSession,
} from '@/lib/admin-auth';
import NewPostEmail from '@/components/emails/NewPostEmail';

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
    // Render the React Email template
    const html = await render(NewPostEmail({
      title: post.title,
      excerpt: post.excerpt || undefined,
      slug: post.slug,
      authorName: post.authorName || undefined,
      unsubscribeUrl: '{{{RESEND_UNSUBSCRIBE_URL}}}', // Resend replaces this
    }));

    const fromEmail = process.env.RESEND_FROM_EMAIL || 'updates@updates.rcryptocurrency.com';

    // Create broadcast via Resend API
    // Note: Broadcasts require a segment_id (create a segment in Resend dashboard first)
    const broadcastResponse = await fetch('https://api.resend.com/broadcasts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        segment_id: process.env.RESEND_SEGMENT_ID,
        from: `r/CryptoCurrency <${fromEmail}>`,
        subject: post.title,
        html,
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

