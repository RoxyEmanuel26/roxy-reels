# Prompt Perbaikan SEO Total: Website Video Dewasa

=== MULAI PROMPT ===

## Peran

Kamu adalah Senior Technical SEO Engineer sekaligus full-stack developer. Tugasmu adalah memperbaiki SEO website di project ini dari dasar sampai kuat dan aman untuk jangka panjang, **tanpa merusak fitur yang sudah berjalan**.

## Data Website

* **Domain:** `https://www.missav-j.com`
* **Bahasa utama konten:** Inggris (`English` / `en`) — *didukung multi-bahasa i18n untuk 13 bahasa (fallback ke `en`)*
* **Target audiens/negara:** Global (Geo-targeted: Internasional)
* **Hosting:** Cloudflare Pages (didukung Cloudflare Pages Functions / Edge Workers)
* **Framework:** Vanilla JavaScript (Static SPA / ES Modules) + Cloudflare Pages Functions (Edge SSR & SEO Injection)

## Konteks

- Website berisi **video dewasa**. Datanya diambil dari **API pihak ketiga** yang juga bisa dipakai situs lain, sehingga ada risiko **duplicate content** (judul, deskripsi, dan thumbnail sama dengan situs lain).
- Website sudah online lebih dari 10 bulan dengan **hampir nol pengunjung dari Google**. Penyebab yang mungkin: halaman tidak ter-index, konten dirender hanya di sisi client (JavaScript), sitemap atau robots salah, metadata duplikat, link internal tidak bisa di-crawl, atau halaman terlalu tipis.
- Website dibuat dengan AI coding agent, jadi mungkin ada praktik SEO dasar yang terlewat.
- Saya memakai **Gemini API versi gratis dengan batas harian**. Jadi Gemini **tidak boleh** dipanggil saat pengunjung membuka halaman, dan tidak boleh dipanggil untuk ribuan video sekaligus.
- Tujuan: halaman ter-index dengan baik, bisa ranking untuk kata kunci spesifik (long-tail), dan tidak kena penalti Google.

## Aturan Utama (wajib dipatuhi)

1. **Jangan merusak fitur yang ada.** Sebelum mulai, buat branch baru (misalnya `seo-overhaul`) dan commit kecil per langkah. Jalankan build dan test setelah tiap fase.
2. **Dilarang teknik black-hat:** doorway pages, redirect menyesatkan, teks tersembunyi, keyword stuffing, review atau rating palsu, cloaking, dan konten massal tanpa nilai.
3. **Metadata harus jujur.** Judul dan deskripsi tidak boleh menyesatkan atau mengklaim hal yang tidak ada di video.
4. **Structured data hanya boleh menandai konten yang benar-benar tampil di halaman.**
5. **Jangan hapus atau ubah URL yang sudah ter-index** tanpa redirect 301 ke padanan terbaiknya.
6. **Jangan menaruh API key di kode.** Semua kunci lewat environment variable.
7. Jangan berasumsi. Kalau ada keputusan berisiko (hapus halaman, ubah struktur URL, ganti framework), **berhenti dan tanya saya dulu**.
8. Setelah setiap fase, buat laporan singkat: apa yang diubah, file apa saja, cara memverifikasi, dan apa yang masih tersisa.

---

## FASE 0: Audit (hanya membaca, belum mengubah apa pun)

Pelajari seluruh codebase lalu buat file `SEO_AUDIT.md` berisi:

1. Framework, versi, dan mode rendering tiap jenis halaman (SSR / SSG / ISR / CSR). **Cek paling penting:** apakah judul, deskripsi, daftar video, dan teks utama sudah ada di **HTML awal** (bukan baru muncul setelah JavaScript jalan)?
2. Daftar semua route: beranda, halaman video, kategori, pencarian, dan lainnya, beserta pola URL-nya.
3. Cara data video diambil dari API pihak ketiga (di server atau di browser, ada cache atau tidak, ada rate limit atau tidak).
4. Status tiap item berikut (ada / tidak ada / salah): `robots.txt`, `sitemap.xml`, tag `<title>` dan `meta description` per halaman, canonical, Open Graph / Twitter Card, struktur heading (H1 harus satu per halaman), `alt` gambar, structured data JSON-LD, halaman 404 (harus mengembalikan status 404 sungguhan), HTTPS dan konsistensi www / non-www, halaman legal.
5. Apakah navigasi dan pagination memakai `<a href>` yang bisa di-crawl, atau hanya `onClick` JavaScript?
6. Potensi duplikat URL: trailing slash, parameter query, halaman pencarian yang ter-index.
7. Masalah performa: ukuran gambar, embed video yang langsung dimuat, font, bundle JavaScript, layout shift.
8. Daftar temuan **diurutkan berdasarkan dampak** (Kritis / Tinggi / Sedang / Rendah) dengan perkiraan usaha perbaikannya.

