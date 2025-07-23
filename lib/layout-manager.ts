// 布局管理核心工具函数
// 提供设备检测、响应式配置、安全边距计算和容器尺寸计算功能

import { 
  getSpacingConfig, 
  calculateUIElementSpacing, 
  validateUIElementSpacing,
  adaptiveSpacingAdjustment,
  getCardAreaSpacing,
  validateCardAreaSpacing,
  type SpacingConfig,
  type SpacingValidationResult,
  type CardAreaSpacing,
  type CardAreaSpacingValidation
} from './spacing-system'
import { calculateLayoutWithPerformance } from './layout-performance'

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
  errors?: LayoutError[]
  warnings?: LayoutWarning[]
  fallbackApplied?: boolean
}

export interface LayoutError {
  code: string
  message: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  context?: any
  timestamp: number
}

export interface LayoutWarning {
  code: string
  message: string
  recommendation?: string
  context?: any
  timestamp: number
}

// 增强的布局计算结果接口
export interface EnhancedLayoutResult {
  availableWidth: number
  availableHeight: number
  actualCardsPerRow: number
  rows: number
  totalGridWidth: number
  totalGridHeight: number
  spacing: CardAreaSpacing
  deviceType: DeviceType
  isOptimal: boolean
  fallbackApplied?: boolean
}

// 增强的卡牌位置接口
export interface EnhancedCardPosition {
  x: number
  y: number
  rotation: number
  cardWidth: number
  cardHeight: number
  row: number
  col: number
  isLastRow: boolean
  isRowCentered: boolean
}

// 设备配置常量
const DEVICE_CONFIGS: Record<DeviceType, DeviceConfig> = {
  mobile: {
    type: 'mobile',
    breakpoint: 768,
    maxCards: 6,
    cardSize: { width: 80, height: 120 },
    spacing: 12,
    cardsPerRow: 2,
    minContainerWidth: 320,
    minContainerHeight: 400
  },
  tablet: {
    type: 'tablet',
    breakpoint: 1024,
    maxCards: 12,
    cardSize: { width: 88, height: 132 },
    spacing: 14,
    cardsPerRow: 3,
    minContainerWidth: 768,
    minContainerHeight: 600
  },
  desktop: {
    type: 'desktop',
    breakpoint: Infinity,
    maxCards: 20,
    cardSize: { width: 96, height: 144 },
    spacing: 16,
    cardsPerRow: 5,
    minContainerWidth: 1024,
    minContainerHeight: 700
  }
}

// UI元素高度常量
const UI_ELEMENT_HEIGHTS = {
  gameInfo: 120,        // 游戏信息面板高度
  gameStatus: 40,       // 游戏状态提示高度
  startButton: 80,      // 开始按钮区域高度
  resultDisplay: 100,   // 结果显示区域高度
  warnings: 60,         // 警告信息区域高度
  padding: 32           // 容器内边距
} as const

/**
 * 检测当前设备类型
 * @param containerWidth - 容器宽度，如果未提供则使用window.innerWidth
 * @returns 设备类型
 */
export function detectDeviceType(containerWidth?: number): DeviceType {
  const width = containerWidth ?? (typeof window !== 'undefined' ? window.innerWidth : 1024)
  
  if (width < DEVICE_CONFIGS.mobile.breakpoint) {
    return 'mobile'
  } else if (width < DEVICE_CONFIGS.tablet.breakpoint) {
    return 'tablet'
  } else {
    return 'desktop'
  }
}

/**
 * 获取设备配置
 * @param deviceType - 设备类型
 * @returns 设备配置对象
 */
export function getDeviceConfig(deviceType: DeviceType): DeviceConfig {
  return { ...DEVICE_CONFIGS[deviceType] }
}

/**
 * 获取响应式设备配置
 * @param containerWidth - 容器宽度
 * @returns 当前设备的配置
 */
export function getResponsiveDeviceConfig(containerWidth?: number): DeviceConfig {
  const deviceType = detectDeviceType(containerWidth)
  return getDeviceConfig(deviceType)
}

/**
 * 计算安全边距（使用动态间距系统和卡牌区域特定间距）
 * @param deviceType - 设备类型
 * @param options - UI选项
 * @returns 安全边距配置
 */
export function calculateSafeMargins(
  deviceType: DeviceType,
  options: {
    hasGameInfo?: boolean
    hasWarnings?: boolean
    hasStartButton?: boolean
    hasResultDisplay?: boolean
  } = {}
): SafeMargins {
  const {
    hasGameInfo = true,
    hasWarnings = false,
    hasStartButton = false,
    hasResultDisplay = false
  } = options

  // 获取动态间距配置和卡牌区域间距配置
  const spacingConfig = getSpacingConfig(deviceType)
  const cardAreaSpacing = getCardAreaSpacing(deviceType)
  
  // 使用卡牌区域特定的边距作为基础
  let top = cardAreaSpacing.containerMargins.top
  let bottom = cardAreaSpacing.containerMargins.bottom
  let left = cardAreaSpacing.containerMargins.left
  let right = cardAreaSpacing.containerMargins.right

  // 根据UI元素调整边距 - 使用动态UI元素间距
  if (hasGameInfo) {
    top += UI_ELEMENT_HEIGHTS.gameInfo + calculateUIElementSpacing(deviceType, 'gameInfo')
  }

  if (hasWarnings) {
    top += UI_ELEMENT_HEIGHTS.warnings + calculateUIElementSpacing(deviceType, 'warnings')
  }

  if (hasStartButton) {
    bottom += UI_ELEMENT_HEIGHTS.startButton + calculateUIElementSpacing(deviceType, 'startButton')
  }

  if (hasResultDisplay) {
    bottom += UI_ELEMENT_HEIGHTS.resultDisplay + calculateUIElementSpacing(deviceType, 'resultDisplay')
  }

  // 添加游戏状态提示的高度
  top += UI_ELEMENT_HEIGHTS.gameStatus + calculateUIElementSpacing(deviceType, 'gameStatus')

  const horizontal = left + right
  const vertical = top + bottom

  return {
    top,
    bottom,
    left,
    right,
    horizontal,
    vertical
  }
}

