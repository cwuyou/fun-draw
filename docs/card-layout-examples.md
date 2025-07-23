# Card Layout Spacing Examples

## Overview

This document provides practical examples of proper card layout spacing using the enhanced spacing system. Each example demonstrates optimal spacing configurations for different scenarios and device types.

## Basic Card Layout Examples

### Example 1: 5 Cards - Single Row Layout

**Desktop (1024x768)**
```typescript
const spacing = useDynamicSpacing({
  containerWidth: 1024,
  containerHeight: 768,
  cardCount: 5,
  enableCardAreaSpacing: true
})

// Expected spacing values:
// - Container margins: 32px left/right, 36px top, 24px bottom
// - Card spacing: 16px between cards
// - Single row, all cards centered
```

**Visual Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│                        Game Info Panel                      │ 36px margin
├─────────────────────────────────────────────────────────────┤
│  32px  [Card] 16px [Card] 16px [Card] 16px [Card] 16px [Card]  32px │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                       Start Button                          │ 24px margin
└─────────────────────────────────────────────────────────────┘
```

### Example 2: 8 Cards - Multi-Row Layout

**Desktop (1024x768)**
```typescript
const layoutResult = calculateEnhancedCardLayout(1024, 768, 8, 'desktop')
const positions = calculateMultiRowCardPositions(8, layoutResult)

// Expected layout:
// - Row 1: 5 cards (full row)
// - Row 2: 3 cards (centered)
// - Row spacing: 20px vertical gap
```

**Visual Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│                        Game Info Panel                      │ 36px
├─────────────────────────────────────────────────────────────┤
│  32px  [Card] [Card] [Card] [Card] [Card]                32px │
│                         20px spacing                        │
│  32px      [Card] [Card] [Card]                          32px │
│                    (centered)                               │
├─────────────────────────────────────────────────────────────┤
│                       Start Button                          │ 24px
└─────────────────────────────────────────────────────────────┘
```

### Example 3: Mobile Layout - 6 Cards

**Mobile (375x667)**
```typescript
const spacing = useCardGameSpacing({
  containerWidth: 375,
  containerHeight: 667,
  cardCount: 6,
  cardsPerRow: 2
})

// Expected spacing:
// - Container margins: 16px left/right, 30px top, 16px bottom
// - Card spacing: 12px between cards
// - Row spacing: 12px between rows
```

**Visual Layout:**
```
┌─────────────────────────┐
│      Game Info          │ 30px
├─────────────────────────┤
│ 16px [Card] 12px [Card] 16px │
│         12px spacing         │
│ 16px [Card] 12px [Card] 16px │
│         12px spacing         │
│ 16px [Card] 12px [Card] 16px │
├─────────────────────────┤
│     Start Button        │ 16px
└─────────────────────────┘
```

## Advanced Layout Examples

### Example 4: Large Card Count - 12 Cards

**Desktop (1440x900)**
```typescript
const spacing = useDynamicSpacing({
  containerWidth: 1440,
  containerHeight: 900,
  cardCount: 12,
  enableCardAreaSpacing: true,
  enableValidation: true
})

// Layout: 5-5-2 distribution
// Row 1: 5 cards (full)
// Row 2: 5 cards (full) 
// Row 3: 2 cards (centered)
```

**Implementation:**
```typescript
function LargeCardLayout() {
  const spacing = useCardGameSpacing({
    containerWidth: 1440,
    containerHeight: 900,
    cardCount: 12,
    cardsPerRow: 5
  })

  return (
    <div className={spacing.cssClasses.container.padding}>
      <div className={spacing.cssClasses.uiElement.gameInfo}>
        <GameInfoPanel />
      </div>
      
      <div 
        className={spacing.cssClasses.cardArea?.containerMargins}
        style={spacing.cardSpecific?.cardAreaStyle}
      >
        <div className={spacing.cardSpecific?.cardGrid}>
          {cards.map((card, index) => (
            <PlayingCard 
              key={index} 
              card={card}
              position={positions[index]}
            />
          ))}
        </div>
      </div>
      
      <div className={spacing.cssClasses.uiElement.startButton}>
        <StartButton />
      </div>
    </div>
  )
}
```

