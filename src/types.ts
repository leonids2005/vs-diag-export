import * as vscode from 'vscode';

export interface DiagnosticInfo {
    file: string;
    line: number;
    column: number;
    severity: string;
    message: string;
    source?: string;
    code?: string | number;
}

export interface DiagnosticExport {
    exportedAt: string;
    totalCount: number;
    errorCount: number;
    warningCount: number;
    infoCount: number;
    hintCount: number;
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
    format(data: DiagnosticExport): string;
    getFileExtension(): string;
}
