// 边界感知位置计算系统
// 确保所有卡牌位置都在容器边界内，防止溢出

import { detectDeviceType, getDeviceConfig } from './layout-manager'
import { getSpacingConfig } from './spacing-system'
import type { AvailableCardSpace } from './card-space-calculator'
import type { CardPosition, DeviceType } from '@/types'

export interface LayoutConfig {
  rows: number
  cardsPerRow: number
  totalCards: number
}

export interface BoundaryValidationResult {
  isValid: boolean
  violations: Array<{
    cardIndex: number
    position: { x: number; y: number }
    violation: 'left' | 'right' | 'top' | 'bottom'
    overflow: number
  }>
}

/**
 * 计算边界感知的卡牌位置（保证返回有效位置数组）
 * @param cardCount - 卡牌数量
 * @param availableSpace - 可用空间
 * @returns 卡牌位置数组
 */
export function calculateBoundaryAwarePositions(
  cardCount: number,
  availableSpace: AvailableCardSpace
): CardPosition[] {
  try {
    // 输入验证
    if (cardCount <= 0 || cardCount > 20) {
      console.warn(`Invalid card count: ${cardCount}, using safe fallback`)
      return createSafeGridLayout(Math.max(1, Math.min(cardCount, 10)), availableSpace)
    }
    
    // 确定最优布局配置
    const layoutConfig = determineOptimalLayout(cardCount, availableSpace)
    
    // 计算适合边界的卡牌尺寸
    const cardSize = calculateOptimalCardSize(layoutConfig, availableSpace)
    
    // 计算安全间距
    const spacing = calculateSafeSpacing(layoutConfig, cardSize, availableSpace)
    
    // 生成位置并确保数组完整性
    const positions = ensureValidPositionArray(
      cardCount,
      layoutConfig,
      cardSize,
      spacing,
      availableSpace
    )
    
    // 验证位置数组长度
    if (positions.length !== cardCount) {
      console.error(`Position array length mismatch: expected ${cardCount}, got ${positions.length}`)
      return createGuaranteedPositionArray(cardCount, availableSpace)
    }
    
    // 最终边界验证
    const boundaryCheck = validatePositionBoundaries(positions, availableSpace)
    if (!boundaryCheck.isValid) {
      console.warn('Generated positions have boundary violations, applying corrections')
      return validateAndCorrectPositions(positions, availableSpace)
    }
    
    return positions
    
  } catch (error) {
    console.error('Error in boundary-aware position calculation:', error)
    return createGuaranteedPositionArray(cardCount, availableSpace)
  }
}

/**
 * 确定最优布局配置
 * @param cardCount - 卡牌数量
 * @param availableSpace - 可用空间
 * @returns 布局配置
 */
export function determineOptimalLayout(cardCount: number, availableSpace: AvailableCardSpace): LayoutConfig {
  // 特殊处理6张卡牌
  if (cardCount === 6) {
    const aspectRatio = availableSpace.width / availableSpace.height
    
    if (aspectRatio > 1.5) {
      // 宽容器：优先2行3列
      return { rows: 2, cardsPerRow: 3, totalCards: cardCount }
    } else {
      // 高容器：优先3行2列
      return { rows: 3, cardsPerRow: 2, totalCards: cardCount }
    }
  }
  
  // 对于7+卡牌，使用更保守的布局防止溢出
  if (cardCount >= 7) {
    const maxCardsPerRow = Math.max(2, Math.floor(availableSpace.width / 70)) // 最小70px每张卡
    const optimalCardsPerRow = Math.min(maxCardsPerRow, Math.ceil(Math.sqrt(cardCount)))
    const rows = Math.ceil(cardCount / optimalCardsPerRow)
    
    // 确保布局适合可用高度
    const minCardHeight = 80
    const minSpacing = 8
    const requiredHeight = rows * minCardHeight + (rows - 1) * minSpacing
    
    if (requiredHeight > availableSpace.height) {
      // 通过增加每行卡牌数来减少行数
      const maxPossibleRows = Math.floor((availableSpace.height + minSpacing) / (minCardHeight + minSpacing))
      const adjustedRows = Math.max(1, maxPossibleRows)
      const adjustedCardsPerRow = Math.ceil(cardCount / adjustedRows)
      
      return {
        rows: adjustedRows,
        cardsPerRow: adjustedCardsPerRow,
        totalCards: cardCount
      }
    }
    
    return {
      rows,
      cardsPerRow: optimalCardsPerRow,
      totalCards: cardCount
    }
  }
  
  // 通用布局计算（1-6张卡牌）
  const maxCardsPerRow = Math.floor(availableSpace.width / 100) // 最小100px每张卡
  const optimalCardsPerRow = Math.min(maxCardsPerRow, Math.ceil(Math.sqrt(cardCount)))
  const rows = Math.ceil(cardCount / optimalCardsPerRow)
  
  return {
    rows,
    cardsPerRow: optimalCardsPerRow,
    totalCards: cardCount
  }
}

