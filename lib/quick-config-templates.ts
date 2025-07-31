import { ConfigurationTemplate } from '@/types'
import { GraduationCap, Building, Users, Gift, Hash, Sparkles, Dices, CreditCard, MessageSquare } from 'lucide-react'

// 翻译函数类型定义
type TranslationFunction = (key: string, params?: Record<string, any>) => string

/**
 * 快速配置模板数据
 * 为用户提供常用的抽奖配置预设
 */

/**
 * 生成国际化的快速配置模板列表
 */
export const createQuickConfigTemplates = (t: TranslationFunction): ConfigurationTemplate[] => [
  {
    id: 'classroom-naming',
    name: t('quickConfigTemplates.classroomNaming.name'),
    description: t('quickConfigTemplates.classroomNaming.description'),
    icon: GraduationCap,
    mode: 'blinking-name-picker',
    quantity: 1,
    allowRepeat: false,
    scenario: 'education',
    tags: [
      t('quickConfigTemplates.classroomNaming.tags.0'),
      t('quickConfigTemplates.classroomNaming.tags.1'),
      t('quickConfigTemplates.classroomNaming.tags.2'),
      t('quickConfigTemplates.classroomNaming.tags.3')
    ],
    color: 'bg-blue-500'
  },
  {
    id: 'annual-lottery',
    name: t('quickConfigTemplates.annualLottery.name'),
    description: t('quickConfigTemplates.annualLottery.description'),
    icon: Hash,
    mode: 'grid-lottery',
    quantity: 1,
    allowRepeat: false,
    scenario: 'corporate',
    tags: [
      t('quickConfigTemplates.annualLottery.tags.0'),
      t('quickConfigTemplates.annualLottery.tags.1'),
      t('quickConfigTemplates.annualLottery.tags.2'),
      t('quickConfigTemplates.annualLottery.tags.3')
    ],
    color: 'bg-yellow-500'
  },
  {
    id: 'team-grouping',
    name: t('quickConfigTemplates.teamGrouping.name'),
    description: t('quickConfigTemplates.teamGrouping.description'),
    icon: Users,
    mode: 'bullet-screen',
    quantity: 'auto', // 根据总人数自动计算
    allowRepeat: false,
    scenario: 'teamwork',
    tags: [
      t('quickConfigTemplates.teamGrouping.tags.0'),
      t('quickConfigTemplates.teamGrouping.tags.1'),
      t('quickConfigTemplates.teamGrouping.tags.2'),
      t('quickConfigTemplates.teamGrouping.tags.3')
    ],
    color: 'bg-green-500'
  },
  {
    id: 'prize-multiple',
    name: t('quickConfigTemplates.prizeMultiple.name'),
    description: t('quickConfigTemplates.prizeMultiple.description'),
    icon: Gift,
    mode: 'card-flip',
    quantity: 3,
    allowRepeat: false,
    scenario: 'prize',
    tags: [
      t('quickConfigTemplates.prizeMultiple.tags.0'),
      t('quickConfigTemplates.prizeMultiple.tags.1'),
      t('quickConfigTemplates.prizeMultiple.tags.2'),
      t('quickConfigTemplates.prizeMultiple.tags.3')
    ],
    color: 'bg-purple-500'
  },
  {
    id: 'lucky-draw',
    name: t('quickConfigTemplates.luckyDraw.name'),
    description: t('quickConfigTemplates.luckyDraw.description'),
    icon: Dices,
    mode: 'slot-machine',
    quantity: 1,
    allowRepeat: false,
    scenario: 'entertainment',
    tags: [
      t('quickConfigTemplates.luckyDraw.tags.0'),
      t('quickConfigTemplates.luckyDraw.tags.1'),
      t('quickConfigTemplates.luckyDraw.tags.2'),
      t('quickConfigTemplates.luckyDraw.tags.3')
    ],
    color: 'bg-red-500'
  },
  {
    id: 'game-selection',
    name: t('quickConfigTemplates.gameSelection.name'),
    description: t('quickConfigTemplates.gameSelection.description'),
    icon: Sparkles,
    mode: 'blinking-name-picker',
    quantity: 1,
    allowRepeat: true,
    scenario: 'decision',
    tags: [
      t('quickConfigTemplates.gameSelection.tags.0'),
      t('quickConfigTemplates.gameSelection.tags.1'),
      t('quickConfigTemplates.gameSelection.tags.2'),
      t('quickConfigTemplates.gameSelection.tags.3')
    ],
    color: 'bg-pink-500'
  },
  {
    id: 'presentation-order',
    name: t('quickConfigTemplates.presentationOrder.name'),
    description: t('quickConfigTemplates.presentationOrder.description'),
    icon: MessageSquare,
    mode: 'bullet-screen',
    quantity: 'auto',
    allowRepeat: false,
    scenario: 'presentation',
    tags: [
      t('quickConfigTemplates.presentationOrder.tags.0'),
      t('quickConfigTemplates.presentationOrder.tags.1'),
      t('quickConfigTemplates.presentationOrder.tags.2'),
      t('quickConfigTemplates.presentationOrder.tags.3')
    ],
    color: 'bg-indigo-500'
  },
  {
    id: 'mystery-gift',
    name: t('quickConfigTemplates.mysteryGift.name'),
    description: t('quickConfigTemplates.mysteryGift.description'),
    icon: CreditCard,
    mode: 'card-flip',
    quantity: 1,
    allowRepeat: false,
    scenario: 'mystery',
    tags: [
      t('quickConfigTemplates.mysteryGift.tags.0'),
      t('quickConfigTemplates.mysteryGift.tags.1'),
      t('quickConfigTemplates.mysteryGift.tags.2'),
      t('quickConfigTemplates.mysteryGift.tags.3')
    ],
    color: 'bg-teal-500'
  }
]

