import React, { useState, useEffect } from "react";
import { 
  GraduationCap, 
  Users, 
  BookOpen, 
  Award, 
  ArrowRight, 
  Plus, 
  Search, 
  CheckCircle2, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  Sparkles,
  School,
  IdCard,
  Check,
  X,
  Filter,
  BrainCircuit,
  Bell,
  Eye
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { MetricCard } from "@/components/ui/MetricCard";
import { useAppStore } from "@/store/useAppStore";
import { supabase } from "@/lib/supabase";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Candidate {
  id: string;
  name: string;
  email: string;
  branch: string;
  stage: "ENROLLED" | "DOCTRINAL_CLASSES" | "EXAM_PHASE" | "INAUGURATED";
  score?: number;
  enrollment_date: string;
  inauguration_date?: string;
}

interface FSReport {
  id: string;
  week_number: number;
  sunday_attendance: number;
  tuesday_attendance: number;
  goals_achieved: string;
  challenges_faced: string;
  coordinator_feedback?: string;
  status: "PENDING_COORD" | "APPROVED" | "REJECTED";
  branch_name: string;
  created_at: string;
}

export function FoundationSchool() {
  const { user, theme } = useAppStore();
  const [activeTab, setActiveTab] = useState<"CANDIDATES" | "REPORTS">("CANDIDATES");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [reports, setReports] = useState<FSReport[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [branchFilter, setBranchFilter] = useState<string>("ALL");
  const [stageFilter, setStageFilter] = useState<string>("ALL");

  // Enroll modal states
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentEmail, setNewStudentEmail] = useState("");
  const [newStudentBranch, setNewStudentBranch] = useState<string>("Uyo (HQ)");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Exam Score modal states
  const [showScoreModal, setShowScoreModal] = useState<Candidate | null>(null);
  const [examScoreInput, setExamScoreInput] = useState<string>("");

  // New report modal states
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportWeekNumber, setReportWeekNumber] = useState(1);
  const [reportSundayAttendance, setReportSundayAttendance] = useState(0);
  const [reportTuesdayAttendance, setReportTuesdayAttendance] = useState(0);
  const [reportGoalsAchieved, setReportGoalsAchieved] = useState("");
  const [reportChallengesFaced, setReportChallengesFaced] = useState("");

  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  
  // View Report detail modal states
  const [selectedReport, setSelectedReport] = useState<FSReport | null>(null);
  const [feedbackInput, setFeedbackInput] = useState("");
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  useEffect(() => {
    fetchCandidates();
    fetchReports();
    
    // Real-time listener for report status updates
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'foundation_school_reports'
        },
        (payload) => {
          const updatedReport = payload.new as FSReport;
          // Only alert if we are the branch owner (Foundation School Leader for that branch)
          if (user && updatedReport.branch_name === user.branchName) {
            if (updatedReport.status === 'APPROVED' || updatedReport.status === 'REJECTED') {
              setNotification({
                message: `Your Week ${updatedReport.week_number} report was ${updatedReport.status}`,
                type: updatedReport.status === 'APPROVED' ? 'success' : 'error'
              });
              setTimeout(() => setNotification(null), 5000);
              
              // Update local state if we are viewing it
              setReports(prev => prev.map(r => r.id === updatedReport.id ? updatedReport : r));
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const generateWeeklySummary = async () => {
    if (reports.length === 0) return;
    setIsGeneratingAi(true);
    setAiSummary(null);
    
    // Take the last 4 reports
    const recentReports = reports.slice(0, 4);
    const goals = recentReports.map(r => r.goals_achieved).filter(Boolean);
    const challenges = recentReports.map(r => r.challenges_faced).filter(Boolean);
    
    try {
      const response = await fetch('/api/ai/weekly-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goals,
          challenges,
          role: user?.role,
          branchName: user?.branchName
        })
      });
      const data = await response.json();
      if (data.summary) {
        setAiSummary(data.summary);
      }
    } catch (err) {
      console.error("Failed to generate summary", err);
      setAiSummary("Could not generate insights at this time.");
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const fetchReports = async () => {
    try {
      let query = supabase.from("foundation_school_reports").select("*").order('created_at', { ascending: false });
      
      const isGlobalAdmin = user?.role === "GLOBAL_ADMIN" || user?.roles?.includes("GLOBAL_ADMIN");
      if (!isGlobalAdmin && user?.branchName) {
        query = query.eq("branch_name", user.branchName);
      }
      
      const { data, error } = await query;
      if (error) {
        console.error("Error fetching reports:", error);
      } else if (data) {
        setReports(data as FSReport[]);
      }
    } catch (err) {
      console.error("Failed to load reports", err);
    }
  };

  const fetchCandidates = async () => {
    try {
      let query = supabase.from("foundation_school_candidates").select("*").order('created_at', { ascending: false });
      
      // Admin limits to their branch unless global
      const isGlobalAdmin = user?.role === "GLOBAL_ADMIN" || user?.roles?.includes("GLOBAL_ADMIN");
      if (!isGlobalAdmin && user?.branchName) {
        query = query.eq("branch", user.branchName);
      }
      
      const { data, error } = await query;
      if (error) {
        console.error("Error fetching candidates:", error);
      } else if (data) {
        setCandidates(data as Candidate[]);
        
        // Populate local graduates for dashboard integration if needed
        const inaugurated = (data as Candidate[]).filter(c => c.stage === "INAUGURATED");
        localStorage.setItem("fs_graduates", JSON.stringify(inaugurated));
      }
    } catch (err) {
      console.error("Failed to load candidates", err);
    }
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.from("foundation_school_reports").insert([{
        week_number: reportWeekNumber,
        sunday_attendance: reportSundayAttendance,
        tuesday_attendance: reportTuesdayAttendance,
        goals_achieved: reportGoalsAchieved,
        challenges_faced: reportChallengesFaced,
        branch_name: user?.branchName || "Uyo (HQ)",
        status: "PENDING_COORD"
      }]).select();

      if (error) {
        console.error("Error submitting report:", error);
        alert("Failed to submit report.");
      } else if (data) {
        setReports(prev => [data[0] as FSReport, ...prev]);
        setReportWeekNumber(1);
        setReportSundayAttendance(0);
        setReportTuesdayAttendance(0);
        setReportGoalsAchieved("");
        setReportChallengesFaced("");
        setShowReportModal(false);
      }
    } catch (err) {
      console.error("Report submission failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitFeedback = async () => {
    if (!selectedReport || !feedbackInput.trim()) return;
    setIsSubmittingFeedback(true);
    try {
      const { error } = await supabase.from("foundation_school_reports")
        .update({ coordinator_feedback: feedbackInput })
        .eq("id", selectedReport.id);
        
      if (!error) {
        setReports(prev => prev.map(r => r.id === selectedReport.id ? { ...r, coordinator_feedback: feedbackInput } : r));
        setSelectedReport(prev => prev ? { ...prev, coordinator_feedback: feedbackInput } : null);
        setFeedbackInput("");
      } else {
        console.error("Error submitting feedback:", error);
      }
    } catch (err) {
      console.error("Feedback submission failed:", err);
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const handleUpdateReportStatus = async (reportId: string, newStatus: "APPROVED" | "REJECTED") => {
    try {
      const { error } = await supabase.from("foundation_school_reports")
        .update({ status: newStatus })
        .eq("id", reportId);
        
      if (!error) {
        setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: newStatus } : r));
      } else {
        console.error("Error updating report status:", error);
      }
    } catch (err) {
      console.error("Status update failed:", err);
    }
  };

  const handleEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim() || !newStudentEmail.trim()) return;
    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.from("foundation_school_candidates").insert([{
        name: newStudentName,
        email: newStudentEmail,
        branch: newStudentBranch,
        stage: "ENROLLED",
        enrollment_date: new Date().toISOString().split('T')[0]
      }]).select();

      if (error) {
        console.error("Error enrolling candidate:", error);
        alert("Failed to enroll candidate.");
      } else if (data) {
        setCandidates(prev => [data[0] as Candidate, ...prev]);
        setNewStudentName("");
        setNewStudentEmail("");
        setShowEnrollModal(false);
      }
    } catch (err) {
      console.error("Enrollment failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePromoteStage = async (candidateId: string) => {
    const candidate = candidates.find(c => c.id === candidateId);
    if (!candidate) return;

    let nextStage: Candidate["stage"] = candidate.stage;
    
    if (candidate.stage === "ENROLLED") {
      nextStage = "DOCTRINAL_CLASSES";
    } else if (candidate.stage === "DOCTRINAL_CLASSES") {
      nextStage = "EXAM_PHASE";
    } else if (candidate.stage === "EXAM_PHASE") {
      setShowScoreModal(candidate);
      setExamScoreInput(String(candidate.score || ""));
      return;
    }

    if (nextStage !== candidate.stage) {
      try {
        const { error } = await supabase.from("foundation_school_candidates")
          .update({ stage: nextStage })
          .eq("id", candidateId);
          
        if (!error) {
          setCandidates(prev => prev.map(c => c.id === candidateId ? { ...c, stage: nextStage } : c));
        } else {
          console.error("Error updating stage:", error);
        }
      } catch (err) {
        console.error("Promotion failed", err);
      }
    }
  };

  const handleSaveExamScore = async () => {
    if (!showScoreModal) return;
    const scoreVal = parseInt(examScoreInput, 10);
    if (isNaN(scoreVal) || scoreVal < 0 || scoreVal > 100) return alert("Please enter a valid score (0-100)");

    setIsSubmitting(true);
    try {
      const isPass = scoreVal >= 60;
      const nextStage = isPass ? "INAUGURATED" : "EXAM_PHASE";
      const inaugDate = isPass ? new Date().toISOString().split('T')[0] : null;

      const { error } = await supabase.from("foundation_school_candidates")
        .update({ 
          score: scoreVal, 
          stage: nextStage, 
          inauguration_date: inaugDate 
        })
        .eq("id", showScoreModal.id);

      if (!error) {
        const updated = candidates.map(c => {
          if (c.id === showScoreModal.id) {
            return { 
              ...c, 
              score: scoreVal,
              stage: nextStage as any,
              inauguration_date: inaugDate || undefined
            };
          }
          return c;
        });
        setCandidates(updated);
        
        // Update local graduates cache
        const inaugurated = updated.filter(c => c.stage === "INAUGURATED");
        localStorage.setItem("fs_graduates", JSON.stringify(inaugurated));
        
        setShowScoreModal(null);
      } else {
        console.error("Error saving score:", error);
        alert("Failed to save score.");
      }
    } catch (err) {
      console.error("Save score failed", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick stats calculations
  const totalEnrolled = candidates.length;
  const inProgressCount = candidates.filter(c => c.stage === "ENROLLED" || c.stage === "DOCTRINAL_CLASSES").length;
  const examCount = candidates.filter(c => c.stage === "EXAM_PHASE").length;
  const inauguratedCount = candidates.filter(c => c.stage === "INAUGURATED").length;
  
  // Avg exam score
  const gradedCandidates = candidates.filter(c => c.score !== undefined);
  const avgExamScore = gradedCandidates.length > 0 
    ? Math.round(gradedCandidates.reduce((acc, c) => acc + (c.score || 0), 0) / gradedCandidates.length)
    : 85;

  // Search and filter list
  const filteredCandidates = candidates.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesBranch = branchFilter === "ALL" || c.branch === branchFilter;
    const matchesStage = stageFilter === "ALL" || c.stage === stageFilter;

    // Sub-branch visibility constraint (BRANCH_ADMIN and FOUNDATION_SCHOOL can only see their own branch)
    if (user?.role === "BRANCH_ADMIN" || user?.role === "FOUNDATION_SCHOOL") {
      const isUserUyo = user?.branchName?.toLowerCase().includes("uyo");
      const isCandidateUyo = c.branch.includes("Uyo");
      if (isUserUyo !== isCandidateUyo) return false;
    }

    return matchesSearch && matchesBranch && matchesStage;
  });

  const getStageLabel = (stage: string) => {
    switch (stage) {
      case "ENROLLED": return { text: "Growth Track Registered", class: "bg-blue-500/15 text-blue-400 border-blue-500/20" };
      case "DOCTRINAL_CLASSES": return { text: "Doctrinal Classes", class: "bg-amber-500/15 text-amber-400 border-amber-500/20" };
      case "EXAM_PHASE": return { text: "Final Exams Block", class: "bg-purple-500/15 text-purple-400 border-purple-500/20" };
      case "INAUGURATED": return { text: "Inaugurated Member", class: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" };
      default: return { text: stage, class: "bg-slate-500/15 text-slate-400 border-slate-500/20" };
    }
  };

  return (
    <div className="flex flex-col gap-6 md:gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {notification && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 ${
          notification.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
        }`}>
          <Bell className="w-5 h-5 shrink-0" />
          <span className="text-sm font-semibold">{notification.message}</span>
        </div>
      )}

      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2 animate-pulse">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#B193FB] bg-[#B193FB]/15 border border-[#B193FB]/20 px-2.5 py-0.5 rounded-full">
              Growth Track OS
            </span>
            <span className="text-xs text-lilac/70 font-medium">Pipeline Intake Command</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white mb-1">
            Foundation School Pipeline
          </h1>
          <p className="text-lilac/80 font-medium text-sm">
            Nurturing disciples, administering Doctrinal Foundations, and inaugurating fully integrated ministry members.
          </p>
        </div>

        <button 
          onClick={() => {
            // Pre-fill the branch based on the user's branch
            if (user?.branchName) {
              const b = user.branchName.toLowerCase().includes("calabar") ? "Calabar" : "Uyo (HQ)";
              setNewStudentBranch(b);
            }
            setShowEnrollModal(true);
          }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-royal-purple to-[#818cf8] text-white font-bold text-sm tracking-wide shadow-lg hover:brightness-110 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Enroll Candidate</span>
        </button>
      </header>

      {/* Oversight Dashboard Role Banner */}
      {user?.role === "FOUNDATION_SCHOOL" && (
        <GlassCard className="p-5 border border-royal-purple/30 bg-gradient-to-r from-royal-purple/10 to-transparent flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex gap-3.5">
            <div className="p-3 bg-royal-purple/20 rounded-xl border border-royal-purple/30 text-white shrink-0">
               <GraduationCap className="w-6 h-6 text-[#B193FB]" />
            </div>
            <div>
               <h4 className="text-white font-bold text-base">Eminent Oversight Panel</h4>
               <p className="text-lilac/70 text-xs leading-relaxed max-w-xl mt-1">
                 Welcome, <strong>{user?.name || "Coordinator"}</strong>! As the **Foundation School Coordinator** directly under the **{user?.branchName || "Uyo (HQ)"} Branch**, you have spiritual and administrative oversight of doctrinal pipelines, trainee candidate classes, and graduations.
               </p>
            </div>
          </div>
          <div className="text-[11px] font-sans font-semibold border border-[#B193FB]/20 uppercase tracking-widest px-3 py-1.5 rounded-lg bg-[#2D0B4E]/30 text-[#B193FB]">
             Foundation School Coordinator
          </div>
        </GlassCard>
      )}

      {/* Overview Stats */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Cumulative Intake" value={totalEnrolled.toString()} trend={3.8} icon={<Users />} />
        <MetricCard title="Doctrinal Track" value={inProgressCount.toString()} trend={1.2} icon={<BookOpen />} />
        <MetricCard title="Exam Evaluation" value={examCount.toString()} trend={0} icon={<Award />} />
        <MetricCard title="Inaugurated Members" value={inauguratedCount.toString()} trend={14.2} icon={<GraduationCap />} />
      </section>

      {/* Doctrinal Pipeline Concept Flow Banner */}
      <section className="relative w-full rounded-3xl border border-royal-purple/20 bg-deep-violet/30 overflow-hidden p-6 md:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-royal-purple/10 via-transparent to-transparent opacity-60 pointer-events-none" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <School className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-semibold tracking-widest uppercase text-emerald-400">Integrated Membership Pipeline Process</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center mt-6">
            
            <div className="flex flex-col gap-2 p-4 rounded-2xl bg-white/5 border border-white/5 relative">
              <div className="absolute -top-3 -left-2 w-7 h-7 rounded-lg bg-royal-purple/20 border border-royal-purple/30 flex items-center justify-center font-mono text-xs font-bold text-[#B193FB]">01</div>
              <h4 className="text-sm font-bold text-white mt-1">1. Intake Registry</h4>
              <p className="text-xs text-lilac/70 font-medium">New converts, first-time visitors, and new attendants are invited to registry.</p>
            </div>

            <div className="hidden md:flex justify-center items-center">
              <ArrowRight className="w-6 h-6 text-royal-purple animate-pulse shrink-0" />
            </div>

            <div className="flex flex-col gap-2 p-4 rounded-2xl bg-white/5 border border-white/5 relative">
              <div className="absolute -top-3 -left-2 w-7 h-7 rounded-lg bg-royal-purple/20 border border-royal-purple/30 flex items-center justify-center font-mono text-xs font-bold text-[#B193FB]">02</div>
              <h4 className="text-sm font-bold text-white mt-1">2. Doctrinal Classes</h4>
              <p className="text-xs text-lilac/70 font-medium">Undergoing thorough structured studies of the Foundational principles of Christ.</p>
            </div>

            <div className="hidden md:flex justify-center items-center">
              <ArrowRight className="w-6 h-6 text-royal-purple animate-pulse shrink-0" />
            </div>

            <div className="flex flex-col gap-2 p-4 rounded-2xl bg-white/5 border border-white/5 relative">
              <div className="absolute -top-3 -left-2 w-7 h-7 rounded-lg bg-royal-purple/20 border border-royal-purple/30 flex items-center justify-center font-mono text-xs font-bold text-[#B193FB]">03</div>
              <h4 className="text-sm font-bold text-white mt-1">3. Doctrinal Exams</h4>
              <p className="text-xs text-lilac/70 font-medium font-sans">Testing comprehension of operations systems & foundational biblical truths.</p>
            </div>

            <div className="hidden md:flex justify-center items-center">
              <ArrowRight className="w-6 h-6 text-emerald-400 animate-pulse shrink-0" />
            </div>

            <div className="flex flex-col gap-2 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 relative">
              <div className="absolute -top-3 -left-2 w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center font-mono text-xs font-bold text-emerald-400">04</div>
              <h4 className="text-sm font-bold text-white mt-1">4. Member Inauguration</h4>
              <p className="text-xs text-emerald-200/80 font-medium">Fully inaugurated track graduates populate the live membership count.</p>
            </div>

          </div>
        </div>
      </section>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-4 border-b border-light-purple/10 pb-2">
        <button
          onClick={() => setActiveTab("CANDIDATES")}
          className={`px-4 py-2 font-medium text-sm transition-all border-b-2 ${
            activeTab === "CANDIDATES"
              ? "text-white border-[#B193FB]"
              : "text-lilac/50 border-transparent hover:text-lilac"
          }`}
        >
          Candidate Database
        </button>
        <button
          onClick={() => setActiveTab("REPORTS")}
          className={`px-4 py-2 font-medium text-sm transition-all border-b-2 ${
            activeTab === "REPORTS"
              ? "text-white border-[#B193FB]"
              : "text-lilac/50 border-transparent hover:text-lilac"
          }`}
        >
          Foundation School Reports
        </button>
      </div>

      {activeTab === "CANDIDATES" && (
        <section className="w-full">
          <GlassCard className="p-0 border overflow-hidden">
            
            {/* Header Controls */}
            <div className="p-5 md:p-6 border-b border-light-purple/10 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-[#070112]/40">
              <div>
                <h3 className="text-white font-bold text-base md:text-lg mb-0.5">Enrolled Candidate Database</h3>
                <p className="text-lilac/70 text-xs">Authorize progression and member inaugurations</p>
              </div>

            <div className="flex flex-wrap gap-2.5 items-center w-full md:w-auto">
              
              {/* Search Bar */}
              <div className="relative flex-1 md:w-56">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input 
                  type="text" 
                  placeholder="Search students..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-xl py-2 pl-9 pr-4 text-xs bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-royal-purple focus:border-royal-purple"
                />
              </div>

              {/* Branch Filter (HQ vs Calabar) - only displayed for top level admins */}
              {(user?.role === "GLOBAL_ADMIN" || user?.roles?.includes("GLOBAL_ADMIN")) && (
                <div id="fs-branch-filter-container">
                  <select
                    value={branchFilter}
                    onChange={(e) => setBranchFilter(e.target.value)}
                    className="rounded-xl py-2 pl-3 pr-8 text-xs bg-white/5 border border-white/10 text-white cursor-pointer focus:outline-none appearance-none"
                  >
                    <option value="ALL" className="bg-[#120524] text-white">All Branches</option>
                    <option value="Uyo (HQ)" className="bg-[#120524] text-white">Uyo (HQ)</option>
                    <option value="Calabar" className="bg-[#120524] text-white">Calabar</option>
                  </select>
                </div>
              )}

              {/* Stage Filter */}
              <div>
                <select
                  value={stageFilter}
                  onChange={(e) => setStageFilter(e.target.value)}
                  className="rounded-xl py-2 pl-3 pr-8 text-xs bg-white/5 border border-white/10 text-white cursor-pointer focus:outline-none appearance-none font-sans"
                >
                  <option value="ALL" className="bg-[#120524] text-white">All Stages</option>
                  <option value="ENROLLED" className="bg-[#120524] text-white">Registered</option>
                  <option value="DOCTRINAL_CLASSES" className="bg-[#120524] text-white">Classes</option>
                  <option value="EXAM_PHASE" className="bg-[#120524] text-white">Exam Stage</option>
                  <option value="INAUGURATED" className="bg-[#120524] text-white">Inaugurated</option>
                </select>
              </div>

            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-white/5 bg-white/5 text-[10px] md:text-xs font-bold text-lilac uppercase tracking-wider">
                  <th className="py-4 px-6">Student Details</th>
                  <th className="py-4 px-6 text-center">Expression Branch</th>
                  <th className="py-4 px-6">Current Cohort Stage</th>
                  <th className="py-4 px-6 text-center">Doctrinal Exam Score</th>
                  <th className="py-4 px-6 text-center">Authorized Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs md:text-sm">
                {filteredCandidates.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-lilac/50 font-medium">
                      No candidates found matching the current filtration.
                    </td>
                  </tr>
                ) : filteredCandidates.map((candidate) => {
                  const stageObj = getStageLabel(candidate.stage);
                  return (
                    <tr key={candidate.id} className="hover:bg-white/5 transition-colors group">
                      
                      {/* Name and email details */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-royal-purple/20 border border-royal-purple/20 flex items-center justify-center font-bold text-xs text-[#B193FB]">
                            {candidate.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="font-bold text-white leading-snug">{candidate.name}</h4>
                            <p className="text-[10px] text-lilac/60 font-mono tracking-tight">{candidate.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Expression Branch */}
                      <td className="py-4 px-6 text-center">
                        <span className="text-white/95 font-semibold text-xs py-1 px-2.5 rounded-lg bg-black/10 border border-white/5 whitespace-nowrap">
                          {candidate.branch}
                        </span>
                      </td>

                      {/* Growth Stage badge */}
                      <td className="py-4 px-6">
                        <span className={`inline-block py-1 px-2.5 rounded-full border text-[10px] font-bold tracking-wide leading-none ${stageObj.class}`}>
                          {stageObj.text}
                        </span>
                        {candidate.inauguration_date && (
                          <div className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>Inaugurated: {candidate.inauguration_date}</span>
                          </div>
                        )}
                        {!candidate.inauguration_date && (
                          <div className="text-[10px] text-lilac/50 mt-1 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>Enrolled: {candidate.enrollment_date}</span>
                          </div>
                        )}
                      </td>

                      {/* Exam Score */}
                      <td className="py-4 px-6 text-center">
                        {candidate.score !== undefined ? (
                          <div className="flex flex-col items-center justify-center">
                            <span className={`text-sm font-bold font-mono px-2 py-0.5 rounded-lg border ${
                              candidate.score >= 75 
                                ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" 
                                : candidate.score >= 60 
                                  ? "text-blue-400 bg-blue-500/10 border-blue-500/20"
                                  : "text-rose-400 bg-rose-500/10 border-rose-500/20"
                            }`}>
                              {candidate.score}%
                            </span>
                            <span className="text-[9px] text-lilac/40 tracking-wider font-semibold uppercase mt-1">
                              {candidate.score >= 60 ? "Verified Pass" : "Exams Retake"}
                            </span>
                          </div>
                        ) : (
                          <span className="text-lilac/45 font-semibold text-xs italic">Awaiting Assessment</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-center">
                        {candidate.stage === "INAUGURATED" ? (
                          <div className="flex items-center justify-center gap-1.5 text-emerald-400 font-bold text-xs uppercase bg-emerald-500/5 px-3 py-1.5 rounded-xl border border-emerald-500/20">
                            <CheckCircle className="w-4 h-4 shrink-0" />
                            <span>Inaugurated Successfully</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => handlePromoteStage(candidate.id)}
                            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-500/15 border border-indigo-500/30 hover:bg-indigo-500 hover:text-white transition-all duration-200 shadow active:scale-95 whitespace-nowrap scrollbar-hide shrink-0"
                          >
                            <span>
                              {candidate.stage === "ENROLLED" && "Approve to Doctrinal Classes"}
                              {candidate.stage === "DOCTRINAL_CLASSES" && "Advance to Exam Stage"}
                              {candidate.stage === "EXAM_PHASE" && "Grade Exam & Inaugurate"}
                            </span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

        </GlassCard>
      </section>
      )}

      {activeTab === "REPORTS" && (
        <section className="w-full space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <GlassCard className="col-span-1 lg:col-span-2 p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-bold text-base">Weekly Attendance Trends</h3>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={[...reports].reverse()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                    <XAxis dataKey="week_number" stroke="#ffffff50" tickFormatter={(val) => `W${val}`} fontSize={12} />
                    <YAxis stroke="#ffffff50" fontSize={12} />
                    <Tooltip contentStyle={{ backgroundColor: '#110524', border: '1px solid #ffffff20', borderRadius: '8px' }} />
                    <Line type="monotone" dataKey="sunday_attendance" name="Sunday" stroke="#34d399" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="tuesday_attendance" name="Tuesday" stroke="#818cf8" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>

            <GlassCard className="col-span-1 p-6 flex flex-col gap-4 bg-gradient-to-br from-[#110524] to-black">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BrainCircuit className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-white font-bold text-base">Weekly Insight Summary</h3>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto text-sm text-lilac/80 bg-black/30 rounded-xl p-4 border border-white/5 leading-relaxed custom-scrollbar relative">
                {isGeneratingAi ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-emerald-400 animate-pulse font-medium text-xs tracking-wider uppercase">Generating Insights...</span>
                  </div>
                ) : aiSummary ? (
                  <p>{aiSummary}</p>
                ) : (
                  <div className="text-center text-lilac/40 italic flex flex-col items-center justify-center h-full gap-2">
                    <p>No insights generated yet.</p>
                  </div>
                )}
              </div>

              <button 
                onClick={generateWeeklySummary}
                disabled={isGeneratingAi || reports.length === 0}
                className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs tracking-wide transition-colors disabled:opacity-50"
              >
                Generate Summary
              </button>
            </GlassCard>
          </div>

          <GlassCard className="p-0 border overflow-hidden">
            <div className="p-5 md:p-6 border-b border-light-purple/10 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-[#070112]/40">
              <div>
                <h3 className="text-white font-bold text-base md:text-lg mb-0.5">Foundation School Reports</h3>
                <p className="text-lilac/70 text-xs">Review class modules and attendance reports</p>
              </div>

              <div className="flex gap-2.5 items-center">
                <button 
                  onClick={() => setShowReportModal(true)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-400 text-white font-bold text-sm tracking-wide shadow-lg hover:brightness-110 active:scale-95 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Submit Report</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="border-b border-light-purple/10 bg-black/20 text-[10px] uppercase font-bold tracking-widest text-lilac/70">
                    <th className="py-4 px-6 whitespace-nowrap">Week & Status</th>
                    <th className="py-4 px-6 text-center whitespace-nowrap">Branch</th>
                    <th className="py-4 px-6 text-center whitespace-nowrap">Sunday</th>
                    <th className="py-4 px-6 text-center whitespace-nowrap">Tuesday</th>
                    <th className="py-4 px-6 whitespace-nowrap">Goals & Challenges</th>
                    <th className="py-4 px-6 text-center whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-light-purple/5">
                  {reports.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-lilac/50 italic text-sm">
                        No reports submitted yet.
                      </td>
                    </tr>
                  )}
                  {reports.map(report => (
                    <tr key={report.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="py-4 px-6">
                        <div className="flex flex-col gap-2">
                          <h4 className="font-bold text-white text-sm">Week {report.week_number}</h4>
                          <span className={`inline-block py-0.5 px-2 rounded-full border text-[10px] font-bold tracking-wide w-fit leading-none ${
                            report.status === "APPROVED" ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" :
                            report.status === "REJECTED" ? "bg-rose-500/15 text-rose-400 border-rose-500/20" :
                            "bg-amber-500/15 text-amber-400 border-amber-500/20"
                          }`}>
                            {report.status.replace("_", " ")}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-center text-xs font-semibold text-white/90">
                        {report.branch_name}
                      </td>
                      <td className="py-4 px-6 text-center font-mono text-sm font-bold text-emerald-400">
                        {report.sunday_attendance}
                      </td>
                      <td className="py-4 px-6 text-center font-mono text-sm font-bold text-emerald-400">
                        {report.tuesday_attendance}
                      </td>
                      <td className="py-4 px-6 text-xs text-lilac/80">
                        <div className="line-clamp-1 mb-1"><span className="font-semibold text-white">Goals:</span> {report.goals_achieved || "N/A"}</div>
                        <div className="line-clamp-1"><span className="font-semibold text-white">Challenges:</span> {report.challenges_faced || "N/A"}</div>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedReport(report);
                              setFeedbackInput(report.coordinator_feedback || "");
                            }}
                            className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {(user?.role === "GLOBAL_ADMIN" || user?.role === "FOUNDATION_SCHOOL" || user?.roles?.includes("GLOBAL_ADMIN")) && report.status === "PENDING_COORD" && (
                            <>
                              <button
                                onClick={() => handleUpdateReportStatus(report.id, "APPROVED")}
                                className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                                title="Approve Report"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleUpdateReportStatus(report.id, "REJECTED")}
                                className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors"
                                title="Reject Report"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </section>
      )}

      {/* Modal - Enroll New Student */}
      {showEnrollModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className={`w-full max-w-md p-6 rounded-2xl border shadow-2xl relative overflow-hidden backdrop-blur-xl animate-in fade-in zoom-in-95 duration-250 ${
            theme === "light" ? "bg-white border-slate-200 text-slate-900" : "bg-[#110524]/90 border-white/10 text-white"
          }`}>
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-royal-purple via-indigo-500 to-emerald-400" />
            
            <header className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <IdCard className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-lg">Enroll New Candidate</h3>
              </div>
              <button onClick={() => setShowEnrollModal(false)} className="p-1 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </header>

            <form onSubmit={handleEnroll} className="space-y-4">
              
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold tracking-wider text-lilac/70">Candidate Full Name</label>
                <input 
                  type="text" 
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  placeholder="e.g. John Doe"
                  required
                  className="w-full rounded-xl py-2.5 px-4 text-xs font-medium focus:outline-none focus:ring-1 transition-all border border-white/10 bg-white/5 text-white focus:ring-[#B193FB] focus:border-[#B193FB]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold tracking-wider text-lilac/70">Email Address</label>
                <input 
                  type="email" 
                  value={newStudentEmail}
                  onChange={(e) => setNewStudentEmail(e.target.value)}
                  placeholder="e.g. john.doe@email.com"
                  required
                  className="w-full rounded-xl py-2.5 px-4 text-xs font-medium focus:outline-none focus:ring-1 transition-all border border-white/10 bg-white/5 text-white focus:ring-[#B193FB] focus:border-[#B193FB]"
                />
              </div>

              {(user?.role === "GLOBAL_ADMIN" || user?.roles?.includes("GLOBAL_ADMIN")) && (
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-lilac/70">Expression Branch</label>
                  <select 
                    value={newStudentBranch}
                    onChange={(e) => setNewStudentBranch(e.target.value as any)}
                    className="w-full rounded-xl py-2.5 px-4 text-xs font-medium focus:outline-none focus:ring-1 transition-all border border-white/10 bg-[#120524] text-white"
                  >
                    <option value="Uyo (HQ)">Uyo (HQ)</option>
                    <option value="Calabar">Calabar</option>
                  </select>
                </div>
              )}

              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-4 rounded-xl py-3 bg-gradient-to-r from-royal-purple to-[#818cf8] text-white font-bold text-sm tracking-wide shadow-lg active:scale-95 transition-all disabled:opacity-50"
              >
                {isSubmitting ? "Enrolling..." : "Enroll New Candidate"}
              </button>

            </form>
          </div>
        </div>
      )}

      {/* Modal - Exam Grade scoring and Inauguration */}
      {showScoreModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm p-6 rounded-2xl border border-white/10 bg-[#110524]/90 text-white shadow-2xl relative overflow-hidden backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-royal-purple to-emerald-400" />
            
            <header className="flex justify-between items-center mb-5">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-base md:text-lg">Assess Doctrinal Exam</h3>
              </div>
              <button onClick={() => setShowScoreModal(null)} className="p-1 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </header>

            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 text-xs">
                <p className="text-lilac/60 font-semibold mb-1 uppercase tracking-wider text-[10px]">Candidate</p>
                <p className="text-white font-bold text-sm">{showScoreModal.name}</p>
                <p className="text-lilac/60 leading-normal mt-2">
                  Graduating and inaugurating requires a doctrinal-exam pass mark of <strong>60%</strong> or higher. Passing score will immediately integrate them into the church membership totals.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold tracking-wider text-emerald-400">Award Certificate/Exam Grade (%)</label>
                <input 
                  type="number" 
                  min="0" 
                  max="100"
                  value={examScoreInput}
                  onChange={(e) => setExamScoreInput(e.target.value)}
                  placeholder="e.g. 85"
                  required
                  className="w-full rounded-xl py-2.5 px-4 text-sm font-bold font-mono focus:outline-none focus:ring-1 transition-all border border-white/10 bg-white/5 text-white focus:ring-emerald-400 focus:border-emerald-400 placeholder:text-white/20"
                />
              </div>

              <button 
                onClick={handleSaveExamScore}
                disabled={isSubmitting}
                className="w-full mt-4 rounded-xl py-3 bg-gradient-to-r from-emerald-600 to-teal-400 text-white font-bold text-sm tracking-wide shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>{isSubmitting ? "Saving..." : "Submit Score & Inaugurate"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal - Submit Report */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className={`w-full max-w-md p-6 rounded-2xl border shadow-2xl relative overflow-hidden backdrop-blur-xl animate-in fade-in zoom-in-95 duration-250 ${
            theme === "light" ? "bg-white border-slate-200 text-slate-900" : "bg-[#110524]/90 border-white/10 text-white"
          }`}>
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-600" />
            
            <header className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-lg">Submit Class Report</h3>
              </div>
              <button onClick={() => setShowReportModal(false)} className="p-1 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </header>

            <form onSubmit={handleSubmitReport} className="space-y-4">
              
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold tracking-wider text-lilac/70">Week Number</label>
                <input 
                  type="number" 
                  min="1"
                  value={reportWeekNumber}
                  onChange={(e) => setReportWeekNumber(parseInt(e.target.value))}
                  placeholder="e.g. 1"
                  required
                  className="w-full rounded-xl py-2.5 px-4 text-xs font-medium focus:outline-none focus:ring-1 transition-all border border-white/10 bg-white/5 text-white focus:ring-[#B193FB] focus:border-[#B193FB]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-lilac/70">Sunday Attendance</label>
                  <input 
                    type="number" 
                    min="0"
                    value={reportSundayAttendance}
                    onChange={(e) => setReportSundayAttendance(parseInt(e.target.value))}
                    required
                    className="w-full rounded-xl py-2.5 px-4 text-xs font-medium focus:outline-none focus:ring-1 transition-all border border-white/10 bg-white/5 text-white focus:ring-[#B193FB] focus:border-[#B193FB]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-lilac/70">Tuesday Attendance</label>
                  <input 
                    type="number" 
                    min="0"
                    value={reportTuesdayAttendance}
                    onChange={(e) => setReportTuesdayAttendance(parseInt(e.target.value))}
                    required
                    className="w-full rounded-xl py-2.5 px-4 text-xs font-medium focus:outline-none focus:ring-1 transition-all border border-white/10 bg-white/5 text-white focus:ring-[#B193FB] focus:border-[#B193FB]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold tracking-wider text-lilac/70">Goals Achieved</label>
                <textarea 
                  value={reportGoalsAchieved}
                  onChange={(e) => setReportGoalsAchieved(e.target.value)}
                  placeholder="What were the goals and what was achieved?"
                  required
                  rows={2}
                  className="w-full rounded-xl py-2.5 px-4 text-xs font-medium focus:outline-none focus:ring-1 transition-all border border-white/10 bg-white/5 text-white focus:ring-[#B193FB] focus:border-[#B193FB]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold tracking-wider text-lilac/70">Challenges Faced</label>
                <textarea 
                  value={reportChallengesFaced}
                  onChange={(e) => setReportChallengesFaced(e.target.value)}
                  placeholder="Were there any challenges?"
                  required
                  rows={2}
                  className="w-full rounded-xl py-2.5 px-4 text-xs font-medium focus:outline-none focus:ring-1 transition-all border border-white/10 bg-white/5 text-white focus:ring-[#B193FB] focus:border-[#B193FB]"
                />
              </div>

              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-4 rounded-xl py-3 bg-gradient-to-r from-emerald-600 to-teal-400 text-white font-bold text-sm tracking-wide shadow-lg active:scale-95 transition-all disabled:opacity-50"
              >
                {isSubmitting ? "Submitting..." : "Submit class report"}
              </button>

            </form>
          </div>
        </div>
      )}

      {/* Modal - View Report Details */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className={`w-full max-w-md p-6 rounded-2xl border shadow-2xl relative overflow-hidden backdrop-blur-xl animate-in fade-in zoom-in-95 duration-250 ${
            theme === "light" ? "bg-white border-slate-200 text-slate-900" : "bg-[#110524]/90 border-white/10 text-white"
          }`}>
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-500" />
            
            <header className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-lg">Report Details (Week {selectedReport.week_number})</h3>
              </div>
              <button onClick={() => {
                setSelectedReport(null);
                setFeedbackInput("");
              }} className="p-1 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </header>

            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-lilac/70 block mb-1">Sunday Attendance</span>
                  <span className="font-mono text-lg font-bold text-emerald-400">{selectedReport.sunday_attendance}</span>
                </div>
                <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-lilac/70 block mb-1">Tuesday Attendance</span>
                  <span className="font-mono text-lg font-bold text-emerald-400">{selectedReport.tuesday_attendance}</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-lilac/70 block mb-1">Goals Achieved</span>
                <p className="text-sm text-white/90 bg-white/5 p-3 rounded-xl border border-white/10 leading-relaxed">{selectedReport.goals_achieved || "N/A"}</p>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-lilac/70 block mb-1">Challenges Faced</span>
                <p className="text-sm text-white/90 bg-white/5 p-3 rounded-xl border border-white/10 leading-relaxed">{selectedReport.challenges_faced || "N/A"}</p>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-lilac/70 block mb-1">Coordinator Feedback</span>
                {(user?.role === "GLOBAL_ADMIN" || user?.role === "BRANCH_ADMIN") ? (
                  <div className="space-y-3">
                    <textarea 
                      value={feedbackInput}
                      onChange={(e) => setFeedbackInput(e.target.value)}
                      placeholder="Enter feedback for the foundation school leader..."
                      rows={3}
                      className="w-full rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:ring-1 transition-all border border-indigo-500/30 bg-indigo-500/5 text-white focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <button 
                      onClick={handleSubmitFeedback}
                      disabled={isSubmittingFeedback || !feedbackInput.trim() || feedbackInput === selectedReport.coordinator_feedback}
                      className="w-full rounded-xl py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm tracking-wide shadow-lg active:scale-95 transition-all disabled:opacity-50"
                    >
                      {isSubmittingFeedback ? "Saving..." : "Save Feedback"}
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-white/90 bg-indigo-500/10 p-3 rounded-xl border border-indigo-500/20 leading-relaxed">
                    {selectedReport.coordinator_feedback || <span className="text-lilac/50 italic">No feedback provided yet.</span>}
                  </p>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
