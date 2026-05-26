import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { createAlert, deleteAlert, listAlerts, listColleges } from "../lib/api";
import { Reveal } from "../components/ui/Reveal";
import { AnimatedNumber } from "../components/ui/AnimatedNumber";

export function AlertsPage() {
  const queryClient = useQueryClient();
  const alertsQuery = useQuery({ queryKey: ["alerts"], queryFn: listAlerts });
  const collegesQuery = useQuery({ queryKey: ["colleges"], queryFn: listColleges });

  const [newAlert, setNewAlert] = useState({ college_id: "", radius_km: 2, property_type: "", budget_max: 0 });

  const createMutation = useMutation({
    mutationFn: () =>
      createAlert({
        college_id: newAlert.college_id,
        radius_km: newAlert.radius_km,
        property_type: newAlert.property_type || undefined,
        budget_max: newAlert.budget_max || undefined,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["alerts"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (alertId: string) => deleteAlert(alertId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["alerts"] }),
  });

  const items = alertsQuery.data ?? [];

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <Reveal>
        <section
          className="relative overflow-hidden rounded-3xl p-6 md:p-8"
          style={{ background: "linear-gradient(135deg, #451a03 0%, #78350f 60%, #92400e 100%)" }}
        >
          <div
            className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full opacity-20"
            style={{ background: "var(--on-primary)", filter: "blur(40px)" }}
          />
          <div className="relative z-10">
            <p
              className="text-xs font-bold uppercase tracking-widest"
              style={{ color: "rgba(255,255,255,0.60)", letterSpacing: "0.15em" }}
            >
              Stay Updated
            </p>
            <h1 className="mt-2 text-3xl font-black" style={{ color: "var(--on-primary)" }}>
              Listing Alerts
            </h1>
            <p className="mt-2 text-sm" style={{ color: "rgba(255,255,255,0.75)" }}>
              <AnimatedNumber value={items.length} /> active alerts — we&apos;ll notify you when new listings match
            </p>
          </div>
        </section>
      </Reveal>

      {/* Create Alert */}
      <Reveal className="mt-8" delayMs={60}>
        <section className="glass-card-static p-7">
          <h2 className="font-black" style={{ color: "var(--on-surface)" }}>Create New Alert</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <select
              value={newAlert.college_id}
              onChange={(e) => setNewAlert({ ...newAlert, college_id: e.target.value })}
              className="input-field"
            >
              <option value="">— Select a college —</option>
              {(collegesQuery.data ?? []).map((c) => (
                <option key={c.college_id} value={c.college_id}>{c.name}</option>
              ))}
            </select>
            <select
              value={newAlert.radius_km}
              onChange={(e) => setNewAlert({ ...newAlert, radius_km: Number(e.target.value) })}
              className="input-field"
            >
              {[0.5, 1, 2, 5, 10].map((r) => (
                <option key={r} value={r}>{r} km</option>
              ))}
            </select>
            <select
              value={newAlert.property_type}
              onChange={(e) => setNewAlert({ ...newAlert, property_type: e.target.value })}
              className="input-field"
            >
              <option value="">Any Type</option>
              <option value="pg">PG</option>
              <option value="flat">Flat</option>
              <option value="hostel">Hostel</option>
              <option value="single_room">Single Room</option>
              <option value="co_living">Co-living</option>
            </select>
            <input
              type="number"
              placeholder="Max Budget"
              value={newAlert.budget_max || ""}
              onChange={(e) => setNewAlert({ ...newAlert, budget_max: Number(e.target.value) })}
              className="input-field"
            />
          </div>
          <button
            onClick={() => createMutation.mutate()}
            disabled={createMutation.isPending || !newAlert.college_id}
            className="btn-primary mt-5 disabled:opacity-50"
          >
            {createMutation.isPending ? "Creating..." : "Create Alert"}
          </button>
        </section>
      </Reveal>

      {/* Alerts List */}
      <Reveal className="mt-8" delayMs={110}>
        {items.length === 0 && !alertsQuery.isLoading ? (
          <div
            className="rounded-3xl p-12 text-center"
            style={{ background: "var(--surface-container-low)" }}
          >
            <p className="text-5xl">🔔</p>
            <p className="mt-4 text-xl font-black" style={{ color: "var(--on-surface)" }}>No alerts yet</p>
            <p className="mt-2 text-sm" style={{ color: "var(--outline)" }}>
              Set up alerts above to get notified about new listings
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {items.map((alert) => (
              <article key={alert.alert_id} className="glass-card p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-bold" style={{ color: "var(--on-surface)" }}>
                      {alert.college_id.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                    </p>
                    <p className="mt-1 text-sm" style={{ color: "var(--outline)" }}>
                      Radius: {alert.radius_km} km
                      {alert.property_type && ` · ${alert.property_type}`}
                      {alert.budget_max ? ` · Max ₹${alert.budget_max}` : ""}
                    </p>
                  </div>
                  <button
                    onClick={() => deleteMutation.mutate(alert.alert_id)}
                    className="rounded-full px-3 py-1.5 text-xs font-bold transition-colors"
                    style={{
                      background: "rgba(186, 26, 26, 0.08)",
                      color: "var(--error)",
                    }}
                  >
                    Delete
                  </button>
                </div>
                <p className="mt-3 text-xs" style={{ color: "var(--outline)" }}>
                  Created {new Date(alert.created_at).toLocaleDateString()}
                </p>
              </article>
            ))}
          </div>
        )}
      </Reveal>
    </main>
  );
}
