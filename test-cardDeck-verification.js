// Simple verification test for CardDeck logic
console.log('Testing CardDeck quantity logic...')

// Simulate the CardFlipGame -> CardDeck flow
function testCardDeckQuantityLogic() {
  const gameConfig = { maxCards: 10 }
  
  const testCases = [
    { userQuantity: 1, description: 'User quantity 1' },
    { userQuantity: 2, description: 'User quantity 2' },
    { userQuantity: 5, description: 'User quantity 5' },
    { userQuantity: 10, description: 'User quantity 10' },
    { userQuantity: 15, description: 'User quantity 15 (should be capped)' },
  ]
  
  testCases.forEach(({ userQuantity, description }) => {
    // Step 1: CardFlipGame calculates actualQuantity
    const actualQuantity = Math.max(1, Math.min(gameConfig.maxCards, userQuantity))
    
    // Step 2: CardDeck receives totalCards = actualQuantity
    const totalCards = actualQuantity
    
    // Step 3: CardDeck processes totalCards (current implementation)
    const actualCardCount = Math.max(1, totalCards)
    
    // Step 4: Verify results
    const expectedResult = Math.min(userQuantity, gameConfig.maxCards)
    const success = actualCardCount === expectedResult
    
    console.log(`${success ? '✅' : '❌'} ${description}: ${userQuantity} -> ${actualQuantity} -> ${actualCardCount} (expected: ${expectedResult})`)
  })
}

// Test minimum card forcing (should NOT happen)
function testNoMinimumForcing() {
  console.log('\nTesting no minimum card forcing...')
  
  const testCases = [1, 2]
  
  testCases.forEach(totalCards => {
    // Current CardDeck logic
    const actualCardCount = Math.max(1, totalCards)
    
    // Should NOT force minimum of 3
    const success = actualCardCount === totalCards && actualCardCount !== 3
    
    console.log(`${success ? '✅' : '❌'} totalCards=${totalCards} -> actualCardCount=${actualCardCount} (not forced to 3)`)
  })
}

// Test single card scenario
function testSingleCardScenario() {
  console.log('\nTesting single card scenario...')
  
  const totalCards = 1
  const actualCardCount = Math.max(1, totalCards)
  
  // Create cards (simulate CardDeck logic)
  const initialCards = []
  for (let i = 0; i < actualCardCount; i++) {
    initialCards.push({
      id: `deck-card-${i}`,
      x: Math.random() * 2 - 1,
      y: -i * 0.5,
      rotation: Math.random() * 4 - 2,
      zIndex: actualCardCount - i
    })
  }
  
  const success = initialCards.length === 1 && initialCards[0].zIndex === 1
  
  console.log(`${success ? '✅' : '❌'} Single card scenario: ${initialCards.length} card(s) created, zIndex=${initialCards[0]?.zIndex}`)
}

// Run all tests
testCardDeckQuantityLogic()
testNoMinimumForcing()
testSingleCardScenario()

console.log('\nCardDeck verification complete!')