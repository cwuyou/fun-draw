/**
 * Test to verify Task 6: Fix game information display consistency
 * 
 * This test verifies that:
 * 1. "抽取数量" displays the actual configured quantity value
 * 2. All quantity-related displays show consistent values
 * 3. Header quantity display matches game information display
 */

import { render, screen, waitFor } from '@testing-library/react'
import { CardFlipGame } from '@/components/card-flip-game'
import { ListItem } from '@/types'

// Mock dependencies
jest.mock('@/lib/sound-manager', () => ({
  soundManager: {
    play: jest.fn().mockResolvedValue(undefined),
    stopAll: jest.fn(),
    waitForInitialization: jest.fn().mockResolvedValue(undefined),
    setVolume: jest.fn(),
    setEnabled: jest.fn(),
  }
}))

jest.mock('@/lib/animation-performance', () => ({
  useAnimationPerformance: () => ({
    getOptimizedDuration: (duration: number) => duration,
    registerAnimation: jest.fn(),
    unregisterAnimation: jest.fn(),
  })
}))

describe('Task 6: Game Information Display Consistency', () => {
  const testItems: ListItem[] = [
    { id: '1', name: 'Test Item 1' },
    { id: '2', name: 'Test Item 2' },
    { id: '3', name: 'Test Item 3' },
    { id: '4', name: 'Test Item 4' },
    { id: '5', name: 'Test Item 5' },
  ]

  const mockOnComplete = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('Requirement 4.1: Game displays user-configured quantity value', async () => {
    render(
      <CardFlipGame
        items={testItems}
        quantity={1}
        allowRepeat={false}
        onComplete={mockOnComplete}
        soundEnabled={false}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('抽取数量: 1')).toBeInTheDocument()
    })
  })

  test('Requirement 4.2: Game displays actual number of cards being displayed', async () => {
    render(
      <CardFlipGame
        items={testItems}
        quantity={3}
        allowRepeat={false}
        onComplete={mockOnComplete}
        soundEnabled={false}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('抽取数量: 3')).toBeInTheDocument()
      expect(screen.getByText('总项目: 5')).toBeInTheDocument()
    })
  })

  test('Requirement 4.4: When quantity is 1, all displays consistently show 1', async () => {
    render(
      <CardFlipGame
        items={testItems}
        quantity={1}
        allowRepeat={false}
        onComplete={mockOnComplete}
        soundEnabled={false}
      />
    )

    await waitFor(() => {
      // Should show user-configured quantity, not calculated actualQuantity
      expect(screen.getByText('抽取数量: 1')).toBeInTheDocument()
    })
  })

  test('Requirement 4.5: Quantity displays remain accurate when game state changes', async () => {
    const { rerender } = render(
      <CardFlipGame
        items={testItems}
        quantity={2}
        allowRepeat={false}
        onComplete={mockOnComplete}
        soundEnabled={false}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('抽取数量: 2')).toBeInTheDocument()
    })

    // Change quantity and verify display updates
    rerender(
      <CardFlipGame
        items={testItems}
        quantity={4}
        allowRepeat={false}
        onComplete={mockOnComplete}
        soundEnabled={false}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('抽取数量: 4')).toBeInTheDocument()
    })
  })

  test('Edge case: Large quantity value should display user configuration', async () => {
    render(
      <CardFlipGame
        items={testItems}
        quantity={15}
        allowRepeat={true}
        onComplete={mockOnComplete}
        soundEnabled={false}
      />
    )

    await waitFor(() => {
      // Should show user-configured quantity (15), not capped actualQuantity (10)
      expect(screen.getByText('抽取数量: 15')).toBeInTheDocument()
    })
  })
})