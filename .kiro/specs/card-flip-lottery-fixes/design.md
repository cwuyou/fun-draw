# Design Document

## Overview

This design addresses the critical bugs in the card flip lottery system by fixing the card quantity logic, positioning calculations, winner selection algorithm, and implementing proper shuffling/dealing animations with audio feedback. The solution focuses on ensuring that the visual representation matches the user configuration, the game logic correctly handles the specified quantity of winners, and provides engaging visual and audio feedback during game phases.

## Architecture

The fix involves modifications to five main components:

1. **CardFlipGame Component** - Core game logic and state management
2. **CardDeck Component** - Shuffling animation with correct card count
3. **Card Positioning System** - Layout calculations to prevent UI overlap
4. **Animation System** - Shuffling and dealing animations with proper timing
5. **Audio System** - Sound effects for game phases

## Components and Interfaces

### CardFlipGame Component Modifications

**Current Issues:**
- Uses `actualQuantity = Math.max(gameConfig.minCards, Math.min(gameConfig.maxCards, quantity))` which forces minimum 3 cards
- Winner selection logic doesn't properly limit winners to configured quantity
- Card positioning doesn't account for proper spacing from UI text

**Design Changes:**

```typescript
// Remove forced minimum card count
const actualQuantity = Math.max(1, Math.min(gameConfig.maxCards, quantity))

// Fix winner selection to respect exact quantity
const selectWinners = (items: ListItem[], quantity: number, allowRepeat: boolean): ListItem[] => {
  // Select exactly 'quantity' number of winners, not more
  const winners: ListItem[] = []
  const availableItems = [...items]
  
  for (let i = 0; i < quantity && availableItems.length > 0; i++) {
    const randomIndex = Math.floor(Math.random() * availableItems.length)
    const winner = availableItems[randomIndex]
    winners.push(winner)
    
    if (!allowRepeat) {
      availableItems.splice(randomIndex, 1)
    }
  }
  
  return winners
}

// Fix card creation to properly distribute winners
const createGameCards = (winners: ListItem[], totalCards: number): GameCard[] => {
  const cards: GameCard[] = []
  const positions = calculateCardPositions(totalCards)
  
  // Create winner indices (randomly distributed)
  const winnerIndices = new Set<number>()
  while (winnerIndices.size < winners.length && winnerIndices.size < totalCards) {
    winnerIndices.add(Math.floor(Math.random() * totalCards))
  }
  
  const winnerArray = Array.from(winnerIndices)
  
  for (let i = 0; i < totalCards; i++) {
    const winnerIndex = winnerArray.indexOf(i)
    cards.push({
      id: `game-card-${i}`,
      content: winnerIndex >= 0 ? winners[winnerIndex] : null,
      position: positions[i],
      isWinner: winnerIndex >= 0
    })
  }
  
  return cards
}
```

### CardDeck Component Modifications

**Current Issues:**
- Always uses `totalCards` parameter without validation against user configuration
- Doesn't properly handle single card scenarios

**Design Changes:**

```typescript
// Ensure CardDeck respects the actual quantity
export function CardDeck({ 
  totalCards, 
  isShuffling, 
  onShuffleComplete,
  className 
}: CardDeckProps) {
  // Remove any minimum card forcing logic
  const actualCardCount = Math.max(1, totalCards)
  
  // Initialize cards based on actual count
  useEffect(() => {
    const initialCards: DeckCard[] = []
    for (let i = 0; i < actualCardCount; i++) {
      initialCards.push({
        id: `deck-card-${i}`,
        x: Math.random() * 2 - 1,
        y: -i * 0.5,
        rotation: Math.random() * 4 - 2,
        zIndex: actualCardCount - i
      })
    }
    setCards(initialCards)
  }, [actualCardCount])
}
```

### Card Positioning System

**Current Issues:**
- Card positioning doesn't account for UI text spacing
- Layout jumps between shuffling and dealing phases

**Design Changes:**

```typescript
const calculateCardPositions = useCallback((totalCards: number) => {
  const positions = []
  
  // Add proper spacing calculations
  const UI_TEXT_HEIGHT = 60 // Space for game info text
  const CARD_MARGIN_TOP = 20 // Additional margin from status text
  const CARD_MARGIN_BOTTOM = 80 // Space for game info below
  
  // Device-specific calculations remain the same
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768
  const isTablet = typeof window !== 'undefined' && window.innerWidth >= 768 && window.innerWidth < 1024
  
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
  
  for (let row = 0; row < rows; row++) {
    const cardsInThisRow = Math.min(cardsPerRow, totalCards - row * cardsPerRow)
    const rowWidth = cardsInThisRow * cardWidth + (cardsInThisRow - 1) * spacing
    const startX = -rowWidth / 2 + cardWidth / 2
    
    for (let col = 0; col < cardsInThisRow; col++) {
      positions.push({
        x: startX + col * (cardWidth + spacing),
        // Adjust Y position to account for UI text spacing
        y: CARD_MARGIN_TOP + row * (cardHeight + spacing) - (rows - 1) * (cardHeight + spacing) / 2,
        rotation: (Math.random() - 0.5) * 4,
        cardWidth,
        cardHeight
      })
    }
  }
  
  return positions
}, [])
```

