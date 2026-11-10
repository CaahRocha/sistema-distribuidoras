@echo off
title Sistema Distribuidoras
color 0A
echo.
echo ==========================================
echo   Sistema Distribuidoras - Iniciando...
echo ==========================================
echo.

cd /d "%~dp0backend"

:: Abre o navegador apos 3 segundos (enquanto o servidor sobe)
start "" cmd /c "timeout /t 3 /nobreak > nul && start http://localhost:3001"

:: Inicia o servidor
npm start
pause
