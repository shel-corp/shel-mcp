// Mock for StdioServerTransport
class StdioServerTransport {
  constructor() {
    this.send = jest.fn().mockResolvedValue(undefined);
    this.receive = jest.fn().mockResolvedValue({});
  }
}

module.exports = {
  StdioServerTransport,
};