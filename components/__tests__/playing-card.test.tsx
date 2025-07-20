import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PlayingCard } from '../playing-card'
import { GameCard, CardStyle } from '@/types'

// Mock the animation performance hook
const mockRegisterAnimation = vi.fn().mockReturnValue(true)
const mockUnregisterAnimation = vi.fn()

vi.mock('@/lib/animation-performance', () => ({
  useAnimationPerformance: () => ({
    shouldSkipAnimation: false,
    shouldEnableShadows: true,
    getOptimizedDuration: (duration: number) => duration,
    registerAnimation: mockRegisterAnimation,
    unregisterAnimation: mockUnregisterAnimation,
  })
}))

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

const mockGameCard: GameCard = {
  id: 'test-card-1',
  content: { id: '1', name: '测试用户' },
  position: {
    x: 0,
    y: 0,
    rotation: 0,
    cardWidth: 96,
    cardHeight: 144
  },
  isWinner: true
}

const mockEmptyCard: GameCard = {
  id: 'test-card-2',
  content: null,
  position: {
    x: 0,
    y: 0,
    rotation: 0,
    cardWidth: 96,
    cardHeight: 144
  },
  isWinner: false
}

describe('PlayingCard', () => {
  const mockOnFlip = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders card with correct dimensions and position', () => {
      render(
        <PlayingCard
          card={mockGameCard}
          isRevealed={false}
          onFlip={mockOnFlip}
          style={mockCardStyle}
          disabled={false}
        />
      )

      const cardContainer = screen.getByRole('button')
      expect(cardContainer).toBeInTheDocument()
      expect(cardContainer).toHaveStyle({
        width: '96px',
        height: '144px',
        transform: 'translate(0px, 0px) rotate(0deg)'
      })
    })

    it('renders card back when not revealed', () => {
      render(
        <PlayingCard
          card={mockGameCard}
          isRevealed={false}
          onFlip={mockOnFlip}
          style={mockCardStyle}
          disabled={false}
        />
      )

      expect(screen.getByText('测试样式')).toBeInTheDocument()
      expect(screen.queryByText('测试用户')).not.toBeInTheDocument()
    })

    it('renders card front when revealed', () => {
      render(
        <PlayingCard
          card={mockGameCard}
          isRevealed={true}
          onFlip={mockOnFlip}
          style={mockCardStyle}
          disabled={false}
        />
      )

      expect(screen.getByText('测试用户')).toBeInTheDocument()
      expect(screen.getByText('中奖！')).toBeInTheDocument()
    })

    it('renders empty card correctly', () => {
      render(
        <PlayingCard
          card={mockEmptyCard}
          isRevealed={true}
          onFlip={mockOnFlip}
          style={mockCardStyle}
          disabled={false}
        />
      )

      expect(screen.getByText('空卡')).toBeInTheDocument()
      expect(screen.queryByText('中奖！')).not.toBeInTheDocument()
    })

    it('applies disabled styles when disabled', () => {
      render(
        <PlayingCard
          card={mockGameCard}
          isRevealed={false}
          onFlip={mockOnFlip}
          style={mockCardStyle}
          disabled={true}
        />
      )

      const cardContainer = screen.getByRole('button')
      expect(cardContainer).toHaveClass('cursor-not-allowed', 'opacity-50')
      expect(cardContainer).toHaveAttribute('tabIndex', '-1')
    })
  })

  describe('Interaction', () => {
    it('calls onFlip when clicked and not disabled', async () => {
      const user = userEvent.setup()
      
      render(
        <PlayingCard
          card={mockGameCard}
          isRevealed={false}
          onFlip={mockOnFlip}
          style={mockCardStyle}
          disabled={false}
        />
      )

      const cardContainer = screen.getByRole('button')
      await user.click(cardContainer)

      expect(mockOnFlip).toHaveBeenCalledWith('test-card-1')
    })

    it('does not call onFlip when disabled', async () => {
      const user = userEvent.setup()
      
      render(
        <PlayingCard
          card={mockGameCard}
          isRevealed={false}
          onFlip={mockOnFlip}
          style={mockCardStyle}
          disabled={true}
        />
      )

      const cardContainer = screen.getByRole('button')
      await user.click(cardContainer)

      expect(mockOnFlip).not.toHaveBeenCalled()
    })

    it('does not call onFlip when already revealed', async () => {
      const user = userEvent.setup()
      
      render(
        <PlayingCard
          card={mockGameCard}
          isRevealed={true}
          onFlip={mockOnFlip}
          style={mockCardStyle}
          disabled={false}
        />
      )

      const cardContainer = screen.getByRole('button')
      await user.click(cardContainer)

      expect(mockOnFlip).not.toHaveBeenCalled()
    })

    it('handles keyboard interaction (Enter key)', async () => {
      const user = userEvent.setup()
      
      render(
        <PlayingCard
          card={mockGameCard}
          isRevealed={false}
          onFlip={mockOnFlip}
          style={mockCardStyle}
          disabled={false}
        />
      )

      const cardContainer = screen.getByRole('button')
      cardContainer.focus()
      await user.keyboard('{Enter}')

      expect(mockOnFlip).toHaveBeenCalledWith('test-card-1')
    })

    it('handles keyboard interaction (Space key)', async () => {
      const user = userEvent.setup()
      
      render(
        <PlayingCard
          card={mockGameCard}
          isRevealed={false}
          onFlip={mockOnFlip}
          style={mockCardStyle}
          disabled={false}
        />
      )

      const cardContainer = screen.getByRole('button')
      cardContainer.focus()
      await user.keyboard(' ')

      expect(mockOnFlip).toHaveBeenCalledWith('test-card-1')
    })
  })

  describe('Animation and State Management', () => {
    it('manages flipping state during animation', async () => {
      render(
        <PlayingCard
          card={mockGameCard}
          isRevealed={false}
          onFlip={mockOnFlip}
          style={mockCardStyle}
          disabled={false}
        />
      )

      const cardContainer = screen.getByRole('button')
      fireEvent.click(cardContainer)

      expect(mockOnFlip).toHaveBeenCalledWith('test-card-1')
      
      // During animation, clicking again should not trigger onFlip
      fireEvent.click(cardContainer)
      expect(mockOnFlip).toHaveBeenCalledTimes(1)
    })

    it('applies correct CSS classes for flip animation', () => {
      const { rerender } = render(
        <PlayingCard
          card={mockGameCard}
          isRevealed={false}
          onFlip={mockOnFlip}
          style={mockCardStyle}
          disabled={false}
        />
      )

      // Check initial state (not flipped)
      const cardContent = document.querySelector('.transform-style-preserve-3d')
      expect(cardContent).not.toHaveClass('rotate-y-180')

      // Check revealed state (flipped)
      rerender(
        <PlayingCard
          card={mockGameCard}
          isRevealed={true}
          onFlip={mockOnFlip}
          style={mockCardStyle}
          disabled={false}
        />
      )

      expect(cardContent).toHaveClass('rotate-y-180')
    })
  })

  describe('Accessibility', () => {
    it('has correct ARIA labels', () => {
      const { rerender } = render(
        <PlayingCard
          card={mockGameCard}
          isRevealed={false}
          onFlip={mockOnFlip}
          style={mockCardStyle}
          disabled={false}
        />
      )

      const cardContainer = screen.getByRole('button')
      expect(cardContainer).toHaveAttribute('aria-label', '点击翻牌')

      rerender(
        <PlayingCard
          card={mockGameCard}
          isRevealed={true}
          onFlip={mockOnFlip}
          style={mockCardStyle}
          disabled={false}
        />
      )

      expect(cardContainer).toHaveAttribute('aria-label', '已翻开: 测试用户')
    })

    it('handles empty card ARIA label correctly', () => {
      render(
        <PlayingCard
          card={mockEmptyCard}
          isRevealed={true}
          onFlip={mockOnFlip}
          style={mockCardStyle}
          disabled={false}
        />
      )

      const cardContainer = screen.getByRole('button')
      expect(cardContainer).toHaveAttribute('aria-label', '已翻开: 空卡')
    })

    it('is focusable when not disabled', () => {
      render(
        <PlayingCard
          card={mockGameCard}
          isRevealed={false}
          onFlip={mockOnFlip}
          style={mockCardStyle}
          disabled={false}
        />
      )

      const cardContainer = screen.getByRole('button')
      expect(cardContainer).toHaveAttribute('tabIndex', '0')
    })

    it('is not focusable when disabled', () => {
      render(
        <PlayingCard
          card={mockGameCard}
          isRevealed={false}
          onFlip={mockOnFlip}
          style={mockCardStyle}
          disabled={true}
        />
      )

      const cardContainer = screen.getByRole('button')
      expect(cardContainer).toHaveAttribute('tabIndex', '-1')
    })
  })

  describe('Responsive Design', () => {
    it('ensures minimum touch target size', () => {
      const smallCard: GameCard = {
        ...mockGameCard,
        position: {
          x: 0,
          y: 0,
          rotation: 0,
          cardWidth: 30,
          cardHeight: 40
        }
      }

      render(
        <PlayingCard
          card={smallCard}
          isRevealed={false}
          onFlip={mockOnFlip}
          style={mockCardStyle}
          disabled={false}
        />
      )

      const cardContainer = screen.getByRole('button')
      // Should expand to minimum touch size (44px)
      expect(cardContainer).toHaveStyle({
        width: '44px',
        height: '44px'
      })
    })

    it('uses card dimensions when larger than minimum touch size', () => {
      render(
        <PlayingCard
          card={mockGameCard}
          isRevealed={false}
          onFlip={mockOnFlip}
          style={mockCardStyle}
          disabled={false}
        />
      )

      const cardContainer = screen.getByRole('button')
      expect(cardContainer).toHaveStyle({
        width: '96px',
        height: '144px'
      })
    })

    it('adapts text size based on card dimensions', () => {
      const smallCard: GameCard = {
        ...mockGameCard,
        position: {
          x: 0,
          y: 0,
          rotation: 0,
          cardWidth: 80,
          cardHeight: 120
        }
      }

      render(
        <PlayingCard
          card={smallCard}
          isRevealed={true}
          onFlip={mockOnFlip}
          style={mockCardStyle}
          disabled={false}
        />
      )

      // Should use smaller text for smaller cards
      const nameElement = screen.getByText('测试用户')
      expect(nameElement).toHaveClass('text-xs')
    })
  })

  describe('Animation Performance Integration', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('registers animation when flipping', () => {
      render(
        <PlayingCard
          card={mockGameCard}
          isRevealed={false}
          onFlip={mockOnFlip}
          style={mockCardStyle}
          disabled={false}
        />
      )

      const cardContainer = screen.getByRole('button')
      fireEvent.click(cardContainer)

      expect(mockRegisterAnimation).toHaveBeenCalledWith(`card-flip-${mockGameCard.id}`)
    })

    it('unregisters animation after flip completes', () => {
      render(
        <PlayingCard
          card={mockGameCard}
          isRevealed={false}
          onFlip={mockOnFlip}
          style={mockCardStyle}
          disabled={false}
        />
      )

      const cardContainer = screen.getByRole('button')
      fireEvent.click(cardContainer)

      // Fast-forward through animation duration
      vi.advanceTimersByTime(600)

      expect(mockUnregisterAnimation).toHaveBeenCalledWith(`card-flip-${mockGameCard.id}`)
    })

    it('handles animation registration failure gracefully', () => {
      mockRegisterAnimation.mockReturnValueOnce(false)

      render(
        <PlayingCard
          card={mockGameCard}
          isRevealed={false}
          onFlip={mockOnFlip}
          style={mockCardStyle}
          disabled={false}
        />
      )

      const cardContainer = screen.getByRole('button')
      fireEvent.click(cardContainer)

      // Should still call onFlip even if animation registration fails
      expect(mockOnFlip).toHaveBeenCalledWith('test-card-1')
    })

    it('cleans up animation registration on unmount', () => {
      const { unmount } = render(
        <PlayingCard
          card={mockGameCard}
          isRevealed={false}
          onFlip={mockOnFlip}
          style={mockCardStyle}
          disabled={false}
        />
      )

      unmount()

      expect(mockUnregisterAnimation).toHaveBeenCalledWith(`card-flip-${mockGameCard.id}`)
    })
  })

  describe('Performance Optimizations', () => {
    it('applies optimized animation duration', () => {
      const mockGetOptimizedDuration = vi.fn().mockReturnValue(300)
      
      vi.mocked(vi.importMock('@/lib/animation-performance')).useAnimationPerformance.mockReturnValue({
        shouldSkipAnimation: false,
        shouldEnableShadows: true,
        getOptimizedDuration: mockGetOptimizedDuration,
        registerAnimation: mockRegisterAnimation,
        unregisterAnimation: mockUnregisterAnimation,
      })

      render(
        <PlayingCard
          card={mockGameCard}
          isRevealed={false}
          onFlip={mockOnFlip}
          style={mockCardStyle}
          disabled={false}
        />
      )

      expect(mockGetOptimizedDuration).toHaveBeenCalledWith(600)
    })

    it('skips animation when performance is limited', () => {
      vi.mocked(vi.importMock('@/lib/animation-performance')).useAnimationPerformance.mockReturnValue({
        shouldSkipAnimation: true,
        shouldEnableShadows: false,
        getOptimizedDuration: () => 100,
        registerAnimation: mockRegisterAnimation,
        unregisterAnimation: mockUnregisterAnimation,
      })

      render(
        <PlayingCard
          card={mockGameCard}
          isRevealed={true}
          onFlip={mockOnFlip}
          style={mockCardStyle}
          disabled={false}
        />
      )

      const cardContent = document.querySelector('.transform-style-preserve-3d')
      expect(cardContent).toHaveClass('transition-none')
    })
  })

  describe('Edge Cases', () => {
    it('handles missing card position gracefully', () => {
      const cardWithoutDimensions: GameCard = {
        ...mockGameCard,
        position: {
          x: 0,
          y: 0,
          rotation: 0
          // Missing cardWidth and cardHeight
        }
      }

      render(
        <PlayingCard
          card={cardWithoutDimensions}
          isRevealed={false}
          onFlip={mockOnFlip}
          style={mockCardStyle}
          disabled={false}
        />
      )

      // Should use default dimensions
      const cardContainer = screen.getByRole('button')
      expect(cardContainer).toHaveStyle({
        width: '96px',
        height: '144px'
      })
    })

    it('prevents multiple rapid clicks during animation', async () => {
      vi.useFakeTimers()
      
      render(
        <PlayingCard
          card={mockGameCard}
          isRevealed={false}
          onFlip={mockOnFlip}
          style={mockCardStyle}
          disabled={false}
        />
      )

      const cardContainer = screen.getByRole('button')
      
      // First click
      fireEvent.click(cardContainer)
      expect(mockOnFlip).toHaveBeenCalledTimes(1)
      
      // Rapid subsequent clicks should be ignored
      fireEvent.click(cardContainer)
      fireEvent.click(cardContainer)
      expect(mockOnFlip).toHaveBeenCalledTimes(1)
      
      vi.useRealTimers()
    })

    it('handles custom className prop', () => {
      render(
        <PlayingCard
          card={mockGameCard}
          isRevealed={false}
          onFlip={mockOnFlip}
          style={mockCardStyle}
          disabled={false}
          className="custom-class"
        />
      )

      const cardContainer = screen.getByRole('button')
      expect(cardContainer).toHaveClass('custom-class')
    })
  })
})