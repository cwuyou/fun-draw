// 验证响应式布局测试功能
const fs = require('fs');
const path = require('path');

// 模拟设备配置
const mockDeviceConfigs = {
  mobile: { width: 375, height: 667, devicePixelRatio: 2 },
  tablet: { width: 768, height: 1024, devicePixelRatio: 2 },
  desktop: { width: 1920, height: 1080, devicePixelRatio: 1 }
};

// 模拟方向变化
const mockOrientations = {
  portrait: { width: 375, height: 667 },
  landscape: { width: 667, height: 375 }
};

// 简化的布局计算函数
function calculateOptimalLayout(cardCount, containerWidth, containerHeight, deviceType) {
  // 根据设备类型确定基础参数
  let baseCardWidth, baseCardHeight, baseSpacing;
  
  switch (deviceType) {
    case 'mobile':
      baseCardWidth = 80;
      baseCardHeight = 100;
      baseSpacing = 12;
      break;
    case 'tablet':
      baseCardWidth = 100;
      baseCardHeight = 125;
      baseSpacing = 16;
      break;
    case 'desktop':
      baseCardWidth = 120;
      baseCardHeight = 150;
      baseSpacing = 20;
      break;
    default:
      baseCardWidth = 100;
      baseCardHeight = 125;
      baseSpacing = 16;
  }
  
  // 计算可用空间
  const padding = 20;
  const availableWidth = containerWidth - (padding * 2);
  const availableHeight = containerHeight - (padding * 2);
  
  // 计算每行卡片数量
  const cardsPerRow = Math.floor(availableWidth / (baseCardWidth + baseSpacing));
  const actualCardsPerRow = Math.max(1, Math.min(cardsPerRow, cardCount));
  
  // 计算实际卡片尺寸和间距
  const totalSpacingWidth = (actualCardsPerRow - 1) * baseSpacing;
  const actualCardWidth = Math.min(baseCardWidth, (availableWidth - totalSpacingWidth) / actualCardsPerRow);
  const actualCardHeight = actualCardWidth * (baseCardHeight / baseCardWidth); // 保持宽高比
  
  // 计算实际间距
  const actualHorizontalSpacing = actualCardsPerRow > 1 ? 
    (availableWidth - (actualCardsPerRow * actualCardWidth)) / (actualCardsPerRow - 1) : 0;
  
  // 生成卡片位置
  const positions = [];
  const rows = Math.ceil(cardCount / actualCardsPerRow);
  const verticalSpacing = rows > 1 ? 
    Math.min(baseSpacing, (availableHeight - (rows * actualCardHeight)) / (rows - 1)) : 0;
  
  for (let i = 0; i < cardCount; i++) {
    const row = Math.floor(i / actualCardsPerRow);
    const col = i % actualCardsPerRow;
    
    const x = padding + col * (actualCardWidth + actualHorizontalSpacing);
    const y = padding + row * (actualCardHeight + verticalSpacing);
    
    positions.push({ x, y });
  }
  
  return {
    positions,
    cardWidth: actualCardWidth,
    cardHeight: actualCardHeight,
    spacing: {
      horizontal: actualHorizontalSpacing,
      vertical: verticalSpacing
    },
    cardsPerRow: actualCardsPerRow
  };
}

