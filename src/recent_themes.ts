import * as vscode from 'vscode';
import { LAST_SWITCHED_THEME_LIST_STORAGE_KEY } from './enums';
import { IConfiguration } from './i_configuration';

/**
 * It stores only `maxLastSwitchedThemeCount` selected colorThemes in `_lastSwitchedThemeList`.
 * Allow users to `pickThemeFromRecentThemes()`
 */
export class RecentThemes {

    /**
     * Internal circular list
     */
    private _lastSwitchedThemeList: string[];
    /**
     * Max number of items inside `_lastSwitchedThemeList`
     */
    public maxLastSwitchedThemeCount: number;
    /**
     * Indicates whether the quickPick is opened.
     * Used for preventing colorTheme changes events. 
     */
    public isQuickPickOpen: boolean;

    /**
     * The Configuration manager.
     * It's static because is the only way that can be reachable in the `onDidSelectItem` quickPick callback
     */
    private static cfg: IConfiguration;

    /**
     *  It creates a RecentThemes object
     * @param context the extension context, used for store and retrieve `_lastSwitchedThemeList`
     * @param cfg the configuration manager
     */
    constructor(private context: vscode.ExtensionContext, cfg: IConfiguration) {
        RecentThemes.cfg = cfg;
        this.maxLastSwitchedThemeCount = cfg.getMaxLastSwitchedThemeCount();
        this._lastSwitchedThemeList = context.globalState.get(LAST_SWITCHED_THEME_LIST_STORAGE_KEY) || [];
        this.isQuickPickOpen = false;
    }

    /**
     * Adds themes to `_lastSwitchedThemeList`
     */
    public add(themeName: string): void {
        this._lastSwitchedThemeList.push(themeName);
        while (this._lastSwitchedThemeList.length > this.maxLastSwitchedThemeCount) {
            this._lastSwitchedThemeList.shift();
        }

        this.context.globalState.update(LAST_SWITCHED_THEME_LIST_STORAGE_KEY, this._lastSwitchedThemeList);
    }

    /**
     * Opens a quickPick asking the user to pick up a previously set theme again.
     */
    public async pickThemeFromRecentThemes(): Promise<string | undefined> {
        const currentTheme = RecentThemes.cfg.getCurrentTheme();
        let chosenTheme;
        try {
            this.isQuickPickOpen = true;
            chosenTheme = await vscode.window.showQuickPick(this._lastSwitchedThemeList, { placeHolder: 'Select a theme to restore', canPickMany: false, onDidSelectItem: this.onDidSelectItem });
        } finally {
            this.isQuickPickOpen = false;
        }
        return chosenTheme || currentTheme;
    }

    /**
     * Callback: it previews the selected theme
     * @param themeName the selected themeName
     */
    public async onDidSelectItem(themeName: string): Promise<any> {
        try {
            RecentThemes.cfg.reloadUserSettings();
            await RecentThemes.cfg.setCurrentThemeTo(themeName);
        } catch (err) {
            vscode.window.showErrorMessage('Can\'t preview the theme: ' + err);
        }
    }
}