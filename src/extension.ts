"use strict";

import * as vscode from "vscode";
import random = require("lodash/random");
import has = require("lodash/has");

function getSettings(): {
  userSettings: vscode.WorkspaceConfiguration;
  extensionConfig: vscode.WorkspaceConfiguration;
} {
  const userSettings = vscode.workspace.getConfiguration();
  const extensionConfig = vscode.workspace.getConfiguration("randomThemeSwitcher");
  return { userSettings, extensionConfig };
}

function changeTheme(userSettings: vscode.WorkspaceConfiguration, extensionConfig: vscode.WorkspaceConfiguration) {
  const themeList = getThemeList(extensionConfig, userSettings);
  const i = random(themeList.length - 1);
  const newTheme = themeList[i];
  userSettings.update("workbench.colorTheme", newTheme, true);
  vscode.window.showInformationMessage(`Theme switched to ${newTheme}`);
}

function getInstalledThemes(): string[] {
  return vscode.extensions.all.reduce((acc, ext) => {
    const isTheme = has(ext, "packageJSON.contributes.themes");
    if (!isTheme) return acc;
    const themeNames = ext.packageJSON.contributes.themes.map(th => th.id || th.label);
    return acc.concat(themeNames);
  }, []);
}

function getThemeList(
  extensionConfig: vscode.WorkspaceConfiguration,
  userSettings: vscode.WorkspaceConfiguration
): string[] {
  const themeList: string[] = extensionConfig.get("themeList", []);
  if (themeList.length === 0) {
    return getInstalledThemes();
  }
  const currentTheme = userSettings.get("workbench.colorTheme", "");
  return themeList.filter(theme => theme !== currentTheme);
}

export function activate(context: vscode.ExtensionContext) {
  let switchTheme = vscode.commands.registerCommand("randomThemeSwitcher.switchTheme", () => {
    const { extensionConfig, userSettings } = getSettings();

    changeTheme(userSettings, extensionConfig);
  });

  context.subscriptions.push(switchTheme);

  let copyThemesToSettings = vscode.commands.registerCommand("randomThemeSwitcher.copyInstalledThemes", () => {
    const installedThemes = getInstalledThemes();
    const { userSettings } = getSettings();
    userSettings.update("randomThemeSwitcher.themeList", installedThemes, true);
    vscode.window.showInformationMessage(`Copied ${installedThemes.length} themes to settings`);
  });

  context.subscriptions.push(copyThemesToSettings);

  const { extensionConfig, userSettings } = getSettings();

  const isActive = extensionConfig.get("switchOnOpen");

  if (isActive) {
    changeTheme(userSettings, extensionConfig);
  }
}

// this method is called when your extension is deactivated
export function deactivate() {}
