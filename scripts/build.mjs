import { cp, mkdir, readdir, readFile, writeFile, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
await rm('dist', { recursive: true, force: true });
await cp('www', 'dist', { recursive: true });
await mkdir('dist/vendor', { recursive: true });
for (const [pkg, file] of [['react','react.production.min.js'], ['react-dom','react-dom.production.min.js']]) {
  await cp(`node_modules/${pkg}/umd/${file}`, `dist/vendor/${file}`);
  await cp(`node_modules/${pkg}/LICENSE`, `dist/vendor/${pkg}-LICENSE.txt`);
}
async function files(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  return (await Promise.all(entries.map(e => e.isDirectory() ? files(`${dir}/${e.name}`) : `${dir}/${e.name}`))).flat();
}
const paths = (await files('dist')).sort();
const hash = createHash('sha256');
for (const path of paths) hash.update(await readFile(path));
const version = hash.digest('hex').slice(0,16);
const urls = paths.map(p => './' + p.slice(5));
urls.push('./');
await writeFile('dist/sw.js', `/* Generated from the complete local asset list. */
const CACHE = 'dual-${version}';
const ASSETS = ${JSON.stringify(urls)};
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('dual-') && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;
  const known = ASSETS.some(path => new URL(path, self.registration.scope).pathname === url.pathname);
  if (!known) return;
  event.respondWith(caches.open(CACHE).then(async cache => {
    const cached = await cache.match(url.pathname);
    return cached || fetch(event.request);
  }));
});
`);
console.log(`Built ${paths.length + 1} offline-ready assets (${version}).`);
