import { ShelMcpServer } from '../../src/server';
import path from 'path';
import fs from 'fs/promises';
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

describe('Configuration Loading Integration Test', () => {
  const fixturesDir = path.join(__dirname, '../fixtures');
  const configDir = path.join(fixturesDir, 'config');
  
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock instances for each test
    mockPrompt.mockClear();
    mockResource.mockClear();
    mockTool.mockClear();
    mockConnect.mockClear();
    mockDisconnect.mockClear();
    
    // Get reference to McpServer constructor mock
    const McpServerMock = require('@modelcontextprotocol/sdk/server/mcp.js').McpServer;
    McpServerMock.mockClear();
  });
  
  it('should load and register all components from configuration', async () => {
    // Create a new server instance
    const server = new ShelMcpServer();
    
    // Initialize with test config directory
    await server.init(configDir);
    
    // Check that component registration functions were called
    expect(mockPrompt).toHaveBeenCalled();
    expect(mockResource).toHaveBeenCalled();
    expect(mockTool).toHaveBeenCalled();
    
    // Check that the prompt function was called with the correct IDs
    expect(mockPrompt).toHaveBeenCalledWith('test-prompt', expect.any(Object), expect.any(Function));
    expect(mockPrompt).toHaveBeenCalledWith('nested/test-nested', expect.any(Object), expect.any(Function));
    
    // Check that the resource function was called with the correct ID
    expect(mockResource).toHaveBeenCalledWith('test-resource', expect.any(Object), expect.any(Function));
    
    // Check that the tool function was called with the correct IDs
    expect(mockTool).toHaveBeenCalledWith('test-tool', expect.any(Object), expect.any(Function));
    expect(mockTool).toHaveBeenCalledWith('math-util', expect.any(Object), expect.any(Function));
    expect(mockTool).toHaveBeenCalledWith('test-script', expect.any(Object), expect.any(Function));
  });
  
  it('should correctly process prompt parameters', async () => {
    // Create a new server instance
    const server = new ShelMcpServer();
    
    // Initialize with test config directory
    await server.init(configDir);
    
    // Extract the prompt handler that was registered
    const promptHandler = mockPrompt.mock.calls.find(
      call => call[0] === 'test-prompt'
    )?.[2];
    
    expect(promptHandler).toBeDefined();
    
    if (promptHandler) {
      // Test prompt handler with parameters
      const result = promptHandler({ name: 'Test User', style: 'formal' });
      expect(result).toBeDefined();
      expect(result.messages).toHaveLength(1);
      expect(result.messages[0].content.text).toContain('Dear Test User');
      
      // Test with different style
      const casualResult = promptHandler({ name: 'Test User', style: 'casual' });
      expect(casualResult.messages[0].content.text).toContain('Hey Test User');
    }
  });
  
  it('should correctly process resource requests', async () => {
    // Create a new server instance
    const server = new ShelMcpServer();
    
    // Initialize with test config directory
    await server.init(configDir);
    
    // Extract the resource handler that was registered
    const resourceHandler = mockResource.mock.calls.find(
      call => call[0] === 'test-resource'
    )?.[2];
    
    expect(resourceHandler).toBeDefined();
    
    if (resourceHandler) {
      // Mock URL for resource
      const mockUrl = new URL('test-resource://test-file.txt');
      
      // Test resource handler for a specific file
      const result = await resourceHandler(mockUrl, { path: 'test-file.txt' });
      expect(result).toBeDefined();
      expect(result.contents).toHaveLength(1);
      expect(result.contents[0].text).toContain('This is a test file');
      
      // Test listing all files
      const listResult = await resourceHandler(mockUrl, { path: '' });
      expect(listResult).toBeDefined();
      expect(listResult.contents.length).toBeGreaterThan(0);
    }
  });
  
  it('should correctly execute tool operations', async () => {
    // Create a new server instance
    const server = new ShelMcpServer();
    
    // Initialize with test config directory
    await server.init(configDir);
    
    // Extract the tool handlers that were registered
    const testToolHandler = mockTool.mock.calls.find(
      call => call[0] === 'test-tool'
    )?.[2];
    
    const mathToolHandler = mockTool.mock.calls.find(
      call => call[0] === 'math-util'
    )?.[2];
    
    expect(testToolHandler).toBeDefined();
    expect(mathToolHandler).toBeDefined();
    
    if (testToolHandler && mathToolHandler) {
      // Test tool handler
      const result = await testToolHandler({ operation: 'reverse', input: 'hello' });
      expect(result).toBeDefined();
      expect(result.content[0].text).toBe('olleh');
      
      // Test math tool
      const mathResult = await mathToolHandler({ operation: 'add', a: 2, b: 3 });
      expect(mathResult).toBeDefined();
      expect(mathResult.content[0].text).toContain('5');
    }
  });
  
  it('should start with empty config and add components programmatically', async () => {
    // Create a temporary config directory
    const tempConfigDir = path.join(__dirname, '../fixtures/temp-config');
    try {
      await fs.mkdir(tempConfigDir, { recursive: true });
      await fs.writeFile(
        path.join(tempConfigDir, 'mcp-config.yaml'), 
        'name: empty-config\nversion: 1.0.0\n'
      );
      
      // Create a new server instance
      const server = new ShelMcpServer();
      
      // Initialize with minimal config
      await server.init(tempConfigDir);
      
      // Add components programmatically
      server.tool('custom-tool', 
        { text: z.string() }, 
        async ({ text }) => ({ content: [{ type: 'text', text: `Processed: ${text}` }] })
      );
      
      // Verify the tool was registered
      expect(mockTool).toHaveBeenCalledWith(
        'custom-tool',
        expect.any(Object),
        expect.any(Function)
      );
      
      // Extract and test the handler
      const customToolHandler = mockTool.mock.calls.find(
        call => call[0] === 'custom-tool'
      )?.[2];
      
      expect(customToolHandler).toBeDefined();
      
      if (customToolHandler) {
        const result = await customToolHandler({ text: 'test' });
        expect(result.content[0].text).toBe('Processed: test');
      }
    } finally {
      // Clean up temporary directory
      try {
        await fs.rm(tempConfigDir, { recursive: true, force: true });
      } catch (err) {
        console.error('Failed to clean up temporary directory:', err);
      }
    }
  });
});