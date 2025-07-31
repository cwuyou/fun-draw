import { describe, it, expect } from 'vitest'
import { 
  getModeSpecificConfig, 
  getModeConfiguration, 
  getMaxQuantityForMode, 
  getQuantityLimitDescription, 
  validateModeConfig 
} from '../mode-config'
import type { DrawingConfig, ListItem } from '@/types'

// Mock data
const mockItems: ListItem[] = [
  { id: '1', name: '项目1' },
  { id: '2', name: '项目2' },
  { id: '3', name: '项目3' },
  { id: '4', name: '项目4' },
  { id: '5', name: '项目5' },
]

describe('mode-config', () => {
  describe('getModeSpecificConfig', () => {
    it('should return correct config for grid-lottery mode', () => {
      const config = getModeSpecificConfig('grid-lottery', 10, false)
      
      expect(config.showQuantityInput).toBe(false)
      expect(config.quantityValue).toBe(1)
      expect(config.quantityEditable).toBe(false)
      expect(config.description).toBe('多宫格抽奖每次只能抽取1个项目')
      expect(config.helpText).toBe('多宫格模式通过灯光跳转定格的方式选择单个获奖者')
    })

    it('should return correct config for card-flip mode', () => {
      const config = getModeSpecificConfig('card-flip', 10, false)
      
      expect(config.showQuantityInput).toBe(true)
      expect(config.quantityValue).toBe('auto')
      expect(config.quantityEditable).toBe(true)
      expect(config.description).toBe('卡牌模式最多10个')
    })

    it('should return correct config for slot-machine mode', () => {
      const config = getModeSpecificConfig('slot-machine', 10, false)
      
      expect(config.showQuantityInput).toBe(true)
      expect(config.quantityValue).toBe('auto')
      expect(config.quantityEditable).toBe(true)
      expect(config.description).toBe('老虎机模式最多12个滚轮')
    })
  })

  describe('getModeConfiguration', () => {
    it('should return correct configuration for grid-lottery', () => {
      const config = getModeConfiguration('grid-lottery')
      
      expect(config.mode).toBe('grid-lottery')
      expect(config.quantityConfig.fixed).toBe(true)
      expect(config.quantityConfig.value).toBe(1)
      expect(config.quantityConfig.min).toBe(1)
      expect(config.quantityConfig.max).toBe(1)
      expect(config.uiConfig.showQuantityInput).toBe(false)
      expect(config.uiConfig.quantityEditable).toBe(false)
    })

    it('should return correct configuration for card-flip', () => {
      const config = getModeConfiguration('card-flip')
      
      expect(config.mode).toBe('card-flip')
      expect(config.quantityConfig.fixed).toBe(false)
      expect(config.quantityConfig.min).toBe(1)
      expect(config.quantityConfig.max).toBe(10)
      expect(config.uiConfig.showQuantityInput).toBe(true)
      expect(config.uiConfig.quantityEditable).toBe(true)
    })
  })

  describe('getMaxQuantityForMode', () => {
    it('should return 1 for grid-lottery mode regardless of other parameters', () => {
      expect(getMaxQuantityForMode('grid-lottery', false, 10)).toBe(1)
      expect(getMaxQuantityForMode('grid-lottery', true, 10)).toBe(1)
      expect(getMaxQuantityForMode('grid-lottery', false, 100)).toBe(1)
    })

    it('should return correct max for card-flip mode', () => {
      expect(getMaxQuantityForMode('card-flip', false, 5)).toBe(5)
      expect(getMaxQuantityForMode('card-flip', false, 15)).toBe(10)
      expect(getMaxQuantityForMode('card-flip', true, 5)).toBe(10)
    })

    it('should return correct max for slot-machine mode', () => {
      expect(getMaxQuantityForMode('slot-machine', false, 5)).toBe(5)
      expect(getMaxQuantityForMode('slot-machine', false, 15)).toBe(12)
      expect(getMaxQuantityForMode('slot-machine', true, 5)).toBe(12)
    })

    it('should return correct max for bullet-screen mode', () => {
      expect(getMaxQuantityForMode('bullet-screen', false, 10)).toBe(10)
      expect(getMaxQuantityForMode('bullet-screen', false, 25)).toBe(20)
      expect(getMaxQuantityForMode('bullet-screen', true, 10)).toBe(20)
    })
  })

  describe('getQuantityLimitDescription', () => {
    it('should return correct description for grid-lottery', () => {
      const description = getQuantityLimitDescription('grid-lottery', false, 10)
      expect(description).toBe('多宫格抽奖每次只能抽取1个项目')
    })

    it('should return correct description for card-flip', () => {
      const description = getQuantityLimitDescription('card-flip', false, 5)
      expect(description).toBe('卡牌模式最多10个（最多5个）')
    })

    it('should return correct description for slot-machine', () => {
      const description = getQuantityLimitDescription('slot-machine', true, 5)
      expect(description).toBe('老虎机模式最多12个滚轮（最多12个）')
    })
  })

  describe('validateModeConfig', () => {
    it('should validate grid-lottery config correctly', () => {
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

    it('should reject grid-lottery config with quantity > 1', () => {
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

    it('should reject config with quantity < 1', () => {
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

    it('should reject config with empty items', () => {
      const config: DrawingConfig = {
        mode: 'card-flip',
        quantity: 1,
        allowRepeat: false,
        items: []
      }
      
      const result = validateModeConfig(config)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('项目列表不能为空')
    })

    it('should reject config with quantity > items when repeat not allowed', () => {
      const config: DrawingConfig = {
        mode: 'card-flip',
        quantity: 10,
        allowRepeat: false,
        items: mockItems
      }
      
      const result = validateModeConfig(config)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('在不允许重复的情况下，抽取数量不能超过项目总数')
    })

    it('should reject config with quantity exceeding mode limit', () => {
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

    it('should provide warnings for grid-lottery with non-optimal item count', () => {
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

    it('should validate valid card-flip config', () => {
      const config: DrawingConfig = {
        mode: 'card-flip',
        quantity: 3,
        allowRepeat: false,
        items: mockItems
      }
      
      const result = validateModeConfig(config)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.warnings).toHaveLength(0)
    })
  })
})