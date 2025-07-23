# Design Document

## Overview

This design addresses the critical card overflow issue in the CardFlipGame component where 6 cards extend beyond container boundaries. The solution focuses on fixing the core position calculation logic, implementing real-time boundary validation, and providing robust fallback mechanisms. The design ensures that all cards remain visible and interactive regardless of container size or device type.

## Architecture

The fix involves modifications to four main areas:

1. **Position Calculation Engine** - Fix the broken `calculateCardPositions` function
2. **Boundary Validation System** - Add real-time container boundary checking
3. **Adaptive Layout Logic** - Implement intelligent size and spacing adjustments
4. **Error Recovery Framework** - Provide comprehensive fallback mechanisms

## Root Cause Analysis

### Current Issues Identified

1. **Missing Function Reference**: `adaptiveCardAreaSpacing` function doesn't exist in layout-manager, causing immediate TypeError
2. **Multi-row Overflow**: Second row cards consistently overflow container bottom boundary for 4+ cards
3. **7+ Cards Dealing Failure**: Position calculation returns undefined values, causing dealing animation to freeze
4. **Cascade Failure**: Missing function causes entire position calculation chain to fail
5. **No Boundary Validation**: Calculated positions aren't checked against container limits
6. **Inadequate Error Recovery**: System doesn't gracefully handle undefined positions during dealing

### Error Flow Analysis

```typescript
// Current problematic flow for 4+ cards:
calculateCardPositions() 
  → require('@/lib/layout-manager').adaptiveCardAreaSpacing() // ❌ TypeError: function doesn't exist
  → catch block executes fallback // ❌ Fallback still produces overflow
  → calculateMultiRowCardPositions() // ❌ Second row positions exceed container height
  → dealCardsWithAnimation() // ❌ For 7+ cards: positions[i] is undefined
  → Cannot read properties of undefined (reading 'x') // ❌ Animation fails completely
```

### Specific Failure Scenarios

**4-5 Cards (Multi-row Overflow):**
- First row: 3 cards positioned correctly
- Second row: 1-2 cards positioned below container bottom boundary
- Cards are invisible/cut off but dealing completes

**7+ Cards (Complete Failure):**
- Position calculation fails entirely
- `positions` array contains undefined values
- Dealing animation accesses `positions[i].x` where `positions[i]` is undefined
- Animation freezes, game becomes unresponsive

## Components and Interfaces

### Enhanced Position Calculation System

**Fixed Position Calculation Function:**

```typescript
// Fixed calculateCardPositions function
const calculateCardPositions = useCallback((totalCards: number) => {
  try {
    // Get container dimensions with validation
    const containerWidth = typeof window !== 'undefined' ? window.innerWidth : 1024
    const containerHeight = typeof window !== 'undefined' ? window.innerHeight : 768
    
    // Validate container dimensions
    if (!isValidDimension(containerWidth, containerHeight)) {
      throw new Error(`Invalid container dimensions: ${containerWidth}x${containerHeight}`)
    }
    
    // Detect device type
    const deviceType = detectDeviceType(containerWidth)
    
    // Calculate available space for cards (accounting for UI elements)
    const availableSpace = calculateAvailableCardSpace(
      containerWidth,
      containerHeight,
      {
        hasGameInfo: true,
        hasWarnings: warnings.length > 0,
        hasStartButton: gameState.gamePhase === 'idle',
        hasResultDisplay: gameState.gamePhase === 'finished'
      }
    )
    
    // Use corrected enhanced layout calculation
    const enhancedLayout = calculateEnhancedCardLayout(
      availableSpace.width,
      availableSpace.height,
      totalCards,
      deviceType
    )
    
    // Apply boundary-aware positioning
    const enhancedPositions = calculateBoundaryAwarePositions(totalCards, enhancedLayout, availableSpace)
    
    // Validate all positions against container boundaries
    const validatedPositions = validateAndCorrectPositions(enhancedPositions, availableSpace)
    
    // Convert to compatible format
    const positions = validatedPositions.map(pos => ({
      x: pos.x,
      y: pos.y,
      rotation: pos.rotation,
      cardWidth: pos.cardWidth,
      cardHeight: pos.cardHeight
    }))
    
    // Final boundary check
    const boundaryCheck = validatePositionBoundaries(positions, availableSpace)
    if (!boundaryCheck.isValid) {
      console.warn('Position boundary violations detected:', boundaryCheck.violations)
      return createSafeGridLayout(totalCards, availableSpace)
    }
    
    return positions
    
  } catch (error) {
    console.error('Error in card position calculation:', error)
    
    // Enhanced fallback with container awareness
    return createContainerAwareFallback(totalCards, containerWidth, containerHeight)
  }
}, [warnings.length, gameState.gamePhase, items.length])
```

