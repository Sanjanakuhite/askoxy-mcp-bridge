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

## Install
```bash
npm install
copy .env.example .env
npm start
```

## Realtime frontend attachment
Use this in your Realtime `session.update`:
```json
{
  "type": "session.update",
  "session": {
    "tools": [
      {
        "type": "mcp",
        "server_label": "askoxy_mcp",
        "server_url": "http://localhost:3001/mcp",
        "require_approval": "never"
      }
    ]
  }
}
```

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

## Important
- UI should not hardcode tool selection.
- AI should decide the MCP tool.
- MCP server calls backend APIs and returns grounded results only.
