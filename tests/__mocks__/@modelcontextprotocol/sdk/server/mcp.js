// Mock for MCP SDK Server
const mockPrompt = jest.fn();
const mockResource = jest.fn();
const mockTool = jest.fn();
const mockConnect = jest.fn().mockResolvedValue(undefined);
const mockDisconnect = jest.fn().mockResolvedValue(undefined);

class McpServer {
  constructor(options) {
    this.name = options.name;
    this.version = options.version;
    this.prompt = mockPrompt;
    this.resource = mockResource;
    this.tool = mockTool;
    this.connect = mockConnect;
    this.disconnect = mockDisconnect;
  }
}

class ResourceTemplate {
  constructor(template, options) {
    this.template = template;
    this.options = options;
  }
}

module.exports = {
  McpServer,
  ResourceTemplate,
  _mocks: {
    prompt: mockPrompt,
    resource: mockResource,
    tool: mockTool,
    connect: mockConnect,
    disconnect: mockDisconnect,
    reset: () => {
      mockPrompt.mockClear();
      mockResource.mockClear();
      mockTool.mockClear();
      mockConnect.mockClear();
      mockDisconnect.mockClear();
    }
  }
};