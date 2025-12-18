const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

/**
 * Script pour convertir les images PNG/JPG en WebP
 * Usage: node convert-to-webp.js
 */

const images = [
  'public/qr-code-don.png',
  'public/pwa-192x192.png',
  'public/pwa-512x512.png',
  'public/apple-touch-icon.png',
];

async function convertToWebP(inputPath) {
  const fullPath = path.join(__dirname, inputPath);

  if (!fs.existsSync(fullPath)) {
    console.log(`❌ Fichier introuvable: ${inputPath}`);
    return;
  }

  const outputPath = fullPath.replace(/\.(png|jpg|jpeg)$/i, '.webp');

  try {
    const stats = fs.statSync(fullPath);
    const originalSize = stats.size;

    await sharp(fullPath)
      .webp({ quality: 90, effort: 6 })
      .toFile(outputPath);

    const newStats = fs.statSync(outputPath);
    const newSize = newStats.size;
    const reduction = ((originalSize - newSize) / originalSize * 100).toFixed(1);

    console.log(`✅ Converti: ${path.basename(inputPath)}`);
    console.log(`   Avant: ${(originalSize / 1024).toFixed(1)} KB`);
    console.log(`   Après: ${(newSize / 1024).toFixed(1)} KB`);
    console.log(`   Réduction: ${reduction}%\n`);

    return { originalSize, newSize, reduction };
  } catch (err) {
    console.log(`❌ Erreur lors de la conversion de ${inputPath}: ${err.message}`);
    return null;
  }
}

async function main() {
  console.log('🎨 Conversion des images en WebP...\n');

  let totalOriginal = 0;
  let totalNew = 0;

  for (const image of images) {
    const result = await convertToWebP(image);
    if (result) {
      totalOriginal += result.originalSize;
      totalNew += result.newSize;
    }
  }

  console.log('========== RÉSUMÉ ==========');
  console.log(`Taille originale: ${(totalOriginal / 1024).toFixed(1)} KB`);
  console.log(`Taille WebP: ${(totalNew / 1024).toFixed(1)} KB`);
  console.log(`Réduction totale: ${((totalOriginal - totalNew) / totalOriginal * 100).toFixed(1)}%`);
  console.log('\n✅ Conversion terminée!');
}

main();
