import { useState } from "react";
import { Link, NavLink } from "react-router-dom";

import { ThemeToggle } from "../ui/ThemeToggle";
import { useAuth } from "../../lib/AuthContext";

function navLinkClass(isActive: boolean) {
  return [
    "rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200",
    isActive
      ? "text-white"
      : "hover:opacity-80",
  ].join(" ");
}

function mobileNavLinkClass(isActive: boolean) {
  return [
    "rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200",
    isActive
      ? "font-bold"
      : "opacity-70 hover:opacity-100",
  ].join(" ");
}

export function NavBar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { profile, firebaseUser } = useAuth();

  const isLoggedIn = Boolean(firebaseUser);
  const isOwner = profile?.role === "owner";
  const isAdmin = profile?.role === "admin";

  const navItems = [
    { to: "/", label: "Home" },
    { to: "/discover", label: "Discover" },
    ...(isLoggedIn
      ? [
          { to: "/shortlists", label: "Saved" },
          { to: "/alerts", label: "Alerts" },
        ]
      : []),
    ...(isOwner ? [{ to: "/owner", label: "Owner" }] : []),
    ...(isAdmin ? [{ to: "/admin", label: "Admin" }] : []),
  ];

  return (
    <header
      className="sticky top-0 z-40"
      style={{
        background: "var(--glass-bg)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderBottom: "1px solid var(--glass-border)",
      }}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <Link to="/" className="flex items-center gap-2.5 group">
          <span
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-sm font-black transition-transform group-hover:scale-105"
            style={{
              background: "var(--gradient-amber)",
              color: "var(--on-primary)",
            }}
          >
            C
          </span>
          <span
            className="text-lg font-black tracking-tight"
            style={{ color: "var(--on-surface)" }}
          >
            ApnaStay
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" style={{ color: "var(--on-surface-variant)" }}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) => navLinkClass(isActive)}
              style={({ isActive }) =>
                isActive
                  ? { background: "var(--gradient-amber)", color: "var(--on-primary)" }
                  : {}
              }
            >
              {item.label}
            </NavLink>
          ))}
          <div className="ml-1"><ThemeToggle /></div>
          {isLoggedIn ? (
            <Link
              to="/profile"
              className="ml-2 flex h-9 w-9 items-center justify-center rounded-full text-sm font-black transition-all hover:scale-105"
              style={{
                background: "var(--primary-fixed)",
                color: "var(--on-primary-container)",
              }}
            >
              {(profile?.name || "U")[0].toUpperCase()}
            </Link>
          ) : (
            <Link
              to="/login"
              className="btn-primary ml-2 !px-5 !py-2 text-xs"
            >
              Login
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            className="rounded-xl px-3 py-2 text-sm font-bold transition-colors"
            style={{
              background: "var(--surface-container)",
              color: "var(--on-surface)",
            }}
            aria-label="Toggle mobile menu"
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
          >
            {mobileOpen ? "✕" : "☰"}
          </button>
        </div>
      </div>

      <div
        id="mobile-nav"
        className={`overflow-hidden transition-all duration-300 ease-out md:hidden ${
          mobileOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
        style={{ borderTop: mobileOpen ? "1px solid var(--glass-border)" : "none" }}
      >
        <div className="px-4 py-3">
          <nav className="flex flex-col gap-1" style={{ color: "var(--on-surface)" }}>
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) => mobileNavLinkClass(isActive)}
                style={({ isActive }) =>
                  isActive
                    ? { background: "var(--surface-container)", color: "var(--primary)" }
                    : {}
                }
              >
                {item.label}
              </NavLink>
            ))}
            {isLoggedIn ? (
              <NavLink
                to="/profile"
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) => mobileNavLinkClass(isActive)}
                style={({ isActive }) =>
                  isActive
                    ? { background: "var(--surface-container)", color: "var(--primary)" }
                    : {}
                }
              >
                Profile
              </NavLink>
            ) : (
              <NavLink
                to="/login"
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) => mobileNavLinkClass(isActive)}
                style={({ isActive }) =>
                  isActive
                    ? { background: "var(--surface-container)", color: "var(--primary)" }
                    : {}
                }
              >
                Login
              </NavLink>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
