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
import { OnboardingModal } from "@/components/ui/OnboardingModal";
import { ReportDeadlineAlert } from "@/components/ui/ReportDeadlineAlert";
import { LeaderActivityChart } from "@/components/ui/LeaderActivityChart";
import { GlobalMessagingWidget } from "@/components/ui/GlobalMessagingWidget";
import { BranchMessagingWidget } from "@/components/ui/BranchMessagingWidget";
import { BroadcastReachWidget } from "@/components/ui/BroadcastReachWidget";
import { UpcomingBirthdaysWidget } from "@/components/ui/UpcomingBirthdaysWidget";
import { AttendanceTrendsWidget } from "@/components/ui/AttendanceTrendsWidget";
import { NotificationBanner } from "@/components/ui/NotificationBanner";
import { SoulsTrendWidget } from "@/components/ui/SoulsTrendWidget";
import { Users, Building2, TrendingUp, Sparkles, Activity, Home, Compass } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { ActivityStream } from "@/components/ui/ActivityStream";

const mockGrowthData = [
  { month: "Jan", attendance: 11200, uyo: 8200, calabar: 3000, firstTimers: 250, returned: 120 },
  { month: "Feb", attendance: 11400, uyo: 8300, calabar: 3100, firstTimers: 280, returned: 140 },
  { month: "Mar", attendance: 11800, uyo: 8600, calabar: 3200, firstTimers: 320, returned: 180 },
  { month: "Apr", attendance: 12100, uyo: 8800, calabar: 3300, firstTimers: 380, returned: 220 },
  { month: "May", attendance: 12450, uyo: 9150, calabar: 3300, firstTimers: 412, returned: 284 },
];

