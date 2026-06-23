import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AppLayout } from "./layout/AppLayout";
import { Dashboard } from "./pages/Dashboard";
import { Branches } from "./pages/Branches";
import { Finance } from "./pages/Finance";
import { Departments } from "./pages/Departments";
import { HomeCells } from "./pages/HomeCells";
import { InterestGroups } from "./pages/InterestGroups";
import { Directory } from "./pages/Directory";
import { MembersDirectory } from "./pages/MembersDirectory";
import { Reports } from "./pages/Reports";
import { Login } from "./pages/Login";
import { Approvals } from "./pages/Approvals";
import { Settings } from "./pages/Settings";
import { FoundationSchool } from "./pages/FoundationSchool";
import { useAppStore, Role } from "./store/useAppStore";
import { InstallPrompt } from "@/components/ui/InstallPrompt";
import { ConnectionToast } from "@/components/ui/ConnectionToast";
import { NotificationService } from "@/services/notificationService";
import { supabase } from "./lib/supabase";

const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: Role[] }) => {
  const user = useAppStore((state) => state.user);
  const location = useLocation();

  useEffect(() => {
    NotificationService.requestPermission();
    if (user?.role) {
      NotificationService.scheduleDeadlineAlerts(user.role);
    }
  }, [user?.role]);

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If user's role is not allowed to see this specific nested route, just send them to dashboard
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as any });
  }, [pathname]);

  return null;
}

export default function App() {
  const setIsOnline = useAppStore(state => state.setIsOnline);
  const theme = useAppStore(state => state.theme || "dark");
  const user = useAppStore(state => state.user);

  useEffect(() => {
    if (!user) return;

    const verifyUserSession = async () => {
      // Offline/master/seed logins bypass DB verification
      if (user.id === "home-cell-coord-master") return;

      const validateOffline = () => {
        const localP = localStorage.getItem("local_profiles");
        if (localP) {
          const list = JSON.parse(localP);
          const localProfile = list.find((p: any) => p.id === user.id || p.email === user.email);
          if (localProfile && (localProfile.status === "PENDING" || localProfile.status === "REJECTED")) {
            console.log("Local offline profile status is not approved.");
            useAppStore.getState().logout();
            return true;
          }
        }
        return false;
      };

      try {
        if (!navigator.onLine) {
          validateOffline();
          return;
        }

        const { data: profile, error } = await supabase
          .from("profiles")
          .select("id, status")
          .eq("id", user.id)
          .maybeSingle();

        if (error) {
          console.warn("Failed to verify user profile state:", error);
          if (validateOffline()) return;
        }

        // If no profile, or if status is not APPROVED, sign out!
        if (!profile || profile.status === "PENDING" || profile.status === "REJECTED") {
          console.log("Active user profile is no longer active (status: " + (profile?.status || 'deleted') + "). Logging out...");
          
          try {
            await supabase.auth.signOut();
          } catch (e) {}

          // Purge local cached profile copy so registration is also clean locally
          try {
            const localP = localStorage.getItem("local_profiles");
            if (localP) {
              const list = JSON.parse(localP);
              const filteredList = list.filter((p: any) => p.id !== user.id && p.email !== user.email);
              localStorage.setItem("local_profiles", JSON.stringify(filteredList));
            }
          } catch (e) {}

          useAppStore.getState().logout();
        }
      } catch (err) {
        console.error("Error verifying active session:", err);
      }
    };

    verifyUserSession();

    // Set up real-time role-based push notification channels
    const unitReportsChannel = supabase
      .channel("global_unit_reports_notifications")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "unit_reports" },
        (payload) => {
          NotificationService.handleRealtimeUnitReportEvent(payload, user);
        }
      )
      .subscribe();

    const branchReportsChannel = supabase
      .channel("global_branch_reports_notifications")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "branch_reports" },
        (payload) => {
          NotificationService.handleRealtimeBranchReportEvent(payload, user);
        }
      )
      .subscribe();

    const profilesChannel = supabase
      .channel("global_profiles_notifications")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        (payload) => {
          NotificationService.handleRealtimeProfileEvent(payload, user);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(unitReportsChannel);
      supabase.removeChannel(branchReportsChannel);
      supabase.removeChannel(profilesChannel);
    };
  }, [user]);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === "light") {
      root.classList.add("light");
    } else {
      root.classList.remove("light");
    }
  }, [theme]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setIsOnline]);

  return (
    <>
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route path="/login" element={<Login />} />
          
          {/* Protected Dashboard Routes */}
          <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="branches" element={<ProtectedRoute allowedRoles={['GLOBAL_ADMIN']}><Branches /></ProtectedRoute>} />
            <Route path="approvals" element={<ProtectedRoute allowedRoles={['GLOBAL_ADMIN', 'BRANCH_ADMIN']}><Approvals /></ProtectedRoute>} />
            <Route path="finance" element={<Finance />} />
            <Route path="departments" element={<ProtectedRoute allowedRoles={['GLOBAL_ADMIN', 'BRANCH_ADMIN', 'DEPT_LEADER']}><Departments /></ProtectedRoute>} />
            <Route path="homecells" element={<ProtectedRoute allowedRoles={['GLOBAL_ADMIN', 'BRANCH_ADMIN', 'HOME_CELL_COORD']}><HomeCells /></ProtectedRoute>} />
            <Route path="interest" element={<ProtectedRoute allowedRoles={['GLOBAL_ADMIN', 'BRANCH_ADMIN', 'INTEREST_GROUP_LEADER']}><InterestGroups /></ProtectedRoute>} />
            <Route path="foundationschool" element={<ProtectedRoute allowedRoles={['GLOBAL_ADMIN', 'BRANCH_ADMIN', 'FOUNDATION_SCHOOL']}><FoundationSchool /></ProtectedRoute>} />
            <Route path="directory" element={<Directory />} />
            <Route path="members" element={<MembersDirectory />} />
            <Route path="reports" element={<Reports />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <InstallPrompt />
      <ConnectionToast />
    </>
  );
}
