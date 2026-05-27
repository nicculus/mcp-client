#!/usr/bin/env node
import { createRequire } from "module";
import "dotenv/config";
import { Command } from "commander";
import { MCPClient } from "./client.js";

const { version } = createRequire(import.meta.url)("../package.json") as {
  version: string;
};

function getEndpoint(): string {
  const endpoint = process.env.MCP_ENDPOINT;
  if (!endpoint) {
    console.error("Error: MCP_ENDPOINT environment variable is required");
    process.exit(1);
  }
  return endpoint;
}

function parseHeaders(headerFlags: string[]): Record<string, string> {
  const headers: Record<string, string> = {};

  const envHeaders = process.env.MCP_HEADERS;
  if (envHeaders) {
    for (const pair of envHeaders.split(",")) {
      const idx = pair.indexOf(":");
      if (idx === -1) {
        console.error(`Invalid MCP_HEADERS format: ${pair} (expected key:value)`);
        process.exit(1);
      }
      headers[pair.slice(0, idx).trim()] = pair.slice(idx + 1).trim();
    }
  }

  for (const h of headerFlags) {
    const idx = h.indexOf(":");
    if (idx === -1) {
      console.error(`Invalid header format: ${h} (expected key:value)`);
      process.exit(1);
    }
    headers[h.slice(0, idx).trim()] = h.slice(idx + 1).trim();
  }

  return headers;
}

function buildClient(headerFlags: string[]): MCPClient {
  const endpoint = getEndpoint();
  const headers = parseHeaders(headerFlags);
  return new MCPClient({
    endpoint,
    headers: Object.keys(headers).length > 0 ? headers : undefined,
  });
}

const program = new Command();

program
  .name("mcp-client")
  .description("CLI for interacting with a serverless MCP server")
  .version(version)
  .addHelpText(
    "after",
    `
Environment variables:
  MCP_ENDPOINT   Your MCP server endpoint URL (e.g. https://YOUR_ENDPOINT/mcp)
  MCP_HEADERS    Headers as comma-separated key:value pairs (e.g. "x-api-key:YOUR_KEY")`
  );

const tools = program.command("tools").description("Manage and call tools");

tools
  .command("list")
  .description("List all available tools")
  .option("--header <key:value>", "custom header (repeatable)", (val: string, acc: string[]) => { acc.push(val); return acc; }, [] as string[])
  .option("--json", "Output raw JSON")
  .action(async (opts) => {
    const client = buildClient(opts.header as string[]);
    const result = await client.listTools();

    if (opts.json) {
      console.log(JSON.stringify(result, null, 2));
      return;
    }

    if (result.length === 0) {
      console.log("No tools available.");
      return;
    }

    for (const tool of result) {
      console.log(`${tool.name}`);
      if (tool.description) {
        console.log(`  ${tool.description}`);
      }
    }
  });

tools
  .command("call <name>")
  .description("Call a tool by name")
  .option("-a, --args <json>", "Tool arguments as a JSON string", "{}")
  .option("--header <key:value>", "custom header (repeatable)", (val: string, acc: string[]) => { acc.push(val); return acc; }, [] as string[])
  .option("--json", "Output raw JSON")
  .action(async (name: string, opts) => {
    let args: Record<string, unknown>;
    try {
      args = JSON.parse(opts.args) as Record<string, unknown>;
    } catch {
      console.error("Error: --args must be valid JSON");
      process.exit(1);
    }

    const client = buildClient(opts.header as string[]);
    const result = await client.callTool({ name, arguments: args });

    if (opts.json) {
      console.log(JSON.stringify(result, null, 2));
      return;
    }

    const content = Array.isArray(result.content) ? result.content : [];
    for (const item of content as Array<{ type: string; text?: string }>) {
      if (item.type === "text") {
        console.log(item.text);
      } else {
        console.log(JSON.stringify(item, null, 2));
      }
    }
  });

program.parseAsync(process.argv).catch((err: unknown) => {
  console.error("Error:", err instanceof Error ? err.message : err);
  process.exit(1);
});
