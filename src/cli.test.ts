import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { parseHeaders } from "./cli.js";

describe("parseHeaders", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.MCP_HEADERS;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("returns empty object when no env or flags provided", () => {
    expect(parseHeaders([])).toEqual({});
  });

  it("parses a single MCP_HEADERS entry", () => {
    process.env.MCP_HEADERS = "x-api-key:secret";
    expect(parseHeaders([])).toEqual({ "x-api-key": "secret" });
  });

  it("parses multiple comma-separated MCP_HEADERS entries", () => {
    process.env.MCP_HEADERS = "x-api-key:secret,X-Custom:foo";
    expect(parseHeaders([])).toEqual({ "x-api-key": "secret", "X-Custom": "foo" });
  });

  it("trims whitespace from MCP_HEADERS keys and values", () => {
    process.env.MCP_HEADERS = " x-api-key : secret ";
    expect(parseHeaders([])).toEqual({ "x-api-key": "secret" });
  });

  it("parses a single --header flag", () => {
    expect(parseHeaders(["x-api-key:mykey"])).toEqual({ "x-api-key": "mykey" });
  });

  it("parses multiple --header flags", () => {
    expect(parseHeaders(["x-api-key:mykey", "X-Foo:bar"])).toEqual({
      "x-api-key": "mykey",
      "X-Foo": "bar",
    });
  });

  it("--header flag overrides MCP_HEADERS for the same key", () => {
    process.env.MCP_HEADERS = "x-api-key:env-key";
    expect(parseHeaders(["x-api-key:flag-key"])).toEqual({ "x-api-key": "flag-key" });
  });

  it("merges MCP_HEADERS env and --header flags for different keys", () => {
    process.env.MCP_HEADERS = "x-api-key:secret";
    expect(parseHeaders(["X-Custom:extra"])).toEqual({
      "x-api-key": "secret",
      "X-Custom": "extra",
    });
  });

  it("preserves colons in header values", () => {
    expect(parseHeaders(["Authorization:Bearer tok:en"])).toEqual({
      Authorization: "Bearer tok:en",
    });
  });

  it("exits on malformed --header flag (missing colon)", () => {
    const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => {
      throw new Error("process.exit");
    });
    expect(() => parseHeaders(["bad-header"])).toThrow();
    exitSpy.mockRestore();
  });
});
