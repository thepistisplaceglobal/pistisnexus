import { useState, useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { MetricCard } from "@/components/ui/MetricCard";
import { InsightCard } from "@/components/ui/InsightCard";
import { Filter, Home, MapPin, Users, Plus, Trash2, X, Mail, Send, ShieldAlert } from "lucide-react";
import { ReportingWidget } from "@/components/ui/ReportingWidget";
import { GlassCard } from "@/components/ui/GlassCard";
import { UnitMembersManager } from "@/components/UnitMembersManager";
import { Link } from "react-router-dom";

interface HomeCell {
  id: string;
  name: string;
  leaders: string;
  branchName: string;
  hostAddress?: string;
  membersCount: number;
}

const defaultHomeCellsList: HomeCell[] = [
  { id: "1", name: "Abak Road Home Cell", leaders: "Ms Emem Ekarika & Mr Chukwuemeka", branchName: "Uyo (HQ)", hostAddress: "12 Abak Road, Uyo", membersCount: 18 },
  { id: "2", name: "Atiku Home Cell", leaders: "Mr Mamaki and Amah victor", branchName: "Calabar", hostAddress: "5 Atiku Street, Calabar", membersCount: 12 },
  { id: "3", name: "Ibesikpo Home Cell", leaders: "Mr Wisdom Hillary", branchName: "Uyo (HQ)", hostAddress: "Ibesikpo Lane, Uyo", membersCount: 15 },
  { id: "4", name: "Ikotekpene Road Home Cell", leaders: "Ms Kubiat Nkereuwem", branchName: "Uyo (HQ)", hostAddress: "88 Ikotekpene Road, Uyo", membersCount: 22 },
  { id: "5", name: "Ekom Iman and Idoro Home Cell", leaders: "Mr Godfrey Anietie", branchName: "Port Harcourt", hostAddress: "Ekom Iman Close, PH", membersCount: 9 },
  { id: "6", name: "Aka Road Home Cell", leaders: "Mr Uyoata Joseph and Miss Chinonyelim", branchName: "London", hostAddress: "Greenwich, London", membersCount: 14 },
  { id: "7", name: "AKSU Home Cell", leaders: "Ms Sophia", branchName: "Uyo (HQ)", hostAddress: "University Campus Area, Uyo", membersCount: 25 },
  { id: "8", name: "Nwaniba Home Cell", leaders: "Mr Obongekeme Eniang", branchName: "Uyo (HQ)", hostAddress: "Nwaniba Junction, Uyo", membersCount: 11 },
  { id: "9", name: "Oron Road Home Cell", leaders: "Mr Favour Nkamare", branchName: "Calabar", hostAddress: "Oron Road Expressway, Calabar", membersCount: 16 },
];

export function HomeCells() {
  const user = useAppStore((state) => state.user);
  const theme = useAppStore((state) => state.theme);
  
  const [cells, setCells] = useState<HomeCell[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>("All");
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Broadcast modal state
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [broadcastTarget, setBroadcastTarget] = useState("all");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  const [newCell, setNewCell] = useState({
    name: "",
    leaders: "",
    hostAddress: "",
    membersCount: 10,
    branchName: ""
  });

  // Load cells from LocalStorage or fallback to default list
  useEffect(() => {
    const saved = localStorage.getItem("pn_home_cells");
    if (saved) {
      try {
        setCells(JSON.parse(saved));
      } catch (e) {
        setCells(defaultHomeCellsList);
      }
    } else {
      setCells(defaultHomeCellsList);
      localStorage.setItem("pn_home_cells", JSON.stringify(defaultHomeCellsList));
    }
  }, []);

  // Sync to local storage
  const saveCellsToStorage = (updatedCells: HomeCell[]) => {
    setCells(updatedCells);
    localStorage.setItem("pn_home_cells", JSON.stringify(updatedCells));
  };

  // Determine user's branch for filtering/pre-filling
  const userBranch = user?.branchName || "Uyo (HQ)";
  const isCoordinator = user?.role === "HOME_CELL_COORD";
  const isBranchAdmin = user?.role === "BRANCH_ADMIN";
  const isGlobalAdmin = user?.role === "GLOBAL_ADMIN";
  const hasManagementPrivilege = isCoordinator || isBranchAdmin || isGlobalAdmin;

  // Default filter: coordinators and branch admins only see their own branch, unless overridden.
  useEffect(() => {
    if (isCoordinator || isBranchAdmin) {
      setSelectedBranch(userBranch);
    } else {
      setSelectedBranch("All");
    }
  }, [user, isCoordinator, isBranchAdmin, userBranch]);

  const handleAddCell = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCell.name || !newCell.leaders) return;

    const cellToAdd: HomeCell = {
      id: "cell_" + Date.now(),
      name: newCell.name,
      leaders: newCell.leaders,
      hostAddress: newCell.hostAddress,
      membersCount: Number(newCell.membersCount) || 5,
      branchName: newCell.branchName || userBranch,
    };

    const updated = [cellToAdd, ...cells];
    saveCellsToStorage(updated);
    
    // Reset state & close template
    setNewCell({
      name: "",
      leaders: "",
      hostAddress: "",
      membersCount: 10,
      branchName: ""
    });
    setShowAddModal(false);
  };

  const handleDeleteCell = (id: string) => {
    if (window.confirm("Are you sure you want to stop/de-register this Home Cell? This action is irreversible.")) {
      const updated = cells.filter((c) => c.id !== id);
      saveCellsToStorage(updated);
    }
  };

  const handleBroadcastSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastMessage.trim()) return;
    
    setIsSending(true);
    setTimeout(() => {
      setIsSending(false);
      setShowBroadcastModal(false);
      setBroadcastMessage("");
      alert(`Broadcast notification sent successfully to ${broadcastTarget === 'all' ? 'all home cells' : 'the selected home cell'}!`);
    }, 1500);
  };

  // Filter lists
  const filteredCells = selectedBranch === "All" 
    ? cells 
    : cells.filter((c) => {
        const targetStr = selectedBranch.toLowerCase().replace(" branch", "").replace(" (hq)", "").trim();
        const cellStr = c.branchName.toLowerCase().replace(" branch", "").replace(" (hq)", "").trim();
        return cellStr.includes(targetStr) || targetStr.includes(cellStr);
      });

  // Calculate metrics based on current filtered cell network
  const totalActive = filteredCells.length;
  const avgMembers = totalActive > 0 
    ? Math.round(filteredCells.reduce((sum, c) => sum + c.membersCount, 0) / totalActive)
    : 0;
  const readyToSplit = filteredCells.filter(c => c.membersCount >= 20).length;
  const growthTrend = totalActive > 0 ? 5.2 : 0;

  return (
    <div className="flex flex-col gap-6 md:gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white mb-1">
            Home Cell Intelligence Hub
          </h1>
          <p className="text-lilac/80 font-medium">Community Discipleship & Growth Dynamics</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Branch filter selection (accessible for Global Admins, preset for local coords/admins) */}
          {isGlobalAdmin ? (
            <div className="relative">
              <select
                className="appearance-none bg-white/5 border border-royal-purple/30 text-white rounded-lg pl-4 pr-10 py-2.5 text-sm cursor-pointer outline-none hover:bg-white/10 transition-colors"
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
              >
                <option value="All" className="bg-[#120524] text-white">All Branches</option>
                <option value="Uyo (HQ)" className="bg-[#120524] text-white">Uyo (HQ)</option>
                <option value="Calabar" className="bg-[#120524] text-white">Calabar</option>
                <option value="Port Harcourt" className="bg-[#120524] text-white">Port Harcourt</option>
                <option value="London" className="bg-[#120524] text-white">London</option>
              </select>
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-[10px] text-white/50">▼</div>
            </div>
          ) : (
            <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-royal-purple/20 border border-royal-purple/30 text-white flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              Branch: {userBranch}
            </span>
          )}

          {isCoordinator && (
            <Link 
              to="/approvals"
              className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-bold px-4 py-2.5 rounded-lg text-sm transition-all shadow-lg cursor-pointer"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Review Approvals</span>
            </Link>
          )}

          {hasManagementPrivilege && (
            <button 
              onClick={() => {
                setNewCell(prev => ({ ...prev, branchName: userBranch }));
                setShowAddModal(true);
              }}
              className="flex items-center gap-2 bg-royal-purple hover:bg-royal-purple/95 text-white font-bold px-4 py-2.5 rounded-lg text-sm transition-all shadow-lg shadow-royal-purple/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Plant New Cell</span>
            </button>
          )}
        </div>
      </header>

      {/* Broadcast Message Modal Configuration */}
      {isCoordinator && (
        <div className="flex gap-3 justify-end items-center mb-[-0.5rem]">
           <button onClick={() => setShowBroadcastModal(true)} 
             className="px-4 py-2 mt-2 bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 hover:text-indigo-200 border border-indigo-500/30 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2">
             <Mail className="w-4 h-4" />
             Broadcast Message
           </button>
        </div>
      )}

      {/* Oversight Dashboard Role Banner */}
      {isCoordinator && (
        <GlassCard className="p-5 border border-royal-purple/30 bg-gradient-to-r from-royal-purple/10 to-transparent flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex gap-3.5">
            <div className="p-3 bg-royal-purple/20 rounded-xl border border-royal-purple/30 text-white shrink-0">
               <Users className="w-6 h-6 text-[#B193FB]" />
            </div>
            <div>
               <h4 className="text-white font-bold text-base">Eminent Oversight Panel</h4>
               <p className="text-lilac/70 text-xs leading-relaxed max-w-xl mt-1">
                 Welcome, <strong>{user?.name || "Coordinator"}</strong>! As the **Home Cell Coordinator** directly under the **{userBranch.replace(" Branch", "")} Branch**, you have spiritual and administrative oversight over all Home Cell Units in this locality.
               </p>
            </div>
          </div>
          <div className="text-[11px] font-sans font-semibold border border-[#B193FB]/20 uppercase tracking-widest px-3 py-1.5 rounded-lg bg-[#2D0B4E]/30 text-[#B193FB]">
             Home Cell Coordinator
          </div>
        </GlassCard>
      )}

      {/* Management-Only Overview */}
      {hasManagementPrivilege && (
        <>
          {/* Hero: Lifecycle Orb */}
          <section className="relative w-full h-[220px] bg-deep-violet/40 rounded-3xl border border-royal-purple/20 overflow-hidden flex items-center justify-center">
             <div className="absolute inset-0 bg-gradient-to-r from-royal-purple/5 to-transparent" />
             <div className="relative w-full h-full flex items-center justify-center">
                <div className="relative flex items-center justify-center">
                   {/* Center pulsing orb for Home cells */}
                   <div className="w-20 h-20 rounded-full bg-lilac/20 border-2 border-royal-purple shadow-[0_0_40px_rgba(120,81,169,0.5)] flex items-center justify-center z-10 anchor">
                       <Home className="w-7 h-7 text-white" />
                   </div>

                   {/* Orbiting smaller cells */}
                   <div className="absolute w-[240px] h-[240px] animate-[spin_18s_linear_infinite]">
                      <div className="w-3.5 h-3.5 rounded-full bg-emerald-400 absolute top-0 left-1/2 -ml-1.5 shadow-[0_0_15px_#34d399]" />
                      <div className="w-3.5 h-3.5 rounded-full bg-amber-400 absolute bottom-0 left-1/2 -ml-1.5 shadow-[0_0_15px_#fbbf24]" />
                      <div className="w-3.5 h-3.5 rounded-full bg-rose-400 absolute left-0 top-1/2 -mt-1.5 shadow-[0_0_15px_#fb7185]" />
                   </div>
                </div>

                <div className="absolute top-4 left-6">
                  <h2 className="text-xs font-bold text-white/90 tracking-wide uppercase">Cell Propagation Array</h2>
                </div>
             </div>
          </section>

          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard title="Branch Active Cells" value={String(totalActive)} trend={growthTrend} />
            <MetricCard title="Avg Cell Membership" value={String(avgMembers)} trend={1.2} />
            <MetricCard title="Cells Ready to Split" value={String(readyToSplit)} trend={0} />
            <MetricCard title="Discipleship Retention" value="78%" trend={-2.1} />
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
               <GlassCard className="flex flex-col gap-4 overflow-hidden p-0 max-h-[600px]">
                 <div className="p-6 border-b border-white/5 sticky top-0 bg-[#0B0118]/80 backdrop-blur-md z-10 flex justify-between items-center">
                   <div>
                     <h3 className="text-sm font-medium tracking-wide uppercase text-lilac">Active Home Cell Fellowships</h3>
                     <p className="text-[11px] text-lilac/50 mt-0.5">Showing {filteredCells.length} cells registered under {selectedBranch === "All" ? "Global network" : selectedBranch}</p>
                   </div>
                 </div>
                 
                 {filteredCells.length === 0 ? (
                   <div className="p-12 text-center text-lilac/50">
                     <Home className="w-12 h-12 mx-auto text-lilac/20 mb-3" />
                     <p className="font-bold text-sm">No Home Cells Registered</p>
                     <p className="text-xs mt-1">Get started by planning or planting a new home cell fellowship.</p>
                   </div>
                 ) : (
                   <div className="overflow-y-auto px-6 pb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                     {filteredCells.map((cell) => (
                       <div key={cell.id} className="p-4 rounded-xl bg-white/5 border border-white/10 flex flex-col gap-3 transition-colors hover:bg-white/10 group relative">
                         {hasManagementPrivilege && (
                           <button 
                             onClick={() => handleDeleteCell(cell.id)}
                             className="absolute top-3.5 right-3.5 p-1.5 rounded-lg bg-black/40 hover:bg-rose-500/20 text-white/40 hover:text-rose-400 hover:border hover:border-rose-500/10 transition-colors cursor-pointer"
                             title="De-register home cell"
                           >
                             <Trash2 className="w-3.5 h-3.5" />
                           </button>
                         )}

                         <div className="flex items-start gap-3">
                           <div className="p-2.5 rounded-lg bg-royal-purple/20 border border-royal-purple/30 shrink-0">
                             <MapPin className="w-5 h-5 text-emerald-400" />
                           </div>
                           <div className="flex flex-col pr-6">
                             <h4 className="text-white font-bold text-sm md:text-base leading-tight group-hover:text-amber-400 transition-colors">{cell.name}</h4>
                             <span className="text-[10px] text-lilac/60 font-semibold mt-1">Branch: {cell.branchName}</span>
                           </div>
                         </div>

                         {cell.hostAddress && (
                           <p className="text-xs text-lilac/70 italic px-0.5 leading-relaxed bg-black/15 p-2 rounded-lg border border-white/5">
                             Host Address: {cell.hostAddress}
                           </p>
                         )}

                         <div className="pt-3 mt-auto border-t border-white/5 flex items-start gap-2 text-sm text-lilac/80">
                           <Users className="w-4 h-4 mt-0.5 text-lilac/50 shrink-0" />
                           <div className="flex-1">
                              <div className="flex justify-between items-center mb-1">
                                 <span className="block text-xs uppercase tracking-wider text-lilac/50 font-semibold">Leaders / Host</span>
                                 <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold font-mono">
                                   {cell.membersCount} Members
                                 </span>
                              </div>
                              <span className="text-xs leading-relaxed text-slate-200">{cell.leaders}</span>
                           </div>
                         </div>
                       </div>
                     ))}
                   </div>
                 )}
               </GlassCard>
            </div>
            
            <div className="flex flex-col gap-4">
              <ReportingWidget unitType="SubBranch" />
              <h3 className="text-sm font-medium tracking-wide uppercase text-lilac mb-1">Cell Intelligence & Analytics</h3>
              
              <InsightCard 
                type="positive"
                content={`${readyToSplit} cells in the current list have reached or crossed the 20-member threshold. Direct them to prepare leadership candidates as the coordinators recommend.`}
              />
              <InsightCard 
                 type="warning"
                 content="Notice: Ensure all home cells submit their meeting consolidated reports every Wednesday before 6:00 PM."
              />
            </div>
          </section>
        </>
      )}

      {/* PLANT NEW HOME CELL MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#120524] rounded-2xl border border-royal-purple/40 shadow-2xl overflow-hidden font-sans relative flex flex-col gap-5 p-6 animate-in zoom-in-95 duration-200">
             <div className="flex justify-between items-center pb-3 border-b border-white/10">
               <h3 className="font-bold text-white text-base">Plant New Home Cell fellowship</h3>
               <button 
                 onClick={() => setShowAddModal(false)}
                 className="p-1 rounded-full text-white/50 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
               >
                 <X className="w-5 h-5" />
               </button>
             </div>

             <form onSubmit={handleAddCell} className="flex flex-col gap-4">
                <div className="space-y-1.5">
                   <label className="text-[11px] uppercase tracking-wider font-bold text-lilac/80">Cell Group Name</label>
                   <input 
                     type="text" 
                     placeholder="e.g. Aka Road Home Cell" 
                     required
                     className="w-full rounded-xl py-2.5 px-4 bg-black/45 border border-white/10 text-white text-sm focus:outline-none focus:border-royal-purple focus:ring-1 focus:ring-royal-purple"
                     value={newCell.name}
                     onChange={(e) => setNewCell({...newCell, name: e.target.value})}
                   />
                </div>

                <div className="space-y-1.5">
                   <label className="text-[11px] uppercase tracking-wider font-bold text-lilac/80">Assigned Leaders / Hosts</label>
                   <input 
                     type="text" 
                     placeholder="e.g. Mr. Wisdom Hillary" 
                     required
                     className="w-full rounded-xl py-2.5 px-4 bg-black/45 border border-white/10 text-white text-sm focus:outline-none focus:border-royal-purple focus:ring-1 focus:ring-royal-purple"
                     value={newCell.leaders}
                     onChange={(e) => setNewCell({...newCell, leaders: e.target.value})}
                   />
                </div>

                <div className="space-y-1.5">
                   <label className="text-[11px] uppercase tracking-wider font-bold text-lilac/80">Host Address / Venue</label>
                   <input 
                     type="text" 
                     placeholder="e.g. Suite 12, Aka Road, Uyo" 
                     className="w-full rounded-xl py-2.5 px-4 bg-black/45 border border-white/10 text-white text-sm focus:outline-none focus:border-royal-purple focus:ring-1 focus:ring-royal-purple"
                     value={newCell.hostAddress}
                     onChange={(e) => setNewCell({...newCell, hostAddress: e.target.value})}
                   />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                     <label className="text-[11px] uppercase tracking-wider font-bold text-lilac/80">Starting Members</label>
                     <input 
                       type="number" 
                       min="1"
                       className="w-full rounded-xl py-2.5 px-4 bg-black/45 border border-white/10 text-white text-sm focus:outline-none focus:border-royal-purple focus:ring-1 focus:ring-royal-purple"
                       value={newCell.membersCount}
                       onChange={(e) => setNewCell({...newCell, membersCount: Number(e.target.value)})}
                     />
                  </div>

                  <div className="space-y-1.5">
                     <label className="text-[11px] uppercase tracking-wider font-bold text-lilac/80">Branch Campus</label>
                     {isGlobalAdmin ? (
                       <select
                         className="w-full rounded-xl py-2.5 px-3 bg-black/45 border border-white/10 text-white text-sm focus:outline-none focus:border-royal-purple"
                         value={newCell.branchName}
                         onChange={(e) => setNewCell({...newCell, branchName: e.target.value})}
                       >
                         <option value="Uyo (HQ)">Uyo (HQ)</option>
                         <option value="Calabar">Calabar</option>
                         <option value="Port Harcourt">Port Harcourt</option>
                         <option value="London">London</option>
                       </select>
                     ) : (
                       <input 
                         type="text" 
                         disabled
                         className="w-full rounded-xl py-2.5 px-4 bg-white/5 border border-white/5 text-gray-400 text-sm cursor-not-allowed"
                         value={userBranch}
                       />
                     )}
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="mt-2 w-full bg-royal-purple hover:bg-royal-purple/95 text-white py-3 rounded-xl font-bold text-sm transition-all shadow-lg shadow-royal-purple/20 cursor-pointer"
                >
                  Confirm and Plant Cell
                </button>
             </form>
          </div>
        </div>
      )}

      {/* BROADCAST MODAL */}
      {showBroadcastModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#120524] border border-royal-purple/30 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-200">
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-royal-purple via-lilac to-royal-purple"></div>
             
             <div className="px-6 py-5 flex justify-between items-center border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
                    <Mail className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-white tracking-tight">Broadcast Message</h3>
                </div>
                <button 
                  onClick={() => setShowBroadcastModal(false)}
                  className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
             </div>

             <form onSubmit={handleBroadcastSubmit} className="p-6 flex flex-col gap-5">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                     <label className="text-[11px] uppercase tracking-wider font-bold text-lilac/80">Target Audience</label>
                     <select
                       className="w-full rounded-xl py-2.5 px-3 bg-black/45 border border-white/10 text-white text-sm focus:outline-none focus:border-royal-purple"
                       value={broadcastTarget}
                       onChange={(e) => setBroadcastTarget(e.target.value)}
                     >
                       <option value="all">All Home Cells in {userBranch}</option>
                       {filteredCells.map(cell => (
                          <option key={cell.id} value={cell.id}>{cell.name}</option>
                       ))}
                     </select>
                  </div>

                  <div className="space-y-1.5">
                     <label className="text-[11px] uppercase tracking-wider font-bold text-lilac/80">Message</label>
                     <textarea 
                       required
                       placeholder="Enter your message here..."
                       rows={4}
                       className="w-full rounded-xl py-3 px-4 bg-black/45 border border-white/10 text-white text-sm focus:outline-none focus:border-royal-purple focus:ring-1 focus:ring-royal-purple resize-none"
                       value={broadcastMessage}
                       onChange={(e) => setBroadcastMessage(e.target.value)}
                     />
                     <p className="text-[10px] text-white/40 mb-1">Messages will be sent via Email to the Home Cell Leaders.</p>
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={isSending || !broadcastMessage.trim()}
                  className="mt-2 w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 disabled:cursor-not-allowed text-white py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSending ? (
                     <div className="flex items-center gap-2">
                       <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                       <span>Sending...</span>
                     </div>
                  ) : (
                     <>
                       <Send className="w-4 h-4" />
                       <span>Send Broadcast</span>
                     </>
                  )}
                </button>
             </form>
          </div>
        </div>
      )}

      {user?.role === 'CELL_LEADER' && (
        <section className="w-full">
          <UnitMembersManager unitType="cell" />
        </section>
      )}

    </div>
  );
}
