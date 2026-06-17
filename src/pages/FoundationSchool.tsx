import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
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
  Filter
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { MetricCard } from "@/components/ui/MetricCard";
import { useAppStore } from "@/store/useAppStore";

interface Candidate {
  id: string;
  name: string;
  email: string;
  branch: "Uyo (HQ)" | "Calabar";
  stage: "ENROLLED" | "DOCTRINAL_CLASSES" | "EXAM_PHASE" | "INAUGURATED";
  score?: number;
  enrollmentDate: string;
  inaugurationDate?: string;
}

const defaultCandidates: Candidate[] = [
  { id: "fs-1", name: "Anietie Udoh", email: "anietie.udoh@gmail.com", branch: "Uyo (HQ)", stage: "EXAM_PHASE", score: 85, enrollmentDate: "2026-04-10" },
  { id: "fs-2", name: "NseAbasi Ekong", email: "nse.ekong@outlook.com", branch: "Uyo (HQ)", stage: "DOCTRINAL_CLASSES", enrollmentDate: "2026-05-02" },
  { id: "fs-3", name: "Theresa Bassey", email: "theresa.b@yahoo.com", branch: "Calabar", stage: "ENROLLED", enrollmentDate: "2026-06-05" },
  { id: "fs-4", name: "Eyo Effiong", email: "eyo.effiong@gmail.com", branch: "Calabar", stage: "EXAM_PHASE", enrollmentDate: "2026-04-18" },
  { id: "fs-5", name: "Gift Akpan", email: "gift.akpan@gmail.com", branch: "Uyo (HQ)", stage: "DOCTRINAL_CLASSES", enrollmentDate: "2026-05-12" },
  { id: "fs-6", name: "Idorenyin Marcus", email: "id.marcus@gmail.com", branch: "Uyo (HQ)", stage: "INAUGURATED", score: 92, enrollmentDate: "2026-03-01", inaugurationDate: "2026-05-15" },
  { id: "fs-7", name: "Mfonobong Sunday", email: "mfon.sunday@gmail.com", branch: "Calabar", stage: "INAUGURATED", score: 88, enrollmentDate: "2026-03-05", inaugurationDate: "2026-05-15" }
];

