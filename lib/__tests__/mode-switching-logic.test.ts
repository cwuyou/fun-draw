import { describe, it, expect } from 'vitest'
import { getModeSpecificConfig } from '../mode-config'
import type { DrawingMode } from '@/types'

describe('Mode Switching Logic', () => {
  const mockItems = [
    { id: '1', name: '项目1' },
    { id: '2', name: '项目2' },
    { id: '3', name: '项目3' },
    { id: '4', name: '项目4' },
    { id: '5', name: '项目5' }
  ]

  describe('Grid Lottery Mode Configuration', () => {
    it('should return non-editable quantity config for grid-lottery', () => {
      const config = getModeSpecificConfig('grid-lottery', mockItems.length, false)
      
      expect(config.showQuantityInput).toBe(false)
      expect(config.quantityValue).toBe(1)
      expect(config.quantityEditable).toBe(false)
      expect(config.description).toBe('多宫格抽奖每次只能抽取1个项目')
      expect(config.helpText).toBe('多宫格模式通过灯光跳转定格的方式选择单个获奖者')
    })

    it('should return same config regardless of allowRepeat setting for grid-lottery', () => {
      const configNoRepeat = getModeSpecificConfig('grid-lottery', mockItems.length, false)
      const configWithRepeat = getModeSpecificConfig('grid-lottery', mockItems.length, true)
      
      expect(configNoRepeat).toEqual(configWithRepeat)
    })

    it('should return same config regardless of item count for grid-lottery', () => {
      const configFewItems = getModeSpecificConfig('grid-lottery', 3, false)
      const configManyItems = getModeSpecificConfig('grid-lottery', 20, false)
      
      expect(configFewItems.quantityValue).toBe(1)
      expect(configManyItems.quantityValue).toBe(1)
      expect(configFewItems.quantityEditable).toBe(false)
      expect(configManyItems.quantityEditable).toBe(false)
    })
  })

  describe('Other Modes Configuration', () => {
    const otherModes: DrawingMode[] = [
      'card-flip',
      'slot-machine', 
      'bullet-screen',
      'blinking-name-picker'
    ]

    otherModes.forEach(mode => {
      it(`should return editable quantity config for ${mode}`, () => {
        const config = getModeSpecificConfig(mode, mockItems.length, false)
        
        expect(config.showQuantityInput).toBe(true)
        expect(config.quantityValue).toBe('auto')
        expect(config.quantityEditable).toBe(true)
      })
    })
  })

  describe('Mode Switching Scenarios', () => {
    it('should handle switching from grid-lottery to other modes', () => {
      // First get grid-lottery config
      const gridConfig = getModeSpecificConfig('grid-lottery', mockItems.length, false)
      expect(gridConfig.quantityEditable).toBe(false)
      
      // Then switch to card-flip
      const cardConfig = getModeSpecificConfig('card-flip', mockItems.length, false)
      expect(cardConfig.quantityEditable).toBe(true)
      expect(cardConfig.showQuantityInput).toBe(true)
    })

    it('should handle switching from other modes to grid-lottery', () => {
      // First get card-flip config
      const cardConfig = getModeSpecificConfig('card-flip', mockItems.length, false)
      expect(cardConfig.quantityEditable).toBe(true)
      
      // Then switch to grid-lottery
      const gridConfig = getModeSpecificConfig('grid-lottery', mockItems.length, false)
      expect(gridConfig.quantityEditable).toBe(false)
      expect(gridConfig.quantityValue).toBe(1)
    })
  })

  describe('Configuration Consistency', () => {
    it('should maintain consistent behavior across different item counts', () => {
      const itemCounts = [1, 5, 10, 15, 20]
      
      itemCounts.forEach(count => {
        const config = getModeSpecificConfig('grid-lottery', count, false)
        expect(config.quantityValue).toBe(1)
        expect(config.quantityEditable).toBe(false)
        expect(config.showQuantityInput).toBe(false)
      })
    })

    it('should provide appropriate descriptions for each mode', () => {
      const modes: DrawingMode[] = [
        'grid-lottery',
        'card-flip',
        'slot-machine',
        'bullet-screen',
        'blinking-name-picker'
      ]

      modes.forEach(mode => {
        const config = getModeSpecificConfig(mode, mockItems.length, false)
        expect(config.description).toBeTruthy()
        expect(typeof config.description).toBe('string')
        expect(config.description.length).toBeGreaterThan(0)
      })
    })
  })
  })

  describe('Task 8: 编写单元测试 - 模式切换时的自动配置逻辑', () => {
    it('should automatically configure quantity to 1 when switching to grid-lottery', () => {
      // 测试从其他模式切换到多宫格模式时的自动配置
      const cardConfig = getModeSpecificConfig('card-flip', mockItems.length, false)
      expect(cardConfig.quantityEditable).toBe(true)
      
      // 切换到多宫格模式
      const gridConfig = getModeSpecificConfig('grid-lottery', mockItems.length, false)
      expect(gridConfig.quantityValue).toBe(1)
      expect(gridConfig.quantityEditable).toBe(false)
      expect(gridConfig.showQuantityInput).toBe(false)
    })

    it('should maintain fixed quantity=1 regardless of parameters in grid-lottery', () => {
      const testScenarios = [
        { itemCount: 1, allowRepeat: false },
        { itemCount: 6, allowRepeat: false },
        { itemCount: 9, allowRepeat: true },
        { itemCount: 15, allowRepeat: false },
        { itemCount: 100, allowRepeat: true }
      ]

      testScenarios.forEach(({ itemCount, allowRepeat }) => {
        const config = getModeSpecificConfig('grid-lottery', itemCount, allowRepeat)
        expect(config.quantityValue).toBe(1)
        expect(config.quantityEditable).toBe(false)
        expect(config.showQuantityInput).toBe(false)
        expect(config.description).toBe('多宫格抽奖每次只能抽取1个项目')
      })
    })

    it('should reset to editable quantity when switching from grid-lottery to other modes', () => {
      // 先获取多宫格配置
      const gridConfig = getModeSpecificConfig('grid-lottery', mockItems.length, false)
      expect(gridConfig.quantityEditable).toBe(false)
      
      // 切换到其他模式应该恢复可编辑状态
      const modes: DrawingMode[] = ['card-flip', 'slot-machine', 'bullet-screen']
      modes.forEach(mode => {
        const config = getModeSpecificConfig(mode, mockItems.length, false)
        expect(config.quantityEditable).toBe(true)
        expect(config.showQuantityInput).toBe(true)
        expect(config.quantityValue).toBe('auto')
      })
    })
  })
})