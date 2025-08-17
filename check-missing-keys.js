const fs = require('fs');

// Read translation files
const rootZh = JSON.parse(fs.readFileSync('locales/zh.json', 'utf8'));
const rootEn = JSON.parse(fs.readFileSync('locales/en.json', 'utf8'));

try {
  const publicZh = JSON.parse(fs.readFileSync('public/locales/zh.json', 'utf8'));
  const publicEn = JSON.parse(fs.readFileSync('public/locales/en.json', 'utf8'));

  // Function to get all translation keys from an object
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

  // Function to get nested value
  function getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  const rootZhKeys = new Set(getAllKeys(rootZh));
  const rootEnKeys = new Set(getAllKeys(rootEn));
  const publicZhKeys = new Set(getAllKeys(publicZh));
  const publicEnKeys = new Set(getAllKeys(publicEn));

  console.log('Translation key comparison:');
  console.log(`Root ZH keys: ${rootZhKeys.size}`);
  console.log(`Public ZH keys: ${publicZhKeys.size}`);
  console.log(`Root EN keys: ${rootEnKeys.size}`);
  console.log(`Public EN keys: ${publicEnKeys.size}`);

  // Check for keys in root but not in public (Chinese)
  const missingInPublicZh = [...rootZhKeys].filter(key => !publicZhKeys.has(key));
  if (missingInPublicZh.length > 0) {
    console.log(`\nMissing ${missingInPublicZh.length} keys in public/locales/zh.json:`);
    missingInPublicZh.slice(0, 20).forEach(key => {
      const value = getNestedValue(rootZh, key);
      console.log(`  - ${key}: "${value}"`);
    });
    if (missingInPublicZh.length > 20) {
      console.log(`  ... and ${missingInPublicZh.length - 20} more`);
    }
  }

  // Check for keys in root but not in public (English)
  const missingInPublicEn = [...rootEnKeys].filter(key => !publicEnKeys.has(key));
  if (missingInPublicEn.length > 0) {
    console.log(`\nMissing ${missingInPublicEn.length} keys in public/locales/en.json:`);
    missingInPublicEn.slice(0, 20).forEach(key => {
      const value = getNestedValue(rootEn, key);
      console.log(`  - ${key}: "${value}"`);
    });
    if (missingInPublicEn.length > 20) {
      console.log(`  ... and ${missingInPublicEn.length - 20} more`);
    }
  }

  if (missingInPublicZh.length === 0 && missingInPublicEn.length === 0) {
    console.log('\n✅ All translation keys are synchronized!');
  }

} catch (error) {
  console.error('Error reading translation files:', error.message);
}