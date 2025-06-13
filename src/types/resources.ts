// import { ResourceDefinition } from '@modelcontextprotocol/sdk';

// Define resource content types
export type TextContent = string;
export type JsonContent = Record<string, any>;
export type BinaryContent = Buffer;

// Example resource types
export interface InfoResourceContent {
  name: string;
  version: string;
  description: string;
}

export interface DocResourceContent {
  content: string;
  title: string;
  lastUpdated: string;
}

// Example resource registry
export interface ResourceRegistry {
  info: any;
  'docs/overview': any;
  'docs/api': any;
  // Add more resources as they are implemented
}

// Export resource URIs for type safety when registering
export const RESOURCE_URIS = {
  INFO: 'info',
  DOCS_OVERVIEW: 'docs/overview',
  DOCS_API: 'docs/api',
  // Add more resource URIs as they are implemented
} as const;

export type ResourceUri = keyof typeof RESOURCE_URIS;
