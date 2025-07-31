"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { 
  LanguageCode, 
  LanguageContextType, 
  LanguageProviderProps, 
  TranslationFile, 
  TranslationParams,
  TranslationError,
  LanguagePreference,
  LANGUAGE_STORAGE_KEYS
} from '@/types'

/**
 * 语言上下文
 * 提供全局的语言状态管理和翻译功能
 */
const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

/**
 * 翻译缓存
 * 内存中缓存已加载的翻译文件
 */
const translationCache = new Map<LanguageCode, TranslationFile>()

/**
 * 默认翻译内容（英文）
 * 用作降级方案
 */
const defaultTranslations: Partial<TranslationFile> = {
  common: {
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    cancel: 'Cancel',
    confirm: 'Confirm',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    create: 'Create',
    back: 'Back',
    next: 'Next',
    previous: 'Previous',
    close: 'Close',
    retry: 'Retry',
    refresh: 'Refresh',
    language: 'Language',
    switchLanguage: 'Switch Language',
    current: 'Current',
    languageHelp: 'Language preference is saved automatically',
    locale: 'en'
  },
  navigation: {
    home: 'Home',
    createList: 'Create List',
    listLibrary: 'List Library',
    features: 'Features',
    modes: 'Drawing Modes',
    useCases: 'Use Cases',
    drawConfig: 'Draw Config'
  },
  home: {
    title: 'Make Drawing More Fun',
    subtitle: 'Say goodbye to boring wheel drawings! Fun Draw offers 5 innovative drawing animation modes',
    description: 'Whether it\'s classroom teaching, corporate annual meetings, or friend gatherings, you can find the most suitable drawing method.',
    startButton: 'Start Drawing Now',
    newExperienceBadge: '🎉 Brand New Multi-Mode Drawing Experience',
    newUserTip: '💡 New user? Click "Quick Experience" to instantly feel the charm of Fun Draw, no need to create lists!',
    newUserTipBold: 'New user?',
    hero: {
      title: 'Make Drawing More Fun',
      subtitle: 'Say goodbye to boring wheel drawings! Fun Draw offers 5 innovative drawing animation modes,',
      description: 'Whether it\'s classroom teaching, corporate annual meetings, or friend gatherings, you can find the most suitable drawing method.'
    },
    features: {
      title: 'Why Choose Fun Draw?',
      subtitle: 'We\'ve redefined the online drawing experience, making every draw full of anticipation and fun',
      items: {
        modes: {
          title: 'Multiple Drawing Modes',
          description: '5 innovative animation effects, say goodbye to boring wheels'
        },
        management: {
          title: 'Convenient List Management',
          description: 'Support manual input, batch import, local storage'
        },
        rules: {
          title: 'Flexible Drawing Rules',
          description: 'Customize draw quantity, allow/disallow repeat winners'
        },
        sharing: {
          title: 'Result Sharing & Saving',
          description: 'One-click copy, export files, continuous drawing'
        }
      }
    },
    quickExperienceSection: {
      title: 'Experience Fun Draw Now',
      subtitle: 'No need to create lists, choose a scenario and start experiencing our innovative drawing modes immediately',
      advantages: {
        quick: {
          title: '30-Second Quick Experience',
          description: 'Pre-set sample data, no preparation needed'
        },
        templates: {
          title: 'Multiple Scenario Templates',
          description: 'Professional templates for classroom, corporate, party and other scenarios'
        },
        complete: {
          title: 'Complete Feature Display',
          description: 'Experience the complete functionality and animation effects of all drawing modes'
        }
      }
    },
    modes: {
      title: 'Five Innovative Drawing Modes',
      subtitle: 'Each mode has unique animation effects and sound effects, providing the best drawing experience for different scenarios'
    },
    useCases: {
      title: 'Use Cases',
      subtitle: 'From education to enterprise, from entertainment to decision-making, Fun Draw can meet various drawing needs',
      items: {
        classroom: {
          title: 'Classroom Teaching',
          description: 'Random name calling, grouping, questioning, make classroom more interesting'
        },
        corporate: {
          title: 'Corporate Events',
          description: 'Annual meeting lottery, team building activities, live interaction'
        },
        party: {
          title: 'Friend Gatherings',
          description: 'Decision making, game selection, party entertainment'
        }
      }
    },
    cta: {
      title: 'Ready to Start Your Fun Drawing Journey?',
      subtitle: 'No registration required, no download needed, just open your browser to use. Supports PC, tablet, and mobile platforms.',
      startButton: 'Start Using for Free',
      learnMoreButton: 'Learn More Features'
    },
    footer: {
      copyright: '© 2025 Fun Draw - Make Drawing More Fun | Multi-Mode Fun Drawing Website'
    }
  },
  drawingModes: {
    slotMachine: {
      title: 'Slot Machine',
      shortTitle: 'Slot Machine',
      description: 'Classic reel animation with thrilling drawing experience'
    },
    cardFlip: {
      title: 'Card Drawing',
      shortTitle: 'Card Drawing',
      description: 'Elegant card flip animation like a magician\'s performance'
    },
    bulletScreen: {
      title: 'Bullet Screen Scrolling',
      shortTitle: 'Bullet Screen',
      description: 'Fast scrolling freeze, dynamic selection process'
    },
    gridLottery: {
      title: 'Multi-Grid Lottery',
      shortTitle: 'Grid Lottery',
      description: 'TV show style, light jumping freeze, full of ceremony'
    },
    blinkingNamePicker: {
      title: 'Blinking Name Calling',
      shortTitle: 'Blinking Name Picker',
      description: 'Fast blinking freeze, fair random name calling experience'
    }
  },
  quickExperience: {
    title: 'Quick Experience',
    description: 'Choose a scenario and experience the charm of Fun Draw in 30 seconds',
    oneClickExperience: 'One-Click Experience',
    starting: 'Starting...',
    selectScene: 'Select Experience Scenario',
    welcomeFirstTime: 'Welcome to Fun Draw! Choose a scenario to quickly experience our drawing features',
    welcomeReturning: 'Choose a scenario to start the experience, each scenario has different drawing styles',
    quickStart: 'Quick Start',
    quickStartDescription: 'Use recommended scenario to start experience immediately, no selection needed',
    startNow: 'Start Now',
    recommended: 'Recommended',
    forYouRecommended: 'Recommended for You',
    allScenes: 'All Scenarios',
    viewMoreScenes: 'View More Scenarios',
    exampleCount: '{{count}} examples',
    experienceTime: 'About 30 seconds experience',
    examplePreview: 'Examples: {{preview}}',
    experienceStart: 'Experience Started!',
    experienceStartDescription: 'Preparing "{{name}}" experience for you...',
    startFailed: 'Start Failed',
    startFailedDescription: 'Unable to start experience mode, please try again later'
  }
}

