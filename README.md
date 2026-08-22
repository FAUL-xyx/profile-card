# Digital Business Card — Premium Interactive Prototype

Kartu nama digital satu halaman dengan efek 3D ringan, gaya *dark luxury*
(charcoal + champagne gold), lengkap dengan dashboard editor sehingga
pemiliknya bisa mengubah semua isi kartu **tanpa menyentuh kode**.

## Menjalankan project

Project ini murni HTML/CSS/JS statis — tidak butuh build step atau server
backend untuk mencobanya.

1. Buka folder ini di VS Code (atau editor lain).
2. Jalankan lewat local server ringan, misalnya ekstensi **Live Server**,
   atau dari terminal:
   ```bash
   npx serve .
   # atau
   python3 -m http.server 8080
   ```
3. Buka `http://localhost:8080/index.html` untuk kartu publik, dan
   `http://localhost:8080/admin.html` untuk dashboard editor.

> Membuka `index.html` langsung lewat `file://` juga bisa untuk sekadar
> melihat tampilan, tapi beberapa fitur browser (Web Share API, clipboard)
> bekerja lebih baik lewat `http://localhost`.

Tidak ada dependency untuk di-install — semua library eksternal (GSAP,
QRCode.js, Sortable.js) dimuat lewat CDN langsung di `<script>` tag.

## Cara mengedit / menambah profil

1. Buka `admin.html`.
2. Saat pertama kali dibuka, Anda akan diminta membuat **PIN 4–6 digit**
   untuk mengunci dashboard di perangkat ini (lihat catatan keamanan di
   bawah).
3. Gunakan sidebar untuk berpindah antar bagian:
   - **Profile** — nama, username, jabatan, bio, foto, logo, email, WhatsApp, status.
   - **Links** — tambah/edit/hapus tautan sosial & custom, aktifkan/nonaktifkan,
     dan seret ikon `⠿` untuk mengubah urutan.
   - **Gaming** — tambah profil game (Mobile Legends, Free Fire, Roblox, dst)
     dengan username/ID/server.
   - **Appearance** — pilih preset tema atau atur warna, radius, shadow,
     intensitas efek 3D, dan animasi sendiri.
   - **Analytics** — jumlah views, klik per link, dan share.
   - **Settings** — ganti PIN, export/import data (JSON), atau reset ke default.
4. Panel **Live Preview** di sisi kanan (atau tombol "Preview" di mobile)
   memperbarui diri secara otomatis setiap kali Anda mengubah sesuatu —
   tidak perlu reload manual.
5. Tombol **Share** di kartu publik membuka lembar share dengan Copy Link,
   Download QR Code, WhatsApp/Telegram, dan Web Share API bawaan browser.

## Struktur project

```
/project
│
├── index.html          → kartu publik (hero card + daftar link)
├── admin.html           → dashboard editor
│
├── css/
│   ├── style.css        → design tokens & semua style kartu publik
│   └── admin.css         → style dashboard (gate, sidebar, form, preview)
│
├── js/
│   ├── storage.js        → model data + semua baca/tulis localStorage
│   ├── cards.js           → fungsi render kartu (dipakai halaman publik & preview)
│   ├── editor.js           → logika dashboard (form, drag&drop, tema, analytics)
│   ├── app.js               → logika halaman publik (render, tilt, share, tracking)
│   ├── animation.js           → efek tilt 3D + animasi intro (GSAP)
│   └── share.js                → share sheet: copy link, QR, WhatsApp/Telegram
│
├── assets/
│   ├── icons/            (kosong — ikon memakai inline SVG di cards.js)
│   ├── images/
│   └── backgrounds/
│
└── README.md
```

## Bagaimana data disimpan (prototype)

Semua data (profil, daftar link, tema, statistik) disimpan di
**localStorage** browser dengan key `dbc_data_v1`, dikelola lewat satu
lapisan `DB` object di `js/storage.js`. Karena hanya satu lapisan ini yang
menyentuh `localStorage` langsung, memindahkan project ke backend
sungguhan nantinya cukup dengan mengganti isi dua method:

- `StorageEngine.load()` → ganti jadi `fetch('/api/profile')`
- `StorageEngine.persist()` → ganti jadi `fetch('/api/profile', { method: 'PUT', ... })`

Bagian lain (`cards.js`, `app.js`, `editor.js`) tidak perlu diubah karena
semuanya memanggil `DB.get()` / `DB.updateProfile()` / dst, bukan
`localStorage` secara langsung.

### Bagian yang butuh backend sungguhan sebelum dipakai publik

- **Autentikasi admin** — PIN saat ini hanya disimpan di `localStorage`
  perangkat (di-encode base64, **bukan** hashing yang aman) dan hanya
  berfungsi sebagai kunci lokal, bukan sistem login. Untuk produksi:
  gunakan backend auth dengan password ter-hash (bcrypt/argon2), sesi
  server-side, dan bukan sekadar `sessionStorage`.
- **URL per-username** (`domain.com/username`) — di prototype ini
  direpresentasikan lewat query string (`index.html?u=username`) karena
  tidak ada server routing. Di produksi, gunakan routing backend/CDN agar
  setiap pengguna punya URL bersih.
- **Analytics** — saat ini dihitung di browser masing-masing pengunjung
  (localStorage), sehingga tidak agregat lintas perangkat. Perlu endpoint
  backend untuk mencatat view/klik secara terpusat.
- **Upload foto/logo** — form saat ini menerima URL gambar, bukan upload
  file. Produksi biasanya butuh storage (S3, Cloudinary, dst).

## Fitur yang sudah berfungsi penuh di prototype ini

- Kartu utama dengan efek 3D tilt mengikuti pointer/sentuhan (rotateX/Y,
  parallax antar layer, moving highlight), ringan di mobile.
- Kartu link dengan hover/press animation, ikon, username, deskripsi.
- Animasi intro stagger saat halaman dibuka pertama kali (background →
  logo → nama → kartu utama → kartu-kartu sosial).
- Dashboard penuh: profil, link (CRUD + toggle + drag&drop), gaming,
  tema/appearance (6 preset + kustomisasi warna/radius/shadow/3D/animasi),
  analytics, settings (ganti PIN, export/import JSON, reset).
- Live preview real-time tanpa reload.
- Share sheet: copy link, QR code (generate + download), share ke
  WhatsApp/Telegram, dan Web Share API native di perangkat yang mendukung.
- Sepenuhnya responsive (mobile/tablet/desktop) dan menghormati
  `prefers-reduced-motion` (juga ada saklar manual di Appearance → Animasi).

Selamat mencoba — silakan sesuaikan warna, teks, dan link contoh di
`js/storage.js` (`defaultData()`) sebagai starting point Anda sendiri.
