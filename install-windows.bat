@echo off
echo ========================================
echo Google MCP Server Windows Installation
echo ========================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo Installing dependencies...
call npm install

if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies!
    pause
    exit /b 1
)

echo.
echo Building the project...
call npm run build

if %errorlevel% neq 0 (
    echo ERROR: Failed to build the project!
    pause
    exit /b 1
)

echo.
echo ========================================
echo Installation completed successfully!
echo ========================================
echo.
echo Next steps:
echo 1. Copy your credentials.json file to this directory
echo 2. Copy .env.example to .env and fill in your Google credentials
echo 3. Configure Claude Desktop with the server path
echo.
echo Server path for Claude Desktop config:
echo %cd%\dist\index.js
echo.
pause