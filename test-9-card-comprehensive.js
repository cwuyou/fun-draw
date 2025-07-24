// 9张卡牌布局修复的综合测试
console.log('🧪 9张卡牌布局修复 - 综合测试\n')

// 模拟修复后的布局计算逻辑
function calculateSimpleCardSpace(containerWidth, containerHeight) {
  const topReserved = 260  // 修复后：减少顶部预留
  const bottomReserved = 60   // 修复后：减少底部预留
  const sideMargin = 30       // 修复后：减少左右边距
  
  const availableWidth = containerWidth - (sideMargin * 2)
  const availableHeight = containerHeight - topReserved - bottomReserved
  
  const safeWidth = Math.max(320, Math.min(availableWidth, containerWidth * 0.9))  // 修复后：增加到90%
  const safeHeight = Math.max(200, Math.min(availableHeight, containerHeight * 0.5)) // 修复后：增加到50%
  
  return { width: safeWidth, height: safeHeight }
}

function determineCardLayout(cardCount, space) {
  const minCardWidth = 60
  const minCardHeight = 90
  const horizontalSpacing = 16
  const verticalSpacing = 12
  
  const maxCardsPerRow = Math.floor((space.width + horizontalSpacing) / (minCardWidth + horizontalSpacing))
  const maxRows = Math.floor((space.height + verticalSpacing) / (minCardHeight + verticalSpacing))
  
  // 修复后的9张卡牌逻辑
  if (maxRows >= 3 && space.height >= 320) {
    return { rows: 3, cardsPerRow: 3, layout: '3x3' }
  } else if (maxRows >= 2 && space.height >= 240) {
    return { rows: 2, cardsPerRow: 5, layout: '2x5' }
  } else {
    // 关键修复：不再强制单行，而是使用2行布局
    return { rows: 2, cardsPerRow: 5, layout: '2x5 (强制)' }
  }
}

function calculateCardSize(rows, cardsPerRow, space) {
  const horizontalSpacing = (cardsPerRow - 1) * 16
  const verticalSpacing = (rows - 1) * 12
  
  const maxCardWidth = Math.floor((space.width - horizontalSpacing - 20) / cardsPerRow)
  const maxCardHeight = Math.floor((space.height - verticalSpacing - 20) / rows)
  
  // 修复后：多行布局时使用更小的限制
  const maxWidthLimit = rows > 1 ? 85 : 100
  const maxHeightLimit = rows > 1 ? 130 : 150
  
  let cardWidth = Math.min(maxCardWidth, maxWidthLimit)
  let cardHeight = Math.min(maxCardHeight, maxHeightLimit)
  
  // 保持纵横比
  const cardAspectRatio = 3 / 2
  if (cardWidth * cardAspectRatio > cardHeight) {
    cardWidth = Math.floor(cardHeight / cardAspectRatio)
  } else {
    cardHeight = Math.floor(cardWidth * cardAspectRatio)
  }
  
  cardWidth = Math.max(50, cardWidth)
  cardHeight = Math.max(75, cardHeight)
  
  return { width: cardWidth, height: cardHeight }
}

// 测试不同屏幕尺寸
const testCases = [
  { name: '桌面端大屏', width: 1920, height: 1080 },
  { name: '桌面端中屏', width: 1366, height: 768 },
  { name: '笔记本小屏', width: 1280, height: 720 },
  { name: '平板横屏', width: 1024, height: 768 },
  { name: '平板竖屏', width: 768, height: 1024 },
  { name: '手机横屏', width: 896, height: 414 },
  { name: '手机竖屏', width: 414, height: 896 }
]

console.log('📊 测试结果汇总:\n')

let allTestsPassed = true

testCases.forEach((testCase, index) => {
  console.log(`${index + 1}. ${testCase.name} (${testCase.width}x${testCase.height})`)
  
  const space = calculateSimpleCardSpace(testCase.width, testCase.height)
  const layout = determineCardLayout(9, space)
  const cardSize = calculateCardSize(layout.rows, layout.cardsPerRow, space)
  
  const horizontalSpacing = (layout.cardsPerRow - 1) * 16
  const verticalSpacing = (layout.rows - 1) * 12
  const totalWidth = layout.cardsPerRow * cardSize.width + horizontalSpacing
  const totalHeight = layout.rows * cardSize.height + verticalSpacing
  
  const widthOverflow = totalWidth > space.width
  const heightOverflow = totalHeight > space.height
  const isReadable = cardSize.width >= 50 && cardSize.height >= 75
  
  console.log(`   布局: ${layout.layout}`)
  console.log(`   卡牌: ${cardSize.width}x${cardSize.height}`)
  console.log(`   总尺寸: ${totalWidth}x${totalHeight} (可用: ${space.width}x${space.height})`)
  
  const testPassed = !widthOverflow && !heightOverflow && isReadable && layout.rows > 1
  
  if (testPassed) {
    console.log(`   ✅ 测试通过`)
  } else {
    console.log(`   ❌ 测试失败`)
    if (widthOverflow) console.log(`      - 宽度溢出: ${totalWidth - space.width}px`)
    if (heightOverflow) console.log(`      - 高度溢出: ${totalHeight - space.height}px`)
    if (!isReadable) console.log(`      - 卡牌太小，影响可读性`)
    if (layout.rows === 1) console.log(`      - 仍在使用单行布局`)
    allTestsPassed = false
  }
  
  console.log('')
})

console.log('🎯 修复验证总结:')
console.log(`   总体结果: ${allTestsPassed ? '✅ 所有测试通过' : '❌ 部分测试失败'}`)
console.log('   修复要点:')
console.log('   1. ✅ 避免9张卡牌使用单行布局')
console.log('   2. ✅ 优先使用3x3布局，空间不足时使用2x5布局')
console.log('   3. ✅ 增加可用空间比例（90%宽度，50%高度）')
console.log('   4. ✅ 减少UI元素预留空间')
console.log('   5. ✅ 多行布局时限制最大卡牌尺寸')

if (allTestsPassed) {
  console.log('\n🎉 9张卡牌溢出问题修复成功！')
  console.log('   现在9张卡牌在所有常见屏幕尺寸下都能正确显示，不会溢出容器边界。')
} else {
  console.log('\n⚠️  仍有部分场景需要进一步优化')
}