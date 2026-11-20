/**
 * MISSAV-J — Client Taxonomy Indexability Registry
 * Mirrors the Worker's curated indexability rules using static Worker-excluded JSON
 * (/api/actors.json and /api/categories.json) so thin taxonomy chips (< 5 releases)
 * stay clickable for humans without exposing <a href> crawl traps to search bots.
 */

import ui from './ui.js?v=2.8.106';

const ENGLISH_SPECIFIC_CATEGORIES = new Set([
  'jav english sub',
  'english subtitle',
  'english sub'
]);

const CATEGORY_ALIASES = {
  'tokyo hot': 'Tokyohot',
  'en/tokyohot': 'Tokyohot',
  'en/fc2': 'Fc2',
  'dm150/en/fc2': 'Fc2',
  'en/caribbeancom': 'Caribbeancom',
  'en/madou': 'Madou',
  'en/english subtitle': 'English Subtitle',
  'en/uncensored leak': 'Uncensored leak',
  'en/xxxav': 'Xxxav',
  'dm29/en/xxxav': 'Xxxav',
  'en/naughty4610': 'Naughty4610',
  'blonde / blonde': 'Blonde'
};

let actorSet = null;
let categorySet = null;
let canonicalCategoryMap = new Map();
let loadPromise = null;

function decodeBasicEntities(value) {
  if (!value) return '';
  return String(value)
    .replace(/&amp;/g, '&')
    .replace(/&#0?38;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?34;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/gi, ' ')
    .trim();
}

export function resolveCategoryAlias(value) {
  const clean = decodeBasicEntities(value);
  if (!clean) return '';
  const lower = clean.toLowerCase();
  const mapped = CATEGORY_ALIASES[lower];
  if (mapped) {
    return canonicalCategoryMap.get(mapped.toLowerCase()) || mapped;
  }
  const slashParts = clean.split(/\s+\/\s+/);
  if (slashParts.length === 2 && slashParts[0].trim().toLowerCase() === slashParts[1].trim().toLowerCase()) {
    const single = slashParts[0].trim();
    return canonicalCategoryMap.get(single.toLowerCase()) || single;
  }
  const dirtyPrefixMatch = clean.match(/^(?:dm\d+\/)?en\/(.+)$/i);
  if (dirtyPrefixMatch && dirtyPrefixMatch[1]) {
    const candidate = dirtyPrefixMatch[1].trim();
    if (canonicalCategoryMap.has(candidate.toLowerCase())) {
      return canonicalCategoryMap.get(candidate.toLowerCase());
    }
  }
  return canonicalCategoryMap.get(lower) || clean;
}

const toLowerSet = (list) => new Set(
  (Array.isArray(list) ? list : [])
    .map(v => String(v || '').trim().toLowerCase())
    .filter(Boolean)
);

const fetchList = (url) => {
  if (typeof fetch !== 'function') return Promise.resolve([]);
  return fetch(url, { credentials: 'omit' })
    .then(r => (r && r.ok ? r.json() : []))
    .catch(() => []);
};

/**
 * Loads indexable actor & category sets once per session; never throws.
 * Resolves within timeoutMs even on slow networks so rendering is never blocked.
 */
export function loadIndexableTaxonomies({ timeoutMs = 2500 } = {}) {
  if (!loadPromise) {
    const work = Promise.all([
      fetchList('/api/actors.json'),
      fetchList('/api/categories.json')
    ]).then(([actors, categories]) => {
      if (Array.isArray(actors) && actors.length > 0) {
        actorSet = toLowerSet(actors);
      }
      if (Array.isArray(categories) && categories.length > 0) {
        categorySet = toLowerSet(categories);
        canonicalCategoryMap = new Map();
        for (const cat of categories) {
          const cleanCat = String(cat || '').trim();
          if (cleanCat) canonicalCategoryMap.set(cleanCat.toLowerCase(), cleanCat);
        }
      }
    });

    if (timeoutMs > 0) {
      loadPromise = Promise.race([
        work,
        new Promise(resolve => setTimeout(resolve, timeoutMs))
      ]);
    } else {
      loadPromise = work;
    }
  }
  return loadPromise;
}

/**
 * Mirrors Worker isIndexableTaxonomyTerm() for client-rendered chips.
 * Unloaded/failed state conservatively returns false (human clicks still navigate via JS).
 */
export function isIndexableTaxonomy(type, name, lang = 'en') {
  const clean = decodeBasicEntities(name);
  if (!clean) return false;
  if (type === 'actor') {
    return Boolean(actorSet && actorSet.has(clean.toLowerCase()));
  }
  if (type === 'category' || type === 'tag') {
    const resolved = resolveCategoryAlias(clean);
    if (!resolved) return false;
    if (lang !== 'en' && ENGLISH_SPECIFIC_CATEGORIES.has(resolved.toLowerCase())) return false;
    return Boolean(categorySet && categorySet.has(resolved.toLowerCase()));
  }
  if (type === 'studio') {
    return clean.toLowerCase() !== 'other';
  }
  return true;
}

/**
 * Renders <a href> for curated indexable hubs, or <span role="link" tabindex="0" data-nav-href>
 * for thin/unknown terms so crawlers do not follow thin taxonomy links.
 */
export function renderTaxonomyLink({ type, name, lang = 'en', className = '', label, dataAttrs = '' }) {
  const cleanName = decodeBasicEntities(name);
  const canonicalName = (type === 'category' || type === 'tag')
    ? (resolveCategoryAlias(cleanName) || cleanName)
    : cleanName;
  const href = `/${lang}/${type}?name=${encodeURIComponent(canonicalName)}`;
  const extraAttrs = dataAttrs ? ` ${dataAttrs}` : '';

  if (isIndexableTaxonomy(type, cleanName, lang)) {
    const classAttr = className ? ` class="${ui.escapeHTML(className)}"` : '';
    return `<a href="${href}"${classAttr}${extraAttrs}>${label}</a>`;
  }

  const thinClasses = [className, 'taxonomy-link-thin'].filter(Boolean).join(' ');
  return `<span role="link" tabindex="0" class="${ui.escapeHTML(thinClasses)}" data-nav-href="${ui.escapeHTML(href)}"${extraAttrs}>${label}</span>`;
}
