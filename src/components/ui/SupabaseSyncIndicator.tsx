import React, { useState, useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { motion, AnimatePresence } from "motion/react";
import { 
  Database, 
  RefreshCw, 
  Wifi, 
  WifiOff, 
  CheckCircle2, 
  AlertCircle, 
  ArrowUp, 
  ArrowDown, 
  Clock,
  Sparkles,
  ChevronDown,
  Info
} from "lucide-react";

export function SupabaseSyncIndicator() {
  const { 
    isOnline, 
    supabaseSyncStatus, 
    lastSyncTime, 
    pendingActions, 
    pingSupabaseStatus,
    syncPendingActions,
    theme
  } = useAppStore();

  const [isOpen, setIsOpen] = useState(false);
  const [latency, setLatency] = useState<number | null>(null);
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [lastCheckTime, setLastCheckTime] = useState<string>("");

  useEffect(() => {
    // Measure actual latency on mount and when connection comes online
    if (isOnline) {
      measureLatency();
    } else {
      setLatency(null);
    }
  }, [isOnline]);

  useEffect(() => {
    setLastCheckTime(new Date().toLocaleTimeString());
  }, [lastSyncTime]);

  const measureLatency = async () => {
    if (!isOnline) return;
    setIsMeasuring(true);
    const start = Date.now();
    try {
      await pingSupabaseStatus();
      const elapsed = Date.now() - start;
      setLatency(elapsed);
    } catch (err) {
      console.warn("Latency measure failed:", err);
      setLatency(null);
    } finally {
      setIsMeasuring(false);
    }
  };

  const forceSync = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (pendingActions.length > 0) {
      await syncPendingActions();
    } else {
      await measureLatency();
    }
  };

  // Build the styles based on the status
  const getStatusConfig = () => {
    switch (supabaseSyncStatus) {
      case "syncing":
        return {
          color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/30",
          dotColor: "bg-indigo-400 animate-ping",
          label: "Pushing Data",
          icon: RefreshCw,
          spin: true
        };
      case "pulling":
        return {
          color: "text-sky-400 bg-sky-500/10 border-sky-500/30",
          dotColor: "bg-sky-400 animate-pulse",
          label: "Pulling Data",
          icon: ArrowDown,
          spin: true
        };
      case "offline":
        return {
          color: "text-amber-400 bg-amber-500/10 border-amber-500/30",
          dotColor: "bg-amber-500",
          label: "Offline Mode",
          icon: WifiOff,
          spin: false
        };
      case "error":
        return {
          color: "text-rose-400 bg-rose-500/10 border-rose-500/30",
          dotColor: "bg-rose-500 animate-bounce",
          label: "Sync Error",
          icon: AlertCircle,
          spin: false
        };
      case "synced":
      default:
        return {
          color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
          dotColor: "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]",
          label: "Cloud Synced",
          icon: CheckCircle2,
          spin: false
        };
    }
  };

  const config = getStatusConfig();
  const StatusIcon = config.icon;

  return (
    <div className="relative font-sans select-none" id="supabase-sync-telemetry-indicator">
      {/* Mini status pill */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold cursor-pointer transition-all hover:bg-white/5 active:scale-95 ${config.color}`}
      >
        <span className="relative flex h-2 w-2">
          {supabaseSyncStatus !== "offline" && supabaseSyncStatus !== "error" && (
            <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${config.dotColor}`} />
          )}
          <span className={`relative inline-flex rounded-full h-2 w-2 ${config.dotColor}`} />
        </span>
        
        <Database className="w-3.5 h-3.5" />
        
        <span className="hidden sm:inline-block tracking-wide">
          {config.label}
        </span>

        {pendingActions.length > 0 && (
          <span className="bg-amber-500 text-black font-extrabold text-[9px] px-1.5 py-0.5 rounded-full animate-bounce">
            {pendingActions.length}
          </span>
        )}

        <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </div>

      {/* Expanded Status Portal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Click outside backdrop overlay */}
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)} 
            />
            
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className={`absolute right-0 mt-2 w-72 rounded-2xl border p-4 shadow-2xl z-50 backdrop-blur-xl ${
                theme === "light"
                  ? "bg-white/95 border-slate-200 text-slate-800"
                  : "bg-[#110524]/95 border-white/10 text-white"
              }`}
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div className="flex items-center gap-2">
                  <span className={`p-1.5 rounded-lg ${
                    supabaseSyncStatus === "synced" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"
                  }`}>
                    <Database className="w-4 h-4" />
                  </span>
                  <div>
                    <h4 className="text-xs font-bold tracking-wide uppercase">Pistis Cloud Core</h4>
                    <p className="text-[9px] text-lilac/75 uppercase tracking-widest">Supabase Engine</p>
                  </div>
                </div>

                <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  isOnline ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"
                }`}>
                  {isOnline ? "Online" : "Offline"}
                </div>
              </div>

              {/* Status details body */}
              <div className="space-y-3.5 py-4">
                {/* Active Sync State */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-lilac/80 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-royal-purple" /> Sync State
                  </span>
                  <span className={`font-semibold flex items-center gap-1.5 ${config.color.split(" ")[0]}`}>
                    <StatusIcon className={`w-3.5 h-3.5 ${config.spin ? "animate-spin" : ""}`} />
                    {config.label}
                  </span>
                </div>

                {/* DB Latency (Heartbeat) */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-lilac/80 flex items-center gap-1">
                    <Wifi className="w-3 h-3 text-sky-400" /> API Latency
                  </span>
                  <span className="font-mono text-[11px] text-white">
                    {isMeasuring ? (
                      <span className="text-lilac/60 animate-pulse">measuring...</span>
                    ) : latency !== null ? (
                      <span className={latency < 100 ? "text-emerald-400" : latency < 300 ? "text-amber-400" : "text-rose-400"}>
                        {latency} ms
                      </span>
                    ) : (
                      <span className="text-lilac/45">Unavailable</span>
                    )}
                  </span>
                </div>

                {/* Queue count */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-lilac/80 flex items-center gap-1">
                    <ArrowUp className="w-3 h-3 text-indigo-400" /> Outgoing Queue
                  </span>
                  <span className={`font-mono font-bold ${pendingActions.length > 0 ? "text-amber-400 animate-pulse" : "text-lilac/60"}`}>
                    {pendingActions.length} pending actions
                  </span>
                </div>

                {/* Sync Timestamp */}
                <div className="flex items-center justify-between text-[11px] text-lilac/65 border-t border-white/5 pt-3">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-lilac/50" /> Last Sync Checked
                  </span>
                  <span className="font-mono text-white/90">
                    {lastCheckTime || "Never"}
                  </span>
                </div>
              </div>

              {/* Trigger actions */}
              <button
                type="button"
                onClick={forceSync}
                disabled={!isOnline || isMeasuring}
                className="w-full py-2 bg-royal-purple/20 hover:bg-royal-purple/40 border border-royal-purple/30 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${(isMeasuring || supabaseSyncStatus === "syncing") ? "animate-spin" : ""}`} />
                {pendingActions.length > 0 ? "Push Queued Updates" : "Check Live Latency"}
              </button>

              <div className="mt-3 flex items-start gap-1 p-2 rounded-lg bg-indigo-500/5 border border-indigo-500/10 text-[9px] leading-normal text-lilac/85">
                <Info className="w-3 h-3 text-indigo-400 shrink-0 mt-0.5" />
                <span>
                  All reports, directory updates, and metrics sync directly with database. In offline status, changes pile up in outgoing queues for immediate release.
                </span>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
