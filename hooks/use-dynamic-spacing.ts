// 动态间距管理Hook
// 提供基于设备类型的响应式间距计算和CSS类名生成

import { useMemo } from 'react'
import { 
  getSpacingConfig, 
  getCardAreaSpacing,
  calculateResponsiveSpacing,
  calculateUIElementSpacing,
  calculateContainerPadding,
  generateDynamicSpacingClasses,
  validateUIElementSpacing,
  validateAllSpacing,
  getSpacingDebugInfo,
  getCachedSpacingConfig,
  getCachedCardAreaSpacing,
  type SpacingConfig,
  type CardAreaSpacing,
  type SpacingValidationResult
} from '@/lib/spacing-system'
import { detectDeviceType } from '@/lib/layout-manager'
import type { DeviceType } from '@/types'

interface UseDynamicSpacingOptions {
  containerWidth?: number
  containerHeight?: number
  cardCount?: number
  uiElements?: {
    hasGameInfo?: boolean
    hasWarnings?: boolean
    hasStartButton?: boolean
    hasResultDisplay?: boolean
    cardAreaMinHeight?: number
  }
  enableValidation?: boolean
  enableDebug?: boolean
  enableCardAreaSpacing?: boolean
  useCache?: boolean
}

interface DynamicSpacingResult {
  deviceType: DeviceType
  spacingConfig: SpacingConfig
  cardAreaSpacing?: CardAreaSpacing
  layoutComplexity: 'simple' | 'complex'
  containerPadding: {
    x: number
    y: number
    horizontal: string
    vertical: string
    all: string
  }
  cssClasses: {
    container: Record<string, string>
    component: Record<string, string>
    uiElement: Record<string, string>
    cardArea?: Record<string, string>
  }
  spacing: {
    responsive: (key: keyof SpacingConfig['componentSpacing']) => number
    uiElement: (element: keyof SpacingConfig['uiElementSpacing']) => number
    cardArea?: {
      containerMargins: () => CardAreaSpacing['containerMargins']
      rowSpacing: () => number
      cardSpacing: () => number
    }
  }
  validation?: ReturnType<typeof validateAllSpacing>
  debugInfo?: string
}

/**
 * 检测卡牌布局复杂度
 * @param cardCount - 卡牌数量
 * @param deviceType - 设备类型
 * @returns 布局复杂度
 */
function detectLayoutComplexity(cardCount: number = 0, deviceType: DeviceType): 'simple' | 'complex' {
  // 根据设备类型和卡牌数量判断布局复杂度
  const thresholds = {
    mobile: 4,
    tablet: 5,
    desktop: 5
  }
  
  return cardCount > thresholds[deviceType] ? 'complex' : 'simple'
}

/**
 * 生成卡牌区域CSS类名
 * @param cardAreaSpacing - 卡牌区域间距配置
 * @param layoutComplexity - 布局复杂度
 * @returns CSS类名对象
 */
function generateCardAreaClasses(
  cardAreaSpacing: CardAreaSpacing,
  layoutComplexity: 'simple' | 'complex'
): Record<string, string> {
  const { containerMargins, rowSpacing, cardSpacing } = cardAreaSpacing
  const complexityMultiplier = layoutComplexity === 'complex' ? 1.1 : 1.0
  
  return {
    containerMargins: `mt-[${Math.round(containerMargins.top * complexityMultiplier)}px] mb-[${Math.round(containerMargins.bottom * complexityMultiplier)}px] mx-[${containerMargins.left}px]`,
    marginTop: `mt-[${Math.round(containerMargins.top * complexityMultiplier)}px]`,
    marginBottom: `mb-[${Math.round(containerMargins.bottom * complexityMultiplier)}px]`,
    marginHorizontal: `mx-[${containerMargins.left}px]`,
    rowSpacing: `space-y-[${rowSpacing}px]`,
    cardSpacing: `gap-[${cardSpacing}px]`,
    cardGrid: `gap-x-[${cardSpacing}px] gap-y-[${rowSpacing}px]`
  }
}

/**
 * 动态间距管理Hook
 * @param options - 配置选项
 * @returns 动态间距计算结果
 */
