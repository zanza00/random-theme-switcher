import { describe, it, expect } from 'vitest';
import { addToThemeList, removeFromThemeList } from './themeList';

describe('addToThemeList', () => {
  it('adds a single theme', () => {
    expect(addToThemeList([], 'beta')).toEqual(['beta']);
  });

  it('adds an array of themes', () => {
    expect(addToThemeList([], ['beta', 'alpha'])).toEqual(['alpha', 'beta']);
  });

  it('deduplicates existing and new entries', () => {
    expect(addToThemeList(['alpha'], ['alpha', 'beta'])).toEqual(['alpha', 'beta']);
  });

  it('sorts the resulting list', () => {
    expect(addToThemeList(['charlie'], ['alpha', 'bravo'])).toEqual([
      'alpha',
      'bravo',
      'charlie',
    ]);
  });

  it('does not mutate the input list', () => {
    const list = ['charlie', 'alpha'];
    const snapshot = [...list];

    addToThemeList(list, 'bravo');

    expect(list).toEqual(snapshot);
  });

  it('does not mutate the input additions array', () => {
    const additions = ['bravo', 'alpha'];
    const snapshot = [...additions];

    addToThemeList([], additions);

    expect(additions).toEqual(snapshot);
  });
});

describe('removeFromThemeList', () => {
  it('removes a theme', () => {
    expect(removeFromThemeList(['alpha', 'beta'], 'alpha')).toEqual(['beta']);
  });

  it('removes every occurrence of the theme', () => {
    expect(removeFromThemeList(['alpha', 'beta', 'alpha'], 'alpha')).toEqual(['beta']);
  });

  it('returns an unchanged copy when the theme is absent', () => {
    expect(removeFromThemeList(['alpha', 'beta'], 'charlie')).toEqual(['alpha', 'beta']);
  });

  it('does not mutate the input list', () => {
    const list = ['alpha', 'beta', 'alpha'];
    const snapshot = [...list];

    removeFromThemeList(list, 'alpha');

    expect(list).toEqual(snapshot);
  });
});
