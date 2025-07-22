// 任务3验证测试：UI元素间距和布局结构优化
import { describe, it, expect } from 'vitest'
import { getSpacingConfig, calculateUIElementSpacing, adaptiveSpacingAdjustment } from '@/lib/spacing-system'
import type { DeviceType } from '@/types'

describe('任务3: UI元素间距和布局结构优化', () => {
  describe('3.1 游戏信息面板间距调整', () => {
    it('应该确保游戏信息面板与卡牌区域有至少30px间距', () => {
      const devices: DeviceType[] = ['mobile', 'tablet', 'desktop']
      
      devices.forEach(device => {
        const spacing = calculateUIElementSpacing(device, 'gameInfo')
        expect(spacing).toBeGreaterThanOrEqual(30)
      })
    })

    it('应该在自适应调整时保持最小30px间距', () => {
      const devices: DeviceType[] = ['mobile', 'tablet', 'desktop']
      
      devices.forEach(device => {
        const adjustedConfig = adaptiveSpacingAdjustment(device, 600, 400) // 压缩场景
        expect(adjustedConfig.uiElementSpacing.gameInfo).toBeGreaterThanOrEqual(30)
      })
    })
  })

  describe('3.2 中奖结果显示间距优化', () => {
    it('应该确保中奖信息与卡牌区域有至少40px间距', () => {
      const devices: DeviceType[] = ['mobile', 'tablet', 'desktop']
      
      devices.forEach(device => {
        const spacing = calculateUIElementSpacing(device, 'resultDisplay')
        expect(spacing).toBeGreaterThanOrEqual(40)
      })
    })

    it('应该在自适应调整时保持最小40px间距', () => {
      const devices: DeviceType[] = ['mobile', 'tablet', 'desktop']
      
      devices.forEach(device => {
        const adjustedConfig = adaptiveSpacingAdjustment(device, 600, 400) // 压缩场景
        expect(adjustedConfig.uiElementSpacing.resultDisplay).toBeGreaterThanOrEqual(40)
      })
    })
  })

  describe('3.3 整体页面布局层次改进', () => {
    it('应该为不同设备提供合适的间距配置', () => {
      const mobileConfig = getSpacingConfig('mobile')
      const tabletConfig = getSpacingConfig('tablet')
      const desktopConfig = getSpacingConfig('desktop')

      // 验证间距递增趋势
      expect(mobileConfig.uiElementSpacing.gameInfo).toBeLessThanOrEqual(tabletConfig.uiElementSpacing.gameInfo)
      expect(tabletConfig.uiElementSpacing.gameInfo).toBeLessThanOrEqual(desktopConfig.uiElementSpacing.gameInfo)
      
      // 验证所有设备都满足最小间距要求
      expect(mobileConfig.uiElementSpacing.gameInfo).toBeGreaterThanOrEqual(30)
      expect(mobileConfig.uiElementSpacing.resultDisplay).toBeGreaterThanOrEqual(40)
    })

    it('应该提供清晰的UI层次结构', () => {
      const devices: DeviceType[] = ['mobile', 'tablet', 'desktop']
      
      devices.forEach(device => {
        const config = getSpacingConfig(device)
        
        // 验证间距配置的合理性
        expect(config.uiElementSpacing.gameInfo).toBeGreaterThan(config.uiElementSpacing.gameStatus)
        expect(config.uiElementSpacing.resultDisplay).toBeGreaterThan(config.uiElementSpacing.warnings)
        expect(config.uiElementSpacing.cardArea).toBeGreaterThan(config.uiElementSpacing.gameStatus)
      })
    })
  })

  describe('响应式间距调整', () => {
    it('应该根据设备类型提供不同的间距值', () => {
      const mobileSpacing = calculateUIElementSpacing('mobile', 'gameInfo')
      const tabletSpacing = calculateUIElementSpacing('tablet', 'gameInfo')
      const desktopSpacing = calculateUIElementSpacing('desktop', 'gameInfo')

      expect(mobileSpacing).toBe(30)
      expect(tabletSpacing).toBe(32)
      expect(desktopSpacing).toBe(36)
    })

    it('应该在压缩情况下保持关键间距', () => {
      const device: DeviceType = 'mobile'
      const adjustedConfig = adaptiveSpacingAdjustment(device, 800, 500)
      
      // 关键间距应该保持最小值
      expect(adjustedConfig.uiElementSpacing.gameInfo).toBeGreaterThanOrEqual(30)
      expect(adjustedConfig.uiElementSpacing.resultDisplay).toBeGreaterThanOrEqual(40)
    })
  })
})