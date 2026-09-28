export const MIN_RELATED_RESULTS = 12;

export function getPrimaryRelatedQuery(post) {
  if (post?.actors?.length) {
    return { kind: 'actor', params: { actor: post.actors[0], per_page: 20 } };
  }

  const seriesPrefix = extractSeriesPrefix(post?.code);
  if (seriesPrefix) {
    return { kind: 'series', params: { search: seriesPrefix, per_page: 20 } };
  }

  if (post?.categories?.length) {
    return { kind: 'category', params: { category: post.categories[0], per_page: 20 } };
  }

  return null;
}

export function getFallbackRelatedQuery(post, primaryKind) {
  const seriesPrefix = extractSeriesPrefix(post?.code);
  if (primaryKind === 'actor' && seriesPrefix) {
    return { search: seriesPrefix, per_page: 20 };
  }
  if (primaryKind !== 'category' && post?.categories?.length) {
    return { category: post.categories[0], per_page: 20 };
  }
  return null;
}

function extractSeriesPrefix(code) {
  if (!code) return '';
  const match = String(code).trim().match(/^([A-Za-z]+)-?\d/);
  return match ? match[1].toUpperCase() : '';
}
