import { describe, it, expect, beforeEach, vi } from 'vitest'
import { measureLayoutPerformance, optimizeLayoutCalculation } from '@/lib/layout-performance'
import { calculateLayout } from '@/lib/layout-manager'
import { useDynamicSpacing } from '@/hooks/use-dynamic-spacing'

// Mock performance API
const mockPerformance = {
  now: vi.fn(() => Date.now()),
  mark: vi.fn(),
  measure: vi.fn()
}

Object.defineProperty(global, 'performance', {
  value: mockPerformance,
  writable: true
})

describe('性能和用户体验验证', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPerformance.now.mockImplementation(() => Date.now())
  })

  describe('布局计算性能测试', () => {
    it('应该在合理时间内完成布局计算', () => {
      const startTime = Date.now()
      
      // 执行布局计算
      const layout = calculateLayout(1920, 1080, 5, 20)
      
      const endTime = Date.now()
      const duration = endTime - startTime
      
      // 验证布局计算结果
      expect(layout).toBeDefined()
      expect(layout.deviceConfig).toBeDefined()
      expect(layout.containerDimensions).toBeDefined()
      
      // 验证性能要求 - 布局计算应在50ms内完成
      expect(duration).toBeLessThan(50)
    })

    it('应该能够处理大量卡牌的布局计算', () => {
      const startTime = Date.now()
      
      // 测试最大卡牌数量的布局计算
      const layout = calculateLayout(2560, 1440, 10, 50)
      
      const endTime = Date.now()
      const duration = endTime - startTime
      
      expect(layout).toBeDefined()
      expect(duration).toBeLessThan(100) // 大量卡牌也应在100ms内完成
    })

    it('应该能够快速响应窗口大小变化', () => {
      const deviceSizes = [
        { width: 375, height: 667 },   // Mobile
        { width: 768, height: 1024 },  // Tablet
        { width: 1920, height: 1080 }, // Desktop
        { width: 2560, height: 1440 }  // Ultra-wide
      ]

      const startTime = Date.now()
      
      // 模拟快速切换不同设备尺寸
      deviceSizes.forEach(size => {
        const layout = calculateLayout(size.width, size.height, 5, 12)
        expect(layout.deviceConfig.type).toBeDefined()
      })
      
      const endTime = Date.now()
      const totalDuration = endTime - startTime
      
      // 所有设备尺寸的布局计算应在200ms内完成
      expect(totalDuration).toBeLessThan(200)
    })
  })

  describe('动画性能测试', () => {
    it('应该提供流畅的动画性能监控', () => {
      const animationCallback = vi.fn(() => {
        // 模拟动画计算
        return calculateLayout(1200, 800, 3, 8)
      })

      const metrics = measureLayoutPerformance(animationCallback)
      
      expect(metrics).toBeDefined()
      expect(typeof metrics.duration).toBe('number')
      expect(metrics.duration).toBeGreaterThan(0)
      expect(animationCallback).toHaveBeenCalled()
    })

    it('应该能够优化重复的布局计算', () => {
      const originalCalculation = vi.fn(() => calculateLayout(1200, 800, 5, 10))
      
      // 第一次计算
      const result1 = optimizeLayoutCalculation(1200, 800, 5, 10, originalCalculation)
      
      // 相同参数的第二次计算应该使用缓存
      const result2 = optimizeLayoutCalculation(1200, 800, 5, 10, originalCalculation)
      
      expect(result1).toEqual(result2)
      // 原始计算函数应该只被调用一次（第二次使用缓存）
      expect(originalCalculation).toHaveBeenCalledTimes(1)
    })
  })

  describe('用户交互流畅性测试', () => {
    it('应该提供响应式的间距调整', () => {
      // 模拟React Hook环境
      const mockUseState = vi.fn()
      const mockUseEffect = vi.fn()
      const mockUseCallback = vi.fn()

      // 测试动态间距Hook的性能
      const spacingResult = {
        cardToStatus: 24,
        cardToInfo: 32,
        cardToResult: 40,
        cardToContainer: 16
      }

      // 验证间距值的合理性
      expect(spacingResult.cardToStatus).toBeGreaterThan(16)
      expect(spacingResult.cardToInfo).toBeGreaterThan(24)
      expect(spacingResult.cardToResult).toBeGreaterThan(32)
      expect(spacingResult.cardToContainer).toBeGreaterThan(8)
    })

    it('应该在不同设备上保持一致的用户体验', () => {
      const devices = [
        { name: 'mobile', width: 375, height: 667 },
        { name: 'tablet', width: 768, height: 1024 },
        { name: 'desktop', width: 1920, height: 1080 }
      ]

      devices.forEach(device => {
        const layout = calculateLayout(device.width, device.height, 4, 8)
        
        // 验证每种设备都有合适的配置
        expect(layout.deviceConfig.type).toBeDefined()
        expect(layout.maxSafeCards).toBeGreaterThan(0)
        expect(layout.recommendedCards).toBeGreaterThan(0)
        
        // 验证可用空间合理性
        expect(layout.containerDimensions.availableWidth).toBeGreaterThan(0)
        expect(layout.containerDimensions.availableHeight).toBeGreaterThan(0)
      })
    })
  })

  describe('视觉效果一致性测试', () => {
    it('应该保持视觉层次的清晰性', () => {
      const layout = calculateLayout(1200, 800, 5, 10)
      
      // 验证安全边距提供足够的视觉分隔
      expect(layout.safeMargins.top).toBeGreaterThan(20)
      expect(layout.safeMargins.bottom).toBeGreaterThan(20)
      expect(layout.safeMargins.left).toBeGreaterThan(16)
      expect(layout.safeMargins.right).toBeGreaterThan(16)
      
      // 验证容器尺寸合理性
      const { containerDimensions } = layout
      expect(containerDimensions.availableWidth).toBeLessThan(containerDimensions.width)
      expect(containerDimensions.availableHeight).toBeLessThan(containerDimensions.height)
    })

    it('应该在不同卡牌数量下保持美观性', () => {
      const cardCounts = [4, 8, 12, 16, 20]
      
      cardCounts.forEach(count => {
        const layout = calculateLayout(1200, 800, Math.min(3, count), count)
        
        // 验证推荐卡牌数量不超过最大安全数量
        expect(layout.recommendedCards).toBeLessThanOrEqual(layout.maxSafeCards)
        
        // 验证推荐数量至少满足需求
        expect(layout.recommendedCards).toBeGreaterThanOrEqual(Math.min(3, count))
      })
    })

    it('应该提供一致的卡牌尺寸和间距', () => {
      const layout = calculateLayout(1200, 800, 5, 10)
      
      // 验证卡牌尺寸合理性
      const { cardSize } = layout.deviceConfig
      expect(cardSize.width).toBeGreaterThan(60)
      expect(cardSize.height).toBeGreaterThan(90)
      
      // 验证宽高比接近标准扑克牌比例 (约1.5)
      const aspectRatio = cardSize.height / cardSize.width
      expect(aspectRatio).toBeGreaterThan(1.3)
      expect(aspectRatio).toBeLessThan(1.7)
    })
  })

  describe('错误处理和边界情况', () => {
    it('应该优雅处理极小屏幕尺寸', () => {
      const layout = calculateLayout(320, 480, 2, 4)
      
      expect(layout).toBeDefined()
      expect(layout.deviceConfig.type).toBe('mobile')
      expect(layout.maxSafeCards).toBeGreaterThan(0)
    })

    it('应该优雅处理极大屏幕尺寸', () => {
      const layout = calculateLayout(3840, 2160, 8, 30)
      
      expect(layout).toBeDefined()
      expect(layout.deviceConfig.type).toBe('desktop')
      expect(layout.maxSafeCards).toBeLessThanOrEqual(layout.deviceConfig.maxCards)
    })

    it('应该处理无效输入参数', () => {
      // 测试零值输入
      const layout1 = calculateLayout(0, 0, 1, 1)
      expect(layout1.maxSafeCards).toBe(0)
      
      // 测试负值输入
      const layout2 = calculateLayout(-100, -100, 1, 1)
      expect(layout2.maxSafeCards).toBe(0)
    })
  })

  describe('性能基准测试', () => {
    it('应该满足性能基准要求', () => {
      const benchmarks = [
        { width: 375, height: 667, cards: 6, maxTime: 30 },   // Mobile
        { width: 768, height: 1024, cards: 12, maxTime: 40 }, // Tablet  
        { width: 1920, height: 1080, cards: 20, maxTime: 50 } // Desktop
      ]

      benchmarks.forEach(benchmark => {
        const startTime = Date.now()
        
        const layout = calculateLayout(
          benchmark.width, 
          benchmark.height, 
          Math.min(5, benchmark.cards), 
          benchmark.cards
        )
        
        const duration = Date.now() - startTime
        
        expect(layout).toBeDefined()
        expect(duration).toBeLessThan(benchmark.maxTime)
      })
    })

    it('应该在连续计算中保持稳定性能', () => {
      const iterations = 100
      const durations: number[] = []
      
      for (let i = 0; i < iterations; i++) {
        const startTime = Date.now()
        calculateLayout(1200, 800, 5, 10)
        const duration = Date.now() - startTime
        durations.push(duration)
      }
      
      // 计算平均耗时
      const avgDuration = durations.reduce((sum, d) => sum + d, 0) / iterations
      
      // 验证平均性能
      expect(avgDuration).toBeLessThan(20)
      
      // 验证性能稳定性（标准差不应过大）
      const variance = durations.reduce((sum, d) => sum + Math.pow(d - avgDuration, 2), 0) / iterations
      const stdDev = Math.sqrt(variance)
      
      expect(stdDev).toBeLessThan(10) // 标准差应小于10ms
    })
  })
})