# Adsterra Publisher - Panduan Ad Units & Code Snippets (Edisi Lengkap & Sangat Mendalam)
Sumber Koleksi: https://help-publishers.adsterra.com/en/collections/2274770-ad-units-and-code-snippets

Dokumen ini merupakan hasil studi ulang yang **sangat mendalam, detail, halaman demi halaman** dari seluruh artikel dalam koleksi dokumentasi Ad Units and Code Snippets Adsterra. Tidak ada satu pun detail, peringatan, atau instruksi teknis yang dilewatkan.

---

## 1. Memilih Unit Iklan yang Tepat (Selecting the Right Ad Unit)
**URL Asli:** `https://help-publishers.adsterra.com/en/articles/5210727-selecting-the-right-ad-unit`

Ad Unit adalah format iklan spesifik yang ditempatkan di website. Format ini tidak menentukan *kategori* iklan yang akan dilihat oleh pengunjung, melainkan *bentuk penyajiannya*. Ad Unit dibagi menjadi dua kategori besar: **Rich Media Ads** dan **Static Ads**. Menurut Adsterra, **Popunder, Social Bar, dan Native Banners umumnya memberikan hasil dan keuntungan (profit) tertinggi.**

### A. Rich Media Ads (Iklan Kaya Media)
Rich media dapat mencakup video, audio, atau elemen lain yang mendorong pengunjung berinteraksi. Berbeda dengan display ads yang hanya berupa gambar statis, rich media menawarkan lebih banyak cara untuk memikat pengunjung dan meningkatkan Click-Through Rate (CTR).

1. **Social Bar**
   - Format paling menarik dan interaktif. Bentuknya dapat berupa *in-page push* (notifikasi dalam web), balon obrolan (chat bubbles), spanduk kustom, ikon animasi, hingga kuis kecil.
   - **Sangat Cocok Untuk:** Traffic dari iOS, Android, Desktop, maupun Mobile-Web.
   - **Model Harga (Pricing Models):** 75% kampanye berjalan pada CPA (Cost Per Action), 20% pada CPM (Cost Per Mille), dan 5% pada CPC (Cost Per Click).
   - **Tuning/Penyesuaian:** Anda wajib menghubungi tim Adsterra jika ingin memindahkan posisi iklan (misal ke pojok kiri atas/kanan bawah) atau jika ingin mengatur *frekuensi* (seberapa sering pengunjung melihat iklan tersebut).

2. **Popunder**
   - Iklan layar penuh (full-page) yang tampak seperti landing page (halaman penawaran), yang akan terbuka secara otomatis di tab atau jendela baru **di belakang** (behind) jendela browser utama pengguna.
   - **Sangat Cocok Untuk:** Website dengan pengunjung yang tidak suka konsentrasinya terhadap konten utama terganggu, mereka cenderung hanya bisa fokus pada satu tab pada satu waktu.
   - **Model Harga (Pricing Models):** 50% CPM / 50% CPA.
   - **Tuning/Penyesuaian:** Tim Adsterra bisa membantu mengatur *frekuensi* kemunculan Popunder, serta mengatur apakah Popunder terbuka dengan klik sembarang (any click) atau hanya ketika pengguna mengklik elemen spesifik tertentu.

3. **Smartlink (Direct Link)**
   - Sebuah URL biasa yang akan membawa pengguna yang mengkliknya langsung ke halaman penawaran (offer page). Sistem algoritmik Adsterra yang akan memilih penawaran *terbaik* untuk setiap pengunjung berdasarkan lokasi (GEO), Sistem Operasi (OS), perangkat, dan target lainnya.
   - **Sangat Cocok Untuk:** Publisher yang tidak punya website sendiri, monetisasi traffic dari media sosial (FB, WA, YT, dll), atau website yang tidak punya cukup ruang lagi untuk dipasangi banner/iklan visual.
   - **Model Harga (Pricing Models):** 50% CPM / 50% CPA.

### B. Static Ads (Iklan Statis)
Termasuk Banner dalam berbagai ukuran dan Native Banner. Bersifat tidak intrusif dan bisa ditempatkan di halaman mana saja, namun sangat rentan terkena *banner blindness* (pengunjung secara tak sadar mengabaikan banner karena sudah terbiasa melihat pola tersebut).

