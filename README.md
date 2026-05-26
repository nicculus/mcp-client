# mcp-client

A TypeScript client library and CLI for connecting to a serverless MCP server.

Companion to [mcp-infra](https://github.com/nicculus/mcp-infra), which handles the server side.

## Installation

```sh
npm install mcp-client
```

## CLI

Set your credentials as environment variables, then use the `mcp-client` command:

```sh
export MCP_ENDPOINT=https://YOUR_ENDPOINT/mcp
export MCP_API_KEY=YOUR_API_KEY
```

### List available tools

```sh
mcp-client tools list
```

### Call a tool

```sh
mcp-client tools call <name> --args '{"key": "value"}'
```

Both commands accept `--json` for machine-readable output:

```sh
mcp-client tools list --json
mcp-client tools call <name> --args '{"key": "value"}' --json
```

## SDK

```ts
import { MCPClient } from "mcp-client";

const client = new MCPClient({
  endpoint: "https://YOUR_ENDPOINT/mcp",
  apiKey: "YOUR_API_KEY",
});

// List available tools
const tools = await client.listTools();
console.log(tools.map((t) => t.name));

// Call a tool
const result = await client.callTool({
  name: "get_repo_summary",
  arguments: { repo_url: "anthropics/anthropic-sdk-python" },
});
console.log(result.content);
```

Each method opens a fresh connection, executes, and closes — no persistent connection to manage.

## Requirements

- Node.js 18+
- An MCP server endpoint and API key (see [mcp-infra](https://github.com/nicculus/mcp-infra))

## License

MIT
