import { useState, FormEvent, useEffect } from "react";
import { GlassCard } from "./GlassCard";
import { useAppStore } from "@/store/useAppStore";

export function OnboardingModal() {
  const { user, updateUser } = useAppStore();
  
  const [baseMembership, setBaseMembership] = useState(user?.baseMembership || 50);
  const [unitStructureName, setUnitStructureName] = useState(user?.unitStructureName || "Units");

  const isAdmin = user && (user.role === 'GLOBAL_ADMIN' || user.role === 'BRANCH_ADMIN');
  const needsOnboarding = user && !user.hasCompletedOnboarding;

  useEffect(() => {
    if (needsOnboarding && isAdmin) {
      updateUser({ hasCompletedOnboarding: true });
    }
  }, [needsOnboarding, isAdmin, updateUser]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    updateUser({
      baseMembership,
      unitStructureName,
      hasCompletedOnboarding: true,
    });
  };

  if (!user || user.hasCompletedOnboarding || isAdmin) return null;

  const getEntityName = () => {
    if (user.role === 'DEPT_LEADER') return user.deptName || 'Department';
    if (user.role === 'CELL_LEADER') return user.groupName || 'Cell Group';
    if (user.role === 'INTEREST_GROUP_LEADER') return user.groupName || 'Interest Group';
    return 'Unit';
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#070112]/95 backdrop-blur-lg p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-lg p-7 relative bg-[#130626] border border-royal-purple/60 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] animate-in zoom-in-95 duration-300">
        <h2 className="text-2xl font-bold text-white mb-2">Welcome to your Dashboard</h2>
        <p className="text-lilac/80 mb-6 text-sm">
          Please configure the initial settings for {getEntityName()} to customize your analytics.
        </p>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-lilac">
              Current Base Membership
            </label>
            <input 
              type="number" 
              required 
              min="1"
              value={baseMembership} 
              onChange={e => setBaseMembership(Number(e.target.value))} 
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-royal-purple focus:ring-1 focus:ring-royal-purple/50 transition-all font-medium" 
              placeholder="e.g. 50" 
            />
            <p className="text-xs text-white/40">This helps baseline your growth trends.</p>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-lilac">
              Sub-unit Structure Name
            </label>
            <select 
              value={unitStructureName} 
              onChange={e => setUnitStructureName(e.target.value)} 
              className="bg-[#1c0f33] border border-white/10 rounded-xl px-4 py-3 text-white cursor-pointer font-medium focus:border-royal-purple focus:ring-1 focus:ring-royal-purple/50 outline-none transition-all"
            >
              <option value="Teams">Teams</option>
              <option value="Zones">Zones</option>
              <option value="Cells">Cells</option>
              <option value="Squads">Squads</option>
              <option value="Units">Units</option>
            </select>
            <p className="text-xs text-white/40">How is {getEntityName()} structured internally?</p>
          </div>

          <button 
            type="submit" 
            className="mt-2 w-full bg-royal-purple hover:bg-royal-purple/80 text-white font-bold py-3 rounded-xl transition-all hover:scale-[1.01] active:scale-[0.99]"
          >
            Complete Setup
          </button>
        </form>
      </div>
    </div>
  );
}
