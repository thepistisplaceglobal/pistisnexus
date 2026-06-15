import { GlassCard } from "@/components/ui/GlassCard";
import { ShieldCheck, Users, Mail, Lock, User as UserIcon, Globe, MapPin, Building, CheckCircle2, Eye, EyeOff, KeyRound, ArrowRight, ArrowLeft } from "lucide-react";
import { useAppStore, Role } from "@/store/useAppStore";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

export function Login() {
  const login = useAppStore((state) => state.login);
  const theme = useAppStore((state) => state.theme);
  const navigate = useNavigate();
  const [view, setView] = useState<"LOGIN_SELECT" | "REGISTER">("LOGIN_SELECT");

  const [step, setStep] = useState(1);
  const [regData, setRegData] = useState({
    role: "" as Role | "",
    country: "",
    branchName: "",
    unitName: "",
    fullName: "",
    email: "",
    password: ""
  });
  
  const [loginData, setLoginData] = useState({
    email: "",
    password: ""
  });
  
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");

    // Developer bypass for initial Global Admin
    if (loginData.email === "pistisglobal@gmail.com" && loginData.password === "Pistis%$0000") {
      login({
        id: "global-admin-master",
        email: "pistisglobal@gmail.com",
        name: "HQ Global Admin",
        role: "GLOBAL_ADMIN",
        branchName: "HQ",
      });
      navigate("/");
      return;
    }
    
    // Auth using Supabase
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: loginData.email,
      password: loginData.password,
    });
    
    if (authError || !authData.user) {
      setErrorMsg(authError?.message || "Invalid email or password. Please verify your credentials.");
      setIsLoading(false);
      return;
    }
    
    // Fetch profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();
      
    if (profileError || !profile) {
      setErrorMsg("Leader profile not found. Please contact the church administration team.");
      setIsLoading(false);
      return;
    }
    
    if (profile.status === 'PENDING') {
      setErrorMsg("Your leader profile is awaiting administrative approval.");
      setIsLoading(false);
      return;
    }
    
    if (profile.status === 'REJECTED') {
      setErrorMsg("Your registration was not approved. Please speak with your branch administrator.");
      setIsLoading(false);
      return;
    }
    
    login({
      id: profile.id,
      email: authData.user.email,
      name: profile.full_name,
      role: profile.role as Role,
      branchName: profile.branch_name,
      deptName: profile.role === 'DEPT_LEADER' ? profile.unit_name : undefined,
      groupName: profile.role !== 'DEPT_LEADER' && profile.role !== 'GLOBAL_ADMIN' && profile.role !== 'BRANCH_ADMIN' ? profile.unit_name : undefined,
      avatar_url: profile.avatar_url,
    });
    
    navigate("/");
  };

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => {
    setErrorMsg("");
    setStep(s => s - 1);
  };

  const submitRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");
    
    if (regData.role === 'GLOBAL_ADMIN') {
      const { count, error: countError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'GLOBAL_ADMIN');
        
      if (!countError && count !== null && count >= 5) {
        setErrorMsg("The limit for Global Administrators has been reached. Please contact church leadership.");
        setIsLoading(false);
        return;
      }
    } else if (regData.role === 'BRANCH_ADMIN') {
      const { count, error: countError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'BRANCH_ADMIN')
        .eq('branch_name', regData.branchName);
        
      if (!countError && count !== null && count >= 2) {
        setErrorMsg(`The administrator assignment limit for ${regData.branchName} has been reached.`);
        setIsLoading(false);
        return;
      }
    } else if (['DEPT_LEADER', 'CELL_LEADER', 'INTEREST_GROUP_LEADER'].includes(regData.role)) {
      const { count, error: countError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', regData.role)
        .eq('branch_name', regData.branchName)
        .eq('unit_name', regData.unitName);

      if (!countError && count !== null && count >= 2) {
        setErrorMsg(`The registration limit for unit '${regData.unitName}' has been reached.`);
        setIsLoading(false);
        return;
      }
    }

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: regData.email,
      password: regData.password,
      options: {
        data: {
          full_name: regData.fullName,
          role: regData.role,
          country: regData.country,
          branch_name: regData.branchName,
          unit_name: regData.unitName,
        }
      }
    });
    
    if (signUpError || !signUpData.user) {
      const msg = signUpError?.message || "Error creating account.";
      if (msg.toLowerCase().includes("rate limit") || msg.toLowerCase().includes("rate_limit")) {
        setErrorMsg("Notice: Too many attempts in a short period. Please wait a minute or two before submitting again, or ask a Global Admin to verify email settings in the database.");
      } else {
        setErrorMsg(msg);
      }
      setIsLoading(false);
      return;
    }
    
    const profileObj = {
      id: signUpData.user.id,
      email: regData.email,
      full_name: regData.fullName,
      role: regData.role,
      country: regData.country,
      branch_name: regData.branchName,
      unit_name: regData.unitName,
      status: 'PENDING' as const
    };

    // Save to local cache of profiles for robust persistence in bypass mode
    try {
      const localP = localStorage.getItem("local_profiles");
      const list = localP ? JSON.parse(localP) : [];
      const filteredList = list.filter((p: any) => p.id !== signUpData.user.id && p.email !== regData.email);
      localStorage.setItem("local_profiles", JSON.stringify([...filteredList, { ...profileObj, created_at: new Date().toISOString() }]));
    } catch (e) {
      console.error("Local storage error:", e);
    }

    const { error: profileError } = await supabase.from('profiles').insert([profileObj]);
    
    if (profileError) {
      const isDuplicate = profileError.code === '23505' || 
                          profileError.message?.toLowerCase().includes('duplicate') || 
                          profileError.message?.toLowerCase().includes('already exists');
                          
      if (isDuplicate) {
        const updateObj = {
          email: regData.email,
          full_name: regData.fullName,
          role: regData.role,
          country: regData.country,
          branch_name: regData.branchName,
          unit_name: regData.unitName,
          status: 'PENDING' as const
        };

        try {
          const localP = localStorage.getItem("local_profiles");
          const list = localP ? JSON.parse(localP) : [];
          const updatedList = list.map((p: any) => p.id === signUpData.user.id ? { ...p, ...updateObj } : p);
          if (!list.some((p: any) => p.id === signUpData.user.id)) {
            updatedList.push({ id: signUpData.user.id, ...updateObj, created_at: new Date().toISOString() });
          }
          localStorage.setItem("local_profiles", JSON.stringify(updatedList));
        } catch (e) {
          console.error("Local storage error:", e);
        }

        const { error: updateError } = await supabase
          .from('profiles')
          .update(updateObj)
          .eq('id', signUpData.user.id);
          
        if (updateError) {
          console.error("Profile update error during fallback:", updateError);
          setErrorMsg(`Setup failed: ${updateError.message}. Please contact administration.`);
          setIsLoading(false);
          return;
        }
      } else {
        console.warn("Profile creation error:", profileError);
        const { data: existingProfile } = await supabase.from('profiles').select('id').eq('id', signUpData.user.id).single();
        if (!existingProfile) {
          setErrorMsg(`${profileError.message}. Please contact church administration.`);
          setIsLoading(false);
          return;
        }
      }
    }

    setIsSubmitted(true);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#070110]">
      {/* Visual background ambient layers */}
      <div className="fixed -top-40 -left-40 w-[600px] h-[600px] bg-[#6320EE]/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="fixed -bottom-40 -right-40 w-[600px] h-[600px] bg-[#8A2BE2]/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.015)_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none opacity-40" />

      <div className="w-full max-w-md flex flex-col gap-6 z-10 animate-in fade-in slide-in-from-bottom-6 duration-1000">
        <div className="text-center flex flex-col items-center">
          <div className="relative mb-3 group">
            <div className="absolute inset-0 rounded-full bg-royal-purple/30 blur-xl group-hover:bg-royal-purple/45 transition-all duration-500 scale-95" />
            <img 
              src={theme === "light" ? "/logo_purple.png" : "/logo.png"} 
              alt="The Pistis Place Logo" 
              className="w-20 h-20 relative object-contain drop-shadow-[0_0_20px_rgba(120,81,169,0.5)] transform transition-transform group-hover:scale-105 duration-500" 
            />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-1 font-sans">
            Pistis Nexus
          </h1>
          <p className="text-xs font-semibold text-[#B193FB] uppercase tracking-widest max-w-xs mx-auto">
            {view === "LOGIN_SELECT" ? "The Pistis Place Administrative App" : "Leader Registration Request"}
          </p>
        </div>

        {view === "LOGIN_SELECT" ? (
          <div className="flex flex-col gap-4">
            <GlassCard className="p-7 border-white/5 bg-[#120524]/50 backdrop-blur-md shadow-2xl relative overflow-hidden">
               {/* Elegant top color band */}
               <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-royal-purple via-transparent to-emerald-500 opacity-60" />

               <div className="flex items-center justify-between mb-5 select-none">
                 <h3 className="text-white font-bold text-sm flex items-center gap-2">
                   <KeyRound className="w-4 h-4 text-royal-purple" />
                   Sign In to Your Account
                 </h3>
                 <span className="text-[10px] bg-white/5 border border-white/10 text-lilac/75 px-2.5 py-1 rounded-full font-sans font-semibold">
                   Ministry Admin Portal
                 </span>
               </div>

               <form onSubmit={handleLoginSubmit} className="flex flex-col gap-4">
                 {errorMsg && (
                   <div className="bg-rose-500/10 border border-rose-500/20 text-rose-300 p-3.5 rounded-xl text-xs text-center font-medium leading-relaxed">
                      {errorMsg}
                   </div>
                 )}
                 
                 <div className="space-y-1.5">
                    <label className="text-[11px] uppercase tracking-wider text-lilac/60 font-bold ml-1">Email Address</label>
                    <div className="relative group/input">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within/input:text-[#B193FB] transition-colors" />
                      <input 
                        type="email" 
                        placeholder="e.g. name@pistisnexus.com" 
                        required 
                        className="w-full bg-black/45 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white text-sm focus:outline-none focus:border-royal-purple focus:ring-1 focus:ring-royal-purple/40 placeholder:text-white/20 transition-all font-sans" 
                        value={loginData.email} 
                        onChange={(e) => setLoginData({...loginData, email: e.target.value})} 
                      />
                    </div>
                 </div>
                 
                 <div className="space-y-1.5">
                    <label className="text-[11px] uppercase tracking-wider text-lilac/60 font-bold ml-1">Password</label>
                    <div className="relative group/input">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within/input:text-[#B193FB] transition-colors" />
                      <input 
                        type={showLoginPassword ? "text" : "password"} 
                        placeholder="••••••••••••" 
                        required 
                        className="w-full bg-black/45 border border-white/10 rounded-xl py-3 pl-11 pr-11 text-white text-sm focus:outline-none focus:border-royal-purple focus:ring-1 focus:ring-royal-purple/40 placeholder:text-white/20 transition-all font-sans" 
                        value={loginData.password} 
                        onChange={(e) => setLoginData({...loginData, password: e.target.value})} 
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowLoginPassword(!showLoginPassword)} 
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors cursor-pointer"
                      >
                        {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                 </div>

                 <button 
                   type="submit" 
                   disabled={isLoading} 
                   className="mt-3 w-full flex justify-center items-center gap-2 bg-royal-purple hover:bg-royal-purple/95 active:scale-[0.98] text-white px-5 py-3 rounded-xl font-bold text-sm disabled:opacity-50 transition-all cursor-pointer shadow-lg shadow-royal-purple/20"
                 >
                    {isLoading ? "Verifying details..." : "Sign In"}
                 </button>
               </form>

               {/* Access branding footer */}
               <div className="mt-5 pt-4 border-t border-white/5 text-center text-xs">
                 <p className="text-lilac/45 text-[11px]">The Pistis Place Global</p>
               </div>
            </GlassCard>

            <div className="text-center mt-1">
              <p className="text-xs text-lilac/60">
                Are you a new Global or Branch Admin, Team Lead, Cell Leader or Interest Group Leader?{" "}
                <button 
                  onClick={() => { setView("REGISTER"); setStep(1); setErrorMsg(""); }}
                  className="text-emerald-400 hover:text-emerald-300 font-bold underline cursor-pointer ml-1 transition-colors"
                >
                  Register your account
                </button>
              </p>
            </div>
          </div>
        ) : (
          <GlassCard className="p-7 border-white/5 bg-[#120524]/50 backdrop-blur-md shadow-2xl relative overflow-hidden">
            {/* Elegant top color band */}
            <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-emerald-500 via-royal-purple to-[#4B0082] opacity-60" />

            {!isSubmitted ? (
               <form onSubmit={submitRegistration} className="flex flex-col gap-5">
                 {errorMsg && (
                   <div className="bg-rose-500/10 border border-rose-500/20 text-rose-300 p-3.5 rounded-xl text-xs text-center font-medium leading-relaxed">
                      {errorMsg}
                   </div>
                 )}

                 {/* Stepper progress indicator */}
                 <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-2 select-none">
                   <div className="flex items-center gap-1">
                     {[1, 2, 3].map((s) => (
                       <span 
                         key={s} 
                         className={`h-1.5 rounded-full transition-all duration-300 ${
                           step === s 
                             ? "w-8 bg-[#B193FB]" 
                             : step > s 
                             ? "w-2.5 bg-emerald-400" 
                             : "w-1.5 bg-white/10"
                         }`} 
                       />
                     ))}
                   </div>
                   <span className="text-[10px] font-bold text-lilac uppercase tracking-widest bg-white/5 px-2.5 py-1 rounded-md">
                     Step {step} of 3
                   </span>
                 </div>

                 {/* STEP 1: ROLE SELECTION */}
                 {step === 1 && (
                   <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                     <div>
                       <h3 className="text-white font-bold text-base">Select Your Ministry Role</h3>
                       <p className="text-[11px] text-lilac/60 mt-0.5">Please choose the option that matches your official ministry assignment.</p>
                     </div>

                     <div className="flex flex-col gap-2.5 max-h-[320px] overflow-y-auto pr-1">
                        {[
                          { key: 'GLOBAL_ADMIN', name: 'Global Administrator', desc: 'Ministry-wide coordination, master settings, leader approvals, and HQ global oversight. (Max 5 Global Admins)' },
                          { key: 'BRANCH_ADMIN', name: 'Branch Administrator', desc: 'Coordinate branch activities, consolidate reports, and update local branch feeds. (Max 2 per Branch)' },
                          { key: 'DEPT_LEADER', name: 'Departmental Leader', desc: 'Coordinate department activities and submit weekly departmental reports.' },
                          { key: 'CELL_LEADER', name: 'Cell Group Leader', desc: 'Coordinate weekly cell meetings and submit home fellowship reports.' },
                          { key: 'INTEREST_GROUP_LEADER', name: 'Interest Group Leader', desc: 'Organize community outreaches and report on group activities.' }
                        ].map((item) => (
                           <label 
                             key={item.key} 
                             className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                               regData.role === item.key 
                                 ? 'bg-royal-purple/20 border-royal-purple/50 shadow-md shadow-royal-purple/5' 
                                 : 'bg-black/30 border-white/5 hover:bg-white/5 hover:border-white/10'
                             }`}
                           >
                             <input 
                               type="radio" 
                               name="role" 
                               value={item.key} 
                               checked={regData.role === item.key} 
                               onChange={(e) => setRegData({...regData, role: e.target.value as Role})} 
                               className="mt-1 text-royal-purple focus:ring-royal-purple/40 bg-transparent border-white/20 cursor-pointer text-royal-purple" 
                             />
                             <div className="flex-1 ml-0.5">
                               <p className="text-white/95 font-bold text-xs tracking-wide">{item.name}</p>
                               <span className="block text-[10px] text-lilac/60 leading-relaxed mt-0.5">{item.desc}</span>
                             </div>
                           </label>
                        ))}
                     </div>
                     <div className="flex justify-between items-center mt-5 pt-3 border-t border-white/5">
                        <button 
                          type="button" 
                          onClick={() => { setView("LOGIN_SELECT"); setErrorMsg(""); }} 
                          className="text-xs text-lavender hover:text-white uppercase tracking-wider font-bold cursor-pointer transition-colors"
                        >
                          Cancel
                        </button>
                        <button 
                          type="button" 
                          onClick={nextStep} 
                          disabled={!regData.role} 
                          className="flex items-center gap-1.5 bg-royal-purple hover:bg-royal-purple/95 active:scale-95 text-white p-2.5 px-4 rounded-xl font-bold text-xs disabled:opacity-50 transition-all cursor-pointer font-sans"
                        >
                          Continue <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                     </div>
                   </div>
                 )}

                 {/* STEP 2: LOCATION & UNIT SPECIFICS */}
                 {step === 2 && (
                   <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                     <div>
                       <h3 className="text-white font-bold text-base">Ministry Location & Department</h3>
                       <p className="text-[11px] text-lilac/60 mt-0.5">Please indicate where you serve in The Pistis Place.</p>
                     </div>

                     {regData.role !== 'GLOBAL_ADMIN' && (
                        <>
                          <div className="space-y-1">
                            <label className="text-[11px] text-lilac/70 uppercase tracking-wider font-bold ml-1">Country</label>
                            <div className="relative">
                              <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
                              <select 
                                className="w-full bg-black/45 border border-white/10 rounded-xl py-3 pl-10 pr-10 text-white text-sm focus:outline-none focus:border-royal-purple focus:ring-1 focus:ring-royal-purple/40 appearance-none cursor-pointer" 
                                value={regData.country} 
                                onChange={(e) => setRegData({...regData, country: e.target.value})}
                              >
                                <option value="" disabled className="bg-[#120524]">Select Country</option>
                                <option value="Nigeria" className="bg-[#120524]">Nigeria</option>
                                <option value="United Kingdom" className="bg-[#120524]">United Kingdom</option>
                                <option value="United States" className="bg-[#120524]">United States</option>
                                <option value="Canada" className="bg-[#120524]">Canada</option>
                              </select>
                              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-white/40 text-[10px]">▼</div>
                            </div>
                          </div>
                          
                          <div className="space-y-1">
                            <label className="text-[11px] text-lilac/70 uppercase tracking-wider font-bold ml-1">Branch Campus</label>
                            <div className="relative">
                              <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
                              <select 
                                className="w-full bg-black/45 border border-white/10 rounded-xl py-3 pl-10 pr-10 text-white text-sm focus:outline-none focus:border-royal-purple focus:ring-1 focus:ring-royal-purple/40 appearance-none cursor-pointer" 
                                value={regData.branchName} 
                                onChange={(e) => setRegData({...regData, branchName: e.target.value})}
                              >
                                <option value="" disabled className="bg-[#120524]">Select Branch</option>
                                <option value="Uyo (HQ)" className="bg-[#120524]">Uyo (HQ)</option>
                                <option value="Calabar" className="bg-[#120524]">Calabar</option>
                                <option value="Port Harcourt" className="bg-[#120524]">Port Harcourt</option>
                                <option value="London" className="bg-[#120524]">London</option>
                              </select>
                              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-white/40 text-[10px]">▼</div>
                            </div>
                          </div>
                        </>
                     )}

                     {regData.role === 'GLOBAL_ADMIN' && (
                       <GlassCard className="p-4 border-amber-500/20 bg-amber-500/5 text-amber-200 text-xs flex gap-2.5 leading-relaxed">
                         <ShieldCheck className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
                         <span>
                           <strong>Global Administrator role selected.</strong> Users in this role oversee administration across all Church Expressions/Branches. Your request will require manual approval from HQ leadership. No Church Expressions/Branches designation is needed.
                         </span>
                       </GlassCard>
                     )}

                     {regData.role === 'DEPT_LEADER' && (
                          <div className="space-y-1">
                            <label className="text-[11px] text-lilac/70 uppercase tracking-wider font-bold ml-1">Your Department</label>
                            <div className="relative">
                              <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
                              <select 
                                className="w-full bg-black/45 border border-white/10 rounded-xl py-3 pl-10 pr-10 text-white text-sm focus:outline-none focus:border-royal-purple focus:ring-1 focus:ring-royal-purple/40 appearance-none cursor-pointer"
                                value={regData.unitName}
                                onChange={(e) => setRegData({...regData, unitName: e.target.value})}
                              >
                                <option value="" disabled className="bg-[#120524]">Select Department</option>
                                <option value="Media" className="bg-[#120524]">Media</option>
                                <option value="The Living Portals (Choir)" className="bg-[#120524]">The Living Portals (Choir)</option>
                                <option value="Technical" className="bg-[#120524]">Technical</option>
                                <option value="Ushering" className="bg-[#120524]">Ushering</option>
                                <option value="Pastoral Team / Greeters" className="bg-[#120524]">Pastoral Team / Greeters</option>
                                <option value="Evangelism & Missions" className="bg-[#120524]">Evangelism & Missions</option>
                                <option value="Welfare" className="bg-[#120524]">Welfare</option>
                                <option value="Children’s Church" className="bg-[#120524]">Children’s Church</option>
                                <option value="Teens Church" className="bg-[#120524]">Teens Church</option>
                                <option value="Intercessory" className="bg-[#120524]">Intercessory</option>
                                <option value="Protocol" className="bg-[#120524]">Protocol</option>
                                <option value="Follow-up" className="bg-[#120524]">Follow-up</option>
                              </select>
                              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-white/40 text-[10px]">▼</div>
                            </div>
                          </div>
                       )}

                       {['CELL_LEADER', 'INTEREST_GROUP_LEADER'].includes(regData.role) && (
                         <div className="space-y-1">
                           <label className="text-[11px] text-lilac/70 uppercase tracking-wider font-bold ml-1">Specific Unit, Cell, or Group Name</label>
                           <div className="relative">
                             <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
                             <input 
                               type="text" 
                               placeholder={`e.g. Hope Center, Teens Fellowship B`} 
                               className="w-full bg-black/45 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white text-sm focus:outline-none focus:border-royal-purple focus:ring-1 focus:ring-royal-purple/40 placeholder:text-white/20"
                               value={regData.unitName}
                               onChange={(e) => setRegData({...regData, unitName: e.target.value})}
                             />
                           </div>
                         </div>
                      )}

                      <div className="flex justify-between items-center mt-5 pt-3 border-t border-white/5">
                        <button 
                          type="button" 
                          onClick={prevStep} 
                          className="flex items-center gap-1 text-xs text-lavender hover:text-white uppercase tracking-wider font-bold cursor-pointer transition-colors"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" /> Back
                        </button>
                        <button 
                          type="button" 
                          onClick={nextStep} 
                          disabled={regData.role !== 'GLOBAL_ADMIN' && (!regData.country || !regData.branchName || (['DEPT_LEADER', 'CELL_LEADER', 'INTEREST_GROUP_LEADER'].includes(regData.role) && !regData.unitName))}
                          className="flex items-center gap-1.5 bg-royal-purple hover:bg-royal-purple/95 active:scale-95 text-white p-2.5 px-4 rounded-xl font-bold text-xs disabled:opacity-50 transition-all cursor-pointer font-sans"
                        >
                          Continue <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                   </div>
                 )}

                 {/* STEP 3: ACCOUNT IDENTIFICATION */}
                 {step === 3 && (
                   <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300 font-sans">
                     <div>
                       <h3 className="text-white font-bold text-base">Account Details</h3>
                       <p className="text-[11px] text-lilac/60 mt-0.5">Enter your contact details and set up a secure access password.</p>
                     </div>
                     
                     <div className="space-y-1">
                        <label className="text-[11px] text-lilac/70 uppercase tracking-wider font-bold ml-1">Full Name</label>
                        <div className="relative">
                          <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                          <input 
                            type="text" 
                            placeholder="e.g. Samuel Adebayo" 
                            required 
                            className="w-full bg-black/45 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white text-sm focus:outline-none focus:border-royal-purple focus:ring-1 focus:ring-royal-purple/40 placeholder:text-white/20" 
                            value={regData.fullName} 
                            onChange={(e) => setRegData({...regData, fullName: e.target.value})} 
                          />
                        </div>
                     </div>
                     <div className="space-y-1">
                        <label className="text-[11px] text-lilac/70 uppercase tracking-wider font-bold ml-1">Email Address</label>
                        <div className="relative">
                          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                          <input 
                            type="email" 
                            placeholder="e.g. samuel@domain.com" 
                            required 
                            className="w-full bg-black/45 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white text-sm focus:outline-none focus:border-royal-purple focus:ring-1 focus:ring-royal-purple/40 placeholder:text-white/20" 
                            value={regData.email} 
                            onChange={(e) => setRegData({...regData, email: e.target.value})} 
                          />
                        </div>
                     </div>
                     <div className="space-y-1">
                        <label className="text-[11px] text-lilac/70 uppercase tracking-wider font-bold ml-1">Password</label>
                        <div className="relative">
                          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                          <input 
                            type={showRegPassword ? "text" : "password"} 
                            placeholder="Minimum 8 characters"
                            required 
                            className="w-full bg-black/45 border border-white/10 rounded-xl py-3 pl-10 pr-11 text-white text-sm focus:outline-none focus:border-royal-purple focus:ring-1 focus:ring-royal-purple/40 placeholder:text-white/20" 
                            value={regData.password} 
                            onChange={(e) => setRegData({...regData, password: e.target.value})} 
                          />
                          <button 
                            type="button" 
                            onClick={() => setShowRegPassword(!showRegPassword)} 
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors cursor-pointer"
                          >
                            {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                     </div>

                     <div className="flex justify-between items-center mt-5 pt-3 border-t border-white/5">
                        <button 
                          type="button" 
                          onClick={prevStep} 
                          className="flex items-center gap-1 text-xs text-lavender hover:text-white uppercase tracking-wider font-bold cursor-pointer transition-colors"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" /> Back
                        </button>
                        <button 
                          type="submit" 
                          disabled={isLoading} 
                          className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-[#0B0118] py-2.5 px-5 rounded-xl font-bold text-xs transition-all disabled:opacity-50 cursor-pointer shadow-lg shadow-emerald-500/10"
                        >
                          {isLoading ? "Submitting..." : "Submit Access Request"}
                        </button>
                     </div>
                   </div>
                 )}
               </form>
            ) : (
               <div className="flex flex-col items-center justify-center py-6 text-center animate-in fade-in zoom-in duration-500">
                  <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-5 animate-bounce">
                     <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                  </div>
                  <h3 className="text-white font-bold text-lg mb-1.5">Request Received Successfully</h3>
                  <p className="text-xs text-lilac/80 mb-6 leading-relaxed max-w-sm">
                    Your request to register as <strong className="text-emerald-400">{regData.role?.replace('_', ' ')?.replace('_', ' ')}</strong> 
                    {regData.branchName && ` for the ${regData.branchName} campus`} has been safe-logged.
                    <br/><br/>
                    {regData.role === 'GLOBAL_ADMIN' || regData.role === 'BRANCH_ADMIN' 
                      ? "HQ leadership will examine and activate your profile shortly." 
                      : `The local administration team for ${regData.branchName} will confirm and activate your leadership account.`}
                  </p>
                  <button 
                    onClick={() => {
                      setIsSubmitted(false);
                      setView("LOGIN_SELECT");
                      setStep(1);
                      setRegData({
                        role: "", country: "", branchName: "", unitName: "", fullName: "", email: "", password: ""
                      });
                    }} 
                    className="text-[11px] text-[#070110] bg-emerald-400 hover:bg-[#A3E635] px-6 py-2.5 rounded-lg uppercase tracking-widest font-extrabold transition-all cursor-pointer shadow-md shadow-emerald-500/10"
                  >
                    Return to Sign In
                  </button>
               </div>
            )}
          </GlassCard>
        )}
        
      </div>
    </div>
  );
}
