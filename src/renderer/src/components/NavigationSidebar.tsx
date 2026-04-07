import { Settings, TerminalSquare, Plus, Search, Usb, Server, X, Network } from "lucide-react";
import { useAppStore } from "../store";
import { useState, useEffect } from "react";
import { NetworkDialog } from "./NetworkDialog";
import { SerialDialog } from "./SerialDialog";

export function NavigationSidebar() {
  const { sessions, activeSessionId, availableSerialPorts, fetchSerialPorts, addSession, setActiveSession, removeSession, updateSessionStatus } = useAppStore();
  const [showNewConn, setShowNewConn] = useState(false);
  const [networkDialog, setNetworkDialog] = useState<'TCP_CLIENT' | 'UDP' | null>(null);
  const [showSerialDialog, setShowSerialDialog] = useState(false);

  useEffect(() => {
    fetchSerialPorts();
  }, []);

  const handleCreateTcp = async (config: { host: string; port: number }) => {
    setNetworkDialog(null);
    setShowNewConn(false);
    const sessionId = `tcp-client-${config.host}:${config.port}`;
    if (!sessions.find(s => s.id === sessionId)) {
      addSession({
        id: sessionId,
        type: 'TCP_CLIENT',
        name: `TCP: ${config.host}:${config.port}`,
        status: 'CONNECTING',
        config,
        logs: []
      });
    } else {
      setActiveSession(sessionId);
      return;
    }
    try {
      const res = await window.api.tcpConnect({ host: config.host, port: config.port });
      if (res.success) {
        updateSessionStatus(sessionId, 'CONNECTED');
      } else {
        updateSessionStatus(sessionId, 'DISCONNECTED');
        alert(`TCP 连接失败: ${res.error}`);
      }
    } catch (e: any) {
      updateSessionStatus(sessionId, 'DISCONNECTED');
      alert(`TCP 连接异常: ${e?.message || e}`);
    }
  };

  const handleCreateUdp = async (config: { host: string; port: number }) => {
    setNetworkDialog(null);
    setShowNewConn(false);
    const sessionId = `udp-${config.host}:${config.port}`;
    if (!sessions.find(s => s.id === sessionId)) {
      addSession({
        id: sessionId,
        type: 'UDP',
        name: `UDP: ${config.host}:${config.port}`,
        status: 'CONNECTING',
        config,
        logs: []
      });
    } else {
      setActiveSession(sessionId);
      return;
    }
    try {
      const res = await window.api.udpBind({ port: config.port, address: config.host });
      if (res.success) {
        updateSessionStatus(sessionId, 'CONNECTED');
      } else {
        updateSessionStatus(sessionId, 'DISCONNECTED');
        alert(`UDP 绑定失败: ${res.error}`);
      }
    } catch (e: any) {
      updateSessionStatus(sessionId, 'DISCONNECTED');
      alert(`UDP 绑定异常: ${e?.message || e}`);
    }
  };

  const handleConnectSerial = async (config: { path: string; baudRate: number }) => {
    setShowSerialDialog(false);
    setShowNewConn(false);
    const sessionId = config.path;
    // Check if session exists first
    if (!sessions.find(s => s.id === sessionId)) {
      addSession({
        id: sessionId,
        type: 'SERIAL',
        name: `Serial: ${config.path}`,
        status: 'CONNECTING',
        config: { path: config.path, baudRate: config.baudRate },
        logs: []
      });
    } else {
      setActiveSession(sessionId);
      return;
    }

    try {
      updateSessionStatus(sessionId, 'CONNECTING');
      const res = await window.api.serialConnect({ path: config.path, baudRate: config.baudRate });
      if (res.success) {
        updateSessionStatus(sessionId, 'CONNECTED');
      } else {
        updateSessionStatus(sessionId, 'DISCONNECTED');
        console.error('Connection failed:', res.error);
        alert(`连接 ${config.path} 失败: ${res.error}`);
      }
    } catch (e: any) {
      console.error(e);
      updateSessionStatus(sessionId, 'DISCONNECTED');
      alert(`连接异常: ${e?.message || e}`);
    }
  };

  return (
    <div className="w-full h-full flex flex-col overflow-hidden relative">
      {/* 顶部标题区域 */}
      <div className="h-16 shrink-0 flex items-center justify-between px-5">
        <div className="flex items-center gap-3 w-full">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-md shadow-indigo-200">
            <TerminalSquare size={16} className="text-white" />
          </div>
          <span className="font-bold text-slate-800 text-[15px] tracking-wide">NexusDebug</span>
        </div>
        <button 
          onClick={() => {
            fetchSerialPorts();
            setShowNewConn(!showNewConn);
          }}
          className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center transition-all ${showNewConn ? 'bg-indigo-100 text-indigo-600 rotate-45' : 'hover:bg-slate-200/60 text-slate-500'}`}>
          <Plus size={18} />
        </button>
      </div>

      {/* 搜索框 */}
      <div className="px-5 py-1">
        <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl border border-slate-200/80 shadow-sm shadow-slate-100/50 focus-within:border-indigo-300 focus-within:ring-4 focus-within:ring-indigo-50/50 transition-all">
          <Search size={16} className="text-slate-400" />
          <input type="text" placeholder="搜索连接配置..." className="bg-transparent border-none outline-none text-[13px] w-full text-slate-700 placeholder:text-slate-400 font-medium" />
        </div>
      </div>

      {/* 连接列表模块 */}
      <div className="flex-1 overflow-y-auto mt-4 px-4 flex flex-col gap-1.5 pb-4">
        
        {showNewConn && (
          <div className="mb-4 bg-white p-3 rounded-2xl border border-indigo-100 shadow-lg shadow-indigo-100/30">
            <div className="text-[11px] font-bold text-slate-400 mb-2 px-1">快速创建连接</div>
            <div onClick={() => { fetchSerialPorts(); setShowSerialDialog(true); }} className="px-3 py-2 rounded-xl text-[13px] hover:bg-emerald-50 hover:text-emerald-700 cursor-pointer font-medium text-slate-700 flex items-center gap-2 transition-colors">
              <Usb size={13} className="text-emerald-500" /> 串口连接
              {availableSerialPorts.length > 0 && (
                <span className="ml-auto text-[10px] font-bold text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded-md">{availableSerialPorts.length} 可用</span>
              )}
            </div>
            <div className="w-full h-px bg-slate-100 my-1"></div>
            <div onClick={() => setNetworkDialog('TCP_CLIENT')} className="px-3 py-2 rounded-xl text-[13px] hover:bg-indigo-50 hover:text-indigo-700 cursor-pointer font-medium text-slate-700 flex items-center gap-2 transition-colors">
              <Network size={13} className="text-indigo-400" /> TCP 客户端
            </div>
            <div onClick={() => setNetworkDialog('UDP')} className="px-3 py-2 rounded-xl text-[13px] hover:bg-violet-50 hover:text-violet-700 cursor-pointer font-medium text-slate-700 flex items-center gap-2 transition-colors">
              <Server size={13} className="text-violet-400" /> UDP 服务端
            </div>
          </div>
        )}

        <div className="px-2 py-1 text-[11px] font-bold text-slate-400 tracking-wider">活跃连接 ({sessions.length})</div>
        {sessions.map(s => (
          <ConnectionItem 
            key={s.id}
            icon={s.type === 'SERIAL' ? <Usb size={16} /> : <Server size={16} />} 
            name={s.name} 
            subtitle={s.status} 
            active={s.id === activeSessionId}
            onClick={() => setActiveSession(s.id)}
            onRemove={() => {
              if (s.type === 'SERIAL' && s.status === 'CONNECTED') window.api.serialDisconnect(s.id);
              removeSession(s.id);
            }}
          />
        ))}

        {sessions.length === 0 && !showNewConn && (
          <div className="flex flex-col items-center justify-center p-6 mt-4 opacity-50 select-none pointer-events-none">
            <TerminalSquare size={48} className="text-slate-300 mb-2"/>
            <span className="text-xs font-semibold text-slate-400">暂无活跃会话</span>
            <span className="text-[10px] text-slate-400 mt-1">点击右上角 + 创建连接</span>
          </div>
        )}
      </div>

      {/* 底部设置 */}
      <div className="p-3 shrink-0 border-t border-slate-200/50 bg-slate-50/50">
        <div className="flex items-center gap-3 p-2.5 rounded-xl text-slate-600 hover:bg-slate-200/50 cursor-pointer transition-colors">
          <Settings size={18} className="text-slate-500" />
          <span className="text-[13px] font-semibold">软件全局设置</span>
        </div>
      </div>
      {/* Serial Config Dialog */}
      {showSerialDialog && (
        <SerialDialog
          availablePorts={availableSerialPorts}
          onClose={() => setShowSerialDialog(false)}
          onConfirm={handleConnectSerial}
        />
      )}
      {/* Network Config Dialog */}
      {networkDialog && (
        <NetworkDialog
          type={networkDialog}
          onClose={() => setNetworkDialog(null)}
          onConfirm={networkDialog === 'TCP_CLIENT' ? handleCreateTcp : handleCreateUdp}
        />
      )}
    </div>
  );
}

function ConnectionItem({ icon, name, subtitle, active, onClick, onRemove }: any) {
  const isConnected = subtitle === 'CONNECTED';
  return (
    <div onClick={onClick} className={`group p-2.5 rounded-2xl cursor-pointer flex items-center gap-3 transition-all duration-200 ${active ? 'bg-indigo-50 border border-indigo-100 shadow-sm shadow-indigo-100/30' : 'hover:bg-white border border-transparent shadow-sm shadow-transparent hover:shadow-slate-200/50'}`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${active ? 'bg-indigo-500 text-white shadow-md shadow-indigo-200' : 'bg-slate-100/80 border border-slate-200/50 text-slate-500 group-hover:bg-slate-100 group-hover:text-slate-700 group-hover:border-slate-200'}`}>
        {icon}
      </div>
      <div className="flex flex-col overflow-hidden flex-1">
        <span className={`text-[13px] font-semibold truncate ${active ? 'text-indigo-900' : 'text-slate-700'}`}>{name}</span>
        <span className={`text-[11px] truncate mt-0.5 font-bold ${isConnected ? 'text-emerald-500' : 'text-slate-400'}`}>{subtitle}</span>
      </div>
      <button onClick={(e) => { e.stopPropagation(); onRemove(); }} className={`pr-1 hover:text-slate-500 transition-opacity ${active ? 'opacity-100 text-slate-400 hover:text-rose-500' : 'opacity-0 group-hover:opacity-100 text-slate-300'}`}>
        <X size={16} />
      </button>
    </div>
  );
}
