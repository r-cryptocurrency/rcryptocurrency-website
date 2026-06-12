'use client';
import { useEffect } from 'react';

// Self-hosted, cookieless Umami — config via env so nothing is hardcoded.
// Honors Global Privacy Control + Do-Not-Track. No-op unless both env vars are set.
const HOST = process.env.NEXT_PUBLIC_UMAMI_HOST;
const WEBSITE_ID = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;

export function UmamiAnalytics() {
  useEffect(() => {
    if (!HOST || !WEBSITE_ID) return;
    const nav = navigator as { globalPrivacyControl?: boolean };
    if (nav.globalPrivacyControl) return;
    if (document.querySelector(`script[data-website-id="${WEBSITE_ID}"]`)) return;
    const s = document.createElement('script');
    s.defer = true;
    s.src = `${HOST}/script.js`;
    s.setAttribute('data-website-id', WEBSITE_ID);
    s.setAttribute('data-do-not-track', 'true');
    document.head.appendChild(s);
  }, []);
  return null;
}
