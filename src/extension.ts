import * as vscode from 'vscode';
import { getExtensionConfig, getUserSettings } from './utils';
import { LAST_THEME_NEEDS_TO_PERSIST, Messages, CommandsIds, SettingsKeys, LAST_SWITCH_DAY, MATERIAL_LIST, EXTENSION_CONTEXT } from './enums';
import { themeManager } from './theme_manager';

export async function activate(context: vscode.ExtensionContext): Promise<void> {

  const extensionConfig = getExtensionConfig();

  context.subscriptions.push(
    vscode.commands.registerCommand(CommandsIds.Switch, () => {
      themeManager.changeTheme();
    }),
    vscode.commands.registerCommand(CommandsIds.CopyAll, async () => {
      const installedThemes = await themeManager.getInstalledThemes();

      themeManager.saveThemes(installedThemes, Messages.CopiedTheme(installedThemes.length));
    }),
    vscode.commands.registerCommand(CommandsIds.Add, () => {
      themeManager.addCurrentTheme();
    }),
    vscode.commands.registerCommand(CommandsIds.Remove, () => {
      themeManager.removeCurrentTheme();
    }),

    // it listen for theme manual switches, then updates the LAST_THEME_MATERIAL setting.
    vscode.workspace.onDidChangeConfiguration(async (e) => {
      if (e.affectsConfiguration('workbench.colorTheme')) {
        const userSettings = getUserSettings();
        const currentTheme = userSettings.get('workbench.colorTheme', '');

        const preventReloadThemeList: string[] = <string[]>userSettings.get(SettingsKeys.PreventReloadThemeList, MATERIAL_LIST);
        context.globalState.update(LAST_THEME_NEEDS_TO_PERSIST, preventReloadThemeList.findIndex(mat => mat === currentTheme) !== -1);
        themeManager.getThemeList(getExtensionConfig()).then((themeList) => {
          if (!themeList.includes(currentTheme)) {
            const wholePack = `Add the whole pack`;
            vscode.window.showInformationMessage(`Theme set to "${currentTheme}",\nwould you like to add it to the randomThemeList ?`, `Yes`, wholePack, `No`).then(async (res) => {
              switch (res) {
                case "Yes":
                  themeManager._addToThemeList(themeList, currentTheme);
                  break;
                case wholePack:
                  const pack = await themeManager.getInstalledThemes(currentTheme);
                  themeManager._addToThemeList(themeList, pack);
                  break;
              }
              themeList = await themeManager.getThemeList(getExtensionConfig());
            });
          }
        });
      }
    })
  );

  const isLastThemeMaterial = context.globalState.get(LAST_THEME_NEEDS_TO_PERSIST, false);
  themeManager._themeList = await themeManager.getThemeList(extensionConfig);
  themeManager.switchMode = extensionConfig.get(SettingsKeys.SwitchMode, 'manual');

  if (themeManager.switchMode !== 'manual' && !isLastThemeMaterial) {
    let lastSwitchDay = extensionConfig.get(LAST_SWITCH_DAY);
    let today = new Date().getDay();

    if (themeManager.switchMode !== 'daily' || today !== lastSwitchDay) {
      await themeManager.changeTheme(context);
    }

    if (themeManager.switchMode === 'daily' && today !== lastSwitchDay) {
      extensionConfig.update(LAST_SWITCH_DAY, today, true);
    }

    if (themeManager.switchMode === 'interval') {
      const switchInterval = extensionConfig.get(SettingsKeys.SwitchInterval, 3);
      setInterval(() => themeManager.changeTheme(context), switchInterval * 60000);
    }
    else if (themeManager.switchMode === 'typing') {
      vscode.workspace.onDidChangeTextDocument(event => {
        if (!event.contentChanges[0] || themeManager.isSwitching || event.contentChanges[0].text.length > 1) {
          return;
        }
        themeManager.changeTheme();
      });
    }
  } else if (isLastThemeMaterial) {
    context.globalState.update(LAST_THEME_NEEDS_TO_PERSIST, false);
  }

  vscode.commands.executeCommand('setContext', EXTENSION_CONTEXT, true);
}

export function deactivate() {
  vscode.commands.executeCommand('setContext', EXTENSION_CONTEXT, false);
}