/**
 * 计算最优卡牌尺寸
 * @param layoutConfig - 布局配置
 * @param availableSpace - 可用空间
 * @returns 卡牌尺寸
 */
export function calculateOptimalCardSize(
  layoutConfig: LayoutConfig,
  availableSpace: AvailableCardSpace
): { width: number; height: number } {
  // 计算最大可能的卡牌尺寸
  const minSpacing = 8
  const maxWidth = Math.floor((availableSpace.width - (layoutConfig.cardsPerRow - 1) * minSpacing) / layoutConfig.cardsPerRow)
  const maxHeight = Math.floor((availableSpace.height - (layoutConfig.rows - 1) * minSpacing) / layoutConfig.rows)
  
  // 应用尺寸限制
  let cardWidth = Math.max(50, Math.min(maxWidth, availableSpace.maxCardWidth))
  let cardHeight = Math.max(75, Math.min(maxHeight, availableSpace.maxCardHeight))
  
  // 保持纵横比（标准扑克牌比例）
  const cardAspectRatio = 1.5 // height / width
  
  if (cardWidth * cardAspectRatio > cardHeight) {
    cardWidth = Math.floor(cardHeight / cardAspectRatio)
  } else {
    cardHeight = Math.floor(cardWidth * cardAspectRatio)
  }
  
  // 确保最小尺寸
  cardWidth = Math.max(50, cardWidth)
  cardHeight = Math.max(75, cardHeight)
  
  return { width: cardWidth, height: cardHeight }
}

/**
 * 计算安全间距
 * @param layoutConfig - 布局配置
 * @param cardSize - 卡牌尺寸
 * @param availableSpace - 可用空间
 * @returns 间距配置
 */
export function calculateSafeSpacing(
  layoutConfig: LayoutConfig,
  cardSize: { width: number; height: number },
  availableSpace: AvailableCardSpace
): { horizontal: number; vertical: number } {
  // 计算剩余空间用于间距
  const totalCardWidth = layoutConfig.cardsPerRow * cardSize.width
  const totalCardHeight = layoutConfig.rows * cardSize.height
  
  const remainingWidth = availableSpace.width - totalCardWidth
  const remainingHeight = availableSpace.height - totalCardHeight
  
  // 分配剩余空间作为间距
  const horizontalSpacing = layoutConfig.cardsPerRow > 1 
    ? Math.max(8, Math.floor(remainingWidth / (layoutConfig.cardsPerRow - 1)))
    : 0
    
  const verticalSpacing = layoutConfig.rows > 1
    ? Math.max(8, Math.floor(remainingHeight / (layoutConfig.rows - 1)))
    : 0
  
  return {
    horizontal: Math.min(horizontalSpacing, 24), // 限制最大间距
    vertical: Math.min(verticalSpacing, 20)
  }
}

/**
 * 生成带边界检查的位置
 * @param layoutConfig - 布局配置
 * @param cardSize - 卡牌尺寸
 * @param spacing - 间距配置
 * @param availableSpace - 可用空间
 * @returns 位置数组
 */
