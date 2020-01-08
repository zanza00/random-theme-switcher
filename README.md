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

* With `randomThemeSwitcher.copyall` command you can copy in batch all the installed themes:
  * You can narrow the themes' side you want to load
  * You can optionally specify an exclude regex for theme names

### Change theme on command

- Open the command palette and search for `random`
- Choose `Random Theme: Switch to a Random Theme`

![Change the current Theme](media/rts.gif)

### Change theme when vscode starts

- Open a new window and, after a few seconds, behold the new theme!

## Extension Settings

- `randomThemeSwitcher.switchOnOpen`: true or false, __default is true__, change to a random theme when vscode is opened.

- `randomThemeSwitcher.themeList`: a list of string with labels of themes.

- `preventReloadThemeList`: some themes, after they are applied, reload the instance. If are present in this list the extension will not set a new random theme after they are applied
  - default to the material theme suite

> __PROTIP:__ For easy setup use the command `Random Theme: Copy all installed themes in settings`

example:

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