/**
 * 计算容器尺寸
 * @param actualWidth - 实际容器宽度
 * @param actualHeight - 实际容器高度
 * @param safeMargins - 安全边距
 * @returns 容器尺寸信息
 */
export function calculateContainerDimensions(
  actualWidth: number,
  actualHeight: number,
  safeMargins: SafeMargins
): ContainerDimensions {
  return {
    width: actualWidth,
    height: actualHeight,
    availableWidth: Math.max(0, actualWidth - safeMargins.horizontal),
    availableHeight: Math.max(0, actualHeight - safeMargins.vertical)
  }
}

/**
 * 计算最大安全卡牌数量
 * @param containerDimensions - 容器尺寸
 * @param deviceConfig - 设备配置
 * @returns 最大安全卡牌数量
 */
export function calculateMaxSafeCards(
  containerDimensions: ContainerDimensions,
  deviceConfig: DeviceConfig
): number {
  const { availableWidth, availableHeight } = containerDimensions
  const { cardSize, spacing, cardsPerRow } = deviceConfig

  // 计算可容纳的行数
  const maxRows = Math.floor((availableHeight + spacing) / (cardSize.height + spacing))
  
  // 计算每行实际可容纳的卡牌数
  const actualCardsPerRow = Math.min(
    cardsPerRow,
    Math.floor((availableWidth + spacing) / (cardSize.width + spacing))
  )

  // 总的最大卡牌数
  const maxCards = Math.max(0, maxRows * actualCardsPerRow)
  
  // 不超过设备限制
  return Math.min(maxCards, deviceConfig.maxCards)
}

/**
 * 计算推荐卡牌数量
 * @param requestedQuantity - 用户请求的数量
 * @param maxSafeCards - 最大安全卡牌数
 * @param itemCount - 可用项目数量
 * @returns 推荐的卡牌数量
 */
export function calculateRecommendedCards(
  requestedQuantity: number,
  maxSafeCards: number,
  itemCount: number
): number {
  // 确保不超过可用项目数
  const maxPossible = Math.min(maxSafeCards, itemCount)
  
  // 推荐数量至少是请求数量，但不超过最大可能数量
  const recommended = Math.min(
    Math.max(requestedQuantity, Math.ceil(requestedQuantity * 1.2)), // 增加20%的缓冲
    maxPossible
  )

  return Math.max(1, recommended) // 至少1张卡牌
}

/**
 * 验证容器是否满足最小要求
 * @param containerDimensions - 容器尺寸
 * @param deviceConfig - 设备配置
 * @returns 验证结果
 */
export function validateContainerSize(
  containerDimensions: ContainerDimensions,
  deviceConfig: DeviceConfig
): { isValid: boolean; error?: string } {
  const { width, height, availableWidth, availableHeight } = containerDimensions
  const { minContainerWidth, minContainerHeight, cardSize } = deviceConfig

  if (width < minContainerWidth) {
    return {
      isValid: false,
      error: `Container width (${width}px) is below minimum required (${minContainerWidth}px) for ${deviceConfig.type} devices`
    }
  }

  if (height < minContainerHeight) {
    return {
      isValid: false,
      error: `Container height (${height}px) is below minimum required (${minContainerHeight}px) for ${deviceConfig.type} devices`
    }
  }

  // 检查是否至少能容纳一张卡牌
  if (availableWidth < cardSize.width || availableHeight < cardSize.height) {
    return {
      isValid: false,
      error: `Available space (${availableWidth}x${availableHeight}px) is too small for card size (${cardSize.width}x${cardSize.height}px)`
    }
  }

  return { isValid: true }
}

/**
 * 创建安全降级配置
 */
function createFallbackConfig(deviceType: DeviceType): DeviceConfig {
  const baseConfig = getDeviceConfig(deviceType)
  return {
    ...baseConfig,
    maxCards: Math.max(1, Math.floor(baseConfig.maxCards * 0.5)), // 减少50%
    cardSize: {
      width: Math.max(60, baseConfig.cardSize.width * 0.8), // 缩小20%，最小60px
      height: Math.max(80, baseConfig.cardSize.height * 0.8) // 缩小20%，最小80px
    },
    spacing: Math.max(8, baseConfig.spacing * 0.75), // 减少25%，最小8px
    cardsPerRow: Math.max(1, baseConfig.cardsPerRow - 1) // 减少1列，最少1列
  }
}

