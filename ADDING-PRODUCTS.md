# Adding Products to Lili's Creations

A step-by-step guide for adding, updating, and managing products on the site.

---

## How the System Works

All products live in a single file:

```
src/data/products.json
```

When the site builds, Astro reads this file and generates:
- A card for each product on the **Collection** page
- A dedicated **product detail page** at `/collection/{slug}`
- Featured products on the **Home** page (filtered by the `featured` flag)

There is no database. To add or change a product, you edit the JSON file, add images, and rebuild.

---

## Step 1: Prepare Your Images

### Requirements per Product

| Image | Purpose | Recommended Size | Required? |
|-------|---------|-----------------|-----------|
| **Primary** | Main image shown in grid cards and as the hero on the detail page | 1200 x 1500px (4:5 ratio) | Yes |
| **Alternate angle** | Shown on card hover and as second gallery image | 1200 x 1500px | Recommended |
| **Detail/close-up** | Macro shot of texture, stone, clasp, hallmark | 1200 x 1500px | Recommended |
| **Lifestyle/on-body** | Worn on hand, neck, ear, wrist | 1200 x 1500px | Recommended |
| **Additional** | Any extra views (back, scale reference, packaging) | 1200 x 1500px | Optional |

**Aim for 3-5 images per product.** More images = more buyer confidence.

### Image Format & Naming

- **Format:** `.webp` is preferred (smallest file size, great quality). `.jpg` is also fine.
- **Quality:** Export at 80-85% quality for `.webp` or `.jpg`. This preserves metal/stone detail while keeping files small.
- **Max file size:** Try to keep each image under 500KB. Under 300KB is ideal.
- **Naming convention:** Use the product slug + descriptive suffix:

```
moonlit-labradorite-drop-front.webp      (primary)
moonlit-labradorite-drop-side.webp       (alternate angle)
moonlit-labradorite-drop-detail.webp     (close-up)
moonlit-labradorite-drop-worn.webp       (lifestyle)
moonlit-labradorite-drop-clasp.webp      (additional)
```

### Where to Put Images

Place all product images in:

```
public/images/products/
```

Create this folder if it doesn't exist. You can also organize by category:

```
public/images/products/necklaces/
public/images/products/rings/
public/images/products/earrings/
public/images/products/bracelets/
```

The image `src` paths in `products.json` should start with `/images/products/`:

```json
{ "src": "/images/products/moonlit-labradorite-drop-front.webp" }
```

---

## Step 2: Add the Product to products.json

Open `src/data/products.json` and add a new object to the array. Here is the full schema with annotations:

```json
{
  "id": "moonlit-labradorite-drop",
  "slug": "moonlit-labradorite-drop",
  "name": "Moonlit Labradorite Drop",
  "price": 85.00,
  "description": "First paragraph of the full description.\n\nSecond paragraph. Use \\n\\n for paragraph breaks.",
  "shortDescription": "One-line summary for SEO meta description.",
  "materials": ["Labradorite", "Antiqued copper wire", "Copper chain"],
  "category": "Necklaces",
  "tags": ["One of a Kind", "Featured"],
  "images": [
    { "src": "/images/products/moonlit-front.webp", "alt": "Descriptive alt text", "isPrimary": true },
    { "src": "/images/products/moonlit-side.webp", "alt": "Side view description" },
    { "src": "/images/products/moonlit-detail.webp", "alt": "Detail description" },
    { "src": "/images/products/moonlit-worn.webp", "alt": "Lifestyle description" }
  ],
  "dimensions": {
    "pendant": "1.2\" x 0.8\"",
    "chainLength": "18\" (adjustable to 16\")"
  },
  "careInstructions": "Remove before swimming. Store in provided pouch.",
  "inStock": true,
  "madeToOrder": false,
  "featured": true,
  "isNew": false
}
```

### Field Reference

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique identifier. Use lowercase-kebab-case. |
| `slug` | string | Yes | URL-safe name. Usually same as `id`. This becomes the URL: `/collection/{slug}` |
| `name` | string | Yes | Display name of the piece. |
| `price` | number | Yes | Price in USD. Use a number, not a string. `85.00` not `"$85"`. |
| `description` | string | Yes | Full product description. Separate paragraphs with `\n\n`. |
| `shortDescription` | string | Yes | One-line summary (used for SEO meta tags). |
| `materials` | string[] | Yes | Array of materials. Each becomes a pill/chip on the product page. |
| `category` | string | Yes | One of: `"Necklaces"`, `"Rings"`, `"Earrings"`, `"Bracelets"` (or add new ones). |
| `tags` | string[] | Yes | Array of tags. Can be empty `[]`. Common tags: `"One of a Kind"`, `"Bestseller"`, `"New"`, `"Featured"`, `"Limited Edition"`. |
| `images` | object[] | Yes | Array of image objects (see below). **Minimum 1, recommend 3-5.** |
| `images[].src` | string | Yes | Path to image file starting with `/images/`. |
| `images[].alt` | string | Yes | Descriptive alt text for accessibility and SEO. |
| `images[].isPrimary` | boolean | No | Set to `true` on exactly ONE image. This is the main/hero image. |
| `dimensions` | object | No | Key-value pairs of measurements. Keys are auto-formatted to readable labels. |
| `careInstructions` | string | No | Care and maintenance text. |
| `inStock` | boolean | Yes | `true` = shows PayPal buy button. `false` = shows "Inquire" button. |
| `madeToOrder` | boolean | Yes | `true` = shows "Made Just for You" badge with timeline. |
| `featured` | boolean | Yes | `true` = appears on the Home page featured section. **Keep 3-5 featured items.** |
| `isNew` | boolean | Yes | `true` = can be used for "New" filtering or badges. |

