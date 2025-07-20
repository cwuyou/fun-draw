/**
 * Simple test to verify Task 6 fix
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

describe('Task 6 Simple Test', () => {
  const testItems: ListItem[] = [
    { id: '1', name: 'Test Item 1' },
    { id: '2', name: 'Test Item 2' },
    { id: '3', name: 'Test Item 3' },
  ]

  test('should show consistent quantity displays', async () => {
    render(
      <CardFlipGame
        items={testItems}
        quantity={2}
        allowRepeat={false}
        onComplete={() => {}}
        soundEnabled={false}
      />
    )

    await waitFor(() => {
      // Should show user-configured quantity
      expect(screen.getByText('抽取数量: 2')).toBeInTheDocument()
      // Should show total items
      expect(screen.getByText('总项目: 3')).toBeInTheDocument()
      // Should show actual cards being displayed
      expect(screen.getByText('总卡牌: 2')).toBeInTheDocument()
    })
  })

  test('should show capped quantity when exceeding maximum', async () => {
    const manyItems: ListItem[] = Array.from({ length: 15 }, (_, i) => ({
      id: `${i + 1}`,
      name: `Item ${i + 1}`
    }))

    render(
      <CardFlipGame
        items={manyItems}
        quantity={15}
        allowRepeat={false}
        onComplete={() => {}}
        soundEnabled={false}
      />
    )

    await waitFor(() => {
      // Should show user-configured quantity (15)
      expect(screen.getByText('抽取数量: 15')).toBeInTheDocument()
      // Should show total items (15)
      expect(screen.getByText('总项目: 15')).toBeInTheDocument()
      // Should show actual cards being displayed (capped to 10)
      expect(screen.getByText('总卡牌: 10')).toBeInTheDocument()
    })
  })
})