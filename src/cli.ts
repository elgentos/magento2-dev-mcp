#!/usr/bin/env node

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import the main server
import './index.js';

// Display usage information
function showUsage() {
  const packagePath = join(__dirname, '..', 'package.json');
  const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
  
  console.log(`
${packageJson.name} v${packageJson.version}
${packageJson.description}

USAGE:
  npx @elgentos/magento2-dev-mcp

REQUIREMENTS:
  - Node.js ${packageJson.engines.node}
  - n98-magerun2 installed and accessible via PATH
  - Valid Magento 2 installation in the working directory

CONFIGURATION:
  Add this server to your AI agent's MCP configuration:

  {
    "mcpServers": {
      "magento2-dev": {
        "command": "npx",
        "args": ["@elgentos/magento2-dev-mcp"],
        "cwd": "/path/to/your/magento2/project"
      }
    }
  }

  Or for local development:
  {
    "mcpServers": {
      "magento2-dev": {
        "command": "node",
        "args": ["node_modules/@elgentos/magento2-dev-mcp/dist/index.js"],
        "cwd": "/path/to/your/magento2/project"
      }
    }
  }

AVAILABLE TOOLS:
  - Cache Management: clean, flush, enable, disable, status, view
  - Module Tools: list, create, observer-list
  - System Info: info, check, store-list, url-list, website-list
  - Configuration: show, set, store-get, store-set
  - Database: query
  - Setup: upgrade, di-compile, db-status, static-content-deploy
  - Cron: list, run
  - DI Tools: get-di-preferences

For detailed documentation, visit:
${packageJson.homepage}
`);
}

// Check command line arguments
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  showUsage();
  process.exit(0);
}

if (args.includes('--version') || args.includes('-v')) {
  const packagePath = join(__dirname, '..', 'package.json');
  const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
  console.log(packageJson.version);
  process.exit(0);
}

// If no special arguments, start the MCP server
console.log('Starting Magento 2 Development MCP Server...');
console.log('Server is ready to accept connections from AI agents.');
console.log('Press Ctrl+C to stop the server.');
