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
- **Stays current**: Files are overwritten when diagnostics change; deleted when issues are resolved
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
      "code": 2304
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

#### Prerequisites
- Node.js 20.x or higher
- npm (comes with Node.js)
- Git

#### Build Steps

```bash
# Clone the repository (if not already cloned)
git clone https://github.com/your-username/vs-diag-export.git
cd vs-diag-export

# Install dependencies
npm install

# Compile TypeScript to JavaScript
npm run compile

# Watch mode (auto-compile on file changes)
npm run watch
```

### Building VSIX Package

To create an installable `.vsix` package:

```bash
# Install vsce globally (one-time setup)
npm install -g @vscode/vsce

# Build the VSIX package
npm run package
# or
vsce package

# Output: diagnostics-export-0.2.6.vsix
```

### Installing Locally

After building the VSIX:

**Option 1: Via VS Code UI**
1. Open VS Code
2. Go to Extensions (`Ctrl+Shift+X`)
3. Click `...` menu → `Install from VSIX...`
4. Select `diagnostics-export-0.2.6.vsix`

**Option 2: Via Command Line**
```bash
code --install-extension diagnostics-export-0.2.6.vsix
```

### Running the Extension in Development Mode

1. Open this folder in VS Code
2. Press `F5` to launch Extension Development Host
3. A new VS Code window opens with the extension loaded
4. Test the extension in the new window
5. Check Debug Console for logs

### Project Structure

```
vs-diag-export/
├── src/                          # TypeScript source files
│   ├── extension.ts              # Extension entry point
│   ├── diagnosticsExporter.ts    # Core export logic
│   ├── types.ts                  # TypeScript interfaces
│   └── formatters/               # Export formatters
│       ├── jsonFormatter.ts
│       ├── markdownFormatter.ts
│       └── textFormatter.ts
├── out/                          # Compiled JavaScript (generated)
├── package.json                  # Extension manifest
├── tsconfig.json                 # TypeScript configuration
└── .vscode/
    ├── launch.json               # Debug configuration
    └── tasks.json                # Build tasks
```

### Available Scripts

```bash
# Compile TypeScript
npm run compile

# Watch mode (auto-compile on changes)
npm run watch

# Lint code
npm run lint

# Build VSIX package
npm run package

# Full build (compile + package)
npm run build

# Publish to VS Code Marketplace
npm run publish
```

### Debugging

- **Set breakpoints** in TypeScript files (`.ts`)
- **Debug Console** shows extension logs and errors
- **Output panel** → "Diagnostics Export" for runtime logs
- **Reload window** (`Ctrl+R`) in Extension Development Host to reload changes

### Testing Changes

1. Make code changes in TypeScript files
2. Save files (auto-compile if using watch mode)
3. Reload Extension Development Host window (`Ctrl+R`)
4. Test your changes
5. Check Debug Console for errors

## Requirements

- VS Code version 1.85.0 or higher

## Known Issues

None at this time. Please report issues on the GitHub repository.

## Release Notes

### 0.2.5

**Critical bug fixes:**
- Fixed recursive export bug where `.diagnostics/` folder files were being exported, creating `.diagnostics/.diagnostics/` paths
- Files inside `.diagnostics/` folder are now explicitly excluded from export

### 0.2.4

**Bug fixes:**
- Fixed infinite export loop where same files were exported repeatedly
- Added export lock to prevent concurrent exports
- Added rate limiting (1 second minimum interval between exports of same file)
- Improved logging to show skipped duplicate exports

### 0.2.3

**Debugging improvements:**
- Added Output channel logging for troubleshooting export issues
- View logs in Output panel → "Diagnostics Export"
- Shows detailed export activity (source files, output paths, relative paths)

### 0.2.2

**Important: Clean install required**
- Added workspace and file scheme filtering to prevent exporting non-workspace files
- Fixed default output path in `openExportFolder` command
- **Note:** If upgrading from 0.1.0 or 0.2.0, uninstall the old version first to avoid conflicts

### 0.2.1

**Bug fix:**
- Fixed: Diagnostics files are now properly deleted when all issues in a file are resolved
- Previously, files would update but not delete when the last diagnostic was fixed

### 0.2.0

**Major architectural change - Per-file export with mirrored source tree:**
- **Breaking Change**: Diagnostics now exported per-file instead of aggregated
- Mirrored directory structure (`.diagnostics/` mirrors source tree)
- Optimized for AI coding assistants (targeted reads, always fresh)
- Improved scalability for large projects
- Changed default output path to `${workspaceFolder}/.diagnostics`
- Changed default format to `["json"]` only
- Only exports files that have diagnostics changes (efficient)
- Added `.diagnostics/` to gitignore

### 0.1.0

Initial release:
- Automatic diagnostic export on change
- Support for JSON, Markdown, and Text formats
- Configurable filters and output options
- Status bar integration
- Manual export commands

## License

MIT
