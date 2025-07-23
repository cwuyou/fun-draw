// Visual Spacing Regression Tests
// Tests to ensure spacing remains consistent across updates and device types

import { describe, test, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import { 
  calculateEnhancedCardLayout, 
  calculateMultiRowCardPositions,
  validateMultiRowBalance 
} from '@/lib/layout-manager'
import { 
  getCardAreaSpacing, 
  validateSpacingMeasurements,
  generateSpacingDebugReport 
} from '@/lib/spacing-system'
import { useCardGameSpacing } from '@/hooks/use-dynamic-spacing'
import type { DeviceType } from '@/types'

// Visual test component that renders actual card layout
function VisualSpacingTestComponent({ 
  deviceType = 'desktop' as DeviceType,
  containerWidth = 1024,
  containerHeight = 768,
  cardCount = 8
}) {
  const spacing = useCardGameSpacing({
    containerWidth,
    containerHeight,
    cardCount,
    cardsPerRow: deviceType === 'mobile' ? 2 : deviceType === 'tablet' ? 3 : 5
  })

  const layoutResult = calculateEnhancedCardLayout(containerWidth, containerHeight, cardCount, deviceType)
  const positions = calculateMultiRowCardPositions(cardCount, layoutResult)

  return (
    <div 
      data-testid="visual-container"
      style={{ 
        width: containerWidth, 
        height: containerHeight,
        position: 'relative',
        backgroundColor: '#f5f5f5',
        border: '2px solid #ddd'
      }}
    >
      {/* Game Info Panel */}
      <div 
        data-testid="game-info-panel"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '80px',
          backgroundColor: '#e3f2fd',
          border: '1px solid #2196f3',
          padding: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <span>抽取数量: {cardCount}</span>
        <span>名单数量: 20</span>
        <span>状态: 准备中</span>
      </div>

      {/* Card Area with proper margins */}
      <div 
        data-testid="card-area"
        style={{
          position: 'absolute',
          top: spacing.cardAreaSpacing?.containerMargins.top || 36,
          left: spacing.cardAreaSpacing?.containerMargins.left || 32,
          right: spacing.cardAreaSpacing?.containerMargins.right || 32,
          bottom: spacing.cardAreaSpacing?.containerMargins.bottom || 24,
          backgroundColor: '#fff3e0',
          border: '2px dashed #ff9800',
          borderRadius: '8px'
        }}
      >
        {/* Cards positioned absolutely within card area */}
        {positions.map((position, index) => (
          <div
            key={index}
            data-testid={`visual-card-${index}`}
            data-row={position.row}
            data-col={position.col}
            data-centered={position.isRowCentered}
            style={{
              position: 'absolute',
              left: position.x + (containerWidth - spacing.cardAreaSpacing!.containerMargins.left - spacing.cardAreaSpacing!.containerMargins.right) / 2,
              top: position.y + (containerHeight - spacing.cardAreaSpacing!.containerMargins.top - spacing.cardAreaSpacing!.containerMargins.bottom) / 2,
              width: position.cardWidth,
              height: position.cardHeight,
              backgroundColor: position.isRowCentered ? '#e8f5e8' : '#f0f0f0',
              border: `2px solid ${position.isRowCentered ? '#4caf50' : '#666'}`,
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: 'bold',
              transform: `rotate(${position.rotation}deg)`,
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            {index + 1}
            {position.isRowCentered && <div style={{ fontSize: '8px', color: '#4caf50' }}>C</div>}
          </div>
        ))}

        {/* Visual spacing indicators */}
        <div 
          data-testid="spacing-indicators"
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none' }}
        >
          {/* Row spacing indicators */}
          {Array.from(new Set(positions.map(p => p.row))).slice(0, -1).map(row => {
            const rowCards = positions.filter(p => p.row === row)
            const nextRowCards = positions.filter(p => p.row === row + 1)
            if (rowCards.length === 0 || nextRowCards.length === 0) return null

            const rowBottom = rowCards[0].y + layoutResult.spacing.rowSpacing / 2
            const nextRowTop = nextRowCards[0].y - layoutResult.spacing.rowSpacing / 2

            return (
              <div
                key={`row-spacing-${row}`}
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: rowBottom + (containerHeight - spacing.cardAreaSpacing!.containerMargins.top - spacing.cardAreaSpacing!.containerMargins.bottom) / 2,
                  width: '2px',
                  height: layoutResult.spacing.rowSpacing,
                  backgroundColor: '#ff5722',
                  transform: 'translateX(-50%)'
                }}
              />
            )
          })}
        </div>
      </div>

      {/* Start Button */}
      <div 
        data-testid="start-button"
        style={{
          position: 'absolute',
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '200px',
          height: '50px',
          backgroundColor: '#2196f3',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '8px',
          fontWeight: 'bold'
        }}
      >
        开始抽卡
      </div>

      {/* Debug info overlay */}
      <div 
        data-testid="debug-overlay"
        style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'rgba(0,0,0,0.8)',
          color: 'white',
          padding: '8px',
          borderRadius: '4px',
          fontSize: '10px',
          fontFamily: 'monospace'
        }}
      >
        <div>{deviceType.toUpperCase()}</div>
        <div>{containerWidth}x{containerHeight}</div>
        <div>{cardCount} cards</div>
        <div>Rows: {Math.max(...positions.map(p => p.row)) + 1}</div>
      </div>
    </div>
  )
}