/**
 * 添加错误到结果中
 */
function addError(
  result: LayoutCalculationResult,
  code: string,
  message: string,
  severity: LayoutError['severity'],
  context?: any
): void {
  if (!result.errors) result.errors = []
  result.errors.push({
    code,
    message,
    severity,
    context,
    timestamp: Date.now()
  })
}

/**
 * 添加警告到结果中
 */
function addWarning(
  result: LayoutCalculationResult,
  code: string,
  message: string,
  recommendation?: string,
  context?: any
): void {
  if (!result.warnings) result.warnings = []
  result.warnings.push({
    code,
    message,
    recommendation,
    context,
    timestamp: Date.now()
  })
}

/**
 * 内部布局计算函数（不带缓存）
 */
function calculateLayoutInternal(
  containerWidth: number,
  containerHeight: number,
  requestedQuantity: number,
  itemCount: number,
  uiOptions: {
    hasGameInfo?: boolean
    hasWarnings?: boolean
    hasStartButton?: boolean
    hasResultDisplay?: boolean
  } = {}
): LayoutCalculationResult {
  const errors: LayoutError[] = []
  const warnings: LayoutWarning[] = []
  let fallbackApplied = false

  try {
    // 输入验证
    if (containerWidth <= 0 || containerHeight <= 0) {
      throw new Error(`Invalid container dimensions: ${containerWidth}x${containerHeight}`)
    }

    if (requestedQuantity < 0 || itemCount < 0) {
      throw new Error(`Invalid quantities: requested=${requestedQuantity}, items=${itemCount}`)
    }

    // 获取设备配置
    let deviceConfig: DeviceConfig
    try {
      deviceConfig = getResponsiveDeviceConfig(containerWidth)
    } catch (error) {
      // 设备检测失败，使用降级配置
      deviceConfig = createFallbackConfig('desktop')
      fallbackApplied = true
      errors.push({
        code: 'DEVICE_DETECTION_FAILED',
        message: `设备检测失败，使用降级配置: ${error instanceof Error ? error.message : '未知错误'}`,
        severity: 'medium',
        context: { containerWidth, error },
        timestamp: Date.now()
      })
    }

    // 计算安全边距
    let safeMargins: SafeMargins
    try {
      safeMargins = calculateSafeMargins(deviceConfig.type, uiOptions)
    } catch (error) {
      // 边距计算失败，使用最小安全边距
      const minPadding = deviceConfig.type === 'mobile' ? 16 : 24
      safeMargins = {
        top: minPadding * 2,
        bottom: minPadding,
        left: minPadding,
        right: minPadding,
        horizontal: minPadding * 2,
        vertical: minPadding * 3
      }
      fallbackApplied = true
      errors.push({
        code: 'MARGIN_CALCULATION_FAILED',
        message: `边距计算失败，使用最小安全边距: ${error instanceof Error ? error.message : '未知错误'}`,
        severity: 'medium',
        context: { deviceType: deviceConfig.type, error },
        timestamp: Date.now()
      })
    }

    // 计算容器尺寸
    const containerDimensions = calculateContainerDimensions(
      containerWidth,
      containerHeight,
      safeMargins
    )

    // 验证容器尺寸
    const validation = validateContainerSize(containerDimensions, deviceConfig)
    if (!validation.isValid) {
      // 容器太小，尝试降级配置
      const fallbackConfig = createFallbackConfig(deviceConfig.type)
      const fallbackValidation = validateContainerSize(containerDimensions, fallbackConfig)
      
      if (fallbackValidation.isValid) {
        deviceConfig = fallbackConfig
        fallbackApplied = true
        warnings.push({
          code: 'CONTAINER_SIZE_WARNING',
          message: `容器尺寸不足，已应用降级配置: ${validation.error}`,
          recommendation: '考虑增加容器尺寸或减少UI元素',
          context: { originalConfig: getResponsiveDeviceConfig(containerWidth), fallbackConfig },
          timestamp: Date.now()
        })
      } else {
        errors.push({
          code: 'CONTAINER_TOO_SMALL',
          message: `容器尺寸过小，无法显示卡牌: ${validation.error}`,
          severity: 'critical',
          context: { containerDimensions, deviceConfig },
          timestamp: Date.now()
        })
      }
    }

    // 计算最大安全卡牌数
    let maxSafeCards: number
    try {
      maxSafeCards = calculateMaxSafeCards(containerDimensions, deviceConfig)
      
      if (maxSafeCards === 0) {
        // 无法容纳任何卡牌，强制至少显示1张
        maxSafeCards = 1
        fallbackApplied = true
        warnings.push({
          code: 'FORCE_MINIMUM_CARDS',
          message: '空间不足，强制显示至少1张卡牌',
          recommendation: '增加容器尺寸或减少UI元素',
          context: { containerDimensions, deviceConfig },
          timestamp: Date.now()
        })
      }
    } catch (error) {
      maxSafeCards = 1
      fallbackApplied = true
      errors.push({
        code: 'CARD_CALCULATION_FAILED',
        message: `卡牌数量计算失败，使用最小值1: ${error instanceof Error ? error.message : '未知错误'}`,
        severity: 'high',
        context: { error },
        timestamp: Date.now()
      })
    }

    // 计算推荐卡牌数
    let recommendedCards: number
    try {
      recommendedCards = calculateRecommendedCards(requestedQuantity, maxSafeCards, itemCount)
      
      // 检查推荐数量的合理性
      if (recommendedCards < requestedQuantity) {
        warnings.push({
          code: 'QUANTITY_REDUCED',
          message: `推荐数量 (${recommendedCards}) 少于请求数量 (${requestedQuantity})`,
          recommendation: '考虑增加容器尺寸或减少请求数量',
          context: { requestedQuantity, recommendedCards, maxSafeCards },
          timestamp: Date.now()
        })
      }

      if (recommendedCards > itemCount) {
        warnings.push({
          code: 'INSUFFICIENT_ITEMS',
          message: `推荐数量 (${recommendedCards}) 超过可用项目数 (${itemCount})`,
          recommendation: '增加列表项目或减少请求数量',
          context: { recommendedCards, itemCount },
          timestamp: Date.now()
        })
      }
    } catch (error) {
      recommendedCards = Math.min(requestedQuantity, maxSafeCards, itemCount, 1)
      fallbackApplied = true
      errors.push({
        code: 'RECOMMENDATION_FAILED',
        message: `推荐数量计算失败，使用安全值: ${error instanceof Error ? error.message : '未知错误'}`,
        severity: 'medium',
        context: { error, fallbackValue: recommendedCards },
        timestamp: Date.now()
      })
    }

    const result: LayoutCalculationResult = {
      deviceConfig,
      containerDimensions,
      safeMargins,
      maxSafeCards,
      recommendedCards,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
      fallbackApplied
    }

    return result

  } catch (error) {
    // 完全失败的降级处理
    const fallbackDeviceConfig = createFallbackConfig('mobile') // 使用最保守的移动端配置
    const minSafeMargins: SafeMargins = {
      top: 32, bottom: 16, left: 16, right: 16,
      horizontal: 32, vertical: 48
    }
    const fallbackContainerDimensions = calculateContainerDimensions(
      Math.max(320, containerWidth), 
      Math.max(400, containerHeight), 
      minSafeMargins
    )

    return {
      deviceConfig: fallbackDeviceConfig,
      containerDimensions: fallbackContainerDimensions,
      safeMargins: minSafeMargins,
      maxSafeCards: 1,
      recommendedCards: 1,
      errors: [{
        code: 'CRITICAL_CALCULATION_FAILURE',
        message: `布局计算完全失败，使用最小降级配置: ${error instanceof Error ? error.message : '未知错误'}`,
        severity: 'critical',
        context: { error, originalParams: { containerWidth, containerHeight, requestedQuantity, itemCount } },
        timestamp: Date.now()
      }],
      fallbackApplied: true
    }
  }
}

