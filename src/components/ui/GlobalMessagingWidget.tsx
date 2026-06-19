import { useState, useEffect } from "react";
import { GlassCard } from "./GlassCard";
import { useAppStore } from "@/store/useAppStore";
import { Send, MessageSquare, Megaphone } from "lucide-react";
import { ActionButton } from "./ActionButton";
import { supabase } from "@/lib/supabase";
import { NotificationService } from "@/services/notificationService";

export function GlobalMessagingWidget() {
  const { user, globalMessages, fetchGlobalMessages, sendGlobalMessage, onlineUsers } = useAppStore();
  const [content, setContent] = useState("");
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    fetchGlobalMessages();
    
    // Subscribe to new global messages
    const channel = supabase
      .channel('public:global_messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'global_messages' }, (payload) => {
         fetchGlobalMessages();
         if (payload.new && (payload.new as any).sender_name !== user?.name) {
           NotificationService.sendLocalNotification("Global Update", { 
             body: `From: ${(payload.new as any).sender_name || 'Admin'} - ${(payload.new as any).message}` 
           });
         }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchGlobalMessages, user?.name]);

  const handleSend = async () => {
    if (!content.trim() || !user) return;
    setIsSending(true);
    await sendGlobalMessage({
      content,
      author_name: user.name,
      author_role: user.role,
      target_audience: "ALL_BRANCHES",
    });
    setContent("");
    setIsSending(false);
  };

  const isGlobalAdmin = user?.role === "GLOBAL_ADMIN";

  return (
    <GlassCard id="tour-global-messaging" className="flex flex-col gap-4 max-h-[500px]">
      <div className="flex items-center gap-2 mb-2">
        <Megaphone className="w-5 h-5 text-lilac" />
        <h3 className="text-sm font-medium tracking-wide uppercase text-lilac">
          {isGlobalAdmin ? "Broadcast" : "Global Announcements"}
        </h3>
      </div>

      {isGlobalAdmin && (
        <div className="flex flex-col gap-3 pb-4 border-b border-white/10">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Type a message to all branches..."
            className="w-full bg-[#0B0118]/50 border border-royal-purple/30 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-royal-purple resize-none"
            rows={3}
          />
          <div className="flex justify-end">
            <ActionButton 
              onClick={handleSend} 
              className="py-2"
              disabled={isSending || !content.trim()}
            >
              <span className="flex items-center gap-2">
                <Send className="w-4 h-4" />
                {isSending ? "Sending..." : "Send Broadcast"}
              </span>
            </ActionButton>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar flex flex-col gap-3">
        {globalMessages.length === 0 ? (
          <div className="text-center py-6 text-white/50 text-sm flex flex-col items-center gap-2">
            <MessageSquare className="w-6 h-6 opacity-30" />
            <p>No announcements yet.</p>
          </div>
        ) : (
          globalMessages.map((msg) => (
            <div key={msg.id} className="bg-white/5 border border-white/10 rounded-lg p-3 group hover:bg-white/10 transition-colors">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <div className="relative flex items-center">
                    <span className="text-xs font-semibold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-sm flex items-center gap-2">
                      {onlineUsers.has(msg.author_name) && (
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" title="Online" />
                      )}
                      {msg.author_name}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] text-white/40">
                  {new Date(msg.created_at).toLocaleDateString()} at {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
