export const EXTENSION_NAME = 'randomThemeSwitcher';
export const LAST_THEME_NEEDS_TO_PERSIST = 'last-theme-needs-to-persist';
export const LAST_SWITCH_DAY = 'lastSwitchDay';
export const MATERIAL_LIST = [
    'Material Theme',
    'Material Theme High Contrast',
    'Material Theme Darker',
    'Material Theme Darker High Contrast',
    'Material Theme Palenight',
    'Material Theme Palenight High Contrast',
    'Material Theme Ocean',
    'Material Theme Ocean High Contrast',
    'Material Theme Lighter',
    'Material Theme Lighter High Contrast'
];

export class CommandsIds {
    public static Switch = 'randomThemeSwitcher.switchTheme';
    public static CopyAll = 'randomThemeSwitcher.copyInstalledThemes';
    public static Add = 'randomThemeSwitcher.addCurrentTheme';
    public static Remove = 'randomThemeSwitcher.removeCurrentTheme';
}

export class SettingsKeys {
    public static SwitchMode = 'switchMode';
    public static SwitchInterval = 'switchInterval';
    public static PreventReloadThemeList = 'preventReloadThemeList';
}

export class Messages {
    public static CopiedTheme = (number: number) => `Copied ${number} themes to settings`;

    public static AddedTheme = (theme: string) => `Added ${theme} to Random Theme List in settings`;

    public static RemovedTheme = (theme: string) => `Removed ${theme} from Random Theme List in settings`;
}


export class ThemeTypes {
    public static Both: { key: string, value: string } = { key: 'Both', value: 'both', };
    public static Ligth: { key: string, value: string } = { key: 'Ligth', value: 'vs', };
    public static Dark: { key: string, value: string } = { key: 'Dark', value: 'vs-dark', };
}