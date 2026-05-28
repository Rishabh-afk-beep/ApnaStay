import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { adminListUsers, adminUpdateUserStatus, adminVerifyUser } from "../lib/api";
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

  const verifyMutation = useMutation({
    mutationFn: ({ uid, verification_state }: { uid: string; verification_state: "verified" | "unverified" }) =>
      adminVerifyUser(uid, { verification_state }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-users"] }),
  });

  const users = usersQuery.data ?? [];
  const activeCount = users.filter((u) => u.status === "active").length;
  const blockedCount = users.filter((u) => u.status === "blocked").length;
  const ownerCount = users.filter((u) => u.role === "owner").length;
  const verifiedOwners = users.filter((u) => u.role === "owner" && u.verification_state === "verified").length;

  const verificationBadge = (user: typeof users[0]) => {
    if (user.role === "admin" || user.role === "student") {
      return (
        <span className="badge text-[10px]" style={{ background: "var(--success-container)", color: "#065f46" }}>
          ✅ Auto-verified
        </span>
      );
    }
    if (user.verification_state === "verified") {
      return (
        <span className="badge text-[10px]" style={{ background: "var(--success-container)", color: "#065f46" }}>
          ✅ Verified
        </span>
      );
    }
    return (
      <span className="badge text-[10px]" style={{ background: "rgba(217,119,6,0.1)", color: "#92400e" }}>
        ⏳ Unverified
      </span>
    );
  };

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
              {ownerCount > 0 && (
                <span> · <AnimatedNumber value={verifiedOwners} />/<AnimatedNumber value={ownerCount} /> owners verified</span>
              )}
            </p>
          </div>
        </section>
      </Reveal>

      {/* Role filter */}
      <Reveal className="mt-8" delayMs={60}>
        <div className="flex flex-wrap items-center gap-3">
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
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {/* Left: Avatar + Info */}
                <div className="flex items-center gap-4 min-w-0">
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-black"
                    style={{ background: "var(--primary-container)", color: "#fff" }}
                  >
                    {(user.name || "U")[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold truncate" style={{ color: "var(--on-surface)" }}>
                        {user.name || "No name set"}
                      </p>
                      <span
                        className="badge"
                        style={{ background: "var(--surface-container)", color: "var(--on-surface-variant)" }}
                      >
                        {user.role}
                      </span>
                      {verificationBadge(user)}
                    </div>
                    <p className="text-sm truncate" style={{ color: "var(--outline)" }}>
                      {user.email || "No email"}
                      {user.phone && <span className="ml-2">· 📱 {user.phone}</span>}
                    </p>
                  </div>
                </div>

                {/* Right: Action buttons */}
                <div className="flex items-center gap-2 flex-wrap shrink-0">
                  {/* Status badge */}
                  <span
                    className="badge"
                    style={{
                      background: user.status === "active" ? "var(--success-container)" : "rgba(186, 26, 26, 0.08)",
                      color: user.status === "active" ? "#065f46" : "var(--error)",
                    }}
                  >
                    {user.status}
                  </span>

                  {/* Verify / Revoke for owners only */}
                  {user.role === "owner" && (
                    user.verification_state === "verified" ? (
                      <button
                        onClick={() => verifyMutation.mutate({ uid: user.uid, verification_state: "unverified" })}
                        disabled={verifyMutation.isPending}
                        className="rounded-full px-3.5 py-1.5 text-xs font-bold transition-all hover:scale-105 disabled:opacity-50"
                        style={{ background: "rgba(217,119,6,0.1)", color: "#92400e" }}
                      >
                        ❌ Revoke
                      </button>
                    ) : (
                      <button
                        onClick={() => verifyMutation.mutate({ uid: user.uid, verification_state: "verified" })}
                        disabled={verifyMutation.isPending}
                        className="rounded-full px-3.5 py-1.5 text-xs font-bold transition-all hover:scale-105 disabled:opacity-50"
                        style={{ background: "var(--success-container)", color: "#065f46" }}
                      >
                        ✅ Verify
                      </button>
                    )
                  )}

                  {/* Block / Activate */}
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

              {/* Bottom info row */}
              <div className="mt-3 flex flex-wrap gap-4 text-xs" style={{ color: "var(--outline)" }}>
                {user.created_at && <span>📅 Joined: {new Date(user.created_at).toLocaleDateString()}</span>}
                {user.uid && <span className="font-mono">UID: {user.uid.slice(0, 12)}…</span>}
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
