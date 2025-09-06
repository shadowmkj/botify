#!/bin/sh
rm -rf node_modules
rm -rf apps/web/node_modules
rm -rf apps/socket/node_modules
rm -rf apps/wserver/node_modules
find . -type d -name "dist" -exec rm -rf {} +
