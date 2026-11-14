export type ThemeContribution = { id?: string; label: string; uiTheme?: string };

export type ThemeSide = 'both' | 'light' | 'dark';

export type ExtensionLike = {
  packageJSON?: { contributes?: { themes?: ThemeContribution[] } };
};

const LIGHT_UI_THEMES: readonly string[] = ['vs', 'hc-light'];
const DARK_UI_THEMES: readonly string[] = ['vs-dark', 'hc-black'];

export function themeSettingsId(theme: ThemeContribution): string {
  return theme.id ?? theme.label;
}

export function collectThemeContributions(extensions: readonly ExtensionLike[]): ThemeContribution[] {
  const contributions: ThemeContribution[] = [];

  for (const extension of extensions) {
    const themes = extension.packageJSON?.contributes?.themes;
    if (!Array.isArray(themes)) {
      continue;
    }
    for (const theme of themes) {
      if (typeof theme?.label === 'string') {
        contributions.push(theme);
      }
    }
  }

  return contributions;
}

function matchesSide(theme: ThemeContribution, side: ThemeSide): boolean {
  if (side === 'both') {
    return true;
  }
  if (theme.uiTheme === undefined) {
    return false;
  }
  return side === 'light'
    ? LIGHT_UI_THEMES.includes(theme.uiTheme)
    : DARK_UI_THEMES.includes(theme.uiTheme);
}

export function filterThemes(
  themes: readonly ThemeContribution[],
  side: ThemeSide,
  exclude?: RegExp
): string[] {
  const ids: string[] = [];

  for (const theme of themes) {
    if (!matchesSide(theme, side)) {
      continue;
    }
    const id = themeSettingsId(theme);
    if (exclude !== undefined && exclude.test(id)) {
      continue;
    }
    if (!ids.includes(id)) {
      ids.push(id);
    }
  }

  return ids;
}

export function pickRandom<T>(items: readonly T[], rng: () => number = Math.random): T | undefined {
  if (items.length === 0) {
    return undefined;
  }

  const value = rng();
  const normalized = Number.isFinite(value) ? value : 0;
  const index = Math.min(items.length - 1, Math.max(0, Math.floor(normalized * items.length)));

  return items[index];
}
