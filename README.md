# AskOxy MCP Bridge

Node service for:
- `GET /api/realtime/token` -> creates OpenAI Realtime client secret
- `POST /mcp`, `GET /mcp`, `DELETE /mcp` -> remote MCP server for Realtime API

## Tools
- `search_product`
- `show_offers`
- `show_cart`
- `add_to_cart`
- `place_order`

## Development Setup

```bash
npm install
cp .env.example .env
npm run dev  # Runs with nodemon for hot reload
```

## Production Setup

### Using PM2
```bash
npm install -g pm2
npm run build  # No-op for Node.js
npm start  # Starts with PM2
```

### Using Docker
```bash
docker-compose up -d
```

### Manual Production Start
```bash
NODE_ENV=production npm start
```

## Scripts
- `npm run dev` - Development with nodemon
- `npm start` - Production with PM2
- `npm test` - Run tests
- `npm run lint` - Lint code
- `npm run lint:fix` - Fix linting issues
- `npm run pm2:stop` - Stop PM2 process
- `npm run pm2:restart` - Restart PM2 process

## Environment Variables
- `OPENAI_API_KEY` - **Required**: Your OpenAI API key
- `PORT` - Server port (automatically set by Render)
- `NODE_ENV` - Environment (production)
- `LOG_LEVEL` - Logging level (info)
- `CORS_ORIGIN` - CORS allowed origins (*)
- `OPENAI_REALTIME_MODEL` - Realtime model (gpt-realtime-1)
- `OPENAI_REALTIME_VOICE` - Voice for realtime (alloy)
- `SEARCH_URL` - Product search API URL
- `OFFERS_URL` - Offers API URL
- `ADD_TO_CART_URL` - Add to cart API URL
- `GET_CART_URL` - Get cart API URL
- `ORDER_URL` - Place order API URL
- `SEARCH_REDIRECT_BASE` - Search redirect URL
- `OFFERS_REDIRECT` - Offers redirect URL
- `CART_REDIRECT` - Cart redirect URL
- `ORDER_REDIRECT` - Order redirect URL

## Health Check
`GET http://localhost:3001/health`

## Token API
`GET http://localhost:3001/api/realtime/token?language=English&languageCode=en&instruction=...`

Response:
```json
{
  "success": true,
  "message": "Token generated successfully",
  "data": {
    "sessionId": "...",
    "token": "..."
  }
}
```

## Deployment

### Render (Recommended)
1. Connect your GitHub repository to Render
2. Create a new Web Service
3. Select "Docker" as the runtime
4. Use the `render.yaml` configuration file
5. Set the `OPENAI_API_KEY` environment variable
6. Deploy!

The `render.yaml` file contains all necessary configuration for Render deployment.

### Docker
```bash
docker-compose up -d
```

### PM2
```bash
npm install -g pm2
npm start
```
