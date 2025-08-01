const fs = require('fs');

// Read the current translation files
let enTranslations, zhTranslations;

try {
  enTranslations = JSON.parse(fs.readFileSync('public/locales/en.json', 'utf8'));
  console.log('✅ English JSON is valid');
} catch (error) {
  console.log('❌ English JSON error:', error.message);
  process.exit(1);
}

try {
  zhTranslations = JSON.parse(fs.readFileSync('public/locales/zh.json', 'utf8'));
  console.log('✅ Chinese JSON is valid');
} catch (error) {
  console.log('❌ Chinese JSON error:', error.message);
  process.exit(1);
}

// Check if the required keys exist
const requiredKeys = [
  'gridLottery.title',
  'gridLottery.readyToStart', 
  'gridLottery.startDraw',
  'blinkingNamePicker.title',
  'blinkingNamePicker.startBlinking'
];

console.log('\n🔍 Checking required translation keys...');
console.log('Available sections in EN:', Object.keys(enTranslations));
console.log('Available sections in ZH:', Object.keys(zhTranslations));

requiredKeys.forEach(key => {
  const [section, subkey] = key.split('.');
  
  const enExists = enTranslations[section] && enTranslations[section][subkey];
  const zhExists = zhTranslations[section] && zhTranslations[section][subkey];
  
  console.log(`${key}:`);
  console.log(`  EN: ${enExists ? '✅' : '❌'} ${enExists || 'MISSING'}`);
  console.log(`  ZH: ${zhExists ? '✅' : '❌'} ${zhExists || 'MISSING'}`);
  
  // Debug: show what's actually in the section
  if (!enExists) {
    console.log(`  EN Section keys: ${enTranslations[section] ? Object.keys(enTranslations[section]).join(', ') : 'Section not found'}`);
  }
  if (!zhExists) {
    console.log(`  ZH Section keys: ${zhTranslations[section] ? Object.keys(zhTranslations[section]).join(', ') : 'Section not found'}`);
  }
});

console.log('\n✅ Translation file validation complete');