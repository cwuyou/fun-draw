import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  enablePositionDebug,
  disablePositionDebug,
  startPositionCalculation,
  endPositionCalculation,
  logPositionValidationError,
  logPositionValidationWarning,
  logDeviceTransition,
  logFallbackApplied,
  getPositionDebugSummary,
  getPositionCalculationHistory,
  clearPositionDebugHistory,
  exportPositionDebugData,
  getLayoutDebugInfo
} from './lib/position-debug'
import { CardPosition, PositionCalculationContext, LayoutCalculationResult } from './types'

// Mock window and performance objects
Object.defineProperty(window, 'innerWidth', {
  writable: true,
  configurable: true,
  value: 1024,
})

Object.defineProperty(window, 'innerHeight', {
  writable: true,
  configurable: true,
  value: 768,
})

Object.defineProperty(global, 'performance', {
  writable: true,
  value: {
    now: vi.fn(() => Date.now())
  }
})

describe('Position Debug Tools', () => {
  beforeEach(() => {
    clearPositionDebugHistory()
    enablePositionDebug()
    vi.clearAllMocks()
  })

  describe('Debug Configuration', () => {
    it('should enable debug mode', () => {
      enablePositionDebug({ logLevel: 'debug' })
      
      const summary = getPositionDebugSummary()
      expect(summary).toBeDefined()
    })

    it('should disable debug mode', () => {
      disablePositionDebug()
      
      // When disabled, functions should not track data
      const calculationId = startPositionCalculation({
        containerWidth: 1024,
        containerHeight: 768,
        cardCount: 5,
        deviceType: 'desktop',
        timestamp: Date.now(),
        fallbackApplied: false
      })
      
      expect(calculationId).toBe('')
    })
  })

  describe('Position Calculation Tracking', () => {
    it('should track position calculation lifecycle', () => {
      const context: PositionCalculationContext = {
        containerWidth: 1024,
        containerHeight: 768,
        cardCount: 5,
        deviceType: 'desktop',
        timestamp: Date.now(),
        fallbackApplied: false
      }

      const calculationId = startPositionCalculation(context, 'resize')
      expect(calculationId).toMatch(/^calc_\d+_[a-z0-9]+$/)

      const positions: CardPosition[] = [
        { x: 0, y: 0, rotation: 0, cardWidth: 96, cardHeight: 144 },
        { x: 100, y: 0, rotation: 5, cardWidth: 96, cardHeight: 144 },
        { x: -100, y: 0, rotation: -5, cardWidth: 96, cardHeight: 144 }
      ]

      const layoutResult: LayoutCalculationResult = {
        deviceConfig: {
          type: 'desktop',
          breakpoint: 1024,
          maxCards: 10,
          cardSize: { width: 96, height: 144 },
          spacing: 16,
          cardsPerRow: 5,
          minContainerWidth: 320,
          minContainerHeight: 240
        },
        containerDimensions: {
          width: 1024,
          height: 768,
          availableWidth: 924,
          availableHeight: 568
        },
        safeMargins: {
          top: 100,
          bottom: 100,
          left: 50,
          right: 50,
          horizontal: 100,
          vertical: 200
        },
        maxSafeCards: 8,
        recommendedCards: 5,
        fallbackApplied: false
      }

      endPositionCalculation(calculationId, positions, layoutResult, [], [], {
        triggeredBy: 'resize',
        fallbackApplied: false
      })

      const history = getPositionCalculationHistory(1)
      expect(history).toHaveLength(1)
      expect(history[0].id).toBe(calculationId)
      expect(history[0].input.cardCount).toBe(3)
      expect(history[0].metadata.triggeredBy).toBe('resize')
    })

    it('should track calculation errors and warnings', () => {
      const context: PositionCalculationContext = {
        containerWidth: 1024,
        containerHeight: 768,
        cardCount: 3,
        deviceType: 'desktop',
        timestamp: Date.now(),
        fallbackApplied: false
      }

      const calculationId = startPositionCalculation(context)
      
      const positions: CardPosition[] = [
        { x: 0, y: 0, rotation: 0, cardWidth: 96, cardHeight: 144 }
      ]

      const errors = ['Position calculation failed for card 2']
      const warnings = ['Using fallback position for card 3']

      endPositionCalculation(calculationId, positions, undefined, errors, warnings)

      const history = getPositionCalculationHistory(1)
      expect(history[0].output.errors).toEqual(errors)
      expect(history[0].output.warnings).toEqual(warnings)
    })
  })

  describe('Validation Logging', () => {
    it('should log position validation errors', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      logPositionValidationError(
        { x: undefined, y: 0 },
        1,
        'Missing x coordinate',
        { containerWidth: 1024 }
      )

      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })

    it('should log position validation warnings', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      
      const position: CardPosition = {
        x: 0,
        y: 0,
        rotation: 0,
        cardWidth: 96,
        cardHeight: 144
      }

      logPositionValidationWarning(
        position,
        0,
        'Position near container edge',
        { containerWidth: 1024 }
      )

      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })
  })

  describe('Device Transition Logging', () => {
    it('should log device type transitions', () => {
      const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {})
      
      logDeviceTransition('mobile', 'desktop', { width: 1024, height: 768 })

      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })
  })

  describe('Fallback Logging', () => {
    it('should log fallback applications', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      
      logFallbackApplied(
        'Position calculation failed',
        'position',
        { cardIndex: 2 }
      )

      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })
  })

  describe('Debug Summary', () => {
    it('should generate debug summary with statistics', () => {
      // Create some calculation history
      const context: PositionCalculationContext = {
        containerWidth: 1024,
        containerHeight: 768,
        cardCount: 5,
        deviceType: 'desktop',
        timestamp: Date.now(),
        fallbackApplied: false
      }

      // First calculation - normal
      let calculationId = startPositionCalculation(context, 'initial')
      let positions: CardPosition[] = [
        { x: 0, y: 0, rotation: 0, cardWidth: 96, cardHeight: 144 }
      ]
      endPositionCalculation(calculationId, positions)

      // Second calculation - with fallback
      calculationId = startPositionCalculation(context, 'resize')
      positions = [
        { x: 0, y: 0, rotation: 0, cardWidth: 96, cardHeight: 144, isFallback: true }
      ]
      endPositionCalculation(calculationId, positions, undefined, [], [], {
        triggeredBy: 'resize',
        fallbackApplied: true,
        deviceTransition: { from: 'mobile', to: 'desktop' }
      })

      const summary = getPositionDebugSummary()
      
      expect(summary.totalCalculations).toBe(2)
      expect(summary.fallbackRate).toBe(0.5) // 1 out of 2 calculations used fallback
      expect(summary.deviceTransitions).toHaveLength(1)
      expect(summary.deviceTransitions[0]).toEqual({
        from: 'mobile',
        to: 'desktop',
        count: 1
      })
    })
  })

  describe('History Management', () => {
    it('should maintain calculation history', () => {
      const context: PositionCalculationContext = {
        containerWidth: 1024,
        containerHeight: 768,
        cardCount: 3,
        deviceType: 'desktop',
        timestamp: Date.now(),
        fallbackApplied: false
      }

      // Add multiple calculations
      for (let i = 0; i < 5; i++) {
        const calculationId = startPositionCalculation(context)
        const positions: CardPosition[] = [
          { x: i * 10, y: 0, rotation: 0, cardWidth: 96, cardHeight: 144 }
        ]
        endPositionCalculation(calculationId, positions)
      }

      const history = getPositionCalculationHistory()
      expect(history).toHaveLength(5)
      
      // Test limited history
      const limitedHistory = getPositionCalculationHistory(3)
      expect(limitedHistory).toHaveLength(3)
    })

    it('should clear calculation history', () => {
      const context: PositionCalculationContext = {
        containerWidth: 1024,
        containerHeight: 768,
        cardCount: 1,
        deviceType: 'desktop',
        timestamp: Date.now(),
        fallbackApplied: false
      }

      const calculationId = startPositionCalculation(context)
      const positions: CardPosition[] = [
        { x: 0, y: 0, rotation: 0, cardWidth: 96, cardHeight: 144 }
      ]
      endPositionCalculation(calculationId, positions)

      expect(getPositionCalculationHistory()).toHaveLength(1)
      
      clearPositionDebugHistory()
      expect(getPositionCalculationHistory()).toHaveLength(0)
    })
  })

  describe('Data Export', () => {
    it('should export debug data as JSON', () => {
      const context: PositionCalculationContext = {
        containerWidth: 1024,
        containerHeight: 768,
        cardCount: 1,
        deviceType: 'desktop',
        timestamp: Date.now(),
        fallbackApplied: false
      }

      const calculationId = startPositionCalculation(context)
      const positions: CardPosition[] = [
        { x: 0, y: 0, rotation: 0, cardWidth: 96, cardHeight: 144 }
      ]
      endPositionCalculation(calculationId, positions)

      const exportData = exportPositionDebugData()
      expect(() => JSON.parse(exportData)).not.toThrow()
      
      const parsed = JSON.parse(exportData)
      expect(parsed).toHaveProperty('config')
      expect(parsed).toHaveProperty('history')
      expect(parsed).toHaveProperty('summary')
      expect(parsed).toHaveProperty('exportTime')
    })
  })

  describe('Layout Debug Info', () => {
    it('should extract layout debug information', () => {
      const layoutResult: LayoutCalculationResult = {
        deviceConfig: {
          type: 'desktop',
          breakpoint: 1024,
          maxCards: 10,
          cardSize: { width: 96, height: 144 },
          spacing: 16,
          cardsPerRow: 5,
          minContainerWidth: 320,
          minContainerHeight: 240
        },
        containerDimensions: {
          width: 1024,
          height: 768,
          availableWidth: 924,
          availableHeight: 568
        },
        safeMargins: {
          top: 100,
          bottom: 100,
          left: 50,
          right: 50,
          horizontal: 100,
          vertical: 200
        },
        maxSafeCards: 8,
        recommendedCards: 5,
        fallbackApplied: true
      }

      const debugInfo = getLayoutDebugInfo(layoutResult)
      
      expect(debugInfo).toHaveProperty('deviceType', 'desktop')
      expect(debugInfo).toHaveProperty('containerDimensions')
      expect(debugInfo).toHaveProperty('safeMargins')
      expect(debugInfo).toHaveProperty('maxSafeCards', 8)
      expect(debugInfo).toHaveProperty('recommendedCards', 5)
      expect(debugInfo).toHaveProperty('fallbackApplied', true)
      expect(debugInfo).toHaveProperty('timestamp')
    })
  })

  describe('Performance Tracking', () => {
    it('should track calculation performance metrics', () => {
      const mockPerformanceNow = vi.fn()
        .mockReturnValueOnce(1000) // Start time
        .mockReturnValueOnce(1050) // End time (50ms duration)
      
      global.performance.now = mockPerformanceNow

      const context: PositionCalculationContext = {
        containerWidth: 1024,
        containerHeight: 768,
        cardCount: 1,
        deviceType: 'desktop',
        timestamp: Date.now(),
        fallbackApplied: false
      }

      const calculationId = startPositionCalculation(context)
      const positions: CardPosition[] = [
        { x: 0, y: 0, rotation: 0, cardWidth: 96, cardHeight: 144 }
      ]
      endPositionCalculation(calculationId, positions)

      const history = getPositionCalculationHistory(1)
      expect(history[0].performance.totalTime).toBe(50)
      expect(history[0].performance.calculationTime).toBe(40) // 80% of total
      expect(history[0].performance.validationTime).toBe(10) // 20% of total
    })
  })
})