### Example 5: Responsive Layout with Dynamic Adjustment

```typescript
function ResponsiveCardLayout() {
  const [containerSize, setContainerSize] = useState({ width: 1024, height: 768 })
  
  const spacing = useDynamicSpacing({
    containerWidth: containerSize.width,
    containerHeight: containerSize.height,
    cardCount: 8,
    enableCardAreaSpacing: true,
    enableValidation: true
  })

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setContainerSize({
        width: window.innerWidth,
        height: window.innerHeight
      })
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Validate spacing and show warnings
  useEffect(() => {
    if (spacing.validation && !spacing.validation.isValid) {
      console.warn('Spacing validation failed:', spacing.validation.overallIssues)
    }
  }, [spacing.validation])

  return (
    <div className={`transition-all duration-300 ${spacing.cssClasses.container.padding}`}>
      {/* Responsive card grid */}
      <div 
        className={spacing.cssClasses.cardArea?.containerMargins}
        style={{
          transition: 'margin 0.3s ease-in-out',
          ...spacing.cardSpecific?.cardAreaStyle
        }}
      >
        <CardGrid 
          cards={cards}
          spacing={spacing}
          deviceType={spacing.deviceType}
        />
      </div>
    </div>
  )
}
```

## Component Integration Examples

### Example 6: CardFlipGame Component Integration

```typescript
import { useDynamicSpacing } from '@/hooks/use-dynamic-spacing'
import { calculateMultiRowCardPositions, calculateEnhancedCardLayout } from '@/lib/layout-manager'

function CardFlipGame({ 
  items, 
  quantity, 
  onComplete 
}: CardFlipGameProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerSize, setContainerSize] = useState({ width: 1024, height: 768 })
  
  // Enhanced spacing with validation
  const spacing = useCardGameSpacing({
    containerWidth: containerSize.width,
    containerHeight: containerSize.height,
    cardCount: quantity,
    cardsPerRow: 5,
    uiElements: {
      hasGameInfo: true,
      hasStartButton: !gameStarted,
      hasResultDisplay: gameCompleted
    },
    enableValidation: process.env.NODE_ENV === 'development'
  })

  // Calculate card positions with enhanced layout
  const cardPositions = useMemo(() => {
    const layoutResult = calculateEnhancedCardLayout(
      containerSize.width,
      containerSize.height,
      quantity,
      spacing.deviceType
    )
    
    return calculateMultiRowCardPositions(quantity, layoutResult)
  }, [containerSize, quantity, spacing.deviceType])

  // Monitor container size changes
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setContainerSize({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight
        })
      }
    }

    const resizeObserver = new ResizeObserver(updateSize)
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current)
    }

    return () => resizeObserver.disconnect()
  }, [])

  return (
    <div 
      ref={containerRef}
      className={`relative ${spacing.cssClasses.container.padding}`}
      style={{ minHeight: '100vh' }}
    >
      {/* Game Info Panel */}
      <div className={spacing.cssClasses.uiElement.gameInfo}>
        <GameInfoPanel 
          totalItems={items.length}
          drawQuantity={quantity}
          remainingCards={remainingCards}
        />
      </div>

      {/* Card Area with Enhanced Spacing */}
      <div 
        className={spacing.cssClasses.cardArea?.containerMargins}
        style={{
          position: 'relative',
          minHeight: spacing.cardAreaSpacing?.minCardAreaHeight,
          ...spacing.cardSpecific?.cardAreaStyle
        }}
      >
        {cardPositions.map((position, index) => (
          <PlayingCard
            key={index}
            item={items[index]}
            position={position}
            isRevealed={revealedCards.has(index)}
            onClick={() => handleCardClick(index)}
            style={{
              position: 'absolute',
              transform: `translate(${position.x}px, ${position.y}px) rotate(${position.rotation}deg)`,
              transition: 'transform 0.3s ease-in-out'
            }}
          />
        ))}
      </div>

      {/* Start Button */}
      {!gameStarted && (
        <div className={spacing.cssClasses.uiElement.startButton}>
          <button 
            onClick={handleStartGame}
            className="px-8 py-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            开始抽卡
          </button>
        </div>
      )}

      {/* Results Display */}
      {gameCompleted && (
        <div className={spacing.cssClasses.uiElement.resultDisplay}>
          <ResultsPanel 
            winners={winners}
            onRestart={handleRestart}
          />
        </div>
      )}

      {/* Debug Info (Development Only) */}
      {process.env.NODE_ENV === 'development' && spacing.debugInfo && (
        <div className="fixed bottom-4 right-4 bg-black bg-opacity-80 text-white p-2 rounded text-xs">
          {spacing.debugInfo}
        </div>
      )}
    </div>
  )
}
```

