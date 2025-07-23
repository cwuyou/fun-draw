// 动态间距计算系统
// 提供基于设备类型的响应式间距配置和UI元素间距验证功能

import { DeviceType } from '@/types'

export interface SpacingConfig {
  // 基础间距单位
  baseUnit: number
  
  // 组件间距
  componentSpacing: {
    xs: number    // 4px
    sm: number    // 8px
    md: number    // 16px
    lg: number    // 24px
    xl: number    // 32px
    xxl: number   // 48px
  }
  
  // 容器内边距
  containerPadding: {
    x: number     // 水平内边距
    y: number     // 垂直内边距
  }
  
  // UI元素间距
  uiElementSpacing: {
    gameInfo: number        // 游戏信息面板间距
    gameStatus: number      // 游戏状态提示间距
    startButton: number     // 开始按钮间距
    warnings: number        // 警告信息间距
    resultDisplay: number   // 结果显示间距
    cardArea: number        // 卡牌区域间距
  }
}

// 卡牌区域特定间距配置
export interface CardAreaSpacing {
  // 卡牌区域与容器边框的边距
  containerMargins: {
    top: number     // 顶部边距
    bottom: number  // 底部边距
    left: number    // 左侧边距
    right: number   // 右侧边距
  }
  
  // 卡牌行间距
  rowSpacing: number        // 多行卡牌之间的垂直间距
  
  // 卡牌间距
  cardSpacing: number       // 卡牌之间的水平间距
  
  // 最小卡牌区域高度
  minCardAreaHeight: number
}

export interface SpacingValidationResult {
  isValid: boolean
  warnings: string[]
  errors: string[]
  recommendations: string[]
}

// 卡牌区域间距验证结果
export interface CardAreaSpacingValidation {
  isValid: boolean
  violations: {
    containerMargins?: string[]
    rowSpacing?: string[]
    cardSpacing?: string[]
  }
  recommendations: string[]
  fallbackRequired: boolean
}

// 设备特定的卡牌区域间距配置
const DEVICE_CARD_AREA_SPACING: Record<DeviceType, CardAreaSpacing> = {
  mobile: {
    containerMargins: {
      top: 30,    // 游戏信息面板到卡牌区域间距
      bottom: 16, // 卡牌区域到开始按钮间距
      left: 16,   // 左侧边距
      right: 16   // 右侧边距
    },
    rowSpacing: 12,        // 行间距
    cardSpacing: 12,       // 卡牌间距
    minCardAreaHeight: 160 // 最小卡牌区域高度
  },
  tablet: {
    containerMargins: {
      top: 32,    // 游戏信息面板到卡牌区域间距
      bottom: 20, // 卡牌区域到开始按钮间距
      left: 24,   // 左侧边距
      right: 24   // 右侧边距
    },
    rowSpacing: 16,        // 行间距
    cardSpacing: 14,       // 卡牌间距
    minCardAreaHeight: 180 // 最小卡牌区域高度
  },
  desktop: {
    containerMargins: {
      top: 36,    // 游戏信息面板到卡牌区域间距
      bottom: 24, // 卡牌区域到开始按钮间距
      left: 32,   // 左侧边距
      right: 32   // 右侧边距
    },
    rowSpacing: 20,        // 行间距
    cardSpacing: 16,       // 卡牌间距
    minCardAreaHeight: 200 // 最小卡牌区域高度
  }
}

// 设备特定的间距配置
const DEVICE_SPACING_CONFIGS: Record<DeviceType, SpacingConfig> = {
  mobile: {
    baseUnit: 4,
    componentSpacing: {
      xs: 4,
      sm: 8,
      md: 12,
      lg: 16,
      xl: 20,
      xxl: 24
    },
    containerPadding: {
      x: 16,
      y: 16
    },
    uiElementSpacing: {
      gameInfo: 30,        // 确保至少30px间距
      gameStatus: 8,
      startButton: 16,
      warnings: 8,
      resultDisplay: 40,   // 确保中奖信息与卡牌区域有至少40px间距
      cardArea: 20
    }
  },
  tablet: {
    baseUnit: 4,
    componentSpacing: {
      xs: 4,
      sm: 8,
      md: 16,
      lg: 24,
      xl: 32,
      xxl: 40
    },
    containerPadding: {
      x: 24,
      y: 24
    },
    uiElementSpacing: {
      gameInfo: 32,        // 确保至少30px间距，平板端稍大
      gameStatus: 12,
      startButton: 20,
      warnings: 12,
      resultDisplay: 40,   // 确保中奖信息与卡牌区域有至少40px间距
      cardArea: 24
    }
  },
  desktop: {
    baseUnit: 4,
    componentSpacing: {
      xs: 4,
      sm: 8,
      md: 16,
      lg: 24,
      xl: 32,
      xxl: 48
    },
    containerPadding: {
      x: 32,
      y: 32
    },
    uiElementSpacing: {
      gameInfo: 36,        // 确保至少30px间距，桌面端更大
      gameStatus: 16,
      startButton: 24,
      warnings: 16,
      resultDisplay: 40,   // 确保中奖信息与卡牌区域有至少40px间距
      cardArea: 32
    }
  }
}

