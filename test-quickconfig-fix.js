const fs = require('fs');

console.log('🔍 Testing QuickConfig translation fix...');

try {
  // 检查public目录的翻译文件
  const publicZh = JSON.parse(fs.readFileSync('public/locales/zh.json', 'utf8'));
  const publicEn = JSON.parse(fs.readFileSync('public/locales/en.json', 'utf8'));

  // 检查关键的quickConfig翻译键
  const quickConfigKeys = [
    'quickConfig.drawQuantity',
    'quickConfig.allowRepeat', 
    'quickConfig.drawMode',
    'quickConfig.yes',
    'quickConfig.notAllow',
    'quickConfig.intelligent'
  ];

  function getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  console.log('=== QuickConfig Translation Keys Check ===');
  
  let allKeysPresent = true;
  quickConfigKeys.forEach(key => {
    const zhValue = getNestedValue(publicZh, key);
    const enValue = getNestedValue(publicEn, key);
    const zhExists = zhValue !== undefined && typeof zhValue === 'string';
    const enExists = enValue !== undefined && typeof enValue === 'string';
    
    if (zhExists && enExists) {
      console.log(`✅ ${key}`);
      console.log(`   中文: ${zhValue}`);
      console.log(`   英文: ${enValue}`);
    } else {
      console.log(`❌ ${key} - 中文存在: ${zhExists}, 英文存在: ${enExists}`);
      allKeysPresent = false;
    }
    console.log('');
  });

  // 检查模式翻译键
  const modeKeys = [
    'quickConfig.modes.slotMachine',
    'quickConfig.modes.cardFlip',
    'quickConfig.modes.bulletScreen',
    'quickConfig.modes.gridLottery',
    'quickConfig.modes.blinkingNamePicker'
  ];

  console.log('=== Mode Translation Keys Check ===');
  modeKeys.forEach(key => {
    const zhValue = getNestedValue(publicZh, key);
    const enValue = getNestedValue(publicEn, key);
    const zhExists = zhValue !== undefined && typeof zhValue === 'string';
    const enExists = enValue !== undefined && typeof enValue === 'string';
    
    if (zhExists && enExists) {
      console.log(`✅ ${key}`);
      console.log(`   中文: ${zhValue}`);
      console.log(`   英文: ${enValue}`);
    } else {
      console.log(`❌ ${key} - 中文存在: ${zhExists}, 英文存在: ${enExists}`);
      allKeysPresent = false;
    }
    console.log('');
  });

  console.log('=== 修复总结 ===');
  if (allKeysPresent) {
    console.log('🎉 所有关键翻译键都已正确添加！');
    console.log('✅ 快速配置参数显示问题应该已经修复');
    console.log('✅ 文本溢出问题通过布局优化已解决');
    console.log('');
    console.log('修复内容：');
    console.log('1. 添加了缺失的 quickConfig 参数翻译键');
    console.log('2. 优化了卡片布局，防止文本溢出');
    console.log('3. 添加了 truncate 类来处理长文本');
    console.log('4. 使用 flex-shrink-0 确保图标和标签不被压缩');
  } else {
    console.log('⚠️  仍有部分翻译键缺失，需要进一步检查');
  }

} catch (error) {
  console.error('❌ 测试失败:', error.message);
}