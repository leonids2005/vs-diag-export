import { FileDiagnosticExport, IFormatter } from '../types';

export class TextFormatter implements IFormatter {
    format(data: FileDiagnosticExport): string {
        const lines: string[] = [];
        
        lines.push(`DIAGNOSTICS: ${data.file}`);
        lines.push('='.repeat(80));
        lines.push(`Analyzed: ${new Date(data.analyzedAt).toLocaleString()}`);
        lines.push(`Total Issues: ${data.diagnostics.length}`);
        lines.push('='.repeat(80));
        lines.push('');

        if (data.diagnostics.length === 0) {
            lines.push('No diagnostics found.');
            return lines.join('\n');
        }

        for (const diag of data.diagnostics) {
            const codeStr = diag.code ? ` [${diag.source}:${diag.code}]` : (diag.source ? ` [${diag.source}]` : '');
            lines.push(`[${diag.severity}] Line ${diag.line}, Col ${diag.column}`);
            lines.push(`  ${diag.message}${codeStr}`);
            lines.push('');
        }

        return lines.join('\n');
    }

    getFileExtension(): string {
        return 'txt';
    }
}
