import { useState, useEffect } from "react";
import { GlassCard } from "./GlassCard";
import { useAppStore } from "@/store/useAppStore";
import { Send, MessageCircle } from "lucide-react";
import { ActionButton } from "./ActionButton";
import { supabase } from "@/lib/supabase";

export function BranchMessagingWidget() {
  const { user, branchMessages, fetchBranchMessages, sendBranchMessage, onlineUsers } = useAppStore();
  const [content, setContent] = useState("");
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (user?.branchName) {
      fetchBranchMessages(user.branchName);
      
      const channel = supabase
        .channel(`public:branch_messages:${user.branchName}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'branch_messages', filter: `branch_name=eq.${user.branchName}` }, () => {
           fetchBranchMessages(user.branchName!);
        })
        .subscribe();
        
      return () => {
        supabase.removeChannel(channel);
      }
    }
  }, [fetchBranchMessages, user?.branchName]);

  const handleSend = async () => {
    if (!content.trim() || !user || !user.branchName) return;
    setIsSending(true);
    await sendBranchMessage({
      content,
      author_name: user.name,
      author_role: user.role,
      branch_name: user.branchName,
    });
    setContent("");
    setIsSending(false);
  };

  const isBranchAdmin = user?.role === "BRANCH_ADMIN";

  if (!user?.branchName) return null;

  return (
    <GlassCard className="flex flex-col gap-4 max-h-[500px]">
      <div className="flex items-center gap-2 mb-2">
        <MessageCircle className="w-5 h-5 text-emerald-400" />
        <h3 className="text-sm font-medium tracking-wide uppercase text-emerald-400">
          Branch Messages ({user.branchName})
        </h3>
      </div>

      {isBranchAdmin && (
        <div className="flex flex-col gap-3 pb-4 border-b border-white/10">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Send an update to all branch leaders..."
            className="w-full bg-[#0B0118]/50 border border-emerald-500/30 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-emerald-500 resize-none"
            rows={3}
          />
          <div className="flex justify-end">
            <ActionButton 
              onClick={handleSend} 
              className="py-2 !bg-emerald-500 hover:!bg-emerald-600"
              disabled={isSending || !content.trim()}
            >
              <span className="flex items-center gap-2">
                <Send className="w-4 h-4" />
                {isSending ? "Sending..." : "Send to Leaders"}
              </span>
            </ActionButton>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar flex flex-col gap-3">
        {branchMessages.length === 0 ? (
          <div className="text-center py-6 text-white/50 text-sm flex flex-col items-center gap-2">
            <MessageCircle className="w-6 h-6 opacity-30" />
            <p>No branch messages yet.</p>
          </div>
        ) : (
          branchMessages.map((msg) => (
            <div key={msg.id} className="bg-white/5 border border-white/10 rounded-lg p-3 group hover:bg-white/10 transition-colors">
              <div className="flex justify-between items-start mb-2 flex-wrap gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-sm flex items-center gap-2">
                    {onlineUsers.has(msg.author_name) && (
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" title="Online" />
                    )}
                    {msg.author_name}
                  </span>
                  {msg.target_unit && (
                    <span className="text-[10px] font-bold text-amber-300 bg-amber-400/10 px-2.5 py-0.5 rounded-full border border-amber-400/20">
                      Target: {msg.target_unit}
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-white/40">
                  {new Date(msg.created_at).toLocaleDateString()}
                </span>
              </div>
              <p className="text-white/90 text-sm leading-relaxed whitespace-pre-wrap">
                {msg.content}
              </p>
            </div>
          ))
        )}
      </div>
    </GlassCard>
  );
}
