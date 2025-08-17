/**
 * 开发环境翻译键检查工具
 * 在开发环境下自动检查翻译键的完整性
 */

import { CRITICAL_TRANSLATION_KEYS, TranslationChecker } from './translation-validator'

/**
 * 在开发环境下检查翻译文件的完整性
 */
export async function checkTranslationIntegrity(): Promise<void> {
  if (process.env.NODE_ENV !== 'development') {
    return
  }

  try {
    // 加载翻译文件
    const [zhResponse, enResponse] = await Promise.all([
      fetch('/locales/zh.json'),
      fetch('/locales/en.json')
    ])

    if (!zhResponse.ok || !enResponse.ok) {
      console.warn('⚠️ Could not load translation files for integrity check')
      return
    }

    const [zhTranslations, enTranslations] = await Promise.all([
      zhResponse.json(),
      enResponse.json()
    ])

    // 检查关键翻译键
    const missingInZh: string[] = []
    const missingInEn: string[] = []

    CRITICAL_TRANSLATION_KEYS.forEach(key => {
      const zhValue = getNestedValue(zhTranslations, key)
      const enValue = getNestedValue(enTranslations, key)

      if (zhValue === undefined || typeof zhValue !== 'string') {
        missingInZh.push(key)
      }

      if (enValue === undefined || typeof enValue !== 'string') {
        missingInEn.push(key)
      }
    })

    // 输出检查结果
    console.group('🔍 Translation Integrity Check')
    
    if (missingInZh.length === 0 && missingInEn.length === 0) {
      console.log('✅ All critical translation keys are present')
    } else {
      if (missingInZh.length > 0) {
        console.warn(`❌ Missing ${missingInZh.length} keys in zh.json:`)
        missingInZh.forEach(key => console.warn(`   - ${key}`))
      }

      if (missingInEn.length > 0) {
        console.warn(`❌ Missing ${missingInEn.length} keys in en.json:`)
        missingInEn.forEach(key => console.warn(`   - ${key}`))
      }
    }

    console.groupEnd()

    // 设置定时器，在应用运行一段时间后打印使用报告
    setTimeout(() => {
      TranslationChecker.getInstance().printReport()
    }, 10000) // 10秒后打印报告

  } catch (error) {
    console.warn('⚠️ Translation integrity check failed:', error)
  }
}

/**
 * 获取嵌套对象的值
 */
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : undefined
  }, obj)
}

/**
 * 在开发环境下启动翻译检查
 */
export function startTranslationCheck(): void {
  if (process.env.NODE_ENV !== 'development') {
    return
  }

  // 延迟执行，确保应用已经初始化
  setTimeout(() => {
    checkTranslationIntegrity()
  }, 1000)
}

/**
 * 手动触发翻译键使用报告
 */
export function printTranslationReport(): void {
  if (process.env.NODE_ENV !== 'development') {
    console.log('Translation report is only available in development mode')
    return
  }

  TranslationChecker.getInstance().printReport()
}

// 在开发环境下自动启动检查
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  startTranslationCheck()
  
  // 添加全局函数，方便在控制台中调用
  ;(window as any).printTranslationReport = printTranslationReport
}