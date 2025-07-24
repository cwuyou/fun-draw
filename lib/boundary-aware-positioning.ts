// 边界感知位置计算系统
// 确保所有卡牌位置都在容器边界内，防止溢出

import { detectDeviceType, getDeviceConfig } from './layout-manager'
import { getSpacingConfig } from './spacing-system'
import { calculateAvailableCardSpace, type AvailableCardSpace } from './card-space-calculator'
import type { CardPosition, DeviceType } from '@/types'

// 错误处理和日志记录系统
export interface ErrorContext {
  containerWidth: number
  containerHeight: number
  cardCount: number
  availableSpace?: { width: number; height: number }
  deviceType?: DeviceType
  timestamp: number
  stackTrace?: string
}

export interface PositionCalculationLog {
  step: string
  success: boolean
  duration: number
  data?: any
  error?: string
  context: ErrorContext
}

class PositionLogger {
  private logs: PositionCalculationLog[] = []
  private isDebugMode = process.env.NODE_ENV === 'development'

  logStep(step: string, success: boolean, duration: number, context: ErrorContext, data?: any, error?: string) {
    const logEntry: PositionCalculationLog = {
      step,
      success,
      duration,
      data,
      error,
      context
    }
    
    this.logs.push(logEntry)
    
    if (this.isDebugMode) {
      if (success) {
        console.log(`✅ ${step} (${duration.toFixed(2)}ms)`, data ? { data } : '')
      } else {
        console.error(`❌ ${step} (${duration.toFixed(2)}ms)`, { error, context })
      }
    }
  }

  logError(step: string, error: Error, context: ErrorContext) {
    const errorMessage = `${step} failed: ${error.message}`
    console.error(`🚨 ${errorMessage}`, {
      error: error.message,
      stack: error.stack,
      context: {
        containerSize: `${context.containerWidth}x${context.containerHeight}`,
        cardCount: context.cardCount,
        availableSpace: context.availableSpace ? `${context.availableSpace.width}x${context.availableSpace.height}` : 'unknown',
        deviceType: context.deviceType || 'unknown',
        timestamp: new Date(context.timestamp).toISOString()
      }
    })
    
    this.logStep(step, false, 0, context, undefined, error.message)
  }

  logWarning(step: string, message: string, context: ErrorContext, data?: any) {
    console.warn(`⚠️ ${step}: ${message}`, {
      context: {
        containerSize: `${context.containerWidth}x${context.containerHeight}`,
        cardCount: context.cardCount,
        availableSpace: context.availableSpace ? `${context.availableSpace.width}x${context.availableSpace.height}` : 'unknown'
      },
      data
    })
  }

  getDebugSummary(): { totalSteps: number; successRate: number; averageDuration: number; errors: string[] } {
    const totalSteps = this.logs.length
    const successfulSteps = this.logs.filter(log => log.success).length
    const successRate = totalSteps > 0 ? (successfulSteps / totalSteps) * 100 : 0
    const averageDuration = totalSteps > 0 ? this.logs.reduce((sum, log) => sum + log.duration, 0) / totalSteps : 0
    const errors = this.logs.filter(log => !log.success).map(log => log.error || 'Unknown error')
    
    return { totalSteps, successRate, averageDuration, errors }
  }

  clearLogs() {
    this.logs = []
  }
}

const positionLogger = new PositionLogger()

function createErrorContext(
  containerWidth: number,
  containerHeight: number,
  cardCount: number,
  availableSpace?: AvailableCardSpace,
  deviceType?: DeviceType
): ErrorContext {
  return {
    containerWidth,
    containerHeight,
    cardCount,
    availableSpace: availableSpace ? { width: availableSpace.width, height: availableSpace.height } : undefined,
    deviceType,
    timestamp: Date.now(),
    stackTrace: new Error().stack
  }
}

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

export interface RealTimeBoundaryCheck {
  timestamp: number
  containerDimensions: { width: number; height: number }
  cardCount: number
  validationResult: BoundaryValidationResult
  correctionApplied: boolean
  performanceMetrics: {
    validationTime: number
    correctionTime?: number
  }
}

export interface FallbackResult {
  positions: CardPosition[]
  fallbackLevel: 'none' | 'correction' | 'safe-grid' | 'container-aware' | 'emergency'
  fallbackReason: string
  qualityScore: number // 0-100, 100 is perfect
  performanceMetrics: {
    calculationTime: number
    fallbackTime?: number
  }
  metadata: {
    originalCardCount: number
    actualCardCount: number
    containerDimensions: { width: number; height: number }
    availableSpace?: { width: number; height: number }
  }
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
  const startTime = performance.now()
  const context = createErrorContext(
    availableSpace.containerWidth,
    availableSpace.containerHeight,
    cardCount,
    availableSpace,
    detectDeviceType(availableSpace.containerWidth)
  )

