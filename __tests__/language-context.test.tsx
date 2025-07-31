import { render, renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { 
  LanguageProvider, 
  useLanguageContext,
  preloadTranslation,
  clearTranslationCache,
  getCachedLanguages
} from '@/contexts/language-context'
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
      greeting: '你好，{{name}}！'
    },
    home: {
      title: '让抽奖变得更有趣'
    }
  },
  en: {
    common: {
      loading: 'Loading...',
      error: 'Error',
      greeting: 'Hello, {{name}}!'
    },
    home: {
      title: 'Make Drawing More Fun'
    }
  }
}

describe('LanguageContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    clearTranslationCache()
    
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
    clearTranslationCache()
  })

  describe('LanguageProvider', () => {
    it('provides language context to children', async () => {
      const TestComponent = () => {
        const { currentLanguage, t } = useLanguageContext()
        return <div data-testid="language">{currentLanguage}</div>
      }

      const { getByTestId } = render(
        <LanguageProvider>
          <TestComponent />
        </LanguageProvider>
      )

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100))
      })

      expect(getByTestId('language')).toHaveTextContent('zh')
    })

    it('uses default language when provided', async () => {
      const TestComponent = () => {
        const { currentLanguage } = useLanguageContext()
        return <div data-testid="language">{currentLanguage}</div>
      }

      const { getByTestId } = render(
        <LanguageProvider defaultLanguage="en">
          <TestComponent />
        </LanguageProvider>
      )

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100))
      })

      expect(getByTestId('language')).toHaveTextContent('en')
    })

    it('loads user preference from localStorage', async () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify({
        language: 'en',
        timestamp: Date.now(),
        version: '1.0.0'
      }))

      const TestComponent = () => {
        const { currentLanguage } = useLanguageContext()
        return <div data-testid="language">{currentLanguage}</div>
      }

      const { getByTestId } = render(
        <LanguageProvider>
          <TestComponent />
        </LanguageProvider>
      )

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100))
      })

      expect(getByTestId('language')).toHaveTextContent('en')
    })

    it('handles localStorage errors gracefully', async () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('localStorage error')
      })

      const TestComponent = () => {
        const { currentLanguage } = useLanguageContext()
        return <div data-testid="language">{currentLanguage}</div>
      }

      const { getByTestId } = render(
        <LanguageProvider>
          <TestComponent />
        </LanguageProvider>
      )

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100))
      })

      expect(getByTestId('language')).toHaveTextContent('zh')
    })
  })

  describe('Translation Function', () => {
    it('translates simple keys correctly', async () => {
      const { result } = renderHook(() => useLanguageContext(), {
        wrapper: ({ children }) => (
          <LanguageProvider defaultLanguage="zh">
            {children}
          </LanguageProvider>
        )
      })

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100))
      })

      expect(result.current.t('common.loading')).toBe('加载中...')
      expect(result.current.t('home.title')).toBe('让抽奖变得更有趣')
    })

    it('handles nested keys correctly', async () => {
      const { result } = renderHook(() => useLanguageContext(), {
        wrapper: ({ children }) => (
          <LanguageProvider defaultLanguage="zh">
            {children}
          </LanguageProvider>
        )
      })

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100))
      })

      expect(result.current.t('common.loading')).toBe('加载中...')
    })

    it('interpolates parameters correctly', async () => {
      const { result } = renderHook(() => useLanguageContext(), {
        wrapper: ({ children }) => (
          <LanguageProvider defaultLanguage="zh">
            {children}
          </LanguageProvider>
        )
      })

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100))
      })

      expect(result.current.t('common.greeting', { name: '用户' })).toBe('你好，用户！')
    })

    it('returns key when translation not found', async () => {
      const { result } = renderHook(() => useLanguageContext(), {
        wrapper: ({ children }) => (
          <LanguageProvider defaultLanguage="zh">
            {children}
          </LanguageProvider>
        )
      })

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100))
      })

      expect(result.current.t('nonexistent.key')).toBe('nonexistent.key')
    })

    it('handles non-string values gracefully', async () => {
      ;(global.fetch as any).mockImplementation(() => {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            common: {
              loading: ['not', 'a', 'string']
            }
          })
        })
      })

      const { result } = renderHook(() => useLanguageContext(), {
        wrapper: ({ children }) => (
          <LanguageProvider defaultLanguage="zh">
            {children}
          </LanguageProvider>
        )
      })

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100))
      })

      expect(result.current.t('common.loading')).toBe('common.loading')
    })
  })

  describe('Language Switching', () => {
    it('switches language correctly', async () => {
      const { result } = renderHook(() => useLanguageContext(), {
        wrapper: ({ children }) => (
          <LanguageProvider defaultLanguage="zh">
            {children}
          </LanguageProvider>
        )
      })

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100))
      })

      expect(result.current.currentLanguage).toBe('zh')
      expect(result.current.t('common.loading')).toBe('加载中...')

      await act(async () => {
        await result.current.setLanguage('en')
      })

      expect(result.current.currentLanguage).toBe('en')
      expect(result.current.t('common.loading')).toBe('Loading...')
    })

    it('saves language preference to localStorage', async () => {
      const { result } = renderHook(() => useLanguageContext(), {
        wrapper: ({ children }) => (
          <LanguageProvider defaultLanguage="zh">
            {children}
          </LanguageProvider>
        )
      })

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100))
      })

      await act(async () => {
        await result.current.setLanguage('en')
      })

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'language_preference',
        expect.stringContaining('"language":"en"')
      )
    })

    it('handles localStorage save errors gracefully', async () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('localStorage error')
      })

      const { result } = renderHook(() => useLanguageContext(), {
        wrapper: ({ children }) => (
          <LanguageProvider defaultLanguage="zh">
            {children}
          </LanguageProvider>
        )
      })

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100))
      })

      // Should not throw error
      await act(async () => {
        await result.current.setLanguage('en')
      })

      expect(result.current.currentLanguage).toBe('en')
    })

    it('does not switch if language is the same', async () => {
      const { result } = renderHook(() => useLanguageContext(), {
        wrapper: ({ children }) => (
          <LanguageProvider defaultLanguage="zh">
            {children}
          </LanguageProvider>
        )
      })

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100))
      })

      const initialFetchCallCount = (global.fetch as any).mock.calls.length

      await act(async () => {
        await result.current.setLanguage('zh')
      })

      // Should not make additional fetch calls
      expect((global.fetch as any).mock.calls.length).toBe(initialFetchCallCount)
    })
  })

  describe('Error Handling', () => {
    it('handles fetch errors gracefully', async () => {
      ;(global.fetch as any).mockRejectedValueOnce(new Error('Network error'))

      const { result } = renderHook(() => useLanguageContext(), {
        wrapper: ({ children }) => (
          <LanguageProvider defaultLanguage="zh">
            {children}
          </LanguageProvider>
        )
      })

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100))
      })

      expect(result.current.error).toBeTruthy()
      expect(result.current.isLoading).toBe(false)
    })

    it('uses fallback translation when fetch fails', async () => {
      ;(global.fetch as any).mockRejectedValueOnce(new Error('Network error'))

      const { result } = renderHook(() => useLanguageContext(), {
        wrapper: ({ children }) => (
          <LanguageProvider defaultLanguage="zh">
            {children}
          </LanguageProvider>
        )
      })

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100))
      })

      // Should still provide basic translations
      expect(result.current.t('common.loading')).toBe('加载中...')
    })

    it('handles language switch errors', async () => {
      const { result } = renderHook(() => useLanguageContext(), {
        wrapper: ({ children }) => (
          <LanguageProvider defaultLanguage="zh">
            {children}
          </LanguageProvider>
        )
      })

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100))
      })

      // Mock fetch failure for language switch
      ;(global.fetch as any).mockRejectedValueOnce(new Error('Network error'))

      await act(async () => {
        await result.current.setLanguage('en')
      })

      expect(result.current.error).toBeTruthy()
      expect(result.current.currentLanguage).toBe('zh') // Should remain unchanged
    })
  })

  describe('Loading States', () => {
    it('shows loading state initially', () => {
      const { result } = renderHook(() => useLanguageContext(), {
        wrapper: ({ children }) => (
          <LanguageProvider defaultLanguage="zh">
            {children}
          </LanguageProvider>
        )
      })

      expect(result.current.isLoading).toBe(true)
    })

    it('shows loading state during language switch', async () => {
      const { result } = renderHook(() => useLanguageContext(), {
        wrapper: ({ children }) => (
          <LanguageProvider defaultLanguage="zh">
            {children}
          </LanguageProvider>
        )
      })

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100))
      })

      expect(result.current.isLoading).toBe(false)

      // Start language switch
      act(() => {
        result.current.setLanguage('en')
      })

      expect(result.current.isLoading).toBe(true)
    })
  })

  describe('Utility Functions', () => {
    it('preloads translations correctly', async () => {
      await preloadTranslation('en')
      
      expect(global.fetch).toHaveBeenCalledWith('/locales/en.json')
    })

    it('handles preload errors gracefully', async () => {
      ;(global.fetch as any).mockRejectedValueOnce(new Error('Network error'))
      
      // Should not throw
      await expect(preloadTranslation('en')).resolves.toBeUndefined()
    })

    it('clears translation cache', () => {
      clearTranslationCache()
      expect(getCachedLanguages()).toEqual([])
    })

    it('returns cached languages', async () => {
      await preloadTranslation('zh')
      await preloadTranslation('en')
      
      const cached = getCachedLanguages()
      expect(cached).toContain('zh')
      expect(cached).toContain('en')
    })
  })

  describe('Hook Usage Outside Provider', () => {
    it('throws error when used outside provider', () => {
      expect(() => {
        renderHook(() => useLanguageContext())
      }).toThrow('useLanguageContext must be used within a LanguageProvider')
    })
  })
})