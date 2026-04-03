import { ElectronAPI } from '@electron-toolkit/preload'

export interface SerialData {
  path: string;
  data: number[];
}

export interface TcpData {
  id: string;
  data: number[];
}

export interface UdpData {
  id: string;
  data: number[];
  remoteAddress: string;
  remotePort: number;
}

declare global {
  interface Window {
    api: {
      serialList: () => Promise<any>;
      serialConnect: (options: any) => Promise<any>;
      serialDisconnect: (path: string) => Promise<any>;
      serialWrite: (payload: { path: string; data: number[] }) => Promise<any>;
      onSerialData: (callback: (data: SerialData) => void) => () => void;
      onSerialError: (callback: (data: any) => void) => () => void;
      onSerialClose: (callback: (data: any) => void) => () => void;

      tcpConnect: (options: any) => Promise<any>;
      tcpListen: (options: any) => Promise<any>;
      tcpDisconnect: (id: string) => Promise<any>;
      tcpWrite: (payload: { id: string; data: number[] }) => Promise<any>;
      onTcpData: (callback: (data: TcpData) => void) => () => void;

      udpBind: (options: any) => Promise<any>;
      udpClose: (id: string) => Promise<any>;
      udpWrite: (payload: { id: string; data: number[]; targetHost?: string; targetPort?: number }) => Promise<any>;
      onUdpData: (callback: (data: UdpData) => void) => () => void;
    }
  }
}
