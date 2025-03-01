#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import * as fs from 'fs-extra';
import * as path from 'path';
import { Stats } from 'fs';

// Get allowed directories from environment variables
const allowedDirectories = process.argv.slice(2);
if (allowedDirectories.length === 0) {
  console.error('Error: No allowed directories specified.');
  console.error('Usage: node build/index.js /path/to/allowed/dir1 /path/to/allowed/dir2 ...');
  process.exit(1);
}

// Resolve all allowed directories to absolute paths
const resolvedAllowedDirectories = allowedDirectories.map(dir => path.resolve(dir));

/**
 * Validates if a path is within allowed directories
 */
function isPathAllowed(filePath: string): boolean {
  const resolvedPath = path.resolve(filePath);
  return resolvedAllowedDirectories.some(allowedDir => 
    resolvedPath === allowedDir || resolvedPath.startsWith(allowedDir + path.sep)
  );
}

/**
 * Validates a path and throws an error if it's not allowed
 */
function validatePath(filePath: string): void {
  if (!isPathAllowed(filePath)) {
    throw new McpError(
      ErrorCode.InvalidRequest,
      `Access denied: ${filePath} is not within allowed directories`
    );
  }
}

/**
 * Formats file stats into a readable object
 */
function formatFileInfo(filePath: string, stats: Stats): Record<string, any> {
  return {
    path: filePath,
    size: stats.size,
    type: stats.isDirectory() ? 'directory' : 'file',
    created: stats.birthtime.toISOString(),
    modified: stats.mtime.toISOString(),
    accessed: stats.atime.toISOString(),
    permissions: {
      readable: stats.mode & fs.constants.R_OK ? true : false,
      writable: stats.mode & fs.constants.W_OK ? true : false,
      executable: stats.mode & fs.constants.X_OK ? true : false,
    }
  };
}

class FilesystemServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: 'filesystem-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    
    // Error handling
    this.server.onerror = (error) => console.error('[MCP Error]', error);
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'read_file',
          description: 'Read complete contents of a file',
          inputSchema: {
            type: 'object',
            properties: {
              path: {
                type: 'string',
                description: 'Path to the file to read',
              },
            },
            required: ['path'],
          },
        },
        {
          name: 'read_multiple_files',
          description: 'Read multiple files simultaneously',
          inputSchema: {
            type: 'object',
            properties: {
              paths: {
                type: 'array',
                items: {
                  type: 'string',
                },
                description: 'Array of file paths to read',
              },
            },
            required: ['paths'],
          },
        },
        {
          name: 'write_file',
          description: 'Create new file or overwrite existing',
          inputSchema: {
            type: 'object',
            properties: {
              path: {
                type: 'string',
                description: 'Path to the file to write',
              },
              content: {
                type: 'string',
                description: 'Content to write to the file',
              },
            },
            required: ['path', 'content'],
          },
        },
        {
          name: 'create_directory',
          description: 'Create new directory or ensure it exists',
          inputSchema: {
            type: 'object',
            properties: {
              path: {
                type: 'string',
                description: 'Path to the directory to create',
              },
            },
            required: ['path'],
          },
        },
        {
          name: 'list_directory',
          description: 'List directory contents with [FILE] or [DIR] prefixes',
          inputSchema: {
            type: 'object',
            properties: {
              path: {
                type: 'string',
                description: 'Path to the directory to list',
              },
            },
            required: ['path'],
          },
        },
        {
          name: 'move_file',
          description: 'Move or rename files and directories',
          inputSchema: {
            type: 'object',
            properties: {
              source: {
                type: 'string',
                description: 'Source path',
              },
              destination: {
                type: 'string',
                description: 'Destination path',
              },
            },
            required: ['source', 'destination'],
          },
        },
        {
          name: 'search_files',
          description: 'Recursively search for files/directories',
          inputSchema: {
            type: 'object',
            properties: {
              path: {
                type: 'string',
                description: 'Starting directory for search',
              },
              pattern: {
                type: 'string',
                description: 'Search pattern (case-insensitive)',
              },
            },
            required: ['path', 'pattern'],
          },
        },
        {
          name: 'get_file_info',
          description: 'Get detailed file/directory metadata',
          inputSchema: {
            type: 'object',
            properties: {
              path: {
                type: 'string',
                description: 'Path to the file or directory',
              },
            },
            required: ['path'],
          },
        },
        {
          name: 'list_allowed_directories',
          description: 'List all directories the server is allowed to access',
          inputSchema: {
            type: 'object',
            properties: {},
            required: [],
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        switch (request.params.name) {
          case 'read_file': {
            const { path: filePath } = request.params.arguments as { path: string };
            validatePath(filePath);
            
            const content = await fs.readFile(filePath, 'utf8');
            return {
              content: [
                {
                  type: 'text',
                  text: content,
                },
              ],
            };
          }

          case 'read_multiple_files': {
            const { paths } = request.params.arguments as { paths: string[] };
            
            const results: { path: string; content?: string; error?: string }[] = [];
            
            for (const filePath of paths) {
              try {
                validatePath(filePath);
                const content = await fs.readFile(filePath, 'utf8');
                results.push({ path: filePath, content });
              } catch (error) {
                results.push({ 
                  path: filePath, 
                  error: error instanceof Error ? error.message : String(error) 
                });
              }
            }
            
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(results, null, 2),
                },
              ],
            };
          }

          case 'write_file': {
            const { path: filePath, content } = request.params.arguments as { 
              path: string; 
              content: string 
            };
            validatePath(filePath);
            
            // Ensure parent directory exists
            await fs.ensureDir(path.dirname(filePath));
            await fs.writeFile(filePath, content, 'utf8');
            
            return {
              content: [
                {
                  type: 'text',
                  text: `File written successfully: ${filePath}`,
                },
              ],
            };
          }

          case 'create_directory': {
            const { path: dirPath } = request.params.arguments as { path: string };
            validatePath(dirPath);
            
            await fs.ensureDir(dirPath);
            
            return {
              content: [
                {
                  type: 'text',
                  text: `Directory created successfully: ${dirPath}`,
                },
              ],
            };
          }

          case 'list_directory': {
            const { path: dirPath } = request.params.arguments as { path: string };
            validatePath(dirPath);
            
            const entries = await fs.readdir(dirPath);
            const formattedEntries = await Promise.all(
              entries.map(async (entry) => {
                const entryPath = path.join(dirPath, entry);
                const stats = await fs.stat(entryPath);
                const prefix = stats.isDirectory() ? '[DIR]' : '[FILE]';
                return `${prefix} ${entry}`;
              })
            );
            
            return {
              content: [
                {
                  type: 'text',
                  text: formattedEntries.join('\n'),
                },
              ],
            };
          }

          case 'move_file': {
            const { source, destination } = request.params.arguments as { 
              source: string; 
              destination: string 
            };
            validatePath(source);
            validatePath(destination);
            
            // Check if destination exists
            const destinationExists = await fs.pathExists(destination);
            if (destinationExists) {
              throw new McpError(
                ErrorCode.InvalidRequest,
                `Destination already exists: ${destination}`
              );
            }
            
            // Ensure parent directory of destination exists
            await fs.ensureDir(path.dirname(destination));
            await fs.move(source, destination);
            
            return {
              content: [
                {
                  type: 'text',
                  text: `Successfully moved ${source} to ${destination}`,
                },
              ],
            };
          }

          case 'search_files': {
            const { path: dirPath, pattern } = request.params.arguments as { 
              path: string; 
              pattern: string 
            };
            validatePath(dirPath);
            
            const results: string[] = [];
            const patternRegex = new RegExp(pattern, 'i');
            
            async function searchDirectory(currentPath: string) {
              const entries = await fs.readdir(currentPath);
              
              for (const entry of entries) {
                const entryPath = path.join(currentPath, entry);
                const stats = await fs.stat(entryPath);
                
                if (patternRegex.test(entry)) {
                  results.push(entryPath);
                }
                
                if (stats.isDirectory()) {
                  await searchDirectory(entryPath);
                }
              }
            }
            
            await searchDirectory(dirPath);
            
            return {
              content: [
                {
                  type: 'text',
                  text: results.join('\n'),
                },
              ],
            };
          }

          case 'get_file_info': {
            const { path: filePath } = request.params.arguments as { path: string };
            validatePath(filePath);
            
            const stats = await fs.stat(filePath);
            const fileInfo = formatFileInfo(filePath, stats);
            
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(fileInfo, null, 2),
                },
              ],
            };
          }

          case 'list_allowed_directories': {
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(resolvedAllowedDirectories, null, 2),
                },
              ],
            };
          }

          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${request.params.name}`
            );
        }
      } catch (error) {
        if (error instanceof McpError) {
          throw error;
        }
        
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Filesystem MCP server running on stdio');
    console.error('Allowed directories:', resolvedAllowedDirectories);
  }
}

const server = new FilesystemServer();
server.run().catch(console.error);
