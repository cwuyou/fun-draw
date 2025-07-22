// 测试位置一致性优化
const {
  calculateLayout,
  getLayoutDebugInfo
} = require('./lib/layout-manager.js')

console.log('Testing Position Consistency Optimization...\n')

// 模拟不同的UI状态来测试位置一致性
const testPositionConsistency = (containerWidth, containerHeight, totalCards, itemCount) => {
  console.log(`\n=== Testing ${containerWidth}x${containerHeight} with ${totalCards} cards ===`)
  
  // 测试不同UI状态下的布局一致性
  const scenarios = [
    { name: 'Idle State', options: { hasGameInfo: true, hasStartButton: true } },
    { name: 'Shuffling State', options: { hasGameInfo: true } },
    { name: 'Dealing State', options: { hasGameInfo: true } },
    { name: 'Waiting State', options: { hasGameInfo: true } },
    { name: 'Finished State', options: { hasGameInfo: true, hasResultDisplay: true } },
    { name: 'With Warnings', options: { hasGameInfo: true, hasWarnings: true } }
  ]
  
  const layouts = scenarios.map(scenario => {
    const layout = calculateLayout(containerWidth, containerHeight, totalCards, itemCount, scenario.options)
    return {
      name: scenario.name,
      layout,
      debugInfo: getLayoutDebugInfo(layout)
    }
  })
  
  // 检查设备配置一致性
  const deviceTypes = [...new Set(layouts.map(l => l.layout.deviceConfig.type))]
  console.log('Device types across scenarios:', deviceTypes)
  
  if (deviceTypes.length === 1) {
    console.log('✅ Device type consistent across all UI states')
  } else {
    console.log('❌ Device type inconsistent:', deviceTypes)
  }
  
  // 检查卡牌尺寸一致性
  const cardSizes = layouts.map(l => `${l.layout.deviceConfig.cardSize.width}x${l.layout.deviceConfig.cardSize.height}`)
  const uniqueCardSizes = [...new Set(cardSizes)]
  
  if (uniqueCardSizes.length === 1) {
    console.log('✅ Card size consistent:', uniqueCardSizes[0])
  } else {
    console.log('❌ Card size inconsistent:', uniqueCardSizes)
  }
  
  // 检查最大安全卡牌数的变化
  const maxSafeCards = layouts.map(l => l.layout.maxSafeCards)
  const minMaxCards = Math.min(...maxSafeCards)
  const maxMaxCards = Math.max(...maxSafeCards)
  
  console.log(`Max safe cards range: ${minMaxCards} - ${maxMaxCards}`)
  
  if (maxMaxCards - minMaxCards <= 2) {
    console.log('✅ Max safe cards relatively stable across UI states')
  } else {
    console.log('⚠️  Max safe cards varies significantly across UI states')
  }
  
  // 显示每个场景的详细信息
  layouts.forEach(({ name, layout, debugInfo }) => {
    console.log(`  ${name}: ${debugInfo}`)
  })
  
  return layouts[0].layout // 返回基础布局用于进一步测试
}

// 测试基准点系统的一致性
const testOriginConsistency = () => {
  console.log('\n=== Testing Origin Point Consistency ===')
  
  // 测试相同配置多次调用的一致性
  const layout1 = calculateLayout(1200, 800, 5, 10)
  const layout2 = calculateLayout(1200, 800, 5, 10)
  
  // 比较关键参数
  const params1 = {
    deviceType: layout1.deviceConfig.type,
    cardSize: layout1.deviceConfig.cardSize,
    availableSpace: `${layout1.containerDimensions.availableWidth}x${layout1.containerDimensions.availableHeight}`,
    maxSafeCards: layout1.maxSafeCards
  }
  
  const params2 = {
    deviceType: layout2.deviceConfig.type,
    cardSize: layout2.deviceConfig.cardSize,
    availableSpace: `${layout2.containerDimensions.availableWidth}x${layout2.containerDimensions.availableHeight}`,
    maxSafeCards: layout2.maxSafeCards
  }
  
  const isConsistent = JSON.stringify(params1) === JSON.stringify(params2)
  
  if (isConsistent) {
    console.log('✅ Layout calculation is deterministic and consistent')
  } else {
    console.log('❌ Layout calculation inconsistent between calls')
    console.log('First call:', params1)
    console.log('Second call:', params2)
  }
}

// 测试边界情况的处理
const testBoundaryConditions = () => {
  console.log('\n=== Testing Boundary Conditions ===')
  
  // 测试极小容器
  const tinyLayout = calculateLayout(300, 400, 3, 5)
  console.log('Tiny container (300x400):', {
    deviceType: tinyLayout.deviceConfig.type,
    maxSafeCards: tinyLayout.maxSafeCards,
    recommendedCards: tinyLayout.recommendedCards
  })
  
  // 测试极大请求
  const largeRequestLayout = calculateLayout(1200, 800, 50, 100)
  console.log('Large request (50 cards):', {
    maxSafeCards: largeRequestLayout.maxSafeCards,
    recommendedCards: largeRequestLayout.recommendedCards,
    actualRecommended: Math.min(largeRequestLayout.recommendedCards, largeRequestLayout.maxSafeCards)
  })
  
  // 测试零输入
  const zeroLayout = calculateLayout(1200, 800, 0, 0)
  console.log('Zero input:', {
    maxSafeCards: zeroLayout.maxSafeCards,
    recommendedCards: zeroLayout.recommendedCards
  })
}

// 测试响应式断点的一致性
const testResponsiveBreakpoints = () => {
  console.log('\n=== Testing Responsive Breakpoint Consistency ===')
  
  const breakpointTests = [
    { width: 767, expected: 'mobile' },
    { width: 768, expected: 'tablet' },
    { width: 1023, expected: 'tablet' },
    { width: 1024, expected: 'desktop' }
  ]
  
  breakpointTests.forEach(({ width, expected }) => {
    const layout = calculateLayout(width, 600, 5, 10)
    const actual = layout.deviceConfig.type
    
    if (actual === expected) {
      console.log(`✅ ${width}px -> ${actual} (correct)`)
    } else {
      console.log(`❌ ${width}px -> ${actual} (expected ${expected})`)
    }
  })
}

// 运行所有测试
console.log('Position Consistency Optimization Tests')
console.log('=====================================')

// 测试不同设备尺寸的位置一致性
testPositionConsistency(400, 600, 4, 8)   // Mobile
testPositionConsistency(800, 600, 6, 12)  // Tablet  
testPositionConsistency(1200, 800, 8, 16) // Desktop

// 测试基准点一致性
testOriginConsistency()

// 测试边界条件
testBoundaryConditions()

// 测试响应式断点
testResponsiveBreakpoints()

console.log('\n✅ Position consistency optimization tests completed!')