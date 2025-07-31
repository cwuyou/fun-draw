import { useCallback } from 'react'
import { useLanguageContext } from '@/contexts/language-context'
import { LanguageCode, TranslationParams } from '@/types'

/**
 * useTranslation Hook 返回类型
 */
export interface UseTranslationReturn {
  /** 翻译函数 */
  t: (key: string, params?: TranslationParams) => string
  /** 当前语言 */
  currentLanguage: LanguageCode
  /** 切换语言函数 */
  setLanguage: (language: LanguageCode) => void
  /** 加载状态 */
  isLoading: boolean
  /** 错误信息 */
  error: string | null
  /** 检查是否为指定语言 */
  isLanguage: (language: LanguageCode) => boolean
  /** 获取当前语言的显示名称 */
  getLanguageDisplayName: (native?: boolean) => string
}

/**
 * 语言显示名称映射
 */
const LANGUAGE_DISPLAY_NAMES = {
  zh: {
    name: 'Chinese',
    nativeName: '中文'
  },
  en: {
    name: 'English',
    nativeName: 'English'
  }
} as const

/**
 * useTranslation Hook
 * 
 * 提供简洁的翻译API，封装语言上下文的复杂性
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { t, currentLanguage, setLanguage } = useTranslation()
 *   
 *   return (
 *     <div>
 *       <h1>{t('home.title')}</h1>
 *       <p>{t('common.greeting', { name: 'User' })}</p>
 *       <button onClick={() => setLanguage('en')}>
 *         Switch to English
 *       </button>
 *     </div>
 *   )
 * }
 * ```
 */
export function useTranslation(): UseTranslationReturn {
  const context = useLanguageContext()
  
  /**
   * 检查是否为指定语言
   */
  const isLanguage = useCallback((language: LanguageCode): boolean => {
    return context.currentLanguage === language
  }, [context.currentLanguage])
  
  /**
   * 获取当前语言的显示名称
   */
  const getLanguageDisplayName = useCallback((native: boolean = false): string => {
    const languageInfo = LANGUAGE_DISPLAY_NAMES[context.currentLanguage]
    return native ? languageInfo.nativeName : languageInfo.name
  }, [context.currentLanguage])

  return {
    t: context.t,
    currentLanguage: context.currentLanguage,
    setLanguage: context.setLanguage,
    isLoading: context.isLoading,
    error: context.error,
    isLanguage,
    getLanguageDisplayName
  }
}

/**
 * useTranslationKey Hook
 * 
 * 用于获取特定翻译键的值，支持响应式更新
 * 
 * @param key 翻译键
 * @param params 翻译参数
 * @returns 翻译后的文本
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const title = useTranslationKey('home.title')
 *   const greeting = useTranslationKey('common.greeting', { name: 'User' })
 *   
 *   return (
 *     <div>
 *       <h1>{title}</h1>
 *       <p>{greeting}</p>
 *     </div>
 *   )
 * }
 * ```
 */
export function useTranslationKey(key: string, params?: TranslationParams): string {
  const { t } = useTranslation()
  return t(key, params)
}

/**
 * useLanguageSwitch Hook
 * 
 * 专门用于语言切换功能的Hook
 * 
 * @returns 语言切换相关的状态和方法
 * 
 * @example
 * ```tsx
 * function LanguageSwitcher() {
 *   const { 
 *     currentLanguage, 
 *     switchToZh, 
 *     switchToEn, 
 *     toggleLanguage,
 *     isLoading 
 *   } = useLanguageSwitch()
 *   
 *   return (
 *     <button onClick={toggleLanguage} disabled={isLoading}>
 *       {currentLanguage === 'zh' ? '中' : 'EN'}
 *     </button>
 *   )
 * }
 * ```
 */
export function useLanguageSwitch() {
  const { currentLanguage, setLanguage, isLoading, error } = useTranslation()
  
  const switchToZh = useCallback(() => {
    setLanguage('zh')
  }, [setLanguage])
  
  const switchToEn = useCallback(() => {
    setLanguage('en')
  }, [setLanguage])
  
  const toggleLanguage = useCallback(() => {
    const nextLanguage = currentLanguage === 'zh' ? 'en' : 'zh'
    setLanguage(nextLanguage)
  }, [currentLanguage, setLanguage])
  
  return {
    currentLanguage,
    switchToZh,
    switchToEn,
    toggleLanguage,
    isLoading,
    error,
    isZh: currentLanguage === 'zh',
    isEn: currentLanguage === 'en'
  }
}

