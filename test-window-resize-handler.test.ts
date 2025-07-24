// 测试更新的窗口大小调整处理器
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { 
  calculateBoundaryAwarePositions,
  performRealTimeBoundaryCheck,
  validateAndCorrectPositionsRealTime,
  createEnhancedFallback,
  createContainerAwareFallback
} from './lib/boundary-aware-positioning'
import { calculateAvailableCardSpace } from './lib/card-space-calculator'
import { isValidDimension } from './lib/position-validation'

describe('Window Resize Handler Tests', () => {
  // Mock window object
  const originalWindow = global.window
  
  beforeEach(() => {
    // Mock window object
    Object.defineProperty(global, 'window', {
      value: {
        innerWidth: 1024,
        innerHeight: 768,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      },
      writable: true
    })
  })
  
  afterEach(() => {
    global.window = originalWindow
  })

  it('should validate container dimensions correctly', () => {
    // Test valid dimensions
    expect(isValidDimension(1024, 768)).toBe(true)
    expect(isValidDimension(800, 600)).toBe(true)
    expect(isValidDimension(1920, 1080)).toBe(true)
    
    // Test invalid dimensions
    expect(isValidDimension(0, 768)).toBe(false)
    expect(isValidDimension(1024, 0)).toBe(false)
    expect(isValidDimension(-100, 768)).toBe(false)
    expect(isValidDimension(1024, -100)).toBe(false)
    expect(isValidDimension(NaN, 768)).toBe(false)
    expect(isValidDimension(1024, NaN)).toBe(false)
    
    console.log('Container dimension validation tests passed')
  })

  it('should calculate available space for different container sizes', () => {
    const testCases = [
      { width: 1024, height: 768, name: 'desktop' },
      { width: 768, height: 1024, name: 'tablet-portrait' },
      { width: 1024, height: 768, name: 'tablet-landscape' },
      { width: 375, height: 667, name: 'mobile' }
    ]
    
    testCases.forEach(testCase => {
      const availableSpace = calculateAvailableCardSpace(testCase.width, testCase.height, {
        hasGameInfo: true,
        hasWarnings: false,
        hasStartButton: false,
        hasResultDisplay: false
      })
      
      expect(availableSpace.width).toBeGreaterThan(0)
      expect(availableSpace.height).toBeGreaterThan(0)
      expect(availableSpace.containerWidth).toBe(testCase.width)
      expect(availableSpace.containerHeight).toBe(testCase.height)
      
      console.log(`${testCase.name} available space:`, {
        container: `${testCase.width}x${testCase.height}`,
        available: `${availableSpace.width}x${availableSpace.height}`,
        utilization: `${((availableSpace.width * availableSpace.height) / (testCase.width * testCase.height) * 100).toFixed(1)}%`
      })
    })
  })

  it('should handle position recalculation during resize', () => {
    const originalSize = { width: 1024, height: 768 }
    const newSize = { width: 1200, height: 900 }
    
    // Calculate positions for original size
    const originalAvailableSpace = calculateAvailableCardSpace(originalSize.width, originalSize.height, {
      hasGameInfo: true,
      hasWarnings: false,
      hasStartButton: false,
      hasResultDisplay: false
    })
    
    const originalPositions = calculateBoundaryAwarePositions(6, originalAvailableSpace)
    
    // Calculate positions for new size
    const newAvailableSpace = calculateAvailableCardSpace(newSize.width, newSize.height, {
      hasGameInfo: true,
      hasWarnings: false,
      hasStartButton: false,
      hasResultDisplay: false
    })
    
    const newPositions = calculateBoundaryAwarePositions(6, newAvailableSpace)
    
    // Verify both position sets are valid
    expect(originalPositions).toHaveLength(6)
    expect(newPositions).toHaveLength(6)
    
    // Verify positions are different (layout should adapt to new size)
    const positionsChanged = originalPositions.some((pos, index) => 
      pos.x !== newPositions[index].x || pos.y !== newPositions[index].y
    )
    
    expect(positionsChanged).toBe(true)
    
    console.log('Resize position recalculation:', {
      originalSize: `${originalSize.width}x${originalSize.height}`,
      newSize: `${newSize.width}x${newSize.height}`,
      positionsChanged,
      originalCardSize: `${originalPositions[0].cardWidth}x${originalPositions[0].cardHeight}`,
      newCardSize: `${newPositions[0].cardWidth}x${newPositions[0].cardHeight}`
    })
  })

  it('should perform real-time boundary validation during resize', () => {
    const containerWidth = 800
    const containerHeight = 600
    
    const availableSpace = calculateAvailableCardSpace(containerWidth, containerHeight, {
      hasGameInfo: true,
      hasWarnings: false,
      hasStartButton: false,
      hasResultDisplay: false
    })
    
    const positions = calculateBoundaryAwarePositions(5, availableSpace)
    
    // Perform real-time boundary check
    const boundaryCheck = performRealTimeBoundaryCheck(
      positions,
      containerWidth,
      containerHeight,
      {
        hasGameInfo: true,
        hasWarnings: false,
        hasStartButton: false,
        hasResultDisplay: false
      }
    )
    
    expect(boundaryCheck.validationResult.isValid).toBe(true)
    expect(boundaryCheck.cardCount).toBe(5)
    expect(boundaryCheck.containerDimensions.width).toBe(containerWidth)
    expect(boundaryCheck.containerDimensions.height).toBe(containerHeight)
    expect(boundaryCheck.performanceMetrics.validationTime).toBeGreaterThan(0)
    
    console.log('Real-time boundary validation:', {
      isValid: boundaryCheck.validationResult.isValid,
      violations: boundaryCheck.validationResult.violations.length,
      validationTime: boundaryCheck.performanceMetrics.validationTime.toFixed(2) + 'ms',
      correctionApplied: boundaryCheck.correctionApplied
    })
  })

  it('should handle boundary violations with automatic correction', () => {
    // Create positions that intentionally violate boundaries
    const invalidPositions = [
      { x: -500, y: 0, rotation: 0, cardWidth: 100, cardHeight: 150 },
      { x: 500, y: 0, rotation: 0, cardWidth: 100, cardHeight: 150 },
      { x: 0, y: -300, rotation: 0, cardWidth: 100, cardHeight: 150 },
      { x: 0, y: 300, rotation: 0, cardWidth: 100, cardHeight: 150 }
    ]
    
    const { correctedPositions, checkResult } = validateAndCorrectPositionsRealTime(
      invalidPositions,
      800,
      600,
      {
        hasGameInfo: true,
        hasWarnings: false,
        hasStartButton: false,
        hasResultDisplay: false
      }
    )
    
    // Should detect violations
    expect(checkResult.validationResult.isValid).toBe(false)
    expect(checkResult.validationResult.violations.length).toBeGreaterThan(0)
    expect(checkResult.correctionApplied).toBe(true)
    
    // Corrected positions should be valid
    const correctedCheck = performRealTimeBoundaryCheck(
      correctedPositions,
      800,
      600,
      {
        hasGameInfo: true,
        hasWarnings: false,
        hasStartButton: false,
        hasResultDisplay: false
      }
    )
    
    expect(correctedCheck.validationResult.isValid).toBe(true)
    
    console.log('Boundary violation correction:', {
      originalViolations: checkResult.validationResult.violations.length,
      correctionApplied: checkResult.correctionApplied,
      correctedValid: correctedCheck.validationResult.isValid,
      correctionTime: checkResult.performanceMetrics.correctionTime?.toFixed(2) + 'ms'
    })
  })

  it('should use enhanced fallback system when position calculation fails', () => {
    const containerWidth = 400
    const containerHeight = 300
    
    // Test enhanced fallback
    const fallbackResult = createEnhancedFallback(
      8,
      containerWidth,
      containerHeight,
      'Simulated resize calculation failure'
    )
    
    expect(fallbackResult.positions).toHaveLength(8)
    expect(['safe-grid', 'emergency']).toContain(fallbackResult.fallbackLevel)
    expect(fallbackResult.fallbackReason).toContain('Simulated resize calculation failure')
    expect(fallbackResult.qualityScore).toBeGreaterThan(0)
    expect(fallbackResult.performanceMetrics.calculationTime).toBeGreaterThan(0)
    
    // Test backward compatibility
    const compatibilityPositions = createContainerAwareFallback(8, containerWidth, containerHeight)
    expect(compatibilityPositions).toHaveLength(8)
    
    console.log('Enhanced fallback system:', {
      fallbackLevel: fallbackResult.fallbackLevel,
      qualityScore: fallbackResult.qualityScore,
      calculationTime: fallbackResult.performanceMetrics.calculationTime.toFixed(2) + 'ms',
      backwardCompatible: compatibilityPositions.length === 8
    })
  })

  it('should handle extreme container size changes', () => {
    const extremeCases = [
      { width: 200, height: 150, name: 'tiny' },
      { width: 3840, height: 2160, name: '4K' },
      { width: 1920, height: 1080, name: 'fullHD' },
      { width: 320, height: 568, name: 'small-mobile' }
    ]
    
    extremeCases.forEach(testCase => {
      try {
        const availableSpace = calculateAvailableCardSpace(testCase.width, testCase.height, {
          hasGameInfo: true,
          hasWarnings: false,
          hasStartButton: false,
          hasResultDisplay: false
        })
        
        const positions = calculateBoundaryAwarePositions(6, availableSpace)
        
        expect(positions).toHaveLength(6)
        
        // Verify all positions are valid numbers
        positions.forEach((pos, index) => {
          expect(typeof pos.x).toBe('number')
          expect(typeof pos.y).toBe('number')
          expect(!isNaN(pos.x)).toBe(true)
          expect(!isNaN(pos.y)).toBe(true)
          expect(pos.cardWidth).toBeGreaterThan(0)
          expect(pos.cardHeight).toBeGreaterThan(0)
        })
        
        console.log(`${testCase.name} container handling:`, {
          size: `${testCase.width}x${testCase.height}`,
          availableSpace: `${availableSpace.width}x${availableSpace.height}`,
          cardSize: `${positions[0].cardWidth}x${positions[0].cardHeight}`,
          positionsValid: positions.length === 6
        })
      } catch (error) {
        console.error(`Failed to handle ${testCase.name} container:`, error)
        throw error
      }
    })
  })

  it('should maintain position array integrity during resize', () => {
    const cardCounts = [3, 5, 6, 8, 10]
    const containerSizes = [
      { width: 800, height: 600 },
      { width: 1024, height: 768 },
      { width: 1200, height: 900 }
    ]
    
    cardCounts.forEach(cardCount => {
      containerSizes.forEach(containerSize => {
        const availableSpace = calculateAvailableCardSpace(containerSize.width, containerSize.height, {
          hasGameInfo: true,
          hasWarnings: false,
          hasStartButton: false,
          hasResultDisplay: false
        })
        
        const positions = calculateBoundaryAwarePositions(cardCount, availableSpace)
        
        // Verify array integrity
        expect(positions).toHaveLength(cardCount)
        expect(positions.every(pos => pos !== undefined)).toBe(true)
        expect(positions.every(pos => typeof pos.x === 'number')).toBe(true)
        expect(positions.every(pos => typeof pos.y === 'number')).toBe(true)
        expect(positions.every(pos => !isNaN(pos.x))).toBe(true)
        expect(positions.every(pos => !isNaN(pos.y))).toBe(true)
      })
    })
    
    console.log('Position array integrity test passed for all combinations')
  })
})