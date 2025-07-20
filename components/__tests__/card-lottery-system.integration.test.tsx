import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CardFlipGame } from '../card-flip-game'
import { PlayingCard } from '../playing-card'
import { CardDeck } from '../card-deck'
import { ListItem, GameCard, CardStyle } from '@/types'

// Mock all external dependencies
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
    getOptimizedDuration: (duration: number) => Math.max(duration / 10, 50),
    registerAnimation: vi.fn().mockReturnValue(true),
    unregisterAnimation: vi.fn(),
  })
}))

const mockItems: ListItem[] = [
  { id: '1', name: '参与者A' },
  { id: '2', name: '参与者B' },
  { id: '3', name: '参与者C' },
  { id: '4', name: '参与者D' },
  { id: '5', name: '参与者E' },
]

const mockCardStyle: CardStyle = {
  id: 'test',
  name: '测试样式',
  backDesign: 'bg-blue-500',
  frontTemplate: 'bg-white border-2',
  colors: {
    primary: '#3b82f6',
    secondary: '#1d4ed8',
    accent: '#60a5fa'
  }
}

describe('Card Lottery System Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    
    // Mock consistent window dimensions
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('Component Integration', () => {
    it('integrates CardDeck and PlayingCard components correctly', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      const mockOnComplete = vi.fn()
      
      render(
        <CardFlipGame
          items={mockItems}
          quantity={3}
          allowRepeat={false}
          onComplete={mockOnComplete}
          soundEnabled={true}
        />
      )

      // Should start with CardDeck component
      expect(screen.getByTestId('card-deck')).toBeInTheDocument()
      expect(screen.queryByTestId(/playing-card-/)).not.toBeInTheDocument()

      // Complete shuffle to transition to PlayingCard components
      const shuffleButton = screen.getByText('Complete Shuffle')
      await user.click(shuffleButton)
      vi.advanceTimersByTime(2000)

      // Should now show PlayingCard components
      expect(screen.queryByTestId('card-deck')).not.toBeInTheDocument()
      const cards = screen.getAllByTestId(/playing-card-/)
      expect(cards).toHaveLength(3)
    })

    it('maintains state consistency across component transitions', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      const mockOnComplete = vi.fn()
      
      render(
        <CardFlipGame
          items={mockItems}
          quantity={4}
          allowRepeat={false}
          onComplete={mockOnComplete}
          soundEnabled={true}
        />
      )

      // Initial state
      expect(screen.getByText('抽取数量: 4')).toBeInTheDocument()
      expect(screen.getByText('总项目: 5')).toBeInTheDocument()
      expect(screen.getByText('已翻开: 0')).toBeInTheDocument()

      // Transition through phases
      const shuffleButton = screen.getByText('Complete Shuffle')
      await user.click(shuffleButton)
      vi.advanceTimersByTime(2000)

      // State should be maintained
      expect(screen.getByText('抽取数量: 4')).toBeInTheDocument()
      expect(screen.getByText('总项目: 5')).toBeInTheDocument()
      expect(screen.getByText('剩余: 4')).toBeInTheDocument()

      // Flip cards and verify state updates
      const cards = screen.getAllByTestId(/playing-card-/)
      const firstCard = cards[0]
      const cardButton = firstCard.querySelector('button')
      
      if (cardButton) {
        await user.click(cardButton)
        vi.advanceTimersByTime(200)
        
        await waitFor(() => {
          expect(screen.getByText('已翻开: 1')).toBeInTheDocument()
          expect(screen.getByText('剩余: 3')).toBeInTheDocument()
        })
      }
    })
  })

  describe('Cross-Component Communication', () => {
    it('properly communicates between CardDeck and main game', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      const mockOnComplete = vi.fn()
      
      render(
        <CardFlipGame
          items={mockItems}
          quantity={3}
          allowRepeat={false}
          onComplete={mockOnComplete}
          soundEnabled={true}
        />
      )

      // CardDeck should communicate shuffle completion
      expect(screen.getByText('正在洗牌...')).toBeInTheDocument()
      
      const shuffleButton = screen.getByText('Complete Shuffle')
      await user.click(shuffleButton)
      
      // Game should respond to shuffle completion
      vi.advanceTimersByTime(100)
      await waitFor(() => {
        expect(screen.getByText('正在发牌...')).toBeInTheDocument()
      })
    })

    it('properly communicates between PlayingCard and main game', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      const mockOnComplete = vi.fn()
      
      render(
        <CardFlipGame
          items={mockItems}
          quantity={3}
          allowRepeat={false}
          onComplete={mockOnComplete}
          soundEnabled={true}
        />
      )

      // Get to card flipping phase
      const shuffleButton = screen.getByText('Complete Shuffle')
      await user.click(shuffleButton)
      vi.advanceTimersByTime(2000)

      // PlayingCard should communicate flip events
      const cards = screen.getAllByTestId(/playing-card-/)
      const firstCard = cards[0]
      const cardButton = firstCard.querySelector('button')
      
      if (cardButton) {
        await user.click(cardButton)
        
        // Game should respond to card flip
        expect(screen.getByText('翻牌中...')).toBeInTheDocument()
        
        vi.advanceTimersByTime(200)
        
        await waitFor(() => {
          expect(screen.getByText('已翻开: 1')).toBeInTheDocument()
        })
      }
    })
  })

  describe('End-to-End User Scenarios', () => {
    it('handles typical user lottery scenario', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      const mockOnComplete = vi.fn()
      
      // Scenario: User wants to select 3 winners from 5 participants
      render(
        <CardFlipGame
          items={mockItems}
          quantity={3}
          allowRepeat={false}
          onComplete={mockOnComplete}
          soundEnabled={true}
        />
      )

      // User sees initial lottery setup
      expect(screen.getByText('抽取数量: 3')).toBeInTheDocument()
      expect(screen.getByText('总项目: 5')).toBeInTheDocument()
      
      // User watches shuffle animation
      expect(screen.getByText('正在洗牌...')).toBeInTheDocument()
      
      // User triggers dealing by completing shuffle
      const shuffleButton = screen.getByText('Complete Shuffle')
      await user.click(shuffleButton)
      
      // User watches dealing animation
      vi.advanceTimersByTime(100)
      await waitFor(() => {
        expect(screen.getByText('正在发牌...')).toBeInTheDocument()
      })
      
      // User sees cards ready for flipping
      vi.advanceTimersByTime(2000)
      await waitFor(() => {
        expect(screen.getByText('点击卡牌进行翻牌')).toBeInTheDocument()
      })
      
      const cards = screen.getAllByTestId(/playing-card-/)
      expect(cards).toHaveLength(3)
      
      // User flips cards one by one
      for (let i = 0; i < cards.length; i++) {
        const card = cards[i]
        const cardButton = card.querySelector('button')
        
        if (cardButton) {
          await user.click(cardButton)
          vi.advanceTimersByTime(200)
          
          // User sees progress
          await waitFor(() => {
            expect(screen.getByText(`已翻开: ${i + 1}`)).toBeInTheDocument()
          })
        }
      }
      
      // User sees final results
      vi.advanceTimersByTime(1000)
      await waitFor(() => {
        expect(screen.getByText('抽奖完成！')).toBeInTheDocument()
        expect(screen.getByText('🎉 中奖者')).toBeInTheDocument()
      })
      
      // Verify results are provided to callback
      expect(mockOnComplete).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ name: expect.any(String) })
        ])
      )
    })

    it('handles power user scenario with maximum cards', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      const mockOnComplete = vi.fn()
      
      // Create larger participant list
      const largeItemList: ListItem[] = Array.from({ length: 20 }, (_, i) => ({
        id: `participant-${i}`,
        name: `参与者${i + 1}`
      }))
      
      render(
        <CardFlipGame
          items={largeItemList}
          quantity={10} // Maximum allowed
          allowRepeat={false}
          onComplete={mockOnComplete}
          soundEnabled={true}
        />
      )

      // Should handle maximum configuration
      expect(screen.getByText('抽取数量: 10')).toBeInTheDocument()
      expect(screen.getByText('总项目: 20')).toBeInTheDocument()
      
      // Complete full flow with maximum cards
      const shuffleButton = screen.getByText('Complete Shuffle')
      await user.click(shuffleButton)
      vi.advanceTimersByTime(3000) // More time for more cards
      
      const cards = screen.getAllByTestId(/playing-card-/)
      expect(cards).toHaveLength(10)
      
      // Flip all cards efficiently
      for (const card of cards) {
        const cardButton = card.querySelector('button')
        if (cardButton && !cardButton.disabled) {
          await user.click(cardButton)
          vi.advanceTimersByTime(100)
        }
      }
      
      vi.advanceTimersByTime(1000)
      
      // Should complete successfully
      expect(mockOnComplete).toHaveBeenCalled()
      const winners = mockOnComplete.mock.calls[0][0]
      expect(winners).toHaveLength(10)
    })

    it('handles edge case scenario with minimum requirements', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      const mockOnComplete = vi.fn()
      
      // Minimum viable scenario: exactly 3 items, 3 winners
      const minItems = mockItems.slice(0, 3)
      
      render(
        <CardFlipGame
          items={minItems}
          quantity={3}
          allowRepeat={false}
          onComplete={mockOnComplete}
          soundEnabled={true}
        />
      )

      expect(screen.getByText('抽取数量: 3')).toBeInTheDocument()
      expect(screen.getByText('总项目: 3')).toBeInTheDocument()
      
      // Complete flow
      const shuffleButton = screen.getByText('Complete Shuffle')
      await user.click(shuffleButton)
      vi.advanceTimersByTime(2000)
      
      const cards = screen.getAllByTestId(/playing-card-/)
      expect(cards).toHaveLength(3)
      
      // All cards should be winners
      for (const card of cards) {
        const cardButton = card.querySelector('button')
        if (cardButton) {
          await user.click(cardButton)
          vi.advanceTimersByTime(200)
        }
      }
      
      vi.advanceTimersByTime(1000)
      
      // Should show all participants as winners
      expect(mockOnComplete).toHaveBeenCalled()
      const winners = mockOnComplete.mock.calls[0][0]
      expect(winners).toHaveLength(3)
      expect(winners.every((w: ListItem) => minItems.some(item => item.id === w.id))).toBe(true)
    })
  })

  describe('System Reliability Integration', () => {
    it('maintains system stability under stress conditions', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      const mockOnComplete = vi.fn()
      
      render(
        <CardFlipGame
          items={mockItems}
          quantity={5}
          allowRepeat={true}
          onComplete={mockOnComplete}
          soundEnabled={true}
        />
      )

      // Rapid state changes
      const shuffleButton = screen.getByText('Complete Shuffle')
      await user.click(shuffleButton)
      
      // Simulate rapid user interactions
      vi.advanceTimersByTime(2000)
      
      const cards = screen.getAllByTestId(/playing-card-/)
      
      // Rapid clicking on multiple cards
      for (const card of cards) {
        const cardButton = card.querySelector('button')
        if (cardButton) {
          // Multiple rapid clicks
          await user.click(cardButton)
          await user.click(cardButton)
          await user.click(cardButton)
          vi.advanceTimersByTime(50)
        }
      }
      
      vi.advanceTimersByTime(2000)
      
      // System should remain stable
      expect(mockOnComplete).toHaveBeenCalledTimes(1)
      expect(screen.getByText('抽奖完成！')).toBeInTheDocument()
    })

    it('handles component unmounting during active game', () => {
      const mockOnComplete = vi.fn()
      
      const { unmount } = render(
        <CardFlipGame
          items={mockItems}
          quantity={3}
          allowRepeat={false}
          onComplete={mockOnComplete}
          soundEnabled={true}
        />
      )

      // Start game processes
      vi.advanceTimersByTime(1000)
      
      // Unmount during active game
      expect(() => unmount()).not.toThrow()
      
      // Should not call completion callback after unmount
      vi.advanceTimersByTime(5000)
      expect(mockOnComplete).not.toHaveBeenCalled()
    })

    it('recovers gracefully from animation failures', async () => {
      // Mock animation registration to fail
      vi.mocked(vi.importMock('@/lib/animation-performance')).useAnimationPerformance.mockReturnValue({
        shouldSkipAnimation: false,
        shouldEnableComplexAnimations: true,
        shouldEnableParticleEffects: true,
        shouldEnableShadows: true,
        getOptimizedDuration: (duration: number) => duration / 10,
        registerAnimation: vi.fn().mockReturnValue(false), // Fail registration
        unregisterAnimation: vi.fn(),
      })

      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      const mockOnComplete = vi.fn()
      
      render(
        <CardFlipGame
          items={mockItems}
          quantity={3}
          allowRepeat={false}
          onComplete={mockOnComplete}
          soundEnabled={true}
        />
      )

      // Should still complete successfully despite animation failures
      const shuffleButton = screen.getByText('Complete Shuffle')
      await user.click(shuffleButton)
      vi.advanceTimersByTime(2000)
      
      const cards = screen.getAllByTestId(/playing-card-/)
      for (const card of cards) {
        const cardButton = card.querySelector('button')
        if (cardButton) {
          await user.click(cardButton)
          vi.advanceTimersByTime(200)
        }
      }
      
      vi.advanceTimersByTime(1000)
      
      expect(mockOnComplete).toHaveBeenCalled()
    })
  })

  describe('Accessibility Integration', () => {
    it('maintains accessibility throughout game flow', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      const mockOnComplete = vi.fn()
      
      render(
        <CardFlipGame
          items={mockItems}
          quantity={3}
          allowRepeat={false}
          onComplete={mockOnComplete}
          soundEnabled={true}
        />
      )

      // Initial accessibility
      expect(screen.getByRole('img', { name: '正在洗牌...' })).toBeInTheDocument()
      
      // Transition to cards
      const shuffleButton = screen.getByText('Complete Shuffle')
      await user.click(shuffleButton)
      vi.advanceTimersByTime(2000)
      
      // Cards should be accessible
      const cards = screen.getAllByRole('button')
      expect(cards.length).toBeGreaterThan(0)
      
      // Each card should have proper ARIA labels
      cards.forEach(card => {
        expect(card).toHaveAttribute('aria-label')
        expect(card).toHaveAttribute('tabIndex')
      })
      
      // Keyboard navigation should work
      const firstCard = cards[0]
      firstCard.focus()
      expect(document.activeElement).toBe(firstCard)
      
      // Space key should trigger flip
      fireEvent.keyDown(firstCard, { key: ' ' })
      vi.advanceTimersByTime(200)
      
      // Should update accessibility labels
      await waitFor(() => {
        expect(firstCard).toHaveAttribute('aria-label', expect.stringContaining('已翻开'))
      })
    })
  })
})