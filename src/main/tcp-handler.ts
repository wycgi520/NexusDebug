import { ipcMain, BrowserWindow } from 'electron';
import * as net from 'net';

// 保存 TCP Client 和 Server
const activeSockets: Map<string, net.Socket> = new Map();
const activeServers: Map<string, net.Server> = new Map();

export function setupTcpHandlers(mainWindow: BrowserWindow) {
  
  // 1. 作为客户端连接 TCP Server
  ipcMain.handle('tcp:connect', async (event, options) => {
    const { host, port } = options;
    const id = `tcp-client-${host}:${port}`;
    
    if (activeSockets.has(id)) {
      return { success: false, error: 'Already connected to this TCP server.' };
    }

    return new Promise((resolve) => {
      const client = new net.Socket();

      client.connect(port, host, () => {
        activeSockets.set(id, client);
        resolve({ success: true, id });
      });

      client.on('data', (data: Buffer) => {
        mainWindow.webContents.send('tcp:on-data', { 
          id, 
          data: Array.from(data) 
        });
      });

      client.on('error', (err) => {
        mainWindow.webContents.send('tcp:on-error', { id, error: err.message });
      });

      client.on('close', () => {
        activeSockets.delete(id);
        mainWindow.webContents.send('tcp:on-close', { id });
      });
    });
  });

  // 2. 作为服务端监听 TCP 端口
  ipcMain.handle('tcp:listen', async (event, options) => {
    const { port } = options;
    const id = `tcp-server-${port}`;

    if (activeServers.has(id)) {
      return { success: false, error: 'Already listening on this port.' };
    }

    return new Promise((resolve) => {
      const server = net.createServer((socket) => {
        const clientId = `tcp-conn-${socket.remoteAddress}:${socket.remotePort}`;
        activeSockets.set(clientId, socket);

        mainWindow.webContents.send('tcp:on-client-connected', { id, clientId });

        socket.on('data', (data: Buffer) => {
          mainWindow.webContents.send('tcp:on-data', { 
            id: clientId, 
            data: Array.from(data) 
          });
        });

        socket.on('error', (err) => {
          mainWindow.webContents.send('tcp:on-error', { id: clientId, error: err.message });
        });

        socket.on('close', () => {
          activeSockets.delete(clientId);
          mainWindow.webContents.send('tcp:on-client-disconnected', { id, clientId });
        });
      });

      server.on('error', (err) => {
        resolve({ success: false, error: err.message });
        mainWindow.webContents.send('tcp:on-error', { id, error: err.message });
      });

      server.listen(port, () => {
        activeServers.set(id, server);
        resolve({ success: true, id });
      });
    });
  });

  // 3. 断开连接或关闭服务端
  ipcMain.handle('tcp:disconnect', async (event, id) => {
    if (activeSockets.has(id)) {
      const socket = activeSockets.get(id);
      socket?.destroy();
      activeSockets.delete(id);
      return { success: true };
    }

    if (activeServers.has(id)) {
      const server = activeServers.get(id);
      server?.close();
      activeServers.delete(id);
      return { success: true };
    }

    return { success: false, error: 'Connection not found.' };
  });

  // 4. 发送数据
  ipcMain.handle('tcp:write', async (event, { id, data }) => {
    const socket = activeSockets.get(id);
    if (!socket) return { success: false, error: 'Socket is not connected.' };

    return new Promise((resolve) => {
      const buffer = Buffer.from(data);
      socket.write(buffer, (err) => {
        if (err) {
          resolve({ success: false, error: err.message });
        } else {
          resolve({ success: true });
        }
      });
    });
  });
}
