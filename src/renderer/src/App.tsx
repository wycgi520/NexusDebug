import { NavigationSidebar } from "./components/NavigationSidebar";
import { SessionView } from "./components/SessionView";
import { useEffect } from "react";
import { useAppStore } from "./store";

function App(): React.JSX.Element {
  
  // Register global IPC handlers once
  useEffect(() => {
    if (typeof window !== 'undefined' && window.api) {
      const unsubSerialData = window.api.onSerialData((data) => {
        useAppStore.getState().addLog(data.path, { dir: 'RX', data: data.data });
      });
      const unsubSerialError = window.api.onSerialError((data) => {
        console.error('Serial Error', data);
        useAppStore.getState().addLog(data.path, { dir: 'RX', data: Array.from(Buffer.from(data.error)), isError: true });
        useAppStore.getState().updateSessionStatus(data.path, 'DISCONNECTED');
      });
      const unsubSerialClose = window.api.onSerialClose((data) => {
        useAppStore.getState().updateSessionStatus(data.path, 'DISCONNECTED');
      });

      // TCP data
      const unsubTcpData = window.api.onTcpData((data) => {
        useAppStore.getState().addLog(data.id, { dir: 'RX', data: data.data });
      });

      // UDP data
      const unsubUdpData = window.api.onUdpData((data) => {
        useAppStore.getState().addLog(data.id, { dir: 'RX', data: data.data });
      });

      return () => {
        unsubSerialData();
        unsubSerialError();
        unsubSerialClose();
        unsubTcpData();
        unsubUdpData();
      }
    }
    return undefined;
  }, []);

  return (
    <div className="flex flex-col h-screen w-full bg-[#f1f5f9] text-slate-800 overflow-hidden font-sans">
      
      {/* 顶部模拟标题栏拖拽区域 (配合 main/index.ts 的 titleBarStyle) */}
      <div 
        className="h-9 shrink-0 w-full flex items-center pointer-events-auto" 
        style={{ WebkitAppRegion: 'drag' } as any}
      >
        <div className="pl-4 text-xs font-semibold text-slate-400 tracking-wider">NexusDebug WebApp</div>
      </div>

      <div className="flex-1 w-full flex p-3 pt-0 gap-3">
        {/* 左侧固定宽度导航：合并了系统菜单和连接列表 */}
        <div className="w-[260px] flex-shrink-0 bg-slate-50/80 border border-slate-200/80 rounded-2xl flex flex-col shadow-xl shadow-slate-200/50 overflow-hidden relative backdrop-blur-md">
          <div className="h-full w-full" style={{ WebkitAppRegion: 'no-drag' } as any}>
            <NavigationSidebar />
          </div>
        </div>

        {/* 右侧主调试区域 (自适应撑满剩余空间) */}
        <div className="flex-1 bg-white flex flex-col h-full rounded-2xl border border-slate-200/60 shadow-xl shadow-slate-200/50 overflow-hidden relative">
          <div className="h-full w-full" style={{ WebkitAppRegion: 'no-drag' } as any}>
            <SessionView />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
