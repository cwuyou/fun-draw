import type { Metadata } from 'next'
import Script from 'next/script'
import { LanguageProvider } from '@/contexts/language-context'
import LanguageHtmlUpdater from '@/components/language-html-updater'
import LanguageHydrationGate from '@/components/language-hydration-gate'
import GlobalHeaderMount from '@/components/global-header-mount'
import { Toaster } from '@/components/ui/toaster'
import { HeaderProvider } from '@/contexts/header-context'

import './globals.css'

// 在开发环境下导入翻译检查工具
if (process.env.NODE_ENV === 'development') {
  import('@/lib/dev-translation-check')
}

export const metadata: Metadata = {
  title: 'Pick One - Interactive Random Picker & Name Picker Tool | 5 Drawing Modes',
  description: 'Professional random picker and name picker tool with 5 animated drawing modes: slot machine picker, card flip picker, grid lottery, bullet screen picker, and blinking name picker. Perfect for classroom picker, team picker, corporate lottery, and party picker activities. Free online drawing tool for teachers and groups.',
  keywords: 'random picker, name picker, interactive picker, drawing tool, classroom picker, teacher random picker, team picker, corporate lottery, party picker, slot machine picker, card flip picker, grid lottery, bullet screen picker, blinking name picker, animated picker, multiple drawing modes, fun drawing tool, student name picker, meeting picker, group selector, winner picker, choice generator, lottery picker, picker wheel',
  generator: 'Next.js',
  robots: 'index, follow',
  authors: [{ name: 'Pick One Team' }],
  viewport: 'width=device-width, initial-scale=1',
  openGraph: {
    title: 'Pick One - Interactive Random Picker & Name Picker Tool',
    description: 'Professional random picker with 5 animated drawing modes. Perfect for classroom picker, team picker, and corporate lottery activities.',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pick One - Interactive Random Picker & Name Picker Tool',
    description: 'Professional random picker with 5 animated drawing modes for classroom and team activities.',
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-5T83DFG884"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-5T83DFG884');
          `}
        </Script>

        {/* Structured Data */}
        <Script id="structured-data" type="application/ld+json" strategy="afterInteractive">
          {`
            {
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "Pick One - Interactive Random Picker Tool",
              "description": "Professional random picker and name picker tool with 5 animated drawing modes: slot machine picker, card flip picker, grid lottery, bullet screen picker, and blinking name picker. Perfect for classroom picker, team picker, corporate lottery, and party picker activities.",
              "url": "https://fun-draw.com",
              "applicationCategory": "EducationalApplication",
              "operatingSystem": "Web Browser",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
              },
              "featureList": [
                "Slot Machine Picker",
                "Card Flip Picker",
                "Grid Lottery Picker",
                "Bullet Screen Picker",
                "Blinking Name Picker",
                "Classroom Picker for Teachers",
                "Team Picker for Groups",
                "Corporate Lottery Tool",
                "Party Picker for Events"
              ],
              "audience": {
                "@type": "Audience",
                "audienceType": ["Teachers", "Corporate Teams", "Event Organizers", "Students"]
              },
              "creator": {
                "@type": "Organization",
                "name": "Pick One Team"
              }
            }
          `}
        </Script>

        <LanguageProvider defaultLanguage="en">
          <LanguageHtmlUpdater />
          <LanguageHydrationGate>
            {/* Header context wraps the app */}
            {/* @ts-expect-error Server Component boundary */}
            <HeaderProvider>
              {/* Global site header (skip on home/immersive pages inside the mount) */}
              <GlobalHeaderMount />
              {children}
            </HeaderProvider>
          </LanguageHydrationGate>
        </LanguageProvider>
        {/* Global Toaster */}
        <div id="__toaster-root">
          {/* @ts-expect-error Server Component boundary */}
          <Toaster />
        </div>
      </body>
    </html>
  )
}
