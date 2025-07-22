import { CardPosition, LayoutConfig, SpacingConfig } from '@/types'

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

export interface PositionValidationResult extends ValidationResult {
  overlappingCards: Array<{ card1: number; card2: number }>
  outOfBoundsCards: number[]
}

export interface SpacingValidationResult extends ValidationResult {
  inconsistentSpacing: Array<{ expected: number; actual: number; location: string }>
}

export interface OverflowValidationResult extends ValidationResult {
  overflowAreas: Array<{ direction: 'horizontal' | 'vertical'; amount: number }>
}

/**
 * 验证卡片位置一致性
 */
export function validatePositionConsistency(
  positions: CardPosition[],
  containerWidth: number,
  containerHeight: number,
  cardWidth: number,
  cardHeight: number
): PositionValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  const overlappingCards: Array<{ card1: number; card2: number }> = []
  const outOfBoundsCards: number[] = []

  // 检查卡片是否超出容器边界
  positions.forEach((pos, index) => {
    if (pos.x < 0 || pos.y < 0 || 
        pos.x + cardWidth > containerWidth || 
        pos.y + cardHeight > containerHeight) {
      outOfBoundsCards.push(index)
      errors.push(`Card ${index} is out of bounds at position (${pos.x}, ${pos.y})`)
    }
  })

  // 检查卡片重叠
  for (let i = 0; i < positions.length; i++) {
    for (let j = i + 1; j < positions.length; j++) {
      const pos1 = positions[i]
      const pos2 = positions[j]
      
      if (isOverlapping(pos1, pos2, cardWidth, cardHeight)) {
        overlappingCards.push({ card1: i, card2: j })
        errors.push(`Cards ${i} and ${j} are overlapping`)
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    overlappingCards,
    outOfBoundsCards
  }
}

/**
 * 验证间距规范
 */
export function validateSpacingStandards(
  positions: CardPosition[],
  expectedSpacing: SpacingConfig,
  cardWidth: number,
  cardHeight: number
): SpacingValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  const inconsistentSpacing: Array<{ expected: number; actual: number; location: string }> = []

  // 检查水平间距
  for (let i = 0; i < positions.length - 1; i++) {
    const current = positions[i]
    const next = positions[i + 1]
    
    // 如果卡片在同一行
    if (Math.abs(current.y - next.y) < cardHeight / 2) {
      const actualSpacing = next.x - (current.x + cardWidth)
      if (Math.abs(actualSpacing - expectedSpacing.horizontal) > expectedSpacing.tolerance) {
        inconsistentSpacing.push({
          expected: expectedSpacing.horizontal,
          actual: actualSpacing,
          location: `between cards ${i} and ${i + 1} (horizontal)`
        })
        errors.push(`Horizontal spacing inconsistent between cards ${i} and ${i + 1}`)
      }
    }
  }

  // 检查垂直间距
  const rows = groupCardsByRow(positions, cardHeight)
  for (let i = 0; i < rows.length - 1; i++) {
    const currentRow = rows[i]
    const nextRow = rows[i + 1]
    
    if (currentRow.length > 0 && nextRow.length > 0) {
      const actualSpacing = nextRow[0].y - (currentRow[0].y + cardHeight)
      if (Math.abs(actualSpacing - expectedSpacing.vertical) > expectedSpacing.tolerance) {
        inconsistentSpacing.push({
          expected: expectedSpacing.vertical,
          actual: actualSpacing,
          location: `between row ${i} and ${i + 1} (vertical)`
        })
        errors.push(`Vertical spacing inconsistent between rows ${i} and ${i + 1}`)
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    inconsistentSpacing
  }
}

/**
 * 检测布局溢出
 */
export function detectLayoutOverflow(
  positions: CardPosition[],
  containerWidth: number,
  containerHeight: number,
  cardWidth: number,
  cardHeight: number,
  padding: { top: number; right: number; bottom: number; left: number }
): OverflowValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  const overflowAreas: Array<{ direction: 'horizontal' | 'vertical'; amount: number }> = []

  const effectiveWidth = containerWidth - padding.left - padding.right
  const effectiveHeight = containerHeight - padding.top - padding.bottom

  let maxX = 0
  let maxY = 0

  positions.forEach(pos => {
    maxX = Math.max(maxX, pos.x + cardWidth)
    maxY = Math.max(maxY, pos.y + cardHeight)
  })

  // 检查水平溢出
  if (maxX > effectiveWidth) {
    const overflowAmount = maxX - effectiveWidth
    overflowAreas.push({ direction: 'horizontal', amount: overflowAmount })
    errors.push(`Horizontal overflow detected: ${overflowAmount}px`)
  }

  // 检查垂直溢出
  if (maxY > effectiveHeight) {
    const overflowAmount = maxY - effectiveHeight
    overflowAreas.push({ direction: 'vertical', amount: overflowAmount })
    errors.push(`Vertical overflow detected: ${overflowAmount}px`)
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    overflowAreas
  }
}

/**
 * 综合布局验证
 */
export function validateLayout(
  positions: CardPosition[],
  config: LayoutConfig,
  containerWidth: number,
  containerHeight: number
): ValidationResult {
  const positionResult = validatePositionConsistency(
    positions,
    containerWidth,
    containerHeight,
    config.cardWidth,
    config.cardHeight
  )

  const spacingResult = validateSpacingStandards(
    positions,
    config.spacing,
    config.cardWidth,
    config.cardHeight
  )

  const overflowResult = detectLayoutOverflow(
    positions,
    containerWidth,
    containerHeight,
    config.cardWidth,
    config.cardHeight,
    config.padding
  )

  const allErrors = [
    ...positionResult.errors,
    ...spacingResult.errors,
    ...overflowResult.errors
  ]

  const allWarnings = [
    ...positionResult.warnings,
    ...spacingResult.warnings,
    ...overflowResult.warnings
  ]

  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings
  }
}

// 辅助函数
function isOverlapping(
  pos1: CardPosition,
  pos2: CardPosition,
  cardWidth: number,
  cardHeight: number
): boolean {
  return !(
    pos1.x + cardWidth <= pos2.x ||
    pos2.x + cardWidth <= pos1.x ||
    pos1.y + cardHeight <= pos2.y ||
    pos2.y + cardHeight <= pos1.y
  )
}

function groupCardsByRow(positions: CardPosition[], cardHeight: number): CardPosition[][] {
  const rows: CardPosition[][] = []
  const sortedPositions = [...positions].sort((a, b) => a.y - b.y)

  let currentRow: CardPosition[] = []
  let currentRowY = -1

  sortedPositions.forEach(pos => {
    if (currentRowY === -1 || Math.abs(pos.y - currentRowY) < cardHeight / 2) {
      currentRow.push(pos)
      currentRowY = pos.y
    } else {
      if (currentRow.length > 0) {
        rows.push(currentRow)
      }
      currentRow = [pos]
      currentRowY = pos.y
    }
  })

  if (currentRow.length > 0) {
    rows.push(currentRow)
  }

  return rows
}