import { RESOURCE_URIS } from '../types/resources';

/**
 * Overview documentation resource
 */
export const overviewResource = {
  uri: RESOURCE_URIS.DOCS_OVERVIEW,
  contentType: 'text/markdown',
  description: 'Overview documentation for the server',
  handler: async () => {
    return `# shel-mcp Overview

The shel-mcp server provides tools and resources via the Model Context Protocol (MCP).

## What is MCP?

The Model Context Protocol (MCP) allows AI models to access external tools and resources through a standardized interface. This enables models to:

1. Execute functions (tools)
2. Access static or dynamic content (resources)
3. Maintain state across interactions

## Available Tools

- **Calculator**: Performs basic arithmetic operations

## Available Resources

- **info**: Server information and metadata
- **docs/overview**: This documentation
- **docs/api**: API reference documentation

## Getting Started

To use this MCP server, connect to it using a compatible MCP client library.`;
  },
};

/**
 * API documentation resource
 */
export const apiResource = {
  uri: RESOURCE_URIS.DOCS_API,
  contentType: 'text/markdown',
  description: 'API documentation for the server',
  handler: async () => {
    return `# shel-mcp API Reference

## Calculator Tool

### Description
Performs basic arithmetic operations: add, subtract, multiply, or divide.

### Input Schema
\`\`\`json
{
  "type": "object",
  "properties": {
    "operation": {
      "type": "string",
      "enum": ["add", "subtract", "multiply", "divide"],
      "description": "The arithmetic operation to perform"
    },
    "a": {
      "type": "number",
      "description": "The first operand"
    },
    "b": {
      "type": "number",
      "description": "The second operand"
    }
  },
  "required": ["operation", "a", "b"]
}
\`\`\`

### Examples

#### Addition
\`\`\`json
{
  "operation": "add",
  "a": 5,
  "b": 3
}
\`\`\`
Returns: 8

#### Division
\`\`\`json
{
  "operation": "divide",
  "a": 10,
  "b": 2
}
\`\`\`
Returns: 5`;
  },
};
