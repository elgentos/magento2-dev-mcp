#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

/**
 * Magento 2 Development MCP Server
 * 
 * This server provides tools for Magento 2 development, including:
 * - DI preferences listing
 * - Future tools for module analysis, configuration inspection, etc.
 */

// Create the MCP server
const server = new McpServer({
  name: "magento2-dev-mcp-server",
  version: "1.0.0"
});

/**
 * Helper function to execute magerun2 commands with consistent error handling
 */
async function executeMagerun2Command(command: string, parseJson: boolean = false): Promise<{
  success: true;
  data: any;
  rawOutput: string;
} | {
  success: false;
  error: string;
  isError: true;
}> {
  try {
    const { stdout, stderr } = await execAsync(command, {
      cwd: process.cwd(),
      timeout: 30000 // 30 second timeout
    });

    if (stderr && stderr.trim()) {
      console.error("magerun2 stderr:", stderr);
    }

    if (parseJson) {
      try {
        return { success: true, data: JSON.parse(stdout), rawOutput: stdout };
      } catch (parseError) {
        return {
          success: false,
          error: `Error parsing magerun2 JSON output: ${parseError}\n\nRaw output:\n${stdout}`,
          isError: true
        };
      }
    }

    return { success: true, data: stdout.trim(), rawOutput: stdout };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Check if magerun2 is not found
    if (errorMessage.includes("command not found") || errorMessage.includes("not recognized")) {
      return {
        success: false,
        error: "Error: magerun2 command not found. Please ensure n98-magerun2 is installed and available in your PATH.\n\nInstallation instructions: https://github.com/netz98/n98-magerun2",
        isError: true
      };
    }

    // Check if not in Magento directory
    if (errorMessage.includes("not a Magento installation") || errorMessage.includes("app/etc/env.php")) {
      return {
        success: false,
        error: "Error: Current directory does not appear to be a Magento 2 installation. Please run this command from your Magento 2 root directory.",
        isError: true
      };
    }

    return {
      success: false,
      error: `Error executing magerun2 command: ${errorMessage}`,
      isError: true
    };
  }
}

/**
 * Tool: Get DI Preferences List
 *
 * Runs `magerun2 dev:di:preferences:list --format=json global` to get
 * dependency injection preferences in JSON format
 */
server.registerTool(
  "get-di-preferences",
  {
    title: "Get DI Preferences List",
    description: "Get Magento 2 dependency injection preferences list using magerun2",
    inputSchema: {
      scope: z.enum([
        "global",
        "adminhtml",
        "frontend",
        "crontab",
        "webapi_rest",
        "webapi_soap",
        "graphql",
        "doc",
        "admin"
      ])
        .default("global")
        .describe("The scope to get DI preferences for")
    }
  },
  async ({ scope = "global" }) => {
    const command = `magerun2 dev:di:preferences:list --format=json ${scope}`;
    const result = await executeMagerun2Command(command, true);

    if (!result.success) {
      return {
        content: [{
          type: "text",
          text: result.error
        }],
        isError: true
      };
    }

    const preferenceCount = Array.isArray(result.data) ? result.data.length : Object.keys(result.data).length;

    return {
      content: [{
        type: "text",
        text: `Found ${preferenceCount} DI preferences for scope '${scope}':\n\n${JSON.stringify(result.data, null, 2)}`
      }]
    };
  }
);

/**
 * Tool: Cache Clean
 *
 * Runs `magerun2 cache:clean` to clear specific or all caches
 */
server.registerTool(
  "cache-clean",
  {
    title: "Cache Clean",
    description: "Clear specific Magento 2 cache types or all caches",
    inputSchema: {
      types: z.array(z.string())
        .optional()
        .describe("Specific cache types to clean (leave empty for all caches)")
    }
  },
  async ({ types }) => {
    const cacheTypesArg = types && types.length > 0 ? types.join(' ') : '';
    const command = `magerun2 cache:clean ${cacheTypesArg}`.trim();
    const result = await executeMagerun2Command(command);

    if (!result.success) {
      return {
        content: [{
          type: "text",
          text: result.error
        }],
        isError: true
      };
    }

    return {
      content: [{
        type: "text",
        text: `Cache clean completed:\n\n${result.data}`
      }]
    };
  }
);

