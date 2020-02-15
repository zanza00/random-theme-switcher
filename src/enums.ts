export const EXTENSION_NAME = 'randomThemeSwitcher';
export const EXTENSION_CONTEXT = 'randomThemeSwitcherIsEnabled';
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
    public static JunkDetected = (junkCount: number) => junkCount > 1 ?
        `The randomThemeList contains invalid theme names: do you want to fix them automatically ?` :
        `The randomThemeList contains an invalid theme name: do you want to fix it automatically ?`
    public static JunkDetectedAfterUninstallationOrDeactivation = (junkCount: number) => junkCount > 1 ?
        `Themes uninstalled/deactivated, do you want to remove them automatically from the randomThemeList too ?` :
        `Theme uninstalled/deactivated, do you want to remove it from the randomThemeList too ?`
    public static NotAValidTheme: string = "This is not a valid theme name.";
}


export class ThemeTypes {
    public static Both: { label: string, value: string } = { label: 'Both', value: 'both' };
    public static Light: { label: string, value: string } = { label: 'Light', value: 'vs' };
    public static Dark: { label: string, value: string } = { label: 'Dark', value: 'vs-dark' };
}