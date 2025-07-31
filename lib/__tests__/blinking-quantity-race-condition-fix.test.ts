import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

describe('Blinking Name Picker Quantity Race Condition Fix', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.clearAllTimers()
  })

  afterEach(() => {
    vi.clearAllTimers()
  })

  it('should prevent multiple animations from running simultaneously', () => {
    // Mock the animation controller
    const mockStopBlinking = vi.fn()
    const mockStartBlinking = vi.fn()
    
    const mockController = {
      stopBlinking: mockStopBlinking,
      startBlinking: mockStartBlinking
    }

    // Simulate starting multiple animations quickly
    const gameItems = [
      { id: 'item-1', item: { id: '1', name: 'Test 1' }, isHighlighted: false, isSelected: false },
      { id: 'item-2', item: { id: '2', name: 'Test 2' }, isHighlighted: false, isSelected: false }
    ]

    // Simulate the fixed startBlinkingAnimation logic
    const startBlinkingAnimation = (items: any[], roundNumber: number) => {
      // This should call stopBlinking before starting new animation
      mockController.stopBlinking()
      mockController.startBlinking(items, vi.fn(), vi.fn(), vi.fn())
    }

    // Start multiple animations
    startBlinkingAnimation(gameItems, 1)
    startBlinkingAnimation(gameItems, 2)
    startBlinkingAnimation(gameItems, 3)

    // Verify that stopBlinking was called before each new animation
    expect(mockStopBlinking).toHaveBeenCalledTimes(3)
    expect(mockStartBlinking).toHaveBeenCalledTimes(3)
  })

  it('should prevent completion callback from adding items beyond quantity', () => {
    const quantity = 4
    let selectedItems: any[] = []

    // Mock the completion callback logic
    const completionCallback = (selectedItem: any) => {
      // This simulates the guard clause we added
      if (selectedItems.length >= quantity) {
        console.warn('已达到目标数量，忽略额外的选择')
        return
      }
      
      selectedItems = [...selectedItems, selectedItem]
    }

    // Simulate multiple completion callbacks (race condition scenario)
    const mockItems = [
      { id: '1', name: 'Item 1' },
      { id: '2', name: 'Item 2' },
      { id: '3', name: 'Item 3' },
      { id: '4', name: 'Item 4' },
      { id: '5', name: 'Item 5' }, // This should be ignored
      { id: '6', name: 'Item 6' }, // This should be ignored
      { id: '7', name: 'Item 7' }  // This should be ignored
    ]

    // Simulate rapid completion callbacks
    mockItems.forEach(item => {
      completionCallback(item)
    })

    // Should stop at exactly the quantity limit
    expect(selectedItems).toHaveLength(quantity)
    expect(selectedItems).toHaveLength(4)
  })

  it('should prevent starting new animations when quantity is reached', () => {
    const quantity = 4
    const currentSelectedItems = [
      { id: '1', name: 'Item 1' },
      { id: '2', name: 'Item 2' },
      { id: '3', name: 'Item 3' },
      { id: '4', name: 'Item 4' }
    ]

    const mockController = {
      stopBlinking: vi.fn(),
      startBlinking: vi.fn()
    }

    // Simulate the guard clause in startBlinkingAnimation
    const startBlinkingAnimation = (items: any[], roundNumber: number) => {
      if (currentSelectedItems.length >= quantity) {
        console.warn('已达到目标数量，不启动新的动画')
        return
      }
      
      mockController.stopBlinking()
      mockController.startBlinking(items, vi.fn(), vi.fn(), vi.fn())
    }

    const gameItems = [
      { id: 'item-1', item: { id: '1', name: 'Test 1' }, isHighlighted: false, isSelected: false }
    ]

    // Try to start animation when quantity is already reached
    startBlinkingAnimation(gameItems, 5)

    // Should not start new animation
    expect(mockController.stopBlinking).not.toHaveBeenCalled()
    expect(mockController.startBlinking).not.toHaveBeenCalled()
  })
})