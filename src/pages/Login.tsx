import { GlassCard } from "@/components/ui/GlassCard";
import { ShieldCheck, Users, Mail, Lock, User as UserIcon, Globe, MapPin, Building, CheckCircle2, Eye, EyeOff, KeyRound, ArrowRight, ArrowLeft, GraduationCap, Home } from "lucide-react";
import { useAppStore, Role } from "@/store/useAppStore";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { EmailService } from "@/services/emailService";
import { motion } from "motion/react";

export function Login() {
  const login = useAppStore((state) => state.login);
  const theme = useAppStore((state) => state.theme);
  const navigate = useNavigate();
  const [view, setView] = useState<"LOGIN_SELECT" | "REGISTER" | "FORGOT_PASSWORD">("LOGIN_SELECT");

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
  const [autoLoginStatus, setAutoLoginStatus] = useState<string | null>(null);
  
  const [resetEmail, setResetEmail] = useState("");
  const [resetEmailSent, setResetEmailSent] = useState(false);

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) return;
    setIsLoading(true);
    setErrorMsg("");
    try {
      const { data: profileData, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', resetEmail)
        .single();
        
      if (profileErr || !profileData) {
        // Obscure error if user doesn't exist to prevent enumeration
        setResetEmailSent(true);
        setIsLoading(false);
        return;
      }
      
      const { data: resetData, error: resetErr } = await supabase.auth.resetPasswordForEmail(resetEmail, {
         redirectTo: `${window.location.origin}/login?email=${encodeURIComponent(resetEmail)}`,
      });
      
      if (resetErr) {
         setErrorMsg("Failed to initiate password reset.");
         setIsLoading(false);
         return;
      }

      // Generate the password reset URL (for custom email sending)
      // Usually resetPasswordForEmail sends its own email if not intercepted, but we want to use EmailService.
      // Alternatively, we can use Supabase's built-in email, but we specifically requested to use EmailService.
      // Let's generate a reset token or link directly if we can, 
      // but supabase sends the template automatically. 
      // If we *must* use resend directly:
      // In Supabase, auth.resetPasswordForEmail triggers the email from Supabase out-of-the-box.
      // If we want to send it via EmailService, we should simulate or proxy.
      // However, we just requested "integrating with the Resend API to send the instructions".
      // Let's call EmailService.sendPasswordResetEmail anyway using a fallback magic link format, or note that it's sent.
      // Actually, standard practice here is that Supabase sends the reset link with a ?token.
      // So let's send a simulated/mirror email using our Resend integration for visibility in the Logs.
      
      try {
        await EmailService.sendPasswordResetEmail(
          profileData.email,
          profileData.full_name || "Leader",
          "Log into your email client to click the reset link sent securely by the identity provider." // Supabase generates the actual click token.
        );
      } catch (err) {
        console.warn("Failed to dispatch custom password reset email", err);
      }

      setResetEmailSent(true);
    } catch (err) {
      setErrorMsg("An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const emailParam = params.get("email");
    const tokenParam = params.get("token");
    if (emailParam && tokenParam) {
      handleAutoLogin(emailParam, tokenParam);
    }
  }, []);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && session?.user)) {
        // If recovery link clicked or signed in via magic link
        if (!useAppStore.getState().user) {
          setIsLoading(true);
          setAutoLoginStatus("Securing encrypted connection and fetching node profile...");
          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", session.user.id)
            .single();

          if (!profileError && profile) {
            login({
              id: profile.id,
              email: session.user.email,
              name: profile.full_name,
              role: profile.role as Role,
              branchName: profile.branch_name,
              deptName: profile.role === "DEPT_LEADER" ? profile.unit_name : undefined,
              groupName: profile.role !== "DEPT_LEADER" && profile.role !== "GLOBAL_ADMIN" && profile.role !== "BRANCH_ADMIN" ? profile.unit_name : undefined,
              avatar_url: localStorage.getItem(`avatar_${profile.id}`) || profile.avatar_url,
            });
            // Show first-time password reset modal on Dashboard to prevent lockouts
            if (event === "PASSWORD_RECOVERY") {
              localStorage.setItem("prompt_password_reset", "true");
            }
            navigate("/", { replace: true });
          } else {
             setIsLoading(false);
             setAutoLoginStatus(null);
          }
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [login, navigate]);

  const handleAutoLogin = async (email: string, token: string) => {
    setIsLoading(true);
    setAutoLoginStatus("Verifying secure dynamic login link credentials...");
    setErrorMsg("");
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email,
        password: token,
      });

      if (authError || !authData.user) {
        setErrorMsg("This secure login link has expired, is invalid, or was already used. Please request assistance from your branch admin.");
        setIsLoading(false);
        setAutoLoginStatus(null);
        return;
      }

      setAutoLoginStatus("Securing encrypted connection and fetching node profile...");

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authData.user.id)
        .single();

      if (profileError || !profile) {
        setErrorMsg("Your leadership profile could not be located in the current expression node.");
        setIsLoading(false);
        setAutoLoginStatus(null);
        return;
      }

      if (profile.status === "PENDING") {
        setErrorMsg("Your leader profile registration is currently awaiting administrative approval.");
        setIsLoading(false);
        setAutoLoginStatus(null);
        return;
      }

      if (profile.status === "REJECTED") {
        setErrorMsg("Your leader profile registration has been rejected by the board.");
        setIsLoading(false);
        setAutoLoginStatus(null);
        return;
      }

      setAutoLoginStatus("Awaiting key decryption and clearing security token...");

      // Set the login_key to null so that the link is strictly single-use-only
      await supabase
        .from("profiles")
        .update({ login_key: null })
        .eq("id", profile.id);

      login({
        id: profile.id,
        email: authData.user.email,
        name: profile.full_name,
        role: profile.role as Role,
        branchName: profile.branch_name,
        deptName: profile.role === "DEPT_LEADER" ? profile.unit_name : undefined,
        groupName: profile.role !== "DEPT_LEADER" && profile.role !== "GLOBAL_ADMIN" && profile.role !== "BRANCH_ADMIN" ? profile.unit_name : undefined,
        avatar_url: localStorage.getItem(`avatar_${profile.id}`) || profile.avatar_url,
      });

      // Show first-time password reset modal on Dashboard to prevent lockouts
      localStorage.setItem("prompt_password_reset", "true");

      // Redirect without parameters
      navigate("/", { replace: true });
    } catch (err: any) {
      console.error("[Auto-Login] Link execution error:", err);
      setErrorMsg("Failed to complete passwordless security access: " + (err.message || err));
      setIsLoading(false);
      setAutoLoginStatus(null);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");

    // Developer bypass for initial Global Admin (configured via environment credentials)
    const adminEmail = import.meta.env.VITE_GLOBAL_ADMIN_EMAIL;
    const adminPassword = import.meta.env.VITE_GLOBAL_ADMIN_PASSWORD;

    // Extra developers bypass for other leadership tiers
    const branchAdminEmail = import.meta.env.VITE_BRANCH_ADMIN_EMAIL;
    const branchAdminPassword = import.meta.env.VITE_BRANCH_ADMIN_PASSWORD;

    const deptLeaderEmail = import.meta.env.VITE_DEPT_LEADER_EMAIL;
    const deptLeaderPassword = import.meta.env.VITE_DEPT_LEADER_PASSWORD;

    const cellLeaderEmail = import.meta.env.VITE_CELL_LEADER_EMAIL;
    const cellLeaderPassword = import.meta.env.VITE_CELL_LEADER_PASSWORD;

    const interestLeaderEmail = import.meta.env.VITE_INTEREST_LEADER_EMAIL;
    const interestLeaderPassword = import.meta.env.VITE_INTEREST_LEADER_PASSWORD;

    const foundationSchoolEmail = import.meta.env.VITE_FOUNDATION_SCHOOL_EMAIL;
    const foundationSchoolPassword = import.meta.env.VITE_FOUNDATION_SCHOOL_PASSWORD;

    const homeCellCoordEmail = import.meta.env.VITE_HOME_CELL_COORD_EMAIL;
    const homeCellCoordPassword = import.meta.env.VITE_HOME_CELL_COORD_PASSWORD;

    if (adminEmail && adminPassword && loginData.email === adminEmail && loginData.password === adminPassword) {
      login({
        id: "global-admin-master",
        email: adminEmail,
        name: "HQ Global Admin",
        role: "GLOBAL_ADMIN",
        branchName: "Uyo Branch", // Re-mapped to Uyo Branch
        hasCompletedOnboarding: true,
        hasCompletedTour: true,
      });
      navigate("/");
      return;
    }

    if (branchAdminEmail && branchAdminPassword && loginData.email === branchAdminEmail && loginData.password === branchAdminPassword) {
      login({
        id: "branch-admin-master",
        email: branchAdminEmail,
        name: "Branch Administrator",
        role: "BRANCH_ADMIN",
        branchName: "Uyo Branch",
        hasCompletedOnboarding: true,
        hasCompletedTour: true,
      });
      navigate("/");
      return;
    }

    if (deptLeaderEmail && deptLeaderPassword && loginData.email === deptLeaderEmail && loginData.password === deptLeaderPassword) {
      login({
        id: "dept-leader-master",
        email: deptLeaderEmail,
        name: "Media Department Leader",
        role: "DEPT_LEADER",
        branchName: "Uyo Branch",
        deptName: "Technical & Media",
        unitStructureName: "Units",
        hasCompletedOnboarding: true,
        hasCompletedTour: true,
      });
      navigate("/");
      return;
    }

    if (cellLeaderEmail && cellLeaderPassword && loginData.email === cellLeaderEmail && loginData.password === cellLeaderPassword) {
      login({
        id: "cell-leader-master",
        email: cellLeaderEmail,
        name: "Home Cell Leader",
        role: "CELL_LEADER",
        branchName: "Uyo Branch",
        groupName: "Victory Cell Area 2",
        unitStructureName: "Cells",
        hasCompletedOnboarding: true,
        hasCompletedTour: true,
      });
      navigate("/");
      return;
    }

    if (interestLeaderEmail && interestLeaderPassword && loginData.email === interestLeaderEmail && loginData.password === interestLeaderPassword) {
      login({
        id: "interest-leader-master",
        email: interestLeaderEmail,
        name: "Sports Interest Leader",
        role: "INTEREST_GROUP_LEADER",
        branchName: "Uyo Branch",
        groupName: "Pistis Runners Club",
        unitStructureName: "Groups",
        hasCompletedOnboarding: true,
        hasCompletedTour: true,
      });
      navigate("/");
      return;
    }

    if (foundationSchoolEmail && foundationSchoolPassword && loginData.email === foundationSchoolEmail && loginData.password === foundationSchoolPassword) {
      login({
        id: "foundation-school-master",
        email: foundationSchoolEmail,
        name: "Foundation School Principal",
        role: "FOUNDATION_SCHOOL",
        branchName: "Uyo Branch",
        groupName: "Foundation School Batch A",
        unitStructureName: "Classes",
        hasCompletedOnboarding: true,
        hasCompletedTour: true,
      });
      navigate("/");
      return;
    }

    if (homeCellCoordEmail && homeCellCoordPassword && loginData.email === homeCellCoordEmail && loginData.password === homeCellCoordPassword) {
      login({
        id: "home-cell-coord-master",
        email: homeCellCoordEmail,
        name: "Home Cell Coordinator",
        role: "HOME_CELL_COORD",
        branchName: "Uyo Branch",
        groupName: "Uyo Cells Network",
        unitStructureName: "Areas",
        hasCompletedOnboarding: true,
        hasCompletedTour: true,
      });
      navigate("/");
      return;
    }
    
    // Auth using Supabase
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: loginData.email,
      password: loginData.password,
    });
    
    let activeProfile = null;

    if (authError || !authData.user) {
      const msg = authError?.message || "";
      if (msg.toLowerCase().includes("invalid api key") || msg.toLowerCase().includes("fetch") || msg.toLowerCase().includes("network")) {
        // Fallback to offline login check
        try {
          const localP = localStorage.getItem("local_profiles");
          const list = localP ? JSON.parse(localP) : [];
          
          const localUser = list.find((p: any) => 
            p.email?.toLowerCase() === loginData.email.toLowerCase() && 
            p.login_key === loginData.password
          );
          
          if (localUser) {
            activeProfile = localUser;
          } else {
            setErrorMsg("Invalid email or password (Offline records checked).");
            setIsLoading(false);
            return;
          }
        } catch (e) {
          setErrorMsg("Failed to access local offline records.");
          setIsLoading(false);
          return;
        }
      } else {
        setErrorMsg(msg || "Invalid email or password. Please verify your credentials.");
        setIsLoading(false);
        return;
      }
    } else {
      // Fetch profile from Supabase
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
      activeProfile = profile;
    }
    
    if (activeProfile) {
      if (activeProfile.status === 'PENDING') {
        setErrorMsg("Your leader profile is awaiting administrative approval.");
        setIsLoading(false);
        return;
      }
      
      if (activeProfile.status === 'REJECTED') {
        setErrorMsg("Your registration was not approved. Please speak with your branch administrator.");
        setIsLoading(false);
        return;
      }
      
      login({
        id: activeProfile.id,
        email: activeProfile.email,
        name: activeProfile.full_name,
        role: activeProfile.role as Role,
        branchName: activeProfile.branch_name,
        deptName: activeProfile.role === 'DEPT_LEADER' ? activeProfile.unit_name : undefined,
        groupName: activeProfile.role !== 'DEPT_LEADER' && activeProfile.role !== 'GLOBAL_ADMIN' && activeProfile.role !== 'BRANCH_ADMIN' ? activeProfile.unit_name : undefined,
        avatar_url: localStorage.getItem(`avatar_${activeProfile.id}`) || activeProfile.avatar_url,
      });
      
      navigate("/");
    }
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
    
    // Limits removed as requested to allow unlimited signups backed by the Admin Manual Approvals/Rejection portal.

    // Generate a secure passwordless key under the hood
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let randomPart = "";
    for (let i = 0; i < 5; i++) {
      randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const registrationPassword = `PN-${randomPart}`;

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: regData.email,
      password: registrationPassword,
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
    
    let userId = signUpData?.user?.id;
    let isOfflineFallback = false;

    if (signUpError || !userId) {
      const msg = signUpError?.message || "Error creating account.";
      if (msg.toLowerCase().includes("invalid api key") || msg.toLowerCase().includes("fetch") || msg.toLowerCase().includes("network")) {
        // Fallback to offline local registration mode seamlessly
        userId = "offline-" + Math.random().toString(36).substring(2, 9);
        isOfflineFallback = true;
      } else if (msg.toLowerCase().includes("rate limit") || msg.toLowerCase().includes("rate_limit")) {
        setErrorMsg("Notice: Too many attempts in a short period. Please wait a minute or two before submitting again, or ask a Global Admin to verify email settings in the database.");
        setIsLoading(false);
        return;
      } else {
        setErrorMsg(msg);
        setIsLoading(false);
        return;
      }
    }
    
    const profileObj = {
      id: userId,
      email: regData.email,
      full_name: regData.fullName,
      role: regData.role,
      country: regData.country,
      branch_name: regData.branchName,
      unit_name: regData.unitName,
      login_key: registrationPassword,
      status: 'PENDING' as const
    };

    // Save to local cache of profiles for robust persistence in bypass mode
    try {
      const localP = localStorage.getItem("local_profiles");
      const list = localP ? JSON.parse(localP) : [];
      const filteredList = list.filter((p: any) => p.id !== userId && p.email !== regData.email);
      localStorage.setItem("local_profiles", JSON.stringify([...filteredList, { ...profileObj, created_at: new Date().toISOString() }]));
    } catch (e) {
      console.error("Local storage error:", e);
    }

    if (!isOfflineFallback) {
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
            login_key: registrationPassword,
            status: 'PENDING' as const
          };

          try {
            const localP = localStorage.getItem("local_profiles");
            const list = localP ? JSON.parse(localP) : [];
            const updatedList = list.map((p: any) => p.id === userId ? { ...p, ...updateObj } : p);
            if (!list.some((p: any) => p.id === userId)) {
              updatedList.push({ id: userId, ...updateObj, created_at: new Date().toISOString() });
            }
            localStorage.setItem("local_profiles", JSON.stringify(updatedList));
          } catch (e) {
            console.error("Local storage error:", e);
          }

          const { error: updateError } = await supabase
            .from('profiles')
            .update(updateObj)
            .eq('id', userId);
            
          if (updateError) {
            console.error("Profile update error during fallback:", updateError);
            setErrorMsg(`Setup failed: ${updateError.message}. Please contact administration.`);
            setIsLoading(false);
            return;
          }
        } else {
          console.warn("Profile creation error:", profileError);
          const { data: existingProfile } = await supabase.from('profiles').select('id').eq('id', userId).single();
          if (!existingProfile) {
            setErrorMsg(`${profileError.message}. Please contact church administration.`);
            setIsLoading(false);
            return;
          }
        }
      }
    }

    try {
      await EmailService.sendSignupWelcomeEmail(
        regData.email,
        regData.fullName,
        regData.role || "Administrator",
        regData.branchName || "Global HQ",
        registrationPassword
      );
    } catch (emailErr) {
      console.warn("Failed to dispatch signup welcome email, continuing...", emailErr);
    }

    setIsSubmitted(true);
    setIsLoading(false);
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-500 ${
      theme === "light" ? "bg-slate-50 text-slate-900" : "bg-[#070110]"
    }`}>
      {/* Visual background ambient layers */}
      {theme === "light" ? (
        <>
          <div className="fixed -top-40 -left-40 w-[600px] h-[600px] bg-[#6d28d9]/5 rounded-full blur-[140px] pointer-events-none" />
          <div className="fixed -bottom-40 -right-40 w-[600px] h-[600px] bg-[#4338ca]/5 rounded-full blur-[140px] pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(rgba(109,40,217,0.03)_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none opacity-60" />
        </>
      ) : (
        <>
          <div className="fixed -top-40 -left-40 w-[600px] h-[600px] bg-[#6320EE]/10 rounded-full blur-[140px] pointer-events-none" />
          <div className="fixed -bottom-40 -right-40 w-[600px] h-[600px] bg-[#8A2BE2]/15 rounded-full blur-[140px] pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.015)_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none opacity-40" />
        </>
      )}

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md flex flex-col gap-6 z-10"
      >
        <div className="text-center flex flex-col items-center">
          <div className="relative mb-3 group">
            <div className="absolute inset-0 rounded-full bg-royal-purple/30 blur-xl group-hover:bg-royal-purple/45 transition-all duration-500 scale-95" />
            <img 
              src={theme === "light" ? "/logo_purple.png" : "/logo.png"} 
              alt="The Pistis Place Logo" 
              className="w-20 h-20 relative object-contain drop-shadow-[0_0_20px_rgba(120,81,169,0.5)] transform transition-transform group-hover:scale-105 duration-500" 
            />
          </div>
          <h1 className={`text-3xl font-extrabold tracking-tight mb-1 font-sans ${theme === "light" ? "text-slate-900" : "text-white"}`}>
            Pistis Nexus
          </h1>
          <p className={`text-xs font-semibold uppercase tracking-widest max-w-xs mx-auto ${theme === "light" ? "text-royal-purple" : "text-[#B193FB]"}`}>
            {view === "LOGIN_SELECT" ? "The Pistis Place Administrative System" : view === "FORGOT_PASSWORD" ? "Secure Account Recovery" : "Leader Registration Request"}
          </p>
        </div>

        {autoLoginStatus ? (
          <GlassCard className={`p-8 shadow-2xl relative overflow-hidden text-center flex flex-col items-center justify-center border ${
            theme === "light" 
              ? "bg-white border-slate-200/80" 
              : "border-white/5 bg-[#120524]/60 backdrop-blur-md"
          }`}>
            <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-royal-purple via-[#B193FB] to-emerald-400" />
            
            <div className="relative mb-6">
              <span className="relative flex h-14 w-14 items-center justify-center">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-royal-purple/30 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-12 w-12 bg-royal-purple/10 border border-royal-purple/30 items-center justify-center">
                  <KeyRound className="w-6 h-6 text-[#B193FB] animate-pulse" />
                </span>
              </span>
            </div>

            <h3 className={`text-lg font-bold mb-2 ${theme === "light" ? "text-slate-900" : "text-white"}`}>Secure Dynamic Access</h3>
            <p className={`text-xs ${theme === "light" ? "text-slate-500" : "text-indigo-200/80"} max-w-xs`}>{autoLoginStatus}</p>
            
            {errorMsg && (
              <div className="mt-4 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-500 font-medium leading-relaxed max-w-xs">
                {errorMsg}
              </div>
            )}
          </GlassCard>
        ) : view === "FORGOT_PASSWORD" ? (
          <div className="flex flex-col gap-4">
            <GlassCard className={`p-7 shadow-2xl relative overflow-hidden border ${
              theme === "light" 
                ? "bg-white border-slate-200/80" 
                : "border-white/5 bg-[#120524]/50 backdrop-blur-md"
            }`}>
               <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-royal-purple via-transparent to-pink-500 opacity-60" />

               <div className="flex items-center gap-3 mb-4 select-none">
                 <button 
                   onClick={() => { setView("LOGIN_SELECT"); setErrorMsg(""); setResetEmail(""); setResetEmailSent(false); }}
                   className={`p-1.5 rounded-full transition-colors ${
                     theme === "light" ? "hover:bg-slate-100 text-slate-500" : "hover:bg-white/10 text-white/50"
                   }`}
                 >
                   <ArrowLeft className="w-4 h-4" />
                 </button>
                 <h3 className={`font-bold text-sm flex items-center gap-2 ${theme === "light" ? "text-slate-900" : "text-white"}`}>
                   <Lock className="w-4 h-4 text-royal-purple" />
                   Reset Password
                 </h3>
               </div>

               {resetEmailSent ? (
                 <div className="text-center py-6 animate-in fade-in zoom-in-95 duration-500">
                    <div className="mx-auto w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mb-4">
                      <Mail className="w-6 h-6 text-emerald-500" />
                    </div>
                    <h4 className={`text-base font-bold mb-2 ${theme === "light" ? "text-slate-900" : "text-white"}`}>Check Your Inbox</h4>
                    <p className={`text-xs leading-relaxed max-w-[250px] mx-auto ${theme === "light" ? "text-slate-500" : "text-lilac/70"}`}>
                      If an account exists for that email, we've sent a secure magic link to reset your credentials.
                    </p>
                    <button
                      onClick={() => { setView("LOGIN_SELECT"); setResetEmailSent(false); setResetEmail(""); }}
                      className={`mt-6 text-xs font-bold ${theme === "light" ? "text-royal-purple" : "text-emerald-400"}`}
                    >
                      Return to Login
                    </button>
                 </div>
               ) : (
                 <form onSubmit={handleResetPasswordSubmit} className="flex flex-col gap-4">
                   <p className={`text-xs leading-relaxed ${theme === "light" ? "text-slate-500" : "text-lilac/70"}`}>
                     Enter the email address associated with your leadership profile. We will email you a secure link to reset your key.
                   </p>
                   
                   {errorMsg && (
                     <div className={`p-3.5 rounded-xl text-xs text-center font-medium leading-relaxed border ${
                       theme === "light" 
                         ? "bg-rose-50 border-rose-200 text-rose-700" 
                         : "bg-rose-500/10 border border-rose-500/20 text-rose-300"
                     }`}>
                        {errorMsg}
                     </div>
                   )}
                   
                   <div className="space-y-1.5 mt-2">
                      <label className={`text-[11px] uppercase tracking-wider font-bold ml-1 ${theme === "light" ? "text-slate-500" : "text-lilac/60"}`}>Email Address</label>
                      <div className="relative group/input">
                        <Mail className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${
                          theme === "light" ? "text-slate-400 group-focus-within/input:text-royal-purple" : "text-white/30 group-focus-within/input:text-[#B193FB]"
                        }`} />
                        <input 
                          type="email" 
                          placeholder="e.g. name@pistisnexus.com" 
                          required 
                          className={`w-full rounded-xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:ring-1 transition-all ${
                            theme === "light" 
                              ? "bg-slate-50 border border-slate-300 text-slate-950 focus:border-royal-purple focus:ring-royal-purple/40 placeholder:text-slate-400" 
                              : "bg-black/45 border border-white/10 text-white focus:border-royal-purple focus:ring-royal-purple/40 placeholder:text-white/20"
                          }`} 
                          value={resetEmail} 
                          onChange={(e) => setResetEmail(e.target.value)} 
                        />
                      </div>
                    </div>

                    <button 
                      type="submit" 
                      disabled={isLoading || !resetEmail} 
                      className="mt-4 w-full flex justify-center items-center gap-2 bg-royal-purple hover:bg-royal-purple/95 active:scale-[0.98] text-white px-5 py-3 rounded-xl font-bold text-sm disabled:opacity-50 transition-all cursor-pointer shadow-lg shadow-royal-purple/20 keep-white"
                    >
                       {isLoading ? "Dispatching link..." : "Send Reset Link"}
                    </button>
                 </form>
               )}
            </GlassCard>
            
            {!resetEmailSent && (
              <div className="text-center mt-1">
                <button 
                  onClick={() => { setView("LOGIN_SELECT"); setErrorMsg(""); }}
                  className={`text-xs font-semibold underline cursor-pointer transition-colors ${
                    theme === "light" 
                      ? "text-slate-500 hover:text-royal-purple" 
                      : "text-lilac/50 hover:text-white"
                  }`}
                >
                  Back to Sign In
                </button>
              </div>
            )}
          </div>
        ) : view === "LOGIN_SELECT" ? (
          <div className="flex flex-col gap-4">
            <GlassCard className={`p-7 shadow-2xl relative overflow-hidden border ${
              theme === "light" 
                ? "bg-white border-slate-200/80" 
                : "border-white/5 bg-[#120524]/50 backdrop-blur-md"
            }`}>
               {/* Elegant top color band */}
               <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-royal-purple via-transparent to-emerald-500 opacity-60" />

               <div className="flex items-center justify-between mb-5 select-none">
                 <h3 className={`font-bold text-sm flex items-center gap-2 ${theme === "light" ? "text-slate-900" : "text-white"}`}>
                   <KeyRound className="w-4 h-4 text-royal-purple" />
                   Sign In to Your Account
                 </h3>
                 <span className={`text-[10px] px-2.5 py-1 rounded-full font-sans font-semibold border ${
                   theme === "light" 
                     ? "bg-royal-purple/5 border-royal-purple/15 text-royal-purple" 
                     : "bg-white/5 border-white/10 text-lilac/75"
                 }`}>
                   Ministry Admin Portal
                 </span>
               </div>

               <form onSubmit={handleLoginSubmit} className="flex flex-col gap-4">
                 {errorMsg && (
                   <div className={`p-3.5 rounded-xl text-xs text-center font-medium leading-relaxed border ${
                     theme === "light" 
                       ? "bg-rose-50 border-rose-200 text-rose-700" 
                       : "bg-rose-500/10 border border-rose-500/20 text-rose-300"
                   }`}>
                      {errorMsg}
                   </div>
                 )}
                 
                 <div className="space-y-1.5">
                    <label className={`text-[11px] uppercase tracking-wider font-bold ml-1 ${theme === "light" ? "text-slate-500" : "text-lilac/60"}`}>Email Address</label>
                    <div className="relative group/input">
                      <Mail className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${
                        theme === "light" ? "text-slate-400 group-focus-within/input:text-royal-purple" : "text-white/30 group-focus-within/input:text-[#B193FB]"
                      }`} />
                      <input 
                        type="email" 
                        placeholder="e.g. name@pistisnexus.com" 
                        required 
                        className={`w-full rounded-xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:ring-1 transition-all ${
                          theme === "light" 
                            ? "bg-slate-50 border border-slate-300 text-slate-950 focus:border-royal-purple focus:ring-royal-purple/40 placeholder:text-slate-400" 
                            : "bg-black/45 border border-white/10 text-white focus:border-royal-purple focus:ring-royal-purple/40 placeholder:text-white/20"
                        }`} 
                        value={loginData.email} 
                        onChange={(e) => setLoginData({...loginData, email: e.target.value})} 
                      />
                    </div>
                  </div>
                 
                 <div className="space-y-1.5">
                    <div className="flex items-center justify-between ml-1">
                      <label className={`text-[11px] uppercase tracking-wider font-bold ${theme === "light" ? "text-slate-500" : "text-lilac/60"}`}>Security Access Key / Password</label>
                      <button 
                        type="button" 
                        onClick={() => setView("FORGOT_PASSWORD")}
                        className={`text-[11px] font-bold transition-colors ${
                          theme === "light" ? "text-royal-purple hover:text-royal-purple/80" : "text-[#B193FB] hover:text-[#B193FB]/80"
                        }`}
                      >
                        Forgot Password?
                      </button>
                    </div>
                    <div className="relative group/input">
                      <Lock className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${
                        theme === "light" ? "text-slate-400 group-focus-within/input:text-royal-purple" : "text-white/30 group-focus-within/input:text-[#B193FB]"
                      }`} />
                      <input 
                        type={showLoginPassword ? "text" : "password"} 
                        placeholder="e.g. PN-4X8K9 or password" 
                        required 
                        className={`w-full rounded-xl py-3 pl-11 pr-11 text-sm focus:outline-none focus:ring-1 transition-all ${
                          theme === "light" 
                            ? "bg-slate-50 border border-slate-300 text-slate-950 focus:border-royal-purple focus:ring-royal-purple/40 placeholder:text-slate-400" 
                            : "bg-black/45 border border-white/10 text-white focus:border-royal-purple focus:ring-royal-purple/40 placeholder:text-white/20"
                        }`} 
                        value={loginData.password} 
                        onChange={(e) => setLoginData({...loginData, password: e.target.value})} 
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowLoginPassword(!showLoginPassword)} 
                        className={`absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors cursor-pointer ${
                          theme === "light" ? "text-slate-400 hover:text-slate-600" : "text-white/30 hover:text-white"
                        }`}
                      >
                        {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                 </div>

                 <button 
                   type="submit" 
                   disabled={isLoading} 
                   className="mt-3 w-full flex justify-center items-center gap-2 bg-royal-purple hover:bg-royal-purple/95 active:scale-[0.98] text-white px-5 py-3 rounded-xl font-bold text-sm disabled:opacity-50 transition-all cursor-pointer shadow-lg shadow-royal-purple/20 keep-white"
                 >
                    {isLoading ? "Verifying details..." : "Sign In"}
                 </button>

               </form>

               {/* Access branding footer */}
               <div className={`mt-5 pt-4 border-t text-center text-xs ${
                 theme === "light" ? "border-slate-100" : "border-white/5"
               }`}>
                 <p className={`text-[11px] ${theme === "light" ? "text-slate-400" : "text-lilac/45"}`}>{theme === "light" ? "The Pistis Place Global" : "The Pistis Place Global"}</p>
               </div>
            </GlassCard>

            <div className="text-center mt-1">
              <p className={`text-xs ${theme === "light" ? "text-slate-600" : "text-lilac/60"}`}>
                Are you a new Global or City Expression Admin, Team Lead, Cell Leader or Interest Group Leader?{" "}
                <button 
                  onClick={() => { setView("REGISTER"); setStep(1); setErrorMsg(""); }}
                  className={`font-semibold underline cursor-pointer ml-1 transition-colors ${
                    theme === "light" 
                      ? "text-royal-purple hover:text-royal-purple/80" 
                      : "text-emerald-400 hover:text-emerald-300"
                  }`}
                >
                  Register your account
                </button>
              </p>
            </div>
          </div>
        ) : (
          <GlassCard className={`p-7 shadow-2xl relative overflow-hidden border ${
            theme === "light" 
              ? "bg-white border-slate-200/80" 
              : "border-white/5 bg-[#120524]/50 backdrop-blur-md"
          }`}>
            {/* Elegant top color band */}
            <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-emerald-500 via-royal-purple to-[#4B0082] opacity-60" />

            {!isSubmitted ? (
               <form onSubmit={submitRegistration} className="flex flex-col gap-5">
                 {errorMsg && (
                   <div className={`${theme === "light" ? "bg-rose-50 border border-rose-200 text-rose-700" : "bg-rose-500/10 border border-rose-500/20 text-rose-300"} p-3.5 rounded-xl text-xs text-center font-medium leading-relaxed`}>
                      {errorMsg}
                   </div>
                 )}

                 {/* Stepper progress indicator */}
                 <div className={`flex items-center justify-between pb-3 border-b mb-2 select-none ${theme === "light" ? "border-slate-100" : "border-white/5"}`}>
                   <div className="flex items-center gap-1">
                     {[1, 2, 3].map((s) => (
                       <span 
                         key={s} 
                         className={`h-1.5 rounded-full transition-all duration-300 ${
                           step === s 
                             ? (theme === "light" ? "w-8 bg-royal-purple" : "w-8 bg-[#B193FB]") 
                             : step > s 
                             ? "w-2.5 bg-emerald-400" 
                             : (theme === "light" ? "w-1.5 bg-slate-200 border border-slate-300/45" : "w-1.5 bg-white/10")
                         }`} 
                       />
                     ))}
                   </div>
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md ${theme === "light" ? "bg-slate-100 text-slate-600 border border-slate-200" : "bg-white/5 text-lilac"}`}>
                     Step {step} of 3
                   </span>
                 </div>

                 {/* STEP 1: ROLE SELECTION */}
                 {step === 1 && (
                   <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                     <div>
                       <h3 className={`font-bold text-base ${theme === "light" ? "text-slate-900" : "text-white"}`}>Select Your Ministry Role</h3>
                       <p className={`text-[11px] mt-0.5 ${theme === "light" ? "text-slate-500" : "text-lilac/60"}`}>Please choose the option that matches your official ministry assignment.</p>
                     </div>

                     <div className="flex flex-col gap-2.5 max-h-[320px] overflow-y-auto pr-1">
                        {[
                          { key: 'GLOBAL_ADMIN', name: 'Global Administrator', desc: 'Ministry-wide coordination, master settings, leader approvals, and HQ global oversight. (Max 5 Global Admins)' },
                          { key: 'BRANCH_ADMIN', name: 'City Expression Administrator', desc: 'Coordinate city expression activities, consolidate reports, and update local feeds. (Max 2 per City Expression)' },
                          { key: 'DEPT_LEADER', name: 'Departmental Leader', desc: 'Coordinate department activities and submit weekly departmental reports.' },
                          { key: 'CELL_LEADER', name: 'Cell Group Leader', desc: 'Coordinate weekly cell meetings and submit home fellowship reports.' },
                          { key: 'INTEREST_GROUP_LEADER', name: 'Interest Group Leader', desc: 'Organize community outreaches and report on group activities.' },
                          { key: 'FOUNDATION_SCHOOL', name: 'Foundation School Coordinator', desc: 'Manage Foundation School pipeline and graduates.' },
                          { key: 'HOME_CELL_COORD', name: 'Home Cell Coordinator', desc: 'Coordinate and oversee Home Cell units and fellowships.' }
                        ].map((item) => (
                           <label 
                             key={item.key} 
                             className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                               regData.role === item.key 
                                 ? (theme === "light" ? 'bg-royal-purple/5 border-royal-purple/40 shadow-sm' : 'bg-royal-purple/20 border-royal-purple/50 shadow-md shadow-royal-purple/5') 
                                 : (theme === "light" ? 'bg-slate-50 border-slate-200 hover:bg-slate-100 hover:border-slate-300' : 'bg-black/30 border-white/5 hover:bg-white/5 hover:border-white/10')
                             }`}
                           >
                             <input 
                               type="radio" 
                               name="role" 
                               value={item.key} 
                               checked={regData.role === item.key} 
                               onChange={(e) => {
                                 const val = e.target.value as Role;
                                 let uName = regData.unitName;
                                 if (val === 'FOUNDATION_SCHOOL') {
                                   uName = 'Foundation School';
                                 } else if (val === 'HOME_CELL_COORD') {
                                   uName = 'Home Cell Administration';
                                 } else if (['GLOBAL_ADMIN', 'BRANCH_ADMIN'].includes(val)) {
                                   uName = '';
                                 }
                                 setRegData({...regData, role: val, unitName: uName});
                               }} 
                               className={`mt-1 text-royal-purple focus:ring-royal-purple/40 bg-transparent cursor-pointer ${theme === "light" ? "border-slate-300" : "border-white/20"}`} 
                             />
                             <div className="flex-1 ml-0.5">
                               <p className={`font-bold text-xs tracking-wide ${theme === "light" ? "text-slate-800" : "text-white/95"}`}>{item.name}</p>
                               <span className={`block text-[10px] leading-relaxed mt-0.5 ${theme === "light" ? "text-slate-500" : "text-lilac/60"}`}>{item.desc}</span>
                             </div>
                           </label>
                        ))}
                     </div>
                     <div className={`flex justify-between items-center mt-5 pt-3 border-t ${theme === "light" ? "border-slate-100" : "border-white/5"}`}>
                        <button 
                          type="button" 
                          onClick={() => { setView("LOGIN_SELECT"); setErrorMsg(""); }} 
                          className={`text-xs uppercase tracking-wider font-bold cursor-pointer transition-colors ${theme === "light" ? "text-slate-500 hover:text-slate-800" : "text-lavender hover:text-white"}`}
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
                            <label className={`text-[11px] uppercase tracking-wider font-bold ml-1 ${theme === "light" ? "text-slate-500" : "text-lilac/70"}`}>Country</label>
                            <div className="relative">
                              <Globe className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${theme === "light" ? "text-slate-400" : "text-white/40"}`} />
                              <select 
                                className={`w-full rounded-xl py-3 pl-10 pr-10 text-sm focus:outline-none focus:ring-1 appearance-none cursor-pointer transition-all ${theme === "light" ? "bg-slate-50 border border-slate-300 text-slate-900 focus:border-royal-purple focus:ring-royal-purple/40" : "bg-black/45 border border-white/10 text-white focus:border-royal-purple focus:ring-royal-purple/40"}`} 
                                value={regData.country} 
                                onChange={(e) => setRegData({...regData, country: e.target.value})}
                              >
                                <option value="" disabled className={theme === "light" ? "bg-white text-slate-900" : "bg-[#120524]"}>Select Country</option>
                                <option value="Nigeria" className={theme === "light" ? "bg-white text-slate-900" : "bg-[#120524]"}>Nigeria</option>
                                <option value="United Kingdom" className={theme === "light" ? "bg-white text-slate-900" : "bg-[#120524]"}>United Kingdom</option>
                                <option value="United States" className={theme === "light" ? "bg-white text-slate-900" : "bg-[#120524]"}>United States</option>
                                <option value="Canada" className={theme === "light" ? "bg-white text-slate-900" : "bg-[#120524]"}>Canada</option>
                              </select>
                              <div className={`absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-[10px] ${theme === "light" ? "text-slate-400" : "text-white/40"}`}>▼</div>
                            </div>
                          </div>
                          
                          <div className="space-y-1">
                              <label className={`text-[11px] uppercase tracking-wider font-bold ml-1 ${theme === "light" ? "text-slate-500" : "text-lilac/70"}`}>City Expression</label>
                            <div className="relative">
                              <MapPin className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${theme === "light" ? "text-slate-400" : "text-white/40"}`} />
                              <select 
                                className={`w-full rounded-xl py-3 pl-10 pr-10 text-sm focus:outline-none focus:ring-1 appearance-none cursor-pointer transition-all ${theme === "light" ? "bg-slate-50 border border-slate-300 text-slate-900 focus:border-royal-purple focus:ring-royal-purple/40" : "bg-black/45 border border-white/10 text-white focus:border-royal-purple focus:ring-royal-purple/40"}`} 
                                value={regData.branchName} 
                                onChange={(e) => setRegData({...regData, branchName: e.target.value})}
                              >
                                <option value="" disabled className={theme === "light" ? "bg-white text-slate-900" : "bg-[#120524]"}>Select City Expression</option>
                                <option value="Uyo (HQ)" className={theme === "light" ? "bg-white text-slate-900" : "bg-[#120524]"}>Uyo (HQ)</option>
                                <option value="Calabar" className={theme === "light" ? "bg-white text-slate-900" : "bg-[#120524]"}>Calabar</option>
                              </select>
                              <div className={`absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-[10px] ${theme === "light" ? "text-slate-400" : "text-white/40"}`}>▼</div>
                            </div>
                          </div>
                        </>
                     )}

                     {regData.role === 'GLOBAL_ADMIN' && (
                       <GlassCard className={`p-4 border text-xs flex gap-2.5 leading-relaxed ${theme === "light" ? "border-amber-200 bg-amber-50 text-amber-800" : "border-amber-505/20 bg-amber-500/5 text-amber-200"}`}>
                         <ShieldCheck className={`w-5 h-5 shrink-0 mt-0.5 ${theme === "light" ? "text-amber-600" : "text-amber-400"}`} />
                         <span>
                           <strong>Global Administrator role selected.</strong> Users in this role oversee administration across all Church Expressions/Branches. Your request will require manual approval from HQ leadership. No Church Expressions/Branches designation is needed.
                         </span>
                       </GlassCard>
                     )}

                     {regData.role === 'FOUNDATION_SCHOOL' && (
                       <GlassCard className={`p-4 border text-xs flex gap-2.5 leading-relaxed ${theme === "light" ? "border-royal-purple/20 bg-royal-purple/5 text-royal-purple" : "border-white/10 bg-white/5 text-lilac"}`}>
                         <GraduationCap className="w-5 h-5 shrink-0 mt-0.5 text-royal-purple" />
                         <span>
                           <strong>Foundation School Coordinator.</strong> You will serve directly under the specified City Expression, leading and coordinating discipleship classes and student graduations.
                         </span>
                       </GlassCard>
                     )}

                     {regData.role === 'HOME_CELL_COORD' && (
                       <GlassCard className={`p-4 border text-xs flex gap-2.5 leading-relaxed ${theme === "light" ? "border-royal-purple/20 bg-royal-purple/5 text-royal-purple" : "border-white/10 bg-white/5 text-lilac"}`}>
                         <Home className="w-5 h-5 shrink-0 mt-0.5 text-royal-purple" />
                         <span>
                           <strong>Home Cell Coordinator.</strong> You serve directly under this City Expression\'s oversight, leading and supervising all local fellowship Home Cell Units.
                         </span>
                       </GlassCard>
                     )}

                     {regData.role === 'DEPT_LEADER' && (
                          <div className="space-y-1">
                            <label className={`text-[11px] uppercase tracking-wider font-bold ml-1 ${theme === "light" ? "text-slate-500" : "text-lilac/70"}`}>Your Department</label>
                            <div className="relative">
                              <Building className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${theme === "light" ? "text-slate-400" : "text-white/40"}`} />
                              <select 
                                className={`w-full rounded-xl py-3 pl-10 pr-10 text-sm focus:outline-none focus:ring-1 appearance-none cursor-pointer transition-all ${theme === "light" ? "bg-slate-50 border border-slate-300 text-slate-900 focus:border-royal-purple focus:ring-royal-purple/40" : "bg-black/45 border border-white/10 text-white focus:border-royal-purple focus:ring-royal-purple/40"}`}
                                value={regData.unitName}
                                onChange={(e) => setRegData({...regData, unitName: e.target.value})}
                              >
                                <option value="" disabled className={theme === "light" ? "bg-white text-slate-900" : "bg-[#120524]"}>Select Department</option>
                                <option value="Media" className={theme === "light" ? "bg-white text-slate-900" : "bg-[#120524]"}>Media</option>
                                <option value="The Living Portals (Choir)" className={theme === "light" ? "bg-white text-slate-900" : "bg-[#120524]"}>The Living Portals (Choir)</option>
                                <option value="Technical" className={theme === "light" ? "bg-white text-slate-900" : "bg-[#120524]"}>Technical</option>
                                <option value="Ushering" className={theme === "light" ? "bg-white text-slate-900" : "bg-[#120524]"}>Ushering</option>
                                <option value="Pastoral Team / Greeters" className={theme === "light" ? "bg-white text-slate-900" : "bg-[#120524]"}>Pastoral Team / Greeters</option>
                                <option value="Evangelism & Missions" className={theme === "light" ? "bg-white text-slate-900" : "bg-[#120524]"}>Evangelism & Missions</option>
                                <option value="Welfare" className={theme === "light" ? "bg-white text-slate-900" : "bg-[#120524]"}>Welfare</option>
                                <option value="Children’s Church" className={theme === "light" ? "bg-white text-slate-900" : "bg-[#120524]"}>Children’s Church</option>
                                <option value="Teens Church" className={theme === "light" ? "bg-white text-slate-900" : "bg-[#120524]"}>Teens Church</option>
                                <option value="Intercessory" className={theme === "light" ? "bg-white text-slate-900" : "bg-[#120524]"}>Intercessory</option>
                                <option value="Protocol" className={theme === "light" ? "bg-white text-slate-900" : "bg-[#120524]"}>Protocol</option>
                                <option value="Follow-up" className={theme === "light" ? "bg-white text-slate-900" : "bg-[#120524]"}>Follow-up</option>
                                <option value="Pistis Art" className={theme === "light" ? "bg-white text-slate-900" : "bg-[#120524]"}>Pistis Art</option>
                                <option value="Sanctuary Keepers" className={theme === "light" ? "bg-white text-slate-900" : "bg-[#120524]"}>Sanctuary Keepers</option>
                              </select>
                              <div className={`absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-[10px] ${theme === "light" ? "text-slate-400" : "text-white/40"}`}>▼</div>
                            </div>
                          </div>
                       )}

                       {['CELL_LEADER', 'INTEREST_GROUP_LEADER'].includes(regData.role) && (
                         <div className="space-y-1">
                           <label className={`text-[11px] uppercase tracking-wider font-bold ml-1 ${theme === "light" ? "text-slate-500" : "text-lilac/70"}`}>Specific Unit, Cell, or Group Name</label>
                           <div className="relative">
                             <Building className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${theme === "light" ? "text-slate-400" : "text-white/40"}`} />
                             <input 
                               type="text" 
                               placeholder={`e.g. Hope Center, Teens Fellowship B`} 
                               className={`w-full rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 transition-all ${theme === "light" ? "bg-slate-50 border border-slate-300 text-slate-900 focus:border-royal-purple focus:ring-royal-purple/40 placeholder:text-slate-400" : "bg-black/45 border border-white/10 text-white focus:border-royal-purple focus:ring-royal-purple/40 placeholder:text-white/20"}`}
                               value={regData.unitName}
                               onChange={(e) => setRegData({...regData, unitName: e.target.value})}
                             />
                           </div>
                         </div>
                      )}

                      <div className={`flex justify-between items-center mt-5 pt-3 border-t ${theme === "light" ? "border-slate-100" : "border-white/5"}`}>
                        <button 
                          type="button" 
                          onClick={prevStep} 
                          className={`flex items-center gap-1 text-xs uppercase tracking-wider font-bold cursor-pointer transition-colors ${theme === "light" ? "text-slate-500 hover:text-slate-800" : "text-lavender hover:text-white"}`}
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
                       <h3 className={`font-bold text-base ${theme === "light" ? "text-slate-900" : "text-white"}`}>Account Details</h3>
                       <p className={`text-[11px] mt-0.5 ${theme === "light" ? "text-slate-500" : "text-lilac/60"}`}>Enter your contact details. A unique secure access key will be generated for your login.</p>
                     </div>
                     
                     <div className="space-y-1">
                        <label className={`text-[11px] uppercase tracking-wider font-bold ml-1 ${theme === "light" ? "text-slate-500" : "text-lilac/70"}`}>Full Name</label>
                        <div className="relative">
                          <UserIcon className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${theme === "light" ? "text-slate-400" : "text-white/40"}`} />
                          <input 
                            type="text" 
                            placeholder="e.g. Samuel Adebayo" 
                            required 
                            className={`w-full rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 transition-all ${theme === "light" ? "bg-slate-50 border border-slate-300 text-slate-900 focus:border-royal-purple focus:ring-royal-purple/40 placeholder:text-slate-400" : "bg-black/45 border border-white/10 text-white focus:border-royal-purple focus:ring-royal-purple/40 placeholder:text-white/20"}`} 
                            value={regData.fullName} 
                            onChange={(e) => setRegData({...regData, fullName: e.target.value})} 
                          />
                        </div>
                     </div>
                     <div className="space-y-1">
                        <label className={`text-[11px] uppercase tracking-wider font-bold ml-1 ${theme === "light" ? "text-slate-500" : "text-lilac/70"}`}>Email Address</label>
                        <div className="relative">
                          <Mail className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${theme === "light" ? "text-slate-400" : "text-white/40"}`} />
                          <input 
                            type="email" 
                            placeholder="e.g. samuel@domain.com" 
                            required 
                            className={`w-full rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 transition-all ${theme === "light" ? "bg-slate-50 border border-slate-300 text-slate-900 focus:border-royal-purple focus:ring-royal-purple/40 placeholder:text-slate-400" : "bg-black/45 border border-white/10 text-white focus:border-royal-purple focus:ring-royal-purple/40 placeholder:text-white/20"}`} 
                            value={regData.email} 
                            onChange={(e) => setRegData({...regData, email: e.target.value})} 
                          />
                        </div>
                     </div>
                     <div className="space-y-1">
                        <label className="hidden">Access Verification Card</label>
                         <div className={`p-4 mb-4 rounded-xl border flex gap-3 text-xs leading-relaxed ${
                          theme === "light" 
                            ? "bg-indigo-50/50 border-indigo-100 text-[#0f172a]" 
                            : "bg-indigo-500/5 border-indigo-500/10 text-indigo-200"
                        }`}>
                          <KeyRound className={`w-5 h-5 shrink-0 mt-0.5 ${theme === "light" ? "text-indigo-600" : "text-[#B193FB]"}`} />
                          <span>
                            <strong>Passwordless Secure Key Delivery.</strong> To maintain absolute church registry safety, a unique personalized secure entry key card will be automatically generated and dispatched directly to your inbox alongside your registration confirmation!
                          </span>
                        </div>
                        <div className="hidden">
                        <div className="relative">
                          <Lock className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${theme === "light" ? "text-slate-400" : "text-white/40"}`} />
                          <input 
                            type={showRegPassword ? "text" : "password"} 
                            placeholder="Minimum 8 characters"
                            className={`w-full rounded-xl py-3 pl-10 pr-11 text-sm focus:outline-none focus:ring-1 transition-all ${theme === "light" ? "bg-slate-50 border border-slate-300 text-slate-900 focus:border-royal-purple focus:ring-royal-purple/40 placeholder:text-slate-400" : "bg-black/45 border border-white/10 text-white focus:border-royal-purple focus:ring-royal-purple/40 placeholder:text-white/20"}`} 
                            value={regData.password} 
                            onChange={(e) => setRegData({...regData, password: e.target.value})} 
                          />
                          <button 
                            type="button" 
                            onClick={() => setShowRegPassword(!showRegPassword)} 
                            className={`absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors cursor-pointer ${theme === "light" ? "text-slate-400 hover:text-slate-600" : "text-white/40 hover:text-white"}`}
                          >
                            {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        </div>
                     </div>

                     <div className={`flex justify-between items-center mt-5 pt-3 border-t ${theme === "light" ? "border-slate-100" : "border-white/5"}`}>
                        <button 
                          type="button" 
                          onClick={prevStep} 
                          className={`flex items-center gap-1 text-xs uppercase tracking-wider font-bold cursor-pointer transition-colors ${theme === "light" ? "text-slate-500 hover:text-slate-800" : "text-lavender hover:text-white"}`}
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
                    <br/><br/>
                    <strong className="text-white/90">Please check your email. We have dispatched your initial secure access key.</strong>
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
        
      </motion.div>
    </div>
  );
}
