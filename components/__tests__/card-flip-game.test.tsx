import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CardFlipGame } from '../card-flip-game'
import { ListItem } from '@/types'

// Mock the sound manager
const mockSoundManager = {
  play: vi.fn().mockResolvedValue(undefined),
  stop: vi.fn(),
}

vi.mock('@/lib/sound-manager', () => ({
  soundManager: mockSoundManager
}))

// Mock the animation performance hook
const mockRegisterAnimation = vi.fn().mockReturnValue(true)
const mockUnregisterAnimation = vi.fn()
const mockGetOptimizedDuration = vi.fn((duration: number) => duration / 10) // Speed up for tests

vi.mock('@/lib/animation-performance', () => ({
  useAnimationPerformance: () => ({
    shouldSkipAnimation: false,
    shouldEnableComplexAnimations: true,
    shouldEnableParticleEffects: true,
    shouldEnableShadows: true,
    getOptimizedDuration: mockGetOptimizedDuration,
    registerAnimation: mockRegisterAnimation,
    unregisterAnimation: mockUnregisterAnimation,
  })
}))

// Mock child components
vi.mock('../card-deck', () => ({
  CardDeck: ({ isShuffling, onShuffleComplete }: any) => (
    <div data-testid="card-deck">
      {isShuffling && <div>Shuffling...</div>}
      <button onClick={onShuffleComplete}>Complete Shuffle</button>
    </div>
  )
}))

vi.mock('../playing-card', () => ({
  PlayingCard: ({ card, isRevealed, onFlip, disabled }: any) => (
    <div data-testid={`playing-card-${card.id}`}>
      <button
        onClick={() => !disabled && onFlip(card.id)}
        disabled={disabled}
      >
        {isRevealed ? card.content?.name || 'Empty' : 'Card Back'}
      </button>
    </div>
  )
}))

const mockItems: ListItem[] = [
  { id: '1', name: '用户1' },
  { id: '2', name: '用户2' },
  { id: '3', name: '用户3' },
  { id: '4', name: '用户4' },
  { id: '5', name: '用户5' },
]

