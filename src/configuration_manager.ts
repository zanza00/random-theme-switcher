import { IConfiguration } from "./i_configuration";
import { EXTENSION_NAME, SettingsKeys, MATERIAL_LIST, LAST_SWITCH_DAY } from './enums';
import * as vscode from 'vscode';

/**
 * It centralizes the configuration access.
 */
export class ConfigurationManager implements IConfiguration {
    private extensionConfig!: vscode.WorkspaceConfiguration;
    private userSettings!: vscode.WorkspaceConfiguration;

    constructor() {
        this.reload();
    }

    public reload(): void {
        this.reloadExtensionConfig();
        this.reloadUserSettings();
    }

    public getCurrentTheme(): string {
        this.reloadUserSettings();
        return this.userSettings.get('workbench.colorTheme', '');
    }
    public setCurrentThemeTo(newTheme: string): Thenable<void> {
        // this.reloadUserSettings();
        return this.userSettings.update('workbench.colorTheme', newTheme, true);
    }

    public saveThemes(themes: string[]): Promise<boolean> {
        return new Promise((r, c) => {
            try {
                this.userSettings.update('randomThemeSwitcher.themeList', themes, true);
                r(true);
            } catch (err) {
                vscode.window.showErrorMessage('An error has occurred while saving the themeList: ' + err);
                r(false);
            }
        });
    }

    public getThemeList(): string[] {
        return this.extensionConfig.get<string[]>('themeList', []);
    }

    public getPreventReloadList(): string[] {
        return this.userSettings.get(SettingsKeys.PreventReloadThemeList, MATERIAL_LIST);
    }

    public getSwitchMode(): SwitchModes {
        return this.extensionConfig.get(SettingsKeys.SwitchMode, 'manual');
    }
    public getLastSwitchDay(): number {
        return this.extensionConfig.get<number>(LAST_SWITCH_DAY, 0);
    }

    public getSwitchInterval(): number {
        return this.extensionConfig.get<number>(SettingsKeys.SwitchInterval, 3);
    }

    public setLastSwitchDay(value: number): Thenable<void> {
        return this.extensionConfig.update(LAST_SWITCH_DAY, value, true);
    }

    public getMaxLastSwitchedThemeCount(): number {
        return this.extensionConfig.get(SettingsKeys.MaxLastSwitchedThemeCount, 10);
    }

    private getExtensionConfig(): vscode.WorkspaceConfiguration {
        return vscode.workspace.getConfiguration(EXTENSION_NAME);
    }

    private getUserSettings(): vscode.WorkspaceConfiguration {
        return vscode.workspace.getConfiguration();
    }

    private reloadExtensionConfig(): void {
        this.extensionConfig = this.getExtensionConfig();
    }

    public reloadUserSettings(): void {
        this.userSettings = this.getUserSettings();
    }

}