/**
 * 综合布局计算（带性能优化）
 * @param containerWidth - 容器宽度
 * @param containerHeight - 容器高度
 * @param requestedQuantity - 请求的卡牌数量
 * @param itemCount - 可用项目数量
 * @param uiOptions - UI选项
 * @returns 完整的布局计算结果
 */
export function calculateLayout(
  containerWidth: number,
  containerHeight: number,
  requestedQuantity: number,
  itemCount: number,
  uiOptions: {
    hasGameInfo?: boolean
    hasWarnings?: boolean
    hasStartButton?: boolean
    hasResultDisplay?: boolean
  } = {}
): LayoutCalculationResult {
  try {
    // 增强的输入验证
    if (!isValidContainerDimension(containerWidth, containerHeight)) {
      console.warn(`Invalid container dimensions: ${containerWidth}x${containerHeight}`)
      throw new Error(`Invalid container dimensions: ${containerWidth}x${containerHeight}`)
    }

    if (!Number.isInteger(requestedQuantity) || requestedQuantity < 0) {
      console.warn(`Invalid requested quantity: ${requestedQuantity}`)
      throw new Error(`Invalid requested quantity: ${requestedQuantity}`)
    }

    if (!Number.isInteger(itemCount) || itemCount < 0) {
      console.warn(`Invalid item count: ${itemCount}`)
      throw new Error(`Invalid item count: ${itemCount}`)
    }

    // 验证UI选项
    if (uiOptions && typeof uiOptions !== 'object') {
      console.warn('Invalid UI options, using defaults')
      uiOptions = {}
    }

    const deviceType = detectDeviceType(containerWidth)
    
    return calculateLayoutWithPerformance(
      calculateLayoutInternal,
      containerWidth,
      containerHeight,
      requestedQuantity,
      itemCount,
      uiOptions,
      deviceType
    )
    
  } catch (error) {
    console.error('Layout calculation failed, using fallback:', error)
    return createFallbackLayout(containerWidth, containerHeight, requestedQuantity)
  }
}

/**
 * 创建降级布局配置
 * @param containerWidth - 容器宽度
 * @param containerHeight - 容器高度
 * @param cardCount - 卡牌数量
 * @returns 降级布局结果
 */
