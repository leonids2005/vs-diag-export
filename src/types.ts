import * as vscode from 'vscode';

export interface DiagnosticInfo {
    source?: string;
    severity: string;
    message: string;
    line: number;
    column: number;
    code?: string | number;
}

export interface FileDiagnosticExport {
    file: string;
    analyzedAt: string;
    diagnostics: DiagnosticInfo[];
}

export interface ExportConfig {
    enabled: boolean;
    autoExport: boolean;
    formats: string[];
    outputPath: string;
    debounceDelay: number;
    severityFilter: string;
    excludeSources: string[];
}

export interface IFormatter {
    format(data: FileDiagnosticExport): string;
    getFileExtension(): string;
}
