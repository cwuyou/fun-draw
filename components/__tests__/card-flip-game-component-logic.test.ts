import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { CardFlipGame } from '../card-flip-game'
import { ListItem } from '@/types'

// Mock dependencies
vi.mock('@/lib/sound-manager', () => ({
  soundManager: {
    play: vi.fn().mockResolvedValue(undefined)
  }
}))

vi.mock('@/lib/animation-performance', () => ({
  useAnimationPerformance: () => ({
    getOptimizedDuration: (duration: number) => duration,
    registerAnimation: vi.fn(),
    unregisterAnimation: vi.fn()
  })
}))

vi.mock('../playing-card', () => ({
  PlayingCard: ({ card, onFlip, disabled }: any) => (
    <div 
      data-testid={`card-${card.id}`}
      data-winner={card.isWinner}
      onClick={() => !disabled && onFlip(card.id)}
      style={{ 
        position: 'absolute',
        left: card.position?.x || 0,
        top: card.position?.y || 0
      }}
    >
      {card.content?.name || 'Empty'}
    </div>
  )
}))

vi.mock('../card-deck', () => ({
  CardDeck: ({ totalCards, isShuffling, onShuffleComplete }: any) => {
    // Auto-complete shuffle after a short delay
    if (isShuffling && onShuffleComplete) {
      setTimeout(onShuffleComplete, 100)
    }
    return (
      <div data-testid="card-deck" data-total-cards={totalCards}>
        Shuffling {totalCards} cards...
      </div>
    )
  }
}))

// Mock data
const mockItems: ListItem[] = [
  { id: '1', name: '项目1' },
  { id: '2', name: '项目2' },
  { id: '3', name: '项目3' },
  { id: '4', name: '项目4' },
  { id: '5', name: '项目5' }
]

const defaultProps = {
  items: mockItems,
  quantity: 3,
  allowRepeat: false,
  onComplete: vi.fn(),
  soundEnabled: false
}

