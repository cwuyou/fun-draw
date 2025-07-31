import { describe, it, expect } from 'vitest'
import { validateModeConfig, getModeSpecificConfig } from '../mode-config'
import type { DrawingConfig, ListItem } from '@/types'

describe('Task 8: 编写单元测试 - 测试配置验证和错误处理逻辑', () => {
  const mockItems: ListItem[] = [
    { id: '1', name: '项目1' },
    { id: '2', name: '项目2' },
    { id: '3', name: '项目3' },
    { id: '4', name: '项目4' },
    { id: '5', name: '项目5' },
    { id: '6', name: '项目6' },
  ]

  describe('Grid Lottery Configuration Validation', () => {
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
      expect(result.warnings).toHaveLength(0)
    })

    it('should reject grid-lottery configuration with quantity > 1', () => {
      const config: DrawingConfig = {
        mode: 'grid-lottery',
        quantity: 3,
        allowRepeat: false,
        items: mockItems
      }

      const result = validateModeConfig(config)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('多宫格抽奖模式只能抽取1个项目')
      expect(result.correctedConfig?.quantity).toBe(1)
    })

    it('should reject configuration with quantity < 1', () => {
      const config: DrawingConfig = {
        mode: 'grid-lottery',
        quantity: 0,
        allowRepeat: false,
        items: mockItems
      }

      const result = validateModeConfig(config)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('抽取数量必须大于0')
    })

    it('should reject configuration with empty items list', () => {
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

    it('should provide warnings for non-optimal grid sizes', () => {
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

    it('should handle edge case with single item', () => {
      const singleItem: ListItem[] = [{ id: '1', name: '项目1' }]

      const config: DrawingConfig = {
        mode: 'grid-lottery',
        quantity: 1,
        allowRepeat: false,
        items: singleItem
      }

      const result = validateModeConfig(config)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should validate grid-lottery with allowRepeat enabled', () => {
      const config: DrawingConfig = {
        mode: 'grid-lottery',
        quantity: 1,
        allowRepeat: true,
        items: mockItems
      }

      const result = validateModeConfig(config)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should provide corrected configuration for invalid quantity', () => {
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

    it('should handle multiple validation errors', () => {
      const config: DrawingConfig = {
        mode: 'grid-lottery',
        quantity: 0,
        allowRepeat: false,
        items: []
      }

      const result = validateModeConfig(config)
      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(1)
      expect(result.errors).toContain('抽取数量必须大于0')
      expect(result.errors).toContain('项目列表不能为空')
    })

    it('should handle negative quantity gracefully', () => {
      const config: DrawingConfig = {
        mode: 'grid-lottery',
        quantity: -1,
        allowRepeat: false,
        items: mockItems
      }

      const result = validateModeConfig(config)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('抽取数量必须大于0')
      expect(result.correctedConfig?.quantity).toBe(1)
    })

    it('should provide meaningful error messages', () => {
      const config: DrawingConfig = {
        mode: 'grid-lottery',
        quantity: 10,
        allowRepeat: false,
        items: mockItems
      }

      const result = validateModeConfig(config)
      expect(result.isValid).toBe(false)
      expect(result.errors[0]).toContain('多宫格抽奖')
      expect(result.errors[0]).toContain('1个项目')
    })
  })

  describe('Error Recovery and Edge Cases', () => {
    it('should handle extremely large item counts', () => {
      const manyItems: ListItem[] = Array.from({ length: 1000 }, (_, i) => ({
        id: `${i + 1}`,
        name: `项目${i + 1}`
      }))

      const config = getModeSpecificConfig('grid-lottery', manyItems.length, false)
      expect(config.quantityValue).toBe(1)
      expect(config.quantityEditable).toBe(false)
    })

    it('should handle zero item count gracefully', () => {
      const config = getModeSpecificConfig('grid-lottery', 0, false)
      expect(config.quantityValue).toBe(1)
      expect(config.quantityEditable).toBe(false)
    })

    it('should maintain consistency across different error scenarios', () => {
      const errorConfigs = [
        { quantity: -5, items: mockItems },
        { quantity: 100, items: mockItems },
        { quantity: 1, items: [] },
        { quantity: 0, items: [] }
      ]

      errorConfigs.forEach(({ quantity, items }) => {
        const config: DrawingConfig = {
          mode: 'grid-lottery',
          quantity,
          allowRepeat: false,
          items
        }

        const result = validateModeConfig(config)
        if (result.correctedConfig?.quantity !== undefined) {
          expect(result.correctedConfig.quantity).toBe(1)
        }
      })
    })
  })

  describe('Comparison with Other Modes', () => {
    it('should validate other modes correctly for comparison', () => {
      const cardConfig: DrawingConfig = {
        mode: 'card-flip',
        quantity: 3,
        allowRepeat: false,
        items: mockItems
      }

      const result = validateModeConfig(cardConfig)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject other modes with excessive quantity', () => {
      const cardConfig: DrawingConfig = {
        mode: 'card-flip',
        quantity: 15,
        allowRepeat: true,
        items: mockItems
      }

      const result = validateModeConfig(cardConfig)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('卡牌模式最多10个，当前设置15个超出限制')
    })

    it('should show different validation behavior between grid-lottery and other modes', () => {
      // Grid lottery with quantity 2 should fail
      const gridConfig: DrawingConfig = {
        mode: 'grid-lottery',
        quantity: 2,
        allowRepeat: false,
        items: mockItems
      }

      const gridResult = validateModeConfig(gridConfig)
      expect(gridResult.isValid).toBe(false)

      // Card flip with quantity 2 should pass
      const cardConfig: DrawingConfig = {
        mode: 'card-flip',
        quantity: 2,
        allowRepeat: false,
        items: mockItems
      }

      const cardResult = validateModeConfig(cardConfig)
      expect(cardResult.isValid).toBe(true)
    })
  })
})