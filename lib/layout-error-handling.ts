// 布局错误处理和日志记录系统
// 提供详细的错误跟踪、上下文记录和调试信息

import { ResizeError, PositionCalculationContext, DeviceType } from '@/types'

interface ErrorContext {
  timestamp: number
  containerWidth: number
  containerHeight: number
  cardCount: number
  gamePhase: string
  deviceType: DeviceType
  userAgent?: string
  screenInfo?: {
    availWidth: number
    availHeight: number
    colorDepth: number
    pixelDepth: number
  }
}

interface PositionErrorLog {
  type: 'position_calculation' | 'position_validation' | 'resize_handling'
  error: Error
  context: ErrorContext
  recovery: 'fallback' | 'retry' | 'ignore'
  timestamp: number
}

// 错误日志存储
const errorLogs: PositionErrorLog[] = []
const MAX_ERROR_LOGS = 50 // 最多保存50条错误日志

/**
 * 创建错误上下文信息
 * @param containerWidth - 容器宽度
 * @param containerHeight - 容器高度
 * @param cardCount - 卡牌数量
 * @param gamePhase - 游戏阶段
 * @returns 错误上下文
 */
export function createErrorContext(
  containerWidth: number,
  containerHeight: number,
  cardCount: number,
  gamePhase: string
): ErrorContext {
  const context: ErrorContext = {
    timestamp: Date.now(),
    containerWidth,
    containerHeight,
    cardCount,
    gamePhase,
    deviceType: containerWidth < 768 ? 'mobile' : containerWidth < 1024 ? 'tablet' : 'desktop'
  }

  // 添加浏览器信息（如果可用）
  if (typeof window !== 'undefined') {
    context.userAgent = navigator.userAgent
    
    if (screen) {
      context.screenInfo = {
        availWidth: screen.availWidth,
        availHeight: screen.availHeight,
        colorDepth: screen.colorDepth,
        pixelDepth: screen.pixelDepth
      }
    }
  }

  return context
}

/**
 * 记录位置计算错误
 * @param error - 错误对象
 * @param context - 错误上下文
 * @param recovery - 恢复策略
 */
export function logPositionError(
  error: Error,
  context: ErrorContext,
  recovery: 'fallback' | 'retry' | 'ignore' = 'fallback'
): void {
  const errorLog: PositionErrorLog = {
    type: 'position_calculation',
    error,
    context,
    recovery,
    timestamp: Date.now()
  }

  // 添加到错误日志
  errorLogs.push(errorLog)
  
  // 保持日志数量在限制内
  if (errorLogs.length > MAX_ERROR_LOGS) {
    errorLogs.shift()
  }

  // 控制台输出详细错误信息
  console.error('Position Calculation Error:', {
    message: error.message,
    stack: error.stack,
    context: {
      container: `${context.containerWidth}x${context.containerHeight}`,
      cardCount: context.cardCount,
      gamePhase: context.gamePhase,
      deviceType: context.deviceType,
      timestamp: new Date(context.timestamp).toISOString()
    },
    recovery
  })

  // 开发环境下输出更详细的信息
  if (process.env.NODE_ENV === 'development') {
    console.group('🔍 Position Error Details')
    console.log('Error Type:', errorLog.type)
    console.log('Recovery Strategy:', recovery)
    console.log('Full Context:', context)
    console.log('Error Stack:', error.stack)
    console.groupEnd()
  }
}

/**
 * 记录resize处理错误
 * @param error - 错误对象
 * @param context - 错误上下文
 * @param recovery - 恢复策略
 */
export function logResizeError(
  error: Error,
  context: ErrorContext,
  recovery: 'fallback' | 'retry' | 'ignore' = 'fallback'
): void {
  const errorLog: PositionErrorLog = {
    type: 'resize_handling',
    error,
    context,
    recovery,
    timestamp: Date.now()
  }

  errorLogs.push(errorLog)
  
  if (errorLogs.length > MAX_ERROR_LOGS) {
    errorLogs.shift()
  }

  console.error('Resize Handling Error:', {
    message: error.message,
    context: {
      container: `${context.containerWidth}x${context.containerHeight}`,
      cardCount: context.cardCount,
      gamePhase: context.gamePhase,
      deviceType: context.deviceType,
      screenInfo: context.screenInfo
    },
    recovery
  })
}

/**
 * 记录位置验证错误
 * @param error - 错误对象
 * @param context - 错误上下文
 * @param positionIndex - 位置索引
 * @param expectedCount - 期望数量
 */
