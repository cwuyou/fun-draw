const fs = require('fs');
const path = require('path');

// Read translation files
const rootZh = JSON.parse(fs.readFileSync('locales/zh.json', 'utf8'));
const rootEn = JSON.parse(fs.readFileSync('locales/en.json', 'utf8'));
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

// Function to set nested value
function setNestedValue(obj, path, value) {
  const keys = path.split('.');
  const lastKey = keys.pop();
  const target = keys.reduce((current, key) => {
    if (!current[key] || typeof current[key] !== 'object') {
      current[key] = {};
    }
    return current[key];
  }, obj);
  target[lastKey] = value;
}

const rootZhKeys = new Set(getAllKeys(rootZh));
const rootEnKeys = new Set(getAllKeys(rootEn));
const publicZhKeys = new Set(getAllKeys(publicZh));
const publicEnKeys = new Set(getAllKeys(publicEn));

console.log('Syncing translation files...');

// Check for keys in root but not in public (Chinese)
const missingInPublicZh = [...rootZhKeys].filter(key => !publicZhKeys.has(key));
if (missingInPublicZh.length > 0) {
  console.log(`Adding ${missingInPublicZh.length} missing keys to public/locales/zh.json:`);
  missingInPublicZh.forEach(key => {
    const value = getNestedValue(rootZh, key);
    if (value !== undefined) {
      setNestedValue(publicZh, key, value);
      console.log(`  + ${key}: ${value}`);
    }
  });
}

// Check for keys in root but not in public (English)
const missingInPublicEn = [...rootEnKeys].filter(key => !publicEnKeys.has(key));
if (missingInPublicEn.length > 0) {
  console.log(`Adding ${missingInPublicEn.length} missing keys to public/locales/en.json:`);
  missingInPublicEn.forEach(key => {
    const value = getNestedValue(rootEn, key);
    if (value !== undefined) {
      setNestedValue(publicEn, key, value);
      console.log(`  + ${key}: ${value}`);
    }
  });
}

// Write updated files
if (missingInPublicZh.length > 0) {
  fs.writeFileSync('public/locales/zh.json', JSON.stringify(publicZh, null, 2), 'utf8');
  console.log('Updated public/locales/zh.json');
}

if (missingInPublicEn.length > 0) {
  fs.writeFileSync('public/locales/en.json', JSON.stringify(publicEn, null, 2), 'utf8');
  console.log('Updated public/locales/en.json');
}

if (missingInPublicZh.length === 0 && missingInPublicEn.length === 0) {
  console.log('All translation keys are already synchronized.');
}

console.log('Translation sync completed.');