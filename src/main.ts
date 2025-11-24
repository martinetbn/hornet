import { app, BrowserWindow, ipcMain, session } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import { websocketService } from './services/websocket-service';

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
