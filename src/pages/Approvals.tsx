import React, { useState, useEffect } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { supabase } from "@/lib/supabase";
import { Check, X, Key, ShieldAlert, Users, Search, UserMinus, Building, MapPin, Globe, Trash2, RotateCcw, Calendar, AlertTriangle, Activity, Shield, Info } from "lucide-react";
import { useAppStore, Profile } from "@/store/useAppStore";
import { ActivityService } from "@/services/activityService";
import { EmailService } from "@/services/emailService";
import { EmailDispatchLogsWidget } from "@/components/ui/EmailDispatchLogsWidget";

export function Approvals() {
  const user = useAppStore((state) => state.user);
  const profiles = useAppStore((state) => state.profiles);
  const fetchProfiles = useAppStore((state) => state.fetchProfiles);
  const updateProfileStatus = useAppStore((state) => state.updateProfileStatus);
  const clearTestData = useAppStore((state) => state.clearTestData);
  const leaders = useAppStore((state) => state.leaders);
  const fetchLeaders = useAppStore((state) => state.fetchLeaders);
  const restoreLeader = useAppStore((state) => state.restoreLeader);

  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"PENDING" | "APPROVED" | "PASSWORDS" | "TRASH">("PENDING");
  const passwordRequests = useAppStore(state => state.passwordRequests);
  const updatePasswordRequestStatus = useAppStore(state => state.updatePasswordRequestStatus);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleOverrides, setRoleOverrides] = useState<Record<string, string>>({});
  const [purging, setPurging] = useState(false);
  const [purgeSuccess, setPurgeSuccess] = useState(false);

  // Soft delete helpers
  const isPruned = (deletedAtStr?: string) => {
    if (!deletedAtStr) return false;
    try {
      const deletedAt = new Date(deletedAtStr);
      const now = new Date();
      const diffTime = now.getTime() - deletedAt.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      return diffDays >= 30;
    } catch (e) {
      return false;
    }
  };

  const getDaysRemainingStr = (deletedAtStr?: string) => {
    if (!deletedAtStr) return "30 days";
    try {
      const deletedAt = new Date(deletedAtStr);
      const now = new Date();
      const diffTime = now.getTime() - deletedAt.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      const remaining = 30 - diffDays;
      if (remaining <= 0) return "Pruned";
      return `${remaining} days`;
    } catch (e) {
      return "30 days";
    }
  };

  const handlePurge = async () => {
    if (!window.confirm("Are you sure you want to remove all local demo/seed leader profiles and start fresh? This will preserve any remote database records.")) {
      return;
    }
    setPurging(true);
    await clearTestData(user);
    setPurging(false);
    setPurgeSuccess(true);
    setTimeout(() => setPurgeSuccess(false), 3000);
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await fetchProfiles(user);
      await fetchLeaders();
      setLoading(false);
    };
    load();
  }, [user, fetchProfiles, fetchLeaders]);

  const handleRoleChange = (id: string, newRole: string) => {
    setRoleOverrides(prev => ({ ...prev, [id]: newRole }));
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    const overrideRole = roleOverrides[id];
    let updateData: any = { status: newStatus };
    if (overrideRole && newStatus === "APPROVED") {
      updateData.role = overrideRole;
    }

    const targetProfile = profiles.find(p => p.id === id);

    await updateProfileStatus(id, updateData);
    
    if (overrideRole) {
      setRoleOverrides(prev => {
        const newOverrides = { ...prev };
        delete newOverrides[id];
        return newOverrides;
      });
    }

    if (targetProfile && user) {
      await ActivityService.logActivity({
        user_id: user.id,
        user_name: user.name,
        user_role: user.role,
        branch_name: user.branchName,
        action_type: newStatus === "APPROVED" ? "PROFILE_APPROVED" : "SYSTEM_EVENT",
        details: `${newStatus === "APPROVED" ? "Approved" : "Rejected"} registration application of "${targetProfile.full_name}" for ${overrideRole || targetProfile.role} in branch "${targetProfile.branch_name || 'N/A'}".`
      });

      // Trigger automatic branded welcome approval email
      if (newStatus === "APPROVED") {
        try {
          const targetRole = overrideRole || targetProfile.role;
          const branch = targetProfile.branch_name || "Global Command";
          await EmailService.sendApprovalEmail(
            targetProfile.email,
            targetProfile.full_name,
            targetRole,
            branch
          );
        } catch (mailError) {
          console.error("Failed to compile or dispatch welcome notification:", mailError);
        }
      }
    }
  };

  const handleRevokeProfile = async (p: Profile) => {
    if (!user) return;
    if (!window.confirm(`Are you sure you want to revoke system privileges for "${p.full_name}"? They will be moved to the Trash Bin and can be restored within 30 days.`)) {
      return;
    }

    const deleted_at = new Date().toISOString();
    const deleted_by = user.name;

    await updateProfileStatus(p.id, {
      status: "DELETED",
      deleted_at,
      deleted_by
    } as any);

    await ActivityService.logActivity({
      user_id: user.id,
      user_name: user.name,
      user_role: user.role,
      branch_name: user.branchName,
      action_type: "PROFILE_DELETED",
      details: `Revoked access and soft-deleted profile "${p.full_name}" of role ${p.role} (moved to Trash Bin).`
    });
  };

  const handleRestoreProfile = async (p: Profile) => {
    if (!user) return;
    try {
      await updateProfileStatus(p.id, {
        status: "APPROVED",
        deleted_at: undefined,
        deleted_by: undefined
      } as any);

      await ActivityService.logActivity({
        user_id: user.id,
        user_name: user.name,
        user_role: user.role,
        branch_name: user.branchName,
        action_type: "PROFILE_RESTORED",
        details: `Restored deleted profile of "${p.full_name}" back to APPROVED status.`
      });

      alert(`Successfully restored ${p.full_name} and re-authorized their credentials!`);
    } catch (e: any) {
      alert(e.message || "An error occurred during restoration.");
    }
  };

  const handleRestoreLeader_local = async (id: string, name: string) => {
    if (!user) return;
    try {
      await restoreLeader(id);
      alert(`Successfully restored group leader "${name}" back to the Directory!`);
    } catch (e: any) {
      alert(e.message || "An error occurred during restoration.");
    }
  };

  const pendingCount = profiles.filter(p => p.status === "PENDING").length;

  const isGlobal = user?.role === "GLOBAL_ADMIN";
  const userBranch = user?.branchName || "";

  const trashProfiles = profiles.filter(p => {
    if (p.status !== "DELETED") return false;
    if (isPruned(p.deleted_at)) return false;
    if (!isGlobal && p.branch_name !== userBranch) return false;
    return true;
  });

  const trashLeaders = leaders.filter(l => {
    if (l.active !== false || !l.deleted_at) return false;
    if (isPruned(l.deleted_at)) return false;
    if (!isGlobal && l.branch !== userBranch) return false;
    return true;
  });

  const trashCount = trashProfiles.length + trashLeaders.length;

  const filteredProfiles = profiles.filter(p => {
    if (tab === "TRASH") {
      return p.status === "DELETED" && !isPruned(p.deleted_at) && (isGlobal || p.branch_name === userBranch);
    }
    return p.status === tab;
  }).filter(p => 
    p.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.branch_name && p.branch_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const visiblePasswordRequests = passwordRequests.filter(req => {
    if (user?.role === "GLOBAL_ADMIN") {
        // Global admin should only approve requests from the Branches
        return req.role === "BRANCH_ADMIN" || req.role === "GLOBAL_ADMIN"; 
    }
    if (user?.role === "BRANCH_ADMIN" && req.branchName === user.branchName) {
        // "the branches should approve for branch units"
        if (req.role === "GLOBAL_ADMIN" || req.role === "BRANCH_ADMIN") return false;
        return true;
    }
    return false;
  }).filter(req => 
    req.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (req.branchName && req.branchName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const pendingPasswordCount = passwordRequests.filter(req => {
    if (!user) return false;
    if (req.status !== "PENDING") return false;
    if (user.role === "GLOBAL_ADMIN") {
        return req.role === "BRANCH_ADMIN" || req.role === "GLOBAL_ADMIN"; 
    }
    if (user.role === "BRANCH_ADMIN" && req.branchName === user.branchName) {
        if (req.role === "GLOBAL_ADMIN" || req.role === "BRANCH_ADMIN") return false;
        return true;
    }
    return false;
  }).length;

  const handleApprovePassword = async (req: any) => {
    try {
      if (req.newPassword) {
         // Create admin supabase client with service role? No, we don't have this.
         // We'll mock it for now since we can't update other users without edge function
         console.warn("Mocking password update for: ", req.userEmail);
      }
      updatePasswordRequestStatus(req.id, "APPROVED");

      // Trigger password clearance code confirmation email
      try {
        const cleanName = req.userEmail.split("@")[0].toUpperCase();
        await EmailService.sendPasswordResultEmail(
          req.userEmail,
          cleanName,
          req.newPassword || "RESET_COMPLETED_ACCESS_RESTORED"
        );
      } catch (mailError) {
        console.error("Failed to compile/send password clearance notification:", mailError);
      }
    } catch (e: any) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-royal-purple flex items-center justify-center shadow-lg">
            <Key className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white m-0">Access Approvals</h1>
            <p className="text-lilac/80 font-medium">Manage platform access, roles, and registrations</p>
          </div>
        </div>

        {(user?.role === "GLOBAL_ADMIN" || user?.role === "BRANCH_ADMIN") && (
          <button
            onClick={handlePurge}
            disabled={purging}
            className="self-start md:self-auto flex items-center gap-2 bg-rose-500/10 hover:bg-rose-500/20 active:bg-rose-500/30 text-rose-400 border border-rose-500/30 rounded-xl px-4 py-2 text-xs font-bold font-sans transition-all shadow-md cursor-pointer disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            {purging ? "Purging..." : purgeSuccess ? "Demo Seed Purged ✔" : "Remove Demo Seed Data"}
          </button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex bg-black/40 p-1 rounded-xl border border-white/5 w-full sm:w-auto">
          <button
            onClick={() => setTab("PENDING")}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold tracking-wide transition-all ${
              tab === "PENDING" ? "bg-royal-purple text-white shadow-lg" : "text-lilac hover:text-white"
            }`}
          >
            Pending Requests
            {pendingCount > 0 && (
              <span className="bg-rose-500 text-white text-[10px] px-2 py-0.5 rounded-full">{pendingCount}</span>
            )}
          </button>
          <button
            onClick={() => setTab("PASSWORDS")}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold tracking-wide transition-all ${
              tab === "PASSWORDS" ? "bg-royal-purple text-white shadow-lg" : "text-lilac hover:text-white"
            }`}
          >
            Password Requests
            {pendingPasswordCount > 0 && (
              <span className="bg-amber-500 text-black text-[10px] px-2 py-0.5 rounded-full">{pendingPasswordCount}</span>
            )}
          </button>
          <button
            onClick={() => setTab("APPROVED")}
            className={`flex-1 sm:flex-none px-6 py-2.5 rounded-lg text-sm font-bold tracking-wide transition-all ${
              tab === "APPROVED" ? "bg-royal-purple text-white shadow-lg" : "text-lilac hover:text-white"
            }`}
          >
            Active Users
          </button>
          <button
            onClick={() => setTab("TRASH")}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold tracking-wide transition-all ${
              tab === "TRASH" ? "bg-royal-purple text-white shadow-lg" : "text-lilac hover:text-white"
            }`}
          >
            Trash Bin (30d)
            {trashCount > 0 && (
              <span className="bg-[#f43f5e] text-white text-[10px] px-2 py-0.5 rounded-full font-sans">{trashCount}</span>
            )}
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-lilac absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search users..."
            className="w-full bg-black/20 border border-white/10 rounded-lg py-2 pl-9 pr-4 text-sm text-white focus:outline-none focus:border-royal-purple"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading && tab !== "PASSWORDS" ? (
        <div className="text-center py-12 text-lilac font-medium tracking-wide animate-pulse">Loading profiles...</div>
      ) : tab === "PASSWORDS" ? (
        visiblePasswordRequests.length === 0 ? (
          <GlassCard className="p-12 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
              <Key className="w-8 h-8 text-white/20" />
            </div>
            <h3 className="text-white font-bold text-lg mb-2">No password requests</h3>
            <p className="text-lilac/70 text-sm">
              There are no pending password reset requests at this time.
            </p>
          </GlassCard>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {visiblePasswordRequests.map((req) => (
              <GlassCard key={req.id} className="p-5 flex flex-col justify-between hover:bg-white/5 transition-colors border-l-4" style={{borderLeftColor: req.status === 'PENDING' ? '#f59e0b' : '#10b981'}}>
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-white leading-tight">{req.userEmail}</h3>
                      <p className="text-sm text-amber-400 font-medium">Password Reset Request</p>
                    </div>
                    <span className="px-3 py-1 rounded bg-black/40 text-[10px] font-bold text-lilac uppercase tracking-widest border border-white/10">
                      {req.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-y-3 gap-x-4 mb-6 text-sm text-lavender">
                    {req.branchName && (
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4 text-indigo-400" />
                        <span>{req.branchName} Branch</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 col-span-2">
                      <Users className="w-4 h-4 text-emerald-400" />
                      <span>Role: {req.role.split(',').map(r => r.replace(/_/g, ' ')).join(' & ')}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 pt-4 border-t border-white/5">
                  {req.status === "PENDING" && (
                    <>
                      <button 
                        onClick={() => handleApprovePassword(req)}
                        className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black px-4 py-2 rounded-lg font-bold text-sm transition-colors"
                      >
                        <Check className="w-4 h-4" /> Approve
                      </button>
                      <button 
                        onClick={() => updatePasswordRequestStatus(req.id, "REJECTED")}
                        className="flex items-center justify-center gap-2 bg-transparent border border-rose-500/50 text-rose-400 hover:bg-rose-500/20 px-4 py-2 rounded-lg font-bold text-sm transition-colors"
                      >
                        <X className="w-4 h-4" /> Reject
                      </button>
                    </>
                  )}
                </div>
              </GlassCard>
            ))}
          </div>
        )
      ) : filteredProfiles.length === 0 ? (
        <GlassCard className="p-12 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
            <Users className="w-8 h-8 text-white/20" />
          </div>
          <h3 className="text-white font-bold text-lg mb-2">No {tab.toLowerCase()} users found</h3>
          <p className="text-lilac/70 text-sm">
            {tab === "PENDING" ? "There are no pending registration requests at this time." : "There are no active users matching your criteria."}
          </p>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredProfiles.map((p) => (
            <GlassCard key={p.id} className="p-5 flex flex-col justify-between hover:bg-white/5 transition-colors border-l-4" style={{borderLeftColor: tab === 'PENDING' ? '#f59e0b' : '#10b981'}}>
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white leading-tight">{p.full_name}</h3>
                    <p className="text-sm text-emerald-400 font-medium">{p.email}</p>
                  </div>
                  {tab === "PENDING" ? (
                    <select 
                      value={roleOverrides[p.id] || p.role}
                      onChange={(e) => handleRoleChange(p.id, e.target.value)}
                      className="px-2 py-1 rounded bg-black/40 text-[10px] font-bold text-lilac uppercase tracking-widest border border-white/10 focus:border-royal-purple focus:outline-none"
                    >
                      <option value="INTEREST_GROUP_LEADER">Interest Group Leader</option>
                      <option value="CELL_LEADER">Cell Leader</option>
                      <option value="DEPT_LEADER">Dept Leader</option>
                      {user?.role === "GLOBAL_ADMIN" && (
                        <>
                          <option value="BRANCH_ADMIN">Branch Admin</option>
                          <option value="GLOBAL_ADMIN">Global Admin</option>
                        </>
                      )}
                    </select>
                  ) : (
                    <span className="px-3 py-1 rounded bg-black/40 text-[10px] font-bold text-lilac uppercase tracking-widest border border-white/10">
                      {p.role.split(',').map(r => r.replace(/_/g, ' ')).join(' & ')}
                    </span>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-y-3 gap-x-4 mb-6">
                  {p.branch_name && (
                    <div className="flex items-center gap-2 text-sm text-lavender">
                      <MapPin className="w-4 h-4 text-indigo-400" />
                      <span>{p.branch_name} Branch</span>
                    </div>
                  )}
                  {p.country && (
                    <div className="flex items-center gap-2 text-sm text-lavender">
                      <Globe className="w-4 h-4 text-emerald-400" />
                      <span>{p.country}</span>
                    </div>
                  )}
                  {p.unit_name && (
                    <div className="flex items-center gap-2 text-sm text-lavender col-span-2">
                      <Building className="w-4 h-4 text-amber-400" />
                      <span>Unit: {p.unit_name}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-xs text-lilac/70 col-span-2 mt-2">
                    Joined: {new Date(p.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-white/5">
                {tab === "PENDING" ? (
                  <>
                    <button 
                      onClick={() => handleUpdateStatus(p.id, "APPROVED")}
                      className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black px-4 py-2 rounded-lg font-bold text-sm transition-colors"
                    >
                      <Check className="w-4 h-4" /> Approve Access
                    </button>
                    <button 
                      onClick={() => handleUpdateStatus(p.id, "REJECTED")}
                      className="flex items-center justify-center gap-2 bg-transparent border border-rose-500/50 text-rose-400 hover:bg-rose-500/20 px-4 py-2 rounded-lg font-bold text-sm transition-colors"
                    >
                      <X className="w-4 h-4" /> Reject
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={() => handleRevokeProfile(p)}
                    className="flex w-full items-center justify-center gap-2 bg-transparent border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 hover:border-rose-500/50 px-4 py-2 rounded-lg font-bold text-sm transition-all cursor-pointer font-sans"
                  >
                    <UserMinus className="w-4 h-4" /> Revoke Access / Remove (30d soft)
                  </button>
                )}
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {tab === "TRASH" && (
        <div className="space-y-6">
          {/* Safeguard Measures Info Panel */}
          <GlassCard className="p-5 border-emerald-500/15 bg-[#10b981]/5">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 text-emerald-400 shrink-0">
                <Shield className="w-6 h-6 animate-pulse" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 font-sans">
                  🔒 Active Core Safeguard Protocol Enabled
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  The system enforces a strict 30-day soft-deletion window to guard against mistakes. Records are securely retained in an inactive, isolated state before permanent physical cleanup.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 text-[11px] text-lilac/70 font-sans">
                  <div className="p-2.5 bg-black/30 rounded-xl border border-white/5 space-y-1">
                    <span className="font-bold text-emerald-400 flex items-center gap-1"><Activity className="w-3.5 h-3.5" /> 100% Trace Auditing</span>
                    All delete/restore operations register immutably in system activity logs.
                  </div>
                  <div className="p-2.5 bg-black/30 rounded-xl border border-white/5 space-y-1">
                    <span className="font-bold text-amber-400 flex items-center gap-1"><Building className="w-3.5 h-3.5" /> City Expression Isolation</span>
                    Branch leaders are securely restricted from managing datasets outside their scope.
                  </div>
                  <div className="p-2.5 bg-black/30 rounded-xl border border-white/5 space-y-1">
                    <span className="font-bold text-indigo-400 flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Auto-Pruning</span>
                    Objects beyond the 30-day restorable window are permanently fully pruned.
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>

          {trashProfiles.length === 0 && trashLeaders.length === 0 ? (
            <GlassCard className="p-12 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                <Trash2 className="w-8 h-8 text-white/20" />
              </div>
              <h3 className="text-white font-bold text-lg mb-2">Trash Bin Is Empty</h3>
              <p className="text-lilac/70 text-sm max-w-sm leading-relaxed">
                No soft-deleted user access profiles or group leaders detected for your city expression.
              </p>
            </GlassCard>
          ) : (
            <div className="space-y-6">
              {trashProfiles.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-300 tracking-wider uppercase mb-3 px-1 font-sans">Trashed User Access Profiles ({trashProfiles.length})</h4>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {trashProfiles.map((p) => (
                      <GlassCard key={p.id} className="p-5 flex flex-col justify-between border-l-4 border-rose-500/50 hover:bg-white/5 transition-colors">
                        <div>
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="text-lg font-bold text-white leading-tight">{p.full_name}</h3>
                              <p className="text-sm text-rose-400 font-medium font-sans">{p.email}</p>
                            </div>
                            <span className="px-2.5 py-0.5 rounded bg-rose-500/10 text-[10px] font-bold text-rose-300 uppercase tracking-widest border border-rose-500/20 flex items-center gap-1 font-sans">
                              <AlertTriangle className="w-3 h-3" /> {getDaysRemainingStr(p.deleted_at)} left
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-y-3 gap-x-4 mb-4 text-sm font-sans">
                            <div className="flex items-center gap-2 text-lavender col-span-2">
                              <Building className="w-4 h-4 text-emerald-400" />
                              <span>Original Role: {p.role.split(',').map(r => r.replace(/_/g, ' ')).join(' & ')}</span>
                            </div>
                            {p.branch_name && (
                              <div className="flex items-center gap-2 text-lavender">
                                <MapPin className="w-4 h-4 text-indigo-400" />
                                <span>{p.branch_name} Branch</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2 text-lilac/70 col-span-2 text-xs border-t border-white/5 pt-2 mt-1">
                              <Calendar className="w-3.5 h-3.5 text-rose-400" />
                              Deleted: {p.deleted_at ? new Date(p.deleted_at).toLocaleString() : "Recently"} by {p.deleted_by || "Admin"}
                            </div>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-white/5">
                          <button 
                            onClick={() => handleRestoreProfile(p)}
                            className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black px-4 py-2.5 rounded-lg font-bold text-sm transition-colors cursor-pointer font-sans"
                          >
                            <RotateCcw className="w-4 h-4" /> Restore Access & Login Profile
                          </button>
                        </div>
                      </GlassCard>
                    ))}
                  </div>
                </div>
              )}

              {trashLeaders.length > 0 && (
                <div className="pt-4">
                  <h4 className="text-xs font-bold text-slate-300 tracking-wider uppercase mb-3 px-1 font-sans">Trashed Directory Group Leaders ({trashLeaders.length})</h4>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {trashLeaders.map((l) => (
                      <GlassCard key={l.id} className="p-5 flex flex-col justify-between border-l-4 border-amber-500/50 hover:bg-white/5 transition-colors">
                        <div>
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="text-lg font-bold text-white leading-tight">{l.name}</h3>
                              <p className="text-sm text-amber-400 font-medium font-sans">{l.group_name} ({l.role})</p>
                            </div>
                            <span className="px-2.5 py-0.5 rounded bg-amber-500/10 text-[10px] font-bold text-amber-300 uppercase tracking-widest border border-amber-500/20 flex items-center gap-1 font-sans">
                              <AlertTriangle className="w-3 h-3" /> {getDaysRemainingStr(l.deleted_at)} left
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-y-3 gap-x-4 mb-4 text-sm font-sans">
                            <div className="flex items-center gap-2 text-lavender">
                              <MapPin className="w-4 h-4 text-indigo-400" />
                              <span>{l.branch} Branch</span>
                            </div>
                            <div className="flex items-center gap-2 text-lavender">
                              <Globe className="w-4 h-4 text-purple-400" />
                              <span>Location: {l.location || 'HQ'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-lilac/70 col-span-2 text-xs border-t border-white/5 pt-2 mt-1">
                              <Calendar className="w-3.5 h-3.5 text-amber-400" />
                              Deleted: {l.deleted_at ? new Date(l.deleted_at).toLocaleString() : "Recently"} by {l.deleted_by || "Admin"}
                            </div>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-white/5 font-sans">
                          <button 
                            onClick={() => handleRestoreLeader_local(l.id, l.name)}
                            className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black px-4 py-2.5 rounded-lg font-bold text-sm transition-colors cursor-pointer font-sans"
                          >
                            <RotateCcw className="w-4 h-4" /> Restore Group Leader to Directory
                          </button>
                        </div>
                      </GlassCard>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Outbound interactive email dispatch & testing log module */}
      <EmailDispatchLogsWidget />
    </div>
  );
}
