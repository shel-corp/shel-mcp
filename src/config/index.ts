import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export interface ServerConfig {
  name: string;
  port: number;
  host: string;
  logLevel: string;
}

export const config: ServerConfig = {
  name: process.env.SERVER_NAME || 'shel-mcp',
  port: parseInt(process.env.SERVER_PORT || '3000', 10),
  host: process.env.SERVER_HOST || 'localhost',
  logLevel: process.env.LOG_LEVEL || 'info',
};

export default config;
