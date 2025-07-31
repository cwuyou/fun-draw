import type { Metadata } from 'next'
import { LanguageProvider } from '@/contexts/language-context'
import './globals.css'

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
          {children}
        </LanguageProvider>
      </body>
    </html>
  )
}
