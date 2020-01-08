import * as vscode from 'vscode';
import { fromNullable, Option } from 'fp-ts/lib/Option';
import { getRandomInt } from './utils';
import { EXTENSION_NAME, LAST_THEME_NEEDS_TO_PERSIST, Messages, CommandsIds, SettingsKeys, LAST_SWITCH_DAY, ThemeTypes, MATERIAL_LIST } from './enums';


function getUserSettings(): vscode.WorkspaceConfiguration {
  return vscode.workspace.getConfiguration();
}

function getExtensionConfig(): vscode.WorkspaceConfiguration {
  return vscode.workspace.getConfiguration(EXTENSION_NAME);
}


async function changeTheme(
  context?: vscode.ExtensionContext): Promise<void> {
  isSwitching = true;

  const userSettings = getUserSettings();
  const i = getRandomInt(themeList.length - 1);
  const newTheme = themeList[i];
  const preventReloadThemeList: string[] = <string[]>userSettings.get(SettingsKeys.PreventReloadThemeList, MATERIAL_LIST);

  if (preventReloadThemeList.findIndex(mat => mat === newTheme) && context !== undefined) {
    await context.globalState.update(LAST_THEME_NEEDS_TO_PERSIST, true);
  }

  userSettings.update('workbench.colorTheme', newTheme, true).then(() => {
    if (switchMode !== 'typing') {
      vscode.window.showInformationMessage(`Theme switched to ${newTheme}`);
    }
    else {
      isSwitching = false;
    }
  });

}

async function getInstalledThemes(): Promise<string[]> {

  const promise = new Promise<string[]>((r, c) => {
    vscode.window.showQuickPick([ThemeTypes.Both, ThemeTypes.Ligth, ThemeTypes.Dark], { placeHolder: "Choose your side, May the code be with you !" }).then(async (choosedSide) => {
      const excludeRegexPattern = await vscode.window.showInputBox({ prompt: "Exclude themes that match this RegEx, or just Press `Enter` to ignore and continue" });
      const excludeRegex = excludeRegexPattern ? new RegExp(excludeRegexPattern) : null;
      if (choosedSide) {
        let result = vscode.extensions.all.reduce(
          (acc, ext) => {
            if (ext && ext.packageJSON && ext.packageJSON.contributes) {
              const themeInfo: Option<Array<ThemeObject>> = fromNullable(ext.packageJSON.contributes.themes);
              if (themeInfo._tag !== 'None') {
                return themeInfo.fold(acc, themes => {
                  return acc.concat(themes.filter((theme) => choosedSide === ThemeTypes.Both || theme.uiTheme === choosedSide).map((theme) => theme.id || theme.label));
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

async function saveThemes(
  themes: string[],
  message: string,
  userSettings = getUserSettings()
): Promise<void> {
  await userSettings.update('randomThemeSwitcher.themeList', themes, true);

  vscode.window.showInformationMessage(message);
}

async function getThemeList(
  extensionConfig: vscode.WorkspaceConfiguration,
  userSettings: vscode.WorkspaceConfiguration
): Promise<string[]> {
  return new Promise(async (r, c) => {
    const themeList: string[] = extensionConfig.get('themeList', []);

    if (themeList.length === 0) {
      const installedThemes = await getInstalledThemes();
      saveThemes(installedThemes, Messages.CopiedTheme(installedThemes.length));
      r(installedThemes);
    }

    const currentTheme = userSettings.get('workbench.colorTheme', '');
    if (themeList.length === 1) {
      vscode.window.showInformationMessage('Why only one theme ç_ç');
      r(themeList);
    }

    r(themeList.filter(theme => theme !== currentTheme));

  });
}

async function addCurrentTheme(extensionConfig = getExtensionConfig(), userSettings = getUserSettings()): Promise<void> {
  const themeList = await getThemeList(extensionConfig, userSettings);

  const currentThemeName: string | undefined = userSettings.get('workbench.colorTheme');

  if (typeof currentThemeName !== 'undefined') {
    saveThemes(themeList.concat(currentThemeName).sort(), Messages.AddedTheme(currentThemeName));
  }
}

async function removeCurrentTheme(extensionConfig = getExtensionConfig(), userSettings = getUserSettings()): Promise<void> {
  const themeList = await getThemeList(extensionConfig, userSettings);

  const currentThemeName: string | undefined = userSettings.get('workbench.colorTheme');

  if (typeof currentThemeName !== 'undefined') {
    saveThemes(themeList.filter(th => th !== currentThemeName), Messages.RemovedTheme(currentThemeName));
  }
}

let switchMode: SwitchModes = 'manual';
let isSwitching = false;
let themeList: string[] = [];

export async function activate(context: vscode.ExtensionContext): Promise<void> {

  const extensionConfig = getExtensionConfig();

  context.subscriptions.push(
    vscode.commands.registerCommand(CommandsIds.Switch, () => {
      changeTheme();
    }),
    vscode.commands.registerCommand(CommandsIds.CopyAll, async () => {
      const installedThemes = await getInstalledThemes();

      saveThemes(installedThemes, Messages.CopiedTheme(installedThemes.length));
    }),
    vscode.commands.registerCommand(CommandsIds.Add, () => {
      addCurrentTheme();
    }),
    vscode.commands.registerCommand(CommandsIds.Remove, () => {
      removeCurrentTheme();
    }),

    // it listen for theme manual switches, then update the LAST_THEME_MATERIAL settings.
    vscode.workspace.onDidChangeConfiguration(async (e) => {
      if (e.affectsConfiguration('workbench.colorTheme')) {
        const userSettings = getUserSettings();
        const currentTheme = userSettings.get('workbench.colorTheme', '');
        const oneMoreTimeThemeList: string[] = <string[]>userSettings.get(SettingsKeys.PreventReloadThemeList, MATERIAL_LIST);

        context.globalState.update(LAST_THEME_NEEDS_TO_PERSIST, oneMoreTimeThemeList.findIndex(mat => mat === currentTheme) !== -1);
        themeList = await getThemeList(getExtensionConfig(), getUserSettings());
      }
    })
  );

  const isLastThemeMaterial = context.globalState.get(LAST_THEME_NEEDS_TO_PERSIST, false);
  themeList = await getThemeList(extensionConfig, getUserSettings());
  switchMode = extensionConfig.get(SettingsKeys.SwitchMode, 'manual');

  if (switchMode !== 'manual' && !isLastThemeMaterial) {
    let lastSwitchDay = extensionConfig.get(LAST_SWITCH_DAY);
    let today = new Date().getDay();

    if (switchMode !== 'daily' || today !== lastSwitchDay) {
      await changeTheme(context);
    }

    if (switchMode === 'daily' && today !== lastSwitchDay) {
      extensionConfig.update(LAST_SWITCH_DAY, today, true);
    }

    if (switchMode === 'interval') {
      const switchInterval = extensionConfig.get(SettingsKeys.SwitchInterval, 3);
      setInterval(() => changeTheme(context), switchInterval * 60000);
    }
    else if (switchMode === 'typing') {
      vscode.workspace.onDidChangeTextDocument(event => {
        if (!event.contentChanges[0] || isSwitching || event.contentChanges[0].text.length > 1) {
          return;
        }
        changeTheme();
      });
    }
  } else if (isLastThemeMaterial) {
    context.globalState.update(LAST_THEME_NEEDS_TO_PERSIST, false);
  }
}

// this method is called when your extension is deactivated
export function deactivate() { }
