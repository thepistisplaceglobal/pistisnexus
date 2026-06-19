import React, { useState, useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "motion/react";
import { 
  User as UserIcon, 
  Lock, 
  Settings as SettingsIcon, 
  CheckCircle2, 
  AlertCircle, 
  Globe, 
  Shield, 
  Building2, 
  Mail, 
  ArrowRight,
  LogOut,
  Smartphone,
  Check,
  Loader2,
  Database,
  Trash2,
  AlertTriangle,
  Bell,
  Sparkles,
  SlidersHorizontal,
  Eye,
  EyeOff,
  RefreshCw
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { ActionButton } from "@/components/ui/ActionButton";
import { NotificationService } from "@/services/notificationService";

import { AvatarUpload } from "@/components/ui/AvatarUpload";

type TabType = "profile" | "security" | "info" | "admin" | "layout";

export function Settings() {
  const { user, updateUser, logout } = useAppStore();
  const [activeTab, setActiveTab] = useState<TabType>("profile");

  // Layout Management States
  const [hiddenWidgets, setHiddenWidgets] = useState<Record<string, boolean>>({});
  const [leftWidgets, setLeftWidgets] = useState<any[]>([]);
  const [rightWidgets, setRightWidgets] = useState<any[]>([]);
  const [layoutSuccessMsg, setLayoutSuccessMsg] = useState("");

  const getDefaultLayouts = (role: string) => {
    if (role === 'GLOBAL_ADMIN') {
      return {
        left: [
          { id: 'global-trends', title: 'Global City Expression Trends' },
          { id: 'souls-trend', title: 'Souls Trend & Follow-up Analytics' },
          { id: 'attendance-trends', title: 'Attendance Trends & Analysis' },
          { id: 'growth-retention', title: 'Monthly Growth & Retention Registry' },
          { id: 'leader-activity', title: 'Leader Activity Breakdown' },
          { id: 'branch-updates', title: 'City Expression Operational Updates' },
          { id: 'activity-stream', title: 'Intelligence Audit Stream' },
        ],
        right: [
          { id: 'leaderboard', title: 'Global Leaders Leaderboard' },
          { id: 'ai-insight', title: 'Pistis AI Global Strategic Advice' },
          { id: 'global-msg', title: 'Global Administrative Pipeline' },
          { id: 'to-branch-msg', title: 'HQ to City Expression Dispatch Centre' },
          { id: 'broadcast-reach', title: 'Strategic Broadcast Reach' },
          { id: 'birthdays', title: 'Upcoming Birthdays Cohort' },
        ]
      };
    }

    if (role === 'BRANCH_ADMIN') {
      return {
        left: [
          { id: 'souls-trend', title: 'Souls Trend & Follow-up Analytics' },
          { id: 'attendance-trends', title: 'Attendance Trends & Analysis' },
          { id: 'branch-updates', title: 'City Expression Operational Updates' },
          { id: 'activity-stream', title: 'Intelligence Audit Stream' },
        ],
        right: [
          { id: 'pending-reports', title: 'Pending Departmental & Unit Reports' },
          { id: 'branch-msg', title: 'City Expression Broadcast Hub' },
          { id: 'to-unit-msg', title: 'City Expression to Unit Dispatch Centre' },
          { id: 'broadcast-reach', title: 'City Expression Broadcast Reach' },
          { id: 'birthdays', title: 'City Expression Upcoming Birthdays' },
          { id: 'ai-insight', title: 'Pistis AI City Expression Diagnostics' },
        ]
      };
    }

    return {
      left: [
        { id: 'role-chart', title: 'Oversight Membership & Attendance Trend' },
        { id: 'activity-stream', title: 'Local Leadership Stream' },
      ],
      right: [
        { id: 'schedule', title: 'Upcoming Service Briefings & Events' },
        { id: 'action-engine', title: 'Action Engine & Reminders' },
      ]
    };
  };

  useEffect(() => {
    if (!user) return;
    const hiddenKey = `dashboard_hidden_v2_${user.role}_${user.email || 'guest'}`;
    const layoutKey = `dashboard_layout_v2_${user.role}_${user.email || 'guest'}`;

    const savedHidden = localStorage.getItem(hiddenKey);
    if (savedHidden) {
      try {
        setHiddenWidgets(JSON.parse(savedHidden));
      } catch (e) {
        setHiddenWidgets({});
      }
    }

    const savedLayout = localStorage.getItem(layoutKey);
    const defaults = getDefaultLayouts(user.role);
    if (savedLayout) {
      try {
        const parsed = JSON.parse(savedLayout);
        if (parsed.left && parsed.right) {
          setLeftWidgets(parsed.left);
          setRightWidgets(parsed.right);
        } else {
          setLeftWidgets(defaults.left);
          setRightWidgets(defaults.right);
        }
      } catch (e) {
        setLeftWidgets(defaults.left);
        setRightWidgets(defaults.right);
      }
    } else {
      setLeftWidgets(defaults.left);
      setRightWidgets(defaults.right);
    }
  }, [user]);

  const saveHiddenState = (newHidden: Record<string, boolean>) => {
    if (!user) return;
    const hiddenKey = `dashboard_hidden_v2_${user.role}_${user.email || 'guest'}`;
    localStorage.setItem(hiddenKey, JSON.stringify(newHidden));
    setHiddenWidgets(newHidden);
  };

  const handleToggleWidgetHide = (id: string) => {
    const next = { ...hiddenWidgets, [id]: !hiddenWidgets[id] };
    saveHiddenState(next);
  };

  const handleExpandAll = () => {
    if (!user) return;
    const collapsedKey = `dashboard_collapsed_v2_${user.role}_${user.email || 'guest'}`;
    const allExpanded: Record<string, boolean> = {};
    [...leftWidgets, ...rightWidgets].forEach((w) => {
      allExpanded[w.id] = false;
    });
    localStorage.setItem(collapsedKey, JSON.stringify(allExpanded));
    // Also make sure all widgets are visible
    saveHiddenState({});
    showFeedback("All widgets restored, expanded, and set active!");
  };

  const handleCollapseAll = () => {
    if (!user) return;
    const collapsedKey = `dashboard_collapsed_v2_${user.role}_${user.email || 'guest'}`;
    const allCollapsed: Record<string, boolean> = {};
    [...leftWidgets, ...rightWidgets].forEach((w) => {
      allCollapsed[w.id] = true;
    });
    localStorage.setItem(collapsedKey, JSON.stringify(allCollapsed));
    // Also, hide them options or keep visibility as-is
    showFeedback("All widgets collapsed into state bars!");
  };

  const handleResetLayout = () => {
    if (!user) return;
    const defaults = getDefaultLayouts(user.role);
    const layoutKey = `dashboard_layout_v2_${user.role}_${user.email || 'guest'}`;
    const collapsedKey = `dashboard_collapsed_v2_${user.role}_${user.email || 'guest'}`;
    const hiddenKey = `dashboard_hidden_v2_${user.role}_${user.email || 'guest'}`;

    localStorage.removeItem(layoutKey);
    localStorage.removeItem(collapsedKey);
    localStorage.removeItem(hiddenKey);

    setLeftWidgets(defaults.left);
    setRightWidgets(defaults.right);
    setHiddenWidgets({});
    showFeedback("Dashboard configuration reset to system defaults!");
  };

  const showFeedback = (msg: string) => {
    setLayoutSuccessMsg(msg);
    setTimeout(() => setLayoutSuccessMsg(""), 4000);
  };
  
  
  // Profile state
  const [fullName, setFullName] = useState(user?.name || "");
  const [country, setCountry] = useState("");
  const [email, setEmail] = useState("");
  const [unitName, setUnitName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || "");
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState("");

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  // PWA checks
  const [isPWA, setIsPWA] = useState(false);

  // Connection diagnostics
  const [testStatus, setTestStatus] = useState<"idle" | "testing" | "success" | "error">("idle");
  const [latency, setLatency] = useState<number | null>(null);
  const [testMessage, setTestMessage] = useState<string>("");

  // Admin purge utility states
  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  const [purgeLoading, setPurgeLoading] = useState(false);
  const [purgeResult, setPurgeResult] = useState<Record<string, { deleted: number; error?: string }> | null>(null);
  const [purgeConfirmText, setPurgeConfirmText] = useState("");
  const [purgeConfirmed, setPurgeConfirmed] = useState(false);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [countsLoading, setCountsLoading] = useState(false);

  // System Database Reset states
  const [resetConfirmText, setResetConfirmText] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const testConnection = async () => {
    setTestStatus("testing");
    setTestMessage("");
    const start = performance.now();
    try {
      // Pin connection check via profiles count query
      const { error } = await supabase.from("profiles").select("count", { count: "exact", head: true });
      
      const end = performance.now();
      setLatency(Math.round(end - start));
      
      // PostgREST errors indicating lack of authentication context/permission are fine as long as they reach the DB gateway.
      // But we check for actual network connection failure.
      if (error && error.message === "Failed to fetch") {
        throw new Error("Unable to establish remote hand-shake (Network failed to fetch supabase).");
      }
      
      setTestStatus("success");
      setTestMessage("Secure connection verified successfully!");
    } catch (err: any) {
      console.error("Supabase integrity check failed:", err);
      setTestStatus("error");
      setTestMessage(err.message || "Failed to reach database node. Check API keys in environment.");
    }
  };

  useEffect(() => {
    // Check if running as PWA
    const isStandaloneMode = 
      window.matchMedia('(display-mode: standalone)').matches || 
      (window.navigator as any).standalone;
    setIsPWA(!!isStandaloneMode);

    // Fetch complete user profile details
    async function fetchFullProfile() {
      if (!user?.id) return;
      try {
        setProfileLoading(true);
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (error) throw error;

        if (data) {
          setFullName(data.full_name || user.name);
          setCountry(data.country || "");
          setEmail(data.email || "");
          setUnitName(data.unit_name || "");
        }
      } catch (err: any) {
        console.error("Error fetching full profile:", err);
        setProfileError("Could not retrieve profile record from security services.");
      } finally {
        setProfileLoading(false);
      }
    }

    fetchFullProfile();
  }, [user?.id]);

  useEffect(() => {
    if (activeTab === "admin" && (user?.role === "GLOBAL_ADMIN" || user?.role === "BRANCH_ADMIN")) {
      const loadCounts = async () => {
        setCountsLoading(true);
        const updatedCounts: Record<string, number> = {};
        const isGlobal = user.role === "GLOBAL_ADMIN";
        const branch = user.branchName || "";

        const targets = ["unit_reports", "branch_reports", "activity_logs", "branch_messages", "global_messages", "leaders", "profiles"];

        for (const table of targets) {
          if (table === "global_messages" && !isGlobal) {
            continue;
          }
          try {
            let query = supabase.from(table).select("*", { count: "exact", head: true });
            if (!isGlobal) {
              if (table === "leaders") {
                query = query.eq("branch", branch);
              } else if (table === "profiles") {
                query = query.eq("branch_name", branch).neq("id", user.id).in("status", ["PENDING", "REJECTED"]);
              } else if (table !== "global_messages") {
                query = query.eq("branch_name", branch);
              }
            } else {
              if (table === "profiles") {
                query = query.neq("id", user.id).in("status", ["PENDING", "REJECTED"]);
              }
            }
            const { count, error } = await query;
            if (!error && count !== null) {
              updatedCounts[table] = count;
            } else {
              updatedCounts[table] = 0;
            }
          } catch (e) {
            updatedCounts[table] = 0;
          }

          if (table === "profiles") {
            const localVal = localStorage.getItem("local_profiles");
            if (localVal) {
              try {
                const list = JSON.parse(localVal);
                let localCount = list.length;
                if (!isGlobal) {
                  localCount = list.filter((p: any) => p.branch_name === branch && p.id !== user.id && (p.status === "PENDING" || p.status === "REJECTED")).length;
                } else {
                  localCount = list.filter((p: any) => p.id !== user.id && (p.status === "PENDING" || p.status === "REJECTED")).length;
                }
                if (localCount > (updatedCounts[table] || 0)) {
                  updatedCounts[table] = localCount;
                }
              } catch (pErr) {}
            }
          }
        }
        setCounts(updatedCounts);
        setCountsLoading(false);
      };

      loadCounts();
      setPurgeResult(null);
      setPurgeConfirmText("");
      setPurgeConfirmed(false);
    }
  }, [activeTab, user]);

  const handleBulkClear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || selectedTables.length === 0) return;

    if (purgeConfirmText !== "CONFIRM_DELETE") {
      alert("Please type CONFIRM_DELETE exactly to execute.");
      return;
    }

    setPurgeLoading(true);
    setPurgeResult(null);

    try {
      const { bulkDeleteDatabaseRecords } = useAppStore.getState();
      const res = await bulkDeleteDatabaseRecords(selectedTables);
      if (res.success) {
        setPurgeResult(res.results);
        setSelectedTables([]);
        setPurgeConfirmText("");
        setPurgeConfirmed(false);
        setTimeout(() => {
          const currentCounts = { ...counts };
          selectedTables.forEach(t => {
            currentCounts[t] = 0;
          });
          setCounts(currentCounts);
        }, 500);
      }
    } catch (err: any) {
      alert(err.message || "An error occurred during DB purge.");
    } finally {
      setPurgeLoading(false);
    }
  };

  const handleSystemReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || user.role !== "GLOBAL_ADMIN") return;

    if (resetConfirmText !== "RESET_FOR_PRODUCTION") {
      alert("Please type RESET_FOR_PRODUCTION exactly to proceed.");
      return;
    }

    setResetLoading(true);
    setResetSuccess(false);

    try {
      // 1. Clear LocalStorage test caches safely
      localStorage.removeItem("fs_candidates");
      localStorage.removeItem("fs_graduates");
      localStorage.removeItem("pn_home_cells");
      localStorage.removeItem("local_activity_logs");
      localStorage.removeItem("local_email_dispatches");

      // 2. Clear remote database test/transient records
      const { bulkDeleteDatabaseRecords } = useAppStore.getState();
      const targetTables = ["unit_reports", "branch_reports", "activity_logs", "branch_messages", "global_messages"];
      
      const res = await bulkDeleteDatabaseRecords(targetTables);

      // Attempt to purge email_dispatches dynamically as well
      try {
        await supabase.from("email_dispatches").delete().neq("id", "nonexistent-placeholder");
      } catch (e) {
        console.warn("Non-critical: bypass email dispatches purge", e);
      }

      setResetSuccess(true);
      setResetConfirmText("");
      
      // Reload count state
      if (typeof window !== "undefined") {
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
    } catch (err: any) {
      alert(err.message || "An error occurred during system reset.");
    } finally {
      setResetLoading(false);
    }
  };

  const maintenanceCollections = [
    {
      id: "unit_reports",
      label: "Weekly Unit Reports",
      description: "Form submissions completed by departments, cell structures, and group units.",
      icon: Shield,
      textColor: "text-indigo-400"
    },
    {
      id: "branch_reports",
      label: "Branch Weekly Summaries",
      description: "Aggregated financial sheets and visitor tallies prepared weekly for HQ review.",
      icon: Building2,
      textColor: "text-amber-400"
    },
    {
      id: "activity_logs",
      label: "Platform Activity Logs",
      description: "Audit trail log actions representing current and historical operations.",
      icon: Globe,
      textColor: "text-blue-400"
    },
    {
      id: "branch_messages",
      label: "Branch Hub Chat Bulletins",
      description: "Local group communications and chat messaging rooms.",
      icon: Mail,
      textColor: "text-emerald-400"
    },
    {
      id: "global_messages",
      label: "Global Bulletins & Feed Broadcasts",
      description: "Platform-wide messages and central announcements (Global Admin only).",
      icon: Globe,
      textColor: "text-purple-400",
      globalOnly: true
    },
    {
      id: "leaders",
      label: "Seed Leader Records & Directory",
      description: "Roster details, contacts, and branch directories.",
      icon: UserIcon,
      textColor: "text-rose-400"
    },
    {
      id: "profiles",
      label: "Pending Access Registrations",
      description: "Pending access accounts and registrations (excluding your own).",
      icon: Shield,
      textColor: "text-orange-400"
    }
  ];

  const toggleTableSelection = (tableId: string) => {
    setSelectedTables(prev => 
      prev.includes(tableId) 
        ? prev.filter(id => id !== tableId)
        : [...prev, tableId]
    );
  };

  const selectAllTables = () => {
    const isGlobal = user?.role === "GLOBAL_ADMIN";
    const available = maintenanceCollections
      .filter(item => !item.globalOnly || isGlobal)
      .map(item => item.id);
    
    if (selectedTables.length === available.length) {
      setSelectedTables([]);
    } else {
      setSelectedTables(available);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    setProfileSaving(true);
    setProfileSuccess(false);
    setProfileError("");

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          country: country,
        })
        .eq("id", user.id);

      if (error) throw error;

      // Update local storage/Zustand store state
      updateUser({
        name: fullName,
      });

      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err: any) {
      console.error("Error updating profile:", err);
      setProfileError(err.message || "Failed to update profile values.");
    } finally {
      setProfileSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess(false);

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters long.");
      return;
    }

    setPasswordSaving(true);

    try {
      // Create a password change request via AppStore
      const { requestPasswordChange } = useAppStore.getState();
      
      requestPasswordChange({
        id: Date.now().toString(),
        userId: user!.id,
        userEmail: user!.email || user!.name,
        branchName: user!.branchName,
        unitName: user!.deptName || user!.groupName,
        role: user!.role,
        newPassword: newPassword, // Note: For demo/prototype only. In prod, hash this or use secure token.
        status: "PENDING",
        createdAt: new Date().toISOString()
      });

      setPasswordSuccess(true);
      setNewPassword("");
      setConfirmPassword("");
      setCurrentPassword("");
      setTimeout(() => setPasswordSuccess(false), 4000);
    } catch (err: any) {
      console.error("Error requesting password change:", err);
      setPasswordError(err.message || "Failed to request password reset.");
    } finally {
      setPasswordSaving(false);
    }
  };

  const tabs = [
    { id: "profile" as TabType, label: "Profile", icon: UserIcon },
    { id: "security" as TabType, label: "Security", icon: Lock },
    { id: "layout" as TabType, label: "Layout Controls", icon: SlidersHorizontal },
    ...(user?.role === "GLOBAL_ADMIN" || user?.role === "BRANCH_ADMIN" ? [
      { id: "admin" as TabType, label: "Data Maintenance", icon: Database }
    ] : []),
    { id: "info" as TabType, label: "System Info", icon: SettingsIcon },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6 md:py-8 pb-32">
      {/* Title */}
      <div className="mb-6 md:mb-8">
        <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <SettingsIcon className="w-6 h-6 text-royal-purple" />
          Settings Panel
        </h2>
        <p className="text-sm text-lilac/60">Configure your profile identity, security options, and connection state.</p>
      </div>

      {/* Profile Card Summary */}
      <GlassCard className="mb-6 border-white/5 bg-[#120524]/60">
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
          <AvatarUpload 
            currentAvatarUrl={avatarUrl} 
            fullName={fullName || user?.name || ""} 
            onUploadSuccess={(url) => {
              setAvatarUrl(url);
              updateUser({ avatar_url: url });
              setProfileSuccess(true);
              setTimeout(() => setProfileSuccess(false), 3000);
            }} 
            onUploadError={(err) => {
              setProfileError(err);
              setTimeout(() => setProfileError(""), 4000);
            }} 
          />
          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-center sm:justify-start">
              <h3 className="text-lg font-bold text-white">{fullName || user?.name}</h3>
              <span className="self-center sm:ml-2 px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase bg-royal-purple/30 border border-royal-purple/50 text-lilac">
                {user?.roles && user.roles.length > 0 
                  ? user.roles.map(r => r.replace(/_/g, ' ')).join(' & ') 
                  : (user?.role || "GUEST").replace(/_/g, ' ')}
              </span>
            </div>
            <p className="text-xs text-lilac/50 mt-1 flex items-center justify-center sm:justify-start gap-1">
              <Mail className="w-3 h-3 text-lilac/45" /> {email || "No email synchronized"}
            </p>
            <div className="mt-3 flex flex-wrap gap-2 justify-center sm:justify-start">
              {user?.branchName && (
                <span className="flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/5 rounded-lg text-xs text-lavender/80">
                  <Building2 className="w-3.5 h-3.5 text-royal-purple" />
                  {user.branchName}
                </span>
              )}
              {unitName && (
                <span className="flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/5 rounded-lg text-xs text-lavender/80">
                  <Shield className="w-3.5 h-3.5 text-emerald-400" />
                  Unit: {unitName}
                </span>
              )}
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Navigation Tabs */}
      <div className="flex border-b border-white/5 mb-6 overflow-x-auto scrollbar-hide gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 text-sm font-medium transition-all whitespace-nowrap ${
                isActive 
                  ? "border-emerald-400 text-white" 
                  : "border-transparent text-lilac/50 hover:text-lilac hover:border-white/10"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : ''}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content Panels */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === "profile" && (
            <>
              <GlassCard className="border-white/5 bg-[#120524]/40">
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-2">Profile Identity Details</h4>
                
                {profileLoading ? (
                  <div className="flex flex-col items-center justify-center py-8 gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-royal-purple" />
                    <span className="text-xs text-lilac/60">Fetching secure profile configuration...</span>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Name input */}
                      <div className="space-y-2">
                        <label className="text-xs text-lilac font-medium tracking-wide">Full Name</label>
                        <div className="relative">
                          <input
                            type="text"
                            required
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="w-full bg-[#080211]/80 border border-white/10 rounded-xl py-2.5 px-4 text-white text-sm focus:outline-none focus:border-royal-purple focus:ring-1 focus:ring-royal-purple/50 bg-gradient-to-r"
                          />
                        </div>
                      </div>

                      {/* Country input */}
                      <div className="space-y-2">
                        <label className="text-xs text-lilac font-medium tracking-wide">Country</label>
                        <div className="relative">
                          <select
                            value={country}
                            onChange={(e) => setCountry(e.target.value)}
                            className="w-full bg-[#080211]/80 border border-white/10 rounded-xl py-2.5 px-4 text-white text-sm focus:outline-none focus:border-royal-purple appearance-none"
                          >
                            <option value="">Select Country</option>
                            <option value="Nigeria">Nigeria</option>
                            <option value="Ghana">Ghana</option>
                            <option value="United Kingdom">United Kingdom</option>
                            <option value="United States">United States</option>
                            <option value="Canada">Canada</option>
                            <option value="South Africa">South Africa</option>
                            <option value="Kenya">Kenya</option>
                          </select>
                        </div>
                      </div>

                      {/* Read-only details */}
                      <div className="space-y-2">
                        <label className="text-xs text-lilac/45 font-medium tracking-wide">Official Email Address</label>
                        <input
                          type="email"
                          disabled
                          value={email}
                          className="w-full bg-white/5 border border-white/5 text-lilac/40 rounded-xl py-2.5 px-4 text-sm cursor-not-allowed"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs text-lilac/45 font-medium tracking-wide">Current Branch Assignment</label>
                        <input
                          type="text"
                          disabled
                          value={user?.branchName || "None"}
                          className="w-full bg-white/5 border border-white/5 text-lilac/40 rounded-xl py-2.5 px-4 text-sm cursor-not-allowed"
                        />
                      </div>
                    </div>

                    {/* Messages */}
                    {profileSuccess && (
                      <motion.div 
                        initial={{ opacity: 0, y: 5 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        className="flex items-center gap-2 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl text-xs"
                      >
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>Profile updated successfully in Pistis registry.</span>
                      </motion.div>
                    )}

                    {profileError && (
                      <motion.div 
                        initial={{ opacity: 0, y: 5 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        className="flex items-center gap-2 text-rose-400 bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl text-xs"
                      >
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{profileError}</span>
                      </motion.div>
                    )}

                    <div className="pt-2 flex justify-end">
                      <ActionButton 
                        type="submit" 
                        disabled={profileSaving}
                        className="bg-royal-purple text-white px-5 py-2.5 text-xs font-semibold rounded-xl flex items-center gap-2 shrink-0"
                      >
                        {profileSaving ? "Saving..." : <span className="flex items-center gap-1.5">Save Profiles <ArrowRight className="w-3.5 h-3.5" /></span>}
                      </ActionButton>
                    </div>
                  </>
                )}
              </form>
            </GlassCard>

            <GlassCard className="border-white/5 bg-[#120524]/40 mt-6 md:mt-8">
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Bell className="w-5 h-5 text-royal-purple" />
                  <h4 className="text-sm font-semibold text-white uppercase tracking-wider">Role-Based Push Notifications</h4>
                </div>
                
                <p className="text-xs text-lilac/70 leading-relaxed">
                  The Pistis Nexus utilizes high-fidelity push notifications to keep you updated in real time. Depending on your assigned ministry role, you are customized to receive key status events and report activities.
                </p>

                <div className="bg-[#080211]/60 border border-white/5 p-4 rounded-xl space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <span className="text-xs text-lilac font-medium block">Subscription Scope</span>
                      <span className="text-xs text-white/50 mt-1 block leading-relaxed">
                        {user?.role === 'GLOBAL_ADMIN' && "• Receive consolidated report submissions from City Expressions worldwide."}
                        {user?.role === 'BRANCH_ADMIN' && `• Receive unit report submissions for cells & departments within "${user.branchName || 'your branch'}", and approval status details from Global HQ.`}
                        {!['GLOBAL_ADMIN', 'BRANCH_ADMIN'].includes(user?.role || '') && `• Receive approval and corrective revision requests for your submitted "${user?.deptName || user?.groupName || 'unit'}" reports.`}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-1 rounded bg-royal-purple/20 text-lilac shrink-0 uppercase tracking-widest self-start">
                      {user?.role ? user.role.replace(/_/g, " ") : "GUILD_MEMBER"}
                    </span>
                  </div>

                  <div className="border-t border-white/5 pt-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-xs text-lilac font-medium block">Permission Status</span>
                      <span className="text-xs text-white/50 block mt-0.5">
                        Browser Level: <strong className="text-lilac capitalize">{('Notification' in window) ? Notification.permission : 'Not Supported'}</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {('Notification' in window) && Notification.permission !== 'granted' && (
                        <button
                          type="button"
                          onClick={() => {
                            NotificationService.requestPermission();
                          }}
                          className="bg-royal-purple/20 text-lilac hover:bg-royal-purple/35 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer"
                        >
                          Grant Access
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          if (user?.role === 'GLOBAL_ADMIN') {
                            NotificationService.sendLocalNotification("Test: Unit report aggregation complete", {
                              body: `Notification successfully simulated for Global HQ: "New consolidated report ready."`,
                              icon: '/favicon.png'
                            });
                          } else if (user?.role === 'BRANCH_ADMIN') {
                            NotificationService.sendLocalNotification("Test: New report from local cell", {
                              body: `Notification successfully simulated for ${user.branchName || 'Branch'}: "A cell report was completed."`,
                              icon: '/favicon.png'
                            });
                          } else {
                            NotificationService.sendLocalNotification("Test: Report approved!", {
                              body: `Notification successfully simulated for your unit: "${user?.deptName || user?.groupName || 'Department'} report approved."`,
                              icon: '/favicon.png'
                            });
                          }
                        }}
                        className="bg-white/10 hover:bg-white/15 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1 cursor-pointer"
                      >
                        <Sparkles className="w-3 h-3 text-lilac" /> Send Test Notification
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </GlassCard>
          </>
        )}

          {activeTab === "security" && (
            <GlassCard className="border-white/5 bg-[#120524]/40">
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-1">Request Password Change</h4>
                  <p className="text-xs text-lilac/50">Submit a request to change your secure password. This requires administrator approval.</p>
                </div>

                <div className="space-y-4">
                  {/* New Password */}
                  <div className="space-y-2">
                    <label className="text-xs text-lilac font-medium tracking-wide">New Secure Password</label>
                    <input
                      type="password"
                      required
                      placeholder="Min. 6 alphanumeric characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-[#080211]/80 border border-white/10 rounded-xl py-2.5 px-4 text-white text-sm focus:outline-none focus:border-royal-purple focus:ring-1 focus:ring-royal-purple/50"
                    />
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-2">
                    <label className="text-xs text-lilac font-medium tracking-wide">Confirm Secure Password</label>
                    <input
                      type="password"
                      required
                      placeholder="Repeat secure password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-[#080211]/80 border border-white/10 rounded-xl py-2.5 px-4 text-white text-sm focus:outline-none focus:border-royal-purple focus:ring-1 focus:ring-royal-purple/50"
                    />
                  </div>
                </div>

                {/* Password Criteria indicator */}
                <div className="p-3 bg-white/5 rounded-xl border border-white/5 space-y-2">
                  <div className="text-[10px] text-lilac/40 uppercase tracking-widest font-semibold">Security rules</div>
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-1.5 text-xs">
                      <div className={`w-1.5 h-1.5 rounded-full ${newPassword.length >= 6 ? 'bg-emerald-400' : 'bg-white/10'}`} />
                      <span className={newPassword.length >= 6 ? 'text-emerald-400/80' : 'text-lilac/50'}>At least 6 characters total</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs">
                      <div className={`w-1.5 h-1.5 rounded-full ${newPassword && newPassword === confirmPassword ? 'bg-emerald-400' : 'bg-white/10'}`} />
                      <span className={(newPassword && newPassword === confirmPassword) ? 'text-emerald-400/80' : 'text-lilac/50'}>Both passwords match</span>
                    </div>
                  </div>
                </div>

                {passwordSuccess && (
                  <motion.div 
                    initial={{ opacity: 0, y: 5 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    className="flex items-center gap-2 text-amber-400 bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl text-xs"
                  >
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Your password change request has been submitted for approval.</span>
                  </motion.div>
                )}

                {passwordError && (
                  <motion.div 
                    initial={{ opacity: 0, y: 5 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    className="flex items-center gap-2 text-rose-400 bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl text-xs"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{passwordError}</span>
                  </motion.div>
                )}

                <div className="pt-2 flex justify-end">
                  <ActionButton 
                    type="submit" 
                    disabled={passwordSaving}
                    className="bg-royal-purple text-white px-5 py-2.5 text-xs font-semibold rounded-xl flex items-center gap-2 shrink-0"
                  >
                    {passwordSaving ? "Checking..." : <span className="flex items-center gap-1.5">Submit Request <ArrowRight className="w-3.5 h-3.5" /></span>}
                  </ActionButton>
                </div>
              </form>
            </GlassCard>
          )}

          {activeTab === "info" && (
            <div className="space-y-4">
              <GlassCard className="border-white/5 bg-[#120524]/40">
                <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-royal-purple" /> PWA - Native Shell Connection
                </h4>
                <div className="space-y-3 text-xs leading-relaxed text-lilac/85">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-black/20 border border-white/5">
                    <span className="text-lilac/60">Standalone Active</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${isPWA ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : 'border-amber-500/30 bg-amber-500/10 text-amber-400'}`}>
                      {isPWA ? 'STANDALONE SHELL' : 'BROWSER TAB'}
                    </span>
                  </div>
                  <p>
                    Pistis Nexus is optimized as a progressive hybrid web utility to deliver immediate metrics, leaderboards, approval pathways, and pipelines securely.
                  </p>
                  {!isPWA && (
                    <div className="mt-4 p-3.5 rounded-xl border border-white/5 bg-royal-purple/10 flex flex-col gap-2">
                      <div className="text-white font-semibold text-xs flex items-center gap-1">
                        📱 To install on your Home Screen:
                      </div>
                      <div className="text-[11px] text-lilac/70 space-y-1">
                        <div><strong className="text-white">iOS/Safari:</strong> Tap Share, scroll down to <strong className="text-white">"Add to Home Screen"</strong></div>
                        <div><strong className="text-white">Android/Chrome:</strong> Tap prompt, choose <strong className="text-white">"Install app / Add to Home screen"</strong></div>
                      </div>
                    </div>
                  )}
                </div>
              </GlassCard>

              <GlassCard className="border-white/5 bg-[#120524]/40">
                <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>Network Connection Node</span>
                  <button 
                    onClick={testConnection} 
                    disabled={testStatus === "testing"}
                    className="text-[10px] font-bold bg-royal-purple hover:bg-royal-purple/80 text-white py-1 px-2.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    {testStatus === "testing" ? (
                      <>
                        <Loader2 className="w-2.5 h-2.5 animate-spin" />
                        Testing...
                      </>
                    ) : (
                      "Run Integrity Test"
                    )}
                  </button>
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between border-b border-white/5 py-1.5">
                    <span className="text-lilac/50">Gateway IP Connection</span>
                    <span className="text-font-mono text-white">Supabase Cloud</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 py-1.5">
                    <span className="text-lilac/50">Command Version</span>
                    <span className="text-white">v1.2.4-stable</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 py-1.5">
                    <span className="text-lilac/50">Command Node</span>
                    <span className="text-emerald-400 flex items-center gap-1.5 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Active Gateway Link
                    </span>
                  </div>

                  {testStatus !== "idle" && (
                    <div className={`mt-3 p-3 rounded-xl border ${
                      testStatus === "testing" 
                        ? "bg-white/5 border-white/10 text-lilac" 
                        : testStatus === "success"
                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                        : "bg-rose-500/10 border-rose-500/20 text-rose-400"
                    }`}>
                      <div className="font-semibold flex items-center gap-1.5 mb-1">
                        {testStatus === "testing" && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        {testStatus === "success" && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                        {testStatus === "error" && <AlertCircle className="w-3.5 h-3.5 text-rose-400" />}
                        {testStatus === "testing" && "Running Diagnostics..."}
                        {testStatus === "success" && "Test Passed"}
                        {testStatus === "error" && "Test Failed"}
                      </div>
                      <p className="text-[11px] opacity-90 leading-relaxed">{testMessage}</p>
                      {latency !== null && testStatus === "success" && (
                        <div className="mt-1.5 text-[10px] text-emerald-500/75 font-mono">
                          Handshake Response: {latency}ms
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </GlassCard>
            </div>
          )}

          {activeTab === "layout" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <GlassCard className="border-white/5 bg-[#120524]/40">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/10 pb-5 mb-5">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <SlidersHorizontal className="w-5 h-5 text-emerald-400" />
                      Dashboard Layout Settings
                    </h3>
                    <p className="text-xs text-lilac/70 mt-1">
                      Configure active components and visibility preferences for your profile dashboard scope.
                    </p>
                  </div>

                  {/* Elegant Pill Actions Bar from layout screenshot */}
                  <div className="flex items-center gap-1 bg-black/20 px-2 py-1.5 rounded-xl border border-white/5 self-end md:self-auto">
                    <div className="flex items-center gap-1 text-[11px] font-mono font-bold text-white px-2.5 py-1 rounded bg-royal-purple/20 border border-royal-purple/30">
                      <SlidersHorizontal className="w-3 h-3 text-[#d8b4fe]" />
                      <span>Layout</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleExpandAll}
                      className="p-1.5 rounded-lg text-emerald-400 hover:bg-white/5 hover:text-emerald-300 transition-colors cursor-pointer"
                      title="Expand All Widgets & Reset Visibility"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={handleCollapseAll}
                      className="p-1.5 rounded-lg text-rose-400 hover:bg-white/5 hover:text-rose-300 transition-colors cursor-pointer"
                      title="Collapse All Widgets"
                    >
                      <EyeOff className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={handleResetLayout}
                      className="p-1.5 rounded-lg text-lilac hover:bg-white/5 hover:text-white transition-all cursor-pointer"
                      title="Reset Layout Defaults"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {layoutSuccessMsg && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 flex items-center gap-2 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl text-xs"
                  >
                    <Check className="w-4 h-4 shrink-0" />
                    <span>{layoutSuccessMsg}</span>
                  </motion.div>
                )}

                <div className="space-y-4">
                  <div className="bg-black/20 border border-white/5 rounded-xl p-4">
                    <h4 className="text-xs font-bold tracking-wider uppercase text-lilac mb-4 flex items-center justify-between">
                      <span>Available Applets & Toggles (Oversight Role: {user?.role})</span>
                      <span className="text-[10px] bg-royal-purple/20 text-[#d8b4fe] border border-royal-purple/20 px-2.5 py-0.5 rounded font-mono font-bold">
                        {user?.role === 'GLOBAL_ADMIN' ? 'GLOBAL ADMINISTRATIVE SUITE' : user?.role === 'BRANCH_ADMIN' ? 'BRANCH OPERATIONS SUITE' : 'DEPARTMENT LEADERSHIP SUITE'}
                      </span>
                    </h4>

                    {leftWidgets.length === 0 && rightWidgets.length === 0 ? (
                      <div className="text-center py-6 text-xs text-lilac/50">
                        No configurable metrics found for your user role.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {[...leftWidgets, ...rightWidgets].map((widget) => {
                          const isHidden = !!hiddenWidgets[widget.id];
                          return (
                            <div
                              key={widget.id}
                              className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                                isHidden
                                  ? "bg-black/30 border-dashed border-white/5 opacity-50"
                                  : "bg-white/5 border-royal-purple/10 hover:border-royal-purple/25 hover:bg-white/[0.08]"
                              }`}
                            >
                              <div className="flex flex-col gap-0.5 mr-3">
                                <span className={`text-xs font-bold transition-colors ${isHidden ? 'text-lilac/50' : 'text-white'}`}>
                                  {widget.title}
                                </span>
                                <span className="text-[9px] text-[#d8b4fe]/60 font-mono tracking-wide">ID: {widget.id}</span>
                              </div>

                              <label className="relative inline-flex items-center cursor-pointer select-none shrink-0">
                                <input
                                  type="checkbox"
                                  checked={!isHidden}
                                  onChange={() => handleToggleWidgetHide(widget.id)}
                                  className="sr-only peer"
                                />
                                <div className="w-9 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#d8b4fe] after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500 peer-checked:after:bg-white"></div>
                              </label>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="p-4 rounded-xl border border-white/5 bg-[#17092c]/40 text-xs text-lavender/70 space-y-2">
                    <h5 className="font-bold text-white text-xs">Visual State Layout Syncing</h5>
                    <ul className="list-inside list-disc space-y-1 text-[11px] leading-relaxed">
                      <li>Toggled components are saved immediately in persistent browser configurations.</li>
                      <li>Go back to the <strong>Hub Dashboard</strong> to view layout changes dynamically re-rendered in real-time.</li>
                      <li>You can drag and order components inside the Hub columns directly for customized diagnostic flows.</li>
                    </ul>
                  </div>
                </div>
              </GlassCard>
            </div>
          )}

          {activeTab === "admin" && (user?.role === "GLOBAL_ADMIN" || user?.role === "BRANCH_ADMIN") && (
            <div className="space-y-6">
              <GlassCard className="border-white/5 bg-[#120524]/40">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-400 border border-rose-500/20">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white uppercase tracking-wider">Database Purge & Test Data Maintenance</h4>
                    <p className="text-xs text-lilac/60 font-medium font-sans">Identify and remove mock seed lists, sample weekly reports, and diagnostic logs from the database.</p>
                  </div>
                </div>

                <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20 text-xs text-amber-400/90 leading-relaxed flex gap-2 mb-6">
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 animate-pulse" />
                  <div>
                    <span className="font-bold">Administrative Safeguard Action Required:</span> Entries deleted from Supabase tables are permanently destroyed. Since you are logged in as a <strong>{user?.roles && user.roles.length > 0 ? user.roles.map(r => r.replace(/_/g, ' ')).join(' & ') : (user?.role || "GUEST").replace(/_/g, ' ')}</strong>, you are restricted to {(user?.roles?.includes('GLOBAL_ADMIN') || user?.role === 'GLOBAL_ADMIN') ? 'global application datasets' : `your assigned city expression: <strong>${user?.branchName}</strong>`}.
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Selection headers */}
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <button
                      type="button"
                      onClick={selectAllTables}
                      className="text-xs text-emerald-400 font-semibold flex items-center gap-2 cursor-pointer bg-transparent border-0 outline-none"
                    >
                      {selectedTables.length === (user?.role === "GLOBAL_ADMIN" ? 7 : 6) ? "Clear Selection" : "Select All Available Categories"}
                    </button>
                    <span className="text-[10px] text-lilac/45 uppercase font-medium">Record Inventory</span>
                  </div>

                  {countsLoading ? (
                    <div className="flex flex-col items-center justify-center py-8 gap-2">
                      <Loader2 className="w-6 h-6 animate-spin text-[#ef4444]" />
                      <span className="text-xs text-lilac/60 font-medium">Syncing live record sizes...</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-4">
                      {maintenanceCollections
                        .filter(item => !item.globalOnly || user?.role === "GLOBAL_ADMIN")
                        .map(item => {
                          const Icon = item.icon;
                          const isSelected = selectedTables.includes(item.id);
                          const recordCount = counts[item.id] !== undefined ? counts[item.id] : "...";
                          
                          return (
                            <div 
                              key={item.id}
                              onClick={() => toggleTableSelection(item.id)}
                              className={`flex items-start gap-3 p-4 rounded-xl border transition-all cursor-pointer ${
                                isSelected 
                                  ? "bg-rose-500/5 border-rose-500/30 text-white" 
                                  : "bg-black/20 border-white/5 hover:border-white/10 text-lilac/80"
                              }`}
                            >
                              <div className="mt-1">
                                {isSelected ? (
                                  <div className="w-4 h-4 rounded bg-rose-500 text-black flex items-center justify-center">
                                    <Check className="w-3 h-3 stroke-[3]" />
                                  </div>
                                ) : (
                                  <div className="w-4 h-4 rounded border border-white/30" />
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-xs font-bold flex items-center gap-1.5 text-white">
                                    <Icon className={`w-3.5 h-3.5 ${item.textColor}`} />
                                    {item.label}
                                  </span>
                                  <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-full ${
                                    typeof recordCount === "number" && recordCount > 0 
                                      ? "bg-rose-500/20 border border-rose-500/40 text-rose-300"
                                      : "bg-white/5 border border-white/5 text-lilac/45"
                                  }`}>
                                    {recordCount} pkts
                                  </span>
                                </div>
                                <p className="text-[10px] text-lilac/50 mt-1 select-none leading-normal">{item.description}</p>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}

                  {purgeResult && (
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-2">
                      <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" /> Action Verification Log:
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] leading-relaxed">
                        {Object.entries(purgeResult).map(([table, details]) => (
                          <div key={table} className="flex justify-between border-b border-white/5 py-1">
                            <span className="text-white capitalize">{table.replace('_', ' ')}</span>
                            {details.error ? (
                              <span className="text-rose-400 font-bold font-sans">Failed: {details.error}</span>
                            ) : (
                              <span className="text-emerald-400 font-bold font-sans">{details.deleted} records cleared</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedTables.length > 0 && (
                    <form onSubmit={handleBulkClear} className="mt-6 border-t border-white/5 pt-4 space-y-4 font-sans">
                      <div className="p-4 bg-[#ef4444]/5 rounded-xl border border-[#ef4444]/20 space-y-3">
                        <div className="text-xs font-semibold text-rose-400 flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4 animate-pulse text-rose-400 font-sans" />
                          Double Affirmation Authentication Required:
                        </div>
                        <p className="text-[11px] text-lilac/75 leading-normal">
                          Type <code className="bg-black/40 text-rose-400 px-1.5 py-0.5 rounded font-mono select-all">CONFIRM_DELETE</code> in the field below to verify you will remove <strong className="text-white">{selectedTables.length} categories</strong> of database tables.
                        </p>
                        <div className="space-y-1.5">
                          <input
                            type="text"
                            required
                            placeholder="Type CONFIRM_DELETE exactly"
                            value={purgeConfirmText}
                            onChange={(e) => setPurgeConfirmText(e.target.value)}
                            className="w-full bg-[#080211]/80 border border-rose-500/20 rounded-xl py-2 px-3 text-white text-xs font-mono focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500/50 font-sans"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="audit_purge_box"
                            checked={purgeConfirmed}
                            onChange={(e) => setPurgeConfirmed(e.target.checked)}
                            className="rounded bg-black border-white/20 text-[#ef4444] focus:ring-0 cursor-pointer h-3.5 w-3.5"
                          />
                          <label htmlFor="audit_purge_box" className="text-[11px] text-lavender/70 cursor-pointer select-none">
                            I verify I want to irreversibly clean active test payloads.
                          </label>
                        </div>
                      </div>

                      <div className="flex justify-end pt-2">
                        <ActionButton
                          type="submit"
                          disabled={purgeLoading || purgeConfirmText !== "CONFIRM_DELETE" || !purgeConfirmed}
                          className="bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 hover:shadow-[0_4px_15px_rgba(239,68,68,0.25)] text-white px-5 py-2.5 text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer disabled:opacity-40 font-sans border-0"
                        >
                          {purgeLoading ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              Wiping Selected Collections...
                            </>
                          ) : (
                            <>
                              <Trash2 className="w-3.5 h-3.5" />
                              Execute Destruction of {selectedTables.length} Categories
                            </>
                          )}
                        </ActionButton>
                      </div>
                    </form>
                  )}
                </div>
              </GlassCard>

              {user?.role === "GLOBAL_ADMIN" && (
                <GlassCard className="border-white/5 bg-[#120524]/40 mt-6 animate-fadeIn">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 border border-amber-500/20">
                      <AlertTriangle className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white uppercase tracking-wider">Production Setup & Safe Database Reset</h4>
                      <p className="text-xs text-lilac/60 font-medium font-sans">Purge test entries to start the administrative year with a clean, fully empty operations pipeline.</p>
                    </div>
                  </div>

                  <div className="p-4 bg-[#10b981]/10 rounded-xl border border-[#10b981]/20 text-xs text-emerald-400 select-none leading-relaxed flex gap-2 mb-6">
                    <Shield className="w-4 h-4 mt-0.5 shrink-0 text-emerald-400" />
                    <div>
                      <span className="font-bold">🔒 Secure Production Safeguard:</span> This reset utility purges **only** non-essential test artifacts (such as demo weekly unit reports, branch aggregations, mock audit logs, and test chat messages).
                      <br />
                      <strong className="text-white">Your system credentials, authorized administrator profiles, and primary login identities will NEVER be affected.</strong> You cannot lock yourself or your leadership structure out of the system.
                    </div>
                  </div>

                  <div className="space-y-3 pl-1 text-xs text-lilac/85">
                    <p className="font-semibold text-white">The following records will be permanently and safely reset:</p>
                    <ul className="list-disc pl-5 space-y-1.5 text-lilac/70">
                      <li><strong>Weekly Unit Reports:</strong> Clears all submissions filed by branch departments, cell units, and interest groups.</li>
                      <li><strong>Branch Weekly Summaries:</strong> Clears aggregated data sheets and consolidated branch files.</li>
                      <li><strong>Communications & Broadcasts:</strong> Purges all global bullet feeds, local branch room announcements, and logged emails.</li>
                      <li><strong>Platform Activity Streams:</strong> Empties the action auditing histories entirely.</li>
                      <li><strong>Candidate & Fellowship Tracking Registers:</strong> Re-initializes Local Storage tracking structures for Foundation School classes and Home Cells back to pristine defaults.</li>
                    </ul>
                  </div>

                  <form onSubmit={handleSystemReset} className="mt-6 border-t border-white/5 pt-4 space-y-4 font-sans">
                    <div className="p-4 bg-amber-500/5 rounded-xl border border-amber-500/10 space-y-3">
                      <div className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
                        <Lock className="w-4 h-4 text-amber-400 font-sans" />
                        Acknowledge System Purification Code:
                      </div>
                      <p className="text-[11px] text-lilac/75 leading-normal">
                        To execute the reset, type <code className="bg-black/40 text-amber-400 px-1.5 py-0.5 rounded font-mono select-all">RESET_FOR_PRODUCTION</code> verbatim in the box below.
                      </p>
                      <div className="space-y-1.5">
                        <input
                          type="text"
                          required
                          placeholder="Type RESET_FOR_PRODUCTION exactly"
                          value={resetConfirmText}
                          onChange={(e) => setResetConfirmText(e.target.value)}
                          className="w-full bg-[#080211]/80 border border-white/10 rounded-xl py-2 px-3 text-white text-xs font-mono focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50"
                        />
                      </div>
                    </div>

                    {resetSuccess && (
                      <motion.div 
                        initial={{ opacity: 0, y: 5 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        className="flex items-center gap-2 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl text-xs"
                      >
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>System purged and fully set up for production administrative use! Re-syncing database...</span>
                      </motion.div>
                    )}

                    <div className="flex justify-end pt-2">
                      <ActionButton
                        type="submit"
                        disabled={resetLoading || resetConfirmText !== "RESET_FOR_PRODUCTION"}
                        className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 hover:shadow-[0_4px_15px_rgba(245,158,11,0.25)] text-white px-5 py-2.5 text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer disabled:opacity-40 font-sans border-0"
                      >
                        {resetLoading ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Purging & Re-seeding System Cache...
                          </>
                        ) : (
                          <>
                            <Database className="w-3.5 h-3.5" />
                            Execute Safe Production Reset
                          </>
                        )}
                      </ActionButton>
                    </div>
                  </form>
                </GlassCard>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Redundancy Logout button specifically styled for clear access on mobile settings page */}
      <GlassCard className="mt-6 border-rose-500/10 bg-rose-500/5 hover:bg-rose-500/10 transition-colors">
        <div className="flex items-center justify-between">
          <div className="pr-4">
            <h4 className="text-sm font-bold text-white mb-0.5">Disconnect Session</h4>
            <p className="text-xs text-lilac/50 leading-normal">Safely lock your dashboard view and return to security entry portal.</p>
          </div>
          <button 
            type="button"
            onClick={logout}
            className="flex items-center gap-1.5 text-xs bg-rose-500 text-white font-bold py-2 px-3.5 rounded-xl hover:bg-rose-600 transition-colors shrink-0 shadow-[0_4px_15px_rgba(239,68,68,0.25)]"
          >
            <LogOut className="w-3.5 h-3.5" /> Out
          </button>
        </div>
      </GlassCard>
    </div>
  );
}
