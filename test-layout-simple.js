// Simple test for layout manager functions
const {
  detectDeviceType,
  getDeviceConfig,
  calculateSafeMargins,
  calculateContainerDimensions,
  calculateMaxSafeCards,
  calculateRecommendedCards,
  calculateLayout
} = require('./lib/layout-manager.js')

console.log('Testing Layout Manager Functions...\n')

// Test 1: Device Type Detection
console.log('1. Device Type Detection:')
console.log('  Mobile (400px):', detectDeviceType(400))
console.log('  Tablet (800px):', detectDeviceType(800))
console.log('  Desktop (1200px):', detectDeviceType(1200))

// Test 2: Device Configuration
console.log('\n2. Device Configuration:')
const mobileConfig = getDeviceConfig('mobile')
console.log('  Mobile config:', {
  type: mobileConfig.type,
  maxCards: mobileConfig.maxCards,
  cardSize: mobileConfig.cardSize,
  cardsPerRow: mobileConfig.cardsPerRow
})

const desktopConfig = getDeviceConfig('desktop')
console.log('  Desktop config:', {
  type: desktopConfig.type,
  maxCards: desktopConfig.maxCards,
  cardSize: desktopConfig.cardSize,
  cardsPerRow: desktopConfig.cardsPerRow
})

// Test 3: Safe Margins
console.log('\n3. Safe Margins Calculation:')
const basicMargins = calculateSafeMargins('desktop')
console.log('  Basic margins:', basicMargins)

const fullUIMargins = calculateSafeMargins('desktop', {
  hasGameInfo: true,
  hasWarnings: true,
  hasStartButton: true,
  hasResultDisplay: true
})
console.log('  Full UI margins:', fullUIMargins)

// Test 4: Container Dimensions
console.log('\n4. Container Dimensions:')
const containerDims = calculateContainerDimensions(1200, 800, basicMargins)
console.log('  Container (1200x800):', containerDims)

// Test 5: Max Safe Cards
console.log('\n5. Max Safe Cards:')
const maxCards = calculateMaxSafeCards(containerDims, desktopConfig)
console.log('  Max safe cards:', maxCards)

// Test 6: Recommended Cards
console.log('\n6. Recommended Cards:')
const recommended = calculateRecommendedCards(5, maxCards, 10)
console.log('  Recommended (request 5, max', maxCards, ', items 10):', recommended)

// Test 7: Complete Layout Calculation
console.log('\n7. Complete Layout Calculation:')
const layout = calculateLayout(1200, 800, 5, 10)
console.log('  Layout result:', {
  deviceType: layout.deviceConfig.type,
  containerSize: `${layout.containerDimensions.width}x${layout.containerDimensions.height}`,
  availableSpace: `${layout.containerDimensions.availableWidth}x${layout.containerDimensions.availableHeight}`,
  maxSafeCards: layout.maxSafeCards,
  recommendedCards: layout.recommendedCards
})

console.log('\n✅ All tests completed successfully!')