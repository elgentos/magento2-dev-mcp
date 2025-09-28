# Magento 2 Development MCP Server

A Model Context Protocol (MCP) server for Magento 2 development, designed to integrate with PhpStorm via Augment and CI/CD pipelines via Auggie.

## Features

- **DI & Module Tools**: Dependency injection and module inspection
  - Get DI preferences for all scopes
  - List modules and their status
  - List module observers
  - Create new modules
  - List available themes
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
  - List all stores, websites, and store views
  - List base URLs for all stores
  - Get all system URLs
  - List all websites
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

<details>
<summary><strong>get-di-preferences</strong> - Get Magento 2 dependency injection preferences list</summary>

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

</details>

<details>
<summary><strong>dev-module-list</strong> - List all Magento 2 modules and their status</summary>

**Parameters:**
- `format` (optional): Output format (`table`, `json`, `csv`) - Default: `table`
- `enabled` (optional): Show only enabled modules
- `disabled` (optional): Show only disabled modules

</details>

<details>
<summary><strong>dev-module-observer-list</strong> - List all Magento 2 module observers</summary>

**Parameters:**
- `format` (optional): Output format (`table`, `json`, `csv`) - Default: `table`
- `event` (optional): Filter by specific event name

</details>

<details>
<summary><strong>dev-theme-list</strong> - List all available Magento 2 themes</summary>

**Parameters:**
- `format` (optional): Output format (`table`, `json`, `csv`) - Default: `table`

</details>

<details>
<summary><strong>dev-module-create</strong> - Create and register a new Magento 2 module</summary>

**Parameters:**
- `vendorNamespace` (required): Namespace (your company prefix)
- `moduleName` (required): Name of your module
- `minimal` (optional): Create only module file
- `addBlocks` (optional): Add blocks
- `addHelpers` (optional): Add helpers
- `addModels` (optional): Add models
- `addSetup` (optional): Add SQL setup
- `addAll` (optional): Add blocks, helpers and models
- `enable` (optional): Enable module after creation
- `modman` (optional): Create all files in folder with a modman file
- `addReadme` (optional): Add a readme.md file to generated module
- `addComposer` (optional): Add a composer.json file to generated module
- `addStrictTypes` (optional): Add strict_types declaration to generated PHP files
- `authorName` (optional): Author for readme.md or composer.json
- `authorEmail` (optional): Author email for readme.md or composer.json
- `description` (optional): Description for readme.md or composer.json

**Example Usage:**
```json
{
  "name": "dev-module-create",
  "arguments": {
    "vendorNamespace": "MyCompany",
    "moduleName": "CustomModule",
    "addAll": true,
    "enable": true,
    "addReadme": true,
    "addComposer": true,
    "authorName": "John Doe",
    "authorEmail": "john@example.com",
    "description": "A custom Magento 2 module"
  }
}
```

</details>

## System Diagnostics

<details>
<summary><strong>sys-info</strong> - Get Magento 2 system information</summary>

**Parameters:**
- `format` (optional): Output format (`table`, `json`, `csv`) - Default: `table`

</details>

<details>
<summary><strong>sys-check</strong> - Check Magento 2 system requirements and configuration</summary>

**Parameters:** None

</details>

## Cache Management

<details>
<summary><strong>Cache Management Tools</strong> - Complete cache management suite</summary>

**Available Tools:**
- `cache-clean` - Clear specific or all caches
- `cache-flush` - Flush specific or all caches
- `cache-enable` - Enable specific cache types
- `cache-disable` - Disable specific cache types
- `cache-status` - Check cache status
- `cache-view` - Inspect cache entries

See [Cache Types Reference](docs/cache-types.md) for details.

</details>

## Configuration Management

<details>
<summary><strong>config-show</strong> - View Magento 2 system configuration values</summary>

**Parameters:**
- `path` (optional): Configuration path to show
- `scope` (optional): Configuration scope (default, website, store)
- `scopeId` (optional): Scope ID (website ID or store ID)

</details>

<details>
<summary><strong>config-set</strong> - Set Magento 2 system configuration values</summary>

**Parameters:**
- `path` (required): Configuration path to set
- `value` (required): Value to set
- `scope` (optional): Configuration scope
- `scopeId` (optional): Scope ID
- `encrypt` (optional): Encrypt the value

</details>

<details>
<summary><strong>config-store-get / config-store-set</strong> - Store-specific configuration management tools</summary>

Store-specific configuration management for getting and setting configuration values at the store level.

</details>

## Database Tools

<details>
<summary><strong>db-query</strong> - Execute SQL queries directly on Magento 2 database</summary>

**Parameters:**
- `query` (required): SQL query to execute
- `format` (optional): Output format (`table`, `json`, `csv`) - Default: `table`

</details>

## Setup & Deployment

<details>
<summary><strong>setup-upgrade</strong> - Run Magento 2 setup upgrade to update database schema and data</summary>

**Parameters:**
- `keepGenerated` (optional): Keep generated files during upgrade

</details>

<details>
<summary><strong>setup-di-compile</strong> - Compile Magento 2 dependency injection configuration</summary>

**Parameters:** None

</details>

<details>
<summary><strong>setup-db-status</strong> - Check database status to see if setup:upgrade is needed</summary>

**Parameters:** None

</details>

<details>
<summary><strong>setup-static-content-deploy</strong> - Deploy Magento 2 static content and assets</summary>

**Parameters:**
- `languages` (optional): Languages to deploy
- `themes` (optional): Themes to deploy
- `jobs` (optional): Number of parallel jobs
- `force` (optional): Force deployment

</details>

## Store Management

<details>
<summary><strong>sys-store-list</strong> - List all Magento 2 stores, websites, and store views</summary>

**Parameters:**
- `format` (optional): Output format (`table`, `json`, `csv`) - Default: `table`

</details>

<details>
<summary><strong>sys-store-config-base-url-list</strong> - List all base URLs for Magento 2 stores</summary>

**Parameters:**
- `format` (optional): Output format (`table`, `json`, `csv`) - Default: `table`

</details>

<details>
<summary><strong>sys-url-list</strong> - Get all Magento 2 URLs</summary>

**Parameters:**
- `format` (optional): Output format (`table`, `json`, `csv`) - Default: `table`
- `storeId` (optional): Store ID to filter URLs

</details>

<details>
<summary><strong>sys-website-list</strong> - List all Magento 2 websites</summary>

**Parameters:**
- `format` (optional): Output format (`table`, `json`, `csv`) - Default: `table`

</details>

## Cron Management

<details>
<summary><strong>sys-cron-list</strong> - List all Magento 2 cron jobs and their configuration</summary>

**Parameters:**
- `format` (optional): Output format (`table`, `json`, `csv`) - Default: `table`

</details>

<details>
<summary><strong>sys-cron-run</strong> - Run Magento 2 cron jobs</summary>

**Parameters:**
- `job` (optional): Specific cron job to run
- `group` (optional): Cron group to run

</details>

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
