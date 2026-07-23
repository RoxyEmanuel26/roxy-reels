# Adsterra Publisher - Panduan Ad Units & Code Snippets
Sumber: https://help-publishers.adsterra.com/en/collections/2274770-ad-units-and-code-snippets

Dokumen ini berisi catatan mendalam dan sangat terperinci mengenai jenis-jenis unit iklan (Ad Units) di Adsterra serta panduan instalasi kode snippet di berbagai platform. Semua detail teknis penting telah dirangkum ke dalam panduan ini tanpa ada yang terlewatkan.

---

## 1. Memilih Unit Iklan yang Tepat (Selecting the Right Ad Unit)

Ad Unit adalah format iklan spesifik yang ditempatkan di website Anda. Format ini tidak menentukan *kategori/isi* iklannya, melainkan *bentuk* penyajiannya. Unit iklan dibagi menjadi dua kategori utama: **Rich Media Ads** dan **Static Ads**. Popunder, Social Bar, dan Native Banners umumnya memberikan hasil dan keuntungan (profit) tertinggi.

### A. Rich Media Ads (Iklan Interaktif)
Memiliki elemen video, audio, atau animasi yang mendorong pengunjung berinteraksi (CTR tinggi).
1. **Social Bar**:
   - Bentuknya paling menarik dan interaktif (bisa berupa in-page push, balon chat, ikon, kuis, dll).
   - **Sangat Cocok Untuk**: Semua jenis trafik (iOS, Android, Desktop) karena bentuknya menyerupai notifikasi sistem.
   - **Model Harga**: 75% CPA, 20% CPM, 5% CPC.
   - **Kustomisasi**: Anda bisa menghubungi tim Adsterra untuk mengatur posisi (misal pojok kiri atas/kanan bawah) atau frekuensi kemunculannya.
2. **Popunder**:
   - Iklan layar penuh yang otomatis terbuka di tab baru *di belakang* jendela browser utama.
   - **Sangat Cocok Untuk**: Website dengan audiens yang fokus (tidak suka terganggu dari konten utama).
   - **Model Harga**: 50% CPM / 50% CPA.
   - **Kustomisasi**: Hubungi tim untuk mengatur frekuensi atau pemicu kliknya.
3. **Smartlink**:
   - URL biasa yang mengirim pengguna ke halaman penawaran (offer) terbaik yang dipilih otomatis oleh sistem.
   - **Model Harga**: 50% CPM / 50% CPA.
   - **Sangat Cocok Untuk**: Trafik sosial (FB, WA, YT), publisher tanpa website, atau web dengan ruang kosong terbatas.

### B. Static Ads (Iklan Statis)
Iklan tidak intrusif seperti banner statis. Bisa rentan terhadap *banner blindness* (diabaikan pengunjung).
1. **Native Banner**:
   - Teks dan gambar menyatu secara natural dengan konten web. Layout bersifat responsif (otomatis menyesuaikan layar).
   - **Sangat Cocok Untuk**: Blog atau website artikel.
   - **Model Harga**: Campuran CPM, CPA, CPC.
   - **Kustomisasi**: Anda bisa mengubah ukuran dan warna teks lewat menu Websites. Untuk mengubah CSS, hubungi tim dukungan.
2. **Static Banner**:
   - Banner gambar standar (horizontal atau vertikal). **Tidak responsif** (tidak otomatis menyesuaikan dengan layar HP).
   - **Model Harga**: CPA.
   - **Ukuran**: 160x300, 160x600, 300x250, 320x50, 728x90, 468x60.
   - Disarankan meletakkan banner horizontal di header/footer, dan vertikal di sidebar.

---

## 2. Menambahkan Iklan ke Website HTML Statis (Adding Ads to a Static HTML Site)

Panduan teknis meletakkan kode JavaScript (JS) Adsterra pada source code HTML website Anda.

- **Popunder**: Kode harus ditempatkan tepat **sebelum tag penutup `</head>`**.
  *Peringatan*: Jangan menggunakan lebih dari 1 kode Popunder di satu halaman untuk menghindari konflik. Minta pengaturan frekuensi khusus jika ingin meningkatkan iklan.
- **Social Bar**: Kode diletakkan tepat **di atas tag penutup `</body>`**.
  *Peringatan*: Mengubah posisi kode Social Bar di dalam HTML tidak akan mengubah posisi melayangnya di layar. Jangan menaruh lebih dari 1 kode.
- **Native Banner & Static Banner**: Bebas ditempatkan di mana saja di dalam `<body>`.
  *Peringatan Native Banner*: Jika ingin menaruh Native Banner beberapa kali dalam 1 halaman, Anda harus me-*request* maksimal 2 kode tambahan ke tim Support untuk mencegah bentrok/konflik.
