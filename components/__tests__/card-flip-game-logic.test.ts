import { describe, it, expect, vi, beforeEach } from 'vitest'
import { 
  validateGameConfig, 
  validateItems, 
  validatePositionCalculation,
  validateCompleteGameSetup 
} from '@/lib/card-game-validation'
import { ListItem } from '@/types'

// Mock data for testing
const mockItems: ListItem[] = [
  { id: '1', name: '项目1' },
  { id: '2', name: '项目2' },
  { id: '3', name: '项目3' },
  { id: '4', name: '项目4' },
  { id: '5', name: '项目5' }
]

describe('Card Flip Game Logic Tests', () => {
  describe('Quantity Logic Tests', () => {
    it('should validate that actualQuantity equals configured quantity when valid', () => {
      const result = validateGameConfig({
        quantity: 3,
        itemCount: 5,
        allowRepeat: false
      })
      
      expect(result.isValid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should reject quantity less than 1', () => {
      const result = validateGameConfig({
        quantity: 0,
        itemCount: 5,
        allowRepeat: false
      })
      
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Quantity must be at least 1')
    })

    it('should reject quantity greater than maximum allowed', () => {
      const result = validateGameConfig({
        quantity: 15,
        itemCount: 20,
        allowRepeat: true,
        maxCards: 10
      })
      
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Quantity exceeds maximum allowed')
    })

    it('should reject quantity exceeding items when repeat is disabled', () => {
      const result = validateGameConfig({
        quantity: 6,
        itemCount: 5,
        allowRepeat: false
      })
      
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Quantity exceeds available items when repeat is disabled')
    })

    it('should allow quantity exceeding items when repeat is enabled', () => {
      const result = validateGameConfig({
        quantity: 6,
        itemCount: 5,
        allowRepeat: true
      })
      
      expect(result.isValid).toBe(true)
    })

    it('should provide warning when all items will be selected', () => {
      const result = validateGameConfig({
        quantity: 5,
        itemCount: 5,
        allowRepeat: false
      })
      
      expect(result.isValid).toBe(true)
      expect(result.warnings).toContain('All items will be selected as winners')
    })

    it('should provide warning for high probability of duplicates', () => {
      const result = validateGameConfig({
        quantity: 8,
        itemCount: 10,
        allowRepeat: true
      })
      
      expect(result.isValid).toBe(true)
      expect(result.warnings).toContain('High probability of duplicate winners')
    })
  })

  describe('Winner Selection Tests', () => {
    // Mock winner selection function for testing
    const selectWinners = (items: ListItem[], quantity: number, allowRepeat: boolean): ListItem[] => {
      if (!Array.isArray(items) || items.length === 0) {
        throw new Error('项目列表为空')
      }
      
      if (!Number.isInteger(quantity) || quantity <= 0) {
        throw new Error('抽取数量必须是大于0的整数')
      }
      
      if (!allowRepeat && quantity > items.length) {
        throw new Error('在不允许重复的情况下，抽取数量不能超过项目总数')
      }

      const winners: ListItem[] = []
      const availableItems = [...items]
      
      for (let i = 0; i < quantity; i++) {
        if (availableItems.length === 0) break
        
        const randomIndex = Math.floor(Math.random() * availableItems.length)
        const winner = availableItems[randomIndex]
        winners.push(winner)
        
        if (!allowRepeat) {
          availableItems.splice(randomIndex, 1)
        }
      }
      
      return winners
    }

    it('should select exactly the configured quantity of winners', () => {
      const winners = selectWinners(mockItems, 3, false)
      expect(winners).toHaveLength(3)
    })

    it('should select exactly 1 winner when quantity is 1', () => {
      const winners = selectWinners(mockItems, 1, false)
      expect(winners).toHaveLength(1)
    })

    it('should select unique winners when allowRepeat is false', () => {
      const winners = selectWinners(mockItems, 3, false)
      const uniqueIds = new Set(winners.map(w => w.id))
      expect(uniqueIds.size).toBe(3)
    })

    it('should allow duplicate winners when allowRepeat is true', () => {
      // Run multiple times to increase chance of duplicates
      let foundDuplicate = false
      for (let i = 0; i < 50; i++) {
        const winners = selectWinners(mockItems.slice(0, 2), 4, true)
        const uniqueIds = new Set(winners.map(w => w.id))
        if (uniqueIds.size < winners.length) {
          foundDuplicate = true
          break
        }
      }
      // Note: This test might occasionally fail due to randomness, but should pass most of the time
      expect(foundDuplicate).toBe(true)
    })

    it('should throw error for empty items list', () => {
      expect(() => selectWinners([], 1, false)).toThrow('项目列表为空')
    })

    it('should throw error for invalid quantity', () => {
      expect(() => selectWinners(mockItems, 0, false)).toThrow('抽取数量必须是大于0的整数')
      expect(() => selectWinners(mockItems, -1, false)).toThrow('抽取数量必须是大于0的整数')
    })

    it('should throw error when quantity exceeds items and repeat is disabled', () => {
      expect(() => selectWinners(mockItems, 6, false)).toThrow('在不允许重复的情况下，抽取数量不能超过项目总数')
    })
  })

  describe('Items Validation Tests', () => {
    it('should validate correct items list', () => {
      const result = validateItems(mockItems)
      expect(result.isValid).toBe(true)
    })

    it('should reject non-array items', () => {
      const result = validateItems('not an array' as any)
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Items must be an array')
    })

    it('should reject empty items list', () => {
      const result = validateItems([])
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Item list cannot be empty')
    })

    it('should reject items with invalid format', () => {
      const invalidItems = [
        { id: '1', name: 'Valid Item' },
        { id: '2', name: '' }, // Empty name
        { id: '3' }, // Missing name
        null // Null item
      ] as ListItem[]

      const result = validateItems(invalidItems)
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('invalid items with empty or missing names')
    })

    it('should warn about duplicate item names', () => {
      const duplicateItems: ListItem[] = [
        { id: '1', name: '重复项目' },
        { id: '2', name: '正常项目' },
        { id: '3', name: '重复项目' }
      ]

      const result = validateItems(duplicateItems)
      expect(result.isValid).toBe(true)
      expect(result.warnings).toContain('Found duplicate item names: 重复项目')
    })
  })

  describe('Card Positioning Tests', () => {
    it('should validate position calculation for valid card count', () => {
      const result = validatePositionCalculation({
        totalCards: 5,
        containerWidth: 1024,
        containerHeight: 768,
        deviceType: 'desktop'
      })
      
      expect(result.isValid).toBe(true)
    })

    it('should reject invalid card count', () => {
      const result = validatePositionCalculation({
        totalCards: 0,
        containerWidth: 1024,
        containerHeight: 768,
        deviceType: 'desktop'
      })
      
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Invalid card count for position calculation')
    })

    it('should reject too many cards', () => {
      const result = validatePositionCalculation({
        totalCards: 25,
        containerWidth: 1024,
        containerHeight: 768,
        deviceType: 'desktop'
      })
      
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Too many cards for optimal display (maximum 20)')
    })

    it('should enforce device-specific card limits', () => {
      // Mobile device with too many cards
      const mobileResult = validatePositionCalculation({
        totalCards: 8,
        containerWidth: 375,
        containerHeight: 667,
        deviceType: 'mobile'
      })
      
      expect(mobileResult.isValid).toBe(false)
      expect(mobileResult.error).toBe('Too many cards for mobile display (maximum 6)')

      // Tablet device with too many cards
      const tabletResult = validatePositionCalculation({
        totalCards: 15,
        containerWidth: 768,
        containerHeight: 1024,
        deviceType: 'tablet'
      })
      
      expect(tabletResult.isValid).toBe(false)
      expect(tabletResult.error).toBe('Too many cards for tablet display (maximum 12)')
    })

    it('should reject container that is too small', () => {
      const result = validatePositionCalculation({
        totalCards: 5,
        containerWidth: 200, // Too small
        containerHeight: 300, // Too small
        deviceType: 'mobile'
      })
      
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Container is too small for the specified number of cards')
    })

    it('should validate appropriate card counts for each device type', () => {
      // Mobile - should accept up to 6 cards
      const mobileResult = validatePositionCalculation({
        totalCards: 4,
        containerWidth: 375,
        containerHeight: 667,
        deviceType: 'mobile'
      })
      expect(mobileResult.isValid).toBe(true)

      // Tablet - should accept up to 12 cards
      const tabletResult = validatePositionCalculation({
        totalCards: 9,
        containerWidth: 768,
        containerHeight: 1024,
        deviceType: 'tablet'
      })
      expect(tabletResult.isValid).toBe(true)

      // Desktop - should accept up to 20 cards
      const desktopResult = validatePositionCalculation({
        totalCards: 15,
        containerWidth: 1920,
        containerHeight: 1080,
        deviceType: 'desktop'
      })
      expect(desktopResult.isValid).toBe(true)
    })
  })

  describe('Complete Game Setup Validation Tests', () => {
    it('should validate complete valid game setup', () => {
      const result = validateCompleteGameSetup(
        mockItems,
        3,
        false,
        true,
        { width: 1024, height: 768 }
      )
      
      expect(result.isValid).toBe(true)
    })

    it('should reject setup with invalid items', () => {
      const result = validateCompleteGameSetup(
        [],
        3,
        false,
        true,
        { width: 1024, height: 768 }
      )
      
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Item list cannot be empty')
    })

    it('should reject setup with invalid quantity configuration', () => {
      const result = validateCompleteGameSetup(
        mockItems,
        6, // More than available items
        false, // No repeat allowed
        true,
        { width: 1024, height: 768 }
      )
      
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Quantity exceeds available items when repeat is disabled')
    })

    it('should collect warnings from all validation steps', () => {
      const duplicateItems: ListItem[] = [
        { id: '1', name: '重复项目' },
        { id: '2', name: '正常项目' },
        { id: '3', name: '重复项目' },
        { id: '4', name: '另一个项目' },
        { id: '5', name: '最后项目' }
      ]

      const result = validateCompleteGameSetup(
        duplicateItems,
        5, // All items selected
        false,
        true,
        { width: 1024, height: 768 }
      )
      
      expect(result.isValid).toBe(true)
      expect(result.warnings).toContain('Found duplicate item names: 重复项目')
      expect(result.warnings).toContain('All items will be selected as winners')
    })
  })
})