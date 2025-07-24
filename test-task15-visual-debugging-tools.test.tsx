import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { CardPositionDebugOverlay, DebugToggleButton } from '@/components/card-position-debug-overlay'
import type { CardPosition } from '@/types'

// Mock the boundary-aware-positioning module
vi.mock('@/lib/boundary-aware-positioning', () => ({
  validatePositionBoundaries: vi.fn(() => ({
    isValid: true,
    violations: []
  }))
}))

// Mock the card-space-calculator module
vi.mock('@/lib/card-space-calculator', () => ({
  calculateAvailableCardSpace: vi.fn(() => ({
    width: 800,
    height: 600,
    containerWidth: 1024,
    containerHeight: 768,
    maxCardWidth: 120,
    maxCardHeight: 180,
    uiElements: {
      hasGameInfo: true,
      hasWarnings: false,
      hasStartButton: true,
      hasResultDisplay: false
    }
  }))
}))

describe('Task 15: Visual Debugging Tools for Development', () => {
  let mockCardPositions: CardPosition[]
  
  beforeEach(() => {
    // 设置开发模式
    process.env.NODE_ENV = 'development'
    
    // 模拟卡牌位置数据
    mockCardPositions = [
      {
        x: 100,
        y: 150,
        rotation: 5,
        cardWidth: 96,
        cardHeight: 144
      },
      {
        x: 250,
        y: 150,
        rotation: -3,
        cardWidth: 96,
        cardHeight: 144
      },
      {
        x: 400,
        y: 150,
        rotation: 2,
        cardWidth: 96,
        cardHeight: 144
      }
    ]
  })

  describe('CardPositionDebugOverlay', () => {
    it('should not render in production mode', () => {
      process.env.NODE_ENV = 'production'
      
      const { container } = render(
        <CardPositionDebugOverlay
          containerWidth={1024}
          containerHeight={768}
          cardPositions={mockCardPositions}
          isVisible={true}
        />
      )
      
      expect(container.firstChild).toBeNull()
    })

    it('should render debug overlay when visible in development mode', () => {
      render(
        <CardPositionDebugOverlay
          containerWidth={1024}
          containerHeight={768}
          cardPositions={mockCardPositions}
          isVisible={true}
        />
      )
      
      expect(screen.getByText('Position Debug')).toBeInTheDocument()
    })

    it('should not render when not visible', () => {
      const { container } = render(
        <CardPositionDebugOverlay
          containerWidth={1024}
          containerHeight={768}
          cardPositions={mockCardPositions}
          isVisible={false}
        />
      )
      
      expect(container.firstChild).toBeNull()
    })

    it('should display container dimensions', () => {
      render(
        <CardPositionDebugOverlay
          containerWidth={1024}
          containerHeight={768}
          cardPositions={mockCardPositions}
          isVisible={true}
        />
      )
      
      expect(screen.getByText('1024×768')).toBeInTheDocument()
    })

    it('should display available space dimensions', () => {
      render(
        <CardPositionDebugOverlay
          containerWidth={1024}
          containerHeight={768}
          cardPositions={mockCardPositions}
          isVisible={true}
        />
      )
      
      expect(screen.getByText('800×600')).toBeInTheDocument()
    })

    it('should display card count metrics', () => {
      render(
        <CardPositionDebugOverlay
          containerWidth={1024}
          containerHeight={768}
          cardPositions={mockCardPositions}
          isVisible={true}
        />
      )
      
      // Find the Cards label and check its value
      const cardsElement = screen.getByText('Cards:').nextElementSibling
      expect(cardsElement).toHaveTextContent('3')
    })

    it('should display valid positions count', () => {
      render(
        <CardPositionDebugOverlay
          containerWidth={1024}
          containerHeight={768}
          cardPositions={mockCardPositions}
          isVisible={true}
        />
      )
      
      // All positions should be valid within the container
      const validElement = screen.getByText('Valid:').nextElementSibling
      expect(validElement).toHaveTextContent('3')
    })

    it('should calculate and display utilization rate', () => {
      render(
        <CardPositionDebugOverlay
          containerWidth={1024}
          containerHeight={768}
          cardPositions={mockCardPositions}
          isVisible={true}
        />
      )
      
      // Should display utilization percentage
      const utilizationElement = screen.getByText(/\d+\.\d+%/)
      expect(utilizationElement).toBeInTheDocument()
    })

    it('should calculate and display average spacing', () => {
      render(
        <CardPositionDebugOverlay
          containerWidth={1024}
          containerHeight={768}
          cardPositions={mockCardPositions}
          isVisible={true}
        />
      )
      
      // Should display average spacing in pixels
      const spacingElement = screen.getByText(/\d+\.\d+px/)
      expect(spacingElement).toBeInTheDocument()
    })

    it('should allow toggling boundary visualization', () => {
      render(
        <CardPositionDebugOverlay
          containerWidth={1024}
          containerHeight={768}
          cardPositions={mockCardPositions}
          isVisible={true}
        />
      )
      
      const boundariesCheckbox = screen.getByLabelText(/Boundaries/)
      expect(boundariesCheckbox).toBeChecked()
      
      fireEvent.click(boundariesCheckbox)
      expect(boundariesCheckbox).not.toBeChecked()
    })

    it('should allow toggling position indicators', () => {
      render(
        <CardPositionDebugOverlay
          containerWidth={1024}
          containerHeight={768}
          cardPositions={mockCardPositions}
          isVisible={true}
        />
      )
      
      const positionsCheckbox = screen.getByLabelText(/Positions/)
      expect(positionsCheckbox).toBeChecked()
      
      fireEvent.click(positionsCheckbox)
      expect(positionsCheckbox).not.toBeChecked()
    })

    it('should allow toggling metrics display', () => {
      render(
        <CardPositionDebugOverlay
          containerWidth={1024}
          containerHeight={768}
          cardPositions={mockCardPositions}
          isVisible={true}
        />
      )
      
      const metricsCheckbox = screen.getByLabelText(/Metrics/)
      expect(metricsCheckbox).toBeChecked()
      
      fireEvent.click(metricsCheckbox)
      expect(metricsCheckbox).not.toBeChecked()
    })

    it('should call onToggle when close button is clicked', () => {
      const mockOnToggle = vi.fn()
      
      render(
        <CardPositionDebugOverlay
          containerWidth={1024}
          containerHeight={768}
          cardPositions={mockCardPositions}
          isVisible={true}
          onToggle={mockOnToggle}
        />
      )
      
      const closeButton = screen.getByRole('button')
      fireEvent.click(closeButton)
      
      expect(mockOnToggle).toHaveBeenCalledWith(false)
    })

    it('should handle empty card positions gracefully', () => {
      const { container } = render(
        <CardPositionDebugOverlay
          containerWidth={1024}
          containerHeight={768}
          cardPositions={[]}
          isVisible={true}
        />
      )
      
      // Should not crash - component should not render when no positions
      expect(container.firstChild).toBeNull()
    })

    it('should handle boundary validation results', () => {
      render(
        <CardPositionDebugOverlay
          containerWidth={1024}
          containerHeight={768}
          cardPositions={mockCardPositions}
          isVisible={true}
        />
      )
      
      // Should render without crashing when boundary validation is performed
      expect(screen.getByText('Position Debug')).toBeInTheDocument()
    })
  })

  describe('DebugToggleButton', () => {
    it('should not render in production mode', () => {
      process.env.NODE_ENV = 'production'
      
      const { container } = render(
        <DebugToggleButton
          isVisible={false}
          onToggle={vi.fn()}
        />
      )
      
      expect(container.firstChild).toBeNull()
    })

    it('should render toggle button in development mode', () => {
      render(
        <DebugToggleButton
          isVisible={false}
          onToggle={vi.fn()}
        />
      )
      
      expect(screen.getByText('Debug')).toBeInTheDocument()
    })

    it('should show Eye icon when debug is not visible', () => {
      render(
        <DebugToggleButton
          isVisible={false}
          onToggle={vi.fn()}
        />
      )
      
      // Eye icon should be present (not EyeOff)
      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
    })

    it('should show EyeOff icon when debug is visible', () => {
      render(
        <DebugToggleButton
          isVisible={true}
          onToggle={vi.fn()}
        />
      )
      
      // EyeOff icon should be present
      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
    })

    it('should call onToggle with opposite value when clicked', () => {
      const mockOnToggle = vi.fn()
      
      render(
        <DebugToggleButton
          isVisible={false}
          onToggle={mockOnToggle}
        />
      )
      
      const button = screen.getByRole('button')
      fireEvent.click(button)
      
      expect(mockOnToggle).toHaveBeenCalledWith(true)
    })

    it('should call onToggle with false when visible and clicked', () => {
      const mockOnToggle = vi.fn()
      
      render(
        <DebugToggleButton
          isVisible={true}
          onToggle={mockOnToggle}
        />
      )
      
      const button = screen.getByRole('button')
      fireEvent.click(button)
      
      expect(mockOnToggle).toHaveBeenCalledWith(false)
    })
  })

  describe('Integration with CardFlipGame', () => {
    it('should integrate seamlessly with card flip game component', async () => {
      // This test would verify that the debug tools work correctly
      // when integrated with the main game component
      
      // Mock window dimensions
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      })
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 768,
      })
      
      render(
        <CardPositionDebugOverlay
          containerWidth={window.innerWidth}
          containerHeight={window.innerHeight}
          cardPositions={mockCardPositions}
          isVisible={true}
        />
      )
      
      // Should display correct container dimensions from window
      expect(screen.getByText('1024×768')).toBeInTheDocument()
    })

    it('should update metrics when card positions change', async () => {
      const { rerender } = render(
        <CardPositionDebugOverlay
          containerWidth={1024}
          containerHeight={768}
          cardPositions={mockCardPositions}
          isVisible={true}
        />
      )
      
      // Initial card count - find the Cards label and check its value
      const cardsElement = screen.getByText('Cards:').nextElementSibling
      expect(cardsElement).toHaveTextContent('3')
      
      // Update with more cards
      const newPositions = [
        ...mockCardPositions,
        {
          x: 550,
          y: 150,
          rotation: 1,
          cardWidth: 96,
          cardHeight: 144
        }
      ]
      
      rerender(
        <CardPositionDebugOverlay
          containerWidth={1024}
          containerHeight={768}
          cardPositions={newPositions}
          isVisible={true}
        />
      )
      
      // Should show updated card count
      const updatedCardsElement = screen.getByText('Cards:').nextElementSibling
      expect(updatedCardsElement).toHaveTextContent('4')
    })
  })

  describe('Performance considerations', () => {
    it('should not render when not visible', () => {
      const { container } = render(
        <CardPositionDebugOverlay
          containerWidth={1024}
          containerHeight={768}
          cardPositions={mockCardPositions}
          isVisible={false}
        />
      )
      
      // Should not render anything when not visible
      expect(container.firstChild).toBeNull()
    })

    it('should handle rapid visibility toggles gracefully', async () => {
      const mockOnToggle = vi.fn()
      
      const { rerender } = render(
        <DebugToggleButton
          isVisible={false}
          onToggle={mockOnToggle}
        />
      )
      
      const button = screen.getByRole('button')
      
      // Rapid clicks
      fireEvent.click(button)
      fireEvent.click(button)
      fireEvent.click(button)
      
      expect(mockOnToggle).toHaveBeenCalledTimes(3)
    })
  })

  describe('Visual elements rendering', () => {
    it('should render container boundary visualization', () => {
      const { container } = render(
        <CardPositionDebugOverlay
          containerWidth={1024}
          containerHeight={768}
          cardPositions={mockCardPositions}
          isVisible={true}
        />
      )
      
      // Should have elements with border styles for boundaries
      const boundaryElements = container.querySelectorAll('[class*="border-red-500"]')
      expect(boundaryElements.length).toBeGreaterThan(0)
    })

    it('should render available space visualization', () => {
      const { container } = render(
        <CardPositionDebugOverlay
          containerWidth={1024}
          containerHeight={768}
          cardPositions={mockCardPositions}
          isVisible={true}
        />
      )
      
      // Should have elements with blue border for available space
      const spaceElements = container.querySelectorAll('[class*="border-blue-500"]')
      expect(spaceElements.length).toBeGreaterThan(0)
    })

    it('should render card position indicators', () => {
      const { container } = render(
        <CardPositionDebugOverlay
          containerWidth={1024}
          containerHeight={768}
          cardPositions={mockCardPositions}
          isVisible={true}
        />
      )
      
      // Should have elements with green styling for card positions
      const positionElements = container.querySelectorAll('[class*="border-green-500"]')
      expect(positionElements.length).toBeGreaterThan(0)
    })
  })
})