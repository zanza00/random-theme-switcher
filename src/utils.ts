import { EXTENSION_NAME } from './enums';
import * as vscode from 'vscode';

export function getRandomInt(max: number): number {
  return Math.floor(Math.random() * Math.floor(max));
}
export function getExtensionConfig(): vscode.WorkspaceConfiguration {
  return vscode.workspace.getConfiguration(EXTENSION_NAME);
}

export function getUserSettings(): vscode.WorkspaceConfiguration {
  return vscode.workspace.getConfiguration();
}
