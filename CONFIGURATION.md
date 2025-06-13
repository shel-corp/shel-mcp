# Shel MCP Server Configuration Guide

This document provides comprehensive instructions for configuring your Shel MCP server using the file-based configuration system.

## Table of Contents

- [Configuration Directory Structure](#configuration-directory-structure)
- [Main Configuration File](#main-configuration-file)
- [Configuring Prompts](#configuring-prompts)
- [Configuring Resources](#configuring-resources)
- [Configuring Tools](#configuring-tools)
- [Starting the Server](#starting-the-server)
- [Best Practices](#best-practices)

## Configuration Directory Structure

The Shel MCP server uses a directory-based configuration system with the following structure:

```
config/
├── mcp-config.yaml     # Main configuration file
├── prompts/            # Directory for prompt templates
│   ├── prompt1.md      # Prompt template file
│   └── category/       # Nested directory for organizing prompts
│       └── prompt2.md  # Nested prompt template
├── resources/          # Directory for resource collections
│   ├── resource1/      # Resource collection directory
│   │   ├── README.md   # Resource description (required)
│   │   └── file1.txt   # Resource file
│   └── resource2/      # Another resource collection
└── tools/              # Directory for tool implementations
    ├── tool1.js        # JavaScript tool implementation
    ├── category/       # Nested directory for organizing tools
    │   └── tool2.js    # Nested tool implementation
    └── script_tool.sh  # Shell script tool implementation
```

## Main Configuration File

The `mcp-config.yaml` file defines the server configuration and component paths:

```yaml
name: shel-mcp                # Server name
version: 1.0.0                # Server version
description: MCP server with configurable components  # Optional description

paths:
  prompts: prompts            # Path to prompts directory (relative to config dir)
  resources: resources        # Path to resources directory
  tools: tools                # Path to tools directory
```

## Configuring Prompts

Prompts are Markdown files that define templates for AI model instructions. Each file is loaded as a separate prompt.

### Prompt File Format

Prompts use a frontmatter section for metadata and parameters, followed by the template content:

```markdown
---
parameters:
  param1:
    type: string
    description: Description of parameter 1
  param2:
    type: number
    description: Description of parameter 2
    required: false
description: Description of this prompt
author: Your Name
---
# Prompt Title

This is the prompt template content.

You can use {{param1}} and {{param2}} as placeholders for parameter values.
```

### Parameter Types

The following parameter types are supported:
- `string`: Text values
- `number`: Numeric values
- `boolean`: True/false values
- `integer`: Whole number values
- `array`: Lists of values
- `object`: Nested objects

### Prompt Organization

Prompts can be organized in subdirectories. The prompt ID is derived from its path relative to the prompts directory:

- `prompts/review-code.md` → ID: `review-code`
- `prompts/code/review.md` → ID: `code/review`

## Configuring Resources

Resources are collections of files that can be accessed by AI models. Each resource is a directory containing files.

### Resource Directory Requirements

Each resource directory must contain:
- A `README.md` file describing the resource collection
- One or more content files

The first line of the README.md (the title) is used as the resource description.

### Resource Access

Resources are accessed using the resource ID (directory name) and the file path:

- `resource-id://file.txt` - Access a specific file
- `resource-id://` - List all files in the resource

## Configuring Tools

Tools are JavaScript modules or shell scripts that can be executed by AI models.

### JavaScript Tool Format

JavaScript tools must export an object with the following properties:

```javascript
module.exports = {
  name: 'tool-name',
  description: 'Tool description',
  parameters: {
    param1: {
      type: 'string',
      description: 'Description of parameter 1'
    },
    param2: {
      type: 'number',
      description: 'Description of parameter 2'
    }
  },
  handler: async function(params) {
    // Tool implementation
    return result; // Return any value
  }
};
```

### Shell Script Tool Format

Shell script tools must handle two command modes:

1. `--mcp-metadata`: Return tool metadata as JSON
2. `--mcp-execute <json>`: Execute the tool with the given JSON parameters

Example shell script:

```bash
#!/bin/bash

# Return metadata when requested
if [[ "$1" == "--mcp-metadata" ]]; then
  cat << EOF
{
  "name": "script-tool",
  "description": "Tool description",
  "parameters": {
    "param1": {
      "type": "string",
      "description": "Description of parameter 1"
    }
  }
}
EOF
  exit 0
fi

# Execute tool
if [[ "$1" == "--mcp-execute" ]]; then
  PARAMS="$2"
  # Extract parameters and execute the tool
  
  # Return result as JSON
  echo '{"result": "success"}'
  exit 0
fi

echo "This is an MCP tool script"
exit 1
```

### Tool Organization

Tools can be organized in subdirectories. The tool ID is derived from the file name:

- `tools/calculator.js` → ID: `calculator`
- `tools/text/formatter.js` → ID: `formatter`

## Starting the Server

Start the server with the configuration directory path:

```bash
# Using the default config directory (./config)
yarn start

# Using a custom config directory
yarn start --config /path/to/config
```

## Best Practices

1. **Organize prompts by category**:
   Create subdirectories to group related prompts (e.g., `code/`, `writing/`).

2. **Document your resources**:
   Always include a comprehensive README.md for each resource directory.

3. **Version your tools**:
   Include version information in your tool metadata.

4. **Use standard content types**:
   For resources, use standard file extensions and mime types.

5. **Validate parameters**:
   Define parameter constraints clearly in your tool and prompt definitions.

6. **Keep prompts modular**:
   Create smaller, reusable prompts rather than large complex ones.

7. **Use descriptive names**:
   Choose clear, descriptive names for prompts, resources, and tools.

8. **Include examples**:
   Provide example usage in tool and prompt descriptions.