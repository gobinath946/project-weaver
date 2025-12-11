import PullToRefresh from "react-simple-pull-to-refresh";
import { useState, useEffect } from "react";

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import ProtectedRoute from "./auth/ProtectedRoute";
import { ThemeProvider } from "@/components/theme-provider";

// Pages
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import RegisterCompany from "./pages/RegisterCompany";
import NoAccess from "./pages/NoAccess";
import Unauthorized from "./pages/Unauthorized";

// Master Admin Pages
import MasterDashboard from "./pages/master_admin/Dashboard";
import MasterCompanies from "./pages/master_admin/Companies";
import MasterPlans from "./pages/master_admin/Plans";
import MasterSettings from "./pages/master_admin/Settings";
import Permissions from './pages/master_admin/Permissions';
import MasterDropdownMaster from "./pages/master_admin/DropdownMaster";
import CustomModuleConfig from "./pages/master_admin/CustomModuleConfig";
import WebsiteMaintenance from "./pages/master_admin/WebsiteMaintenance";
import GlobalLogs from "./pages/master_admin/GlobalLogs";
import CompanyUsers from "./pages/company/Users";
import CompanySettings from "./pages/company/Settings";
import DropdownMaster from "./pages/company/DropdownMaster";
import UserPermissions from './pages/company/UserPermissions';
import NotFound from "./pages/NotFound";

// Project Management Pages
import ProjectList from "./pages/company/project_management/ProjectList";
import TaskList from "./pages/company/project_management/TaskList";
import BugList from "./pages/company/project_management/BugList";
import TimeLogList from "./pages/company/project_management/TimeLogList";
import ProjectDashboard from "./pages/company/project_management/ProjectDashboard";
import PMDashboard from "./pages/company/project_management/Dashboard";
import ProjectOverview from "./pages/company/project_management/ProjectOverview";
import MyProjectDetail from "./pages/company/project_management/MyProjectDetail";

const queryClient = new QueryClient();

const handleRefresh = async () => {
  window.location.reload();
};

const App = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const routesContent = (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register-company" element={<RegisterCompany />} />
      <Route path="/no-access" element={<NoAccess />} />
      <Route path="/unauthorized" element={<Unauthorized />} />
      
      {/* Master Admin Routes */}
      <Route path="/master/dashboard" element={
        <ProtectedRoute allowedRoles={['master_admin']}>
          <MasterDashboard />
        </ProtectedRoute>
      } />
      <Route path="/master/companies" element={
        <ProtectedRoute allowedRoles={['master_admin']}>
          <MasterCompanies />
        </ProtectedRoute>
      } />
      <Route path="/master/plans" element={
        <ProtectedRoute allowedRoles={['master_admin']}>
          <MasterPlans />
        </ProtectedRoute>
      } />
      <Route path="/master/permissions" element={
        <ProtectedRoute allowedRoles={['master_admin']}>
          <Permissions />
        </ProtectedRoute>
      } />

      <Route path="/master/global-logs" element={
        <ProtectedRoute allowedRoles={['master_admin']}>
          <GlobalLogs />
        </ProtectedRoute>
      } />
  
      <Route path="/master/dropdowns" element={
        <ProtectedRoute allowedRoles={['master_admin']}>
          <MasterDropdownMaster />
        </ProtectedRoute>
      } />
      <Route path="/master/custom-modules" element={
        <ProtectedRoute allowedRoles={['master_admin']}>
          <CustomModuleConfig />
        </ProtectedRoute>
      } />
      <Route path="/master/maintenance" element={
        <ProtectedRoute allowedRoles={['master_admin']}>
          <WebsiteMaintenance />
        </ProtectedRoute>
      } />
      <Route path="/master/settings" element={
        <ProtectedRoute allowedRoles={['master_admin']}>
          <MasterSettings />
        </ProtectedRoute>
      } />
      
      {/* Company Routes */}
      <Route path="/company/dashboard" element={
        <ProtectedRoute allowedRoles={['company_super_admin', 'company_admin']} requiredModule="project_dashboard">
          <PMDashboard />
        </ProtectedRoute>
      } />
      <Route path="/company/users" element={
        <ProtectedRoute allowedRoles={['company_super_admin']} requiredModule="project_user">
          <CompanyUsers />
        </ProtectedRoute>
      } />
      <Route path="/company/permissions" element={
        <ProtectedRoute allowedRoles={['company_super_admin']} requiredModule="project_permission">
          <UserPermissions />
        </ProtectedRoute>
      } />

      <Route path="/company/settings" element={
        <ProtectedRoute allowedRoles={['company_super_admin']} requiredModule="company_settings">
          <CompanySettings />
        </ProtectedRoute>
      } />
      <Route path="/company/dropdown-master" element={
        <ProtectedRoute allowedRoles={['company_super_admin']} requiredModule="dropdown_master">
          <DropdownMaster />
        </ProtectedRoute>
      } />

      <Route path="/company/project_list" element={
        <ProtectedRoute allowedRoles={['company_super_admin', 'company_admin']} requiredModule="project_management">
          <ProjectList />
        </ProtectedRoute>
      } />
      <Route path="/company/task_list" element={
        <ProtectedRoute allowedRoles={['company_super_admin', 'company_admin']} requiredModule="project_management">
          <TaskList />
        </ProtectedRoute>
      } />
      <Route path="/company/bug_list" element={
        <ProtectedRoute allowedRoles={['company_super_admin', 'company_admin']} requiredModule="project_management">
          <BugList />
        </ProtectedRoute>
      } />
      <Route path="/company/timelog_list" element={
        <ProtectedRoute allowedRoles={['company_super_admin', 'company_admin']} requiredModule="project_management">
          <TimeLogList />
        </ProtectedRoute>
      } />
      <Route path="/company/project/:id/dashboard" element={
        <ProtectedRoute allowedRoles={['company_super_admin', 'company_admin']} requiredModule="project_management">
          <ProjectDashboard />
        </ProtectedRoute>
      } />
      <Route path="/company/project_overview" element={
        <ProtectedRoute allowedRoles={['company_super_admin', 'company_admin']} requiredModule="project_management">
          <ProjectOverview />
        </ProtectedRoute>
      } />
      <Route path="/company/my-projects/:id" element={
        <ProtectedRoute allowedRoles={['company_super_admin', 'company_admin']} requiredModule="project_management">
          <MyProjectDetail />
        </ProtectedRoute>
      } />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="project-hub-theme">
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              {isMobile ? (
                <PullToRefresh onRefresh={handleRefresh}>          
                  {routesContent}
                </PullToRefresh>
              ) : (
                routesContent
              )}
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;