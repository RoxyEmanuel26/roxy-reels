# LAPORAN AUDIT SEO MENDALAM: MISSAV-J
**Domain:** `https://www.missav-j.com`  
**Tanggal Audit:** 31 Oktober 2026  
**Status Search Console:** 85 Klik (3 Bulan), 601 Tayangan, **154.021 Halaman TIDAK Diindeks**, Hanya **3.413 Halaman Diindeks** (~2.1% Indexation Rate).

---

## 1. Arsitektur, Framework & Mode Rendering

* **Platform Hosting:** Cloudflare Pages + Cloudflare Pages Functions (Edge Workers di `functions/[[catchall]].js`).
* **Framework:** Vanilla JavaScript SPA (ES Modules modular: `app.js`, `feed.js`, `player.js`, `api.js`, `ui.js`) + Cloudflare Workers SSR / Tag Injection.
* **Mode Rendering per Jenis Halaman:**
  * **Halaman Watch (`/{lang}/watch/{slug}-{id}`):** **Hybrid Edge SSR**. Edge Worker memotong request crawler (`Googlebot`, social bots), mengambil metadata video dari API upstream (`server.apijav.com`), lalu menyuntikkan `<title>`, `<meta description>`, tag OpenGraph, Schema JSON-LD `VideoObject`, dan `<h1>` + `<p>` + `<iframe>` ke dalam HTML awal.
  * **Halaman Beranda (`/{lang}/`):** **Thin Shell Hybrid**. Worker hanya menyuntikkan 1 H1 dan 1 paragraf teks pembuka. **DAFTAR VIDEO / VIDEO GRID SAMA SEKALI TIDAK ADA DI HTML AWAL (0 Link Video)**. Seluruh kartu video dirender 100% di browser via client-side JavaScript (`feed.js`).
  * **Halaman Kategori & Studio (`/{lang}/category?name=...`, `/{lang}/studio?name=...`):** **Thin Shell Hybrid**. Worker hanya menyuntikkan H1 dan meta deskripsi. **DAFTAR VIDEO 100% KOSONG PADA HTML AWAL**.
  * **Halaman Aktor (`/{lang}/actor?name=...`):** **Thin Shell Hybrid**. Daftar video kosong di HTML awal, baru muncul setelah JavaScript client berjalan.
  * **Halaman Hub Aktor (`/{lang}/actors`):** **SSR Directory**. Worker menyuntikkan daftar link `<a>` seluruh nama aktor dari `api/actors.json` ke dalam fallback HTML. Ini adalah satu-satunya halaman hub yang memiliki internal link crawlable di HTML awal.
* **Temuan Kritis Rendering:**
  1. **Googlebot & Crawler melihat Halaman Kosong (Zero Outbound Video Links) di Halaman Listing & Beranda:** Karena kartu video dirender via client-side JS (`feed.js`), Googlebot yang merayapi HTML awal tidak menemukan satupun tautan `<a href="/en/watch/...">` di homepage maupun halaman kategori/studio. Googlebot terpaksa mengandalkan 100% sitemap XML.
  2. **Bifurcated Cloaking Risk & Kebutaan AI Bot (`serveHumanShell`):** Pada baris 779 `functions/[[catchall]].js`:
     ```javascript
     if (isCacheableRoute && !isKnownCrawler) {
       return serveHumanShell(context, url.origin);
     }
     ```
     Jika request bukan berasal dari User-Agent yang cocok dengan `SEARCH_CRAWLER_REGEX` (`Googlebot`, `bingbot`, dll.), server menyajikan `serveHumanShell` (HTML mentah kosong tanpa judul, tanpa deskripsi, tanpa schema).
     **Dampaknya:** Crawler AI modern (seperti `GPTBot`, `PerplexityBot`, `ClaudeBot`, `ChatGPT-User`) dan tool inspeksi headless browser pihak ketiga mendapatkan halaman kosong melompong.

---

## 2. Daftar Route & Pola URL

