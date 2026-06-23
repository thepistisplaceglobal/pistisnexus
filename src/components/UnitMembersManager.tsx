import React, { useState, useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { 
  Users, UserPlus, Search, Edit2, Trash2, Mail, Phone, 
  CheckCircle, AlertCircle, X, ChevronDown, Check, Sparkles, Filter 
} from "lucide-react";
import { GlassCard } from "./ui/GlassCard";
import { motion, AnimatePresence } from "motion/react";

export interface UnitMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: "ACTIVE" | "INACTIVE" | "TRAINING";
  unitType: "department" | "cell" | "interest_group";
  unitName: string;
  branchName: string;
  duty: string;
  joinedAt: string;
}

// Highly detailed seed members
const initialSeedMembers: UnitMember[] = [
  // Media Department
  {
    id: "m-1",
    name: "David Okon",
    email: "david.okon@pistisnexus.com",
    phone: "+234 812 345 6789",
    role: "Assistant Lead",
    status: "ACTIVE",
    unitType: "department",
    unitName: "Technical & Media",
    branchName: "Uyo Branch",
    duty: "Camera & Live Streaming Operator",
    joinedAt: "2025-01-15"
  },
  {
    id: "m-2",
    name: "Sarah Henshaw",
    email: "sarah.h@pistisnexus.com",
    phone: "+234 803 987 6543",
    role: "Volunteer Worker",
    status: "ACTIVE",
    unitType: "department",
    unitName: "Technical & Media",
    branchName: "Uyo Branch",
    duty: "Visual Controls & Projectionist",
    joinedAt: "2025-03-10"
  },
  {
    id: "m-3",
    name: "Emmanuel Bassey",
    email: "emmanuel.b@pistisnexus.com",
    phone: "+234 705 111 2222",
    role: "Apprentice",
    status: "TRAINING",
    unitType: "department",
    unitName: "Technical & Media",
    branchName: "Uyo Branch",
    duty: "Audio Intern",
    joinedAt: "2026-05-01"
  },
  
  // Living Portals (Choir)
  {
    id: "c-1",
    name: "Deborah King",
    email: "debbie.king@pistisnexus.com",
    phone: "+234 902 444 5555",
    role: "Vocal lead",
    status: "ACTIVE",
    unitType: "department",
    unitName: "The Living Portals (Choir)",
    branchName: "Uyo Branch",
    duty: "Sopranoist & Worship Coordinator",
    joinedAt: "2024-11-20"
  },
  {
    id: "c-2",
    name: "Samuel Archibong",
    email: "samuel.a@pistisnexus.com",
    phone: "+234 808 666 7777",
    role: "Instrumentalist",
    status: "ACTIVE",
    unitType: "department",
    unitName: "The Living Portals (Choir)",
    branchName: "Uyo Branch",
    duty: "Keyboardist / Music Director",
    joinedAt: "2025-02-18"
  },

  // Victory Cell Area 2
  {
    id: "hc-1",
    name: "Martha Akpan",
    email: "martha.akpan@gmail.com",
    phone: "+234 812 777 8888",
    role: "Assistant Cell Leader",
    status: "ACTIVE",
    unitType: "cell",
    unitName: "Victory Cell Area 2",
    branchName: "Uyo Branch",
    duty: "Welfare & Guest Follow-up",
    joinedAt: "2025-02-01"
  },
  {
    id: "hc-2",
    name: "Jerry Udoh",
    email: "jerry.udoh@outlook.com",
    phone: "+234 803 222 9999",
    role: "Regular Member",
    status: "ACTIVE",
    unitType: "cell",
    unitName: "Victory Cell Area 2",
    branchName: "Uyo Branch",
    duty: "Sanctuary setup volunteer",
    joinedAt: "2025-06-12"
  },
  {
    id: "hc-3",
    name: "Elizabeth Thompson",
    email: "eli.thompson@gmail.com",
    phone: "+234 706 444 3333",
    role: "Host",
    status: "ACTIVE",
    unitType: "cell",
    unitName: "Victory Cell Area 2",
    branchName: "Uyo Branch",
    duty: "Home Cell Venue Host",
    joinedAt: "2025-08-30"
  },

  // Pistis Runners Club
  {
    id: "ig-1",
    name: "Daniel Archibong",
    email: "daniel@archibong.me",
    phone: "+234 901 333 4444",
    role: "Co-Organizer",
    status: "ACTIVE",
    unitType: "interest_group",
    unitName: "Pistis Runners Club",
    branchName: "Uyo Branch",
    duty: "Weekly route planner & safety",
    joinedAt: "2025-03-01"
  },
  {
    id: "ig-2",
    name: "Grace Okon",
    email: "grace.okon@gmail.com",
    phone: "+234 812 555 1111",
    role: "Member",
    status: "ACTIVE",
    unitType: "interest_group",
    unitName: "Pistis Runners Club",
    branchName: "Uyo Branch",
    duty: "Social Media & Photos Coordinator",
    joinedAt: "2025-04-15"
  }
];

