// 修复的卡牌位置计算系统
// 解决卡牌溢出容器边界的问题

import type { CardPosition } from '@/types'

export interface SimpleCardSpace {
  width: number
  height: number
  centerX: number
  centerY: number
}

export interface CardLayoutResult {
  positions: CardPosition[]
  actualCardSize: { width: number; height: number }
  layoutInfo: {
    rows: number
    cardsPerRow: number
    totalWidth: number
    totalHeight: number
  }
}

/**
 * 计算简化的可用卡牌空间
 * 考虑页面顶部的游戏信息和底部的按钮区域
 */
export function calculateSimpleCardSpace(
  containerWidth: number,
  containerHeight: number
): SimpleCardSpace {
  // 更精确的空间预留，基于实际UI元素高度
  const topReserved = 260  // 减少顶部预留空间：游戏信息面板(120px) + 状态提示(40px) + 边距(100px)
  const bottomReserved = 60   // 减少底部边距，为卡牌提供更多空间
  const sideMargin = 30       // 减少左右边距，为卡牌提供更多宽度
  
  const availableWidth = containerWidth - (sideMargin * 2)
  const availableHeight = containerHeight - topReserved - bottomReserved
  
  // 更保守的空间计算，确保多行布局不溢出，但为9张卡牌提供更多空间
  const safeWidth = Math.max(320, Math.min(availableWidth, containerWidth * 0.9))  // 增加到90%
  const safeHeight = Math.max(200, Math.min(availableHeight, containerHeight * 0.5)) // 增加到50%
  
  // 调试信息
  if (process.env.NODE_ENV === 'development') {
    console.log('Card Space Calculation:', {
      container: `${containerWidth}x${containerHeight}`,
      reserved: { top: topReserved, bottom: bottomReserved, sides: sideMargin * 2 },
      available: `${availableWidth}x${availableHeight}`,
      safe: `${safeWidth}x${safeHeight}`
    })
  }
  
  return {
    width: safeWidth,
    height: safeHeight,
    centerX: containerWidth / 2,
    centerY: topReserved + safeHeight / 2
  }
}

/**
 * 确定卡牌布局配置
 * 根据卡牌数量和可用空间确定最佳的行列布局，严格防止溢出
 */
export function determineCardLayout(cardCount: number, space: SimpleCardSpace) {
  // 计算最小卡牌尺寸要求
  const minCardWidth = 60
  const minCardHeight = 90
  const horizontalSpacing = 16
  const verticalSpacing = 12
  
  // 计算最大可能的行列数
  const maxCardsPerRow = Math.floor((space.width + horizontalSpacing) / (minCardWidth + horizontalSpacing))
  const maxRows = Math.floor((space.height + verticalSpacing) / (minCardHeight + verticalSpacing))
  
  // 特殊处理常见的卡牌数量，严格遵守空间限制
  switch (cardCount) {
    case 1:
    case 2:
      return { rows: 1, cardsPerRow: cardCount }
    
    case 3:
      return { rows: 1, cardsPerRow: 3 }
    
    case 4:
      // 检查是否能容纳2行
      if (maxRows >= 2 && space.height >= 200) {
        return { rows: 2, cardsPerRow: 2 }
      } else {
        return { rows: 1, cardsPerRow: 4 }
      }
    
    case 5:
      // 严格检查垂直空间
      if (maxRows >= 2 && space.height >= 220) {
        return { rows: 2, cardsPerRow: 3 }  // 3+2布局
      } else {
        return { rows: 1, cardsPerRow: 5 }  // 强制单行
      }
    
    case 6:
      // 根据实际可用空间决定布局
      if (maxRows >= 2 && space.height >= 240) {
        if (maxCardsPerRow >= 3) {
          return { rows: 2, cardsPerRow: 3 }  // 2x3布局
        } else {
          return { rows: 3, cardsPerRow: 2 }  // 3x2布局
        }
      } else {
        return { rows: 1, cardsPerRow: 6 }  // 强制单行
      }
    
    case 7:
      if (maxRows >= 2 && space.height >= 240) {
        return { rows: 2, cardsPerRow: 4 }  // 4+3布局
      } else {
        return { rows: 1, cardsPerRow: 7 }  // 强制单行
      }
    
    case 8:
      if (maxRows >= 2 && space.height >= 240) {
        return { rows: 2, cardsPerRow: 4 }  // 4+4布局
      } else {
        return { rows: 1, cardsPerRow: 8 }  // 强制单行
      }
    
    case 9:
      // 优化：9张牌统一使用2行布局（5+4），与8张、10张保持一致的风格
      if (maxRows >= 2 && space.height >= 200) {
        return { rows: 2, cardsPerRow: 5 }  // 5+4布局，更协调
      } else {
        // 即使空间很小，也优先使用2行而不是3行或单行
        return { rows: 2, cardsPerRow: 5 }  // 强制2行布局
      }
    
    case 10:
      if (maxRows >= 2 && space.height >= 240) {
        return { rows: 2, cardsPerRow: 5 }  // 5+5布局
      } else {
        return { rows: 1, cardsPerRow: 10 }  // 强制单行
      }
    
    default:
      // 通用算法：基于实际空间限制
      const optimalCardsPerRow = Math.min(maxCardsPerRow, Math.ceil(Math.sqrt(cardCount)))
      const requiredRows = Math.ceil(cardCount / optimalCardsPerRow)
      
      if (requiredRows <= maxRows) {
        return { rows: requiredRows, cardsPerRow: optimalCardsPerRow }
      } else {
        // 空间不足，强制单行
        return { rows: 1, cardsPerRow: cardCount }
      }
  }
}

