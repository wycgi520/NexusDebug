import { contextBridge, ipcRenderer } from 'electron'

// Custom APIs for renderer
const api = {
  // --- Serial APIs ---
  serialList: () => ipcRenderer.invoke('serial:list'),
  serialConnect: (options: any) => ipcRenderer.invoke('serial:connect', options),
  serialDisconnect: (path: string) => ipcRenderer.invoke('serial:disconnect', path),
  serialWrite: (payload: { path: string; data: number[] }) => ipcRenderer.invoke('serial:write', payload),
  
  onSerialData: (callback: (data: any) => void) => {
    const fn = (_event: any, data: any) => callback(data);
    ipcRenderer.on('serial:on-data', fn);
    return () => ipcRenderer.removeListener('serial:on-data', fn);
  },
  onSerialError: (callback: (data: any) => void) => {
    const fn = (_event: any, data: any) => callback(data);
    ipcRenderer.on('serial:on-error', fn);
    return () => ipcRenderer.removeListener('serial:on-error', fn);
  },
  onSerialClose: (callback: (data: any) => void) => {
    const fn = (_event: any, data: any) => callback(data);
    ipcRenderer.on('serial:on-close', fn);
    return () => ipcRenderer.removeListener('serial:on-close', fn);
  },

  // --- TCP APIs ---
  tcpConnect: (options: any) => ipcRenderer.invoke('tcp:connect', options),
  tcpListen: (options: any) => ipcRenderer.invoke('tcp:listen', options),
  tcpDisconnect: (id: string) => ipcRenderer.invoke('tcp:disconnect', id),
  tcpWrite: (payload: { id: string; data: number[] }) => ipcRenderer.invoke('tcp:write', payload),

  onTcpData: (callback: (data: any) => void) => {
    const fn = (_event: any, data: any) => callback(data);
    ipcRenderer.on('tcp:on-data', fn);
    return () => ipcRenderer.removeListener('tcp:on-data', fn);
  },

  // --- UDP APIs ---
  udpBind: (options: any) => ipcRenderer.invoke('udp:bind', options),
  udpClose: (id: string) => ipcRenderer.invoke('udp:close', id),
  udpWrite: (payload: { id: string; data: number[]; targetHost?: string; targetPort?: number }) => ipcRenderer.invoke('udp:write', payload),

  onUdpData: (callback: (data: any) => void) => {
    const fn = (_event: any, data: any) => callback(data);
    ipcRenderer.on('udp:on-data', fn);
    return () => ipcRenderer.removeListener('udp:on-data', fn);
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.api = api
}
