/**
 * 翻译键完整性测试
 * 验证所有翻译键在中英文文件中都存在对应的翻译
 */

import fs from 'fs'
import path from 'path'
import { 
  getAllTranslationKeys, 
  validateTranslationKey, 
  compareTranslationFiles,
  CRITICAL_TRANSLATION_KEYS 
} from '@/lib/translation-validator'

describe('翻译键完整性测试', () => {
  let zhTranslations: Record<string, any>
  let enTranslations: Record<string, any>

  beforeAll(() => {
    // 读取翻译文件
    try {
      const zhPath = path.join(process.cwd(), 'public', 'locales', 'zh.json')
      const enPath = path.join(process.cwd(), 'public', 'locales', 'en.json')
      
      zhTranslations = JSON.parse(fs.readFileSync(zhPath, 'utf8'))
      enTranslations = JSON.parse(fs.readFileSync(enPath, 'utf8'))
    } catch (error) {
      console.error('Failed to load translation files:', error)
      throw error
    }
  })

  describe('翻译文件基本验证', () => {
    it('应该成功加载中文翻译文件', () => {
      expect(zhTranslations).toBeDefined()
      expect(typeof zhTranslations).toBe('object')
    })

    it('应该成功加载英文翻译文件', () => {
      expect(enTranslations).toBeDefined()
      expect(typeof enTranslations).toBe('object')
    })

    it('中英文翻译文件应该有相同的顶级键', () => {
      const zhTopLevelKeys = Object.keys(zhTranslations).sort()
      const enTopLevelKeys = Object.keys(enTranslations).sort()
      
      expect(zhTopLevelKeys).toEqual(enTopLevelKeys)
    })
  })

  describe('关键翻译键验证', () => {
    it('所有关键翻译键应该在中文文件中存在', () => {
      const missingKeys: string[] = []
      
      CRITICAL_TRANSLATION_KEYS.forEach(key => {
        if (!validateTranslationKey(zhTranslations, key)) {
          missingKeys.push(key)
        }
      })
      
      if (missingKeys.length > 0) {
        console.error('Missing keys in zh.json:', missingKeys)
      }
      
      expect(missingKeys).toHaveLength(0)
    })

    it('所有关键翻译键应该在英文文件中存在', () => {
      const missingKeys: string[] = []
      
      CRITICAL_TRANSLATION_KEYS.forEach(key => {
        if (!validateTranslationKey(enTranslations, key)) {
          missingKeys.push(key)
        }
      })
      
      if (missingKeys.length > 0) {
        console.error('Missing keys in en.json:', missingKeys)
      }
      
      expect(missingKeys).toHaveLength(0)
    })
  })

  describe('翻译键一致性验证', () => {
    it('中英文翻译文件应该有相同的翻译键', () => {
      const comparison = compareTranslationFiles(zhTranslations, enTranslations, 'zh', 'en')
      
      if (comparison.missingInFile1.length > 0) {
        console.error('Keys missing in zh.json:', comparison.missingInFile1)
      }
      
      if (comparison.missingInFile2.length > 0) {
        console.error('Keys missing in en.json:', comparison.missingInFile2)
      }
      
      expect(comparison.missingInFile1).toHaveLength(0)
      expect(comparison.missingInFile2).toHaveLength(0)
    })

    it('应该有合理数量的共同翻译键', () => {
      const comparison = compareTranslationFiles(zhTranslations, enTranslations, 'zh', 'en')
      
      // 应该至少有100个共同的翻译键
      expect(comparison.commonKeys.length).toBeGreaterThan(100)
    })
  })

  describe('特定功能翻译键验证', () => {
    const requiredSections = [
      'common',
      'navigation', 
      'home',
      'drawConfig',
      'quickConfig',
      'drawingModes',
      'quickConfigTemplates',
      'experienceTemplates'
    ]

    requiredSections.forEach(section => {
      it(`应该包含${section}部分的翻译`, () => {
        expect(zhTranslations[section]).toBeDefined()
        expect(enTranslations[section]).toBeDefined()
        expect(typeof zhTranslations[section]).toBe('object')
        expect(typeof enTranslations[section]).toBe('object')
      })
    })

    it('drawConfig部分应该包含必要的键', () => {
      const requiredDrawConfigKeys = [
        'title',
        'quickConfigTab',
        'detailedConfig',
        'startDraw',
        'configurationSettings'
      ]

      requiredDrawConfigKeys.forEach(key => {
        expect(zhTranslations.drawConfig[key]).toBeDefined()
        expect(enTranslations.drawConfig[key]).toBeDefined()
        expect(typeof zhTranslations.drawConfig[key]).toBe('string')
        expect(typeof enTranslations.drawConfig[key]).toBe('string')
      })
    })

    it('quickConfig部分应该包含必要的键', () => {
      const requiredQuickConfigKeys = [
        'title',
        'description',
        'smartRecommendations',
        'frequentConfigs',
        'allTemplates'
      ]

      requiredQuickConfigKeys.forEach(key => {
        expect(zhTranslations.quickConfig[key]).toBeDefined()
        expect(enTranslations.quickConfig[key]).toBeDefined()
        expect(typeof zhTranslations.quickConfig[key]).toBe('string')
        expect(typeof enTranslations.quickConfig[key]).toBe('string')
      })
    })

    it('drawingModes部分应该包含所有抽奖模式', () => {
      const requiredModes = [
        'slotMachine',
        'cardFlip', 
        'bulletScreen',
        'gridLottery',
        'blinkingNamePicker'
      ]

      requiredModes.forEach(mode => {
        expect(zhTranslations.drawingModes[mode]).toBeDefined()
        expect(enTranslations.drawingModes[mode]).toBeDefined()
        
        // 每个模式应该有标题和描述
        expect(zhTranslations.drawingModes[mode].shortTitle || zhTranslations.drawingModes[mode].title).toBeDefined()
        expect(enTranslations.drawingModes[mode].shortTitle || enTranslations.drawingModes[mode].title).toBeDefined()
        expect(zhTranslations.drawingModes[mode].description).toBeDefined()
        expect(enTranslations.drawingModes[mode].description).toBeDefined()
      })
    })
  })

  describe('翻译值质量验证', () => {
    it('翻译值不应该为空字符串', () => {
      const zhKeys = getAllTranslationKeys(zhTranslations)
      const enKeys = getAllTranslationKeys(enTranslations)
      
      const emptyZhKeys = zhKeys.filter(key => {
        const value = getNestedValue(zhTranslations, key)
        return typeof value === 'string' && value.trim() === ''
      })
      
      const emptyEnKeys = enKeys.filter(key => {
        const value = getNestedValue(enTranslations, key)
        return typeof value === 'string' && value.trim() === ''
      })
      
      if (emptyZhKeys.length > 0) {
        console.warn('Empty values in zh.json:', emptyZhKeys)
      }
      
      if (emptyEnKeys.length > 0) {
        console.warn('Empty values in en.json:', emptyEnKeys)
      }
      
      expect(emptyZhKeys).toHaveLength(0)
      expect(emptyEnKeys).toHaveLength(0)
    })

    it('翻译值不应该等于键名（避免未翻译的情况）', () => {
      const zhKeys = getAllTranslationKeys(zhTranslations)
      
      const untranslatedKeys = zhKeys.filter(key => {
        const value = getNestedValue(zhTranslations, key)
        return typeof value === 'string' && value === key
      })
      
      if (untranslatedKeys.length > 0) {
        console.warn('Potentially untranslated keys in zh.json:', untranslatedKeys)
      }
      
      expect(untranslatedKeys).toHaveLength(0)
    })

    it('参数化翻译应该有正确的格式', () => {
      const zhKeys = getAllTranslationKeys(zhTranslations)
      
      const invalidParamKeys = zhKeys.filter(key => {
        const value = getNestedValue(zhTranslations, key)
        if (typeof value !== 'string') return false
        
        // 检查是否有未闭合的参数
        const openBraces = (value.match(/\{\{/g) || []).length
        const closeBraces = (value.match(/\}\}/g) || []).length
        
        return openBraces !== closeBraces
      })
      
      if (invalidParamKeys.length > 0) {
        console.warn('Invalid parameter format in zh.json:', invalidParamKeys)
      }
      
      expect(invalidParamKeys).toHaveLength(0)
    })
  })
})

// 辅助函数
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : undefined
  }, obj)
}