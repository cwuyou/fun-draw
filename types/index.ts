import type React from "react"
export interface ListItem {
  id: string
  name: string
}

export interface SavedList {
  id: string
  name: string
  items: ListItem[]
  createdAt: string
  updatedAt: string
}

export interface DrawingConfig {
  mode: DrawingMode
  quantity: number
  allowRepeat: boolean
  listId?: string
  items: ListItem[]
}

export type DrawingMode = "slot-machine" | "blind-box" | "card-flip" | "bullet-screen" | "gashapon"

export interface DrawingModeInfo {
  id: DrawingMode
  name: string
  description: string
  icon: React.ReactNode
  color: string
}

// 卡牌抽奖相关类型定义
export interface GameCard {
  id: string
  content: ListItem | null
  position: { x: number; y: number; rotation: number; cardWidth?: number; cardHeight?: number }
  isWinner: boolean
  style?: React.CSSProperties // Optional inline styles for animations
}

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

export interface CardGameConfig {
  minCards: number          // 最少发牌数量 (3)
  maxCards: number          // 最多发牌数量 (10)
  shuffleDuration: number   // 洗牌动画时长 (2500ms)
  dealInterval: number      // 发牌间隔 (300ms)
  flipDuration: number      // 翻牌动画时长 (600ms)
  cardStyle: CardStyle      // 选中的卡牌样式
}

export type CardGamePhase = 'idle' | 'shuffling' | 'dealing' | 'waiting' | 'revealing' | 'finished'

export interface CardFlipGameState {
  gamePhase: CardGamePhase
  cards: GameCard[]
  revealedCards: Set<string>
  winners: ListItem[]
}

export interface AnimationState {
  shuffleProgress: number
  dealingProgress: number
  currentDealingCard: number
  isAnimating: boolean
}

export enum CardGameError {
  INSUFFICIENT_ITEMS = 'INSUFFICIENT_ITEMS',
  INVALID_QUANTITY = 'INVALID_QUANTITY',
  ANIMATION_FAILED = 'ANIMATION_FAILED',
  AUDIO_FAILED = 'AUDIO_FAILED'
}

export interface CardGameErrorHandler {
  handleError: (error: CardGameError, context?: any) => void
  showErrorToast: (message: string) => void
  recoverFromError: () => void
}

// 布局管理相关类型
export type DeviceType = 'mobile' | 'tablet' | 'desktop'

export interface DeviceConfig {
  type: DeviceType
  breakpoint: number
  maxCards: number
  cardSize: {
    width: number
    height: number
  }
  spacing: number
  cardsPerRow: number
  minContainerWidth: number
  minContainerHeight: number
}

export interface ContainerDimensions {
  width: number
  height: number
  availableWidth: number
  availableHeight: number
}

export interface SafeMargins {
  top: number
  bottom: number
  left: number
  right: number
  horizontal: number
  vertical: number
}

export interface LayoutCalculationResult {
  deviceConfig: DeviceConfig
  containerDimensions: ContainerDimensions
  safeMargins: SafeMargins
  maxSafeCards: number
  recommendedCards: number
  fallbackApplied?: boolean
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
