@echo off
echo Installing dependencies...
call npm install

if %errorlevel% neq 0 (
  echo Failed to install dependencies!
  exit /b %errorlevel%
)

echo Building project...
call npm run build

if %errorlevel% neq 0 (
  echo Build failed!
  exit /b %errorlevel%
)

echo Starting server...
node index.js
