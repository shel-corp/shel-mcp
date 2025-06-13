declare module 'js-yaml' {
  export function load(input: string, options?: any): any;
  export function loadAll(input: string, iterator: (document: any) => void, options?: any): any;
  export function dump(obj: any, options?: any): string;
  export function safeDump(obj: any, options?: any): string;
}

// MCP SDK type definitions
declare module '@modelcontextprotocol/sdk/server/mcp.js' {
  export class McpServer {
    name: string;
    version: string;

    constructor(options: { name: string; version: string });

    prompt(name: string, params: any, handler: any): any;
    resource(name: string, template: any, handler: any): any;
    tool(name: string, params: any, handler: any): any;
    connect(transport: any): Promise<void>;
    disconnect(): Promise<void>;
  }

  export class ResourceTemplate {
    constructor(template: string, options: any);
  }
}

declare module '@modelcontextprotocol/sdk/server/stdio.js' {
  export class StdioServerTransport {
    constructor();
    send(message: any): Promise<void>;
    receive(): Promise<any>;
  }
}

declare module '@modelcontextprotocol/sdk/server/base.js' {
  export class BaseTransport {
    send(message: any): Promise<void>;
    receive(): Promise<any>;
  }
}
