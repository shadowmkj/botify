#!/bin/bash
set -e

echo "Starting Botify..."

# 1. Run database migrations
# This command is safe to run on every start. It applies pending
# migrations and does nothing if the database is up-to-date.
echo "Running database migrations..."
bunx prisma migrate deploy

# 2. Start the correct application based on an environment variable
# The APP_NAME will be passed into the container at runtime.
echo "Starting application: $APP_NAME"

if [ "$APP_NAME" = "web" ]; then
  exec node apps/web/server.js
elif [ "$APP_NAME" = "wserver" ]; then
  exec node apps/wserver/dist/index.js
elif [ "$APP_NAME" = "socket" ]; then
  exec node apps/socket/dist/server.js
else
  echo "Error: Unknown APP_NAME: $APP_NAME"
  exit 1
fi