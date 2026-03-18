# Lili's Creations — Project Guide for Claude

## What This Is

An artisan handmade jewelry website for **Lili's Creations**, built with Astro v6, hosted on Firebase, with PayPal checkout. The site is live at **https://lili-s-creations.web.app** and the repo is at **https://github.com/castrosamuel-dot/Lili-creations**.

## Tech Stack

- **Framework:** Astro v6 (static site generator, zero JS by default)
- **Styling:** Vanilla CSS with custom properties (no Tailwind, no preprocessor)
- **Fonts:** Google Fonts — Cormorant (headings) + Josefin Sans (body)
- **Payments:** PayPal JS SDK (client-side checkout)
- **Hosting:** Firebase Hosting (free tier)
- **Repo:** GitHub (`castrosamuel-dot/Lili-creations`, branch `master`)

## Color Palette — "Golden Meadow"

| Role | Hex |
|------|-----|
| Background | `#FAF8F5` |
| Surface | `#F3EDE4` |
| Primary (gold) | `#C5A258` |
| Secondary (sage) | `#A3B18A` |
| Accent (dusty rose) | `#C9A9A6` |
| Text | `#3D3630` |
| Text light | `#8A7F72` |
| Border | `#DDD5C8` |

## Brand Voice

Intimate, warm, earthy, elegant. First-person from Lili. Never corporate. Micro-copy uses elegant alternatives: "Add to Basket" not "Add to Cart", "Say Hello" not "Contact", "Browse the Collection" not "Shop", "Meet the Maker" not "About".

## Project Structure

```
src/
├── data/
│   └── products.json          ← SINGLE SOURCE OF TRUTH for all products
├── components/
│   ├── Header.astro           ← Sticky nav, mobile hamburger menu
│   ├── Footer.astro           ← Newsletter signup, botanical divider
│   ├── Hero.astro             ← Full/compact modes, animated entrance
│   ├── ProductCard.astro      ← Hover zoom, gleam effect, tags
│   └── SectionHeader.astro    ← Centered title + gold divider
├── layouts/
│   └── Layout.astro           ← Global layout, PayPal SDK, scroll observer
├── pages/
│   ├── index.astro            ← Home (hero, featured, story, process, testimonials)
│   ├── collection.astro       ← Filterable product grid
│   ├── collection/[slug].astro ← Dynamic product detail pages (auto-generated)
│   ├── about.astro            ← Meet the Maker
│   ├── custom.astro           ← Custom order inquiry form
│   ├── contact.astro          ← Contact form
│   └── 404.astro              ← "Wandered Off" page
└── styles/
    └── global.css             ← All CSS variables, resets, utilities, animations
public/
├── images/                    ← Product images, hero, maker photo
└── favicon.svg
```

## How Products Work

All products are defined in `src/data/products.json`. Each product has:
- `id`, `slug`, `name`, `price` (number, not string)
- `images[]` — array of `{ src, alt, isPrimary }` objects
- `materials[]`, `category`, `tags[]`
- `dimensions` (object), `careInstructions` (string)
- `inStock`, `madeToOrder`, `featured`, `isNew` (booleans)

Astro reads this file at build time and generates:
- Product cards on `/collection` (all products)
- Featured cards on `/` home page (`featured: true`)
- Individual detail pages at `/collection/{slug}` via `[slug].astro`

**To add a product:** Add images to `public/images/products/`, add an object to `products.json`, rebuild. See `ADDING-PRODUCTS.md` for the full guide.

**To mark sold out:** Set `"inStock": false` — PayPal button becomes "Inquire" link.

**To feature/unfeature:** Toggle `"featured": true/false` — controls home page display.

## Key Commands

```bash
npm run dev              # Dev server at localhost:4321
npm run build            # Build static site to dist/
npm run deploy           # Build + deploy to Firebase (one command)
npm run add-product      # Interactive CLI to add a new product (images → prompts → deploy)
```

## PayPal Integration

- SDK loaded in `Layout.astro` head tag (async)
- Client ID is in the script src URL (currently sandbox)
- Each product page creates orders via `actions.order.create()` with price from `products.json`
- Quantity selector on product pages affects order total
- Success shows thank-you message, error shows contact fallback
- To go live: replace sandbox Client ID with live Client ID from developer.paypal.com

## Animations & Interactions

- **Scroll reveals:** `.animate-on-scroll` class + IntersectionObserver in Layout.astro
- **Stagger delays:** `.delay-1` through `.delay-5` classes
- **View Transitions:** Astro ClientRouter for smooth page navigation
- **Hover effects:** Product cards scale 1.04 with shadow, gleam sweep effect
- **Mobile menu:** Hamburger with animated bars, staggered link reveals
- **Reduced motion:** All animations disabled via `prefers-reduced-motion: reduce`

## Common Tasks

### Add a new product (automated)
1. Drop images into the `inbox/` folder (name them 01-front.jpg, 02-side.jpg, etc.)
2. Run `npm run add-product`
3. Answer the prompts — images are auto-converted to .webp, resized, and added to products.json
4. The script offers to build and deploy automatically

### Add a new product (manual)
1. Add images to `public/images/products/{slug}/`
2. Add object to `src/data/products.json`
3. `npm run deploy`

### Change the color palette
Edit CSS custom properties in `src/styles/global.css` under `:root`

### Add a new page
Create `src/pages/pagename.astro`, import Layout, add nav link in `src/components/Header.astro`

### Update navigation
Edit the `navItems` array in `src/components/Header.astro`

### Change hero content
Edit the `<Hero>` component props in the relevant page file

### Fix broken images
Check that image paths in `products.json` match actual files in `public/images/`

### Deploy after any change
Always: `npm run deploy`

## Important Notes

- **Never edit files in `dist/`** — they are regenerated on every build
- **Product prices in JSON are numbers** (85.00), not strings ("$85")
- **One image must have `isPrimary: true`** per product
- **Categories are auto-derived** from products — no need to register them separately
- **The PayPal SDK script has the Client ID inline** in Layout.astro — if it needs rotating, that's where it lives
