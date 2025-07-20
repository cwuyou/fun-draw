import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { CardDeck } from '../card-deck'

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
const mockGetOptimizedDuration = vi.fn((duration: number) => duration)

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

describe('CardDeck', () => {
  const mockOnShuffleComplete = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('Rendering', () => {
    it('renders card deck with correct number of cards', () => {
      render(
        <CardDeck
          totalCards={5}
          isShuffling={false}
          onShuffleComplete={mockOnShuffleComplete}
        />
      )

      const deck = screen.getByRole('img', { name: '卡牌堆' })
      expect(deck).toBeInTheDocument()
      
      // Should render 5 card elements
      const cards = document.querySelectorAll('.absolute.inset-0')
      expect(cards).toHaveLength(5)
    })

    it('displays shuffling indicator when shuffling', () => {
      render(
        <CardDeck
          totalCards={5}
          isShuffling={true}
          onShuffleComplete={mockOnShuffleComplete}
        />
      )

      expect(screen.getByRole('img', { name: '正在洗牌...' })).toBeInTheDocument()
      expect(screen.getByText('洗牌中...')).toBeInTheDocument()
      
      // Should show animated dots
      const dots = document.querySelectorAll('.animate-bounce')
      expect(dots).toHaveLength(3)
    })

    it('applies correct CSS classes for card styling', () => {
      render(
        <CardDeck
          totalCards={3}
          isShuffling={false}
          onShuffleComplete={mockOnShuffleComplete}
        />
      )

      const cards = document.querySelectorAll('.bg-gradient-to-br.from-blue-600.to-blue-800')
      expect(cards).toHaveLength(3)
      
      cards.forEach(card => {
        expect(card).toHaveClass('rounded-lg', 'shadow-lg', 'border-2', 'border-gray-200')
      })
    })
  })

  describe('Shuffling Animation', () => {
    it('starts shuffling animation when isShuffling becomes true', async () => {
      const { rerender } = render(
        <CardDeck
          totalCards={5}
          isShuffling={false}
          onShuffleComplete={mockOnShuffleComplete}
        />
      )

      // Start shuffling
      rerender(
        <CardDeck
          totalCards={5}
          isShuffling={true}
          onShuffleComplete={mockOnShuffleComplete}
        />
      )

      // Should show shuffling state immediately
      expect(screen.getByText('洗牌中...')).toBeInTheDocument()
    })

    it('calls onShuffleComplete after animation duration', async () => {
      render(
        <CardDeck
          totalCards={5}
          isShuffling={true}
          onShuffleComplete={mockOnShuffleComplete}
        />
      )

      // Fast-forward through the shuffle animation (2500ms + 300ms delay)
      vi.advanceTimersByTime(2800)

      await waitFor(() => {
        expect(mockOnShuffleComplete).toHaveBeenCalledTimes(1)
      })
    })

    it('applies animation styles during shuffling', () => {
      render(
        <CardDeck
          totalCards={3}
          isShuffling={true}
          onShuffleComplete={mockOnShuffleComplete}
        />
      )

      const cards = document.querySelectorAll('.absolute.inset-0')
      cards.forEach(card => {
        expect(card).toHaveClass('transition-none')
      })
    })

    it('shows particle effects during shuffling when enabled', () => {
      render(
        <CardDeck
          totalCards={5}
          isShuffling={true}
          onShuffleComplete={mockOnShuffleComplete}
        />
      )

      // Should show particle effects
      const particles = document.querySelectorAll('.bg-blue-300.rounded-full')
      expect(particles.length).toBeGreaterThan(0)
    })
  })

  describe('Animation Performance Optimization', () => {
    it('uses optimized animation when performance is limited', () => {
      // Mock limited performance
      vi.mocked(vi.importMock('@/lib/animation-performance')).useAnimationPerformance.mockReturnValue({
        shouldSkipAnimation: true,
        shouldEnableComplexAnimations: false,
        shouldEnableParticleEffects: false,
        shouldEnableShadows: false,
        getOptimizedDuration: () => 100,
        registerAnimation: vi.fn().mockReturnValue(true),
        unregisterAnimation: vi.fn(),
      })

      render(
        <CardDeck
          totalCards={5}
          isShuffling={true}
          onShuffleComplete={mockOnShuffleComplete}
        />
      )

      // Should complete quickly with reduced animation
      vi.advanceTimersByTime(200)

      expect(mockOnShuffleComplete).toHaveBeenCalled()
    })

    it('skips animation registration when it fails', () => {
      // Mock failed animation registration
      vi.mocked(vi.importMock('@/lib/animation-performance')).useAnimationPerformance.mockReturnValue({
        shouldSkipAnimation: false,
        shouldEnableComplexAnimations: true,
        shouldEnableParticleEffects: true,
        shouldEnableShadows: true,
        getOptimizedDuration: (duration: number) => duration,
        registerAnimation: vi.fn().mockReturnValue(false),
        unregisterAnimation: vi.fn(),
      })

      render(
        <CardDeck
          totalCards={5}
          isShuffling={true}
          onShuffleComplete={mockOnShuffleComplete}
        />
      )

      // Should complete quickly when animation registration fails
      vi.advanceTimersByTime(200)

      expect(mockOnShuffleComplete).toHaveBeenCalled()
    })
  })

  describe('Sound Integration', () => {
    it('plays shuffle sound when shuffling starts', () => {
      const { soundManager } = require('@/lib/sound-manager')
      
      render(
        <CardDeck
          totalCards={5}
          isShuffling={true}
          onShuffleComplete={mockOnShuffleComplete}
        />
      )

      expect(soundManager.play).toHaveBeenCalledWith('card-shuffle')
    })

    it('stops shuffle sound when shuffling completes', () => {
      const { soundManager } = require('@/lib/sound-manager')
      
      render(
        <CardDeck
          totalCards={5}
          isShuffling={true}
          onShuffleComplete={mockOnShuffleComplete}
        />
      )

      // Complete the shuffle animation
      vi.advanceTimersByTime(2800)

      expect(soundManager.stop).toHaveBeenCalledWith('card-shuffle')
    })

    it('stops shuffle sound when component unmounts during shuffling', () => {
      const { soundManager } = require('@/lib/sound-manager')
      
      const { unmount } = render(
        <CardDeck
          totalCards={5}
          isShuffling={true}
          onShuffleComplete={mockOnShuffleComplete}
        />
      )

      unmount()

      expect(soundManager.stop).toHaveBeenCalledWith('card-shuffle')
    })
  })

  describe('Card Positioning and Stacking', () => {
    it('positions cards with proper z-index stacking', () => {
      render(
        <CardDeck
          totalCards={3}
          isShuffling={false}
          onShuffleComplete={mockOnShuffleComplete}
        />
      )

      const cards = document.querySelectorAll('.absolute.inset-0')
      
      // Check that cards have different z-index values for stacking
      const zIndexValues = Array.from(cards).map(card => 
        parseInt((card as HTMLElement).style.zIndex)
      )
      
      // Should have descending z-index values (top card has highest z-index)
      expect(zIndexValues).toEqual([3, 2, 1])
    })

    it('applies random positioning offsets for realistic stacking', () => {
      render(
        <CardDeck
          totalCards={3}
          isShuffling={false}
          onShuffleComplete={mockOnShuffleComplete}
        />
      )

      const cards = document.querySelectorAll('.absolute.inset-0')
      
      // Each card should have slight random positioning
      cards.forEach(card => {
        const transform = (card as HTMLElement).style.transform
        expect(transform).toMatch(/translate\(.*px, .*px\) rotate\(.*deg\)/)
      })
    })
  })

  describe('Animation Registration and Management', () => {
    it('registers animation when shuffling starts', () => {
      render(
        <CardDeck
          totalCards={5}
          isShuffling={true}
          onShuffleComplete={mockOnShuffleComplete}
        />
      )

      expect(mockRegisterAnimation).toHaveBeenCalledWith('card-shuffle')
    })

    it('unregisters animation when shuffling completes', () => {
      render(
        <CardDeck
          totalCards={5}
          isShuffling={true}
          onShuffleComplete={mockOnShuffleComplete}
        />
      )

      vi.advanceTimersByTime(2800)

      expect(mockUnregisterAnimation).toHaveBeenCalledWith('card-shuffle')
    })

    it('handles animation registration failure gracefully', () => {
      mockRegisterAnimation.mockReturnValueOnce(false)

      render(
        <CardDeck
          totalCards={5}
          isShuffling={true}
          onShuffleComplete={mockOnShuffleComplete}
        />
      )

      // Should complete quickly when animation registration fails
      vi.advanceTimersByTime(200)

      expect(mockOnShuffleComplete).toHaveBeenCalled()
    })
  })

  describe('Performance Optimizations', () => {
    it('uses optimized duration from performance manager', () => {
      render(
        <CardDeck
          totalCards={5}
          isShuffling={true}
          onShuffleComplete={mockOnShuffleComplete}
        />
      )

      expect(mockGetOptimizedDuration).toHaveBeenCalledWith(2500)
    })

    it('adapts animation complexity based on performance settings', () => {
      // Mock complex animations disabled
      vi.mocked(vi.importMock('@/lib/animation-performance')).useAnimationPerformance.mockReturnValue({
        shouldSkipAnimation: false,
        shouldEnableComplexAnimations: false,
        shouldEnableParticleEffects: false,
        shouldEnableShadows: true,
        getOptimizedDuration: mockGetOptimizedDuration,
        registerAnimation: mockRegisterAnimation,
        unregisterAnimation: mockUnregisterAnimation,
      })

      render(
        <CardDeck
          totalCards={5}
          isShuffling={true}
          onShuffleComplete={mockOnShuffleComplete}
        />
      )

      // Should not show particle effects when disabled
      const particles = document.querySelectorAll('.bg-blue-300.rounded-full')
      expect(particles).toHaveLength(0)
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('handles zero cards gracefully', () => {
      render(
        <CardDeck
          totalCards={0}
          isShuffling={false}
          onShuffleComplete={mockOnShuffleComplete}
        />
      )

      const cards = document.querySelectorAll('.absolute.inset-0')
      expect(cards).toHaveLength(0)
    })

    it('handles large number of cards', () => {
      render(
        <CardDeck
          totalCards={20}
          isShuffling={false}
          onShuffleComplete={mockOnShuffleComplete}
        />
      )

      const cards = document.querySelectorAll('.absolute.inset-0')
      expect(cards).toHaveLength(20)
    })

    it('handles sound play errors gracefully', () => {
      mockSoundManager.play.mockRejectedValueOnce(new Error('Audio failed'))

      render(
        <CardDeck
          totalCards={5}
          isShuffling={true}
          onShuffleComplete={mockOnShuffleComplete}
        />
      )

      // Should not throw error and continue with animation
      expect(() => vi.advanceTimersByTime(2800)).not.toThrow()
      expect(mockOnShuffleComplete).toHaveBeenCalled()
    })

    it('applies custom className when provided', () => {
      render(
        <CardDeck
          totalCards={5}
          isShuffling={false}
          onShuffleComplete={mockOnShuffleComplete}
          className="custom-deck-class"
        />
      )

      const deck = screen.getByRole('img', { name: '卡牌堆' })
      expect(deck).toHaveClass('custom-deck-class')
    })
  })

  describe('Cleanup and Memory Management', () => {
    it('cleans up timers and animations on unmount', () => {
      const { unmount } = render(
        <CardDeck
          totalCards={5}
          isShuffling={true}
          onShuffleComplete={mockOnShuffleComplete}
        />
      )

      // Start some timers
      vi.advanceTimersByTime(1000)
      
      // Unmount should clean up without errors
      expect(() => unmount()).not.toThrow()
    })

    it('handles rapid shuffling state changes gracefully', () => {
      const { rerender } = render(
        <CardDeck
          totalCards={5}
          isShuffling={false}
          onShuffleComplete={mockOnShuffleComplete}
        />
      )

      // Rapidly toggle shuffling state
      rerender(
        <CardDeck
          totalCards={5}
          isShuffling={true}
          onShuffleComplete={mockOnShuffleComplete}
        />
      )

      rerender(
        <CardDeck
          totalCards={5}
          isShuffling={false}
          onShuffleComplete={mockOnShuffleComplete}
        />
      )

      rerender(
        <CardDeck
          totalCards={5}
          isShuffling={true}
          onShuffleComplete={mockOnShuffleComplete}
        />
      )

      // Should handle state changes without errors
      expect(() => vi.advanceTimersByTime(3000)).not.toThrow()
    })

    it('stops all animations and sounds on unmount during shuffling', () => {
      const { unmount } = render(
        <CardDeck
          totalCards={5}
          isShuffling={true}
          onShuffleComplete={mockOnShuffleComplete}
        />
      )

      unmount()

      expect(mockSoundManager.stop).toHaveBeenCalledWith('card-shuffle')
    })
  })

  describe('Accessibility', () => {
    it('provides appropriate ARIA labels for different states', () => {
      const { rerender } = render(
        <CardDeck
          totalCards={5}
          isShuffling={false}
          onShuffleComplete={mockOnShuffleComplete}
        />
      )

      expect(screen.getByRole('img', { name: '卡牌堆' })).toBeInTheDocument()

      rerender(
        <CardDeck
          totalCards={5}
          isShuffling={true}
          onShuffleComplete={mockOnShuffleComplete}
        />
      )

      expect(screen.getByRole('img', { name: '正在洗牌...' })).toBeInTheDocument()
    })

    it('provides visual feedback for shuffling state', () => {
      render(
        <CardDeck
          totalCards={5}
          isShuffling={true}
          onShuffleComplete={mockOnShuffleComplete}
        />
      )

      expect(screen.getByText('洗牌中...')).toBeInTheDocument()
      
      // Should have loading indicators
      const loadingDots = document.querySelectorAll('.animate-bounce')
      expect(loadingDots).toHaveLength(3)
    })
  })
})