# Component Spacing Guidelines

## Overview

This document provides comprehensive spacing guidelines for components in the card flip lottery system. It covers proper implementation of the enhanced spacing system, component-specific spacing requirements, and best practices for maintaining consistent visual hierarchy.

## Core Spacing Principles

### 1. Device-Responsive Spacing
All components must adapt their spacing based on device type:
- **Mobile**: Compact spacing for touch interfaces
- **Tablet**: Medium spacing for mixed input methods
- **Desktop**: Generous spacing for mouse interactions

### 2. Visual Hierarchy
Spacing should reinforce the visual hierarchy:
- **Primary elements**: Game area, cards - largest spacing
- **Secondary elements**: Game info, controls - medium spacing  
- **Tertiary elements**: Status indicators, debug info - minimal spacing

### 3. Consistency
Use the spacing system consistently across all components to maintain visual coherence.

## Component-Specific Guidelines

### CardFlipGame Component

The main game component requires comprehensive spacing management for optimal user experience.

#### Spacing Configuration

```typescript
import { useCardGameSpacing } from '@/hooks/use-dynamic-spacing'
import { calculateEnhancedCardLayout, calculateMultiRowCardPositions } from '@/lib/layout-manager'

interface CardFlipGameProps {
  items: ListItem[]
  quantity: number
  onComplete: (winners: ListItem[]) => void
  cardStyle?: CardStyle
}

function CardFlipGame({ items, quantity, onComplete, cardStyle = 'default' }: CardFlipGameProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerSize, setContainerSize] = useState({ width: 1024, height: 768 })
  const [gamePhase, setGamePhase] = useState<CardGamePhase>('waiting')

  // Enhanced spacing with card area optimization
  const spacing = useCardGameSpacing({
    containerWidth: containerSize.width,
    containerHeight: containerSize.height,
    cardCount: quantity,
    cardsPerRow: 5,
    uiElements: {
      hasGameInfo: true,
      hasStartButton: gamePhase === 'waiting',
      hasResultDisplay: gamePhase === 'finished',
      hasWarnings: false
    },
    enableValidation: process.env.NODE_ENV === 'development'
  })

  // Calculate enhanced card positions
  const cardPositions = useMemo(() => {
    const layoutResult = calculateEnhancedCardLayout(
      containerSize.width,
      containerSize.height,
      quantity,
      spacing.deviceType
    )
    
    return calculateMultiRowCardPositions(quantity, layoutResult)
  }, [containerSize, quantity, spacing.deviceType])

  return (
    <div 
      ref={containerRef}
      className={`relative min-h-screen ${spacing.cssClasses.container.padding}`}
    >
      {/* Game Info Panel - Top spacing */}
      <div className={spacing.cssClasses.uiElement.gameInfo}>
        <OptimizedGameInfo 
          totalItems={items.length}
          drawQuantity={quantity}
          gamePhase={gamePhase}
          deviceType={spacing.deviceType}
        />
      </div>

      {/* Card Area - Enhanced spacing */}
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
            cardStyle={cardStyle}
            style={{
              position: 'absolute',
              transform: `translate(${position.x}px, ${position.y}px) rotate(${position.rotation}deg)`,
              transition: 'transform 0.3s ease-in-out'
            }}
          />
        ))}
      </div>

      {/* Start Button - Bottom spacing */}
      {gamePhase === 'waiting' && (
        <div className={spacing.cssClasses.uiElement.startButton}>
          <button 
            onClick={handleStartGame}
            className="px-8 py-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            开始抽卡
          </button>
        </div>
      )}

      {/* Results Display - Result spacing */}
      {gamePhase === 'finished' && (
        <div className={spacing.cssClasses.uiElement.resultDisplay}>
          <ResultsPanel 
            winners={winners}
            onRestart={handleRestart}
          />
        </div>
      )}
    </div>
  )
}
```

#### Key Spacing Requirements