export function createFallbackLayout(
  containerWidth: number, 
  containerHeight: number, 
  cardCount: number
): LayoutCalculationResult {
  const deviceType = detectDeviceType(containerWidth)
  const deviceConfig = getDeviceConfig(deviceType)
  
  // 使用保守的边距
  const safeMargins = {
    top: 100,
    bottom: 100,
    left: 50,
    right: 50,
    horizontal: 100,
    vertical: 200
  }
  
  const containerDimensions = {
    width: containerWidth,
    height: containerHeight,
    availableWidth: Math.max(200, containerWidth - 100),
    availableHeight: Math.max(200, containerHeight - 200)
  }
  
  return {
    deviceConfig,
    containerDimensions,
    safeMargins,
    maxSafeCards: Math.max(1, cardCount),
    recommendedCards: cardCount,
    fallbackApplied: true,
    warnings: [{
      code: 'FALLBACK_LAYOUT_APPLIED',
      message: 'Using fallback layout due to calculation error',
      recommendation: 'Check container dimensions and card count',
      timestamp: Date.now()
    }]
  }
}

/**
 * 验证容器尺寸是否有效
 * @param width - 容器宽度
 * @param height - 容器高度
 * @returns 是否有效
 */
export function isValidContainerDimension(width: number, height: number): boolean {
  return typeof width === 'number' && 
         typeof height === 'number' &&
         !isNaN(width) && 
         !isNaN(height) &&
         isFinite(width) && 
         isFinite(height) &&
         width > 0 && 
         height > 0 &&
         width < 50000 && 
         height < 50000 // 合理的上限
}

/**
 * 增强的卡牌布局计算（使用卡牌区域特定间距）
 * @param containerWidth - 容器宽度
 * @param containerHeight - 容器高度
 * @param cardCount - 卡牌数量
 * @param deviceType - 设备类型
 * @returns 增强的布局计算结果
 */
export function calculateEnhancedCardLayout(
  containerWidth: number,
  containerHeight: number,
  cardCount: number,
  deviceType: DeviceType
): EnhancedLayoutResult {
  try {
    const spacing = getCardAreaSpacing(deviceType)
    const deviceConfig = getDeviceConfig(deviceType)
    
    // 计算应用适当边距后的可用空间
    const availableWidth = containerWidth - spacing.containerMargins.left - spacing.containerMargins.right
    const availableHeight = containerHeight - spacing.containerMargins.top - spacing.containerMargins.bottom
    
    // 基于可用宽度计算最佳每行卡牌数
    const cardWidth = deviceConfig.cardSize.width
    const cardSpacing = spacing.cardSpacing
    
    const maxCardsPerRow = Math.floor((availableWidth + cardSpacing) / (cardWidth + cardSpacing))
    const actualCardsPerRow = Math.min(maxCardsPerRow, deviceConfig.cardsPerRow, cardCount)
    
    // 计算所需行数
    const rows = Math.ceil(cardCount / actualCardsPerRow)
    
    // 计算总网格尺寸
    const totalGridWidth = actualCardsPerRow * cardWidth + (actualCardsPerRow - 1) * cardSpacing
    const totalGridHeight = rows * deviceConfig.cardSize.height + (rows - 1) * spacing.rowSpacing
    
    // 确保网格适合可用空间
    if (totalGridWidth > availableWidth || totalGridHeight > availableHeight) {
      // 应用降级间距
      return calculateFallbackCardLayout(containerWidth, containerHeight, cardCount, deviceType)
    }
    
    return {
      availableWidth,
      availableHeight,
      actualCardsPerRow,
      rows,
      totalGridWidth,
      totalGridHeight,
      spacing,
      deviceType,
      isOptimal: true
    }
    
  } catch (error) {
    console.error('Enhanced card layout calculation failed:', error)
    return calculateFallbackCardLayout(containerWidth, containerHeight, cardCount, deviceType)
  }
}

/**
 * 创建降级卡牌布局
 * @param containerWidth - 容器宽度
 * @param containerHeight - 容器高度
 * @param cardCount - 卡牌数量
 * @param deviceType - 设备类型
 * @returns 降级布局结果
 */
function calculateFallbackCardLayout(
  containerWidth: number,
  containerHeight: number,
  cardCount: number,
  deviceType: DeviceType
): EnhancedLayoutResult {
  const deviceConfig = getDeviceConfig(deviceType)
  const spacing = getCardAreaSpacing(deviceType)
  
  // 使用更紧凑的间距
  const fallbackSpacing: CardAreaSpacing = {
    containerMargins: {
      top: Math.max(16, spacing.containerMargins.top * 0.7),
      bottom: Math.max(12, spacing.containerMargins.bottom * 0.7),
      left: Math.max(12, spacing.containerMargins.left * 0.7),
      right: Math.max(12, spacing.containerMargins.right * 0.7)
    },
    rowSpacing: Math.max(8, spacing.rowSpacing * 0.7),
    cardSpacing: Math.max(8, spacing.cardSpacing * 0.7),
    minCardAreaHeight: spacing.minCardAreaHeight * 0.8
  }
  
  const availableWidth = containerWidth - fallbackSpacing.containerMargins.left - fallbackSpacing.containerMargins.right
  const availableHeight = containerHeight - fallbackSpacing.containerMargins.top - fallbackSpacing.containerMargins.bottom
  
  // 简单的网格布局
  const actualCardsPerRow = Math.min(3, cardCount) // 最多3列
  const rows = Math.ceil(cardCount / actualCardsPerRow)
  
  const totalGridWidth = actualCardsPerRow * deviceConfig.cardSize.width + (actualCardsPerRow - 1) * fallbackSpacing.cardSpacing
  const totalGridHeight = rows * deviceConfig.cardSize.height + (rows - 1) * fallbackSpacing.rowSpacing
  
  return {
    availableWidth,
    availableHeight,
    actualCardsPerRow,
    rows,
    totalGridWidth,
    totalGridHeight,
    spacing: fallbackSpacing,
    deviceType,
    isOptimal: false,
    fallbackApplied: true
  }
}

