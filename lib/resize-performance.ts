// 窗口调整大小性能优化工具
// 提供高效的防抖、内存清理和性能监控功能

interface ResizePerformanceMetrics {
  resizeCount: number
  totalDuration: number
  averageDuration: number
  lastResizeTime: number
  debounceHits: number
  memoryUsage: number
}

interface ResizeHistoryEntry {
  timestamp: number
  containerWidth: number
  containerHeight: number
  cardCount: number
  duration: number
  success: boolean
  error?: string
}

interface PerformanceConfig {
  debounceDelay: number
  maxHistoryEntries: number
  enableMetrics: boolean
  enableMemoryCleanup: boolean
  performanceThreshold: number // ms
}

class ResizePerformanceManager {
  private metrics: ResizePerformanceMetrics = {
    resizeCount: 0,
    totalDuration: 0,
    averageDuration: 0,
    lastResizeTime: 0,
    debounceHits: 0,
    memoryUsage: 0
  }

  private history: ResizeHistoryEntry[] = []
  private config: PerformanceConfig
  private debounceTimer: NodeJS.Timeout | null = null
  private isProcessing = false
  private errorTrackingMap = new Map<string, number>()

  constructor(config: Partial<PerformanceConfig> = {}) {
    this.config = {
      debounceDelay: 150,
      maxHistoryEntries: 50,
      enableMetrics: true,
      enableMemoryCleanup: true,
      performanceThreshold: 100,
      ...config
    }
  }

  /**
   * 高效的防抖处理
   * @param callback - 要执行的回调函数
   * @param immediate - 是否立即执行第一次调用
   */
  debounce<T extends (...args: any[]) => any>(
    callback: T,
    immediate = false
  ): (...args: Parameters<T>) => void {
    return (...args: Parameters<T>) => {
      const callNow = immediate && !this.debounceTimer

      // 清除之前的定时器
      if (this.debounceTimer) {
        clearTimeout(this.debounceTimer)
        this.metrics.debounceHits++
      }

      this.debounceTimer = setTimeout(() => {
        this.debounceTimer = null
        if (!immediate) {
          this.executeWithMetrics(callback, args)
        }
      }, this.config.debounceDelay)

      if (callNow) {
        this.executeWithMetrics(callback, args)
      }
    }
  }

  /**
   * 执行回调并收集性能指标
   */
  private async executeWithMetrics<T extends (...args: any[]) => any>(
    callback: T,
    args: Parameters<T>
  ): Promise<void> {
    if (this.isProcessing) {
      console.warn('Resize operation already in progress, skipping')
      return
    }

    this.isProcessing = true
    const startTime = performance.now()
    let success = true
    let error: string | undefined

    try {
      await callback(...args)
    } catch (err) {
      success = false
      error = err instanceof Error ? err.message : 'Unknown error'
      console.error('Resize callback execution failed:', err)
    } finally {
      const endTime = performance.now()
      const duration = endTime - startTime

      if (this.config.enableMetrics) {
        this.updateMetrics(duration, success)
        this.addHistoryEntry(args, duration, success, error)
      }

      this.isProcessing = false

      // 性能警告
      if (duration > this.config.performanceThreshold) {
        console.warn(`Resize operation took ${duration.toFixed(2)}ms (threshold: ${this.config.performanceThreshold}ms)`)
      }
    }
  }

  /**
   * 更新性能指标
   */
  private updateMetrics(duration: number, success: boolean): void {
    this.metrics.resizeCount++
    this.metrics.totalDuration += duration
    this.metrics.averageDuration = this.metrics.totalDuration / this.metrics.resizeCount
    this.metrics.lastResizeTime = Date.now()

    // 估算内存使用
    this.metrics.memoryUsage = this.history.length * 200 + // 历史记录
                               this.errorTrackingMap.size * 100 // 错误跟踪

    if (!success) {
      this.trackError('resize_execution_failed')
    }
  }

  /**
   * 添加历史记录
   */
  private addHistoryEntry(
    args: any[],
    duration: number,
    success: boolean,
    error?: string
  ): void {
    const entry: ResizeHistoryEntry = {
      timestamp: Date.now(),
      containerWidth: args[0] || 0,
      containerHeight: args[1] || 0,
      cardCount: args[2] || 0,
      duration,
      success,
      error
    }

    this.history.push(entry)

    // 限制历史记录数量
    if (this.history.length > this.config.maxHistoryEntries) {
      this.history.shift()
    }
  }

  /**
   * 错误跟踪
   */
  private trackError(errorType: string): void {
    const count = this.errorTrackingMap.get(errorType) || 0
    this.errorTrackingMap.set(errorType, count + 1)
  }

