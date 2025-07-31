import * as React from "react"

/**
 * 抽奖项目基础类型
 * 表示参与抽奖的单个项目
 */
export interface ListItem {
  id: string
  name: string
}

/**
 * 保存的抽奖列表
 * 用于本地存储管理的列表数据结构
 */
export interface SavedList {
  id: string
  name: string
  items: ListItem[]
  createdAt: string
  updatedAt: string
}

/**
 * 抽奖配置
 * 包含所有抽奖模式的通用配置选项
 * 注意：多宫格抽奖模式下 quantity 固定为 1
 */
export interface DrawingConfig {
  mode: DrawingMode
  quantity: number // 多宫格抽奖模式下固定为1，其他模式可配置
  allowRepeat: boolean
  listId?: string
  items: ListItem[]
}

/**
 * 支持的抽奖模式类型
 * grid-lottery: 多宫格抽奖（固定单次抽取）
 * slot-machine: 老虎机式抽奖
 * card-flip: 翻牌抽奖
 * bullet-screen: 弹幕抽奖
 * blinking-name-picker: 闪烁点名
 */
export type DrawingMode = "slot-machine" | "card-flip" | "bullet-screen" | "grid-lottery" | "blinking-name-picker"

/**
 * 一键体验功能相关类型定义
 * 为新用户提供快速体验抽奖功能的预设模板
 */

/**
 * 体验模板
 * 预设的抽奖场景模板，包含示例数据和推荐配置
 */
export interface ExperienceTemplate {
  id: string
  name: string
  description: string
  scenario: string
  items: ListItem[]
  suggestedMode: DrawingMode
  suggestedConfig: Partial<DrawingConfig>
  icon: React.ComponentType<{ className?: string }> | React.ReactNode
  color: string
  tags: string[]
}

/**
 * 体验模板数据
 * 管理所有体验模板的数据结构
 */
export interface ExperienceTemplateData {
  templates: ExperienceTemplate[]
  lastUsed?: string
  userPreferences: {
    preferredTemplate?: string
    skipIntro: boolean
  }
}

/**
 * 快速配置模板
 * 预设的抽奖配置模板，用于快速配置抽奖参数
 */
export interface ConfigurationTemplate {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  mode: DrawingMode
  quantity: number | 'auto'
  allowRepeat: boolean
  scenario: string
  tags: string[]
  color: string
}

/**
 * 快速配置存储
 * 管理快速配置模板和用户使用统计
 */
export interface QuickConfigStorage {
  templates: ConfigurationTemplate[]
  userCustomConfigs: ConfigurationTemplate[]
  usageStats: {
    [configId: string]: {
      useCount: number
      lastUsed: string
      avgSatisfaction: number
    }
  }
}

/**
 * 内容解析结果
 * 智能内容解析的结果数据
 */
export interface ContentParsingResult {
  items: ListItem[]
  detectedFormat: ContentFormat
  confidence: number
  suggestions: string[]
  duplicatesRemoved: number
  processingTime: number
}

/**
 * 内容格式类型
 * 支持的内容格式识别类型
 */
export enum ContentFormat {
  LINE_SEPARATED = 'line-separated',
  COMMA_SEPARATED = 'comma-separated',
  TAB_SEPARATED = 'tab-separated',
  NUMBERED_LIST = 'numbered-list',
  MIXED_FORMAT = 'mixed-format'
}

/**
 * 文件处理结果
 * 文件上传和处理的结果数据
 */
export interface FileProcessingResult {
  items: ListItem[]
  duplicateCount: number
  formatDetected: string
  processingTime: number
  fileSize: number
  fileName: string
}

/**
 * 文件处理状态
 * 文件处理过程的状态管理
 */
export interface FileProcessingState {
  status: 'idle' | 'processing' | 'completed' | 'error'
  progress: number
  result?: FileProcessingResult
  error?: string
  startTime?: number
  endTime?: number
}

/**
 * 拖拽状态
 * 拖拽上传的状态管理
 */
export interface DragDropState {
  isDragging: boolean
  dragCounter: number
  isProcessing: boolean
  progress: number
}

/**
 * 继续抽奖状态
 * 连续抽奖功能的状态管理
 */
export interface ContinueDrawingState {
  excludeWinners: boolean
  availableItems: ListItem[]
  lastResults: ListItem[]
  isReady: boolean
  roundCount: number
}

