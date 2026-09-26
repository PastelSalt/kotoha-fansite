// Builds web-ready images in public/assets from the untouched originals in assets/.
//   * backgrounds → WebP landscape widths + portrait (9:16) crops centred on a focal point
//   * UI images   → WebP at 1x/2x widths (alpha kept)
//   * vector      → clover fill/outline, divider tile, favicon (SVG)
//   * favicon PNGs + Open Graph share image
// Usage: npm run images:optimize            (skips files that already exist)
//        npm run images:optimize -- --force (rebuild everything)
import sharp from 'sharp';
import { mkdir, writeFile, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = (p) => path.join(root, 'assets', p);
const out = (p) => path.join(root, 'public', 'assets', p);
const force = process.argv.includes('--force');

const exists = (p) => access(p).then(() => true, () => false);
async function emit(file, build) {
  if (!force && (await exists(file))) return;
  await mkdir(path.dirname(file), { recursive: true });
  await build(file);
  console.log('wrote', path.relative(root, file));
}

// focal = horizontal centre (0–1) of the subject, used for portrait crops (from the mobile references)
const BACKGROUNDS = [
  { name: 'home', file: 'backgrounds/home_bg.jpeg', focal: 0.45 },
  { name: 'about', file: 'backgrounds/about_bg.png', focal: 0.5 },
  { name: 'news', file: 'backgrounds/news_bg.jpeg', focal: 0.52 },
  { name: 'discography', file: 'backgrounds/discography_bg.jpeg', focal: 0.33 },
  { name: 'gallery', file: 'backgrounds/gallery_bg.jpeg', focal: 0.5 },
  { name: 'loader1', file: 'backgrounds/bg1.jpeg', focal: 0.3 },   // pajamas (also mobile menu)
  { name: 'loader2', file: 'backgrounds/bg2.jpeg', focal: 0.53 },  // birthday
  { name: 'loader3', file: 'backgrounds/bg3.jpeg', focal: 0.5 },   // green cardigan
];
const LANDSCAPE_WIDTHS = [1280, 1920, 2560];
const PORTRAIT_WIDTHS = [720, 1080];

const UI_IMAGES = [
  { name: 'logo', file: 'icons/kotoha_logo.png', widths: [500, 1000] },
  { name: 'moesoft', file: 'icons/moesoft_logo.png', widths: [360, 707] },
  { name: 'profile', file: 'icons/kotoha_profile_picture_square.jpg', widths: [200, 400] },
  { name: 'pose', file: 'model/kotoha_pose1_fullbody.png', widths: [450, 900] },
  { name: 'mascot', file: 'model/kotoha_mascot_fullbody_modelsheet.png', widths: [300, 600] },
  // front view only (top-left of the turnaround sheet) for empty/error states
  { name: 'mascot-front', file: 'model/kotoha_mascot_fullbody_modelsheet.png', widths: [240], extract: { left: 30, top: 20, width: 540, height: 460 } },
  { name: 'icon-x', file: 'icons/twitter.png', widths: [96] },
  { name: 'icon-youtube', file: 'icons/youtube.png', widths: [96] },
  { name: 'icon-twitch', file: 'icons/twitch.png', widths: [96] },
  // Official TwitCasting app icon (Moi Corporation brand guideline pack): resized only, never altered
  { name: 'icon-twitcasting', file: 'icons/twitcasting.png', widths: [96] },
];

const CLOVER_PATH = 'M286 85 A153 153 0 1 1 505 300 A153 153 0 1 1 288 517 A153 153 0 1 1 68 300 A153 153 0 1 1 286 85 Z';
const cloverSvg = ({ fill, stroke = '#63A23D', width = 10 }) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="15 30 545 545"><path d="${CLOVER_PATH}" fill="${fill}" stroke="${stroke}" stroke-width="${width}" stroke-linejoin="round"/></svg>\n`;
// Two scallops per tile (tiles seamlessly with background-repeat: repeat-x)
const DIVIDER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 165 78" width="165" height="78" preserveAspectRatio="none"><path d="M0 0H82.5V37A41.25 41.25 0 0 1 0 37Z" fill="#67AD55"/><path d="M82.5 0H165V37A41.25 41.25 0 0 1 82.5 37Z" fill="#A1CBA0"/></svg>\n`;
const FAVICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="15 30 545 545"><path d="${CLOVER_PATH}" fill="#ffffff" stroke="#63A23D" stroke-width="44" stroke-linejoin="round"/><path d="${CLOVER_PATH}" fill="#7bb54c" transform="translate(150 150) scale(0.5)"/></svg>\n`;

async function backgrounds() {
  for (const bg of BACKGROUNDS) {
    const input = src(bg.file);
    const { width: W, height: H } = await sharp(input).metadata();
    for (const w of LANDSCAPE_WIDTHS.filter((w) => w <= W)) {
      await emit(out(`bg/${bg.name}-${w}.webp`), (f) =>
        sharp(input).resize({ width: w }).webp({ quality: 72, effort: 5 }).toFile(f));
    }
    // portrait crop: full height, 9:16 window centred on the focal point
    const cropW = Math.min(W, Math.round((H * 9) / 16));
    const left = Math.max(0, Math.min(W - cropW, Math.round(bg.focal * W - cropW / 2)));
    // Always emit both portrait sizes so the frontend can rely on fixed names; small originals
    // (about/gallery ≈ 600 px wide crops) are upscaled here instead of by the browser.
    for (const w of PORTRAIT_WIDTHS) {
      await emit(out(`bg/${bg.name}-p${w}.webp`), (f) =>
        sharp(input).extract({ left, top: 0, width: cropW, height: H }).resize({ width: w })
          .webp({ quality: 72, effort: 5 }).toFile(f));
    }
  }
}

async function uiImages() {
  for (const img of UI_IMAGES) {
    for (const w of img.widths) {
      await emit(out(`img/${img.name}-${w}.webp`), (f) => {
        const base = img.extract ? sharp(src(img.file)).extract(img.extract) : sharp(src(img.file));
        return base.resize({ width: w, withoutEnlargement: true }).webp({ quality: 82, alphaQuality: 90, effort: 5 }).toFile(f);
      });
    }
  }
}

async function vectors() {
  await emit(out('svg/clover-fill.svg'), (f) => writeFile(f, cloverSvg({ fill: '#ffffff' })));
  await emit(out('svg/clover-outline.svg'), (f) => writeFile(f, cloverSvg({ fill: 'none' })));
  await emit(out('svg/divider.svg'), (f) => writeFile(f, DIVIDER_SVG));
  await emit(path.join(root, 'public', 'favicon.svg'), (f) => writeFile(f, FAVICON_SVG));
  await emit(path.join(root, 'public', 'favicon-32.png'), (f) => sharp(Buffer.from(FAVICON_SVG)).resize(32, 32).png().toFile(f));
  await emit(path.join(root, 'public', 'apple-touch-icon.png'), (f) =>
    sharp(Buffer.from(FAVICON_SVG)).resize(160, 160).extend({ top: 10, bottom: 10, left: 10, right: 10, background: '#fe9fb9' })
      .flatten({ background: '#fe9fb9' }).png().toFile(f));
}

async function ogImage() {
  await emit(out('og-image.jpg'), async (f) => {
    const base = await sharp(src('backgrounds/home_bg.jpeg')).resize(1200, 630, { fit: 'cover', position: 'centre' }).toBuffer();
    const logo = await sharp(src('icons/kotoha_logo.png')).resize({ width: 560 }).toBuffer();
    await sharp(base).composite([{ input: logo, left: 40, top: 40 }]).jpeg({ quality: 82, mozjpeg: true }).toFile(f);
  });
}

await backgrounds();
await uiImages();
await vectors();
await ogImage();
console.log('images: done');
