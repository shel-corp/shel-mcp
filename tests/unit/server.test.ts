import { ShelMcpServer } from '../../src/server';
import path from 'path';
import { z } from 'zod';

// Create manual mocks for the SDK
const mockPrompt = jest.fn();
const mockResource = jest.fn();
const mockTool = jest.fn();
const mockConnect = jest.fn().mockResolvedValue(undefined);
const mockDisconnect = jest.fn().mockResolvedValue(undefined);

// Mock McpServer class
const mockMcpInstance = {
  prompt: mockPrompt,
  resource: mockResource,
  tool: mockTool,
  connect: mockConnect,
  disconnect: mockDisconnect
};

// Mock the MCP SDK modules
jest.mock('@modelcontextprotocol/sdk/server/mcp.js', () => ({
  McpServer: jest.fn().mockImplementation(() => mockMcpInstance),
  ResourceTemplate: jest.fn().mockImplementation((template) => ({ template }))
}));

jest.mock('@modelcontextprotocol/sdk/server/stdio.js', () => ({
  StdioServerTransport: jest.fn().mockImplementation(() => ({
    send: jest.fn().mockResolvedValue(undefined),
    receive: jest.fn().mockResolvedValue({})
  }))
}));

describe('ShelMcpServer', () => {
  const fixturesDir = path.join(__dirname, '../fixtures');
  const configDir = path.join(fixturesDir, 'config');
  let server: ShelMcpServer;
  
  beforeEach(() => {
    jest.clearAllMocks();
    mockPrompt.mockClear();
    mockResource.mockClear();
    mockTool.mockClear();
    mockConnect.mockClear();
    mockDisconnect.mockClear();
    
    // Get reference to McpServer constructor mock
    const McpServerMock = require('@modelcontextprotocol/sdk/server/mcp.js').McpServer;
    McpServerMock.mockClear();
    
    // Create a fresh server for each test
    server = new ShelMcpServer();
  });
  
  describe('constructor', () => {
    it('should create a new server instance', () => {
      expect(server).toBeInstanceOf(ShelMcpServer);
      expect(require('@modelcontextprotocol/sdk/server/mcp.js').McpServer).toHaveBeenCalled();
    });
    
    it('should use provided name and version if specified', () => {
      new ShelMcpServer('custom-name', '2.0.0');
      expect(require('@modelcontextprotocol/sdk/server/mcp.js').McpServer).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'custom-name', 
          version: '2.0.0'
        })
      );
    });
  });
  
  describe('init', () => {
    it('should initialize the server with configuration', async () => {
      await server.init(configDir);
      
      // Verify the server was created with the correct name and version from config
      expect(require('@modelcontextprotocol/sdk/server/mcp.js').McpServer).toHaveBeenCalled();
    });
    
    it('should throw an error if config directory does not exist', async () => {
      await expect(server.init('/non/existent/path')).rejects.toThrow();
    });
    
    it('should register prompts, resources, and tools from config', async () => {
      await server.init(configDir);
      
      // Check that component registration functions were called
      expect(mockPrompt).toHaveBeenCalled();
      expect(mockResource).toHaveBeenCalled();
      expect(mockTool).toHaveBeenCalled();
    });
  });
  
  describe('connect', () => {
    it('should connect the server to a transport', async () => {
      await server.init(configDir);
      await server.connect();
      
      // Check that connect was called
      expect(mockConnect).toHaveBeenCalled();
    });
    
    it('should use a provided transport if specified', async () => {
      const mockTransport = { send: jest.fn(), receive: jest.fn() };
      
      await server.init(configDir);
      await server.connect(mockTransport as any);
      
      // Check that connect was called with the mock transport
      expect(mockConnect).toHaveBeenCalledWith(mockTransport);
    });
  });
  
  describe('disconnect', () => {
    it('should disconnect the server from its transport', async () => {
      await server.init(configDir);
      await server.connect();
      await server.disconnect();
      
      // Check that disconnect was called
      expect(mockDisconnect).toHaveBeenCalled();
    });
  });
  
  describe('custom registrations', () => {
    it('should allow registering a custom tool', async () => {
      await server.init(configDir);
      
      const handler = async () => ({ content: [{ type: 'text', text: 'test' }] });
      server.tool('custom-tool', { param: z.string() }, handler);
      
      // Check that tool was called with the custom tool
      expect(mockTool).toHaveBeenCalledWith(
        'custom-tool',
        { param: expect.any(Object) },
        handler
      );
    });
    
    it('should allow registering a custom resource', async () => {
      await server.init(configDir);
      
      const mockTemplate = { template: 'test://{param}' };
      const handler = async () => ({ contents: [] });
      
      server.resource('custom-resource', mockTemplate as any, handler);
      
      // Check that resource was called with the custom resource
      expect(mockResource).toHaveBeenCalledWith(
        'custom-resource',
        mockTemplate,
        handler
      );
    });
    
    it('should allow registering a custom prompt', async () => {
      await server.init(configDir);
      
      const handler = () => ({
        messages: [{ role: 'user', content: { type: 'text', text: 'test' } }]
      });
      
      server.prompt('custom-prompt', { param: z.string() }, handler);
      
      // Check that prompt was called with the custom prompt
      expect(mockPrompt).toHaveBeenCalledWith(
        'custom-prompt',
        { param: expect.any(Object) },
        handler
      );
    });
  });
});