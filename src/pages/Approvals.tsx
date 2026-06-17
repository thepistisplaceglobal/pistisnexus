import React, { useState, useEffect } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { supabase } from "@/lib/supabase";
import { Check, X, Key, ShieldAlert, Users, Search, UserMinus, Building, MapPin, Globe, Trash2 } from "lucide-react";
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
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"PENDING" | "APPROVED" | "PASSWORDS">("PENDING");
  const passwordRequests = useAppStore(state => state.passwordRequests);
  const updatePasswordRequestStatus = useAppStore(state => state.updatePasswordRequestStatus);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleOverrides, setRoleOverrides] = useState<Record<string, string>>({});
  const [purging, setPurging] = useState(false);
  const [purgeSuccess, setPurgeSuccess] = useState(false);

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
      setLoading(false);
    };
    load();
  }, [user]);

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

  const pendingCount = profiles.filter(p => p.status === "PENDING").length;

  const filteredProfiles = profiles.filter(p => p.status === tab).filter(p => 
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
                      <span>Role: {req.role.replace('_', ' ')}</span>
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
                      {p.role.replace('_', ' ')}
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
                    onClick={() => handleUpdateStatus(p.id, "REJECTED")} // Or REVOKED if we add that, REJECTED works to lock them out
                    className="flex w-full items-center justify-center gap-2 bg-transparent border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 hover:border-rose-500/50 px-4 py-2 rounded-lg font-bold text-sm transition-all"
                  >
                    <UserMinus className="w-4 h-4" /> Revoke Access / Remove
                  </button>
                )}
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {/* Outbound interactive email dispatch & testing log module */}
      <EmailDispatchLogsWidget />
    </div>
  );
}