function generatePositionsWithBoundaryCheck(
  layoutConfig: LayoutConfig,
  cardSize: { width: number; height: number },
  spacing: { horizontal: number; vertical: number },
  availableSpace: AvailableCardSpace
): CardPosition[] {
  const positions: CardPosition[] = []
  
  // 计算网格总尺寸
  const totalGridWidth = layoutConfig.cardsPerRow * cardSize.width + (layoutConfig.cardsPerRow - 1) * spacing.horizontal
  const totalGridHeight = layoutConfig.rows * cardSize.height + (layoutConfig.rows - 1) * spacing.vertical
  
  // 计算网格起始位置（居中）
  const gridStartX = (availableSpace.width - totalGridWidth) / 2
  const gridStartY = (availableSpace.height - totalGridHeight) / 2
  
  let cardIndex = 0
  
  for (let row = 0; row < layoutConfig.rows && cardIndex < layoutConfig.totalCards; row++) {
    const cardsInRow = Math.min(layoutConfig.cardsPerRow, layoutConfig.totalCards - row * layoutConfig.cardsPerRow)
    
    // 计算当前行的宽度和起始位置（用于居中）
    const rowWidth = cardsInRow * cardSize.width + (cardsInRow - 1) * spacing.horizontal
    const rowStartX = (availableSpace.width - rowWidth) / 2
    
    for (let col = 0; col < cardsInRow && cardIndex < layoutConfig.totalCards; col++) {
      const cardX = rowStartX + col * (cardSize.width + spacing.horizontal) + cardSize.width / 2
      const cardY = gridStartY + row * (cardSize.height + spacing.vertical) + cardSize.height / 2
      
      positions.push({
        x: cardX,
        y: cardY,
        rotation: (Math.random() - 0.5) * 2, // 轻微随机旋转
        cardWidth: cardSize.width,
        cardHeight: cardSize.height
      })
      
      cardIndex++
    }
  }
  
  return positions
}

/**
 * 验证位置边界
 * @param positions - 位置数组
 * @param availableSpace - 可用空间
 * @returns 验证结果
 */
export function validatePositionBoundaries(
  positions: CardPosition[],
  availableSpace: AvailableCardSpace
): BoundaryValidationResult {
  const violations: BoundaryValidationResult['violations'] = []
  
  positions.forEach((pos, index) => {
    const cardLeft = pos.x - pos.cardWidth / 2
    const cardRight = pos.x + pos.cardWidth / 2
    const cardTop = pos.y - pos.cardHeight / 2
    const cardBottom = pos.y + pos.cardHeight / 2
    
    // 检查边界
    if (cardLeft < 0) {
      violations.push({
        cardIndex: index,
        position: { x: pos.x, y: pos.y },
        violation: 'left',
        overflow: Math.abs(cardLeft)
      })
    }
    
    if (cardRight > availableSpace.width) {
      violations.push({
        cardIndex: index,
        position: { x: pos.x, y: pos.y },
        violation: 'right',
        overflow: cardRight - availableSpace.width
      })
    }
    
    if (cardTop < 0) {
      violations.push({
        cardIndex: index,
        position: { x: pos.x, y: pos.y },
        violation: 'top',
        overflow: Math.abs(cardTop)
      })
    }
    
    if (cardBottom > availableSpace.height) {
      violations.push({
        cardIndex: index,
        position: { x: pos.x, y: pos.y },
        violation: 'bottom',
        overflow: cardBottom - availableSpace.height
      })
    }
  })
  
  return {
    isValid: violations.length === 0,
    violations
  }
}

/**
 * 验证并修正位置
 * @param positions - 原始位置数组
 * @param availableSpace - 可用空间
 * @returns 修正后的位置数组
 */
export function validateAndCorrectPositions(
  positions: CardPosition[],
  availableSpace: AvailableCardSpace
): CardPosition[] {
  return positions.map(pos => {
    const cardLeft = pos.x - pos.cardWidth / 2
    const cardRight = pos.x + pos.cardWidth / 2
    const cardTop = pos.y - pos.cardHeight / 2
    const cardBottom = pos.y + pos.cardHeight / 2
    
    let correctedX = pos.x
    let correctedY = pos.y
    
    // 修正水平溢出
    if (cardLeft < 0) {
      correctedX = pos.cardWidth / 2
    } else if (cardRight > availableSpace.width) {
      correctedX = availableSpace.width - pos.cardWidth / 2
    }
    
    // 修正垂直溢出
    if (cardTop < 0) {
      correctedY = pos.cardHeight / 2
    } else if (cardBottom > availableSpace.height) {
      correctedY = availableSpace.height - pos.cardHeight / 2
    }
    
    return {
      ...pos,
      x: correctedX,
      y: correctedY
    }
  })
}

/**
 * 创建安全网格布局（最终降级方案）
 * @param cardCount - 卡牌数量
 * @param availableSpace - 可用空间
 * @returns 安全位置数组
 */
