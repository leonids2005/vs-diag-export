import { DiagnosticExport, IFormatter } from '../types';

export class TextFormatter implements IFormatter {
    format(data: DiagnosticExport): string {
        const lines: string[] = [];
        
        lines.push('DIAGNOSTICS EXPORT');
        lines.push('='.repeat(80));
        lines.push(`Exported: ${new Date(data.exportedAt).toLocaleString()}`);
        lines.push(`Total: ${data.totalCount} (${data.errorCount} errors, ${data.warningCount} warnings, ${data.infoCount} info, ${data.hintCount} hints)`);
        lines.push('='.repeat(80));
        lines.push('');

        if (data.diagnostics.length === 0) {
            lines.push('No diagnostics found.');
            return lines.join('\n');
        }

        for (const diag of data.diagnostics) {
            const codeStr = diag.code ? ` [${diag.source}:${diag.code}]` : (diag.source ? ` [${diag.source}]` : '');
            lines.push(`[${diag.severity}] ${diag.file}:${diag.line}:${diag.column}`);
            lines.push(`  ${diag.message}${codeStr}`);
            lines.push('');
        }

        return lines.join('\n');
    }

    getFileExtension(): string {
        return 'txt';
    }
}
