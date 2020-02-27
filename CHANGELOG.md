# Change Log

## Release Notes

## 0.3.0

* Added the `Recent themes` feature
	* Added [Random Theme: Pick a theme from the recent ones](#randomThemeSwitcher.quickPickPreviouslySetTheme) command
	* Added [max last switched theme count](#randomThemeSwitcher.maxLastSwitchedThemeCount) setting 
* BugFix: in "startup" mode if list is big it's not always possible to swap
* BugFix on startup if `isLastThemeMaterial` is *true* other modes stopped working 
* Improved the performance of the `changeTheme` method
* Added the Linter Now the extension will detects junk in `themeList` or extension deactivations/unInstallations and ask user for fixing automatically the junk entries.
* Improved the package.json
	* Fixed Typos
	* Fixed Scopes
	* Added commandPalette section
	* Categorized commands

## 0.2.2

- Fixes `switchMode` "daily" behavior.
- When choosing a new theme, it will prompt if you want to add it to the random theme list.

## 0.2.1

- Externalized the MATERIAL_LIST into a more customizable `preventReloadThemeList`
  - With that users can pick up their favorites theme and have them one more time (instead of being changed immediately) 

## 0.2.0

- Improved the code
- Introduced the `randomThemeSwitcher.switchMode` setting
- Improved the `randomThemeSwitcher.copyAll` command:
  - Now you can narrow the themes' side you want to load
  - You can now optionally specify an exclude regex for theme names 

## 0.1.3

- Added key chord for changing theme <kbd>cmd+k cmd+shift+t</kbd>
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
