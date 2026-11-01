/**
 * MISSAV-J — Automated Twitter / X Content Syndication & Teaser Poster
 * 
 * Features:
 * 1. Native zero-dependency OAuth 1.0a HMAC-SHA1 signer for Twitter API v2.
 * 2. Selects latest enriched videos from data/seo-enriched-posts.json or APIJAV feed.
 * 3. Idempotent tracking via data/twitter-history.json (prevents duplicate tweets).
 * 4. Automatic smart truncation ensuring compliance with Twitter's 280-character limit.
 * 5. Generates high-CTR teaser tweets linking to canonical watch URLs with OpenGraph preview cards.
 * 6. Supports --dry-run, --limit=N, and --id=XYZ for flexible manual or CI testing.
 * 
 * Usage:
 *   node scripts/twitter-poster.mjs --dry-run
 *   node scripts/twitter-poster.mjs --limit=1
 *   npm run twitter:post
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

// Load local .env if present
if (fs.existsSync('.env')) {
  const envContent = fs.readFileSync('.env', 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const [key, ...parts] = trimmed.split('=');
    if (key && parts.length > 0 && !process.env[key.trim()]) {
      process.env[key.trim()] = parts.join('=').trim().replace(/^["']|["']$/g, '');
    }
  }
}

const HISTORY_FILE = path.resolve('data/twitter-history.json');
const ENRICHED_FILE = path.resolve('data/seo-enriched-posts.json');

const TWITTER_API_KEY = process.env.TWITTER_API_KEY || '';
const TWITTER_API_SECRET = process.env.TWITTER_API_SECRET || '';
const TWITTER_ACCESS_TOKEN = process.env.TWITTER_ACCESS_TOKEN || '';
const TWITTER_ACCESS_SECRET = process.env.TWITTER_ACCESS_SECRET || '';

// Parse CLI flags
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const isForce = args.includes('--force');
const limitArg = args.find(a => a.startsWith('--limit='));
const maxTweets = limitArg ? parseInt(limitArg.split('=')[1], 10) : 1;
const targetIdArg = args.find(a => a.startsWith('--id='));
const targetId = targetIdArg ? targetIdArg.split('=')[1] : null;

/**
 * Standard RFC 3986 percent encoding for OAuth 1.0a
 */
export function percentEncode(str) {
  return encodeURIComponent(String(str || ''))
    .replace(/!/g, '%21')
    .replace(/'/g, '%27')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29')
    .replace(/\*/g, '%2A');
}

/**
 * Generate OAuth 1.0a Authorization header for HTTP request
 */
export function generateOAuthHeader({ method, url, consumerKey, consumerSecret, token, tokenSecret }) {
  const oauthParams = {
    oauth_consumer_key: consumerKey,
    oauth_nonce: crypto.randomBytes(16).toString('hex'),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: token,
    oauth_version: '1.0'
  };

  const sortedKeys = Object.keys(oauthParams).sort();
  const paramString = sortedKeys
    .map(key => `${percentEncode(key)}=${percentEncode(oauthParams[key])}`)
    .join('&');

  const baseString = `${method.toUpperCase()}&${percentEncode(url)}&${percentEncode(paramString)}`;
  const signingKey = `${percentEncode(consumerSecret)}&${percentEncode(tokenSecret)}`;

  const signature = crypto
    .createHmac('sha1', signingKey)
    .update(baseString)
    .digest('base64');

  oauthParams.oauth_signature = signature;

  return 'OAuth ' + Object.keys(oauthParams)
    .sort()
    .map(key => `${percentEncode(key)}="${percentEncode(oauthParams[key])}"`)
    .join(', ');
}

/**
 * Slugify helper matching functions/[[catchall]].js
 */
function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/[^\p{L}\p{N}-]/gu, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Compute canonical watch path for a video
 */
export function buildWatchUrl(post, id) {
  const code = slugify(post.code);
  let base = slugify(post.slug || post.title) || 'video';
  if (code && base !== code && !base.startsWith(`${code}-`)) {
    base = `${code}-${base}`;
  }
  base = base.slice(0, 100).replace(/-+$/g, '') || 'video';
  return `https://www.missav-j.com/en/watch/${encodeURIComponent(`${base}-${id}`)}`;
}

/**
 * Load history of already tweeted posts
 */
function loadHistory() {
  if (fs.existsSync(HISTORY_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
    } catch (e) {
      console.warn('[Twitter Warning] Corrupt history, resetting:', e.message);
    }
  }
  return { _meta: { last_tweeted_at: null, total_tweets: 0 }, tweets: [] };
}

/**
 * Save history of tweeted posts
 */
