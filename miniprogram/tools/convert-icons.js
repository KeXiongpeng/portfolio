// SVG -> PNG converter using sharp
// Generates 8 tabBar icons (4 inactive + 4 active) from Lucide SVG sources
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const svgDir = path.join(__dirname, 'svg');
const outDir = path.join(__dirname, '..', 'assets', 'tabbar');

const INACTIVE = '#9ca3af';
const ACTIVE   = '#3b82f6';

const icons = ['home', 'folder', 'blog', 'about'];

async function main() {
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  for (const name of icons) {
    const svgTemplate = fs.readFileSync(path.join(svgDir, `${name}.svg`), 'utf8');

    // Inactive (gray)
    const inactiveSvg = svgTemplate.replace('{COLOR}', INACTIVE);
    await sharp(Buffer.from(inactiveSvg))
      .resize(81, 81)
      .png()
      .toFile(path.join(outDir, `${name}.png`));
    console.log(`  -> ${name}.png`);

    // Active (blue)
    const activeSvg = svgTemplate.replace('{COLOR}', ACTIVE);
    await sharp(Buffer.from(activeSvg))
      .resize(81, 81)
      .png()
      .toFile(path.join(outDir, `${name}-active.png`));
    console.log(`  -> ${name}-active.png`);
  }
  console.log('Done! 8 icons generated.');
}

main().catch(err => { console.error(err); process.exit(1); });
