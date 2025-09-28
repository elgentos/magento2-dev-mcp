# Magento 2 Development MCP Server

A Model Context Protocol (MCP) server for Magento 2 development, designed to integrate with PhpStorm via Augment and CI/CD pipelines via Auggie.

## Features

- **DI & Module Tools**: Dependency injection and module inspection
  - Get DI preferences for all scopes
  - List modules and their status
  - List module observers
- **Cache Management**: Complete cache management using magerun2
  - Clean/flush specific or all caches
  - Enable/disable cache types
  - Check cache status
  - Inspect cache entries
- **System Diagnostics**: System information and health checks
  - Get system information
  - Check system requirements
- **Configuration Management**: View and modify system configuration
  - Show/set system configuration
  - Store-specific configuration management
- **Database Tools**: Direct database access and queries
  - Execute SQL queries with formatted output
- **Setup & Deployment**: Database and asset deployment tools
  - Run setup upgrade
  - Compile DI configuration
  - Check database status
  - Deploy static content
- **Store Management**: Store, website, and store view management
  - List all stores and their configuration
- **Cron Management**: Cron job control and monitoring
  - List cron jobs
  - Run specific cron jobs or groups
- **Multiple Output Formats**: JSON, table, and CSV output for most tools
- **Error Handling**: Comprehensive error handling with helpful messages
- **Scope Support**: Support for different Magento scopes and contexts

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

## DI & Module Tools

#### get-di-preferences

Get Magento 2 dependency injection preferences list.

**Parameters:**
- `scope` (optional): The scope to get DI preferences for
  - Options: `global`, `adminhtml`, `frontend`, `crontab`, `webapi_rest`, `webapi_soap`, `graphql`, `doc`, `admin`
  - Default: `global`

**Available Scopes:**
- `global` - Global scope (default)
- `adminhtml` - Admin area
- `frontend` - Frontend/storefront area
- `crontab` - Cron job execution context
- `webapi_rest` - REST API context
- `webapi_soap` - SOAP API context
- `graphql` - GraphQL API context
- `doc` - Documentation context
- `admin` - Admin context (alternative to adminhtml)

#### dev-module-list

List all Magento 2 modules and their status.

**Parameters:**
- `format` (optional): Output format (`table`, `json`, `csv`) - Default: `table`
- `enabled` (optional): Show only enabled modules
- `disabled` (optional): Show only disabled modules

#### dev-module-observer-list

List all Magento 2 module observers.

**Parameters:**
- `format` (optional): Output format (`table`, `json`, `csv`) - Default: `table`
- `event` (optional): Filter by specific event name

## System Diagnostics

#### sys-info

Get Magento 2 system information.

**Parameters:**
- `format` (optional): Output format (`table`, `json`, `csv`) - Default: `table`

#### sys-check

Check Magento 2 system requirements and configuration.

**Parameters:** None

## Cache Management

#### cache-clean / cache-flush / cache-enable / cache-disable / cache-status / cache-view

Complete cache management tools. See [Cache Types Reference](docs/cache-types.md) for details.

## Configuration Management

#### config-show

View Magento 2 system configuration values.

**Parameters:**
- `path` (optional): Configuration path to show
- `scope` (optional): Configuration scope (default, website, store)
- `scopeId` (optional): Scope ID (website ID or store ID)

#### config-set

Set Magento 2 system configuration values.

**Parameters:**
- `path` (required): Configuration path to set
- `value` (required): Value to set
- `scope` (optional): Configuration scope
- `scopeId` (optional): Scope ID
- `encrypt` (optional): Encrypt the value

#### config-store-get / config-store-set

Store-specific configuration management tools.

## Database Tools

#### db-query

Execute SQL queries directly on Magento 2 database.

**Parameters:**
- `query` (required): SQL query to execute
- `format` (optional): Output format (`table`, `json`, `csv`) - Default: `table`

## Setup & Deployment

#### setup-upgrade

Run Magento 2 setup upgrade to update database schema and data.

**Parameters:**
- `keepGenerated` (optional): Keep generated files during upgrade

#### setup-di-compile

Compile Magento 2 dependency injection configuration.

#### setup-db-status

Check database status to see if setup:upgrade is needed.

#### setup-static-content-deploy

Deploy Magento 2 static content and assets.

**Parameters:**
- `languages` (optional): Languages to deploy
- `themes` (optional): Themes to deploy
- `jobs` (optional): Number of parallel jobs
- `force` (optional): Force deployment

## Store Management

#### sys-store-list

List all Magento 2 stores, websites, and store views.

**Parameters:**
- `format` (optional): Output format (`table`, `json`, `csv`) - Default: `table`

## Cron Management

#### sys-cron-list

List all Magento 2 cron jobs and their configuration.

**Parameters:**
- `format` (optional): Output format (`table`, `json`, `csv`) - Default: `table`

#### sys-cron-run

Run Magento 2 cron jobs.

**Parameters:**
- `job` (optional): Specific cron job to run
- `group` (optional): Cron group to run

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