1. **Container Padding**: Use `spacing.cssClasses.container.padding`
2. **Game Info Spacing**: Apply `spacing.cssClasses.uiElement.gameInfo` 
3. **Card Area Margins**: Use `spacing.cssClasses.cardArea?.containerMargins`
4. **Button Spacing**: Apply `spacing.cssClasses.uiElement.startButton`
5. **Result Spacing**: Use `spacing.cssClasses.uiElement.resultDisplay`

### OptimizedGameInfo Component

Displays essential game information with optimized spacing for different device types.

```typescript
interface OptimizedGameInfoProps {
  totalItems: number
  drawQuantity: number
  remainingCards?: number
  gamePhase: CardGamePhase
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
    <div className={`${spacing.cssClasses.component.spaceY} bg-white rounded-lg shadow-sm p-4`}>
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
        <div className="flex justify-between items-center text-xs text-gray-500 pt-2 border-t">
          <span>剩余卡牌</span>
          <span>{remainingCards}</span>
        </div>
      )}
    </div>
  )
}
```

#### Spacing Guidelines for Game Info

1. **Internal Spacing**: Use `spacing.cssClasses.component.spaceY` for consistent vertical rhythm
2. **Conditional Display**: Hide non-essential information on mobile devices
3. **Visual Separation**: Use borders and padding to separate optional information
4. **Responsive Text**: Adjust text sizes based on device type

### PlayingCard Component

Individual card component with proper touch targets and spacing.

```typescript
interface PlayingCardProps {
  item: ListItem
  position: EnhancedCardPosition
  isRevealed: boolean
  onClick: () => void
  cardStyle?: CardStyle
  style?: React.CSSProperties
}

function PlayingCard({ 
  item, 
  position, 
  isRevealed, 
  onClick, 
  cardStyle = 'default',
  style 
}: PlayingCardProps) {
  const spacing = useDynamicSpacing()
  
  // Ensure minimum touch target size on mobile
  const minTouchTarget = spacing.deviceType === 'mobile' ? 44 : 32
  const cardPadding = spacing.spacing.responsive('sm')

  return (
    <div
      className={cn(
        "cursor-pointer transition-all duration-300 hover:scale-105",
        "flex items-center justify-center",
        "bg-white border-2 border-gray-300 rounded-lg shadow-md",
        isRevealed ? "bg-blue-50 border-blue-300" : "hover:border-gray-400"
      )}
      style={{
        width: position.cardWidth,
        height: position.cardHeight,
        minWidth: minTouchTarget,
        minHeight: minTouchTarget,
        padding: cardPadding,
        ...style
      }}
      onClick={onClick}
    >
      {isRevealed ? (
        <div className="text-center">
          <div className="font-semibold text-sm">{item.name}</div>
          {item.description && (
            <div className="text-xs text-gray-600 mt-1">{item.description}</div>
          )}
        </div>
      ) : (
        <div className="text-gray-400 text-xs">点击翻牌</div>
      )}
    </div>
  )
}
```

#### Card Spacing Requirements

1. **Touch Targets**: Minimum 44px on mobile, 32px on desktop
2. **Internal Padding**: Use responsive spacing for content padding
3. **Hover Effects**: Maintain spacing during hover animations
4. **Content Spacing**: Separate name and description with appropriate margins

### ResultsPanel Component

Displays game results with proper spacing and visual hierarchy.

```typescript
interface ResultsPanelProps {
  winners: ListItem[]
  onRestart: () => void
}

function ResultsPanel({ winners, onRestart }: ResultsPanelProps) {
  const spacing = useDynamicSpacing({
    enableCardAreaSpacing: true
  })

  return (
    <div className={`${spacing.cssClasses.component.spaceY} bg-green-50 border border-green-200 rounded-lg p-6`}>
      <div className="text-center">
        <h2 className="text-2xl font-bold text-green-800 mb-4">抽奖结果</h2>
        
        <div className={`${spacing.cssClasses.component.gap} grid gap-4`}>
          {winners.map((winner, index) => (
            <div 
              key={index}
              className="bg-white p-4 rounded-lg shadow-sm border border-green-100"
            >
              <div className="font-semibold text-lg">{winner.name}</div>
              {winner.description && (
                <div className="text-gray-600 text-sm mt-1">{winner.description}</div>
              )}
            </div>
          ))}
        </div>

        <button
          onClick={onRestart}
          className={`mt-6 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors`}
        >
          重新开始
        </button>
      </div>
    </div>
  )
}
```

