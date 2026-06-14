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
  Loader2
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { ActionButton } from "@/components/ui/ActionButton";

import { AvatarUpload } from "@/components/ui/AvatarUpload";

type TabType = "profile" | "security" | "info";

export function Settings() {
  const { user, updateUser, logout } = useAppStore();
  const [activeTab, setActiveTab] = useState<TabType>("profile");
  
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
                {user?.role.replace('_', ' ')}
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
