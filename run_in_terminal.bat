@echo off
title Lily Botanical Reel
cd /d "%~dp0"
echo ========================================================
echo    Procedural 3D Botanical Lily Video Generator
echo ========================================================
echo.
echo Activating virtual environment...
call .\.venv\Scripts\activate.bat
echo.
echo Select an option:
echo   [1] Play animated Lily directly in this terminal
echo   [2] Render full 1080x1920 Instagram Reel (lily_reel.mp4)
echo   [3] Render fast 540x960 Preview (lily_preview.mp4)
echo   [4] Run Automated Test Suite
echo   [5] Open lily_reel.mp4 in Media Player
echo   [6] Open interactive PowerShell prompt
echo   [7] Exit
echo.
set /p choice="Enter choice [1-7]: "

if "%choice%"=="1" (
    python play_in_terminal.py --loop
) else if "%choice%"=="2" (
    python generate_lily_animation.py --duration 12.0 --open --title
) else if "%choice%"=="3" (
    python generate_lily_animation.py --preview --open --title
) else if "%choice%"=="4" (
    python test_suite.py
) else if "%choice%"=="5" (
    start lily_reel.mp4
) else if "%choice%"=="6" (
    powershell -NoExit
) else (
    echo Exiting...
)
pause
