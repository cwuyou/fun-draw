import { ExperienceTemplate, ListItem } from '@/types'
import { GraduationCap, Building, Users, Gift, Trophy, Heart } from 'lucide-react'

// 翻译函数类型定义
type TranslationFunction = (key: string, params?: Record<string, any>) => string

/**
 * 预设的体验模板数据
 * 为新用户提供不同场景的示例数据和配置
 */



/**
 * 生成国际化的示例数据
 */
const createLocalizedSampleData = (t: TranslationFunction) => {
  // 课堂学生示例数据
  const classroomStudents: ListItem[] = [
    { id: '1', name: t('experienceTemplates.sampleData.students.张三') },
    { id: '2', name: t('experienceTemplates.sampleData.students.李四') },
    { id: '3', name: t('experienceTemplates.sampleData.students.王五') },
    { id: '4', name: t('experienceTemplates.sampleData.students.赵六') },
    { id: '5', name: t('experienceTemplates.sampleData.students.陈七') },
    { id: '6', name: t('experienceTemplates.sampleData.students.刘八') },
    { id: '7', name: t('experienceTemplates.sampleData.students.杨九') },
    { id: '8', name: t('experienceTemplates.sampleData.students.黄十') },
    { id: '9', name: t('experienceTemplates.sampleData.students.周小明') },
    { id: '10', name: t('experienceTemplates.sampleData.students.吴小红') },
    { id: '11', name: t('experienceTemplates.sampleData.students.郑小华') },
    { id: '12', name: t('experienceTemplates.sampleData.students.孙小丽') },
    { id: '13', name: t('experienceTemplates.sampleData.students.马小强') },
    { id: '14', name: t('experienceTemplates.sampleData.students.朱小芳') },
    { id: '15', name: t('experienceTemplates.sampleData.students.胡小军') }
  ]

  // 部门员工示例数据
  const departmentEmployees: ListItem[] = [
    { id: '1', name: t('experienceTemplates.sampleData.employees.张经理') },
    { id: '2', name: t('experienceTemplates.sampleData.employees.李主管') },
    { id: '3', name: t('experienceTemplates.sampleData.employees.王工程师') },
    { id: '4', name: t('experienceTemplates.sampleData.employees.赵设计师') },
    { id: '5', name: t('experienceTemplates.sampleData.employees.陈分析师') },
    { id: '6', name: t('experienceTemplates.sampleData.employees.刘专员') },
    { id: '7', name: t('experienceTemplates.sampleData.employees.杨助理') },
    { id: '8', name: t('experienceTemplates.sampleData.employees.黄顾问') },
    { id: '9', name: t('experienceTemplates.sampleData.employees.周产品经理') },
    { id: '10', name: t('experienceTemplates.sampleData.employees.吴运营专员') },
    { id: '11', name: t('experienceTemplates.sampleData.employees.郑技术总监') },
    { id: '12', name: t('experienceTemplates.sampleData.employees.孙市场经理') }
  ]

  // 奖品清单示例数据
  const prizeList: ListItem[] = [
    { id: '1', name: t('experienceTemplates.sampleData.prizes.iPhone 15 Pro') },
    { id: '2', name: t('experienceTemplates.sampleData.prizes.MacBook Air') },
    { id: '3', name: t('experienceTemplates.sampleData.prizes.iPad Pro') },
    { id: '4', name: t('experienceTemplates.sampleData.prizes.AirPods Pro') },
    { id: '5', name: t('experienceTemplates.sampleData.prizes.Apple Watch') },
    { id: '6', name: t('experienceTemplates.sampleData.prizes.小米电视') },
    { id: '7', name: t('experienceTemplates.sampleData.prizes.戴森吹风机') },
    { id: '8', name: t('experienceTemplates.sampleData.prizes.星巴克礼品卡') },
    { id: '9', name: t('experienceTemplates.sampleData.prizes.京东购物卡') },
    { id: '10', name: t('experienceTemplates.sampleData.prizes.健身房年卡') }
  ]

  // 团队分组示例数据
  const teamMembers: ListItem[] = [
    { id: '1', name: t('experienceTemplates.sampleData.teamMembers.小明') },
    { id: '2', name: t('experienceTemplates.sampleData.teamMembers.小红') },
    { id: '3', name: t('experienceTemplates.sampleData.teamMembers.小华') },
    { id: '4', name: t('experienceTemplates.sampleData.teamMembers.小丽') },
    { id: '5', name: t('experienceTemplates.sampleData.teamMembers.小强') },
    { id: '6', name: t('experienceTemplates.sampleData.teamMembers.小芳') },
    { id: '7', name: t('experienceTemplates.sampleData.teamMembers.小军') },
    { id: '8', name: t('experienceTemplates.sampleData.teamMembers.小燕') },
    { id: '9', name: t('experienceTemplates.sampleData.teamMembers.小龙') },
    { id: '10', name: t('experienceTemplates.sampleData.teamMembers.小梅') },
    { id: '11', name: t('experienceTemplates.sampleData.teamMembers.小刚') },
    { id: '12', name: t('experienceTemplates.sampleData.teamMembers.小娟') }
  ]

  // 聚会游戏示例数据
  const partyGames: ListItem[] = [
    { id: '1', name: t('experienceTemplates.sampleData.games.真心话大冒险') },
    { id: '2', name: t('experienceTemplates.sampleData.games.狼人杀') },
    { id: '3', name: t('experienceTemplates.sampleData.games.剧本杀') },
    { id: '4', name: t('experienceTemplates.sampleData.games.KTV唱歌') },
    { id: '5', name: t('experienceTemplates.sampleData.games.桌游大战') },
    { id: '6', name: t('experienceTemplates.sampleData.games.电影欣赏') },
    { id: '7', name: t('experienceTemplates.sampleData.games.美食制作') },
    { id: '8', name: t('experienceTemplates.sampleData.games.户外烧烤') }
  ]

  // 年会抽奖示例数据
  const annualMeetingPrizes: ListItem[] = [
    { id: '1', name: t('experienceTemplates.sampleData.annualPrizes.特等奖：海外旅游') },
    { id: '2', name: t('experienceTemplates.sampleData.annualPrizes.一等奖：笔记本电脑') },
    { id: '3', name: t('experienceTemplates.sampleData.annualPrizes.二等奖：智能手机') },
    { id: '4', name: t('experienceTemplates.sampleData.annualPrizes.三等奖：平板电脑') },
    { id: '5', name: t('experienceTemplates.sampleData.annualPrizes.优秀奖：蓝牙耳机') },
    { id: '6', name: t('experienceTemplates.sampleData.annualPrizes.参与奖：保温杯') },
    { id: '7', name: t('experienceTemplates.sampleData.annualPrizes.幸运奖：购物卡') },
    { id: '8', name: t('experienceTemplates.sampleData.annualPrizes.惊喜奖：神秘礼品') }
  ]

  return {
    classroomStudents,
    departmentEmployees,
    prizeList,
    teamMembers,
    partyGames,
    annualMeetingPrizes
  }
}