interface UnitMembersManagerProps {
  unitType: "department" | "cell" | "interest_group";
  preSelectedUnitName?: string;
}

export function UnitMembersManager({ unitType, preSelectedUnitName }: UnitMembersManagerProps) {
  const { user, theme } = useAppStore();
  const [members, setMembers] = useState<UnitMember[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUnit, setSelectedUnit] = useState<string>("ALL");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentMember, setCurrentMember] = useState<Partial<UnitMember>>({});
  const [notif, setNotif] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Load and seed members
  useEffect(() => {
    const stored = localStorage.getItem("pn_unit_members");
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as UnitMember[];
        // Filter elements that have key parameters populated
        setMembers(parsed);
      } catch (e) {
        console.error("Failed to parse unit members, resetting...", e);
        localStorage.setItem("pn_unit_members", JSON.stringify(initialSeedMembers));
        setMembers(initialSeedMembers);
      }
    } else {
      localStorage.setItem("pn_unit_members", JSON.stringify(initialSeedMembers));
      setMembers(initialSeedMembers);
    }
  }, []);

  const saveMembers = (updated: UnitMember[]) => {
    localStorage.setItem("pn_unit_members", JSON.stringify(updated));
    setMembers(updated);
  };

  // Determine the default unit name for search/filtration based on leader credentials
  const leaderAssignedUnit = React.useMemo(() => {
    if (!user) return "";
    if (user.role === "DEPT_LEADER") {
      return user.deptName || "Technical & Media";
    }
    if (user.role === "CELL_LEADER") {
      return user.groupName || "Victory Cell Area 2";
    }
    if (user.role === "INTEREST_GROUP_LEADER") {
      return user.groupName || "Pistis Runners Club";
    }
    return "";
  }, [user]);

  // Set selected unit based on role on mount or change
  useEffect(() => {
    if (preSelectedUnitName) {
      setSelectedUnit(preSelectedUnitName);
    } else if (leaderAssignedUnit) {
      setSelectedUnit(leaderAssignedUnit);
    } else {
      setSelectedUnit("ALL");
    }
  }, [leaderAssignedUnit, preSelectedUnitName]);

  // Extract list of unique unit names available for the specified unitType
  const availableUnits = React.useMemo(() => {
    const units = members
      .filter((m) => m.unitType === unitType)
      .map((m) => m.unitName);
    
    // Add default official names if none present to assist filter selection
    if (unitType === "department") {
      units.push("Technical & Media", "The Living Portals (Choir)", "Ushering", "Welfare");
    } else if (unitType === "cell") {
      units.push("Victory Cell Area 2", "Victory Cell Area 1", "Abak Road Home Cell");
    } else if (unitType === "interest_group") {
      units.push("Pistis Runners Club", "TECH Mountain", "Billionaires Group");
    }
    
    return Array.from(new Set(units));
  }, [members, unitType]);

  // Filter members based on user role boundaries & search queries
  const filteredMembers = React.useMemo(() => {
    return members.filter((m) => {
      // 1. Must match unitType
      if (m.unitType !== unitType) return false;

      // 2. Role Boundaries
      if (user) {
        // If specific leader role, strict lockdown of units!
        if (user.role === "DEPT_LEADER" && unitType === "department") {
          if (m.unitName.toLowerCase() !== leaderAssignedUnit.toLowerCase()) return false;
        } else if (user.role === "CELL_LEADER" && unitType === "cell") {
          if (m.unitName.toLowerCase() !== leaderAssignedUnit.toLowerCase()) return false;
        } else if (user.role === "INTEREST_GROUP_LEADER" && unitType === "interest_group") {
          if (m.unitName.toLowerCase() !== leaderAssignedUnit.toLowerCase()) return false;
        }
        
        // If BRANCH_ADMIN, limit to their own branch
        if (user.role === "BRANCH_ADMIN") {
          const userBranch = user.branchName || "Uyo Branch";
          if (m.branchName.toLowerCase() !== userBranch.toLowerCase()) return false;
        }
      }

      // 3. Selective dropdown unit filter (if not "ALL")
      if (selectedUnit !== "ALL") {
        if (m.unitName.toLowerCase() !== selectedUnit.toLowerCase()) return false;
      }

      // 4. Search text matches name, email, role or duty
      if (searchTerm.trim() !== "") {
        const query = searchTerm.toLowerCase();
        return (
          m.name.toLowerCase().includes(query) ||
          m.email.toLowerCase().includes(query) ||
          m.role.toLowerCase().includes(query) ||
          m.duty.toLowerCase().includes(query)
        );
      }

      return true;
    });
  }, [members, unitType, user, selectedUnit, searchTerm, leaderAssignedUnit]);

  // Notifications helper
  const triggerNotification = (type: "success" | "error", text: string) => {
    setNotif({ type, text });
    setTimeout(() => setNotif(null), 4000);
  };

  // Create or Update handler
  const handleSaveMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMember.name || !currentMember.role || !currentMember.unitName) {
      triggerNotification("error", "Please fill in all mandatory fields.");
      return;
    }

    const branchToUse = user?.branchName || currentMember.branchName || "Uyo Branch";

    if (isAddModalOpen) {
      // Create Member
      const newMember: UnitMember = {
        id: "m-" + Date.now().toString() + Math.random().toString(36).substring(2, 5),
        name: currentMember.name,
        email: currentMember.email || "",
        phone: currentMember.phone || "",
        role: currentMember.role,
        status: currentMember.status || "ACTIVE",
        unitType,
        unitName: currentMember.unitName,
        branchName: branchToUse,
        duty: currentMember.duty || "",
        joinedAt: currentMember.joinedAt || new Date().toISOString().split("T")[0]
      };

      const updated = [newMember, ...members];
      saveMembers(updated);
      setIsAddModalOpen(false);
      triggerNotification("success", `Successfully added ${newMember.name} as a unit member!`);
    } else {
      // Update Member
      const updated = members.map((m) => {
        if (m.id === currentMember.id) {
          return {
            ...m,
            ...currentMember,
            branchName: branchToUse
          } as UnitMember;
        }
        return m;
      });
      saveMembers(updated);
      setIsEditModalOpen(false);
      triggerNotification("success", `Successfully updated leadership properties for ${currentMember.name}!`);
    }

    setCurrentMember({});
  };

  const handleDeleteMember = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to remove ${name} from this unit roster?`)) {
      const updated = members.filter((m) => m.id !== id);
      saveMembers(updated);
      triggerNotification("success", `Removed ${name} from the roster.`);
    }
  };

  const handleOpenAddModal = () => {
    const defaultUnitName = preSelectedUnitName || leaderAssignedUnit || availableUnits[0] || "";
    setCurrentMember({
      role: "Member",
      status: "ACTIVE",
      unitName: defaultUnitName,
      joinedAt: new Date().toISOString().split("T")[0],
      duty: ""
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (member: UnitMember) => {
    setCurrentMember({ ...member });
    setIsEditModalOpen(true);
  };

  const currentLeaderUnitName = leaderAssignedUnit || preSelectedUnitName;

  return (
    <div className="flex flex-col gap-5 w-full">
      <GlassCard className="p-6 border border-white/5 bg-[#0D041E]/40 backdrop-blur-md">
        {/* Unit member roster header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4 pb-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-royal-purple/10 border border-royal-purple/20 text-[#B193FB]">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                Unit Members Roster
                {currentLeaderUnitName && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-medium">
                    {currentLeaderUnitName}
                  </span>
                )}
              </h3>
              <p className="text-xs text-lilac/60">
                {user?.role.includes("ADMIN") 
                  ? "Manual administration directory of members, volunteers, and officers." 
                  : `View, add, and manage members active within your assignment bounds.`}
              </p>
            </div>
          </div>

          <button 
            type="button"
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 bg-gradient-to-r from-royal-purple to-[#818cf8] text-white hover:from-royal-purple/95 hover:to-[#818cf8]/95 font-bold text-xs px-4 py-2.5 rounded-xl cursor-pointer shadow-lg shadow-royal-purple/10 active:scale-95 transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Member</span>
          </button>
        </div>

        {/* Filters and search block */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1 group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within/input:text-[#B193FB] transition-colors" />
            <input 
              type="text" 
              placeholder="Search by name, email, duty, or role..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs rounded-xl py-2.5 pl-11 pr-4 focus:outline-none border border-white/5 bg-black/40 text-white focus:ring-1 focus:ring-royal-purple/40 placeholder:text-white/20 transition-all"
            />
          </div>

          {/* Show unit selector only to admins/coords who see ALL units */}
          {!leaderAssignedUnit && !preSelectedUnitName && (
            <div className="relative min-w-[180px]">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-[10px] uppercase font-bold tracking-wider">Unit:</span>
              <select
                value={selectedUnit}
                onChange={(e) => setSelectedUnit(e.target.value)}
                className="w-full text-xs rounded-xl py-2.5 pl-14 pr-9 appearance-none focus:outline-none border border-white/5 bg-black/40 text-white focus:ring-1 focus:ring-royal-purple/40 font-semibold cursor-pointer transition-all"
              >
                <option value="ALL" className="bg-[#120524] text-white font-sans">All Units</option>
                {availableUnits.map((u) => (
                  <option key={u} value={u} className="bg-[#120524] text-white font-sans">{u}</option>
                ))}
              </select>
              <Filter className="absolute right-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
            </div>
          )}
        </div>

        {/* Global actions/alerts notification bar */}
        {notif && (
          <div className={`p-3 rounded-xl mb-4 text-xs font-semibold flex items-center gap-2.5 border animate-in fade-in zoom-in-95 duration-200 ${
            notif.type === "success" 
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
              : "bg-red-500/10 border-red-500/20 text-red-400"
          }`}>
            {notif.type === "success" ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{notif.text}</span>
          </div>
        )}

        {/* Grid display of members list */}
        {filteredMembers.length === 0 ? (
          <div className="py-12 border border-dashed border-white/5 rounded-2xl flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center mb-3 bg-white/5">
              <Users className="w-5 h-5 text-lilac/30" />
            </div>
            <h4 className="text-white font-bold text-sm">No Members Located</h4>
            <p className="text-lilac/50 text-[11px] max-w-xs mt-1 leading-normal">
              There are no unit members matching your bounds or search criteria. Click &apos;Add Member&apos; to append one manually.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMembers.map((m) => {
              const isActive = m.status === "ACTIVE";
              const isTraining = m.status === "TRAINING";
              
              return (
                <motion.div 
                  key={m.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`p-4 rounded-xl border transition-all duration-300 relative group/card flex flex-col justify-between ${
                    theme === "light" 
                      ? "bg-white border-slate-200/80 hover:shadow-md" 
                      : "bg-white/5 border-white/10 hover:bg-white/10"
                  }`}
                >
                  <div>
                    {/* Status badges */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{m.unitName}</span>
                      <span className={`text-[9px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                        isActive 
                          ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20" 
                          : isTraining 
                          ? "bg-amber-500/15 text-amber-400 border border-amber-500/20"
                          : "bg-white/5 text-white/40 border border-white/10"
                      }`}>
                        {m.status}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-white tracking-tight leading-tight mb-1">{m.name}</h4>
                    <p className="text-[11px] font-bold mt-1 inline-flex text-[#B193FB] bg-[#B193FB]/10 border border-[#B193FB]/15 px-2 py-0.5 rounded-md">
                      {m.role}
                    </p>

                    {m.duty && (
                      <p className="text-xs text-lilac/70 italic mt-2.5 border-l-2 border-royal-purple/40 pl-2 leading-relaxed">
                        {m.duty}
                      </p>
                    )}

                    <div className="mt-4 pt-3 border-t border-white/5 space-y-1.5">
                      {m.email && (
                        <div className="flex items-center gap-2 text-xs text-lilac/60">
                          <Mail className="w-3.5 h-3.5 text-white/30" />
                          <span className="truncate">{m.email}</span>
                        </div>
                      )}
                      {m.phone && (
                        <div className="flex items-center gap-2 text-xs text-lilac/60">
                          <Phone className="w-3.5 h-3.5 text-white/30" />
                          <span>{m.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                    <span className="text-[10px] text-white/30 font-semibold font-mono">Joined: {m.joinedAt}</span>
                    
                    <div className="flex items-center gap-1 opacity-90 md:opacity-0 md:group-hover/card:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(m)}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-royal-purple/20 text-indigo-300 hover:text-white transition-all cursor-pointer border border-white/5"
                        title="Edit properties"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteMember(m.id, m.name)}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 text-rose-300 hover:text-white transition-all cursor-pointer border border-white/5"
                        title="Remove member"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </GlassCard>

      {/* Manual Roster Member Form Drawer/Modal */}
      <AnimatePresence>
        {(isAddModalOpen || isEditModalOpen) && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-md bg-[#110524] border border-white/10 rounded-2xl overflow-hidden shadow-2xl relative"
            >
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-royal-purple to-[#818cf8]" />
              
              <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#B193FB]" />
                  {isAddModalOpen ? "Register New Member" : "Modify Member Account"}
                </h3>
                <button 
                  onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); setCurrentMember({}); }}
                  className="p-1.5 rounded-lg hover:bg-white/5 text-white/50 hover:text-white cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveMember} className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-lilac/70">Full Name *</label>
                  <input 
                    type="text" 
                    required
                    value={currentMember.name || ""}
                    onChange={(e) => setCurrentMember({ ...currentMember, name: e.target.value })}
                    placeholder="e.g. Samuel Archibong"
                    className="w-full text-xs rounded-xl py-3 px-4 border border-white/5 bg-black/40 text-white focus:outline-none focus:ring-1 focus:ring-royal-purple placeholder:text-white/20 transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold tracking-wider text-lilac/70">Assigned Assignment *</label>
                    <select
                      required
                      disabled={!!leaderAssignedUnit || !!preSelectedUnitName}
                      value={currentMember.unitName || ""}
                      onChange={(e) => setCurrentMember({ ...currentMember, unitName: e.target.value })}
                      className="w-full text-xs rounded-xl py-3 px-4 border border-white/5 bg-black/40 text-white focus:outline-none focus:ring-1 focus:ring-royal-purple cursor-pointer transition-all disabled:opacity-50"
                    >
                      {availableUnits.map((u) => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold tracking-wider text-lilac/70">Role / Office *</label>
                    <input 
                      type="text" 
                      required
                      value={currentMember.role || ""}
                      onChange={(e) => setCurrentMember({ ...currentMember, role: e.target.value })}
                      placeholder="e.g. Key Worker, Volunteer"
                      className="w-full text-xs rounded-xl py-3 px-4 border border-white/5 bg-black/40 text-white focus:outline-none focus:ring-1 focus:ring-royal-purple placeholder:text-white/20 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-lilac/70">Activity / Duties</label>
                  <input 
                    type="text" 
                    value={currentMember.duty || ""}
                    onChange={(e) => setCurrentMember({ ...currentMember, duty: e.target.value })}
                    placeholder="e.g. Audio engineering desk, camera operator"
                    className="w-full text-xs rounded-xl py-3 px-4 border border-white/5 bg-black/40 text-white focus:outline-none focus:ring-1 focus:ring-royal-purple placeholder:text-white/20 transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold tracking-wider text-lilac/70">Status</label>
                    <select
                      value={currentMember.status || "ACTIVE"}
                      onChange={(e) => setCurrentMember({ ...currentMember, status: e.target.value as any })}
                      className="w-full text-xs rounded-xl py-3 px-4 border border-white/5 bg-black/40 text-white focus:outline-none focus:ring-1 focus:ring-royal-purple cursor-pointer transition-all"
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="INACTIVE">INACTIVE</option>
                      <option value="TRAINING">TRAINING</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold tracking-wider text-lilac/70">Joined Date</label>
                    <input 
                      type="date" 
                      value={currentMember.joinedAt || ""}
                      onChange={(e) => setCurrentMember({ ...currentMember, joinedAt: e.target.value })}
                      className="w-full text-xs rounded-xl py-3 px-4 border border-white/5 bg-black/40 text-white focus:outline-none focus:ring-1 focus:ring-royal-purple cursor-pointer transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold tracking-wider text-lilac/70">Email Address</label>
                    <input 
                      type="email" 
                      value={currentMember.email || ""}
                      onChange={(e) => setCurrentMember({ ...currentMember, email: e.target.value })}
                      placeholder="e.g. member@gmail.com"
                      className="w-full text-xs rounded-xl py-3 px-4 border border-white/5 bg-black/40 text-white focus:outline-none focus:ring-1 focus:ring-royal-purple placeholder:text-white/20 transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold tracking-wider text-lilac/70">Phone Number</label>
                    <input 
                      type="tel" 
                      value={currentMember.phone || ""}
                      onChange={(e) => setCurrentMember({ ...currentMember, phone: e.target.value })}
                      placeholder="e.g. +234 803 123 4567"
                      className="w-full text-xs rounded-xl py-3 px-4 border border-white/5 bg-black/40 text-white focus:outline-none focus:ring-1 focus:ring-royal-purple placeholder:text-white/20 transition-all"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-white/5 flex gap-3">
                  <button
                    type="button"
                    onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); setCurrentMember({}); }}
                    className="flex-1 rounded-xl py-3 border border-white/10 hover:bg-white/5 text-white/80 font-bold text-xs transition-all cursor-pointer active:scale-98"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 rounded-xl py-3 bg-[#E0E7FF] text-[#1E1B4B] hover:bg-white/95 font-bold text-xs shadow-lg active:scale-98 transition-all cursor-pointer font-sans"
                  >
                    {isAddModalOpen ? "Add Member" : "Save Changes"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