### Example 7: Optimized Game Info Display

```typescript
interface OptimizedGameInfoProps {
  totalItems: number
  drawQuantity: number
  remainingCards?: number
  gamePhase: 'waiting' | 'playing' | 'finished'
  deviceType: DeviceType
}

function OptimizedGameInfo({ 
  totalItems, 
  drawQuantity, 
  remainingCards, 
  gamePhase,
  deviceType 
}: OptimizedGameInfoProps) {
  const spacing = useDynamicSpacing({
    enableCardAreaSpacing: true
  })

  // Determine display mode based on device and game phase
  const displayMode = deviceType === 'mobile' || gamePhase === 'waiting' ? 'minimal' : 'detailed'
  
  // Only show remaining cards when it adds value
  const shouldShowRemaining = gamePhase === 'finished' && remainingCards !== undefined && remainingCards > 0

  return (
    <div className={`${spacing.cssClasses.component.spaceY} ${spacing.cssClasses.uiElement.gameInfo}`}>
      {/* Essential Information - Always Shown */}
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-600">抽取数量</span>
        <span className="font-semibold">{drawQuantity}</span>
      </div>
      
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-600">名单数量</span>
        <span className="font-semibold">{totalItems}</span>
      </div>

      {/* Game Phase Indicator */}
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-600">状态</span>
        <span className={`font-semibold ${
          gamePhase === 'waiting' ? 'text-blue-500' :
          gamePhase === 'playing' ? 'text-yellow-500' :
          'text-green-500'
        }`}>
          {gamePhase === 'waiting' ? '准备中' :
           gamePhase === 'playing' ? '进行中' :
           '已完成'}
        </span>
      </div>

      {/* Optional Information - Shown in Detailed Mode */}
      {displayMode === 'detailed' && shouldShowRemaining && (
        <div className="flex justify-between items-center text-xs text-gray-500">
          <span>剩余卡牌</span>
          <span>{remainingCards}</span>
        </div>
      )}
    </div>
  )
}
```

## Testing Examples

### Example 8: Spacing Validation Tests

```typescript
import { validateCardAreaSpacing, validateAllSpacing } from '@/lib/spacing-system'

describe('Card Layout Spacing', () => {
  test('should validate desktop spacing requirements', () => {
    const validation = validateCardAreaSpacing('desktop', 1024, 768, 8)
    
    expect(validation.isValid).toBe(true)
    expect(validation.violations.containerMargins).toBeUndefined()
    expect(validation.fallbackRequired).toBe(false)
  })

  test('should handle insufficient container space', () => {
    const validation = validateCardAreaSpacing('desktop', 400, 300, 8)
    
    expect(validation.isValid).toBe(false)
    expect(validation.fallbackRequired).toBe(true)
    expect(validation.recommendations).toContain('容器空间不足，建议使用降级间距配置')
  })

  test('should validate multi-row layout balance', () => {
    const layoutResult = calculateEnhancedCardLayout(1024, 768, 8, 'desktop')
    const positions = calculateMultiRowCardPositions(8, layoutResult)
    const balance = validateMultiRowBalance(positions, layoutResult)
    
    expect(balance.isBalanced).toBe(true)
    expect(balance.issues).toHaveLength(0)
  })
})
```

