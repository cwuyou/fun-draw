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
import { TranslationChecker } from '@/lib/translation-validator'

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
    title: 'Pick One with Style',
    subtitle: 'Interactive random picker with 5 innovative selection modes! Perfect for decisions, games, and activities.',
    description: 'Whether it\'s classroom activities, team decisions, or fun gatherings, Pick One makes random selection engaging and exciting.',
    startButton: 'Pick One Now',
    newExperienceBadge: '🎉 Brand New Multi-Mode Random Picker',
    newUserTip: '💡 New user? Click "Quick Experience" to instantly try Pick One, no setup needed!',
    newUserTipBold: 'New user?',
    hero: {
      title: 'Pick One with Style',
      subtitle: 'Interactive random picker with 5 innovative selection modes! Perfect for decisions, games, and activities.',
      description: 'Whether it\'s classroom activities, team decisions, or fun gatherings, Pick One makes random selection engaging and exciting.'
    },
    features: {
      title: 'Why Choose Pick One?',
      subtitle: 'We\'ve redefined the random selection experience, making every pick full of anticipation and fun',
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
      title: 'Experience Pick One Now',
      subtitle: 'No need to create lists, choose a scenario and start experiencing our innovative selection modes immediately',
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
      subtitle: 'From education to enterprise, from entertainment to decision-making, Pick One can meet various selection needs',
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
      title: 'Ready to Pick One?',
      subtitle: 'No registration required, no download needed, just open your browser and start picking. Supports PC, tablet, and mobile platforms.',
      startButton: 'Start Picking for Free',
      learnMoreButton: 'Learn More Features'
    },
    footer: {
      copyright: '© 2025 PickOne - Interactive Random Picker | Make Every Choice Fun'
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
    description: 'Choose a scenario and experience the charm of Pick One in 30 seconds',
    oneClickExperience: 'One-Click Experience',
    starting: 'Starting...',
    selectScene: 'Select Experience Scenario',
    welcomeFirstTime: 'Welcome to Pick One! Choose a scenario to quickly experience our selection features',
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
,
  blinkingNamePicker: {
    title: 'Blinking Name Picker',
    loading: 'Loading...',
    backToConfig: 'Back to Config',
    backToHome: 'Back to Home',
    backToConfigPage: 'Back to Config Page',
    participants: '{{count}} participants',
    drawCount: 'Draw {{count}} items',
    allowRepeat: 'Allow repeat',
    noRepeat: 'No repeat',
    restartTooltip: 'Restart game',
    restart: 'Restart',
    startBlinking: 'Start Blinking',
    startBlinkingTooltip: 'Start blinking name picker draw',
    pause: 'Pause',
    pauseBlinkingTooltip: 'Pause blinking, can resume to continue',
    resumeBlinking: 'Resume Blinking',
    resumeBlinkingTooltip: 'Resume blinking draw',
    continueNextRound: 'Continue Next Round',
    continueNextRoundTooltip: 'Continue drawing remaining {{count}} names',
    turnOffSound: 'Turn off sound',
    turnOnSound: 'Turn on sound',
    settings: 'Settings',
    blinkingSettings: 'Blinking Settings',
    initialSpeed: 'Initial Speed ({{speed}}ms)'
,
      welcomeExperience: 'Welcome to experience "{{name}}"',
      welcomeExperienceDescription: 'This is demo data, you can start drawing experience directly',
      progressLabel: 'Progress:',
      remainingCount: '(Remaining {{count}})',
      speedLabel: 'Speed:',
      finalSpeed: 'Final Speed ({{speed}}ms)',
      accelerationDuration: 'Deceleration Duration ({{seconds}}s)',
      glowIntensity: 'Glow Intensity ({{percent}}%)',
      colorTheme: 'Blinking Color Theme',
      theme: {
        classic: 'Classic',
        rainbow: 'Rainbow',
        cool: 'Cool',
        warm: 'Warm'
      }

  },
  bulletScreen: {
    title: 'Bullet Screen Scrolling',
    shortTitle: 'Bullet Screen',
    description: 'Fast scrolling freeze, dynamic selection process',
    back: 'Back',
    backToHome: 'Back to Home',
    configLost: 'Configuration Lost',
    reconfigureRequired: 'Please reconfigure drawing parameters',
    modeError: 'Mode Error',
    bulletScreenOnly: 'This page only supports bullet screen mode',
    loadFailed: 'Load Failed',
    configLoadError: 'Unable to load drawing configuration',
    itemCount: '{{count}} names',
    drawQuantity: 'Draw {{quantity}} items',
    readyToStart: 'Ready to Start',
    scrolling: 'Bullet Screen Scrolling...',
    aboutToStop: 'About to Stop...',
    drawComplete: 'Draw Complete!',
    scrollingInProgress: 'Bullet screen scrolling in progress, please wait...',
    startDraw: 'Start Draw',
    scrollingStatus: 'Scrolling...',
    resultWillShow: 'Results will be displayed soon...',
    modeDisplayName: 'Bullet Screen'
  },
  gridLottery: {
    title: 'Multi-Grid Lottery',
    description: 'Single draw mode - Light jumping to select one winner',
    back: 'Back',
    backToHome: 'Back to Home',
    singleDraw: 'Single Draw',
    itemCount: '{{count}} names',
    gridSize: '{{size}} grid',
    readyToStart: 'Ready to Start',
    countdown: 'Countdown {{count}}',
    lightJumping: 'Light Jumping...',
    drawComplete: 'Draw Complete!',
    lightJumpingDescription: 'Light is jumping rapidly, about to freeze...',
    startDraw: 'Start Draw',
    countdownInProgress: 'Countdown in progress...',
    drawingInProgress: 'Drawing in progress...',
    winner: 'Winner: {{name}}',
    modeDisplayName: 'Multi-Grid Lottery (Single Draw)',
    loadFailed: 'Load Failed',
    configLoadError: 'Unable to load drawing configuration',
    configError: 'Configuration Error',
    configReminder: 'Configuration Reminder'
  },
  drawingComponents: {
    blinkingNamePicker: {
      controlPanel: {
        idle: { text: 'Ready to Start', description: 'Click "Start Blinking" to begin drawing' },
        blinking: { text: 'Blinking Selection in Progress...', description: 'Fast blinking in progress, click "Stop" to select immediately' },
        slowing: { text: 'About to Stop...', description: 'Blinking speed is slowing down, result will be selected soon' },
        paused: { text: 'Paused', description: 'Blinking is paused, click "Resume Blinking" or press spacebar to continue' },
        stopped: { text: 'Selection Complete', description: 'One name has been selected, click "Continue" for next round or "Restart"' },
        finished: { text: 'All Complete', description: 'All rounds completed, you can view results or restart' }
      }
    }
  }
}

