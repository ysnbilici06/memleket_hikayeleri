/* Memleket Hikayeleri – veri katmanı.
   Bu sürümde her şey cihazda durur: kayıtlar IndexedDB'de, kişisel tercihler
   localStorage'da. Arayüz yalnızca Depo'nun işlevlerini çağırır; ortak sunucuya
   geçilirken değişecek tek dosya budur. */
(function () {
  'use strict';

  const TABLOLAR = ['hikayeler', 'yorumlar', 'sozluk'];
  const veri = { hikayeler: [], yorumlar: [], sozluk: [] };
  let vt = null;

  function oku(anahtar, varsayilan) {
    try {
      const d = localStorage.getItem('mh-' + anahtar);
      return d === null ? varsayilan : JSON.parse(d);
    } catch (e) { return varsayilan; }
  }
  function yaz(anahtar, deger) {
    try { localStorage.setItem('mh-' + anahtar, JSON.stringify(deger)); } catch (e) { /* depolama kapalı */ }
  }
  function kimlik() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function ac() {
    return new Promise(function (coz, red) {
      const istek = indexedDB.open('memleket-hikayeleri', 1);
      istek.onupgradeneeded = function () {
        TABLOLAR.forEach(function (t) { istek.result.createObjectStore(t, { keyPath: 'id' }); });
      };
      istek.onsuccess = function () { coz(istek.result); };
      istek.onerror = function () { red(istek.error); };
    });
  }
  // IndexedDB açılamadıysa (ör. gizli sekme) kayıtlar yalnızca bellekte kalır.
  function islem(tablo, kip, is) {
    if (!vt) return Promise.resolve();
    return new Promise(function (coz, red) {
      const t = vt.transaction(tablo, kip);
      const sonuc = is(t.objectStore(tablo));
      t.oncomplete = function () { coz(sonuc && sonuc.result); };
      t.onerror = t.onabort = function () { red(t.error); };
    });
  }
  function kaydet(tablo, kayit) {
    const i = veri[tablo].findIndex(function (k) { return k.id === kayit.id; });
    if (i < 0) veri[tablo].push(kayit); else veri[tablo][i] = kayit;
    return islem(tablo, 'readwrite', function (d) { return d.put(kayit); });
  }
  function kaldir(tablo, id) {
    veri[tablo] = veri[tablo].filter(function (k) { return k.id !== id; });
    return islem(tablo, 'readwrite', function (d) { return d.delete(id); });
  }
  function bul(tablo, id) {
    return veri[tablo].find(function (k) { return k.id === id; });
  }

  const profil = Object.assign(
    { id: 'ben-' + kimlik(), ad: '', memleket: null, memleketIlce: '', yasadigi: null, radar: false },
    oku('profil', {})
  );
  let begeniler = oku('begeni', []);
  let favoriler = oku('favori', []);
  let oylar = oku('oy', {});
  let gizliler = oku('gizli', []);

  function gorunur(liste) {
    return liste.filter(function (k) { return gizliler.indexOf(k.id) < 0; });
  }
  function yazarim() {
    return { id: profil.id, ad: profil.ad, memleket: profil.memleket, yasadigi: profil.yasadigi, radar: profil.radar };
  }

  const Depo = {
    kalici: true,
    profil: profil,

    // ornekUret: ilk açılışta eklenecek örnek kayıtları { hikayeler, yorumlar, sozluk } olarak döndürür.
    hazirla: function (ornekUret) {
      return ac().then(function (v) { vt = v; }, function () { Depo.kalici = false; })
        .then(function () {
          return Promise.all(TABLOLAR.map(function (t) {
            return islem(t, 'readonly', function (d) { return d.getAll(); })
              .then(function (liste) { veri[t] = liste || []; });
          }));
        })
        .then(function () {
          if (oku('ornek', null) || !ornekUret) return;
          const ornek = ornekUret();
          yaz('ornek', 'eklendi');
          return Promise.all(TABLOLAR.map(function (t) {
            return Promise.all(ornek[t].map(function (k) { return kaydet(t, k); }));
          }));
        });
    },

    hikayeler: function () { return gorunur(veri.hikayeler); },
    hikaye: function (id) { return gorunur(veri.hikayeler).find(function (h) { return h.id === id; }); },
    yorumlar: function (hikayeId) {
      return gorunur(veri.yorumlar)
        .filter(function (y) { return !hikayeId || y.hikaye === hikayeId; })
        .sort(function (a, b) { return a.tarih < b.tarih ? -1 : 1; });
    },
    sozluk: function () { return gorunur(veri.sozluk); },

    profilKaydet: function (degisiklik) {
      Object.assign(profil, degisiklik);
      yaz('profil', profil);
      // Eski paylaşımlardaki ad ve memleket bilgisi de güncel kalsın.
      const guncel = [];
      TABLOLAR.forEach(function (t) {
        veri[t].forEach(function (k) {
          if (k.yazar && k.yazar.id === profil.id) { k.yazar = yazarim(); guncel.push(kaydet(t, k)); }
        });
      });
      return Promise.all(guncel);
    },

    hikayeEkle: function (h) {
      const kayit = Object.assign({}, h, { id: kimlik(), yazar: yazarim(), tarih: new Date().toISOString(), begeni: 0 });
      return kaydet('hikayeler', kayit).then(function () { return kayit; });
    },
    hikayeSil: function (id) {
      const yorumlari = veri.yorumlar.filter(function (y) { return y.hikaye === id; });
      return Promise.all(yorumlari.map(function (y) { return kaldir('yorumlar', y.id); }))
        .then(function () { return kaldir('hikayeler', id); });
    },

    begendimMi: function (id) { return begeniler.indexOf(id) >= 0; },
    begen: function (id) {
      const h = bul('hikayeler', id);
      if (!h) return Promise.resolve(false);
      const vardi = Depo.begendimMi(id);
      begeniler = vardi ? begeniler.filter(function (b) { return b !== id; }) : begeniler.concat(id);
      yaz('begeni', begeniler);
      h.begeni = Math.max(0, (h.begeni || 0) + (vardi ? -1 : 1));
      return kaydet('hikayeler', h).then(function () { return !vardi; });
    },

    favorideMi: function (id) { return favoriler.indexOf(id) >= 0; },
    favoriler: function () { return favoriler.slice(); },
    favori: function (id) {
      const vardi = Depo.favorideMi(id);
      favoriler = vardi ? favoriler.filter(function (f) { return f !== id; }) : favoriler.concat(id);
      yaz('favori', favoriler);
      return !vardi;
    },

    yorumEkle: function (hikayeId, metin) {
      const kayit = { id: kimlik(), hikaye: hikayeId, yazar: yazarim(), metin: metin, tarih: new Date().toISOString() };
      return kaydet('yorumlar', kayit).then(function () { return kayit; });
    },
    yorumSil: function (id) { return kaldir('yorumlar', id); },

    sozlukEkle: function (k) {
      const kayit = Object.assign({}, k, { id: kimlik(), yazar: yazarim(), tarih: new Date().toISOString(), oy: 0 });
      return kaydet('sozluk', kayit).then(function () { return kayit; });
    },
    sozlukSil: function (id) { return kaldir('sozluk', id); },
    oyum: function (id) { return oylar[id] || 0; },
    // yon: 1 (doğru / katılıyorum) ya da -1. Aynı yöne ikinci kez basmak oyu geri alır.
    sozlukOy: function (id, yon) {
      const k = bul('sozluk', id);
      if (!k) return Promise.resolve();
      const onceki = oylar[id] || 0;
      const yeni = onceki === yon ? 0 : yon;
      if (yeni) oylar[id] = yeni; else delete oylar[id];
      yaz('oy', oylar);
      k.oy = (k.oy || 0) - onceki + yeni;
      return kaydet('sozluk', k);
    },

    // Şikâyet edilen içerik bu cihazda hemen gizlenir.
    sikayet: function (id) {
      if (gizliler.indexOf(id) < 0) gizliler.push(id);
      yaz('gizli', gizliler);
    },

    ornekVarMi: function () {
      return TABLOLAR.some(function (t) { return veri[t].some(function (k) { return k.ornek; }); });
    },
    ornekleriKaldir: function () {
      const isler = [];
      TABLOLAR.forEach(function (t) {
        veri[t].filter(function (k) { return k.ornek; }).forEach(function (k) { isler.push(kaldir(t, k.id)); });
      });
      yaz('ornek', 'kaldirildi');
      return Promise.all(isler);
    },

    ayar: oku,
    ayarYaz: yaz
  };

  window.Depo = Depo;
})();
