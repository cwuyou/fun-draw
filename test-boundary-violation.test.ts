import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { 
  calculateFixedCardLayout, 
  calculateSimpleCardSpace, 
  validateLayout,
  createEmergencyLayout,
  type CardLayoutResult,
  type SimpleCardSpace 
} from '@/lib/fixed-card-positioning'
import type { CardPosition } from '@/types'

describe('Comprehensive Boundary Violation Testing', () => {
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>
  let consoleLogSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleWarnSpy.mockRestore()
    consoleLogSpy.mockRestore()
  })

  describe('Intentional boundary overflow scenarios', () => {
    it('should detect positions outside container bounds - horizontal overflow', () => {
      // Create a very narrow container that should cause horizontal overflow
      const narrowSpace: SimpleCardSpace = {
        width: 100,
        height: 400,
        centerX: 50,
        centerY: 200
      }

      const result = calculateFixedCardLayout(6, 100, 400)
      const isValid = validateLayout(result, narrowSpace)

      expect(isValid).toBe(false)
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Layout validation failed:',
        expect.objectContaining({
          overflow: expect.objectContaining({
            width: expect.any(Number)
          })
        })
      )
    })

    it('should detect positions outside container bounds - vertical overflow', () => {
      // Create a very short container that should cause vertical overflow
      const shortSpace: SimpleCardSpace = {
        width: 800,
        height: 100,
        centerX: 400,
        centerY: 50
      }

      const result = calculateFixedCardLayout(8, 800, 100)
      const isValid = validateLayout(result, shortSpace)

      expect(isValid).toBe(false)
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Layout validation failed:',
        expect.objectContaining({
          overflow: expect.objectContaining({
            height: expect.any(Number)
          })
        })
      )
    })

    it('should detect positions outside container bounds - both dimensions', () => {
      // Create a tiny container that should cause overflow in both dimensions
      const tinySpace: SimpleCardSpace = {
        width: 150,
        height: 100,
        centerX: 75,
        centerY: 50
      }

      const result = calculateFixedCardLayout(10, 150, 100)
      const isValid = validateLayout(result, tinySpace)

      expect(isValid).toBe(false)
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Layout validation failed:',
        expect.objectContaining({
          overflow: expect.objectContaining({
            width: expect.any(Number),
            height: expect.any(Number)
          })
        })
      )
    })
  })

  describe('Automatic position correction for overflow scenarios', () => {
    it('should automatically use emergency layout when standard layout overflows', () => {
      const constrainedSpace = calculateSimpleCardSpace(200, 150)
      const standardResult = calculateFixedCardLayout(9, 200, 150)
      
      const isValid = validateLayout(standardResult, constrainedSpace)
      
      if (!isValid) {
        const emergencyResult = createEmergencyLayout(9, constrainedSpace)
        
        // Emergency layout should fit within bounds
        expect(emergencyResult.layoutInfo.totalWidth).toBeLessThanOrEqual(constrainedSpace.width * 0.85)
        expect(emergencyResult.layoutInfo.totalHeight).toBeLessThanOrEqual(constrainedSpace.height * 0.85)
        
        // All positions should be valid
        emergencyResult.positions.forEach((pos, index) => {
          expect(pos.x - pos.cardWidth/2).toBeGreaterThanOrEqual(-constrainedSpace.width/2)
          expect(pos.x + pos.cardWidth/2).toBeLessThanOrEqual(constrainedSpace.width/2)
          expect(pos.y - pos.cardHeight/2).toBeGreaterThanOrEqual(-constrainedSpace.height/2)
          expect(pos.y + pos.cardHeight/2).toBeLessThanOrEqual(constrainedSpace.height/2)
        })
      }
    })

    it('should correct individual card positions that exceed bounds', () => {
      // Test with various card counts to ensure correction works consistently
      const testCases = [
        { cards: 5, width: 300, height: 200 },
        { cards: 7, width: 400, height: 250 },
        { cards: 9, width: 500, height: 300 }
      ]

      testCases.forEach(({ cards, width, height }) => {
        const space = calculateSimpleCardSpace(width, height)
        const result = calculateFixedCardLayout(cards, width, height)
        
        const isValid = validateLayout(result, space)
        
        if (!isValid) {
          const emergencyResult = createEmergencyLayout(cards, space)
          
          // Check that all positions are within corrected bounds
          emergencyResult.positions.forEach(pos => {
            const leftEdge = pos.x - pos.cardWidth/2
            const rightEdge = pos.x + pos.cardWidth/2
            const topEdge = pos.y - pos.cardHeight/2
            const bottomEdge = pos.y + pos.cardHeight/2
            
            expect(leftEdge).toBeGreaterThanOrEqual(-space.width/2)
            expect(rightEdge).toBeLessThanOrEqual(space.width/2)
            expect(topEdge).toBeGreaterThanOrEqual(-space.height/2)
            expect(bottomEdge).toBeLessThanOrEqual(space.height/2)
          })
        }
      })
    })

    it('should maintain card aspect ratios during correction', () => {
      const space = calculateSimpleCardSpace(250, 180)
      const emergencyResult = createEmergencyLayout(8, space)
      
      emergencyResult.positions.forEach(pos => {
        const aspectRatio = pos.cardHeight / pos.cardWidth
        // Should maintain reasonable aspect ratio (cards shouldn't be too squished)
        expect(aspectRatio).toBeGreaterThan(1.0) // Height > width for playing cards
        expect(aspectRatio).toBeLessThan(2.5) // But not too tall
      })
    })
  })

  describe('Boundary validation performance with large numbers of cards', () => {
    it('should handle validation for maximum card count efficiently', () => {
      const startTime = performance.now()
      
      const space = calculateSimpleCardSpace(1200, 800)
      const result = calculateFixedCardLayout(10, 1200, 800) // Maximum cards
      const isValid = validateLayout(result, space)
      
      const endTime = performance.now()
      const duration = endTime - startTime
      
      // Validation should complete quickly (under 50ms)
      expect(duration).toBeLessThan(50)
      expect(typeof isValid).toBe('boolean')
    })

    it('should efficiently process multiple validation calls', () => {
      const space = calculateSimpleCardSpace(800, 600)
      const startTime = performance.now()
      
      // Validate multiple different layouts
      for (let cardCount = 1; cardCount <= 10; cardCount++) {
        const result = calculateFixedCardLayout(cardCount, 800, 600)
        validateLayout(result, space)
      }
      
      const endTime = performance.now()
      const duration = endTime - startTime
      
      // All validations should complete quickly (under 100ms total)
      expect(duration).toBeLessThan(100)
    })

    it('should handle rapid successive validation calls', () => {
      const space = calculateSimpleCardSpace(1024, 768)
      const results: boolean[] = []
      
      // Simulate rapid resize events
      for (let i = 0; i < 20; i++) {
        const result = calculateFixedCardLayout(6, 1024 + i * 10, 768 + i * 5)
        const isValid = validateLayout(result, space)
        results.push(isValid)
      }
      
      expect(results).toHaveLength(20)
      expect(results.every(result => typeof result === 'boolean')).toBe(true)
    })
  })

  describe('Edge cases where correction might not be possible', () => {
    it('should handle extremely small containers gracefully', () => {
      const tinySpace: SimpleCardSpace = {
        width: 50,
        height: 30,
        centerX: 25,
        centerY: 15
      }

      const emergencyResult = createEmergencyLayout(5, tinySpace)
      
      // Should still produce a result, even if cards are very small
      expect(emergencyResult.positions).toHaveLength(5)
      expect(emergencyResult.positions.every(pos => 
        pos.cardWidth > 0 && pos.cardHeight > 0
      )).toBe(true)
      
      // Cards should use minimum sizes
      emergencyResult.positions.forEach(pos => {
        expect(pos.cardWidth).toBeGreaterThanOrEqual(40) // Minimum width
        expect(pos.cardHeight).toBeGreaterThanOrEqual(60) // Minimum height
      })
    })

    it('should handle zero or negative container dimensions', () => {
      const invalidSpaces = [
        { width: 0, height: 100, centerX: 0, centerY: 50 },
        { width: 100, height: 0, centerX: 50, centerY: 0 },
        { width: -100, height: 200, centerX: -50, centerY: 100 }
      ]

      invalidSpaces.forEach(space => {
        const result = createEmergencyLayout(3, space)
        
        // Should still produce valid positions
        expect(result.positions).toHaveLength(3)
        expect(result.positions.every(pos => 
          typeof pos.x === 'number' && 
          typeof pos.y === 'number' &&
          pos.cardWidth > 0 &&
          pos.cardHeight > 0
        )).toBe(true)
      })
    })

    it('should handle single card in minimal space', () => {
      const minimalSpace: SimpleCardSpace = {
        width: 60,
        height: 80,
        centerX: 30,
        centerY: 40
      }

      const result = createEmergencyLayout(1, minimalSpace)
      
      expect(result.positions).toHaveLength(1)
      
      const pos = result.positions[0]
      expect(pos.cardWidth).toBeGreaterThan(0)
      expect(pos.cardHeight).toBeGreaterThan(0)
      
      // Single card should fit within the minimal space
      expect(pos.cardWidth).toBeLessThanOrEqual(minimalSpace.width)
      expect(pos.cardHeight).toBeLessThanOrEqual(minimalSpace.height)
    })

    it('should maintain functionality when correction is impossible', () => {
      // Test with impossible constraints
      const impossibleSpace: SimpleCardSpace = {
        width: 10,
        height: 10,
        centerX: 5,
        centerY: 5
      }

      const result = createEmergencyLayout(10, impossibleSpace)
      
      // Should still return positions for all cards
      expect(result.positions).toHaveLength(10)
      
      // Cards should use absolute minimum sizes
      result.positions.forEach(pos => {
        expect(pos.cardWidth).toBeGreaterThanOrEqual(40)
        expect(pos.cardHeight).toBeGreaterThanOrEqual(60)
      })
      
      // Should log warning about using emergency layout
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Using emergency layout:',
        expect.any(Object)
      )
    })
  })

  describe('Boundary validation accuracy', () => {
    it('should accurately detect near-boundary positions', () => {
      const space = calculateSimpleCardSpace(400, 300)
      
      // Create a layout that should be just within bounds
      const result = calculateFixedCardLayout(4, 400, 300)
      const isValid = validateLayout(result, space)
      
      if (isValid) {
        // Verify positions are actually within the safe area
        const safeWidth = space.width * 0.85
        const safeHeight = space.height * 0.85
        
        expect(result.layoutInfo.totalWidth).toBeLessThanOrEqual(safeWidth)
        expect(result.layoutInfo.totalHeight).toBeLessThanOrEqual(safeHeight)
      }
    })

    it('should provide accurate overflow measurements', () => {
      const space = calculateSimpleCardSpace(200, 150)
      const result = calculateFixedCardLayout(8, 200, 150)
      
      const isValid = validateLayout(result, space)
      
      if (!isValid) {
        // Check that overflow measurements are accurate
        const safeWidth = space.width * 0.85
        const safeHeight = space.height * 0.85
        
        const expectedWidthOverflow = Math.max(0, result.layoutInfo.totalWidth - safeWidth)
        const expectedHeightOverflow = Math.max(0, result.layoutInfo.totalHeight - safeHeight)
        
        expect(consoleWarnSpy).toHaveBeenCalledWith(
          'Layout validation failed:',
          expect.objectContaining({
            overflow: {
              width: expectedWidthOverflow,
              height: expectedHeightOverflow
            }
          })
        )
      }
    })
  })
})