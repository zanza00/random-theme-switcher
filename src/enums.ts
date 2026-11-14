export const EXTENSION_NAME = 'randomThemeSwitcher';

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
  'Material Theme Lighter High Contrast',
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
  public static ThemeList = 'themeList';
  public static PreventReloadThemeList = 'preventReloadThemeList';
}

export class GlobalStateKeys {
  public static SkipNextStartupSwitch = 'skipNextStartupSwitch';
  public static LastSwitchDate = 'lastSwitchDate';
}

export class Messages {
  public static CopiedTheme = (count: number) => `Copied ${count} themes to settings`;

  public static AddedTheme = (theme: string) => `Added ${theme} to Random Theme List in settings`;

  public static RemovedTheme = (theme: string) => `Removed ${theme} from Random Theme List in settings`;

  public static SwitchedTheme = (theme: string) => `Theme switched to ${theme}`;

  public static AddToList = (theme: string) =>
    `Theme set to "${theme}",\nwould you like to add it to the randomThemeList ?`;

  public static NoCurrentTheme = 'No theme is currently selected in `workbench.colorTheme`';

  public static PickSide = 'Choose your side, May the code be with you !';

  public static ExcludePrompt =
    'Exclude themes that match this RegEx, or just Press `Enter` to ignore and continue';

  public static SideBoth = 'Both';

  public static SideLight = 'Light';

  public static SideDark = 'Dark';

  public static AddCurrentOption = 'Yes';

  public static AddWholePackOption = 'Add the whole pack';

  public static DismissOption = 'No';
}
