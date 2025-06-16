import path from 'path';
import fs from 'fs/promises';
import { z } from 'zod';
import * as yaml from 'js-yaml';
import {
  ConfigFile,
  ConfigManager,
  PromptConfig,
  ResourceConfig,
  ToolConfig,
} from '../types/config';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

// Schema for validating config file
const configFileSchema = z.object({
  name: z.string(),
  version: z.string(),
  description: z.string().optional(),
  paths: z
    .object({
      prompts: z.string().optional(),
      resources: z.string().optional(),
      tools: z.string().optional(),
    })
    .optional(),
});

/**
 * Class for loading and managing MCP server configuration
 */
export class ConfigurationManager implements ConfigManager {
  config!: ConfigFile;
  prompts: PromptConfig[] = [];
  resources: ResourceConfig[] = [];
  tools: ToolConfig[] = [];
  private configDir!: string;

  /**
   * Loads the entire configuration from a given directory
   */
  async loadConfig(configDir: string): Promise<void> {
    this.configDir = configDir;

    // Ensure the config directory exists
    try {
      await fs.access(configDir);
    } catch (err) {
      throw new Error(`Config directory not found: ${configDir}`);
    }

    // Load the main config file
    const configPath = path.join(configDir, 'mcp-config.yaml');
    try {
      const configFile = await fs.readFile(configPath, 'utf8');
      const parsedConfig = yaml.load(configFile) as unknown;
      const validatedConfig = configFileSchema.parse(parsedConfig);
      this.config = validatedConfig;
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new Error(`Config file not found at ${configPath}`);
      }
      throw new Error(
        `Error loading config file: ${err instanceof Error ? err.message : String(err)}`,
      );
    }

    // Load components if paths are specified
    const { paths } = this.config;
    if (paths) {
      if (paths.prompts) {
        this.prompts = await this.loadPrompts(path.join(configDir, paths.prompts));
      }

      if (paths.resources) {
        this.resources = await this.loadResources(path.join(configDir, paths.resources));
      }

      if (paths.tools) {
        this.tools = await this.loadTools(path.join(configDir, paths.tools));
      }
    }

