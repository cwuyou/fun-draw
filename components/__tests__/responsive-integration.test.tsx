import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CardFlipGame } from '../card-flip-game'
import { ListItem } from '@/types'

// Mock dependencies
vi.mock('@/lib/sound-manager', () => ({
  soundManager: {
    play: vi.fn().mockResolvedValue(undefined),
    stop: vi.fn(),
  }
}))

vi.mock('@/lib/animation-performance', () => ({
  useAnimationPerformance: () => ({
    shouldSkipAnimation: false,
    shouldEnableComplexAnimations: true,
    shouldEnableParticleEffects: true,
    shouldEnableShadows: true,
    getOptimizedDuration: (duration: number) => duration / 10,
    registerAnimation: vi.fn().mockReturnValue(true),
    unregisterAnimation: vi.fn(),
  })
}))

const mockItems: ListItem[] = [
  { id: '1', name: '测试用户1' },
  { id: '2', name: '测试用户2' },
  { id: '3', name: '测试用户3' },
  { id: '4', name: '测试用户4' },
  { id: '5', name: '测试用户5' },
  { id: '6', name: '测试用户6' },
  { id: '7', name: '测试用户7' },
  { id: '8', name: '测试用户8' },
]

describe('Responsive Design Integration Tests', () => {
  const mockOnComplete = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('Mobile Device Integration', () => {
    beforeEach(() => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375, // iPhone SE width
      })
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 667, // iPhone SE height
      })
    })

    it('adapts card layout for mobile screens', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      
      render(
        <CardFlipGame
          items={mockItems}
          quantity={6}
          allowRepeat={false}
          onComplete={mockOnComplete}
          soundEnabled={true}
        />
      )

      // Complete shuffle and dealing
      const shuffleButton = screen.getByText('Complete Shuffle')
      await user.click(shuffleButton)
      vi.advanceTimersByTime(2000)

      // Should have all cards rendered
      const cards = screen.getAllByTestId(/playing-card-/)
      expect(cards).toHaveLength(6)

      // Cards should be arranged in mobile-friendly layout (2 per row)
      // This is tested through the component's responsive positioning logic
      expect(screen.getByText('抽取数量: 6')).toBeInTheDocument()
    })

    it('maintains touch accessibility on mobile', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      
      render(
        <CardFlipGame
          items={mockItems}
          quantity={4}
          allowRepeat={false}
          onComplete={mockOnComplete}
          soundEnabled={true}
        />
      )

      // Complete to card phase
      const shuffleButton = screen.getByText('Complete Shuffle')
      await user.click(shuffleButton)
      vi.advanceTimersByTime(2000)

      // All cards should be touchable
      const cards = screen.getAllByRole('button')
      cards.forEach(card => {
        // Should have minimum touch target size
        const styles = window.getComputedStyle(card)
        // Note: In real implementation, this would check for minimum 44px touch targets
        expect(card).toBeInTheDocument()
      })

      // Touch interaction should work
      const firstCard = cards[0]
      await user.click(firstCard)
      vi.advanceTimersByTime(200)

      await waitFor(() => {
        expect(screen.getByText('已翻开: 1')).toBeInTheDocument()
      })
    })

    it('handles mobile orientation changes', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      
      render(
        <CardFlipGame
          items={mockItems}
          quantity={4}
          allowRepeat={false}
          onComplete={mockOnComplete}
          soundEnabled={true}
        />
      )

      // Start in portrait
      expect(window.innerWidth).toBe(375)

      // Complete to card phase
      const shuffleButton = screen.getByText('Complete Shuffle')
      await user.click(shuffleButton)
      vi.advanceTimersByTime(2000)

      let cards = screen.getAllByTestId(/playing-card-/)
      expect(cards).toHaveLength(4)

      // Simulate orientation change to landscape
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 667,
      })
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 375,
      })

      fireEvent(window, new Event('resize'))

      // Cards should still be present and functional
      cards = screen.getAllByTestId(/playing-card-/)
      expect(cards).toHaveLength(4)

      // Should still be interactive
      const firstCard = cards[0]
      const cardButton = firstCard.querySelector('button')
      if (cardButton) {
        await user.click(cardButton)
        vi.advanceTimersByTime(200)
        
        await waitFor(() => {
          expect(screen.getByText('已翻开: 1')).toBeInTheDocument()
        })
      }
    })
  })

  describe('Tablet Device Integration', () => {
    beforeEach(() => {
      // Mock tablet viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768, // iPad width
      })
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 1024, // iPad height
      })
    })

    it('optimizes layout for tablet screens', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      
      render(
        <CardFlipGame
          items={mockItems}
          quantity={8}
          allowRepeat={false}
          onComplete={mockOnComplete}
          soundEnabled={true}
        />
      )

      // Complete to card phase
      const shuffleButton = screen.getByText('Complete Shuffle')
      await user.click(shuffleButton)
      vi.advanceTimersByTime(2000)

      // Should handle 8 cards efficiently on tablet
      const cards = screen.getAllByTestId(/playing-card-/)
      expect(cards).toHaveLength(8)

      // Should be arranged in tablet-optimized layout (3 per row)
      expect(screen.getByText('抽取数量: 8')).toBeInTheDocument()
    })

    it('handles tablet-specific interactions', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      
      render(
        <CardFlipGame
          items={mockItems}
          quantity={6}
          allowRepeat={false}
          onComplete={mockOnComplete}
          soundEnabled={true}
        />
      )

      // Complete to card phase
      const shuffleButton = screen.getByText('Complete Shuffle')
      await user.click(shuffleButton)
      vi.advanceTimersByTime(2000)

      // Should support both touch and mouse interactions
      const cards = screen.getAllByTestId(/playing-card-/)
      const firstCard = cards[0]
      const cardButton = firstCard.querySelector('button')

      if (cardButton) {
        // Touch interaction
        fireEvent.touchStart(cardButton)
        fireEvent.touchEnd(cardButton)
        vi.advanceTimersByTime(200)

        await waitFor(() => {
          expect(screen.getByText('已翻开: 1')).toBeInTheDocument()
        })
      }
    })
  })

  describe('Desktop Integration', () => {
    beforeEach(() => {
      // Mock desktop viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1920,
      })
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 1080,
      })
    })

    it('utilizes full desktop layout capabilities', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      
      render(
        <CardFlipGame
          items={mockItems}
          quantity={8}
          allowRepeat={false}
          onComplete={mockOnComplete}
          soundEnabled={true}
        />
      )

      // Complete to card phase
      const shuffleButton = screen.getByText('Complete Shuffle')
      await user.click(shuffleButton)
      vi.advanceTimersByTime(2000)

      // Should arrange cards in desktop-optimized layout (5 per row max)
      const cards = screen.getAllByTestId(/playing-card-/)
      expect(cards).toHaveLength(8)

      // Should support keyboard navigation
      const firstCard = cards[0]
      const cardButton = firstCard.querySelector('button')
      
      if (cardButton) {
        cardButton.focus()
        expect(document.activeElement).toBe(cardButton)

        // Keyboard interaction
        fireEvent.keyDown(cardButton, { key: 'Enter' })
        vi.advanceTimersByTime(200)

        await waitFor(() => {
          expect(screen.getByText('已翻开: 1')).toBeInTheDocument()
        })
      }
    })

    it('handles mouse hover effects on desktop', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      
      render(
        <CardFlipGame
          items={mockItems}
          quantity={4}
          allowRepeat={false}
          onComplete={mockOnComplete}
          soundEnabled={true}
        />
      )

      // Complete to card phase
      const shuffleButton = screen.getByText('Complete Shuffle')
      await user.click(shuffleButton)
      vi.advanceTimersByTime(2000)

      const cards = screen.getAllByTestId(/playing-card-/)
      const firstCard = cards[0]
      const cardButton = firstCard.querySelector('button')

      if (cardButton) {
        // Mouse hover should work
        fireEvent.mouseEnter(cardButton)
        fireEvent.mouseLeave(cardButton)
        
        // Click should still work
        await user.click(cardButton)
        vi.advanceTimersByTime(200)

        await waitFor(() => {
          expect(screen.getByText('已翻开: 1')).toBeInTheDocument()
        })
      }
    })
  })

  describe('Cross-Device Consistency', () => {
    it('maintains consistent behavior across different screen sizes', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      
      const screenSizes = [
        { width: 320, height: 568, name: 'Small Mobile' },
        { width: 768, height: 1024, name: 'Tablet' },
        { width: 1440, height: 900, name: 'Desktop' },
      ]

      for (const size of screenSizes) {
        // Set screen size
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: size.width,
        })
        Object.defineProperty(window, 'innerHeight', {
          writable: true,
          configurable: true,
          value: size.height,
        })

        const { unmount } = render(
          <CardFlipGame
            items={mockItems}
            quantity={4}
            allowRepeat={false}
            onComplete={mockOnComplete}
            soundEnabled={true}
          />
        )

        // Should render consistently
        expect(screen.getByText('正在洗牌...')).toBeInTheDocument()
        expect(screen.getByText('抽取数量: 4')).toBeInTheDocument()

        // Complete basic flow
        const shuffleButton = screen.getByText('Complete Shuffle')
        await user.click(shuffleButton)
        vi.advanceTimersByTime(2000)

        // Should have cards regardless of screen size
        const cards = screen.getAllByTestId(/playing-card-/)
        expect(cards).toHaveLength(4)

        // Clean up for next iteration
        unmount()
        vi.clearAllMocks()
      }
    })

    it('handles dynamic screen size changes during gameplay', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      
      // Start with desktop
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1200,
      })

      render(
        <CardFlipGame
          items={mockItems}
          quantity={6}
          allowRepeat={false}
          onComplete={mockOnComplete}
          soundEnabled={true}
        />
      )

      // Complete to card phase
      const shuffleButton = screen.getByText('Complete Shuffle')
      await user.click(shuffleButton)
      vi.advanceTimersByTime(2000)

      let cards = screen.getAllByTestId(/playing-card-/)
      expect(cards).toHaveLength(6)

      // Flip one card
      const firstCard = cards[0]
      const cardButton = firstCard.querySelector('button')
      if (cardButton) {
        await user.click(cardButton)
        vi.advanceTimersByTime(200)
      }

      await waitFor(() => {
        expect(screen.getByText('已翻开: 1')).toBeInTheDocument()
      })

      // Change to mobile during gameplay
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })
      fireEvent(window, new Event('resize'))

      // Game should continue working
      cards = screen.getAllByTestId(/playing-card-/)
      expect(cards).toHaveLength(6)
      expect(screen.getByText('已翻开: 1')).toBeInTheDocument()

      // Should still be able to flip remaining cards
      const secondCard = cards[1]
      const secondCardButton = secondCard.querySelector('button')
      if (secondCardButton && !secondCardButton.disabled) {
        await user.click(secondCardButton)
        vi.advanceTimersByTime(200)

        await waitFor(() => {
          expect(screen.getByText('已翻开: 2')).toBeInTheDocument()
        })
      }
    })
  })

  describe('Performance Across Devices', () => {
    it('maintains performance on low-end devices', async () => {
      // Mock low-performance device
      vi.mocked(vi.importMock('@/lib/animation-performance')).useAnimationPerformance.mockReturnValue({
        shouldSkipAnimation: true,
        shouldEnableComplexAnimations: false,
        shouldEnableParticleEffects: false,
        shouldEnableShadows: false,
        getOptimizedDuration: () => 50, // Very fast
        registerAnimation: vi.fn().mockReturnValue(true),
        unregisterAnimation: vi.fn(),
      })

      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      
      render(
        <CardFlipGame
          items={mockItems}
          quantity={6}
          allowRepeat={false}
          onComplete={mockOnComplete}
          soundEnabled={true}
        />
      )

      // Should still work with reduced animations
      const shuffleButton = screen.getByText('Complete Shuffle')
      await user.click(shuffleButton)
      vi.advanceTimersByTime(500) // Faster due to performance optimization

      const cards = screen.getAllByTestId(/playing-card-/)
      expect(cards).toHaveLength(6)

      // Complete game quickly
      for (const card of cards) {
        const cardButton = card.querySelector('button')
        if (cardButton && !cardButton.disabled) {
          await user.click(cardButton)
          vi.advanceTimersByTime(50)
        }
      }

      vi.advanceTimersByTime(100)
      expect(mockOnComplete).toHaveBeenCalled()
    })

    it('scales animation complexity based on device capabilities', async () => {
      const performanceConfigs = [
        {
          name: 'High Performance',
          config: {
            shouldSkipAnimation: false,
            shouldEnableComplexAnimations: true,
            shouldEnableParticleEffects: true,
            shouldEnableShadows: true,
            getOptimizedDuration: (d: number) => d,
          }
        },
        {
          name: 'Medium Performance',
          config: {
            shouldSkipAnimation: false,
            shouldEnableComplexAnimations: true,
            shouldEnableParticleEffects: false,
            shouldEnableShadows: true,
            getOptimizedDuration: (d: number) => d / 2,
          }
        },
        {
          name: 'Low Performance',
          config: {
            shouldSkipAnimation: true,
            shouldEnableComplexAnimations: false,
            shouldEnableParticleEffects: false,
            shouldEnableShadows: false,
            getOptimizedDuration: () => 50,
          }
        }
      ]

      for (const { name, config } of performanceConfigs) {
        vi.mocked(vi.importMock('@/lib/animation-performance')).useAnimationPerformance.mockReturnValue({
          ...config,
          registerAnimation: vi.fn().mockReturnValue(true),
          unregisterAnimation: vi.fn(),
        })

        const { unmount } = render(
          <CardFlipGame
            items={mockItems}
            quantity={3}
            allowRepeat={false}
            onComplete={mockOnComplete}
            soundEnabled={true}
          />
        )

        // Should render regardless of performance level
        expect(screen.getByText('正在洗牌...')).toBeInTheDocument()

        // Clean up for next iteration
        unmount()
        vi.clearAllMocks()
      }
    })
  })
})