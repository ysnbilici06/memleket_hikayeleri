# -*- coding: utf-8 -*-
"""data/iller.js dosyasını üretir: 81 ilin harita çizimi, bölgesi ve ilçe listesi.

Kullanım:
    python tools/harita_uret.py <il-sinirlari.geojson> <il-ilce.json>

Kaynaklar:
    il sınırları : github.com/cihadturhan/tr-geojson  (geo/tr-cities-utf8.json)
    il / ilçe    : api.turkiyeapi.dev/v1/provinces
"""
import json
import math
import os
import sys

GENISLIK = 1000.0
KENAR = 6.0

ES_ADLAR = {'afyon': 'afyonkarahisar', 'kmaras': 'kahramanmaras', 'k maras': 'kahramanmaras',
            'sanliurfa': 'sanliurfa', 'urfa': 'sanliurfa', 'antep': 'gaziantep', 'icel': 'mersin',
            'izmit': 'kocaeli', 'adapazari': 'sakarya', 'antakya': 'hatay'}


def sade(ad):
    ad = ad.replace('İ', 'i').replace('I', 'i').lower()
    for a, b in (('ı', 'i'), ('ş', 's'), ('ğ', 'g'), ('ü', 'u'), ('ö', 'o'), ('ç', 'c'), ('â', 'a'), ('î', 'i'), ('û', 'u')):
        ad = ad.replace(a, b)
    ad = ''.join(h for h in ad if h.isalpha() or h == ' ').strip()
    return ES_ADLAR.get(ad, ad)


def halkalar(geometri):
    cokgenler = geometri['coordinates'] if geometri['type'] == 'MultiPolygon' else [geometri['coordinates']]
    return [c[0] for c in cokgenler]  # yalnızca dış sınır


def alan_ve_merkez(n):
    a = cx = cy = 0.0
    for i in range(len(n)):
        x0, y0 = n[i]
        x1, y1 = n[(i + 1) % len(n)]
        c = x0 * y1 - x1 * y0
        a += c
        cx += (x0 + x1) * c
        cy += (y0 + y1) * c
    if abs(a) < 1e-9:
        return 0.0, n[0]
    return abs(a) / 2, (cx / (3 * a), cy / (3 * a))


def main():
    sinirlar = json.load(open(sys.argv[1], encoding='utf-8'))['features']
    iller = json.load(open(sys.argv[2], encoding='utf-8'))['data']
    cizim = {sade(s['properties']['name']): halkalar(s['geometry']) for s in sinirlar}

    noktalar = [n for h in cizim.values() for halka in h for n in halka]
    bati, dogu = min(n[0] for n in noktalar), max(n[0] for n in noktalar)
    guney, kuzey = min(n[1] for n in noktalar), max(n[1] for n in noktalar)
    daralma = math.cos(math.radians((guney + kuzey) / 2))
    olcek = (GENISLIK - 2 * KENAR) / ((dogu - bati) * daralma)
    yukseklik = (kuzey - guney) * olcek + 2 * KENAR

    def cevir(n):
        return (KENAR + (n[0] - bati) * daralma * olcek, KENAR + (kuzey - n[1]) * olcek)

    cikti, eksik = [], []
    for il in sorted(iller, key=lambda i: i['id']):
        h = cizim.get(sade(il['name']))
        if not h:
            eksik.append(il['name'])
            continue
        yol, en_buyuk, merkez = [], -1.0, (0, 0)
        for halka in h:
            n = [cevir(k) for k in halka]
            alan, m = alan_ve_merkez(n)
            if alan < 1.5 and len(h) > 1:
                continue  # haritada görünmeyecek kadar küçük adacıklar
            if alan > en_buyuk:
                en_buyuk, merkez = alan, m
            yol.append('M' + 'L'.join('%.1f,%.1f' % k for k in n) + 'Z')
        cikti.append({
            'p': il['id'], 'ad': il['name'], 'b': il['region']['tr'],
            'd': ''.join(yol), 'm': [round(merkez[0], 1), round(merkez[1], 1)],
            'ilceler': sorted((i['name'] for i in il['districts']), key=sade),
        })
    if eksik or len(cikti) != 81:
        sys.exit('Eşleşmeyen iller: %s (toplam %d)' % (eksik, len(cikti)))

    hedef = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'data', 'iller.js')
    os.makedirs(os.path.dirname(hedef), exist_ok=True)
    with open(hedef, 'w', encoding='utf-8', newline='\n') as f:
        f.write('/* tools/harita_uret.py tarafından üretildi; elle düzenlemeyin. */\n')
        f.write('window.HARITA = {"genislik": %d, "yukseklik": %d};\n' % (GENISLIK, round(yukseklik)))
        f.write('window.ILLER = ' + json.dumps(cikti, ensure_ascii=False, separators=(',', ':')) + ';\n')
    print('%d il, %d ilçe, %d bayt' % (len(cikti), sum(len(i['ilceler']) for i in cikti), os.path.getsize(hedef)))


if __name__ == '__main__':
    main()
