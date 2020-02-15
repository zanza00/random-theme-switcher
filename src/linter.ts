import * as vscode from 'vscode';
import { EXTENSION_NAME, Messages } from './enums';
import { getOsWiseGlobalSettingsPath } from './utils';

/**
 * Your friendly neighborhood Linter.
 * Upon activation it listen to themeList changes in settings.json and updates its junkList diagnostics, till no junk remains. 
 */
export class Linter {

    private _settingsPath: string;

    /**
     * It lists all the junk detected by the configurationManager
     */
    private _junkList: string[] = new Array();

    /**
     * Extension diagnostic collection.
     */
    public diagnostics: vscode.DiagnosticCollection;

    /**
     * It listen for changes in settings.json
     * @param context the extensionContext to which subscribe settings.json changes detections
     */
    public constructor(context: vscode.ExtensionContext) {
        this.diagnostics = vscode.languages.createDiagnosticCollection(EXTENSION_NAME);
        this._settingsPath = getOsWiseGlobalSettingsPath();
        context.subscriptions.push(this.diagnostics,
            vscode.workspace.onDidSaveTextDocument((doc) => {
                if (doc.fileName.includes(this._settingsPath)) {
                    this.reload(doc);
                }
            }));
    }

    /**
     * Open the settings.json file and enable the linting functionality
     * @param junkList a list containing all the unknown theme names
     */
    public async activate(junkList: string[]) {
        try {
            // Enable the linter
            this._junkList = junkList || [];
            const doc = await vscode.workspace.openTextDocument(this._settingsPath);
            const docContent = doc.getText();
            this.reload(doc, docContent);

            // Bring the user to the settings.json file
            await vscode.window.showTextDocument(doc);
            const textEditor = vscode.window.activeTextEditor;
            const themeListZone = this.getStoredThemeListZone(docContent);
            if (textEditor && themeListZone) {
                const startPosition = doc.positionAt(themeListZone.index);
                const endPosition = doc.positionAt(themeListZone.index + 2);
                textEditor.revealRange(new vscode.Range(startPosition, endPosition), vscode.TextEditorRevealType.InCenterIfOutsideViewport);
            }
        } catch (err) {
            vscode.window.showErrorMessage('An error has occurred while looking for invalid theme names: ' + err);
        }
    }

    /**
     * It deactivates the linting functionality
     */
    public deactivate(): void {
        this._junkList = new Array();
        this.diagnostics.set(vscode.Uri.file(this._settingsPath), undefined);
    }

    /**
     * It searches for junk items inside the settings.json randomThemeSwitcher.themeList values
     * @param settingsDoc the settings.json document
     * @param settingsContent cached settings.json text
     */
    public reload(settingsDoc: vscode.TextDocument, settingsContent?: string): Promise<void> {
        const asyncReload = async () => {
            if (this._junkList.length === 0) { return; }
            let result: vscode.Diagnostic[] = [];
            try {
                if (!settingsContent) {
                    // Lazy loading: only if _junkList !empty 
                    settingsContent = settingsDoc.getText();
                }
                const storedThemeListZone = this.getStoredThemeListZone(settingsContent);
                if (storedThemeListZone) {
                    const storedThemeListContent = storedThemeListZone[0];

                    const junkList = this._junkList;
                    const junkListCount = junkList.length;
                    for (let index = 0; index < junkListCount; index++) {
                        const item = junkList[index];
                        let hasMatchedAtLeastOnce: boolean = false;
                        try {
                            // Now we search for multiple occurrences of the junk item
                            const junkItemFinder = new RegExp(`"${item.replace(/\./g, '\.')}"`, "g");
                            let match: RegExpExecArray | null = null;
                            while (match = junkItemFinder.exec(storedThemeListContent)) {
                                hasMatchedAtLeastOnce = true;
                                const junkPosition = match.index;
                                const startOffset = storedThemeListZone.index + junkPosition + 1;
                                const startPosition = settingsDoc.positionAt(startOffset);
                                const endPosition = settingsDoc.positionAt(startOffset + item.length);
                                result.push(this.createDiagnoseResult(Messages.NotAValidTheme, new vscode.Range(startPosition, endPosition), vscode.DiagnosticSeverity.Warning));
                            }
                        } catch (_) {

                            // If we get errors we try to perform a silly first single-occurrence item search
                            const rawJunkIndex = storedThemeListContent.indexOf(item);
                            if (rawJunkIndex !== -1) {
                                hasMatchedAtLeastOnce = true;
                                const startOffset = storedThemeListZone.index + rawJunkIndex;
                                const startPosition = settingsDoc.positionAt(startOffset);
                                const endPosition = settingsDoc.positionAt(startOffset + item.length);
                                result.push(this.createDiagnoseResult(Messages.NotAValidTheme, new vscode.Range(startPosition, endPosition), vscode.DiagnosticSeverity.Warning));
                            }
                        }

                        if (!hasMatchedAtLeastOnce) {
                            // If none of the methods succeed we simply remove the item, cause it's no longer detected 
                            this._junkList = this._junkList.splice(index, 1);
                        }
                    }
                }
            } catch (err) {
                vscode.window.showErrorMessage('An error has occurred while composing diagnostics: ' + err);
            }
            finally {
                this.diagnostics.set(vscode.Uri.file(this._settingsPath), result);
            }
        };
        return asyncReload();
    }


    /**
     * It provides the RandomThemeList content
     * @param settingsDocument the settings document
     */
    private getStoredThemeListZone(settingsContent: string): RegExpExecArray | null {
        const storedThemeListFinder = new RegExp(/(?<="randomThemeSwitcher\.themeList")\s*:\s*\[\s*([^\]]+)\]/);
        let match: RegExpExecArray | null = null;
        if (match = storedThemeListFinder.exec(settingsContent)) {
            return match;
        }
        return match;
    }

    /**
     * Util function
     * @param message the message to display
     * @param range the involved range
     * @param severity the severity
     */
    private createDiagnoseResult(message: string, range: vscode.Range, severity: vscode.DiagnosticSeverity = vscode.DiagnosticSeverity.Information): vscode.Diagnostic {
        let diag = new vscode.Diagnostic(range, message);
        diag.severity = severity;
        return diag;
    }
}