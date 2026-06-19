import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";
import { NotificationBell } from "@/components/ui/NotificationBell";
import { OnboardingTour } from "@/components/ui/OnboardingTour";
import { PwaInstallPrompt } from "@/components/ui/PwaInstallPrompt";
import { ShieldAlert, WifiOff, RefreshCcw, KeyRound, Eye, EyeOff, Lock, CheckCircle2 } from "lucide-react";
import { usePresence } from "@/hooks/usePresence";
import { useAppStore } from "@/store/useAppStore";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

export function AppLayout() {
  usePresence();
  const { isOnline, pendingActions, syncPendingActions, theme } = useAppStore();
  const [isSyncing, setIsSyncing] = useState(false);

  // States for password setup
  const [showPasswordSetup, setShowPasswordSetup] = useState(() => {
    return localStorage.getItem("prompt_password_reset") === "true";
  });
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [modalError, setModalError] = useState("");
  const [modalSuccess, setModalSuccess] = useState("");
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  const handleSync = async () => {
    setIsSyncing(true);
    await syncPendingActions();
    setIsSyncing(false);
  };

  const handleCreatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError("");
    setModalSuccess("");

    if (newPassword.length < 6) {
      setModalError("Permanent password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setModalError("Entered passwords do not match.");
      return;
    }

    setIsSavingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        throw error;
      }

      setModalSuccess("Access credentials set successfully! Welcome aboard.");
      localStorage.removeItem("prompt_password_reset");

      setTimeout(() => {
        setShowPasswordSetup(false);
      }, 2000);
    } catch (err: any) {
      console.error("[PasswordSetup] Auth update error:", err);
      setModalError(err.message || "Failed to establish permanent credentials.");
    } finally {
      setIsSavingPassword(false);
    }
  };

  return (
    <div className="min-h-screen pb-24 md:pb-0 md:pl-64 flex flex-col relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="fixed top-0 left-1/4 w-[500px] h-[500px] bg-royal-purple/20 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="fixed bottom-0 right-1/4 w-[400px] h-[400px] bg-deep-violet/30 rounded-full blur-[100px] pointer-events-none -z-10" />
      
      <Sidebar />
      
      <div className="flex-1 flex flex-col relative w-full h-full">
         <div className="w-full flex items-center justify-between px-4 md:px-8 py-4 sticky top-0 z-40 bg-[#0B0118]/60 backdrop-blur-sm border-b border-white/5 pt-6">
            <div className="flex md:hidden items-center gap-3">
              <img src={theme === "light" ? "/logo_purple.png" : "/logo.png"} alt="Logo" className="w-8 h-8 object-contain drop-shadow-[0_0_15px_rgba(120,81,169,0.5)]" />
              <div>
                <h1 className="font-bold tracking-wider text-sm uppercase text-white">Pistis Nexus</h1>
                <p className="text-[10px] text-lilac uppercase tracking-widest">Administrative System</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 ml-auto">
              {!isOnline && (
                <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-full">
                  <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider hidden sm:inline">Offline</span>
                </div>
              )}
              
              {pendingActions.length > 0 && (
                <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full">
                  <div className="flex items-center gap-1.5 text-lilac">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">{pendingActions.length} Pending</span>
                  </div>
                  {isOnline && (
                    <button 
                      onClick={handleSync}
                      disabled={isSyncing}
                      className="text-[10px] bg-emerald-500 hover:bg-emerald-400 text-black px-2 py-0.5 rounded font-bold transition-colors flex items-center gap-1 disabled:opacity-50"
                    >
                      <RefreshCcw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                      {isSyncing ? "Syncing..." : "Sync Now"}
                    </button>
                  )}
                </div>
              )}
              
              <div id="topbar-actions" className="flex items-center gap-2 mr-2"></div>
              <NotificationBell />
            </div>
         </div>
         <main className="flex-1 p-4 md:px-8 md:py-4 max-w-7xl mx-auto w-full z-10 relative">
           <Outlet />

            {showPasswordSetup && (
              <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
                <div className={`w-full max-w-md p-6 rounded-2xl border shadow-2xl relative overflow-hidden backdrop-blur-xl animate-in fade-in zoom-in-95 duration-300 ${
                  theme === "light" 
                    ? "bg-white border-slate-200 text-slate-900" 
                    : "bg-[#110524]/90 border-white/10 text-white"
                }`}>
                  <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-royal-purple via-indigo-500 to-emerald-400" />
                  
                  <div className="flex flex-col items-center text-center mt-2 mb-6">
                    <div className="p-3 rounded-full bg-royal-purple/10 border border-royal-purple/20 mb-3 text-royal-purple">
                      <Lock className="w-6 h-6 animate-pulse" />
                    </div>
                    <h2 className="text-xl font-bold tracking-tight text-white font-sans">Create Permanent Password</h2>
                    <p className="text-xs mt-1 max-w-xs text-indigo-200/80">
                      Welcome to Pistis Nexus! Since you logged in via a secure single-use link, please establish a permanent password for subsequent sign-ins.
                    </p>
                  </div>

                  <form onSubmit={handleCreatePassword} className="space-y-4">
                    {modalError && (
                      <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-500 font-medium leading-relaxed">
                        {modalError}
                      </div>
                    )}

                    {modalSuccess && (
                      <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 font-medium flex items-center gap-2 leading-relaxed">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>{modalSuccess}</span>
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-bold tracking-wider text-indigo-300/80">New Secure Password</label>
                      <div className="relative">
                        <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                        <input
                          type={showNewPassword ? "text" : "password"}
                          required
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Min. 6 characters"
                          className="w-full rounded-xl py-2.5 pl-10 pr-10 text-sm focus:outline-none focus:ring-1 transition-all border border-white/5 bg-white/5 focus:ring-[#B193FB] focus:border-[#B193FB] text-white"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors"
                        >
                          {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-bold tracking-wider text-indigo-300/80">Confirm Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Repeat new password"
                          className="w-full rounded-xl py-2.5 pl-10 pr-10 text-sm focus:outline-none focus:ring-1 transition-all border border-white/5 bg-white/5 focus:ring-[#B193FB] focus:border-[#B193FB] text-white"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors"
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSavingPassword || modalSuccess !== ""}
                      className="w-full mt-2 rounded-xl py-3 bg-gradient-to-r from-royal-purple to-[#818cf8] text-white font-bold text-sm hover:from-royal-purple/95 hover:to-[#818cf8]/95 shadow-lg active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 font-sans"
                    >
                      {isSavingPassword ? (
                        <>
                          <span className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                          <span>Establishing Credentials...</span>
                        </>
                      ) : (
                        "Create Account Password"
                      )}
                    </button>
                  </form>
                </div>
              </div>
            )}
         </main>
      </div>

      <BottomNav />
      <OnboardingTour />
      <PwaInstallPrompt />
    </div>
  );
}
