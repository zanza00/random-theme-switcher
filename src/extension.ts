import * as vscode from 'vscode';
import { CommandsIds, EXTENSION_NAME } from './enums';
import { ThemeSwitcher } from './switcher';

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  const switcher = new ThemeSwitcher(context);

  context.subscriptions.push(
    switcher,
    vscode.commands.registerCommand(CommandsIds.Switch, () => switcher.switchTheme('manual')),
    vscode.commands.registerCommand(CommandsIds.CopyAll, () => switcher.copyInstalledThemes()),
    vscode.commands.registerCommand(CommandsIds.Add, () => switcher.addCurrentTheme()),
    vscode.commands.registerCommand(CommandsIds.Remove, () => switcher.removeCurrentTheme()),
    vscode.workspace.onDidChangeConfiguration(event =>
      switcher.handleConfigurationChange(event)
    )
  );

  try {
    await switcher.start();
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    vscode.window.showErrorMessage(`${EXTENSION_NAME}: activation failed: ${detail}`);
  }
}

// this method is called when your extension is deactivated
export function deactivate(): void {
  // everything is disposed through context.subscriptions
}
