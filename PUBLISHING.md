# Publishing Checklist

## Pre-Publishing Steps

1. **Update version in package.json** (if needed):
   ```bash
   npm version patch  # for bug fixes
   npm version minor  # for new features
   npm version major  # for breaking changes
   ```

2. **Build the project**:
   ```bash
   npm run build
   ```

3. **Test the CLI locally**:
   ```bash
   node dist/cli.js --help
   node dist/cli.js --version
   ```

4. **Test the package locally**:
   ```bash
   npm pack
   # This creates a .tgz file you can test with:
   # npm install ./elgentos-magento2-dev-mcp-1.0.0.tgz
   ```

## Publishing to npm

1. **Login to npm** (if not already logged in):
   ```bash
   npm login
   ```

2. **Publish the package**:
   ```bash
   npm publish --access public
   ```

   Note: The `--access public` flag is required for scoped packages (@elgentos/...)

## Post-Publishing Steps

1. **Test installation via npx**:
   ```bash
   npx @elgentos/magento2-dev-mcp --help
   ```

2. **Update GitHub repository** (if applicable):
   - Create a release tag
   - Update any documentation
   - Add release notes

## Usage for End Users

Once published, users can use your MCP server in several ways:

### 1. Direct npx usage (Recommended)
```json
{
  "mcpServers": {
    "magento2-dev": {
      "command": "npx",
      "args": ["@elgentos/magento2-dev-mcp"],
      "cwd": "/path/to/magento2/project"
    }
  }
}
```

### 2. Local installation
```bash
npm install @elgentos/magento2-dev-mcp
```

Then use:
```json
{
  "mcpServers": {
    "magento2-dev": {
      "command": "node",
      "args": ["node_modules/@elgentos/magento2-dev-mcp/dist/index.js"],
      "cwd": "/path/to/magento2/project"
    }
  }
}
```

### 3. Global installation
```bash
npm install -g @elgentos/magento2-dev-mcp
```

Then use:
```json
{
  "mcpServers": {
    "magento2-dev": {
      "command": "magento2-dev-mcp",
      "cwd": "/path/to/magento2/project"
    }
  }
}
```

## Package Information

- **Package name**: `@elgentos/magento2-dev-mcp`
- **Binary name**: `magento2-dev-mcp`
- **Main entry**: `dist/index.js`
- **CLI entry**: `dist/cli.js`

## Troubleshooting

### Common Issues

1. **Permission denied**: Make sure the CLI file has execute permissions
2. **Module not found**: Ensure all dependencies are properly listed in package.json
3. **npx not working**: Check that the bin field in package.json is correct

### Testing Locally

To test the package locally before publishing:

```bash
# Build the package
npm run build

# Create a test directory
mkdir test-install
cd test-install

# Install from local directory
npm install ../

# Test the installation
npx @elgentos/magento2-dev-mcp --help
```
