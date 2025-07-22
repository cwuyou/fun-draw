// 布局计算性能优化系统
// 提供缓存机制、性能监控和警告功能

import { LayoutCalculationResult, DeviceType } from './layout-manager'
import { SpacingConfig } from './spacing-system'

// 缓存键类型
interface CacheKey {
  containerWidth: number
  containerHeight: number
  requestedQuantity: number
  itemCount: number
  uiOptions: string // JSON字符串化的UI选项
  deviceType: DeviceType
}

// 缓存条目类型
interface CacheEntry {
  key: CacheKey
  result: LayoutCalculationResult
  timestamp: number
  hitCount: number
}

// 性能指标类型
interface PerformanceMetrics {
  totalCalculations: number
  cacheHits: number
  cacheMisses: number
  averageCalculationTime: number
  maxCalculationTime: number
  lastCalculationTime: number
}

// 性能警告类型
interface PerformanceWarning {
  type: 'slow_calculation' | 'cache_miss_rate' | 'memory_usage' | 'frequent_recalculation'
  message: string
  timestamp: number
  severity: 'low' | 'medium' | 'high'
  data?: any
}

class LayoutPerformanceManager {
  private cache = new Map<string, CacheEntry>()
  private metrics: PerformanceMetrics = {
    totalCalculations: 0,
    cacheHits: 0,
    cacheMisses: 0,
    averageCalculationTime: 0,
    maxCalculationTime: 0,
    lastCalculationTime: 0
  }
  private warnings: PerformanceWarning[] = []
  private readonly maxCacheSize = 100
  private readonly cacheExpiryTime = 5 * 60 * 1000 // 5分钟
  private readonly slowCalculationThreshold = 10 // 10ms
  private readonly highCacheMissRateThreshold = 0.7 // 70%

  /**
   * 生成缓存键
   */
  private generateCacheKey(
    containerWidth: number,
    containerHeight: number,
    requestedQuantity: number,
    itemCount: number,
    uiOptions: any,
    deviceType: DeviceType
  ): string {
    const key: CacheKey = {
      containerWidth: Math.round(containerWidth),
      containerHeight: Math.round(containerHeight),
      requestedQuantity,
      itemCount,
      uiOptions: JSON.stringify(uiOptions),
      deviceType
    }
    return JSON.stringify(key)
  }