Setelah selesai, tampilkan ringkasan temuan dan **tunggu persetujuan saya** sebelum lanjut ke Fase 1.

---

## FASE 1: Fondasi Crawling dan Indexing

Perbaiki secara berurutan sesuai temuan audit:

1. **Rendering:** pastikan konten utama dirender di server (SSR/SSG/ISR) sehingga ada di HTML awal. Kalau saat ini CSR murni, ini prioritas nomor satu.
2. **robots.txt:** izinkan crawling halaman publik, blokir halaman yang tidak perlu (hasil pencarian internal, admin, API), dan cantumkan lokasi sitemap.
3. **sitemap.xml dinamis:**
   - Gunakan sitemap index dan pecah per jenis halaman (video, kategori, statis). Maksimal 50.000 URL per file.
   - `lastmod` harus tanggal update yang **sebenarnya**, bukan tanggal build.
   - Hanya masukkan halaman yang boleh di-index (lihat Fase 5).
4. **Video sitemap** terpisah dengan data per video (judul, deskripsi, thumbnail, durasi, URL halaman, dan `embed/player` jika ada).
5. **Canonical** self-referencing di setiap halaman. Pastikan satu konten hanya punya satu URL kanonik.
6. **URL bersih:** pakai slug yang deskriptif (`/watch/judul-video-12345`), bukan hanya ID. Kalau struktur URL berubah, pasang redirect 301 dari URL lama.
7. **Status HTTP benar:** halaman yang tidak ada mengembalikan 404 (bukan 200 dengan pesan "tidak ditemukan"). Redirect permanen memakai 301.
8. **Satu versi domain:** paksa HTTPS dan satu pilihan www / non-www.
9. **Link internal bisa di-crawl:** semua navigasi, kategori, dan pagination memakai `<a href>`. Pagination jangan hanya "infinite scroll" tanpa URL halaman.
10. Halaman hasil pencarian internal dan URL berparameter: beri `noindex` atau canonical ke halaman induk.

**Laporan Fase 1 harus menyertakan** cara memverifikasi: perintah `curl` untuk melihat HTML awal, dan hasil `npm run build`.

---

## FASE 2: Metadata dan Struktur On-Page

1. **Title** unik per halaman, 50 sampai 60 karakter, kata kunci utama di depan, diakhiri nama situs. Contoh pola: `{Judul Video} - {Kategori} | {NamaSitus}`.
2. **Meta description** unik per halaman, 120 sampai 155 karakter, jujur, dan mengajak klik.
3. **Open Graph dan Twitter Card:** `og:title`, `og:description`, `og:image` (thumbnail), `og:type` (`video.other` untuk halaman video), `og:url`.
4. **Heading:** tepat satu H1 per halaman, H2/H3 berurutan, tidak ada heading kosong atau dekoratif.
5. **Gambar:** `alt` deskriptif, `width` dan `height` eksplisit (mencegah layout shift), format modern (WebP/AVIF) jika memungkinkan.
6. **Breadcrumb** tampil di halaman (Beranda > Kategori > Video) dengan markup yang benar.
7. `<html lang="...">` sesuai bahasa konten.
8. Buat halaman 404 yang membantu (link ke beranda dan kategori populer).

---

## FASE 3: Structured Data (JSON-LD)

Pasang JSON-LD yang valid dan sesuai isi halaman:

- **WebSite** dan **Organization** di beranda.
- **BreadcrumbList** di semua halaman bertingkat.
- **VideoObject** di halaman video. Wajib: `name`, `thumbnailUrl`, `uploadDate`. Disarankan: `description`, `duration` (format ISO 8601), `embedUrl` atau `contentUrl`. **Jangan mengarang** data yang tidak ada dari API.
- **ItemList** di halaman kategori.

Buatkan helper atau komponen reusable supaya tidak menulis JSON-LD manual di tiap halaman. Beri tahu saya cara memvalidasi lewat Rich Results Test.

---

## FASE 4: Performa dan Core Web Vitals

1. **Facade untuk video embed:** tampilkan thumbnail dulu, dan muat player hanya setelah diklik. Ini biasanya perbaikan LCP terbesar.
2. Lazy-load gambar di bawah layar, prioritaskan gambar utama (`priority` / `fetchpriority="high"`).
3. Optimasi font (self-host atau `font-display: swap`, kurangi variasi bobot).
4. Kurangi JavaScript yang tidak perlu (code splitting, hapus dependency tak terpakai).
5. Cache data API di server (revalidate berkala) supaya halaman cepat dan hemat panggilan API.
6. Pasang header cache yang tepat untuk aset statis.
7. Jalankan Lighthouse (mobile) sebelum dan sesudah, lalu catat skor LCP, CLS, dan INP di laporan.

---

## FASE 5: Menangani Duplicate Content dan Nilai Unik Halaman

**Prinsip:** judul yang sekadar ditulis ulang belum cukup. Setiap halaman yang di-index harus punya nilai tambah dibanding situs lain yang memakai API yang sama.

### 5A. Halaman hub (target ranking utama)

Buat halaman yang lebih kuat dari sekadar video tunggal:
- Halaman **kategori / tema / tag** dengan **teks pengantar unik** (2 sampai 3 paragraf, ditulis sekali, bukan per request) dan daftar video yang rapi.
- Halaman kurasi seperti **"Terbaru"**, **"Sedang Tren"**, **"Paling Banyak Ditonton"** (pakai data tayang di situs ini sendiri, bukan dari API).
- Di halaman video, tampilkan **video terkait** dan link ke kategori/tag-nya (membangun internal linking).

### 5B. Halaman kepercayaan

Buat halaman Tentang Kami, Kontak, Kebijakan Privasi, Syarat Layanan, dan DMCA/Pengaduan Konten, lalu tautkan di footer.

### 5C. Pipeline pengayaan konten dengan Gemini (hemat kuota gratis)

Buat sistem **background job**, bukan panggilan saat halaman dibuka:

1. **Antrean dan penyimpanan:** simpan hasil di database yang sudah ada (atau SQLite / file JSON jika belum ada). Kolom minimal: `video_id`, `source_hash`, `seo_title`, `meta_description`, `summary`, `highlights`, `tags`, `faq`, `status` (`pending` / `enriched` / `failed` / `rejected`), `model`, `generated_at`, `attempts`.
2. **Jalankan lewat skrip terjadwal** (misalnya `npm run seo:enrich` yang dipanggil cron, GitHub Actions, atau Vercel Cron, sesuaikan dengan hosting).
3. **Kontrol kuota lewat environment variable:** `GEMINI_API_KEY`, `GEMINI_MODEL`, `GEMINI_DAILY_REQUEST_LIMIT` (isi sekitar 80% dari batas resmi), `GEMINI_BATCH_SIZE`. **Cek dokumentasi resmi Gemini untuk batas gratis terbaru, jangan berasumsi angka.**
4. **Hemat request:** proses **beberapa video dalam satu request** (batch 5 sampai 10 video, output berupa array JSON) karena batas gratis dihitung per request.
5. **Prioritas pemrosesan:** video paling banyak dilihat dan terbaru dulu. Jangan proses video lama yang tidak pernah dikunjungi.
6. **Tangani error:** retry dengan exponential backoff untuk error 429, berhenti otomatis kalau kuota harian habis, lanjutkan di jadwal berikutnya. Proses harus **idempotent** (aman dijalankan ulang, tidak memproses dua kali).
7. **Format output JSON yang ketat**, per video:
   - `seo_title` (maks 60 karakter)
   - `meta_description` (120 sampai 155 karakter)
   - `summary` (2 sampai 3 kalimat ringkasan unik)
   - `highlights` (3 sampai 5 poin)
   - `tags` (3 sampai 6 tag relevan)
   - `faq` (2 sampai 3 pasang tanya-jawab)