/**
 * 计算卡牌尺寸
 * 确保卡牌能够完全容纳在可用空间内，严格防止溢出
 */
export function calculateCardSize(
  rows: number,
  cardsPerRow: number,
  space: SimpleCardSpace
): { width: number; height: number } {
  // 预留间距
  const horizontalSpacing = (cardsPerRow - 1) * 16  // 卡牌间水平间距
  const verticalSpacing = (rows - 1) * 12           // 卡牌间垂直间距
  
  // 计算单张卡牌的最大可用尺寸（更保守的计算）
  const maxCardWidth = Math.floor((space.width - horizontalSpacing - 20) / cardsPerRow)  // 额外预留20px边距
  const maxCardHeight = Math.floor((space.height - verticalSpacing - 20) / rows)        // 额外预留20px边距
  
  // 标准卡牌比例 (宽:高 = 2:3)
  const cardAspectRatio = 3 / 2  // height / width
  
  // 根据比例约束计算实际尺寸，使用更保守的最大值
  // 对于多行布局（特别是9张卡牌），进一步限制最大尺寸
  const maxWidthLimit = rows > 1 ? 85 : 100   // 多行时更小的宽度限制
  const maxHeightLimit = rows > 1 ? 130 : 150 // 多行时更小的高度限制
  
  let cardWidth = Math.min(maxCardWidth, maxWidthLimit)
  let cardHeight = Math.min(maxCardHeight, maxHeightLimit)
  
  // 保持纵横比
  if (cardWidth * cardAspectRatio > cardHeight) {
    cardWidth = Math.floor(cardHeight / cardAspectRatio)
  } else {
    cardHeight = Math.floor(cardWidth * cardAspectRatio)
  }
  
  // 确保最小尺寸
  cardWidth = Math.max(50, cardWidth)   // 降低最小宽度
  cardHeight = Math.max(75, cardHeight) // 降低最小高度
  
  // 最终验证：确保计算出的尺寸不会导致溢出
  const totalWidth = cardsPerRow * cardWidth + horizontalSpacing
  const totalHeight = rows * cardHeight + verticalSpacing
  
  if (totalWidth > space.width || totalHeight > space.height) {
    // 如果仍然溢出，进一步缩小
    const widthScale = space.width / totalWidth
    const heightScale = space.height / totalHeight
    const scale = Math.min(widthScale, heightScale, 0.9) // 最多缩放到90%
    
    cardWidth = Math.floor(cardWidth * scale)
    cardHeight = Math.floor(cardHeight * scale)
    
    // 确保缩放后仍满足最小尺寸
    cardWidth = Math.max(40, cardWidth)
    cardHeight = Math.max(60, cardHeight)
  }
  
  if (process.env.NODE_ENV === 'development') {
    console.log('Card Size Calculation:', {
      layout: `${rows}x${cardsPerRow}`,
      space: `${space.width}x${space.height}`,
      maxSize: `${maxCardWidth}x${maxCardHeight}`,
      finalSize: `${cardWidth}x${cardHeight}`,
      totalRequired: `${cardsPerRow * cardWidth + horizontalSpacing}x${rows * cardHeight + verticalSpacing}`
    })
  }
  
  return { width: cardWidth, height: cardHeight }
}

