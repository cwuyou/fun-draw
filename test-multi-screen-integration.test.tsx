import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { CardFlipGame } from '@/components/card-flip-game'
import type { ListItem } from '@/types'

// Mock sound manager
vi.mock('@/lib/sound-manager', () => ({
  soundManager: {
    play: vi.fn().mockResolvedValue(undefined),
    stop: vi.fn(),
    stopAll: vi.fn(),
    setEnabled: vi.fn(),
    setMasterVolume: vi.fn(),
    waitForInitialization: vi.fn().mockResolvedValue(undefined),
    preloadSounds: vi.fn().mockResolvedValue(undefined),
    getSoundInfo: vi.fn().mockReturnValue({ initialized: true })
  }
}))

// Mock animation performance hook - reduce durations for faster tests
vi.mock('@/lib/animation-performance', () => ({
  useAnimationPerformance: () => ({
    getOptimizedDuration: (duration: number) => Math.min(duration, 100), // Cap at 100ms for tests
    registerAnimation: vi.fn(),
    unregisterAnimation: vi.fn()
  })
}))

// Mock validation functions
vi.mock('@/lib/card-game-validation', () => ({
  validateCompleteGameSetup: vi.fn().mockReturnValue({ isValid: true }),
  validateGameConfig: vi.fn().mockReturnValue({ isValid: true }),
  validatePositionCalculation: vi.fn().mockReturnValue({ isValid: true })
}))

// Mock dynamic spacing hook
vi.mock('@/hooks/use-dynamic-spacing', () => ({
  useDynamicSpacing: () => ({
    deviceType: 'desktop',
    spacingConfig: {
      componentSpacing: { horizontal: 16, vertical: 20 },
      uiElementSpacing: { gameInfo: 24, cardContainer: 16 }
    },
    containerPadding: {
      x: 16,
      y: 20,
      horizontal: 'px-4',
      vertical: 'py-5',
      all: 'p-4'
    },
    cssClasses: {
      container: { spaceY: 'space-y-5' },
      component: { gameInfo: 'mb-6', cardContainer: 'mb-4' },
      uiElement: { gameInfo: 'mb-6' }
    },
    spacing: {
      responsive: vi.fn().mockReturnValue(16),
      uiElement: vi.fn().mockReturnValue(24)
    }
  })
}))

// Mock the layout manager and position validation
vi.mock('@/lib/layout-manager', () => ({
  calculateLayout: vi.fn(),
  detectDeviceType: vi.fn(),
  getDeviceConfig: vi.fn(),
  createFallbackLayout: vi.fn(),
  getLayoutDebugInfo: vi.fn(),
  isValidContainerDimension: vi.fn()
}))

vi.mock('@/lib/position-validation', () => ({
  validateCardPosition: vi.fn(),
  getSafeCardPosition: vi.fn(),
  createFallbackPositions: vi.fn(),
  normalizePositionArray: vi.fn(),
  createSingleFallbackPosition: vi.fn(),
  validatePositionArray: vi.fn(),
  isValidDimension: vi.fn()
}))

// Screen size configurations for testing
const SCREEN_CONFIGS = {
  laptop14: {
    width: 1366,
    height: 768,
    deviceType: 'tablet',
    description: '14-inch laptop screen'
  },
  monitor27: {
    width: 2560,
    height: 1440,
    deviceType: 'desktop',
    description: '27-inch external monitor'
  },
  ultrawide: {
    width: 3440,
    height: 1440,
    deviceType: 'desktop',
    description: 'Ultra-wide monitor'
  },
  mobile: {
    width: 375,
    height: 667,
    deviceType: 'mobile',
    description: 'Mobile device'
  }
}

