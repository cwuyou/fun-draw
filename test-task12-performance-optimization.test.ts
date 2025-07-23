import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { 
  ResizePerformanceManager, 
  resizePerformanceManager,
  createDebouncedResize,
  withPerformanceMonitoring
} from '@/lib/resize-performance'
import { 
  optimizePositionValidation,
  batchValidatePositions
} from '@/lib/position-validation'

describe('Task 12: Performance Optimization for Resize Handling', () => {
  let performanceManager: ResizePerformanceManager

  beforeEach(() => {
    performanceManager = new ResizePerformanceManager({
      debounceDelay: 50, // 减少测试时间
      maxHistoryEntries: 10,
      enableMetrics: true,
      enableMemoryCleanup: true,
      performanceThreshold: 50
    })
  })

  afterEach(() => {
    performanceManager.destroy()
    vi.clearAllMocks()
  })

  describe('Efficient Debouncing', () => {
    it('should prevent excessive recalculations with debouncing', async () => {
      const mockCallback = vi.fn()
      const debouncedFn = performanceManager.debounce(mockCallback)

      // 快速连续调用
      for (let i = 0; i < 5; i++) {
        debouncedFn(`call-${i}`)
      }

      // 应该只执行一次
      expect(mockCallback).not.toHaveBeenCalled()

      // 等待防抖延迟
      await new Promise(resolve => setTimeout(resolve, 60))

      expect(mockCallback).toHaveBeenCalledTimes(1)
      expect(mockCallback).toHaveBeenCalledWith('call-4') // 最后一次调用
    })

    it('should track debounce hits correctly', async () => {
      const mockCallback = vi.fn()
      const debouncedFn = performanceManager.debounce(mockCallback)

      // 连续调用5次
      for (let i = 0; i < 5; i++) {
        debouncedFn()
      }

      await new Promise(resolve => setTimeout(resolve, 60))

      const metrics = performanceManager.getMetrics()
      expect(metrics.debounceHits).toBe(4) // 5次调用，4次被防抖
    })

    it('should support immediate execution option', () => {
      const mockCallback = vi.fn()
      const debouncedFn = performanceManager.debounce(mockCallback, true)

      debouncedFn('immediate')
      expect(mockCallback).toHaveBeenCalledWith('immediate')
      expect(mockCallback).toHaveBeenCalledTimes(1)
    })
  })

  describe('Memory Cleanup', () => {
    it('should limit history entries to configured maximum', async () => {
      const mockCallback = vi.fn()
      const debouncedFn = performanceManager.debounce(mockCallback)

      // 执行超过最大历史记录数的操作
      for (let i = 0; i < 15; i++) {
        debouncedFn(i)
        await new Promise(resolve => setTimeout(resolve, 60))
      }

      const history = performanceManager.getHistory()
      expect(history.length).toBeLessThanOrEqual(10) // 配置的最大值
    })

    it('should clean up old history entries', () => {
      // 添加一些历史记录
      for (let i = 0; i < 15; i++) {
        performanceManager['addHistoryEntry']([i], 10, true)
      }

      expect(performanceManager.getHistory().length).toBe(10) // 受maxHistoryEntries限制

      performanceManager.cleanup()

      // 应该保留最近的25%
      expect(performanceManager.getHistory().length).toBeLessThanOrEqual(3)
    })

    it('should clean up error tracking map', () => {
      // 添加多个错误类型
      for (let i = 0; i < 15; i++) {
        performanceManager['trackError'](`error-type-${i}`)
      }

      expect(Object.keys(performanceManager.getErrorStats()).length).toBe(15)

      performanceManager.cleanup()

      // 应该只保留最近的5个
      expect(Object.keys(performanceManager.getErrorStats()).length).toBeLessThanOrEqual(5)
    })
  })

  describe('Performance Monitoring', () => {
    it('should track execution metrics', async () => {
      const mockCallback = vi.fn().mockImplementation(() => {
        // 模拟一些处理时间
        const start = performance.now()
        while (performance.now() - start < 10) {
          // 忙等待
        }
      })

      const debouncedFn = performanceManager.debounce(mockCallback)
      
      debouncedFn()
      await new Promise(resolve => setTimeout(resolve, 60))

      const metrics = performanceManager.getMetrics()
      expect(metrics.resizeCount).toBe(1)
      expect(metrics.averageDuration).toBeGreaterThan(0)
      expect(metrics.totalDuration).toBeGreaterThan(0)
    })

    it('should generate performance reports with recommendations', async () => {
      const slowCallback = vi.fn().mockImplementation(() => {
        const start = performance.now()
        while (performance.now() - start < 60) {
          // 模拟慢操作
        }
      })

      const debouncedFn = performanceManager.debounce(slowCallback)
      
      debouncedFn()
      await new Promise(resolve => setTimeout(resolve, 100))

      const report = performanceManager.getPerformanceReport()
      
      expect(report.summary.resizeCount).toBe(1)
      expect(report.summary.averageDuration).toBeGreaterThan(50)
      expect(report.recommendations.length).toBeGreaterThan(0)
      expect(report.recommendations.some(r => r.includes('平均执行时间') && r.includes('超过阈值'))).toBe(true)
    })

    it('should track error rates and provide recommendations', async () => {
      const errorCallback = vi.fn().mockImplementation(() => {
        throw new Error('Test error')
      })

      const debouncedFn = performanceManager.debounce(errorCallback)
      
      // 执行多次以产生错误
      for (let i = 0; i < 3; i++) {
        debouncedFn()
        await new Promise(resolve => setTimeout(resolve, 60))
      }

      const report = performanceManager.getPerformanceReport()
      // 验证错误统计
      expect(Object.keys(report.errorStats).length).toBeGreaterThan(0)
      expect(report.summary.resizeCount).toBeGreaterThan(0)
    })
  })

  describe('Position Validation Optimization', () => {
    it('should perform quick validation for small arrays', () => {
      const positions = [
        { x: 0, y: 0, rotation: 0, cardWidth: 96, cardHeight: 144 },
        { x: 100, y: 0, rotation: 0, cardWidth: 96, cardHeight: 144 },
        { x: 200, y: 0, rotation: 0, cardWidth: 96, cardHeight: 144 }
      ]

      const result = optimizePositionValidation(positions, 3)
      
      expect(result.isValid).toBe(true)
      expect(result.quickCheck).toBe(true)
    })

    it('should use sampling for large arrays', () => {
      const positions = Array.from({ length: 20 }, (_, i) => ({
        x: i * 100,
        y: 0,
        rotation: 0,
        cardWidth: 96,
        cardHeight: 144
      }))

      const result = optimizePositionValidation(positions, 20)
      
      expect(result.isValid).toBe(true)
      expect(result.quickCheck).toBe(true)
    })

    it('should detect invalid positions quickly', () => {
      const positions = [
        { x: 0, y: 0, rotation: 0, cardWidth: 96, cardHeight: 144 },
        null, // 无效位置
        { x: 200, y: 0, rotation: 0, cardWidth: 96, cardHeight: 144 }
      ]

      const result = optimizePositionValidation(positions as any, 3)
      
      expect(result.isValid).toBe(false)
      expect(result.quickCheck).toBe(true)
    })
  })

  describe('Batch Position Validation', () => {
    it('should validate multiple position batches efficiently', () => {
      const batch1 = [
        { x: 0, y: 0, rotation: 0, cardWidth: 96, cardHeight: 144 },
        { x: 100, y: 0, rotation: 0, cardWidth: 96, cardHeight: 144 }
      ]

      const batch2 = [
        { x: 0, y: 100, rotation: 0, cardWidth: 96, cardHeight: 144 },
        { x: 100, y: 100, rotation: 0, cardWidth: 96, cardHeight: 144 }
      ]

      const result = batchValidatePositions([batch1, batch2])
      
      expect(result.validBatches).toBe(2)
      expect(result.totalBatches).toBe(2)
      expect(result.errors).toHaveLength(0)
    })

    it('should report invalid batches', () => {
      const validBatch = [
        { x: 0, y: 0, rotation: 0, cardWidth: 96, cardHeight: 144 }
      ]

      const invalidBatch = [null] // 无效批次

      const result = batchValidatePositions([validBatch, invalidBatch as any])
      
      expect(result.validBatches).toBe(1)
      expect(result.totalBatches).toBe(2)
      expect(result.errors).toHaveLength(1)
    })
  })

  describe('Performance Monitoring Decorator', () => {
    it('should monitor synchronous function performance', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      
      const testFn = withPerformanceMonitoring((x: number) => x * 2, 'test-sync')
      
      const result = testFn(5)
      
      expect(result).toBe(10)
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/test-sync completed in \d+\.\d+ms/)
      )
      
      consoleSpy.mockRestore()
    })

    it('should monitor asynchronous function performance', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      
      const asyncFn = withPerformanceMonitoring(
        async (delay: number) => {
          await new Promise(resolve => setTimeout(resolve, delay))
          return 'done'
        },
        'test-async'
      )
      
      const result = await asyncFn(10)
      
      expect(result).toBe('done')
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/test-async completed in \d+\.\d+ms/)
      )
      
      consoleSpy.mockRestore()
    })

    it('should handle function errors and still report timing', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      const errorFn = withPerformanceMonitoring(() => {
        throw new Error('Test error')
      }, 'test-error')
      
      expect(() => errorFn()).toThrow('Test error')
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/test-error failed after \d+\.\d+ms:/),
        expect.any(Error)
      )
      
      consoleSpy.mockRestore()
    })
  })

  describe('Global Performance Manager', () => {
    it('should provide a global instance', () => {
      expect(resizePerformanceManager).toBeDefined()
      expect(typeof resizePerformanceManager.debounce).toBe('function')
      expect(typeof resizePerformanceManager.getMetrics).toBe('function')
    })

    it('should create debounced resize functions', () => {
      const mockCallback = vi.fn()
      const debouncedFn = createDebouncedResize(mockCallback, 100)
      
      expect(typeof debouncedFn).toBe('function')
      
      debouncedFn()
      expect(mockCallback).not.toHaveBeenCalled() // 应该被防抖
    })
  })

  describe('Memory Usage Tracking', () => {
    it('should estimate memory usage', async () => {
      const mockCallback = vi.fn()
      const debouncedFn = performanceManager.debounce(mockCallback)
      
      // 执行一些操作以产生历史记录
      for (let i = 0; i < 5; i++) {
        debouncedFn()
        await new Promise(resolve => setTimeout(resolve, 60))
      }
      
      const metrics = performanceManager.getMetrics()
      expect(metrics.memoryUsage).toBeGreaterThan(0)
    })

    it('should provide memory usage recommendations', async () => {
      const mockCallback = vi.fn()
      const debouncedFn = performanceManager.debounce(mockCallback)
      
      // 执行一些操作以产生历史记录和内存使用
      for (let i = 0; i < 5; i++) {
        debouncedFn()
        await new Promise(resolve => setTimeout(resolve, 60))
      }
      
      const metrics = performanceManager.getMetrics()
      expect(metrics.memoryUsage).toBeGreaterThan(0)
      
      const report = performanceManager.getPerformanceReport()
      // 验证内存使用统计
      expect(report.summary.memoryUsage).toBeGreaterThan(0)
    })
  })
})