const fs = require('fs');
const path = require('path');

const baseUrl = 'https://www.missav-j.com';
const apiBaseUrl = 'https://server.apijav.com/wp-json/myvideo/v1/posts';
const perPage = 1000;
const concurrencyLimit = 10;

const LANGS = ['zh-TW', 'zh-CN', 'en', 'ja', 'ko', 'ms', 'th', 'de', 'fr', 'vi', 'id', 'fil', 'pt'];
const VIDEO_LANGS = ['en'];

const STATIC_ROUTES = [
    { path: '', priority: '1.00', changefreq: 'daily' },
    { path: 'trending', priority: '0.90', changefreq: 'daily' },
    { path: 'recent', priority: '0.90', changefreq: 'daily' },
    { path: 'actors', priority: '0.80', changefreq: 'weekly' },
    { path: 'categories', priority: '0.80', changefreq: 'weekly' },
    { path: 'studios', priority: '0.80', changefreq: 'weekly' },
    { path: 'popular-actors', priority: '0.70', changefreq: 'weekly' }
];

const STUDIOS = [
    'S1 NO.1 STYLE', 'MOODYZ', 'PRESTIGE', 'Soft On Demand',
    'Idea Pocket', 'FALENO', 'MUTEKI', 'Fitch',
    'OPPAL', 'Kawaii*', 'KMP', 'Attackers', 'Premium', 'Other'
];

// load env
let supabaseUrl = '';
let supabaseKey = '';
try {
    const envContent = fs.readFileSync(path.join(__dirname, '.env'), 'utf-8');
    envContent.split('\n').forEach(line => {
        line = line.trim();
        if (line && !line.startsWith('#') && line.includes('=')) {
            const parts = line.split('=');
            const key = parts[0].trim();
            const val = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
            if (key === 'SUPABASE_URL') supabaseUrl = val;
            if (key === 'SUPABASE_KEY') supabaseKey = val;
        }
    });
} catch (e) {
    // env file missing or unreadable
}

const sitemapsDir = path.join(__dirname, 'sitemaps');
if (!fs.existsSync(sitemapsDir)) {
    fs.mkdirSync(sitemapsDir, { recursive: true });
}

