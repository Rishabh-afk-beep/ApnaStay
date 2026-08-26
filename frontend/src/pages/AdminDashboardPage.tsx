import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
});
L.Marker.prototype.options.icon = DefaultIcon;

import { Reveal } from "../components/ui/Reveal";
import { AnimatedNumber } from "../components/ui/AnimatedNumber";
import {
  adminApprove,
  adminFeature,
  adminUnfeature,
  adminHide,
  adminReject,
  adminListProperties,
  adminDeleteProperty,
  getAdminAnalytics,
  getAdminLogs,
  listAdminPending,
  adminListInquiries,
  setApiToken,
} from "../lib/api";
import type { PropertyCard, AdminInquiryOut } from "../types";
import { useAuth } from "../lib/AuthContext";

export function AdminDashboardPage() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  if (!profile || profile.role !== "admin") {
    return (
      <main className="mx-auto max-w-xl px-6 py-20 text-center">
        <div className="rounded-3xl p-16" style={{ background: "var(--surface-container-low)" }}>
          <p className="text-5xl">🔒</p>
          <h1 className="mt-6 text-2xl font-black" style={{ color: "var(--on-surface)" }}>Admin Access Required</h1>
          <p className="mt-4 text-sm" style={{ color: "var(--on-surface-variant)" }}>
            Please log in with an Admin account to view the moderation queue.
          </p>
        </div>
      </main>
    );
  }

  const [activeTab, setActiveTab] = useState<"pending" | "all" | "inquiries" | "map">("pending");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterSearch, setFilterSearch] = useState<string>("");

  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  const pendingQuery = useQuery({
    queryKey: ["admin-pending"],
    queryFn: listAdminPending,
    enabled: Boolean(profile),
  });

  const allPropertiesQuery = useQuery({
    queryKey: ["admin-properties"],
    queryFn: adminListProperties,
    enabled: Boolean(profile) && (activeTab === "all" || activeTab === "map"),
  });

  const analyticsQuery = useQuery({
    queryKey: ["admin-analytics"],
    queryFn: getAdminAnalytics,
    enabled: Boolean(profile),
  });

  const logsQuery = useQuery({
    queryKey: ["admin-logs"],
    queryFn: getAdminLogs,
    enabled: Boolean(profile),
  });

  const inquiriesQuery = useQuery({
    queryKey: ["admin-inquiries"],
    queryFn: adminListInquiries,
    enabled: Boolean(profile) && activeTab === "inquiries",
  });

  const moderationMutation = useMutation({
    mutationFn: async ({ action, propertyId }: { action: "approve" | "reject" | "hide" | "feature" | "unfeature" | "delete"; propertyId: string }) => {
      if (action === "approve") await adminApprove(propertyId);
      else if (action === "reject") await adminReject(propertyId);
      else if (action === "hide") await adminHide(propertyId);
      else if (action === "delete") await adminDeleteProperty(propertyId);
      else if (action === "unfeature") await adminUnfeature(propertyId);
      else await adminFeature(propertyId);
    },
    onMutate: async ({ action, propertyId }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["admin-pending"] });
      await queryClient.cancelQueries({ queryKey: ["admin-properties"] });

      // Snapshot the previous value
      const previousPending = queryClient.getQueryData(["admin-pending"]);
      const previousProperties = queryClient.getQueryData(["admin-properties"]);

      // Optimistically update to the new value
      const updateList = (old: PropertyCard[] | undefined) => {
        if (!old) return old;
        if (action === "delete") {
          return old.filter((p) => p.property_id !== propertyId);
        }
        return old.map((p) => {
          if (p.property_id === propertyId) {
            const updates: Partial<PropertyCard> = {};
            if (action === "approve") { updates.approval_status = "approved"; updates.visibility_status = "live"; }
            if (action === "reject") { updates.approval_status = "rejected"; updates.visibility_status = "hidden"; }
            if (action === "hide") { updates.visibility_status = "hidden"; }
            if (action === "feature") { updates.featured = true; }
            if (action === "unfeature") { updates.featured = false; }
            return { ...p, ...updates };
          }
          return p;
        });
      };

      queryClient.setQueryData(["admin-pending"], updateList);
      queryClient.setQueryData(["admin-properties"], updateList);

      return { previousPending, previousProperties };
    },
    onError: (err, newTodo, context) => {
      if (context?.previousPending) queryClient.setQueryData(["admin-pending"], context.previousPending);
      if (context?.previousProperties) queryClient.setQueryData(["admin-properties"], context.previousProperties);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-pending"] });
      queryClient.invalidateQueries({ queryKey: ["admin-properties"] });
      queryClient.invalidateQueries({ queryKey: ["admin-analytics"] });
      queryClient.invalidateQueries({ queryKey: ["admin-logs"] });
    },
  });

  const totalProperties = analyticsQuery.data?.total_properties ?? 0;
  const liveProperties = analyticsQuery.data?.live_properties ?? 0;
  const liveRatio = totalProperties > 0 ? Math.round((liveProperties / totalProperties) * 100) : 0;

  const filteredProperties = (allPropertiesQuery.data || []).filter((p: PropertyCard) => {
    if (filterStatus && p.approval_status !== filterStatus && p.visibility_status !== filterStatus) {
      if (filterStatus === "live" && p.visibility_status !== "live") return false;
      if (filterStatus === "pending" && p.approval_status !== "pending") return false;
      if (filterStatus === "rejected" && p.approval_status !== "rejected") return false;
      if (filterStatus === "hidden" && p.visibility_status !== "hidden") return false;
    }
    if (filterSearch && !p.title.toLowerCase().includes(filterSearch.toLowerCase()) && !p.property_id.includes(filterSearch)) return false;
    return true;
  });

  // Map effect
  useEffect(() => {
    if (activeTab !== "map" || !mapRef.current) return;
    
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapRef.current).setView([20.5937, 78.9629], 5); // Center of India default
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
    }).addTo(map);

    const bounds = L.latLngBounds([]);

    filteredProperties.forEach((p) => {
      if (p.latitude && p.longitude) {
        bounds.extend([p.latitude, p.longitude]);
        L.marker([p.latitude, p.longitude])
          .addTo(map)
          .bindPopup(`<b>${p.title}</b><br/>${p.property_type.replace("_", " ")}<br/>${p.visibility_status}`);
      }
    });

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [activeTab, filteredProperties]);

  const filteredPending = (pendingQuery.data || []).filter((p: PropertyCard) => {
    if (filterSearch && !p.title.toLowerCase().includes(filterSearch.toLowerCase()) && !p.property_id.includes(filterSearch)) return false;
    return true;
  });

  const filteredInquiries = (inquiriesQuery.data || []).filter((inq: AdminInquiryOut) => {
    if (filterSearch) {
      const q = filterSearch.toLowerCase();
      const matchName = inq.name.toLowerCase().includes(q);
      const matchPhone = inq.phone.includes(q);
      const matchProp = inq.property_title.toLowerCase().includes(q);
      const matchOwner = (inq.owner_name || "").toLowerCase().includes(q) || (inq.owner_email || "").toLowerCase().includes(q);
      const matchMessage = (inq.message || "").toLowerCase().includes(q);
      return matchName || matchPhone || matchProp || matchOwner || matchMessage;
    }
    return true;
  });

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      {/* ── Hero Banner ── */}
      <Reveal>
        <section
          className="relative overflow-hidden rounded-3xl p-6 md:p-10"
          style={{ background: "var(--surface-container-high)", border: "1px solid var(--outline-variant)", boxShadow: "var(--shadow-ambient)" }}
        >
          {/* Animated ambient glows */}
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full opacity-20 animate-float"
            style={{ background: "var(--primary)", filter: "blur(80px)" }} />
          <div className="pointer-events-none absolute -left-10 bottom-0 h-48 w-48 rounded-full opacity-15 animate-float"
            style={{ background: "#6366f1", filter: "blur(60px)", animationDelay: "2s" }} />

          {/* Dot-grid overlay */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.04]"
            style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "24px 24px" }}
          />

          <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em]"
                style={{ background: "rgba(250,189,0,0.12)", color: "var(--primary)", border: "1px solid rgba(250,189,0,0.2)" }}>
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                Moderation + Analytics
              </div>
              <h1 className="text-4xl font-black" style={{ color: "var(--on-surface)", letterSpacing: "-0.02em" }}>Admin Dashboard</h1>
              <p className="mt-2 max-w-lg text-sm leading-6" style={{ color: "var(--on-surface-variant)" }}>
                Track supply health, approve owner inventory, and monitor trust signals across the marketplace.
              </p>
            </div>
            {/* Admin identity pill */}
            <div
              className="flex items-center gap-3 rounded-2xl px-5 py-4 flex-shrink-0"
              style={{ background: "var(--surface-container)", border: "1px solid var(--outline-variant)", backdropFilter: "blur(12px)" }}
            >
              <div
                className="flex h-12 w-12 items-center justify-center rounded-xl text-lg font-black"
                style={{ background: "var(--gradient-amber)", color: "var(--on-primary)" }}
              >
                {(profile?.name || "A")[0]}
              </div>
              <div>
                <p className="text-sm font-black" style={{ color: "var(--on-surface)" }}>{profile?.name || "Admin"}</p>
                <p className="text-[11px]" style={{ color: "var(--outline)" }}>⚙️ Administrator</p>
              </div>
            </div>
          </div>

          {/* Quick action buttons */}
          <div className="relative z-10 mt-6 flex flex-wrap gap-3">
            <Link
              to="/admin/colleges"
              className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all hover:scale-[1.03]"
              style={{ background: "var(--surface-container)", color: "var(--on-surface)", border: "1px solid var(--outline-variant)" }}
            >
              🎓 Manage Colleges
            </Link>
            <Link
              to="/admin/users"
              className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all hover:scale-[1.03]"
              style={{ background: "var(--surface-container)", color: "var(--on-surface)", border: "1px solid var(--outline-variant)" }}
            >
              👥 Manage Users
            </Link>
          </div>
        </section>
      </Reveal>

      {/* ── Analytics Cards ── */}
      <Reveal className="mt-6" delayMs={110}>
        <section className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
          {[
            { label: "Total Properties", value: analyticsQuery.data?.total_properties ?? 0, icon: "🏠", color: "rgba(99,102,241,0.12)", iconBg: "rgba(99,102,241,0.2)", extra: false },
            { label: "Live Properties",  value: analyticsQuery.data?.live_properties ?? 0,  icon: "✅", color: "rgba(16,185,129,0.12)", iconBg: "rgba(16,185,129,0.2)", extra: true },
            { label: "Pending Review",   value: analyticsQuery.data?.pending_properties ?? 0, icon: "⏳", color: "rgba(245,158,11,0.12)", iconBg: "rgba(245,158,11,0.2)", extra: false },
            { label: "Total Inquiries",  value: analyticsQuery.data?.total_inquiries ?? 0,   icon: "📩", color: "rgba(59,130,246,0.12)", iconBg: "rgba(59,130,246,0.2)", extra: false },
          ].map((stat) => (
            <article
              key={stat.label}
              className="relative overflow-hidden rounded-2xl p-5 transition-all hover:scale-[1.02]"
              style={{ background: "var(--surface-container)", border: "1px solid var(--outline-variant)", boxShadow: "var(--shadow-ambient)" }}
            >
              <div
                className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl text-xl"
                style={{ background: stat.iconBg }}
              >
                {stat.icon}
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: "var(--on-surface-variant)" }}>
                {stat.label}
              </p>
              <p className="mt-1.5 text-3xl font-black" style={{ color: "var(--on-surface)" }}>
                <AnimatedNumber value={stat.value} />
              </p>
              {stat.extra && (
                <>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full" style={{ background: "var(--surface-container-high)" }}>
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${liveRatio}%`, background: "#10b981" }}
                    />
                  </div>
                  <p className="mt-1 text-xs font-semibold" style={{ color: "var(--on-surface-variant)" }}>Live ratio: {liveRatio}%</p>
                </>
              )}
            </article>
          ))}
        </section>
      </Reveal>

      {/* ── Extra Stats ── */}
      <Reveal className="mt-4" delayMs={130}>
        <section className="grid gap-4 sm:grid-cols-3">
          {[
            { label: "Total Shortlists", value: analyticsQuery.data?.total_shortlists ?? 0, icon: "❤️", color: "rgba(244,63,94,0.1)",   iconBg: "rgba(244,63,94,0.15)" },
            { label: "Total Reviews",    value: analyticsQuery.data?.total_reviews ?? 0,    icon: "⭐", color: "rgba(234,179,8,0.1)",   iconBg: "rgba(234,179,8,0.15)" },
            { label: "Active Alerts",    value: analyticsQuery.data?.total_alerts ?? 0,     icon: "🔔", color: "rgba(168,85,247,0.1)",  iconBg: "rgba(168,85,247,0.15)" },
          ].map((stat) => (
            <article
              key={stat.label}
              className="relative overflow-hidden rounded-2xl p-5 transition-all hover:scale-[1.02]"
              style={{ background: "var(--surface-container)", border: "1px solid var(--outline-variant)", boxShadow: "var(--shadow-ambient)" }}
            >
              <div
                className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl text-xl"
                style={{ background: stat.iconBg }}
              >
                {stat.icon}
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: "var(--on-surface-variant)" }}>
                {stat.label}
              </p>
              <p className="mt-1.5 text-3xl font-black" style={{ color: "var(--on-surface)" }}>
                <AnimatedNumber value={stat.value} />
              </p>
            </article>
          ))}
        </section>
      </Reveal>

      {/* Properties Management */}
      <Reveal className="mt-8" delayMs={160}>
        <section className="glass-card-static p-6 md:p-8 rounded-3xl" style={{ background: "var(--surface-container-lowest)", border: "1px solid var(--surface-container-high)" }}>
          {/* Section Header & Switcher */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b pb-6" style={{ borderColor: "var(--surface-container-high)" }}>
            <div>
              <h2 className="text-2xl font-black tracking-tight" style={{ color: "var(--on-surface)" }}>
                Property Control Center
              </h2>
              <p className="text-sm mt-1" style={{ color: "var(--on-surface-variant)" }}>
                Audit listings, manage marketplace supply, and moderate landlord submissions.
              </p>
            </div>

            {/* Custom Segmented Control Switcher */}
            <div className="flex p-1 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/80 self-stretch lg:self-auto overflow-x-auto no-scrollbar whitespace-nowrap">
              <button
                onClick={() => {
                  setActiveTab("pending");
                  setFilterSearch("");
                }}
                className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all duration-300 flex-shrink-0 ${
                  activeTab === "pending"
                    ? "bg-white dark:bg-slate-800 text-slate-950 dark:text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                <span>Moderation Queue</span>
                {pendingQuery.data && pendingQuery.data.length > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1.5 text-[10px] font-black text-white animate-pulse">
                    {pendingQuery.data.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => {
                  setActiveTab("all");
                  setFilterSearch("");
                }}
                className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all duration-300 flex-shrink-0 ${
                  activeTab === "all"
                    ? "bg-white dark:bg-slate-800 text-slate-950 dark:text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                <span>All Properties</span>
                {analyticsQuery.data && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700 px-1.5 text-[10px] font-black text-slate-700 dark:text-slate-300">
                    {analyticsQuery.data.total_properties}
                  </span>
                )}
              </button>
              <button
                onClick={() => {
                  setActiveTab("inquiries");
                  setFilterSearch("");
                }}
                className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all duration-300 flex-shrink-0 ${
                  activeTab === "inquiries"
                    ? "bg-white dark:bg-slate-800 text-slate-950 dark:text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                <span>Student Inquiries</span>
                {analyticsQuery.data && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-500 px-1.5 text-[10px] font-black text-white">
                    {analyticsQuery.data.total_inquiries}
                  </span>
                )}
              </button>
              <button
                onClick={() => {
                  setActiveTab("map");
                  setFilterSearch("");
                }}
                className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all duration-300 flex-shrink-0 ${
                  activeTab === "map"
                    ? "bg-white dark:bg-slate-800 text-slate-950 dark:text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                <span>🗺️ Map View</span>
              </button>
            </div>
          </div>

          {/* Search and Filters Bar */}
          <div className="mt-6 flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input 
                type="text" 
                placeholder={
                  activeTab === "all" 
                    ? "Search by title, address, or ID..." 
                    : activeTab === "inquiries"
                      ? "Search by student, owner, message, or PG..."
                      : "Search in pending queue..."
                } 
                value={filterSearch} 
                onChange={e => setFilterSearch(e.target.value)} 
                className="input-field w-full pl-12 pr-4 py-3 !rounded-2xl transition-shadow focus:ring-2 focus:ring-amber-500/20"
                style={{ background: "var(--surface-container-low)" }}
              />
            </div>
            
            {(activeTab === "all" || activeTab === "map") && (
              <div className="flex gap-2">
                <select 
                  value={filterStatus} 
                  onChange={e => setFilterStatus(e.target.value)} 
                  className="input-field !rounded-2xl min-w-[180px] py-3 pr-8 font-bold"
                  style={{ background: "var(--surface-container-low)" }}
                >
                  <option value="">All Statuses</option>
                  <option value="live">🟢 Live / Active</option>
                  <option value="pending">⏳ Pending Review</option>
                  <option value="rejected">❌ Rejected</option>
                  <option value="hidden">👁️ Hidden</option>
                </select>
              </div>
            )}
          </div>

          {/* Pending Queue View */}
          {activeTab === "pending" && (
            <div className="mt-6">
              {pendingQuery.isLoading && (
                <div className="grid gap-4 md:grid-cols-2">
                  {[1, 2].map((i) => <div key={i} className="h-40 rounded-2xl skeleton-shimmer" />)}
                </div>
              )}
              {pendingQuery.isError && (
                <div className="p-6 text-center rounded-2xl bg-red-50/10 border border-red-500/20 text-red-500 text-sm">
                  Unable to load pending queue. Check database connection.
                </div>
              )}
              {filteredPending.length === 0 && !pendingQuery.isLoading && (
                <div className="rounded-3xl p-12 text-center border border-dashed" style={{ borderColor: "var(--surface-container-high)", background: "var(--surface-container-low)" }}>
                  <p className="text-5xl">🎉</p>
                  <h3 className="mt-4 text-lg font-black" style={{ color: "var(--on-surface)" }}>No Pending Listings</h3>
                  <p className="text-sm mt-1" style={{ color: "var(--outline)" }}>
                    {filterSearch ? "Try adjusting your search query." : "All submitted properties have been successfully audited!"}
                  </p>
                </div>
              )}
              <div className="grid gap-4 md:grid-cols-2">
                {filteredPending.map((item) => (
                  <article key={item.property_id} className="relative overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:shadow-lg border border-slate-200/50 dark:border-slate-800/80 hover:border-amber-500/30" style={{ background: "var(--surface-container-low)" }}>
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <span className="inline-block text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                          {item.property_type}
                        </span>
                        <h3 className="text-lg font-bold mt-1" style={{ color: "var(--on-surface)" }}>{item.title}</h3>
                        <p className="text-xs" style={{ color: "var(--outline)" }}>{item.address_text || `ID: ${item.property_id}`}</p>
                      </div>
                      <span className="text-xs px-2.5 py-1 rounded-full bg-orange-100 text-orange-800 font-bold dark:bg-orange-950/30 dark:text-orange-400">
                        Pending
                      </span>
                    </div>

                    <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t pt-4" style={{ borderColor: "var(--surface-container-high)" }}>
                      <span className="text-sm font-black" style={{ color: "var(--on-surface)" }}>
                        ₹{item.rent_min} - ₹{item.rent_max} <span className="text-xs font-normal" style={{ color: "var(--outline)" }}>/mo</span>
                      </span>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => moderationMutation.mutate({ action: "reject", propertyId: item.property_id })}
                          className="rounded-xl px-4 py-2 text-xs font-bold transition-all bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-950/20 dark:text-red-400 dark:hover:bg-red-950/40"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => moderationMutation.mutate({ action: "approve", propertyId: item.property_id })}
                          className="rounded-xl px-4 py-2 text-xs font-bold transition-all bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:hover:bg-emerald-950/40"
                        >
                          Approve Live
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}

          {/* All Properties View */}
          {activeTab === "all" && (
            <div className="mt-6">
              {allPropertiesQuery.isLoading && (
                <div className="grid gap-4 md:grid-cols-2">
                  {[1, 2, 3, 4].map((i) => <div key={i} className="h-40 rounded-2xl skeleton-shimmer" />)}
                </div>
              )}
              {allPropertiesQuery.isError && (
                <div className="p-6 text-center rounded-2xl bg-red-50/10 border border-red-500/20 text-red-500 text-sm">
                  Unable to load properties. Please try again.
                </div>
              )}
              {filteredProperties.length === 0 && !allPropertiesQuery.isLoading && (
                <div className="rounded-3xl p-12 text-center border border-dashed" style={{ borderColor: "var(--surface-container-high)", background: "var(--surface-container-low)" }}>
                  <p className="text-5xl">🔍</p>
                  <h3 className="mt-4 text-lg font-black" style={{ color: "var(--on-surface)" }}>No Properties Found</h3>
                  <p className="text-sm mt-1" style={{ color: "var(--outline)" }}>
                    Try removing filters or search terms to find listings.
                  </p>
                </div>
              )}
              <div className="grid gap-4 md:grid-cols-2">
                {filteredProperties.map((item) => {
                  const isLive = item.visibility_status === "live";
                  const isPending = item.approval_status === "pending";
                  const isHidden = item.visibility_status === "hidden" && !isPending;
                  const isRejected = item.approval_status === "rejected";

                  return (
                    <article key={item.property_id} className="relative overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:shadow-lg border border-slate-200/50 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700" style={{ background: "var(--surface-container-low)" }}>
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <span className="inline-block text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300">
                            {item.property_type}
                          </span>
                          <h3 className="text-lg font-bold mt-1" style={{ color: "var(--on-surface)" }}>{item.title}</h3>
                          <p className="text-xs" style={{ color: "var(--outline)" }}>ID: <span className="font-mono">{item.property_id}</span></p>
                        </div>
                        <div className="flex gap-1.5">
                          {isLive && <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold dark:bg-emerald-950/30 dark:text-emerald-400">Live</span>}
                          {isPending && <span className="text-xs px-2.5 py-1 rounded-full bg-orange-100 text-orange-800 font-bold dark:bg-orange-950/30 dark:text-orange-400">Pending</span>}
                          {isHidden && <span className="text-xs px-2.5 py-1 rounded-full bg-slate-200 text-slate-800 font-bold dark:bg-slate-800 dark:text-slate-400">Hidden</span>}
                          {isRejected && <span className="text-xs px-2.5 py-1 rounded-full bg-red-100 text-red-800 font-bold dark:bg-red-950/30 dark:text-red-400">Rejected</span>}
                        </div>
                      </div>

                      <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t pt-4" style={{ borderColor: "var(--surface-container-high)" }}>
                        <span className="text-sm font-black" style={{ color: "var(--on-surface)" }}>
                          ₹{item.rent_min} - ₹{item.rent_max} <span className="text-xs font-normal" style={{ color: "var(--outline)" }}>/mo</span>
                        </span>
                        
                        <div className="flex flex-wrap gap-2">
                          {isPending && (
                            <button
                              onClick={() => moderationMutation.mutate({ action: "approve", propertyId: item.property_id })}
                              className="rounded-xl px-3 py-2 text-xs font-bold transition-all bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:hover:bg-emerald-950/40"
                            >
                              Approve
                            </button>
                          )}
                          {isLive && (
                            <>
                              <button
                                onClick={() => moderationMutation.mutate({ action: item.featured ? "unfeature" : "feature", propertyId: item.property_id })}
                                className={`rounded-xl px-3 py-2 text-xs font-bold transition-all ${item.featured ? "bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/40 dark:text-amber-400" : "bg-amber-50 text-amber-600 hover:bg-amber-100 dark:bg-amber-950/20 dark:text-amber-500"}`}
                              >
                                {item.featured ? "★ Unfeature" : "☆ Feature"}
                              </button>
                              <button
                                onClick={() => moderationMutation.mutate({ action: "hide", propertyId: item.property_id })}
                                className="rounded-xl px-3 py-2 text-xs font-bold transition-all bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-850 dark:text-slate-300 dark:hover:bg-slate-800"
                              >
                                Hide Listing
                              </button>
                            </>
                          )}
                          {isHidden && item.approval_status === "approved" && (
                            <button
                              onClick={() => moderationMutation.mutate({ action: "approve", propertyId: item.property_id })}
                              className="rounded-xl px-3 py-2 text-xs font-bold transition-all bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-950/20 dark:text-blue-400 dark:hover:bg-blue-950/40"
                            >
                              Publish Live
                            </button>
                          )}
                          <button
                            onClick={() => {
                              if (confirm(`Are you sure you want to permanently delete "${item.title}"? This cannot be undone.`)) {
                                moderationMutation.mutate({ action: "delete", propertyId: item.property_id });
                              }
                            }}
                            className="rounded-xl px-3 py-2 text-xs font-bold transition-all bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-950/20 dark:text-red-400 dark:hover:bg-red-950/40"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          )}

          {/* Map View */}
          {activeTab === "map" && (
            <div className="mt-6">
              <div className="overflow-hidden rounded-2xl border" style={{ borderColor: "var(--surface-container-high)" }}>
                <div ref={mapRef} className="h-[600px] w-full" />
              </div>
            </div>
          )}

          {/* Inquiries View */}
          {activeTab === "inquiries" && (
            <div className="mt-6">
              {inquiriesQuery.isLoading && (
                <div className="grid gap-4 md:grid-cols-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-44 rounded-2xl animate-pulse bg-slate-100 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/80" />
                  ))}
                </div>
              )}
              {inquiriesQuery.isError && (
                <div className="p-6 text-center rounded-2xl bg-red-50/10 border border-red-500/20 text-red-500 text-sm">
                  Unable to load student inquiries. Please try again.
                </div>
              )}
              {filteredInquiries.length === 0 && !inquiriesQuery.isLoading && (
                <div className="rounded-3xl p-12 text-center border border-dashed" style={{ borderColor: "var(--surface-container-high)", background: "var(--surface-container-low)" }}>
                  <p className="text-5xl">📩</p>
                  <h3 className="mt-4 text-lg font-black" style={{ color: "var(--on-surface)" }}>No Inquiries Found</h3>
                  <p className="text-sm mt-1" style={{ color: "var(--outline)" }}>
                    {filterSearch ? "Try adjusting your search terms." : "No student inquiries have been recorded yet."}
                  </p>
                </div>
              )}
              <div className="grid gap-4 md:grid-cols-2">
                {filteredInquiries.map((inq) => (
                  <article key={inq.inquiry_id} className="relative overflow-hidden rounded-3xl p-6 transition-all duration-300 hover:shadow-lg border border-slate-250/60 dark:border-slate-800/80 hover:border-slate-350 dark:hover:border-slate-750" style={{ background: "var(--surface-container-low)" }}>
                    <div className="flex flex-col sm:flex-row sm:justify-between items-start gap-2">
                      <div>
                        <span className="inline-block text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                          Student Inquiry
                        </span>
                        <h3 className="text-lg font-bold mt-2" style={{ color: "var(--on-surface)" }}>{inq.name}</h3>
                        <p className="text-xs" style={{ color: "var(--outline)" }}>
                          📞 <span className="font-semibold text-slate-800 dark:text-slate-200">{inq.phone}</span>
                        </p>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400">
                        {new Date(inq.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="mt-4 p-4 rounded-2xl text-sm italic" style={{ background: "var(--surface-container-lowest)", color: "var(--on-surface-variant)", border: "1px solid var(--surface-container-high)" }}>
                      "{inq.message || "No message left"}"
                    </div>

                    <div className="mt-4 pt-4 border-t space-y-2 text-xs" style={{ borderColor: "var(--surface-container-high)" }}>
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                        <span className="text-slate-400">Target PG / Property:</span>
                        <span className="font-bold text-amber-600 dark:text-amber-400">{inq.property_title}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                        <span className="text-slate-400">Owner Details:</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {inq.owner_name} ({inq.owner_email})
                        </span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}
        </section>
      </Reveal>

      {/* Audit logs */}
      <Reveal className="mt-8" delayMs={210}>
        <section className="glass-card-static p-7">
          <h2 className="text-lg font-black" style={{ color: "var(--on-surface)" }}>Audit Logs</h2>
          <div className="mt-4 space-y-2">
            {logsQuery.data?.slice(0, 20).map((log) => (
              <div
                key={log.log_id}
                className="flex items-center justify-between rounded-xl p-4 text-sm"
                style={{ background: "var(--surface-container-low)" }}
              >
                <div>
                  <span className="font-bold" style={{ color: "var(--on-surface)" }}>{log.action_type}</span>
                  <span style={{ color: "var(--on-surface-variant)" }}> on {log.target_type} </span>
                  <span className="font-mono text-xs" style={{ color: "var(--on-surface-variant)" }}>{log.target_id.slice(0, 16)}</span>
                </div>
                <span className="text-xs font-medium" style={{ color: "var(--on-surface-variant)" }}>{new Date(log.created_at).toLocaleDateString()}</span>

              </div>
            ))}
          </div>
        </section>
      </Reveal>
    </main>
  );
}
