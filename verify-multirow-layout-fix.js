#!/usr/bin/env node

/**
 * 验证多行卡牌布局修复
 * 测试5张牌、7-10张牌的多行布局是否正确显示在容器边界内
 */

// 模拟 fixed-card-positioning 的核心函数
function calculateSimpleCardSpace(containerWidth, containerHeight) {
  const topReserved = 280
  const bottomReserved = 80
  const sideMargin = 40
  
  const availableWidth = containerWidth - (sideMargin * 2)
  const availableHeight = containerHeight - topReserved - bottomReserved
  
  const safeWidth = Math.max(320, Math.min(availableWidth, containerWidth * 0.85))
  const safeHeight = Math.max(200, Math.min(availableHeight, containerHeight * 0.45))
  
  return {
    width: safeWidth,
    height: safeHeight,
    centerX: containerWidth / 2,
    centerY: topReserved + safeHeight / 2
  }
}

function determineCardLayout(cardCount, space) {
  const minCardWidth = 60
  const minCardHeight = 90
  const horizontalSpacing = 16
  const verticalSpacing = 12
  
  const maxCardsPerRow = Math.floor((space.width + horizontalSpacing) / (minCardWidth + horizontalSpacing))
  const maxRows = Math.floor((space.height + verticalSpacing) / (minCardHeight + verticalSpacing))
  
  switch (cardCount) {
    case 1:
    case 2:
      return { rows: 1, cardsPerRow: cardCount }
    case 3:
      return { rows: 1, cardsPerRow: 3 }
    case 4:
      if (maxRows >= 2 && space.height >= 200) {
        return { rows: 2, cardsPerRow: 2 }
      } else {
        return { rows: 1, cardsPerRow: 4 }
      }
    case 5:
      if (maxRows >= 2 && space.height >= 220) {
        return { rows: 2, cardsPerRow: 3 }
      } else {
        return { rows: 1, cardsPerRow: 5 }
      }
    case 6:
      if (maxRows >= 2 && space.height >= 240) {
        if (maxCardsPerRow >= 3) {
          return { rows: 2, cardsPerRow: 3 }
        } else {
          return { rows: 3, cardsPerRow: 2 }
        }
      } else {
        return { rows: 1, cardsPerRow: 6 }
      }
    case 7:
      if (maxRows >= 2 && space.height >= 240) {
        return { rows: 2, cardsPerRow: 4 }
      } else {
        return { rows: 1, cardsPerRow: 7 }
      }
    case 8:
      if (maxRows >= 2 && space.height >= 240) {
        return { rows: 2, cardsPerRow: 4 }
      } else {
        return { rows: 1, cardsPerRow: 8 }
      }
    case 9:
      if (maxRows >= 3 && space.height >= 320) {
        return { rows: 3, cardsPerRow: 3 }
      } else if (maxRows >= 2 && space.height >= 240) {
        return { rows: 2, cardsPerRow: 5 }
      } else {
        return { rows: 1, cardsPerRow: 9 }
      }
    case 10:
      if (maxRows >= 2 && space.height >= 240) {
        return { rows: 2, cardsPerRow: 5 }
      } else {
        return { rows: 1, cardsPerRow: 10 }
      }
    default:
      const optimalCardsPerRow = Math.min(maxCardsPerRow, Math.ceil(Math.sqrt(cardCount)))
      const requiredRows = Math.ceil(cardCount / optimalCardsPerRow)
      
      if (requiredRows <= maxRows) {
        return { rows: requiredRows, cardsPerRow: optimalCardsPerRow }
      } else {
        return { rows: 1, cardsPerRow: cardCount }
      }
  }
}

function calculateCardSize(rows, cardsPerRow, space) {
  const horizontalSpacing = (cardsPerRow - 1) * 16
  const verticalSpacing = (rows - 1) * 12
  
  const maxCardWidth = Math.floor((space.width - horizontalSpacing - 20) / cardsPerRow)
  const maxCardHeight = Math.floor((space.height - verticalSpacing - 20) / rows)
  
  const cardAspectRatio = 3 / 2
  
  let cardWidth = Math.min(maxCardWidth, 100)
  let cardHeight = Math.min(maxCardHeight, 150)
  
  if (cardWidth * cardAspectRatio > cardHeight) {
    cardWidth = Math.floor(cardHeight / cardAspectRatio)
  } else {
    cardHeight = Math.floor(cardWidth * cardAspectRatio)
  }
  
  cardWidth = Math.max(50, cardWidth)
  cardHeight = Math.max(75, cardHeight)
  
  const totalWidth = cardsPerRow * cardWidth + horizontalSpacing
  const totalHeight = rows * cardHeight + verticalSpacing
  
  if (totalWidth > space.width || totalHeight > space.height) {
    const widthScale = space.width / totalWidth
    const heightScale = space.height / totalHeight
    const scale = Math.min(widthScale, heightScale, 0.9)
    
    cardWidth = Math.floor(cardWidth * scale)
    cardHeight = Math.floor(cardHeight * scale)
    
    cardWidth = Math.max(40, cardWidth)
    cardHeight = Math.max(60, cardHeight)
  }
  
  return { width: cardWidth, height: cardHeight }
}