/**
 * Tool: Cache Flush
 *
 * Runs `magerun2 cache:flush` to flush specific or all caches
 */
server.registerTool(
  "cache-flush",
  {
    title: "Cache Flush",
    description: "Flush specific Magento 2 cache types or all caches",
    inputSchema: {
      types: z.array(z.string())
        .optional()
        .describe("Specific cache types to flush (leave empty for all caches)")
    }
  },
  async ({ types }) => {
    const cacheTypesArg = types && types.length > 0 ? types.join(' ') : '';
    const command = `magerun2 cache:flush ${cacheTypesArg}`.trim();
    const result = await executeMagerun2Command(command);

    if (!result.success) {
      return {
        content: [{
          type: "text",
          text: result.error
        }],
        isError: result.isError
      };
    }

    return {
      content: [{
        type: "text",
        text: `Cache flush completed:\n\n${result.data}`
      }]
    };
  }
);

/**
 * Tool: Cache Enable
 *
 * Runs `magerun2 cache:enable` to enable specific cache types
 */
server.registerTool(
  "cache-enable",
  {
    title: "Cache Enable",
    description: "Enable specific Magento 2 cache types",
    inputSchema: {
      types: z.array(z.string())
        .min(1)
        .describe("Cache types to enable")
    }
  },
  async ({ types }) => {
    const command = `magerun2 cache:enable ${types.join(' ')}`;
    const result = await executeMagerun2Command(command);

    if (!result.success) {
      return {
        content: [{
          type: "text",
          text: result.error
        }],
        isError: result.isError
      };
    }

    return {
      content: [{
        type: "text",
        text: `Cache types enabled:\n\n${result.data}`
      }]
    };
  }
);

/**
 * Tool: Cache Disable
 *
 * Runs `magerun2 cache:disable` to disable specific cache types
 */
server.registerTool(
  "cache-disable",
  {
    title: "Cache Disable",
    description: "Disable specific Magento 2 cache types",
    inputSchema: {
      types: z.array(z.string())
        .min(1)
        .describe("Cache types to disable")
    }
  },
  async ({ types }) => {
    const command = `magerun2 cache:disable ${types.join(' ')}`;
    const result = await executeMagerun2Command(command);

    if (!result.success) {
      return {
        content: [{
          type: "text",
          text: result.error
        }],
        isError: result.isError
      };
    }

    return {
      content: [{
        type: "text",
        text: `Cache types disabled:\n\n${result.data}`
      }]
    };
  }
);

/**
 * Tool: Cache Status
 *
 * Runs `magerun2 cache:status` to check cache status
 */
server.registerTool(
  "cache-status",
  {
    title: "Cache Status",
    description: "Check the status of Magento 2 cache types",
    inputSchema: {}
  },
  async () => {
    const command = `magerun2 cache:status`;
    const result = await executeMagerun2Command(command);

    if (!result.success) {
      return {
        content: [{
          type: "text",
          text: result.error
        }],
        isError: result.isError
      };
    }

    return {
      content: [{
        type: "text",
        text: `Cache status:\n\n${result.data}`
      }]
    };
  }
);

/**
 * Tool: Cache View
 *
 * Runs `magerun2 cache:view` to inspect cache entries
 */
server.registerTool(
  "cache-view",
  {
    title: "Cache View",
    description: "Inspect specific cache entries in Magento 2",
    inputSchema: {
      key: z.string()
        .describe("Cache key to inspect"),
      type: z.string()
        .optional()
        .describe("Cache type (optional)")
    }
  },
  async ({ key, type }) => {
    const typeArg = type ? `--type=${type}` : '';
    const command = `magerun2 cache:view ${typeArg} "${key}"`.trim();
    const result = await executeMagerun2Command(command);

    if (!result.success) {
      return {
        content: [{
          type: "text",
          text: result.error
        }],
        isError: result.isError
      };
    }

    return {
      content: [{
        type: "text",
        text: `Cache entry for key "${key}":\n\n${result.data}`
      }]
    };
  }
);

/**
 * Tool: Module List
 *
 * Runs `magerun2 dev:module:list` to list all modules
 */
