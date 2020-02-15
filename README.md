# Random Theme Switcher

A simple extension that chooses and applies a *random* theme.

## Features

* Choose between 5 switch Modes:

| Mode     | Description                                                                         |
| -------- | ----------------------------------------------------------------------------------- |
| manual   | No automatic switch is performed                                                    |
| startup  | When active it will change theme whenever vscode is opened                          |
| daily    | When active it will change theme once a day                                         |
| interval | When active it will change theme every `randomThemeSwitcher.switchInterval` minutes |
| typing   | When active it will change theme every times a keyboard key is pressed              |

> Don't forget to reload VSC for the changes to take effect

* With [Random Theme: Copy all installed themes in settings](#randomThemeSwitcher.copyInstalledThemes) command you can copy in batch all the installed themes:
  * You can narrow the themes' side you want to load
  * You can optionally specify an exclude regex for theme names

### Change theme on command

- Open the command palette and search for `random`
- Choose [Random Theme: Switch to a Random Theme](#randomThemeSwitcher.switchTheme)(<kbd>ctrl+k ctrl+shift+t</kbd>)

![Change the current Theme](https://raw.githubusercontent.com/zanza00/random-theme-switcher/master/media/rts.gif)

### Change theme when vscode starts

- Open a new window and, after a few seconds, behold the new theme! ([switch mode](#randomThemeSwitcher.switchMode) != `manual`)

### Useful commands:

* You can also interact with the [theme list](#randomThemeSwitcher.themeList) without open the `settings.json`:
  * Use [Random Theme: Add current theme to settings](#randomThemeSwitcher.addCurrentTheme) and [Random Theme: Remove current theme from settings](#randomThemeSwitcher.removeCurrentTheme) to dynamically add or remove themes from the list
* If you feel nostalgic or simply want to swap to that awesome theme again, use [Random Theme: Pick a theme from memories](#randomThemeSwitcher.quickPickPreviouslySetTheme) command
  * Remember to increase the limit if you feel right to do so tweaking the [max last switched theme count](#randomThemeSwitcher.maxLastSwitchedThemeCount) setting


## Extension Settings

|                                  Configuration                                  |  Type   | Enum  |       Default        |                                                                            Note                                                                            |
| :-----------------------------------------------------------------------------: | :-----: | :---: | :------------------: | :--------------------------------------------------------------------------------------------------------------------------------------------------------: |
|             [switch interval](#randomThemeSwitcher.switchInterval)              | integer |       |          15          |                                                            Set the interval (mode= "interval")                                                             |
|                  [theme list](#randomThemeSwitcher.themeList)                   |  array  |       |                      |                                                           a list of string with labels of themes                                                           |
|                 [switch mode](#randomThemeSwitcher.switchMode)                  | string  |       |         true         |                                                                                                                                                            |
|              [last switch day](#randomThemeSwitcher.lastSwitchDay)              | integer |       |                      |                                                                                                                                                            |
| [max last switched theme count](#randomThemeSwitcher.maxLastSwitchedThemeCount) | integer |       |          10          |                                                                                                                                                            |
|    [prevent reload theme list](#randomThemeSwitcher.preventReloadThemeList)     |  array  |       | material theme suite | some themes, after they are applied, reload the instance. If are present in this list the extension will not set a new random theme after they are applied |

> __PROTIP:__ For easy setup use the command [Random Theme: Copy all installed themes in settings](#randomThemeSwitcher.copyInstalledThemes)

example of valid [theme list](#randomThemeSwitcher.themeList):

```json
"randomThemeSwitcher.themeList": [
        "Andromeda Italic",
        "Cobalt2",
        "Dracula",
        "Tomorrow Night Blue",
        "Ayu Dark",
        "One Monokai",
        "Night Owl"
]
```

**Enjoy !!!**