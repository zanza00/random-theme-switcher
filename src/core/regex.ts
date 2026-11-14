export function buildExcludeRegex(pattern: string | undefined): RegExp | undefined {
  if (pattern === undefined || pattern.trim() === '') {
    return undefined;
  }
  return new RegExp(pattern);
}