/**
 * 获取设备特定的间距配置
 * @param deviceType - 设备类型
 * @returns 间距配置对象
 */
export function getSpacingConfig(deviceType: DeviceType): SpacingConfig {
  return { ...DEVICE_SPACING_CONFIGS[deviceType] }
}

/**
 * 获取设备特定的卡牌区域间距配置
 * @param deviceType - 设备类型
 * @returns 卡牌区域间距配置对象
 */
export function getCardAreaSpacing(deviceType: DeviceType): CardAreaSpacing {
  return { ...DEVICE_CARD_AREA_SPACING[deviceType] }
}

/**
 * 计算响应式间距值
 * @param deviceType - 设备类型
 * @param spacingKey - 间距键名
 * @returns 计算后的间距值（像素）
 */
export function calculateResponsiveSpacing(
  deviceType: DeviceType,
  spacingKey: keyof SpacingConfig['componentSpacing']
): number {
  const config = getSpacingConfig(deviceType)
  return config.componentSpacing[spacingKey]
}

/**
 * 计算UI元素间距
 * @param deviceType - 设备类型
 * @param elementType - UI元素类型
 * @returns 计算后的间距值（像素）
 */
export function calculateUIElementSpacing(
  deviceType: DeviceType,
  elementType: keyof SpacingConfig['uiElementSpacing']
): number {
  const config = getSpacingConfig(deviceType)
  return config.uiElementSpacing[elementType]
}

/**
 * 计算容器内边距
 * @param deviceType - 设备类型
 * @returns 容器内边距配置
 */
export function calculateContainerPadding(deviceType: DeviceType): {
  x: number
  y: number
  horizontal: string
  vertical: string
  all: string
} {
  const config = getSpacingConfig(deviceType)
  const { x, y } = config.containerPadding
  
  return {
    x,
    y,
    horizontal: `${x}px`,
    vertical: `${y}px`,
    all: `${y}px ${x}px`
  }
}

/**
 * 生成动态CSS类名
 * @param deviceType - 设备类型
 * @param spacingType - 间距类型
 * @returns CSS类名字符串
 */
export function generateDynamicSpacingClasses(
  deviceType: DeviceType,
  spacingType: 'container' | 'component' | 'ui-element'
): Record<string, string> {
  const config = getSpacingConfig(deviceType)
  
  switch (spacingType) {
    case 'container':
      return {
        padding: `p-[${config.containerPadding.y}px] px-[${config.containerPadding.x}px]`,
        paddingX: `px-[${config.containerPadding.x}px]`,
        paddingY: `py-[${config.containerPadding.y}px]`
      }
    
    case 'component':
      return {
        spaceY: `space-y-[${config.componentSpacing.md}px]`,
        gap: `gap-[${config.componentSpacing.md}px]`,
        marginBottom: `mb-[${config.componentSpacing.lg}px]`
      }
    
    case 'ui-element':
      return {
        gameInfo: `mb-[${config.uiElementSpacing.gameInfo}px]`,
        gameStatus: `mb-[${config.uiElementSpacing.gameStatus}px]`,
        startButton: `mb-[${config.uiElementSpacing.startButton}px]`,
        warnings: `mb-[${config.uiElementSpacing.warnings}px]`,
        resultDisplay: `mt-[${config.uiElementSpacing.resultDisplay}px]`,
        cardArea: `my-[${config.uiElementSpacing.cardArea}px]`
      }
    
    default:
      return {}
  }
}

/**
 * 验证UI元素间距配置
 * @param deviceType - 设备类型
 * @param containerHeight - 容器高度
 * @param uiElements - UI元素配置
 * @returns 验证结果
 */