server.registerTool(
  "dev-module-list",
  {
    title: "Module List",
    description: "List all Magento 2 modules and their status",
    inputSchema: {
      format: z.enum(["table", "json", "csv"])
        .default("table")
        .describe("Output format"),
      enabled: z.boolean()
        .optional()
        .describe("Show only enabled modules"),
      disabled: z.boolean()
        .optional()
        .describe("Show only disabled modules")
    }
  },
  async ({ format = "table", enabled, disabled }) => {
    let command = `magerun2 dev:module:list --format=${format}`;

    if (enabled) {
      command += ' --enabled';
    } else if (disabled) {
      command += ' --disabled';
    }

    const result = await executeMagerun2Command(command, format === "json");

    if (!result.success) {
      return {
        content: [{
          type: "text",
          text: result.error
        }],
        isError: true
      };
    }

    const responseText = format === "json"
      ? `Module list (${format} format):\n\n${JSON.stringify(result.data, null, 2)}`
      : `Module list (${format} format):\n\n${result.data}`;

    return {
      content: [{
        type: "text",
        text: responseText
      }]
    };
  }
);

/**
 * Tool: Module Observer List
 *
 * Runs `magerun2 dev:module:observer:list` to list module observers
 */
server.registerTool(
  "dev-module-observer-list",
  {
    title: "Module Observer List",
    description: "List all Magento 2 module observers",
    inputSchema: {
      format: z.enum(["table", "json", "csv"])
        .default("table")
        .describe("Output format"),
      event: z.string()
        .optional()
        .describe("Filter by specific event name")
    }
  },
  async ({ format = "table", event }) => {
    let command = `magerun2 dev:module:observer:list --format=${format}`;

    if (event) {
      command += ` "${event}"`;
    }

    const result = await executeMagerun2Command(command, format === "json");

    if (!result.success) {
      return {
        content: [{
          type: "text",
          text: result.error
        }],
        isError: true
      };
    }

    const responseText = format === "json"
      ? `Observer list (${format} format):\n\n${JSON.stringify(result.data, null, 2)}`
      : `Observer list (${format} format):\n\n${result.data}`;

    return {
      content: [{
        type: "text",
        text: responseText
      }]
    };
  }
);

/**
 * Tool: Module Create
 *
 * Runs `magerun2 dev:module:create` to create and register a new Magento module
 */
server.registerTool(
  "dev-module-create",
  {
    title: "Module Create",
    description: "Create and register a new Magento 2 module",
    inputSchema: {
      vendorNamespace: z.string()
        .describe("Namespace (your company prefix)"),
      moduleName: z.string()
        .describe("Name of your module"),
      minimal: z.boolean()
        .optional()
        .describe("Create only module file"),
      addBlocks: z.boolean()
        .optional()
        .describe("Add blocks"),
      addHelpers: z.boolean()
        .optional()
        .describe("Add helpers"),
      addModels: z.boolean()
        .optional()
        .describe("Add models"),
      addSetup: z.boolean()
        .optional()
        .describe("Add SQL setup"),
      addAll: z.boolean()
        .optional()
        .describe("Add blocks, helpers and models"),
      enable: z.boolean()
        .optional()
        .describe("Enable module after creation"),
      modman: z.boolean()
        .optional()
        .describe("Create all files in folder with a modman file"),
      addReadme: z.boolean()
        .optional()
        .describe("Add a readme.md file to generated module"),
      addComposer: z.boolean()
        .optional()
        .describe("Add a composer.json file to generated module"),
      addStrictTypes: z.boolean()
        .optional()
        .describe("Add strict_types declaration to generated PHP files"),
      authorName: z.string()
        .optional()
        .describe("Author for readme.md or composer.json"),
      authorEmail: z.string()
        .optional()
        .describe("Author email for readme.md or composer.json"),
      description: z.string()
        .optional()
        .describe("Description for readme.md or composer.json")
    }
  },
  async ({
    vendorNamespace,
    moduleName,
    minimal,
    addBlocks,
    addHelpers,
    addModels,
    addSetup,
    addAll,
    enable,
    modman,
    addReadme,
    addComposer,
    addStrictTypes,
    authorName,
    authorEmail,
    description
  }) => {
    let command = `magerun2 dev:module:create "${vendorNamespace}" "${moduleName}"`;

    if (minimal) {
      command += ` --minimal`;
    }

    if (addBlocks) {
      command += ` --add-blocks`;
    }

    if (addHelpers) {
      command += ` --add-helpers`;
    }

    if (addModels) {
      command += ` --add-models`;
    }

    if (addSetup) {
      command += ` --add-setup`;
    }

    if (addAll) {
      command += ` --add-all`;
    }

    if (enable) {
      command += ` --enable`;
    }

    if (modman) {
      command += ` --modman`;
    }

    if (addReadme) {
      command += ` --add-readme`;
    }

    if (addComposer) {
      command += ` --add-composer`;
    }

    if (addStrictTypes) {
      command += ` --add-strict-types`;
    }

    if (authorName) {
      command += ` --author-name="${authorName}"`;
    }

    if (authorEmail) {
      command += ` --author-email="${authorEmail}"`;
    }

    if (description) {
      command += ` --description="${description}"`;
    }

    const result = await executeMagerun2Command(command);

    if (!result.success) {
      return {
        content: [{
          type: "text",
          text: result.error
        }],
        isError: true
      };
    }

    return {
      content: [{
        type: "text",
        text: `Module ${vendorNamespace}_${moduleName} created successfully:\n\n${result.data}`
      }]
    };
  }
);

