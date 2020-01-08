# The issue

The Extension doesn't change the theme at startup.

# How was the problem solved?

    1. Corrected all the commas! (When settings.JSON files aren't well formatted are unaccessible from the extensions)
      1.1. (Another error was about space characters that were in a different encoding, you can see it looking `workbench.colorTheme` squiggles)
    2. All I left was this key "workbench.colorTheme": "eppz!", and yours was removed. (The extension will re-create its keys)

    3. Restarted the IDE.

Then I saw these entries at the very end of the keys (without any interference on my part):
``` JSON
  // Autohotkey Manager:     
  "ahk.defaultArgs": "/r",
  "ahk.onArgs.run": true,
  "ahk.onSave.run": true,
"ahk.displaySwitchButton": true,
"randomThemeSwitcher.themeList": [
    "Ayu One",
    "Dracula Soft",
    "eppz!",
    "Flatland Monokai",
    "Sublime Material Theme - Dark",
    "Noctis Minimus",
    "Dobri Next -A07- Oxford",
    "One Dark Pro"
]
}
```