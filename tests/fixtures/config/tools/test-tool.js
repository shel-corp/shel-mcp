/**
 * Test tool for the MCP server
 * This is a simple test tool that performs various string operations.
 */
module.exports = {
  name: 'test-tool',
  description: 'A test tool that performs string operations',
  parameters: {
    operation: {
      type: 'string',
      enum: ['reverse', 'uppercase', 'lowercase', 'length'],
      description: 'The operation to perform on the input string'
    },
    input: {
      type: 'string',
      description: 'The input string to operate on'
    }
  },
  handler: async function({ operation, input }) {
    if (!input) {
      throw new Error('Input string is required');
    }

    switch (operation) {
      case 'reverse':
        return input.split('').reverse().join('');
      case 'uppercase':
        return input.toUpperCase();
      case 'lowercase':
        return input.toLowerCase();
      case 'length':
        return { length: input.length };
      default:
        throw new Error(`Unsupported operation: ${operation}`);
    }
  }
};