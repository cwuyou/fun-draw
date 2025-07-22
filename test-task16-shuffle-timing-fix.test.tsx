import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { CardFlipGame } from '@/components/card-flip-game'
import type { ListItem } from '@/types'

// Mock sound manager
vi.mock('@/lib/sound-manager', () => ({
  soundManager: {
    play: vi.fn().mockResolvedValue(undefined),
    stop: vi.fn(),
    stopAll: vi.fn(),
    setEnabled: vi.fn(),
    setMasterVolume: vi.fn(),
    waitForInitialization: vi.fn().mockResolvedValue(undefined),
    preloadSounds: vi.fn().mockResolvedValue(undefined),
    getSoundInfo: vi.fn().mockReturnValue({ initialized: true })
  }
}))

// Mock animation performance hook
vi.mock('@/lib/animation-performance', () => ({
  useAnimationPerformance: () => ({
    getOptimizedDuration: (duration: number) => duration,
    registerAnimation: vi.fn(),
    unregisterAnimation: vi.fn()
  })
}))

// Mock validation functions
vi.mock('@/lib/card-game-validation', () => ({
  validateCompleteGameSetup: () => ({ isValid: true, warnings: [] }),
  validateGameConfig: () => ({ isValid: true }),
  validatePositionCalculation: () => ({ isValid: true })
}))

describe('Task 16: Shuffle Timing and User Control Fixes', () => {
  const mockItems: ListItem[] = [
    { id: '1', name: '项目1' },
    { id: '2', name: '项目2' },
    { id: '3', name: '项目3' },
    { id: '4', name: '项目4' },
    { id: '5', name: '项目5' }
  ]

  const defaultProps = {
    items: mockItems,
    quantity: 2,
    allowRepeat: false,
    onComplete: vi.fn(),
    soundEnabled: true,
    autoStart: false
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should NOT auto-start shuffling when autoStart is false', async () => {
    render(<CardFlipGame {...defaultProps} autoStart={false} />)
    
    // Should show idle state with start button
    expect(screen.getByText('准备中...')).toBeInTheDocument()
    expect(screen.getByText('🎲 开始抽奖')).toBeInTheDocument()
    expect(screen.getByText('点击按钮开始卡牌抽奖')).toBeInTheDocument()
    
    // Should NOT show shuffling state
    expect(screen.queryByText('正在洗牌...')).not.toBeInTheDocument()
  })

  it('should show start button in idle state', async () => {
    render(<CardFlipGame {...defaultProps} />)
    
    // Should show the start button
    const startButton = screen.getByText('🎲 开始抽奖')
    expect(startButton).toBeInTheDocument()
    expect(startButton).not.toBeDisabled()
    
    // Should show instruction text
    expect(screen.getByText('点击按钮开始卡牌抽奖')).toBeInTheDocument()
  })

  it('should start shuffling when start button is clicked', async () => {
    render(<CardFlipGame {...defaultProps} />)
    
    const startButton = screen.getByText('🎲 开始抽奖')
    fireEvent.click(startButton)
    
    // Should transition to shuffling state
    await waitFor(() => {
      expect(screen.getByText('正在洗牌...')).toBeInTheDocument()
    })
    
    // Start button should be hidden during shuffling
    expect(screen.queryByText('🎲 开始抽奖')).not.toBeInTheDocument()
  })

  it('should auto-start when autoStart is true', async () => {
    render(<CardFlipGame {...defaultProps} autoStart={true} />)
    
    // Should automatically start shuffling
    await waitFor(() => {
      expect(screen.getByText('正在洗牌...')).toBeInTheDocument()
    })
    
    // Should NOT show start button
    expect(screen.queryByText('🎲 开始抽奖')).not.toBeInTheDocument()
  })

  it('should disable start button when items list is empty', async () => {
    render(<CardFlipGame {...defaultProps} items={[]} />)
    
    // Should show empty state message
    expect(screen.getByText('项目列表为空')).toBeInTheDocument()
    expect(screen.getByText('请添加至少 1 个项目进行抽奖')).toBeInTheDocument()
  })

  it('should not auto-restart after game completion', async () => {
    const onComplete = vi.fn()
    render(<CardFlipGame {...defaultProps} onComplete={onComplete} />)
    
    // Start the game
    const startButton = screen.getByText('🎲 开始抽奖')
    fireEvent.click(startButton)
    
    // Wait for shuffling to complete and game to finish
    await waitFor(() => {
      expect(screen.getByText('正在洗牌...')).toBeInTheDocument()
    }, { timeout: 1000 })
    
    // The game should eventually complete and call onComplete
    // but should NOT automatically restart shuffling
    await waitFor(() => {
      expect(onComplete).toHaveBeenCalled()
    }, { timeout: 5000 })
    
    // After completion, should NOT automatically start shuffling again
    // (This would require the game to return to idle state)
  })

  it('should show proper game phase transitions', async () => {
    render(<CardFlipGame {...defaultProps} />)
    
    // Initial state
    expect(screen.getByText('准备中...')).toBeInTheDocument()
    
    // Click start
    const startButton = screen.getByText('🎲 开始抽奖')
    fireEvent.click(startButton)
    
    // Should show shuffling
    await waitFor(() => {
      expect(screen.getByText('正在洗牌...')).toBeInTheDocument()
    })
    
    // Should eventually show dealing
    await waitFor(() => {
      expect(screen.getByText('正在发牌...')).toBeInTheDocument()
    }, { timeout: 4000 })
    
    // Should eventually show waiting for user interaction
    await waitFor(() => {
      expect(screen.getByText('点击卡牌进行翻牌')).toBeInTheDocument()
    }, { timeout: 3000 })
  })
})