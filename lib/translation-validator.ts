/**
 * 翻译键验证工具
 * 用于开发环境下检查翻译键的完整性和一致性
 */

import { LanguageCode } from '@/types'

/**
 * 翻译键验证结果
 */
export interface TranslationValidationResult {
  isValid: boolean
  missingKeys: string[]
  invalidKeys: string[]
  warnings: string[]
}

/**
 * 验证翻译键是否存在于翻译对象中
 */
export function validateTranslationKey(
  translations: Record<string, any>,
  key: string
): boolean {
  const keys = key.split('.')
  let current = translations
  
  for (const k of keys) {
    if (!current || typeof current !== 'object' || !(k in current)) {
      return false
    }
    current = current[k]
  }
  
  return typeof current === 'string'
}

/**
 * 获取对象中所有的翻译键
 */
export function getAllTranslationKeys(obj: Record<string, any>, prefix = ''): string[] {
  const keys: string[] = []
  
  for (const key in obj) {
    const fullKey = prefix ? `${prefix}.${key}` : key
    
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      keys.push(...getAllTranslationKeys(obj[key], fullKey))
    } else if (typeof obj[key] === 'string') {
      keys.push(fullKey)
    }
  }
  
  return keys
}

/**
 * 验证翻译文件的完整性
 */
export function validateTranslationFile(
  translations: Record<string, any>,
  requiredKeys: string[]
): TranslationValidationResult {
  const result: TranslationValidationResult = {
    isValid: true,
    missingKeys: [],
    invalidKeys: [],
    warnings: []
  }
  
  // 检查必需的翻译键
  for (const key of requiredKeys) {
    if (!validateTranslationKey(translations, key)) {
      result.missingKeys.push(key)
      result.isValid = false
    }
  }
  
  // 检查翻译值的有效性
  const allKeys = getAllTranslationKeys(translations)
  for (const key of allKeys) {
    const value = getNestedValue(translations, key)
    
    if (typeof value !== 'string') {
      result.invalidKeys.push(key)
      result.isValid = false
    } else if (value.trim() === '') {
      result.warnings.push(`Empty translation value for key: ${key}`)
    } else if (value === key) {
      result.warnings.push(`Translation value equals key name: ${key}`)
    }
  }
  
  return result
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
 * 比较两个翻译文件的键一致性
 */
export function compareTranslationFiles(
  file1: Record<string, any>,
  file2: Record<string, any>,
  language1: LanguageCode,
  language2: LanguageCode
): {
  missingInFile1: string[]
  missingInFile2: string[]
  commonKeys: string[]
} {
  const keys1 = new Set(getAllTranslationKeys(file1))
  const keys2 = new Set(getAllTranslationKeys(file2))
  
  const missingInFile1 = [...keys2].filter(key => !keys1.has(key))
  const missingInFile2 = [...keys1].filter(key => !keys2.has(key))
  const commonKeys = [...keys1].filter(key => keys2.has(key))
  
  return {
    missingInFile1,
    missingInFile2,
    commonKeys
  }
}

/**
 * 开发环境下的翻译键检查器
 */
export class TranslationChecker {
  private static instance: TranslationChecker
  private checkedKeys = new Set<string>()
  private missingKeys = new Set<string>()
  
  static getInstance(): TranslationChecker {
    if (!TranslationChecker.instance) {
      TranslationChecker.instance = new TranslationChecker()
    }
    return TranslationChecker.instance
  }
  
  /**
   * 记录翻译键的使用
   */
  recordKeyUsage(key: string, found: boolean): void {
    if (process.env.NODE_ENV !== 'development') {
      return
    }
    
    this.checkedKeys.add(key)
    
    if (!found) {
      this.missingKeys.add(key)
    }
  }
  
  /**
   * 获取缺失的翻译键报告
   */
  getMissingKeysReport(): {
    totalChecked: number
    totalMissing: number
    missingKeys: string[]
  } {
    return {
      totalChecked: this.checkedKeys.size,
      totalMissing: this.missingKeys.size,
      missingKeys: Array.from(this.missingKeys)
    }
  }
  
  /**
   * 清除检查记录
   */
  clearRecords(): void {
    this.checkedKeys.clear()
    this.missingKeys.clear()
  }
  
  /**
   * 打印缺失键报告
   */
  printReport(): void {
    if (process.env.NODE_ENV !== 'development') {
      return
    }
    
    const report = this.getMissingKeysReport()
    
    if (report.totalMissing === 0) {
      console.log('✅ All translation keys are valid')
      return
    }
    
    console.group('🔍 Translation Keys Report')
    console.log(`Total keys checked: ${report.totalChecked}`)
    console.log(`Missing keys: ${report.totalMissing}`)
    
    if (report.missingKeys.length > 0) {
      console.group('Missing Keys:')
      report.missingKeys.forEach(key => {
        console.warn(`❌ ${key}`)
      })
      console.groupEnd()
    }
    
    console.groupEnd()
  }
}

/**
 * 常用的翻译键列表，用于验证
 */
export const CRITICAL_TRANSLATION_KEYS = [
  // 通用键
  'common.loading',
  'common.error',
  'common.success',
  'common.cancel',
  'common.confirm',
  
  // 导航键
  'navigation.home',
  'navigation.createList',
  'navigation.listLibrary',
  'navigation.drawConfig',
  
  // 抽奖配置键
  'drawConfig.title',
  'drawConfig.quickConfigTab',
  'drawConfig.detailedConfig',
  'drawConfig.startDraw',
  
  // 快速配置键
  'quickConfig.title',
  'quickConfig.description',
  'quickConfig.smartRecommendations',
  'quickConfig.frequentConfigs',
  'quickConfig.allTemplates',
  
  // 抽奖模式键
  'drawingModes.slotMachine.shortTitle',
  'drawingModes.cardFlip.shortTitle',
  'drawingModes.bulletScreen.title',
  'drawingModes.gridLottery.shortTitle',
  'drawingModes.blinkingNamePicker.title',
  
  // 快速配置模板键
  'quickConfigTemplates.classroomNaming.name',
  'quickConfigTemplates.annualLottery.name',
  'quickConfigTemplates.teamGrouping.name',
  
  // 体验模板键
  'experienceTemplates.classroomNaming.name',
  'experienceTemplates.prizeDrawing.name',
  'experienceTemplates.partyGame.name'
]