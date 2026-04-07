import { Send, Settings2, Trash2, Pause, FastForward } from "lucide-react";
import { useAppStore } from "../store";
import { useState, useRef, useEffect } from "react";

/**
 * Parse a hex string like "FF 01 A2 B3" or "FF,01,A2,B3" or "FF01A2B3"
 * into a number[] of byte values.
 * Returns null if the input is invalid.
 */
function parseHexString(input: string): number[] | null {
  // Remove all whitespace, commas, and common separators
  const cleaned = input.replace(/[\s,;:\-]/g, '');
  // Must be even length and only hex chars
  if (cleaned.length === 0 || cleaned.length % 2 !== 0 || !/^[0-9a-fA-F]+$/.test(cleaned)) {
    return null;
  }
  const bytes: number[] = [];
  for (let i = 0; i < cleaned.length; i += 2) {
    bytes.push(parseInt(cleaned.substring(i, i + 2), 16));
  }
  return bytes;
}

export function SessionView() {
  const { activeSessionId, sessions, addLog, clearLogs } = useAppStore();
  const [inputText, setInputText] = useState("Hello Nexus!");
  const [hexMode, setHexMode] = useState(false);
  const [appendCRLF, setAppendCRLF] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const activeSession = sessions.find(s => s.id === activeSessionId);

  // Auto scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeSession?.logs]);

  if (!activeSession) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-50/50">
        <div className="text-slate-400 font-medium tracking-wide">请在左侧选择或新建一个连接回话</div>
      </div>
    );
  }

  const handleSend = () => {
    if (activeSession.status !== 'CONNECTED') {
      alert("设备未连接，无法发送");
      return;
    }

    let dataToSend: number[];

    if (hexMode) {
      // HEX mode: parse hex string into raw bytes
      const parsed = parseHexString(inputText);
      if (parsed === null) {
        alert("HEX 格式错误！请输入有效的十六进制字符串，例如：FF 01 A2 B3");
        return;
      }
      dataToSend = parsed;
      // In HEX mode, optionally append \r\n as 0x0D 0x0A
      if (appendCRLF) {
        dataToSend = [...dataToSend, 0x0D, 0x0A];
      }
    } else {
      // ASCII mode: encode as UTF-8 text
      const text = appendCRLF ? inputText + '\r\n' : inputText;
      dataToSend = Array.from(new TextEncoder().encode(text));
    }

    if (dataToSend.length === 0) {
      return;
    }

    if (activeSession.type === 'SERIAL') {
      window.api.serialWrite({ path: activeSession.id, data: dataToSend });
      addLog(activeSession.id, { dir: 'TX', data: dataToSend });
    } else if (activeSession.type === 'TCP_CLIENT') {
      window.api.tcpWrite({ id: activeSession.id, data: dataToSend });
      addLog(activeSession.id, { dir: 'TX', data: dataToSend });
    } else if (activeSession.type === 'UDP') {
      const { host, port } = activeSession.config;
      window.api.udpWrite({ id: activeSession.id, data: dataToSend, targetHost: host, targetPort: port });
      addLog(activeSession.id, { dir: 'TX', data: dataToSend });
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-white">
      {/* 顶部页签/状态栏 */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100 bg-white/50 backdrop-blur-sm z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className={`w-2.5 h-2.5 rounded-full ${activeSession.status === 'CONNECTED' ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)] animate-pulse' : 'bg-slate-300'}`}></div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-slate-800 tracking-wide">{activeSession.name}</span>
            <span className={`text-[11px] font-medium ${activeSession.status === 'CONNECTED' ? 'text-emerald-600' : 'text-slate-400'}`}>
              {activeSession.status} • {activeSession.type === 'SERIAL' ? `${activeSession.config.baudRate}bps` : 'Net'}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <ToolbarButton icon={<Pause size={14} />} label="暂停" danger />
          <div onClick={() => clearLogs(activeSession.id)}>
             <ToolbarButton icon={<Trash2 size={14} />} label="清空" />
          </div>
          <ToolbarButton icon={<FastForward size={14} />} label="自动滚动" active />
          <div className="w-px h-4 bg-slate-200 mx-2"></div>
          <ToolbarButton icon={<Settings2 size={14} />} label="显示格式" />
        </div>
      </div>

      {/* 日志数据显示区 */}
      <div className="flex-1 overflow-hidden flex flex-col bg-slate-50/50 relative">
        <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none"></div>
        
        {/* 数据表头 (悬浮版) */}
        <div className="flex items-center text-[10px] font-bold text-slate-400 bg-white/80 backdrop-blur border border-slate-200/60 backdrop-saturate-150 py-2.5 px-3 rounded-xl shadow-sm z-10 m-4 mb-2 whitespace-nowrap shrink-0">
            <div className="w-28 pl-2">TIMESTAMP</div>
            <div className="w-14">DIR</div>
            <div className="w-[40%]">HEX DATA</div>
            <div className="flex-1">DECODED TEXT</div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-4 font-mono text-[13px] relative z-0 flex flex-col gap-1.5" ref={scrollRef}>
          {activeSession.logs.map(log => (
            <DataLine 
              key={log.id} 
              time={log.timestamp} 
              dir={log.dir} 
              hex={log.data.map(b => b.toString(16).padStart(2,'0').toUpperCase()).join(' ')} 
              text={new TextDecoder().decode(new Uint8Array(log.data))} 
              isError={log.isError} 
            />
          ))}
          {activeSession.logs.length === 0 && (
             <div className="text-center pt-10 text-slate-400 text-xs font-sans tracking-wide">Waiting for data on {activeSession.name}...</div>
          )}
        </div>
      </div>

      {/* 底部发送区 */}
      <div className="border-t border-slate-100 bg-white p-4 shadow-[0_-10px_30px_rgba(0,0,0,0.02)] z-10 shrink-0">
        <div className="flex items-center gap-4 mb-3 px-1">
           <div className="flex items-center bg-slate-100 rounded-lg p-0.5 shadow-inner">
             <button onClick={() => setHexMode(false)} className={`px-4 py-1 text-[11px] font-bold rounded-md transition-colors ${!hexMode ? 'text-indigo-600 bg-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>ASCII</button>
             <button onClick={() => setHexMode(true)} className={`px-4 py-1 text-[11px] font-bold rounded-md transition-colors ${hexMode ? 'text-indigo-600 bg-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>HEX</button>
           </div>
           
           <div className="flex items-center gap-4 ml-auto">
             <label className="flex items-center gap-2 text-xs font-medium text-slate-600 cursor-pointer hover:text-slate-800 transition-colors">
               <input type="checkbox" className="w-4 h-4 rounded text-indigo-500 focus:ring-indigo-500 border-slate-300" checked={appendCRLF} onChange={(e) => setAppendCRLF(e.target.checked)} /> 追加 \r\n
             </label>
             <label className="flex items-center gap-2 text-xs font-medium text-slate-600 cursor-pointer hover:text-slate-800 transition-colors">
               <input type="checkbox" className="w-4 h-4 rounded text-indigo-500 focus:ring-indigo-500 border-slate-300" /> 循环定时发送
             </label>
           </div>
        </div>
        
        <div className="flex gap-3 h-24">
          <textarea 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-3 text-[13px] font-mono text-slate-700 resize-none outline-none focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-400 shadow-inner" 
            placeholder={hexMode ? "输入十六进制数据，例如：FF 01 A2 B3" : "Type message here... (Ctrl+Enter to send)"}
            onKeyDown={(e) => {
              if (e.ctrlKey && e.key === 'Enter') handleSend();
            }}
          />
          <button onClick={handleSend} className="w-24 bg-gradient-to-b from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 active:scale-95 transition-all outline-none rounded-xl shadow-[0_8px_20px_rgba(79,70,229,0.3)] text-white flex flex-col items-center justify-center gap-1.5 border border-indigo-400/50">
            <Send size={18} className="translate-x-0.5" />
            <span className="text-[10px] font-bold tracking-widest mt-0.5">SEND</span>
          </button>
        </div>
      </div>
    </div>
  )
}

function ToolbarButton({icon, label, danger, active}: any) {
  return (
    <button className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 text-[11px] font-semibold transition-all shadow-sm border cursor-pointer ${danger ? 'text-rose-600 bg-rose-50 border-rose-100 hover:bg-rose-100' : active ? 'text-indigo-600 bg-indigo-50 border-indigo-100' : 'text-slate-600 bg-white border-slate-200 hover:bg-slate-50 hover:text-slate-800'}`}>
      {icon} {label}
    </button>
  );
}

function DataLine({time, dir, hex, text, isError}: any) {
  const isTx = dir === 'TX';
  return (
    <div className={`flex items-start py-2 px-3 rounded-xl group transition-colors ${isError ? 'bg-rose-50/80 hover:bg-rose-100/80' : 'hover:bg-white border border-transparent hover:border-slate-100 hover:shadow-sm'}`}>
      <div className="w-28 shrink-0 text-slate-400 font-sans tracking-wide pt-0.5 select-none text-[11px]">{time}</div>
      <div className="w-14 shrink-0 font-bold select-none">
        <span className={`inline-flex items-center justify-center px-1.5 py-0.5 rounded shadow-sm text-[10px] border ${isTx ? 'bg-indigo-50 border-indigo-100 text-indigo-600' : isError ? 'bg-rose-50 border-rose-100 text-rose-600' : 'bg-emerald-50 border-emerald-100 text-emerald-600'}`}>
            {dir}
        </span>
      </div>
      <div className={`w-[40%] shrink-0 pr-4 break-words leading-[1.6] uppercase ${isError ? 'text-rose-500/80' : 'text-slate-500'}`}>{hex}</div>
      <div className={`flex-1 break-words font-medium whitespace-pre-wrap ${isTx ? 'text-indigo-700' : isError ? 'text-rose-600' : 'text-slate-700'}`}>{text}</div>
    </div>
  )
}
