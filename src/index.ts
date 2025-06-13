import { ShelMcpServer } from './server';
import path from 'path';
import { z } from 'zod';

// Process command-line arguments
const args = process.argv.slice(2);
let configDir = path.join(process.cwd(), 'config');

// Parse command line arguments
for (let i = 0; i < args.length; i++) {
  if ((args[i] === '--config' || args[i] === '-c') && i + 1 < args.length) {
    configDir = args[i + 1];
    i++;
  }
}

// Create and initialize the server
const startServer = async () => {
  try {
    console.log(`Starting shel-mcp server with configuration from: ${configDir}`);

    // Create the server
    const server = new ShelMcpServer();

    // Load configuration
    try {
      await server.init(configDir);
    } catch (err) {
      console.error('Failed to load configuration:', err);
      console.log('Continuing with default configuration...');

      // Add some default tools and resources if config loading failed
      server.tool('add', { a: z.number(), b: z.number() }, async ({ a, b }) => ({
        content: [{ type: 'text', text: String(a + b) }],
      }));

      server.prompt('review-code', { code: z.string() }, ({ code }) => ({
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Please review this code:\n\n${code}`,
            },
          },
        ],
      }));
    }

    // Connect to stdin/stdout transport
    await server.connect();
    console.log('Server started and connected to transport');
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

// Start the server
startServer();
