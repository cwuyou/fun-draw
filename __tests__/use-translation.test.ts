import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { 
  useTranslation, 
  useLanguageSwitch, 
  useTranslationKey,
  useTranslationWithFallback,
  useTranslationArray,
  useTranslationObject,
  translationUtils
} from '@/hooks/use-translation'
import { LanguageProvider } from '@/contexts/language-context'
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
    },
    test: {
      array: ['项目1', '项目2', '项目3']
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
    },
    test: {
      array: ['Item 1', 'Item 2', 'Item 3']
    }
  }
}

const createWrapper = (defaultLanguage: 'zh' | 'en' = 'zh') => {
  return ({ children }: { children: React.ReactNode }) => (
    <LanguageProvider defaultLanguage={defaultLanguage}>
      {children}
    </LanguageProvider>
  )
}

describe('useTranslation Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock fetch to return translation files
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

  describe('Basic Translation', () => {
    it('returns translation function and current language', async () => {
      const { result } = renderHook(() => useTranslation(), {
        wrapper: createWrapper('zh')
      })

      // Wait for initial load
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100))
      })

      expect(result.current.currentLanguage).toBe('zh')
      expect(typeof result.current.t).toBe('function')
      expect(typeof result.current.setLanguage).toBe('function')
    })

    it('translates simple keys correctly', async () => {
      const { result } = renderHook(() => useTranslation(), {
        wrapper: createWrapper('zh')
      })

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100))
      })

      expect(result.current.t('common.loading')).toBe('加载中...')
      expect(result.current.t('home.title')).toBe('让抽奖变得更有趣')
    })

    it('handles parameter interpolation', async () => {
      const { result } = renderHook(() => useTranslation(), {
        wrapper: createWrapper('zh')
      })

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100))
      })

      expect(result.current.t('common.greeting', { name: '用户' })).toBe('你好，用户！')
    })

    it('returns key when translation not found', async () => {
      const { result } = renderHook(() => useTranslation(), {
        wrapper: createWrapper('zh')
      })

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100))
      })

      expect(result.current.t('nonexistent.key')).toBe('nonexistent.key')
    })

    it('switches language correctly', async () => {
      const { result } = renderHook(() => useTranslation(), {
        wrapper: createWrapper('zh')
      })

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100))
      })

      expect(result.current.t('common.loading')).toBe('加载中...')

      await act(async () => {
        await result.current.setLanguage('en')
      })

      expect(result.current.currentLanguage).toBe('en')
      expect(result.current.t('common.loading')).toBe('Loading...')
    })
  })

  describe('Loading and Error States', () => {
    it('shows loading state initially', () => {
      const { result } = renderHook(() => useTranslation(), {
        wrapper: createWrapper('zh')
      })

      expect(result.current.isLoading).toBe(true)
    })

    it('handles fetch errors gracefully', async () => {
      ;(global.fetch as any).mockRejectedValueOnce(new Error('Network error'))

      const { result } = renderHook(() => useTranslation(), {
        wrapper: createWrapper('zh')
      })

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100))
      })

      expect(result.current.error).toBeTruthy()
    })
  })

  describe('Language Display Names', () => {
    it('returns correct display names', async () => {
      const { result } = renderHook(() => useTranslation(), {
        wrapper: createWrapper('zh')
      })

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100))
      })

      expect(result.current.getLanguageDisplayName()).toBe('Chinese')
      expect(result.current.getLanguageDisplayName(true)).toBe('中文')
    })

    it('checks language correctly', async () => {
      const { result } = renderHook(() => useTranslation(), {
        wrapper: createWrapper('zh')
      })

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100))
      })

      expect(result.current.isLanguage('zh')).toBe(true)
      expect(result.current.isLanguage('en')).toBe(false)
    })
  })
})

