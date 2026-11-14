import * as vscode from 'vscode';
import { localDateKey, shouldSwitchDaily } from './core/daily';
import { buildExcludeRegex } from './core/regex';
import { addToThemeList, removeFromThemeList } from './core/themeList';
import { collectThemeContributions, filterThemes, pickRandom, themeSettingsId } from './core/themes';
import type { ThemeContribution, ThemeSide } from './core/themes';
import { EXTENSION_NAME, GlobalStateKeys, MATERIAL_LIST, Messages, SettingsKeys } from './enums';
import { isSwitchMode } from './types';
import type { SwitchModes } from './types';

const COLOR_THEME_SETTING = 'workbench.colorTheme';
const TYPING_DEBOUNCE_MS = 750;
const DEFAULT_INTERVAL_MINUTES = 15;

const SIDE_OPTIONS: readonly { label: string; side: ThemeSide }[] = [
  { label: Messages.SideBoth, side: 'both' },
  { label: Messages.SideLight, side: 'light' },
  { label: Messages.SideDark, side: 'dark' },
];

type ThemeSelection = { side: ThemeSide; exclude: RegExp | undefined };

export class ThemeSwitcher implements vscode.Disposable {
  private readonly context: vscode.ExtensionContext;
  private isSwitching = false;
  private disposed = false;
  private stopInterval: (() => void) | undefined;
  private cancelTypingSwitch: (() => void) | undefined;
  private typingListener: vscode.Disposable | undefined;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
  }

  async start(): Promise<void> {
    await this.ensureThemeList();

    const skipNextStartupSwitch = this.context.globalState.get<boolean>(
      GlobalStateKeys.SkipNextStartupSwitch,
      false
    );

    if (skipNextStartupSwitch) {
      await this.context.globalState.update(GlobalStateKeys.SkipNextStartupSwitch, false);
      if (this.getMode() === 'daily') {
        await this.context.globalState.update(GlobalStateKeys.LastSwitchDate, localDateKey());
      }
    } else {
      await this.performStartupSwitch();
    }

    this.restartScheduler();
  }

  async switchTheme(reason: SwitchModes = 'manual'): Promise<void> {
    if (this.isSwitching) {
      return;
    }
    this.isSwitching = true;

    try {
      const currentTheme = this.getCurrentTheme();
      const candidates = this.getThemeList().filter(theme => theme !== currentTheme);
      const newTheme = pickRandom(candidates);
      if (newTheme === undefined) {
        return;
      }

      const preventReloadThemeList = this.extensionConfig.get<string[]>(
        SettingsKeys.PreventReloadThemeList,
        MATERIAL_LIST
      );
      if (preventReloadThemeList.includes(newTheme)) {
        await this.context.globalState.update(GlobalStateKeys.SkipNextStartupSwitch, true);
      }

      await vscode.workspace
        .getConfiguration()
        .update(COLOR_THEME_SETTING, newTheme, vscode.ConfigurationTarget.Global);

      if (reason === 'manual' || reason === 'startup' || reason === 'daily') {
        vscode.window.showInformationMessage(Messages.SwitchedTheme(newTheme));
      }
    } catch (error) {
      this.reportError('unable to switch theme', error);
    } finally {
      this.isSwitching = false;
    }
  }

  async copyInstalledThemes(): Promise<void> {
    const selection = await this.promptThemeSelection();
    if (selection === undefined) {
      return;
    }

    const themes = this.collectThemes(selection.side, selection.exclude);
    await this.saveThemeList(themes, Messages.CopiedTheme(themes.length));
  }

  async addCurrentTheme(): Promise<void> {
    const currentTheme = this.getCurrentTheme();
    if (currentTheme === undefined) {
      vscode.window.showInformationMessage(Messages.NoCurrentTheme);
      return;
    }

    await this.addThemes([currentTheme]);
  }

  async removeCurrentTheme(): Promise<void> {
    const currentTheme = this.getCurrentTheme();
    if (currentTheme === undefined) {
      vscode.window.showInformationMessage(Messages.NoCurrentTheme);
      return;
    }

    await this.saveThemeList(
      removeFromThemeList(this.getThemeList(), currentTheme),
      Messages.RemovedTheme(currentTheme)
    );
  }

  async handleConfigurationChange(event: vscode.ConfigurationChangeEvent): Promise<void> {
    if (event.affectsConfiguration(COLOR_THEME_SETTING)) {
      await this.handleThemeChange();
    }

    if (
      event.affectsConfiguration(`${EXTENSION_NAME}.${SettingsKeys.SwitchMode}`) ||
      event.affectsConfiguration(`${EXTENSION_NAME}.${SettingsKeys.SwitchInterval}`) ||
      event.affectsConfiguration(`${EXTENSION_NAME}.${SettingsKeys.ThemeList}`)
    ) {
      this.restartScheduler();
    }
  }

  dispose(): void {
    this.disposed = true;
    this.stopScheduler();
  }

  private async ensureThemeList(): Promise<void> {
    if (this.getThemeList().length > 0) {
      return;
    }

    const installedThemes = this.collectThemes('both');
    await this.saveThemeList(installedThemes, Messages.CopiedTheme(installedThemes.length));
  }

  private async performStartupSwitch(): Promise<void> {
    const mode = this.getMode();

    if (mode === 'startup') {
      await this.switchTheme('startup');
    } else if (
      mode === 'daily' &&
      shouldSwitchDaily(this.context.globalState.get<string>(GlobalStateKeys.LastSwitchDate))
    ) {
      await this.switchTheme('daily');
      await this.context.globalState.update(GlobalStateKeys.LastSwitchDate, localDateKey());
    }
  }

  private async handleThemeChange(): Promise<void> {
    if (this.isSwitching) {
      return;
    }

    const currentTheme = this.getCurrentTheme();
    if (currentTheme === undefined) {
      return;
    }

    const preventReloadThemeList = this.extensionConfig.get<string[]>(
      SettingsKeys.PreventReloadThemeList,
      MATERIAL_LIST
    );
    await this.context.globalState.update(
      GlobalStateKeys.SkipNextStartupSwitch,
      preventReloadThemeList.includes(currentTheme)
    );

    if (this.getThemeList().includes(currentTheme)) {
      return;
    }

    try {
      const choice = await vscode.window.showInformationMessage(
        Messages.AddToList(currentTheme),
        Messages.AddCurrentOption,
        Messages.AddWholePackOption,
        Messages.DismissOption
      );

      if (choice === Messages.AddCurrentOption) {
        await this.addThemes([currentTheme]);
      } else if (choice === Messages.AddWholePackOption) {
        await this.addThemes(this.collectThemePack(currentTheme));
      }
    } catch (error) {
      this.reportError('unable to update the theme list', error);
    }
  }

  private async addThemes(themes: readonly string[]): Promise<void> {
    const additions = themes.filter(theme => theme.length > 0);
    if (additions.length === 0) {
      return;
    }

    await this.saveThemeList(
      addToThemeList(this.getThemeList(), additions),
      Messages.AddedTheme(additions.join(', '))
    );
  }

  private async saveThemeList(themes: readonly string[], message: string): Promise<void> {
    try {
      await this.extensionConfig.update(
        SettingsKeys.ThemeList,
        themes,
        vscode.ConfigurationTarget.Global
      );
      vscode.window.showInformationMessage(message);
    } catch (error) {
      this.reportError('unable to save the theme list', error);
    }
  }

  private async promptThemeSelection(): Promise<ThemeSelection | undefined> {
    const picked = await vscode.window.showQuickPick(
      SIDE_OPTIONS.map(option => ({ label: option.label, side: option.side })),
      { placeHolder: Messages.PickSide }
    );
    if (picked === undefined) {
      return undefined;
    }

    const pattern = await vscode.window.showInputBox({ prompt: Messages.ExcludePrompt });
    if (pattern === undefined) {
      return undefined;
    }

    try {
      return { side: picked.side, exclude: buildExcludeRegex(pattern) };
    } catch (error) {
      this.reportError('invalid exclusion pattern', error);
      return undefined;
    }
  }

  private collectThemes(side: ThemeSide, exclude?: RegExp): string[] {
    return filterThemes(collectThemeContributions(vscode.extensions.all), side, exclude);
  }

  private collectThemePack(targetTheme: string): string[] {
    const contributions: ThemeContribution[] = [];

    for (const extension of vscode.extensions.all) {
      const themes = collectThemeContributions([extension]);
      if (themes.some(theme => themeSettingsId(theme) === targetTheme)) {
        contributions.push(...themes);
      }
    }

    return filterThemes(contributions, 'both');
  }

  private restartScheduler(): void {
    this.stopScheduler();
    if (this.disposed) {
      return;
    }

    const mode = this.getMode();
    if (mode === 'interval') {
      const handle = setInterval(() => {
        void this.switchTheme('interval');
      }, this.getIntervalMinutes() * 60_000);
      this.stopInterval = () => clearInterval(handle);
    } else if (mode === 'typing') {
      this.typingListener = vscode.workspace.onDidChangeTextDocument(event => {
        this.onTyping(event);
      });
    }
  }

  private stopScheduler(): void {
    this.stopInterval?.();
    this.stopInterval = undefined;
    this.cancelTypingSwitch?.();
    this.cancelTypingSwitch = undefined;
    this.typingListener?.dispose();
    this.typingListener = undefined;
  }

  private onTyping(event: vscode.TextDocumentChangeEvent): void {
    if (this.isSwitching) {
      return;
    }

    const change: vscode.TextDocumentContentChangeEvent | undefined = event.contentChanges[0];
    if (change === undefined || change.text.length > 1) {
      return;
    }

    this.cancelTypingSwitch?.();
    const handle = setTimeout(() => {
      void this.switchTheme('typing');
    }, TYPING_DEBOUNCE_MS);
    this.cancelTypingSwitch = () => clearTimeout(handle);
  }

  private get extensionConfig(): vscode.WorkspaceConfiguration {
    return vscode.workspace.getConfiguration(EXTENSION_NAME);
  }

  private getCurrentTheme(): string | undefined {
    const value: unknown = vscode.workspace.getConfiguration().get(COLOR_THEME_SETTING);
    return typeof value === 'string' && value.length > 0 ? value : undefined;
  }

  private getThemeList(): string[] {
    return this.extensionConfig.get<string[]>(SettingsKeys.ThemeList, []);
  }

  private getMode(): SwitchModes {
    const mode: unknown = this.extensionConfig.get(SettingsKeys.SwitchMode);
    return isSwitchMode(mode) ? mode : 'startup';
  }

  private getIntervalMinutes(): number {
    const interval = this.extensionConfig.get<number>(
      SettingsKeys.SwitchInterval,
      DEFAULT_INTERVAL_MINUTES
    );
    return Number.isFinite(interval) && interval > 0 ? interval : DEFAULT_INTERVAL_MINUTES;
  }

  private reportError(action: string, error: unknown): void {
    const detail = error instanceof Error ? error.message : String(error);
    vscode.window.showErrorMessage(`Random Theme Switcher: ${action}: ${detail}`);
  }
}
