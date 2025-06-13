// import { ToolDefinition } from '@modelcontextprotocol/sdk';

// Base interface for all tool inputs
export interface BaseToolInput {
  [key: string]: any;
}

// Example tool input type - customize for each tool
export interface CalculatorToolInput extends BaseToolInput {
  operation: 'add' | 'subtract' | 'multiply' | 'divide';
  a: number;
  b: number;
}

// Example tool registry type - add all tool definitions here
export interface ToolRegistry {
  calculator: any;
  // Add more tools here as they are implemented
}

// Export a constant with tool definitions for type safety when registering
export const TOOL_NAMES = {
  CALCULATOR: 'calculator',
  // Add more tool names here as they are implemented
} as const;

export type ToolName = keyof typeof TOOL_NAMES;
