import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { adminListUsers, adminUpdateUserStatus } from "../lib/api";
import { Reveal } from "../components/ui/Reveal";
import { AnimatedNumber } from "../components/ui/AnimatedNumber";

export function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [roleFilter, setRoleFilter] = useState<string>("");
  const usersQuery = useQuery({
    queryKey: ["admin-users", roleFilter],
    queryFn: () => adminListUsers(roleFilter || undefined),
  });

  const statusMutation = useMutation({
    mutationFn: ({ uid, status, reason }: { uid: string; status: string; reason?: string }) =>
      adminUpdateUserStatus(uid, { status, reason }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-users"] }),
  });

  const users = usersQuery.data ?? [];
  const activeCount = users.filter((u) => u.status === "active").length;
  const blockedCount = users.filter((u) => u.status === "blocked").length;

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <Reveal>
        <section className="section-dark relative overflow-hidden">
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full opacity-15"
            style={{ background: "var(--primary-fixed-dim)", filter: "blur(60px)" }} />
          <div className="relative z-10">
            <p className="text-xs font-bold uppercase tracking-widest"
              style={{ color: "var(--primary-fixed-dim)", letterSpacing: "0.15em" }}>
              Admin
            </p>
            <h1 className="mt-2 text-3xl font-black text-white">
              User Management
            </h1>
            <p className="mt-2 text-sm text-slate-300">
              <AnimatedNumber value={users.length} /> users · <AnimatedNumber value={activeCount} /> active · <AnimatedNumber value={blockedCount} /> blocked
            </p>
          </div>
        </section>
      </Reveal>

      {/* Role filter */}
      <Reveal className="mt-8" delayMs={60}>
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold" style={{ color: "var(--on-surface-variant)" }}>Filter by role:</span>
          {["", "student", "owner", "admin"].map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className="rounded-full px-4 py-2 text-xs font-bold transition-all"
              style={
                roleFilter === r
                  ? { background: "var(--gradient-amber)", color: "var(--on-primary)" }
                  : { background: "var(--surface-container)", color: "var(--on-surface-variant)" }
              }
            >
              {r || "All"}
            </button>
          ))}
        </div>
      </Reveal>

      {/* Users list */}
      <Reveal className="mt-6" delayMs={110}>
        {usersQuery.isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-24 skeleton-shimmer" />)}
          </div>
        )}
        <div className="space-y-3">
          {users.map((user) => (
            <article key={user.uid} className="glass-card p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-full text-sm font-black"
                    style={{ background: "var(--primary-container)", color: "#fff" }}
                  >
                    {(user.name || "U")[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold" style={{ color: "var(--on-surface)" }}>{user.name || "No name set"}</p>
                    <p className="text-sm" style={{ color: "var(--outline)" }}>
                      {user.email || user.phone || user.uid.slice(0, 12)}
                      <span
                        className="badge ml-2"
                        style={{ background: "var(--surface-container)", color: "var(--on-surface-variant)" }}
                      >
                        {user.role}
                      </span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className="badge"
                    style={{
                      background: user.status === "active" ? "var(--success-container)" : "rgba(186, 26, 26, 0.08)",
                      color: user.status === "active" ? "#065f46" : "var(--error)",
                    }}
                  >
                    {user.status}
                  </span>
                  {user.status === "active" ? (
                    <button
                      onClick={() => statusMutation.mutate({ uid: user.uid, status: "blocked", reason: "Admin action" })}
                      className="rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors"
                      style={{ background: "rgba(186, 26, 26, 0.08)", color: "var(--error)" }}
                    >
                      Block
                    </button>
                  ) : (
                    <button
                      onClick={() => statusMutation.mutate({ uid: user.uid, status: "active" })}
                      className="rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors"
                      style={{ background: "var(--success-container)", color: "#065f46" }}
                    >
                      Activate
                    </button>
                  )}
                </div>
              </div>
              <div className="mt-3 flex gap-4 text-xs" style={{ color: "var(--outline)" }}>
                <span>Verification: {user.verification_state}</span>
                {user.created_at && <span>Joined: {new Date(user.created_at).toLocaleDateString()}</span>}
              </div>
            </article>
          ))}
        </div>

        {users.length === 0 && !usersQuery.isLoading && (
          <div className="rounded-3xl p-12 text-center" style={{ background: "var(--surface-container-low)" }}>
            <p className="text-4xl">👥</p>
            <p className="mt-3 font-black" style={{ color: "var(--on-surface)" }}>No users found</p>
          </div>
        )}
      </Reveal>
    </main>
  );
}
