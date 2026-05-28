import { BrowserRouter, Route, Routes } from "react-router-dom";

import { AuthProvider } from "./lib/AuthContext";
import { ThemeProvider } from "./lib/ThemeContext";
import { NavBar } from "./components/layout/NavBar";
import { SiteFooter } from "./components/layout/SiteFooter";
import { ErrorBoundary } from "./components/ui/ErrorBoundary";
import { SupportHub } from "./components/ui/SupportHub";
import { ScrollToTop } from "./components/ui/ScrollToTop";
import { CookieConsent } from "./components/ui/CookieConsent";

import { LandingPage } from "./pages/LandingPage";
import { DiscoverPage } from "./pages/DiscoverPage";
import { PropertyDetailPage } from "./pages/PropertyDetailPage";
import { LoginPage } from "./pages/LoginPage";
import { HomePage } from "./pages/HomePage";
import { ProfilePage } from "./pages/ProfilePage";
import { ShortlistsPage } from "./pages/ShortlistsPage";
import { AlertsPage } from "./pages/AlertsPage";
import { OwnerDashboardPage } from "./pages/OwnerDashboardPage";
import { AdminDashboardPage } from "./pages/AdminDashboardPage";
import { AdminCollegesPage } from "./pages/AdminCollegesPage";
import { AdminUsersPage } from "./pages/AdminUsersPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { PrivacyPolicyPage } from "./pages/PrivacyPolicyPage";
import { TermsOfServicePage } from "./pages/TermsOfServicePage";

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <ThemeProvider>
        <AuthProvider>
          <ErrorBoundary>
          <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
            <NavBar />
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/discover" element={<DiscoverPage />} />
              <Route path="/home" element={<HomePage />} />
              <Route path="/properties/:propertyId" element={<PropertyDetailPage />} />

              {/* Auth — Step 1: role selection */}
              <Route path="/login" element={<LoginPage />} />
              {/* Auth — Step 2: role-specific login forms */}
              <Route path="/login/student" element={<LoginPage forceRole="student" />} />
              <Route path="/login/owner" element={<LoginPage forceRole="owner" />} />
              {/* Hidden admin login */}
              <Route path="/admin-login" element={<LoginPage forceRole="admin" />} />

              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/shortlists" element={<ShortlistsPage />} />
              <Route path="/alerts" element={<AlertsPage />} />
              <Route path="/owner" element={<OwnerDashboardPage />} />
              <Route path="/admin" element={<AdminDashboardPage />} />
              <Route path="/admin/colleges" element={<AdminCollegesPage />} />
              <Route path="/admin/users" element={<AdminUsersPage />} />

              {/* Legal pages */}
              <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
              <Route path="/terms-of-service" element={<TermsOfServicePage />} />

              {/* Catch-all 404 route */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
            <SiteFooter />
            <SupportHub />
            <CookieConsent />
          </div>
        </ErrorBoundary>
      </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