### Animation System Design

**Current Issues:**
- No shuffling animation - cards appear instantly
- No dealing animation - all cards appear at once
- No visual feedback during phase transitions

**Design Changes:**

```typescript
// Animation timing constants
const ANIMATION_TIMINGS = {
  SHUFFLE_DURATION: 2000, // 2 seconds for shuffling
  DEAL_CARD_INTERVAL: 300, // 300ms between each card deal
  CARD_APPEAR_DURATION: 400, // 400ms for each card to appear
  PHASE_TRANSITION: 200 // 200ms for phase transitions
}

// Enhanced CardDeck with proper shuffling animation
export function CardDeck({ 
  totalCards, 
  isShuffling, 
  onShuffleComplete,
  className 
}: CardDeckProps) {
  const [cards, setCards] = useState<DeckCard[]>([])
  const [shuffleProgress, setShuffleProgress] = useState(0)
  
  // Initialize cards to show all uploaded items
  useEffect(() => {
    const initialCards: DeckCard[] = []
    for (let i = 0; i < totalCards; i++) {
      initialCards.push({
        id: `deck-card-${i}`,
        x: 0,
        y: -i * 0.3, // Stack cards with slight offset
        rotation: 0,
        zIndex: totalCards - i,
        opacity: 1
      })
    }
    setCards(initialCards)
  }, [totalCards])
  
  // Shuffling animation effect
  useEffect(() => {
    if (!isShuffling) return
    
    let animationFrame: number
    let startTime: number
    
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const elapsed = timestamp - startTime
      const progress = Math.min(elapsed / ANIMATION_TIMINGS.SHUFFLE_DURATION, 1)
      
      setShuffleProgress(progress)
      
      // Update card positions during shuffle
      setCards(prevCards => 
        prevCards.map((card, index) => ({
          ...card,
          x: Math.sin(progress * Math.PI * 4 + index) * 2,
          y: -index * 0.3 + Math.cos(progress * Math.PI * 3 + index) * 0.5,
          rotation: Math.sin(progress * Math.PI * 6 + index) * 15
        }))
      )
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate)
      } else {
        onShuffleComplete()
      }
    }
    
    animationFrame = requestAnimationFrame(animate)
    
    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame)
      }
    }
  }, [isShuffling, onShuffleComplete])
}

// Enhanced dealing animation in CardFlipGame
const dealCardsWithAnimation = useCallback(async (gameCards: GameCard[]) => {
  setGamePhase('dealing')
  setCards([]) // Start with no cards visible
  
  // Deal cards one by one
  for (let i = 0; i < gameCards.length; i++) {
    await new Promise(resolve => setTimeout(resolve, ANIMATION_TIMINGS.DEAL_CARD_INTERVAL))
    
    setCards(prevCards => [
      ...prevCards,
      {
        ...gameCards[i],
        // Start with card off-screen and animate in
        style: {
          transform: `translateY(-100px) scale(0.8)`,
          opacity: 0,
          transition: `all ${ANIMATION_TIMINGS.CARD_APPEAR_DURATION}ms ease-out`
        }
      }
    ])
    
    // Animate card to final position
    setTimeout(() => {
      setCards(prevCards => 
        prevCards.map((card, index) => 
          index === i 
            ? {
                ...card,
                style: {
                  transform: `translateY(0) scale(1)`,
                  opacity: 1,
                  transition: `all ${ANIMATION_TIMINGS.CARD_APPEAR_DURATION}ms ease-out`
                }
              }
            : card
        )
      )
    }, 50)
  }
  
  // Wait for last card animation to complete
  setTimeout(() => {
    setGamePhase('playing')
  }, ANIMATION_TIMINGS.CARD_APPEAR_DURATION + 100)
}, [])
```

### Audio System Design

**Current Issues:**
- No sound effects during any game phase
- No audio feedback for user interactions

**Design Changes:**

