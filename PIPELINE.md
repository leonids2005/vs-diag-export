# CI/CD Pipeline Setup

## Overview

This document outlines how to set up automated building and publishing for the Diagnostics Export extension.

## Prerequisites

- Node.js 20.x or higher
- npm
- Git repository
- VS Code Marketplace publisher account (for publishing)

## Building the Extension

### Local Build

```bash
# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Package as VSIX
npm install -g @vscode/vsce
vsce package
```

This creates `diagnostics-export-0.1.0.vsix`

### Build Script

Add to `package.json`:

```json
{
  "scripts": {
    "build": "npm run compile && vsce package",
    "package": "vsce package",
    "publish": "vsce publish"
  }
}
```

## GitHub Actions Pipeline

### Example Workflow: `.github/workflows/build.yml`

```yaml
name: Build and Package Extension

on:
  push:
    branches: [ main, master ]
  pull_request:
    branches: [ main, master ]
  release:
    types: [ created ]

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '20.x'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Compile TypeScript
      run: npm run compile
    
    - name: Lint
      run: npm run lint
      continue-on-error: true
    
    - name: Install VSCE
      run: npm install -g @vscode/vsce
    
    - name: Package Extension
      run: vsce package
    
    - name: Upload VSIX Artifact
      uses: actions/upload-artifact@v3
      with:
        name: vsix-package
        path: '*.vsix'
        retention-days: 30

  publish:
    needs: build
    runs-on: ubuntu-latest
    if: github.event_name == 'release'
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '20.x'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Install VSCE
      run: npm install -g @vscode/vsce
    
    - name: Publish to Marketplace
      run: vsce publish -p ${{ secrets.VSCE_PAT }}
      env:
        VSCE_PAT: ${{ secrets.VSCE_PAT }}
```

## Azure DevOps Pipeline

### Example: `azure-pipelines.yml`

```yaml
trigger:
  branches:
    include:
    - main
    - master

pool:
  vmImage: 'ubuntu-latest'

steps:
- task: NodeTool@0
  inputs:
    versionSpec: '20.x'
  displayName: 'Install Node.js'

- script: |
    npm ci
  displayName: 'Install dependencies'

- script: |
    npm run compile
  displayName: 'Compile TypeScript'

- script: |
    npm install -g @vscode/vsce
    vsce package
  displayName: 'Package extension'

- task: PublishBuildArtifacts@1
  inputs:
    pathToPublish: '$(Build.SourcesDirectory)/*.vsix'
    artifactName: 'vsix-package'
  displayName: 'Publish VSIX artifact'

- script: |
    vsce publish -p $(VSCE_PAT)
  displayName: 'Publish to Marketplace'
  condition: and(succeeded(), eq(variables['Build.SourceBranch'], 'refs/heads/main'))
  env:
    VSCE_PAT: $(VSCE_PAT)
```

## Publishing to VS Code Marketplace

### 1. Create Publisher Account

1. Go to https://marketplace.visualstudio.com/manage
2. Sign in with Microsoft/GitHub account
3. Create a publisher (e.g., "your-publisher-name")

### 2. Generate Personal Access Token (PAT)

1. Go to https://dev.azure.com
2. User Settings → Personal Access Tokens
3. Create new token with **Marketplace (Publish)** scope
4. Save the token securely

### 3. Update package.json

```json
{
  "publisher": "your-publisher-name"
}
```

### 4. Publish

```bash
# Login (one-time)
vsce login your-publisher-name

# Publish
vsce publish
```

### 5. Store PAT in CI/CD Secrets

**GitHub Actions:**
- Repository Settings → Secrets → Actions
- Add `VSCE_PAT` secret

**Azure DevOps:**
- Pipeline → Edit → Variables
- Add `VSCE_PAT` as secret variable

## Versioning Strategy

### Semantic Versioning

- **Patch** (0.1.X): Bug fixes
- **Minor** (0.X.0): New features, backward compatible
- **Major** (X.0.0): Breaking changes

### Auto-versioning in Pipeline

```bash
# Bump patch version
npm version patch

# Bump minor version
npm version minor

# Bump major version
npm version major
```

## Release Process

1. Update version in `package.json`
2. Update `README.md` changelog
3. Commit changes
4. Create Git tag: `git tag v0.1.0`
5. Push tag: `git push origin v0.1.0`
6. Create GitHub/Azure DevOps release
7. Pipeline automatically builds and publishes

## Testing Before Release

```bash
# Install locally for testing
code --install-extension diagnostics-export-0.1.0.vsix

# Test in different workspaces
# Verify all features work
# Check for errors in Output panel
```

## Continuous Deployment Checklist

- [ ] Set up repository
- [ ] Configure pipeline (GitHub Actions/Azure DevOps)
- [ ] Create publisher account
- [ ] Generate PAT token
- [ ] Add PAT to pipeline secrets
- [ ] Update publisher name in package.json
- [ ] Test build pipeline
- [ ] Test publish pipeline (dry run)
- [ ] Create first release

## Additional Considerations

### Add Repository Field

Update `package.json`:

```json
{
  "repository": {
    "type": "git",
    "url": "https://github.com/your-username/vs-diag-export.git"
  }
}
```

### Add License

Create `LICENSE` file (MIT recommended):

```
MIT License

Copyright (c) 2026 Your Name

Permission is hereby granted, free of charge...
```

### Add to package.json

```json
{
  "license": "MIT"
}
```