/**
 * 闪烁点名相关类型定义
 * 闪烁点名是一种通过快速闪烁高亮来选择项目的抽奖方式
 */

/**
 * 闪烁游戏状态
 * 管理闪烁点名的完整状态
 */
export interface BlinkingGameState {
  phase: 'idle' | 'blinking' | 'slowing' | 'paused' | 'stopped' | 'finished'
  items: BlinkingItem[]
  currentHighlight: number | null
  selectedItems: ListItem[]
  blinkingSpeed: number
  currentRound: number
  totalRounds: number
  startTime: number
}

/**
 * 闪烁项目
 * 表示参与闪烁的单个项目及其状态
 */
export interface BlinkingItem {
  id: string
  item: ListItem
  isHighlighted: boolean
  isSelected: boolean
  highlightColor: string
  position: {
    row: number
    col: number
    index: number
  }
}

/**
 * 闪烁配置
 * 控制闪烁动画的各种参数
 */
export interface BlinkingConfig {
  initialSpeed: number      // 初始闪烁间隔(ms)
  finalSpeed: number        // 最终闪烁间隔(ms)
  accelerationDuration: number // 减速过程时长(ms)
  colors: string[]          // 闪烁颜色数组
  glowIntensity: number     // 发光强度
}

/**
 * 闪烁点名组件属性
 * 闪烁点名组件的完整属性定义
 */
export interface BlinkingNamePickerProps {
  items: ListItem[]
  quantity: number
  allowRepeat: boolean
  onComplete: (winners: ListItem[]) => void
  onRestart?: () => void
  soundEnabled: boolean
  className?: string
  autoStart?: boolean
}

/**
 * 抽奖模式信息
 * 用于在UI中显示模式选择器的信息
 */
export interface DrawingModeInfo {
  id: DrawingMode
  name: string
  description: string
  icon: React.ReactNode
  color: string
  features?: string[]           // 模式特性列表
  limitations?: string[]        // 模式限制说明
}

/**
 * 卡牌抽奖相关类型定义
 * 翻牌抽奖通过发牌、翻牌动画来进行抽奖
 */

/**
 * 游戏卡牌
 * 表示翻牌游戏中的单张卡牌
 */
export interface GameCard {
  id: string
  content: ListItem | null
  position: { x: number; y: number; rotation: number; cardWidth?: number; cardHeight?: number }
  isWinner: boolean
  style?: React.CSSProperties // 动画样式
}

/**
 * 卡牌样式
 * 定义卡牌的视觉样式
 */
export interface CardStyle {
  id: string
  name: string
  backDesign: string        // CSS类名或背景图片
  frontTemplate: string     // 正面模板样式
  colors: {
    primary: string
    secondary: string
    accent: string
  }
}

/**
 * 卡牌游戏配置
 * 翻牌抽奖的各种配置参数
 */
export interface CardGameConfig {
  minCards: number          // 最少发牌数量 (3)
  maxCards: number          // 最多发牌数量 (10)
  shuffleDuration: number   // 洗牌动画时长 (2500ms)
  dealInterval: number      // 发牌间隔 (300ms)
  flipDuration: number      // 翻牌动画时长 (600ms)
  cardStyle: CardStyle      // 选中的卡牌样式
}

/**
 * 卡牌游戏阶段
 * 翻牌抽奖的各个执行阶段
 */
export type CardGamePhase = 'idle' | 'shuffling' | 'dealing' | 'waiting' | 'revealing' | 'finished'

/**
 * 翻牌游戏状态
 * 管理整个翻牌抽奖过程的状态
 */
export interface CardFlipGameState {
  gamePhase: CardGamePhase
  cards: GameCard[]
  revealedCards: Set<string>
  winners: ListItem[]
}

/**
 * 动画状态
 * 跟踪各种动画的进度
 */
export interface AnimationState {
  shuffleProgress: number
  dealingProgress: number
  currentDealingCard: number
  isAnimating: boolean
}

/**
 * 卡牌游戏错误类型
 * 翻牌抽奖可能出现的错误
 */
export enum CardGameError {
  INSUFFICIENT_ITEMS = 'INSUFFICIENT_ITEMS',
  INVALID_QUANTITY = 'INVALID_QUANTITY',
  ANIMATION_FAILED = 'ANIMATION_FAILED',
  AUDIO_FAILED = 'AUDIO_FAILED'
}

