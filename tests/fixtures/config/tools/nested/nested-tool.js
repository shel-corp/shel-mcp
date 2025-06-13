/**
 * Nested test tool for the MCP server
 * This is a simple math utility tool in a nested directory.
 */
module.exports = {
  name: 'math-util',
  description: 'A nested tool that performs math operations',
  parameters: {
    operation: {
      type: 'string',
      enum: ['add', 'subtract', 'multiply', 'divide', 'power', 'sqrt'],
      description: 'The math operation to perform'
    },
    a: {
      type: 'number',
      description: 'The first operand'
    },
    b: {
      type: 'number',
      description: 'The second operand (not used for sqrt operation)',
      required: false
    }
  },
  handler: async function({ operation, a, b }) {
    if (typeof a !== 'number') {
      throw new Error('First operand must be a number');
    }

    switch (operation) {
      case 'add':
        if (typeof b !== 'number') throw new Error('Second operand required for addition');
        return { result: a + b };
      case 'subtract':
        if (typeof b !== 'number') throw new Error('Second operand required for subtraction');
        return { result: a - b };
      case 'multiply':
        if (typeof b !== 'number') throw new Error('Second operand required for multiplication');
        return { result: a * b };
      case 'divide':
        if (typeof b !== 'number') throw new Error('Second operand required for division');
        if (b === 0) throw new Error('Division by zero is not allowed');
        return { result: a / b };
      case 'power':
        if (typeof b !== 'number') throw new Error('Second operand required for power operation');
        return { result: Math.pow(a, b) };
      case 'sqrt':
        if (a < 0) throw new Error('Cannot calculate square root of negative number');
        return { result: Math.sqrt(a) };
      default:
        throw new Error(`Unsupported operation: ${operation}`);
    }
  }
};