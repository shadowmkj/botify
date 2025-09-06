#!/bin/sh
# This script starts all the services for the Botify application.

# Start the WServer in the background.
# Its build output is in /app/apps/wserver/dist
echo "Starting Botify WServer..."
node apps/wserver/dist/worker.js &

# Start the Socket server in the background.
# Its build output is in /app/apps/socket/dist
echo "Starting Botify Socket Server..."
node apps/socket/dist/server.js &

# Start the Next.js web frontend in the foreground.
# We change into its directory to run it.
echo "Starting Botify Web Frontend..."
cd apps/web
exec npm run start
