#!/bin/bash

echo
echo "====== Environment Check ======"

check_command() {
    if ! command -v "$1" >/dev/null 2>&1; then
        echo "[ERROR] $1 is not installed or not in PATH."
        exit 1
    fi
}

check_command node
check_command npm
check_command git

HAS_PM2=false
if command -v pm2 >/dev/null 2>&1; then
    HAS_PM2=true
fi

echo "All required tools are available."
echo

echo "====== Updating Code ======"
git pull || { echo "[ERROR] Git pull failed."; read -rp "Press enter to exit..."; exit 1; }

echo "====== Installing Dependencies ======"
npm install || { echo "[ERROR] npm install failed."; read -rp "Press enter to exit..."; exit 1; }

echo "====== Building Project ======"
npm run build || { echo "[ERROR] Build failed."; read -rp "Press enter to exit..."; exit 1; }

echo
echo "====== Starting Server ======"
if [ "$HAS_PM2" = true ]; then
    read -rp "PM2 detected. Run with PM2? (y/n): " use_pm2
    if [[ "$use_pm2" =~ ^[Yy]$ ]]; then
        echo "Starting with: pm2 start index.js --name my-app"
        pm2 start index.js --name my-app
    else
        echo "Starting with: node index.js"
        node index.js
    fi
else
    echo "PM2 not found. Running with node."
    node index.js
fi
