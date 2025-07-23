# Design Document

## Overview

This design addresses the visual layout issues in the card flip lottery system when displaying more than 5 cards. The solution focuses on improving card spacing, multi-row layout balance, and evaluating the necessity of the "剩余卡牌" (remaining cards) display. The design ensures proper visual hierarchy and spacing across all device types while maintaining the existing functionality.

## Architecture

The solution involves modifications to three main areas:

1. **Enhanced Spacing System** - Improve card area margins and inter-card spacing
2. **Multi-Row Layout Optimization** - Better arrangement for cards in multiple rows
3. **UI Element Evaluation** - Assess and optimize the remaining cards display

## Components and Interfaces

### Enhanced Card Area Spacing System

**Current Issue Analysis:**
From the screenshots provided, the main issues are:
- Cards are positioned too close to container borders
- Multi-row layouts (6+ cards) lack proper vertical spacing between rows
- The second row with fewer cards appears unbalanced
- Overall layout feels cramped

**Design Solution:**

```typescript
// Enhanced spacing configuration for card areas
interface CardAreaSpacing {
  containerMargins: {
    desktop: { top: 36, bottom: 24, left: 32, right: 32 }
    tablet: { top: 32, bottom: 20, left: 24, right: 24 }
    mobile: { top: 30, bottom: 16, left: 16, right: 16 }
  }
  
  rowSpacing: {
    desktop: 20  // Vertical spacing between card rows
    tablet: 16
    mobile: 12
  }
  
  cardSpacing: {
    desktop: 16  // Horizontal spacing between cards
    tablet: 14
    mobile: 12
  }
  
  minCardAreaHeight: {
    desktop: 200
    tablet: 180
    mobile: 160
  }
}

// Enhanced layout calculation with proper spacing
function calculateEnhancedCardLayout(
  containerWidth: number,
  containerHeight: number,
  cardCount: number,
  deviceType: DeviceType
): EnhancedLayoutResult {
  const spacing = getCardAreaSpacing(deviceType)
  const deviceConfig = getDeviceConfig(deviceType)
  
  // Calculate available space after applying proper margins
  const availableWidth = containerWidth - spacing.containerMargins[deviceType].left - spacing.containerMargins[deviceType].right
  const availableHeight = containerHeight - spacing.containerMargins[deviceType].top - spacing.containerMargins[deviceType].bottom
  
  // Calculate optimal cards per row based on available width
  const cardWidth = deviceConfig.cardSize.width
  const cardSpacing = spacing.cardSpacing[deviceType]
  
  const maxCardsPerRow = Math.floor((availableWidth + cardSpacing) / (cardWidth + cardSpacing))
  const actualCardsPerRow = Math.min(maxCardsPerRow, deviceConfig.cardsPerRow, cardCount)
  
  // Calculate number of rows needed
  const rows = Math.ceil(cardCount / actualCardsPerRow)
  
  // Calculate total grid dimensions
  const totalGridWidth = actualCardsPerRow * cardWidth + (actualCardsPerRow - 1) * cardSpacing
  const totalGridHeight = rows * deviceConfig.cardSize.height + (rows - 1) * spacing.rowSpacing[deviceType]
  
  // Ensure grid fits within available space
  if (totalGridWidth > availableWidth || totalGridHeight > availableHeight) {
    // Apply fallback spacing if needed
    return calculateFallbackCardLayout(containerWidth, containerHeight, cardCount, deviceType)
  }
  
  return {
    availableWidth,
    availableHeight,
    actualCardsPerRow,
    rows,
    totalGridWidth,
    totalGridHeight,
    spacing,
    isOptimal: true
  }
}
```

### Multi-Row Card Positioning System

**Design Solution:**

```typescript
// Enhanced position calculation for multi-row layouts
function calculateMultiRowCardPositions(
  cardCount: number,
  layoutResult: EnhancedLayoutResult
): CardPosition[] {
  const positions: CardPosition[] = []
  const { actualCardsPerRow, rows, spacing, totalGridWidth, totalGridHeight } = layoutResult
  const deviceConfig = getDeviceConfig(layoutResult.deviceType)
  
  // Calculate grid starting position (centered in available space)
  const gridStartX = -totalGridWidth / 2
  const gridStartY = -totalGridHeight / 2
  
  let cardIndex = 0
  
  for (let row = 0; row < rows && cardIndex < cardCount; row++) {
    // Calculate cards in current row
    const cardsInThisRow = Math.min(actualCardsPerRow, cardCount - row * actualCardsPerRow)
    
    // Calculate row width and starting X position for centering
    const rowWidth = cardsInThisRow * deviceConfig.cardSize.width + (cardsInThisRow - 1) * spacing.cardSpacing[layoutResult.deviceType]
    const rowStartX = -rowWidth / 2
    
    // Calculate Y position for this row
    const rowY = gridStartY + row * (deviceConfig.cardSize.height + spacing.rowSpacing[layoutResult.deviceType])
    
    for (let col = 0; col < cardsInThisRow && cardIndex < cardCount; col++) {
      // Calculate card center position
      const cardX = rowStartX + col * (deviceConfig.cardSize.width + spacing.cardSpacing[layoutResult.deviceType]) + deviceConfig.cardSize.width / 2
      const cardY = rowY + deviceConfig.cardSize.height / 2
      
      positions.push({
        x: cardX,
        y: cardY,
        rotation: (Math.random() - 0.5) * 3, // Slight random rotation for natural look
        cardWidth: deviceConfig.cardSize.width,
        cardHeight: deviceConfig.cardSize.height,
        row,
        col,
        isLastRow: row === rows - 1,
        isRowCentered: cardsInThisRow < actualCardsPerRow
      })
      
      cardIndex++
    }
  }
  
  return positions
}
```

