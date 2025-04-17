@echo off
setlocal enabledelayedexpansion

echo.
echo ====== Environment Check ======

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH.
    pause
    exit /b 1
)

where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] npm is not installed or not in PATH.
    pause
    exit /b 1
)

where git >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Git is not installed or not in PATH.
    pause
    exit /b 1
)

where pm2 >nul 2>nul
if %errorlevel% equ 0 (
    set HAS_PM2=true
) else (
    set HAS_PM2=false
)

echo All tools detected.
echo.

echo ====== Updating Code ======
git pull
if %errorlevel% neq 0 (
    echo [ERROR] Git pull failed.
    pause
    exit /b %errorlevel%
)

echo ====== Installing Dependencies ======
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] npm install failed.
    pause
    exit /b %errorlevel%
)

echo ====== Building Project ======
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Build failed.
    pause
    exit /b %errorlevel%
)

echo.
echo ====== Starting Server ======
if "%HAS_PM2%"=="true" (
    echo PM2 is available.
    choice /M "Do you want to use PM2 to run the server?"
    if errorlevel 2 (
        echo Starting with: node index.js
        node index.js
    ) else (
        echo Starting with: pm2 start index.js --name my-app
        pm2 start index.js --name my-app
    )
) else (
    echo PM2 not available, running with node.
    node index.js
)

pause
