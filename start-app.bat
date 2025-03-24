@echo off
echo 🚀 Iniciando Hansel y Gretel App...

:: Iniciar el backend
cd /d "C:\Users\User\Documents\Proyectos\HyG\Hansel_y_Gretel_app\backend"
echo 🟢 Iniciando NestJS...
start /B cmd /c "npm run start:dev"

:: Pequeña pausa para evitar conflictos
timeout /t 60 /nobreak >nul

:: Iniciar el frontend
cd /d "C:\Users\User\Documents\Proyectos\HyG\Hansel_y_Gretel_app\frontend"
echo 🟢 Iniciando Next.js...
start /B cmd /c "npm run dev"

echo ✅ Aplicación iniciada con éxito.
msg * "Hansel y Gretel App funcionando correctamente."
exit