/**
 * 加载翻译文件
 */
const loadTranslation = async (language: LanguageCode): Promise<TranslationFile> => {
  // 检查缓存
  if (translationCache.has(language)) {
    return translationCache.get(language)!
  }

  try {
    const response = await fetch(`/locales/${language}.json`)
    if (!response.ok) {
      throw new Error(`Failed to load translation for ${language}`)
    }
    
    const translation: TranslationFile = await response.json()
    
    // 缓存翻译内容
    translationCache.set(language, translation)
    
    return translation
  } catch (error) {
    console.error(`Failed to load translation for ${language}:`, error)
    
    // 如果是中文加载失败，使用默认翻译
    if (language === 'zh') {
      return defaultTranslations as TranslationFile
    }
    
    // 如果是英文加载失败，直接使用默认翻译，不尝试加载中文
    console.error('English translation failed, using default translations')
    return defaultTranslations as TranslationFile
  }
}

/**
 * 获取嵌套对象的值
 */
const getNestedValue = (obj: any, path: string): string | undefined => {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : undefined
  }, obj)
}

/**
 * 替换翻译文本中的参数
 */
const interpolateParams = (text: string, params?: TranslationParams): string => {
  if (!params) return text
  
  return Object.entries(params).reduce((result, [key, value]) => {
    const placeholder = `{{${key}}}`
    return result.replace(new RegExp(placeholder, 'g'), String(value))
  }, text)
}

