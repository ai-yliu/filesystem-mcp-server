#!/usr/bin/env node
import { spawn } from 'child_process';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name of the current module
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Create a test directory
const testDir = path.join(__dirname, 'test-dir');
const testFile = path.join(testDir, 'test-file.txt');
const testFile2 = path.join(testDir, 'test-file2.txt');
const testSubDir = path.join(testDir, 'test-subdir');

// Start the MCP server process
const serverProcess = spawn('node', ['build/index.js', __dirname], {
  stdio: ['pipe', 'pipe', 'pipe']
});

// Buffer to store server output
let serverOutput = '';
serverProcess.stderr.on('data', (data) => {
  serverOutput += data.toString();
});

// Function to send a request to the MCP server
function sendRequest(request) {
  return new Promise((resolve, reject) => {
    const requestStr = JSON.stringify(request) + '\n';
    serverProcess.stdin.write(requestStr);
    
    const responseHandler = (data) => {
      const responseStr = data.toString();
      try {
        const response = JSON.parse(responseStr);
        serverProcess.stdout.removeListener('data', responseHandler);
        resolve(response);
      } catch (error) {
        // Not a complete JSON response yet, wait for more data
      }
    };
    
    serverProcess.stdout.on('data', responseHandler);
  });
}

// Function to call an MCP tool
async function callTool(name, args) {
  console.log(`\n=== Testing ${name} ===`);
  console.log('Arguments:', JSON.stringify(args, null, 2));
  
  const request = {
    jsonrpc: '2.0',
    id: Date.now().toString(),
    method: 'mcp.callTool',
    params: {
      name,
      arguments: args
    }
  };
  
  const response = await sendRequest(request);
  console.log('Response:', JSON.stringify(response, null, 2));
  return response;
}

// Main test function
async function runTests() {
  try {
    console.log('Starting MCP server tests...');
    
    // Wait for server to start
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('Server output:', serverOutput);
    
    // Test list_allowed_directories
    await callTool('list_allowed_directories', {});
    
    // Test create_directory
    await callTool('create_directory', { path: testDir });
    
    // Test write_file
    await callTool('write_file', { 
      path: testFile, 
      content: 'This is a test file.' 
    });
    
    // Test read_file
    await callTool('read_file', { path: testFile });
    
    // Test list_directory
    await callTool('list_directory', { path: testDir });
    
    // Test get_file_info
    await callTool('get_file_info', { path: testFile });
    
    // Test create_directory (subdirectory)
    await callTool('create_directory', { path: testSubDir });
    
    // Test write_file (second file)
    await callTool('write_file', { 
      path: testFile2, 
      content: 'This is another test file.' 
    });
    
    // Test read_multiple_files
    await callTool('read_multiple_files', { 
      paths: [testFile, testFile2] 
    });
    
    // Test search_files
    await callTool('search_files', { 
      path: testDir, 
      pattern: 'test' 
    });
    
    // Test move_file
    const movedFile = path.join(testSubDir, 'moved-file.txt');
    await callTool('move_file', { 
      source: testFile2, 
      destination: movedFile 
    });
    
    // Test list_directory again to verify move
    await callTool('list_directory', { path: testDir });
    await callTool('list_directory', { path: testSubDir });
    
    console.log('\nAll tests completed successfully!');
  } catch (error) {
    console.error('Test error:', error);
  } finally {
    // Clean up
    try {
      await fs.remove(testDir);
      console.log(`\nTest directory ${testDir} removed.`);
    } catch (error) {
      console.error('Error removing test directory:', error);
    }
    
    // Kill the server process
    serverProcess.kill();
    console.log('Server process terminated.');
  }
}

// Run the tests
runTests();
