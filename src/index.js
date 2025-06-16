const { ShelMcpServer } = require('./server.js');
const path = require('path');

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
      console.log('Continuing with minimal default configuration...');

      // For now, we'll just log the error and exit
      // The server needs proper configuration to work
      process.exit(1);
    }

    // Connect to stdin/stdout transport
    await server.connect();
    console.log('Server started and connected to transport');
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nReceived SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\nReceived SIGTERM, shutting down gracefully...');
  process.exit(0);
});

// Start the server
startServer();