| Route / Halaman | Pola URL | Mode Rendering | Status Crawlability |
| :--- | :--- | :--- | :--- |
| **Root Domain** | `/` | 301 (Bot) / 302 (User) | Dialihkan ke `/{lang}/` |
| **Beranda** | `/{lang}/` (contoh: `/en/`) | Thin SSR + CSR Feed | Ada H1, **0 link video di HTML awal** |
| **Halaman Video (Canonical)** | `/{lang}/watch/{slug}-{id}` | Full Edge SSR | Metadata lengkap, tapi **0 link related videos di HTML awal** |
| **Halaman Video (Legacy ID)**| `/{lang}/watch/{id}` | 301 Redirect | Dialihkan ke canonical slug |
| **Kategori** | `/{lang}/category?name={Name}` | Thin SSR + CSR Grid | Meta OK, **0 link video di HTML awal** |
| **Aktor / Profil** | `/{lang}/actor?name={Name}` | Thin SSR + CSR Grid | Meta OK, **0 link video di HTML awal** |
| **Studio** | `/{lang}/studio?name={Name}` | Thin SSR + CSR Grid | Meta OK, **0 link video di HTML awal** |
| **Direktori Aktor** | `/{lang}/actors` | Full Hub SSR | Memiliki daftar link `<a>` crawlable |
| **Direktori Kategori** | `/{lang}/categories` | Pure CSR | Grid kategori dirender via client JS |
| **Direktori Studio** | `/{lang}/studios` | Pure CSR | Grid studio dirender via client JS |
| **Trending & Recent** | `/{lang}/trending`, `/{lang}/recent` | Thin SSR + CSR Grid | Meta OK, **0 link video di HTML awal** |
| **Pencarian** | `/{lang}/search?q={Query}` | CSR | Diblokir di `robots.txt` (`Disallow: /search`) |
| **User Session** | `/{lang}/watch-later`, `/{lang}/history` | CSR | Diblokir di `robots.txt` |
| **Legal (DMCA, Terms, Privacy)** | Pop-up Modal JS (`#legal-modal-card`) | Modal CSR Only | **TIDAK ADA URL MANDIRI YANG BISA DI-CRAWL** |

---

## 3. Integrasi & Pengambilan Data API Pihak Ketiga

1. **Upstream API:** `https://server.apijav.com/wp-json/myvideo/v1`
   * Endpoint: `/posts/{id}`, `/posts?page=...&per_page=...`, `/categories`, `/tags`.
2. **Server-Side Edge Worker (`functions/[[catchall]].js`):**
   * Mengambil data video tunggal (`/posts/{id}`) saat bot merayapi halaman watch.
   * Dilengkapi timeout 10 detik dan fallback internal ke `/api/posts/{id}`.
   * Hasil di-cache di Cloudflare Cache API `caches.default` (`__og-metadata/posts/{id}`).
   * Memanggil Supabase REST API untuk mengambil judul terjemahan multi-bahasa jika bahasa yang diminta bukan bahasa Inggris.
3. **Client-Side SPA (`assets/js/api.js`):**
   * Memanggil proxy internal `/api/posts` (`functions/api/posts/[[id]].js`).
   * Dilengkapi cache in-memory `apiCache` dengan durasi 5 menit dan penanganan race-condition.
4. **Masalah Keandalan API:**
   * Jika upstream `server.apijav.com` mengalami throttling, rate-limiting, atau timeout, Edge Worker mengembalikan status **503 Service Unavailable** ("Video metadata temporarily unavailable"). Ini melindungi dari cache-poisoning tetapi dapat menyebabkan crawler mencatat halaman gagal rayap jika terjadi berulang.

---

## 4. Status Checklist Elemen SEO Teknis

