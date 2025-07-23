# Card Layout Spacing System Documentation

## Overview

The enhanced spacing system provides comprehensive card area spacing management for the card flip lottery game. It ensures proper visual balance, responsive design, and optimal user experience across all device types.

## Core Features

- **Device-specific spacing configurations** for mobile, tablet, and desktop
- **Card area specific margins** separate from general UI spacing
- **Multi-row layout optimization** with balanced positioning
- **Responsive spacing adaptation** based on screen size and aspect ratio
- **Spacing validation and debugging tools** for development
- **Performance optimized** with caching and memoization

## Configuration Structure

### Card Area Spacing Configuration

```typescript
interface CardAreaSpacing {
  containerMargins: {
    top: number     // Space between game info and card area
    bottom: number  // Space between card area and start button
    left: number    // Left margin from container border
    right: number   // Right margin from container border
  }
  rowSpacing: number        // Vertical spacing between card rows
  cardSpacing: number       // Horizontal spacing between cards
  minCardAreaHeight: number // Minimum required card area height
}
```

### Device-Specific Values

| Device  | Container Margins (T/B/L/R) | Row Spacing | Card Spacing | Min Height |
|---------|----------------------------|-------------|--------------|------------|
| Mobile  | 30/16/16/16px             | 12px        | 12px         | 160px      |
| Tablet  | 32/20/24/24px             | 16px        | 14px         | 180px      |
| Desktop | 36/24/32/32px             | 20px        | 16px         | 200px      |

## Usage Examples

### Basic Usage with useDynamicSpacing Hook

```typescript
import { useDynamicSpacing } from '@/hooks/use-dynamic-spacing'

function CardFlipGame() {
  const spacing = useDynamicSpacing({
    containerWidth: 1024,
    containerHeight: 768,
    cardCount: 8,
    enableCardAreaSpacing: true,
    enableValidation: true
  })

  return (
    <div className={spacing.cssClasses.container.padding}>
      {/* Game info panel */}
      <div className={spacing.cssClasses.uiElement.gameInfo}>
        Game Information
      </div>
      
      {/* Card area with proper margins */}
      <div className={spacing.cssClasses.cardArea?.containerMargins}>
        {/* Cards positioned with proper spacing */}
        <div className={spacing.cssClasses.cardArea?.cardGrid}>
          {cards.map((card, index) => (
            <Card key={index} />
          ))}
        </div>
      </div>
      
      {/* Start button */}
      <div className={spacing.cssClasses.uiElement.startButton}>
        <button>Start Game</button>
      </div>
    </div>
  )
}
```

### Enhanced Layout Calculation

```typescript
import { calculateEnhancedCardLayout, calculateMultiRowCardPositions } from '@/lib/layout-manager'

function calculateCardPositions(containerWidth: number, containerHeight: number, cardCount: number) {
  const deviceType = detectDeviceType(containerWidth)
  
  // Calculate enhanced layout with proper spacing
  const layoutResult = calculateEnhancedCardLayout(
    containerWidth,
    containerHeight,
    cardCount,
    deviceType
  )
  
  // Calculate multi-row positions with centering
  const positions = calculateMultiRowCardPositions(cardCount, layoutResult)
  
  return positions
}
```

### Card Game Specific Hook

```typescript
import { useCardGameSpacing } from '@/hooks/use-dynamic-spacing'

function CardFlipGame({ cardCount = 8 }) {
  const spacing = useCardGameSpacing({
    containerWidth: window.innerWidth,
    containerHeight: window.innerHeight,
    cardCount,
    cardsPerRow: 5,
    uiElements: {
      hasGameInfo: true,
      hasStartButton: true,
      hasResultDisplay: false
    }
  })

  // Check compatibility
  if (!spacing.compatibility.isCompatible) {
    console.warn('Spacing compatibility issues:', spacing.compatibility.issues)
  }

  return (
    <div style={spacing.cardSpecific?.cardAreaStyle}>
      {/* Card grid with optimized spacing */}
      <div className={spacing.cardSpecific?.cardGrid}>
        {/* Cards */}
      </div>
    </div>
  )
}
```

## API Reference

### Core Functions

#### `getCardAreaSpacing(deviceType: DeviceType): CardAreaSpacing`
Returns device-specific card area spacing configuration.

#### `calculateEnhancedCardLayout(containerWidth, containerHeight, cardCount, deviceType): EnhancedLayoutResult`
Calculates optimal card layout with proper margins and spacing.

#### `calculateMultiRowCardPositions(cardCount, layoutResult): EnhancedCardPosition[]`
Calculates balanced card positions for multi-row layouts with proper centering.

#### `validateCardAreaSpacing(deviceType, containerWidth, containerHeight, cardCount): CardAreaSpacingValidation`
Validates spacing configuration against requirements and container constraints.

### Validation Functions

#### `validateAllSpacing(deviceType, containerWidth, containerHeight, cardCount, uiElements)`
Comprehensive spacing validation including UI elements and card area compatibility.

```typescript
const validation = validateAllSpacing('desktop', 1024, 768, 8, {
  hasGameInfo: true,
  hasStartButton: true
})

if (!validation.isValid) {
  console.log('Issues:', validation.overallIssues)
  console.log('Recommendations:', validation.recommendations)
}
```

### Debugging Tools

#### `generateSpacingDebugReport(deviceType, containerWidth, containerHeight, cardCount)`
Generates comprehensive debugging report for development.

#### `displaySpacingDebugInfo(deviceType, containerWidth, containerHeight, cardCount, debugDisplay)`
Shows spacing information in development mode with optional overlay.

