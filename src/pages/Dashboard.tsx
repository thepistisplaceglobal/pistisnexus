import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
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
import { GlobalToBranchMessagingWidget } from "@/components/ui/GlobalToBranchMessagingWidget";
import { BranchToUnitMessagingWidget } from "@/components/ui/BranchToUnitMessagingWidget";
import { BroadcastReachWidget } from "@/components/ui/BroadcastReachWidget";
import { UpcomingBirthdaysWidget } from "@/components/ui/UpcomingBirthdaysWidget";
import { AttendanceTrendsWidget } from "@/components/ui/AttendanceTrendsWidget";
import { NotificationBanner } from "@/components/ui/NotificationBanner";
import { SoulsTrendWidget } from "@/components/ui/SoulsTrendWidget";
import { Users, Building2, TrendingUp, Sparkles, Activity, Home, Compass, SlidersHorizontal, RefreshCw, Eye, EyeOff } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { ActivityStream } from "@/components/ui/ActivityStream";
import { WidgetWrapper } from "@/components/ui/WidgetWrapper";

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
  const [topbarContainer, setTopbarContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setTopbarContainer(document.getElementById("topbar-actions"));
  }, []);

  // CUSTOMIZABLE & REORDERABLE WIDGETS ENGINE
  interface WidgetItem {
    id: string;
    title: string;
  }

  const getDefaultLayouts = (role: string) => {
    if (role === 'GLOBAL_ADMIN') {
      return {
        left: [
          { id: 'global-trends', title: 'Global City Expression Trends' },
          { id: 'souls-trend', title: 'Souls Trend & Follow-up Analytics' },
          { id: 'attendance-trends', title: 'Attendance Trends & Analysis' },
          { id: 'growth-retention', title: 'Monthly Growth & Retention Registry' },
          { id: 'leader-activity', title: 'Leader Activity Breakdown' },
          { id: 'branch-updates', title: 'City Expression Operational Updates' },
          { id: 'activity-stream', title: 'Intelligence Audit Stream' },
        ],
        right: [
          { id: 'leaderboard', title: 'Global Leaders Leaderboard' },
          { id: 'ai-insight', title: 'Pistis AI Global Strategic Advice' },
          { id: 'global-msg', title: 'Global Administrative Pipeline' },
          { id: 'to-branch-msg', title: 'HQ to City Expression Dispatch Centre' },
          { id: 'broadcast-reach', title: 'Strategic Broadcast Reach' },
          { id: 'birthdays', title: 'Upcoming Birthdays Cohort' },
        ]
      };
    }

    if (role === 'BRANCH_ADMIN') {
      return {
        left: [
          { id: 'souls-trend', title: 'Souls Trend & Follow-up Analytics' },
          { id: 'attendance-trends', title: 'Attendance Trends & Analysis' },
          { id: 'branch-updates', title: 'City Expression Operational Updates' },
          { id: 'activity-stream', title: 'Intelligence Audit Stream' },
        ],
        right: [
          { id: 'pending-reports', title: 'Pending Departmental & Unit Reports' },
          { id: 'branch-msg', title: 'City Expression Broadcast Hub' },
          { id: 'to-unit-msg', title: 'City Expression to Unit Dispatch Centre' },
          { id: 'broadcast-reach', title: 'City Expression Broadcast Reach' },
          { id: 'birthdays', title: 'City Expression Upcoming Birthdays' },
          { id: 'ai-insight', title: 'Pistis AI City Expression Diagnostics' },
        ]
      };
    }

    // Role-specific leader layout
    return {
      left: [
        { id: 'role-chart', title: 'Oversight Membership & Attendance Trend' },
        { id: 'activity-stream', title: 'Local Leadership Stream' },
      ],
      right: [
        { id: 'schedule', title: 'Upcoming Service Briefings & Events' },
        { id: 'action-engine', title: 'Action Engine & Reminders' },
      ]
    };
  };

  const [leftWidgets, setLeftWidgets] = useState<WidgetItem[]>([]);
  const [rightWidgets, setRightWidgets] = useState<WidgetItem[]>([]);
  const [collapsedWidgets, setCollapsedWidgets] = useState<Record<string, boolean>>({});
  const [hiddenWidgets, setHiddenWidgets] = useState<Record<string, boolean>>({});
  const [draggedWidget, setDraggedWidget] = useState<{ id: string; col: 'left' | 'right' } | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    
    const layoutKey = `dashboard_layout_v2_${user.role}_${user.email || 'guest'}`;
    const collapsedKey = `dashboard_collapsed_v2_${user.role}_${user.email || 'guest'}`;
    const hiddenKey = `dashboard_hidden_v2_${user.role}_${user.email || 'guest'}`;
    
    const savedLayout = localStorage.getItem(layoutKey);
    const savedCollapsed = localStorage.getItem(collapsedKey);
    const savedHidden = localStorage.getItem(hiddenKey);
    
    if (savedLayout) {
      try {
        const parsed = JSON.parse(savedLayout);
        if (parsed.left && parsed.right) {
          setLeftWidgets(parsed.left);
          setRightWidgets(parsed.right);
        } else {
          const defaults = getDefaultLayouts(user.role);
          setLeftWidgets(defaults.left);
          setRightWidgets(defaults.right);
        }
      } catch (e) {
        const defaults = getDefaultLayouts(user.role);
        setLeftWidgets(defaults.left);
        setRightWidgets(defaults.right);
      }
    } else {
      const defaults = getDefaultLayouts(user.role);
      setLeftWidgets(defaults.left);
      setRightWidgets(defaults.right);
    }
    
    if (savedCollapsed) {
      try {
        setCollapsedWidgets(JSON.parse(savedCollapsed));
      } catch (e) {
        setCollapsedWidgets({});
      }
    } else {
      setCollapsedWidgets({});
    }

    if (savedHidden) {
      try {
        setHiddenWidgets(JSON.parse(savedHidden));
      } catch (e) {
        setHiddenWidgets({});
      }
    } else {
      setHiddenWidgets({});
    }
  }, [user]);

  const saveLayoutState = (newLeft: WidgetItem[], newRight: WidgetItem[]) => {
    if (!user) return;
    const layoutKey = `dashboard_layout_v2_${user.role}_${user.email || 'guest'}`;
    localStorage.setItem(layoutKey, JSON.stringify({ left: newLeft, right: newRight }));
  };

  const saveCollapsedState = (newCollapsed: Record<string, boolean>) => {
    if (!user) return;
    const collapsedKey = `dashboard_collapsed_v2_${user.role}_${user.email || 'guest'}`;
    localStorage.setItem(collapsedKey, JSON.stringify(newCollapsed));
  };

  const saveHiddenState = (newHidden: Record<string, boolean>) => {
    if (!user) return;
    const hiddenKey = `dashboard_hidden_v2_${user.role}_${user.email || 'guest'}`;
    localStorage.setItem(hiddenKey, JSON.stringify(newHidden));
  };

  const handleWidgetDrop = (
    draggedId: string,
    draggedCol: 'left' | 'right',
    targetId: string,
    targetCol: 'left' | 'right'
  ) => {
    if (draggedId === targetId) return;

    let newLeft = [...leftWidgets];
    let newRight = [...rightWidgets];

    let draggedItem: WidgetItem | undefined;

    if (draggedCol === 'left') {
      const idx = newLeft.findIndex(w => w.id === draggedId);
      if (idx !== -1) [draggedItem] = newLeft.splice(idx, 1);
    } else {
      const idx = newRight.findIndex(w => w.id === draggedId);
      if (idx !== -1) [draggedItem] = newRight.splice(idx, 1);
    }

    if (!draggedItem) return;

    if (targetCol === 'left') {
      const targetIdx = newLeft.findIndex(w => w.id === targetId);
      if (targetIdx !== -1) {
        newLeft.splice(targetIdx, 0, draggedItem);
      } else {
        newLeft.push(draggedItem);
      }
    } else {
      const targetIdx = newRight.findIndex(w => w.id === targetId);
      if (targetIdx !== -1) {
        newRight.splice(targetIdx, 0, draggedItem);
      } else {
        newRight.push(draggedItem);
      }
    }

    setLeftWidgets(newLeft);
    setRightWidgets(newRight);
    saveLayoutState(newLeft, newRight);
    setDraggedWidget(null);
  };

  const handleColumnDrop = (targetCol: 'left' | 'right') => {
    if (!draggedWidget) return;
    const { id: draggedId, col: draggedCol } = draggedWidget;

    let newLeft = [...leftWidgets];
    let newRight = [...rightWidgets];

    if (draggedCol === targetCol) {
      const list = targetCol === 'left' ? newLeft : newRight;
      const index = list.findIndex(w => w.id === draggedId);
      if (index !== -1) {
        const [item] = list.splice(index, 1);
        list.push(item);
      }
    } else {
      let draggedItem: WidgetItem | undefined;
      if (draggedCol === 'left') {
        const index = newLeft.findIndex(w => w.id === draggedId);
        if (index !== -1) [draggedItem] = newLeft.splice(index, 1);
      } else {
        const index = newRight.findIndex(w => w.id === draggedId);
        if (index !== -1) [draggedItem] = newRight.splice(index, 1);
      }

      if (draggedItem) {
        if (targetCol === 'left') {
          newLeft.push(draggedItem);
        } else {
          newRight.push(draggedItem);
        }
      }
    }

    setLeftWidgets(newLeft);
    setRightWidgets(newRight);
    saveLayoutState(newLeft, newRight);
    setDraggedWidget(null);
  };

  const handleMoveUp = (id: string, col: 'left' | 'right') => {
    const list = col === 'left' ? [...leftWidgets] : [...rightWidgets];
    const index = list.findIndex(w => w.id === id);
    if (index > 0) {
      const temp = list[index];
      list[index] = list[index - 1];
      list[index - 1] = temp;
      
      if (col === 'left') {
        setLeftWidgets(list);
        saveLayoutState(list, rightWidgets);
      } else {
        setRightWidgets(list);
        saveLayoutState(leftWidgets, list);
      }
    }
  };

  const handleMoveDown = (id: string, col: 'left' | 'right') => {
    const list = col === 'left' ? [...leftWidgets] : [...rightWidgets];
    const index = list.findIndex(w => w.id === id);
    if (index !== -1 && index < list.length - 1) {
      const temp = list[index];
      list[index] = list[index + 1];
      list[index + 1] = temp;
      
      if (col === 'left') {
        setLeftWidgets(list);
        saveLayoutState(list, rightWidgets);
      } else {
        setRightWidgets(list);
        saveLayoutState(leftWidgets, list);
      }
    }
  };

  const handleToggleCollapse = (id: string) => {
    const updated = {
      ...collapsedWidgets,
      [id]: !collapsedWidgets[id],
    };
    setCollapsedWidgets(updated);
    saveCollapsedState(updated);
  };

  const handleToggleWidgetHide = (id: string) => {
    const updated = {
      ...hiddenWidgets,
      [id]: !hiddenWidgets[id],
    };
    setHiddenWidgets(updated);
    saveHiddenState(updated);
  };

  const handleResetLayout = () => {
    if (!user) return;
    const defaults = getDefaultLayouts(user.role);
    setLeftWidgets(defaults.left);
    setRightWidgets(defaults.right);
    setCollapsedWidgets({});
    setHiddenWidgets({});
    const layoutKey = `dashboard_layout_v2_${user.role}_${user.email || 'guest'}`;
    const collapsedKey = `dashboard_collapsed_v2_${user.role}_${user.email || 'guest'}`;
    const hiddenKey = `dashboard_hidden_v2_${user.role}_${user.email || 'guest'}`;
    localStorage.removeItem(layoutKey);
    localStorage.removeItem(collapsedKey);
    localStorage.removeItem(hiddenKey);
  };

  const handleCollapseAll = () => {
    const allIds = [...leftWidgets.map(w => w.id), ...rightWidgets.map(w => w.id)];
    const updated: Record<string, boolean> = {};
    allIds.forEach(id => {
      updated[id] = true;
    });
    setCollapsedWidgets(updated);
    saveCollapsedState(updated);
  };

  const handleExpandAll = () => {
    setCollapsedWidgets({});
    saveCollapsedState({});
  };

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
    if (user?.role === 'FOUNDATION_SCHOOL') return generateSpecificData('Foundation School', user?.baseMembership || 40);
    if (user?.role === 'HOME_CELL_COORD') return generateSpecificData('Home Cell Network', user?.baseMembership || 60);
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
        return { title: `${user?.branchName} City Expression Intelligence Hub`, sub: "City Expression Operational Insights" };
      case 'DEPT_LEADER': 
        return { title: `${user?.branchName} - ${user?.deptName} Department Hub`, sub: "Departmental Tracker & Metrics" };
      case 'CELL_LEADER': 
        return { title: `${user?.branchName} - ${user?.groupName} Cell Hub`, sub: "Home Cell Tracker & Metrics" };
      case 'INTEREST_GROUP_LEADER': 
        return { title: `${user?.branchName} - ${user?.groupName} Interest Group Hub`, sub: "Group Activity & Engagement" };
      case 'FOUNDATION_SCHOOL': 
        return { title: `${user?.branchName} - Foundation School Academy Hub`, sub: "Discipleship Curriculum and Student Progress" };
      case 'HOME_CELL_COORD': 
        return { title: `${user?.branchName} - Home Cell Coordinator Hub`, sub: "Cell Group Oversight and Growth Diagnostics" };
      default:
        return { title: "Intelligence Hub", sub: "Overview" };
    }
  };

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case "GLOBAL_ADMIN":
        return "Global Administrator";
      case "BRANCH_ADMIN":
        return "City Expression Administrator";
      case "DEPT_LEADER":
        return "Department Leader";
      case "CELL_LEADER":
        return "Home Cell Leader";
      case "INTEREST_GROUP_LEADER":
        return "Interest Group Leader";
      case "FOUNDATION_SCHOOL":
        return "Foundation School Coordinator";
      case "HOME_CELL_COORD":
        return "Home Cell Coordinator";
      default:
        return "Administrator";
    }
  };

  const header = getHeaderInfo();

  const renderWidget = (id: string) => {
    switch (id) {
      // MAIN COLUMN WIDGETS
      case "global-trends":
        return <GlobalTrendsWidget />;
      case "souls-trend":
        return <SoulsTrendWidget pulseStats={pulseStats} />;
      case "attendance-trends":
        return <AttendanceTrendsWidget />;
      case "growth-retention":
        return (
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
        );
      case "leader-activity":
        return <LeaderActivityChart />;
      case "branch-updates":
        return <BranchUpdates />;
      case "activity-stream":
        return <ActivityStream />;

      // SIDEBAR WIDGETS
      case "leaderboard":
        return <GlobalLeaderboardWidget />;
      case "ai-insight":
        return user?.role === "GLOBAL_ADMIN" ? <GlobalAIInsight /> : <BranchAIInsight />;
      case "global-msg":
        return <GlobalMessagingWidget />;
      case "to-branch-msg":
        return <GlobalToBranchMessagingWidget />;
      case "broadcast-reach":
        return <BroadcastReachWidget />;
      case "birthdays":
        return <UpcomingBirthdaysWidget />;

      case "pending-reports":
        return <BranchPendingReportsWidget />;
      case "branch-msg":
        return <BranchMessagingWidget />;
      case "to-unit-msg":
        return <BranchToUnitMessagingWidget />;

      // OTHER ROLES
      case "role-chart":
        return (
          <ChartPanel 
             title="Membership & Attendance Trend" 
             data={chartData} 
             dataKey="attendance" 
             xAxisKey="month" 
          />
        );
      case "schedule":
        return (
          <GlassCard className="p-6 h-full border-0 bg-transparent shadow-none rounded-none !p-0">
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
        );
      case "action-engine":
        return (
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-medium tracking-wide uppercase text-lilac mb-1">Action Engine</h3>
            <InsightCard 
               type="neutral"
               content={
                 ["GLOBAL_ADMIN", "BRANCH_ADMIN"].includes(user?.role || "")
                   ? "Consistent and highly accurate reports empower local and global leadership to make growth-driven diagnostic actions quickly."
                   : "Don't forget to submit your weekly operational metrics to the City Expression Administration before Monday noon."
               }
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col gap-6 md:gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700 font-sans">
      <OnboardingModal />
      <ReportDeadlineAlert />
      <NotificationBanner />
      {topbarContainer && createPortal(
        <div className="flex items-center gap-1.5 bg-black/20 px-2 py-1.5 rounded-xl border border-white/5 mx-2">
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-1 text-[11px] font-mono font-bold text-white px-2 py-1 rounded border border-white/5 hover:bg-white/10 transition-all cursor-pointer"
            title="Layout Settings"
          >
            <SlidersHorizontal className="w-3 h-3 text-[#d8b4fe]" />
            <span className="hidden md:inline">Layout</span>
          </button>
          <button
            onClick={handleExpandAll}
            className="flex items-center gap-1 text-[11px] font-mono font-bold text-white px-2 py-1 rounded border border-white/5 hover:bg-white/10 transition-colors cursor-pointer"
            title="Expand All Widgets"
          >
            <Eye className="w-3 h-3 text-emerald-400" />
          </button>
          <button
            onClick={handleCollapseAll}
            className="flex items-center gap-1 text-[11px] font-mono font-bold text-white px-2 py-1 rounded border border-white/5 hover:bg-white/10 transition-colors cursor-pointer"
            title="Collapse All Widgets"
          >
            <EyeOff className="w-3 h-3 text-rose-400" />
          </button>
          <button
            onClick={handleResetLayout}
            className="flex items-center gap-1 text-[11px] font-mono font-bold text-lilac hover:text-white px-2 py-1 rounded border border-white/5 hover:bg-white/10 transition-all cursor-pointer"
            title="Reset"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
        </div>,
        topbarContainer
      )}

      {/* Header Context Layer */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center -mb-2 z-10 px-2">
        <div>
          {user && (
            <div className="flex items-center flex-wrap gap-2 mb-1">
              <span className="text-[10px] md:text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-0.5 rounded-full animate-pulse">
                Welcome, {getRoleLabel(user.role)}
              </span>
              <span className="text-xs font-medium text-lavender/60">
                • {user.name}
              </span>
            </div>
          )}
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white mb-0.5">
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
        className="w-full mb-2 flex items-center justify-center"
      >
        <div className="relative w-full bg-deep-violet/40 rounded-3xl border border-royal-purple/20 overflow-hidden flex flex-col items-center justify-center py-4">
          
          {/* Gradient fade borders for blended vertical scroll effect on mobile */}
          <div className="absolute top-0 left-0 right-0 h-16 mobile-scroll-fade-top pointer-events-none md:hidden z-10" />
          <div className="absolute bottom-0 left-0 right-0 h-16 mobile-scroll-fade-bottom pointer-events-none md:hidden z-10" />

          <div className="relative flex flex-col md:flex-row overflow-y-auto md:overflow-y-visible max-h-[250px] md:max-h-none w-full px-4 md:px-8 justify-start md:justify-center items-center gap-8 md:gap-16 lg:gap-24 scrollbar-hide snap-y snap-mandatory pt-6">
            
            {/* Membership Strength Ring */}
            <div className="relative flex flex-col items-center shrink-0 snap-center">
              <div className="w-28 h-28 md:w-32 md:h-32 rounded-full bg-gradient-to-tr from-purple-700 to-indigo-600 shadow-[0_0_50px_rgba(120,81,169,0.6)] flex items-center justify-center relative animate-pulse">
                <div className="absolute inset-1.5 rounded-full bg-[#0B0118]/80 backdrop-blur-sm flex items-center justify-center flex-col">
                  <span className="text-lg md:text-2xl font-bold text-white tracking-tighter">
                    {user?.role === 'GLOBAL_ADMIN' ? (pulseStats.globalMembership / 1000).toFixed(1) + "k" : pulseStats.branchMembership.toLocaleString()}
                  </span>
                  <span className="text-[9px] text-lilac uppercase tracking-wider font-semibold mt-0.5">Membership</span>
                </div>
              </div>
              <div className="mt-2 text-center">
                <span className="text-[10px] text-purple-300 font-mono tracking-tight bg-purple-500/15 border border-purple-500/25 px-2.5 py-1 rounded-full whitespace-nowrap">
                  {user?.role === 'GLOBAL_ADMIN' ? "Global Strength" : `${user?.branchName || "City Expression"} Strength`}
                </span>
              </div>
            </div>

            {/* Weekly Souls Won Ring */}
            <div className="relative flex flex-col items-center shrink-0 snap-center">
              <div className="w-28 h-28 md:w-32 md:h-32 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-400 shadow-[0_0_50px_rgba(52,211,153,0.6)] flex items-center justify-center relative animate-pulse">
                <div className="absolute inset-1.5 rounded-full bg-[#0B0118]/80 backdrop-blur-sm flex items-center justify-center flex-col">
                  <span className="text-lg md:text-2xl font-bold text-white tracking-tighter">
                    {user?.role === 'GLOBAL_ADMIN' ? pulseStats.globalWeeklySouls.toLocaleString() : pulseStats.branchWeeklySouls.toLocaleString()}
                  </span>
                  <span className="text-[9px] text-emerald-400 uppercase tracking-wider font-semibold mt-0.5">Weekly Souls</span>
                </div>
              </div>
              <div className="mt-2 text-center">
                <span className="text-[10px] text-emerald-400 font-mono tracking-tight bg-emerald-500/15 border border-emerald-500/25 px-2.5 py-1 rounded-full whitespace-nowrap">
                  {user?.role === 'GLOBAL_ADMIN' ? "Weekly Souls Won" : "Weekly City Expression Souls"}
                </span>
              </div>
            </div>

            {/* Monthly Souls Won Ring */}
            <div className="relative flex flex-col items-center shrink-0 snap-center">
              <div className="w-28 h-28 md:w-32 md:h-32 rounded-full bg-gradient-to-tr from-rose-600 to-amber-500 shadow-[0_0_50px_rgba(244,63,94,0.6)] flex items-center justify-center relative animate-pulse">
                <div className="absolute inset-1.5 rounded-full bg-[#0B0118]/80 backdrop-blur-sm flex items-center justify-center flex-col">
                  <span className="text-lg md:text-2xl font-bold text-white tracking-tighter">
                    {user?.role === 'GLOBAL_ADMIN' ? pulseStats.globalMonthlySouls.toLocaleString() : pulseStats.branchMonthlySouls.toLocaleString()}
                  </span>
                  <span className="text-[9px] text-rose-400 uppercase tracking-wider font-semibold mt-0.5 animate-pulse">Monthly Souls</span>
                </div>
              </div>
              <div className="mt-2 text-center">
                <span className="text-[10px] text-rose-300 font-mono tracking-tight bg-rose-500/15 border border-rose-500/25 px-2.5 py-1 rounded-full whitespace-nowrap">
                  {user?.role === 'GLOBAL_ADMIN' ? "Monthly Souls Won" : "Monthly City Expression Souls"}
                </span>
              </div>
            </div>

          </div>
          <div className="absolute top-3 left-5">
            <h2 className="text-xs font-bold text-white/90 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full">
               {user?.role === 'GLOBAL_ADMIN' ? 'Global Growth Pulse' : `${user?.branchName || "City Expression"} Vitality`}
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
            <MetricCard title="Active City Expressions" value="2" trend={0} icon={<Building2 />} />
            <MetricCard title="Active Leaders" value={activeLeaderCount.toString()} trend={0} icon={<Users />} />
            <MetricCard title="Pending Approvals" value={pendingApprovalCount.toString()} trend={0} icon={<Sparkles />} />
            <MetricCard title="Returning Guests" value="284" trend={8.4} icon={<Activity />} />
           </>
        )}
        {user?.role === 'BRANCH_ADMIN' && (
           <>
            <MetricCard title="City Expression Attendance" value="4,200" trend={8.5} icon={<Users />} />
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
        {user?.role === 'FOUNDATION_SCHOOL' && (
           <>
            <MetricCard title="Enrolled Students" value="45" trend={15} icon={<Users />} />
            <MetricCard title="Active Classes" value="3" trend={0} icon={<Activity />} />
            <MetricCard title="Graduation Rate" value="92%" trend={2.5} icon={<Sparkles />} />
            <MetricCard title="Pending Grads" value="12" trend={10} icon={<Sparkles />} />
           </>
        )}
        {user?.role === 'HOME_CELL_COORD' && (
           <>
            <MetricCard title="Active Cell Hubs" value="15" trend={8.3} icon={<Users />} />
            <MetricCard title="Total Cell Members" value="180" trend={12.5} icon={<Users />} />
            <MetricCard title="Multiplication Candidates" value="4" trend={33.3} icon={<Sparkles />} />
            <MetricCard title="Avg Event Attendance" value="142" trend={5.2} icon={<Activity />} />
           </>
        )}
      </section>

      {/* Customizable Workspace Grid (Minimize & Drag-Reorder Active Modules) */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Column - Left Column (lg:col-span-2) */}
        <div 
          className="lg:col-span-2 flex flex-col gap-6 min-h-[500px] rounded-2xl transition-all"
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => handleColumnDrop('left')}
        >
          {leftWidgets
            .filter((widget) => !hiddenWidgets[widget.id])
            .map((widget, idx) => (
              <WidgetWrapper
                key={widget.id}
                id={widget.id}
                title={widget.title}
                isFirst={idx === 0}
                isLast={idx === leftWidgets.filter(w => !hiddenWidgets[w.id]).length - 1}
                isCollapsed={!!collapsedWidgets[widget.id]}
                onToggleCollapse={() => handleToggleCollapse(widget.id)}
                onMoveUp={() => handleMoveUp(widget.id, 'left')}
                onMoveDown={() => handleMoveDown(widget.id, 'left')}
                
                // Drag & Drop event connections
                draggable={true}
                onHtmlDragStart={() => setDraggedWidget({ id: widget.id, col: 'left' })}
                onHtmlDragOver={(e) => e.preventDefault()}
                onHtmlDrop={(e) => {
                  e.stopPropagation();
                  if (draggedWidget) {
                    handleWidgetDrop(draggedWidget.id, draggedWidget.col, widget.id, 'left');
                  }
                }}
                isDraggingCurrent={draggedWidget?.id === widget.id}
              >
                {renderWidget(widget.id)}
              </WidgetWrapper>
            ))}

          {leftWidgets.filter((widget) => !hiddenWidgets[widget.id]).length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 px-4 border border-dashed border-white/10 rounded-2xl bg-white/[0.01] text-lavender/40 text-center text-xs">
              <span className="italic font-mono mb-2">Left Column Empty</span>
              <span>Drag active modules here or toggle them on from Layout Settings.</span>
            </div>
          )}
        </div>

        {/* Sidebar Column - Right Column */}
        <div 
          className="flex flex-col gap-6 min-h-[500px] rounded-2xl transition-all"
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => handleColumnDrop('right')}
        >
          {rightWidgets
            .filter((widget) => !hiddenWidgets[widget.id])
            .map((widget, idx) => (
              <WidgetWrapper
                key={widget.id}
                id={widget.id}
                title={widget.title}
                isFirst={idx === 0}
                isLast={idx === rightWidgets.filter(w => !hiddenWidgets[w.id]).length - 1}
                isCollapsed={!!collapsedWidgets[widget.id]}
                onToggleCollapse={() => handleToggleCollapse(widget.id)}
                onMoveUp={() => handleMoveUp(widget.id, 'right')}
                onMoveDown={() => handleMoveDown(widget.id, 'right')}
                
                // Drag & Drop event connections
                draggable={true}
                onHtmlDragStart={() => setDraggedWidget({ id: widget.id, col: 'right' })}
                onHtmlDragOver={(e) => e.preventDefault()}
                onHtmlDrop={(e) => {
                  e.stopPropagation();
                  if (draggedWidget) {
                    handleWidgetDrop(draggedWidget.id, draggedWidget.col, widget.id, 'right');
                  }
                }}
                isDraggingCurrent={draggedWidget?.id === widget.id}
              >
                {renderWidget(widget.id)}
              </WidgetWrapper>
            ))}

          {rightWidgets.filter((widget) => !hiddenWidgets[widget.id]).length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 px-4 border border-dashed border-white/10 rounded-2xl bg-white/[0.01] text-lavender/40 text-center text-xs">
              <span className="italic font-mono mb-2">Right Column Empty</span>
              <span>Drag active modules here or toggle them on from Layout Settings.</span>
            </div>
          )}
        </div>
      </section>

      {/* Layout Config Settings Modal/Drawer */}
      <AnimatePresence>
        {isSettingsOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSettingsOpen(false)}
              className="absolute inset-0 bg-[#070114]/90 backdrop-blur-md"
            />
            {/* Dialog Panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-gradient-to-b from-[#160b2d] to-[#0d041c] border border-royal-purple/30 rounded-2xl overflow-hidden shadow-2xl p-6 md:p-8"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
                <div>
                  <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
                    <SlidersHorizontal className="w-5 h-5 text-emerald-400" />
                    Layout Customization Engine
                  </h2>
                  <p className="text-xs text-lilac font-medium mt-1">
                    Toggle visibility of metric modules specifically for your profile: <span className="text-emerald-400 font-mono font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded">{getRoleLabel(user?.role || '')}</span>
                  </p>
                </div>
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="p-1.5 rounded-lg bg-white/5 text-lilac/70 hover:bg-white/10 hover:text-white transition-all cursor-pointer"
                >
                  <EyeOff className="w-4 h-4" />
                </button>
              </div>

              {/* Toggle controls lists */}
              <div className="max-h-[380px] overflow-y-auto pr-2 space-y-4 font-sans">
                <div className="bg-[#110624]/60 border border-white/5 rounded-xl p-4">
                  <h4 className="text-xs font-bold tracking-wider uppercase text-lilac mb-3 flex items-center justify-between">
                    <span>Active Modules Directory ({[...leftWidgets, ...rightWidgets].length})</span>
                    <span className="text-[10px] bg-royal-purple/20 text-[#d8b4fe] border border-royal-purple/20 px-2 py-0.5 rounded uppercase font-mono">Profile Dashboard</span>
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[...leftWidgets, ...rightWidgets].map((widget) => {
                      const isHidden = !!hiddenWidgets[widget.id];
                      return (
                        <div 
                          key={widget.id} 
                          className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                            isHidden 
                              ? "bg-black/25 border-dashed border-white/5 opacity-60" 
                              : "bg-white/5 border-royal-purple/10 hover:border-royal-purple/25 hover:bg-white/[0.08]"
                          }`}
                        >
                          <div className="flex flex-col gap-0.5 mr-3">
                            <span className="text-sm font-semibold text-white/95 line-clamp-1">{widget.title}</span>
                            <span className="text-[10px] text-lilac/60 font-mono">ID: {widget.id}</span>
                          </div>
                          
                          <label className="relative inline-flex items-center cursor-pointer select-none">
                            <input 
                              type="checkbox" 
                              checked={!isHidden} 
                              onChange={() => handleToggleWidgetHide(widget.id)}
                              className="sr-only peer" 
                            />
                            <div className="w-9 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#d8b4fe] after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500 peer-checked:after:bg-white"></div>
                          </label>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-[#110624]/60 border border-white/5 rounded-xl p-4">
                  <h4 className="text-xs font-bold tracking-wider uppercase text-lilac mb-2">Instructions & Visual Guides</h4>
                  <ul className="text-xs text-lavender/70 space-y-2 list-inside list-disc">
                    <li>Type-reordering: Drag any module's header bar and drop it to set its order dynamically on the screen.</li>
                    <li>Move components between the double columns (Main Left & Right Sidebar) via drop placement.</li>
                    <li>Toggle the switches in this panel to temporarily show or hide specific diagnostic streams and cards depending on current analytics needs.</li>
                  </ul>
                </div>
              </div>

              {/* Dialog Footer Actions */}
              <div className="flex items-center justify-between border-t border-white/10 pt-5 mt-6">
                <button
                  onClick={() => {
                    handleResetLayout();
                  }}
                  className="flex items-center gap-1.5 text-xs font-bold font-mono text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/15 border border-rose-500/20 px-4 py-2.5 rounded-xl transition-all cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Reset Defaults
                </button>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setHiddenWidgets({});
                      saveHiddenState({});
                    }}
                    className="text-xs font-semibold text-lilac hover:text-white px-3 py-2 border border-white/5 hover:bg-white/5 rounded-xl transition-all"
                  >
                    Show All Modules
                  </button>
                  <button
                    onClick={() => setIsSettingsOpen(false)}
                    className="text-xs font-bold font-mono bg-emerald-500 hover:bg-emerald-400 text-[#070114] px-5 py-2.5 rounded-xl border border-emerald-400 transition-all shadow-lg shadow-emerald-500/15"
                  >
                    Apply Structure
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