export function createSafeGridLayout(
  cardCount: number,
  availableSpace: AvailableCardSpace
): CardPosition[] {
  const positions: CardPosition[] = []
  
  // 使用保守的网格布局
  const maxCardsPerRow = Math.max(1, Math.floor(availableSpace.width / 80)) // 最小80px每张卡
  const cardsPerRow = Math.min(maxCardsPerRow, cardCount)
  const rows = Math.ceil(cardCount / cardsPerRow)
  
  // 计算安全卡牌尺寸
  const cardWidth = Math.floor((availableSpace.width - (cardsPerRow - 1) * 12) / cardsPerRow)
  const cardHeight = Math.floor((availableSpace.height - (rows - 1) * 12) / rows)
  
  // 确保最小尺寸
  const safeCardWidth = Math.max(50, Math.min(cardWidth, 120))
  const safeCardHeight = Math.max(75, Math.min(cardHeight, 180))
  
  // 计算网格定位
  const totalGridWidth = cardsPerRow * safeCardWidth + (cardsPerRow - 1) * 12
  const totalGridHeight = rows * safeCardHeight + (rows - 1) * 12
  
  const startX = (availableSpace.width - totalGridWidth) / 2
  const startY = (availableSpace.height - totalGridHeight) / 2
  
  for (let i = 0; i < cardCount; i++) {
    const row = Math.floor(i / cardsPerRow)
    const col = i % cardsPerRow
    
    positions.push({
      x: startX + col * (safeCardWidth + 12) + safeCardWidth / 2,
      y: startY + row * (safeCardHeight + 12) + safeCardHeight / 2,
      rotation: 0,
      cardWidth: safeCardWidth,
      cardHeight: safeCardHeight
    })
  }
  
  return positions
}

/**
 * 确保有效位置数组生成（专门解决7+卡牌失败问题）
 * @param cardCount - 卡牌数量
 * @param layoutConfig - 布局配置
 * @param cardSize - 卡牌尺寸
 * @param spacing - 间距配置
 * @param availableSpace - 可用空间
 * @returns 保证有效的位置数组
 */
function ensureValidPositionArray(
  cardCount: number,
  layoutConfig: LayoutConfig,
  cardSize: { width: number; height: number },
  spacing: { horizontal: number; vertical: number },
  availableSpace: AvailableCardSpace
): CardPosition[] {
  const positions: CardPosition[] = []
  
  // 保证为每张卡牌生成位置
  for (let i = 0; i < cardCount; i++) {
    try {
      // 计算安全位置
      const safePosition = calculateSafePositionForIndex(i, layoutConfig, cardSize, spacing, availableSpace)
      
      // 验证位置有效性
      if (safePosition && 
          typeof safePosition.x === 'number' && 
          typeof safePosition.y === 'number' &&
          !isNaN(safePosition.x) && 
          !isNaN(safePosition.y)) {
        positions.push(safePosition)
      } else {
        // 单个卡牌紧急降级
        positions.push(createEmergencyCardPosition(i, cardCount, availableSpace))
      }
    } catch (error) {
      console.error(`Failed to generate position for card ${i}:`, error)
      positions.push(createEmergencyCardPosition(i, cardCount, availableSpace))
    }
  }
  
  return positions
}

/**
 * 为指定索引计算安全位置
 * @param index - 卡牌索引
 * @param layoutConfig - 布局配置
 * @param cardSize - 卡牌尺寸
 * @param spacing - 间距配置
 * @param availableSpace - 可用空间
 * @returns 安全位置
 */
function calculateSafePositionForIndex(
  index: number,
  layoutConfig: LayoutConfig,
  cardSize: { width: number; height: number },
  spacing: { horizontal: number; vertical: number },
  availableSpace: AvailableCardSpace
): CardPosition | null {
  try {
    const row = Math.floor(index / layoutConfig.cardsPerRow)
    const col = index % layoutConfig.cardsPerRow
    
    // 确保不超出行数限制
    if (row >= layoutConfig.rows) {
      return null
    }
    
    // 计算当前行的卡牌数量
    const cardsInRow = Math.min(layoutConfig.cardsPerRow, layoutConfig.totalCards - row * layoutConfig.cardsPerRow)
    
    // 计算行宽度和起始位置（居中）
    const rowWidth = cardsInRow * cardSize.width + (cardsInRow - 1) * spacing.horizontal
    const rowStartX = (availableSpace.width - rowWidth) / 2
    
    // 计算网格总高度和起始Y位置
    const totalGridHeight = layoutConfig.rows * cardSize.height + (layoutConfig.rows - 1) * spacing.vertical
    const gridStartY = (availableSpace.height - totalGridHeight) / 2
    
    // 计算卡牌中心位置
    const cardX = rowStartX + col * (cardSize.width + spacing.horizontal) + cardSize.width / 2
    const cardY = gridStartY + row * (cardSize.height + spacing.vertical) + cardSize.height / 2
    
    // 边界检查
    const cardLeft = cardX - cardSize.width / 2
    const cardRight = cardX + cardSize.width / 2
    const cardTop = cardY - cardSize.height / 2
    const cardBottom = cardY + cardSize.height / 2
    
    if (cardLeft < 0 || cardRight > availableSpace.width || 
        cardTop < 0 || cardBottom > availableSpace.height) {
      return null // 位置会溢出
    }
    
    return {
      x: cardX,
      y: cardY,
      rotation: 0, // 高卡牌数时不旋转以确保稳定性
      cardWidth: cardSize.width,
      cardHeight: cardSize.height
    }
  } catch (error) {
    console.error(`Error calculating position for card ${index}:`, error)
    return null
  }
}