/**
 * 卡牌游戏错误处理器
 * 处理翻牌抽奖错误的标准接口
 */
export interface CardGameErrorHandler {
  handleError: (error: CardGameError, context?: any) => void
  showErrorToast: (message: string) => void
  recoverFromError: () => void
}

/**
 * 布局管理相关类型
 * 用于响应式布局和设备适配
 */

/**
 * 设备类型
 * 根据屏幕尺寸分类的设备类型
 */
export type DeviceType = 'mobile' | 'tablet' | 'desktop'

/**
 * 设备配置
 * 不同设备类型的布局配置
 */
export interface DeviceConfig {
  type: DeviceType
  breakpoint: number          // 断点像素值
  maxCards: number           // 最大卡牌数量
  cardSize: {
    width: number
    height: number
  }
  spacing: number            // 卡牌间距
  cardsPerRow: number        // 每行卡牌数量
  minContainerWidth: number  // 最小容器宽度
  minContainerHeight: number // 最小容器高度
}

/**
 * 容器尺寸
 * 布局容器的尺寸信息
 */
export interface ContainerDimensions {
  width: number
  height: number
  availableWidth: number     // 可用宽度（减去边距）
  availableHeight: number    // 可用高度（减去边距）
}

/**
 * 安全边距
 * 确保内容不会超出可视区域的边距设置
 */
export interface SafeMargins {
  top: number
  bottom: number
  left: number
  right: number
  horizontal: number         // 水平总边距
  vertical: number          // 垂直总边距
}

/**
 * 布局计算结果
 * 布局算法的完整计算结果
 */
export interface LayoutCalculationResult {
  deviceConfig: DeviceConfig
  containerDimensions: ContainerDimensions
  safeMargins: SafeMargins
  maxSafeCards: number       // 安全的最大卡牌数量
  recommendedCards: number   // 推荐的卡牌数量
  fallbackApplied?: boolean  // 是否应用了降级方案
}

// 动态间距系统相关类型
export interface SpacingConfig {
  baseUnit: number
  componentSpacing: {
    xs: number
    sm: number
    md: number
    lg: number
    xl: number
    xxl: number
  }
  containerPadding: {
    x: number
    y: number
  }
  uiElementSpacing: {
    gameInfo: number
    gameStatus: number
    startButton: number
    warnings: number
    resultDisplay: number
    cardArea: number
  }
}

export interface SpacingValidationResult {
  isValid: boolean
  warnings: string[]
  errors: string[]
  recommendations: string[]
}

// 布局验证相关类型
export interface CardPosition {
  x: number
  y: number
  rotation: number
  cardWidth: number
  cardHeight: number
  // Add validation metadata
  isValidated?: boolean
  isFallback?: boolean
  validationError?: string
}

export interface PositionValidationResult {
  isValid: boolean
  position?: CardPosition
  error?: string
  fallbackApplied?: boolean
}

export interface PositionCalculationContext {
  containerWidth: number
  containerHeight: number
  cardCount: number
  deviceType: DeviceType
  timestamp: number
  fallbackApplied: boolean
}

export interface ResizeError {
  timestamp: number
  error: Error
  context: {
    containerWidth: number
    containerHeight: number
    cardCount: number
    gamePhase: string
  }
  recovery: 'fallback' | 'retry' | 'ignore'
}

export enum PositionError {
  UNDEFINED_POSITION = 'Position object is undefined',
  MISSING_PROPERTIES = 'Position missing required properties',
  INVALID_VALUES = 'Position contains invalid numeric values',
  ARRAY_BOUNDS = 'Position array index out of bounds',
  CALCULATION_FAILED = 'Position calculation encountered an error'
}

export interface LayoutConfig {
  cardWidth: number
  cardHeight: number
  spacing: SpacingConfig & {
    horizontal: number
    vertical: number
    tolerance: number
  }
  padding: {
    top: number
    right: number
    bottom: number
    left: number
  }
}

/**
 * 多宫格抽奖配置
 * 多宫格抽奖是固定单次抽取模式，通过灯光跳转选择一个获奖者
 */
export interface GridLotteryConfig {
  gridSize: 6 | 9 | 12 | 15  // 支持的宫格数量：6(2×3), 9(3×3), 12(3×4), 15(3×5)
  animationDuration: number  // 动画持续时间(ms)
  highlightSpeed: number     // 高亮跳转速度(ms)
  countdownDuration: number  // 倒计时时长(ms)
  soundEnabled: boolean      // 音效开关
}