function saveHistory(history) {
  history._meta.total_tweets = history.tweets.length;
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2), 'utf8');
}

/**
 * Craft an engaging, compliant teaser tweet
 * Twitter counts all URLs as 23 characters (t.co), leaving 257 chars for text.
 */
export function craftTweetText(post, enriched = null) {
  let code = (post.code || (enriched?.tags?.[4]) || (enriched?.tags?.[2]) || (enriched?.tags?.[0]) || '').trim();
  let title = (enriched?.seo_title || post.title || '').trim();
  const studio = post.studio || (enriched?.tags?.[1]) || '';
  const performers = (post.actors || post.actresses || []).filter(Boolean);
  const watchUrl = buildWatchUrl(post, post.id || enriched?.video_id);

  // If code is long like "IPX-552-ENGLISH-SUBTITLE", extract core code
  const codeMatch = code.match(/^([a-zA-Z]+[-_]\d+)/i);
  const displayCode = codeMatch ? codeMatch[1].toUpperCase() : code;

  // Clean title so code or brand suffix is not repeated
  title = title.replace(/\s*[-—|]\s*MISSAV-J/gi, '').trim();
  if (displayCode && title.toUpperCase().startsWith(displayCode)) {
    title = title.slice(displayCode.length).replace(/^[\s:_\-—|]+/, '').trim();
  }
  if (code && title.toUpperCase().startsWith(code.toUpperCase())) {
    title = title.slice(code.length).replace(/^[\s:_\-—|]+/, '').trim();
  }

  // Fallback if title is too short or empty
  if (title.length < 5) {
    if (performers.length > 0 && studio) {
      title = `${performers[0]} in ${studio} Showcase`;
    } else if (performers.length > 0) {
      title = `${performers[0]} New Feature`;
    } else if (post.title) {
      title = post.title.replace(/^[\s:_\-—|]+/, '').trim();
    } else {
      title = 'Featured Japanese Film';
    }
  }

  // Hashtags
  const hashtags = new Set(['#JavStreaming', '#MissAV']);
  if (displayCode) {
    const cleanCode = displayCode.replace(/[^a-zA-Z0-9]/g, '');
    if (cleanCode) hashtags.add(`#${cleanCode}`);
  }
  if (performers.length > 0) {
    const firstActress = performers[0].replace(/[^a-zA-Z0-9]/g, '');
    if (firstActress) hashtags.add(`#${firstActress}`);
  }
  const hashtagLine = Array.from(hashtags).join(' ');

  // Performer / Studio line
  let performerLine = '';
  if (performers.length > 0) {
    performerLine = `🌟 Starring: ${performers.slice(0, 2).join(', ')}\n`;
  } else if (studio) {
    performerLine = `🏢 Studio: ${studio}\n`;
  }

  // Construct header with remaining character limit calculation
  // Twitter: 280 max, URL = 23 chars
  const baseHeader = displayCode ? `🎬 [${displayCode}] ` : '🎬 ';
  const reservedChars = 23 + baseHeader.length + performerLine.length + 35 + hashtagLine.length;
  const maxTitleLength = Math.max(30, 280 - reservedChars);

  let cleanTitle = title;
  if (cleanTitle.length > maxTitleLength) {
    cleanTitle = cleanTitle.slice(0, maxTitleLength - 3).trim() + '...';
  }

  const finalHeader = baseHeader + cleanTitle;
  const tweet = `${finalHeader}\n${performerLine}\n▶️ Watch Full HD on MISSAV-J:\n${watchUrl}\n\n${hashtagLine}`.trim();
  return tweet;
}

/**
 * Post tweet via Twitter API v2
 */
async function postTweetV2(tweetText) {
  const url = 'https://api.twitter.com/2/tweets';
  const method = 'POST';

  const authHeader = generateOAuthHeader({
    method,
    url,
    consumerKey: TWITTER_API_KEY,
    consumerSecret: TWITTER_API_SECRET,
    token: TWITTER_ACCESS_TOKEN,
    tokenSecret: TWITTER_ACCESS_SECRET
  });

  const response = await fetch(url, {
    method,
    headers: {
      'Authorization': authHeader,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ text: tweetText })
  });

  const bodyText = await response.text();
  let json;
  try {
    json = JSON.parse(bodyText);
  } catch {
    json = { raw: bodyText };
  }

  if (!response.ok) {
    throw new Error(`Twitter API HTTP ${response.status}: ${JSON.stringify(json)}`);
  }

  return json;
}

/**
 * Main pipeline runner
 */
