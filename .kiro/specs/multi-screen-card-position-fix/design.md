# Design Document

## Overview

This design addresses the critical multi-screen positioning bug in the card flip lottery system by implementing robust error handling, position validation, and safe fallback mechanisms. The solution focuses on preventing "Cannot read properties of undefined (reading 'x')" errors when users move browser windows between screens of different sizes, while maintaining smooth position transitions and preserving game state.

## Architecture

The fix involves modifications to four main areas:

1. **Position Calculation System** - Add comprehensive validation and error handling
2. **Window Resize Handler** - Implement safe position recalculation with fallbacks
3. **Layout Manager** - Enhance robustness for multi-screen scenarios
4. **Error Recovery System** - Provide graceful degradation when calculations fail

## Components and Interfaces

### Enhanced Position Validation System

**Current Issue Analysis:**
The error occurs in the window resize handler when `newPositions[index]` returns `undefined`, causing the subsequent access to `.x`, `.y`, etc. properties to fail. This happens when:
- Position calculation returns fewer positions than expected
- Array index is out of bounds
- Position calculation encounters an error and returns partial results

**Design Solution:**

```typescript
// Position validation interface
interface PositionValidationResult {
  isValid: boolean
  position?: CardPosition
  error?: string
  fallbackApplied?: boolean
}

// Enhanced position validation function
function validateCardPosition(
  position: any, 
  index: number, 
  expectedCount: number
): PositionValidationResult {
  // Check if position exists
  if (!position) {
    return {
      isValid: false,
      error: `Position at index ${index} is undefined`,
      fallbackApplied: false
    }
  }

  // Check if position has required properties
  const requiredProps = ['x', 'y', 'rotation', 'cardWidth', 'cardHeight']
  const missingProps = requiredProps.filter(prop => 
    typeof position[prop] !== 'number' || isNaN(position[prop])
  )

  if (missingProps.length > 0) {
    return {
      isValid: false,
      error: `Position at index ${index} missing properties: ${missingProps.join(', ')}`,
      fallbackApplied: false
    }
  }

  // Validate position values are reasonable
  if (Math.abs(position.x) > 10000 || Math.abs(position.y) > 10000) {
    return {
      isValid: false,
      error: `Position at index ${index} has extreme values: x=${position.x}, y=${position.y}`,
      fallbackApplied: false
    }
  }

  return {
    isValid: true,
    position: position as CardPosition
  }
}

// Safe position access function
function getSafeCardPosition(
  positions: CardPosition[], 
  index: number, 
  fallbackPosition: CardPosition
): CardPosition {
  // Validate array bounds
  if (!Array.isArray(positions) || index < 0 || index >= positions.length) {
    console.warn(`Position array access out of bounds: index ${index}, length ${positions?.length || 0}`)
    return fallbackPosition
  }

  // Validate position object
  const validation = validateCardPosition(positions[index], index, positions.length)
  
  if (!validation.isValid) {
    console.warn(`Invalid position at index ${index}: ${validation.error}`)
    return fallbackPosition
  }

  return validation.position!
}
```

### Enhanced Window Resize Handler

**Current Issue:**
The resize handler directly accesses `newPositions[index]` without validation, causing crashes when the position is undefined.

**Design Solution:**

