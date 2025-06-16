# Custom MCP Configuration

This directory contains a custom MCP (Model Context Protocol) server configuration designed for development workflows and code companion functionality. The configuration follows the MCP specification 2025-03-26 to ensure proper tool and prompt description exposure.

## Overview

The custom configuration provides:

- **Development Tools**: Code analysis, Git operations, and workflow automation
- **Code Companion Prompts**: Debugging, documentation, refactoring, and testing assistance
- **MCP Compliance**: Proper tool and prompt registration with descriptions
- **Extensible Structure**: Easy to add new tools and prompts

## Configuration Files

### Core Configuration

- **`mcp-config.yaml`** - Main server configuration with capabilities and paths
- **`server.yaml`** - Server startup settings and MCP protocol configuration
- **`tools.yaml`** - Tool registry with metadata and validation rules
- **`prompts.yaml`** - Prompt registry with argument definitions

### Directory Structure

```
config-custom/
├── mcp-config.yaml          # Main configuration
├── server.yaml              # Server settings
├── tools.yaml               # Tool registry
├── prompts.yaml             # Prompt registry
├── README.md                # This file
├── tools/                   # Tool implementations
│   └── development/
│       ├── code-analyzer.js # Code analysis tool
│       ├── git-simple.js    # Simple Git operations
│       └── git-helper.sh    # Advanced Git helper (shell)
├── prompts/                 # Prompt templates
│   ├── code/
│   │   ├── debug.md         # Debugging assistance
│   │   ├── document.md      # Documentation generation
│   │   ├── optimize.md      # Performance optimization
│   │   ├── refactor.md      # Code refactoring
│   │   ├── review.md        # Code review
│   │   └── test.md          # Test generation
│   └── development/
└── resources/               # Static resources
```

## MCP Specification Compliance

### Tool Format

All tools follow the MCP specification with proper `inputSchema` format:

```javascript
module.exports = {
  name: 'tool-name',
  description: 'Human-readable description of the tool',
  inputSchema: {
    type: 'object',
    properties: {
      param1: {
        type: 'string',
        description: 'Parameter description'
      }
    },
    required: ['param1']
  },
  handler: async function(params) {
    // Tool implementation
  }
};
```

### Prompt Format

Prompts use YAML frontmatter with MCP-compliant metadata:

```markdown
---
parameters:
  code:
    type: string
    description: The code to analyze
    required: true
  language:
    type: string
    description: Programming language
    required: false
description: Prompt description
author: Author name
---

# Prompt Template

Your prompt content here with {{code}} placeholders.
```

## Available Tools

### Code Analyzer (`code-analyzer`)

Analyzes code for complexity, maintainability, security issues, and best practices.

**Parameters:**
- `code` (required): Source code to analyze
- `language` (optional): Programming language
- `analysis_type` (optional): Type of analysis (complexity, security, performance, maintainability, comprehensive)
- `include_suggestions` (optional): Whether to include improvement suggestions

### Git Simple (`git-simple`)

Simplified Git workflow automation for basic repository operations.

**Parameters:**
- `action` (required): Git action (status, branch, log, diff)
- `limit` (optional): Limit for log entries

### Git Helper (`git-helper`)

Advanced Git workflow automation with comprehensive repository management (shell-based).

**Parameters:**
- `action` (required): Git action
- `message` (optional): Commit message
- `branch_name` (optional): Branch name
- `target_branch` (optional): Target branch for operations
- `file_pattern` (optional): File pattern
- `limit` (optional): Limit for log entries

## Available Prompts

### Code Prompts

- **`debug`** - Comprehensive bug fixing and debugging assistance
- **`document`** - Generate code documentation with customizable format
- **`optimize`** - Performance optimization analysis and recommendations
- **`refactor`** - Intelligent code refactoring suggestions
- **`review`** - Comprehensive code review with quality assessment
- **`test`** - Test generation with multiple testing strategies

### Development Prompts

Additional development workflow prompts for project management and team collaboration.

## Usage

### Starting the Server

```bash
# Build the server
npm run build

# Start with custom configuration
node dist/index.js --config config-custom

# Or set environment variable
export MCP_CONFIG_DIR=config-custom
npm start
```

### Testing with mcphub