  try {
    // 输入验证
    if (cardCount <= 0 || cardCount > 20) {
      positionLogger.logWarning(
        'Input Validation',
        `Invalid card count: ${cardCount}, using safe fallback`,
        context,
        { requestedCount: cardCount, appliedCount: Math.max(1, Math.min(cardCount, 10)) }
      )
      return createSafeGridLayout(Math.max(1, Math.min(cardCount, 10)), availableSpace)
    }
    
    positionLogger.logStep('Input Validation', true, performance.now() - startTime, context, { cardCount })
    
    // 确定最优布局配置
    const layoutStartTime = performance.now()
    const layoutConfig = determineOptimalLayout(cardCount, availableSpace)
    positionLogger.logStep('Layout Configuration', true, performance.now() - layoutStartTime, context, layoutConfig)
    
    // 计算适合边界的卡牌尺寸
    const sizeStartTime = performance.now()
    const cardSize = calculateOptimalCardSize(layoutConfig, availableSpace)
    positionLogger.logStep('Card Size Calculation', true, performance.now() - sizeStartTime, context, cardSize)
    
    // 计算安全间距
    const spacingStartTime = performance.now()
    const spacing = calculateSafeSpacing(layoutConfig, cardSize, availableSpace)
    positionLogger.logStep('Spacing Calculation', true, performance.now() - spacingStartTime, context, spacing)
    
    // 生成位置并确保数组完整性
    const positionStartTime = performance.now()
    const positions = generateAbsolutePositions(
      cardCount,
      layoutConfig,
      cardSize,
      spacing,
      availableSpace
    )
    positionLogger.logStep('Position Generation', true, performance.now() - positionStartTime, context, { positionCount: positions.length })
    
    // 验证位置数组长度
    if (positions.length !== cardCount) {
      positionLogger.logError(
        'Position Array Validation',
        new Error(`Position array length mismatch: expected ${cardCount}, got ${positions.length}`),
        context
      )
      return createGuaranteedPositionArray(cardCount, availableSpace)
    }
    
    // 最终边界验证
    const validationStartTime = performance.now()
    const boundaryCheck = validatePositionBoundaries(positions, availableSpace)
    positionLogger.logStep('Boundary Validation', boundaryCheck.isValid, performance.now() - validationStartTime, context, {
      violations: boundaryCheck.violations.length,
      violationDetails: boundaryCheck.violations
    })
    
    if (!boundaryCheck.isValid) {
      positionLogger.logWarning(
        'Boundary Correction',
        `Generated positions have ${boundaryCheck.violations.length} boundary violations, applying corrections`,
        context,
        boundaryCheck.violations
      )
      const correctedPositions = validateAndCorrectPositions(positions, availableSpace)
      positionLogger.logStep('Position Correction', true, performance.now() - startTime, context, { correctedCount: correctedPositions.length })
      return correctedPositions
    }
    
    // 记录成功完成
    positionLogger.logStep('Complete Calculation', true, performance.now() - startTime, context, {
      totalPositions: positions.length,
      boundaryValid: boundaryCheck.isValid
    })
    
    // 开发模式下输出调试信息
    if (process.env.NODE_ENV === 'development') {
      console.group('🎯 Boundary-Aware Position Calculation')
      console.log('Card Count:', cardCount)
      console.log('Available Space:', availableSpace)
      console.log('Layout Config:', layoutConfig)
      console.log('Card Size:', cardSize)
      console.log('Spacing:', spacing)
      console.log('Generated Positions:', positions)
      console.log('Boundary Check:', boundaryCheck.isValid ? 'PASSED' : 'FAILED')
      console.log('Total Duration:', (performance.now() - startTime).toFixed(2) + 'ms')
      console.groupEnd()
    }
    
    return positions
    
  } catch (error) {
    positionLogger.logError('Boundary-Aware Position Calculation', error as Error, context)
    return createGuaranteedPositionArray(cardCount, availableSpace)
  }
}

/**
 * 确定6卡牌的最优布局配置（增强版）
 * @param availableSpace - 可用空间
 * @returns 6卡牌的最优布局配置
 */
export function determineOptimal6CardLayout(availableSpace: AvailableCardSpace): LayoutConfig {
  const aspectRatio = availableSpace.width / availableSpace.height
  
  // 定义可能的布局选项
  const layoutOptions = [
    { rows: 1, cardsPerRow: 6, name: 'single-row' },    // 单行布局
    { rows: 2, cardsPerRow: 3, name: '2x3' },           // 2行3列
    { rows: 3, cardsPerRow: 2, name: '3x2' },           // 3行2列
  ]
  
  // 为每个布局选项计算适合度分数
  const layoutScores = layoutOptions.map(layout => {
    const score = calculate6CardLayoutScore(layout, availableSpace, aspectRatio)
    return { ...layout, score }
  })
  
  // 按分数排序，选择最佳布局
  layoutScores.sort((a, b) => b.score - a.score)
  const bestLayout = layoutScores[0]
  
  // 开发模式下输出调试信息
  if (process.env.NODE_ENV === 'development') {
    console.group('🎯 6-Card Layout Optimization')
    console.log('Available Space:', `${availableSpace.width}x${availableSpace.height}`)
    console.log('Aspect Ratio:', aspectRatio.toFixed(2))
    console.log('Layout Scores:', layoutScores.map(l => `${l.name}: ${l.score.toFixed(2)}`))
    console.log('Selected Layout:', `${bestLayout.name} (${bestLayout.rows}x${bestLayout.cardsPerRow})`)
    console.groupEnd()
  }
  
  return {
    rows: bestLayout.rows,
    cardsPerRow: bestLayout.cardsPerRow,
    totalCards: 6
  }
}

/**
 * 计算6卡牌布局的适合度分数
 * @param layout - 布局配置
 * @param availableSpace - 可用空间
 * @param aspectRatio - 容器纵横比
 * @returns 适合度分数（越高越好）
 */
