import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  validateCardPosition,
  getSafeCardPosition,
  createFallbackPositions,
  normalizePositionArray,
  createSingleFallbackPosition,
  validatePositionArray,
  isValidDimension,
  createPositionContext
} from './lib/position-validation'
import { CardPosition, DeviceConfig, PositionError } from './types'

// Mock the layout-manager module
vi.mock('./lib/layout-manager', () => ({
  getDeviceConfig: vi.fn(() => ({
    type: 'desktop',
    breakpoint: 1024,
    maxCards: 10,
    cardSize: {
      width: 120,
      height: 180
    },
    spacing: 16,
    cardsPerRow: 5,
    minContainerWidth: 800,
    minContainerHeight: 600
  })),
  detectDeviceType: vi.fn(() => 'desktop')
}))

describe('Position Validation', () => {
  let mockDeviceConfig: DeviceConfig
  let validPosition: CardPosition
  let invalidPositions: any[]

  beforeEach(() => {
    mockDeviceConfig = {
      type: 'desktop',
      breakpoint: 1024,
      maxCards: 10,
      cardSize: {
        width: 120,
        height: 180
      },
      spacing: 16,
      cardsPerRow: 5,
      minContainerWidth: 800,
      minContainerHeight: 600
    }

    validPosition = {
      x: 100,
      y: 200,
      rotation: 15,
      cardWidth: 120,
      cardHeight: 180
    }

    invalidPositions = [
      null,
      undefined,
      {},
      { x: 100 }, // missing properties
      { x: 'invalid', y: 200, rotation: 0, cardWidth: 120, cardHeight: 180 }, // invalid type
      { x: NaN, y: 200, rotation: 0, cardWidth: 120, cardHeight: 180 }, // NaN values
      { x: 15000, y: 200, rotation: 0, cardWidth: 120, cardHeight: 180 }, // out of bounds x
      { x: 100, y: -15000, rotation: 0, cardWidth: 120, cardHeight: 180 }, // out of bounds y
      { x: 100, y: 200, rotation: 500, cardWidth: 120, cardHeight: 180 }, // invalid rotation
      { x: 100, y: 200, rotation: 0, cardWidth: -10, cardHeight: 180 }, // negative width
      { x: 100, y: 200, rotation: 0, cardWidth: 120, cardHeight: 0 }, // zero height
      { x: 100, y: 200, rotation: 0, cardWidth: 2000, cardHeight: 180 } // oversized width
    ]
  })

  describe('validateCardPosition', () => {
    it('should validate a correct position object', () => {
      const result = validateCardPosition(validPosition, 0, 5)
      
      expect(result.isValid).toBe(true)
      expect(result.position).toEqual(validPosition)
      expect(result.error).toBeUndefined()
    })

    it('should reject null position', () => {
      const result = validateCardPosition(null, 0, 5)
      
      expect(result.isValid).toBe(false)
      expect(result.error).toContain(PositionError.UNDEFINED_POSITION)
      expect(result.error).toContain('index 0')
    })

    it('should reject undefined position', () => {
      const result = validateCardPosition(undefined, 2, 5)
      
      expect(result.isValid).toBe(false)
      expect(result.error).toContain(PositionError.UNDEFINED_POSITION)
      expect(result.error).toContain('index 2')
    })

    it('should reject position with missing properties', () => {
      const incompletePosition = { x: 100, y: 200 }
      const result = validateCardPosition(incompletePosition, 1, 5)
      
      expect(result.isValid).toBe(false)
      expect(result.error).toContain(PositionError.MISSING_PROPERTIES)
      expect(result.error).toContain('rotation, cardWidth, cardHeight')
    })

    it('should reject position with invalid numeric values', () => {
      const invalidPosition = { x: NaN, y: 200, rotation: 0, cardWidth: 120, cardHeight: 180 }
      const result = validateCardPosition(invalidPosition, 0, 5)
      
      expect(result.isValid).toBe(false)
      expect(result.error).toContain(PositionError.MISSING_PROPERTIES)
    })

    it('should reject position with extreme coordinates', () => {
      const extremePosition = { x: 15000, y: -12000, rotation: 0, cardWidth: 120, cardHeight: 180 }
      const result = validateCardPosition(extremePosition, 0, 5)
      
      expect(result.isValid).toBe(false)
      expect(result.error).toContain(PositionError.INVALID_VALUES)
      expect(result.error).toContain('x=15000, y=-12000')
    })

    it('should reject position with invalid card dimensions', () => {
      const invalidDimensions = { x: 100, y: 200, rotation: 0, cardWidth: -50, cardHeight: 1500 }
      const result = validateCardPosition(invalidDimensions, 0, 5)
      
      expect(result.isValid).toBe(false)
      expect(result.error).toContain(PositionError.INVALID_VALUES)
      expect(result.error).toContain('cardWidth=-50, cardHeight=1500')
    })

    it('should reject position with extreme rotation', () => {
      const extremeRotation = { x: 100, y: 200, rotation: 720, cardWidth: 120, cardHeight: 180 }
      const result = validateCardPosition(extremeRotation, 0, 5)
      
      expect(result.isValid).toBe(false)
      expect(result.error).toContain(PositionError.INVALID_VALUES)
      expect(result.error).toContain('rotation=720')
    })

    it('should test all invalid position scenarios', () => {
      invalidPositions.forEach((position, index) => {
        const result = validateCardPosition(position, index, 5)
        expect(result.isValid).toBe(false)
        expect(result.error).toBeDefined()
      })
    })
  })

  describe('getSafeCardPosition', () => {
    let fallbackPosition: CardPosition

    beforeEach(() => {
      fallbackPosition = {
        x: 0,
        y: 0,
        rotation: 0,
        cardWidth: 120,
        cardHeight: 180
      }
    })

    it('should return valid position when array access is safe', () => {
      const positions = [validPosition]
      const result = getSafeCardPosition(positions, 0, fallbackPosition)
      
      expect(result.x).toBe(validPosition.x)
      expect(result.y).toBe(validPosition.y)
      expect(result.isValidated).toBe(true)
      expect(result.isFallback).toBeUndefined()
    })

    it('should return fallback when array is null', () => {
      const result = getSafeCardPosition(null as any, 0, fallbackPosition)
      
      expect(result.x).toBe(fallbackPosition.x)
      expect(result.y).toBe(fallbackPosition.y)
      expect(result.isFallback).toBe(true)
      expect(result.validationError).toBe(PositionError.ARRAY_BOUNDS)
    })

    it('should return fallback when array is undefined', () => {
      const result = getSafeCardPosition(undefined as any, 0, fallbackPosition)
      
      expect(result.isFallback).toBe(true)
      expect(result.validationError).toBe(PositionError.ARRAY_BOUNDS)
    })

    it('should return fallback when index is negative', () => {
      const positions = [validPosition]
      const result = getSafeCardPosition(positions, -1, fallbackPosition)
      
      expect(result.isFallback).toBe(true)
      expect(result.validationError).toBe(PositionError.ARRAY_BOUNDS)
    })

    it('should return fallback when index exceeds array length', () => {
      const positions = [validPosition]
      const result = getSafeCardPosition(positions, 5, fallbackPosition)
      
      expect(result.isFallback).toBe(true)
      expect(result.validationError).toBe(PositionError.ARRAY_BOUNDS)
    })

    it('should return fallback when position at index is invalid', () => {
      const positions = [null as any]
      const result = getSafeCardPosition(positions, 0, fallbackPosition)
      
      expect(result.isFallback).toBe(true)
      expect(result.validationError).toContain(PositionError.UNDEFINED_POSITION)
    })

    it('should handle empty array', () => {
      const positions: CardPosition[] = []
      const result = getSafeCardPosition(positions, 0, fallbackPosition)
      
      expect(result.isFallback).toBe(true)
      expect(result.validationError).toBe(PositionError.ARRAY_BOUNDS)
    })
  })

  describe('createFallbackPositions', () => {
    it('should create fallback positions for single card', () => {
      const positions = createFallbackPositions(1, mockDeviceConfig)
      
      expect(positions).toHaveLength(1)
      expect(positions[0].isFallback).toBe(true)
      expect(positions[0].cardWidth).toBe(mockDeviceConfig.cardSize.width)
      expect(positions[0].cardHeight).toBe(mockDeviceConfig.cardSize.height)
    })

    it('should create fallback positions for multiple cards', () => {
      const cardCount = 6
      const positions = createFallbackPositions(cardCount, mockDeviceConfig)
      
      expect(positions).toHaveLength(cardCount)
      positions.forEach(position => {
        expect(position.isFallback).toBe(true)
        expect(position.rotation).toBe(0)
        expect(typeof position.x).toBe('number')
        expect(typeof position.y).toBe('number')
      })
    })

    it('should create grid layout for many cards', () => {
      const cardCount = 9
      const positions = createFallbackPositions(cardCount, mockDeviceConfig)
      
      expect(positions).toHaveLength(cardCount)
      
      // Check that positions are distributed in a grid pattern
      const uniqueXPositions = new Set(positions.map(p => p.x))
      const uniqueYPositions = new Set(positions.map(p => p.y))
      
      expect(uniqueXPositions.size).toBeGreaterThan(1) // Multiple columns
      expect(uniqueYPositions.size).toBeGreaterThan(1) // Multiple rows
    })

    it('should handle zero cards', () => {
      const positions = createFallbackPositions(0, mockDeviceConfig)
      
      expect(positions).toHaveLength(0)
    })

    it('should handle large number of cards', () => {
      const cardCount = 20
      const positions = createFallbackPositions(cardCount, mockDeviceConfig)
      
      expect(positions).toHaveLength(cardCount)
      positions.forEach(position => {
        expect(position.isFallback).toBe(true)
        expect(isFinite(position.x)).toBe(true)
        expect(isFinite(position.y)).toBe(true)
      })
    })
  })

  describe('normalizePositionArray', () => {
    it('should return same array when lengths match', () => {
      const positions = [validPosition, { ...validPosition, x: 200 }]
      const result = normalizePositionArray(positions, 2, mockDeviceConfig)
      
      expect(result).toHaveLength(2)
      expect(result[0]).toBe(positions[0])
      expect(result[1]).toBe(positions[1])
    })

    it('should truncate array when too long', () => {
      const positions = [
        validPosition, 
        { ...validPosition, x: 200 }, 
        { ...validPosition, x: 300 }
      ]
      const result = normalizePositionArray(positions, 2, mockDeviceConfig)
      
      expect(result).toHaveLength(2)
      expect(result[0]).toBe(positions[0])
      expect(result[1]).toBe(positions[1])
    })

    it('should extend array when too short', () => {
      const positions = [validPosition]
      const result = normalizePositionArray(positions, 3, mockDeviceConfig)
      
      expect(result).toHaveLength(3)
      expect(result[0]).toBe(positions[0])
      expect(result[1].isFallback).toBe(true)
      expect(result[2].isFallback).toBe(true)
    })

    it('should handle empty array', () => {
      const positions: CardPosition[] = []
      const result = normalizePositionArray(positions, 2, mockDeviceConfig)
      
      expect(result).toHaveLength(2)
      expect(result[0].isFallback).toBe(true)
      expect(result[1].isFallback).toBe(true)
    })

    it('should handle mismatched lengths with large difference', () => {
      const positions = [validPosition]
      const result = normalizePositionArray(positions, 10, mockDeviceConfig)
      
      expect(result).toHaveLength(10)
      expect(result[0]).toBe(positions[0])
      for (let i = 1; i < 10; i++) {
        expect(result[i].isFallback).toBe(true)
      }
    })
  })

  describe('validatePositionArray', () => {
    it('should validate array with all valid positions', () => {
      const positions = [
        validPosition,
        { ...validPosition, x: 200 },
        { ...validPosition, x: 300 }
      ]
      const result = validatePositionArray(positions, 3)
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.validPositions).toBe(3)
    })

    it('should detect invalid array type', () => {
      const result = validatePositionArray(null as any, 3)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Position array is not an array')
      expect(result.validPositions).toBe(0)
    })

    it('should detect length mismatch', () => {
      const positions = [validPosition]
      const result = validatePositionArray(positions, 3)
      
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.includes('length mismatch'))).toBe(true)
      expect(result.validPositions).toBe(1)
    })

    it('should count valid and invalid positions', () => {
      const positions = [
        validPosition,
        null as any,
        { ...validPosition, x: 200 },
        undefined as any
      ]
      const result = validatePositionArray(positions, 4)
      
      expect(result.isValid).toBe(false)
      expect(result.validPositions).toBe(2)
      expect(result.errors.length).toBeGreaterThanOrEqual(2) // At least 2 invalid positions
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle extreme numeric values', () => {
      const extremePosition = {
        x: Number.MAX_SAFE_INTEGER,
        y: Number.MIN_SAFE_INTEGER,
        rotation: 0,
        cardWidth: 120,
        cardHeight: 180
      }
      const result = validateCardPosition(extremePosition, 0, 1)
      
      expect(result.isValid).toBe(false)
    })

    it('should handle Infinity values', () => {
      const infinitePosition = {
        x: Infinity,
        y: 200,
        rotation: 0,
        cardWidth: 120,
        cardHeight: 180
      }
      const result = validateCardPosition(infinitePosition, 0, 1)
      
      expect(result.isValid).toBe(false)
    })

    it('should handle mixed valid and invalid positions in array access', () => {
      const positions = [
        validPosition,
        null as any,
        { ...validPosition, x: 200 }
      ]
      const fallback = { x: 0, y: 0, rotation: 0, cardWidth: 120, cardHeight: 180 }
      
      // Valid position
      const result1 = getSafeCardPosition(positions, 0, fallback)
      expect(result1.isValidated).toBe(true)
      
      // Invalid position
      const result2 = getSafeCardPosition(positions, 1, fallback)
      expect(result2.isFallback).toBe(true)
      
      // Valid position again
      const result3 = getSafeCardPosition(positions, 2, fallback)
      expect(result3.isValidated).toBe(true)
    })
  })

  describe('isValidDimension', () => {
    it('should validate correct dimensions', () => {
      expect(isValidDimension(800, 600)).toBe(true)
      expect(isValidDimension(1920, 1080)).toBe(true)
      expect(isValidDimension(1, 1)).toBe(true)
    })

    it('should reject invalid dimensions', () => {
      expect(isValidDimension(0, 600)).toBe(false)
      expect(isValidDimension(800, -100)).toBe(false)
      expect(isValidDimension(NaN, 600)).toBe(false)
      expect(isValidDimension(800, Infinity)).toBe(false)
      expect(isValidDimension(100000, 600)).toBe(false)
    })
  })

  describe('createPositionContext', () => {
    it('should create valid position context', () => {
      const context = createPositionContext(800, 600, 5)
      
      expect(context.containerWidth).toBe(800)
      expect(context.containerHeight).toBe(600)
      expect(context.cardCount).toBe(5)
      expect(context.deviceType).toBe('desktop')
      expect(typeof context.timestamp).toBe('number')
      expect(context.fallbackApplied).toBe(false)
    })
  })
})