### Available Space Calculation

**New Function to Calculate Card Area:**

```typescript
interface AvailableCardSpace {
  width: number
  height: number
  offsetX: number
  offsetY: number
  maxCardWidth: number
  maxCardHeight: number
}

function calculateAvailableCardSpace(
  containerWidth: number,
  containerHeight: number,
  uiElements: {
    hasGameInfo?: boolean
    hasWarnings?: boolean
    hasStartButton?: boolean
    hasResultDisplay?: boolean
  }
): AvailableCardSpace {
  const deviceType = detectDeviceType(containerWidth)
  const spacingConfig = getSpacingConfig(deviceType)
  
  // Calculate UI element heights
  let topOffset = spacingConfig.containerPadding.y
  let bottomOffset = spacingConfig.containerPadding.y
  
  if (uiElements.hasGameInfo) {
    topOffset += 120 + spacingConfig.uiElementSpacing.gameInfo
  }
  
  topOffset += 40 + spacingConfig.uiElementSpacing.gameStatus // Game status
  
  if (uiElements.hasStartButton) {
    bottomOffset += 80 + spacingConfig.uiElementSpacing.startButton
  }
  
  if (uiElements.hasWarnings) {
    topOffset += 60 + spacingConfig.uiElementSpacing.warnings
  }
  
  // Calculate available space
  const availableWidth = containerWidth - (spacingConfig.containerPadding.x * 2)
  const availableHeight = containerHeight - topOffset - bottomOffset
  
  // Ensure minimum space
  const minWidth = Math.max(200, availableWidth)
  const minHeight = Math.max(150, availableHeight)
  
  return {
    width: minWidth,
    height: minHeight,
    offsetX: spacingConfig.containerPadding.x,
    offsetY: topOffset,
    maxCardWidth: Math.floor(minWidth / 2), // Maximum card width (for 2+ columns)
    maxCardHeight: Math.floor(minHeight / 3) // Maximum card height (for 2+ rows)
  }
}
```

### Boundary-Aware Position Calculation

**Enhanced Multi-Row Positioning:**

