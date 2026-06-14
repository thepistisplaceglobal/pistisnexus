import { motion } from "motion/react";
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

  const header = getHeaderInfo();

  return (
    <div className="flex flex-col gap-6 md:gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <OnboardingModal />
      <ReportDeadlineAlert />
      <NotificationBanner />
      {/* Header Context Layer */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white mb-1">
            {header.title}
          </h1>
          <p className="text-lilac/80 font-medium">{header.sub}</p>
        </div>
      </header>

      {/* Dynamic Hero Section */}
      <motion.section 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative w-full h-[280px] mb-4 flex items-center justify-center"
      >
        <div className="absolute inset-0 bg-deep-violet/40 rounded-3xl border border-royal-purple/20 overflow-hidden flex items-center justify-center">
          <div className="relative flex items-center justify-center">
            
            {user?.role === 'GLOBAL_ADMIN' && (
               <>
                  <div className="w-48 h-48 rounded-full bg-gradient-to-tr from-deep-violet to-royal-purple shadow-[0_0_80px_rgba(120,81,169,0.8)] animate-pulse flex items-center justify-center relative z-10">
                     <div className="absolute inset-2 rounded-full bg-[#0B0118]/40 backdrop-blur-sm flex items-center justify-center flex-col">
                        <span className="text-4xl font-bold text-white tracking-tighter">12.4k</span>
                        <span className="text-[10px] text-lilac uppercase tracking-wider font-semibold mt-1">Total Souls</span>
                     </div>
                  </div>
                  <div className="absolute w-[350px] h-[350px] rounded-full border border-royal-purple/30 border-dashed animate-[spin_20s_linear_infinite]" />
                  <div className="absolute w-[500px] h-[500px] rounded-full border border-royal-purple/10 border-solid animate-[spin_30s_linear_infinite_reverse]" />
               </>
            )}

            {user?.role === 'BRANCH_ADMIN' && (
               <>
                  <div className="w-40 h-40 rounded-full border-[10px] border-emerald-400/80 shadow-[0_0_50px_#34d39980] flex items-center justify-center bg-[#0B0118]/80 backdrop-blur-md z-10">
                    <div className="flex flex-col items-center">
                        <span className="text-3xl font-bold text-white tracking-tighter">4,200</span>
                        <span className="text-[10px] text-emerald-400 uppercase tracking-wider font-semibold mt-1">Avg Weekly</span>
                     </div>
                  </div>
                  <div className="absolute w-[450px] h-[450px] rounded-full border-2 border-royal-purple/20 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(120,81,169,0.1)_100%)]" />
               </>
            )}

            {['DEPT_LEADER', 'CELL_LEADER', 'INTEREST_GROUP_LEADER'].includes(user?.role || '') && (
               <>
                  <div className="w-32 h-32 rounded-full border-[6px] border-emerald-400/80 shadow-[0_0_40px_rgba(52,211,153,0.3)] flex items-center justify-center bg-[#0B0118]/80 backdrop-blur-md z-10">
                     {user?.role === 'CELL_LEADER' ? <Home className="w-10 h-10 text-emerald-400" /> :
                      user?.role === 'INTEREST_GROUP_LEADER' ? <Compass className="w-10 h-10 text-emerald-400" /> :
                      <Activity className="w-10 h-10 text-emerald-400" />}
                  </div>
                  <div className="absolute w-[400px] h-[400px] rounded-full border-2 border-royal-purple/20 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(120,81,169,0.1)_100%)] animate-[pulse_5s_ease-in-out_infinite]" />
               </>
            )}

          </div>
          <div className="absolute top-4 left-6">
            <h2 className="text-lg font-bold text-white/90">
               {user?.role === 'GLOBAL_ADMIN' ? 'Global Growth Pulse' : user?.role === 'BRANCH_ADMIN' ? 'Branch Vitality' : 'Operational Activity'}
            </h2>
            {['GLOBAL_ADMIN', 'BRANCH_ADMIN'].includes(user?.role || '') && (
               <p className="text-xs text-emerald-400 font-medium flex items-center gap-1"><TrendingUp className="w-3 h-3"/> +14.5% vs Last Year</p>
            )}
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
            <MetricCard title="Total Home Cells" value="86" trend={5.2} icon={<Home />} />
            <MetricCard title="First-Time Guests" value="412" trend={12.1} icon={<Sparkles />} />
            <MetricCard title="Returning Guests" value="284" trend={8.4} icon={<Activity />} />
           </>
        )}
        {user?.role === 'BRANCH_ADMIN' && (
           <>
            <MetricCard title="Branch Attendance" value="4,200" trend={8.5} icon={<Users />} />
            <MetricCard title="Departments" value="12" trend={0} icon={<Building2 />} />
            <MetricCard title="Branch Cells" value="24" trend={2.0} icon={<Home />} />
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
              <AttendanceTrendsWidget />
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
