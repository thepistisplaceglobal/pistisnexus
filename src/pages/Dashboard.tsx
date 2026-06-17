import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { supabase } from "@/lib/supabase";
import { GlassCard } from "@/components/ui/GlassCard";
import { MetricCard } from "@/components/ui/MetricCard";
import { InsightCard } from "@/components/ui/InsightCard";
import { ChartPanel } from "@/components/ui/ChartPanel";
import { LineChartPanel } from "@/components/ui/LineChartPanel";
import { BranchUpdates } from "@/components/ui/BranchUpdates";
import { GlobalAIInsight } from "@/components/ui/GlobalAIInsight";
import { GlobalTrendsWidget } from "@/components/ui/GlobalTrendsWidget";
import { GlobalLeaderboardWidget } from "@/components/ui/GlobalLeaderboardWidget";
import { BranchAIInsight } from "@/components/ui/BranchAIInsight";
import { BranchPendingReportsWidget } from "@/components/ui/BranchPendingReportsWidget";
import { BranchAggregationSummaryWidget } from "@/components/ui/BranchAggregationSummaryWidget";
import { BranchDeadlineViolationAlert } from "@/components/ui/BranchDeadlineViolationAlert";
import { BranchDepartmentComplianceHeatmap } from "@/components/ui/BranchDepartmentComplianceHeatmap";
import { OnboardingModal } from "@/components/ui/OnboardingModal";
import { ReportDeadlineAlert } from "@/components/ui/ReportDeadlineAlert";
import { LeaderActivityChart } from "@/components/ui/LeaderActivityChart";
import { GlobalMessagingWidget } from "@/components/ui/GlobalMessagingWidget";
import { BranchMessagingWidget } from "@/components/ui/BranchMessagingWidget";
import { GlobalToBranchMessagingWidget } from "@/components/ui/GlobalToBranchMessagingWidget";
import { BranchToUnitMessagingWidget } from "@/components/ui/BranchToUnitMessagingWidget";
import { BroadcastReachWidget } from "@/components/ui/BroadcastReachWidget";
import { UpcomingBirthdaysWidget } from "@/components/ui/UpcomingBirthdaysWidget";
import { AttendanceTrendsWidget } from "@/components/ui/AttendanceTrendsWidget";
import { NotificationBanner } from "@/components/ui/NotificationBanner";
import { SoulsTrendWidget } from "@/components/ui/SoulsTrendWidget";
import { Users, Building2, TrendingUp, Sparkles, Activity, Home, Compass } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { ActivityStream } from "@/components/ui/ActivityStream";

const DEFAULT_BRANCH_CELLS: Record<string, string[]> = {
  "Uyo (HQ)": [
    "Abak Road Home Cell",
    "Atiku Home Cell",
    "Ibesikpo Home Cell",
    "Ikotekpene Road Home Cell",
    "Ekom Iman and Idoro Home Cell",
    "Aka Road Home Cell",
    "AKSU Home Cell",
    "Nwaniba Home Cell",
    "Oron Road Home Cell"
  ],
  "Calabar": [
    "Calabar Central Cell",
    "Marian Road Cell",
    "Unical Campus Cell",
    "Watt Market Cell",
    "Eight Miles Cell"
  ],
  "Port Harcourt": [
    "GRA Phase 2 Cell",
    "Choba Cell",
    "Trans-Amadi Cell",
    "Elelenwo Cell",
    "Ada George Cell"
  ],
  "London": [
    "Greenwich Cell",
    "Canary Wharf Cell",
    "Stratford Cell",
    "Wembley Cell"
  ]
};