### UI Element Spacing Integration

**Design Solution:**

```typescript
// Enhanced UI element spacing that considers card area
function calculateUIElementSpacingWithCardArea(
  deviceType: DeviceType,
  hasMultipleRows: boolean
): UIElementSpacing {
  const baseSpacing = getSpacingConfig(deviceType)
  const cardAreaSpacing = getCardAreaSpacing(deviceType)
  
  // Adjust spacing based on card layout complexity
  const complexityMultiplier = hasMultipleRows ? 1.2 : 1.0
  
  return {
    gameInfoToCardArea: Math.round(cardAreaSpacing.containerMargins[deviceType].top * complexityMultiplier),
    cardAreaToStartButton: Math.round(cardAreaSpacing.containerMargins[deviceType].bottom * complexityMultiplier),
    cardAreaToResult: Math.max(40, Math.round(baseSpacing.uiElementSpacing.resultDisplay * complexityMultiplier)),
    gameStatusToCardArea: Math.round(baseSpacing.uiElementSpacing.gameStatus * complexityMultiplier)
  }
}
```

### Remaining Cards Display Evaluation

**Current Analysis:**
The "剩余卡牌" display shows:
- 抽取数量 (Draw quantity)
- 名单数量 (List quantity) 
- 未中奖 (Not won)
- 已中奖 (Won)
- 剩余卡牌 (Remaining cards)

**Design Recommendation:**

```typescript
// Simplified game info display
interface OptimizedGameInfo {
  essential: {
    drawQuantity: number      // Keep - shows what user requested
    totalItems: number        // Keep - shows available pool size
    currentPhase: GamePhase   // Keep - shows current game state
  }
  
  optional: {
    remainingCards?: number   // Remove - not essential during gameplay
    wonCount?: number         // Simplify - only show after completion
    notWonCount?: number      // Remove - can be calculated
  }
  
  displayMode: 'minimal' | 'detailed'
}

// Conditional display logic
function shouldShowRemainingCards(gamePhase: GamePhase, cardCount: number): boolean {
  // Only show during specific phases and when it adds value
  return gamePhase === 'finished' && cardCount > 6
}

function getOptimizedGameInfoDisplay(
  gameState: GameState,
  deviceType: DeviceType
): OptimizedGameInfo {
  const isMinimalMode = deviceType === 'mobile' || gameState.gamePhase === 'waiting'
  
  return {
    essential: {
      drawQuantity: gameState.quantity,
      totalItems: gameState.items.length,
      currentPhase: gameState.gamePhase
    },
    optional: {
      remainingCards: shouldShowRemainingCards(gameState.gamePhase, gameState.cards.length) 
        ? gameState.cards.length - gameState.revealedCards.size 
        : undefined
    },
    displayMode: isMinimalMode ? 'minimal' : 'detailed'
  }
}
```

## Data Models

### Enhanced Layout Configuration

```typescript
interface EnhancedLayoutResult {
  availableWidth: number
  availableHeight: number
  actualCardsPerRow: number
  rows: number
  totalGridWidth: number
  totalGridHeight: number
  spacing: CardAreaSpacing
  deviceType: DeviceType
  isOptimal: boolean
  fallbackApplied?: boolean
}

interface CardPosition {
  x: number
  y: number
  rotation: number
  cardWidth: number
  cardHeight: number
  row: number
  col: number
  isLastRow: boolean
  isRowCentered: boolean
}
```

### Spacing Validation

```typescript
interface SpacingValidation {
  isValid: boolean
  violations: {
    containerMargins?: string[]
    rowSpacing?: string[]
    cardSpacing?: string[]
  }
  recommendations: string[]
  fallbackRequired: boolean
}
```

## Implementation Strategy

### Phase 1: Enhanced Spacing System
1. Update spacing configuration constants
2. Modify layout calculation to use enhanced spacing
3. Add spacing validation functions

### Phase 2: Multi-Row Layout Optimization
1. Implement enhanced position calculation
2. Add row centering logic
3. Improve visual balance for uneven rows

### Phase 3: UI Element Optimization
1. Evaluate remaining cards display necessity
2. Implement conditional display logic
3. Simplify game info panel

### Phase 4: Integration and Testing
1. Integrate all components
2. Test across device types
3. Validate spacing requirements

## Visual Improvements

### Before (Current Issues):
- Cards too close to borders
- Unbalanced multi-row layouts
- Cluttered information display
- Poor visual hierarchy

### After (Expected Results):
- Proper margins from container borders
- Balanced and centered multi-row layouts
- Clean, focused information display
- Clear visual hierarchy

## Performance Considerations

- Spacing calculations should be lightweight
- Position updates should be smooth
- Layout recalculation should be efficient
- Memory usage should remain minimal

## Accessibility Considerations

- Maintain proper touch targets on mobile
- Ensure adequate spacing for screen readers
- Preserve keyboard navigation flow
- Keep focus indicators visible

## Testing Strategy

### Visual Testing
1. Test with 6, 8, 10 cards across device types
2. Verify spacing measurements match requirements
3. Test layout balance and centering

### Functional Testing
1. Ensure game functionality remains intact
2. Test responsive behavior
3. Validate performance impact

### User Experience Testing
1. Evaluate information display clarity
2. Test visual hierarchy effectiveness
3. Validate spacing comfort across devices