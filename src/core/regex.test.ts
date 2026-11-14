import { describe, it, expect } from 'vitest';
import { buildExcludeRegex } from './regex';

describe('buildExcludeRegex', () => {
  it('returns undefined for undefined input', () => {
    expect(buildExcludeRegex(undefined)).toBeUndefined();
  });

  it('returns undefined for an empty string', () => {
    expect(buildExcludeRegex('')).toBeUndefined();
  });

  it('returns undefined for whitespace-only input', () => {
    expect(buildExcludeRegex('   ')).toBeUndefined();
    expect(buildExcludeRegex('\t\n')).toBeUndefined();
  });

  it('builds a working regex from a valid pattern', () => {
    const regex = buildExcludeRegex('^Default');

    expect(regex).toBeInstanceOf(RegExp);
    expect(regex?.test('Default Dark')).toBe(true);
    expect(regex?.test('Light Default')).toBe(false);
  });

  it('supports alternation and character classes', () => {
    const regex = buildExcludeRegex('^(Dark|Light)-');

    expect(regex?.test('Dark-Modern')).toBe(true);
    expect(regex?.test('Light-Modern')).toBe(true);
    expect(regex?.test('Solarized')).toBe(false);
  });

  it('throws a SyntaxError for an invalid pattern', () => {
    expect(() => buildExcludeRegex('(')).toThrow(SyntaxError);
  });
});
