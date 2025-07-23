/**
 * Task 9 测试：动态间距Hook集成
 * 验证useDynamicSpacing hook对卡牌区域特定间距的支持
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import {
  useDynamicSpacing,
  useCardGameSpacing,
  createCardAreaSpacingStyle,
  createCardGridClass,
  getCardAreaSpacingDebugInfo,
  validateSpacingCompatibility,
  cardAreaSpacingConstants
} from '@/hooks/use-dynamic-spacing'
import type { DeviceType } from '@/types'

describe('Task 9: 动态间距Hook集成', () => {
  beforeEach(() => {
    // 清理任何可能的副作用
  })

  describe('useDynamicSpacing Hook 增强功能', () => {
    it('应该支持卡牌区域特定间距', () => {
      const { result } = renderHook(() => useDynamicSpacing({
        containerWidth: 1200,
        containerHeight: 800,
        cardCount: 8,
        enableCardAreaSpacing: true
      }))

      expect(result.current.cardAreaSpacing).toBeDefined()
      expect(result.current.layoutComplexity).toBe('complex') // 8 cards > 5 threshold
      expect(result.current.cssClasses.cardArea).toBeDefined()
      expect(result.current.spacing.cardArea).toBeDefined()
    })

    it('应该检测卡牌布局复杂度', () => {
      // 简单布局 (4 cards on desktop)
      const { result: simpleResult } = renderHook(() => useDynamicSpacing({
        containerWidth: 1200,
        cardCount: 4,
        enableCardAreaSpacing: true
      }))

      expect(simpleResult.current.layoutComplexity).toBe('simple')

      // 复杂布局 (8 cards on desktop)
      const { result: complexResult } = renderHook(() => useDynamicSpacing({
        containerWidth: 1200,
        cardCount: 8,
        enableCardAreaSpacing: true
      }))

      expect(complexResult.current.layoutComplexity).toBe('complex')
    })

    it('应该根据设备类型调整复杂度阈值', () => {
      // Mobile: threshold = 4
      const { result: mobileResult } = renderHook(() => useDynamicSpacing({
        containerWidth: 375,
        cardCount: 5,
        enableCardAreaSpacing: true
      }))

      expect(mobileResult.current.deviceType).toBe('mobile')
      expect(mobileResult.current.layoutComplexity).toBe('complex')

      // Desktop: threshold = 5
      const { result: desktopResult } = renderHook(() => useDynamicSpacing({
        containerWidth: 1200,
        cardCount: 5,
        enableCardAreaSpacing: true
      }))

      expect(desktopResult.current.deviceType).toBe('desktop')
      expect(desktopResult.current.layoutComplexity).toBe('simple')
    })

    it('应该生成卡牌区域特定的CSS类名', () => {
      const { result } = renderHook(() => useDynamicSpacing({
        containerWidth: 1200,
        cardCount: 8,
        enableCardAreaSpacing: true
      }))

      const cardAreaClasses = result.current.cssClasses.cardArea
      expect(cardAreaClasses).toBeDefined()
      expect(cardAreaClasses?.containerMargins).toContain('mt-')
      expect(cardAreaClasses?.containerMargins).toContain('mb-')
      expect(cardAreaClasses?.containerMargins).toContain('mx-')
      expect(cardAreaClasses?.cardGrid).toContain('gap-x-')
      expect(cardAreaClasses?.cardGrid).toContain('gap-y-')
    })

    it('应该提供卡牌区域间距计算函数', () => {
      const { result } = renderHook(() => useDynamicSpacing({
        containerWidth: 1200,
        cardCount: 6,
        enableCardAreaSpacing: true
      }))

      const cardAreaSpacing = result.current.spacing.cardArea
      expect(cardAreaSpacing).toBeDefined()
      expect(typeof cardAreaSpacing?.containerMargins).toBe('function')
      expect(typeof cardAreaSpacing?.rowSpacing).toBe('function')
      expect(typeof cardAreaSpacing?.cardSpacing).toBe('function')

      const margins = cardAreaSpacing?.containerMargins()
      expect(margins).toHaveProperty('top')
      expect(margins).toHaveProperty('bottom')
      expect(margins).toHaveProperty('left')
      expect(margins).toHaveProperty('right')
    })

    it('应该支持缓存优化', () => {
      const { result: result1 } = renderHook(() => useDynamicSpacing({
        containerWidth: 1200,
        useCache: true,
        enableCardAreaSpacing: true
      }))

      const { result: result2 } = renderHook(() => useDynamicSpacing({
        containerWidth: 1200,
        useCache: true,
        enableCardAreaSpacing: true
      }))

      // 相同参数应该返回相同的配置
      expect(result1.current.spacingConfig).toEqual(result2.current.spacingConfig)
      expect(result1.current.cardAreaSpacing).toEqual(result2.current.cardAreaSpacing)
    })
  })

  describe('useCardGameSpacing Hook', () => {
    it('应该提供卡牌游戏特定的间距功能', () => {
      const { result } = renderHook(() => useCardGameSpacing({
        containerWidth: 1200,
        containerHeight: 800,
        cardCount: 8,
        cardsPerRow: 4
      }))

      expect(result.current.cardAreaSpacing).toBeDefined()
      expect(result.current.compatibility).toBeDefined()
      expect(result.current.cardSpecific).toBeDefined()
      expect(result.current.cardSpecific?.cardGrid).toBeDefined()
      expect(result.current.cardSpecific?.cardAreaStyle).toBeDefined()
    })

    it('应该验证间距兼容性', () => {
      const { result } = renderHook(() => useCardGameSpacing({
        containerWidth: 1200,
        containerHeight: 800,
        cardCount: 6
      }))

      const compatibility = result.current.compatibility
      expect(compatibility).toHaveProperty('isCompatible')
      expect(compatibility).toHaveProperty('issues')
      expect(compatibility).toHaveProperty('recommendations')
      expect(Array.isArray(compatibility.issues)).toBe(true)
      expect(Array.isArray(compatibility.recommendations)).toBe(true)
    })

    it('应该生成卡牌特定的调试信息', () => {
      const { result } = renderHook(() => useCardGameSpacing({
        containerWidth: 1200,
        cardCount: 8,
        enableDebug: true
      }))

      expect(result.current.debugInfo).toBeDefined()
      expect(typeof result.current.debugInfo).toBe('string')
      expect(result.current.debugInfo).toContain('Layout:')
      expect(result.current.debugInfo).toContain('Complexity Multiplier:')
    })
  })

  describe('辅助函数', () => {
    it('应该创建卡牌区域间距样式', () => {
      const cardAreaSpacing = {
        containerMargins: { top: 36, bottom: 24, left: 32, right: 32 },
        rowSpacing: 20,
        cardSpacing: 16,
        minCardAreaHeight: 200
      }

      const style = createCardAreaSpacingStyle(cardAreaSpacing, 'complex')

      expect(style.marginTop).toBe(Math.round(36 * 1.1)) // 复杂布局乘数
      expect(style.marginBottom).toBe(Math.round(24 * 1.1))
      expect(style.marginLeft).toBe(32)
      expect(style.marginRight).toBe(32)
      expect(style.gap).toBe(16)
      expect(style.rowGap).toBe(20)
    })

    it('应该创建卡牌网格CSS类名', () => {
      const cardAreaSpacing = {
        containerMargins: { top: 36, bottom: 24, left: 32, right: 32 },
        rowSpacing: 20,
        cardSpacing: 16,
        minCardAreaHeight: 200
      }

      const gridClass = createCardGridClass(cardAreaSpacing, 4, 'complex')

      expect(gridClass).toContain('grid')
      expect(gridClass).toContain('grid-cols-4')
      expect(gridClass).toContain('gap-x-[16px]')
      expect(gridClass).toContain('gap-y-[20px]')
      expect(gridClass).toContain('mt-[40px]') // 36 * 1.1 rounded
      expect(gridClass).toContain('mb-[26px]') // 24 * 1.1 rounded
      expect(gridClass).toContain('mx-[32px]')
    })

    it('应该生成卡牌区域调试信息', () => {
      const cardAreaSpacing = {
        containerMargins: { top: 36, bottom: 24, left: 32, right: 32 },
        rowSpacing: 20,
        cardSpacing: 16,
        minCardAreaHeight: 200
      }

      const debugInfo = getCardAreaSpacingDebugInfo(cardAreaSpacing, 'complex')

      expect(debugInfo).toContain('Layout: complex')
      expect(debugInfo).toContain('Complexity Multiplier: 1.1')
      expect(debugInfo).toContain('Container Margins:')
      expect(debugInfo).toContain('Row Spacing: 20px')
      expect(debugInfo).toContain('Card Spacing: 16px')
    })

    it('应该验证间距兼容性', () => {
      const mockDynamicSpacingResult = {
        deviceType: 'desktop' as DeviceType,
        spacingConfig: {
          baseUnit: 4,
          componentSpacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 },
          containerPadding: { x: 32, y: 32 },
          uiElementSpacing: {
            gameInfo: 36,
            gameStatus: 16,
            startButton: 24,
            warnings: 16,
            resultDisplay: 40,
            cardArea: 32
          }
        },
        cardAreaSpacing: {
          containerMargins: { top: 36, bottom: 24, left: 32, right: 32 },
          rowSpacing: 20,
          cardSpacing: 16,
          minCardAreaHeight: 200
        },
        layoutComplexity: 'complex' as const,
        containerPadding: { x: 32, y: 32, horizontal: '32px', vertical: '32px', all: '32px 32px' },
        cssClasses: { container: {}, component: {}, uiElement: {} },
        spacing: {
          responsive: () => 16,
          uiElement: () => 24
        },
        validation: {
          isValid: true,
          uiElementValidation: { isValid: true, warnings: [], errors: [], recommendations: [] },
          cardAreaValidation: { isValid: true, violations: {}, recommendations: [], fallbackRequired: false },
          overallIssues: [],
          recommendations: []
        }
      }

      const compatibility = validateSpacingCompatibility(mockDynamicSpacingResult)

      expect(compatibility.isCompatible).toBe(true)
      expect(compatibility.issues).toHaveLength(0)
    })
  })

  describe('常量和配置', () => {
    it('应该导出正确的间距常量', () => {
      expect(cardAreaSpacingConstants.complexityThresholds).toEqual({
        mobile: 4,
        tablet: 5,
        desktop: 5
      })

      expect(cardAreaSpacingConstants.complexityMultiplier).toEqual({
        simple: 1.0,
        complex: 1.1
      })

      expect(cardAreaSpacingConstants.compatibilityTolerance).toBe(8)
    })
  })

  describe('边界情况', () => {
    it('应该处理未启用卡牌区域间距的情况', () => {
      const { result } = renderHook(() => useDynamicSpacing({
        containerWidth: 1200,
        cardCount: 8,
        enableCardAreaSpacing: false
      }))

      expect(result.current.cardAreaSpacing).toBeUndefined()
      expect(result.current.cssClasses.cardArea).toBeUndefined()
      expect(result.current.spacing.cardArea).toBeUndefined()
    })

    it('应该处理零卡牌数量', () => {
      const { result } = renderHook(() => useDynamicSpacing({
        containerWidth: 1200,
        cardCount: 0,
        enableCardAreaSpacing: true
      }))

      expect(result.current.layoutComplexity).toBe('simple')
    })

    it('应该处理极小容器尺寸', () => {
      const { result } = renderHook(() => useDynamicSpacing({
        containerWidth: 200,
        containerHeight: 300,
        cardCount: 6,
        enableCardAreaSpacing: true,
        enableValidation: true
      }))

      expect(result.current.deviceType).toBe('mobile')
      expect(result.current.validation?.isValid).toBeDefined()
    })

    it('应该处理大量卡牌', () => {
      const { result } = renderHook(() => useDynamicSpacing({
        containerWidth: 1920,
        cardCount: 20,
        enableCardAreaSpacing: true
      }))

      expect(result.current.layoutComplexity).toBe('complex')
      expect(result.current.cardAreaSpacing).toBeDefined()
    })
  })
})