#!/bin/sh
set -eu

mkdir -p uploads uploads/screenshots uploads/videos uploads/logs uploads/attachments

npm install
npm run db:generate
npm run db:push
npm run build

echo "Build is ready. Start the app with: npm run start"
