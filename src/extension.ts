"use strict";

import * as vscode from "vscode";
import random = require("lodash/random");
import has = require("lodash/has");

function getUserSettings(): vscode.WorkspaceConfiguration {
  return vscode.workspace.getConfiguration();
}

function getExtensionConfig(): vscode.WorkspaceConfiguration {
  return vscode.workspace.getConfiguration("randomThemeSwitcher");
}

function changeTheme({ extensionConfig = getExtensionConfig(), userSettings = getUserSettings() } = {}) {
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

    const themeNames = ext.packageJSON.contributes.themes.map(
      (th: { id: string; label: string; [key: string]: string }) => th.id || th.label
    );
    return acc.concat(themeNames);
  }, []);
}

function saveThemes(themes: string[], userSettings = getUserSettings()): void {
  userSettings.update("randomThemeSwitcher.themeList", themes, true);
  vscode.window.showInformationMessage(`Copied ${themes.length} themes to settings`);
}

function getThemeList(
  extensionConfig: vscode.WorkspaceConfiguration,
  userSettings: vscode.WorkspaceConfiguration
): string[] {
  const themeList: string[] = extensionConfig.get("themeList", []);

  if (themeList.length === 0) {
    const installedThemes = getInstalledThemes();
    saveThemes(installedThemes, userSettings);
    return installedThemes;
  }

  const currentTheme = userSettings.get("workbench.colorTheme", "");
  if (themeList.length === 1) {
    vscode.window.showInformationMessage("Why only one theme ç_ç");
    return themeList;
  }

  return themeList.filter(theme => theme !== currentTheme);
}

export function activate(context: vscode.ExtensionContext) {
  let switchTheme = vscode.commands.registerCommand("randomThemeSwitcher.switchTheme", () => {
    changeTheme();
  });

  context.subscriptions.push(switchTheme);

  let copyThemesToSettings = vscode.commands.registerCommand("randomThemeSwitcher.copyInstalledThemes", () => {
    const installedThemes = getInstalledThemes();

    saveThemes(installedThemes);
  });

  context.subscriptions.push(copyThemesToSettings);

  const extensionConfig = getExtensionConfig();

  const isActive = extensionConfig.get("switchOnOpen");

  if (isActive) {
    changeTheme({ extensionConfig });
  }
}

// this method is called when your extension is deactivated
export function deactivate() {}
