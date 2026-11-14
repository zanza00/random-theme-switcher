import { describe, it, expect } from 'vitest';
import {
  collectThemeContributions,
  filterThemes,
  pickRandom,
  themeSettingsId,
  type ExtensionLike,
  type ThemeContribution,
} from './themes';

describe('themeSettingsId', () => {
  it('prefers the explicit id', () => {
    expect(themeSettingsId({ id: 'my.theme', label: 'My Theme' })).toBe('my.theme');
  });

  it('falls back to the label when no id is present', () => {
    expect(themeSettingsId({ label: 'My Theme' })).toBe('My Theme');
  });
});

describe('collectThemeContributions', () => {
  it('collects contributions from multiple extensions in order', () => {
    const extensions: ExtensionLike[] = [
      {
        packageJSON: {
          contributes: {
            themes: [
              { id: 'a', label: 'A', uiTheme: 'vs-dark' },
              { label: 'B' },
            ],
          },
        },
      },
      {
        packageJSON: {
          contributes: {
            themes: [{ id: 'c', label: 'C', uiTheme: 'vs' }],
          },
        },
      },
    ];

    expect(collectThemeContributions(extensions)).toEqual([
      { id: 'a', label: 'A', uiTheme: 'vs-dark' },
      { label: 'B' },
      { id: 'c', label: 'C', uiTheme: 'vs' },
    ]);
  });

  it('skips extensions without packageJSON, contributes, or themes', () => {
    const extensions = [
      {},
      { packageJSON: {} },
      { packageJSON: { contributes: {} } },
      { packageJSON: { contributes: { themes: undefined } } },
    ] as ExtensionLike[];

    expect(collectThemeContributions(extensions)).toEqual([]);
  });

  it('skips malformed entries that lack a string label', () => {
    const extensions = [
      {
        packageJSON: {
          contributes: {
            themes: [
              null,
              {},
              { label: 42 },
              { uiTheme: 'vs' },
              { label: 'Valid' },
            ],
          },
        },
      },
    ] as unknown as ExtensionLike[];

    expect(collectThemeContributions(extensions)).toEqual([{ label: 'Valid' }]);
  });

  it('returns an empty array for no extensions', () => {
    expect(collectThemeContributions([])).toEqual([]);
  });
});

describe('filterThemes', () => {
  const themes: ThemeContribution[] = [
    { id: 'light-one', label: 'Light One', uiTheme: 'vs' },
    { id: 'light-hc', label: 'Light HC', uiTheme: 'hc-light' },
    { id: 'dark-one', label: 'Dark One', uiTheme: 'vs-dark' },
    { id: 'dark-hc', label: 'Dark HC', uiTheme: 'hc-black' },
    { id: 'no-ui', label: 'No UI Theme' },
  ];

  it('returns every settings id for side "both"', () => {
    expect(filterThemes(themes, 'both')).toEqual([
      'light-one',
      'light-hc',
      'dark-one',
      'dark-hc',
      'no-ui',
    ]);
  });

  it('returns only light ui themes for side "light"', () => {
    expect(filterThemes(themes, 'light')).toEqual(['light-one', 'light-hc']);
  });

  it('returns only dark ui themes for side "dark"', () => {
    expect(filterThemes(themes, 'dark')).toEqual(['dark-one', 'dark-hc']);
  });

  it('applies the exclude regex to the settings id', () => {
    expect(filterThemes(themes, 'both', /^dark-/)).toEqual([
      'light-one',
      'light-hc',
      'no-ui',
    ]);
  });

  it('excludes by id even when the label differs', () => {
    const withId: ThemeContribution[] = [
      { id: 'internal.id', label: 'Friendly Name', uiTheme: 'vs' },
      { label: 'Other', uiTheme: 'vs' },
    ];

    expect(filterThemes(withId, 'light', /internal/)).toEqual(['Other']);
  });

  it('deduplicates settings ids while preserving first-seen order', () => {
    const duplicates: ThemeContribution[] = [
      { id: 'same', label: 'First', uiTheme: 'vs' },
      { id: 'same', label: 'Second', uiTheme: 'vs' },
      { label: 'Third', uiTheme: 'vs' },
    ];

    expect(filterThemes(duplicates, 'light')).toEqual(['same', 'Third']);
  });

  it('returns an empty array for empty input', () => {
    expect(filterThemes([], 'both')).toEqual([]);
    expect(filterThemes([], 'light')).toEqual([]);
    expect(filterThemes([], 'dark')).toEqual([]);
  });
});

describe('pickRandom', () => {
  it('returns undefined for an empty list', () => {
    expect(pickRandom([])).toBeUndefined();
  });

  it('returns the only item for a single-item list', () => {
    expect(pickRandom(['only'], () => 0)).toBe('only');
    expect(pickRandom(['only'], () => 1)).toBe('only');
  });

  it('returns the first item when rng yields 0', () => {
    expect(pickRandom(['a', 'b', 'c'], () => 0)).toBe('a');
  });

  it('returns the last item when rng yields 0.999', () => {
    expect(pickRandom(['a', 'b', 'c'], () => 0.999)).toBe('c');
  });

  it('clamps rng === 1 to the last item', () => {
    expect(pickRandom(['a', 'b', 'c'], () => 1)).toBe('c');
  });

  it('covers every index with a deterministic rng sequence', () => {
    const items = ['a', 'b', 'c', 'd'];
    const values = [0, 0.25, 0.5, 0.75];
    const queue = [...values];
    const rng = (): number => queue.shift() as number;

    const picked = values.map(() => pickRandom(items, rng));

    expect(picked).toEqual(['a', 'b', 'c', 'd']);
    expect(queue).toEqual([]);
  });

  it('does not mutate the input array', () => {
    const items = ['a', 'b', 'c'];
    const snapshot = [...items];

    pickRandom(items, () => 0.5);

    expect(items).toEqual(snapshot);
  });
});
