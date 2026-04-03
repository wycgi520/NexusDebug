import { Plus, Search, Usb, Server } from "lucide-react";

export function ConnectionList() {
  return (
    <div className="flex flex-col h-full bg-[#0c0c0e]">
      <div className="flex items-center justify-between p-4 pb-2">
        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">Connections</span>
        <div className="w-5 h-5 rounded hover:bg-zinc-800 flex items-center justify-center cursor-pointer transition-colors text-zinc-400 hover:text-zinc-100">
          <Plus size={14} />
        </div>
      </div>
      
      <div className="px-3 pb-3">
        <div className="flex gap-2 items-center px-2.5 py-1.5 bg-[#18181b] border border-border rounded-md shadow-inner">
          <Search size={14} className="text-zinc-500" />
          <input type="text" placeholder="Search..." className="bg-transparent border-none outline-none text-xs w-full text-zinc-200 placeholder:text-zinc-600" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 flex flex-col gap-1.5 mt-1">
        <ConnectionItem icon={<Usb size={14} />} name="COM3 - DevKit" subtitle="115200, 8-N-1" active />
        <ConnectionItem icon={<Server size={14} />} name="ESP32 TCP" subtitle="192.168.1.100:8080" />
        <ConnectionItem icon={<Server size={14} />} name="Local UDP" subtitle="Port 9000 (Bind)" />
      </div>
    </div>
  );
}

function ConnectionItem({ icon, name, subtitle, active }: { icon: React.ReactNode; name: string; subtitle: string; active?: boolean }) {
  return (
    <div className={`px-2 py-2.5 rounded-lg cursor-pointer flex items-center gap-3 transition-all ${active ? 'bg-indigo-500/10 border border-indigo-500/20 shadow-sm' : 'hover:bg-zinc-800/50 border border-transparent'}`}>
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${active ? 'bg-indigo-500/20 text-indigo-400 drop-shadow-md' : 'bg-[#18181b] border border-border text-zinc-400'}`}>
        {icon}
      </div>
      <div className="flex flex-col overflow-hidden">
        <span className={`text-[13px] font-medium truncate ${active ? 'text-indigo-100' : 'text-zinc-300'}`}>{name}</span>
        <span className="text-[10px] text-zinc-500 truncate mt-0.5">{subtitle}</span>
      </div>
    </div>
  );
}
