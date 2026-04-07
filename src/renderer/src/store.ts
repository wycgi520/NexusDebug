import { create } from 'zustand'

export type ConnectionType = 'SERIAL' | 'TCP_CLIENT' | 'TCP_SERVER' | 'UDP';

export interface DataLog {
  id: string; // unique msg id
  timestamp: string; // HH:mm:ss.SSS
  dir: 'TX' | 'RX'; // Transmit vs Receive
  data: number[]; // raw bytes
  isError?: boolean;
}

export interface Session {
  id: string; // e.g. "COM3" or "tcp-192.168.1.1:8080"
  type: ConnectionType;
  name: string; // e.g. "COM3 - DevKit"
  status: 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED';
  config: any; // original config object
  logs: DataLog[];
}

interface AppStore {
  sessions: Session[];
  activeSessionId: string | null;
  availableSerialPorts: any[];
  
  // Actions
  fetchSerialPorts: () => Promise<void>;
  addSession: (session: Session) => void;
  removeSession: (id: string) => void;
  setActiveSession: (id: string) => void;
  updateSessionStatus: (id: string, status: Session['status']) => void;
  addLog: (sessionId: string, log: Omit<DataLog, 'id' | 'timestamp'>) => void;
  clearLogs: (sessionId: string) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  sessions: [],
  activeSessionId: null,
  availableSerialPorts: [],

  fetchSerialPorts: async () => {
    try {
      if (window.api && window.api.serialList) {
        const res = await window.api.serialList();
        if (res.success) {
          set({ availableSerialPorts: res.data });
        }
      }
    } catch (e) {
      console.error('Failed to fetch ports', e);
    }
  },

  addSession: (session) => {
    set((state) => {
      // If already exists, ignore
      if (state.sessions.find(s => s.id === session.id)) return state;
      return { 
        sessions: [...state.sessions, session],
        activeSessionId: session.id // auto focus new session
      };
    });
  },

  removeSession: (id) => {
    set((state) => {
      const newSessions = state.sessions.filter(s => s.id !== id);
      return {
        sessions: newSessions,
        activeSessionId: state.activeSessionId === id ? (newSessions[0]?.id || null) : state.activeSessionId
      };
    });
  },

  setActiveSession: (id) => set({ activeSessionId: id }),

  updateSessionStatus: (id, status) => set((state) => ({
    sessions: state.sessions.map(s => s.id === id ? { ...s, status } : s)
  })),

  addLog: (sessionId, log) => {
    const now = new Date();
    const ts = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}:${now.getSeconds().toString().padStart(2,'0')}.${now.getMilliseconds().toString().padStart(3,'0')}`;
    
    set((state) => ({
      sessions: state.sessions.map(s => {
        if (s.id !== sessionId) return s;
        // Limit max logs to 1000 for performance
        const newLogs = [...s.logs, { ...log, id: Math.random().toString(36).substr(2, 9), timestamp: ts }];
        if (newLogs.length > 1000) newLogs.shift();
        return { ...s, logs: newLogs };
      })
    }));
  },

  clearLogs: (sessionId) => set((state) => ({
    sessions: state.sessions.map(s => s.id === sessionId ? { ...s, logs: [] } : s)
  }))
}));
