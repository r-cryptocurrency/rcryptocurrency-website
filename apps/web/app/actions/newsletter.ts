'use server';

import { prisma } from '@rcryptocurrency/database';

// Simple email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface SubscribeResult {
  success: boolean;
  error?: string;
}

export async function subscribeToNewsletter(email: string): Promise<SubscribeResult> {
  // Validate email format
  if (!email || !EMAIL_REGEX.test(email)) {
    return { success: false, error: 'Please enter a valid email address.' };
  }

  const normalizedEmail = email.toLowerCase().trim();

  try {
    // Add to Resend contacts if configured
    // Endpoint: POST https://api.resend.com/contacts (no audience_id needed)
    if (process.env.RESEND_API_KEY) {
      console.log('Attempting to add contact to Resend:', normalizedEmail);

      const resendResponse = await fetch('https://api.resend.com/contacts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: normalizedEmail,
          unsubscribed: false,
        }),
      });

      const responseText = await resendResponse.text();
      console.log('Resend API response:', resendResponse.status, responseText);

      if (!resendResponse.ok) {
        console.error('Resend API error:', resendResponse.status, responseText);
        // Continue to save locally even if Resend fails
      } else {
        console.log('Contact added to Resend successfully:', normalizedEmail);
      }
    } else {
      console.warn('RESEND_API_KEY not set - contacts will only be saved locally');
    }

    // Save to local database (backup)
    await prisma.newsletterSubscriber.upsert({
      where: { email: normalizedEmail },
      update: { isActive: true },
      create: { email: normalizedEmail, isActive: true },
    });

    return { success: true };
  } catch (error) {
    console.error('Newsletter subscription error:', error);
    return { success: false, error: 'Something went wrong. Please try again.' };
  }
}
