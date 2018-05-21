# Random Theme Switcher

A simple extension that choose randomly and apply a theme.

## Features

- Open the command palette and search for `random`
- Choose `Random Theme: Switch to a Random Theme`

![Change the current Theme](media/rtm.gif)

## Extension Settings

This extension choos a random theme from a list in the user settngs.

* `randomThemeSwitcher.themeList`: a list of string with the exact same name of `"workbench.colorTheme"`

example:

```
"randomThemeSwitcher.themeList": [
        "Andromeda Italic",
        "Cobalt2",
        "Dracula",
        "Tomorrow Night Blue",
        "Ayu Dark",
        "One Monokai",
        "Night Owl"
],
```

for now this process is manual

## TODO

[ ] Change theme at startup.
[ ] Add the current theme to the theme list
[ ] If no list is provided use the installed themes
[ ] Add key chord for changing theme

## Release Notes

### 0.0.1

Initial release, can only change the theme via custom palette command
