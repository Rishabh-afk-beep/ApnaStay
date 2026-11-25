import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import "leaflet/dist/leaflet.css";

import App from "./App";
import { getPublicStats, listColleges } from "./lib/api";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      retry: 1,
      retryDelay: 1000,
      refetchOnWindowFocus: false,
    },
  },
});

// Pre-warm key queries through React Query so concurrent callers deduplicate into one request
void queryClient.prefetchQuery({
  queryKey: ["public-stats"],
  queryFn: getPublicStats,
});
void queryClient.prefetchQuery({
  queryKey: ["colleges"],
  queryFn: listColleges,
  staleTime: 10 * 60 * 1000,
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
