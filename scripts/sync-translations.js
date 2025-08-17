#!/usr/bin/env node

/**
 * 翻译文件同步脚本
 * 将根目录的翻译文件同步到public目录
 */

const fs = require('fs');
const path = require('path');

function syncTranslationFiles() {
  console.log('🔄 Syncing translation files...');

  try {
    // 读取根目录的翻译文件
    const rootZhPath = path.join(process.cwd(), 'locales', 'zh.json');
    const rootEnPath = path.join(process.cwd(), 'locales', 'en.json');
    
    const publicZhPath = path.join(process.cwd(), 'public', 'locales', 'zh.json');
    const publicEnPath = path.join(process.cwd(), 'public', 'locales', 'en.json');

    // 检查根目录文件是否存在
    if (!fs.existsSync(rootZhPath) || !fs.existsSync(rootEnPath)) {
      console.error('❌ Root translation files not found');
      process.exit(1);
    }

    // 读取文件内容
    const rootZh = JSON.parse(fs.readFileSync(rootZhPath, 'utf8'));
    const rootEn = JSON.parse(fs.readFileSync(rootEnPath, 'utf8'));

    // 确保public/locales目录存在
    const publicLocalesDir = path.join(process.cwd(), 'public', 'locales');
    if (!fs.existsSync(publicLocalesDir)) {
      fs.mkdirSync(publicLocalesDir, { recursive: true });
    }

    // 写入public目录
    fs.writeFileSync(publicZhPath, JSON.stringify(rootZh, null, 2), 'utf8');
    fs.writeFileSync(publicEnPath, JSON.stringify(rootEn, null, 2), 'utf8');

    console.log('✅ Translation files synced successfully');
    console.log(`   - ${publicZhPath}`);
    console.log(`   - ${publicEnPath}`);

    // 验证同步结果
    const syncedZh = JSON.parse(fs.readFileSync(publicZhPath, 'utf8'));
    const syncedEn = JSON.parse(fs.readFileSync(publicEnPath, 'utf8'));

    const zhKeysCount = countKeys(syncedZh);
    const enKeysCount = countKeys(syncedEn);

    console.log(`📊 Sync summary:`);
    console.log(`   - Chinese keys: ${zhKeysCount}`);
    console.log(`   - English keys: ${enKeysCount}`);

    if (zhKeysCount !== enKeysCount) {
      console.warn('⚠️  Key count mismatch between languages');
    }

  } catch (error) {
    console.error('❌ Sync failed:', error.message);
    process.exit(1);
  }
}

function countKeys(obj, prefix = '') {
  let count = 0;
  for (const key in obj) {
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      count += countKeys(obj[key], prefix ? `${prefix}.${key}` : key);
    } else {
      count++;
    }
  }
  return count;
}

// 如果直接运行此脚本
if (require.main === module) {
  syncTranslationFiles();
}

module.exports = { syncTranslationFiles };