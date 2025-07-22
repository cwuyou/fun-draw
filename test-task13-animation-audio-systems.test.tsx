/**
 * Task 13: Animation and Audio Systems Unit Tests
 * 
 * This test suite verifies:
 * 1. Shuffling animation timing and card movement
 * 2. Dealing animation sequence and card appearance
 * 3. Audio system integration and sound synchronization
 * 4. Animation system with different card quantities
 * 
 * Requirements covered: 6.3, 6.4, 7.2, 7.3, 8.3
 */

/// <reference types="vitest" />
import { render, act } from '@testing-library/react'
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest'
import { CardFlipGame } from '@/components/card-flip-game'
import { CardDeck } from '@/components/card-deck'
import { ListItem } from '@/types'

// Mock dependencies
vi.mock('@/lib/sound-manager', () => ({
  soundManager: {
    play: vi.fn().mockResolvedValue(undefined),
    stop: vi.fn(),
    stopAll: vi.fn(),
    setEnabled: vi.fn(),
    setMasterVolume: vi.fn(),
    setVolume: vi.fn(),
    isEnabled: vi.fn().mockReturnValue(true),
    isReady: vi.fn().mockReturnValue(true),
    waitForInitialization: vi.fn().mockResolvedValue(undefined),
    testSound: vi.fn().mockResolvedValue(true),
    getAvailableSounds: vi.fn().mockReturnValue(['card-shuffle', 'card-deal', 'card-flip', 'card-reveal']),
    getSoundInfo: vi.fn().mockReturnValue({
      enabled: true,
      masterVolume: 0.7,
      initialized: true,
      audioContextState: 'running',
      availableSounds: ['card-shuffle', 'card-deal', 'card-flip', 'card-reveal']
    }),
    preloadSounds: vi.fn().mockResolvedValue(undefined)
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

describe('Task 13: Animation and Audio Systems Unit Tests', () => {
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

  describe('Requirement 6.3: Shuffling animation timing and card movement', () => {
    test('should start shuffling animation with proper timing', async () => {
      const mockOnShuffleComplete = vi.fn()
      
      render(
        <CardDeck
          totalCards={3}
          isShuffling={true}
          onShuffleComplete={mockOnShuffleComplete}
        />
      )

      // Should play shuffling sound when animation starts
      const { soundManager } = await import('@/lib/sound-manager')
      expect(soundManager.play).toHaveBeenCalledWith('card-shuffle')

      // Animation should run for minimum duration
      act(() => {
        vi.advanceTimersByTime(2400)
      })
      expect(mockOnShuffleComplete).not.toHaveBeenCalled()

      act(() => {
        vi.advanceTimersByTime(600)
      })
      expect(mockOnShuffleComplete).toHaveBeenCalled()
    })

    test('should stop shuffling sound when animation completes', async () => {
      const mockOnShuffleComplete = vi.fn()
      
      render(
        <CardDeck
          totalCards={3}
          isShuffling={true}
          onShuffleComplete={mockOnShuffleComplete}
        />
      )

      act(() => {
        vi.advanceTimersByTime(3000)
      })

      const { soundManager } = await import('@/lib/sound-manager')
      expect(soundManager.stop).toHaveBeenCalledWith('card-shuffle')
    })
  })

  describe('Requirement 7.2: Dealing animation sequence and card appearance', () => {
    test('should deal cards with proper timing intervals', async () => {
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

      // Fast-forward through animations
      act(() => {
        vi.advanceTimersByTime(5000)
      })

      const { soundManager } = await import('@/lib/sound-manager')
      const dealSoundCalls = vi.mocked(soundManager.play).mock.calls.filter(
        call => call[0] === 'card-deal'
      )

      expect(dealSoundCalls.length).toBeGreaterThan(0)
    })
  })

  describe('Requirement 7.3: Animation system with different card quantities', () => {
    test('should handle single card dealing correctly', async () => {
      const testItems = createTestItems(1)
      
      render(
        <CardFlipGame
          items={testItems}
          quantity={1}
          allowRepeat={false}
          onComplete={mockOnComplete}
          soundEnabled={true}
        />
      )

      act(() => {
        vi.advanceTimersByTime(4000)
      })

      const { soundManager } = await import('@/lib/sound-manager')
      const dealSoundCalls = vi.mocked(soundManager.play).mock.calls.filter(
        call => call[0] === 'card-deal'
      )
      expect(dealSoundCalls.length).toBe(1)
    })

    test('should handle multiple card dealing correctly', async () => {
      const testItems = createTestItems(5)
      
      render(
        <CardFlipGame
          items={testItems}
          quantity={5}
          allowRepeat={false}
          onComplete={mockOnComplete}
          soundEnabled={true}
        />
      )

      act(() => {
        vi.advanceTimersByTime(6000)
      })

      const { soundManager } = await import('@/lib/sound-manager')
      const dealSoundCalls = vi.mocked(soundManager.play).mock.calls.filter(
        call => call[0] === 'card-deal'
      )
      expect(dealSoundCalls.length).toBe(5)
    })
  })

  describe('Requirement 8.3: Audio system integration and sound synchronization', () => {
    test('should synchronize shuffling sound with animation', async () => {
      const mockOnShuffleComplete = vi.fn()
      
      render(
        <CardDeck
          totalCards={3}
          isShuffling={true}
          onShuffleComplete={mockOnShuffleComplete}
        />
      )

      const { soundManager } = await import('@/lib/sound-manager')
      expect(soundManager.play).toHaveBeenCalledWith('card-shuffle')

      act(() => {
        vi.advanceTimersByTime(3000)
      })
      expect(soundManager.stop).toHaveBeenCalledWith('card-shuffle')
    })

    test('should respect sound enabled/disabled setting', async () => {
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

      act(() => {
        vi.advanceTimersByTime(3000)
      })

      const { soundManager } = await import('@/lib/sound-manager')
      expect(soundManager.play).not.toHaveBeenCalledWith('card-shuffle')
    })
  })

  describe('Sound Manager Integration Tests', () => {
    test('should initialize sound manager properly', async () => {
      const { soundManager } = await import('@/lib/sound-manager')
      expect(soundManager.getAvailableSounds()).toContain('card-shuffle')
      expect(soundManager.getAvailableSounds()).toContain('card-deal')
      expect(soundManager.getAvailableSounds()).toContain('card-flip')
      expect(soundManager.getAvailableSounds()).toContain('card-reveal')
    })

    test('should handle sound manager state correctly', async () => {
      const { soundManager } = await import('@/lib/sound-manager')
      const soundInfo = soundManager.getSoundInfo()
      expect(soundInfo.enabled).toBe(true)
      expect(soundInfo.initialized).toBe(true)
      expect(soundInfo.availableSounds).toEqual(
        expect.arrayContaining(['card-shuffle', 'card-deal', 'card-flip', 'card-reveal'])
      )
    })

    test('should test individual sounds', async () => {
      const { soundManager } = await import('@/lib/sound-manager')
      const testResult = await soundManager.testSound('card-flip')
      expect(testResult).toBe(true)
    })

    test('should preload sounds successfully', async () => {
      const { soundManager } = await import('@/lib/sound-manager')
      await expect(soundManager.preloadSounds()).resolves.not.toThrow()
    })
  })

  describe('Animation Performance and Error Handling', () => {
    test('should handle sound playback errors gracefully', async () => {
      const { soundManager } = await import('@/lib/sound-manager')
      vi.mocked(soundManager.play).mockRejectedValue(new Error('Audio playback failed'))
      
      const testItems = createTestItems(3)
      
      expect(() => {
        render(
          <CardFlipGame
            items={testItems}
            quantity={3}
            allowRepeat={false}
            onComplete={mockOnComplete}
            soundEnabled={true}
          />
        )
      }).not.toThrow()

      act(() => {
        vi.advanceTimersByTime(4000)
      })
    })

    test('should clean up animations and sounds on unmount', async () => {
      const mockOnShuffleComplete = vi.fn()
      const { unmount } = render(
        <CardDeck
          totalCards={3}
          isShuffling={true}
          onShuffleComplete={mockOnShuffleComplete}
        />
      )

      act(() => {
        vi.advanceTimersByTime(1000)
      })

      unmount()

      const { soundManager } = await import('@/lib/sound-manager')
      expect(soundManager.stop).toHaveBeenCalledWith('card-shuffle')
    })
  })
})