export function FoundationSchool() {
  const { user, theme } = useAppStore();
  const [searchParams] = useSearchParams();
  const filterParam = searchParams.get("filter");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [branchFilter, setBranchFilter] = useState<string>("ALL");
  const [stageFilter, setStageFilter] = useState<string>("ALL");

  // Enroll modal states
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentEmail, setNewStudentEmail] = useState("");
  const [newStudentBranch, setNewStudentBranch] = useState<"Uyo (HQ)" | "Calabar">("Uyo (HQ)");

  // Exam Score modal states
  const [showScoreModal, setShowScoreModal] = useState<Candidate | null>(null);
  const [examScoreInput, setExamScoreInput] = useState<string>("");

  useEffect(() => {
    const stored = localStorage.getItem("fs_candidates");
    if (stored) {
      try {
        setCandidates(JSON.parse(stored));
      } catch (e) {
        setCandidates(defaultCandidates);
      }
    } else {
      setCandidates(defaultCandidates);
      localStorage.setItem("fs_candidates", JSON.stringify(defaultCandidates));
      // Populate overall graduates as well to feed Dashboard live strength
      const inaugurated = defaultCandidates.filter(c => c.stage === "INAUGURATED");
      localStorage.setItem("fs_graduates", JSON.stringify(inaugurated));
    }
  }, []);

  const saveCandidates = (updated: Candidate[]) => {
    setCandidates(updated);
    localStorage.setItem("fs_candidates", JSON.stringify(updated));
    // Save only inaugurated to separate key for dashboard aggregation
    const inaugurated = updated.filter(c => c.stage === "INAUGURATED");
    localStorage.setItem("fs_graduates", JSON.stringify(inaugurated));
  };

  const handleEnroll = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim() || !newStudentEmail.trim()) return;

    const newStudent: Candidate = {
      id: `fs-${Date.now()}`,
      name: newStudentName,
      email: newStudentEmail,
      branch: newStudentBranch,
      stage: "ENROLLED",
      enrollmentDate: new Date().toISOString().split('T')[0]
    };

    const updated = [newStudent, ...candidates];
    saveCandidates(updated);

    // Reset fields
    setNewStudentName("");
    setNewStudentEmail("");
    setShowEnrollModal(false);
  };

  const handlePromoteStage = (candidateId: string) => {
    const updated = candidates.map(c => {
      if (c.id === candidateId) {
        if (c.stage === "ENROLLED") {
          return { ...c, stage: "DOCTRINAL_CLASSES" as const };
        } else if (c.stage === "DOCTRINAL_CLASSES") {
          return { ...c, stage: "EXAM_PHASE" as const };
        } else if (c.stage === "EXAM_PHASE") {
          // Open exam score modal
          setShowScoreModal(c);
          setExamScoreInput(String(c.score || ""));
          return c;
        }
        return c;
      }
      return c;
    });
    if (showScoreModal === null) {
      saveCandidates(updated);
    }
  };

  const handleSaveExamScore = () => {
    if (!showScoreModal) return;
    const scoreVal = parseInt(examScoreInput, 10);
    if (isNaN(scoreVal) || scoreVal < 0 || scoreVal > 100) return alert("Please enter a valid score (0-100)");

    const updated = candidates.map(c => {
      if (c.id === showScoreModal.id) {
        return { 
          ...c, 
          score: scoreVal,
          stage: scoreVal >= 60 ? "INAUGURATED" as const : "EXAM_PHASE" as const,
          inaugurationDate: scoreVal >= 60 ? new Date().toISOString().split('T')[0] : undefined
        };
      }
      return c;
    });

    saveCandidates(updated);
    setShowScoreModal(null);
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
    
    // Support filtering only active/current students (omit INAUGURATED) if requested
    const matchesStage = stageFilter === "ALL" 
      ? (filterParam === "current" ? c.stage !== "INAUGURATED" : true)
      : c.stage === stageFilter;

    // Sub-branch visibility constraint (BRANCH_ADMIN or FOUNDATION_LEADER can only see their own branch)
    if (user?.role === "BRANCH_ADMIN" || user?.role === "FOUNDATION_LEADER") {
      const isUserUyo = user.branchName?.toLowerCase().includes("uyo");
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
            {filterParam === "current" ? "Active Foundation Students" : "Foundation School Pipeline"}
          </h1>
          <p className="text-lilac/80 font-medium text-sm">
            Nurturing disciples, administering Doctrinal Foundations, and inaugurating fully integrated ministry members.
          </p>
        </div>

        <button 
          onClick={() => setShowEnrollModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-royal-purple to-[#818cf8] text-white font-bold text-sm tracking-wide shadow-lg hover:brightness-110 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Enroll Candidate</span>
        </button>
      </header>

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

      {/* Search and Filters Table Layout */}
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
              {user?.role === "GLOBAL_ADMIN" && (
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
                        {candidate.inaugurationDate && (
                          <div className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>Inaugurated: {candidate.inaugurationDate}</span>
                          </div>
                        )}
                        {!candidate.inaugurationDate && (
                          <div className="text-[10px] text-lilac/50 mt-1 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>Enrolled: {candidate.enrollmentDate}</span>
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

              {user?.role === "GLOBAL_ADMIN" && (
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
                className="w-full mt-4 rounded-xl py-3 bg-gradient-to-r from-royal-purple to-[#818cf8] text-white font-bold text-sm tracking-wide shadow-lg active:scale-95 transition-all"
              >
                Enroll New Candidate
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
                className="w-full mt-4 rounded-xl py-3 bg-gradient-to-r from-emerald-600 to-teal-400 text-white font-bold text-sm tracking-wide shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>Submit Score & Inaugurate</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
