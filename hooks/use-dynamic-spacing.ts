// 动态间距管理Hook
// 提供基于设备类型的响应式间距计算和CSS类名生成

import { useMemo } from 'react'
import { 
  getSpacingConfig, 
  calculateResponsiveSpacing,
  calculateUIElementSpacing,
  calculateContainerPadding,
  generateDynamicSpacingClasses,
  validateUIElementSpacing,
  getSpacingDebugInfo,
  type SpacingConfig,
  type SpacingValidationResult
} from '@/lib/spacing-system'
import { detectDeviceType } from '@/lib/layout-manager'
import type { DeviceType } from '@/types'

interface UseDynamicSpacingOptions {
  containerWidth?: number
  containerHeight?: number
  uiElements?: {
    hasGameInfo?: boolean
    hasWarnings?: boolean
    hasStartButton?: boolean
    hasResultDisplay?: boolean
    cardAreaMinHeight?: number
  }
  enableValidation?: boolean
  enableDebug?: boolean
}

interface DynamicSpacingResult {
  deviceType: DeviceType
  spacingConfig: SpacingConfig
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
  }
  spacing: {
    responsive: (key: keyof SpacingConfig['componentSpacing']) => number
    uiElement: (element: keyof SpacingConfig['uiElementSpacing']) => number
  }
  validation?: SpacingValidationResult
  debugInfo?: string
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
    uiElements = {},
    enableValidation = false,
    enableDebug = false
  } = options

  return useMemo(() => {
    // 检测设备类型
    const deviceType = detectDeviceType(containerWidth)
    
    // 获取间距配置
    const spacingConfig = getSpacingConfig(deviceType)
    
    // 计算容器内边距
    const containerPadding = calculateContainerPadding(deviceType)
    
    // 生成CSS类名
    const cssClasses = {
      container: generateDynamicSpacingClasses(deviceType, 'container'),
      component: generateDynamicSpacingClasses(deviceType, 'component'),
      uiElement: generateDynamicSpacingClasses(deviceType, 'ui-element')
    }
    
    // 创建间距计算函数
    const spacing = {
      responsive: (key: keyof SpacingConfig['componentSpacing']) => 
        calculateResponsiveSpacing(deviceType, key),
      uiElement: (element: keyof SpacingConfig['uiElementSpacing']) => 
        calculateUIElementSpacing(deviceType, element)
    }
    
    // 验证间距配置（如果启用）
    let validation: SpacingValidationResult | undefined
    if (enableValidation) {
      validation = validateUIElementSpacing(deviceType, containerHeight, uiElements)
    }
    
    // 生成调试信息（如果启用）
    let debugInfo: string | undefined
    if (enableDebug) {
      debugInfo = getSpacingDebugInfo(deviceType, spacingConfig)
    }
    
    return {
      deviceType,
      spacingConfig,
      containerPadding,
      cssClasses,
      spacing,
      validation,
      debugInfo
    }
  }, [containerWidth, containerHeight, JSON.stringify(uiElements), enableValidation, enableDebug])
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