import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindow | null = null;

// Storage path for app data
const getStoragePath = () => {
  return path.join(app.getPath('userData'), 'storage.json');
};

// Initialize storage file if it doesn't exist
const initStorage = async () => {
  const storagePath = getStoragePath();
  try {
    await fs.access(storagePath);
  } catch {
    await fs.writeFile(storagePath, JSON.stringify({}));
  }
};

// IPC handlers for storage
ipcMain.handle('storage:get', async (_, key: string) => {
  const storagePath = getStoragePath();
  try {
    const data = await fs.readFile(storagePath, 'utf-8');
    const storage = JSON.parse(data);
    return storage[key];
  } catch (error) {
    console.error('Error reading storage:', error);
    return null;
  }
});

ipcMain.handle('storage:set', async (_, key: string, value: any) => {
  const storagePath = getStoragePath();
  try {
    const data = await fs.readFile(storagePath, 'utf-8');
    const storage = JSON.parse(data);
    storage[key] = value;
    await fs.writeFile(storagePath, JSON.stringify(storage, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing storage:', error);
    return false;
  }
});

ipcMain.handle('storage:delete', async (_, key: string) => {
  const storagePath = getStoragePath();
  try {
    const data = await fs.readFile(storagePath, 'utf-8');
    const storage = JSON.parse(data);
    delete storage[key];
    await fs.writeFile(storagePath, JSON.stringify(storage, null, 2));
    return true;
  } catch (error) {
    console.error('Error deleting from storage:', error);
    return false;
  }
});

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // Load the renderer
  if (app.isPackaged) {
    mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'renderer', 'index.html'));
  }

  // Open DevTools in development
  if (!app.isPackaged) {
    //mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  await initStorage();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
