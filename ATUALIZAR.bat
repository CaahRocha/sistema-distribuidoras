@echo off
title Atualizando Sistema Distribuidoras
echo.
echo ==========================================
echo   Atualizando o sistema...
echo ==========================================
echo.

echo [1/3] Instalando dependencias do backend...
cd /d "%~dp0backend"
npm install

echo.
echo [2/3] Instalando dependencias do frontend...
cd /d "%~dp0frontend"
npm install

echo.
echo [3/3] Gerando build do frontend...
npm run build

echo.
echo ==========================================
echo   Sistema atualizado com sucesso!
echo   Execute INICIAR.bat para rodar.
echo ==========================================
echo.
pause