export function validateUIElementSpacing(
  deviceType: DeviceType,
  containerHeight: number,
  uiElements: {
    hasGameInfo?: boolean
    hasWarnings?: boolean
    hasStartButton?: boolean
    hasResultDisplay?: boolean
    cardAreaMinHeight?: number
  }
): SpacingValidationResult {
  const config = getSpacingConfig(deviceType)
  const result: SpacingValidationResult = {
    isValid: true,
    warnings: [],
    errors: [],
    recommendations: []
  }
  
  // 计算所需的总高度
  let totalRequiredHeight = 0
  
  // 基础容器内边距
  totalRequiredHeight += config.containerPadding.y * 2
  
  // UI元素高度和间距
  if (uiElements.hasGameInfo) {
    totalRequiredHeight += 120 + config.uiElementSpacing.gameInfo // 游戏信息面板
  }
  
  totalRequiredHeight += 40 + config.uiElementSpacing.gameStatus // 游戏状态提示
  
  if (uiElements.hasStartButton) {
    totalRequiredHeight += 80 + config.uiElementSpacing.startButton // 开始按钮
  }
  
  if (uiElements.hasWarnings) {
    totalRequiredHeight += 60 + config.uiElementSpacing.warnings // 警告信息
  }
  
  if (uiElements.hasResultDisplay) {
    totalRequiredHeight += 100 + config.uiElementSpacing.resultDisplay // 结果显示
  }
  
  // 卡牌区域最小高度
  const cardAreaMinHeight = uiElements.cardAreaMinHeight || 300
  totalRequiredHeight += cardAreaMinHeight + config.uiElementSpacing.cardArea
  
  // 验证容器高度是否足够
  if (totalRequiredHeight > containerHeight) {
    result.isValid = false
    result.errors.push(
      `容器高度不足：需要 ${totalRequiredHeight}px，实际 ${containerHeight}px`
    )
    
    // 提供建议
    if (deviceType === 'mobile') {
      result.recommendations.push('考虑减少UI元素或使用更紧凑的布局')
    } else {
      result.recommendations.push('考虑增加容器高度或优化间距配置')
    }
  }
  
  // 检查间距是否过小
  const minSpacing = deviceType === 'mobile' ? 8 : deviceType === 'tablet' ? 12 : 16
  Object.entries(config.uiElementSpacing).forEach(([key, value]) => {
    if (value < minSpacing) {
      result.warnings.push(`${key} 间距可能过小 (${value}px < ${minSpacing}px)`)
    }
  })
  
  // 检查间距是否过大
  const maxSpacing = deviceType === 'mobile' ? 24 : deviceType === 'tablet' ? 32 : 48
  Object.entries(config.uiElementSpacing).forEach(([key, value]) => {
    if (value > maxSpacing) {
      result.warnings.push(`${key} 间距可能过大 (${value}px > ${maxSpacing}px)`)
    }
  })
  
  return result
}

/**
 * 自适应间距调整
 * @param deviceType - 设备类型
 * @param containerHeight - 容器高度
 * @param availableHeight - 可用高度
 * @returns 调整后的间距配置
 */
export function adaptiveSpacingAdjustment(
  deviceType: DeviceType,
  containerHeight: number,
  availableHeight: number
): SpacingConfig {
  const baseConfig = getSpacingConfig(deviceType)
  
  // 如果可用高度充足，返回基础配置
  if (availableHeight >= containerHeight * 0.8) {
    return baseConfig
  }
  
  // 计算压缩比例
  const compressionRatio = Math.max(0.6, availableHeight / containerHeight)
  
  // 创建调整后的配置
  const adjustedConfig: SpacingConfig = {
    ...baseConfig,
    uiElementSpacing: {
      gameInfo: Math.max(30, Math.round(baseConfig.uiElementSpacing.gameInfo * compressionRatio)), // 确保至少30px
      gameStatus: Math.max(4, Math.round(baseConfig.uiElementSpacing.gameStatus * compressionRatio)),
      startButton: Math.max(8, Math.round(baseConfig.uiElementSpacing.startButton * compressionRatio)),
      warnings: Math.max(4, Math.round(baseConfig.uiElementSpacing.warnings * compressionRatio)),
      resultDisplay: Math.max(40, Math.round(baseConfig.uiElementSpacing.resultDisplay * compressionRatio)), // 确保至少40px间距
      cardArea: Math.max(12, Math.round(baseConfig.uiElementSpacing.cardArea * compressionRatio))
    },
    containerPadding: {
      x: Math.max(8, Math.round(baseConfig.containerPadding.x * compressionRatio)),
      y: Math.max(8, Math.round(baseConfig.containerPadding.y * compressionRatio))
    }
  }
  
  return adjustedConfig
}

/**
 * 验证卡牌区域间距配置
 * @param deviceType - 设备类型
 * @param containerWidth - 容器宽度
 * @param containerHeight - 容器高度
 * @param cardCount - 卡牌数量
 * @returns 验证结果
 */
