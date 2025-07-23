// 位置验证系统
// 提供卡牌位置验证、安全访问和错误恢复功能

import { 
  CardPosition, 
  PositionValidationResult, 
  PositionError, 
  DeviceConfig,
  PositionCalculationContext 
} from '@/types'
import { getDeviceConfig, detectDeviceType } from './layout-manager'

/**
 * 验证卡牌位置对象的有效性
 * @param position - 待验证的位置对象
 * @param index - 位置在数组中的索引
 * @param expectedCount - 期望的位置总数
 * @returns 验证结果
 */
export function validateCardPosition(
  position: any, 
  index: number, 
  expectedCount: number
): PositionValidationResult {
  // 检查位置对象是否存在
  if (!position) {
    return {
      isValid: false,
      error: `${PositionError.UNDEFINED_POSITION} at index ${index}`,
      fallbackApplied: false
    }
  }

  // 检查位置对象是否包含必需属性
  const requiredProps = ['x', 'y', 'rotation', 'cardWidth', 'cardHeight']
  const missingProps = requiredProps.filter(prop => 
    typeof position[prop] !== 'number' || isNaN(position[prop])
  )

  if (missingProps.length > 0) {
    return {
      isValid: false,
      error: `${PositionError.MISSING_PROPERTIES} at index ${index}: ${missingProps.join(', ')}`,
      fallbackApplied: false
    }
  }

  // 验证位置值是否合理
  if (Math.abs(position.x) > 10000 || Math.abs(position.y) > 10000) {
    return {
      isValid: false,
      error: `${PositionError.INVALID_VALUES} at index ${index}: x=${position.x}, y=${position.y}`,
      fallbackApplied: false
    }
  }

  // 验证卡牌尺寸是否合理
  if (position.cardWidth <= 0 || position.cardHeight <= 0 || 
      position.cardWidth > 1000 || position.cardHeight > 1000) {
    return {
      isValid: false,
      error: `${PositionError.INVALID_VALUES} at index ${index}: cardWidth=${position.cardWidth}, cardHeight=${position.cardHeight}`,
      fallbackApplied: false
    }
  }

  // 验证旋转角度是否合理
  if (Math.abs(position.rotation) > 360) {
    return {
      isValid: false,
      error: `${PositionError.INVALID_VALUES} at index ${index}: rotation=${position.rotation}`,
      fallbackApplied: false
    }
  }

  return {
    isValid: true,
    position: position as CardPosition
  }
}

/**
 * 安全地访问卡牌位置，提供降级处理
 * @param positions - 位置数组
 * @param index - 要访问的索引
 * @param fallbackPosition - 降级位置
 * @returns 安全的位置对象
 */
export function getSafeCardPosition(
  positions: CardPosition[], 
  index: number, 
  fallbackPosition: CardPosition
): CardPosition {
  // 验证数组边界
  if (!Array.isArray(positions) || index < 0 || index >= positions.length) {
    console.warn(`${PositionError.ARRAY_BOUNDS}: index ${index}, length ${positions?.length || 0}`)
    return {
      ...fallbackPosition,
      isFallback: true,
      validationError: PositionError.ARRAY_BOUNDS
    }
  }

  // 验证位置对象
  const validation = validateCardPosition(positions[index], index, positions.length)
  
  if (!validation.isValid) {
    console.warn(`Invalid position at index ${index}: ${validation.error}`)
    return {
      ...fallbackPosition,
      isFallback: true,
      validationError: validation.error
    }
  }

  return {
    ...validation.position!,
    isValidated: true
  }
}

/**
 * 创建单个降级位置
 * @param index - 卡牌索引
 * @param deviceConfig - 设备配置
 * @returns 降级位置对象
 */
export function createSingleFallbackPosition(
  index: number, 
  deviceConfig: DeviceConfig
): CardPosition {
  return {
    x: 0,
    y: index * 20 - 50, // 垂直堆叠
    rotation: 0,
    cardWidth: deviceConfig.cardSize.width,
    cardHeight: deviceConfig.cardSize.height,
    isFallback: true
  }
}

/**
 * 创建降级位置数组
 * @param cardCount - 卡牌数量
 * @param deviceConfig - 设备配置
 * @returns 降级位置数组
 */
export function createFallbackPositions(
  cardCount: number, 
  deviceConfig: DeviceConfig
): CardPosition[] {
  const positions: CardPosition[] = []
  const { cardSize } = deviceConfig
  
  // 创建简单的网格布局
  const cardsPerRow = Math.min(3, cardCount)
  const rows = Math.ceil(cardCount / cardsPerRow)
  
  for (let i = 0; i < cardCount; i++) {
    const row = Math.floor(i / cardsPerRow)
    const col = i % cardsPerRow
    
    // 居中网格
    const gridWidth = cardsPerRow * (cardSize.width + 16) - 16
    const gridHeight = rows * (cardSize.height + 16) - 16
    
    positions.push({
      x: col * (cardSize.width + 16) - gridWidth / 2 + cardSize.width / 2,
      y: row * (cardSize.height + 16) - gridHeight / 2 + cardSize.height / 2,
      rotation: 0,
      cardWidth: cardSize.width,
      cardHeight: cardSize.height,
      isFallback: true
    })
  }
  
  return positions
}

