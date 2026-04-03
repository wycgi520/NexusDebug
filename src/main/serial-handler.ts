import { ipcMain, BrowserWindow } from 'electron';
import { SerialPort } from 'serialport';

// 保存当前活动的串口连接引用
const activePorts: Map<string, SerialPort> = new Map();

export function setupSerialHandlers(mainWindow: BrowserWindow) {
  // 1. 获取设备列表
  ipcMain.handle('serial:list', async () => {
    try {
      const ports = await SerialPort.list();
      return { success: true, data: ports };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  // 2. 连接串口
  // options 包含：path, baudRate, dataBits, stopBits, parity
  ipcMain.handle('serial:connect', async (event, options) => {
    const { path, baudRate, dataBits = 8, stopBits = 1, parity = 'none' } = options;
    
    if (activePorts.has(path)) {
      return { success: false, error: 'Port already connected.' };
    }

    return new Promise((resolve) => {
      const port = new SerialPort({
        path,
        baudRate,
        dataBits,
        stopBits,
        parity,
        autoOpen: false 
      });

      port.open((err) => {
        if (err) {
          resolve({ success: false, error: err.message });
          return;
        }
        
        activePorts.set(path, port);

        // 监听数据接收
        port.on('data', (data: Buffer) => {
          // 发送二进制数据到渲染进程
          mainWindow.webContents.send('serial:on-data', { 
            path, 
            data: Array.from(data) // 必须转为数组以通过 IPC 传递
          });
        });

        // 监听断开或错误
        port.on('error', (err) => {
          mainWindow.webContents.send('serial:on-error', { path, error: err.message });
        });

        port.on('close', () => {
          activePorts.delete(path);
          mainWindow.webContents.send('serial:on-close', { path });
        });

        resolve({ success: true, path });
      });
    });
  });

  // 3. 断开串口
  ipcMain.handle('serial:disconnect', async (event, path) => {
    const port = activePorts.get(path);
    if (!port) return { success: false, error: 'Port is not connected.' };

    return new Promise((resolve) => {
      port.close((err) => {
        if (err) {
          resolve({ success: false, error: err.message });
        } else {
          activePorts.delete(path);
          resolve({ success: true });
        }
      });
    });
  });

  // 4. 发送数据
  ipcMain.handle('serial:write', async (event, { path, data }) => {
    const port = activePorts.get(path);
    if (!port) return { success: false, error: 'Port is not connected.' };

    return new Promise((resolve) => {
      // data 可以是 Buffer 转换来的数组，我们重建为 Buffer
      const buffer = Buffer.from(data);
      port.write(buffer, (err) => {
        if (err) {
          resolve({ success: false, error: err.message });
        } else {
          // 等待数据实际刷入硬件
          port.drain(() => {
            resolve({ success: true });
          });
        }
      });
    });
  });
}
