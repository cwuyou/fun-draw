import type { Metadata } from 'next'
import { LanguageProvider } from '@/contexts/language-context'
import LanguageHtmlUpdater from '@/components/language-html-updater'
import LanguageHydrationGate from '@/components/language-hydration-gate'
import './globals.css'

// 在开发环境下导入翻译检查工具
if (process.env.NODE_ENV === 'development') {
  import('@/lib/dev-translation-check')
}

export const metadata: Metadata = {
  title: '趣抽 - Fun Draw',
  description: '让抽奖变得更有趣！5种创新的抽奖动画模式，告别单调的转盘抽奖',
  generator: 'Next.js',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN">
      <body>
        <LanguageProvider defaultLanguage="zh">
          <LanguageHtmlUpdater />
          <LanguageHydrationGate>
            {children}
          </LanguageHydrationGate>
        </LanguageProvider>
      </body>
    </html>
  )
}
