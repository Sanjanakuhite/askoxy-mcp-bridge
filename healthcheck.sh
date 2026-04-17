#!/bin/sh
PORT="${PORT:-3001}"
node -e "require('http').get('http://localhost:$PORT/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"