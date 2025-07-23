/**
 * Task 11 测试：卡牌布局优化集成测试
 * 测试完整的卡牌布局，包括6、8、10张卡牌在不同设备类型上的表现
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import {
  validateAllSpacing,
  validateSpacingMeasurements,
  getCardAreaSpacing,
  getSpacingConfig
} from '@/lib/spacing-system'
import {
  useDynamicSpacing,
  useCardGameSpacing
} from '@/hooks/use-dynamic-spacing'
import type { DeviceType } from '@/types'

describe('Task 11: 卡牌布局优化集成测试', () => {
  beforeEach(() => {
    // 确保每个测试都有干净的环境
  })

  describe('完整卡牌布局测试', () => {
    const cardCounts = [6, 8, 10]
    const deviceTypes: DeviceType[] = ['mobile', 'tablet', 'desktop']
    const containerSizes = {
      mobile: { width: 375, height: 667 },
      tablet: { width: 768, height: 1024 },
      desktop: { width: 1200, height: 800 }
    }

    cardCounts.forEach(cardCount => {
      deviceTypes.forEach(deviceType => {
        it(`应该为${deviceType}设备正确布局${cardCount}张卡牌`, () => {
          const { width, height } = containerSizes[deviceType]
          
          // 使用动态间距Hook进行完整的布局计算
          const { result } = renderHook(() => useCardGameSpacing({
            containerWidth: width,
            containerHeight: height,
            cardCount,
            cardsPerRow: deviceType === 'mobile' ? 3 : 5
          }))

          const spacing = result.current
          
          // 验证基本布局属性
          expect(spacing.deviceType).toBe(deviceType)
          expect(spacing.cardAreaSpacing).toBeDefined()
          expect(spacing.layoutComplexity).toBe(cardCount > (deviceType === 'mobile' ? 4 : 5) ? 'complex' : 'simple')
          
          // 验证CSS类名生成
          expect(spacing.cssClasses.cardArea).toBeDefined()
          expect(spacing.cardSpecific?.cardGrid).toBeDefined()
          expect(spacing.cardSpecific?.cardAreaStyle).toBeDefined()
          
          // 验证间距计算函数
          expect(spacing.spacing.cardArea).toBeDefined()
          expect(typeof spacing.spacing.cardArea?.containerMargins).toBe('function')
          expect(typeof spacing.spacing.cardArea?.rowSpacing).toBe('function')
          expect(typeof spacing.spacing.cardArea?.cardSpacing).toBe('function')
          
          // 验证兼容性
          expect(spacing.compatibility).toBeDefined()
          expect(typeof spacing.compatibility.isCompatible).toBe('boolean')
          expect(Array.isArray(spacing.compatibility.issues)).toBe(true)
          expect(Array.isArray(spacing.compatibility.recommendations)).toBe(true)
        })
      })
    })
  })

  describe('间距测量验证', () => {
    it('应该验证桌面端8张卡牌的间距符合要求', () => {
      const deviceType: DeviceType = 'desktop'
      const cardCount = 8
      const containerWidth = 1200
      const containerHeight = 800
      
      // 获取期望的间距配置
      const expectedSpacing = getCardAreaSpacing(deviceType)
      
      // 模拟实际测量的间距（应该与配置匹配）
      const measuredSpacing = {
        containerMargins: {
          top: expectedSpacing.containerMargins.top,
          bottom: expectedSpacing.containerMargins.bottom,
          left: expectedSpacing.containerMargins.left,
          right: expectedSpacing.containerMargins.right
        },
        rowSpacing: expectedSpacing.rowSpacing,
        cardSpacing: expectedSpacing.cardSpacing
      }
      
      // 验证测量结果
      const measurementResult = validateSpacingMeasurements(measuredSpacing, expectedSpacing, 1)
      expect(measurementResult.isValid).toBe(true)
      expect(measurementResult.discrepancies).toHaveLength(0)
      
      // 验证整体布局
      const validation = validateAllSpacing(deviceType, containerWidth, containerHeight, cardCount)
      
      // 验证卡牌区域间距是有效的或至少有合理的建议
      if (!validation.cardAreaValidation.isValid) {
        expect(validation.cardAreaValidation.recommendations.length).toBeGreaterThan(0)
      } else {
        expect(validation.cardAreaValidation.isValid).toBe(true)
      }
    })

    it('应该验证平板端6张卡牌的间距符合要求', () => {
      const deviceType: DeviceType = 'tablet'
      const cardCount = 6
      const containerWidth = 768
      const containerHeight = 1024
      
      const expectedSpacing = getCardAreaSpacing(deviceType)
      
      // 验证最小间距要求
      expect(expectedSpacing.containerMargins.left).toBeGreaterThanOrEqual(24)
      expect(expectedSpacing.containerMargins.right).toBeGreaterThanOrEqual(24)
      expect(expectedSpacing.containerMargins.top).toBeGreaterThanOrEqual(20)
      expect(expectedSpacing.containerMargins.bottom).toBeGreaterThanOrEqual(20)
      expect(expectedSpacing.rowSpacing).toBeGreaterThanOrEqual(16)
      expect(expectedSpacing.cardSpacing).toBeGreaterThanOrEqual(14)
      
      // 验证整体布局
      const validation = validateAllSpacing(deviceType, containerWidth, containerHeight, cardCount)
      
      // 验证布局是有效的或至少有合理的建议
      if (!validation.isValid) {
        expect(validation.recommendations.length).toBeGreaterThan(0)
      } else {
        expect(validation.isValid).toBe(true)
      }
    })

    it('应该验证移动端10张卡牌的间距符合要求', () => {
      const deviceType: DeviceType = 'mobile'
      const cardCount = 10
      const containerWidth = 375
      const containerHeight = 667
      
      const expectedSpacing = getCardAreaSpacing(deviceType)
      
      // 验证最小间距要求
      expect(expectedSpacing.containerMargins.left).toBeGreaterThanOrEqual(16)
      expect(expectedSpacing.containerMargins.right).toBeGreaterThanOrEqual(16)
      expect(expectedSpacing.containerMargins.top).toBeGreaterThanOrEqual(16)
      expect(expectedSpacing.containerMargins.bottom).toBeGreaterThanOrEqual(16)
      expect(expectedSpacing.rowSpacing).toBeGreaterThanOrEqual(12)
      expect(expectedSpacing.cardSpacing).toBeGreaterThanOrEqual(12)
      
      // 对于移动端的大量卡牌，可能需要降级处理
      const validation = validateAllSpacing(deviceType, containerWidth, containerHeight, cardCount)
      
      // 验证至少有合理的建议或处理方案
      if (!validation.isValid) {
        expect(validation.recommendations.length).toBeGreaterThan(0)
      }
    })
  })

  describe('布局平衡和行居中功能测试', () => {
    it('应该正确处理不均匀行分布的卡牌布局', () => {
      // 测试7张卡牌：第一行5张，第二行2张
      const { result } = renderHook(() => useCardGameSpacing({
        containerWidth: 1200,
        containerHeight: 800,
        cardCount: 7,
        cardsPerRow: 5
      }))

      const spacing = result.current
      
      expect(spacing.layoutComplexity).toBe('complex')
      expect(spacing.cardAreaSpacing).toBeDefined()
      
      // 验证CSS类名包含居中逻辑
      const cardAreaClasses = spacing.cssClasses.cardArea
      expect(cardAreaClasses).toBeDefined()
      expect(cardAreaClasses?.cardGrid).toContain('gap-x-')
      expect(cardAreaClasses?.cardGrid).toContain('gap-y-')
      
      // 验证间距计算
      const margins = spacing.spacing.cardArea?.containerMargins()
      expect(margins).toBeDefined()
      expect(margins?.top).toBeGreaterThan(0)
      expect(margins?.bottom).toBeGreaterThan(0)
      expect(margins?.left).toBeGreaterThan(0)
      expect(margins?.right).toBeGreaterThan(0)
    })

    it('应该为移动端处理3列布局的行居中', () => {
      // 测试移动端5张卡牌：第一行3张，第二行2张
      const { result } = renderHook(() => useCardGameSpacing({
        containerWidth: 375,
        containerHeight: 667,
        cardCount: 5,
        cardsPerRow: 3
      }))

      const spacing = result.current
      
      expect(spacing.deviceType).toBe('mobile')
      expect(spacing.layoutComplexity).toBe('complex')
      
      // 验证移动端特定的间距调整
      const cardAreaSpacing = spacing.cardAreaSpacing
      expect(cardAreaSpacing?.containerMargins.left).toBe(16)
      expect(cardAreaSpacing?.containerMargins.right).toBe(16)
      expect(cardAreaSpacing?.rowSpacing).toBe(12)
      expect(cardAreaSpacing?.cardSpacing).toBe(12)
    })

    it('应该验证多行布局的垂直居中', () => {
      const deviceTypes: DeviceType[] = ['mobile', 'tablet', 'desktop']
      
      deviceTypes.forEach(deviceType => {
        const containerSizes = {
          mobile: { width: 375, height: 667 },
          tablet: { width: 768, height: 1024 },
          desktop: { width: 1200, height: 800 }
        }
        
        const { width, height } = containerSizes[deviceType]
        
        const { result } = renderHook(() => useCardGameSpacing({
          containerWidth: width,
          containerHeight: height,
          cardCount: 8
        }))

        const spacing = result.current
        const validation = validateAllSpacing(deviceType, width, height, 8)
        
        // 验证布局是否合理
        expect(spacing.cardAreaSpacing).toBeDefined()
        
        // 对于合理尺寸的容器，布局应该是有效的
        if (width >= 375 && height >= 600) {
          expect(validation.cardAreaValidation.fallbackRequired).toBe(false)
        }
      })
    })
  })

  describe('响应式行为测试', () => {
    it('应该在屏幕尺寸变化时正确调整布局', () => {
      const screenSizes = [
        { width: 320, height: 568, expectedDevice: 'mobile' as DeviceType },
        { width: 375, height: 667, expectedDevice: 'mobile' as DeviceType },
        { width: 768, height: 1024, expectedDevice: 'tablet' as DeviceType },
        { width: 1023, height: 768, expectedDevice: 'tablet' as DeviceType },
        { width: 1200, height: 800, expectedDevice: 'desktop' as DeviceType },
        { width: 1920, height: 1080, expectedDevice: 'desktop' as DeviceType }
      ]

      screenSizes.forEach(({ width, height, expectedDevice }) => {
        const { result } = renderHook(() => useDynamicSpacing({
          containerWidth: width,
          containerHeight: height,
          cardCount: 6,
          enableCardAreaSpacing: true,
          enableValidation: true
        }))

        const spacing = result.current
        
        expect(spacing.deviceType).toBe(expectedDevice)
        expect(spacing.cardAreaSpacing).toBeDefined()
        
        // 验证间距配置随设备类型正确调整
        const cardAreaSpacing = spacing.cardAreaSpacing!
        
        if (expectedDevice === 'mobile') {
          expect(cardAreaSpacing.containerMargins.left).toBe(16)
          expect(cardAreaSpacing.rowSpacing).toBe(12)
          expect(cardAreaSpacing.cardSpacing).toBe(12)
        } else if (expectedDevice === 'tablet') {
          expect(cardAreaSpacing.containerMargins.left).toBe(24)
          expect(cardAreaSpacing.rowSpacing).toBe(16)
          expect(cardAreaSpacing.cardSpacing).toBe(14)
        } else {
          expect(cardAreaSpacing.containerMargins.left).toBe(32)
          expect(cardAreaSpacing.rowSpacing).toBe(20)
          expect(cardAreaSpacing.cardSpacing).toBe(16)
        }
      })
    })

    it('应该在设备类型边界处正确切换', () => {
      // 测试设备类型切换的边界值
      const boundaryTests = [
        { width: 767, expectedDevice: 'mobile' as DeviceType },
        { width: 768, expectedDevice: 'tablet' as DeviceType },
        { width: 1023, expectedDevice: 'tablet' as DeviceType },
        { width: 1024, expectedDevice: 'desktop' as DeviceType }
      ]

      boundaryTests.forEach(({ width, expectedDevice }) => {
        const { result } = renderHook(() => useDynamicSpacing({
          containerWidth: width,
          containerHeight: 800,
          cardCount: 6,
          enableCardAreaSpacing: true
        }))

        expect(result.current.deviceType).toBe(expectedDevice)
      })
    })

    it('应该处理极端屏幕尺寸的响应式调整', () => {
      // 超宽屏幕
      const { result: ultraWide } = renderHook(() => useCardGameSpacing({
        containerWidth: 2560,
        containerHeight: 1080,
        cardCount: 10
      }))

      expect(ultraWide.current.deviceType).toBe('desktop')
      expect(ultraWide.current.cardAreaSpacing).toBeDefined()
      
      // 超小屏幕
      const { result: ultraSmall } = renderHook(() => useCardGameSpacing({
        containerWidth: 280,
        containerHeight: 480,
        cardCount: 4
      }))

      expect(ultraSmall.current.deviceType).toBe('mobile')
      
      // 验证小屏幕有适当的警告或建议
      if (ultraSmall.current.validation && !ultraSmall.current.validation.isValid) {
        expect(ultraSmall.current.validation.recommendations.length).toBeGreaterThan(0)
      }
    })
  })

  describe('性能和兼容性集成测试', () => {
    it('应该在频繁布局更新时保持性能', () => {
      const cardCounts = [4, 6, 8, 10, 12]
      const startTime = performance.now()
      
      cardCounts.forEach(cardCount => {
        const { result } = renderHook(() => useCardGameSpacing({
          containerWidth: 1200,
          containerHeight: 800,
          cardCount,
          useCache: true
        }))
        
        expect(result.current.cardAreaSpacing).toBeDefined()
        expect(result.current.compatibility.isCompatible).toBeDefined()
      })
      
      const endTime = performance.now()
      const executionTime = endTime - startTime
      
      // 验证执行时间在合理范围内（应该很快）
      expect(executionTime).toBeLessThan(100) // 100ms内完成
    })

    it('应该验证间距系统的整体兼容性', () => {
      const testConfigurations = [
        { device: 'mobile' as DeviceType, width: 375, height: 667, cards: 6 },
        { device: 'tablet' as DeviceType, width: 768, height: 1024, cards: 8 },
        { device: 'desktop' as DeviceType, width: 1200, height: 800, cards: 10 }
      ]

      testConfigurations.forEach(({ device, width, height, cards }) => {
        const { result } = renderHook(() => useCardGameSpacing({
          containerWidth: width,
          containerHeight: height,
          cardCount: cards
        }))

        const spacing = result.current
        
        // 验证基本兼容性
        expect(spacing.compatibility.isCompatible).toBeDefined()
        
        // 验证间距配置的一致性
        const spacingConfig = spacing.spacingConfig
        const cardAreaSpacing = spacing.cardAreaSpacing!
        
        // UI元素间距应该与卡牌区域间距兼容
        const gameInfoSpacing = spacingConfig.uiElementSpacing.gameInfo
        const cardAreaTopMargin = cardAreaSpacing.containerMargins.top
        
        // 差异不应该太大（在兼容性容差范围内）
        const difference = Math.abs(gameInfoSpacing - cardAreaTopMargin)
        expect(difference).toBeLessThanOrEqual(8) // 8px容差
      })
    })

    it('应该处理复杂的多设备场景', () => {
      // 模拟用户在不同设备间切换的场景
      const deviceSequence = [
        { width: 375, height: 667, device: 'mobile' as DeviceType },
        { width: 768, height: 1024, device: 'tablet' as DeviceType },
        { width: 1200, height: 800, device: 'desktop' as DeviceType },
        { width: 375, height: 667, device: 'mobile' as DeviceType } // 回到移动端
      ]

      let previousSpacing: any = null
      
      deviceSequence.forEach(({ width, height, device }, index) => {
        const { result } = renderHook(() => useCardGameSpacing({
          containerWidth: width,
          containerHeight: height,
          cardCount: 8
        }))

        const currentSpacing = result.current
        
        expect(currentSpacing.deviceType).toBe(device)
        expect(currentSpacing.cardAreaSpacing).toBeDefined()
        
        // 验证设备切换时的一致性
        if (previousSpacing && previousSpacing.deviceType === currentSpacing.deviceType) {
          expect(currentSpacing.cardAreaSpacing).toEqual(previousSpacing.cardAreaSpacing)
        }
        
        previousSpacing = currentSpacing
      })
    })
  })
})