import path from 'path';
import { ConfigurationManager } from '../../../src/config/loader';

jest.mock('@modelcontextprotocol/sdk/server/mcp.js');
jest.mock('@modelcontextprotocol/sdk/server/stdio.js');

// Mock path.relative to avoid errors with undefined configDir
jest.mock('path', () => {
  const originalPath = jest.requireActual('path');
  return {
    ...originalPath,
    relative: jest.fn().mockImplementation((from, to) => {
      // If from is undefined (which happens in tests), use the file path directly
      if (!from) return to;
      return originalPath.relative(from, to);
    })
  };
});

describe('ConfigurationManager', () => {
  const fixturesDir = path.join(__dirname, '../../fixtures');
  const configDir = path.join(fixturesDir, 'config');
  let configManager: ConfigurationManager;

  beforeEach(() => {
    jest.clearAllMocks();
    configManager = new ConfigurationManager();
    // Set configDir for all tests
    configManager['configDir'] = configDir;
  });

  describe('loadConfig', () => {
    it('should load config from a directory', async () => {
      await configManager.loadConfig(configDir);
      
      expect(configManager.config).toBeDefined();
      expect(configManager.config.name).toBe('shel-mcp-test');
      expect(configManager.config.version).toBe('1.0.0');
      expect(configManager.config.description).toBe('Test configuration for MCP server');
      expect(configManager.config.paths).toBeDefined();
      expect(configManager.config.paths?.prompts).toBe('prompts');
      expect(configManager.config.paths?.resources).toBe('resources');
      expect(configManager.config.paths?.tools).toBe('tools');
    });

    it('should throw an error if config directory does not exist', async () => {
      await expect(configManager.loadConfig('/non/existent/path')).rejects.toThrow(
        'Config directory not found'
      );
    });

    it('should load all components when paths are specified', async () => {
      await configManager.loadConfig(configDir);
      
      // Check that prompts were loaded
      expect(configManager.prompts.length).toBeGreaterThan(0);
      
      // Check that resources were loaded
      expect(configManager.resources.length).toBeGreaterThan(0);
      
      // Check that tools were loaded
      expect(configManager.tools.length).toBeGreaterThan(0);
    });
  });

  describe('loadPrompts', () => {
    it('should load prompts from a directory', async () => {
      const promptsDir = path.join(configDir, 'prompts');
      const prompts = await configManager.loadPrompts(promptsDir);
      
      expect(prompts.length).toBeGreaterThan(0);
      
      // Check if test-prompt.md was loaded
      const testPrompt = prompts.find(p => p.id === 'test-prompt');
      expect(testPrompt).toBeDefined();
      expect(testPrompt?.parameters).toBeDefined();
      expect(Object.keys(testPrompt?.parameters || {})).toContain('name');
      expect(Object.keys(testPrompt?.parameters || {})).toContain('style');
      expect(testPrompt?.metadata).toBeDefined();
      expect(testPrompt?.metadata?.author).toBe('Test Author');
    });

    it('should load nested prompts with correct IDs', async () => {
      const promptsDir = path.join(configDir, 'prompts');
      const prompts = await configManager.loadPrompts(promptsDir);
      
      const nestedPrompt = prompts.find(p => p.id === 'nested/test-nested');
      expect(nestedPrompt).toBeDefined();
      expect(nestedPrompt?.parameters).toBeDefined();
      expect(Object.keys(nestedPrompt?.parameters || {})).toContain('topic');
      expect(Object.keys(nestedPrompt?.parameters || {})).toContain('length');
    });

    it('should handle non-existent prompts directory gracefully', async () => {
      const prompts = await configManager.loadPrompts('/non/existent/path');
      expect(prompts).toEqual([]);
    });
  });

  describe('loadResources', () => {
    it('should load resources from a directory', async () => {
      const resourcesDir = path.join(configDir, 'resources');
      const resources = await configManager.loadResources(resourcesDir);
      
      expect(resources.length).toBeGreaterThan(0);
      
      // Check if test-resource was loaded
      const testResource = resources.find(r => r.id === 'test-resource');
      expect(testResource).toBeDefined();
      expect(testResource?.description).toContain('Test Resource Collection');
      expect(testResource?.files.length).toBe(3); // Three test files in the resource
    });

    it('should extract resource files with correct content types', async () => {
      const resourcesDir = path.join(configDir, 'resources');
      const resources = await configManager.loadResources(resourcesDir);
      
      const testResource = resources.find(r => r.id === 'test-resource');
      expect(testResource).toBeDefined();
      
      if (testResource) {
        const txtFile = testResource.files.find(f => f.name === 'test-file.txt');
        const mdFile = testResource.files.find(f => f.name === 'test-file.md');
        const jsonFile = testResource.files.find(f => f.name === 'test-file.json');
        
        expect(txtFile).toBeDefined();
        expect(mdFile).toBeDefined();
        expect(jsonFile).toBeDefined();
        
        expect(txtFile?.contentType).toBe('text/plain');
        expect(mdFile?.contentType).toBe('text/markdown');
        expect(jsonFile?.contentType).toBe('application/json');
        
        // Check file content
        expect(txtFile?.content).toContain('This is a test file');
        expect(mdFile?.content).toContain('# Markdown Test File');
        expect(jsonFile?.content).toContain('"name": "Test JSON Resource"');
      }
    });

    it('should handle non-existent resources directory gracefully', async () => {
      const resources = await configManager.loadResources('/non/existent/path');
      expect(resources).toEqual([]);
    });
  });

  describe('loadTools', () => {
    it('should load JavaScript tools from a directory', async () => {
      // Set configDir in the manager for proper path resolution
      configManager['configDir'] = configDir;
      
      const toolsDir = path.join(configDir, 'tools');
      const tools = await configManager.loadTools(toolsDir);
      
      expect(tools.length).toBeGreaterThan(0);
      
      // Check if test-tool.js was loaded
      const testTool = tools.find(t => t.id === 'test-tool');
      expect(testTool).toBeDefined();
      expect(testTool?.description).toContain('A test tool that performs string operations');
      expect(testTool?.parameters).toBeDefined();
      expect(testTool?.handler).toBeInstanceOf(Function);
    });

    it('should load nested tools with correct IDs', async () => {
      // Set configDir in the manager for proper path resolution
      configManager['configDir'] = configDir;
      
      const toolsDir = path.join(configDir, 'tools');
      const tools = await configManager.loadTools(toolsDir);
      
      const nestedTool = tools.find(t => t.id === 'math-util');
      expect(nestedTool).toBeDefined();
      expect(nestedTool?.description).toContain('A nested tool that performs math operations');
      expect(Object.keys(nestedTool?.parameters || {})).toContain('operation');
      expect(Object.keys(nestedTool?.parameters || {})).toContain('a');
      expect(Object.keys(nestedTool?.parameters || {})).toContain('b');
    });

    it('should load shell script tools', async () => {
      // Set configDir in the manager for proper path resolution
      configManager['configDir'] = configDir;
      
      const toolsDir = path.join(configDir, 'tools');
      const tools = await configManager.loadTools(toolsDir);
      
      const scriptTool = tools.find(t => t.id === 'dateinfo' || t.id === 'test-script');
      expect(scriptTool).toBeDefined();
      expect(scriptTool?.isScript).toBe(true);
      expect(scriptTool?.scriptPath).toBeDefined();
    });

    it('should handle non-existent tools directory gracefully', async () => {
      const tools = await configManager.loadTools('/non/existent/path');
      expect(tools).toEqual([]);
    });
  });
});