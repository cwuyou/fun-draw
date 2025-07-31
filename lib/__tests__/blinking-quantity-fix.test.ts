import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BlinkingNamePicker } from '@/components/blinking-name-picker'
import type { ListItem } from '@/types'

// Mock the sound manager
vi.mock('@/lib/sound-manager', () => ({
  soundManager: {
    play: vi.fn().mockResolvedValue(undefined),
    stopAll: vi.fn(),
    setEnabled: vi.fn(),
  }
}))

// Mock the animation performance hook
vi.mock('@/lib/animation-performance', () => ({
  useAnimationPerformance: () => ({
    getOptimizedDuration: (duration: number) => duration
  })
}))

// Mock the blinking animation classes
vi.mock('@/lib/blinking-animation', () => ({
  BlinkingAnimationController: vi.fn().mockImplementation(() => ({
    startBlinking: vi.fn((items, highlightCallback, speedCallback, completeCallback) => {
      // Simulate immediate completion for testing
      setTimeout(() => {
        const randomIndex = Math.floor(Math.random() * items.length)
        completeCallback(randomIndex)
      }, 100)
    }),
    stopBlinking: vi.fn()
  })),
  RandomSelector: vi.fn(),
  ColorCycleManager: vi.fn().mockImplementation(() => ({
    reset: vi.fn()
  }))
}))

describe('BlinkingNamePicker Quantity Fix', () => {
  const mockItems: ListItem[] = [
    { id: '1', name: '张三' },
    { id: '2', name: '李四' },
    { id: '3', name: '王五' },
    { id: '4', name: '赵六' },
    { id: '5', name: '钱七' },
    { id: '6', name: '孙八' },
    { id: '7', name: '周九' },
    { id: '8', name: '吴十' },
    { id: '9', name: '郑十一' },
    { id: '10', name: '冯十二' },
    { id: '11', name: '陈十三' },
    { id: '12', name: '褚十四' },
    { id: '13', name: '卫十五' },
    { id: '14', name: '蒋十六' },
    { id: '15', name: '沈十七' }
  ]

  const mockOnComplete = vi.fn()
  const mockOnRestart = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllTimers()
  })

  it('should stop at exactly 4 when quantity is 4', async () => {
    const quantity = 4
    
    const { container } = render(
      <BlinkingNamePicker
        items={mockItems}
        quantity={quantity}
        allowRepeat={false}
        onComplete={mockOnComplete}
        onRestart={mockOnRestart}
        soundEnabled={false}
      />
    )

    // Start the game
    const startButton = screen.getByText('开始闪烁')
    fireEvent.click(startButton)

    // Wait for the game to complete all rounds
    await waitFor(() => {
      expect(mockOnComplete).toHaveBeenCalled()
    }, { timeout: 5000 })

    // Verify that exactly the specified quantity was selected
    const completedItems = mockOnComplete.mock.calls[0][0]
    expect(completedItems).toHaveLength(quantity)
  })

  it('should stop at exactly 1 when quantity is 1', async () => {
    const quantity = 1
    
    const { container } = render(
      <BlinkingNamePicker
        items={mockItems}
        quantity={quantity}
        allowRepeat={false}
        onComplete={mockOnComplete}
        onRestart={mockOnRestart}
        soundEnabled={false}
      />
    )

    // Start the game
    const startButton = screen.getByText('开始闪烁')
    fireEvent.click(startButton)

    // Wait for the game to complete
    await waitFor(() => {
      expect(mockOnComplete).toHaveBeenCalled()
    }, { timeout: 2000 })

    // Verify that exactly 1 item was selected
    const completedItems = mockOnComplete.mock.calls[0][0]
    expect(completedItems).toHaveLength(1)
  })
})