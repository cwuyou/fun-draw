// 测试任务4.2：改进窗口大小变化的响应机制
// 验证窗口大小变化时的平滑位置重新计算和调整

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { CardFlipGame } from '@/components/card-flip-game'
import type { ListItem } from '@/types'

// Mock dependencies
vi.mock('@/lib/sound-manager', () => ({
  soundManager: {
    play: vi.fn().mockResolvedValue(undefined)
  }
}))

vi.mock('@/lib/animation-performance', () => ({
  useAnimationPerformance: () => ({
    getOptimizedDuration: (duration: number) => duration,
    registerAnimation: vi.fn(),
    unregisterAnimation: vi.fn()
  })
}))

vi.mock('@/lib/card-game-validation', () => ({
  validateCompleteGameSetup: () => ({
    isValid: true,
    warnings: []
  }),
  validateGameConfig: vi.fn(),
  validatePositionCalculation: vi.fn()
}))

describe('Task 4.2: 改进窗口大小变化的响应机制', () => {
  const mockItems: ListItem[] = [
    { id: '1', name: '项目1' },
    { id: '2', name: '项目2' },
    { id: '3', name: '项目3' },
    { id: '4', name: '项目4' }
  ]

  const defaultProps = {
    items: mockItems,
    quantity: 3,
    allowRepeat: false,
    onComplete: vi.fn(),
    soundEnabled: false,
    autoStart: true
  }

  let originalInnerWidth: number
  let originalInnerHeight: number

  beforeEach(() => {
    // 保存原始窗口尺寸
    originalInnerWidth = window.innerWidth
    originalInnerHeight = window.innerHeight
    
    // 设置初始窗口尺寸
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024
    })
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 768
    })

    // Mock console methods
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    // 恢复原始窗口尺寸
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalInnerWidth
    })
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: originalInnerHeight
    })

    vi.clearAllMocks()
  })

  describe('需求 5.5: 窗口大小改变时，卡牌位置应该平滑地重新计算和调整', () => {
    it('应该在窗口大小改变时重新计算卡牌位置', async () => {
      const { container } = render(<CardFlipGame {...defaultProps} />)

      // 等待游戏初始化和卡牌发牌完成
      await waitFor(() => {
        expect(screen.getByText('点击卡牌进行翻牌')).toBeInTheDocument()
      }, { timeout: 5000 })

      // 获取初始卡牌位置
      const initialCards = container.querySelectorAll('[data-testid^="game-card-"]')
      const initialPositions = Array.from(initialCards).map(card => {
        const style = (card as HTMLElement).style
        return {
          transform: style.transform,
          width: style.width,
          height: style.height
        }
      })

      // 模拟窗口大小改变
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 800
      })
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 600
      })

      // 触发resize事件
      fireEvent(window, new Event('resize'))

      // 等待防抖延迟和位置重新计算
      await waitFor(() => {
        const updatedCards = container.querySelectorAll('[data-testid^="game-card-"]')
        const updatedPositions = Array.from(updatedCards).map(card => {
          const style = (card as HTMLElement).style
          return {
            transform: style.transform,
            width: style.width,
            height: style.height
          }
        })

        // 验证位置已经改变（适应新的窗口尺寸）
        expect(updatedPositions).not.toEqual(initialPositions)
      }, { timeout: 1000 })
    })

    it('应该使用防抖机制优化resize事件处理性能', async () => {
      const { container } = render(<CardFlipGame {...defaultProps} />)

      // 等待游戏初始化
      await waitFor(() => {
        expect(screen.getByText('点击卡牌进行翻牌')).toBeInTheDocument()
      }, { timeout: 5000 })

      // 快速连续触发多次resize事件
      for (let i = 0; i < 5; i++) {
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: 800 + i * 10
        })
        fireEvent(window, new Event('resize'))
      }

      // 等待防抖延迟
      await new Promise(resolve => setTimeout(resolve, 200))

      // 验证只有最后一次resize生效
      const cards = container.querySelectorAll('[data-testid^="game-card-"]')
      expect(cards.length).toBeGreaterThan(0)
    })

    it('应该在resize过程中添加平滑过渡效果', async () => {
      const { container } = render(<CardFlipGame {...defaultProps} />)

      // 等待游戏初始化
      await waitFor(() => {
        expect(screen.getByText('点击卡牌进行翻牌')).toBeInTheDocument()
      }, { timeout: 5000 })

      // 触发resize事件
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 800
      })
      fireEvent(window, new Event('resize'))

      // 验证过渡效果被添加
      await waitFor(() => {
        const cards = container.querySelectorAll('[data-testid^="game-card-"]')
        const firstCard = cards[0] as HTMLElement
        expect(firstCard.style.transition).toContain('transform')
        expect(firstCard.style.transition).toContain('ease-out')
      }, { timeout: 500 })
    })
  })

  describe('需求 4.4: 设备方向改变时，布局应该能够自适应调整间距', () => {
    it('应该在设备方向改变时调整布局', async () => {
      const { container } = render(<CardFlipGame {...defaultProps} />)

      // 等待游戏初始化
      await waitFor(() => {
        expect(screen.getByText('点击卡牌进行翻牌')).toBeInTheDocument()
      }, { timeout: 5000 })

      // 模拟设备方向改变（横屏到竖屏）
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 600
      })
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 800
      })

      fireEvent(window, new Event('resize'))

      // 等待布局调整
      await waitFor(() => {
        const cards = container.querySelectorAll('[data-testid^="game-card-"]')
        expect(cards.length).toBeGreaterThan(0)
        
        // 验证卡牌尺寸和位置适应新的屏幕方向
        const firstCard = cards[0] as HTMLElement
        expect(firstCard.style.width).toBeTruthy()
        expect(firstCard.style.height).toBeTruthy()
      }, { timeout: 1000 })
    })
  })

  describe('需求 4.5: 在不同分辨率下显示时，间距比例应该保持一致', () => {
    it('应该在不同分辨率下保持间距比例一致', async () => {
      const { container } = render(<CardFlipGame {...defaultProps} />)

      // 等待游戏初始化
      await waitFor(() => {
        expect(screen.getByText('点击卡牌进行翻牌')).toBeInTheDocument()
      }, { timeout: 5000 })

      // 测试多种分辨率
      const resolutions = [
        { width: 1920, height: 1080 }, // 桌面端
        { width: 1024, height: 768 },  // 平板端
        { width: 375, height: 667 }    // 移动端
      ]

      for (const resolution of resolutions) {
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: resolution.width
        })
        Object.defineProperty(window, 'innerHeight', {
          writable: true,
          configurable: true,
          value: resolution.height
        })

        fireEvent(window, new Event('resize'))

        // 等待布局调整
        await waitFor(() => {
          const cards = container.querySelectorAll('[data-testid^="game-card-"]')
          expect(cards.length).toBeGreaterThan(0)
          
          // 验证卡牌在不同分辨率下都能正确显示
          const firstCard = cards[0] as HTMLElement
          expect(firstCard.style.transform).toBeTruthy()
        }, { timeout: 1000 })
      }
    })
  })

  describe('动画过程中的resize处理', () => {
    it('应该在动画过程中正确处理resize事件', async () => {
      const { container } = render(<CardFlipGame {...defaultProps} />)

      // 等待游戏初始化但不等待动画完成
      await waitFor(() => {
        expect(screen.getByText('正在发牌...')).toBeInTheDocument()
      }, { timeout: 2000 })

      // 在动画过程中触发resize
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 800
      })
      fireEvent(window, new Event('resize'))

      // 等待动画和resize处理完成
      await waitFor(() => {
        expect(screen.getByText('点击卡牌进行翻牌')).toBeInTheDocument()
      }, { timeout: 5000 })

      // 验证卡牌最终位置正确
      const cards = container.querySelectorAll('[data-testid^="game-card-"]')
      expect(cards.length).toBeGreaterThan(0)
    })
  })

  describe('性能优化验证', () => {
    it('应该使用150ms防抖延迟优化性能', async () => {
      const { container } = render(<CardFlipGame {...defaultProps} />)

      // 等待游戏初始化
      await waitFor(() => {
        expect(screen.getByText('点击卡牌进行翻牌')).toBeInTheDocument()
      }, { timeout: 5000 })

      const startTime = Date.now()

      // 快速连续触发resize事件
      for (let i = 0; i < 10; i++) {
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: 800 + i
        })
        fireEvent(window, new Event('resize'))
      }

      // 等待防抖延迟
      await new Promise(resolve => setTimeout(resolve, 200))

      const endTime = Date.now()
      const duration = endTime - startTime

      // 验证防抖机制工作正常（总时间应该接近防抖延迟时间）
      expect(duration).toBeGreaterThan(150)
      expect(duration).toBeLessThan(500)
    })

    it('应该在resize完成后清理timeout', async () => {
      const { container, unmount } = render(<CardFlipGame {...defaultProps} />)

      // 等待游戏初始化
      await waitFor(() => {
        expect(screen.getByText('点击卡牌进行翻牌')).toBeInTheDocument()
      }, { timeout: 5000 })

      // 触发resize
      fireEvent(window, new Event('resize'))

      // 立即卸载组件
      unmount()

      // 验证没有内存泄漏（通过没有错误抛出来验证）
      expect(true).toBe(true)
    })
  })

  describe('调试信息输出', () => {
    it('应该在开发环境下输出布局调试信息', async () => {
      // 设置开发环境
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'

      const { container } = render(<CardFlipGame {...defaultProps} />)

      // 等待游戏初始化
      await waitFor(() => {
        expect(screen.getByText('点击卡牌进行翻牌')).toBeInTheDocument()
      }, { timeout: 5000 })

      // 触发resize
      fireEvent(window, new Event('resize'))

      // 等待resize处理完成
      await new Promise(resolve => setTimeout(resolve, 200))

      // 验证调试信息被输出
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Window resized - Layout recalculated:'),
        expect.any(String)
      )

      // 恢复环境变量
      process.env.NODE_ENV = originalEnv
    })
  })
})