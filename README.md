# Diagnostics Export

A VS Code extension that automatically exports diagnostics from the Problems pane on a **per-file basis** with a **mirrored source tree structure**, making it easy for AI coding assistants like Claude Code to access error and warning information.

## Features

- **Per-File Export**: Each source file gets its own diagnostics file
- **Mirrored Directory Structure**: Diagnostics tree mirrors your source tree for easy navigation
- **Automatic Export**: Diagnostics are automatically exported whenever they change
- **Multiple Formats**: Export to JSON, Markdown, and Plain Text formats
- **Real-time Updates**: Uses VS Code's `onDidChangeDiagnostics` event for instant updates
- **Optimized for AI**: Targeted reads - AI tools only read diagnostics for files they're analyzing
- **Configurable**: Extensive configuration options for filtering and customization
- **Status Bar Integration**: Shows diagnostic counts with click-to-export functionality

## How It Works

Instead of creating one large diagnostics file, this extension creates a **separate diagnostics file for each source file** that has diagnostics. The directory structure mirrors your source tree:

```
your-project/
├── src/
│   ├── services/
│   │   └── userService.ts
│   └── utils/
│       └── helpers.ts
└── .diagnostics/          ← Mirrored diagnostics tree
    └── src/
        ├── services/
        │   └── userService.ts.json
        └── utils/
            └── helpers.ts.json
```

This approach is **ideal for AI coding assistants** because:
- **Targeted reads**: AI only reads diagnostics for the file it's analyzing
- **Always fresh**: Files are overwritten on change, no stale data
- **Scales better**: No huge aggregated file for large projects
- **Natural mapping**: Matches how AI tools think (file by file)

## Usage

### Automatic Export

By default, the extension automatically exports diagnostics whenever they change. Exported files are saved to `.diagnostics/` in your workspace, mirroring your source tree structure.

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
  "diagnosticsExport.formats": ["json"],
  "diagnosticsExport.outputPath": "${workspaceFolder}/.diagnostics",
  "diagnosticsExport.debounceDelay": 500,
  "diagnosticsExport.severityFilter": "all",
  "diagnosticsExport.excludeSources": []
}
```

### Settings

- `diagnosticsExport.enabled`: Enable/disable the extension (default: `true`)
- `diagnosticsExport.autoExport`: Automatically export on diagnostics change (default: `true`)
- `diagnosticsExport.formats`: Export formats to generate per file - `json`, `markdown`, `text` (default: `["json"]`)
- `diagnosticsExport.outputPath`: Base output path for mirrored diagnostics tree (default: `"${workspaceFolder}/.diagnostics"`)
- `diagnosticsExport.debounceDelay`: Delay in ms before exporting after change (default: `500`)
- `diagnosticsExport.severityFilter`: Filter by severity - `all`, `errorsOnly`, `errorsAndWarnings` (default: `"all"`)
- `diagnosticsExport.excludeSources`: Array of diagnostic sources to exclude (default: `[]`)

## Export Formats

Each source file with diagnostics gets its own export file(s) in the mirrored directory structure.

### JSON Format (Recommended for AI)

File: `.diagnostics/src/services/userService.ts.json`

```json
{
  "file": "src/services/userService.ts",
  "analyzedAt": "2026-03-11T22:00:00.000Z",
  "diagnostics": [
    {
      "source": "ts",
      "severity": "Error",
      "message": "Cannot find name 'foo'",
      "line": 42,
      "column": 10,
      "code": "2304"
    },
    {
      "source": "eslint",
      "severity": "Warning",
      "message": "Prefer const over let",
      "line": 15,
      "column": 5,
      "code": "prefer-const"
    }
  ]
}
```

### Markdown Format

File: `.diagnostics/src/services/userService.ts.md`

```markdown
# Diagnostics: src/services/userService.ts

**Analyzed:** 3/11/2026, 10:00:00 PM
**Total Issues:** 2

## Error (1)
- **Line 42, Col 10:** Cannot find name 'foo' [ts:2304]

## Warning (1)
- **Line 15, Col 5:** Prefer const over let [eslint:prefer-const]
```

### Plain Text Format

File: `.diagnostics/src/services/userService.ts.txt`

```
DIAGNOSTICS: src/services/userService.ts
================================================================================
Analyzed: 3/11/2026, 10:00:00 PM
Total Issues: 2
================================================================================

[Error] Line 42, Col 10
  Cannot find name 'foo' [ts:2304]

[Warning] Line 15, Col 5
  Prefer const over let [eslint:prefer-const]
```

## Use Cases

### For AI Coding Assistants (Primary Use Case)

**Perfect for Claude Code, GitHub Copilot, and other AI assistants:**

- **Targeted context**: AI reads only `.diagnostics/src/file.ts.json` when analyzing `src/file.ts`
- **No parsing overhead**: Small per-file JSON is instant to parse
- **Always current**: File is overwritten on every change, no stale diagnostics
- **Scalable**: Works efficiently even with thousands of files
- **Natural workflow**: Mirrors how AI tools work file-by-file

Example AI workflow:
1. User asks AI to fix `src/services/userService.ts`
2. AI reads `.diagnostics/src/services/userService.ts.json`
3. AI sees exact errors/warnings for that file
4. AI provides targeted fixes

### For CI/CD Pipelines

- Parse per-file JSON for automated quality checks
- Track diagnostic trends over time per file
- Generate file-specific reports
- Easy to parallelize analysis

### For Code Review

- Reviewers can check diagnostics for changed files
- Link diagnostics files in PR comments
- Track issue resolution per file

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
