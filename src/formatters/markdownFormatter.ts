import { DiagnosticExport, DiagnosticInfo, IFormatter } from '../types';

export class MarkdownFormatter implements IFormatter {
    format(data: DiagnosticExport): string {
        const lines: string[] = [];
        
        lines.push('# Diagnostics Export');
        lines.push('');
        lines.push(`**Exported:** ${new Date(data.exportedAt).toLocaleString()}`);
        lines.push('');
        lines.push(`**Total:** ${data.totalCount} (${data.errorCount} errors, ${data.warningCount} warnings, ${data.infoCount} info, ${data.hintCount} hints)`);
        lines.push('');

        if (data.diagnostics.length === 0) {
            lines.push('No diagnostics found.');
            return lines.join('\n');
        }

        const groupedByFile = this.groupByFile(data.diagnostics);
        const groupedBySeverity = this.groupBySeverity(groupedByFile);

        for (const [severity, files] of Object.entries(groupedBySeverity)) {
            const count = Object.values(files).reduce((sum, diags) => sum + diags.length, 0);
            lines.push(`## ${severity} (${count})`);
            lines.push('');

            for (const [file, diagnostics] of Object.entries(files)) {
                lines.push(`### ${file}`);
                lines.push('');
                
                for (const diag of diagnostics) {
                    const codeStr = diag.code ? ` [${diag.source}:${diag.code}]` : (diag.source ? ` [${diag.source}]` : '');
                    lines.push(`- **Line ${diag.line}, Col ${diag.column}:** ${diag.message}${codeStr}`);
                }
                
                lines.push('');
            }
        }

        return lines.join('\n');
    }

    private groupByFile(diagnostics: DiagnosticInfo[]): Record<string, DiagnosticInfo[]> {
        const grouped: Record<string, DiagnosticInfo[]> = {};
        
        for (const diag of diagnostics) {
            if (!grouped[diag.file]) {
                grouped[diag.file] = [];
            }
            grouped[diag.file].push(diag);
        }
        
        return grouped;
    }

    private groupBySeverity(fileGroups: Record<string, DiagnosticInfo[]>): Record<string, Record<string, DiagnosticInfo[]>> {
        const severityOrder = ['Error', 'Warning', 'Information', 'Hint'];
        const result: Record<string, Record<string, DiagnosticInfo[]>> = {};

        for (const severity of severityOrder) {
            result[severity] = {};
        }

        for (const [file, diagnostics] of Object.entries(fileGroups)) {
            for (const diag of diagnostics) {
                if (!result[diag.severity]) {
                    result[diag.severity] = {};
                }
                if (!result[diag.severity][file]) {
                    result[diag.severity][file] = [];
                }
                result[diag.severity][file].push(diag);
            }
        }

        const filtered: Record<string, Record<string, DiagnosticInfo[]>> = {};
        for (const [severity, files] of Object.entries(result)) {
            if (Object.keys(files).length > 0) {
                filtered[severity] = files;
            }
        }

        return filtered;
    }

    getFileExtension(): string {
        return 'md';
    }
}