/**
 * 生成国际化的体验模板列表
 */
export const createExperienceTemplates = (t: TranslationFunction): ExperienceTemplate[] => {
  const sampleData = createLocalizedSampleData(t)

  return [
    {
      id: 'classroom-naming',
      name: t('experienceTemplates.classroomNaming.name'),
      description: t('experienceTemplates.classroomNaming.description'),
      scenario: 'education',
      items: sampleData.classroomStudents,
      suggestedMode: 'blinking-name-picker',
      suggestedConfig: {
        quantity: 1,
        allowRepeat: false
      },
      icon: GraduationCap,
      color: 'bg-blue-500',
      tags: [
        t('experienceTemplates.classroomNaming.tags.0'),
        t('experienceTemplates.classroomNaming.tags.1'),
        t('experienceTemplates.classroomNaming.tags.2'),
        t('experienceTemplates.classroomNaming.tags.3')
      ]
    },
    {
      id: 'prize-drawing',
      name: t('experienceTemplates.prizeDrawing.name'),
      description: t('experienceTemplates.prizeDrawing.description'),
      scenario: 'prize',
      items: sampleData.prizeList,
      suggestedMode: 'slot-machine',
      suggestedConfig: {
        quantity: 1,
        allowRepeat: false
      },
      icon: Gift,
      color: 'bg-red-500',
      tags: [
        t('experienceTemplates.prizeDrawing.tags.0'),
        t('experienceTemplates.prizeDrawing.tags.1'),
        t('experienceTemplates.prizeDrawing.tags.2'),
        t('experienceTemplates.prizeDrawing.tags.3')
      ]
    },
    {
      id: 'party-game',
      name: t('experienceTemplates.partyGame.name'),
      description: t('experienceTemplates.partyGame.description'),
      scenario: 'entertainment',
      items: sampleData.partyGames,
      suggestedMode: 'grid-lottery',
      suggestedConfig: {
        quantity: 1,
        allowRepeat: false
      },
      icon: Heart,
      color: 'bg-pink-500',
      tags: [
        t('experienceTemplates.partyGame.tags.0'),
        t('experienceTemplates.partyGame.tags.1'),
        t('experienceTemplates.partyGame.tags.2'),
        t('experienceTemplates.partyGame.tags.3')
      ]
    },
    {
      id: 'team-grouping',
      name: t('experienceTemplates.teamGrouping.name'),
      description: t('experienceTemplates.teamGrouping.description'),
      scenario: 'teamwork',
      items: sampleData.teamMembers,
      suggestedMode: 'bullet-screen',
      suggestedConfig: {
        quantity: 4,
        allowRepeat: false
      },
      icon: Users,
      color: 'bg-green-500',
      tags: [
        t('experienceTemplates.teamGrouping.tags.0'),
        t('experienceTemplates.teamGrouping.tags.1'),
        t('experienceTemplates.teamGrouping.tags.2'),
        t('experienceTemplates.teamGrouping.tags.3')
      ]
    },
    {
      id: 'department-lottery',
      name: t('experienceTemplates.departmentLottery.name'),
      description: t('experienceTemplates.departmentLottery.description'),
      scenario: 'corporate',
      items: sampleData.departmentEmployees,
      suggestedMode: 'card-flip',
      suggestedConfig: {
        quantity: 3,
        allowRepeat: false
      },
      icon: Building,
      color: 'bg-purple-500',
      tags: [
        t('experienceTemplates.departmentLottery.tags.0'),
        t('experienceTemplates.departmentLottery.tags.1'),
        t('experienceTemplates.departmentLottery.tags.2'),
        t('experienceTemplates.departmentLottery.tags.3')
      ]
    },
    {
      id: 'annual-meeting',
      name: t('experienceTemplates.annualMeeting.name'),
      description: t('experienceTemplates.annualMeeting.description'),
      scenario: 'annual-meeting',
      items: sampleData.annualMeetingPrizes,
      suggestedMode: 'grid-lottery',
      suggestedConfig: {
        quantity: 1,
        allowRepeat: false
      },
      icon: Trophy,
      color: 'bg-yellow-500',
      tags: [
        t('experienceTemplates.annualMeeting.tags.0'),
        t('experienceTemplates.annualMeeting.tags.1'),
        t('experienceTemplates.annualMeeting.tags.2'),
        t('experienceTemplates.annualMeeting.tags.3')
      ]
    }
  ]
}