/**
 * 加载翻译文件
 */
const TRANSLATION_VERSION = (typeof process !== 'undefined' && process.env && (process.env.NEXT_PUBLIC_TRANSLATION_VERSION || process.env.NEXT_PUBLIC_BUILD_ID)) || 'v1'
const loadTranslation = async (language: LanguageCode): Promise<TranslationFile> => {
  // 检查缓存
  if (translationCache.has(language)) {
    return translationCache.get(language)!
  }

  try {
    // 通过版本号参数 + no-store 禁用缓存，避免老缓存导致英文回退
    const url = `/locales/${language}.json?v=${encodeURIComponent(String(TRANSLATION_VERSION))}`
    const response = await fetch(url, { cache: 'no-store' })
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
      console.warn('Chinese translation failed, using default translations as fallback')
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

  // 默认使用中文，除非用户在语言切换器中明确选择了英文
  return 'zh'
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
    // 优先使用已加载的翻译
    if (translations) {
      const value = getNestedValue(translations, key)

      if (value === undefined) {
        // 记录缺失的翻译键
        if (process.env.NODE_ENV === 'development') {
          TranslationChecker.getInstance().recordKeyUsage(key, false)
          console.warn(`Translation key not found: ${key}`)
        }

        // 尝试从默认翻译中获取
        const defaultValue = getNestedValue(defaultTranslations, key)
        if (defaultValue && typeof defaultValue === 'string') {
          return interpolateParams(defaultValue, params)
        }

        // 最终降级：返回键名
        return key
      }

      // 记录成功找到的翻译键
      if (process.env.NODE_ENV === 'development') {
        TranslationChecker.getInstance().recordKeyUsage(key, true)
      }

      if (typeof value !== 'string') {
        if (process.env.NODE_ENV === 'development') {
          console.warn(`Translation value is not a string: ${key}`, value)
        }
        return key
      }

      try {
        return interpolateParams(value, params)
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error(`Error interpolating params for key ${key}:`, error)
        }
        return value // 返回未插值的原始值
      }
    }

    // 翻译尚未加载时，优先使用默认英文翻译，避免页面显示键名
    const defaultValue = getNestedValue(defaultTranslations, key)
    if (defaultValue && typeof defaultValue === 'string') {
      return interpolateParams(defaultValue, params)
    }

    if (process.env.NODE_ENV === 'development') {
      console.warn(`Translation not loaded yet for key: ${key}`)
    }
    return key
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

/**
 * 验证翻译键是否存在（开发环境工具）
 */
export const validateTranslationKey = (key: string, language?: LanguageCode): boolean => {
  if (process.env.NODE_ENV !== 'development') {
    return true
  }

  const targetLanguage = language || 'zh'
  const translations = translationCache.get(targetLanguage)

  if (!translations) {
    console.warn(`Translation cache not found for language: ${targetLanguage}`)
    return false
  }

  const value = getNestedValue(translations, key)
  const exists = value !== undefined && typeof value === 'string'

  if (!exists) {
    console.warn(`Translation key validation failed: ${key} (${targetLanguage})`)
  }

  return exists
}

/**
 * 批量验证翻译键（开发环境工具）
 */
export const validateTranslationKeys = (keys: string[], languages: LanguageCode[] = ['zh', 'en']): void => {
  if (process.env.NODE_ENV !== 'development') {
    return
  }

  console.group('Translation Key Validation')

  let totalMissing = 0

  languages.forEach(language => {
    const missing = keys.filter(key => !validateTranslationKey(key, language))
    if (missing.length > 0) {
      console.warn(`Missing keys in ${language}:`, missing)
      totalMissing += missing.length
    }
  })

  if (totalMissing === 0) {
    console.log('✅ All translation keys are valid')
  } else {
    console.warn(`⚠️ Found ${totalMissing} missing translation keys`)
  }

  console.groupEnd()
}