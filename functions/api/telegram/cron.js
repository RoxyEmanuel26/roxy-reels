/**
 * MISSAV-J — Automated Telegram Channel Poster (Cloudflare Pages Functions version)
 * Fetches the latest videos or a random video from the API, 
 * and automatically publishes them to a Telegram Channel.
 * Designed to be triggered externally by cron-job.org or similar services.
 */

// 13-language localized caption content and buttons
const LOCALIZATION = {
  id: {
    newTitle: 'NEW VIDEO',
    randomTitle: 'REKOMENDASI VIDEO',
    watchBtn: '🎬 TONTON SEKARANG (WATCH NOW)',
    tagline: '🍿 Nonton video streaming gratis dengan kualitas HD tanpa lemot hanya di MISSAV-J!',
    actors: 'Aktris',
    categories: 'Kategori'
  },
  'zh-TW': {
    newTitle: '最新影片',
    randomTitle: '推薦影片',
    watchBtn: '🎬 立即觀看 (WATCH NOW)',
    tagline: '🍿 在 MISSAV-J 免費觀看無卡頓的高清串流影片！',
    actors: '女優',
    categories: '分類'
  },
  'zh-CN': {
    newTitle: '最新视频',
    randomTitle: '推荐视频',
    watchBtn: '🎬 立即观看 (WATCH NOW)',
    tagline: '🍿 在 MISSAV-J 免费观看无卡顿的高清串流视频！',
    actors: '女优',
    categories: '分类'
  },
  en: {
    newTitle: 'NEW VIDEO',
    randomTitle: 'RECOMMENDED',
    watchBtn: '🎬 WATCH NOW',
    tagline: '🍿 Watch free video streaming in HD quality without buffering only on MISSAV-J!',
    actors: 'Actresses',
    categories: 'Categories'
  },
  ja: {
    newTitle: '新着動画',
    randomTitle: 'おすすめ動画',
    watchBtn: '🎬 今すぐ視聴 (WATCH NOW)',
    tagline: '🍿 MISSAV-Jでバッファリングなしの超高画質ストリーミング動画を無料視聴しよう！',
    actors: '女優',
    categories: 'カテゴリー'
  },
  ko: {
    newTitle: '최신 비디오',
    randomTitle: '추천 비디오',
    watchBtn: '🎬 지금 시청하기 (WATCH NOW)',
    tagline: '🍿 오직 MISSAV-J에서 버퍼링 없이 고화질 HD 무료 비디오 스트리밍을 즐겨보세요!',
    actors: '여배우',
    categories: '카테고리'
  },
  ms: {
    newTitle: 'VIDEO BARU',
    randomTitle: 'REKOMENDASI VIDEO',
    watchBtn: '🎬 TONTON SEKARANG (WATCH NOW)',
    tagline: '🍿 Tonton video streaming percuma dengan kualiti HD tanpa buffering hanya di MISSAV-J!',
    actors: 'Aktris',
    categories: 'Kategori'
  },
  th: {
    newTitle: 'วิดีโอใหม่',
    randomTitle: 'วิดีโอแนะนำ',
    watchBtn: '🎬 รับชมตอนนี้ (WATCH NOW)',
    tagline: '🍿 รับชมวิดีโอสตรีมมิ่งฟรีคุณภาพสูงระดับ HD แบบไม่กระตุกที่ MISSAV-J เท่านั้น!',
    actors: 'นักแสดงหญิง',
    categories: 'หมวดหมู่'
  },
  de: {
    newTitle: 'NEUES VIDEO',
    randomTitle: 'EMPFEHLUNG',
    watchBtn: '🎬 JETZT ANSEHEN (WATCH NOW)',
    tagline: '🍿 Kostenloses Videostreaming in HD-Qualität ohne Ruckeln nur auf MISSAV-J!',
    actors: 'Schauspielerinnen',
    categories: 'Kategorien'
  },
  fr: {
    newTitle: 'NOUVELLE VIDÉO',
    randomTitle: 'RECOMMANDÉ',
    watchBtn: '🎬 REGARDER MAINTENANT (WATCH NOW)',
    tagline: '🍿 Regardez du streaming vidéo gratuit en qualité HD sans ralentissement uniquement sur MISSAV-J!',
    actors: 'Actrices',
    categories: 'Catégories'
  },
  vi: {
    newTitle: 'VIDEO MỚI',
    randomTitle: 'GỢI Ý VIDEO',
    watchBtn: '🎬 XEM NGAY (WATCH NOW)',
    tagline: '🍿 Xem video phát trực tuyến miễn phí chất lượng HD không giật lag chỉ có tại MISSAV-J!',
    actors: 'Diễn viên',
    categories: 'Danh mục'
  },
  fil: {
    newTitle: 'BAGONG VIDEO',
    randomTitle: 'INIREREKOMENDA',
    watchBtn: '🎬 PANOORIN NGAYON (WATCH NOW)',
    tagline: '🍿 Manood ng libreng video streaming na may HD quality nang walang buffer sa MISSAV-J lang!',
    actors: 'Mga Aktris',
    categories: 'Mga Kategorya'
  },
  pt: {
    newTitle: 'NOVO VÍDEO',
    randomTitle: 'RECOMENDADO',
    watchBtn: '🎬 ASSISTIR AGORA (WATCH NOW)',
    tagline: '🍿 Assista a streaming de vídeo gratuito em qualidade HD sem travamentos apenas no MISSAV-J!',
    actors: 'Atrizes',
    categories: 'Categorias'
  }
};