/**
 * 根据场景获取推荐配置
 */
export const getConfigsByScenario = (scenario: string, t: TranslationFunction): ConfigurationTemplate[] => {
  const templates = createQuickConfigTemplates(t)
  return templates.filter(config => config.scenario === scenario)
}

/**
 * 根据人数推荐配置
 */
export const getConfigsByItemCount = (itemCount: number, t: TranslationFunction): ConfigurationTemplate[] => {
  const templates = createQuickConfigTemplates(t)
  
  if (itemCount <= 5) {
    // 少量人数，推荐单选或小批量
    return templates.filter(config => 
      config.quantity === 1 || config.quantity === 'auto'
    )
  } else if (itemCount <= 15) {
    // 中等人数，推荐多种配置
    return templates.filter(config => 
      typeof config.quantity === 'number' ? config.quantity <= 5 : true
    )
  } else {
    // 大量人数，推荐所有配置
    return templates
  }
}

/**
 * 根据抽奖模式获取配置
 */
export const getConfigsByMode = (mode: string, t: TranslationFunction): ConfigurationTemplate[] => {
  const templates = createQuickConfigTemplates(t)
  return templates.filter(config => config.mode === mode)
}

/**
 * 智能推荐配置
 * 根据名单数量和历史使用情况推荐最适合的配置
 */
export const getSmartRecommendations = (
  itemCount: number, 
  t: TranslationFunction,
  limit: number = 4
): ConfigurationTemplate[] => {
  try {
    // 获取使用统计
    const usage = JSON.parse(localStorage.getItem('quick-config-usage') || '{}')
    
    // 根据人数过滤配置
    const suitableConfigs = getConfigsByItemCount(itemCount, t)
    
    // 按使用频率和适用性排序
    const scoredConfigs = suitableConfigs.map(config => {
      let score = 0
      
      // 使用频率得分
      const usageCount = usage[config.id]?.count || 0
      score += usageCount * 0.3
      
      // 人数适配得分
      if (config.quantity === 1 && itemCount > 10) score += 0.2
      if (config.quantity === 'auto') score += 0.3
      if (typeof config.quantity === 'number' && config.quantity > 1) {
        const ratio = config.quantity / itemCount
        if (ratio >= 0.1 && ratio <= 0.5) score += 0.4
      }
      
      // 场景多样性得分
      const commonScenarios = ['education', 'corporate', 'entertainment']
      if (commonScenarios.includes(config.scenario)) score += 0.1
      
      return { ...config, score }
    })
    
    // 排序并返回前N个
    return scoredConfigs
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
  } catch (error) {
    console.error('Failed to get smart recommendations:', error)
    const templates = createQuickConfigTemplates(t)
    return templates.slice(0, limit)
  }
}

/**
 * 记录配置使用
 */
export const recordConfigUsage = (configId: string): void => {
  try {
    const usage = JSON.parse(localStorage.getItem('quick-config-usage') || '{}')
    usage[configId] = {
      count: (usage[configId]?.count || 0) + 1,
      lastUsed: new Date().toISOString()
    }
    localStorage.setItem('quick-config-usage', JSON.stringify(usage))
  } catch (error) {
    console.error('Failed to record config usage:', error)
  }
}

/**
 * 获取最常用的配置
 */
export const getMostUsedConfigs = (t: TranslationFunction, limit: number = 3): ConfigurationTemplate[] => {
  try {
    const templates = createQuickConfigTemplates(t)
    const usage = JSON.parse(localStorage.getItem('quick-config-usage') || '{}')
    const sortedConfigs = templates
      .map(config => ({
        ...config,
        usageCount: usage[config.id]?.count || 0
      }))
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, limit)
    
    return sortedConfigs
  } catch (error) {
    console.error('Failed to get most used configs:', error)
    const templates = createQuickConfigTemplates(t)
    return templates.slice(0, limit)
  }
}

/**
 * 根据配置ID获取配置
 */
export const getConfigById = (id: string, t: TranslationFunction): ConfigurationTemplate | undefined => {
  const templates = createQuickConfigTemplates(t)
  return templates.find(config => config.id === id)
}

/**
 * 计算自动数量
 * 根据总人数智能计算合适的抽取数量
 */
