/**
 * HTTP entrypoint — StreamableHTTP transport (MCP spec 2025-03-26)
 * Compatible with Perplexity MCP connector and other remote MCP clients.
 *
 * Endpoint: POST/GET /mcp
 * Health:   GET  /health
 */
import http from "node:http";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { assertApiKey, parseConfig } from "./utils/config.js";
import { buildServer } from "./index.js";

const PORT = Number(process.env.PORT ?? 3000);
const HOST = process.env.HOST ?? "0.0.0.0";

async function main() {
	const cfg = parseConfig(process.argv.slice(2), process.env);
	assertApiKey(cfg.apiKey);

	const server = buildServer(cfg.apiKey);

	const transport = new StreamableHTTPServerTransport({
		path: "/mcp",
	});

	await server.connect(transport);

	const httpServer = http.createServer((req, res) => {
		if (req.url === "/health" && req.method === "GET") {
			res.writeHead(200, { "Content-Type": "application/json" });
			res.end(JSON.stringify({ status: "ok" }));
			return;
		}
		transport.handleRequest(req, res);
	});

	httpServer.listen(PORT, HOST, () => {
		console.log(`hevy-mcp HTTP server listening on ${HOST}:${PORT}/mcp`);
	});

	process.on("SIGTERM", () => {
		console.log("SIGTERM received, shutting down");
		httpServer.close(() => process.exit(0));
	});
}

void main().catch((err) => {
	console.error("Fatal error:", err);
	process.exit(1);
});
