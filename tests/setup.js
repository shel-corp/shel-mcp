// Jest setup file
process.env.NODE_ENV = 'test';

// Increase timeout for all tests
jest.setTimeout(10000);

// Mock fs.chmod for shell script tests to avoid permission issues
jest.mock('fs/promises', () => {
  const originalFs = jest.requireActual('fs/promises');
  return {
    ...originalFs,
    chmod: jest.fn().mockResolvedValue(undefined),
  };
});

// Helper to silence console during tests
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

// Silence console output during tests by default
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  // Keep debug/info for development purposes
  debug: console.debug,
  info: console.info,
};

// Restore console after all tests
afterAll(() => {
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});

// Setup mock for MCP SDK
jest.mock('@modelcontextprotocol/sdk/server/mcp.js', () => {
  const mockPrompt = jest.fn();
  const mockResource = jest.fn();
  const mockTool = jest.fn();
  const mockConnect = jest.fn().mockResolvedValue(undefined);
  const mockDisconnect = jest.fn().mockResolvedValue(undefined);

  const McpServer = jest.fn().mockImplementation(() => ({
    prompt: mockPrompt,
    resource: mockResource,
    tool: mockTool,
    connect: mockConnect,
    disconnect: mockDisconnect
  }));

  return {
    McpServer,
    ResourceTemplate: jest.fn().mockImplementation((template) => ({
      template,
    })),
  };
});

jest.mock('@modelcontextprotocol/sdk/server/stdio.js', () => ({
  StdioServerTransport: jest.fn().mockImplementation(() => ({
    send: jest.fn().mockResolvedValue(undefined),
    receive: jest.fn().mockResolvedValue({}),
  })),
}));