/**
 * 计算多行卡牌位置（增强版，支持行居中和平衡布局）
 * @param cardCount - 卡牌数量
 * @param layoutResult - 增强布局结果
 * @returns 增强的卡牌位置数组
 */
export function calculateMultiRowCardPositions(
  cardCount: number,
  layoutResult: EnhancedLayoutResult
): EnhancedCardPosition[] {
  const positions: EnhancedCardPosition[] = []
  const { actualCardsPerRow, rows, spacing, totalGridWidth, totalGridHeight, deviceType } = layoutResult
  const deviceConfig = getDeviceConfig(deviceType)
  
  // 计算网格起始位置（在可用空间中居中）
  const gridStartX = -totalGridWidth / 2
  const gridStartY = -totalGridHeight / 2
  
  let cardIndex = 0
  
  for (let row = 0; row < rows && cardIndex < cardCount; row++) {
    // 计算当前行的卡牌数量
    const cardsInThisRow = Math.min(actualCardsPerRow, cardCount - row * actualCardsPerRow)
    const isLastRow = row === rows - 1
    const isRowCentered = cardsInThisRow < actualCardsPerRow
    
    // 计算当前行的宽度和起始X位置（用于居中对齐）
    const rowWidth = cardsInThisRow * deviceConfig.cardSize.width + (cardsInThisRow - 1) * spacing.cardSpacing
    const rowStartX = -rowWidth / 2  // 相对于容器中心居中
    
    // 计算当前行的Y位置
    const rowY = gridStartY + row * (deviceConfig.cardSize.height + spacing.rowSpacing)
    
    for (let col = 0; col < cardsInThisRow && cardIndex < cardCount; col++) {
      // 计算卡牌中心位置
      const cardX = rowStartX + col * (deviceConfig.cardSize.width + spacing.cardSpacing) + deviceConfig.cardSize.width / 2
      const cardY = rowY + deviceConfig.cardSize.height / 2
      
      positions.push({
        x: cardX,
        y: cardY,
        rotation: (Math.random() - 0.5) * 3, // 轻微随机旋转，增加自然感
        cardWidth: deviceConfig.cardSize.width,
        cardHeight: deviceConfig.cardSize.height,
        row,
        col,
        isLastRow,
        isRowCentered
      })
      
      cardIndex++
    }
  }
  
  return positions
}

/**
 * 验证多行卡牌位置的平衡性
 * @param positions - 卡牌位置数组
 * @param layoutResult - 布局结果
 * @returns 验证结果
 */
export function validateMultiRowBalance(
  positions: EnhancedCardPosition[],
  layoutResult: EnhancedLayoutResult
): {
  isBalanced: boolean
  issues: string[]
  recommendations: string[]
} {
  const result = {
    isBalanced: true,
    issues: [] as string[],
    recommendations: [] as string[]
  }
  
  if (positions.length === 0) {
    result.isBalanced = false
    result.issues.push('没有卡牌位置数据')
    return result
  }
  
  // 检查行分布
  const rowCounts: Record<number, number> = {}
  positions.forEach(pos => {
    rowCounts[pos.row] = (rowCounts[pos.row] || 0) + 1
  })
  
  const rows = Object.keys(rowCounts).map(Number).sort((a, b) => a - b)
  const lastRow = Math.max(...rows)
  
  // 验证最后一行是否居中
  const lastRowCount = rowCounts[lastRow]
  const maxRowCount = Math.max(...Object.values(rowCounts))
  
  if (lastRowCount < maxRowCount) {
    const lastRowPositions = positions.filter(pos => pos.row === lastRow)
    const isLastRowCentered = lastRowPositions.every(pos => pos.isRowCentered)
    
    if (!isLastRowCentered) {
      result.isBalanced = false
      result.issues.push('最后一行卡牌未正确居中')
      result.recommendations.push('确保少于满行的行能够水平居中')
    }
  }
  
  // 检查垂直间距
  if (rows.length > 1) {
    const expectedRowSpacing = layoutResult.spacing.rowSpacing
    for (let i = 1; i < rows.length; i++) {
      const prevRowPositions = positions.filter(pos => pos.row === rows[i - 1])
      const currentRowPositions = positions.filter(pos => pos.row === rows[i])
      
      if (prevRowPositions.length > 0 && currentRowPositions.length > 0) {
        const actualSpacing = currentRowPositions[0].y - prevRowPositions[0].y - layoutResult.spacing.rowSpacing
        const tolerance = 2 // 2px容差
        
        if (Math.abs(actualSpacing - expectedRowSpacing) > tolerance) {
          result.isBalanced = false
          result.issues.push(`行${i}的垂直间距不正确：期望${expectedRowSpacing}px，实际${actualSpacing.toFixed(1)}px`)
        }
      }
    }
  }
  
  // 检查边界
  const { availableWidth, availableHeight } = layoutResult
  const outOfBounds = positions.filter(pos => 
    Math.abs(pos.x) > availableWidth / 2 || 
    Math.abs(pos.y) > availableHeight / 2
  )
  
  if (outOfBounds.length > 0) {
    result.isBalanced = false
    result.issues.push(`${outOfBounds.length}张卡牌超出可用区域边界`)
    result.recommendations.push('减少卡牌数量或增加容器尺寸')
  }
  
  return result
}

