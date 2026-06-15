import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { get, set as idbSet, del } from "idb-keyval";
import { supabase } from "@/lib/supabase";
import { ActivityService } from "@/services/activityService";

export type Role = "GLOBAL_ADMIN" | "BRANCH_ADMIN" | "DEPT_LEADER" | "CELL_LEADER" | "INTEREST_GROUP_LEADER";

export interface User {
  id: string;
  email?: string;
  name: string;
  role: Role;
  branchName?: string;
  deptName?: string;
  groupName?: string;
  hasCompletedOnboarding?: boolean;
  hasCompletedTour?: boolean;
  baseMembership?: number;
  unitStructureName?: string; // e.g. 'Teams', 'Zones', 'Squads'
  avatar_url?: string;
}

export interface LeaderContact {
  id: string;
  name: string;
  role: string;
  group_name: string;
  branch: string;
  region: string;
  location: string;
  email: string;
  phone: string;
  active: boolean;
}

export interface GlobalMessage {
  id: string;
  content: string;
  author_name: string;
  author_role: string;
  target_audience: string;
  created_at: string;
}

export interface BranchMessage {
  id: string;
  content: string;
  author_name: string;
  author_role: string;
  branch_name: string;
  created_at: string;
}

export interface PasswordRequest {
  id: string;
  userId: string;
  userEmail: string;
  branchName?: string;
  unitName?: string;
  role: string;
  newPassword?: string; 
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: string;
  country: string;
  branch_name: string;
  unit_name: string;
  status: string;
  created_at: string;
}

export interface PendingAction {
  id: string;
  type: string;
  payload: any;
  timestamp: string;
}

interface AppState {
  user: User | null;
  onlineUsers: Set<string>;
  setOnlineUsers: (users: Set<string>) => void;
  isOnline: boolean;
  setIsOnline: (status: boolean) => void;
  pendingActions: PendingAction[];
  addPendingAction: (action: Omit<PendingAction, 'id' | 'timestamp'>) => void;
  clearPendingActions: () => void;
  syncPendingActions: () => Promise<void>;
  login: (user: User) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  currentModule: string;
  setCurrentModule: (module: string) => void;
  metrics: {
    totalAttendance: number;
    totalIncome: number;
    growthRate: number;
    activeCells: number;
  };
  leaders: LeaderContact[];
  fetchLeaders: () => Promise<void>;
  addLeader: (leader: LeaderContact) => Promise<void>;
  updateLeader: (id: string, leader: Partial<LeaderContact>) => Promise<void>;
  deleteLeader: (id: string) => Promise<void>;
  globalMessages: GlobalMessage[];
  fetchGlobalMessages: () => Promise<void>;
  sendGlobalMessage: (message: Omit<GlobalMessage, 'id' | 'created_at'>) => Promise<void>;
  branchMessages: BranchMessage[];
  fetchBranchMessages: (branchName: string) => Promise<void>;
  sendBranchMessage: (message: Omit<BranchMessage, 'id' | 'created_at'>) => Promise<void>;
  passwordRequests: PasswordRequest[];
  requestPasswordChange: (req: PasswordRequest) => void;
  updatePasswordRequestStatus: (id: string, status: "APPROVED" | "REJECTED") => void;
  profiles: Profile[];
  setProfiles: (profiles: Profile[]) => void;
  fetchProfiles: (currentUser: User | null) => Promise<void>;
  updateProfileStatus: (id: string, updates: Partial<Profile>) => Promise<void>;
  clearTestData: (currentUser: User | null) => Promise<void>;
  bulkDeleteDatabaseRecords: (tables: string[]) => Promise<{ success: boolean; results: Record<string, { deleted: number; error?: string }> }>;
}

const idbStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return (await get(name)) || null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await idbSet(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await del(name);
  },
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      onlineUsers: new Set<string>(),
      setOnlineUsers: (users: Set<string>) => set({ onlineUsers: users }),
      isOnline: navigator.onLine,
      setIsOnline: (status) => set({ isOnline: status }),
      pendingActions: [],
      addPendingAction: (action) => set((state) => ({ 
        pendingActions: [...state.pendingActions, { 
          ...action, 
          id: Date.now().toString() + Math.random().toString(36).substring(2), 
          timestamp: new Date().toISOString() 
        }] 
      })),
      clearPendingActions: () => set({ pendingActions: [] }),
      syncPendingActions: async () => {
        const { pendingActions, isOnline, clearPendingActions } = get();
        if (!isOnline || pendingActions.length === 0) return;
        
        // Simulating sync processing logic
        console.log(`Syncing ${pendingActions.length} actions...`);
        for (const action of pendingActions) {
           console.log(`Processing ${action.type}`, action.payload);
           // In a real app we'd dispatch back to API methods
           await new Promise(r => setTimeout(r, 300));
        }
        
        clearPendingActions();
      },
      login: (user) => set({ user }),
      logout: () => set({ user: null }),
      updateUser: (updates) => set((state) => ({ user: state.user ? { ...state.user, ...updates } : null })),
      currentModule: "Dashboard",
      setCurrentModule: (module) => set({ currentModule: module }),
      metrics: {
        totalAttendance: 12450,
        totalIncome: 154200,
        growthRate: 14.5,
        activeCells: 86,
      },
      leaders: [],
      fetchLeaders: async () => {
        try {
          const { data, error } = await supabase.from('leaders').select('*');
          if (error) {
            console.error("Error fetching leaders:", error);
            return;
          }
          if (data) {
            set({ leaders: data as LeaderContact[] });
          }
        } catch (err) {
          console.error(err);
        }
      },
      addLeader: async (leader) => {
        const { isOnline, addPendingAction } = get();
        if (!isOnline) {
           addPendingAction({ type: 'ADD_LEADER', payload: leader });
           set((state) => ({ leaders: [...state.leaders, { ...leader, id: Date.now().toString() }] }));
           return;
        }
        try {
          const { id, ...insertData } = leader;
          const { data, error } = await supabase.from('leaders').insert([insertData]).select();
          if (error) {
            console.error("Error adding leader:", error.message);
            set((state) => ({ leaders: [...state.leaders, leader] }));
          } else if (data) {
            set((state) => ({ leaders: [...state.leaders, data[0] as LeaderContact] }));
          }
        } catch (err) {
          console.error(err);
        }
      },
      updateLeader: async (id, updatedFields) => {
        const { isOnline, addPendingAction } = get();
        if (!isOnline) {
           addPendingAction({ type: 'UPDATE_LEADER', payload: { id, updatedFields } });
           set((state) => ({
             leaders: state.leaders.map((l) => l.id === id ? { ...l, ...updatedFields } : l)
           }));
           return;
        }
        try {
          const { error } = await supabase.from('leaders').update(updatedFields).eq('id', id);
          if (error) console.error("Error updating leader:", error);
          set((state) => ({
            leaders: state.leaders.map((l) => l.id === id ? { ...l, ...updatedFields } : l)
          }));
        } catch (err) {
          console.error(err);
        }
      },
      deleteLeader: async (id) => {
        const currentUser = get().user;
        if (!currentUser || (currentUser.role !== "GLOBAL_ADMIN" && currentUser.role !== "BRANCH_ADMIN")) {
          throw new Error("Unauthorized: Only branch or global administrators can delete leaders.");
        }

        const leader = get().leaders.find(l => l.id === id);
        if (leader && currentUser.role === "BRANCH_ADMIN" && leader.branch !== currentUser.branchName) {
          throw new Error("Unauthorized: You can only delete leaders within your assigned branch.");
        }

        const { isOnline, addPendingAction } = get();
        if (!isOnline) {
           addPendingAction({ type: 'DELETE_LEADER', payload: { id } });
           set((state) => ({
             leaders: state.leaders.filter((l) => l.id !== id)
           }));
           return;
        }
        try {
          const { error } = await supabase.from('leaders').delete().eq('id', id);
          if (error) console.error("Error deleting leader:", error);
          set((state) => ({
            leaders: state.leaders.filter((l) => l.id !== id)
          }));
        } catch (err) {
          console.error(err);
        }
      },
      globalMessages: [],
      fetchGlobalMessages: async () => {
        try {
          const { data, error } = await supabase
            .from('global_messages')
            .select('*')
            .order('created_at', { ascending: false });
          if (error) {
            console.error("Error fetching global messages:", error);
            return;
          }
          if (data) {
            set({ globalMessages: data as GlobalMessage[] });
          }
        } catch (err) {
          console.error(err);
        }
      },
      sendGlobalMessage: async (message) => {
        try {
          const { data, error } = await supabase.from('global_messages').insert([message]).select();
          if (error) {
            console.error("Error sending message:", error);
          } else if (data && data.length > 0) {
            set((state) => ({ globalMessages: [data[0] as GlobalMessage, ...state.globalMessages] }));
            
            // Log in activity logs
            await ActivityService.logActivity({
              user_name: message.author_name,
              user_role: message.author_role || "GLOBAL_ADMIN",
              branch_name: null,
              action_type: "GLOBAL_ANNOUNCEMENT",
              details: `Broadcasted global bulletin: "${message.content.slice(0, 60)}${message.content.length > 60 ? '...' : ''}"`
            });
          }
        } catch (err) {
          console.error(err);
        }
      },
      branchMessages: [],
      fetchBranchMessages: async (branchName) => {
        try {
          const { data, error } = await supabase
            .from('branch_messages')
            .select('*')
            .eq('branch_name', branchName)
            .order('created_at', { ascending: false });
          if (error) {
            console.error("Error fetching branch messages:", error);
            return;
          }
          if (data) {
            set({ branchMessages: data as BranchMessage[] });
          }
        } catch (err) {
          console.error(err);
        }
      },
      sendBranchMessage: async (message) => {
        try {
          const { data, error } = await supabase.from('branch_messages').insert([message]).select();
          if (error) {
            console.error("Error sending branch message:", error);
          } else if (data && data.length > 0) {
            set((state) => ({ branchMessages: [data[0] as BranchMessage, ...state.branchMessages] }));

            // Log in activity logs
            await ActivityService.logActivity({
              user_name: message.author_name,
              user_role: message.author_role || "BRANCH_ADMIN",
              branch_name: message.branch_name,
              action_type: "BRANCH_UPDATE",
              details: `Posted local update for ${message.branch_name}: "${message.content.slice(0, 60)}${message.content.length > 60 ? '...' : ''}"`
            });
          }
        } catch (err) {
          console.error(err);
        }
      },
      passwordRequests: [],
      requestPasswordChange: (req) => set((state) => ({ passwordRequests: [req, ...state.passwordRequests] })),
      updatePasswordRequestStatus: (id, status) => set((state) => ({
        passwordRequests: state.passwordRequests.map(r => r.id === id ? { ...r, status } : r)
      })),
      profiles: [],
      setProfiles: (profiles) => set({ profiles }),
      fetchProfiles: async (currentUser) => {
        let profilesList: Profile[] = [];
        try {
          let query = supabase.from("profiles").select("*");
          if (currentUser?.role === "GLOBAL_ADMIN") {
            query = query.in("role", ["GLOBAL_ADMIN", "BRANCH_ADMIN"]);
          } else if (currentUser?.role === "BRANCH_ADMIN") {
            query = query.eq("branch_name", currentUser.branchName || "");
            query = query.not("role", "in", '("GLOBAL_ADMIN", "BRANCH_ADMIN")');
          }
          const { data, error } = await query;
          if (!error && data) {
            profilesList = data as Profile[];
          }
        } catch (err) {
          console.warn("Global profiles fetch bypassed:", err);
        }

        // Merge with local storage
        try {
          const localProfilesStr = localStorage.getItem("local_profiles");
          const localProfiles: Profile[] = localProfilesStr ? JSON.parse(localProfilesStr) : [];
          
          if (profilesList.length === 0 && localProfiles.length === 0) {
            const defaultCollection: Profile[] = [
              {
                id: "seed-leader-chidi",
                email: "chidi.media@pistisnexus.com",
                full_name: "Chidi Nwachukwu",
                role: "DEPT_LEADER",
                country: "Nigeria",
                branch_name: currentUser?.branchName || "Uyo (HQ)",
                unit_name: "Media Department",
                status: "PENDING",
                created_at: new Date(Date.now() - 3600000 * 2).toISOString()
              },
              {
                id: "seed-leader-amina",
                email: "amina.calabar@pistisnexus.com",
                full_name: "Amina Henshaw",
                role: "CELL_LEADER",
                country: "Nigeria",
                branch_name: currentUser?.branchName || "Calabar",
                unit_name: "Calabar Central Cell 3",
                status: "PENDING",
                created_at: new Date(Date.now() - 3600000 * 5).toISOString()
              },
              {
                id: "seed-leader-emeka",
                email: "emeka.music@pistisnexus.com",
                full_name: "Emeka Okafor",
                role: "DEPT_LEADER",
                country: "Nigeria",
                branch_name: currentUser?.branchName || "Uyo (HQ)",
                unit_name: "Music & Creative Arts",
                status: "APPROVED",
                created_at: new Date(Date.now() - 3600000 * 24).toISOString()
              },
              {
                id: "seed-leader-funke",
                email: "funke.usher@pistisnexus.com",
                full_name: "Funke Adebayo",
                role: "DEPT_LEADER",
                country: "Nigeria",
                branch_name: currentUser?.branchName || "Lagos HQ",
                unit_name: "Ushering Association",
                status: "APPROVED",
                created_at: new Date(Date.now() - 3600000 * 36).toISOString()
              }
            ];
            localStorage.setItem("local_profiles", JSON.stringify(defaultCollection));
            profilesList = defaultCollection;
          } else {
            const mergedMap = new Map<string, Profile>();
            localProfiles.forEach((p: Profile) => mergedMap.set(p.id, p));
            profilesList.forEach((p: Profile) => mergedMap.set(p.id, p));
            profilesList = Array.from(mergedMap.values());
            localStorage.setItem("local_profiles", JSON.stringify(profilesList));
          }
        } catch (e) {
          console.error(e);
        }

        if (currentUser?.role === "GLOBAL_ADMIN") {
          profilesList = profilesList.filter(p => p.role === "GLOBAL_ADMIN" || p.role === "BRANCH_ADMIN");
        } else if (currentUser?.role === "BRANCH_ADMIN") {
          profilesList = profilesList.filter(p => p.branch_name === currentUser.branchName && p.role !== "GLOBAL_ADMIN" && p.role !== "BRANCH_ADMIN");
        } else {
          profilesList = [];
        }

        set({ profiles: profilesList });
      },
      updateProfileStatus: async (id, statusUpdates) => {
        try {
          await supabase.from("profiles").update(statusUpdates).eq("id", id);
        } catch (err) {
          console.warn(err);
        }

        // Always update local storage
        try {
          const localProfilesStr = localStorage.getItem("local_profiles");
          if (localProfilesStr) {
            const localProfiles: Profile[] = JSON.parse(localProfilesStr);
            const updated = localProfiles.map(p => p.id === id ? { ...p, ...statusUpdates } : p);
            localStorage.setItem("local_profiles", JSON.stringify(updated));
          }
        } catch (e) {
          console.error(e);
        }

        // Update memory
        set((state) => ({
          profiles: state.profiles.map(p => p.id === id ? { ...p, ...statusUpdates } : p)
        }));
      },
      clearTestData: async (currentUser) => {
        try {
          localStorage.removeItem("local_profiles");
          set({ profiles: [] });
          if (currentUser) {
            let profilesList: Profile[] = [];
            try {
              let query = supabase.from("profiles").select("*");
              if (currentUser?.role === "GLOBAL_ADMIN") {
                query = query.in("role", ["GLOBAL_ADMIN", "BRANCH_ADMIN"]);
              } else if (currentUser?.role === "BRANCH_ADMIN") {
                query = query.eq("branch_name", currentUser.branchName || "");
                query = query.not("role", "in", '("GLOBAL_ADMIN", "BRANCH_ADMIN")');
              }
              const { data, error } = await query;
              if (!error && data) {
                profilesList = data as Profile[];
              }
            } catch (err) {
              console.warn("Global profiles fetch bypassed:", err);
            }

            if (currentUser?.role === "GLOBAL_ADMIN") {
              profilesList = profilesList.filter(p => p.role === "GLOBAL_ADMIN" || p.role === "BRANCH_ADMIN");
            } else if (currentUser?.role === "BRANCH_ADMIN") {
              profilesList = profilesList.filter(p => p.branch_name === currentUser.branchName && p.role !== "GLOBAL_ADMIN" && p.role !== "BRANCH_ADMIN");
            } else {
              profilesList = [];
            }
            set({ profiles: profilesList });
          }
        } catch (e) {
          console.error(e);
        }
      },
      bulkDeleteDatabaseRecords: async (tables) => {
        const results: Record<string, { deleted: number; error?: string }> = {};
        const currentUser = get().user;
        if (!currentUser || (currentUser.role !== "GLOBAL_ADMIN" && currentUser.role !== "BRANCH_ADMIN")) {
          throw new Error("Unauthorized: Only platform administrators can perform bulk database operations.");
        }

        const isGlobalAdmin = currentUser.role === "GLOBAL_ADMIN";
        const branchNameFilter = currentUser.branchName || "";

        for (const table of tables) {
          try {
            let query = supabase.from(table).delete();
            
            // Adjust filters based on role constraints
            if (table === "unit_reports") {
              if (!isGlobalAdmin) {
                query = query.eq("branch_name", branchNameFilter);
              } else {
                query = query.neq("id", "nonexistent-placeholder-id");
              }
            } else if (table === "branch_reports") {
              if (!isGlobalAdmin) {
                query = query.eq("branch_name", branchNameFilter);
              } else {
                query = query.neq("id", "nonexistent-placeholder-id");
              }
            } else if (table === "activity_logs") {
              if (!isGlobalAdmin) {
                query = query.eq("branch_name", branchNameFilter);
              } else {
                query = query.neq("id", "nonexistent-placeholder-id");
              }
            } else if (table === "branch_messages") {
              if (!isGlobalAdmin) {
                query = query.eq("branch_name", branchNameFilter);
              } else {
                query = query.neq("id", "nonexistent-placeholder-id");
              }
            } else if (table === "global_messages") {
              if (!isGlobalAdmin) {
                // Branch Admin cannot delete global messages!
                continue;
              } else {
                query = query.neq("id", "nonexistent-placeholder-id");
              }
            } else if (table === "leaders") {
              if (!isGlobalAdmin) {
                query = query.eq("branch", branchNameFilter);
              } else {
                query = query.neq("id", "nonexistent-placeholder-id");
              }
            } else if (table === "profiles") {
              // Be very careful - NEVER delete the active user, and NEVER delete accepted/approved active users!
              // Only delete PENDING or REJECTED profiles (representing unapproved demo or test accounts/registrants)
              if (!isGlobalAdmin) {
                query = query.eq("branch_name", branchNameFilter).neq("id", currentUser.id).in("status", ["PENDING", "REJECTED"]);
              } else {
                query = query.neq("id", currentUser.id).in("status", ["PENDING", "REJECTED"]);
              }
            }

            const { data, error } = await query.select();

            if (error) {
              results[table] = { deleted: 0, error: error.message };
            } else {
              const count = data ? data.length : 0;
              results[table] = { deleted: count };

              // Update memory state in store
              if (table === "leaders") {
                if (isGlobalAdmin) {
                  set({ leaders: [] });
                } else {
                  set((state) => ({ leaders: state.leaders.filter(l => l.branch !== branchNameFilter) }));
                }
              } else if (table === "global_messages" && isGlobalAdmin) {
                set({ globalMessages: [] });
              } else if (table === "branch_messages") {
                if (isGlobalAdmin) {
                  set({ branchMessages: [] });
                } else {
                  set((state) => ({ branchMessages: state.branchMessages.filter(m => m.branch_name !== branchNameFilter) }));
                }
              } else if (table === "profiles") {
                // Refetch profiles
                await get().fetchProfiles(currentUser);
              }
            }
          } catch (err: any) {
            results[table] = { deleted: 0, error: err.message || String(err) };
          }
        }

        // Always log database purge action to activity stream
        try {
          await ActivityService.logActivity({
            user_name: currentUser.name,
            user_role: currentUser.role,
            branch_name: currentUser.branchName || null,
            action_type: "DATABASE_MAINTENANCE",
            details: `Administered bulk database deletion of records for categories: ${tables.join(", ")}`
          });
        } catch (e) {
          console.warn("Failed to write utility action log:", e);
        }

        return { success: true, results };
      },
    }),
    {
      name: 'pistis-nexus-storage', // unique name
      storage: createJSONStorage(() => idbStorage),
      partialize: (state) => {
        const { onlineUsers, ...rest } = state;
        return rest;
      },
    }
  )
);

