import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ConfigManager } from './types/config';
import { ConfigurationManager } from './config/loader';
import { z } from 'zod';
import path from 'path';

/**
 * Shell MCP Server class that loads configuration from a directory
 */
export class ShelMcpServer {
  private server: McpServer;
  private configManager: ConfigManager;
  private transport: StdioServerTransport | null = null;
  private serverName: string;
  private serverVersion: string;

  /**
   * Create a new ShelMcpServer instance
   * @param serverName Server name (optional, overrides config)
   * @param serverVersion Server version (optional, overrides config)
   */
  constructor(serverName?: string, serverVersion?: string) {
    this.serverName = serverName || 'shel-mcp';
    this.serverVersion = serverVersion || '1.0.0';
    
    // Create a default configuration manager
    this.configManager = new ConfigurationManager();

    // Create the MCP server
    this.server = new McpServer(
      {
        name: this.serverName,
        version: this.serverVersion,
      }
    );
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

      // Use config name/version if not overridden in constructor
      const finalName = this.serverName !== 'shel-mcp' ? this.serverName : this.configManager.config.name;
      const finalVersion = this.serverVersion !== '1.0.0' ? this.serverVersion : this.configManager.config.version;

      // Re-create the server with the correct name and version
      this.server = new McpServer(
        {
          name: finalName,
          version: finalVersion,
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
  private registerPrompts(): void {
    if (!this.configManager.prompts.length) {
      return;
    }

    console.log(`Registering ${this.configManager.prompts.length} prompts...`);

    // Use low-level server API to register prompts with proper types
    this.registerPromptsWithLowLevelAPI();
  }

  /**
   * Register prompts using McpServer but with custom type handling
   */
  private registerPromptsWithLowLevelAPI(): void {
    for (const prompt of this.configManager.prompts) {
      // Use McpServer for registration but override argument handling
      if (Object.keys(prompt.parameters).length > 0) {
        // Register with the McpServer using simplified string schema
        const stringSchema: Record<string, z.ZodString | z.ZodOptional<z.ZodString>> = {};
        for (const [key, zodType] of Object.entries(prompt.parameters)) {
          if (zodType.isOptional()) {
            stringSchema[key] = z.string().optional();
          } else {
            stringSchema[key] = z.string();
          }
        }

        const registeredPrompt = this.server.prompt(
          prompt.id,
          stringSchema as any,
          async (args: any) => {
            // Process template with conditional blocks and loops
            let processedContent = this.processTemplate(prompt.content, args || {});

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
          }
        );

        // Update with proper description and handle argument types manually
        if (prompt.metadata?.description) {
          registeredPrompt.update({ description: prompt.metadata.description });
        }
      } else {
        this.server.prompt(
          prompt.id,
          prompt.metadata?.description || `Prompt: ${prompt.id}`,
          async () => {
            return {
              description: prompt.metadata?.description || `Executed prompt: ${prompt.id}`,
              messages: [
                {
                  role: 'user',
                  content: {
                    type: 'text',
                    text: this.processTemplate(prompt.content, {}),
                  },
                },
              ],
            };
          }
        );
      }

      console.log(`Registered prompt: ${prompt.id} - ${prompt.metadata?.description || 'No description'}`);
    }

    // Now override the prompts/list handler to provide correct types
    this.overridePromptListHandler();
  }

  /**
   * Override the prompts/list handler to provide correct argument types
   */
  private overridePromptListHandler(): void {
    // Access the underlying server and override the prompts/list handler
    const underlyingServer = (this.server as any).server;
    
    // Remove the existing handler
    underlyingServer._requestHandlers.delete('prompts/list');
    
    // Add our custom handler
    underlyingServer.setRequestHandler(
      z.object({ method: z.literal('prompts/list') }),
      async () => {
        return {
          prompts: this.configManager.prompts.map(prompt => ({
            name: prompt.id,
            description: prompt.metadata?.description || `Prompt: ${prompt.id}`,
            arguments: this.convertParametersToMcpArguments(prompt.parameters, prompt)
          }))
        };
      }
    );
  }

  /**
   * Convert parameters to MCP prompt arguments format preserving types and descriptions
   */
  private convertParametersToMcpArguments(parameters: Record<string, z.ZodTypeAny>, prompt?: any): any[] {
    const argumentsList: any[] = [];

    // Use original argument definitions if available for better descriptions and types
    const originalArgs = prompt?.metadata?.argumentDefinitions || [];
    
    for (const [key, zodType] of Object.entries(parameters)) {
      // Find the original argument definition
      const originalArg = originalArgs.find((arg: any) => arg.name === key);
      
      const argument: any = {
        name: key,
        description: originalArg?.description || `Parameter: ${key}`,
        required: originalArg?.required !== false && !zodType.isOptional()
      };

      // Use original type if available, otherwise determine from Zod schema
      if (originalArg?.type) {
        argument.type = originalArg.type;
        
        // Include enum values if present
        if (originalArg.enum) {
          argument.enum = originalArg.enum;
        }
      } else {
        // Fallback to determining type from Zod schema
        const typeName = zodType._def.typeName;
        switch (typeName) {
          case 'ZodString':
            argument.type = 'string';
            break;
          case 'ZodNumber':
            argument.type = 'number';
            break;
          case 'ZodBoolean':
            argument.type = 'boolean';
            break;
          case 'ZodArray':
            argument.type = 'array';
            break;
          case 'ZodObject':
            argument.type = 'object';
            break;
          case 'ZodOptional':
            // Get the underlying type for optional fields
            const innerType = zodType._def.innerType._def.typeName;
            switch (innerType) {
              case 'ZodString':
                argument.type = 'string';
                break;
              case 'ZodNumber':
                argument.type = 'number';
                break;
              case 'ZodBoolean':
                argument.type = 'boolean';
                break;
              case 'ZodArray':
                argument.type = 'array';
                break;
              case 'ZodObject':
                argument.type = 'object';
                break;
              default:
                argument.type = 'string';
            }
            break;
          default:
            argument.type = 'string';
        }
      }

      argumentsList.push(argument);
    }

    return argumentsList;
  }

  /**
   * Process template with conditional blocks, loops, and parameter substitution
   * Uses a proper parser/interpreter instead of regex for robust parsing
   */
  private processTemplate(content: string, args: Record<string, any>): string {
    // Import and use the new template parser
    const { parseTemplate } = require('../template-parser.js');
    return parseTemplate(content, args);
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
      for (const file of resource.files) {
        const uri = `${resource.id}://${file.path}`;
        
        this.server.resource(
          file.name,
          uri,
          async (uri: URL) => {
            return {
              contents: [{
                uri: uri.toString(),
                mimeType: file.contentType,
                text: file.content
              }]
            };
          }
        );
      }

      console.log(`Registered resource: ${resource.id} - ${resource.description}`);
    }
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
      // Convert parameters to Zod schema if needed
      const paramsSchema: any = {};
      if (tool.parameters) {
        for (const [key] of Object.entries(tool.parameters)) {
          paramsSchema[key] = z.string(); // Default to string, can be enhanced
        }
      }

      // Register the tool with McpServer
      if (Object.keys(paramsSchema).length > 0) {
        this.server.tool(
          tool.id,
          paramsSchema,
          async (args: any) => {
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
          }
        );
      } else {
        this.server.tool(
          tool.id,
          tool.description,
          async () => {
            try {
              const result = await tool.handler({});

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
          }
        );
      }

      console.log(`Registered tool: ${tool.id} - ${tool.description}`);
    }
    
    // Override the tools/list handler to provide correct input schemas
    this.overrideToolListHandler();
  }

  /**
   * Override the tools/list handler to provide correct input schemas with proper types
   */
  private overrideToolListHandler(): void {
    // Access the underlying server and override the tools/list handler  
    const underlyingServer = (this.server as any).server;
    
    // Remove the existing handler
    underlyingServer._requestHandlers.delete('tools/list');
    
    // Add our custom handler
    underlyingServer.setRequestHandler(
      z.object({ method: z.literal('tools/list') }),
      async () => {
        return {
          tools: this.configManager.tools.map(tool => ({
            name: tool.id,
            description: tool.description,
            inputSchema: tool.inputSchema || this.convertParametersToInputSchema(tool.parameters)
          }))
        };
      }
    );
  }

  /**
   * Convert Zod parameters to input schema format preserving types (fallback for tools without original inputSchema)
   */
  private convertParametersToInputSchema(parameters: Record<string, z.ZodTypeAny>): any {
    const properties: Record<string, any> = {};
    const required: string[] = [];

    for (const [key, zodType] of Object.entries(parameters)) {
      const propertySchema: any = {
        description: `Parameter: ${key}`
      };

      // Determine the type from the Zod schema
      const typeName = zodType._def.typeName;
      switch (typeName) {
        case 'ZodString':
          propertySchema.type = 'string';
          break;
        case 'ZodNumber':
          propertySchema.type = 'number';
          break;
        case 'ZodBoolean':
          propertySchema.type = 'boolean';
          break;
        case 'ZodArray':
          propertySchema.type = 'array';
          break;
        case 'ZodObject':
          propertySchema.type = 'object';
          break;
        case 'ZodOptional':
          // Get the underlying type for optional fields
          const innerType = zodType._def.innerType._def.typeName;
          switch (innerType) {
            case 'ZodString':
              propertySchema.type = 'string';
              break;
            case 'ZodNumber':
              propertySchema.type = 'number';
              break;
            case 'ZodBoolean':
              propertySchema.type = 'boolean';
              break;
            case 'ZodArray':
              propertySchema.type = 'array';
              break;
            case 'ZodObject':
              propertySchema.type = 'object';
              break;
            default:
              propertySchema.type = 'string';
          }
          break;
        default:
          propertySchema.type = 'string';
      }

      properties[key] = propertySchema;

      // Add to required if not optional
      if (!zodType.isOptional()) {
        required.push(key);
      }
    }

    return {
      type: 'object',
      properties,
      required,
      additionalProperties: false,
      $schema: 'http://json-schema.org/draft-07/schema#'
    };
  }

  /**
   * Connect the server to a transport
   * @param transport Transport to connect to (default: StdioServerTransport)
   */
  async connect(transport?: StdioServerTransport): Promise<void> {
    this.transport = transport || new StdioServerTransport();
    await this.server.connect(this.transport);
  }

  /**
   * Disconnect the server from its transport
   */
  async disconnect(): Promise<void> {
    if (this.transport) {
      // The SDK handles cleanup when the transport closes
      this.transport = null;
    }
  }

  /**
   * Add a custom tool to the server
   */
  tool(name: string, parameters: any, handler: any): void {
    this.server.tool(name, parameters, handler);
  }

  /**
   * Add a custom resource to the server
   */
  resource(name: string, uri: string, handler: any): void {
    this.server.resource(name, uri, handler);
  }

  /**
   * Add a custom prompt to the server
   */
  prompt(name: string, parameters: any, handler: any): void {
    this.server.prompt(name, parameters, handler);
  }
}