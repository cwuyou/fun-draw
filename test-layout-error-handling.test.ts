// 布局错误处理和降级机制测试
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { 
  calculateLayout,
  getLayoutDebugInfo,
  type LayoutCalculationResult,
  type LayoutError,
  type LayoutWarning
} from './lib/layout-manager'

describe('Layout Error Handling and Fallback Mechanisms', () => {
  describe('输入验证', () => {
    it('应该处理无效的容器尺寸', () => {
      const result = calculateLayout(0, 0, 10, 50)
      
      expect(result.fallbackApplied).toBe(true)
      expect(result.errors).toBeDefined()
      expect(result.errors![0].code).toBe('CRITICAL_CALCULATION_FAILURE')
      expect(result.errors![0].severity).toBe('critical')
      expect(result.maxSafeCards).toBe(1)
      expect(result.recommendedCards).toBe(1)
    })

    it('应该处理负数参数', () => {
      const result = calculateLayout(-100, -100, -5, -10)
      
      expect(result.fallbackApplied).toBe(true)
      expect(result.errors).toBeDefined()
      expect(result.errors![0].code).toBe('CRITICAL_CALCULATION_FAILURE')
      expect(result.maxSafeCards).toBe(1)
      expect(result.recommendedCards).toBe(1)
    })
  })

  describe('容器尺寸验证和降级', () => {
    it('应该在容器过小时应用降级配置', () => {
      // 使用非常小的容器尺寸
      const result = calculateLayout(200, 200, 10, 50)
      
      expect(result.warnings).toBeDefined()
      const sizeWarning = result.warnings!.find(w => w.code === 'CONTAINER_SIZE_WARNING')
      expect(sizeWarning).toBeDefined()
      expect(sizeWarning!.recommendation).toContain('考虑增加容器尺寸')
      expect(result.fallbackApplied).toBe(true)
    })

    it('应该在极小容器时生成严重错误', () => {
      // 使用极小的容器尺寸
      const result = calculateLayout(50, 50, 10, 50)
      
      expect(result.errors).toBeDefined()
      const criticalError = result.errors!.find(e => e.code === 'CONTAINER_TOO_SMALL')
      expect(criticalError).toBeDefined()
      expect(criticalError!.severity).toBe('critical')
    })
  })

  describe('卡牌数量计算和警告', () => {
    it('应该在推荐数量少于请求数量时生成警告', () => {
      // 请求大量卡牌但容器较小
      const result = calculateLayout(800, 600, 50, 100)
      
      expect(result.warnings).toBeDefined()
      const quantityWarning = result.warnings!.find(w => w.code === 'QUANTITY_REDUCED')
      expect(quantityWarning).toBeDefined()
      expect(quantityWarning!.message).toContain('推荐数量')
      expect(quantityWarning!.message).toContain('少于请求数量')
    })

    it('应该在可用项目不足时生成警告', () => {
      const result = calculateLayout(1200, 800, 10, 5) // 请求10张但只有5个项目
      
      expect(result.warnings).toBeDefined()
      const itemsWarning = result.warnings!.find(w => w.code === 'INSUFFICIENT_ITEMS')
      expect(itemsWarning).toBeDefined()
      expect(itemsWarning!.message).toContain('超过可用项目数')
    })

    it('应该在无法容纳任何卡牌时强制显示最少卡牌', () => {
      // 模拟极端情况，通过非常小的可用空间
      const result = calculateLayout(100, 100, 10, 50, {
        hasGameInfo: true,
        hasWarnings: true,
        hasStartButton: true,
        hasResultDisplay: true
      })
      
      expect(result.warnings).toBeDefined()
      const forceMinWarning = result.warnings!.find(w => w.code === 'FORCE_MINIMUM_CARDS')
      if (forceMinWarning) {
        expect(forceMinWarning.message).toContain('强制显示至少1张卡牌')
        expect(result.maxSafeCards).toBe(1)
      }
    })
  })

  describe('降级配置', () => {
    it('应该生成有效的降级配置', () => {
      const result = calculateLayout(300, 400, 20, 50) // 小容器，大量卡牌
      
      if (result.fallbackApplied) {
        expect(result.deviceConfig.maxCards).toBeGreaterThan(0)
        expect(result.deviceConfig.cardSize.width).toBeGreaterThanOrEqual(60)
        expect(result.deviceConfig.cardSize.height).toBeGreaterThanOrEqual(80)
        expect(result.deviceConfig.spacing).toBeGreaterThanOrEqual(8)
        expect(result.deviceConfig.cardsPerRow).toBeGreaterThanOrEqual(1)
      }
    })

    it('应该在降级后仍能正常计算', () => {
      const result = calculateLayout(250, 300, 15, 30)
      
      expect(result.maxSafeCards).toBeGreaterThan(0)
      expect(result.recommendedCards).toBeGreaterThan(0)
      expect(result.containerDimensions.availableWidth).toBeGreaterThanOrEqual(0)
      expect(result.containerDimensions.availableHeight).toBeGreaterThanOrEqual(0)
    })
  })

  describe('错误和警告结构', () => {
    it('应该包含完整的错误信息', () => {
      const result = calculateLayout(0, 0, 10, 50)
      
      expect(result.errors).toBeDefined()
      const error = result.errors![0]
      expect(error.code).toBeDefined()
      expect(error.message).toBeDefined()
      expect(error.severity).toBeDefined()
      expect(error.timestamp).toBeDefined()
      expect(typeof error.timestamp).toBe('number')
    })

    it('应该包含完整的警告信息', () => {
      const result = calculateLayout(800, 600, 50, 100)
      
      if (result.warnings && result.warnings.length > 0) {
        const warning = result.warnings[0]
        expect(warning.code).toBeDefined()
        expect(warning.message).toBeDefined()
        expect(warning.timestamp).toBeDefined()
        expect(typeof warning.timestamp).toBe('number')
        
        if (warning.recommendation) {
          expect(typeof warning.recommendation).toBe('string')
        }
      }
    })
  })

  describe('调试信息', () => {
    it('应该生成有用的调试信息', () => {
      const result = calculateLayout(1200, 800, 10, 50)
      const debugInfo = getLayoutDebugInfo(result)
      
      expect(debugInfo).toContain('Device:')
      expect(debugInfo).toContain('Available:')
      expect(debugInfo).toContain('Margins:')
      expect(debugInfo).toContain('Card Size:')
      expect(debugInfo).toContain('Max Safe Cards:')
      expect(debugInfo).toContain('Recommended:')
    })

    it('应该在降级情况下提供调试信息', () => {
      const result = calculateLayout(200, 200, 20, 50)
      const debugInfo = getLayoutDebugInfo(result)
      
      expect(debugInfo).toBeDefined()
      expect(debugInfo.length).toBeGreaterThan(0)
    })
  })

  describe('边界情况处理', () => {
    it('应该处理极端的UI配置', () => {
      const result = calculateLayout(400, 300, 5, 10, {
        hasGameInfo: true,
        hasWarnings: true,
        hasStartButton: true,
        hasResultDisplay: true
      })
      
      expect(result.maxSafeCards).toBeGreaterThan(0)
      expect(result.recommendedCards).toBeGreaterThan(0)
    })

    it('应该处理零项目数量', () => {
      const result = calculateLayout(1200, 800, 10, 0)
      
      expect(result.recommendedCards).toBe(1) // 至少推荐1张
      expect(result.warnings).toBeDefined()
      const itemsWarning = result.warnings!.find(w => w.code === 'INSUFFICIENT_ITEMS')
      expect(itemsWarning).toBeDefined()
    })

    it('应该处理零请求数量', () => {
      const result = calculateLayout(1200, 800, 0, 50)
      
      expect(result.recommendedCards).toBeGreaterThan(0) // 应该推荐至少1张
      expect(result.maxSafeCards).toBeGreaterThan(0)
    })
  })

  describe('一致性验证', () => {
    it('应该确保推荐数量不超过最大安全数量', () => {
      const result = calculateLayout(600, 400, 100, 200)
      
      expect(result.recommendedCards).toBeLessThanOrEqual(result.maxSafeCards)
    })

    it('应该确保推荐数量不超过可用项目数', () => {
      const result = calculateLayout(1200, 800, 50, 10)
      
      expect(result.recommendedCards).toBeLessThanOrEqual(10)
    })

    it('应该确保容器尺寸计算的一致性', () => {
      const result = calculateLayout(1000, 700, 15, 30)
      
      expect(result.containerDimensions.width).toBe(1000)
      expect(result.containerDimensions.height).toBe(700)
      expect(result.containerDimensions.availableWidth).toBeLessThanOrEqual(1000)
      expect(result.containerDimensions.availableHeight).toBeLessThanOrEqual(700)
    })
  })
})