#!/usr/bin/env node
import "dotenv/config";
import { Command } from "commander";
import { MCPClient } from "./client.js";

function getConfig() {
  const endpoint = process.env.MCP_ENDPOINT;
  const apiKey = process.env.MCP_API_KEY;

  if (!endpoint) {
    console.error("Error: MCP_ENDPOINT environment variable is required");
    process.exit(1);
  }
  if (!apiKey) {
    console.error("Error: MCP_API_KEY environment variable is required");
    process.exit(1);
  }

  return { endpoint, apiKey };
}

const program = new Command();

program
  .name("mcp-client")
  .description("CLI for interacting with a serverless MCP server")
  .version("0.1.0")
  .addHelpText(
    "after",
    `
Environment variables:
  MCP_ENDPOINT   Your MCP server endpoint URL (e.g. https://YOUR_ENDPOINT/mcp)
  MCP_API_KEY    Your API key`
  );

const tools = program.command("tools").description("Manage and call tools");

tools
  .command("list")
  .description("List all available tools")
  .option("--json", "Output raw JSON")
  .action(async (opts) => {
    const client = new MCPClient(getConfig());
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
  .option("--json", "Output raw JSON")
  .action(async (name: string, opts) => {
    let args: Record<string, unknown>;
    try {
      args = JSON.parse(opts.args) as Record<string, unknown>;
    } catch {
      console.error("Error: --args must be valid JSON");
      process.exit(1);
    }

    const client = new MCPClient(getConfig());
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
