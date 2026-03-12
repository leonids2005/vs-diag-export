import { FileDiagnosticExport, IFormatter } from '../types';

export class JsonFormatter implements IFormatter {
    format(data: FileDiagnosticExport): string {
        return JSON.stringify(data, null, 2);
    }

    getFileExtension(): string {
        return 'json';
    }
}