```typescript
function calculateBoundaryAwarePositions(
  cardCount: number,
  layoutResult: EnhancedLayoutResult,
  availableSpace: AvailableCardSpace
): EnhancedCardPosition[] {
  const positions: EnhancedCardPosition[] = []
  const deviceConfig = getDeviceConfig(layoutResult.deviceType)
  
  // Determine optimal layout for card count
  const layoutConfig = determineOptimalLayout(cardCount, availableSpace)
  
  // Calculate card size that fits within boundaries
  const cardSize = calculateOptimalCardSize(layoutConfig, availableSpace)
  
  // Calculate spacing that prevents overflow
  const spacing = calculateSafeSpacing(layoutConfig, cardSize, availableSpace)
  
  // Generate positions with boundary constraints
  let cardIndex = 0
  for (let row = 0; row < layoutConfig.rows && cardIndex < cardCount; row++) {
    const cardsInRow = Math.min(layoutConfig.cardsPerRow, cardCount - row * layoutConfig.cardsPerRow)
    
    // Calculate row positioning
    const rowWidth = cardsInRow * cardSize.width + (cardsInRow - 1) * spacing.horizontal
    const rowStartX = (availableSpace.width - rowWidth) / 2
    const rowY = row * (cardSize.height + spacing.vertical) + (availableSpace.height - (layoutConfig.rows * cardSize.height + (layoutConfig.rows - 1) * spacing.vertical)) / 2
    
    for (let col = 0; col < cardsInRow && cardIndex < cardCount; col++) {
      const cardX = rowStartX + col * (cardSize.width + spacing.horizontal) + cardSize.width / 2
      const cardY = rowY + cardSize.height / 2
      
      positions.push({
        x: cardX,
        y: cardY,
        rotation: (Math.random() - 0.5) * 2, // Reduced rotation for better fit
        cardWidth: cardSize.width,
        cardHeight: cardSize.height,
        row,
        col,
        isLastRow: row === layoutConfig.rows - 1,
        isRowCentered: cardsInRow < layoutConfig.cardsPerRow
      })
      
      cardIndex++
    }
  }
  
  return positions
}

interface LayoutConfig {
  rows: number
  cardsPerRow: number
  totalCards: number
}

function determineOptimalLayout(cardCount: number, availableSpace: AvailableCardSpace): LayoutConfig {
  // Special handling for 6 cards
  if (cardCount === 6) {
    const aspectRatio = availableSpace.width / availableSpace.height
    
    if (aspectRatio > 1.5) {
      // Wide container: prefer 2 rows of 3
      return { rows: 2, cardsPerRow: 3, totalCards: cardCount }
    } else {
      // Tall container: prefer 3 rows of 2
      return { rows: 3, cardsPerRow: 2, totalCards: cardCount }
    }
  }
  
  // General layout calculation
  const maxCardsPerRow = Math.floor(availableSpace.width / 100) // Minimum 100px per card
  const optimalCardsPerRow = Math.min(maxCardsPerRow, Math.ceil(Math.sqrt(cardCount)))
  const rows = Math.ceil(cardCount / optimalCardsPerRow)
  
  return {
    rows,
    cardsPerRow: optimalCardsPerRow,
    totalCards: cardCount
  }
}

function calculateOptimalCardSize(
  layoutConfig: LayoutConfig,
  availableSpace: AvailableCardSpace
): { width: number; height: number } {
  // Calculate maximum possible card size
  const maxWidth = Math.floor((availableSpace.width - (layoutConfig.cardsPerRow - 1) * 16) / layoutConfig.cardsPerRow)
  const maxHeight = Math.floor((availableSpace.height - (layoutConfig.rows - 1) * 16) / layoutConfig.rows)
  
  // Apply aspect ratio constraints (standard playing card ratio)
  const cardAspectRatio = 2 / 3 // height / width
  
  let cardWidth = Math.min(maxWidth, availableSpace.maxCardWidth)
  let cardHeight = Math.min(maxHeight, availableSpace.maxCardHeight)
  
  // Maintain aspect ratio
  if (cardWidth * cardAspectRatio > cardHeight) {
    cardWidth = Math.floor(cardHeight / cardAspectRatio)
  } else {
    cardHeight = Math.floor(cardWidth * cardAspectRatio)
  }
  
  // Ensure minimum size
  cardWidth = Math.max(60, cardWidth)
  cardHeight = Math.max(90, cardHeight)
  
  return { width: cardWidth, height: cardHeight }
}

function calculateSafeSpacing(
  layoutConfig: LayoutConfig,
  cardSize: { width: number; height: number },
  availableSpace: AvailableCardSpace
): { horizontal: number; vertical: number } {
  // Calculate remaining space for spacing
  const totalCardWidth = layoutConfig.cardsPerRow * cardSize.width
  const totalCardHeight = layoutConfig.rows * cardSize.height
  
  const remainingWidth = availableSpace.width - totalCardWidth
  const remainingHeight = availableSpace.height - totalCardHeight
  
  // Distribute remaining space as spacing
  const horizontalSpacing = layoutConfig.cardsPerRow > 1 
    ? Math.max(8, Math.floor(remainingWidth / (layoutConfig.cardsPerRow - 1)))
    : 0
    
  const verticalSpacing = layoutConfig.rows > 1
    ? Math.max(8, Math.floor(remainingHeight / (layoutConfig.rows - 1)))
    : 0
  
  return {
    horizontal: Math.min(horizontalSpacing, 24), // Cap spacing at 24px
    vertical: Math.min(verticalSpacing, 20)     // Cap spacing at 20px
  }
}
```

### Position Validation and Correction

**Boundary Validation System:**