/**
 * Tool: System Info
 *
 * Runs `magerun2 sys:info` to get system information
 */
server.registerTool(
  "sys-info",
  {
    title: "System Info",
    description: "Get Magento 2 system information",
    inputSchema: {
      format: z.enum(["table", "json", "csv"])
        .default("table")
        .describe("Output format")
    }
  },
  async ({ format = "table" }) => {
    const command = `magerun2 sys:info --format=${format}`;
    const result = await executeMagerun2Command(command, format === "json");

    if (!result.success) {
      return {
        content: [{
          type: "text",
          text: result.error
        }],
        isError: true
      };
    }

    const responseText = format === "json"
      ? `System information (${format} format):\n\n${JSON.stringify(result.data, null, 2)}`
      : `System information (${format} format):\n\n${result.data}`;

    return {
      content: [{
        type: "text",
        text: responseText
      }]
    };
  }
);

/**
 * Tool: System Check
 *
 * Runs `magerun2 sys:check` to check system requirements
 */
server.registerTool(
  "sys-check",
  {
    title: "System Check",
    description: "Check Magento 2 system requirements and configuration",
    inputSchema: {}
  },
  async () => {
    const command = `magerun2 sys:check`;
    const result = await executeMagerun2Command(command);

    if (!result.success) {
      return {
        content: [{
          type: "text",
          text: result.error
        }],
        isError: true
      };
    }

    return {
      content: [{
        type: "text",
        text: `System check results:\n\n${result.data}`
      }]
    };
  }
);

/**
 * Tool: Config Show
 *
 * Runs `magerun2 config:show` to view system configuration
 */
server.registerTool(
  "config-show",
  {
    title: "Config Show",
    description: "View Magento 2 system configuration values",
    inputSchema: {
      path: z.string()
        .optional()
        .describe("Configuration path to show (optional, shows all if not specified)"),
      scope: z.string()
        .optional()
        .describe("Configuration scope (default, website, store)"),
      scopeId: z.string()
        .optional()
        .describe("Scope ID (website ID or store ID)")
    }
  },
  async ({ path, scope, scopeId }) => {
    let command = `magerun2 config:show`;

    if (path) {
      command += ` "${path}"`;
    }

    if (scope) {
      command += ` --scope="${scope}"`;
    }

    if (scopeId) {
      command += ` --scope-id="${scopeId}"`;
    }

    const result = await executeMagerun2Command(command);

    if (!result.success) {
      return {
        content: [{
          type: "text",
          text: result.error
        }],
        isError: true
      };
    }

    return {
      content: [{
        type: "text",
        text: `Configuration values:\n\n${result.data}`
      }]
    };
  }
);

/**
 * Tool: Config Set
 *
 * Runs `magerun2 config:set` to modify system configuration
 */
