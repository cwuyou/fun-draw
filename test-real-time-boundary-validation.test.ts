// 测试实时边界验证功能
import { describe, it, expect } from 'vitest'
import { 
  calculateBoundaryAwarePositions, 
  performRealTimeBoundaryCheck,
  validateAndCorrectPositionsRealTime,
  batchValidatePositions,
  getBoundaryValidationStats
} from './lib/boundary-aware-positioning'
import { calculateAvailableCardSpace } from './lib/card-space-calculator'

describe('Real-time Boundary Validation Tests', () => {
  const mockContainerWidth = 1024
  const mockContainerHeight = 768
  
  const availableSpace = calculateAvailableCardSpace(mockContainerWidth, mockContainerHeight, {
    hasGameInfo: true,
    hasWarnings: false,
    hasStartButton: false,
    hasResultDisplay: false
  })

  it('should perform real-time boundary check without violations', () => {
    const positions = calculateBoundaryAwarePositions(4, availableSpace)
    
    const checkResult = performRealTimeBoundaryCheck(
      positions,
      mockContainerWidth,
      mockContainerHeight,
      {
        hasGameInfo: true,
        hasWarnings: false,
        hasStartButton: false,
        hasResultDisplay: false
      }
    )
    
    expect(checkResult.validationResult.isValid).toBe(true)
    expect(checkResult.validationResult.violations).toHaveLength(0)
    expect(checkResult.correctionApplied).toBe(false)
    expect(checkResult.performanceMetrics.validationTime).toBeGreaterThan(0)
    expect(checkResult.cardCount).toBe(4)
    
    console.log('Real-time check result:', {
      isValid: checkResult.validationResult.isValid,
      violations: checkResult.validationResult.violations.length,
      validationTime: checkResult.performanceMetrics.validationTime.toFixed(2) + 'ms'
    })
  })

  it('should detect and correct boundary violations', () => {
    // 创建一些故意超出边界的位置
    const invalidPositions = [
      { x: -1000, y: 0, rotation: 0, cardWidth: 100, cardHeight: 150 }, // 左侧溢出
      { x: 1000, y: 0, rotation: 0, cardWidth: 100, cardHeight: 150 },  // 右侧溢出
      { x: 0, y: -1000, rotation: 0, cardWidth: 100, cardHeight: 150 }, // 顶部溢出
      { x: 0, y: 1000, rotation: 0, cardWidth: 100, cardHeight: 150 }   // 底部溢出
    ]
    
    const { correctedPositions, checkResult } = validateAndCorrectPositionsRealTime(
      invalidPositions,
      mockContainerWidth,
      mockContainerHeight,
      {
        hasGameInfo: true,
        hasWarnings: false,
        hasStartButton: false,
        hasResultDisplay: false
      }
    )
    
    // 应该检测到违规
    expect(checkResult.validationResult.isValid).toBe(false)
    expect(checkResult.validationResult.violations.length).toBeGreaterThan(0)
    expect(checkResult.correctionApplied).toBe(true)
    expect(checkResult.performanceMetrics.correctionTime).toBeGreaterThan(0)
    
    // 修正后的位置应该在边界内
    const correctedCheckResult = performRealTimeBoundaryCheck(
      correctedPositions,
      mockContainerWidth,
      mockContainerHeight,
      {
        hasGameInfo: true,
        hasWarnings: false,
        hasStartButton: false,
        hasResultDisplay: false
      }
    )
    
    expect(correctedCheckResult.validationResult.isValid).toBe(true)
    
    console.log('Boundary violation correction:', {
      originalViolations: checkResult.validationResult.violations.length,
      correctionTime: checkResult.performanceMetrics.correctionTime?.toFixed(2) + 'ms',
      correctedValid: correctedCheckResult.validationResult.isValid
    })
  })

  it('should handle batch validation', () => {
    const positionSets = [
      calculateBoundaryAwarePositions(3, availableSpace),
      calculateBoundaryAwarePositions(6, availableSpace),
      calculateBoundaryAwarePositions(9, availableSpace)
    ]
    
    const batchResults = batchValidatePositions(
      positionSets,
      mockContainerWidth,
      mockContainerHeight,
      {
        hasGameInfo: true,
        hasWarnings: false,
        hasStartButton: false,
        hasResultDisplay: false
      }
    )
    
    expect(batchResults).toHaveLength(3)
    batchResults.forEach((result, index) => {
      expect(result.validationResult.isValid).toBe(true)
      expect(result.cardCount).toBe(positionSets[index].length)
    })
    
    console.log('Batch validation results:', batchResults.map((result, index) => ({
      cardCount: result.cardCount,
      isValid: result.validationResult.isValid,
      validationTime: result.performanceMetrics.validationTime.toFixed(2) + 'ms'
    })))
  })

  it('should generate performance statistics', () => {
    const positionSets = [
      calculateBoundaryAwarePositions(4, availableSpace),
      calculateBoundaryAwarePositions(6, availableSpace),
      calculateBoundaryAwarePositions(8, availableSpace)
    ]
    
    const batchResults = batchValidatePositions(
      positionSets,
      mockContainerWidth,
      mockContainerHeight,
      {
        hasGameInfo: true,
        hasWarnings: false,
        hasStartButton: false,
        hasResultDisplay: false
      }
    )
    
    const stats = getBoundaryValidationStats(batchResults)
    
    expect(stats.totalChecks).toBe(3)
    expect(stats.averageValidationTime).toBeGreaterThan(0)
    expect(stats.violationRate).toBe(0) // 应该没有违规
    expect(stats.correctionRate).toBe(0) // 应该没有需要修正的
    expect(['excellent', 'good', 'fair', 'poor']).toContain(stats.performanceScore)
    
    console.log('Performance statistics:', {
      totalChecks: stats.totalChecks,
      averageValidationTime: stats.averageValidationTime.toFixed(2) + 'ms',
      violationRate: (stats.violationRate * 100).toFixed(1) + '%',
      correctionRate: (stats.correctionRate * 100).toFixed(1) + '%',
      performanceScore: stats.performanceScore
    })
  })

  it('should handle edge cases gracefully', () => {
    // 测试空位置数组
    const emptyCheckResult = performRealTimeBoundaryCheck(
      [],
      mockContainerWidth,
      mockContainerHeight
    )
    
    expect(emptyCheckResult.cardCount).toBe(0)
    expect(emptyCheckResult.validationResult.isValid).toBe(true)
    
    // 测试极小容器
    const tinyCheckResult = performRealTimeBoundaryCheck(
      calculateBoundaryAwarePositions(2, availableSpace),
      100,
      100
    )
    
    expect(tinyCheckResult.containerDimensions.width).toBe(100)
    expect(tinyCheckResult.containerDimensions.height).toBe(100)
    
    console.log('Edge case results:', {
      emptyArray: emptyCheckResult.validationResult.isValid,
      tinyContainer: tinyCheckResult.validationResult.isValid
    })
  })
})