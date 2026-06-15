import { useState, useEffect } from "react";
import { GlassCard } from "./GlassCard";
import { useAppStore } from "@/store/useAppStore";
import { Send, FileText, LayoutList, CheckCircle } from "lucide-react";
import { ActionButton } from "./ActionButton";
import { supabase } from "@/lib/supabase";

interface BranchMessage {
  id: string;
  content: string;
  author_name: string;
  author_role: string;
  branch_name: string;
  target_unit?: string;
  created_at: string;
}

export function BranchToUnitMessagingWidget() {
  const { user, sendBranchMessage } = useAppStore();
  const [selectedUnit, setSelectedUnit] = useState("Media Department");
  const [content, setContent] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [recentDispatches, setRecentDispatches] = useState<BranchMessage[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const units = ["Media Department", "Choir", "Ushering Dept", "Follow-up Unit", "Home Cells"];

  const fetchDispatchHistory = async (unit: string) => {
    if (!user?.branchName) return;
    setLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from("branch_messages")
        .select("*")
        .eq("branch_name", user.branchName)
        .eq("target_unit", unit)
        .order("created_at", { ascending: false })
        .limit(5);

      if (!error && data) {
        setRecentDispatches(data as BranchMessage[]);
      }
    } catch (err) {
      console.error("Error fetching branch target unit history:", err);
    }
    setLoadingHistory(false);
  };

  useEffect(() => {
    if (user?.branchName) {
      fetchDispatchHistory(selectedUnit);

      const channel = supabase
        .channel(`public:branch_messages_unit:${user.branchName}:${selectedUnit}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "branch_messages",
            filter: `branch_name=eq.${user.branchName}`,
          },
          () => {
            fetchDispatchHistory(selectedUnit);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [selectedUnit, user?.branchName]);

  const handleSend = async () => {
    if (!content.trim() || !user || !user.branchName) return;
    setIsSending(true);
    try {
      await sendBranchMessage({
        content,
        author_name: user.name,
        author_role: "BRANCH_ADMIN",
        branch_name: user.branchName,
        target_unit: selectedUnit,
      });
      setContent("");
      fetchDispatchHistory(selectedUnit);
    } catch (err) {
      console.error(err);
    }
    setIsSending(false);
  };

  if (user?.role !== "BRANCH_ADMIN") return null;

  return (
    <GlassCard className="flex flex-col gap-4 max-h-[500px]">
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <LayoutList className="w-5 h-5 text-emerald-400" />
          <h3 className="text-sm font-semibold tracking-wide uppercase text-white">
            Specialized Unit Dispatch
          </h3>
        </div>
        <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-mono font-bold px-2 py-0.5 rounded-full border border-emerald-500/20">
          Branch Control
        </span>
      </div>

      <div className="flex flex-col gap-3">
        <div>
          <label className="block text-xs font-medium text-lavender/70 mb-1.5 font-sans">
            Select Target Department / Cell Network
          </label>
          <div className="flex flex-wrap gap-1.5">
            {units.map((un) => (
              <button
                key={un}
                onClick={() => setSelectedUnit(un)}
                className={`text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition-all duration-300 border ${
                  selectedUnit === un
                    ? "bg-emerald-500/20 border-emerald-500/60 text-white shadow-[0_0_15px_rgba(16,185,129,0.25)]"
                    : "bg-[#0B0118]/50 border-white/5 text-lavender/60 hover:bg-white/5 hover:text-white"
                }`}
              >
                {un}
              </button>
            ))}
          </div>
        </div>

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={`Type specialized directives or information for ${selectedUnit}...`}
          className="w-full bg-[#0B0118]/60 border border-emerald-500/30 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-emerald-500 resize-none placeholder-lavender/40"
          rows={3}
        />

        <div className="flex justify-end">
          <ActionButton
            onClick={handleSend}
            className="py-2 inline-flex items-center gap-2 !bg-emerald-500 hover:!bg-emerald-600"
            disabled={isSending || !content.trim()}
          >
            <Send className="w-3.5 h-3.5" />
            {isSending ? "Sending..." : `Send to ${selectedUnit}`}
          </ActionButton>
        </div>
      </div>

      <div className="border-t border-white/5 pt-3 flex-1 flex flex-col min-h-0">
        <h4 className="text-[11px] font-mono uppercase tracking-wider text-emerald-400/80 mb-2 flex items-center gap-1.5">
          <CheckCircle className="w-3 h-3 text-emerald-400" /> Recent Directives to {selectedUnit}
        </h4>

        <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2 custom-scrollbar">
          {loadingHistory ? (
            <div className="text-center py-4 text-xs text-lavender/50">Loading dispatch history...</div>
          ) : recentDispatches.length === 0 ? (
            <div className="text-center py-4 text-xs text-lavender/40 italic">
              No recent specialized info sent to this unit.
            </div>
          ) : (
            recentDispatches.map((msg) => (
              <div
                key={msg.id}
                className="bg-emerald-950/10 border border-emerald-900/20 rounded-lg p-2.5 transition-colors"
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-bold text-emerald-300">
                    HQ/Branch Admin
                  </span>
                  <span className="text-[9px] text-white/40">
                    {new Date(msg.created_at).toLocaleDateString()}
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