server.registerTool(
  "config-set",
  {
    title: "Config Set",
    description: "Set Magento 2 system configuration values",
    inputSchema: {
      path: z.string()
        .describe("Configuration path to set"),
      value: z.string()
        .describe("Value to set"),
      scope: z.string()
        .optional()
        .describe("Configuration scope (default, website, store)"),
      scopeId: z.string()
        .optional()
        .describe("Scope ID (website ID or store ID)"),
      encrypt: z.boolean()
        .optional()
        .describe("Encrypt the value")
    }
  },
  async ({ path, value, scope, scopeId, encrypt }) => {
    let command = `magerun2 config:set "${path}" "${value}"`;

    if (scope) {
      command += ` --scope="${scope}"`;
    }

    if (scopeId) {
      command += ` --scope-id="${scopeId}"`;
    }

    if (encrypt) {
      command += ` --encrypt`;
    }

    const result = await executeMagerun2Command(command);

    if (!result.success) {
      return {
        content: [{
          type: "text",
          text: result.error
        }],
        isError: true
      };
    }

    return {
      content: [{
        type: "text",
        text: `Configuration set successfully:\n\n${result.data}`
      }]
    };
  }
);

/**
 * Tool: Config Store Get
 *
 * Runs `magerun2 config:store:get` to get store-specific configuration
 */
server.registerTool(
  "config-store-get",
  {
    title: "Config Store Get",
    description: "Get store-specific Magento 2 configuration values",
    inputSchema: {
      path: z.string()
        .describe("Configuration path to get"),
      storeId: z.string()
        .optional()
        .describe("Store ID (optional)")
    }
  },
  async ({ path, storeId }) => {
    let command = `magerun2 config:store:get "${path}"`;

    if (storeId) {
      command += ` --store-id="${storeId}"`;
    }

    const result = await executeMagerun2Command(command);

    if (!result.success) {
      return {
        content: [{
          type: "text",
          text: result.error
        }],
        isError: true
      };
    }

    return {
      content: [{
        type: "text",
        text: `Store configuration value:\n\n${result.data}`
      }]
    };
  }
);

/**
 * Tool: Config Store Set
 *
 * Runs `magerun2 config:store:set` to set store-specific configuration
 */
server.registerTool(
  "config-store-set",
  {
    title: "Config Store Set",
    description: "Set store-specific Magento 2 configuration values",
    inputSchema: {
      path: z.string()
        .describe("Configuration path to set"),
      value: z.string()
        .describe("Value to set"),
      storeId: z.string()
        .optional()
        .describe("Store ID (optional)")
    }
  },
  async ({ path, value, storeId }) => {
    let command = `magerun2 config:store:set "${path}" "${value}"`;

    if (storeId) {
      command += ` --store-id="${storeId}"`;
    }

    const result = await executeMagerun2Command(command);

    if (!result.success) {
      return {
        content: [{
          type: "text",
          text: result.error
        }],
        isError: true
      };
    }

    return {
      content: [{
        type: "text",
        text: `Store configuration set successfully:\n\n${result.data}`
      }]
    };
  }
);

/**
 * Tool: Database Query
 *
 * Runs `magerun2 db:query` to execute SQL queries
 */
server.registerTool(
  "db-query",
  {
    title: "Database Query",
    description: "Execute SQL queries directly on Magento 2 database",
    inputSchema: {
      query: z.string()
        .describe("SQL query to execute"),
      format: z.enum(["table", "json", "csv"])
        .default("table")
        .describe("Output format")
    }
  },
  async ({ query, format = "table" }) => {
    const command = `magerun2 db:query --format=${format} "${query}"`;
    const result = await executeMagerun2Command(command, format === "json");

    if (!result.success) {
      return {
        content: [{
          type: "text",
          text: result.error
        }],
        isError: true
      };
    }

    const responseText = format === "json"
      ? `Query results (${format} format):\n\n${JSON.stringify(result.data, null, 2)}`
      : `Query results (${format} format):\n\n${result.data}`;

    return {
      content: [{
        type: "text",
        text: responseText
      }]
    };
  }
);

/**
 * Tool: Setup Upgrade
 *
 * Runs `magerun2 setup:upgrade` to upgrade database schema and data
 */