```typescript
// Enhanced resize handler with comprehensive error handling
useEffect(() => {
  let resizeTimeout: NodeJS.Timeout | null = null
  let isResizing = false
  
  const handleResize = () => {
    // Prevent multiple simultaneous resize operations
    if (isResizing) {
      console.log('Resize already in progress, skipping')
      return
    }

    // Clear previous timeout
    if (resizeTimeout) {
      clearTimeout(resizeTimeout)
    }
    
    resizeTimeout = setTimeout(() => {
      // Only proceed if we have cards to reposition
      if (!gameState.cards || gameState.cards.length === 0) {
        console.log('No cards to reposition')
        return
      }

      isResizing = true
      
      try {
        // Get current container dimensions
        const containerWidth = window.innerWidth
        const containerHeight = window.innerHeight
        
        console.log(`Resize detected: ${containerWidth}x${containerHeight}`)
        
        // Determine current UI state for layout calculation
        const uiOptions = {
          hasGameInfo: true,
          hasWarnings: warnings.length > 0,
          hasStartButton: gameState.gamePhase === 'idle',
          hasResultDisplay: gameState.gamePhase === 'finished'
        }
        
        // Recalculate layout with error handling
        let layoutResult
        try {
          layoutResult = calculateLayout(
            containerWidth,
            containerHeight,
            gameState.cards.length,
            items.length,
            uiOptions
          )
        } catch (layoutError) {
          console.error('Layout calculation failed during resize:', layoutError)
          // Use fallback layout
          layoutResult = createFallbackLayout(containerWidth, containerHeight, gameState.cards.length)
        }
        
        // Calculate new positions with validation
        let newPositions: CardPosition[]
        try {
          newPositions = calculateCardPositions(gameState.cards.length)
        } catch (positionError) {
          console.error('Position calculation failed during resize:', positionError)
          // Create fallback positions
          newPositions = createFallbackPositions(gameState.cards.length, layoutResult.deviceConfig)
        }
        
        // Validate position array length
        if (newPositions.length !== gameState.cards.length) {
          console.warn(`Position count mismatch: expected ${gameState.cards.length}, got ${newPositions.length}`)
          // Extend or truncate positions as needed
          newPositions = normalizePositionArray(newPositions, gameState.cards.length, layoutResult.deviceConfig)
        }
        
        // Apply new positions with validation
        setGameState(prev => ({
          ...prev,
          cards: prev.cards.map((card, index) => {
            // Get safe position with fallback
            const fallbackPosition = createSingleFallbackPosition(index, layoutResult.deviceConfig)
            const newPosition = getSafeCardPosition(newPositions, index, fallbackPosition)
            
            return {
              ...card,
              position: newPosition,
              style: {
                ...card.style,
                // Ensure smooth transition
                transform: `translate(${newPosition.x}px, ${newPosition.y}px) rotate(${newPosition.rotation}deg)`,
                width: `${newPosition.cardWidth}px`,
                height: `${newPosition.cardHeight}px`,
                marginLeft: `-${newPosition.cardWidth / 2}px`,
                marginTop: `-${newPosition.cardHeight / 2}px`,
                transition: 'transform 0.3s ease-out, width 0.3s ease-out, height 0.3s ease-out, margin 0.3s ease-out'
              }
            }
          })
        }))
        
        // Debug logging
        if (process.env.NODE_ENV === 'development') {
          console.log('Window resized - Layout recalculated:', getLayoutDebugInfo(layoutResult))
          console.log('New positions applied:', newPositions.length)
        }
        
      } catch (error) {
        console.error('Critical error during window resize handling:', error)
        // Apply emergency fallback - reset to center positions
        setGameState(prev => ({
          ...prev,
          cards: prev.cards.map((card, index) => ({
            ...card,
            position: {
              x: 0,
              y: index * 20 - (prev.cards.length - 1) * 10, // Stack vertically in center
              rotation: 0,
              cardWidth: 96,
              cardHeight: 144
            },
            style: {
              ...card.style,
              transform: `translate(0px, ${index * 20 - (prev.cards.length - 1) * 10}px) rotate(0deg)`,
              width: '96px',
              height: '144px',
              marginLeft: '-48px',
              marginTop: '-72px',
              transition: 'transform 0.3s ease-out'
            }
          }))
        }))
      } finally {
        isResizing = false
        resizeTimeout = null
      }
    }, 150) // Debounce delay
  }

  // Add resize event listener
  window.addEventListener('resize', handleResize)
  
  // Cleanup function
  return () => {
    window.removeEventListener('resize', handleResize)
    if (resizeTimeout) {
      clearTimeout(resizeTimeout)
    }
  }
}, [gameState.cards.length, gameState.gamePhase, calculateCardPositions, warnings.length, items.length])
```

