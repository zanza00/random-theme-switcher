export function addToThemeList(list: readonly string[], theme: string | readonly string[]): string[] {
  const additions = typeof theme === 'string' ? [theme] : theme;
  return [...new Set([...list, ...additions])].sort();
}

export function removeFromThemeList(list: readonly string[], theme: string): string[] {
  return list.filter(item => item !== theme);
}
