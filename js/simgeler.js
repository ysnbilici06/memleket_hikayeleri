/* Memleket Hikayeleri – simge takımı.
   Emoji yerine çizilmiş simgeler: her cihazda aynı görünür, rengini bulunduğu yazıdan alır.
   Çizimler 24×24 karelik; "d" sınıflı parçalar yarı saydam dolgu, "t" sınıflılar tam dolgudur. */
(function () {
  'use strict';

  const CIZIM = {
    // menü ve genel
    harita: '<path class="d" d="M3 6.5 9 4l6 2.5L21 4v13.5L15 20l-6-2.5L3 20z"/><path d="M9 4v13.5M15 6.5V20"/>',
    ara: '<circle class="d" cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5"/>',
    kalem: '<path class="d" d="M4 20l1-4.5L16.5 4a2.1 2.1 0 0 1 3 3L8 18.5z"/><path d="m14.5 6 3 3"/>',
    kupa: '<path class="d" d="M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M7 6H4v1.5A3.5 3.5 0 0 0 7.5 11M17 6h3v1.5a3.5 3.5 0 0 1-3.5 3.5M12 14v4M8 20h8"/>',
    kitap: '<path class="d" d="M12 6.5C10 5 7 4.5 3.5 5v13c3.5-.5 6.5 0 8.5 1.5 2-1.5 5-2 8.5-1.5V5C17 4.5 14 5 12 6.5z"/><path d="M12 6.5v13"/>',
    defter: '<rect class="d" x="5" y="3" width="14" height="18" rx="2"/><path d="M9 3v18M12.5 8H16M12.5 12H16M3.5 7.5h3M3.5 12h3M3.5 16.5h3"/>',
    konum: '<path class="d" d="M12 21s7-6.2 7-11.5a7 7 0 0 0-14 0C5 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
    kalp: '<path class="d" d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.2a4.3 4.3 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20z"/>',
    yorum: '<path class="d" d="M4 5.5h16V16h-9l-4.5 4v-4H4z"/><path d="M8 9.5h8M8 12.5h5"/>',
    yildiz: '<path class="d" d="m12 3.5 2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 16.9l-5.2 2.8 1-5.9-4.3-4.1 5.9-.8z"/>',
    ses: '<path class="d" d="M4 9.5h3.5l4.5-4v13l-4.5-4H4z"/><path d="M15.5 9a4.2 4.2 0 0 1 0 6M18 6.5a8 8 0 0 1 0 11"/>',
    mikrofon: '<rect class="d" x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3M9 21h6"/>',
    dur: '<rect class="d" x="6" y="6" width="12" height="12" rx="2"/>',
    gonder: '<path class="d" d="M5 12v7.5h14V12"/><path d="M12 15V4m0 0L8 8m4-4 4 4"/>',
    kum: '<path class="d" d="M7 3.5h10V7l-5 5 5 5v3.5H7V17l5-5-5-5z"/><path d="M5.5 3.5h13M5.5 20.5h13"/>',
    tema: '<circle cx="12" cy="12" r="8.5"/><path class="t" d="M12 3.5a8.5 8.5 0 0 1 0 17z"/>',
    indir: '<path d="M12 4v11m0 0-4-4m4 4 4-4M5 20h14"/>',
    zil: '<path class="d" d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
    ev: '<path class="d" d="m4 11 8-7 8 7v9H4z"/><path d="M10 20v-5.5h4V20"/>',
    // etiketler
    sokak: '<path class="d" d="M3 20v-8l5-4.5 5 4.5v8z"/><path d="M13 20V9.5l4-3.5 4 3.5V20M2 20h20M7 20v-4h2v4M16.5 12.5H18"/>',
    tencere: '<path class="d" d="M4.5 11h15v5a4 4 0 0 1-4 4h-7a4 4 0 0 1-4-4z"/><path d="M2.5 13h2M19.5 13h2M3.5 11h17M9 7.5C9 6 10.5 6 10.5 4.5M13.5 7.5c0-1.5 1.5-1.5 1.5-3"/>',
    bardak: '<path class="d" d="M8.5 4h7c0 3-1.5 4-1.5 6s2 3 2 5.5a4 4 0 0 1-8 0C8 13 10 12 10 10S8.5 7 8.5 4z"/><path d="M5 20.5h14M8.7 6.5h6.6"/>',
    seker: '<circle class="d" cx="12" cy="12" r="4.5"/><path d="M7.8 10.5 3.5 8v8l4.3-2.5M16.2 10.5 20.5 8v8l-4.3-2.5"/>',
    davul: '<ellipse class="d" cx="12" cy="8" rx="8" ry="3.5"/><path d="M4 8v8c0 1.9 3.6 3.5 8 3.5s8-1.6 8-3.5V8M8 11.2v7.6M16 11.2v7.6M12 11.5v8"/>',
    fotograf: '<path class="d" d="M3.5 7.5h4L9 5h6l1.5 2.5h4V19h-17z"/><circle cx="12" cy="13" r="3.5"/>',
    tren: '<rect class="d" x="5.5" y="3.5" width="13" height="13" rx="3"/><path d="M5.5 10.5h13M9 13.5h.01M15 13.5h.01M8.5 16.5 6 20.5M15.5 16.5l2.5 4M7.5 18.5h9"/>',
    sepet: '<path class="d" d="M3.5 10.5h17l-2 9h-13z"/><path d="M7.5 10.5 11 4.5M16.5 10.5 13 4.5M9 13.5v3M12 13.5v3M15 13.5v3"/>',
    dag: '<path class="d" d="M2.5 19.5 9 7.5l4 7 2.5-3.5 6 8.5z"/><path d="m7 11.2 2 1.3 1.9-1.6"/><circle cx="18" cy="6" r="1.8"/>',
    ucurtma: '<path class="d" d="M12 2.5 18 9l-6 8-6-8z"/><path d="M12 2.5V17M6 9h12M12 17c0 2 2 1.5 2 3s-1.5 1.5-1.5 1.5"/>',
    nota: '<path d="M9 17.5v-12l10-2v12"/><circle class="d" cx="6.5" cy="17.5" r="2.5"/><circle class="d" cx="16.5" cy="15.5" r="2.5"/>',
    cekic: '<path class="d" d="m13.5 3.5 7 7L18 13l-2-2-1.5 1.5-3-3L13 8l-2-2z"/><path d="M12 11l-8.5 8.5 2 2L14 13"/>',
    // rozetler
    filiz: '<path d="M12 21v-8"/><path class="d" d="M12 12.5c0-4-3-6.5-7.5-6.5 0 4.5 2.5 7 7.5 6.5zM12 15c0-3.5 2.5-5.5 7.5-5.5 0 4-2.5 6-7.5 5.5z"/>',
    kus: '<path class="d" d="M3 12.5c3 0 5-1 6.5-3.5C11 6 13.5 4.5 16 5.5c1.5.6 2.3 1.8 2.5 3l2.5 1-2.5 1c-.3 4-3.5 7-8 7-3 0-5.5-1.5-7.5-5z"/><path d="M16 8.5h.01M9.5 9c1 2.5 3 4 5.5 4"/>',
    bina: '<path class="d" d="M3.5 9.5 12 4l8.5 5.5z"/><path d="M5.5 9.5v8M9.8 9.5v8M14.2 9.5v8M18.5 9.5v8M3.5 20.5h17M4.5 17.5h15"/>',
    soz: '<path class="d" d="M3.5 5h12v8.5H9l-3.5 3v-3h-2z"/><path d="M18 9.5h2.5V17h-2v2.5L15.5 17H11"/>',
    madalya: '<circle class="d" cx="12" cy="15" r="5.5"/><path d="M8.5 3.5 11 9.7M15.5 3.5 13 9.7M8.5 3.5h7M12 13v4"/>'
  };

  // Taç kendi renkleriyle çizilir (altın gövde, yakut taşlar); haritada ve satır içinde aynı çizim kullanılır.
  const TAC = '<path d="M-11 5-13-6l6.5 4.5L0-10l6.5 8.5L13-6 11 5z" fill="#f2c14a" stroke="#8a5d0c" stroke-width="1.3" stroke-linejoin="round"/>' +
    '<path d="M-9.5 3.2-10.8-3.4l4.8 3.3L0-6.6" fill="none" stroke="#fde9a8" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" opacity=".8"/>' +
    '<rect x="-11" y="5" width="22" height="4.2" rx="1.3" fill="#d99a1e" stroke="#8a5d0c" stroke-width="1.3"/>' +
    '<circle cx="0" cy="7.1" r="1.3" fill="#c0392b"/><circle cx="-6" cy="7.1" r="1" fill="#2c7a5a"/><circle cx="6" cy="7.1" r="1" fill="#2c7a5a"/>' +
    '<circle cx="-13" cy="-6.5" r="1.7" fill="#f2c14a" stroke="#8a5d0c"/><circle cx="13" cy="-6.5" r="1.7" fill="#f2c14a" stroke="#8a5d0c"/><circle cx="0" cy="-10.5" r="1.9" fill="#c0392b" stroke="#8a5d0c"/>';

  function Simge(ad) {
    if (ad === 'tac') return '<svg class="sg tac-sg" viewBox="-16 -14 32 25" aria-hidden="true">' + TAC + '</svg>';
    return '<svg class="sg" viewBox="0 0 24 24" aria-hidden="true">' + (CIZIM[ad] || CIZIM.ev) + '</svg>';
  }
  Simge.tac = TAC;

  window.Simge = Simge;
})();
