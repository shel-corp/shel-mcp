// Simple mocks for testing
export const mockPrompt = jest.fn();
export const mockResource = jest.fn();
export const mockTool = jest.fn();
export const mockConnect = jest.fn();
export const mockDisconnect = jest.fn();

// Mock MCP Server
export const MockMcpServer = jest.fn().mockImplementation((options) => ({
  name: options.name,
  version: options.version,
  prompt: mockPrompt,
  resource: mockResource,
  tool: mockTool,
  connect: mockConnect,
  disconnect: mockDisconnect
}));

// Mock ResourceTemplate
export const MockResourceTemplate = jest.fn().mockImplementation((template, options) => ({
  template,
  options
}));

// Mock transport
export const MockTransport = jest.fn().mockImplementation(() => ({
  send: jest.fn(),
  receive: jest.fn()
}));

// Setup mocks before tests
export const setupMocks = () => {
  // Nothing needed here - Jest auto-hoists mocks
  return {
    MockMcpServer,
    MockResourceTemplate,
    MockTransport
  };
};

// Reset all mocks
export const resetMocks = () => {
  MockMcpServer.mockClear();
  MockResourceTemplate.mockClear();
  MockTransport.mockClear();
  mockPrompt.mockClear();
  mockResource.mockClear();
  mockTool.mockClear();
  mockConnect.mockClear();
  mockDisconnect.mockClear();
};