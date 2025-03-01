#!/usr/bin/env node
import { spawn } from 'child_process';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name of the current module
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Start the MCP server process
const serverProcess = spawn('node', ['build/index.js', '/Users/liuyong/Desktop'], {
  stdio: ['pipe', 'pipe', 'pipe']
});

// Buffer to store server output
let serverOutput = '';
serverProcess.stderr.on('data', (data) => {
  const output = data.toString();
  serverOutput += output;
  console.log('Server stderr:', output);
});

serverProcess.stdout.on('data', (data) => {
  console.log('Server stdout:', data.toString());
});

// Wait for server to start
setTimeout(() => {
  console.log('Server output:', serverOutput);
  
  // Send a request to list tools first
  const listToolsRequest = {
    jsonrpc: '2.0',
    id: '1',
    method: 'listTools',
    params: {}
  };
  
  console.log('Sending listTools request:', JSON.stringify(listToolsRequest, null, 2));
  serverProcess.stdin.write(JSON.stringify(listToolsRequest) + '\n');
  
  // Wait a bit and then send a request to call a tool
  setTimeout(() => {
    const callToolRequest = {
      jsonrpc: '2.0',
      id: '2',
      method: 'callTool',
      params: {
        name: 'list_directory',
        arguments: {
          path: '/Users/liuyong/Desktop/mcp-test'
        }
      }
    };
    
    console.log('Sending callTool request:', JSON.stringify(callToolRequest, null, 2));
    serverProcess.stdin.write(JSON.stringify(callToolRequest) + '\n');
  }, 1000);
  
  // Wait for response and then terminate
  setTimeout(() => {
    console.log('Test completed');
    serverProcess.kill();
  }, 3000);
}, 1000);
