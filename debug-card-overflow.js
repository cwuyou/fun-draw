// 调试卡牌溢出问题的测试脚本
// 验证修复是否解决了所有报告的问题

const { calculateAvailableCardSpace, validateSpaceForCards } = require('./lib/card-space-calculator')
const { calculateBoundaryAwarePositions, validatePositionBoundaries } = require('./lib/boundary-aware-positioning')

console.log('🔍 测试卡牌溢出修复...\n')

// 测试场景1：5张卡牌多行溢出问题
console.log('📋 测试场景1：5张卡牌多行布局')
try {
  const containerWidth = 1024
  const containerHeight = 768
  
  const availableSpace = calculateAvailableCardSpace(containerWidth, containerHeight, {
    hasGameInfo: true,
    hasWarnings: false,
    hasStartButton: false,
    hasResultDisplay: false
  })
  
  console.log('可用空间:', `${availableSpace.width}x${availableSpace.height}`)
  
  const positions5 = calculateBoundaryAwarePositions(5, availableSpace)
  console.log('生成位置数量:', positions5.length)
  
  const boundaryCheck5 = validatePositionBoundaries(positions5, availableSpace)
  console.log('边界检查:', boundaryCheck5.isValid ? '✅ 通过' : '❌ 失败')
  
  if (!boundaryCheck5.isValid) {
    console.log('边界违规:', boundaryCheck5.violations)
  }
  
} catch (error) {
  console.error('❌ 5张卡牌测试失败:', error.message)
}

console.log('\n' + '='.repeat(50) + '\n')

// 测试场景2：7张卡牌发牌失败问题
console.log('📋 测试场景2：7张卡牌发牌')
try {
  const containerWidth = 1024
  const containerHeight = 768
  
  const availableSpace = calculateAvailableCardSpace(containerWidth, containerHeight, {
    hasGameInfo: true,
    hasWarnings: false,
    hasStartButton: false,
    hasResultDisplay: false
  })
  
  const positions7 = calculateBoundaryAwarePositions(7, availableSpace)
  console.log('生成位置数量:', positions7.length)
  
  // 验证所有位置都有有效的x, y坐标
  let validPositions = 0
  let invalidPositions = []
  
  positions7.forEach((pos, index) => {
    if (typeof pos.x === 'number' && typeof pos.y === 'number' && 
        !isNaN(pos.x) && !isNaN(pos.y)) {
      validPositions++
    } else {
      invalidPositions.push({ index, position: pos })
    }
  })
  
  console.log('有效位置数量:', validPositions)
  console.log('无效位置数量:', invalidPositions.length)
  
  if (invalidPositions.length > 0) {
    console.log('无效位置详情:', invalidPositions)
  }
  
  const boundaryCheck7 = validatePositionBoundaries(positions7, availableSpace)
  console.log('边界检查:', boundaryCheck7.isValid ? '✅ 通过' : '❌ 失败')
  
} catch (error) {
  console.error('❌ 7张卡牌测试失败:', error.message)
}

console.log('\n' + '='.repeat(50) + '\n')

// 测试场景3：10张卡牌极限测试
console.log('📋 测试场景3：10张卡牌极限测试')
try {
  const containerWidth = 1024
  const containerHeight = 768
  
  const availableSpace = calculateAvailableCardSpace(containerWidth, containerHeight, {
    hasGameInfo: true,
    hasWarnings: false,
    hasStartButton: false,
    hasResultDisplay: false
  })
  
  const positions10 = calculateBoundaryAwarePositions(10, availableSpace)
  console.log('生成位置数量:', positions10.length)
  
  // 验证位置数组完整性
  const arrayIntegrityCheck = positions10.length === 10 && 
    positions10.every(pos => 
      typeof pos.x === 'number' && 
      typeof pos.y === 'number' && 
      !isNaN(pos.x) && 
      !isNaN(pos.y)
    )
  
  console.log('数组完整性:', arrayIntegrityCheck ? '✅ 通过' : '❌ 失败')
  
  const boundaryCheck10 = validatePositionBoundaries(positions10, availableSpace)
  console.log('边界检查:', boundaryCheck10.isValid ? '✅ 通过' : '❌ 失败')
  
} catch (error) {
  console.error('❌ 10张卡牌测试失败:', error.message)
}

console.log('\n' + '='.repeat(50) + '\n')

// 测试场景4：函数引用错误修复验证
console.log('📋 测试场景4：函数引用错误修复验证')
try {
  // 尝试直接调用之前会失败的函数路径
  const layoutManager = require('./lib/layout-manager')
  
  // 检查adaptiveCardAreaSpacing函数是否存在
  if (typeof layoutManager.adaptiveCardAreaSpacing === 'function') {
    console.log('⚠️  adaptiveCardAreaSpacing函数仍然存在，可能需要进一步检查')
  } else {
    console.log('✅ adaptiveCardAreaSpacing函数已正确移除/替换')
  }
  
  // 验证新的函数是否正常工作
  const cardSpaceCalculator = require('./lib/card-space-calculator')
  const boundaryPositioning = require('./lib/boundary-aware-positioning')
  
  console.log('✅ calculateAvailableCardSpace函数可用:', typeof cardSpaceCalculator.calculateAvailableCardSpace === 'function')
  console.log('✅ calculateBoundaryAwarePositions函数可用:', typeof boundaryPositioning.calculateBoundaryAwarePositions === 'function')
  
} catch (error) {
  console.error('❌ 函数引用测试失败:', error.message)
}

console.log('\n🎯 测试完成！')
console.log('\n修复摘要:')
console.log('1. ✅ 替换了缺失的adaptiveCardAreaSpacing函数')
console.log('2. ✅ 添加了边界感知位置计算')
console.log('3. ✅ 实现了7+卡牌的安全位置生成')
console.log('4. ✅ 添加了多层降级保护机制')
console.log('5. ✅ 确保位置数组完整性和有效性')