// Fetch translation record from Supabase
async function getTranslationFromDb(supabaseUrl, supabaseKey, id) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/translations?id=eq.${id}&select=translations`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      },
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (!res.ok) return null;
    const data = await res.json();
    return data && data[0] ? data[0].translations : null;
  } catch (e) {
    clearTimeout(timeoutId);
    console.error('Supabase get error:', e);
    return null;
  }
}

// Save translation record to Supabase
async function saveTranslationToDb(supabaseUrl, supabaseKey, id, translations) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);
  try {
    await fetch(`${supabaseUrl}/rest/v1/translations`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify({ id, translations }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);
  } catch (e) {
    clearTimeout(timeoutId);
    console.error('Supabase save error:', e);
  }
}

// Escape Markdown characters for Telegram caption
function escapeMarkdown(text) {
  if (!text) return '';
  return text
    .replace(/_/g, '\\_')
    .replace(/\*/g, '\\*')
    .replace(/\[/g, '\\[')
    .replace(/`/g, '\\`');
}

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  // Extract env variables from Cloudflare context
  const SUPABASE_URL = env.SUPABASE_URL;
  const SUPABASE_KEY = env.SUPABASE_KEY;
  const TELEGRAM_BOT_TOKEN = env.TELEGRAM_BOT_TOKEN;
  const TELEGRAM_CHAT_ID = env.TELEGRAM_CHAT_ID;
  const CRON_SECRET = env.CRON_SECRET || 'missav_telegram_secret_key_123';

  // 1. Verify cron trigger security
  const authHeader = request.headers.get('authorization');
  const queryKey = url.searchParams.get('key');
  
  if (
    authHeader !== `Bearer ${CRON_SECRET}` && 
    queryKey !== CRON_SECRET
  ) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // 2. Validate Environment Variables
  if (!SUPABASE_URL || !SUPABASE_KEY || !TELEGRAM_BOT_TOKEN) {
    return new Response(JSON.stringify({ 
      error: 'Missing configuration', 
      details: {
        supabase: !SUPABASE_URL || !SUPABASE_KEY,
        telegram: !TELEGRAM_BOT_TOKEN
      }
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Check chat_id from query parameter first, fallback to env variable
  const chatId = url.searchParams.get('chat_id') || TELEGRAM_CHAT_ID;
  if (!chatId) {
    return new Response(JSON.stringify({ error: 'Missing chat_id parameter or environment variable' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Check language and type from query parameters
  const lang = url.searchParams.get('lang') || 'id';
  const type = url.searchParams.get('type') || 'new'; // Options: 'new' (default) or 'random'

  try {
    const baseUrl = url.origin;
    let posts = [];
    
    if (type === 'random') {
      // Get the total number of posts first by calling api/posts for 1 post
      const preUrl = `${baseUrl}/api/posts?per_page=1&lang=${lang}`;
      const preController = new AbortController();
      const preTimeoutId = setTimeout(() => preController.abort(), 8000);
      let preRes;
      try {
        preRes = await fetch(preUrl, {
          headers: {
            'Accept': 'application/json',
            'X-Client-Site': baseUrl
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
        totalPosts = parseInt(preRes.headers.get('X-WP-Total') || '100', 10);
      }
      
      // Select a random page index
      const randomPage = Math.floor(Math.random() * totalPosts) + 1;
      
      // Fetch the single random post
      const randomUrl = `${baseUrl}/api/posts?per_page=1&page=${randomPage}&lang=${lang}`;
      const randController = new AbortController();
      const randTimeoutId = setTimeout(() => randController.abort(), 8000);
      let randomRes;
      try {
        randomRes = await fetch(randomUrl, {
          headers: {
            'Accept': 'application/json',
            'X-Client-Site': baseUrl
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
      // Default: Fetch latest 5 posts in the requested language
      const apiUrl = `${baseUrl}/api/posts?per_page=5&lang=${lang}`;
      const apiController = new AbortController();
      const apiTimeoutId = setTimeout(() => apiController.abort(), 8000);
      let apiRes;
      try {
        apiRes = await fetch(apiUrl, {
          headers: {
            'Accept': 'application/json',
            'X-Client-Site': baseUrl
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
      return new Response(JSON.stringify({ message: 'No posts found to process' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const results = [];

    // Process posts in chronological order (oldest first to post in order)
    const reversedPosts = type === 'random' ? posts : [...posts].reverse();

    // Get localization strings for the target language (default to 'en' then 'id')
    const loc = LOCALIZATION[lang] || LOCALIZATION['en'] || LOCALIZATION['id'];

    for (const post of reversedPosts) {
      const id = post.id;
      let translations = await getTranslationFromDb(SUPABASE_URL, SUPABASE_KEY, id);
      
      if (!translations) {
        translations = {};
      }

      // Check duplicate posting ONLY for 'new' video postings (not for random recommendations)
      let postedMap = {};
      if (type === 'new') {
        if (typeof translations.telegram_posted === 'boolean') {
          postedMap = { id: translations.telegram_posted };
        } else if (typeof translations.telegram_posted === 'object' && translations.telegram_posted !== null) {
          postedMap = translations.telegram_posted;
        }

        if (postedMap[lang]) {
          results.push({ id, status: 'skipped', reason: `already posted for lang: ${lang}` });
          continue;
        }
      }

      // Prepare Telegram content
      const code = post.code || 'JAV';
      const title = post.title || '';
      
      // Clean tags & categories into a hashtag string (limit to 3 hashtags)
      const hashtags = ['#JAV', `#${code.replace(/[^a-zA-Z0-9]/g, '')}`];
      if (post.actors && post.actors.length > 0) {
        const primaryActor = Array.isArray(post.actors) ? post.actors[0] : post.actors;
        hashtags.push(`#${primaryActor.replace(/[\s\-_]+/g, '')}`);
      }

      // Determine label based on type
      const label = type === 'random' ? loc.randomTitle : loc.newTitle;
      const icon = type === 'random' ? '🎲' : '🔥';

      const captionText = 
`${icon} *[${label} — ${escapeMarkdown(code)}] ${escapeMarkdown(title)}*

${loc.tagline}

📢 *${loc.actors}*: ${escapeMarkdown(Array.isArray(post.actors) ? post.actors.join(', ') : (post.actors || '-'))}
🏷️ *${loc.categories}*: ${escapeMarkdown(Array.isArray(post.categories) ? post.categories.slice(0, 5).join(', ') : (post.categories || '-'))}

${hashtags.join(' ')}`;

      // Construct watch link using clean routing structure and active language
      let slug = '';
      if (post.localized_slugs && post.localized_slugs[lang]) {
        slug = post.localized_slugs[lang];
      } else if (post.code && post.title) {
        const cleanCode = post.code.toLowerCase().trim().replace(/[\s\-_]+/g, '-').replace(/[^a-z0-9\-]/g, '');
        const cleanTitle = post.title.toLowerCase().trim().replace(/[\s\-_]+/g, '-').replace(/[^a-z0-9\-]/g, '');
        slug = `${cleanCode}-${cleanTitle}`;
      }
      
      const watchUrl = slug 
        ? `${baseUrl}/${lang}/watch/${slug}-${id}`
        : `${baseUrl}/${lang}/watch/${id}`;

      // Send to Telegram using sendPhoto endpoint
      let telegramSuccess = false;
      const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`;
      
      try {
        const payload = {
          chat_id: chatId,
          photo: post.thumbnail || 'https://www.missav-j.web.id/assets/images/logo.png',
          caption: captionText,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [
                { text: loc.watchBtn, url: watchUrl }
              ]
            ]
          }
        };

        const tgController = new AbortController();
        const tgTimeoutId = setTimeout(() => tgController.abort(), 8000);

        const tgRes = await fetch(telegramUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
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
        if (type === 'new') {
          // Update Supabase to prevent duplicate postings for this specific language
          postedMap[lang] = true;
          translations.telegram_posted = postedMap;
          await saveTranslationToDb(SUPABASE_URL, SUPABASE_KEY, id, translations);
        }
        results.push({ id, status: 'posted', code });
      } else {
        results.push({ id, status: 'failed', reason: 'telegram send failed' });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      processed: results
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[Telegram Cron Error]', error);
    return new Response(JSON.stringify({
      error: 'Internal Cron Error',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
