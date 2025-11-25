import { app, BrowserWindow, ipcMain, session } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import { websocketService } from './services/websocket-service';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindow | null = null;
let storageCache: Record<string, any> = {};
let saveTimeout: NodeJS.Timeout | null = null;
let isSaving = false;

// Storage path for app data
const getStoragePath = () => {
  return path.join(app.getPath('userData'), 'storage.json');
};

// Initialize storage
const initStorage = async () => {
  const storagePath = getStoragePath();
  try {
    const data = await fs.readFile(storagePath, 'utf-8');
    try {
      storageCache = JSON.parse(data);
    } catch (parseError) {
      // If corrupted, backup and reset
      console.error('Storage corrupted, resetting:', parseError);
      await fs.writeFile(`${storagePath}.corrupted.${Date.now()}`, data);
      storageCache = {};
      await fs.writeFile(storagePath, JSON.stringify(storageCache));
    }
  } catch (error) {
    // If doesn't exist, create it
    storageCache = {};
    await fs.writeFile(storagePath, JSON.stringify(storageCache));
  }
};

// Debounced save to disk
const saveStorage = () => {
  if (saveTimeout) clearTimeout(saveTimeout);
  
  saveTimeout = setTimeout(async () => {
    if (isSaving) {
      saveStorage(); // Retry later if already saving
      return;
    }
    
    isSaving = true;
    const storagePath = getStoragePath();
    const tempPath = `${storagePath}.tmp`;
    
    try {
      // Atomic write: write to tmp then rename
      await fs.writeFile(tempPath, JSON.stringify(storageCache, null, 2));
      await fs.rename(tempPath, storagePath);
    } catch (error) {
      console.error('Error saving storage:', error);
    } finally {
      isSaving = false;
    }
  }, 500); // 500ms debounce
};

// IPC handlers for storage
ipcMain.handle('storage:get', async (_, key: string) => {
  return storageCache[key];
});

ipcMain.handle('storage:set', async (_, key: string, value: any) => {
  try {
    storageCache[key] = value;
    saveStorage();
    return true;
  } catch (error) {
    console.error('Error writing storage:', error);
    return false;
  }
});

ipcMain.handle('storage:delete', async (_, key: string) => {
  try {
    delete storageCache[key];
    saveStorage();
    return true;
  } catch (error) {
    console.error('Error deleting from storage:', error);
    return false;
  }
});

// WebSocket IPC handlers
ipcMain.handle('websocket:connect', async (event, connectionId: string, options: {
  url: string;
  protocols?: string[];
  headers?: Record<string, string>;
}) => {
  try {
    await websocketService.connect(connectionId, options);

    // Set up event listeners for this connection
    const ws = websocketService.getConnection(connectionId);
    if (ws) {
      ws.on('message', (data: Buffer, isBinary: boolean) => {
        event.sender.send(`websocket:message:${connectionId}`, {
          data: isBinary ? data : data.toString(),
          isBinary,
          timestamp: Date.now(),
        });
      });

      ws.on('close', (code: number, reason: Buffer) => {
        event.sender.send(`websocket:close:${connectionId}`, {
          code,
          reason: reason.toString(),
        });
      });

      ws.on('error', (error: Error) => {
        event.sender.send(`websocket:error:${connectionId}`, {
          message: error.message,
        });
      });
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle('websocket:send', async (_, connectionId: string, data: string | Buffer) => {
  try {
    await websocketService.send({ connectionId, data });
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle('websocket:disconnect', async (_, connectionId: string) => {
  try {
    await websocketService.disconnect(connectionId);
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle('websocket:status', async (_, connectionId: string) => {
  try {
    const status = websocketService.getStatus(connectionId);
    return { success: true, status };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

function createWindow() {
  // Configure CSP to allow external HTTP requests (needed for API client)
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self'; " +
          "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
          "style-src 'self' 'unsafe-inline'; " +
          "img-src 'self' data: blob: https:; " +
          "connect-src *; " + // Allow connections to any URL for API testing
          "font-src 'self' data:; "
        ]
      }
    });
  });

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
  // Set the application name
  app.setName('Hornet');
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

app.on('before-quit', () => {
  // Clean up all WebSocket connections
  websocketService.cleanup();
});