/**
 * 根据场景获取推荐模板
 */
export const getTemplatesByScenario = (scenario: string, t: TranslationFunction): ExperienceTemplate[] => {
  const templates = createExperienceTemplates(t)
  return templates.filter(template => template.scenario === scenario)
}

/**
 * 根据ID获取模板
 */
export const getTemplateById = (id: string, t: TranslationFunction): ExperienceTemplate | undefined => {
  const templates = createExperienceTemplates(t)
  return templates.find(template => template.id === id)
}

/**
 * 获取随机推荐模板
 */
export const getRandomTemplate = (t: TranslationFunction): ExperienceTemplate => {
  const templates = createExperienceTemplates(t)
  const randomIndex = Math.floor(Math.random() * templates.length)
  return templates[randomIndex]
}

/**
 * 根据标签搜索模板
 */
export const searchTemplatesByTag = (tag: string, t: TranslationFunction): ExperienceTemplate[] => {
  const templates = createExperienceTemplates(t)
  return templates.filter(template =>
    template.tags.some(t => t.includes(tag))
  )
}

/**
 * 获取模板使用统计的本地存储键
 */
export const TEMPLATE_USAGE_STORAGE_KEY = 'experience-template-usage'

/**
 * 临时的静态模板导出（用于向后兼容）
 * 使用默认的中文翻译
 */
