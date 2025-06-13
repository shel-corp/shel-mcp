import { exec } from 'node:child_process';

export function executeCommand(command: string) {
  exec(command, (error, stdout, stderr) => {
    if (error) {
      return { error: error.message, stdout: '', stderr: '' };
    }
    if (stderr) {
      return { error: '', stdout: '', stderr: stderr };
    }
    return { error: '', stdout: stdout, stderr: '' };
  });
}

// Example usage:
// executeCommand('ls -la');
// executeCommand('node -v');
// executeCommand('echo Hello from Node.js CLI');
