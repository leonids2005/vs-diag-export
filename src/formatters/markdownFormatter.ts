import { FileDiagnosticExport, DiagnosticInfo, IFormatter } from '../types';

export class MarkdownFormatter implements IFormatter {
    format(data: FileDiagnosticExport): string {
        const lines: string[] = [];
        
        lines.push(`# Diagnostics: ${data.file}`);
        lines.push('');
        lines.push(`**Analyzed:** ${new Date(data.analyzedAt).toLocaleString()}`);
        lines.push(`**Total Issues:** ${data.diagnostics.length}`);
        lines.push('');

        if (data.diagnostics.length === 0) {
            lines.push('No diagnostics found.');
            return lines.join('\n');
        }

        const groupedBySeverity = this.groupBySeverity(data.diagnostics);

        for (const [severity, diagnostics] of Object.entries(groupedBySeverity)) {
            if (diagnostics.length === 0) {
                continue;
            }

            lines.push(`## ${severity} (${diagnostics.length})`);
            lines.push('');
            
            for (const diag of diagnostics) {
                const codeStr = diag.code ? ` [${diag.source}:${diag.code}]` : (diag.source ? ` [${diag.source}]` : '');
                lines.push(`- **Line ${diag.line}, Col ${diag.column}:** ${diag.message}${codeStr}`);
            }
            
            lines.push('');
        }

        return lines.join('\n');
    }

    private groupBySeverity(diagnostics: DiagnosticInfo[]): Record<string, DiagnosticInfo[]> {
        const severityOrder = ['Error', 'Warning', 'Information', 'Hint'];
        const result: Record<string, DiagnosticInfo[]> = {};

        for (const severity of severityOrder) {
            result[severity] = [];
        }

        for (const diag of diagnostics) {
            if (!result[diag.severity]) {
                result[diag.severity] = [];
            }
            result[diag.severity].push(diag);
        }

        return result;
    }

    getFileExtension(): string {
        return 'md';
    }
}
