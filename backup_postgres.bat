@echo off
set PGUSER=postgres
set PGPASSWORD=200500123
set PGHOST=localhost
set PGPORT=5432
set PGDATABASE=hansel_y_gretel
set BACKUP_DIR="C:\Users\User\DriveBackupsHyG"

:: Nombre de la tabla a exportar, agregar tantas tablas como necesites
set TABLE_NAME=room

:: Corregir formato de TIMESTAMP (evitar caracteres inválidos)
set TIMESTAMP=%date:~6,4%-%date:~3,2%-%date:~0,2%_%time:~0,2%-%time:~3,2%-%time:~6,2%
set TIMESTAMP=%TIMESTAMP:/=_% 
set TIMESTAMP=%TIMESTAMP::=_% 
set TIMESTAMP=%TIMESTAMP: .=_% 
set TIMESTAMP=%TIMESTAMP: =_% 

set BACKUP_FILE=%BACKUP_DIR%\backup_%TIMESTAMP%.sql
set CSV_FILE=%BACKUP_DIR%\export_%TABLE_NAME%.csv
set LOG_FILE=%BACKUP_DIR%\backup_log.txt

:: Crear carpeta si no existe
if not exist %BACKUP_DIR% mkdir %BACKUP_DIR%

:: Mostrar ruta generada en el log
echo "Archivo de backup: %BACKUP_FILE%" >> %LOG_FILE%

:: Ejecutar pg_dump con la ruta corregida
"C:\Program Files\PostgreSQL\16\bin\pg_dump.exe" -U %PGUSER% -h %PGHOST% -p %PGPORT% -F c -b -v -f "%BACKUP_FILE%" >> %LOG_FILE% 2>&1

if %errorlevel% neq 0 (
    echo "Error al crear el backup." >> %LOG_FILE%
    echo Fallo el backup. Verifica el log.
    exit /b
)

echo Backup creado: %BACKUP_FILE%

:: Restaurar el backup (opcional, comenta esta parte si no lo necesitas)
:: "C:\Program Files\PostgreSQL\16\bin\pg_restore.exe" -U %PGUSER% -h %PGHOST% -p %PGPORT% -d %PGDATABASE% --clean --if-exists --verbose "%BACKUP_FILE%" >> %LOG_FILE% 2>&1

:: Exportar datos a CSV
echo "Exportando tabla %TABLE_NAME% a CSV..." >> %LOG_FILE%
"C:\Program Files\PostgreSQL\16\bin\psql.exe" -U %PGUSER% -h %PGHOST% -p %PGPORT% -d %PGDATABASE% -c "\copy %TABLE_NAME% TO '%CSV_FILE%' WITH CSV HEADER;" >> %LOG_FILE% 2>&1


if %errorlevel% neq 0 (
    echo "Error al exportar datos a CSV." >> %LOG_FILE%
    echo Fallo la exportación a CSV. Verifica el log.
    exit /b
)

echo CSV exportado correctamente: %CSV_FILE%


echo "Archivo generado: %CSV_FILE%" >> %LOG_FILE%
echo "Moviendo archivo a: C:\Users\User\Google Drive\BackupsHyG\" >> %LOG_FILE%
move "%CSV_FILE%" "G:\Mi unidad\BackupsHyG\"

:: pause
