# Magento 2 Development MCP Server

A Model Context Protocol (MCP) server for Magento 2 development, designed to integrate with AI agents like Claude, Cursor, Continue.dev, and Augment Code.

<img width="690" height="705" alt="image" src="https://github.com/user-attachments/assets/491e4f5d-d145-46b7-a509-56982508199a" />

## Installation

### Using npx

```bash
npx -y @elgentos/magento2-dev-mcp
```

## Quick Start

1. **Add to your AI agent's MCP configuration:**

```json
{
  "mcpServers": {
    "magento2-dev": {
      "command": "npx",
      "args": ["-y", "@elgentos/magento2-dev-mcp"]
    }
  }
}
```

2. **Restart your AI agent** to load the MCP server

3. **Start using Magento 2 development tools** through your AI agent!

See [AI Platform Configuration Examples](examples/ai-platform-configs.md) for platform-specific setup instructions.

## Docker Environment Support

The server automatically detects Docker-based Magento environments and routes `magerun2` commands through the container:

| Environment | Detection | Command prefix |
|---|---|---|
| **Warden** | `WARDEN_ENV_TYPE` in `.env` | `warden shell -c '...'` |
| **DDEV** | `.ddev/` directory | `ddev exec ...` |
| **docker-magento** | `bin/clinotty` file | `bin/clinotty ...` |
| **docker-compose** | `docker-compose.yml` or `compose.yaml` | `docker compose exec -T <service> ...` |

For docker-compose the server tries the service names `phpfpm`, `php-fpm`, and `php` in order.

If Docker execution fails, the server falls back to running `magerun2` locally.

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `MAGERUN2_COMMAND` | Override the magerun2 binary name or path | `magerun2` |

Use `MAGERUN2_COMMAND` when your system installs the binary under a different name (e.g. `n98-magerun2`) or when you need to specify an absolute path:

```json
{
  "mcpServers": {
    "magento2-dev": {
      "command": "npx",
      "args": ["-y", "@elgentos/magento2-dev-mcp"],
      "env": {
        "MAGERUN2_COMMAND": "n98-magerun2"
      }
    }
  }
}
```

## Features

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

<details>
<summary><strong>dev-plugin-list</strong> - Get plugin (interceptor) list for a class</summary>

Analyzes `di.xml` files across all DI scopes to find plugins for a given class. Resolves the full class hierarchy (parent classes and interfaces) so inherited plugins are included. Returns the plugin list, sort order, and full execution order chain per scope.

**Parameters:**
- `className` (required): Fully qualified PHP class or interface name
- `methodName` (optional): Method name to inspect. Omit to scan all public methods.

**Example — single method:**
```json
{
  "name": "dev-plugin-list",
  "arguments": {
    "className": "Magento\\Catalog\\Api\\ProductRepositoryInterface",
    "methodName": "save"
  }
}
```

**Example — scan all methods of a class:**
```json
{
  "name": "dev-plugin-list",
  "arguments": {
    "className": "Magento\\Framework\\View\\LayoutInterface"
  }
}
```

**Scopes checked:** `global`, `adminhtml`, `frontend`, `crontab`, `webapi_rest`, `webapi_soap`, `graphql`

**Docker support:** Automatically detects Warden, DDEV, docker-magento, and docker-compose environments. Falls back to local PHP.

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

## License

MIT License - see [LICENSE](LICENSE) file for details.
