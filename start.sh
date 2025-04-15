#!/bin/bash

echo "Installing dependencies..."
npm install
if [ $? -ne 0 ]; then
  echo "Failed to install dependencies!"
  exit 1
fi

echo "Building project..."
npm run build
if [ $? -ne 0 ]; then
  echo "Build failed!"
  exit 1
fi

echo "Starting server..."
node index.js