| Elemen | Status | Analisis & Detail Masalah |
| :--- | :---: | :--- |
| **`robots.txt`** | **Bermasalah** | Blokir `/search`, `/history`, `/watch-later` sudah bagus. Mengizinkan `/api/image` dan `/img/` untuk thumbnail Googlebot. Namun belum ada deklarasi eksplisit untuk AI bots (`GPTBot`, `PerplexityBot`, dll.). |
| **`sitemap.xml`** | **KRITIS (Penyebab 154k Drop)** | `sitemap_index.xml` memuat lebih dari 125 file sitemap video terpisah dengan total **127.715 URL**. Terdapat **kerusakan karakter UTF-8 (mojibake)** pada video title & description (muncul tanda tanya `?" Sari? ?"`). Menyerahkan 120.000+ URL konten tipis secara massal ke situs berotoritas rendah membuat Google mengabaikan 97.9% halaman. |
| **`<title>` & Description** | **Bermasalah** | Format title: `[{CODE}] {Title} - MISSAV-J`. Meta description dibuat dari 1 template kalimat generik: *"Watch [CODE] [Title] starring [Actor] by [Studio] for free in premium HD streaming quality on MISSAV-J."* Pengulangan formula identik ini pada 120.000 halaman dideteksi Google sebagai **duplicate/spun boilerplate content**. |
| **Canonical Tag** | **Baik** | Terpasang self-referencing secara konsisten ke `https://www.missav-j.com/...` baik di SSR maupun client SPA. |
| **Hreflang Tags** | **KRITIS** | Setiap video dipasangi 13 tag `hreflang` (`zh-TW`, `zh-CN`, `en`, `ja`, `ko`, `ms`, `th`, `de`, `fr`, `vi`, `id`, `tl`, `pt`) dan `x-default`. Faktanya, **95%+ konten video di 12 bahasa lainnya tetap bertulisan bahasa Inggris**. Google mendeteksi ini sebagai halaman duplikat lintas-bahasa palsu (*"Duplicate, Google chose different canonical"*). |
| **OpenGraph & Twitter** | **Baik** | `og:title`, `og:description`, `og:image`, `og:type=video.other`, dan `twitter:card=summary_large_image` terpasang dengan URL proxy gambar domain sendiri (`/img/...`). |
| **Struktur Heading (H1)** | **Bermasalah** | Terdapat `<h1>` statis di dalam `#app-content .seo-fallback` dan satu lagi di dalam `<noscript>`. Pada halaman video SSR, injeksi mengganti fallback h1, namun struktur heading di halaman listing dan interaksi SPA rentan memiliki H1 ganda. |
| **Image `alt` Attributes** | **Bermasalah** | Pada HTML SSR halaman video, tidak ada elemen `<img>` yang ditampilkan (langsung `<iframe>`). Pada listing video, thumbnail hanya ada saat JavaScript client aktif. |
| **JSON-LD Schema** | **Bermasalah** | Markup `VideoObject`, `BreadcrumbList`, dan `WebSite` ada di kode. Namun di Google Search Console hanya **47 halaman video yang terindeks** dan hanya **1 video valid**. Google Video Crawler gagal memvalidasi video karena iframe embed pihak ketiga (`server.apijav.com`) tidak mengekspos media stream langsung atau memblokir bot Google Video. |
| **Halaman 404** | **KRITIS (Soft 404)** | Jika user/crawler membuka URL acak yang tidak ada (misal: `/en/halaman-palsu-123`), server mengembalikan file `index.html` dengan **HTTP Status 200 OK**! Ini adalah **Soft 404** yang sangat dihukum oleh Google Search Essentials. |
| **Konsistensi Domain & HTTPS** | **Baik** | Edge Worker memaksa 301 redirect dari apex `missav-j.com` ke canonical `www.missav-j.com` dan HTTPS enforced. |
| **Halaman Legal & Trust (E-E-A-T)** | **KRITIS** | Kebijakan DMCA, Kebijakan Privasi, dan Syarat Layanan hanya berupa pop-up modal JavaScript. **Tidak ada URL publik terpisah** seperti `/en/dmca`, `/en/privacy-policy`, `/en/terms` yang dapat diindeks oleh bot penilai kualitas Google. |

---

## 5. Navigasi & Pagination

* **Internal Links:** Menu sidebar memiliki tautan `<a href>`, namun kartu-kartu video di feed utama, kategori, studio, dan video terkait **tidak memiliki tautan `<a href>` pada HTML awal server**. Tautan video baru dibuat oleh JavaScript di browser.
* **Pagination:** **100% Client-Side Infinite Scroll**. Menggunakan `IntersectionObserver` di `feed.js`.
  * **Tidak ada tombol atau link pagination HTML** seperti `<a href="?page=2">`.
  * Googlebot **tidak mengeksekusi infinite scroll**. Akibatnya, Googlebot tidak pernah bisa menembus halaman 2, 3, 4, dst. melalui perayapan tautan alami situs.

---

## 6. Potensi Duplikat URL & Index Bloat

1. **Duplikasi Multi-Bahasa Eksponensial:** 13 bahasa x 120.000 video = **1.560.000 potensi URL**. Karena mayoritas video belum memiliki terjemahan lokal yang nyata, Google menganggap 1,5 juta halaman tersebut adalah salinan duplikat tanpa nilai tambah.
2. **Query String vs Clean Paths:** Penggunaan URL bertanda tanya untuk entitas utama (`/category?name=Uncensored` dan `/actor?name=...`) kurang ideal dibandingkan struktur path hierarkis bersih (`/category/uncensored/`), dan dapat memicu parameter crawling loop.
3. **Soft 404 Crawl Waste:** Crawler menghabiskan crawl budget pada URL rusak karena server selalu merespons 200 OK.

---

## 7. Masalah Performa & Core Web Vitals (CWV)