```typescript
interface BoundaryValidationResult {
  isValid: boolean
  violations: Array<{
    cardIndex: number
    position: { x: number; y: number }
    violation: 'left' | 'right' | 'top' | 'bottom'
    overflow: number
  }>
  correctedPositions?: EnhancedCardPosition[]
}

function validatePositionBoundaries(
  positions: CardPosition[],
  availableSpace: AvailableCardSpace
): BoundaryValidationResult {
  const violations: BoundaryValidationResult['violations'] = []
  
  positions.forEach((pos, index) => {
    const cardLeft = pos.x - pos.cardWidth / 2
    const cardRight = pos.x + pos.cardWidth / 2
    const cardTop = pos.y - pos.cardHeight / 2
    const cardBottom = pos.y + pos.cardHeight / 2
    
    // Check boundaries
    if (cardLeft < 0) {
      violations.push({
        cardIndex: index,
        position: { x: pos.x, y: pos.y },
        violation: 'left',
        overflow: Math.abs(cardLeft)
      })
    }
    
    if (cardRight > availableSpace.width) {
      violations.push({
        cardIndex: index,
        position: { x: pos.x, y: pos.y },
        violation: 'right',
        overflow: cardRight - availableSpace.width
      })
    }
    
    if (cardTop < 0) {
      violations.push({
        cardIndex: index,
        position: { x: pos.x, y: pos.y },
        violation: 'top',
        overflow: Math.abs(cardTop)
      })
    }
    
    if (cardBottom > availableSpace.height) {
      violations.push({
        cardIndex: index,
        position: { x: pos.x, y: pos.y },
        violation: 'bottom',
        overflow: cardBottom - availableSpace.height
      })
    }
  })
  
  return {
    isValid: violations.length === 0,
    violations
  }
}

function validateAndCorrectPositions(
  positions: EnhancedCardPosition[],
  availableSpace: AvailableCardSpace
): EnhancedCardPosition[] {
  return positions.map(pos => {
    const cardLeft = pos.x - pos.cardWidth / 2
    const cardRight = pos.x + pos.cardWidth / 2
    const cardTop = pos.y - pos.cardHeight / 2
    const cardBottom = pos.y + pos.cardHeight / 2
    
    let correctedX = pos.x
    let correctedY = pos.y
    
    // Correct horizontal overflow
    if (cardLeft < 0) {
      correctedX = pos.cardWidth / 2
    } else if (cardRight > availableSpace.width) {
      correctedX = availableSpace.width - pos.cardWidth / 2
    }
    
    // Correct vertical overflow
    if (cardTop < 0) {
      correctedY = pos.cardHeight / 2
    } else if (cardBottom > availableSpace.height) {
      correctedY = availableSpace.height - pos.cardHeight / 2
    }
    
    return {
      ...pos,
      x: correctedX,
      y: correctedY
    }
  })
}
```

### 7+ Cards Dealing Failure Fix

**Robust Position Array Generation:**

