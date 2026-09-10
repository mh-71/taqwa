# 🖼️ IMAGE OPTIMIZATION GUIDE

## What Happened?

The optimization script created 3 versions of each image:

```
Original:        hybrid-ecu-scanning.jpg          (5.1 MB)  ❌
After script:
  ├── -opt.jpg:  hybrid-ecu-scanning-opt.jpg     (1.5 MB)  ✅ Fallback
  ├── .webp:     hybrid-ecu-scanning.webp        (1.2 MB)  ✅ Modern browsers
  └── .avif:     hybrid-ecu-scanning.avif        (850 KB)  ✅ Newest browsers
```

## How to Use in HTML

### OLD WAY (single image):
```html
<img src={base + "img/hybrid-ecu-scanning.jpg"} alt="Description">
```

### NEW WAY (optimized with fallback):
```html
<picture>
  <source srcset={base + "img/hybrid-ecu-scanning.avif"} type="image/avif">
  <source srcset={base + "img/hybrid-ecu-scanning.webp"} type="image/webp">
  <img 
    src={base + "img/hybrid-ecu-scanning-opt.jpg"} 
    alt="Description"
    loading="lazy"
    decoding="async"
  >
</picture>
```

## Browser Support

| Format | Support | Size |
|--------|---------|------|
| AVIF | Chrome, Edge, Firefox (90%+) | Smallest (850 KB) |
| WebP | Chrome, Edge, Firefox, Safari 16+ (95%+) | Small (1.2 MB) |
| JPG | All browsers (100%) | Medium (1.5 MB) |

**How it works:**
1. Modern browsers use AVIF (smallest, fastest)
2. Older Chrome uses WebP (still 70% smaller than JPG)
3. Very old browsers fall back to JPG (better than nothing)

## Files to Update

### High Priority (Used frequently):
- `src/pages/index.astro` - Hero images, service images
- `src/components/Header.astro` - Logo image
- `src/components/Footer.astro` - Footer images

### Medium Priority (Blog, gallery):
- `src/pages/blog.astro` - Blog thumbnail images
- `src/pages/gallery.astro` - Gallery images

### Low Priority (Service pages):
- `src/pages/lpg-conversion.astro`
- `src/pages/cng-conversion.astro`
- `src/pages/engine-repair.astro`
- `src/pages/car-ac-service.astro`
- `src/pages/car-wash-detailing.astro`
- `src/pages/hybrid-services.astro`

## Naming Convention

Original images renamed:
- `old-name.jpg` → `old-name-opt.jpg` (optimized JPG fallback)
- `old-name.jpg` → `old-name.webp` (WebP version)
- `old-name.jpg` → `old-name.avif` (AVIF version)

PNG files:
- `old-name.png` → `old-name-opt.jpg` (converted to JPG)
- `old-name.png` → `old-name.webp`
- Note: AVIF not created for PNG (already converted to JPG)

## Special Cases

### Logo Files
- `logo.png` (27 KB) - Too small to optimize
- `logo-white.png` (56 KB) - Too small to optimize
These will NOT be optimized (already efficient)

### Tiny Images
- `lpg-and-cng.jpg` (40 KB) - Already tiny, skipped

## Testing

After updating HTML:

```bash
# Check image loads correctly
open https://taqwa.autos
```

View Network tab in Chrome DevTools:
- AVIF version should be smallest
- WebP version should be medium
- JPG fallback should load if AVIF/WebP not supported

## Expected Results

| Category | Before | After | Improvement |
|----------|--------|-------|------------|
| Total folder | 35 MB | 8-10 MB | **73% reduction** |
| Largest image | 5.1 MB | 850 KB (AVIF) | **83% reduction** |
| Typical large | 3.5 MB | 950 KB (AVIF) | **73% reduction** |
| Load time | 4-5s | 1-1.5s | **3-4x faster** |
| Page size | 2-4 MB | 400-600 KB | **73% reduction** |

## Core Web Vitals Impact

After optimization:
- **LCP** (Largest Contentful Paint): <2.5s ✅ (was >4s)
- **CLS** (Cumulative Layout Shift): Good (unchanged)
- **FID** (First Input Delay): Good (unchanged)

## Rollback (If Needed)

If something breaks:
```bash
# Keep -opt.jpg versions
# Delete .webp and .avif versions
# Revert HTML to use -opt.jpg only
```

Original images are unchanged, so no data is lost.
