import { render, screen } from '@testing-library/react'
import { CardFlipGame } from '@/components/card-flip-game'
import { ListItem } from '@/types'

// Mock sound manager
jest.mock('@/lib/sound-manager', () => ({
  soundManager: {
    play: jest.fn().mockResolvedValue(undefined),
    stopAll: jest.fn(),
    waitForInitialization: jest.fn().mockResolvedValue(undefined),
    setVolume: jest.fn(),
    setEnabled: jest.fn(),
  }
}))

// Mock animation performance
jest.mock('@/lib/animation-performance', () => ({
  useAnimationPerformance: () => ({
    getOptimizedDuration: (duration: number) => duration,
    registerAnimation: jest.fn(),
    unregisterAnimation: jest.fn(),
  })
}))

describe('CardFlipGame Quantity Display Fix', () => {
  const mockItems: ListItem[] = [
    { id: '1', name: 'Item 1' },
    { id: '2', name: 'Item 2' },
    { id: '3', name: 'Item 3' },
    { id: '4', name: 'Item 4' },
    { id: '5', name: 'Item 5' },
  ]

  const mockOnComplete = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should display user-configured quantity instead of actualQuantity', () => {
    render(
      <CardFlipGame
        items={mockItems}
        quantity={1}
        allowRepeat={false}
        onComplete={mockOnComplete}
        soundEnabled={false}
      />
    )

    // Should show the user-configured quantity (1), not the calculated actualQuantity
    expect(screen.getByText('抽取数量: 1')).toBeInTheDocument()
  })

  it('should display user-configured quantity even when it exceeds items', () => {
    render(
      <CardFlipGame
        items={mockItems}
        quantity={10}
        allowRepeat={true}
        onComplete={mockOnComplete}
        soundEnabled={false}
      />
    )

    // Should show the user-configured quantity (10), not the capped actualQuantity
    expect(screen.getByText('抽取数量: 10')).toBeInTheDocument()
  })

  it('should display consistent quantity values across all displays', () => {
    render(
      <CardFlipGame
        items={mockItems}
        quantity={3}
        allowRepeat={false}
        onComplete={mockOnComplete}
        soundEnabled={false}
      />
    )

    // Should show the user-configured quantity consistently
    expect(screen.getByText('抽取数量: 3')).toBeInTheDocument()
    expect(screen.getByText('总项目: 5')).toBeInTheDocument()
  })
})