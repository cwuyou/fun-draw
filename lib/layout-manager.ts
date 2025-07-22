// 布局管理核心工具函数
// 提供设备检测、响应式配置、安全边距计算和容器尺寸计算功能

import { 
  getSpacingConfig, 
  calculateUIElementSpacing, 
  validateUIElementSpacing,
  adaptiveSpacingAdjustment,
  type SpacingConfig,
  type SpacingValidationResult
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
 * 计算安全边距（使用动态间距系统）
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

  // 获取动态间距配置
  const spacingConfig = getSpacingConfig(deviceType)
  
  // 基础边距 - 使用动态计算的容器内边距
  let top = UI_ELEMENT_HEIGHTS.gameStatus + spacingConfig.containerPadding.y
  let bottom = spacingConfig.containerPadding.y

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

  // 添加卡牌区域间距
  top += calculateUIElementSpacing(deviceType, 'cardArea') / 2
  bottom += calculateUIElementSpacing(deviceType, 'cardArea') / 2

  const horizontal = spacingConfig.containerPadding.x
  const vertical = top + bottom

  return {
    top,
    bottom,
    left: horizontal,
    right: horizontal,
    horizontal: horizontal * 2,
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