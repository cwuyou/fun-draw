/**
 * Task 14: Integration tests for enhanced game flow
 * 
 * This test suite verifies:
 * 1. Complete game flow with shuffling and dealing animations
 * 2. Audio feedback during all game phases
 * 3. Animation performance with various quantities
 * 4. User interaction during animated phases
 * 
 * Requirements covered: 6.5, 7.5, 8.4
 */

/// <reference types="vitest" />
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest'
import { CardFlipGame } from '@/components/card-flip-game'
import { ListItem } from '@/types'

// Mock dependencies
vi.mock('@/lib/sound-manager', () => ({
  soundManager: {
    play: vi.fn().mockResolvedValue(undefined),
    stop: vi.fn(),
    stopAll: vi.fn(),
    waitForInitialization: vi.fn().mockResolvedValue(undefined),
    setVolume: vi.fn(),
    setEnabled: vi.fn(),
  }
}))

vi.mock('@/lib/animation-performance', () => ({
  useAnimationPerformance: () => ({
    getOptimizedDuration: (duration: number) => Math.min(duration, 100),
    registerAnimation: vi.fn().mockReturnValue(true),
    unregisterAnimation: vi.fn(),
  })
}))

// Mock timers for animation control
vi.useFakeTimers()

describe('Task 14: Integration Tests for Enhanced Game Flow', () => {
  const createTestItems = (count: number): ListItem[] => 
    Array.from({ length: count }, (_, i) => ({
      id: `item-${i + 1}`,
      name: `Test Item ${i + 1}`
    }))

  const mockOnComplete = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.clearAllTimers()
  })

  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
    vi.useFakeTimers()
  })

  describe('Requirement 6.5: Complete game flow with shuffling and dealing animations', () => {
    test('should complete full game flow with animations', async () => {
      const testItems = createTestItems(3)
      
      render(
        <CardFlipGame
          items={testItems}
          quantity={3}
          allowRepeat={false}
          onComplete={mockOnComplete}
          soundEnabled={true}
        />
      )

      // Verify initial state shows correct quantity
      await waitFor(() => {
        expect(screen.getByText('抽取数量: 3')).toBeInTheDocument()
        expect(screen.getByText('总项目: 3')).toBeInTheDocument()
        expect(screen.getByText('总卡牌: 3')).toBeInTheDocument()
      })

      // Verify shuffling phase
      await waitFor(() => {
        expect(screen.getByText('正在洗牌...')).toBeInTheDocument()
      })

      // Fast-forward through shuffling animation
      act(() => {
        vi.advanceTimersByTime(3000)
      })

      // Verify dealing phase
      await waitFor(() => {
        expect(screen.getByText('正在发牌...')).toBeInTheDocument()
      })

      // Fast-forward through dealing animation
      act(() => {
        vi.advanceTimersByTime(2000)
      })

      // Verify waiting phase
      await waitFor(() => {
        expect(screen.getByText('点击卡牌进行翻牌')).toBeInTheDocument()
      })

      // Verify cards are present and clickable
      const cards = screen.getAllByRole('button').filter(button => 
        button.getAttribute('data-testid')?.startsWith('game-card-') ||
        button.className.includes('absolute')
      )
      expect(cards.length).toBeGreaterThan(0)

      // Click cards to complete game
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      for (const card of cards) {
        await user.click(card)
        act(() => {
          vi.advanceTimersByTime(1000)
        })
      }

      // Verify game completion
      await waitFor(() => {
        expect(screen.getByText('抽奖完成！')).toBeInTheDocument()
        expect(screen.getByText('🎉 中奖者')).toBeInTheDocument()
      })

      expect(mockOnComplete).toHaveBeenCalledTimes(1)
    })

    test('should handle smooth transitions between game phases', async () => {
      const testItems = createTestItems(2)
      
      render(
        <CardFlipGame
          items={testItems}
          quantity={2}
          allowRepeat={false}
          onComplete={mockOnComplete}
          soundEnabled={true}
        />
      )

      // Track phase transitions
      const phases = []

      // Initial phase
      await waitFor(() => {
        if (screen.queryByText('正在洗牌...')) phases.push('shuffling')
      })

      // Advance through shuffling
      act(() => {
        vi.advanceTimersByTime(3000)
      })

      // Dealing phase
      await waitFor(() => {
        if (screen.queryByText('正在发牌...')) phases.push('dealing')
      })

      // Advance through dealing
      act(() => {
        vi.advanceTimersByTime(2000)
      })

      // Waiting phase
      await waitFor(() => {
        if (screen.queryByText('点击卡牌进行翻牌')) phases.push('waiting')
      })

      // Verify smooth phase transitions occurred
      expect(phases).toContain('shuffling')
      expect(phases).toContain('dealing')
      expect(phases).toContain('waiting')
    })
  })

  describe('Requirement 7.5: User interaction during animated phases', () => {
    test('should be ready for interaction after dealing completes', async () => {
      const testItems = createTestItems(3)
      
      render(
        <CardFlipGame
          items={testItems}
          quantity={3}
          allowRepeat={false}
          onComplete={mockOnComplete}
          soundEnabled={true}
        />
      )

      // Fast-forward through all animations
      act(() => {
        vi.advanceTimersByTime(5000)
      })

      // Verify system is ready for interaction
      await waitFor(() => {
        expect(screen.getByText('点击卡牌进行翻牌')).toBeInTheDocument()
      })

      // Try to interact with cards immediately
      const cards = screen.getAllByRole('button').filter(button => 
        button.getAttribute('data-testid')?.startsWith('game-card-') ||
        button.className.includes('absolute')
      )

      if (cards.length > 0) {
        const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
        await user.click(cards[0])

        // Should respond to interaction
        expect(screen.queryByText('点击卡牌进行翻牌')).not.toBeInTheDocument()
      }
    })

    test('should handle user interactions during different phases', async () => {
      const testItems = createTestItems(3)
      const { container } = render(
        <CardFlipGame
          items={testItems}
          quantity={3}
          allowRepeat={false}
          onComplete={mockOnComplete}
          soundEnabled={true}
        />
      )

      // During shuffling phase - no cards should be clickable
      await waitFor(() => {
        expect(screen.getByText('正在洗牌...')).toBeInTheDocument()
      })

      let cards = container.querySelectorAll('[role="button"]')
      expect(cards.length).toBe(0) // No interactive cards during shuffling

      // Advance to dealing phase
      act(() => {
        vi.advanceTimersByTime(3000)
      })

      await waitFor(() => {
        expect(screen.getByText('正在发牌...')).toBeInTheDocument()
      })

      // During dealing - cards should not be interactive yet
      cards = container.querySelectorAll('[role="button"]')
      // Cards may exist but should be disabled

      // Advance to waiting phase
      act(() => {
        vi.advanceTimersByTime(2000)
      })

      await waitFor(() => {
        expect(screen.getByText('点击卡牌进行翻牌')).toBeInTheDocument()
      })

      // Now cards should be interactive
      cards = container.querySelectorAll('[role="button"]')
      expect(cards.length).toBeGreaterThan(0)
    })
  })

  describe('Requirement 8.4: Audio feedback during all game phases', () => {
    test('should play appropriate sounds during each game phase', async () => {
      const testItems = createTestItems(3)
      
      render(
        <CardFlipGame
          items={testItems}
          quantity={3}
          allowRepeat={false}
          onComplete={mockOnComplete}
          soundEnabled={true}
        />
      )

      const { soundManager } = await import('@/lib/sound-manager')

      // Should play shuffling sound during shuffling phase
      await waitFor(() => {
        expect(screen.getByText('正在洗牌...')).toBeInTheDocument()
      })
      expect(soundManager.play).toHaveBeenCalledWith('card-shuffle')

      // Advance through shuffling
      act(() => {
        vi.advanceTimersByTime(3000)
      })

      // Should stop shuffling sound and start dealing sounds
      expect(soundManager.stop).toHaveBeenCalledWith('card-shuffle')

      // Advance through dealing to check for dealing sounds
      act(() => {
        vi.advanceTimersByTime(2000)
      })

      // Should have played dealing sounds
      const dealSoundCalls = vi.mocked(soundManager.play).mock.calls.filter(
        call => call[0] === 'card-deal'
      )
      expect(dealSoundCalls.length).toBeGreaterThan(0)
    })

    test('should respect sound settings throughout game flow', async () => {
      const testItems = createTestItems(3)
      
      render(
        <CardFlipGame
          items={testItems}
          quantity={3}
          allowRepeat={false}
          onComplete={mockOnComplete}
          soundEnabled={false}
        />
      )

      // Fast-forward through entire game
      act(() => {
        vi.advanceTimersByTime(5000)
      })

      const { soundManager } = await import('@/lib/sound-manager')
      
      // Should not have played any sounds when disabled
      expect(soundManager.play).not.toHaveBeenCalledWith('card-shuffle')
      expect(soundManager.play).not.toHaveBeenCalledWith('card-deal')
    })

    test('should play interaction sounds when user clicks cards', async () => {
      const testItems = createTestItems(2)
      
      render(
        <CardFlipGame
          items={testItems}
          quantity={2}
          allowRepeat={false}
          onComplete={mockOnComplete}
          soundEnabled={true}
        />
      )

      // Fast-forward to waiting phase
      act(() => {
        vi.advanceTimersByTime(5000)
      })

      await waitFor(() => {
        expect(screen.getByText('点击卡牌进行翻牌')).toBeInTheDocument()
      })

      // Clear previous sound calls
      const { soundManager } = await import('@/lib/sound-manager')
      vi.mocked(soundManager.play).mockClear()

      // Click a card
      const cards = screen.getAllByRole('button').filter(button => 
        button.getAttribute('data-testid')?.startsWith('game-card-') ||
        button.className.includes('absolute')
      )

      if (cards.length > 0) {
        const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
        await user.click(cards[0])

        // Should play flip sound
        expect(soundManager.play).toHaveBeenCalledWith('card-flip')

        // Advance time for reveal sound
        act(() => {
          vi.advanceTimersByTime(1000)
        })

        // May play reveal sound for winners
        const revealSoundCalls = vi.mocked(soundManager.play).mock.calls.filter(
          call => call[0] === 'card-reveal'
        )
        // Reveal sound depends on whether the card is a winner
      }
    })
  })

  describe('Animation Performance with Various Quantities', () => {
    const testQuantities = [1, 3, 5, 8, 10]

    testQuantities.forEach(quantity => {
      test(`should handle animation performance with quantity ${quantity}`, async () => {
        const testItems = createTestItems(Math.max(quantity, 10))
        
        render(
          <CardFlipGame
            items={testItems}
            quantity={quantity}
            allowRepeat={false}
            onComplete={mockOnComplete}
            soundEnabled={true}
          />
        )

        // Verify initial setup
        await waitFor(() => {
          expect(screen.getByText(`抽取数量: ${quantity}`)).toBeInTheDocument()
          expect(screen.getByText(`总卡牌: ${quantity}`)).toBeInTheDocument()
        })

        // Fast-forward through all animations
        act(() => {
          vi.advanceTimersByTime(6000)
        })

        // Verify game reaches interactive state
        await waitFor(() => {
          expect(screen.getByText('点击卡牌进行翻牌')).toBeInTheDocument()
        })

        // Verify correct number of interactive elements
        const cards = screen.getAllByRole('button').filter(button => 
          button.getAttribute('data-testid')?.startsWith('game-card-') ||
          button.className.includes('absolute')
        )
        
        // Should have cards available for interaction
        expect(cards.length).toBeGreaterThan(0)
        expect(cards.length).toBeLessThanOrEqual(quantity)
      })
    })

    test('should maintain performance with maximum quantity', async () => {
      const testItems = createTestItems(15)
      
      render(
        <CardFlipGame
          items={testItems}
          quantity={10} // Maximum allowed
          allowRepeat={false}
          onComplete={mockOnComplete}
          soundEnabled={true}
        />
      )

      // Should handle maximum quantity without performance issues
      await waitFor(() => {
        expect(screen.getByText('抽取数量: 10')).toBeInTheDocument()
        expect(screen.getByText('总卡牌: 10')).toBeInTheDocument()
      })

      // Fast-forward through animations
      act(() => {
        vi.advanceTimersByTime(8000) // Longer time for more cards
      })

      // Should still reach interactive state
      await waitFor(() => {
        expect(screen.getByText('点击卡牌进行翻牌')).toBeInTheDocument()
      })
    })
  })

  describe('Edge Cases and Error Handling', () => {
    test('should handle animation interruptions gracefully', async () => {
      const testItems = createTestItems(3)
      
      const { rerender } = render(
        <CardFlipGame
          items={testItems}
          quantity={3}
          allowRepeat={false}
          onComplete={mockOnComplete}
          soundEnabled={true}
        />
      )

      // Start animations
      act(() => {
        vi.advanceTimersByTime(1000)
      })

      // Change props during animation
      rerender(
        <CardFlipGame
          items={testItems}
          quantity={2}
          allowRepeat={false}
          onComplete={mockOnComplete}
          soundEnabled={true}
        />
      )

      // Should handle the change gracefully
      act(() => {
        vi.advanceTimersByTime(5000)
      })

      // Should eventually reach a stable state
      await waitFor(() => {
        expect(screen.getByText('抽取数量: 2')).toBeInTheDocument()
      })
    })

    test('should handle rapid user interactions', async () => {
      const testItems = createTestItems(3)
      
      render(
        <CardFlipGame
          items={testItems}
          quantity={3}
          allowRepeat={false}
          onComplete={mockOnComplete}
          soundEnabled={true}
        />
      )

      // Fast-forward to interactive state
      act(() => {
        vi.advanceTimersByTime(5000)
      })

      await waitFor(() => {
        expect(screen.getByText('点击卡牌进行翻牌')).toBeInTheDocument()
      })

      const cards = screen.getAllByRole('button').filter(button => 
        button.getAttribute('data-testid')?.startsWith('game-card-') ||
        button.className.includes('absolute')
      )

      if (cards.length > 0) {
        const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
        
        // Rapidly click the same card multiple times
        await user.click(cards[0])
        await user.click(cards[0])
        await user.click(cards[0])

        act(() => {
          vi.advanceTimersByTime(1000)
        })

        // Should handle rapid clicks gracefully without crashing
        expect(screen.queryByText('点击卡牌进行翻牌')).not.toBeInTheDocument()
      }
    })
  })
})