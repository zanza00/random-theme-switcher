"use strict";

import * as vscode from "vscode";
import random = require("lodash/random");
import has = require("lodash/has");

const LAST_THEME_MATERIAL = "last-theme-is-material";
const MATERIAL_LIST = [
  "Material Theme",
  "Material Theme High Contrast",
  "Material Theme Darker",
  "Material Theme Darker High Contrast",
  "Material Theme Palenight",
  "Material Theme Palenight High Contrast",
  "Material Theme Ocean",
  "Material Theme Ocean High Contrast",
  "Material Theme Lighter",
  "Material Theme Lighter High Contrast"
];

function getUserSettings(): vscode.WorkspaceConfiguration {
  return vscode.workspace.getConfiguration();
}

function getExtensionConfig(): vscode.WorkspaceConfiguration {
  return vscode.workspace.getConfiguration("randomThemeSwitcher");
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
  const i = random(themeList.length - 1);
  const newTheme = themeList[i];

  if (MATERIAL_LIST.includes(newTheme) && context !== undefined) {
    await context.globalState.update(LAST_THEME_MATERIAL, true);
  }

  await userSettings.update("workbench.colorTheme", newTheme, true);
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

async function saveThemes(themes: string[], userSettings = getUserSettings()): Promise<void> {
  await userSettings.update("randomThemeSwitcher.themeList", themes, true);
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

export async function activate(context: vscode.ExtensionContext) {
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

  const isLastThemeMaterial = context.globalState.get(LAST_THEME_MATERIAL, false);
  const isActive = extensionConfig.get("switchOnOpen");

  if (isActive && !isLastThemeMaterial) {
    await changeTheme({ extensionConfig, context });
  } else if (isLastThemeMaterial) {
    await context.globalState.update(LAST_THEME_MATERIAL, false);
  }
}

// this method is called when your extension is deactivated
export function deactivate() {}
