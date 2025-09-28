# Troubleshooting Guide

## NPX Version Not Starting

If the npx version of the MCP server doesn't start while the local version works, here are some debugging steps:

### 1. Check NPX Installation

```bash
# Test if npx can find the package
npx @elgentos/magento2-dev-mcp --version

# Test if npx can run the package with verbose output
npx --verbose @elgentos/magento2-dev-mcp --help
```

### 2. Check Package Installation

```bash
# Check if the package is properly published
npm view @elgentos/magento2-dev-mcp

# Check the bin field
npm view @elgentos/magento2-dev-mcp bin
```

### 3. Test Local Installation

```bash
# Install locally and test
npm install @elgentos/magento2-dev-mcp
./node_modules/.bin/magento2-dev-mcp --help
```

### 4. Debug NPX Execution

```bash
# Run with debug output
DEBUG=* npx @elgentos/magento2-dev-mcp --help

# Or check what npx is actually executing
npx --package=@elgentos/magento2-dev-mcp --call="which magento2-dev-mcp"
```

### 5. Check Working Directory

The MCP server needs to be run from a Magento 2 project directory. Make sure:

- You're in the root of a Magento 2 project
- The directory contains `app/etc/env.php`
- n98-magerun2 is installed and accessible

### 6. Manual Testing

```bash
# Test the CLI directly
node node_modules/@elgentos/magento2-dev-mcp/dist/cli.js --help

# Test the main server
node node_modules/@elgentos/magento2-dev-mcp/dist/index.js
```

### 7. Common Issues

#### Permission Issues
```bash
# Make sure the CLI is executable
chmod +x node_modules/@elgentos/magento2-dev-mcp/dist/cli.js
```

#### Module Resolution Issues
If you see import errors, it might be a Node.js module resolution issue. Try:

```bash
# Check Node.js version
node --version  # Should be >= 18.0.0

# Check if ES modules are supported
node --input-type=module --eval "console.log('ES modules work')"
```

#### Path Issues
```bash
# Check if magerun2 is in PATH
which magerun2
magerun2 --version
```

### 8. AI Platform Specific Issues

#### Augment Code
If Augment shows the server as not starting:

1. Check the Augment logs for error messages
2. Try using the local node version first:
   ```json
   {
     "mcpServers": {
       "magento2-dev": {
         "command": "node",
         "args": ["node_modules/@elgentos/magento2-dev-mcp/dist/index.js"],
         "cwd": "/path/to/your/magento2/project"
       }
     }
   }
   ```

#### Claude Desktop
Check the Claude Desktop logs:
- macOS: `~/Library/Logs/Claude/`
- Windows: `%APPDATA%\Claude\logs\`

### 9. Environment Variables

You can set these environment variables for debugging:

```bash
export DEBUG=mcp:*
export NODE_ENV=development
```

### 10. Reporting Issues

If none of the above helps, please report the issue with:

1. Node.js version (`node --version`)
2. npm version (`npm --version`)
3. Operating system
4. Full error message
5. Output of `npx --verbose @elgentos/magento2-dev-mcp --help`
6. AI platform being used (Augment, Claude, etc.)

## Working Configurations

### Confirmed Working Setup

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

### Alternative NPX Setup

```json
{
  "mcpServers": {
    "magento2-dev": {
      "command": "npx",
      "args": ["--yes", "@elgentos/magento2-dev-mcp"],
      "cwd": "/path/to/magento2/project"
    }
  }
}
```
