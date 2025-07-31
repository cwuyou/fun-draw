import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import GridLotteryDrawPage from '@/app/draw/grid-lottery/page'
import DrawConfigPage from '@/app/draw-config/page'
import type { DrawingConfig } from '@/types'

// Mock Next.js router
const mockPush = vi.fn()
const mockBack = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
  }),
}))

// Mock toast
const mockToast = vi.fn()
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}))

// Mock Toaster component
vi.mock('@/components/ui/toaster', () => ({
  Toaster: () => null,
}))

// Mock sound manager
vi.mock('@/lib/sound-manager', () => ({
  soundManager: {
    setEnabled: vi.fn(),
    play: vi.fn(),
    stop: vi.fn(),
    stopAll: vi.fn(),
  },
}))

// Mock draw utils
vi.mock('@/lib/draw-utils', () => ({
  performDraw: vi.fn(() => [{ id: '1', name: '测试获奖者' }]),
}))

describe('Task 9: Grid Lottery Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  const createTestConfig = (itemCount: number, allowRepeat: boolean = false): DrawingConfig => ({
    mode: 'grid-lottery',
    quantity: 1,
    allowRepeat,
    items: Array.from({ length: itemCount }, (_, i) => ({
      id: `item-${i + 1}`,
      name: `项目 ${i + 1}`
    }))
  })

  describe('Complete Configuration to Draw Flow', () => {
    it('should complete full flow from config to draw result', async () => {
      const config = createTestConfig(6)
      localStorage.setItem('draw-config', JSON.stringify(config))
      
      render(<GridLotteryDrawPage />)
      
      // Verify initial state
      expect(screen.getByText('多宫格抽奖')).toBeInTheDocument()
      expect(screen.getByText('准备开始')).toBeInTheDocument()
      
      // Start draw
      const startButton = screen.getByText('开始抽奖')
      fireEvent.click(startButton)
      
      // Wait for countdown
      await waitFor(() => {
        expect(screen.getByText(/倒计时/)).toBeInTheDocument()
      })
      
      // Wait for spinning
      await waitFor(() => {
        expect(screen.getByText('灯光跳转中...')).toBeInTheDocument()
      }, { timeout: 5000 })
      
      // Wait for completion
      await waitFor(() => {
        expect(screen.getByText('抽奖完成！')).toBeInTheDocument()
      }, { timeout: 15000 })
    })
  })

  describe('Grid Layout Validation', () => {
    it('should handle 6-grid layout correctly', () => {
      const config = createTestConfig(4)
      localStorage.setItem('draw-config', JSON.stringify(config))
      
      render(<GridLotteryDrawPage />)
      
      expect(screen.getByText('6 宫格')).toBeInTheDocument()
      expect(screen.getByText('4 项目')).toBeInTheDocument()
    })

    it('should handle 9-grid layout correctly', () => {
      const config = createTestConfig(8)
      localStorage.setItem('draw-config', JSON.stringify(config))
      
      render(<GridLotteryDrawPage />)
      
      expect(screen.getByText('9 宫格')).toBeInTheDocument()
      expect(screen.getByText('8 项目')).toBeInTheDocument()
    })

    it('should handle 12-grid layout correctly', () => {
      const config = createTestConfig(11)
      localStorage.setItem('draw-config', JSON.stringify(config))
      
      render(<GridLotteryDrawPage />)
      
      expect(screen.getByText('12 宫格')).toBeInTheDocument()
      expect(screen.getByText('11 项目')).toBeInTheDocument()
    })

    it('should handle 15-grid layout correctly', () => {
      const config = createTestConfig(14)
      localStorage.setItem('draw-config', JSON.stringify(config))
      
      render(<GridLotteryDrawPage />)
      
      expect(screen.getByText('15 宫格')).toBeInTheDocument()
      expect(screen.getByText('14 项目')).toBeInTheDocument()
    })
  })

  describe('Different Item Counts and Grid Layouts', () => {
    it('should handle minimal items (1 item)', () => {
      const config = createTestConfig(1)
      localStorage.setItem('draw-config', JSON.stringify(config))
      
      render(<GridLotteryDrawPage />)
      
      expect(screen.getByText('6 宫格')).toBeInTheDocument()
      expect(screen.getByText('1 项目')).toBeInTheDocument()
      
      // Should show placeholders
      const placeholders = screen.getAllByText('—')
      expect(placeholders.length).toBeGreaterThan(0)
    })

    it('should handle maximum supported items (15 items)', () => {
      const config = createTestConfig(15)
      localStorage.setItem('draw-config', JSON.stringify(config))
      
      render(<GridLotteryDrawPage />)
      
      expect(screen.getByText('15 宫格')).toBeInTheDocument()
      expect(screen.getByText('15 项目')).toBeInTheDocument()
      
      // Should not show placeholders
      expect(screen.queryByText('—')).not.toBeInTheDocument()
    })

    it('should handle more than 15 items', () => {
      const config = createTestConfig(20)
      localStorage.setItem('draw-config', JSON.stringify(config))
      
      render(<GridLotteryDrawPage />)
      
      expect(screen.getByText('15 宫格')).toBeInTheDocument()
      expect(screen.getByText('20 项目')).toBeInTheDocument()
    })

    it('should handle repeat mode with few items', () => {
      const config = createTestConfig(3, true)
      localStorage.setItem('draw-config', JSON.stringify(config))
      
      render(<GridLotteryDrawPage />)
      
      expect(screen.getByText('6 宫格')).toBeInTheDocument()
      expect(screen.getByText('3 项目')).toBeInTheDocument()
      
      // Should show repeated items instead of placeholders
      expect(screen.getAllByText('项目 1')).toHaveLength(2)
      expect(screen.getAllByText('项目 2')).toHaveLength(2)
      expect(screen.getAllByText('项目 3')).toHaveLength(2)
    })
  })

  describe('Requirements Validation', () => {
    it('should validate requirement 2.1: Single draw mode enforcement', () => {
      const config = createTestConfig(6)
      localStorage.setItem('draw-config', JSON.stringify(config))
      
      render(<GridLotteryDrawPage />)
      
      // Should show single draw badge
      expect(screen.getByText('单次抽取')).toBeInTheDocument()
      
      // Should show single draw description
      expect(screen.getByText('单次抽取模式 - 灯光跳转选择一位获奖者')).toBeInTheDocument()
    })

    it('should validate requirement 2.2: Grid layout optimization', () => {
      const testCases = [
        { items: 4, expectedGrid: '6 宫格' },
        { items: 8, expectedGrid: '9 宫格' },
        { items: 11, expectedGrid: '12 宫格' },
        { items: 14, expectedGrid: '15 宫格' }
      ]

      testCases.forEach(({ items, expectedGrid }) => {
        const config = createTestConfig(items)
        localStorage.setItem('draw-config', JSON.stringify(config))
        
        const { unmount } = render(<GridLotteryDrawPage />)
        
        expect(screen.getByText(expectedGrid)).toBeInTheDocument()
        
        unmount()
      })
    })

    it('should validate requirement 2.3: Visual feedback improvements', async () => {
      const config = createTestConfig(6)
      localStorage.setItem('draw-config', JSON.stringify(config))
      
      render(<GridLotteryDrawPage />)
      
      // Start draw to test visual feedback
      const startButton = screen.getByText('开始抽奖')
      fireEvent.click(startButton)
      
      // Should show countdown visual feedback
      await waitFor(() => {
        expect(screen.getByText(/倒计时/)).toBeInTheDocument()
      })
      
      // Should show spinning visual feedback
      await waitFor(() => {
        expect(screen.getByText('灯光跳转中...')).toBeInTheDocument()
      }, { timeout: 5000 })
    })

    it('should validate requirement 3.1: Configuration validation', () => {
      // Test invalid config (wrong mode)
      const invalidConfig = { ...createTestConfig(6), mode: 'slot-machine' as any }
      localStorage.setItem('draw-config', JSON.stringify(invalidConfig))
      
      render(<GridLotteryDrawPage />)
      
      // Should redirect to config page
      expect(mockPush).toHaveBeenCalledWith('/draw-config')
    })

    it('should validate requirement 3.2: Error handling', () => {
      // Test missing config
      render(<GridLotteryDrawPage />)
      
      // Should redirect to config page
      expect(mockPush).toHaveBeenCalledWith('/draw-config')
      expect(mockToast).toHaveBeenCalledWith({
        title: '配置丢失',
        description: '请重新配置抽奖参数',
        variant: 'destructive',
      })
    })

    it('should validate requirement 3.3: Performance optimization', async () => {
      const config = createTestConfig(15) // Maximum items
      localStorage.setItem('draw-config', JSON.stringify(config))
      
      const startTime = performance.now()
      render(<GridLotteryDrawPage />)
      const renderTime = performance.now() - startTime
      
      // Should render within reasonable time (less than 100ms)
      expect(renderTime).toBeLessThan(100)
      
      // Should handle all 15 grid cells
      const gridContainer = document.querySelector('[style*="grid-template-columns"]')
      expect(gridContainer).toBeInTheDocument()
    })
  })

  describe('End-to-End Integration', () => {
    it('should complete full user journey', async () => {
      // Step 1: Configuration
      const config = createTestConfig(9)
      localStorage.setItem('draw-config', JSON.stringify(config))
      
      // Step 2: Draw page initialization
      render(<GridLotteryDrawPage />)
      
      expect(screen.getByText('多宫格抽奖')).toBeInTheDocument()
      expect(screen.getByText('9 宫格')).toBeInTheDocument()
      
      // Step 3: Start draw process
      const startButton = screen.getByText('开始抽奖')
      expect(startButton).toBeEnabled()
      
      fireEvent.click(startButton)
      
      // Step 4: Verify countdown phase
      await waitFor(() => {
        expect(screen.getByText(/倒计时/)).toBeInTheDocument()
      })
      
      // Step 5: Verify spinning phase
      await waitFor(() => {
        expect(screen.getByText('灯光跳转中...')).toBeInTheDocument()
      }, { timeout: 5000 })
      
      // Step 6: Verify completion
      await waitFor(() => {
        expect(screen.getByText('抽奖完成！')).toBeInTheDocument()
      }, { timeout: 15000 })
      
      // Step 7: Verify winner display
      await waitFor(() => {
        expect(screen.getByText(/获奖者：/)).toBeInTheDocument()
      })
    })
  })
})