#### Results Panel Spacing

1. **Container Spacing**: Use component spacing for overall layout
2. **Winner Cards**: Apply consistent gap between winner items
3. **Button Spacing**: Adequate margin above restart button
4. **Content Hierarchy**: Proper spacing between title, results, and actions

## Responsive Spacing Patterns

### Pattern 1: Adaptive Container

```typescript
function AdaptiveContainer({ children }: { children: React.ReactNode }) {
  const spacing = useDynamicSpacing({
    enableCardAreaSpacing: true
  })

  return (
    <div className={cn(
      spacing.cssClasses.container.padding,
      "transition-all duration-300", // Smooth spacing transitions
      {
        "max-w-sm mx-auto": spacing.deviceType === 'mobile',
        "max-w-4xl mx-auto": spacing.deviceType === 'tablet',
        "max-w-6xl mx-auto": spacing.deviceType === 'desktop'
      }
    )}>
      {children}
    </div>
  )
}
```

### Pattern 2: Responsive Grid

```typescript
function ResponsiveCardGrid({ cards }: { cards: GameCard[] }) {
  const spacing = useCardGameSpacing({
    cardCount: cards.length,
    cardsPerRow: getOptimalCardsPerRow()
  })

  return (
    <div 
      className={cn(
        "grid transition-all duration-300",
        spacing.cardSpecific?.cardGrid,
        {
          "grid-cols-2": spacing.deviceType === 'mobile',
          "grid-cols-3": spacing.deviceType === 'tablet',
          "grid-cols-5": spacing.deviceType === 'desktop'
        }
      )}
      style={spacing.cardSpecific?.cardAreaStyle}
    >
      {cards.map((card, index) => (
        <PlayingCard key={index} {...card} />
      ))}
    </div>
  )
}
```

### Pattern 3: Conditional Spacing

```typescript
function ConditionalSpacingComponent({ 
  showAdvanced, 
  cardCount 
}: { 
  showAdvanced: boolean
  cardCount: number 
}) {
  const spacing = useDynamicSpacing({
    cardCount,
    enableCardAreaSpacing: true
  })

  const isComplexLayout = spacing.layoutComplexity === 'complex'

  return (
    <div className={spacing.cssClasses.container.padding}>
      {/* Basic info - always shown */}
      <div className={spacing.cssClasses.uiElement.gameInfo}>
        <BasicGameInfo />
      </div>

      {/* Advanced info - conditional spacing */}
      {showAdvanced && (
        <div className={cn(
          spacing.cssClasses.component.spaceY,
          isComplexLayout ? "mt-8" : "mt-4"
        )}>
          <AdvancedGameInfo />
        </div>
      )}

      {/* Card area with adaptive spacing */}
      <div className={cn(
        spacing.cssClasses.cardArea?.containerMargins,
        isComplexLayout ? "py-8" : "py-4"
      )}>
        <CardArea />
      </div>
    </div>
  )
}
```

## Accessibility Considerations

### Touch Target Sizes

Ensure all interactive elements meet minimum touch target requirements:

```typescript
function AccessibleButton({ children, onClick }: { 
  children: React.ReactNode
  onClick: () => void 
}) {
  const spacing = useDynamicSpacing()
  
  const minTouchTarget = spacing.deviceType === 'mobile' ? 44 : 32
  const buttonPadding = spacing.spacing.responsive('md')

  return (
    <button
      onClick={onClick}
      className="bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
      style={{
        minWidth: minTouchTarget,
        minHeight: minTouchTarget,
        padding: buttonPadding
      }}
    >
      {children}
    </button>
  )
}
```

