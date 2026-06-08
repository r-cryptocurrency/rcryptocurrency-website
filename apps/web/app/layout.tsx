import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { DesktopNav, MobileBottomNav } from '../components/navigation'
import { ThemeProvider } from '../components/ThemeProvider'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL('https://rcryptocurrency.com'),
  title: {
    default: 'r/CryptoCurrency - World\'s Largest Crypto Community',
    template: '%s | r/CryptoCurrency',
  },
  description: 'The world\'s largest cryptocurrency community with 10M+ members. Home of the MOON token, community governance, and crypto education.',
  icons: {
    icon: '/img/favicon.webp',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://rcryptocurrency.com',
    siteName: 'r/CryptoCurrency',
    title: 'r/CryptoCurrency - World\'s Largest Crypto Community',
    description: 'The world\'s largest cryptocurrency community with 10M+ members. Home of the MOON token, community governance, and crypto education.',
    images: [
      {
        url: '/img/logorcc.png',
        width: 400,
        height: 400,
        alt: 'r/CryptoCurrency Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@CCMOD_',
    creator: '@CCMOD_',
    title: 'r/CryptoCurrency - World\'s Largest Crypto Community',
    description: 'The world\'s largest cryptocurrency community with 10M+ members. Home of the MOON token, community governance, and crypto education.',
    images: ['/img/logorcc.png'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link href="/css/owl.carousel.min.css" rel="stylesheet"/>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet" />
        <link href="/css/style.css" rel="stylesheet"/>
      </head>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {/* Desktop: Top nav with dropdowns (hidden on mobile) */}
          <DesktopNav />
          {/* Main content */}
          {children}
          {/* Mobile: Bottom tab bar (hidden on desktop) */}
          <MobileBottomNav />
        </ThemeProvider>
      </body>
    </html>
  )
}
