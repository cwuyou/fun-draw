/**
 * Task 9: Integration tests for game flow
 * 
 * This test suite verifies:
 * 1. Complete game flow with quantity 1 to verify single card behavior
 * 2. Game flow with various quantities (1-10) to ensure consistency
 * 3. UI consistency across all quantity displays
 * 
 * Requirements covered: 4.1, 4.2, 4.3, 4.4
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
    getOptimizedDuration: (duration: number) => Math.min(duration, 100), // Speed up animations for tests
    registerAnimation: vi.fn(),
    unregisterAnimation: vi.fn(),
  })
}))

// Mock timers for animation control
vi.useFakeTimers()

describe('Task 9: Integration Tests for Game Flow', () => {
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

  describe('Requirement 4.1 & 4.4: Complete game flow with quantity 1', () => {
    test('should handle single card game flow correctly', async () => {
      const testItems = createTestItems(5)
      
      render(
        <CardFlipGame
          items={testItems}
          quantity={1}
          allowRepeat={false}
          onComplete={mockOnComplete}
          soundEnabled={false}
        />
      )

      // Verify initial state shows correct quantity
      await waitFor(() => {
        expect(screen.getByText('抽取数量: 1')).toBeInTheDocument()
        expect(screen.getByText('总项目: 5')).toBeInTheDocument()
        expect(screen.getByText('总卡牌: 1')).toBeInTheDocument()
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
        vi.advanceTimersByTime(1000)
      })

      // Verify waiting phase with exactly 1 card
      await waitFor(() => {
        expect(screen.getByText('点击卡牌进行翻牌')).toBeInTheDocument()
      })

      // Verify only 1 card is present
      const cards = screen.getAllByRole('button').filter(button => 
        button.getAttribute('data-testid')?.startsWith('game-card-')
      )
      expect(cards).toHaveLength(1)

      // Click the single card
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      await user.click(cards[0])

      // Fast-forward through flip animation
      act(() => {
        vi.advanceTimersByTime(1000)
      })

      // Verify game completion
      await waitFor(() => {
        expect(screen.getByText('抽奖完成！')).toBeInTheDocument()
        expect(screen.getByText('🎉 中奖者')).toBeInTheDocument()
      })

      // Verify onComplete was called with exactly 1 winner
      expect(mockOnComplete).toHaveBeenCalledTimes(1)
      const winners = mockOnComplete.mock.calls[0][0]
      expect(winners).toHaveLength(1)
      expect(winners[0]).toHaveProperty('name')
      expect(testItems.some(item => item.name === winners[0].name)).toBe(true)
    })

    test('should maintain UI consistency throughout single card flow', async () => {
      const testItems = createTestItems(3)
      
      render(
        <CardFlipGame
          items={testItems}
          quantity={1}
          allowRepeat={false}
          onComplete={mockOnComplete}
          soundEnabled={false}
        />
      )

      // Check initial consistency
      await waitFor(() => {
        expect(screen.getByText('抽取数量: 1')).toBeInTheDocument()
        expect(screen.getByText('总卡牌: 1')).toBeInTheDocument()
        expect(screen.getByText('已翻开: 0')).toBeInTheDocument()
        expect(screen.getByText('剩余: 1')).toBeInTheDocument()
      })

      // Fast-forward through animations
      act(() => {
        vi.advanceTimersByTime(5000)
      })

      // Verify consistency during waiting phase
      await waitFor(() => {
        expect(screen.getByText('抽取数量: 1')).toBeInTheDocument()
        expect(screen.getByText('总卡牌: 1')).toBeInTheDocument()
        expect(screen.getByText('已翻开: 0')).toBeInTheDocument()
        expect(screen.getByText('剩余: 1')).toBeInTheDocument()
      })

      // Click card and verify final consistency
      const cards = screen.getAllByRole('button').filter(button => 
        button.getAttribute('data-testid')?.startsWith('game-card-')
      )
      
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      await user.click(cards[0])

      act(() => {
        vi.advanceTimersByTime(2000)
      })

      await waitFor(() => {
        expect(screen.getByText('抽取数量: 1')).toBeInTheDocument()
        expect(screen.getByText('总卡牌: 1')).toBeInTheDocument()
        expect(screen.getByText('已翻开: 1')).toBeInTheDocument()
        expect(screen.getByText('剩余: 0')).toBeInTheDocument()
      })
    })
  })

  describe('Requirement 4.2 & 4.3: Game flow with various quantities', () => {
    const testQuantities = [1, 2, 3, 5, 7, 10]

    testQuantities.forEach(quantity => {
      test(`should handle game flow correctly with quantity ${quantity}`, async () => {
        const testItems = createTestItems(Math.max(quantity + 2, 10)) // Ensure enough items
        
        render(
          <CardFlipGame
            items={testItems}
            quantity={quantity}
            allowRepeat={false}
            onComplete={mockOnComplete}
            soundEnabled={false}
          />
        )

        // Verify initial quantity display
        await waitFor(() => {
          expect(screen.getByText(`抽取数量: ${quantity}`)).toBeInTheDocument()
          expect(screen.getByText(`总卡牌: ${quantity}`)).toBeInTheDocument()
        })

        // Fast-forward through all animations
        act(() => {
          vi.advanceTimersByTime(10000)
        })

        // Verify correct number of cards are dealt
        await waitFor(() => {
          const cards = screen.getAllByRole('button').filter(button => 
            button.getAttribute('data-testid')?.startsWith('game-card-')
          )
          expect(cards).toHaveLength(quantity)
        })

        // Verify game state consistency
        await waitFor(() => {
          expect(screen.getByText(`抽取数量: ${quantity}`)).toBeInTheDocument()
          expect(screen.getByText(`总卡牌: ${quantity}`)).toBeInTheDocument()
          expect(screen.getByText('已翻开: 0')).toBeInTheDocument()
          expect(screen.getByText(`剩余: ${quantity}`)).toBeInTheDocument()
        })
      })
    })

    test('should handle maximum quantity (10) correctly', async () => {
      const testItems = createTestItems(15)
      
      render(
        <CardFlipGame
          items={testItems}
          quantity={15} // Exceeds max, should be capped to 10
          allowRepeat={false}
          onComplete={mockOnComplete}
          soundEnabled={false}
        />
      )

      // Should show user-configured quantity but actual cards capped
      await waitFor(() => {
        expect(screen.getByText('抽取数量: 15')).toBeInTheDocument() // User config
        expect(screen.getByText('总卡牌: 10')).toBeInTheDocument() // Actual cards
      })

      // Fast-forward through animations
      act(() => {
        vi.advanceTimersByTime(10000)
      })

      // Verify exactly 10 cards are dealt
      await waitFor(() => {
        const cards = screen.getAllByRole('button').filter(button => 
          button.getAttribute('data-testid')?.startsWith('game-card-')
        )
        expect(cards).toHaveLength(10)
      })
    })
  })

  describe('UI Consistency Tests', () => {
    test('should maintain consistent displays across game phases', async () => {
      const testItems = createTestItems(8)
      const quantity = 3
      
      render(
        <CardFlipGame
          items={testItems}
          quantity={quantity}
          allowRepeat={false}
          onComplete={mockOnComplete}
          soundEnabled={false}
        />
      )

      // Test consistency during shuffling
      await waitFor(() => {
        expect(screen.getByText('正在洗牌...')).toBeInTheDocument()
        expect(screen.getByText(`抽取数量: ${quantity}`)).toBeInTheDocument()
        expect(screen.getByText('总项目: 8')).toBeInTheDocument()
      })

      // Advance to dealing phase
      act(() => {
        vi.advanceTimersByTime(3000)
      })

      // Test consistency during dealing
      await waitFor(() => {
        expect(screen.getByText('正在发牌...')).toBeInTheDocument()
        expect(screen.getByText(`抽取数量: ${quantity}`)).toBeInTheDocument()
        expect(screen.getByText('总项目: 8')).toBeInTheDocument()
      })

      // Advance to waiting phase
      act(() => {
        vi.advanceTimersByTime(2000)
      })

      // Test consistency during waiting
      await waitFor(() => {
        expect(screen.getByText('点击卡牌进行翻牌')).toBeInTheDocument()
        expect(screen.getByText(`抽取数量: ${quantity}`)).toBeInTheDocument()
        expect(screen.getByText(`总卡牌: ${quantity}`)).toBeInTheDocument()
        expect(screen.getByText('已翻开: 0')).toBeInTheDocument()
        expect(screen.getByText(`剩余: ${quantity}`)).toBeInTheDocument()
      })
    })

    test('should update revealed card count correctly during gameplay', async () => {
      const testItems = createTestItems(5)
      const quantity = 3
      
      render(
        <CardFlipGame
          items={testItems}
          quantity={quantity}
          allowRepeat={false}
          onComplete={mockOnComplete}
          soundEnabled={false}
        />
      )

      // Fast-forward to waiting phase
      act(() => {
        vi.advanceTimersByTime(10000)
      })

      await waitFor(() => {
        expect(screen.getByText('点击卡牌进行翻牌')).toBeInTheDocument()
      })

      const cards = screen.getAllByRole('button').filter(button => 
        button.getAttribute('data-testid')?.startsWith('game-card-')
      )

      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })

      // Click first card
      await user.click(cards[0])
      act(() => {
        vi.advanceTimersByTime(1000)
      })

      await waitFor(() => {
        expect(screen.getByText('已翻开: 1')).toBeInTheDocument()
        expect(screen.getByText('剩余: 2')).toBeInTheDocument()
      })

      // Click second card
      await user.click(cards[1])
      act(() => {
        vi.advanceTimersByTime(1000)
      })

      await waitFor(() => {
        expect(screen.getByText('已翻开: 2')).toBeInTheDocument()
        expect(screen.getByText('剩余: 1')).toBeInTheDocument()
      })

      // Click third card
      await user.click(cards[2])
      act(() => {
        vi.advanceTimersByTime(2000)
      })

      await waitFor(() => {
        expect(screen.getByText('已翻开: 3')).toBeInTheDocument()
        expect(screen.getByText('剩余: 0')).toBeInTheDocument()
        expect(screen.getByText('抽奖完成！')).toBeInTheDocument()
      })
    })

    test('should handle dynamic quantity changes correctly', async () => {
      const testItems = createTestItems(10)
      
      const { rerender } = render(
        <CardFlipGame
          items={testItems}
          quantity={2}
          allowRepeat={false}
          onComplete={mockOnComplete}
          soundEnabled={false}
        />
      )

      // Verify initial quantity
      await waitFor(() => {
        expect(screen.getByText('抽取数量: 2')).toBeInTheDocument()
      })

      // Change quantity
      rerender(
        <CardFlipGame
          items={testItems}
          quantity={5}
          allowRepeat={false}
          onComplete={mockOnComplete}
          soundEnabled={false}
        />
      )

      // Verify updated quantity
      await waitFor(() => {
        expect(screen.getByText('抽取数量: 5')).toBeInTheDocument()
      })

      // Fast-forward and verify card count matches
      act(() => {
        vi.advanceTimersByTime(10000)
      })

      await waitFor(() => {
        const cards = screen.getAllByRole('button').filter(button => 
          button.getAttribute('data-testid')?.startsWith('game-card-')
        )
        expect(cards).toHaveLength(5)
        expect(screen.getByText('总卡牌: 5')).toBeInTheDocument()
      })
    })
  })

  describe('Edge Cases and Error Handling', () => {
    test('should handle empty items list gracefully', async () => {
      render(
        <CardFlipGame
          items={[]}
          quantity={1}
          allowRepeat={false}
          onComplete={mockOnComplete}
          soundEnabled={false}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('项目列表为空')).toBeInTheDocument()
        expect(screen.getByText('请添加至少 1 个项目进行抽奖')).toBeInTheDocument()
      })
    })

    test('should handle quantity exceeding items when repeat disabled', async () => {
      const testItems = createTestItems(3)
      
      render(
        <CardFlipGame
          items={testItems}
          quantity={5}
          allowRepeat={false}
          onComplete={mockOnComplete}
          soundEnabled={false}
        />
      )

      // Should still show user configuration
      await waitFor(() => {
        expect(screen.getByText('抽取数量: 5')).toBeInTheDocument()
        expect(screen.getByText('总项目: 3')).toBeInTheDocument()
      })

      // But actual cards should be limited
      act(() => {
        vi.advanceTimersByTime(10000)
      })

      await waitFor(() => {
        const cards = screen.getAllByRole('button').filter(button => 
          button.getAttribute('data-testid')?.startsWith('game-card-')
        )
        expect(cards).toHaveLength(5) // Should still create 5 cards as configured
      })
    })

    test('should handle rapid clicking during animations', async () => {
      const testItems = createTestItems(5)
      
      render(
        <CardFlipGame
          items={testItems}
          quantity={3}
          allowRepeat={false}
          onComplete={mockOnComplete}
          soundEnabled={false}
        />
      )

      // Fast-forward to waiting phase
      act(() => {
        vi.advanceTimersByTime(10000)
      })

      await waitFor(() => {
        expect(screen.getByText('点击卡牌进行翻牌')).toBeInTheDocument()
      })

      const cards = screen.getAllByRole('button').filter(button => 
        button.getAttribute('data-testid')?.startsWith('game-card-')
      )

      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })

      // Rapidly click the same card multiple times
      await user.click(cards[0])
      await user.click(cards[0])
      await user.click(cards[0])

      act(() => {
        vi.advanceTimersByTime(1000)
      })

      // Should only count as one flip
      await waitFor(() => {
        expect(screen.getByText('已翻开: 1')).toBeInTheDocument()
      })
    })
  })
})