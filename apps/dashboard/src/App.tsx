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

export default function App() {
  const [apiKey, setApiKey] = useState<string | null>(
    localStorage.getItem("whpk_api_key")
  );

  const handleLoginSuccess = (key: string) => {
    setApiKey(key);
  };

  // If not logged in, allow visiting /signup or /login, redirect others to /login
  if (!apiKey) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage onLoginSuccess={handleLoginSuccess} />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // Logged in
  const role = localStorage.getItem("whpk_user_role");
  const isAdmin = role === "super_admin";

  return (
    <MainLayout>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/webhooks" element={<WebhooksPage />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/deliveries" element={<DeliveriesPage />} />
        <Route path="/dead" element={<DeadLetterPage />} />
        <Route path="/metrics" element={<MetricsPage />} />
        {isAdmin && <Route path="/admin" element={<AdminPage />} />}
        
        {/* Redirect if hitting authenticated /login or /signup */}
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route path="/signup" element={<Navigate to="/" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </MainLayout>
  );
}
