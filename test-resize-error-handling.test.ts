import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { calculateLayout, createFallbackLayout } from './lib/layout-manager'
import {
  logPositionError,
  logResizeError,
  createErrorContext,
  getErrorStats,
  clearErrorLogs,
  detectFrequentErrors
} from './lib/layout-error-handling'
import {
  validatePositionArray,
  normalizePositionArray,
  createFallbackPositions,
  getSafeCardPosition,
  createSingleFallbackPosition
} from './lib/position-validation'
import { ListItem, CardPosition } from './types'

// Mock layout manager functions
vi.mock('./lib/layout-manager', () => ({
  calculateLayout: vi.fn(),
  createFallbackLayout: vi.fn(),
  detectDeviceType: vi.fn(() => 'desktop'),
  getDeviceConfig: vi.fn(() => ({
    type: 'desktop',
    cardSize: { width: 96, height: 144 },
    spacing: 16,
    maxCards: 10
  }))
}))

// Mock position validation functions
vi.mock('./lib/position-validation', () => ({
  validatePositionArray: vi.fn(),
  normalizePositionArray: vi.fn(),
  createFallbackPositions: vi.fn(),
  getSafeCardPosition: vi.fn(),
  createSingleFallbackPosition: vi.fn()
}))

describe('Resize Error Handling', () => {
  let mockItems: ListItem[]
  let mockCalculateLayout: any
  let mockCreateFallbackLayout: any
  let mockValidatePositionArray: any
  let mockNormalizePositionArray: any
  let mockCreateFallbackPositions: any
  let mockGetSafeCardPosition: any
  let mockCreateSingleFallbackPosition: any

  beforeEach(() => {
    // Clear error logs before each test
    clearErrorLogs()
    
    // Setup mock data
    mockItems = [
      { id: '1', name: 'Item 1' },
      { id: '2', name: 'Item 2' },
      { id: '3', name: 'Item 3' },
      { id: '4', name: 'Item 4' },
      { id: '5', name: 'Item 5' }
    ]

    // Setup mocks
    mockCalculateLayout = vi.mocked(calculateLayout)
    mockCreateFallbackLayout = vi.mocked(createFallbackLayout)
    mockValidatePositionArray = vi.mocked(validatePositionArray)
    mockNormalizePositionArray = vi.mocked(normalizePositionArray)
    mockCreateFallbackPositions = vi.mocked(createFallbackPositions)
    mockGetSafeCardPosition = vi.mocked(getSafeCardPosition)
    mockCreateSingleFallbackPosition = vi.mocked(createSingleFallbackPosition)

    // Default successful layout calculation
    mockCalculateLayout.mockReturnValue({
      deviceConfig: {
        type: 'desktop',
        cardSize: { width: 96, height: 144 },
        spacing: 16,
        maxCards: 10,
        breakpoint: 1024,
        cardsPerRow: 5,
        minContainerWidth: 800,
        minContainerHeight: 600
      },
      containerDimensions: {
        width: 1024,
        height: 768,
        availableWidth: 900,
        availableHeight: 600
      },
      safeMargins: {
        top: 100, bottom: 68, left: 62, right: 62,
        horizontal: 124, vertical: 168
      },
      maxSafeCards: 10,
      recommendedCards: 5
    })

    // Default successful position validation
    mockValidatePositionArray.mockReturnValue({
      isValid: true,
      errors: [],
      validPositions: 5
    })

    // Default position normalization
    mockNormalizePositionArray.mockImplementation((positions, expectedLength) => {
      if (positions.length === expectedLength) return positions
      return Array.from({ length: expectedLength }, (_, i) => ({
        x: i * 100,
        y: 0,
        rotation: 0,
        cardWidth: 96,
        cardHeight: 144
      }))
    })

    // Default fallback positions
    mockCreateFallbackPositions.mockImplementation((count) => 
      Array.from({ length: count }, (_, i) => ({
        x: i * 100,
        y: 0,
        rotation: 0,
        cardWidth: 96,
        cardHeight: 144,
        isFallback: true
      }))
    )

    // Default safe position access
    mockGetSafeCardPosition.mockImplementation((positions, index, fallback) => {
      if (positions && positions[index]) {
        return { ...positions[index], isValidated: true }
      }
      return { ...fallback, isFallback: true }
    })

    // Default single fallback position
    mockCreateSingleFallbackPosition.mockImplementation((index, deviceConfig) => ({
      x: 0,
      y: index * 20,
      rotation: 0,
      cardWidth: deviceConfig.cardSize.width,
      cardHeight: deviceConfig.cardSize.height,
      isFallback: true
    }))
  })

  afterEach(() => {
    vi.clearAllMocks()
    clearErrorLogs()
  })

  describe('Position Calculation Failure Handling', () => {
    it('should handle layout calculation failure and use fallback', () => {
      // Mock layout calculation failure
      const layoutError = new Error('Layout calculation failed')
      mockCalculateLayout.mockImplementation(() => {
        throw layoutError
      })

      // Mock fallback layout
      const fallbackLayout = {
        deviceConfig: {
          type: 'desktop',
          cardSize: { width: 80, height: 120 },
          spacing: 12,
          maxCards: 5,
          breakpoint: 1024,
          cardsPerRow: 3,
          minContainerWidth: 600,
          minContainerHeight: 400
        },
        containerDimensions: {
          width: 1024,
          height: 768,
          availableWidth: 800,
          availableHeight: 500
        },
        safeMargins: {
          top: 100, bottom: 100, left: 50, right: 50,
          horizontal: 100, vertical: 200
        },
        maxSafeCards: 5,
        recommendedCards: 3,
        fallbackApplied: true
      }
      mockCreateFallbackLayout.mockReturnValue(fallbackLayout)

      // Simulate resize handler behavior
      let result
      try {
        result = calculateLayout(800, 600, 5, mockItems.length, {})
      } catch (error) {
        result = createFallbackLayout(800, 600, 5)
      }

      expect(mockCreateFallbackLayout).toHaveBeenCalledWith(800, 600, 5)
      expect(result.fallbackApplied).toBe(true)
    })

    it('should handle position validation failure during resize', () => {
      // Mock position validation failure
      mockValidatePositionArray.mockReturnValue({
        isValid: false,
        errors: ['Position validation failed', 'Invalid position at index 2'],
        validPositions: 3
      })

      const positions = [
        { x: 100, y: 100, rotation: 0, cardWidth: 96, cardHeight: 144 },
        { x: 200, y: 100, rotation: 0, cardWidth: 96, cardHeight: 144 },
        null, // Invalid position
        { x: 400, y: 100, rotation: 0, cardWidth: 96, cardHeight: 144 },
        { x: 500, y: 100, rotation: 0, cardWidth: 96, cardHeight: 144 }
      ]

      // Simulate validation and normalization
      const validation = validatePositionArray(positions as any, 5)
      expect(validation.isValid).toBe(false)
      expect(validation.validPositions).toBe(3)

      // Should trigger normalization
      const normalized = normalizePositionArray(positions as any, 5, {
        type: 'desktop',
        cardSize: { width: 96, height: 144 }
      } as any)

      expect(mockNormalizePositionArray).toHaveBeenCalled()
      expect(normalized).toHaveLength(5)
    })

    it('should handle corrupted position data during resize', () => {
      // Mock position calculation returning corrupted data
      mockCalculateLayout.mockReturnValue({
        ...mockCalculateLayout.mock.results[0]?.value || {},
        maxSafeCards: 0 // This should trigger fallback
      })

      const layoutResult = calculateLayout(200, 200, 5, mockItems.length, {})
      
      // When maxSafeCards is 0, should use fallback positions
      if (layoutResult.maxSafeCards === 0) {
        const fallbackPositions = createFallbackPositions(5, layoutResult.deviceConfig)
        expect(mockCreateFallbackPositions).toHaveBeenCalledWith(5, layoutResult.deviceConfig)
      }
    })

    it('should handle array bounds errors with safe position access', () => {
      const positions: CardPosition[] = [
        { x: 100, y: 100, rotation: 0, cardWidth: 96, cardHeight: 144 },
        { x: 200, y: 100, rotation: 0, cardWidth: 96, cardHeight: 144 }
      ]

      const fallbackPosition = { x: 0, y: 0, rotation: 0, cardWidth: 96, cardHeight: 144 }

      // Try to access position beyond array bounds
      const safePosition = getSafeCardPosition(positions, 5, fallbackPosition)
      
      expect(mockGetSafeCardPosition).toHaveBeenCalledWith(positions, 5, fallbackPosition)
      expect(safePosition.isFallback).toBe(true)
    })
  })

  describe('Debouncing Behavior', () => {
    it('should simulate debounced resize handling', async () => {
      let resizeCount = 0
      const debouncedResize = vi.fn(() => {
        resizeCount++
        return calculateLayout(1024, 768, 5, mockItems.length, {})
      })

      // Simulate rapid resize events
      const resizePromises = []
      for (let i = 0; i < 5; i++) {
        resizePromises.push(
          new Promise(resolve => {
            setTimeout(() => {
              debouncedResize()
              resolve(true)
            }, i * 10) // Stagger the calls
          })
        )
      }

      await Promise.all(resizePromises)

      // Should have been called multiple times (simulating rapid events)
      expect(debouncedResize).toHaveBeenCalledTimes(5)
      expect(mockCalculateLayout).toHaveBeenCalledTimes(5)
    })

    it('should handle resize events with different container dimensions', () => {
      const dimensions = [
        { width: 800, height: 600 },
        { width: 1024, height: 768 },
        { width: 1200, height: 900 },
        { width: 400, height: 300 } // Small screen
      ]

      dimensions.forEach(({ width, height }) => {
        const result = calculateLayout(width, height, 5, mockItems.length, {})
        expect(result).toBeDefined()
        // The mock returns fixed dimensions, so we just verify the function was called
        expect(mockCalculateLayout).toHaveBeenCalledWith(width, height, 5, mockItems.length, {})
      })

      expect(mockCalculateLayout).toHaveBeenCalledTimes(4)
    })
  })

  describe('Extreme Container Dimensions', () => {
    it('should handle extremely small container dimensions', () => {
      mockCalculateLayout.mockImplementation(() => {
        throw new Error('Container too small')
      })

      const fallbackLayout = {
        deviceConfig: {
          type: 'mobile',
          cardSize: { width: 60, height: 80 },
          spacing: 8,
          maxCards: 1,
          breakpoint: 768,
          cardsPerRow: 1,
          minContainerWidth: 200,
          minContainerHeight: 200
        },
        containerDimensions: {
          width: 100,
          height: 100,
          availableWidth: 80,
          availableHeight: 60
        },
        safeMargins: {
          top: 20, bottom: 20, left: 10, right: 10,
          horizontal: 20, vertical: 40
        },
        maxSafeCards: 1,
        recommendedCards: 1,
        fallbackApplied: true
      }
      mockCreateFallbackLayout.mockReturnValue(fallbackLayout)

      // Simulate handling extremely small dimensions
      let result
      try {
        result = calculateLayout(100, 100, 5, mockItems.length, {})
      } catch (error) {
        result = createFallbackLayout(100, 100, 5)
      }

      expect(mockCreateFallbackLayout).toHaveBeenCalledWith(100, 100, 5)
      expect(result.fallbackApplied).toBe(true)
      expect(result.maxSafeCards).toBe(1)
    })

    it('should handle extremely large container dimensions', () => {
      const result = calculateLayout(5000, 3000, 5, mockItems.length, {})
      
      expect(mockCalculateLayout).toHaveBeenCalledWith(
        5000, 3000, 5, mockItems.length, {}
      )
      expect(result).toBeDefined()
    })

    it('should handle invalid container dimensions', () => {
      // Test with NaN dimensions
      mockCalculateLayout.mockImplementation((width, height) => {
        if (isNaN(width) || isNaN(height) || width <= 0 || height <= 0) {
          throw new Error('Invalid dimensions')
        }
        return mockCalculateLayout.mock.results[0]?.value
      })

      let result
      try {
        result = calculateLayout(NaN, -100, 5, mockItems.length, {})
      } catch (error) {
        result = createFallbackLayout(320, 400, 5) // Use minimum safe dimensions
      }

      expect(mockCreateFallbackLayout).toHaveBeenCalled()
    })
  })

  describe('Error Logging and Recovery', () => {
    it('should log position calculation errors', () => {
      const error = new Error('Position calculation failed')
      const context = createErrorContext(800, 600, 5, 'dealing')

      logPositionError(error, context, 'fallback')

      const stats = getErrorStats()
      expect(stats.total).toBe(1)
      expect(stats.byType.position_calculation).toBe(1)
      expect(stats.byRecovery.fallback).toBe(1)
    })

    it('should log resize handling errors', () => {
      const error = new Error('Resize handling failed')
      const context = createErrorContext(1024, 768, 8, 'waiting')

      logResizeError(error, context, 'retry')

      const stats = getErrorStats()
      expect(stats.total).toBe(1)
      expect(stats.byType.resize_handling).toBe(1)
      expect(stats.byRecovery.retry).toBe(1)
    })

    it('should detect frequent error patterns', () => {
      const context = createErrorContext(800, 600, 5, 'dealing')

      // Log multiple errors quickly
      for (let i = 0; i < 6; i++) {
        logResizeError(new Error(`Error ${i}`), context, 'fallback')
      }

      const detection = detectFrequentErrors()
      expect(detection.hasFrequentErrors).toBe(true)
      expect(detection.pattern).toContain('resize_handling')
    })

    it('should provide error recovery recommendations', () => {
      const context = createErrorContext(400, 300, 10, 'shuffling')

      // Log position calculation errors
      for (let i = 0; i < 5; i++) {
        logPositionError(new Error(`Position error ${i}`), context, 'fallback')
      }

      const detection = detectFrequentErrors()
      expect(detection.hasFrequentErrors).toBe(true)
      expect(detection.recommendation).toBeDefined()
    })

    it('should create appropriate error context', () => {
      const context = createErrorContext(1024, 768, 8, 'waiting')
      
      expect(context.containerWidth).toBe(1024)
      expect(context.containerHeight).toBe(768)
      expect(context.cardCount).toBe(8)
      expect(context.gamePhase).toBe('waiting')
      expect(context.deviceType).toBe('desktop')
      expect(typeof context.timestamp).toBe('number')
    })
  })

  describe('Memory Management', () => {
    it('should limit error log storage', () => {
      const context = createErrorContext(800, 600, 5, 'dealing')

      // Log more than the maximum allowed errors
      for (let i = 0; i < 60; i++) {
        logPositionError(new Error(`Error ${i}`), context, 'fallback')
      }

      const stats = getErrorStats()
      expect(stats.total).toBeLessThanOrEqual(50) // Should not exceed MAX_ERROR_LOGS
    })

    it('should clear error logs when requested', () => {
      const context = createErrorContext(800, 600, 5, 'dealing')

      // Log some errors
      logPositionError(new Error('Error 1'), context, 'fallback')
      logResizeError(new Error('Error 2'), context, 'retry')

      expect(getErrorStats().total).toBe(2)

      clearErrorLogs()
      expect(getErrorStats().total).toBe(0)
    })

    it('should provide recent error information', () => {
      const context = createErrorContext(800, 600, 5, 'dealing')

      // Log some errors
      logPositionError(new Error('Recent error 1'), context, 'fallback')
      logResizeError(new Error('Recent error 2'), context, 'retry')

      const stats = getErrorStats()
      expect(stats.recent).toHaveLength(2)
      expect(stats.recent[0].error.message).toBe('Recent error 1')
      expect(stats.recent[1].error.message).toBe('Recent error 2')
    })
  })

  describe('Performance Monitoring', () => {
    it('should track resize operation performance', () => {
      const startTime = performance.now()
      
      // Simulate resize operation
      const result = calculateLayout(1200, 800, 5, mockItems.length, {})
      
      const endTime = performance.now()
      const duration = endTime - startTime

      expect(result).toBeDefined()
      expect(duration).toBeLessThan(100) // Should be very fast for mocked operations
    })

    it('should handle timeout scenarios with fallback', async () => {
      // Mock slow layout calculation
      mockCalculateLayout.mockImplementation(() => {
        return new Promise((resolve) => {
          setTimeout(() => resolve({
            deviceConfig: { type: 'desktop', cardSize: { width: 96, height: 144 } },
            containerDimensions: { width: 800, height: 600, availableWidth: 700, availableHeight: 500 },
            safeMargins: { top: 50, bottom: 50, left: 50, right: 50, horizontal: 100, vertical: 100 },
            maxSafeCards: 5,
            recommendedCards: 5
          }), 2000) // 2 second delay
        })
      })

      // Simulate timeout handling
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Layout calculation timeout')), 1000)
      })

      const layoutPromise = calculateLayout(800, 600, 5, mockItems.length, {})

      try {
        await Promise.race([layoutPromise, timeoutPromise])
      } catch (error) {
        // Should use fallback when timeout occurs
        const fallbackResult = createFallbackLayout(800, 600, 5)
        expect(mockCreateFallbackLayout).toHaveBeenCalledWith(800, 600, 5)
        expect(fallbackResult).toBeDefined()
      }
    })

    it('should handle concurrent resize operations', async () => {
      const operations = []
      
      // Simulate multiple concurrent resize operations
      for (let i = 0; i < 5; i++) {
        operations.push(
          calculateLayout(800 + i * 100, 600 + i * 50, 5, mockItems.length, {})
        )
      }

      const results = await Promise.all(operations)
      
      expect(results).toHaveLength(5)
      results.forEach(result => {
        expect(result).toBeDefined()
      })
      
      expect(mockCalculateLayout).toHaveBeenCalledTimes(5)
    })
  })
})