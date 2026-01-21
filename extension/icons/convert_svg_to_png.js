#!/usr/bin/env node
/**
 * Convert SVG to PNG icons for Chrome extension
 * Requires: sharp (npm install sharp)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function convertSvgToPng() {
  try {
    // Try to use sharp (most reliable)
    let sharp;
    try {
      sharp = (await import('sharp')).default;
    } catch (e) {
      console.log('❌ sharp not installed.');
      console.log('   Install with: npm install sharp');
      console.log('\n   Or use online tools:');
      console.log('   - https://cloudconvert.com/svg-to-png');
      console.log('   - https://convertio.co/svg-png/');
      process.exit(1);
    }

    const iconDir = __dirname;
    const svgPath = path.join(iconDir, 'icon.svg');

    if (!fs.existsSync(svgPath)) {
      console.log(`❌ SVG file not found: ${svgPath}`);
      process.exit(1);
    }

    const sizes = [16, 32, 48, 128];

    console.log(`🔄 Converting ${svgPath} to PNG icons...\n`);

    for (const size of sizes) {
      const outputPath = path.join(iconDir, `icon${size}.png`);
      try {
        await sharp(svgPath)
          .resize(size, size)
          .png()
          .toFile(outputPath);
        console.log(`✅ Created ${outputPath} (${size}x${size})`);
      } catch (error) {
        console.log(`❌ Failed to create ${outputPath}: ${error.message}`);
        process.exit(1);
      }
    }

    console.log(`\n✅ All icons created successfully!`);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

convertSvgToPng();
