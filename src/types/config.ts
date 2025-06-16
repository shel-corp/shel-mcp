/**
 * Types for the configuration-based system
 */

import { z } from 'zod';

/**
 * Structure of the main config file
 */
export interface ConfigFile {
  name: string;
  version: string;
  description?: string;
  paths?: ConfigPaths;
}

/**
 * Configuration paths for various components
 */
export interface ConfigPaths {
  prompts?: string;
  resources?: string;
  tools?: string;
}

/**
 * Prompt file information
 */
export interface PromptConfig {
  id: string;
  path: string;
  content: string;
  parameters: Record<string, z.ZodTypeAny>;
  metadata?: Record<string, any>;
}

/**
 * Resource information
 */
export interface ResourceConfig {
  id: string;
  path: string;
  description: string;
  files: ResourceFile[];
}

/**
 * Resource file information
 */
export interface ResourceFile {
  name: string;
  path: string;
  contentType: string;
  content: string;
}

/**
 * Tool information
 */
export interface ToolConfig {
  id: string;
  path: string;
  description: string;
  parameters: Record<string, z.ZodTypeAny>;
  inputSchema?: any; // JSON Schema for MCP format
  handler: (...args: any[]) => Promise<any>;
  isScript?: boolean; // Indicates if this is a shell script
  scriptPath?: string; // Path to the script if isScript is true
}

/**
 * Configuration loader functions
 */
export interface ConfigLoaders {
  loadConfig: (configPath: string) => Promise<ConfigFile>;
  loadPrompts: (promptsPath: string) => Promise<PromptConfig[]>;
  loadResources: (resourcesPath: string) => Promise<ResourceConfig[]>;
  loadTools: (toolsPath: string) => Promise<ToolConfig[]>;
}

/**
 * Configuration manager
 */
export interface ConfigManager {
  config: ConfigFile;
  prompts: PromptConfig[];
  resources: ResourceConfig[];
  tools: ToolConfig[];

  loadConfig: (configDir: string) => Promise<void>;
}
