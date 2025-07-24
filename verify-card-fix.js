// 简单验证卡牌修复的脚本
console.log('🎯 卡牌溢出修复验证')
console.log('=' .repeat(50))

// 模拟修复后的布局逻辑
function determineCardLayout(cardCount, containerWidth, containerHeight) {
  const aspectRatio = containerWidth / containerHeight
  
  switch (cardCount) {
    case 1:
    case 2:
      return { rows: 1, cardsPerRow: cardCount, description: '单行布局' }
    
    case 3:
      return { rows: 1, cardsPerRow: 3, description: '单行3张' }
    
    case 4:
      if (containerHeight > containerWidth * 0.6) {
        return { rows: 2, cardsPerRow: 2, description: '2x2方形布局' }
      } else {
        return { rows: 1, cardsPerRow: 4, description: '单行4张' }
      }
    
    case 5:
      return { rows: 2, cardsPerRow: 3, description: '2行布局(3+2)' }
    
    case 6:
      if (aspectRatio > 2.0) {
        return { rows: 1, cardsPerRow: 6, description: '单行6张(超宽屏)' }
      } else if (aspectRatio > 1.2) {
        return { rows: 2, cardsPerRow: 3, description: '2x3布局' }
      } else {
        return { rows: 3, cardsPerRow: 2, description: '3x2布局(高屏)' }
      }
    
    case 7:
    case 8:
      return { rows: 2, cardsPerRow: 4, description: '2行布局(4+4或4+3)' }
    
    case 9:
      return { rows: 3, cardsPerRow: 3, description: '3x3方形布局' }
    
    case 10:
      return { rows: 2, cardsPerRow: 5, description: '2行布局(5+5)' }
    
    default:
      const cardsPerRow = Math.ceil(Math.sqrt(cardCount))
      const rows = Math.ceil(cardCount / cardsPerRow)
      return { rows, cardsPerRow, description: `${rows}x${cardsPerRow}通用布局` }
  }
}

// 测试问题场景
const problemScenarios = [
  { cards: 3, issue: '之前分2行显示，现在应该单行' },
  { cards: 4, issue: '之前第二行溢出，现在应该在边界内' },
  { cards: 5, issue: '之前2行溢出，现在应该合理分布' },
  { cards: 6, issue: '之前表现正常，现在应该保持' },
  { cards: 7, issue: '之前分3行溢出，现在应该2行' },
  { cards: 8, issue: '之前分3行溢出，现在应该2行' },
  { cards: 9, issue: '之前分3行溢出，现在应该3x3' },
  { cards: 10, issue: '之前分3行溢出，现在应该2行' }
]

// 标准桌面尺寸
const containerWidth = 1366
const containerHeight = 768

console.log(`容器尺寸: ${containerWidth}x${containerHeight}`)
console.log('')

problemScenarios.forEach(scenario => {
  const layout = determineCardLayout(scenario.cards, containerWidth, containerHeight)
  
  console.log(`${scenario.cards}张卡牌:`)
  console.log(`  问题: ${scenario.issue}`)
  console.log(`  修复: ${layout.description} (${layout.rows}行 x ${layout.cardsPerRow}列)`)
  
  // 简单的空间检查
  const cardWidth = 100  // 假设卡牌宽度
  const cardHeight = 150 // 假设卡牌高度
  const spacing = 16     // 间距
  
  const totalWidth = layout.cardsPerRow * cardWidth + (layout.cardsPerRow - 1) * spacing
  const totalHeight = layout.rows * cardHeight + (layout.rows - 1) * spacing
  
  const availableWidth = containerWidth - 80  // 减去边距
  const availableHeight = containerHeight - 280 // 减去UI元素
  
  const fitsWidth = totalWidth <= availableWidth
  const fitsHeight = totalHeight <= availableHeight
  
  if (fitsWidth && fitsHeight) {
    console.log(`  ✅ 布局合理，不会溢出`)
  } else {
    console.log(`  ⚠️  可能仍有问题: 宽度${fitsWidth ? '✅' : '❌'} 高度${fitsHeight ? '✅' : '❌'}`)
  }
  
  console.log('')
})

console.log('🎯 修复要点总结:')
console.log('1. 3张卡牌: 改为单行显示')
console.log('2. 4-5张卡牌: 优化2行布局，确保不溢出')
console.log('3. 6张卡牌: 根据屏幕比例选择最佳布局')
console.log('4. 7-10张卡牌: 避免3行布局，优先使用2行')
console.log('5. 所有布局: 预留足够边距，避免遮挡UI元素')
console.log('')
console.log('验证完成！请测试实际效果。')