export const calculateAutoQuantity = (totalItems: number, scenario: string = 'general'): number => {
  if (totalItems <= 0) return 1
  
  switch (scenario) {
    case 'teamwork':
      // 团队分组：通常分成3-5个组
      return Math.max(1, Math.min(5, Math.ceil(totalItems / 4)))
    
    case 'presentation':
      // 演讲顺序：通常选择前几名
      return Math.max(1, Math.min(3, Math.ceil(totalItems * 0.2)))
    
    case 'prize':
      // 奖品抽取：根据总数的10-30%
      return Math.max(1, Math.min(10, Math.ceil(totalItems * 0.2)))
    
    default:
      // 通用场景：根据总数合理分配
      if (totalItems <= 5) return 1
      if (totalItems <= 10) return 2
      if (totalItems <= 20) return 3
      return Math.max(1, Math.min(5, Math.ceil(totalItems * 0.15)))
  }
}

/**
 * 临时的静态配置模板导出（用于向后兼容）
 * 使用默认的中文翻译
 */
const defaultTranslation = (key: string, params?: Record<string, any>) => {
  // 简单的默认翻译映射
  const translations: Record<string, string> = {
    'quickConfigTemplates.classroomNaming.name': '课堂点名',
    'quickConfigTemplates.classroomNaming.description': '随机选择学生回答问题',
    'quickConfigTemplates.annualLottery.name': '年会抽奖',
    'quickConfigTemplates.annualLottery.description': '年会现场抽奖活动',
    'quickConfigTemplates.teamGrouping.name': '团队分组',
    'quickConfigTemplates.teamGrouping.description': '随机分配团队成员',
    'quickConfigTemplates.prizeMultiple.name': '多重奖品',
    'quickConfigTemplates.prizeMultiple.description': '同时抽取多个奖品',
    'quickConfigTemplates.luckyDraw.name': '幸运抽奖',
    'quickConfigTemplates.luckyDraw.description': '经典老虎机式抽奖',
    'quickConfigTemplates.gameSelection.name': '游戏选择',
    'quickConfigTemplates.gameSelection.description': '随机选择游戏项目',
    'quickConfigTemplates.presentationOrder.name': '演讲顺序',
    'quickConfigTemplates.presentationOrder.description': '确定演讲或展示顺序',
    'quickConfigTemplates.mysteryGift.name': '神秘礼品',
    'quickConfigTemplates.mysteryGift.description': '翻牌式神秘礼品抽取',
    // 标签翻译
    'quickConfigTemplates.classroomNaming.tags.0': '教育',
    'quickConfigTemplates.classroomNaming.tags.1': '互动',
    'quickConfigTemplates.classroomNaming.tags.2': '单选',
    'quickConfigTemplates.classroomNaming.tags.3': '公平',
    'quickConfigTemplates.annualLottery.tags.0': '企业',
    'quickConfigTemplates.annualLottery.tags.1': '年会',
    'quickConfigTemplates.annualLottery.tags.2': '抽奖',
    'quickConfigTemplates.annualLottery.tags.3': '庆典',
    'quickConfigTemplates.teamGrouping.tags.0': '团队',
    'quickConfigTemplates.teamGrouping.tags.1': '分组',
    'quickConfigTemplates.teamGrouping.tags.2': '协作',
    'quickConfigTemplates.teamGrouping.tags.3': '自动',
    'quickConfigTemplates.prizeMultiple.tags.0': '奖品',
    'quickConfigTemplates.prizeMultiple.tags.1': '多选',
    'quickConfigTemplates.prizeMultiple.tags.2': '翻牌',
    'quickConfigTemplates.prizeMultiple.tags.3': '惊喜',
    'quickConfigTemplates.luckyDraw.tags.0': '娱乐',
    'quickConfigTemplates.luckyDraw.tags.1': '经典',
    'quickConfigTemplates.luckyDraw.tags.2': '老虎机',
    'quickConfigTemplates.luckyDraw.tags.3': '刺激',
    'quickConfigTemplates.gameSelection.tags.0': '游戏',
    'quickConfigTemplates.gameSelection.tags.1': '选择',
    'quickConfigTemplates.gameSelection.tags.2': '决策',
    'quickConfigTemplates.gameSelection.tags.3': '可重复',
    'quickConfigTemplates.presentationOrder.tags.0': '演讲',
    'quickConfigTemplates.presentationOrder.tags.1': '顺序',
    'quickConfigTemplates.presentationOrder.tags.2': '排序',
    'quickConfigTemplates.presentationOrder.tags.3': '自动',
    'quickConfigTemplates.mysteryGift.tags.0': '神秘',
    'quickConfigTemplates.mysteryGift.tags.1': '礼品',
    'quickConfigTemplates.mysteryGift.tags.2': '翻牌',
    'quickConfigTemplates.mysteryGift.tags.3': '惊喜'
  }
  
  return translations[key] || key
}

export const QUICK_CONFIG_TEMPLATES = createQuickConfigTemplates(defaultTranslation)