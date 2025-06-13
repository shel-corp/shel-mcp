/**
 * Calculator tool for performing basic arithmetic operations
 */
module.exports = {
  name: 'calculator',
  description: 'Performs basic arithmetic operations: add, subtract, multiply, or divide',
  parameters: {
    operation: {
      type: 'string',
      enum: ['add', 'subtract', 'multiply', 'divide'],
      description: 'The arithmetic operation to perform'
    },
    a: {
      type: 'number',
      description: 'The first operand'
    },
    b: {
      type: 'number',
      description: 'The second operand'
    }
  },
  handler: async function({ operation, a, b }) {
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
  }
};