import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "leaflet/dist/leaflet.css";

import App from "./App";
import "./index.css";

// ── Render keep-alive: silently wake the backend on app load ──────────────────
// Render free tier spins down after 15 min of inactivity (~30s cold start).
// This fire-and-forget ping is sent immediately so the backend is warm before
// the user's first real API call.
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api/v1";
fetch(`${API_BASE}/health/stats`, { method: "GET" }).catch(() => {/* ignore — warm-up only */});

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>,
);
