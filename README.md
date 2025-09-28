# Magento 2 Development MCP Server

A Model Context Protocol (MCP) server for Magento 2 development, designed to integrate with PhpStorm via Augment and CI/CD pipelines via Auggie.

## Features

- **DI Preferences Tool**: Get dependency injection preferences using `magerun2 dev:di:preferences:list`
- **Cache Management Tools**: Complete cache management using magerun2
  - Clean/flush specific or all caches
  - Enable/disable cache types
  - Check cache status
  - Inspect cache entries
- **JSON Output**: All tools return structured JSON data for easy parsing
- **Error Handling**: Comprehensive error handling with helpful messages
- **Scope Support**: Support for different Magento scopes (global, frontend, adminhtml, etc.)

## Prerequisites

- Node.js 18.x or higher
- [n98-magerun2](https://github.com/netz98/n98-magerun2) installed and available in PATH
- Magento 2 installation

## Installation

1. Clone or download this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the TypeScript code:
   ```bash
   npm run build
   ```

## Usage

### Running the Server

```bash
npm start
```

Or for development with auto-rebuild:
```bash
npm run watch
```

### Available Tools

#### get-di-preferences

Get Magento 2 dependency injection preferences list.

**Parameters:**
- `scope` (optional): The scope to get DI preferences for
  - Options: `global`, `frontend`, `adminhtml`, `webapi_rest`, `webapi_soap`, `crontab`
  - Default: `global`

**Example Usage:**
```json
{
  "name": "get-di-preferences",
  "arguments": {
    "scope": "global"
  }
}
```

#### cache-clean

Clear specific Magento 2 cache types or all caches.

**Parameters:**
- `types` (optional): Array of specific cache types to clean (leave empty for all caches)

**Example Usage:**
```json
{
  "name": "cache-clean",
  "arguments": {
    "types": ["config", "layout"]
  }
}
```

#### cache-flush

Flush specific Magento 2 cache types or all caches.

**Parameters:**
- `types` (optional): Array of specific cache types to flush (leave empty for all caches)

**Example Usage:**
```json
{
  "name": "cache-flush",
  "arguments": {
    "types": ["full_page"]
  }
}
```

#### cache-enable

Enable specific Magento 2 cache types.

**Parameters:**
- `types` (required): Array of cache types to enable

**Example Usage:**
```json
{
  "name": "cache-enable",
  "arguments": {
    "types": ["config", "layout", "block_html"]
  }
}
```

#### cache-disable

Disable specific Magento 2 cache types.

**Parameters:**
- `types` (required): Array of cache types to disable

**Example Usage:**
```json
{
  "name": "cache-disable",
  "arguments": {
    "types": ["full_page"]
  }
}
```

#### cache-status

Check the status of all Magento 2 cache types.

**Parameters:** None

**Example Usage:**
```json
{
  "name": "cache-status",
  "arguments": {}
}
```

#### cache-view

Inspect specific cache entries in Magento 2.

**Parameters:**
- `key` (required): Cache key to inspect
- `type` (optional): Cache type

**Example Usage:**
```json
{
  "name": "cache-view",
  "arguments": {
    "key": "some_cache_key",
    "type": "config"
  }
}
```

### Common Magento 2 Cache Types

When using the cache tools, you can specify these common cache types:

- `config` - Configuration cache
- `layout` - Layout cache
- `block_html` - Block HTML cache
- `collections` - Collections cache
- `reflection` - Reflection cache
- `db_ddl` - Database DDL cache
- `compiled_config` - Compiled configuration cache
- `eav` - EAV types and attributes cache
- `customer_notification` - Customer notification cache
- `config_integration` - Integration configuration cache
- `config_integration_api` - Integration API configuration cache
- `full_page` - Full page cache
- `config_webservice` - Web service configuration cache
- `translate` - Translation cache

## Integration

### PhpStorm with Augment

1. Configure Augment to use this MCP server
2. Add the server configuration to your Augment settings
3. Use the tools through Augment's interface

### CI/CD with Auggie

1. Install the server in your CI/CD environment
2. Configure Auggie to connect to this MCP server
3. Use the tools in your automated workflows

## Development

### Project Structure

```
├── src/
│   └── index.ts          # Main server implementation
├── dist/                 # Compiled JavaScript output
├── package.json          # Node.js dependencies and scripts
├── tsconfig.json         # TypeScript configuration
└── README.md            # This file
```

### Adding New Tools

To add new Magento 2 development tools:

1. Add a new `server.registerTool()` call in `src/index.ts`
2. Define the tool's input schema using Zod
3. Implement the tool's functionality
4. Handle errors appropriately
5. Return structured content

Example:
```typescript
server.registerTool(
  "my-new-tool",
  {
    title: "My New Tool",
    description: "Description of what the tool does",
    inputSchema: {
      parameter: z.string().describe("Parameter description")
    }
  },
  async ({ parameter }) => {
    // Tool implementation
    return {
      content: [{
        type: "text",
        text: "Tool output"
      }]
    };
  }
);
```

### Building and Testing

```bash
# Build the project
npm run build

# Run the server
npm start

# Development mode with auto-rebuild
npm run watch
```

## Error Handling

The server includes comprehensive error handling for common issues:

- **magerun2 not found**: Provides installation instructions
- **Not in Magento directory**: Suggests running from Magento root
- **Command timeouts**: 30-second timeout for magerun2 commands
- **JSON parsing errors**: Shows raw output when JSON parsing fails

## Requirements

- Node.js 18.x or higher (required by MCP SDK)
- n98-magerun2 installed and accessible via PATH
- Valid Magento 2 installation in the working directory

## License

MIT License - see LICENSE file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Future Enhancements

Planned tools for future releases:

- Module analysis tools
- Configuration inspection
- Database schema analysis
- Performance profiling tools
- Code generation helpers
- Index management tools
- Log analysis tools
- Setup and deployment tools
