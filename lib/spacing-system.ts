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

export interface SpacingValidationResult {
  isValid: boolean
  warnings: string[]
  errors: string[]
  recommendations: string[]
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