/**
 * 获取用户语言偏好
 */
const getUserLanguagePreference = (): LanguageCode => {
  try {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEYS.LANGUAGE_PREFERENCE)
    if (stored) {
      const preference: LanguagePreference = JSON.parse(stored)
      return preference.language
    }
  } catch (error) {
    console.error('Failed to load language preference:', error)
  }
  
  // 暂时默认使用英文，避免中文翻译文件编码问题
  return 'en'
}

/**
 * 保存用户语言偏好
 */
const saveUserLanguagePreference = (language: LanguageCode): void => {
  try {
    const preference: LanguagePreference = {
      language,
      timestamp: Date.now(),
      version: '1.0.0'
    }
    localStorage.setItem(LANGUAGE_STORAGE_KEYS.LANGUAGE_PREFERENCE, JSON.stringify(preference))
  } catch (error) {
    console.error('Failed to save language preference:', error)
  }
}

/**
 * 语言提供者组件
 */
export function LanguageProvider({ 
  children, 
  defaultLanguage = 'en' 
}: LanguageProviderProps) {
  const [currentLanguage, setCurrentLanguage] = useState<LanguageCode>(defaultLanguage)
  const [translations, setTranslations] = useState<TranslationFile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  /**
   * 翻译函数
   */
  const t = useCallback((key: string, params?: TranslationParams): string => {
    if (!translations) {
      // 如果翻译未加载，返回键名作为降级
      return key
    }

    const value = getNestedValue(translations, key)
    
    if (value === undefined) {
      console.warn(`Translation key not found: ${key}`)
      return key
    }

    if (typeof value !== 'string') {
      console.warn(`Translation value is not a string: ${key}`)
      return key
    }

    return interpolateParams(value, params)
  }, [translations])

  /**
   * 切换语言
   */
  const setLanguage = useCallback(async (language: LanguageCode) => {
    if (language === currentLanguage) return

    setIsLoading(true)
    setError(null)

    try {
      const newTranslations = await loadTranslation(language)
      setTranslations(newTranslations)
      setCurrentLanguage(language)
      saveUserLanguagePreference(language)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      console.error('Failed to switch language:', err)
    } finally {
      setIsLoading(false)
    }
  }, [currentLanguage])

  /**
   * 初始化语言设置
   */
  useEffect(() => {
    const initializeLanguage = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // 获取用户偏好语言
        const preferredLanguage = getUserLanguagePreference()
        
        // 加载翻译文件
        const initialTranslations = await loadTranslation(preferredLanguage)
        
        setTranslations(initialTranslations)
        setCurrentLanguage(preferredLanguage)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to initialize language'
        setError(errorMessage)
        console.error('Failed to initialize language:', err)
        
        // 使用默认翻译作为降级
        setTranslations(defaultTranslations as TranslationFile)
        setCurrentLanguage('en')
      } finally {
        setIsLoading(false)
      }
    }

    initializeLanguage()
  }, [])

  const contextValue: LanguageContextType = {
    currentLanguage,
    setLanguage,
    t,
    isLoading,
    error
  }

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  )
}

/**
 * 使用语言上下文的Hook
 */
export function useLanguageContext(): LanguageContextType {
  const context = useContext(LanguageContext)
  
  if (context === undefined) {
    throw new Error('useLanguageContext must be used within a LanguageProvider')
  }
  
  return context
}

/**
 * 预加载翻译文件
 * 用于提前加载其他语言的翻译文件
 */
export const preloadTranslation = async (language: LanguageCode): Promise<void> => {
  try {
    await loadTranslation(language)
  } catch (error) {
    console.warn(`Failed to preload translation for ${language}:`, error)
  }
}

/**
 * 清除翻译缓存
 * 用于开发环境或需要强制重新加载翻译时
 */
export const clearTranslationCache = (): void => {
  translationCache.clear()
}

/**
 * 获取已缓存的语言列表
 */
export const getCachedLanguages = (): LanguageCode[] => {
  return Array.from(translationCache.keys())
}