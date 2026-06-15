import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";
import { NotificationBell } from "@/components/ui/NotificationBell";
import { ShieldAlert, WifiOff, RefreshCcw } from "lucide-react";
import { usePresence } from "@/hooks/usePresence";
import { useAppStore } from "@/store/useAppStore";
import { useState } from "react";

export function AppLayout() {
  usePresence();
  const { isOnline, pendingActions, syncPendingActions, theme } = useAppStore();
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    setIsSyncing(true);
    await syncPendingActions();
    setIsSyncing(false);
  };

  return (
    <div className="min-h-screen pb-24 md:pb-0 md:pl-64 flex flex-col relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="fixed top-0 left-1/4 w-[500px] h-[500px] bg-royal-purple/20 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="fixed bottom-0 right-1/4 w-[400px] h-[400px] bg-deep-violet/30 rounded-full blur-[100px] pointer-events-none -z-10" />
      
      <Sidebar />
      
      <div className="flex-1 flex flex-col relative w-full h-full">
         <div className="w-full flex items-center justify-between px-4 md:px-8 py-4 sticky top-0 z-40 bg-[#0B0118]/60 backdrop-blur-sm border-b border-white/5 pt-6">
            <div className="flex md:hidden items-center gap-3">
              <img src={theme === "light" ? "/logo_purple.png" : "/logo.png"} alt="Logo" className="w-8 h-8 object-contain drop-shadow-[0_0_15px_rgba(120,81,169,0.5)]" />
              <div>
                <h1 className="font-bold tracking-wider text-sm uppercase text-white">Pistis Nexus</h1>
                <p className="text-[10px] text-lilac uppercase tracking-widest">Administrative System</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 ml-auto">
              {!isOnline && (
                <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-full">
                  <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider hidden sm:inline">Offline</span>
                </div>
              )}
              
              {pendingActions.length > 0 && (
                <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full">
                  <div className="flex items-center gap-1.5 text-lilac">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">{pendingActions.length} Pending</span>
                  </div>
                  {isOnline && (
                    <button 
                      onClick={handleSync}
                      disabled={isSyncing}
                      className="text-[10px] bg-emerald-500 hover:bg-emerald-400 text-black px-2 py-0.5 rounded font-bold transition-colors flex items-center gap-1 disabled:opacity-50"
                    >
                      <RefreshCcw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                      {isSyncing ? "Syncing..." : "Sync Now"}
                    </button>
                  )}
                </div>
              )}
              
              <NotificationBell />
            </div>
         </div>
         <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full z-10 relative">
           <Outlet />
         </main>
      </div>

      <BottomNav />
    </div>
  );
}
