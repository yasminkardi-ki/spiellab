import sharp from 'sharp';
import { mkdir, copyFile, access } from 'node:fs/promises';
await mkdir('www/icons', { recursive: true });
for (const [name, size] of [['icon-192',192], ['icon-512',512], ['icon-maskable-512',512], ['apple-touch-icon',180], ['app-icon-1024',1024]]) {
  await sharp('assets/icon.svg').resize(size,size).flatten({ background: '#18202E' }).png().toFile(`www/icons/${name}.png`);
}
const nativeIcon = 'ios/App/App/Assets.xcassets/AppIcon.appiconset';
try { await access(nativeIcon); await copyFile('www/icons/app-icon-1024.png', `${nativeIcon}/AppIcon-512@2x.png`); } catch (error) { if (error.code !== 'ENOENT') throw error; }
