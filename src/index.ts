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
      scope: z.enum(["global", "frontend", "adminhtml", "webapi_rest", "webapi_soap", "crontab"])
        .default("global")
        .describe("The scope to get DI preferences for")
    }
  },
  async ({ scope = "global" }) => {
    try {
      // Execute magerun2 command
      const command = `magerun2 dev:di:preferences:list --format=json ${scope}`;
      const { stdout, stderr } = await execAsync(command, {
        cwd: process.cwd(),
        timeout: 30000 // 30 second timeout
      });

      if (stderr && stderr.trim()) {
        console.error("magerun2 stderr:", stderr);
      }

      // Parse JSON output
      let diPreferences;
      try {
        diPreferences = JSON.parse(stdout);
      } catch (parseError) {
        return {
          content: [{
            type: "text",
            text: `Error parsing magerun2 JSON output: ${parseError}\n\nRaw output:\n${stdout}`
          }],
          isError: true
        };
      }

      // Format the response
      const preferenceCount = Array.isArray(diPreferences) ? diPreferences.length : Object.keys(diPreferences).length;
      
      return {
        content: [{
          type: "text",
          text: `Found ${preferenceCount} DI preferences for scope '${scope}':\n\n${JSON.stringify(diPreferences, null, 2)}`
        }]
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Check if magerun2 is not found
      if (errorMessage.includes("command not found") || errorMessage.includes("not recognized")) {
        return {
          content: [{
            type: "text",
            text: "Error: magerun2 command not found. Please ensure n98-magerun2 is installed and available in your PATH.\n\nInstallation instructions: https://github.com/netz98/n98-magerun2"
          }],
          isError: true
        };
      }

      // Check if not in Magento directory
      if (errorMessage.includes("not a Magento installation") || errorMessage.includes("app/etc/env.php")) {
        return {
          content: [{
            type: "text",
            text: "Error: Current directory does not appear to be a Magento 2 installation. Please run this command from your Magento 2 root directory."
          }],
          isError: true
        };
      }

      return {
        content: [{
          type: "text",
          text: `Error executing magerun2 command: ${errorMessage}`
        }],
        isError: true
      };
    }
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
