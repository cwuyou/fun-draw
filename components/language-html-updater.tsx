"use client"

import { useEffect } from 'react'
import { useTranslation } from '@/hooks/use-translation'

/**
 * 在客户端根据当前语言动态设置 <html> 的 lang 属性
 * - zh -> zh-CN
 * - en -> en
 * 仅负责同步语言标记，不渲染任何 UI
 */
export default function LanguageHtmlUpdater() {
  const { currentLanguage } = useTranslation()

  useEffect(() => {
    const lang = currentLanguage === 'zh' ? 'zh-CN' : 'en'
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('lang', lang)
      // 可选：文本方向，目前中英文均为从左到右
      document.documentElement.setAttribute('dir', 'ltr')
    }
  }, [currentLanguage])

  return null
}

