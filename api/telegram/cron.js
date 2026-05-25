/**
 * MISSAV-J — Automated Telegram Channel Poster (Cron Job)
 * Fetches the latest videos from the API, checks if they have already been posted 
 * (using Supabase to track state), and automatically publishes them to a Telegram Channel.
 * Designed to be triggered externally by cron-job.org or similar services.
 */

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const CRON_SECRET = process.env.CRON_SECRET || 'missav_telegram_secret_key_123';

// 13-language localized caption content and buttons
const LOCALIZATION = {
  id: {
    watchBtn: '🎬 TONTON SEKARANG (WATCH NOW)',
    tagline: '🍿 Nonton video streaming gratis dengan kualitas HD tanpa lemot hanya di MISSAV-J!',
    actors: 'Aktris',
    categories: 'Kategori'
  },
  'zh-TW': {
    watchBtn: '🎬 立即觀看 (WATCH NOW)',
    tagline: '🍿 在 MISSAV-J 免費觀看無卡頓的高清串流影片！',
    actors: '女優',
    categories: '分類'
  },
  'zh-CN': {
    watchBtn: '🎬 立即观看 (WATCH NOW)',
    tagline: '🍿 在 MISSAV-J 免费观看无卡顿的高清串流视频！',
    actors: '女优',
    categories: '分类'
  },
  en: {
    watchBtn: '🎬 WATCH NOW',
    tagline: '🍿 Watch free video streaming in HD quality without buffering only on MISSAV-J!',
    actors: 'Actresses',
    categories: 'Categories'
  },
  ja: {
    watchBtn: '🎬 今すぐ視聴 (WATCH NOW)',
    tagline: '🍿 MISSAV-Jでバッファリングなしの超高画質ストリーミング動画を無料視聴しよう！',
    actors: '女優',
    categories: 'カテゴリー'
  },
  ko: {
    watchBtn: '🎬 지금 시청하기 (WATCH NOW)',
    tagline: '🍿 오직 MISSAV-J에서 버퍼링 없이 고화질 HD 무료 비디오 스트리밍을 즐겨보세요!',
    actors: '여배우',
    categories: '카테고리'
  },
  ms: {
    watchBtn: '🎬 TONTON SEKARANG (WATCH NOW)',
    tagline: '🍿 Tonton video streaming percuma dengan kualiti HD tanpa buffering hanya di MISSAV-J!',
    actors: 'Aktris',
    categories: 'Kategori'
  },
  th: {
    watchBtn: '🎬 รับชมตอนนี้ (WATCH NOW)',
    tagline: '🍿 รับชมวิดีโอสตรีมมิ่งฟรีคุณภาพสูงระดับ HD แบบไม่กระตุกที่ MISSAV-J เท่านั้น!',
    actors: 'นักแสดงหญิง',
    categories: 'หมวดหมู่'
  },
  de: {
    watchBtn: '🎬 JETZT ANSEHEN (WATCH NOW)',
    tagline: '🍿 Kostenloses Videostreaming in HD-Qualität ohne Ruckeln nur auf MISSAV-J!',
    actors: 'Schauspielerinnen',
    categories: 'Kategorien'
  },
  fr: {
    watchBtn: '🎬 REGARDER MAINTENANT (WATCH NOW)',
    tagline: '🍿 Regardez du streaming vidéo gratuit en qualité HD sans ralentissement uniquement sur MISSAV-J!',
    actors: 'Actrices',
    categories: 'Catégories'
  },
  vi: {
    watchBtn: '🎬 XEM NGAY (WATCH NOW)',
    tagline: '🍿 Xem video phát trực tuyến miễn phí chất lượng HD không giật lag chỉ có tại MISSAV-J!',
    actors: 'Diễn viên',
    categories: 'Danh mục'
  },
  fil: {
    watchBtn: '🎬 PANOORIN NGAYON (WATCH NOW)',
    tagline: '🍿 Manood ng libreng video streaming na may HD quality nang walang buffer sa MISSAV-J lang!',
    actors: 'Mga Aktris',
    categories: 'Mga Kategorya'
  },
  pt: {
    watchBtn: '🎬 ASSISTIR AGORA (WATCH NOW)',
    tagline: '🍿 Assista a streaming de vídeo gratuito em qualidade HD sem travamentos apenas no MISSAV-J!',
    actors: 'Atrizes',
    categories: 'Categorias'
  }
};

