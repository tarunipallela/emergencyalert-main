import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/lib/auth";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Contacts from "./pages/Contacts";
import Profile from "./pages/Profile";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

/* ---------------- ROLE AWARE PROTECTED ROUTE ---------------- */

const ProtectedRoute = ({
  children,
  allowedRole,
}: {
  children: React.ReactNode;
  allowedRole?: "admin" | "user";
}) => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  if (allowedRole && profile?.role !== allowedRole) {
    // Redirect admin to /admin if trying user route
    if (profile?.role === "admin") {
      return <Navigate to="/admin" replace />;
    }
    // Redirect user to home if trying admin route
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

/* ---------------- PUBLIC ROUTE (AUTO REDIRECT) ---------------- */

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, profile, loading } = useAuth();

  if (loading) return null;

  if (user && profile?.role === "admin") {
    return <Navigate to="/admin" replace />;
  }

  if (user && profile?.role === "user") {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

/* ---------------- MAIN APP ---------------- */

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Auth */}
            <Route
              path="/auth"
              element={
                <PublicRoute>
                  <Auth />
                </PublicRoute>
              }
            />

            {/* Admin Dashboard */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRole="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            {/* User Dashboard */}
            <Route
              path="/"
              element={
                <ProtectedRoute allowedRole="user">
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            {/* User Pages */}
            <Route
              path="/contacts"
              element={
                <ProtectedRoute allowedRole="user">
                  <Contacts />
                </ProtectedRoute>
              }
            />

            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;