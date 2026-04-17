const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const winston = require('winston');
const { randomUUID } = require('node:crypto');
const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { StreamableHTTPServerTransport } = require('@modelcontextprotocol/sdk/server/streamableHttp.js');
const { isInitializeRequest } = require('@modelcontextprotocol/sdk/types.js');
const { RateLimiterMemory } = require('rate-limiter-flexible');
const { port } = require('./utils/config');
const { getRealtimeToken } = require('./src/tokenController');
const { registerTools, invokeDebugTool, toolDefinitions } = require('./src/toolRegistry');

// Configure Winston logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'askoxy-mcp-bridge' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

const app = express();
const transports = {};

// Rate limiter
const rateLimiter = new RateLimiterMemory({
  keyPrefix: 'mcp_bridge',
  points: 100, // Number of requests
  duration: 60, // Per 60 seconds
});

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ['self'],
      styleSrc: ['self', 'unsafe-inline'],
      scriptSrc: ['self'],
      imgSrc: ['self', 'data:', 'https:'],
    },
  },
}));
app.use(compression());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*', credentials: false }));
app.use(express.json({ limit: '2mb' }));

// Rate limiting middleware
app.use(async (req, res, next) => {
  try {
    await rateLimiter.consume(req.ip);
    next();
  } catch (rejRes) {
    res.status(429).json({
      success: false,
      message: 'Too many requests',
      retryAfter: Math.round(rejRes.msBeforeNext / 1000)
    });
  }
});

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('Request completed', {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip
    });
  });
  next();
});

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
    logger.error('Debug tool call failed', { error: error.message, stack: error.stack });
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
    logger.error('MCP POST error', { error: error.message, stack: error.stack, sessionId });
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
    logger.error('MCP GET error', { error: error.message, stack: error.stack, sessionId });
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
    logger.error('MCP DELETE error', { error: error.message, stack: error.stack, sessionId });
    if (!res.headersSent) {
      res.status(500).send(error?.message || 'MCP DELETE failed');
    }
  }
});

// Only start server if this file is run directly
if (require.main === module) {
  const server = app.listen(port, () => {
    logger.info('🚀 AskOxy MCP Bridge started', {
      port,
      environment: process.env.NODE_ENV || 'development',
      healthUrl: `http://localhost:${port}/health`,
      tokenUrl: `http://localhost:${port}/api/realtime/token`,
      mcpUrl: `http://localhost:${port}/mcp`
    });
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully');
    server.close(() => {
      logger.info('Process terminated');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    logger.info('SIGINT received, shutting down gracefully');
    server.close(() => {
      logger.info('Process terminated');
      process.exit(0);
    });
  });

  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection', { reason, promise });
    process.exit(1);
  });
}

module.exports = app;
