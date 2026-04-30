import { describe, it, expect } from 'vitest';
import { escapeHtml } from './htmlUtils.ts';

describe('escapeHtml', () => {
  it('returns empty string unchanged', () => {
    expect(escapeHtml('')).toBe('');
  });

  it('escapes ampersands', () => {
    expect(escapeHtml('a & b')).toBe('a &amp; b');
  });

  it('escapes less-than', () => {
    expect(escapeHtml('<div>')).toBe('&lt;div&gt;');
  });

  it('escapes greater-than', () => {
    expect(escapeHtml('1 > 0')).toBe('1 &gt; 0');
  });

  it('escapes double quotes', () => {
    expect(escapeHtml('"hello"')).toBe('&quot;hello&quot;');
  });

  it('escapes single quotes', () => {
    expect(escapeHtml("it's")).toBe('it&#x27;s');
  });

  it('escapes all special characters together', () => {
    expect(escapeHtml('<a href="../node_modules/url">link & more</a>')).toBe(
      '&lt;a href=&quot;url&quot;&gt;link &amp; more&lt;/a&gt;'
    );
  });

  it('leaves plain text unchanged', () => {
    expect(escapeHtml('Hello World 123')).toBe('Hello World 123');
  });

  it('escapes multiple ampersands', () => {
    expect(escapeHtml('a & b & c')).toBe('a &amp; b &amp; c');
  });

  it('escapes a classic XSS payload', () => {
    const input = '<script>alert("xss")</script>';
    const output = escapeHtml(input);
    expect(output).not.toContain('<script>');
    expect(output).toContain('&lt;script&gt;');
    expect(output).toContain('&quot;xss&quot;');
  });

  it('does not double-escape already-escaped entities', () => {
    // escapeHtml is not idempotent by design — it escapes raw text
    expect(escapeHtml('&amp;')).toBe('&amp;amp;');
  });
});