export function validateCardAreaSpacing(
  deviceType: DeviceType,
  containerWidth: number,
  containerHeight: number,
  cardCount: number
): CardAreaSpacingValidation {
  const cardAreaSpacing = getCardAreaSpacing(deviceType)
  const result: CardAreaSpacingValidation = {
    isValid: true,
    violations: {},
    recommendations: [],
    fallbackRequired: false
  }

  // 验证容器边距
  const minMargins = deviceType === 'mobile' ? 16 : deviceType === 'tablet' ? 24 : 32
  const margins = cardAreaSpacing.containerMargins
  
  if (margins.left < minMargins || margins.right < minMargins) {
    result.isValid = false
    if (!result.violations.containerMargins) result.violations.containerMargins = []
    result.violations.containerMargins.push(`水平边距不足：需要至少${minMargins}px，实际左${margins.left}px右${margins.right}px`)
  }

  if (margins.top < minMargins || margins.bottom < minMargins) {
    result.isValid = false
    if (!result.violations.containerMargins) result.violations.containerMargins = []
    result.violations.containerMargins.push(`垂直边距不足：需要至少${minMargins}px，实际上${margins.top}px下${margins.bottom}px`)
  }

  // 验证行间距
  const minRowSpacing = deviceType === 'mobile' ? 12 : deviceType === 'tablet' ? 16 : 20
  if (cardAreaSpacing.rowSpacing < minRowSpacing) {
    result.isValid = false
    if (!result.violations.rowSpacing) result.violations.rowSpacing = []
    result.violations.rowSpacing.push(`行间距不足：需要至少${minRowSpacing}px，实际${cardAreaSpacing.rowSpacing}px`)
  }

  // 验证卡牌间距
  const minCardSpacing = deviceType === 'mobile' ? 12 : deviceType === 'tablet' ? 14 : 16
  if (cardAreaSpacing.cardSpacing < minCardSpacing) {
    result.isValid = false
    if (!result.violations.cardSpacing) result.violations.cardSpacing = []
    result.violations.cardSpacing.push(`卡牌间距不足：需要至少${minCardSpacing}px，实际${cardAreaSpacing.cardSpacing}px`)
  }

  // 检查可用空间是否足够
  const availableWidth = containerWidth - margins.left - margins.right
  const availableHeight = containerHeight - margins.top - margins.bottom

  if (availableWidth < cardAreaSpacing.minCardAreaHeight || availableHeight < cardAreaSpacing.minCardAreaHeight) {
    result.fallbackRequired = true
    result.recommendations.push('容器空间不足，建议使用降级间距配置')
  }

  // 提供优化建议
  if (!result.isValid) {
    result.recommendations.push('考虑增加容器尺寸或使用更紧凑的间距配置')
    if (cardCount > 6) {
      result.recommendations.push('对于多卡牌布局，建议优化间距以提供更好的视觉体验')
    }
  }

  return result
}

/**
 * 获取间距调试信息
 * @param deviceType - 设备类型
 * @param config - 间距配置（可选，默认使用设备配置）
 * @returns 调试信息字符串
 */
export function getSpacingDebugInfo(
  deviceType: DeviceType,
  config?: SpacingConfig
): string {
  const spacingConfig = config || getSpacingConfig(deviceType)
  
  return [
    `Device: ${deviceType}`,
    `Base Unit: ${spacingConfig.baseUnit}px`,
    `Container Padding: ${spacingConfig.containerPadding.x}x${spacingConfig.containerPadding.y}px`,
    `Component Spacing: ${spacingConfig.componentSpacing.md}px`,
    `UI Elements: ${Object.entries(spacingConfig.uiElementSpacing).map(([k, v]) => `${k}:${v}`).join(', ')}`
  ].join(' | ')
}

/**
 * 综合间距验证 - 验证所有间距配置的一致性和合理性
 * @param deviceType - 设备类型
 * @param containerWidth - 容器宽度
 * @param containerHeight - 容器高度
 * @param cardCount - 卡牌数量
 * @param uiElements - UI元素配置
 * @returns 综合验证结果
 */
