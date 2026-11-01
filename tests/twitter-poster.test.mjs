import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  percentEncode,
  generateOAuthHeader,
  buildWatchUrl,
  craftTweetText
} from '../scripts/twitter-poster.mjs';

test('percentEncode adheres to RFC 3986 and OAuth 1.0 specifications', () => {
  assert.equal(percentEncode('abc 123'), 'abc%20123');
  assert.equal(percentEncode('test!@#$*()'), 'test%21%40%23%24%2A%28%29');
  assert.equal(percentEncode("hello'world"), 'hello%27world');
});

test('generateOAuthHeader creates a well-formed OAuth 1.0 header', () => {
  const header = generateOAuthHeader({
    method: 'POST',
    url: 'https://api.twitter.com/2/tweets',
    consumerKey: 'consumer_123',
    consumerSecret: 'consumer_secret_456',
    token: 'token_789',
    tokenSecret: 'token_secret_abc'
  });

  assert.match(header, /^OAuth /);
  assert.match(header, /oauth_consumer_key="consumer_123"/);
  assert.match(header, /oauth_token="token_789"/);
  assert.match(header, /oauth_signature_method="HMAC-SHA1"/);
  assert.match(header, /oauth_version="1.0"/);
  assert.match(header, /oauth_signature="[^"]+"/);
  assert.match(header, /oauth_nonce="[^"]+"/);
  assert.match(header, /oauth_timestamp="\d+"/);
});

test('buildWatchUrl creates a valid canonical watch URL', () => {
  const post = {
    code: 'SSIS-001',
    title: 'SSIS-001 Yua Mikami Romance',
    slug: 'ssis-001-yua-mikami-romance'
  };
  const url = buildWatchUrl(post, '1001');
  assert.equal(url, 'https://www.missav-j.com/en/watch/ssis-001-yua-mikami-romance-1001');
});

test('craftTweetText stays within 280-character limit with t.co 23-char URL', () => {
  const post = {
    id: 12345,
    code: 'IPX-999-ENGLISH-SUBTITLE',
    title: 'IPX-999 Extremely Long Title With Lots Of Extra Words That Should Be Safely Truncated By The Generator To Maintain Full Compliance',
    actors: ['Actress Name', 'Co-Star Name'],
    studio: 'IdeaPocket'
  };
  const enriched = {
    seo_title: 'IPX-999: Actress Name High Definition Showcase',
    tags: ['Actress Name', 'IdeaPocket', 'HD Streaming', 'English Subtitle', 'IPX-999']
  };

  const tweet = craftTweetText(post, enriched);
  const watchUrl = buildWatchUrl(post, '12345');

  // Verify elements
  assert.match(tweet, /🎬 \[IPX-999\]/);
  assert.match(tweet, /🌟 Starring: Actress Name/);
  assert.match(tweet, /▶️ Watch Full HD on MISSAV-J:/);
  assert.match(tweet, /#JavStreaming/);
  assert.match(tweet, /#MissAV/);
  assert.match(tweet, /#IPX999/);

  // Effective length on Twitter: non-URL chars + 23
  const effectiveLength = tweet.length - watchUrl.length + 23;
  assert.ok(effectiveLength <= 280, `Tweet length (${effectiveLength}) exceeded 280 characters`);
});