- **Smartlink**: Cukup bungkus dengan tag `<a>`, misal `<a href="link-adsterra">Klik di sini</a>` atau masukkan ke dalam `<img>` dan `<button>`.

*(Catatan Krusial)*: Adsterra **tidak menyediakan file ads.txt** karena klien pengiklan mereka tidak membutuhkannya. Jika Anda tetap ingin memasangnya untuk formalitas, Anda harus menghubungi Customer Care.

---

## 3. Instalasi pada WordPress, Elementor & Blogspot

- **WordPress Manual (Theme Editor)**: Buka "Appearance" > "Theme Editor". Tempel Popunder di `header.php` dan Social Bar di `footer.php`. Untuk banner, gunakan Widget "Custom HTML".
- **WordPress per Postingan**: Pasang menggunakan blok atau widget "Custom HTML" di badan artikel.
- **Elementor**: Selalu minta kode Static Banner versi **JS Async** ke tim Adsterra jika Anda menggunakan Elementor agar performanya optimal.
- **Blogspot (Blogger)**: Gunakan gadget "HTML/JavaScript" untuk menambahkan kode. Anda bisa menempatkannya di sidebar, header, atau footer. Jangan menempel di file tema bawaan Blogger karena bisa rusak oleh tag unik Blogger.

---

## 4. Instalasi pada Website Berbasis PHP (PHP-based Website)

Jika struktur website Anda dinamis (seperti modular menggunakan PHP):
- Letakkan kode Popunder di dalam file `header.php` sebelum `</head>`.
- Letakkan kode Social Bar di dalam file `footer.php` sebelum `</body>`.
- Tempatkan Native/Static Banner di `index.php` atau file spesifik yang men-render konten utama.
- Batas aman: Maksimal **4 iklan banner per halaman** untuk menghindari *banner blindness* atau memberatkan pengunjung.

---

## 5. Penggunaan Adsterra dengan Cloudflare (SANGAT PENTING!)

Jika web Anda (seperti Roxy Reels) menggunakan Cloudflare, fitur **RocketLoader** dari Cloudflare dapat merusak skrip JavaScript Adsterra karena mencoba menunda (defer) pemuatannya. Hal ini sangat fatal dan menyebabkan metrik tayangan (impressions) turun atau tidak terhitung.

**Cara Memperbaiki Konflik Cloudflare:**
Untuk mencegah RocketLoader merusak kode JS Adsterra, Anda **Wajib Menambahkan Atribut** `data-cfasync="false"` pada kode tag skrip iklan, tepat sebelum properti `type` atau `src`.
*Contoh sebelum:* `<script type='text/javascript' src='...'>`
*Contoh sesudah:* `<script data-cfasync="false" type='text/javascript' src='...'>`

*(Inilah salah satu alasan potensial kenapa revenue dan CPM Anda turun drastis di Roxy Reels setelah pindah ke Cloudflare!)*

---

## 6. Apakah Iklan Bebas Malware?

Adsterra memiliki sistem *filtering* ketat untuk mencegah malware atau konten iklan berbahaya (malvertising). Jika Anda menemukan iklan mencurigakan di web Anda yang lolos dari filter mereka:
1. Catat nama perusahaan (offer) yang muncul di iklan.
2. Jika berani/aman, klik iklannya dan salin URL landing page-nya.
3. Sebutkan OS, browser, format iklan, dan negara tempat iklan dilihat, lalu laporkan segera ke tim Adsterra via Live Chat agar iklan di-*banned* secepatnya.

---

## 7. Menampilkan Banner Berbeda di HP dan Desktop

Static Banner sifatnya **TIDAK responsif**. Banner Desktop (misal 728x90) akan meluber dan jelek jika dipaksa tampil di Mobile. Sebagai solusinya, jangan gunakan JS atau script rumit. Adsterra menyarankan trik CSS CSS Media Query sederhana.

Kombinasi optimal:
- **728x90** (untuk layar desktop > 480px)
- **320x50** (untuk layar hp < 480px)

```html
<!-- Contoh Trik CSS Resmi Adsterra -->
<style type="text/css">
.mobileShow { display: none;}
@media only screen
and (min-device-width : 320px)
and (max-device-width : 480px){ .mobileShow { display: inline;}}

.mobileHide { display: inline;}
@media only screen
and (min-device-width : 320px)
and (max-device-width : 480px){ .mobileHide { display: none;}}
</style>

<div class="mobileShow"> 
<!-- PASTE KODE BANNER MOBILE 320X50 DI SINI -->
</div>
<div class="mobileHide"> 
<!-- PASTE KODE BANNER DESKTOP 728X90 DI SINI -->
</div>
```
*(Ingat: Jangan memasukkan kode banner di dalam tag `<head>` saat melakukan trik pembungkus `<div>` di atas.)*