  /**
   * 检查缓存条目是否过期
   */
  private isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp > this.cacheExpiryTime
  }

  /**
   * 清理过期的缓存条目
   */
  private cleanupExpiredEntries(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry)) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * 清理最少使用的缓存条目
   */
  private evictLeastUsed(): void {
    if (this.cache.size <= this.maxCacheSize) return

    let leastUsedKey = ''
    let leastHitCount = Infinity
    let oldestTimestamp = Infinity

    for (const [key, entry] of this.cache.entries()) {
      if (entry.hitCount < leastHitCount || 
          (entry.hitCount === leastHitCount && entry.timestamp < oldestTimestamp)) {
        leastUsedKey = key
        leastHitCount = entry.hitCount
        oldestTimestamp = entry.timestamp
      }
    }

    if (leastUsedKey) {
      this.cache.delete(leastUsedKey)
    }
  }

  /**
   * 从缓存获取布局计算结果
   */
  getCachedResult(
    containerWidth: number,
    containerHeight: number,
    requestedQuantity: number,
    itemCount: number,
    uiOptions: any,
    deviceType: DeviceType
  ): LayoutCalculationResult | null {
    const cacheKey = this.generateCacheKey(
      containerWidth, containerHeight, requestedQuantity, 
      itemCount, uiOptions, deviceType
    )

    const entry = this.cache.get(cacheKey)
    if (!entry || this.isExpired(entry)) {
      if (entry) {
        this.cache.delete(cacheKey)
      }
      this.metrics.cacheMisses++
      return null
    }

    // 更新命中计数
    entry.hitCount++
    entry.timestamp = Date.now() // 更新访问时间
    this.metrics.cacheHits++

    return entry.result
  }

  /**
   * 缓存布局计算结果
   */
  cacheResult(
    containerWidth: number,
    containerHeight: number,
    requestedQuantity: number,
    itemCount: number,
    uiOptions: any,
    deviceType: DeviceType,
    result: LayoutCalculationResult,
    calculationTime: number
  ): void {
    const cacheKey = this.generateCacheKey(
      containerWidth, containerHeight, requestedQuantity, 
      itemCount, uiOptions, deviceType
    )

    // 清理过期条目
    this.cleanupExpiredEntries()

    // 如果缓存已满，清理最少使用的条目
    this.evictLeastUsed()

    // 添加新的缓存条目
    this.cache.set(cacheKey, {
      key: JSON.parse(cacheKey),
      result,
      timestamp: Date.now(),
      hitCount: 0
    })

    // 更新性能指标
    this.updateMetrics(calculationTime)
  }

  /**
   * 更新性能指标
   */
  private updateMetrics(calculationTime: number): void {
    this.metrics.totalCalculations++
    this.metrics.lastCalculationTime = calculationTime
    this.metrics.maxCalculationTime = Math.max(this.metrics.maxCalculationTime, calculationTime)
    
    // 计算平均计算时间
    const totalTime = this.metrics.averageCalculationTime * (this.metrics.totalCalculations - 1) + calculationTime
    this.metrics.averageCalculationTime = totalTime / this.metrics.totalCalculations

    // 检查性能警告
    this.checkPerformanceWarnings(calculationTime)
  }

  /**
   * 检查性能警告
   */
  private checkPerformanceWarnings(calculationTime: number): void {
    const now = Date.now()

    // 检查计算时间过长
    if (calculationTime > this.slowCalculationThreshold) {
      this.addWarning({
        type: 'slow_calculation',
        message: `布局计算耗时过长: ${calculationTime.toFixed(2)}ms (阈值: ${this.slowCalculationThreshold}ms)`,
        timestamp: now,
        severity: calculationTime > this.slowCalculationThreshold * 2 ? 'high' : 'medium',
        data: { calculationTime, threshold: this.slowCalculationThreshold }
      })
    }

    // 检查缓存命中率
    const totalRequests = this.metrics.cacheHits + this.metrics.cacheMisses
    if (totalRequests > 10) { // 至少有10次请求才检查
      const missRate = this.metrics.cacheMisses / totalRequests
      if (missRate > this.highCacheMissRateThreshold) {
        this.addWarning({
          type: 'cache_miss_rate',
          message: `缓存命中率过低: ${((1 - missRate) * 100).toFixed(1)}% (期望: ${((1 - this.highCacheMissRateThreshold) * 100).toFixed(1)}%+)`,
          timestamp: now,
          severity: missRate > 0.9 ? 'high' : 'medium',
          data: { missRate, threshold: this.highCacheMissRateThreshold }
        })
      }
    }

    // 检查内存使用
    if (this.cache.size > this.maxCacheSize * 0.8) {
      this.addWarning({
        type: 'memory_usage',
        message: `缓存使用率较高: ${this.cache.size}/${this.maxCacheSize} (${((this.cache.size / this.maxCacheSize) * 100).toFixed(1)}%)`,
        timestamp: now,
        severity: this.cache.size > this.maxCacheSize * 0.9 ? 'high' : 'medium',
        data: { cacheSize: this.cache.size, maxSize: this.maxCacheSize }
      })
    }
  }

  /**
   * 添加性能警告
   */
  private addWarning(warning: PerformanceWarning): void {
    // 避免重复警告（5秒内相同类型的警告只记录一次）
    const recentWarning = this.warnings.find(w => 
      w.type === warning.type && 
      Date.now() - w.timestamp < 5000
    )

    if (!recentWarning) {
      this.warnings.push(warning)
      
      // 限制警告数量
      if (this.warnings.length > 50) {
        this.warnings = this.warnings.slice(-25) // 保留最近的25条
      }

      // 在开发环境下输出警告
      if (process.env.NODE_ENV === 'development') {
        console.warn(`[Layout Performance] ${warning.message}`, warning.data)
      }
    }
  }

  /**
   * 获取性能指标
   */
  getMetrics(): PerformanceMetrics & { 
    cacheSize: number
    cacheHitRate: number
    recentWarnings: PerformanceWarning[]
  } {
    const totalRequests = this.metrics.cacheHits + this.metrics.cacheMisses
    const cacheHitRate = totalRequests > 0 ? this.metrics.cacheHits / totalRequests : 0

    return {
      ...this.metrics,
      cacheSize: this.cache.size,
      cacheHitRate,
      recentWarnings: this.warnings.slice(-10) // 最近10条警告
    }
  }

  /**
   * 清除所有缓存
   */
  clearCache(): void {
    this.cache.clear()
  }

  /**
   * 重置性能指标
   */
  resetMetrics(): void {
    this.metrics = {
      totalCalculations: 0,
      cacheHits: 0,
      cacheMisses: 0,
      averageCalculationTime: 0,
      maxCalculationTime: 0,
      lastCalculationTime: 0
    }
    this.warnings = []
  }

  /**
   * 获取缓存调试信息
   */
  getCacheDebugInfo(): {
    totalEntries: number
    expiredEntries: number
    averageHitCount: number
    oldestEntry: number
    newestEntry: number
  } {
    const now = Date.now()
    let expiredCount = 0
    let totalHitCount = 0
    let oldestTimestamp = now
    let newestTimestamp = 0

    for (const entry of this.cache.values()) {
      if (this.isExpired(entry)) {
        expiredCount++
      }
      totalHitCount += entry.hitCount
      oldestTimestamp = Math.min(oldestTimestamp, entry.timestamp)
      newestTimestamp = Math.max(newestTimestamp, entry.timestamp)
    }

    return {
      totalEntries: this.cache.size,
      expiredEntries: expiredCount,
      averageHitCount: this.cache.size > 0 ? totalHitCount / this.cache.size : 0,
      oldestEntry: oldestTimestamp === now ? 0 : now - oldestTimestamp,
      newestEntry: newestTimestamp === 0 ? 0 : now - newestTimestamp
    }
  }
}