1. **Native Banner**
   - Blok iklan statis di mana gambar dan *headline* (judul tulisan) didesain menyatu dan menyerupai bagian dari konten website Anda. Iklan ini responsif, dan performanya sangat bergantung pada penempatan yang strategis.
   - **Sangat Cocok Untuk:** Website artikel dan blog yang memiliki konten unggulan.
   - **Model Harga (Pricing Models):** Campuran antara kampanye CPM, CPA, dan CPC.
   - **Tuning/Penyesuaian:** Anda bisa mengubah tata letak (layout), ukuran font, dan warna melalui menu "Websites" di Dashboard Adsterra. Hubungi tim dukungan (support) jika Anda ingin penyesuaian untuk tampilan mobile secara spesifik atau jika ingin memodifikasi CSS-nya.

2. **Banner / Display Banner**
   - Gambar statis (dengan atau tanpa teks) yang dapat Anda selipkan di mana saja.
   - **PENTING:** Iklan ini **Tidak Responsif** dan **Tidak akan menyesuaikan ukurannya secara otomatis** untuk layar HP. Namun, Adsterra menyediakan ukuran banner yang pas untuk layar kecil. (Ada teknik CSS terpisah untuk menangani hal ini di artikel bagian akhir).
   - **Model Harga:** Murni CPA.
   - **Ukuran yang Tersedia:** 160x300, 160x600, 300x250, 320x50, 728x90, 468x60.
   - **Saran Penempatan:** Letakkan banner di lokasi dengan traffic paling padat di halaman web Anda, termasuk bagian paling atas (front/header), bawah (footer), atau samping (sidebar).

---

## 2. Menambahkan Iklan ke Website HTML Statis (Adding Ads to a Static HTML Site)
**URL Asli:** `https://help-publishers.adsterra.com/en/articles/5210780-adding-ads-to-a-static-html-site`

Script iklan Adsterra berbasis JavaScript, karenanya ia dapat berjalan di hampir semua website.

1. **Popunder**
   - Posisi Kode: Letakkan *code snippet* Popunder **Tepat Sebelum tag Penutup `</head>`** di HTML.
   - ❗️ **Peringatan Pemasangan Popunder:** Jangan pernah menggunakan lebih dari satu kode Popunder di halaman yang sama. Ini akan menyebabkan *conflict of codes* (kode saling tabrakan/rusak). Jika Anda ingin memperbanyak jumlah klik/iklan, hubungi Adsterra agar mereka yang meningkatkan *frequency settings* dari sisi server.

2. **Social Bar**
   - Posisi Kode: Letakkan script Social Bar **Tepat Di Atas tag Penutup `</body>`** di HTML.
   - ❗️ **Peringatan Pemasangan Social Bar:** Mengubah-ubah posisi kode snippet Social Bar di dalam struktur HTML Anda **tidak akan** mengubah posisi visual iklan di layar pengunjung. Anda harus meminta Customer Care untuk merubah lokasinya. Memasang beberapa kode Social Bar sekaligus juga tidak akan menambah jumlah iklan, melainkan berpotensi merusak script.

3. **Smartlink pada Teks/Gambar**
   - Anda menggunakan tag HTML bawaan `<a>` untuk membuat hyperlink. 
   - Contoh Teks: `<a href="url_smartlink_anda">Klik Di Sini</a>`
   - Contoh Gambar: `<a href="url_smartlink_anda"><img src="gambar.jpg"></a>`
   - Contoh Tombol: `<button onclick="window.location.href='url_smartlink_anda';">Klik Saya</button>`

4. **Native Banner**
   - Posisi Kode: Bebas ditempatkan di bagian mana pun di dalam area `<body>` halaman.
   - Tampilan iklan akan mengikuti *style* (CSS) bawaan halaman secara otomatis.
   - ❗️ **Peringatan Pemasangan Native Banner:** Menggunakan *kode Native Banner yang sama* lebih dari satu kali dalam satu halaman akan memicu bentrok kode (conflict). Jika Anda butuh menampilkan banyak Native Banner, **Anda harus menghubungi Tim Support Adsterra dan meminta hingga 2 kode unik tambahan.**

5. **Static Banner**
   - Posisi Kode: Bebas ditempatkan di mana saja di dalam area `<body>`.
   - Adsterra mengingatkan bahwa format spanduk melintang (horizontal banners) terlihat jauh lebih bagus jika dipasang di bagian atas halaman (header), sedangkan spanduk tegak (vertical banners) khusus untuk kolom sidebar. Iklan berbentuk kotak/persegi panjang (rectangle ads) cocok di manapun.
   
