import { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import DashboardPage from "./pages/DashboardPage";
import WebhooksPage from "./pages/WebhooksPage";
import EventsPage from "./pages/EventsPage";
import DeliveriesPage from "./pages/DeliveriesPage";
import DeadLetterPage from "./pages/DeadLetterPage";
import MetricsPage from "./pages/MetricsPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import AdminPage from "./pages/AdminPage";
import SettingsPage from "./pages/SettingsPage";
import AuditLogPage from "./pages/AuditLogPage";
import LandingPage from "./pages/LandingPage";

export default function App() {
  const [apiKey, setApiKey] = useState<string | null>(
    localStorage.getItem("whpk_api_key"),
  );

  const handleLoginSuccess = (key: string) => {
    setApiKey(key);
  };

  // If not logged in, allow visiting landing page, /signup or /login, redirect others to /
  if (!apiKey) {
    return (
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route
          path="/login"
          element={<LoginPage onLoginSuccess={handleLoginSuccess} />}
        />
        <Route
          path="/signup"
          element={<SignupPage onSignupSuccess={handleLoginSuccess} />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  // Logged in
  const role = localStorage.getItem("whpk_user_role");
  const isAdmin = role === "super_admin";

  return (
    <Routes>
      {/* Root landing page is visible even when logged in */}
      <Route path="/" element={<LandingPage />} />

      {/* Authenticated dashboard pages nested under /dashboard */}
      <Route
        path="/dashboard/*"
        element={
          <MainLayout>
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="webhooks" element={<WebhooksPage />} />
              <Route path="events" element={<EventsPage />} />
              <Route path="deliveries" element={<DeliveriesPage />} />
              <Route path="dead" element={<DeadLetterPage />} />
              <Route path="metrics" element={<MetricsPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="audit" element={<AuditLogPage />} />
              {isAdmin && <Route path="admin" element={<AdminPage />} />}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </MainLayout>
        }
      />

      {/* Redirect logged-in user if they hit login/signup */}
      <Route path="/login" element={<Navigate to="/dashboard" replace />} />
      <Route path="/signup" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
