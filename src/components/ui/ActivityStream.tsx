import { useState, useEffect } from "react";
import { GlassCard } from "./GlassCard";
import { useAppStore } from "@/store/useAppStore";
import { ActivityService, ActivityLog } from "@/services/activityService";
import { supabase } from "@/lib/supabase";
import { NotificationService } from "@/services/notificationService";
import { 
  Activity, 
  FileText, 
  CheckCircle, 
  Megaphone, 
  MessageSquare, 
  UserPlus, 
  Database, 
  AlertTriangle, 
  Clock, 
  RefreshCw,
  Eye,
  Building,
  Filter,
  UserCheck,
  Smartphone
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export function ActivityStream() {
  const user = useAppStore(state => state.user);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterType, setFilterType] = useState<"ALL" | "REPORTS" | "MINISTRY" | "MESSAGES">("ALL");
  const [branchFilter, setBranchFilter] = useState<string>(user?.branchName || "ALL");
  const [requiresTableSetup, setRequiresTableSetup] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "live" | "aggregated">("connecting");

  const fetchLogs = async () => {
    setIsLoading(true);
    const result = await ActivityService.getActivities(user?.role !== "GLOBAL_ADMIN" ? user?.branchName : null);
    setActivities(result.data);
    setRequiresTableSetup(result.requiresTableSetup);
    setConnectionStatus(result.requiresTableSetup ? "aggregated" : "live");
    setIsLoading(false);
  };

  useEffect(() => {
    fetchLogs();

    // Subscribe to changes in real-time based on table existence
    let channel: any = null;
    
    // We only subscribe to activity_logs table if we are in live mode (otherwise subscription will fail)
    if (!requiresTableSetup) {
      channel = supabase
        .channel("public:activity_logs")
        .on(
          "postgres_changes", 
          { event: "INSERT", schema: "public", table: "activity_logs" }, 
          (payload) => {
            const newLog = payload.new as ActivityLog;
            
            // Check branch permissions before displaying the real-time record
            if (user?.role !== "GLOBAL_ADMIN" && newLog.branch_name && newLog.branch_name !== user?.branchName) {
              return; // Filtered out
            }

            if (newLog.action_type === "BRANCH_REPORT_SUBMITTED") {
              NotificationService.sendLocalNotification("Branch Report Collated", {
                body: newLog.details || "A branch report has been aggregated and submitted."
              });
            }

            setActivities(prev => [newLog, ...prev].slice(0, 40));
          }
        )
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            setConnectionStatus("live");
          } else {
            setConnectionStatus("connecting");
          }
        });
    } else {
      // In aggregated fallback, subscribe to general tables to refresh automatically!
      channel = supabase
        .channel("public:aggregated_fallback_refresher")
        .on("postgres_changes", { event: "*", schema: "public", table: "unit_reports" }, () => { fetchLogs(); })
        .on("postgres_changes", { event: "*", schema: "public", table: "branch_reports" }, () => { fetchLogs(); })
        .on("postgres_changes", { event: "*", schema: "public", table: "global_messages" }, () => { fetchLogs(); })
        .on("postgres_changes", { event: "*", schema: "public", table: "branch_messages" }, () => { fetchLogs(); })
        .subscribe(() => {
          setConnectionStatus("aggregated");
        });
    }

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [user?.branchName, user?.role, requiresTableSetup]);

  // Helper inside layout to render status indicators nicely
  const getActionColorsAndIcon = (type: string) => {
    switch (type) {
      case "REPORT_SUBMITTED":
        return {
          bg: "bg-purple-500/10 border-purple-500/20 text-purple-300",
          icon: <FileText className="w-4 h-4 text-purple-400" />,
          label: "Report Submitted"
        };
      case "REPORT_APPROVED":
      case "BRANCH_REPORT_APPROVED":
        return {
          bg: "bg-emerald-500/10 border-emerald-500/20 text-emerald-300",
          icon: <CheckCircle className="w-4 h-4 text-emerald-400" />,
          label: "Approved"
        };
      case "BRANCH_REPORT_COMPILED":
        return {
          bg: "bg-cyan-500/10 border-cyan-500/20 text-cyan-300",
          icon: <Building className="w-4 h-4 text-cyan-400" />,
          label: "Consolidated"
        };
      case "GLOBAL_ANNOUNCEMENT":
        return {
          bg: "bg-amber-500/10 border-amber-500/20 text-amber-300",
          icon: <Megaphone className="w-4 h-4 text-amber-400" />,
          label: "Announcement"
        };
      case "BRANCH_UPDATE":
        return {
          bg: "bg-indigo-500/10 border-indigo-500/20 text-indigo-300",
          icon: <MessageSquare className="w-4 h-4 text-indigo-400" />,
          label: "Local Update"
        };
      case "LEADER_REGISTERED":
      case "PROFILE_APPROVED":
        return {
          bg: "bg-teal-500/10 border-teal-500/20 text-teal-300",
          icon: <UserCheck className="w-4 h-4 text-teal-400" />,
          label: "Access Approved"
        };
      default:
        return {
          bg: "bg-lilac/10 border-white/5 text-lilac/80",
          icon: <Activity className="w-4 h-4 text-[#B193FB]" />,
          label: "System Event"
        };
    }
  };

  // Humanize time calculations cleanly
  const formatTimeAgo = (isoString: string) => {
    const d = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  // Client side filtering for visual comfort
  const filteredActivities = activities.filter(activity => {
    // 1. Filter by branch permissions
    if (user?.role !== "GLOBAL_ADMIN") {
      // Branch leaders only see their own branch actions
      if (activity.branch_name && activity.branch_name !== user?.branchName) {
        return false;
      }
    } else {
      // Global admin can toggle branch filter selector
      if (branchFilter !== "ALL" && activity.branch_name && activity.branch_name !== branchFilter) {
        return false;
      }
    }

    // 2. Filter by category
    if (filterType === "REPORTS") {
      return ["REPORT_SUBMITTED", "REPORT_APPROVED", "BRANCH_REPORT_APPROVED", "BRANCH_REPORT_COMPILED"].includes(activity.action_type);
    }
    if (filterType === "MINISTRY") {
      return ["LEADER_REGISTERED", "PROFILE_APPROVED"].includes(activity.action_type);
    }
    if (filterType === "MESSAGES") {
      return ["GLOBAL_ANNOUNCEMENT", "BRANCH_UPDATE"].includes(activity.action_type);
    }

    return true;
  });

  return (
    <GlassCard className="p-5 flex flex-col gap-4 border-white/5 bg-[#120524]/40" id="activity-stream-widget">
      {/* Widget Header Area */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-white/5 pb-3 select-none">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-royal-purple/20 border border-royal-purple/30">
            <Activity className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">Real-time Ministry Stream</h3>
            <p className="text-[10px] text-lilac/60">Live feed of global & local operational events</p>
          </div>
        </div>

        {/* Live statuses */}
        <div className="flex items-center gap-2.5">
          {connectionStatus === "live" && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest">Live Feed</span>
            </div>
          )}
          {connectionStatus === "aggregated" && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-[#B193FB]/10 border border-[#B193FB]/20">
              <span className="w-1.5 h-1.5 rounded-full bg-[#B193FB]" />
              <span className="text-[9px] font-bold text-[#B193FB] uppercase tracking-widest">Real-time Hybrid</span>
            </div>
          )}
          <button 
            onClick={fetchLogs} 
            disabled={isLoading}
            className="p-1.5 rounded-md hover:bg-white/5 border border-white/5 hover:border-white/10 text-lilac hover:text-white transition-all disabled:opacity-40"
            title="Refresh feed"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-emerald-400" : ""}`} />
          </button>
        </div>
      </div>

      {/* Filter Options */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <button 
          onClick={() => setFilterType("ALL")}
          className={`px-2.5 py-1 rounded-full font-semibold border transition-all ${
            filterType === "ALL" 
              ? "bg-royal-purple text-white border-royal-purple/50 shadow-md shadow-royal-purple/10" 
              : "bg-white/5 text-lilac/70 border-white/5 hover:bg-white/10 hover:text-white"
          }`}
        >
          All Activities
        </button>
        <button 
          onClick={() => setFilterType("REPORTS")}
          className={`px-2.5 py-1 rounded-full font-semibold border transition-all ${
            filterType === "REPORTS" 
              ? "bg-royal-purple text-white border-royal-purple/50 shadow-md shadow-royal-purple/10" 
              : "bg-white/5 text-lilac/70 border-white/5 hover:bg-white/10 hover:text-white"
          }`}
        >
          Reports & Approvals
        </button>
        <button 
          onClick={() => setFilterType("MESSAGES")}
          className={`px-2.5 py-1 rounded-full font-semibold border transition-all ${
            filterType === "MESSAGES" 
              ? "bg-royal-purple text-white border-royal-purple/50 shadow-md shadow-royal-purple/10" 
              : "bg-white/5 text-lilac/70 border-white/5 hover:bg-white/10 hover:text-white"
          }`}
        >
          Updates & Broadcasts
        </button>
        <button 
          onClick={() => setFilterType("MINISTRY")}
          className={`px-2.5 py-1 rounded-full font-semibold border transition-all ${
            filterType === "MINISTRY" 
              ? "bg-royal-purple text-white border-royal-purple/50 shadow-md shadow-royal-purple/10" 
              : "bg-white/5 text-lilac/70 border-white/5 hover:bg-white/10 hover:text-white"
          }`}
        >
          Leadership Registration
        </button>

        {/* Global Admin Branch filter dropdown */}
        {user?.role === "GLOBAL_ADMIN" && (
          <div className="ml-auto flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-lilac/50" />
            <select 
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="bg-[#0e041c] border border-white/10 text-lilac text-xs rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-royal-purple"
            >
              <option value="ALL">All Branches</option>
              <option value="Uyo (HQ)">Uyo (HQ)</option>
              <option value="Calabar">Calabar</option>
            </select>
          </div>
        )}
      </div>

      {/* SQL Setup Informant Notification */}
      {requiresTableSetup && (
        <div className="bg-amber-500/5 border border-amber-500/20 text-amber-200/95 p-3 rounded-lg text-xs leading-relaxed flex items-start gap-2 animate-in fade-in duration-300">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Aggregated Real-Time Mode: </span>
            The database stream is currently unified by pooling active tables locally. 
            To activate official audit trail logging, please execute the new <code className="bg-black/30 px-1 py-0.5 rounded text-amber-300">activity_logs</code> schema from <code className="text-white">setup_all_tables.sql</code> in your Supabase dashboard workspace!
          </div>
        </div>
      )}

      {/* Feed Area */}
      <div className="max-h-[300px] overflow-y-auto pr-1 flex flex-col gap-2.5 relative min-h-[140px]">
        {isLoading && activities.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center flex-col gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
            <span className="text-xs text-lilac/60">Compiling activity stream...</span>
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center border border-dashed border-white/5 rounded-xl bg-white/5">
            <Activity className="w-8 h-8 text-lilac/40 mb-2" />
            <p className="text-xs text-lilac/80 font-semibold">No recent activity matching filter</p>
            <p className="text-[10px] text-lilac/50 mt-1">Actions taken across branches will populate here dynamically.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            <AnimatePresence initial={false}>
              {filteredActivities.map((activity, index) => {
                const style = getActionColorsAndIcon(activity.action_type);
                return (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 flex items-start gap-3 transition-all relative group"
                  >
                    {/* Compact role initials or avatar */}
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-deep-violet to-royal-purple/20 flex items-center justify-center text-white text-[10px] font-bold shrink-0 border border-white/10 uppercase select-none">
                      {activity.user_name ? activity.user_name.split(" ").map(w => w[0]).join("").slice(0, 2) : "S"}
                    </div>

                    <div className="flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5 text-xs">
                        <span className="text-white font-bold">{activity.user_name}</span>
                        <span className="text-[9px] uppercase tracking-wider text-lilac/60 bg-white/5 px-1.5 py-0.5 rounded border border-white/10">
                          {activity.user_role.replace("_", " ")}
                        </span>
                        {activity.branch_name && (
                          <span className="text-[10px] text-emerald-400 font-medium opacity-80 flex items-center gap-1">
                            <Eye className="w-3 h-3" /> {activity.branch_name}
                          </span>
                        )}
                        <span className="ml-auto text-[9px] text-[#B193FB] flex items-center gap-1 cursor-help" title={`${new Date(activity.created_at).toLocaleDateString()} at ${new Date(activity.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}>
                          <Clock className="w-3 h-3 text-lilac/50" /> {formatTimeAgo(activity.created_at)}
                        </span>
                      </div>
                      <p className="text-xs text-lilac/90 leading-relaxed font-normal">{activity.details}</p>
                    </div>

                    {/* Action badge on edge hover */}
                    <div className="absolute right-3 bottom-2.5 opacity-0 group-hover:opacity-100 transition-opacity bg-[#0e041c] border border-white/10 rounded-full px-2 py-0.5 text-[8px] font-bold tracking-widest text-emerald-400 flex items-center gap-1 select-none">
                      {style.icon}
                      {style.label.toUpperCase()}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </GlassCard>
  );
}