```typescript
function ensureValidPositionArray(
  cardCount: number,
  availableSpace: AvailableCardSpace
): CardPosition[] {
  const positions: CardPosition[] = []
  
  // Guarantee that we always return exactly cardCount positions
  for (let i = 0; i < cardCount; i++) {
    // Calculate safe position for each card
    const safePosition = calculateSafePositionForIndex(i, cardCount, availableSpace)
    
    // Validate position before adding
    if (safePosition && typeof safePosition.x === 'number' && typeof safePosition.y === 'number') {
      positions.push(safePosition)
    } else {
      // Emergency fallback for individual card
      positions.push(createEmergencyCardPosition(i, availableSpace))
    }
  }
  
  // Final validation - ensure array length matches card count
  if (positions.length !== cardCount) {
    console.error(`Position array length mismatch: expected ${cardCount}, got ${positions.length}`)
    return createGuaranteedPositionArray(cardCount, availableSpace)
  }
  
  return positions
}

function calculateSafePositionForIndex(
  index: number,
  totalCards: number,
  availableSpace: AvailableCardSpace
): CardPosition | null {
  try {
    // Determine layout that can handle any number of cards
    const layoutConfig = determineScalableLayout(totalCards, availableSpace)
    const cardSize = calculateScalableCardSize(layoutConfig, availableSpace)
    const spacing = calculateMinimalSpacing(layoutConfig, cardSize, availableSpace)
    
    const row = Math.floor(index / layoutConfig.cardsPerRow)
    const col = index % layoutConfig.cardsPerRow
    
    // Calculate position with boundary safety
    const cardsInRow = Math.min(layoutConfig.cardsPerRow, totalCards - row * layoutConfig.cardsPerRow)
    const rowWidth = cardsInRow * cardSize.width + (cardsInRow - 1) * spacing.horizontal
    const rowStartX = (availableSpace.width - rowWidth) / 2
    
    const totalGridHeight = layoutConfig.rows * cardSize.height + (layoutConfig.rows - 1) * spacing.vertical
    const gridStartY = (availableSpace.height - totalGridHeight) / 2
    
    const cardX = rowStartX + col * (cardSize.width + spacing.horizontal) + cardSize.width / 2
    const cardY = gridStartY + row * (cardSize.height + spacing.vertical) + cardSize.height / 2
    
    // Boundary check
    if (cardX - cardSize.width/2 < 0 || cardX + cardSize.width/2 > availableSpace.width ||
        cardY - cardSize.height/2 < 0 || cardY + cardSize.height/2 > availableSpace.height) {
      return null // Position would overflow
    }
    
    return {
      x: cardX,
      y: cardY,
      rotation: 0, // No rotation for high card counts to ensure stability
      cardWidth: cardSize.width,
      cardHeight: cardSize.height
    }
  } catch (error) {
    console.error(`Failed to calculate position for card ${index}:`, error)
    return null
  }
}

function determineScalableLayout(cardCount: number, availableSpace: AvailableCardSpace): LayoutConfig {
  // For 7+ cards, use more conservative layout to prevent overflow
  if (cardCount >= 7) {
    const maxCardsPerRow = Math.max(2, Math.floor(availableSpace.width / 70)) // Minimum 70px per card
    const optimalCardsPerRow = Math.min(maxCardsPerRow, Math.ceil(Math.sqrt(cardCount)))
    const rows = Math.ceil(cardCount / optimalCardsPerRow)
    
    // Ensure layout fits in available height
    const minCardHeight = 80
    const minSpacing = 8
    const requiredHeight = rows * minCardHeight + (rows - 1) * minSpacing
    
    if (requiredHeight > availableSpace.height) {
      // Reduce rows by increasing cards per row
      const maxPossibleRows = Math.floor((availableSpace.height + minSpacing) / (minCardHeight + minSpacing))
      const adjustedRows = Math.max(1, maxPossibleRows)
      const adjustedCardsPerRow = Math.ceil(cardCount / adjustedRows)
      
      return {
        rows: adjustedRows,
        cardsPerRow: adjustedCardsPerRow,
        totalCards: cardCount
      }
    }
    
    return {
      rows,
      cardsPerRow: optimalCardsPerRow,
      totalCards: cardCount
    }
  }
  
  // For 4-6 cards, use existing logic but with overflow protection
  return determineOptimalLayout(cardCount, availableSpace)
}

function calculateScalableCardSize(
  layoutConfig: LayoutConfig,
  availableSpace: AvailableCardSpace
): { width: number; height: number } {
  // More aggressive size reduction for high card counts
  const minSpacing = 8
  const maxWidth = Math.floor((availableSpace.width - (layoutConfig.cardsPerRow - 1) * minSpacing) / layoutConfig.cardsPerRow)
  const maxHeight = Math.floor((availableSpace.height - (layoutConfig.rows - 1) * minSpacing) / layoutConfig.rows)
  
  // Ensure cards are small enough to fit
  let cardWidth = Math.max(50, Math.min(maxWidth, 100)) // Smaller max size for scalability
  let cardHeight = Math.max(75, Math.min(maxHeight, 150))
  
  // Maintain aspect ratio but prioritize fitting
  const cardAspectRatio = 1.5 // height / width (slightly less tall for better fit)
  
  if (cardWidth * cardAspectRatio > cardHeight) {
    cardWidth = Math.floor(cardHeight / cardAspectRatio)
  } else {
    cardHeight = Math.floor(cardWidth * cardAspectRatio)
  }
  
  return { width: cardWidth, height: cardHeight }
}

function createEmergencyCardPosition(index: number, availableSpace: AvailableCardSpace): CardPosition {
  // Ultra-safe fallback position
  const cardSize = { width: 50, height: 75 }
  const spacing = 8
  const cardsPerRow = Math.floor(availableSpace.width / (cardSize.width + spacing))
  
  const row = Math.floor(index / cardsPerRow)
  const col = index % cardsPerRow
  
  return {
    x: col * (cardSize.width + spacing) + cardSize.width / 2 + spacing,
    y: row * (cardSize.height + spacing) + cardSize.height / 2 + spacing,
    rotation: 0,
    cardWidth: cardSize.width,
    cardHeight: cardSize.height
  }
}

function createGuaranteedPositionArray(cardCount: number, availableSpace: AvailableCardSpace): CardPosition[] {
  const positions: CardPosition[] = []
  const cardSize = { width: 50, height: 75 }
  const spacing = 6
  
  // Simple grid that guarantees no overflow
  const cardsPerRow = Math.max(1, Math.floor(availableSpace.width / (cardSize.width + spacing)))
  
  for (let i = 0; i < cardCount; i++) {
    const row = Math.floor(i / cardsPerRow)
    const col = i % cardsPerRow
    
    positions.push({
      x: col * (cardSize.width + spacing) + cardSize.width / 2 + spacing,
      y: row * (cardSize.height + spacing) + cardSize.height / 2 + spacing,
      rotation: 0,
      cardWidth: cardSize.width,
      cardHeight: cardSize.height
    })
  }
  
  return positions
}

### Enhanced Fallback System

**Container-Aware Fallback:**

```typescript
function createContainerAwareFallback(
  cardCount: number,
  containerWidth: number,
  containerHeight: number
): CardPosition[] {
  console.warn(`Using container-aware fallback for ${cardCount} cards`)
  
  const availableSpace = calculateAvailableCardSpace(containerWidth, containerHeight, {
    hasGameInfo: true,
    hasWarnings: false,
    hasStartButton: false,
    hasResultDisplay: false
  })
  
  // Use guaranteed position generation for fallback
  return ensureValidPositionArray(cardCount, availableSpace)
}

