import * as vscode from 'vscode';
import * as path from 'path';
import { FileDiagnosticExport, DiagnosticInfo, ExportConfig, IFormatter } from './types';
import { JsonFormatter, MarkdownFormatter, TextFormatter } from './formatters';

export class DiagnosticsExporter {
    private debounceTimer: NodeJS.Timeout | undefined;
    private formatters: Map<string, IFormatter>;
    private disposables: vscode.Disposable[] = [];
    private changedFiles: Set<string> = new Set();

    constructor() {
        this.formatters = new Map([
            ['json', new JsonFormatter()],
            ['markdown', new MarkdownFormatter()],
            ['text', new TextFormatter()]
        ]);
    }

    public activate(context: vscode.ExtensionContext): void {
        const diagnosticListener = vscode.languages.onDidChangeDiagnostics((event) => {
            this.onDiagnosticsChanged(event);
        });

        this.disposables.push(diagnosticListener);
        context.subscriptions.push(...this.disposables);

        this.exportAllDiagnostics();
    }

    private onDiagnosticsChanged(event: vscode.DiagnosticChangeEvent): void {
        const config = this.getConfig();
        
        if (!config.enabled || !config.autoExport) {
            return;
        }

        for (const uri of event.uris) {
            this.changedFiles.add(uri.toString());
        }

        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }

        this.debounceTimer = setTimeout(() => {
            this.exportChangedFiles();
        }, config.debounceDelay);
    }

    private async exportChangedFiles(): Promise<void> {
        const config = this.getConfig();
        const filesToExport = Array.from(this.changedFiles);
        this.changedFiles.clear();

        for (const uriString of filesToExport) {
            const uri = vscode.Uri.parse(uriString);
            await this.exportFileDignostics(uri, config);
        }
    }

    public async exportAllDiagnostics(): Promise<void> {
        const config = this.getConfig();

        if (!config.enabled) {
            return;
        }

        try {
            const diagnostics = vscode.languages.getDiagnostics();

            for (const [uri] of diagnostics) {
                await this.exportFileDignostics(uri, config);
            }

            console.log(`All diagnostics exported`);
        } catch (error) {
            console.error('Failed to export diagnostics:', error);
            vscode.window.showErrorMessage(`Failed to export diagnostics: ${error}`);
        }
    }

    private async exportFileDignostics(uri: vscode.Uri, config: ExportConfig): Promise<void> {
        try {
            const diagnostics = vscode.languages.getDiagnostics(uri);
            const fileDiagnostics = this.collectFileDiagnostics(uri, diagnostics, config);
            
            if (!fileDiagnostics) {
                return;
            }

            const outputBasePath = this.resolveOutputPath(config.outputPath);
            
            for (const format of config.formats) {
                const formatter = this.formatters.get(format);
                if (formatter) {
                    await this.writeFileExport(outputBasePath, uri, formatter, fileDiagnostics);
                }
            }
        } catch (error) {
            console.error(`Failed to export diagnostics for ${uri.fsPath}:`, error);
        }
    }

    private collectFileDiagnostics(uri: vscode.Uri, diagnosticArray: readonly vscode.Diagnostic[], config: ExportConfig): FileDiagnosticExport | null {
        const filteredDiagnostics: DiagnosticInfo[] = [];

        for (const diagnostic of diagnosticArray) {
            if (this.shouldIncludeDiagnostic(diagnostic, config)) {
                const info = this.convertDiagnostic(diagnostic);
                filteredDiagnostics.push(info);
            }
        }

        if (filteredDiagnostics.length === 0) {
            return null;
        }

        const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
        const relativePath = workspaceFolder 
            ? path.relative(workspaceFolder.uri.fsPath, uri.fsPath)
            : uri.fsPath;

        filteredDiagnostics.sort((a, b) => {
            const severityOrder = { 'Error': 0, 'Warning': 1, 'Information': 2, 'Hint': 3 };
            const severityDiff = severityOrder[a.severity as keyof typeof severityOrder] - severityOrder[b.severity as keyof typeof severityOrder];
            if (severityDiff !== 0) {
                return severityDiff;
            }
            return a.line - b.line;
        });

        return {
            file: relativePath.replace(/\\/g, '/'),
            analyzedAt: new Date().toISOString(),
            diagnostics: filteredDiagnostics
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

    private convertDiagnostic(diagnostic: vscode.Diagnostic): DiagnosticInfo {
        return {
            source: diagnostic.source,
            severity: this.getSeverityString(diagnostic.severity),
            message: diagnostic.message,
            line: diagnostic.range.start.line + 1,
            column: diagnostic.range.start.character + 1,
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

    private async writeFileExport(outputBasePath: string, fileUri: vscode.Uri, formatter: IFormatter, data: FileDiagnosticExport): Promise<void> {
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(fileUri);
        if (!workspaceFolder) {
            return;
        }

        const relativePath = path.relative(workspaceFolder.uri.fsPath, fileUri.fsPath);
        const outputFileName = `${relativePath}.${formatter.getFileExtension()}`;
        const outputFilePath = path.join(outputBasePath, outputFileName);
        const outputDir = path.dirname(outputFilePath);

        await this.ensureDirectoryExists(outputDir);

        const content = formatter.format(data);
        const buffer = Buffer.from(content, 'utf8');
        const uri = vscode.Uri.file(outputFilePath);
        
        await vscode.workspace.fs.writeFile(uri, buffer);
    }

    private getConfig(): ExportConfig {
        const config = vscode.workspace.getConfiguration('diagnosticsExport');
        
        return {
            enabled: config.get<boolean>('enabled', true),
            autoExport: config.get<boolean>('autoExport', true),
            formats: config.get<string[]>('formats', ['json']),
            outputPath: config.get<string>('outputPath', '${workspaceFolder}/.diagnostics'),
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
