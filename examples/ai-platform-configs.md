# AI Platform Configuration Examples

## Claude Desktop (Anthropic)

Add to your Claude Desktop configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "magento2-dev": {
      "command": "npx",
      "args": ["@elgentos/magento2-dev-mcp"],
      "cwd": "/path/to/your/magento2/project"
    }
  }
}
```

## Cursor IDE

Add to your Cursor MCP configuration:

```json
{
  "mcpServers": {
    "magento2-dev": {
      "command": "npx",
      "args": ["@elgentos/magento2-dev-mcp"],
      "cwd": "/path/to/your/magento2/project"
    }
  }
}
```

## Continue.dev

Add to your Continue configuration:

```json
{
  "models": [...],
  "mcpServers": [
    {
      "name": "magento2-dev",
      "command": "npx",
      "args": ["@elgentos/magento2-dev-mcp"],
      "cwd": "/path/to/your/magento2/project"
    }
  ]
}
```

## Augment Code

Add to your Augment configuration:

```json
{
  "name": "Magento 2 Development MCP Server",
  "description": "MCP server for Magento 2 development tools",
  "version": "1.0.0",
  "server": {
    "command": "npx",
    "args": ["@elgentos/magento2-dev-mcp"],
    "cwd": "/path/to/your/magento2/project",
    "env": {}
  }
}
```

## Local Development (without npx)

If you prefer to install the package locally:

```bash
npm install @elgentos/magento2-dev-mcp
```

Then use this configuration:

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

## Environment Variables

You can set environment variables for the MCP server:

```json
{
  "mcpServers": {
    "magento2-dev": {
      "command": "npx",
      "args": ["@elgentos/magento2-dev-mcp"],
      "cwd": "/path/to/your/magento2/project",
      "env": {
        "MAGERUN_BIN": "/custom/path/to/n98-magerun2",
        "NODE_ENV": "production"
      }
    }
  }
}
```

## Requirements

- Node.js 18.x or higher
- n98-magerun2 installed and accessible via PATH
- Valid Magento 2 installation in the working directory
- The AI platform must support MCP (Model Context Protocol)