```typescript
// Audio system using existing SoundManager
interface GameAudioSystem {
  playShuffleSound: () => void
  playDealSound: () => void
  playCardFlipSound: () => void
  playWinSound: () => void
}

// Enhanced sound integration
const useGameAudio = (): GameAudioSystem => {
  const soundManager = useMemo(() => new SoundManager(), [])
  
  return {
    playShuffleSound: () => {
      // Play shuffling sound effect
      soundManager.playSound('shuffle', { 
        volume: 0.6,
        loop: true,
        duration: ANIMATION_TIMINGS.SHUFFLE_DURATION 
      })
    },
    
    playDealSound: () => {
      // Play card dealing sound
      soundManager.playSound('deal', { 
        volume: 0.4 
      })
    },
    
    playCardFlipSound: () => {
      // Play card flip sound
      soundManager.playSound('flip', { 
        volume: 0.5 
      })
    },
    
    playWinSound: () => {
      // Play winner reveal sound
      soundManager.playSound('win', { 
        volume: 0.7 
      })
    }
  }
}

// Integration in CardFlipGame component
const CardFlipGame = ({ listItems, quantity, allowRepeat }: CardFlipGameProps) => {
  const audio = useGameAudio()
  
  const startGame = useCallback(async () => {
    setGamePhase('shuffling')
    
    // Play shuffle sound
    audio.playShuffleSound()
    
    // Wait for shuffle animation to complete
    await new Promise(resolve => {
      setIsShuffling(true)
      // onShuffleComplete will be called by CardDeck
    })
    
    // Start dealing with sound effects
    const gameCards = createGameCards(winners, actualQuantity)
    await dealCardsWithAnimation(gameCards)
  }, [audio, winners, actualQuantity, dealCardsWithAnimation])
  
  const handleCardClick = useCallback((cardId: string) => {
    audio.playCardFlipSound()
    
    setRevealedCards(prev => new Set([...prev, cardId]))
    
    // Check if winner card
    const card = cards.find(c => c.id === cardId)
    if (card?.isWinner) {
      setTimeout(() => {
        audio.playWinSound()
      }, 500) // Delay for flip animation
    }
  }, [audio, cards])
```

## Data Models

### Updated Game State Model

```typescript
interface FixedCardFlipGameState {
  gamePhase: CardGamePhase
  cards: GameCard[]
  revealedCards: Set<string>
  winners: ListItem[]
  actualQuantity: number // Track the real quantity being used
  displayedCardCount: number // Track cards being displayed
}
```

### Configuration Validation

```typescript
interface GameConfigValidation {
  validateQuantity: (quantity: number, itemCount: number, allowRepeat: boolean) => boolean
  validateCardCount: (cardCount: number) => boolean
  sanitizeQuantity: (quantity: number) -> number
}
```

## Error Handling

### Quantity Validation Errors

```typescript
enum QuantityValidationError {
  QUANTITY_TOO_LOW = 'Quantity must be at least 1',
  QUANTITY_TOO_HIGH = 'Quantity exceeds maximum allowed',
  QUANTITY_EXCEEDS_ITEMS = 'Quantity exceeds available items when repeat is disabled'
}
```

### Position Calculation Errors

```typescript
enum PositionCalculationError {
  INVALID_CARD_COUNT = 'Invalid card count for position calculation',
  LAYOUT_OVERFLOW = 'Card layout would overflow container'
}
```

## Testing Strategy

### Unit Tests

1. **Quantity Logic Tests**
   - Test that actualQuantity equals configured quantity when valid
   - Test that card count matches actualQuantity
   - Test winner selection respects exact quantity

2. **Position Calculation Tests**
   - Test that cards don't overlap with UI text
   - Test responsive positioning across device sizes
   - Test single card positioning

3. **Winner Distribution Tests**
   - Test that exactly N cards are winners when quantity is N
   - Test that winners are randomly distributed among cards
   - Test allowRepeat logic with different quantities

### Integration Tests

1. **Game Flow Tests**
   - Test complete game flow with quantity 1
   - Test game flow with various quantities (1-10)
   - Test position consistency across game phases

2. **UI Consistency Tests**
   - Test that all quantity displays show same value
   - Test that card positioning doesn't cause layout jumps
   - Test responsive behavior

### Visual Regression Tests

1. **Layout Tests**
   - Screenshot tests for different quantities
   - Layout tests across device sizes
   - Position consistency tests between game phases

## Implementation Notes

### Phase 1: Fix Core Logic
- Remove forced minimum card count
- Fix winner selection algorithm
- Update card creation logic

### Phase 2: Fix Positioning
- Update position calculation with proper spacing
- Add layout validation
- Test across device sizes

### Phase 3: UI Consistency
- Ensure all quantity displays are synchronized
- Add validation for edge cases
- Improve error messaging

### Performance Considerations
- Position calculations should be memoized
- Card animations should be optimized for single card scenarios
- Memory cleanup for game state resets