import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../lib/AuthContext";
import { Reveal } from "../components/ui/Reveal";
import { getPublicStats, listColleges } from "../lib/api";

const featureCards = [
  {
    icon: "🎓",
    title: "College-first discovery",
    description: "Start with your campus, then filter by radius, rent, and amenities in seconds.",
  },
  {
    icon: "🛡️",
    title: "Trusted moderation",
    description: "Every listing is reviewed with admin approval before going live.",
  },
  {
    icon: "📊",
    title: "Owner-ready dashboard",
    description: "Owners can publish, update availability, and track demand from students directly.",
  },
];

export function LandingPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedCollege, setSelectedCollege] = useState("");

  const { data: stats, isLoading } = useQuery({
    queryKey: ["public-stats"],
    queryFn: getPublicStats,
  });

  const { data: colleges } = useQuery({
    queryKey: ["colleges"],
    queryFn: listColleges,
  });

  const uniqueCities = Array.from(new Set((colleges || []).map((c) => c.city))).sort();
  const filteredColleges = (colleges || []).filter((c) => !selectedCity || c.city === selectedCity);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate("/discover", { state: { city: selectedCity, collegeId: selectedCollege } });
  };

  const liveStats = [
    { label: "Verified Listings", value: isLoading ? "..." : `${stats?.verified_listings ?? 500}+`, icon: "🏠" },
    { label: "Colleges Covered", value: isLoading ? "..." : `${stats?.colleges_covered ?? 50}+`, icon: "🎓" },
    { label: "Students Trust Us", value: isLoading ? "..." : `${(stats?.students_active ?? 10000).toLocaleString()}+`, icon: "💛" },
    { label: "Cities Active", value: isLoading ? "..." : `${stats?.cities_active ?? 12}+`, icon: "📍" },
  ];

  return (
    <main>
      {/* ── Hero Section ── */}
      <section className="relative overflow-hidden" style={{ background: "var(--gradient-hero-subtle)" }}>
        {/* Floating glow shapes */}
        <div className="hero-glow hero-glow-amber animate-float" style={{ width: 400, height: 400, top: -80, right: -60 }} />
        <div className="hero-glow hero-glow-gold animate-float" style={{ width: 300, height: 300, bottom: 40, left: -40, animationDelay: "2s" }} />
        <div className="hero-glow hero-glow-warm animate-float" style={{ width: 200, height: 200, top: "40%", right: "30%", animationDelay: "4s" }} />

        <div className="mx-auto grid max-w-6xl gap-12 px-6 py-20 md:grid-cols-[1.3fr_1fr] md:py-28">
          <div className="animate-rise">
            <p
              className="mb-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-widest"
              style={{
                background: "var(--glass-bg)",
                backdropFilter: "blur(12px)",
                border: "1px solid var(--glass-border)",
                color: "var(--primary)",
              }}
            >
              <span>✨</span> Student housing, upgraded
            </p>
            <h1
              className="max-w-xl text-5xl font-black leading-[1.1] md:text-6xl"
              style={{ color: "var(--on-surface)", letterSpacing: "-0.02em" }}
            >
              Find your next place near campus{" "}
              <span style={{ color: "var(--primary-container)" }}>without the broker chaos.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8" style={{ color: "var(--on-surface-variant)" }}>
              ApnaStay helps students discover nearby PGs, flats, hostels, single rooms, and co-living options with
              real filters and direct owner contact.
            </p>
            <div className="mt-8 max-w-lg">
              <form onSubmit={handleSearch} className="flex flex-col gap-3 rounded-[2rem] p-3 shadow-xl md:flex-row md:items-center" style={{ background: "var(--surface-container-lowest)", border: "1px solid var(--glass-border)" }}>
                <div className="flex-1 px-4 py-2 border-b md:border-b-0 md:border-r" style={{ borderColor: "var(--glass-border)" }}>
                  <label className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--outline)" }}>1. Select City</label>
                  <select 
                    value={selectedCity} 
                    onChange={(e) => { setSelectedCity(e.target.value); setSelectedCollege(""); }} 
                    className="w-full appearance-none bg-transparent pt-1 text-base font-bold outline-none cursor-pointer"
                    style={{ color: "var(--on-surface)" }}
                  >
                    <option value="">Any City</option>
                    {uniqueCities.map((city) => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>
                <div className="flex-1 px-4 py-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--outline)" }}>2. Select Campus</label>
                  <select 
                    value={selectedCollege} 
                    onChange={(e) => setSelectedCollege(e.target.value)} 
                    className="w-full appearance-none bg-transparent pt-1 text-base font-bold outline-none cursor-pointer"
                    style={{ color: "var(--on-surface)" }}
                  >
                    <option value="">{selectedCity ? "Select a campus..." : "Select city first"}</option>
                    {filteredColleges.map((c) => (
                      <option key={c.college_id} value={c.college_id}>
                        {c.short_name ? `${c.short_name} — ${c.name}` : c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <button 
                  type="submit" 
                  className="rounded-full px-8 py-4 text-sm font-black transition-all hover:scale-105 active:scale-95"
                  style={{ background: "var(--primary)", color: "var(--on-primary)" }}
                >
                  Search
                </button>
              </form>
              
              {!profile && (
                <div className="mt-6 flex flex-wrap items-center gap-4 text-sm font-semibold pl-4">
                  <span style={{ color: "var(--on-surface-variant)" }}>Are you an owner?</span>
                  <Link to="/login/owner" className="transition-colors hover:underline font-bold" style={{ color: "var(--primary)" }}>
                    Post property for free ✨
                  </Link>
                </div>
              )}
              {profile?.role === "owner" && (
                <div className="mt-6 pl-4">
                  <Link to="/owner" className="text-sm font-bold transition-colors hover:underline" style={{ color: "var(--primary)" }}>
                    Go to Owner Dashboard →
                  </Link>
                </div>
              )}
              {profile?.role === "admin" && (
                <div className="mt-6 pl-4">
                  <Link to="/admin" className="text-sm font-bold transition-colors hover:underline" style={{ color: "var(--primary)" }}>
                    Go to Admin Dashboard →
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Stats card */}
          <div className="animate-rise-delayed glass-card-static p-6">
            <p
              className="mb-5 text-xs font-bold uppercase tracking-widest"
              style={{ color: "var(--outline)", letterSpacing: "0.1em" }}
            >
              At a glance
            </p>
            <div className="grid grid-cols-2 gap-4">
              {liveStats.map((item) => (
                <article
                  key={item.label}
                  className="rounded-2xl p-5 transition-all duration-200 hover:scale-[1.02]"
                  style={{ background: "var(--surface-container-low)" }}
                >
                  <span className="text-2xl">{item.icon}</span>
                  <p className="mt-2 text-2xl font-black" style={{ color: "var(--on-surface)" }}>
                    {item.value}
                  </p>
                  <p className="mt-1 text-xs font-semibold" style={{ color: "var(--outline)" }}>
                    {item.label}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Features Section ── */}
      <Reveal className="mx-auto max-w-6xl px-6 py-20" delayMs={80}>
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p
              className="mb-2 text-xs font-bold uppercase tracking-widest"
              style={{ color: "var(--primary)" }}
            >
              Why choose us
            </p>
            <h2 className="text-3xl font-black md:text-4xl" style={{ color: "var(--on-surface)" }}>
              Why this feels different
            </h2>
          </div>
          <Link
            to="/discover"
            className="text-sm font-bold transition-colors hover:opacity-80"
            style={{ color: "var(--primary)" }}
          >
            Explore inventory →
          </Link>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {featureCards.map((card, index) => (
            <article key={card.title} className="glass-card p-7">
              <div
                className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl text-xl"
                style={{ background: "var(--primary-fixed)" }}
              >
                {card.icon}
              </div>
              <p
                className="text-xs font-bold uppercase tracking-widest"
                style={{ color: "var(--outline)", letterSpacing: "0.05em" }}
              >
                0{index + 1}
              </p>
              <h3 className="mt-2 text-xl font-black" style={{ color: "var(--on-surface)" }}>
                {card.title}
              </h3>
              <p className="mt-3 text-sm leading-7" style={{ color: "var(--on-surface-variant)" }}>
                {card.description}
              </p>
            </article>
          ))}
        </div>
      </Reveal>

      {/* ── CTA Banner ── */}
      <Reveal className="mx-auto max-w-6xl px-6 pb-8" delayMs={140}>
        <div className="section-dark relative overflow-hidden">
          {/* Glow accent */}
          <div
            className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full opacity-20"
            style={{ background: "var(--primary-fixed-dim)", filter: "blur(60px)" }}
          />
          <div className="relative z-10">
            <h3 className="text-3xl font-black" style={{ color: "var(--inverse-on-surface)" }}>
              Ready to launch your housing search?
            </h3>
            <p className="mt-3 max-w-2xl text-base leading-7" style={{ color: "var(--inverse-on-surface)", opacity: 0.7 }}>
              Use advanced filters, compare options by distance and rent, and contact owners directly without waiting on
              fragmented WhatsApp groups.
            </p>
            <Link
              to="/discover"
              className="mt-6 inline-flex rounded-full px-8 py-4 text-sm font-black transition hover:scale-[1.02]"
              style={{
                background: "var(--primary-fixed-dim)",
                color: "var(--on-primary-container)",
              }}
            >
              Open Discover Page →
            </Link>
          </div>
        </div>
      </Reveal>
    </main>
  );
}
