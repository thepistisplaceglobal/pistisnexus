import { useAppStore } from "@/store/useAppStore";
import { Megaphone, MessageCircle, X } from "lucide-react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";

export function NotificationBanner() {
  const { user, globalMessages, branchMessages, fetchGlobalMessages, fetchBranchMessages } = useAppStore();
  const [dismissedMessages, setDismissedMessages] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchGlobalMessages();
    if (user?.branchName) {
      fetchBranchMessages(user.branchName);
    }
  }, [fetchGlobalMessages, fetchBranchMessages, user?.branchName]);

  const handleDismiss = (id: string) => {
    setDismissedMessages((prev) => new Set(prev).add(id));
  };

  if (!user) return null;

  // We show the latest un-dismissed global message, and the latest un-dismissed branch message
  const activeGlobalMessage = globalMessages.find((m) => !dismissedMessages.has(m.id));
  const activeBranchMessage = branchMessages.find((m) => !dismissedMessages.has(m.id));

  return (
    <div className="flex flex-col gap-2 mb-6">
      <AnimatePresence>
        {activeGlobalMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-royal-purple/20 border border-royal-purple/50 rounded-lg p-3 flex items-start gap-3 backdrop-blur-md relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-1 h-full bg-royal-purple" />
            <div className="flex-shrink-0 mt-0.5">
              <Megaphone className="w-5 h-5 text-lilac" />
            </div>
            <div className="flex-1 pr-6">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold text-lilac uppercase tracking-wider">
                  Global Announcement
                </span>
                <span className="text-[10px] text-white/50">
                  {new Date(activeGlobalMessage.created_at).toLocaleDateString()}
                </span>
              </div>
              <p className="text-sm text-white/90">
                <span className="font-medium mr-1 text-white">{activeGlobalMessage.author_name}:</span>
                {activeGlobalMessage.content}
              </p>
            </div>
            <button
              onClick={() => handleDismiss(activeGlobalMessage.id)}
              className="flex-shrink-0 p-1 hover:bg-white/10 rounded-full transition-colors text-white/50 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeBranchMessage && user.role !== "GLOBAL_ADMIN" && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-emerald-900/20 border border-emerald-500/30 rounded-lg p-3 flex items-start gap-3 backdrop-blur-md relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
            <div className="flex-shrink-0 mt-0.5">
              <MessageCircle className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="flex-1 pr-6">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                  Branch Update ({activeBranchMessage.branch_name})
                </span>
                <span className="text-[10px] text-white/50">
                  {new Date(activeBranchMessage.created_at).toLocaleDateString()}
                </span>
              </div>
              <p className="text-sm text-white/90">
                <span className="font-medium mr-1 text-white">{activeBranchMessage.author_name}:</span>
                {activeBranchMessage.content}
              </p>
            </div>
            <button
              onClick={() => handleDismiss(activeBranchMessage.id)}
              className="flex-shrink-0 p-1 hover:bg-white/10 rounded-full transition-colors text-white/50 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
