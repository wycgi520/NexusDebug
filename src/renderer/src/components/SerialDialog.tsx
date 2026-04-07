import { useState } from "react";
import { X, Usb, ChevronDown } from "lucide-react";

const COMMON_BAUD_RATES = [
  300, 1200, 2400, 4800, 9600, 14400, 19200, 38400,
  57600, 115200, 230400, 460800, 921600
];

interface SerialDialogProps {
  availablePorts: any[];
  onClose: () => void;
  onConfirm: (config: { path: string; baudRate: number }) => void;
}

export function SerialDialog({ availablePorts, onClose, onConfirm }: SerialDialogProps) {
  const [portPath, setPortPath] = useState('');
  const [baudRate, setBaudRate] = useState('115200');
  const [showPortDropdown, setShowPortDropdown] = useState(false);

  const handleConfirm = () => {
    const trimmed = portPath.trim();
    if (!trimmed) {
      alert('请输入或选择一个串口名称');
      return;
    }
    const br = parseInt(baudRate, 10);
    if (isNaN(br) || br <= 0) {
      alert('请输入有效的波特率');
      return;
    }
    onConfirm({ path: trimmed, baudRate: br });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(15,23,42,0.35)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl shadow-slate-300/50 border border-slate-200/80 w-[340px] overflow-hidden animate-in"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: 'dialogIn 0.2s ease-out' }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-md bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-200">
            <Usb size={16} className="text-white" />
          </div>
          <div className="flex-1">
            <div className="font-bold text-slate-800 text-sm">新建串口连接</div>
            <div className="text-[11px] text-slate-400 font-medium">输入串口名称并选择波特率</div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors">
            <X size={15} />
          </button>
        </div>

        {/* Form */}
        <div className="p-5 flex flex-col gap-4">
          {/* Port Path Input with Dropdown */}
          <div className="flex flex-col gap-1.5 relative">
            <label className="text-[11px] font-bold text-slate-500 tracking-wider uppercase">串口名称</label>
            <div className="relative">
              <input
                type="text"
                value={portPath}
                onChange={(e) => setPortPath(e.target.value)}
                onFocus={() => setShowPortDropdown(true)}
                placeholder="输入串口名称，例如 COM3"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 pr-9 text-sm font-mono text-slate-700 outline-none focus:bg-white focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10 transition-all"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleConfirm();
                }}
              />
              {availablePorts.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowPortDropdown(!showPortDropdown)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-md hover:bg-slate-200/80 flex items-center justify-center text-slate-400 transition-colors"
                >
                  <ChevronDown size={14} className={`transition-transform ${showPortDropdown ? 'rotate-180' : ''}`} />
                </button>
              )}
            </div>

            {/* Dropdown */}
            {showPortDropdown && availablePorts.length > 0 && (
              <div
                className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg shadow-slate-200/60 z-10 overflow-hidden"
                onMouseDown={(e) => e.preventDefault()} // prevent blur before click
              >
                <div className="text-[10px] font-bold text-slate-400 px-3 pt-2.5 pb-1 uppercase tracking-wider">
                  已发现的串口 ({availablePorts.length})
                </div>
                {availablePorts.map((sp) => (
                  <div
                    key={sp.path}
                    onClick={() => {
                      setPortPath(sp.path);
                      setShowPortDropdown(false);
                    }}
                    className={`px-3 py-2 text-sm font-mono cursor-pointer flex items-center justify-between transition-colors ${
                      portPath === sp.path
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span className="font-semibold">{sp.path}</span>
                    {sp.manufacturer && (
                      <span className="text-[10px] text-slate-400 font-sans">{sp.manufacturer}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Baud Rate Select */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-slate-500 tracking-wider uppercase">波特率</label>
            <select
              value={baudRate}
              onChange={(e) => setBaudRate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-mono text-slate-700 outline-none focus:bg-white focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10 transition-all appearance-none cursor-pointer"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                backgroundPosition: 'right 0.5rem center',
                backgroundRepeat: 'no-repeat',
                backgroundSize: '1.5em 1.5em',
              }}
            >
              {COMMON_BAUD_RATES.map((br) => (
                <option key={br} value={br}>
                  {br.toLocaleString()} bps
                </option>
              ))}
            </select>
          </div>

          {/* Preview */}
          <div className="text-[11px] rounded-xl px-3 py-2.5 font-medium bg-emerald-50 text-emerald-600">
            {portPath.trim()
              ? `将连接 ${portPath.trim()} @ ${parseInt(baudRate).toLocaleString()} bps`
              : '请输入串口名称以继续'}
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
            className="flex-1 py-2.5 rounded-xl text-white text-sm font-bold shadow-md transition-all active:scale-95 bg-gradient-to-b from-emerald-500 to-teal-600 shadow-emerald-200 hover:from-emerald-400 hover:to-teal-500"
          >
            连接
          </button>
        </div>
      </div>
    </div>
  );
}
