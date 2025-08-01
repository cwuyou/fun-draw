import { ExperienceTemplate, DrawingConfig, ListItem } from '@/types'
import { EXPERIENCE_TEMPLATES, createExperienceTemplates, recordTemplateUsage } from './experience-templates'

// 翻译函数类型定义
type TranslationFunction = (key: string, params?: Record<string, any>) => string

/**
 * 一键体验功能的状态管理和业务逻辑
 */

export interface ExperienceSession {
  templateId: string
  template: ExperienceTemplate
  config: DrawingConfig
  startTime: string
  isDemo: boolean
}

/**
 * 本地存储键名
 */
const STORAGE_KEYS = {
  CURRENT_EXPERIENCE: 'current-experience-session',
  EXPERIENCE_HISTORY: 'experience-history',
  USER_PREFERENCES: 'experience-user-preferences'
} as const

/**
 * 用户偏好设置
 */
export interface ExperienceUserPreferences {
  skipIntro: boolean
  preferredTemplates: string[]
  lastUsedTemplate?: string
  autoStartDemo: boolean
}

/**
 * 获取用户偏好设置
 */
export const getUserPreferences = (): ExperienceUserPreferences => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.USER_PREFERENCES)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    console.error('Failed to load user preferences:', error)
  }
  
  // 默认偏好设置
  return {
    skipIntro: false,
    preferredTemplates: [],
    autoStartDemo: false
  }
}

/**
 * 保存用户偏好设置
 */
export const saveUserPreferences = (preferences: Partial<ExperienceUserPreferences>): void => {
  try {
    const current = getUserPreferences()
    const updated = { ...current, ...preferences }
    localStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(updated))
  } catch (error) {
    console.error('Failed to save user preferences:', error)
  }
}

/**
 * 创建体验会话
 */
export const createExperienceSession = (templateId: string, t?: TranslationFunction): ExperienceSession | null => {
  try {
    const templates = t ? createExperienceTemplates(t) : EXPERIENCE_TEMPLATES
    const template = templates.find(tmpl => tmpl.id === templateId)
    if (!template) {
      console.error('Template not found:', templateId)
      return null
    }

    console.log('Creating experience session for template:', template.name)
    console.log('Template items:', template.items)
    console.log('Template config:', template.suggestedConfig)

    // 验证模板数据
    if (!template.items || !Array.isArray(template.items) || template.items.length === 0) {
      console.error('Invalid template items:', template.items)
      return null
    }

    // 创建抽奖配置
    const config: DrawingConfig = {
      mode: template.suggestedMode,
      quantity: template.suggestedConfig.quantity || 1,
      allowRepeat: template.suggestedConfig.allowRepeat || false,
      items: template.items
    }

    console.log('Created config:', config)

    // 创建可序列化的模板副本（去除icon）
    const serializableTemplate = {
      ...template,
      icon: null // 移除不可序列化的icon
    }

    const session: ExperienceSession = {
      templateId,
      template: serializableTemplate,
      config,
      startTime: new Date().toISOString(),
      isDemo: true
    }

    // 保存当前会话
    localStorage.setItem(STORAGE_KEYS.CURRENT_EXPERIENCE, JSON.stringify(session))
    
    // 记录模板使用
    recordTemplateUsage(templateId)
    
    // 更新用户偏好
    saveUserPreferences({ lastUsedTemplate: templateId })

    console.log('Experience session created successfully')
    return session
  } catch (error) {
    console.error('Failed to create experience session:', error)
    return null
  }
}

/**
 * 获取当前体验会话
 */
export const getCurrentExperienceSession = (): ExperienceSession | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.CURRENT_EXPERIENCE)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    console.error('Failed to load current experience session:', error)
  }
  return null
}

/**
 * 清除当前体验会话
 */
export const clearCurrentExperienceSession = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_EXPERIENCE)
  } catch (error) {
    console.error('Failed to clear current experience session:', error)
  }
}

/**
 * 完成体验会话
 */
export const completeExperienceSession = (sessionId: string, feedback?: {
  satisfaction: number
  wouldRecommend: boolean
  comments?: string
}): void => {
  try {
    const session = getCurrentExperienceSession()
    if (!session) return

    // 记录到历史
    const history = getExperienceHistory()
    const completedSession = {
      ...session,
      endTime: new Date().toISOString(),
      feedback
    }
    
    history.push(completedSession)
    
    // 只保留最近20次记录
    const recentHistory = history.slice(-20)
    localStorage.setItem(STORAGE_KEYS.EXPERIENCE_HISTORY, JSON.stringify(recentHistory))
    
    // 清除当前会话
    clearCurrentExperienceSession()
    
    // 如果用户满意度高，添加到偏好模板
    if (feedback && feedback.satisfaction >= 4) {
      const preferences = getUserPreferences()
      if (!preferences.preferredTemplates.includes(session.templateId)) {
        preferences.preferredTemplates.push(session.templateId)
        saveUserPreferences(preferences)
      }
    }
  } catch (error) {
    console.error('Failed to complete experience session:', error)
  }
}

