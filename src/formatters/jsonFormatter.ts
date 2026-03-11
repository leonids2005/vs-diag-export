import { DiagnosticExport, IFormatter } from '../types';

export class JsonFormatter implements IFormatter {
    format(data: DiagnosticExport): string {
        return JSON.stringify(data, null, 2);
    }

    getFileExtension(): string {
        return 'json';
    }
}