/**
 * 生成卡牌位置
 * 使用相对于容器中心的坐标系统
 */
export function generateCardPositions(
  cardCount: number,
  rows: number,
  cardsPerRow: number,
  cardSize: { width: number; height: number },
  space: SimpleCardSpace
): CardPosition[] {
  const positions: CardPosition[] = []
  
  // 计算网格总尺寸
  const horizontalSpacing = 16
  const verticalSpacing = 12
  
  const totalGridWidth = cardsPerRow * cardSize.width + (cardsPerRow - 1) * horizontalSpacing
  const totalGridHeight = rows * cardSize.height + (rows - 1) * verticalSpacing
  
  // 网格左上角相对于可用空间中心的偏移
  const gridStartX = -totalGridWidth / 2
  const gridStartY = -totalGridHeight / 2
  
  let cardIndex = 0
  
  for (let row = 0; row < rows && cardIndex < cardCount; row++) {
    const cardsInThisRow = Math.min(cardsPerRow, cardCount - row * cardsPerRow)
    
    // 如果这一行卡牌数量少于标准数量，需要居中对齐
    const rowWidth = cardsInThisRow * cardSize.width + (cardsInThisRow - 1) * horizontalSpacing
    const rowStartX = -rowWidth / 2
    
    for (let col = 0; col < cardsInThisRow && cardIndex < cardCount; col++) {
      // 计算卡牌中心位置（相对于可用空间中心）
      const cardX = rowStartX + col * (cardSize.width + horizontalSpacing) + cardSize.width / 2
      const cardY = gridStartY + row * (cardSize.height + verticalSpacing) + cardSize.height / 2
      
      positions.push({
        x: cardX,
        y: cardY,
        rotation: (Math.random() - 0.5) * 4, // 轻微随机旋转
        cardWidth: cardSize.width,
        cardHeight: cardSize.height
      })
      
      cardIndex++
    }
  }
  
  return positions
}

/**
 * 主要的卡牌布局计算函数
 * 整合所有步骤，返回完整的布局结果
 */
export function calculateFixedCardLayout(
  cardCount: number,
  containerWidth: number,
  containerHeight: number
): CardLayoutResult {
  // 1. 计算可用空间
  const space = calculateSimpleCardSpace(containerWidth, containerHeight)
  
  // 2. 确定布局配置
  const layout = determineCardLayout(cardCount, space)
  
  // 3. 计算卡牌尺寸
  const cardSize = calculateCardSize(layout.rows, layout.cardsPerRow, space)
  
  // 4. 生成位置
  const positions = generateCardPositions(
    cardCount,
    layout.rows,
    layout.cardsPerRow,
    cardSize,
    space
  )
  
  // 5. 计算布局信息
  const horizontalSpacing = 16
  const verticalSpacing = 12
  const totalWidth = layout.cardsPerRow * cardSize.width + (layout.cardsPerRow - 1) * horizontalSpacing
  const totalHeight = layout.rows * cardSize.height + (layout.rows - 1) * verticalSpacing
  
  return {
    positions,
    actualCardSize: cardSize,
    layoutInfo: {
      rows: layout.rows,
      cardsPerRow: layout.cardsPerRow,
      totalWidth,
      totalHeight
    }
  }
}

/**
 * 创建紧急布局，当常规布局失败时使用
 * 使用最小卡牌尺寸和紧凑间距，确保所有卡牌都能显示
 */