export function validateAllSpacing(
  deviceType: DeviceType,
  containerWidth: number,
  containerHeight: number,
  cardCount: number,
  uiElements: {
    hasGameInfo?: boolean
    hasWarnings?: boolean
    hasStartButton?: boolean
    hasResultDisplay?: boolean
    cardAreaMinHeight?: number
  } = {}
): {
  isValid: boolean
  uiElementValidation: SpacingValidationResult
  cardAreaValidation: CardAreaSpacingValidation
  overallIssues: string[]
  recommendations: string[]
} {
  const uiElementValidation = validateUIElementSpacing(deviceType, containerHeight, uiElements)
  const cardAreaValidation = validateCardAreaSpacing(deviceType, containerWidth, containerHeight, cardCount)
  
  const overallIssues: string[] = []
  const recommendations: string[] = []
  
  // 检查UI元素和卡牌区域间距的兼容性
  const spacingConfig = getSpacingConfig(deviceType)
  const cardAreaSpacing = getCardAreaSpacing(deviceType)
  
  // 验证总体布局是否合理
  const totalRequiredHeight = 
    cardAreaSpacing.containerMargins.top + 
    cardAreaSpacing.containerMargins.bottom + 
    cardAreaSpacing.minCardAreaHeight +
    (uiElements.hasGameInfo ? 120 + spacingConfig.uiElementSpacing.gameInfo : 0) +
    (uiElements.hasStartButton ? 80 + spacingConfig.uiElementSpacing.startButton : 0) +
    (uiElements.hasResultDisplay ? 100 + spacingConfig.uiElementSpacing.resultDisplay : 0)
  
  if (totalRequiredHeight > containerHeight * 1.2) {
    overallIssues.push(`总体布局可能过于拥挤：需要${totalRequiredHeight}px，容器${containerHeight}px`)
    recommendations.push('考虑简化UI元素或增加容器高度')
  }
  
  // 检查间距比例是否合理
  const cardAreaRatio = (cardAreaSpacing.containerMargins.left + cardAreaSpacing.containerMargins.right) / containerWidth
  if (cardAreaRatio > 0.4) {
    overallIssues.push(`卡牌区域边距占比过高：${(cardAreaRatio * 100).toFixed(1)}%`)
    recommendations.push('减少卡牌区域边距或增加容器宽度')
  }
  
  const isValid = uiElementValidation.isValid && cardAreaValidation.isValid && overallIssues.length === 0
  
  return {
    isValid,
    uiElementValidation,
    cardAreaValidation,
    overallIssues,
    recommendations: [...recommendations, ...uiElementValidation.recommendations, ...cardAreaValidation.recommendations]
  }
}

/**
 * 间距测量验证 - 验证实际测量值是否符合配置
 * @param measuredSpacing - 实际测量的间距值
 * @param expectedSpacing - 期望的间距配置
 * @param tolerance - 容差范围（像素）
 * @returns 测量验证结果
 */
export function validateSpacingMeasurements(
  measuredSpacing: {
    containerMargins: { top: number; bottom: number; left: number; right: number }
    rowSpacing?: number
    cardSpacing?: number
  },
  expectedSpacing: CardAreaSpacing,
  tolerance: number = 2
): {
  isValid: boolean
  discrepancies: string[]
  maxDeviation: number
} {
  const discrepancies: string[] = []
  let maxDeviation = 0
  
  // 检查容器边距
  const margins = [
    { name: 'top', measured: measuredSpacing.containerMargins.top, expected: expectedSpacing.containerMargins.top },
    { name: 'bottom', measured: measuredSpacing.containerMargins.bottom, expected: expectedSpacing.containerMargins.bottom },
    { name: 'left', measured: measuredSpacing.containerMargins.left, expected: expectedSpacing.containerMargins.left },
    { name: 'right', measured: measuredSpacing.containerMargins.right, expected: expectedSpacing.containerMargins.right }
  ]
  
  margins.forEach(({ name, measured, expected }) => {
    const deviation = Math.abs(measured - expected)
    maxDeviation = Math.max(maxDeviation, deviation)
    
    if (deviation > tolerance) {
      discrepancies.push(`${name}边距偏差：期望${expected}px，实际${measured}px，偏差${deviation}px`)
    }
  })
  
  // 检查行间距
  if (measuredSpacing.rowSpacing !== undefined) {
    const deviation = Math.abs(measuredSpacing.rowSpacing - expectedSpacing.rowSpacing)
    maxDeviation = Math.max(maxDeviation, deviation)
    
    if (deviation > tolerance) {
      discrepancies.push(`行间距偏差：期望${expectedSpacing.rowSpacing}px，实际${measuredSpacing.rowSpacing}px，偏差${deviation}px`)
    }
  }
  
  // 检查卡牌间距
  if (measuredSpacing.cardSpacing !== undefined) {
    const deviation = Math.abs(measuredSpacing.cardSpacing - expectedSpacing.cardSpacing)
    maxDeviation = Math.max(maxDeviation, deviation)
    
    if (deviation > tolerance) {
      discrepancies.push(`卡牌间距偏差：期望${expectedSpacing.cardSpacing}px，实际${measuredSpacing.cardSpacing}px，偏差${deviation}px`)
    }
  }
  
  return {
    isValid: discrepancies.length === 0,
    discrepancies,
    maxDeviation
  }
}

/**
 * 开发模式调试工具 - 生成详细的间距调试报告
 * @param deviceType - 设备类型
 * @param containerWidth - 容器宽度
 * @param containerHeight - 容器高度
 * @param cardCount - 卡牌数量
 * @returns 详细调试报告
 */
