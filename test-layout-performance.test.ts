// 布局性能优化测试
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { 
  calculateLayoutWithPerformance,
  getLayoutPerformanceMetrics,
  clearLayoutCache,
  resetLayoutPerformanceMetrics,
  getLayoutCacheDebugInfo
} from './lib/layout-performance'
import { calculateLayout } from './lib/layout-manager'

// Mock performance.now for consistent testing
const mockPerformanceNow = vi.fn()
vi.stubGlobal('performance', { now: mockPerformanceNow })

describe('Layout Performance Optimization', () => {
  beforeEach(() => {
    clearLayoutCache()
    resetLayoutPerformanceMetrics()
    mockPerformanceNow.mockReturnValue(0)
  })

  describe('缓存机制', () => {
    it('应该缓存布局计算结果', () => {
      const mockCalculateFn = vi.fn().mockReturnValue({
        deviceConfig: { type: 'desktop' },
        containerDimensions: { width: 1200, height: 800 },
        safeMargins: { top: 50, bottom: 50 },
        maxSafeCards: 20,
        recommendedCards: 10
      })

      // 第一次调用
      mockPerformanceNow.mockReturnValueOnce(0).mockReturnValueOnce(5)
      const result1 = calculateLayoutWithPerformance(
        mockCalculateFn, 1200, 800, 10, 50, {}, 'desktop'
      )

      // 第二次调用相同参数
      mockPerformanceNow.mockReturnValueOnce(10).mockReturnValueOnce(12)
      const result2 = calculateLayoutWithPerformance(
        mockCalculateFn, 1200, 800, 10, 50, {}, 'desktop'
      )

      // 验证缓存命中
      expect(mockCalculateFn).toHaveBeenCalledTimes(1)
      expect(result1).toEqual(result2)

      const metrics = getLayoutPerformanceMetrics()
      expect(metrics.cacheHits).toBe(1)
      expect(metrics.cacheMisses).toBe(1)
      expect(metrics.totalCalculations).toBe(1)
    })

    it('应该在参数变化时重新计算', () => {
      const mockCalculateFn = vi.fn()
        .mockReturnValueOnce({ maxSafeCards: 20 })
        .mockReturnValueOnce({ maxSafeCards: 15 })

      mockPerformanceNow.mockReturnValue(0)

      // 不同参数的两次调用
      calculateLayoutWithPerformance(mockCalculateFn, 1200, 800, 10, 50, {}, 'desktop')
      calculateLayoutWithPerformance(mockCalculateFn, 1000, 600, 8, 40, {}, 'tablet')

      expect(mockCalculateFn).toHaveBeenCalledTimes(2)

      const metrics = getLayoutPerformanceMetrics()
      expect(metrics.cacheMisses).toBe(2)
      expect(metrics.cacheHits).toBe(0)
    })
  })

  describe('性能监控', () => {
    it('应该记录计算时间指标', () => {
      const mockCalculateFn = vi.fn().mockReturnValue({ maxSafeCards: 10 })
      
      // 模拟慢计算
      mockPerformanceNow.mockReturnValueOnce(0).mockReturnValueOnce(15)
      
      calculateLayoutWithPerformance(
        mockCalculateFn, 1200, 800, 10, 50, {}, 'desktop'
      )

      const metrics = getLayoutPerformanceMetrics()
      expect(metrics.totalCalculations).toBe(1)
      expect(metrics.lastCalculationTime).toBe(15)
      expect(metrics.maxCalculationTime).toBe(15)
      expect(metrics.averageCalculationTime).toBe(15)
    })

    it('应该生成慢计算警告', () => {
      const mockCalculateFn = vi.fn().mockReturnValue({ maxSafeCards: 10 })
      
      // 模拟超过阈值的慢计算 (>10ms)
      mockPerformanceNow.mockReturnValueOnce(0).mockReturnValueOnce(20)
      
      calculateLayoutWithPerformance(
        mockCalculateFn, 1200, 800, 10, 50, {}, 'desktop'
      )

      const metrics = getLayoutPerformanceMetrics()
      expect(metrics.recentWarnings).toHaveLength(1)
      expect(metrics.recentWarnings[0].type).toBe('slow_calculation')
      expect(metrics.recentWarnings[0].severity).toBe('high')
    })

    it('应该计算正确的缓存命中率', () => {
      const mockCalculateFn = vi.fn().mockReturnValue({ maxSafeCards: 10 })
      mockPerformanceNow.mockReturnValue(0)

      // 执行多次计算，部分命中缓存
      calculateLayoutWithPerformance(mockCalculateFn, 1200, 800, 10, 50, {}, 'desktop') // miss
      calculateLayoutWithPerformance(mockCalculateFn, 1200, 800, 10, 50, {}, 'desktop') // hit
      calculateLayoutWithPerformance(mockCalculateFn, 1000, 600, 8, 40, {}, 'tablet')   // miss
      calculateLayoutWithPerformance(mockCalculateFn, 1200, 800, 10, 50, {}, 'desktop') // hit

      const metrics = getLayoutPerformanceMetrics()
      expect(metrics.cacheHitRate).toBe(0.5) // 2 hits out of 4 requests
      expect(metrics.cacheHits).toBe(2)
      expect(metrics.cacheMisses).toBe(2)
    })
  })

  describe('缓存管理', () => {
    it('应该提供缓存调试信息', () => {
      const mockCalculateFn = vi.fn().mockReturnValue({ maxSafeCards: 10 })
      mockPerformanceNow.mockReturnValue(Date.now())

      calculateLayoutWithPerformance(mockCalculateFn, 1200, 800, 10, 50, {}, 'desktop')
      calculateLayoutWithPerformance(mockCalculateFn, 1000, 600, 8, 40, {}, 'tablet')

      const debugInfo = getLayoutCacheDebugInfo()
      expect(debugInfo.totalEntries).toBe(2)
      expect(debugInfo.expiredEntries).toBe(0)
      expect(debugInfo.averageHitCount).toBe(0) // 新缓存条目
    })

    it('应该清除缓存', () => {
      const mockCalculateFn = vi.fn().mockReturnValue({ maxSafeCards: 10 })
      mockPerformanceNow.mockReturnValue(0)

      calculateLayoutWithPerformance(mockCalculateFn, 1200, 800, 10, 50, {}, 'desktop')
      
      let debugInfo = getLayoutCacheDebugInfo()
      expect(debugInfo.totalEntries).toBe(1)

      clearLayoutCache()
      
      debugInfo = getLayoutCacheDebugInfo()
      expect(debugInfo.totalEntries).toBe(0)
    })

    it('应该重置性能指标', () => {
      const mockCalculateFn = vi.fn().mockReturnValue({ maxSafeCards: 10 })
      mockPerformanceNow.mockReturnValue(0)

      calculateLayoutWithPerformance(mockCalculateFn, 1200, 800, 10, 50, {}, 'desktop')
      
      let metrics = getLayoutPerformanceMetrics()
      expect(metrics.totalCalculations).toBe(1)

      resetLayoutPerformanceMetrics()
      
      metrics = getLayoutPerformanceMetrics()
      expect(metrics.totalCalculations).toBe(0)
      expect(metrics.cacheHits).toBe(0)
      expect(metrics.cacheMisses).toBe(0)
    })
  })

  describe('集成测试', () => {
    it('应该与实际布局计算函数正常工作', () => {
      // 使用真实的布局计算函数
      const result1 = calculateLayout(1200, 800, 10, 50, { hasGameInfo: true })
      const result2 = calculateLayout(1200, 800, 10, 50, { hasGameInfo: true })

      // 验证结果一致性
      expect(result1).toEqual(result2)
      expect(result1.deviceConfig.type).toBe('desktop')
      expect(result1.maxSafeCards).toBeGreaterThan(0)
      expect(result1.recommendedCards).toBeGreaterThan(0)

      const metrics = getLayoutPerformanceMetrics()
      expect(metrics.cacheHits).toBe(1) // 第二次调用命中缓存
      expect(metrics.totalCalculations).toBe(1) // 只计算了一次
    })

    it('应该处理不同设备类型的缓存', () => {
      // 不同设备类型应该有不同的缓存条目
      const mobileResult = calculateLayout(400, 600, 5, 20, {})
      const desktopResult = calculateLayout(1200, 800, 10, 50, {})

      expect(mobileResult.deviceConfig.type).toBe('mobile')
      expect(desktopResult.deviceConfig.type).toBe('desktop')

      const metrics = getLayoutPerformanceMetrics()
      expect(metrics.cacheMisses).toBe(2) // 两次不同的计算
      expect(metrics.totalCalculations).toBe(2)

      const debugInfo = getLayoutCacheDebugInfo()
      expect(debugInfo.totalEntries).toBe(2) // 两个缓存条目
    })
  })
})