function CoordinatorCellManager({ user }: { user: any }) {
  const branch = user?.branchName || "Uyo (HQ)";
  const [cells, setCells] = useState<string[]>([]);
  const [newCellName, setNewCellName] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const loadCells = () => {
    let currentCells = DEFAULT_BRANCH_CELLS[branch] || [];
    try {
      const saved = localStorage.getItem("branch_cells");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed[branch]) {
          currentCells = parsed[branch];
        }
      } else {
        localStorage.setItem("branch_cells", JSON.stringify(DEFAULT_BRANCH_CELLS));
      }
    } catch (e) {
      console.error(e);
    }
    setCells(currentCells);
  };

  useEffect(() => {
    loadCells();
  }, [branch]);

  const handleAddCell = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCellName.trim()) return;

    try {
      const savedStr = localStorage.getItem("branch_cells") || JSON.stringify(DEFAULT_BRANCH_CELLS);
      const val = JSON.parse(savedStr);
      if (!val[branch]) val[branch] = [];
      
      if (val[branch].includes(newCellName.trim())) {
        alert("This cell name already exists!");
        return;
      }

      const updated = [...val[branch], newCellName.trim()];
      val[branch] = updated;
      localStorage.setItem("branch_cells", JSON.stringify(val));
      setCells(updated);
      setNewCellName("");
      setSuccessMsg(`"${newCellName.trim()}" successfully added to local registry!`);
      setTimeout(() => setSuccessMsg(""), 3500);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <GlassCard className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
          <Home className="w-5 h-5 text-indigo-400" />
        </div>
        <div>
          <h3 className="text-white font-bold text-base">District Cell Registry</h3>
          <p className="text-xs text-lilac/60 font-medium">Register authorized Home Cells under your {branch} administration</p>
        </div>
      </div>

      <form onSubmit={handleAddCell} className="flex gap-2 mb-4">
        <input 
          type="text"
          placeholder="New Cell Name (e.g. Ikpa Road Home Cell)"
          required
          value={newCellName}
          onChange={e => setNewCellName(e.target.value)}
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:border-royal-purple focus:ring-1 focus:ring-royal-purple/50 outline-none transition-all"
        />
        <button 
          type="submit"
          className="bg-royal-purple hover:bg-royal-purple/80 text-white font-bold px-4 py-2 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md"
        >
          Add Cell
        </button>
      </form>

      {successMsg && (
        <div className="p-2.5 mb-3 text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg">
          {successMsg}
        </div>
      )}

      <div className="max-h-[185px] overflow-y-auto space-y-1.5 pr-1">
        {cells.map((cell, index) => (
          <div key={index} className="flex justify-between items-center py-2 px-3 bg-white/5 rounded-lg border border-white/5 text-xs text-lavender/90">
            <span>{cell}</span>
            <span className="text-[10px] text-indigo-400 font-bold bg-indigo-500/10 px-2 py-0.5 rounded-full">Active</span>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

function LeaderRosterManager({ user, updateUser }: { user: any; updateUser: any }) {
  const [baseMembership, setBaseMembership] = useState(user?.baseMembership || 15);
  const [members, setMembers] = useState<string[]>([]);
  const [newMemberName, setNewMemberName] = useState("");
  const [isEditingBase, setIsEditingBase] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(`unit_members_${user?.id}`);
      if (saved) {
        setMembers(JSON.parse(saved));
      } else {
        const defaults = ["Sister Sarah Paul", "Brother Jerry Thompson", "Sister Deborah Elijah"];
        setMembers(defaults);
        localStorage.setItem(`unit_members_${user?.id}`, JSON.stringify(defaults));
      }
    } catch (e) {
      console.error(e);
    }
  }, [user?.id]);

  const handleUpdateBase = (e: React.FormEvent) => {
    e.preventDefault();
    updateUser({ baseMembership: Number(baseMembership) });
    setIsEditingBase(false);
  };

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) return;

    const updated = [...members, newMemberName.trim()];
    setMembers(updated);
    localStorage.setItem(`unit_members_${user?.id}`, JSON.stringify(updated));
    setNewMemberName("");
  };

  const opponentRemoveMember = (idxToRemove: number) => {
    const updated = members.filter((_, idx) => idx !== idxToRemove);
    setMembers(updated);
    localStorage.setItem(`unit_members_${user?.id}`, JSON.stringify(updated));
  };

  return (
    <GlassCard className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-5 border-b border-white/5 pb-4">
        <div className="text-left">
          <h3 className="text-white font-bold text-base flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-400 animate-pulse" />
            Unit Roster & Membership strength
          </h3>
          <p className="text-xs text-lilac/60">Configure strength baselines and maintain your active member directory</p>
        </div>
        
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3.5 py-1.5 rounded-xl">
          <span className="text-xs font-semibold text-lilac/70">Total Strength:</span>
          {isEditingBase ? (
            <form onSubmit={handleUpdateBase} className="flex items-center gap-1.5">
              <input 
                type="number"
                min="0"
                required
                value={baseMembership}
                onChange={e => setBaseMembership(Number(e.target.value))}
                className="w-16 bg-[#160a2c] text-white border border-indigo-500/40 rounded px-1.5 py-0.5 text-xs font-bold text-center"
              />
              <button type="submit" className="text-[10px] text-emerald-400 uppercase tracking-widest font-extrabold hover:underline">Save</button>
            </form>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-white">{user?.baseMembership || baseMembership}</span>
              <button 
                onClick={() => setIsEditingBase(true)}
                className="text-[10px] text-royal-purple uppercase tracking-widest font-extrabold hover:underline cursor-pointer"
              >
                Edit
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <div className="flex justify-between items-center mb-3">
             <span className="text-xs uppercase tracking-wider text-lilac/60 font-semibold text-left">Active Members Roll ({members.length})</span>
          </div>
          <div className="max-h-[220px] overflow-y-auto space-y-1.5 pr-1 bg-black/20 rounded-xl p-3 border border-white/5">
             {members.length === 0 ? (
               <p className="text-xs text-lilac/40 text-center py-6">No members listed yet. Add unit members below.</p>
             ) : (
               members.map((member, index) => (
                 <div key={index} className="flex justify-between items-center py-2 px-3 bg-[#130626]/60 rounded-lg border border-white/5 text-xs text-lavender/90 hover:bg-[#1c0f38] transition-colors">
                   <div className="flex items-center gap-2">
                     <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                     <span className="text-left">{member}</span>
                   </div>
                   <button 
                     onClick={() => opponentRemoveMember(index)}
                     className="text-rose-400 hover:text-rose-300 font-extrabold text-[10px] uppercase cursor-pointer tracking-wider"
                   >
                     Remove
                   </button>
                 </div>
               ))
             )}
          </div>
        </div>

        <div className="flex flex-col justify-start">
          <span className="text-xs uppercase tracking-wider text-lilac/60 font-semibold mb-3 text-left">Add Custom Unit Member</span>
          <form onSubmit={handleAddMember} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-lilac/50 text-left">Full Name</label>
              <input 
                type="text"
                placeholder="e.g. Brother Barnabas Paul"
                required
                value={newMemberName}
                onChange={e => setNewMemberName(e.target.value)}
                className="bg-[#120524] border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:border-royal-purple focus:ring-1 focus:ring-royal-purple/50 outline-none transition-all"
              />
            </div>
            <button 
              type="submit"
              className="bg-royal-purple hover:bg-royal-purple/80 text-white font-bold py-2.5 rounded-xl transition-all text-xs uppercase tracking-widest cursor-pointer shadow-lg mt-1"
            >
              Add Member to Roster
            </button>
          </form>
          <div className="mt-4 p-3 rounded-lg bg-indigo-500/5 border border-indigo-500/10 text-[11px] text-lilac/70 leading-relaxed text-left">
             This member directory is saved uniquely inside this dashboard. Keep your records up to date for pastoral follow-ups.
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

const mockGrowthData = [
  { month: "Jan", attendance: 11200, uyo: 8200, calabar: 3000, firstTimers: 250, returned: 120 },
  { month: "Feb", attendance: 11400, uyo: 8300, calabar: 3100, firstTimers: 280, returned: 140 },
  { month: "Mar", attendance: 11800, uyo: 8600, calabar: 3200, firstTimers: 320, returned: 180 },
  { month: "Apr", attendance: 12100, uyo: 8800, calabar: 3300, firstTimers: 380, returned: 220 },
  { month: "May", attendance: 12450, uyo: 9150, calabar: 3300, firstTimers: 412, returned: 284 },
];

export function Dashboard() {
  const user = useAppStore(state => state.user);
  const updateUser = useAppStore(state => state.updateUser);
  const [activeLeaderCount, setActiveLeaderCount] = useState<number>(0);
  const [pendingApprovalCount, setPendingApprovalCount] = useState<number>(0);
  const [pulseStats, setPulseStats] = useState({
    globalMembership: 12360,
    globalWeeklySouls: 470,
    globalMonthlySouls: 1880,
    branchMembership: 8520,
    branchWeeklySouls: 328,
    branchMonthlySouls: 1312,
  });

  useEffect(() => {
    const fetchStats = async () => {
      let profilesList: any[] = [];
      try {
        const { data, error } = await supabase.from("profiles").select("*");
        if (!error && data) {
          profilesList = data;
        }
      } catch (e) {
        console.warn("Database fetch in dashboard bypassed or offline:", e);
      }

      // Merge with local storage cache to ensure local signups count as well!
      try {
        const localP = localStorage.getItem("local_profiles");
        const localList = localP ? JSON.parse(localP) : [];
        const mergedMap = new Map();
        localList.forEach((p: any) => mergedMap.set(p.id, p));
        profilesList.forEach((p: any) => mergedMap.set(p.id, p));
        profilesList = Array.from(mergedMap.values());
      } catch (e) {}

      // Filter by branch name if the user is a branch admin
      if (user?.role === "BRANCH_ADMIN") {
        profilesList = profilesList.filter(p => p.branch_name === user.branchName);
      }

      const active = profilesList.filter(p => p.status === "APPROVED").length;
      const pending = profilesList.filter(p => p.status === "PENDING").length;

      setActiveLeaderCount(active);
      setPendingApprovalCount(pending);

      // Now query unit reports for Membership Strength and souls won
      let reportList: any[] = [];
      try {
        const { data, error } = await supabase.from("unit_reports").select("*");
        if (!error && data) {
          reportList = data;
        }
      } catch (e) {
        console.warn("Database fetch for reports offline:", e);
      }

      let uyoFollowupConverts = 0;
      let calabarFollowupConverts = 0;
      
      let uyoWeeklySouls = 0;
      let calabarWeeklySouls = 0;

      let uyoMonthlySouls = 0;
      let calabarMonthlySouls = 0;

      const now = new Date();

      reportList.forEach((report) => {
        const isUyo = report.branch_name?.toLowerCase().includes("uyo");
        const metrics = report.metrics || {};
        const createdAtStr = report.created_at || metrics.submitted_at || new Date().toISOString();
        const reportDate = new Date(createdAtStr);
        const diffTime = Math.abs(now.getTime() - reportDate.getTime());
        const isWeekly = diffTime <= (7 * 24 * 60 * 60 * 1000);
        const isMonthly = diffTime <= (30 * 24 * 60 * 60 * 1000);

        // 1. Membership: Total converted to members (Followup Unit pipeline)
        const isFollowup = report.unit_name?.toLowerCase().includes("follow");
        if (isFollowup) {
          const converts = parseInt(String(metrics["Total converted to members"] || metrics["convertedToMembers"] || "0").replace(/,/g, ''), 10) || 0;
          if (isUyo) {
            uyoFollowupConverts += converts;
          } else {
            calabarFollowupConverts += converts;
          }
        }

        // 2. Souls Won computation
        let reportSoulsWon = 0;

        // a. Souls won in Church (Followup unit)
        const churchSouls = parseInt(String(metrics["Number of souls won in Church (gave their lives to Jesus)"] || "0").replace(/,/g, ''), 10) || 0;
        reportSoulsWon += churchSouls;

        // b. Souls won in the mission field (Evangelism unit/Department report)
        const missionSouls = parseInt(String(metrics["Number of souls won in the mission field (gave their lives to Jesus)"] || "0").replace(/,/g, ''), 10) || 0;
        reportSoulsWon += missionSouls;

        // c. Home cell converts
        const cellConverts = parseInt(String(metrics["New converts"] || "0").replace(/,/g, ''), 10) || 0;
        reportSoulsWon += cellConverts;

        // Fallback for older data that doesn't have the new explicit souls won fields yet
        if (reportSoulsWon === 0) {
          const reached = parseInt(String(metrics["Number of people reached"] || "0").replace(/,/g, ''), 10) || 0;
          if (reached > 0) {
            // Assume 30% conversion for fallback
            reportSoulsWon = Math.round(reached * 0.3);
          }
        }

        if (isUyo) {
          if (isWeekly) uyoWeeklySouls += reportSoulsWon;
          if (isMonthly) uyoMonthlySouls += reportSoulsWon;
        } else {
          if (isWeekly) calabarWeeklySouls += reportSoulsWon;
          if (isMonthly) calabarMonthlySouls += reportSoulsWon;
        }
      });

      // Baseline figures (Pistis Place historic baseline defaults)
      const baseUyoMembership = 8520;
      const baseCalabarMembership = 3840;

      // Add dynamically inaugurated Foundation School graduates directly to the membership strength totals
      let uyoFSGradsCount = 0;
      let calabarFSGradsCount = 0;
      try {
        const storedGrads = localStorage.getItem("fs_graduates");
        if (storedGrads) {
          const fsGrads = JSON.parse(storedGrads);
          if (Array.isArray(fsGrads)) {
            uyoFSGradsCount = fsGrads.filter((g: any) => g.branch?.toLowerCase().includes("uyo")).length;
            calabarFSGradsCount = fsGrads.filter((g: any) => g.branch?.toLowerCase().includes("calabar")).length;
          }
        } else {
          // Default fallbacks matching pre-loaded seed data before first open
          uyoFSGradsCount = 1;
          calabarFSGradsCount = 1;
        }
      } catch (e) {
        console.warn("Error reading Foundation School graduates storage:", e);
      }
      
      const baseUyoWeeklySouls = 328;
      const baseCalabarWeeklySouls = 142;

      const baseUyoMonthlySouls = 1312; // 328 * 4
      const baseCalabarMonthlySouls = 568; // 142 * 4

      const liveUyoMembership = baseUyoMembership + uyoFollowupConverts + uyoFSGradsCount;
      const liveCalabarMembership = baseCalabarMembership + calabarFollowupConverts + calabarFSGradsCount;
      
      const liveUyoWeeklySouls = baseUyoWeeklySouls + uyoWeeklySouls;
      const liveCalabarWeeklySouls = baseCalabarWeeklySouls + calabarWeeklySouls;

      const liveUyoMonthlySouls = baseUyoMonthlySouls + uyoMonthlySouls;
      const liveCalabarMonthlySouls = baseCalabarMonthlySouls + calabarMonthlySouls;

      let cellWeeklySoulsSum = 0;
      let cellMonthlySoulsSum = 0;
      let cellMembershipConverts = 0;

      reportList.forEach((report) => {
        const reportCellName = report.unit_name;
        const isUserCell = reportCellName && user?.groupName && (reportCellName.toLowerCase() === user.groupName.toLowerCase());
        const isUserCellType = report.unit_type === "CELL";
        
        if (isUserCell || (isUserCellType && (report.leader_id === user?.id || (user?.groupName && report.unit_name?.toLowerCase() === user.groupName.toLowerCase())))) {
          const metrics = report.metrics || {};
          const createdAtStr = report.created_at || metrics.submitted_at || new Date().toISOString();
          const reportDate = new Date(createdAtStr);
          const diffTime = Math.abs(now.getTime() - reportDate.getTime());
          const isWeekly = diffTime <= (7 * 24 * 60 * 60 * 1000);
          const isMonthly = diffTime <= (30 * 24 * 60 * 60 * 1000);
          
          let reportSoulsWon = 0;
          const churchSouls = parseInt(String(metrics["Number of souls won in Church (gave their lives to Jesus)"] || "0").replace(/,/g, ''), 10) || 0;
          reportSoulsWon += churchSouls;
          const missionSouls = parseInt(String(metrics["Number of souls won in the mission field (gave their lives to Jesus)"] || "0").replace(/,/g, ''), 10) || 0;
          reportSoulsWon += missionSouls;
          const cellConverts = parseInt(String(metrics["New converts"] || "0").replace(/,/g, ''), 10) || 0;
          reportSoulsWon += cellConverts;

          if (isWeekly) cellWeeklySoulsSum += reportSoulsWon;
          if (isMonthly) cellMonthlySoulsSum += reportSoulsWon;

          const converts = parseInt(String(metrics["Total converted to members"] || metrics["convertedToMembers"] || "0").replace(/,/g, ''), 10) || 0;
          cellMembershipConverts += converts;
        }
      });

      const liveCellMembership = (user?.baseMembership || 18) + cellMembershipConverts;
      const liveCellWeeklySouls = cellWeeklySoulsSum || 2;
      const liveCellMonthlySouls = cellMonthlySoulsSum || 8;

      const isUserCalabar = user?.branchName?.toLowerCase().includes("calabar");
      
      const branchMembershipVal = user?.role === 'CELL_LEADER' 
        ? liveCellMembership 
        : (isUserCalabar ? liveCalabarMembership : liveUyoMembership);

      const branchWeeklySoulsVal = user?.role === 'CELL_LEADER' 
        ? liveCellWeeklySouls 
        : (isUserCalabar ? liveCalabarWeeklySouls : liveUyoWeeklySouls);

      const branchMonthlySoulsVal = user?.role === 'CELL_LEADER' 
        ? liveCellMonthlySouls 
        : (isUserCalabar ? liveCalabarMonthlySouls : liveUyoMonthlySouls);

      setPulseStats({
        globalMembership: liveUyoMembership + liveCalabarMembership,
        globalWeeklySouls: liveUyoWeeklySouls + liveCalabarWeeklySouls,
        globalMonthlySouls: liveUyoMonthlySouls + liveCalabarMonthlySouls,
        branchMembership: branchMembershipVal,
        branchWeeklySouls: branchWeeklySoulsVal,
        branchMonthlySouls: branchMonthlySoulsVal,
      });
    };

    fetchStats();
    // Refresh stats periodically
    const timer = setInterval(fetchStats, 10000);
    return () => clearInterval(timer);
  }, [user]);

  const getRoleSpecificData = () => {
    // Generate distinct data looking based on the name of the entity
    const generateSpecificData = (name: string, base: number) => {
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
          hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        const randomness = Math.abs(hash) % 50;
        
        return [
          { month: "Jan", attendance: base + randomness - 5 },
          { month: "Feb", attendance: base + randomness + 2 },
          { month: "Mar", attendance: base + randomness + 8 },
          { month: "Apr", attendance: base + randomness + 4 },
          { month: "May", attendance: base + randomness + 15 },
        ];
    };

    if (user?.role === 'DEPT_LEADER') return generateSpecificData(user?.deptName || 'Dept', user?.baseMembership || 30);
    if (user?.role === 'CELL_LEADER') return generateSpecificData(user?.groupName || 'Cell', user?.baseMembership || 10);
    if (user?.role === 'INTEREST_GROUP_LEADER') return generateSpecificData(user?.groupName || 'Group', user?.baseMembership || 20);
    if (user?.role === 'FOUNDATION_LEADER') return generateSpecificData('Foundation School', user?.baseMembership || 25);
    if (user?.role === 'BRANCH_ADMIN') {
        const branchKey = user.branchName?.toLowerCase() || 'uyo';
        return mockGrowthData.map(d => ({ month: d.month, attendance: d[branchKey as keyof typeof d] || d.uyo }));
    }
    return mockGrowthData;
  };

  const chartData = getRoleSpecificData();

  // Dynamic header based on role
  const getHeaderInfo = () => {
    switch (user?.role) {
      case 'GLOBAL_ADMIN': 
        return { title: "The Pistis Place Global Intelligence Hub", sub: "Global Growth & Overview" };
      case 'BRANCH_ADMIN': 
        return { title: `${user?.branchName} Branch Intelligence Hub`, sub: "Branch Operational Insights" };
      case 'DEPT_LEADER': 
        return { title: `${user?.branchName} - ${user?.deptName} Department Hub`, sub: "Departmental Tracker & Metrics" };
      case 'CELL_LEADER': 
        return { title: `${user?.branchName} - ${user?.groupName} Cell Hub`, sub: "Home Cell Tracker & Metrics" };
      case 'INTEREST_GROUP_LEADER': 
        return { title: `${user?.branchName} - ${user?.groupName} Interest Group Hub`, sub: "Group Activity & Engagement" };
      case 'FOUNDATION_LEADER': 
        return { title: `${user?.branchName} - Foundation School Hub`, sub: "Growth Track Admissions & Doctrinal Foundations" };
      default:
        return { title: "Intelligence Hub", sub: "Overview" };
    }
  };

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case "GLOBAL_ADMIN":
        return "Global Administrator";
      case "BRANCH_ADMIN":
        return "Branch Administrator";
      case "DEPT_LEADER":
        return "Department Leader";
      case "CELL_LEADER":
        return "Home Cell Leader";
      case "INTEREST_GROUP_LEADER":
        return "Interest Group Leader";
      case "FOUNDATION_LEADER":
        return "Foundation School Coordinator";
      default:
        return "Administrator";
    }
  };

  const header = getHeaderInfo();

  return (
    <div className="flex flex-col gap-6 md:gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700 font-sans">
      <OnboardingModal />
      <ReportDeadlineAlert />
      <BranchDeadlineViolationAlert />
      <NotificationBanner />
      {/* Header Context Layer */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border border-white/10 bg-white/5 p-5 md:p-6 rounded-2xl shadow-sm">
        <div>
          {user && (
            <div className="flex items-center flex-wrap gap-2 mb-2.5 animate-pulse">
              <span className="text-[10px] md:text-xs font-mono font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-1 rounded-full">
                Welcome, {getRoleLabel(user.role)}
              </span>
              <span className="text-xs font-medium text-lavender/60">
                • {user.name}
              </span>
            </div>
          )}
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white mb-1">
            {header.title}
          </h1>
          <p className="text-lilac/80 font-medium text-sm md:text-base">{header.sub}</p>
        </div>
      </header>

      {/* Dynamic Hero Section */}
      <motion.section 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative w-full min-h-[320px] mb-4 flex items-center justify-center p-6"
      >
        <div className="absolute inset-0 bg-deep-violet/40 rounded-3xl border border-royal-purple/20 overflow-hidden flex flex-col items-center justify-center">
          
          {/* Gradient fade borders for blended vertical scroll effect on mobile */}
          <div className="absolute top-0 left-0 right-0 h-16 mobile-scroll-fade-top pointer-events-none md:hidden z-10" />
          <div className="absolute bottom-0 left-0 right-0 h-16 mobile-scroll-fade-bottom pointer-events-none md:hidden z-10" />

          <div className="relative flex flex-col md:flex-row overflow-y-auto md:overflow-y-visible max-h-[250px] md:max-h-none w-full px-4 md:px-8 py-8 mt-12 md:mt-4 justify-start md:justify-center items-center gap-8 md:gap-16 lg:gap-24 scrollbar-hide snap-y snap-mandatory pt-12 md:pt-4">
            
            {/* Membership Strength Ring */}
            <div className="relative flex flex-col items-center shrink-0 snap-center">
              <div className="w-32 h-32 md:w-36 md:h-36 rounded-full bg-gradient-to-tr from-purple-700 to-indigo-600 shadow-[0_0_50px_rgba(120,81,169,0.6)] flex items-center justify-center relative animate-pulse">
                <div className="absolute inset-1.5 rounded-full bg-[#0B0118]/80 backdrop-blur-sm flex items-center justify-center flex-col">
                  <span className="text-xl md:text-2xl lg:text-3xl font-bold text-white tracking-tighter">
                    {user?.role === 'GLOBAL_ADMIN' 
                      ? (pulseStats.globalMembership / 1000).toFixed(1) + "k" 
                      : user?.role === 'CELL_LEADER' 
                      ? (user?.baseMembership || 18).toLocaleString() 
                      : pulseStats.branchMembership.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-lilac uppercase tracking-wider font-semibold mt-0.5">Membership</span>
                </div>
              </div>
              <div className="mt-2 text-center">
                <span className="text-[10px] text-purple-300 font-mono tracking-tight bg-purple-500/15 border border-purple-500/25 px-2.5 py-1 rounded-full whitespace-nowrap">
                  {user?.role === 'GLOBAL_ADMIN' ? "Global Strength" : user?.role === 'CELL_LEADER' ? "Cell Strength" : `${user?.branchName || "Branch"} Strength`}
                </span>
              </div>
            </div>

            {/* Weekly Souls Won Ring */}
            <div className="relative flex flex-col items-center shrink-0 snap-center">
              <div className="w-32 h-32 md:w-36 md:h-36 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-400 shadow-[0_0_50px_rgba(52,211,153,0.6)] flex items-center justify-center relative animate-pulse">
                <div className="absolute inset-1.5 rounded-full bg-[#0B0118]/80 backdrop-blur-sm flex items-center justify-center flex-col">
                  <span className="text-xl md:text-2xl lg:text-3xl font-bold text-white tracking-tighter">
                    {user?.role === 'GLOBAL_ADMIN' 
                      ? pulseStats.globalWeeklySouls.toLocaleString() 
                      : user?.role === 'CELL_LEADER' 
                      ? (user?.baseMembership ? Math.max(1, Math.floor(user.baseMembership / 6)) : 2).toLocaleString() 
                      : pulseStats.branchWeeklySouls.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-emerald-400 uppercase tracking-wider font-semibold mt-0.5">Weekly Souls</span>
                </div>
              </div>
              <div className="mt-2 text-center">
                <span className="text-[10px] text-emerald-400 font-mono tracking-tight bg-emerald-500/15 border border-emerald-500/25 px-2.5 py-1 rounded-full whitespace-nowrap">
                  {user?.role === 'GLOBAL_ADMIN' ? "Weekly Souls Won" : user?.role === 'CELL_LEADER' ? "Weekly Cell Souls" : "Weekly Branch Souls"}
                </span>
              </div>
            </div>

            {/* Monthly Souls Won Ring */}
            <div className="relative flex flex-col items-center shrink-0 snap-center">
              <div className="w-32 h-32 md:w-36 md:h-36 rounded-full bg-gradient-to-tr from-rose-600 to-amber-500 shadow-[0_0_50px_rgba(244,63,94,0.6)] flex items-center justify-center relative animate-pulse">
                <div className="absolute inset-1.5 rounded-full bg-[#0B0118]/80 backdrop-blur-sm flex items-center justify-center flex-col">
                  <span className="text-xl md:text-2xl lg:text-3xl font-bold text-white tracking-tighter">
                    {user?.role === 'GLOBAL_ADMIN' 
                      ? pulseStats.globalMonthlySouls.toLocaleString() 
                      : user?.role === 'CELL_LEADER' 
                      ? (user?.baseMembership ? Math.max(2, Math.floor(user.baseMembership / 3)) : 5).toLocaleString() 
                      : pulseStats.branchMonthlySouls.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-rose-400 uppercase tracking-wider font-semibold mt-0.5 animate-pulse">Monthly Souls</span>
                </div>
              </div>
              <div className="mt-2 text-center">
                <span className="text-[10px] text-rose-300 font-mono tracking-tight bg-rose-500/15 border border-rose-500/25 px-2.5 py-1 rounded-full whitespace-nowrap">
                  {user?.role === 'GLOBAL_ADMIN' ? "Monthly Souls Won" : user?.role === 'CELL_LEADER' ? "Monthly Cell Souls" : "Monthly Branch Souls"}
                </span>
              </div>
            </div>

          </div>
          <div className="absolute top-4 left-6">
            <h2 className="text-xs font-bold text-white/90 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full">
               {user?.role === 'GLOBAL_ADMIN' ? 'Global Growth Pulse' : user?.role === 'CELL_LEADER' ? 'Home Cell Vitality' : `${user?.branchName || "Branch"} Vitality`}
            </h2>
          </div>
        </div>
      </motion.section>

      {/* KPI Metrics */}
      <section id="tour-dashboard-metrics" className={`grid grid-cols-1 sm:grid-cols-2 ${
        ['GLOBAL_ADMIN', 'BRANCH_ADMIN'].includes(user?.role || '') ? 'lg:grid-cols-5' : 'lg:grid-cols-4'
      } gap-4`}>
        {user?.role === 'GLOBAL_ADMIN' && (
           <>
            <MetricCard title="Total Attendance" value="12,450" trend={14.5} icon={<Users />} />
            <MetricCard title="Active Branches" value="2" trend={0} icon={<Building2 />} />
            <MetricCard title="Active Leaders" value={activeLeaderCount.toString()} trend={0} icon={<Users />} />
            <MetricCard title="Pending Approvals" value={pendingApprovalCount.toString()} trend={0} icon={<Sparkles />} />
            <MetricCard title="Returning Guests" value="284" trend={8.4} icon={<Activity />} />
           </>
        )}
        {user?.role === 'BRANCH_ADMIN' && (
           <>
            <MetricCard title="Branch Attendance" value="4,200" trend={8.5} icon={<Users />} />
            <MetricCard title="Active Leaders" value={activeLeaderCount.toString()} trend={0} icon={<Users />} />
            <MetricCard title="Pending Approvals" value={pendingApprovalCount.toString()} trend={0} icon={<Sparkles />} />
            <MetricCard title="First-Time Guests" value="150" trend={15.1} icon={<Sparkles />} />
            <MetricCard title="Returning Guests" value="85" trend={4.4} icon={<Activity />} />
           </>
        )}
        {user?.role === 'DEPT_LEADER' && (
           <>
            <MetricCard title="Active Volunteers" value={(user?.baseMembership || 45).toString()} trend={2.5} icon={<Users />} />
            <MetricCard title="Avg Check-in Rate" value="94%" trend={1.2} icon={<Activity />} />
            <MetricCard title={`Active ${user?.unitStructureName || 'Sub-units'}`} value={Math.floor((user?.baseMembership || 45) / 10).toString()} trend={0} icon={<Users />} />
            <MetricCard title="Tasks Completed" value="18" trend={12.1} icon={<Sparkles />} />
           </>
        )}
        {user?.role === 'CELL_LEADER' && (
           <>
            <MetricCard title="Cell Members" value={(user?.baseMembership || 18).toString()} trend={2.5} icon={<Users />} />
            <MetricCard title="Last Attendance" value={(user?.baseMembership ? user.baseMembership - 3 : 15).toString()} trend={-1.2} icon={<Activity />} />
            <MetricCard title={`Internal ${user?.unitStructureName || 'Groups'}`} value="2" trend={0} icon={<Sparkles />} />
            <MetricCard title="Assigned Tasks" value="3" trend={10} icon={<Sparkles />} />
           </>
        )}
        {user?.role === 'INTEREST_GROUP_LEADER' && (
           <>
            <MetricCard title="Active Members" value={(user?.baseMembership || 45).toString()} trend={12.5} icon={<Users />} />
            <MetricCard title="Weekly Meetings" value="1" trend={0} icon={<Activity />} />
            <MetricCard title={`Active ${user?.unitStructureName || 'Projects'}`} value={Math.floor((user?.baseMembership || 45) / 15).toString()} trend={2} icon={<Sparkles />} />
            <MetricCard title="New Signups" value="8" trend={15} icon={<Sparkles />} />
           </>
        )}
        {user?.role === 'FOUNDATION_LEADER' && (
           <>
            <MetricCard title="Enrollment Intake" value={(user?.baseMembership || 25).toString()} trend={5.5} icon={<Users />} />
            <MetricCard title="Graduation Candidates" value="12" trend={10} icon={<Sparkles />} />
            <MetricCard title="Class Attendance" value="96%" trend={2.1} icon={<Activity />} />
            <MetricCard title="Modules Completed" value="4" trend={0} icon={<Sparkles />} />
           </>
        )}
      </section>

      {/* Analytics & Insights */}
      {['GLOBAL_ADMIN', 'BRANCH_ADMIN'].includes(user?.role || '') && (
         <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <div className="lg:col-span-2 flex flex-col gap-6">
            {user?.role === 'GLOBAL_ADMIN' ? (
              <>
                <GlobalTrendsWidget />
                <SoulsTrendWidget pulseStats={pulseStats} />
                <AttendanceTrendsWidget />
                <LineChartPanel 
                   title="Monthly Growth & Retention" 
                   data={mockGrowthData} 
                   lines={[
                     { key: "uyo", name: "Uyo (HQ)", color: "#7851A9" },
                     { key: "calabar", name: "Calabar", color: "#34d399" },
                     { key: "firstTimers", name: "First Timers", color: "#facc15", yAxisId: "right" },
                     { key: "returned", name: "Retained Guests", color: "#6366f1", yAxisId: "right" }
                   ]}
                   xAxisKey="month" 
                />
                <LeaderActivityChart />
              </>
            ) : (
              <>
                {user?.role === "BRANCH_ADMIN" && (
                  <>
                    <BranchAggregationSummaryWidget />
                    <BranchDepartmentComplianceHeatmap />
                  </>
                )}
                <SoulsTrendWidget pulseStats={pulseStats} />
                <AttendanceTrendsWidget />
              </>
            )}
            <BranchUpdates />
            <ActivityStream />
         </div>
         <div className="flex flex-col gap-4">
            {user?.role === 'GLOBAL_ADMIN' ? (
              <>
                <GlobalLeaderboardWidget />
                <GlobalAIInsight />
                <GlobalMessagingWidget />
                <GlobalToBranchMessagingWidget />
                <BroadcastReachWidget />
                <UpcomingBirthdaysWidget />
              </>
            ) : user?.role === 'BRANCH_ADMIN' ? (
              <>
                <BranchPendingReportsWidget />
                <BranchMessagingWidget />
                <BranchToUnitMessagingWidget />
                <BroadcastReachWidget />
                <UpcomingBirthdaysWidget />
                <BranchAIInsight />
              </>
            ) : (
              <>
                <BranchMessagingWidget />
                <UpcomingBirthdaysWidget />
                <h3 className="text-sm font-medium tracking-wide uppercase text-lilac mb-1">AI Intelligence</h3>
                <InsightCard 
                   type="positive"
                   content="Consistency in data reporting is improving. Keep it up."
                />
              </>
            )}
         </div>
         </section>
      )}

      {['DEPT_LEADER', 'CELL_LEADER', 'INTEREST_GROUP_LEADER', 'FOUNDATION_LEADER', 'CELL_COORDINATOR'].includes(user?.role || '') && (
         <section className="flex flex-col gap-6">
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
             <div className="lg:col-span-2 flex flex-col gap-6">
                <ChartPanel 
                   title="Membership & Attendance Trend" 
                   data={chartData} 
                   dataKey="attendance" 
                   xAxisKey="month" 
                />
                <ActivityStream />
             </div>
             <div className="flex flex-col gap-4">
                <GlassCard className="p-6 h-full">
                   <h3 className="text-sm font-medium tracking-wide uppercase text-lilac mb-4">Upcoming Schedule</h3>
                   <div className="flex flex-col gap-3">
                      <div className="p-3 bg-white/5 rounded-lg border border-white/10 flex justify-between items-center group hover:bg-white/10 transition-colors">
                         <span className="text-white text-sm font-medium group-hover:text-emerald-400 transition-colors">Pre-service Briefing</span>
                         <span className="text-emerald-400/80 text-xs text-right">Sunday<br/>7:30 AM</span>
                      </div>
                      <div className="p-3 bg-white/5 rounded-lg border border-white/10 flex justify-between items-center group hover:bg-white/10 transition-colors">
                         <span className="text-white text-sm font-medium group-hover:text-amber-400 transition-colors">Monthly Training</span>
                         <span className="text-amber-400/80 text-xs text-right">Next Saturday<br/>Varies</span>
                      </div>
                   </div>
                </GlassCard>
             </div>
           </div>

           {user?.role === 'CELL_COORDINATOR' && (
             <div className="grid grid-cols-1">
               <CoordinatorCellManager user={user} />
             </div>
           )}

           {['DEPT_LEADER', 'CELL_LEADER', 'INTEREST_GROUP_LEADER', 'FOUNDATION_LEADER', 'CELL_COORDINATOR'].includes(user?.role || '') && (
             <div className="grid grid-cols-1">
               <LeaderRosterManager user={user} updateUser={updateUser} />
             </div>
           )}

           <div className="grid grid-cols-1">
             <div className="flex flex-col gap-4">
               <h3 className="text-sm font-medium tracking-wide uppercase text-lilac mb-1 text-left">Action Engine</h3>
               <InsightCard 
                  type="neutral"
                  content="Don't forget to submit your weekly report to the Branch Administration before Monday noon."
               />
             </div>
           </div>
         </section>
      )}
    </div>
  );
}