/**
 * 标准化位置数组长度
 * @param positions - 原始位置数组
 * @param expectedLength - 期望长度
 * @param deviceConfig - 设备配置
 * @returns 标准化后的位置数组
 */
export function normalizePositionArray(
  positions: CardPosition[], 
  expectedLength: number, 
  deviceConfig: DeviceConfig
): CardPosition[] {
  if (positions.length === expectedLength) {
    return positions
  }
  
  if (positions.length > expectedLength) {
    // 截断多余的位置
    console.warn(`Truncating position array from ${positions.length} to ${expectedLength}`)
    return positions.slice(0, expectedLength)
  }
  
  // 用降级位置扩展数组
  console.warn(`Extending position array from ${positions.length} to ${expectedLength}`)
  const normalized = [...positions]
  for (let i = positions.length; i < expectedLength; i++) {
    normalized.push(createSingleFallbackPosition(i, deviceConfig))
  }
  
  return normalized
}

/**
 * 验证容器尺寸是否有效
 * @param width - 容器宽度
 * @param height - 容器高度
 * @returns 是否有效
 */
export function isValidDimension(width: number, height: number): boolean {
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
 * 创建位置计算上下文
 * @param containerWidth - 容器宽度
 * @param containerHeight - 容器高度
 * @param cardCount - 卡牌数量
 * @returns 位置计算上下文
 */
export function createPositionContext(
  containerWidth: number,
  containerHeight: number,
  cardCount: number
): PositionCalculationContext {
  return {
    containerWidth,
    containerHeight,
    cardCount,
    deviceType: detectDeviceType(containerWidth),
    timestamp: Date.now(),
    fallbackApplied: false
  }
}

/**
 * 验证位置数组的完整性
 * @param positions - 位置数组
 * @param expectedCount - 期望数量
 * @returns 验证结果和错误信息
 */
export function validatePositionArray(
  positions: CardPosition[], 
  expectedCount: number
): { isValid: boolean; errors: string[]; validPositions: number } {
  const errors: string[] = []
  let validPositions = 0

  if (!Array.isArray(positions)) {
    errors.push('Position array is not an array')
    return { isValid: false, errors, validPositions: 0 }
  }

  if (positions.length !== expectedCount) {
    errors.push(`Position array length mismatch: expected ${expectedCount}, got ${positions.length}`)
  }

  // 验证每个位置
  for (let i = 0; i < positions.length; i++) {
    const validation = validateCardPosition(positions[i], i, expectedCount)
    if (validation.isValid) {
      validPositions++
    } else {
      errors.push(validation.error!)
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    validPositions
  }
}

/**
 * 优化的位置验证 - 减少性能影响
 * @param positions - 位置数组
 * @param expectedCount - 期望数量
 * @returns 快速验证结果
 */
export function optimizePositionValidation(
  positions: CardPosition[], 
  expectedCount: number
): { isValid: boolean; quickCheck: boolean } {
  // 快速检查 - 只验证关键属性
  if (!Array.isArray(positions) || positions.length !== expectedCount) {
    return { isValid: false, quickCheck: true }
  }

  // 抽样验证 - 只检查前几个和最后几个位置
  const sampleIndices = expectedCount <= 5 
    ? Array.from({ length: expectedCount }, (_, i) => i)
    : [0, 1, Math.floor(expectedCount / 2), expectedCount - 2, expectedCount - 1]

  for (const i of sampleIndices) {
    const pos = positions[i]
    if (!pos || typeof pos.x !== 'number' || typeof pos.y !== 'number') {
      return { isValid: false, quickCheck: true }
    }
  }

  return { isValid: true, quickCheck: true }
}

/**
 * 批量位置验证 - 优化大量位置的验证性能
 * @param positionBatches - 位置批次数组
 * @returns 批量验证结果
 */
export function batchValidatePositions(
  positionBatches: CardPosition[][]
): { validBatches: number; totalBatches: number; errors: string[] } {
  let validBatches = 0
  const errors: string[] = []

  for (let i = 0; i < positionBatches.length; i++) {
    const batch = positionBatches[i]
    const result = optimizePositionValidation(batch, batch.length)
    
    if (result.isValid) {
      validBatches++
    } else {
      errors.push(`Batch ${i} validation failed`)
    }
  }

  return {
    validBatches,
    totalBatches: positionBatches.length,
    errors
  }
}