server.registerTool(
  "setup-upgrade",
  {
    title: "Setup Upgrade",
    description: "Run Magento 2 setup upgrade to update database schema and data",
    inputSchema: {
      keepGenerated: z.boolean()
        .optional()
        .describe("Keep generated files during upgrade")
    }
  },
  async ({ keepGenerated }) => {
    let command = `magerun2 setup:upgrade`;

    if (keepGenerated) {
      command += ` --keep-generated`;
    }

    const result = await executeMagerun2Command(command);

    if (!result.success) {
      return {
        content: [{
          type: "text",
          text: result.error
        }],
        isError: true
      };
    }

    return {
      content: [{
        type: "text",
        text: `Setup upgrade completed:\n\n${result.data}`
      }]
    };
  }
);

/**
 * Tool: Setup DI Compile
 *
 * Runs `magerun2 setup:di:compile` to compile dependency injection
 */
server.registerTool(
  "setup-di-compile",
  {
    title: "Setup DI Compile",
    description: "Compile Magento 2 dependency injection configuration",
    inputSchema: {}
  },
  async () => {
    const command = `magerun2 setup:di:compile`;
    const result = await executeMagerun2Command(command);

    if (!result.success) {
      return {
        content: [{
          type: "text",
          text: result.error
        }],
        isError: true
      };
    }

    return {
      content: [{
        type: "text",
        text: `DI compilation completed:\n\n${result.data}`
      }]
    };
  }
);

/**
 * Tool: Setup DB Status
 *
 * Runs `magerun2 setup:db:status` to check database status
 */
server.registerTool(
  "setup-db-status",
  {
    title: "Setup DB Status",
    description: "Check Magento 2 database status to see if setup:upgrade is needed",
    inputSchema: {}
  },
  async () => {
    const command = `magerun2 setup:db:status`;
    const result = await executeMagerun2Command(command);

    if (!result.success) {
      return {
        content: [{
          type: "text",
          text: result.error
        }],
        isError: true
      };
    }

    return {
      content: [{
        type: "text",
        text: `Database status:\n\n${result.data}`
      }]
    };
  }
);

/**
 * Tool: Setup Static Content Deploy
 *
 * Runs `magerun2 setup:static-content:deploy` to deploy static content
 */
server.registerTool(
  "setup-static-content-deploy",
  {
    title: "Setup Static Content Deploy",
    description: "Deploy Magento 2 static content and assets",
    inputSchema: {
      languages: z.array(z.string())
        .optional()
        .describe("Languages to deploy (e.g., ['en_US', 'de_DE'])"),
      themes: z.array(z.string())
        .optional()
        .describe("Themes to deploy"),
      jobs: z.number()
        .optional()
        .describe("Number of parallel jobs"),
      force: z.boolean()
        .optional()
        .describe("Force deployment even if files exist")
    }
  },
  async ({ languages, themes, jobs, force }) => {
    let command = `magerun2 setup:static-content:deploy`;

    if (languages && languages.length > 0) {
      command += ` ${languages.join(' ')}`;
    }

    if (themes && themes.length > 0) {
      command += ` --theme=${themes.join(' --theme=')}`;
    }

    if (jobs) {
      command += ` --jobs=${jobs}`;
    }

    if (force) {
      command += ` --force`;
    }

    const result = await executeMagerun2Command(command);

    if (!result.success) {
      return {
        content: [{
          type: "text",
          text: result.error
        }],
        isError: true
      };
    }

    return {
      content: [{
        type: "text",
        text: `Static content deployment completed:\n\n${result.data}`
      }]
    };
  }
);

/**
 * Tool: Store List (sys:store:list)
 *
 * Runs `magerun2 sys:store:list` to list stores
 */
server.registerTool(
  "sys-store-list",
  {
    title: "Store List",
    description: "List all Magento 2 stores, websites, and store views",
    inputSchema: {
      format: z.enum(["table", "json", "csv"])
        .default("table")
        .describe("Output format")
    }
  },
  async ({ format = "table" }) => {
    const command = `magerun2 sys:store:list --format=${format}`;
    const result = await executeMagerun2Command(command, format === "json");

    if (!result.success) {
      return {
        content: [{
          type: "text",
          text: result.error
        }],
        isError: true
      };
    }

    const responseText = format === "json"
      ? `Store list (${format} format):\n\n${JSON.stringify(result.data, null, 2)}`
      : `Store list (${format} format):\n\n${result.data}`;

    return {
      content: [{
        type: "text",
        text: responseText
      }]
    };
  }
);