const defaultTranslation = (key: string, params?: Record<string, any>) => {
  // 简单的默认翻译映射
  const translations: Record<string, string> = {
    'experienceTemplates.classroomNaming.name': '课堂随机点名',
    'experienceTemplates.classroomNaming.description': '随机选择学生回答问题或参与活动',
    'experienceTemplates.prizeDrawing.name': '奖品抽取',
    'experienceTemplates.prizeDrawing.description': '公平公正的奖品抽取活动',
    'experienceTemplates.partyGame.name': '聚会游戏选择',
    'experienceTemplates.partyGame.description': '随机选择聚会游戏增加乐趣',
    'experienceTemplates.teamGrouping.name': '团队随机分组',
    'experienceTemplates.teamGrouping.description': '公平分配团队成员',
    'experienceTemplates.departmentLottery.name': '部门抽奖活动',
    'experienceTemplates.departmentLottery.description': '部门内部抽奖活动',
    'experienceTemplates.annualMeeting.name': '年会抽奖',
    'experienceTemplates.annualMeeting.description': '年会现场抽奖活动',
    // 示例数据翻译 - 学生
    'experienceTemplates.sampleData.students.张三': '张三',
    'experienceTemplates.sampleData.students.李四': '李四',
    'experienceTemplates.sampleData.students.王五': '王五',
    'experienceTemplates.sampleData.students.赵六': '赵六',
    'experienceTemplates.sampleData.students.陈七': '陈七',
    'experienceTemplates.sampleData.students.刘八': '刘八',
    'experienceTemplates.sampleData.students.杨九': '杨九',
    'experienceTemplates.sampleData.students.黄十': '黄十',
    'experienceTemplates.sampleData.students.周小明': '周小明',
    'experienceTemplates.sampleData.students.吴小红': '吴小红',
    'experienceTemplates.sampleData.students.郑小华': '郑小华',
    'experienceTemplates.sampleData.students.孙小丽': '孙小丽',
    'experienceTemplates.sampleData.students.马小强': '马小强',
    'experienceTemplates.sampleData.students.朱小芳': '朱小芳',
    'experienceTemplates.sampleData.students.胡小军': '胡小军',
    // 员工
    'experienceTemplates.sampleData.employees.张经理': '张经理',
    'experienceTemplates.sampleData.employees.李主管': '李主管',
    'experienceTemplates.sampleData.employees.王工程师': '王工程师',
    'experienceTemplates.sampleData.employees.赵设计师': '赵设计师',
    'experienceTemplates.sampleData.employees.陈分析师': '陈分析师',
    'experienceTemplates.sampleData.employees.刘专员': '刘专员',
    'experienceTemplates.sampleData.employees.杨助理': '杨助理',
    'experienceTemplates.sampleData.employees.黄顾问': '黄顾问',
    'experienceTemplates.sampleData.employees.周产品经理': '周产品经理',
    'experienceTemplates.sampleData.employees.吴运营专员': '吴运营专员',
    'experienceTemplates.sampleData.employees.郑技术总监': '郑技术总监',
    'experienceTemplates.sampleData.employees.孙市场经理': '孙市场经理',
    // 奖品
    'experienceTemplates.sampleData.prizes.iPhone 15 Pro': 'iPhone 15 Pro',
    'experienceTemplates.sampleData.prizes.MacBook Air': 'MacBook Air',
    'experienceTemplates.sampleData.prizes.iPad Pro': 'iPad Pro',
    'experienceTemplates.sampleData.prizes.AirPods Pro': 'AirPods Pro',
    'experienceTemplates.sampleData.prizes.Apple Watch': 'Apple Watch',
    'experienceTemplates.sampleData.prizes.小米电视': '小米电视',
    'experienceTemplates.sampleData.prizes.戴森吹风机': '戴森吹风机',
    'experienceTemplates.sampleData.prizes.星巴克礼品卡': '星巴克礼品卡',
    'experienceTemplates.sampleData.prizes.京东购物卡': '京东购物卡',
    'experienceTemplates.sampleData.prizes.健身房年卡': '健身房年卡',
    // 团队成员
    'experienceTemplates.sampleData.teamMembers.小明': '小明',
    'experienceTemplates.sampleData.teamMembers.小红': '小红',
    'experienceTemplates.sampleData.teamMembers.小华': '小华',
    'experienceTemplates.sampleData.teamMembers.小丽': '小丽',
    'experienceTemplates.sampleData.teamMembers.小强': '小强',
    'experienceTemplates.sampleData.teamMembers.小芳': '小芳',
    'experienceTemplates.sampleData.teamMembers.小军': '小军',
    'experienceTemplates.sampleData.teamMembers.小燕': '小燕',
    'experienceTemplates.sampleData.teamMembers.小龙': '小龙',
    'experienceTemplates.sampleData.teamMembers.小梅': '小梅',
    'experienceTemplates.sampleData.teamMembers.小刚': '小刚',
    'experienceTemplates.sampleData.teamMembers.小娟': '小娟',
    // 游戏
    'experienceTemplates.sampleData.games.真心话大冒险': '真心话大冒险',
    'experienceTemplates.sampleData.games.狼人杀': '狼人杀',
    'experienceTemplates.sampleData.games.剧本杀': '剧本杀',
    'experienceTemplates.sampleData.games.KTV唱歌': 'KTV唱歌',
    'experienceTemplates.sampleData.games.桌游大战': '桌游大战',
    'experienceTemplates.sampleData.games.电影欣赏': '电影欣赏',
    'experienceTemplates.sampleData.games.美食制作': '美食制作',
    'experienceTemplates.sampleData.games.户外烧烤': '户外烧烤',
    // 年会奖品
    'experienceTemplates.sampleData.annualPrizes.特等奖：海外旅游': '特等奖：海外旅游',
    'experienceTemplates.sampleData.annualPrizes.一等奖：笔记本电脑': '一等奖：笔记本电脑',
    'experienceTemplates.sampleData.annualPrizes.二等奖：智能手机': '二等奖：智能手机',
    'experienceTemplates.sampleData.annualPrizes.三等奖：平板电脑': '三等奖：平板电脑',
    'experienceTemplates.sampleData.annualPrizes.优秀奖：蓝牙耳机': '优秀奖：蓝牙耳机',
    'experienceTemplates.sampleData.annualPrizes.参与奖：保温杯': '参与奖：保温杯',
    'experienceTemplates.sampleData.annualPrizes.幸运奖：购物卡': '幸运奖：购物卡',
    'experienceTemplates.sampleData.annualPrizes.惊喜奖：神秘礼品': '惊喜奖：神秘礼品',
    // 标签翻译
    'experienceTemplates.classroomNaming.tags.0': '教育',
    'experienceTemplates.classroomNaming.tags.1': '互动',
    'experienceTemplates.classroomNaming.tags.2': '随机',
    'experienceTemplates.classroomNaming.tags.3': '公平',
    'experienceTemplates.prizeDrawing.tags.0': '抽奖',
    'experienceTemplates.prizeDrawing.tags.1': '奖品',
    'experienceTemplates.prizeDrawing.tags.2': '公正',
    'experienceTemplates.prizeDrawing.tags.3': '激励',
    'experienceTemplates.partyGame.tags.0': '娱乐',
    'experienceTemplates.partyGame.tags.1': '聚会',
    'experienceTemplates.partyGame.tags.2': '游戏',
    'experienceTemplates.partyGame.tags.3': '互动',
    'experienceTemplates.teamGrouping.tags.0': '团队',
    'experienceTemplates.teamGrouping.tags.1': '分组',
    'experienceTemplates.teamGrouping.tags.2': '协作',
    'experienceTemplates.teamGrouping.tags.3': '公平',
    'experienceTemplates.departmentLottery.tags.0': '企业',
    'experienceTemplates.departmentLottery.tags.1': '部门',
    'experienceTemplates.departmentLottery.tags.2': '抽奖',
    'experienceTemplates.departmentLottery.tags.3': '团建',
    'experienceTemplates.annualMeeting.tags.0': '年会',
    'experienceTemplates.annualMeeting.tags.1': '抽奖',
    'experienceTemplates.annualMeeting.tags.2': '庆典',
    'experienceTemplates.annualMeeting.tags.3': '奖励'
  }

  return translations[key] || key
}

