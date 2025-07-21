// 卡牌游戏验证工具
import { ListItem } from '@/types'

export interface ValidationResult {
  isValid: boolean
  error?: string
  warnings?: string[]
}

export interface GameConfigValidation {
  quantity: number
  itemCount: number
  allowRepeat: boolean
  maxCards?: number
}

export interface PositionValidation {
  totalCards: number
  containerWidth?: number
  containerHeight?: number
  deviceType?: 'mobile' | 'tablet' | 'desktop'
}

// 数量验证错误类型
export enum QuantityValidationError {
  QUANTITY_TOO_LOW = 'Quantity must be at least 1',
  QUANTITY_TOO_HIGH = 'Quantity exceeds maximum allowed',
  QUANTITY_EXCEEDS_ITEMS = 'Quantity exceeds available items when repeat is disabled',
  QUANTITY_INVALID = 'Quantity must be a valid number'
}

// 位置计算错误类型
export enum PositionCalculationError {
  INVALID_CARD_COUNT = 'Invalid card count for position calculation',
  LAYOUT_OVERFLOW = 'Card layout would overflow container',
  CONTAINER_TOO_SMALL = 'Container is too small for the specified number of cards'
}

/**
 * 验证游戏配置
 */
export function validateGameConfig(config: GameConfigValidation): ValidationResult {
  const { quantity, itemCount, allowRepeat, maxCards = 10 } = config
  const warnings: string[] = []

  // 基本数量验证
  if (!Number.isInteger(quantity) || quantity < 1) {
    return {
      isValid: false,
      error: QuantityValidationError.QUANTITY_TOO_LOW
    }
  }

  if (quantity > maxCards) {
    return {
      isValid: false,
      error: QuantityValidationError.QUANTITY_TOO_HIGH
    }
  }

  // 项目数量验证
  if (itemCount <= 0) {
    return {
      isValid: false,
      error: 'Item list cannot be empty'
    }
  }

  // 不允许重复时的验证
  if (!allowRepeat && quantity > itemCount) {
    return {
      isValid: false,
      error: QuantityValidationError.QUANTITY_EXCEEDS_ITEMS
    }
  }

  // 添加警告
  if (quantity === itemCount && !allowRepeat) {
    warnings.push('All items will be selected as winners')
  }

  if (quantity > itemCount / 2 && allowRepeat) {
    warnings.push('High probability of duplicate winners')
  }

  return {
    isValid: true,
    warnings: warnings.length > 0 ? warnings : undefined
  }
}

/**
 * 验证项目列表
 */
export function validateItems(items: ListItem[]): ValidationResult {
  if (!Array.isArray(items)) {
    return {
      isValid: false,
      error: 'Items must be an array'
    }
  }

  if (items.length === 0) {
    return {
      isValid: false,
      error: 'Item list cannot be empty'
    }
  }

  // 检查项目格式
  const invalidItems = items.filter(item => 
    !item || 
    typeof item.name !== 'string' || 
    item.name.trim().length === 0
  )

  if (invalidItems.length > 0) {
    return {
      isValid: false,
      error: `Found ${invalidItems.length} invalid items with empty or missing names`
    }
  }

  // 检查重复项目
  const names = items.map(item => item.name.trim().toLowerCase())
  const duplicates = names.filter((name, index) => names.indexOf(name) !== index)
  
  const warnings: string[] = []
  if (duplicates.length > 0) {
    warnings.push(`Found duplicate item names: ${[...new Set(duplicates)].join(', ')}`)
  }

  return {
    isValid: true,
    warnings: warnings.length > 0 ? warnings : undefined
  }
}

/**
 * 验证位置计算参数
 */
