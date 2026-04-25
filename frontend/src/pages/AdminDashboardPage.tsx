import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";

import { Reveal } from "../components/ui/Reveal";
import { AnimatedNumber } from "../components/ui/AnimatedNumber";
import {
  adminApprove,
  adminFeature,
  adminHide,
  adminReject,
  getAdminAnalytics,
  getAdminLogs,
  listAdminPending,
  setApiToken,
} from "../lib/api";
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

  const pendingQuery = useQuery({
    queryKey: ["admin-pending"],
    queryFn: listAdminPending,
    enabled: Boolean(profile),
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

  const moderationMutation = useMutation({
    mutationFn: ({ action, propertyId }: { action: "approve" | "reject" | "hide" | "feature"; propertyId: string }) => {
      if (action === "approve") return adminApprove(propertyId);
      if (action === "reject") return adminReject(propertyId);
      if (action === "hide") return adminHide(propertyId);
      return adminFeature(propertyId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-pending"] });
      queryClient.invalidateQueries({ queryKey: ["admin-analytics"] });
      queryClient.invalidateQueries({ queryKey: ["admin-logs"] });
    },
  });



  const totalProperties = analyticsQuery.data?.total_properties ?? 0;
  const liveProperties = analyticsQuery.data?.live_properties ?? 0;
  const liveRatio = totalProperties > 0 ? Math.round((liveProperties / totalProperties) * 100) : 0;

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      {/* Header */}
      <Reveal>
        <section className="section-dark relative overflow-hidden">
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full opacity-15"
            style={{ background: "var(--primary-fixed-dim)", filter: "blur(60px)" }} />
          <div className="relative z-10">
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--primary-fixed-dim)", letterSpacing: "0.15em" }}>
              Moderation + Analytics
            </p>
            <h1 className="mt-2 text-3xl font-black" style={{ color: "var(--inverse-on-surface)" }}>
              Admin Dashboard
            </h1>
            <p className="mt-2 max-w-2xl text-sm" style={{ color: "var(--inverse-on-surface)", opacity: 0.7 }}>
              Track supply health, approve owner inventory, and monitor trust signals across the marketplace.
            </p>
            <div className="mt-5 flex gap-3">
              <Link to="/admin/colleges" className="btn-ghost !border-white/20 !text-white/80 hover:!bg-white/10">
                Manage Colleges
              </Link>
              <Link to="/admin/users" className="btn-ghost !border-white/20 !text-white/80 hover:!bg-white/10">
                Manage Users
              </Link>
            </div>
          </div>
        </section>
      </Reveal>

      {/* Analytics cards */}
      <Reveal className="mt-6" delayMs={110}>
        <section className="grid gap-4 md:grid-cols-4">
          {[
            { label: "Total Properties", value: analyticsQuery.data?.total_properties ?? 0, icon: "🏠" },
            { label: "Live Properties", value: analyticsQuery.data?.live_properties ?? 0, icon: "✅", extra: true },
            { label: "Pending Properties", value: analyticsQuery.data?.pending_properties ?? 0, icon: "⏳" },
            { label: "Total Inquiries", value: analyticsQuery.data?.total_inquiries ?? 0, icon: "📩" },
          ].map((stat) => (
            <article key={stat.label} className="stat-card">
              <span className="text-xl">{stat.icon}</span>
              <p className="mt-2 text-xs font-bold uppercase tracking-widest"
                style={{ color: "var(--outline)", letterSpacing: "0.05em" }}>
                {stat.label}
              </p>
              <p className="mt-1 text-2xl font-black" style={{ color: "var(--on-surface)" }}>
                <AnimatedNumber value={stat.value} />
              </p>
              {stat.extra && (
                <>
                  <div className="mt-3 h-2 overflow-hidden rounded-full" style={{ background: "var(--surface-container-high)" }}>
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${liveRatio}%`, background: "var(--success)" }}
                    />
                  </div>
                  <p className="mt-1 text-xs" style={{ color: "var(--outline)" }}>Live ratio: {liveRatio}%</p>
                </>
              )}
            </article>
          ))}
        </section>
      </Reveal>

      {/* Extra analytics */}
      <Reveal className="mt-4" delayMs={130}>
        <section className="grid gap-4 md:grid-cols-3">
          {[
            { label: "Total Shortlists", value: analyticsQuery.data?.total_shortlists ?? 0, icon: "❤️" },
            { label: "Total Reviews", value: analyticsQuery.data?.total_reviews ?? 0, icon: "⭐" },
            { label: "Active Alerts", value: analyticsQuery.data?.total_alerts ?? 0, icon: "🔔" },
          ].map((stat) => (
            <article key={stat.label} className="stat-card">
              <span className="text-xl">{stat.icon}</span>
              <p className="mt-2 text-xs font-bold uppercase tracking-widest"
                style={{ color: "var(--outline)", letterSpacing: "0.05em" }}>
                {stat.label}
              </p>
              <p className="mt-1 text-2xl font-black" style={{ color: "var(--on-surface)" }}>
                <AnimatedNumber value={stat.value} />
              </p>
            </article>
          ))}
        </section>
      </Reveal>

      {/* Moderation queue */}
      <Reveal className="mt-8" delayMs={160}>
        <section>
          <h2 className="text-xl font-black" style={{ color: "var(--on-surface)" }}>Moderation Queue</h2>
          {pendingQuery.isLoading && (
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {[1, 2].map((i) => <div key={i} className="h-32 skeleton-shimmer" />)}
            </div>
          )}
          {pendingQuery.isError && (
            <p className="mt-3 text-sm" style={{ color: "var(--error)" }}>Unable to load pending queue. Check admin token.</p>
          )}
          {pendingQuery.data?.length === 0 && (
            <div className="mt-4 rounded-3xl p-10 text-center" style={{ background: "var(--surface-container-low)" }}>
              <p className="text-4xl">✅</p>
              <p className="mt-3 font-black" style={{ color: "var(--on-surface)" }}>No pending listings</p>
              <p className="text-sm" style={{ color: "var(--outline)" }}>All listings have been moderated</p>
            </div>
          )}
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {pendingQuery.data?.map((item) => (
              <article key={item.property_id} className="glass-card p-6">
                <p className="font-black" style={{ color: "var(--on-surface)" }}>{item.title}</p>
                <p className="text-sm" style={{ color: "var(--outline)" }}>{item.address_text || `ID: ${item.property_id}`}</p>
                <p className="mt-1 text-sm" style={{ color: "var(--on-surface-variant)" }}>
                  Type: {item.property_type} · ₹{item.rent_min}–₹{item.rent_max}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={() => moderationMutation.mutate({ action: "approve", propertyId: item.property_id })}
                    className="rounded-full px-4 py-1.5 text-xs font-bold transition-colors"
                    style={{ background: "var(--success-container)", color: "#065f46" }}
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => moderationMutation.mutate({ action: "reject", propertyId: item.property_id })}
                    className="rounded-full px-4 py-1.5 text-xs font-bold transition-colors"
                    style={{ background: "rgba(186, 26, 26, 0.08)", color: "var(--error)" }}
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => moderationMutation.mutate({ action: "hide", propertyId: item.property_id })}
                    className="rounded-full px-4 py-1.5 text-xs font-bold transition-colors"
                    style={{ background: "var(--surface-container-high)", color: "var(--on-surface-variant)" }}
                  >
                    Hide
                  </button>
                  <button
                    onClick={() => moderationMutation.mutate({ action: "feature", propertyId: item.property_id })}
                    className="rounded-full px-4 py-1.5 text-xs font-bold transition-colors"
                    style={{ background: "var(--primary-fixed)", color: "var(--on-primary-container)" }}
                  >
                    ✦ Feature
                  </button>
                </div>
              </article>
            ))}
          </div>
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
                  <span style={{ color: "var(--outline)" }}> on {log.target_type} </span>
                  <span className="font-mono text-xs" style={{ color: "var(--outline)" }}>{log.target_id.slice(0, 16)}</span>
                </div>
                <span className="text-xs" style={{ color: "var(--outline)" }}>{new Date(log.created_at).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </section>
      </Reveal>
    </main>
  );
}
