# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A TypeScript client library and CLI for connecting to a serverless MCP server deployed on AWS, Azure, or GCP. The companion server is [mcp-infra](https://github.com/nicculus/mcp-infra).

The package has two entrypoints:
- **Library** (`src/client.ts`) — importable `MCPClient` class for use in other TypeScript/Node projects
- **CLI** (`src/cli.ts`) — `mcp-client` binary for interactive use from the terminal

## Commands

```sh
npm install          # install dependencies
npm run build        # compile TypeScript to dist/
npm run dev          # watch mode
npm run lint         # type-check without emitting
```

After building, run the CLI directly:

```sh
node dist/cli.js tools list
node dist/cli.js tools call <name> --args '{"key":"value"}'
```

Or link it globally:

```sh
npm link
mcp-client tools list
```

## Environment variables

The CLI reads these at runtime — no config file, no flags for credentials:

| Variable | Description |
|---|---|
| `MCP_ENDPOINT` | Full URL to the MCP server (e.g. `https://YOUR_ENDPOINT/mcp`) |
| `MCP_API_KEY` | API key sent as `x-api-key` header |

## Architecture

**`src/client.ts`** — `MCPClient` wraps `@modelcontextprotocol/sdk`. Each public method (`listTools`, `callTool`) opens a fresh connection, executes, and closes. This keeps the library stateless and safe for one-shot CLI use. The transport is always Streamable HTTP (`StreamableHTTPClientTransport`) with the `x-api-key` header injected.

**`src/cli.ts`** — `commander`-based CLI. Commands are namespaced under `tools` (`tools list`, `tools call <name>`). All commands accept `--json` for machine-readable output. Config is read from environment variables via a shared `getConfig()` helper that exits early with a clear error if variables are missing.

## Conventions

- `--json` flag on every command outputs raw JSON for scripting
- Default (human) output for `tools list` is name + description; for `tools call` it prints text content directly
- Endpoint URLs use `YOUR_ENDPOINT` as placeholder in docs; `MCP_ENDPOINT` at runtime
- API key header is always `x-api-key` — matches the Lambda auth middleware in `mcp-infra`
- ESM throughout (`"type": "module"`) — imports within `src/` must use `.js` extensions
