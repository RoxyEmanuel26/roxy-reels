var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// .wrangler/tmp/pages-xSHTW9/functionsWorker-0.49405907933167725.mjs
var __defProp2 = Object.defineProperty;
var __name2 = /* @__PURE__ */ __name((target, value) => __defProp2(target, "name", { value, configurable: true }), "__name");
var TARGET_BASE = "https://server.apijav.com/wp-json/myvideo/v1";
var LOCALIZATION = {
  id: {
    newTitle: "NEW VIDEO",
    randomTitle: "REKOMENDASI VIDEO",
    watchBtn: "\u{1F3AC} TONTON SEKARANG (WATCH NOW)",
    tagline: "\u{1F37F} Nonton video streaming gratis dengan kualitas HD tanpa lemot hanya di MISSAV-J!",
    actors: "Aktris",
    categories: "Kategori"
  },
  "zh-TW": {
    newTitle: "\u6700\u65B0\u5F71\u7247",
    randomTitle: "\u63A8\u85A6\u5F71\u7247",
    watchBtn: "\u{1F3AC} \u7ACB\u5373\u89C0\u770B (WATCH NOW)",
    tagline: "\u{1F37F} \u5728 MISSAV-J \u514D\u8CBB\u89C0\u770B\u7121\u5361\u9813\u7684\u9AD8\u6E05\u4E32\u6D41\u5F71\u7247\uFF01",
    actors: "\u5973\u512A",
    categories: "\u5206\u985E"
  },
  "zh-CN": {
    newTitle: "\u6700\u65B0\u89C6\u9891",
    randomTitle: "\u63A8\u8350\u89C6\u9891",
    watchBtn: "\u{1F3AC} \u7ACB\u5373\u89C2\u770B (WATCH NOW)",
    tagline: "\u{1F37F} \u5728 MISSAV-J \u514D\u8D39\u89C2\u770B\u65E0\u5361\u987F\u7684\u9AD8\u6E05\u4E32\u6D41\u89C6\u9891\uFF01",
    actors: "\u5973\u4F18",
    categories: "\u5206\u7C7B"
  },
  en: {
    newTitle: "NEW VIDEO",
    randomTitle: "RECOMMENDED",
    watchBtn: "\u{1F3AC} WATCH NOW",
    tagline: "\u{1F37F} Watch free video streaming in HD quality without buffering only on MISSAV-J!",
    actors: "Actresses",
    categories: "Categories"
  },
  ja: {
    newTitle: "\u65B0\u7740\u52D5\u753B",
    randomTitle: "\u304A\u3059\u3059\u3081\u52D5\u753B",
    watchBtn: "\u{1F3AC} \u4ECA\u3059\u3050\u8996\u8074 (WATCH NOW)",
    tagline: "\u{1F37F} MISSAV-J\u3067\u30D0\u30C3\u30D5\u30A1\u30EA\u30F3\u30B0\u306A\u3057\u306E\u8D85\u9AD8\u753B\u8CEA\u30B9\u30C8\u30EA\u30FC\u30DF\u30F3\u30B0\u52D5\u753B\u3092\u7121\u6599\u8996\u8074\u3057\u3088\u3046\uFF01",
    actors: "\u5973\u512A",
    categories: "\u30AB\u30C6\u30B4\u30EA\u30FC"
  },
  ko: {
    newTitle: "\uCD5C\uC2E0 \uBE44\uB514\uC624",
    randomTitle: "\uCD94\uCC9C \uBE44\uB514\uC624",
    watchBtn: "\u{1F3AC} \uC9C0\uAE08 \uC2DC\uCCAD\uD558\uAE30 (WATCH NOW)",
    tagline: "\u{1F37F} \uC624\uC9C1 MISSAV-J\uC5D0\uC11C \uBC84\uD37C\uB9C1 \uC5C6\uC774 \uACE0\uD654\uC9C8 HD \uBB34\uB8CC \uBE44\uB514\uC624 \uC2A4\uD2B8\uB9AC\uBC0D\uC744 \uC990\uACA8\uBCF4\uC138\uC694!",
    actors: "\uC5EC\uBC30\uC6B0",
    categories: "\uCE74\uD14C\uACE0\uB9AC"
  },
  ms: {
    newTitle: "VIDEO BARU",
    randomTitle: "REKOMENDASI VIDEO",
    watchBtn: "\u{1F3AC} TONTON SEKARANG (WATCH NOW)",
    tagline: "\u{1F37F} Tonton video streaming percuma dengan kualiti HD tanpa buffering hanya di MISSAV-J!",
    actors: "Aktris",
    categories: "Kategori"
  },
  th: {
    newTitle: "\u0E27\u0E34\u0E14\u0E35\u0E42\u0E2D\u0E43\u0E2B\u0E21\u0E48",
    randomTitle: "\u0E27\u0E34\u0E14\u0E35\u0E42\u0E2D\u0E41\u0E19\u0E30\u0E19\u0E33",
    watchBtn: "\u{1F3AC} \u0E23\u0E31\u0E1A\u0E0A\u0E21\u0E15\u0E2D\u0E19\u0E19\u0E35\u0E49 (WATCH NOW)",
    tagline: "\u{1F37F} \u0E23\u0E31\u0E1A\u0E0A\u0E21\u0E27\u0E34\u0E14\u0E35\u0E42\u0E2D\u0E2A\u0E15\u0E23\u0E35\u0E21\u0E21\u0E34\u0E48\u0E07\u0E1F\u0E23\u0E35\u0E04\u0E38\u0E13\u0E20\u0E32\u0E1E\u0E2A\u0E39\u0E07\u0E23\u0E30\u0E14\u0E31\u0E1A HD \u0E41\u0E1A\u0E1A\u0E44\u0E21\u0E48\u0E01\u0E23\u0E30\u0E15\u0E38\u0E01\u0E17\u0E35\u0E48 MISSAV-J \u0E40\u0E17\u0E48\u0E32\u0E19\u0E31\u0E49\u0E19!",
    actors: "\u0E19\u0E31\u0E01\u0E41\u0E2A\u0E14\u0E07\u0E2B\u0E0D\u0E34\u0E07",
    categories: "\u0E2B\u0E21\u0E27\u0E14\u0E2B\u0E21\u0E39\u0E48"
  },
  de: {
    newTitle: "NEUES VIDEO",
    randomTitle: "EMPFEHLUNG",
    watchBtn: "\u{1F3AC} JETZT ANSEHEN (WATCH NOW)",
    tagline: "\u{1F37F} Kostenloses Videostreaming in HD-Qualit\xE4t ohne Ruckeln nur auf MISSAV-J!",
    actors: "Schauspielerinnen",
    categories: "Kategorien"
  },
  fr: {
    newTitle: "NOUVELLE VID\xC9O",
    randomTitle: "RECOMMAND\xC9",
    watchBtn: "\u{1F3AC} REGARDER MAINTENANT (WATCH NOW)",
    tagline: "\u{1F37F} Regardez du streaming vid\xE9o gratuit en qualit\xE9 HD sans ralentissement uniquement sur MISSAV-J!",
    actors: "Actrices",
    categories: "Cat\xE9gories"
  },
  vi: {
    newTitle: "VIDEO M\u1EDAI",
    randomTitle: "G\u1EE2I \xDD VIDEO",
    watchBtn: "\u{1F3AC} XEM NGAY (WATCH NOW)",
    tagline: "\u{1F37F} Xem video ph\xE1t tr\u1EF1c tuy\u1EBFn mi\u1EC5n ph\xED ch\u1EA5t l\u01B0\u1EE3ng HD kh\xF4ng gi\u1EADt lag ch\u1EC9 c\xF3 t\u1EA1i MISSAV-J!",
    actors: "Di\u1EC5n vi\xEAn",
    categories: "Danh m\u1EE5c"
  },
  fil: {
    newTitle: "BAGONG VIDEO",
    randomTitle: "INIREREKOMENDA",
    watchBtn: "\u{1F3AC} PANOORIN NGAYON (WATCH NOW)",
    tagline: "\u{1F37F} Manood ng libreng video streaming na may HD quality nang walang buffer sa MISSAV-J lang!",
    actors: "Mga Aktris",
    categories: "Mga Kategorya"
  },
  pt: {
    newTitle: "NOVO V\xCDDEO",
    randomTitle: "RECOMENDADO",
    watchBtn: "\u{1F3AC} ASSISTIR AGORA (WATCH NOW)",
    tagline: "\u{1F37F} Assista a streaming de v\xEDdeo gratuito em qualidade HD sem travamentos apenas no MISSAV-J!",
    actors: "Atrizes",
    categories: "Categorias"
  }
};
async function getTranslationFromDb(supabaseUrl, supabaseKey, id) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8e3);
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/translations?id=eq.${id}&select=translations`, {
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`
      },
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (!res.ok) return null;
    const data = await res.json();
    return data && data[0] ? data[0].translations : null;
  } catch (e) {
    clearTimeout(timeoutId);
    console.error("Supabase get error:", e);
    return null;
  }
}
__name(getTranslationFromDb, "getTranslationFromDb");
__name2(getTranslationFromDb, "getTranslationFromDb");
async function saveTranslationToDb(supabaseUrl, supabaseKey, id, translations) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8e3);
  try {
    await fetch(`${supabaseUrl}/rest/v1/translations`, {
      method: "POST",
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates"
      },
      body: JSON.stringify({ id, translations }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);
  } catch (e) {
    clearTimeout(timeoutId);
    console.error("Supabase save error:", e);
  }
}
__name(saveTranslationToDb, "saveTranslationToDb");
__name2(saveTranslationToDb, "saveTranslationToDb");
function escapeMarkdown(text) {
  if (!text) return "";
  return text.replace(/_/g, "\\_").replace(/\*/g, "\\*").replace(/\[/g, "\\[").replace(/`/g, "\\`");
}
__name(escapeMarkdown, "escapeMarkdown");
__name2(escapeMarkdown, "escapeMarkdown");
async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const SUPABASE_URL = env.SUPABASE_URL;
  const SUPABASE_KEY = env.SUPABASE_KEY;
  const TELEGRAM_BOT_TOKEN = env.TELEGRAM_BOT_TOKEN;
  const TELEGRAM_CHAT_ID = env.TELEGRAM_CHAT_ID;
  const CRON_SECRET = env.CRON_SECRET || "missav_telegram_secret_key_123";
  const authHeader = request.headers.get("authorization");
  const queryKey = url.searchParams.get("key");
  if (authHeader !== `Bearer ${CRON_SECRET}` && queryKey !== CRON_SECRET) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }
  if (!SUPABASE_URL || !SUPABASE_KEY || !TELEGRAM_BOT_TOKEN) {
    return new Response(JSON.stringify({
      error: "Missing configuration",
      details: {
        supabase: !SUPABASE_URL || !SUPABASE_KEY,
        telegram: !TELEGRAM_BOT_TOKEN
      }
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
  const chatId = url.searchParams.get("chat_id") || TELEGRAM_CHAT_ID;
  if (!chatId) {
    return new Response(JSON.stringify({ error: "Missing chat_id parameter or environment variable" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
  const lang = url.searchParams.get("lang") || "id";
  const type = url.searchParams.get("type") || "new";
  try {
    const baseUrl = url.origin;
    let posts = [];
    if (type === "random") {
      const preUrl = `${TARGET_BASE}/posts?per_page=1`;
      const preController = new AbortController();
      const preTimeoutId = setTimeout(() => preController.abort(), 8e3);
      let preRes;
      try {
        preRes = await fetch(preUrl, {
          headers: {
            "Accept": "application/json",
            "X-Client-Site": baseUrl,
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Referer": baseUrl
          },
          signal: preController.signal
        });
        clearTimeout(preTimeoutId);
      } catch (err) {
        clearTimeout(preTimeoutId);
        preRes = { ok: false };
      }
      let totalPosts = 100;
      if (preRes.ok) {
        totalPosts = parseInt(preRes.headers.get("X-WP-Total") || "100", 10);
      }
      const randomPage = Math.floor(Math.random() * totalPosts) + 1;
      const randomUrl = `${TARGET_BASE}/posts?per_page=1&page=${randomPage}`;
      const randController = new AbortController();
      const randTimeoutId = setTimeout(() => randController.abort(), 8e3);
      let randomRes;
      try {
        randomRes = await fetch(randomUrl, {
          headers: {
            "Accept": "application/json",
            "X-Client-Site": baseUrl,
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Referer": baseUrl
          },
          signal: randController.signal
        });
        clearTimeout(randTimeoutId);
      } catch (err) {
        clearTimeout(randTimeoutId);
        randomRes = { ok: false };
      }
      if (randomRes.ok) {
        posts = await randomRes.json();
      }
    } else {
      const apiUrl = `${TARGET_BASE}/posts?per_page=5`;
      const apiController = new AbortController();
      const apiTimeoutId = setTimeout(() => apiController.abort(), 8e3);
      let apiRes;
      try {
        apiRes = await fetch(apiUrl, {
          headers: {
            "Accept": "application/json",
            "X-Client-Site": baseUrl,
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Referer": baseUrl
          },
          signal: apiController.signal
        });
        clearTimeout(apiTimeoutId);
      } catch (err) {
        clearTimeout(apiTimeoutId);
        throw new Error(`Failed to fetch posts: ${err.message}`);
      }
      if (apiRes.ok) {
        posts = await apiRes.json();
      } else {
        throw new Error(`Failed to fetch posts: ${apiRes.status}`);
      }
    }
    if (!posts || !Array.isArray(posts) || posts.length === 0) {
      return new Response(JSON.stringify({ message: "No posts found to process" }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }
    const results = [];
    const reversedPosts = type === "random" ? posts : [...posts].reverse();
    const loc = LOCALIZATION[lang] || LOCALIZATION["en"] || LOCALIZATION["id"];
    for (const post of reversedPosts) {
      const id = post.id;
      let translations = await getTranslationFromDb(SUPABASE_URL, SUPABASE_KEY, id);
      if (!translations) {
        translations = {};
      }
      if (lang && lang !== "en" && translations[lang]) {
        post.title = translations[lang];
      }
      let postedMap = {};
      if (type === "new") {
        if (typeof translations.telegram_posted === "boolean") {
          postedMap = { id: translations.telegram_posted };
        } else if (typeof translations.telegram_posted === "object" && translations.telegram_posted !== null) {
          postedMap = translations.telegram_posted;
        }
        if (postedMap[lang]) {
          results.push({ id, status: "skipped", reason: `already posted for lang: ${lang}` });
          continue;
        }
      }
      const code = post.code || "JAV";
      const title = post.title || "";
      const hashtags = ["#JAV", `#${code.replace(/[^a-zA-Z0-9]/g, "")}`];
      if (post.actors && post.actors.length > 0) {
        const primaryActor = Array.isArray(post.actors) ? post.actors[0] : post.actors;
        hashtags.push(`#${primaryActor.replace(/[\s\-_]+/g, "")}`);
      }
      const label = type === "random" ? loc.randomTitle : loc.newTitle;
      const icon = type === "random" ? "\u{1F3B2}" : "\u{1F525}";
      const captionText = `${icon} *[${label} \u2014 ${escapeMarkdown(code)}] ${escapeMarkdown(title)}*

${loc.tagline}

\u{1F4E2} *${loc.actors}*: ${escapeMarkdown(Array.isArray(post.actors) ? post.actors.join(", ") : post.actors || "-")}
\u{1F3F7}\uFE0F *${loc.categories}*: ${escapeMarkdown(Array.isArray(post.categories) ? post.categories.slice(0, 5).join(", ") : post.categories || "-")}

${hashtags.join(" ")}`;
      let slug = "";
      if (post.localized_slugs && post.localized_slugs[lang]) {
        slug = post.localized_slugs[lang];
      } else if (post.code && post.title) {
        const cleanCode = post.code.toLowerCase().trim().replace(/[\s\-_]+/g, "-").replace(/[^a-z0-9\-]/g, "");
        const cleanTitle = post.title.toLowerCase().trim().replace(/[\s\-_]+/g, "-").replace(/[^a-z0-9\-]/g, "");
        slug = `${cleanCode}-${cleanTitle}`;
      }
      const watchUrl = slug ? `${baseUrl}/${lang}/watch/${slug}-${id}` : `${baseUrl}/${lang}/watch/${id}`;
      let telegramSuccess = false;
      const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`;
      try {
        const payload = {
          chat_id: chatId,
          photo: post.thumbnail || "https://www.missav-j.com/assets/images/logo.webp",
          caption: captionText,
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [
                { text: loc.watchBtn, url: watchUrl }
              ]
            ]
          }
        };
        const tgController = new AbortController();
        const tgTimeoutId = setTimeout(() => tgController.abort(), 8e3);
        const tgRes = await fetch(telegramUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: tgController.signal
        });
        clearTimeout(tgTimeoutId);
        const tgData = await tgRes.json();
        if (tgRes.ok && tgData.ok) {
          telegramSuccess = true;
        } else {
          console.error(`Telegram Bot API Error for ID ${id}:`, tgData);
        }
      } catch (tgErr) {
        console.error(`Telegram connection error for ID ${id}:`, tgErr);
      }
      if (telegramSuccess) {
        if (type === "new") {
          postedMap[lang] = true;
          translations.telegram_posted = postedMap;
          await saveTranslationToDb(SUPABASE_URL, SUPABASE_KEY, id, translations);
        }
        results.push({ id, status: "posted", code });
      } else {
        results.push({ id, status: "failed", reason: "telegram send failed" });
      }
    }
    return new Response(JSON.stringify({
      success: true,
      processed: results
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("[Telegram Cron Error]", error);
    return new Response(JSON.stringify({
      error: "Internal Cron Error",
      message: error.message
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
__name(onRequest, "onRequest");
__name2(onRequest, "onRequest");
var TARGET_BASE2 = "https://server.apijav.com/wp-json/myvideo/v1";
async function onRequest2(context) {
  const { request, env, params } = context;
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-API-Key, X-Client-Site"
  };
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  const isGet = request.method === "GET";
  let cache = null;
  if (isGet) {
    try {
      cache = caches.default;
      const cachedResponse = await cache.match(request);
      if (cachedResponse && cachedResponse.ok) {
        return cachedResponse;
      }
    } catch (e) {
      console.error("[Cache Player Match Error]", e);
    }
  }
  try {
    const url = new URL(request.url);
    let id = null;
    if (params.id && params.id.length > 0) {
      id = params.id[0];
    }
    const idQuery = url.searchParams.get("id");
    id = id || idQuery;
    if (!id) {
      return new Response(JSON.stringify({
        error: "Bad Request",
        message: "Dynamic parameter video ID wajib disertakan"
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json; charset=utf-8"
        }
      });
    }
    const clientSite = request.headers.get("x-client-site") || "https://www.missav-j.com";
    const targetUrl = `${TARGET_BASE2}/player/${id}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 14e3);
    let response;
    try {
      response = await fetch(targetUrl, {
        method: "GET",
        headers: {
          "Accept": "application/json",
          "X-Client-Site": clientSite,
          "Referer": "https://www.missav-j.com/",
          "User-Agent": request.headers.get("User-Agent") || "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          "X-Forwarded-For": request.headers.get("cf-connecting-ip") || "",
          "CF-Connecting-IP": request.headers.get("cf-connecting-ip") || ""
        },
        signal: controller.signal
      });
      clearTimeout(timeoutId);
    } catch (err) {
      clearTimeout(timeoutId);
      return new Response(JSON.stringify({
        error: "Gateway Timeout",
        message: "Upstream Player API server did not respond in time."
      }), {
        status: 504,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json; charset=utf-8"
        }
      });
    }
    if (!response.ok) {
      return new Response(JSON.stringify({
        error: "Player API Error",
        message: response.statusText
      }), {
        status: response.status,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json; charset=utf-8"
        }
      });
    }
    const data = await response.json();
    const responseHeaders = {
      ...corsHeaders,
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=604800, stale-while-revalidate=86400"
    };
    const responseToReturn = new Response(JSON.stringify(data), {
      status: 200,
      headers: responseHeaders
    });
    if (cache && isGet) {
      context.waitUntil(cache.put(request, responseToReturn.clone()));
    }
    return responseToReturn;
  } catch (error) {
    console.error("[Cloudflare Worker player Error]", error);
    return new Response(JSON.stringify({
      error: "Gateway Proxy Error",
      message: error.message
    }), {
      status: 502,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json; charset=utf-8"
      }
    });
  }
}
__name(onRequest2, "onRequest2");
__name2(onRequest2, "onRequest");
var TARGET_BASE3 = "https://server.apijav.com/wp-json/myvideo/v1";
function slugify(text) {
  if (!text) return "";
  return text.toString().toLowerCase().trim().replace(/[\s\-_]+/g, "-").replace(/[^\p{L}\p{N}\-]/gu, "").replace(/-+/g, "-").replace(/^-+/, "").replace(/-+$/, "");
}
__name(slugify, "slugify");
__name2(slugify, "slugify");
function generateLocalizedSlugs(code, title, translations) {
  const supportedLangs = ["zh-TW", "zh-CN", "ja", "ko", "ms", "th", "de", "fr", "vi", "id", "fil", "pt"];
  const cleanCode = slugify(code || "");
  const cleanTitle = slugify(title || "");
  let enSlug = cleanCode && cleanTitle ? `${cleanCode}-${cleanTitle}` : cleanCode || cleanTitle || "video";
  if (enSlug.length > 100) enSlug = enSlug.substring(0, 100);
  const slugs = { en: enSlug };
  supportedLangs.forEach((lang) => {
    const tTitle = translations[lang] || title;
    const cleanTTitle = slugify(tTitle || "");
    let slug = cleanCode && cleanTTitle ? `${cleanCode}-${cleanTTitle}` : cleanCode || cleanTTitle || "video";
    if (slug.length > 100) slug = slug.substring(0, 100);
    slugs[lang] = slug;
  });
  return slugs;
}
__name(generateLocalizedSlugs, "generateLocalizedSlugs");
__name2(generateLocalizedSlugs, "generateLocalizedSlugs");
async function getTranslationFromDb2(id, supabaseUrl, supabaseKey) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5e3);
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/translations?id=eq.${id}&select=translations`, {
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`
      },
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (!res.ok) return null;
    const data = await res.json();
    return data && data[0] ? data[0].translations : null;
  } catch (e) {
    clearTimeout(timeoutId);
    console.error("Supabase get error:", e);
    return null;
  }
}
__name(getTranslationFromDb2, "getTranslationFromDb2");
__name2(getTranslationFromDb2, "getTranslationFromDb");
async function getBatchTranslationsFromDb(ids, supabaseUrl, supabaseKey) {
  if (!ids || ids.length === 0) return {};
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6e3);
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/translations?id=in.(${ids.join(",")})&select=id,translations`, {
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`
      },
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (!res.ok) return {};
    const data = await res.json();
    const map = {};
    if (Array.isArray(data)) {
      data.forEach((item) => {
        map[item.id] = item.translations;
      });
    }
    return map;
  } catch (e) {
    clearTimeout(timeoutId);
    console.error("Supabase batch get error:", e);
    return {};
  }
}
__name(getBatchTranslationsFromDb, "getBatchTranslationsFromDb");
__name2(getBatchTranslationsFromDb, "getBatchTranslationsFromDb");
async function saveTranslationToDb2(id, translations, supabaseUrl, supabaseKey) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5e3);
  try {
    await fetch(`${supabaseUrl}/rest/v1/translations`, {
      method: "POST",
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates"
      },
      body: JSON.stringify({ id, translations }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);
  } catch (e) {
    clearTimeout(timeoutId);
    console.error("Supabase save error:", e);
  }
}
__name(saveTranslationToDb2, "saveTranslationToDb2");
__name2(saveTranslationToDb2, "saveTranslationToDb");
async function translateTitle(title, lang) {
  if (!title) return "";
  const domains = [
    "translate.googleapis.com",
    "translate.google.com",
    "translate.google.co.id"
  ];
  for (const domain of domains) {
    const url = `https://${domain}/translate_a/single?client=gtx&sl=auto&tl=${lang}&dt=t&q=${encodeURIComponent(title)}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4e3);
    try {
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        if (data && data[0]) {
          return data[0].map((segment) => segment[0]).join("").trim();
        }
      }
    } catch (e) {
      clearTimeout(timeoutId);
      console.error(`Google Translate error via ${domain}:`, e);
    }
  }
  return title;
}
__name(translateTitle, "translateTitle");
__name2(translateTitle, "translateTitle");
async function getOrTranslatePost(post, targetLang, supabaseUrl, supabaseKey, eagerTranslateAll = false) {
  const id = post.id;
  let translations = await getTranslationFromDb2(id, supabaseUrl, supabaseKey);
  let needsSave = false;
  if (!translations) {
    translations = {};
    needsSave = true;
  }
  if (targetLang && targetLang !== "en" && !translations[targetLang]) {
    translations[targetLang] = await translateTitle(post.title, targetLang);
    needsSave = true;
  }
  if (needsSave && Object.keys(translations).length > 0) {
    await saveTranslationToDb2(id, translations, supabaseUrl, supabaseKey);
  }
  return translations;
}
__name(getOrTranslatePost, "getOrTranslatePost");
__name2(getOrTranslatePost, "getOrTranslatePost");
async function onRequest3(context) {
  const { request, env, params } = context;
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-API-Key, X-Client-Site"
  };
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  const isGet = request.method === "GET";
  let cache = null;
  if (isGet) {
    try {
      cache = caches.default;
      const cachedResponse = await cache.match(request);
      if (cachedResponse && cachedResponse.ok) {
        return cachedResponse;
      }
    } catch (e) {
      console.error("[Cache Posts Match Error]", e);
    }
  }
  try {
    const url = new URL(request.url);
    const SUPABASE_URL = env.SUPABASE_URL;
    const SUPABASE_KEY = env.SUPABASE_KEY;
    let id = null;
    if (params.id && params.id.length > 0) {
      id = params.id[0];
    }
    const idQuery = url.searchParams.get("id");
    id = id || idQuery;
    const lang = url.searchParams.get("lang") || "en";
    let targetUrl;
    if (id) {
      targetUrl = new URL(`${TARGET_BASE3}/posts/${id}`);
    } else {
      targetUrl = new URL(`${TARGET_BASE3}/posts`);
    }
    const isOtherStudio = url.searchParams.get("studio") === "Other" || url.searchParams.get("studio") === "Unknown Studio";
    url.searchParams.forEach((value, key) => {
      if (id && key === "id") return;
      if (isOtherStudio && key === "studio") return;
      targetUrl.searchParams.append(key, value);
    });
    let data;
    let total = null;
    let totalPages = null;
    const clientSite = request.headers.get("x-client-site") || "https://www.missav-j.com";
    if (isOtherStudio) {
      const requestedPage = parseInt(url.searchParams.get("page") || "1", 10) || 1;
      const perPageNum = 100;
      const startPage = (requestedPage - 1) * 4 + 1;
      const pagesToFetch = [startPage, startPage + 1, startPage + 2, startPage + 3];
      const fetchPage = /* @__PURE__ */ __name2(async (pageNum) => {
        const pageUrl = new URL(targetUrl.toString());
        pageUrl.searchParams.set("per_page", String(perPageNum));
        pageUrl.searchParams.set("page", String(pageNum));
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 14e3);
        try {
          const response = await fetch(pageUrl.toString(), {
            method: "GET",
            headers: {
              "Accept": "application/json",
              "X-Client-Site": "https://www.missav-j.com",
              "Referer": "https://www.missav-j.com/",
              "User-Agent": request.headers.get("User-Agent") || "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
              "X-Forwarded-For": request.headers.get("cf-connecting-ip") || "",
              "CF-Connecting-IP": request.headers.get("cf-connecting-ip") || ""
            },
            signal: controller.signal
          });
          clearTimeout(timeoutId);
          if (!response.ok) return [];
          return await response.json();
        } catch (err) {
          clearTimeout(timeoutId);
          console.error(`Failed to fetch page ${pageNum} for Other Studio:`, err);
          return [];
        }
      }, "fetchPage");
      const results = await Promise.all(pagesToFetch.map((p) => fetchPage(p)));
      const allPosts = results.flat();
      data = allPosts.filter((post) => post && post.id && !post.studio);
      total = "120";
      totalPages = "10";
    } else {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 14e3);
      let response;
      try {
        response = await fetch(targetUrl.toString(), {
          method: "GET",
          headers: {
            "Accept": "application/json",
            "X-Client-Site": "https://www.missav-j.com",
            "Referer": "https://www.missav-j.com/",
            "User-Agent": request.headers.get("User-Agent") || "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            "X-Forwarded-For": request.headers.get("cf-connecting-ip") || "",
            "CF-Connecting-IP": request.headers.get("cf-connecting-ip") || ""
          },
          signal: controller.signal
        });
        clearTimeout(timeoutId);
      } catch (err) {
        clearTimeout(timeoutId);
        return new Response(JSON.stringify({
          error: "Gateway Timeout",
          message: "Upstream API server did not respond in time."
        }), {
          status: 504,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json; charset=utf-8"
          }
        });
      }
      if (!response.ok) {
        return new Response(JSON.stringify({
          error: "WordPress REST API Error",
          message: response.statusText
        }), {
          status: response.status,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json; charset=utf-8"
          }
        });
      }
      data = await response.json();
      total = response.headers.get("X-WP-Total");
      totalPages = response.headers.get("X-WP-TotalPages");
    }
    if (data) {
      if (id && !Array.isArray(data)) {
        const translationTimeout = new Promise((resolve) => setTimeout(() => resolve(null), 5e3));
        const translationResult = await Promise.race([
          getOrTranslatePost(data, lang, SUPABASE_URL, SUPABASE_KEY, false).catch(() => null),
          translationTimeout
        ]);
        if (translationResult) {
          if (lang && lang !== "en" && translationResult[lang]) {
            data.title = translationResult[lang];
          }
          data.localized_slugs = generateLocalizedSlugs(data.code, data.title, translationResult);
        } else {
          data.localized_slugs = generateLocalizedSlugs(data.code, data.title, {});
        }
      } else if (Array.isArray(data)) {
        const ids = data.map((p) => p.id);
        const translationsMap = await getBatchTranslationsFromDb(ids, SUPABASE_URL, SUPABASE_KEY).catch(() => ({}));
        data.forEach((post) => {
          const translations = translationsMap[post.id] || {};
          if (lang && lang !== "en" && translations[lang]) {
            post.title = translations[lang];
          }
          post.localized_slugs = generateLocalizedSlugs(post.code, post.title, translations);
        });
        if (SUPABASE_URL && SUPABASE_KEY) {
          const postsNeedingTranslation = data.filter((p) => {
            const t = translationsMap[p.id];
            return !t || lang && lang !== "en" && !t[lang];
          });
          if (postsNeedingTranslation.length > 0) {
            const bgTranslate = /* @__PURE__ */ __name2(async () => {
              const CONCURRENCY = 3;
              for (let i = 0; i < postsNeedingTranslation.length; i += CONCURRENCY) {
                const batch = postsNeedingTranslation.slice(i, i + CONCURRENCY);
                await Promise.allSettled(
                  batch.map((post) => getOrTranslatePost(post, lang, SUPABASE_URL, SUPABASE_KEY, false).catch(() => null))
                );
              }
            }, "bgTranslate");
            context.waitUntil(bgTranslate());
          }
        }
      }
    }
    const responseHeaders = {
      ...corsHeaders,
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, s-maxage=604800, stale-while-revalidate=86400"
    };
    if (total) responseHeaders["X-WP-Total"] = total;
    if (totalPages) responseHeaders["X-WP-TotalPages"] = totalPages;
    const responseToReturn = new Response(JSON.stringify(data), {
      status: 200,
      headers: responseHeaders
    });
    if (cache && isGet) {
      context.waitUntil(cache.put(request, responseToReturn.clone()));
    }
    return responseToReturn;
  } catch (error) {
    console.error("[Cloudflare Worker posts Error]", error);
    return new Response(JSON.stringify({
      error: "Gateway Proxy Error",
      message: error.message
    }), {
      status: 502,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json; charset=utf-8"
      }
    });
  }
}
__name(onRequest3, "onRequest3");
__name2(onRequest3, "onRequest");
var SAFE_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/avif", "image/gif"];
async function onRequest4(context) {
  const { request } = context;
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Max-Age": "86400"
      }
    });
  }
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response("Method Not Allowed", { status: 405 });
  }
  const urlParams = new URL(request.url).searchParams;
  let targetUrl = urlParams.get("url");
  if (!targetUrl) {
    return new Response("Missing url parameter", { status: 400 });
  }
  if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
    try {
      targetUrl = atob(targetUrl);
    } catch (e) {
      return new Response("Invalid base64 encoding", { status: 400 });
    }
  }
  const allowedDomains = [
    "fourhoi.com",
    "image.apijav.com",
    "server.apijav.com",
    "server.appjav.com",
    "surrit.com",
    "media.surrit.com",
    // Japanese JAV CDN providers (thumbnails sering dari domain ini)
    "dmm.co.jp",
    "dmm.com",
    "pics.dmm.co.jp",
    "cc3001.dmm.co.jp",
    // Note: storage.googleapis.com DIHAPUS — terlalu luas, bisa digunakan SSRF
    // New CDN domains from API
    "fourhoi.mrstcdn.store",
    "mrstcdn.store",
    "mrstcdn.com"
  ];
  let parsedTarget;
  try {
    parsedTarget = new URL(targetUrl);
  } catch (e) {
    return new Response("Invalid URL", { status: 400 });
  }
  if (parsedTarget.protocol !== "https:") {
    return new Response("HTTPS required", { status: 400 });
  }
  const isAllowed = allowedDomains.some(
    (domain) => parsedTarget.hostname === domain || parsedTarget.hostname.endsWith("." + domain)
  );
  if (!isAllowed) {
    return new Response("Domain not allowed", { status: 403 });
  }
  const cache = caches.default;
  const cacheKey = request;
  try {
    const cachedResponse = await cache.match(cacheKey);
    if (cachedResponse) {
      return cachedResponse;
    }
  } catch (e) {
    console.error("Cache match error:", e);
  }
  const headers = new Headers();
  headers.set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
  headers.set("Referer", parsedTarget.origin);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 1e4);
  try {
    const response = await fetch(targetUrl, {
      method: "GET",
      headers,
      signal: controller.signal,
      redirect: "follow"
    });
    clearTimeout(timeoutId);
    if (!response.ok) {
      return new Response(`Upstream error`, { status: response.status });
    }
    const rawContentType = (response.headers.get("Content-Type") || "").toLowerCase().split(";")[0].trim();
    const safeContentType = SAFE_IMAGE_TYPES.find((t) => rawContentType === t || rawContentType.startsWith(t));
    const finalContentType = safeContentType || "image/jpeg";
    const responseHeaders = new Headers({
      "Content-Type": finalContentType,
      "X-Content-Type-Options": "nosniff",
      "Content-Disposition": "inline",
      "Cache-Control": "public, max-age=31536000, immutable",
      "Access-Control-Allow-Origin": "*"
    });
    if (response.body) {
      const [streamForClient, streamForCache] = response.body.tee();
      const finalResponse2 = new Response(streamForClient, {
        status: 200,
        headers: responseHeaders
      });
      context.waitUntil(
        cache.put(cacheKey, new Response(streamForCache, { status: 200, headers: responseHeaders })).catch((err) => console.error("Cache put error:", err))
      );
      return finalResponse2;
    }
    const responseBody = await response.arrayBuffer();
    const finalResponse = new Response(responseBody, {
      status: 200,
      headers: responseHeaders
    });
    context.waitUntil(cache.put(cacheKey, finalResponse.clone()).catch(() => {
    }));
    return finalResponse;
  } catch (e) {
    clearTimeout(timeoutId);
    console.error("Image proxy fetch error:", e);
    return new Response("Proxy Error: Unable to fetch image", { status: 502 });
  }
}
__name(onRequest4, "onRequest4");
__name2(onRequest4, "onRequest");
var actors_default = ["123 Yuri", "1St Person: Rino, The Butchers Signboard Girl", "3 Amateur Beauties With An Average Height Of Over 170Cm", "3 Girls Who Feel It Even Though They Dont Like It", "3Rd Gal Dental Hygienist Sarina", "4 People In Total", "99", "@Alinya", "@Cowgirlmei", "@Elumia", "@Faerina", "@Megumi Hoshina", "@Mikoto Kuze", "@Namida", "@Reina Takai", "@Sakura Imai", "[Amari/G Milk Pink Nipples Slut] [Hinamin/Slender Beautiful Body Slut] W Beautiful Girl Slut 4P Orgy Sp That Blows Away The Lingering Heat! !", "A Beautiful Girl With Beautiful Legs And Beautiful Breasts Who Looks Great In Knee Highs", "A Certain Dreamland Cast! Two Good Friends Big Breasted Gals Senior: Ran Junior: Sea", "A Super Masochistic Beauty Who Looks Very Similar To Hon\u25EF Tsubasa / A Nursing Student Who Looks Very Similar To Hashi\u25EF Kanna / A G-Breasted Married Woman Who Looks Very Similar To Sa\u25EF Isoyama", "A Woman Who Squirts About 5L When She Wakes Up", "A-Chan", "Abe", "Abe Indigo", "Abe Miho", "Abe Mikako", "Abe Noboru", "Abe\xD7", "Actress X Nh", "Adachi Rui", "Adachi Shiori", "Ah-Chan", "Ahn Sung-Jun", "Ai Akatsuki", "Ai Asakura", "Ai Haneda", "Ai Haruno", "Ai Hiraoka", "Ai Hongo", "Ai Hoshina", "Ai Ichise", "Ai Inoriyama", "Ai Junsai", "Ai Kano", "Ai Kitaoka", "Ai Komiyama", "Ai Komori", "Ai Konohana", "Ai Kuribayashi", "Ai Makise", "Ai Matsuyama", "Ai Minano", "Ai Miyagawa", "Ai Mizushima", "Ai Noguchi", "Ai Oriya", "Ai Ran", "Ai Ryu Hashino", "Ai Shinoda", "Ai Shirakawa", "Ai Takashima", "Ai Tsukimoto", "Ai Uehara", "Ai Yamabuki", "Ai Yokoi", "Ai Yuzu", "Ai, 23 Years Old, Dental Clinic Receptionist", "Ai-Chan, New Client, 120-Minute Course", "Aiba Himari", "Aiba Misako", "Aibu Mizuki", "Aiburan", "Aihara Tsukiha", "Aika", "Aika", "Aika Fujiwara", "Aika Hayashi", "Aika Hoshino", "Aika Kazami", "Aika Kishimoto", "Aika Nagano", "Aika Saya", "Aika Shindo", "Aika Usagi", "Aika Yamagishi", "Aika Yoshihara", "Aikarin", "Aikawa Mama", "Aikawa Nami", "Aiko Imai", "Aiko Kanda", "Aiko Ogawa", "Aima Ichikawa", "Aimi", "Aimi Fujio", "Aimi Haru", "Aimi Otosaki", "Aimi Yoshikawa", "Aimi Yuri", "Aina", "Aina Ai", "Aina Koumi", "Aina Lind", "Aina Mizuki", "Aina Nagase", "Aina Namiki", "Aina Satonaka", "Aina Tsuji", "Aino Rei", "Aino Shibasaki", "Aino Tsubaki", "Aino Yuzuki", "Aira", "Aira Ochi", "Airi", "Airi Fujii", "Airi Hobana", "Airi Ichimatsu", "Airi Ichise", "Airi Jinguji", "Airi Kijima", "Airi Kosaka", "Airi Mashiro", "Airi Mikumo", "Airi Miyazaki", "Airi Mizukawa", "Airi Momose", "Airi Nagisa", "Airi Nanase", "Airi Niiyama", "Airi Sakurai", "Airi Sakurazawa", "Airi Sato", "Airi Tachibana", "Airi Tsuji", "Airi Yukina", "Airi, 27 Years Old, Company Employee", "Aisa Aiba", "Aisa Tsutsui", "Aisaki Leila", "Aisaki Tenku", "Aishichi Shinkawa", "Aisu Minon", "Aitsuki Celia", "Aiu Urano", "Aiyo Zao", "Aizawa Hina", "Aizawa Kaho", "Aizumi Reika", "Akagi Anami", "Akagi Ao", "Akagi On", "Akai Mizuki", "Akana Ito", "Akane Aoi", "Akane Ayaka", "Akane Azusa", "Akane Haruka", "Akane Hasegawa", "Akane Hirate", "Akane Iruma", "Akane Ishigaki", "Akane Izumi", "Akane Kitagawa", "Akane Kudo", "Akane Minato", "Akane Mitani", "Akane Miyamae", "Akane Mizusaki", "Akane Mochida", "Akane Mochida", "Akane Rei", "Akane Sana", "Akane Soma", "Akane Sora", "Akane Tachi", "Akane Yamashita", "Akane, 24 Years Old, Beauty Industry", "Akane-Chan", "Akari", "Akari Aizawa", "Akari Asahina", "Akari Futaba", "Akari Higashi", "Akari Hoshimiya", "Akari Kato", "Akari Kimishima", "Akari Kitagawa", "Akari Kuroda", "Akari Maijima", "Akari Matsunaga", "Akari Maya", "Akari Miki", "Akari Minase", "Akari Misaki", "Akari Mitani", "Akari Morimoto", "Akari Naruse", "Akari Natsukawa", "Akari Neo", "Akari Niimura", "Akari Satsuki", "Akari Shibuya", "Akari Tatsumi", "Akari Tsukishima", "Akari Yukino", "Akari-Chan", "Akari-Chan, 22 Years Old, Multi-Character", "Akasaka Camellia", "Akasato Sugisaki", "Akatsuki Midwinter", "Akemi Horiuchi", "Akemi Iwagaya", "Akemi Kano", "Akemi Miu", "Akemi Morishima", "Akemi Ohara", "Akemi Washio", "Aki Camellia", "Aki Mori", "Aki Mukai", "Aki Nishiyama", "Aki Okazaki", "Aki Sasaki", "Aki Segawa", "Aki Shiiba", "Aki Shinoda", "Aki Suou", "Aki Suzumiya", "Aki Yato", "Aki Yonemoto", "Aki-San, 30 Years Old", "Akiba Momo", "Akihiro Io", "Akiho Ozono", "Akiho Sano", "Akiho Shiraishi", "Akiho Yoshizawa", "Akiho, 29 Years Old, Jewelry Shop Employee", "Akiko Goto", "Akiko Hasegawa", "Akiko Kirishima", "Akiko Nagase", "Akina", "Akina Ishiki", "Akina Kataoka", "Akina Kurosawa", "Akina Nagahara", "Akina Nihei", "Akina Tsuzuki", "Akira Erie", "Akira Natsume", "Akira Okajima", "Akira Ono", "Akira Shiratori", "Akira Watase", "Akira/24/Ol", "Akiyama Bookmark", "Akiyama Lily", "Akiyama Mian", "Akizono Koe", "Akizuki Komachi", "Ako Fujimoto", "Ako Maeda", "Ako Nishino", "Ako Ogura", "Ako Shiraishi", "Akutsu Hayo", "Alana Ray", "Alex More", "Alexa Payne", "Alexis Tay", "Alice", "Alice", "Alice Hernandez", "Alice Ichimori", "Alice Mizuki", "Alice Shaku", "Alice Shinomiya", "Alice Toyonaka", "Alice Wong", "Alice Zaphel", "Alina", "Alisa Aoyama", "Alito", "Almond Niece", "Aloha Maeda", "Amachi", "Amagase Yuka", "Amaha Cocoon", "Amai Kurumi", "Amakawa Sora", "Amami Azusa", "Amami Bookmark", "Amami Heart", "Amami Ichika", "Amami Mea", "Amami Tsubasa", "Amamiya Breeze", "Amamiya Hanan", "Amamiya Kasumi", "Amamiya Natsuki", "Amanano Ai", "Amane Arisu", "Amane Kanna", "Amane Love", "Amane Luna", "Amane Michelle", "Amane Miu", "Amane Ramu", "Amane Rin", "Amane Sena", "Amane Tao", "Amane Uran", "Amane Yayoi", "Amane Yui", "Amano Noa", "Amano Ririka", "Amano Tsubaki", "Amano Yuki", "Amanogawa Tsumugi", "Amasaki Himeno", "Amasawa Rin", "Amateur", "Amatsuka Ayume", "Amatsuki Azu", "Amayoshi Drop", "Amber Hina", "Amber Jane", "Amber Kawai", "Amber Slightly", "Ambition", "Amei Rina", "Amelia", "Amelie Ichinose", "Amemiya Ayaka", "Amemiya Honoka", "Amemiya Kotone", "Ameyori Tsubame", "Ami", "Ami Hanamiya", "Ami Hiiragi", "Ami Hoshino", "Ami Imanaga", "Ami Inamori", "Ami Kashiwagi", "Ami Kayano", "Ami Natsui", "Ami Ogura", "Ami Oki", "Ami Sakai", "Ami Takashima", "Ami Tokita", "Ami Tsuzuki", "Ami Utada", "Ami Wakatsuki", "Ami Yozora", "Amia Moretti", "Amika Minase", "Amimiru", "Amin Nina", "Amina Kirishima", "Amina Kiuchi", "Amina Takashiro", "Amiri Saito", "Amitan", "Amu Ohara", "Amu Sakuragi", "Amu Shida", "Amu Suzuki", "Amuro Nami", "Amuro Sally", "An Himeka", "An Mashiro", "An Tsujimoto", "An Wakamoto", "An Yabuki", "Anders Ways", "Ando Hana", "Ando Poetry", "Ando Tokiyo", "Ando Too", "Andong Nanpo", "Anga", "Angel Emily", "Angel Miki", "Angel Moe", "Angel Wicky", "Angel Yui", "Angela", "Angelina", "Angelique Lapiedra", "Angie Links", "Anissa Kate", "Anjo Anna", "Anju Himeno", "Anju Imai", "Anju Kitagawa", "Anju Minase", "Anka Suzune", "Anmizuki", "Ann Sasakura", "Anna", "Anna Beach", "Anna Claire Crowes", "Anna De Ville", "Anna Hanayagi", "Anna Himeshima", "Anna Hoshi", "Anna Kami", "Anna Kataoka", "Anna Kimishima", "Anna Kiuchi", "Anna Konno Minami", "Anna Kurata", "Anna Mihashi", "Anna Mitsushima", "Anna Morikawa", "Anna Moriyama", "Anna Rika", "Anna Sakurada", "Anna Sawakita", "Anna Sudo", "Anna Sugiyama", "Anna Tateoka", "Anna Tsubakihime", "Anna Tsukishima", "Anna Yamaura", "Annan Momoi", "Annina", "Anno Anno", "Anno Yuzuko", "Anoano", "Anon Mita", "Anonymous Female College Student", "Anonymous Junior", "Anri", "Anri Hiramatsu", "Anri Hoshizaki", "Anri Kizuki", "Anri Nonaka", "Anri Okita", "Anri Otomo", "Anri Suzuki", "Anri Tachibana", "Anshinin Yua", "Anzai Aiyu", "Anzai Et Al.", "Anzaiten", "Anzu", "Anzu Hoshi", "Anzu Komatsu", "Anzu Kuzuha", "Ao Amano", "Ao Ebisaki", "Ao Hayama", "Ao Kunimoto", "Ao Marina", "Ao Minami", "Ao Takashima", "Aoba Haru", "Aoba Konatsu", "Aoi", "Aoi Ai", "Aoi Aosaka", "Aoi Aoyama", "Aoi Fujii", "Aoi Hashimoto", "Aoi Hibiki", "Aoi Hinata", "Aoi Hirano", "Aoi Ibuki", "Aoi Ichigo", "Aoi Ichino", "Aoi Ichinose", "Aoi Kasahara", "Aoi Koharu", "Aoi Koyama", "Aoi Kururugi", "Aoi Matsushima", "Aoi Mibu", "Aoi Minori", "Aoi Mio", "Aoi Miyama", "Aoi Momoi", "Aoi Morinaga", "Aoi Nakashiro", "Aoi Naruse", "Aoi Nashimoto", "Aoi Okana", "Aoi Onodera", "Aoi Sekiguchi", "Aoi Shiho", "Aoi Shinomiya", "Aoi Sou", "Aoi Tojo", "Aoi Tsubasa", "Aoi Yoshise", "Aoi Yurika", "Aoka Tsukimachi", "Aoki Kuzuha", "Aono Mizuki", "Aonuma", "Aori Arihoshi", "Aoshino", "Aoyama Aina", "Aoyama Ao", "Aoyama Nana", "Aoyama Nanami", "Aoyama Shuri", "Apricot", "Apricot Here", "Apricot Karen", "Aqua Yamazaki", "Arakaki Umi", "Araki Kisora", "Arare Mochizuki", "Arata Arina", "Aria Himeji", "Aria Kazami", "Aria Oshima", "Ariella Donovan", "Ariga Minaho", "Arihisa Iida", "Arika Moriguchi", "Arima Mizuki", "Arima-San, 21 Years Old, University Student", "Arina Kuninaka", "Arisa", "Arisa Aino", "Arisa Hanyu", "Arisa Hanyu", "Arisa Honjo", "Arisa Itoi", "Arisa Kanno", "Arisa Kawasaki", "Arisa Kimino", "Arisa Kunimori", "Arisa Kuroki", "Arisa Matsumoto", "Arisa Miyakawa", "Arisa Mizui", "Arisa Murase", "Arisa Nishimura", "Arisa Saotome", "Arisa Takeuchi", "Arisa Togawa", "Arisa Tomioka", "Arisa Tomonaga", "Arisa Wakatsuki", "Arisaka Tsubasa", "Arisu", "Arisu Hana Aka", "Arisu Mai", "Arisu Mizushima", "Arisu Sayama", "Arita Mie", "Army", "Aro Tamamori", "Aroha Ii", "Asagiri Hikaru", "Asagiri Inori", "Asahi", "Asahi Ito", "Asahi Kaede", "Asahi Meisa", "Asahi Nishiyama", "Asahi Sakai", "Asahi Shizuku", "Asahi Walnut", "Asahi Yuuki", "Asahi Yuuna", "Asahina Meguru", "Asahina Mikuru", "Asahina Rumina", "Asahina Shino", "Asahina Sho", "Asahina Yui", "Asahina Yume", "Asaka Hiramatsu", "Asaka Sera", "Asakaze Yui", "Asako Kitamori", "Asako Morishita", "Asako Takanashi", "Asakura Here", "Asakura Himeno", "Asakura Kotomi", "Asami", "Asami", "Asami Homma", "Asami Kobayashi", "Asami Kumagai", "Asami Miura", "Asami Mizubata", "Asami Nanase", "Asami Nemoto", "Asami Ogawa", "Asami Tsuchiya", "Asami, 33 Years Old, Married For 3 Years", "Asamiya Rana", "Asano", "Asano Heart", "Asano Kokoa", "Ashida", "Ashina Yulia", "Ashley May", "Ashley Orion", "Asmr", "Aso Nozomi", "Asuka Aida", "Asuka Claire", "Asuka Furuya", "Asuka Harada", "Asuka Hirose", "Asuka Ihara", "Asuka Kirara", "Asuka Kirishima", "Asuka Kyono", "Asuka Minamisaka", "Asuka Mion", "Asuka Momose", "Asuka Morimoto", "Asuka Motomiya", "Asuka Nana", "Asuka Ohara", "Asuka Takagi", "Asuka Tsukimoto", "Asuka Uchiyama", "Asuka Yumesaki", "Asuka Yuuki", "Asuka, 26 Years Old, Nurse", "Asuka, The Receptionist With The Long Tongue", "Asuka-Chan", "Asukas Side Job Is As A Hostess In Ebisu", "Asumi Miona", "Asumi Tomioka", "Asuna Hoshi", "Asuna Ichikawa", "Asuna Ikemoto", "Asuo", "Ataru Asano", "Atomi Shuri", "Atsuko Nakajima", "Atsuko Umemiya", "Atsuko Yamaguchi", "Atsumi Yano", "Atsushi Hosoda", "Atsushi Nanase", "Atsushi Yoshino", "Autumn", "Autumn Leaves Love", "Avery Christie", "Aya", "Aya Fujii", "Aya Goto", "Aya Hamanaka", "Aya Hanasaki", "Aya Imai", "Aya Izumi", "Aya Kawai", "Aya Kisaki", "Aya Konami", "Aya Mamiya", "Aya Manabe", "Aya Mikami", "Aya Mikumo", "Aya Mitsui", "Aya Miyoshi", "Aya Nakamura", "Aya Nanao", "Aya Nanjo", "Aya Nogi", "Aya Sakurai", "Aya Sasakura", "Aya Sato", "Aya Sazanami", "Aya Shiina", "Aya Shiomi", "Aya Takamine", "Aya Takane", "Aya Takashiro", "Aya Takeuchi", "Aya Tsukino", "Aya Ueba", "Aya Wakana", "Aya, 26 Years Old, Ballet Instructor", "Ayachi", "Ayaka", "Ayaka Futaba", "Ayaka Hirosaki", "Ayaka Kobori", "Ayaka Makimura", "Ayaka Minase", "Ayaka Miyabe", "Ayaka Mochida", "Ayaka Mochizuki", "Ayaka Muto", "Ayaka Natsukawa", "Ayaka Nii Aoi", "Ayaka Ochi", "Ayaka Oshima", "Ayaka Saki", "Ayaka Sakonji", "Ayaka Sawa", "Ayaka Senpai", "Ayaka Shinya", "Ayaka Tomoda", "Ayaka Yamagishi", "Ayaka Yoshii", "Ayaka Yoshizawa", "Ayaka Yuzuki", "Ayaka, 29 Years Old, Bookstore Clerk", "Ayakawa Dream", "Ayako Inoue", "Ayako Kano", "Ayako Kirishima", "Ayame Fujiyuki", "Ayame Himeno", "Ayame Hina", "Ayame Ichinose", "Ayame Miyakozaki", "Ayame Yumeno", "Ayami", "Ayami Emoto", "Ayami Ikeda", "Ayami Ishikawa", "Ayami Mori", "Ayami Shunka", "Ayami Yasuka", "Ayamin", "Ayamiyuki", "Ayana Kyoko", "Ayana Mogami", "Ayana Nakajo", "Ayana Yamagishi", "Ayana Yazaki", "Ayane Asakura", "Ayane Harukana", "Ayane Ishihara", "Ayane Megumi", "Ayane Nakai", "Ayane Sakura", "Ayane Sakurai", "Ayane Sezaki", "Ayane Shinoda", "Ayane Shirotsuki", "Ayane Suzukawa", "Ayane Takizawa", "Ayane Yoshida", "Ayane Yuki", "Ayano", "Ayano Esthetician", "Ayano Fujimori", "Ayano Ichinose", "Ayano Kamiyama", "Ayano Kato", "Ayano Kikuchi", "Ayano Murasaki", "Ayano Nakamura", "Ayano Ran", "Ayano Sae", "Ayano Suzuju", "Ayano-Chan New 90-Minute Course", "Ayano-Chan, 25 Years Old, Multi-Purpose Water", "Ayase Is", "Ayase Kokoro", "Ayase Kunimi", "Ayase Minami", "Ayase Ten", "Ayla Stark", "Ayu", "Ayu Otsuka", "Ayu Sakurai", "Ayu Togawa", "Ayuha Ami", "Ayuka", "Ayuka Futaba", "Ayuka Kato", "Ayumi", "Ayumi Aika", "Ayumi An", "Ayumi Arihara", "Ayumi Miura", "Ayumi Natsukawa", "Ayumi Ryo", "Ayumi Shinoda", "Ayumi Takahashi", "Ayumi Takanashi", "Ayumi Wakana", "Ayumu Kase", "Ayumu Kubo", "Ayumu Kuroki", "Ayumu Tamura", "Ayunohana Mori", "Ayuri Sonoda", "Azu / Beautiful Girl Living In The Country Jd! A Fierce Man In The Pants Selling Neighborhood! The Production Should Be Ng...", "Azuchan Student", "Azuki", "Azuma Fuuka", "Azuma Suzu", "Azumi Chino", "Azumi Kirino", "Azumi Love", "Azumi Mizushima", "Azusa", "Azusa Ayano", "Azusa Hikari", "Azusa Ichinose", "Azusa Ikezaki", "Azusa Kakei", "Azusa Kanami", "Azusa Katagiri", "Azusa Kirihara", "Azusa Marino", "Azusa Misaki", "Azusa Mori", "Azusa Morisaki", "Azusa Nagai", "Azusa Nagase", "Azusa Onuki", "Azusa Shinonome", "Azusa Tani", "Azusa Yagi", "Azusa Yamamoto", "Azusa Yui", "Baba", "Baba Non", "Baba Nozomi", "Baba\xD7", "Babico", "Baby", "Bakabon", "Bakabon\xD7", "Ball", "Bang Bang", "Bassie", "Beautiful Breasts G Cup + Outstanding Style Yuki (30) Creampie Sex", "Beautiful Cool", "Beautiful Legs With Overflowing Sexual Desire J\u25CF", "Beauty Goddess Moa", "Beauty Kanon", "Because Of It", "Because Of Peach Love", "Beep Beep", "Begal", "Bella Blaze", "Bella Tina", "Benzo", "Bernice", "Bibi", "Big Tits Jd Without A Bra Full Of Gaps", "Binna", "Bird Hina", "Bird Play Flower Sound", "Black Dragon", "Black Edge", "Black People", "Black Saki Drops", "Blake Blossom", "Blanca", "Blizzard", "Blondie Bombshell", "Blue", "Blue Ori", "Blue Wave Drops", "Bokki Sugiura\xD7", "Bond", "Bone-Crusher", "Bonito Flakes", "Bookmark", "Boxer Kamei", "Brena Mckenna", "Brittany Andrews", "Brittany Bird", "Brown F Cup! The Fluffy Body Is So Comfortable To Hold! ! Kokorin-Chan (21) Former Nurse", "Brunch Bradbury", "Bud", "By Moon Clouds", "By The Way", "Ca-Chan, 25 Years Old, Flight Attendant For A Certain Airline", "Camellia", "Camellia Flower", "Camphor Doll", "Candy Crush", "Candy Giada", "Candy Hina Parks", "Candy Richard", "Candy-Licious", "Cape Sakura", "Caprico", "Captain", "Carlos", "Carolina Cherry", "Carolina Guerrero", "Caroline Lease", "Casey", "Cat Squit", "Cathy Heaven", "Chan Yua", "Chanel Camlin", "Chang", "Chanruna", "Chanyota", "Chaoyang Ema", "Chaoyang Sora", "Charlotte Satur", "Chastity Lynn", "Chauchiru", "Cheating Office Lady, 26 Years Old, Real Estate", "Chee Chee", "Cheho", "Chenna", "Cherry Blossoms", "Cherry Blossoms Maybe", "Chest Hair", "Chiaki", "Chiaki Asagiri", "Chiaki Otsuka", "Chiaki Sato", "Chiaki Shinomiya", "Chiaki Takase", "Chiaki Takeshita", "Chiaki Uehara", "Chiara Road", "Chiba Ayame", "Chiba, 21 Years Old, Physical Education University Student", "Chibana Shion", "Chibitori", "Chichi Asada", "Chichikaka", "Chie Aoi", "Chie Nakamura", "Chie Yajima", "Chieko Natsushita", "Chieko Okada", "Chieri Matsunaga", "Chigusa Hara", "Chiharu", "Chiharu Aso", "Chiharu Ito", "Chiharu Komatsu", "Chiharu Minagawa", "Chiharu Mitsuha", "Chiharu Miyashita", "Chiharu Miyazawa", "Chiharu Nogi", "Chiharu Okui", "Chiharu Sakai", "Chiharu Sakurai", "Chiharu Tsubaki", "Chihaya Anzai", "Chihiro Akino", "Chihiro Hiiragi", "Chihiro Hinata", "Chihiro Miyazaki", "Chihiro Shinkawa", "Chihiro Takemiya", "Chihiro Uehara", "Chihiro Yuikawa", "Chiho Hirashima", "Chiho Momokawa", "Chiitero", "Chika Akiyama", "Chika Arimura", "Chika Kurata", "Chika Momoi", "Chika Tachibana", "Chika Uehara", "Chikako Maru", "Chikako Masuda", "Chikamoto Nagisa", "Child", "Chile", "Chimutan", "China Izawa", "Chinaho", "Chinami Natsuno", "Chinami Sakura", "Chinami, 21 Years Old, Female College Student", "Chinatsu Akimoto", "Chinatsu Asamiya", "Chinatsu Hashimoto", "Chinatsu Mizumoto", "Chinatsu Niiyama", "Chinese East Rinoa", "Chintaro Sakurai", "Chiori Shirakawa", "Chisa Hoshino", "Chisaki China", "Chisato Fujimoto", "Chisato Higashi", "Chisato Hoshina", "Chisato Kakizawa", "Chisato Mori", "Chisato Nagai", "Chisato Sugihara", "Chisato Takagi", "Chisato Ugaki", "Chise-Chan, A Generation Z College Student", "Chitose Haga", "Chitose Hara", "Chitose Kudo", "Chitose Shinohara", "Chitose Yura", "Chiyoko Kawabata", "Chiyuki Makimoto", "Chiyuri Iijima", "Chizuru Akasaka", "Chizuru Iwasaki", "Chizuru Terashima", "Chloe Cherry", "Chohi Shiina", "Chris Aoki", "Ch\xE9nas", "Ciel Hiiragi", "Cindy", "Cindy Hina Parks", "Claire", "Click Here For Shirase", "Climb", "Clothing Tsumugi", "Cobblestone Rare", "Coby", "Cocona Yuki", "Coglehart", "Collina", "Come On", "Coming Soon", "Company Matsuo", "Cool Breeze Ui", "Courage", "Cro-Magnon", "Cute Mayu", "Cute Rin", "D.d. Hoppy", "Daichi Oikawa", "Daiki Takeda", "Daiki Takeda\xD7", "Daimai Juria", "Daisuke Sadamatsu", "Daisuke Sadamatsu And Yuto Kuroda", "Daisuke Yokoyama", "Daisy Cake", "Dance", "Dandy", "Danka", "Danny", "Date Towa", "Daya Night", "Dayama", "Dedication Glue", "Deer Eyes", "Deigo", "Dekayoshi", "Dekosuke", "Demi Delia", "Depew", "Devi", "Device", "Dew Pear Ayase", "Dharma", "Die", "Dimensional Airi", "Do You See Aoyama?", "Dolce", "Domoto Softly", "Donchan", "Dont Be Fruitful", "Dont Be Quick", "Dont Sun", "Dow Brother", "Dow Brother X", "Dragon", "Dream", "Dream Castle Eve", "Dreaming", "Driftwood Sara", "Drop", "Droplet Heart", "Droplets Ramune", "Drunkard Nyama", "Ear", "East Exit", "Echika Akai", "Echoing Sound", "Eden Ivy", "Edogawa Monaka", "Edogawa Revelation", "Edogawa Revelation \xD7", "Egasan", "Eiko Kato", "Eima Mikawa", "Eimi Fukada", "Eimi Kuromiya", "Eimi Suzukawa", "Eina Reina", "Ekoi Sky", "Eleka", "Elena", "Elena 31 Years Old Pachislot Multi", "Elena Takeda", "Elena Takimoto", "Elisa Kusunoki", "Ella Knox", "Elle Hanade Meyer", "Ellen Fujisaki", "Ellen Shiraki", "Ellie Nova", "Eluru", "Ema Chizuru", "Ema Ichijo", "Ema Kato", "Ema Kishi", "Ema Kuriyama", "Ema Kurumi", "Ema Nanasawa", "Ema Shiiba", "Ema Spends 200,000 Yen A Month On Beauty Treatments", "Emi", "Emi Ao", "Emi Dan", "Emi Goto", "Emi Harukaze", "Emi Imai", "Emi Komiyama", "Emi Matsuda", "Emi Mizukawa", "Emi Nishino", "Emi Sakuma", "Emi Sakurai", "Emi Sano", "Emi Toda", "Emi Tojo", "Emi Toyonaga", "Emi Tsubakii", "Emi Yagami", "Emiko Itake", "Emiko Kawano", "Emiko Koike", "Emiko Nara", "Emiko Sugioka", "Emily Pink", "Emily Yuuhina", "Emina Minamizawa", "Emiri Aoi", "Emiri Aosawa", "Emiri Momoka", "Emiri Momota", "Emiri Okazaki", "Emiri Suzuhara", "Emma Futaba", "Emma Hicks", "Emma Lawrence", "Emma Maeda", "Emma Starletto", "Emotional", "Emperor Yuzu", "Ena Hisaki", "Ena Koume", "Ena Satsuki", "Enako", "Endo Hyakune", "Endo Koharu", "Endo Miharu", "Endo Ribbon", "Enif", "Enka Mitsuki", "Enoki Eno", "Enz", "Eoki", "Erena Sasamiya", "Eri", "Eri Aikawa", "Eri Asakura", "Eri Hamasaki", "Eri Hasegawa", "Eri Hazuki", "Eri Kashiwagi", "Eri Kikuchi", "Eri Nakamichi", "Eri Saeki", "Eri Sugihara", "Eri Takagami", "Eri Takigawa", "Eri Takigawa", "Eri Tokushima", "Erica Kitagawa", "Eriguchi", "Erika", "Erika (21) University Student", "Erika Arimura", "Erika Arishima", "Erika Ayanami", "Erika Hirose", "Erika Inami", "Erika Isshin", "Erika Kake", "Erika Kano", "Erika Kinoha", "Erika Komura", "Erika Mikami", "Erika Misumi", "Erika Mizumoto", "Erika Momotani", "Erika Ozaki", "Erika Saeki", "Erika Sakuragi", "Erika Sato", "Erika Shiomi", "Erika Shirono", "Eriko Goto", "Eriko Kurata", "Eriko Matsuo", "Eriko Nakanishi", "Erin Onda", "Erin Tono", "Erina", "Erina Aso", "Erina Hashimura", "Erina Hayakawa", "Erina Hill", "Erina Mori", "Erina Sugisaki", "Eris Katsuki", "Eris Takami", "Erisa Kamishiro", "Erisa, 35 Years Old, Married For 4 Years", "Erotic Lips + Super Beautiful Legs Wakana-San", "Eru Sato", "Esther", "Eternal Love", "Etsuko Kikuzono", "Etsuko Yuki", "Eugenic", "Eugenic \xD7", "Eve Sweet", "Even Kurokawa", "Even Namori", "Evening Cicada", "Everlasting Summer", "Everyone", "Evie", "Exit Bondage", "Eyes", "Fable", "Facchi", "Fellow Asuka", "Fire", "Fire Lily Yuna", "First Bloom*Lola", "First Love", "Fishing", "Flat Bond", "Florence Saionji Haruka", "Flower", "Flower Alice", "Flower And Bird Douka", "Flower Buds", "Flower Hunting", "Flower Melody", "Fluffy", "Fluffy Love", "Foreign Company Ol-Chan, 27 Years Old, Manager Of The Overseas Business Department Of A Famous Company", "Forest Man", "Four-Leaf Clover", "Franceska Lee", "Frankfurt Forest", "Frankfurt Forest X", "Friends", "Fujii Chika", "Fujii Iyona", "Fujikawa Iris", "Fujikawa No Kaze", "Fujikita Ayaka", "Fujiko Awaji", "Fujino Rin", "Fujioka Miku", "Fujisaki Mai", "Fujisaki Riona", "Fujishiro Momoba", "Fuka Kureha", "Fuka Yoshida", "Fukasawa Inori", "Fukuda Peach", "Fukuhara Mina", "Fukuhara Naruka", "Fukuoka Alice", "Fukuoka Mei, 29 Years Old, Apparel Company Manager", "Fukuoka Shiho", "Fukutomi Ryo", "Fukuyama Iroha", "Full Moon Cloud", "Fumi Ayakawa", "Fumi Kimura", "Fumi Nagasaki", "Fumie Kiyono", "Fumie Osato", "Fumie Sugimoto", "Fumika Chikase", "Fumika Kadowaki", "Fumika Kashiwagi", "Fumika Nagano", "Fumika Nagasawa", "Fumika Nakayama", "Fumika Yoshinaga", "Fumika, 25 Years Old, Dental Hygienist", "Fumika, 28 Years Old, Beauty Salon Manager", "Fumiko Otowa", "Fumina Sakurai", "Fumino Ishikawa", "Fumino Mizutori", "Fumino Satsuki", "Fumitaka Yoshimura", "Further", "Furukawa Honoka", "Furuse Rei", "Fusae Kagawa", "Futaba Iroha", "Futaba Maple", "Futaba Mirei", "Futaba Otani", "Futaba Rena", "Futaba Walnut", "Futami Yuyuko.", "Futoshi", "Futoshi Kapipa", "Future Love", "Fuu, 24 Years Old, Receptionist", "Fuuka", "Fuuka Yoshioka", "Fuuka, 35 Years Old, Married For 2 Years.", "Fuwa Harshin", "Fuyutsuki Remi", "G-Cup Masochist, 26 Years Old, Overseas Brand Buyer", "Gabby Audley", "Gabi Mitake Marcia", "General", "Giant Hirota", "Giant Type", "Gina Lynn", "Ginji Sagawa", "Glazy Almedia", "Go", "God Sea Rear", "Goddess Jun", "Gojo Ren", "Goku", "Gonzo", "Goro", "Gotoda Toru", "Gourd", "Granular Amu", "Gray-Haired Man", "Green House Ren", "Gunji Honoka", "Guy", "H-Cup Beautiful Girl From Another World / Hono-Chan", "Hachiba Rem", "Hachijo Ameri", "Hadoi", "Haduki Leira", "Hagiwara Nodoka", "Haiji", "Hailey Winters", "Hajime Himori", "Hajime Himori\xD7", "Hajime Horiuchi", "Hajime Yanai", "Hajun Kawaguchi", "Hakar", "Hakase", "Hakata Ayaba", "Hakuhou Renka", "Haley Rose", "Hamabe Nonoka", "Hamabe Sayaka", "Hamabe Shioriho", "Hamabes", "Hamano Tsumugu", "Hamara Aria", "Hamauchi Rei", "Hamazaki Mao", "Hame Bird Person", "Hame Shirabu", "Hamura Blunt Weapon", "Hana", "Hana Aoyama", "Hana Imaizumi", "Hana Kotone", "Hana Misora", "Hana Miura", "Hana Ohashi", "Hana Sakurai", "Hana Soma", "Hana Yamada", "Hana Yoshimura", "Hana, 22 Years Old, Logistics Center Clerk", "Hana, 22 Years Old, Medical Office Worker", "Hana, 24 Years Old, Nurse", "Hana, 27 Years Old, Beauty Clinic Manager", "Hanabi Tsukino", "Hanae Kumiko", "Hanae Okazaki", "Hanahara Asuka", "Hanai Shizuku", "Hanako Nishikawa", "Hanamaru Walnut", "Hanamiya Ema", "Hanamiya Kyouko", "Hanamiya Shiina", "Hanamori Kaho", "Hanamoto Kyouka", "Hananao Miki", "Hanane Sugiura", "Hanane Urara", "Hanaoka Jita", "Hanasaki Lala", "Hanasaki Mio", "Hanasaki Otona", "Hanasaki Shiho", "Hanashiro Ren", "Hanayo Hina", "Hanazato Akari", "Hanazawa Mirei", "Hanazono Jasmine", "Hanazono Suzu", "Hanazuki Ai", "Hanazuki Seina", "Haneda", "Haneda (25) &amp; Narita (25) / International Ca", "Haneda Tsubasa", "Hanekawa Ruru", "Hannah The Lover", "Hapimaru", "Happy Ikeda", "Hara Hanane", "Hara Hinano", "Hara Lilia", "Harada Chika", "Haraguchi", "Harigane", "Harlow West", "Harry", "Harsh Waist Use! ! Demon Unequaled / Super Beautiful F Milk Gal Anna-Chan (22) Girls Bar Clerk", "Haru Ando", "Haru Kawamura", "Haru Kikuchi", "Haru Koyama", "Haru Nishikawa", "Haru Ogawa", "Haru Shibasaki", "Haru Shinonome", "Haru Yamaguchi", "Haru, 22 Years Old, Nurse", "Haru-Chan New 150-Minute Course", "Harua Narimiya", "Haruhara Mirai", "Haruhi Hanano", "Haruhi Hibiki", "Haruhi Tianhe", "Haruhi Tsukigata", "Haruho Itoshiba", "Haruka", "Haruka Aizawa", "Haruka Aso", "Haruka Ayane", "Haruka Fragrant", "Haruka Funakoshi", "Haruka Ikeuchi", "Haruka Kishii", "Haruka Kitagawa", "Haruka Kitano", "Haruka Koide", "Haruka Megumi", "Haruka Miokawa", "Haruka Mirai", "Haruka Miyana", "Haruka Nagata", "Haruka Nagayama", "Haruka Nakamura", "Haruka Namiki", "Haruka Nanasegawa", "Haruka Nishimoto", "Haruka Nogi", "Haruka Sanada", "Haruka Sasa", "Haruka Suzumiya", "Haruka Takami", "Haruka Takase", "Haruka Tamai", "Haruka Yamamoto", "Haruka Yukawa", "Haruka, 31 Years Old, Dental Hygienist", "Harukaze Doggy", "Haruki", "Haruki Ashina", "Haruki Kanome", "Haruki Kinoshita", "Haruki Komori", "Haruki Sato", "Haruko Nagayama", "Haruko Narumi", "Haruku", "Haruma", "Harumei Jun", "Harumi Fujita", "Harumi Inoue", "Harumi Karato", "Harumi Kurokawa", "Harumi Kyomoto", "Harumi Murakami", "Harumi Sagawa", "Harumi Takagi", "Harumi Toyota", "Haruna", "Haruna Hana", "Haruna Imai", "Haruna Kakimine", "Haruna Kawagoe", "Haruna Kawakita", "Haruna Nakano", "Haruna Nishijima", "Haruna Saeki", "Haruno Ando", "Haruno Chiharu", "Haruno Morisaki", "Haruno Ruru", "Haruno Sakuma", "Haruno Sakura", "Harupi", "Harura Mori", "Harusaki Azumi", "Haruse Momona", "Haruto Terahashi", "Haruyo Mocha", "Haruyo Shimamura", "Haruyo Tamiya", "Haruyoshi Tsuneda", "Hasegawa Drop", "Hasegawa Hanane", "Hasegawa Koyoi", "Hasegawa Otoe", "Hasegawa Shiori", "Hashimoto Arina", "Hashimoto Poetry", "Hasui Rin", "Hasumi Chise", "Hasumi Claire", "Hasumi Hyodo", "Hasumiten", "Hatanaka", "Hatsuki", "Hatsumi Asada", "Hatsumi Saki", "Hatsune Minori", "Hatsune Nano", "Hatsune Roria", "Hattori Hayaki", "Hattori-Chan", "Hayami Mona", "Hayami Sana", "Hayano Uta", "Hayao Moriya", "Hayase Fumino", "Hayato Kasama", "Hayato Tsuji", "Hazel Moore", "Hazuki", "Hazuki Akari", "Hazuki Hina", "Hazuki Kamiya", "Hazuki Matsui", "Hazuki Mayu", "Hazuki Mii", "Hazuki Mion", "Hazuki Moe", "Hazuki Morishita", "Hazuki Nagasawa", "Hazuki Nanase", "Hazuki Peach", "Hazuki Sano", "Hazuki Satonaka", "Hazuki Seina", "Hazuki Shuri", "Hazuki-Chan", "He", "Healing Y-Chan", "Heiran Niizawa", "Here", "Hibiki", "Hibiki Amemiya", "Hibiki Hoshino", "Hibiki Nakatani", "Hibiki Natsume", "Hibiki Otsuki", "Hibiki Rika", "Hibiki Tamura", "Hibiki Yonezu", "Hibikiren", "Hibino Rin", "Hibino Satomi", "Hibino Uta", "Hidai", "Hideko Mayuzumi", "Hidemi Sugimoto", "Hideyuki Setsune", "Higashi", "Higashi Mika", "High Ratio Good Cage", "Highlights", "Hii", "Hiiragi", "Hiiragi Kaede", "Hiiragi Mai", "Hiiragi Momiji", "Hiiragi Saeko", "Hiiragi Saki", "Hijikata Hikaru", "Hika 19 Years Old", "Hika Nagano", "Hikari", "Hikari Akatsuki", "Hikari Anzai", "Hikari Aotsuki", "Hikari Aozora", "Hikari Hime", "Hikari Himeno", "Hikari Ina", "Hikari Ishiyama", "Hikari Ito", "Hikari Matsushita", "Hikari Mitsui", "Hikari Mizusumi", "Hikari Nagisa", "Hikari Ninomiya", "Hikari Nishimura", "Hikari Nishino", "Hikari Ogura", "Hikari Sakuraba", "Hikari Sena", "Hikari Takifuyu", "Hikari Tamaki", "Hikari Yoshizawa", "Hikari Yukino", "Hikari, 25 Years Old, Married For 1 Year.", "Hikari, 28 Years Old, Married For 3 Years.", "Hikari, 37 Years Old, Middle School Teacher", "Hikaru Aiura", "Hikaru Harukaze", "Hikaru Hoshikawa", "Hikaru Hozuki", "Hikaru Ikuno", "Hikaru Imada", "Hikaru Is A Nursery Teacher During The Day.", "Hikaru Kanda", "Hikaru Kawana", "Hikaru Konno", "Hikaru Matsuyuki", "Hikaru Minazuki", "Hikaru Miyanishi", "Hikaru Momoi", "Hikaru Morishita", "Hikaru Narumiya", "Hikaru Toda", "Hikaru Toda\xD7", "Hikaru, 20 Years Old, Ski Club", "Hikaru-Chan", "Hikita Nozomi", "Himari", "Himari Arihara", "Himari Asada", "Himari Ayase", "Himari Hina", "Himari Imai", "Himari Jinbo", "Himari Kinoshita", "Himari Kizaki", "Himari Kohinata", "Himari Kosaka", "Himari Kotoko", "Himari Momose", "Himari Narumi", "Himari Ogawa", "Himari Ozuki", "Himari, 30 Years Old, Dentist", "Himari-Chan, 22 Years Old, Female College Student", "Himari-San", "Himarin", "Hime Hayasaka", "Hime Shirayuki", "Himeka Kawamoto", "Himeka Mari", "Himeka Ochi", "Himeka, 40 Years Old, Works At A Call Center.", "Himekawa Kanon", "Himemiya Mio", "Himemori Amu", "Himeno", "Himeno Juri", "Himeno Kamiya", "Himeno Karis", "Himeno Kisaragi", "Himeno Milk", "Himeno Misao", "Himeno Momona", "Himeno Walnut", "Himenoyuki", "Himeoka Shia", "Himeri Osaki", "Himesaki Miharu", "Himika Nanao", "Himiko Hazuki", "Himitsu-Chan", "Himrock", "Hina", "Hina Akiyoshi", "Hina Fujisawa", "Hina Himeno", "Hina Hirose", "Hina Hotaka", "Hina Kawai", "Hina Kusakabe", "Hina Maeda", "Hina Makimura", "Hina Matsushita", "Hina Mori", "Hina Morikawa", "Hina Nanami", "Hina No Kanon", "Hina Otsuka", "Hina Sakurai", "Hina Sasaki", "Hina Satsuki", "Hina Serizawa", "Hina Shimizu", "Hina Shinjo", "Hina Student 21 Years Old", "Hina Tsukino", "Hina Yanai", "Hina Yumeno", "Hina, 21 Years Old, Nursing Department, Womens University", "Hina, 23 Years Old, The Person Inside The Costume", "Hina, 26 Years Old, Job Change Agent", "Hina, 26 Years Old, Presidents Secretary", "Hinachi", "Hinachin! Mitsuki! Kaho Pai! Lanka-Chan! Libido Explosion Sp With 4 Gal Bitch Large Gathering! !", "Hinachu", "Hinagata Mikuru", "Hinagiku Tsubasa", "Hinako", "Hinako Matsui", "Hinako Mori", "Hinako Niizaki", "Hinako Seto", "Hinako Suga", "Hinako, 22 Years Old, Part-Time Worker", "Hinako, 25 Years Old, Kindergarten Teacher", "Hinami", "Hinami Fujimori", "Hinami Honoka", "Hinami Meguro", "Hinami Narizawa", "Hinami Ren", "Hinan Rin", "Hinana Hanon", "Hinano", "Hinano Ayami", "Hinano Iori", "Hinano Kamisaka", "Hinano Kokonoki", "Hinano Kuno", "Hinano Kurosaki", "Hinano Miki", "Hinano Misaki", "Hinano Miyata", "Hinano Okada", "Hinano Rikuhata", "Hinano Sakurai", "Hinano Sonoda", "Hinano Tachibana", "Hinanosaki", "Hinata", "Hinata Aino", "Hinata Arai", "Hinata Hikage", "Hinata Kaede", "Hinata Kaho", "Hinata Kimitsuka", "Hinata Koizumi", "Hinata Komine", "Hinata Mio", "Hinata Nori", "Hinata Ohara", "Hinata Ria", "Hinata Sagiri", "Hinata Suzumori", "Hinata Tachibana", "Hinata Yuna", "Hinata Yura", "Hinata Yuzuki", "Hinazaka Neo", "Hiori Yuzuki", "Hirahana", "Hirai Kanon", "Hiraizumi Kanna", "Hirari", "Hiratsuka Moe Izumi", "Hirayama Hana", "Hirayama Words", "Hiro Mizuhara", "Hirochika Ao", "Hiroi Sora", "Hiroi Umi", "Hiroka Suzuno", "Hiroko Mishima", "Hiroko Takashima", "Hiroko Takeda", "Hiroko Tanizono", "Hiromi", "Hiromi Eguchi", "Hiromi Nanase", "Hiromi Shibuya", "Hirono", "Hirose Miyu", "Hirose Narumi", "Hirose Nokomi", "Hirose Utaha", "Hirosue Miyu", "Hisae Yabe", "Hisaki Nakamura", "Hisami Sakurada", "Hisayama Incense", "Hisayo Nanami", "Hitomi", "Hitomi", "Hitomi Aihara", "Hitomi Enjo", "Hitomi Hayama", "Hitomi Honjo", "Hitomi Hoshitani", "Hitomi Inose", "Hitomi Inoue", "Hitomi Kaiman", "Hitomi Katase", "Hitomi Kurosawa", "Hitomi Madoka", "Hitomi Mochizuki", "Hitomi Mukai", "Hitomi Ohashi", "Hitomi Okumura", "Hitomi Osaka", "Hitomi Otsuka", "Hitomi Rin", "Hitomi Ryo", "Hitomi Sakakibara", "Hitomi Sakurai", "Hitomi Satsuki", "Hitomi Shibuya", "Hitomi Tachibana", "Hitomi Takeuchi", "Hitomi Tanmura", "Hitomi Yamasaki", "Hitomi Yasuda", "Hitomi Yoshimizu", "Hitomi Yura", "Hitomi Yuuki", "Hiyori Aso", "Hiyori Futaba", "Hiyori Koharu", "Hiyori Makita", "Hiyori Nosaka", "Hiyori Sasakura", "Hiyori Shiokawa", "Hiyori Yoshioka", "Hiyori Yukawa", "Ho Sumire", "Hojo Ami", "Hojo Asahi", "Hojo Luluka", "Hoka Nakayama", "Hoka Yonekura", "Holy Skylark", "Homare Momono", "Homare Tatsumi", "Homura Yune", "Honami Hazuki", "Honami Hiramori", "Honami Matsushima", "Honami Miyashita", "Honami Mukai", "Honami Sakata", "Honami Takahashi", "Honami, 30 Years Old, Married For 4 Years", "Honda Ayami", "Honda Cape", "Honda Hitomi", "Honda Kaori", "Honda Mai", "Honda Noeru", "Honda Peach", "Honda Riko", "Honda Rin", "Honda Satomi", "Honda Tsubaki", "Honest", "Hongo Maya", "Honjo Hana", "Honjo Sayuri", "Honjo Suzu", "Honjo Tsubasa", "Honka Saito", "Hono Furuno", "Hono Konomi", "Hono Wakamiya", "Hono Wakana", "Hono Watanabe", "Hono-Chan", "Honochan, 26 Years Old, Nail Artist", "Honoka", "Honoka Ashina", "Honoka Kimura", "Honoka Mihara", "Honoka Mitsuhara", "Honoka Morimoto", "Honoka Namishima", "Honoka Nanase", "Honoka Shiina", "Honoka Takigawa", "Honoka Tsujii", "Honoka Yamauchi", "Honoka Yu", "Honoka Yukimi", "Honoka Yumekawa", "Honoka, 22 Years Old. Her Favorite Phrase Is Once In A Lifetime.", "Honoka, 28 Years Old", "Honoka, 28 Years Old, Real Estate Sales", "Hope Light", "Hope Mirina", "Horai Kasumi", "Horiho", "Horikiri Nami", "Horikita Eyebrows", "Horikita Wan", "Horio", "Horsetail", "Horsetail Horsetail", "Hosaka Eri", "Hoshi Fuyuka", "Hoshichi Nanami", "Hoshide", "Hoshide\xD7", "Hoshii Lol", "Hoshikawa Uika", "Hoshimiya Koto", "Hoshimiya Kurumi", "Hoshimiya Momo", "Hoshimiya Nana", "Hoshimiya Sakihi", "Hoshina Sakura", "Hoshino Akari", "Hoshino Bell", "Hoshino Hoshiyoshi", "Hoshino Iroha", "Hoshino Kanade", "Hoshino Kira", "Hoshino Leia", "Hoshino Mami", "Hoshino Misakura", "Hoshino Mizune", "Hoshino Natsutsuki", "Hoshino Nene", "Hoshino Sumire", "Hoshitani Uta", "Hoshizaki Seira", "Hoshizuki Em", "Hosho Lily", "Hosokawa-San", "Hotaru Beni", "Hotaru Minamihara", "Hotaru Nogi", "Hotaru Yamakawa", "Houka", "Hyakuninka", "Hyakuta Walnut", "Hyakuyo Hanane", "Hyde", "Hyokori", "Hyottoko", "I Cant Hear It", "I Love Sex So Much Its Dangerous... Shes The Type Who Will Do Anything For You! Her Moans Are So Cute! A Huge Ass That Youll Want To Lick All Over", "I Want To See The Moon", "I-Cup Mitsuki", "Ian Eva", "Ian Hanasaki", "Ic", "Ice Collar", "Ichiba Reika", "Ichijo Jade", "Ichika", "Ichika Aimi", "Ichika Arisaki", "Ichika Ayamori", "Ichika Hayano", "Ichika Hoshimiya", "Ichika Kamihata", "Ichika Kasagi", "Ichika Koko", "Ichika Kuroki", "Ichika Matsumoto", "Ichika Nagano", "Ichika Nanjo", "Ichika Tokiwa", "Ichika Yamamiya", "Ichika-Sensei", "Ichinomiya Quruli", "Ichinose Hazuki", "Ichinose Kokona", "Ichinose Kureha", "Ichinose Kureha, 25 Years Old, Car Dealer", "Ichinose Nagi", "Ichinose No", "Ichinose Nodoka", "Ichinose Peach", "Ichinose Ram", "Idol Trainee", "Igachan", "Iguchi", "Iitoyo See", "Ijuin Akane", "Ikeda", "Ikeda Kei", "Ikegami Otoha", "Ikeya Walnut", "Iku Natsumi", "Ikumi Kondo", "Ikumi Kuroki", "Ikunomachi", "Ikuo Yamamoto", "Ikuta Town", "Im", "Immediately After Izumo", "In Hoshimiya", "In Tamaki", "Inagawa Natsume", "India Summer", "Indigo Fruit", "Indigo Nagi", "Infinity", "Innocent Karen", "Inori Higa", "Inoue Miyo", "Intoxicated", "Io Mikashima", "Iona Sakihara", "Iori Arai", "Iori Furukawa", "Iori Hane", "Iori Kato", "Iori Nanase", "Iori Sakura", "Iori Shizuku", "Iori Takanashi", "Iori Tomoyo", "Iori Tsukimi", "Ippei Nakata", "Iris", "Iroha-San, 28 Years Old, Active Model", "Is It", "Is It A Bird Play?", "Is It A Fountain?", "Is It Dry", "Is It Hatsumi?", "Is It Kawai?", "Is It Miyadai?", "Is It Sato?", "Is It Tominaga?", "Is It Yukari?", "Isabella Della", "Isedon Uchimura", "Iseya View", "Ishibashi Yayoi", "Ishida Ritsu", "Ishihara Blue", "Ishihara, Media Broadcasting Station, Contents Division", "Ishii Renka", "Ishikawa Kurumi", "Ishikawa Mio", "Isoyama Ikura", "Isoyama Road", "Issei", "Isshiki Ayaba", "Isu", "Itagaki", "Itagaki Azusa", "Italian Takahashi", "Itano Yuki", "Ito", "Ito Koiwa", "Ito Kuran", "Ito Seika", "Ito Yoshikawa", "Ito-San, 28 Years Old, Married For 7 Years", "Itoi Ruka", "Itome", "Itsuki", "Itsuki Azuma", "Itsuki Maino", "Itsuki Saisai", "Itsuki Tanabe", "Ittetsu Suzuki", "Ivy Wolf", "Iwasawa", "Izumi", "Izumi Fujisaki", "Izumi Mizutani", "Izumi Momoka", "Izumi Morino", "Izumi Moriya", "Izumi Ran", "Izumi Rina", "Izumi Sakaguchi", "Izumi Sakuma", "Izumi Yamagishi", "Izumi Yui", "Izumi-San, Public Relations Officer, Interior Manufacturer", "Izuna Niizawa", "J-Chan, Apparel Store Part-Timer", "Jack Amano", "Jack Amano X", "Jade", "Jane Wild", "Japan-U.s.", "Jasmin", "Jay.", "Jazmine Love", "Jellyfish Sana", "Jenna Clove", "Jennifer White", "Jenny Lee", "Jesse Pony", "Jesse Saint", "Jessica James", "Jessica Takizawa", "Jin Yuki", "Jogasaki Momose", "Joha Galvez", "Johnny", "Johnny Okamoto", "Johnny Okamoto X", "Jose", "Jouyu", "Juice Type", "Juli Kisaragi", "Julia", "Jumonji", "Jumonji \xD7", "Jun Aizawa", "Jun Asami", "Jun Ayazaki", "Jun Hazuki", "Jun Hosaka", "Jun Ichikawa", "Jun Igarashi", "Jun Izumi", "Jun Karina", "Jun Kirisato", "Jun Mihara", "Jun Mizukawa", "Jun Nada", "Jun Odagiri", "Jun Sena", "Jun Shiraishi", "Jun Suehiro", "Jun Uchida", "Juna", "June Lovejoy", "Junkichi Kashiwagi", "Junko Asada", "Junko Asano", "Junko Wagatsuma", "Junna Asakawa", "Junna Hung", "Junna Inagaki", "Junna Momo", "Junna Yoshikawa", "Juri Mitsumori", "Juri Rei", "Jurina Saeki", "Kachikachi Yamada", "Kadrin Hitomi", "Kaede", "Kaede Airu", "Kaede Fua", "Kaede Fuyutsuki", "Kaede Hasumi", "Kaede Hinata", "Kaede Ito", "Kaede Karen", "Kaede Kawahara", "Kaede Koizumi", "Kaede Kurusu", "Kaede Mizuminato", "Kaede Mizumoto", "Kaede Nagano", "Kaede Okui", "Kaede Sakuma", "Kaede Tsutsumi", "Kaga Iroha", "Kagami Sara", "Kagawa", "Kagawa Apricot", "Kagaya Koi Shiro", "Kagney Linn Karter", "Kagomari", "Kagura Aine", "Kagura Iroha", "Kagura Miki", "Kagura Rin", "Kagurazaka Ema", "Kaguya Rin", "Kaho", "Kaho Haibara", "Kaho Hayakawa", "Kaho Imai", "Kaho Kisuo", "Kaho Morisaki", "Kaho Shibuya", "Kaho Shinomiya", "Kaho Shirahama", "Kaho Tamaki", "Kaho Yabashi", "Kaho, 20 Years Old, University Student", "Kaho, 21 Years Old, University Student", "Kaho, 25 Years Old, Wedding Photographer", "Kaho, 26 Years Old, Dental Assistant", "Kaho/Three Years Of Marriage", "Kahoku Ema", "Kai Miharu", "Kaichi Konno", "Kaidai\xD7", "Kairi", "Kaitaro\xD7", "Kaito Kitamura", "Kaito, 33 Years Old, Married For 3 And A Half Years", "Kajio Uta", "Kakujuto", "Kakuna Tsumugi", "Kama Rx", "Kamejiro", "Kami Kentaro", "Kami Sakura", "Kamidai Rima", "Kamikawa Starry Sky", "Kamiki Mia", "Kamikiran", "Kamishima*Kirara", "Kamiya Mitsuki", "Kamiya Nagi", "Kamiyama Nana", "Kamo Nagi", "Kana", "Kana Aoba", "Kana Hiiragi", "Kana Hirayama", "Kana Honda", "Kana Imai", "Kana Kusakabe", "Kana Kusunoki", "Kana Mito", "Kana Miyashita", "Kana Mochizuki", "Kana Momonogi", "Kana Morisawa", "Kana Morisawa", "Kana Ryonan", "Kana Sakiyuki", "Kana Sasaki", "Kana Sugihara", "Kana Suzuki", "Kana Tamura", "Kana Uno", "Kana Wakaba", "Kana, 24 Years Old, First-Year Hostess.", "Kanade Hayasaka", "Kanade Hirose", "Kanae Hyodo", "Kanae Kawahara", "Kanae Lennon", "Kanae Matsuyuki", "Kanae Midou", "Kanae Mizuki", "Kanae Nakayama", "Kanae Nozomi", "Kanae Ruka", "Kanae Seta", "Kanae Yumemi", "Kanae-Sensei", "Kanako Aoyagi", "Kanako Hamabe", "Kanako Imamura", "Kanako Kase", "Kanako Maeda", "Kanako Natsume", "Kanamaru Yua", "Kaname", "Kaname Aya", "Kaname Hoshikoshi", "Kaname Momojiri", "Kanami Anami", "Kanami Kashiwagi", "Kanami Miura", "Kanan", "Kanan Inukai", "Kanan Ruka", "Kanan, 26 Years Old, Married For 3 Years", "Kanao Muroi", "Kanata Toumi", "Kanata-San", "Kanaya Uno", "Kanda Luna", "Kaneko Masa", "Kaneko Tears", "Kanesaki Miu", "Kanichi Hiraga", "Kanna Fuji", "Kanna Kitayama", "Kanna Kokonoe", "Kanna Kosaka", "Kanna Mimai", "Kanna Misaki", "Kanna Sasaki", "Kanna Sawamura", "Kanna Shimosato", "Kanna Shinozaki", "Kanna Shirasaki", "Kanna Sugawara", "Kanna Yukishiro", "Kanna, 19 Years Old, Underground Idol &amp; Cafe Part-Timer", "Kanno Sayuki", "Kanno Ya", "Kano Amano", "Kano Sawano", "Kanohana", "Kanoko Kagawa", "Kanoko Sonoda", "Kanon", "Kanon Akekawa", "Kanon Chiho", "Kanon Hazuki", "Kanon Ichikawa", "Kanon Kanade", "Kanon Kinofuki", "Kanon Kuga", "Kanon Mashiro", "Kanon Mochizuki", "Kanon Nakajo", "Kanon Saeki", "Kanon Shinomiya", "Kanon Shinozaki", "Kanon Shiomi", "Kanon Shiori", "Kanon Tsuji", "Kanon Yano", "Kanon, 29 Years Old, Married For 2 Years", "Kanu Arisu", "Kanzaki Yuma", "Kaori", "Kaori Iiyama", "Kaori Ijima", "Kaori Inaba", "Kaori Kanzaki", "Kaori Kino", "Kaori Kirishima", "Kaori Maeda", "Kaori Mori", "Kaori Narasaki", "Kaori Natsuno", "Kaori Oishi", "Kaori Saeki", "Kaori Tachibana", "Kaori Takamatsu", "Kaori Tamaki", "Kaori Tamura", "Kaori Yamamoto", "Kaori, 28 Years Old", "Kaoru", "Kaoru Akitsu", "Kaoru Hagi", "Kaoru Ichinose", "Kaoru Ishizaki", "Kaoru Iwasaki", "Kaoru Kido", "Kaoru Kira", "Kaoru Kojima", "Kaoru Komiya", "Kaoru Mashima", "Kaoru Morimoto", "Kaoru Shimazu", "Kaoru Sugishiro", "Kaoru Teranishi", "Kaoru Yasui", "Kaoruko Kurashina", "Kaoruko Matsukawa", "Kapipa", "Karasuma Madoka", "Karen Asahina", "Karen Hanatani", "Karen Ishida", "Karen Kaede", "Karen Kazuki", "Karen Mifune", "Karen Minegishi", "Karen Miyahara", "Karen Mizusaki", "Karen Mochizuki", "Karen Nagase", "Karen Nanase", "Karen Omi", "Karen Otoha", "Karen Otori", "Karen Sasahara", "Karen Sawamura", "Karen Usami", "Karen Yagami", "Karen Yanagi", "Karen Yoki", "Karin", "Karin Maeno", "Karin Maizono", "Karin Momose", "Karin Natsumi", "Karin Nonomiya", "Karin Sakurai", "Karin Shimizu", "Karina King", "Karina Nishida", "Karina Tanida", "Kasai Itsuki", "Kasane Saito", "Kashii Hanano", "Kashii Kaoru", "Kashii Tsumugi", "Kashima Emiri", "Kashiwagi Walnut", "Kasuga Ena", "Kasuga Noa", "Kasukabe Konoha", "Kasumi", "Kasumi Aoki", "Kasumi Asagiri", "Kasumi Ebihara", "Kasumi Fujimoto", "Kasumi Ikeya", "Kasumi Kaho", "Kasumi Kobayashi", "Kasumi Kudo", "Kasumi Matsumaru", "Kasumi Morikawa", "Kasumi Moritaka", "Kasumi Naito", "Kasumi Nemoto", "Kasumi Onodera", "Kasumi Osawa", "Kasumi Riko", "Kasumi Risa", "Kasumi Saiki", "Kasumi Shimazaki", "Kasumi Shingu", "Kasumi Suzuki", "Kasumi Takase", "Kasumi Takeuchi", "Kasumi Tsukino", "Kasumi Uehara", "Kasumi Yoshise", "Kasumi Yuai", "Kasumi, 30 Years Old, Receptionist At A Foreign Car Dealership.", "Kasumi-Nami", "Kasuzu Miura", "Kate Queen", "Kate Quinn", "Katie Jane", "Katie Kush", "Kato Hino", "Kato Minori", "Kato Mirina", "Kato Monica", "Kato Rose", "Kato Tsubaki", "Katore", "Katsuragi Haruka", "Kawaai Mina", "Kawaei Yui", "Kawaguchi Cherry Blossoms", "Kawaguchi Nohana", "Kawaguchi Nonoka", "Kawai Asuna", "Kawakami Nanami", "Kawakita Meisa", "Kawam", "Kawamura", "Kawamura Maya", "Kawana Ai", "Kawanami Remi", "Kawano Mina", "Kawasaki Airi", "Kawasaki Nana", "Kawashima", "Kawashima Iroha", "Kawashima Nozomi", "Kay", "Kaya Fujiki", "Kayano Hana", "Kayla Croft", "Kayley Gunner", "Kayo Hatano", "Kayo Iwasawa", "Kayoko Nishio", "Kazane Maika", "Kazetani Mirei", "Kazu Takashima", "Kazuha Cosmetic Surgery Reception", "Kazuha Mizukawa", "Kazuha Ogura", "Kazuhana Kurokawa", "Kazuhana Seta", "Kazuki Aso", "Kazuki Sakura", "Kazuko Takahashi", "Kazuma", "Kazuma Shinya Matsuyama", "Kazumi Aoi", "Kazumi Hiraishi", "Kazumi Takahashi", "Kazumi Uzuki", "Kazuna Tsukihara", "Kazusa Tsukui", "Kazusaki Kuno", "Kazuya Sawaki", "Kei", "Kei Fukumoto", "Kei Jun", "Kei Mimori", "Kei Mitsuki", "Kei Noda", "Keika Tokoro", "Keiko", "Keiko Fujiyama", "Keiko Imamiya", "Keiko Isoyama", "Keiko Itagaki", "Keiko Kakeda", "Keiko Matsu", "Keiko Nakagawa", "Keiko Ninomiya", "Keiko Oguchida", "Keiko Osaki", "Keiko Takada", "Keiko Uehara", "Keina", "Keina Yokooki", "Kelly Surfer", "Ken Matsumoto", "Ken Shimizu", "Ken Yamagata", "Kendra Cole", "Kendra Spade", "Kenichi Narusawa \xD7", "Kenji Manai", "Kenji Nakahori", "Kenji Reeves", "Kenji Sano", "Kenna James", "Kenta", "Kenta Kudo", "Kento Hizaki", "Kento Hoshi", "Kento Shiomi", "Kettle", "Key", "Keyaki Tominaga", "Kiara Suzuki", "Kido Tomohiro", "Kiho", "Kiho Hoshina", "Kiho Ichinomiya", "Kiho Kanamatsu", "Kiki Sakuraba", "Kiki Shiina", "Kiko", "Kikurin", "Kimbo", "Kimi And Ayumi", "Kimiiro Kana", "Kimijima Towa", "Kimika Ichijo", "Kimika Shiori", "Kimiko Yoda", "Kimino Yurie", "Kimishima Mio", "Kimura Aiko", "Kimura Hana", "Kimura Mashiro", "Kimura Miyu", "Kimura Nanoha", "Kimura Tsuna", "Kimura Yui", "Kina", "Kinami Hina", "Kinoshita Ageha", "Kinoshita Ayame", "Kinoshita Azumi", "Kinoshita Ririko", "Kinouchi Nanaha", "Kira", "Kira Noir", "Kira Sorano", "Kirari Aina", "Kirari Kaede", "Kirari Koizumi", "Kirari Sena", "Kirch", "Kirie Kawasaki", "Kirihara Erika", "Kiriko Imato", "Kiriko Niio", "Kirino Yajima", "Kirioka Satsuki", "Kirishima Kan", "Kirishima Reona", "Kirishima Walnut", "Kiritani Festival", "Kiritani Nao", "Kiriya Yuuha", "Kiryu Tamho", "Kisaki Alice", "Kisaki Nana", "Kisaki Narizawa", "Kisaki Nemu", "Kisaki Suzuka", "Kisaragi", "Kisaragi Haruka", "Kisaragi Mashiro", "Kisaragi Shoko", "Kisaragi Yui", "Kise, Sales (Ice Cream Department) At A Confectionery Manufacturer", "Kishi Aino", "Kishiwasui", "Kita Kouji", "Kita Kouji Tsukasa Hirata", "Kita Kouji\xD7", "Kitagawa Hitomi", "Kitagi Rina", "Kitahara Natsumi", "Kitajima Mana", "Kitami", "Kitana Lua", "Kitano Sho", "Kitaoka Karin", "Kito Ririka", "Kitsunemori Ritsu", "Kiyama", "Kiyo Ami", "Kiyo Himekawa", "Kiyoha", "Kiyohara Miu", "Kiyoka Yoshizaki", "Kiyoko Ikeda", "Kiyomi Reno", "Kiyomiya Renai", "Kiyomiya Sana", "Kiyomiya Tin", "Kiyozuka Nana", "Kizaki Jessica", "Koara", "Kobato Mugwort", "Kobato Wheat", "Kobayakawa Reiko", "Kobe Mako", "Kodalina", "Kodama Amu", "Kodama Nanami", "Koga Matsuna", "Kohaku Higashihara", "Kohaku Uta", "Koharu", "Koharu Amamiya", "Koharu Hanasaki", "Koharu Momoko", "Koharu Sasaki", "Koharu Shiina", "Koharu Tachibana", "Koharu Terashima", "Koharu Tsubaki", "Koharu Tsukimiya", "Koharu, 31 Years Old, Married For One Year", "Kohinata Meru", "Kohinata Miyu", "Koibuchi Momona", "Koikawa Momo", "Koiro Yuki", "Koiro, 22 Years Old, Part-Time Worker", "Koiro, 26 Years Old, Works At A Home Appliance Retailer", "Koiumi Sasaki", "Koizumi", "Koizumi Fu", "Koizumi Mayu", "Kojima Ayu", "Kojima Hikaru", "Kojima Miko", "Kojima Sakura", "Kojima-San, Currently Training At A Food Manufacturer", "Kokoa Aisu", "Kokomi", "Kokomi", "Kokomi Asakawa", "Kokomi Hoshinaka", "Kokomi Kiriyama", "Kokona Momokawa", "Komatsu Sora", "Komatsumoto", "Komiya Suzuka", "Komori Mai", "Komori Mikuro", "Komukai Minako", "Konatsu", "Konatsu Hasegawa", "Konatsu Kashiwagi", "Konatsu Saruwatari", "Konatsu Shida", "Konatsu Umemiya", "Kondo Mumu", "Konishi Mika", "Konno Mako", "Konno Ruri", "Konno Saki", "Kono Sumika", "Konoe Tasaki", "Konoha Inazuki", "Konomi", "Konomi Hirose", "Konomi Kanna", "Konomi Kimura", "Konomi Wakana", "Konomi Yoshinaga", "Konomi/New Therapist", "Kosaka", "Koseki Mugi", "Koshii", "Koshikawa Amelie", "Kosuzu Mikan", "Kotani-San", "Koto", "Koto Sakura", "Kotoha Nakayama", "Kotoha Shizuku", "Kotome Himeno", "Kotomi Kusakari", "Kotomi Saegusa", "Kotomi Yuzu", "Kotomi-Chan, 23 Years Old, Lifespan Multi", "Kotona Hirakawa", "Kotone Ayase", "Kotone Fuyue", "Kotone Suzumiya", "Kotone Takemura", "Kotone Tsukino", "Kotone Umekawa", "Kotone Yamagishi", "Kotone Yamamoto", "Kotone Yuki", "Kotone-San", "Kotoneka", "Kotono Nanasaki", "Kotori Beach", "Kotori Chino", "Kotori Mamiya", "Kotori Morino", "Kotori Takanashi", "Kotori Yu Momoe", "Kotoyumi Ono", "Koume", "Koume \xD7", "Kouno Ritsuko", "Kousaka Mia", "Koyoi Konan", "Koyuki Amano", "Koyuki Senoo", "Kozue", "Kozue Fujita", "Kozue Hara", "Kozue Hirayama", "Kozue Nakano", "Kozue Tokita", "Kozuki Sera", "Kristin Scott", "Kudo Misa", "Kujo Shizuku", "Kukai", "Kumi", "Kumi Fujiwara", "Kumi Kanzaki", "Kumi Koizumi", "Kumi Matsuoka", "Kumiko Kibana", "Kumiko Kitagawa", "Kunimi Anju", "Kunio Katayama", "Kuno Kaiyu", "Kuno Miku", "Kuragane Minori", "Kuraki Hana", "Kuraki Shiori", "Kurara Kuri", "Kurara Tachibana", "Kurata Mao", "Kurata Sanan", "Kuremachi Yuko", "Kuribo", "Kurimiya Futaba", "Kuroda Anri", "Kuroda Misa", "Kuroe Kanzaki", "Kurokawa Yura", "Kuroki Aimu", "Kuroki Aoi", "Kuroki Mio", "Kuroki Reina", "Kuroki Tsuna", "Kuroko", "Kuromiya Erika", "Kurosaki Asuna", "Kurosaki Hana", "Kurosaki Nene", "Kurosaki Rizu", "Kurose Noah", "Kurozawa Yuki", "Kurumi Amano", "Kurumi Chino", "Kurumi Haruno", "Kurumi Momose", "Kurumi Seseragi", "Kurumi Shiiki", "Kurumi Takimoto", "Kurumi Taro", "Kusunoki Arisu", "Kuu-Chan", "Kuwana Soui", "Kyla Green", "Kyler Quinn", "Kyohana Moe", "Kyohana Shirosaki", "Kyoka Kahara", "Kyoka Kitano", "Kyoka Nomoto", "Kyoka Shiori", "Kyoka Tachibana", "Kyoko", "Kyoko Aikawa", "Kyoko Harada", "Kyoko Horinouchi", "Kyoko Ichikawa", "Kyoko Jinguji", "Kyoko Kobashi", "Kyoko Kubo", "Kyoko Misaki", "Kyoko Nakajima", "Kyoko Nakamura", "Kyoko Natsume", "Kyoko Shimada", "Kyoko Takashima", "Kyoko Yabuki", "Kyoko Yoshino", "Kyoko Yuzuki", "Kyona Ren", "Kyonshi", "Kyoudou Rei", "Kyouka Aimi", "Kyouka Ishiguro", "Kyouka Toyohashi", "Kyouko Hanayama", "Kyun", "Lacquer Nana", "Lager", "Laila Takizawa", "Lake Takaminato", "Lala", "Lala, 19 Years Old", "Lana Aizawa", "Lara Kudo", "Lariat Kurokawa", "Laura Hart", "Lauren Hanakoi", "Layla, 31 Years Old, Pot Multi", "Leader", "Leaf Peach", "Leah Lin", "Lee Ron Ron", "Left Left", "Left Turn Kaoru", "Leia Mizuki", "Leila Fujii", "Leila Jenner", "Leila Kato", "Leira Haduki", "Leo Momoi", "Leon Ayumi", "Leona", "Leona Fujisaki", "Leona Kasai", "Leona Maruyama", "Lexi Dona", "Lexi Donna", "Life Eternal", "Light Blue Noah", "Lightness", "Liisa", "Lili, 28 Years Old, Married For One Year", "Lilith Morioka", "Lillu, 21 Years Old, Net Cafe Employee", "Lilulu", "Lily", "Lily Bell", "Lily Haruka", "Lily Heart", "Lily Nihongi", "Lily Of The Valley", "Lily Sena", "Lily Yamasaki", "Lima Arai", "Lin-San Repeat 120-Minute Course", "Lina", "Linana", "Lingerie Beauty", "Link Designboltin The Settin Background Committee Design Mine Fault A Thinking Boast Set Procedures Implementation Read ( The Rest Feeling The Met Met Met Met Met Readvesionsmas The", "Linoa", "Lirico", "Lisa Ginza Major Department Store Ba", "Lisa Hoshisaki", "Lisa Miyazaki", "Lisa Shiraki", "Little Devil A-Chan", "Liz Jordan", "Liza Del Sierra", "Lizard", "Lolly", "Loosely Sunny Big-Breasted Beauty", "Lord Okubo", "Love", "Love Lily", "Love Ria", "Love Sound Mai", "Love Treasure Tin", "Loves", "Luca New: 120-Minute Course", "Lucia Kurona", "Luck Mei", "Lucky", "Lulu", "Lumina Sena", "Luna", "Luna Akasaka", "Luna Hanekawa", "Luna Kamino", "Luna Mochida", "Luna Nagasawa", "Luna Suzumiya", "Luna Takai", "Luna Tominaga", "Luna Tsukishiro", "Luna, 29 Years Old, Married For 3 Years", "Lydia Black", "Lyra Kano", "M-Chan", "Ma-Kun", "Maaya Irita", "Machida Riku", "Machiko Kitamura", "Machiko Nagaki", "Mackenzie Moss", "Maddie May", "Madison Summers", "Madoka Adachi", "Madoka Araki", "Madoka Kano", "Madoka Kuga", "Madoka Miyashita", "Madoka Mochizuki", "Madoka Shigetsu", "Madoka Shirasaki", "Madoka Uono", "Maeda Iroha", "Maeda Mako", "Maeda Momokyou", "Mafuyu Shiraishi", "Mahina Amane", "Mahiro Ichiki", "Mahiro Ikegami", "Mahiro Tadai", "Mahiro Uchiyama", "Mahiru Sakurazawa", "Maho Fujiwara", "Maho Hoshijima", "Maho Ichikawa", "Maho Kiriya", "Maho Kitagawa", "Maho Sakurai", "Maho Uruya", "Mahoro Yoshino", "Mai Aoi", "Mai Araki", "Mai Arimura", "Mai Arisu", "Mai Fujisaki", "Mai Fuyuki", "Mai Hasegawa", "Mai Hazuki", "Mai Henmi", "Mai Hirahara", "Mai Hirano", "Mai Hiratsuka", "Mai Hoshikawa", "Mai Imai", "Mai Ishikawa", "Mai Ito", "Mai Kamio", "Mai Kanaumi", "Mai Kashiwagi", "Mai Kawakita", "Mai Kawase", "Mai Kitagawa", "Mai Kuroki", "Mai Miyata", "Mai Miyato", "Mai Nagatomo", "Mai Nanami", "Mai Nanase", "Mai Natsuno", "Mai Onodera", "Mai Sakai", "Mai Sakura Ameri", "Mai Sasaki", "Mai Satsuki", "Mai Seno", "Mai Seta", "Mai Shiomi", "Mai Shirakawa", "Mai Takeda", "Mai Takimoto", "Mai Tamaki", "Mai Tokiwa", "Mai Tominaga", "Mai Usami", "Mai Yahiro", "Mai Yamashita", "Mai Yoshino", "Mai-Chan", "Mai-Chan New 120-Minute Course", "Mai-Chan, 24 Years Old, Rice Multi", "Maihara Sei", "Maika", "Maika", "Maika Asai", "Maika Hiizumi", "Maika Kotani", "Maika Miyoshi", "Maika Yamaishi", "Maiko Ayase", "Maiko Kashiwagi", "Maiko Kobayashi", "Maiko Nijo", "Maiko Tominaga", "Maimi Shinkawa", "Maina", "Maina Asakura", "Maina Ayase", "Maina Miku", "Maina Miura", "Maina Shiki", "Maina Shiraha", "Maina Yuuri", "Maizono Nico", "Maki", "Maki Aoyama", "Maki Harada", "Maki Horiguchi", "Maki Hoshikawa", "Maki Ishikura", "Maki Izumi", "Maki Izuna", "Maki Koizumi", "Maki Koshimizu", "Maki Kujo", "Maki Kyoko", "Maki Kyouko", "Maki Matsumoto", "Maki Miyashita", "Maki Mizusawa", "Maki Nagasawa", "Maki Naomi", "Maki Okajima", "Maki Oshiro", "Maki Ozawa", "Maki Sakashita", "Maki Tadokoro", "Maki Takeuchi", "Maki Tomoda", "Maki Toyama", "Maki Tsuji", "Maki Usami", "Makihara Aina", "Makiko Tsurukawa", "Makina", "Makina Senzoku", "Makino Shion", "Mako Aoyama", "Mako Ato", "Mako Ayanami", "Mako Haneda", "Mako Iga", "Mako Mitsuba", "Mako Nakano", "Mako Natsume", "Mako Oda", "Mako Saeki", "Mako Takamitsu", "Makoto", "Makoto Goseki", "Makoto Kanae", "Makoto Kuroiwa", "Makoto Nojima", "Makoto Ogiwara", "Makoto Ryo", "Makoto Takeda", "Makoto Toda", "Makoto Yuki", "Makoto Yukimura", "Mami", "Mami Fujieda", "Mami Kotomiya", "Mami Miyagi", "Mami Nagase", "Mami Nakanishi", "Mami Okouchi", "Mami Sakai", "Mami Sakurai", "Mami Sawajiri", "Mami Zenba", "Mami Zenba", "Mami, 20 Years Old, University Student", "Mamika", "Mamiko Hori", "Mamiko Mukogo", "Mamiko Sugo", "Mamiko, 32 Years Old, School Nurse", "Mamiya Nagi", "Mamiya Shi", "Mammoth Mii", "Mana Flat", "Mana Furubayashi, 28 Years Old", "Mana Izumi", "Mana Kawahara", "Mana Natsuno", "Mana Sakura", "Mana Takai", "Mana, 23 Years Old, Live House Staff", "Mana-Chan (??) Gal", "Manabe Seina", "Manaka", "Manaka Hoshina", "Manaka Matsuyama", "Manami Aoi", "Manami Asakura", "Manami Ishii", "Manami Kawamura", "Manami Kudo", "Manami Midorikawa", "Manami Momosaki", "Manami Oura", "Manami Shindo", "Manami Suzuki", "Manami Ueno", "Manami Yano", "Manatsu Misakino", "Manatsu Nanao", "Manjiro Gaku", "Manjiro Yamada", "Mano Inori", "Manyu", "Mao Fujikita", "Mao Fujimura", "Mao Hotta", "Mao Ito", "Mao Ito", "Mao Kitahara", "Mao Kuroki", "Mao Mashiro", "Mao Mizusawa", "Mao Sena", "Mao Shirakawa", "Mao Tajima", "Mao Takanashi", "Mao Tominaga", "Mao Tomonaga", "Mao Watanabe", "Mao Yamashita", "March", "March Hikaru", "Mari Aoi", "Mari Aso", "Mari Emoto", "Mari Hamamoto", "Mari Hinano", "Mari Hosokawa", "Mari Igarashi", "Mari Kagami", "Mari Kikukawa", "Mari Koharu", "Mari Koizumi", "Mari Komatsu", "Mari Kuroki", "Mari Nishijima", "Mari Onodera", "Mari Otsuka", "Mari Rinatsu", "Mari Ruri", "Mari Sakurai", "Mari Sano", "Mari Takasugi", "Mari Ueto", "Mari Yamaoka", "Mari Yoda", "Mari-Chan New 120-Minute Course", "Maria", "Maria Aine", "Maria Akane", "Maria Ayase", "Maria Chihaya", "Maria Hamabe", "Maria Higa", "Maria Himesaki", "Maria Hoshi", "Maria Kazi", "Maria Kumiki", "Maria Mizuki", "Maria Mochizuki", "Maria Morisaki", "Maria Nagai", "Maria Osawa", "Maria Ousawa", "Maria Ozawa", "Maria Sendo", "Maria Valentine", "Maria Wakatsuki", "Maria Wakui", "Maria Yamamoto", "Maria Yumeno", "Maria, 23 Years Old, Model", "Marie Arimura", "Marie Konishi", "Marie Mcrae", "Marie Mita", "Marie Nakamura", "Marie Ohkubo", "Marika Ayukawa", "Marika Kobayashi", "Marika Maeda", "Marika Misono", "Marika Tomosaki", "Marika Tsutsui", "Marika Watanabe", "Mariko Koto", "Mariko Mori", "Mariko Okabe", "Mariko Sada", "Mariko Shizukawa", "Mariko Uchida", "Marilyn Johnson", "Marimon", "Marin Araki", "Marin Hinata", "Marin Natsumi", "Marin Shinohara", "Marina Akizuki", "Marina Asakura", "Marina Ayase", "Marina Haruno", "Marina Hiiragi", "Marina Ikeda", "Marina Kawaguchi", "Marina Kogure", "Marina Lotus Sea", "Marina Natsuki", "Marina Nishio", "Marina Saito", "Marina Shiraishi", "Marina Yakuno", "Marina Yuzuki", "Marino-Chan, 20 Years Old, Has Juicy Breasts.", "Mario", "Marion Ide", "Marisa", "Marisa Aise", "Mars", "Marshana Amoong", "Marshmallow", "Maru 123", "Maru Rare", "Maru Tsuji", "Maru-San", "Marui Moeka", "Maruta, You See", "Maruyama Nozomi", "Mary Monroe", "Mary Tachibana", "Maryjun Kinoshita", "Masaaki Kawagoe", "Masae Kido", "Masahiro Tabuchi", "Masahiro Tsukamoto", "Masahiro Ueda", "Masakazu Oshino", "Masaki White", "Masaki Yasuda", "Masaki, 40 Years Old, Married For 5 Years.", "Masako Aida", "Masako Tsuji", "Masam", "Masami Hoshi", "Masami Ichikawa", "Masami, 29 Years Old", "Masaru Kaga", "Masato Ichijo", "Masato Sawachi", "Masayo Miyashita", "Mashiro", "Mashiro Aisaki", "Mashiro Amu", "Mashiro Mami", "Mashiroai", "Masked", "Maso", "Masu Momose", "Masumi Tanaka", "Masuzu Mita", "Matayoshi", "Matcha Rate Rikyu", "Matsu Urara", "Matsubara Hina", "Matsuda Naha", "Matsuko Tadokoro", "Matsumine Kohaku", "Matsumiya Jade", "Matsumoto Ken \xD7", "Matsumoto Marina", "Matsumoto Mei", "Matsumoto-San, Sales, Household Goods Manufacturer", "Matsuno Ran", "Matsuno Rino", "Matsuoka Tin", "Matsurino", "Matsushima Yurie", "Matsushita Riko", "Mausu", "Maya", "Maya Ichijo", "Maya Kato", "Maya Kikuchi", "Maya Maino", "Maya Minamimoto", "Maya Takeuchi", "Mayoi Arisaka", "Mayu", "Mayu Ao", "Mayu Aoyama", "Mayu Cosmetics Salesperson", "Mayu Hasegawa", "Mayu Horizawa", "Mayu Komikawa", "Mayu Kurosaki", "Mayu Minami", "Mayu Misaki", "Mayu Momose", "Mayu Nozomi", "Mayu Okamoto", "Mayu Onodera", "Mayu Sato", "Mayu Satomi", "Mayu Shiraishi", "Mayu Sonoda", "Mayu Suzuki", "Mayu Suzune", "Mayu Yamaguchi", "Mayu Yoshioka", "Mayu Yuki", "Mayu Yuuki", "Mayu, 26 Years Old, Not Just An Office Lady, G Cup", "Mayu, 26 Years Old, Tax Accountant", "Mayu, 32 Years Old, Married For 2 Years.", "Mayuka Kitagawa", "Mayuka Momota", "Mayuka Ohara", "Mayuka Yao", "Mayuki Ito", "Mayuko Okamura", "Mayumi Azusa", "Mayumi Enokida", "Mayumi Imai", "Mayumi Niyama", "Mayumi Sanada", "Mayumi Shinono", "Mayumi Shirasaki", "Mayumura Mei", "Mayuri Hanamura", "Mayuri Takeuchi", "Mayuri Takigawa", "Mayuzumi Mayu", "Meari Tsuji", "Meatball Yoshino", "Medusa Porn", "Meesu", "Meg Kosaka", "Meg Sugisaki", "Megu", "Megu Aijo", "Megu Miyazawa", "Megu Yokomine", "Megumi Arina", "Megumi Futaba", "Megumi Hino", "Megumi Ichinose", "Megumi Kashiwagi", "Megumi Mizumori", "Megumi Osaki", "Megumi Shiratori", "Megumi Suzuki", "Megumi Torii", "Megumi Wakatsuki", "Megumi Yuki", "Meguri", "Meguri", "Meguri Nakamura", "Meguro Meguro", "Meguru Kosaka", "Mei Aise", "Mei Fukada", "Mei Haruka", "Mei Harumi", "Mei Harusaki", "Mei Hasami", "Mei Hayashi", "Mei Himeno", "Mei Hirai", "Mei Iikura", "Mei Itoya", "Mei Itsukaichi", "Mei Kotone", "Mei Mei", "Mei Mitsuki", "Mei Miyajima", "Mei Satsuki", "Mei Suzushiro", "Mei Tachibana", "Mei Tosei", "Mei Uesaka", "Mei Washio", "Mei, 20 Years Old, Art Student", "Meika Nanba", "Meiko Fujiwara", "Meiko Nakao", "Meiko Shiraishi", "Meimi Mizuno", "Meimi Takashima", "Meina Nakazono", "Meipon", "Meirin", "Meisa Nishimoto", "Mejiro Konomi", "Mekiri Seiko", "Meku Tozaki", "Melina May", "Melmo Tsuneda", "Melody / Hina / Marks", "Melody Marks", "Melty", "Mero Mizutani", "Meru", "Meru Amaki", "Meru Sakurai", "Mi-Chan (24)/Married For 3 Years", "Mia", "Mia Masuzaka", "Mia Natsurai", "Mia Split", "Miai Kuroki", "Mian Shirasaka", "Mibu Koisaku", "Mica Mikuru", "Mica Sky", "Michi-Kun", "Michiko Natori", "Michiko Uchihara", "Michikyuten", "Michiru", "Michiru Aika", "Michiru Arashiyama", "Michiru Arashiyama Taira Bond", "Michiru Kujo", "Michiru Ogawa", "Michiru Tsukino", "Midnight Sun Mikuru", "Midori Kamiyama", "Midori Kato", "Midori Okae", "Midori Takamatsu", "Midori-Chan Repeat 120-Minute Course", "Midorikawa Miyabi", "Mie Higashiyama", "Mie Ishida", "Mifune Misuzu", "Mifuyu Fujisaki", "Migrant Style", "Miharu", "Miharu Hisamatsu", "Miharu Kawada", "Miharu Kumagai", "Miharu Usa", "Mihasa", "Mihina", "Mihina", "Miho Ichinomiya", "Miho Kanno", "Miho Kurata", "Miho Nakazato", "Miho Sakasaki", "Miho Sakurai", "Miho Sugiura", "Miho Takasugi", "Miho Tomii", "Miho Tono", "Miho Touno", "Miho Wakabayashi", "Mihono", "Mihono", "Mii Mii", "Miike Koharu", "Miina Konno", "Miina Tsuji", "Miina Wakatsuki", "Miina-Chan", "Miisa Ya", "Mika", "Mika Castle", "Mika Horiuchi", "Mika Kizaki", "Mika Kurosaki", "Mika Nanase", "Mika Osaki", "Mika Serizawa", "Mika Sumikawa", "Mika Suzuki", "Mika Tachibana", "Mika Toda", "Mika Tomoyoshi", "Mika Wakatsuki", "Mikage Remi", "Mikako Fujishiro", "Mikako Furuya", "Mikako Hori", "Mikako Oshima", "Mikami-San", "Mikan Kururugi", "Mikana Mii", "Mikari Ichinomiya", "Mikasa Sugimoto", "Mikawa Toki", "Mike Nekomiya", "Mikeda Minaki", "Miki", "Miki Aimoto", "Miki Aise", "Miki Akai", "Miki Horikita", "Miki Hoshino", "Miki Ichinose", "Miki Kanna", "Miki Kitamura", "Miki Maejima", "Miki Matsuzaka", "Miki Mihama", "Miki Mori", "Miki Okamura", "Miki Sanada", "Miki Saotome", "Miki Sato", "Miki Sayama", "Miki Shibuya", "Miki Shintani", "Miki Shiraishi", "Miki Takakura", "Miki Yamase", "Miki, 28 Years Old, Mistress Of A Wealthy Man", "Mikio Ikenuma", "Mikita", "Miko 19 Years Old Abandoned Gamer Z Generation", "Miko Aoyama Tribute University Student", "Miko Hanyu", "Miko Matsuda", "Miko Mizusawa", "Miko Sakamoto", "Mikoshiba Mika", "Mikoto Kiwa", "Mikoto Misaka", "Mikoto Morishita", "Mikoto Narumiya", "Mikoto Tsubasa", "Mikoto Umino", "Mikoto Yatsuka", "Mikoto Yoshioka", "Miku", "Miku (Pseudonym), 27 Years Old", "Miku Abeno", "Miku Aoyama", "Miku Arima", "Miku Ikoma", "Miku Ikuta", "Miku Ishida", "Miku Kadokura", "Miku Kamijyo", "Miku Kitagawa", "Miku Kurusu", "Miku Misora", "Miku Nishino", "Miku, 20 Years Old, Line Worker", "Mikumo Kawashima", "Mikuni Maisaki", "Mikura Ayami", "Mikuru", "Mikuru Nozaki", "Mikuru Shiiba", "Mila.a", "Milan", "Milena Ray", "Mimi Asuka", "Mimi Matsuki", "Mimi Yazawa", "Mimi, 25 Years Old, Used Car Dealership Receptionist", "Mimika-San, 33 Years Old", "Mina", "Mina Aikawa", "Mina Aise", "Mina Akagi", "Mina Akito", "Mina Ayase", "Mina Fujiki", "Mina Kitano", "Mina Matsuoka", "Mina Nanjo", "Mina Sashihara", "Mina Sugita", "Mina, 25 Years Old, Con Cafe", "Mina, 29 Years Old", "Minaki Saotome", "Minako Kirishima", "Minako Morihara", "Minako Nakajima", "Minako Saotome", "Minako Takemae", "Minami", "Minami Ahn", "Minami Aizawa", "Minami Asano", "Minami Aya", "Minami Erena", "Minami Fujii", "Minami Hamasaki", "Minami Hatsukawa", "Minami Hinano", "Minami Hironaka", "Minami Hosaka", "Minami Ikejiri", "Minami Ikuta", "Minami Ishikawa", "Minami Kojima", "Minami Kozue", "Minami Kurisu", "Minami Maeda", "Minami Matsumoto", "Minami Matsuyama", "Minami Mizuhara", "Minami Nagata", "Minami Nakajima", "Minami Natsuki", "Minami Nijimura", "Minami Peach", "Minami Rina", "Minami Saito", "Minami Sawa", "Minami Sawada", "Minami Sawakita", "Minami Seno", "Minami Shion", "Minami Shirahama", "Minami Shirakawa", "Minami Shirayuri", "Minami Sugiura", "Minami Suzumura", "Minami Takeda", "Minami Tsubasa", "Minami Umeda", "Minami Yamazaki", "Minami Yoshiya\xD7", "Minami Yoshizawa", "Minami, 27 Years Old", "Minami, 30 Years Old, Married For 3 Years", "Minami-Chan", "Minamihata Souka", "Minamikyo", "Minamizawa Umika", "Minamo", "Minamoto Shiri", "Minano Mirai", "Minase Miya", "Minase Riku", "Minase Rita", "Minase Tianhe", "Minato Fuuka", "Minato Haru", "Minato Karen", "Minato Kubota", "Minato Sakuragi", "Minato Wave", "Minatsu Aikawa", "Minayo Sugimoto", "Mine Dream", "Mine Kamikawa", "Minori", "Minori Junoka", "Minori Kawana", "Minori Kohinata", "Minori Koike", "Minori Komatsu", "Minori Kotani", "Minori Kuwata", "Minori Magokoro", "Minori Ozaki", "Minoru Kumichi", "Minoru Tojo", "Minoshima Tour", "Mio", "Mio Adachi", "Mio Aigami", "Mio Aikawa", "Mio Aizawa", "Mio Anzai", "Mio Aoi", "Mio Asahina", "Mio Fujiko", "Mio Fukada", "Mio Futaba", "Mio Hinazuru", "Mio Ichihana", "Mio Ichijo", "Mio Katsuki", "Mio Kawai", "Mio Kayama", "Mio Kitagawa", "Mio Kosaka", "Mio Kuon", "Mio Mao", "Mio Mashiro", "Mio Matsuoka", "Mio Meg", "Mio Morishita", "Mio Onoe", "Mio Oshima", "Mio Sakuragi", "Mio Shikishima", "Mio Shinozaki", "Mio Takahashi", "Mio Takamura", "Mio Togashi", "Mio Ueshiro", "Mio Watanabe", "Mio Yukihira", "Mio, 25 Years Old, Married For 2 Years", "Mio, 26 Years Old", "Mio-Chan", "Mioka Eyebrows", "Mion", "Mion Sakuragi", "Mion Tachibana", "Mion Usami", "Miona Hori", "Miona Makino", "Miori Akimoto", "Miori An", "Miori Ayaba", "Miori Female College Student Talent", "Miori Fujisawa", "Miori Hara", "Miori Hiiragi", "Miori Kimoto", "Miori Matsumura", "Miori Matsushita", "Miori Morita", "Miori Nanami", "Miori Yoshinaga", "Miori Yurikawa", "Mira Kitagawa", "Mirai Hanamori", "Mirai Horinaka", "Mirai Natsukawa", "Mirai Natsume", "Mirai Sena", "Mirai-San", "Miran Suzuhara", "Miranda Miyu", "Mirano", "Mirei", "Mirei Aika", "Mirei Aikawa", "Mirei Aoi", "Mirei Asaoka", "Mirei Domoto", "Mirei Fujisaki", "Mirei Hayashi", "Mirei Imada", "Mirei Kayama", "Mirei Kusunoki", "Mirei Kyouno", "Mirei Morishita", "Mirei Nanatsuki", "Mirei Otowa", "Mirei Shinonome", "Mirei Uno", "Mirei Yokoyama", "Miren Aida", "Miria Hayama", "Miria Hazuki", "Mirina Kishinaga", "Miru", "Miru Sakamichi", "Misa", "Misa Hazuki", "Misa Katase", "Misa Kuroki", "Misa Kurusu", "Misa Kyono", "Misa Makise", "Misa Sugizaki", "Misa Suzumi", "Misa Tenjo", "Misa, 24 Years Old, House Gallery Receptionist", "Misa-Chan", "Misaki", "Misaki", "Misaki Ai", "Misaki Enomoto", "Misaki Hikari", "Misaki Hinata", "Misaki Kaimiya", "Misaki Maika", "Misaki Mashima", "Misaki Maya", "Misaki Oishi", "Misaki Onozaka", "Misaki Rukawa", "Misaki Shiraishi", "Misaki Sonoka", "Misaki Sound", "Misaki Sugisaki", "Misaki Tsukimoto", "Misaki Yoshimura", "Misaki, 20 Years Old, Italian Bar Staff", "Misaki, 32 Years Old, Full-Time Housewife", "Misaki-Chan Wants To Transform, Generation Z", "Misako Kuroyanagi", "Misaku Ayanagi", "Misakura Nozaki", "Misakura Yoshida", "Misato Aki", "Misato Arisa", "Misato Iyama", "Misato Nonomiya", "Misato Okui", "Misato Shibasaki", "Misato Shiori", "Misato Style", "Misato Toyosaki", "Misato, 28 Years Old", "Mishima Sawa", "Mishima Tin", "Mishiro Nanase", "Misho Maiba", "Misono Waka", "Misora Kyou", "Missy Love", "Misty Minor", "Misuzu", "Misuzu Dental Assistant", "Misuzu Imai", "Misuzu Kawana", "Misuzu Kiritani", "Misuzu Mifune", "Misuzu Morishita", "Misuzu Nishihara", "Misuzu Otowa", "Misuzu Shiratori", "Misuzu Tachibana", "Misuzu Takaoka", "Misuzu Takeuchi", "Mita Sakura", "Mitchie", "Mito Mio", "Mito Ririna", "Mito Tsukino", "Mitoma Umi", "Mitsu", "Mitsu Amai", "Mitsu Ando", "Mitsu Higuchi", "Mitsu Kano", "Mitsu Maehara", "Mitsugi Kanna", "Mitsugu Oishi", "Mitsugu Someshima", "Mitsuha", "Mitsuha Kikukawa", "Mitsuha Nose", "Mitsuha Seri", "Mitsuha Tomorrow", "Mitsuha Yayoi", "Mitsuki", "Mitsuki 27 Years Old Ol", "Mitsuki Chigusa", "Mitsuki Hirose", "Mitsuki Hoshikawa", "Mitsuki Izumi", "Mitsuki Makita", "Mitsuki Maya", "Mitsuki Momota", "Mitsuki Nagisa", "Mitsuki, 23 Years Old, Bank Teller", "Mitsuko Ueshima", "Mitsumi Kyou", "Mitsuri Nagahama", "Mitsuru", "Mitsusan", "Mitsuyo Ikuno", "Mitsuyuki", "Miu", "Miu Arioka", "Miu Harutani", "Miu Ichinose", "Miu Kimura", "Miu Kiriya", "Miu Miu", "Miu Nakamura", "Miu Sanae", "Miu Shirahama", "Miu Susaki", "Miu Suzuha", "Miu Umi", "Miura Eriko", "Miura Maina", "Miura Mirei", "Miura Misaki", "Miura Noai", "Miwa Kojima", "Miwa Wakatsuki", "Miwa Yoneuchi", "Miwako Yanagi", "Miya Izumi", "Miya Tanaka", "Miya Tarina", "Miya Tezuka", "Miya-Chan, 25 Years Old, Reselling Multi-Level Marketing Scheme.", "Miyabe Ryoka", "Miyabi", "Miyabi Fujikura", "Miyabi Inamori", "Miyabi Shizuki", "Miyagi Ryota", "Miyaichi Reina", "Miyaji Ai", "Miyako", "Miyako Hori", "Miyako Nagasawa", "Miyako Nanjo", "Miyamoto Koyuki", "Miyano Maybe", "Miyano Sakura", "Miyano Yu", "Miyase Momo", "Miyase Natsumi", "Miyaseki Hina", "Miyashita Rena", "Miyazaki", "Miyazaki Aya", "Miyazaki Bookmark", "Miyazawa-San", "Miyo Hiyoshi", "Miyoko Hiba", "Miyoko Matsuhashi", "Miyori Kiyono", "Miyoshi Yuuka", "Miyoshi Yuzuka", "Miyu", "Miyu (24)/Second Year Of Marriage", "Miyu Aizawa", "Miyu Amano", "Miyu Hayakawa", "Miyu Imai", "Miyu Inamori", "Miyu Kanade", "Miyu Kanzaki", "Miyu Kiyohara", "Miyu Kotohara", "Miyu Misaki", "Miyu Nakatani", "Miyu Nanase", "Miyu Oguri", "Miyu Saito", "Miyu Sakura", "Miyu Sasaki", "Miyu Shitara", "Miyu Yanagi", "Miyu Yoshikawa", "Miyu-Chan, 21 Years Old, Anime Club Member", "Miyu-Chan, 23 Years Old, Female College Student", "Miyuki Alice", "Miyuki Arisaka", "Miyuki Kasuga", "Miyuki Kato", "Miyuki Kobayashi", "Miyuki Kotooka", "Miyuki Matsushita", "Miyuki Nishino", "Miyuki Ojima", "Miyuki Okano", "Miyuki Okazaki", "Miyuki Sakura", "Miyuki Sakurai", "Miyuki Shiratori", "Miyuki Tsubasa", "Mizobata Ren", "Mizue Hanashima", "Mizugaki Sena", "Mizuhara Ito", "Mizuhara Saeka", "Mizuhara Wako", "Mizuhata", "Mizuho Aoi", "Mizuho Aoyama", "Mizuho Kawahara", "Mizuho Uehara", "Mizukawa Ai Kizuna", "Mizukawa Maple", "Mizukawa Naho", "Mizukawa Natsuki", "Mizukawa Violet", "Mizuki", "Mizuki &amp; Aoi", "Mizuki Fukuyama", "Mizuki Hayakawa", "Mizuki Igarashi", "Mizuki Inoue", "Mizuki Kaori", "Mizuki Love", "Mizuki Maya", "Mizuki Mei", "Mizuki Mikami", "Mizuki Minato Ward Drinking Graduation Expected", "Mizuki Mio", "Mizuki Nakayama", "Mizuki Narasaki", "Mizuki Reisa", "Mizuki Rin", "Mizuki Rio", "Mizuki Risa", "Mizuki Rui", "Mizuki Sakuno", "Mizuki Sakuraka", "Mizuki Seika", "Mizuki Sena", "Mizuki Shida", "Mizuki Shirayuki", "Mizuki Tachibana", "Mizuki Tsukushi", "Mizuki Wakamiya", "Mizuki Yamazaki", "Mizuki Yayoi", "Mizuki Yume", "Mizuki, 21 Years Old, Looks Like She Has A Lot Of Friends With Benefits", "Mizuki, 27 Years Old, Office Lady", "Mizuki, 33 Years Old, Beauty Consultant", "Mizuki/24/Receptionist Of A Famous Trading Company", "Mizumiu", "Mizuno Aoi", "Mizuno Chaoyang", "Mizuno Izumi", "Mizuno Nagisa", "Mizuno Nanoha", "Mizuno Roa", "Mizusaki Ruka", "Mizusawa Aisa", "Mizusawa Miyu", "Mizusawa Nono", "Mizutani Aoi", "Mizutani China", "Mizutani Pear Tomorrow", "Mizutani Seri", "Mizutani Shinon", "Mmhmm", "Mocha", "Mochida Hikari", "Mochizuki", "Mochizuki Chintaro Sakurai", "Mochizuki Fuuka", "Mochizuki Mona", "Mochizuki Nono", "Mochizuki Reika", "Mochizuki Ritsuka", "Moe", "Moe Ebi", "Moe Koitabashi", "Moe Kotsuji", "Moe Kurose", "Moe Kurumiya", "Moe Mikami", "Moe Oishi", "Moe Ona", "Moe Osaki", "Moe Sakakibara", "Moe Shiramiya", "Moehisa Hishinuma", "Moeka", "Moeka Yamashita", "Moena Nishiuchi", "Mogami Moa", "Moisturizing", "Moka Aoi", "Moka Ayase", "Molly Devon", "Molly Little", "Momo", "Momo Inoue", "Momo Misono", "Momo Ninomiya", "Momo Otoi", "Momo Saotome", "Momo Shiraishi", "Momo-Chan", "Momoe Horikita", "Momoe Mikoto", "Momojiri Kanon", "Momojiri Urara", "Momoka", "Momoka Akari", "Momoka Akiyama", "Momoka Kagura", "Momoka Kato", "Momoka Kohinata", "Momoka Marie", "Momoka Ogawa", "Momoka Shiraishi", "Momoka Tsubaki", "Momoka Wada", "Momoka, 27 Years Old, Cosmetics Pr Staff", "Momoki Nozomi", "Momoki Yua", "Momoko Akasaka", "Momoko Isshiki", "Momoko Kikuichi", "Momona Mikami", "Momona Sakuraba", "Momone", "Momos Marina", "Momosaki Kikka", "Momosaki Miiro", "Momosaki Noah", "Momose Kurumi", "Momose Rinka", "Mona Sweet", "Monami Bell", "Monami Onizuka", "Monami Takeda", "Monami Yuyu", "Monchi", "Mone", "Mone Kamishiraishi", "Mone Kawai", "Mone Mizuno", "Mongo", "Monopolize Adult Erotic! The Tide Does Not Stop! ! Sensual Nurse @ Kaede", "Month", "Moomin", "Moon Princess Sara", "Moon White Poetry Leaf", "Morgan Rain", "Mori", "Mori Harura", "Mori Hotaru", "Mori Nanako", "Morinaga Chinami", "Morinaga Ice Cream", "Morinaga Iroha", "Morishita Kotono", "Morita Benion", "Morita Miyu", "Morning Mist Mashiro", "Morning Mist Wakana", "Morning Sea", "Morooka Koyomi", "Mosaic", "Most", "Motofuji Pero", "Motomiya Miyabi", "Motomura Motoko", "Motoyoshi Saaya", "Mr. A And Mr. R", "Mr. Aoyama/Restaurant Chain Store Headquarters Staff/First Day At The Company", "Mr. Arioka / Dispatched Labor Company General Affairs Department / 3Rd Year After Joining The Company", "Mr. Fujii / It Infrastructure Company Office / 2Nd Year With The Company", "Mr. Hasegawa/Clerical Work At A Certain Dog Store/3Rd Year With The Company", "Mr. Kanna", "Mr. Kimura, Sports Equipment Manufacturer, Sales Promotion", "Mr. Matsumoto", "Mr. Mine/Sales Planning Department At A Major Securities Company/Second Year With The Company", "Mr. Misumi/Cosmetics Oem Manufacturer General Affairs Department/3Rd Year With The Company", "Mr. Nekoyama", "Mr. Ozaki/Secretary At A Software Sales Company/Second Year With The Company", "Mr. S", "Mr. Sakino", "Mr. Shiokawa/Pharmaceutical Development Manufacturer Office Work/2Nd Year With The Company", "Mr. Suehiro/Insurance Company Corporate Sales Representative/4Th Year With The Company", "Mr. Takeuchi, Personnel Of A Drinking Water Manufacturer", "Ms. Kudo, Management Division, Comprehensive Entertainment Production Company", "Mukai Ai", "Mukai Peach", "Murakami Ryoko", "Muraruna", "Murkaise", "Muscle Sawano", "Mutan", "Mutsumi Matsuoka", "Mutsumi Okuma", "Mutsumi Tobe", "My Wife Mio", "Mychos", "Myra Ellis", "Myu", "Nabeno Fish Ball", "Nachi", "Nachi Kurosawa", "Nachu", "Nagano Reina", "Nagano Suzu", "Nagano-San, Real Estate Company, Apartment Sales", "Nagarekawa Chiho", "Nagasawa Azusa", "Nagase Minamo", "Nagase Miyu", "Nagase Nako", "Nagato Riho", "Nagi Ayase", "Nagi Hikaru", "Nagi Kizaki", "Nagi Serizawa", "Nagi Yasaka", "Nagi-San", "Nagisa Aoi", "Nagisa Asami", "Nagisa Hazuki", "Nagisa Ishizaki", "Nagisa Kataoka", "Nagisa Kazama", "Nagisa Koio", "Nagisa Koizumi", "Nagisa Konno", "Nagisa Konomi", "Nagisa Riyu", "Nagisa Shinohara", "Nagisa Shinzawa", "Nagisa Shiraishi", "Nagisa Sugisaki", "Nagisa Sunflower", "Nagisa Takagi", "Nagisa Tanimura", "Nagisa Yukino", "Nagisa Yuna", "Nagisazawa", "Nagomi", "Nagomi Nagomi", "Naho Hazuki", "Naho Kado", "Naho Makino", "Naho Ozawa", "Naho Yamaguchi", "Naho Yozora", "Nakagawa-San, 22 Years Old, University Student", "Nakajo Rino", "Nakamaru Future", "Nakamori Reiko", "Nakamura Shin", "Nakano", "Nakano Arisa", "Nakata", "Nakata Minami", "Nakayama Hinano", "Nako", "Nako Hoshi", "Nako Nishino", "Nako Nohara", "Nako Sudo", "Nami", "Nami Aoi", "Nami Himemura", "Nami Hoshino", "Nami Ichinose", "Nami Itoshino", "Nami Kuroki", "Nami Minami", "Nami Miyamae", "Nami Nanami", "Nami Okawa", "Nami Sawaguchi", "Nami Sekine", "Nami Togawa", "Nami Tokai", "Nami Umisaki", "Nami, 26 Years Old, Works At A Coffee Shop.", "Nami-San, 27 Years Old", "Namika", "Namikawa Yukari", "Namiki Anri", "Namiki Toko", "Namiki Yuno", "Nana &amp; Sakura", "Nana Aiba", "Nana Aida", "Nana Asami", "Nana Ayami", "Nana Ayano", "Nana Fukada", "Nana Kamiyama", "Nana Kawase", "Nana Kuroda", "Nana Maeno", "Nana Mi", "Nana Mina", "Nana Misaki", "Nana Miura", "Nana Nakamura", "Nana Nanase", "Nana Natsume", "Nana Ogawa", "Nana Okada", "Nana Okita", "Nana Sakai", "Nana Sasaki", "Nana Shirai", "Nana Takaoka", "Nana Tanaka", "Nana Yagi", "Nana-Chan", "Nana-San, 31 Years Old, Married For 3 Years", "Nanachi", "Nanae Hisaho", "Nanaho Kase", "Nanaka Jogasaki", "Nanaka Kosaka", "Nanako", "Nanako Asahina", "Nanako Fujiki", "Nanako Hayada", "Nanako Kayama", "Nanako Matsuura", "Nanako Miyamura", "Nanako Sakurai", "Nanako Seto", "Nanako Shirasaki", "Nanako Tsukishima", "Nanako Yoshioka", "Nanako Yoshise", "Nanami Aoba", "Nanami Asakura", "Nanami Hashimoto", "Nanami Hikari", "Nanami Hirose", "Nanami Ichikawa", "Nanami Mami", "Nanami Matsumoto", "Nanami Mihi", "Nanami Mimi", "Nanami Mineda", "Nanami Misaki", "Nanami Miu", "Nanami Mizusaki", "Nanami Nakamori", "Nanami Ogura", "Nanami Omori", "Nanami Ozora", "Nanami Roa", "Nanami Runa", "Nanami Sakura", "Nanami Shiina", "Nanami Takigawa", "Nanami Tina", "Nanami Yua", "Nanami, 20 Years Old, Second-Year University Student", "Nanami, 24 Years Old, Secretary To A Serial Entrepreneur.", "Nanami, 27 Years Old, Trombone Instructor", "Nanami, 28 Years Old, Animal Nurse", "Nanami, Dental Hygienist, 22 Years Old", "Nanao God", "Nanao God\xD7", "Nanasaki Miiro", "Nanasawa Mia", "Nanase Alice", "Nanase Aoi", "Nanase Asahina", "Nanase Kokoro", "Nanase Miho", "Nanase Mizusawa", "Nanase Mona", "Nanase Nishikawa", "Nanase Otoha", "Nanase Peach", "Nanase Rui", "Nanase Shiori", "Nanase Sinon", "Nanase Sora", "Nanase Tojo", "Nanase Yua", "Nanase Yume", "Nanase/Tall Beautiful Wifes Unfaithful Sex And Begging For Sex Without A Rubber Band! !", "Nanbu Wako", "Nanjo Reno", "Nanno Sora", "Nano", "Nano Ogasawara", "Nano Yazawa", "Nanoka Ikawa", "Nansei Ai", "Nao", "Nao Aizuki", "Nao Chat Lady", "Nao Ezaki", "Nao Fujishima", "Nao Hamasaki", "Nao Jinguji", "Nao Kojima", "Nao Masaki", "Nao Matsumura", "Nao Mikawa", "Nao Mizushiro", "Nao Ogawa", "Nao Suzuhira", "Nao Wakana", "Nao, 26 Years Old, H Cup Nurse", "Nao.", "Naoka Nonagawa", "Naoki Yuuki", "Naoko Ichinose", "Naoko Kanna", "Naoko Osako", "Naoko Tsumura", "Naoko Yamada", "Naomi", "Naomi Arimori", "Naomi Ishii", "Naomi Mitsuno", "Naomi Sugawara", "Naoo", "Narcisse Kobayashi", "Narimiya Iroha", "Narita Kanako", "Narita Tsumugi", "Narration Performance", "Naruha Sakai", "Narumi", "Narumi Araki", "Narumi Ashizawa", "Narumi Hayasaka", "Narumi Hirose", "Narumi Kawabata", "Narumi Koyuki", "Narumi Miu", "Narumi This Is", "Narumi Twig", "Narumi Urumi", "Narumi Yukina", "Naruse Kana", "Nasally Cherry", "Nasty Santa Mizuki &amp; Mana Real Estate Clerk &amp; Yoga Instructor Came To Spear", "Natalie Grace", "Natalie Night", "Natan", "Natori Ao", "Natori Hanae", "Natsu", "Natsu Asahina", "Natsu Ayase", "Natsu Hanabuchi", "Natsu Igarashi", "Natsu Imamura", "Natsu Nishida", "Natsu Sano", "Natsu Shibuya", "Natsu Tojo", "Natsu-San/Housewife", "Natsuho Sakamoto", "Natsuka", "Natsuka Asahina", "Natsuka Shinozaki", "Natsukawa Future", "Natsuki", "Natsuki Amamiya", "Natsuki Aozora", "Natsuki Fujioka", "Natsuki Hasegawa", "Natsuki Hikaru", "Natsuki Iijima", "Natsuki Kisaragi", "Natsuki Maron", "Natsuki Nagahara", "Natsuki Rena", "Natsuki Rui", "Natsuki Takeuchi", "Natsuki Yokoyama", "Natsuki Yume", "Natsuki, 25 Years Old, Receptionist", "Natsuko Kayama", "Natsuko Mishima", "Natsukuri Rio", "Natsume Aika", "Natsume Airi", "Natsume Aoi", "Natsume Hikari", "Natsume Hino", "Natsume Maki", "Natsume Reika", "Natsume Saiharu", "Natsume Sora", "Natsumi", "Natsumi Arakaki", "Natsumi Hidaka", "Natsumi Honjo", "Natsumi Ichinose", "Natsumi Kanna", "Natsumi Matsuoka", "Natsumi Miwa", "Natsumi Okamura", "Natsumi Saya", "Natsumi Shinooka", "Natsumi Watanabe", "Natsumi, 24 Years Old, Motsunabe Restaurant Staff", "Natsuna Hayama", "Natsuna Sasaki", "Natsuno Aki", "Natsuno Amber", "Natsuo Ichikawa", "Natsuo Natsu", "Natsuo Tohno", "Natsushira Maya", "Natsuya Eru", "Natsuya Togawa", "Nattsu", "Natural I-Cup Idol Cosplayer", "Natural Kanon", "Natural Mizuki", "Nazuna Nonohara", "Near", "Nekomiya Ichigo", "Nell Aoyama", "Nelly Kent", "Nene", "Nene Misumi", "Nene Sakura", "Nene Takashima", "Nene Terakawa", "Nene Yoshitaka", "Nene-Chan, 20 Years Old, Stock Multi-Market", "Nene-Chan, 22 Years Old, Milk Multi", "Neon Kameyama", "New Name Amin", "New Princess Peach", "New Serena", "New Wave Rear", "Newlywed Yuuka", "Nezuo", "Nh\xD7Nh", "Nia", "Niagara Sho", "Nichinan Festival", "Nick", "Nico Kawagoe", "Nicole", "Nicole Aria", "Nicole Nash", "Nicole Ray", "Niece", "Niina Honoka", "Niiyama Ran", "Niiyama Saya", "Nikaido Mero", "Nikaido Rei", "Nikaido Rosa", "Nikaido Yuka", "Niki Harris", "Nikki Darling", "Nimo", "Nina", "Nina Kosaka", "Nina Kurihara", "Nina Nishimura", "Nina Rua", "Nina Suzuno", "Nina Yamamura", "Nina, 21 Years Old, Occupation???", "Ninety-Nine Mei", "Ninomiya Hana", "Ninomiya Nana", "Ninomiya Saki", "Ninomiya Suzuka", "Nishi-Kun", "Nishijima Ibuki", "Nishijima Misato", "Nishikawa Aona", "Nishimiya Konomi", "Nishina Hyakuka", "Nishina Saei", "Nishino Kokone", "Nishino Megu", "Nishino Mina", "Nishino Otone", "Nishino Serina", "Nishino Tae", "Nishioka Emma", "Nishizaki Karen", "Nishizono Sakuya", "Nissen Maika", "Nito", "Nitori Hina", "Nitta Snow", "Niwa Sumire", "No Bra Jd", "Noa Eikawa", "Noa Kawamura", "Noa Mitsukami", "Noa Sakurai", "Noa Shiina", "Noa Suwon", "Noah", "Noah-Chan, 23 Years Old, Multi-Film", "Noao Hazuki", "Nobeoka Suzuka", "Nobita", "Nobuko Hayama", "Nobuo Yamada", "Nodoka Aragaki", "Nodoka Ono", "Nodoka Sakuraba", "Nogi Yume", "Nojo Seika", "Nokaze-San", "Noko Kamiya", "Nomiya Ann", "Non-Chan", "Nono Maeda", "Nonoko Egawa", "Nonomiya Ame", "Nonose Ai", "Nonoura Warm", "Norika Nishiura", "Norika Sakai, 28 Years Old", "Noriko Doi", "Noriko Hoshi", "Noriko Igarashi", "Noriko Ito", "Noriko Miyamoto", "Noriko Yada", "Noritaro", "Noriyuki Oshii", "North Island Rei", "Nozomi", "Nozomi Arimura", "Nozomi Ashida", "Nozomi Ayatsuki", "Nozomi Hamada", "Nozomi Haneda", "Nozomi Hazuki", "Nozomi Hazuki", "Nozomi Higashi", "Nozomi Ichijo", "Nozomi Ichinomiya", "Nozomi Ikuta", "Nozomi Ishihara", "Nozomi Karin", "Nozomi Kitajo", "Nozomi Maezono", "Nozomi Mikimoto", "Nozomi Nozomi", "Nozomi Osaka", "Nozomi Sakai", "Nozomi Saki Emma", "Nozomi Shirahama", "Nozomi Suhara", "Nozomi Suzuki", "Nozomi Takei", "Nozomi Tamura", "Nozomi Tanihara", "Nozomi, 23 Years Old, Ophthalmology Staff", "Nozomisaki Emma", "Nurarihyon", "Nurarihyon\xD7", "Nurumayu", "Oba Yui", "Obedient", "Ocean", "Oda Bookmark", "Oda Mako", "Odagiri Jun\xD7", "Odazakura", "Of", "Ogawa Rio", "Ogilvy Haruka", "Ogura Ami", "Ogura Mikine", "Ogura Nana", "Oguri Misao", "Oguri Monaka", "Ohashi Miku", "Ohtsuki Ryou", "Okabe Yuino", "Okada Yua", "Okamoto Fuuri", "Okawa Yuno", "Oki Rei", "Okina Misaki", "Okinomiya Nami", "Okre", "Okre \xD7", "Okre\xD7)", "Okuda Fumina", "Okuda-San, Production Planning, Music Business Company", "Okui Sakiho", "Okuno Mikana", "Old Thistle", "Ols", "Omi Horikawa", "Omi Kaoru", "Omnibus", "Omomo Hina", "Omori Poetry Summer", "Omura", "One", "Ono Itsuka", "Ono Kayafuji", "Ono Rikka", "Onozaka, 24 Years Old, Restaurant Worker", "Ori Amami", "Orie Fujiki", "Orie Maya", "Orihara Honoka", "Orimono", "Orin", "Oryo", "Osaka Haruna", "Osamu Osamu", "Osamu Saito", "Oshiro", "Ota", "Otani", "Other", "Otoha Amemiya", "Otoha Amu", "Otoha Love", "Otonashi Houko", "Otonashi Kaori", "Otonashi Lena", "Otori Miyu", "Otori Yume", "Ototsuki Miri", "Otowa Saeki", "Otowata Amu", "Otsu Alice", "Otsuka Building", "Otsuka Gyokudo", "Ouka Rin", "Owadas Visit", "Oyama Yuzuki", "Oyo Nakano", "Paradise Mina", "Past", "Peach Miku", "Peaches", "Pear Flower", "Pentagram", "Perfume Jun", "Pierre Sword", "Pino", "Pinoki", "Pinopi", "Pj Girl T", "Planer", "Pomelo Moon", "Popito", "Port", "Prayer Kisumi", "Princess Hanamiya", "Princess Kato", "Princess Lily", "Princess Sakura", "Princess Yukimiya", "Priscilla Sara", "Priya Anjali Lai", "Puchin", "Pudding-Chan", "Pure White", "Pure White Ayei", "Pure White Fluffy", "Pure White Here", "Pure White Mikuru", "Pure White Minori", "Purple Castle Reno", "Purple Fujisaki", "Putyan", "Qbe Kirch", "Qbee", "Queenie Satine", "Quiet", "R-Chan", "Rabbit", "Rabbit Kento", "Rah", "Raichi Kurusu", "Rainbow Color", "Rainwear", "Rainy Summer", "Ran Amami", "Ran Asakura", "Ran Himeno", "Ran Kikuno", "Ran Kosaka", "Ran Minagawa", "Ran Mitsutani", "Ran Nanase", "Ran Nonomiya", "Ran Saiki", "Ran Sugimoto", "Ran Utase", "Ran-Chan/Girls Bar", "Rana Kawai", "Ranger Kaburagi", "Ranka", "Ranko Miyama", "Ranran", "Ranran Fujii", "Rara", "Rara Haruno", "Rara Kiseki", "Rara Shinozaki", "Raveness", "Ray Isogai", "Rea Sakurai", "Really", "Rear", "Rebecca Black", "Red Fruit", "Red Silk Head", "Red-Eye Raylan", "Reho Hasegawa", "Rei Amami", "Rei Aoki", "Rei Asakawa", "Rei Former Miss W Universitys Talented Office Lady", "Rei Futami", "Rei Hanamiya", "Rei Hazuki", "Rei Ibuki", "Rei Ichihara", "Rei Kamiki", "Rei Kanzaki", "Rei Kikuchi", "Rei Kimura", "Rei Kuroshima", "Rei Kuruki", "Rei Misumi", "Rei Mizuna", "Rei Narita", "Rei Ohama", "Rei Otsuka", "Rei Saegusa", "Rei Saihara", "Rei Sasaki", "Rei Serizawa", "Rei Shiramiya", "Rei Shiratori", "Rei Takatsuki", "Rei Tamaki", "Rei Tamaki\xD7", "Rei Tianhe", "Rei Tokunaga", "Rei Yabuki", "Rei Yuki", "Rei, 22 Years Old", "Rei, 22 Years Old, Shisha Bar Staff", "Rei, 25 Years Old, Graduate Student In The Piano Department At A Certain Music University.", "Reia Anemiya", "Reia Kawakami", "Reia Yoshiya", "Reika", "Reika Aiba", "Reika Hashimoto", "Reika Homma", "Reika Kanzaki", "Reika Kudo", "Reika Kuroki", "Reika Makino", "Reika Mizuki", "Reika Ochiai", "Reika Ono", "Reika Shigemori", "Reika Takeda", "Reika Toyoda", "Reika Wakana", "Reika Yasunaga", "Reiko Himekawa", "Reiko Himori", "Reiko Iwai", "Reiko Kagami", "Reiko Kanazawa", "Reiko Kasumi", "Reiko Kinoshita", "Reiko Kitagawa", "Reiko Kubo", "Reiko Makihara", "Reiko Matsumoto", "Reiko Mine", "Reiko Nagayama", "Reiko Natsume", "Reiko Sawamura", "Reiko Seo", "Reiko Shimura", "Reiko Suwon", "Reiko Takeuchi", "Reiko Tatsugami", "Reiko Tono", "Reiko Yukawa", "Reimi Hasegawa", "Reimi Hashimoto", "Reimi Ito", "Reimi Saegusa", "Reina", "Reina Dan", "Reina Fujikawa", "Reina Hashimoto", "Reina Hiiragi", "Reina Hirokawa", "Reina Ishizaki", "Reina Kanno", "Reina Kashima", "Reina Kawauchi", "Reina Makino", "Reina Murase", "Reina Nanjo", "Reina Nishijima", "Reina Sawada", "Reina Sumi", "Reina Tachibana", "Reina Tachibana, 26 Years Old, I-Cup Married Woman With Big Breasts", "Reina Taozono", "Reino Kawamura", "Reipoyo", "Reira Aisaki", "Reira Natsuki", "Reiwa Reiwa", "Remi", "Remi Aikawa", "Remi Hoshisaki", "Remi Natsume", "Remi Sakuma", "Remi, 27 Years Old, Married For 2 Years", "Remon Kimura", "Remon Tachibana", "Remu Nishio", "Remu Suzumori", "Ren Ayanami", "Ren Fukusaki", "Ren Hirose", "Ren Ichinose", "Ren Kitazawa", "Ren Kuroki", "Ren Matsushima", "Ren Otsuka", "Ren Sakuragi", "Ren Satomiya", "Ren Serizawa", "Ren Yamamoto", "Rena", "Rena Aihara", "Rena Aoi", "Rena Aoyama", "Rena Fukiishi", "Rena Hasegawa", "Rena Hashimoto", "Rena Kasetani", "Rena Kiyomoto", "Rena Kodama", "Rena Makino", "Rena Miyashita", "Rena Mori", "Rena Munakata", "Rena Nishimura", "Rena Sakaguchi", "Rena Sakuragi", "Rena Sayama", "Rena Shimohira", "Rena Shirahana", "Rena Shiraishi", "Rena, 26 Years Old, Administrative Scrivener", "Rena-Chan", "Rena-Chan, 22 Years Old, Believes In Showing Off Your Skin.", "Renka Saeki", "Renka Yuzuki", "Reno Aihira", "Reno Kiyomi", "Reo Fujisawa", "Reo Kise", "Reo.", "Reona", "Reona Hironaka", "Reona Kanzaki", "Reona Tominaga", "Ria", "Ria Ichinose", "Ria Kashii", "Ria Misaka", "Ria Oido", "Ria Sakurai", "Ria Sun", "Ria Yamate", "Ria Yoshizawa", "Ria Yumekawa", "Ria Yuzuki", "Ria, 23 Years Old, Works In Apparel.", "Riame Nagata", "Rian Aoi", "Rian Matsunaga", "Rian Natsu", "Rica", "Richiko", "Rico", "Rie", "Rie Ezawa", "Rie Matsuo", "Rie Miyagi", "Rie Miyata", "Rie Nishina", "Rie Otsuka", "Rie Takeuchi", "Rieko Hiraoka", "Rieko Masaki", "Riena Ninomiya", "Riepi", "Rieru Shibusawa", "Riho", "Riho Agatsuma", "Riho Fujimori", "Riho Kobayashi", "Riho Kodaka", "Riho Matsumoto", "Riho Matsuoka", "Riho Natsume", "Riho Sasakawa", "Riho Shirahashi", "Riho Shishido", "Riho Takahashi", "Riho, 22 Years Old, Nursing Student", "Riho, 29 Years Old, Office Worker", "Riina Aizawa", "Riisa", "Riisa Kisaragi", "Riisa Kuga", "Rika", "Rika Aiba", "Rika Aimi", "Rika Amemura", "Rika Aoki", "Rika Fujishita", "Rika Goto", "Rika Hoshimi", "Rika Inoue", "Rika Kaburagi", "Rika Kano", "Rika Kawaminami", "Rika Kojima", "Rika Manase", "Rika Miama", "Rika Morisaki", "Rika Nanno", "Rika Narumiya", "Rika Orihara", "Rika Sano", "Rika Shibasaki", "Rika Taozono", "Rika Usui", "Rika Utsugi", "Rika Yagi", "Rika Yamaguchi", "Rika Yumeri", "Rika, 25 Years Old, Stylist", "Rikako", "Rikako Kobayashi", "Rikako Mano", "Rikako Oikawa", "Rikiya", "Riko Aoi", "Riko Hanasaki", "Riko Hashimoto", "Riko Hino", "Riko Hoshikawa", "Riko Kishigami", "Riko Kitagawa", "Riko Mizuki", "Riko Mizusawa", "Riko Momose", "Riko Nagano", "Riko Saito", "Riko Sato", "Riko Shinohara", "Riko Shiraha", "Riko Shirahashi", "Riko Tachibana", "Riko Takarakawa", "Riko Tokushima", "Riko Tsukino 26 Years Old Tutor", "Riku", "Riku Aizawa", "Riku Fujisaki", "Riku Hoshikawa", "Riku Ichikawa", "Riku Maekawa", "Riku Minato", "Riku Nanase", "Riku Nekota", "Rikucham", "Rima Kawahara", "Rima Mashiro", "Rima Ohara", "Rima Suzukawa", "Rimachi", "Rimi Momono", "Rimu Himeno", "Rimu Yumino", "Rimu-Chan, 23 Years Old, Lounge Girl", "Rin", "Rin Aikawa", "Rin Aizawa", "Rin Amemiya", "Rin Aoki", "Rin Aoyama", "Rin Arima", "Rin Asahi", "Rin Asuka", "Rin Azuma", "Rin Chika", "Rin Hachimitsu", "Rin Hatsumi", "Rin Hayama", "Rin Hoshizaki", "Rin Ikuta", "Rin Katsuragi", "Rin Kira", "Rin Luxury Lounge Girl", "Rin Miyazaki", "Rin Momono", "Rin Momoyama", "Rin Natsuki", "Rin Ogawa", "Rin Saezuki", "Rin Sakihara", "Rin Sakuragi", "Rin Shimamoto", "Rin Shiraishi", "Rin Suzuki", "Rin Suzune", "Rin Usami", "Rin, 25 Years Old, Runs An E-Commerce Site.", "Rin-Chan, 25 Years Old, Works At A Shisha Bar", "Rin-San", "Rin-San, 31 Years Old, Snack Bar Owner", "Rina", "Rina Aoi", "Rina Ayana", "Rina Fujimoto", "Rina Fukada", "Rina Hatsume", "Rina Himekawa", "Rina Himeno", "Rina Hinata", "Rina Ishihara", "Rina Iwase", "Rina July", "Rina Kaeda", "Rina Kashino", "Rina Kasuga", "Rina Kawakita", "Rina Kitahara", "Rina Kosaka", "Rina Masako", "Rina Minase", "Rina Momosato", "Rina Natsui", "Rina Nishiuchi", "Rina Okamoto", "Rina Ono", "Rina Otomi", "Rina Rukawa", "Rina Serino", "Rina Shirakawa", "Rina Suzuki", "Rina Takakura", "Rina Takase", "Rina Takemura", "Rina Tamura", "Rina Uchimura", "Rina Ueno", "Rina Usui", "Rina Yoshino", "Rina, 27 Years Old, Web Director", "Rina-Chan New 120-Minute Course", "Rina-Chan New 150-Minute Course", "Rina/21/College Student", "Rina/26/Model", "Rinai", "Rindoru Hoshikawa", "Ring Ring", "Rinka", "Rinka Aiuchi", "Rinka Akinaga", "Rinka Anastasia", "Rinka Hoshikawa", "Rinka Hoshizuki", "Rinka Ichijo", "Rinka Mizuhara", "Rinka Natsume", "Rinka Ono", "Rinka Tahara", "Rinko Hanayagi", "Rinko Kanomon", "Rinko Nomiya", "Rinne", "Rinne Mochizuki", "Rino Harukawa", "Rino Kanzaki", "Rino Kirishima", "Rino Kitagawa", "Rino Konno", "Rino Kudo", "Rino Mitsushima", "Rino Mizushiro", "Rino Sakai", "Rino Sakuragi", "Rino Sasami", "Rino Sekiguchi", "Rino Tanaka", "Rino Wakamiya", "Rinoa", "Rinsha Dan", "Rio", "Rio Aihara", "Rio Asahi", "Rio Ayanami", "Rio Fujita", "Rio Fukuda", "Rio Hamasaki", "Rio Harusawa", "Rio Hina", "Rio Hosokawa", "Rio Kuriyama", "Rio Matsuura", "Rio Miyachi", "Rio Nagasawa", "Rio Nakamura", "Rio Oikawa", "Rio Okita", "Rio Ryukawa", "Rio Sakamoto", "Rio Tsumugi", "Rio Uno", "Rio Yukino", "Rio, An Esthetician Residing In Minato Ward.", "Rio-Chan", "Rio-Chan, 22 Years Old, Cat Multi", "Rio-San", "Rio-San, 10Th Wedding Anniversary", "Rion", "Rion Hiiragi", "Rion Hirano", "Rion Ichijo", "Rion Izumi", "Rion Kanami", "Rion Nishikawa", "Rion Sakurai", "Riona Hirose", "Riona Kudo", "Riona Ryojo", "Riori Kanasugi", "Riri", "Riri Koda", "Riri Kuribayashi", "Riri Minase", "Riri Momoya", "Riri Nakayama", "Riri Nanatsumori", "Riri Okamoto", "Riri, Sales Representative At A Staffing Agency, Age 23", "Ririco", "Ririka", "Ririka *No General Males Allowed", "Ririka Kojima", "Ririka Tsukino", "Ririka Tsukishiro", "Ririka, 20 Years Old, Influencer", "Ririka, 25 Years Old, Beauty Clinic Receptionist", "Ririka, 26 Years Old, Clinical Engineer", "Ririko Shiina", "Riru Asano", "Risa Akimoto", "Risa Arisawa", "Risa Hasegawa", "Risa Hashimoto", "Risa Kujo", "Risa Kunimi", "Risa Mochizuki", "Risa Onodera", "Risa Shimizu", "Risa Shirakawa", "Risa Tachibana", "Risako Takeuchi", "Rise Kisaragi", "Ritsu Nagasawa", "Ritsuko Hasegawa", "Rize Kanzaki", "Roa Tsuchiya", "Robin", "Rock", "Rodin Fuji", "Rokka Ono", "Rokuka Noah", "Rola Misaki", "Romance Kono", "Romihi Nakamura", "Rona Rose", "Rose Shop Ririko", "Roxy", "Ruby Amazoness Nami", "Rui", "Rui 28 Years Old Securities Company Salesperson", "Rui Airi", "Rui Ayukawa", "Rui Hasegawa", "Rui Hizuki", "Rui Ichinomiya", "Rui Minagawa", "Rui Miura", "Rui Miyamoto", "Rui Mizutani", "Rui Nozomi", "Rui Ogasawara", "Rui Otokoto", "Rui Sakamoto", "Rui Saotome", "Rui Seshita", "Rui Shidou", "Rui Shinomiya", "Rui Suzune", "Rui Wakayama", "Rui Yasuzumi", "Rui-Chan, 24 Years Old, Pet Shop Employee", "Ruisa", "Ruisa Miyakozuki", "Ruka", "Ruka Aida", "Ruka Aise", "Ruka Ichinose", "Ruka Inaba", "Ruka Matsumoto", "Ruka Miyase", "Ruka Yamada", "Ruka, 23 Years Old", "Rukawa Haruka", "Rumi", "Rumi Amano", "Rumi Haibara", "Rumi Kanzaki", "Rumi Karishu", "Rumi Kodama", "Rumi Mochizuki", "Rumi Orikasa", "Rumika Yoshioka", "Rumiko Yoshinaga", "Runa Kuroki", "Runa Sezaki", "Runa Shimotsuki", "Runa Yamagishi", "Ruri Kamiya", "Ruri Kobato", "Ruri Saijo", "Ruri Shiratori", "Ruri Shirota", "Ruri Tachibana", "Rurika Ishihara", "Ruriko Kanda", "Ruriko Mochizuki", "Ruru Mishiro", "Ruru, 20 Years Old, Student", "Rurucha.", "Ruu, 26 Years Old, Voice Actor", "Ruu, 28 Years Old, Nurse", "Ruu-San, 31 Years Old, Married For 3 Years", "Ruyoshi Shimura", "Ryo Akanishi", "Ryo Aoki", "Ryo Asakura", "Ryo Harusaki", "Ryo Hoshi", "Ryo Ikushima", "Ryo Iwata", "Ryo Kitamura", "Ryo Kurihara", "Ryo Miyagi", "Ryo Sawai", "Ryo Tsubaki", "Ryo Tsukimi", "Ryo Yabuki", "Ryo Yazawa", "Ryo, 33 Years Old, Pilates Instructor", "Ryoichi Sasaki", "Ryoka Aoyama", "Ryoka Asai", "Ryoka Dan", "Ryoka Morikawa", "Ryoka Sakurai", "Ryoka Shibata", "Ryoka Shinoda", "Ryoka Yabuki", "Ryoki Amino", "Ryoki Kan", "Ryoko", "Ryoko Arisawa", "Ryoko Asamiya", "Ryoko Fujiki", "Ryoko Honjo", "Ryoko Ikeuchi", "Ryoko Iori", "Ryoko Ishihara", "Ryoko Izumi", "Ryoko Kagami", "Ryoko Kakizawa", "Ryoko Kuninaka", "Ryoko Kuroya", "Ryoko Murakami", "Ryoko Nagase", "Ryoko Sena", "Ryoko Sumita", "Ryoko Yamashita", "Ryoko Yoshida", "Ryoko Yoshizawa", "Ryomi Honoka", "Ryomi Ichihara", "Ryona Hisaka", "Ryota Inoue", "Ryouka Walnut", "Ryoune Manaka", "Ryu Enami", "Ryu Enami", "Ryu Hamaguchi", "Ryuichi Saito", "Ryuji Moriyama", "Ryuka Mogi", "Ryukawa Evening", "Ryukawa Sail Wave", "S-Chan, A Job-Hunting Student At Her Limit", "Sa Gojyo", "Saa Futaba", "Saaya Hazuki", "Saaya Kawamura", "Saaya Kirijo", "Sacchan", "Sachan", "Sachi", "Sachi Fujita", "Sachi Tsuruta", "Sachika", "Sachika Akimoto", "Sachiko", "Sachiko Arisaka", "Sachiko Hara", "Sachiko Koiso", "Sachiko Ono", "Sachiko Yamashita", "Sadafumi Ishikawa", "Saddle Tide Special Warning! ! \xD7 The Strongest H-Cup Im Sorry For Putting Out Too Much...\u266A Blond Blonde Gal Jennifer-Chan (25) Self-Proclaimed Consultant", "Sae Aihara", "Sae Fujiki", "Sae Mikuni", "Sae Murakami", "Sae Numata", "Sae Tsubaki", "Sae Tsukizono", "Sae Yano", "Sae-Kun Maiko", "Saejima Kaori", "Saejima Kaoru", "Saeka Hinata", "Saeki Sayuri", "Saeko Ikegami", "Saeko Ikuta", "Saeko Kimishima", "Saeko Matsushita", "Saeko Shiraishi", "Saeko Usui", "Saeko Yokoyama", "Sagara Akari", "Saho Minami", "Saho Miyazaki", "Saiju Ito", "Saika Kawakita", "Saiko Yatsuhashi", "Saionji Mio", "Saionji Reo", "Saionji Song", "Saito Mayu", "Saiya", "Sajihanzo", "Saka Takashiro", "Saka Yoshioka", "Sakai Hana", "Sakai Juno", "Sakai Mio", "Sakai Moka", "Sakaki Ai", "Sakamichi*My", "Sakamoto", "Sakamoto Kazuno", "Saki", "Saki Aikawa", "Saki Akina", "Saki Hirose", "Saki Homma", "Saki Kamiya", "Saki Kasai", "Saki Kato", "Saki Kiyone", "Saki Kiyono", "Saki Kuroya", "Saki Miyamoto", "Saki Mizumi", "Saki Naekawa", "Saki Nakajo", "Saki Nishikawa", "Saki Oishi", "Saki Okuda", "Saki Sakura", "Saki Sasaki", "Saki Shida", "Saki Shinkai", "Saki Shiraishi", "Saki Urara", "Saki Yoshida", "Saki Yuna", "Sakihime Yurika", "Sakikazu Sasaki", "Sakiko Fukui", "Sakiko Mihara", "Sakiko Sakurai", "Sakina Takeuchi", "Sakino Flowers", "Sakino Koharu", "Sakino Mirai", "Sakino Oto", "Sakiyoshi Tsumugi", "Saku Kurosaki", "Sakuma Tsuna", "Sakumatsu", "Sakune Rio", "Sakuno Kanna", "Sakura Anne", "Sakura Aoi", "Sakura Dancer", "Sakura Hara", "Sakura Hoshino", "Sakura Kageyama", "Sakura Kamiya", "Sakura Kirishima", "Sakura Kizuna", "Sakura Koharu", "Sakura Kojima", "Sakura Kokomi", "Sakura Kusumi", "Sakura Mahiru", "Sakura Miko", "Sakura Minami", "Sakura Mio", "Sakura Miura", "Sakura Moko", "Sakura Momo", "Sakura Momona", "Sakura Nagao", "Sakura Nico", "Sakura Okano", "Sakura Okina", "Sakura Ryouka", "Sakura Sakurada", "Sakura Shinomiya", "Sakura Suzuka", "Sakura Takaoka", "Sakura Tsuji", "Sakura Tsukishima", "Sakura Wakatsuki", "Sakura Yoda", "Sakura Yuno", "Sakura Yura", "Sakura Yuzuki", "Sakuraba Nanoka", "Sakuraba Niina", "Sakuraba Urea", "Sakurada Momoha", "Sakuragi Seira", "Sakuragis", "Sakurai Iroha", "Sakurai Nina", "Sakurai Rinne", "Sakurai Sakura", "Sakurai Yae", "Sakuraka Fujimiya", "Sakurako", "Sakurako Kiriyama", "Sakurako Ooka", "Sakuramina", "Sakurano Momo", "Sakuranomiya Nana", "Sakurawa Kotoko", "Sakurazaka Chimu", "Sakurazaka Ren", "Sakuren", "Sakuya Noda", "Sally", "Samejima", "Sana", "Sana Baba", "Sana Ichiba", "Sana Ikuta", "Sana Imanaga", "Sana Kawashima", "Sana Kirishima", "Sana Matsunaga", "Sana Minase", "Sana Mizuhara", "Sana Moriho", "Sana Nakajima", "Sana Nishiyama", "Sana Ohashi", "Sana Rukawa", "Sana Torimitsu", "Sana Urakawa", "Sana Yotsuba", "Sanadakyo", "Sanae Aso", "Sanae Hosoda", "Sanae Kubota", "Sanae Kurihara", "Sanae Matsushima", "Sanae Misono", "Sanae Yamaguchi", "Sanan Kanahara", "Sand Weaving", "Sandy Hina Parks", "Sannomiya Tsubaki", "Sano", "Sano Satori", "Sano Seiya", "Sano-San, 28 Years Old, Full-Time Housewife", "Sanshiro", "Santama", "Saori Asada", "Saori Hara", "Saori Hatanaka", "Saori Kaneshiro", "Saori Konishi", "Saori Miyamoto", "Saori Miyazawa", "Saori Nagashima", "Saori Okumura", "Saori Tsuji", "Saori Yagami", "Saoru Yuzuki", "Saotome Actress", "Saotome Arisu", "Saotome Chika", "Saotome Love", "Sara", "Sara Aizawa", "Sara Fujisaki", "Sara Isshiki", "Sara Kiritani", "Sara Kobayashi", "Sara Ogawa", "Sara Saijo", "Sara, 27 Years Old, Bridal Model", "Sara, 29 Years Old, Married For 2 Years.", "Sara, 30 Years Old, Married For 2 Years", "Saran Ito", "Sari Kosaka", "Sarina Higashibata", "Sarina Kurokawa", "Sarina Momonaga", "Sarina Ono", "Sarina Toyama", "Sasa Kamisaki", "Sasa Norita", "Sasaki-San, 27 Years Old", "Sasanami", "Sasayama Cherry Blossoms", "Sasayama Rika", "Sasha Beart", "Sata Jones", "Sato Iori", "Sato Orimu", "Sato Sato", "Sato Shirahana", "Sato White Sound", "Sato-Chan, New Customer, 150-Minute Course", "Satoko Hirasawa", "Satoko Kajiwara", "Satoko Ohno", "Satomi", "Satomi Ayase", "Satomi Fueki", "Satomi Hayakawa", "Satomi Hirano", "Satomi Ikura", "Satomi Inoue", "Satomi Ishibashi", "Satomi Miyamoto", "Satomi Nagasawa", "Satomi Narushima", "Satomi Oka", "Satomi Okimoto", "Satomi Rough Money", "Satomi Shuri", "Satomi Someya", "Satomi Suzuki", "Satomi Ui", "Satomi Usui", "Satomi Yuria", "Satoru Kobayakawa", "Satosaki Bookmark", "Satoumi Yuhi", "Satozaki Aika", "Satsuki", "Satsuki Aono", "Satsuki Honjo", "Satsuki Hosaka", "Satsuki Hoshikawa", "Satsuki Kamimura", "Satsuki Kunimoto", "Satsuki Kuriyama", "Satsuki Miyama", "Satsuki Nanao", "Satsuki Sakura", "Satsuki Toyooka", "Satsuki Yuna", "Satsuki Yura", "Saurus", "Savannah Bond", "Sawa Lemon", "Sawa Nonoka", "Sawa Yamashita", "Sawada Miku", "Sawaguchi Shino", "Sawajiri Uta", "Sawaki Chika", "Sawamura Shinnagisa", "Saya", "Saya Aoyama", "Saya Date", "Saya Endo", "Saya Fujikawa", "Saya Fujisaki", "Saya Matsui", "Saya Mikuni", "Saya Minami", "Saya Son", "Saya Takazawa", "Saya Tsukamoto", "Saya Usui", "Saya Yoshise", "Saya, 31 Years Old, Esthetician", "Saya, 35 Years Old, Married For 6 Years", "Sayaka", "Sayaka Asami", "Sayaka Fujinoki", "Sayaka Harato", "Sayaka Hoshino", "Sayaka Katori", "Sayaka Kawase", "Sayaka Kujo", "Sayaka Matsuoka", "Sayaka Megumi", "Sayaka Minobe", "Sayaka Narumi", "Sayaka Nito", "Sayaka Otohaku", "Sayaka Sadakimoto", "Sayaka, 29 Years Old, Senior At University", "Sayako Gomi", "Sayako Sanada", "Sayama Love", "Sayo Arimoto", "Sayo Matsushita", "Sayoko", "Sayoko Machimura", "Sayoko Shirokane", "Sayori Sueto", "Sayu Nanaha", "Sayu Nanahara", "Sayu Sahara", "Sayuki Mogami", "Sayuki Natori", "Sayumi Hosoya", "Sayuri Akina", "Sayuri Hayama", "Sayuri Horiguchi", "Sayuri Ichimatsu", "Sayuri Itsuki", "Sayuri Kamio", "Sayuri Maki", "Sayuri Mikami", "Sayuri Mitsumoto", "Sayuri Nogami", "Sayuri Ono", "Sayuri Rice", "Sayuri Shinohara", "Sayuri Takagi", "Sayuri Takarada", "Sayuri Takizawa", "Sayuri Tsukishiro", "Science", "Sea", "Sea Breeze Tin", "Sea \u200B\u200BBream", "Sea \u200B\u200BTo Hand", "Seara Hoshino", "Second Generation Randa Mai", "Second Lounge Lady Rino-Chan", "Secret Shop Mimi", "See-Through Sexy Dress Girl", "Sei Yuna", "Seigo Hashimoto", "Seiichi Hoshino", "Seika Igarashi", "Seika Toyosaki", "Seikai Marine", "Seina Kasai", "Seina, 25 Years Old, Office Lady", "Seira", "Seira Ayano", "Seira Kanamori", "Seira Kuwahara", "Seira Mizusumi", "Seira Ono", "Seiran Igarashi", "Seiren De Mar", "Seiri Toa", "Seiyo Uchino", "Sekiguchi Manyo", "Seko Meizumi", "Selection", "Selva La Piedra", "Selva Lapidra", "Semen Jiro", "Sena", "Sena Asami", "Sena Lumina", "Sena Oshima", "Senbongi Hinata", "Sengoku Monaka", "Senkawa Monaka", "Seo Rin", "Serena Nashiki", "Serena Tsutsumi", "Sergeant", "Seri Kizuki", "Seri Orimoto", "Serina Asahina", "Serina Hayakawa", "Serina Riku", "Serina Tachibana", "Serina Usui", "Serina, 28 Years Old, Dental Hygienist", "Serina, 32, Insurance Company", "Seto Ayame", "Seto Kanna", "Seto Kokomi", "Setuko Kusakabe", "Seven", "Seven Blues", "Seven Herbs", "Seven Star Walnut", "Seventh Iori", "Shabby", "Shachins", "Shade", "Shallow Sea", "Shen R.i.", "Shenan Light", "Sherena", "Shes A Dark-Skinned Gal, But Shes Also A Former Nurse!? A String Of Crazy, Lewd Episodes! G-Cup Explosive Style! Yuyu-Chan (24 Years Old) Is A Backup Dancer For A Certain Singer.", "Shes Cumming Uncontrollably!! A Super Sensitive, Gorgeous Gal!! A Shaved Pussy Thats In Heat 7 Days A Week, Aika-Chan (24 Years Old), Marketing.", "Shes So Cute! Shes On The Top Of Her Game!! Beautiful Breasts And A Firm Ass, A White Gal From Fukuoka, Rena-Chan (20 Years Old), A Former Baseball Team Manager", "Shi-Chan", "Shibamata Shiho", "Shibukawa Akari", "Shibusawa Beni", "Shibuya Arisu", "Shibuya Hana", "Shibuya Rino", "Shichido Renmi", "Shida Yuzuki", "Shigeko Nagata", "Shigeo Tokuda", "Shiho Aoi", "Shiho Egami", "Shiho Fujie", "Shiho Hirate", "Shiho Maya", "Shiho Miyazawa", "Shiho Mizuno", "Shiho Muto", "Shiho Sakatani", "Shiho Segawa", "Shiho Terashima", "Shihori Endo", "Shihori Kotoi", "Shihori Nosaka", "Shihori Tokita", "Shiiba Ema", "Shiina", "Shiina Alice", "Shiina Eru", "Shiina Hikaru", "Shiina Miyu", "Shikano Amo", "Shiki Beauty Clinic Reception", "Shiki Island Beach", "Shimeji Mushroom", "Shimiken", "Shimizu Konatsu", "Shimizu Riu", "Shimizu Shiho", "Shimokawa Tsumugi", "Shimotsuki Sleet", "Shina Kiki", "Shindo Hina", "Shindo Miya", "Shindo Promising", "Shine", "Shingo Kuga", "Shinharu Asai", "Shinji Hirai", "Shinji Osawa", "Shinji Osawa Muscle Sawano", "Shinji Yano", "Shinji Yano Saji Hanzo", "Shinji Yano\xD7", "Shinjima Otoru", "Shinjo Kanna", "Shinjo Yui", "Shinkawa Sky", "Shinmi Naruse", "Shinna Nakamori", "Shinnosuke Ueda", "Shino", "Shino Akiyoshi", "Shino Mayu", "Shino Sakura", "Shinobu Ebihara", "Shinobu Firefly", "Shinobu Igarashi", "Shinobu Miyamae", "Shinobu Oishi", "Shinobu Oshima", "Shinobu Terazawa", "Shinoda Yu", "Shinofu Hosokawa", "Shinohara Iyo", "Shinomiya Momo", "Shinomiya Nene", "Shinon Mizutani", "Shinonome Azusa", "Shinonome Camellia", "Shinonome Reiya", "Shinop", "Shinta", "Shinto Takahashi", "Shinya Matsuyama", "Shinyo Nozomi", "Shio Sato", "Shiokawa Sea Urchin", "Shiomi Mai", "Shion (22) / 1St Year Of Living Together", "Shion Fujimoto", "Shion J-Cup 25 Years Old", "Shion Mako", "Shion Minamiha", "Shion Misumi", "Shion Mochizuki", "Shion Narimiya", "Shion Nishikai", "Shion Noran", "Shion Omori", "Shiori Aizawa", "Shiori Akagawa", "Shiori Amano", "Shiori Hirai", "Shiori Ichikawa", "Shiori Izumida", "Shiori Kamisaki", "Shiori Kaname", "Shiori Kimura", "Shiori Mamiya", "Shiori Minami", "Shiori Mochida", "Shiori Mochizuki", "Shiori Nako", "Shiori Nishida", "Shiori Nitta", "Shiori Nogami", "Shiori Otsuka", "Shiori Sano", "Shiori Tamura", "Shiori Tsukada", "Shiori Wakamura", "Shiori Yamagishi", "Shiori Yorimoto", "Shiori, 26 Years Old, Caregiver", "Shirahana Ko", "Shirahasi Miyuki", "Shirahime Kanna", "Shirahonome", "Shirai Fuyuhana", "Shirai Ito", "Shirai-San", "Shiraishi Camellia", "Shiraishi Nami", "Shiraishi Non", "Shiraishi Plane", "Shiraishi Seira", "Shiraishi Tsubasa", "Shiraiwa Fuyumoe", "Shirakami Sakka", "Shirakawa Eyebrows", "Shirakawa Hanasei", "Shirakawa Mayumi", "Shiraki Riri", "Shiraki Yuko", "Shirako", "Shiramine Ikumi", "Shiramine Miu", "Shiramori Walnut", "Shirasaka Miyu", "Shirasaki Ao", "Shirasaki Rion", "Shirasaki Satsuka", "Shirasaki Suirei", "Shirase Shinoto", "Shiratama", "Shiratama Dango", "Shirato Kanae", "Shiratori Hundred Vegetables", "Shiro Kitayama", "Shisa Gamo", "Shiseishinkai", "Shishido Suiran", "Shishio", "Shitara Alisa", "Shitara Yuuhi", "Shizuka", "Shizuka Akiyama", "Shizuka Ashiya", "Shizuka Ishikawa", "Shizuka Kanno", "Shizuka Kudo", "Shizuka Miwa", "Shizuka Momoi", "Shizuka Nonan", "Shizuka Omori", "Shizuka Oshiro", "Shizuka Sugisaki", "Shizuka, 23 Years Old, Junior At The Company", "Shizuka-Chan, 20 Years Old, Apparel Store Clerk", "Shizuki Yonekawa", "Shizuko Fujiki", "Shizuko Yoshinaga", "Shizuku", "Shizuku Kawakami", "Shizuku Mia", "Shizuku Seino", "Shizuku-San", "Shizuku-San, 29 Years Old, Beauty Consultant", "Shizukutsuki Heart Cherry Blossom", "Shizuna Manami", "Shizune Ayame", "Shizune Morisaki", "Shizuya Akari", "Sho Aoyama", "Sho Nishino", "Shoko Akase", "Shoko Akiyama", "Shoko Deyama", "Shoko Furukawa", "Shoko Kakiuchi", "Shoko Matsumoto", "Shoko Matsushima", "Shoko Mikami", "Shoko Otani", "Shoko Takahashi", "Shoko Ueki", "Shono Sora", "Shore", "Short", "Shota Chisato", "Shottan", "Shuen", "Shuji Kusano", "Shuka Katayose", "Shuka, 27 Years Old, Married For 2 Years", "Shun Sakuragi", "Shuna Kagami", "Shunka Miyanoki", "Shunka Suzumura", "Shuri Kyoko", "Siena Day", "Simon", "Sina Show", "Siwasuda", "Sky", "Skyler Snow", "Sleep", "Slender Beauty + Tide Covered Fountain Pussy Ko Momoka 28 Years Old", "Slender Yet With G-Cup Breasts, She Has The Perfect Body!! Hikari-Chan (23 Years Old) Tv Work", "Slim Chic Vic", "Small Flower", "Small Wave Sakura", "Snow", "Snow Dyed", "Snow Moon", "Snow River Cherry Blossoms", "Snow White Hinano", "So Much Asano", "Soa", "Soa Fujisaki", "Soda", "Soil", "Sometime In The Age Of The Gods", "Sometimes", "Sonata", "Song", "Song Yuchuan", "Songnan Yi", "Sonoda", "Sonoda Mion", "Sonoda Seira", "Sonoda Sui", "Sophia Anne Hathaway", "Sophia Burns", "Sophia Lee", "Sora Aoi", "Sora Honda", "Sora Kamikawa", "Sora Mikumo", "Sora Nakagawa", "Sora Sasakawa", "Sora Shiina", "Sora Yumesaki", "Sota Asami", "Sound", "Sound Flower Sakura", "Source Ai", "Source Kanoko", "Soushiro Imaoka", "South", "South Fruit Vegetables", "South Hoshina", "South Iroha", "South Momoko", "Southern Amane", "Soy", "Sparkling Desire", "Sparrow", "Spicy", "Spirit", "Spring", "Spring Breeze Elegance", "Spring Calm Star Flower", "Square Aya", "Squid", "Stacy", "Stand On Ones Feet", "Star Ameri", "Star Seri", "Starry Sky", "Starry Sky Glitter", "Starry Sky Niece", "Su Yutong", "Subaki Ishii", "Suddenly", "Sudo Rin", "Sugimoto", "Sugisaki Barley", "Sugiura Bokki", "Sugiyama", "Sugiyama Giant Hirota", "Suhyun", "Sui Mizumori", "Sukeroku Miuraya", "Sukezaneheita", "Sumie Iwasaki", "Sumikawa Ayu", "Sumino Makise", "Sumire", "Sumire Aisaka", "Sumire Chino", "Sumire Hayase", "Sumire Katsuki", "Sumire Kijima", "Sumire Kishitani", "Sumire Kisu", "Sumire Kuramoto", "Sumire Kurokawa", "Sumire Matsu", "Sumire Mihara", "Sumire Mika", "Sumire Minato", "Sumire Mizukawa", "Sumire Sakaguchi", "Sumire Seto", "Sumire Shiraishi", "Sumire Shiratori", "Sumire Takaoka", "Sumire Takikawa", "Sumire Uchida", "Sumire Yumeno", "Sumire, 31 Years Old, Beauty Salon Manager", "Sumire, 31 Years Old, Married For 3 Years", "Sumire, 34 Years Old, Therapist", "Sumire, 39 Years Old, Beauty Salon Owner", "Sumire-San, 31 Years Old", "Summer", "Summer Buds", "Summer Col", "Summer Color Mika", "Summer Flowers", "Summer Is", "Summer Love Azusa", "Summer Sky Rika", "Summer Yagi Satsuki", "Sunao Kui", "Sunburn Marks Are Too Erotic! H Cup Colossal Tits Black Gal Patra-Chan (22) College Student", "Super Tall 180 Cm! ! Golden Ratio Body Big Cute Gal Zendaya-Chan (22) Neet", "Suwa Tamao", "Suzu Aikawa", "Suzu Amamiya", "Suzu Harumiya", "Suzu Ichinose", "Suzu Kasai", "Suzu Mitake", "Suzu No Ie Rin", "Suzu Otonashi", "Suzu Tanizaki", "Suzu Yamai", "Suzu, 26 Years Old, Is About To Get Married.", "Suzu-San, 36 Years Old, Married For 2 Years", "Suzuha-Chan", "Suzuka Nishikata", "Suzuka Nozawa", "Suzuka Okayama", "Suzuka Tone", "Suzukake Sara", "Suzuki Koharu", "Suzume Mino", "Suzume Yura", "Suzumiya Non", "Suzumiya Uruha", "Suzumura Airi", "Suzuna Nami", "Suzune Cat", "Suzune Hino", "Suzune Hoshino", "Suzune Kiritani", "Suzune Nico", "Suzuno Kashima", "Suzuno Uto", "Suzuya Ichigo", "Swan", "Swan Minami", "Swan Tin", "Sweet Peach", "Sweets", "Swingo", "T-Chan", "Tachibana Fumino", "Tachibana Hina", "Tachibana Hisae", "Tachibana Iori", "Tachibana Iroha", "Tachibana Maple Leaves", "Tachibana Mirai", "Tachibana Shizune", "Tacky", "Tact", "Tadashi Otomo", "Tae", "Tae Kosaka", "Taeko Akiyoshi", "Taguchi-San", "Taka", "Takaboshi Nagisa", "Takagi Misato", "Takahashi, Sales Department, Apparel Materials Manufacturer", "Takahata Shizuku", "Takakazu Oikawa", "Takaki-San", "Takako", "Takako Hanazono", "Takako Moriya", "Takako Nakagawa", "Takanashi Moe", "Takanashi Reina", "Takanashi Rino", "Takanashi Yuzu", "Takao Kaneda", "Takara", "Takarada Monami", "Takashi Haneda", "Takashi Inoue", "Takashi Yoshimura", "Takashiki", "Takayama Botan", "Takayama Chisato", "Takayama Kyoka", "Takayama Tin", "Takayomi Nakazono", "Takehiro Tomiyasu", "Takeru", "Takeshi Oshima", "Takeuchi Sharina", "Takezo", "Taki Yuina", "Takigawa Canon", "Takigawa-San, 27 Years Old, Hairdresser", "Takiguchi", "Takimoto", "Takimoto Shizukuha", "Takonyan", "Taku Yoshimura \xD7", "Talao", "Talia Lane", "Tall 172Cm Short \xD7 G Cup Sudden Acme Gal Mei-Chan (24) Professional Student", "Tamaki Hagiwara", "Tamaki Kurumi", "Tamaki Lala", "Tamaki Momono", "Tamaki Umino", "Tamaki-San", "Tamami Kurokawa", "Tamami Yumoto", "Tamamori Ririka", "Tamao Abe", "Tamao Morikawa", "Tamari Yamaguchi", "Tamasi", "Tameo Sueto", "Tamotsu Oishi", "Tanaka", "Tanaka Bacon", "Tanaka Ichisei", "Tanaka Lemon", "Tanaka Uruha", "Tange", "Taniguchi Shuka", "Tanijiri Amu", "Tano Yu", "Taro Iwashita", "Tatsu", "Tatsumi Yui", "Tatsuro Hibino", "Tatsuya Kirishima", "Tear", "Tears Are Falling", "Tech", "Tekuno", "Tempa", "Template Tomoko", "Template Walnut", "Ten Bundles", "Tendou Ichizen", "Tenga", "Tenharu No Ai", "Tenjin Hagoromo", "Tenka, 30 Years Old, Married For 3 Years.", "Tenkawa Shizuku", "Tenma Yui", "Tenrai Kou", "Tenshi-Chan", "Terada Here", "Terakado Sayaka", "Tetsu Kamiyama", "Tetsuro Hoashi", "Tetsuya Hatanaka", "Tetsuya Ichikawa", "That Is", "The Cheeky Gal E-Chan", "The Planets Strongest Busty H-Cup Colossal Tits Gal Nika-Chan", "The Road Is Heavy", "The Top", "The Wind Is Fast", "The Woman Who Spent More Than 5 Million On Plastic Surgery", "There Is A New Road", "There Is Inari", "Thing", "Thing/18/Female College Student", "This Miyuuka", "Thou Bird Sumika", "Thousand Species China", "Thousands Of Years Old", "Three Climbs", "Three Good Poems", "Three Horny Beauties With Dripping Wet Pussies Even When They Wake Up", "Three Maid Cafe Girls", "Three Plump, Sexy Sluts With Erotic Techniques", "Three Sexy Beauties With God-Like Figures", "Three Slutty Women Who Milk A Mans Raw Cock Dry", "Tiffany Russo", "Tiffany Tatum", "Tiger Kosakai", "Tiger \u25CF Child", "Tikal", "Tikt\u25CFKer Masochistic Meat Toilet Y-Chan", "Timi", "Tin", "Tina", "Tite Tsukino", "Tj Honda", "Toai Nanami", "Toba Iku", "Toba Konae", "Today", "Tojo Summer", "Toko Yoshinaga", "Tokoha Haruka", "Tokunaga Bookmark", "Tomaru Azumi", "Tomifumi", "Tomifumi X", "Tominagas?", "Tomioka Wakana", "Tomis Iori", "Tomita", "Tomiyumi Akita", "Tommy King", "Tomo Horikita", "Tomoe Arakaki", "Tomoe Hikari", "Tomoe Kashihara", "Tomohiro Abe", "Tomohiro Abe Mitsugu Someshima", "Tomoho Kanemura", "Tomoka Akari", "Tomoka Kawaguchi", "Tomoka Mamiya", "Tomoka Takase", "Tomoka, 40 Years Old, Married For 10 Years", "Tomoki, 33 Years Old, Married For 2 Years", "Tomoko Kansaka", "Tomoko Matsushima", "Tomoko Yanagi", "Tomoma Okumura", "Tomomi Kanda", "Tomomi Matsukawa", "Tomomi Ohara", "Tomomi Okanishi", "Tomomi Saito", "Tomomi Yamada", "Tomorrow Future", "Tomorrow Koharu", "Tomorrow Mi Kanna", "Tomorrows Flower", "Tomoyo Isumi", "Tomoyo Teshima", "Tonga", "Tonohanarin", "Tony Oki", "Tony Oki Kashiwagi Junkichi", "Tony Oki\xD7", "Tooru Ozawa", "Top One Flower", "Toppo", "Torai Mirika", "Torigoe Hana", "Toriumi Milk", "Tortilla Suzuki", "Tosaki Someday", "Toshii Iizuka", "Toshiki Saeyama", "Toshio Kusumoto", "Toshiyo Kitamura", "Toudou", "Touha Shiraishi", "Touka Hane", "Touka Udagawa", "Touka Uehara", "Touma Sara", "Towa Aragaki", "Towa Chikawa", "Towa Hasebe", "Towa Makihara", "Towa Misaki", "Towa, 28 Years Old, Married For 2 Years.", "Toy Boy Aizawa", "Toy Boy Aizawa Shibuya Yuta", "Toyohiko Ishibashi", "Toyoshima Koharu", "True North Prayer", "Tsubaki Haruna", "Tsubaki Kato", "Tsubaki Kotoha", "Tsubaki Leo", "Tsubaki No Ai", "Tsubaki Rika", "Tsubaki Yamaguchi", "Tsubaki-San", "Tsubakiori Satomi", "Tsubasa Akimoto", "Tsubasa Hachino", "Tsubasa Honjo", "Tsubasa Kimoto", "Tsubasa Mai", "Tsubasa Mijo", "Tsubasa Miyashita", "Tsubasa Okina", "Tsubomi Mochizuki", "Tsuchiya Kanade", "Tsuda Hotaru", "Tsugumi Aida", "Tsugumi Matsuzaka", "Tsugumi Morimoto", "Tsugumi Mutou", "Tsujimura", "Tsukahara Kaede", "Tsukasa", "Tsukasa Aoi", "Tsukasa Fujino", "Tsukasa Hirata", "Tsukasa Imai", "Tsukasa Mikoto", "Tsukasa Nagano", "Tsukasa Nonomiya", "Tsukasa Tachibana", "Tsukigami Karin", "Tsukigaoka Kureha", "Tsukihi", "Tsukimi Wakaba", "Tsukimiya Nene", "Tsukimoto Misaki", "Tsukino Chrollo", "Tsukino Fuwari", "Tsukino Luna", "Tsukino Natsuki", "Tsukino Okawa", "Tsukino Saito", "Tsukino Sakura", "Tsukino Yoi", "Tsukino*Anna", "Tsukinoe Sui", "Tsukishima Kanon", "Tsukuba Mei", "Tsukushi", "Tsumugi Akari", "Tsumugi Yura", "Tsunami Aoi", "Tsuruta Kana", "Tsuyopon", "Tsuyoshi", "Turtle Imada", "Twin Sister @Yuki", "Two 20-Year-Old Petite Beautiful Girls", "Tyson", "Ueda Milky", "Ueda Sana", "Ueto Riko", "Uji", "Ukifune Minami", "Umeda-San, Shinjuku Ward", "Umekawa Arashi", "Umi Hachiko", "Umi Hinata", "Umi Hirose", "Umi Natsukawa", "Umi Oikawa", "Umika, 26 Years Old, Model", "Umino Firefly", "Umino Miu", "Umizusaki Style", "Umpai", "Unexplored", "Unkoshi Rina", "Unno Salmon Roe", "Uno Kanna", "Uozumi Sakura", "Upper Vegetable Ear", "Urakami Hinori", "Uran Kobayashi", "Urara Motomura", "Urara Sasahara", "Urara, 24 Years Old, Hair And Makeup", "Urara, 36 Years Old, Nurse", "Uraraka Rei", "Uru", "Uruha", "Uruha Himeno", "Uruki Sarara", "Urumi Yurisaki", "Usagi Peach", "Usami Bell", "Usami Sui", "Usui Natsume", "Usui Pass", "Uta Yumemite", "Utano Heart", "Uzuki Chihaya", "Uzume Ayaka", "Venom", "Veronica Avlove", "Veronica Reel", "Vicky Brown", "Victoria", "Victoria Sweet", "View", "View Natsuki Ramii", "Violet", "Violet Star", "Wachi Subaru", "Waguri Yuyu", "Waka", "Waka Hayase", "Waka Misono", "Waka Narumi", "Waka Natsuki", "Waka Ninomiya", "Waka Sato", "Waka Takatsuki", "Wakaba Onoe", "Wakamatsu Licking", "Wakamiya", "Wakamiya Otoha", "Wakana Aoi", "Wakana Sakura", "Wakana Shiroyama", "Wakatsuki Iroha", "Wakatsuki Moa", "Wakui Peach", "Walnut", "Walnut (21) College Student", "Walnut Walnut", "Wang Ke Lin", "Wasabi", "Watai Fuu", "Watanabe Momo", "Watanabe Sawa", "Watanabe Ui", "Watanabe-San", "Watari", "Water", "Water Leaf", "Watercolor Autumn", "Wato Kokoro", "Wave Monet", "Waya Yura", "Weather Momoka", "Wen Lei Xin", "West Exit Hail", "When 28 Years Old Secretary", "When The Sun Rises", "White Capital Four Seasons", "White Cloud Candy", "White Flower", "White Flowers", "White Peach Hana", "White People", "Wild Spring Sweetfish", "Wolf Tanaka", "Wonder", "Xenia", "Ya Sayaka", "Yagami Mirai", "Yakumo Rin", "Yamabuki Sky", "Yamada Suzuna", "Yamaguchi Firefly", "Yamaguchi Here", "Yamamoto Bell", "Yamamoto Kasumi", "Yamamoto Miwako", "Yaman", "Yamashiro Crescent Moon", "Yamashita Miyu", "Yamate Shiori", "Yamori Wakana", "Yanagida Miyoshi", "Yanagida Yayoi", "Yanai Mel", "Yano Ayaka", "Yano Kozuru", "Yao Yao", "Yas", "Yasu Daikichi", "Yasui Mia", "Yasuka Asakawa", "Yasuko Ogata", "Yatsuhashi Saiko", "Yay Takashima", "Yayoi", "Yayoi Amano", "Yayoi Beach", "Yayoi Iriyama", "Yayoi Matsushita", "Yayoi Tanaka", "Yayoi Uemoto", "Yayoi Yamada", "Yayoi, 32 Years Old, Therapist", "Yin Yin", "Yo Ashida", "Yo Yoshinaga", "Yoda Hikage", "Yoda Rin", "Yoha Ishikawa", "Yoichi Matsumoto", "Yoji Agawa", "Yoko Hashimoto", "Yoko Iijima", "Yoko Mamiya", "Yoko Minegishi", "Yoko Nagase", "Yoko Nomiya", "Yoko Ogawa", "Yoko Omine", "Yoko Sasakawa", "Yoko Shirayama", "Yoko Wakui", "Yokokawa Wants To Do Latissimus Dorsi Muscle Training", "Yokomiya Nanami", "Yomaru", "Yomi Hayami", "Yonekura", "Yonezu", "Yori Sorami", "Yoriko Otaka", "Yosaki Hanane", "Yoshi Hattori", "Yoshiaki Ito", "Yoshida Hana", "Yoshida, Publishing Department, General Publishing Company", "Yoshie Fujimoto", "Yoshie Mizuno", "Yoshie Shiraishi", "Yoshihiko Arima", "Yoshiho Saki", "Yoshii Miki", "Yoshika", "Yoshika Futaba", "Yoshika Wataya", "Yoshiko Hattori", "Yoshiko Okayama", "Yoshiko Yamashita", "Yoshimi Mizuno", "Yoshimi Nitta", "Yoshinaga Akane", "Yoshino Atsushi.", "Yoshino Fukatsu", "Yoshino Hashiba", "Yoshino Kamizawa", "Yoshino Mitsuba", "Yoshino Momoka", "Yoshino Moriya", "Yoshino Sawa", "Yoshio Umeda", "Yoshioka Tomorrow Sea", "Yoshiya Minami", "Yotsuba Kominato", "Yotsubamerou", "You", "You And Ayumi", "You Know The Future", "Youki Yuino", "Youku", "Youto", "Yu", "Yu Aine", "Yu Amagi", "Yu Aoi Aoi", "Yu Aozora", "Yu Asagiri", "Yu Asakura", "Yu Fujisawa", "Yu Hironaka", "Yu Kataoka", "Yu Kawakami", "Yu Kawakami", "Yu Kioka", "Yu Konishi", "Yu Kuroi", "Yu Mito", "Yu Miyajima", "Yu Mizuki", "Yu Nagano", "Yu Okubo", "Yu Sakura", "Yu Sasamoto", "Yu Shiraishi", "Yu Tachibana", "Yu Uehara", "Yu Yamamoto", "Yu/New Therapist", "Yua", "Yua Aisaki", "Yua Araki", "Yua Ariga", "Yua Asakura", "Yua Fukuda", "Yua Hidaka", "Yua Imai", "Yua Matsune", "Yua Mikami", "Yua Minase", "Yua Nanato", "Yua Omori", "Yua Otoha", "Yua Shimizu", "Yua Takanashi", "Yua Uehara", "Yua, 28 Years Old", "Yuai Kana", "Yubi On", "Yuduki Yuduki", "Yue Hiiragi", "Yuhi Shizuku", "Yuho Hotaka", "Yui", "Yui", "Yui Aihara", "Yui Aikawa", "Yui Amanatsu", "Yui Arisaka", "Yui Asano", "Yui Ayana", "Yui Ayase", "Yui Haruna", "Yui Hashimoto", "Yui Hatano", "Yui Hidaka", "Yui Hiiragi", "Yui Hikari", "Yui Himekawa", "Yui Ishikawa", "Yui Kanda", "Yui Kasugano", "Yui Kato", "Yui Kawagoe", "Yui Kawai", "Yui Kawamura", "Yui Kisaragi", "Yui Koike", "Yui Kuramochi", "Yui Maino", "Yui Mamiya", "Yui Mayu", "Yui Mihama", "Yui Mihashi", "Yui Miho", "Yui Minami", "Yui Misaki", "Yui Nagase", "Yui Nanase", "Yui Nanase", "Yui Natsuhara", "Yui Nishikawa", "Yui Nonami", "Yui Saotome", "Yui Sasamoto", "Yui Satonaka", "Yui Sayama", "Yui Shimazaki", "Yui Shinjo", "Yui Shiomi", "Yui Shirasaka", "Yui Takamiya", "Yui Tojo", "Yui Tomita", "Yui Tsujino", "Yui Usami", "Yui Wakatsuki", "Yui Yamaguchi", "Yui Yasaki", "Yui, 26 Years Old, Part-Time Worker", "Yui, 27 Years Old, Married For 6 Months", "Yui, 32 Years Old, Married For 4 Years", "Yui-Chan", "Yui-Chan, 23 Years Old, Dental Assistant", "Yui-Chan, 24 Years Old, Yakiniku Restaurant Part-Time Worker", "Yuiga In The Sky", "Yuika Aoi", "Yuika Itano", "Yuika Onozaka", "Yuika, 24 Years Old, Senior At Work", "Yuiki Rumina", "Yuina Mitsuki", "Yuina Momoki", "Yuina Sakurano", "Yuina Tokito", "Yuina Uno", "Yuina, 28 Years Old, Married For 2 Years", "Yuino", "Yuipi", "Yuji Yamada", "Yuji Yamada\xD7", "Yuka", "Yuka Aoba", "Yuka Aoi", "Yuka Aota", "Yuka Arai", "Yuka Arakita", "Yuka Asami", "Yuka Chiba", "Yuka Hashimoto", "Yuka Hirose", "Yuka Honjo", "Yuka Hoshi", "Yuka Hotaka", "Yuka Ichii", "Yuka Matsushita", "Yuka Minase", "Yuka Mishima", "Yuka Miyano", "Yuka Mizuno", "Yuka Nakamura", "Yuka Okada", "Yuka Oshima", "Yuka Sano", "Yuka Sato", "Yuka Shinohara", "Yuka Tachibana", "Yuka Tada", "Yuka Takahashi", "Yuka Taniguchi", "Yuka Tori", "Yuka Tsubasa", "Yuka, 25 Years Old, Dental Hygienist", "Yukako Kusunoki", "Yukari", "Yukari Abe", "Yukari Ai", "Yukari Fujimiya", "Yukari Ishihara", "Yukari Kaede", "Yukari Maki", "Yukari Masaki", "Yukari Matsuzawa", "Yukari Mikawa", "Yukari Mitsuya", "Yukari Miyazawa", "Yukari Orihara", "Yukari Sakoda", "Yukari Sato", "Yukari Shizuki", "Yukari-Chan", "Yuki Abe", "Yuki And A", "Yuki Ebihara", "Yuki Erina", "Yuki Fukuda", "Yuki Hanano", "Yuki Hiiragi", "Yuki Ito", "Yuki Kaieda", "Yuki Kasuga", "Yuki Kasumi", "Yuki Kobashi", "Yuki Kurata", "Yuki Maeda", "Yuki Makimura", "Yuki Mashiro", "Yuki Matsuura", "Yuki Mikami", "Yuki Mikami", "Yuki Misa", "Yuki Miyama", "Yuki Mizuki", "Yuki Nanami", "Yuki Nanao", "Yuki Natsu Ao", "Yuki Natsume", "Yuki Rino", "Yuki Sanada", "Yuki Seijyo", "Yuki Shinoda", "Yuki Shinomiya", "Yuki Shiori", "Yuki Shiratori", "Yuki Shizuku", "Yuki Suzu", "Yuki Takarabe", "Yuki Takeuchi", "Yuki Takizawa", "Yuki Tanihara", "Yuki Tanimura", "Yuki Toma", "Yuki Wakaba", "Yuki White Coat", "Yuki Yoshizawa", "Yuki \u6200", "Yuki, 23 Years Old, Cram School Teacher", "Yuki, 27 Years Old, Soba Restaurant Employee", "Yuki, 28 Years Old", "Yuki, 30 Years Old", "Yukie Aono", "Yukie Asagi", "Yukie Miyamae", "Yukie Mizukami", "Yukie Natsuki", "Yukie Shoji", "Yukiho Shirase", "Yukika Kamine", "Yukiko Ishihara", "Yukiko Matsunaga", "Yukiko Suou", "Yukiko Togashi", "Yukimi Chinatsu", "Yukimi Emiru", "Yukimi Honoka", "Yukimura Izuki", "Yukimura Kina", "Yukina Aoyama", "Yukina Futaba", "Yukina Hasegawa", "Yukina Matsuura", "Yukina Midwinter", "Yukina Saeki", "Yukina Sakurami", "Yukina Shida", "Yukine Nagasaki", "Yukine Sakuragi", "Yukino Amagi", "Yukino Asakura", "Yukino Eru", "Yukino Hishida", "Yukino Imamura", "Yukino Kaho", "Yukino Kuramoto", "Yukino Matsu", "Yukino Miya", "Yukino Mori", "Yukino Nagasawa", "Yukino Nagimiya", "Yukino Nakajima", "Yukino Oshiro", "Yukino Sano", "Yukino Shindo", "Yukino Ueda", "Yukis", "Yukisaki Sumire", "Yukishiro Ichiho", "Yukishiro Miho", "Yukiyo, 25 Years Old, Cosmetics Sales", "Yuko", "Yuko Anritsu", "Yuko Ashikawa", "Yuko Fukuda", "Yuko Gunji", "Yuko Haruno", "Yuko Hasegawa", "Yuko Kikushima", "Yuko Matsui", "Yuko Mitsuki", "Yuko Miura", "Yuko Miyagawa", "Yuko Morishita", "Yuko Nakatani", "Yuko Ono", "Yuko Sakurai", "Yuko Tenkata", "Yukyun", "Yukyun\xD7", "Yulia Kano", "Yuma Asami", "Yuma Inukai", "Yuma Kouda", "Yuma Kumojo I\u25CFStagrammer", "Yuma Miyazaki", "Yuma Sano", "Yume Asaba", "Yume Fukada", "Yume Hoshino", "Yume Igarashi", "Yume Imano", "Yume Izumi", "Yume Kato", "Yume Kotoishi", "Yume Nikaido", "Yume Nishimiya", "Yume Takeda", "Yume, 25 Years Old, Jewelry Store", "Yumeka Aino", "Yumeka Kikukawa", "Yumeno Aika", "Yumeno Misaki", "Yumeno Noa", "Yumeno, 3Rd Year Female University Student", "Yumenoya Poison Flower", "Yumesaki Kanon", "Yumi", "Yumi Anno", "Yumi Furuse", "Yumi Imamura", "Yumi Kazama", "Yumi Kuramochi", "Yumi Mizusaki", "Yumi Nagase", "Yumi Nenaka", "Yumi Nijimura", "Yumi Sakashita", "Yumi Sakuma", "Yumi Sakurai", "Yumi Sawamura", "Yumi Tanaka", "Yumi Taniguchi", "Yumi, 21 Years Old, University Student", "Yumi, 23 Years Old, Mobile Phone Shop Crew", "Yumika Nanaki", "Yumika Saeki", "Yumiko Sakura", "Yumiko Yamaguchi", "Yumina Hirosaki", "Yumina Miyafuji", "Yun Narushima", "Yuna", "Yuna Ayaba", "Yuna Hasegawa", "Yuna Hayashi", "Yuna Hinano", "Yuna Honda", "Yuna Hoshisaki", "Yuna Ishikawa", "Yuna Katase", "Yuna Kitano", "Yuna Maida", "Yuna Mashiro", "Yuna Minagawa", "Yuna Mitake", "Yuna Mizumoto", "Yuna Mori", "Yuna Ogura", "Yuna Sakura", "Yuna Sakuragi", "Yuna Sakurai", "Yuna Shiina", "Yuna Takase", "Yuna Tsubaki", "Yuni", "Yuno Asahi", "Yuno Asahina", "Yuno Harukawa", "Yuno Hoshi", "Yuno Isshiki", "Yuno Kisaragi", "Yuno Kumamiya", "Yuno Makikawa", "Yuno Natsukawa", "Yuno Yume", "Yunon Hoshimiya", "Yura", "Yura Adachi", "Yura Asakura", "Yura Kana", "Yura Kano", "Yura Kokona", "Yura Kudo", "Yura Nanase", "Yura Okuyama", "Yura Takahashi", "Yuri Adachi", "Yuri Hanai", "Yuri Hirose", "Yuri Ieiri", "Yuri Ikuta", "Yuri Katahira", "Yuri Kudo", "Yuri Kuroda", "Yuri Maeda", "Yuri Matsumura", "Yuri Mikami", "Yuri Minazuki", "Yuri Mitsuya", "Yuri Miyazawa", "Yuri Mochizuki", "Yuri Momose", "Yuri Morishita", "Yuri Nagakura", "Yuri Nikaido", "Yuri Nonami", "Yuri Omori", "Yuri Saegusa", "Yuri Sakura", "Yuri Sasahara", "Yuri Sato", "Yuri Satsuki", "Yuri Shinomiya", "Yuri Shiraishi", "Yuri Shirasaka", "Yuri Sugawara", "Yuri Tadokoro", "Yuri Takahata", "Yuri Wakatsuki", "Yuri Yamagishi", "Yuri Yamamoto", "Yuri Yuri", "Yuri, 25 Years Old, Beauty Influencer", "Yuri, 32 Years Old, Aga Clinic Counselor", "Yuri-Chan, 23 Years Old", "Yuria Fujisawa", "Yuria Hafu", "Yuria Mano", "Yuria Nanamiya", "Yuria Ohara", "Yuria Seto", "Yuria Tachiki", "Yuria Toda", "Yuria Yoshine", "Yurie Goto", "Yurie Hoshino", "Yurie Minamizawa", "Yurien Miori", "Yuriha", "Yurika Goto", "Yurika Hiyama", "Yurika Mine", "Yurika Natsumi", "Yurika Otsuki", "Yurika Uezono", "Yurikawa Masa", "Yurikawa Sara", "Yuriko Aiga", "Yuriko Hosaka", "Yuriko Kashiwagi", "Yuriko Matsumoto", "Yuriko Mitaka", "Yuriko Mogami", "Yuriko Oka", "Yuriko Ranch", "Yuriko Sato", "Yuriko Shiomi", "Yuriko Takazono", "Yuriko Tokiwa", "Yuriko Yoshioka", "Yurina Aizawa", "Yurina Amaki", "Yurina Ayashiro", "Yurina Kurisawa", "Yurina Matsuzaka", "Yurina Momose", "Yurina Shoji", "Yurina Wakabayashi", "Yurine Tsukino", "Yurion Koizumi", "Yurira", "Yusa Arisu", "Yusai Fujii", "Yusuke Nishijima", "Yusuke Nishijimayusuke Nishijima", "Yuta Aoi", "Yuta Aoi Futoshi", "Yuta Imai", "Yuta Shibuya", "Yuto Izaki", "Yuto Kuroda.", "Yuu Kitayama", "Yuu Miharu", "Yuu Tsuru", "Yuuha Kiriyama", "Yuuhi Imai", "Yuuhi Inamori", "Yuuhi Shibamori", "Yuuka An", "Yuuka Murakami", "Yuuka Oda", "Yuuka Shinomiya", "Yuuka Waraku", "Yuuki Akagi", "Yuuki Aoi", "Yuuki Hodaka", "Yuuki Iori", "Yuuki Karina", "Yuuki Sasaki", "Yuuki Shiina", "Yuuki Tokuda", "Yuuki Yanagi", "Yuuki Yuzuru X", "Yuuna Himekawa", "Yuuna Nishimura", "Yuuna Shirahoshi", "Yuuri Aise", "Yuuri Asada", "Yuuri Kirika", "Yuuri Nao", "Yuuri Osawa", "Yuuri Oshikawa", "Yuuto Kuroda", "Yuwa", "Yuwa~Mao~", "Yuya Kubota", "Yuyu Esumi", "Yuzu Akina", "Yuzu Aoi", "Yuzu Fujita", "Yuzu Hanasaki", "Yuzu Hasegawa", "Yuzu Kitagawa", "Yuzu Leaf Aoi", "Yuzu Sakurai", "Yuzu Shinkawa", "Yuzu Shirakawa", "Yuzu Shirasaki", "Yuzu-San, 28 Years Old, Married For 1 Year", "Yuzuka Kirishima", "Yuzuka Shirai", "Yuzuki", "Yuzuki Aira", "Yuzuki Cocona", "Yuzuki Hoshino", "Yuzuki Liana", "Yuzuki Momoi", "Yuzuki Sera", "Yuzuki Shiina", "Yuzuki Sunflower", "Yuzuki Yuka", "Yuzuki Yuru", "Yuzuki, 31 Years Old, Married For 3 Years", "Yuzuki-Chan", "Yuzumi Aihara", "Yuzuna Minamotokawa", "Yuzuri Haena", "Yuzuru Yuki", "Yuzuru Yuuki", "Y\u25CEUtuberh-Chan", "Zakoman-Chan, 24 Years Old, Bank Employee", "Zeitgeist", "Zia Darza", "Zoe Cush", "Zoe Hollowway"];
var categories_default = ["123av", "16 Hours Or More", "1pondo", "30 Years Old", "3D", "3P", "3P, 4P", "4 Hours Or More", "40 Years Old", "4K", "69", "8Kvr", "Acme Orgasm", "Acting", "Actress Collection", "Adopted Daughter", "Adultery", "Advertising Idol", "Aesthetics And Massage", "Affair", "Ai-Generated Works", "Amateur", "Anal Sex", "Anchorwoman", "Animation", "Anus", "Aokan", "Aphrodisiac", "Apron", "Artist", "Asian Actress", "Athlete", "Aunt", "Av Open 2014 Middleweight", "Av Open 2015 Fetish Department", "Av Open 2015 Planning Department", "Av Open 2016 Actress Department", "Av Open 2016 Drama Department", "Av Open 2016 Fetish Department", "Av Open 2016 Planning Department", "Av Open 2017 Drama Department", "Av Open 2017 Girls Department", "Baby Face", "Back", "Ball Gag", "Bareback", "Bathing", "Bathtub", "Beautiful Breasts", "Beautiful Butt", "Beautiful Chest", "Beautiful Girl", "Beautiful Legs", "Beautiful Mature Woman", "Beautiful Woman", "Beauty Salon And Massage", "Being Cheated On / Acts Of Being Cheated On", "Best", "Best Porn", "Big Ass", "Big Breast Fetish", "Big Breasts", "Big Pennis", "Big Tits", "Bishri", "Bitch", "Bl", "Black Hair", "Black Male Actor", "Blog", "Blond", "Blonde", "Blonde / Blonde", "Bloomers", "Blow Mono", "Body Piercing", "Bonus Footage Exclusive To Mgs Included", "Bonus Images Included", "Boots", "Braless", "Breast Milk", "Bride", "Bride / Young Wife", "Bronze", "Brown Hair", "Bubble Bath", "Bubble Socks", "Bukkake", "Bunny Girl", "Business Clothing", "Butt Fetish", "By Idol", "Call Girl", "Campus Story", "Candle", "Car Sex", "Caribbeancom", "Caribbeancompr", "Catwoman", "Celebrity", "Censored", "Cheating", "Cheating / Cuckold", "Cheating Wife, Ntr, Cuckold", "Cheerleaders", "Cheongsam", "Chief", "Chijo", "Childhood", "Childish Face", "Chinese AV", "Classic", "Clinic", "Close Up", "Club Activity Manager", "Collaborative Work", "Collection", "Coma", "Comes With Bonus Footage Only For Mgs", "Confession Experience", "Contribution", "Cosplay", "Couple", "Creampie", "Cruel", "Cuckold", "Cuckolding / Being Cuckolded", "Cum In Mouth", "Cunnilingus", "Customs", "Cute Little Boy", "D Cup", "Dance", "Dark Style", "Dating", "De M", "Debut", "Defecation", "Delivery Only", "Delivery-Only Amateur", "Delusion", "Dildo", "Dirty Talk", "Dirty Words", "Distribution Only", "Dm150/en/fc2", "Dm29/en/xxxav", "Documentary", "Doggy Style", "Doll", "Double Penetration", "Drink Urine", "Drugs And Aphrodisiacs", "E Cup", "Eat Pussy", "Eat Shit", "Ejection", "Elder Sister", "Emmanuel", "En/caribbeancom", "En/english subtitle", "En/fc2", "En/madou", "En/marriedslash", "En/naughty0930", "En/naughty4610", "En/tokyohot", "En/uncensored leak", "En/xxxav", "Enema", "English", "English Subtitle", "Entertainer", "Erotic Photo", "Esthetic Massage", "Exactly Like", "Exclusive", "Exhibition", "Expose", "Extreme Orgasm", "F Cup", "Face Ride", "Fair Skin", "Famous", "Fantasy", "Fanza Limited", "Fat Girl", "father in law", "favorite", "Fc2", "Fear", "Female Boss", "Female College Student", "Female Doctor", "Female Investigator", "Female Ninja", "Female Teacher", "Female Warrior", "Femdom Slave", "Feminine", "Fetish", "Fighter", "Fighting", "Fingering", "First Shoot", "First Shot", "First Time Filming", "Fist", "Flight Attendant", "Foot Fetish", "Footjob", "Forced Blowjob", "Foreign Actress", "Foreign Object Penetration", "Foreigner", "Forty Years Old", "Friend", "Full Hd (Fhd)", "G Cup", "Gachinco", "Gang Rape", "Gangster", "Gansha", "Girl Guide", "Glasses Girl", "Grandfather", "Grandma", "Group Bukkake", "Gym Suit", "H Cup", "Hair Salons And Massage Parlors", "Hairlessness", "Handjob And Blowjob", "Hardcore", "Harem", "Hatsuura", "Hd", "Hell Road", "Heyzo", "High Heels", "High Quality Vr", "High School Girl", "Hit On Boys", "Hit On Girls", "Hmp40% Off Sale", "Homosexual", "Horse Riding", "Hot Girl", "Hot Spring", "Hotel", "Hotel Owner", "Housewife", "How To", "Humiliation", "Hysteroscope", "Ignoring", "Imprisonment", "In Love", "Incest", "Incident", "Individual", "Ingo", "Instant Sex", "Insult", "Internal Ejaculation", "Interview", "Its Pretty Clean", "Japanese", "Jav English Sub", "JavGuru", "Javtiful", "Kimono", "Kimono / Yukata", "Kimono And Yukata", "Kireina_Onesan", "Kiss", "Knee Socks", "Kogal", "Kounai Hassha", "Kyoshi", "Large Breasts", "Lecturer", "Lesbian", "Lesbian Kiss", "Limited Time", "Lolita", "Long Hair", "Low Cost Movies", "Lucky Bag", "M Female", "M Male", "M_Yes", "Madou", "Magical Girl", "Maid", "Male And Female Sex", "Male Squirting", "Maltreat", "Manners And Customs", "Married Woman", "Marrying For Business", "Mask", "Massage", "Massage Oil", "Masturbate", "Masturbation", "Masturbation Support", "Mature Beauty", "Mature Woman", "Mature Women / Married Women", "Micro", "Mini Skirt", "Miniskirt Policewoman", "Mischief", "Missy", "Model", "Mother", "Mother Friend", "Multi-Person", "Multiple", "Multiple Stories", "Muscle", "Myodo", "Naked Apron", "Naughty4610", "Nausea", "Neat", "Neat And Clean", "New Student", "Newcomer Debut", "Nice Ass", "Nice Boobs", "No Underwear", "Non-Nude", "Nose Hook", "Ntr", "Nurse", "Office Lady", "Ol", "One Piece Dress", "Oral Ejaculation", "Oral Firing", "Oral Sex", "Ordinary Person", "Orgy", "Original", "Original Feeling", "Otaku", "Other", "Outdoor Exposure", "Outdoors", "Pacopacomama", "Pantyhose", "Pantyhose Thing", "Partner Exchange", "Pee", "Petite", "Physical Education", "Piledriver", "Pissing / Incontinence", "Planning", "Play", "Plot", "Pornstar", "Pregnant", "Pregnant Woman", "Premature Ejaculation", "Pretty Girl", "Princess", "Private Teacher", "Promiscuity", "Promiscuous", "Prostitute", "Prostitution", "Proud Pussy", "Pure", "Queen", "Racing Girl", "Ranko", "Rape", "Raw Digging", "Realistic Version Of The Game", "Receptionist", "Reducing Mosaic", "Reducing Mosaic English Subtitle", "Rejuvenation Massage", "Release", "Reproduce", "Restraint", "Ride", "Romantic Comedy", "Saddle", "Sailor Suit", "Salt Wipe", "Sample Video", "School Girls", "School Teacher", "Science Fiction", "Scold", "Secretary", "Selfie", "Semen", "Set Product", "Sex", "Sex Education", "Sex For Business", "Sex Friend", "Sexy", "Sexy Legs", "Sf", "Shame", "Shaving", "Short Hair", "Short Skirt", "Shortcut", "Shower", "Similar", "Single Work", "Sister", "Sistine", "Skirt Mono", "Slim", "Slim Pixelated", "Slim Waist", "Slut", "Sm", "Small Breasts", "Sneak Shots", "Soapland", "Soft Body", "Sorority", "Spanking", "Sportswear", "Squirting", "Stepmother", "Stewardess Ca", "Stewardesses And Flight Attendants", "Stool", "Subjective Perspective", "Subjectivity", "Subordinate Or Colleague", "Super Breasts", "Surface Area", "Swallow Sperm", "Sweating", "Sweet Ass", "Swimsuit", "Taiwan Model", "Tall Lady", "Tan", "Tattoos", "Teacher", "Tentacle", "Thanks Offering", "Thirty", "Tickle", "Tied Up", "Time Stops", "Tit Job", "Together", "Tokyohot", "Torture", "Toy", "Training", "Transform To Heroine", "Transgender", "Transsexual", "Transsexuals", "Travel", "Ultra Slim Pixelated", "Uncensored", "Uncensored leak", "Uncensored Leaked", "Underwear", "Uniform", "Urinate", "Urination / Incontinence", "Uterus", "Various Occupations", "Vibrating Egg", "Vibrator", "Vigne", "Viral", "Virgin", "Vomit", "Voyeur", "Vr", "Waitress", "White Skin", "Whites", "Widow", "Wife", "Witch", "With Bonus Video Only For Mgs", "Xxxav", "Yoga", "Yokui", "Young", "Young Wife"];
var TARGET_BASE4 = "https://server.apijav.com/wp-json/myvideo/v1";
var LANGS = ["zh-TW", "zh-CN", "en", "ja", "ko", "ms", "th", "de", "fr", "vi", "id", "fil", "pt"];
var HREFLANG_CODE_MAP = { fil: "tl" };
var hreflangCode = /* @__PURE__ */ __name2((lang) => HREFLANG_CODE_MAP[lang] || lang, "hreflangCode");
var DOMAIN = "https://www.missav-j.com";
var STATIC_ROUTES = [
  { path: "", priority: "1.0", changefreq: "daily" },
  { path: "trending", priority: "0.9", changefreq: "daily" },
  { path: "recent", priority: "0.9", changefreq: "daily" },
  { path: "actors", priority: "0.8", changefreq: "weekly" },
  { path: "categories", priority: "0.8", changefreq: "weekly" },
  { path: "studios", priority: "0.8", changefreq: "weekly" },
  { path: "popular-actors", priority: "0.7", changefreq: "weekly" }
];
var STUDIOS = [
  "S1 NO.1 STYLE",
  "MOODYZ",
  "PRESTIGE",
  "Soft On Demand",
  "Idea Pocket",
  "FALENO",
  "MUTEKI",
  "Fitch",
  "OPPAL",
  "Kawaii*",
  "KMP",
  "Attackers",
  "Premium",
  "Other"
];
var ACTORS_PER_SITEMAP = 4e4;
var ACTORS_SITEMAP_COUNT = Math.ceil(actors_default.length / ACTORS_PER_SITEMAP);
function escXml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}
__name(escXml, "escXml");
__name2(escXml, "escXml");
function slugify2(text) {
  if (!text) return "";
  return text.toString().toLowerCase().trim().replace(/[\s\-_]+/g, "-").replace(/[^\p{L}\p{N}\-]/gu, "").replace(/-+/g, "-").replace(/^-+/, "").replace(/-+$/, "");
}
__name(slugify2, "slugify2");
__name2(slugify2, "slugify");
function getSlug(code, title) {
  const cleanCode = slugify2(code || "");
  const cleanTitle = slugify2(title || "");
  let slug = "";
  if (cleanCode && cleanTitle) {
    slug = `${cleanCode}-${cleanTitle}`;
  } else if (cleanCode) {
    slug = cleanCode;
  } else if (cleanTitle) {
    slug = cleanTitle;
  } else {
    slug = "video";
  }
  if (slug.length > 100) {
    slug = slug.substring(0, 100);
  }
  return slug;
}
__name(getSlug, "getSlug");
__name2(getSlug, "getSlug");
function getLocalizedSlug(code, title, translations, lang) {
  if (lang === "en") {
    return getSlug(code, title);
  }
  const tTitle = translations && translations[lang] ? translations[lang] : title;
  return getSlug(code, tTitle);
}
__name(getLocalizedSlug, "getLocalizedSlug");
__name2(getLocalizedSlug, "getLocalizedSlug");
async function getBatchTranslationsFromDb2(ids, supabaseUrl, supabaseKey) {
  if (!ids || ids.length === 0) return {};
  const batchSize = 500;
  const results = {};
  for (let i = 0; i < ids.length; i += batchSize) {
    const chunk = ids.slice(i, i + batchSize);
    try {
      const res = await fetch(`${supabaseUrl}/rest/v1/translations?id=in.(${chunk.join(",")})&select=id,translations`, {
        headers: {
          "apikey": supabaseKey,
          "Authorization": `Bearer ${supabaseKey}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          data.forEach((item) => {
            results[item.id] = item.translations;
          });
        }
      }
    } catch (e) {
      console.error("Supabase batch query error:", e);
    }
  }
  return results;
}
__name(getBatchTranslationsFromDb2, "getBatchTranslationsFromDb2");
__name2(getBatchTranslationsFromDb2, "getBatchTranslationsFromDb");
function buildAlternates(makeUrl) {
  let xml = "";
  for (const l of LANGS) {
    xml += `    <xhtml:link rel="alternate" hreflang="${hreflangCode(l)}" href="${escXml(makeUrl(l))}" />
`;
  }
  xml += `    <xhtml:link rel="alternate" hreflang="x-default" href="${escXml(makeUrl("en"))}" />
`;
  return xml;
}
__name(buildAlternates, "buildAlternates");
__name2(buildAlternates, "buildAlternates");
function urlsetOpen() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
`;
}
__name(urlsetOpen, "urlsetOpen");
__name2(urlsetOpen, "urlsetOpen");
function generatePagesSitemap() {
  const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
  let xml = urlsetOpen();
  for (const route of STATIC_ROUTES) {
    const routePath = route.path;
    const makeUrl = /* @__PURE__ */ __name2((lang) => {
      const p = routePath ? `/${lang}/${routePath}` : `/${lang}`;
      return `${DOMAIN}${p}`;
    }, "makeUrl");
    xml += `  <url>
`;
    xml += `    <loc>${escXml(makeUrl("en"))}</loc>
`;
    xml += `    <lastmod>${today}</lastmod>
`;
    xml += `    <changefreq>${route.changefreq}</changefreq>
`;
    xml += `    <priority>${route.priority}</priority>
`;
    xml += buildAlternates(makeUrl);
    xml += `  </url>
`;
  }
  xml += `</urlset>
`;
  return xml;
}
__name(generatePagesSitemap, "generatePagesSitemap");
__name2(generatePagesSitemap, "generatePagesSitemap");
function generateActorsSitemap(pageNum) {
  const start = (pageNum - 1) * ACTORS_PER_SITEMAP;
  const end = Math.min(start + ACTORS_PER_SITEMAP, actors_default.length);
  const batch = actors_default.slice(start, end);
  const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
  let xml = urlsetOpen();
  for (const actorName of batch) {
    const encoded = encodeURIComponent(actorName);
    const makeUrl = /* @__PURE__ */ __name2((lang) => `${DOMAIN}/${lang}/actor?name=${encoded}`, "makeUrl");
    xml += `  <url>
`;
    xml += `    <loc>${escXml(makeUrl("en"))}</loc>
`;
    xml += `    <lastmod>${today}</lastmod>
`;
    xml += `    <changefreq>weekly</changefreq>
`;
    xml += `    <priority>0.6</priority>
`;
    xml += buildAlternates(makeUrl);
    xml += `  </url>
`;
  }
  xml += `</urlset>
`;
  return xml;
}
__name(generateActorsSitemap, "generateActorsSitemap");
__name2(generateActorsSitemap, "generateActorsSitemap");
function generateCategoriesSitemap() {
  const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
  let xml = urlsetOpen();
  for (const catName of categories_default) {
    const encoded = encodeURIComponent(catName);
    const makeUrl = /* @__PURE__ */ __name2((lang) => `${DOMAIN}/${lang}/category?name=${encoded}`, "makeUrl");
    xml += `  <url>
`;
    xml += `    <loc>${escXml(makeUrl("en"))}</loc>
`;
    xml += `    <lastmod>${today}</lastmod>
`;
    xml += `    <changefreq>weekly</changefreq>
`;
    xml += `    <priority>0.6</priority>
`;
    xml += buildAlternates(makeUrl);
    xml += `  </url>
`;
  }
  xml += `</urlset>
`;
  return xml;
}
__name(generateCategoriesSitemap, "generateCategoriesSitemap");
__name2(generateCategoriesSitemap, "generateCategoriesSitemap");
function generateStudiosSitemap() {
  const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
  let xml = urlsetOpen();
  for (const studioName of STUDIOS) {
    const encoded = encodeURIComponent(studioName);
    const makeUrl = /* @__PURE__ */ __name2((lang) => `${DOMAIN}/${lang}/studio?name=${encoded}`, "makeUrl");
    xml += `  <url>
`;
    xml += `    <loc>${escXml(makeUrl("en"))}</loc>
`;
    xml += `    <lastmod>${today}</lastmod>
`;
    xml += `    <changefreq>weekly</changefreq>
`;
    xml += `    <priority>0.5</priority>
`;
    xml += buildAlternates(makeUrl);
    xml += `  </url>
`;
  }
  xml += `</urlset>
`;
  return xml;
}
__name(generateStudiosSitemap, "generateStudiosSitemap");
__name2(generateStudiosSitemap, "generateStudiosSitemap");
async function generateSitemapIndex(domain) {
  const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
  let totalPosts = 113191;
  let headRes = null;
  try {
    const res = await fetch(`${TARGET_BASE4}/posts?per_page=1`, {
      headers: { "X-Client-Site": "https://www.missav-j.com" }
    });
    if (res.ok) {
      headRes = res;
    }
  } catch (err) {
    console.warn(`[Sitemap] Head check failed:`, err);
  }
  if (headRes && headRes.ok) {
    const totalHeader = headRes.headers.get("X-WP-Total");
    if (totalHeader) {
      totalPosts = parseInt(totalHeader, 10);
    }
  } else {
    console.error("Failed to fetch total posts count from all endpoints.");
  }
  const videoPagesCount = Math.ceil(totalPosts / 1e3);
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
`;
  xml += `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;
  xml += `  <sitemap>
`;
  xml += `    <loc>${domain}/sitemaps/pages.xml</loc>
`;
  xml += `    <lastmod>${today}</lastmod>
`;
  xml += `  </sitemap>
`;
  for (let i = 1; i <= ACTORS_SITEMAP_COUNT; i++) {
    xml += `  <sitemap>
`;
    xml += `    <loc>${domain}/sitemaps/actors_${i}.xml</loc>
`;
    xml += `    <lastmod>${today}</lastmod>
`;
    xml += `  </sitemap>
`;
  }
  xml += `  <sitemap>
`;
  xml += `    <loc>${domain}/sitemaps/categories.xml</loc>
`;
  xml += `    <lastmod>${today}</lastmod>
`;
  xml += `  </sitemap>
`;
  xml += `  <sitemap>
`;
  xml += `    <loc>${domain}/sitemaps/studios.xml</loc>
`;
  xml += `    <lastmod>${today}</lastmod>
`;
  xml += `  </sitemap>
`;
  for (const lang of LANGS) {
    for (let p = 1; p <= videoPagesCount; p++) {
      xml += `  <sitemap>
`;
      xml += `    <loc>${domain}/sitemaps/${lang}-${p}.xml</loc>
`;
      xml += `  </sitemap>
`;
    }
  }
  xml += `</sitemapindex>
`;
  return xml;
}
__name(generateSitemapIndex, "generateSitemapIndex");
__name2(generateSitemapIndex, "generateSitemapIndex");
async function generateVideoSitemap(lang, page, domain, supabaseUrl, supabaseKey) {
  let postsRes = null;
  try {
    const res = await fetch(`${TARGET_BASE4}/posts?per_page=1000&page=${page}`, {
      headers: { "X-Client-Site": "https://www.missav-j.com" }
    });
    if (res.ok) {
      postsRes = res;
    }
  } catch (err) {
    console.warn(`[Sitemap] Fetch page ${page} failed:`, err);
  }
  if (!postsRes || !postsRes.ok) {
    const status = postsRes ? postsRes.status : 504;
    const text = postsRes ? postsRes.statusText : "All endpoints failed";
    return { status, body: `Failed to fetch posts from upstream API: ${text}` };
  }
  const posts = await postsRes.json();
  if (!Array.isArray(posts) || posts.length === 0) {
    let xml2 = `<?xml version="1.0" encoding="UTF-8"?>
`;
    xml2 += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
`;
    xml2 += `        xmlns:xhtml="http://www.w3.org/1999/xhtml">
`;
    xml2 += `</urlset>
`;
    return { status: 200, body: xml2 };
  }
  const ids = posts.map((p) => p.id);
  const translationsMap = await getBatchTranslationsFromDb2(ids, supabaseUrl, supabaseKey);
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
`;
  xml += `        xmlns:xhtml="http://www.w3.org/1999/xhtml">
`;
  for (const post of posts) {
    const id = post.id;
    const code = post.code || "";
    const title = post.title || "";
    const translations = translationsMap[id] || {};
    const dateStr = post.date ? post.date.split("T")[0] : (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const locSlug = getLocalizedSlug(code, title, translations, lang);
    const locUrl = `${domain}/${lang}/watch/${locSlug}-${id}`;
    xml += `  <url>
`;
    xml += `    <loc>${locUrl}</loc>
`;
    xml += `    <lastmod>${dateStr}</lastmod>
`;
    for (const l of LANGS) {
      const altSlug = getLocalizedSlug(code, title, translations, l);
      const altUrl = `${domain}/${l}/watch/${altSlug}-${id}`;
      xml += `    <xhtml:link rel="alternate" hreflang="${hreflangCode(l)}" href="${altUrl}" />
`;
    }
    const enSlug = getLocalizedSlug(code, title, translations, "en");
    const xDefaultUrl = `${domain}/en/watch/${enSlug}-${id}`;
    xml += `    <xhtml:link rel="alternate" hreflang="x-default" href="${xDefaultUrl}" />
`;
    xml += `  </url>
`;
  }
  xml += `</urlset>
`;
  return { status: 200, body: xml };
}
__name(generateVideoSitemap, "generateVideoSitemap");
__name2(generateVideoSitemap, "generateVideoSitemap");
async function onRequest5(context) {
  const { request, env } = context;
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-API-Key, X-Client-Site"
  };
  const errorHeaders = {
    ...corsHeaders,
    "Cache-Control": "no-cache, no-store, must-revalidate"
  };
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  try {
    const url = new URL(request.url);
    const file = url.searchParams.get("file");
    const SUPABASE_URL = env.SUPABASE_URL;
    const SUPABASE_KEY = env.SUPABASE_KEY;
    const host = request.headers.get("host") || "www.missav-j.com";
    const domain = `https://${host}`;
    const sendXml = /* @__PURE__ */ __name2((xml, statusCode = 200) => {
      return new Response(xml, {
        status: statusCode,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/xml; charset=utf-8",
          "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=43200"
        }
      });
    }, "sendXml");
    if (!file || file === "sitemap_index.xml" || file === "sitemap.xml") {
      const xml = await generateSitemapIndex(domain);
      return sendXml(xml);
    }
    if (file === "pages.xml" || file === "sitemap_pages.xml") {
      return sendXml(generatePagesSitemap());
    }
    const actorsMatch = file.match(/^(?:sitemap_)?actors_(\d+)\.xml$/);
    if (actorsMatch) {
      const pageNum = parseInt(actorsMatch[1], 10);
      if (pageNum < 1 || pageNum > ACTORS_SITEMAP_COUNT) {
        return new Response("Not Found", { status: 404, headers: errorHeaders });
      }
      return sendXml(generateActorsSitemap(pageNum));
    }
    if (file === "categories.xml" || file === "sitemap_categories.xml") {
      return sendXml(generateCategoriesSitemap());
    }
    if (file === "studios.xml" || file === "sitemap_studios.xml") {
      return sendXml(generateStudiosSitemap());
    }
    let lang = "";
    let page = 0;
    const newVideoMatch = file.match(/^([a-zA-Z\-]+)-(\d+)\.xml$/);
    const oldVideoMatch = file.match(/^sitemap_videos_([a-zA-Z\-]+)_(\d+)\.xml$/);
    if (newVideoMatch) {
      lang = newVideoMatch[1];
      page = parseInt(newVideoMatch[2], 10);
    } else if (oldVideoMatch) {
      lang = oldVideoMatch[1];
      page = parseInt(oldVideoMatch[2], 10);
    } else {
      return new Response("Not Found", { status: 404, headers: errorHeaders });
    }
    if (!LANGS.includes(lang)) {
      return new Response("Unsupported Language", { status: 404, headers: errorHeaders });
    }
    const result = await generateVideoSitemap(lang, page, domain, SUPABASE_URL, SUPABASE_KEY);
    if (result.status !== 200) {
      return new Response(result.body, { status: result.status, headers: errorHeaders });
    }
    return sendXml(result.body);
  } catch (error) {
    console.error("[Sitemap Error]", error);
    return new Response(`Gateway Proxy Error: ${error.message}`, {
      status: 502,
      headers: errorHeaders
    });
  }
}
__name(onRequest5, "onRequest5");
__name2(onRequest5, "onRequest");
var TARGET_BASE5 = "https://server.apijav.com/wp-json/myvideo/v1";
var VALID_LANGS = ["zh-TW", "zh-CN", "en", "ja", "ko", "ms", "th", "de", "fr", "vi", "id", "fil", "pt"];
var HREFLANG_CODE_MAP2 = { fil: "tl" };
var hreflangCode2 = /* @__PURE__ */ __name2((langKey) => HREFLANG_CODE_MAP2[langKey] || langKey, "hreflangCode");
var LANG_STRIP_REGEX = new RegExp(`^/(${VALID_LANGS.join("|").replace(/[-]/g, "\\-")})(?=/|$)`);
function cleanSearchForHreflang(search) {
  if (!search) return "";
  const TRACKING_PARAMS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "fbclid", "gclid", "_ga", "ref", "cb"];
  const params = new URLSearchParams(search);
  TRACKING_PARAMS.forEach((k) => params.delete(k));
  const str = params.toString();
  return str ? `?${str}` : "";
}
__name(cleanSearchForHreflang, "cleanSearchForHreflang");
__name2(cleanSearchForHreflang, "cleanSearchForHreflang");
function generateHreflangTags(urlOrigin, urlPathname, urlSearch) {
  let cleanPath = urlPathname.replace(LANG_STRIP_REGEX, "");
  if (cleanPath === "") cleanPath = "/";
  const cleanSearch = cleanSearchForHreflang(urlSearch);
  const tags = VALID_LANGS.map((lang) => {
    const code = hreflangCode2(lang);
    const path = cleanPath === "/" ? `/${lang}/` : `/${lang}${cleanPath}`;
    return `<link rel="alternate" hreflang="${code}" href="${escapeHtml(urlOrigin + path + cleanSearch)}" />`;
  });
  const xDefaultPath = cleanPath === "/" ? "/en/" : `/en${cleanPath}`;
  tags.push(`<link rel="alternate" hreflang="x-default" href="${escapeHtml(urlOrigin + xDefaultPath + cleanSearch)}" />`);
  return tags.join("\n  ");
}
__name(generateHreflangTags, "generateHreflangTags");
__name2(generateHreflangTags, "generateHreflangTags");
var DESC_TEMPLATES = {
  "zh-TW": /* @__PURE__ */ __name2((c, t, a, s) => {
    let extra = "";
    if (a || s) extra = `\uFF0C${a ? "\u7531 " + a + " \u4E3B\u6F14" : ""}${a && s ? "\uFF0C" : ""}${s ? "\u7531 " + s + " \u88FD\u4F5C" : ""}`;
    return `\u514D\u8CBB\u89C0\u770B JAV ${c ? c + " " : ""}${t}${extra}\uFF0C\u76E1\u5728 MISSAV-J \u9AD8\u756B\u8CEA\u4E32\u6D41\u5E73\u53F0\u3002`;
  }, "zh-TW"),
  "zh-CN": /* @__PURE__ */ __name2((c, t, a, s) => {
    let extra = "";
    if (a || s) extra = `\uFF0C${a ? "\u7531 " + a + " \u4E3B\u6F14" : ""}${a && s ? "\uFF0C" : ""}${s ? "\u7531 " + s + " \u5236\u4F5C" : ""}`;
    return `\u514D\u8D39\u89C2\u770B JAV ${c ? c + " " : ""}${t}${extra}\uFF0C\u5C3D\u5728 MISSAV-J \u9AD8\u6E05\u6D41\u5A92\u4F53\u5E73\u53F0\u3002`;
  }, "zh-CN"),
  "en": /* @__PURE__ */ __name2((c, t, a, s) => {
    let extra = "";
    if (a || s) extra = ` ${a ? "starring " + a : ""}${a && s ? " " : ""}${s ? "by " + s : ""}`;
    return `Watch ${c ? c + " " : ""}${t}${extra} for free in premium HD streaming quality on MISSAV-J.`;
  }, "en"),
  "ja": /* @__PURE__ */ __name2((c, t, a, s) => {
    let extra = "";
    if (a || s) extra = ` ${a ? a + "\u51FA\u6F14" : ""}${a && s ? "\u30FB" : ""}${s ? s + "\u5236\u4F5C" : ""}`;
    return `MISSAV-J \u3067 ${c ? c + " " : ""}${t}${extra} \u3092\u9AD8\u753B\u8CEA\u3067\u7121\u6599\u8996\u8074\u3002`;
  }, "ja"),
  "ko": /* @__PURE__ */ __name2((c, t, a, s) => {
    let extra = "";
    if (a || s) extra = ` ${a ? a + " \uC8FC\uC5F0" : ""}${a && s ? ", " : ""}${s ? s + " \uC81C\uC791" : ""}`;
    return `MISSAV-J\uC5D0\uC11C ${c ? c + " " : ""}${t}${extra} \uBB34\uB8CC HD \uC2A4\uD2B8\uB9AC\uBC0D \uC2DC\uCCAD.`;
  }, "ko"),
  "ms": /* @__PURE__ */ __name2((c, t, a, s) => {
    let extra = "";
    if (a || s) extra = ` ${a ? "dibintangi oleh " + a : ""}${a && s ? " " : ""}${s ? "dari " + s : ""}`;
    return `Tonton ${c ? c + " " : ""}${t}${extra} secara percuma dengan kualiti HD premium di MISSAV-J.`;
  }, "ms"),
  "th": /* @__PURE__ */ __name2((c, t, a, s) => {
    let extra = "";
    if (a || s) extra = ` ${a ? "\u0E19\u0E33\u0E41\u0E2A\u0E14\u0E07\u0E42\u0E14\u0E22 " + a : ""}${a && s ? " " : ""}${s ? "\u0E42\u0E14\u0E22\u0E2A\u0E15\u0E39\u0E14\u0E34\u0E42\u0E2D " + s : ""}`;
    return `\u0E14\u0E39 ${c ? c + " " : ""}${t}${extra} \u0E1F\u0E23\u0E35\u0E43\u0E19\u0E04\u0E38\u0E13\u0E20\u0E32\u0E1E HD \u0E23\u0E30\u0E14\u0E31\u0E1A\u0E1E\u0E23\u0E35\u0E40\u0E21\u0E35\u0E22\u0E21\u0E1A\u0E19 MISSAV-J`;
  }, "th"),
  "de": /* @__PURE__ */ __name2((c, t, a, s) => {
    let extra = "";
    if (a || s) extra = ` ${a ? "mit " + a : ""}${a && s ? " " : ""}${s ? "von " + s : ""}`;
    return `Sehen Sie ${c ? c + " " : ""}${t}${extra} kostenlos in Premium-HD-Streaming-Qualit\xE4t auf MISSAV-J.`;
  }, "de"),
  "fr": /* @__PURE__ */ __name2((c, t, a, s) => {
    let extra = "";
    if (a || s) extra = ` ${a ? "mettant en vedette " + a : ""}${a && s ? " " : ""}${s ? "par " + s : ""}`;
    return `Regardez ${c ? c + " " : ""}${t}${extra} gratuitement en qualit\xE9 HD premium sur MISSAV-J.`;
  }, "fr"),
  "vi": /* @__PURE__ */ __name2((c, t, a, s) => {
    let extra = "";
    if (a || s) extra = ` ${a ? "v\u1EDBi s\u1EF1 tham gia c\u1EE7a " + a : ""}${a && s ? " " : ""}${s ? "t\u1EEB " + s : ""}`;
    return `Xem ${c ? c + " " : ""}${t}${extra} mi\u1EC5n ph\xED ch\u1EA5t l\u01B0\u1EE3ng HD cao c\u1EA5p tr\xEAn MISSAV-J.`;
  }, "vi"),
  "id": /* @__PURE__ */ __name2((c, t, a, s) => {
    let extra = "";
    if (a || s) extra = ` ${a ? "dibintangi " + a : ""}${a && s ? " " : ""}${s ? "dari " + s : ""}`;
    return `Nonton video JAV ${c ? c + " " : ""}${t}${extra} gratis dengan streaming kualitas premium di MISSAV-J.`;
  }, "id"),
  "fil": /* @__PURE__ */ __name2((c, t, a, s) => {
    let extra = "";
    if (a || s) extra = ` ${a ? "pinagbibidahan ni " + a : ""}${a && s ? " " : ""}${s ? "mula sa " + s : ""}`;
    return `Panoorin ang ${c ? c + " " : ""}${t}${extra} nang libre sa premium HD streaming sa MISSAV-J.`;
  }, "fil"),
  "pt": /* @__PURE__ */ __name2((c, t, a, s) => {
    let extra = "";
    if (a || s) extra = ` ${a ? "estrelado por " + a : ""}${a && s ? " " : ""}${s ? "do est\xFAdio " + s : ""}`;
    return `Assista ao ${c ? c + " " : ""}${t}${extra} gratuitamente em qualidade de streaming HD premium na MISSAV-J.`;
  }, "pt")
};
var SEO_I18N = {
  en: {
    home: { t: "MISSAV-J | Premium JAV Streaming", d: "Watch the best premium JAV streaming. Explore the latest releases, trending videos, and top actresses." },
    actor: { t: "%s | MISSAV-J", d: "Watch JAV videos starring %s in premium HD on MISSAV-J. Explore the full filmography and profile." },
    category: { t: "%s JAV Videos | MISSAV-J", d: "Watch the latest and best %s JAV videos online for free. Premium high-quality streaming on MISSAV-J." },
    studio: { t: "%s Studio JAV Videos | MISSAV-J", d: "Explore the official collection of %s JAV videos. High definition streaming for %s releases." },
    trending: { t: "Trending JAV Videos | MISSAV-J", d: "Watch the most popular and trending JAV videos right now on MISSAV-J." },
    recent: { t: "Recent JAV Videos | MISSAV-J", d: "Watch the newest and latest JAV video releases on MISSAV-J." },
    actors: { t: "All JAV Actresses | MISSAV-J", d: "Browse our complete database of JAV actresses and their full video collections." },
    categories: { t: "All JAV Categories | MISSAV-J", d: "Explore all JAV categories, genres, and tags on MISSAV-J." },
    studios: { t: "All JAV Studios | MISSAV-J", d: "Browse videos from top JAV studios and production companies on MISSAV-J." },
    search: { t: "Search Results | MISSAV-J", d: "Search results for premium JAV videos on MISSAV-J." },
    history: { t: "Session History | MISSAV-J", d: "Your recently watched JAV videos on MISSAV-J." },
    watch_later: { t: "Watch Later | MISSAV-J", d: "Your saved JAV videos to watch later on MISSAV-J." },
    default: { t: "MISSAV-J | Premium JAV Streaming", d: "Watch the best premium JAV streaming on MISSAV-J." }
  },
  id: {
    home: { t: "MISSAV-J | Streaming JAV Premium", d: "Tonton video JAV premium terbaik. Jelajahi rilis terbaru, video trending, dan aktris top." },
    actor: { t: "%s | MISSAV-J", d: "Tonton video JAV dari %s dalam kualitas HD premium di MISSAV-J. Jelajahi profil lengkapnya." },
    category: { t: "Video JAV %s | MISSAV-J", d: "Tonton video JAV %s terbaru dan terbaik secara online. Streaming kualitas tinggi premium di MISSAV-J." },
    studio: { t: "Video JAV %s | MISSAV-J", d: "Jelajahi koleksi resmi video JAV %s. Streaming definisi tinggi untuk rilis %s." },
    trending: { t: "Video JAV Trending | MISSAV-J", d: "Tonton video JAV paling populer dan trending saat ini di MISSAV-J." },
    recent: { t: "Video JAV Terbaru | MISSAV-J", d: "Tonton rilis video JAV terbaru dan teranyar di MISSAV-J." },
    actors: { t: "Semua Aktris JAV | MISSAV-J", d: "Jelajahi basis data lengkap aktris JAV kami dan koleksi video mereka." },
    categories: { t: "Semua Kategori JAV | MISSAV-J", d: "Jelajahi semua kategori, genre, dan tag JAV di MISSAV-J." },
    studios: { t: "Semua Studio JAV | MISSAV-J", d: "Jelajahi video dari studio dan perusahaan produksi JAV teratas di MISSAV-J." },
    search: { t: "Hasil Pencarian | MISSAV-J", d: "Hasil pencarian untuk video JAV premium di MISSAV-J." },
    history: { t: "Riwayat Sesi | MISSAV-J", d: "Video JAV yang baru saja Anda tonton di MISSAV-J." },
    watch_later: { t: "Tonton Nanti | MISSAV-J", d: "Video JAV yang Anda simpan untuk ditonton nanti di MISSAV-J." },
    default: { t: "MISSAV-J | Streaming JAV Premium", d: "Tonton streaming JAV premium terbaik di MISSAV-J." }
  },
  ja: {
    home: { t: "MISSAV-J | \u30D7\u30EC\u30DF\u30A2\u30E0JAV\u30B9\u30C8\u30EA\u30FC\u30DF\u30F3\u30B0", d: "\u6700\u9AD8\u306E\u30D7\u30EC\u30DF\u30A2\u30E0JAV\u30B9\u30C8\u30EA\u30FC\u30DF\u30F3\u30B0\u3092\u8996\u8074\u3002\u6700\u65B0\u30EA\u30EA\u30FC\u30B9\u3001\u30C8\u30EC\u30F3\u30C9\u52D5\u753B\u3001\u4EBA\u6C17\u5973\u512A\u3092\u63A2\u7D22\u3002" },
    actor: { t: "%s | MISSAV-J", d: "MISSAV-J\u3067 %s \u51FA\u6F14\u306EJAV\u52D5\u753B\u3092\u30D7\u30EC\u30DF\u30A2\u30E0HD\u3067\u8996\u8074\u3002\u5B8C\u5168\u306A\u30D7\u30ED\u30D5\u30A3\u30FC\u30EB\u3092\u63A2\u7D22\u3002" },
    category: { t: "%s JAV\u52D5\u753B | MISSAV-J", d: "\u6700\u65B0\u304B\u3064\u6700\u9AD8\u306E %s JAV\u52D5\u753B\u3092\u30AA\u30F3\u30E9\u30A4\u30F3\u3067\u7121\u6599\u8996\u8074\u3002MISSAV-J\u3067\u306E\u30D7\u30EC\u30DF\u30A2\u30E0\u9AD8\u54C1\u8CEA\u30B9\u30C8\u30EA\u30FC\u30DF\u30F3\u30B0\u3002" },
    studio: { t: "%s JAV\u52D5\u753B | MISSAV-J", d: "\u516C\u5F0F\u306E %s JAV\u52D5\u753B\u30B3\u30EC\u30AF\u30B7\u30E7\u30F3\u3092\u63A2\u7D22\u3002%s \u30EA\u30EA\u30FC\u30B9\u306E\u9AD8\u89E3\u50CF\u5EA6\u30B9\u30C8\u30EA\u30FC\u30DF\u30F3\u30B0\u3002" },
    trending: { t: "\u6025\u4E0A\u6607JAV\u52D5\u753B | MISSAV-J", d: "MISSAV-J\u3067\u4ECA\u6700\u3082\u4EBA\u6C17\u306E\u3042\u308B\u30C8\u30EC\u30F3\u30C9JAV\u52D5\u753B\u3092\u8996\u8074\u3002" },
    recent: { t: "\u65B0\u7740JAV\u52D5\u753B | MISSAV-J", d: "MISSAV-J\u3067\u6700\u65B0\u306EJAV\u52D5\u753B\u30EA\u30EA\u30FC\u30B9\u3092\u8996\u8074\u3002" },
    actors: { t: "\u3059\u3079\u3066\u306EJAV\u5973\u512A | MISSAV-J", d: "JAV\u5973\u512A\u306E\u5B8C\u5168\u306A\u30C7\u30FC\u30BF\u30D9\u30FC\u30B9\u3068\u30D5\u30EB\u30D3\u30C7\u30AA\u30B3\u30EC\u30AF\u30B7\u30E7\u30F3\u3092\u95B2\u89A7\u3002" },
    categories: { t: "\u3059\u3079\u3066\u306EJAV\u30AB\u30C6\u30B4\u30EA\u30FC | MISSAV-J", d: "MISSAV-J\u3067\u3059\u3079\u3066\u306EJAV\u30AB\u30C6\u30B4\u30EA\u30FC\u3001\u30B8\u30E3\u30F3\u30EB\u3001\u30BF\u30B0\u3092\u63A2\u7D22\u3002" },
    studios: { t: "\u3059\u3079\u3066\u306EJAV\u30E1\u30FC\u30AB\u30FC | MISSAV-J", d: "MISSAV-J\u3067\u30C8\u30C3\u30D7JAV\u30E1\u30FC\u30AB\u30FC\u3084\u5236\u4F5C\u4F1A\u793E\u306E\u52D5\u753B\u3092\u95B2\u89A7\u3002" },
    search: { t: "\u691C\u7D22\u7D50\u679C | MISSAV-J", d: "MISSAV-J\u306E\u30D7\u30EC\u30DF\u30A2\u30E0JAV\u52D5\u753B\u306E\u691C\u7D22\u7D50\u679C\u3002" },
    history: { t: "\u8996\u8074\u5C65\u6B74 | MISSAV-J", d: "MISSAV-J\u3067\u6700\u8FD1\u8996\u8074\u3057\u305FJAV\u52D5\u753B\u3002" },
    watch_later: { t: "\u5F8C\u3067\u898B\u308B | MISSAV-J", d: "MISSAV-J\u3067\u5F8C\u3067\u898B\u308B\u305F\u3081\u306B\u4FDD\u5B58\u3057\u305FJAV\u52D5\u753B\u3002" },
    default: { t: "MISSAV-J | \u30D7\u30EC\u30DF\u30A2\u30E0JAV\u30B9\u30C8\u30EA\u30FC\u30DF\u30F3\u30B0", d: "MISSAV-J\u3067\u6700\u9AD8\u306E\u30D7\u30EC\u30DF\u30A2\u30E0JAV\u30B9\u30C8\u30EA\u30FC\u30DF\u30F3\u30B0\u3092\u8996\u8074\u3002" }
  },
  ko: {
    home: { t: "MISSAV-J | \uD504\uB9AC\uBBF8\uC5C4 JAV \uC2A4\uD2B8\uB9AC\uBC0D", d: "\uCD5C\uACE0\uC758 \uD504\uB9AC\uBBF8\uC5C4 JAV \uC2A4\uD2B8\uB9AC\uBC0D\uC744 \uC2DC\uCCAD\uD558\uC138\uC694. \uCD5C\uC2E0 \uB9B4\uB9AC\uC2A4, \uC778\uAE30 \uB3D9\uC601\uC0C1 \uBC0F \uCD5C\uACE0 \uC5EC\uBC30\uC6B0\uB97C \uD0D0\uC0C9\uD558\uC2ED\uC2DC\uC624." },
    actor: { t: "%s | MISSAV-J", d: "MISSAV-J\uC5D0\uC11C %s \uCD9C\uC5F0 JAV \uB3D9\uC601\uC0C1\uC744 \uD504\uB9AC\uBBF8\uC5C4 HD\uB85C \uC2DC\uCCAD\uD558\uC138\uC694." },
    category: { t: "%s JAV \uB3D9\uC601\uC0C1 | MISSAV-J", d: "\uC628\uB77C\uC778\uC5D0\uC11C \uCD5C\uC2E0 \uBC0F \uCD5C\uACE0\uC758 %s JAV \uB3D9\uC601\uC0C1\uC744 \uBB34\uB8CC\uB85C \uC2DC\uCCAD\uD558\uC138\uC694." },
    studio: { t: "%s JAV \uB3D9\uC601\uC0C1 | MISSAV-J", d: "\uACF5\uC2DD %s JAV \uB3D9\uC601\uC0C1 \uCEEC\uB809\uC158\uC744 \uD0D0\uC0C9\uD558\uC2ED\uC2DC\uC624." },
    trending: { t: "\uC778\uAE30 JAV \uB3D9\uC601\uC0C1 | MISSAV-J", d: "MISSAV-J\uC5D0\uC11C \uC9C0\uAE08 \uAC00\uC7A5 \uC778\uAE30 \uC788\uACE0 \uD2B8\uB80C\uB514\uD55C JAV \uB3D9\uC601\uC0C1\uC744 \uC2DC\uCCAD\uD558\uC138\uC694." },
    recent: { t: "\uCD5C\uC2E0 JAV \uB3D9\uC601\uC0C1 | MISSAV-J", d: "MISSAV-J\uC5D0\uC11C \uCD5C\uC2E0 JAV \uB3D9\uC601\uC0C1 \uB9B4\uB9AC\uC2A4\uB97C \uC2DC\uCCAD\uD558\uC138\uC694." },
    actors: { t: "\uBAA8\uB4E0 JAV \uC5EC\uBC30\uC6B0 | MISSAV-J", d: "\uC6B0\uB9AC\uC758 \uC644\uC804\uD55C JAV \uC5EC\uBC30\uC6B0 \uB370\uC774\uD130\uBCA0\uC774\uC2A4\uB97C \uCC3E\uC544\uBCF4\uC2ED\uC2DC\uC624." },
    categories: { t: "\uBAA8\uB4E0 JAV \uCE74\uD14C\uACE0\uB9AC | MISSAV-J", d: "MISSAV-J\uC5D0\uC11C \uBAA8\uB4E0 JAV \uCE74\uD14C\uACE0\uB9AC\uB97C \uD0D0\uC0C9\uD558\uC2ED\uC2DC\uC624." },
    studios: { t: "\uBAA8\uB4E0 JAV \uC2A4\uD29C\uB514\uC624 | MISSAV-J", d: "MISSAV-J\uC5D0\uC11C \uC778\uAE30 JAV \uC2A4\uD29C\uB514\uC624\uC758 \uB3D9\uC601\uC0C1\uC744 \uCC3E\uC544\uBCF4\uC2ED\uC2DC\uC624." },
    search: { t: "\uAC80\uC0C9 \uACB0\uACFC | MISSAV-J", d: "MISSAV-J\uC758 \uD504\uB9AC\uBBF8\uC5C4 JAV \uB3D9\uC601\uC0C1 \uAC80\uC0C9 \uACB0\uACFC." },
    history: { t: "\uC2DC\uCCAD \uAE30\uB85D | MISSAV-J", d: "MISSAV-J\uC5D0\uC11C \uCD5C\uADFC\uC5D0 \uC2DC\uCCAD\uD55C JAV \uB3D9\uC601\uC0C1." },
    watch_later: { t: "\uB098\uC911\uC5D0 \uBCF4\uAE30 | MISSAV-J", d: "MISSAV-J\uC5D0 \uB098\uC911\uC5D0 \uBCF4\uAE30 \uC704\uD574 \uC800\uC7A5\uD55C JAV \uB3D9\uC601\uC0C1." },
    default: { t: "MISSAV-J | \uD504\uB9AC\uBBF8\uC5C4 JAV \uC2A4\uD2B8\uB9AC\uBC0D", d: "MISSAV-J\uC5D0\uC11C \uCD5C\uACE0\uC758 \uD504\uB9AC\uBBF8\uC5C4 JAV \uC2A4\uD2B8\uB9AC\uBC0D\uC744 \uC2DC\uCCAD\uD558\uC138\uC694." }
  },
  "zh-TW": {
    home: { t: "MISSAV-J | \u9AD8\u7D1A JAV \u4E32\u6D41", d: "\u89C0\u770B\u6700\u597D\u7684\u9AD8\u7D1A JAV \u4E32\u6D41\u3002\u63A2\u7D22\u6700\u65B0\u767C\u5E03\u3001\u71B1\u9580\u5F71\u7247\u548C\u9802\u7D1A\u5973\u512A\u3002" },
    actor: { t: "%s | MISSAV-J", d: "\u5728 MISSAV-J \u4E0A\u4EE5\u9AD8\u7D1A HD \u89C0\u770B\u7531 %s \u4E3B\u6F14\u7684 JAV \u5F71\u7247\u3002\u63A2\u7D22\u5B8C\u6574\u7684\u5F71\u7247\u5EAB\u3002" },
    category: { t: "%s JAV \u5F71\u7247 | MISSAV-J", d: "\u5728\u7DDA\u514D\u8CBB\u89C0\u770B\u6700\u65B0\u6700\u597D\u7684 %s JAV \u5F71\u7247\u3002MISSAV-J \u63D0\u4F9B\u9AD8\u7D1A\u9AD8\u54C1\u8CEA\u4E32\u6D41\u3002" },
    studio: { t: "%s JAV \u5F71\u7247 | MISSAV-J", d: "\u63A2\u7D22\u5B98\u65B9\u7684 %s JAV \u5F71\u7247\u6536\u85CF\u3002MISSAV-J \u63D0\u4F9B\u9AD8\u756B\u8CEA\u4E32\u6D41\u3002" },
    trending: { t: "\u71B1\u9580 JAV \u5F71\u7247 | MISSAV-J", d: "\u5728 MISSAV-J \u4E0A\u89C0\u770B\u76EE\u524D\u6700\u53D7\u6B61\u8FCE\u548C\u71B1\u9580\u7684 JAV \u5F71\u7247\u3002" },
    recent: { t: "\u6700\u65B0 JAV \u5F71\u7247 | MISSAV-J", d: "\u5728 MISSAV-J \u4E0A\u89C0\u770B\u6700\u65B0\u7684 JAV \u5F71\u7247\u767C\u5E03\u3002" },
    actors: { t: "\u6240\u6709 JAV \u5973\u512A | MISSAV-J", d: "\u700F\u89BD\u6211\u5011\u5B8C\u6574\u7684 JAV \u5973\u512A\u6578\u64DA\u5EAB\u548C\u5979\u5011\u7684\u5F71\u7247\u6536\u85CF\u3002" },
    categories: { t: "\u6240\u6709 JAV \u5206\u985E | MISSAV-J", d: "\u63A2\u7D22 MISSAV-J \u4E0A\u7684\u6240\u6709 JAV \u5206\u985E\u3001\u6D41\u6D3E\u548C\u6A19\u7C64\u3002" },
    studios: { t: "\u6240\u6709 JAV \u7247\u5546 | MISSAV-J", d: "\u700F\u89BD MISSAV-J \u4E0A\u9802\u7D1A JAV \u7247\u5546\u7684\u5F71\u7247\u3002" },
    search: { t: "\u641C\u7D22\u7D50\u679C | MISSAV-J", d: "MISSAV-J \u4E0A\u9AD8\u7D1A JAV \u5F71\u7247\u7684\u641C\u7D22\u7D50\u679C\u3002" },
    history: { t: "\u89C0\u770B\u6B77\u53F2 | MISSAV-J", d: "\u60A8\u6700\u8FD1\u5728 MISSAV-J \u89C0\u770B\u7684 JAV \u5F71\u7247\u3002" },
    watch_later: { t: "\u7A0D\u5F8C\u89C0\u770B | MISSAV-J", d: "\u60A8\u4FDD\u5B58\u5728 MISSAV-J \u7A0D\u5F8C\u89C0\u770B\u7684 JAV \u5F71\u7247\u3002" },
    default: { t: "MISSAV-J | \u9AD8\u7D1A JAV \u4E32\u6D41", d: "\u5728 MISSAV-J \u89C0\u770B\u6700\u597D\u7684\u9AD8\u7D1A JAV \u4E32\u6D41\u3002" }
  },
  "zh-CN": {
    home: { t: "MISSAV-J | \u9AD8\u7EA7 JAV \u6D41\u5A92\u4F53", d: "\u89C2\u770B\u6700\u597D\u7684\u9AD8\u7EA7 JAV \u6D41\u5A92\u4F53\u3002\u63A2\u7D22\u6700\u65B0\u53D1\u5E03\u3001\u70ED\u95E8\u89C6\u9891\u548C\u9876\u7EA7\u5973\u4F18\u3002" },
    actor: { t: "%s | MISSAV-J", d: "\u5728 MISSAV-J \u4E0A\u4EE5\u9AD8\u7EA7 HD \u89C2\u770B\u7531 %s \u4E3B\u6F14\u7684 JAV \u89C6\u9891\u3002\u63A2\u7D22\u5B8C\u6574\u7684\u5F71\u7247\u5E93\u3002" },
    category: { t: "%s JAV \u89C6\u9891 | MISSAV-J", d: "\u5728\u7EBF\u514D\u8D39\u89C2\u770B\u6700\u65B0\u6700\u597D\u7684 %s JAV \u89C6\u9891\u3002MISSAV-J \u63D0\u4F9B\u9AD8\u7EA7\u9AD8\u8D28\u91CF\u6D41\u5A92\u4F53\u3002" },
    studio: { t: "%s JAV \u89C6\u9891 | MISSAV-J", d: "\u63A2\u7D22\u5B98\u65B9\u7684 %s JAV \u89C6\u9891\u6536\u85CF\u3002MISSAV-J \u63D0\u4F9B\u9AD8\u6E05\u6D41\u5A92\u4F53\u3002" },
    trending: { t: "\u70ED\u95E8 JAV \u89C6\u9891 | MISSAV-J", d: "\u5728 MISSAV-J \u4E0A\u89C2\u770B\u76EE\u524D\u6700\u53D7\u6B22\u8FCE\u548C\u70ED\u95E8\u7684 JAV \u89C6\u9891\u3002" },
    recent: { t: "\u6700\u65B0 JAV \u89C6\u9891 | MISSAV-J", d: "\u5728 MISSAV-J \u4E0A\u89C2\u770B\u6700\u65B0\u7684 JAV \u89C6\u9891\u53D1\u5E03\u3002" },
    actors: { t: "\u6240\u6709 JAV \u5973\u4F18 | MISSAV-J", d: "\u6D4F\u89C8\u6211\u4EEC\u5B8C\u6574\u7684 JAV \u5973\u4F18\u6570\u636E\u5E93\u548C\u5979\u4EEC\u7684\u89C6\u9891\u6536\u85CF\u3002" },
    categories: { t: "\u6240\u6709 JAV \u5206\u7C7B | MISSAV-J", d: "\u63A2\u7D22 MISSAV-J \u4E0A\u7684\u6240\u6709 JAV \u5206\u7C7B\u3001\u6D41\u6D3E\u548C\u6807\u7B7E\u3002" },
    studios: { t: "\u6240\u6709 JAV \u7247\u5546 | MISSAV-J", d: "\u6D4F\u89C8 MISSAV-J \u4E0A\u9876\u7EA7 JAV \u7247\u5546\u7684\u89C6\u9891\u3002" },
    search: { t: "\u641C\u7D22\u7ED3\u679C | MISSAV-J", d: "MISSAV-J \u4E0A\u9AD8\u7EA7 JAV \u89C6\u9891\u7684\u641C\u7D22\u7ED3\u679C\u3002" },
    history: { t: "\u89C2\u770B\u5386\u53F2 | MISSAV-J", d: "\u60A8\u6700\u8FD1\u5728 MISSAV-J \u89C2\u770B\u7684 JAV \u89C6\u9891\u3002" },
    watch_later: { t: "\u7A0D\u540E\u89C2\u770B | MISSAV-J", d: "\u60A8\u4FDD\u5B58\u5728 MISSAV-J \u7A0D\u540E\u89C2\u770B\u7684 JAV \u89C6\u9891\u3002" },
    default: { t: "MISSAV-J | \u9AD8\u7EA7 JAV \u6D41\u5A92\u4F53", d: "\u5728 MISSAV-J \u89C2\u770B\u6700\u597D\u7684\u9AD8\u7EA7 JAV \u6D41\u5A92\u4F53\u3002" }
  },
  ms: {
    home: { t: "MISSAV-J | Penstriman JAV Premium", d: "Tonton penstriman JAV premium terbaik. Terokai keluaran terkini, video trending dan pelakon popular." },
    actor: { t: "%s | MISSAV-J", d: "Tonton video JAV yang dibintangi %s dalam HD premium di MISSAV-J." },
    category: { t: "Video JAV %s | MISSAV-J", d: "Tonton video JAV %s terkini dan terbaik dalam talian secara percuma." },
    studio: { t: "Video JAV %s | MISSAV-J", d: "Terokai koleksi rasmi video JAV %s di MISSAV-J." },
    trending: { t: "Video JAV Trending | MISSAV-J", d: "Tonton video JAV paling popular dan trending sekarang di MISSAV-J." },
    recent: { t: "Video JAV Terkini | MISSAV-J", d: "Tonton keluaran video JAV terkini di MISSAV-J." },
    actors: { t: "Semua Pelakon JAV | MISSAV-J", d: "Semak imbas pangkalan data lengkap pelakon JAV kami." },
    categories: { t: "Semua Kategori JAV | MISSAV-J", d: "Terokai semua kategori, genre dan tag JAV di MISSAV-J." },
    studios: { t: "Semua Studio JAV | MISSAV-J", d: "Semak imbas video dari studio JAV teratas di MISSAV-J." },
    search: { t: "Hasil Carian | MISSAV-J", d: "Hasil carian untuk video JAV premium di MISSAV-J." },
    history: { t: "Sejarah Sesi | MISSAV-J", d: "Video JAV yang anda tonton baru-baru ini di MISSAV-J." },
    watch_later: { t: "Tonton Nanti | MISSAV-J", d: "Video JAV yang anda simpan untuk ditonton nanti di MISSAV-J." },
    default: { t: "MISSAV-J | Penstriman JAV Premium", d: "Tonton penstriman JAV premium terbaik di MISSAV-J." }
  },
  th: {
    home: { t: "MISSAV-J | \u0E2A\u0E15\u0E23\u0E35\u0E21\u0E21\u0E34\u0E48\u0E07 JAV \u0E1E\u0E23\u0E35\u0E40\u0E21\u0E35\u0E22\u0E21", d: "\u0E14\u0E39\u0E01\u0E32\u0E23\u0E2A\u0E15\u0E23\u0E35\u0E21 JAV \u0E1E\u0E23\u0E35\u0E40\u0E21\u0E35\u0E22\u0E21\u0E17\u0E35\u0E48\u0E14\u0E35\u0E17\u0E35\u0E48\u0E2A\u0E38\u0E14 \u0E2A\u0E33\u0E23\u0E27\u0E08\u0E01\u0E32\u0E23\u0E40\u0E1B\u0E34\u0E14\u0E15\u0E31\u0E27\u0E25\u0E48\u0E32\u0E2A\u0E38\u0E14 \u0E27\u0E34\u0E14\u0E35\u0E42\u0E2D\u0E22\u0E2D\u0E14\u0E19\u0E34\u0E22\u0E21 \u0E41\u0E25\u0E30\u0E19\u0E31\u0E01\u0E41\u0E2A\u0E14\u0E07\u0E2B\u0E0D\u0E34\u0E07\u0E0A\u0E31\u0E49\u0E19\u0E19\u0E33" },
    actor: { t: "%s | MISSAV-J", d: "\u0E14\u0E39\u0E27\u0E34\u0E14\u0E35\u0E42\u0E2D JAV \u0E17\u0E35\u0E48\u0E19\u0E33\u0E41\u0E2A\u0E14\u0E07\u0E42\u0E14\u0E22 %s \u0E43\u0E19\u0E23\u0E39\u0E1B\u0E41\u0E1A\u0E1A HD \u0E1E\u0E23\u0E35\u0E40\u0E21\u0E35\u0E22\u0E21\u0E1A\u0E19 MISSAV-J" },
    category: { t: "\u0E27\u0E34\u0E14\u0E35\u0E42\u0E2D JAV %s | MISSAV-J", d: "\u0E14\u0E39\u0E27\u0E34\u0E14\u0E35\u0E42\u0E2D JAV %s \u0E25\u0E48\u0E32\u0E2A\u0E38\u0E14\u0E41\u0E25\u0E30\u0E14\u0E35\u0E17\u0E35\u0E48\u0E2A\u0E38\u0E14\u0E2D\u0E2D\u0E19\u0E44\u0E25\u0E19\u0E4C\u0E1F\u0E23\u0E35" },
    studio: { t: "\u0E27\u0E34\u0E14\u0E35\u0E42\u0E2D JAV %s | MISSAV-J", d: "\u0E2A\u0E33\u0E23\u0E27\u0E08\u0E04\u0E2D\u0E25\u0E40\u0E25\u0E01\u0E0A\u0E31\u0E19\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E40\u0E1B\u0E47\u0E19\u0E17\u0E32\u0E07\u0E01\u0E32\u0E23\u0E02\u0E2D\u0E07\u0E27\u0E34\u0E14\u0E35\u0E42\u0E2D JAV %s \u0E1A\u0E19 MISSAV-J" },
    trending: { t: "\u0E27\u0E34\u0E14\u0E35\u0E42\u0E2D JAV \u0E22\u0E2D\u0E14\u0E19\u0E34\u0E22\u0E21 | MISSAV-J", d: "\u0E14\u0E39\u0E27\u0E34\u0E14\u0E35\u0E42\u0E2D JAV \u0E17\u0E35\u0E48\u0E44\u0E14\u0E49\u0E23\u0E31\u0E1A\u0E04\u0E27\u0E32\u0E21\u0E19\u0E34\u0E22\u0E21\u0E41\u0E25\u0E30\u0E40\u0E1B\u0E47\u0E19\u0E01\u0E23\u0E30\u0E41\u0E2A\u0E17\u0E35\u0E48\u0E2A\u0E38\u0E14\u0E15\u0E2D\u0E19\u0E19\u0E35\u0E49\u0E1A\u0E19 MISSAV-J" },
    recent: { t: "\u0E27\u0E34\u0E14\u0E35\u0E42\u0E2D JAV \u0E25\u0E48\u0E32\u0E2A\u0E38\u0E14 | MISSAV-J", d: "\u0E14\u0E39\u0E27\u0E34\u0E14\u0E35\u0E42\u0E2D JAV \u0E25\u0E48\u0E32\u0E2A\u0E38\u0E14\u0E17\u0E35\u0E48\u0E40\u0E1E\u0E34\u0E48\u0E07\u0E40\u0E1B\u0E34\u0E14\u0E15\u0E31\u0E27\u0E1A\u0E19 MISSAV-J" },
    actors: { t: "\u0E19\u0E31\u0E01\u0E41\u0E2A\u0E14\u0E07\u0E2B\u0E0D\u0E34\u0E07 JAV \u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14 | MISSAV-J", d: "\u0E40\u0E23\u0E35\u0E22\u0E01\u0E14\u0E39\u0E10\u0E32\u0E19\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E19\u0E31\u0E01\u0E41\u0E2A\u0E14\u0E07\u0E2B\u0E0D\u0E34\u0E07 JAV \u0E17\u0E35\u0E48\u0E2A\u0E21\u0E1A\u0E39\u0E23\u0E13\u0E4C\u0E02\u0E2D\u0E07\u0E40\u0E23\u0E32" },
    categories: { t: "\u0E2B\u0E21\u0E27\u0E14\u0E2B\u0E21\u0E39\u0E48 JAV \u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14 | MISSAV-J", d: "\u0E2A\u0E33\u0E23\u0E27\u0E08\u0E2B\u0E21\u0E27\u0E14\u0E2B\u0E21\u0E39\u0E48\u0E41\u0E25\u0E30\u0E41\u0E19\u0E27\u0E40\u0E1E\u0E25\u0E07 JAV \u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14\u0E1A\u0E19 MISSAV-J" },
    studios: { t: "\u0E2A\u0E15\u0E39\u0E14\u0E34\u0E42\u0E2D JAV \u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14 | MISSAV-J", d: "\u0E40\u0E23\u0E35\u0E22\u0E01\u0E14\u0E39\u0E27\u0E34\u0E14\u0E35\u0E42\u0E2D\u0E08\u0E32\u0E01\u0E2A\u0E15\u0E39\u0E14\u0E34\u0E42\u0E2D JAV \u0E0A\u0E31\u0E49\u0E19\u0E19\u0E33\u0E1A\u0E19 MISSAV-J" },
    search: { t: "\u0E1C\u0E25\u0E01\u0E32\u0E23\u0E04\u0E49\u0E19\u0E2B\u0E32 | MISSAV-J", d: "\u0E1C\u0E25\u0E01\u0E32\u0E23\u0E04\u0E49\u0E19\u0E2B\u0E32\u0E2A\u0E33\u0E2B\u0E23\u0E31\u0E1A\u0E27\u0E34\u0E14\u0E35\u0E42\u0E2D JAV \u0E1E\u0E23\u0E35\u0E40\u0E21\u0E35\u0E22\u0E21\u0E1A\u0E19 MISSAV-J" },
    history: { t: "\u0E1B\u0E23\u0E30\u0E27\u0E31\u0E15\u0E34\u0E01\u0E32\u0E23\u0E40\u0E02\u0E49\u0E32\u0E0A\u0E21 | MISSAV-J", d: "\u0E27\u0E34\u0E14\u0E35\u0E42\u0E2D JAV \u0E17\u0E35\u0E48\u0E04\u0E38\u0E13\u0E40\u0E1E\u0E34\u0E48\u0E07\u0E14\u0E39\u0E25\u0E48\u0E32\u0E2A\u0E38\u0E14\u0E1A\u0E19 MISSAV-J" },
    watch_later: { t: "\u0E14\u0E39\u0E20\u0E32\u0E22\u0E2B\u0E25\u0E31\u0E07 | MISSAV-J", d: "\u0E27\u0E34\u0E14\u0E35\u0E42\u0E2D JAV \u0E17\u0E35\u0E48\u0E04\u0E38\u0E13\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E44\u0E27\u0E49\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E14\u0E39\u0E20\u0E32\u0E22\u0E2B\u0E25\u0E31\u0E07\u0E1A\u0E19 MISSAV-J" },
    default: { t: "MISSAV-J | \u0E2A\u0E15\u0E23\u0E35\u0E21\u0E21\u0E34\u0E48\u0E07 JAV \u0E1E\u0E23\u0E35\u0E40\u0E21\u0E35\u0E22\u0E21", d: "\u0E14\u0E39\u0E01\u0E32\u0E23\u0E2A\u0E15\u0E23\u0E35\u0E21 JAV \u0E1E\u0E23\u0E35\u0E40\u0E21\u0E35\u0E22\u0E21\u0E17\u0E35\u0E48\u0E14\u0E35\u0E17\u0E35\u0E48\u0E2A\u0E38\u0E14\u0E1A\u0E19 MISSAV-J" }
  },
  de: {
    home: { t: "MISSAV-J | Premium JAV Streaming", d: "Sehen Sie sich die besten Premium-JAV-Streams an. Entdecken Sie die neuesten Ver\xF6ffentlichungen, Trendvideos und Top-Schauspielerinnen." },
    actor: { t: "%s | MISSAV-J", d: "Sehen Sie sich JAV-Videos mit %s in Premium-HD auf MISSAV-J an." },
    category: { t: "%s JAV-Videos | MISSAV-J", d: "Sehen Sie sich die neuesten und besten %s JAV-Videos online kostenlos an." },
    studio: { t: "%s JAV-Videos | MISSAV-J", d: "Entdecken Sie die offizielle Sammlung von %s JAV-Videos auf MISSAV-J." },
    trending: { t: "Trendige JAV-Videos | MISSAV-J", d: "Sehen Sie sich jetzt die beliebtesten und angesagtesten JAV-Videos auf MISSAV-J an." },
    recent: { t: "Neueste JAV-Videos | MISSAV-J", d: "Sehen Sie sich die neuesten JAV-Video-Ver\xF6ffentlichungen auf MISSAV-J an." },
    actors: { t: "Alle JAV-Schauspielerinnen | MISSAV-J", d: "Durchsuchen Sie unsere komplette Datenbank von JAV-Schauspielerinnen." },
    categories: { t: "Alle JAV-Kategorien | MISSAV-J", d: "Entdecken Sie alle JAV-Kategorien und Genres auf MISSAV-J." },
    studios: { t: "Alle JAV-Studios | MISSAV-J", d: "Durchsuchen Sie Videos von den besten JAV-Studios auf MISSAV-J." },
    search: { t: "Suchergebnisse | MISSAV-J", d: "Suchergebnisse f\xFCr Premium-JAV-Videos auf MISSAV-J." },
    history: { t: "Verlauf | MISSAV-J", d: "Ihre k\xFCrzlich angesehenen JAV-Videos auf MISSAV-J." },
    watch_later: { t: "Sp\xE4ter ansehen | MISSAV-J", d: "Ihre gespeicherten JAV-Videos auf MISSAV-J." },
    default: { t: "MISSAV-J | Premium JAV Streaming", d: "Sehen Sie sich die besten Premium-JAV-Streams auf MISSAV-J an." }
  },
  fr: {
    home: { t: "MISSAV-J | Streaming JAV Premium", d: "Regardez le meilleur streaming JAV premium. D\xE9couvrez les derni\xE8res sorties, les vid\xE9os tendance et les meilleures actrices." },
    actor: { t: "%s | MISSAV-J", d: "Regardez des vid\xE9os JAV avec %s en HD premium sur MISSAV-J." },
    category: { t: "Vid\xE9os JAV %s | MISSAV-J", d: "Regardez les derni\xE8res et les meilleures vid\xE9os JAV %s en ligne gratuitement." },
    studio: { t: "Vid\xE9os JAV %s | MISSAV-J", d: "D\xE9couvrez la collection officielle de vid\xE9os JAV %s sur MISSAV-J." },
    trending: { t: "Vid\xE9os JAV tendance | MISSAV-J", d: "Regardez les vid\xE9os JAV les plus populaires en ce moment sur MISSAV-J." },
    recent: { t: "Derni\xE8res vid\xE9os JAV | MISSAV-J", d: "Regardez les derni\xE8res sorties de vid\xE9os JAV sur MISSAV-J." },
    actors: { t: "Toutes les actrices JAV | MISSAV-J", d: "Parcourez notre base de donn\xE9es compl\xE8te d'actrices JAV." },
    categories: { t: "Toutes les cat\xE9gories JAV | MISSAV-J", d: "D\xE9couvrez toutes les cat\xE9gories et genres JAV sur MISSAV-J." },
    studios: { t: "Tous les studios JAV | MISSAV-J", d: "Parcourez les vid\xE9os des meilleurs studios JAV sur MISSAV-J." },
    search: { t: "R\xE9sultats de recherche | MISSAV-J", d: "R\xE9sultats de recherche pour les vid\xE9os JAV premium sur MISSAV-J." },
    history: { t: "Historique | MISSAV-J", d: "Vos vid\xE9os JAV r\xE9cemment regard\xE9es sur MISSAV-J." },
    watch_later: { t: "\xC0 regarder plus tard | MISSAV-J", d: "Vos vid\xE9os JAV enregistr\xE9es sur MISSAV-J." },
    default: { t: "MISSAV-J | Streaming JAV Premium", d: "Regardez le meilleur streaming JAV premium sur MISSAV-J." }
  },
  vi: {
    home: { t: "MISSAV-J | Truy\u1EC1n ph\xE1t JAV Cao c\u1EA5p", d: "Xem truy\u1EC1n ph\xE1t JAV cao c\u1EA5p t\u1ED1t nh\u1EA5t. Kh\xE1m ph\xE1 c\xE1c b\u1EA3n ph\xE1t h\xE0nh m\u1EDBi nh\u1EA5t, video th\u1ECBnh h\xE0nh v\xE0 c\xE1c n\u1EEF di\u1EC5n vi\xEAn h\xE0ng \u0111\u1EA7u." },
    actor: { t: "%s | MISSAV-J", d: "Xem video JAV c\xF3 s\u1EF1 tham gia c\u1EE7a %s v\u1EDBi ch\u1EA5t l\u01B0\u1EE3ng HD cao c\u1EA5p tr\xEAn MISSAV-J." },
    category: { t: "Video JAV %s | MISSAV-J", d: "Xem video JAV %s m\u1EDBi nh\u1EA5t v\xE0 t\u1ED1t nh\u1EA5t tr\u1EF1c tuy\u1EBFn mi\u1EC5n ph\xED." },
    studio: { t: "Video JAV %s | MISSAV-J", d: "Kh\xE1m ph\xE1 b\u1ED9 s\u01B0u t\u1EADp ch\xEDnh th\u1EE9c c\u1EE7a c\xE1c video JAV %s tr\xEAn MISSAV-J." },
    trending: { t: "Video JAV th\u1ECBnh h\xE0nh | MISSAV-J", d: "Xem c\xE1c video JAV ph\u1ED5 bi\u1EBFn v\xE0 th\u1ECBnh h\xE0nh nh\u1EA5t ngay b\xE2y gi\u1EDD tr\xEAn MISSAV-J." },
    recent: { t: "Video JAV m\u1EDBi nh\u1EA5t | MISSAV-J", d: "Xem c\xE1c b\u1EA3n ph\xE1t h\xE0nh video JAV m\u1EDBi nh\u1EA5t tr\xEAn MISSAV-J." },
    actors: { t: "T\u1EA5t c\u1EA3 N\u1EEF di\u1EC5n vi\xEAn JAV | MISSAV-J", d: "Duy\u1EC7t qua c\u01A1 s\u1EDF d\u1EEF li\u1EC7u ho\xE0n ch\u1EC9nh c\u1EE7a ch\xFAng t\xF4i v\u1EC1 c\xE1c n\u1EEF di\u1EC5n vi\xEAn JAV." },
    categories: { t: "T\u1EA5t c\u1EA3 Danh m\u1EE5c JAV | MISSAV-J", d: "Kh\xE1m ph\xE1 t\u1EA5t c\u1EA3 c\xE1c danh m\u1EE5c v\xE0 th\u1EC3 lo\u1EA1i JAV tr\xEAn MISSAV-J." },
    studios: { t: "T\u1EA5t c\u1EA3 Studio JAV | MISSAV-J", d: "Duy\u1EC7t video t\u1EEB c\xE1c studio JAV h\xE0ng \u0111\u1EA7u tr\xEAn MISSAV-J." },
    search: { t: "K\u1EBFt qu\u1EA3 T\xECm ki\u1EBFm | MISSAV-J", d: "K\u1EBFt qu\u1EA3 t\xECm ki\u1EBFm cho c\xE1c video JAV cao c\u1EA5p tr\xEAn MISSAV-J." },
    history: { t: "L\u1ECBch s\u1EED xem | MISSAV-J", d: "C\xE1c video JAV b\u1EA1n \u0111\xE3 xem g\u1EA7n \u0111\xE2y tr\xEAn MISSAV-J." },
    watch_later: { t: "Xem sau | MISSAV-J", d: "C\xE1c video JAV b\u1EA1n \u0111\xE3 l\u01B0u \u0111\u1EC3 xem sau tr\xEAn MISSAV-J." },
    default: { t: "MISSAV-J | Truy\u1EC1n ph\xE1t JAV Cao c\u1EA5p", d: "Xem truy\u1EC1n ph\xE1t JAV cao c\u1EA5p t\u1ED1t nh\u1EA5t tr\xEAn MISSAV-J." }
  },
  fil: {
    home: { t: "MISSAV-J | Premium JAV Streaming", d: "Panoorin ang pinakamahusay na premium JAV streaming. Tuklasin ang mga pinakabagong release, trending videos, at top actresses." },
    actor: { t: "%s | MISSAV-J", d: "Panoorin ang mga JAV video na pinagbibidahan ni %s sa premium HD sa MISSAV-J." },
    category: { t: "%s JAV Videos | MISSAV-J", d: "Panoorin ang pinakabago at pinakamahusay na %s JAV videos online nang libre." },
    studio: { t: "%s JAV Videos | MISSAV-J", d: "Galugarin ang opisyal na koleksyon ng mga %s JAV videos sa MISSAV-J." },
    trending: { t: "Trending JAV Videos | MISSAV-J", d: "Panoorin ang pinakasikat at trending na JAV videos ngayon sa MISSAV-J." },
    recent: { t: "Pinakabagong JAV Videos | MISSAV-J", d: "Panoorin ang mga pinakabagong release ng JAV video sa MISSAV-J." },
    actors: { t: "Lahat ng JAV Actresses | MISSAV-J", d: "I-browse ang aming kumpletong database ng mga JAV actresses." },
    categories: { t: "Lahat ng JAV Categories | MISSAV-J", d: "Galugarin ang lahat ng JAV categories at genres sa MISSAV-J." },
    studios: { t: "Lahat ng JAV Studios | MISSAV-J", d: "Mag-browse ng mga video mula sa nangungunang JAV studios sa MISSAV-J." },
    search: { t: "Mga Resulta ng Paghahanap | MISSAV-J", d: "Mga resulta ng paghahanap para sa premium JAV videos sa MISSAV-J." },
    history: { t: "Kasaysayan ng Napanood | MISSAV-J", d: "Ang iyong mga kamakailang napanood na JAV videos sa MISSAV-J." },
    watch_later: { t: "Panoorin Mamaya | MISSAV-J", d: "Ang iyong mga na-save na JAV videos para panoorin mamaya sa MISSAV-J." },
    default: { t: "MISSAV-J | Premium JAV Streaming", d: "Panoorin ang pinakamahusay na premium JAV streaming sa MISSAV-J." }
  },
  pt: {
    home: { t: "MISSAV-J | Streaming JAV Premium", d: "Assista ao melhor streaming JAV premium. Explore os lan\xE7amentos mais recentes, v\xEDdeos em alta e as melhores atrizes." },
    actor: { t: "%s | MISSAV-J", d: "Assista a v\xEDdeos JAV com %s em HD premium no MISSAV-J." },
    category: { t: "V\xEDdeos JAV %s | MISSAV-J", d: "Assista aos melhores e mais recentes v\xEDdeos JAV %s online gratuitamente." },
    studio: { t: "V\xEDdeos JAV %s | MISSAV-J", d: "Explore a cole\xE7\xE3o oficial de v\xEDdeos JAV %s no MISSAV-J." },
    trending: { t: "V\xEDdeos JAV em alta | MISSAV-J", d: "Assista aos v\xEDdeos JAV mais populares e em alta no momento no MISSAV-J." },
    recent: { t: "V\xEDdeos JAV mais recentes | MISSAV-J", d: "Assista aos lan\xE7amentos de v\xEDdeos JAV mais recentes no MISSAV-J." },
    actors: { t: "Todas as atrizes JAV | MISSAV-J", d: "Navegue pelo nosso banco de dados completo de atrizes JAV." },
    categories: { t: "Todas as categorias JAV | MISSAV-J", d: "Explore todas as categorias e g\xEAneros JAV no MISSAV-J." },
    studios: { t: "Todos os est\xFAdios JAV | MISSAV-J", d: "Navegue por v\xEDdeos dos principais est\xFAdios JAV no MISSAV-J." },
    search: { t: "Resultados da pesquisa | MISSAV-J", d: "Resultados da pesquisa por v\xEDdeos JAV premium no MISSAV-J." },
    history: { t: "Hist\xF3rico | MISSAV-J", d: "Seus v\xEDdeos JAV assistidos recentemente no MISSAV-J." },
    watch_later: { t: "Assistir mais tarde | MISSAV-J", d: "Seus v\xEDdeos JAV salvos para assistir mais tarde no MISSAV-J." },
    default: { t: "MISSAV-J | Streaming JAV Premium", d: "Assista ao melhor streaming JAV premium no MISSAV-J." }
  }
};
function formatDuration(durationStr) {
  if (!durationStr || durationStr === "00:00:00") return null;
  const parts = durationStr.split(":").map(Number);
  if (parts.length !== 3) return null;
  const [h, m, s] = parts;
  if (h === 0 && m === 0 && s === 0) return null;
  let iso = "PT";
  if (h > 0) iso += `${h}H`;
  if (m > 0) iso += `${m}M`;
  if (s > 0) iso += `${s}S`;
  return iso === "PT" ? null : iso;
}
__name(formatDuration, "formatDuration");
__name2(formatDuration, "formatDuration");
async function fetchPostMetadata(id, origin) {
  const apiUrl = `${TARGET_BASE5}/posts/${id}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6e3);
  try {
    const res = await fetch(apiUrl, {
      headers: {
        "Accept": "application/json",
        "X-Client-Site": "https://www.missav-j.com",
        "Referer": "https://www.missav-j.com/",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
      },
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (!res.ok) return null;
    return res.json();
  } catch (err) {
    clearTimeout(timeoutId);
    console.error("[OG Fetch Error]", err);
    return null;
  }
}
__name(fetchPostMetadata, "fetchPostMetadata");
__name2(fetchPostMetadata, "fetchPostMetadata");
async function getTranslatedTitle(id, lang, supabaseUrl, supabaseKey) {
  if (!lang || lang === "en" || !supabaseUrl || !supabaseKey) return null;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4e3);
  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/translations?id=eq.${id}&select=translations`,
      {
        headers: {
          "apikey": supabaseKey,
          "Authorization": `Bearer ${supabaseKey}`
        },
        signal: controller.signal
      }
    );
    clearTimeout(timeoutId);
    if (!res.ok) return null;
    const data = await res.json();
    if (data && data[0] && data[0].translations && data[0].translations[lang]) {
      return data[0].translations[lang];
    }
  } catch (e) {
    clearTimeout(timeoutId);
    console.error("[OG Supabase Error]", e);
  }
  return null;
}
__name(getTranslatedTitle, "getTranslatedTitle");
__name2(getTranslatedTitle, "getTranslatedTitle");
function escapeHtml(str) {
  if (typeof str !== "string") str = String(str || "");
  if (!str) return "";
  const unescaped = str.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&#39;/g, "'");
  return unescaped.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}
__name(escapeHtml, "escapeHtml");
__name2(escapeHtml, "escapeHtml");
function truncateChars(str, max) {
  if (!str) return "";
  if (str.length <= max) return str;
  return str.slice(0, max - 1).trimEnd() + "\u2026";
}
__name(truncateChars, "truncateChars");
__name2(truncateChars, "truncateChars");
var COUNTRY_TO_LANG = {
  // East Asia
  JP: "ja",
  KR: "ko",
  TW: "zh-TW",
  HK: "zh-TW",
  MO: "zh-TW",
  CN: "zh-CN",
  // Southeast Asia
  ID: "id",
  VN: "vi",
  TH: "th",
  MY: "ms",
  SG: "ms",
  BN: "ms",
  PH: "fil",
  // Europe
  DE: "de",
  AT: "de",
  FR: "fr",
  BE: "fr",
  LU: "fr",
  // Portuguese-speaking
  BR: "pt",
  PT: "pt",
  AO: "pt",
  MZ: "pt",
  CV: "pt",
  GW: "pt",
  ST: "pt",
  TL: "pt"
};
function detectLangFromCountry(countryCode) {
  if (!countryCode || countryCode === "XX" || countryCode === "T1") return "en";
  return COUNTRY_TO_LANG[countryCode.toUpperCase()] || "en";
}
__name(detectLangFromCountry, "detectLangFromCountry");
__name2(detectLangFromCountry, "detectLangFromCountry");
function getCookieLang(req) {
  const cookieHeader = req.headers.get("Cookie") || "";
  const match2 = cookieHeader.match(/(?:^|;\s*)missav_lang=([^;]+)/);
  return match2 ? match2[1].trim() : null;
}
__name(getCookieLang, "getCookieLang");
__name2(getCookieLang, "getCookieLang");
async function onRequest6(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const pathname = url.pathname;
  if (request.method === "GET" && (pathname === "/" || pathname === "")) {
    const userAgent = request.headers.get("User-Agent") || "";
    const isBot = /Googlebot|bingbot|Slurp|DuckDuckBot|Baiduspider|YandexBot|Sogou|Exabot|facebot|ia_archiver|AhrefsBot|SemrushBot|MJ12bot|Applebot/i.test(userAgent);
    const cookieLang = getCookieLang(request);
    let targetLang;
    if (cookieLang && VALID_LANGS.includes(cookieLang)) {
      targetLang = cookieLang;
    } else {
      const country = request.headers.get("CF-IPCountry") || request.cf && request.cf.country || "";
      targetLang = detectLangFromCountry(country);
    }
    const finalLang = isBot ? "en" : targetLang;
    const redirectUrl = `${url.origin}/${finalLang}/${url.search}`;
    const redirectStatus = isBot ? 301 : 302;
    const redirectHeaders = {
      "Location": redirectUrl,
      // JANGAN cache redirect di CDN — setiap user bisa dari negara berbeda
      "Cache-Control": "no-store, no-cache",
      "Vary": "CF-IPCountry, Cookie"
    };
    if (!isBot) {
      redirectHeaders["Set-Cookie"] = `missav_lang=${targetLang}; Path=/; Max-Age=2592000; SameSite=Lax; Secure`;
    }
    return new Response(null, {
      status: redirectStatus,
      headers: redirectHeaders
    });
  }
  if (pathname === "/sitemap.xml") {
    const newRequest = new Request(new URL("/sitemaps/sitemap_index.xml", request.url), request);
    return env.ASSETS.fetch(newRequest);
  }
  const isGet = request.method === "GET";
  const watchRegex = /^\/(?:([a-zA-Z\-]+)\/)?watch(?:\/([^\/]+))?\/?$/;
  const listRegex = /^\/(?:([a-zA-Z\-]+)\/)?(actor|category|studio|trending|recent|actors|categories|studios|popular-actors|watch-later|history|search)\/?$/;
  const langRegex = /^\/([a-zA-Z\-]+)?\/?$/;
  const isWatch = pathname.match(watchRegex);
  const isList = pathname.match(listRegex);
  const isLangRoot = pathname.match(langRegex);
  const isCacheableRoute = isGet && (isWatch || isList || isLangRoot);
  let cache = null;
  if (isCacheableRoute) {
    try {
      cache = caches.default;
      const cachedResponse = await cache.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }
    } catch (e) {
      console.error("[Cache SSR Match Error]", e);
    }
  }
  const watchMatch = isWatch;
  if (watchMatch) {
    const lang = watchMatch[1] || "en";
    const slug = watchMatch[2] || "";
    const isLangValid = VALID_LANGS.includes(lang);
    if (isLangValid || !watchMatch[1] && lang === "en") {
      let id = null;
      if (slug) {
        const match2 = slug.match(/.*-(\d+)$/);
        if (match2) {
          id = match2[1];
        } else if (slug.match(/^\d+$/)) {
          id = slug;
        }
      }
      const activeLang = isLangValid ? lang : "en";
      const [indexResponse, post] = await Promise.all([
        env.ASSETS.fetch(new URL("/index.html", request.url)),
        id ? fetchPostMetadata(id, url.origin) : Promise.resolve(null)
      ]);
      if (!indexResponse.ok) {
        return new Response("Internal Server Error: Failed to fetch index.html", { status: 500 });
      }
      let htmlContent = await indexResponse.text();
      const watchHtmlLang = hreflangCode2(isLangValid ? lang : "en");
      htmlContent = htmlContent.replace(/<html lang="[^"]*"/i, `<html lang="${watchHtmlLang}"`);
      if (id) {
        try {
          if (post && post.title) {
            let title = post.title;
            if (activeLang !== "en") {
              const translated = await getTranslatedTitle(
                id,
                activeLang,
                env.SUPABASE_URL,
                env.SUPABASE_KEY
              );
              if (translated) title = translated;
            }
            const code = post.code || "";
            const fullTitle = code ? `[${code}] ${title} - MISSAV-J` : `${title} - MISSAV-J`;
            let actorsStr = "";
            if (post.actors && Array.isArray(post.actors)) {
              actorsStr = post.actors.map((a) => typeof a === "string" ? a : a.name).filter(Boolean).slice(0, 3).join(", ");
            }
            let studioStr = "";
            if (post.studio) {
              studioStr = typeof post.studio === "string" ? post.studio : post.studio.name || "";
            }
            const descFn = DESC_TEMPLATES[activeLang] || DESC_TEMPLATES["en"];
            const description = descFn(code, title, actorsStr, studioStr);
            let imageUrl = post.thumbnail || "";
            if (imageUrl.includes("apijav.php?url=")) {
              try {
                const urlObj = new URL(imageUrl);
                const actualUrl = urlObj.searchParams.get("url");
                if (actualUrl && (actualUrl.startsWith("http") || actualUrl.startsWith("//"))) {
                  imageUrl = actualUrl;
                }
              } catch (e) {
              }
            }
            if (imageUrl && imageUrl.startsWith("//")) {
              imageUrl = `https:${imageUrl}`;
            }
            const proxiedImageUrl = imageUrl && imageUrl.startsWith("http") ? `${url.origin}/api/image?url=${encodeURIComponent(imageUrl)}` : `${url.origin}/assets/images/logo.webp`;
            imageUrl = proxiedImageUrl;
            const pageUrl = `${url.origin}${url.pathname}${url.search}`;
            htmlContent = htmlContent.replace(/<title>[^<]*<\/title>/i, () => `<title>${escapeHtml(fullTitle)}</title>`);
            htmlContent = htmlContent.replace(
              /<meta name="description" id="meta-description" content="[^"]*"/i,
              () => `<meta name="description" id="meta-description" content="${escapeHtml(description)}"`
            );
            htmlContent = htmlContent.replace(
              /<link rel="canonical" id="canonical-url" href="[^"]*"/i,
              () => `<link rel="canonical" id="canonical-url" href="${escapeHtml(pageUrl)}"`
            );
            htmlContent = htmlContent.replace(
              /<meta property="og:url" id="og-url" content="[^"]*"/i,
              () => `<meta property="og:url" id="og-url" content="${escapeHtml(pageUrl)}"`
            );
            htmlContent = htmlContent.replace(
              /<meta property="og:title" id="og-title" content="[^"]*"/i,
              () => `<meta property="og:title" id="og-title" content="${escapeHtml(fullTitle)}"`
            );
            htmlContent = htmlContent.replace(
              /<meta property="og:description" id="og-description" content="[^"]*"/i,
              () => `<meta property="og:description" id="og-description" content="${escapeHtml(description)}"`
            );
            htmlContent = htmlContent.replace(
              /<meta property="og:image" id="og-image" content="[^"]*"/i,
              () => `<meta property="og:image" id="og-image" content="${escapeHtml(imageUrl)}"`
            );
            htmlContent = htmlContent.replace(
              /<meta name="twitter:title" id="twitter-title" content="[^"]*"/i,
              () => `<meta name="twitter:title" id="twitter-title" content="${escapeHtml(fullTitle)}"`
            );
            htmlContent = htmlContent.replace(
              /<meta name="twitter:description" id="twitter-description" content="[^"]*"/i,
              () => `<meta name="twitter:description" id="twitter-description" content="${escapeHtml(description)}"`
            );
            htmlContent = htmlContent.replace(
              /<meta name="twitter:image" id="twitter-image" content="[^"]*"/i,
              () => `<meta name="twitter:image" id="twitter-image" content="${escapeHtml(imageUrl)}"`
            );
            const hreflangBlock = generateHreflangTags(url.origin, url.pathname, url.search);
            htmlContent = htmlContent.replace(/<\/head>/i, () => `  ${hreflangBlock}
</head>`);
            if (htmlContent.includes('"@type": "WebSite"')) {
              const cleanEmbedUrl = post.embed_url ? post.embed_url.replace(/&#038;/g, "&").replace(/&amp;/g, "&") : `https://server.apijav.com/embed/${id}`;
              const isoDuration = formatDuration(post.duration);
              const actorsList = (post.actors || []).map((a) => ({
                "@type": "Person",
                "name": typeof a === "string" ? a : a.name || a
              }));
              const genreList = (post.categories || []).map((c) => typeof c === "string" ? c : c.name || c);
              let uploadDate = (/* @__PURE__ */ new Date()).toISOString();
              if (post.date) {
                const parsedDate = new Date(post.date);
                if (!isNaN(parsedDate.getTime())) {
                  uploadDate = parsedDate.toISOString();
                }
              }
              const videoSchema = {
                "@type": "VideoObject",
                "name": title,
                "description": description,
                // Array thumbnailUrl: gunakan URL proxy kita (/api/image) agar Googlebot
                // selalu bisa akses thumbnail (domain kita sendiri, tidak di-block CDN).
                "thumbnailUrl": [proxiedImageUrl],
                "uploadDate": uploadDate,
                // url: URL halaman canonical kita — accessible oleh Googlebot (domain kita sendiri)
                "url": pageUrl,
                // embedUrl: URL embed player dari server — Google coba akses ini untuk verifikasi video
                "embedUrl": cleanEmbedUrl,
                "publisher": {
                  "@type": "Organization",
                  "name": "MISSAV-J",
                  "url": "https://www.missav-j.com",
                  "logo": {
                    "@type": "ImageObject",
                    "url": "https://www.missav-j.com/assets/images/logo.webp",
                    "width": 192,
                    "height": 192
                  }
                },
                "inLanguage": "ja"
              };
              if (isoDuration) videoSchema.duration = isoDuration;
              if (post.views) {
                videoSchema.interactionStatistic = {
                  "@type": "InteractionCounter",
                  "interactionType": { "@type": "WatchAction" },
                  "userInteractionCount": parseInt(post.views) || 0
                };
              }
              if (actorsList.length > 0) videoSchema.actor = actorsList;
              if (genreList.length > 0) videoSchema.genre = genreList;
              if (post.studio) {
                videoSchema.productionCompany = {
                  "@type": "Organization",
                  "name": typeof post.studio === "string" ? post.studio : post.studio?.name || ""
                };
              }
              const breadcrumbSchema = {
                "@type": "BreadcrumbList",
                "itemListElement": [
                  {
                    "@type": "ListItem",
                    "position": 1,
                    "name": "Home",
                    "item": `${url.origin}/en/`
                  },
                  {
                    "@type": "ListItem",
                    "position": 2,
                    "name": title,
                    "item": pageUrl
                  }
                ]
              };
              const structuredData = {
                "@context": "https://schema.org",
                "@graph": [videoSchema, breadcrumbSchema]
              };
              htmlContent = htmlContent.replace(
                /<script type="application\/ld\+json" id="json-ld-data">[\s\S]*?<\/script>/i,
                () => `<script type="application/ld+json" id="json-ld-data">${JSON.stringify(structuredData, null, 2).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026")}<\/script>`
              );
              const seoFallbackContent = `
        <div class="seo-fallback" style="display: contents;">
          <h1>${escapeHtml(fullTitle)}</h1>
          <p>${escapeHtml(description)}</p>
          <div style="position: relative; width: 100%; aspect-ratio: 16/9; background: #000;">
            <iframe
              src="${escapeHtml(cleanEmbedUrl)}"
              title="${escapeHtml(fullTitle)}"
              style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none;"
              allowfullscreen
              loading="lazy"
              referrerpolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>
        </div>
              `;
              htmlContent = htmlContent.replace(/<div class="seo-fallback"[^>]*>[\s\S]*?<\/div>/i, () => seoFallbackContent);
            }
          }
        } catch (err) {
          console.error("[Watch OG Error]", err);
        }
      }
      const watchResponse = new Response(htmlContent, {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "public, max-age=3600, s-maxage=604800, stale-while-revalidate=86400",
          "CDN-Cache-Control": "public, max-age=604800"
        }
      });
      if (cache && isCacheableRoute) {
        context.waitUntil(cache.put(request, watchResponse.clone()));
      }
      return watchResponse;
    }
  } else {
    const listMatch = isList || isLangRoot;
    if (listMatch) {
      const lang = listMatch[1] || "en";
      const type = isList ? listMatch[2] : "home";
      const isLangValid = VALID_LANGS.includes(lang);
      if (isLangValid || !listMatch[1] && lang === "en") {
        const activeLang = isLangValid ? lang : "en";
        const nameParam = url.searchParams.get("name") || "";
        const indexResponse = await env.ASSETS.fetch(new URL("/index.html", request.url));
        if (!indexResponse.ok) {
          return new Response("Internal Server Error: Failed to fetch index.html", { status: 500 });
        }
        let htmlContent = await indexResponse.text();
        const listHtmlLang = hreflangCode2(activeLang);
        htmlContent = htmlContent.replace(/<html lang="[^"]*"/i, `<html lang="${listHtmlLang}"`);
        let pageTitle = "MISSAV-J";
        let pageDesc = "MISSAV-J Streaming";
        let schemaType = "CollectionPage";
        const typeKey = type === "popular-actors" ? "actors" : type === "watch-later" ? "watch_later" : type || "home";
        const langDict = SEO_I18N[activeLang] || SEO_I18N["en"];
        const pageTemplate = langDict[typeKey] || SEO_I18N["en"][typeKey] || langDict["default"] || SEO_I18N["en"]["default"];
        const safeName = nameParam || "";
        const titleName = type === "actor" ? truncateChars(nameParam, 49) : safeName;
        const descName = type === "actor" ? truncateChars(nameParam, 65) : safeName;
        pageTitle = pageTemplate.t.replace(/%s/g, titleName);
        pageDesc = pageTemplate.d.replace(/%s/g, descName);
        if (type === "actor" && nameParam) {
          schemaType = "ProfilePage";
        } else if (type === "search") {
          schemaType = "SearchResultsPage";
        }
        const pageUrl = `${url.origin}${url.pathname}${url.search}`;
        htmlContent = htmlContent.replace(/<title>[^<]*<\/title>/i, () => `<title>${escapeHtml(pageTitle)}</title>`);
        htmlContent = htmlContent.replace(
          /<meta name="description" id="meta-description" content="[^"]*"/i,
          () => `<meta name="description" id="meta-description" content="${escapeHtml(pageDesc)}"`
        );
        htmlContent = htmlContent.replace(
          /<link rel="canonical" id="canonical-url" href="[^"]*"/i,
          () => `<link rel="canonical" id="canonical-url" href="${escapeHtml(pageUrl)}"`
        );
        htmlContent = htmlContent.replace(
          /<meta property="og:url" id="og-url" content="[^"]*"/i,
          () => `<meta property="og:url" id="og-url" content="${escapeHtml(pageUrl)}"`
        );
        htmlContent = htmlContent.replace(
          /<meta property="og:title" id="og-title" content="[^"]*"/i,
          () => `<meta property="og:title" id="og-title" content="${escapeHtml(pageTitle)}"`
        );
        htmlContent = htmlContent.replace(
          /<meta property="og:description" id="og-description" content="[^"]*"/i,
          () => `<meta property="og:description" id="og-description" content="${escapeHtml(pageDesc)}"`
        );
        htmlContent = htmlContent.replace(
          /<meta name="twitter:title" id="twitter-title" content="[^"]*"/i,
          () => `<meta name="twitter:title" id="twitter-title" content="${escapeHtml(pageTitle)}"`
        );
        htmlContent = htmlContent.replace(
          /<meta name="twitter:description" id="twitter-description" content="[^"]*"/i,
          () => `<meta name="twitter:description" id="twitter-description" content="${escapeHtml(pageDesc)}"`
        );
        const hreflangBlock = generateHreflangTags(url.origin, url.pathname, url.search);
        htmlContent = htmlContent.replace(/<\/head>/i, () => `  ${hreflangBlock}
</head>`);
        let schemaJson = {};
        if (schemaType === "ProfilePage" && nameParam) {
          schemaJson = {
            "@context": "https://schema.org",
            "@type": "ProfilePage",
            "mainEntity": {
              "@type": "Person",
              "name": nameParam,
              "url": pageUrl
            }
          };
        } else if (schemaType === "SearchResultsPage") {
          schemaJson = {
            "@context": "https://schema.org",
            "@type": "SearchResultsPage",
            "name": pageTitle,
            "description": pageDesc,
            "url": pageUrl
          };
        } else {
          schemaJson = {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "name": pageTitle,
            "description": pageDesc,
            "url": pageUrl
          };
        }
        const breadcrumbSchema = {
          "@type": "BreadcrumbList",
          "itemListElement": [
            {
              "@type": "ListItem",
              "position": 1,
              "name": "Home",
              "item": `${url.origin}/en/`
            },
            {
              "@type": "ListItem",
              "position": 2,
              "name": nameParam ? safeName : type.charAt(0).toUpperCase() + type.slice(1),
              "item": pageUrl
            }
          ]
        };
        const structuredData = {
          "@context": "https://schema.org",
          "@graph": [schemaJson, breadcrumbSchema]
        };
        htmlContent = htmlContent.replace(
          /<script type="application\/ld\+json" id="json-ld-data">[\s\S]*?<\/script>/is,
          () => `<script type="application/ld+json" id="json-ld-data">${JSON.stringify(structuredData, null, 2).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026")}<\/script>`
        );
        let actorLinksHtml = "";
        if (type === "actors") {
          try {
            const actorsRes = await env.ASSETS.fetch(new URL("/api/actors.json", request.url));
            if (actorsRes.ok) {
              const actorNames = await actorsRes.json();
              if (Array.isArray(actorNames)) {
                const items = actorNames.filter((n) => typeof n === "string" && n.trim() !== "").map((n) => `<li><a href="/${activeLang}/actor?name=${encodeURIComponent(n)}">${n}</a></li>`).join("");
                actorLinksHtml = `<nav aria-label="All actors"><ul>${items}</ul></nav>`;
              }
            }
          } catch (err) {
            console.error("[Actor Directory Error]", err);
          }
        }
        const seoFallbackContent = `
          <div class="seo-fallback" style="display: contents;">
            <h1>${escapeHtml(pageTitle)}</h1>
            <p>${escapeHtml(pageDesc)}</p>
            ${actorLinksHtml}
          </div>
        `;
        htmlContent = htmlContent.replace(/<div class="seo-fallback"[^>]*>[\s\S]*?<\/div>/i, () => seoFallbackContent);
        const listResponse = new Response(htmlContent, {
          headers: {
            "Content-Type": "text/html; charset=utf-8",
            "Cache-Control": "public, max-age=3600, s-maxage=604800, stale-while-revalidate=86400",
            "CDN-Cache-Control": "public, max-age=604800"
          }
        });
        if (cache && isCacheableRoute) {
          context.waitUntil(cache.put(request, listResponse.clone()));
        }
        return listResponse;
      }
    }
  }
  const res = await env.ASSETS.fetch(request);
  if (res.status === 404) {
    const ext = pathname.split(".").pop();
    const hasExtension = pathname.includes(".") && ext.length < 5;
    if (!pathname.startsWith("/api") && !hasExtension) {
      const indexResponse = await env.ASSETS.fetch(new URL("/index.html", request.url));
      return new Response(indexResponse.body, {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "public, max-age=3600, s-maxage=604800, stale-while-revalidate=86400",
          "CDN-Cache-Control": "public, max-age=604800"
        }
      });
    }
  }
  return res;
}
__name(onRequest6, "onRequest6");
__name2(onRequest6, "onRequest");
var routes = [
  {
    routePath: "/api/telegram/cron",
    mountPath: "/api/telegram",
    method: "",
    middlewares: [],
    modules: [onRequest]
  },
  {
    routePath: "/api/player/:id*",
    mountPath: "/api/player",
    method: "",
    middlewares: [],
    modules: [onRequest2]
  },
  {
    routePath: "/api/posts/:id*",
    mountPath: "/api/posts",
    method: "",
    middlewares: [],
    modules: [onRequest3]
  },
  {
    routePath: "/api/image",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest4]
  },
  {
    routePath: "/api/sitemap",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest5]
  },
  {
    routePath: "/:catchall*",
    mountPath: "/",
    method: "",
    middlewares: [],
    modules: [onRequest6]
  }
];
function lexer(str) {
  var tokens = [];
  var i = 0;
  while (i < str.length) {
    var char = str[i];
    if (char === "*" || char === "+" || char === "?") {
      tokens.push({ type: "MODIFIER", index: i, value: str[i++] });
      continue;
    }
    if (char === "\\") {
      tokens.push({ type: "ESCAPED_CHAR", index: i++, value: str[i++] });
      continue;
    }
    if (char === "{") {
      tokens.push({ type: "OPEN", index: i, value: str[i++] });
      continue;
    }
    if (char === "}") {
      tokens.push({ type: "CLOSE", index: i, value: str[i++] });
      continue;
    }
    if (char === ":") {
      var name = "";
      var j = i + 1;
      while (j < str.length) {
        var code = str.charCodeAt(j);
        if (
          // `0-9`
          code >= 48 && code <= 57 || // `A-Z`
          code >= 65 && code <= 90 || // `a-z`
          code >= 97 && code <= 122 || // `_`
          code === 95
        ) {
          name += str[j++];
          continue;
        }
        break;
      }
      if (!name)
        throw new TypeError("Missing parameter name at ".concat(i));
      tokens.push({ type: "NAME", index: i, value: name });
      i = j;
      continue;
    }
    if (char === "(") {
      var count = 1;
      var pattern = "";
      var j = i + 1;
      if (str[j] === "?") {
        throw new TypeError('Pattern cannot start with "?" at '.concat(j));
      }
      while (j < str.length) {
        if (str[j] === "\\") {
          pattern += str[j++] + str[j++];
          continue;
        }
        if (str[j] === ")") {
          count--;
          if (count === 0) {
            j++;
            break;
          }
        } else if (str[j] === "(") {
          count++;
          if (str[j + 1] !== "?") {
            throw new TypeError("Capturing groups are not allowed at ".concat(j));
          }
        }
        pattern += str[j++];
      }
      if (count)
        throw new TypeError("Unbalanced pattern at ".concat(i));
      if (!pattern)
        throw new TypeError("Missing pattern at ".concat(i));
      tokens.push({ type: "PATTERN", index: i, value: pattern });
      i = j;
      continue;
    }
    tokens.push({ type: "CHAR", index: i, value: str[i++] });
  }
  tokens.push({ type: "END", index: i, value: "" });
  return tokens;
}
__name(lexer, "lexer");
__name2(lexer, "lexer");
function parse(str, options) {
  if (options === void 0) {
    options = {};
  }
  var tokens = lexer(str);
  var _a = options.prefixes, prefixes = _a === void 0 ? "./" : _a, _b = options.delimiter, delimiter = _b === void 0 ? "/#?" : _b;
  var result = [];
  var key = 0;
  var i = 0;
  var path = "";
  var tryConsume = /* @__PURE__ */ __name2(function(type) {
    if (i < tokens.length && tokens[i].type === type)
      return tokens[i++].value;
  }, "tryConsume");
  var mustConsume = /* @__PURE__ */ __name2(function(type) {
    var value2 = tryConsume(type);
    if (value2 !== void 0)
      return value2;
    var _a2 = tokens[i], nextType = _a2.type, index = _a2.index;
    throw new TypeError("Unexpected ".concat(nextType, " at ").concat(index, ", expected ").concat(type));
  }, "mustConsume");
  var consumeText = /* @__PURE__ */ __name2(function() {
    var result2 = "";
    var value2;
    while (value2 = tryConsume("CHAR") || tryConsume("ESCAPED_CHAR")) {
      result2 += value2;
    }
    return result2;
  }, "consumeText");
  var isSafe = /* @__PURE__ */ __name2(function(value2) {
    for (var _i = 0, delimiter_1 = delimiter; _i < delimiter_1.length; _i++) {
      var char2 = delimiter_1[_i];
      if (value2.indexOf(char2) > -1)
        return true;
    }
    return false;
  }, "isSafe");
  var safePattern = /* @__PURE__ */ __name2(function(prefix2) {
    var prev = result[result.length - 1];
    var prevText = prefix2 || (prev && typeof prev === "string" ? prev : "");
    if (prev && !prevText) {
      throw new TypeError('Must have text between two parameters, missing text after "'.concat(prev.name, '"'));
    }
    if (!prevText || isSafe(prevText))
      return "[^".concat(escapeString(delimiter), "]+?");
    return "(?:(?!".concat(escapeString(prevText), ")[^").concat(escapeString(delimiter), "])+?");
  }, "safePattern");
  while (i < tokens.length) {
    var char = tryConsume("CHAR");
    var name = tryConsume("NAME");
    var pattern = tryConsume("PATTERN");
    if (name || pattern) {
      var prefix = char || "";
      if (prefixes.indexOf(prefix) === -1) {
        path += prefix;
        prefix = "";
      }
      if (path) {
        result.push(path);
        path = "";
      }
      result.push({
        name: name || key++,
        prefix,
        suffix: "",
        pattern: pattern || safePattern(prefix),
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    var value = char || tryConsume("ESCAPED_CHAR");
    if (value) {
      path += value;
      continue;
    }
    if (path) {
      result.push(path);
      path = "";
    }
    var open = tryConsume("OPEN");
    if (open) {
      var prefix = consumeText();
      var name_1 = tryConsume("NAME") || "";
      var pattern_1 = tryConsume("PATTERN") || "";
      var suffix = consumeText();
      mustConsume("CLOSE");
      result.push({
        name: name_1 || (pattern_1 ? key++ : ""),
        pattern: name_1 && !pattern_1 ? safePattern(prefix) : pattern_1,
        prefix,
        suffix,
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    mustConsume("END");
  }
  return result;
}
__name(parse, "parse");
__name2(parse, "parse");
function match(str, options) {
  var keys = [];
  var re = pathToRegexp(str, keys, options);
  return regexpToFunction(re, keys, options);
}
__name(match, "match");
__name2(match, "match");
function regexpToFunction(re, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.decode, decode = _a === void 0 ? function(x) {
    return x;
  } : _a;
  return function(pathname) {
    var m = re.exec(pathname);
    if (!m)
      return false;
    var path = m[0], index = m.index;
    var params = /* @__PURE__ */ Object.create(null);
    var _loop_1 = /* @__PURE__ */ __name2(function(i2) {
      if (m[i2] === void 0)
        return "continue";
      var key = keys[i2 - 1];
      if (key.modifier === "*" || key.modifier === "+") {
        params[key.name] = m[i2].split(key.prefix + key.suffix).map(function(value) {
          return decode(value, key);
        });
      } else {
        params[key.name] = decode(m[i2], key);
      }
    }, "_loop_1");
    for (var i = 1; i < m.length; i++) {
      _loop_1(i);
    }
    return { path, index, params };
  };
}
__name(regexpToFunction, "regexpToFunction");
__name2(regexpToFunction, "regexpToFunction");
function escapeString(str) {
  return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
}
__name(escapeString, "escapeString");
__name2(escapeString, "escapeString");
function flags(options) {
  return options && options.sensitive ? "" : "i";
}
__name(flags, "flags");
__name2(flags, "flags");
function regexpToRegexp(path, keys) {
  if (!keys)
    return path;
  var groupsRegex = /\((?:\?<(.*?)>)?(?!\?)/g;
  var index = 0;
  var execResult = groupsRegex.exec(path.source);
  while (execResult) {
    keys.push({
      // Use parenthesized substring match if available, index otherwise
      name: execResult[1] || index++,
      prefix: "",
      suffix: "",
      modifier: "",
      pattern: ""
    });
    execResult = groupsRegex.exec(path.source);
  }
  return path;
}
__name(regexpToRegexp, "regexpToRegexp");
__name2(regexpToRegexp, "regexpToRegexp");
function arrayToRegexp(paths, keys, options) {
  var parts = paths.map(function(path) {
    return pathToRegexp(path, keys, options).source;
  });
  return new RegExp("(?:".concat(parts.join("|"), ")"), flags(options));
}
__name(arrayToRegexp, "arrayToRegexp");
__name2(arrayToRegexp, "arrayToRegexp");
function stringToRegexp(path, keys, options) {
  return tokensToRegexp(parse(path, options), keys, options);
}
__name(stringToRegexp, "stringToRegexp");
__name2(stringToRegexp, "stringToRegexp");
function tokensToRegexp(tokens, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.strict, strict = _a === void 0 ? false : _a, _b = options.start, start = _b === void 0 ? true : _b, _c = options.end, end = _c === void 0 ? true : _c, _d = options.encode, encode = _d === void 0 ? function(x) {
    return x;
  } : _d, _e = options.delimiter, delimiter = _e === void 0 ? "/#?" : _e, _f = options.endsWith, endsWith = _f === void 0 ? "" : _f;
  var endsWithRe = "[".concat(escapeString(endsWith), "]|$");
  var delimiterRe = "[".concat(escapeString(delimiter), "]");
  var route = start ? "^" : "";
  for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
    var token = tokens_1[_i];
    if (typeof token === "string") {
      route += escapeString(encode(token));
    } else {
      var prefix = escapeString(encode(token.prefix));
      var suffix = escapeString(encode(token.suffix));
      if (token.pattern) {
        if (keys)
          keys.push(token);
        if (prefix || suffix) {
          if (token.modifier === "+" || token.modifier === "*") {
            var mod = token.modifier === "*" ? "?" : "";
            route += "(?:".concat(prefix, "((?:").concat(token.pattern, ")(?:").concat(suffix).concat(prefix, "(?:").concat(token.pattern, "))*)").concat(suffix, ")").concat(mod);
          } else {
            route += "(?:".concat(prefix, "(").concat(token.pattern, ")").concat(suffix, ")").concat(token.modifier);
          }
        } else {
          if (token.modifier === "+" || token.modifier === "*") {
            throw new TypeError('Can not repeat "'.concat(token.name, '" without a prefix and suffix'));
          }
          route += "(".concat(token.pattern, ")").concat(token.modifier);
        }
      } else {
        route += "(?:".concat(prefix).concat(suffix, ")").concat(token.modifier);
      }
    }
  }
  if (end) {
    if (!strict)
      route += "".concat(delimiterRe, "?");
    route += !options.endsWith ? "$" : "(?=".concat(endsWithRe, ")");
  } else {
    var endToken = tokens[tokens.length - 1];
    var isEndDelimited = typeof endToken === "string" ? delimiterRe.indexOf(endToken[endToken.length - 1]) > -1 : endToken === void 0;
    if (!strict) {
      route += "(?:".concat(delimiterRe, "(?=").concat(endsWithRe, "))?");
    }
    if (!isEndDelimited) {
      route += "(?=".concat(delimiterRe, "|").concat(endsWithRe, ")");
    }
  }
  return new RegExp(route, flags(options));
}
__name(tokensToRegexp, "tokensToRegexp");
__name2(tokensToRegexp, "tokensToRegexp");
function pathToRegexp(path, keys, options) {
  if (path instanceof RegExp)
    return regexpToRegexp(path, keys);
  if (Array.isArray(path))
    return arrayToRegexp(path, keys, options);
  return stringToRegexp(path, keys, options);
}
__name(pathToRegexp, "pathToRegexp");
__name2(pathToRegexp, "pathToRegexp");
var escapeRegex = /[.+?^${}()|[\]\\]/g;
function* executeRequest(request) {
  const requestPath = new URL(request.url).pathname;
  for (const route of [...routes].reverse()) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult) {
      for (const handler of route.middlewares.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: mountMatchResult.path
        };
      }
    }
  }
  for (const route of routes) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: true
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult && route.modules.length) {
      for (const handler of route.modules.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: matchResult.path
        };
      }
      break;
    }
  }
}
__name(executeRequest, "executeRequest");
__name2(executeRequest, "executeRequest");
var pages_template_worker_default = {
  async fetch(originalRequest, env, workerContext) {
    let request = originalRequest;
    const handlerIterator = executeRequest(request);
    let data = {};
    let isFailOpen = false;
    const next = /* @__PURE__ */ __name2(async (input, init) => {
      if (input !== void 0) {
        let url = input;
        if (typeof input === "string") {
          url = new URL(input, request.url).toString();
        }
        request = new Request(url, init);
      }
      const result = handlerIterator.next();
      if (result.done === false) {
        const { handler, params, path } = result.value;
        const context = {
          request: new Request(request.clone()),
          functionPath: path,
          next,
          params,
          get data() {
            return data;
          },
          set data(value) {
            if (typeof value !== "object" || value === null) {
              throw new Error("context.data must be an object");
            }
            data = value;
          },
          env,
          waitUntil: workerContext.waitUntil.bind(workerContext),
          passThroughOnException: /* @__PURE__ */ __name2(() => {
            isFailOpen = true;
          }, "passThroughOnException")
        };
        const response = await handler(context);
        if (!(response instanceof Response)) {
          throw new Error("Your Pages function should return a Response");
        }
        return cloneResponse(response);
      } else if ("ASSETS") {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      } else {
        const response = await fetch(request);
        return cloneResponse(response);
      }
    }, "next");
    try {
      return await next();
    } catch (error) {
      if (isFailOpen) {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      }
      throw error;
    }
  }
};
var cloneResponse = /* @__PURE__ */ __name2((response) => (
  // https://fetch.spec.whatwg.org/#null-body-status
  new Response(
    [101, 204, 205, 304].includes(response.status) ? null : response.body,
    response
  )
), "cloneResponse");
var drainBody = /* @__PURE__ */ __name2(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
__name2(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name2(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    const body = JSON.stringify(error);
    const headers = {
      "Content-Type": "application/json",
      "MF-Experimental-Error-Stack": "true"
    };
    const encoded = encodeURIComponent(body);
    if (encoded.length <= 8192) {
      headers["MF-Experimental-Error-Stack-Payload"] = encoded;
    }
    return new Response(body, { status: 500, headers });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = pages_template_worker_default;
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
__name2(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
__name2(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");
__name2(__facade_invoke__, "__facade_invoke__");
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  static {
    __name(this, "___Facade_ScheduledController__");
  }
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  scheduledTime;
  cron;
  static {
    __name2(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name2(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name2(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
__name2(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name2((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name2((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
__name2(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;

// C:/Users/Roxy Emanuel/AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/wrangler/templates/pages-dev-util.ts
function isRoutingRuleMatch(pathname, routingRule) {
  if (!pathname) {
    throw new Error("Pathname is undefined.");
  }
  if (!routingRule) {
    throw new Error("Routing rule is undefined.");
  }
  const ruleRegExp = transformRoutingRuleToRegExp(routingRule);
  return pathname.match(ruleRegExp) !== null;
}
__name(isRoutingRuleMatch, "isRoutingRuleMatch");
function transformRoutingRuleToRegExp(rule) {
  let transformedRule;
  if (rule === "/" || rule === "/*") {
    transformedRule = rule;
  } else if (rule.endsWith("/*")) {
    transformedRule = `${rule.substring(0, rule.length - 2)}(/*)?`;
  } else if (rule.endsWith("/")) {
    transformedRule = `${rule.substring(0, rule.length - 1)}(/)?`;
  } else if (rule.endsWith("*")) {
    transformedRule = rule;
  } else {
    transformedRule = `${rule}(/)?`;
  }
  transformedRule = `^${transformedRule.replaceAll(/\./g, "\\.").replaceAll(/\*/g, ".*")}$`;
  return new RegExp(transformedRule);
}
__name(transformRoutingRuleToRegExp, "transformRoutingRuleToRegExp");

// .wrangler/tmp/pages-xSHTW9/1u316sufx1r.js
var define_ROUTES_default = {
  version: 1,
  description: "Cloudflare Pages route exclusion \u2014 file statis tidak melewati Worker",
  include: [
    "/api/*",
    "/watch/*",
    "/*/watch/*",
    "/actor",
    "/actor/*",
    "/*/actor",
    "/*/actor/*",
    "/category",
    "/category/*",
    "/*/category",
    "/*/category/*",
    "/studio",
    "/studio/*",
    "/*/studio",
    "/*/studio/*",
    "/search",
    "/search/*",
    "/*/search",
    "/*/search/*",
    "/trending",
    "/*/trending",
    "/recent",
    "/*/recent",
    "/actors",
    "/*/actors",
    "/categories",
    "/*/categories",
    "/popular-actors",
    "/*/popular-actors",
    "/watch-later",
    "/*/watch-later",
    "/history",
    "/*/history",
    "/studios",
    "/*/studios",
    "/sitemap.xml",
    "/",
    "/en",
    "/en/",
    "/id",
    "/id/",
    "/ja",
    "/ja/",
    "/ko",
    "/ko/",
    "/zh-TW",
    "/zh-TW/",
    "/zh-CN",
    "/zh-CN/",
    "/th",
    "/th/",
    "/vi",
    "/vi/",
    "/ms",
    "/ms/",
    "/fil",
    "/fil/",
    "/fr",
    "/fr/",
    "/pt",
    "/pt/",
    "/de",
    "/de/"
  ],
  exclude: [
    "/assets/*",
    "/sitemaps/*",
    "/.well-known/*",
    "/robots.txt",
    "/llms.txt",
    "/ads.txt",
    "/favicon.ico",
    "/_headers",
    "/b773d20d41194391a49701f57581638e.txt"
  ]
};
var routes2 = define_ROUTES_default;
var pages_dev_pipeline_default = {
  fetch(request, env, context) {
    const { pathname } = new URL(request.url);
    for (const exclude of routes2.exclude) {
      if (isRoutingRuleMatch(pathname, exclude)) {
        return env.ASSETS.fetch(request);
      }
    }
    for (const include of routes2.include) {
      if (isRoutingRuleMatch(pathname, include)) {
        const workerAsHandler = middleware_loader_entry_default;
        if (workerAsHandler.fetch === void 0) {
          throw new TypeError("Entry point missing `fetch` handler");
        }
        return workerAsHandler.fetch(request, env, context);
      }
    }
    return env.ASSETS.fetch(request);
  }
};

// C:/Users/Roxy Emanuel/AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody2 = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default2 = drainBody2;

// C:/Users/Roxy Emanuel/AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError2(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError2(e.cause)
  };
}
__name(reduceError2, "reduceError");
var jsonError2 = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError2(e);
    const body = JSON.stringify(error);
    const headers = {
      "Content-Type": "application/json",
      "MF-Experimental-Error-Stack": "true"
    };
    const encoded = encodeURIComponent(body);
    if (encoded.length <= 8192) {
      headers["MF-Experimental-Error-Stack-Payload"] = encoded;
    }
    return new Response(body, { status: 500, headers });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default2 = jsonError2;

// .wrangler/tmp/bundle-mIkEn3/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__2 = [
  middleware_ensure_req_body_drained_default2,
  middleware_miniflare3_json_error_default2
];
var middleware_insertion_facade_default2 = pages_dev_pipeline_default;

// C:/Users/Roxy Emanuel/AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__2 = [];
function __facade_register__2(...args) {
  __facade_middleware__2.push(...args.flat());
}
__name(__facade_register__2, "__facade_register__");
function __facade_invokeChain__2(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__2(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__2, "__facade_invokeChain__");
function __facade_invoke__2(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__2(request, env, ctx, dispatch, [
    ...__facade_middleware__2,
    finalMiddleware
  ]);
}
__name(__facade_invoke__2, "__facade_invoke__");

// .wrangler/tmp/bundle-mIkEn3/middleware-loader.entry.ts
var __Facade_ScheduledController__2 = class ___Facade_ScheduledController__2 {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  scheduledTime;
  cron;
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__2)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler2(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__2 === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__2.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__2) {
    __facade_register__2(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__2(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__2(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler2, "wrapExportedHandler");
function wrapWorkerEntrypoint2(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__2 === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__2.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__2) {
    __facade_register__2(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__2(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__2(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint2, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY2;
if (typeof middleware_insertion_facade_default2 === "object") {
  WRAPPED_ENTRY2 = wrapExportedHandler2(middleware_insertion_facade_default2);
} else if (typeof middleware_insertion_facade_default2 === "function") {
  WRAPPED_ENTRY2 = wrapWorkerEntrypoint2(middleware_insertion_facade_default2);
}
var middleware_loader_entry_default2 = WRAPPED_ENTRY2;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__2 as __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default2 as default
};
//# sourceMappingURL=1u316sufx1r.js.map
