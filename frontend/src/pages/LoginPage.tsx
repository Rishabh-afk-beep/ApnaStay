import { useState, useEffect } from "react";
import { Navigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { useAuth } from "../lib/AuthContext";
import { listColleges, getPublicStats } from "../lib/api";
import { Reveal } from "../components/ui/Reveal";

type RoleType = "student" | "owner" | "admin";
type AuthMode = "signin" | "signup";

interface LoginPageProps {
  /** Force a specific role — used for /login/student, /login/owner, /admin-login */
  forceRole?: RoleType;
}

const ROLE_BRANDING: Record<RoleType, {
  label: string; icon: string; desc: string;
  heroTitle: string; heroSub: string;
  gradient: string;
  stats: { value: string; label: string }[];
}> = {
  student: {
    label: "Student",
    icon: "🎓",
    desc: "Find PGs, rooms, and hostels near your campus",
    heroTitle: "Find your perfect\nstudent home",
    heroSub: "as Student",
    gradient: "var(--gradient-amber)",
    stats: [
      { value: "500+", label: "Verified Listings" },
      { value: "50+", label: "Colleges" },
      { value: "10K+", label: "Students" },
    ],
  },
  owner: {
    label: "Property Owner",
    icon: "🏠",
    desc: "List your PG, hostel, or flat for students",
    heroTitle: "Reach thousands\nof students",
    heroSub: "as Property Owner",
    gradient: "linear-gradient(135deg, #065f46, #10b981)",
    stats: [
      { value: "3x", label: "Faster Occupancy" },
      { value: "Direct", label: "Student Contact" },
    ],
  },
  admin: {
    label: "Admin",
    icon: "⚙️",
    desc: "Moderate listings, manage colleges and users",
    heroTitle: "Admin Console",
    heroSub: "Authorized personnel only",
    gradient: "linear-gradient(135deg, #1e293b, #334155)",
    stats: [],
  },
};

export function LoginPage({ forceRole }: LoginPageProps) {
  const { firebaseUser, profile, loading, loginWithEmail, signUpWithEmail, resetPassword, loginWithGoogle, register, logout } = useAuth();
  const role: RoleType = forceRole ?? "student";
  const [mode, setMode] = useState<AuthMode>("signin");
  const [step, setStep] = useState<"auth" | "register">("auth");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [collegeId, setCollegeId] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const collegesQuery = useQuery({ queryKey: ["colleges"], queryFn: listColleges });
  const statsQuery = useQuery({ queryKey: ["public-stats"], queryFn: getPublicStats });
  
  let branding = ROLE_BRANDING[role];
  if (role === "student" && statsQuery.data) {
    branding = {
      ...branding,
      stats: [
        { value: `${statsQuery.data.verified_listings}+`, label: "Verified Listings" },
        { value: `${statsQuery.data.colleges_covered}+`, label: "Colleges" },
        { value: `${statsQuery.data.students_active}+`, label: "Students" },
      ],
    };
  }
  
  const isAdmin = role === "admin";

  // Auto-transition to registration step when user is authenticated but has no profile
  useEffect(() => {
    if (!loading && firebaseUser && !profile && step === "auth") {
      setStep("register");
      setName(firebaseUser.displayName || "");
      setEmail(firebaseUser.email || "");
    }
  }, [loading, firebaseUser, profile, step]);

  // If user has a profile but wants a different role (e.g. student → admin),
  // auto-attempt the role upgrade for admin, or show registration form for others
  const [autoUpgradeAttempted, setAutoUpgradeAttempted] = useState(false);
  useEffect(() => {
    if (!loading && firebaseUser && profile && forceRole && profile.role !== forceRole && step === "auth") {
      const userEmail = profile.email || firebaseUser.email || "";
      setName(profile.name || firebaseUser.displayName || "");
      setEmail(userEmail);
      setPhone(profile.phone || "");

      // For admin, auto-attempt the upgrade without showing the form
      if (forceRole === "admin" && !autoUpgradeAttempted) {
        setAutoUpgradeAttempted(true);
        setBusy(true);
        setError("");
        register("admin", profile.name || firebaseUser.displayName || "Unnamed", {
          phone: profile.phone || "",
          email: userEmail,
        })
          .then(() => {
            // Success — refreshProfile in register() will update profile, triggering redirect
          })
          .catch((err: any) => {
            const detail = err?.response?.data?.detail;
            const msg = typeof detail === "object" ? detail.message : (err?.message || "Admin upgrade failed");
            setError(msg);
            setStep("register"); // Show form so user can see the error
          })
          .finally(() => setBusy(false));
      } else {
        setStep("register");
      }
    }
  }, [loading, firebaseUser, profile, forceRole, step, autoUpgradeAttempted]);

  // Redirect if already authenticated WITH THE CORRECT ROLE
  if (!loading && firebaseUser && profile) {
    if (!forceRole || profile.role === forceRole) {
      if (profile.role === "admin") return <Navigate to="/admin" replace />;
      if (profile.role === "owner") return <Navigate to="/owner" replace />;
      return <Navigate to="/discover" replace />;
    }
    // Otherwise, user is on a role-specific login page but has a different role
    // useEffect above will handle transitioning to the registration form
  }

  const handleEmailAuth = async () => {
    setError(""); setBusy(true);
    try {
      if (mode === "signup") { await signUpWithEmail(email, password); setStep("register"); }
      else { await loginWithEmail(email, password); }
    } catch (err: any) {
      const msg = err?.message || "Authentication failed";
      if (msg.includes("auth/email-already-in-use")) setError("Email already registered. Try signing in.");
      else if (msg.includes("auth/wrong-password") || msg.includes("auth/invalid-credential")) setError("Incorrect email or password.");
      else if (msg.includes("auth/user-not-found")) setError("No account found. Try signing up.");
      else if (msg.includes("auth/weak-password")) setError("Password must be at least 6 characters.");
      else setError(msg);
    } finally { setBusy(false); }
  };

  const handleGoogle = async () => {
    setError(""); setBusy(true);
    try { await loginWithGoogle(); }
    catch (err: any) { setError(err?.message || "Google sign-in failed"); }
    finally { setBusy(false); }
  };

  const handleResetPassword = async () => {
    setError("");
    if (!email) {
      setError("Please enter your email above to reset your password.");
      return;
    }
    setBusy(true);
    try {
      await resetPassword(email);
      setError("Password reset email sent. Please check your inbox.");
    } catch (err: any) {
      const msg = err?.message || "";
      if (msg.includes("auth/user-not-found")) setError("No account found for this email.");
      else if (msg.includes("auth/invalid-email")) setError("Invalid email address format.");
      else setError("Failed to send reset email.");
    } finally {
      setBusy(false);
    }
  };

  const handleBackToSignIn = async () => {
    if (firebaseUser) {
      await logout();
    }
    setStep("auth");
    setError("");
  };

  const handleRegistration = async () => {
    setError("");
    if (!name.trim()) { setError("Name is required"); return; }
    setBusy(true);
    try {
      await register(role, name, { phone, email, college_id: role === "student" ? collegeId : undefined });
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      const msg = typeof detail === "object" ? detail.message : (err?.message || "Registration failed");
      setError(msg);
    } finally { setBusy(false); }
  };

  // ── If no forceRole, show the role selection screen ──
  if (!forceRole) {
    return (
      <main
        className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4 py-16"
        style={{ background: "var(--gradient-hero-subtle)" }}
      >
        <div className="mx-auto w-full max-w-3xl text-center">
          <Reveal>
            <p className="text-xs font-bold uppercase tracking-widest"
              style={{ color: "var(--primary)", letterSpacing: "0.15em" }}>
              Welcome to NearMyColleges
            </p>
            <h1 className="mt-3 text-4xl font-black" style={{ color: "var(--on-surface)" }}>
              How would you like to use NearMyColleges?
            </h1>
            <p className="mt-3 text-sm" style={{ color: "var(--outline)" }}>
              Choose your account type to get started
            </p>
          </Reveal>

          <Reveal delayMs={100}>
            <div className="mt-10 grid gap-6 md:grid-cols-2">
              {/* Student Card */}
              <Link
                to="/login/student"
                className="group glass-card block p-8 text-left"
              >
                <div
                  className="inline-flex h-16 w-16 items-center justify-center rounded-2xl text-3xl"
                  style={{ background: "var(--primary-fixed)" }}
                >
                  🎓
                </div>
                <h2 className="mt-5 text-2xl font-black" style={{ color: "var(--on-surface)" }}>
                  I&apos;m a Student
                </h2>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--outline)" }}>
                  Search for PGs, flats, hostels, and single rooms near your college.
                  Save listings, set alerts, and contact owners directly.
                </p>
                <div className="mt-5 flex items-center gap-2 text-sm font-bold" style={{ color: "var(--primary)" }}>
                  Continue as Student
                  <span className="transition-transform group-hover:translate-x-1">→</span>
                </div>
              </Link>

              {/* Owner Card */}
              <Link
                to="/login/owner"
                className="group glass-card block p-8 text-left"
              >
                <div
                  className="inline-flex h-16 w-16 items-center justify-center rounded-2xl text-3xl"
                  style={{ background: "var(--success-container)" }}
                >
                  🏠
                </div>
                <h2 className="mt-5 text-2xl font-black" style={{ color: "var(--on-surface)" }}>
                  I&apos;m a Property Owner
                </h2>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--outline)" }}>
                  List your PG, hostel, or flat. Manage availability, receive inquiries,
                  and connect with students looking for accommodation.
                </p>
                <div className="mt-5 flex items-center gap-2 text-sm font-bold" style={{ color: "#065f46" }}>
                  Continue as Owner
                  <span className="transition-transform group-hover:translate-x-1">→</span>
                </div>
              </Link>
            </div>
          </Reveal>
        </div>
      </main>
    );
  }

  // ── Role-specific login form ──
  return (
    <main
      className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4 py-10"
      style={{ background: "var(--gradient-hero-subtle)" }}
    >
      <div
        className="mx-auto w-full max-w-5xl overflow-hidden rounded-3xl md:grid md:grid-cols-2"
        style={{ boxShadow: "var(--shadow-ambient)" }}
      >
        {/* Left branding panel — unique per role */}
        <div className="relative flex flex-col justify-center p-10" style={{ background: branding.gradient }}>
          <div className="relative z-10">
            <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl text-2xl"
              style={{ background: "rgba(255,255,255,0.25)", backdropFilter: "blur(12px)" }}>
              {branding.icon}
            </span>
            <h1 className="mt-6 text-3xl font-black leading-tight md:text-4xl"
              style={{ color: "#fff", whiteSpace: "pre-line" }}>
              {branding.heroTitle}
            </h1>
            <p className="mt-2 text-lg font-bold" style={{ color: "rgba(255,255,255,0.65)" }}>
              {branding.heroSub}
            </p>
            <p className="mt-3 max-w-sm text-sm font-medium" style={{ color: "rgba(255,255,255,0.60)" }}>
              {isAdmin
                ? "This login is restricted to pre-authorized administrators."
                : branding.desc}
            </p>
            {branding.stats.length > 0 && (
              <div className="mt-8 flex gap-6">
                {branding.stats.map((s) => (
                  <div key={s.label}>
                    <p className="text-2xl font-black" style={{ color: "#fff" }}>{s.value}</p>
                    <p className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.50)" }}>{s.label}</p>
                  </div>
                ))}
              </div>
            )}
            {isAdmin && (
              <div className="mt-8 flex items-center gap-3">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full text-sm"
                  style={{ background: "rgba(239,68,68,0.2)", color: "#fca5a5" }}>🔒</span>
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.35)", letterSpacing: "0.1em" }}>
                  Restricted Access
                </p>
              </div>
            )}
          </div>
          <div className="pointer-events-none absolute inset-0"
            style={{ background: "radial-gradient(circle at 30% 80%, rgba(255,255,255,0.12), transparent)" }} />
        </div>

        {/* Right form panel */}
        <div className="flex flex-col justify-center p-8 md:p-10"
          style={{ background: "var(--surface-container-lowest)" }}>
          <Reveal>
            {/* Admin restricted notice */}
            {isAdmin && (
              <div className="mb-5 rounded-xl p-4 text-sm"
                style={{ background: "rgba(186,26,26,0.06)", color: "var(--error)", border: "1px solid rgba(186,26,26,0.15)" }}>
                <p className="font-bold">⚠️ Restricted Access</p>
                <p className="mt-1">Only pre-authorized emails can register as admin.</p>
              </div>
            )}

            {/* Back link for non-admin */}
            {!isAdmin && (
              <Link to="/login" className="mb-5 inline-flex items-center gap-1 text-sm font-semibold"
                style={{ color: "var(--outline)" }}>
                ← Choose different role
              </Link>
            )}

            {step === "auth" ? (
              <>
                {/* Sign In / Sign Up toggle */}
                <div className="mb-5 flex gap-1 rounded-full p-1" style={{ background: "var(--surface-container)" }}>
                  {(["signin", "signup"] as AuthMode[]).map((m) => (
                    <button key={m}
                      onClick={() => { setMode(m); setError(""); }}
                      className="flex-1 rounded-full px-4 py-2.5 text-sm font-bold transition-all"
                      style={mode === m
                        ? { background: role === "owner" ? "linear-gradient(135deg, #065f46, #10b981)" : "var(--gradient-amber)", color: "#fff" }
                        : { color: "var(--on-surface-variant)" }}>
                      {m === "signin" ? "Sign In" : "Sign Up"}
                    </button>
                  ))}
                </div>

                <h2 className="text-xl font-black" style={{ color: "var(--on-surface)" }}>
                  {mode === "signin" ? `${branding.label} Sign In` : `Create ${branding.label} Account`}
                </h2>

                {/* Role-specific benefit message */}
                {!isAdmin && (
                  <p className="mt-2 text-sm" style={{ color: "var(--outline)" }}>
                    {role === "student"
                      ? "Access listings, save favorites, and set alerts for new rooms near your campus."
                      : "Publish properties, track inquiries, and manage availability from your dashboard."}
                  </p>
                )}

                {error && (
                  <div className="mt-3 rounded-xl p-3 text-sm"
                    style={{ background: "rgba(186,26,26,0.08)", color: "var(--error)" }}>
                    {error}
                  </div>
                )}

                <div className="mt-5 space-y-4">
                  <label className="block">
                    <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--outline)", letterSpacing: "0.05em" }}>Email</span>
                    <input type="email" placeholder="you@example.com" value={email}
                      onChange={(e) => setEmail(e.target.value)} className="input-field mt-2" />
                  </label>
                  <label className="block">
                    <div className="flex items-end justify-between">
                      <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--outline)", letterSpacing: "0.05em" }}>Password</span>
                      {mode === "signin" && (
                        <button type="button" onClick={handleResetPassword} disabled={busy} className="text-xs font-bold transition-all hover:opacity-80 disabled:opacity-50" style={{ color: role === "owner" ? "#10b981" : "var(--primary)" }}>
                          Forgot password?
                        </button>
                      )}
                    </div>
                    <input type="password" placeholder="••••••••" value={password}
                      onChange={(e) => setPassword(e.target.value)} className="input-field mt-2" />
                  </label>

                  <button onClick={handleEmailAuth} disabled={busy || !email || !password}
                    className="w-full rounded-full py-3.5 text-sm font-bold text-white transition-all disabled:opacity-50"
                    style={{ background: role === "owner" ? "linear-gradient(135deg, #065f46, #10b981)" : "var(--gradient-amber)" }}>
                    {busy ? "Please wait..." : mode === "signin" ? "Sign In" : "Create Account"}
                  </button>

                  <div className="flex items-center gap-3 py-1">
                    <div className="h-px flex-1" style={{ background: "var(--glass-border)" }} />
                    <span className="text-xs font-bold uppercase" style={{ color: "var(--outline)" }}>or</span>
                    <div className="h-px flex-1" style={{ background: "var(--glass-border)" }} />
                  </div>

                  <button onClick={handleGoogle} disabled={busy}
                    className="flex w-full items-center justify-center gap-3 rounded-full py-3.5 text-sm font-semibold transition-all disabled:opacity-50"
                    style={{ background: "var(--surface-container)", color: "var(--on-surface)", border: "1px solid var(--glass-border)" }}>
                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Continue with Google
                  </button>
                </div>
                <div id="recaptcha-container" />
              </>
            ) : (
              /* Registration Step */
              <>
                <h2 className="text-xl font-black" style={{ color: "var(--on-surface)" }}>
                  Complete {branding.label} Registration
                </h2>

                {error && (
                  <div className="mt-3 rounded-xl p-3 text-sm"
                    style={{ background: "rgba(186,26,26,0.08)", color: "var(--error)" }}>{error}</div>
                )}

                <div className="mt-5 space-y-4">
                  <label className="block">
                    <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--outline)", letterSpacing: "0.05em" }}>Full Name *</span>
                    <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" className="input-field mt-2" />
                  </label>
                  <label className="block">
                    <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--outline)", letterSpacing: "0.05em" }}>Phone Number</span>
                    <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" className="input-field mt-2" />
                  </label>

                  {role === "student" && (
                    <label className="block">
                      <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--outline)", letterSpacing: "0.05em" }}>Select Your College (Optional)</span>
                      <select value={collegeId} onChange={(e) => setCollegeId(e.target.value)} className="input-field mt-2">
                        <option value="">— I'll select later —</option>
                        {(collegesQuery.data ?? []).map((c) => (
                          <option key={c.college_id} value={c.college_id}>
                            {c.short_name ? `${c.short_name} — ` : ""}{c.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}

                  {/* Owner-only: Info banner */}
                  {role === "owner" && (
                    <div className="rounded-xl p-4 text-sm" style={{ background: "var(--success-container)", color: "#065f46" }}>
                      <p className="font-bold">📋 What you get as an Owner</p>
                      <ul className="mt-2 space-y-1">
                        <li>• Publish unlimited property listings</li>
                        <li>• Receive direct student inquiries</li>
                        <li>• Update availability in real-time</li>
                        <li>• All listings go through admin moderation</li>
                      </ul>
                    </div>
                  )}

                  {/* Admin-only: Warning */}
                  {isAdmin && (
                    <div className="rounded-xl p-4 text-sm"
                      style={{ background: "rgba(186,26,26,0.06)", color: "var(--error)", border: "1px solid rgba(186,26,26,0.15)" }}>
                      <p className="font-bold">🔒 Admin Registration</p>
                      <p className="mt-1">Only whitelisted emails will be accepted. Others will be rejected.</p>
                    </div>
                  )}

                  <button onClick={handleRegistration} disabled={busy}
                    className="w-full rounded-full py-3.5 text-sm font-bold text-white transition-all disabled:opacity-50"
                    style={{ background: role === "owner" ? "linear-gradient(135deg, #065f46, #10b981)" : "var(--gradient-amber)" }}>
                    {busy ? "Registering..." : `Register as ${branding.label}`}
                  </button>

                  <button onClick={handleBackToSignIn}
                    className="w-full text-center text-sm font-semibold" style={{ color: "var(--outline)" }}>
                    ← Back to sign in
                  </button>
                </div>
              </>
            )}
          </Reveal>
        </div>
      </div>
    </main>
  );
}
