// The home-screen icon, drawn rather than pasted in as a blob.
// iOS will not take an SVG for apple-touch-icon, so this renders real PNGs.
//   node tools/make-icon.mjs          # writes assets/icon-180.png and icon-512.png
const PW = process.env.PLAYWRIGHT_PATH || '/opt/node22/lib/node_modules/playwright/index.js';
const pw = await import(PW);
const chromium = pw.chromium || pw.default?.chromium;
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// A federal circular: grey newsprint, a black headline bar, a red "1".
const SVG = (s) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="96" fill="#121215"/>
  <rect x="86" y="70" width="340" height="372" fill="#e6e3dc"/>
  <rect x="112" y="98" width="288" height="44" fill="#16161a"/>
  <circle cx="256" cy="262" r="86" fill="#b3261e"/>
  <path d="M232 214 L268 196 L268 330 L242 330 L242 230 L232 234 Z" fill="#e6e3dc"/>
  <rect x="112" y="374" width="288" height="12" fill="#16161a"/>
  <rect x="112" y="398" width="200" height="12" fill="#16161a"/>
</svg>`;

const browser = await chromium.launch();
await mkdir(join(ROOT, 'assets'), { recursive: true });
for (const size of [180, 512]) {
  const page = await browser.newPage({ viewport: { width: size, height: size } });
  await page.setContent(`<style>html,body{margin:0;padding:0;background:transparent}</style>${SVG(size)}`);
  const buf = await page.screenshot({ omitBackground: true });
  await writeFile(join(ROOT, 'assets', `icon-${size}.png`), buf);
  console.log(`assets/icon-${size}.png  ${(buf.length / 1024).toFixed(1)} KB`);
  await page.close();
}
await browser.close();
