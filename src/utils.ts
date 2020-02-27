import { resolve, normalize, join } from 'path';
import { ExtensionContext } from 'vscode';

/**
 * It randomizes an integer.
 * @param max the maximum number
 */
export function getRandomInt(max: number): number {
  return Math.floor(Math.random() * Math.floor(max));
}

/**
 * It provides the settings.json path considering the vscode instance version
 */
export function getOsWiseGlobalSettingsPath(context: ExtensionContext) {
  context.globalState.update("_", undefined); // Make sure the global state folder exists. This is needed for using this.context.globalStoragePath to access user folder
  const isPortable = !!process.env.VSCODE_PORTABLE;
  if (!isPortable) {
    const path = resolve((<any>context).globalStoragePath, "../../..").concat(
      normalize("/")
    );
    const user_folder = resolve(path, "User").concat(normalize("/"));
    return join(user_folder, "settings.json");
  } else {
    const path = process.env.VSCODE_PORTABLE!;
    const user_folder = resolve(path, "user-data/User").concat(
      normalize("/")
    );
    return join(user_folder, "settings.json");
  }
}

