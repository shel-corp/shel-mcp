const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { ConfigurationManager } = require('../dist/config/loader.js');
const path = require('path');

/**
 * Shell MCP Server class that loads configuration from a directory
 */
class ShelMcpServer {
  constructor(serverName, serverVersion) {
    this.serverName = serverName || 'shel-mcp';
    this.serverVersion = serverVersion || '1.0.0';
    this.transport = null;
    
    // Create a default configuration manager
    this.configManager = new ConfigurationManager();

    // Create the MCP server
    this.server = new Server(
      {
        name: this.serverName,
        version: this.serverVersion,
      },
      {
        capabilities: {
          tools: {},
          prompts: {},
          resources: {}
        }
      }
    );
  }

  /**
   * Initialize the server by loading configuration from a directory
   */
  async init(configDir) {
    try {
      // Normalize the path
      const normalizedPath = path.resolve(process.cwd(), configDir);

      // Load configuration
      await this.configManager.loadConfig(normalizedPath);

      // Use config name/version if not overridden in constructor
      const finalName = this.serverName !== 'shel-mcp' ? this.serverName : this.configManager.config.name;
      const finalVersion = this.serverVersion !== '1.0.0' ? this.serverVersion : this.configManager.config.version;

      // Re-create the server with the correct name and version
      this.server = new Server(
        {
          name: finalName,
          version: finalVersion,
        },
        {
          capabilities: {
            tools: {},
            prompts: {},
            resources: {}
          }
        }
      );

      // Register all components from config
      this.registerPrompts();
      this.registerResources();
      this.registerTools();

      console.log(`Server initialized with configuration from ${normalizedPath}`);
    } catch (err) {
      console.error('Error initializing server:', err);
      throw err;
    }
  }