export function useDynamicSpacing(options: UseDynamicSpacingOptions = {}): DynamicSpacingResult {
  const {
    containerWidth,
    containerHeight = 768,
    cardCount = 0,
    uiElements = {},
    enableValidation = false,
    enableDebug = false,
    enableCardAreaSpacing = false,
    useCache = true
  } = options

  return useMemo(() => {
    // 检测设备类型
    const deviceType = detectDeviceType(containerWidth)
    
    // 检测布局复杂度
    const layoutComplexity = detectLayoutComplexity(cardCount, deviceType)
    
    // 获取间距配置（使用缓存或直接获取）
    const spacingConfig = useCache ? getCachedSpacingConfig(deviceType) : getSpacingConfig(deviceType)
    
    // 获取卡牌区域间距配置（如果启用）
    let cardAreaSpacing: CardAreaSpacing | undefined
    if (enableCardAreaSpacing) {
      cardAreaSpacing = useCache ? getCachedCardAreaSpacing(deviceType) : getCardAreaSpacing(deviceType)
    }
    
    // 计算容器内边距
    const containerPadding = calculateContainerPadding(deviceType)
    
    // 生成CSS类名
    const cssClasses: DynamicSpacingResult['cssClasses'] = {
      container: generateDynamicSpacingClasses(deviceType, 'container'),
      component: generateDynamicSpacingClasses(deviceType, 'component'),
      uiElement: generateDynamicSpacingClasses(deviceType, 'ui-element')
    }
    
    // 如果启用卡牌区域间距，生成相应的CSS类名
    if (cardAreaSpacing) {
      cssClasses.cardArea = generateCardAreaClasses(cardAreaSpacing, layoutComplexity)
    }
    
    // 创建间距计算函数
    const spacing: DynamicSpacingResult['spacing'] = {
      responsive: (key: keyof SpacingConfig['componentSpacing']) => 
        calculateResponsiveSpacing(deviceType, key),
      uiElement: (element: keyof SpacingConfig['uiElementSpacing']) => 
        calculateUIElementSpacing(deviceType, element)
    }
    
    // 如果启用卡牌区域间距，添加相应的计算函数
    if (cardAreaSpacing) {
      spacing.cardArea = {
        containerMargins: () => cardAreaSpacing.containerMargins,
        rowSpacing: () => cardAreaSpacing.rowSpacing,
        cardSpacing: () => cardAreaSpacing.cardSpacing
      }
    }
    
    // 验证间距配置（如果启用）
    let validation: ReturnType<typeof validateAllSpacing> | undefined
    if (enableValidation && containerWidth && containerHeight) {
      validation = validateAllSpacing(deviceType, containerWidth, containerHeight, cardCount, uiElements)
    }
    
    // 生成调试信息（如果启用）
    let debugInfo: string | undefined
    if (enableDebug) {
      debugInfo = getSpacingDebugInfo(deviceType, spacingConfig)
    }
    
    return {
      deviceType,
      spacingConfig,
      cardAreaSpacing,
      layoutComplexity,
      containerPadding,
      cssClasses,
      spacing,
      validation,
      debugInfo
    }
  }, [
    containerWidth, 
    containerHeight, 
    cardCount,
    JSON.stringify(uiElements), 
    enableValidation, 
    enableDebug,
    enableCardAreaSpacing,
    useCache
  ])
}

/**
 * 生成动态间距的内联样式
 * @param spacing - 间距值（像素）
 * @returns CSS样式对象
 */
export function createSpacingStyle(spacing: number): React.CSSProperties {
  return {
    margin: `${spacing}px`,
    padding: `${spacing}px`
  }
}

/**
 * 生成动态间距的Tailwind类名
 * @param spacing - 间距值（像素）
 * @param type - 间距类型
 * @returns Tailwind类名字符串
 */
export function createSpacingClass(
  spacing: number, 
  type: 'margin' | 'padding' | 'gap' | 'space-y' = 'margin'
): string {
  switch (type) {
    case 'margin':
      return `m-[${spacing}px]`
    case 'padding':
      return `p-[${spacing}px]`
    case 'gap':
      return `gap-[${spacing}px]`
    case 'space-y':
      return `space-y-[${spacing}px]`
    default:
      return `m-[${spacing}px]`
  }
}

