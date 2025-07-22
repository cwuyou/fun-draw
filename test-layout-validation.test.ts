import { describe, it, expect } from 'vitest'
import {
  validatePositionConsistency,
  validateSpacingStandards,
  detectLayoutOverflow,
  validateLayout
} from '@/lib/layout-validator'
import { CardPosition, LayoutConfig } from '@/types'

describe('Layout Validation Functions', () => {
  const mockCardWidth = 120
  const mockCardHeight = 160
  const mockContainerWidth = 800
  const mockContainerHeight = 600

  describe('validatePositionConsistency', () => {
    it('should detect overlapping cards', () => {
      const positions: CardPosition[] = [
        { x: 100, y: 100 },
        { x: 110, y: 110 }, // 重叠
        { x: 300, y: 100 }
      ]

      const result = validatePositionConsistency(
        positions,
        mockContainerWidth,
        mockContainerHeight,
        mockCardWidth,
        mockCardHeight
      )

      expect(result.isValid).toBe(false)
      expect(result.overlappingCards).toHaveLength(1)
      expect(result.overlappingCards[0]).toEqual({ card1: 0, card2: 1 })
      expect(result.errors).toContain('Cards 0 and 1 are overlapping')
    })

    it('should detect out of bounds cards', () => {
      const positions: CardPosition[] = [
        { x: 100, y: 100 },
        { x: 750, y: 100 }, // 超出右边界
        { x: 100, y: 500 }  // 超出下边界
      ]

      const result = validatePositionConsistency(
        positions,
        mockContainerWidth,
        mockContainerHeight,
        mockCardWidth,
        mockCardHeight
      )

      expect(result.isValid).toBe(false)
      expect(result.outOfBoundsCards).toContain(1)
      expect(result.outOfBoundsCards).toContain(2)
      expect(result.errors).toContain('Card 1 is out of bounds at position (750, 100)')
      expect(result.errors).toContain('Card 2 is out of bounds at position (100, 500)')
    })

    it('should validate correct positions', () => {
      const positions: CardPosition[] = [
        { x: 50, y: 50 },
        { x: 200, y: 50 },
        { x: 350, y: 50 }
      ]

      const result = validatePositionConsistency(
        positions,
        mockContainerWidth,
        mockContainerHeight,
        mockCardWidth,
        mockCardHeight
      )

      expect(result.isValid).toBe(true)
      expect(result.overlappingCards).toHaveLength(0)
      expect(result.outOfBoundsCards).toHaveLength(0)
      expect(result.errors).toHaveLength(0)
    })
  })

  describe('validateSpacingStandards', () => {
    it('should detect inconsistent horizontal spacing', () => {
      const positions: CardPosition[] = [
        { x: 0, y: 100 },
        { x: 150, y: 100 },   // 间距30 (150 - 120)
        { x: 320, y: 100 }    // 间距50 (320 - 270)
      ]

      const expectedSpacing = {
        horizontal: 40,
        vertical: 20,
        tolerance: 5,
        baseUnit: 8,
        componentSpacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 },
        containerPadding: { x: 16, y: 16 },
        uiElementSpacing: {
          gameInfo: 16,
          gameStatus: 12,
          startButton: 24,
          warnings: 16,
          resultDisplay: 20,
          cardArea: 32
        }
      }

      const result = validateSpacingStandards(
        positions,
        expectedSpacing,
        mockCardWidth,
        mockCardHeight
      )

      expect(result.isValid).toBe(false)
      expect(result.inconsistentSpacing).toHaveLength(2)
      expect(result.errors).toContain('Horizontal spacing inconsistent between cards 0 and 1')
      expect(result.errors).toContain('Horizontal spacing inconsistent between cards 1 and 2')
    })

    it('should validate correct spacing', () => {
      const positions: CardPosition[] = [
        { x: 0, y: 100 },
        { x: 160, y: 100 },   // 间距40 (160 - 120)
        { x: 320, y: 100 }    // 间距40 (320 - 280)
      ]

      const expectedSpacing = {
        horizontal: 40,
        vertical: 20,
        tolerance: 5,
        baseUnit: 8,
        componentSpacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 },
        containerPadding: { x: 16, y: 16 },
        uiElementSpacing: {
          gameInfo: 16,
          gameStatus: 12,
          startButton: 24,
          warnings: 16,
          resultDisplay: 20,
          cardArea: 32
        }
      }

      const result = validateSpacingStandards(
        positions,
        expectedSpacing,
        mockCardWidth,
        mockCardHeight
      )

      expect(result.isValid).toBe(true)
      expect(result.inconsistentSpacing).toHaveLength(0)
      expect(result.errors).toHaveLength(0)
    })
  })

  describe('detectLayoutOverflow', () => {
    it('should detect horizontal overflow', () => {
      const positions: CardPosition[] = [
        { x: 700, y: 100 } // 卡片右边缘在820，超出容器
      ]

      const padding = { top: 20, right: 20, bottom: 20, left: 20 }

      const result = detectLayoutOverflow(
        positions,
        mockContainerWidth,
        mockContainerHeight,
        mockCardWidth,
        mockCardHeight,
        padding
      )

      expect(result.isValid).toBe(false)
      expect(result.overflowAreas).toHaveLength(1)
      expect(result.overflowAreas[0].direction).toBe('horizontal')
      expect(result.overflowAreas[0].amount).toBe(60) // 820 - 760
      expect(result.errors).toContain('Horizontal overflow detected: 60px')
    })

    it('should detect vertical overflow', () => {
      const positions: CardPosition[] = [
        { x: 100, y: 500 } // 卡片下边缘在660，超出容器
      ]

      const padding = { top: 20, right: 20, bottom: 20, left: 20 }

      const result = detectLayoutOverflow(
        positions,
        mockContainerWidth,
        mockContainerHeight,
        mockCardWidth,
        mockCardHeight,
        padding
      )

      expect(result.isValid).toBe(false)
      expect(result.overflowAreas).toHaveLength(1)
      expect(result.overflowAreas[0].direction).toBe('vertical')
      expect(result.overflowAreas[0].amount).toBe(100) // 660 - 560
      expect(result.errors).toContain('Vertical overflow detected: 100px')
    })

    it('should validate layout within bounds', () => {
      const positions: CardPosition[] = [
        { x: 50, y: 50 },
        { x: 200, y: 50 },
        { x: 350, y: 50 }
      ]

      const padding = { top: 20, right: 20, bottom: 20, left: 20 }

      const result = detectLayoutOverflow(
        positions,
        mockContainerWidth,
        mockContainerHeight,
        mockCardWidth,
        mockCardHeight,
        padding
      )

      expect(result.isValid).toBe(true)
      expect(result.overflowAreas).toHaveLength(0)
      expect(result.errors).toHaveLength(0)
    })
  })

  describe('validateLayout', () => {
    it('should perform comprehensive layout validation', () => {
      const positions: CardPosition[] = [
        { x: 50, y: 50 },
        { x: 210, y: 50 },   // 正确间距40
        { x: 370, y: 50 }    // 正确间距40
      ]

      const config: LayoutConfig = {
        cardWidth: mockCardWidth,
        cardHeight: mockCardHeight,
        spacing: {
          horizontal: 40,
          vertical: 20,
          tolerance: 5,
          baseUnit: 8,
          componentSpacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 },
          containerPadding: { x: 16, y: 16 },
          uiElementSpacing: {
            gameInfo: 16,
            gameStatus: 12,
            startButton: 24,
            warnings: 16,
            resultDisplay: 20,
            cardArea: 32
          }
        },
        padding: { top: 20, right: 20, bottom: 20, left: 20 }
      }

      const result = validateLayout(
        positions,
        config,
        mockContainerWidth,
        mockContainerHeight
      )

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should detect multiple validation issues', () => {
      const positions: CardPosition[] = [
        { x: 50, y: 50 },
        { x: 60, y: 60 },    // 重叠
        { x: 750, y: 50 }    // 超出边界
      ]

      const config: LayoutConfig = {
        cardWidth: mockCardWidth,
        cardHeight: mockCardHeight,
        spacing: {
          horizontal: 40,
          vertical: 20,
          tolerance: 5,
          baseUnit: 8,
          componentSpacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 },
          containerPadding: { x: 16, y: 16 },
          uiElementSpacing: {
            gameInfo: 16,
            gameStatus: 12,
            startButton: 24,
            warnings: 16,
            resultDisplay: 20,
            cardArea: 32
          }
        },
        padding: { top: 20, right: 20, bottom: 20, left: 20 }
      }

      const result = validateLayout(
        positions,
        config,
        mockContainerWidth,
        mockContainerHeight
      )

      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors.some(error => error.includes('overlapping'))).toBe(true)
      expect(result.errors.some(error => error.includes('out of bounds'))).toBe(true)
    })
  })
})