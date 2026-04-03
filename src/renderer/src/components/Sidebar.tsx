import { Activity, Network, Settings, TerminalSquare } from "lucide-react";

export function Sidebar() {
  return (
    <div className="w-14 h-full bg-[#09090b] border-r border-border flex flex-col items-center py-4 gap-6 shrink-0 z-10">
      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20 mb-2 hover:scale-105 transition-transform cursor-pointer">
        <TerminalSquare size={18} className="text-white" />
      </div>

      <div className="flex flex-col gap-4 w-full px-2">
        <SidebarIcon icon={<Activity size={20} />} active tooltip="串口调试" />
        <SidebarIcon icon={<Network size={20} />} tooltip="网络调试" />
      </div>

      <div className="mt-auto w-full px-2">
        <SidebarIcon icon={<Settings size={20} />} tooltip="设置" />
      </div>
    </div>
  );
}

function SidebarIcon({ icon, active }: { icon: React.ReactNode; active?: boolean; tooltip?: string }) {
  return (
    <div className={`w-full aspect-square flex items-center justify-center rounded-xl cursor-pointer transition-all duration-200 ${active ? 'bg-indigo-500/10 text-indigo-400 relative before:absolute before:left-0 before:w-1 before:h-1/2 before:bg-indigo-500 before:-translate-x-2 before:rounded-r-md' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'}`}>
      {icon}
    </div>
  );
}
