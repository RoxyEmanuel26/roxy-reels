/**
 * Offline / Pre-flight Schema.org Structured Data Validator
 * Validates generated JSON-LD for compliance with Google Rich Results requirements.
 * 
 * Usage:
 *   node scripts/validate-schema.mjs
 */

import assert from 'node:assert';

export function validateWebSite(schema) {
  assert.equal(schema['@type'], 'WebSite', 'Must be WebSite');
  assert.ok(schema.name, 'WebSite must have name');
  assert.ok(schema.url, 'WebSite must have url');
  assert.ok(schema.potentialAction, 'WebSite should have potentialAction');
  assert.equal(schema.potentialAction['@type'], 'SearchAction');
}

export function validateOrganization(schema) {
  assert.equal(schema['@type'], 'Organization', 'Must be Organization');
  assert.ok(schema.name, 'Organization must have name');
  assert.ok(schema.url, 'Organization must have url');
  assert.ok(schema.logo, 'Organization must have logo');
}

export function validateVideoObject(schema) {
  assert.equal(schema['@type'], 'VideoObject', 'Must be VideoObject');
  assert.ok(schema.name, 'VideoObject must have name');
  assert.ok(schema.description, 'VideoObject must have description');
  assert.ok(schema.thumbnailUrl && schema.thumbnailUrl.length > 0, 'VideoObject must have thumbnailUrl');
  assert.ok(schema.uploadDate, 'VideoObject must have uploadDate');
  assert.ok(schema.embedUrl || schema.contentUrl, 'VideoObject must have embedUrl or contentUrl');
  if (schema.duration) {
    assert.match(schema.duration, /^PT(\d+H)?(\d+M)?(\d+S)?$/, 'Duration must follow ISO 8601');
  }
}

export function validateBreadcrumbList(schema, minItems = 2) {
  assert.equal(schema['@type'], 'BreadcrumbList', 'Must be BreadcrumbList');
  assert.ok(Array.isArray(schema.itemListElement), 'itemListElement must be an array');
  assert.ok(schema.itemListElement.length >= minItems, `Must have at least ${minItems} breadcrumb items`);
  schema.itemListElement.forEach((item, index) => {
    assert.equal(item['@type'], 'ListItem');
    assert.equal(item.position, index + 1, 'Position must be sequential 1-based');
    assert.ok(item.name, 'Breadcrumb item must have name');
    assert.ok(item.item, 'Breadcrumb item must have item URL');
  });
}

export function validateItemList(schema) {
  assert.equal(schema['@type'], 'ItemList', 'Must be ItemList');
  assert.ok(schema.name, 'ItemList must have name');
  assert.ok(schema.url, 'ItemList must have url');
}

console.log('✅ Schema validator helpers loaded successfully');
