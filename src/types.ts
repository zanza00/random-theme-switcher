type ThemeObject = { id: string; label: string;[key: string]: string; uiTheme: string };
type SaveThemeMessage = 'copyall' | 'removedtheme' | 'addedtheme';
type SwitchModes = 'manual' | 'startup' | 'daily' | 'interval' | 'typing';