/**
 * 获取体验历史
 */
export const getExperienceHistory = (): any[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.EXPERIENCE_HISTORY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    console.error('Failed to load experience history:', error)
  }
  return []
}

/**
 * 获取推荐模板
 * 基于用户历史使用情况和偏好推荐模板
 */
export const getRecommendedTemplates = (limit: number = 3, t?: TranslationFunction): ExperienceTemplate[] => {
  try {
    const preferences = getUserPreferences()
    const history = getExperienceHistory()
    
    // 计算模板得分
    const templateScores = new Map<string, number>()
    
    // 为新用户设置默认推荐优先级
    if (history.length === 0 && preferences.preferredTemplates.length === 0) {
      // 新用户默认推荐顺序：聚会游戏 > 课堂点名 > 奖品抽取 > 团队分组
      const defaultPriority = {
        'party-game': 10,
        'classroom-naming': 9,
        'prize-drawing': 8,
        'team-grouping': 7,
        'department-lottery': 6,
        'annual-meeting': 5
      }
      
      Object.entries(defaultPriority).forEach(([templateId, score]) => {
        templateScores.set(templateId, score)
      })
    }
    
    // 基于偏好模板
    preferences.preferredTemplates.forEach(templateId => {
      templateScores.set(templateId, (templateScores.get(templateId) || 0) + 3)
    })
    
    // 基于历史使用
    history.forEach((session: any) => {
      const score = session.feedback?.satisfaction || 3
      templateScores.set(session.templateId, (templateScores.get(session.templateId) || 0) + score * 0.5)
    })
    
    // 获取模板列表（使用翻译函数或默认模板）
    const templates = t ? createExperienceTemplates(t) : EXPERIENCE_TEMPLATES
    
    // 获取得分最高的模板
    const sortedTemplates = templates
      .map(template => ({
        template,
        score: templateScores.get(template.id) || 0
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.template)
    
    // 如果没有足够的推荐，用默认模板补充
    if (sortedTemplates.length < limit) {
      const defaultTemplates = templates
        .filter(t => !sortedTemplates.find(st => st.id === t.id))
        .slice(0, limit - sortedTemplates.length)
      
      sortedTemplates.push(...defaultTemplates)
    }
    
    return sortedTemplates
  } catch (error) {
    console.error('Failed to get recommended templates:', error)
    const templates = t ? createExperienceTemplates(t) : EXPERIENCE_TEMPLATES
    return templates.slice(0, limit)
  }
}

/**
 * 检查是否为首次使用
 */
export const isFirstTimeUser = (): boolean => {
  try {
    const history = getExperienceHistory()
    const preferences = getUserPreferences()
    return history.length === 0 && !preferences.lastUsedTemplate
  } catch (error) {
    console.error('Failed to check first time user:', error)
    return true
  }
}

/**
 * 获取使用统计
 */
export const getUsageStats = () => {
  try {
    const history = getExperienceHistory()
    const templateUsage = new Map<string, number>()
    const modeUsage = new Map<string, number>()
    
    history.forEach((session: any) => {
      // 统计模板使用
      templateUsage.set(
        session.templateId, 
        (templateUsage.get(session.templateId) || 0) + 1
      )
      
      // 统计模式使用
      modeUsage.set(
        session.config.mode, 
        (modeUsage.get(session.config.mode) || 0) + 1
      )
    })
    
    return {
      totalSessions: history.length,
      templateUsage: Object.fromEntries(templateUsage),
      modeUsage: Object.fromEntries(modeUsage),
      averageSatisfaction: history.reduce((sum, session) => 
        sum + (session.feedback?.satisfaction || 3), 0) / Math.max(history.length, 1)
    }
  } catch (error) {
    console.error('Failed to get usage stats:', error)
    return {
      totalSessions: 0,
      templateUsage: {},
      modeUsage: {},
      averageSatisfaction: 0
    }
  }
}

/**
 * 导出体验数据（用于分析）
 */
export const exportExperienceData = () => {
  try {
    return {
      preferences: getUserPreferences(),
      history: getExperienceHistory(),
      stats: getUsageStats(),
      templates: EXPERIENCE_TEMPLATES.map(t => ({
        id: t.id,
        name: t.name,
        scenario: t.scenario,
        tags: t.tags
      }))
    }
  } catch (error) {
    console.error('Failed to export experience data:', error)
    return null
  }
}

/**
 * 重置体验数据
 */
export const resetExperienceData = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_EXPERIENCE)
    localStorage.removeItem(STORAGE_KEYS.EXPERIENCE_HISTORY)
    localStorage.removeItem(STORAGE_KEYS.USER_PREFERENCES)
  } catch (error) {
    console.error('Failed to reset experience data:', error)
  }
}