### Fallback Position System

**Design Solution:**

```typescript
// Fallback layout creation
function createFallbackLayout(
  containerWidth: number, 
  containerHeight: number, 
  cardCount: number
): LayoutCalculationResult {
  const deviceType = detectDeviceType(containerWidth)
  const deviceConfig = getDeviceConfig(deviceType)
  
  // Use conservative margins
  const safeMargins = {
    top: 100,
    bottom: 100,
    left: 50,
    right: 50,
    horizontal: 100,
    vertical: 200
  }
  
  const containerDimensions = {
    width: containerWidth,
    height: containerHeight,
    availableWidth: Math.max(200, containerWidth - 100),
    availableHeight: Math.max(200, containerHeight - 200)
  }
  
  return {
    deviceConfig,
    containerDimensions,
    safeMargins,
    maxSafeCards: Math.max(1, cardCount),
    recommendedCards: cardCount,
    fallbackApplied: true
  }
}

// Fallback position creation
function createFallbackPositions(
  cardCount: number, 
  deviceConfig: DeviceConfig
): CardPosition[] {
  const positions: CardPosition[] = []
  const { cardSize } = deviceConfig
  
  // Create simple grid layout
  const cardsPerRow = Math.min(3, cardCount)
  const rows = Math.ceil(cardCount / cardsPerRow)
  
  for (let i = 0; i < cardCount; i++) {
    const row = Math.floor(i / cardsPerRow)
    const col = i % cardsPerRow
    
    // Center the grid
    const gridWidth = cardsPerRow * (cardSize.width + 16) - 16
    const gridHeight = rows * (cardSize.height + 16) - 16
    
    positions.push({
      x: col * (cardSize.width + 16) - gridWidth / 2 + cardSize.width / 2,
      y: row * (cardSize.height + 16) - gridHeight / 2 + cardSize.height / 2,
      rotation: 0,
      cardWidth: cardSize.width,
      cardHeight: cardSize.height
    })
  }
  
  return positions
}

// Single fallback position
function createSingleFallbackPosition(
  index: number, 
  deviceConfig: DeviceConfig
): CardPosition {
  return {
    x: 0,
    y: index * 20 - 50, // Stack vertically
    rotation: 0,
    cardWidth: deviceConfig.cardSize.width,
    cardHeight: deviceConfig.cardSize.height
  }
}

// Normalize position array length
function normalizePositionArray(
  positions: CardPosition[], 
  expectedLength: number, 
  deviceConfig: DeviceConfig
): CardPosition[] {
  if (positions.length === expectedLength) {
    return positions
  }
  
  if (positions.length > expectedLength) {
    // Truncate excess positions
    return positions.slice(0, expectedLength)
  }
  
  // Extend with fallback positions
  const normalized = [...positions]
  for (let i = positions.length; i < expectedLength; i++) {
    normalized.push(createSingleFallbackPosition(i, deviceConfig))
  }
  
  return normalized
}
```

### Enhanced Layout Manager

**Design Solution:**

