import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Contexts
import { AuthProvider } from "./contexts/AuthContext";

// Pages
const Splash = lazy(() => import("./pages/Splash"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const ProfileSetup = lazy(() => import("./pages/ProfileSetup"));
const Home = lazy(() => import("./pages/Home"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const EventsDashboard = lazy(() => import("./pages/EventsDashboard"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const SearchPage = lazy(() => import("./pages/SearchPage"));
const ProfileView = lazy(() => import("./pages/ProfileView"));
const PublicProfile = lazy(() => import("./pages/PublicProfile"));
const Requests = lazy(() => import("./pages/Requests"));
const Messages = lazy(() => import("./pages/Messages"));
const Portfolio = lazy(() => import("./pages/Portfolio"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const ActiveCollaboration = lazy(() => import("./pages/ActiveCollaboration"));
const CompletionRating = lazy(() => import("./pages/CompletionRating"));
const PaymentSuccess = lazy(() => import("./pages/PaymentSuccess"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Settings Pages
const PrivacySettings = lazy(() => import("./pages/settings/PrivacySettings"));
const PaymentInfo = lazy(() => import("./pages/settings/PaymentInfo"));
const EarningsPayouts = lazy(() => import("./pages/settings/EarningsPayouts"));
const BlockedUsers = lazy(() => import("./pages/settings/BlockedUsers"));
const ReportProblem = lazy(() => import("./pages/settings/ReportProblem"));
const HelpSupport = lazy(() => import("./pages/settings/HelpSupport"));
const ChangePassword = lazy(() => import("./pages/settings/ChangePassword"));
const SafetyCenter = lazy(() => import("./pages/settings/SafetyCenter"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const EventManage = lazy(() => import("./pages/EventManage"));

// Layout & Components
import { AppLayout } from "./components/layout/AppLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { InstallPrompt } from "./components/InstallPrompt";
import { OfflineBanner } from "./components/OfflineBanner";

const queryClient = new QueryClient();

const loadingFallback = (
  <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
    Loading...
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <OfflineBanner />
        <InstallPrompt />
        <BrowserRouter>
          <Suspense fallback={loadingFallback}>
            <Routes>
              {/* Public routes (no auth required) */}
              <Route path="/u/:id" element={<PublicProfile />} />
              <Route path="/leaderboard" element={<Leaderboard />} />

              {/* Auth flow */}
              <Route path="/" element={<Splash />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route
                path="/setup"
                element={
                  <ProtectedRoute>
                    <ProfileSetup />
                  </ProtectedRoute>
                }
              />

              {/* Main app with bottom navigation */}
              <Route
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/home" element={<Home />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/events" element={<EventsDashboard />} />
                <Route path="/requests" element={<Requests />} />
                <Route path="/messages" element={<Messages />} />
                <Route path="/portfolio" element={<Portfolio />} />
              </Route>

              {/* Full screen protected pages */}
              <Route
                path="/profile/:id"
                element={
                  <ProtectedRoute>
                    <ProfileView />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/collaboration/:id"
                element={
                  <ProtectedRoute>
                    <ActiveCollaboration />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/complete/:id"
                element={
                  <ProtectedRoute>
                    <CompletionRating />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/payment-success"
                element={
                  <ProtectedRoute>
                    <PaymentSuccess />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <SettingsPage />
                  </ProtectedRoute>
                }
              />

              {/* Settings sub-pages */}
              <Route
                path="/privacy"
                element={
                  <ProtectedRoute>
                    <PrivacySettings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/payment-info"
                element={
                  <ProtectedRoute>
                    <PaymentInfo />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/earnings"
                element={
                  <ProtectedRoute>
                    <EarningsPayouts />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/blocked"
                element={
                  <ProtectedRoute>
                    <BlockedUsers />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/report"
                element={
                  <ProtectedRoute>
                    <ReportProblem />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/help"
                element={
                  <ProtectedRoute>
                    <HelpSupport />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/change-password"
                element={
                  <ProtectedRoute>
                    <ChangePassword />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/safety-center"
                element={
                  <ProtectedRoute>
                    <SafetyCenter />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/events/:id/manage"
                element={
                  <ProtectedRoute>
                    <EventManage />
                  </ProtectedRoute>
                }
              />

              {/* Catch-all */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
