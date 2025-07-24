// 测试增强的降级系统
import { describe, it, expect } from 'vitest'
import { 
  createEnhancedFallback,
  applyMultiLevelFallback,
  createSafeGridLayout,
  createContainerAwareFallback,
  validatePositionBoundaries
} from './lib/boundary-aware-positioning'
import { calculateAvailableCardSpace } from './lib/card-space-calculator'

describe('Enhanced Fallback System Tests', () => {
  const mockContainerWidth = 1024
  const mockContainerHeight = 768
  
  const availableSpace = calculateAvailableCardSpace(mockContainerWidth, mockContainerHeight, {
    hasGameInfo: true,
    hasWarnings: false,
    hasStartButton: false,
    hasResultDisplay: false
  })

  it('should create enhanced fallback with detailed result information', () => {
    const fallbackResult = createEnhancedFallback(
      6,
      mockContainerWidth,
      mockContainerHeight,
      'Test fallback scenario'
    )
    
    expect(fallbackResult.positions).toHaveLength(6)
    expect(fallbackResult.fallbackLevel).toBe('safe-grid')
    expect(fallbackResult.fallbackReason).toBe('Test fallback scenario')
    expect(fallbackResult.qualityScore).toBeGreaterThan(0)
    expect(fallbackResult.qualityScore).toBeLessThanOrEqual(100)
    expect(fallbackResult.performanceMetrics.calculationTime).toBeGreaterThan(0)
    expect(fallbackResult.metadata.originalCardCount).toBe(6)
    expect(fallbackResult.metadata.actualCardCount).toBe(6)
    expect(fallbackResult.metadata.containerDimensions.width).toBe(mockContainerWidth)
    expect(fallbackResult.metadata.containerDimensions.height).toBe(mockContainerHeight)
    
    // 验证位置在边界内
    const boundaryCheck = validatePositionBoundaries(fallbackResult.positions, availableSpace)
    expect(boundaryCheck.isValid).toBe(true)
    
    console.log('Enhanced fallback result:', {
      fallbackLevel: fallbackResult.fallbackLevel,
      qualityScore: fallbackResult.qualityScore,
      calculationTime: fallbackResult.performanceMetrics.calculationTime.toFixed(2) + 'ms',
      boundaryValid: boundaryCheck.isValid
    })
  })

  it('should apply multi-level fallback strategy', () => {
    const testError = new Error('Position calculation failed')
    
    const fallbackResult = applyMultiLevelFallback(
      8,
      availableSpace,
      testError
    )
    
    expect(fallbackResult.positions).toHaveLength(8)
    expect(['correction', 'safe-grid', 'emergency']).toContain(fallbackResult.fallbackLevel)
    expect(fallbackResult.fallbackReason).toContain('Position calculation failed')
    expect(fallbackResult.qualityScore).toBeGreaterThan(0)
    expect(fallbackResult.performanceMetrics.calculationTime).toBeGreaterThan(0)
    
    // 验证位置在边界内
    const boundaryCheck = validatePositionBoundaries(fallbackResult.positions, availableSpace)
    expect(boundaryCheck.isValid).toBe(true)
    
    console.log('Multi-level fallback result:', {
      fallbackLevel: fallbackResult.fallbackLevel,
      qualityScore: fallbackResult.qualityScore,
      errorMessage: fallbackResult.fallbackReason,
      boundaryValid: boundaryCheck.isValid
    })
  })

  it('should handle emergency fallback gracefully', () => {
    // 测试极端情况下的紧急降级
    const tinyContainerWidth = 200
    const tinyContainerHeight = 150
    
    const fallbackResult = createEnhancedFallback(
      10,
      tinyContainerWidth,
      tinyContainerHeight,
      'Tiny container emergency test'
    )
    
    expect(fallbackResult.positions).toHaveLength(10)
    expect(['safe-grid', 'emergency']).toContain(fallbackResult.fallbackLevel)
    expect(fallbackResult.qualityScore).toBeGreaterThan(0)
    
    // 验证所有卡牌都有有效位置
    fallbackResult.positions.forEach((pos, index) => {
      expect(typeof pos.x).toBe('number')
      expect(typeof pos.y).toBe('number')
      expect(typeof pos.cardWidth).toBe('number')
      expect(typeof pos.cardHeight).toBe('number')
      expect(pos.cardWidth).toBeGreaterThan(0)
      expect(pos.cardHeight).toBeGreaterThan(0)
      expect(!isNaN(pos.x)).toBe(true)
      expect(!isNaN(pos.y)).toBe(true)
    })
    
    console.log('Emergency fallback result:', {
      containerSize: `${tinyContainerWidth}x${tinyContainerHeight}`,
      fallbackLevel: fallbackResult.fallbackLevel,
      qualityScore: fallbackResult.qualityScore,
      cardCount: fallbackResult.positions.length
    })
  })

  it('should maintain backward compatibility with createContainerAwareFallback', () => {
    const positions = createContainerAwareFallback(
      5,
      mockContainerWidth,
      mockContainerHeight
    )
    
    expect(positions).toHaveLength(5)
    
    // 验证位置格式
    positions.forEach((pos, index) => {
      expect(typeof pos.x).toBe('number')
      expect(typeof pos.y).toBe('number')
      expect(typeof pos.rotation).toBe('number')
      expect(typeof pos.cardWidth).toBe('number')
      expect(typeof pos.cardHeight).toBe('number')
      expect(!isNaN(pos.x)).toBe(true)
      expect(!isNaN(pos.y)).toBe(true)
    })
    
    // 验证边界
    const boundaryCheck = validatePositionBoundaries(positions, availableSpace)
    expect(boundaryCheck.isValid).toBe(true)
    
    console.log('Backward compatibility test:', {
      positionCount: positions.length,
      boundaryValid: boundaryCheck.isValid,
      samplePosition: positions[0]
    })
  })

  it('should calculate quality scores accurately', () => {
    // 测试不同场景的质量分数
    const scenarios = [
      { cardCount: 3, containerWidth: 1024, containerHeight: 768, expectedMinScore: 80 },
      { cardCount: 6, containerWidth: 800, containerHeight: 600, expectedMinScore: 70 },
      { cardCount: 9, containerWidth: 600, containerHeight: 400, expectedMinScore: 50 },
      { cardCount: 12, containerWidth: 400, containerHeight: 300, expectedMinScore: 30 }
    ]
    
    scenarios.forEach(scenario => {
      const fallbackResult = createEnhancedFallback(
        scenario.cardCount,
        scenario.containerWidth,
        scenario.containerHeight,
        `Quality test for ${scenario.cardCount} cards`
      )
      
      expect(fallbackResult.qualityScore).toBeGreaterThanOrEqual(scenario.expectedMinScore)
      expect(fallbackResult.positions).toHaveLength(scenario.cardCount)
      
      console.log(`Quality test ${scenario.cardCount} cards:`, {
        containerSize: `${scenario.containerWidth}x${scenario.containerHeight}`,
        qualityScore: fallbackResult.qualityScore,
        fallbackLevel: fallbackResult.fallbackLevel,
        expectedMinScore: scenario.expectedMinScore
      })
    })
  })

  it('should handle performance monitoring correctly', () => {
    const startTime = performance.now()
    
    const fallbackResult = createEnhancedFallback(
      7,
      mockContainerWidth,
      mockContainerHeight,
      'Performance monitoring test'
    )
    
    const endTime = performance.now()
    
    expect(fallbackResult.performanceMetrics.calculationTime).toBeGreaterThan(0)
    expect(fallbackResult.performanceMetrics.calculationTime).toBeLessThan(endTime - startTime + 10) // 允许一些误差
    
    if (fallbackResult.performanceMetrics.fallbackTime) {
      expect(fallbackResult.performanceMetrics.fallbackTime).toBeGreaterThan(0)
    }
    
    console.log('Performance monitoring:', {
      calculationTime: fallbackResult.performanceMetrics.calculationTime.toFixed(2) + 'ms',
      fallbackTime: fallbackResult.performanceMetrics.fallbackTime?.toFixed(2) + 'ms' || 'N/A',
      totalTestTime: (endTime - startTime).toFixed(2) + 'ms'
    })
  })

  it('should provide comprehensive metadata', () => {
    const fallbackResult = createEnhancedFallback(
      4,
      mockContainerWidth,
      mockContainerHeight,
      'Metadata test'
    )
    
    const metadata = fallbackResult.metadata
    
    expect(metadata.originalCardCount).toBe(4)
    expect(metadata.actualCardCount).toBe(4)
    expect(metadata.containerDimensions.width).toBe(mockContainerWidth)
    expect(metadata.containerDimensions.height).toBe(mockContainerHeight)
    expect(metadata.availableSpace).toBeDefined()
    expect(metadata.availableSpace!.width).toBeGreaterThan(0)
    expect(metadata.availableSpace!.height).toBeGreaterThan(0)
    
    console.log('Metadata test:', {
      originalCardCount: metadata.originalCardCount,
      actualCardCount: metadata.actualCardCount,
      containerDimensions: metadata.containerDimensions,
      availableSpace: metadata.availableSpace
    })
  })
})