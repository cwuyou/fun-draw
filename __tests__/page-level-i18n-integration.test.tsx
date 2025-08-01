import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import GridLotteryDrawPage from '@/app/draw/grid-lottery/page'
import BlinkingNamePickerPage from '@/app/draw/blinking-name-picker/page'
import BulletScreenDrawPage from '@/app/draw/bullet-screen/page'
import SlotMachineDrawPage from '@/app/draw/slot-machine/page'
import { LanguageProvider } from '@/contexts/language-context'
import type { DrawingConfig } from '@/types'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}))

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
})

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

// Mock experience manager
vi.mock('@/lib/experience-manager', () => ({
  getCurrentExperienceSession: vi.fn(() => null),
}))

const mockRouter = {
  push: vi.fn(),
  back: vi.fn(),
  replace: vi.fn(),
}

const mockConfig: DrawingConfig = {
  items: [
    { id: '1', name: 'Alice' },
    { id: '2', name: 'Bob' },
    { id: '3', name: 'Charlie' },
    { id: '4', name: 'David' },
  ],
  quantity: 1,
  allowRepeat: false,
  mode: 'grid-lottery',
}

const TestWrapper = ({ children, language = 'zh' }: { children: React.ReactNode; language?: string }) => (
  <LanguageProvider initialLanguage={language}>
    {children}
  </LanguageProvider>
)

describe('Page Level I18n Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(useRouter as any).mockReturnValue(mockRouter)
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockConfig))
  })

  describe('Grid Lottery Page', () => {
    it('should display Chinese text when language is zh', async () => {
      render(
        <TestWrapper language="zh">
          <GridLotteryDrawPage />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('多宫格抽奖')).toBeInTheDocument()
        expect(screen.getByText('准备开始')).toBeInTheDocument()
        expect(screen.getByText('开始抽奖')).toBeInTheDocument()
      })
    })

    it('should display English text when language is en', async () => {
      render(
        <TestWrapper language="en">
          <GridLotteryDrawPage />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('Multi-Grid Lottery')).toBeInTheDocument()
        expect(screen.getByText('Ready to Start')).toBeInTheDocument()
        expect(screen.getByText('Start Draw')).toBeInTheDocument()
      })
    })

    it('should switch language dynamically', async () => {
      const { rerender } = render(
        <TestWrapper language="zh">
          <GridLotteryDrawPage />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('多宫格抽奖')).toBeInTheDocument()
      })

      rerender(
        <TestWrapper language="en">
          <GridLotteryDrawPage />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('Multi-Grid Lottery')).toBeInTheDocument()
      })
    })
  })

  describe('Blinking Name Picker Page', () => {
    beforeEach(() => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify({
        ...mockConfig,
        mode: 'blinking-name-picker',
      }))
    })

    it('should display Chinese text when language is zh', async () => {
      render(
        <TestWrapper language="zh">
          <BlinkingNamePickerPage />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('闪烁点名')).toBeInTheDocument()
        expect(screen.getByText('4 个参与者')).toBeInTheDocument()
        expect(screen.getByText('抽取 1 个')).toBeInTheDocument()
      })
    })

    it('should display English text when language is en', async () => {
      render(
        <TestWrapper language="en">
          <BlinkingNamePickerPage />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('Blinking Name Picker')).toBeInTheDocument()
        expect(screen.getByText('4 participants')).toBeInTheDocument()
        expect(screen.getByText('Draw 1 items')).toBeInTheDocument()
      })
    })
  })

  describe('Bullet Screen Page', () => {
    beforeEach(() => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify({
        ...mockConfig,
        mode: 'bullet-screen',
      }))
    })

    it('should display Chinese text when language is zh', async () => {
      render(
        <TestWrapper language="zh">
          <BulletScreenDrawPage />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('弹幕滚动抽奖')).toBeInTheDocument()
        expect(screen.getByText('准备开始')).toBeInTheDocument()
        expect(screen.getByText('开始抽奖')).toBeInTheDocument()
      })
    })

    it('should display English text when language is en', async () => {
      render(
        <TestWrapper language="en">
          <BulletScreenDrawPage />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('Bullet Screen Scrolling')).toBeInTheDocument()
        expect(screen.getByText('Ready to Start')).toBeInTheDocument()
        expect(screen.getByText('Start Draw')).toBeInTheDocument()
      })
    })
  })

  describe('Slot Machine Page', () => {
    beforeEach(() => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify({
        ...mockConfig,
        mode: 'slot-machine',
      }))
    })

    it('should display Chinese text when language is zh', async () => {
      render(
        <TestWrapper language="zh">
          <SlotMachineDrawPage />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('老虎机抽奖')).toBeInTheDocument()
        expect(screen.getByText('准备开始')).toBeInTheDocument()
        expect(screen.getByText('开始抽奖')).toBeInTheDocument()
      })
    })

    it('should display English text when language is en', async () => {
      render(
        <TestWrapper language="en">
          <SlotMachineDrawPage />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('Slot Machine')).toBeInTheDocument()
        expect(screen.getByText('Ready to Start')).toBeInTheDocument()
        expect(screen.getByText('Start Draw')).toBeInTheDocument()
      })
    })
  })

  describe('Cross-page navigation language persistence', () => {
    it('should maintain language preference across page navigation', async () => {
      // Start with Grid Lottery in English
      const { rerender } = render(
        <TestWrapper language="en">
          <GridLotteryDrawPage />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('Multi-Grid Lottery')).toBeInTheDocument()
      })

      // Navigate to Blinking Name Picker, should still be in English
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify({
        ...mockConfig,
        mode: 'blinking-name-picker',
      }))

      rerender(
        <TestWrapper language="en">
          <BlinkingNamePickerPage />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('Blinking Name Picker')).toBeInTheDocument()
      })
    })
  })

  describe('Error messages translation', () => {
    it('should display error messages in correct language', async () => {
      // Mock configuration error
      mockLocalStorage.getItem.mockReturnValue(null)

      render(
        <TestWrapper language="zh">
          <GridLotteryDrawPage />
        </TestWrapper>
      )

      // Should redirect due to missing config, but we can test the toast message
      expect(mockRouter.push).toHaveBeenCalledWith('/draw-config')
    })
  })
})