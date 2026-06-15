import { useState, useEffect } from "react";
import { GlassCard } from "./GlassCard";
import { useAppStore } from "@/store/useAppStore";
import { Send, MessageCircle, Building2, ShieldAlert } from "lucide-react";
import { ActionButton } from "./ActionButton";
import { supabase } from "@/lib/supabase";

interface BranchMessage {
  id: string;
  content: string;
  author_name: string;
  author_role: string;
  branch_name: string;
  created_at: string;
}

export function GlobalToBranchMessagingWidget() {
  const { user, onlineUsers, sendBranchMessage } = useAppStore();
  const [selectedBranch, setSelectedBranch] = useState("Uyo (HQ)");
  const [content, setContent] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [recentDispatches, setRecentDispatches] = useState<BranchMessage[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const branches = ["Uyo (HQ)", "Calabar", "Port Harcourt", "London", "Lagos"];

  const fetchDispatchHistory = async (branch: string) => {
    setLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from("branch_messages")
        .select("*")
        .eq("branch_name", branch)
        .eq("author_role", "GLOBAL_ADMIN")
        .order("created_at", { ascending: false })
        .limit(5);

      if (!error && data) {
        setRecentDispatches(data as BranchMessage[]);
      }
    } catch (err) {
      console.error("Error fetching dispatch history:", err);
    }
    setLoadingHistory(false);
  };

  useEffect(() => {
    fetchDispatchHistory(selectedBranch);

    // Subscribe to new message updates for this branch
    const channel = supabase
      .channel(`public:branch_messages_hq:${selectedBranch}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "branch_messages",
          filter: `branch_name=eq.${selectedBranch}`,
        },
        () => {
          fetchDispatchHistory(selectedBranch);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedBranch]);

  const handleSend = async () => {
    if (!content.trim() || !user) return;
    setIsSending(true);
    try {
      await sendBranchMessage({
        content,
        author_name: user.name + " (HQ Admin)",
        author_role: "GLOBAL_ADMIN",
        branch_name: selectedBranch,
      });
      setContent("");
      fetchDispatchHistory(selectedBranch);
    } catch (err) {
      console.error(err);
    }
    setIsSending(false);
  };

  if (user?.role !== "GLOBAL_ADMIN") return null;

  return (
    <GlassCard className="flex flex-col gap-4 max-h-[500px]">
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-lilac" />
          <h3 className="text-sm font-semibold tracking-wide uppercase text-white">
            Direct Branch Dispatch
          </h3>
        </div>
        <span className="text-[10px] bg-purple-500/20 text-purple-300 font-mono font-bold px-2 py-0.5 rounded-full border border-purple-500/30">
          HQ Access Only
        </span>
      </div>

      <div className="flex flex-col gap-3">
        <div>
          <label className="block text-xs font-medium text-lavender/70 mb-1.5 font-sans">
            Select Destination Branch
          </label>
          <div className="flex gap-2">
            {branches.map((br) => (
              <button
                key={br}
                onClick={() => setSelectedBranch(br)}
                className={`text-[10px] md:text-xs font-bold px-3 py-1.5 rounded-lg transition-all duration-300 border ${
                  selectedBranch === br
                    ? "bg-purple-500/25 border-purple-500/80 text-white shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                    : "bg-[#0B0118]/50 border-white/10 text-lavender/60 hover:bg-white/5 hover:text-white"
                }`}
              >
                {br}
              </button>
            ))}
          </div>
        </div>

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={`Instruct & update ${selectedBranch} branch leaders...`}
          className="w-full bg-[#0B0118]/60 border border-royal-purple/30 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-royal-purple resize-none placeholder-lavender/40"
          rows={3}
        />

        <div className="flex justify-end">
          <ActionButton
            onClick={handleSend}
            className="py-2 inline-flex items-center gap-2"
            disabled={isSending || !content.trim()}
          >
            <Send className="w-3.5 h-3.5" />
            {isSending ? "Sending..." : "Dispatch Message"}
          </ActionButton>
        </div>
      </div>

      <div className="border-t border-white/5 pt-3 flex-1 flex flex-col min-h-0">
        <h4 className="text-[11px] font-mono uppercase tracking-wider text-lilac/80 mb-2 flex items-center gap-1.5">
          <ShieldAlert className="w-3 h-3 text-lilac" /> Recent HQ dispatches to {selectedBranch}
        </h4>

        <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2 custom-scrollbar">
          {loadingHistory ? (
            <div className="text-center py-4 text-xs text-lavender/50">Loading dispatch records...</div>
          ) : recentDispatches.length === 0 ? (
            <div className="text-center py-4 text-xs text-lavender/30 italic">
              No recent dispatches to this branch.
            </div>
          ) : (
            recentDispatches.map((msg) => (
              <div
                key={msg.id}
                className="bg-purple-950/20 border border-purple-900/30 rounded-lg p-2.5 transition-colors"
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-bold text-lilac">
                    Sent by {msg.author_name}
                  </span>
                  <span className="text-[9px] text-white/40">
                    {new Date(msg.created_at).toLocaleDateString()} at{" "}
                    {new Date(msg.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p className="text-white/80 text-xs leading-relaxed whitespace-pre-wrap">
                  {msg.content}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </GlassCard>
  );
}