6. 💡 **Informasi Tambahan Seputar ads.txt**
   - Adsterra secara standar **tidak menyediakan file ads.txt** bagi penggunanya karena pengiklan mereka (advertisers) tidak mewajibkannya. Jika platform lain atau Anda sendiri memerlukannya demi validasi eksternal, Anda **harus menghubungi Support** agar mereka menerbitkan detail otoritas *ads.txt* khusus akun Anda.

---

## 3. Instalasi Iklan Adsterra ke WordPress (Installing Adsterra Ads to WordPress)
**URL Asli:** `https://help-publishers.adsterra.com/en/articles/5210819-installing-adsterra-ads-to-wordpress`

Ada dua cara untuk memasang iklan secara global di WordPress (tampil di semua halaman):

1. **Cara 1: Mengedit Tema Secara Langsung (Theme Editor)**
   - Sangat dianjurkan untuk kode **Popunder** dan **Social Bar**.
   - Masuk ke Admin Dashboard WordPress -> Appearance (Tampilan) -> Theme Editor.
   - Cari file `header.php` (Theme Header) di sisi kanan.
   - Tempel script Popunder sebelum tag `</head>`.
   - Cari file `footer.php` (Theme Footer). Tempel script Social Bar sebelum tag `</body>`.
   - *Peringatan:* Saat Anda berganti Tema WordPress, semua script ini akan hilang dan Anda harus mengulanginya.

2. **Cara 2: Menggunakan Widget**
   - Lebih visual, sangat dianjurkan untuk **Native Banners** dan **Static Banners**.
   - Buka Appearance -> Widgets.
   - Gunakan blok "Custom HTML" (Atau blok "Text" jika WP Anda versi di bawah 4.8.1).
   - Tarik (drag) blok tersebut ke area Header, Sidebar, atau Footer yang tersedia di tema Anda lalu tempel kode bannernya.

3. **Cara Khusus Halaman Tertentu (Per-Page/Per-Post)**
   - Jika iklan hanya ingin tampil di satu artikel spesifik, gunakan blok "Custom HTML" di editor artikel (Gutenberg) saat Anda menulis postingan tersebut. Biasanya di bawah judul atau di sela-sela antar-paragraf.
   - *Peringatan Bentrok Kode (Conflict):* Pastikan jika Anda sudah menaruh Popunder secara global di Theme, JANGAN lagi menaruh script Popunder/Social Bar di dalam badan artikel Anda. Kode ganda ini akan mematikan kedua iklan.

---

## 4. Menambahkan Iklan Adsterra Menggunakan Elementor (Adding Adsterra Ads with Elementor)
**URL Asli:** `https://help-publishers.adsterra.com/en/articles/5210912-adding-adsterra-ads-with-elementor`

Elementor adalah page builder sistem seret (drag-and-drop). Anda dapat meletakkan script iklan dengan menambahkan elemen (widget) HTML ke area yang Anda kehendaki di Elementor.

❗️ **Peringatan Pemasangan Elementor Krusial:** Jika Anda berencana memasang **Banner**, Anda **TIDAK BOLEH** menggunakan kode standar. Anda wajib menghubungi tim Customer Care / Account Manager Anda dan meminta secara spesifik: **"JS Async version of the Banner Code"**. Memaksakan script sync biasa akan merusak load halaman Elementor Anda.

---

## 5. Meletakkan Iklan Adsterra di Blogspot (Putting Adsterra Ads to Blogspot)
**URL Asli:** `https://help-publishers.adsterra.com/en/articles/5210920-putting-adsterra-ads-to-blogspot`

Di platform Blogger/Blogspot, disarankan menaruh kode iklan menggunakan **Gadget** alih-alih mengedit XML Tema.

1. Buka dashboard Blogger, pilih menu "Layout" (Tata Letak).
2. Klik tombol "+ Add a Gadget".
3. Pilih Gadget "HTML/JavaScript".
4. Biarkan kolom Title kosong (atau beri penanda), lalu tempel script iklan Adsterra di kotak Content. Save.
5. Anda bisa menggeser (drag and drop) posisi Gadget ini ke header, sidebar, atau footer secara visual.
6. *Peringatan Tema:* Jangan mencoba menempel skrip JS Adsterra langsung ke mode Editor Tema HTML Blogger, karena Blogger memiliki susunan spesifik-tag yang sensitif, terkadang menyebabkannya tidak kompatibel dengan script HTML/JS reguler dari Adsterra. Gunakan sistem Gadget di atas.

