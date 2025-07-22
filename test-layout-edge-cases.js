// Edge case tests for layout manager
const {
  detectDeviceType,
  calculateLayout,
  validateContainerSize,
  getDeviceConfig,
  calculateContainerDimensions,
  calculateSafeMargins
} = require('./lib/layout-manager.js')

console.log('Testing Layout Manager Edge Cases...\n')

// Test 1: Very small containers
console.log('1. Very Small Container Tests:')
const tinyLayout = calculateLayout(200, 300, 3, 5)
console.log('  Tiny container (200x300):', {
  deviceType: tinyLayout.deviceConfig.type,
  maxSafeCards: tinyLayout.maxSafeCards,
  recommendedCards: tinyLayout.recommendedCards
})

// Test 2: Container validation
console.log('\n2. Container Validation:')
const mobileConfig = getDeviceConfig('mobile')
const tinyMargins = calculateSafeMargins('mobile')
const tinyDimensions = calculateContainerDimensions(200, 300, tinyMargins)
const validation = validateContainerSize(tinyDimensions, mobileConfig)
console.log('  Tiny container validation:', validation)

// Test 3: Large requests vs small containers
console.log('\n3. Large Request vs Small Container:')
const constrainedLayout = calculateLayout(400, 500, 20, 30) // Request 20 cards on mobile
console.log('  Mobile with 20 card request:', {
  deviceType: constrainedLayout.deviceConfig.type,
  maxSafeCards: constrainedLayout.maxSafeCards,
  recommendedCards: constrainedLayout.recommendedCards
})

// Test 4: Zero and negative inputs
console.log('\n4. Zero and Edge Inputs:')
const zeroLayout = calculateLayout(1000, 800, 0, 0)
console.log('  Zero request/items:', {
  maxSafeCards: zeroLayout.maxSafeCards,
  recommendedCards: zeroLayout.recommendedCards
})

// Test 5: Different UI configurations
console.log('\n5. Different UI Configurations:')
const minimalUILayout = calculateLayout(800, 600, 5, 10, {
  hasGameInfo: false,
  hasWarnings: false,
  hasStartButton: false,
  hasResultDisplay: false
})

const fullUILayout = calculateLayout(800, 600, 5, 10, {
  hasGameInfo: true,
  hasWarnings: true,
  hasStartButton: true,
  hasResultDisplay: true
})

console.log('  Minimal UI available height:', minimalUILayout.containerDimensions.availableHeight)
console.log('  Full UI available height:', fullUILayout.containerDimensions.availableHeight)
console.log('  Height difference:', minimalUILayout.containerDimensions.availableHeight - fullUILayout.containerDimensions.availableHeight)

// Test 6: Breakpoint boundaries
console.log('\n6. Breakpoint Boundary Tests:')
console.log('  767px (mobile):', detectDeviceType(767))
console.log('  768px (tablet):', detectDeviceType(768))
console.log('  1023px (tablet):', detectDeviceType(1023))
console.log('  1024px (desktop):', detectDeviceType(1024))

// Test 7: Extreme aspect ratios
console.log('\n7. Extreme Aspect Ratios:')
const wideLayout = calculateLayout(2000, 400, 5, 10) // Very wide
const tallLayout = calculateLayout(400, 2000, 5, 10) // Very tall

console.log('  Wide container (2000x400):', {
    deviceType: wideLayout.deviceConfig.type,
    maxSafeCards: wideLayout.maxSafeCards
})
console.log('  Tall container (400x2000):', {
    deviceType: tallLayout.deviceConfig.type,
    maxSafeCards: tallLayout.maxSafeCards
})

console.log('\n✅ All edge case tests completed!')