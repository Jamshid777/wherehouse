# Omborxona Nazorati Moduli

Bu mahsulotlar, omborlar, yetkazib beruvchilar va hujjatlarni boshqarish uchun professional veb-ilova.

## Texnologiyalar
- React (UI kutubxonasi)
- TypeScript (Dasturlash tili)
- TailwindCSS (Stillashtirish uchun)

Ilova to'g'ridan-to'g'ri brauzerda ishlaydi va CDN (Content Delivery Network) orqali kutubxonalarni yuklaydi. Buni ishga tushirish uchun hech qanday murakkab qurish jarayonlari (build process) talab qilinmaydi.

## Ilovani Ishga Tushirish (Deployment)

Bu statik veb-ilova bo'lganligi sababli, uni har qanday statik fayl serverida (masalan, Nginx, Apache, Vercel, Netlify) joylashtirish mumkin. Fayllarni serverga yuklash kifoya.

Agar siz Python yordamida ilovani lokal ravishda ishga tushirmoqchi bo'lsangiz, bir nechta usullar mavjud.

### 1-usul: Python'ning Ichki Serveri Yordamida (Tavsiya etiladi, eng oddiy)

Bu usul uchun hech qanday qo'shimcha kutubxonalar o'rnatish shart emas.

1.  Loyiha joylashgan papkaga terminal orqali o'ting.
2.  Quyidagi buyruqni bajaring:

    ```bash
    python -m http.server 8080
    ```
    (Agar `python` buyrug'i ishlamasa, `python3` dan foydalaning: `python3 -m http.server 8080`)

3.  Brauzerda `http://localhost:8080` manzilini oching.

### 2-usul: Flask Yordamida

Agar sizga moslashuvchan server kerak bo'lsa, Flask dan foydalanishingiz mumkin.

1.  Kerakli kutubxonani o'rnating:
    ```bash
    pip install -r requirements.txt
    ```

2.  Loyiha papkasida `server.py` nomli fayl yarating va unga quyidagi kodni joylashtiring:

    ```python
    from flask import Flask, send_from_directory
    import os

    # Ilova papkasini statik manzil sifatida belgilash
    app = Flask(__name__, static_folder='.', static_url_path='')

    @app.route('/')
    def index():
        """index.html faylini ochib beradi"""
        return send_from_directory('.', 'index.html')

    @app.route('/<path:path>')
    def static_files(path):
        """Boshqa statik fayllarni (tsx, css, va hokazo) ochib beradi"""
        return send_from_directory('.', path)

    if __name__ == '__main__':
        # Ishlab chiqarish (production) uchun Gunicorn kabi WSGI serverdan foydalanish tavsiya etiladi.
        # Masalan: gunicorn --bind 0.0.0.0:8080 server:app
        app.run(host='0.0.0.0', port=8080)

    ```
3.  Serverni ishga tushiring:
    ```bash
    python server.py
    ```
4.  Brauzerda `http://localhost:8080` manzilini oching.
