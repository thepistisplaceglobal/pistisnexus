import { useState, useEffect, FormEvent } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Search, Mail, MessageSquare, Phone, Compass, UserCircle2, Plus, X } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

export function Directory() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedLeader, setSelectedLeader] = useState<any>(null);
  const [newLeader, setNewLeader] = useState({
    name: "",
    role: "Leader",
    group_name: "",
    branch: "",
    region: "",
    location: "",
    email: "",
    phone: ""
  });
  const user = useAppStore(state => state.user);
  const onlineUsers = useAppStore(state => state.onlineUsers);
  const leaders = useAppStore(state => state.leaders);
  const addLeader = useAppStore(state => state.addLeader);
  const fetchLeaders = useAppStore(state => state.fetchLeaders);
  
  useEffect(() => {
    fetchLeaders();
  }, [fetchLeaders]);

  const allowedLeaders = user?.role === "GLOBAL_ADMIN" 
    ? leaders 
    : leaders.filter(leader => user?.branchName && leader.branch.toLowerCase().includes(user.branchName.toLowerCase()));

  const filteredLeaders = allowedLeaders.filter(leader =>
    leader.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    leader.group_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    leader.branch.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddLeader = async (e: FormEvent) => {
    e.preventDefault();
    await addLeader({
      id: Date.now().toString(),
      ...newLeader,
      branch: user?.role === "GLOBAL_ADMIN" ? newLeader.branch : (user?.branchName || newLeader.branch),
      active: true
    });
    setIsAddModalOpen(false);
    setNewLeader({
      name: "", role: "Leader", group_name: "", branch: "", region: "", location: "", email: "", phone: ""
    });
  };

  return (
    <div className="flex flex-col gap-6 md:gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700 relative">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div className="flex-1">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white mb-1">
            Interest Group Directory
          </h1>
          <p className="text-lilac/80 font-medium">Connect with Group Leaders across branches</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-64 md:w-72">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-lilac/50" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-white/10 rounded-xl leading-5 bg-white/5 text-white placeholder-lilac/50 focus:outline-none focus:ring-1 focus:ring-royal-purple/50 focus:border-royal-purple/50 sm:text-sm transition-colors"
              placeholder="Search by name, group, or branch..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {(user?.role === "GLOBAL_ADMIN" || user?.role === "BRANCH_ADMIN") && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center justify-center gap-2 bg-royal-purple hover:bg-royal-purple/80 text-white py-2 px-4 rounded-xl font-medium transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Leader
            </button>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredLeaders.map((leader) => (
          <GlassCard 
            key={leader.id} 
            className="flex flex-col gap-4 p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(120,81,169,0.3)] cursor-pointer"
            onClick={() => setSelectedLeader(leader)}
          >
            <div className="flex justify-between items-start">
               <div className="flex items-center gap-3">
                 <div className="relative">
                   <div className="w-12 h-12 rounded-full bg-gradient-to-br from-royal-purple to-deep-violet flex items-center justify-center border border-white/10 shrink-0">
                      <UserCircle2 className="w-7 h-7 text-white/90" />
                   </div>
                   {onlineUsers.has(leader.email) && (
                     <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-[#1a0b2e] rounded-full z-10" title="Online"></span>
                   )}
                 </div>
                 <div className="flex flex-col overflow-hidden">
                   <h3 className="text-base font-bold text-white truncate" title={leader.name}>{leader.name}</h3>
                   <span className="text-xs text-lilac/90 font-medium truncate" title={leader.group_name}>{leader.group_name}</span>
                 </div>
               </div>
            </div>
            
            <div className="flex flex-col gap-2 mt-2">
               <div className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
                 <span className="text-white/50">Branch</span>
                 <span className="text-white text-right">{leader.branch}</span>
               </div>
               {user?.role === "GLOBAL_ADMIN" && (
                 <>
                   <div className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
                     <span className="text-white/50">Region</span>
                     <span className="text-white text-right font-medium">{leader.region}</span>
                   </div>
                   <div className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
                     <span className="text-white/50">Location</span>
                     <span className="text-white text-right font-medium">{leader.location}</span>
                   </div>
                 </>
               )}
               <div className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
                 <span className="text-white/50">Role</span>
                 <span className="text-emerald-400 text-right font-medium">{leader.role}</span>
               </div>
            </div>

            <div className="mt-auto pt-2 grid grid-cols-2 gap-3">
              <a href={`mailto:${leader.email}`} onClick={(e) => e.stopPropagation()} className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-medium transition-colors">
                <Mail className="w-3.5 h-3.5" /> Email
              </a>
              <a href={`tel:${leader.phone}`} onClick={(e) => e.stopPropagation()} className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-medium transition-colors">
                <MessageSquare className="w-3.5 h-3.5" /> Message
              </a>
            </div>
          </GlassCard>
        ))}
        {filteredLeaders.length === 0 && (
          <div className="col-span-1 md:col-span-2 lg:col-span-3 xl:col-span-4 flex flex-col items-center justify-center py-20 text-lilac/60">
            <Compass className="w-12 h-12 mb-4 opacity-50" />
            <p>No leaders found matching your search term.</p>
          </div>
        )}
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#070112]/95 backdrop-blur-lg animate-in fade-in duration-300">
          <div className="w-full max-w-lg p-6 relative max-h-[90vh] overflow-y-auto bg-[#130626] border border-royal-purple/60 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] animate-in zoom-in-95 duration-300">
            <button 
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
            <h2 className="text-xl font-bold text-white mb-6">Add New Leader</h2>
            <form onSubmit={handleAddLeader} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-lilac">Name</label>
                <input required value={newLeader.name} onChange={e => setNewLeader({...newLeader, name: e.target.value})} className="bg-[#1c0f33] border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-royal-purple" placeholder="Full Name" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-lilac">Group</label>
                <input required value={newLeader.group_name} onChange={e => setNewLeader({...newLeader, group_name: e.target.value})} className="bg-[#1c0f33] border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-royal-purple" placeholder="e.g. TECH Mountain" />
              </div>
              {user?.role === "GLOBAL_ADMIN" ? (
                <>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-lilac">Branch</label>
                    <input required value={newLeader.branch} onChange={e => setNewLeader({...newLeader, branch: e.target.value})} className="bg-[#1c0f33] border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-royal-purple" placeholder="Branch Name" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-lilac">Region</label>
                    <input value={newLeader.region} onChange={e => setNewLeader({...newLeader, region: e.target.value})} className="bg-[#1c0f33] border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-royal-purple" placeholder="e.g. South-South" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-lilac">Location</label>
                    <input value={newLeader.location} onChange={e => setNewLeader({...newLeader, location: e.target.value})} className="bg-[#1c0f33] border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-royal-purple" placeholder="e.g. Akwa Ibom" />
                  </div>
                </>
              ) : (
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-lilac">Branch</label>
                  <input disabled value={user?.branchName || ""} className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white/50 outline-none" />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[#c7a4ff] text-sm font-medium">Email</label>
                  <input type="email" required value={newLeader.email} onChange={e => setNewLeader({...newLeader, email: e.target.value})} className="bg-[#1c0f33] border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-royal-purple" placeholder="Email" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[#c7a4ff] text-sm font-medium">Phone</label>
                  <input required value={newLeader.phone} onChange={e => setNewLeader({...newLeader, phone: e.target.value})} className="bg-[#1c0f33] border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-royal-purple" placeholder="+234..." />
                </div>
              </div>
              <button type="submit" className="mt-4 w-full bg-royal-purple hover:bg-royal-purple/80 text-white font-bold py-3 rounded-lg transition-colors">
                Save Leader
              </button>
            </form>
          </div>
        </div>
      )}

      {selectedLeader && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#070112]/95 backdrop-blur-lg animate-in fade-in duration-300">
          <div className="w-full max-w-lg p-6 relative max-h-[90vh] overflow-y-auto bg-[#130626]/80 backdrop-blur-3xl border border-royal-purple/30 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] animate-in zoom-in-95 duration-300">
            <button 
              onClick={() => setSelectedLeader(null)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
            
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-royal-purple to-deep-violet flex items-center justify-center border border-white/10 shrink-0">
                <UserCircle2 className="w-10 h-10 text-white/90" />
              </div>
              <div className="flex flex-col">
                <h2 className="text-xl font-bold text-white">{selectedLeader.name}</h2>
                <span className="text-sm text-lilac/90 font-medium">{selectedLeader.group_name} Leader</span>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-lilac uppercase tracking-wider mb-3">Contact Information</h3>
                <div className="flex flex-col gap-3 bg-white/5 p-4 rounded-xl border border-white/5">
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm text-white">{selectedLeader.email}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm text-white">{selectedLeader.phone}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-lilac uppercase tracking-wider mb-3">Service Details</h3>
                <div className="flex flex-col gap-2 bg-white/5 p-4 rounded-xl border border-white/5">
                  <div className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
                    <span className="text-white/50">Branch</span>
                    <span className="text-white text-right">{selectedLeader.branch}</span>
                  </div>
                  {user?.role === "GLOBAL_ADMIN" && (
                    <>
                      <div className="flex justify-between items-center text-sm border-b border-white/5 pb-2 mt-2">
                        <span className="text-white/50">Region</span>
                        <span className="text-white text-right font-medium">{selectedLeader.region}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm border-b border-white/5 pb-2 mt-2">
                        <span className="text-white/50">Location</span>
                        <span className="text-white text-right font-medium">{selectedLeader.location}</span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between items-center text-sm mt-2">
                    <span className="text-white/50">Current Role</span>
                    <span className="text-emerald-400 text-right font-medium">{selectedLeader.role}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-lilac uppercase tracking-wider mb-3">Recent Performance (Mock)</h3>
                <div className="flex flex-col gap-2 bg-white/5 p-4 rounded-xl border border-white/5">
                  <div className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
                    <span className="text-white/50">Group Attendance (Last Month)</span>
                    <span className="text-white text-right font-medium">Avg. 45 Members</span>
                  </div>
                  <div className="flex justify-between items-center text-sm mt-2">
                    <span className="text-white/50">Report Submission Rate</span>
                    <span className="text-emerald-400 text-right font-medium">98% On-time</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <a href={`mailto:${selectedLeader.email}`} className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-royal-purple hover:bg-royal-purple/80 text-white text-sm font-bold transition-colors">
                  <Mail className="w-4 h-4" /> Send Email
                </a>
                <a href={`tel:${selectedLeader.phone}`} className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-white text-sm font-bold transition-colors">
                  <MessageSquare className="w-4 h-4" /> Message
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