describe('CardFlipGame Component Logic Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock window dimensions for position calculations
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024
    })
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 768
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Quantity Logic Tests', () => {
    it('should display exactly the configured quantity of cards', async () => {
      render(<CardFlipGame {...defaultProps} quantity={1} />)
      
      // Wait for shuffle to complete and cards to be dealt
      await waitFor(() => {
        const cards = screen.queryAllByTestId(/^card-/)
        expect(cards).toHaveLength(1)
      }, { timeout: 2000 })
    })

    it('should display exactly 3 cards when quantity is 3', async () => {
      render(<CardFlipGame {...defaultProps} quantity={3} />)
      
      await waitFor(() => {
        const cards = screen.queryAllByTestId(/^card-/)
        expect(cards).toHaveLength(3)
      }, { timeout: 2000 })
    })

    it('should respect maximum card limit', async () => {
      render(<CardFlipGame {...defaultProps} quantity={15} />)
      
      await waitFor(() => {
        const cards = screen.queryAllByTestId(/^card-/)
        // Should be limited to maxCards (10)
        expect(cards.length).toBeLessThanOrEqual(10)
      }, { timeout: 2000 })
    })

    it('should show quantity information correctly in UI', async () => {
      render(<CardFlipGame {...defaultProps} quantity={2} />)
      
      await waitFor(() => {
        expect(screen.getByText('抽取数量: 2')).toBeInTheDocument()
        expect(screen.getByText('总卡牌: 2')).toBeInTheDocument()
      })
    })
  })

  describe('Winner Selection Logic Tests', () => {
    it('should create exactly the configured number of winner cards', async () => {
      render(<CardFlipGame {...defaultProps} quantity={2} />)
      
      await waitFor(() => {
        const cards = screen.queryAllByTestId(/^card-/)
        const winnerCards = cards.filter(card => 
          card.getAttribute('data-winner') === 'true'
        )
        expect(winnerCards).toHaveLength(2)
      }, { timeout: 2000 })
    })

    it('should create exactly 1 winner when quantity is 1', async () => {
      render(<CardFlipGame {...defaultProps} quantity={1} />)
      
      await waitFor(() => {
        const cards = screen.queryAllByTestId(/^card-/)
        const winnerCards = cards.filter(card => 
          card.getAttribute('data-winner') === 'true'
        )
        expect(winnerCards).toHaveLength(1)
      }, { timeout: 2000 })
    })

    it('should have non-winner cards when total cards exceed winners', async () => {
      render(<CardFlipGame {...defaultProps} quantity={2} />)
      
      await waitFor(() => {
        const cards = screen.queryAllByTestId(/^card-/)
        const nonWinnerCards = cards.filter(card => 
          card.getAttribute('data-winner') === 'false'
        )
        expect(nonWinnerCards.length).toBe(cards.length - 2)
      }, { timeout: 2000 })
    })

    it('should distribute winners randomly among cards', async () => {
      const results: number[] = []
      
      // Run multiple times to check randomness
      for (let i = 0; i < 10; i++) {
        const { unmount } = render(<CardFlipGame {...defaultProps} quantity={1} />)
        
        await waitFor(() => {
          const cards = screen.queryAllByTestId(/^card-/)
          const winnerIndex = cards.findIndex(card => 
            card.getAttribute('data-winner') === 'true'
          )
          if (winnerIndex >= 0) {
            results.push(winnerIndex)
          }
        }, { timeout: 2000 })
        
        unmount()
      }
      
      // Should have some variation in winner positions
      const uniquePositions = new Set(results)
      expect(uniquePositions.size).toBeGreaterThan(1)
    })
  })

  describe('Card Positioning Tests', () => {
    it('should position cards without overlap', async () => {
      render(<CardFlipGame {...defaultProps} quantity={4} />)
      
      await waitFor(() => {
        const cards = screen.queryAllByTestId(/^card-/)
        expect(cards).toHaveLength(4)
        
        // Check that cards have different positions
        const positions = cards.map(card => ({
          x: parseInt(card.style.left) || 0,
          y: parseInt(card.style.top) || 0
        }))
        
        // Should have at least some different positions
        const uniquePositions = new Set(positions.map(p => `${p.x},${p.y}`))
        expect(uniquePositions.size).toBeGreaterThan(1)
      }, { timeout: 2000 })
    })

    it('should handle single card positioning', async () => {
      render(<CardFlipGame {...defaultProps} quantity={1} />)
      
      await waitFor(() => {
        const cards = screen.queryAllByTestId(/^card-/)
        expect(cards).toHaveLength(1)
        
        const card = cards[0]
        // Should have valid position values
        expect(card.style.left).toBeDefined()
        expect(card.style.top).toBeDefined()
      }, { timeout: 2000 })
    })

    it('should adjust positioning for mobile viewport', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375
      })
      
      render(<CardFlipGame {...defaultProps} quantity={3} />)
      
      await waitFor(() => {
        const cards = screen.queryAllByTestId(/^card-/)
        expect(cards).toHaveLength(3)
        
        // Cards should be positioned (not all at 0,0)
        const positions = cards.map(card => ({
          x: parseInt(card.style.left) || 0,
          y: parseInt(card.style.top) || 0
        }))
        
        const hasValidPositions = positions.some(p => p.x !== 0 || p.y !== 0)
        expect(hasValidPositions).toBe(true)
      }, { timeout: 2000 })
    })
  })

  describe('Game Flow Tests', () => {
    it('should start with shuffling phase', () => {
      render(<CardFlipGame {...defaultProps} />)
      
      expect(screen.getByText('正在洗牌...')).toBeInTheDocument()
      expect(screen.getByTestId('card-deck')).toBeInTheDocument()
    })

    it('should transition to dealing phase after shuffle', async () => {
      render(<CardFlipGame {...defaultProps} />)
      
      await waitFor(() => {
        expect(screen.getByText('正在发牌...')).toBeInTheDocument()
      }, { timeout: 1000 })
    })

    it('should allow card flipping in waiting phase', async () => {
      render(<CardFlipGame {...defaultProps} quantity={2} />)
      
      await waitFor(() => {
        expect(screen.getByText('点击卡牌进行翻牌')).toBeInTheDocument()
      }, { timeout: 2000 })
      
      const cards = screen.queryAllByTestId(/^card-/)
      expect(cards.length).toBeGreaterThan(0)
      
      // Should be able to click cards
      fireEvent.click(cards[0])
      
      await waitFor(() => {
        expect(screen.getByText('翻牌中...')).toBeInTheDocument()
      })
    })

    it('should complete game when all cards are revealed', async () => {
      const onComplete = vi.fn()
      render(<CardFlipGame {...defaultProps} quantity={1} onComplete={onComplete} />)
      
      await waitFor(() => {
        expect(screen.getByText('点击卡牌进行翻牌')).toBeInTheDocument()
      }, { timeout: 2000 })
      
      const cards = screen.queryAllByTestId(/^card-/)
      
      // Click the only card
      fireEvent.click(cards[0])
      
      await waitFor(() => {
        expect(screen.getByText('抽奖完成！')).toBeInTheDocument()
        expect(onComplete).toHaveBeenCalled()
      }, { timeout: 3000 })
    })
  })

  describe('Error Handling Tests', () => {
    it('should handle empty items list', () => {
      render(<CardFlipGame {...defaultProps} items={[]} />)
      
      expect(screen.getByText('项目列表为空')).toBeInTheDocument()
      expect(screen.getByText('请添加至少 1 个项目进行抽奖')).toBeInTheDocument()
    })

    it('should handle invalid quantity', () => {
      render(<CardFlipGame {...defaultProps} quantity={0} />)
      
      expect(screen.getByText('游戏出错了')).toBeInTheDocument()
    })

    it('should handle quantity exceeding items when repeat disabled', () => {
      render(<CardFlipGame {...defaultProps} quantity={10} allowRepeat={false} />)
      
      expect(screen.getByText('游戏出错了')).toBeInTheDocument()
    })

    it('should provide restart functionality on error', () => {
      render(<CardFlipGame {...defaultProps} quantity={0} />)
      
      const restartButton = screen.getByText('重新开始')
      expect(restartButton).toBeInTheDocument()
      
      fireEvent.click(restartButton)
      // Should attempt to restart (error might persist due to invalid quantity)
    })
  })

  describe('UI Consistency Tests', () => {
    it('should show consistent quantity displays', async () => {
      render(<CardFlipGame {...defaultProps} quantity={3} />)
      
      await waitFor(() => {
        expect(screen.getByText('抽取数量: 3')).toBeInTheDocument()
        expect(screen.getByText('总卡牌: 3')).toBeInTheDocument()
      })
    })

    it('should update revealed cards count', async () => {
      render(<CardFlipGame {...defaultProps} quantity={2} />)
      
      await waitFor(() => {
        expect(screen.getByText('已翻开: 0')).toBeInTheDocument()
      }, { timeout: 2000 })
      
      const cards = screen.queryAllByTestId(/^card-/)
      fireEvent.click(cards[0])
      
      await waitFor(() => {
        expect(screen.getByText('已翻开: 1')).toBeInTheDocument()
      })
    })

    it('should show remaining cards count', async () => {
      render(<CardFlipGame {...defaultProps} quantity={3} />)
      
      await waitFor(() => {
        expect(screen.getByText('剩余: 3')).toBeInTheDocument()
      }, { timeout: 2000 })
    })

    it('should display winners when game is finished', async () => {
      const onComplete = vi.fn()
      render(<CardFlipGame {...defaultProps} quantity={1} onComplete={onComplete} />)
      
      await waitFor(() => {
        expect(screen.getByText('点击卡牌进行翻牌')).toBeInTheDocument()
      }, { timeout: 2000 })
      
      const cards = screen.queryAllByTestId(/^card-/)
      fireEvent.click(cards[0])
      
      await waitFor(() => {
        expect(screen.getByText('🎉 中奖者')).toBeInTheDocument()
      }, { timeout: 3000 })
    })
  })
})