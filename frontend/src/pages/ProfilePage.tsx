import { useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";

import { useAuth } from "../lib/AuthContext";
import { completeProfile, updateMe } from "../lib/api";
import { Reveal } from "../components/ui/Reveal";

const ROLE_CONFIG = {
  admin:   { label: "Administrator",    icon: "⚙️",  gradient: "linear-gradient(135deg, #1e1b4b 0%, #3730a3 60%, #4f46e5 100%)", badge: "bg-violet-500/20 text-violet-300", quickLinks: [{ label: "Admin Dashboard", to: "/admin" }, { label: "Manage Colleges", to: "/admin/colleges" }, { label: "Manage Users", to: "/admin/users" }] },
  owner:   { label: "Property Owner",   icon: "🏠",  gradient: "linear-gradient(135deg, #431407 0%, #9a3412 60%, #c2410c 100%)", badge: "bg-orange-500/20 text-orange-300", quickLinks: [{ label: "Owner Dashboard", to: "/owner" }, { label: "My Listings", to: "/owner" }, { label: "Inquiries", to: "/owner" }] },
  student: { label: "Student",          icon: "🎓",  gradient: "var(--gradient-amber)", badge: "bg-amber-500/20 text-amber-700",   quickLinks: [{ label: "Discover PGs", to: "/discover" }, { label: "Saved Listings", to: "/shortlists" }, { label: "My Alerts", to: "/alerts" }] },
};

export function ProfilePage() {
  const { profile, firebaseUser, loading, logout, refreshProfile } = useAuth();
  const [name, setName] = useState(profile?.name || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [email, setEmail] = useState(profile?.email || firebaseUser?.email || "");
  const [saved, setSaved] = useState(false);

  const saveMutation = useMutation({
    mutationFn: () => {
      if (!profile?.name) return completeProfile({ name, phone, email });
      return updateMe({ name, phone, email });
    },
    onSuccess: async () => {
      await refreshProfile();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  if (!loading && !firebaseUser) return <Navigate to="/login" replace />;

  const role = (profile?.role ?? "student") as keyof typeof ROLE_CONFIG;
  const cfg = ROLE_CONFIG[role] ?? ROLE_CONFIG.student;
  const initials = (profile?.name || "U").slice(0, 2).toUpperCase();

  return (
    <main className="mx-auto max-w-2xl px-4 py-10 space-y-5">

      {/* ── Profile Hero Card ── */}
      <Reveal>
        <section
          className="relative overflow-hidden rounded-3xl p-8"
          style={{ background: cfg.gradient, boxShadow: "0 20px 60px rgba(0,0,0,0.18)" }}
        >
          {/* Decorative blobs */}
          <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full opacity-20" style={{ background: "#fff", filter: "blur(50px)" }} />
          <div className="pointer-events-none absolute -left-8 bottom-0 h-32 w-32 rounded-full opacity-10" style={{ background: "#fff", filter: "blur(40px)" }} />

          <div className="relative z-10 flex items-center gap-5">
            {/* Avatar */}
            <div
              className="flex items-center justify-center rounded-2xl text-2xl font-black text-white shadow-xl"
              style={{ width: 80, height: 80, background: "rgba(255,255,255,0.2)", backdropFilter: "blur(12px)", border: "2px solid rgba(255,255,255,0.3)" }}
            >
              {initials}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-black text-white">{profile?.name || "Set up your profile"}</h1>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${cfg.badge}`}>
                  {cfg.icon} {cfg.label}
                </span>
              </div>
              <p className="mt-1 text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>
                {profile?.email || firebaseUser?.email || "No email set"}
              </p>
              <p className="mt-0.5 text-xs font-mono" style={{ color: "rgba(255,255,255,0.35)" }}>
                UID: {profile?.uid?.slice(0, 12)}…
              </p>
            </div>
          </div>

          {/* Quick links row */}
          <div className="relative z-10 mt-6 flex flex-wrap gap-2">
            {cfg.quickLinks.map((ql) => (
              <Link
                key={ql.to}
                to={ql.to}
                className="rounded-xl px-4 py-2 text-xs font-bold transition-all hover:scale-105"
                style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)", color: "#fff", border: "1px solid rgba(255,255,255,0.2)" }}
              >
                {ql.label} →
              </Link>
            ))}
          </div>
        </section>
      </Reveal>

      {/* ── Account Status Strip ── */}
      <Reveal delayMs={60}>
        <section
          className="grid grid-cols-3 gap-3 rounded-2xl p-4"
          style={{ background: "var(--surface-container-low)", border: "1px solid var(--glass-border)" }}
        >
          {[
            { label: "Role",         value: profile?.role || "student",                icon: cfg.icon },
            { label: "Status",       value: profile?.status || "active",               icon: profile?.status === "active" ? "🟢" : "🔴" },
            { label: "Verification", value: profile?.verification_state || "unverified", icon: profile?.verification_state === "verified" ? "✅" : "⏳" },
          ].map(({ label, value, icon }) => (
            <div key={label} className="text-center">
              <p className="text-lg">{icon}</p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--outline)" }}>{label}</p>
              <p className="mt-0.5 text-sm font-black capitalize" style={{ color: "var(--on-surface)" }}>{value}</p>
            </div>
          ))}
        </section>
      </Reveal>

      {/* ── Personal Information ── */}
      <Reveal delayMs={100}>
        <section className="rounded-3xl p-7" style={{ background: "var(--surface-container-lowest)", border: "1px solid var(--glass-border)", boxShadow: "var(--shadow-ambient)" }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-black" style={{ color: "var(--on-surface)" }}>Personal Information</h2>
              <p className="text-xs mt-0.5" style={{ color: "var(--outline)" }}>Update your name, phone and email</p>
            </div>
            {saved && (
              <span className="rounded-full px-3 py-1.5 text-xs font-bold" style={{ background: "var(--success-container)", color: "#065f46" }}>
                ✓ Saved!
              </span>
            )}
          </div>

          <div className="space-y-4">
            {[
              { label: "Full Name", value: name, setter: setName, type: "text",  icon: "👤", placeholder: "Your full name" },
              { label: "Phone",     value: phone, setter: setPhone, type: "tel",  icon: "📱", placeholder: "+91 XXXXX XXXXX" },
              { label: "Email",     value: email, setter: setEmail, type: "email", icon: "✉️", placeholder: "you@email.com" },
            ].map(({ label, value, setter, type, icon, placeholder }) => (
              <label key={label} className="block">
                <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--outline)" }}>{label}</span>
                <div className="relative mt-1.5">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-base">{icon}</span>
                  <input
                    type={type}
                    value={value}
                    onChange={(e) => setter(e.target.value)}
                    placeholder={placeholder}
                    className="input-field !pl-11"
                  />
                </div>
              </label>
            ))}
          </div>

          <div className="mt-7 flex gap-3">
            <button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              className="btn-primary flex-1 disabled:opacity-50"
            >
              {saveMutation.isPending ? "Saving…" : "💾 Save Changes"}
            </button>
            <button
              onClick={logout}
              className="rounded-full px-6 py-3 text-sm font-bold transition-all hover:scale-[1.02]"
              style={{ background: "rgba(186, 26, 26, 0.08)", color: "var(--error)", border: "1px solid rgba(186,26,26,0.15)" }}
            >
              🚪 Sign Out
            </button>
          </div>
        </section>
      </Reveal>

    </main>
  );
}