/**
 * 宫格单元格
 * 表示多宫格抽奖中的单个宫格
 */
export interface GridCell {
  id: string
  index: number
  item: ListItem
  isHighlighted: boolean
  isWinner: boolean
  position: {
    row: number
    col: number
  }
}

/**
 * 多宫格抽奖阶段
 * idle: 待机状态
 * countdown: 倒计时阶段
 * spinning: 快速跳转阶段
 * slowing: 减速阶段
 * finished: 完成状态
 */
export type GridLotteryPhase = 'idle' | 'countdown' | 'spinning' | 'slowing' | 'finished'

/**
 * 多宫格抽奖状态
 * 管理整个抽奖过程的状态信息
 */
export interface GridLotteryState {
  phase: GridLotteryPhase
  cells: GridCell[]
  currentHighlight: number
  winner: ListItem | null  // 单次抽取，只有一个获奖者
  countdown: number
}

/**
 * 宫格布局配置
 * 根据项目数量和重复设置确定最佳布局
 */
export interface GridLayoutConfig {
  itemCount: number
  gridSize: 6 | 9 | 12 | 15
  layout: {
    rows: number
    cols: number
  }
  fillStrategy: 'repeat' | 'empty' | 'random'
}

// 闪烁点名相关类型定义
export interface BlinkingConfig {
  initialSpeed: number      // 初始闪烁间隔(ms) - 100
  finalSpeed: number        // 最终闪烁间隔(ms) - 1000
  accelerationDuration: number // 减速过程时长(ms) - 3000
  colors: string[]          // 闪烁颜色数组
  glowIntensity: number     // 发光强度 0-1
}

export interface BlinkingItem {
  id: string
  item: ListItem
  isHighlighted: boolean
  isSelected: boolean
  highlightColor: string
  position: {
    row: number
    col: number
    index: number
  }
}

export type BlinkingGamePhase = 'idle' | 'blinking' | 'slowing' | 'paused' | 'stopped' | 'finished'

export interface BlinkingGameState {
  phase: BlinkingGamePhase
  items: BlinkingItem[]
  currentHighlight: number | null
  selectedItems: ListItem[]
  blinkingSpeed: number
  currentRound: number
  totalRounds: number
  startTime: number
}

/**
 * 模式特定配置系统类型定义
 * 用于不同抽奖模式的配置界面定制
 */

/**
 * 模式特定配置
 * 定义每种抽奖模式在配置页面的行为
 */
export interface ModeSpecificConfig {
  showQuantityInput: boolean      // 是否显示数量输入框
  quantityValue: number | 'auto'  // 数量值，'auto'表示用户可配置
  quantityEditable: boolean       // 数量是否可编辑
  description: string             // 模式描述文字
  helpText?: string              // 帮助提示文字
}

/**
 * 模式配置定义
 * 完整的模式配置结构，包含数量和UI配置
 */
export interface ModeConfiguration {
  mode: DrawingMode
  quantityConfig: {
    fixed: boolean        // 数量是否固定
    value?: number        // 固定值（如多宫格抽奖固定为1）
    min?: number          // 最小值
    max?: number          // 最大值
    description: string   // 数量配置说明
  }
  uiConfig: {
    showQuantityInput: boolean    // 是否显示数量输入
    quantityEditable: boolean     // 数量是否可编辑
    helpText?: string            // UI帮助文字
  }
}

/**
 * 模式验证结果
 * 用于验证配置是否符合特定模式的要求
 */
export interface ModeValidationResult {
  isValid: boolean
  errors: string[]                    // 错误信息
  warnings: string[]                  // 警告信息
  correctedConfig?: Partial<DrawingConfig>  // 修正后的配置
}

/**
 * 配置验证结果
 * 通用的配置验证结果类型
 */
export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

/**
 * 多宫格抽奖错误类型
 * 定义多宫格抽奖可能出现的错误
 */
export enum GridLotteryError {
  INVALID_QUANTITY = 'INVALID_QUANTITY',           // 数量配置错误
  INSUFFICIENT_ITEMS = 'INSUFFICIENT_ITEMS',       // 项目数量不足
  INVALID_GRID_SIZE = 'INVALID_GRID_SIZE',        // 宫格大小无效
  ANIMATION_FAILED = 'ANIMATION_FAILED',           // 动画执行失败
  AUDIO_FAILED = 'AUDIO_FAILED',                   // 音频播放失败
  CONFIG_MIGRATION_FAILED = 'CONFIG_MIGRATION_FAILED' // 配置迁移失败
}

