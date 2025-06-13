import { McpServer } from '@modelcontextprotocol/sdk';
import { ShelMcpServer } from '../../src/server';
import { config } from '../../src/config';

// Mock the McpServer from the SDK
jest.mock('@modelcontextprotocol/sdk', () => {
  return {
    McpServer: jest.fn().mockImplementation(() => ({
      registerTool: jest.fn(),
      registerResource: jest.fn(),
      on: jest.fn(),
      listen: jest.fn().mockResolvedValue(undefined),
      close: jest.fn().mockResolvedValue(undefined),
    })),
  };
});

describe('ShelMcpServer', () => {
  let server: ShelMcpServer;
  let mockMcpServer: any;

  beforeEach(() => {
    // Clear mock calls between tests
    jest.clearAllMocks();
    
    // Create a new server instance for each test
    server = new ShelMcpServer();
    
    // Get the mocked McpServer instance
    mockMcpServer = (McpServer as jest.Mock).mock.results[0].value;
  });

  it('should initialize with the correct configuration', () => {
    expect(McpServer).toHaveBeenCalledWith({
      name: config.name,
      port: config.port,
      host: config.host,
    });
  });

  it('should register tools correctly', () => {
    expect(mockMcpServer.registerTool).toHaveBeenCalled();
    // We expect at least one tool to be registered (calculator)
    expect(mockMcpServer.registerTool).toHaveBeenCalledTimes(1);
  });

  it('should register resources correctly', () => {
    expect(mockMcpServer.registerResource).toHaveBeenCalled();
    // We expect at least three resources (info, docs/overview, docs/api)
    expect(mockMcpServer.registerResource).toHaveBeenCalledTimes(3);
  });

  it('should set up event listeners', () => {
    // We expect event listeners for various events
    expect(mockMcpServer.on).toHaveBeenCalled();
    expect(mockMcpServer.on.mock.calls.map((call: any) => call[0])).toContain('tool:invoked');
    expect(mockMcpServer.on.mock.calls.map((call: any) => call[0])).toContain('tool:succeeded');
    expect(mockMcpServer.on.mock.calls.map((call: any) => call[0])).toContain('tool:failed');
    expect(mockMcpServer.on.mock.calls.map((call: any) => call[0])).toContain('resource:accessed');
    expect(mockMcpServer.on.mock.calls.map((call: any) => call[0])).toContain('listening');
    expect(mockMcpServer.on.mock.calls.map((call: any) => call[0])).toContain('error');
  });

  it('should start the server correctly', async () => {
    await server.start();
    expect(mockMcpServer.listen).toHaveBeenCalled();
  });

  it('should stop the server correctly', async () => {
    await server.stop();
    expect(mockMcpServer.close).toHaveBeenCalled();
  });
});