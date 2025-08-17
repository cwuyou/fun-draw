/**
 * 快速翻译检查测试
 * 验证关键翻译键是否存在
 */

describe('快速翻译检查', () => {
  it('应该能够导入翻译验证工具', () => {
    expect(() => {
      const { CRITICAL_TRANSLATION_KEYS } = require('@/lib/translation-validator')
      expect(Array.isArray(CRITICAL_TRANSLATION_KEYS)).toBe(true)
      expect(CRITICAL_TRANSLATION_KEYS.length).toBeGreaterThan(0)
    }).not.toThrow()
  })

  it('应该包含关键的翻译键', () => {
    const { CRITICAL_TRANSLATION_KEYS } = require('@/lib/translation-validator')
    
    const expectedKeys = [
      'drawConfig.quickConfigTab',
      'quickConfig.title',
      'drawingModes.slotMachine.shortTitle'
    ]
    
    expectedKeys.forEach(key => {
      expect(CRITICAL_TRANSLATION_KEYS).toContain(key)
    })
  })

  it('翻译验证函数应该正常工作', () => {
    const { validateTranslationKey } = require('@/lib/translation-validator')
    
    const testTranslations = {
      test: {
        key: 'value'
      }
    }
    
    expect(validateTranslationKey(testTranslations, 'test.key')).toBe(true)
    expect(validateTranslationKey(testTranslations, 'test.nonexistent')).toBe(false)
  })
})