    // Also load prompts from prompts.yaml if it exists
    const promptsYamlPath = path.join(configDir, 'prompts.yaml');
    try {
      await fs.access(promptsYamlPath);
      const yamlPrompts = await this.loadPromptsFromYaml(promptsYamlPath, configDir);
      // Merge with existing prompts, preferring YAML definitions
      for (const yamlPrompt of yamlPrompts) {
        const existingIndex = this.prompts.findIndex(p => p.id === yamlPrompt.id);
        if (existingIndex >= 0) {
          this.prompts[existingIndex] = yamlPrompt;
        } else {
          this.prompts.push(yamlPrompt);
        }
      }
    } catch (err) {
      // prompts.yaml doesn't exist, continue with existing prompts
    }
  }

  /**
   * Load and parse prompt files from the prompts directory
   */
  async loadPrompts(promptsDir: string): Promise<PromptConfig[]> {
    const prompts: PromptConfig[] = [];

    try {
      await fs.access(promptsDir);
    } catch (err) {
      console.warn(`Prompts directory not found: ${promptsDir}`);
      return prompts;
    }

    const promptFiles = await this.getAllFilesRecursively(promptsDir, ['.md']);

    for (const file of promptFiles) {
      try {
        const content = await fs.readFile(file, 'utf8');
        const relativePath = path.relative(promptsDir, file);
        const dirName = path.dirname(relativePath);
        const baseName = path.basename(file, '.md');

        // Generate the prompt ID based on its path
        const id = dirName === '.' ? baseName : `${dirName.replace(/\\/g, '/')}/${baseName}`;

        // Extract parameters from frontmatter if present
        const { parameters, metadata, content: promptContent } = this.parsePrompt(content);

        prompts.push({
          id,
          path: relativePath,
          content: promptContent,
          parameters,
          metadata,
        });
      } catch (err) {
        console.error(`Error loading prompt file ${file}:`, err);
      }
    }

    return prompts;
  }

  /**
   * Load prompts from a YAML configuration file
   */
  async loadPromptsFromYaml(yamlPath: string, configDir: string): Promise<PromptConfig[]> {
    const prompts: PromptConfig[] = [];

    try {
      const yamlContent = await fs.readFile(yamlPath, 'utf8');
      const config = yaml.load(yamlContent) as any;

      if (!config.prompts || !Array.isArray(config.prompts)) {
        console.warn('prompts.yaml does not contain a valid prompts array');
        return prompts;
      }

      for (const promptDef of config.prompts) {
        try {
          if (!promptDef.id || !promptDef.file) {
            console.warn('Prompt definition missing required id or file field:', promptDef);
            continue;
          }

          // Load the actual prompt content from the file
          const promptFilePath = path.join(configDir, 'prompts', promptDef.file);
          let content = '';
          try {
            content = await fs.readFile(promptFilePath, 'utf8');
            // Extract content without frontmatter if present
            const { content: promptContent } = this.parsePrompt(content);
            content = promptContent;
          } catch (err) {
            console.warn(`Could not load prompt file ${promptFilePath}:`, err);
            continue;
          }

          // Convert YAML arguments to Zod parameters
          const parameters: Record<string, z.ZodTypeAny> = {};
          if (promptDef.arguments && Array.isArray(promptDef.arguments)) {
            for (const arg of promptDef.arguments) {
              if (arg.name && arg.type) {
                let schema: z.ZodTypeAny;
                switch (arg.type) {
                  case 'string':
                    schema = z.string();
                    if (arg.enum) schema = schema.refine(val => arg.enum.includes(val));
                    break;
                  case 'number':
                    schema = z.number();
                    break;
                  case 'integer':
                    schema = z.number().int();
                    break;
                  case 'boolean':
                    schema = z.boolean();
                    break;
                  case 'array':
                    schema = z.array(z.string()); // Default to string array
                    break;
                  default:
                    schema = z.string();
                }

                if (arg.required === false) {
                  schema = schema.optional();
                }

                parameters[arg.name] = schema;
              }
            }
          }

          // Create metadata from YAML definition
          const metadata = {
            description: promptDef.description,
            category: promptDef.category,
            tags: promptDef.tags,
            author: promptDef.author,
            enabled: promptDef.enabled !== false, // Default to true
            name: promptDef.name || promptDef.id,
            // Store original argument definitions for proper type handling
            argumentDefinitions: promptDef.arguments || [],
          };

          prompts.push({
            id: promptDef.id,
            path: promptDef.file,
            content,
            parameters,
            metadata,
          });
        } catch (err) {
          console.error(`Error processing prompt definition:`, promptDef, err);
        }
      }
    } catch (err) {
      console.error(`Error loading prompts from ${yamlPath}:`, err);
    }

    return prompts;
  }

  /**
   * Parse a prompt file to extract frontmatter metadata and parameters
   */
  private parsePrompt(content: string): {
    parameters: Record<string, z.ZodTypeAny>;
    metadata: Record<string, any>;
    content: string;
  } {
    // Default values
    let parameters: Record<string, z.ZodTypeAny> = {};
    let metadata: Record<string, any> = {};
    let promptContent = content;

    // Check for frontmatter (---) at the beginning of the file
    if (content.trimStart().startsWith('---')) {
      const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);

      if (frontmatterMatch) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const [_, frontmatter, mainContent] = frontmatterMatch;
        promptContent = mainContent;

        try {
          const parsedFrontmatter = yaml.load(frontmatter) as Record<string, any>;

          // Extract parameters if defined
          if (parsedFrontmatter.parameters) {
            parameters = this.convertToZodSchema(parsedFrontmatter.parameters);
            
            // Store argument definitions for file-based prompts to enable proper type handling
            metadata.argumentDefinitions = Object.entries(parsedFrontmatter.parameters).map(([name, def]: [string, any]) => ({
              name,
              type: def.type || 'string',
              description: def.description || `Parameter: ${name}`,
              required: def.required !== false,
              enum: def.enum
            }));
            
            delete parsedFrontmatter.parameters;
          }

          // The rest of the frontmatter becomes metadata
          metadata = { ...metadata, ...parsedFrontmatter };
        } catch (err) {
          console.warn('Error parsing frontmatter, ignoring:', err);
        }
      }
    }

    return { parameters, metadata, content: promptContent };
  }

  /**
   * Convert JSON schema-like parameter definitions to Zod schemas
   */
  private convertToZodSchema(parameters: Record<string, any>): Record<string, z.ZodTypeAny> {
    const zodSchemas: Record<string, z.ZodTypeAny> = {};

    for (const [key, def] of Object.entries(parameters)) {
      try {
        if (typeof def === 'object' && def !== null) {
          const type = def.type;
          let schema: z.ZodTypeAny;

          switch (type) {
            case 'string':
              schema = z.string();
              if (def.enum) schema = schema.refine(val => def.enum.includes(val));
              break;
            case 'number':
              schema = z.number();
              break;
            case 'integer':
              schema = z.number().int();
              break;
            case 'boolean':
              schema = z.boolean();
              break;
            case 'array':
              // For simplicity, we'll assume array of strings if not specified
              const itemType = def.items?.type || 'string';
              const itemSchema = this.convertToZodSchema({ item: { type: itemType } }).item;
              schema = z.array(itemSchema);
              break;
            case 'object':
              if (def.properties) {
                const shape: Record<string, z.ZodTypeAny> = {};
                for (const [propKey, propDef] of Object.entries(def.properties)) {
                  shape[propKey] = this.convertToZodSchema({ prop: propDef }).prop;
                }
                schema = z.object(shape);
              } else {
                schema = z.record(z.unknown());
              }
              break;
            default:
              schema = z.any();
          }

          // Handle required fields
          if (def.required === false) {
            schema = schema.optional();
          }

          zodSchemas[key] = schema;
        } else {
          // Default to any if the definition format is not recognized
          zodSchemas[key] = z.any();
        }
      } catch (err) {
        console.warn(`Error converting parameter ${key} to Zod schema:`, err);
        zodSchemas[key] = z.any();
      }
    }

    return zodSchemas;
  }

  /**
   * Load resource directories
   */
  async loadResources(resourcesDir: string): Promise<ResourceConfig[]> {
    const resources: ResourceConfig[] = [];

    try {
      await fs.access(resourcesDir);
    } catch (err) {
      console.warn(`Resources directory not found: ${resourcesDir}`);
      return resources;
    }

    // Get all directories in the resources directory
    const entries = await fs.readdir(resourcesDir, { withFileTypes: true });
    const resourceDirs = entries.filter(entry => entry.isDirectory());

    for (const dir of resourceDirs) {
      const dirPath = path.join(resourcesDir, dir.name);
      try {
        // Each resource directory must have a README.md file
        const readmePath = path.join(dirPath, 'README.md');
        let description = '';

        try {
          const readmeContent = await fs.readFile(readmePath, 'utf8');
          description = readmeContent.split('\n')[0].replace(/^#\s*/, '').trim();
        } catch (err) {
          console.warn(`README.md not found in resource directory: ${dirPath}`);
          description = dir.name;
        }

        // Get all files in the directory
        const resourceFiles = await this.getAllFilesRecursively(dirPath, null, ['README.md']);

        const files: { name: string; path: string; contentType: string; content: string }[] = [];

        for (const filePath of resourceFiles) {
          const content = await fs.readFile(filePath, 'utf8');
          const relativePath = path.relative(dirPath, filePath);
          const fileName = path.basename(filePath);

          files.push({
            name: fileName,
            path: relativePath,
            contentType: this.getContentType(filePath),
            content,
          });
        }

        resources.push({
          id: dir.name,
          path: path.relative(resourcesDir, dirPath),
          description,
          files,
        });
      } catch (err) {
        console.error(`Error loading resource directory ${dirPath}:`, err);
      }
    }

    return resources;
  }

  /**
   * Load tools from JavaScript/TypeScript files and shell scripts
   */
  async loadTools(toolsDir: string): Promise<ToolConfig[]> {
    const tools: ToolConfig[] = [];

    try {
      await fs.access(toolsDir);
    } catch (err) {
      console.warn(`Tools directory not found: ${toolsDir}`);
      return tools;
    }

    // Get all JavaScript/TypeScript files and shell scripts
    const jsFiles = await this.getAllFilesRecursively(toolsDir, ['.js', '.ts']);
    const shellFiles = await this.getAllFilesRecursively(toolsDir, ['.sh']);

    // Process JavaScript/TypeScript tools
    for (const file of jsFiles) {
      try {
        // We'll need to import the tool dynamically
        const relativePath = path.relative(this.configDir, file);
        const modulePath = path.resolve(file);

        // Dynamic import
        const module = await import(modulePath);
        const tool = module.default || module.tool || module;

        if (!tool || typeof tool !== 'object') {
          console.warn(`Tool file ${file} does not export a valid tool object`);
          continue;
        }

        // Check for required properties
        if (!tool.name || !tool.handler) {
          console.warn(
            `Tool file ${file} is missing required properties (name, handler)`,
          );
          continue;
        }

        // Handle both old 'parameters' format and new 'inputSchema' format
        let parameters: Record<string, z.ZodTypeAny> = {};
        
        if (tool.inputSchema) {
          // New MCP format with inputSchema
          parameters = this.convertJsonSchemaToZod(tool.inputSchema);
        } else if (tool.parameters) {
          // Legacy format with parameters
          if (!(tool.parameters instanceof z.ZodType)) {
            parameters = this.convertToZodSchema(tool.parameters);
          } else {
            parameters = tool.parameters;
          }
        } else {
          console.warn(
            `Tool file ${file} is missing inputSchema or parameters`,
          );
          continue;
        }

        tools.push({
          id: tool.name,
          path: relativePath,
          description: tool.description || `Tool from ${relativePath}`,
          parameters,
          inputSchema: tool.inputSchema, // Store original inputSchema if present
          handler: tool.handler,
        });
      } catch (err) {
        console.error(`Error loading tool file ${file}:`, err);
      }
    }

    // Process shell script tools
    for (const file of shellFiles) {
      try {
        // Make script executable
        await fs.chmod(file, 0o755);

        const relativePath = path.relative(this.configDir, file);
        const fileName = path.basename(file, '.sh');

        // Get metadata by executing the script with --mcp-metadata flag
        let description = `Tool from ${relativePath}`;
        let parameters: Record<string, z.ZodTypeAny> = {};

        let originalInputSchema: any = null;
        
        try {
          const { stdout } = await execFileAsync(file, ['--mcp-metadata']);
          const metadata = JSON.parse(stdout);

          if (metadata.description) {
            description = metadata.description;
          }

          if (metadata.parameters) {
            parameters = this.convertToZodSchema(metadata.parameters);
            
            // Also store original inputSchema format for proper type preservation
            originalInputSchema = this.convertParametersToInputSchema(metadata.parameters);
          }
        } catch (err) {
          console.warn(`Could not get metadata from script ${file}, using defaults`);
        }

        // Create a handler that executes the script
        const handler = async (args: Record<string, any>) => {
          try {
            // Convert arguments to command line args
            const cmdArgs = ['--mcp-execute', JSON.stringify(args)];
            const { stdout } = await execFileAsync(file, cmdArgs);

            try {
              // Try to parse the output as JSON
              return JSON.parse(stdout);
            } catch {
              // If not valid JSON, return as text
              return stdout;
            }
          } catch (err) {
            throw new Error(
              `Script execution failed: ${err instanceof Error ? err.message : String(err)}`,
            );
          }
        };

        tools.push({
          id: fileName,
          path: relativePath,
          description,
          parameters,
          inputSchema: originalInputSchema, // Store original inputSchema for type preservation
          handler,
          isScript: true,
          scriptPath: file,
        });
      } catch (err) {
        console.error(`Error loading shell script ${file}:`, err);
      }
    }

    return tools;
  }

  /**
   * Recursively get all files with specified extensions
   */
  private async getAllFilesRecursively(
    dir: string,
    extensions: string[] | null = null,
    excludeFiles: string[] = [],
  ): Promise<string[]> {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    const files = await Promise.all(
      entries.map(async entry => {
        const fullPath = path.join(dir, entry.name);

        // Skip excluded files
        if (excludeFiles.includes(entry.name)) {
          return [];
        }

        if (entry.isDirectory()) {
          return await this.getAllFilesRecursively(fullPath, extensions, excludeFiles);
        } else if (!extensions || extensions.some(ext => entry.name.endsWith(ext))) {
          return [fullPath];
        }

        return [];
      }),
    );

    return files.flat();
  }

  /**
   * Convert parameter definitions to JSON Schema format preserving types
   */
  private convertParametersToInputSchema(parameters: Record<string, any>): any {
    const properties: Record<string, any> = {};
    const required: string[] = [];

    for (const [key, def] of Object.entries(parameters)) {
      if (typeof def === 'object' && def !== null) {
        const propertySchema: any = {
          type: def.type || 'string',
          description: def.description || `Parameter: ${key}`
        };

        // Include enum values if present
        if (def.enum) {
          propertySchema.enum = def.enum;
        }

        properties[key] = propertySchema;

        // Add to required if not explicitly optional
        if (def.required !== false) {
          required.push(key);
        }
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
   * Convert JSON Schema to Zod schema
   */
  private convertJsonSchemaToZod(jsonSchema: any): Record<string, z.ZodTypeAny> {
    const zodSchemas: Record<string, z.ZodTypeAny> = {};

    if (!jsonSchema.properties) {
      return zodSchemas;
    }

    const required = jsonSchema.required || [];

    for (const [key, schemaDef] of Object.entries(jsonSchema.properties)) {
      const def = schemaDef as any;
      let schema: z.ZodTypeAny;

      try {
        switch (def.type) {
          case 'string':
            schema = z.string();
            if (def.enum) {
              schema = z.enum(def.enum);
            }
            break;
          case 'number':
            schema = z.number();
            break;
          case 'integer':
            schema = z.number().int();
            break;
          case 'boolean':
            schema = z.boolean();
            break;
          case 'array':
            schema = z.array(z.any());
            break;
          case 'object':
            schema = z.record(z.unknown());
            break;
          default:
            schema = z.any();
        }

        // Handle optional fields
        if (!required.includes(key)) {
          schema = schema.optional();
        }

        zodSchemas[key] = schema;
      } catch (err) {
        console.warn(`Error converting JSON schema property ${key} to Zod:`, err);
        zodSchemas[key] = z.any().optional();
      }
    }

    return zodSchemas;
  }

  /**
   * Determine content type from file extension
   */
  private getContentType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();

    const contentTypes: Record<string, string> = {
      '.md': 'text/markdown',
      '.txt': 'text/plain',
      '.html': 'text/html',
      '.htm': 'text/html',
      '.json': 'application/json',
      '.js': 'application/javascript',
      '.ts': 'application/typescript',
      '.css': 'text/css',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.pdf': 'application/pdf',
      '.yaml': 'application/yaml',
      '.yml': 'application/yaml',
    };

    return contentTypes[ext] || 'application/octet-stream';
  }
}
