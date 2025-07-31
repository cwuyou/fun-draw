import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import GridLotteryDrawPage from '@/app/draw/grid-lottery/page'
import type { DrawingConfig } from '@/types'

// Mock dependencies
vi.mock('next/navigation', () => ({
  useRouter: vi.fn()
}))

vi.mock('@/lib/sound-manager', () => ({
  soundManager: {
    setEnabled: vi.fn(),
    play: vi.fn(),
    stop: vi.fn(),
    stopAll: vi.fn()
  }
}))

vi.mock('@/lib/config-migration', () => ({
  loadAndMigrateConfig: vi.fn()
}))

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}))

describe('Grid Lottery Finish State Fix', () => {
  const mockRouter = {
    push: vi.fn(),
    back: vi.fn()
  }

  const mockConfig: DrawingConfig = {
    mode: 'grid-lottery',
    quantity: 1,
    allowRepeat: false,
    items: [
      { id: '1', name: '项目1' },
      { id: '2', name: '项目2' },
      { id: '3', name: '项目3' },
      { id: '4', name: '项目4' },
      { id: '5', name: '项目5' },
      { id: '6', name: '项目6' }
    ]
  }

  beforeEach(() => {
    vi.mocked(useRouter).mockReturnValue(mockRouter)
    vi.mocked(require('@/lib/config-migration').loadAndMigrateConfig).mockReturnValue(mockConfig)

    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(() => JSON.stringify(mockConfig)),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn()
      },
      writable: true
    })

    // Mock setTimeout and clearTimeout
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.useRealTimers()
  })

  it('should stop all animations when entering finished state', async () => {
    render(<GridLotteryDrawPage />)

    // 等待组件加载完成
    await waitFor(() => {
      expect(screen.getByText('开始抽奖')).toBeInTheDocument()
    })

    // 开始抽奖
    const startButton = screen.getByText('开始抽奖')
    fireEvent.click(startButton)

    // 快进倒计时
    act(() => {
      vi.advanceTimersByTime(3000)
    })

    // 等待进入spinning状态
    await waitFor(() => {
      expect(screen.getByText('灯光跳转中...')).toBeInTheDocument()
    })

    // 快进到抽奖完成
    act(() => {
      vi.advanceTimersByTime(10000) // 足够长的时间让抽奖完成
    })

    // 验证进入finished状态
    await waitFor(() => {
      expect(screen.getByText('抽奖完成！')).toBeInTheDocument()
    })

    // 验证获奖者显示
    const winnerText = screen.getByText(/获奖者：/)
    expect(winnerText).toBeInTheDocument()

    // 快进到结果对话框显示
    act(() => {
      vi.advanceTimersByTime(2000)
    })

    // 验证结果对话框出现
    await waitFor(() => {
      expect(screen.getByText('抽奖结果')).toBeInTheDocument()
    })

    // 验证获奖者信息在对话框中保持不变
    const modalWinnerInfo = screen.getByText(/获奖者/)
    expect(modalWinnerInfo).toBeInTheDocument()

    // 再次快进时间，确保状态不再变化
    const initialWinnerText = winnerText.textContent
    act(() => {
      vi.advanceTimersByTime(5000)
    })

    // 验证获奖者信息没有变化
    expect(winnerText.textContent).toBe(initialWinnerText)
  })

  it('should clear all timers when component unmounts', async () => {
    const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout')

    const { unmount } = render(<GridLotteryDrawPage />)

    // 开始抽奖流程
    await waitFor(() => {
      expect(screen.getByText('开始抽奖')).toBeInTheDocument()
    })

    const startButton = screen.getByText('开始抽奖')
    fireEvent.click(startButton)

    // 在抽奖过程中卸载组件
    act(() => {
      vi.advanceTimersByTime(1000)
    })

    unmount()

    // 验证clearTimeout被调用
    expect(clearTimeoutSpy).toHaveBeenCalled()
  })

  it('should not update state after entering finished phase', async () => {
    render(<GridLotteryDrawPage />)

    await waitFor(() => {
      expect(screen.getByText('开始抽奖')).toBeInTheDocument()
    })

    // 开始抽奖
    fireEvent.click(screen.getByText('开始抽奖'))

    // 快进到抽奖完成
    act(() => {
      vi.advanceTimersByTime(15000)
    })

    // 等待进入finished状态
    await waitFor(() => {
      expect(screen.getByText('抽奖完成！')).toBeInTheDocument()
    })

    // 记录当前的高亮状态
    const highlightedCells = screen.getAllByText(/项目/).filter(cell =>
      cell.closest('div')?.classList.contains('bg-gradient-to-br')
    )
    const initialHighlightedCount = highlightedCells.length

    // 继续快进时间，验证状态不再变化
    act(() => {
      vi.advanceTimersByTime(10000)
    })

    // 验证高亮状态没有变化
    const currentHighlightedCells = screen.getAllByText(/项目/).filter(cell =>
      cell.closest('div')?.classList.contains('bg-gradient-to-br')
    )
    expect(currentHighlightedCells.length).toBe(initialHighlightedCount)
  })

  it('should properly reset state when drawing again', async () => {
    render(<GridLotteryDrawPage />)

    await waitFor(() => {
      expect(screen.getByText('开始抽奖')).toBeInTheDocument()
    })

    // 完成一次抽奖
    fireEvent.click(screen.getByText('开始抽奖'))

    act(() => {
      vi.advanceTimersByTime(15000)
    })

    await waitFor(() => {
      expect(screen.getByText('抽奖完成！')).toBeInTheDocument()
    })

    // 显示结果对话框
    act(() => {
      vi.advanceTimersByTime(2000)
    })

    await waitFor(() => {
      expect(screen.getByText('抽奖结果')).toBeInTheDocument()
    })

    // 点击再次抽奖
    const drawAgainButton = screen.getByText('再次抽奖')
    fireEvent.click(drawAgainButton)

    // 验证状态重置
    await waitFor(() => {
      expect(screen.getByText('开始抽奖')).toBeInTheDocument()
      expect(screen.getByText('准备开始')).toBeInTheDocument()
    })

    // 验证所有宫格都重置为非高亮状态
    const cells = screen.getAllByText(/项目/)
    cells.forEach(cell => {
      const cellDiv = cell.closest('div')
      expect(cellDiv).not.toHaveClass('bg-gradient-to-br')
    })
  })
})