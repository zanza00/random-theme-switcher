import * as vscode from 'vscode';
import { LAST_THEME_NEEDS_TO_PERSIST, Messages, CommandsIds, EXTENSION_CONTEXT } from './enums';
import { ThemeManager } from './theme_manager';
import { IConfiguration } from './i_configuration';
import { ConfigurationManager } from './configuration_manager';
import { Linter } from './linter';

export async function activate(context: vscode.ExtensionContext): Promise<void> {

  const cfg: IConfiguration = new ConfigurationManager();
  const themeManager: ThemeManager = new ThemeManager(cfg);
  const linter: Linter = new Linter(context);

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
      if (e.affectsConfiguration('randomThemeSwitcher.themeList')) {
        themeManager.reloadThemeList();
      }
      if (e.affectsConfiguration('workbench.colorTheme')) {
        const currentTheme = cfg.getCurrentTheme();

        const preventReloadThemeList: string[] = cfg.getPreventReloadList();
        context.globalState.update(LAST_THEME_NEEDS_TO_PERSIST, preventReloadThemeList.findIndex(mat => mat === currentTheme) !== -1);

        themeManager.checkIfThemeIsInList(currentTheme);
      }
    }),

    // Strange: onDidChange is hidden, but reachable 
    (<any>vscode.extensions).onDidChange(() => {
      linter.deactivate();
      themeManager.reloadThemeList("extensionsGotDeactivatedOrUninstalled");
    }),

    themeManager.onDidJunkDetected(async (e) => {

      linter.activate(e.junkList);
      const junkCount = e.junkList.length;
      const message = e.trigger === "extensionsGotDeactivatedOrUninstalled" ?
        Messages.JunkDetectedAfterUninstallationOrDeactivation(junkCount) :
        Messages.JunkDetected(junkCount);
      const answer = await vscode.window.showWarningMessage(message, 'Yes', 'No');
      if (answer === 'Yes') {
        linter.deactivate();
        themeManager.saveCurrentThemeList(Messages.RemovedTheme(junkCount + ' theme' + (junkCount > 1 ? 's' : '')));
      }
    })
  );

  const isLastThemeMaterial = context.globalState.get(LAST_THEME_NEEDS_TO_PERSIST, false);
  themeManager.reloadThemeList();
  themeManager.switchMode = cfg.getSwitchMode();

  if (themeManager.switchMode !== 'manual') {
    let lastSwitchDay = cfg.getLastSwitchDay();
    let today = new Date().getDay();

    if ((themeManager.switchMode !== 'daily' || today !== lastSwitchDay) && !isLastThemeMaterial) {
      await themeManager.changeTheme();
    }

    if (themeManager.switchMode === 'daily' && today !== lastSwitchDay) {
      cfg.setLastSwitchDay(today);
    }

    if (themeManager.switchMode === 'interval') {
      const switchInterval = cfg.getSwitchInterval();
      setInterval(() => themeManager.changeTheme(), switchInterval * 60000);
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
