# Diagnostics Export

A VS Code extension that automatically exports diagnostics from the Problems pane to multiple formats, making it easy for AI coding assistants and other tools to access error and warning information.

## Features

- **Automatic Export**: Diagnostics are automatically exported whenever they change
- **Multiple Formats**: Export to JSON, Markdown, and Plain Text formats
- **Real-time Updates**: Uses VS Code's `onDidChangeDiagnostics` event for instant updates
- **Configurable**: Extensive configuration options for filtering and customization
- **Status Bar Integration**: Shows diagnostic counts with click-to-export functionality

## Usage

### Automatic Export

By default, the extension automatically exports diagnostics whenever they change. Exported files are saved to `.vscode/diagnostics/` in your workspace.

### Manual Export

You can manually trigger an export using:
- Command Palette (`Ctrl+Shift+P`): Run "Export Diagnostics Now"
- Click the status bar item showing diagnostic counts

### Commands

- **Export Diagnostics Now**: Manually trigger diagnostic export
- **Toggle Auto Export**: Enable/disable automatic export
- **Open Export Folder**: Open the folder containing exported diagnostics

## Configuration

Configure the extension through VS Code settings:

```json
{
  "diagnosticsExport.enabled": true,
  "diagnosticsExport.autoExport": true,
  "diagnosticsExport.formats": ["json", "markdown"],
  "diagnosticsExport.outputPath": "${workspaceFolder}/.vscode/diagnostics",
  "diagnosticsExport.debounceDelay": 500,
  "diagnosticsExport.severityFilter": "all",
  "diagnosticsExport.excludeSources": []
}
```

### Settings

- `diagnosticsExport.enabled`: Enable/disable the extension (default: `true`)
- `diagnosticsExport.autoExport`: Automatically export on diagnostics change (default: `true`)
- `diagnosticsExport.formats`: Export formats to generate - `json`, `markdown`, `text` (default: `["json", "markdown"]`)
- `diagnosticsExport.outputPath`: Output directory path (default: `"${workspaceFolder}/.vscode/diagnostics"`)
- `diagnosticsExport.debounceDelay`: Delay in ms before exporting after change (default: `500`)
- `diagnosticsExport.severityFilter`: Filter by severity - `all`, `errorsOnly`, `errorsAndWarnings` (default: `"all"`)
- `diagnosticsExport.excludeSources`: Array of diagnostic sources to exclude (default: `[]`)

## Export Formats

### JSON Format

Structured JSON with complete diagnostic information:

```json
{
  "exportedAt": "2026-03-11T19:00:00.000Z",
  "totalCount": 3,
  "errorCount": 1,
  "warningCount": 2,
  "infoCount": 0,
  "hintCount": 0,
  "diagnostics": [
    {
      "file": "src/app.ts",
      "line": 42,
      "column": 10,
      "severity": "Error",
      "message": "Cannot find name 'foo'",
      "source": "ts",
      "code": "2304"
    }
  ]
}
```

### Markdown Format

Human-readable format grouped by severity and file:

```markdown
# Diagnostics Export

**Exported:** 3/11/2026, 7:00:00 PM
**Total:** 3 (1 errors, 2 warnings, 0 info, 0 hints)

## Error (1)
### src/app.ts
- **Line 42, Col 10:** Cannot find name 'foo' [ts:2304]
```

### Plain Text Format

Simple text listing:

```
DIAGNOSTICS EXPORT
================================================================================
Exported: 3/11/2026, 7:00:00 PM
Total: 3 (1 errors, 2 warnings, 0 info, 0 hints)
================================================================================

[Error] src/app.ts:42:10
  Cannot find name 'foo' [ts:2304]
```

## Use Cases

### For AI Coding Assistants

AI tools can read the exported diagnostics files to:
- Understand current code issues
- Provide context-aware suggestions
- Automatically fix common problems
- Prioritize work based on severity

### For CI/CD Pipelines

- Parse JSON output for automated quality checks
- Track diagnostic trends over time
- Generate reports

### For Documentation

- Include current issues in project documentation
- Share problem lists with team members

## Development

### Building from Source

```bash
npm install
npm run compile
```

### Running the Extension

1. Open this folder in VS Code
2. Press `F5` to launch Extension Development Host
3. Test the extension in the new window

### Debugging

- Set breakpoints in TypeScript files
- Use the Debug Console to inspect variables
- Check Output panel for extension logs

## Requirements

- VS Code version 1.85.0 or higher

## Known Issues

None at this time. Please report issues on the GitHub repository.

## Release Notes

### 0.1.0

Initial release:
- Automatic diagnostic export on change
- Support for JSON, Markdown, and Text formats
- Configurable filters and output options
- Status bar integration
- Manual export commands

## License

MIT