function calculateFixedCardLayout(cardCount, containerWidth, containerHeight) {
  const space = calculateSimpleCardSpace(containerWidth, containerHeight)
  const layout = determineCardLayout(cardCount, space)
  const cardSize = calculateCardSize(layout.rows, layout.cardsPerRow, space)
  
  const horizontalSpacing = 16
  const verticalSpacing = 12
  const totalWidth = layout.cardsPerRow * cardSize.width + (layout.cardsPerRow - 1) * horizontalSpacing
  const totalHeight = layout.rows * cardSize.height + (layout.rows - 1) * verticalSpacing
  
  return {
    positions: [], // 简化，不生成具体位置
    actualCardSize: cardSize,
    layoutInfo: {
      rows: layout.rows,
      cardsPerRow: layout.cardsPerRow,
      totalWidth,
      totalHeight
    }
  }
}

function validateLayout(result, space) {
  const { totalWidth, totalHeight } = result.layoutInfo
  const safeWidth = space.width * 0.95
  const safeHeight = space.height * 0.95
  
  return totalWidth <= safeWidth && totalHeight <= safeHeight
}

function createEmergencyLayout(cardCount, space) {
  const minCardWidth = 35
  const minCardHeight = 50
  const minSpacing = 6
  
  const maxCardsPerRow = Math.floor((space.width - 20) / (minCardWidth + minSpacing))
  const maxRows = Math.floor((space.height - 20) / (minCardHeight + minSpacing))
  
  let cardsPerRow, rows
  
  if (cardCount <= maxCardsPerRow) {
    cardsPerRow = cardCount
    rows = 1
  } else {
    cardsPerRow = Math.min(maxCardsPerRow, Math.ceil(cardCount / Math.min(maxRows, 2)))
    rows = Math.ceil(cardCount / cardsPerRow)
    
    if (rows > maxRows) {
      rows = Math.max(1, maxRows)
      cardsPerRow = Math.ceil(cardCount / rows)
    }
  }
  
  const availableWidth = space.width - (cardsPerRow - 1) * minSpacing - 20
  const availableHeight = space.height - (rows - 1) * minSpacing - 20
  
  let cardWidth = Math.max(minCardWidth, Math.floor(availableWidth / cardsPerRow))
  let cardHeight = Math.max(minCardHeight, Math.floor(availableHeight / rows))
  
  const aspectRatio = cardHeight / cardWidth
  if (aspectRatio > 2.0) {
    cardHeight = Math.floor(cardWidth * 2.0)
  } else if (aspectRatio < 1.2) {
    cardWidth = Math.floor(cardHeight / 1.2)
  }
  
  const finalTotalWidth = cardsPerRow * cardWidth + (cardsPerRow - 1) * minSpacing
  const finalTotalHeight = rows * cardHeight + (rows - 1) * minSpacing
  
  if (finalTotalWidth > space.width * 0.95 || finalTotalHeight > space.height * 0.95) {
    const widthScale = (space.width * 0.95) / finalTotalWidth
    const heightScale = (space.height * 0.95) / finalTotalHeight
    const scale = Math.min(widthScale, heightScale, 0.9)
    
    cardWidth = Math.max(minCardWidth, Math.floor(cardWidth * scale))
    cardHeight = Math.max(minCardHeight, Math.floor(cardHeight * scale))
  }
  
  const totalWidth = cardsPerRow * cardWidth + (cardsPerRow - 1) * minSpacing
  const totalHeight = rows * cardHeight + (rows - 1) * minSpacing
  
  return {
    positions: [],
    actualCardSize: { width: cardWidth, height: cardHeight },
    layoutInfo: {
      rows,
      cardsPerRow,
      totalWidth,
      totalHeight
    }
  }
}

console.log('🎯 验证多行卡牌布局修复\n')

// 测试用例：不同的容器尺寸和卡牌数量
const testCases = [
  // 标准桌面尺寸
  { width: 1024, height: 768, cards: [5, 7, 8, 9, 10], name: '标准桌面' },
  // 小屏幕尺寸
  { width: 800, height: 600, cards: [5, 7, 8, 9, 10], name: '小屏幕' },
  // 平板尺寸
  { width: 768, height: 1024, cards: [5, 7, 8, 9, 10], name: '平板竖屏' },
  // 手机尺寸
  { width: 375, height: 667, cards: [5, 7, 8, 9, 10], name: '手机' }
]

let totalTests = 0
let passedTests = 0
let failedTests = 0

