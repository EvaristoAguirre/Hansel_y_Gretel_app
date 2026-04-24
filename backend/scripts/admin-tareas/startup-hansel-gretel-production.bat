@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul

:: ===== CONFIGURACIÓN =====
set BACKEND_URL=http://localhost:3000
set BACKEND_HEALTH_ENDPOINT=/health
set BACKEND_PATH=C:\Users\hanse\Documents\HyG\Hansel_y_Gretel_app\backend
set FRONTEND_PATH=C:\Users\hanse\Documents\HyG\Hansel_y_Gretel_app\frontend
set MAX_RETRIES=30
set RETRY_DELAY=2
set APP_NAME=Hansel y Gretel

:: Crear carpeta de logs
if not exist "%TEMP%\hansel_logs" mkdir "%TEMP%\hansel_logs"

:: Generar timestamp seguro (sin barras ni espacios) usando PowerShell
for /f "tokens=*" %%i in ('powershell -NoProfile -Command "Get-Date -Format 'yyyy-MM-dd_HH-mm-ss'"') do set DATETIME=%%i
set LOG_FILE=%TEMP%\hansel_logs\startup_%DATETIME%.log

echo. > "%LOG_FILE%"
echo ========================================== >> "%LOG_FILE%"
echo Iniciando %APP_NAME% - PRODUCCIÓN >> "%LOG_FILE%"
echo Fecha: %date% %time% >> "%LOG_FILE%"
echo ========================================== >> "%LOG_FILE%"

:: Validar que las rutas existan
if not exist "%BACKEND_PATH%" (
    echo ERROR: Backend path not found >> "%LOG_FILE%"
    call :SendNotification 0 "Fallo. Pruebe más tarde"
    exit /b 1
)

if not exist "%FRONTEND_PATH%" (
    echo ERROR: Frontend path not found >> "%LOG_FILE%"
    call :SendNotification 0 "Fallo. Pruebe más tarde"
    exit /b 1
)

if not exist "%BACKEND_PATH%\package.json" (
    echo ERROR: Backend package.json not found >> "%LOG_FILE%"
    call :SendNotification 0 "Fallo. Pruebe más tarde"
    exit /b 1
)

if not exist "%FRONTEND_PATH%\package.json" (
    echo ERROR: Frontend package.json not found >> "%LOG_FILE%"
    call :SendNotification 0 "Fallo. Pruebe más tarde"
    exit /b 1
)

echo Rutas validadas correctamente >> "%LOG_FILE%"

:: Iniciar Backend en PRODUCCIÓN
echo. >> "%LOG_FILE%"
echo Starting Backend (PRODUCTION) >> "%LOG_FILE%"
cd /d "%BACKEND_PATH%"
start "Hansel-Backend-Prod" /MIN cmd /k "npm run start"
echo Backend iniciado >> "%LOG_FILE%"

:: Health Check del Backend
echo. >> "%LOG_FILE%"
echo Performing health checks... >> "%LOG_FILE%"

set RETRY_COUNT=0
set BACKEND_READY=0

:CHECK_BACKEND
set /a RETRY_COUNT+=1

powershell -NoProfile -Command "try { $response = Invoke-WebRequest -Uri '%BACKEND_URL%%BACKEND_HEALTH_ENDPOINT%' -Method GET -TimeoutSec 5 -ErrorAction Stop; if ($response.StatusCode -eq 200) { exit 0 } else { exit 1 } } catch { exit 1 }"

if %errorlevel% equ 0 (
    echo [Intento %RETRY_COUNT%] Backend ready >> "%LOG_FILE%"
    set BACKEND_READY=1
    goto BACKEND_OK
)

if %RETRY_COUNT% geq %MAX_RETRIES% (
    echo ERROR: Backend health check failed after %MAX_RETRIES% attempts >> "%LOG_FILE%"
    call :SendNotification 0 "Fallo. Pruebe más tarde"
    exit /b 1
)

timeout /t %RETRY_DELAY% /nobreak >nul
goto CHECK_BACKEND

:BACKEND_OK
echo. >> "%LOG_FILE%"
echo Starting Frontend (PRODUCTION) >> "%LOG_FILE%"
cd /d "%FRONTEND_PATH%"
start "Hansel-Frontend-Prod" /MIN cmd /k "npm run start"
echo Frontend iniciado >> "%LOG_FILE%"

timeout /t 3 /nobreak >nul

echo. >> "%LOG_FILE%"
echo ✅ Application startup completed successfully >> "%LOG_FILE%"
echo Startup completed at %date% %time% >> "%LOG_FILE%"

:: Enviar notificación de éxito
call :SendNotification 1 "%APP_NAME% en funcionamiento"

exit /b 0

:: ===== FUNCIÓN: ENVIAR NOTIFICACIÓN =====
:SendNotification
setlocal
set SUCCESS=%1
set MESSAGE=%2

if %SUCCESS% equ 1 (
    :: Notificación de éxito
    powershell -NoProfile -Command "try { [Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] > $null; New-BurntToastNotification -Text '%MESSAGE%' -AppLogo 'C:\Windows\System32\cmd.exe' } catch { }" 2>nul
) else (
    :: Notificación de error
    powershell -NoProfile -Command "try { [Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] > $null; New-BurntToastNotification -Text '%MESSAGE%' -AppLogo 'C:\Windows\System32\cmd.exe' } catch { }" 2>nul
)

endlocal
exit /b 0
