# @nicculus/mcp-client

A TypeScript client library and CLI for connecting to a serverless MCP server over Streamable HTTP.

Companion to [mcp-infra](https://github.com/nicculus/mcp-infra), which deploys the server to AWS, Azure, or GCP.

## Installation

```sh
npm install @nicculus/mcp-client
```

## CLI

```sh
export MCP_ENDPOINT=https://YOUR_ENDPOINT/mcp
export MCP_API_KEY=YOUR_API_KEY

# List available tools
@nicculus/mcp-client tools list

# Call a tool
@nicculus/mcp-client tools call <name> --args '{"key": "value"}'

# Machine-readable output
@nicculus/mcp-client tools list --json
@nicculus/mcp-client tools call <name> --args '{"key": "value"}' --json
```

Credentials can also be placed in a `.env` file in the working directory.

## SDK

```ts
import { MCPClient } from "@nicculus/mcp-client";

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

Each method opens a fresh connection, executes, and closes — no persistent state to manage.

## Requirements

- Node.js 18+
- An MCP server endpoint and API key (see [mcp-infra](https://github.com/nicculus/mcp-infra))

## License

MIT
