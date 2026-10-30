import test from 'node:test';
import assert from 'node:assert/strict';
import { createLinkSchema, updateLinkSchema } from '../src/utils/validation.js';
import { parseClick } from '../src/services/analytics.js';
import { hashToken } from '../src/middleware/ownerAuth.js';

const valid = { destination: 'https://example.com/path?q=1', alias: 'test-link', title: 'Test', expiresAt: null };
test('accepts valid HTTPS destinations', () => assert.equal(createLinkSchema.parse(valid).destination, valid.destination));
test('rejects non-http protocols', () => assert.throws(() => createLinkSchema.parse({ ...valid, destination: 'javascript:alert(1)' })));
test('rejects malformed URL', () => assert.throws(() => createLinkSchema.parse({ ...valid, destination: 'not a url' })));
test('rejects aliases with spaces or punctuation', () => assert.throws(() => createLinkSchema.parse({ ...valid, alias: 'bad alias!' })));
test('rejects expired expiry date', () => assert.throws(() => createLinkSchema.parse({ ...valid, expiresAt: new Date(Date.now() - 10000).toISOString() })));
test('rejects empty update payload', () => assert.throws(() => updateLinkSchema.parse({})));
test('hashes management keys deterministically without storing plaintext', () => { const a = hashToken('some-long-secret-key'); assert.equal(a, hashToken('some-long-secret-key')); assert.notEqual(a, 'some-long-secret-key'); });
test('parses browser and referrer safely', () => { const event = parseClick({ get: name => ({ 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36', referer: 'https://github.com/repo' }[name]) }); assert.equal(event.referrer, 'github.com'); assert.equal(event.browser, 'Chrome'); assert.equal(event.device, 'Desktop'); });

test('accepts valid HTTP destinations', () => assert.equal(createLinkSchema.parse({ ...valid, destination: 'http://example.com' }).destination, 'http://example.com'));
test('rejects missing destination', () => assert.throws(() => createLinkSchema.parse({ ...valid, destination: '' })));
test('rejects alias shorter than 4 characters', () => assert.throws(() => createLinkSchema.parse({ ...valid, alias: 'abc' })));
test('rejects alias longer than 40 characters', () => assert.throws(() => createLinkSchema.parse({ ...valid, alias: 'a'.repeat(41) })));
test('accepts future expiry and empty expiry normalization', () => {
  assert.equal(createLinkSchema.parse({ ...valid, expiresAt: '' }).expiresAt, null);
  assert.ok(createLinkSchema.parse({ ...valid, expiresAt: new Date(Date.now() + 86400000).toISOString() }).expiresAt instanceof Date);
});
test('accepts valid partial updates and rejects invalid boolean values', () => {
  assert.equal(updateLinkSchema.parse({ enabled: false }).enabled, false);
  assert.equal(updateLinkSchema.parse({ title: '' }).title, '');
  assert.throws(() => updateLinkSchema.parse({ enabled: 'yes' }));
});
test('handles malformed and direct referrers safely', () => {
  const event = parseClick({ get: name => ({ 'user-agent': 'Googlebot/2.1', referer: 'not a url' }[name]) });
  assert.equal(event.referrer, 'Direct / Unknown');
  assert.equal(event.browser, 'Unknown');
  assert.equal(event.device, 'Other');
});
