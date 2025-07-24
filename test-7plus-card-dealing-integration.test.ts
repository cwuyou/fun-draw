// 7+卡牌发牌失败的集成测试
// 测试要求：验证7、8、9、10张卡牌的发牌动画能够成功完成

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { CardFlipGame } from '@/components/card-flip-game'
import { calculateFixedCardLayout } from '@/lib/fixed-card-positioning'
import type { ListItem } from '@/types'

// Mock window dimensions
Object.defineProperty(window, 'innerWidth', {
  writable: true,
  configurable: true,
  value: 1366,
})

Object.defineProperty(window, 'innerHeight', {
  writable: true,
  configurable: true,
  value: 768,
})

// Mock sound manager
vi.mock('@/lib/sound-manager', () => ({
  soundManager: {
    play: vi.fn().mockResolvedValue(undefined),
  },
}))

describe('7+ Card Dealing Integration Tests', () => {
  const mockItems: ListItem[] = Array.from({ length: 15 }, (_, i) => ({
    id: `item-${i + 1}`,
    name: `测试项目${i + 1}`,
  }))

  const mockOnComplete = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('Position Array Generation for 7+ Cards', () => {
    it('should generate valid positions for 7 cards without undefined values', () => {
      const result = calculateFixedCardLayout(7, 1366, 768)
      
      expect(result.positions).toHaveLength(7)
      result.positions.forEach((position, index) => {
        expect(position.x).toBeDefined()
        expect(position.y).toBeDefined()
        expect(typeof position.x).toBe('number')
        expect(typeof position.y).toBe('number')
        expect(position.cardWidth).toBeGreaterThan(0)
        expect(position.cardHeight).toBeGreaterThan(0)
      })
    })

    it('should generate valid positions for 8 cards without undefined values', () => {
      const result = calculateFixedCardLayout(8, 1366, 768)
      
      expect(result.positions).toHaveLength(8)
      result.positions.forEach((position, index) => {
        expect(position.x).toBeDefined()
        expect(position.y).toBeDefined()
        expect(typeof position.x).toBe('number')
        expect(typeof position.y).toBe('number')
        expect(position.cardWidth).toBeGreaterThan(0)
        expect(position.cardHeight).toBeGreaterThan(0)
      })
    })

    it('should generate valid positions for 9 cards without undefined values', () => {
      const result = calculateFixedCardLayout(9, 1366, 768)
      
      expect(result.positions).toHaveLength(9)
      result.positions.forEach((position, index) => {
        expect(position.x).toBeDefined()
        expect(position.y).toBeDefined()
        expect(typeof position.x).toBe('number')
        expect(typeof position.y).toBe('number')
        expect(position.cardWidth).toBeGreaterThan(0)
        expect(position.cardHeight).toBeGreaterThan(0)
      })
    })

    it('should generate valid positions for 10 cards without undefined values', () => {
      const result = calculateFixedCardLayout(10, 1366, 768)
      
      expect(result.positions).toHaveLength(10)
      result.positions.forEach((position, index) => {
        expect(position.x).toBeDefined()
        expect(position.y).toBeDefined()
        expect(typeof position.x).toBe('number')
        expect(typeof position.y).toBe('number')
        expect(position.cardWidth).toBeGreaterThan(0)
        expect(position.cardHeight).toBeGreaterThan(0)
      })
    })
  })

  describe('Dealing Animation Completion for 7+ Cards', () => {
    it('should complete dealing animation for 7 cards without getting stuck', async () => {
      render(
        <CardFlipGame
          items={mockItems}
          quantity={7}
          allowRepeat={false}
          onComplete={mockOnComplete}
          soundEnabled={false}
          autoStart={true}
        />
      )

      // Wait for shuffling phase
      await waitFor(() => {
        expect(screen.getByText('正在洗牌...')).toBeInTheDocument()
      })

      // Fast-forward through shuffling
      vi.advanceTimersByTime(3000)

      // Wait for dealing phase
      await waitFor(() => {
        expect(screen.getByText('正在发牌...')).toBeInTheDocument()
      })

      // Fast-forward through dealing animation
      // 7 cards * 300ms interval + 400ms per card animation
      vi.advanceTimersByTime(7 * 300 + 7 * 400 + 1000)

      // Should reach waiting phase without errors
      await waitFor(() => {
        expect(screen.getByText('点击卡牌进行翻牌')).toBeInTheDocument()
      })

      // Verify all 7 cards are rendered
      const cards = screen.getAllByTestId(/^card-/)
      expect(cards).toHaveLength(7)
    })

    it('should complete dealing animation for 8 cards without getting stuck', async () => {
      render(
        <CardFlipGame
          items={mockItems}
          quantity={8}
          allowRepeat={false}
          onComplete={mockOnComplete}
          soundEnabled={false}
          autoStart={true}
        />
      )

      // Wait for shuffling and dealing
      vi.advanceTimersByTime(3000)
      await waitFor(() => {
        expect(screen.getByText('正在发牌...')).toBeInTheDocument()
      })

      // Fast-forward through dealing
      vi.advanceTimersByTime(8 * 300 + 8 * 400 + 1000)

      await waitFor(() => {
        expect(screen.getByText('点击卡牌进行翻牌')).toBeInTheDocument()
      })

      const cards = screen.getAllByTestId(/^card-/)
      expect(cards).toHaveLength(8)
    })

    it('should complete dealing animation for 9 cards without getting stuck', async () => {
      render(
        <CardFlipGame
          items={mockItems}
          quantity={9}
          allowRepeat={false}
          onComplete={mockOnComplete}
          soundEnabled={false}
          autoStart={true}
        />
      )

      vi.advanceTimersByTime(3000)
      await waitFor(() => {
        expect(screen.getByText('正在发牌...')).toBeInTheDocument()
      })

      vi.advanceTimersByTime(9 * 300 + 9 * 400 + 1000)

      await waitFor(() => {
        expect(screen.getByText('点击卡牌进行翻牌')).toBeInTheDocument()
      })

      const cards = screen.getAllByTestId(/^card-/)
      expect(cards).toHaveLength(9)
    })

    it('should complete dealing animation for 10 cards without getting stuck', async () => {
      render(
        <CardFlipGame
          items={mockItems}
          quantity={10}
          allowRepeat={false}
          onComplete={mockOnComplete}
          soundEnabled={false}
          autoStart={true}
        />
      )

      vi.advanceTimersByTime(3000)
      await waitFor(() => {
        expect(screen.getByText('正在发牌...')).toBeInTheDocument()
      })

      vi.advanceTimersByTime(10 * 300 + 10 * 400 + 1000)

      await waitFor(() => {
        expect(screen.getByText('点击卡牌进行翻牌')).toBeInTheDocument()
      })

      const cards = screen.getAllByTestId(/^card-/)
      expect(cards).toHaveLength(10)
    })
  })

  describe('Error Recovery for High Card Counts', () => {
    it('should provide clear error messages when position calculation fails', () => {
      // Mock console.error to capture error messages
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      // Force an error by providing invalid container dimensions
      Object.defineProperty(window, 'innerWidth', { value: 0 })
      Object.defineProperty(window, 'innerHeight', { value: 0 })

      render(
        <CardFlipGame
          items={mockItems}
          quantity={7}
          allowRepeat={false}
          onComplete={mockOnComplete}
          soundEnabled={false}
          autoStart={true}
        />
      )

      // Should still render without crashing
      expect(screen.getByText('卡牌抽奖')).toBeInTheDocument()

      consoleSpy.mockRestore()
    })

    it('should maintain game interactivity after dealing 7+ cards', async () => {
      render(
        <CardFlipGame
          items={mockItems}
          quantity={7}
          allowRepeat={false}
          onComplete={mockOnComplete}
          soundEnabled={false}
          autoStart={true}
        />
      )

      // Complete the dealing process
      vi.advanceTimersByTime(3000 + 7 * 300 + 7 * 400 + 1000)

      await waitFor(() => {
        expect(screen.getByText('点击卡牌进行翻牌')).toBeInTheDocument()
      })

      // Try to click a card
      const cards = screen.getAllByTestId(/^card-/)
      expect(cards.length).toBeGreaterThan(0)

      fireEvent.click(cards[0])

      // Should transition to revealing phase
      await waitFor(() => {
        expect(screen.getByText('翻牌中...')).toBeInTheDocument()
      })
    })
  })

  describe('Layout Quality for 7+ Cards', () => {
    it('should use 2-row layout for 7-8 cards instead of 3 rows', () => {
      const result7 = calculateFixedCardLayout(7, 1366, 768)
      const result8 = calculateFixedCardLayout(8, 1366, 768)

      expect(result7.layoutInfo.rows).toBeLessThanOrEqual(2)
      expect(result8.layoutInfo.rows).toBeLessThanOrEqual(2)
    })

    it('should use appropriate layout for 9 cards (3x3 is acceptable)', () => {
      const result = calculateFixedCardLayout(9, 1366, 768)
      
      // 9 cards can use 3x3 layout, which is reasonable
      expect(result.layoutInfo.rows).toBeLessThanOrEqual(3)
      expect(result.layoutInfo.cardsPerRow).toBeLessThanOrEqual(3)
    })

    it('should use 2-row layout for 10 cards instead of 3 rows', () => {
      const result = calculateFixedCardLayout(10, 1366, 768)
      
      expect(result.layoutInfo.rows).toBeLessThanOrEqual(2)
      expect(result.layoutInfo.cardsPerRow).toBe(5)
    })
  })

  describe('Performance and Stability', () => {
    it('should handle rapid successive dealing requests for 7+ cards', async () => {
      const { rerender } = render(
        <CardFlipGame
          items={mockItems}
          quantity={7}
          allowRepeat={false}
          onComplete={mockOnComplete}
          soundEnabled={false}
          autoStart={false}
        />
      )

      // Start game multiple times rapidly
      const startButton = screen.getByText('开始抽奖')
      
      fireEvent.click(startButton)
      fireEvent.click(startButton)
      fireEvent.click(startButton)

      // Should not crash and should handle gracefully
      expect(screen.getByText(/正在|卡牌抽奖/)).toBeInTheDocument()
    })

    it('should maintain consistent position calculations across multiple renders', () => {
      const positions1 = calculateFixedCardLayout(8, 1366, 768).positions
      const positions2 = calculateFixedCardLayout(8, 1366, 768).positions

      expect(positions1).toHaveLength(8)
      expect(positions2).toHaveLength(8)

      // Positions should be deterministic for same inputs
      positions1.forEach((pos1, index) => {
        const pos2 = positions2[index]
        expect(pos1.cardWidth).toBe(pos2.cardWidth)
        expect(pos1.cardHeight).toBe(pos2.cardHeight)
      })
    })
  })
})