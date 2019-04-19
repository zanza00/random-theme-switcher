'use strict';

import * as vscode from 'vscode';
import { fromNullable, Option } from 'fp-ts/lib/Option';
import { getRandomInt } from './utils';

const LAST_THEME_MATERIAL = 'last-theme-is-material';
const MATERIAL_LIST = [
  'Material Theme',
  'Material Theme High Contrast',
  'Material Theme Darker',
  'Material Theme Darker High Contrast',
  'Material Theme Palenight',
  'Material Theme Palenight High Contrast',
  'Material Theme Ocean',
  'Material Theme Ocean High Contrast',
  'Material Theme Lighter',
  'Material Theme Lighter High Contrast'
];

type ThemeObject = { id: string; label: string; [key: string]: string };
type SaveThemeMessage = 'copyall' | 'removedtheme' | 'addedtheme';

function getSaveMessages(
  messageType: SaveThemeMessage,
  opts: { number?: number; theme?: string } = { number: 0, theme: '' }
): string {
  switch (messageType) {
    case 'copyall':
      return `Copied ${opts.number} themes to settings`;
    case 'addedtheme':
      return `Added ${opts.theme} to Random Theme List in settings`;
    case 'removedtheme':
      return `Removed ${opts.theme} from Random Theme List in settings`;
  }
}

function getThemeName(theme: ThemeObject): string {
  return theme.id || theme.label;
}

function getUserSettings(): vscode.WorkspaceConfiguration {
  return vscode.workspace.getConfiguration();
}

function getExtensionConfig(): vscode.WorkspaceConfiguration {
  return vscode.workspace.getConfiguration('randomThemeSwitcher');
}

async function changeTheme({
  extensionConfig = getExtensionConfig(),
  userSettings = getUserSettings(),
  context
}: {
  context?: vscode.ExtensionContext;
  extensionConfig?: vscode.WorkspaceConfiguration;
  userSettings?: vscode.WorkspaceConfiguration;
} = {}) {
  const themeList = getThemeList(extensionConfig, userSettings);
  const i = getRandomInt(themeList.length - 1);
  const newTheme = themeList[i];

  if (MATERIAL_LIST.findIndex(mat => mat === newTheme) && context !== undefined) {
    await context.globalState.update(LAST_THEME_MATERIAL, true);
  }

  await userSettings.update('workbench.colorTheme', newTheme, true);
  await vscode.window.showInformationMessage(`Theme switched to ${newTheme}`);
}

function getInstalledThemes(): string[] {
  return vscode.extensions.all.reduce(
    (acc, ext) => {
      const themeInfo: Option<Array<ThemeObject>> = fromNullable(ext.packageJSON.contributes.themes);

      return themeInfo.fold(acc, themes => {
        return acc.concat(themes.map(getThemeName));
      });
    },
    [] as Array<string>
  );
}

async function saveThemes(
  themes: string[],
  messageType: SaveThemeMessage,
  messageTheme?: string,
  userSettings = getUserSettings()
): Promise<void> {
  await userSettings.update('randomThemeSwitcher.themeList', themes, true);

  vscode.window.showInformationMessage(getSaveMessages(messageType, { number: themes.length, theme: messageTheme }));
}

function getThemeList(
  extensionConfig: vscode.WorkspaceConfiguration,
  userSettings: vscode.WorkspaceConfiguration
): string[] {
  const themeList: string[] = extensionConfig.get('themeList', []);

  if (themeList.length === 0) {
    const installedThemes = getInstalledThemes();
    saveThemes(installedThemes, 'copyall');
    return installedThemes;
  }

  const currentTheme = userSettings.get('workbench.colorTheme', '');
  if (themeList.length === 1) {
    vscode.window.showInformationMessage('Why only one theme ç_ç');
    return themeList;
  }

  return themeList.filter(theme => theme !== currentTheme);
}

function addCurrentTheme(extensionConfig = getExtensionConfig(), userSettings = getUserSettings()) {
  const themeList = getThemeList(extensionConfig, userSettings);

  const currentThemeName: string | undefined = userSettings.get('workbench.colorTheme');

  if (typeof currentThemeName !== 'undefined') {
    saveThemes(themeList.concat(currentThemeName).sort(), 'addedtheme', currentThemeName);
  }
}

function removeCurrentTheme(extensionConfig = getExtensionConfig(), userSettings = getUserSettings()) {
  const themeList = getThemeList(extensionConfig, userSettings);

  const currentThemeName: string | undefined = userSettings.get('workbench.colorTheme');

  if (typeof currentThemeName !== 'undefined') {
    saveThemes(themeList.filter(th => th !== currentThemeName), 'removedtheme', currentThemeName);
  }
}

export async function activate(context: vscode.ExtensionContext) {
  const switchTheme = vscode.commands.registerCommand('randomThemeSwitcher.switchTheme', () => {
    changeTheme();
  });

  context.subscriptions.push(switchTheme);

  const copyThemesToSettings = vscode.commands.registerCommand('randomThemeSwitcher.copyInstalledThemes', () => {
    const installedThemes = getInstalledThemes();

    saveThemes(installedThemes, 'copyall');
  });

  context.subscriptions.push(copyThemesToSettings);

  const addCurrentThemeToSettogs = vscode.commands.registerCommand('randomThemeSwitcher.addCurrentTheme', () => {
    addCurrentTheme();
  });

  context.subscriptions.push(addCurrentThemeToSettogs);

  const removeCurrentThemeToSettogs = vscode.commands.registerCommand('randomThemeSwitcher.removeCurrentTheme', () => {
    removeCurrentTheme();
  });

  context.subscriptions.push(removeCurrentThemeToSettogs);

  const extensionConfig = getExtensionConfig();

  const isLastThemeMaterial = context.globalState.get(LAST_THEME_MATERIAL, false);
  const isActive = extensionConfig.get('switchOnOpen');

  if (isActive && !isLastThemeMaterial) {
    await changeTheme({ extensionConfig, context });
  } else if (isLastThemeMaterial) {
    await context.globalState.update(LAST_THEME_MATERIAL, false);
  }
}

// this method is called when your extension is deactivated
export function deactivate() {}