/**
 * 多宫格抽奖错误处理器
 * 定义错误处理的标准接口
 */
export interface GridLotteryErrorHandler {
  handleError: (error: GridLotteryError, context?: any) => void
  showErrorToast: (message: string) => void
  recoverFromError: () => void
  redirectToConfig?: () => void
}

/**
 * 配置迁移结果
 * 用于处理现有配置数据的迁移
 */
export interface ConfigMigrationResult {
  success: boolean
  originalConfig: DrawingConfig
  migratedConfig: DrawingConfig
  changes: string[]              // 记录所做的更改
  warnings: string[]             // 迁移过程中的警告
}

/**
 * 抽奖结果
 * 标准化的抽奖结果格式
 */
export interface DrawResult {
  winners: ListItem[]
  timestamp: string
  mode: string
  totalItems: number
  config?: Partial<DrawingConfig>
}

/**
 * 数量限制配置
 * 用于不同模式下的数量限制管理
 */
export interface QuantityLimitConfig {
  mode: DrawingMode
  min: number
  max: number | 'unlimited'
  default: number
  fixed?: boolean               // 是否为固定值（如多宫格抽奖）
  description: string
}

/**
 * UI状态管理
 * 通用的UI状态类型
 */
export interface UIState {
  loading: boolean
  error: string | null
  success: boolean
  message?: string
}

/**
 * 本地存储键名常量
 * 统一管理localStorage的键名
 */
export const STORAGE_KEYS = {
  DRAWING_CONFIG: 'drawing-config',
  SAVED_LISTS: 'saved-lists',
  USER_PREFERENCES: 'user-preferences',
  LAST_DRAW_RESULT: 'last-draw-result'
} as const

/**
 * 模式特定常量
 * 各种抽奖模式的特定配置常量
 */
export const MODE_CONSTANTS = {
  GRID_LOTTERY: {
    FIXED_QUANTITY: 1,
    SUPPORTED_GRID_SIZES: [6, 9, 12, 15] as const,
    DEFAULT_ANIMATION_DURATION: 3000,
    DEFAULT_HIGHLIGHT_SPEED: 150
  },
  CARD_FLIP: {
    MIN_CARDS: 3,
    MAX_CARDS: 10,
    DEFAULT_SHUFFLE_DURATION: 2500,
    DEFAULT_DEAL_INTERVAL: 300
  }
} as const

/**
 * 国际化和语言切换相关类型定义
 */

/**
 * 支持的语言代码
 */
export type LanguageCode = 'zh' | 'en'

/**
 * 语言配置
 * 定义每种语言的基本信息和格式化选项
 */
export interface LanguageConfig {
  code: LanguageCode
  name: string              // 英文名称
  nativeName: string        // 本地语言名称
  flag: string              // 旗帜emoji或图标
  direction: 'ltr' | 'rtl'  // 文字方向
  dateFormat: string        // 日期格式
  numberFormat: Intl.NumberFormatOptions
}

/**
 * 支持的语言列表
 */
export const SUPPORTED_LANGUAGES: LanguageConfig[] = [
  {
    code: 'zh',
    name: 'Chinese',
    nativeName: '中文',
    flag: '🇨🇳',
    direction: 'ltr',
    dateFormat: 'YYYY年MM月DD日',
    numberFormat: { locale: 'zh-CN' }
  },
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇺🇸',
    direction: 'ltr',
    dateFormat: 'MMM DD, YYYY',
    numberFormat: { locale: 'en-US' }
  }
]

/**
 * 翻译参数
 * 用于翻译函数的参数插值
 */
export interface TranslationParams {
  [key: string]: string | number
}

/**
 * 语言上下文类型
 * React Context 的类型定义
 */
export interface LanguageContextType {
  currentLanguage: LanguageCode
  setLanguage: (language: LanguageCode) => void
  t: (key: string, params?: TranslationParams) => string
  isLoading: boolean
  error: string | null
}

/**
 * 语言提供者属性
 */
export interface LanguageProviderProps {
  children: React.ReactNode
  defaultLanguage?: LanguageCode
}

/**
 * 语言切换器属性
 */
export interface LanguageSwitcherProps {
  className?: string
  variant?: 'default' | 'compact'
  showLabel?: boolean
}

