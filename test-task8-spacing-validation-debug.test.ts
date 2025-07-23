/**
 * Task 8 测试：间距验证和调试工具
 * 验证间距验证接口、调试工具和错误处理功能
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  validateAllSpacing,
  validateSpacingMeasurements,
  generateSpacingDebugReport,
  createFallbackSpacing,
  displaySpacingDebugInfo,
  createSpacingDebugDisplay,
  withSpacingValidation,
  measureSpacingPerformance,
  getCachedSpacingConfig,
  getCachedCardAreaSpacing,
  clearSpacingCache,
  getSpacingPerformanceStats,
  resetSpacingPerformanceStats
} from '@/lib/spacing-system'
import type { DeviceType } from '@/types'

describe('Task 8: 间距验证和调试工具', () => {
  beforeEach(() => {
    // 重置性能统计
    resetSpacingPerformanceStats()
    // 清除缓存
    clearSpacingCache()
    // 清除控制台模拟
    vi.clearAllMocks()
  })

  describe('间距验证功能', () => {
    it('应该验证所有间距配置的一致性', () => {
      const deviceType: DeviceType = 'desktop'
      const containerWidth = 1200
      const containerHeight = 800
      const cardCount = 8

      const validation = validateAllSpacing(deviceType, containerWidth, containerHeight, cardCount)

      expect(validation).toHaveProperty('isValid')
      expect(validation).toHaveProperty('uiElementValidation')
      expect(validation).toHaveProperty('cardAreaValidation')
      expect(validation).toHaveProperty('overallIssues')
      expect(validation).toHaveProperty('recommendations')
      expect(Array.isArray(validation.recommendations)).toBe(true)
    })

    it('应该检测容器尺寸不足的情况', () => {
      const deviceType: DeviceType = 'mobile'
      const containerWidth = 200  // 过小的容器
      const containerHeight = 300
      const cardCount = 6

      const validation = validateAllSpacing(deviceType, containerWidth, containerHeight, cardCount)

      // 验证至少有一个验证失败或有建议
      const hasIssues = !validation.isValid || 
                       validation.overallIssues.length > 0 || 
                       validation.recommendations.length > 0 ||
                       !validation.uiElementValidation.isValid ||
                       !validation.cardAreaValidation.isValid

      expect(hasIssues).toBe(true)
      
      // 至少应该有一些建议或问题
      const totalIssuesAndRecommendations = 
        validation.overallIssues.length + 
        validation.recommendations.length +
        validation.uiElementValidation.errors.length +
        validation.uiElementValidation.warnings.length +
        Object.keys(validation.cardAreaValidation.violations).length

      expect(totalIssuesAndRecommendations).toBeGreaterThan(0)
    })

    it('应该验证实际测量值与期望值的偏差', () => {
      const measuredSpacing = {
        containerMargins: { top: 35, bottom: 25, left: 30, right: 30 },
        rowSpacing: 18,
        cardSpacing: 14
      }

      const expectedSpacing = {
        containerMargins: { top: 36, bottom: 24, left: 32, right: 32 },
        rowSpacing: 20,
        cardSpacing: 16,
        minCardAreaHeight: 200
      }

      const result = validateSpacingMeasurements(measuredSpacing, expectedSpacing, 2)

      expect(result).toHaveProperty('isValid')
      expect(result).toHaveProperty('discrepancies')
      expect(result).toHaveProperty('maxDeviation')
      expect(Array.isArray(result.discrepancies)).toBe(true)
    })
  })

  describe('调试工具功能', () => {
    it('应该生成详细的间距调试报告', () => {
      const deviceType: DeviceType = 'tablet'
      const containerWidth = 800
      const containerHeight = 600
      const cardCount = 6

      const report = generateSpacingDebugReport(deviceType, containerWidth, containerHeight, cardCount)

      expect(report).toHaveProperty('summary')
      expect(report).toHaveProperty('details')
      expect(report).toHaveProperty('timestamp')
      expect(report.details).toHaveProperty('deviceInfo')
      expect(report.details).toHaveProperty('spacingConfig')
      expect(report.details).toHaveProperty('cardAreaSpacing')
      expect(report.details).toHaveProperty('validation')
      expect(Array.isArray(report.details.recommendations)).toBe(true)
      expect(typeof report.timestamp).toBe('number')
    })

    it('应该创建调试显示配置', () => {
      const debugDisplay = createSpacingDebugDisplay({
        showOverlay: true,
        logToConsole: false
      })

      expect(debugDisplay).toHaveProperty('enabled')
      expect(debugDisplay).toHaveProperty('showOverlay')
      expect(debugDisplay).toHaveProperty('showMeasurements')
      expect(debugDisplay).toHaveProperty('showViolations')
      expect(debugDisplay).toHaveProperty('logToConsole')
      expect(debugDisplay.showOverlay).toBe(true)
      expect(debugDisplay.logToConsole).toBe(false)
    })

    it('应该在开发模式下显示调试信息', () => {
      const consoleSpy = vi.spyOn(console, 'group').mockImplementation(() => {})
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      const consoleGroupEndSpy = vi.spyOn(console, 'groupEnd').mockImplementation(() => {})

      // 模拟开发环境
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'

      displaySpacingDebugInfo('desktop', 1200, 800, 8, {
        enabled: true,
        showOverlay: false,
        showMeasurements: true,
        showViolations: true,
        logToConsole: true
      })

      expect(consoleSpy).toHaveBeenCalledWith('🎯 Spacing Debug Report')
      expect(consoleLogSpy).toHaveBeenCalled()
      expect(consoleGroupEndSpy).toHaveBeenCalled()

      // 恢复环境变量
      process.env.NODE_ENV = originalEnv
      
      consoleSpy.mockRestore()
      consoleLogSpy.mockRestore()
      consoleGroupEndSpy.mockRestore()
    })
  })

  describe('错误处理和降级功能', () => {
    it('应该创建安全的降级间距配置', () => {
      const deviceType: DeviceType = 'mobile'
      const errorContext = {
        containerWidth: 300,
        containerHeight: 400,
        originalError: new Error('Layout calculation failed')
      }

      const fallbackSpacing = createFallbackSpacing(deviceType, errorContext)

      expect(fallbackSpacing).toHaveProperty('containerMargins')
      expect(fallbackSpacing).toHaveProperty('rowSpacing')
      expect(fallbackSpacing).toHaveProperty('cardSpacing')
      expect(fallbackSpacing).toHaveProperty('minCardAreaHeight')
      
      // 验证降级值是合理的
      expect(fallbackSpacing.containerMargins.left).toBeGreaterThan(0)
      expect(fallbackSpacing.containerMargins.right).toBeGreaterThan(0)
      expect(fallbackSpacing.rowSpacing).toBeGreaterThan(0)
      expect(fallbackSpacing.cardSpacing).toBeGreaterThan(0)
    })

    it('应该在布局计算中集成间距验证', () => {
      const mockLayoutCalculation = vi.fn(() => ({ success: true }))
      
      const result = withSpacingValidation(
        'desktop',
        1200,
        800,
        6,
        mockLayoutCalculation
      )

      expect(mockLayoutCalculation).toHaveBeenCalled()
      expect(result).toHaveProperty('result')
      expect(result).toHaveProperty('validation')
      expect(result).toHaveProperty('fallbackApplied')
      expect(result.result).toEqual({ success: true })
    })

    it('应该处理布局计算失败的情况', () => {
      const mockLayoutCalculation = vi.fn(() => {
        throw new Error('Calculation failed')
      })

      expect(() => {
        withSpacingValidation('desktop', 1200, 800, 6, mockLayoutCalculation)
      }).toThrow('Calculation failed')
    })
  })

  describe('性能监控功能', () => {
    it('应该测量间距计算性能', () => {
      const mockOperation = vi.fn(() => 'test result')
      
      const { result, metrics } = measureSpacingPerformance(mockOperation, 'calculation')

      expect(result).toBe('test result')
      expect(metrics).toHaveProperty('calculationTime')
      expect(typeof metrics.calculationTime).toBe('number')
      expect(metrics.calculationTime).toBeGreaterThanOrEqual(0)
    })

    it('应该跟踪性能统计', () => {
      const mockOperation = () => 'test'
      
      // 执行几次操作
      measureSpacingPerformance(mockOperation, 'calculation')
      measureSpacingPerformance(mockOperation, 'validation')
      
      const stats = getSpacingPerformanceStats()
      
      expect(stats).toHaveProperty('calculationTime')
      expect(stats).toHaveProperty('validationTime')
      expect(stats).toHaveProperty('totalTime')
      expect(stats).toHaveProperty('cacheHits')
      expect(stats).toHaveProperty('cacheMisses')
    })

    it('应该支持缓存功能', () => {
      const deviceType: DeviceType = 'desktop'
      
      // 第一次调用应该是缓存未命中
      const config1 = getCachedSpacingConfig(deviceType)
      const spacing1 = getCachedCardAreaSpacing(deviceType)
      
      // 第二次调用应该是缓存命中
      const config2 = getCachedSpacingConfig(deviceType)
      const spacing2 = getCachedCardAreaSpacing(deviceType)
      
      expect(config1).toEqual(config2)
      expect(spacing1).toEqual(spacing2)
      
      const stats = getSpacingPerformanceStats()
      expect(stats.cacheHits).toBeGreaterThan(0)
      expect(stats.cacheMisses).toBeGreaterThan(0)
    })
  })

  describe('边界情况测试', () => {
    it('应该处理极小容器尺寸', () => {
      const validation = validateAllSpacing('mobile', 100, 100, 4)
      
      expect(validation.isValid).toBe(false)
      expect(validation.overallIssues.length).toBeGreaterThan(0)
    })

    it('应该处理大量卡牌', () => {
      const validation = validateAllSpacing('desktop', 1920, 1080, 20)
      
      expect(validation).toHaveProperty('isValid')
      expect(validation.cardAreaValidation).toHaveProperty('recommendations')
    })

    it('应该处理零容差的测量验证', () => {
      const measuredSpacing = {
        containerMargins: { top: 36, bottom: 24, left: 32, right: 32 }
      }
      
      const expectedSpacing = {
        containerMargins: { top: 36, bottom: 24, left: 32, right: 32 },
        rowSpacing: 20,
        cardSpacing: 16,
        minCardAreaHeight: 200
      }
      
      const result = validateSpacingMeasurements(measuredSpacing, expectedSpacing, 0)
      
      expect(result.isValid).toBe(true)
      expect(result.discrepancies).toHaveLength(0)
      expect(result.maxDeviation).toBe(0)
    })
  })
})