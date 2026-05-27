import { describe, it, expect, vi, beforeEach } from "vitest";

// vi.hoisted ensures these exist before vi.mock factories run
const { mockInstance, MockClient, MockTransport } = vi.hoisted(() => {
  const mockInstance = {
    connect: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
    listTools: vi.fn().mockResolvedValue({ tools: [] }),
    callTool: vi.fn().mockResolvedValue({ content: [] }),
  };
  return {
    mockInstance,
    MockClient: vi.fn(() => mockInstance),
    MockTransport: vi.fn(),
  };
});

vi.mock("@modelcontextprotocol/sdk/client/index.js", () => ({ Client: MockClient }));
vi.mock("@modelcontextprotocol/sdk/client/streamableHttp.js", () => ({
  StreamableHTTPClientTransport: MockTransport,
}));

import { MCPClient } from "./client.js";

beforeEach(() => {
  vi.clearAllMocks();
  mockInstance.listTools.mockResolvedValue({ tools: [] });
  mockInstance.callTool.mockResolvedValue({ content: [] });
});

describe("MCPClient", () => {
  describe("listTools", () => {
    it("returns the tools array from the SDK response", async () => {
      const tools = [{ name: "tool_a", description: "Does A" }];
      mockInstance.listTools.mockResolvedValue({ tools });

      const client = new MCPClient({ endpoint: "https://example.com/mcp" });
      expect(await client.listTools()).toEqual(tools);
    });

    it("creates transport with the correct URL", async () => {
      const client = new MCPClient({ endpoint: "https://example.com/mcp" });
      await client.listTools();

      expect(MockTransport).toHaveBeenCalledWith(
        new URL("https://example.com/mcp"),
        expect.anything()
      );
    });

    it("passes headers to the transport", async () => {
      const client = new MCPClient({
        endpoint: "https://example.com/mcp",
        headers: { "x-api-key": "secret", "X-Custom": "foo" },
      });
      await client.listTools();

      expect(MockTransport).toHaveBeenCalledWith(
        expect.any(URL),
        expect.objectContaining({
          requestInit: { headers: { "x-api-key": "secret", "X-Custom": "foo" } },
        })
      );
    });

    it("uses empty headers when none are provided", async () => {
      const client = new MCPClient({ endpoint: "https://example.com/mcp" });
      await client.listTools();

      const [, opts] = MockTransport.mock.calls[0];
      expect(opts.requestInit.headers).toEqual({});
    });

    it("connects the client to the transport", async () => {
      const client = new MCPClient({ endpoint: "https://example.com/mcp" });
      await client.listTools();

      expect(mockInstance.connect).toHaveBeenCalledOnce();
    });

    it("closes the client after the call", async () => {
      const client = new MCPClient({ endpoint: "https://example.com/mcp" });
      await client.listTools();

      expect(mockInstance.close).toHaveBeenCalledOnce();
    });

    it("closes the client even when the call throws", async () => {
      mockInstance.listTools.mockRejectedValue(new Error("network error"));

      const client = new MCPClient({ endpoint: "https://example.com/mcp" });
      await expect(client.listTools()).rejects.toThrow("network error");

      expect(mockInstance.close).toHaveBeenCalledOnce();
    });
  });

  describe("callTool", () => {
    it("returns the result from the SDK", async () => {
      const expected = { content: [{ type: "text", text: "hello" }] };
      mockInstance.callTool.mockResolvedValue(expected);

      const client = new MCPClient({ endpoint: "https://example.com/mcp" });
      expect(await client.callTool({ name: "my_tool" })).toEqual(expected);
    });

    it("passes name and arguments to the SDK", async () => {
      const client = new MCPClient({ endpoint: "https://example.com/mcp" });
      await client.callTool({
        name: "get_repo_summary",
        arguments: { repo_url: "https://github.com/owner/repo" },
      });

      expect(mockInstance.callTool).toHaveBeenCalledWith({
        name: "get_repo_summary",
        arguments: { repo_url: "https://github.com/owner/repo" },
      });
    });

    it("defaults arguments to an empty object", async () => {
      const client = new MCPClient({ endpoint: "https://example.com/mcp" });
      await client.callTool({ name: "my_tool" });

      expect(mockInstance.callTool).toHaveBeenCalledWith({
        name: "my_tool",
        arguments: {},
      });
    });

    it("closes the client after the call", async () => {
      const client = new MCPClient({ endpoint: "https://example.com/mcp" });
      await client.callTool({ name: "my_tool" });

      expect(mockInstance.close).toHaveBeenCalledOnce();
    });

    it("closes the client even when the call throws", async () => {
      mockInstance.callTool.mockRejectedValue(new Error("server error"));

      const client = new MCPClient({ endpoint: "https://example.com/mcp" });
      await expect(client.callTool({ name: "my_tool" })).rejects.toThrow("server error");

      expect(mockInstance.close).toHaveBeenCalledOnce();
    });
  });
});
