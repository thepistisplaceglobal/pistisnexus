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

