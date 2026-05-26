import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import type { Tool } from "@modelcontextprotocol/sdk/types.js";

export interface MCPClientConfig {
  endpoint: string;
  apiKey: string;
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

  private createTransport(): StreamableHTTPClientTransport {
    const url = new URL(this.config.endpoint);
    return new StreamableHTTPClientTransport(url, {
      requestInit: {
        headers: {
          "x-api-key": this.config.apiKey,
        },
      },
    });
  }

  private async withClient<T>(fn: (client: Client) => Promise<T>): Promise<T> {
    const client = new Client({ name: "mcp-client", version: "0.1.0" });
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
