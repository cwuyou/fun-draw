import { describe, it, expect } from 'vitest'
import zhTranslations from '@/public/locales/zh.json'
import enTranslations from '@/public/locales/en.json'

/**
 * 递归检查对象结构是否匹配
 */
function checkStructureMatch(
  obj1: any, 
  obj2: any, 
  path: string = '', 
  missingKeys: string[] = []
): string[] {
  if (typeof obj1 !== 'object' || typeof obj2 !== 'object') {
    return missingKeys
  }

  for (const key in obj1) {
    const currentPath = path ? `${path}.${key}` : key
    
    if (!(key in obj2)) {
      missingKeys.push(currentPath)
      continue
    }
    
    if (typeof obj1[key] === 'object' && obj1[key] !== null) {
      checkStructureMatch(obj1[key], obj2[key], currentPath, missingKeys)
    }
  }
  
  return missingKeys
}

/**
 * 检查翻译键是否包含参数占位符
 */
function hasParameters(text: string): boolean {
  return /\{\{[^}]+\}\}/.test(text)
}

/**
 * 递归收集所有翻译键值对
 */
function collectTranslations(obj: any, prefix: string = ''): Record<string, string> {
  const result: Record<string, string> = {}
  
  for (const key in obj) {
    const fullKey = prefix ? `${prefix}.${key}` : key
    
    if (typeof obj[key] === 'string') {
      result[fullKey] = obj[key]
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      Object.assign(result, collectTranslations(obj[key], fullKey))
    }
  }
  
  return result
}

describe('Translation Completeness', () => {
  it('should have matching structure between Chinese and English translations', () => {
    const missingInEnglish = checkStructureMatch(zhTranslations, enTranslations)
    const missingInChinese = checkStructureMatch(enTranslations, zhTranslations)
    
    expect(missingInEnglish).toEqual([])
    expect(missingInChinese).toEqual([])
  })

  it('should have all required translation modules', () => {
    const requiredModules = [
      'common',
      'navigation', 
      'home',
      'drawingModes',
      'drawingComponents',
      'errors',
      'status',
      'toast',
      'createList',
      'drawConfig',
      'drawResult'
    ]
    
    requiredModules.forEach(module => {
      expect(zhTranslations).toHaveProperty(module)
      expect(enTranslations).toHaveProperty(module)
    })
  })

  it('should have drawing components translations', () => {
    expect(zhTranslations.drawingComponents).toBeDefined()
    expect(enTranslations.drawingComponents).toBeDefined()
    
    const requiredComponents = [
      'slotMachine',
      'cardFlip', 
      'bulletScreen',
      'blinkingNamePicker'
    ]
    
    requiredComponents.forEach(component => {
      expect(zhTranslations.drawingComponents).toHaveProperty(component)
      expect(enTranslations.drawingComponents).toHaveProperty(component)
    })
  })

  it('should have error translations', () => {
    expect(zhTranslations.errors).toBeDefined()
    expect(enTranslations.errors).toBeDefined()
    
    const requiredErrorCategories = [
      'validation',
      'network',
      'file',
      'storage',
      'drawing'
    ]
    
    requiredErrorCategories.forEach(category => {
      expect(zhTranslations.errors).toHaveProperty(category)
      expect(enTranslations.errors).toHaveProperty(category)
    })
  })

  it('should have status and toast translations', () => {
    expect(zhTranslations.status).toBeDefined()
    expect(enTranslations.status).toBeDefined()
    expect(zhTranslations.toast).toBeDefined()
    expect(enTranslations.toast).toBeDefined()
    
    const requiredToastTypes = ['success', 'error', 'warning', 'info']
    
    requiredToastTypes.forEach(type => {
      expect(zhTranslations.toast).toHaveProperty(type)
      expect(enTranslations.toast).toHaveProperty(type)
    })
  })

  it('should have consistent parameter usage', () => {
    const zhFlat = collectTranslations(zhTranslations)
    const enFlat = collectTranslations(enTranslations)
    
    for (const key in zhFlat) {
      if (enFlat[key]) {
        const zhHasParams = hasParameters(zhFlat[key])
        const enHasParams = hasParameters(enFlat[key])
        
        expect(zhHasParams).toBe(enHasParams)
      }
    }
  })

  it('should not have empty translation values', () => {
    const zhFlat = collectTranslations(zhTranslations)
    const enFlat = collectTranslations(enTranslations)
    
    Object.entries(zhFlat).forEach(([key, value]) => {
      expect(value.trim()).not.toBe('')
    })
    
    Object.entries(enFlat).forEach(([key, value]) => {
      expect(value.trim()).not.toBe('')
    })
  })
})