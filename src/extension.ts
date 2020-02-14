import * as vscode from 'vscode';
import { LAST_THEME_NEEDS_TO_PERSIST, Messages, CommandsIds, EXTENSION_CONTEXT } from './enums';
import { ThemeManager } from './theme_manager';
import { IConfiguration } from './i_configuration';
import { ConfigurationManager } from './configuration_manager';

export async function activate(context: vscode.ExtensionContext): Promise<void> {

  const cfg: IConfiguration = new ConfigurationManager();
  const themeManager: ThemeManager = new ThemeManager(cfg);

  const vscodeExtensions: any = vscode.extensions;
  context.subscriptions.push(
    vscode.commands.registerCommand(CommandsIds.Switch, () => {
      themeManager.changeTheme();
    }),
    vscode.commands.registerCommand(CommandsIds.CopyAll, async () => {
      const installedThemes = await themeManager.pickFromInstalledThemes();

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
      themeManager.reloadThemeList();
      if (e.affectsConfiguration('workbench.colorTheme')) {
        const currentTheme = cfg.getCurrentTheme();

        const preventReloadThemeList: string[] = <string[]>cfg.getPreventReloadList();
        context.globalState.update(LAST_THEME_NEEDS_TO_PERSIST, preventReloadThemeList.findIndex(mat => mat === currentTheme) !== -1);

        themeManager.getThemeList().then((themeList) => {
          if (!themeList.includes(currentTheme)) {
            const wholePack = `Add the whole pack`;
            vscode.window.showInformationMessage(`Theme set to "${currentTheme}",\nwould you like to add it to the randomThemeList ?`, `Yes`, wholePack, `No`).then(async (res) => {
              switch (res) {
                case "Yes":
                  themeManager.addToThemeList(themeList, currentTheme);
                  break;
                case wholePack:
                  const pack = await themeManager.pickFromInstalledThemes(currentTheme);
                  themeManager.addToThemeList(themeList, pack);
                  break;
              }
              themeList = await themeManager.getThemeList();
            });
          }
        });
      }
    }),
    vscodeExtensions.onDidChange(() => {
      themeManager.reloadThemeList(true);
    }),
    themeManager.onDidJunkDetected((junkListReport) => {
      let message;
      if (junkListReport.uninstalledExtensionTrigger) {
        message = 'Theme uninstalled, do you want to remove it from the randomThemeList too ?';
      }
      else {
        message = 'The randomThemeList contains junk.. do you want to remove them automatically ?';
      }
      vscode.window.showWarningMessage(message, 'yes', 'no');
    })
  );

  const isLastThemeMaterial = context.globalState.get(LAST_THEME_NEEDS_TO_PERSIST, false);
  themeManager.reloadThemeList();
  themeManager.switchMode = cfg.getSwitchMode();

  if (themeManager.switchMode !== 'manual' && !isLastThemeMaterial) {
    let lastSwitchDay = cfg.getLastSwitchDay();
    let today = new Date().getDay();

    if (themeManager.switchMode !== 'daily' || today !== lastSwitchDay) {
      await themeManager.changeTheme(context);
    }

    if (themeManager.switchMode === 'daily' && today !== lastSwitchDay) {
      cfg.setLastSwitchDay(today);
    }

    if (themeManager.switchMode === 'interval') {
      const switchInterval = cfg.getSwitchInterval();
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
