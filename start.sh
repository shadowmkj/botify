#!/bin/sh
node apps/socket/dist/server.js &
node apps/wserver/dist/index.js &
node apps/wserver/dist/worker.js &
cd apps/web && bun run start
