# Change Log

## Release Notes

## 0.3.0 (2026-11-14)

### Fixed

- Random selection no longer has an off-by-one that excluded the last candidate, and no longer
  crashes when the theme list is empty. Thanks to @webbrain-one for the report and the fix in
  PR #54; the rewritten selector keeps that fix and adds the empty-list guard.
- `randomThemeSwitcher.preventReloadThemeList` now uses an explicit `!== -1` check instead of
  relying on `findIndex` truthiness.
- Fixed the dead `typeof Array` check by using `Array.isArray` when adding the current theme.
- Activation no longer hangs when the theme QuickPick is cancelled or the exclude regex is invalid.
- The theme list is no longer stale after a settings change.
- The `isSwitching` guard is always released, so a failed switch cannot block later switches.
- Daily mode now stores a real local `YYYY-MM-DD` date in `globalState` (`lastSwitchDate`) instead of
  the removed `randomThemeSwitcher.lastSwitchDay` setting.
- Timers and listeners are disposed on deactivation.
- Whole-pack theme lookup now resolves `id ?? label` instead of comparing labels only.
- First run no longer prompts to copy installed themes.

### Toolchain

- VS Code 1.95 engine and `@types/vscode` 1.95.
- TypeScript 6, esbuild bundling, ESLint 10, vitest.
- Node 22 CI.
- Removed `fp-ts` and the dead `vscode` package postinstall.

## 0.2.2

- Fixes `switchMode` "daily" behaviour.
- When choosing a new theme, it will prompt if you want to add it to the random theme list.

## 0.2.1

- Externalized the MATERIAL_LIST into a more customizable `preventReloadThemeList`
  - With that users can pick up their favorites theme and have them one more time (instead of being changed immediately) 

## 0.2.0

- Improved the code
- Introduced the `randomThemeSwitcher.switchMode` setting
- Improved the `randomThemeSwitcher.copyall` command:
  - Now you can narrow the themes' side you want to load
  - You can now optionally specify an exclude regex for theme names 

## 0.1.3

- Added key chord for changing theme `cmd+k cmd+shift+t`
- Added command to add and remove current theme from lists

## 0.1.2

- Fixes reload when applying Material Theme.

## 0.1.1

- If no theme list is found all the installed themes will be automatically copied to settings.

## 0.1.0

- Added command for save current installed themes in settings list.
- If no theme list is provided all the installed themes will be used.
- Now the current theme cannot be applied when choosing randomly.
- If only one theme is present in the list that theme will be applied (why ???).

## 0.0.2

- Theme now change every time the editor opens

## 0.0.1

- Initial release