### Images Array — Important Notes

- **At least one image must have `"isPrimary": true`** — this is the main display image
- **The second image** (index 1) is used as the **hover image** on collection cards
- **All images** appear as thumbnails in the product detail gallery
- **Alt text matters** — write descriptive text for each image. Good for SEO and accessibility.

Example alt text:
- "Moonlit Labradorite Drop pendant front view on linen background"
- "Moonlit Labradorite Drop showing blue-green flash of labradorite stone"
- "Moonlit Labradorite Drop detail of antiqued copper wire wrapping"
- "Moonlit Labradorite Drop necklace worn on model with white blouse"

---

## Step 3: Adding a New Category

Categories are automatically derived from the products. To add a new category (e.g., "Anklets"):

1. Simply use the new category name in your product's `"category"` field:
   ```json
   "category": "Anklets"
   ```
2. The collection page filter tabs will automatically include it on the next build.

No other changes needed.

---

## Step 4: Build and Deploy

After editing `products.json` and adding images, rebuild and deploy:

```bash
# Build the site (generates all static pages)
npm run build

# Deploy to Firebase
firebase deploy --only hosting
```

Or as a single command:

```bash
npm run build && firebase deploy --only hosting
```

### Verify Before Deploying

1. Run the dev server to preview: `npm run dev`
2. Visit `http://localhost:4321/collection` — verify new product appears in the grid
3. Click into the new product — verify all images load in the gallery
4. Check the Home page if the product is marked `featured`

---

## Step 5: PayPal Setup (One-Time)

Before products can be purchased, you need to connect your PayPal account:

### Get Your PayPal Client ID

1. Go to [developer.paypal.com](https://developer.paypal.com/)
2. Log in with your PayPal business account
3. Navigate to **Apps & Credentials**
4. Click **Create App** (or use the default sandbox app for testing)
5. Copy the **Client ID**

### Add It to the Site

Open `src/layouts/Layout.astro` and find this line:

```html
<script src="https://www.paypal.com/sdk/js?client-id=YOUR_CLIENT_ID&currency=USD...
```

Replace `YOUR_CLIENT_ID` with your actual PayPal Client ID.

### Testing vs. Live

- **Sandbox (testing):** Use the sandbox Client ID from the PayPal developer dashboard. Payments are simulated.
- **Live:** Switch to the live Client ID when ready to accept real payments. On the PayPal dashboard, toggle from "Sandbox" to "Live" and copy that Client ID.

---

## Quick-Add Checklist

Use this checklist each time you add a product:

```
[ ] Photographed the piece (3-5 angles)
[ ] Exported images as .webp at 80-85% quality, 1200x1500px
[ ] Named images with slug prefix (e.g., piece-name-front.webp)
[ ] Placed images in public/images/products/
[ ] Added product object to src/data/products.json
[ ] Set one image as isPrimary: true
[ ] Wrote descriptive alt text for each image
[ ] Set inStock, madeToOrder, featured, isNew flags
[ ] Ran npm run dev and verified the product page
[ ] Ran npm run build && firebase deploy --only hosting
```

---

## Editing or Removing Products

### Edit a Product
Simply change the fields in `products.json` and rebuild.

### Mark as Sold Out
Set `"inStock": false`. The PayPal button will be replaced with an "Inquire About This Piece" link.

### Remove a Product
Delete the product object from the JSON array and rebuild. Optionally remove its images from `public/images/products/` to save space.

### Change Featured Products
Set `"featured": true` on the products you want on the home page. Set to `false` on ones you want to remove. Keep 3-5 featured items for the best layout.

---

## Example: Adding a Brand New Product

Let's say Lili just made a new pair of earrings called "Sunrise Hoops."

### 1. Prepare Images

Export 4 photos:
```
sunrise-hoops-front.webp
sunrise-hoops-side.webp
sunrise-hoops-detail.webp
sunrise-hoops-worn.webp
```

Place them in `public/images/products/earrings/`

### 2. Add to products.json

Add this object to the end of the array (before the closing `]`):

```json
{
  "id": "sunrise-hoops",
  "slug": "sunrise-hoops",
  "name": "Sunrise Hoops",
  "price": 56.00,
  "description": "Warm gradient copper hoops that catch the light like the first rays of morning sun. Each hoop is hand-formed and gently hammered for a subtle texture.\n\nLightweight enough for all-day wear, bold enough to turn heads.",
  "shortDescription": "Hand-hammered copper gradient hoops inspired by sunrise.",
  "materials": ["Copper", "14K gold-fill ear wires"],
  "category": "Earrings",
  "tags": ["New"],
  "images": [
    { "src": "/images/products/earrings/sunrise-hoops-front.webp", "alt": "Sunrise Hoops front view showing gradient copper", "isPrimary": true },
    { "src": "/images/products/earrings/sunrise-hoops-side.webp", "alt": "Sunrise Hoops side profile showing hammered texture" },
    { "src": "/images/products/earrings/sunrise-hoops-detail.webp", "alt": "Sunrise Hoops close-up of gradient coloring" },
    { "src": "/images/products/earrings/sunrise-hoops-worn.webp", "alt": "Sunrise Hoops worn on model with hair pulled back" }
  ],
  "dimensions": {
    "diameter": "1.25\"",
    "weight": "Light (comfortable for all-day wear)"
  },
  "careInstructions": "Copper will develop a natural patina. Polish with a soft cloth to restore shine. Remove before showering.",
  "inStock": true,
  "madeToOrder": false,
  "featured": false,
  "isNew": true
}
```

### 3. Build and Deploy

```bash
npm run build && firebase deploy --only hosting
```

The new product is now live at `liliscreations.web.app/collection/sunrise-hoops`