/**
 * 创建响应式间距类名
 * @param mobileSpacing - 移动端间距
 * @param tabletSpacing - 平板端间距
 * @param desktopSpacing - 桌面端间距
 * @param type - 间距类型
 * @returns 响应式Tailwind类名字符串
 */
export function createResponsiveSpacingClass(
  mobileSpacing: number,
  tabletSpacing: number,
  desktopSpacing: number,
  type: 'margin' | 'padding' | 'gap' | 'space-y' = 'margin'
): string {
  const prefix = type === 'space-y' ? 'space-y' : type.charAt(0)
  
  return [
    `${prefix}-[${mobileSpacing}px]`,
    `sm:${prefix}-[${tabletSpacing}px]`,
    `lg:${prefix}-[${desktopSpacing}px]`
  ].join(' ')
}

/**
 * 创建卡牌区域特定的间距样式
 * @param cardAreaSpacing - 卡牌区域间距配置
 * @param layoutComplexity - 布局复杂度
 * @returns CSS样式对象
 */
export function createCardAreaSpacingStyle(
  cardAreaSpacing: CardAreaSpacing,
  layoutComplexity: 'simple' | 'complex' = 'simple'
): React.CSSProperties {
  const complexityMultiplier = layoutComplexity === 'complex' ? 1.1 : 1.0
  
  return {
    marginTop: Math.round(cardAreaSpacing.containerMargins.top * complexityMultiplier),
    marginBottom: Math.round(cardAreaSpacing.containerMargins.bottom * complexityMultiplier),
    marginLeft: cardAreaSpacing.containerMargins.left,
    marginRight: cardAreaSpacing.containerMargins.right,
    gap: cardAreaSpacing.cardSpacing,
    rowGap: cardAreaSpacing.rowSpacing
  }
}

/**
 * 创建卡牌网格布局的CSS类名
 * @param cardAreaSpacing - 卡牌区域间距配置
 * @param cardsPerRow - 每行卡牌数量
 * @param layoutComplexity - 布局复杂度
 * @returns CSS类名字符串
 */
export function createCardGridClass(
  cardAreaSpacing: CardAreaSpacing,
  cardsPerRow: number = 5,
  layoutComplexity: 'simple' | 'complex' = 'simple'
): string {
  const complexityMultiplier = layoutComplexity === 'complex' ? 1.1 : 1.0
  const adjustedTopMargin = Math.round(cardAreaSpacing.containerMargins.top * complexityMultiplier)
  const adjustedBottomMargin = Math.round(cardAreaSpacing.containerMargins.bottom * complexityMultiplier)
  
  return [
    'grid',
    `grid-cols-${Math.min(cardsPerRow, 5)}`,
    `gap-x-[${cardAreaSpacing.cardSpacing}px]`,
    `gap-y-[${cardAreaSpacing.rowSpacing}px]`,
    `mt-[${adjustedTopMargin}px]`,
    `mb-[${adjustedBottomMargin}px]`,
    `mx-[${cardAreaSpacing.containerMargins.left}px]`
  ].join(' ')
}

/**
 * 获取卡牌区域间距的调试信息
 * @param cardAreaSpacing - 卡牌区域间距配置
 * @param layoutComplexity - 布局复杂度
 * @returns 调试信息字符串
 */
export function getCardAreaSpacingDebugInfo(
  cardAreaSpacing: CardAreaSpacing,
  layoutComplexity: 'simple' | 'complex'
): string {
  const complexityMultiplier = layoutComplexity === 'complex' ? 1.1 : 1.0
  
  return [
    `Layout: ${layoutComplexity}`,
    `Complexity Multiplier: ${complexityMultiplier}`,
    `Container Margins: T${Math.round(cardAreaSpacing.containerMargins.top * complexityMultiplier)} B${Math.round(cardAreaSpacing.containerMargins.bottom * complexityMultiplier)} L${cardAreaSpacing.containerMargins.left} R${cardAreaSpacing.containerMargins.right}`,
    `Row Spacing: ${cardAreaSpacing.rowSpacing}px`,
    `Card Spacing: ${cardAreaSpacing.cardSpacing}px`
  ].join(' | ')
}

