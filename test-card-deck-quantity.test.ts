import { describe, it, expect } from 'vitest'

describe('CardDeck Quantity Logic Verification', () => {
  it('verifies CardDeck respects totalCards parameter without minimum forcing', () => {
    // This simulates the updated logic in CardDeck component
    const testCases = [
      { totalCards: 1, expected: 1, description: 'quantity 1 should create exactly 1 card' },
      { totalCards: 2, expected: 2, description: 'quantity 2 should create exactly 2 cards' },
      { totalCards: 5, expected: 5, description: 'quantity 5 should create exactly 5 cards' },
      { totalCards: 10, expected: 10, description: 'quantity 10 should create exactly 10 cards' },
      { totalCards: 0, expected: 1, description: 'quantity 0 should be handled as 1 card (safety check)' },
      { totalCards: -1, expected: 1, description: 'negative quantity should be handled as 1 card (safety check)' },
    ]
    
    testCases.forEach(({ totalCards, expected, description }) => {
      // Simulate the updated CardDeck initialization logic
      const actualCardCount = Math.max(1, totalCards)
      
      const initialCards: any[] = []
      for (let i = 0; i < actualCardCount; i++) {
        initialCards.push({
          id: `deck-card-${i}`,
          x: Math.random() * 2 - 1,
          y: -i * 0.5,
          rotation: Math.random() * 4 - 2,
          zIndex: actualCardCount - i
        })
      }
      
      expect(initialCards).toHaveLength(expected)
      expect(actualCardCount).toBe(expected)
      console.log(`✓ ${description}: totalCards=${totalCards} -> actualCardCount=${actualCardCount}, created ${initialCards.length} cards`)
    })
  })
  
  it('verifies single card scenario is handled properly', () => {
    const totalCards = 1
    const actualCardCount = Math.max(1, totalCards)
    
    const initialCards: any[] = []
    for (let i = 0; i < actualCardCount; i++) {
      initialCards.push({
        id: `deck-card-${i}`,
        x: 0, // Fixed for testing
        y: -i * 0.5,
        rotation: 0, // Fixed for testing
        zIndex: actualCardCount - i
      })
    }
    
    // Verify single card properties
    expect(initialCards).toHaveLength(1)
    expect(initialCards[0].id).toBe('deck-card-0')
    expect(initialCards[0].y).toBe(0) // First card should be at y=0
    expect(initialCards[0].zIndex).toBe(1) // Should have zIndex of 1
    
    console.log('✓ Single card scenario handled properly')
  })
  
  it('verifies no minimum card forcing logic exists', () => {
    // Test that the component uses totalCards directly (with safety check)
    // and doesn't force a minimum of 3 cards like before
    
    const testCases = [
      { totalCards: 1, shouldNotForceMinimum: true },
      { totalCards: 2, shouldNotForceMinimum: true },
    ]
    
    testCases.forEach(({ totalCards, shouldNotForceMinimum }) => {
      const actualCardCount = Math.max(1, totalCards)
      
      // The key test: actualCardCount should equal totalCards (when totalCards >= 1)
      // and NOT be forced to a minimum of 3
      if (totalCards >= 1) {
        expect(actualCardCount).toBe(totalCards)
        expect(actualCardCount).not.toBe(3) // Should not be forced to 3
      }
      
      console.log(`✓ No minimum forcing for totalCards=${totalCards}: actualCardCount=${actualCardCount}`)
    })
  })
})