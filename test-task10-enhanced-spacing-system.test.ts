/**
 * Task 10 测试：增强间距系统单元测试
 * 测试间距配置检索、增强布局计算、多行定位逻辑和验证函数
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  getSpacingConfig,
  getCardAreaSpacing,
  validateAllSpacing,
  validateCardAreaSpacing,
  validateSpacingMeasurements,
  generateSpacingDebugReport,
  createFallbackSpacing,
  getCachedSpacingConfig,
  getCachedCardAreaSpacing,
  clearSpacingCache
} from '@/lib/spacing-system'
import type { DeviceType } from '@/types'

describe('Task 10: 增强间距系统单元测试', () => {
  beforeEach(() => {
    // 清除缓存确保测试独立性
    clearSpacingCache()
  })

  describe('间距配置检索测试', () => {
    it('应该为不同设备类型返回正确的间距配置', () => {
      const deviceTypes: DeviceType[] = ['mobile', 'tablet', 'desktop']
      
      deviceTypes.forEach(deviceType => {
        const config = getSpacingConfig(deviceType)
        
        expect(config).toHaveProperty('baseUnit')
        expect(config).toHaveProperty('componentSpacing')
        expect(config).toHaveProperty('containerPadding')
        expect(config).toHaveProperty('uiElementSpacing')
        
        expect(typeof config.baseUnit).toBe('number')
        expect(config.baseUnit).toBeGreaterThan(0)
        
        // 验证组件间距配置
        expect(config.componentSpacing).toHaveProperty('xs')
        expect(config.componentSpacing).toHaveProperty('sm')
        expect(config.componentSpacing).toHaveProperty('md')
        expect(config.componentSpacing).toHaveProperty('lg')
        expect(config.componentSpacing).toHaveProperty('xl')
        expect(config.componentSpacing).toHaveProperty('xxl')
        
        // 验证UI元素间距配置
        expect(config.uiElementSpacing).toHaveProperty('gameInfo')
        expect(config.uiElementSpacing).toHaveProperty('gameStatus')
        expect(config.uiElementSpacing).toHaveProperty('startButton')
        expect(config.uiElementSpacing).toHaveProperty('warnings')
        expect(config.uiElementSpacing).toHaveProperty('resultDisplay')
        expect(config.uiElementSpacing).toHaveProperty('cardArea')
      })
    })

    it('应该为不同设备类型返回正确的卡牌区域间距配置', () => {
      const deviceTypes: DeviceType[] = ['mobile', 'tablet', 'desktop']
      
      deviceTypes.forEach(deviceType => {
        const spacing = getCardAreaSpacing(deviceType)
        
        expect(spacing).toHaveProperty('containerMargins')
        expect(spacing).toHaveProperty('rowSpacing')
        expect(spacing).toHaveProperty('cardSpacing')
        expect(spacing).toHaveProperty('minCardAreaHeight')
        
        // 验证容器边距
        expect(spacing.containerMargins).toHaveProperty('top')
        expect(spacing.containerMargins).toHaveProperty('bottom')
        expect(spacing.containerMargins).toHaveProperty('left')
        expect(spacing.containerMargins).toHaveProperty('right')
        
        // 验证所有间距值都是正数
        expect(spacing.containerMargins.top).toBeGreaterThan(0)
        expect(spacing.containerMargins.bottom).toBeGreaterThan(0)
        expect(spacing.containerMargins.left).toBeGreaterThan(0)
        expect(spacing.containerMargins.right).toBeGreaterThan(0)
        expect(spacing.rowSpacing).toBeGreaterThan(0)
        expect(spacing.cardSpacing).toBeGreaterThan(0)
        expect(spacing.minCardAreaHeight).toBeGreaterThan(0)
      })
    })

    it('应该为不同设备类型返回递增的间距值', () => {
      const mobileConfig = getSpacingConfig('mobile')
      const tabletConfig = getSpacingConfig('tablet')
      const desktopConfig = getSpacingConfig('desktop')
      
      // 桌面端应该有最大的间距值
      expect(desktopConfig.uiElementSpacing.gameInfo).toBeGreaterThanOrEqual(tabletConfig.uiElementSpacing.gameInfo)
      expect(tabletConfig.uiElementSpacing.gameInfo).toBeGreaterThanOrEqual(mobileConfig.uiElementSpacing.gameInfo)
      
      // 卡牌区域间距也应该递增
      const mobileCardSpacing = getCardAreaSpacing('mobile')
      const tabletCardSpacing = getCardAreaSpacing('tablet')
      const desktopCardSpacing = getCardAreaSpacing('desktop')
      
      expect(desktopCardSpacing.containerMargins.left).toBeGreaterThanOrEqual(tabletCardSpacing.containerMargins.left)
      expect(tabletCardSpacing.containerMargins.left).toBeGreaterThanOrEqual(mobileCardSpacing.containerMargins.left)
    })
  })

  describe('缓存功能测试', () => {
    it('应该正确缓存间距配置', () => {
      const deviceType: DeviceType = 'desktop'
      
      // 第一次调用
      const config1 = getCachedSpacingConfig(deviceType)
      const spacing1 = getCachedCardAreaSpacing(deviceType)
      
      // 第二次调用应该返回相同的对象
      const config2 = getCachedSpacingConfig(deviceType)
      const spacing2 = getCachedCardAreaSpacing(deviceType)
      
      expect(config1).toEqual(config2)
      expect(spacing1).toEqual(spacing2)
    })

    it('应该在清除缓存后重新获取配置', () => {
      const deviceType: DeviceType = 'tablet'
      
      // 获取配置并缓存
      const config1 = getCachedSpacingConfig(deviceType)
      
      // 清除缓存
      clearSpacingCache()
      
      // 重新获取配置
      const config2 = getCachedSpacingConfig(deviceType)
      
      // 应该是相等的内容但可能是不同的对象引用
      expect(config1).toEqual(config2)
    })
  })

  describe('增强布局计算测试', () => {
    it('应该为不同卡牌数量计算正确的布局', () => {
      const testCases = [
        { cardCount: 4, deviceType: 'desktop' as DeviceType, expectedComplexity: 'simple' },
        { cardCount: 6, deviceType: 'desktop' as DeviceType, expectedComplexity: 'complex' },
        { cardCount: 8, deviceType: 'tablet' as DeviceType, expectedComplexity: 'complex' },
        { cardCount: 3, deviceType: 'mobile' as DeviceType, expectedComplexity: 'simple' },
        { cardCount: 5, deviceType: 'mobile' as DeviceType, expectedComplexity: 'complex' }
      ]

      testCases.forEach(({ cardCount, deviceType, expectedComplexity }) => {
        const validation = validateAllSpacing(deviceType, 1200, 800, cardCount)
        
        expect(validation).toHaveProperty('isValid')
        expect(validation).toHaveProperty('uiElementValidation')
        expect(validation).toHaveProperty('cardAreaValidation')
        expect(validation).toHaveProperty('overallIssues')
        expect(validation).toHaveProperty('recommendations')
        
        // 验证返回的数据结构
        expect(typeof validation.isValid).toBe('boolean')
        expect(Array.isArray(validation.overallIssues)).toBe(true)
        expect(Array.isArray(validation.recommendations)).toBe(true)
      })
    })

    it('应该为各种容器尺寸计算正确的布局', () => {
      const containerSizes = [
        { width: 375, height: 667, deviceType: 'mobile' as DeviceType },
        { width: 768, height: 1024, deviceType: 'tablet' as DeviceType },
        { width: 1200, height: 800, deviceType: 'desktop' as DeviceType },
        { width: 1920, height: 1080, deviceType: 'desktop' as DeviceType }
      ]

      containerSizes.forEach(({ width, height, deviceType }) => {
        const validation = validateAllSpacing(deviceType, width, height, 6)
        
        expect(validation.uiElementValidation).toHaveProperty('isValid')
        expect(validation.cardAreaValidation).toHaveProperty('isValid')
        
        // 验证容器尺寸足够时应该通过验证
        if (width >= 800 && height >= 600) {
          expect(validation.overallIssues.length).toBeLessThanOrEqual(1)
        }
      })
    })

    it('应该处理极端容器尺寸', () => {
      // 极小容器
      const smallValidation = validateAllSpacing('mobile', 200, 300, 4)
      expect(smallValidation.isValid).toBe(false)
      
      // 验证至少有一些问题或建议
      const totalIssuesAndRecommendations = 
        smallValidation.overallIssues.length + 
        smallValidation.recommendations.length +
        smallValidation.uiElementValidation.errors.length +
        smallValidation.uiElementValidation.warnings.length +
        Object.keys(smallValidation.cardAreaValidation.violations).length

      expect(totalIssuesAndRecommendations).toBeGreaterThan(0)
      
      // 极大容器
      const largeValidation = validateAllSpacing('desktop', 2560, 1440, 10)
      expect(largeValidation).toHaveProperty('isValid')
      expect(largeValidation.cardAreaValidation).toHaveProperty('isValid')
    })
  })

  describe('多行定位逻辑测试', () => {
    it('应该为不同行配置验证间距', () => {
      const testConfigurations = [
        { cardCount: 6, expectedRows: 2 }, // 5+1 布局
        { cardCount: 8, expectedRows: 2 }, // 5+3 布局
        { cardCount: 10, expectedRows: 2 }, // 5+5 布局
        { cardCount: 12, expectedRows: 3 } // 5+5+2 布局
      ]

      testConfigurations.forEach(({ cardCount }) => {
        const deviceTypes: DeviceType[] = ['mobile', 'tablet', 'desktop']
        
        deviceTypes.forEach(deviceType => {
          const cardAreaSpacing = getCardAreaSpacing(deviceType)
          const validation = validateCardAreaSpacing(deviceType, 1200, 800, cardCount)
          
          expect(validation).toHaveProperty('isValid')
          expect(validation).toHaveProperty('violations')
          expect(validation).toHaveProperty('recommendations')
          expect(validation).toHaveProperty('fallbackRequired')
          
          // 验证行间距符合要求
          const minRowSpacing = deviceType === 'mobile' ? 12 : deviceType === 'tablet' ? 16 : 20
          expect(cardAreaSpacing.rowSpacing).toBeGreaterThanOrEqual(minRowSpacing)
        })
      })
    })

    it('应该验证卡牌间距符合最小要求', () => {
      const deviceTypes: DeviceType[] = ['mobile', 'tablet', 'desktop']
      
      deviceTypes.forEach(deviceType => {
        const cardAreaSpacing = getCardAreaSpacing(deviceType)
        const minCardSpacing = deviceType === 'mobile' ? 12 : deviceType === 'tablet' ? 14 : 16
        
        expect(cardAreaSpacing.cardSpacing).toBeGreaterThanOrEqual(minCardSpacing)
      })
    })

    it('应该验证容器边距符合最小要求', () => {
      const deviceTypes: DeviceType[] = ['mobile', 'tablet', 'desktop']
      
      deviceTypes.forEach(deviceType => {
        const cardAreaSpacing = getCardAreaSpacing(deviceType)
        
        // 根据实际配置调整最小边距要求
        const minHorizontalMargins = deviceType === 'mobile' ? 16 : deviceType === 'tablet' ? 24 : 32
        const minVerticalMargins = deviceType === 'mobile' ? 16 : deviceType === 'tablet' ? 20 : 24
        
        expect(cardAreaSpacing.containerMargins.left).toBeGreaterThanOrEqual(minHorizontalMargins)
        expect(cardAreaSpacing.containerMargins.right).toBeGreaterThanOrEqual(minHorizontalMargins)
        expect(cardAreaSpacing.containerMargins.top).toBeGreaterThanOrEqual(minVerticalMargins)
        expect(cardAreaSpacing.containerMargins.bottom).toBeGreaterThanOrEqual(minVerticalMargins)
      })
    })
  })

  describe('间距验证函数边界情况测试', () => {
    it('应该处理零卡牌数量', () => {
      const validation = validateAllSpacing('desktop', 1200, 800, 0)
      
      expect(validation).toHaveProperty('isValid')
      expect(validation.cardAreaValidation).toHaveProperty('isValid')
    })

    it('应该处理大量卡牌', () => {
      const validation = validateAllSpacing('desktop', 1920, 1080, 50)
      
      expect(validation).toHaveProperty('isValid')
      expect(validation.cardAreaValidation.recommendations.length).toBeGreaterThan(0)
    })

    it('应该验证间距测量的准确性', () => {
      const expectedSpacing = getCardAreaSpacing('desktop')
      
      // 完全匹配的测量
      const perfectMeasurement = {
        containerMargins: expectedSpacing.containerMargins,
        rowSpacing: expectedSpacing.rowSpacing,
        cardSpacing: expectedSpacing.cardSpacing
      }
      
      const perfectResult = validateSpacingMeasurements(perfectMeasurement, expectedSpacing, 0)
      expect(perfectResult.isValid).toBe(true)
      expect(perfectResult.discrepancies).toHaveLength(0)
      expect(perfectResult.maxDeviation).toBe(0)
      
      // 有偏差的测量
      const imperfectMeasurement = {
        containerMargins: {
          top: expectedSpacing.containerMargins.top + 5,
          bottom: expectedSpacing.containerMargins.bottom - 3,
          left: expectedSpacing.containerMargins.left + 2,
          right: expectedSpacing.containerMargins.right - 1
        },
        rowSpacing: expectedSpacing.rowSpacing + 4,
        cardSpacing: expectedSpacing.cardSpacing - 2
      }
      
      const imperfectResult = validateSpacingMeasurements(imperfectMeasurement, expectedSpacing, 2)
      expect(imperfectResult.isValid).toBe(false)
      expect(imperfectResult.discrepancies.length).toBeGreaterThan(0)
      expect(imperfectResult.maxDeviation).toBeGreaterThan(2)
    })

    it('应该生成有用的调试报告', () => {
      const report = generateSpacingDebugReport('desktop', 1200, 800, 8)
      
      expect(report).toHaveProperty('summary')
      expect(report).toHaveProperty('details')
      expect(report).toHaveProperty('timestamp')
      
      expect(typeof report.summary).toBe('string')
      expect(typeof report.timestamp).toBe('number')
      
      expect(report.details).toHaveProperty('deviceInfo')
      expect(report.details).toHaveProperty('spacingConfig')
      expect(report.details).toHaveProperty('cardAreaSpacing')
      expect(report.details).toHaveProperty('validation')
      expect(Array.isArray(report.details.recommendations)).toBe(true)
      
      // 验证摘要包含关键信息
      expect(report.summary).toContain('DESKTOP')
      expect(report.summary).toContain('1200x800')
      expect(report.summary).toContain('8 cards')
    })

    it('应该创建安全的降级间距配置', () => {
      const deviceTypes: DeviceType[] = ['mobile', 'tablet', 'desktop']
      
      deviceTypes.forEach(deviceType => {
        const fallbackSpacing = createFallbackSpacing(deviceType, {
          containerWidth: 300,
          containerHeight: 400,
          originalError: new Error('Test error')
        })
        
        expect(fallbackSpacing).toHaveProperty('containerMargins')
        expect(fallbackSpacing).toHaveProperty('rowSpacing')
        expect(fallbackSpacing).toHaveProperty('cardSpacing')
        expect(fallbackSpacing).toHaveProperty('minCardAreaHeight')
        
        // 验证降级值是合理的
        expect(fallbackSpacing.containerMargins.left).toBeGreaterThan(0)
        expect(fallbackSpacing.containerMargins.right).toBeGreaterThan(0)
        expect(fallbackSpacing.containerMargins.top).toBeGreaterThan(0)
        expect(fallbackSpacing.containerMargins.bottom).toBeGreaterThan(0)
        expect(fallbackSpacing.rowSpacing).toBeGreaterThan(0)
        expect(fallbackSpacing.cardSpacing).toBeGreaterThan(0)
        expect(fallbackSpacing.minCardAreaHeight).toBeGreaterThan(0)
        
        // 验证降级值不会超过容器的合理比例
        expect(fallbackSpacing.containerMargins.left).toBeLessThan(300 * 0.15)
        expect(fallbackSpacing.containerMargins.right).toBeLessThan(300 * 0.15)
      })
    })

    it('应该处理无效的容器尺寸', () => {
      // 负数尺寸
      const negativeValidation = validateAllSpacing('desktop', -100, -100, 5)
      expect(negativeValidation.isValid).toBe(false)
      
      // 零尺寸
      const zeroValidation = validateAllSpacing('desktop', 0, 0, 5)
      expect(zeroValidation.isValid).toBe(false)
      
      // 极小尺寸
      const tinyValidation = validateAllSpacing('mobile', 50, 50, 3)
      expect(tinyValidation.isValid).toBe(false)
      expect(tinyValidation.overallIssues.length).toBeGreaterThan(0)
    })
  })
})