import * as vscode from 'vscode';
import * as path from 'path';
import { FileDiagnosticExport, DiagnosticInfo, ExportConfig, IFormatter } from './types';
import { JsonFormatter, MarkdownFormatter, TextFormatter } from './formatters';

export class DiagnosticsExporter {
    private debounceTimer: NodeJS.Timeout | undefined;
    private formatters: Map<string, IFormatter>;
    private disposables: vscode.Disposable[] = [];
    private changedFiles: Set<string> = new Set();
    private outputChannel: vscode.OutputChannel;
    private isExporting: boolean = false;
    private pendingChangedFiles: boolean = false;
    private lastExportTime: Map<string, number> = new Map();

    constructor() {
        this.formatters = new Map([
            ['json', new JsonFormatter()],
            ['markdown', new MarkdownFormatter()],
            ['text', new TextFormatter()]
        ]);
        this.outputChannel = vscode.window.createOutputChannel('Diagnostics Export');
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
        if (this.isExporting) {
            this.pendingChangedFiles = true;
            this.outputChannel.appendLine('Export already in progress, changes queued...');
            return;
        }

        this.isExporting = true;
        try {
            do {
                this.pendingChangedFiles = false;
                const config = this.getConfig();
                const filesToExport = Array.from(this.changedFiles);
                this.changedFiles.clear();

                const now = Date.now();
                const minInterval = 1000; // Don't re-export same file within 1 second

                for (const uriString of filesToExport) {
                    const lastExport = this.lastExportTime.get(uriString);
                    if (lastExport && (now - lastExport) < minInterval) {
                        this.outputChannel.appendLine(`Skipping ${uriString} (exported ${now - lastExport}ms ago)`);
                        continue;
                    }

                    const uri = vscode.Uri.parse(uriString);
                    await this.exportFileDiagnostics(uri, config);
                    this.lastExportTime.set(uriString, now);
                }
            } while (this.pendingChangedFiles);
        } finally {
            this.isExporting = false;
        }
    }

    public async exportAllDiagnostics(): Promise<void> {
        const config = this.getConfig();

        if (!config.enabled) {
            return;
        }

        if (this.isExporting) {
            this.outputChannel.appendLine('Export already in progress, manual export queued...');
            this.pendingChangedFiles = true;
            return;
        }

        this.isExporting = true;
        try {
            const diagnostics = vscode.languages.getDiagnostics();

            for (const [uri] of diagnostics) {
                await this.exportFileDiagnostics(uri, config);
            }

            this.outputChannel.appendLine('All diagnostics exported');
        } catch (error) {
            this.outputChannel.appendLine(`Failed to export diagnostics: ${error}`);
            vscode.window.showErrorMessage(`Failed to export diagnostics: ${error}`);
        } finally {
            this.isExporting = false;
        }
    }

    private async exportFileDiagnostics(uri: vscode.Uri, config: ExportConfig): Promise<void> {
        try {
            if (!this.shouldExportFile(uri, config)) {
                return;
            }

            const outputBasePath = this.resolveOutputPath(config.outputPath);
            const diagnostics = vscode.languages.getDiagnostics(uri);
            const fileDiagnostics = this.collectFileDiagnostics(uri, diagnostics, config);
            
            if (!fileDiagnostics) {
                this.outputChannel.appendLine(`No diagnostics for: ${uri.fsPath} - deleting export files`);
                await this.deleteFileExports(outputBasePath, uri, config.formats);
                return;
            }

            await this.writeFormattedDiagnostics(outputBasePath, uri, fileDiagnostics, config.formats);
        } catch (error) {
            this.outputChannel.appendLine(`Failed to export diagnostics for ${uri.fsPath}: ${error}`);
            console.error(`Failed to export diagnostics for ${uri.fsPath}:`, error);
        }
    }

    private shouldExportFile(uri: vscode.Uri, config: ExportConfig): boolean {
        // Only export files that are within the workspace
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
        if (!workspaceFolder) {
            return false;
        }

        // Skip non-file URIs (like virtual files, git schemes, etc.)
        if (uri.scheme !== 'file') {
            return false;
        }

        // Skip files inside .diagnostics folder to prevent recursive export
        const outputBasePath = this.resolveOutputPath(config.outputPath);
        if (this.isInsideOutputFolder(uri.fsPath, outputBasePath)) {
            this.outputChannel.appendLine(`Skipping file in .diagnostics folder: ${uri.fsPath}`);
            return false;
        }

        return true;
    }

    private isInsideOutputFolder(filePath: string, outputBasePath: string): boolean {
        const normalizedOutputPath = path.normalize(outputBasePath).toLowerCase();
        const normalizedFilePath = path.normalize(filePath).toLowerCase();
        
        return normalizedFilePath.startsWith(normalizedOutputPath + path.sep) || 
               normalizedFilePath === normalizedOutputPath;
    }

    private async writeFormattedDiagnostics(
        outputBasePath: string, 
        uri: vscode.Uri, 
        fileDiagnostics: FileDiagnosticExport, 
        formats: string[]
    ): Promise<void> {
        for (const format of formats) {
            const formatter = this.formatters.get(format);
            if (formatter) {
                await this.writeFileExport(outputBasePath, uri, formatter, fileDiagnostics);
            }
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
            this.outputChannel.appendLine(`Skipped (no workspace): ${fileUri.toString()}`);
            return;
        }

        const relativePath = path.relative(workspaceFolder.uri.fsPath, fileUri.fsPath);
        const outputFileName = `${relativePath}.${formatter.getFileExtension()}`;
        const outputFilePath = path.join(outputBasePath, outputFileName);
        const outputDir = path.dirname(outputFilePath);

        this.outputChannel.appendLine(`Exporting: ${fileUri.fsPath}`);
        this.outputChannel.appendLine(`  -> ${outputFilePath}`);
        this.outputChannel.appendLine(`  Relative: ${relativePath}`);

        await this.ensureDirectoryExists(outputDir);

        const content = formatter.format(data);
        const buffer = Buffer.from(content, 'utf8');
        const uri = vscode.Uri.file(outputFilePath);
        
        await vscode.workspace.fs.writeFile(uri, buffer);
    }

    private async deleteFileExports(outputBasePath: string, fileUri: vscode.Uri, formats: string[]): Promise<void> {
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(fileUri);
        if (!workspaceFolder) {
            return;
        }

        const relativePath = path.relative(workspaceFolder.uri.fsPath, fileUri.fsPath);
        
        for (const format of formats) {
            const formatter = this.formatters.get(format);
            if (formatter) {
                const outputFileName = `${relativePath}.${formatter.getFileExtension()}`;
                const outputFilePath = path.join(outputBasePath, outputFileName);
                const uri = vscode.Uri.file(outputFilePath);

                try {
                    await vscode.workspace.fs.delete(uri);
                    this.outputChannel.appendLine(`Deleted: ${outputFilePath}`);
                } catch (error) {
                    // File might not exist, which is fine
                    this.outputChannel.appendLine(`Delete failed (file may not exist): ${outputFilePath}`);
                }
            }
        }
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
        this.outputChannel.dispose();
    }
}
