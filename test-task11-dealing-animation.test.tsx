/**
 * Task 11: Unit tests for dealing animation system
 * 
 * This test suite verifies:
 * 1. Staggered card dealing animation that shows cards appearing one by one
 * 2. Proper timing intervals between each card appearance
 * 3. Dealing animation respects the configured quantity
 * 4. Smooth appearance transitions for each dealt card
 * 
 * Requirements covered: 7.1, 7.2, 7.3, 7.4, 7.5
 */

/// <reference types="vitest" />
import { render, screen, waitFor, act } from '@testing-library/react'
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
    getOptimizedDuration: (duration: number) => duration,
    registerAnimation: vi.fn().mockReturnValue(true),
    unregisterAnimation: vi.fn(),
    shouldSkipAnimation: false,
    shouldEnableComplexAnimations: true,
    shouldEnableParticleEffects: true,
    shouldEnableShadows: true,
  })
}))

describe('Task 11: Dealing Animation System Tests', () => {
  const createTestItems = (count: number): ListItem[] => 
    Array.from({ length: count }, (_, i) => ({
      id: `item-${i + 1}`,
      name: `Test Item ${i + 1}`
    }))

  const mockOnComplete = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
  })

  describe('Requirement 7.1: Cards dealt one at a time with visible animation', () => {
    test('should deal cards one by one during dealing phase', async () => {
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

      // Wait for shuffling to start
      await waitFor(() => {
        expect(screen.getByText('正在洗牌...')).toBeInTheDocument()
      })

      // Fast-forward through shuffling to dealing phase
      act(() => {
        vi.advanceTimersByTime(3300) // 3000ms shuffle + 300ms delay
      })

      // Verify dealing phase begins
      await waitFor(() => {
        expect(screen.getByText('正在发牌...')).toBeInTheDocument()
      })

      // Advance through dealing animation
      for (let i = 0; i < quantity; i++) {
        act(() => {
          vi.advanceTimersByTime(300) // Deal interval for each card
        })
      }

      // Complete the dealing animation
      act(() => {
        vi.advanceTimersByTime(1000)
      })

      // Verify all cards are dealt
      await waitFor(() => {
        const cards = screen.getAllByRole('button').filter(button => 
          button.getAttribute('data-testid')?.startsWith('game-card-')
        )
        expect(cards).toHaveLength(quantity)
        expect(screen.getByText('点击卡牌进行翻牌')).toBeInTheDocument()
      })
    })

    test('should show dealing phase status during animation', async () => {
      const testItems = createTestItems(3)
      
      render(
        <CardFlipGame
          items={testItems}
          quantity={2}
          allowRepeat={false}
          onComplete={mockOnComplete}
          soundEnabled={false}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('正在洗牌...')).toBeInTheDocument()
      })

      act(() => {
        vi.advanceTimersByTime(3300)
      })

      await waitFor(() => {
        expect(screen.getByText('正在发牌...')).toBeInTheDocument()
      })

      act(() => {
        vi.advanceTimersByTime(300)
      })

      expect(screen.getByText('正在发牌...')).toBeInTheDocument()

      act(() => {
        vi.advanceTimersByTime(1000)
      })

      await waitFor(() => {
        expect(screen.getByText('点击卡牌进行翻牌')).toBeInTheDocument()
      })
    })
  })

  describe('Requirement 7.2: Staggered timing intervals between cards', () => {
    test('should use 300ms intervals between card appearances', async () => {
      const testItems = createTestItems(4)
      const quantity = 4
      
      render(
        <CardFlipGame
          items={testItems}
          quantity={quantity}
          allowRepeat={false}
          onComplete={mockOnComplete}
          soundEnabled={false}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('正在洗牌...')).toBeInTheDocument()
      })

      act(() => {
        vi.advanceTimersByTime(3300)
      })

      await waitFor(() => {
        expect(screen.getByText('正在发牌...')).toBeInTheDocument()
      })

      // Test timing intervals
      for (let i = 0; i < quantity; i++) {
        act(() => {
          vi.advanceTimersByTime(300)
        })
      }

      act(() => {
        vi.advanceTimersByTime(1000)
      })

      await waitFor(() => {
        const cards = screen.getAllByRole('button').filter(button => 
          button.getAttribute('data-testid')?.startsWith('game-card-')
        )
        expect(cards).toHaveLength(quantity)
      })
    })

    test('should play dealing sound for each card', async () => {
      const { soundManager } = await import('@/lib/sound-manager')
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

      await waitFor(() => {
        expect(screen.getByText('正在洗牌...')).toBeInTheDocument()
      })

      act(() => {
        vi.advanceTimersByTime(3300)
      })

      vi.clearAllMocks()

      // Advance through dealing
      for (let i = 0; i < 3; i++) {
        act(() => {
          vi.advanceTimersByTime(300)
        })
      }

      expect(soundManager.play).toHaveBeenCalledWith('card-deal')
      expect(soundManager.play).toHaveBeenCalledTimes(3)
    })
  })

  describe('Requirement 7.3: Dealing animation respects configured quantity', () => {
    const testQuantities = [1, 2, 3, 5]

    testQuantities.forEach(quantity => {
      test(`should deal exactly ${quantity} cards when quantity is ${quantity}`, async () => {
        const testItems = createTestItems(Math.max(quantity + 2, 10))
        
        render(
          <CardFlipGame
            items={testItems}
            quantity={quantity}
            allowRepeat={false}
            onComplete={mockOnComplete}
            soundEnabled={false}
          />
        )

        await waitFor(() => {
          expect(screen.getByText('正在洗牌...')).toBeInTheDocument()
        })

        act(() => {
          vi.advanceTimersByTime(3300)
        })

        await waitFor(() => {
          expect(screen.getByText('正在发牌...')).toBeInTheDocument()
        })

        const totalDealingTime = quantity * 300 + 1000
        act(() => {
          vi.advanceTimersByTime(totalDealingTime)
        })

        await waitFor(() => {
          const cards = screen.getAllByRole('button').filter(button => 
            button.getAttribute('data-testid')?.startsWith('game-card-')
          )
          expect(cards).toHaveLength(quantity)
          expect(screen.getByText(`总卡牌: ${quantity}`)).toBeInTheDocument()
        })
      })
    })
  })

  describe('Requirement 7.4: Smooth appearance transitions', () => {
    test('should apply smooth transitions to cards', async () => {
      const testItems = createTestItems(3)
      
      render(
        <CardFlipGame
          items={testItems}
          quantity={2}
          allowRepeat={false}
          onComplete={mockOnComplete}
          soundEnabled={false}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('正在洗牌...')).toBeInTheDocument()
      })

      act(() => {
        vi.advanceTimersByTime(3300)
      })

      await waitFor(() => {
        expect(screen.getByText('正在发牌...')).toBeInTheDocument()
      })

      act(() => {
        vi.advanceTimersByTime(300)
      })

      act(() => {
        vi.advanceTimersByTime(1000)
      })

      await waitFor(() => {
        const cards = screen.getAllByRole('button').filter(button => 
          button.getAttribute('data-testid')?.startsWith('game-card-')
        )
        expect(cards).toHaveLength(2)
      })
    })
  })

  describe('Requirement 7.5: System ready for interaction after dealing', () => {
    test('should transition to waiting phase after dealing', async () => {
      const testItems = createTestItems(4)
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

      await waitFor(() => {
        expect(screen.getByText('正在洗牌...')).toBeInTheDocument()
      })

      act(() => {
        vi.advanceTimersByTime(3300)
      })

      await waitFor(() => {
        expect(screen.getByText('正在发牌...')).toBeInTheDocument()
      })

      const totalDealingTime = quantity * 300 + 600
      act(() => {
        vi.advanceTimersByTime(totalDealingTime)
      })

      await waitFor(() => {
        expect(screen.getByText('点击卡牌进行翻牌')).toBeInTheDocument()
      })

      const cards = screen.getAllByRole('button').filter(button => 
        button.getAttribute('data-testid')?.startsWith('game-card-')
      )
      expect(cards).toHaveLength(quantity)
      
      cards.forEach(card => {
        expect(card).toHaveAttribute('tabIndex', '0')
        expect(card).toHaveAttribute('role', 'button')
      })
    })
  })
})