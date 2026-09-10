/**
 * Image Optimization Script
 * Compresses JPG/PNG images and converts to WebP/AVIF formats
 *
 * Usage: node optimize-images.js
 */

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const IMG_DIR = path.join(__dirname, 'public', 'img');
const STATS = {
  original: 0,
  optimized: 0,
  saved: 0,
  files: [],
};

async function optimizeImage(filePath) {
  const filename = path.basename(filePath);
  const ext = path.extname(filename).toLowerCase();

  // Skip logo files - they're already small
  if (filename.includes('logo')) {
    console.log(`⏭️  Skipping logo: ${filename}`);
    return;
  }

  // Skip LPG-and-CNG (very small already)
  if (filename === 'lpg-and-cng.jpg') {
    console.log(`⏭️  Skipping tiny image: ${filename}`);
    return;
  }

  try {
    const basename = path.basename(filename, ext);
    const originalSize = fs.statSync(filePath).size;

    console.log(`\n📸 Processing: ${filename}`);
    console.log(`   Size: ${(originalSize / 1024 / 1024).toFixed(2)} MB`);

    // 1. Compress & optimize original JPG (quality 82)
    if (ext === '.jpg' || ext === '.jpeg') {
      const optimizedJpg = path.join(IMG_DIR, `${basename}-opt.jpg`);
      await sharp(filePath)
        .jpeg({ quality: 82, progressive: true, mozjpeg: true })
        .toFile(optimizedJpg);

      const jpgSize = fs.statSync(optimizedJpg).size;
      const jpgReduction = ((1 - jpgSize / originalSize) * 100).toFixed(1);
      console.log(`   ✅ JPG optimized: ${(jpgSize / 1024 / 1024).toFixed(2)} MB (-${jpgReduction}%)`);

      STATS.optimized += jpgSize;
      STATS.files.push({ file: `${basename}-opt.jpg`, size: jpgSize, format: 'JPG' });

      // 2. Convert to WebP (quality 80)
      const webp = path.join(IMG_DIR, `${basename}.webp`);
      await sharp(filePath)
        .resize(2000, 2000, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 80 })
        .toFile(webp);

      const webpSize = fs.statSync(webp).size;
      const webpReduction = ((1 - webpSize / originalSize) * 100).toFixed(1);
      console.log(`   ✅ WebP converted: ${(webpSize / 1024 / 1024).toFixed(2)} MB (-${webpReduction}%)`);

      STATS.optimized += webpSize;
      STATS.files.push({ file: `${basename}.webp`, size: webpSize, format: 'WebP' });

      // 3. Convert to AVIF (quality 70 - AVIF compresses better)
      const avif = path.join(IMG_DIR, `${basename}.avif`);
      await sharp(filePath)
        .resize(2000, 2000, { fit: 'inside', withoutEnlargement: true })
        .avif({ quality: 70 })
        .toFile(avif);

      const avifSize = fs.statSync(avif).size;
      const avifReduction = ((1 - avifSize / originalSize) * 100).toFixed(1);
      console.log(`   ✅ AVIF converted: ${(avifSize / 1024 / 1024).toFixed(2)} MB (-${avifReduction}%)`);

      STATS.optimized += avifSize;
      STATS.files.push({ file: `${basename}.avif`, size: avifSize, format: 'AVIF' });

    } else if (ext === '.png') {
      // For PNG: convert to JPG first, then create WebP/AVIF
      const optimizedJpg = path.join(IMG_DIR, `${basename}-opt.jpg`);
      await sharp(filePath)
        .jpeg({ quality: 82, progressive: true, mozjpeg: true })
        .toFile(optimizedJpg);

      const jpgSize = fs.statSync(optimizedJpg).size;
      const jpgReduction = ((1 - jpgSize / originalSize) * 100).toFixed(1);
      console.log(`   ✅ Converted to JPG: ${(jpgSize / 1024 / 1024).toFixed(2)} MB (-${jpgReduction}%)`);

      STATS.optimized += jpgSize;
      STATS.files.push({ file: `${basename}-opt.jpg`, size: jpgSize, format: 'JPG' });

      // Also create WebP
      const webp = path.join(IMG_DIR, `${basename}.webp`);
      await sharp(filePath)
        .resize(2000, 2000, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 80 })
        .toFile(webp);

      const webpSize = fs.statSync(webp).size;
      console.log(`   ✅ WebP version: ${(webpSize / 1024 / 1024).toFixed(2)} MB`);
      STATS.optimized += webpSize;
      STATS.files.push({ file: `${basename}.webp`, size: webpSize, format: 'WebP' });
    }

    STATS.original += originalSize;

  } catch (error) {
    console.error(`   ❌ Error processing ${filename}:`, error.message);
  }
}

async function main() {
  console.log('🚀 Starting Image Optimization...\n');

  // Sharp is already installed as dependency, no need to check

  const files = fs.readdirSync(IMG_DIR)
    .filter(f => /\.(jpg|jpeg|png)$/i.test(f))
    .sort();

  console.log(`📁 Found ${files.length} images to process\n`);
  console.log('═'.repeat(60));

  for (const file of files) {
    const filePath = path.join(IMG_DIR, file);
    await optimizeImage(filePath);
  }

  console.log('\n' + '═'.repeat(60));
  console.log('\n📊 OPTIMIZATION SUMMARY:\n');

  const originalMB = (STATS.original / 1024 / 1024).toFixed(2);
  const optimizedMB = (STATS.optimized / 1024 / 1024).toFixed(2);
  const savedMB = (STATS.original - STATS.optimized / 3) / 1024 / 1024; // Rough estimate

  console.log(`✅ Original folder size:    ${originalMB} MB`);
  console.log(`✅ After optimization:      ${optimizedMB} MB (for one format)`);
  console.log(`📈 Reduction per format:    ${((1 - STATS.optimized / STATS.original / 3) * 100).toFixed(1)}%`);

  console.log(`\n📋 Files created:`);
  const formats = {};
  STATS.files.forEach(f => {
    if (!formats[f.format]) formats[f.format] = 0;
    formats[f.format]++;
  });

  Object.entries(formats).forEach(([fmt, count]) => {
    console.log(`   • ${count} ${fmt} files created`);
  });

  console.log('\n✨ Next step: Update HTML files to use <picture> tags');
  console.log('   See OPTIMIZATION_GUIDE.md for instructions\n');
}

main().catch(console.error);
