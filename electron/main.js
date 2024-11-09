const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

// Crear la ventana principal de la aplicación
function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        }
    });

    // Carga la aplicación Next.js en la ventana de Electron
    mainWindow.loadURL('http://localhost:3009');
}

// Inicializa la aplicación de Electron
app.whenReady().then(() => {
    // Iniciar el servidor de backend de NestJS
    const backendProcess = spawn('cmd', ['/c', 'npm', 'run', 'start:dev'], { cwd: path.join(__dirname, '../backend') });
    backendProcess.stdout.on('data', (data) => console.log(`NestJS: ${data}`));
    backendProcess.stderr.on('data', (data) => console.error(`NestJS Error: ${data}`));
    
    const frontendProcess = spawn('cmd', ['/c', 'npm', 'run', 'dev'], { cwd: path.join(__dirname, '../frontend') });
    frontendProcess.stdout.on('data', (data) => console.log(`Next.js: ${data}`));
    frontendProcess.stderr.on('data', (data) => console.error(`Next.js Error: ${data}`));
    createWindow();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
