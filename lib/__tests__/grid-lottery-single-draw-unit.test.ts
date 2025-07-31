import { describe, it, expect, vi, beforeEach } from 'vitest'
import { 
  getModeSpecificConfig, 
  validateModeConfig, 
  getMaxQuantityForMode,
  getModeConfiguration 
} from '../mode-config'
import type { DrawingConfig, ListItem, DrawingMode } from '@/types'

describe('Grid Lottery Single Draw - Unit Tests', () => {
  // Mock data
  const mockItems: ListItem[] = [
    { id: '1', name: '项目1' },
    { id: '2', name: '项目2' },
    { id: '3', name: '项目3' },
    { id: '4', name: '项目4' },
    { id: '5', name: '项目5' },
    { id: '6', name: '项目6' },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('模式切换时的自动配置逻辑', () => {
    it('should automatically set quantity to 1 when switching to grid-lottery mode', () => {
      const config = getModeSpecificConfig('grid-lottery', mockItems.length, false)
      
      expect(config.quantityValue).toBe(1)
      expect(config.quantityEditable).toBe(false)
      expect(config.showQuantityInput).toBe(false)
    })

    it('should maintain quantity=1 regardless of item count in grid-lottery mode', () => {
      const scenarios = [
        { itemCount: 1, allowRepeat: false },
        { itemCount: 6, allowRepeat: false },
        { itemCount: 15, allowRepeat: false },
        { itemCount: 20, allowRepeat: true },
      ]

      scenarios.forEach(({ itemCount, allowRepeat }) => {
        const config = getModeSpecificConfig('grid-lottery', itemCount, allowRepeat)
        expect(config.quantityValue).toBe(1)
        expect(config.quantityEditable).toBe(false)
      })
    })

    it('should maintain quantity=1 regardless of allowRepeat setting in grid-lottery mode', () => {
      const configNoRepeat = getModeSpecificConfig('grid-lottery', mockItems.length, false)
      const configWithRepeat = getModeSpecificConfig('grid-lottery', mockItems.length, true)
      
      expect(configNoRepeat.quantityValue).toBe(1)
      expect(configWithRepeat.quantityValue).toBe(1)
      expect(configNoRepeat.quantityEditable).toBe(false)
      expect(configWithRepeat.quantityEditable).toBe(false)
    })

    it('should return different configs when switching from grid-lottery to other modes', () => {
      const gridConfig = getModeSpecificConfig('grid-lottery', mockItems.length, false)
      const cardConfig = getModeSpecificConfig('card-flip', mockItems.length, false)
      
      expect(gridConfig.quantityEditable).toBe(false)
      expect(gridConfig.quantityValue).toBe(1)
      
      expect(cardConfig.quantityEditable).toBe(true)
      expect(cardConfig.quantityValue).toBe('auto')
      expect(cardConfig.showQuantityInput).toBe(true)
    })

    it('should return different configs when switching from other modes to grid-lottery', () => {
      const slotConfig = getModeSpecificConfig('slot-machine', mockItems.length, false)
      const gridConfig = getModeSpecificConfig('grid-lottery', mockItems.length, false)
      
      expect(slotConfig.quantityEditable).toBe(true)
      expect(slotConfig.showQuantityInput).toBe(true)
      
      expect(gridConfig.quantityEditable).toBe(false)
      expect(gridConfig.quantityValue).toBe(1)
      expect(gridConfig.showQuantityInput).toBe(false)
    })

    it('should provide consistent configuration across multiple calls for grid-lottery', () => {
      const config1 = getModeSpecificConfig('grid-lottery', mockItems.length, false)
      const config2 = getModeSpecificConfig('grid-lottery', mockItems.length, false)
      
      expect(config1).toEqual(config2)
    })
  })
})