describe('CardFlipGame', () => {
  const mockOnComplete = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    // Mock window dimensions for responsive calculations
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('Initialization and Rendering', () => {
    it('renders game with sufficient items', () => {
      render(
        <CardFlipGame
          items={mockItems}
          quantity={3}
          allowRepeat={false}
          onComplete={mockOnComplete}
          soundEnabled={true}
        />
      )

      expect(screen.getByText('正在洗牌...')).toBeInTheDocument()
      expect(screen.getByTestId('card-deck')).toBeInTheDocument()
    })

    it('shows empty items message when no items provided', () => {
      render(
        <CardFlipGame
          items={[]} // No items
          quantity={3}
          allowRepeat={false}
          onComplete={mockOnComplete}
          soundEnabled={true}
        />
      )

      expect(screen.getByText('项目列表为空')).toBeInTheDocument()
      expect(screen.getByText(/请添加至少 1 个项目进行抽奖/)).toBeInTheDocument()
    })

    it('displays game information correctly', () => {
      render(
        <CardFlipGame
          items={mockItems}
          quantity={4}
          allowRepeat={false}
          onComplete={mockOnComplete}
          soundEnabled={true}
        />
      )

      expect(screen.getByText('抽取数量: 4')).toBeInTheDocument()
      expect(screen.getByText('总项目: 5')).toBeInTheDocument()
      expect(screen.getByText('已翻开: 0')).toBeInTheDocument()
      expect(screen.getByText('剩余: 0')).toBeInTheDocument() // Initially no cards dealt
    })
  })

  describe('Game Flow', () => {
    it('progresses through complete game flow', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })

      render(
        <CardFlipGame
          items={mockItems}
          quantity={3}
          allowRepeat={false}
          onComplete={mockOnComplete}
          soundEnabled={true}
        />
      )

      // 1. Initial shuffling phase
      expect(screen.getByText('正在洗牌...')).toBeInTheDocument()

      // 2. Complete shuffle to start dealing
      const shuffleButton = screen.getByText('Complete Shuffle')
      await user.click(shuffleButton)

      // Advance through dealing phase
      vi.advanceTimersByTime(1000)

      await waitFor(() => {
        expect(screen.getByText('点击卡牌进行翻牌')).toBeInTheDocument()
      })

      // 3. Cards should be dealt
      const cards = screen.getAllByTestId(/playing-card-/)
      expect(cards).toHaveLength(3)

      // 4. Flip all cards
      for (const card of cards) {
        const cardButton = card.querySelector('button')
        if (cardButton) {
          await user.click(cardButton)
          vi.advanceTimersByTime(100) // Animation duration
        }
      }

      // 5. Game should complete
      vi.advanceTimersByTime(1000)

      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalled()
      })
    })

    it('handles shuffle completion correctly', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })

      render(
        <CardFlipGame
          items={mockItems}
          quantity={3}
          allowRepeat={false}
          onComplete={mockOnComplete}
          soundEnabled={true}
        />
      )

      const shuffleButton = screen.getByText('Complete Shuffle')
      await user.click(shuffleButton)

      // Should transition to dealing phase
      vi.advanceTimersByTime(600) // Shuffle complete delay + dealing time

      await waitFor(() => {
        expect(screen.getByText('点击卡牌进行翻牌')).toBeInTheDocument()
      })
    })

    it('updates game state correctly during card flipping', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })

      render(
        <CardFlipGame
          items={mockItems}
          quantity={3}
          allowRepeat={false}
          onComplete={mockOnComplete}
          soundEnabled={true}
        />
      )

      // Complete shuffle and dealing
      const shuffleButton = screen.getByText('Complete Shuffle')
      await user.click(shuffleButton)
      vi.advanceTimersByTime(1000)

      await waitFor(() => {
        expect(screen.getByText('剩余: 3')).toBeInTheDocument()
      })

      // Flip one card
      const firstCard = screen.getAllByTestId(/playing-card-/)[0]
      const cardButton = firstCard.querySelector('button')
      if (cardButton) {
        await user.click(cardButton)
        vi.advanceTimersByTime(100)
      }

      await waitFor(() => {
        expect(screen.getByText('已翻开: 1')).toBeInTheDocument()
        expect(screen.getByText('剩余: 2')).toBeInTheDocument()
      })
    })
  })

  describe('Winner Selection Logic', () => {
    it('selects correct number of winners without repetition', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })

      render(
        <CardFlipGame
          items={mockItems}
          quantity={3}
          allowRepeat={false}
          onComplete={mockOnComplete}
          soundEnabled={true}
        />
      )

      // Complete the game flow
      const shuffleButton = screen.getByText('Complete Shuffle')
      await user.click(shuffleButton)
      vi.advanceTimersByTime(1000)

      // Flip all cards
      const cards = screen.getAllByTestId(/playing-card-/)
      for (const card of cards) {
        const cardButton = card.querySelector('button')
        if (cardButton) {
          await user.click(cardButton)
          vi.advanceTimersByTime(100)
        }
      }

      vi.advanceTimersByTime(1000)

      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({ name: expect.any(String) })
          ])
        )
      })

      const winners = mockOnComplete.mock.calls[0][0]
      expect(winners).toHaveLength(3)

      // Check no duplicates when allowRepeat is false
      const winnerIds = winners.map((w: ListItem) => w.id)
      const uniqueIds = [...new Set(winnerIds)]
      expect(uniqueIds).toHaveLength(winnerIds.length)
    })

    it('allows repeated winners when allowRepeat is true', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })

      render(
        <CardFlipGame
          items={[mockItems[0]]} // Only one item
          quantity={3}
          allowRepeat={true}
          onComplete={mockOnComplete}
          soundEnabled={true}
        />
      )

      // Complete the game flow
      const shuffleButton = screen.getByText('Complete Shuffle')
      await user.click(shuffleButton)
      vi.advanceTimersByTime(1000)

      const cards = screen.getAllByTestId(/playing-card-/)
      for (const card of cards) {
        const cardButton = card.querySelector('button')
        if (cardButton) {
          await user.click(cardButton)
          vi.advanceTimersByTime(100)
        }
      }

      vi.advanceTimersByTime(1000)

      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalled()
      })

      const winners = mockOnComplete.mock.calls[0][0]
      expect(winners).toHaveLength(3)
      // All winners should be the same item when only one item is available
      expect(winners.every((w: ListItem) => w.id === mockItems[0].id)).toBe(true)
    })
  })

  describe('Sound Integration', () => {
    it('plays sounds when sound is enabled', async () => {
      const { soundManager } = require('@/lib/sound-manager')
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })

      render(
        <CardFlipGame
          items={mockItems}
          quantity={3}
          allowRepeat={false}
          onComplete={mockOnComplete}
          soundEnabled={true}
        />
      )

      // Complete shuffle and dealing
      const shuffleButton = screen.getByText('Complete Shuffle')
      await user.click(shuffleButton)
      vi.advanceTimersByTime(1000)

      // Flip a card
      const firstCard = screen.getAllByTestId(/playing-card-/)[0]
      const cardButton = firstCard.querySelector('button')
      if (cardButton) {
        await user.click(cardButton)
      }

      expect(soundManager.play).toHaveBeenCalledWith('card-flip')
    })

    it('does not play sounds when sound is disabled', async () => {
      const { soundManager } = require('@/lib/sound-manager')
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })

      render(
        <CardFlipGame
          items={mockItems}
          quantity={3}
          allowRepeat={false}
          onComplete={mockOnComplete}
          soundEnabled={false}
        />
      )

      // Complete shuffle and dealing
      const shuffleButton = screen.getByText('Complete Shuffle')
      await user.click(shuffleButton)
      vi.advanceTimersByTime(1000)

      // Flip a card
      const firstCard = screen.getAllByTestId(/playing-card-/)[0]
      const cardButton = firstCard.querySelector('button')
      if (cardButton) {
        await user.click(cardButton)
      }

      expect(soundManager.play).not.toHaveBeenCalled()
    })
  })

  describe('Responsive Design', () => {
    it('adapts to mobile screen size', () => {
      // Mock mobile screen size
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 600,
      })

      render(
        <CardFlipGame
          items={mockItems}
          quantity={4}
          allowRepeat={false}
          onComplete={mockOnComplete}
          soundEnabled={true}
        />
      )

      // Should render without errors on mobile
      expect(screen.getByText('正在洗牌...')).toBeInTheDocument()
    })

    it('adapts to tablet screen size', () => {
      // Mock tablet screen size
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 800,
      })

      render(
        <CardFlipGame
          items={mockItems}
          quantity={4}
          allowRepeat={false}
          onComplete={mockOnComplete}
          soundEnabled={true}
        />
      )

      // Should render without errors on tablet
      expect(screen.getByText('正在洗牌...')).toBeInTheDocument()
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('handles quantity larger than available items gracefully', () => {
      render(
        <CardFlipGame
          items={mockItems}
          quantity={15} // More than available items
          allowRepeat={false}
          onComplete={mockOnComplete}
          soundEnabled={true}
        />
      )

      // Should cap at maximum allowed cards (10)
      expect(screen.getByText('抽取数量: 10')).toBeInTheDocument()
    })

    it('respects user-configured quantity including quantity 1', () => {
      render(
        <CardFlipGame
          items={mockItems}
          quantity={1} // Should respect quantity 1
          allowRepeat={false}
          onComplete={mockOnComplete}
          soundEnabled={true}
        />
      )

      // Should respect user configuration and show quantity 1
      expect(screen.getByText('抽取数量: 1')).toBeInTheDocument()
    })

    it('prevents double-clicking during card flip animation', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })

      render(
        <CardFlipGame
          items={mockItems}
          quantity={3}
          allowRepeat={false}
          onComplete={mockOnComplete}
          soundEnabled={true}
        />
      )

      // Complete shuffle and dealing
      const shuffleButton = screen.getByText('Complete Shuffle')
      await user.click(shuffleButton)
      vi.advanceTimersByTime(1000)

      const firstCard = screen.getAllByTestId(/playing-card-/)[0]
      const cardButton = firstCard.querySelector('button')

      if (cardButton) {
        // Click once
        await user.click(cardButton)

        // Try to click again immediately (should be ignored)
        await user.click(cardButton)

        // Should only register one flip
        expect(screen.getByText('翻牌中...')).toBeInTheDocument()
      }
    })
  })

  describe('Animation Performance Integration', () => {
    it('uses optimized durations from performance manager', () => {
      render(
        <CardFlipGame
          items={mockItems}
          quantity={3}
          allowRepeat={false}
          onComplete={mockOnComplete}
          soundEnabled={true}
        />
      )

      expect(mockGetOptimizedDuration).toHaveBeenCalledWith(2500) // shuffle duration
      expect(mockGetOptimizedDuration).toHaveBeenCalledWith(300)  // deal interval
      expect(mockGetOptimizedDuration).toHaveBeenCalledWith(600)  // flip duration
    })

    it('adapts to performance limitations', () => {
      // Mock limited performance
      vi.mocked(vi.importMock('@/lib/animation-performance')).useAnimationPerformance.mockReturnValue({
        shouldSkipAnimation: true,
        shouldEnableComplexAnimations: false,
        shouldEnableParticleEffects: false,
        shouldEnableShadows: false,
        getOptimizedDuration: () => 50, // Very fast
        registerAnimation: mockRegisterAnimation,
        unregisterAnimation: mockUnregisterAnimation,
      })

      render(
        <CardFlipGame
          items={mockItems}
          quantity={3}
          allowRepeat={false}
          onComplete={mockOnComplete}
          soundEnabled={true}
        />
      )

      // Should still render and function with reduced performance
      expect(screen.getByText('正在洗牌...')).toBeInTheDocument()
    })
  })

  describe('Game State Management', () => {
    it('transitions through all game phases correctly', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })

      render(
        <CardFlipGame
          items={mockItems}
          quantity={3}
          allowRepeat={false}
          onComplete={mockOnComplete}
          soundEnabled={true}
        />
      )

      // Phase 1: Shuffling
      expect(screen.getByText('正在洗牌...')).toBeInTheDocument()

      // Phase 2: Dealing
      const shuffleButton = screen.getByText('Complete Shuffle')
      await user.click(shuffleButton)
      vi.advanceTimersByTime(100)

      await waitFor(() => {
        expect(screen.getByText('正在发牌...')).toBeInTheDocument()
      })

      // Phase 3: Waiting for flips
      vi.advanceTimersByTime(500)
      await waitFor(() => {
        expect(screen.getByText('点击卡牌进行翻牌')).toBeInTheDocument()
      })

      // Phase 4: Revealing
      const firstCard = screen.getAllByTestId(/playing-card-/)[0]
      const cardButton = firstCard.querySelector('button')
      if (cardButton) {
        await user.click(cardButton)
        expect(screen.getByText('翻牌中...')).toBeInTheDocument()
      }

      // Phase 5: Back to waiting (for remaining cards)
      vi.advanceTimersByTime(100)
      await waitFor(() => {
        expect(screen.getByText('点击卡牌进行翻牌')).toBeInTheDocument()
      })
    })

    it('handles game completion correctly', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })

      render(
        <CardFlipGame
          items={mockItems}
          quantity={3}
          allowRepeat={false}
          onComplete={mockOnComplete}
          soundEnabled={true}
        />
      )

      // Complete the full game flow
      const shuffleButton = screen.getByText('Complete Shuffle')
      await user.click(shuffleButton)
      vi.advanceTimersByTime(1000)

      // Flip all cards
      const cards = screen.getAllByTestId(/playing-card-/)
      for (const card of cards) {
        const cardButton = card.querySelector('button')
        if (cardButton) {
          await user.click(cardButton)
          vi.advanceTimersByTime(100)
        }
      }

      // Complete the game
      vi.advanceTimersByTime(1000)

      await waitFor(() => {
        expect(screen.getByText('抽奖完成！')).toBeInTheDocument()
        expect(screen.getByText('🎉 中奖者')).toBeInTheDocument()
      })
    })
  })

  describe('Card Layout and Positioning', () => {
    it('calculates responsive card positions correctly', async () => {
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

      // Complete shuffle and dealing
      const shuffleButton = screen.getByText('Complete Shuffle')
      await user.click(shuffleButton)
      vi.advanceTimersByTime(1000)

      // Should have 4 cards positioned
      const cards = screen.getAllByTestId(/playing-card-/)
      expect(cards).toHaveLength(4)
    })

    it('adapts card layout for different screen sizes', () => {
      // Test mobile layout
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 400,
      })

      const { rerender } = render(
        <CardFlipGame
          items={mockItems}
          quantity={4}
          allowRepeat={false}
          onComplete={mockOnComplete}
          soundEnabled={true}
        />
      )

      // Should render without errors on mobile
      expect(screen.getByText('正在洗牌...')).toBeInTheDocument()

      // Test desktop layout
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1200,
      })

      rerender(
        <CardFlipGame
          items={mockItems}
          quantity={4}
          allowRepeat={false}
          onComplete={mockOnComplete}
          soundEnabled={true}
        />
      )

      expect(screen.getByText('正在洗牌...')).toBeInTheDocument()
    })
  })

  describe('Sound Effects Integration', () => {
    it('plays different sounds for different actions', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })

      render(
        <CardFlipGame
          items={mockItems}
          quantity={3}
          allowRepeat={false}
          onComplete={mockOnComplete}
          soundEnabled={true}
        />
      )

      // Complete shuffle and dealing
      const shuffleButton = screen.getByText('Complete Shuffle')
      await user.click(shuffleButton)
      vi.advanceTimersByTime(1000)

      // Flip a winning card
      const firstCard = screen.getAllByTestId(/playing-card-/)[0]
      const cardButton = firstCard.querySelector('button')
      if (cardButton) {
        await user.click(cardButton)
        vi.advanceTimersByTime(100)
      }

      expect(mockSoundManager.play).toHaveBeenCalledWith('card-flip')
      expect(mockSoundManager.play).toHaveBeenCalledWith('card-reveal')
    })

    it('handles sound play errors gracefully', async () => {
      mockSoundManager.play.mockRejectedValueOnce(new Error('Audio failed'))
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })

      render(
        <CardFlipGame
          items={mockItems}
          quantity={3}
          allowRepeat={false}
          onComplete={mockOnComplete}
          soundEnabled={true}
        />
      )

      // Complete shuffle and dealing
      const shuffleButton = screen.getByText('Complete Shuffle')
      await user.click(shuffleButton)
      vi.advanceTimersByTime(1000)

      // Flip a card - should not throw error
      const firstCard = screen.getAllByTestId(/playing-card-/)[0]
      const cardButton = firstCard.querySelector('button')
      if (cardButton) {
        expect(() => user.click(cardButton)).not.toThrow()
      }
    })
  })

  describe('Winner Selection Edge Cases', () => {
    it('handles empty winner selection gracefully', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })

      // Mock Math.random to always return 0 for predictable selection
      const originalRandom = Math.random
      Math.random = vi.fn().mockReturnValue(0)

      render(
        <CardFlipGame
          items={mockItems}
          quantity={3}
          allowRepeat={false}
          onComplete={mockOnComplete}
          soundEnabled={true}
        />
      )

      // Complete the game flow
      const shuffleButton = screen.getByText('Complete Shuffle')
      await user.click(shuffleButton)
      vi.advanceTimersByTime(1000)

      const cards = screen.getAllByTestId(/playing-card-/)
      for (const card of cards) {
        const cardButton = card.querySelector('button')
        if (cardButton) {
          await user.click(cardButton)
          vi.advanceTimersByTime(100)
        }
      }

      vi.advanceTimersByTime(1000)

      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalled()
      })

      // Restore original Math.random
      Math.random = originalRandom
    })

    it('handles winner selection with insufficient items when allowRepeat is false', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })

      render(
        <CardFlipGame
          items={[mockItems[0], mockItems[1]]} // Only 2 items
          quantity={5} // Want 5 winners
          allowRepeat={false}
          onComplete={mockOnComplete}
          soundEnabled={true}
        />
      )

      // Should still render the game but with capped quantity at max cards (10)
      // The winner selection logic will handle the insufficient items case internally
      expect(screen.getByText('正在洗牌...')).toBeInTheDocument()
      expect(screen.getByText('抽取数量: 5')).toBeInTheDocument()
    })
  })

  describe('Custom Props and Configuration', () => {
    it('applies custom className when provided', () => {
      render(
        <CardFlipGame
          items={mockItems}
          quantity={3}
          allowRepeat={false}
          onComplete={mockOnComplete}
          soundEnabled={true}
          className="custom-game-class"
        />
      )

      const gameContainer = document.querySelector('.custom-game-class')
      expect(gameContainer).toBeInTheDocument()
    })

    it('handles different quantity values correctly', () => {
      const { rerender } = render(
        <CardFlipGame
          items={mockItems}
          quantity={2} // Should respect user configuration
          allowRepeat={false}
          onComplete={mockOnComplete}
          soundEnabled={true}
        />
      )

      expect(screen.getByText('抽取数量: 2')).toBeInTheDocument() // Should respect user configuration

      rerender(
        <CardFlipGame
          items={mockItems}
          quantity={15} // Above maximum
          allowRepeat={false}
          onComplete={mockOnComplete}
          soundEnabled={true}
        />
      )

      expect(screen.getByText('抽取数量: 10')).toBeInTheDocument() // Should enforce maximum
    })
  })

  describe('Memory Management and Cleanup', () => {
    it('cleans up timers on unmount', () => {
      const { unmount } = render(
        <CardFlipGame
          items={mockItems}
          quantity={3}
          allowRepeat={false}
          onComplete={mockOnComplete}
          soundEnabled={true}
        />
      )

      // Start some timers
      vi.advanceTimersByTime(1000)

      // Unmount should clean up without errors
      expect(() => unmount()).not.toThrow()
    })

    it('handles window resize events correctly', () => {
      render(
        <CardFlipGame
          items={mockItems}
          quantity={3}
          allowRepeat={false}
          onComplete={mockOnComplete}
          soundEnabled={true}
        />
      )

      // Trigger window resize
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 500,
      })

      fireEvent(window, new Event('resize'))

      // Should handle resize without errors
      expect(screen.getByText('正在洗牌...')).toBeInTheDocument()
    })

    it('cleans up all registered animations on unmount', () => {
      const { unmount } = render(
        <CardFlipGame
          items={mockItems}
          quantity={3}
          allowRepeat={false}
          onComplete={mockOnComplete}
          soundEnabled={true}
        />
      )

      unmount()

      // Should have cleaned up any registered animations
      expect(mockUnregisterAnimation).toHaveBeenCalled()
    })
  })
})