export const EXPERIENCE_TEMPLATES = createExperienceTemplates(defaultTranslation)

/**
 * 记录模板使用
 */
export const recordTemplateUsage = (templateId: string): void => {
  try {
    const usage = JSON.parse(localStorage.getItem(TEMPLATE_USAGE_STORAGE_KEY) || '{}')
    usage[templateId] = {
      count: (usage[templateId]?.count || 0) + 1,
      lastUsed: new Date().toISOString()
    }
    localStorage.setItem(TEMPLATE_USAGE_STORAGE_KEY, JSON.stringify(usage))
  } catch (error) {
    console.error('Failed to record template usage:', error)
  }
}

/**
 * 获取最常用的模板
 */
export const getMostUsedTemplates = (limit: number = 3, t: TranslationFunction): ExperienceTemplate[] => {
  try {
    const templates = createExperienceTemplates(t)
    const usage = JSON.parse(localStorage.getItem(TEMPLATE_USAGE_STORAGE_KEY) || '{}')
    const sortedTemplates = templates
      .map(template => ({
        ...template,
        usageCount: usage[template.id]?.count || 0
      }))
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, limit)

    return sortedTemplates
  } catch (error) {
    console.error('Failed to get most used templates:', error)
    const templates = createExperienceTemplates(t)
    return templates.slice(0, limit)
  }
}