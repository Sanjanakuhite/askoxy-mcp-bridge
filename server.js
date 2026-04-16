const express = require('express');
const cors = require('cors');
const { randomUUID } = require('node:crypto');
const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { StreamableHTTPServerTransport } = require('@modelcontextprotocol/sdk/server/streamableHttp.js');
const { isInitializeRequest } = require('@modelcontextprotocol/sdk/types.js');
const { port } = require('./utils/config');
const { getRealtimeToken } = require('./src/tokenController');
const { registerTools, invokeDebugTool, toolDefinitions } = require('./src/toolRegistry');

const app = express();
const transports = {};

app.use(cors({ origin: '*', credentials: false }));
app.use(express.json({ limit: '2mb' }));

function createServer() {
  const server = new McpServer({
    name: 'askoxy-mcp-bridge',
    version: '1.0.0'
  });

  registerTools(server);
  return server;
}

app.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'AskOxy MCP bridge is running',
    tools: toolDefinitions.map((tool) => tool.name)
  });
});

app.get('/api/realtime/token', getRealtimeToken);

app.post('/api/debug/tool-call', async (req, res) => {
  try {
    const { name, arguments: args } = req.body || {};
    const result = await invokeDebugTool(name, args || {});
    res.json({ success: true, result });
  } catch (error) {
    res.status(400).json({ success: false, message: error?.message || 'Tool call failed' });
  }
});

app.post('/mcp', async (req, res) => {
  const sessionId = req.headers['mcp-session-id'];

  try {
    let transport;

    if (sessionId && transports[sessionId]) {
      transport = transports[sessionId];
      await transport.handleRequest(req, res, req.body);
      return;
    }

    if (!sessionId && isInitializeRequest(req.body)) {
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (newSessionId) => {
          transports[newSessionId] = transport;
        }
      });

      transport.onclose = () => {
        const sid = transport.sessionId;
        if (sid && transports[sid]) {
          delete transports[sid];
        }
      };

      const server = createServer();
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
      return;
    }

    res.status(400).json({
      jsonrpc: '2.0',
      error: {
        code: -32000,
        message: 'Bad Request: No valid session ID provided'
      },
      id: null
    });
  } catch (error) {
    console.error('MCP POST error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: error?.message || 'Internal server error'
        },
        id: null
      });
    }
  }
});

app.get('/mcp', async (req, res) => {
  const sessionId = req.headers['mcp-session-id'];
  if (!sessionId || !transports[sessionId]) {
    res.status(400).send('Invalid or missing session ID');
    return;
  }

  try {
    await transports[sessionId].handleRequest(req, res);
  } catch (error) {
    console.error('MCP GET error:', error);
    if (!res.headersSent) {
      res.status(500).send(error?.message || 'MCP GET failed');
    }
  }
});

app.delete('/mcp', async (req, res) => {
  const sessionId = req.headers['mcp-session-id'];
  if (!sessionId || !transports[sessionId]) {
    res.status(400).send('Invalid or missing session ID');
    return;
  }

  try {
    await transports[sessionId].handleRequest(req, res);
  } catch (error) {
    console.error('MCP DELETE error:', error);
    if (!res.headersSent) {
      res.status(500).send(error?.message || 'MCP DELETE failed');
    }
  }
});

app.listen(port, () => {
  console.log(`🚀 AskOxy MCP Bridge running on http://localhost:${port}`);
  console.log(`🩺 Health: http://localhost:${port}/health`);
  console.log(`🔑 Token:  http://localhost:${port}/api/realtime/token`);
  console.log(`🧰 MCP:    http://localhost:${port}/mcp`);
});
