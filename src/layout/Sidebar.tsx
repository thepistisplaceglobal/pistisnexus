import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Network, Wallet, Users, Home, FileText, ShieldAlert, LogOut, Compass, Contact, Key, Settings as SettingsIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";
import { useEffect } from "react";

const allItems = [
  { path: "/", label: "Intelligence Hub", icon: LayoutDashboard, roles: ["GLOBAL_ADMIN", "BRANCH_ADMIN", "DEPT_LEADER", "CELL_LEADER", "INTEREST_GROUP_LEADER"] },
  { path: "/branches", label: "Global Branches", icon: Network, roles: ["GLOBAL_ADMIN"] },
  { path: "/approvals", label: "Access Approvals", icon: Key, roles: ["GLOBAL_ADMIN", "BRANCH_ADMIN"] },
  { path: "/finance", label: "Finance", icon: Wallet, roles: ["GLOBAL_ADMIN", "BRANCH_ADMIN"] },
  { path: "/departments", label: "Departments", icon: Users, roles: ["BRANCH_ADMIN"] },
  { path: "/homecells", label: "Cell Units", icon: Home, roles: ["BRANCH_ADMIN", "CELL_LEADER"] },
  { path: "/interest", label: "Interest Groups", icon: Compass, roles: ["BRANCH_ADMIN", "INTEREST_GROUP_LEADER"] },
  { path: "/directory", label: "Leaders Directory", icon: Contact, roles: ["GLOBAL_ADMIN", "BRANCH_ADMIN", "DEPT_LEADER", "CELL_LEADER", "INTEREST_GROUP_LEADER"] },
  { path: "/reports", label: "Reports System", icon: FileText, roles: ["GLOBAL_ADMIN", "BRANCH_ADMIN", "DEPT_LEADER", "CELL_LEADER", "INTEREST_GROUP_LEADER"] },
  { path: "/settings", label: "Settings", icon: SettingsIcon, roles: ["GLOBAL_ADMIN", "BRANCH_ADMIN", "DEPT_LEADER", "CELL_LEADER", "INTEREST_GROUP_LEADER"] },
];

export function Sidebar() {
  const location = useLocation();
  const { user, logout, profiles, fetchProfiles, theme } = useAppStore();

  const topItems = user ? allItems.filter(item => item.roles.includes(user.role)) : [];

  useEffect(() => {
    if (user) {
      fetchProfiles(user);
    }
  }, [user, fetchProfiles]);

  const passwordRequests = useAppStore(state => state.passwordRequests) || [];
  const pendingPasswordCount = passwordRequests.filter(req => {
    if (!user) return false;
    if (req.status !== "PENDING") return false;
    if (user.role === "GLOBAL_ADMIN") {
        return true; 
    }
    if (user.role === "BRANCH_ADMIN" && req.branchName === user.branchName) {
        if (req.role === "GLOBAL_ADMIN" || req.role === "BRANCH_ADMIN") return false;
        return true;
    }
    return false;
  }).length;

  const pendingRegistrationsCount = (profiles || []).filter(p => p.status === "PENDING").length;
  const totalPendingApprovals = pendingRegistrationsCount + pendingPasswordCount;

  return (
    <div className="hidden md:flex flex-col w-64 h-screen fixed left-0 top-0 border-r border-royal-purple/20 bg-[#0B0118]/80 backdrop-blur-2xl z-40">
      <div className="p-6 flex items-center gap-3 pt-8">
        <img src={theme === "light" ? "/logo_purple.png" : "/logo.png"} alt="Logo" className="w-10 h-10 object-contain drop-shadow-[0_0_15px_rgba(120,81,169,0.5)]" />
        <div>
          <h1 className="font-bold tracking-wider text-sm uppercase text-white">Pistis Nexus</h1>
          <p className="text-[10px] text-lilac uppercase tracking-widest">Command OS</p>
        </div>
      </div>

      <nav id="tour-sidebar-nav" className="flex-1 px-4 py-6 flex flex-col gap-2 overflow-y-auto">
        <div className="text-xs font-semibold text-lilac/50 uppercase tracking-wider mb-2 px-4">Modules</div>
        {topItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          const isDirectory = item.path === "/directory";
          return (
            <Link
              key={item.path}
              to={item.path}
              id={isDirectory ? "tour-directory" : undefined}
              className={cn(
                "flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 relative group overflow-hidden",
                isActive ? "text-white bg-white/5" : "text-lilac/70 hover:text-white hover:bg-white/5"
              )}
            >
              {isActive && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-royal-purple shadow-[0_0_10px_rgba(120,81,169,1)]" />
              )}
              <div className="flex items-center gap-3 z-10">
                <Icon className="w-5 h-5" />
                <span className="font-medium text-sm">{item.label}</span>
              </div>
              {item.path === "/approvals" && totalPendingApprovals > 0 && (
                <span className="z-10 bg-amber-500 text-black text-[10px] font-bold px-2.5 py-0.5 rounded-full antialiased animate-pulse shadow-md shrink-0">
                  {totalPendingApprovals}
                </span>
              )}
              {isActive && (
                 <div className="absolute inset-0 bg-gradient-to-r from-royal-purple/10 to-transparent opacity-50 pointer-events-none" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 mt-auto">
        <div className="glass-panel text-xs p-4 flex flex-col gap-2">
          <div className="flex items-center gap-3 text-emerald-400 mb-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold text-[10px] tracking-widest uppercase">System Active</span>
          </div>
          
          <div className="flex items-center gap-3 w-full mb-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-royal-purple via-deep-violet to-emerald-400 p-[1px] shrink-0">
              <div className="w-full h-full bg-[#0a0214] rounded-[11px] overflow-hidden flex items-center justify-center">
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white font-bold text-sm">{user?.name?.charAt(0).toUpperCase()}</span>
                )}
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-lavender truncate font-bold text-sm tracking-wide">{user?.name}</p>
              <p className="text-[10px] tracking-wider text-lilac/60 uppercase truncate">{user?.role.replace('_', ' ')}</p>
            </div>
          </div>
          
          <button 
            onClick={logout} 
            className="mt-3 flex items-center justify-center gap-2 text-rose-400 hover:text-white hover:bg-rose-500/20 py-2.5 rounded-xl transition-colors border border-rose-400/20 bg-rose-500/5"
          >
            <LogOut className="w-4 h-4" /> <span className="font-semibold">Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