function calculate6CardLayoutScore(
  layout: { rows: number; cardsPerRow: number; name: string },
  availableSpace: AvailableCardSpace,
  aspectRatio: number
): number {
  let score = 0
  
  // 基础分数：所有布局都有基础分数
  score += 50
  
  // 1. 纵横比适配分数（40分）
  if (layout.name === 'single-row') {
    // 单行布局适合超宽容器
    if (aspectRatio > 2.5) {
      score += 40
    } else if (aspectRatio > 2.0) {
      score += 20
    } else {
      score -= 20 // 不适合窄容器
    }
  } else if (layout.name === '2x3') {
    // 2x3布局适合宽容器
    if (aspectRatio > 1.2 && aspectRatio <= 2.5) {
      score += 40
    } else if (aspectRatio > 1.0) {
      score += 30
    } else {
      score += 10
    }
  } else if (layout.name === '3x2') {
    // 3x2布局适合高容器
    if (aspectRatio <= 1.2) {
      score += 40
    } else if (aspectRatio <= 1.5) {
      score += 30
    } else {
      score += 10
    }
  }
  
  // 2. 空间利用率分数（30分）
  const minSpacing = 8
  const cardAspectRatio = 1.5 // height / width
  
  // 计算在此布局下的最大可能卡牌尺寸
  const maxCardWidth = Math.floor((availableSpace.width - (layout.cardsPerRow - 1) * minSpacing) / layout.cardsPerRow)
  const maxCardHeight = Math.floor((availableSpace.height - (layout.rows - 1) * minSpacing) / layout.rows)
  
  // 根据纵横比约束计算实际卡牌尺寸
  let actualCardWidth = Math.min(maxCardWidth, availableSpace.maxCardWidth)
  let actualCardHeight = Math.min(maxCardHeight, availableSpace.maxCardHeight)
  
  if (actualCardWidth * cardAspectRatio > actualCardHeight) {
    actualCardWidth = Math.floor(actualCardHeight / cardAspectRatio)
  } else {
    actualCardHeight = Math.floor(actualCardWidth * cardAspectRatio)
  }
  
  // 确保最小尺寸
  actualCardWidth = Math.max(60, actualCardWidth)
  actualCardHeight = Math.max(90, actualCardHeight)
  
  // 计算总占用面积
  const totalCardArea = 6 * actualCardWidth * actualCardHeight
  const availableArea = availableSpace.width * availableSpace.height
  const utilizationRate = totalCardArea / availableArea
  
  // 空间利用率评分（目标是60-80%的利用率）
  if (utilizationRate >= 0.6 && utilizationRate <= 0.8) {
    score += 30
  } else if (utilizationRate >= 0.5 && utilizationRate <= 0.9) {
    score += 20
  } else if (utilizationRate >= 0.4) {
    score += 10
  }
  
  // 3. 平衡分布分数（20分）
  // 检查布局是否平衡（最后一行的卡牌数量）
  const lastRowCards = 6 % layout.cardsPerRow || layout.cardsPerRow
  const isBalanced = lastRowCards === layout.cardsPerRow || lastRowCards >= layout.cardsPerRow / 2
  
  if (isBalanced) {
    score += 20
  } else {
    score += 10 // 部分平衡
  }
  
  // 4. 80%容器限制分数（10分）
  const totalGridWidth = layout.cardsPerRow * actualCardWidth + (layout.cardsPerRow - 1) * minSpacing
  const totalGridHeight = layout.rows * actualCardHeight + (layout.rows - 1) * minSpacing
  
  const widthRatio = totalGridWidth / availableSpace.width
  const heightRatio = totalGridHeight / availableSpace.height
  
  if (widthRatio <= 0.8 && heightRatio <= 0.8) {
    score += 10
  } else if (widthRatio <= 0.9 && heightRatio <= 0.9) {
    score += 5
  }
  
  return score
}

/**
 * 确定最优布局配置
 * @param cardCount - 卡牌数量
 * @param availableSpace - 可用空间
 * @returns 布局配置
 */