/**
 * useTranslationWithFallback Hook
 * 
 * 带有降级策略的翻译Hook
 * 
 * @param key 翻译键
 * @param fallback 降级文本
 * @param params 翻译参数
 * @returns 翻译后的文本或降级文本
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const title = useTranslationWithFallback('home.title', 'Welcome')
 *   
 *   return <h1>{title}</h1>
 * }
 * ```
 */
export function useTranslationWithFallback(
  key: string, 
  fallback: string, 
  params?: TranslationParams
): string {
  const { t } = useTranslation()
  
  const translated = t(key, params)
  
  // 如果翻译结果等于键名，说明翻译失败，使用降级文本
  return translated === key ? fallback : translated
}

/**
 * useTranslationArray Hook
 * 
 * 用于翻译数组类型的内容
 * 
 * @param keyPrefix 翻译键前缀
 * @param count 数组长度
 * @returns 翻译后的数组
 * 
 * @example
 * ```tsx
 * function FeatureList() {
 *   const features = useTranslationArray('drawingModes.slotMachine.features', 4)
 *   
 *   return (
 *     <ul>
 *       {features.map((feature, index) => (
 *         <li key={index}>{feature}</li>
 *       ))}
 *     </ul>
 *   )
 * }
 * ```
 */
export function useTranslationArray(keyPrefix: string, count: number): string[] {
  const { t } = useTranslation()
  
  return Array.from({ length: count }, (_, index) => {
    return t(`${keyPrefix}.${index}`)
  }).filter(item => item !== `${keyPrefix}.${index}`) // 过滤掉未翻译的项
}

/**
 * useTranslationObject Hook
 * 
 * 用于翻译对象类型的内容
 * 
 * @param keyPrefix 翻译键前缀
 * @param keys 对象键名数组
 * @returns 翻译后的对象
 * 
 * @example
 * ```tsx
 * function StatusDisplay() {
 *   const statusTexts = useTranslationObject('status', [
 *     'preparing', 'processing', 'completed', 'failed'
 *   ])
 *   
 *   return (
 *     <div>
 *       <p>{statusTexts.preparing}</p>
 *       <p>{statusTexts.processing}</p>
 *     </div>
 *   )
 * }
 * ```
 */
export function useTranslationObject<T extends string>(
  keyPrefix: string, 
  keys: T[]
): Record<T, string> {
  const { t } = useTranslation()
  
  return keys.reduce((result, key) => {
    result[key] = t(`${keyPrefix}.${key}`)
    return result
  }, {} as Record<T, string>)
}

/**
 * 翻译工具函数
 * 用于在非组件环境中进行翻译（需要谨慎使用）
 */
export const translationUtils = {
  /**
   * 格式化数字
   */
  formatNumber: (value: number, language: LanguageCode): string => {
    const locale = language === 'zh' ? 'zh-CN' : 'en-US'
    return new Intl.NumberFormat(locale).format(value)
  },
  
  /**
   * 格式化日期
   */
  formatDate: (date: Date, language: LanguageCode): string => {
    const locale = language === 'zh' ? 'zh-CN' : 'en-US'
    const options: Intl.DateTimeFormatOptions = language === 'zh' 
      ? { year: 'numeric', month: 'long', day: 'numeric' }
      : { year: 'numeric', month: 'short', day: 'numeric' }
    
    return new Intl.DateTimeFormat(locale, options).format(date)
  },
  
  /**
   * 格式化相对时间
   */
  formatRelativeTime: (date: Date, language: LanguageCode): string => {
    const locale = language === 'zh' ? 'zh-CN' : 'en-US'
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
    
    const now = new Date()
    const diffInSeconds = Math.floor((date.getTime() - now.getTime()) / 1000)
    
    if (Math.abs(diffInSeconds) < 60) {
      return rtf.format(diffInSeconds, 'second')
    } else if (Math.abs(diffInSeconds) < 3600) {
      return rtf.format(Math.floor(diffInSeconds / 60), 'minute')
    } else if (Math.abs(diffInSeconds) < 86400) {
      return rtf.format(Math.floor(diffInSeconds / 3600), 'hour')
    } else {
      return rtf.format(Math.floor(diffInSeconds / 86400), 'day')
    }
  }
}