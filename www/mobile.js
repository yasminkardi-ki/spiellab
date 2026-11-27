(() => {
  const native = window.Capacitor?.isNativePlatform?.() === true;
  // Capacitor ships the complete game inside the app; service workers are only for HTTPS.
  if (!native && 'serviceWorker' in navigator && location.protocol === 'https:') {
    navigator.serviceWorker.register('./sw.js').catch(error => console.warn('Offline-Modus nicht verfügbar:', error));
  }
  const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  if (native || standalone || !/iPad|iPhone|iPod/.test(navigator.userAgent)) return;
  // Wait for the supplied component runtime to mount its footer.
  const addHint = () => {
    const footer = document.querySelector('footer');
    if (!footer || document.querySelector('x-dc')) return false;
    if (document.querySelector('.install-help')) return true;
    const hint = document.createElement('details');
    hint.className = 'install-help';
    const title = document.createElement('summary');
    title.textContent = 'DUAL auf deinem iPhone installieren';
    const text = document.createElement('p');
    text.textContent = 'Öffne diese Seite in Safari. Tippe auf Teilen und dann auf „Zum Home-Bildschirm“. DUAL startet anschließend über das App-Icon. Nach dem ersten vollständigen Laden ist das Spiel auch offline verfügbar. Dein Spielstand bleibt auf diesem Gerät gespeichert.';
    hint.append(title, text); footer.before(hint); return true;
  };
  if (!addHint()) {
    const observer = new MutationObserver(() => { if (addHint()) observer.disconnect(); });
    observer.observe(document.body, { childList: true, subtree: true });
    setTimeout(() => observer.disconnect(), 30000);
  }
})();
