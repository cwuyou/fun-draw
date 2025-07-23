// User Experience Validation Tests
// Tests visual hierarchy, information clarity, spacing comfort, and layout balance

import { describe, test, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useDynamicSpacing, useCardGameSpacing } from '@/hooks/use-dynamic-spacing'
import { 
  calculateEnhancedCardLayout, 
  calculateMultiRowCardPositions,
  validateMultiRowBalance,
  detectDeviceType 
} from '@/lib/layout-manager'
import { 
  validateCardAreaSpacing, 
  validateAllSpacing,
  getCardAreaSpacing,
  generateSpacingDebugReport 
} from '@/lib/spacing-system'
import type { DeviceType } from '@/types'

// Mock component for testing spacing
function TestCardLayout({ 
  containerWidth = 1024, 
  containerHeight = 768, 
  cardCount = 8,
  deviceType = 'desktop' as DeviceType
}) {
  const spacing = useCardGameSpacing({
    containerWidth,
    containerHeight,
    cardCount,
    cardsPerRow: 5,
    uiElements: {
      hasGameInfo: true,
      hasStartButton: true,
      hasResultDisplay: false
    }
  })

  const layoutResult = calculateEnhancedCardLayout(containerWidth, containerHeight, cardCount, deviceType)
  const positions = calculateMultiRowCardPositions(cardCount, layoutResult)

  return (
    <div 
      data-testid="container"
      className={spacing.cssClasses.container.padding}
      style={{ width: containerWidth, height: containerHeight }}
    >
      {/* Game Info Panel */}
      <div 
        data-testid="game-info"
        className={spacing.cssClasses.uiElement.gameInfo}
      >
        <div>抽取数量: {cardCount}</div>
        <div>名单数量: 20</div>
        <div>状态: 准备中</div>
      </div>

      {/* Card Area */}
      <div 
        data-testid="card-area"
        className={spacing.cssClasses.cardArea?.containerMargins}
        style={{
          position: 'relative',
          minHeight: spacing.cardAreaSpacing?.minCardAreaHeight,
          ...spacing.cardSpecific?.cardAreaStyle
        }}
      >
        {positions.map((position, index) => (
          <div
            key={index}
            data-testid={`card-${index}`}
            style={{
              position: 'absolute',
              left: position.x,
              top: position.y,
              width: position.cardWidth,
              height: position.cardHeight,
              transform: `rotate(${position.rotation}deg)`,
              backgroundColor: 'white',
              border: '2px solid #ccc',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            Card {index + 1}
          </div>
        ))}
      </div>

      {/* Start Button */}
      <div 
        data-testid="start-button"
        className={spacing.cssClasses.uiElement.startButton}
      >
        <button>开始抽卡</button>
      </div>
    </div>
  )
}

describe('User Experience Validation', () => {
  describe('Visual Hierarchy and Information Clarity', () => {
    test('should maintain clear visual hierarchy across device types', () => {
      const deviceTypes: DeviceType[] = ['mobile', 'tablet', 'desktop']
      const containerSizes = {
        mobile: { width: 375, height: 667 },
        tablet: { width: 768, height: 1024 },
        desktop: { width: 1024, height: 768 }
      }

      deviceTypes.forEach(deviceType => {
        const { width, height } = containerSizes[deviceType]
        const { container } = render(
          <TestCardLayout 
            containerWidth={width}
            containerHeight={height}
            cardCount={8}
            deviceType={deviceType}
          />
        )

        // Test visual hierarchy elements are present and properly spaced
        const gameInfo = screen.getByTestId('game-info')
        const cardArea = screen.getByTestId('card-area')
        const startButton = screen.getByTestId('start-button')

        expect(gameInfo).toBeInTheDocument()
        expect(cardArea).toBeInTheDocument()
        expect(startButton).toBeInTheDocument()

        // Verify visual order (top to bottom)
        const gameInfoRect = gameInfo.getBoundingClientRect()
        const cardAreaRect = cardArea.getBoundingClientRect()
        const startButtonRect = startButton.getBoundingClientRect()

        expect(gameInfoRect.bottom).toBeLessThan(cardAreaRect.top)
        expect(cardAreaRect.bottom).toBeLessThan(startButtonRect.top)

        container.unmount()
      })
    })

    test('should display essential information clearly', () => {
      const { container } = render(<TestCardLayout cardCount={8} />)
      
      const gameInfo = screen.getByTestId('game-info')
      
      // Essential information should be visible
      expect(gameInfo).toHaveTextContent('抽取数量: 8')
      expect(gameInfo).toHaveTextContent('名单数量: 20')
      expect(gameInfo).toHaveTextContent('状态: 准备中')

      // Information should be well-formatted and readable
      const computedStyle = window.getComputedStyle(gameInfo)
      expect(parseInt(computedStyle.fontSize)).toBeGreaterThan(12) // Readable font size
      
      container.unmount()
    })

    test('should optimize information display for mobile devices', () => {
      const { container } = render(
        <TestCardLayout 
          containerWidth={375}
          containerHeight={667}
          cardCount={6}
          deviceType="mobile"
        />
      )

      const gameInfo = screen.getByTestId('game-info')
      const gameInfoRect = gameInfo.getBoundingClientRect()

      // Mobile should have compact but readable information display
      expect(gameInfoRect.height).toBeLessThan(120) // Compact height
      expect(gameInfoRect.width).toBeLessThan(375) // Fits in mobile width

      container.unmount()
    })
  })

  describe('Spacing Comfort Across Device Types', () => {
    test('should provide comfortable spacing on desktop', () => {
      const validation = validateCardAreaSpacing('desktop', 1024, 768, 8)
      
      expect(validation.isValid).toBe(true)
      expect(validation.violations.containerMargins).toBeUndefined()
      
      const spacing = getCardAreaSpacing('desktop')
      
      // Desktop should have generous margins
      expect(spacing.containerMargins.left).toBeGreaterThanOrEqual(32)
      expect(spacing.containerMargins.right).toBeGreaterThanOrEqual(32)
      expect(spacing.containerMargins.top).toBeGreaterThanOrEqual(36)
      expect(spacing.containerMargins.bottom).toBeGreaterThanOrEqual(24)
    })

    test('should provide appropriate spacing on tablet', () => {
      const validation = validateCardAreaSpacing('tablet', 768, 1024, 8)
      
      expect(validation.isValid).toBe(true)
      
      const spacing = getCardAreaSpacing('tablet')
      
      // Tablet should have medium margins
      expect(spacing.containerMargins.left).toBeGreaterThanOrEqual(24)
      expect(spacing.containerMargins.right).toBeGreaterThanOrEqual(24)
      expect(spacing.containerMargins.top).toBeGreaterThanOrEqual(32)
      expect(spacing.rowSpacing).toBeGreaterThanOrEqual(16)
    })

    test('should provide compact but comfortable spacing on mobile', () => {
      const validation = validateCardAreaSpacing('mobile', 375, 667, 6)
      
      expect(validation.isValid).toBe(true)
      
      const spacing = getCardAreaSpacing('mobile')
      
      // Mobile should have compact but sufficient margins
      expect(spacing.containerMargins.left).toBeGreaterThanOrEqual(16)
      expect(spacing.containerMargins.right).toBeGreaterThanOrEqual(16)
      expect(spacing.containerMargins.top).toBeGreaterThanOrEqual(30)
      expect(spacing.cardSpacing).toBeGreaterThanOrEqual(12)
    })

    test('should maintain minimum touch targets on mobile', () => {
      const { container } = render(
        <TestCardLayout 
          containerWidth={375}
          containerHeight={667}
          cardCount={4}
          deviceType="mobile"
        />
      )

      // Check that cards meet minimum touch target size (44px)
      const cards = screen.getAllByTestId(/card-\d+/)
      cards.forEach(card => {
        const rect = card.getBoundingClientRect()
        expect(rect.width).toBeGreaterThanOrEqual(44)
        expect(rect.height).toBeGreaterThanOrEqual(44)
      })

      container.unmount()
    })
  })

  describe('Layout Balance with Multiple Rows', () => {
    test('should balance 8-card layout properly', () => {
      const layoutResult = calculateEnhancedCardLayout(1024, 768, 8, 'desktop')
      const positions = calculateMultiRowCardPositions(8, layoutResult)
      const balance = validateMultiRowBalance(positions, layoutResult)

      expect(balance.isBalanced).toBe(true)
      expect(balance.issues).toHaveLength(0)

      // Verify row distribution (5 cards in first row, 3 in second)
      const row1Cards = positions.filter(pos => pos.row === 0)
      const row2Cards = positions.filter(pos => pos.row === 1)

      expect(row1Cards).toHaveLength(5)
      expect(row2Cards).toHaveLength(3)

      // Verify second row is centered
      expect(row2Cards.every(pos => pos.isRowCentered)).toBe(true)
    })

    test('should balance 10-card layout properly', () => {
      const layoutResult = calculateEnhancedCardLayout(1024, 768, 10, 'desktop')
      const positions = calculateMultiRowCardPositions(10, layoutResult)
      const balance = validateMultiRowBalance(positions, layoutResult)

      expect(balance.isBalanced).toBe(true)

      // Verify row distribution (5 cards in each row)
      const row1Cards = positions.filter(pos => pos.row === 0)
      const row2Cards = positions.filter(pos => pos.row === 1)

      expect(row1Cards).toHaveLength(5)
      expect(row2Cards).toHaveLength(5)

      // Both rows should be full, so not marked as centered
      expect(row1Cards.every(pos => !pos.isRowCentered)).toBe(true)
      expect(row2Cards.every(pos => !pos.isRowCentered)).toBe(true)
    })

    test('should handle 6-card mobile layout', () => {
      const layoutResult = calculateEnhancedCardLayout(375, 667, 6, 'mobile')
      const positions = calculateMultiRowCardPositions(6, layoutResult)
      const balance = validateMultiRowBalance(positions, layoutResult)

      expect(balance.isBalanced).toBe(true)

      // Mobile typically uses 2 cards per row
      const rowCounts = positions.reduce((counts, pos) => {
        counts[pos.row] = (counts[pos.row] || 0) + 1
        return counts
      }, {} as Record<number, number>)

      // Should have 3 rows with 2 cards each
      expect(Object.keys(rowCounts)).toHaveLength(3)
      Object.values(rowCounts).forEach(count => {
        expect(count).toBeLessThanOrEqual(2)
      })
    })

    test('should maintain proper vertical spacing between rows', () => {
      const layoutResult = calculateEnhancedCardLayout(1024, 768, 8, 'desktop')
      const positions = calculateMultiRowCardPositions(8, layoutResult)

      const row1Cards = positions.filter(pos => pos.row === 0)
      const row2Cards = positions.filter(pos => pos.row === 1)

      if (row1Cards.length > 0 && row2Cards.length > 0) {
        const row1Y = row1Cards[0].y
        const row2Y = row2Cards[0].y
        const actualSpacing = row2Y - row1Y - layoutResult.spacing.rowSpacing

        // Allow 2px tolerance for positioning calculations
        expect(Math.abs(actualSpacing - layoutResult.spacing.rowSpacing)).toBeLessThan(2)
      }
    })
  })

  describe('Remaining Cards Display Optimization', () => {
    test('should not show remaining cards during gameplay by default', () => {
      // Test that remaining cards info is not prominently displayed during active gameplay
      const { container } = render(<TestCardLayout cardCount={8} />)
      
      const gameInfo = screen.getByTestId('game-info')
      
      // Should show essential info but not remaining cards count
      expect(gameInfo).toHaveTextContent('抽取数量')
      expect(gameInfo).toHaveTextContent('名单数量')
      expect(gameInfo).toHaveTextContent('状态')
      
      // Should not prominently display remaining cards during waiting phase
      expect(gameInfo).not.toHaveTextContent('剩余卡牌')

      container.unmount()
    })

    test('should optimize information density for mobile', () => {
      const { container } = render(
        <TestCardLayout 
          containerWidth={375}
          containerHeight={667}
          cardCount={6}
          deviceType="mobile"
        />
      )

      const gameInfo = screen.getByTestId('game-info')
      const gameInfoRect = gameInfo.getBoundingClientRect()

      // Mobile should show minimal, essential information
      expect(gameInfoRect.height).toBeLessThan(100) // Compact display
      
      // Should focus on essential information only
      expect(gameInfo).toHaveTextContent('抽取数量')
      expect(gameInfo).toHaveTextContent('名单数量')

      container.unmount()
    })

    test('should validate information hierarchy effectiveness', () => {
      const deviceTypes: DeviceType[] = ['mobile', 'tablet', 'desktop']
      
      deviceTypes.forEach(deviceType => {
        const containerSizes = {
          mobile: { width: 375, height: 667 },
          tablet: { width: 768, height: 1024 },
          desktop: { width: 1024, height: 768 }
        }

        const { width, height } = containerSizes[deviceType]
        const validation = validateAllSpacing(deviceType, width, height, 8, {
          hasGameInfo: true,
          hasStartButton: true,
          hasResultDisplay: false
        })

        expect(validation.isValid).toBe(true)
        expect(validation.overallIssues).toHaveLength(0)
      })
    })
  })

  describe('Comprehensive UX Validation', () => {
    test('should pass comprehensive spacing validation across all scenarios', () => {
      const testScenarios = [
        { deviceType: 'mobile' as DeviceType, width: 375, height: 667, cardCount: 4 },
        { deviceType: 'mobile' as DeviceType, width: 375, height: 667, cardCount: 6 },
        { deviceType: 'tablet' as DeviceType, width: 768, height: 1024, cardCount: 8 },
        { deviceType: 'tablet' as DeviceType, width: 768, height: 1024, cardCount: 10 },
        { deviceType: 'desktop' as DeviceType, width: 1024, height: 768, cardCount: 8 },
        { deviceType: 'desktop' as DeviceType, width: 1024, height: 768, cardCount: 12 },
        { deviceType: 'desktop' as DeviceType, width: 1440, height: 900, cardCount: 15 }
      ]

      testScenarios.forEach(scenario => {
        const validation = validateAllSpacing(
          scenario.deviceType,
          scenario.width,
          scenario.height,
          scenario.cardCount,
          {
            hasGameInfo: true,
            hasStartButton: true,
            hasResultDisplay: false
          }
        )

        expect(validation.isValid).toBe(true)
        expect(validation.overallIssues).toHaveLength(0)

        // Generate debug report for analysis
        const report = generateSpacingDebugReport(
          scenario.deviceType,
          scenario.width,
          scenario.height,
          scenario.cardCount
        )

        expect(report.summary).toContain('VALID')
      })
    })

    test('should maintain usability under stress conditions', () => {
      // Test with challenging scenarios
      const stressScenarios = [
        { deviceType: 'mobile' as DeviceType, width: 320, height: 568, cardCount: 6 }, // Small mobile
        { deviceType: 'tablet' as DeviceType, width: 768, height: 600, cardCount: 12 }, // Short tablet
        { deviceType: 'desktop' as DeviceType, width: 1024, height: 600, cardCount: 15 } // Short desktop
      ]

      stressScenarios.forEach(scenario => {
        const validation = validateAllSpacing(
          scenario.deviceType,
          scenario.width,
          scenario.height,
          scenario.cardCount
        )

        // Should either be valid or provide reasonable fallback
        if (!validation.isValid) {
          expect(validation.recommendations).not.toHaveLength(0)
          expect(validation.cardAreaValidation.fallbackRequired).toBe(true)
        }
      })
    })

    test('should provide smooth responsive transitions', () => {
      const widths = [375, 768, 1024, 1440]
      
      widths.forEach(width => {
        const deviceType = detectDeviceType(width)
        const spacing = getCardAreaSpacing(deviceType)
        
        // Verify spacing values are reasonable and progressive
        expect(spacing.containerMargins.left).toBeGreaterThan(0)
        expect(spacing.containerMargins.right).toBeGreaterThan(0)
        expect(spacing.rowSpacing).toBeGreaterThan(0)
        expect(spacing.cardSpacing).toBeGreaterThan(0)
        
        // Desktop should have larger spacing than mobile
        if (deviceType === 'desktop') {
          const mobileSpacing = getCardAreaSpacing('mobile')
          expect(spacing.containerMargins.left).toBeGreaterThan(mobileSpacing.containerMargins.left)
          expect(spacing.rowSpacing).toBeGreaterThan(mobileSpacing.rowSpacing)
        }
      })
    })
  })

  describe('Performance and User Experience Integration', () => {
    test('should maintain performance with optimal spacing', () => {
      const startTime = performance.now()
      
      // Simulate multiple spacing calculations
      for (let i = 0; i < 100; i++) {
        calculateEnhancedCardLayout(1024, 768, 8, 'desktop')
      }
      
      const endTime = performance.now()
      const totalTime = endTime - startTime
      
      // Should complete 100 calculations in reasonable time
      expect(totalTime).toBeLessThan(1000) // Less than 1 second
    })

    test('should provide consistent user experience across card counts', () => {
      const cardCounts = [4, 6, 8, 10, 12, 15]
      
      cardCounts.forEach(cardCount => {
        const layoutResult = calculateEnhancedCardLayout(1024, 768, cardCount, 'desktop')
        const positions = calculateMultiRowCardPositions(cardCount, layoutResult)
        
        expect(layoutResult.isOptimal).toBe(true)
        expect(positions).toHaveLength(cardCount)
        
        // All positions should be within bounds
        positions.forEach(position => {
          expect(Math.abs(position.x)).toBeLessThan(layoutResult.availableWidth / 2)
          expect(Math.abs(position.y)).toBeLessThan(layoutResult.availableHeight / 2)
        })
      })
    })
  })
})

// Helper function to simulate user interactions
function simulateUserInteraction(element: HTMLElement) {
  fireEvent.mouseEnter(element)
  fireEvent.mouseLeave(element)
  fireEvent.click(element)
}

// Helper function to measure visual comfort
function measureVisualComfort(element: HTMLElement): {
  hasAdequateSpacing: boolean
  isVisuallyBalanced: boolean
  meetsAccessibilityStandards: boolean
} {
  const rect = element.getBoundingClientRect()
  const computedStyle = window.getComputedStyle(element)
  
  return {
    hasAdequateSpacing: parseInt(computedStyle.padding) >= 8,
    isVisuallyBalanced: rect.width / rect.height > 0.5 && rect.width / rect.height < 2,
    meetsAccessibilityStandards: rect.width >= 44 && rect.height >= 44 // Minimum touch target
  }
}

// Export for use in other test files
export { TestCardLayout, simulateUserInteraction, measureVisualComfort }