```bash
# List available tools
mcphub list-tools shel-mcp-custom

# List available prompts
mcphub list-prompts shel-mcp-custom

# Execute a tool
mcphub call-tool shel-mcp-custom code-analyzer '{"code": "console.log(\"hello\");", "language": "javascript"}'

# Get a prompt
mcphub get-prompt shel-mcp-custom debug '{"code": "broken code here", "error_message": "TypeError"}'
```

## Configuration Features

### MCP Compliance

- **Tool Descriptions**: Properly exposed in `tools/list` responses
- **Prompt Descriptions**: Properly exposed in `prompts/list` responses
- **Input Schema Validation**: JSON Schema format for tool parameters
- **Argument Definitions**: Structured argument definitions for prompts

### Server Capabilities

- **Tool Management**: Auto-discovery, validation, and registration
- **Prompt Management**: Frontmatter parsing and template processing
- **Resource Management**: Static resource serving with caching
- **Performance Monitoring**: Metrics collection and logging
- **Security**: Input validation and sandboxing options

### Development Features

- **Hot Reload**: Automatic configuration reloading (optional)
- **Validation**: Strict MCP specification compliance checking
- **Debug Mode**: Detailed logging and error reporting
- **Testing**: Built-in verification scripts

## Adding New Tools

### JavaScript/TypeScript Tools

1. Create a `.js` or `.ts` file in `tools/` directory
2. Export an object with MCP-compliant structure:

```javascript
module.exports = {
  name: 'my-tool',
  description: 'Description of what the tool does',
  inputSchema: {
    type: 'object',
    properties: {
      input: {
        type: 'string',
        description: 'Input parameter description'
      }
    },
    required: ['input']
  },
  handler: async function({ input }) {
    // Tool implementation
    return {
      content: [
        {
          type: 'text',
          text: `Processed: ${input}`
        }
      ]
    };
  }
};
```

3. Add entry to `tools.yaml` registry (optional, auto-discovery enabled)
4. Rebuild and restart server

### Shell Script Tools

1. Create a `.sh` file in `tools/` directory
2. Make it executable: `chmod +x tool-name.sh`
3. Follow the shell tool parameter convention
4. Add entry to `tools.yaml` registry

## Adding New Prompts

1. Create a `.md` file in `prompts/` directory
2. Add YAML frontmatter with metadata:

```markdown
---
parameters:
  param1:
    type: string
    description: Parameter description
    required: true
description: Prompt description
author: Your Name
---

# Prompt Title

Your prompt template with {{param1}} placeholders.
```

3. Add entry to `prompts.yaml` registry (optional)
4. Rebuild and restart server

## Troubleshooting

### Tools/Prompts Not Showing Descriptions

1. **Check MCP Format**: Ensure tools use `inputSchema` not `parameters`
2. **Validate Configuration**: Run validation scripts
3. **Check Server Logs**: Look for registration errors
4. **Test with mcphub**: Verify descriptions appear in list responses

### Verification Scripts

```bash
# Test tool format
node test-tool-format.js

# Test minimal MCP server
node test-mcp-server.js

# Verify configuration
node scripts/verify-mcp-format.js
```

### Common Issues

- **Missing Descriptions**: Ensure `description` field is present in tools and prompts
- **Invalid Schema**: Use proper JSON Schema format in `inputSchema`
- **Registration Errors**: Check server logs for tool/prompt loading issues
- **Timeout Issues**: Adjust timeout settings in configuration

## Development Workflow

1. **Make Changes**: Modify tools, prompts, or configuration
2. **Validate**: Run verification scripts
3. **Build**: `npm run build`
4. **Test**: Use mcphub to test functionality
5. **Deploy**: Restart server with new configuration

## Configuration Reference

### Main Configuration (`mcp-config.yaml`)

- Server identification and capabilities
- Component directory paths
- Global settings and features

### Server Configuration (`server.yaml`)

- MCP protocol settings
- Tool/prompt discovery and validation
- Performance and security settings
- Logging and error handling

### Tool Registry (`tools.yaml`)

- Tool metadata and categories
- Input schema definitions
- Loading and validation rules

### Prompt Registry (`prompts.yaml`)

- Prompt metadata and categories
- Argument definitions
- Template processing settings

## Support

For issues or questions:

1. Check the troubleshooting section
2. Review server logs
3. Validate configuration format
4. Test with minimal examples

## License

This configuration is part of the shel-mcp project and follows the same license terms.