export async function runTwitterPoster() {
  console.log('=== MISSAV-J Twitter / X Content Syndication Pipeline ===');

  const history = loadHistory();
  const tweetedIds = new Set(history.tweets.map(t => String(t.video_id)));

  // Check credentials
  const hasCredentials = TWITTER_API_KEY && TWITTER_API_SECRET && TWITTER_ACCESS_TOKEN && TWITTER_ACCESS_SECRET;
  if (!hasCredentials && !isDryRun) {
    console.warn('⚠️ [Twitter Poster] Missing Twitter API credentials. Set TWITTER_API_KEY, TWITTER_API_SECRET, TWITTER_ACCESS_TOKEN, TWITTER_ACCESS_SECRET in environment.');
    console.log('Skipping tweet posting cleanly (soft exit).');
    return { success: false, reason: 'missing_credentials' };
  }

  // Load enriched posts if available
  let enrichedMap = {};
  if (fs.existsSync(ENRICHED_FILE)) {
    try {
      const enrichedDb = JSON.parse(fs.readFileSync(ENRICHED_FILE, 'utf8'));
      if (enrichedDb && enrichedDb.posts) {
        enrichedMap = enrichedDb.posts;
      }
    } catch (e) {
      console.warn('[Twitter Poster] Could not load enriched db:', e.message);
    }
  }

  // Fetch latest candidate posts from live APIJAV feed
  let candidates = [];
  try {
    const res = await fetch('https://server.apijav.com/wp-json/myvideo/v1/posts?per_page=30&orderby=views');
    if (res.ok) {
      candidates = await res.json();
    }
  } catch (e) {
    console.warn('[Twitter Poster] Failed to fetch live APIJAV posts:', e.message);
  }

  // Merge enriched posts that aren't in candidates
  for (const [vId, enrichedItem] of Object.entries(enrichedMap)) {
    if (enrichedItem.status === 'enriched') {
      const exists = candidates.some(c => String(c.id) === String(vId));
      if (!exists) {
        candidates.push({
          id: vId,
          code: enrichedItem.tags?.[4] || enrichedItem.tags?.[0] || 'JAV',
          title: enrichedItem.seo_title || enrichedItem.summary,
          studio: enrichedItem.tags?.[1] || '',
          actors: [enrichedItem.tags?.[0]].filter(Boolean)
        });
      }
    }
  }

  if (candidates.length === 0) {
    console.log('No candidate videos available to tweet.');
    return { success: true, count: 0 };
  }

  // Filter candidates
  let queue = candidates;
  if (targetId) {
    queue = candidates.filter(c => String(c.id) === String(targetId));
  } else if (!isForce) {
    queue = candidates.filter(c => !tweetedIds.has(String(c.id)));
  }

  console.log(`Available candidates: ${candidates.length} | Queue after filtering tweeted items: ${queue.length}`);

  if (queue.length === 0) {
    console.log('✅ All candidate videos have already been tweeted. No new posts needed.');
    return { success: true, count: 0 };
  }

  const toTweet = queue.slice(0, maxTweets);
  let tweetedCount = 0;

  for (const post of toTweet) {
    const vId = String(post.id);
    const enriched = enrichedMap[vId] || null;
    const tweetText = craftTweetText(post, enriched);

    console.log(`\n--- [Prepared Tweet for Video #${vId}] ---`);
    console.log(tweetText);
    console.log(`Character count (with 23-char t.co URL): ${tweetText.length - buildWatchUrl(post, vId).length + 23}/280`);

    if (isDryRun) {
      console.log('ℹ️ [DRY RUN] Tweet not sent (dry-run mode).');
      tweetedCount++;
    } else {
      try {
        const result = await postTweetV2(tweetText);
        const tweetId = result?.data?.id || 'unknown';
        console.log(`🚀 [SUCCESS] Tweet posted successfully! Tweet ID: ${tweetId}`);

        history.tweets.push({
          video_id: vId,
          code: post.code || '',
          tweet_id: tweetId,
          tweeted_at: new Date().toISOString()
        });
        history._meta.last_tweeted_at = new Date().toISOString();
        saveHistory(history);
        tweetedCount++;
      } catch (err) {
        console.error(`❌ [Twitter Error] Failed to post tweet for #${vId}:`, err.message);
      }
    }
  }

  console.log(`\nSyndication run completed. Total tweets processed: ${tweetedCount}`);
  return { success: true, count: tweetedCount };
}

// Auto-run if executed directly
if (process.argv[1] && process.argv[1].endsWith('twitter-poster.mjs')) {
  runTwitterPoster().catch(err => {
    console.error('Fatal twitter poster error:', err);
    process.exit(1);
  });
}
