@echo off
set PGUSER=postgres
set PGPASSWORD=200500123
set PGHOST=localhost
set PGPORT=5432
set PGDATABASE=hansel_y_gretel
set BACKUP_DIR="C:\Users\User\DriveBackupsHyG"

:: Nombre de la tabla a exportar
set TABLE_NAME=orders

:: Corregir formato de TIMESTAMP (evitar caracteres inválidos)
set TIMESTAMP=%date:~6,4%-%date:~3,2%-%date:~0,2%_%time:~0,2%-%time:~3,2%-%time:~6,2%
set TIMESTAMP=%TIMESTAMP:/=_% 
set TIMESTAMP=%TIMESTAMP::=_% 
set TIMESTAMP=%TIMESTAMP: .=_% 
set TIMESTAMP=%TIMESTAMP: =_% 

:: Crear nombres de archivos
set BACKUP_FILE=%BACKUP_DIR%\backup_%TABLE_NAME%_%TIMESTAMP%.sql
set CSV_FILE=%BACKUP_DIR%\export_%TABLE_NAME%_%TIMESTAMP%.csv
set LOG_FILE=%BACKUP_DIR%\backup_log.txt

:: Crear carpeta si no existe
if not exist %BACKUP_DIR% mkdir %BACKUP_DIR%

:: Mostrar ruta generada en el log
echo "Archivo de backup: %BACKUP_FILE%" >> %LOG_FILE%

:: Ejecutar pg_dump con la ruta corregida
::"C:\Program Files\PostgreSQL\16\bin\pg_dump.exe" -U %PGUSER% -h %PGHOST% -p %PGPORT% -F c -b -v -f "%BACKUP_FILE%" -t %TABLE_NAME% >> %LOG_FILE% 2>&1
::Backup filtrado según intervalo deseado
"C:\Program Files\PostgreSQL\16\bin\psql.exe" -U %PGUSER% -h %PGHOST% -p %PGPORT% -d %PGDATABASE% -c "SELECT * FROM %TABLE_NAME% WHERE date >= (CURRENT_DATE - INTERVAL '14 days') AND date < (CURRENT_DATE - INTERVAL '7 days');" -o "%BACKUP_FILE%"

if %errorlevel% neq 0 (
    echo "Error al crear el backup." >> %LOG_FILE%
    echo Fallo el backup. Verifica el log.
    exit /b
)

echo Backup creado: %BACKUP_FILE%

:: Exportar SOLO los registros de la semana anterior (7 días atrás)
echo "Exportando tabla %TABLE_NAME% a CSV..." >> %LOG_FILE%
"C:\Program Files\PostgreSQL\16\bin\psql.exe" -U %PGUSER% -h %PGHOST% -p %PGPORT% -d %PGDATABASE% -c "\copy (SELECT * FROM %TABLE_NAME% WHERE date >= (CURRENT_DATE - INTERVAL '14 days') AND date < (CURRENT_DATE - INTERVAL '7 days')) TO '%CSV_FILE%' WITH CSV HEADER;" >> %LOG_FILE% 2>&1

if %errorlevel% neq 0 (
    echo "Error al exportar datos a CSV." >> %LOG_FILE%
    echo Fallo la exportación a CSV. Verifica el log.
    exit /b
)

echo CSV exportado correctamente: %CSV_FILE%

:: Mover CSV a Google Drive
echo "Moviendo archivo a: G:\Mi unidad\BackupsHyG\" >> %LOG_FILE%
move "%CSV_FILE%" "G:\Mi unidad\BackupsHyG\"

pause