  /**
   * 内存清理
   */
  cleanup(): void {
    if (!this.config.enableMemoryCleanup) return

    // 清理旧的历史记录（保留最近的25%）
    const keepCount = Math.floor(this.config.maxHistoryEntries * 0.25)
    if (this.history.length > keepCount) {
      this.history = this.history.slice(-keepCount)
    }

    // 清理错误跟踪（只保留最近的错误类型）
    if (this.errorTrackingMap.size > 10) {
      const entries = Array.from(this.errorTrackingMap.entries())
      this.errorTrackingMap.clear()
      entries.slice(-5).forEach(([key, value]) => {
        this.errorTrackingMap.set(key, value)
      })
    }

    console.log('Resize performance memory cleanup completed')
  }

  /**
   * 获取性能指标
   */
  getMetrics(): ResizePerformanceMetrics {
    return { ...this.metrics }
  }

  /**
   * 获取性能历史
   */
  getHistory(): ResizeHistoryEntry[] {
    return [...this.history]
  }

  /**
   * 获取错误统计
   */
  getErrorStats(): Record<string, number> {
    return Object.fromEntries(this.errorTrackingMap)
  }

  /**
   * 重置所有指标
   */
  reset(): void {
    this.metrics = {
      resizeCount: 0,
      totalDuration: 0,
      averageDuration: 0,
      lastResizeTime: 0,
      debounceHits: 0,
      memoryUsage: 0
    }
    this.history = []
    this.errorTrackingMap.clear()
    
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer)
      this.debounceTimer = null
    }
  }

  /**
   * 销毁管理器
   */
  destroy(): void {
    this.reset()
    this.isProcessing = false
  }

  /**
   * 获取性能报告
   */
  getPerformanceReport(): {
    summary: ResizePerformanceMetrics
    recentHistory: ResizeHistoryEntry[]
    errorStats: Record<string, number>
    recommendations: string[]
  } {
    const recommendations: string[] = []

    // 性能建议
    if (this.metrics.averageDuration > this.config.performanceThreshold) {
      recommendations.push(`平均执行时间 ${this.metrics.averageDuration.toFixed(2)}ms 超过阈值，考虑优化布局计算`)
    }

    if (this.metrics.debounceHits > this.metrics.resizeCount * 2) {
      recommendations.push('防抖命中率较高，可能需要增加防抖延迟')
    }

    const errorRate = Object.values(this.errorTrackingMap).reduce((a, b) => a + b, 0) / this.metrics.resizeCount
    if (errorRate > 0.1) {
      recommendations.push(`错误率 ${(errorRate * 100).toFixed(1)}% 较高，需要改进错误处理`)
    }

    if (this.metrics.memoryUsage > 10000) {
      recommendations.push('内存使用较高，建议启用自动清理')
    }

    return {
      summary: this.getMetrics(),
      recentHistory: this.history.slice(-10),
      errorStats: this.getErrorStats(),
      recommendations
    }
  }
}

// 创建全局实例
export const resizePerformanceManager = new ResizePerformanceManager({
  debounceDelay: 150,
  maxHistoryEntries: 50,
  enableMetrics: process.env.NODE_ENV === 'development',
  enableMemoryCleanup: true,
  performanceThreshold: 100
})

// 导出类型
export type {
  ResizePerformanceMetrics,
  ResizeHistoryEntry,
  PerformanceConfig
}

// 导出管理器类
export { ResizePerformanceManager }

/**
 * 便捷的防抖函数
 * @param callback - 回调函数
 * @param delay - 延迟时间
 * @param immediate - 是否立即执行
 */
export function createDebouncedResize<T extends (...args: any[]) => any>(
  callback: T,
  delay = 150,
  immediate = false
): (...args: Parameters<T>) => void {
  const manager = new ResizePerformanceManager({ debounceDelay: delay })
  return manager.debounce(callback, immediate)
}

/**
 * 性能监控装饰器
 */
export function withPerformanceMonitoring<T extends (...args: any[]) => any>(
  callback: T,
  name = 'resize-operation'
): T {
  return ((...args: Parameters<T>) => {
    const startTime = performance.now()
    
    try {
      const result = callback(...args)
      
      // 如果是Promise，监控异步执行
      if (result instanceof Promise) {
        return result.finally(() => {
          const duration = performance.now() - startTime
          console.log(`${name} completed in ${duration.toFixed(2)}ms`)
        })
      }
      
      const duration = performance.now() - startTime
      console.log(`${name} completed in ${duration.toFixed(2)}ms`)
      return result
      
    } catch (error) {
      const duration = performance.now() - startTime
      console.error(`${name} failed after ${duration.toFixed(2)}ms:`, error)
      throw error
    }
  }) as T
}