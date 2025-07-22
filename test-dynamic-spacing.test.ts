// 动态间距计算系统测试
import { describe, it, expect } from 'vitest'
import {
  getSpacingConfig,
  calculateResponsiveSpacing,
  calculateUIElementSpacing,
  calculateContainerPadding,
  generateDynamicSpacingClasses,
  validateUIElementSpacing,
  adaptiveSpacingAdjustment,
  getSpacingDebugInfo
} from '@/lib/spacing-system'
import type { DeviceType } from '@/types'

describe('动态间距计算系统', () => {
  describe('getSpacingConfig', () => {
    it('应该返回移动端间距配置', () => {
      const config = getSpacingConfig('mobile')
      expect(config.baseUnit).toBe(4)
      expect(config.containerPadding.x).toBe(16)
      expect(config.containerPadding.y).toBe(16)
      expect(config.componentSpacing.md).toBe(12)
    })

    it('应该返回平板端间距配置', () => {
      const config = getSpacingConfig('tablet')
      expect(config.baseUnit).toBe(4)
      expect(config.containerPadding.x).toBe(24)
      expect(config.containerPadding.y).toBe(24)
      expect(config.componentSpacing.md).toBe(16)
    })

    it('应该返回桌面端间距配置', () => {
      const config = getSpacingConfig('desktop')
      expect(config.baseUnit).toBe(4)
      expect(config.containerPadding.x).toBe(32)
      expect(config.containerPadding.y).toBe(32)
      expect(config.componentSpacing.md).toBe(16)
    })
  })

  describe('calculateResponsiveSpacing', () => {
    it('应该根据设备类型计算响应式间距', () => {
      expect(calculateResponsiveSpacing('mobile', 'md')).toBe(12)
      expect(calculateResponsiveSpacing('tablet', 'md')).toBe(16)
      expect(calculateResponsiveSpacing('desktop', 'md')).toBe(16)
    })

    it('应该支持不同的间距尺寸', () => {
      expect(calculateResponsiveSpacing('mobile', 'xs')).toBe(4)
      expect(calculateResponsiveSpacing('mobile', 'sm')).toBe(8)
      expect(calculateResponsiveSpacing('mobile', 'lg')).toBe(16)
      expect(calculateResponsiveSpacing('mobile', 'xl')).toBe(20)
      expect(calculateResponsiveSpacing('mobile', 'xxl')).toBe(24)
    })
  })

  describe('calculateUIElementSpacing', () => {
    it('应该计算UI元素间距', () => {
      expect(calculateUIElementSpacing('mobile', 'gameInfo')).toBe(12)
      expect(calculateUIElementSpacing('tablet', 'gameInfo')).toBe(16)
      expect(calculateUIElementSpacing('desktop', 'gameInfo')).toBe(24)
    })

    it('应该支持所有UI元素类型', () => {
      const deviceType: DeviceType = 'mobile'
      expect(calculateUIElementSpacing(deviceType, 'gameStatus')).toBe(8)
      expect(calculateUIElementSpacing(deviceType, 'startButton')).toBe(16)
      expect(calculateUIElementSpacing(deviceType, 'warnings')).toBe(8)
      expect(calculateUIElementSpacing(deviceType, 'resultDisplay')).toBe(12)
      expect(calculateUIElementSpacing(deviceType, 'cardArea')).toBe(20)
    })
  })

  describe('calculateContainerPadding', () => {
    it('应该计算容器内边距', () => {
      const padding = calculateContainerPadding('mobile')
      expect(padding.x).toBe(16)
      expect(padding.y).toBe(16)
      expect(padding.horizontal).toBe('16px')
      expect(padding.vertical).toBe('16px')
      expect(padding.all).toBe('16px 16px')
    })

    it('应该为不同设备返回不同的内边距', () => {
      const mobilePadding = calculateContainerPadding('mobile')
      const tabletPadding = calculateContainerPadding('tablet')
      const desktopPadding = calculateContainerPadding('desktop')

      expect(mobilePadding.x).toBeLessThan(tabletPadding.x)
      expect(tabletPadding.x).toBeLessThan(desktopPadding.x)
    })
  })

  describe('generateDynamicSpacingClasses', () => {
    it('应该生成容器间距CSS类名', () => {
      const classes = generateDynamicSpacingClasses('mobile', 'container')
      expect(classes.padding).toContain('p-[16px]')
      expect(classes.paddingX).toContain('px-[16px]')
      expect(classes.paddingY).toContain('py-[16px]')
    })

    it('应该生成组件间距CSS类名', () => {
      const classes = generateDynamicSpacingClasses('mobile', 'component')
      expect(classes.spaceY).toContain('space-y-[12px]')
      expect(classes.gap).toContain('gap-[12px]')
      expect(classes.marginBottom).toContain('mb-[16px]')
    })

    it('应该生成UI元素间距CSS类名', () => {
      const classes = generateDynamicSpacingClasses('mobile', 'ui-element')
      expect(classes.gameInfo).toContain('mb-[12px]')
      expect(classes.gameStatus).toContain('mb-[8px]')
      expect(classes.startButton).toContain('mb-[16px]')
    })
  })

  describe('validateUIElementSpacing', () => {
    it('应该验证间距配置是否合理', () => {
      const result = validateUIElementSpacing('mobile', 800, {
        hasGameInfo: true,
        hasWarnings: false,
        hasStartButton: true,
        hasResultDisplay: false,
        cardAreaMinHeight: 300
      })

      expect(result.isValid).toBe(true)
      expect(Array.isArray(result.warnings)).toBe(true)
      expect(Array.isArray(result.errors)).toBe(true)
      expect(Array.isArray(result.recommendations)).toBe(true)
    })

    it('应该检测容器高度不足的情况', () => {
      const result = validateUIElementSpacing('mobile', 200, {
        hasGameInfo: true,
        hasWarnings: true,
        hasStartButton: true,
        hasResultDisplay: true,
        cardAreaMinHeight: 300
      })

      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors[0]).toContain('容器高度不足')
    })

    it('应该为不同设备提供不同的验证结果', () => {
      const mobileResult = validateUIElementSpacing('mobile', 600, {})
      const desktopResult = validateUIElementSpacing('desktop', 600, {})

      // 桌面端通常需要更多空间，所以在相同容器高度下可能有不同的验证结果
      expect(mobileResult.isValid).toBe(true)
      expect(desktopResult.isValid).toBe(true)
    })
  })

  describe('adaptiveSpacingAdjustment', () => {
    it('应该在空间充足时返回基础配置', () => {
      const baseConfig = getSpacingConfig('mobile')
      const adjustedConfig = adaptiveSpacingAdjustment('mobile', 800, 700)

      expect(adjustedConfig).toEqual(baseConfig)
    })

    it('应该在空间不足时压缩间距', () => {
      const baseConfig = getSpacingConfig('mobile')
      const adjustedConfig = adaptiveSpacingAdjustment('mobile', 800, 400)

      expect(adjustedConfig.uiElementSpacing.gameInfo).toBeLessThan(baseConfig.uiElementSpacing.gameInfo)
      expect(adjustedConfig.containerPadding.x).toBeLessThan(baseConfig.containerPadding.x)
      expect(adjustedConfig.containerPadding.y).toBeLessThan(baseConfig.containerPadding.y)
    })

    it('应该保持最小间距值', () => {
      const adjustedConfig = adaptiveSpacingAdjustment('mobile', 800, 100)

      expect(adjustedConfig.uiElementSpacing.gameInfo).toBeGreaterThanOrEqual(8)
      expect(adjustedConfig.uiElementSpacing.gameStatus).toBeGreaterThanOrEqual(4)
      expect(adjustedConfig.containerPadding.x).toBeGreaterThanOrEqual(8)
      expect(adjustedConfig.containerPadding.y).toBeGreaterThanOrEqual(8)
    })
  })

  describe('getSpacingDebugInfo', () => {
    it('应该生成调试信息字符串', () => {
      const debugInfo = getSpacingDebugInfo('mobile')
      
      expect(debugInfo).toContain('Device: mobile')
      expect(debugInfo).toContain('Base Unit: 4px')
      expect(debugInfo).toContain('Container Padding: 16x16px')
      expect(debugInfo).toContain('Component Spacing: 12px')
    })

    it('应该支持自定义配置的调试信息', () => {
      const customConfig = getSpacingConfig('desktop')
      const debugInfo = getSpacingDebugInfo('desktop', customConfig)
      
      expect(debugInfo).toContain('Device: desktop')
      expect(debugInfo).toContain('Base Unit: 4px')
      expect(debugInfo).toContain('Container Padding: 32x32px')
    })
  })

  describe('边界情况测试', () => {
    it('应该处理极小的容器尺寸', () => {
      const result = validateUIElementSpacing('mobile', 50, {
        hasGameInfo: true,
        cardAreaMinHeight: 300
      })

      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('应该处理极大的容器尺寸', () => {
      const result = validateUIElementSpacing('desktop', 2000, {
        hasGameInfo: true,
        hasWarnings: true,
        hasStartButton: true,
        hasResultDisplay: true
      })

      expect(result.isValid).toBe(true)
    })

    it('应该处理所有UI元素都启用的情况', () => {
      const result = validateUIElementSpacing('tablet', 1000, {
        hasGameInfo: true,
        hasWarnings: true,
        hasStartButton: true,
        hasResultDisplay: true,
        cardAreaMinHeight: 400
      })

      expect(result.isValid).toBe(true)
    })
  })
})