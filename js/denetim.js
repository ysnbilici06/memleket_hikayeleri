/* Memleket Hikayeleri – içerik denetimi.
   Paylaşılan her metin (hikaye, yorum, sözlük kaydı, ad) kaydedilmeden önce küfür/hakaret
   ve siyaset bakımından denetlenir. Listeler bilerek dar tutuldu: "götürmek", "sıkıntı",
   "hükümet konağı", "çayın demi" gibi masum sözler takılmasın diye kelimeler ya tam
   eşleşmeyle ya da kelime başından aranır. Yeni kelime eklemek için aşağıdaki listeleri uzatın. */
(function () {
  'use strict';

  const KUFUR = {
    // kelimenin neresinde geçerse geçsin
    icerir: ['siktir', 'orospu', 'orosbu', 'oruspu', 'yarrak', 'amcık', 'amcik', 'pezevenk', 'götveren', 'gotveren', 'gerizekalı', 'gerizekali'],
    // kelime bununla başlıyorsa
    baslar: ['sikeyim', 'sikerim', 'sikik', 'sikiş', 'sikis', 'siktim', 'sikti', 'amına', 'amina', 'amını', 'yavşak', 'yavsak', 'kahpe',
      'kaltak', 'ibne', 'puşt', 'gavat', 'şerefsiz', 'serefsiz', 'dalyarak', 'taşşak', 'tassak', 'daşşak', 'piçlik'],
    // kelimenin tamamı buysa
    tam: ['amk', 'aq', 'awk', 'mk', 'oç', 'piç', 'pic', 'göt', 'götü', 'götün', 'götünü', 'bok', 'boktan', 'yarak', 'sik', 'sikim', 'sg']
  };
  const SIYASET = {
    baslar: ['siyas', 'iktidar', 'muhalefet', 'milletvekil', 'cumhurbaşkan', 'cumhurbaskan', 'propaganda', 'miting', 'sağcı', 'sagci',
      'solcu', 'faşist', 'fasist', 'komünist', 'komunist', 'darbeci', 'partili'],
    tam: ['akp', 'chp', 'mhp', 'hdp', 'bbp', 'akpli', 'chpli', 'mhpli', 'hdpli'],
    // birden çok kelimelik ifadeler
    ifade: ['ak parti', 'iyi parti', 'dem parti', 'saadet parti', 'zafer parti', 'siyasi parti', 'genel başkan', 'genel baskan',
      'seçim kampanya', 'secim kampanya', 'oy verin', 'oy vermeyin']
  };
  const MESAJLAR = {
    kufur: 'Yazında küfür ya da hakaret sayılan bir ifade var',
    siyaset: 'Memleket Hikayeleri siyasetten uzak bir meydan; yazında siyasi bir ifade var'
  };

  function duzle(metin) {
    return String(metin || '').toLocaleLowerCase('tr')
      .replace(/[@4]/g, 'a').replace(/0/g, 'o').replace(/[1!]/g, 'i').replace(/3/g, 'e').replace(/\$/g, 's')
      .replace(/[^a-zçğıöşüâîû]+/g, ' ')
      .replace(/(.)\1{2,}/g, '$1')  // "siiiktir" → "siktir"
      .trim();
  }
  function ara(liste, duz, kelimeler) {
    for (let i = 0; i < kelimeler.length; i++) {
      const kelime = kelimeler[i];
      if ((liste.tam || []).indexOf(kelime) >= 0) return kelime;
      if ((liste.baslar || []).some(function (b) { return kelime.indexOf(b) === 0; })) return kelime;
      if ((liste.icerir || []).some(function (b) { return kelime.indexOf(b) >= 0; })) return kelime;
    }
    const ifade = (liste.ifade || []).find(function (f) { return (' ' + duz).indexOf(' ' + f) >= 0; });
    return ifade || null;
  }

  window.Denetim = {
    // Uygunsa null; değilse { tur: 'kufur' | 'siyaset', ifade, mesaj } döner.
    denetle: function (metin) {
      const duz = duzle(metin);
      if (!duz) return null;
      const kelimeler = duz.split(' ');
      const kufur = ara(KUFUR, duz, kelimeler);
      if (kufur) return { tur: 'kufur', ifade: kufur, mesaj: MESAJLAR.kufur + ' (“' + kufur + '”). Lütfen düzelt.' };
      const siyaset = ara(SIYASET, duz, kelimeler);
      if (siyaset) return { tur: 'siyaset', ifade: siyaset, mesaj: MESAJLAR.siyaset + ' (“' + siyaset + '”). Lütfen çıkar.' };
      return null;
    }
  };
})();
