import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
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
    stopAll: vi.fn(),
    play: vi.fn(),
    stop: vi.fn()
  }
}))

vi.mock('@/lib/draw-utils', () => ({
  performDraw: vi.fn((config) => {
    // Return first item as winner for testing
    return config.items.length > 0 ? [config.items[0]] : []
  })
}))

const mockRouter = {
  push: vi.fn(),
  back: vi.fn()
}

describe('Grid Lottery Layout Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(useRouter as any).mockReturnValue(mockRouter)
    
    // Clear localStorage
    localStorage.clear()
  })

  const createTestConfig = (itemCount: number, allowRepeat: boolean = false): DrawingConfig => ({
    mode: 'grid-lottery',
    quantity: 1, // Grid lottery is always single draw
    allowRepeat,
    items: Array.from({ length: itemCount }, (_, i) => ({
      id: `item-${i + 1}`,
      name: `项目 ${i + 1}`
    }))
  })

  describe('Grid Size Determination', () => {
    it('should use 2×3 layout (6 grids) for 1-6 items', () => {
      const config = createTestConfig(4)
      localStorage.setItem('draw-config', JSON.stringify(config))
      
      render(<GridLotteryDrawPage />)
      
      // Should show 6 grid cells
      const gridContainer = screen.getByRole('main') || document.body
      const gridCells = gridContainer.querySelectorAll('[class*="aspect-square"]')
      expect(gridCells).toHaveLength(6)
      
      // Should show badge indicating 6 grids
      expect(screen.getByText('6 宫格')).toBeInTheDocument()
    })

    it('should use 3×3 layout (9 grids) for 7-9 items', () => {
      const config = createTestConfig(8)
      localStorage.setItem('draw-config', JSON.stringify(config))
      
      render(<GridLotteryDrawPage />)
      
      const gridContainer = screen.getByRole('main') || document.body
      const gridCells = gridContainer.querySelectorAll('[class*="aspect-square"]')
      expect(gridCells).toHaveLength(9)
      expect(screen.getByText('9 宫格')).toBeInTheDocument()
    })

    it('should use 3×4 layout (12 grids) for 10-12 items', () => {
      const config = createTestConfig(11)
      localStorage.setItem('draw-config', JSON.stringify(config))
      
      render(<GridLotteryDrawPage />)
      
      const gridContainer = screen.getByRole('main') || document.body
      const gridCells = gridContainer.querySelectorAll('[class*="aspect-square"]')
      expect(gridCells).toHaveLength(12)
      expect(screen.getByText('12 宫格')).toBeInTheDocument()
    })

    it('should use 3×5 layout (15 grids) for 13-15 items', () => {
      const config = createTestConfig(14)
      localStorage.setItem('draw-config', JSON.stringify(config))
      
      render(<GridLotteryDrawPage />)
      
      const gridContainer = screen.getByRole('main') || document.body
      const gridCells = gridContainer.querySelectorAll('[class*="aspect-square"]')
      expect(gridCells).toHaveLength(15)
      expect(screen.getByText('15 宫格')).toBeInTheDocument()
    })

    it('should use 3×5 layout (15 grids) for more than 15 items', () => {
      const config = createTestConfig(20)
      localStorage.setItem('draw-config', JSON.stringify(config))
      
      render(<GridLotteryDrawPage />)
      
      const gridContainer = screen.getByRole('main') || document.body
      const gridCells = gridContainer.querySelectorAll('[class*="aspect-square"]')
      expect(gridCells).toHaveLength(15)
      expect(screen.getByText('15 宫格')).toBeInTheDocument()
    })
  })

  describe('Repeat Logic', () => {
    it('should repeat items when allowRepeat is true and items < grid size', () => {
      const config = createTestConfig(3, true)
      localStorage.setItem('draw-config', JSON.stringify(config))
      
      render(<GridLotteryDrawPage />)
      
      // Should have 6 grid cells with repeated items
      expect(screen.getAllByText('项目 1')).toHaveLength(2)
      expect(screen.getAllByText('项目 2')).toHaveLength(2)
      expect(screen.getAllByText('项目 3')).toHaveLength(2)
    })

    it('should show placeholders when allowRepeat is false and items < grid size', () => {
      const config = createTestConfig(3, false)
      localStorage.setItem('draw-config', JSON.stringify(config))
      
      render(<GridLotteryDrawPage />)
      
      // Should have original items
      expect(screen.getByText('项目 1')).toBeInTheDocument()
      expect(screen.getByText('项目 2')).toBeInTheDocument()
      expect(screen.getByText('项目 3')).toBeInTheDocument()
      
      // Should have placeholders (shown as "—")
      const placeholders = screen.getAllByText('—')
      expect(placeholders).toHaveLength(3) // 6 total - 3 items = 3 placeholders
    })

    it('should randomly select items when items > grid size', () => {
      const config = createTestConfig(20, false)
      localStorage.setItem('draw-config', JSON.stringify(config))
      
      render(<GridLotteryDrawPage />)
      
      // Should have exactly 15 items displayed (no placeholders)
      const gridContainer = screen.getByRole('main') || document.body
      const gridCells = gridContainer.querySelectorAll('[class*="aspect-square"]')
      expect(gridCells).toHaveLength(15)
      
      // Should not have any placeholders
      expect(screen.queryByText('—')).not.toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('should redirect when config is missing', () => {
      // No config in localStorage
      render(<GridLotteryDrawPage />)
      
      expect(mockRouter.push).toHaveBeenCalledWith('/draw-config')
    })

    it('should redirect when mode is incorrect', () => {
      const config = { ...createTestConfig(5), mode: 'slot-machine' as any }
      localStorage.setItem('draw-config', JSON.stringify(config))
      
      render(<GridLotteryDrawPage />)
      
      expect(mockRouter.push).toHaveBeenCalledWith('/draw-config')
    })
  })

  describe('UI Elements', () => {
    it('should display correct grid layout information', () => {
      const config = createTestConfig(8)
      localStorage.setItem('draw-config', JSON.stringify(config))
      
      render(<GridLotteryDrawPage />)
      
      // Should show mode information
      expect(screen.getByText('多宫格抽奖')).toBeInTheDocument()
      expect(screen.getByText('单次抽取模式 - 灯光跳转选择一位获奖者')).toBeInTheDocument()
      
      // Should show badges
      expect(screen.getByText('单次抽取')).toBeInTheDocument()
      expect(screen.getByText('8 项目')).toBeInTheDocument()
      expect(screen.getByText('9 宫格')).toBeInTheDocument()
    })

    it('should show proper item count in header', () => {
      const config = createTestConfig(12)
      localStorage.setItem('draw-config', JSON.stringify(config))
      
      render(<GridLotteryDrawPage />)
      
      expect(screen.getByText('12 项目')).toBeInTheDocument()
    })
  })
})