### Focus Indicators

Maintain proper spacing for focus indicators:

```typescript
function FocusableCard({ children }: { children: React.ReactNode }) {
  const spacing = useDynamicSpacing()

  return (
    <div
      className={cn(
        "rounded-lg border-2 border-transparent",
        "focus:border-blue-500 focus:ring-2 focus:ring-blue-200",
        "transition-all duration-200"
      )}
      style={{
        padding: spacing.spacing.responsive('sm'),
        margin: spacing.spacing.responsive('xs') // Space for focus ring
      }}
      tabIndex={0}
    >
      {children}
    </div>
  )
}
```

## Performance Optimization

### Memoized Spacing

```typescript
function OptimizedSpacingComponent({ cardCount }: { cardCount: number }) {
  const spacing = useMemo(() => 
    useCardGameSpacing({
      cardCount,
      useCache: true,
      enableValidation: false // Disable in production
    }), 
    [cardCount]
  )

  return (
    <div className={spacing.cssClasses.container.padding}>
      {/* Component content */}
    </div>
  )
}
```

### Lazy Spacing Calculation

```typescript
function LazySpacingComponent() {
  const [needsSpacing, setNeedsSpacing] = useState(false)
  
  const spacing = useDynamicSpacing({
    enableCardAreaSpacing: needsSpacing,
    enableValidation: needsSpacing && process.env.NODE_ENV === 'development'
  })

  useEffect(() => {
    // Only calculate spacing when component becomes visible
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setNeedsSpacing(true)
        observer.disconnect()
      }
    })

    const element = document.getElementById('spacing-component')
    if (element) observer.observe(element)

    return () => observer.disconnect()
  }, [])

  return (
    <div id="spacing-component" className={needsSpacing ? spacing.cssClasses.container.padding : 'p-4'}>
      {/* Component content */}
    </div>
  )
}
```

## Testing Guidelines

### Spacing Tests

```typescript
import { render, screen } from '@testing-library/react'
import { useDynamicSpacing } from '@/hooks/use-dynamic-spacing'

describe('Component Spacing', () => {
  test('should apply correct spacing classes', () => {
    const TestComponent = () => {
      const spacing = useDynamicSpacing({ enableCardAreaSpacing: true })
      return <div data-testid="container" className={spacing.cssClasses.container.padding} />
    }

    render(<TestComponent />)
    const container = screen.getByTestId('container')
    
    expect(container).toHaveClass('p-[32px]') // Desktop default
  })

  test('should adapt spacing for mobile', () => {
    // Mock window.innerWidth for mobile
    Object.defineProperty(window, 'innerWidth', { value: 375 })
    
    const TestComponent = () => {
      const spacing = useDynamicSpacing({ containerWidth: 375 })
      return <div data-testid="container" className={spacing.cssClasses.container.padding} />
    }

    render(<TestComponent />)
    const container = screen.getByTestId('container')
    
    expect(container).toHaveClass('p-[16px]') // Mobile spacing
  })
})
```

### Visual Regression Tests

```typescript
import { validateSpacingMeasurements } from '@/lib/spacing-system'

describe('Visual Spacing Validation', () => {
  test('should maintain consistent spacing measurements', () => {
    const measuredSpacing = {
      containerMargins: { top: 36, bottom: 24, left: 32, right: 32 },
      rowSpacing: 20,
      cardSpacing: 16
    }

    const expectedSpacing = getCardAreaSpacing('desktop')
    const validation = validateSpacingMeasurements(measuredSpacing, expectedSpacing, 2)

    expect(validation.isValid).toBe(true)
    expect(validation.discrepancies).toHaveLength(0)
  })
})
```

These component spacing guidelines ensure consistent, accessible, and performant spacing implementation across the entire card flip lottery system.