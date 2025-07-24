// 验证9张卡牌布局修复
console.log('🧪 验证9张卡牌布局修复...\n')

// 模拟常见的屏幕尺寸测试
const testScreenSize = {
  width: 1366,  // 常见笔记本屏幕宽度
  height: 768   // 常见笔记本屏幕高度
}

console.log(`📱 测试屏幕尺寸: ${testScreenSize.width}x${testScreenSize.height}`)

// 模拟空间计算（基于修复后的逻辑）
function calculateSimpleCardSpace(containerWidth, containerHeight) {
  const topReserved = 260  // 修复后的顶部预留
  const bottomReserved = 60   // 修复后的底部预留
  const sideMargin = 30       // 修复后的左右边距
  
  const availableWidth = containerWidth - (sideMargin * 2)
  const availableHeight = containerHeight - topReserved - bottomReserved
  
  const safeWidth = Math.max(320, Math.min(availableWidth, containerWidth * 0.9))
  const safeHeight = Math.max(200, Math.min(availableHeight, containerHeight * 0.5))
  
  return {
    width: safeWidth,
    height: safeHeight,
    centerX: containerWidth / 2,
    centerY: topReserved + safeHeight / 2
  }
}

// 模拟9张卡牌的布局决策（基于修复后的逻辑）
function determineCardLayout(cardCount, space) {
  const minCardWidth = 60
  const minCardHeight = 90
  const horizontalSpacing = 16
  const verticalSpacing = 12
  
  const maxCardsPerRow = Math.floor((space.width + horizontalSpacing) / (minCardWidth + horizontalSpacing))
  const maxRows = Math.floor((space.height + verticalSpacing) / (minCardHeight + verticalSpacing))
  
  console.log(`   最大可容纳: ${maxCardsPerRow}列 x ${maxRows}行`)
  
  // 9张卡牌的修复逻辑
  if (maxRows >= 3 && space.height >= 320) {
    return { rows: 3, cardsPerRow: 3, reason: '3x3布局' }
  } else if (maxRows >= 2 && space.height >= 240) {
    return { rows: 2, cardsPerRow: 5, reason: '2x5布局（5+4）' }
  } else {
    // 修复：不再强制单行，而是使用2行布局
    return { rows: 2, cardsPerRow: 5, reason: '强制2行布局（避免单行溢出）' }
  }
}

// 模拟卡牌尺寸计算（基于修复后的逻辑）
function calculateCardSize(rows, cardsPerRow, space) {
  const horizontalSpacing = (cardsPerRow - 1) * 16
  const verticalSpacing = (rows - 1) * 12
  
  const maxCardWidth = Math.floor((space.width - horizontalSpacing - 20) / cardsPerRow)
  const maxCardHeight = Math.floor((space.height - verticalSpacing - 20) / rows)
  
  // 修复：多行布局时使用更小的限制
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
  
  // 确保最小尺寸
  cardWidth = Math.max(50, cardWidth)
  cardHeight = Math.max(75, cardHeight)
  
  return { width: cardWidth, height: cardHeight }
}

// 执行测试
const space = calculateSimpleCardSpace(testScreenSize.width, testScreenSize.height)
console.log(`   可用卡牌空间: ${space.width}x${space.height}`)

const layout = determineCardLayout(9, space)
console.log(`   选择的布局: ${layout.rows}行 x ${layout.cardsPerRow}列 (${layout.reason})`)

const cardSize = calculateCardSize(layout.rows, layout.cardsPerRow, space)
console.log(`   卡牌尺寸: ${cardSize.width}x${cardSize.height}`)

// 计算总布局尺寸
const horizontalSpacing = (layout.cardsPerRow - 1) * 16
const verticalSpacing = (layout.rows - 1) * 12
const totalWidth = layout.cardsPerRow * cardSize.width + horizontalSpacing
const totalHeight = layout.rows * cardSize.height + verticalSpacing

console.log(`   总布局尺寸: ${totalWidth}x${totalHeight}`)

// 验证是否溢出
const widthOverflow = totalWidth > space.width
const heightOverflow = totalHeight > space.height

console.log('\n🎯 修复验证结果:')
console.log(`   ✅ 避免单行布局: ${layout.rows > 1 ? '是' : '否'}`)
console.log(`   ✅ 宽度不溢出: ${!widthOverflow ? '是' : '否'} (${totalWidth}/${space.width})`)
console.log(`   ✅ 高度不溢出: ${!heightOverflow ? '是' : '否'} (${totalHeight}/${space.height})`)
console.log(`   ✅ 卡牌可读性: ${cardSize.width >= 50 && cardSize.height >= 75 ? '是' : '否'}`)

const widthUtilization = (totalWidth / space.width * 100).toFixed(1)
const heightUtilization = (totalHeight / space.height * 100).toFixed(1)
console.log(`   📊 空间利用率: 宽度 ${widthUtilization}%, 高度 ${heightUtilization}%`)

if (widthOverflow || heightOverflow) {
  console.log('\n❌ 仍然存在溢出问题!')
  if (widthOverflow) console.log(`   宽度溢出: ${totalWidth - space.width}px`)
  if (heightOverflow) console.log(`   高度溢出: ${totalHeight - space.height}px`)
} else {
  console.log('\n✅ 修复成功! 9张卡牌布局不再溢出容器边界')
}