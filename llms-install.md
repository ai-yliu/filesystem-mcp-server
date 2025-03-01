# Installing the Filesystem MCP Server

This guide provides step-by-step instructions for installing and configuring the Filesystem MCP Server for Cline.

## Prerequisites

- Node.js (v16 or higher)
- npm (v7 or higher)

## Installation Steps

1. **Clone the repository**

   ```bash
   git clone https://github.com/ai-yliu/filesystem-mcp-server.git
   cd filesystem-mcp-server
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Build the project**

   ```bash
   npm run build
   ```

4. **Test the server (optional)**

   You can test the server by running it with a directory you want to allow access to:

   ```bash
   node build/index.js /path/to/allowed/directory
   ```

   The server should start and display a message indicating it's running and which directories are allowed.

## Configuration for Cline

### VSCode Extension

To configure the server for the Cline VSCode extension:

1. Open or create the MCP settings file at:
   ```
   ~/Library/Application Support/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json
   ```
   (On Windows: `%APPDATA%\Code\User\globalStorage\saoudrizwan.claude-dev\settings\cline_mcp_settings.json`)

2. Add the following configuration to the `mcpServers` object:

   ```json
   "filesystem-server": {
     "command": "node",
     "args": [
       "/absolute/path/to/filesystem-mcp-server/build/index.js",
       "/path/to/allowed/dir1",
       "/path/to/allowed/dir2"
     ],
     "disabled": false,
     "autoApprove": []
   }
   ```

   Replace `/absolute/path/to/filesystem-mcp-server` with the actual path where you cloned the repository, and specify which directories you want to allow access to.

### Claude Desktop App

To configure the server for the Claude desktop app:

1. Open or create the configuration file at:
   ```
   ~/Library/Application Support/Claude/claude_desktop_config.json
   ```
   (On Windows: `%APPDATA%\Claude\claude_desktop_config.json`)

2. Add the following configuration to the `mcpServers` object:

   ```json
   "filesystem-server": {
     "command": "node",
     "args": [
       "/absolute/path/to/filesystem-mcp-server/build/index.js",
       "/path/to/allowed/dir1",
       "/path/to/allowed/dir2"
     ]
   }
   ```

   Replace `/absolute/path/to/filesystem-mcp-server` with the actual path where you cloned the repository, and specify which directories you want to allow access to.

## Usage Examples

Once installed, you can ask Cline to use the filesystem-server MCP to perform various operations:

1. **List a directory**:
   ```
   Please use the filesystem-server MCP to list the contents of /path/to/directory
   ```

2. **Read a file**:
   ```
   Please use the filesystem-server MCP to read the file at /path/to/file.txt
   ```

3. **Write a file**:
   ```
   Please use the filesystem-server MCP to create a file at /path/to/file.txt with the content "Hello, world!"
   ```

4. **Search for files**:
   ```
   Please use the filesystem-server MCP to search for files matching the pattern "*.json" in /path/to/directory
   ```

## Troubleshooting

If you encounter any issues:

1. Make sure the server is properly built (`npm run build`)
2. Verify that the paths in your configuration are absolute paths
3. Ensure the directories you're trying to access are included in the allowed directories
4. Check that Node.js is properly installed and in your PATH

## Security Considerations

This MCP server only allows operations within the directories specified in the configuration. Be careful about which directories you allow access to, as the server will have read and write permissions to those directories.
