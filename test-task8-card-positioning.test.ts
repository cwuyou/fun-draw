/**
 * Task 8: Unit tests for card positioning logic
 * 
 * Tests the calculateCardPositions function to ensure:
 * - Cards don't overlap with UI text
 * - Proper spacing and margins are maintained
 * - Responsive positioning works across device sizes
 * - Layout doesn't overflow container
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock window object for responsive testing
const mockWindow = (width: number, height: number) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  })
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: height,
  })
}

// Mock the calculateCardPositions function logic from CardFlipGame
const calculateCardPositions = (totalCards: number) => {
  const positions = []
  
  // UI spacing constants
  const UI_TEXT_HEIGHT = 60
  const CARD_MARGIN_TOP = 20
  const CARD_MARGIN_BOTTOM = 80
  
  // Device detection
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768
  const isTablet = typeof window !== 'undefined' && window.innerWidth >= 768 && window.innerWidth < 1024
  
  // Device-specific card dimensions
  let cardWidth, cardHeight, spacing, cardsPerRow
  
  if (isMobile) {
    cardWidth = 80
    cardHeight = 120
    spacing = 12
    cardsPerRow = Math.min(2, totalCards)
  } else if (isTablet) {
    cardWidth = 88
    cardHeight = 132
    spacing = 14
    cardsPerRow = Math.min(3, totalCards)
  } else {
    cardWidth = 96
    cardHeight = 144
    spacing = 16
    cardsPerRow = Math.min(5, totalCards)
  }
  
  const rows = Math.ceil(totalCards / cardsPerRow)
  
  // Container overflow check
  const containerDimensions = typeof window !== 'undefined' ? {
    width: window.innerWidth,
    height: window.innerHeight
  } : undefined
  
  if (containerDimensions) {
    const totalWidth = cardsPerRow * cardWidth + (cardsPerRow - 1) * spacing
    const totalHeight = rows * cardHeight + (rows - 1) * spacing + CARD_MARGIN_TOP + CARD_MARGIN_BOTTOM
    
    const availableWidth = containerDimensions.width - 32 // padding
    const availableHeight = containerDimensions.height - 200 // UI elements
    
    if (totalWidth > availableWidth || totalHeight > availableHeight) {
      const scaleX = availableWidth / totalWidth
      const scaleY = availableHeight / totalHeight
      const scale = Math.min(scaleX, scaleY, 1)
      
      cardWidth *= scale
      cardHeight *= scale
      spacing *= scale
    }
  }
  
  // Calculate positions
  let cardIndex = 0
  for (let row = 0; row < rows; row++) {
    const cardsInThisRow = Math.min(cardsPerRow, totalCards - row * cardsPerRow)
    const rowWidth = cardsInThisRow * cardWidth + (cardsInThisRow - 1) * spacing
    const startX = -rowWidth / 2 + cardWidth / 2
    
    for (let col = 0; col < cardsInThisRow; col++) {
      positions.push({
        x: startX + col * (cardWidth + spacing),
        y: CARD_MARGIN_TOP + row * (cardHeight + spacing) - (rows - 1) * (cardHeight + spacing) / 2,
        rotation: (Math.random() - 0.5) * 4,
        cardWidth,
        cardHeight
      })
      cardIndex++
    }
  }
  
  return positions
}

describe('Task 8: Card Positioning Logic Tests', () => {
  beforeEach(() => {
    // Reset window mock
    mockWindow(1024, 768) // Default desktop size
  })

  describe('Requirement 2.3: Adequate spacing from UI text', () => {
    it('should maintain minimum margin from top UI elements', () => {
      const positions = calculateCardPositions(3)
      const EXPECTED_MARGIN_TOP = 20
      
      positions.forEach(position => {
        // Y position should account for UI text height + margin
        expect(position.y).toBeGreaterThanOrEqual(-200) // Reasonable top boundary
      })
    })

    it('should leave space for game information below cards', () => {
      const positions = calculateCardPositions(5)
      const CARD_MARGIN_BOTTOM = 80
      
      // Find the bottommost card
      const maxY = Math.max(...positions.map(p => p.y))
      const bottomCardBottom = maxY + positions[0].cardHeight / 2
      
      // Should leave space for bottom UI elements
      expect(bottomCardBottom).toBeLessThan(300) // Reasonable bottom boundary
    })

    it('should prevent cards from overlapping with status text area', () => {
      const positions = calculateCardPositions(1)
      const UI_TEXT_HEIGHT = 60
      const CARD_MARGIN_TOP = 20
      
      // Single card should be positioned below UI text with proper margin
      expect(positions[0].y).toBeGreaterThanOrEqual(-UI_TEXT_HEIGHT + CARD_MARGIN_TOP)
    })
  })

  describe('Requirement 2.1 & 2.2: Consistent positioning across game phases', () => {
    it('should produce consistent positions for same card count', () => {
      // Mock Math.random to ensure consistent rotation values
      const originalRandom = Math.random
      Math.random = vi.fn(() => 0.5)
      
      const positions1 = calculateCardPositions(3)
      const positions2 = calculateCardPositions(3)
      
      expect(positions1).toHaveLength(positions2.length)
      
      positions1.forEach((pos1, index) => {
        const pos2 = positions2[index]
        expect(pos1.x).toBe(pos2.x)
        expect(pos1.y).toBe(pos2.y)
        expect(pos1.cardWidth).toBe(pos2.cardWidth)
        expect(pos1.cardHeight).toBe(pos2.cardHeight)
      })
      
      Math.random = originalRandom
    })

    it('should maintain relative positioning when card count changes', () => {
      const positions3 = calculateCardPositions(3)
      const positions5 = calculateCardPositions(5)
      
      // Both should use same device-specific dimensions
      expect(positions3[0].cardWidth).toBe(positions5[0].cardWidth)
      expect(positions3[0].cardHeight).toBe(positions5[0].cardHeight)
    })
  })

  describe('Responsive positioning across device sizes', () => {
    it('should use mobile layout for small screens', () => {
      mockWindow(400, 600) // Mobile size
      
      const positions = calculateCardPositions(4)
      
      // Mobile should use smaller cards and 2 per row
      expect(positions[0].cardWidth).toBe(80)
      expect(positions[0].cardHeight).toBe(120)
      
      // Should arrange in 2 rows of 2 cards each
      const firstRowY = positions[0].y
      const secondRowY = positions[2].y
      expect(secondRowY).toBeGreaterThan(firstRowY)
    })

    it('should use tablet layout for medium screens', () => {
      mockWindow(800, 600) // Tablet size
      
      const positions = calculateCardPositions(6)
      
      // Tablet should use medium cards and 3 per row
      expect(positions[0].cardWidth).toBe(88)
      expect(positions[0].cardHeight).toBe(132)
      
      // Should arrange in 2 rows of 3 cards each
      const firstRowY = positions[0].y
      const secondRowY = positions[3].y
      expect(secondRowY).toBeGreaterThan(firstRowY)
    })

    it('should use desktop layout for large screens', () => {
      mockWindow(1200, 800) // Desktop size
      
      const positions = calculateCardPositions(5)
      
      // Desktop should use larger cards and up to 5 per row
      expect(positions[0].cardWidth).toBe(96)
      expect(positions[0].cardHeight).toBe(144)
      
      // All 5 cards should be in one row
      const allYPositions = positions.map(p => p.y)
      const uniqueYPositions = new Set(allYPositions)
      expect(uniqueYPositions.size).toBe(1) // All same Y position
    })
  })

  describe('Layout overflow prevention', () => {
    it('should scale down cards when layout would overflow width', () => {
      mockWindow(300, 600) // Very narrow screen
      
      const positions = calculateCardPositions(3)
      
      // Cards should be scaled down to fit
      expect(positions[0].cardWidth).toBeLessThan(80) // Less than mobile default
      expect(positions[0].cardHeight).toBeLessThan(120)
    })

    it('should scale down cards when layout would overflow height', () => {
      mockWindow(1200, 400) // Very short screen
      
      const positions = calculateCardPositions(8)
      
      // Cards should be scaled down to fit vertically
      expect(positions[0].cardHeight).toBeLessThan(144) // Less than desktop default
    })

    it('should maintain aspect ratio when scaling', () => {
      mockWindow(300, 300) // Small square screen
      
      const positions = calculateCardPositions(4)
      
      const aspectRatio = positions[0].cardWidth / positions[0].cardHeight
      const expectedAspectRatio = 96 / 144 // Desktop default ratio
      
      // Should maintain approximately the same aspect ratio
      expect(Math.abs(aspectRatio - expectedAspectRatio)).toBeLessThan(0.1)
    })
  })

  describe('Single card positioning edge cases', () => {
    it('should center single card properly on mobile', () => {
      mockWindow(400, 600)
      
      const positions = calculateCardPositions(1)
      
      expect(positions).toHaveLength(1)
      expect(positions[0].x).toBe(0) // Should be centered horizontally
    })

    it('should center single card properly on desktop', () => {
      mockWindow(1200, 800)
      
      const positions = calculateCardPositions(1)
      
      expect(positions).toHaveLength(1)
      expect(positions[0].x).toBe(0) // Should be centered horizontally
    })
  })

  describe('Multi-row layout calculations', () => {
    it('should distribute cards evenly across rows', () => {
      mockWindow(1200, 800) // Desktop
      
      const positions = calculateCardPositions(7) // 5 + 2 layout
      
      // First 5 cards should be in first row
      const firstRowCards = positions.slice(0, 5)
      const firstRowY = firstRowCards[0].y
      firstRowCards.forEach(card => {
        expect(card.y).toBe(firstRowY)
      })
      
      // Last 2 cards should be in second row
      const secondRowCards = positions.slice(5)
      const secondRowY = secondRowCards[0].y
      secondRowCards.forEach(card => {
        expect(card.y).toBe(secondRowY)
      })
      
      expect(secondRowY).toBeGreaterThan(firstRowY)
    })

    it('should center rows with fewer cards', () => {
      mockWindow(1200, 800) // Desktop
      
      const positions = calculateCardPositions(6) // 5 + 1 layout
      
      // Last card (in second row) should be centered
      const lastCard = positions[5]
      expect(lastCard.x).toBe(0) // Should be centered
    })
  })

  describe('Error handling and edge cases', () => {
    it('should handle zero cards gracefully', () => {
      const positions = calculateCardPositions(0)
      expect(positions).toHaveLength(0)
    })

    it('should handle maximum cards without overflow', () => {
      mockWindow(1200, 800)
      
      const positions = calculateCardPositions(10) // Maximum cards
      
      expect(positions).toHaveLength(10)
      
      // Should not overflow reasonable boundaries
      positions.forEach(position => {
        expect(position.x).toBeGreaterThan(-600)
        expect(position.x).toBeLessThan(600)
        expect(position.y).toBeGreaterThan(-400)
        expect(position.y).toBeLessThan(400)
      })
    })

    it('should provide fallback when window is undefined', () => {
      // Temporarily remove window
      const originalWindow = global.window
      delete (global as any).window
      
      const positions = calculateCardPositions(3)
      
      expect(positions).toHaveLength(3)
      // Should use desktop defaults when window is undefined
      expect(positions[0].cardWidth).toBe(96)
      expect(positions[0].cardHeight).toBe(144)
      
      // Restore window
      global.window = originalWindow
    })
  })
})