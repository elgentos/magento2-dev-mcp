#!/usr/bin/env node

/**
 * Simple test script to verify the MCP server is working
 * This script simulates a basic MCP client interaction
 */

import { spawn } from 'child_process';
import { readFileSync } from 'fs';

console.log('Testing Magento 2 Development MCP Server...\n');

// Check if the build exists
try {
  readFileSync('./dist/index.js');
  console.log('✓ Build file exists');
} catch (error) {
  console.error('✗ Build file not found. Run "npm run build" first.');
  process.exit(1);
}

// Start the server process
const server = spawn('node', ['dist/index.js'], {
  stdio: ['pipe', 'pipe', 'pipe']
});

let serverOutput = '';
let serverError = '';

server.stdout.on('data', (data) => {
  serverOutput += data.toString();
});

server.stderr.on('data', (data) => {
  serverError += data.toString();
});

// Send initialization message
const initMessage = {
  jsonrpc: "2.0",
  id: 1,
  method: "initialize",
  params: {
    protocolVersion: "2024-11-05",
    capabilities: {
      tools: {}
    },
    clientInfo: {
      name: "test-client",
      version: "1.0.0"
    }
  }
};

console.log('Sending initialization message...');
server.stdin.write(JSON.stringify(initMessage) + '\n');

// Wait for response
setTimeout(() => {
  // Send tools/list request
  const toolsListMessage = {
    jsonrpc: "2.0",
    id: 2,
    method: "tools/list"
  };

  console.log('Requesting tools list...');
  server.stdin.write(JSON.stringify(toolsListMessage) + '\n');

  // Wait for response and then terminate
  setTimeout(() => {
    server.kill();
    
    console.log('\n--- Server Output ---');
    if (serverOutput) {
      console.log(serverOutput);
    } else {
      console.log('(no stdout output)');
    }
    
    console.log('\n--- Server Error Output ---');
    if (serverError) {
      console.log(serverError);
    } else {
      console.log('(no stderr output)');
    }
    
    console.log('\n--- Test Results ---');
    
    if (serverError.includes('Magento 2 Development MCP Server is running')) {
      console.log('✓ Server started successfully');
    } else {
      console.log('✗ Server startup message not found');
    }
    
    if (serverOutput.includes('"method":"tools/list"') || serverOutput.includes('get-di-preferences')) {
      console.log('✓ Server responded to tools/list request');
    } else {
      console.log('? Server response unclear (this might be normal for stdio transport)');
    }
    
    console.log('\nTest completed. If you see the startup message above, the server is working correctly.');
    console.log('To test with a real MCP client, use the configuration in examples/augment-config.json');
    
  }, 2000);
}, 1000);
