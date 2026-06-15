import { useEffect, useState, useRef } from "react";
import { useAppStore } from "@/store/useAppStore";
import { motion, AnimatePresence } from "motion/react";
import { Wifi, WifiOff, X, RefreshCcw } from "lucide-react";

export function ConnectionToast() {
  const isOnline = useAppStore((state) => state.isOnline);
  const { pendingActions, syncPendingActions } = useAppStore();
  const [showToast, setShowToast] = useState(false);
  const [toastType, setToastType] = useState<"online" | "offline" | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const isFirstMount = useRef(true);

  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      // If started as offline, let's warn immediately
      if (!isOnline) {
        setToastType("offline");
        setShowToast(true);
      }
      return;
    }

    if (isOnline) {
      setToastType("online");
      setShowToast(true);
      const timer = setTimeout(() => {
        setShowToast(false);
      }, 5000);
      return () => clearTimeout(timer);
    } else {
      setToastType("offline");
      setShowToast(true);
    }
  }, [isOnline]);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await syncPendingActions();
    } catch (e) {
      console.error("Action Sync failed:", e);
    } finally {
      setIsSyncing(false);
      setShowToast(false);
    }
  };

  return (
    <AnimatePresence>
      {showToast && toastType && (
        <motion.div
          id="network-connection-toast"
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          className="fixed bottom-24 md:bottom-8 right-6 z-[9999] max-w-sm w-[calc(100%-3rem)] sm:w-[350px]"
        >
          <div className={`p-4 rounded-xl border backdrop-blur-md shadow-[0_10px_40px_rgba(0,0,0,0.6)] flex items-start gap-3 relative overflow-hidden ${
            toastType === "online" 
              ? "bg-[#091b15]/90 border-emerald-500/30 text-white" 
              : "bg-[#241304]/90 border-amber-500/30 text-white"
          }`}>
            <div className={`absolute top-0 left-0 w-1.5 h-full ${
              toastType === "online" ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
            }`} />
            
            <div className="flex-shrink-0 mt-0.5 animate-bounce">
              {toastType === "online" ? (
                <div className="bg-emerald-500/10 p-1.5 rounded-lg border border-emerald-500/20">
                  <Wifi className="w-5 h-5 text-emerald-400" />
                </div>
              ) : (
                <div className="bg-amber-500/10 p-1.5 rounded-lg border border-amber-500/20">
                  <WifiOff className="w-5 h-5 text-amber-500" />
                </div>
              )}
            </div>

            <div className="flex-1 pr-6">
              <h4 className="text-sm font-semibold tracking-wide">
                {toastType === "online" ? "Connection Restored" : "Offline Mode Enabled"}
              </h4>
              <p className="text-xs text-lavender/80 mt-1 leading-relaxed">
                {toastType === "online" 
                  ? "You are back online. All features, real-time sync, and database access are fully active." 
                  : "You are currently disconnected. Changes will be cached locally and synced automatically once your network resolves."}
              </p>
              
              {toastType === "online" && pendingActions.length > 0 && (
                <button
                  type="button"
                  id="sync-connection-btn"
                  onClick={handleSync}
                  disabled={isSyncing}
                  className="mt-3 text-xs bg-emerald-500 hover:bg-emerald-400 text-black px-3 py-1.5 rounded-lg font-semibold transition-all duration-200 flex items-center gap-1.5 shadow-[0_0_15px_rgba(52,211,153,0.3)] cursor-pointer"
                >
                  <RefreshCcw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  {isSyncing ? "Syncing..." : `Sync ${pendingActions.length} Pending Actions`}
                </button>
              )}
            </div>

            <button
              onClick={() => setShowToast(false)}
              className="flex-shrink-0 p-1 hover:bg-white/10 rounded-full transition-colors text-white/40 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
