# Testing the Filesystem MCP Server with Claude

This document demonstrates how to use the filesystem-server MCP with Claude.

## Prerequisites

1. The filesystem-server MCP is installed and configured in the Claude desktop app or VSCode extension.
2. The server is allowed to access the directories you want to work with.

## Test Commands

Here are some example commands you can ask Claude to perform using the filesystem-server MCP:

### List a Directory

```
Please use the filesystem-server MCP to list the contents of my Desktop directory.
```

### Read a File

```
Please use the filesystem-server MCP to read the content of [file path].
```

### Write a File

```
Please use the filesystem-server MCP to create a new file at [path] with the following content:
[content]
```

### Create a Directory

```
Please use the filesystem-server MCP to create a new directory at [path].
```

### Get File Information

```
Please use the filesystem-server MCP to get information about the file at [path].
```

### Search for Files

```
Please use the filesystem-server MCP to search for files matching the pattern "[pattern]" in [directory].
```

### Move a File

```
Please use the filesystem-server MCP to move the file from [source] to [destination].
```

## Example Test Sequence

Here's a complete test sequence you can try:

1. Create a test directory:
   ```
   Please use the filesystem-server MCP to create a directory at /Users/liuyong/Desktop/mcp-test.
   ```

2. Create a test file:
   ```
   Please use the filesystem-server MCP to create a file at /Users/liuyong/Desktop/mcp-test/hello.txt with the content "Hello, MCP!".
   ```

3. List the directory:
   ```
   Please use the filesystem-server MCP to list the contents of /Users/liuyong/Desktop/mcp-test.
   ```

4. Read the file:
   ```
   Please use the filesystem-server MCP to read the file at /Users/liuyong/Desktop/mcp-test/hello.txt.
   ```

5. Get file information:
   ```
   Please use the filesystem-server MCP to get information about the file at /Users/liuyong/Desktop/mcp-test/hello.txt.
   ```

6. Create a subdirectory:
   ```
   Please use the filesystem-server MCP to create a directory at /Users/liuyong/Desktop/mcp-test/subdir.
   ```

7. Move the file:
   ```
   Please use the filesystem-server MCP to move the file from /Users/liuyong/Desktop/mcp-test/hello.txt to /Users/liuyong/Desktop/mcp-test/subdir/hello.txt.
   ```

8. List the directories to verify the move:
   ```
   Please use the filesystem-server MCP to list the contents of /Users/liuyong/Desktop/mcp-test.
   ```
   
   ```
   Please use the filesystem-server MCP to list the contents of /Users/liuyong/Desktop/mcp-test/subdir.
   ```

9. Clean up (optional):
   ```
   Please use the filesystem-server MCP to move the file from /Users/liuyong/Desktop/mcp-test/subdir/hello.txt to /Users/liuyong/Desktop/mcp-test/hello.txt.
   ```
   
   ```
   Please use the filesystem-server MCP to list the contents of /Users/liuyong/Desktop/mcp-test.
