#!/bin/bash

# Magento 2 Development MCP Server Runner
# This script builds and runs the MCP server

set -e

echo "Building Magento 2 Development MCP Server..."
npm run build

echo "Starting MCP Server..."
echo "Press Ctrl+C to stop the server"
echo ""

npm start
