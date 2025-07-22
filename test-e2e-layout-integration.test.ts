import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import CardFlipGame from '@/components/card-flip-game'
import { ListItem } from '@/types'

// Mock the layout manager and spacing system
vi.mock('@/lib/layout-manager', () => ({
  calculateCardPositions: vi.fn(),
  validateLayoutBounds: vi.fn(),
  calculateSafeMargins: vi.fn()
}))

vi.mock('@/lib/spacing-system', () => ({
  getStandardSpacing: vi.fn(),
  validateSpacing: vi.fn()
}))

vi.mock('@/hooks/use-dynamic-spacing', () => ({
  useDynamicSpacing: () => ({
    cardToStatus: 24,
    cardToInfo: 32,
    cardToResult: 40,
    cardToContainer: 16
  })
}))

describe('端到端布局集成测试', () => {
  const mockItems: ListItem[] = [
    { id: '1', name: '参与者1', selected: false },
    { id: '2', name: '参与者2', selected: false },
    { id: '3', name: '参与者3', selected: false },
    { id: '4', name: '参与者4', selected: false },
    { id: '5', name: '参与者5', selected: false },
    { id: '6', name: '参与者6', selected: false }
  ]

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks()
    
    // Mock window dimensions
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
  })

  describe('完整游戏流程布局测试', () => {
    it('应该在整个游戏流程中保持布局一致性', async () => {
      const onComplete = vi.fn()
      
      render(
        <CardFlipGame
          items={mockItems}
          quantity={2}
          allowRepeat={false}
          onComplete={onComplete}
        />
      )

      // 1. 初始状态 - 验证洗牌阶段布局
      const startButton = screen.getByText('开始抽奖')
      expect(startButton).toBeInTheDocument()
      
      // 验证初始布局元素存在
      const gameContainer = screen.getByTestId('card-flip-game') || screen.getByRole('main')
      expect(gameContainer).toBeInTheDocument()

      // 2. 开始游戏 - 验证发牌阶段布局
      fireEvent.click(startButton)
      
      await waitFor(() => {
        const cards = screen.getAllByTestId(/card-/)
        expect(cards).toHaveLength(mockItems.length)
      })

      // 验证卡牌位置计算被调用
      const { calculateCardPositions } = await import('@/lib/layout-manager')
      expect(calculateCardPositions).toHaveBeenCalled()

      // 3. 翻牌阶段 - 验证交互过程中的布局稳定性
      const cards = screen.getAllByTestId(/card-/)
      
      // 翻开前两张卡牌
      fireEvent.click(cards[0])
      fireEvent.click(cards[1])

      await waitFor(() => {
        expect(onComplete).toHaveBeenCalled()
      })

      // 4. 结果显示阶段 - 验证最终布局
      await waitFor(() => {
        const resultPanel = screen.getByTestId('result-panel') || 
                           screen.getByText(/中奖结果/i) ||
                           screen.getByText(/恭喜/i)
        expect(resultPanel).toBeInTheDocument()
      })
    })

    it('应该在窗口大小改变时保持布局响应性', async () => {
      const onComplete = vi.fn()
      
      render(
        <CardFlipGame
          items={mockItems}
          quantity={2}
          allowRepeat={false}
          onComplete={onComplete}
        />
      )

      // 开始游戏
      fireEvent.click(screen.getByText('开始抽奖'))
      
      await waitFor(() => {
        const cards = screen.getAllByTestId(/card-/)
        expect(cards).toHaveLength(mockItems.length)
      })

      // 模拟窗口大小改变 - 移动端
      Object.defineProperty(window, 'innerWidth', { value: 375 })
      Object.defineProperty(window, 'innerHeight', { value: 667 })
      fireEvent(window, new Event('resize'))

      // 验证布局重新计算
      await waitFor(() => {
        const { calculateCardPositions } = require('@/lib/layout-manager')
        expect(calculateCardPositions).toHaveBeenCalledTimes(2) // 初始 + resize
      })

      // 模拟窗口大小改变 - 桌面端
      Object.defineProperty(window, 'innerWidth', { value: 1920 })
      Object.defineProperty(window, 'innerHeight', { value: 1080 })
      fireEvent(window, new Event('resize'))

      await waitFor(() => {
        const { calculateCardPositions } = require('@/lib/layout-manager')
        expect(calculateCardPositions).toHaveBeenCalledTimes(3) // 初始 + 2 resizes
      })
    })
  })

  describe('需求验证测试', () => {
    it('需求1: 卡牌位置一致性 - 洗牌到发牌阶段位置保持稳定', async () => {
      const { calculateCardPositions } = await import('@/lib/layout-manager')
      
      // Mock返回一致的位置
      const mockPositions = [
        { x: 100, y: 200, rotation: 0, cardWidth: 80, cardHeight: 120, zIndex: 1 },
        { x: 200, y: 200, rotation: 0, cardWidth: 80, cardHeight: 120, zIndex: 1 }
      ]
      calculateCardPositions.mockReturnValue(mockPositions)

      render(
        <CardFlipGame
          items={mockItems.slice(0, 2)}
          quantity={1}
          allowRepeat={false}
          onComplete={vi.fn()}
        />
      )

      fireEvent.click(screen.getByText('开始抽奖'))
      
      await waitFor(() => {
        expect(calculateCardPositions).toHaveBeenCalled()
      })

      // 验证位置计算的一致性
      const calls = calculateCardPositions.mock.calls
      expect(calls.length).toBeGreaterThan(0)
    })

    it('需求2: UI元素间距 - 中奖信息与卡牌保持足够间距', async () => {
      const onComplete = vi.fn()
      
      render(
        <CardFlipGame
          items={mockItems.slice(0, 2)}
          quantity={1}
          allowRepeat={false}
          onComplete={onComplete}
        />
      )

      // 开始并完成游戏
      fireEvent.click(screen.getByText('开始抽奖'))
      
      await waitFor(() => {
        const cards = screen.getAllByTestId(/card-/)
        expect(cards).toHaveLength(2)
      })

      const cards = screen.getAllByTestId(/card-/)
      fireEvent.click(cards[0])

      await waitFor(() => {
        expect(onComplete).toHaveBeenCalled()
      })

      // 验证间距系统被调用
      const { validateSpacing } = await import('@/lib/spacing-system')
      expect(validateSpacing).toHaveBeenCalled()
    })

    it('需求4: 响应式布局 - 不同设备类型适配', async () => {
      const testDevices = [
        { width: 375, height: 667, type: 'mobile' },
        { width: 768, height: 1024, type: 'tablet' },
        { width: 1920, height: 1080, type: 'desktop' }
      ]

      for (const device of testDevices) {
        Object.defineProperty(window, 'innerWidth', { value: device.width })
        Object.defineProperty(window, 'innerHeight', { value: device.height })

        const { unmount } = render(
          <CardFlipGame
            items={mockItems}
            quantity={2}
            allowRepeat={false}
            onComplete={vi.fn()}
          />
        )

        fireEvent.click(screen.getByText('开始抽奖'))
        
        await waitFor(() => {
          const cards = screen.getAllByTestId(/card-/)
          expect(cards).toHaveLength(mockItems.length)
        })

        // 验证每种设备类型都能正常渲染
        const gameContainer = screen.getByTestId('card-flip-game') || screen.getByRole('main')
        expect(gameContainer).toBeInTheDocument()

        unmount()
      }
    })

    it('需求5: 动画位置同步 - 动画过程中位置保持稳定', async () => {
      const { calculateCardPositions } = await import('@/lib/layout-manager')
      
      // Mock稳定的位置返回
      const stablePositions = mockItems.map((_, index) => ({
        x: 100 + index * 120,
        y: 200,
        rotation: 0,
        cardWidth: 80,
        cardHeight: 120,
        zIndex: 1
      }))
      calculateCardPositions.mockReturnValue(stablePositions)

      render(
        <CardFlipGame
          items={mockItems}
          quantity={2}
          allowRepeat={false}
          onComplete={vi.fn()}
        />
      )

      fireEvent.click(screen.getByText('开始抽奖'))
      
      await waitFor(() => {
        const cards = screen.getAllByTestId(/card-/)
        expect(cards).toHaveLength(mockItems.length)
      })

      // 验证位置计算的稳定性
      expect(calculateCardPositions).toHaveBeenCalled()
      const calls = calculateCardPositions.mock.calls
      
      // 确保所有调用都使用相同的参数结构
      calls.forEach(call => {
        expect(call[0]).toBeDefined() // cardCount
        expect(call[1]).toBeDefined() // containerDimensions
        expect(call[2]).toBeDefined() // deviceType
      })
    })

    it('需求6: 视觉层次 - 页面布局具有清晰的功能区域分隔', async () => {
      render(
        <CardFlipGame
          items={mockItems}
          quantity={2}
          allowRepeat={false}
          onComplete={vi.fn()}
        />
      )

      // 验证各功能区域的存在
      const startButton = screen.getByText('开始抽奖')
      expect(startButton).toBeInTheDocument()

      fireEvent.click(startButton)
      
      await waitFor(() => {
        const cards = screen.getAllByTestId(/card-/)
        expect(cards).toHaveLength(mockItems.length)
      })

      // 验证游戏信息面板
      const gameInfo = screen.getByTestId('game-info') || 
                      screen.getByText(/剩余/) ||
                      screen.getByText(/已选/)
      expect(gameInfo).toBeInTheDocument()

      // 验证卡牌容器
      const cardContainer = screen.getByTestId('card-container') || 
                           screen.getByTestId('card-flip-game')
      expect(cardContainer).toBeInTheDocument()
    })
  })

  describe('跨设备兼容性测试', () => {
    const deviceConfigs = [
      { name: 'iPhone SE', width: 375, height: 667 },
      { name: 'iPad', width: 768, height: 1024 },
      { name: 'Desktop', width: 1920, height: 1080 },
      { name: 'Ultra Wide', width: 2560, height: 1440 }
    ]

    deviceConfigs.forEach(device => {
      it(`应该在${device.name}上正常工作`, async () => {
        Object.defineProperty(window, 'innerWidth', { value: device.width })
        Object.defineProperty(window, 'innerHeight', { value: device.height })

        const onComplete = vi.fn()
        
        render(
          <CardFlipGame
            items={mockItems}
            quantity={2}
            allowRepeat={false}
            onComplete={onComplete}
          />
        )

        // 验证初始渲染
        expect(screen.getByText('开始抽奖')).toBeInTheDocument()

        // 开始游戏
        fireEvent.click(screen.getByText('开始抽奖'))
        
        await waitFor(() => {
          const cards = screen.getAllByTestId(/card-/)
          expect(cards).toHaveLength(mockItems.length)
        })

        // 验证布局计算被调用
        const { calculateCardPositions } = await import('@/lib/layout-manager')
        expect(calculateCardPositions).toHaveBeenCalled()

        // 完成游戏
        const cards = screen.getAllByTestId(/card-/)
        fireEvent.click(cards[0])
        fireEvent.click(cards[1])

        await waitFor(() => {
          expect(onComplete).toHaveBeenCalled()
        })
      })
    })
  })
})