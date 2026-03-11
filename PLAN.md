# VS Code Diagnostics Export Extension

Create a VS Code extension that automatically exports the Problems pane diagnostics to multiple formats whenever diagnostics are updated, making it easy for AI coding assistants to access error/warning information.

## Overview

This extension will:
- Monitor VS Code's diagnostics (Problems pane) in real-time
- Automatically export diagnostics when they change
- Support multiple export formats (JSON, Markdown, Plain Text)
- Provide manual export commands as backup
- Include configuration options for export behavior

## Key Features

### 1. Automatic Export on Diagnostics Update
- Listen to `vscode.languages.onDidChangeDiagnostics` event
- Debounce updates to avoid excessive writes (configurable delay, default 500ms)
- Export to configured location whenever diagnostics change

### 2. Multiple Export Formats
- **JSON**: Structured format with all diagnostic details
  - File path, line, column, severity, message, source, code
  - Easy for AI assistants to parse programmatically
- **Markdown**: Human-readable format
  - Grouped by file and severity
  - Formatted for easy reading
- **Plain Text**: Simple list format
  - One diagnostic per line
  - Lightweight and universal

### 3. Export Triggers
- **Primary**: Automatic on diagnostics change (using `onDidChangeDiagnostics`)
- **Secondary**: Manual command via Command Palette
- **Tertiary**: Status bar button showing diagnostic count with click-to-export

### 4. Configuration Options
- Enable/disable automatic export
- Choose export format(s)
- Set export file location (default: workspace root)
- Configure debounce delay
- Filter by severity (errors only, warnings+errors, all)
- Include/exclude specific diagnostic sources

## Technical Implementation

### Extension Structure
```
vs-diag-export/
├── package.json              # Extension manifest
├── tsconfig.json            # TypeScript configuration
├── src/
│   ├── extension.ts         # Main extension entry point
│   ├── diagnosticsExporter.ts  # Core export logic
│   ├── formatters/
│   │   ├── jsonFormatter.ts
│   │   ├── markdownFormatter.ts
│   │   └── textFormatter.ts
│   └── types.ts             # Type definitions
├── .vscode/
│   └── launch.json          # Debug configuration
├── .vscodeignore           # Files to exclude from package
└── README.md               # Extension documentation
```

### Core Components

#### 1. Extension Activation (`extension.ts`)
- Register commands
- Initialize diagnostics listener
- Create status bar item
- Set up configuration watchers

#### 2. Diagnostics Exporter (`diagnosticsExporter.ts`)
- Subscribe to `vscode.languages.onDidChangeDiagnostics`
- Implement debouncing mechanism
- Collect all workspace diagnostics
- Coordinate with formatters
- Write to file system

#### 3. Formatters (`formatters/`)
- **JSON Formatter**: Convert diagnostics to structured JSON
- **Markdown Formatter**: Create formatted markdown output
- **Text Formatter**: Generate plain text list

#### 4. Status Bar Integration
- Show diagnostic count (errors/warnings)
- Click to manually trigger export
- Visual indicator when export occurs

### VS Code APIs Used
- `vscode.languages.getDiagnostics()` - Get all diagnostics
- `vscode.languages.onDidChangeDiagnostics` - Listen for changes
- `vscode.workspace.fs` - File system operations
- `vscode.commands.registerCommand()` - Register commands
- `vscode.window.createStatusBarItem()` - Status bar UI
- `vscode.workspace.getConfiguration()` - Read settings

## Configuration Schema

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

## Commands

- `diagnosticsExport.exportNow` - Manually trigger export
- `diagnosticsExport.toggleAutoExport` - Enable/disable auto-export
- `diagnosticsExport.openExportFolder` - Open folder with exported files

## Implementation Steps

1. **Initialize Extension Project**
   - Run `yo code` to scaffold TypeScript extension
   - Configure package.json with extension metadata
   - Set up TypeScript configuration

2. **Implement Core Diagnostics Listener**
   - Create diagnostics exporter class
   - Subscribe to onDidChangeDiagnostics event
   - Implement debouncing logic
   - Collect diagnostics from all workspace files

3. **Build Formatters**
   - JSON formatter with complete diagnostic data
   - Markdown formatter with grouped, readable output
   - Plain text formatter for simple listing

4. **Add File Export Logic**
   - Create output directory if needed
   - Write files atomically
   - Handle file system errors gracefully

5. **Create UI Elements**
   - Register Command Palette commands
   - Add status bar item with diagnostic count
   - Implement click handler for manual export

6. **Configuration System**
   - Define configuration schema in package.json
   - Read user settings
   - Apply filters and preferences
   - Watch for configuration changes

7. **Testing & Documentation**
   - Test with various diagnostic scenarios
   - Verify debouncing works correctly
   - Write README with usage instructions
   - Add example output files

## Expected Output Examples

### JSON Format
```json
{
  "exportedAt": "2026-03-11T18:57:00.000Z",
  "totalCount": 5,
  "errorCount": 2,
  "warningCount": 3,
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
```markdown
# Diagnostics Export
Exported: 2026-03-11 18:57:00
Total: 5 (2 errors, 3 warnings)

## Errors (2)
### src/app.ts
- Line 42, Col 10: Cannot find name 'foo' [ts:2304]
```

## Benefits for AI Assistants

- **Real-time access**: Diagnostics automatically available in file system
- **Structured data**: JSON format easy to parse programmatically
- **Context-aware**: AI can read diagnostics without needing VS Code API access
- **Multiple formats**: Choose format that best suits the AI tool
- **Workspace-scoped**: All problems in one place for comprehensive analysis

## Future Enhancements (Optional)

- Export to clipboard
- HTTP endpoint for remote access
- Diagnostic history tracking
- Custom export templates
- Integration with specific AI tools
