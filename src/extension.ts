"use strict";

import * as vscode from "vscode";
import { random } from "lodash";

export function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand("randomThemeSwitcher.switchTheme", () => {
    const userSettings = vscode.workspace.getConfiguration();
    const extensionConfig = vscode.workspace.getConfiguration("randomThemeSwitcher");

    let themeList: string[] | undefined = extensionConfig.get("themeList");
    if (themeList === undefined || themeList.length === 0) {
      themeList = ["Default Dark+", "Default Light+"];
    }
    console.log("themeList", themeList);

    const i = random(themeList.length - 1);
    userSettings.update("workbench.colorTheme", themeList[i], true);
    vscode.window.showInformationMessage(`Theme switched to ${themeList[i]}`);
  });

  context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