/**
 * 计算考虑卡牌区域的UI元素间距
 * @param deviceType - 设备类型
 * @param hasMultipleRows - 是否有多行卡牌布局
 * @returns UI元素间距配置
 */
export function calculateUIElementSpacingWithCardArea(
  deviceType: DeviceType,
  hasMultipleRows: boolean
): {
  gameInfoToCardArea: number
  cardAreaToStartButton: number
  cardAreaToResult: number
  gameStatusToCardArea: number
} {
  const baseSpacing = getSpacingConfig(deviceType)
  const cardAreaSpacing = getCardAreaSpacing(deviceType)
  
  // 根据卡牌布局复杂度调整间距
  const complexityMultiplier = hasMultipleRows ? 1.2 : 1.0
  
  return {
    gameInfoToCardArea: Math.round(cardAreaSpacing.containerMargins.top * complexityMultiplier),
    cardAreaToStartButton: Math.round(cardAreaSpacing.containerMargins.bottom * complexityMultiplier),
    cardAreaToResult: Math.max(40, Math.round(baseSpacing.uiElementSpacing.resultDisplay * complexityMultiplier)),
    gameStatusToCardArea: Math.round(baseSpacing.uiElementSpacing.gameStatus * complexityMultiplier)
  }
}

/**
 * 验证增强布局的间距要求
 * @param layoutResult - 增强布局结果
 * @param containerWidth - 容器宽度
 * @param containerHeight - 容器高度
 * @param cardCount - 卡牌数量
 * @returns 间距验证结果
 */
export function validateEnhancedLayoutSpacing(
  layoutResult: EnhancedLayoutResult,
  containerWidth: number,
  containerHeight: number,
  cardCount: number
): CardAreaSpacingValidation {
  return validateCardAreaSpacing(
    layoutResult.deviceType,
    containerWidth,
    containerHeight,
    cardCount
  )
}

/**
 * 获取布局调试信息
 * @param layoutResult - 布局计算结果
 * @returns 调试信息字符串
 */
export function getLayoutDebugInfo(layoutResult: LayoutCalculationResult): string {
  const { deviceConfig, containerDimensions, safeMargins, maxSafeCards, recommendedCards } = layoutResult
  
  return [
    `Device: ${deviceConfig.type} (${containerDimensions.width}x${containerDimensions.height}px)`,
    `Available: ${containerDimensions.availableWidth}x${containerDimensions.availableHeight}px`,
    `Margins: T${safeMargins.top} B${safeMargins.bottom} L${safeMargins.left} R${safeMargins.right}`,
    `Card Size: ${deviceConfig.cardSize.width}x${deviceConfig.cardSize.height}px`,
    `Max Safe Cards: ${maxSafeCards}`,
    `Recommended: ${recommendedCards}`
  ].join(' | ')
}

/**
 * 响应式间距适配 - 根据屏幕尺寸和宽高比调整间距
 * @param containerWidth - 容器宽度
 * @param containerHeight - 容器高度
 * @param deviceType - 设备类型
 * @param cardCount - 卡牌数量
 * @returns 适配后的卡牌区域间距
 */
export function adaptiveCardAreaSpacing(
  containerWidth: number,
  containerHeight: number,
  deviceType: DeviceType,
  cardCount: number
): CardAreaSpacing {
  const baseSpacing = getCardAreaSpacing(deviceType)
  const aspectRatio = containerWidth / containerHeight
  
  // 检测超宽屏幕（宽高比 > 2.0）
  const isUltraWide = aspectRatio > 2.0
  // 检测窄屏幕（宽高比 < 0.8）
  const isNarrow = aspectRatio < 0.8
  // 检测小屏幕
  const isSmallScreen = containerWidth < 600 || containerHeight < 400
  
  let adaptedSpacing = { ...baseSpacing }
  
  // 超宽屏适配 - 防止卡牌过度分散
  if (isUltraWide) {
    // 增加左右边距，限制卡牌区域宽度
    const extraMargin = Math.min(containerWidth * 0.15, 100)
    adaptedSpacing.containerMargins.left += extraMargin
    adaptedSpacing.containerMargins.right += extraMargin
    
    // 适当增加卡牌间距，但不超过合理范围
    adaptedSpacing.cardSpacing = Math.min(adaptedSpacing.cardSpacing * 1.3, 24)
  }
  
  // 窄屏适配 - 确保最小可用空间
  if (isNarrow) {
    // 减少左右边距，但保持最小值
    const minMargin = deviceType === 'mobile' ? 12 : deviceType === 'tablet' ? 16 : 20
    adaptedSpacing.containerMargins.left = Math.max(minMargin, adaptedSpacing.containerMargins.left * 0.7)
    adaptedSpacing.containerMargins.right = Math.max(minMargin, adaptedSpacing.containerMargins.right * 0.7)
    
    // 减少卡牌间距，但保持最小值
    const minCardSpacing = deviceType === 'mobile' ? 8 : deviceType === 'tablet' ? 10 : 12
    adaptedSpacing.cardSpacing = Math.max(minCardSpacing, adaptedSpacing.cardSpacing * 0.8)
  }
  
  // 小屏幕适配
  if (isSmallScreen) {
    // 使用更紧凑的间距
    adaptedSpacing.containerMargins.top = Math.max(20, adaptedSpacing.containerMargins.top * 0.8)
    adaptedSpacing.containerMargins.bottom = Math.max(12, adaptedSpacing.containerMargins.bottom * 0.8)
    adaptedSpacing.rowSpacing = Math.max(8, adaptedSpacing.rowSpacing * 0.8)
  }
  
  // 多卡牌布局适配
  if (cardCount > 8) {
    // 对于大量卡牌，适当减少间距以确保合理布局
    adaptedSpacing.cardSpacing = Math.max(8, adaptedSpacing.cardSpacing * 0.9)
    adaptedSpacing.rowSpacing = Math.max(10, adaptedSpacing.rowSpacing * 0.9)
  }
  
  return adaptedSpacing
}

