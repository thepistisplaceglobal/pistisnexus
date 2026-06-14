import { useState, useRef, useEffect } from "react";
import { Bell } from "lucide-react";
import { GlassCard } from "./GlassCard";

const mockNotifications = [
  { id: 1, type: "broadcast", title: "New Global Broadcast", message: "Global leaders retreat dates announced.", time: "10m ago" },
  { id: 2, type: "event", title: "Upcoming Birthday", message: "Ekemini Iyanam's birthday is today.", time: "1h ago" },
  { id: 3, type: "event", title: "Upcoming Birthday", message: "Tessy Peter's birthday is tomorrow.", time: "3h ago" },
  { id: 4, type: "report", title: "Pending Report", message: "Calabar monthly growth metrics are ready for review.", time: "1d ago" },
];

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Example count combining broadcasts and events
  const unreadCount = mockNotifications.filter(n => ['broadcast', 'event'].includes(n.type)).length;

  const playNotificationSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
      oscillator.frequency.exponentialRampToValueAtTime(1760, audioCtx.currentTime + 0.1); // A6
      
      gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.1, audioCtx.currentTime + 0.05);
      gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.15);
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 0.15);
    } catch (e) {
      console.error('Audio playback failed', e);
    }
  };

  const toggleOpen = () => {
    if (!isOpen && unreadCount > 0) {
      playNotificationSound();
    }
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={toggleOpen}
        className="relative p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 text-lilac" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white border-2 border-[#0B0118]">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-3 w-80 p-0 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 bg-[#120524] border border-royal-purple/60 rounded-2xl shadow-[0_12px_45px_rgba(0,0,0,0.8)]">
          <div className="p-4 border-b border-[#251240] flex items-center justify-between bg-[#190a30]">
            <h3 className="text-sm font-bold tracking-wide uppercase text-lilac">Notifications</h3>
            <span className="text-xs bg-[#2e1554] px-2 py-0.5 rounded text-white font-medium">{mockNotifications.length} New</span>
          </div>
          <div className="flex flex-col max-h-[320px] overflow-y-auto scrollbar-hide p-2 gap-1 bg-[#120524]">
            {mockNotifications.map((notif) => (
              <div key={notif.id} className="p-3 rounded-lg hover:bg-white/5 transition-colors cursor-pointer group">
                <div className="flex justify-between items-start mb-1">
                  <h4 className="text-sm font-semibold text-white group-hover:text-lilac transition-colors">{notif.title}</h4>
                  <span className="text-[10px] text-lilac/40">{notif.time}</span>
                </div>
                <p className="text-xs text-white/80 leading-relaxed">{notif.message}</p>
              </div>
            ))}
          </div>
          <div className="p-3 border-t border-[#251240] text-center bg-[#190a30]">
            <button className="text-xs font-semibold text-lilac hover:text-white transition-colors">
              Mark all as read
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
