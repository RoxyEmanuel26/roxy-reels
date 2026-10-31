# CHECKLIST_MANUAL.md — Panduan Operasional Manual Pemilik Situs

Dokumen ini berisi panduan tindakan manual yang **wajib dilakukan oleh pemilik situs** melalui dashboard mesin pencari dan analitik setelah deployment perubahan branch `seo-overhaul`.

---

## 📋 Langkah 1: Google Search Console (GSC) — Setup & Submit Sitemap

1. **Pastikan Property GSC Bertipe URL Prefix dengan WWW dan HTTPS**:
   - URL Property: `https://www.missav-j.com/` (Wajib persis dengan `https://` dan `www.`).
   - Jika saat ini Anda membuka property tanpa `www`, buat property baru untuk `https://www.missav-j.com/`.

2. **Kirim Ulang Sitemap Index**:
   - Masuk ke menu **Peta Situs (Sitemaps)** di sidebar kiri GSC.
   - Pada kolom *Tambahkan peta situs baru*, masukkan:
     ```text
     sitemap_index.xml
     ```
   - Klik **Kirim (Submit)**.
   - Status harus berubah menjadi `Sukses` (Success). Sitemap ini memuat rute beranda bahasa, halaman kepatuhan hukum, dan shard video.

---

## 🔍 Langkah 2: Audit Halaman di Laporan "Penyusunan Indeks" (Pages Report)

Berdasarkan tangkapan layar GSC Anda (154.021 halaman tidak diindeks):

1. **Buka Laporan Halaman (Pages)**:
   - Gulir ke tabel **Alasan halaman tidak diindeks**.
   - Anda akan melihat kategori berikut:
     - *Dikecualikan oleh tag 'noindex'*: Ini **NORMAL dan BAGUS**. Halaman paginasi (`page > 1`) sengaja diberi `noindex` agar Google fokus mengindeks video utama dan tidak membuang crawl budget.
     - *Halaman alternatif dengan tag kanonikal yang tepat*: Ini **NORMAL**. Google menghormati tag kanonikal yang sudah kita bersihkan dari query sorting/filtering.
     - *Ditemukan - saat ini belum diindeks (Crawled - currently not indexed)*: Ini adalah video yang sebelumnya dianggap konten tipis. Dengan pipeline Phase 5 kita, halaman ini akan berangsur diindeks seiring bot merayapi konten yang diperkaya.

2. **Validasi Perbaikan (Validate Fix)**:
   - Jika terdapat error struktural merah atau 404 dari URL lama, klik alasan tersebut lalu klik tombol **Validasi Perbaikan (Validate Fix)**.

---

## ⚡ Langkah 3: Minta Index Ulang Halaman Prioritas (URL Inspection)

Untuk memicu perayapan cepat pasca-deployment:

1. Di kolom pencarian paling atas GSC ("Periksa semua URL..."), masukkan URL berikut satu per satu:
   - `https://www.missav-j.com/`
   - `https://www.missav-j.com/en/`
   - `https://www.missav-j.com/en/trending`
   - `https://www.missav-j.com/en/category?name=Uncensored`
   - `https://www.missav-j.com/en/category?name=Drama`
   - `https://www.missav-j.com/en/studio?name=S1`
   - 3-5 URL video terpopuler yang baru saja dirilis.
2. Tunggu hasil inspeksi, lalu klik tombol **Uji URL Live (Test Live URL)**.
3. Setelah tanda centang hijau muncul, klik **Minta Pengindeksan (Request Indexing)**.

---

## 🌐 Langkah 4: Bing Webmaster Tools & IndexNow

Bing memberikan traffic organik yang signifikan untuk konten video dan hiburan Asia:

1. Buka [Bing Webmaster Tools](https://www.bing.com/webmasters) dan login menggunakan akun Microsoft/Google Anda.
2. Tambahkan situs `https://www.missav-j.com/` (bisa impor langsung dari GSC hanya dengan 1 klik).
3. Verifikasi file sudah terpasang:
   - File verifikasi IndexNow sudah kami buat di root situs: `https://www.missav-j.com/a1be0a661f577bbd2c3eb82350a10d97.txt`.
4. **Jalankan IndexNow Otomatis Kapan Saja**:
   - Di terminal server / lokal Anda, cukup jalankan perintah:
     ```bash
     npm run seo:indexnow
     ```
   - Skrip ini akan secara otomatis men-submit puluhan halaman pilar dan video ter-enrich ke API IndexNow (didukung oleh Bing, Yandex, Seznam, dan Naver) dengan respons langsung `202 Accepted`.

---

## 📊 Langkah 5: Pasang Pemantauan Analitik Bebas Penalti

Hindari memasang skrip analitik berat yang memblokir render utama. Gunakan salah satu opsi berikut:

1. **Cloudflare Web Analytics (Sangat Direkomendasikan)**:
   - Buka Cloudflare Dashboard -> **Analytics & Logs** -> **Web Analytics**.
   - Aktifkan dengan 1 klik tanpa perlu menyisipkan kode rumit, 100% aman privasi, dan 0ms overhead loading.
2. **Google Analytics 4 (GA4)**:
   - Jika menggunakan GA4, pastikan tag dimuat secara `async` dan diletakkan di akhir body atau via tag manager ringan agar tidak menurunkan skor Core Web Vitals.

---

## 📅 Langkah 6: Jadwal Pemantauan Mingguan (Weekly Routine)

Luangkan waktu 15 menit setiap hari Senin untuk mencatat metrik berikut di spreadsheet Anda:

| Metrik | Lokasi di GSC | Target Arah | Tindakan jika Turun |
|---|---|---|---|
| **Total Klik Penelusuran Web** | GSC -> Performa | Meningkat (Tren Naik) | Perbarui judul/thumbnail video teratas |
| **Total Tayangan (Impressions)** | GSC -> Performa | Meningkat tajam | Tambah video baru di kategori trending |
| **CTR Rata-rata** | GSC -> Performa | Stabil di 10% - 15% | Optimalkan judul meta description (AI Enrich) |
| **Posisi Rata-rata** | GSC -> Performa | Mendekati < 15 | Tambah internal link antar video/aktor |
| **Total Halaman Diindeks** | GSC -> Penyusunan Indeks | Meningkat secara bertahap | Periksa apakah sitemap diproses berkala |

---

## 🚀 Langkah 7: Strategi Lonjakan Traffic Non-Google (Off-Page Syndication)

Mesin pencari membutuhkan sinyal popularitas (user signals) untuk menaikkan peringkat ke halaman 1. Untuk situs video hiburan:

1. **Otomatisasi Cuplikan di X / Twitter**:
   - Buat akun X bertema kurasi JAV.
   - Posting cuplikan 10-15 detik beresolusi tajam dengan teks kode video (misal: `SSIS-999`) dan sertakan link kanonikal `https://www.missav-j.com/en/watch/...`.
   - Gunakan hashtag populer: `#JAV #MissAV #JapaneseAdultVideo #ActressName`.
2. **Sindikasi Channel & Grup Telegram**:
   - Buat channel Telegram resmi MISSAV-J.
   - Bagikan thumbnail resolusi tinggi beserta tombol inline link *Watch Full HD* yang mengarah langsung ke domain Anda.
   - Telegram memiliki retensi pengguna tertinggi di niche ini dan menyumbang traffic direct berkelanjutan.
3. **Komunitas Forum & Reddit**:
   - Bagikan kompilasi rekomendasi bulanan (misal: "Top 10 Best S1 Releases this Month") di subforum atau komunitas hiburan dengan menyertakan link sumber ke halaman kategori hub MISSAV-J.
