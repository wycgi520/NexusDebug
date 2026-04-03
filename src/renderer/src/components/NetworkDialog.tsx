import { useState } from "react";
import { X, Network, Server } from "lucide-react";

interface NetworkDialogProps {
  type: 'TCP_CLIENT' | 'UDP';
  onClose: () => void;
  onConfirm: (config: any) => void;
}

export function NetworkDialog({ type, onClose, onConfirm }: NetworkDialogProps) {
  const isTcp = type === 'TCP_CLIENT';

  const [host, setHost] = useState('127.0.0.1');
  const [port, setPort] = useState(isTcp ? '8080' : '9000');

  const handleConfirm = () => {
    const portNum = parseInt(port, 10);
    if (isNaN(portNum) || portNum <= 0 || portNum > 65535) {
      alert('请输入有效的端口号 (1-65535)');
      return;
    }
    onConfirm({ host, port: portNum });
  };

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(15,23,42,0.35)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      {/* Dialog Box */}
      <div
        className="bg-white rounded-2xl shadow-2xl shadow-slate-300/50 border border-slate-200/80 w-80 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-md ${isTcp ? 'bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-indigo-200' : 'bg-gradient-to-br from-violet-500 to-violet-600 shadow-violet-200'}`}>
            {isTcp ? <Network size={16} className="text-white" /> : <Server size={16} className="text-white" />}
          </div>
          <div className="flex-1">
            <div className="font-bold text-slate-800 text-sm">{isTcp ? '新建 TCP 客户端' : '新建 UDP 服务端'}</div>
            <div className="text-[11px] text-slate-400 font-medium">{isTcp ? '主动连接到 TCP 服务器' : '绑定本地 UDP 端口监听'}</div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors">
            <X size={15} />
          </button>
        </div>

        {/* Form */}
        <div className="p-5 flex flex-col gap-4">
          {isTcp && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-slate-500 tracking-wider uppercase">目标主机</label>
              <input
                type="text"
                value={host}
                onChange={(e) => setHost(e.target.value)}
                placeholder="e.g. 192.168.1.100"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-mono text-slate-700 outline-none focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 transition-all"
              />
            </div>
          )}

          {!isTcp && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-slate-500 tracking-wider uppercase">绑定地址</label>
              <input
                type="text"
                value={host}
                onChange={(e) => setHost(e.target.value)}
                placeholder="e.g. 0.0.0.0"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-mono text-slate-700 outline-none focus:bg-white focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10 transition-all"
              />
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-slate-500 tracking-wider uppercase">
              {isTcp ? '目标端口' : '监听端口'}
            </label>
            <input
              type="number"
              value={port}
              onChange={(e) => setPort(e.target.value)}
              min={1}
              max={65535}
              placeholder="e.g. 8080"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-mono text-slate-700 outline-none focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 transition-all"
            />
          </div>

          <div className={`text-[11px] rounded-xl px-3 py-2.5 font-medium ${isTcp ? 'bg-indigo-50 text-indigo-600' : 'bg-violet-50 text-violet-600'}`}>
            {isTcp
              ? `将连接至 ${host}:${port}`
              : `将在 ${host}:${port} 监听 UDP 数据报`}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 px-5 pb-5">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            className={`flex-1 py-2.5 rounded-xl text-white text-sm font-bold shadow-md transition-all active:scale-95 ${isTcp ? 'bg-gradient-to-b from-indigo-500 to-indigo-600 shadow-indigo-200 hover:from-indigo-400 hover:to-indigo-500' : 'bg-gradient-to-b from-violet-500 to-violet-600 shadow-violet-200 hover:from-violet-400 hover:to-violet-500'}`}
          >
            {isTcp ? '连接' : '开始监听'}
          </button>
        </div>
      </div>
    </div>
  );
}
