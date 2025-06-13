/**
 * Text formatter tool
 * 
 * This tool provides various text formatting operations
 */
module.exports = {
  name: 'formatter',
  description: 'Performs various text formatting operations',
  parameters: {
    operation: {
      type: 'string',
      enum: ['uppercase', 'lowercase', 'capitalize', 'trim', 'reverse'],
      description: 'The formatting operation to perform'
    },
    text: {
      type: 'string',
      description: 'The text to format'
    }
  },
  handler: async function({ operation, text }) {
    if (!text) {
      return '';
    }

    switch (operation) {
      case 'uppercase':
        return text.toUpperCase();
      case 'lowercase':
        return text.toLowerCase();
      case 'capitalize':
        return text
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
      case 'trim':
        return text.trim();
      case 'reverse':
        return text.split('').reverse().join('');
      default:
        throw new Error(`Unsupported operation: ${operation}`);
    }
  }
};