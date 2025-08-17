"use client"

import { ReactNode } from 'react'
import { useTranslation } from '@/hooks/use-translation'

/**
 * 语言加载门（防闪烁）
 * 在翻译未加载完成前暂缓渲染子内容，避免先显示英文再切中文的闪烁问题
 */
export default function LanguageHydrationGate({ children }: { children: ReactNode }) {
  const { isLoading } = useTranslation()

  if (isLoading) {
    // 也可放一个轻量骨架屏
    return null
  }
  return <>{children}</>
}

