// 卡牌可用空间计算系统
// 准确计算卡牌在容器中的可用区域，考虑所有UI元素占用的空间

import { getSpacingConfig } from './spacing-system'
import { detectDeviceType } from './layout-manager'
import type { DeviceType } from '@/types'

export interface AvailableCardSpace {
  width: number
  height: number
  offsetX: number
  offsetY: number
  maxCardWidth: number
  maxCardHeight: number
  containerWidth: number
  containerHeight: number
}

export interface UIElementsConfig {
  hasGameInfo?: boolean
  hasWarnings?: boolean
  hasStartButton?: boolean
  hasResultDisplay?: boolean
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
 * 计算卡牌可用空间
 * @param containerWidth - 容器宽度
 * @param containerHeight - 容器高度
 * @param uiElements - UI元素配置
 * @returns 卡牌可用空间信息
 */
export function calculateAvailableCardSpace(
  containerWidth: number,
  containerHeight: number,
  uiElements: UIElementsConfig = {}
): AvailableCardSpace {
  // 输入验证
  if (!isValidDimension(containerWidth) || !isValidDimension(containerHeight)) {
    console.warn(`Invalid container dimensions: ${containerWidth}x${containerHeight}`)
    throw new Error(`Invalid container dimensions: ${containerWidth}x${containerHeight}`)
  }

  const {
    hasGameInfo = true,
    hasWarnings = false,
    hasStartButton = false,
    hasResultDisplay = false
  } = uiElements

  const deviceType = detectDeviceType(containerWidth)
  const spacingConfig = getSpacingConfig(deviceType)
  
  // 计算UI元素占用的垂直空间
  let topOffset = spacingConfig.containerPadding.y
  let bottomOffset = spacingConfig.containerPadding.y
  
  // 游戏信息面板
  if (hasGameInfo) {
    topOffset += UI_ELEMENT_HEIGHTS.gameInfo + spacingConfig.uiElementSpacing.gameInfo
  }
  
  // 游戏状态提示（总是存在）
  topOffset += UI_ELEMENT_HEIGHTS.gameStatus + spacingConfig.uiElementSpacing.gameStatus
  
  // 警告信息
  if (hasWarnings) {
    topOffset += UI_ELEMENT_HEIGHTS.warnings + spacingConfig.uiElementSpacing.warnings
  }
  
  // 开始按钮
  if (hasStartButton) {
    bottomOffset += UI_ELEMENT_HEIGHTS.startButton + spacingConfig.uiElementSpacing.startButton
  }
  
  // 结果显示
  if (hasResultDisplay) {
    bottomOffset += UI_ELEMENT_HEIGHTS.resultDisplay + spacingConfig.uiElementSpacing.resultDisplay
  }
  
  // 计算水平偏移（容器内边距）
  const horizontalOffset = spacingConfig.containerPadding.x
  
  // 计算可用空间
  const availableWidth = containerWidth - (horizontalOffset * 2)
  const availableHeight = containerHeight - topOffset - bottomOffset
  
  // 确保最小可用空间
  const minWidth = Math.max(200, availableWidth)
  const minHeight = Math.max(150, availableHeight)
  
  // 如果计算出的空间太小，记录警告
  if (availableWidth < 200 || availableHeight < 150) {
    console.warn(`Limited card space: calculated ${availableWidth}x${availableHeight}, using minimum ${minWidth}x${minHeight}`)
  }
  
  // 计算最大卡牌尺寸（用于后续布局计算）
  const maxCardWidth = Math.floor(minWidth / 2)  // 至少能放2列
  const maxCardHeight = Math.floor(minHeight / 3) // 至少能放3行
  
  const result: AvailableCardSpace = {
    width: minWidth,
    height: minHeight,
    offsetX: horizontalOffset,
    offsetY: topOffset,
    maxCardWidth: Math.max(60, maxCardWidth), // 最小卡牌宽度60px
    maxCardHeight: Math.max(90, maxCardHeight), // 最小卡牌高度90px
    containerWidth,
    containerHeight
  }
  
  // 开发模式下输出调试信息
  if (process.env.NODE_ENV === 'development') {
    console.group('🎯 Card Space Calculation')
    console.log('Container:', { width: containerWidth, height: containerHeight })
    console.log('UI Elements:', uiElements)
    console.log('Offsets:', { top: topOffset, bottom: bottomOffset, horizontal: horizontalOffset })
    console.log('Available Space:', { width: minWidth, height: minHeight })
    console.log('Max Card Size:', { width: maxCardWidth, height: maxCardHeight })
    console.groupEnd()
  }
  
  return result
}

/**
 * 验证尺寸是否有效
 * @param dimension - 尺寸值
 * @returns 是否有效
 */
function isValidDimension(dimension: number): boolean {
  return typeof dimension === 'number' && 
         !isNaN(dimension) && 
         isFinite(dimension) && 
         dimension > 0 && 
         dimension < 50000 // 合理的上限
}

/**
 * 计算UI元素的总高度
 * @param uiElements - UI元素配置
 * @param deviceType - 设备类型
 * @returns UI元素总高度
 */
export function calculateUIElementsHeight(
  uiElements: UIElementsConfig,
  deviceType: DeviceType
): { topHeight: number; bottomHeight: number; totalHeight: number } {
  const spacingConfig = getSpacingConfig(deviceType)
  
  let topHeight = spacingConfig.containerPadding.y
  let bottomHeight = spacingConfig.containerPadding.y
  
  // 计算顶部UI元素高度
  if (uiElements.hasGameInfo) {
    topHeight += UI_ELEMENT_HEIGHTS.gameInfo + spacingConfig.uiElementSpacing.gameInfo
  }
  
  topHeight += UI_ELEMENT_HEIGHTS.gameStatus + spacingConfig.uiElementSpacing.gameStatus
  
  if (uiElements.hasWarnings) {
    topHeight += UI_ELEMENT_HEIGHTS.warnings + spacingConfig.uiElementSpacing.warnings
  }
  
  // 计算底部UI元素高度
  if (uiElements.hasStartButton) {
    bottomHeight += UI_ELEMENT_HEIGHTS.startButton + spacingConfig.uiElementSpacing.startButton
  }
  
  if (uiElements.hasResultDisplay) {
    bottomHeight += UI_ELEMENT_HEIGHTS.resultDisplay + spacingConfig.uiElementSpacing.resultDisplay
  }
  
  return {
    topHeight,
    bottomHeight,
    totalHeight: topHeight + bottomHeight
  }
}

/**
 * 验证可用空间是否足够容纳指定数量的卡牌
 * @param availableSpace - 可用空间
 * @param cardCount - 卡牌数量
 * @returns 验证结果
 */
export function validateSpaceForCards(
  availableSpace: AvailableCardSpace,
  cardCount: number
): {
  isValid: boolean
  issues: string[]
  recommendations: string[]
} {
  const issues: string[] = []
  const recommendations: string[] = []
  
  // 检查最小空间要求
  const minSpacePerCard = 80 * 120 // 最小卡牌尺寸 80x120
  const totalMinSpace = cardCount * minSpacePerCard
  const availableArea = availableSpace.width * availableSpace.height
  
  if (availableArea < totalMinSpace) {
    issues.push(`可用空间不足：需要${totalMinSpace}px²，实际${availableArea}px²`)
    recommendations.push('减少卡牌数量或增加容器尺寸')
  }
  
  // 检查宽度是否足够
  const minWidthForCards = Math.ceil(Math.sqrt(cardCount)) * 80 // 假设最小80px宽度
  if (availableSpace.width < minWidthForCards) {
    issues.push(`容器宽度不足：需要至少${minWidthForCards}px，实际${availableSpace.width}px`)
    recommendations.push('增加容器宽度或减少每行卡牌数量')
  }
  
  // 检查高度是否足够
  const estimatedRows = Math.ceil(cardCount / Math.floor(availableSpace.width / 80))
  const minHeightForCards = estimatedRows * 120 // 假设最小120px高度
  if (availableSpace.height < minHeightForCards) {
    issues.push(`容器高度不足：需要至少${minHeightForCards}px，实际${availableSpace.height}px`)
    recommendations.push('增加容器高度或减少卡牌尺寸')
  }
  
  return {
    isValid: issues.length === 0,
    issues,
    recommendations
  }
}

/**
 * 获取可用空间的调试信息
 * @param availableSpace - 可用空间
 * @returns 调试信息字符串
 */
export function getAvailableSpaceDebugInfo(availableSpace: AvailableCardSpace): string {
  return [
    `Available: ${availableSpace.width}x${availableSpace.height}`,
    `Container: ${availableSpace.containerWidth}x${availableSpace.containerHeight}`,
    `Offset: ${availableSpace.offsetX},${availableSpace.offsetY}`,
    `Max Card: ${availableSpace.maxCardWidth}x${availableSpace.maxCardHeight}`
  ].join(' | ')
}