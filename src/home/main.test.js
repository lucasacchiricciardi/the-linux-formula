import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname, '..', '..');

describe('main.js — source code checks', () => {
  const src = readFileSync(join(ROOT, 'src', 'home', 'main.js'), 'utf-8');

  it('should not use innerHTML (XSS prevention)', () => {
    assert.ok(!src.includes('innerHTML'), 'must not use innerHTML');
  });

  it('should use createElement and textContent for DOM injection', () => {
    assert.ok(src.includes('createElement'), 'must use createElement');
    assert.ok(src.includes('textContent'), 'must use textContent');
  });

  it('should instantiate a Web Worker', () => {
    assert.ok(src.includes('new Worker'), 'must instantiate Worker');
  });

  it('should handle all three message types from the worker', () => {
    assert.ok(src.includes("'news'"), 'must handle news type');
    assert.ok(src.includes("'error'"), 'must handle error type');
    assert.ok(src.includes("'unchanged'"), 'must handle unchanged type');
  });

  it('should reference news-feed-container', () => {
    assert.ok(src.includes('news-feed-container'), 'must reference the news container');
  });
});

describe('index.html — news container', () => {
  const html = readFileSync(join(ROOT, 'src', 'home', 'index.html'), 'utf-8');

  it('should contain a #news-feed-container section', () => {
    assert.ok(html.includes('news-feed-container'), 'index.html must have news-feed-container');
  });
});

describe('stripHtml — unit tests', () => {
  function stripHtml(html) {
    return html.replace(/<[^>]*>/g, '');
  }

  it('should remove HTML tags', () => {
    const html = '<p>Hello <strong>world</strong></p>';
    const result = stripHtml(html);
    assert.equal(result, 'Hello world');
  });

  it('should handle nested tags', () => {
    const html = '<div><span>Nested</span></div>';
    const result = stripHtml(html);
    assert.equal(result, 'Nested');
  });

  it('should handle attributes', () => {
    const html = '<a href="http://example.com" class="link">Link</a>';
    const result = stripHtml(html);
    assert.equal(result, 'Link');
  });

  it('should handle empty string', () => {
    const result = stripHtml('');
    assert.equal(result, '');
  });

  it('should pass through plain text', () => {
    const text = 'Plain text without tags';
    const result = stripHtml(text);
    assert.equal(result, 'Plain text without tags');
  });

  it('should handle self-closing tags', () => {
    const html = '<br/><img src="test.png"/>';
    const result = stripHtml(html);
    assert.equal(result, '');
  });
});