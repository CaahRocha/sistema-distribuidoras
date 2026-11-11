@echo off
title Renovar Licenca - Sistema Distribuidoras
color 0A
echo.
echo  ==========================================
echo    Renovacao de Licenca
echo  ==========================================
echo.
echo  Informe os dados recebidos pelo WhatsApp:
echo.
set /p DATA="  Data de vencimento (AAAA-MM-DD): "
set /p CODIGO="  Codigo de renovacao:             "
echo.
echo  Verificando...
echo.

curl -s -X POST "http://localhost:3001/api/licenca/renovar" ^
  -H "Content-Type: application/json" ^
  -d "{\"data_expira\":\"%DATA%\",\"codigo\":\"%CODIGO%\"}"

echo.
echo.
pause
