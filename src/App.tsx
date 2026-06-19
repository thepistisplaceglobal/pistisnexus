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
import { Reports } from "./pages/Reports";
import { Login } from "./pages/Login";
import { Approvals } from "./pages/Approvals";
import { Settings } from "./pages/Settings";
import { FoundationSchool } from "./pages/FoundationSchool";
import { useAppStore, Role } from "./store/useAppStore";
import { InstallPrompt } from "@/components/ui/InstallPrompt";
import { ConnectionToast } from "@/components/ui/ConnectionToast";
import { NotificationService } from "@/services/notificationService";

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
            <Route path="departments" element={<ProtectedRoute allowedRoles={['GLOBAL_ADMIN', 'BRANCH_ADMIN']}><Departments /></ProtectedRoute>} />
            <Route path="homecells" element={<ProtectedRoute allowedRoles={['GLOBAL_ADMIN', 'BRANCH_ADMIN', 'DEPT_LEADER', 'CELL_LEADER', 'HOME_CELL_COORD']}><HomeCells /></ProtectedRoute>} />
            <Route path="interest" element={<ProtectedRoute allowedRoles={['GLOBAL_ADMIN', 'BRANCH_ADMIN', 'INTEREST_GROUP_LEADER']}><InterestGroups /></ProtectedRoute>} />
            <Route path="foundationschool" element={<ProtectedRoute allowedRoles={['GLOBAL_ADMIN', 'BRANCH_ADMIN', 'FOUNDATION_SCHOOL']}><FoundationSchool /></ProtectedRoute>} />
            <Route path="directory" element={<Directory />} />
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