```typescript
// Enhanced calculateLayout with better error handling
export function calculateLayout(
  containerWidth: number,
  containerHeight: number,
  requestedQuantity: number,
  itemCount: number,
  uiOptions: {
    hasGameInfo?: boolean
    hasWarnings?: boolean
    hasStartButton?: boolean
    hasResultDisplay?: boolean
  } = {}
): LayoutCalculationResult {
  try {
    // Input validation with detailed logging
    if (!isValidDimension(containerWidth) || !isValidDimension(containerHeight)) {
      console.warn(`Invalid container dimensions: ${containerWidth}x${containerHeight}`)
      throw new Error(`Invalid container dimensions: ${containerWidth}x${containerHeight}`)
    }

    if (requestedQuantity < 0 || itemCount < 0) {
      console.warn(`Invalid quantities: requested=${requestedQuantity}, items=${itemCount}`)
      throw new Error(`Invalid quantities: requested=${requestedQuantity}, items=${itemCount}`)
    }

    // Proceed with normal calculation
    const deviceType = detectDeviceType(containerWidth)
    return calculateLayoutWithPerformance(
      calculateLayoutInternal,
      containerWidth,
      containerHeight,
      requestedQuantity,
      itemCount,
      uiOptions,
      deviceType
    )
    
  } catch (error) {
    console.error('Layout calculation failed, using fallback:', error)
    return createFallbackLayout(containerWidth, containerHeight, requestedQuantity)
  }
}

// Dimension validation helper
function isValidDimension(value: number): boolean {
  return typeof value === 'number' && 
         !isNaN(value) && 
         isFinite(value) && 
         value > 0 && 
         value < 50000 // Reasonable upper limit
}
```

## Data Models

### Enhanced Position Interface

```typescript
interface CardPosition {
  x: number
  y: number
  rotation: number
  cardWidth: number
  cardHeight: number
  // Add validation metadata
  isValidated?: boolean
  isFallback?: boolean
  validationError?: string
}

interface PositionCalculationContext {
  containerWidth: number
  containerHeight: number
  cardCount: number
  deviceType: DeviceType
  timestamp: number
  fallbackApplied: boolean
}
```

### Error Tracking

```typescript
interface ResizeError {
  timestamp: number
  error: Error
  context: {
    containerWidth: number
    containerHeight: number
    cardCount: number
    gamePhase: string
  }
  recovery: 'fallback' | 'retry' | 'ignore'
}
```

## Error Handling

### Position Access Errors

```typescript
enum PositionError {
  UNDEFINED_POSITION = 'Position object is undefined',
  MISSING_PROPERTIES = 'Position missing required properties',
  INVALID_VALUES = 'Position contains invalid numeric values',
  ARRAY_BOUNDS = 'Position array index out of bounds',
  CALCULATION_FAILED = 'Position calculation encountered an error'
}
```

### Recovery Strategies

1. **Immediate Fallback** - Use safe default positions when calculation fails
2. **Graceful Degradation** - Maintain game state while fixing positions
3. **Error Logging** - Comprehensive logging for debugging
4. **User Notification** - Optional user notification for critical errors

## Testing Strategy

### Unit Tests

1. **Position Validation Tests**
   - Test position object validation with various invalid inputs
   - Test array bounds checking with different array sizes
   - Test fallback position generation

2. **Resize Handler Tests**
   - Test resize handling with valid and invalid position arrays
   - Test error recovery mechanisms
   - Test debouncing behavior

3. **Layout Calculation Tests**
   - Test layout calculation with extreme container dimensions
   - Test fallback layout generation
   - Test device type detection edge cases

### Integration Tests

1. **Multi-Screen Simulation Tests**
   - Simulate window movement between different screen sizes
   - Test position recalculation across device type boundaries
   - Test game state preservation during resize events

2. **Error Scenario Tests**
   - Test behavior when position calculation throws errors
   - Test recovery from undefined position arrays
   - Test handling of corrupted game state

### Performance Tests

1. **Resize Performance Tests**
   - Test resize handling performance with many cards
   - Test debouncing effectiveness
   - Test memory usage during frequent resizes

## Implementation Notes

### Phase 1: Core Error Handling
- Add position validation functions
- Implement safe position access
- Add comprehensive error logging

### Phase 2: Enhanced Resize Handler
- Update resize handler with validation
- Add fallback position system
- Implement error recovery

### Phase 3: Layout Manager Improvements
- Enhance layout calculation robustness
- Add input validation
- Improve error reporting

### Phase 4: Testing and Validation
- Comprehensive test coverage
- Multi-screen testing
- Performance optimization

### Performance Considerations
- Position validation should be lightweight
- Fallback calculations should be fast
- Error logging should not impact performance
- Memory cleanup for error tracking