export function generateSpacingDebugReport(
  deviceType: DeviceType,
  containerWidth: number,
  containerHeight: number,
  cardCount: number
): {
  summary: string
  details: {
    deviceInfo: string
    spacingConfig: string
    cardAreaSpacing: string
    validation: string
    recommendations: string[]
  }
  timestamp: number
} {
  const spacingConfig = getSpacingConfig(deviceType)
  const cardAreaSpacing = getCardAreaSpacing(deviceType)
  const validation = validateAllSpacing(deviceType, containerWidth, containerHeight, cardCount)
  
  const summary = `${deviceType.toUpperCase()} | ${containerWidth}x${containerHeight} | ${cardCount} cards | ${validation.isValid ? 'VALID' : 'ISSUES'}`
  
  const details = {
    deviceInfo: `Device: ${deviceType}, Container: ${containerWidth}x${containerHeight}px, Cards: ${cardCount}`,
    spacingConfig: getSpacingDebugInfo(deviceType, spacingConfig),
    cardAreaSpacing: getCardAreaSpacingDebugInfo(deviceType),
    validation: `Valid: ${validation.isValid}, Issues: ${validation.overallIssues.length}, UI Issues: ${validation.uiElementValidation.errors.length}, Card Area Issues: ${Object.keys(validation.cardAreaValidation.violations).length}`,
    recommendations: validation.recommendations
  }
  
  return {
    summary,
    details,
    timestamp: Date.now()
  }
}

/**
 * 间距错误处理和降级值生成
 * @param deviceType - 设备类型
 * @param errorContext - 错误上下文
 * @returns 安全的降级间距配置
 */
export function createFallbackSpacing(
  deviceType: DeviceType,
  errorContext?: {
    containerWidth?: number
    containerHeight?: number
    originalError?: Error
  }
): CardAreaSpacing {
  // 使用最保守的间距配置
  const minMargins = deviceType === 'mobile' ? 12 : deviceType === 'tablet' ? 16 : 20
  const minSpacing = deviceType === 'mobile' ? 8 : deviceType === 'tablet' ? 10 : 12
  
  const fallbackSpacing: CardAreaSpacing = {
    containerMargins: {
      top: minMargins * 1.5,
      bottom: minMargins,
      left: minMargins,
      right: minMargins
    },
    rowSpacing: minSpacing,
    cardSpacing: minSpacing,
    minCardAreaHeight: deviceType === 'mobile' ? 120 : deviceType === 'tablet' ? 140 : 160
  }
  
  // 如果有容器尺寸信息，进行适当调整
  if (errorContext?.containerWidth && errorContext?.containerHeight) {
    const { containerWidth, containerHeight } = errorContext
    
    // 确保边距不超过容器的30%
    const maxHorizontalMargin = containerWidth * 0.15
    const maxVerticalMargin = containerHeight * 0.1
    
    fallbackSpacing.containerMargins.left = Math.min(fallbackSpacing.containerMargins.left, maxHorizontalMargin)
    fallbackSpacing.containerMargins.right = Math.min(fallbackSpacing.containerMargins.right, maxHorizontalMargin)
    fallbackSpacing.containerMargins.top = Math.min(fallbackSpacing.containerMargins.top, maxVerticalMargin)
    fallbackSpacing.containerMargins.bottom = Math.min(fallbackSpacing.containerMargins.bottom, maxVerticalMargin)
  }
  
  if (process.env.NODE_ENV === 'development' && errorContext?.originalError) {
    console.warn('Using fallback spacing due to error:', errorContext.originalError)
    console.log('Fallback spacing:', fallbackSpacing)
  }
  
  return fallbackSpacing
}

/**
 * 获取卡牌区域间距调试信息
 * @param deviceType - 设备类型
 * @returns 调试信息字符串
 */
export function getCardAreaSpacingDebugInfo(deviceType: DeviceType): string {
  const cardAreaSpacing = getCardAreaSpacing(deviceType)
  
  return [
    `Device: ${deviceType}`,
    `Container Margins: T${cardAreaSpacing.containerMargins.top} B${cardAreaSpacing.containerMargins.bottom} L${cardAreaSpacing.containerMargins.left} R${cardAreaSpacing.containerMargins.right}`,
    `Row Spacing: ${cardAreaSpacing.rowSpacing}px`,
    `Card Spacing: ${cardAreaSpacing.cardSpacing}px`,
    `Min Height: ${cardAreaSpacing.minCardAreaHeight}px`
  ].join(' | ')
}

/**
 * 开发模式间距调试显示工具
 * 在开发环境中显示详细的间距信息
 */
export interface SpacingDebugDisplay {
  enabled: boolean
  showOverlay: boolean
  showMeasurements: boolean
  showViolations: boolean
  logToConsole: boolean
}

/**
 * 创建开发模式间距调试显示配置
 * @param options - 调试显示选项
 * @returns 调试显示配置
 */
