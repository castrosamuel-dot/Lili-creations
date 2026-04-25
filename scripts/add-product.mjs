#!/usr/bin/env node

/**
 * Lili's Creations — Add Product CLI
 *
 * Supports two modes:
 *
 * SINGLE MODE (loose images):
 *   1. Drop product images directly into /inbox
 *   2. Run: npm run add-product
 *
 * BATCH MODE (subfolders):
 *   1. Create a subfolder per product in /inbox:
 *      inbox/sunrise-hoops/01-front.jpg, 02-side.jpg ...
 *      inbox/river-stone-ring/01-front.jpg, 02-worn.jpg ...
 *   2. Run: npm run add-product
 *   3. The script detects folders and processes each product in sequence.
 *      Folder name becomes the suggested product name.
 *
 * The script will:
 *   - Convert & optimize images to .webp (1200x1500, 82% quality)
 *   - Move them to public/images/products/{slug}/
 *   - Generate alt text from filenames
 *   - Add the product entry to src/data/products.json
 *   - Optionally build & deploy after all products are added
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

function humanize(text) {
  return text
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
    .replace(/^\d+\s*/, '');
}

function hr() {
  console.log('\n' + '─'.repeat(50) + '\n');
}

function getImageFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => {
      const full = path.join(dir, f);
      return fs.statSync(full).isFile() && IMAGE_EXTENSIONS.includes(path.extname(f).toLowerCase());
    })
    .sort();
}

function getSubfolders(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => {
      const full = path.join(dir, f);
      return fs.statSync(full).isDirectory() && f !== '.gitkeep';
    })
    .sort();
}

// ─── Image Processing ───