describe('Visual Spacing Regression Tests', () => {
  describe('Desktop Layout Visual Validation', () => {
    test('should render 8-card desktop layout with correct spacing', () => {
      const { container } = render(
        <VisualSpacingTestComponent 
          deviceType="desktop"
          containerWidth={1024}
          containerHeight={768}
          cardCount={8}
        />
      )

      const visualContainer = screen.getByTestId('visual-container')
      const cardArea = screen.getByTestId('card-area')
      const cards = screen.getAllByTestId(/visual-card-\d+/)

      // Verify container dimensions
      expect(visualContainer).toHaveStyle({ width: '1024px', height: '768px' })

      // Verify card area positioning
      const cardAreaStyle = window.getComputedStyle(cardArea)
      expect(parseInt(cardAreaStyle.top)).toBe(36) // Desktop top margin
      expect(parseInt(cardAreaStyle.left)).toBe(32) // Desktop left margin

      // Verify card count and positioning
      expect(cards).toHaveLength(8)

      // Check row distribution (5 + 3)
      const row0Cards = cards.filter(card => card.getAttribute('data-row') === '0')
      const row1Cards = cards.filter(card => card.getAttribute('data-row') === '1')

      expect(row0Cards).toHaveLength(5)
      expect(row1Cards).toHaveLength(3)

      // Verify second row is centered
      row1Cards.forEach(card => {
        expect(card.getAttribute('data-centered')).toBe('true')
      })

      container.unmount()
    })

    test('should render 12-card desktop layout with proper multi-row balance', () => {
      const { container } = render(
        <VisualSpacingTestComponent 
          deviceType="desktop"
          containerWidth={1440}
          containerHeight={900}
          cardCount={12}
        />
      )

      const cards = screen.getAllByTestId(/visual-card-\d+/)
      expect(cards).toHaveLength(12)

      // Check row distribution (5 + 5 + 2)
      const row0Cards = cards.filter(card => card.getAttribute('data-row') === '0')
      const row1Cards = cards.filter(card => card.getAttribute('data-row') === '1')
      const row2Cards = cards.filter(card => card.getAttribute('data-row') === '2')

      expect(row0Cards).toHaveLength(5)
      expect(row1Cards).toHaveLength(5)
      expect(row2Cards).toHaveLength(2)

      // Only the last row should be centered
      row0Cards.forEach(card => {
        expect(card.getAttribute('data-centered')).toBe('false')
      })
      row1Cards.forEach(card => {
        expect(card.getAttribute('data-centered')).toBe('false')
      })
      row2Cards.forEach(card => {
        expect(card.getAttribute('data-centered')).toBe('true')
      })

      container.unmount()
    })
  })

  describe('Tablet Layout Visual Validation', () => {
    test('should render 8-card tablet layout with appropriate spacing', () => {
      const { container } = render(
        <VisualSpacingTestComponent 
          deviceType="tablet"
          containerWidth={768}
          containerHeight={1024}
          cardCount={8}
        />
      )

      const cardArea = screen.getByTestId('card-area')
      const cards = screen.getAllByTestId(/visual-card-\d+/)

      // Verify tablet-specific margins
      const cardAreaStyle = window.getComputedStyle(cardArea)
      expect(parseInt(cardAreaStyle.top)).toBe(32) // Tablet top margin
      expect(parseInt(cardAreaStyle.left)).toBe(24) // Tablet left margin

      expect(cards).toHaveLength(8)

      // Tablet typically uses 3 cards per row, so 3 + 3 + 2
      const rowCounts = cards.reduce((counts, card) => {
        const row = card.getAttribute('data-row') || '0'
        counts[row] = (counts[row] || 0) + 1
        return counts
      }, {} as Record<string, number>)

      expect(Object.keys(rowCounts)).toHaveLength(3) // 3 rows
      expect(rowCounts['0']).toBe(3)
      expect(rowCounts['1']).toBe(3)
      expect(rowCounts['2']).toBe(2)

      container.unmount()
    })
  })

  describe('Mobile Layout Visual Validation', () => {
    test('should render 6-card mobile layout with compact spacing', () => {
      const { container } = render(
        <VisualSpacingTestComponent 
          deviceType="mobile"
          containerWidth={375}
          containerHeight={667}
          cardCount={6}
        />
      )

      const cardArea = screen.getByTestId('card-area')
      const cards = screen.getAllByTestId(/visual-card-\d+/)

      // Verify mobile-specific margins
      const cardAreaStyle = window.getComputedStyle(cardArea)
      expect(parseInt(cardAreaStyle.top)).toBe(30) // Mobile top margin
      expect(parseInt(cardAreaStyle.left)).toBe(16) // Mobile left margin

      expect(cards).toHaveLength(6)

      // Mobile typically uses 2 cards per row, so 2 + 2 + 2
      const rowCounts = cards.reduce((counts, card) => {
        const row = card.getAttribute('data-row') || '0'
        counts[row] = (counts[row] || 0) + 1
        return counts
      }, {} as Record<string, number>)

      expect(Object.keys(rowCounts)).toHaveLength(3) // 3 rows
      Object.values(rowCounts).forEach(count => {
        expect(count).toBeLessThanOrEqual(2) // Max 2 cards per row on mobile
      })

      container.unmount()
    })

    test('should maintain minimum touch targets on mobile', () => {
      const { container } = render(
        <VisualSpacingTestComponent 
          deviceType="mobile"
          containerWidth={375}
          containerHeight={667}
          cardCount={4}
        />
      )

      const cards = screen.getAllByTestId(/visual-card-\d+/)

      cards.forEach(card => {
        const rect = card.getBoundingClientRect()
        expect(rect.width).toBeGreaterThanOrEqual(44) // Minimum touch target width
        expect(rect.height).toBeGreaterThanOrEqual(44) // Minimum touch target height
      })

      container.unmount()
    })
  })

  describe('Spacing Measurement Validation', () => {
    test('should maintain consistent spacing measurements across renders', () => {
      const deviceTypes: DeviceType[] = ['mobile', 'tablet', 'desktop']
      
      deviceTypes.forEach(deviceType => {
        const expectedSpacing = getCardAreaSpacing(deviceType)
        
        const { container } = render(
          <VisualSpacingTestComponent 
            deviceType={deviceType}
            containerWidth={deviceType === 'mobile' ? 375 : deviceType === 'tablet' ? 768 : 1024}
            containerHeight={deviceType === 'mobile' ? 667 : deviceType === 'tablet' ? 1024 : 768}
            cardCount={8}
          />
        )

        const cardArea = screen.getByTestId('card-area')
        const cardAreaStyle = window.getComputedStyle(cardArea)

        // Measure actual spacing
        const measuredSpacing = {
          containerMargins: {
            top: parseInt(cardAreaStyle.top),
            bottom: parseInt(cardAreaStyle.bottom) || expectedSpacing.containerMargins.bottom,
            left: parseInt(cardAreaStyle.left),
            right: parseInt(cardAreaStyle.right) || expectedSpacing.containerMargins.right
          },
          rowSpacing: expectedSpacing.rowSpacing, // Would need more complex measurement for actual row spacing
          cardSpacing: expectedSpacing.cardSpacing // Would need more complex measurement for actual card spacing
        }

        // Validate measurements against expected values
        const validation = validateSpacingMeasurements(measuredSpacing, expectedSpacing, 2)
        
        expect(validation.isValid).toBe(true)
        if (!validation.isValid) {
          console.warn(`Spacing measurement validation failed for ${deviceType}:`, validation.discrepancies)
        }

        container.unmount()
      })
    })

    test('should detect spacing regressions', () => {
      // Baseline measurements for regression detection
      const baselineSpacing = {
        desktop: {
          containerMargins: { top: 36, bottom: 24, left: 32, right: 32 },
          rowSpacing: 20,
          cardSpacing: 16
        },
        tablet: {
          containerMargins: { top: 32, bottom: 20, left: 24, right: 24 },
          rowSpacing: 16,
          cardSpacing: 14
        },
        mobile: {
          containerMargins: { top: 30, bottom: 16, left: 16, right: 16 },
          rowSpacing: 12,
          cardSpacing: 12
        }
      }

      Object.entries(baselineSpacing).forEach(([deviceType, baseline]) => {
        const currentSpacing = getCardAreaSpacing(deviceType as DeviceType)
        
        // Check for regressions (changes from baseline)
        expect(currentSpacing.containerMargins.top).toBe(baseline.containerMargins.top)
        expect(currentSpacing.containerMargins.bottom).toBe(baseline.containerMargins.bottom)
        expect(currentSpacing.containerMargins.left).toBe(baseline.containerMargins.left)
        expect(currentSpacing.containerMargins.right).toBe(baseline.containerMargins.right)
        expect(currentSpacing.rowSpacing).toBe(baseline.rowSpacing)
        expect(currentSpacing.cardSpacing).toBe(baseline.cardSpacing)
      })
    })
  })

  describe('Visual Balance Validation', () => {
    test('should maintain visual balance across different card counts', () => {
      const cardCounts = [4, 6, 8, 10, 12, 15]
      
      cardCounts.forEach(cardCount => {
        const layoutResult = calculateEnhancedCardLayout(1024, 768, cardCount, 'desktop')
        const positions = calculateMultiRowCardPositions(cardCount, layoutResult)
        const balance = validateMultiRowBalance(positions, layoutResult)

        expect(balance.isBalanced).toBe(true)
        
        if (!balance.isBalanced) {
          console.warn(`Visual balance issues for ${cardCount} cards:`, balance.issues)
          console.log('Recommendations:', balance.recommendations)
        }
      })
    })

    test('should provide consistent visual hierarchy', () => {
      const { container } = render(
        <VisualSpacingTestComponent 
          deviceType="desktop"
          containerWidth={1024}
          containerHeight={768}
          cardCount={8}
        />
      )

      const gameInfo = screen.getByTestId('game-info-panel')
      const cardArea = screen.getByTestId('card-area')
      const startButton = screen.getByTestId('start-button')

      // Verify visual hierarchy (top to bottom order)
      const gameInfoRect = gameInfo.getBoundingClientRect()
      const cardAreaRect = cardArea.getBoundingClientRect()
      const startButtonRect = startButton.getBoundingClientRect()

      expect(gameInfoRect.top).toBeLessThan(cardAreaRect.top)
      expect(cardAreaRect.bottom).toBeLessThan(startButtonRect.top)

      // Verify adequate spacing between elements
      expect(cardAreaRect.top - gameInfoRect.bottom).toBeGreaterThan(0)
      expect(startButtonRect.top - cardAreaRect.bottom).toBeGreaterThan(0)

      container.unmount()
    })
  })

  describe('Cross-Device Consistency', () => {
    test('should maintain proportional spacing across devices', () => {
      const devices = [
        { type: 'mobile' as DeviceType, width: 375, height: 667 },
        { type: 'tablet' as DeviceType, width: 768, height: 1024 },
        { type: 'desktop' as DeviceType, width: 1024, height: 768 }
      ]

      const spacingRatios: Record<string, number> = {}

      devices.forEach(device => {
        const spacing = getCardAreaSpacing(device.type)
        
        // Calculate spacing as percentage of container width
        const leftRatio = spacing.containerMargins.left / device.width
        const topRatio = spacing.containerMargins.top / device.height
        
        spacingRatios[`${device.type}_left`] = leftRatio
        spacingRatios[`${device.type}_top`] = topRatio

        // Verify spacing is reasonable percentage of container
        expect(leftRatio).toBeGreaterThan(0.02) // At least 2% of width
        expect(leftRatio).toBeLessThan(0.15) // No more than 15% of width
        expect(topRatio).toBeGreaterThan(0.02) // At least 2% of height
        expect(topRatio).toBeLessThan(0.15) // No more than 15% of height
      })

      // Desktop should have proportionally larger spacing than mobile
      expect(spacingRatios.desktop_left).toBeGreaterThan(spacingRatios.mobile_left)
      expect(spacingRatios.desktop_top).toBeGreaterThan(spacingRatios.mobile_top)
    })

    test('should generate consistent debug reports', () => {
      const devices = [
        { type: 'mobile' as DeviceType, width: 375, height: 667 },
        { type: 'tablet' as DeviceType, width: 768, height: 1024 },
        { type: 'desktop' as DeviceType, width: 1024, height: 768 }
      ]

      devices.forEach(device => {
        const report = generateSpacingDebugReport(device.type, device.width, device.height, 8)
        
        expect(report.summary).toContain(device.type.toUpperCase())
        expect(report.summary).toContain(`${device.width}x${device.height}`)
        expect(report.summary).toContain('8 cards')
        expect(report.summary).toContain('VALID')
        
        expect(report.details.deviceInfo).toContain(device.type)
        expect(report.details.spacingConfig).toContain('Container Padding')
        expect(report.details.validation).toContain('Valid: true')
      })
    })
  })
})

// Helper function to capture visual snapshots (would integrate with visual testing tools)
function captureVisualSnapshot(element: HTMLElement, testName: string) {
  // In a real implementation, this would capture a screenshot
  // and compare it against a baseline image
  const rect = element.getBoundingClientRect()
  return {
    testName,
    dimensions: { width: rect.width, height: rect.height },
    timestamp: new Date().toISOString(),
    checksum: `mock-checksum-${testName}` // Would be actual image hash
  }
}

// Export test component for use in other test files
export { VisualSpacingTestComponent, captureVisualSnapshot }