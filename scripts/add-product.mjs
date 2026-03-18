#!/usr/bin/env node

/**
 * Lili's Creations — Add Product CLI
 *
 * Usage:
 *   1. Drop product images into the /inbox folder
 *   2. Run: npm run add-product
 *   3. Answer the prompts
 *   4. The script will:
 *      - Convert & optimize images to .webp (1200x1500, 82% quality)
 *      - Move them to public/images/products/{slug}/
 *      - Generate alt text from filenames
 *      - Add the product entry to src/data/products.json
 *      - Optionally build & deploy
 */

import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import readlineSync from 'readline-sync';

const ROOT = path.resolve(new URL('.', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1'), '..');
const INBOX = path.join(ROOT, 'inbox');
const PRODUCTS_JSON = path.join(ROOT, 'src', 'data', 'products.json');
const PUBLIC_IMAGES = path.join(ROOT, 'public', 'images', 'products');

const CATEGORIES = ['Necklaces', 'Rings', 'Earrings', 'Bracelets', 'Anklets', 'Brooches', 'Sets'];
const COMMON_TAGS = ['One of a Kind', 'Bestseller', 'New', 'Featured', 'Limited Edition', 'Made to Order'];
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.tiff', '.avif'];
const TARGET_WIDTH = 1200;
const TARGET_HEIGHT = 1500;
const QUALITY = 82;

// ─── Helpers ───

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function humanize(filename) {
  const name = path.parse(filename).name;
  return name
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
    .replace(/^\d+\s*/, ''); // remove leading numbers used for ordering
}

function hr() {
  console.log('\n' + '─'.repeat(50) + '\n');
}

// ─── Image Processing ───

async function processImages(slug, imageFiles) {
  const outputDir = path.join(PUBLIC_IMAGES, slug);
  fs.mkdirSync(outputDir, { recursive: true });

  const results = [];

  for (let i = 0; i < imageFiles.length; i++) {
    const file = imageFiles[i];
    const ext = path.extname(file).toLowerCase();
    const baseName = path.parse(file).name;

    // Generate output filename
    const suffix = i === 0 ? 'primary' : baseName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const outName = `${slug}-${suffix}.webp`;
    const outPath = path.join(outputDir, outName);
    const srcPath = path.join(INBOX, file);

    console.log(`  Converting: ${file} → ${outName}`);

    try {
      await sharp(srcPath)
        .resize(TARGET_WIDTH, TARGET_HEIGHT, {
          fit: 'cover',
          position: 'center',
        })
        .webp({ quality: QUALITY })
        .toFile(outPath);

      const stats = fs.statSync(outPath);
      const sizeKB = (stats.size / 1024).toFixed(0);
      console.log(`  ✓ ${outName} (${sizeKB}KB)`);

      results.push({
        src: `/images/products/${slug}/${outName}`,
        alt: `${humanize(baseName)} view`,
        isPrimary: i === 0,
      });
    } catch (err) {
      console.error(`  ✗ Failed to process ${file}: ${err.message}`);
    }
  }

  return results;
}

// ─── Prompts ───

function prompt(label, defaultVal) {
  const suffix = defaultVal ? ` [${defaultVal}]` : '';
  const answer = readlineSync.question(`  ${label}${suffix}: `);
  return answer.trim() || defaultVal || '';
}

function promptNumber(label, defaultVal) {
  while (true) {
    const answer = prompt(label, defaultVal?.toString());
    const num = parseFloat(answer);
    if (!isNaN(num) && num > 0) return num;
    console.log('  Please enter a valid number.');
  }
}

function promptChoice(label, options) {
  console.log(`\n  ${label}:`);
  options.forEach((opt, i) => console.log(`    ${i + 1}. ${opt}`));
  const idx = readlineSync.questionInt('  Choose (number): ', { limitMessage: '' }) - 1;
  if (idx >= 0 && idx < options.length) return options[idx];
  // Allow custom entry
  return prompt('  Or type a custom value');
}

function promptMulti(label, options) {
  console.log(`\n  ${label} (comma-separated numbers, or Enter to skip):`);
  options.forEach((opt, i) => console.log(`    ${i + 1}. ${opt}`));
  const answer = readlineSync.question('  Choose: ');
  if (!answer.trim()) return [];

  return answer.split(',')
    .map(s => parseInt(s.trim()) - 1)
    .filter(i => i >= 0 && i < options.length)
    .map(i => options[i]);
}

function promptYN(label, defaultYes = false) {
  const suffix = defaultYes ? '[Y/n]' : '[y/N]';
  const answer = readlineSync.question(`  ${label} ${suffix}: `).trim().toLowerCase();
  if (!answer) return defaultYes;
  return answer === 'y' || answer === 'yes';
}

// ─── Main ───

async function main() {
  console.log('\n');
  console.log("  ✦  Lili's Creations — Add New Product");
  console.log('  ✦  Drop images in /inbox, then answer the prompts below.');
  hr();

  // Check inbox
  if (!fs.existsSync(INBOX)) {
    fs.mkdirSync(INBOX, { recursive: true });
  }

  const inboxFiles = fs.readdirSync(INBOX)
    .filter(f => IMAGE_EXTENSIONS.includes(path.extname(f).toLowerCase()))
    .sort();

  if (inboxFiles.length === 0) {
    console.log('  No images found in /inbox folder.');
    console.log('  Please add product images (.jpg, .png, .webp) to the inbox/ folder and try again.');
    console.log('  Tip: Name them in the order you want (01-front.jpg, 02-side.jpg, etc.)');
    process.exit(1);
  }

  console.log(`  Found ${inboxFiles.length} image(s) in /inbox:`);
  inboxFiles.forEach((f, i) => {
    const marker = i === 0 ? ' ← will be PRIMARY' : '';
    console.log(`    ${i + 1}. ${f}${marker}`);
  });
  console.log('\n  (First image becomes the primary/hero image.)');
  console.log('  (Tip: rename files to control order before running this script.)');

  hr();

  // ─── Product Details ───

  console.log('  PRODUCT DETAILS\n');

  const name = prompt('Product name (e.g., "Sunrise Hoops")');
  if (!name) { console.log('  Name is required.'); process.exit(1); }

  const slug = slugify(name);
  console.log(`  → Slug: ${slug}`);
  console.log(`  → URL:  /collection/${slug}`);

  const price = promptNumber('Price in USD (number only)', '');
  const category = promptChoice('Category', CATEGORIES);
  const tags = promptMulti('Tags', COMMON_TAGS);

  hr();
  console.log('  MATERIALS & DESCRIPTION\n');

  const materialsRaw = prompt('Materials (comma-separated, e.g., "Sterling silver, Labradorite")');
  const materials = materialsRaw.split(',').map(m => m.trim()).filter(Boolean);

  console.log('\n  Write the full description (2-3 sentences per paragraph).');
  console.log('  Enter a blank line when done:\n');

  const descLines = [];
  let line;
  while ((line = readlineSync.question('  > ')) !== '') {
    descLines.push(line);
  }
  const description = descLines.join('\n') || `A beautiful ${category.toLowerCase().slice(0, -1)} handcrafted with ${materials.join(' and ')}.`;

  const shortDescription = prompt('Short description (1 line for SEO)', description.split('\n')[0].slice(0, 120));

  hr();
  console.log('  DIMENSIONS & CARE\n');

  const dimensions = {};
  console.log('  Enter dimensions as key: value pairs (blank line when done):');
  console.log('  Examples: "pendant: 1.2 x 0.8 inches", "chain length: 18 inches"\n');
  let dimLine;
  while ((dimLine = readlineSync.question('  > ')) !== '') {
    const [key, ...valueParts] = dimLine.split(':');
    if (key && valueParts.length) {
      const dimKey = key.trim().replace(/\s+/g, '').replace(/^(.)/, c => c.toLowerCase());
      dimensions[dimKey] = valueParts.join(':').trim();
    }
  }

  const careInstructions = prompt(
    'Care instructions',
    'Remove before swimming or bathing. Store in the provided pouch. Polish gently with a soft cloth.'
  );

  hr();
  console.log('  STATUS FLAGS\n');

  const inStock = promptYN('In stock (shows PayPal button)?', true);
  const madeToOrder = !inStock ? false : promptYN('Made to order (shows lead time badge)?', false);
  const featured = promptYN('Featured on home page?', false);
  const isNew = promptYN('Mark as "New"?', true);

  // Auto-add "New" tag if marked new and not already tagged
  if (isNew && !tags.includes('New')) tags.push('New');
  if (featured && !tags.includes('Featured')) tags.push('Featured');

  hr();
  console.log('  PROCESSING IMAGES...\n');

  const images = await processImages(slug, inboxFiles);

  if (images.length === 0) {
    console.log('  No images were processed successfully. Aborting.');
    process.exit(1);
  }

  hr();

  // ─── Build product object ───

  const product = {
    id: slug,
    slug,
    name,
    price,
    description,
    shortDescription,
    materials,
    category,
    tags,
    images,
    dimensions: Object.keys(dimensions).length > 0 ? dimensions : undefined,
    careInstructions,
    inStock,
    madeToOrder,
    featured,
    isNew,
  };

  // Clean undefined fields
  Object.keys(product).forEach(key => {
    if (product[key] === undefined) delete product[key];
  });

  // ─── Write to products.json ───

  console.log('  SAVING TO PRODUCTS.JSON...\n');

  const existing = JSON.parse(fs.readFileSync(PRODUCTS_JSON, 'utf-8'));

  // Check for duplicate
  if (existing.find(p => p.id === slug)) {
    console.log(`  ⚠ A product with slug "${slug}" already exists!`);
    if (!promptYN('Overwrite it?', false)) {
      console.log('  Aborted.');
      process.exit(0);
    }
    const idx = existing.findIndex(p => p.id === slug);
    existing[idx] = product;
  } else {
    existing.push(product);
  }

  fs.writeFileSync(PRODUCTS_JSON, JSON.stringify(existing, null, 2) + '\n');
  console.log(`  ✓ Product "${name}" saved! (${existing.length} total products)\n`);

  // ─── Clean inbox ───

  if (promptYN('Clear processed images from /inbox?', true)) {
    inboxFiles.forEach(f => fs.unlinkSync(path.join(INBOX, f)));
    console.log('  ✓ Inbox cleared.\n');
  }

  // ─── Build & Deploy ───

  hr();

  if (promptYN('Build and deploy now?', true)) {
    console.log('\n  Building site...\n');
    const { execSync } = await import('child_process');
    try {
      execSync('npx astro build', { cwd: ROOT, stdio: 'inherit' });
      console.log('\n  Deploying to Firebase...\n');
      execSync('firebase deploy --only hosting', { cwd: ROOT, stdio: 'inherit' });
      console.log(`\n  ✓ Live at: https://lili-s-creations.web.app/collection/${slug}`);
    } catch (err) {
      console.error('\n  ✗ Build/deploy failed. You can run manually:');
      console.log('    npm run build && firebase deploy --only hosting');
    }
  } else {
    console.log('\n  To deploy later, run:');
    console.log('    npm run build && firebase deploy --only hosting');
  }

  hr();
  console.log(`  ✦ All done! "${name}" is ready.`);
  console.log(`  ✦ Product page: /collection/${slug}`);
  console.log('');
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
