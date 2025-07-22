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
