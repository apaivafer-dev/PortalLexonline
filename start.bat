@echo off
echo ========================================
echo   LexOnline - Iniciando servidores...
echo ========================================
echo.
echo [1/2] Iniciando Backend (porta 3001)...
start "LexOnline Backend" cmd /k "cd /d %~dp0server && npx ts-node src/index.ts"

timeout /t 4 /nobreak >nul

echo [2/2] Iniciando Frontend (porta 3000)...
start "LexOnline Frontend" cmd /k "cd /d %~dp0 && npm run dev"

echo.
echo ========================================
echo  Aguarde os servidores iniciarem...
echo.
echo  Frontend: http://localhost:3000
echo  Backend:  http://localhost:3001
echo  Health:   http://localhost:3001/api/health
echo.
echo  LOGIN ADMIN:
echo    Email: apaivafer@gmail.com
echo    Senha: admin123
echo ========================================
echo.
echo Pressione qualquer tecla para fechar esta janela.
echo Os servidores continuarao rodando nas janelas abertas.
pause > nul
