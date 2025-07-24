// 测试9张卡牌布局修复
const { calculateFixedCardLayout, validateLayout, calculateSimpleCardSpace } = require('./lib/fixed-card-positioning.ts')

console.log('🧪 Testing 9-card layout fix...\n')

// 模拟不同屏幕尺寸
const testCases = [
  { name: '桌面端 (1920x1080)', width: 1920, height: 1080 },
  { name: '笔记本 (1366x768)', width: 1366, height: 768 },
  { name: '平板横屏 (1024x768)', width: 1024, height: 768 },
  { name: '平板竖屏 (768x1024)', width: 768, height: 1024 },
  { name: '手机横屏 (896x414)', width: 896, height: 414 },
  { name: '手机竖屏 (414x896)', width: 414, height: 896 }
]

testCases.forEach(testCase => {
  console.log(`📱 ${testCase.name}`)
  console.log(`   容器尺寸: ${testCase.width}x${testCase.height}`)
  
  try {
    // 计算可用空间
    const space = calculateSimpleCardSpace(testCase.width, testCase.height)
    console.log(`   可用空间: ${space.width}x${space.height}`)
    
    // 计算9张卡牌布局
    const layout = calculateFixedCardLayout(9, testCase.width, testCase.height)
    console.log(`   布局配置: ${layout.layoutInfo.rows}行 x ${layout.layoutInfo.cardsPerRow}列`)
    console.log(`   卡牌尺寸: ${layout.actualCardSize.width}x${layout.actualCardSize.height}`)
    console.log(`   总布局尺寸: ${layout.layoutInfo.totalWidth}x${layout.layoutInfo.totalHeight}`)
    
    // 验证布局
    const isValid = validateLayout(layout, space)
    console.log(`   ✅ 布局验证: ${isValid ? '通过' : '❌ 失败'}`)
    
    // 检查溢出情况
    const widthUtilization = (layout.layoutInfo.totalWidth / space.width * 100).toFixed(1)
    const heightUtilization = (layout.layoutInfo.totalHeight / space.height * 100).toFixed(1)
    console.log(`   📊 空间利用率: 宽度 ${widthUtilization}%, 高度 ${heightUtilization}%`)
    
    // 检查是否有溢出
    if (layout.layoutInfo.totalWidth > space.width) {
      console.log(`   ⚠️  宽度溢出: ${layout.layoutInfo.totalWidth - space.width}px`)
    }
    if (layout.layoutInfo.totalHeight > space.height) {
      console.log(`   ⚠️  高度溢出: ${layout.layoutInfo.totalHeight - space.height}px`)
    }
    
    // 检查位置数组
    console.log(`   🎯 生成位置数量: ${layout.positions.length}/9`)
    
    // 验证所有位置都有效
    const invalidPositions = layout.positions.filter(pos => 
      typeof pos.x !== 'number' || 
      typeof pos.y !== 'number' || 
      isNaN(pos.x) || 
      isNaN(pos.y)
    )
    
    if (invalidPositions.length > 0) {
      console.log(`   ❌ 发现 ${invalidPositions.length} 个无效位置`)
    } else {
      console.log(`   ✅ 所有位置都有效`)
    }
    
  } catch (error) {
    console.log(`   ❌ 计算失败: ${error.message}`)
  }
  
  console.log('')
})

console.log('🎯 重点测试：9张卡牌在常见屏幕尺寸下的表现')
console.log('✅ 修复目标：')
console.log('   1. 9张卡牌不应该使用单行布局（会导致溢出）')
console.log('   2. 应该使用2行或3行布局，确保卡牌尺寸合理')
console.log('   3. 所有卡牌都应该在容器边界内')
console.log('   4. 卡牌尺寸应该保持可读性（不能太小）')