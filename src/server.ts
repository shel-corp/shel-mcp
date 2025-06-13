import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ConfigManager, PromptConfig, ResourceConfig, ToolConfig } from './types/config';
import { ConfigurationManager } from './config/loader';
import path from 'path';
import { z } from 'zod';

// Define transport interface to avoid direct dependency on SDK types
interface Transport {
  send(message: any): Promise<void>;
  receive(): Promise<any>;
}

/**
 * Shell MCP Server class that loads configuration from a directory
 */
export class ShelMcpServer {
  private server: McpServer;
  private configManager: ConfigManager;
  private transport: Transport | null = null;

  /**
   * Create a new ShelMcpServer instance
   * @param serverName Server name (optional, overrides config)
   * @param serverVersion Server version (optional, overrides config)
   */
  constructor(serverName?: string, serverVersion?: string) {
    // Create a default configuration manager
    this.configManager = new ConfigurationManager();

    // Create the MCP server with placeholder values
    // (will be updated after loading config)
    this.server = new McpServer({
      name: serverName || 'shel-mcp',
      version: serverVersion || '1.0.0',
    });
  }

  /**
   * Initialize the server by loading configuration from a directory
   * @param configDir Path to the configuration directory
   */
  async init(configDir: string): Promise<void> {
    try {
      // Normalize the path
      const normalizedPath = path.resolve(process.cwd(), configDir);

      // Load configuration
      await this.configManager.loadConfig(normalizedPath);

      // Update server name and version from config if not overridden
      const serverName = this.server.name;
      const serverVersion = this.server.version;

      // Re-create the server with the correct name and version
      this.server = new McpServer({
        name: serverName || this.configManager.config.name,
        version: serverVersion || this.configManager.config.version,
      });

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
  private registerPrompts(): void {
    if (!this.configManager.prompts.length) {
      return;
    }

    console.log(`Registering ${this.configManager.prompts.length} prompts...`);

    for (const prompt of this.configManager.prompts) {
      try {
        this.registerPrompt(prompt);
      } catch (err) {
        console.error(`Error registering prompt ${prompt.id}:`, err);
      }
    }
  }

  /**
   * Register a single prompt
   */
  private registerPrompt(promptConfig: PromptConfig): void {
    const { id, content, parameters } = promptConfig;

    // Register the prompt with the server
    this.server.prompt(id, parameters, (params: Record<string, any>) => {
      // Replace placeholders in the content with parameters
      let processedContent = content;
      for (const [key, value] of Object.entries(params)) {
        const placeholder = `{{${key}}}`;
        const strValue = String(value);
        processedContent = processedContent.replace(new RegExp(placeholder, 'g'), strValue);
      }

      return {
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

    console.log(`Registered prompt: ${id}`);
  }

  /**
   * Register all resources from configuration
   */
  private registerResources(): void {
    if (!this.configManager.resources.length) {
      return;
    }

    console.log(`Registering ${this.configManager.resources.length} resources...`);

    for (const resource of this.configManager.resources) {
      try {
        this.registerResource(resource);
      } catch (err) {
        console.error(`Error registering resource ${resource.id}:`, err);
      }
    }
  }

  /**
   * Register a single resource
   */
  private registerResource(resourceConfig: ResourceConfig): void {
    const { id, files } = resourceConfig;

    // Create a resource template
    const template = new ResourceTemplate(`${id}://{path}`, { list: () => ({ resources: [] }) });

    // Register the resource with the server
    this.server.resource(id, template, async (_: any, { path }: { path: string }) => {
      // If no specific path is requested, list all files
      if (!path) {
        return {
          contents: files.map(file => ({
            uri: `${id}://${file.path}`,
            text: file.name,
          })),
        };
      }

      // Find the requested file
      const file = files.find(f => f.path === path || f.name === path);
      if (!file) {
        throw new Error(`File not found: ${path}`);
      }

      return {
        contents: [
          {
            uri: `${id}://${file.path}`,
            text: file.content,
          },
        ],
      };
    });

    console.log(`Registered resource: ${id}`);
  }

  /**
   * Register all tools from configuration
   */
  private registerTools(): void {
    if (!this.configManager.tools.length) {
      return;
    }

    console.log(`Registering ${this.configManager.tools.length} tools...`);

    for (const tool of this.configManager.tools) {
      try {
        this.registerTool(tool);
      } catch (err) {
        console.error(`Error registering tool ${tool.id}:`, err);
      }
    }
  }

  /**
   * Register a single tool
   */
  private registerTool(toolConfig: ToolConfig): void {
    const { id, parameters, handler } = toolConfig;

    // Register the tool with the server
    this.server.tool(id, parameters, async (params: Record<string, any>) => {
      try {
        const result = await handler(params);

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

    console.log(`Registered tool: ${id}`);
  }

  /**
   * Connect the server to a transport
   * @param transport Transport to connect to (default: StdioServerTransport)
   */
  async connect(transport?: Transport): Promise<void> {
    this.transport = transport || new StdioServerTransport();
    await this.server.connect(this.transport);
  }

  /**
   * Disconnect the server from its transport
   */
  async disconnect(): Promise<void> {
    if (this.transport) {
      await this.server.disconnect();
      this.transport = null;
    }
  }

  /**
   * Add a custom tool to the server
   */
  tool(
    name: string,
    parameters: Record<string, z.ZodTypeAny>,
    handler: (params: any) => Promise<any>,
  ): void {
    this.server.tool(name, parameters, handler);
  }

  /**
   * Add a custom resource to the server
   */
  resource(
    name: string,
    template: ResourceTemplate,
    handler: (uri: URL, params: any) => Promise<any>,
  ): void {
    this.server.resource(name, template, handler);
  }

  /**
   * Add a custom prompt to the server
   */
  prompt(
    name: string,
    parameters: Record<string, z.ZodTypeAny>,
    handler: (params: any) => any,
  ): void {
    this.server.prompt(name, parameters, handler);
  }
}
