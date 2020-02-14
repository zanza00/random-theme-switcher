import * as vscode from 'vscode';
import { getRandomInt } from './utils';
import { LAST_THEME_NEEDS_TO_PERSIST, Messages, ThemeTypes } from './enums';
import { fromNullable, Option } from 'fp-ts/lib/Option';
import { IConfiguration } from './i_configuration';

export class ThemeManager {

  private _onDidJunkDetected: vscode.EventEmitter<{ junkList: string[] | undefined, uninstalledExtensionTrigger: boolean }> = new vscode.EventEmitter<{ junkList: string[] | undefined, uninstalledExtensionTrigger: boolean }>();
  readonly onDidJunkDetected: vscode.Event<{ junkList: string[] | undefined, uninstalledExtensionTrigger: boolean }> = this._onDidJunkDetected.event;

  public switchMode: SwitchModes = 'manual';
  public isSwitching = false;
  public _themeList: string[] = [];

  /**
   *  The ThemeManager will swap themes when needed
   */
  constructor(private cfg: IConfiguration) {

  }

  public async changeTheme(
    context?: vscode.ExtensionContext): Promise<void> {
    this.isSwitching = true;

    const currentTheme = this.cfg.getCurrentTheme();
    const themeList = this._themeList.filter(theme => theme !== currentTheme);
    const i = getRandomInt(themeList.length - 1);
    const newTheme = themeList[i];
    const preventReloadThemeList: string[] = <string[]>this.cfg.getPreventReloadList();

    if (preventReloadThemeList.findIndex(mat => mat === newTheme) && context !== undefined) {
      await context.globalState.update(LAST_THEME_NEEDS_TO_PERSIST, true);
    }

    await this.cfg.setCurrentThemeTo(newTheme);

    if (this.switchMode !== 'typing') {
      vscode.window.showInformationMessage(`Theme switched to ${newTheme}`);
    }
    this.isSwitching = false;
  }


  public async addCurrentTheme(): Promise<void> {
    const themeList = await this.getThemeList();
    const currentThemeName: string = this.cfg.getCurrentTheme();

    this.addToThemeList(themeList, currentThemeName);
  }

  /**
   * Adds theme or themes to themeList
   * @param themeList the target themeList
   * @param what a theme or a list of themes
   */
  public addToThemeList(themeList: string[], what: string | string[] | undefined) {
    if (typeof what !== 'undefined') {
      const keys = typeof what === typeof Array ?
        (<string[]>what).join('\n') :
        <string>what;
      const resultingList = [...new Set(themeList.concat(what).sort())];
      this.saveThemes(resultingList, Messages.AddedTheme(keys));
    }
  }

  public async removeCurrentTheme(): Promise<void> {
    const themeList = await this.getThemeList();
    const currentThemeName: string = this.cfg.getCurrentTheme();

    if (typeof currentThemeName !== 'undefined') {
      this.removeFromThemeList(themeList, currentThemeName);
    }
  }

  public removeFromThemeList(themeList: string[], themeName: string) {
    this.saveThemes(themeList.filter(th => th !== themeName), Messages.RemovedTheme(themeName));
  }


  public async saveThemes(
    themes: string[],
    message: string,
  ): Promise<void> {
    await this.cfg.saveThemes(themes);
    vscode.window.showInformationMessage(message);
  }

  public async getThemeList(): Promise<string[]> {
    return new Promise(async (r, _) => {
      const themeList: string[] = this.cfg.getThemeList();

      if (themeList.length === 0) {
        const installedThemes = await this.pickFromInstalledThemes();
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

  public async reloadThemeList(uninstalledExtensionTrigger: boolean = false) {
    this.cfg.reload();

    const installedThemes = await this.getInstalledThemes();
    const fullThemeList = this._themeList = await this.getThemeList();
    const listContainsJunk = await this.purgeThemeList(installedThemes);
    if (listContainsJunk) {
      const junkList = fullThemeList.filter((theme) => !installedThemes.includes(theme));
      this._onDidJunkDetected.fire({ junkList, uninstalledExtensionTrigger });
    }
  }

  public async purgeThemeList(installedThemes: string[]): Promise<boolean> {
    const fullThemeList = this._themeList;
    this._themeList = fullThemeList.filter((theme) => installedThemes.includes(theme));
    const hasBeenPurged = fullThemeList.length !== this._themeList.length;
    return hasBeenPurged;
  }

  public async getInstalledThemes(): Promise<string[]> {
    const promise = new Promise<string[]>((r) => {
      let result = vscode.extensions.all.reduce(
        (acc, ext) => {
          if (ext && ext.packageJSON && ext.packageJSON.contributes) {
            const themeInfo: Option<Array<ThemeObject>> = fromNullable(ext.packageJSON.contributes.themes);
            if (themeInfo._tag !== 'None') {
              return themeInfo.fold(acc, themes => {
                return acc.concat(themes.map((theme) => theme.id || theme.label));
              });
            }
          }
          return acc;
        },
        [] as Array<string>
      );
      r(result);
    });
    return promise;
  }

  public async pickFromInstalledThemes(targetTheme: string | undefined = undefined): Promise<string[]> {

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


