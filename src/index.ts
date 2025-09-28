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
 * Start the server
 */
async function main() {
  try {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    
    // Log to stderr so it doesn't interfere with MCP communication
    console.error("Magento 2 Development MCP Server is running...");
    console.error("Available tools:");
    console.error("- get-di-preferences: Get DI preferences list using magerun2");
    console.error("- cache-clean: Clear specific or all caches");
    console.error("- cache-flush: Flush specific or all caches");
    console.error("- cache-enable: Enable specific cache types");
    console.error("- cache-disable: Disable specific cache types");
    console.error("- cache-status: Check cache status");
    console.error("- cache-view: Inspect cache entries");
    
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
