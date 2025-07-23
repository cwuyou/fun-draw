/**
 * Task 12 测试：视觉回归测试
 * 验证间距的视觉效果，包括容器边框间距、多行布局平衡和UI元素优化
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import {
  getCardAreaSpacing,
  getSpacingConfig,
  validateAllSpacing
} from '@/lib/spacing-system'
import {
  useCardGameSpacing,
  createCardAreaSpacingStyle,
  createCardGridClass
} from '@/hooks/use-dynamic-spacing'
import type { DeviceType } from '@/types'

// 模拟卡牌组件用于视觉测试
const MockCard: React.FC<{ 
  style?: React.CSSProperties
  className?: string
  children?: React.ReactNode
}> = ({ style, className, children }) => (
  <div 
    data-testid="mock-card"
    style={{
      width: '80px',
      height: '120px',
      backgroundColor: '#f0f0f0',
      border: '1px solid #ccc',
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      ...style
    }}
    className={className}
  >
    {children || 'Card'}
  </div>
)

// 模拟卡牌布局容器
const MockCardLayout: React.FC<{
  deviceType: DeviceType
  cardCount: number
  containerWidth: number
  containerHeight: number
}> = ({ deviceType, cardCount, containerWidth, containerHeight }) => {
  const cardAreaSpacing = getCardAreaSpacing(deviceType)
  const layoutStyle = createCardAreaSpacingStyle(cardAreaSpacing, cardCount > 5 ? 'complex' : 'simple')
  const gridClass = createCardGridClass(cardAreaSpacing, 5, cardCount > 5 ? 'complex' : 'simple')
  
  return (
    <div
      data-testid="card-container"
      style={{
        width: containerWidth,
        height: containerHeight,
        border: '2px solid #000',
        position: 'relative',
        backgroundColor: '#fff'
      }}
    >
      <div
        data-testid="card-area"
        style={layoutStyle}
        className={gridClass}
      >
        {Array.from({ length: cardCount }, (_, index) => (
          <MockCard key={index}>
            {index + 1}
          </MockCard>
        ))}
      </div>
    </div>
  )
}

// 模拟游戏信息面板
const MockGameInfo: React.FC<{
  deviceType: DeviceType
  showRemainingCards?: boolean
}> = ({ deviceType, showRemainingCards = true }) => {
  const spacingConfig = getSpacingConfig(deviceType)
  
  return (
    <div
      data-testid="game-info"
      style={{
        marginBottom: spacingConfig.uiElementSpacing.gameInfo,
        padding: '16px',
        backgroundColor: '#f8f9fa',
        border: '1px solid #dee2e6',
        borderRadius: '8px'
      }}
    >
      <div>抽取数量: 8</div>
      <div>名单数量: 20</div>
      {showRemainingCards && <div>剩余卡牌: 12</div>}
    </div>
  )
}

// 模拟完整的游戏布局
const MockGameLayout: React.FC<{
  deviceType: DeviceType
  cardCount: number
  containerWidth: number
  containerHeight: number
  showRemainingCards?: boolean
}> = ({ deviceType, cardCount, containerWidth, containerHeight, showRemainingCards = true }) => {
  const spacingConfig = getSpacingConfig(deviceType)
  
  return (
    <div
      data-testid="game-layout"
      style={{
        width: containerWidth,
        height: containerHeight,
        padding: `${spacingConfig.containerPadding.y}px ${spacingConfig.containerPadding.x}px`,
        backgroundColor: '#ffffff'
      }}
    >
      <MockGameInfo deviceType={deviceType} showRemainingCards={showRemainingCards} />
      <MockCardLayout
        deviceType={deviceType}
        cardCount={cardCount}
        containerWidth={containerWidth - spacingConfig.containerPadding.x * 2}
        containerHeight={containerHeight - spacingConfig.containerPadding.y * 2 - 120}
      />
      <div
        data-testid="start-button"
        style={{
          marginTop: spacingConfig.uiElementSpacing.startButton,
          padding: '12px 24px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          textAlign: 'center'
        }}
      >
        开始抽取
      </div>
    </div>
  )
}

describe('Task 12: 视觉回归测试', () => {
  beforeEach(() => {
    // 清理DOM
    document.body.innerHTML = ''
  })

  describe('容器边框间距验证', () => {
    it('应该验证桌面端卡牌与容器边框的正确间距', () => {
      const deviceType: DeviceType = 'desktop'
      const containerWidth = 1200
      const containerHeight = 800
      const cardCount = 8
      
      render(
        <MockCardLayout
          deviceType={deviceType}
          cardCount={cardCount}
          containerWidth={containerWidth}
          containerHeight={containerHeight}
        />
      )
      
      const container = screen.getByTestId('card-container')
      const cardArea = screen.getByTestId('card-area')
      
      expect(container).toBeInTheDocument()
      expect(cardArea).toBeInTheDocument()
      
      // 验证容器样式
      const containerStyle = window.getComputedStyle(container)
      expect(containerStyle.width).toBe(`${containerWidth}px`)
      expect(containerStyle.height).toBe(`${containerHeight}px`)
      
      // 验证卡牌区域的边距
      const cardAreaStyle = window.getComputedStyle(cardArea)
      const expectedSpacing = getCardAreaSpacing(deviceType)
      
      // 验证边距值（考虑复杂布局的调整）
      const complexityMultiplier = cardCount > 5 ? 1.1 : 1.0
      const expectedTopMargin = Math.round(expectedSpacing.containerMargins.top * complexityMultiplier)
      const expectedBottomMargin = Math.round(expectedSpacing.containerMargins.bottom * complexityMultiplier)
      
      expect(parseInt(cardAreaStyle.marginTop)).toBe(expectedTopMargin)
      expect(parseInt(cardAreaStyle.marginBottom)).toBe(expectedBottomMargin)
      expect(parseInt(cardAreaStyle.marginLeft)).toBe(expectedSpacing.containerMargins.left)
      expect(parseInt(cardAreaStyle.marginRight)).toBe(expectedSpacing.containerMargins.right)
    })

    it('应该验证平板端卡牌与容器边框的正确间距', () => {
      const deviceType: DeviceType = 'tablet'
      const containerWidth = 768
      const containerHeight = 1024
      const cardCount = 6
      
      render(
        <MockCardLayout
          deviceType={deviceType}
          cardCount={cardCount}
          containerWidth={containerWidth}
          containerHeight={containerHeight}
        />
      )
      
      const cardArea = screen.getByTestId('card-area')
      const cardAreaStyle = window.getComputedStyle(cardArea)
      const expectedSpacing = getCardAreaSpacing(deviceType)
      
      // 验证平板端的间距符合要求
      expect(parseInt(cardAreaStyle.marginLeft)).toBe(expectedSpacing.containerMargins.left)
      expect(parseInt(cardAreaStyle.marginRight)).toBe(expectedSpacing.containerMargins.right)
      expect(expectedSpacing.containerMargins.left).toBeGreaterThanOrEqual(24)
      expect(expectedSpacing.containerMargins.right).toBeGreaterThanOrEqual(24)
    })

    it('应该验证移动端卡牌与容器边框的正确间距', () => {
      const deviceType: DeviceType = 'mobile'
      const containerWidth = 375
      const containerHeight = 667
      const cardCount = 4
      
      render(
        <MockCardLayout
          deviceType={deviceType}
          cardCount={cardCount}
          containerWidth={containerWidth}
          containerHeight={containerHeight}
        />
      )
      
      const cardArea = screen.getByTestId('card-area')
      const cardAreaStyle = window.getComputedStyle(cardArea)
      const expectedSpacing = getCardAreaSpacing(deviceType)
      
      // 验证移动端的间距符合要求
      expect(parseInt(cardAreaStyle.marginLeft)).toBe(expectedSpacing.containerMargins.left)
      expect(parseInt(cardAreaStyle.marginRight)).toBe(expectedSpacing.containerMargins.right)
      expect(expectedSpacing.containerMargins.left).toBeGreaterThanOrEqual(16)
      expect(expectedSpacing.containerMargins.right).toBeGreaterThanOrEqual(16)
    })
  })

  describe('多行布局平衡和居中测试', () => {
    it('应该验证8张卡牌的多行布局平衡', () => {
      const deviceType: DeviceType = 'desktop'
      const containerWidth = 1200
      const containerHeight = 800
      const cardCount = 8
      
      render(
        <MockCardLayout
          deviceType={deviceType}
          cardCount={cardCount}
          containerWidth={containerWidth}
          containerHeight={containerHeight}
        />
      )
      
      const cards = screen.getAllByTestId('mock-card')
      expect(cards).toHaveLength(cardCount)
      
      // 验证卡牌区域的网格布局
      const cardArea = screen.getByTestId('card-area')
      const cardAreaClasses = cardArea.className
      
      // 验证网格类名包含正确的间距
      expect(cardAreaClasses).toContain('gap-x-[16px]') // 桌面端卡牌间距
      expect(cardAreaClasses).toContain('gap-y-[20px]') // 桌面端行间距
      
      // 验证复杂布局的边距调整
      const cardAreaStyle = window.getComputedStyle(cardArea)
      const expectedTopMargin = Math.round(36 * 1.1) // 复杂布局乘数
      expect(parseInt(cardAreaStyle.marginTop)).toBe(expectedTopMargin)
    })

    it('应该验证6张卡牌的行居中效果', () => {
      const deviceType: DeviceType = 'tablet'
      const containerWidth = 768
      const containerHeight = 1024
      const cardCount = 6
      
      render(
        <MockCardLayout
          deviceType={deviceType}
          cardCount={cardCount}
          containerWidth={containerWidth}
          containerHeight={containerHeight}
        />
      )
      
      const cardArea = screen.getByTestId('card-area')
      const cardAreaStyle = window.getComputedStyle(cardArea)
      const expectedSpacing = getCardAreaSpacing(deviceType)
      
      // 验证行间距
      expect(parseInt(cardAreaStyle.rowGap || '0')).toBe(expectedSpacing.rowSpacing)
      
      // 验证卡牌间距
      expect(parseInt(cardAreaStyle.gap || '0')).toBe(expectedSpacing.cardSpacing)
    })

    it('应该验证移动端多行布局的紧凑性', () => {
      const deviceType: DeviceType = 'mobile'
      const containerWidth = 375
      const containerHeight = 667
      const cardCount = 6
      
      render(
        <MockCardLayout
          deviceType={deviceType}
          cardCount={cardCount}
          containerWidth={containerWidth}
          containerHeight={containerHeight}
        />
      )
      
      const cardArea = screen.getByTestId('card-area')
      const cardAreaStyle = window.getComputedStyle(cardArea)
      const expectedSpacing = getCardAreaSpacing(deviceType)
      
      // 验证移动端的紧凑间距
      expect(expectedSpacing.cardSpacing).toBe(12)
      expect(expectedSpacing.rowSpacing).toBe(12)
      
      // 验证边距不会过大
      expect(expectedSpacing.containerMargins.left).toBe(16)
      expect(expectedSpacing.containerMargins.right).toBe(16)
    })
  })

  describe('UI元素间距优化验证', () => {
    it('应该验证游戏信息面板与卡牌区域的间距', () => {
      const deviceType: DeviceType = 'desktop'
      const containerWidth = 1200
      const containerHeight = 800
      const cardCount = 8
      
      render(
        <MockGameLayout
          deviceType={deviceType}
          cardCount={cardCount}
          containerWidth={containerWidth}
          containerHeight={containerHeight}
        />
      )
      
      const gameInfo = screen.getByTestId('game-info')
      const gameInfoStyle = window.getComputedStyle(gameInfo)
      const spacingConfig = getSpacingConfig(deviceType)
      
      // 验证游戏信息面板的底部边距
      expect(parseInt(gameInfoStyle.marginBottom)).toBe(spacingConfig.uiElementSpacing.gameInfo)
      expect(spacingConfig.uiElementSpacing.gameInfo).toBeGreaterThanOrEqual(36) // 桌面端至少36px
    })

    it('应该验证开始按钮与卡牌区域的间距', () => {
      const deviceType: DeviceType = 'tablet'
      const containerWidth = 768
      const containerHeight = 1024
      const cardCount = 6
      
      render(
        <MockGameLayout
          deviceType={deviceType}
          cardCount={cardCount}
          containerWidth={containerWidth}
          containerHeight={containerHeight}
        />
      )
      
      const startButton = screen.getByTestId('start-button')
      const buttonStyle = window.getComputedStyle(startButton)
      const spacingConfig = getSpacingConfig(deviceType)
      
      // 验证开始按钮的顶部边距
      expect(parseInt(buttonStyle.marginTop)).toBe(spacingConfig.uiElementSpacing.startButton)
      expect(spacingConfig.uiElementSpacing.startButton).toBeGreaterThanOrEqual(20) // 平板端至少20px
    })

    it('应该验证整体布局的视觉层次', () => {
      const deviceType: DeviceType = 'desktop'
      const containerWidth = 1200
      const containerHeight = 800
      const cardCount = 10
      
      render(
        <MockGameLayout
          deviceType={deviceType}
          cardCount={cardCount}
          containerWidth={containerWidth}
          containerHeight={containerHeight}
        />
      )
      
      const gameLayout = screen.getByTestId('game-layout')
      const gameInfo = screen.getByTestId('game-info')
      const cardArea = screen.getByTestId('card-area')
      const startButton = screen.getByTestId('start-button')
      
      // 验证所有元素都存在
      expect(gameLayout).toBeInTheDocument()
      expect(gameInfo).toBeInTheDocument()
      expect(cardArea).toBeInTheDocument()
      expect(startButton).toBeInTheDocument()
      
      // 验证布局的整体间距合理性
      const validation = validateAllSpacing(deviceType, containerWidth, containerHeight, cardCount)
      
      // 对于合理的容器尺寸，布局应该是有效的或至少有建议
      if (!validation.isValid) {
        expect(validation.recommendations.length).toBeGreaterThan(0)
      }
    })
  })

  describe('剩余卡牌显示优化测试', () => {
    it('应该验证显示剩余卡牌信息的布局', () => {
      const deviceType: DeviceType = 'desktop'
      const containerWidth = 1200
      const containerHeight = 800
      const cardCount = 8
      
      render(
        <MockGameLayout
          deviceType={deviceType}
          cardCount={cardCount}
          containerWidth={containerWidth}
          containerHeight={containerHeight}
          showRemainingCards={true}
        />
      )
      
      const gameInfo = screen.getByTestId('game-info')
      expect(gameInfo).toHaveTextContent('剩余卡牌: 12')
      
      // 验证游戏信息面板的样式
      const gameInfoStyle = window.getComputedStyle(gameInfo)
      expect(gameInfoStyle.padding).toBe('16px')
      expect(gameInfoStyle.backgroundColor).toBe('rgb(248, 249, 250)')
    })

    it('应该验证隐藏剩余卡牌信息的优化布局', () => {
      const deviceType: DeviceType = 'mobile'
      const containerWidth = 375
      const containerHeight = 667
      const cardCount = 6
      
      render(
        <MockGameLayout
          deviceType={deviceType}
          cardCount={cardCount}
          containerWidth={containerWidth}
          containerHeight={containerHeight}
          showRemainingCards={false}
        />
      )
      
      const gameInfo = screen.getByTestId('game-info')
      expect(gameInfo).not.toHaveTextContent('剩余卡牌')
      
      // 验证简化后的信息显示
      expect(gameInfo).toHaveTextContent('抽取数量: 8')
      expect(gameInfo).toHaveTextContent('名单数量: 20')
    })

    it('应该验证不同设备类型的信息显示优化', () => {
      const deviceTypes: DeviceType[] = ['mobile', 'tablet', 'desktop']
      
      deviceTypes.forEach(deviceType => {
        const containerSizes = {
          mobile: { width: 375, height: 667 },
          tablet: { width: 768, height: 1024 },
          desktop: { width: 1200, height: 800 }
        }
        
        const { width, height } = containerSizes[deviceType]
        
        render(
          <MockGameLayout
            deviceType={deviceType}
            cardCount={8}
            containerWidth={width}
            containerHeight={height}
            showRemainingCards={deviceType !== 'mobile'} // 移动端隐藏剩余卡牌
          />
        )
        
        const gameInfo = screen.getByTestId('game-info')
        const spacingConfig = getSpacingConfig(deviceType)
        
        // 验证间距配置
        expect(parseInt(window.getComputedStyle(gameInfo).marginBottom)).toBe(spacingConfig.uiElementSpacing.gameInfo)
        
        // 验证移动端的简化显示
        if (deviceType === 'mobile') {
          expect(gameInfo).not.toHaveTextContent('剩余卡牌')
        } else {
          expect(gameInfo).toHaveTextContent('剩余卡牌')
        }
        
        // 清理DOM以便下次测试
        document.body.innerHTML = ''
      })
    })
  })

  describe('响应式视觉效果测试', () => {
    it('应该验证不同屏幕尺寸下的视觉一致性', () => {
      const testCases = [
        { deviceType: 'mobile' as DeviceType, width: 375, height: 667, cardCount: 4 },
        { deviceType: 'tablet' as DeviceType, width: 768, height: 1024, cardCount: 6 },
        { deviceType: 'desktop' as DeviceType, width: 1200, height: 800, cardCount: 8 }
      ]
      
      testCases.forEach(({ deviceType, width, height, cardCount }) => {
        render(
          <MockCardLayout
            deviceType={deviceType}
            cardCount={cardCount}
            containerWidth={width}
            containerHeight={height}
          />
        )
        
        const container = screen.getByTestId('card-container')
        const cardArea = screen.getByTestId('card-area')
        const cards = screen.getAllByTestId('mock-card')
        
        // 验证基本结构
        expect(container).toBeInTheDocument()
        expect(cardArea).toBeInTheDocument()
        expect(cards).toHaveLength(cardCount)
        
        // 验证容器尺寸
        const containerStyle = window.getComputedStyle(container)
        expect(containerStyle.width).toBe(`${width}px`)
        expect(containerStyle.height).toBe(`${height}px`)
        
        // 验证间距配置
        const expectedSpacing = getCardAreaSpacing(deviceType)
        const cardAreaStyle = window.getComputedStyle(cardArea)
        
        expect(parseInt(cardAreaStyle.marginLeft)).toBe(expectedSpacing.containerMargins.left)
        expect(parseInt(cardAreaStyle.marginRight)).toBe(expectedSpacing.containerMargins.right)
        
        // 清理DOM
        document.body.innerHTML = ''
      })
    })

    it('应该验证极端尺寸下的视觉降级', () => {
      const deviceType: DeviceType = 'mobile'
      const containerWidth = 280 // 极小宽度
      const containerHeight = 480
      const cardCount = 6
      
      render(
        <MockCardLayout
          deviceType={deviceType}
          cardCount={cardCount}
          containerWidth={containerWidth}
          containerHeight={containerHeight}
        />
      )
      
      const container = screen.getByTestId('card-container')
      const cardArea = screen.getByTestId('card-area')
      
      expect(container).toBeInTheDocument()
      expect(cardArea).toBeInTheDocument()
      
      // 验证在极小尺寸下仍然有合理的布局
      const validation = validateAllSpacing(deviceType, containerWidth, containerHeight, cardCount)
      
      // 即使验证失败，也应该有降级方案
      if (!validation.isValid) {
        expect(validation.recommendations.length).toBeGreaterThan(0)
        expect(validation.cardAreaValidation.fallbackRequired).toBeDefined()
      }
    })
  })
})