export function createEmergencyLayout(
  cardCount: number,
  space: SimpleCardSpace
): CardLayoutResult {
  // 使用更小的最小卡牌尺寸和间距
  const minCardWidth = 35
  const minCardHeight = 50
  const minSpacing = 6
  
  // 计算能容纳的最大行列数（更保守的计算）
  const maxCardsPerRow = Math.floor((space.width - 20) / (minCardWidth + minSpacing)) // 预留20px边距
  const maxRows = Math.floor((space.height - 20) / (minCardHeight + minSpacing)) // 预留20px边距
  
  // 优先选择更紧凑的布局
  let cardsPerRow, rows
  
  if (cardCount <= maxCardsPerRow) {
    // 如果能单行显示，优先单行
    cardsPerRow = cardCount
    rows = 1
  } else {
    // 多行布局，优先减少行数
    cardsPerRow = Math.min(maxCardsPerRow, Math.ceil(cardCount / Math.min(maxRows, 2)))
    rows = Math.ceil(cardCount / cardsPerRow)
    
    // 如果仍然超出行数限制，强制调整
    if (rows > maxRows) {
      rows = Math.max(1, maxRows)
      cardsPerRow = Math.ceil(cardCount / rows)
    }
  }
  
  // 重新计算卡牌尺寸以适应空间（更保守）
  const availableWidth = space.width - (cardsPerRow - 1) * minSpacing - 20 // 预留边距
  const availableHeight = space.height - (rows - 1) * minSpacing - 20 // 预留边距
  
  let cardWidth = Math.max(minCardWidth, Math.floor(availableWidth / cardsPerRow))
  let cardHeight = Math.max(minCardHeight, Math.floor(availableHeight / rows))
  
  // 保持合理的宽高比
  const aspectRatio = cardHeight / cardWidth
  if (aspectRatio > 2.0) {
    cardHeight = Math.floor(cardWidth * 2.0)
  } else if (aspectRatio < 1.2) {
    cardWidth = Math.floor(cardHeight / 1.2)
  }
  
  // 确保最终尺寸不会导致溢出
  const finalTotalWidth = cardsPerRow * cardWidth + (cardsPerRow - 1) * minSpacing
  const finalTotalHeight = rows * cardHeight + (rows - 1) * minSpacing
  
  if (finalTotalWidth > space.width * 0.95 || finalTotalHeight > space.height * 0.95) {
    // 进一步缩小
    const widthScale = (space.width * 0.95) / finalTotalWidth
    const heightScale = (space.height * 0.95) / finalTotalHeight
    const scale = Math.min(widthScale, heightScale, 0.9)
    
    cardWidth = Math.max(minCardWidth, Math.floor(cardWidth * scale))
    cardHeight = Math.max(minCardHeight, Math.floor(cardHeight * scale))
  }
  
  // 生成位置
  const positions = generateCardPositions(
    cardCount,
    rows,
    cardsPerRow,
    { width: cardWidth, height: cardHeight },
    space
  )
  
  const totalWidth = cardsPerRow * cardWidth + (cardsPerRow - 1) * minSpacing
  const totalHeight = rows * cardHeight + (rows - 1) * minSpacing
  
  console.warn('Using emergency layout:', {
    cardCount,
    layout: `${rows}x${cardsPerRow}`,
    cardSize: `${cardWidth}x${cardHeight}`,
    totalSize: `${totalWidth}x${totalHeight}`,
    space: `${space.width}x${space.height}`,
    utilization: `${Math.round(totalWidth/space.width*100)}%x${Math.round(totalHeight/space.height*100)}%`
  })
  
  return {
    positions,
    actualCardSize: { width: cardWidth, height: cardHeight },
    layoutInfo: {
      rows,
      cardsPerRow,
      totalWidth,
      totalHeight
    }
  }
}

/**
 * 验证布局是否在边界内
 */
export function validateLayout(result: CardLayoutResult, space: SimpleCardSpace): boolean {
  const { totalWidth, totalHeight } = result.layoutInfo
  
  // 更合理的边界检查（留5%的安全边距）
  const safeWidth = space.width * 0.95
  const safeHeight = space.height * 0.95
  
  const isValid = totalWidth <= safeWidth && totalHeight <= safeHeight
  
  if (!isValid) {
    console.warn('Layout validation failed:', {
      required: `${totalWidth}x${totalHeight}`,
      available: `${safeWidth}x${safeHeight}`,
      actualSpace: `${space.width}x${space.height}`,
      overflow: {
        width: Math.max(0, totalWidth - safeWidth),
        height: Math.max(0, totalHeight - safeHeight)
      }
    })
  } else if (process.env.NODE_ENV === 'development') {
    console.log('Layout validation passed:', {
      required: `${totalWidth}x${totalHeight}`,
      available: `${safeWidth}x${safeHeight}`,
      utilization: {
        width: `${Math.round((totalWidth / safeWidth) * 100)}%`,
        height: `${Math.round((totalHeight / safeHeight) * 100)}%`
      }
    })
  }
  
  return isValid
}