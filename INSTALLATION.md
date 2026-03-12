# Installation Guide

## Installing the VSIX Package Locally

### Method 1: Via VS Code UI (Recommended)

1. Open VS Code
2. Go to **Extensions** view (`Ctrl+Shift+X`)
3. Click the **"..."** menu (top-right of Extensions panel)
4. Select **"Install from VSIX..."**
5. Navigate to `c:\projects\vs-diag-export\diagnostics-export-0.1.0.vsix`
6. Click **Install**
7. Reload VS Code when prompted

### Method 2: Via Command Line

```bash
code --install-extension c:\projects\vs-diag-export\diagnostics-export-0.1.0.vsix
```

### Method 3: Via Command Palette

1. Open Command Palette (`Ctrl+Shift+P`)
2. Type: `Extensions: Install from VSIX...`
3. Select the `diagnostics-export-0.1.0.vsix` file
4. Reload VS Code

## Verifying Installation

After installation:

1. Open any workspace/project
2. Check the **status bar** (bottom-left) for diagnostic counts
3. Open Command Palette and search for "Diagnostics Export"
4. You should see three commands:
   - Export Diagnostics Now
   - Toggle Auto Export
   - Open Export Folder

## Testing the Extension

1. Create a file with some errors (e.g., TypeScript with undefined variables)
2. Wait 500ms for auto-export
3. Check `.vscode/diagnostics/` folder in your workspace
4. You should see:
   - `diagnostics.json`
   - `diagnostics.md`

## Uninstalling

1. Go to Extensions view
2. Find "Diagnostics Export"
3. Click the gear icon → Uninstall

## Configuration

Add to your workspace or user settings (`.vscode/settings.json`):

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

## Troubleshooting

### Extension Not Activating
- Check Output panel → "Diagnostics Export" for errors
- Ensure workspace folder is open (extension requires workspace)

### No Export Files Created
- Check that `diagnosticsExport.enabled` is `true`
- Verify output path exists or can be created
- Check file permissions

### Auto-Export Not Working
- Verify `diagnosticsExport.autoExport` is `true`
- Check debounce delay setting
- Look for errors in Debug Console
