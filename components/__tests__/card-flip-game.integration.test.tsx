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

// Mock the animation performance hook with realistic settings
vi.mock('@/lib/animation-performance', () => ({
  useAnimationPerformance: () => ({
    shouldSkipAnimation: false,
    shouldEnableComplexAnimations: true,
    shouldEnableParticleEffects: true,
    shouldEnableShadows: true,
    getOptimizedDuration: (duration: number) => Math.max(duration / 20, 50), // Speed up but not too fast
    registerAnimation: vi.fn().mockReturnValue(true),
    unregisterAnimation: vi.fn(),
  })
}))

const mockItems: ListItem[] = [
  { id: '1', name: '张三' },
  { id: '2', name: '李四' },
  { id: '3', name: '王五' },
  { id: '4', name: '赵六' },
  { id: '5', name: '钱七' },
  { id: '6', name: '孙八' },
  { id: '7', name: '周九' },
  { id: '8', name: '吴十' },
]

describe('CardFlipGame Integration Tests', () => {
  const mockOnComplete = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    
    // Mock window dimensions for consistent testing
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
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('Complete Game Flow Integration', () => {
    it('completes full game flow from start to finish', async () => {
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

      // 1. Initial state - should show shuffling
      expect(screen.getByText('正在洗牌...')).toBeInTheDocument()
      expect(screen.getByTestId('card-deck')).toBeInTheDocument()
      expect(screen.getByText('抽取数量: 4')).toBeInTheDocument()
      expect(screen.getByText('总项目: 8')).toBeInTheDocument()

      // 2. Complete shuffle phase
      const shuffleButton = screen.getByText('Complete Shuffle')
      await user.click(shuffleButton)
      
      // Should transition to dealing
      vi.advanceTimersByTime(100)
      await waitFor(() => {
        expect(screen.getByText('正在发牌...')).toBeInTheDocument()
      })

      // 3. Wait for dealing to complete
      vi.advanceTimersByTime(2000) // Allow time for all cards to be dealt
      
      await waitFor(() => {
        expect(screen.getByText('点击卡牌进行翻牌')).toBeInTheDocument()
      })

      // 4. Verify cards are dealt
      const cards = screen.getAllByTestId(/playing-card-/)
      expect(cards).toHaveLength(4)
      
      // All cards should show back initially
      cards.forEach(card => {
        expect(card.querySelector('button')).toHaveTextContent('Card Back')
      })

      // 5. Flip cards one by one
      for (let i = 0; i < cards.length; i++) {
        const card = cards[i]
        const cardButton = card.querySelector('button')
        
        if (cardButton && !cardButton.disabled) {
          await user.click(cardButton)
          
          // Should show revealing state
          if (i < cards.length - 1) {
            expect(screen.getByText('翻牌中...')).toBeInTheDocument()
          }
          
          // Wait for flip animation
          vi.advanceTimersByTime(200)
          
          // Card should now show content
          await waitFor(() => {
            expect(cardButton.textContent).not.toBe('Card Back')
          })
          
          // Update revealed count
          await waitFor(() => {
            expect(screen.getByText(`已翻开: ${i + 1}`)).toBeInTheDocument()
            expect(screen.getByText(`剩余: ${cards.length - (i + 1)}`)).toBeInTheDocument()
          })
        }
      }

      // 6. Game should complete
      vi.advanceTimersByTime(1000)
      
      await waitFor(() => {
        expect(screen.getByText('抽奖完成！')).toBeInTheDocument()
        expect(screen.getByText('🎉 中奖者')).toBeInTheDocument()
      })

      // 7. Verify completion callback
      expect(mockOnComplete).toHaveBeenCalledTimes(1)
      const winners = mockOnComplete.mock.calls[0][0]
      expect(winners).toHaveLength(4)
      expect(winners.every((winner: ListItem) => mockItems.some(item => item.id === winner.id))).toBe(true)
    })

    it('handles complete game flow with sound effects', async () => {
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

      // Complete shuffle
      const shuffleButton = screen.getByText('Complete Shuffle')
      await user.click(shuffleButton)
      vi.advanceTimersByTime(2000)

      // Flip all cards
      const cards = screen.getAllByTestId(/playing-card-/)
      for (const card of cards) {
        const cardButton = card.querySelector('button')
        if (cardButton && !cardButton.disabled) {
          await user.click(cardButton)
          vi.advanceTimersByTime(200)
        }
      }

      vi.advanceTimersByTime(1000)

      // Verify sound effects were played
      expect(mockSoundManager.play).toHaveBeenCalledWith('card-flip')
      expect(mockSoundManager.play).toHaveBeenCalledWith('card-reveal')
    })

    it('handles game flow with sound disabled', async () => {
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

      // Complete full flow
      const shuffleButton = screen.getByText('Complete Shuffle')
      await user.click(shuffleButton)
      vi.advanceTimersByTime(2000)

      const cards = screen.getAllByTestId(/playing-card-/)
      for (const card of cards) {
        const cardButton = card.querySelector('button')
        if (cardButton && !cardButton.disabled) {
          await user.click(cardButton)
          vi.advanceTimersByTime(200)
        }
      }

      vi.advanceTimersByTime(1000)

      // Sound should not be played when disabled
      expect(mockSoundManager.play).not.toHaveBeenCalled()
    })
  })

  describe('Responsive Layout Integration', () => {
    it('adapts layout for mobile devices', async () => {
      // Mock mobile screen size
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })

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
      vi.advanceTimersByTime(2000)

      // Should have cards arranged for mobile
      const cards = screen.getAllByTestId(/playing-card-/)
      expect(cards).toHaveLength(4)

      // Game should still be fully functional
      for (const card of cards) {
        const cardButton = card.querySelector('button')
        if (cardButton && !cardButton.disabled) {
          await user.click(cardButton)
          vi.advanceTimersByTime(200)
        }
      }

      vi.advanceTimersByTime(1000)
      expect(mockOnComplete).toHaveBeenCalled()
    })

    it('adapts layout for tablet devices', async () => {
      // Mock tablet screen size
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
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

      // Complete shuffle and dealing
      const shuffleButton = screen.getByText('Complete Shuffle')
      await user.click(shuffleButton)
      vi.advanceTimersByTime(2000)

      // Should have cards arranged for tablet
      const cards = screen.getAllByTestId(/playing-card-/)
      expect(cards).toHaveLength(6)

      // Verify game completion
      for (const card of cards) {
        const cardButton = card.querySelector('button')
        if (cardButton && !cardButton.disabled) {
          await user.click(cardButton)
          vi.advanceTimersByTime(200)
        }
      }

      vi.advanceTimersByTime(1000)
      expect(mockOnComplete).toHaveBeenCalled()
    })

    it('handles window resize during gameplay', async () => {
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

      // Start game
      const shuffleButton = screen.getByText('Complete Shuffle')
      await user.click(shuffleButton)
      vi.advanceTimersByTime(2000)

      // Resize window during gameplay
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 500,
      })
      fireEvent(window, new Event('resize'))

      // Game should continue to work
      const cards = screen.getAllByTestId(/playing-card-/)
      expect(cards).toHaveLength(4)

      // Complete game
      for (const card of cards) {
        const cardButton = card.querySelector('button')
        if (cardButton && !cardButton.disabled) {
          await user.click(cardButton)
          vi.advanceTimersByTime(200)
        }
      }

      vi.advanceTimersByTime(1000)
      expect(mockOnComplete).toHaveBeenCalled()
    })
  })

  describe('Winner Selection Integration', () => {
    it('ensures no duplicate winners when allowRepeat is false', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      
      render(
        <CardFlipGame
          items={mockItems}
          quantity={5}
          allowRepeat={false}
          onComplete={mockOnComplete}
          soundEnabled={true}
        />
      )

      // Complete full game
      const shuffleButton = screen.getByText('Complete Shuffle')
      await user.click(shuffleButton)
      vi.advanceTimersByTime(2000)

      const cards = screen.getAllByTestId(/playing-card-/)
      for (const card of cards) {
        const cardButton = card.querySelector('button')
        if (cardButton && !cardButton.disabled) {
          await user.click(cardButton)
          vi.advanceTimersByTime(200)
        }
      }

      vi.advanceTimersByTime(1000)

      // Verify no duplicate winners
      const winners = mockOnComplete.mock.calls[0][0]
      const winnerIds = winners.map((w: ListItem) => w.id)
      const uniqueIds = [...new Set(winnerIds)]
      expect(uniqueIds).toHaveLength(winnerIds.length)
    })

    it('allows duplicate winners when allowRepeat is true', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      
      // Use only 2 items but want 4 winners
      const limitedItems = mockItems.slice(0, 2)
      
      render(
        <CardFlipGame
          items={limitedItems}
          quantity={4}
          allowRepeat={true}
          onComplete={mockOnComplete}
          soundEnabled={true}
        />
      )

      // Complete full game
      const shuffleButton = screen.getByText('Complete Shuffle')
      await user.click(shuffleButton)
      vi.advanceTimersByTime(2000)

      const cards = screen.getAllByTestId(/playing-card-/)
      for (const card of cards) {
        const cardButton = card.querySelector('button')
        if (cardButton && !cardButton.disabled) {
          await user.click(cardButton)
          vi.advanceTimersByTime(200)
        }
      }

      vi.advanceTimersByTime(1000)

      // Should have 4 winners even with only 2 available items
      const winners = mockOnComplete.mock.calls[0][0]
      expect(winners).toHaveLength(4)
      expect(winners.every((w: ListItem) => limitedItems.some(item => item.id === w.id))).toBe(true)
    })
  })

  describe('Error Handling Integration', () => {
    it('handles insufficient items gracefully', () => {
      render(
        <CardFlipGame
          items={[mockItems[0], mockItems[1]]} // Only 2 items
          quantity={4}
          allowRepeat={false}
          onComplete={mockOnComplete}
          soundEnabled={true}
        />
      )

      // Should show error message instead of starting game
      expect(screen.getByText('项目数量不足')).toBeInTheDocument()
      expect(screen.getByText(/卡牌抽奖需要至少 3 个项目/)).toBeInTheDocument()
      expect(screen.queryByTestId('card-deck')).not.toBeInTheDocument()
    })

    it('handles sound errors gracefully during full game flow', async () => {
      // Mock sound to fail occasionally
      mockSoundManager.play.mockImplementation((soundType: string) => {
        if (soundType === 'card-flip') {
          return Promise.reject(new Error('Audio failed'))
        }
        return Promise.resolve()
      })

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

      // Game should complete successfully despite sound errors
      const shuffleButton = screen.getByText('Complete Shuffle')
      await user.click(shuffleButton)
      vi.advanceTimersByTime(2000)

      const cards = screen.getAllByTestId(/playing-card-/)
      for (const card of cards) {
        const cardButton = card.querySelector('button')
        if (cardButton && !cardButton.disabled) {
          await user.click(cardButton)
          vi.advanceTimersByTime(200)
        }
      }

      vi.advanceTimersByTime(1000)

      // Game should complete successfully
      expect(mockOnComplete).toHaveBeenCalled()
      expect(screen.getByText('抽奖完成！')).toBeInTheDocument()
    })
  })

  describe('Performance Integration', () => {
    it('handles large number of items efficiently', async () => {
      // Create a large list of items
      const largeItemList: ListItem[] = Array.from({ length: 100 }, (_, i) => ({
        id: `item-${i}`,
        name: `用户${i + 1}`
      }))

      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      
      render(
        <CardFlipGame
          items={largeItemList}
          quantity={8}
          allowRepeat={false}
          onComplete={mockOnComplete}
          soundEnabled={true}
        />
      )

      // Should handle large dataset without issues
      expect(screen.getByText('总项目: 100')).toBeInTheDocument()

      // Complete game flow
      const shuffleButton = screen.getByText('Complete Shuffle')
      await user.click(shuffleButton)
      vi.advanceTimersByTime(2000)

      const cards = screen.getAllByTestId(/playing-card-/)
      expect(cards).toHaveLength(8)

      // Complete game
      for (const card of cards) {
        const cardButton = card.querySelector('button')
        if (cardButton && !cardButton.disabled) {
          await user.click(cardButton)
          vi.advanceTimersByTime(200)
        }
      }

      vi.advanceTimersByTime(1000)
      expect(mockOnComplete).toHaveBeenCalled()
    })

    it('maintains performance with maximum cards', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      
      render(
        <CardFlipGame
          items={mockItems}
          quantity={10} // Maximum allowed
          allowRepeat={true}
          onComplete={mockOnComplete}
          soundEnabled={true}
        />
      )

      // Should cap at maximum
      expect(screen.getByText('抽取数量: 10')).toBeInTheDocument()

      // Complete game flow
      const shuffleButton = screen.getByText('Complete Shuffle')
      await user.click(shuffleButton)
      vi.advanceTimersByTime(3000) // More time for more cards

      const cards = screen.getAllByTestId(/playing-card-/)
      expect(cards).toHaveLength(10)

      // Complete game (flip all cards)
      for (const card of cards) {
        const cardButton = card.querySelector('button')
        if (cardButton && !cardButton.disabled) {
          await user.click(cardButton)
          vi.advanceTimersByTime(100)
        }
      }

      vi.advanceTimersByTime(1000)
      expect(mockOnComplete).toHaveBeenCalled()
    })
  })

  describe('User Experience Integration', () => {
    it('provides consistent feedback throughout game flow', async () => {
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

      // Phase 1: Shuffling feedback
      expect(screen.getByText('正在洗牌...')).toBeInTheDocument()
      expect(screen.getByText('已翻开: 0')).toBeInTheDocument()

      // Phase 2: Dealing feedback
      const shuffleButton = screen.getByText('Complete Shuffle')
      await user.click(shuffleButton)
      vi.advanceTimersByTime(100)
      
      await waitFor(() => {
        expect(screen.getByText('正在发牌...')).toBeInTheDocument()
      })

      // Phase 3: Waiting feedback
      vi.advanceTimersByTime(2000)
      await waitFor(() => {
        expect(screen.getByText('点击卡牌进行翻牌')).toBeInTheDocument()
      })

      // Phase 4: Progressive flip feedback
      const cards = screen.getAllByTestId(/playing-card-/)
      for (let i = 0; i < cards.length; i++) {
        const card = cards[i]
        const cardButton = card.querySelector('button')
        
        if (cardButton && !cardButton.disabled) {
          await user.click(cardButton)
          
          // Should show revealing state
          expect(screen.getByText('翻牌中...')).toBeInTheDocument()
          
          vi.advanceTimersByTime(200)
          
          // Should update counters
          await waitFor(() => {
            expect(screen.getByText(`已翻开: ${i + 1}`)).toBeInTheDocument()
          })
        }
      }

      // Phase 5: Completion feedback
      vi.advanceTimersByTime(1000)
      await waitFor(() => {
        expect(screen.getByText('抽奖完成！')).toBeInTheDocument()
        expect(screen.getByText('🎉 中奖者')).toBeInTheDocument()
      })
    })

    it('handles rapid user interactions gracefully', async () => {
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
      vi.advanceTimersByTime(2000)

      // Try to click cards rapidly
      const cards = screen.getAllByTestId(/playing-card-/)
      const firstCard = cards[0]
      const cardButton = firstCard.querySelector('button')
      
      if (cardButton) {
        // Rapid clicks should be handled gracefully
        await user.click(cardButton)
        await user.click(cardButton) // Should be ignored
        await user.click(cardButton) // Should be ignored
        
        vi.advanceTimersByTime(200)
        
        // Should only register one flip
        expect(screen.getByText('已翻开: 1')).toBeInTheDocument()
      }
    })
  })
})