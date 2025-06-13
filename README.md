# shel-mcp

A Model Context Protocol (MCP) server implementation using the MCP SDK with support for external configuration.

## Project Overview

This project implements an MCP server that provides tools and resources for AI models, following the Model Context Protocol specification. 

Key features:
- File-based configuration system for prompts, resources, and tools
- Support for nested directory structures
- Markdown-based prompt templates
- Resource collections with documentation
- Tool implementation in JavaScript or shell scripts

## Getting Started

### Prerequisites

- Node.js (v16 or later)
- Yarn package manager

### Installation

1. Clone the repository
2. Install dependencies:

```bash
yarn install
```

3. Create a `.env` file from the example:

```bash
cp .env.example .env
```

4. Modify the `.env` file with your specific configuration.

### Configuration

The server supports external configuration through a directory structure:

```
config/
├── mcp-config.yaml     # Main configuration file
├── prompts/            # Prompt templates (markdown files)
├── resources/          # Resource collections
└── tools/              # Tool implementations (JS/TS files or shell scripts)
```

See [CONFIGURATION.md](CONFIGURATION.md) for detailed instructions.

### Development

Start the development server with hot reload:

```bash
yarn dev
```

With a custom config directory:

```bash
yarn dev --config ./my-config
```

### Building for Production

Build the project for production:

```bash
yarn build
```

Run the production build:

```bash
yarn start
```

With a custom config directory:

```bash
yarn start --config /path/to/config
```

## Testing

Run tests:

```bash
yarn test
```

Watch mode for tests:

```bash
yarn test:watch
```

## Linting and Formatting

Lint the code:

```bash
yarn lint
```

Automatically fix linting issues:

```bash
yarn lint:fix
```

Format the code:

```bash
yarn format
```

## Project Structure

- `src/` - Source code
  - `config/` - Configuration files and loaders
  - `tools/` - Built-in tool implementations
  - `resources/` - Built-in resource implementations
  - `types/` - Type definitions
  - `utils/` - Utility functions
  - `index.ts` - Main entry point
  - `server.ts` - MCP Server implementation
- `examples/` - Example configurations
  - `config/` - Sample configuration directory
    - `prompts/` - Example prompt templates
    - `resources/` - Example resource collections
    - `tools/` - Example tool implementations
- `tests/` - Tests
  - `unit/` - Unit tests
  - `integration/` - Integration tests
  - `mocks/` - Test mocks
- `dist/` - Compiled output

## Configuration System

The server can be configured using a directory-based approach:

1. **Prompts**: Markdown files with frontmatter for parameters
2. **Resources**: Directories of files with README.md descriptions
3. **Tools**: JavaScript modules or shell scripts with standard interfaces

Configuration is loaded at runtime from the specified config directory.

## Examples

Check out the `examples/config` directory for sample configurations:

```bash
# Run with example configuration
yarn start --config ./examples/config
```

## License

MIT