8. **Instruksi ke Gemini (di dalam prompt pipeline):** gunakan **hanya** informasi dari metadata yang diberikan; dilarang mengarang fakta, nama, atau klaim; dilarang clickbait; tulis dalam bahasa situs; jangan menyalin kalimat asli secara mentah; nada natural, bukan template berulang.
9. **Kontrol kualitas otomatis sebelum disimpan:** validasi JSON dan panjang karakter, tolak jika terlalu mirip dengan teks asli (hitung kemiripan sederhana), tolak jika ada pola kalimat yang berulang di banyak video, dan tandai `rejected` agar diulang.
10. **Fallback tanpa AI:** kalau kuota habis atau gagal, halaman tetap tampil dengan metadata dasar dari API, tetapi statusnya belum layak di-index (lihat 5D).

### 5D. Gerbang indexing berdasarkan kualitas

- Halaman video dengan status `enriched` → `index, follow` dan masuk sitemap.
- Halaman video yang belum diperkaya → `noindex, follow` dan **tidak** masuk sitemap, sampai pengayaan selesai.
- **Urutan penting:** selesaikan halaman hub (5A) dan proses pengayaan untuk batch pertama (misalnya 200 video teratas) **sebelum** menerapkan `noindex` ke halaman tipis, supaya situs tidak kosong dari hasil pencarian.
- Buat satu skrip laporan: jumlah halaman per status (indexable vs noindex), supaya saya bisa memantau progres.

---

## FASE 6: Verifikasi Akhir

Jalankan dan laporkan hasilnya:

1. `npm run build` tanpa error.
2. Cek HTML awal beberapa halaman dengan `curl` (title, description, H1, canonical, JSON-LD harus sudah ada).
3. Pastikan `robots.txt` dan semua sitemap bisa diakses dan isinya benar.
4. Tidak ada link internal rusak (404) dan tidak ada rantai redirect.
5. Lighthouse mobile: bandingkan sebelum dan sesudah.
6. Ringkasan di `CHANGELOG_SEO.md`: seluruh perubahan, file yang disentuh, dan hal yang sengaja tidak dikerjakan beserta alasannya.

---

## Tugas Manual untuk Pemilik (kamu buatkan file `CHECKLIST_MANUAL.md`)

Hal-hal yang tidak bisa dikerjakan agent, tuliskan langkahnya sejelas mungkin:

1. Verifikasi domain di **Google Search Console**, lalu kirim sitemap index.
2. Periksa laporan **Pages** di Search Console: berapa halaman ter-index, dan apa alasan halaman yang tidak ter-index.
3. Gunakan **URL Inspection** untuk beberapa halaman penting dan minta indexing.
4. Daftar di **Bing Webmaster Tools** dan pertimbangkan IndexNow (agent boleh membantu mengimplementasikannya).
5. Pasang analitik (GA4 atau Plausible) untuk melihat sumber traffic.
6. Jadwal pemantauan mingguan: impresi, klik, halaman ter-index, dan kata kunci yang mulai muncul.
7. Dua sampai tiga strategi di luar Google yang realistis untuk situs hiburan (misalnya potongan video di media sosial dengan link ke situs).

---

## Cara Kerja

- Kerjakan **satu fase per giliran**. Di akhir tiap fase, berhenti, tampilkan laporan, dan tunggu saya berkata "lanjut".
- Kalau ada informasi yang kurang, ajukan **maksimal 3 pertanyaan** sekaligus, jangan satu per satu.
- Prioritaskan perbaikan yang berdampak besar dulu. Jangan menghabiskan waktu pada optimasi kecil sebelum masalah crawling dan indexing selesai.
- Jujur soal batasan: kalau sebuah perbaikan tidak menjamin kenaikan traffic, katakan apa adanya.

**Mulai sekarang dengan FASE 0.**