export function Dashboard() {
  const user = useAppStore(state => state.user);
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
      
      const baseUyoWeeklySouls = 328;
      const baseCalabarWeeklySouls = 142;

      const baseUyoMonthlySouls = 1312; // 328 * 4
      const baseCalabarMonthlySouls = 568; // 142 * 4

      const liveUyoMembership = baseUyoMembership + uyoFollowupConverts;
      const liveCalabarMembership = baseCalabarMembership + calabarFollowupConverts;
      
      const liveUyoWeeklySouls = baseUyoWeeklySouls + uyoWeeklySouls;
      const liveCalabarWeeklySouls = baseCalabarWeeklySouls + calabarWeeklySouls;

      const liveUyoMonthlySouls = baseUyoMonthlySouls + uyoMonthlySouls;
      const liveCalabarMonthlySouls = baseCalabarMonthlySouls + calabarMonthlySouls;

      const isUserCalabar = user?.branchName?.toLowerCase().includes("calabar");
      setPulseStats({
        globalMembership: liveUyoMembership + liveCalabarMembership,
        globalWeeklySouls: liveUyoWeeklySouls + liveCalabarWeeklySouls,
        globalMonthlySouls: liveUyoMonthlySouls + liveCalabarMonthlySouls,
        branchMembership: isUserCalabar ? liveCalabarMembership : liveUyoMembership,
        branchWeeklySouls: isUserCalabar ? liveCalabarWeeklySouls : liveUyoWeeklySouls,
        branchMonthlySouls: isUserCalabar ? liveCalabarMonthlySouls : liveUyoMonthlySouls,
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
      default:
        return "Administrator";
    }
  };

  const header = getHeaderInfo();

  return (
    <div className="flex flex-col gap-6 md:gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700 font-sans">
      <OnboardingModal />
      <ReportDeadlineAlert />
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
                    {user?.role === 'GLOBAL_ADMIN' ? (pulseStats.globalMembership / 1000).toFixed(1) + "k" : pulseStats.branchMembership.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-lilac uppercase tracking-wider font-semibold mt-0.5">Membership</span>
                </div>
              </div>
              <div className="mt-2 text-center">
                <span className="text-[10px] text-purple-300 font-mono tracking-tight bg-purple-500/15 border border-purple-500/25 px-2.5 py-1 rounded-full whitespace-nowrap">
                  {user?.role === 'GLOBAL_ADMIN' ? "Global Strength" : `${user?.branchName || "Branch"} Strength`}
                </span>
              </div>
            </div>

            {/* Weekly Souls Won Ring */}
            <div className="relative flex flex-col items-center shrink-0 snap-center">
              <div className="w-32 h-32 md:w-36 md:h-36 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-400 shadow-[0_0_50px_rgba(52,211,153,0.6)] flex items-center justify-center relative animate-pulse">
                <div className="absolute inset-1.5 rounded-full bg-[#0B0118]/80 backdrop-blur-sm flex items-center justify-center flex-col">
                  <span className="text-xl md:text-2xl lg:text-3xl font-bold text-white tracking-tighter">
                    {user?.role === 'GLOBAL_ADMIN' ? pulseStats.globalWeeklySouls.toLocaleString() : pulseStats.branchWeeklySouls.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-emerald-400 uppercase tracking-wider font-semibold mt-0.5">Weekly Souls</span>
                </div>
              </div>
              <div className="mt-2 text-center">
                <span className="text-[10px] text-emerald-400 font-mono tracking-tight bg-emerald-500/15 border border-emerald-500/25 px-2.5 py-1 rounded-full whitespace-nowrap">
                  {user?.role === 'GLOBAL_ADMIN' ? "Weekly Souls Won" : "Weekly Branch Souls"}
                </span>
              </div>
            </div>

            {/* Monthly Souls Won Ring */}
            <div className="relative flex flex-col items-center shrink-0 snap-center">
              <div className="w-32 h-32 md:w-36 md:h-36 rounded-full bg-gradient-to-tr from-rose-600 to-amber-500 shadow-[0_0_50px_rgba(244,63,94,0.6)] flex items-center justify-center relative animate-pulse">
                <div className="absolute inset-1.5 rounded-full bg-[#0B0118]/80 backdrop-blur-sm flex items-center justify-center flex-col">
                  <span className="text-xl md:text-2xl lg:text-3xl font-bold text-white tracking-tighter">
                    {user?.role === 'GLOBAL_ADMIN' ? pulseStats.globalMonthlySouls.toLocaleString() : pulseStats.branchMonthlySouls.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-rose-400 uppercase tracking-wider font-semibold mt-0.5 animate-pulse">Monthly Souls</span>
                </div>
              </div>
              <div className="mt-2 text-center">
                <span className="text-[10px] text-rose-300 font-mono tracking-tight bg-rose-500/15 border border-rose-500/25 px-2.5 py-1 rounded-full whitespace-nowrap">
                  {user?.role === 'GLOBAL_ADMIN' ? "Monthly Souls Won" : "Monthly Branch Souls"}
                </span>
              </div>
            </div>

          </div>
          <div className="absolute top-4 left-6">
            <h2 className="text-xs font-bold text-white/90 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full">
               {user?.role === 'GLOBAL_ADMIN' ? 'Global Growth Pulse' : `${user?.branchName || "Branch"} Vitality`}
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
                <BroadcastReachWidget />
                <UpcomingBirthdaysWidget />
              </>
            ) : user?.role === 'BRANCH_ADMIN' ? (
              <>
                <BranchPendingReportsWidget />
                <BranchMessagingWidget />
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

      {['DEPT_LEADER', 'CELL_LEADER', 'INTEREST_GROUP_LEADER'].includes(user?.role || '') && (
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
           <div className="grid grid-cols-1">
             <div className="flex flex-col gap-4">
               <h3 className="text-sm font-medium tracking-wide uppercase text-lilac mb-1">Action Engine</h3>
               <InsightCard 
                  type="neutral"
                  content="Don't forget to submit your weekly operational metrics to the Branch Administration before Monday noon."
               />
             </div>
           </div>
         </section>
      )}
    </div>
  );
}