1. **Pembebanan Iframe Langsung di SSR:** Fallback crawler menyajikan `<iframe>` embed video tanpa facade thumbnail (tanpa mekanisme klik-untuk-putar), yang berpotensi membebani Largest Contentful Paint (LCP) dan rendering crawler.
2. **Render-Blocking Web Fonts:** `index.html` memuat Google Fonts (`Playfair Display` & `Roboto`) secara blocking di dalam `<head>`.
3. **Third-Party Ads:** Terdapat script pihak ketiga Adsterra (`benchform.org`, `biomanos.org`, `ahrefs.com`). *(Catatan: Sesuai aturan instruksi Anda, iklan pihak ketiga TIDAK AKAN disentuh atau diubah)*.

---

## 8. Ringkasan Temuan & Matriks Prioritas

| Prioritas | Masalah Utama | Dampak SEO | Estimasi Usaha | Solusi yang Direkomendasikan |
| :---: | :--- | :---: | :---: | :--- |
| **P0 (Kritis)** | **154k Halaman Tidak Diindeks & Index Bloat** | Sangat Tinggi | Sedang | Batasi sitemap hanya untuk video berkualitas/terverifikasi; jangan dump 120k URL mentah sekaligus. |
| **P0 (Kritis)** | **Zero Video Link di HTML Awal (Listing & Related)** | Sangat Tinggi | Sedang | Render daftar 12–24 kartu video `<a href>` di HTML awal server (SSR) pada homepage, kategori, aktor, dan related video di watch page. |
| **P0 (Kritis)** | **Soft 404 (Status 200 pada Halaman Tidak Ada)** | Sangat Tinggi | Rendah | Kembalikan HTTP Status 404 murni di `[[catchall]].js` untuk route/video yang tidak valid. |
| **P0 (Kritis)** | **Duplikasi Hreflang 13 Bahasa Tanpa Konten Lokal** | Sangat Tinggi | Sedang | Batasi sitemap & `hreflang` hanya untuk bahasa yang memiliki data terjemahan nyata (atau jadikan default canonical ke `/en/`). |
| **P1 (Tinggi)** | **Pagination 100% Infinite Scroll Tanpa `<a href>`** | Tinggi | Sedang | Tambahkan pagination link HTML bernomor `<a href="?page=2">` yang dapat dirayapi Googlebot. |
| **P1 (Tinggi)** | **Halaman Legal (DMCA, Privacy, Terms) Tanpa URL Publik** | Tinggi | Rendah | Buat route publik crawlable (`/en/dmca`, `/en/privacy-policy`, `/en/terms`) untuk membangun E-E-A-T. |
| **P1 (Tinggi)** | **AI Crawlers Blindness (`serveHumanShell` Blocking)** | Tinggi | Rendah | Izinkan bot AI (`GPTBot`, `PerplexityBot`, `ClaudeBot`, dll.) menerima SSR HTML penuh, bukan empty shell. |
| **P1 (Tinggi)** | **Kegagalan Google Video Indexing (Hanya 47/260 Valid)** | Tinggi | Sedang | Sempurnakan thumbnail proxy direct access dan perjelas tag metadata VideoObject agar ramah Googlebot Video. |
| **P2 (Sedang)** | **Karakter Corrupted / Mojibake di Sitemap XML** | Sedang | Rendah | Perbaiki sanitasi UTF-8 pada `generate_sitemap.js` agar tidak memunculkan tanda tanya `?"` atau karakter cacat. |
| **P2 (Sedang)** | **Heading H1 Ganda & Alt Text Gambar Hilang** | Sedang | Rendah | Rapikan H1 tunggal per halaman dan pastikan thumbnail SSR memiliki tag `<img>` dengan alt text deskriptif. |
| **P3 (Rendah)** | **Optimasi Font & Web Performance** | Sedang | Rendah | Pasang `font-display: swap` dan preload font kritis. |

---

## Kesimpulan FASE 0

Kelemahan terbesar website Anda saat ini bukanlah tampilan antarmuka (UI yang sudah sangat modern dan cepat), melainkan **ketiadaan jembatan HTML nyata untuk Googlebot (Internal Link Graph Terputus)** dan **banjir 120.000 URL duplikat tipis yang diserahkan ke Google tanpa konten unik**. Google menganggap 97.9% halaman tersebut sebagai sampah duplikat (*thin/duplicate content*).

Dengan memperbaiki 4 masalah P0 (SSR internal link rendering, perbaikan sitemap selektif, status 404 asli, dan normalisasi hreflang) serta membangun halaman E-E-A-T publik, Googlebot akan mulai mempercayai otoritas situs dan menaikkan indeksasi secara bertahap dan signifikan.

---
*Laporan Audit FASE 0 selesai. Menunggu persetujuan Anda sebelum memulai pekerjaan FASE 1.*
