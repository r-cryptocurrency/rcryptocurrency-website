import { CHANNEL_ID } from './config';

export async function sendTelegramMessage(message: string) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    console.warn('TELEGRAM_BOT_TOKEN not set, skipping notification.');
    return;
  }

  // Build the API URL at runtime to ensure env vars are loaded
  const apiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHANNEL_ID,
        text: message,
        parse_mode: 'Markdown',
        disable_web_page_preview: true
      })
    });

    const data = await response.json();
    if (!data.ok) {
      console.error('Telegram API Error:', data);
    } else {
      console.log('Notification sent to Telegram.');
    }
  } catch (e) {
    console.error('Failed to send Telegram message:', e);
  }
}
