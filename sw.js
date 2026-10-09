/* Memleket Hikayeleri – çevrimdışı çalışma.
   Uygulama dosyaları önbellekten hemen verilir, arka planda yenisi indirilir;
   değişiklikler bir sonraki açılışta görünür. Dosya listesi değişirse KABUK adındaki sayı artırılır. */
var KABUK = 'mh-kabuk-4';
var DOSYALAR = [
  './', 'index.html', 'manifest.webmanifest', 'css/stil.css',
  'js/depo.js', 'js/denetim.js', 'js/simgeler.js', 'js/uygulama.js', 'data/iller.js', 'data/ornekler.js',
  'assets/yazi/nunito-400-800-latin-ext.woff2', 'assets/yazi/nunito-400-800-latin.woff2', 'assets/yazi/poppins-600-latin-ext.woff2', 'assets/yazi/poppins-600-latin.woff2', 'assets/yazi/poppins-700-latin-ext.woff2', 'assets/yazi/poppins-700-latin.woff2', 
  'assets/simge/simge-192.png', 'assets/simge/simge-512.png'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(KABUK)
      .then(function (kasa) { return kasa.addAll(DOSYALAR); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (adlar) {
      return Promise.all(adlar.map(function (ad) {
        if (ad.indexOf('mh-kabuk-') === 0 && ad !== KABUK) return caches.delete(ad);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var istek = e.request;
  if (istek.method !== 'GET' || new URL(istek.url).origin !== self.location.origin) return;
  var anahtar = istek.mode === 'navigate' ? 'index.html' : istek;
  e.respondWith(
    caches.open(KABUK).then(function (kasa) {
      return kasa.match(anahtar).then(function (kayitli) {
        var ag = fetch(istek).then(function (yanit) {
          if (yanit.ok) kasa.put(anahtar, yanit.clone());
          return yanit;
        });
        if (!kayitli) return ag;
        ag.catch(function () { /* çevrimdışı */ });
        return kayitli;
      });
    })
  );
});
