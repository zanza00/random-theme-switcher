export interface IConfiguration {
    getSwitchInterval(): number;
    setLastSwitchDay(today: number): void;
    getLastSwitchDay(): number;
    getSwitchMode(): SwitchModes;
    getPreventReloadList(): string[];
    reload(): void;
    getCurrentTheme(): string;
    getThemeList(): string[];
    saveThemes(themes: string[]): Thenable<void>;
    setCurrentThemeTo(newTheme: string): Thenable<void>;
}