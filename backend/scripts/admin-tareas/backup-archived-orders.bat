@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul

:: ===== CONFIGURACIÓN =====
:: Carpeta donde la aplicación genera los backups JSON
set BACKEND_BACKUP_DIR=C:\Users\hanse\Documents\HyG\Hansel_y_Gretel_app\backend\backups\archived-orders

:: Carpeta destino conectada a Google Drive
set DEST_DIR=G:\Mi unidad\BackupsHyG

:: Archivo de log dentro de la misma carpeta de backups del backend
set LOG_FILE=%BACKEND_BACKUP_DIR%\backup-copy-log.txt


:: ===== CONSTRUIR FECHA EN FORMATO YYYY-MM-DD =====
:: El archivo generado por la app usa formato ISO: archived-orders-YYYY-MM-DD.json
:: En Windows Argentina el formato de %date% es DD/MM/YYYY
set DAY=%date:~0,2%
set MONTH=%date:~3,2%
set YEAR=%date:~6,4%
set TODAY=%YEAR%-%MONTH%-%DAY%

set SOURCE_FILE=%BACKEND_BACKUP_DIR%\archived-orders-%TODAY%.json

:: Timestamp legible para el log
set TIMESTAMP=%DATE% %TIME:~0,8%


:: ===== VERIFICAR QUE LA CARPETA ORIGEN EXISTE =====
if not exist "%BACKEND_BACKUP_DIR%" (
    echo [%TIMESTAMP%] ERROR: La carpeta de backups del backend no existe: %BACKEND_BACKUP_DIR% >> "%LOG_FILE%"
    exit /b 1
)


:: ===== VERIFICAR QUE EL ARCHIVO DE HOY EXISTE =====
if not exist "%SOURCE_FILE%" (
    echo [%TIMESTAMP%] AVISO: No se encontro archivo de backup para hoy (%TODAY%). Es posible que no haya habido ordenes para archivar. >> "%LOG_FILE%"
    exit /b 0
)


:: ===== VERIFICAR QUE LA CARPETA DESTINO (GOOGLE DRIVE) EXISTE =====
if not exist "%DEST_DIR%" (
    echo [%TIMESTAMP%] ERROR: La carpeta destino de Google Drive no esta disponible: %DEST_DIR% >> "%LOG_FILE%"
    exit /b 1
)


:: ===== COPIAR EL ARCHIVO AL DESTINO =====
copy /Y "%SOURCE_FILE%" "%DEST_DIR%\" >nul 2>&1

if %errorlevel% neq 0 (
    echo [%TIMESTAMP%] ERROR: Fallo al copiar "%SOURCE_FILE%" hacia "%DEST_DIR%". Verificar permisos y conexion con Google Drive. >> "%LOG_FILE%"
    exit /b 1
)


echo [%TIMESTAMP%] OK: Backup copiado exitosamente ^> %DEST_DIR%\archived-orders-%TODAY%.json >> "%LOG_FILE%"
exit /b 0
