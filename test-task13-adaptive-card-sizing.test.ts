import { describe, it, expect, beforeEach } from 'vitest'
import { 
  calculateAdaptiveCardSize,
  calculateOptimalCardSize,
  type AdaptiveCardSizeConfig,
  type AdaptiveSizeResult
} from '@/lib/boundary-aware-positioning'
import { calculateAvailableCardSpace } from '@/lib/card-space-calculator'

describe('Task 13: Adaptive Card Sizing System', () => {
  let mockAvailableSpace: ReturnType<typeof calculateAvailableCardSpace>
  
  beforeEach(() => {
    // 模拟标准可用空间
    mockAvailableSpace = {
      width: 800,
      height: 600,
      containerWidth: 1024,
      containerHeight: 768,
      maxCardWidth: 120,
      maxCardHeight: 180,
      uiElements: {
        hasGameInfo: true,
        hasWarnings: false,
        hasStartButton: true,
        hasResultDisplay: false
      }
    }
  })

  describe('calculateAdaptiveCardSize', () => {
    it('should calculate excellent quality card size for large containers', () => {
      const layoutConfig = { rows: 2, cardsPerRow: 3, totalCards: 6 }
      
      const result = calculateAdaptiveCardSize(layoutConfig, mockAvailableSpace)
      
      expect(result.quality).toBe('excellent')
      expect(result.width).toBeGreaterThanOrEqual(100)
      expect(result.readabilityScore).toBeGreaterThan(90)
      expect(result.preservedAspectRatio).toBe(true)
      expect(result.adaptationReason).toContain('calculation')
    })

    it('should maintain aspect ratio when possible', () => {
      const layoutConfig = { rows: 2, cardsPerRow: 3, totalCards: 6 }
      
      const result = calculateAdaptiveCardSize(layoutConfig, mockAvailableSpace)
      
      const aspectRatio = result.height / result.width
      expect(aspectRatio).toBeCloseTo(1.5, 1) // 标准扑克牌比例
      expect(result.preservedAspectRatio).toBe(true)
    })

    it('should adapt to limited container space', () => {
      const limitedSpace = {
        ...mockAvailableSpace,
        width: 300,
        height: 200,
        maxCardWidth: 60,
        maxCardHeight: 90
      }
      const layoutConfig = { rows: 2, cardsPerRow: 3, totalCards: 6 }
      
      const result = calculateAdaptiveCardSize(layoutConfig, limitedSpace)
      
      expect(result.quality).toBe('acceptable')
      expect(result.width).toBeLessThan(80)
      expect(result.readabilityScore).toBeLessThanOrEqual(100)
      // 检查是否适应了有限的容器空间
      expect(result.width).toBeLessThanOrEqual(limitedSpace.maxCardWidth)
      expect(result.height).toBeLessThanOrEqual(limitedSpace.maxCardHeight)
    })

    it('should prioritize readability when width is below threshold', () => {
      const narrowSpace = {
        ...mockAvailableSpace,
        width: 200,
        height: 600,
        maxCardWidth: 40,
        maxCardHeight: 180
      }
      const layoutConfig = { rows: 1, cardsPerRow: 6, totalCards: 6 }
      
      const result = calculateAdaptiveCardSize(layoutConfig, narrowSpace)
      
      // 检查是否进行了可读性相关的调整
      expect(result.adaptationReason).toMatch(/Readability|adjustment|calculation/)
      expect(result.width).toBeGreaterThanOrEqual(40) // 最小宽度
      expect(result.readabilityScore).toBeGreaterThan(0)
    })

    it('should apply custom configuration', () => {
      const customConfig: Partial<AdaptiveCardSizeConfig> = {
        minWidth: 60,
        minHeight: 90,
        readabilityThreshold: 70,
        qualityThresholds: {
          excellent: 120,
          good: 90,
          acceptable: 70
        }
      }
      const layoutConfig = { rows: 2, cardsPerRow: 3, totalCards: 6 }
      
      const result = calculateAdaptiveCardSize(layoutConfig, mockAvailableSpace, customConfig)
      
      expect(result.width).toBeGreaterThanOrEqual(60)
      expect(result.height).toBeGreaterThanOrEqual(90)
      // 质量评分应该基于自定义阈值
      if (result.width >= 120) {
        expect(result.quality).toBe('excellent')
      } else if (result.width >= 90) {
        expect(result.quality).toBe('good')
      }
    })

    it('should handle extreme container constraints', () => {
      const extremeSpace = {
        ...mockAvailableSpace,
        width: 100,
        height: 100,
        maxCardWidth: 30,
        maxCardHeight: 45
      }
      const layoutConfig = { rows: 3, cardsPerRow: 2, totalCards: 6 }
      
      const result = calculateAdaptiveCardSize(layoutConfig, extremeSpace)
      
      expect(result.quality).toBe('minimal')
      expect(result.width).toBeGreaterThanOrEqual(40) // 默认最小宽度
      expect(result.height).toBeGreaterThanOrEqual(60) // 默认最小高度
      expect(result.scaleFactor).toBeLessThan(0.5)
    })

    it('should calculate scale factor correctly', () => {
      const layoutConfig = { rows: 2, cardsPerRow: 3, totalCards: 6 }
      
      const result = calculateAdaptiveCardSize(layoutConfig, mockAvailableSpace)
      
      expect(result.scaleFactor).toBeGreaterThan(0)
      expect(result.scaleFactor).toBeLessThanOrEqual(1)
      expect(result.scaleFactor).toBe(result.width / 120) // 默认最大宽度
    })

    it('should handle width-constrained aspect ratio adjustment', () => {
      const wideSpace = {
        ...mockAvailableSpace,
        width: 1200,
        height: 300,
        maxCardWidth: 150,
        maxCardHeight: 100 // 限制高度
      }
      const layoutConfig = { rows: 1, cardsPerRow: 6, totalCards: 6 }
      
      const result = calculateAdaptiveCardSize(layoutConfig, wideSpace)
      
      // 检查是否进行了纵横比调整
      expect(result.adaptationReason).toMatch(/adjustment|calculation/)
      expect(result.height / result.width).toBeCloseTo(1.5, 1)
    })

    it('should handle height-constrained aspect ratio adjustment', () => {
      const tallSpace = {
        ...mockAvailableSpace,
        width: 300,
        height: 1200,
        maxCardWidth: 80, // 限制宽度
        maxCardHeight: 200
      }
      const layoutConfig = { rows: 6, cardsPerRow: 1, totalCards: 6 }
      
      const result = calculateAdaptiveCardSize(layoutConfig, tallSpace)
      
      // 检查是否进行了纵横比调整
      expect(result.adaptationReason).toMatch(/adjustment|calculation/)
      expect(result.height / result.width).toBeCloseTo(1.5, 1)
    })
  })

  describe('calculateOptimalCardSize (backward compatibility)', () => {
    it('should maintain backward compatibility with existing code', () => {
      const layoutConfig = { rows: 2, cardsPerRow: 3, totalCards: 6 }
      
      const result = calculateOptimalCardSize(layoutConfig, mockAvailableSpace)
      
      expect(result).toHaveProperty('width')
      expect(result).toHaveProperty('height')
      expect(typeof result.width).toBe('number')
      expect(typeof result.height).toBe('number')
      expect(result.width).toBeGreaterThan(0)
      expect(result.height).toBeGreaterThan(0)
    })

    it('should produce same results as adaptive system', () => {
      const layoutConfig = { rows: 2, cardsPerRow: 3, totalCards: 6 }
      
      const adaptiveResult = calculateAdaptiveCardSize(layoutConfig, mockAvailableSpace)
      const compatResult = calculateOptimalCardSize(layoutConfig, mockAvailableSpace)
      
      expect(compatResult.width).toBe(adaptiveResult.width)
      expect(compatResult.height).toBe(adaptiveResult.height)
    })
  })

  describe('Size adaptation logging', () => {
    it('should log adaptation details in development mode', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'
      
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      
      const layoutConfig = { rows: 2, cardsPerRow: 3, totalCards: 6 }
      calculateAdaptiveCardSize(layoutConfig, mockAvailableSpace)
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('🎯 Adaptive Card Sizing'),
        expect.objectContaining({
          layout: '3x2',
          quality: expect.any(String),
          readabilityScore: expect.stringContaining('%'),
          aspectRatioPreserved: expect.any(Boolean)
        })
      )
      
      consoleSpy.mockRestore()
      process.env.NODE_ENV = originalEnv
    })
  })

  describe('Edge cases and error handling', () => {
    it('should handle zero or negative dimensions gracefully', () => {
      const invalidSpace = {
        ...mockAvailableSpace,
        width: 0,
        height: 0
      }
      const layoutConfig = { rows: 2, cardsPerRow: 3, totalCards: 6 }
      
      const result = calculateAdaptiveCardSize(layoutConfig, invalidSpace)
      
      expect(result.width).toBeGreaterThanOrEqual(40) // 最小宽度
      expect(result.height).toBeGreaterThanOrEqual(60) // 最小高度
      expect(result.quality).toBe('minimal')
    })

    it('should handle single card layout', () => {
      const layoutConfig = { rows: 1, cardsPerRow: 1, totalCards: 1 }
      
      const result = calculateAdaptiveCardSize(layoutConfig, mockAvailableSpace)
      
      expect(result.width).toBeGreaterThan(0)
      expect(result.height).toBeGreaterThan(0)
      expect(result.quality).toBe('excellent')
      expect(result.preservedAspectRatio).toBe(true)
    })

    it('should handle large card count layouts', () => {
      const layoutConfig = { rows: 4, cardsPerRow: 5, totalCards: 20 }
      
      const result = calculateAdaptiveCardSize(layoutConfig, mockAvailableSpace)
      
      expect(result.width).toBeGreaterThan(0)
      expect(result.height).toBeGreaterThan(0)
      expect(result.quality).toMatch(/excellent|good|acceptable|minimal/)
    })
  })

  describe('Performance considerations', () => {
    it('should complete calculation within reasonable time', () => {
      const layoutConfig = { rows: 2, cardsPerRow: 3, totalCards: 6 }
      
      const startTime = performance.now()
      calculateAdaptiveCardSize(layoutConfig, mockAvailableSpace)
      const endTime = performance.now()
      
      expect(endTime - startTime).toBeLessThan(10) // 应该在10ms内完成
    })

    it('should handle multiple rapid calculations', () => {
      const layoutConfig = { rows: 2, cardsPerRow: 3, totalCards: 6 }
      
      const startTime = performance.now()
      for (let i = 0; i < 100; i++) {
        calculateAdaptiveCardSize(layoutConfig, mockAvailableSpace)
      }
      const endTime = performance.now()
      
      expect(endTime - startTime).toBeLessThan(100) // 100次计算应该在100ms内完成
    })
  })
})