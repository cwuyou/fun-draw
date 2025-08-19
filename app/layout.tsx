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
  title: 'Fun Draw - Make Drawing More Fun',
  description: 'Say goodbye to boring wheel drawings! Fun Draw offers 5 innovative drawing animation modes for classroom teaching, corporate events, and friend gatherings.',
  generator: 'Next.js',
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
