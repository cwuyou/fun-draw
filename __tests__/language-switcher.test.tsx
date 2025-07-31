import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import LanguageSwitcher, { SimpleLanguageSwitcher, MobileLanguageSwitcher } from '@/components/language-switcher'
import { LanguageProvider } from '@/contexts/language-context'
import { useTranslation, useLanguageSwitch } from '@/hooks/use-translation'

// Mock the translation hooks
vi.mock('@/hooks/use-translation', () => ({
  useTranslation: vi.fn(),
  useLanguageSwitch: vi.fn()
}))

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
})

// Mock fetch for translation files
global.fetch = vi.fn()

const mockTranslation = {
  t: vi.fn((key: string) => key),
  currentLanguage: 'zh' as const,
  setLanguage: vi.fn(),
  isLoading: false,
  error: null
}

const mockLanguageSwitch = {
  currentLanguage: 'zh' as const,
  switchToZh: vi.fn(),
  switchToEn: vi.fn(),
  toggleLanguage: vi.fn(),
  isLoading: false,
  error: null,
  isZh: true,
  isEn: false
}

describe('LanguageSwitcher', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(useTranslation as any).mockReturnValue(mockTranslation)
    ;(useLanguageSwitch as any).mockReturnValue(mockLanguageSwitch)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Default LanguageSwitcher', () => {
    it('renders correctly with default props', () => {
      render(<LanguageSwitcher />)
      
      expect(screen.getByRole('button')).toBeInTheDocument()
      expect(screen.getByText('中')).toBeInTheDocument()
    })

    it('shows current language correctly', () => {
      render(<LanguageSwitcher />)
      
      expect(screen.getByText('中')).toBeInTheDocument()
    })

    it('shows English when current language is English', () => {
      ;(useLanguageSwitch as any).mockReturnValue({
        ...mockLanguageSwitch,
        currentLanguage: 'en',
        isZh: false,
        isEn: true
      })

      render(<LanguageSwitcher />)
      
      expect(screen.getByText('EN')).toBeInTheDocument()
    })

    it('opens dropdown menu when clicked', async () => {
      render(<LanguageSwitcher />)
      
      const button = screen.getByRole('button')
      fireEvent.click(button)
      
      await waitFor(() => {
        expect(screen.getByText('中文')).toBeInTheDocument()
        expect(screen.getByText('English')).toBeInTheDocument()
      })
    })

    it('calls switchToEn when English option is selected', async () => {
      render(<LanguageSwitcher />)
      
      const button = screen.getByRole('button')
      fireEvent.click(button)
      
      await waitFor(() => {
        const englishOption = screen.getByText('English')
        fireEvent.click(englishOption)
      })
      
      expect(mockLanguageSwitch.switchToEn).toHaveBeenCalled()
    })

    it('calls switchToZh when Chinese option is selected', async () => {
      ;(useLanguageSwitch as any).mockReturnValue({
        ...mockLanguageSwitch,
        currentLanguage: 'en',
        isZh: false,
        isEn: true
      })

      render(<LanguageSwitcher />)
      
      const button = screen.getByRole('button')
      fireEvent.click(button)
      
      await waitFor(() => {
        const chineseOption = screen.getByText('中文')
        fireEvent.click(chineseOption)
      })
      
      expect(mockLanguageSwitch.switchToZh).toHaveBeenCalled()
    })

    it('shows loading state correctly', () => {
      ;(useLanguageSwitch as any).mockReturnValue({
        ...mockLanguageSwitch,
        isLoading: true
      })

      render(<LanguageSwitcher />)
      
      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
    })

    it('shows error state correctly', () => {
      ;(useLanguageSwitch as any).mockReturnValue({
        ...mockLanguageSwitch,
        error: 'Language load error'
      })

      render(<LanguageSwitcher />)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('border-red-300', 'text-red-600')
    })
  })

  describe('Compact LanguageSwitcher', () => {
    it('renders compact variant correctly', () => {
      render(<LanguageSwitcher variant="compact" />)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('h-8', 'w-8', 'p-0')
      expect(screen.getByText('中')).toBeInTheDocument()
    })

    it('has correct accessibility attributes', () => {
      render(<LanguageSwitcher variant="compact" />)
      
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-label')
    })
  })

  describe('SimpleLanguageSwitcher', () => {
    it('renders correctly', () => {
      render(<SimpleLanguageSwitcher />)
      
      expect(screen.getByRole('button')).toBeInTheDocument()
      expect(screen.getByText('中')).toBeInTheDocument()
    })

    it('calls toggleLanguage when clicked', () => {
      render(<SimpleLanguageSwitcher />)
      
      const button = screen.getByRole('button')
      fireEvent.click(button)
      
      expect(mockLanguageSwitch.toggleLanguage).toHaveBeenCalled()
    })

    it('shows loading state', () => {
      ;(useLanguageSwitch as any).mockReturnValue({
        ...mockLanguageSwitch,
        isLoading: true
      })

      render(<SimpleLanguageSwitcher />)
      
      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
    })
  })

  describe('MobileLanguageSwitcher', () => {
    it('renders correctly', () => {
      render(<MobileLanguageSwitcher />)
      
      expect(screen.getByRole('button')).toBeInTheDocument()
      expect(screen.getByText('common.language')).toBeInTheDocument()
    })

    it('shows current language name', () => {
      render(<MobileLanguageSwitcher />)
      
      expect(screen.getByText('中文')).toBeInTheDocument()
    })

    it('opens dropdown with larger touch targets', async () => {
      render(<MobileLanguageSwitcher />)
      
      const button = screen.getByRole('button')
      fireEvent.click(button)
      
      await waitFor(() => {
        const menuItems = screen.getAllByRole('menuitem')
        menuItems.forEach(item => {
          expect(item).toHaveClass('min-h-[48px]')
        })
      })
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(<LanguageSwitcher />)
      
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-label')
    })

    it('supports keyboard navigation', async () => {
      render(<LanguageSwitcher />)
      
      const button = screen.getByRole('button')
      button.focus()
      
      // Press Enter to open dropdown
      fireEvent.keyDown(button, { key: 'Enter' })
      
      await waitFor(() => {
        expect(screen.getByRole('menu')).toBeInTheDocument()
      })
    })

    it('has proper role attributes for menu items', async () => {
      render(<LanguageSwitcher />)
      
      const button = screen.getByRole('button')
      fireEvent.click(button)
      
      await waitFor(() => {
        const menuItems = screen.getAllByRole('menuitem')
        expect(menuItems).toHaveLength(2)
      })
    })
  })

  describe('Error Handling', () => {
    it('handles translation errors gracefully', () => {
      ;(useTranslation as any).mockReturnValue({
        ...mockTranslation,
        t: vi.fn(() => 'fallback-text')
      })

      render(<LanguageSwitcher />)
      
      expect(screen.getByText('fallback-text')).toBeInTheDocument()
    })

    it('shows error message in dropdown when error occurs', async () => {
      ;(useLanguageSwitch as any).mockReturnValue({
        ...mockLanguageSwitch,
        error: 'Network error'
      })

      render(<LanguageSwitcher />)
      
      const button = screen.getByRole('button')
      fireEvent.click(button)
      
      await waitFor(() => {
        expect(screen.getByText('errors.languageLoadError')).toBeInTheDocument()
      })
    })
  })

  describe('Integration with LanguageProvider', () => {
    it('works correctly within LanguageProvider', async () => {
      const TestComponent = () => (
        <LanguageProvider>
          <LanguageSwitcher />
        </LanguageProvider>
      )

      render(<TestComponent />)
      
      expect(screen.getByRole('button')).toBeInTheDocument()
    })
  })
})