/**
 * 创建紧急卡牌位置
 * @param index - 卡牌索引
 * @param totalCards - 总卡牌数
 * @param availableSpace - 可用空间
 * @returns 紧急位置
 */
function createEmergencyCardPosition(
  index: number,
  totalCards: number,
  availableSpace: AvailableCardSpace
): CardPosition {
  // 超安全的降级位置
  const cardSize = { width: 50, height: 75 }
  const spacing = 8
  const cardsPerRow = Math.max(1, Math.floor(availableSpace.width / (cardSize.width + spacing)))
  
  const row = Math.floor(index / cardsPerRow)
  const col = index % cardsPerRow
  
  return {
    x: col * (cardSize.width + spacing) + cardSize.width / 2 + spacing,
    y: row * (cardSize.height + spacing) + cardSize.height / 2 + spacing,
    rotation: 0,
    cardWidth: cardSize.width,
    cardHeight: cardSize.height
  }
}

/**
 * 创建保证有效的位置数组（最终保障）
 * @param cardCount - 卡牌数量
 * @param availableSpace - 可用空间
 * @returns 保证有效的位置数组
 */
function createGuaranteedPositionArray(
  cardCount: number,
  availableSpace: AvailableCardSpace
): CardPosition[] {
  const positions: CardPosition[] = []
  const cardSize = { width: 50, height: 75 }
  const spacing = 6
  
  // 简单网格，保证不溢出
  const cardsPerRow = Math.max(1, Math.floor(availableSpace.width / (cardSize.width + spacing)))
  
  for (let i = 0; i < cardCount; i++) {
    const row = Math.floor(i / cardsPerRow)
    const col = i % cardsPerRow
    
    positions.push({
      x: col * (cardSize.width + spacing) + cardSize.width / 2 + spacing,
      y: row * (cardSize.height + spacing) + cardSize.height / 2 + spacing,
      rotation: 0,
      cardWidth: cardSize.width,
      cardHeight: cardSize.height
    })
  }
  
  return positions
}

/**
 * 创建容器感知的降级布局
 * @param cardCount - 卡牌数量
 * @param containerWidth - 容器宽度
 * @param containerHeight - 容器高度
 * @returns 降级位置数组
 */
export function createContainerAwareFallback(
  cardCount: number,
  containerWidth: number,
  containerHeight: number
): CardPosition[] {
  console.warn(`Using container-aware fallback for ${cardCount} cards`)
  
  try {
    // 使用最小UI元素配置计算可用空间
    const { calculateAvailableCardSpace } = require('./card-space-calculator')
    const availableSpace = calculateAvailableCardSpace(containerWidth, containerHeight, {
      hasGameInfo: true,
      hasWarnings: false,
      hasStartButton: false,
      hasResultDisplay: false
    })
    
    return createGuaranteedPositionArray(cardCount, availableSpace)
  } catch (error) {
    console.error('Fallback calculation failed:', error)
    
    // 最终紧急降级
    const positions: CardPosition[] = []
    const cardSize = { width: 60, height: 90 }
    const spacing = 8
    const cardsPerRow = Math.max(1, Math.floor(containerWidth / (cardSize.width + spacing)))
    
    for (let i = 0; i < cardCount; i++) {
      const row = Math.floor(i / cardsPerRow)
      const col = i % cardsPerRow
      
      positions.push({
        x: col * (cardSize.width + spacing) + cardSize.width / 2 + spacing,
        y: row * (cardSize.height + spacing) + cardSize.height / 2 + spacing,
        rotation: 0,
        cardWidth: cardSize.width,
        cardHeight: cardSize.height
      })
    }
    
    return positions
  }
}