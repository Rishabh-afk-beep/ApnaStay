import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import "leaflet/dist/leaflet.css";

import App from "./App";
import "./index.css";

// ── Render keep-alive: silently wake the backend on app load ──────────────────
// Render free tier spins down after 15 min of inactivity (~30s cold start).
// This fire-and-forget ping is sent immediately so the backend is warm before
// the user's first real API call.
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api/v1";
fetch(`${API_BASE}/health/stats`, { method: "GET" }).catch(() => {/* ignore — warm-up only */});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </HelmetProvider>
  </React.StrictMode>,
);
