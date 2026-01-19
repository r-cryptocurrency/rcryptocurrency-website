'use server';

import { prisma } from '@rcryptocurrency/database';
import { render } from '@react-email/components';
import WelcomeEmail from '@/components/emails/WelcomeEmail';

// Simple email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Send welcome email to new subscriber
async function sendWelcomeEmail(email: string): Promise<void> {
  try {
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'updates@updates.rcryptocurrency.com';

    // Render the React Email template to HTML
    const html = await render(WelcomeEmail({
      unsubscribeUrl: 'https://rcryptocurrency.com/newsletter/manage',
    }));

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `r/CryptoCurrency <${fromEmail}>`,
        to: email,
        subject: 'Welcome to the r/CryptoCurrency Newsletter!',
        html,
      }),
    });

    if (!response.ok) {
      console.error('Failed to send welcome email:', await response.text());
    } else {
      console.log('Welcome email sent to:', email);
    }
  } catch (error) {
    console.error('Error sending welcome email:', error);
    // Don't throw - welcome email failure shouldn't break subscription
  }
}

interface SubscribeResult {
  success: boolean;
  error?: string;
  message?: string;
}

export async function subscribeToNewsletter(email: string): Promise<SubscribeResult> {
  // Validate email format
  if (!email || !EMAIL_REGEX.test(email)) {
    return { success: false, error: 'Please enter a valid email address.' };
  }

  const normalizedEmail = email.toLowerCase().trim();

  try {
    // Add to Resend contacts and segment if configured
    // Endpoint: POST https://api.resend.com/contacts
    if (process.env.RESEND_API_KEY) {
      console.log('Attempting to add contact to Resend:', normalizedEmail);

      // Build request body - add to segment if RESEND_SEGMENT_ID is set
      const contactBody: Record<string, unknown> = {
        email: normalizedEmail,
        unsubscribed: false,
      };

      if (process.env.RESEND_SEGMENT_ID) {
        contactBody.segments = [{ id: process.env.RESEND_SEGMENT_ID }];
      }

      const resendResponse = await fetch('https://api.resend.com/contacts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contactBody),
      });

      const responseText = await resendResponse.text();
      console.log('Resend API response:', resendResponse.status, responseText);

      if (!resendResponse.ok) {
        console.error('Resend API error:', resendResponse.status, responseText);
        // Continue to save locally even if Resend fails
      } else {
        console.log('Contact added to Resend successfully:', normalizedEmail);

        // Send welcome email
        await sendWelcomeEmail(normalizedEmail);
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

export async function unsubscribeFromNewsletter(email: string): Promise<SubscribeResult> {
  // Validate email format
  if (!email || !EMAIL_REGEX.test(email)) {
    return { success: false, error: 'Please enter a valid email address.' };
  }

  const normalizedEmail = email.toLowerCase().trim();

  try {
    // First, get the contact ID from Resend
    if (process.env.RESEND_API_KEY) {
      // Search for contact by email
      const searchResponse = await fetch(
        `https://api.resend.com/contacts?email=${encodeURIComponent(normalizedEmail)}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          },
        }
      );

      if (searchResponse.ok) {
        const contacts = await searchResponse.json();

        if (contacts.data && contacts.data.length > 0) {
          const contactId = contacts.data[0].id;

          // Update contact to unsubscribed
          const updateResponse = await fetch(
            `https://api.resend.com/contacts/${contactId}`,
            {
              method: 'PATCH',
              headers: {
                'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ unsubscribed: true }),
            }
          );

          if (!updateResponse.ok) {
            console.error('Failed to unsubscribe in Resend:', await updateResponse.text());
          } else {
            console.log('Contact unsubscribed in Resend:', normalizedEmail);
          }
        } else {
          console.log('Contact not found in Resend:', normalizedEmail);
        }
      }
    }

    // Update local database
    const existing = await prisma.newsletterSubscriber.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      await prisma.newsletterSubscriber.update({
        where: { email: normalizedEmail },
        data: { isActive: false },
      });
    }

    return {
      success: true,
      message: "You've been unsubscribed. You won't receive any more emails from us."
    };
  } catch (error) {
    console.error('Newsletter unsubscribe error:', error);
    return { success: false, error: 'Something went wrong. Please try again.' };
  }
}