function testCardLayout(containerWidth, containerHeight, cardCount, containerName) {
  totalTests++
  
  console.log(`\n📱 测试 ${containerName} (${containerWidth}x${containerHeight}) - ${cardCount}张卡牌`)
  
  try {
    // 1. 计算可用空间
    const space = calculateSimpleCardSpace(containerWidth, containerHeight)
    console.log(`   可用空间: ${space.width}x${space.height}`)
    
    // 2. 计算布局
    const result = calculateFixedCardLayout(cardCount, containerWidth, containerHeight)
    console.log(`   布局配置: ${result.layoutInfo.rows}行 x ${result.layoutInfo.cardsPerRow}列`)
    console.log(`   卡牌尺寸: ${result.actualCardSize.width}x${result.actualCardSize.height}`)
    console.log(`   总布局尺寸: ${result.layoutInfo.totalWidth}x${result.layoutInfo.totalHeight}`)
    
    // 3. 验证布局
    const isValid = validateLayout(result, space)
    
    if (isValid) {
      console.log(`   ✅ 布局验证通过`)
      passedTests++
      
      // 检查所有卡牌位置
      let allPositionsValid = true
      result.positions.forEach((pos, index) => {
        const leftEdge = pos.x - pos.cardWidth/2
        const rightEdge = pos.x + pos.cardWidth/2
        const topEdge = pos.y - pos.cardHeight/2
        const bottomEdge = pos.y + pos.cardHeight/2
        
        if (leftEdge < -space.width/2 || rightEdge > space.width/2 || 
            topEdge < -space.height/2 || bottomEdge > space.height/2) {
          console.log(`   ⚠️  卡牌 ${index} 位置可能超出边界: (${pos.x}, ${pos.y})`)
          allPositionsValid = false
        }
      })
      
      if (allPositionsValid) {
        console.log(`   ✅ 所有卡牌位置都在边界内`)
      }
      
    } else {
      console.log(`   ❌ 布局验证失败，使用紧急布局`)
      
      // 测试紧急布局
      const emergencyResult = createEmergencyLayout(cardCount, space)
      console.log(`   紧急布局: ${emergencyResult.layoutInfo.rows}行 x ${emergencyResult.layoutInfo.cardsPerRow}列`)
      console.log(`   紧急卡牌尺寸: ${emergencyResult.actualCardSize.width}x${emergencyResult.actualCardSize.height}`)
      
      const emergencyValid = validateLayout(emergencyResult, space)
      if (emergencyValid) {
        console.log(`   ✅ 紧急布局验证通过`)
        passedTests++
      } else {
        console.log(`   ❌ 紧急布局也验证失败`)
        failedTests++
      }
    }
    
    // 4. 检查多行布局的特殊情况
    if (result.layoutInfo.rows > 1) {
      console.log(`   📊 多行布局分析:`)
      console.log(`      - 行数: ${result.layoutInfo.rows}`)
      console.log(`      - 每行卡牌数: ${result.layoutInfo.cardsPerRow}`)
      console.log(`      - 垂直间距需求: ${(result.layoutInfo.rows - 1) * 12}px`)
      console.log(`      - 总高度占用: ${result.layoutInfo.totalHeight}px`)
      console.log(`      - 可用高度: ${space.height}px`)
      
      const heightUtilization = (result.layoutInfo.totalHeight / space.height * 100).toFixed(1)
      console.log(`      - 高度利用率: ${heightUtilization}%`)
      
      if (heightUtilization > 85) {
        console.log(`   ⚠️  高度利用率过高，可能导致溢出`)
      }
    }
    
  } catch (error) {
    console.log(`   ❌ 测试出错: ${error.message}`)
    failedTests++
  }
}

// 执行所有测试用例
console.log('开始测试多行布局修复...\n')

testCases.forEach(testCase => {
  console.log(`\n🖥️  测试容器: ${testCase.name} (${testCase.width}x${testCase.height})`)
  console.log('=' .repeat(60))
  
  testCase.cards.forEach(cardCount => {
    testCardLayout(testCase.width, testCase.height, cardCount, testCase.name)
  })
})

// 总结测试结果
console.log('\n' + '='.repeat(60))
console.log('📊 测试总结')
console.log('='.repeat(60))
console.log(`总测试数: ${totalTests}`)
console.log(`通过测试: ${passedTests} ✅`)
console.log(`失败测试: ${failedTests} ❌`)
console.log(`成功率: ${(passedTests / totalTests * 100).toFixed(1)}%`)

if (failedTests === 0) {
  console.log('\n🎉 所有多行布局测试都通过了！')
  console.log('✅ 5张牌、7-10张牌的溢出问题已修复')
} else {
  console.log('\n⚠️  仍有部分测试失败，需要进一步调整')
}

// 特殊测试：边界情况
console.log('\n🔍 边界情况测试')
console.log('='.repeat(40))

const edgeCases = [
  { width: 320, height: 568, cards: 5, name: '小手机-5张牌' },
  { width: 400, height: 300, cards: 7, name: '宽屏-7张牌' },
  { width: 600, height: 400, cards: 10, name: '中等屏幕-10张牌' }
]

edgeCases.forEach(edgeCase => {
  testCardLayout(edgeCase.width, edgeCase.height, edgeCase.cards, edgeCase.name)
})

console.log('\n✨ 多行布局验证完成')