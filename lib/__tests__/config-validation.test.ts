import { describe, it, expect } from 'vitest'
import { validateModeConfig, getModeSpecificConfig, getMaxQuantityForMode } from '../mode-config'
import type { DrawingConfig, ListItem, DrawingMode } from '@/types'

describe('Configuration Validation', () => {
  const mockItems: ListItem[] = Array.from({ length: 10 }, (_, i) => ({
    id: `${i + 1}`,
    name: `项目${i + 1}`
  }))

  describe('Grid Lottery Validation', () => {
    it('should validate correct grid-lottery configuration', () => {
      const config: DrawingConfig = {
        mode: 'grid-lottery',
        quantity: 1,
        allowRepeat: false,
        items: mockItems
      }

      const result = validateModeConfig(config)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject grid-lottery with quantity > 1', () => {
      const config: DrawingConfig = {
        mode: 'grid-lottery',
        quantity: 2,
        allowRepeat: false,
        items: mockItems
      }

      const result = validateModeConfig(config)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('多宫格抽奖模式只能抽取1个项目')
      expect(result.correctedConfig?.quantity).toBe(1)
    })

    it('should provide warnings for non-optimal item counts', () => {
      const manyItems: ListItem[] = Array.from({ length: 20 }, (_, i) => ({
        id: `${i + 1}`,
        name: `项目${i + 1}`
      }))

      const config: DrawingConfig = {
        mode: 'grid-lottery',
        quantity: 1,
        allowRepeat: false,
        items: manyItems
      }

      const result = validateModeConfig(config)
      expect(result.isValid).toBe(true)
      expect(result.warnings).toContain('多宫格模式建议项目数量为6、9、12或15个以获得最佳布局效果')
    })

    it('should handle small item counts correctly', () => {
      const fewItems: ListItem[] = [
        { id: '1', name: '项目1' },
        { id: '2', name: '项目2' },
        { id: '3', name: '项目3' }
      ]

      const config: DrawingConfig = {
        mode: 'grid-lottery',
        quantity: 1,
        allowRepeat: false,
        items: fewItems
      }

      const result = validateModeConfig(config)
      expect(result.isValid).toBe(true)
      // Should not have warnings for small counts as they can work with repeat enabled
    })

    it('should validate grid-lottery with repeat enabled', () => {
      const fewItems: ListItem[] = [
        { id: '1', name: '项目1' },
        { id: '2', name: '项目2' }
      ]

      const config: DrawingConfig = {
        mode: 'grid-lottery',
        quantity: 1,
        allowRepeat: true,
        items: fewItems
      }

      const result = validateModeConfig(config)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
  })

  describe('Other Modes Validation', () => {
    it('should validate card-flip mode correctly', () => {
      const config: DrawingConfig = {
        mode: 'card-flip',
        quantity: 3,
        allowRepeat: false,
        items: mockItems
      }

      const result = validateModeConfig(config)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject card-flip with excessive quantity', () => {
      const config: DrawingConfig = {
        mode: 'card-flip',
        quantity: 15,
        allowRepeat: true,
        items: mockItems
      }

      const result = validateModeConfig(config)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('卡牌模式最多10个，当前设置15个超出限制')
    })

    it('should validate slot-machine mode correctly', () => {
      const config: DrawingConfig = {
        mode: 'slot-machine',
        quantity: 5,
        allowRepeat: false,
        items: mockItems
      }

      const result = validateModeConfig(config)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
  })

  describe('General Validation Rules', () => {
    it('should reject empty item list', () => {
      const config: DrawingConfig = {
        mode: 'grid-lottery',
        quantity: 1,
        allowRepeat: false,
        items: []
      }

      const result = validateModeConfig(config)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('项目列表不能为空')
    })

    it('should reject quantity less than 1', () => {
      const config: DrawingConfig = {
        mode: 'card-flip',
        quantity: 0,
        allowRepeat: false,
        items: mockItems
      }

      const result = validateModeConfig(config)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('抽取数量必须大于0')
    })

    it('should reject quantity exceeding items when repeat not allowed', () => {
      const fewItems: ListItem[] = [
        { id: '1', name: '项目1' },
        { id: '2', name: '项目2' }
      ]

      const config: DrawingConfig = {
        mode: 'card-flip',
        quantity: 5,
        allowRepeat: false,
        items: fewItems
      }

      const result = validateModeConfig(config)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('在不允许重复的情况下，抽取数量不能超过项目总数')
    })
  })

  describe('Configuration Correction', () => {
    it('should provide corrected configuration for invalid quantity', () => {
      const config: DrawingConfig = {
        mode: 'card-flip',
        quantity: 15,
        allowRepeat: true,
        items: mockItems
      }

      const result = validateModeConfig(config)
      expect(result.isValid).toBe(false)
      expect(result.correctedConfig).toBeDefined()
      expect(result.correctedConfig?.quantity).toBe(10) // Max for card-flip
    })

    it('should provide corrected configuration for grid-lottery', () => {
      const config: DrawingConfig = {
        mode: 'grid-lottery',
        quantity: 5,
        allowRepeat: false,
        items: mockItems
      }

      const result = validateModeConfig(config)
      expect(result.isValid).toBe(false)
      expect(result.correctedConfig).toBeDefined()
      expect(result.correctedConfig?.quantity).toBe(1)
    })
  })

  describe('Task 8: 编写单元测试 - 验证数量输入框在不同模式下的状态', () => {
    it('should hide quantity input for grid-lottery mode', () => {
      const config = getModeSpecificConfig('grid-lottery', mockItems.length, false)
      
      expect(config.showQuantityInput).toBe(false)
      expect(config.quantityEditable).toBe(false)
      expect(config.quantityValue).toBe(1)
      expect(config.description).toBe('多宫格抽奖每次只能抽取1个项目')
      expect(config.helpText).toBe('多宫格模式通过灯光跳转定格的方式选择单个获奖者')
    })

    it('should show editable quantity input for other modes', () => {
      const modes: DrawingMode[] = [
        'card-flip',
        'slot-machine', 
        'bullet-screen',
        'blinking-name-picker'
      ]

      modes.forEach(mode => {
        const config = getModeSpecificConfig(mode, mockItems.length, false)
        expect(config.showQuantityInput).toBe(true)
        expect(config.quantityEditable).toBe(true)
        expect(config.quantityValue).toBe('auto')
        expect(typeof config.description).toBe('string')
        expect(config.description.length).toBeGreaterThan(0)
      })
    })

    it('should return correct max quantity limits for different modes', () => {
      // 多宫格模式始终返回1
      expect(getMaxQuantityForMode('grid-lottery', false, 5)).toBe(1)
      expect(getMaxQuantityForMode('grid-lottery', true, 100)).toBe(1)
      
      // 其他模式根据配置返回不同限制
      expect(getMaxQuantityForMode('card-flip', false, 5)).toBe(5)
      expect(getMaxQuantityForMode('card-flip', true, 5)).toBe(10)
      expect(getMaxQuantityForMode('slot-machine', false, 15)).toBe(12)
      expect(getMaxQuantityForMode('bullet-screen', true, 10)).toBe(20)
    })

    it('should provide appropriate UI state descriptions', () => {
      const gridConfig = getModeSpecificConfig('grid-lottery', mockItems.length, false)
      expect(gridConfig.description).toContain('多宫格抽奖')
      expect(gridConfig.description).toContain('1个项目')
      expect(gridConfig.helpText).toContain('灯光跳转定格')

      const cardConfig = getModeSpecificConfig('card-flip', mockItems.length, false)
      expect(cardConfig.description).toContain('卡牌模式')
      expect(cardConfig.helpText).toContain('卡牌布局限制')
    })
  })})