  /**
   * Register all prompts from configuration
   */
  registerPrompts() {
    if (!this.configManager.prompts.length) {
      return;
    }

    console.log(`Registering ${this.configManager.prompts.length} prompts...`);

    // Set up the prompts/list handler to expose prompt metadata
    this.server.setRequestHandler('prompts/list', async () => {
      return {
        prompts: this.configManager.prompts.map(prompt => ({
          name: prompt.id,
          description: prompt.metadata?.description || `Prompt: ${prompt.id}`,
          arguments: this.convertParametersToPromptArguments(prompt.parameters)
        }))
      };
    });

    // Set up the prompts/get handler for prompt execution
    this.server.setRequestHandler('prompts/get', async (request) => {
      const { name, arguments: args } = request.params;
      
      const prompt = this.configManager.prompts.find(p => p.id === name);
      if (!prompt) {
        throw new Error(`Unknown prompt: ${name}`);
      }

      // Replace placeholders in the content with parameters
      let processedContent = prompt.content;
      if (args) {
        for (const [key, value] of Object.entries(args)) {
          const placeholder = new RegExp(`{{${key}}}`, 'g');
          const strValue = String(value);
          processedContent = processedContent.replace(placeholder, strValue);
        }
      }

      return {
        description: prompt.metadata?.description || `Executed prompt: ${prompt.id}`,
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: processedContent,
            },
          },
        ],
      };
    });

    for (const prompt of this.configManager.prompts) {
      console.log(`Registered prompt: ${prompt.id} - ${prompt.metadata?.description || 'No description'}`);
    }
  }

  /**
   * Convert parameters to prompt arguments format for MCP
   */
  convertParametersToPromptArguments(parameters) {
    const argumentsList = [];

    for (const [key, schema] of Object.entries(parameters)) {
      const argument = {
        name: key,
        description: `Parameter: ${key}`,
        required: true // Default to required, could be enhanced
      };

      argumentsList.push(argument);
    }

    return argumentsList;
  }

  /**
   * Register all resources from configuration
   */
  registerResources() {
    if (!this.configManager.resources.length) {
      return;
    }

    console.log(`Registering ${this.configManager.resources.length} resources...`);

    // Set up the resources/list handler
    this.server.setRequestHandler('resources/list', async () => {
      return {
        resources: this.configManager.resources.flatMap(resource =>
          resource.files.map(file => ({
            uri: `${resource.id}://${file.path}`,
            name: file.name,
            description: resource.description,
            mimeType: file.contentType
          }))
        )
      };
    });

    // Set up the resources/read handler
    this.server.setRequestHandler('resources/read', async (request) => {
      const { uri } = request.params;
      
      // Parse the URI to get resource ID and path
      const uriParts = uri.split('://');
      if (uriParts.length !== 2) {
        throw new Error(`Invalid resource URI: ${uri}`);
      }
      
      const [resourceId, filePath] = uriParts;
      const resource = this.configManager.resources.find(r => r.id === resourceId);
      if (!resource) {
        throw new Error(`Unknown resource: ${resourceId}`);
      }
      
      const file = resource.files.find(f => f.path === filePath);
      if (!file) {
        throw new Error(`File not found: ${filePath}`);
      }
      
      return {
        contents: [{
          uri: uri,
          mimeType: file.contentType,
          text: file.content
        }]
      };
    });

    for (const resource of this.configManager.resources) {
      console.log(`Registered resource: ${resource.id} - ${resource.description}`);
    }
  }

  /**
   * Register all tools from configuration
   */
  registerTools() {
    if (!this.configManager.tools.length) {
      return;
    }

    console.log(`Registering ${this.configManager.tools.length} tools...`);

    // Set up the tools/list handler to expose tool metadata
    this.server.setRequestHandler('tools/list', async () => {
      return {
        tools: this.configManager.tools.map(tool => ({
          name: tool.id,
          description: tool.description,
          inputSchema: tool.inputSchema || this.convertParametersToInputSchema(tool.parameters)
        }))
      };
    });

    // Set up the tools/call handler for tool execution
    this.server.setRequestHandler('tools/call', async (request) => {
      const { name, arguments: args } = request.params;
      
      const tool = this.configManager.tools.find(t => t.id === name);
      if (!tool) {
        throw new Error(`Unknown tool: ${name}`);
      }

      try {
        const result = await tool.handler(args || {});

        // Convert result to content based on its type
        let content;

        if (typeof result === 'string') {
          content = [{ type: 'text', text: result }];
        } else if (Array.isArray(result)) {
          content = result.map(item => ({ type: 'text', text: String(item) }));
        } else if (typeof result === 'object' && result !== null) {
          if (result.content) {
            content = result.content;
          } else {
            content = [{ type: 'text', text: JSON.stringify(result, null, 2) }];
          }
        } else {
          content = [{ type: 'text', text: String(result) }];
        }

        return { content };
      } catch (err) {
        throw new Error(
          `Tool execution error: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    });

    for (const tool of this.configManager.tools) {
      console.log(`Registered tool: ${tool.id} - ${tool.description}`);
    }
  }

  /**
   * Convert parameters to inputSchema format for MCP (fallback for legacy tools)
   */
  convertParametersToInputSchema(parameters) {
    const properties = {};
    const required = [];

    for (const [key, schema] of Object.entries(parameters)) {
      // Simple fallback conversion
      properties[key] = { 
        type: 'string', 
        description: `Parameter: ${key}` 
      };
      
      // Assume required unless explicitly optional
      if (!schema.isOptional || !schema.isOptional()) {
        required.push(key);
      }
    }

    return {
      type: 'object',
      properties,
      required
    };
  }

  /**
   * Connect the server to a transport
   */
  async connect(transport) {
    this.transport = transport || new StdioServerTransport();
    await this.server.connect(this.transport);
  }

  /**
   * Disconnect the server from its transport
   */
  async disconnect() {
    if (this.transport) {
      // The SDK handles cleanup when the transport closes
      this.transport = null;
    }
  }

  /**
   * Add a custom tool to the server (deprecated - use config-based approach)
   */
  tool(name, parameters, handler) {
    console.warn('Custom tool registration not yet implemented for new Server API');
  }

  /**
   * Add a custom resource to the server (deprecated - use config-based approach)
   */
  resource(name, handler) {
    console.warn('Custom resource registration not yet implemented for new Server API');
  }

  /**
   * Add a custom prompt to the server (deprecated - use config-based approach)
   */
  prompt(name, parameters, handler) {
    console.warn('Custom prompt registration not yet implemented for new Server API');
  }
}

module.exports = { ShelMcpServer };