---

## 6. Menambahkan Iklan Adsterra ke Website Berbasis PHP (Adding Adsterra ads to a PHP-based website)
**URL Asli:** `https://help-publishers.adsterra.com/en/articles/6028124-adding-adsterra-ads-to-a-php-based-website`

PHP adalah bahasa sisi-server. Website berbasis PHP umumnya sangat modular (dipecah-pecah file-nya agar bisa disisipkan/include berulang-ulang tanpa menulis ulang), contoh minimalnya: `index.php`, `header.php`, dan `footer.php`.

**Aturan Penempatan Modul PHP:**
1. Letakkan kode **Popunder** di dalam file `header.php`, tepat sebelum tag penutup `</head>`.
2. Letakkan kode **Social Bar** di dalam file `footer.php`, tepat sebelum tag penutup `</body>`.
3. Letakkan kode **Banner/Native Banner** langsung ke dalam area body HTML (biasanya di `index.php` atau file template artikel spesifik).
4. ❗️ **Aturan Pembatasan Maksimal (SANGAT PENTING):** Adsterra mewajibkan penggunanya membatasi jumlah penempatan banner. Anda hanya diperbolehkan **memasang tidak lebih dari 4 iklan banner per halaman (no more than four banner ads per page)**. Melebihi jumlah ini akan merusak performa lalu lintas trafik Anda, menghasilkan "Banner Blindness", dan membuat pengunjung kapok. Selalu letakkan iklan dengan pertimbangan demi menjaga kenyamanan pengguna (user experience).

**Uji Coba Eksekusi Lokal (Built-in Server):**
Adsterra memberikan panduan tambahan bahwa Anda bisa melihat pratinjau (preview) website PHP dan iklannya secara offline di komputer dengan command prompt sebelum dinaikkan ke hosting dengan command line (jika PHP sudah terinstall): `php -S localhost:8000`.

---

## 7. Menggunakan Iklan Adsterra dengan Cloudflare (Using Adsterra Ads with Cloudflare)
**URL Asli:** `https://help-publishers.adsterra.com/en/articles/5213852-using-adsterra-ads-with-cloudflare`

💡 **INI ADALAH BAGIAN PALING KRITIKAL TERKAIT PERMASALAHAN REVENUE CLOUDFLARE ANDA.**

Cloudflare memiliki fitur pengoptimalan kecepatan yang disebut **"RocketLoader"**. Secara diam-diam, RocketLoader memodifikasi cara kerja *semua* file JavaScript di halaman Anda untuk dieksekusi terlambat secara asinkron.
Bagi Adsterra, **perubahan injeksi dari RocketLoader ini menyebabkan script iklan Adsterra bekerja secara salah, macet, atau bahkan tidak berfungsi (mati total). Akibatnya fatal: Impresi (tayangan) tidak tercatat di dashboard, dan Revenue Anda hancur total!**

**Bagaimana RocketLoader Merusak Script Anda:**
Script normal Adsterra:
`<script type="text/javascript" src="https://jsc.adsterra.com/blablabla"></script>`

Script yang sudah diganggu/diubah RocketLoader (di belakang layar browser pengguna) menjadi:
`<script type="rocketlazyloadscript" src="https://jsc.adsterra.com/blablabla"></script>` -> Akibatnya browser gagal membaca tipe script dan iklan gagal dimuat sepenuhnya.

**CARA MEMPERBAIKI MASALAH CLOUDFLARE INI SECARA MUTLAK:**
Untuk mencegah RocketLoader Cloudflare menyentuh dan menyisipkan teks ekstra ke dalam kode iklan Adsterra, Anda **DIWAJIBKAN menambahkan atribut khusus `data-cfasync="false"` pada kode tag skrip iklan, tepat sebelum properti `type`.**

**Kode Yang Benar untuk Cloudflare:**
`<script data-cfasync="false" type="text/javascript" src="https://jsc.adsterra.com/blablabla"></script>`

Dengan begini, Cloudflare akan mengabaikan script iklan tersebut, dan iklan akan bisa memanggil server Adsterra tanpa dihambat, menyelamatkan performa impresi Anda.

---

## 8. Apakah Iklan Adsterra Bebas dari Malware? Cara Perlindungan dari Malvertising
**URL Asli:** `https://help-publishers.adsterra.com/en/articles/5213865-are-ads-in-adsterra-malware-free-how-does-adsterra-protect-publishers-from-malvertising`

