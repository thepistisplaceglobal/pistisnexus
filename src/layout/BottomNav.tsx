import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Network, Wallet, Users, Home, FileText, Compass, Contact, Key, Menu, X, Settings as SettingsIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";
import { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";

const allItems = [
  { path: "/", label: "Hub", icon: LayoutDashboard, roles: ["GLOBAL_ADMIN", "BRANCH_ADMIN", "DEPT_LEADER", "CELL_LEADER", "INTEREST_GROUP_LEADER"] },
  { path: "/branches", label: "Branches", icon: Network, roles: ["GLOBAL_ADMIN"] },
  { path: "/approvals", label: "Apps", icon: Key, roles: ["GLOBAL_ADMIN", "BRANCH_ADMIN"] },
  { path: "/finance", label: "Finance", icon: Wallet, roles: ["GLOBAL_ADMIN", "BRANCH_ADMIN"] },
  { path: "/departments", label: "Depts", icon: Users, roles: ["BRANCH_ADMIN"] },
  { path: "/homecells", label: "Cells", icon: Home, roles: ["BRANCH_ADMIN", "CELL_LEADER"] },
  { path: "/interest", label: "Groups", icon: Compass, roles: ["BRANCH_ADMIN", "INTEREST_GROUP_LEADER"] },
  { path: "/directory", label: "Directory", icon: Contact, roles: ["GLOBAL_ADMIN", "BRANCH_ADMIN", "DEPT_LEADER", "CELL_LEADER", "INTEREST_GROUP_LEADER"] },
  { path: "/reports", label: "Reports", icon: FileText, roles: ["GLOBAL_ADMIN", "BRANCH_ADMIN", "DEPT_LEADER", "CELL_LEADER", "INTEREST_GROUP_LEADER"] },
  { path: "/settings", label: "Settings", icon: SettingsIcon, roles: ["GLOBAL_ADMIN", "BRANCH_ADMIN", "DEPT_LEADER", "CELL_LEADER", "INTEREST_GROUP_LEADER"] },
];

export function BottomNav() {
  const location = useLocation();
  const { user, profiles, fetchProfiles } = useAppStore();
  const [showMore, setShowMore] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  const navItems = user ? allItems.filter(item => item.roles.includes(user.role)) : [];
  
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
  const totalPendingApprovals = pendingPasswordCount + pendingRegistrationsCount;
  
  const visibleItems = navItems.length > 5 ? navItems.slice(0, 4) : navItems;
  const overflowItems = navItems.length > 5 ? navItems.slice(4) : [];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMore(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      <AnimatePresence>
        {showMore && overflowItems.length > 0 && (
          <>
            {/* Backdrop for the popup with iOS style smooth blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-md z-40"
              onClick={() => setShowMore(false)}
            />
            {/* Slide-out Bottom Sheet styled like standard iOS action menu */}
            <motion.div 
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0.05, bottom: 0.95 }}
              onDragEnd={(_, info) => {
                if (info.offset.y > 100 || info.velocity.y > 400) {
                  setShowMore(false);
                }
              }}
              initial={{ opacity: 0, y: "100%" }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              ref={menuRef}
              className="absolute bottom-0 left-0 right-0 bg-[#0e0420]/95 backdrop-blur-2xl border-t border-white/10 rounded-t-[20px] px-6 pt-5 pb-[calc(76px+env(safe-area-inset-bottom))] shadow-2xl flex flex-col gap-2 z-50 max-h-[85vh] overflow-y-auto scrollbar-hide touch-pan-y"
            >
              <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-4 cursor-grab active:cursor-grabbing" />
              <div className="text-lilac/40 text-xs font-semibold uppercase tracking-widest px-1 mb-2">More Tools</div>
              <div className="grid grid-cols-2 gap-3">
                {overflowItems.map((item, index) => {
                  const isActive = location.pathname === item.path;
                  const Icon = item.icon;
                  return (
                    <motion.div
                      key={item.path}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.04 }}
                    >
                      <Link
                        to={item.path}
                        onClick={() => setShowMore(false)}
                        className={cn(
                          "flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 relative overflow-hidden group border",
                          isActive 
                            ? "bg-royal-purple/40 text-white border-royal-purple/50 shadow-inner" 
                            : "bg-white/5 text-lilac/80 border-white/5 hover:bg-white/10 hover:text-white"
                        )}
                      >
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0 relative">
                          <Icon className={cn("w-4 h-4 transition-transform group-hover:scale-110", isActive ? "text-emerald-400" : "text-lilac/70")} />
                          {item.path === "/approvals" && totalPendingApprovals > 0 && (
                            <span className="absolute -top-1 -right-1 bg-amber-500 text-black text-[9px] font-bold h-3.5 w-3.5 rounded-full flex items-center justify-center border border-black shadow">
                              {totalPendingApprovals}
                            </span>
                          )}
                        </div>
                        <span className="text-xs font-semibold tracking-wide whitespace-nowrap">{item.label}</span>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="w-full bg-[#070112]/92 backdrop-blur-2xl border-t border-white/5 px-2 pt-2 pb-[calc(6px+env(safe-area-inset-bottom,12px))] flex justify-around items-center z-50 relative shadow-[0_-10px_35px_rgba(0,0,0,0.8)]">
        {visibleItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              id={`tab-item-${item.label.toLowerCase()}`}
              className={cn(
                "flex flex-col items-center gap-1 py-1 rounded-lg transition-colors relative group flex-1 max-w-[80px]",
                isActive ? "text-emerald-400" : "text-lilac/45 hover:text-lilac/80"
              )}
            >
              <div className="relative flex items-center justify-center">
                {isActive && (
                  <motion.div 
                    layoutId="activeNavIndicator"
                    className="absolute inset-0 w-8 h-8 bg-royal-purple/20 blur-md rounded-full -z-10" 
                    transition={{ type: "spring", stiffness: 350, damping: 25 }}
                  />
                )}
                <Icon className={cn("w-[21px] h-[21px] transition-transform duration-250", isActive ? "scale-105" : "group-hover:scale-105")} />
                {item.path === "/approvals" && totalPendingApprovals > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-amber-500 text-black text-[9px] font-bold h-4 w-4 rounded-full flex items-center justify-center animate-pulse border border-black shadow">
                    {totalPendingApprovals}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium tracking-wide">
                {item.label}
              </span>
              
              {isActive && (
                <motion.div
                  layoutId="activeNavDot"
                  className="absolute -bottom-0.5 w-[3px] h-[3px] rounded-full bg-emerald-400"
                  transition={{ type: "spring", stiffness: 350, damping: 25 }}
                />
              )}
            </Link>
          );
        })}

        {overflowItems.length > 0 && (
          <button
            onClick={() => setShowMore(!showMore)}
            id="tab-item-more"
            className={cn(
              "flex flex-col items-center gap-1 py-1 rounded-lg transition-colors relative group flex-1 max-w-[80px]",
              showMore ? "text-emerald-400" : "text-lilac/45 hover:text-lilac/80"
            )}
          >
            <div className="relative flex items-center justify-center">
              {showMore && (
                <div className="absolute inset-0 w-8 h-8 bg-royal-purple/20 blur-md rounded-full -z-10" />
              )}
              {showMore ? (
                <X className="w-[21px] h-[21px] transition-transform duration-250" />
              ) : (
                <>
                  <Menu className="w-[21px] h-[21px] transition-transform duration-250 group-hover:scale-105" />
                  {totalPendingApprovals > 0 && overflowItems.some(i => i.path === "/approvals") && (
                    <span className="absolute -top-1.5 -right-1.5 bg-amber-500 text-black text-[9px] font-bold h-4 w-4 rounded-full flex items-center justify-center animate-pulse border border-black shadow">
                      {totalPendingApprovals}
                    </span>
                  )}
                </>
              )}
            </div>
            <span className="text-[10px] font-medium tracking-wide">
              More
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