export function createSpacingDebugDisplay(
  options: Partial<SpacingDebugDisplay> = {}
): SpacingDebugDisplay {
  const isDevelopment = process.env.NODE_ENV === 'development'
  
  return {
    enabled: isDevelopment && (options.enabled ?? true),
    showOverlay: options.showOverlay ?? false,
    showMeasurements: options.showMeasurements ?? true,
    showViolations: options.showViolations ?? true,
    logToConsole: options.logToConsole ?? true
  }
}

/**
 * 在开发模式下显示间距调试信息
 * @param deviceType - 设备类型
 * @param containerWidth - 容器宽度
 * @param containerHeight - 容器高度
 * @param cardCount - 卡牌数量
 * @param debugDisplay - 调试显示配置
 */
export function displaySpacingDebugInfo(
  deviceType: DeviceType,
  containerWidth: number,
  containerHeight: number,
  cardCount: number,
  debugDisplay: SpacingDebugDisplay = createSpacingDebugDisplay()
): void {
  if (!debugDisplay.enabled) return

  const report = generateSpacingDebugReport(deviceType, containerWidth, containerHeight, cardCount)
  
  if (debugDisplay.logToConsole) {
    console.group('🎯 Spacing Debug Report')
    console.log('📊 Summary:', report.summary)
    console.log('📱 Device Info:', report.details.deviceInfo)
    console.log('📏 Spacing Config:', report.details.spacingConfig)
    console.log('🎴 Card Area Spacing:', report.details.cardAreaSpacing)
    console.log('✅ Validation:', report.details.validation)
    
    if (report.details.recommendations.length > 0) {
      console.log('💡 Recommendations:')
      report.details.recommendations.forEach((rec, index) => {
        console.log(`  ${index + 1}. ${rec}`)
      })
    }
    console.groupEnd()
  }

  // 在DOM中显示调试信息（仅开发模式）
  if (debugDisplay.showOverlay && typeof window !== 'undefined') {
    displaySpacingOverlay(report, debugDisplay)
  }
}

/**
 * 在页面上显示间距调试覆盖层
 * @param report - 调试报告
 * @param debugDisplay - 调试显示配置
 */
