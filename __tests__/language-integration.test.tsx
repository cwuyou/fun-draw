import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { LanguageProvider } from '@/contexts/language-context'
import LanguageSwitcher from '@/components/language-switcher'
import React from 'react'

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

const mockTranslations = {
  zh: {
    common: {
      loading: '加载中...',
      error: '错误',
      language: '语言',
      switchLanguage: '切换语言',
      current: '当前'
    },
    navigation: {
      home: '首页',
      createList: '创建名单',
      listLibrary: '名单库'
    },
    home: {
      title: '让抽奖变得更有趣',
      startButton: '立即开始抽奖'
    }
  },
  en: {
    common: {
      loading: 'Loading...',
      error: 'Error',
      language: 'Language',
      switchLanguage: 'Switch Language',
      current: 'Current'
    },
    navigation: {
      home: 'Home',
      createList: 'Create List',
      listLibrary: 'List Library'
    },
    home: {
      title: 'Make Drawing More Fun',
      startButton: 'Start Drawing Now'
    }
  }
}

// Test component that uses translations
const TestPage = () => {
  const { useTranslation } = require('@/hooks/use-translation')
  const { t } = useTranslation()
  
  return (
    <div>
      <header>
        <nav>
          <a href="/">{t('navigation.home')}</a>
          <a href="/create-list">{t('navigation.createList')}</a>
          <a href="/list-library">{t('navigation.listLibrary')}</a>
        </nav>
        <LanguageSwitcher />
      </header>
      <main>
        <h1 data-testid="page-title">{t('home.title')}</h1>
        <button data-testid="start-button">{t('home.startButton')}</button>
        <div data-testid="loading">{t('common.loading')}</div>
      </main>
    </div>
  )
}