/**
 * Tool: Theme List
 *
 * Runs `magerun2 dev:theme:list` to list all available themes
 */
server.registerTool(
  "dev-theme-list",
  {
    title: "Theme List",
    description: "List all available Magento 2 themes",
    inputSchema: {
      format: z.enum(["table", "json", "csv"])
        .default("table")
        .describe("Output format")
    }
  },
  async ({ format = "table" }) => {
    const command = `magerun2 dev:theme:list --format=${format}`;
    const result = await executeMagerun2Command(command, format === "json");

    if (!result.success) {
      return {
        content: [{
          type: "text",
          text: result.error
        }],
        isError: true
      };
    }

    const responseText = format === "json"
      ? `Theme list (${format} format):\n\n${JSON.stringify(result.data, null, 2)}`
      : `Theme list (${format} format):\n\n${result.data}`;

    return {
      content: [{
        type: "text",
        text: responseText
      }]
    };
  }
);

/**
 * Tool: Store Config Base URL List
 *
 * Runs `magerun2 sys:store:config:base-url:list` to list all base URLs
 */
server.registerTool(
  "sys-store-config-base-url-list",
  {
    title: "Store Config Base URL List",
    description: "List all base URLs for Magento 2 stores",
    inputSchema: {
      format: z.enum(["table", "json", "csv"])
        .default("table")
        .describe("Output format")
    }
  },
  async ({ format = "table" }) => {
    const command = `magerun2 sys:store:config:base-url:list --format=${format}`;
    const result = await executeMagerun2Command(command, format === "json");

    if (!result.success) {
      return {
        content: [{
          type: "text",
          text: result.error
        }],
        isError: true
      };
    }

    const responseText = format === "json"
      ? `Base URL list (${format} format):\n\n${JSON.stringify(result.data, null, 2)}`
      : `Base URL list (${format} format):\n\n${result.data}`;

    return {
      content: [{
        type: "text",
        text: responseText
      }]
    };
  }
);

/**
 * Tool: Cron List
 *
 * Runs `magerun2 sys:cron:list` to list cron jobs
 */
server.registerTool(
  "sys-cron-list",
  {
    title: "Cron List",
    description: "List all Magento 2 cron jobs and their configuration",
    inputSchema: {
      format: z.enum(["table", "json", "csv"])
        .default("table")
        .describe("Output format")
    }
  },
  async ({ format = "table" }) => {
    const command = `magerun2 sys:cron:list --format=${format}`;
    const result = await executeMagerun2Command(command, format === "json");

    if (!result.success) {
      return {
        content: [{
          type: "text",
          text: result.error
        }],
        isError: true
      };
    }

    const responseText = format === "json"
      ? `Cron job list (${format} format):\n\n${JSON.stringify(result.data, null, 2)}`
      : `Cron job list (${format} format):\n\n${result.data}`;

    return {
      content: [{
        type: "text",
        text: responseText
      }]
    };
  }
);

/**
 * Tool: URL List
 *
 * Runs `magerun2 sys:url:list` to get all URLs
 */
server.registerTool(
  "sys-url-list",
  {
    title: "URL List",
    description: "Get all Magento 2 URLs",
    inputSchema: {
      format: z.enum(["table", "json", "csv"])
        .default("table")
        .describe("Output format"),
      storeId: z.string()
        .optional()
        .describe("Store ID to filter URLs")
    }
  },
  async ({ format = "table", storeId }) => {
    let command = `magerun2 sys:url:list --format=${format}`;

    if (storeId) {
      command += ` --store-id=${storeId}`;
    }

    const result = await executeMagerun2Command(command, format === "json");

    if (!result.success) {
      return {
        content: [{
          type: "text",
          text: result.error
        }],
        isError: true
      };
    }

    const responseText = format === "json"
      ? `URL list (${format} format):\n\n${JSON.stringify(result.data, null, 2)}`
      : `URL list (${format} format):\n\n${result.data}`;

    return {
      content: [{
        type: "text",
        text: responseText
      }]
    };
  }
);

