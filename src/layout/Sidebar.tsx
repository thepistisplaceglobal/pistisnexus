import { useAppStore } from "@/store/useAppStore";
import { useNavigate, useLocation } from "react-router-dom";
import { LayoutDashboard, Network, Wallet, Users, Home, FileText, Compass, Contact, Key, LogOut, Settings, GraduationCap } from "lucide-react";

export function Sidebar() {
  const { user, currentModule, setCurrentModule, logout, theme, updateUser } = useAppStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const allItems = [
    { name: "Hub", id: "Hub", icon: LayoutDashboard, path: "/", roles: ["GLOBAL_ADMIN", "BRANCH_ADMIN", "DEPT_LEADER", "CELL_LEADER", "INTEREST_GROUP_LEADER", "FOUNDATION_SCHOOL", "HOME_CELL_COORD"] },
    { name: "City Expressions", id: "Branches", icon: Network, path: "/branches", roles: ["GLOBAL_ADMIN"] },
    { name: "Access Approvals", id: "Approvals", icon: Key, path: "/approvals", roles: ["GLOBAL_ADMIN", "BRANCH_ADMIN"] },
    { name: "Finance", id: "Finance", icon: Wallet, path: "/finance", roles: ["DEPT_LEADER", "CELL_LEADER", "INTEREST_GROUP_LEADER"] },
    { name: "Departments", id: "Departments", icon: Users, path: "/departments", roles: ["GLOBAL_ADMIN", "BRANCH_ADMIN", "DEPT_LEADER"] },
    { name: "Home Cells", id: "HomeCells", icon: Home, path: "/homecells", roles: ["GLOBAL_ADMIN", "BRANCH_ADMIN", "CELL_LEADER", "HOME_CELL_COORD", "DEPT_LEADER"] },
    { name: "Interest Groups", id: "InterestGroups", icon: Compass, path: "/interest", roles: ["GLOBAL_ADMIN", "BRANCH_ADMIN", "INTEREST_GROUP_LEADER"] },
    { name: "Foundation School", id: "FoundationSchool", icon: GraduationCap, path: "/foundationschool", roles: ["GLOBAL_ADMIN", "BRANCH_ADMIN", "FOUNDATION_SCHOOL"] },
    { name: "Leaders Directory", id: "Directory", icon: Contact, path: "/directory", roles: ["GLOBAL_ADMIN", "BRANCH_ADMIN", "DEPT_LEADER", "CELL_LEADER", "INTEREST_GROUP_LEADER", "FOUNDATION_SCHOOL", "HOME_CELL_COORD"] },
    { name: "Reports", id: "Reports", icon: FileText, path: "/reports", roles: ["GLOBAL_ADMIN", "BRANCH_ADMIN", "DEPT_LEADER", "CELL_LEADER", "INTEREST_GROUP_LEADER", "FOUNDATION_SCHOOL", "HOME_CELL_COORD"] },
    { name: "Settings", id: "Settings", icon: Settings, path: "/settings", roles: ["GLOBAL_ADMIN", "BRANCH_ADMIN", "DEPT_LEADER", "CELL_LEADER", "INTEREST_GROUP_LEADER", "FOUNDATION_SCHOOL", "HOME_CELL_COORD"] },
  ];

  const navItems = user 
    ? allItems.filter(item => {
        if (user.roles && user.roles.length > 0) {
          return item.roles.some(r => user.roles!.includes(r as any));
        }
        return item.roles.includes(user.role);
      }) 
    : [];

  const handleNavClick = (id: string, path: string) => {
    setCurrentModule(id);
    navigate(path);
  };

  return (
    <div id="tour-sidebar-nav" className={`hidden md:flex flex-col w-64 fixed top-0 left-0 h-full border-r z-50 ${theme === "light" ? "bg-white border-slate-200" : "bg-[#0B0118]/80 backdrop-blur-xl border-white/5"}`}>
      <div className="p-6 flex flex-col items-center border-b border-white/5 pb-8">
        <img src={theme === "light" ? "/logo_purple.png" : "/logo.png"} alt="Logo" className="w-16 h-16 object-contain mb-3 drop-shadow-[0_0_15px_rgba(120,81,169,0.5)]" />
        <h1 className={`font-bold tracking-wider text-sm uppercase ${theme === "light" ? "text-slate-900" : "text-white"}`}>Pistis Nexus</h1>
        <p className={`text-[10px] uppercase tracking-widest ${theme === "light" ? "text-royal-purple" : "text-lilac"}`}>Administrative System</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
        <div className="px-3 pb-2">
          <p className={`text-xs font-bold uppercase tracking-wider ${theme === "light" ? "text-slate-400" : "text-white/30"}`}>Main Menu</p>
        </div>
        
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentModule === item.id || window.location.pathname === item.path;
          return (
            <button
              key={item.name}
              id={`nav-${item.id}`} // Used for onboarding tour
              onClick={() => handleNavClick(item.id, item.path)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium ${
                isActive
                  ? (theme === "light" ? "bg-royal-purple/10 text-royal-purple" : "bg-royal-purple/20 text-white")
                  : (theme === "light" ? "text-slate-600 hover:bg-slate-50 hover:text-royal-purple" : "text-white/60 hover:bg-white/5 hover:text-white")
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? (theme === "light" ? "text-royal-purple" : "text-[#B193FB]") : ""}`} />
              {item.name}
            </button>
          );
        })}
      </div>

      <div className="p-4 mt-auto border-t border-white/5">
        <div className={`p-4 rounded-xl mb-4 ${theme === "light" ? "bg-slate-50 border border-slate-100" : "bg-white/5 border border-white/10"}`}>
          <p className={`text-xs font-bold truncate ${theme === "light" ? "text-slate-900" : "text-white"}`}>{user?.name || "User"}</p>
          <p className={`text-[10px] mt-0.5 uppercase tracking-wider ${theme === "light" ? "text-slate-500" : "text-white/40"}`}>
            Active: {(user?.role || "GUEST").replace(/_/g, ' ')}
          </p>
          {user?.roles && user.roles.length > 1 && (
            <div className="mt-2.5 pt-2 border-t border-white/10">
              <label className={`text-[9px] uppercase tracking-wider block mb-1 font-bold ${theme === "light" ? "text-slate-400" : "text-lilac/50"}`}>Switch Role</label>
              <select
                value={user.role}
                onChange={(e) => {
                  const newRole = e.target.value as any;
                  updateUser({ role: newRole });
                }}
                className={`w-full text-[10px] uppercase tracking-widest font-bold py-1 px-2 rounded-lg border focus:outline-none focus:ring-1 focus:ring-royal-purple transition-all cursor-pointer ${
                  theme === "light"
                    ? "bg-white border-slate-200 text-slate-700"
                    : "bg-black/40 border-white/10 text-emerald-400"
                }`}
              >
                {user.roles.map((r) => (
                  <option key={r} value={r} className={theme === "light" ? "text-slate-800" : "text-slate-200 bg-[#160b2d]"}>
                    {r.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        
        <button
          onClick={handleLogout}
          className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl transition-all text-sm font-medium ${
            theme === "light" ? "text-rose-600 hover:bg-rose-50" : "text-rose-400 hover:bg-rose-500/10"
          }`}
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  );
}
