import * as vscode from 'vscode';
import { getUserSettings, getRandomInt, getExtensionConfig } from './utils';
import { SettingsKeys, MATERIAL_LIST, LAST_THEME_NEEDS_TO_PERSIST, Messages, ThemeTypes } from './enums';
import { fromNullable, Option } from 'fp-ts/lib/Option';

class ThemeManager {
  public switchMode: SwitchModes = 'manual';
  public isSwitching = false;
  public _themeList: string[] = [];

  public async changeTheme(
    context?: vscode.ExtensionContext): Promise<void> {
    this.isSwitching = true;

    const userSettings = getUserSettings();
    const currentTheme = userSettings.get('workbench.colorTheme', '');
    const themeList = this._themeList.filter(theme => theme !== currentTheme);
    const i = getRandomInt(themeList.length - 1);
    const newTheme = themeList[i];
    const preventReloadThemeList: string[] = <string[]>userSettings.get(SettingsKeys.PreventReloadThemeList, MATERIAL_LIST);

    if (preventReloadThemeList.findIndex(mat => mat === newTheme) && context !== undefined) {
      await context.globalState.update(LAST_THEME_NEEDS_TO_PERSIST, true);
    }

    await userSettings.update('workbench.colorTheme', newTheme, true);
    if (this.switchMode !== 'typing') {
      vscode.window.showInformationMessage(`Theme switched to ${newTheme}`);
    }
    this.isSwitching = false;
  }


  public async  addCurrentTheme(extensionConfig = getExtensionConfig(), userSettings = getUserSettings()): Promise<void> {
    const themeList = await this.getThemeList(extensionConfig);
    const currentThemeName: string | undefined = userSettings.get('workbench.colorTheme');

    this._addToThemeList(themeList, currentThemeName);
  }

  /**
   * Adds theme or themes to themeList
   * @param themeList the target themeList
   * @param what a theme or a list of themes
   */
  public _addToThemeList(themeList: string[], what: string | string[] | undefined) {
    if (typeof what !== 'undefined') {
      const keys = typeof what === typeof Array ?
        (<string[]>what).join('\n') :
        <string>what;
      const resultingList = [...new Set(themeList.concat(what).sort())];
      this.saveThemes(resultingList, Messages.AddedTheme(keys));
    }
  }

  public async  removeCurrentTheme(extensionConfig = getExtensionConfig(), userSettings = getUserSettings()): Promise<void> {
    const themeList = await this.getThemeList(extensionConfig);

    const currentThemeName: string | undefined = userSettings.get('workbench.colorTheme');

    if (typeof currentThemeName !== 'undefined') {
      this._removeFromThemeList(themeList, currentThemeName);
    }
  }

  public _removeFromThemeList(themeList: string[], currentThemeName: string) {
    this.saveThemes(themeList.filter(th => th !== currentThemeName), Messages.RemovedTheme(currentThemeName));
  }



  public async saveThemes(
    themes: string[],
    message: string,
    userSettings = getUserSettings()
  ): Promise<void> {
    await userSettings.update('randomThemeSwitcher.themeList', themes, true);

    vscode.window.showInformationMessage(message);
  }

  public async  getThemeList(
    extensionConfig: vscode.WorkspaceConfiguration,
  ): Promise<string[]> {
    return new Promise(async (r, _) => {
      const themeList: string[] = extensionConfig.get('themeList', []);

      if (themeList.length === 0) {
        const installedThemes = await this.getInstalledThemes();
        this.saveThemes(installedThemes, Messages.CopiedTheme(installedThemes.length));
        r(installedThemes);
      }

      if (themeList.length === 1) {
        vscode.window.showInformationMessage('Why only one theme ç_ç');
        r(themeList);
      }

      r(themeList);
    });
  }


  public async getInstalledThemes(targetTheme: string | undefined = undefined): Promise<string[]> {

    const promise = new Promise<string[]>((r, c) => {
      vscode.window.showQuickPick([ThemeTypes.Both.label, ThemeTypes.Light.label, ThemeTypes.Dark.label], { placeHolder: "Choose your side, May the code be with you !" }).then(async (chosenSide) => {
        if (chosenSide === ThemeTypes.Light.label) { chosenSide = ThemeTypes.Light.value; }
        else if (chosenSide === ThemeTypes.Dark.label) { chosenSide = ThemeTypes.Dark.value; }

        const excludeRegexPattern = await vscode.window.showInputBox({ prompt: "Exclude themes that match this RegEx, or just Press `Enter` to ignore and continue" });
        const excludeRegex = excludeRegexPattern ? new RegExp(excludeRegexPattern) : null;
        if (chosenSide) {
          let result = vscode.extensions.all.reduce(
            (acc, ext) => {
              if (ext && ext.packageJSON && ext.packageJSON.contributes) {
                const themeInfo: Option<Array<ThemeObject>> = fromNullable(ext.packageJSON.contributes.themes);
                if (themeInfo._tag !== 'None') {
                  return themeInfo.fold(acc, themes => {
                    if (targetTheme && themes.findIndex(theme => theme.label === targetTheme) === -1) {
                      return acc;
                    }
                    return acc.concat(themes.filter((theme) => chosenSide === ThemeTypes.Both.label || theme.uiTheme === chosenSide).map((theme) => theme.id || theme.label));
                  });
                }
              }
              return acc;
            },
            [] as Array<string>
          );

          try {
            if (excludeRegex) {
              result = result.filter(themeName => !excludeRegex.test(themeName));
            }
          } catch (err) {
            vscode.window.showErrorMessage(err);
          }
          finally {
            r(result);
          }
        }
        else {
          c(null);
        }

      });
    });

    return promise;
  }
}

export const themeManager: ThemeManager = new ThemeManager();


