import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import GridLotteryDrawPage from '@/app/draw/grid-lottery/page'
import { DrawResultModal } from '@/components/draw-result-modal'
import type { DrawResult } from '@/lib/draw-utils'

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
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
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
  exportResults: vi.fn(),
  copyToClipboard: vi.fn(() => Promise.resolve(true)),
}))

describe('Task 5: Grid Lottery Display Optimization', () => {
  beforeEach(() => {
    // Mock localStorage with grid lottery config
    const mockConfig = {
      mode: 'grid-lottery',
      quantity: 1,
      allowRepeat: false,
      items: [
        { id: '1', name: '参与者1' },
        { id: '2', name: '参与者2' },
        { id: '3', name: '参与者3' },
      ],
    }
    
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(() => JSON.stringify(mockConfig)),
        setItem: vi.fn(),
      },
      writable: true,
    })
    
    vi.clearAllMocks()
  })

  it('should display "单次抽取" badge in header', () => {
    render(<GridLotteryDrawPage />)
    
    // Check for the single draw badge
    expect(screen.getByText('单次抽取')).toBeInTheDocument()
    
    // Verify badge styling
    const badge = screen.getByText('单次抽取').closest('div')
    expect(badge).toHaveClass('bg-indigo-100', 'text-indigo-700')
  })

  it('should display updated page title and description for single draw mode', () => {
    render(<GridLotteryDrawPage />)
    
    // Check main title
    expect(screen.getByText('多宫格抽奖')).toBeInTheDocument()
    
    // Check updated description emphasizing single draw and light jumping
    expect(screen.getByText('单次抽取模式 - 灯光跳转选择一位获奖者')).toBeInTheDocument()
  })

  it('should show correct result text using "获奖者" instead of "获奖者们"', async () => {
    render(<GridLotteryDrawPage />)
    
    // Start the draw process
    const startButton = screen.getByText('开始抽奖')
    fireEvent.click(startButton)
    
    // Wait for the draw to complete (this might take some time due to animations)
    await waitFor(() => {
      expect(screen.getByText('抽奖完成！')).toBeInTheDocument()
    }, { timeout: 10000 })
    
    // Check that it shows "获奖者：" format (singular)
    expect(screen.getByText(/获奖者：/)).toBeInTheDocument()
  })

  it('should display correct mode description in draw result', () => {
    const mockResult: DrawResult = {
      winners: [{ id: '1', name: '测试获奖者' }],
      timestamp: new Date().toISOString(),
      mode: '多宫格抽奖（单次抽取）',
      totalItems: 3,
    }

    render(
      <DrawResultModal
        result={mockResult}
        isOpen={true}
        onClose={vi.fn()}
        onDrawAgain={vi.fn()}
        onGoHome={vi.fn()}
      />
    )

    // Check that mode shows single draw specification
    expect(screen.getByText('多宫格抽奖（单次抽取）')).toBeInTheDocument()
  })

  it('should use singular forms in result modal for single winner', () => {
    const mockResult: DrawResult = {
      winners: [{ id: '1', name: '测试获奖者' }],
      timestamp: new Date().toISOString(),
      mode: '多宫格抽奖（单次抽取）',
      totalItems: 3,
    }

    render(
      <DrawResultModal
        result={mockResult}
        isOpen={true}
        onClose={vi.fn()}
        onDrawAgain={vi.fn()}
        onGoHome={vi.fn()}
      />
    )

    // Check singular forms
    expect(screen.getByText('恭喜获奖者！')).toBeInTheDocument()
    expect(screen.getByText('获奖者')).toBeInTheDocument()
    expect(screen.getByText('1 位获奖者')).toBeInTheDocument()
  })

  it('should maintain plural forms in result modal for multiple winners', () => {
    const mockResult: DrawResult = {
      winners: [
        { id: '1', name: '获奖者1' },
        { id: '2', name: '获奖者2' },
      ],
      timestamp: new Date().toISOString(),
      mode: '其他抽奖模式',
      totalItems: 5,
    }

    render(
      <DrawResultModal
        result={mockResult}
        isOpen={true}
        onClose={vi.fn()}
        onDrawAgain={vi.fn()}
        onGoHome={vi.fn()}
      />
    )

    // Check plural forms are still used for multiple winners
    expect(screen.getByText('恭喜以下幸运儿！')).toBeInTheDocument()
    expect(screen.getByText('中奖名单')).toBeInTheDocument()
    expect(screen.getByText('2 位中奖')).toBeInTheDocument()
  })

  it('should verify all task 5 requirements are met', () => {
    render(<GridLotteryDrawPage />)
    
    // Requirement 2.2: Display "单次抽取" badge in header
    expect(screen.getByText('单次抽取')).toBeInTheDocument()
    
    // Requirement 2.2: Update page title and description
    expect(screen.getByText('单次抽取模式 - 灯光跳转选择一位获奖者')).toBeInTheDocument()
    
    // Requirement 2.3: The result display will be tested in integration
    // since it requires the full draw flow to complete
    
    console.log('✓ Task 5 requirements verified:')
    console.log('  - "单次抽取" badge displayed in header')
    console.log('  - Page description updated to emphasize single draw and light jumping')
    console.log('  - Result modal uses singular forms for single winner')
  })
})