/**
 * 翻译文件结构
 * 定义翻译JSON文件的结构类型
 */
export interface TranslationFile {
  common: {
    loading: string
    error: string
    success: string
    cancel: string
    confirm: string
    save: string
    delete: string
    edit: string
    create: string
    back: string
    next: string
    previous: string
    close: string
    retry: string
    refresh: string
  }
  navigation: {
    home: string
    createList: string
    listLibrary: string
    features: string
    modes: string
    useCases: string
    drawConfig: string
  }
  home: {
    title: string
    subtitle: string
    startButton: string
    demoButton: string
    quickExperience: string
    experienceDescription: string
    features: {
      title: string
      subtitle: string
      items: {
        modes: {
          title: string
          description: string
        }
        templates: {
          title: string
          description: string
        }
        display: {
          title: string
          description: string
        }
      }
    }
  }
  drawingModes: {
    slotMachine: {
      title: string
      description: string
      features: string[]
    }
    cardFlip: {
      title: string
      description: string
      features: string[]
    }
    bulletScreen: {
      title: string
      description: string
      features: string[]
    }
    gridLottery: {
      title: string
      description: string
      features: string[]
    }
    blinkingNamePicker: {
      title: string
      description: string
      features: string[]
    }
  }
  experienceTemplates: {
    classroomNaming: {
      name: string
      description: string
    }
    prizeDrawing: {
      name: string
      description: string
    }
    partyGame: {
      name: string
      description: string
    }
    teamGrouping: {
      name: string
      description: string
    }
    departmentLottery: {
      name: string
      description: string
    }
    annualMeeting: {
      name: string
      description: string
    }
  }
  errors: {
    networkError: string
    fileUploadError: string
    invalidFormat: string
    insufficientItems: string
    configurationError: string
    animationError: string
    audioError: string
  }
  status: {
    preparing: string
    processing: string
    completed: string
    failed: string
    uploading: string
    parsing: string
  }
  toast: {
    success: {
      saved: string
      deleted: string
      uploaded: string
      configured: string
    }
    error: {
      saveFailed: string
      deleteFailed: string
      uploadFailed: string
      configFailed: string
    }
    warning: {
      unsavedChanges: string
      duplicateItems: string
      limitExceeded: string
    }
  }
}

/**
 * 翻译错误类型
 */
export enum TranslationError {
  LOAD_FAILED = 'TRANSLATION_LOAD_FAILED',
  INVALID_KEY = 'INVALID_TRANSLATION_KEY',
  MISSING_TRANSLATION = 'MISSING_TRANSLATION',
  STORAGE_ERROR = 'STORAGE_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR'
}

/**
 * 翻译错误处理器
 */
export interface TranslationErrorHandler {
  handleTranslationError: (error: TranslationError, context?: any) => void
  fallbackToDefaultLanguage: () => void
  showErrorToast: (message: string) => void
  retryLoadTranslation: (language: LanguageCode) => Promise<void>
}

/**
 * 语言偏好存储
 * 本地存储的语言偏好数据结构
 */
export interface LanguagePreference {
  language: LanguageCode
  timestamp: number
  version: string
}

/**
 * 翻译加载状态
 */
export interface TranslationLoadState {
  isLoading: boolean
  error: TranslationError | null
  loadedLanguages: Set<LanguageCode>
  currentLanguage: LanguageCode
}

/**
 * 翻译缓存
 * 内存中的翻译缓存结构
 */
export interface TranslationCache {
  [language: string]: TranslationFile
}

/**
 * 语言切换选项
 */
export interface LanguageOption {
  code: LanguageCode
  label: string
  nativeLabel: string
  flag: string
  isActive: boolean
}

/**
 * 本地化配置
 * 用于数字、日期等的本地化格式
 */
export interface LocalizationConfig {
  language: LanguageCode
  dateFormat: Intl.DateTimeFormatOptions
  numberFormat: Intl.NumberFormatOptions
  currencyFormat: Intl.NumberFormatOptions
  timeFormat: Intl.DateTimeFormatOptions
}

/**
 * 语言切换存储键名
 */
export const LANGUAGE_STORAGE_KEYS = {
  LANGUAGE_PREFERENCE: 'language-preference',
  TRANSLATION_CACHE: 'translation-cache',
  LANGUAGE_VERSION: 'language-version'
} as const