### Example 9: Performance Testing

```typescript
import { measureSpacingPerformance } from '@/lib/spacing-system'

describe('Spacing Performance', () => {
  test('should calculate spacing within performance budget', () => {
    const { result, metrics } = measureSpacingPerformance(() => {
      return calculateEnhancedCardLayout(1024, 768, 12, 'desktop')
    }, 'calculation')

    expect(metrics.calculationTime).toBeLessThan(10) // Should complete within 10ms
    expect(result.isOptimal).toBe(true)
  })

  test('should cache spacing configurations', () => {
    const start = performance.now()
    
    // First call - should calculate
    getCachedCardAreaSpacing('desktop')
    const firstCallTime = performance.now() - start
    
    const secondStart = performance.now()
    
    // Second call - should use cache
    getCachedCardAreaSpacing('desktop')
    const secondCallTime = performance.now() - secondStart
    
    expect(secondCallTime).toBeLessThan(firstCallTime * 0.1) // Should be 10x faster
  })
})
```

## Common Patterns and Best Practices

### Pattern 1: Responsive Card Grid

```typescript
function ResponsiveCardGrid({ cards }: { cards: Card[] }) {
  const spacing = useCardGameSpacing({
    containerWidth: window.innerWidth,
    containerHeight: window.innerHeight,
    cardCount: cards.length,
    cardsPerRow: getOptimalCardsPerRow(window.innerWidth)
  })

  return (
    <div 
      className={spacing.cardSpecific?.cardGrid}
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${spacing.layoutComplexity === 'simple' ? 3 : 5}, 1fr)`,
        ...spacing.cardSpecific?.cardAreaStyle
      }}
    >
      {cards.map((card, index) => (
        <Card key={index} data={card} />
      ))}
    </div>
  )
}
```

### Pattern 2: Spacing Validation Middleware

```typescript
function withSpacingValidation<T extends ComponentProps<any>>(
  Component: React.ComponentType<T>
) {
  return function ValidatedComponent(props: T) {
    const spacing = useDynamicSpacing({
      enableValidation: true,
      enableCardAreaSpacing: true
    })

    useEffect(() => {
      if (spacing.validation && !spacing.validation.isValid) {
        console.warn('Spacing validation failed:', spacing.validation.overallIssues)
        
        // Could trigger error reporting or user notification
        if (spacing.validation.cardAreaValidation.fallbackRequired) {
          console.info('Applying fallback spacing configuration')
        }
      }
    }, [spacing.validation])

    return <Component {...props} spacing={spacing} />
  }
}

// Usage
const ValidatedCardFlipGame = withSpacingValidation(CardFlipGame)
```

### Pattern 3: Debug-Enabled Development Component

```typescript
function DebugCardLayout({ children }: { children: React.ReactNode }) {
  const spacing = useDynamicSpacing({
    enableDebug: process.env.NODE_ENV === 'development',
    enableValidation: process.env.NODE_ENV === 'development'
  })

  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && spacing.debugInfo) {
      displaySpacingDebugInfo(
        spacing.deviceType,
        window.innerWidth,
        window.innerHeight,
        8, // example card count
        {
          enabled: true,
          showOverlay: true,
          logToConsole: true
        }
      )
    }
  }, [spacing])

  return (
    <div className={spacing.cssClasses.container.padding}>
      {children}
      
      {/* Development debug panel */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed top-4 left-4 bg-gray-900 text-white p-2 rounded text-xs max-w-xs">
          <div>Device: {spacing.deviceType}</div>
          <div>Layout: {spacing.layoutComplexity}</div>
          {spacing.validation && (
            <div className={spacing.validation.isValid ? 'text-green-400' : 'text-red-400'}>
              Valid: {spacing.validation.isValid ? 'Yes' : 'No'}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
```

These examples demonstrate the comprehensive capabilities of the enhanced spacing system and provide practical patterns for implementation in real-world scenarios.