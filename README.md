# Alles ist DUAL · KARDI.

Das originale Gesprächsspiel von Yasmin Kardi: alle 43 Karten, sechs Kategorien,
sieben Spielvarianten und lokale Spielstandspeicherung. Mobil optimierte Web-App
und natives iOS-Projekt mit lokal eingebetteten Inhalten (Capacitor / WKWebView).

## Web entwickeln und prüfen

Node.js 22 oder neuer und npm:

```sh
npm ci
npm run build
npm test
npx serve dist
```

Vercel baut mit `npm run build` und veröffentlicht ausschließlich `dist`.
Quellcode, iOS-Dateien und Tests werden nicht als Website ausgeliefert.
`www/support.js` ist die unveränderte, generierte Laufzeit aus dem gelieferten
Quellcode-Archiv. Kartentexte stehen in `www/dual-cards.js`, App und Spiellogik
in `www/index.html`, Kartenlayout in `www/DualKarte.dc.html`.
React 18.3.1 und die mitgelieferten Montserrat-Schriften werden lokal ausgeliefert;
für den Spielbetrieb werden keine CDN-Verbindungen benötigt.

## iPhone-Web-App

Die HTTPS-Website in Safari öffnen, „Teilen“ → „Zum Home-Bildschirm“ wählen.
Sie startet mit eigenem Icon ohne Browserleiste. Nach vollständigem erstem Laden
und Aktivierung des Service Workers kann sie offline neu geöffnet werden.
Der Spielstand bleibt lokal auf dem Gerät (kein Konto, keine Cloud-Synchronisation).
Browserdaten löschen entfernt auch den Spielstand. Browser und native App haben
getrennte Speicher; Spielstände werden nicht automatisch übertragen.

## Native iOS-App bauen

Das vollständige Xcode-Projekt liegt unter `ios/App/App.xcodeproj` und verwendet
Swift Package Manager. Auf einem Mac mit Xcode 26 oder neuer:

```sh
npm ci
npm run ios:sync
npm run ios:open
```

In Xcode das eigene Apple-Entwicklungsteam auswählen und bei Bedarf die
vorläufige Bundle-ID `de.kardi.allesistdual` ändern. Anschließend im Simulator
oder auf einem verbundenen iPhone starten. Mindestversion: iOS 15.
Die Inhalte werden aus `dist` in die App kopiert, nicht von einer externen URL geladen;
damit ist der native Spielbetrieb von Anfang an offline möglich.
Nach Webänderungen immer `npm run ios:sync` ausführen.

Für TestFlight/App Store sind ein Apple-Developer-Konto, Signierung, die
App-Store-Connect-Angaben und Apples Prüfung erforderlich. Es wird hier keine
signierte IPA bereitgestellt. Der native Xcode-Build und ein reales iPhone müssen
noch geprüft werden; die Web-Vorschau ersetzt diesen Test nicht.

## Icon und Gestaltung

Eigenes KARDI.-Icon: `assets/icon.svg`. Mit `npm run icons` werden die opaken PNGs
für Apple Touch (180), Web (192/512) und den iOS-Assetkatalog (1024) erzeugt.
Danach `npm run ios:sync`. Die Systemmaske rundet das iOS-Icon, nicht die Quelldatei.
Safe Areas, feste mobile Navigation, mindestens 44-Pixel-Bedienelemente,
vergrößerte Kartenschrift und reduzierte Animationen werden berücksichtigt.

## Prüfungen und Herkunft

`npm test` prüft Originalkarten, Spielzug, Joker, Solo-Modus, lokale
Wiederaufnahme, Galerie, Iconformate und das vollständige Offline-Paket.
Die Originalinhalte stammen aus den zwei bereitgestellten ZIP-Archiven.
Die generierte Laufzeit bleibt unverändert. React-Lizenzen werden beim Build
nach `dist/vendor` kopiert, die Montserrat-OFL liegt unter `www/fonts/OFL.txt`.
