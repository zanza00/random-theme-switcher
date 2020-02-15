import * as os from 'os';
import * as path from 'path';

/**
 * It randomizes an integer.
 * @param max the maximum number
 */
export function getRandomInt(max: number): number {
  return Math.floor(Math.random() * Math.floor(max));
}

/**
 * It provides the settings.json path considering the current operating system
 */
export function getOsWiseGlobalSettingsPath() {
  switch (process.platform) {
    case 'darwin':
      return path.join(os.homedir(), 'Library/ApplicationSupport/Code/User/settings.json');
    case 'linux':
      return path.join(os.homedir(), '.config/Code/User/settings.json');
    case 'win32':
      return path.join(os.homedir(), 'AppData', 'Roaming', 'Code', 'User', 'settings.json');
    /*case 'freebsd':
    case 'aix':
    case 'openbsd':
    case 'sunos':*/
    default:
      return '';
  }
}

