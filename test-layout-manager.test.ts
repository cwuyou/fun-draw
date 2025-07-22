import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  detectDeviceType,
  getDeviceConfig,
  getResponsiveDeviceConfig,
  calculateSafeMargins,
  calculateContainerDimensions,
  calculateMaxSafeCards,
  calculateRecommendedCards,
  validateContainerSize,
  calculateLayout,
  getLayoutDebugInfo
} from './lib/layout-manager'

// Mock window object for testing
const mockWindow = (width: number, height: number = 800) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  })
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: height,
  })
}

describe('Layout Manager Core Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Device Type Detection', () => {
    it('should detect mobile device correctly', () => {
      expect(detectDeviceType(320)).toBe('mobile')
      expect(detectDeviceType(480)).toBe('mobile')
      expect(detectDeviceType(767)).toBe('mobile')
    })

    it('should detect tablet device correctly', () => {
      expect(detectDeviceType(768)).toBe('tablet')
      expect(detectDeviceType(900)).toBe('tablet')
      expect(detectDeviceType(1023)).toBe('tablet')
    })

    it('should detect desktop device correctly', () => {
      expect(detectDeviceType(1024)).toBe('desktop')
      expect(detectDeviceType(1920)).toBe('desktop')
    })

    it('should use window width when no width provided', () => {
      mockWindow(1200)
      expect(detectDeviceType()).toBe('desktop')
      
      mockWindow(800)
      expect(detectDeviceType()).toBe('tablet')
      
      mockWindow(400)
      expect(detectDeviceType()).toBe('mobile')
    })

    it('should default to desktop when window is undefined', () => {
      const originalWindow = global.window
      // @ts-ignore
      delete global.window
      
      expect(detectDeviceType()).toBe('desktop')
      
      global.window = originalWindow
    })
  })

  describe('Device Configuration', () => {
    it('should return correct mobile config', () => {
      const config = getDeviceConfig('mobile')
      expect(config.type).toBe('mobile')
      expect(config.maxCards).toBe(6)
      expect(config.cardSize.width).toBe(80)
      expect(config.cardSize.height).toBe(120)
      expect(config.cardsPerRow).toBe(2)
    })

    it('should return correct tablet config', () => {
      const config = getDeviceConfig('tablet')
      expect(config.type).toBe('tablet')
      expect(config.maxCards).toBe(12)
      expect(config.cardSize.width).toBe(88)
      expect(config.cardSize.height).toBe(132)
      expect(config.cardsPerRow).toBe(3)
    })

    it('should return correct desktop config', () => {
      const config = getDeviceConfig('desktop')
      expect(config.type).toBe('desktop')
      expect(config.maxCards).toBe(20)
      expect(config.cardSize.width).toBe(96)
      expect(config.cardSize.height).toBe(144)
      expect(config.cardsPerRow).toBe(5)
    })

    it('should return responsive config based on width', () => {
      const mobileConfig = getResponsiveDeviceConfig(400)
      expect(mobileConfig.type).toBe('mobile')

      const tabletConfig = getResponsiveDeviceConfig(800)
      expect(tabletConfig.type).toBe('tablet')

      const desktopConfig = getResponsiveDeviceConfig(1200)
      expect(desktopConfig.type).toBe('desktop')
    })
  })

  describe('Safe Margins Calculation', () => {
    it('should calculate basic margins correctly', () => {
      const margins = calculateSafeMargins('desktop')
      expect(margins.top).toBeGreaterThan(0)
      expect(margins.bottom).toBeGreaterThan(0)
      expect(margins.left).toBe(32)
      expect(margins.right).toBe(32)
      expect(margins.horizontal).toBe(64)
      expect(margins.vertical).toBe(margins.top + margins.bottom)
    })

    it('should adjust margins for mobile devices', () => {
      const desktopMargins = calculateSafeMargins('desktop')
      const mobileMargins = calculateSafeMargins('mobile')
      
      // Mobile should have larger margins due to multiplier
      expect(mobileMargins.top).toBeGreaterThan(desktopMargins.top)
      expect(mobileMargins.bottom).toBeGreaterThan(desktopMargins.bottom)
    })

    it('should include UI elements in margin calculation', () => {
      const basicMargins = calculateSafeMargins('desktop')
      const withUIMargins = calculateSafeMargins('desktop', {
        hasGameInfo: true,
        hasWarnings: true,
        hasStartButton: true,
        hasResultDisplay: true
      })

      expect(withUIMargins.top).toBeGreaterThan(basicMargins.top)
      expect(withUIMargins.bottom).toBeGreaterThan(basicMargins.bottom)
    })
  })

  describe('Container Dimensions Calculation', () => {
    it('should calculate available space correctly', () => {
      const margins = { top: 50, bottom: 50, left: 32, right: 32, horizontal: 64, vertical: 100 }
      const dimensions = calculateContainerDimensions(1000, 800, margins)

      expect(dimensions.width).toBe(1000)
      expect(dimensions.height).toBe(800)
      expect(dimensions.availableWidth).toBe(936) // 1000 - 64
      expect(dimensions.availableHeight).toBe(700) // 800 - 100
    })

    it('should not return negative available space', () => {
      const margins = { top: 500, bottom: 500, left: 600, right: 600, horizontal: 1200, vertical: 1000 }
      const dimensions = calculateContainerDimensions(1000, 800, margins)

      expect(dimensions.availableWidth).toBe(0)
      expect(dimensions.availableHeight).toBe(0)
    })
  })

  describe('Max Safe Cards Calculation', () => {
    it('should calculate max cards based on available space', () => {
      const deviceConfig = getDeviceConfig('desktop')
      const containerDimensions = {
        width: 1200,
        height: 800,
        availableWidth: 1000,
        availableHeight: 600
      }

      const maxCards = calculateMaxSafeCards(containerDimensions, deviceConfig)
      expect(maxCards).toBeGreaterThan(0)
      expect(maxCards).toBeLessThanOrEqual(deviceConfig.maxCards)
    })

    it('should return 0 for insufficient space', () => {
      const deviceConfig = getDeviceConfig('desktop')
      const containerDimensions = {
        width: 100,
        height: 100,
        availableWidth: 50,
        availableHeight: 50
      }

      const maxCards = calculateMaxSafeCards(containerDimensions, deviceConfig)
      expect(maxCards).toBe(0)
    })

    it('should respect device limits', () => {
      const deviceConfig = getDeviceConfig('mobile')
      const containerDimensions = {
        width: 2000,
        height: 2000,
        availableWidth: 1800,
        availableHeight: 1800
      }

      const maxCards = calculateMaxSafeCards(containerDimensions, deviceConfig)
      expect(maxCards).toBeLessThanOrEqual(deviceConfig.maxCards)
    })
  })

  describe('Recommended Cards Calculation', () => {
    it('should recommend at least the requested quantity', () => {
      const recommended = calculateRecommendedCards(3, 10, 20)
      expect(recommended).toBeGreaterThanOrEqual(3)
    })

    it('should not exceed max safe cards', () => {
      const recommended = calculateRecommendedCards(15, 8, 20)
      expect(recommended).toBeLessThanOrEqual(8)
    })

    it('should not exceed item count', () => {
      const recommended = calculateRecommendedCards(10, 15, 5)
      expect(recommended).toBeLessThanOrEqual(5)
    })

    it('should return at least 1 card', () => {
      const recommended = calculateRecommendedCards(0, 0, 0)
      expect(recommended).toBe(1)
    })
  })

  describe('Container Size Validation', () => {
    it('should validate sufficient container size', () => {
      const deviceConfig = getDeviceConfig('desktop')
      const containerDimensions = {
        width: 1200,
        height: 800,
        availableWidth: 1000,
        availableHeight: 600
      }

      const validation = validateContainerSize(containerDimensions, deviceConfig)
      expect(validation.isValid).toBe(true)
      expect(validation.error).toBeUndefined()
    })

    it('should reject insufficient width', () => {
      const deviceConfig = getDeviceConfig('desktop')
      const containerDimensions = {
        width: 500,
        height: 800,
        availableWidth: 400,
        availableHeight: 600
      }

      const validation = validateContainerSize(containerDimensions, deviceConfig)
      expect(validation.isValid).toBe(false)
      expect(validation.error).toContain('width')
    })

    it('should reject insufficient height', () => {
      const deviceConfig = getDeviceConfig('desktop')
      const containerDimensions = {
        width: 1200,
        height: 400,
        availableWidth: 1000,
        availableHeight: 300
      }

      const validation = validateContainerSize(containerDimensions, deviceConfig)
      expect(validation.isValid).toBe(false)
      expect(validation.error).toContain('height')
    })

    it('should reject insufficient available space for cards', () => {
      const deviceConfig = getDeviceConfig('desktop')
      const containerDimensions = {
        width: 1200,
        height: 800,
        availableWidth: 50, // Too small for card
        availableHeight: 50  // Too small for card
      }

      const validation = validateContainerSize(containerDimensions, deviceConfig)
      expect(validation.isValid).toBe(false)
      expect(validation.error).toContain('Available space')
    })
  })

  describe('Complete Layout Calculation', () => {
    it('should perform complete layout calculation', () => {
      const layout = calculateLayout(1200, 800, 5, 10)

      expect(layout.deviceConfig.type).toBe('desktop')
      expect(layout.containerDimensions.width).toBe(1200)
      expect(layout.containerDimensions.height).toBe(800)
      expect(layout.safeMargins).toBeDefined()
      expect(layout.maxSafeCards).toBeGreaterThan(0)
      expect(layout.recommendedCards).toBeGreaterThanOrEqual(5)
    })

    it('should adjust for different UI options', () => {
      const basicLayout = calculateLayout(1200, 800, 5, 10)
      const fullUILayout = calculateLayout(1200, 800, 5, 10, {
        hasGameInfo: true,
        hasWarnings: true,
        hasStartButton: true,
        hasResultDisplay: true
      })

      expect(fullUILayout.containerDimensions.availableHeight)
        .toBeLessThan(basicLayout.containerDimensions.availableHeight)
    })

    it('should work for different device types', () => {
      const mobileLayout = calculateLayout(400, 600, 3, 8)
      const tabletLayout = calculateLayout(800, 600, 5, 12)
      const desktopLayout = calculateLayout(1200, 800, 8, 20)

      expect(mobileLayout.deviceConfig.type).toBe('mobile')
      expect(tabletLayout.deviceConfig.type).toBe('tablet')
      expect(desktopLayout.deviceConfig.type).toBe('desktop')

      expect(mobileLayout.maxSafeCards).toBeLessThanOrEqual(6)
      expect(tabletLayout.maxSafeCards).toBeLessThanOrEqual(12)
      expect(desktopLayout.maxSafeCards).toBeLessThanOrEqual(20)
    })
  })

  describe('Layout Debug Info', () => {
    it('should generate debug info string', () => {
      const layout = calculateLayout(1200, 800, 5, 10)
      const debugInfo = getLayoutDebugInfo(layout)

      expect(debugInfo).toContain('Device: desktop')
      expect(debugInfo).toContain('1200x800px')
      expect(debugInfo).toContain('Available:')
      expect(debugInfo).toContain('Margins:')
      expect(debugInfo).toContain('Card Size:')
      expect(debugInfo).toContain('Max Safe Cards:')
      expect(debugInfo).toContain('Recommended:')
    })

    it('should include all relevant layout information', () => {
      const layout = calculateLayout(800, 600, 3, 8)
      const debugInfo = getLayoutDebugInfo(layout)

      expect(debugInfo).toContain('tablet')
      expect(debugInfo).toContain('88x132px') // Tablet card size
    })
  })
})