export function validatePositionCalculation(config: PositionValidation): ValidationResult {
  const { totalCards, containerWidth, containerHeight, deviceType } = config

  if (!Number.isInteger(totalCards) || totalCards < 1) {
    return {
      isValid: false,
      error: PositionCalculationError.INVALID_CARD_COUNT
    }
  }

  if (totalCards > 20) {
    return {
      isValid: false,
      error: 'Too many cards for optimal display (maximum 20)'
    }
  }

  // 设备特定验证
  const deviceLimits = {
    mobile: { maxCards: 6, minWidth: 320, minHeight: 400 },
    tablet: { maxCards: 12, minWidth: 768, minHeight: 600 },
    desktop: { maxCards: 20, minWidth: 1024, minHeight: 700 }
  }

  if (deviceType && deviceLimits[deviceType]) {
    const limits = deviceLimits[deviceType]
    
    if (totalCards > limits.maxCards) {
      return {
        isValid: false,
        error: `Too many cards for ${deviceType} display (maximum ${limits.maxCards})`
      }
    }

    if (containerWidth && containerWidth < limits.minWidth) {
      return {
        isValid: false,
        error: PositionCalculationError.CONTAINER_TOO_SMALL
      }
    }

    if (containerHeight && containerHeight < limits.minHeight) {
      return {
        isValid: false,
        error: PositionCalculationError.CONTAINER_TOO_SMALL
      }
    }
  }

  return { isValid: true }
}

/**
 * 计算推荐的卡牌数量
 */
export function getRecommendedCardCount(
  itemCount: number, 
  quantity: number, 
  deviceType: 'mobile' | 'tablet' | 'desktop' = 'desktop'
): number {
  const deviceLimits = {
    mobile: 6,
    tablet: 12,
    desktop: 20
  }

  const maxForDevice = deviceLimits[deviceType]
  
  // 推荐数量应该是配置数量的合理倍数，但不超过设备限制
  const recommended = Math.min(
    Math.max(quantity, Math.ceil(quantity * 1.5)), // 至少是配置数量的1.5倍
    maxForDevice,
    itemCount // 不超过可用项目数
  )

  return recommended
}

/**
 * 验证音频配置
 */
export function validateAudioConfig(soundEnabled: boolean): ValidationResult {
  // 检查浏览器音频支持
  if (soundEnabled && typeof window !== 'undefined') {
    const hasAudioContext = !!(window.AudioContext || (window as any).webkitAudioContext)
    const hasAudioElement = !!window.HTMLAudioElement

    if (!hasAudioContext && !hasAudioElement) {
      return {
        isValid: false,
        error: 'Audio is not supported in this browser'
      }
    }

    if (!hasAudioContext) {
      return {
        isValid: true,
        warnings: ['Advanced audio features may not be available']
      }
    }
  }

  return { isValid: true }
}

/**
 * 综合验证游戏设置
 */
export function validateCompleteGameSetup(
  items: ListItem[],
  quantity: number,
  allowRepeat: boolean,
  soundEnabled: boolean,
  containerDimensions?: { width: number; height: number }
): ValidationResult {
  // 验证项目列表
  const itemsValidation = validateItems(items)
  if (!itemsValidation.isValid) {
    return itemsValidation
  }

  // 验证游戏配置
  const configValidation = validateGameConfig({
    quantity,
    itemCount: items.length,
    allowRepeat
  })
  if (!configValidation.isValid) {
    return configValidation
  }

  // 验证音频配置
  const audioValidation = validateAudioConfig(soundEnabled)
  if (!audioValidation.isValid) {
    return audioValidation
  }

  // 验证位置计算
  const deviceType = containerDimensions?.width 
    ? (containerDimensions.width < 768 ? 'mobile' : 
       containerDimensions.width < 1024 ? 'tablet' : 'desktop')
    : 'desktop'

  const positionValidation = validatePositionCalculation({
    totalCards: quantity,
    containerWidth: containerDimensions?.width,
    containerHeight: containerDimensions?.height,
    deviceType
  })
  if (!positionValidation.isValid) {
    return positionValidation
  }

  // 合并所有警告
  const allWarnings = [
    ...(itemsValidation.warnings || []),
    ...(configValidation.warnings || []),
    ...(audioValidation.warnings || []),
    ...(positionValidation.warnings || [])
  ]

  return {
    isValid: true,
    warnings: allWarnings.length > 0 ? allWarnings : undefined
  }
}