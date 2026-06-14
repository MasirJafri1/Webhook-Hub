import { Routes, Route } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import DashboardPage from "./pages/DashboardPage";
import WebhooksPage from "./pages/WebhooksPage";
import EventsPage from "./pages/EventsPage";
import DeliveriesPage from "./pages/DeliveriesPage";
import DeadLetterPage from "./pages/DeadLetterPage";
import MetricsPage from "./pages/MetricsPage";

export default function App() {
  return (
    <MainLayout>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/webhooks" element={<WebhooksPage />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/deliveries" element={<DeliveriesPage />} />
        <Route path="/dead" element={<DeadLetterPage />} />
        <Route path="/metrics" element={<MetricsPage />} />
      </Routes>
    </MainLayout>
  );
}