```typescript
// Enable debug overlay in development
if (process.env.NODE_ENV === 'development') {
  displaySpacingDebugInfo('desktop', 1024, 768, 8, {
    enabled: true,
    showOverlay: true,
    showMeasurements: true,
    logToConsole: true
  })
}
```

## Multi-Row Layout Guidelines

### Row Distribution Rules

1. **Maximum cards per row**: Based on device type and available width
2. **Row centering**: Last row with fewer cards is horizontally centered
3. **Vertical spacing**: Consistent spacing between all rows
4. **Grid centering**: Entire grid is centered within available space

### Example Multi-Row Layouts

**8 Cards on Desktop (5 cards per row):**
```
Row 1: [Card] [Card] [Card] [Card] [Card]
Row 2:    [Card] [Card] [Card]
```

**6 Cards on Mobile (2 cards per row):**
```
Row 1: [Card] [Card]
Row 2: [Card] [Card]
Row 3: [Card] [Card]
```

## Responsive Behavior

### Breakpoints and Adaptation

- **Mobile**: < 768px - Compact spacing, 2-3 cards per row
- **Tablet**: 768px - 1024px - Medium spacing, 3-4 cards per row  
- **Desktop**: > 1024px - Generous spacing, 5+ cards per row

### Dynamic Adjustment

The system automatically adjusts spacing based on:
- Container aspect ratio
- Available space after UI elements
- Card count and layout complexity
- Device capabilities and constraints

## Performance Optimization

### Caching Strategy

```typescript
// Use cached configurations for better performance
const spacing = useDynamicSpacing({
  useCache: true, // Enable caching
  enableValidation: false // Disable validation in production
})
```

### Memoization

All spacing calculations are memoized to prevent unnecessary recalculations:
- Device detection results
- Spacing configurations
- Layout calculations
- CSS class generation

## Error Handling and Fallbacks

### Fallback Spacing

When spacing calculation fails, the system provides safe fallback values:

```typescript
const fallbackSpacing = createFallbackSpacing('desktop', {
  containerWidth: 1024,
  containerHeight: 768,
  originalError: error
})
```

### Validation and Recovery

```typescript
// Automatic fallback when validation fails
const layoutResult = calculateEnhancedCardLayout(width, height, cardCount, deviceType)

if (!layoutResult.isOptimal) {
  console.warn('Using fallback layout due to spacing constraints')
  // System automatically applies conservative spacing
}
```

## Best Practices

### Development Guidelines

1. **Always enable validation** in development mode
2. **Use debug tools** to verify spacing measurements
3. **Test across device types** to ensure consistency
4. **Monitor performance** with large card counts
5. **Validate compatibility** when integrating with existing components

### Production Optimization

1. **Enable caching** for better performance
2. **Disable debug features** in production builds
3. **Use memoized hooks** to prevent unnecessary recalculations
4. **Implement error boundaries** for graceful fallback handling

### Common Patterns

```typescript
// Recommended pattern for card game components
function CardGameComponent() {
  const spacing = useCardGameSpacing({
    containerWidth: containerRef.current?.offsetWidth,
    containerHeight: containerRef.current?.offsetHeight,
    cardCount: cards.length,
    cardsPerRow: getOptimalCardsPerRow(),
    enableValidation: process.env.NODE_ENV === 'development'
  })

  // Handle compatibility issues
  useEffect(() => {
    if (!spacing.compatibility.isCompatible) {
      console.warn('Spacing issues detected:', spacing.compatibility.issues)
      // Apply recommendations or show user feedback
    }
  }, [spacing.compatibility])

  return (
    <div className={spacing.cssClasses.container.padding}>
      {/* Component content with proper spacing */}
    </div>
  )
}
```

## Troubleshooting

### Common Issues

1. **Cards too close to borders**: Check container margins configuration
2. **Unbalanced multi-row layout**: Verify row centering logic
3. **Inconsistent spacing**: Ensure device detection is working correctly
4. **Performance issues**: Enable caching and disable debug features

### Debug Commands

```typescript
// Check current spacing configuration
console.log(getSpacingDebugInfo('desktop'))

// Validate specific layout
const validation = validateCardAreaSpacing('desktop', 1024, 768, 8)
console.log('Validation result:', validation)

// Generate comprehensive report
const report = generateSpacingDebugReport('desktop', 1024, 768, 8)
console.log('Debug report:', report)
```

### Validation Checklist

- [ ] Container margins meet minimum requirements
- [ ] Row spacing is consistent across device types
- [ ] Card spacing provides adequate visual separation
- [ ] Multi-row layouts are properly centered
- [ ] UI element spacing is compatible with card area
- [ ] Performance is acceptable with target card counts
- [ ] Fallback behavior works correctly
- [ ] Debug tools provide useful information

## Migration Guide

### From Basic Spacing to Enhanced System

1. **Update imports**:
```typescript
// Old
import { calculateSpacing } from '@/lib/spacing'

// New
import { useDynamicSpacing } from '@/hooks/use-dynamic-spacing'
import { getCardAreaSpacing } from '@/lib/spacing-system'
```

2. **Replace manual calculations**:
```typescript
// Old
const margin = deviceType === 'mobile' ? 16 : 32

// New
const spacing = useDynamicSpacing({ enableCardAreaSpacing: true })
const margin = spacing.cardAreaSpacing?.containerMargins.left
```

3. **Update CSS classes**:
```typescript
// Old
className="m-4 p-4"

// New
className={spacing.cssClasses.cardArea?.containerMargins}
```

This enhanced spacing system provides a robust foundation for consistent, responsive, and visually appealing card layouts across all device types and use cases.