// Fetch translation record from Supabase
async function getTranslationFromDb(id) {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/translations?id=eq.${id}&select=translations`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data && data[0] ? data[0].translations : null;
  } catch (e) {
    console.error('Supabase get error:', e);
    return null;
  }
}

// Save translation record to Supabase
async function saveTranslationToDb(id, translations) {
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/translations`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify({ id, translations })
    });
  } catch (e) {
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

module.exports = async (req, res) => {
  // 1. Verify cron trigger security
  const authHeader = req.headers.authorization;
  const queryKey = req.query.key;
  
  // Accept Vercel's Cron Authorization header or a secret query parameter key
  if (
    authHeader !== `Bearer ${process.env.CRON_SECRET}` && 
    queryKey !== CRON_SECRET
  ) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // 2. Validate Environment Variables
  if (!SUPABASE_URL || !SUPABASE_KEY || !TELEGRAM_BOT_TOKEN) {
    return res.status(500).json({ 
      error: 'Missing configuration', 
      details: {
        supabase: !SUPABASE_URL || !SUPABASE_KEY,
        telegram: !TELEGRAM_BOT_TOKEN
      }
    });
  }

  // Check chat_id from query parameter first, fallback to env variable
  const chatId = req.query.chat_id || TELEGRAM_CHAT_ID;
  if (!chatId) {
    return res.status(400).json({ error: 'Missing chat_id parameter or environment variable' });
  }

  // Check language from query parameter, default to 'id'
  const lang = req.query.lang || 'id';

  try {
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers.host;
    
    // Fetch latest 5 posts in the requested language
    const apiUrl = `${protocol}://${host}/api/posts?per_page=5&lang=${lang}`;
    const apiRes = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/json',
        'X-Client-Site': `${protocol}://${host}`
      }
    });

    if (!apiRes.ok) {
      throw new Error(`Failed to fetch posts: ${apiRes.status}`);
    }

    const posts = await apiRes.json();
    if (!posts || !Array.isArray(posts)) {
      return res.status(200).json({ message: 'No posts found to process' });
    }

    const results = [];

    // Process posts in chronological order (oldest first to post in order)
    const reversedPosts = [...posts].reverse();

    // Get localization strings for the target language (default to 'en' then 'id')
    const loc = LOCALIZATION[lang] || LOCALIZATION['en'] || LOCALIZATION['id'];

    for (const post of reversedPosts) {
      const id = post.id;
      let translations = await getTranslationFromDb(id);
      
      if (!translations) {
        translations = {};
      }

      // Handle backwards compatibility and multi-language posting status
      let postedMap = {};
      if (typeof translations.telegram_posted === 'boolean') {
        // Legacy: if it was true, we treat it as posted in the default 'id' language
        postedMap = { id: translations.telegram_posted };
      } else if (typeof translations.telegram_posted === 'object' && translations.telegram_posted !== null) {
        postedMap = translations.telegram_posted;
      }

      // Check if already posted for the specific requested language
      if (postedMap[lang]) {
        results.push({ id, status: 'skipped', reason: `already posted for lang: ${lang}` });
        continue;
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

      const captionText = 
`🔥 *[${escapeMarkdown(code)}] ${escapeMarkdown(title)}*

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
        ? `${protocol}://${host}/${lang}/watch/${slug}-${id}`
        : `${protocol}://${host}/${lang}/watch/${id}`;

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

        const tgRes = await fetch(telegramUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

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
        // Update Supabase to prevent duplicate postings for this specific language
        postedMap[lang] = true;
        translations.telegram_posted = postedMap;
        await saveTranslationToDb(id, translations);
        results.push({ id, status: 'posted', code });
      } else {
        results.push({ id, status: 'failed', reason: 'telegram send failed' });
      }
    }

    return res.status(200).json({
      success: true,
      processed: results
    });

  } catch (error) {
    console.error('[Telegram Cron Error]', error);
    return res.status(500).json({
      error: 'Internal Cron Error',
      message: error.message
    });
  }
};
