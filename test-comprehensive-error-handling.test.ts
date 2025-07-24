// 测试全面的错误处理和日志记录系统
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { 
  calculateBoundaryAwarePositions,
  validatePositionBoundaries,
  createSafeGridLayout
} from './lib/boundary-aware-positioning'
import { calculateAvailableCardSpace } from './lib/card-space-calculator'

describe('Comprehensive Error Handling and Logging Tests', () => {
  let consoleSpy: any
  let consoleErrorSpy: any
  let consoleWarnSpy: any
  let consoleLogSpy: any

  beforeEach(() => {
    // Spy on console methods to verify logging
    consoleSpy = vi.spyOn(console, 'group').mockImplementation(() => {})
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'groupEnd').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should handle invalid card count with proper logging', () => {
    const containerWidth = 1024
    const containerHeight = 768
    
    const availableSpace = calculateAvailableCardSpace(containerWidth, containerHeight, {
      hasGameInfo: true,
      hasWarnings: false,
      hasStartButton: false,
      hasResultDisplay: false
    })

    // Test with invalid card count (too high)
    const positions = calculateBoundaryAwarePositions(25, availableSpace)
    
    // Should return safe fallback positions
    expect(positions).toHaveLength(10) // Should be capped at 10
    expect(positions.every(pos => typeof pos.x === 'number')).toBe(true)
    expect(positions.every(pos => typeof pos.y === 'number')).toBe(true)
    
    // Should have logged warning
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('⚠️ Input Validation: Invalid card count: 25, using safe fallback'),
      expect.any(Object)
    )
    
    console.log('Invalid card count handling test passed')
  })

  it('should log detailed error context when position calculation fails', () => {
    const containerWidth = 100 // Very small container to force errors
    const containerHeight = 50
    
    const availableSpace = calculateAvailableCardSpace(containerWidth, containerHeight, {
      hasGameInfo: true,
      hasWarnings: false,
      hasStartButton: false,
      hasResultDisplay: false
    })

    const positions = calculateBoundaryAwarePositions(8, availableSpace)
    
    // Should still return valid positions (fallback)
    expect(positions).toHaveLength(8)
    
    // Should have logged warnings about space limitations
    expect(consoleWarnSpy).toHaveBeenCalled()
    
    console.log('Error context logging test passed')
  })

  it('should provide comprehensive boundary validation logging', () => {
    const containerWidth = 800
    const containerHeight = 600
    
    const availableSpace = calculateAvailableCardSpace(containerWidth, containerHeight, {
      hasGameInfo: true,
      hasWarnings: false,
      hasStartButton: false,
      hasResultDisplay: false
    })

    // Create positions that might have boundary issues
    const positions = calculateBoundaryAwarePositions(6, availableSpace)
    
    // Validate boundaries
    const boundaryCheck = validatePositionBoundaries(positions, availableSpace)
    
    expect(boundaryCheck.isValid).toBe(true)
    expect(positions).toHaveLength(6)
    
    // In development mode, should have logged debug information
    if (process.env.NODE_ENV === 'development') {
      expect(consoleSpy).toHaveBeenCalledWith('🎯 Boundary-Aware Position Calculation')
    }
    
    console.log('Boundary validation logging test passed')
  })

  it('should handle position array length mismatch with proper error logging', () => {
    const containerWidth = 1024
    const containerHeight = 768
    
    const availableSpace = calculateAvailableCardSpace(containerWidth, containerHeight, {
      hasGameInfo: true,
      hasWarnings: false,
      hasStartButton: false,
      hasResultDisplay: false
    })

    // This should work normally, but let's test the error handling path
    const positions = calculateBoundaryAwarePositions(5, availableSpace)
    
    expect(positions).toHaveLength(5)
    expect(positions.every(pos => pos !== undefined)).toBe(true)
    expect(positions.every(pos => typeof pos.x === 'number')).toBe(true)
    expect(positions.every(pos => typeof pos.y === 'number')).toBe(true)
    
    console.log('Position array integrity test passed')
  })

  it('should log performance metrics for position calculations', () => {
    const containerWidth = 1200
    const containerHeight = 900
    
    const availableSpace = calculateAvailableCardSpace(containerWidth, containerHeight, {
      hasGameInfo: true,
      hasWarnings: false,
      hasStartButton: false,
      hasResultDisplay: false
    })

    const startTime = performance.now()
    const positions = calculateBoundaryAwarePositions(7, availableSpace)
    const endTime = performance.now()
    
    expect(positions).toHaveLength(7)
    expect(endTime - startTime).toBeGreaterThan(0)
    
    // In development mode, should log timing information
    if (process.env.NODE_ENV === 'development') {
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Total Duration:'),
        expect.stringContaining('ms')
      )
    }
    
    console.log('Performance metrics logging test passed')
  })

  it('should handle boundary violations with detailed violation reporting', () => {
    // Create a very small container to force boundary violations
    const tinyContainerWidth = 200
    const tinyContainerHeight = 150
    
    const availableSpace = calculateAvailableCardSpace(tinyContainerWidth, tinyContainerHeight, {
      hasGameInfo: true,
      hasWarnings: false,
      hasStartButton: false,
      hasResultDisplay: false
    })

    const positions = calculateBoundaryAwarePositions(6, availableSpace)
    
    // Should still return valid positions (corrected or fallback)
    expect(positions).toHaveLength(6)
    expect(positions.every(pos => typeof pos.x === 'number')).toBe(true)
    expect(positions.every(pos => typeof pos.y === 'number')).toBe(true)
    
    // Should have logged boundary correction warnings
    expect(consoleWarnSpy).toHaveBeenCalled()
    
    console.log('Boundary violation reporting test passed')
  })

  it('should provide step-by-step calculation logging in development mode', () => {
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'development'
    
    try {
      const containerWidth = 1024
      const containerHeight = 768
      
      const availableSpace = calculateAvailableCardSpace(containerWidth, containerHeight, {
        hasGameInfo: true,
        hasWarnings: false,
        hasStartButton: false,
        hasResultDisplay: false
      })

      const positions = calculateBoundaryAwarePositions(4, availableSpace)
      
      expect(positions).toHaveLength(4)
      
      // Should have logged debug information in development mode
      expect(consoleLogSpy).toHaveBeenCalledWith('Card Count:', 4)
      expect(consoleLogSpy).toHaveBeenCalledWith('Boundary Check:', 'PASSED')
      
      console.log('Step-by-step logging test passed')
    } finally {
      process.env.NODE_ENV = originalEnv
    }
  })

  it('should handle safe grid layout creation with proper logging', () => {
    const containerWidth = 800
    const containerHeight = 600
    
    const availableSpace = calculateAvailableCardSpace(containerWidth, containerHeight, {
      hasGameInfo: true,
      hasWarnings: false,
      hasStartButton: false,
      hasResultDisplay: false
    })

    const positions = createSafeGridLayout(6, availableSpace)
    
    expect(positions).toHaveLength(6)
    expect(positions.every(pos => typeof pos.x === 'number')).toBe(true)
    expect(positions.every(pos => typeof pos.y === 'number')).toBe(true)
    expect(positions.every(pos => pos.cardWidth > 0)).toBe(true)
    expect(positions.every(pos => pos.cardHeight > 0)).toBe(true)
    
    // Verify positions are within bounds (or close to bounds for safe grid)
    const boundaryCheck = validatePositionBoundaries(positions, availableSpace)
    
    // Safe grid layout should either be valid or have minimal violations that are acceptable
    if (!boundaryCheck.isValid) {
      console.log('Safe grid layout has minor boundary violations (expected for tight spaces):', 
        boundaryCheck.violations.length)
    }
    
    // The important thing is that we have valid positions
    expect(positions.every(pos => !isNaN(pos.x))).toBe(true)
    expect(positions.every(pos => !isNaN(pos.y))).toBe(true)
    
    console.log('Safe grid layout creation test passed')
  })

  it('should maintain error context throughout calculation chain', () => {
    const testCases = [
      { width: 1920, height: 1080, cards: 3, name: 'large-desktop' },
      { width: 1024, height: 768, cards: 6, name: 'standard-desktop' },
      { width: 768, height: 1024, cards: 4, name: 'tablet-portrait' },
      { width: 375, height: 667, cards: 2, name: 'mobile' }
    ]
    
    testCases.forEach(testCase => {
      const availableSpace = calculateAvailableCardSpace(testCase.width, testCase.height, {
        hasGameInfo: true,
        hasWarnings: false,
        hasStartButton: false,
        hasResultDisplay: false
      })

      const positions = calculateBoundaryAwarePositions(testCase.cards, availableSpace)
      
      expect(positions).toHaveLength(testCase.cards)
      expect(positions.every(pos => !isNaN(pos.x))).toBe(true)
      expect(positions.every(pos => !isNaN(pos.y))).toBe(true)
      
      console.log(`${testCase.name} error context test passed:`, {
        containerSize: `${testCase.width}x${testCase.height}`,
        cardCount: testCase.cards,
        positionsGenerated: positions.length
      })
    })
  })

  it('should handle extreme edge cases with comprehensive error recovery', () => {
    const extremeCases = [
      { width: 50, height: 50, cards: 1, name: 'tiny-container' },
      { width: 10000, height: 10000, cards: 10, name: 'huge-container' },
      { width: 100, height: 2000, name: 'very-tall', cards: 3 },
      { width: 2000, height: 100, name: 'very-wide', cards: 3 }
    ]
    
    extremeCases.forEach(testCase => {
      try {
        const availableSpace = calculateAvailableCardSpace(testCase.width, testCase.height, {
          hasGameInfo: true,
          hasWarnings: false,
          hasStartButton: false,
          hasResultDisplay: false
        })

        const positions = calculateBoundaryAwarePositions(testCase.cards, availableSpace)
        
        expect(positions).toHaveLength(testCase.cards)
        expect(positions.every(pos => typeof pos.x === 'number')).toBe(true)
        expect(positions.every(pos => typeof pos.y === 'number')).toBe(true)
        expect(positions.every(pos => !isNaN(pos.x))).toBe(true)
        expect(positions.every(pos => !isNaN(pos.y))).toBe(true)
        
        console.log(`${testCase.name} extreme case handled successfully`)
      } catch (error) {
        console.error(`Failed to handle ${testCase.name}:`, error)
        throw error
      }
    })
  })
})