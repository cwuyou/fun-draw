// 测试卡牌溢出修复效果的脚本
// 验证不同数量的卡牌是否都能正确显示在容器内

const { calculateFixedCardLayout, validateLayout, calculateSimpleCardSpace } = require('./lib/fixed-card-positioning')

// 模拟不同的容器尺寸
const testContainers = [
  { width: 1920, height: 1080, name: '桌面大屏' },
  { width: 1366, height: 768, name: '桌面标准' },
  { width: 768, height: 1024, name: '平板竖屏' },
  { width: 1024, height: 768, name: '平板横屏' },
  { width: 375, height: 667, name: '手机竖屏' },
  { width: 667, height: 375, name: '手机横屏' }
]

// 测试不同的卡牌数量
const testCardCounts = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

console.log('🎯 卡牌溢出修复测试')
console.log('=' .repeat(50))

testContainers.forEach(container => {
  console.log(`\n📱 ${container.name} (${container.width}x${container.height})`)
  console.log('-'.repeat(40))
  
  testCardCounts.forEach(cardCount => {
    try {
      // 计算布局
      const layoutResult = calculateFixedCardLayout(cardCount, container.width, container.height)
      const space = calculateSimpleCardSpace(container.width, container.height)
      const isValid = validateLayout(layoutResult, space)
      
      // 计算空间利用率
      const utilizationWidth = (layoutResult.layoutInfo.totalWidth / space.width * 100).toFixed(1)
      const utilizationHeight = (layoutResult.layoutInfo.totalHeight / space.height * 100).toFixed(1)
      
      const status = isValid ? '✅' : '❌'
      const layout = `${layoutResult.layoutInfo.rows}x${layoutResult.layoutInfo.cardsPerRow}`
      const cardSize = `${layoutResult.actualCardSize.width}x${layoutResult.actualCardSize.height}`
      
      console.log(`${status} ${cardCount}张: ${layout} 布局, 卡牌${cardSize}, 空间利用率 ${utilizationWidth}%x${utilizationHeight}%`)
      
      if (!isValid) {
        console.log(`   ⚠️  布局超出边界: 需要${layoutResult.layoutInfo.totalWidth}x${layoutResult.layoutInfo.totalHeight}, 可用${space.width}x${space.height}`)
      }
      
    } catch (error) {
      console.log(`❌ ${cardCount}张: 计算失败 - ${error.message}`)
    }
  })
})

console.log('\n🎯 特殊场景测试')
console.log('=' .repeat(50))

// 测试你描述的问题场景
const problemScenarios = [
  { cards: 3, expected: '应该单行显示，不分2行' },
  { cards: 4, expected: '应该2x2或1x4，第二行不应溢出' },
  { cards: 5, expected: '应该2行(3+2)，不应溢出边框' },
  { cards: 6, expected: '应该根据容器选择最佳布局' },
  { cards: 7, expected: '应该2行(4+3)，不应分3行' },
  { cards: 8, expected: '应该2行(4+4)，不应分3行' },
  { cards: 9, expected: '应该3x3，不应溢出' },
  { cards: 10, expected: '应该2行(5+5)，不应分3行' }
]

// 使用标准桌面尺寸测试
const standardContainer = { width: 1366, height: 768 }

problemScenarios.forEach(scenario => {
  try {
    const layoutResult = calculateFixedCardLayout(scenario.cards, standardContainer.width, standardContainer.height)
    const space = calculateSimpleCardSpace(standardContainer.width, standardContainer.height)
    const isValid = validateLayout(layoutResult, space)
    
    const status = isValid ? '✅' : '❌'
    const layout = `${layoutResult.layoutInfo.rows}x${layoutResult.layoutInfo.cardsPerRow}`
    
    console.log(`${status} ${scenario.cards}张卡牌: ${layout} 布局`)
    console.log(`   期望: ${scenario.expected}`)
    console.log(`   实际: ${layoutResult.layoutInfo.rows}行，每行最多${layoutResult.layoutInfo.cardsPerRow}张`)
    
    if (!isValid) {
      console.log(`   ⚠️  仍有溢出问题`)
    }
    
  } catch (error) {
    console.log(`❌ ${scenario.cards}张卡牌: 测试失败 - ${error.message}`)
  }
  console.log('')
})

console.log('测试完成！')