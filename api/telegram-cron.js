/**
 * MISSAV-J — Automated Telegram Channel Poster (Cron Job)
 * Fetches the latest videos from the API, checks if they have already been posted 
 * (using Supabase to track state), and automatically publishes them to a Telegram Channel.
 */

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const CRON_SECRET = process.env.CRON_SECRET || 'missav_telegram_secret_key_123';

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
  if (!SUPABASE_URL || !SUPABASE_KEY || !TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    return res.status(500).json({ 
      error: 'Missing configuration', 
      details: {
        supabase: !SUPABASE_URL || !SUPABASE_KEY,
        telegram: !TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID
      }
    });
  }

  try {
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers.host;
    
    // Fetch latest 5 posts in Indonesian (default channel language target or English fallback)
    const apiUrl = `${protocol}://${host}/api/posts?per_page=5&lang=id`;
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

    for (const post of reversedPosts) {
      const id = post.id;
      let translations = await getTranslationFromDb(id);
      
      if (!translations) {
        translations = {};
      }

      // Check if already posted
      if (translations.telegram_posted) {
        results.push({ id, status: 'skipped', reason: 'already posted' });
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

🍿 Nonton video streaming gratis dengan kualitas HD tanpa lemot hanya di MISSAV-J!

📢 *Aktris*: ${escapeMarkdown(Array.isArray(post.actors) ? post.actors.join(', ') : (post.actors || '-'))}
🏷️ *Kategori*: ${escapeMarkdown(Array.isArray(post.categories) ? post.categories.slice(0, 5).join(', ') : (post.categories || '-'))}

${hashtags.join(' ')}`;

      // Construct watch link using clean routing structure
      let slug = '';
      if (post.code && post.title) {
        const cleanCode = post.code.toLowerCase().trim().replace(/[\s\-_]+/g, '-').replace(/[^a-z0-9\-]/g, '');
        const cleanTitle = post.title.toLowerCase().trim().replace(/[\s\-_]+/g, '-').replace(/[^a-z0-9\-]/g, '');
        slug = `${cleanCode}-${cleanTitle}`;
      }
      
      const watchUrl = slug 
        ? `${protocol}://${host}/id/watch/${slug}-${id}`
        : `${protocol}://${host}/id/watch/${id}`;

      // Send to Telegram using sendPhoto endpoint
      let telegramSuccess = false;
      const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`;
      
      try {
        const payload = {
          chat_id: TELEGRAM_CHAT_ID,
          photo: post.thumbnail || 'https://www.missav-j.web.id/assets/images/logo.png',
          caption: captionText,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [
                { text: '🎬 TONTON SEKARANG (WATCH NOW)', url: watchUrl }
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
        // Update Supabase to prevent duplicate postings
        translations.telegram_posted = true;
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