/**
 * 创建平滑的间距过渡配置
 * @param fromSpacing - 起始间距配置
 * @param toSpacing - 目标间距配置
 * @param progress - 过渡进度 (0-1)
 * @returns 插值后的间距配置
 */
export function interpolateSpacing(
  fromSpacing: CardAreaSpacing,
  toSpacing: CardAreaSpacing,
  progress: number
): CardAreaSpacing {
  const clampedProgress = Math.max(0, Math.min(1, progress))
  
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t
  
  return {
    containerMargins: {
      top: Math.round(lerp(fromSpacing.containerMargins.top, toSpacing.containerMargins.top, clampedProgress)),
      bottom: Math.round(lerp(fromSpacing.containerMargins.bottom, toSpacing.containerMargins.bottom, clampedProgress)),
      left: Math.round(lerp(fromSpacing.containerMargins.left, toSpacing.containerMargins.left, clampedProgress)),
      right: Math.round(lerp(fromSpacing.containerMargins.right, toSpacing.containerMargins.right, clampedProgress))
    },
    rowSpacing: Math.round(lerp(fromSpacing.rowSpacing, toSpacing.rowSpacing, clampedProgress)),
    cardSpacing: Math.round(lerp(fromSpacing.cardSpacing, toSpacing.cardSpacing, clampedProgress)),
    minCardAreaHeight: Math.round(lerp(fromSpacing.minCardAreaHeight, toSpacing.minCardAreaHeight, clampedProgress))
  }
}

/**
 * 验证响应式间距适配结果
 * @param adaptedSpacing - 适配后的间距
 * @param containerWidth - 容器宽度
 * @param containerHeight - 容器高度
 * @param deviceType - 设备类型
 * @returns 验证结果
 */
export function validateAdaptiveSpacing(
  adaptedSpacing: CardAreaSpacing,
  containerWidth: number,
  containerHeight: number,
  deviceType: DeviceType
): {
  isValid: boolean
  issues: string[]
  recommendations: string[]
} {
  const result = {
    isValid: true,
    issues: [] as string[],
    recommendations: [] as string[]
  }
  
  // 检查可用空间
  const availableWidth = containerWidth - adaptedSpacing.containerMargins.left - adaptedSpacing.containerMargins.right
  const availableHeight = containerHeight - adaptedSpacing.containerMargins.top - adaptedSpacing.containerMargins.bottom
  
  if (availableWidth < 200) {
    result.isValid = false
    result.issues.push(`可用宽度过小: ${availableWidth}px`)
    result.recommendations.push('减少左右边距或增加容器宽度')
  }
  
  if (availableHeight < 150) {
    result.isValid = false
    result.issues.push(`可用高度过小: ${availableHeight}px`)
    result.recommendations.push('减少上下边距或增加容器高度')
  }
  
  // 检查间距合理性
  const minSpacing = deviceType === 'mobile' ? 8 : deviceType === 'tablet' ? 10 : 12
  if (adaptedSpacing.cardSpacing < minSpacing) {
    result.issues.push(`卡牌间距过小: ${adaptedSpacing.cardSpacing}px`)
    result.recommendations.push(`建议卡牌间距至少${minSpacing}px`)
  }
  
  return result
}

/**
 * 获取增强布局调试信息
 * @param layoutResult - 增强布局计算结果
 * @returns 调试信息字符串
 */
export function getEnhancedLayoutDebugInfo(layoutResult: EnhancedLayoutResult): string {
  const { deviceType, actualCardsPerRow, rows, totalGridWidth, totalGridHeight, spacing, isOptimal } = layoutResult
  
  return [
    `Device: ${deviceType}`,
    `Grid: ${actualCardsPerRow}x${rows} (${totalGridWidth}x${totalGridHeight}px)`,
    `Margins: T${spacing.containerMargins.top} B${spacing.containerMargins.bottom} L${spacing.containerMargins.left} R${spacing.containerMargins.right}`,
    `Spacing: Row${spacing.rowSpacing} Card${spacing.cardSpacing}`,
    `Status: ${isOptimal ? 'Optimal' : 'Fallback'}`
  ].join(' | ')
}