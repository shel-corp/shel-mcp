import { calculatorTool } from '../../../src/tools/calculator';
import { CalculatorToolInput } from '../../../src/types/tools';

describe('Calculator Tool', () => {
  it('should add two numbers correctly', async () => {
    const input: CalculatorToolInput = {
      operation: 'add',
      a: 5,
      b: 3,
    };
    
    const result = await calculatorTool.handler(input);
    expect(result).toBe(8);
  });
  
  it('should subtract two numbers correctly', async () => {
    const input: CalculatorToolInput = {
      operation: 'subtract',
      a: 10,
      b: 4,
    };
    
    const result = await calculatorTool.handler(input);
    expect(result).toBe(6);
  });
  
  it('should multiply two numbers correctly', async () => {
    const input: CalculatorToolInput = {
      operation: 'multiply',
      a: 7,
      b: 6,
    };
    
    const result = await calculatorTool.handler(input);
    expect(result).toBe(42);
  });
  
  it('should divide two numbers correctly', async () => {
    const input: CalculatorToolInput = {
      operation: 'divide',
      a: 20,
      b: 5,
    };
    
    const result = await calculatorTool.handler(input);
    expect(result).toBe(4);
  });
  
  it('should throw error on division by zero', async () => {
    const input: CalculatorToolInput = {
      operation: 'divide',
      a: 10,
      b: 0,
    };
    
    await expect(calculatorTool.handler(input)).rejects.toThrow('Division by zero is not allowed');
  });
  
  it('should throw error for unsupported operation', async () => {
    const input = {
      operation: 'power',
      a: 2,
      b: 3,
    } as unknown as CalculatorToolInput;
    
    await expect(calculatorTool.handler(input)).rejects.toThrow('Unsupported operation');
  });
});