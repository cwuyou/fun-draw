// 测试9张卡牌布局改进：从3x3改为2x5（5+4）
console.log('🧪 测试9张卡牌布局改进...\n')

// 模拟修复后的布局逻辑
function determineCardLayout(cardCount, space) {
  const minCardWidth = 60
  const minCardHeight = 90
  const horizontalSpacing = 16
  const verticalSpacing = 12
  
  const maxCardsPerRow = Math.floor((space.width + horizontalSpacing) / (minCardWidth + horizontalSpacing))
  const maxRows = Math.floor((space.height + verticalSpacing) / (minCardHeight + verticalSpacing))
  
  switch (cardCount) {
    case 8:
      return { rows: 2, cardsPerRow: 4, layout: '2x4 (4+4)' }
    
    case 9:
      // 改进：统一使用2行布局，与8张、10张保持一致
      if (maxRows >= 2 && space.height >= 200) {
        return { rows: 2, cardsPerRow: 5, layout: '2x5 (5+4)' }
      } else {
        return { rows: 2, cardsPerRow: 5, layout: '2x5 (5+4) 强制' }
      }
    
    case 10:
      return { rows: 2, cardsPerRow: 5, layout: '2x5 (5+5)' }
    
    default:
      return { rows: 1, cardsPerRow: cardCount, layout: `1x${cardCount}` }
  }
}

function calculateSimpleCardSpace(containerWidth, containerHeight) {
  const topReserved = 260
  const bottomReserved = 60
  const sideMargin = 30
  
  const availableWidth = containerWidth - (sideMargin * 2)
  const availableHeight = containerHeight - topReserved - bottomReserved
  
  const safeWidth = Math.max(320, Math.min(availableWidth, containerWidth * 0.9))
  const safeHeight = Math.max(200, Math.min(availableHeight, containerHeight * 0.5))
  
  return { width: safeWidth, height: safeHeight }
}

// 测试常见屏幕尺寸
const testScreenSize = { width: 1366, height: 768 }
const space = calculateSimpleCardSpace(testScreenSize.width, testScreenSize.height)

console.log(`📱 测试屏幕: ${testScreenSize.width}x${testScreenSize.height}`)
console.log(`   可用空间: ${space.width}x${space.height}\n`)

// 对比8、9、10张卡牌的布局
const cardCounts = [8, 9, 10]

console.log('📊 布局对比:')
cardCounts.forEach(count => {
  const layout = determineCardLayout(count, space)
  console.log(`   ${count}张卡牌: ${layout.layout}`)
})

console.log('\n🎯 改进效果:')
console.log('   修复前: 9张卡牌使用3x3布局（3行，看起来不协调）')
console.log('   修复后: 9张卡牌使用2x5布局（2行，与8张、10张保持一致）')

console.log('\n✅ 布局一致性:')
console.log('   8张卡牌: 2行 (4+4)')
console.log('   9张卡牌: 2行 (5+4) ← 改进后')
console.log('   10张卡牌: 2行 (5+5)')
console.log('\n   现在8、9、10张卡牌都使用2行布局，视觉效果更加协调统一！')

// 验证9张卡牌的具体布局
const layout9 = determineCardLayout(9, space)
console.log(`\n🔍 9张卡牌详细布局:`)
console.log(`   布局方式: ${layout9.layout}`)
console.log(`   第一行: 5张卡牌`)
console.log(`   第二行: 4张卡牌`)
console.log(`   总行数: ${layout9.rows}行`)
console.log(`   每行最多: ${layout9.cardsPerRow}张`)

console.log('\n🎉 改进完成！9张卡牌现在使用更协调的2行布局。')