describe('Language Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock successful fetch
    ;(global.fetch as any).mockImplementation((url: string) => {
      const language = url.includes('zh.json') ? 'zh' : 'en'
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockTranslations[language])
      })
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Complete Language Switching Flow', () => {
    it('switches all page content when language is changed', async () => {
      const { getByTestId, getByRole } = render(
        <LanguageProvider defaultLanguage="zh">
          <TestPage />
        </LanguageProvider>
      )

      // Wait for initial load
      await waitFor(() => {
        expect(getByTestId('page-title')).toHaveTextContent('让抽奖变得更有趣')
        expect(getByTestId('start-button')).toHaveTextContent('立即开始抽奖')
        expect(getByTestId('loading')).toHaveTextContent('加载中...')
      })

      // Click language switcher
      const languageSwitcher = getByRole('button')
      fireEvent.click(languageSwitcher)

      // Wait for dropdown to appear and click English option
      await waitFor(() => {
        const englishOption = screen.getByText('English')
        fireEvent.click(englishOption)
      })

      // Verify all content is updated to English
      await waitFor(() => {
        expect(getByTestId('page-title')).toHaveTextContent('Make Drawing More Fun')
        expect(getByTestId('start-button')).toHaveTextContent('Start Drawing Now')
        expect(getByTestId('loading')).toHaveTextContent('Loading...')
      })

      // Verify navigation links are also updated
      expect(screen.getByText('Home')).toBeInTheDocument()
      expect(screen.getByText('Create List')).toBeInTheDocument()
      expect(screen.getByText('List Library')).toBeInTheDocument()
    })

    it('maintains language state across component re-renders', async () => {
      const TestWrapper = ({ children }: { children: React.ReactNode }) => (
        <LanguageProvider defaultLanguage="zh">
          {children}
        </LanguageProvider>
      )

      const { getByTestId, getByRole, rerender } = render(<TestPage />, {
        wrapper: TestWrapper
      })

      // Wait for initial load
      await waitFor(() => {
        expect(getByTestId('page-title')).toHaveTextContent('让抽奖变得更有趣')
      })

      // Switch to English
      const languageSwitcher = getByRole('button')
      fireEvent.click(languageSwitcher)

      await waitFor(() => {
        const englishOption = screen.getByText('English')
        fireEvent.click(englishOption)
      })

      await waitFor(() => {
        expect(getByTestId('page-title')).toHaveTextContent('Make Drawing More Fun')
      })

      // Re-render component
      rerender(<TestPage />)

      // Language should still be English
      await waitFor(() => {
        expect(getByTestId('page-title')).toHaveTextContent('Make Drawing More Fun')
      })
    })
  })

  describe('Language Preference Persistence', () => {
    it('saves language preference to localStorage', async () => {
      const { getByRole } = render(
        <LanguageProvider defaultLanguage="zh">
          <TestPage />
        </LanguageProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('让抽奖变得更有趣')).toBeInTheDocument()
      })

      // Switch to English
      const languageSwitcher = getByRole('button')
      fireEvent.click(languageSwitcher)

      await waitFor(() => {
        const englishOption = screen.getByText('English')
        fireEvent.click(englishOption)
      })

      // Verify localStorage was called
      await waitFor(() => {
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          'language_preference',
          expect.stringContaining('"language":"en"')
        )
      })
    })

    it('loads saved language preference on initialization', async () => {
      // Mock saved English preference
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify({
        language: 'en',
        timestamp: Date.now(),
        version: '1.0.0'
      }))

      const { getByTestId } = render(
        <LanguageProvider>
          <TestPage />
        </LanguageProvider>
      )

      // Should load with English content
      await waitFor(() => {
        expect(getByTestId('page-title')).toHaveTextContent('Make Drawing More Fun')
        expect(getByTestId('start-button')).toHaveTextContent('Start Drawing Now')
      })
    })

    it('handles corrupted localStorage data gracefully', async () => {
      // Mock corrupted data
      mockLocalStorage.getItem.mockReturnValue('invalid-json')

      const { getByTestId } = render(
        <LanguageProvider defaultLanguage="zh">
          <TestPage />
        </LanguageProvider>
      )

      // Should fall back to default language
      await waitFor(() => {
        expect(getByTestId('page-title')).toHaveTextContent('让抽奖变得更有趣')
      })
    })
  })

  describe('Cross-Page Navigation State Persistence', () => {
    const NavigationTest = () => {
      const { useTranslation } = require('@/hooks/use-translation')
      const { t, currentLanguage } = useTranslation()
      const [currentPage, setCurrentPage] = React.useState('home')
      
      const pages = {
        home: {
          title: t('home.title'),
          content: t('home.startButton')
        },
        createList: {
          title: t('navigation.createList'),
          content: t('common.loading')
        }
      }
      
      return (
        <div>
          <nav>
            <button onClick={() => setCurrentPage('home')}>
              {t('navigation.home')}
            </button>
            <button onClick={() => setCurrentPage('createList')}>
              {t('navigation.createList')}
            </button>
          </nav>
          <LanguageSwitcher />
          <main>
            <h1 data-testid="page-title">{pages[currentPage as keyof typeof pages].title}</h1>
            <div data-testid="page-content">{pages[currentPage as keyof typeof pages].content}</div>
            <div data-testid="current-language">{currentLanguage}</div>
          </main>
        </div>
      )
    }

    it('maintains language state when navigating between pages', async () => {
      const { getByTestId, getByRole } = render(
        <LanguageProvider defaultLanguage="zh">
          <NavigationTest />
        </LanguageProvider>
      )

      // Wait for initial load
      await waitFor(() => {
        expect(getByTestId('current-language')).toHaveTextContent('zh')
        expect(getByTestId('page-title')).toHaveTextContent('让抽奖变得更有趣')
      })

      // Switch to English
      const languageSwitcher = getByRole('button', { name: /switch language/i })
      fireEvent.click(languageSwitcher)

      await waitFor(() => {
        const englishOption = screen.getByText('English')
        fireEvent.click(englishOption)
      })

      await waitFor(() => {
        expect(getByTestId('current-language')).toHaveTextContent('en')
        expect(getByTestId('page-title')).toHaveTextContent('Make Drawing More Fun')
      })

      // Navigate to create list page
      const createListButton = screen.getByText('Create List')
      fireEvent.click(createListButton)

      // Language should still be English on new page
      await waitFor(() => {
        expect(getByTestId('current-language')).toHaveTextContent('en')
        expect(getByTestId('page-title')).toHaveTextContent('Create List')
        expect(getByTestId('page-content')).toHaveTextContent('Loading...')
      })

      // Navigate back to home
      const homeButton = screen.getByText('Home')
      fireEvent.click(homeButton)

      // Language should still be English
      await waitFor(() => {
        expect(getByTestId('current-language')).toHaveTextContent('en')
        expect(getByTestId('page-title')).toHaveTextContent('Make Drawing More Fun')
      })
    })
  })

  describe('Error Recovery and Fallback', () => {
    it('recovers from translation loading errors', async () => {
      // Mock initial success, then failure, then success again
      let callCount = 0
      ;(global.fetch as any).mockImplementation((url: string) => {
        callCount++
        if (callCount === 2) {
          // Fail on second call (language switch)
          return Promise.reject(new Error('Network error'))
        }
        const language = url.includes('zh.json') ? 'zh' : 'en'
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockTranslations[language])
        })
      })

      const { getByTestId, getByRole } = render(
        <LanguageProvider defaultLanguage="zh">
          <TestPage />
        </LanguageProvider>
      )

      // Wait for initial load
      await waitFor(() => {
        expect(getByTestId('page-title')).toHaveTextContent('让抽奖变得更有趣')
      })

      // Try to switch language (this will fail)
      const languageSwitcher = getByRole('button')
      fireEvent.click(languageSwitcher)

      await waitFor(() => {
        const englishOption = screen.getByText('English')
        fireEvent.click(englishOption)
      })

      // Should remain in Chinese due to error
      await waitFor(() => {
        expect(getByTestId('page-title')).toHaveTextContent('让抽奖变得更有趣')
      })

      // Try again (this should succeed)
      fireEvent.click(languageSwitcher)

      await waitFor(() => {
        const englishOption = screen.getByText('English')
        fireEvent.click(englishOption)
      })

      // Should now switch to English
      await waitFor(() => {
        expect(getByTestId('page-title')).toHaveTextContent('Make Drawing More Fun')
      })
    })

    it('shows fallback content when translations are missing', async () => {
      // Mock incomplete translations
      ;(global.fetch as any).mockImplementation((url: string) => {
        const incompleteTranslations = {
          zh: {
            common: {
              loading: '加载中...'
            }
            // Missing home translations
          },
          en: {
            common: {
              loading: 'Loading...'
            }
            // Missing home translations
          }
        }
        
        const language = url.includes('zh.json') ? 'zh' : 'en'
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(incompleteTranslations[language])
        })
      })

      const { getByTestId } = render(
        <LanguageProvider defaultLanguage="zh">
          <TestPage />
        </LanguageProvider>
      )

      await waitFor(() => {
        // Should show translation key as fallback
        expect(getByTestId('page-title')).toHaveTextContent('home.title')
        expect(getByTestId('start-button')).toHaveTextContent('home.startButton')
        // But existing translations should work
        expect(getByTestId('loading')).toHaveTextContent('加载中...')
      })
    })
  })

  describe('Performance and Caching', () => {
    it('caches translations and does not refetch on subsequent switches', async () => {
      const { getByRole } = render(
        <LanguageProvider defaultLanguage="zh">
          <TestPage />
        </LanguageProvider>
      )

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('让抽奖变得更有趣')).toBeInTheDocument()
      })

      const initialFetchCount = (global.fetch as any).mock.calls.length

      // Switch to English
      const languageSwitcher = getByRole('button')
      fireEvent.click(languageSwitcher)

      await waitFor(() => {
        const englishOption = screen.getByText('English')
        fireEvent.click(englishOption)
      })

      await waitFor(() => {
        expect(screen.getByText('Make Drawing More Fun')).toBeInTheDocument()
      })

      const afterFirstSwitchCount = (global.fetch as any).mock.calls.length

      // Switch back to Chinese
      fireEvent.click(languageSwitcher)

      await waitFor(() => {
        const chineseOption = screen.getByText('中文')
        fireEvent.click(chineseOption)
      })

      await waitFor(() => {
        expect(screen.getByText('让抽奖变得更有趣')).toBeInTheDocument()
      })

      const finalFetchCount = (global.fetch as any).mock.calls.length

      // Should not make additional fetch calls for cached translations
      expect(finalFetchCount).toBe(afterFirstSwitchCount)
      expect(afterFirstSwitchCount).toBeGreaterThan(initialFetchCount)
    })
  })

  describe('Accessibility Integration', () => {
    it('maintains proper ARIA attributes across language switches', async () => {
      const { getByRole } = render(
        <LanguageProvider defaultLanguage="zh">
          <TestPage />
        </LanguageProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('让抽奖变得更有趣')).toBeInTheDocument()
      })

      const languageSwitcher = getByRole('button')
      expect(languageSwitcher).toHaveAttribute('aria-label')

      // Switch language
      fireEvent.click(languageSwitcher)

      await waitFor(() => {
        const englishOption = screen.getByText('English')
        fireEvent.click(englishOption)
      })

      // ARIA attributes should still be present
      await waitFor(() => {
        expect(languageSwitcher).toHaveAttribute('aria-label')
      })
    })
  })
})