describe('useLanguageSwitch Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(global.fetch as any).mockImplementation((url: string) => {
      const language = url.includes('zh.json') ? 'zh' : 'en'
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockTranslations[language])
      })
    })
  })

  it('provides language switching functions', async () => {
    const { result } = renderHook(() => useLanguageSwitch(), {
      wrapper: createWrapper('zh')
    })

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100))
    })

    expect(typeof result.current.switchToZh).toBe('function')
    expect(typeof result.current.switchToEn).toBe('function')
    expect(typeof result.current.toggleLanguage).toBe('function')
    expect(result.current.isZh).toBe(true)
    expect(result.current.isEn).toBe(false)
  })

  it('switches to Chinese correctly', async () => {
    const { result } = renderHook(() => useLanguageSwitch(), {
      wrapper: createWrapper('en')
    })

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100))
    })

    await act(async () => {
      result.current.switchToZh()
    })

    expect(result.current.currentLanguage).toBe('zh')
    expect(result.current.isZh).toBe(true)
  })

  it('switches to English correctly', async () => {
    const { result } = renderHook(() => useLanguageSwitch(), {
      wrapper: createWrapper('zh')
    })

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100))
    })

    await act(async () => {
      result.current.switchToEn()
    })

    expect(result.current.currentLanguage).toBe('en')
    expect(result.current.isEn).toBe(true)
  })

  it('toggles language correctly', async () => {
    const { result } = renderHook(() => useLanguageSwitch(), {
      wrapper: createWrapper('zh')
    })

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100))
    })

    await act(async () => {
      result.current.toggleLanguage()
    })

    expect(result.current.currentLanguage).toBe('en')

    await act(async () => {
      result.current.toggleLanguage()
    })

    expect(result.current.currentLanguage).toBe('zh')
  })
})

describe('useTranslationKey Hook', () => {
  beforeEach(() => {
    ;(global.fetch as any).mockImplementation((url: string) => {
      const language = url.includes('zh.json') ? 'zh' : 'en'
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockTranslations[language])
      })
    })
  })

  it('returns translated value for key', async () => {
    const { result } = renderHook(() => useTranslationKey('common.loading'), {
      wrapper: createWrapper('zh')
    })

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100))
    })

    expect(result.current).toBe('加载中...')
  })

  it('handles parameters correctly', async () => {
    const { result } = renderHook(() => useTranslationKey('common.greeting', { name: '测试' }), {
      wrapper: createWrapper('zh')
    })

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100))
    })

    expect(result.current).toBe('你好，测试！')
  })
})

describe('useTranslationWithFallback Hook', () => {
  beforeEach(() => {
    ;(global.fetch as any).mockImplementation((url: string) => {
      const language = url.includes('zh.json') ? 'zh' : 'en'
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockTranslations[language])
      })
    })
  })

  it('returns translation when key exists', async () => {
    const { result } = renderHook(() => useTranslationWithFallback('common.loading', 'Loading...'), {
      wrapper: createWrapper('zh')
    })

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100))
    })

    expect(result.current).toBe('加载中...')
  })

  it('returns fallback when key does not exist', async () => {
    const { result } = renderHook(() => useTranslationWithFallback('nonexistent.key', 'Fallback Text'), {
      wrapper: createWrapper('zh')
    })

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100))
    })

    expect(result.current).toBe('Fallback Text')
  })
})

describe('Translation Utils', () => {
  describe('formatNumber', () => {
    it('formats numbers correctly for Chinese locale', () => {
      const result = translationUtils.formatNumber(1234.56, 'zh')
      expect(result).toBe('1,234.56')
    })

    it('formats numbers correctly for English locale', () => {
      const result = translationUtils.formatNumber(1234.56, 'en')
      expect(result).toBe('1,234.56')
    })
  })

  describe('formatDate', () => {
    it('formats dates correctly for Chinese locale', () => {
      const date = new Date('2024-01-15')
      const result = translationUtils.formatDate(date, 'zh')
      expect(result).toContain('2024')
      expect(result).toContain('1')
      expect(result).toContain('15')
    })

    it('formats dates correctly for English locale', () => {
      const date = new Date('2024-01-15')
      const result = translationUtils.formatDate(date, 'en')
      expect(result).toContain('2024')
      expect(result).toContain('Jan')
      expect(result).toContain('15')
    })
  })

  describe('formatRelativeTime', () => {
    it('formats relative time correctly', () => {
      const now = new Date()
      const pastDate = new Date(now.getTime() - 60000) // 1 minute ago
      
      const resultZh = translationUtils.formatRelativeTime(pastDate, 'zh')
      const resultEn = translationUtils.formatRelativeTime(pastDate, 'en')
      
      expect(resultZh).toContain('分钟')
      expect(resultEn).toContain('minute')
    })
  })
})