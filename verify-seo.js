#!/usr/bin/env node

/**
 * 🔍 SEO VERIFICATION SCRIPT
 * Vérifiez que tous les meta tags SEO sont présents
 * Usage: node verify-seo.js ou exécutez dans la console DevTools (F12)
 */

console.log('🔍 SEO VERIFICATION SCRIPT\n');
console.log('============================\n');

// Tableau de vérification
const checks = {
  'Title tag': () => document.title ? `PASS: ${document.title.substring(0, 60)}...` : 'FAIL: Missing',
  'Meta description': () => document.querySelector('meta[name="description"]')?.content || 'FAIL: Missing',
  'Meta keywords': () => document.querySelector('meta[name="keywords"]')?.content?.substring(0, 60) + '...' || 'FAIL: Missing',
  'Meta robots': () => document.querySelector('meta[name="robots"]')?.content || 'FAIL: Missing',
  'Canonical URL': () => document.querySelector('link[rel="canonical"]')?.href || 'WARN: No canonical',
  'OG Title': () => document.querySelector('meta[property="og:title"]')?.content || 'FAIL: Missing',
  'OG Description': () => document.querySelector('meta[property="og:description"]')?.content?.substring(0, 50) + '...' || 'FAIL: Missing',
  'OG Image': () => document.querySelector('meta[property="og:image"]')?.content || 'WARN: No image',
  'OG URL': () => document.querySelector('meta[property="og:url"]')?.content || 'FAIL: Missing',
  'OG Type': () => document.querySelector('meta[property="og:type"]')?.content || 'FAIL: Missing',
  'Twitter Card': () => document.querySelector('meta[name="twitter:card"]')?.content || 'WARN: No Twitter Card',
  'Twitter Title': () => document.querySelector('meta[name="twitter:title"]')?.content || 'WARN: No Twitter Title',
  'Author': () => document.querySelector('meta[name="author"]')?.content || 'WARN: No author',
  'Viewport': () => document.querySelector('meta[name="viewport"]')?.content || 'FAIL: Missing',
  'Charset': () => document.querySelector('meta[charset]')?.charset || 'FAIL: Missing',
};

// Exécuter les vérifications
let passCount = 0;
let warnCount = 0;
let failCount = 0;

Object.entries(checks).forEach(([name, check]) => {
  const result = check();
  
  if (result && result.includes('PASS')) {
    passCount++;
    console.log(`[PASS] ${name}:`);
  } else if (result && result.includes('WARN')) {
    warnCount++;
    console.log(`[WARN] ${name}:`);
  } else {
    failCount++;
    console.log(`[FAIL] ${name}:`);
  }
  
  console.log(`   ${result}\n`);
});

// Vérifier JSON-LD
console.log('JSON-LD Schemas:\n');
const jsonLd = document.querySelectorAll('script[type="application/ld+json"]');
if (jsonLd.length > 0) {
  console.log(`[PASS] Found ${jsonLd.length} JSON-LD schema(s):`);
  jsonLd.forEach((script, i) => {
    try {
      const schema = JSON.parse(script.textContent);
      console.log(`   [${i+1}] @type: ${schema['@type'] || schema['@graph']?.[0]?.['@type'] || 'Unknown'}`);
    } catch (e) {
      console.log(`   [${i+1}] Invalid JSON`);
    }
  });
} else {
  console.log('[FAIL] No JSON-LD schemas found');
}

// Résumé
console.log('\n============================');
console.log('SUMMARY:\n');
console.log(`[PASS] Passed:   ${passCount}`);
console.log(`[WARN] Warnings: ${warnCount}`);
console.log(`[FAIL] Failed:   ${failCount}`);

const score = Math.round((passCount / (passCount + warnCount + failCount)) * 100);
console.log(`\nSEO Score: ${score}% (${score >= 80 ? '[PASS] Excellent' : score >= 60 ? '[WARN] Good' : '[FAIL] Needs work'})`);

console.log('\n============================');
console.log('NEXT STEPS:\n');
console.log('1. If you see [FAIL], fix those meta tags');
console.log('2. If you see [WARN], those are optional but recommended');
console.log('3. Verify robots.txt: https://anosunu.com/robots.txt');
console.log('4. Verify sitemap.xml: https://anosunu.com/sitemap.xml');
console.log('5. Submit sitemap to Google: https://search.google.com/search-console');

console.log('\nSEO Verification Complete!\n');