describe('Multi-Screen Integration Tests', () => {
  let mockItems: ListItem[]
  let originalInnerWidth: number
  let originalInnerHeight: number
  let resizeEventListeners: ((event: Event) => void)[] = []

  beforeEach(() => {
    // Store original window dimensions
    originalInnerWidth = window.innerWidth
    originalInnerHeight = window.innerHeight

    // Mock window resize event handling
    const originalAddEventListener = window.addEventListener
    const originalRemoveEventListener = window.removeEventListener

    window.addEventListener = vi.fn((event: string, handler: any) => {
      if (event === 'resize') {
        resizeEventListeners.push(handler)
      }
      return originalAddEventListener.call(window, event, handler)
    })

    window.removeEventListener = vi.fn((event: string, handler: any) => {
      if (event === 'resize') {
        resizeEventListeners = resizeEventListeners.filter(h => h !== handler)
      }
      return originalRemoveEventListener.call(window, event, handler)
    })

    // Setup test data
    mockItems = [
      { id: '1', text: 'Item 1', isWinner: false },
      { id: '2', text: 'Item 2', isWinner: false },
      { id: '3', text: 'Item 3', isWinner: false },
      { id: '4', text: 'Item 4', isWinner: false },
      { id: '5', text: 'Item 5', isWinner: false }
    ]

    // Reset mocks
    vi.clearAllMocks()
  })

  afterEach(() => {
    // Restore original window dimensions
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalInnerWidth
    })
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: originalInnerHeight
    })

    resizeEventListeners = []
  })

  describe('Window Movement Between Screen Sizes', () => {
    it('should handle movement from 14-inch laptop to 27-inch monitor', async () => {
      const { calculateLayout } = await import('@/lib/layout-manager')
      const { getSafeCardPosition, validateCardPosition } = await import('@/lib/position-validation')

      // Mock initial layout calculation for 14-inch screen
      ;(calculateLayout as any).mockReturnValue({
        deviceConfig: {
          cardSize: { width: 80, height: 120 },
          spacing: { horizontal: 12, vertical: 16 }
        },
        containerDimensions: {
          width: SCREEN_CONFIGS.laptop14.width,
          height: SCREEN_CONFIGS.laptop14.height
        }
      })

      // Mock position validation to return valid positions
      ;(validateCardPosition as any).mockReturnValue({
        isValid: true,
        position: { x: 100, y: 100, rotation: 0, cardWidth: 80, cardHeight: 120 }
      })

      ;(getSafeCardPosition as any).mockImplementation((positions, index, fallback) => {
        return positions[index] || fallback
      })

      // Set initial screen size (14-inch laptop)
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: SCREEN_CONFIGS.laptop14.width
      })
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: SCREEN_CONFIGS.laptop14.height
      })

      render(
        <CardFlipGame 
          items={mockItems} 
          quantity={3} 
          allowRepeat={false}
          onComplete={vi.fn()} 
          soundEnabled={false}
        />
      )

      // Start the game to create cards
      const startButton = screen.getByText('🎲 开始抽奖')
      fireEvent.click(startButton)

      await waitFor(() => {
        expect(screen.getByText('点击卡片翻开')).toBeInTheDocument()
      }, { timeout: 5000 })

      // Mock layout calculation for 27-inch monitor
      ;(calculateLayout as any).mockReturnValueOnce({
        deviceConfig: {
          cardSize: { width: 120, height: 180 },
          spacing: { horizontal: 20, vertical: 24 }
        },
        containerDimensions: {
          width: SCREEN_CONFIGS.monitor27.width,
          height: SCREEN_CONFIGS.monitor27.height
        }
      })

      // Simulate window movement to 27-inch monitor
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: SCREEN_CONFIGS.monitor27.width
      })
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: SCREEN_CONFIGS.monitor27.height
      })

      // Trigger resize event
      resizeEventListeners.forEach(handler => {
        handler(new Event('resize'))
      })

      await waitFor(() => {
        // Verify layout recalculation was called with new dimensions
        expect(calculateLayout).toHaveBeenCalledWith(
          SCREEN_CONFIGS.monitor27.width,
          SCREEN_CONFIGS.monitor27.height,
          3,
          mockItems.length,
          expect.any(Object)
        )
      })

      // Verify position validation was called
      expect(getSafeCardPosition).toHaveBeenCalled()
      expect(validateCardPosition).toHaveBeenCalled()
    })

    it('should handle movement from 27-inch monitor to 14-inch laptop', async () => {
      const { calculateLayout } = await import('@/lib/layout-manager')

      // Start with 27-inch monitor
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: SCREEN_CONFIGS.monitor27.width
      })
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: SCREEN_CONFIGS.monitor27.height
      })

      ;(calculateLayout as any).mockReturnValue({
        deviceConfig: {
          cardSize: { width: 120, height: 180 },
          spacing: { horizontal: 20, vertical: 24 }
        },
        containerDimensions: {
          width: SCREEN_CONFIGS.monitor27.width,
          height: SCREEN_CONFIGS.monitor27.height
        }
      })

      render(
        <CardFlipGame 
          items={mockItems} 
          quantity={3} 
          allowRepeat={false}
          onComplete={vi.fn()} 
          soundEnabled={false}
        />
      )

      // Start the game
      const startButton = screen.getByText('🎲 开始抽奖')
      fireEvent.click(startButton)

      await waitFor(() => {
        expect(screen.getByText('点击卡片翻开')).toBeInTheDocument()
      }, { timeout: 5000 })

      // Mock layout for smaller screen
      ;(calculateLayout as any).mockReturnValueOnce({
        deviceConfig: {
          cardSize: { width: 80, height: 120 },
          spacing: { horizontal: 12, vertical: 16 }
        },
        containerDimensions: {
          width: SCREEN_CONFIGS.laptop14.width,
          height: SCREEN_CONFIGS.laptop14.height
        }
      })

      // Move to 14-inch laptop
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: SCREEN_CONFIGS.laptop14.width
      })
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: SCREEN_CONFIGS.laptop14.height
      })

      // Trigger resize
      resizeEventListeners.forEach(handler => {
        handler(new Event('resize'))
      })

      await waitFor(() => {
        expect(calculateLayout).toHaveBeenCalledWith(
          SCREEN_CONFIGS.laptop14.width,
          SCREEN_CONFIGS.laptop14.height,
          3,
          mockItems.length,
          expect.any(Object)
        )
      })
    })
  })

  describe('Device Type Boundary Transitions', () => {
    it('should handle transition from mobile to desktop layout', async () => {
      const { calculateLayout, detectDeviceType } = await import('@/lib/layout-manager')

      // Mock device type detection
      ;(detectDeviceType as any)
        .mockReturnValueOnce('mobile')
        .mockReturnValueOnce('desktop')

      // Start with mobile dimensions
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: SCREEN_CONFIGS.mobile.width
      })
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: SCREEN_CONFIGS.mobile.height
      })

      ;(calculateLayout as any).mockReturnValue({
        deviceConfig: {
          cardSize: { width: 60, height: 90 },
          spacing: { horizontal: 8, vertical: 12 }
        },
        containerDimensions: {
          width: SCREEN_CONFIGS.mobile.width,
          height: SCREEN_CONFIGS.mobile.height
        }
      })

      render(
        <CardFlipGame 
          items={mockItems} 
          quantity={2} 
          allowRepeat={false}
          onComplete={vi.fn()} 
          soundEnabled={false}
        />
      )

      // Start game on mobile
      const startButton = screen.getByText('🎲 开始抽奖')
      fireEvent.click(startButton)

      await waitFor(() => {
        expect(screen.getByText('点击卡片翻开')).toBeInTheDocument()
      })

      // Mock desktop layout
      ;(calculateLayout as any).mockReturnValueOnce({
        deviceConfig: {
          cardSize: { width: 120, height: 180 },
          spacing: { horizontal: 20, vertical: 24 }
        },
        containerDimensions: {
          width: SCREEN_CONFIGS.monitor27.width,
          height: SCREEN_CONFIGS.monitor27.height
        }
      })

      // Transition to desktop
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: SCREEN_CONFIGS.monitor27.width
      })
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: SCREEN_CONFIGS.monitor27.height
      })

      resizeEventListeners.forEach(handler => {
        handler(new Event('resize'))
      })

      await waitFor(() => {
        expect(calculateLayout).toHaveBeenCalledWith(
          SCREEN_CONFIGS.monitor27.width,
          SCREEN_CONFIGS.monitor27.height,
          2,
          mockItems.length,
          expect.any(Object)
        )
      })
    })

    it('should handle transition from desktop to tablet layout', async () => {
      const { calculateLayout, detectDeviceType } = await import('@/lib/layout-manager')

      ;(detectDeviceType as any)
        .mockReturnValueOnce('desktop')
        .mockReturnValueOnce('tablet')

      // Start with desktop
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: SCREEN_CONFIGS.monitor27.width
      })
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: SCREEN_CONFIGS.monitor27.height
      })

      ;(calculateLayout as any).mockReturnValue({
        deviceConfig: {
          cardSize: { width: 120, height: 180 },
          spacing: { horizontal: 20, vertical: 24 }
        }
      })

      render(
        <CardFlipGame 
          items={mockItems} 
          quantity={4} 
          allowRepeat={false}
          onComplete={vi.fn()} 
          soundEnabled={false}
        />
      )

      const startButton = screen.getByText('🎲 开始抽奖')
      fireEvent.click(startButton)

      await waitFor(() => {
        expect(screen.getByText('点击卡片翻开')).toBeInTheDocument()
      })

      // Mock tablet layout
      ;(calculateLayout as any).mockReturnValueOnce({
        deviceConfig: {
          cardSize: { width: 80, height: 120 },
          spacing: { horizontal: 12, vertical: 16 }
        }
      })

      // Transition to tablet size
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: SCREEN_CONFIGS.laptop14.width
      })
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: SCREEN_CONFIGS.laptop14.height
      })

      resizeEventListeners.forEach(handler => {
        handler(new Event('resize'))
      })

      await waitFor(() => {
        expect(calculateLayout).toHaveBeenCalledWith(
          SCREEN_CONFIGS.laptop14.width,
          SCREEN_CONFIGS.laptop14.height,
          4,
          mockItems.length,
          expect.any(Object)
        )
      })
    })
  })

  describe('Game State Preservation During Screen Transitions', () => {
    it('should preserve revealed card states during resize', async () => {
      const { getSafeCardPosition, validateCardPosition } = await import('@/lib/position-validation')

      ;(validateCardPosition as any).mockReturnValue({
        isValid: true,
        position: { x: 100, y: 100, rotation: 0, cardWidth: 80, cardHeight: 120 }
      })

      ;(getSafeCardPosition as any).mockImplementation((positions, index, fallback) => {
        return positions[index] || fallback
      })

      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: SCREEN_CONFIGS.laptop14.width
      })
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: SCREEN_CONFIGS.laptop14.height
      })

      render(
        <CardFlipGame 
          items={mockItems} 
          quantity={3} 
          allowRepeat={false}
          onComplete={vi.fn()} 
          soundEnabled={false}
        />
      )

      // Start game and reveal some cards
      const startButton = screen.getByText('🎲 开始抽奖')
      fireEvent.click(startButton)

      await waitFor(() => {
        expect(screen.getByText('点击卡片翻开')).toBeInTheDocument()
      })

      // Click on cards to reveal them
      const cards = screen.getAllByRole('button').filter(btn => 
        btn.textContent?.includes('点击翻开') || btn.classList.contains('card')
      )
      
      if (cards.length > 0) {
        fireEvent.click(cards[0])
        await waitFor(() => {
          // Card should be revealed
        })
      }

      // Trigger resize
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: SCREEN_CONFIGS.monitor27.width
      })
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: SCREEN_CONFIGS.monitor27.height
      })

      resizeEventListeners.forEach(handler => {
        handler(new Event('resize'))
      })

      // Verify game state is preserved
      await waitFor(() => {
        // The revealed card should still be revealed
        // Game phase should remain the same
        expect(screen.queryByText('点击卡片翻开')).toBeInTheDocument()
      })
    })

    it('should preserve game phase during resize operations', async () => {
      const onComplete = vi.fn()

      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: SCREEN_CONFIGS.laptop14.width
      })

      render(
        <CardFlipGame 
          items={mockItems} 
          quantity={2} 
          allowRepeat={false}
          onComplete={onComplete} 
          soundEnabled={false}
        />
      )

      // Start game (should be in 'waiting' phase)
      const startButton = screen.getByText('🎲 开始抽奖')
      fireEvent.click(startButton)

      await waitFor(() => {
        expect(screen.getByText('点击卡片翻开')).toBeInTheDocument()
      })

      // Trigger resize while in waiting phase
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: SCREEN_CONFIGS.monitor27.width
      })

      resizeEventListeners.forEach(handler => {
        handler(new Event('resize'))
      })

      // Game should still be in waiting phase
      await waitFor(() => {
        expect(screen.getByText('点击卡片翻开')).toBeInTheDocument()
      })

      // onComplete should not have been called
      expect(onComplete).not.toHaveBeenCalled()
    })
  })

  describe('Error Handling for Different Aspect Ratios', () => {
    it('should handle ultra-wide monitor aspect ratios', async () => {
      const { calculateLayout, createFallbackLayout } = await import('@/lib/layout-manager')
      const { createFallbackPositions } = await import('@/lib/position-validation')

      // Mock layout calculation failure for extreme aspect ratio
      ;(calculateLayout as any).mockImplementationOnce(() => {
        throw new Error('Layout calculation failed for extreme aspect ratio')
      })

      // Mock fallback layout
      ;(createFallbackLayout as any).mockReturnValue({
        deviceConfig: {
          cardSize: { width: 80, height: 120 },
          spacing: { horizontal: 12, vertical: 16 }
        }
      })

      // Mock fallback positions
      ;(createFallbackPositions as any).mockReturnValue([
        { x: 0, y: -50, rotation: 0, cardWidth: 80, cardHeight: 120 },
        { x: 0, y: 0, rotation: 0, cardWidth: 80, cardHeight: 120 },
        { x: 0, y: 50, rotation: 0, cardWidth: 80, cardHeight: 120 }
      ])

      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: SCREEN_CONFIGS.ultrawide.width
      })
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: SCREEN_CONFIGS.ultrawide.height
      })

      render(
        <CardFlipGame 
          items={mockItems} 
          quantity={3} 
          allowRepeat={false}
          onComplete={vi.fn()} 
          soundEnabled={false}
        />
      )

      const startButton = screen.getByText('🎲 开始抽奖')
      fireEvent.click(startButton)

      // Should still render without crashing
      await waitFor(() => {
        expect(screen.getByText('点击卡片翻开')).toBeInTheDocument()
      })

      // Verify fallback was used
      expect(createFallbackLayout).toHaveBeenCalled()
    })

    it('should handle very narrow aspect ratios', async () => {
      const { calculateLayout } = await import('@/lib/layout-manager')
      const { getSafeCardPosition } = await import('@/lib/position-validation')

      // Mock narrow screen dimensions
      const narrowScreen = { width: 320, height: 1024 }

      ;(calculateLayout as any).mockReturnValue({
        deviceConfig: {
          cardSize: { width: 50, height: 75 },
          spacing: { horizontal: 8, vertical: 12 }
        },
        containerDimensions: narrowScreen
      })

      ;(getSafeCardPosition as any).mockImplementation((positions, index, fallback) => {
        return fallback // Use fallback for narrow screen
      })

      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: narrowScreen.width
      })
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: narrowScreen.height
      })

      render(
        <CardFlipGame 
          items={mockItems} 
          quantity={2} 
          allowRepeat={false}
          onComplete={vi.fn()} 
          soundEnabled={false}
        />
      )

      const startButton = screen.getByText('🎲 开始抽奖')
      fireEvent.click(startButton)

      await waitFor(() => {
        expect(screen.getByText('点击卡片翻开')).toBeInTheDocument()
      })

      // Verify safe position access was used
      expect(getSafeCardPosition).toHaveBeenCalled()
    })

    it('should handle position calculation errors during screen transitions', async () => {
      const { calculateLayout, createFallbackLayout } = await import('@/lib/layout-manager')
      const { createFallbackPositions } = await import('@/lib/position-validation')

      // Start with working layout
      ;(calculateLayout as any).mockReturnValue({
        deviceConfig: {
          cardSize: { width: 80, height: 120 },
          spacing: { horizontal: 12, vertical: 16 }
        }
      })

      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: SCREEN_CONFIGS.laptop14.width
      })

      render(
        <CardFlipGame 
          items={mockItems} 
          quantity={3} 
          allowRepeat={false}
          onComplete={vi.fn()} 
          soundEnabled={false}
        />
      )

      const startButton = screen.getByText('🎲 开始抽奖')
      fireEvent.click(startButton)

      await waitFor(() => {
        expect(screen.getByText('点击卡片翻开')).toBeInTheDocument()
      })

      // Mock calculation failure on resize
      ;(calculateLayout as any).mockImplementationOnce(() => {
        throw new Error('Position calculation failed')
      })

      ;(createFallbackLayout as any).mockReturnValue({
        deviceConfig: {
          cardSize: { width: 80, height: 120 },
          spacing: { horizontal: 12, vertical: 16 }
        }
      })

      ;(createFallbackPositions as any).mockReturnValue([
        { x: 0, y: -30, rotation: 0, cardWidth: 80, cardHeight: 120 },
        { x: 0, y: 0, rotation: 0, cardWidth: 80, cardHeight: 120 },
        { x: 0, y: 30, rotation: 0, cardWidth: 80, cardHeight: 120 }
      ])

      // Trigger resize that causes error
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: SCREEN_CONFIGS.monitor27.width
      })

      resizeEventListeners.forEach(handler => {
        handler(new Event('resize'))
      })

      // Game should continue working with fallback positions
      await waitFor(() => {
        expect(screen.getByText('点击卡片翻开')).toBeInTheDocument()
      })

      expect(createFallbackLayout).toHaveBeenCalled()
    })
  })

  describe('Performance During Screen Transitions', () => {
    it('should debounce rapid resize events', async () => {
      const { calculateLayout } = await import('@/lib/layout-manager')

      ;(calculateLayout as any).mockReturnValue({
        deviceConfig: {
          cardSize: { width: 80, height: 120 }
        }
      })

      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: SCREEN_CONFIGS.laptop14.width
      })

      render(
        <CardFlipGame 
          items={mockItems} 
          quantity={3} 
          allowRepeat={false}
          onComplete={vi.fn()} 
          soundEnabled={false}
        />
      )

      const startButton = screen.getByText('🎲 开始抽奖')
      fireEvent.click(startButton)

      await waitFor(() => {
        expect(screen.getByText('点击卡片翻开')).toBeInTheDocument()
      })

      // Clear previous calls
      ;(calculateLayout as any).mockClear()

      // Trigger multiple rapid resize events
      for (let i = 0; i < 5; i++) {
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: SCREEN_CONFIGS.laptop14.width + i * 100
        })

        resizeEventListeners.forEach(handler => {
          handler(new Event('resize'))
        })
      }

      // Wait for debounce to settle
      await new Promise(resolve => setTimeout(resolve, 200))

      // Should have been called fewer times due to debouncing
      expect(calculateLayout).toHaveBeenCalledTimes(1)
    })
  })
})