import { describe, it, expect } from 'vitest';
import { formatFileSize } from './formatFileSize';

describe('formatFileSize', () => {
  it('formats bytes below 1 KB as B', () => {
    expect(formatFileSize(512)).toBe('512 B');
  });

  it('formats values in the KB range', () => {
    expect(formatFileSize(51200)).toBe('50.0 KB');
    expect(formatFileSize(102400)).toBe('100.0 KB');
  });

  it('formats values in the MB range', () => {
    expect(formatFileSize(2 * 1024 * 1024)).toBe('2.0 MB');
    expect(formatFileSize(3 * 1024 * 1024)).toBe('3.0 MB');
  });

  it('formats exactly 1 KB as KB not B', () => {
    expect(formatFileSize(1024)).toBe('1.0 KB');
  });

  it('formats exactly 1 MB as MB not KB', () => {
    expect(formatFileSize(1024 * 1024)).toBe('1.0 MB');
  });
});
