/**
 * Interface for the configuration access.
 * Implementing this interface could help in testing the ThemeManager.
 */
export interface IConfiguration {

    getLastSwitchDay(): number;
    setLastSwitchDay(today: number): void;

    reload(): void;
    reloadUserSettings(): void;

    getCurrentTheme(): string;
    setCurrentThemeTo(newTheme: string): Thenable<void>;

    getSwitchInterval(): number;
    getSwitchMode(): SwitchModes;
    getPreventReloadList(): string[];
    getThemeList(): string[];
    saveThemes(themes: string[]): Thenable<void>;
}