export function determineOptimalLayout(cardCount: number, availableSpace: AvailableCardSpace): LayoutConfig {
  // 特殊处理6张卡牌 - 增强版布局优化
  if (cardCount === 6) {
    return determineOptimal6CardLayout(availableSpace)
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

// 自适应卡牌尺寸系统配置
export interface AdaptiveCardSizeConfig {
  minWidth: number
  minHeight: number
  maxWidth: number
  maxHeight: number
  aspectRatio: number
  readabilityThreshold: number // 最小可读性尺寸
  qualityThresholds: {
    excellent: number // 优秀尺寸阈值
    good: number      // 良好尺寸阈值
    acceptable: number // 可接受尺寸阈值
  }
}

export interface AdaptiveSizeResult {
  width: number
  height: number
  quality: 'excellent' | 'good' | 'acceptable' | 'minimal'
  scaleFactor: number
  readabilityScore: number
  adaptationReason: string
  preservedAspectRatio: boolean
}

// 默认自适应尺寸配置
const DEFAULT_ADAPTIVE_CONFIG: AdaptiveCardSizeConfig = {
  minWidth: 40,
  minHeight: 60,
  maxWidth: 120,
  maxHeight: 180,
  aspectRatio: 1.5, // 标准扑克牌比例
  readabilityThreshold: 50, // 最小可读性宽度
  qualityThresholds: {
    excellent: 100,
    good: 80,
    acceptable: 60
  }
}

/**
 * 自适应卡牌尺寸计算系统
 * 根据容器空间限制智能调整卡牌尺寸，保持可读性和视觉质量
 */
export function calculateAdaptiveCardSize(
  layoutConfig: LayoutConfig,
  availableSpace: AvailableCardSpace,
  config: Partial<AdaptiveCardSizeConfig> = {}
): AdaptiveSizeResult {
  const adaptiveConfig = { ...DEFAULT_ADAPTIVE_CONFIG, ...config }
  const startTime = performance.now()
  
  // 计算基础可用尺寸
  const spacing = 8 // 最小间距
  const maxWidth = Math.floor((availableSpace.width - (layoutConfig.cardsPerRow - 1) * spacing) / layoutConfig.cardsPerRow)
  const maxHeight = Math.floor((availableSpace.height - (layoutConfig.rows - 1) * spacing) / layoutConfig.rows)
  
  // 应用容器限制
  let targetWidth = Math.min(maxWidth, adaptiveConfig.maxWidth, availableSpace.maxCardWidth)
  let targetHeight = Math.min(maxHeight, adaptiveConfig.maxHeight, availableSpace.maxCardHeight)
  
  // 确保最小尺寸
  targetWidth = Math.max(adaptiveConfig.minWidth, targetWidth)
  targetHeight = Math.max(adaptiveConfig.minHeight, targetHeight)
  
  let adaptationReason = 'Initial calculation'
  let preservedAspectRatio = true
  
  // 纵横比调整
  const currentAspectRatio = targetHeight / targetWidth
  if (Math.abs(currentAspectRatio - adaptiveConfig.aspectRatio) > 0.1) {
    // 需要调整以保持纵横比
    if (targetWidth * adaptiveConfig.aspectRatio <= targetHeight) {
      // 宽度限制
      targetHeight = Math.floor(targetWidth * adaptiveConfig.aspectRatio)
      adaptationReason = 'Width-constrained aspect ratio adjustment'
    } else {
      // 高度限制
      targetWidth = Math.floor(targetHeight / adaptiveConfig.aspectRatio)
      adaptationReason = 'Height-constrained aspect ratio adjustment'
    }
  }
  
  // 可读性检查和调整
  if (targetWidth < adaptiveConfig.readabilityThreshold) {
    console.warn(`Card width ${targetWidth}px below readability threshold ${adaptiveConfig.readabilityThreshold}px`)
    
    // 尝试通过减少高度来增加宽度
    const minAcceptableHeight = adaptiveConfig.minHeight
    const maxPossibleWidth = Math.floor((availableSpace.width - (layoutConfig.cardsPerRow - 1) * spacing) / layoutConfig.cardsPerRow)
    
    if (maxPossibleWidth >= adaptiveConfig.readabilityThreshold) {
      targetWidth = Math.min(maxPossibleWidth, adaptiveConfig.readabilityThreshold)
      targetHeight = Math.max(minAcceptableHeight, Math.floor(targetWidth * adaptiveConfig.aspectRatio))
      adaptationReason = 'Readability optimization - width prioritized'
      preservedAspectRatio = targetHeight === Math.floor(targetWidth * adaptiveConfig.aspectRatio)
    } else {
      // 如果无法达到可读性阈值，至少确保最小尺寸
      adaptationReason = 'Readability optimization - minimal size applied'
      preservedAspectRatio = false
    }
  }
  
  // 最终边界检查
  targetWidth = Math.max(adaptiveConfig.minWidth, Math.min(targetWidth, adaptiveConfig.maxWidth))
  targetHeight = Math.max(adaptiveConfig.minHeight, Math.min(targetHeight, adaptiveConfig.maxHeight))
  
  // 计算质量评分
  let quality: AdaptiveSizeResult['quality']
  if (targetWidth >= adaptiveConfig.qualityThresholds.excellent) {
    quality = 'excellent'
  } else if (targetWidth >= adaptiveConfig.qualityThresholds.good) {
    quality = 'good'
  } else if (targetWidth >= adaptiveConfig.qualityThresholds.acceptable) {
    quality = 'acceptable'
  } else {
    quality = 'minimal'
  }
  
  // 计算缩放因子和可读性分数
  const scaleFactor = targetWidth / adaptiveConfig.maxWidth
  const readabilityScore = Math.min(100, (targetWidth / adaptiveConfig.readabilityThreshold) * 100)
  
  const result: AdaptiveSizeResult = {
    width: targetWidth,
    height: targetHeight,
    quality,
    scaleFactor,
    readabilityScore,
    adaptationReason,
    preservedAspectRatio
  }
  
  // 记录自适应调整日志
  if (process.env.NODE_ENV === 'development') {
    const duration = performance.now() - startTime
    console.log(`🎯 Adaptive Card Sizing (${duration.toFixed(2)}ms):`, {
      layout: `${layoutConfig.cardsPerRow}x${layoutConfig.rows}`,
      availableSpace: `${availableSpace.width}x${availableSpace.height}`,
      result: `${result.width}x${result.height}`,
      quality: result.quality,
      readabilityScore: `${result.readabilityScore.toFixed(1)}%`,
      reason: result.adaptationReason,
      aspectRatioPreserved: result.preservedAspectRatio
    })
  }
  
  return result
}

/**
 * 计算最优卡牌尺寸（使用自适应系统）
 * @param layoutConfig - 布局配置
 * @param availableSpace - 可用空间
 * @returns 卡牌尺寸
 */
export function calculateOptimalCardSize(
  layoutConfig: LayoutConfig,
  availableSpace: AvailableCardSpace
): { width: number; height: number } {
  // 使用新的自适应卡牌尺寸系统
  const adaptiveResult = calculateAdaptiveCardSize(layoutConfig, availableSpace)
  
  // 记录尺寸适应日志
  if (process.env.NODE_ENV === 'development') {
    console.log(`📏 Card Size Adaptation:`, {
      layout: `${layoutConfig.cardsPerRow}x${layoutConfig.rows}`,
      size: `${adaptiveResult.width}x${adaptiveResult.height}`,
      quality: adaptiveResult.quality,
      readability: `${adaptiveResult.readabilityScore.toFixed(1)}%`,
      aspectRatioPreserved: adaptiveResult.preservedAspectRatio,
      reason: adaptiveResult.adaptationReason
    })
  }
  
  return { 
    width: adaptiveResult.width, 
    height: adaptiveResult.height 
  }
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
 * 生成绝对坐标位置（修复卡牌跑到右下角的问题）
 * @param cardCount - 卡牌数量
 * @param layoutConfig - 布局配置
 * @param cardSize - 卡牌尺寸
 * @param spacing - 间距配置
 * @param availableSpace - 可用空间
 * @returns 位置数组
 */
function generateAbsolutePositions(
  cardCount: number,
  layoutConfig: LayoutConfig,
  cardSize: { width: number; height: number },
  spacing: { horizontal: number; vertical: number },
  availableSpace: AvailableCardSpace
): CardPosition[] {
  const positions: CardPosition[] = []
  
  // 计算网格总尺寸
  const totalGridWidth = layoutConfig.cardsPerRow * cardSize.width + (layoutConfig.cardsPerRow - 1) * spacing.horizontal
  const totalGridHeight = layoutConfig.rows * cardSize.height + (layoutConfig.rows - 1) * spacing.vertical
  
  // 计算网格在可用空间中的起始位置（居中）
  const gridStartX = (availableSpace.width - totalGridWidth) / 2
  const gridStartY = (availableSpace.height - totalGridHeight) / 2
  
  let cardIndex = 0
  
  for (let row = 0; row < layoutConfig.rows && cardIndex < cardCount; row++) {
    const cardsInRow = Math.min(layoutConfig.cardsPerRow, cardCount - row * layoutConfig.cardsPerRow)
    
    // 计算当前行的宽度和起始位置（用于居中对齐）
    const rowWidth = cardsInRow * cardSize.width + (cardsInRow - 1) * spacing.horizontal
    const rowStartX = (availableSpace.width - rowWidth) / 2
    
    for (let col = 0; col < cardsInRow && cardIndex < cardCount; col++) {
      // 计算卡牌在可用空间内的绝对位置（相对于可用空间左上角）
      const cardX = rowStartX + col * (cardSize.width + spacing.horizontal) + cardSize.width / 2
      const cardY = gridStartY + row * (cardSize.height + spacing.vertical) + cardSize.height / 2
      
      // 关键修复：使用相对于容器中心的坐标系统
      // 将绝对位置转换为相对于容器中心的偏移量
      const centerOffsetX = cardX - availableSpace.width / 2
      const centerOffsetY = cardY - availableSpace.height / 2
      
      positions.push({
        x: centerOffsetX,
        y: centerOffsetY,
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
 * 生成带边界检查的位置（保留原有函数作为备用）
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
 * 验证位置边界（修复：支持相对于容器中心的坐标系统）
 * @param positions - 位置数组
 * @param availableSpace - 可用空间
 * @returns 验证结果
 */
export function validatePositionBoundaries(
  positions: CardPosition[],
  availableSpace: AvailableCardSpace
): BoundaryValidationResult {
  const violations: BoundaryValidationResult['violations'] = []
  
  // 计算容器中心点
  const centerX = availableSpace.width / 2
  const centerY = availableSpace.height / 2
  
  positions.forEach((pos, index) => {
    // 将相对于中心的坐标转换为绝对坐标
    const absoluteX = pos.x + centerX
    const absoluteY = pos.y + centerY
    
    const cardLeft = absoluteX - pos.cardWidth / 2
    const cardRight = absoluteX + pos.cardWidth / 2
    const cardTop = absoluteY - pos.cardHeight / 2
    const cardBottom = absoluteY + pos.cardHeight / 2
    
    // 检查边界（相对于可用空间）
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
 * 验证并修正位置（修复：支持相对于容器中心的坐标系统）
 * @param positions - 原始位置数组
 * @param availableSpace - 可用空间
 * @returns 修正后的位置数组
 */
export function validateAndCorrectPositions(
  positions: CardPosition[],
  availableSpace: AvailableCardSpace
): CardPosition[] {
  const centerX = availableSpace.width / 2
  const centerY = availableSpace.height / 2
  
  return positions.map(pos => {
    // 将相对于中心的坐标转换为绝对坐标
    const absoluteX = pos.x + centerX
    const absoluteY = pos.y + centerY
    
    const cardLeft = absoluteX - pos.cardWidth / 2
    const cardRight = absoluteX + pos.cardWidth / 2
    const cardTop = absoluteY - pos.cardHeight / 2
    const cardBottom = absoluteY + pos.cardHeight / 2
    
    let correctedAbsoluteX = absoluteX
    let correctedAbsoluteY = absoluteY
    
    // 修正水平溢出
    if (cardLeft < 0) {
      correctedAbsoluteX = pos.cardWidth / 2
    } else if (cardRight > availableSpace.width) {
      correctedAbsoluteX = availableSpace.width - pos.cardWidth / 2
    }
    
    // 修正垂直溢出
    if (cardTop < 0) {
      correctedAbsoluteY = pos.cardHeight / 2
    } else if (cardBottom > availableSpace.height) {
      correctedAbsoluteY = availableSpace.height - pos.cardHeight / 2
    }
    
    // 转换回相对于中心的坐标
    const correctedX = correctedAbsoluteX - centerX
    const correctedY = correctedAbsoluteY - centerY
    
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
  
  // 计算容器中心点
  const centerX = availableSpace.width / 2
  const centerY = availableSpace.height / 2
  
  for (let i = 0; i < cardCount; i++) {
    const row = Math.floor(i / cardsPerRow)
    const col = i % cardsPerRow
    
    // 计算绝对位置
    const absoluteX = startX + col * (safeCardWidth + 12) + safeCardWidth / 2
    const absoluteY = startY + row * (safeCardHeight + 12) + safeCardHeight / 2
    
    // 转换为相对于容器中心的坐标
    const centerOffsetX = absoluteX - centerX
    const centerOffsetY = absoluteY - centerY
    
    positions.push({
      x: centerOffsetX,
      y: centerOffsetY,
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
    
    // 转换为相对于容器中心的坐标
    const centerX = availableSpace.width / 2
    const centerY = availableSpace.height / 2
    const centerOffsetX = cardX - centerX
    const centerOffsetY = cardY - centerY
    
    return {
      x: centerOffsetX,
      y: centerOffsetY,
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
  
  // 计算绝对位置
  const absoluteX = col * (cardSize.width + spacing) + cardSize.width / 2 + spacing
  const absoluteY = row * (cardSize.height + spacing) + cardSize.height / 2 + spacing
  
  // 转换为相对于容器中心的坐标
  const centerX = availableSpace.width / 2
  const centerY = availableSpace.height / 2
  const centerOffsetX = absoluteX - centerX
  const centerOffsetY = absoluteY - centerY
  
  return {
    x: centerOffsetX,
    y: centerOffsetY,
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
  
  // 计算容器中心点
  const centerX = availableSpace.width / 2
  const centerY = availableSpace.height / 2
  
  for (let i = 0; i < cardCount; i++) {
    const row = Math.floor(i / cardsPerRow)
    const col = i % cardsPerRow
    
    // 计算绝对位置
    const absoluteX = col * (cardSize.width + spacing) + cardSize.width / 2 + spacing
    const absoluteY = row * (cardSize.height + spacing) + cardSize.height / 2 + spacing
    
    // 转换为相对于容器中心的坐标
    const centerOffsetX = absoluteX - centerX
    const centerOffsetY = absoluteY - centerY
    
    positions.push({
      x: centerOffsetX,
      y: centerOffsetY,
      rotation: 0,
      cardWidth: cardSize.width,
      cardHeight: cardSize.height
    })
  }
  
  return positions
}

/**
 * 实时位置边界验证
 * @param positions - 当前卡牌位置数组
 * @param containerWidth - 容器宽度
 * @param containerHeight - 容器高度
 * @param uiElements - UI元素配置
 * @returns 实时边界检查结果
 */
export function performRealTimeBoundaryCheck(
  positions: CardPosition[],
  containerWidth: number,
  containerHeight: number,
  uiElements: {
    hasGameInfo?: boolean
    hasWarnings?: boolean
    hasStartButton?: boolean
    hasResultDisplay?: boolean
  } = {}
): RealTimeBoundaryCheck {
  const startTime = performance.now()
  
  try {
    // 计算当前可用空间
    const availableSpace = calculateAvailableCardSpace(containerWidth, containerHeight, uiElements)
    
    // 执行边界验证
    const validationResult = validatePositionBoundaries(positions, availableSpace)
    const validationTime = performance.now() - startTime
    
    let correctionApplied = false
    let correctionTime: number | undefined
    
    // 如果有边界违规，记录但不自动修正（实时检查只报告问题）
    if (!validationResult.isValid) {
      console.warn(`Real-time boundary check detected ${validationResult.violations.length} violations:`)
      validationResult.violations.forEach(violation => {
        console.warn(`  Card ${violation.cardIndex}: ${violation.violation} overflow by ${violation.overflow.toFixed(1)}px`)
      })
    }
    
    return {
      timestamp: Date.now(),
      containerDimensions: { width: containerWidth, height: containerHeight },
      cardCount: positions.length,
      validationResult,
      correctionApplied,
      performanceMetrics: {
        validationTime,
        correctionTime
      }
    }
  } catch (error) {
    console.error('Real-time boundary check failed:', error)
    
    // 返回失败状态
    return {
      timestamp: Date.now(),
      containerDimensions: { width: containerWidth, height: containerHeight },
      cardCount: positions.length,
      validationResult: {
        isValid: false,
        violations: [{
          cardIndex: -1,
          position: { x: 0, y: 0 },
          violation: 'left',
          overflow: 0
        }]
      },
      correctionApplied: false,
      performanceMetrics: {
        validationTime: performance.now() - startTime
      }
    }
  }
}

/**
 * 实时位置边界验证并自动修正
 * @param positions - 当前卡牌位置数组
 * @param containerWidth - 容器宽度
 * @param containerHeight - 容器高度
 * @param uiElements - UI元素配置
 * @returns 修正后的位置数组和检查结果
 */
export function validateAndCorrectPositionsRealTime(
  positions: CardPosition[],
  containerWidth: number,
  containerHeight: number,
  uiElements: {
    hasGameInfo?: boolean
    hasWarnings?: boolean
    hasStartButton?: boolean
    hasResultDisplay?: boolean
  } = {}
): { correctedPositions: CardPosition[]; checkResult: RealTimeBoundaryCheck } {
  const startTime = performance.now()
  
  try {
    // 计算当前可用空间
    const availableSpace = calculateAvailableCardSpace(containerWidth, containerHeight, uiElements)
    
    // 执行边界验证
    const validationResult = validatePositionBoundaries(positions, availableSpace)
    const validationTime = performance.now() - startTime
    
    let correctedPositions = positions
    let correctionApplied = false
    let correctionTime: number | undefined
    
    // 如果有边界违规，自动修正
    if (!validationResult.isValid) {
      const correctionStartTime = performance.now()
      correctedPositions = validateAndCorrectPositions(positions, availableSpace)
      correctionTime = performance.now() - correctionStartTime
      correctionApplied = true
      
      console.log(`Real-time correction applied: fixed ${validationResult.violations.length} violations in ${correctionTime.toFixed(2)}ms`)
    }
    
    const checkResult: RealTimeBoundaryCheck = {
      timestamp: Date.now(),
      containerDimensions: { width: containerWidth, height: containerHeight },
      cardCount: positions.length,
      validationResult,
      correctionApplied,
      performanceMetrics: {
        validationTime,
        correctionTime
      }
    }
    
    return { correctedPositions, checkResult }
  } catch (error) {
    console.error('Real-time validation and correction failed:', error)
    
    // 返回原始位置和失败状态
    const checkResult: RealTimeBoundaryCheck = {
      timestamp: Date.now(),
      containerDimensions: { width: containerWidth, height: containerHeight },
      cardCount: positions.length,
      validationResult: {
        isValid: false,
        violations: []
      },
      correctionApplied: false,
      performanceMetrics: {
        validationTime: performance.now() - startTime
      }
    }
    
    return { correctedPositions: positions, checkResult }
  }
}

/**
 * 批量验证多个位置数组（用于性能测试）
 * @param positionSets - 多个位置数组
 * @param containerWidth - 容器宽度
 * @param containerHeight - 容器高度
 * @param uiElements - UI元素配置
 * @returns 批量验证结果
 */
export function batchValidatePositions(
  positionSets: CardPosition[][],
  containerWidth: number,
  containerHeight: number,
  uiElements: {
    hasGameInfo?: boolean
    hasWarnings?: boolean
    hasStartButton?: boolean
    hasResultDisplay?: boolean
  } = {}
): RealTimeBoundaryCheck[] {
  const results: RealTimeBoundaryCheck[] = []
  
  for (let i = 0; i < positionSets.length; i++) {
    const result = performRealTimeBoundaryCheck(
      positionSets[i],
      containerWidth,
      containerHeight,
      uiElements
    )
    results.push(result)
  }
  
  return results
}

/**
 * 获取边界验证性能统计
 * @param checkResults - 多个检查结果
 * @returns 性能统计
 */
export function getBoundaryValidationStats(checkResults: RealTimeBoundaryCheck[]): {
  totalChecks: number
  averageValidationTime: number
  averageCorrectionTime: number
  violationRate: number
  correctionRate: number
  performanceScore: 'excellent' | 'good' | 'fair' | 'poor'
} {
  if (checkResults.length === 0) {
    return {
      totalChecks: 0,
      averageValidationTime: 0,
      averageCorrectionTime: 0,
      violationRate: 0,
      correctionRate: 0,
      performanceScore: 'excellent'
    }
  }
  
  const totalValidationTime = checkResults.reduce((sum, result) => sum + result.performanceMetrics.validationTime, 0)
  const correctionTimes = checkResults
    .filter(result => result.performanceMetrics.correctionTime !== undefined)
    .map(result => result.performanceMetrics.correctionTime!)
  
  const totalCorrectionTime = correctionTimes.reduce((sum, time) => sum + time, 0)
  const violationsCount = checkResults.filter(result => !result.validationResult.isValid).length
  const correctionsCount = checkResults.filter(result => result.correctionApplied).length
  
  const averageValidationTime = totalValidationTime / checkResults.length
  const averageCorrectionTime = correctionTimes.length > 0 ? totalCorrectionTime / correctionTimes.length : 0
  const violationRate = violationsCount / checkResults.length
  const correctionRate = correctionsCount / checkResults.length
  
  // 性能评分
  let performanceScore: 'excellent' | 'good' | 'fair' | 'poor'
  if (averageValidationTime < 1 && violationRate < 0.1) {
    performanceScore = 'excellent'
  } else if (averageValidationTime < 2 && violationRate < 0.2) {
    performanceScore = 'good'
  } else if (averageValidationTime < 5 && violationRate < 0.5) {
    performanceScore = 'fair'
  } else {
    performanceScore = 'poor'
  }
  
  return {
    totalChecks: checkResults.length,
    averageValidationTime,
    averageCorrectionTime,
    violationRate,
    correctionRate,
    performanceScore
  }
}

/**
 * 增强的降级系统 - 带详细结果信息
 * @param cardCount - 卡牌数量
 * @param containerWidth - 容器宽度
 * @param containerHeight - 容器高度
 * @param fallbackReason - 降级原因
 * @returns 详细的降级结果
 */
export function createEnhancedFallback(
  cardCount: number,
  containerWidth: number,
  containerHeight: number,
  fallbackReason: string = 'Unknown error'
): FallbackResult {
  const startTime = performance.now()
  
  try {
    // 尝试容器感知降级
    const availableSpace = calculateAvailableCardSpace(containerWidth, containerHeight, {
      hasGameInfo: true,
      hasWarnings: false,
      hasStartButton: false,
      hasResultDisplay: false
    })
    
    const positions = createSafeGridLayout(cardCount, availableSpace)
    const calculationTime = performance.now() - startTime
    
    // 验证降级结果质量
    const boundaryCheck = validatePositionBoundaries(positions, availableSpace)
    const qualityScore = calculateFallbackQuality(positions, availableSpace, cardCount)
    
    return {
      positions,
      fallbackLevel: 'safe-grid',
      fallbackReason,
      qualityScore,
      performanceMetrics: {
        calculationTime,
        fallbackTime: calculationTime
      },
      metadata: {
        originalCardCount: cardCount,
        actualCardCount: positions.length,
        containerDimensions: { width: containerWidth, height: containerHeight },
        availableSpace: { width: availableSpace.width, height: availableSpace.height }
      }
    }
  } catch (error) {
    console.error('Enhanced fallback failed, using emergency fallback:', error)
    
    // 紧急降级
    const emergencyPositions = createEmergencyFallback(cardCount, containerWidth, containerHeight)
    const calculationTime = performance.now() - startTime
    
    return {
      positions: emergencyPositions,
      fallbackLevel: 'emergency',
      fallbackReason: `${fallbackReason} + Emergency fallback due to: ${error instanceof Error ? error.message : 'Unknown error'}`,
      qualityScore: 30, // 紧急降级质量较低
      performanceMetrics: {
        calculationTime,
        fallbackTime: calculationTime
      },
      metadata: {
        originalCardCount: cardCount,
        actualCardCount: emergencyPositions.length,
        containerDimensions: { width: containerWidth, height: containerHeight }
      }
    }
  }
}

/**
 * 计算降级质量分数
 * @param positions - 位置数组
 * @param availableSpace - 可用空间
 * @param originalCardCount - 原始卡牌数量
 * @returns 质量分数 (0-100)
 */
function calculateFallbackQuality(
  positions: CardPosition[],
  availableSpace: AvailableCardSpace,
  originalCardCount: number
): number {
  let score = 100
  
  // 1. 卡牌数量完整性 (30分)
  if (positions.length !== originalCardCount) {
    score -= 30
  }
  
  // 2. 边界合规性 (40分)
  const boundaryCheck = validatePositionBoundaries(positions, availableSpace)
  if (!boundaryCheck.isValid) {
    score -= 40
  }
  
  // 3. 卡牌尺寸合理性 (20分)
  const avgCardWidth = positions.reduce((sum, pos) => sum + pos.cardWidth, 0) / positions.length
  const avgCardHeight = positions.reduce((sum, pos) => sum + pos.cardHeight, 0) / positions.length
  
  if (avgCardWidth < 60 || avgCardHeight < 90) {
    score -= 20 // 卡牌太小
  }
  
  // 4. 空间利用率 (10分)
  const totalCardArea = positions.reduce((sum, pos) => sum + pos.cardWidth * pos.cardHeight, 0)
  const availableArea = availableSpace.width * availableSpace.height
  const utilizationRate = totalCardArea / availableArea
  
  if (utilizationRate < 0.3) {
    score -= 10 // 空间利用率太低
  }
  
  return Math.max(0, score)
}

/**
 * 创建紧急降级布局
 * @param cardCount - 卡牌数量
 * @param containerWidth - 容器宽度
 * @param containerHeight - 容器高度
 * @returns 紧急位置数组
 */
function createEmergencyFallback(
  cardCount: number,
  containerWidth: number,
  containerHeight: number
): CardPosition[] {
  const positions: CardPosition[] = []
  const cardSize = { width: 50, height: 75 }
  const spacing = 6
  const cardsPerRow = Math.max(1, Math.floor(containerWidth / (cardSize.width + spacing)))
  
  // 计算容器中心点
  const centerX = containerWidth / 2
  const centerY = containerHeight / 2
  
  for (let i = 0; i < cardCount; i++) {
    const row = Math.floor(i / cardsPerRow)
    const col = i % cardsPerRow
    
    // 计算绝对位置
    const absoluteX = col * (cardSize.width + spacing) + cardSize.width / 2 + spacing
    const absoluteY = row * (cardSize.height + spacing) + cardSize.height / 2 + spacing
    
    // 转换为相对于容器中心的坐标
    const centerOffsetX = absoluteX - centerX
    const centerOffsetY = absoluteY - centerY
    
    positions.push({
      x: centerOffsetX,
      y: centerOffsetY,
      rotation: 0,
      cardWidth: cardSize.width,
      cardHeight: cardSize.height
    })
  }
  
  return positions
}

/**
 * 多级降级策略
 * @param cardCount - 卡牌数量
 * @param availableSpace - 可用空间
 * @param error - 原始错误
 * @returns 降级结果
 */
export function applyMultiLevelFallback(
  cardCount: number,
  availableSpace: AvailableCardSpace,
  error: Error
): FallbackResult {
  const startTime = performance.now()
  
  // 级别1：位置修正
  try {
    const positions = calculateBoundaryAwarePositions(cardCount, availableSpace)
    const boundaryCheck = validatePositionBoundaries(positions, availableSpace)
    
    if (!boundaryCheck.isValid) {
      const correctedPositions = validateAndCorrectPositions(positions, availableSpace)
      const correctedCheck = validatePositionBoundaries(correctedPositions, availableSpace)
      
      if (correctedCheck.isValid) {
        return {
          positions: correctedPositions,
          fallbackLevel: 'correction',
          fallbackReason: 'Boundary violations corrected',
          qualityScore: 85,
          performanceMetrics: {
            calculationTime: performance.now() - startTime
          },
          metadata: {
            originalCardCount: cardCount,
            actualCardCount: correctedPositions.length,
            containerDimensions: { width: availableSpace.containerWidth, height: availableSpace.containerHeight },
            availableSpace: { width: availableSpace.width, height: availableSpace.height }
          }
        }
      }
    }
  } catch (correctionError) {
    console.warn('Position correction failed:', correctionError)
  }
  
  // 级别2：安全网格布局
  try {
    const safePositions = createSafeGridLayout(cardCount, availableSpace)
    const qualityScore = calculateFallbackQuality(safePositions, availableSpace, cardCount)
    
    return {
      positions: safePositions,
      fallbackLevel: 'safe-grid',
      fallbackReason: `Safe grid fallback due to: ${error.message}`,
      qualityScore,
      performanceMetrics: {
        calculationTime: performance.now() - startTime
      },
      metadata: {
        originalCardCount: cardCount,
        actualCardCount: safePositions.length,
        containerDimensions: { width: availableSpace.containerWidth, height: availableSpace.containerHeight },
        availableSpace: { width: availableSpace.width, height: availableSpace.height }
      }
    }
  } catch (safeGridError) {
    console.warn('Safe grid fallback failed:', safeGridError)
  }
  
  // 级别3：紧急降级
  const emergencyPositions = createEmergencyFallback(
    cardCount,
    availableSpace.containerWidth,
    availableSpace.containerHeight
  )
  
  return {
    positions: emergencyPositions,
    fallbackLevel: 'emergency',
    fallbackReason: `Emergency fallback due to: ${error.message}`,
    qualityScore: 30,
    performanceMetrics: {
      calculationTime: performance.now() - startTime
    },
    metadata: {
      originalCardCount: cardCount,
      actualCardCount: emergencyPositions.length,
      containerDimensions: { width: availableSpace.containerWidth, height: availableSpace.containerHeight }
    }
  }
}

/**
 * 创建容器感知的降级布局（保持向后兼容）
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
    
    // 计算容器中心点
    const centerX = containerWidth / 2
    const centerY = containerHeight / 2
    
    for (let i = 0; i < cardCount; i++) {
      const row = Math.floor(i / cardsPerRow)
      const col = i % cardsPerRow
      
      // 计算绝对位置
      const absoluteX = col * (cardSize.width + spacing) + cardSize.width / 2 + spacing
      const absoluteY = row * (cardSize.height + spacing) + cardSize.height / 2 + spacing
      
      // 转换为相对于容器中心的坐标
      const centerOffsetX = absoluteX - centerX
      const centerOffsetY = absoluteY - centerY
      
      positions.push({
        x: centerOffsetX,
        y: centerOffsetY,
        rotation: 0,
        cardWidth: cardSize.width,
        cardHeight: cardSize.height
      })
    }
    
    return positions
  }
}