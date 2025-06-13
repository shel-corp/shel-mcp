/**
 * Mock tool input generator
 */
export const createMockToolInput = <T>(defaultInput: T, overrides: Partial<T> = {}): T => {
  return {
    ...defaultInput,
    ...overrides,
  };
};

/**
 * Mock for process.env
 */
export const mockEnv = (envValues: Record<string, string>) => {
  const originalEnv = process.env;
  
  beforeEach(() => {
    process.env = { ...originalEnv, ...envValues };
  });
  
  afterEach(() => {
    process.env = originalEnv;
  });
};

/**
 * Mock for console logging methods
 */
export const mockConsole = () => {
  const originalConsole = {
    log: console.log,
    info: console.info,
    warn: console.warn,
    error: console.error,
    debug: console.debug,
  };
  
  beforeEach(() => {
    console.log = jest.fn();
    console.info = jest.fn();
    console.warn = jest.fn();
    console.error = jest.fn();
    console.debug = jest.fn();
  });
  
  afterEach(() => {
    console.log = originalConsole.log;
    console.info = originalConsole.info;
    console.warn = originalConsole.warn;
    console.error = originalConsole.error;
    console.debug = originalConsole.debug;
  });
  
  return {
    log: jest.spyOn(console, 'log'),
    info: jest.spyOn(console, 'info'),
    warn: jest.spyOn(console, 'warn'),
    error: jest.spyOn(console, 'error'),
    debug: jest.spyOn(console, 'debug'),
  };
};