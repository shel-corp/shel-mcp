import { logger } from '../../../src/utils/logger';
import { mockEnv, mockConsole } from '../../mocks';

describe('Logger', () => {
  // Mock console methods
  mockConsole();
  
  describe('with DEBUG log level', () => {
    mockEnv({ LOG_LEVEL: 'debug' });
    
    it('should log debug messages', () => {
      logger.debug('Test debug message');
      expect(console.debug).toHaveBeenCalledWith('[DEBUG] Test debug message');
    });
    
    it('should log info messages', () => {
      logger.info('Test info message');
      expect(console.info).toHaveBeenCalledWith('[INFO] Test info message');
    });
    
    it('should log warn messages', () => {
      logger.warn('Test warn message');
      expect(console.warn).toHaveBeenCalledWith('[WARN] Test warn message');
    });
    
    it('should log error messages', () => {
      logger.error('Test error message');
      expect(console.error).toHaveBeenCalledWith('[ERROR] Test error message');
    });
  });
  
  describe('with INFO log level', () => {
    mockEnv({ LOG_LEVEL: 'info' });
    
    it('should not log debug messages', () => {
      logger.debug('Test debug message');
      expect(console.debug).not.toHaveBeenCalled();
    });
    
    it('should log info messages', () => {
      logger.info('Test info message');
      expect(console.info).toHaveBeenCalledWith('[INFO] Test info message');
    });
    
    it('should log warn messages', () => {
      logger.warn('Test warn message');
      expect(console.warn).toHaveBeenCalledWith('[WARN] Test warn message');
    });
    
    it('should log error messages', () => {
      logger.error('Test error message');
      expect(console.error).toHaveBeenCalledWith('[ERROR] Test error message');
    });
  });
  
  describe('with WARN log level', () => {
    mockEnv({ LOG_LEVEL: 'warn' });
    
    it('should not log debug messages', () => {
      logger.debug('Test debug message');
      expect(console.debug).not.toHaveBeenCalled();
    });
    
    it('should not log info messages', () => {
      logger.info('Test info message');
      expect(console.info).not.toHaveBeenCalled();
    });
    
    it('should log warn messages', () => {
      logger.warn('Test warn message');
      expect(console.warn).toHaveBeenCalledWith('[WARN] Test warn message');
    });
    
    it('should log error messages', () => {
      logger.error('Test error message');
      expect(console.error).toHaveBeenCalledWith('[ERROR] Test error message');
    });
  });
  
  describe('with ERROR log level', () => {
    mockEnv({ LOG_LEVEL: 'error' });
    
    it('should not log debug messages', () => {
      logger.debug('Test debug message');
      expect(console.debug).not.toHaveBeenCalled();
    });
    
    it('should not log info messages', () => {
      logger.info('Test info message');
      expect(console.info).not.toHaveBeenCalled();
    });
    
    it('should not log warn messages', () => {
      logger.warn('Test warn message');
      expect(console.warn).not.toHaveBeenCalled();
    });
    
    it('should log error messages', () => {
      logger.error('Test error message');
      expect(console.error).toHaveBeenCalledWith('[ERROR] Test error message');
    });
  });
  
  describe('with invalid log level', () => {
    mockEnv({ LOG_LEVEL: 'invalid' });
    
    it('should default to INFO and not log debug messages', () => {
      logger.debug('Test debug message');
      expect(console.debug).not.toHaveBeenCalled();
    });
    
    it('should default to INFO and log info messages', () => {
      logger.info('Test info message');
      expect(console.info).toHaveBeenCalledWith('[INFO] Test info message');
    });
  });
});