// 全局性能管理器实例
const performanceManager = new LayoutPerformanceManager()

/**
 * 带性能优化的布局计算包装器
 */
export function calculateLayoutWithPerformance(
  calculateLayoutFn: Function,
  containerWidth: number,
  containerHeight: number,
  requestedQuantity: number,
  itemCount: number,
  uiOptions: any = {},
  deviceType: DeviceType
): LayoutCalculationResult {
  // 尝试从缓存获取结果
  const cachedResult = performanceManager.getCachedResult(
    containerWidth, containerHeight, requestedQuantity, 
    itemCount, uiOptions, deviceType
  )

  if (cachedResult) {
    return cachedResult
  }

  // 执行计算并测量时间
  const startTime = performance.now()
  const result = calculateLayoutFn(
    containerWidth, containerHeight, requestedQuantity, 
    itemCount, uiOptions
  )
  const calculationTime = performance.now() - startTime

  // 缓存结果
  performanceManager.cacheResult(
    containerWidth, containerHeight, requestedQuantity, 
    itemCount, uiOptions, deviceType, result, calculationTime
  )

  return result
}

/**
 * 获取性能指标
 */
export function getLayoutPerformanceMetrics() {
  return performanceManager.getMetrics()
}

/**
 * 清除布局计算缓存
 */
export function clearLayoutCache() {
  performanceManager.clearCache()
}

/**
 * 重置性能指标
 */
export function resetLayoutPerformanceMetrics() {
  performanceManager.resetMetrics()
}

/**
 * 获取缓存调试信息
 */
export function getLayoutCacheDebugInfo() {
  return performanceManager.getCacheDebugInfo()
}

/**
 * 性能监控Hook辅助函数
 */
export function createPerformanceMonitor() {
  return {
    getMetrics: () => performanceManager.getMetrics(),
    clearCache: () => performanceManager.clearCache(),
    resetMetrics: () => performanceManager.resetMetrics(),
    getDebugInfo: () => performanceManager.getCacheDebugInfo()
  }
}

/**
 * 测量布局性能的通用函数
 */
export function measureLayoutPerformance<T>(callback: () => T): { result: T; duration: number } {
  const startTime = performance.now()
  const result = callback()
  const duration = performance.now() - startTime
  
  return { result, duration }
}

/**
 * 优化布局计算的缓存包装器
 */
export function optimizeLayoutCalculation(
  containerWidth: number,
  containerHeight: number,
  requestedQuantity: number,
  itemCount: number,
  calculateFn: () => any
): any {
  // 生成简单的缓存键
  const cacheKey = `${containerWidth}-${containerHeight}-${requestedQuantity}-${itemCount}`
  
  // 简单的内存缓存实现
  if (!optimizeLayoutCalculation._cache) {
    optimizeLayoutCalculation._cache = new Map()
  }
  
  // 检查缓存
  if (optimizeLayoutCalculation._cache.has(cacheKey)) {
    return optimizeLayoutCalculation._cache.get(cacheKey)
  }
  
  // 执行计算
  const result = calculateFn()
  
  // 缓存结果
  optimizeLayoutCalculation._cache.set(cacheKey, result)
  
  // 限制缓存大小
  if (optimizeLayoutCalculation._cache.size > 50) {
    const firstKey = optimizeLayoutCalculation._cache.keys().next().value
    optimizeLayoutCalculation._cache.delete(firstKey)
  }
  
  return result
}

// 为函数添加静态缓存属性
declare module './layout-performance' {
  namespace optimizeLayoutCalculation {
    let _cache: Map<string, any>
  }
}