function escXml(text) {
    return text.replace(/&/g, '&amp;')
               .replace(/</g, '&lt;')
               .replace(/>/g, '&gt;')
               .replace(/"/g, '&quot;')
               .replace(/'/g, '&apos;');
}

function slugify(text) {
    if (!text) return '';
    let slug = text.toLowerCase().trim();
    slug = slug.replace(/[\s\-_]+/g, '-');
    slug = slug.replace(/[^\p{L}\p{N}\-]/gu, ''); // unicode aware regex
    slug = slug.replace(/-+/g, '-');
    slug = slug.replace(/^-+|-+$/g, '');
    if (slug.length > 100) slug = slug.substring(0, 100).replace(/-+$/, '');
    return slug;
}

function getUrlsetOpen() {
    return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n';
}

function getTodayStr() {
    return new Date().toISOString().split('T')[0];
}

async function getBatchTranslationsFromDb(ids) {
    if (ids.length === 0 || !supabaseUrl || !supabaseKey) return {};
    
    const results = {};
    const batchSize = 500;
    
    for (let i = 0; i < ids.length; i += batchSize) {
        const chunk = ids.slice(i, i + batchSize);
        const idsStr = chunk.join(',');
        const url = `${supabaseUrl}/rest/v1/translations?id=in.(${idsStr})&select=id,translations`;
        try {
            const res = await fetch(url, {
                headers: {
                    'apikey': supabaseKey,
                    'Authorization': `Bearer ${supabaseKey}`
                }
            });
            if (res.ok) {
                const data = await res.json();
                for (const item of data) {
                    results[item.id] = item.translations;
                }
            }
        } catch (e) {
            console.log(`       [!] Gagal mengambil batch translasi dari Supabase: ${e.message}`);
        }
    }
    return results;
}

async function translateTitle(title, lang) {
    if (lang === 'en') return title;
    const domains = ['translate.googleapis.com', 'translate.google.com', 'translate.google.co.id'];
    const encodedTitle = encodeURIComponent(title);
    
    for (const domain of domains) {
        const url = `https://${domain}/translate_a/single?client=gtx&sl=auto&tl=${lang}&dt=t&q=${encodedTitle}`;
        try {
            const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
            if (res.ok) {
                const data = await res.json();
                if (data && data[0]) {
                    let translated = '';
                    for (const seg of data[0]) {
                        if (seg[0]) translated += seg[0];
                    }
                    if (translated) return translated.trim();
                }
            }
        } catch (e) {}
    }
    return title;
}

async function saveTranslationToDb(id, translations) {
    if (!supabaseUrl || !supabaseKey) return;
    const url = `${supabaseUrl}/rest/v1/translations`;
    try {
        await fetch(url, {
            method: 'POST',
            headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`,
                'Prefer': 'resolution=merge-duplicates',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ id, translations })
        });
    } catch (e) {
        console.log(`       [!] Gagal menyimpan translasi ke Supabase untuk ID ${id} : ${e.message}`);
    }
}

async function pMap(array, asyncFn, limit) {
    const results = [];
    const executing = new Set();
    for (const item of array) {
        const p = Promise.resolve().then(() => asyncFn(item));
        results.push(p);
        executing.add(p);
        const clean = p.finally(() => executing.delete(p));
        if (executing.size >= limit) {
            await Promise.race(executing);
        }
    }
    return Promise.all(results);
}

async function main() {
    console.log("+---------------------------------------------------------+");
    console.log("|   MISSAV-J Sitemap Generator v3.0 (NODE.JS CONCURRENT)  |");
    console.log("|   FULL CRAWL - 10X LEBIH CEPAT                          |");
    console.log(`|   Website: ${baseUrl}                    |`);
    console.log(`|   Waktu:   ${getTodayStr()}                                |`);
    console.log("+---------------------------------------------------------+\n");

    const stateFile = path.join(__dirname, 'sitemap_state.json');
    let state = {
        completedLangPages: [],
        videoSitemapFiles: [],
        grandTotalVideos: 0,
        grandTotalRequests: 0
    };

    if (fs.existsSync(stateFile)) {
        console.log("[INFO] Ditemukan file state sebelumnya. Melanjutkan proses...");
        try {
            state = JSON.parse(fs.readFileSync(stateFile, 'utf-8'));
        } catch (e) {}
    }

    function saveState() {
        fs.writeFileSync(stateFile, JSON.stringify(state, null, 2), 'utf-8');
    }

    let ACTORS = [];
    let CATEGORIES = [];
    try {
        ACTORS = JSON.parse(fs.readFileSync(path.join(__dirname, 'api', 'actors.json'), 'utf-8'));
        console.log(`[DATA] Memuat data aktor dari: actors.json -> ${ACTORS.length} dimuat`);
    } catch (e) { console.log("       -> [!] File actors.json tidak ditemukan!"); }
    
    try {
        CATEGORIES = JSON.parse(fs.readFileSync(path.join(__dirname, 'api', 'categories.json'), 'utf-8'));
        console.log(`[DATA] Memuat data kategori dari: categories.json -> ${CATEGORIES.length} dimuat`);
    } catch (e) { console.log("       -> [!] File categories.json tidak ditemukan!"); }
    console.log("");

    // STATIC
    console.log("[STEP 1/5] Membuat sitemap_pages.xml...");
    let sbStatic = getUrlsetOpen();
    for (const route of STATIC_ROUTES) {
        const canonicalUrl = `${baseUrl}/en` + (route.path ? `/${route.path}` : '');
        sbStatic += `  <url>\n    <loc>${escXml(canonicalUrl)}</loc>\n    <lastmod>${getTodayStr()}</lastmod>\n    <changefreq>${route.changefreq}</changefreq>\n    <priority>${route.priority}</priority>\n`;
        for (const lang of LANGS) {
            const u = `${baseUrl}/${lang}` + (route.path ? `/${route.path}` : '');
            sbStatic += `    <xhtml:link rel="alternate" hreflang="${lang}" href="${escXml(u)}" />\n`;
        }
        sbStatic += `    <xhtml:link rel="alternate" hreflang="x-default" href="${escXml(canonicalUrl)}" />\n  </url>\n`;
    }
    sbStatic += "</urlset>";
    fs.writeFileSync(path.join(sitemapsDir, 'sitemap_pages.xml'), sbStatic);
    
    // ACTORS
    console.log("[STEP 2/5] Membuat sitemap_actors...");
    const actorsPerFile = 2450;
    const actorFileNames = [];
    if (ACTORS.length > 0) {
        const totalChunks = Math.ceil(ACTORS.length / actorsPerFile);
        for (let chunk = 0; chunk < totalChunks; chunk++) {
            const batch = ACTORS.slice(chunk * actorsPerFile, (chunk + 1) * actorsPerFile);
            const fileName = `sitemap_actors_${chunk + 1}.xml`;
            actorFileNames.push(fileName);
            let sb = getUrlsetOpen();
            for (const actor of batch) {
                if (!actor) continue;
                const encoded = encodeURIComponent(actor);
                const canonicalUrl = `${baseUrl}/en/actor?name=${encoded}`;
                sb += `  <url>\n    <loc>${escXml(canonicalUrl)}</loc>\n    <lastmod>${getTodayStr()}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.60</priority>\n`;
                for (const lang of LANGS) {
                    sb += `    <xhtml:link rel="alternate" hreflang="${lang}" href="${escXml(`${baseUrl}/${lang}/actor?name=${encoded}`)}" />\n`;
                }
                sb += `    <xhtml:link rel="alternate" hreflang="x-default" href="${escXml(canonicalUrl)}" />\n  </url>\n`;
            }
            sb += "</urlset>";
            fs.writeFileSync(path.join(sitemapsDir, fileName), sb);
        }
    }

    // CATEGORIES
    console.log("[STEP 3/5] Membuat sitemap_categories.xml...");
    if (CATEGORIES.length > 0) {
        let sb = getUrlsetOpen();
        for (const cat of CATEGORIES) {
            if (!cat) continue;
            const encoded = encodeURIComponent(cat);
            const canonicalUrl = `${baseUrl}/en/category?name=${encoded}`;
            sb += `  <url>\n    <loc>${escXml(canonicalUrl)}</loc>\n    <lastmod>${getTodayStr()}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.60</priority>\n`;
            for (const lang of LANGS) {
                sb += `    <xhtml:link rel="alternate" hreflang="${lang}" href="${escXml(`${baseUrl}/${lang}/category?name=${encoded}`)}" />\n`;
            }
            sb += `    <xhtml:link rel="alternate" hreflang="x-default" href="${escXml(canonicalUrl)}" />\n  </url>\n`;
        }
        sb += "</urlset>";
        fs.writeFileSync(path.join(sitemapsDir, 'sitemap_categories.xml'), sb);
    }

    // STUDIOS
    console.log("[STEP 4/5] Membuat sitemap_studios.xml...");
    {
        let sb = getUrlsetOpen();
        for (const studio of STUDIOS) {
            if (!studio) continue;
            const encoded = encodeURIComponent(studio);
            const canonicalUrl = `${baseUrl}/en/studio?name=${encoded}`;
            sb += `  <url>\n    <loc>${escXml(canonicalUrl)}</loc>\n    <lastmod>${getTodayStr()}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.50</priority>\n`;
            for (const lang of LANGS) {
                sb += `    <xhtml:link rel="alternate" hreflang="${lang}" href="${escXml(`${baseUrl}/${lang}/studio?name=${encoded}`)}" />\n`;
            }
            sb += `    <xhtml:link rel="alternate" hreflang="x-default" href="${escXml(canonicalUrl)}" />\n  </url>\n`;
        }
        sb += "</urlset>";
        fs.writeFileSync(path.join(sitemapsDir, 'sitemap_studios.xml'), sb);
    }

    // VIDEOS
    console.log("[STEP 5/5] Membuat sitemap video (CONCURRENT CRAWL)...");
    let totalPosts = 113259;
    let totalPages = 114;
    try {
        const res = await fetch(`${apiBaseUrl}?per_page=1`, { headers: { 'X-Client-Site': 'https://www.missav-j.com' }});
        if (res.headers.has('x-wp-total')) {
            totalPosts = parseInt(res.headers.get('x-wp-total'));
            totalPages = Math.ceil(totalPosts / perPage);
            console.log(`       [API] Total dari header: ${totalPosts} posts`);
        }
    } catch(e) {
        console.log(`       [!] Gagal ambil total dari API, gunakan fallback.`);
    }

    console.log(`       Memproses ${totalPages} halaman secara konkuren (Limit: ${concurrencyLimit})`);
    const pagesToProcess = [];
    for (let i = 1; i <= totalPages; i++) {
        let allLangsDone = true;
        for (const lang of VIDEO_LANGS) {
            if (!state.completedLangPages.includes(`${lang}-${i}`)) allLangsDone = false;
        }
        if (!allLangsDone) pagesToProcess.push(i);
    }

    const startTime = Date.now();

    await pMap(pagesToProcess, async (page) => {
        let posts = [];
        try {
            const res = await fetch(`${apiBaseUrl}?per_page=${perPage}&page=${page}`, { headers: { 'X-Client-Site': 'https://www.missav-j.com' }});
            if (res.ok) posts = await res.json();
            state.grandTotalRequests++;
        } catch(e) {
            console.log(`       [!] Halaman ${page} - Error API: ${e.message}`);
            return;
        }

        if (!posts || posts.length === 0) return;
        state.grandTotalVideos += posts.length;

        const ids = posts.map(p => p.id);
        const translationsMap = await getBatchTranslationsFromDb(ids);
        
        let sb = getUrlsetOpen();

        for (const post of posts) {
            const id = post.id;
            const code = post.code || '';
            const title = post.title || '';
            const dateVal = (post.date && post.date.length >= 10) ? post.date.substring(0, 10) : getTodayStr();

            let changefreq = 'monthly';
            let priority = '0.50';
            const postDateObj = new Date(dateVal);
            if (!isNaN(postDateObj)) {
                const ageDays = (Date.now() - postDateObj.getTime()) / (1000 * 60 * 60 * 24);
                if (ageDays < 7) { changefreq = 'daily'; priority = '0.90'; }
                else if (ageDays < 30) { changefreq = 'weekly'; priority = '0.70'; }
            }

            const cleanCode = slugify(code);
            let translations = translationsMap[id] || {};

            let hasNewTranslation = false;
            for (const altLang of LANGS) {
                if (altLang === 'en') continue;
                if (!translations[altLang]) {
                    const translated = await translateTitle(title, altLang);
                    translations[altLang] = translated;
                    hasNewTranslation = true;
                }
            }

            if (hasNewTranslation) {
                await saveTranslationToDb(id, translations);
            }

            const localizedSlugs = {};
            for (const altLang of LANGS) {
                const tTitle = translations[altLang] || title;
                let slug = slugify(tTitle);
                if (cleanCode) slug = `${cleanCode}-${slug}`;
                if (slug.length > 100) slug = slug.substring(0, 100).replace(/-+$/, '');
                if (!slug) slug = 'video';
                localizedSlugs[altLang] = encodeURIComponent(`${slug}-${id}`);
            }

            const enSlug = localizedSlugs['en'];
            const locUrl = `${baseUrl}/en/watch/${enSlug}`;

            sb += `  <url>\n    <loc>${escXml(locUrl)}</loc>\n    <lastmod>${dateVal}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n`;
            for (const altLang of LANGS) {
                const altUrl = `${baseUrl}/${altLang}/watch/${localizedSlugs[altLang]}`;
                sb += `    <xhtml:link rel="alternate" hreflang="${altLang}" href="${escXml(altUrl)}" />\n`;
            }
            sb += `    <xhtml:link rel="alternate" hreflang="x-default" href="${escXml(locUrl)}" />\n  </url>\n`;
        }

        sb += "</urlset>";
        const fileName = `sitemap_videos_${page}.xml`;
        fs.writeFileSync(path.join(sitemapsDir, fileName), sb);

        for (const lang of VIDEO_LANGS) {
            const key = `${lang}-${page}`;
            if (!state.completedLangPages.includes(key)) state.completedLangPages.push(key);
            if (!state.videoSitemapFiles.includes(fileName)) state.videoSitemapFiles.push(fileName);
        }

        const elapsed = (Date.now() - startTime) / 1000;
        const progress = ((state.completedLangPages.length / totalPages) * 100).toFixed(1);
        console.log(`       [PAGE ${page}/${totalPages}] Selesai. Progress: ${progress}% (${elapsed.toFixed(1)}s)`);

        saveState();

    }, concurrencyLimit);

    console.log("[INDEX] Membuat sitemap_index.xml...");
    let sbIdx = '<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    const indexAdd = (loc) => {
        sbIdx += `  <sitemap>\n    <loc>${baseUrl}/sitemaps/${loc}</loc>\n    <lastmod>${getTodayStr()}</lastmod>\n  </sitemap>\n`;
    };
    indexAdd('sitemap_pages.xml');
    actorFileNames.forEach(f => indexAdd(f));
    if (CATEGORIES.length > 0) indexAdd('sitemap_categories.xml');
    indexAdd('sitemap_studios.xml');
    
    // Sort array before adding
    state.videoSitemapFiles.sort((a,b) => {
        const numA = parseInt(a.replace(/[^0-9]/g, ''));
        const numB = parseInt(b.replace(/[^0-9]/g, ''));
        return numA - numB;
    });
    
    state.videoSitemapFiles.forEach(f => indexAdd(f));
    sbIdx += "</sitemapindex>";
    fs.writeFileSync(path.join(sitemapsDir, 'sitemap_index.xml'), sbIdx);

    if (fs.existsSync(stateFile)) fs.unlinkSync(stateFile);
    console.log("\n[SUCCESS] Pembuatan sitemap selesai dengan kecepatan tinggi!");
}

main();
