import { createRequire } from "module";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import type { Tool } from "@modelcontextprotocol/sdk/types.js";

const { version } = createRequire(import.meta.url)("../package.json") as {
  version: string;
};

export interface MCPClientConfig {
  endpoint: string;
  /** Convenience shorthand — sets the x-api-key header.
      If both headers and apiKey are provided, headers wins on conflict. */
  apiKey?: string;
  headers?: Record<string, string>;
}

export interface ToolCallOptions {
  name: string;
  arguments?: Record<string, unknown>;
}

export class MCPClient {
  private config: MCPClientConfig;

  constructor(config: MCPClientConfig) {
    this.config = config;
  }

  private resolveHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};
    if (this.config.apiKey) {
      headers["x-api-key"] = this.config.apiKey;
    }
    if (this.config.headers) {
      Object.assign(headers, this.config.headers);
    }
    return headers;
  }

  private createTransport(): StreamableHTTPClientTransport {
    const url = new URL(this.config.endpoint);
    return new StreamableHTTPClientTransport(url, {
      requestInit: {
        headers: this.resolveHeaders(),
      },
    });
  }

  private async withClient<T>(fn: (client: Client) => Promise<T>): Promise<T> {
    const client = new Client({ name: "mcp-client", version });
    const transport = this.createTransport();
    await client.connect(transport);
    try {
      return await fn(client);
    } finally {
      await client.close();
    }
  }

  async listTools(): Promise<Tool[]> {
    return this.withClient(async (client) => {
      const result = await client.listTools();
      return result.tools;
    });
  }

  async callTool(options: ToolCallOptions): Promise<Awaited<ReturnType<Client["callTool"]>>> {
    return this.withClient(async (client) => {
      return client.callTool({
        name: options.name,
        arguments: options.arguments ?? {},
      });
    });
  }
}