Adsterra memiliki komitmen ketat bahwa tim *in-house* mereka secara manual dan algoritmik memverifikasi **semua kampanye** dari pengiklan (advertisers) untuk mematuhi kepatuhan penuh terhadap Syarat dan Ketentuan, serta memastikan bebas dari konten berbahaya, malware, atau virus.

Namun, tidak ada sistem yang sempurna. Komunitas publisher adalah mata dan telinga sistem ini. Jika ada iklan *nakal* (Malvertising) yang menembus filter jaringan:
1. Publisher wajib **Segera** menghubungi Customer Care.
2. Sediakan informasi detektif berikut kepada Adsterra:
   - Nama penawaran atau perusahaan dari iklan berbahaya tersebut.
   - Salin URL Landing Page iklannya (jika aman untuk di-klik/disalin dari address bar).
   - Info Lingkungan Anda: OS (Windows/Android/Mac), Browser (Chrome/Firefox/Safari).
   - Format Unit Iklan-nya (Apakah itu Popunder? Native? Social Bar?).
   - Lokasi GEO (Negara tempat Anda mengaksesnya).
3. Adsterra akan melakukan *eskalasi* laporan ini secara prioritas, mencari kampanye tersebut dalam jaringan, dan menyingkirkannya (*remove*) secepat mungkin.

---

## 9. Menampilkan Banner Berbeda untuk Perangkat Seluler (Mobile) dan Desktop (Displaying Different Banners on Mobile and Desktop)
**URL Asli:** `https://help-publishers.adsterra.com/en/articles/9571958-displaying-different-banners-on-mobile-and-desktop`

Seperti yang ditekankan di artikel pertama, **Static Banners (Banner Statis) Adsterra Sifatnya TIDAK RESPONSITF**. Sebuah banner desktop raksasa berukuran 728x90 akan meluber keluar batas jika dibuka di layar smartphone yang kecil, merusak desain web Anda (User Experience yang buruk akan memukul mundur pengunjung).

**Satu-satunya Solusi Resmi:** 
Karena banner tidak menyesuaikan otomatis, Anda harus menaruh **2 kode banner yang berbeda secara fisik di halaman**, dan menggunakan "Trik CSS" untuk menyembunyikan ukuran yang salah bergantung ukuran layar.

**Kombinasi Paling Optimal Menurut Rekomendasi Adsterra:**
- **Banner Ukuran 728x90** (Hanya tampil di Desktop).
- **Banner Ukuran 320x50** (Hanya tampil di Mobile).

**Langkah Eksekusi Teknikalnya:**
1. Tambahkan kode CSS berikut tepat di mana Anda ingin banner dipasang (namun **JANGAN** pernah memasukkan elemen pembungkus DIV ini di dalam `<head>`), ini harus berada di `<body>`.

```html
<!-- KODE CSS PENYEMBUNYI -->
<style type="text/css">
.mobileShow { display: none;}
/* Jika resolusi layar HP kecil antara 320px hingga 480px, TAMPILKAN yang versi Mobile */
@media only screen
and (min-device-width : 320px)
and (max-device-width : 480px){ .mobileShow { display: inline;}}

.mobileHide { display: inline;}
/* Jika resolusi layar HP kecil antara 320px hingga 480px, SEMBUNYIKAN yang versi Desktop */
@media only screen
and (min-device-width : 320px)
and (max-device-width : 480px){ .mobileHide { display: none;}}
</style>

<!-- PENEMPATAN KODE BANNER (MASUKKAN SCRIPT ADSTERRA DI SINI) -->

<!-- Pembungkus Khusus Mobile (Menampilkan Banner 320x50) -->
<div class="mobileShow"> 
[PASTE KODE SNIPPET BANNER 320x50 ANDA DI SINI]
</div>

<!-- Pembungkus Khusus Desktop (Menampilkan Banner 728x90) -->
<div class="mobileHide"> 
[PASTE KODE SNIPPET BANNER 728x90 ANDA DI SINI]
</div>
```

**Cara Mengeceknya:**
Gunakan *Chrome Dev Tools* (Tekan F12 -> Toggle Device Toolbar) untuk merubah-rubah resolusi layar secara simulatif. Jika Anda menggunakan resolusi di bawah 480px, banner 320x50 harusnya muncul dan banner 728 lenyap (disembunyikan oleh CSS). Dan sebaliknya pada tampilan PC.