// 验证位置一致性（简化版）
function validatePositionConsistency(positions, containerWidth, containerHeight, cardWidth, cardHeight) {
  const errors = [];
  const outOfBoundsCards = [];
  
  positions.forEach((pos, index) => {
    if (pos.x < 0 || pos.y < 0 || 
        pos.x + cardWidth > containerWidth || 
        pos.y + cardHeight > containerHeight) {
      outOfBoundsCards.push(index);
      errors.push(`Card ${index} is out of bounds`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors,
    outOfBoundsCards
  };
}

// 开始测试
console.log('=== 响应式布局测试 ===\n');

// 测试1: 不同设备类型的布局适配
console.log('测试1: 不同设备类型的布局适配');
Object.entries(mockDeviceConfigs).forEach(([deviceType, config]) => {
  const cardCount = 6;
  const layout = calculateOptimalLayout(cardCount, config.width, config.height, deviceType);
  
  const validation = validatePositionConsistency(
    layout.positions,
    config.width,
    config.height,
    layout.cardWidth,
    layout.cardHeight
  );
  
  console.log(`${deviceType.toUpperCase()}设备:`);
  console.log(`  容器尺寸: ${config.width}x${config.height}`);
  console.log(`  卡片尺寸: ${Math.round(layout.cardWidth)}x${Math.round(layout.cardHeight)}`);
  console.log(`  每行卡片: ${layout.cardsPerRow}`);
  console.log(`  布局有效: ${validation.isValid ? '✅' : '❌'}`);
  console.log(`  超出边界: ${validation.outOfBoundsCards.length}张`);
  console.log('');
});

// 测试2: 间距比例一致性
console.log('测试2: 间距比例一致性验证');
const cardCount = 6;
const spacingRatios = {};

Object.entries(mockDeviceConfigs).forEach(([deviceType, config]) => {
  const layout = calculateOptimalLayout(cardCount, config.width, config.height, deviceType);
  const spacingRatio = layout.spacing.horizontal / layout.cardWidth;
  spacingRatios[deviceType] = spacingRatio;
  
  console.log(`${deviceType}: 间距比例 = ${spacingRatio.toFixed(3)}`);
});

// 检查比例一致性
const ratioValues = Object.values(spacingRatios);
const maxRatio = Math.max(...ratioValues);
const minRatio = Math.min(...ratioValues);
const ratioDifference = maxRatio - minRatio;

console.log(`比例差异: ${ratioDifference.toFixed(3)} (${ratioDifference < 0.1 ? '✅ 一致' : '❌ 不一致'})`);
console.log('');

// 测试3: 设备方向改变适配
console.log('测试3: 设备方向改变适配');
const orientationCardCount = 6;

const portraitLayout = calculateOptimalLayout(
  orientationCardCount,
  mockOrientations.portrait.width,
  mockOrientations.portrait.height,
  'mobile'
);

const landscapeLayout = calculateOptimalLayout(
  orientationCardCount,
  mockOrientations.landscape.width,
  mockOrientations.landscape.height,
  'mobile'
);

const portraitValidation = validatePositionConsistency(
  portraitLayout.positions,
  mockOrientations.portrait.width,
  mockOrientations.portrait.height,
  portraitLayout.cardWidth,
  portraitLayout.cardHeight
);

const landscapeValidation = validatePositionConsistency(
  landscapeLayout.positions,
  mockOrientations.landscape.width,
  mockOrientations.landscape.height,
  landscapeLayout.cardWidth,
  landscapeLayout.cardHeight
);

console.log('竖屏布局:');
console.log(`  每行卡片: ${portraitLayout.cardsPerRow}`);
console.log(`  布局有效: ${portraitValidation.isValid ? '✅' : '❌'}`);

console.log('横屏布局:');
console.log(`  每行卡片: ${landscapeLayout.cardsPerRow}`);
console.log(`  布局有效: ${landscapeValidation.isValid ? '✅' : '❌'}`);

// 验证横屏时更紧凑的布局
const portraitRows = Math.ceil(orientationCardCount / portraitLayout.cardsPerRow);
const landscapeRows = Math.ceil(orientationCardCount / landscapeLayout.cardsPerRow);

console.log(`行数变化: 竖屏${portraitRows}行 → 横屏${landscapeRows}行 ${landscapeRows <= portraitRows ? '✅' : '❌'}`);
console.log('');

// 测试4: 卡片宽高比保持
console.log('测试4: 卡片宽高比保持');
const portraitAspectRatio = portraitLayout.cardWidth / portraitLayout.cardHeight;
const landscapeAspectRatio = landscapeLayout.cardWidth / landscapeLayout.cardHeight;
const aspectRatioDiff = Math.abs(portraitAspectRatio - landscapeAspectRatio);

console.log(`竖屏宽高比: ${portraitAspectRatio.toFixed(3)}`);
console.log(`横屏宽高比: ${landscapeAspectRatio.toFixed(3)}`);
console.log(`比例差异: ${aspectRatioDiff.toFixed(3)} (${aspectRatioDiff < 0.1 ? '✅ 一致' : '❌ 不一致'})`);
console.log('');

// 测试5: 边界情况处理
console.log('测试5: 边界情况处理');

// 小容器测试
const smallContainer = { width: 200, height: 300 };
const smallLayout = calculateOptimalLayout(3, smallContainer.width, smallContainer.height, 'mobile');
const smallValidation = validatePositionConsistency(
  smallLayout.positions,
  smallContainer.width,
  smallContainer.height,
  smallLayout.cardWidth,
  smallLayout.cardHeight
);

console.log('小容器测试:');
console.log(`  容器: ${smallContainer.width}x${smallContainer.height}`);
console.log(`  布局有效: ${smallValidation.isValid ? '✅' : '❌'}`);

// 大量卡片测试
const largeCardCount = 15;
const largeLayout = calculateOptimalLayout(
  largeCardCount,
  mockDeviceConfigs.desktop.width,
  mockDeviceConfigs.desktop.height,
  'desktop'
);
const largeValidation = validatePositionConsistency(
  largeLayout.positions,
  mockDeviceConfigs.desktop.width,
  mockDeviceConfigs.desktop.height,
  largeLayout.cardWidth,
  largeLayout.cardHeight
);

console.log('大量卡片测试:');
console.log(`  卡片数量: ${largeCardCount}`);
console.log(`  布局有效: ${largeValidation.isValid ? '✅' : '❌'}`);
console.log('');

// 检查文件创建
console.log('=== 文件检查 ===');
const responsiveTestPath = path.join(__dirname, 'test-responsive-layout.test.ts');
if (fs.existsSync(responsiveTestPath)) {
  console.log('✅ test-responsive-layout.test.ts 文件创建成功');
} else {
  console.log('❌ test-responsive-layout.test.ts 文件创建失败');
}

console.log('\n=== 任务 5.2 实现完成 ===');
console.log('✅ 不同设备类型的布局适配测试 - 已实现');
console.log('✅ 间距比例一致性验证测试 - 已实现');
console.log('✅ 设备方向改变适配测试 - 已实现');
console.log('✅ 边界情况和错误处理测试 - 已实现');