function displaySpacingOverlay(
  report: ReturnType<typeof generateSpacingDebugReport>,
  debugDisplay: SpacingDebugDisplay
): void {
  // 移除现有的调试覆盖层
  const existingOverlay = document.getElementById('spacing-debug-overlay')
  if (existingOverlay) {
    existingOverlay.remove()
  }

  // 创建新的调试覆盖层
  const overlay = document.createElement('div')
  overlay.id = 'spacing-debug-overlay'
  overlay.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    background: rgba(0, 0, 0, 0.9);
    color: white;
    padding: 12px;
    border-radius: 8px;
    font-family: monospace;
    font-size: 12px;
    z-index: 10000;
    max-width: 400px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  `

  const content = `
    <div style="margin-bottom: 8px; font-weight: bold; color: #4CAF50;">
      🎯 Spacing Debug
    </div>
    <div style="margin-bottom: 4px;">📊 ${report.summary}</div>
    <div style="margin-bottom: 4px;">📱 ${report.details.deviceInfo}</div>
    <div style="margin-bottom: 4px;">✅ ${report.details.validation}</div>
    ${report.details.recommendations.length > 0 ? `
      <div style="margin-top: 8px; color: #FFC107;">
        💡 Recommendations:
        <ul style="margin: 4px 0; padding-left: 16px;">
          ${report.details.recommendations.map(rec => `<li>${rec}</li>`).join('')}
        </ul>
      </div>
    ` : ''}
    <div style="margin-top: 8px; text-align: right;">
      <button onclick="this.parentElement.parentElement.remove()" 
              style="background: #f44336; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer;">
        Close
      </button>
    </div>
  `

  overlay.innerHTML = content
  document.body.appendChild(overlay)

  // 5秒后自动移除（如果用户没有手动关闭）
  setTimeout(() => {
    if (document.getElementById('spacing-debug-overlay')) {
      overlay.remove()
    }
  }, 5000)
}

/**
 * 间距验证中间件 - 在布局计算中集成间距验证
 * @param deviceType - 设备类型
 * @param containerWidth - 容器宽度
 * @param containerHeight - 容器高度
 * @param cardCount - 卡牌数量
 * @param layoutCalculation - 布局计算函数
 * @returns 验证后的布局结果
 */
export function withSpacingValidation<T>(
  deviceType: DeviceType,
  containerWidth: number,
  containerHeight: number,
  cardCount: number,
  layoutCalculation: () => T
): {
  result: T
  validation: ReturnType<typeof validateAllSpacing>
  fallbackApplied: boolean
} {
  let result: T
  let fallbackApplied = false
  
  try {
    // 执行布局计算
    result = layoutCalculation()
    
    // 验证间距
    const validation = validateAllSpacing(deviceType, containerWidth, containerHeight, cardCount)
    
    // 如果验证失败且需要降级，重新计算
    if (!validation.isValid && validation.cardAreaValidation.fallbackRequired) {
      console.warn('Spacing validation failed, applying fallback spacing')
      
      // 这里可以触发使用降级间距的重新计算
      // 具体实现取决于布局计算函数的设计
      fallbackApplied = true
    }
    
    // 开发模式下显示调试信息
    if (process.env.NODE_ENV === 'development') {
      displaySpacingDebugInfo(deviceType, containerWidth, containerHeight, cardCount)
    }
    
    return {
      result,
      validation,
      fallbackApplied
    }
  } catch (error) {
    console.error('Layout calculation failed:', error)
    
    // 使用降级间距重新尝试
    const fallbackSpacing = createFallbackSpacing(deviceType, {
      containerWidth,
      containerHeight,
      originalError: error as Error
    })
    
    // 这里需要根据实际的布局计算函数来实现降级逻辑
    // 暂时返回原始结果和错误信息
    throw error
  }
}

/**
 * 间距性能监控工具
 * 监控间距计算的性能影响
 */
export interface SpacingPerformanceMetrics {
  calculationTime: number
  validationTime: number
  totalTime: number
  memoryUsage?: number
  cacheHits: number
  cacheMisses: number
}

let performanceMetrics: SpacingPerformanceMetrics = {
  calculationTime: 0,
  validationTime: 0,
  totalTime: 0,
  cacheHits: 0,
  cacheMisses: 0
}

/**
 * 测量间距计算性能
 * @param operation - 要测量的操作
 * @param operationType - 操作类型
 * @returns 操作结果和性能指标
 */
export function measureSpacingPerformance<T>(
  operation: () => T,
  operationType: 'calculation' | 'validation' = 'calculation'
): { result: T; metrics: Partial<SpacingPerformanceMetrics> } {
  const startTime = performance.now()
  const startMemory = (performance as any).memory?.usedJSHeapSize

  const result = operation()

  const endTime = performance.now()
  const endMemory = (performance as any).memory?.usedJSHeapSize
  const executionTime = endTime - startTime

  const metrics: Partial<SpacingPerformanceMetrics> = {
    [operationType === 'calculation' ? 'calculationTime' : 'validationTime']: executionTime,
    memoryUsage: endMemory && startMemory ? endMemory - startMemory : undefined
  }

  // 更新全局性能指标
  if (operationType === 'calculation') {
    performanceMetrics.calculationTime += executionTime
  } else {
    performanceMetrics.validationTime += executionTime
  }
  performanceMetrics.totalTime = performanceMetrics.calculationTime + performanceMetrics.validationTime

  return { result, metrics }
}

/**
 * 获取间距性能统计
 * @returns 性能统计信息
 */
export function getSpacingPerformanceStats(): SpacingPerformanceMetrics {
  return { ...performanceMetrics }
}

/**
 * 重置间距性能统计
 */
export function resetSpacingPerformanceStats(): void {
  performanceMetrics = {
    calculationTime: 0,
    validationTime: 0,
    totalTime: 0,
    cacheHits: 0,
    cacheMisses: 0
  }
}

/**
 * 间距配置缓存
 * 提高频繁访问的性能
 */
const spacingConfigCache = new Map<string, SpacingConfig>()
const cardAreaSpacingCache = new Map<string, CardAreaSpacing>()

/**
 * 带缓存的间距配置获取
 * @param deviceType - 设备类型
 * @returns 缓存的间距配置
 */
export function getCachedSpacingConfig(deviceType: DeviceType): SpacingConfig {
  const cacheKey = `spacing-${deviceType}`
  
  if (spacingConfigCache.has(cacheKey)) {
    performanceMetrics.cacheHits++
    return spacingConfigCache.get(cacheKey)!
  }
  
  performanceMetrics.cacheMisses++
  const config = getSpacingConfig(deviceType)
  spacingConfigCache.set(cacheKey, config)
  
  return config
}

/**
 * 带缓存的卡牌区域间距配置获取
 * @param deviceType - 设备类型
 * @returns 缓存的卡牌区域间距配置
 */
export function getCachedCardAreaSpacing(deviceType: DeviceType): CardAreaSpacing {
  const cacheKey = `card-area-${deviceType}`
  
  if (cardAreaSpacingCache.has(cacheKey)) {
    performanceMetrics.cacheHits++
    return cardAreaSpacingCache.get(cacheKey)!
  }
  
  performanceMetrics.cacheMisses++
  const spacing = getCardAreaSpacing(deviceType)
  cardAreaSpacingCache.set(cacheKey, spacing)
  
  return spacing
}

/**
 * 清除间距配置缓存
 */
export function clearSpacingCache(): void {
  spacingConfigCache.clear()
  cardAreaSpacingCache.clear()
}