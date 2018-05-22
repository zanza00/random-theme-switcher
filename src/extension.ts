"use strict";

import * as vscode from "vscode";
import random = require("lodash/random");

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

function getThemeList(
  extensionConfig: vscode.WorkspaceConfiguration,
  userSettings: vscode.WorkspaceConfiguration
): string[] {
  const themeList: string[] | undefined = extensionConfig.get("themeList");
  if (themeList === undefined || themeList.length === 0) {
    return ["Default Dark+", "Default Light+"];
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
  const { extensionConfig, userSettings } = getSettings();

  const isActive = extensionConfig.get("switchOnStart");

  if (isActive) {
    changeTheme(userSettings, extensionConfig);
  }
}

// this method is called when your extension is deactivated
export function deactivate() {}
