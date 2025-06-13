// import { ToolDefinition } from '@modelcontextprotocol/sdk';
import { CalculatorToolInput, TOOL_NAMES } from '../types/tools';

/**
 * Calculator tool that performs basic arithmetic operations
 *
 * @example
 * // Add two numbers
 * {
 *   "operation": "add",
 *   "a": 5,
 *   "b": 3
 * }
 * // Returns: 8
 *
 * @example
 * // Divide two numbers
 * {
 *   "operation": "divide",
 *   "a": 10,
 *   "b": 2
 * }
 * // Returns: 5
 */
export const calculatorTool = {
  name: TOOL_NAMES.CALCULATOR,
  description: 'Performs basic arithmetic operations: add, subtract, multiply, or divide.',
  input: {
    type: 'object',
    properties: {
      operation: {
        type: 'string',
        enum: ['add', 'subtract', 'multiply', 'divide'],
        description: 'The arithmetic operation to perform',
      },
      a: {
        type: 'number',
        description: 'The first operand',
      },
      b: {
        type: 'number',
        description: 'The second operand',
      },
    },
    required: ['operation', 'a', 'b'],
  },
  handler: async (input: CalculatorToolInput) => {
    const { operation, a, b } = input;

    switch (operation) {
      case 'add':
        return a + b;
      case 'subtract':
        return a - b;
      case 'multiply':
        return a * b;
      case 'divide':
        if (b === 0) {
          throw new Error('Division by zero is not allowed');
        }
        return a / b;
      default:
        throw new Error(`Unsupported operation: ${operation}`);
    }
  },
};
