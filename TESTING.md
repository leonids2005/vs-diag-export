# Testing the Diagnostics Export Extension

## Running in Development Mode

### Option 1: Press F5 (Recommended)
1. Open this project folder in VS Code
2. Press **F5** (or Run > Start Debugging)
3. A new "Extension Development Host" window will open
4. The extension will be active in that window

### Option 2: Run from Command Palette
1. Open Command Palette (`Ctrl+Shift+P`)
2. Type "Debug: Start Debugging"
3. Select "Run Extension"

## What Happens When You Run It

1. TypeScript code is automatically compiled (watch mode)
2. New VS Code window opens with extension loaded
3. Extension activates on startup
4. Status bar shows diagnostic counts
5. Diagnostics are automatically exported to `.vscode/diagnostics/`

## Testing the Extension

### 1. Create a Test File with Errors

In the Extension Development Host window, create a test file:

**test.ts**
```typescript
// This will generate diagnostics
let x = undefinedVariable;
const y: number = "string";
function foo() {
    return bar();  // bar is not defined
}
```

### 2. Check Export Files

Navigate to `.vscode/diagnostics/` in your workspace:
- `diagnostics.json` - JSON format
- `diagnostics.md` - Markdown format

### 3. Test Commands

Open Command Palette (`Ctrl+Shift+P`) and try:
- "Diagnostics Export: Export Now"
- "Diagnostics Export: Toggle Auto Export"
- "Diagnostics Export: Open Export Folder"

### 4. Test Status Bar

- Look at bottom-left status bar
- Should show error/warning counts
- Click it to manually export

### 5. Test Auto-Export

1. Add/remove errors in your test file
2. Wait 500ms (debounce delay)
3. Check that export files update automatically

## Verifying It Works

✅ Status bar shows diagnostic counts
✅ Export files created in `.vscode/diagnostics/`
✅ Files update when you add/remove errors
✅ Commands appear in Command Palette
✅ No errors in Debug Console

## Installing as VSIX (For Production Use)

To install permanently:

```bash
# Package the extension
npm install -g @vscode/vsce
vsce package

# This creates diagnostics-export-0.1.0.vsix
# Install it via:
# Extensions > ... > Install from VSIX
```

## Debugging

- Check **Debug Console** for logs
- Set breakpoints in TypeScript files
- Use `console.log()` statements
- Check **Output** panel > "Diagnostics Export"