/**
 * Tool: Website List
 *
 * Runs `magerun2 sys:website:list` to list all websites
 */
server.registerTool(
  "sys-website-list",
  {
    title: "Website List",
    description: "List all Magento 2 websites",
    inputSchema: {
      format: z.enum(["table", "json", "csv"])
        .default("table")
        .describe("Output format")
    }
  },
  async ({ format = "table" }) => {
    const command = `magerun2 sys:website:list --format=${format}`;
    const result = await executeMagerun2Command(command, format === "json");

    if (!result.success) {
      return {
        content: [{
          type: "text",
          text: result.error
        }],
        isError: true
      };
    }

    const responseText = format === "json"
      ? `Website list (${format} format):\n\n${JSON.stringify(result.data, null, 2)}`
      : `Website list (${format} format):\n\n${result.data}`;

    return {
      content: [{
        type: "text",
        text: responseText
      }]
    };
  }
);

/**
 * Tool: Cron Run
 *
 * Runs `magerun2 sys:cron:run` to execute cron jobs
 */
server.registerTool(
  "sys-cron-run",
  {
    title: "Cron Run",
    description: "Run Magento 2 cron jobs",
    inputSchema: {
      job: z.string()
        .optional()
        .describe("Specific cron job to run (optional, runs all if not specified)"),
      group: z.string()
        .optional()
        .describe("Cron group to run")
    }
  },
  async ({ job, group }) => {
    let command = `magerun2 sys:cron:run`;

    if (job) {
      command += ` "${job}"`;
    }

    if (group) {
      command += ` --group="${group}"`;
    }

    const result = await executeMagerun2Command(command);

    if (!result.success) {
      return {
        content: [{
          type: "text",
          text: result.error
        }],
        isError: true
      };
    }

    return {
      content: [{
        type: "text",
        text: `Cron execution completed:\n\n${result.data}`
      }]
    };
  }
);

/**
 * Start the server
 */
async function main() {
  try {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    
    // Log to stderr so it doesn't interfere with MCP communication
    console.error("Magento 2 Development MCP Server is running...");
    console.error("Available tools:");
    console.error("DI & Module Tools:");
    console.error("- get-di-preferences: Get DI preferences list");
    console.error("- dev-module-list: List all modules and their status");
    console.error("- dev-module-observer-list: List module observers");
    console.error("- dev-module-create: Create and register a new module");
    console.error("- dev-theme-list: List all available themes");
    console.error("Cache Management:");
    console.error("- cache-clean: Clear specific or all caches");
    console.error("- cache-flush: Flush specific or all caches");
    console.error("- cache-enable: Enable specific cache types");
    console.error("- cache-disable: Disable specific cache types");
    console.error("- cache-status: Check cache status");
    console.error("- cache-view: Inspect cache entries");
    console.error("System Diagnostics:");
    console.error("- sys-info: Get system information");
    console.error("- sys-check: Check system requirements");
    console.error("Configuration:");
    console.error("- config-show: View system configuration");
    console.error("- config-set: Set system configuration");
    console.error("- config-store-get: Get store-specific configuration");
    console.error("- config-store-set: Set store-specific configuration");
    console.error("Database:");
    console.error("- db-query: Execute SQL queries");
    console.error("Setup & Deployment:");
    console.error("- setup-upgrade: Run setup upgrade");
    console.error("- setup-di-compile: Compile DI configuration");
    console.error("- setup-db-status: Check database status");
    console.error("- setup-static-content-deploy: Deploy static content");
    console.error("Store Management:");
    console.error("- sys-store-list: List stores, websites, and store views");
    console.error("- sys-store-config-base-url-list: List all base URLs");
    console.error("- sys-url-list: Get all URLs");
    console.error("- sys-website-list: List all websites");
    console.error("Cron Management:");
    console.error("- sys-cron-list: List cron jobs");
    console.error("- sys-cron-run: Run cron jobs");
    
  } catch (error) {
    console.error("Failed to start MCP server:", error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.error("Shutting down Magento 2 Development MCP Server...");
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.error("Shutting down Magento 2 Development MCP Server...");
  process.exit(0);
});

// Start the server
main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
