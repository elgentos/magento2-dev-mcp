# Magento 2 Cache Types Reference

This document provides a reference for the cache types available in Magento 2 that can be used with the cache management tools.

## Standard Cache Types

| Cache Type | Description | Usage |
|------------|-------------|-------|
| `config` | Configuration cache | Stores merged configuration from all modules |
| `layout` | Layout cache | Compiled page layouts |
| `block_html` | Block HTML cache | HTML page fragments per block |
| `collections` | Collections cache | Database query results |
| `reflection` | Reflection cache | Removes redundancy between webapi and reflection |
| `db_ddl` | Database DDL cache | Database schema |
| `compiled_config` | Compiled configuration | Compiled configuration cache |
| `eav` | EAV cache | EAV types and attributes |
| `customer_notification` | Customer notification | Customer notifications that appear in the user interface |
| `config_integration` | Integration configuration | Compiled integrations |
| `config_integration_api` | Integration API configuration | Compiled integration APIs |
| `full_page` | Full page cache | Generated HTML pages |
| `config_webservice` | Web service configuration | Web API structure |
| `translate` | Translation cache | Merged translations from all modules |

## Usage Examples

### Clean specific cache types
```bash
magerun2 cache:clean config layout
```

### Flush all caches
```bash
magerun2 cache:flush
```

### Enable specific cache types
```bash
magerun2 cache:enable config layout block_html
```

### Disable full page cache
```bash
magerun2 cache:disable full_page
```

### Check cache status
```bash
magerun2 cache:status
```

## MCP Tool Usage

When using the MCP server tools, you can specify cache types as arrays:

```json
{
  "name": "cache-clean",
  "arguments": {
    "types": ["config", "layout", "block_html"]
  }
}
```

```json
{
  "name": "cache-enable",
  "arguments": {
    "types": ["full_page"]
  }
}
```

## Notes

- Leaving the `types` parameter empty in `cache-clean` or `cache-flush` will affect all cache types
- The `cache-enable` and `cache-disable` tools require at least one cache type to be specified
- Cache type names are case-sensitive
- Some cache types may not be available depending on your Magento installation and enabled modules
