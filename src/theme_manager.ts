import * as vscode from 'vscode';
import { getRandomInt } from './utils';
import { LAST_THEME_NEEDS_TO_PERSIST, Messages, ThemeTypes } from './enums';
import { fromNullable, Option } from 'fp-ts/lib/Option';
import { IConfiguration } from './i_configuration';

export class ThemeManager {

  /**
   * Flammable EventEmitter
   */
  private _onDidJunkDetected: vscode.EventEmitter<{ junkList: string[], trigger: TriggerKind }> = new vscode.EventEmitter<{ junkList: string[], trigger: TriggerKind }>();

  /**
   * Event raised when themeManager detects junk while reloading the themeList
   */
  readonly onDidJunkDetected: vscode.Event<{ junkList: string[], trigger: TriggerKind }> = this._onDidJunkDetected.event;

  /**
   * Get or Set the switch mode.
   */
  public switchMode: SwitchModes = 'manual';

  /**
   * Indicates whether theme swap is in progress.
   */
  public isSwitching = false;

  /**
   * Internal themeList
   */
  private _themeList: string[] = [];

  /**
   *  The ThemeManager will swap themes when needed
   */
  constructor(private cfg: IConfiguration) {

  }

  /**
   * Swap the current color by choosing one at random from the themeList
   * @param context the optional extension context
   */
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

  /**
   * Adds the current theme to themeList
   */
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

  /**
   * Removes the current colorTheme from the themeList
   */
  public async removeCurrentTheme(): Promise<void> {
    const themeList = await this.getThemeList();
    const currentThemeName: string = this.cfg.getCurrentTheme();

    if (typeof currentThemeName !== 'undefined') {
      this.removeFromThemeList(themeList, currentThemeName);
    }
  }

  /**
   * It removes the `themeName` from the specified `themeList`
   * @param themeList the theme list
   * @param themeName the theme to remove
   */
  public removeFromThemeList(themeList: string[], themeName: string) {
    this.saveThemes(themeList.filter(th => th !== themeName), Messages.RemovedTheme(themeName));
  }


  /**
   * Stores the current themeList
   * @param message the output message
   */
  public async saveCurrentThemeList(
    message: string,
  ): Promise<void> {
    await this.saveThemes(this._themeList, message);
  }

  /**
   * Stores the `themes` list
   * @param themes the themeList
   * @param message the output message
   */
  public async saveThemes(
    themes: string[],
    message: string,
  ): Promise<void> {
    await this.cfg.saveThemes(themes);
    vscode.window.showInformationMessage(message);
  }

  /**
   * Provides stored `themeList`
   */
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

  /**
   * Reloads the `themeList` and checks its integrity
   * @param trigger optional source trigger to be passed to the event 
   */
  public async reloadThemeList(trigger: TriggerKind = 'none') {
    this.cfg.reload();

    const installedThemes = await this.getAllInstalledThemes();
    // Firstly keep an exact copy of the stored themeList
    const fullThemeList = this._themeList = await this.getThemeList();

    const listContainsJunk = await this.purgeThemeList(installedThemes);
    if (listContainsJunk) {
      // If stored list contains junk, raise the event
      const junkList = fullThemeList.filter((theme) => !installedThemes.includes(theme));

      this._onDidJunkDetected.fire({ junkList, trigger });
    }
  }

  /**
   * Detects whether the `_themeList` contains only valid themes, otherwise purges it from invalid entries
   * @param installedThemes list of valid theme names
   */
  public async purgeThemeList(installedThemes: string[]): Promise<boolean> {
    const fullThemeList = this._themeList;
    this._themeList = fullThemeList.filter((theme) => installedThemes.includes(theme));
    const hasBeenPurged = fullThemeList.length !== this._themeList.length;
    return hasBeenPurged;
  }

  /**
   * Provides all the VS Code installed themes 
   */
  public async getAllInstalledThemes(): Promise<string[]> {
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

  /**
   * Prompts the user about the theme sides and for an exclusion regex, in order to add themes from installed ones to `themeList` 
   * @param targetTheme When choosing `Add the whole pack`, indicates the theme that must be contained into theme pack, in order to accept its members 
   * @returns the matching themes
   */
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


