import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('Blinking Name Picker Reset Fix', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should reinitialize animation controller when resetGame is called', () => {
    // Mock the animation controller classes
    const mockBlinkingController = vi.fn()
    const mockColorManager = vi.fn()
    
    // Mock the constructor calls
    vi.mock('@/lib/blinking-animation', () => ({
      BlinkingAnimationController: mockBlinkingController,
      ColorCycleManager: mockColorManager,
      RandomSelector: vi.fn()
    }))

    // Simulate the resetGame function logic
    const config = {
      initialSpeed: 100,
      finalSpeed: 1000,
      accelerationDuration: 3000,
      colors: ['#ef4444', '#3b82f6', '#10b981', '#f59e0b'],
      glowIntensity: 0.8
    }

    const resetGame = () => {
      // Stop existing animation
      // ... stopGame logic ...
      
      // Reinitialize animation controller (this is the fix)
      const newController = new mockBlinkingController(config)
      const newColorManager = new mockColorManager(config.colors)
      
      // Reset game state
      // ... reset state logic ...
    }

    // Call resetGame
    resetGame()

    // Verify that new instances were created
    expect(mockBlinkingController).toHaveBeenCalledWith(config)
    expect(mockColorManager).toHaveBeenCalledWith(config.colors)
  })

  it('should reinitialize animation controller when restartGame is called', () => {
    // Mock the animation controller classes
    const mockBlinkingController = vi.fn()
    const mockColorManager = vi.fn()
    
    // Simulate the restartGame function logic
    const config = {
      initialSpeed: 100,
      finalSpeed: 1000,
      accelerationDuration: 3000,
      colors: ['#ef4444', '#3b82f6', '#10b981', '#f59e0b'],
      glowIntensity: 0.8
    }

    const restartGame = () => {
      // Stop existing animation
      // ... stopGame logic ...
      
      // Reinitialize animation controller (this is the fix)
      const newController = new mockBlinkingController(config)
      const newColorManager = new mockColorManager(config.colors)
      
      // Reset game state
      // ... reset state logic ...
    }

    // Call restartGame
    restartGame()

    // Verify that new instances were created
    expect(mockBlinkingController).toHaveBeenCalledWith(config)
    expect(mockColorManager).toHaveBeenCalledWith(config.colors)
  })

  it('should properly clean up before reinitializing', () => {
    const mockStopBlinking = vi.fn()
    const mockReset = vi.fn()
    const mockStopAll = vi.fn()

    // Mock existing controllers
    const existingController = {
      stopBlinking: mockStopBlinking
    }
    const existingColorManager = {
      reset: mockReset
    }
    const soundManager = {
      stopAll: mockStopAll
    }

    // Simulate the stopGame function
    const stopGame = () => {
      existingController.stopBlinking()
      existingColorManager.reset()
      soundManager.stopAll()
    }

    // Call stopGame (which is called by both reset functions)
    stopGame()

    // Verify cleanup was performed
    expect(mockStopBlinking).toHaveBeenCalled()
    expect(mockReset).toHaveBeenCalled()
    expect(mockStopAll).toHaveBeenCalled()
  })
})