export function logValidationError(
  error: Error,
  context: ErrorContext,
  positionIndex?: number,
  expectedCount?: number
): void {
  const errorLog: PositionErrorLog = {
    type: 'position_validation',
    error,
    context: {
      ...context,
      positionIndex,
      expectedCount
    } as any,
    recovery: 'fallback',
    timestamp: Date.now()
  }

  errorLogs.push(errorLog)
  
  if (errorLogs.length > MAX_ERROR_LOGS) {
    errorLogs.shift()
  }

  console.warn('Position Validation Error:', {
    message: error.message,
    positionIndex,
    expectedCount,
    context: {
      container: `${context.containerWidth}x${context.containerHeight}`,
      cardCount: context.cardCount,
      gamePhase: context.gamePhase
    }
  })
}

/**
 * 获取错误统计信息
 * @returns 错误统计
 */
export function getErrorStats(): {
  total: number
  byType: Record<string, number>
  byRecovery: Record<string, number>
  recent: PositionErrorLog[]
} {
  const byType: Record<string, number> = {}
  const byRecovery: Record<string, number> = {}

  errorLogs.forEach(log => {
    byType[log.type] = (byType[log.type] || 0) + 1
    byRecovery[log.recovery] = (byRecovery[log.recovery] || 0) + 1
  })

  return {
    total: errorLogs.length,
    byType,
    byRecovery,
    recent: errorLogs.slice(-10) // 最近10条错误
  }
}

/**
 * 清除错误日志
 */
export function clearErrorLogs(): void {
  errorLogs.length = 0
  console.log('Error logs cleared')
}

/**
 * 导出错误日志（用于调试）
 * @returns 错误日志的JSON字符串
 */
export function exportErrorLogs(): string {
  return JSON.stringify({
    timestamp: Date.now(),
    logs: errorLogs,
    stats: getErrorStats()
  }, null, 2)
}

/**
 * 检查是否有频繁的错误模式
 * @returns 是否检测到频繁错误
 */
export function detectFrequentErrors(): {
  hasFrequentErrors: boolean
  pattern?: string
  recommendation?: string
} {
  const recentErrors = errorLogs.slice(-10)
  const now = Date.now()
  const fiveMinutesAgo = now - 5 * 60 * 1000

  // 检查最近5分钟内的错误
  const recentFrequentErrors = recentErrors.filter(log => log.timestamp > fiveMinutesAgo)

  if (recentFrequentErrors.length >= 5) {
    // 分析错误模式
    const errorTypes = recentFrequentErrors.map(log => log.type)
    const mostCommonType = errorTypes.reduce((a, b, i, arr) =>
      arr.filter(v => v === a).length >= arr.filter(v => v === b).length ? a : b
    )

    return {
      hasFrequentErrors: true,
      pattern: `Frequent ${mostCommonType} errors`,
      recommendation: mostCommonType === 'resize_handling' 
        ? 'Consider reducing resize sensitivity or improving debouncing'
        : 'Check position calculation logic and container dimensions'
    }
  }

  return { hasFrequentErrors: false }
}

/**
 * 创建调试报告
 * @param includeStackTraces - 是否包含堆栈跟踪
 * @returns 调试报告
 */
export function createDebugReport(includeStackTraces: boolean = false): string {
  const stats = getErrorStats()
  const frequentErrors = detectFrequentErrors()
  
  const report = [
    '=== Layout Error Debug Report ===',
    `Generated: ${new Date().toISOString()}`,
    '',
    '--- Error Statistics ---',
    `Total Errors: ${stats.total}`,
    `By Type: ${JSON.stringify(stats.byType, null, 2)}`,
    `By Recovery: ${JSON.stringify(stats.byRecovery, null, 2)}`,
    '',
    '--- Frequent Error Detection ---',
    `Has Frequent Errors: ${frequentErrors.hasFrequentErrors}`,
    frequentErrors.pattern ? `Pattern: ${frequentErrors.pattern}` : '',
    frequentErrors.recommendation ? `Recommendation: ${frequentErrors.recommendation}` : '',
    '',
    '--- Recent Errors ---'
  ]

  stats.recent.forEach((log, index) => {
    report.push(`${index + 1}. [${log.type}] ${log.error.message}`)
    report.push(`   Context: ${log.context.containerWidth}x${log.context.containerHeight}, ${log.context.cardCount} cards, ${log.context.gamePhase}`)
    report.push(`   Recovery: ${log.recovery}`)
    report.push(`   Time: ${new Date(log.timestamp).toISOString()}`)
    
    if (includeStackTraces && log.error.stack) {
      report.push(`   Stack: ${log.error.stack}`)
    }
    
    report.push('')
  })

  return report.join('\n')
}