function createSafeGridLayout(
  cardCount: number,
  availableSpace: AvailableCardSpace
): CardPosition[] {
  const positions: CardPosition[] = []
  
  // Use conservative grid layout
  const maxCardsPerRow = Math.max(1, Math.floor(availableSpace.width / 80)) // Minimum 80px per card
  const cardsPerRow = Math.min(maxCardsPerRow, cardCount)
  const rows = Math.ceil(cardCount / cardsPerRow)
  
  // Calculate safe card size
  const cardWidth = Math.floor((availableSpace.width - (cardsPerRow - 1) * 12) / cardsPerRow)
  const cardHeight = Math.floor((availableSpace.height - (rows - 1) * 12) / rows)
  
  // Ensure minimum size
  const safeCardWidth = Math.max(60, Math.min(cardWidth, 120))
  const safeCardHeight = Math.max(90, Math.min(cardHeight, 180))
  
  // Calculate grid positioning
  const totalGridWidth = cardsPerRow * safeCardWidth + (cardsPerRow - 1) * 12
  const totalGridHeight = rows * safeCardHeight + (rows - 1) * 12
  
  const startX = (availableSpace.width - totalGridWidth) / 2
  const startY = (availableSpace.height - totalGridHeight) / 2
  
  for (let i = 0; i < cardCount; i++) {
    const row = Math.floor(i / cardsPerRow)
    const col = i % cardsPerRow
    
    positions.push({
      x: startX + col * (safeCardWidth + 12) + safeCardWidth / 2,
      y: startY + row * (safeCardHeight + 12) + safeCardHeight / 2,
      rotation: 0,
      cardWidth: safeCardWidth,
      cardHeight: safeCardHeight
    })
  }
  
  return positions
}
```

## Error Handling

### Comprehensive Error Recovery

1. **Function Missing Errors** - Replace missing `adaptiveCardAreaSpacing` with built-in calculations
2. **Boundary Violations** - Automatically correct positions that exceed container limits
3. **Calculation Failures** - Provide safe grid layout as ultimate fallback
4. **Invalid Dimensions** - Validate and sanitize all input dimensions

### Logging and Debugging

```typescript
// Enhanced logging for debugging
if (process.env.NODE_ENV === 'development') {
  console.group('🎯 Card Position Debug')
  console.log('Container:', { width: containerWidth, height: containerHeight })
  console.log('Available Space:', availableSpace)
  console.log('Layout Config:', layoutConfig)
  console.log('Card Size:', cardSize)
  console.log('Positions:', positions)
  console.log('Boundary Check:', boundaryCheck)
  console.groupEnd()
}
```

## Testing Strategy

### Unit Tests
1. **Position Calculation Tests** - Test with various card counts and container sizes
2. **Boundary Validation Tests** - Test overflow detection and correction
3. **Fallback System Tests** - Test error recovery mechanisms

### Integration Tests
1. **6-Card Layout Tests** - Specific tests for the common 6-card scenario
2. **Container Resize Tests** - Test position updates during window resizing
3. **Multi-Device Tests** - Test across different screen sizes and device types

### Visual Regression Tests
1. **Container Boundary Tests** - Verify no cards extend beyond visible area
2. **Layout Balance Tests** - Verify optimal spacing and distribution
3. **Responsive Layout Tests** - Test layout adaptation across screen sizes

## Implementation Priority

### Phase 1: Core Fix (High Priority)
- Fix `calculateCardPositions` function
- Implement `calculateAvailableCardSpace`
- Add basic boundary validation

### Phase 2: Enhanced Validation (Medium Priority)
- Implement comprehensive position validation
- Add automatic position correction
- Enhance error logging

### Phase 3: Optimization (Low Priority)
- Optimize 6-card specific layouts
- Add visual debugging tools
- Performance optimizations