import { ipcMain, BrowserWindow } from 'electron';
import * as dgram from 'dgram';

// 保存 UDP Sockets
const activeSockets: Map<string, dgram.Socket> = new Map();

export function setupUdpHandlers(mainWindow: BrowserWindow) {
  
  // 1. 创建并绑定 UDP Socket (监听端口/发送预备)
  ipcMain.handle('udp:bind', async (_event, options) => {
    const { port, address = '0.0.0.0' } = options;
    const id = `udp-${address}:${port}`;
    
    if (activeSockets.has(id)) {
      return { success: false, error: 'Already bound to this port.' };
    }

    return new Promise((resolve) => {
      const server = dgram.createSocket('udp4');

      server.on('message', (msg: Buffer, rinfo) => {
        mainWindow.webContents.send('udp:on-data', { 
          id, 
          data: Array.from(msg),
          remoteAddress: rinfo.address,
          remotePort: rinfo.port
        });
      });

      server.on('error', (err) => {
        server.close();
        activeSockets.delete(id);
        mainWindow.webContents.send('udp:on-error', { id, error: err.message });
      });

      server.on('close', () => {
        activeSockets.delete(id);
        mainWindow.webContents.send('udp:on-close', { id });
      });

      try {
        server.bind(port, address, () => {
          activeSockets.set(id, server);
          resolve({ success: true, id });
        });
      } catch (err: any) {
        resolve({ success: false, error: err.message });
      }
    });
  });

  // 2. 解绑关闭 UDP
  ipcMain.handle('udp:close', async (_event, id) => {
    const socket = activeSockets.get(id);
    if (!socket) return { success: false, error: 'Socket is not bound.' };

    return new Promise((resolve) => {
      try {
        socket.close();
        activeSockets.delete(id);
        resolve({ success: true });
      } catch (err: any) {
        resolve({ success: false, error: err.message });
      }
    });
  });

  // 3. 发送 UDP 数据报文
  ipcMain.handle('udp:write', async (_event, { id, data, targetHost, targetPort }) => {
    const socket = activeSockets.get(id);
    if (!socket) return { success: false, error: 'Socket is not bound.' };

    return new Promise((resolve) => {
      const buffer = Buffer.from(data);
      socket.send(buffer, targetPort, targetHost, (err) => {
        if (err) {
          resolve({ success: false, error: err.message });
        } else {
          resolve({ success: true });
        }
      });
    });
  });
}
