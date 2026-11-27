import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile, access } from 'node:fs/promises';
import sharp from 'sharp';
const html = await readFile('www/index.html','utf8');
const data = await readFile('www/dual-cards.js','utf8');
const logic = html.match(/<script type="text\/x-dc"[^>]*>([\s\S]*?)<\/script>/)[1];
function app(saved) {
  const storage = new Map(saved ? [['kardi-dual-v1', JSON.stringify(saved)]] : []);
  class DCLogic {
    props = { storyGross: true };
    setState(update, callback) {
      this.state = { ...this.state, ...(typeof update === 'function' ? update(this.state) : update) };
      this.componentDidUpdate?.(); callback?.();
    }
  }
  const context = vm.createContext({ window: {}, DCLogic, localStorage: { getItem: key => storage.get(key), setItem: (k,v) => storage.set(k,v) }, setTimeout, clearTimeout });
  vm.runInContext(data + '\n' + logic + '\nglobalThis.app = new Component();', context);
  return { game: context.app, context, storage };
}
test('all 43 original cards and six categories remain intact', () => {
  const { context } = app();
  assert.equal(context.window.DUAL_DATA.cards.length, 43);
  assert.equal(context.window.DUAL_DATA.cats.length, 6);
  assert.equal(new Set(context.window.DUAL_DATA.cards.map(c => c.nr)).size,43);
});
test('start, draw, turn, choose a question, advance, and resume locally', () => {
  const { game, storage } = app();
  game.startGame(); assert.equal(game.state.screen,'table'); assert.equal(game.state.game.deck.length,43);
  game.setGame(() => ({ deck: ['01','02','43'] }));
  game.pileClick(); assert.equal(game.state.game.current,'01'); assert.equal(game.state.game.step,'read');
  game.flipToAsk(); assert.equal(game.state.game.step,'ask');
  game.renderVals().fragearten[2].onPick(); assert.equal(game.state.game.qtype,3); assert.equal(game.state.game.step,'answer');
  assert.ok(game.renderVals().qText.length);
  game.nextTurn(); assert.equal(game.state.game.active,1); assert.equal(game.state.game.played.length,1);
  const saved = JSON.parse(storage.get('kardi-dual-v1'));
  assert.equal(app(saved).game.state.game.active,1);
});
test('solo daily variant uses one player and directly opens the turn question', () => {
  const { game } = app(); game.setState({ variant: 'tag' }); game.startGame();
  assert.equal(game.state.players.length,1);
  game.setGame(() => ({ deck: ['02','03'] })); game.pileClick(); game.flipToAsk();
  assert.equal(game.state.game.qtype,3); assert.equal(game.state.game.step,'answer');
});
test('joker can be kept and played to defer a question', () => {
  const { game } = app(); game.startGame(); game.setGame(() => ({ deck: ['43','01','02'] }));
  game.pileClick(); assert.equal(game.state.players[0].joker,true);
  game.keepJoker(); game.pileClick(); game.flipToAsk();
  game.renderVals().fragearten[0].onPick(); game.useJoker();
  assert.equal(game.state.players[0].joker,false); assert.equal(game.state.game.deferred.length,1);
});
test('gallery filters and card overlays still work', () => {
  const { game } = app(); game.setState({ screen: 'cards', galleryCat: 1 });
  assert.equal(game.renderVals().gallery.length,7);
  game.renderVals().gallery[0].onOpen(); assert.equal(game.renderVals().hasOverlay,true);
  game.renderVals().flipOverlay(); assert.equal(game.state.overlayFlip,true);
  game.renderVals().closeOverlay(); assert.equal(game.state.overlay,null);
});
test('iOS and web icons are opaque and correctly sized', async () => {
  for (const [file,size] of [['www/icons/apple-touch-icon.png',180],['www/icons/icon-192.png',192],['www/icons/icon-512.png',512],['ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png',1024]]) {
    const meta = await sharp(file).metadata(); assert.equal(meta.width,size); assert.equal(meta.height,size); assert.equal(meta.hasAlpha,false);
  }
});
test('built app has only local scripts, complete icons, and correct native config', async () => {
  const manifest = JSON.parse(await readFile('dist/manifest.webmanifest','utf8'));
  for (const icon of manifest.icons) await access('dist/' + icon.src);
  for (const match of html.matchAll(/<script[^>]+src="([^"]+)"/g)) { assert.ok(match[1].startsWith('./')); await access('dist/' + match[1]); }
  const native = JSON.parse(await readFile('capacitor.config.json','utf8'));
  assert.equal(native.webDir,'dist'); assert.equal(native.server,undefined);
  assert.ok(html.includes('viewport-fit=cover')); assert.ok(html.includes('apple-touch-icon'));
});
test('service worker installs every asset and serves a cached offline document', async () => {
  const events = {}; const cached = new Map();
  const cache = { addAll: async paths => { for (const path of paths) { const file = path === './' ? 'index.html' : path.slice(2); cached.set('/' + (path === './' ? '' : file),await readFile('dist/' + file)); } }, match: async path => cached.get(path) };
  const context = vm.createContext({ URL, self: { location: { origin:'https://example.test' }, registration:{scope:'https://example.test/'}, clients:{ claim: async()=>{} }, addEventListener: (name,fn) => events[name]=fn }, caches:{ open: async()=>cache, keys:async()=>[], delete:async()=>{} }, fetch:()=> { throw Error('offline'); } });
  vm.runInContext(await readFile('dist/sw.js','utf8'),context);
  let install; events.install({ waitUntil:p=>install=p }); await install;
  let response; events.fetch({ request:{ method:'GET',url:'https://example.test/' },respondWith:p=>response=p });
  assert.match((await response).toString(), /Alles ist DUAL/);
  assert.ok(cached.has('/vendor/react.production.min.js')); assert.ok(cached.has('/DualKarte.dc.html'));
});
