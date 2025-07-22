import { describe, it, expect, beforeEach, vi } from 'vitest'
import { validateLayout, validatePositionConsistency, validateSpacingStandards } from '@/lib/layout-validator'
import { calculateOptimalLayout } from '@/lib/layout-manager'
import { useDynamicSpacing } from '@/hooks/use-dynamic-spacing'
import { CardPosition, LayoutConfig, DeviceType } from '@/types'

// Mock window dimensions for different devices
const mockDeviceConfigs = {
  mobile: {
    width: 375,
    height: 667,
    devicePixelRatio: 2
  },
  tablet: {
    width: 768,
    height: 1024,
    devicePixelRatio: 2
  },
  desktop: {
    width: 1920,
    height: 1080,
    devicePixelRatio: 1
  }
}

// Mock orientation changes
const mockOrientations = {
  portrait: { width: 375, height: 667 },
  landscape: { width: 667, height: 375 }
}

describe('Responsive Layout Tests', () => {
  beforeEach(() => {
    // Reset any global state
    vi.clearAllMocks()
  })

  describe('Device Type Layout Adaptation', () => {
    it('should adapt layout for mobile devices', () => {
      const { width, height } = mockDeviceConfigs.mobile
      const cardCount = 6
      
      // 模拟移动设备的布局计算
      const mobileLayout = calculateOptimalLayout(cardCount, width, height, 'mobile')
      
      expect(mobileLayout).toBeDefined()
      expect(mobileLayout.positions).toHaveLength(cardCount)
      
      // 验证移动设备上的卡片不会超出边界
      const validationResult = validatePositionConsistency(
        mobileLayout.positions,
        width,
        height,
        mobileLayout.cardWidth,
        mobileLayout.cardHeight
      )
      
      expect(validationResult.isValid).toBe(true)
      expect(validationResult.outOfBoundsCards).toHaveLength(0)
    })

    it('should adapt layout for tablet devices', () => {
      const { width, height } = mockDeviceConfigs.tablet
      const cardCount = 8
      
      const tabletLayout = calculateOptimalLayout(cardCount, width, height, 'tablet')
      
      expect(tabletLayout).toBeDefined()
      expect(tabletLayout.positions).toHaveLength(cardCount)
      
      // 验证平板设备上的布局
      const validationResult = validatePositionConsistency(
        tabletLayout.positions,
        width,
        height,
        tabletLayout.cardWidth,
        tabletLayout.cardHeight
      )
      
      expect(validationResult.isValid).toBe(true)
      expect(validationResult.outOfBoundsCards).toHaveLength(0)
    })

    it('should adapt layout for desktop devices', () => {
      const { width, height } = mockDeviceConfigs.desktop
      const cardCount = 10
      
      const desktopLayout = calculateOptimalLayout(cardCount, width, height, 'desktop')
      
      expect(desktopLayout).toBeDefined()
      expect(desktopLayout.positions).toHaveLength(cardCount)
      
      // 验证桌面设备上的布局
      const validationResult = validatePositionConsistency(
        desktopLayout.positions,
        width,
        height,
        desktopLayout.cardWidth,
        desktopLayout.cardHeight
      )
      
      expect(validationResult.isValid).toBe(true)
      expect(validationResult.outOfBoundsCards).toHaveLength(0)
    })
  })

  describe('Spacing Consistency Across Devices', () => {
    it('should maintain proportional spacing on different screen sizes', () => {
      const cardCount = 6
      
      // 计算不同设备的布局
      const mobileLayout = calculateOptimalLayout(
        cardCount, 
        mockDeviceConfigs.mobile.width, 
        mockDeviceConfigs.mobile.height, 
        'mobile'
      )
      
      const tabletLayout = calculateOptimalLayout(
        cardCount, 
        mockDeviceConfigs.tablet.width, 
        mockDeviceConfigs.tablet.height, 
        'tablet'
      )
      
      const desktopLayout = calculateOptimalLayout(
        cardCount, 
        mockDeviceConfigs.desktop.width, 
        mockDeviceConfigs.desktop.height, 
        'desktop'
      )
      
      // 计算间距比例
      const mobileSpacingRatio = mobileLayout.spacing.horizontal / mobileLayout.cardWidth
      const tabletSpacingRatio = tabletLayout.spacing.horizontal / tabletLayout.cardWidth
      const desktopSpacingRatio = desktopLayout.spacing.horizontal / desktopLayout.cardWidth
      
      // 验证间距比例的一致性（允许小幅差异）
      const tolerance = 0.1
      expect(Math.abs(mobileSpacingRatio - tabletSpacingRatio)).toBeLessThan(tolerance)
      expect(Math.abs(tabletSpacingRatio - desktopSpacingRatio)).toBeLessThan(tolerance)
    })

    it('should validate spacing standards across different devices', () => {
      const cardCount = 6
      
      Object.entries(mockDeviceConfigs).forEach(([deviceType, config]) => {
        const layout = calculateOptimalLayout(
          cardCount, 
          config.width, 
          config.height, 
          deviceType as DeviceType
        )
        
        const spacingConfig = {
          horizontal: layout.spacing.horizontal,
          vertical: layout.spacing.vertical,
          tolerance: 5,
          baseUnit: 8,
          componentSpacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 },
          containerPadding: { x: 16, y: 16 },
          uiElementSpacing: {
            gameInfo: 16,
            gameStatus: 12,
            startButton: 24,
            warnings: 16,
            resultDisplay: 20,
            cardArea: 32
          }
        }
        
        const spacingResult = validateSpacingStandards(
          layout.positions,
          spacingConfig,
          layout.cardWidth,
          layout.cardHeight
        )
        
        expect(spacingResult.isValid).toBe(true)
        expect(spacingResult.errors).toHaveLength(0)
      })
    })
  })

  describe('Orientation Change Adaptation', () => {
    it('should adapt layout when device orientation changes from portrait to landscape', () => {
      const cardCount = 6
      
      // 竖屏布局
      const portraitLayout = calculateOptimalLayout(
        cardCount,
        mockOrientations.portrait.width,
        mockOrientations.portrait.height,
        'mobile'
      )
      
      // 横屏布局
      const landscapeLayout = calculateOptimalLayout(
        cardCount,
        mockOrientations.landscape.width,
        mockOrientations.landscape.height,
        'mobile'
      )
      
      // 验证两种布局都有效
      const portraitValidation = validatePositionConsistency(
        portraitLayout.positions,
        mockOrientations.portrait.width,
        mockOrientations.portrait.height,
        portraitLayout.cardWidth,
        portraitLayout.cardHeight
      )
      
      const landscapeValidation = validatePositionConsistency(
        landscapeLayout.positions,
        mockOrientations.landscape.width,
        mockOrientations.landscape.height,
        landscapeLayout.cardWidth,
        landscapeLayout.cardHeight
      )
      
      expect(portraitValidation.isValid).toBe(true)
      expect(landscapeValidation.isValid).toBe(true)
      
      // 验证横屏时卡片排列更紧凑（更多行）
      const portraitRows = Math.ceil(cardCount / portraitLayout.cardsPerRow)
      const landscapeRows = Math.ceil(cardCount / landscapeLayout.cardsPerRow)
      
      expect(landscapeRows).toBeLessThanOrEqual(portraitRows)
    })

    it('should maintain card aspect ratio across orientations', () => {
      const cardCount = 4
      
      const portraitLayout = calculateOptimalLayout(
        cardCount,
        mockOrientations.portrait.width,
        mockOrientations.portrait.height,
        'mobile'
      )
      
      const landscapeLayout = calculateOptimalLayout(
        cardCount,
        mockOrientations.landscape.width,
        mockOrientations.landscape.height,
        'mobile'
      )
      
      // 计算卡片宽高比
      const portraitAspectRatio = portraitLayout.cardWidth / portraitLayout.cardHeight
      const landscapeAspectRatio = landscapeLayout.cardWidth / landscapeLayout.cardHeight
      
      // 验证宽高比保持一致（允许小幅差异）
      const tolerance = 0.1
      expect(Math.abs(portraitAspectRatio - landscapeAspectRatio)).toBeLessThan(tolerance)
    })
  })

  describe('Dynamic Spacing System Integration', () => {
    it('should integrate with dynamic spacing system for responsive behavior', () => {
      // 模拟不同容器尺寸
      const containerSizes = [
        { width: 320, height: 568 }, // 小屏手机
        { width: 375, height: 667 }, // 标准手机
        { width: 768, height: 1024 }, // 平板
        { width: 1200, height: 800 }  // 桌面
      ]
      
      containerSizes.forEach(size => {
        const cardCount = 6
        const layout = calculateOptimalLayout(
          cardCount,
          size.width,
          size.height,
          size.width < 768 ? 'mobile' : size.width < 1024 ? 'tablet' : 'desktop'
        )
        
        // 验证动态间距计算
        expect(layout.spacing.horizontal).toBeGreaterThan(0)
        expect(layout.spacing.vertical).toBeGreaterThan(0)
        
        // 验证间距与容器尺寸成比例
        const spacingRatio = layout.spacing.horizontal / size.width
        expect(spacingRatio).toBeGreaterThan(0.01) // 至少1%的容器宽度
        expect(spacingRatio).toBeLessThan(0.1)     // 不超过10%的容器宽度
      })
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle very small container sizes gracefully', () => {
      const cardCount = 3
      const smallContainer = { width: 200, height: 300 }
      
      const layout = calculateOptimalLayout(
        cardCount,
        smallContainer.width,
        smallContainer.height,
        'mobile'
      )
      
      // 验证即使在小容器中也能生成有效布局
      expect(layout).toBeDefined()
      expect(layout.positions).toHaveLength(cardCount)
      
      const validation = validatePositionConsistency(
        layout.positions,
        smallContainer.width,
        smallContainer.height,
        layout.cardWidth,
        layout.cardHeight
      )
      
      // 可能会有警告，但不应该有严重错误
      expect(validation.outOfBoundsCards).toHaveLength(0)
    })

    it('should handle large number of cards appropriately', () => {
      const cardCount = 15
      const container = mockDeviceConfigs.desktop
      
      const layout = calculateOptimalLayout(
        cardCount,
        container.width,
        container.height,
        'desktop'
      )
      
      expect(layout).toBeDefined()
      expect(layout.positions).toHaveLength(cardCount)
      
      // 验证大量卡片时的布局有效性
      const validation = validatePositionConsistency(
        layout.positions,
        container.width,
        container.height,
        layout.cardWidth,
        layout.cardHeight
      )
      
      expect(validation.isValid).toBe(true)
    })

    it('should maintain minimum card sizes across all devices', () => {
      const cardCount = 8
      const minCardWidth = 80
      const minCardHeight = 100
      
      Object.entries(mockDeviceConfigs).forEach(([deviceType, config]) => {
        const layout = calculateOptimalLayout(
          cardCount,
          config.width,
          config.height,
          deviceType as DeviceType
        )
        
        // 验证卡片尺寸不会小于最小值
        expect(layout.cardWidth).toBeGreaterThanOrEqual(minCardWidth)
        expect(layout.cardHeight).toBeGreaterThanOrEqual(minCardHeight)
      })
    })
  })
})