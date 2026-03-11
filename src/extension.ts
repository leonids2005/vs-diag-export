import * as vscode from 'vscode';
import { DiagnosticsExporter } from './diagnosticsExporter';

let exporter: DiagnosticsExporter | undefined;
let statusBarItem: vscode.StatusBarItem | undefined;

export function activate(context: vscode.ExtensionContext) {
    console.log('Diagnostics Export extension is now active');

    exporter = new DiagnosticsExporter();
    exporter.activate(context);

    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    statusBarItem.command = 'diagnosticsExport.exportNow';
    context.subscriptions.push(statusBarItem);

    updateStatusBar();

    const diagnosticListener = vscode.languages.onDidChangeDiagnostics(() => {
        updateStatusBar();
    });
    context.subscriptions.push(diagnosticListener);

    const exportNowCommand = vscode.commands.registerCommand('diagnosticsExport.exportNow', async () => {
        if (exporter) {
            await exporter.exportDiagnostics();
            vscode.window.showInformationMessage('Diagnostics exported successfully');
        }
    });

    const toggleAutoExportCommand = vscode.commands.registerCommand('diagnosticsExport.toggleAutoExport', async () => {
        const config = vscode.workspace.getConfiguration('diagnosticsExport');
        const currentValue = config.get<boolean>('autoExport', true);
        await config.update('autoExport', !currentValue, vscode.ConfigurationTarget.Workspace);
        vscode.window.showInformationMessage(`Auto export ${!currentValue ? 'enabled' : 'disabled'}`);
    });

    const openExportFolderCommand = vscode.commands.registerCommand('diagnosticsExport.openExportFolder', async () => {
        const config = vscode.workspace.getConfiguration('diagnosticsExport');
        const outputPath = config.get<string>('outputPath', '${workspaceFolder}/.vscode/diagnostics');
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        
        if (!workspaceFolder) {
            vscode.window.showErrorMessage('No workspace folder open');
            return;
        }

        const resolvedPath = outputPath.replace('${workspaceFolder}', workspaceFolder.uri.fsPath);
        const uri = vscode.Uri.file(resolvedPath);
        
        try {
            await vscode.commands.executeCommand('revealFileInOS', uri);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to open export folder: ${error}`);
        }
    });

    context.subscriptions.push(exportNowCommand, toggleAutoExportCommand, openExportFolderCommand);
}

function updateStatusBar(): void {
    if (!statusBarItem) {
        return;
    }

    const diagnostics = vscode.languages.getDiagnostics();
    let errorCount = 0;
    let warningCount = 0;

    for (const [, diagnosticArray] of diagnostics) {
        for (const diagnostic of diagnosticArray) {
            if (diagnostic.severity === vscode.DiagnosticSeverity.Error) {
                errorCount++;
            } else if (diagnostic.severity === vscode.DiagnosticSeverity.Warning) {
                warningCount++;
            }
        }
    }

    const totalCount = errorCount + warningCount;
    
    if (totalCount === 0) {
        statusBarItem.text = '$(check) No Problems';
        statusBarItem.tooltip = 'Click to export diagnostics';
    } else {
        statusBarItem.text = `$(warning) ${errorCount} $(error) ${warningCount} $(warning)`;
        statusBarItem.tooltip = `${errorCount} errors, ${warningCount} warnings - Click to export`;
    }

    statusBarItem.show();
}

export function deactivate() {
    if (exporter) {
        exporter.dispose();
    }
    if (statusBarItem) {
        statusBarItem.dispose();
    }
}