/**
 * 验证卡牌区域间距与现有系统的兼容性
 * @param dynamicSpacingResult - 动态间距结果
 * @returns 兼容性验证结果
 */
export function validateSpacingCompatibility(
  dynamicSpacingResult: DynamicSpacingResult
): {
  isCompatible: boolean
  issues: string[]
  recommendations: string[]
} {
  const issues: string[] = []
  const recommendations: string[] = []
  
  // 检查卡牌区域间距与UI元素间距的兼容性
  if (dynamicSpacingResult.cardAreaSpacing && dynamicSpacingResult.validation) {
    const { cardAreaSpacing, spacingConfig, validation } = dynamicSpacingResult
    
    // 检查卡牌区域顶部边距与游戏信息面板间距的兼容性
    const gameInfoSpacing = spacingConfig.uiElementSpacing.gameInfo
    const cardAreaTopMargin = cardAreaSpacing.containerMargins.top
    
    if (Math.abs(gameInfoSpacing - cardAreaTopMargin) > 8) {
      issues.push(`游戏信息面板间距(${gameInfoSpacing}px)与卡牌区域顶部边距(${cardAreaTopMargin}px)差异过大`)
      recommendations.push('考虑调整游戏信息面板间距以匹配卡牌区域边距')
    }
    
    // 检查卡牌区域底部边距与开始按钮间距的兼容性
    const startButtonSpacing = spacingConfig.uiElementSpacing.startButton
    const cardAreaBottomMargin = cardAreaSpacing.containerMargins.bottom
    
    if (Math.abs(startButtonSpacing - cardAreaBottomMargin) > 8) {
      issues.push(`开始按钮间距(${startButtonSpacing}px)与卡牌区域底部边距(${cardAreaBottomMargin}px)差异过大`)
      recommendations.push('考虑调整开始按钮间距以匹配卡牌区域边距')
    }
    
    // 检查验证结果
    if (!validation.isValid) {
      issues.push('间距验证失败')
      recommendations.push(...validation.recommendations)
    }
  }
  
  return {
    isCompatible: issues.length === 0,
    issues,
    recommendations
  }
}

/**
 * 创建增强的动态间距Hook，专门用于卡牌游戏组件
 * @param options - 配置选项
 * @returns 增强的动态间距结果
 */
export function useCardGameSpacing(options: UseDynamicSpacingOptions & {
  cardsPerRow?: number
}) {
  const { cardsPerRow = 5, ...restOptions } = options
  
  const dynamicSpacing = useDynamicSpacing({
    ...restOptions,
    enableCardAreaSpacing: true,
    enableValidation: true
  })
  
  return useMemo(() => {
    const compatibility = validateSpacingCompatibility(dynamicSpacing)
    
    // 创建卡牌特定的CSS类名和样式
    const cardSpecificClasses = dynamicSpacing.cardAreaSpacing ? {
      cardGrid: createCardGridClass(
        dynamicSpacing.cardAreaSpacing,
        cardsPerRow,
        dynamicSpacing.layoutComplexity
      ),
      cardAreaStyle: createCardAreaSpacingStyle(
        dynamicSpacing.cardAreaSpacing,
        dynamicSpacing.layoutComplexity
      )
    } : undefined
    
    return {
      ...dynamicSpacing,
      compatibility,
      cardSpecific: cardSpecificClasses,
      debugInfo: dynamicSpacing.cardAreaSpacing ? 
        getCardAreaSpacingDebugInfo(dynamicSpacing.cardAreaSpacing, dynamicSpacing.layoutComplexity) :
        dynamicSpacing.debugInfo
    }
  }, [dynamicSpacing, cardsPerRow])
}

// 导出标准间距值供验证脚本使用
export const cardToStatus = 24
export const cardToInfo = 32
export const cardToResult = 40
export const cardToContainer = 16

// 导出间距配置对象
export const defaultSpacingConfig = {
  cardToStatus,
  cardToInfo,
  cardToResult,
  cardToContainer
}

// 导出卡牌区域特定的间距常量
export const cardAreaSpacingConstants = {
  complexityThresholds: {
    mobile: 4,
    tablet: 5,
    desktop: 5
  },
  complexityMultiplier: {
    simple: 1.0,
    complex: 1.1
  },
  compatibilityTolerance: 8 // 像素
}