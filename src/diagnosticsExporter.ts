import * as vscode from 'vscode';
import * as path from 'path';
import { DiagnosticExport, DiagnosticInfo, ExportConfig, IFormatter } from './types';
import { JsonFormatter, MarkdownFormatter, TextFormatter } from './formatters';

export class DiagnosticsExporter {
    private debounceTimer: NodeJS.Timeout | undefined;
    private formatters: Map<string, IFormatter>;
    private disposables: vscode.Disposable[] = [];

    constructor() {
        this.formatters = new Map([
            ['json', new JsonFormatter()],
            ['markdown', new MarkdownFormatter()],
            ['text', new TextFormatter()]
        ]);
    }

    public activate(context: vscode.ExtensionContext): void {
        const diagnosticListener = vscode.languages.onDidChangeDiagnostics(() => {
            this.onDiagnosticsChanged();
        });

        this.disposables.push(diagnosticListener);
        context.subscriptions.push(...this.disposables);

        this.exportDiagnostics();
    }

    private onDiagnosticsChanged(): void {
        const config = this.getConfig();
        
        if (!config.enabled || !config.autoExport) {
            return;
        }

        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }

        this.debounceTimer = setTimeout(() => {
            this.exportDiagnostics();
        }, config.debounceDelay);
    }

    public async exportDiagnostics(): Promise<void> {
        const config = this.getConfig();

        if (!config.enabled) {
            return;
        }

        try {
            const diagnosticData = this.collectDiagnostics(config);
            const outputPath = this.resolveOutputPath(config.outputPath);

            await this.ensureDirectoryExists(outputPath);

            for (const format of config.formats) {
                const formatter = this.formatters.get(format);
                if (formatter) {
                    await this.writeExport(outputPath, formatter, diagnosticData);
                }
            }

            console.log(`Diagnostics exported to ${outputPath}`);
        } catch (error) {
            console.error('Failed to export diagnostics:', error);
            vscode.window.showErrorMessage(`Failed to export diagnostics: ${error}`);
        }
    }

    private collectDiagnostics(config: ExportConfig): DiagnosticExport {
        const allDiagnostics: DiagnosticInfo[] = [];
        let errorCount = 0;
        let warningCount = 0;
        let infoCount = 0;
        let hintCount = 0;

        const diagnostics = vscode.languages.getDiagnostics();

        for (const [uri, diagnosticArray] of diagnostics) {
            for (const diagnostic of diagnosticArray) {
                if (this.shouldIncludeDiagnostic(diagnostic, config)) {
                    const info = this.convertDiagnostic(uri, diagnostic);
                    allDiagnostics.push(info);

                    switch (diagnostic.severity) {
                        case vscode.DiagnosticSeverity.Error:
                            errorCount++;
                            break;
                        case vscode.DiagnosticSeverity.Warning:
                            warningCount++;
                            break;
                        case vscode.DiagnosticSeverity.Information:
                            infoCount++;
                            break;
                        case vscode.DiagnosticSeverity.Hint:
                            hintCount++;
                            break;
                    }
                }
            }
        }

        allDiagnostics.sort((a, b) => {
            const severityOrder = { 'Error': 0, 'Warning': 1, 'Information': 2, 'Hint': 3 };
            const severityDiff = severityOrder[a.severity as keyof typeof severityOrder] - severityOrder[b.severity as keyof typeof severityOrder];
            if (severityDiff !== 0) {
                return severityDiff;
            }
            return a.file.localeCompare(b.file) || a.line - b.line;
        });

        return {
            exportedAt: new Date().toISOString(),
            totalCount: allDiagnostics.length,
            errorCount,
            warningCount,
            infoCount,
            hintCount,
            diagnostics: allDiagnostics
        };
    }

    private shouldIncludeDiagnostic(diagnostic: vscode.Diagnostic, config: ExportConfig): boolean {
        if (config.excludeSources.length > 0 && diagnostic.source) {
            if (config.excludeSources.includes(diagnostic.source)) {
                return false;
            }
        }

        switch (config.severityFilter) {
            case 'errorsOnly':
                return diagnostic.severity === vscode.DiagnosticSeverity.Error;
            case 'errorsAndWarnings':
                return diagnostic.severity === vscode.DiagnosticSeverity.Error ||
                       diagnostic.severity === vscode.DiagnosticSeverity.Warning;
            default:
                return true;
        }
    }

    private convertDiagnostic(uri: vscode.Uri, diagnostic: vscode.Diagnostic): DiagnosticInfo {
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
        const relativePath = workspaceFolder 
            ? path.relative(workspaceFolder.uri.fsPath, uri.fsPath)
            : uri.fsPath;

        return {
            file: relativePath,
            line: diagnostic.range.start.line + 1,
            column: diagnostic.range.start.character + 1,
            severity: this.getSeverityString(diagnostic.severity),
            message: diagnostic.message,
            source: diagnostic.source,
            code: typeof diagnostic.code === 'object' ? diagnostic.code.value : diagnostic.code
        };
    }

    private getSeverityString(severity: vscode.DiagnosticSeverity): string {
        switch (severity) {
            case vscode.DiagnosticSeverity.Error:
                return 'Error';
            case vscode.DiagnosticSeverity.Warning:
                return 'Warning';
            case vscode.DiagnosticSeverity.Information:
                return 'Information';
            case vscode.DiagnosticSeverity.Hint:
                return 'Hint';
            default:
                return 'Unknown';
        }
    }

    private resolveOutputPath(configPath: string): string {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        
        if (!workspaceFolder) {
            throw new Error('No workspace folder open');
        }

        let resolvedPath = configPath.replace('${workspaceFolder}', workspaceFolder.uri.fsPath);
        
        if (!path.isAbsolute(resolvedPath)) {
            resolvedPath = path.join(workspaceFolder.uri.fsPath, resolvedPath);
        }

        return resolvedPath;
    }

    private async ensureDirectoryExists(dirPath: string): Promise<void> {
        const uri = vscode.Uri.file(dirPath);
        try {
            await vscode.workspace.fs.stat(uri);
        } catch {
            await vscode.workspace.fs.createDirectory(uri);
        }
    }

    private async writeExport(outputPath: string, formatter: IFormatter, data: DiagnosticExport): Promise<void> {
        const fileName = `diagnostics.${formatter.getFileExtension()}`;
        const filePath = path.join(outputPath, fileName);
        const uri = vscode.Uri.file(filePath);
        
        const content = formatter.format(data);
        const buffer = Buffer.from(content, 'utf8');
        
        await vscode.workspace.fs.writeFile(uri, buffer);
    }

    private getConfig(): ExportConfig {
        const config = vscode.workspace.getConfiguration('diagnosticsExport');
        
        return {
            enabled: config.get<boolean>('enabled', true),
            autoExport: config.get<boolean>('autoExport', true),
            formats: config.get<string[]>('formats', ['json', 'markdown']),
            outputPath: config.get<string>('outputPath', '${workspaceFolder}/.vscode/diagnostics'),
            debounceDelay: config.get<number>('debounceDelay', 500),
            severityFilter: config.get<string>('severityFilter', 'all'),
            excludeSources: config.get<string[]>('excludeSources', [])
        };
    }

    public dispose(): void {
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }
        this.disposables.forEach(d => d.dispose());
    }
}
