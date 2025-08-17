#!/usr/bin/env node

/**
 * 翻译文件优化脚本
 * 优化翻译文件结构，确保一致性和准确性
 */

const fs = require('fs');
const path = require('path');

function optimizeTranslations() {
  console.log('🔧 Optimizing translation files...');

  try {
    // 读取根目录的翻译文件
    const rootZhPath = path.join(process.cwd(), 'locales', 'zh.json');
    const rootEnPath = path.join(process.cwd(), 'locales', 'en.json');
    
    if (!fs.existsSync(rootZhPath) || !fs.existsSync(rootEnPath)) {
      console.error('❌ Root translation files not found');
      process.exit(1);
    }

    const rootZh = JSON.parse(fs.readFileSync(rootZhPath, 'utf8'));
    const rootEn = JSON.parse(fs.readFileSync(rootEnPath, 'utf8'));

    // 优化翻译文件结构
    const optimizedZh = optimizeTranslationStructure(rootZh);
    const optimizedEn = optimizeTranslationStructure(rootEn);

    // 验证翻译键一致性
    const zhKeys = getAllKeys(optimizedZh);
    const enKeys = getAllKeys(optimizedEn);
    
    const missingInZh = enKeys.filter(key => !zhKeys.includes(key));
    const missingInEn = zhKeys.filter(key => !enKeys.includes(key));

    if (missingInZh.length > 0) {
      console.warn('⚠️  Keys missing in zh.json:', missingInZh.slice(0, 5));
    }

    if (missingInEn.length > 0) {
      console.warn('⚠️  Keys missing in en.json:', missingInEn.slice(0, 5));
    }

    // 写入优化后的文件
    fs.writeFileSync(rootZhPath, JSON.stringify(optimizedZh, null, 2), 'utf8');
    fs.writeFileSync(rootEnPath, JSON.stringify(optimizedEn, null, 2), 'utf8');

    // 同步到public目录
    const publicZhPath = path.join(process.cwd(), 'public', 'locales', 'zh.json');
    const publicEnPath = path.join(process.cwd(), 'public', 'locales', 'en.json');

    // 确保public/locales目录存在
    const publicLocalesDir = path.join(process.cwd(), 'public', 'locales');
    if (!fs.existsSync(publicLocalesDir)) {
      fs.mkdirSync(publicLocalesDir, { recursive: true });
    }

    fs.writeFileSync(publicZhPath, JSON.stringify(optimizedZh, null, 2), 'utf8');
    fs.writeFileSync(publicEnPath, JSON.stringify(optimizedEn, null, 2), 'utf8');

    console.log('✅ Translation files optimized and synced');
    console.log(`📊 Chinese keys: ${zhKeys.length}`);
    console.log(`📊 English keys: ${enKeys.length}`);
    
    if (missingInZh.length === 0 && missingInEn.length === 0) {
      console.log('🎉 All translation keys are consistent!');
    } else {
      console.log(`⚠️  Found ${missingInZh.length + missingInEn.length} inconsistent keys`);
    }

  } catch (error) {
    console.error('❌ Optimization failed:', error.message);
    process.exit(1);
  }
}

function optimizeTranslationStructure(translations) {
  // 深拷贝以避免修改原对象
  const optimized = JSON.parse(JSON.stringify(translations));
  
  // 确保关键部分存在
  const requiredSections = [
    'common',
    'navigation', 
    'home',
    'drawConfig',
    'quickConfig',
    'drawingModes',
    'quickConfigTemplates',
    'experienceTemplates'
  ];

  requiredSections.forEach(section => {
    if (!optimized[section]) {
      optimized[section] = {};
    }
  });

  // 确保drawConfig部分有必要的键
  if (!optimized.drawConfig.quickConfigTab) {
    optimized.drawConfig.quickConfigTab = optimized.drawConfig.quickConfig || 'Quick Config';
  }

  // 排序键以提高可读性
  return sortObjectKeys(optimized);
}

function sortObjectKeys(obj) {
  if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
    return obj;
  }

  const sorted = {};
  const keys = Object.keys(obj).sort();
  
  keys.forEach(key => {
    sorted[key] = sortObjectKeys(obj[key]);
  });

  return sorted;
}

function getAllKeys(obj, prefix = '') {
  let keys = [];
  
  for (const key in obj) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      keys = keys.concat(getAllKeys(obj[key], fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  
  return keys;
}

// 如果直接运行此脚本
if (require.main === module) {
  optimizeTranslations();
}

module.exports = { optimizeTranslations };