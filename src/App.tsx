import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import Tasks from "./pages/Tasks";
import Bugs from "./pages/Bugs";
import TimeLogs from "./pages/TimeLogs";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <div className="flex h-screen items-center justify-center">Loading...</div>;
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <div className="flex h-screen items-center justify-center">Loading...</div>;
  return !isAuthenticated ? <>{children}</> : <Navigate to="/dashboard" />;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Navigate to="/dashboard" />} />
    <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
    <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
    <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
    <Route path="/projects" element={<PrivateRoute><Projects /></PrivateRoute>} />
    <Route path="/tasks" element={<PrivateRoute><Tasks /></PrivateRoute>} />
    <Route path="/bugs" element={<PrivateRoute><Bugs /></PrivateRoute>} />
    <Route path="/timelogs" element={<PrivateRoute><TimeLogs /></PrivateRoute>} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