async function processImages(slug, imageFiles, sourceDir) {
  const outputDir = path.join(PUBLIC_IMAGES, slug);
  fs.mkdirSync(outputDir, { recursive: true });

  const results = [];

  for (let i = 0; i < imageFiles.length; i++) {
    const file = imageFiles[i];
    const baseName = path.parse(file).name;

    const suffix = i === 0 ? 'primary' : baseName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const outName = `${slug}-${suffix}.webp`;
    const outPath = path.join(outputDir, outName);
    const srcPath = path.join(sourceDir, file);

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
  const answer = readlineSync.question('  Choose (number, or type custom): ');
  const idx = parseInt(answer) - 1;
  if (idx >= 0 && idx < options.length) return options[idx];
  return answer.trim() || options[0];
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

// ─── Process One Product ───

async function processOneProduct(imageFiles, sourceDir, suggestedName, productIndex, totalProducts) {
  const batchLabel = totalProducts > 1 ? ` (${productIndex}/${totalProducts})` : '';

  console.log(`  PRODUCT DETAILS${batchLabel}\n`);

  // Show images
  console.log(`  Found ${imageFiles.length} image(s):`);
  imageFiles.forEach((f, i) => {
    const marker = i === 0 ? ' ← PRIMARY' : '';
    console.log(`    ${i + 1}. ${f}${marker}`);
  });
  console.log('');

  const name = prompt('Product name', suggestedName);
  if (!name) { console.log('  Name is required. Skipping.'); return null; }

  const slug = slugify(name);
  console.log(`  → Slug: ${slug}`);
  console.log(`  → URL:  /collection/${slug}`);

  const price = promptNumber('Price in USD (number only)', '');
  const category = promptChoice('Category', CATEGORIES);
  const tags = promptMulti('Tags', COMMON_TAGS);

  hr();
  console.log('  MATERIALS & DESCRIPTION\n');

  const materialsRaw = prompt('Materials (comma-separated)', '');
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

  if (isNew && !tags.includes('New')) tags.push('New');
  if (featured && !tags.includes('Featured')) tags.push('Featured');

  hr();
  console.log('  PROCESSING IMAGES...\n');

  const images = await processImages(slug, imageFiles, sourceDir);

  if (images.length === 0) {
    console.log('  No images were processed successfully. Skipping this product.');
    return null;
  }

  // Build product object
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

  return product;
}

// ─── Save Products ───

function saveProducts(newProducts) {
  const existing = JSON.parse(fs.readFileSync(PRODUCTS_JSON, 'utf-8'));

  for (const product of newProducts) {
    const dupeIdx = existing.findIndex(p => p.id === product.id);
    if (dupeIdx >= 0) {
      console.log(`  ⚠ "${product.name}" already exists — overwriting.`);
      existing[dupeIdx] = product;
    } else {
      existing.push(product);
    }
  }

  fs.writeFileSync(PRODUCTS_JSON, JSON.stringify(existing, null, 2) + '\n');
  return existing.length;
}

// ─── Clean Up ───

function cleanInbox(subfolders, looseFiles) {
  // Remove processed subfolders
  for (const folder of subfolders) {
    const fullPath = path.join(INBOX, folder);
    fs.rmSync(fullPath, { recursive: true, force: true });
  }
  // Remove loose files
  for (const file of looseFiles) {
    fs.unlinkSync(path.join(INBOX, file));
  }
}

// ─── Main ───

async function main() {
  console.log('\n');
  console.log("  ✦  Lili's Creations — Add Product CLI");
  hr();

  if (!fs.existsSync(INBOX)) {
    fs.mkdirSync(INBOX, { recursive: true });
  }

  // Detect mode: subfolders (batch) or loose files (single)
  const subfolders = getSubfolders(INBOX);
  const looseFiles = getImageFiles(INBOX);

  if (subfolders.length === 0 && looseFiles.length === 0) {
    console.log('  No images found in /inbox.');
    console.log('');
    console.log('  SINGLE PRODUCT:');
    console.log('    Drop images directly into inbox/');
    console.log('    (01-front.jpg, 02-side.jpg, 03-detail.jpg)');
    console.log('');
    console.log('  BATCH (multiple products):');
    console.log('    Create a subfolder per product in inbox/');
    console.log('    inbox/sunrise-hoops/01-front.jpg, 02-side.jpg');
    console.log('    inbox/cedar-pendant/01-front.jpg, 02-detail.jpg');
    console.log('');
    process.exit(1);
  }

  // Determine what we're processing
  const batches = []; // { name, imageFiles, sourceDir }

  if (subfolders.length > 0) {
    // ─── BATCH MODE ───
    console.log(`  BATCH MODE: Found ${subfolders.length} product folder(s)\n`);

    for (const folder of subfolders) {
      const folderPath = path.join(INBOX, folder);
      const images = getImageFiles(folderPath);
      if (images.length === 0) {
        console.log(`  ⚠ Skipping "${folder}" — no images found`);
        continue;
      }
      console.log(`    📁 ${folder}/ (${images.length} images)`);
      batches.push({
        suggestedName: humanize(folder),
        imageFiles: images,
        sourceDir: folderPath,
      });
    }

    // Also pick up loose files as one more product if present
    if (looseFiles.length > 0) {
      console.log(`    📄 ${looseFiles.length} loose image(s) in inbox root`);
      batches.push({
        suggestedName: '',
        imageFiles: looseFiles,
        sourceDir: INBOX,
      });
    }

    console.log(`\n  Total: ${batches.length} product(s) to add.`);

  } else {
    // ─── SINGLE MODE ───
    console.log(`  SINGLE MODE: Found ${looseFiles.length} image(s) in /inbox\n`);
    looseFiles.forEach((f, i) => {
      const marker = i === 0 ? ' ← PRIMARY' : '';
      console.log(`    ${i + 1}. ${f}${marker}`);
    });
    console.log('\n  (First image becomes the primary. Rename files to control order.)');

    batches.push({
      suggestedName: '',
      imageFiles: looseFiles,
      sourceDir: INBOX,
    });
  }

  hr();

  // ─── Process each product ───

  const addedProducts = [];
  const total = batches.length;

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];

    if (total > 1) {
      console.log(`  ━━━ Product ${i + 1} of ${total} ━━━\n`);
    }

    const product = await processOneProduct(
      batch.imageFiles,
      batch.sourceDir,
      batch.suggestedName,
      i + 1,
      total
    );

    if (product) {
      addedProducts.push(product);
      console.log(`  ✓ "${product.name}" ready!\n`);
    }

    if (i < batches.length - 1) {
      hr();
      if (!promptYN('Continue to next product?', true)) {
        console.log('  Stopping batch. Products completed so far will be saved.');
        break;
      }
      hr();
    }
  }

  if (addedProducts.length === 0) {
    console.log('  No products were added.');
    process.exit(0);
  }

  // ─── Save all products ───

  hr();
  console.log('  SAVING PRODUCTS...\n');

  const totalCount = saveProducts(addedProducts);

  console.log(`  ✓ ${addedProducts.length} product(s) saved! (${totalCount} total in catalog)\n`);

  addedProducts.forEach(p => {
    console.log(`    • ${p.name} → /collection/${p.slug}`);
  });

  // ─── Clean inbox ───

  hr();

  if (promptYN('Clear processed images from /inbox?', true)) {
    cleanInbox(subfolders, looseFiles);
    console.log('  ✓ Inbox cleared.\n');
  }

  // ─── Build & Deploy ───

  const { execSync } = await import('child_process');

  if (promptYN('Build and deploy now?', true)) {
    console.log('\n  Building site...\n');
    try {
      execSync('npx astro build', { cwd: ROOT, stdio: 'inherit' });
      console.log('\n  Deploying to Firebase...\n');
      execSync('firebase deploy --only hosting', { cwd: ROOT, stdio: 'inherit' });
      console.log('\n  ✓ Deployed! New product pages:');
      addedProducts.forEach(p => {
        console.log(`    https://lili-s-creations.web.app/collection/${p.slug}`);
      });
    } catch (err) {
      console.error('\n  ✗ Build/deploy failed. Run manually:');
      console.log('    npm run deploy');
    }
  } else {
    console.log('\n  To deploy later, run:');
    console.log('    npm run deploy');
  }

  // ─── Git Commit & Push ───

  hr();

  if (promptYN('Commit & push to GitHub (keeps catalog in sync across machines)?', true)) {
    try {
      // Stage products.json and all product images
      execSync('git add src/data/products.json', { cwd: ROOT, stdio: 'inherit' });
      execSync('git add public/images/products/', { cwd: ROOT, stdio: 'inherit' });

      // Build commit message from added product names
      const names = addedProducts.map(p => p.name).join(', ');
      const commitMsg = addedProducts.length === 1
        ? `Add product: ${names}`
        : `Add ${addedProducts.length} products: ${names}`;

      execSync(`git commit -m "${commitMsg}"`, { cwd: ROOT, stdio: 'inherit' });
      execSync('git push', { cwd: ROOT, stdio: 'inherit' });
      console.log('\n  ✓ Pushed to GitHub! Catalog is now in sync.');
    } catch (err) {
      console.error('\n  ✗ Git push failed. You can sync manually:');
      console.log('    git add src/data/products.json public/images/products/');
      console.log('    git commit -m "Add new product(s)"');
      console.log('    git push');
    }
  } else {
    console.log('\n  To sync later, run:');
    console.log('    git add src/data/products.json public/images/products/');
    console.log('    git commit -m "Add new product(s)"');
    console.log('    git push');
  }

  hr();
  console.log(`  ✦ All done! ${addedProducts.length} product(s) added.`);
  console.log('');
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
