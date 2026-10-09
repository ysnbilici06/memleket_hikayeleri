# -*- coding: utf-8 -*-
"""Uygulama simgelerini üretir: kiremit zemin üstünde, içinde ev olan krem harita iğnesi.

Kullanım: python tools/simge_uret.py
"""
import os
from PIL import Image, ImageDraw

ZEMIN, KREM = (168, 73, 42, 255), (255, 247, 236, 255)
HEDEF = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'assets', 'simge')


def ciz(boyut, maskeli=False):
    b = boyut * 4  # kenarlar yumuşak çıksın diye büyük çizilip küçültülür
    r = Image.new('RGBA', (b, b), (0, 0, 0, 0))
    c = ImageDraw.Draw(r)
    if maskeli:
        c.rectangle([0, 0, b, b], fill=ZEMIN)
    else:
        c.rounded_rectangle([0, 0, b - 1, b - 1], radius=int(b * 0.22), fill=ZEMIN)
    o = 0.78 if maskeli else 1.0  # maskeli simgede güvenli alan için içerik küçülür

    def n(x, y):
        return (b / 2 + (x - 0.5) * b * o, b / 2 + (y - 0.5) * b * o)

    # iğne: daire + aşağı bakan üçgen
    c.ellipse([n(0.24, 0.14), n(0.76, 0.66)], fill=KREM)
    c.polygon([n(0.285, 0.52), n(0.715, 0.52), n(0.5, 0.88)], fill=KREM)
    # ev: çatı, gövde, kapı
    c.polygon([n(0.5, 0.235), n(0.345, 0.385), n(0.655, 0.385)], fill=ZEMIN)
    c.rectangle([n(0.385, 0.375), n(0.615, 0.535)], fill=ZEMIN)
    c.rectangle([n(0.465, 0.44), n(0.535, 0.535)], fill=KREM)
    return r.resize((boyut, boyut), Image.LANCZOS)


os.makedirs(HEDEF, exist_ok=True)
for ad, boyut, maskeli in (('simge-192.png', 192, False), ('simge-512.png', 512, False),
                           ('simge-180.png', 180, True), ('simge-maskeli-512.png', 512, True)):
    ciz(boyut, maskeli).save(os.path.join(HEDEF, ad))
    print(ad)
