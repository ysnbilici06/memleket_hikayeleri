/* Memleket Hikayeleri – arayüz.
   Sayfalar adres çubuğundaki #/… kısmına göre çizilir; veriye yalnızca Depo üzerinden erişilir. */
(function () {
  'use strict';

  const ILLER = window.ILLER;
  const HARITA = window.HARITA;
  const Depo = window.Depo;
  const Denetim = window.Denetim;
  const IL = {};
  ILLER.forEach(function (i) { IL[i.p] = i; });
  const ILLER_ADA_GORE = ILLER.slice().sort(function (a, b) { return a.ad.localeCompare(b.ad, 'tr'); });
  const icerik = document.getElementById('icerik');

  const DONEMLER = [
    { k: 'eski', ad: '1980 öncesi' }, { k: '1980', ad: '1980’ler' }, { k: '1990', ad: '1990’lar' },
    { k: '2000', ad: '2000’ler' }, { k: '2010', ad: '2010’lar' }, { k: 'bugun', ad: 'Bugün' }
  ];
  const ETIKETLER = [
    { ad: 'ÇocukluğumunSokakları', simge: '🏘️' }, { ad: 'YöreselLezzetler', simge: '🍲' },
    { ad: 'UnutulmayanGelenekler', simge: '🎎' }, { ad: 'BayramSabahları', simge: '🍬' },
    { ad: 'DüğünDernek', simge: '🥁' }, { ad: 'EskiFotoğraflar', simge: '📷' },
    { ad: 'GurbetHasreti', simge: '🚂' }, { ad: 'ÇarşıPazar', simge: '🧺' },
    { ad: 'YaylaYolu', simge: '⛰️' }, { ad: 'SokakOyunları', simge: '🪁' },
    { ad: 'TürküMasal', simge: '🎶' }, { ad: 'UstalarZanaatlar', simge: '🔨' }
  ];
  // Haftalık Memleket Meydanı temaları; her hafta sıradaki gelir. data/ornekler.js'teki "tema" bu sırayı gösterir.
  const TEMALAR = [
    { ad: 'Düğün Yemekleri', aciklama: 'Sizin oranın düğün sofrasında ne olur, sırası nasıldır?', etiket: 'DüğünDernek' },
    { ad: 'Çocukluğumun Sokakları', aciklama: 'Büyüdüğün sokağı, kapı önlerini, komşuları anlat.', etiket: 'ÇocukluğumunSokakları' },
    { ad: 'Bayram Sabahları', aciklama: 'Bayram namazından sonra ilk nereye gidilirdi, sofrada ne olurdu?', etiket: 'BayramSabahları' },
    { ad: 'Kış Hazırlıkları', aciklama: 'Tarhana, salça, kavurma, odun… Kışa nasıl hazırlanılırdı?', etiket: 'UnutulmayanGelenekler' },
    { ad: 'Çarşı Pazar', aciklama: 'Çarşının sesi, kokusu, esnafı ve pazarlığı.', etiket: 'ÇarşıPazar' },
    { ad: 'Yayla ve Şenlik', aciklama: 'Yayla göçü, şenlikler, panayırlar.', etiket: 'YaylaYolu' },
    { ad: 'Sokak Oyunları', aciklama: 'Misket, çelik çomak, kızak… Hangi oyunla büyüdün?', etiket: 'SokakOyunları' },
    { ad: 'Unutulmayan Sesler', aciklama: 'Bir türkü, bir ağıt, bir ninni; kulağında kalan ses.', etiket: 'TürküMasal' },
    { ad: 'Sabah Sofraları', aciklama: 'Memleket kahvaltısında olmazsa olmaz ne vardır?', etiket: 'YöreselLezzetler' },
    { ad: 'Eski Evler', aciklama: 'Avlular, damlar, konaklar; evin en sevdiğin köşesi.', etiket: 'EskiFotoğraflar' }
  ];
  // Kültür puanı 50'yi geçince memleketin unvanı rozet olarak verilir.
  const UNVANLAR = { 23: 'Gakgoş', 25: 'Dadaş', 9: 'Efe', 35: 'Efe', 20: 'Efe', 48: 'Efe', 45: 'Efe', 61: 'Uşak', 53: 'Uşak',
    28: 'Uşak', 52: 'Uşak', 8: 'Uşak', 6: 'Seğmen', 18: 'Yâran', 58: 'Yiğido', 22: 'Pehlivan' };
  const UNVAN_ESIGI = 50;

  const harita = { donem: '', sira: 'begeni' };
  const suzgec = { ara: '', etiket: '', il: '', donem: '', sira: 'yeni' };
  const sozlukDurum = { tur: 'kelime', il: '', ara: '' };
  let yeniFoto = null;
  let yeniSes = null;
  let kaydedici = null;
  let yuklemeIstegi = null;

  /* ---------- yardımcılar ---------- */

  function k(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function sade(s) { return String(s || '').toLocaleLowerCase('tr'); }
  function tarihYaz(iso) {
    return new Date(iso).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' });
  }
  function donemAdi(kod) {
    const d = DONEMLER.find(function (x) { return x.k === kod; });
    return d ? d.ad : '';
  }
  function yer(kayit) {
    const il = IL[kayit.il] ? IL[kayit.il].ad : '';
    return kayit.ilce ? kayit.ilce + ', ' + il : il;
  }
  function etiketSimgesi(ad) {
    const e = ETIKETLER.find(function (x) { return x.ad === ad; });
    return e ? e.simge : '🏡';
  }
  function sirala(liste, sira) {
    return liste.slice().sort(function (a, b) {
      if (sira === 'begeni' && (b.begeni || 0) !== (a.begeni || 0)) return (b.begeni || 0) - (a.begeni || 0);
      return a.tarih < b.tarih ? 1 : -1;
    });
  }
  function benimMi(kayit) { return kayit.yazar && kayit.yazar.id === Depo.profil.id; }

  // ISO hafta numarası: haftalar pazartesi başlar.
  function haftaBilgisi(tarih) {
    const g = new Date(Date.UTC(tarih.getFullYear(), tarih.getMonth(), tarih.getDate()));
    const gun = g.getUTCDay() || 7;
    g.setUTCDate(g.getUTCDate() + 4 - gun);
    const yil = g.getUTCFullYear();
    const no = Math.ceil(((g - Date.UTC(yil, 0, 1)) / 864e5 + 1) / 7);
    const temaNo = (yil * 53 + no) % TEMALAR.length;
    return { no: no, kimlik: yil + '-H' + no, kalan: 7 - gun, temaNo: temaNo, tema: TEMALAR[temaNo] };
  }
  function haftaSiralamasi(haftaKimligi) {
    const gruplar = {};
    Depo.hikayeler().forEach(function (h) {
      if (h.tema !== haftaKimligi) return;
      const anahtar = h.il + '|' + (h.ilce || '');
      const g = gruplar[anahtar] || (gruplar[anahtar] = { il: h.il, ilce: h.ilce || '', puan: 0, adet: 0 });
      g.puan += 1 + (h.begeni || 0);
      g.adet += 1;
    });
    return Object.keys(gruplar).map(function (a) { return gruplar[a]; })
      .sort(function (a, b) { return b.puan - a.puan; });
  }

  function ornekUret() {
    const o = window.ORNEKLER;
    const simdi = Date.now();
    const hafta = haftaBilgisi(new Date());
    function yazar(kod) { return Object.assign({ id: 'ornek-' + kod, radar: true }, o.yazarlar[kod]); }
    function tarih(gun) { return new Date(simdi - gun * 864e5 - 36e5).toISOString(); }
    return {
      hikayeler: o.hikayeler.map(function (h) {
        return { id: h.id, baslik: h.baslik, metin: h.metin, il: h.il, ilce: h.ilce, donem: h.donem, etiketler: h.etiketler,
          foto: null, yazar: yazar(h.yazar), tarih: tarih(h.gun), begeni: h.begeni,
          tema: h.tema === hafta.temaNo ? hafta.kimlik : null, ornek: true };
      }),
      yorumlar: o.yorumlar.map(function (y) {
        return { id: y.id, hikaye: y.hikaye, yazar: yazar(y.yazar), metin: y.metin, tarih: tarih(y.gun), ornek: true };
      }),
      sozluk: o.sozluk.map(function (s) {
        return { id: s.id, tur: s.tur, il: s.il, ilce: s.ilce, baslik: s.baslik, aciklama: s.aciklama, ornekCumle: s.ornek,
          ses: null, yazar: yazar(s.yazar), tarih: tarih(s.gun), oy: s.oy, ornek: true };
      })
    };
  }

  function bildir(metin) {
    const kutu = document.getElementById('bildirim');
    kutu.textContent = metin;
    kutu.hidden = false;
    clearTimeout(bildir.sure);
    bildir.sure = setTimeout(function () { kutu.hidden = true; }, 3600);
  }

  /* ---------- puan ve rozetler ---------- */

  function katkilar(yazarId) {
    function onun(kayit) { return kayit.yazar && kayit.yazar.id === yazarId; }
    return { hikayeler: Depo.hikayeler().filter(onun), sozluk: Depo.sozluk().filter(onun), yorumlar: Depo.yorumlar().filter(onun) };
  }
  function kulturPuani(kt) {
    let puan = kt.hikayeler.length * 10 + kt.sozluk.length * 5 + kt.yorumlar.length;
    kt.hikayeler.forEach(function (h) { puan += (h.begeni || 0) * 2 + (h.tema ? 5 : 0); });
    kt.sozluk.forEach(function (s) { puan += Math.max(0, s.oy || 0); });
    return puan;
  }
  function rozetler(kt, puan) {
    const hs = kt.hikayeler;
    const ilceSayisi = {};
    hs.forEach(function (h) { const a = h.il + '|' + h.ilce; ilceSayisi[a] = (ilceSayisi[a] || 0) + 1; });
    const etiketler = {};
    hs.forEach(function (h) { (h.etiketler || []).forEach(function (e) { etiketler[e] = (etiketler[e] || 0) + 1; }); });
    const unvan = UNVANLAR[Depo.profil.memleket] || 'Hemşehri';
    return [
      { simge: '🌱', ad: 'İlk Adım', aciklama: 'İlk hikayeni paylaş', var: hs.length >= 1 },
      { simge: '📔', ad: 'Anı Defteri', aciklama: '5 hikaye paylaş', var: hs.length >= 5 },
      { simge: '🕊️', ad: 'Kültür Elçisi', aciklama: '3 farklı etikette hikaye paylaş', var: Object.keys(etiketler).length >= 3 },
      { simge: '🏛️', ad: 'Yöre Muhtarı', aciklama: 'Aynı ilçeden 3 hikaye paylaş', var: Object.keys(ilceSayisi).some(function (a) { return ilceSayisi[a] >= 3; }) },
      { simge: '🗣️', ad: 'Söz Ustası', aciklama: 'Sözlüğe 3 katkı yap', var: kt.sozluk.length >= 3 },
      { simge: '🍲', ad: 'Lezzet Avcısı', aciklama: '#YöreselLezzetler ile 2 hikaye paylaş', var: (etiketler['YöreselLezzetler'] || 0) >= 2 },
      { simge: '⏳', ad: 'Zaman Yolcusu', aciklama: '2000 öncesinden bir anı paylaş', var: hs.some(function (h) { return ['eski', '1980', '1990'].indexOf(h.donem) >= 0; }) },
      { simge: '🏆', ad: 'Meydan Yiğidi', aciklama: 'Haftalık Meydan’a katıl', var: hs.some(function (h) { return h.tema; }) },
      { simge: '🎖️', ad: unvan, aciklama: UNVAN_ESIGI + ' kültür puanına ulaş – memleketinin unvanı', var: puan >= UNVAN_ESIGI }
    ];
  }
  function kazanilanlar() {
    const kt = katkilar(Depo.profil.id);
    return rozetler(kt, kulturPuani(kt)).filter(function (r) { return r.var; }).map(function (r) { return r.ad; });
  }
  // Bir katkıdan sonra yeni kazanılan rozetleri duyurur.
  function katkiBildir(mesaj, oncekiRozetler) {
    const yeni = kazanilanlar().filter(function (r) { return oncekiRozetler.indexOf(r) < 0; });
    bildir(yeni.length ? mesaj + ' Yeni rozet: ' + yeni.join(', ') + ' 🎉' : mesaj);
  }

  /* ---------- ortak parçalar ---------- */

  function kapak(h, sinif) {
    if (h.foto) return '<img class="' + sinif + '" src="' + k(h.foto) + '" alt="" loading="lazy">';
    const ton = (h.il * 47) % 360;
    return '<span class="' + sinif + ' bos-kapak" style="--ton:' + ton + '"><span>' + etiketSimgesi((h.etiketler || [])[0]) + '</span></span>';
  }
  function ornekIsareti(kayit) {
    return kayit.ornek ? ' <span class="ornek-isareti" title="Uygulamayı tanıtmak için eklenmiş kurgu içerik">Örnek</span>' : '';
  }
  function hikayeKarti(h) {
    const yorum = Depo.yorumlar(h.id).length;
    const ozet = h.metin.length > 150 ? h.metin.slice(0, 150).replace(/\s+\S*$/, '') + '…' : h.metin;
    return '<a class="kart" href="#/hikaye/' + encodeURIComponent(h.id) + '">' + kapak(h, 'kart-kapak') +
      '<span class="kart-ic"><span class="kunye">📍 ' + k(yer(h)) + ' · ' + k(donemAdi(h.donem)) + '</span>' +
      '<strong>' + k(h.baslik) + '</strong><span class="ozet">' + k(ozet) + '</span>' +
      '<span class="kart-alt"><span>♥ ' + (h.begeni || 0) + '</span><span>💬 ' + yorum + '</span><span class="saga">' + k(h.yazar.ad) + ornekIsareti(h) + '</span></span></span></a>';
  }
  function kartlar(liste, bosMesaj) {
    if (!liste.length) return '<p class="bos">' + bosMesaj + '</p>';
    return '<div class="kartlar">' + liste.map(hikayeKarti).join('') + '</div>';
  }
  function ilSecenekleri(secili, bosAd) {
    return '<option value="">' + k(bosAd) + '</option>' + ILLER_ADA_GORE.map(function (i) {
      return '<option value="' + i.p + '"' + (String(secili) === String(i.p) ? ' selected' : '') + '>' + k(i.ad) + '</option>';
    }).join('');
  }
  function ilceSecenekleri(p, secili, bosAd) {
    const il = IL[p];
    return '<option value="">' + k(bosAd) + '</option>' + (il ? il.ilceler : []).map(function (ad) {
      return '<option' + (ad === secili ? ' selected' : '') + '>' + k(ad) + '</option>';
    }).join('');
  }
  function donemSecenekleri(secili, bosAd) {
    return (bosAd ? '<option value="">' + k(bosAd) + '</option>' : '') + DONEMLER.map(function (d) {
      return '<option value="' + d.k + '"' + (d.k === secili ? ' selected' : '') + '>' + k(d.ad) + '</option>';
    }).join('');
  }
  function siraDugmeleri(secili) {
    return '<span class="ikili" role="group" aria-label="Sıralama">' +
      [['begeni', 'En beğenilen'], ['yeni', 'En yeni']].map(function (s) {
        return '<button type="button" data-is="sira" data-deger="' + s[0] + '"' + (secili === s[0] ? ' class="secili" aria-pressed="true"' : ' aria-pressed="false"') + '>' + s[1] + '</button>';
      }).join('') + '</span>';
  }
  function adAlani() {
    return Depo.profil.ad ? '' : '<label>Adın (paylaşımlarında görünür)<input name="ad" required maxlength="40" autocomplete="nickname" placeholder="Örn. Ayşe K."></label>';
  }

  /* ---------- Harita ---------- */

  function sayfaHarita(p, ilce) {
    const il = IL[p] || null;
    const hafta = haftaBilgisi(new Date());
    const hepsi = Depo.hikayeler().filter(function (h) { return !harita.donem || h.donem === harita.donem; });
    const skor = {};
    const adet = {};
    hepsi.forEach(function (h) {
      skor[h.il] = (skor[h.il] || 0) + 1 + (h.begeni || 0);
      adet[h.il] = (adet[h.il] || 0) + 1;
    });
    const enCok = Math.max.apply(null, ILLER.map(function (i) { return skor[i.p] || 0; }).concat(1));
    const lider = haftaSiralamasi(hafta.kimlik)[0];

    // Seçili il en son çizilir ki çerçevesi komşularının altında kalmasın.
    const sirali = ILLER.slice().sort(function (a, b) { return (il && a.p === il.p ? 1 : 0) - (il && b.p === il.p ? 1 : 0); });
    const yollar = sirali.map(function (i) {
      const o = (skor[i.p] || 0) / enCok;
      const isi = !skor[i.p] ? 0 : o > 0.66 ? 4 : o > 0.33 ? 3 : o > 0.12 ? 2 : 1;
      return '<path d="' + i.d + '" class="il isi' + isi + (il && il.p === i.p ? ' secili' : '') + '" data-is="il" data-p="' + i.p +
        '" tabindex="0" role="button" aria-label="' + k(i.ad) + '"><title>' + k(i.ad) + (adet[i.p] ? ' · ' + adet[i.p] + ' hikaye' : '') + '</title></path>';
    }).join('');
    const tac = lider ? '<text class="tac" x="' + IL[lider.il].m[0] + '" y="' + (IL[lider.il].m[1] - 6) + '">👑</text>' : '';
    const ilAdi = il ? '<text class="il-adi" x="' + il.m[0] + '" y="' + (il.m[1] + 4) + '">' + k(il.ad) + '</text>' : '';

    let liste = sirala(il ? hepsi.filter(function (h) { return h.il === il.p && (!ilce || h.ilce === ilce); }) : hepsi, harita.sira);
    let balonHikayeleri;
    if (il) {
      balonHikayeleri = liste.slice(0, 5);
    } else {
      // İl seçili değilken en hareketli illerin birer hikayesi balon olur.
      const gorulen = {};
      balonHikayeleri = sirala(hepsi, harita.sira).filter(function (h) {
        if (gorulen[h.il]) return false;
        gorulen[h.il] = true;
        return true;
      }).sort(function (a, b) { return skor[b.il] - skor[a.il]; }).slice(0, 7);
    }
    const balonlar = balonHikayeleri.map(function (h, i) {
      const m = IL[h.il].m;
      let dx = 0, dy = -1.9;
      if (il && balonHikayeleri.length > 1) {
        const aci = (-165 + i * (150 / (balonHikayeleri.length - 1))) * Math.PI / 180;
        dx = Math.cos(aci) * 4.2;
        dy = Math.sin(aci) * 3.4;
      }
      return '<a class="balon" href="#/hikaye/' + encodeURIComponent(h.id) + '" style="left:' + (m[0] / HARITA.genislik * 100).toFixed(2) + '%;top:' +
        (m[1] / HARITA.yukseklik * 100).toFixed(2) + '%;--dx:' + dx.toFixed(2) + 'em;--dy:' + dy.toFixed(2) + 'em;animation-delay:' + (i * 70) + 'ms" title="' +
        k(h.baslik + ' – ' + yer(h)) + '" aria-label="' + k(h.baslik + ' – ' + yer(h)) + '">' + kapak(h, 'balon-ic') + '</a>';
    }).join('');

    const donemler = '<div class="cipler" role="group" aria-label="Zaman tüneli"><span class="cip-baslik">⏳ Zaman tüneli</span>' +
      [{ k: '', ad: 'Tümü' }].concat(DONEMLER).map(function (d) {
        return '<button type="button" class="cip' + (harita.donem === d.k ? ' secili' : '') + '" data-is="donem" data-deger="' + d.k + '" aria-pressed="' + (harita.donem === d.k) + '">' + k(d.ad) + '</button>';
      }).join('') + '</div>';

    let panel;
    if (il) {
      const ilHikayeleri = hepsi.filter(function (h) { return h.il === il.p; });
      const ilceAdet = {};
      ilHikayeleri.forEach(function (h) { ilceAdet[h.ilce] = (ilceAdet[h.ilce] || 0) + 1; });
      const sozler = Depo.sozluk().filter(function (s) { return s.il === il.p; }).sort(function (a, b) { return (b.oy || 0) - (a.oy || 0); });
      const ilceSecimi = '<option value="">Tüm ilçeler</option>' + il.ilceler.map(function (ad) {
        return '<option value="' + k(ad) + '"' + (ad === ilce ? ' selected' : '') + '>' + k(ad) + (ilceAdet[ad] ? ' (' + ilceAdet[ad] + ')' : '') + '</option>';
      }).join('');
      panel = '<section class="panel"><header class="panel-bas"><div><h1>' + k(il.ad) + (lider && lider.il === il.p ? ' <span title="Bu hafta Meydan’da önde">👑</span>' : '') + '</h1>' +
        '<p class="kunye">' + k(il.b) + ' Bölgesi · ' + ilHikayeleri.length + ' hikaye · ' + sozler.length + ' sözlük kaydı</p></div>' +
        '<a class="dugme" href="#/paylas?il=' + il.p + (ilce ? '&ilce=' + encodeURIComponent(ilce) : '') + '">✍️ Buradan hikaye paylaş</a></header>' +
        '<div class="arac"><label class="gizli" for="ilce-sec">İlçe</label><select id="ilce-sec" data-degis="ilce-sec" data-p="' + il.p + '">' + ilceSecimi + '</select>' +
        siraDugmeleri(harita.sira) + '<a class="baglanti" href="#/">← Tüm Türkiye</a></div>' +
        kartlar(liste, (ilce ? k(ilce) : k(il.ad)) + ' için henüz hikaye yok. İlk anlatan sen ol!') +
        (sozler.length ? '<h2>' + k(il.ad) + ' sözlüğünden</h2><ul class="soz-ozet">' + sozler.slice(0, 4).map(function (s) {
          return '<li><b>' + k(s.baslik) + '</b> — ' + k(s.aciklama) + '</li>';
        }).join('') + '</ul><p><a class="baglanti" href="#/sozluk?il=' + il.p + '">Sözlüğün tamamı →</a></p>' : '') + '</section>';
    } else {
      panel = '<section class="panel"><header class="panel-bas"><div><h1>Türkiye’den hikayeler</h1>' +
        '<p class="kunye">Haritadan bir ile dokun ya da listeden seç; parlayan iller en çok hikaye anlatılan yerler.</p></div></header>' +
        '<div class="arac">' + siraDugmeleri(harita.sira) + '</div>' +
        kartlar(liste.slice(0, 9), 'Bu dönem için henüz hikaye yok. İlk anlatan sen ol!') +
        (liste.length > 9 ? '<p><a class="baglanti" href="#/kesfet">Tüm hikayeleri keşfet →</a></p>' : '') + '</section>';
    }

    return '<a class="meydan-serit" href="#/meydan">🏆 <span>Bu haftanın Meydan teması: <b>' + k(hafta.tema.ad) + '</b>' +
      (lider ? ' · önde: ' + k(yer(lider)) : '') + '</span><span class="saga">' + (hafta.kalan ? hafta.kalan + ' gün kaldı' : 'Son gün!') + ' →</span></a>' +
      donemler +
      '<div class="harita-kaydir"><div class="harita-kutu"><svg class="harita" viewBox="0 0 ' + HARITA.genislik + ' ' + HARITA.yukseklik +
      '" role="group" aria-label="Türkiye il haritası">' + yollar + ilAdi + tac + '</svg><div class="balonlar">' + balonlar + '</div></div></div>' +
      '<div class="arac harita-alt"><label class="gizli" for="il-sec">İl seç</label><select id="il-sec" data-degis="il-sec">' + ilSecenekleri(il ? il.p : '', 'İl seç…') + '</select>' +
      '<span class="gosterge" aria-hidden="true">az <i class="isi1"></i><i class="isi2"></i><i class="isi3"></i><i class="isi4"></i> çok hikaye</span></div>' + panel;
  }

  /* ---------- Keşfet ---------- */

  function suzulenler() {
    const ara = sade(suzgec.ara.trim());
    return sirala(Depo.hikayeler().filter(function (h) {
      if (suzgec.etiket && (h.etiketler || []).indexOf(suzgec.etiket) < 0) return false;
      if (suzgec.il && String(h.il) !== String(suzgec.il)) return false;
      if (suzgec.donem && h.donem !== suzgec.donem) return false;
      if (!ara) return true;
      return sade([h.baslik, h.metin, yer(h), h.yazar.ad, (h.etiketler || []).join(' ')].join(' ')).indexOf(ara) >= 0;
    }), suzgec.sira);
  }
  function kesfetSonuclari() {
    const liste = suzulenler();
    return '<p class="kunye">' + liste.length + ' hikaye</p>' + kartlar(liste, 'Aradığın ölçütlere uyan hikaye bulunamadı.');
  }
  function sayfaKesfet() {
    return '<h1>Keşfet</h1>' +
      '<div class="arac"><label class="gizli" for="kesfet-ara">Hikayelerde ara</label>' +
      '<input id="kesfet-ara" class="genis" type="search" placeholder="Hikaye, yer, kişi ara…" autocomplete="off" value="' + k(suzgec.ara) + '">' +
      '<select data-degis="kesfet-il" aria-label="İl">' + ilSecenekleri(suzgec.il, 'Tüm iller') + '</select>' +
      '<select data-degis="kesfet-donem" aria-label="Dönem">' + donemSecenekleri(suzgec.donem, 'Tüm dönemler') + '</select>' +
      '<select data-degis="kesfet-sira" aria-label="Sıralama"><option value="yeni"' + (suzgec.sira === 'yeni' ? ' selected' : '') + '>En yeni</option><option value="begeni"' + (suzgec.sira === 'begeni' ? ' selected' : '') + '>En beğenilen</option></select></div>' +
      '<div class="cipler" role="group" aria-label="Etiketler">' + ETIKETLER.map(function (e) {
        return '<button type="button" class="cip' + (suzgec.etiket === e.ad ? ' secili' : '') + '" data-is="etiket" data-deger="' + k(e.ad) + '" aria-pressed="' + (suzgec.etiket === e.ad) + '">' + e.simge + ' #' + k(e.ad) + '</button>';
      }).join('') + '</div><div id="sonuclar">' + kesfetSonuclari() + '</div>';
  }

  /* ---------- Hikaye ---------- */

  function sayfaHikaye(id) {
    const h = Depo.hikaye(id);
    if (!h) return '<p class="bos">Bu hikaye bulunamadı ya da kaldırılmış. <a class="baglanti" href="#/">Haritaya dön</a></p>';
    const yorumlar = Depo.yorumlar(h.id);
    const y = h.yazar;
    const gurbet = (y.memleket ? 'Memleketi: ' + IL[y.memleket].ad : '') +
      (y.memleket && y.yasadigi && y.memleket !== y.yasadigi ? ' · Gurbeti: ' + IL[y.yasadigi].ad : '');
    const digerleri = sirala(Depo.hikayeler().filter(function (d) { return d.il === h.il && d.id !== h.id; }), 'begeni').slice(0, 3);
    return '<article class="hikaye">' +
      '<p><a class="baglanti" href="#/il/' + h.il + '">← ' + k(IL[h.il].ad) + ' hikayeleri</a></p>' +
      kapak(h, 'hikaye-kapak') +
      '<p class="kunye">📍 ' + k(yer(h)) + ' · ' + k(donemAdi(h.donem)) + (h.tema ? ' · 🏆 Meydan hikayesi' : '') + '</p>' +
      '<h1>' + k(h.baslik) + '</h1>' +
      '<p class="yazar-satiri"><b>' + k(y.ad) + '</b>' + ornekIsareti(h) + (gurbet ? ' · ' + k(gurbet) : '') + ' · ' + tarihYaz(h.tarih) + '</p>' +
      '<div class="metin">' + h.metin.split(/\n+/).map(function (p) { return '<p>' + k(p) + '</p>'; }).join('') + '</div>' +
      '<p class="cipler">' + (h.etiketler || []).map(function (e) {
        return '<a class="cip" href="#/kesfet?etiket=' + encodeURIComponent(e) + '">' + etiketSimgesi(e) + ' #' + k(e) + '</a>';
      }).join('') + '</p>' +
      '<div class="islemler">' +
      '<button type="button" class="dugme' + (Depo.begendimMi(h.id) ? ' dolu' : '') + '" data-is="begen" data-id="' + k(h.id) + '" aria-pressed="' + Depo.begendimMi(h.id) + '">♥ Beğen · ' + (h.begeni || 0) + '</button>' +
      '<button type="button" class="dugme' + (Depo.favorideMi(h.id) ? ' dolu' : '') + '" data-is="favori" data-id="' + k(h.id) + '" aria-pressed="' + Depo.favorideMi(h.id) + '">' + (Depo.favorideMi(h.id) ? '★ Favorilerimde' : '☆ Favorilere ekle') + '</button>' +
      '<button type="button" class="dugme" data-is="dinle" data-id="' + k(h.id) + '">🔊 Dinle</button>' +
      '<button type="button" class="dugme" data-is="gonder" data-id="' + k(h.id) + '">↗ Paylaş</button>' +
      (benimMi(h)
        ? '<button type="button" class="dugme sade" data-is="hikaye-sil" data-id="' + k(h.id) + '">Sil</button>'
        : '<button type="button" class="dugme sade" data-is="sikayet" data-id="' + k(h.id) + '" data-don="1">Şikâyet et</button>') +
      '</div></article>' +
      '<section class="yorumlar"><h2>Yorumlar (' + yorumlar.length + ')</h2>' +
      (yorumlar.length ? '<ul>' + yorumlar.map(function (yr) {
        return '<li><p><b>' + k(yr.yazar.ad) + '</b>' + ornekIsareti(yr) + ' <span class="kunye">' + tarihYaz(yr.tarih) + '</span></p><p>' + k(yr.metin) + '</p>' +
          '<button type="button" class="baglanti" data-is="' + (benimMi(yr) ? 'yorum-sil' : 'sikayet') + '" data-id="' + k(yr.id) + '">' + (benimMi(yr) ? 'Sil' : 'Şikâyet et') + '</button></li>';
      }).join('') + '</ul>' : '<p class="bos">İlk yorumu sen yaz.</p>') +
      '<form id="f-yorum" data-hikaye="' + k(h.id) + '">' + adAlani() +
      '<label>Yorumun<textarea name="metin" required maxlength="600" rows="3" placeholder="Bizde de böyleydi…"></textarea></label>' +
      '<button class="dugme dolu" type="submit">Yorum yap</button></form></section>' +
      (digerleri.length ? '<h2>' + k(IL[h.il].ad) + ' ilinden başka hikayeler</h2>' + kartlar(digerleri, '') : '');
  }

  /* ---------- Paylaş ---------- */

  function sayfaPaylas(sorgu) {
    const hafta = haftaBilgisi(new Date());
    const temali = sorgu.get('tema') === '1';
    const p = sorgu.get('il') || Depo.profil.memleket || '';
    const ilce = sorgu.get('ilce') || (String(p) === String(Depo.profil.memleket) ? Depo.profil.memleketIlce : '');
    return '<h1>Hikayeni paylaş</h1><p class="kunye">Bir sokak, bir sofra, bir ses… Memleketinden aklında kalanı yaz; haritada yerini alsın.</p>' +
      '<form id="f-hikaye" class="form">' + adAlani() +
      '<label>Başlık<input name="baslik" required maxlength="80" placeholder="Örn. Dedemin bağ evi"></label>' +
      '<label>Hikayen<textarea name="metin" required minlength="20" maxlength="4000" rows="8" placeholder="Nerede, ne zaman, kimlerle? Kokusu, sesi, tadı neydi?"></textarea></label>' +
      '<div class="ikiye"><label>İl<select name="il" required data-degis="form-il" data-hedef="hikaye-ilce">' + ilSecenekleri(p, 'İl seç…') + '</select></label>' +
      '<label>İlçe<select name="ilce" id="hikaye-ilce">' + ilceSecenekleri(p, ilce, 'İlçe seç (isteğe bağlı)') + '</select></label></div>' +
      '<label>Bu anı hangi döneme ait?<select name="donem" required>' + donemSecenekleri('bugun', '') + '</select></label>' +
      '<fieldset><legend>Etiketler (en çok 3)</legend><div class="cipler">' + ETIKETLER.map(function (e) {
        return '<label class="cip secmeli"><input type="checkbox" name="etiket" value="' + k(e.ad) + '" data-degis="etiket-sinir"' +
          (temali && hafta.tema.etiket === e.ad ? ' checked' : '') + '>' + e.simge + ' #' + k(e.ad) + '</label>';
      }).join('') + '</div></fieldset>' +
      '<label>Fotoğraf (isteğe bağlı)<input type="file" accept="image/*" data-degis="foto"></label><div id="foto-onizleme"></div>' +
      '<label class="onay"><input type="checkbox" name="tema"' + (temali ? ' checked' : '') + '> 🏆 Bu haftanın Meydan temasına katıl: <b>' + k(hafta.tema.ad) + '</b></label>' +
      '<p class="kunye">Küfür, hakaret ve siyaset içeren paylaşımlar kabul edilmez. Başkalarının kişisel bilgilerini yazmamaya ve yalnızca sana ait fotoğrafları eklemeye özen göster.</p>' +
      '<button class="dugme dolu buyuk" type="submit">Haritaya ekle</button></form>';
  }

  /* ---------- Meydan ---------- */

  function sayfaMeydan() {
    const hafta = haftaBilgisi(new Date());
    const siralama = haftaSiralamasi(hafta.kimlik);
    const onceki = haftaBilgisi(new Date(Date.now() - 7 * 864e5));
    const gecenBaskent = haftaSiralamasi(onceki.kimlik)[0];
    const hikayeler = sirala(Depo.hikayeler().filter(function (h) { return h.tema === hafta.kimlik; }), 'begeni');
    const siradakiler = [1, 2, 3].map(function (i) { return TEMALAR[(hafta.temaNo + i) % TEMALAR.length].ad; });
    return '<section class="meydan-bas"><p class="ust-yazi">Haftalık Memleket Meydanı · ' + hafta.no + '. hafta</p>' +
      '<h1>' + k(hafta.tema.ad) + '</h1><p>' + k(hafta.tema.aciklama) + '</p>' +
      '<p class="kunye">⏳ ' + (hafta.kalan ? hafta.kalan + ' gün kaldı' : 'Son gün!') + ' · Hafta sonunda en çok beğeni toplayan ilçe “Haftanın Kültür Başkenti” olur ve haritada taç takar.</p>' +
      '<a class="dugme dolu buyuk" href="#/paylas?tema=1">✍️ Hikayenle katıl</a></section>' +
      (gecenBaskent ? '<p class="baskent">👑 Geçen haftanın Kültür Başkenti: <b>' + k(yer(gecenBaskent)) + '</b> <span class="kunye">(' + k(onceki.tema.ad) + ')</span></p>' : '') +
      '<h2>Bu haftanın sıralaması</h2>' +
      (siralama.length ? '<ol class="siralama">' + siralama.slice(0, 10).map(function (s, i) {
        return '<li><span class="sira-no">' + (i ? i + 1 : '👑') + '</span><a href="#/il/' + s.il + (s.ilce ? '/' + encodeURIComponent(s.ilce) : '') + '">' + k(yer(s)) + '</a>' +
          '<span class="saga">' + s.puan + ' puan · ' + s.adet + ' hikaye</span></li>';
      }).join('') + '</ol>' : '<p class="bos">Meydan henüz boş. İlk hikayeyi paylaşan ilçe öne geçer!</p>') +
      '<h2>Temanın hikayeleri</h2>' + kartlar(hikayeler, 'Bu haftanın temasında henüz hikaye yok.') +
      '<h2>Sıradaki temalar</h2><p class="cipler">' + siradakiler.map(function (ad) { return '<span class="cip">' + k(ad) + '</span>'; }).join('') + '</p>';
  }

  /* ---------- Sözlük ---------- */

  function sozlukListesi() {
    const ara = sade(sozlukDurum.ara.trim());
    const liste = Depo.sozluk().filter(function (s) {
      if (s.tur !== sozlukDurum.tur) return false;
      if (sozlukDurum.il && String(s.il) !== String(sozlukDurum.il)) return false;
      return !ara || sade(s.baslik + ' ' + s.aciklama + ' ' + yer(s)).indexOf(ara) >= 0;
    }).sort(function (a, b) { return (b.oy || 0) - (a.oy || 0) || (a.tarih < b.tarih ? 1 : -1); });
    if (!liste.length) return '<p class="bos">Henüz kayıt yok. İlk ekleyen sen ol!</p>';
    return liste.map(function (s) {
      const oyum = Depo.oyum(s.id);
      return '<article class="soz"><div class="oy">' +
        '<button type="button" data-is="oy" data-id="' + k(s.id) + '" data-yon="1" class="' + (oyum === 1 ? 'secili' : '') + '" aria-pressed="' + (oyum === 1) + '" aria-label="Doğru, bizde de böyle" title="Doğru, bizde de böyle">▲</button>' +
        '<b>' + (s.oy || 0) + '</b>' +
        '<button type="button" data-is="oy" data-id="' + k(s.id) + '" data-yon="-1" class="' + (oyum === -1 ? 'secili' : '') + '" aria-pressed="' + (oyum === -1) + '" aria-label="Emin değilim" title="Emin değilim">▼</button></div>' +
        '<div class="soz-ic"><h3>' + k(s.baslik) + ornekIsareti(s) + '</h3>' +
        '<p class="kunye">📍 <a href="#/il/' + s.il + '">' + k(yer(s)) + '</a> · ' + k(s.yazar.ad) + '</p>' +
        '<p>' + k(s.aciklama) + '</p>' + (s.ornekCumle ? '<p class="ornek-cumle">“' + k(s.ornekCumle) + '”</p>' : '') +
        '<p class="soz-islem">' + (s.ses ? '<button type="button" class="baglanti" data-is="ses-cal" data-id="' + k(s.id) + '">🔊 Okunuşunu dinle</button>' : '') +
        '<button type="button" class="baglanti" data-is="' + (benimMi(s) ? 'sozluk-sil' : 'sikayet') + '" data-id="' + k(s.id) + '">' + (benimMi(s) ? 'Sil' : 'Şikâyet et') + '</button></p></div></article>';
    }).join('');
  }
  function sayfaSozluk() {
    const kelime = sozlukDurum.tur === 'kelime';
    return '<h1>Yöresel Sözlük</h1><p class="kunye">“Bizim orada buna … denir.” Kelimeni ekle, okunuşunu kaydet; başkalarınınkini oyla.</p>' +
      '<div class="sekmeler" role="tablist">' +
      '<button type="button" role="tab" data-is="sekme" data-deger="kelime" aria-selected="' + kelime + '"' + (kelime ? ' class="secili"' : '') + '>🗣️ Kelimeler ve deyimler</button>' +
      '<button type="button" role="tab" data-is="sekme" data-deger="meshur" aria-selected="' + !kelime + '"' + (!kelime ? ' class="secili"' : '') + '>⭐ Nesi meşhur?</button></div>' +
      '<details class="ekle"' + (sayfaSozluk.acik ? ' open' : '') + '><summary class="dugme dolu">＋ ' + (kelime ? 'Kelime ekle' : 'Meşhur bir şey ekle') + '</summary>' +
      '<form id="f-sozluk" class="form">' + adAlani() +
      '<div class="ikiye"><label>İl<select name="il" required data-degis="form-il" data-hedef="sozluk-ilce">' + ilSecenekleri(sozlukDurum.il || Depo.profil.memleket || '', 'İl seç…') + '</select></label>' +
      '<label>İlçe<select name="ilce" id="sozluk-ilce">' + ilceSecenekleri(sozlukDurum.il || Depo.profil.memleket, '', 'İlçe seç (isteğe bağlı)') + '</select></label></div>' +
      '<label>' + (kelime ? 'Kelime ya da deyim' : 'Nesi meşhur?') + '<input name="baslik" required maxlength="60" placeholder="' + (kelime ? 'Örn. Gakgoş' : 'Örn. Cağ kebabı') + '"></label>' +
      '<label>' + (kelime ? 'Anlamı' : 'Kısaca anlat') + '<textarea name="aciklama" required maxlength="300" rows="2"></textarea></label>' +
      (kelime ? '<label>Örnek cümle (isteğe bağlı)<input name="ornekCumle" maxlength="160"></label>' +
        '<div class="ses-kayit"><button type="button" class="dugme" data-is="ses-kaydet">🎙️ Okunuşunu kaydet</button><span id="ses-onizleme" class="kunye">En çok 8 saniye.</span></div>' : '') +
      '<button class="dugme dolu" type="submit">Sözlüğe ekle</button></form></details>' +
      '<div class="arac"><label class="gizli" for="sozluk-ara">Sözlükte ara</label><input id="sozluk-ara" class="genis" type="search" placeholder="Sözlükte ara…" autocomplete="off" value="' + k(sozlukDurum.ara) + '">' +
      '<select data-degis="sozluk-il" aria-label="İl">' + ilSecenekleri(sozlukDurum.il, 'Tüm iller') + '</select></div>' +
      '<div id="sozluk-liste">' + sozlukListesi() + '</div>';
  }

  /* ---------- Benim Hikayem ---------- */

  function radarBolumu() {
    const p = Depo.profil;
    if (!p.radar) return '<p class="bos">Radar kapalı. Açarsan senin memleketinden olup anılarını paylaşanları burada görürsün; sen de onların radarında görünürsün.</p>';
    if (!p.memleket) return '<p class="bos">Radarın çalışması için yukarıdan memleketini seç.</p>';
    const hemsehriler = {};
    Depo.hikayeler().forEach(function (h) {
      const y = h.yazar;
      if (y.id === p.id || !y.radar || y.memleket !== p.memleket) return;
      (hemsehriler[y.id] || (hemsehriler[y.id] = { yazar: y, hikayeler: [] })).hikayeler.push(h);
    });
    const liste = Object.keys(hemsehriler).map(function (a) { return hemsehriler[a]; })
      .sort(function (a, b) { return (b.yazar.yasadigi === p.yasadigi) - (a.yazar.yasadigi === p.yasadigi); });
    if (!liste.length) return '<p class="bos">Şimdilik radarında ' + k(IL[p.memleket].ad) + ' ilinden başka kimse yok. Hikayeni paylaş, seni bulsunlar.</p>';
    return '<ul class="radar">' + liste.map(function (g) {
      const y = g.yazar;
      const ayniSehir = p.yasadigi && y.yasadigi === p.yasadigi;
      return '<li' + (ayniSehir ? ' class="yakin"' : '') + '><p><b>' + k(y.ad) + '</b> · ' + (y.yasadigi ? k(IL[y.yasadigi].ad) + ' ilinde yaşıyor' : '') +
        (ayniSehir ? ' <span class="ornek-isareti">Seninle aynı şehirde</span>' : '') + '</p>' +
        g.hikayeler.map(function (h) { return '<a class="baglanti" href="#/hikaye/' + encodeURIComponent(h.id) + '">' + k(h.baslik) + '</a>'; }).join(' · ') + '</li>';
    }).join('') + '</ul>';
  }
  function sayfaBen() {
    const p = Depo.profil;
    const kt = katkilar(p.id);
    const puan = kulturPuani(kt);
    const rz = rozetler(kt, puan);
    const benimkiler = sirala(kt.hikayeler, 'yeni');
    const favoriler = Depo.favoriler().map(Depo.hikaye).filter(Boolean);
    return '<section class="profil-bas"><div><p class="ust-yazi">Benim Hikayem</p><h1>' + k(p.ad || 'Hoş geldin') + '</h1>' +
      '<p class="kunye">' + (p.memleket ? 'Memleket: ' + k(p.memleketIlce ? p.memleketIlce + ', ' : '') + k(IL[p.memleket].ad) : 'Memleketini seç, haritada yerini al.') +
      (p.yasadigi ? ' · Yaşadığı yer: ' + k(IL[p.yasadigi].ad) : '') + '</p></div>' +
      '<div class="puan"><b>' + puan + '</b><span>kültür puanı</span></div></section>' +
      '<h2>Rozetlerim</h2><ul class="rozetler">' + rz.map(function (r) {
        return '<li class="' + (r.var ? 'var' : 'yok') + '" title="' + k(r.aciklama) + '"><span aria-hidden="true">' + r.simge + '</span><b>' + k(r.ad) + '</b><small>' + k(r.aciklama) + '</small></li>';
      }).join('') + '</ul>' +
      '<h2>Anı defterim</h2>' + (benimkiler.length ? '<ol class="defter">' + benimkiler.map(function (h) {
        return '<li><time datetime="' + k(h.tarih) + '">' + tarihYaz(h.tarih) + '</time><a href="#/hikaye/' + encodeURIComponent(h.id) + '">' +
          (h.foto ? '<img src="' + k(h.foto) + '" alt="" loading="lazy">' : '') +
          '<strong>' + k(h.baslik) + '</strong><span class="kunye">📍 ' + k(yer(h)) + ' · ' + k(donemAdi(h.donem)) + ' · ♥ ' + (h.begeni || 0) + '</span>' +
          '<span class="ozet">' + k(h.metin.slice(0, 220)) + (h.metin.length > 220 ? '…' : '') + '</span></a></li>';
      }).join('') + '</ol>' : '<p class="bos">Defterin henüz boş. <a class="baglanti" href="#/paylas">İlk anını yaz →</a></p>') +
      '<h2>Favorilerim</h2>' + kartlar(favoriler, 'Beğendiğin hikayelerde “Favorilere ekle”ye dokun; burada birikir.') +
      '<h2>Hemşehri Radarı</h2>' + radarBolumu() +
      '<h2>Profilim</h2><form id="f-profil" class="form">' +
      '<label>Adın<input name="ad" maxlength="40" value="' + k(p.ad) + '" autocomplete="nickname" required></label>' +
      '<div class="ikiye"><label>Memleketin<select name="memleket" data-degis="form-il" data-hedef="profil-ilce">' + ilSecenekleri(p.memleket || '', 'İl seç…') + '</select></label>' +
      '<label>İlçe<select name="memleketIlce" id="profil-ilce">' + ilceSecenekleri(p.memleket, p.memleketIlce, 'İlçe seç (isteğe bağlı)') + '</select></label></div>' +
      '<label>Şu an yaşadığın il<select name="yasadigi">' + ilSecenekleri(p.yasadigi || '', 'İl seç…') + '</select></label>' +
      '<label class="onay"><input type="checkbox" name="radar"' + (p.radar ? ' checked' : '') + '> Hemşehri Radarı’nda görünmek istiyorum (isteğe bağlı)</label>' +
      '<button class="dugme dolu" type="submit">Kaydet</button></form>' +
      '<h2>Ayarlar</h2><div class="islemler">' +
      (Depo.ornekVarMi() ? '<button type="button" class="dugme" data-is="ornek-kaldir">Örnek içeriği kaldır</button>' : '') +
      '<button type="button" class="dugme" data-is="tema">◐ Açık / koyu tema</button></div>' +
      '<p class="kunye">Bu sürümde paylaşımların yalnızca bu cihazda saklanır' + (Depo.kalici ? '.' : '; tarayıcın kalıcı depolamaya izin vermediği için sayfa kapanınca silinebilir.') + '</p>';
  }

  /* ---------- yönlendirme ---------- */

  function yol() {
    const ham = location.hash.replace(/^#\/?/, '').split('?');
    const parca = ham[0].split('/').filter(Boolean).map(function (x) {
      try { return decodeURIComponent(x); } catch (e) { return x; }
    });
    const ilk = parca[0] || 'harita';
    return { parca: parca, sayfa: ilk === 'il' ? 'harita' : ilk, sorgu: new URLSearchParams(ham[1] || '') };
  }
  const BASLIKLAR = { harita: 'Harita', kesfet: 'Keşfet', paylas: 'Paylaş', meydan: 'Meydan', sozluk: 'Yöresel Sözlük', ben: 'Benim Hikayem' };

  function ciz() {
    const y = yol();
    let html;
    if (y.sayfa === 'kesfet') html = sayfaKesfet();
    else if (y.sayfa === 'hikaye') html = sayfaHikaye(y.parca[1]);
    else if (y.sayfa === 'paylas') html = sayfaPaylas(y.sorgu);
    else if (y.sayfa === 'meydan') html = sayfaMeydan();
    else if (y.sayfa === 'sozluk') html = sayfaSozluk();
    else if (y.sayfa === 'ben') html = sayfaBen();
    else { y.sayfa = 'harita'; html = sayfaHarita(y.parca[0] === 'il' ? +y.parca[1] : null, y.parca[2] || ''); }
    const eskiKaydir = icerik.querySelector('.harita-kaydir');
    const eskiSol = eskiKaydir ? eskiKaydir.scrollLeft : null;
    icerik.innerHTML = html;
    icerik.dataset.sayfa = y.sayfa;
    if (y.sayfa === 'harita') haritayiKaydir(eskiSol);
    Array.prototype.forEach.call(document.querySelectorAll('.menu a'), function (a) {
      if (a.dataset.sayfa === y.sayfa) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    const h = y.sayfa === 'hikaye' && Depo.hikaye(y.parca[1]);
    document.title = (h ? h.baslik : BASLIKLAR[y.sayfa] || 'Harita') + ' – Memleket Hikayeleri';
  }

  // Dar ekranda harita yana kayar: yeniden çizimde yerinde kalır, seçili il görünmüyorsa ortaya alınır.
  function haritayiKaydir(eskiSol) {
    const kutu = icerik.querySelector('.harita-kaydir');
    const secili = icerik.querySelector('path.il.secili');
    if (!kutu || kutu.scrollWidth <= kutu.clientWidth) return;
    if (eskiSol !== null) kutu.scrollLeft = eskiSol;
    if (!secili) return;
    const k = kutu.getBoundingClientRect();
    const s = secili.getBoundingClientRect();
    if (s.left < k.left || s.right > k.right) kutu.scrollLeft += (s.left + s.width / 2) - (k.left + k.width / 2);
  }

  // Adres değişince (yeniden çizimlerde değil) sayfaya özel başlangıç durumu kurulur.
  let oncekiSayfa = null;
  function git() {
    const y = yol();
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    sesKaydiniBirak();
    yeniFoto = null;
    yeniSes = null;
    sayfaSozluk.acik = false;
    if (y.sayfa === 'kesfet') {
      if (y.sorgu.has('etiket')) suzgec.etiket = y.sorgu.get('etiket');
      if (y.sorgu.has('il')) suzgec.il = y.sorgu.get('il');
    }
    if (y.sayfa === 'sozluk' && y.sorgu.has('il')) sozlukDurum.il = y.sorgu.get('il');
    ciz();
    // Haritada il değiştirirken sayfa yerinde kalsın; başka geçişlerde başa dönülsün.
    if (!(oncekiSayfa === 'harita' && y.sayfa === 'harita')) window.scrollTo(0, 0);
    oncekiSayfa = y.sayfa;
  }

  /* ---------- sesli okuma, ses kaydı, fotoğraf ---------- */

  function dinle(h, dugme) {
    const ss = window.speechSynthesis;
    if (!ss || !window.SpeechSynthesisUtterance) return bildir('Bu cihaz sesli okumayı desteklemiyor.');
    if (ss.speaking) { ss.cancel(); return; }
    const soz = new SpeechSynthesisUtterance(h.baslik + '. ' + h.metin);
    soz.lang = 'tr-TR';
    const ses = ss.getVoices().find(function (v) { return v.lang.toLowerCase().indexOf('tr') === 0; });
    if (ses) soz.voice = ses;
    soz.rate = 0.95;
    soz.onend = soz.onerror = function () {
      const d = document.querySelector('[data-is="dinle"]');
      if (d) d.textContent = '🔊 Dinle';
    };
    dugme.textContent = '⏹ Durdur';
    ss.speak(soz);
  }

  function sesKaydiniBirak() {
    if (kaydedici && kaydedici.state !== 'inactive') kaydedici.stop();
    kaydedici = null;
  }
  function sesKaydet(dugme) {
    if (kaydedici && kaydedici.state !== 'inactive') { kaydedici.stop(); return; }
    if (!navigator.mediaDevices || !window.MediaRecorder) return bildir('Bu cihaz ses kaydını desteklemiyor.');
    navigator.mediaDevices.getUserMedia({ audio: true }).then(function (akis) {
      const parcalar = [];
      const kd = kaydedici = new MediaRecorder(akis);
      const sure = setTimeout(function () { if (kd.state !== 'inactive') kd.stop(); }, 8000);
      kd.ondataavailable = function (e) { parcalar.push(e.data); };
      kd.onstop = function () {
        clearTimeout(sure);
        akis.getTracks().forEach(function (iz) { iz.stop(); });
        if (kaydedici !== kd) return; // sayfadan çıkıldı, kayıt atılır
        const okuyucu = new FileReader();
        okuyucu.onload = function () {
          yeniSes = okuyucu.result;
          const kutu = document.getElementById('ses-onizleme');
          if (kutu) kutu.innerHTML = '<audio controls src="' + k(yeniSes) + '"></audio>';
          const d = document.querySelector('[data-is="ses-kaydet"]');
          if (d) d.textContent = '🎙️ Yeniden kaydet';
        };
        okuyucu.readAsDataURL(new Blob(parcalar, { type: kd.mimeType }));
      };
      kd.start();
      dugme.textContent = '⏹ Kaydı bitir';
    }).catch(function () { bildir('Mikrofona erişilemedi. Tarayıcı izinlerini kontrol et.'); });
  }

  // Fotoğraflar cihazda saklandığı için en uzun kenarı 1280 pikselle sınırlanır.
  function fotoKucult(dosya) {
    return new Promise(function (coz, red) {
      const adres = URL.createObjectURL(dosya);
      const resim = new Image();
      resim.onload = function () {
        const oran = Math.min(1, 1280 / Math.max(resim.width, resim.height));
        const tuval = document.createElement('canvas');
        tuval.width = Math.round(resim.width * oran);
        tuval.height = Math.round(resim.height * oran);
        tuval.getContext('2d').drawImage(resim, 0, 0, tuval.width, tuval.height);
        URL.revokeObjectURL(adres);
        coz(tuval.toDataURL('image/jpeg', 0.82));
      };
      resim.onerror = function () { URL.revokeObjectURL(adres); red(new Error('okunamadı')); };
      resim.src = adres;
    });
  }

  /* ---------- olaylar ---------- */

  // Formdaki metin alanlarında küfür ya da siyaset varsa uyarır ve false döner.
  function uygunMu(form) {
    const alanlar = form.querySelectorAll('input[type="text"], input:not([type]), textarea');
    for (let i = 0; i < alanlar.length; i++) {
      const sonuc = Denetim.denetle(alanlar[i].value);
      if (sonuc) { bildir(sonuc.mesaj); alanlar[i].focus(); return false; }
    }
    return true;
  }
  function adiKaydet(form) {
    const alan = form.elements.ad;
    if (!alan || Depo.profil.ad) return Promise.resolve();
    return Depo.profilKaydet({ ad: alan.value.trim() });
  }

  const ISLER = {
    il: function (d) { location.hash = yol().parca[1] === d.dataset.p ? '#/' : '#/il/' + d.dataset.p; },
    donem: function (d) { harita.donem = d.dataset.deger; ciz(); },
    sira: function (d) { harita.sira = d.dataset.deger; ciz(); },
    etiket: function (d) { suzgec.etiket = suzgec.etiket === d.dataset.deger ? '' : d.dataset.deger; ciz(); },
    sekme: function (d) { sozlukDurum.tur = d.dataset.deger; yeniSes = null; sesKaydiniBirak(); ciz(); },
    begen: function (d) { Depo.begen(d.dataset.id).then(ciz); },
    favori: function (d) { bildir(Depo.favori(d.dataset.id) ? 'Favorilerine eklendi.' : 'Favorilerinden çıkarıldı.'); ciz(); },
    dinle: function (d) { const h = Depo.hikaye(d.dataset.id); if (h) dinle(h, d); },
    gonder: function (d) {
      const h = Depo.hikaye(d.dataset.id);
      if (!h) return;
      const veri = { title: h.baslik, text: h.baslik + ' – ' + yer(h) + ' (Memleket Hikayeleri)', url: location.href };
      if (navigator.share) navigator.share(veri).catch(function () { /* vazgeçildi */ });
      else if (navigator.clipboard) navigator.clipboard.writeText(veri.url).then(function () { bildir('Bağlantı kopyalandı.'); });
    },
    'hikaye-sil': function (d) {
      if (!confirm('Bu hikaye ve yorumları silinsin mi?')) return;
      Depo.hikayeSil(d.dataset.id).then(function () { bildir('Hikaye silindi.'); location.hash = '#/ben'; });
    },
    'yorum-sil': function (d) { Depo.yorumSil(d.dataset.id).then(ciz); },
    'sozluk-sil': function (d) { if (confirm('Bu kayıt silinsin mi?')) Depo.sozlukSil(d.dataset.id).then(ciz); },
    sikayet: function (d) {
      if (!confirm('Bu içerik uygunsuz mu? Şikâyet edersen sana bir daha gösterilmez.')) return;
      Depo.sikayet(d.dataset.id);
      bildir('Şikâyetin alındı, içerik gizlendi.');
      if (d.dataset.don) location.hash = '#/'; else ciz();
    },
    oy: function (d) { Depo.sozlukOy(d.dataset.id, +d.dataset.yon).then(function () { document.getElementById('sozluk-liste').innerHTML = sozlukListesi(); }); },
    'ses-cal': function (d) {
      const s = Depo.sozluk().find(function (x) { return x.id === d.dataset.id; });
      if (s && s.ses) new Audio(s.ses).play().catch(function () { bildir('Ses çalınamadı.'); });
    },
    'ses-kaydet': sesKaydet,
    'foto-kaldir': function () {
      yeniFoto = null;
      document.getElementById('foto-onizleme').innerHTML = '';
      const alan = document.querySelector('[data-degis="foto"]');
      if (alan) alan.value = '';
    },
    'ornek-kaldir': function () {
      if (!confirm('Tanıtım için eklenen örnek hikayeler, yorumlar ve sözlük kayıtları silinsin mi?')) return;
      Depo.ornekleriKaldir().then(function () { bildir('Örnek içerik kaldırıldı.'); ciz(); });
    },
    tema: function () {
      const koyu = document.documentElement.dataset.tema
        ? document.documentElement.dataset.tema === 'koyu'
        : window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.dataset.tema = koyu ? 'acik' : 'koyu';
      Depo.ayarYaz('tema', document.documentElement.dataset.tema);
    },
    yukle: function (d) {
      if (!yuklemeIstegi) return;
      yuklemeIstegi.prompt();
      yuklemeIstegi = null;
      d.hidden = true;
    }
  };

  const DEGISIMLER = {
    'il-sec': function (a) { location.hash = a.value ? '#/il/' + a.value : '#/'; },
    'ilce-sec': function (a) { location.hash = '#/il/' + a.dataset.p + (a.value ? '/' + encodeURIComponent(a.value) : ''); },
    'form-il': function (a) { document.getElementById(a.dataset.hedef).innerHTML = ilceSecenekleri(a.value, '', 'İlçe seç (isteğe bağlı)'); },
    'kesfet-il': function (a) { suzgec.il = a.value; document.getElementById('sonuclar').innerHTML = kesfetSonuclari(); },
    'kesfet-donem': function (a) { suzgec.donem = a.value; document.getElementById('sonuclar').innerHTML = kesfetSonuclari(); },
    'kesfet-sira': function (a) { suzgec.sira = a.value; document.getElementById('sonuclar').innerHTML = kesfetSonuclari(); },
    'sozluk-il': function (a) { sozlukDurum.il = a.value; document.getElementById('sozluk-liste').innerHTML = sozlukListesi(); },
    'etiket-sinir': function (a) {
      if (a.form.querySelectorAll('[name="etiket"]:checked').length > 3) { a.checked = false; bildir('En çok 3 etiket seçebilirsin.'); }
    },
    foto: function (a) {
      const dosya = a.files && a.files[0];
      if (!dosya) return;
      fotoKucult(dosya).then(function (adres) {
        yeniFoto = adres;
        document.getElementById('foto-onizleme').innerHTML = '<img src="' + k(adres) + '" alt="Seçilen fotoğraf">' +
          '<button type="button" class="baglanti" data-is="foto-kaldir">Fotoğrafı kaldır</button>';
      }, function () { a.value = ''; bildir('Bu dosya fotoğraf olarak okunamadı.'); });
    }
  };

  const FORMLAR = {
    'f-hikaye': function (f) {
      const a = f.elements;
      const metin = a.metin.value.trim();
      if (metin.length < 20) return bildir('Hikayen biraz daha uzun olsun (en az 20 harf).');
      if (!uygunMu(f)) return;
      const hafta = haftaBilgisi(new Date());
      const etiketler = Array.prototype.map.call(f.querySelectorAll('[name="etiket"]:checked'), function (e) { return e.value; }).slice(0, 3);
      const onceki = kazanilanlar();
      adiKaydet(f).then(function () {
        return Depo.hikayeEkle({ baslik: a.baslik.value.trim(), metin: metin, il: +a.il.value, ilce: a.ilce.value, donem: a.donem.value,
          etiketler: etiketler, foto: yeniFoto, tema: a.tema.checked ? hafta.kimlik : null });
      }).then(function (h) {
        location.hash = '#/hikaye/' + encodeURIComponent(h.id);
        katkiBildir('Hikayen haritada! +' + (h.tema ? 15 : 10) + ' kültür puanı.', onceki);
      }, function () { bildir('Hikaye kaydedilemedi. Fotoğraf çok büyük olabilir; fotoğrafsız dene.'); });
    },
    'f-yorum': function (f) {
      const metin = f.elements.metin.value.trim();
      if (!metin || !uygunMu(f)) return;
      adiKaydet(f).then(function () { return Depo.yorumEkle(f.dataset.hikaye, metin); }).then(ciz);
    },
    'f-sozluk': function (f) {
      const a = f.elements;
      if (!uygunMu(f)) return;
      const onceki = kazanilanlar();
      adiKaydet(f).then(function () {
        return Depo.sozlukEkle({ tur: sozlukDurum.tur, il: +a.il.value, ilce: a.ilce.value, baslik: a.baslik.value.trim(),
          aciklama: a.aciklama.value.trim(), ornekCumle: a.ornekCumle ? a.ornekCumle.value.trim() : '', ses: yeniSes });
      }).then(function () {
        yeniSes = null;
        sayfaSozluk.acik = false;
        ciz();
        katkiBildir('Sözlüğe eklendi! +5 kültür puanı.', onceki);
      });
    },
    'f-profil': function (f) {
      const a = f.elements;
      if (!uygunMu(f)) return;
      Depo.profilKaydet({ ad: a.ad.value.trim(), memleket: +a.memleket.value || null, memleketIlce: a.memleketIlce.value,
        yasadigi: +a.yasadigi.value || null, radar: a.radar.checked }).then(function () { ciz(); bildir('Profilin kaydedildi.'); });
    }
  };

  document.addEventListener('click', function (e) {
    const d = e.target.closest('[data-is]');
    if (d && ISLER[d.dataset.is]) ISLER[d.dataset.is](d);
  });
  document.addEventListener('keydown', function (e) {
    // Harita illeri <path> olduğundan klavyeyle seçilebilmeleri için.
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches('path[data-is="il"]')) {
      e.preventDefault();
      ISLER.il(e.target);
    }
  });
  document.addEventListener('change', function (e) {
    const a = e.target.dataset && DEGISIMLER[e.target.dataset.degis];
    if (a) a(e.target);
  });
  document.addEventListener('input', function (e) {
    if (e.target.id === 'kesfet-ara') { suzgec.ara = e.target.value; document.getElementById('sonuclar').innerHTML = kesfetSonuclari(); }
    if (e.target.id === 'sozluk-ara') { sozlukDurum.ara = e.target.value; document.getElementById('sozluk-liste').innerHTML = sozlukListesi(); }
  });
  document.addEventListener('submit', function (e) {
    const is = FORMLAR[e.target.id];
    if (!is) return;
    e.preventDefault();
    is(e.target);
  });
  document.addEventListener('toggle', function (e) {
    if (e.target.matches && e.target.matches('details.ekle')) sayfaSozluk.acik = e.target.open;
  }, true);
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    yuklemeIstegi = e;
    document.getElementById('yukle').hidden = false;
  });
  window.addEventListener('hashchange', git);

  Depo.hazirla(ornekUret).catch(function () { /* depo açılamadıysa boş başlar */ }).then(function () {
    git();
    if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(function () {});
  });
})();
