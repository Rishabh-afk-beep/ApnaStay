import { useEffect, useRef, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
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

import { ListingCard } from "../components/listings/ListingCard";
import { Reveal } from "../components/ui/Reveal";
import { AnimatedNumber } from "../components/ui/AnimatedNumber";
import { searchProperties, listColleges } from "../lib/api";

const AMENITY_OPTIONS = ["wifi", "food", "ac", "parking", "laundry", "gym", "cctv", "geyser", "power_backup", "study_room"];
const AMENITY_ICONS: Record<string, string> = {
  wifi: "📶", food: "🍽️", ac: "❄️", parking: "🅿️", laundry: "🧺",
  gym: "💪", cctv: "📹", geyser: "🚿", power_backup: "⚡", study_room: "📚",
};

type FilterState = {
  college_id: string;
  radius_km: number;
  property_type: string;
  gender: string;
  budget_min: string;
  budget_max: string;
  availability_status: string;
  amenities: string[];
  sort: string;
};

export function DiscoverPage() {
  const location = useLocation();
  const [filters, setFilters] = useState<FilterState>({
    college_id: location.state?.collegeId || "",
    radius_km: 2,
    property_type: "",
    gender: "",
    budget_min: "",
    budget_max: "",
    availability_status: "",
    amenities: [],
    sort: "newest",
  });

  const [selectedCity, setSelectedCity] = useState(location.state?.city || "");
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<"grid" | "map">("grid");
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  const collegesQuery = useQuery({ queryKey: ["colleges"], queryFn: listColleges });
  const uniqueCities = Array.from(new Set((collegesQuery.data ?? []).map((c) => c.city))).sort();
  const filteredColleges = (collegesQuery.data ?? []).filter((c) => !selectedCity || c.city === selectedCity);

  const queryParams = {
    college_id: filters.college_id || undefined,
    radius_km: filters.radius_km,
    property_type: filters.property_type || undefined,
    gender: filters.gender || undefined,
    budget_min: filters.budget_min ? Number(filters.budget_min) : undefined,
    budget_max: filters.budget_max ? Number(filters.budget_max) : undefined,
    availability_status: filters.availability_status || undefined,
    amenities: filters.amenities.length ? filters.amenities : undefined,
    sort: filters.sort,
    page,
    limit: 12,
  };

  const propertiesQuery = useQuery({
    queryKey: ["properties", queryParams],
    queryFn: () => searchProperties(queryParams),
    staleTime: 30000,
  });

  const items = propertiesQuery.data?.items ?? [];
  const total = propertiesQuery.data?.total ?? 0;
  const totalPages = Math.ceil(total / 12);

  const toggleAmenity = (a: string) => {
    setFilters((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(a)
        ? prev.amenities.filter((x) => x !== a)
        : [...prev.amenities, a],
    }));
    setPage(1);
  };

  const handleFilterChange = useCallback(<K extends keyof FilterState>(key: K, val: FilterState[K]) => {
    setFilters((prev) => ({ ...prev, [key]: val }));
    setPage(1);
  }, []);

  const clearFilters = () => {
    setFilters({
      college_id: "",
      radius_km: 2,
      property_type: "",
      gender: "",
      budget_min: "",
      budget_max: "",
      availability_status: "",
      amenities: [],
      sort: "newest",
    });
    setSelectedCity("");
    setPage(1);
  };

  const activeFilterCount = [
    filters.college_id,
    filters.property_type,
    filters.gender,
    filters.budget_min,
    filters.budget_max,
    filters.availability_status,
    ...filters.amenities,
  ].filter(Boolean).length;

  // Map effect
  useEffect(() => {
    if (viewMode !== "map" || !mapRef.current) return;
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }
    const map = L.map(mapRef.current).setView([20.5937, 78.9629], 5);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
    }).addTo(map);
    const bounds = L.latLngBounds([]);
    items.forEach((p) => {
      if (p.latitude && p.longitude) {
        bounds.extend([p.latitude, p.longitude]);
        const marker = L.marker([p.latitude, p.longitude]).addTo(map);
        marker.bindPopup(`
          <div class="text-xs p-1">
            <span class="font-black text-amber-600 block mb-1">${p.property_type.replace(/_/g, " ")}</span>
            <b class="text-sm">${p.title}</b><br/>
            <span class="font-bold">₹${p.rent_min.toLocaleString()}</span>/mo<br/>
            <a href="/properties/${p.property_id}" target="_blank" class="mt-2 inline-block font-bold text-blue-600">View Details →</a>
          </div>
        `);
      }
    });
    if (bounds.isValid()) map.fitBounds(bounds, { padding: [50, 50] });
    mapInstanceRef.current = map;
    return () => { map.remove(); mapInstanceRef.current = null; };
  }, [viewMode, items]);

  const isLoading = propertiesQuery.isFetching;

  return (
    <div style={{ minHeight: "100vh", background: "var(--surface)" }}>
      {/* ── Hero Header ── */}
      <div
        className="relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #0f1f3d 100%)",
          padding: "3rem 1.5rem 2rem",
        }}
      >
        {/* Ambient glows */}
        <div className="pointer-events-none absolute -top-20 left-1/4 h-64 w-64 rounded-full opacity-20"
          style={{ background: "var(--primary)", filter: "blur(80px)" }} />
        <div className="pointer-events-none absolute -right-20 top-10 h-48 w-48 rounded-full opacity-15"
          style={{ background: "#7c3aed", filter: "blur(60px)" }} />

        <div className="relative mx-auto max-w-6xl">
          <Reveal>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-400">
              🏠 Student Housing
            </p>
            <h1 className="mt-2 text-4xl font-black text-white md:text-5xl" style={{ letterSpacing: "-0.03em" }}>
              Discover Your<br />
              <span style={{ background: "var(--gradient-amber)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                Perfect PG
              </span>
            </h1>
            <p className="mt-3 text-sm text-slate-300 max-w-lg">
              Browse {total > 0 ? total : "all"} verified listings near top colleges. Filter by budget, amenities, and distance to find your ideal home away from home.
            </p>
          </Reveal>

          {/* Quick stats */}
          <Reveal delayMs={60}>
            <div className="mt-6 flex flex-wrap gap-4">
              {[
                { icon: "🏘️", label: "Total Listings", val: total },
                { icon: "✅", label: "Admin Verified", val: total },
                { icon: "⚡", label: "Instant Inquiry", val: null },
              ].map((s) => (
                <div key={s.label} className="flex items-center gap-2 rounded-full px-4 py-2"
                  style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}>
                  <span className="text-base">{s.icon}</span>
                  <span className="text-xs font-bold text-white/80">{s.label}</span>
                  {s.val !== null && (
                    <span className="text-xs font-black text-amber-400">
                      <AnimatedNumber value={s.val} />
                    </span>
                  )}
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-6 md:px-6">
        {/* ── Filter Panel ── */}
        <Reveal>
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: "var(--glass-bg)",
              border: "1px solid var(--glass-border)",
              boxShadow: "var(--shadow-card)",
            }}
          >
            {/* Filter header bar */}
            <div className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: "1px solid var(--glass-border)" }}>
              <div className="flex items-center gap-3">
                <span className="text-lg">🔍</span>
                <div>
                  <p className="text-sm font-black" style={{ color: "var(--on-surface)" }}>Filter & Search</p>
                  <p className="text-xs" style={{ color: "var(--outline)" }}>
                    {activeFilterCount > 0 ? `${activeFilterCount} filter${activeFilterCount > 1 ? "s" : ""} active` : "No filters applied — showing all listings"}
                  </p>
                </div>
                {activeFilterCount > 0 && (
                  <span className="rounded-full px-2.5 py-0.5 text-xs font-black text-white"
                    style={{ background: "var(--primary)" }}>
                    {activeFilterCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {activeFilterCount > 0 && (
                  <button
                    onClick={clearFilters}
                    className="rounded-full px-3 py-1.5 text-xs font-bold transition-all hover:opacity-80"
                    style={{ background: "rgba(186,26,26,0.1)", color: "var(--error)" }}
                  >
                    Clear all
                  </button>
                )}
                <button
                  onClick={() => setFiltersExpanded(!filtersExpanded)}
                  className="flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition-all"
                  style={{
                    background: filtersExpanded ? "var(--primary)" : "var(--surface-container)",
                    color: filtersExpanded ? "#fff" : "var(--on-surface)",
                  }}
                >
                  {filtersExpanded ? "▲ Collapse" : "▼ More Filters"}
                </button>
              </div>
            </div>

            {/* Always-visible quick filters */}
            <div className="px-5 py-4">
              <div className="grid gap-3 grid-cols-2 md:grid-cols-4 lg:grid-cols-5">
                {/* City */}
                <label className="block">
                  <span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.1em]"
                    style={{ color: "var(--outline)" }}>City</span>
                  <select
                    value={selectedCity}
                    onChange={(e) => { setSelectedCity(e.target.value); handleFilterChange("college_id", ""); }}
                    className="input-field !py-2.5 !text-sm"
                  >
                    <option value="">All Cities</option>
                    {uniqueCities.map((city) => <option key={city} value={city}>{city}</option>)}
                  </select>
                </label>

                {/* College */}
                <label className="block">
                  <span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.1em]"
                    style={{ color: "var(--outline)" }}>College</span>
                  <select
                    value={filters.college_id}
                    onChange={(e) => handleFilterChange("college_id", e.target.value)}
                    className="input-field !py-2.5 !text-sm"
                  >
                    <option value="">Any College</option>
                    {filteredColleges.map((c) => (
                      <option key={c.college_id} value={c.college_id}>
                        {c.short_name || c.name}
                      </option>
                    ))}
                  </select>
                </label>

                {/* Property Type */}
                <label className="block">
                  <span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.1em]"
                    style={{ color: "var(--outline)" }}>Type</span>
                  <select
                    value={filters.property_type}
                    onChange={(e) => handleFilterChange("property_type", e.target.value)}
                    className="input-field !py-2.5 !text-sm"
                  >
                    <option value="">All Types</option>
                    <option value="pg">PG</option>
                    <option value="flat">Flat</option>
                    <option value="hostel">Hostel</option>
                    <option value="single_room">Single Room</option>
                    <option value="co_living">Co-living</option>
                  </select>
                </label>

                {/* Sort */}
                <label className="block">
                  <span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.1em]"
                    style={{ color: "var(--outline)" }}>Sort By</span>
                  <select
                    value={filters.sort}
                    onChange={(e) => handleFilterChange("sort", e.target.value)}
                    className="input-field !py-2.5 !text-sm"
                  >
                    <option value="newest">Newest First</option>
                    {filters.college_id && <option value="nearest">Nearest First</option>}
                    <option value="lowest_price">Lowest Price</option>
                    <option value="highest_rated">Highest Rated</option>
                    <option value="popular">Most Popular</option>
                  </select>
                </label>

                {/* Gender */}
                <label className="block">
                  <span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.1em]"
                    style={{ color: "var(--outline)" }}>For</span>
                  <select
                    value={filters.gender}
                    onChange={(e) => handleFilterChange("gender", e.target.value)}
                    className="input-field !py-2.5 !text-sm"
                  >
                    <option value="">Anyone</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="any">Co-ed</option>
                  </select>
                </label>
              </div>
            </div>

            {/* Expanded filters */}
            {filtersExpanded && (
              <div className="px-5 pb-5 space-y-5" style={{ borderTop: "1px solid var(--glass-border)" }}>
                <div className="pt-5 grid gap-4 md:grid-cols-3">
                  {/* Budget Min */}
                  <label className="block">
                    <span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.1em]"
                      style={{ color: "var(--outline)" }}>Budget Min (₹/mo)</span>
                    <input
                      type="number"
                      placeholder="e.g. 3000"
                      value={filters.budget_min}
                      onChange={(e) => handleFilterChange("budget_min", e.target.value)}
                      className="input-field !py-2.5"
                    />
                  </label>

                  {/* Budget Max */}
                  <label className="block">
                    <span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.1em]"
                      style={{ color: "var(--outline)" }}>Budget Max (₹/mo)</span>
                    <input
                      type="number"
                      placeholder="e.g. 15000"
                      value={filters.budget_max}
                      onChange={(e) => handleFilterChange("budget_max", e.target.value)}
                      className="input-field !py-2.5"
                    />
                  </label>

                  {/* Availability */}
                  <label className="block">
                    <span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.1em]"
                      style={{ color: "var(--outline)" }}>Availability</span>
                    <select
                      value={filters.availability_status}
                      onChange={(e) => handleFilterChange("availability_status", e.target.value)}
                      className="input-field !py-2.5 !text-sm"
                    >
                      <option value="">Any Status</option>
                      <option value="available">Available Now</option>
                      <option value="limited">Limited Spots</option>
                      <option value="full">Full / Waitlist</option>
                    </select>
                  </label>
                </div>

                {/* Distance slider — only show if college selected */}
                {filters.college_id && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-black uppercase tracking-[0.1em]"
                        style={{ color: "var(--outline)" }}>Radius from College</span>
                      <span className="text-sm font-black" style={{ color: "var(--primary)" }}>
                        {filters.radius_km} km
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="15"
                      step="0.5"
                      value={filters.radius_km}
                      onChange={(e) => handleFilterChange("radius_km", Number(e.target.value))}
                      className="w-full accent-amber-500"
                    />
                    <div className="flex justify-between text-[10px] mt-1" style={{ color: "var(--outline)" }}>
                      <span>0.5 km</span>
                      <span>15 km</span>
                    </div>
                  </div>
                )}

                {/* Amenities */}
                <div>
                  <span className="mb-3 block text-[10px] font-black uppercase tracking-[0.1em]"
                    style={{ color: "var(--outline)" }}>Amenities (must have)</span>
                  <div className="flex flex-wrap gap-2">
                    {AMENITY_OPTIONS.map((a) => {
                      const active = filters.amenities.includes(a);
                      return (
                        <button
                          key={a}
                          onClick={() => toggleAmenity(a)}
                          className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all duration-200 hover:scale-105 active:scale-95"
                          style={{
                            background: active ? "var(--primary)" : "var(--surface-container)",
                            color: active ? "#fff" : "var(--on-surface-variant)",
                            border: active ? "none" : "1px solid var(--glass-border)",
                          }}
                        >
                          <span>{AMENITY_ICONS[a]}</span>
                          <span className="capitalize">{a.replace(/_/g, " ")}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </Reveal>

        {/* ── Results Bar ── */}
        <Reveal className="mt-6" delayMs={50}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-sm" style={{ color: "var(--on-surface-variant)" }}>
                <span className="text-xl font-black" style={{ color: "var(--on-surface)" }}>
                  <AnimatedNumber value={total} />
                </span>{" "}
                {filters.college_id ? "properties near selected college" : "properties available"}
                {totalPages > 1 && (
                  <span className="ml-2 text-xs" style={{ color: "var(--outline)" }}>
                    · Page {page} of {totalPages}
                  </span>
                )}
              </p>
            </div>

            {/* View mode toggle */}
            <div className="flex items-center gap-2 rounded-xl p-1" style={{ background: "var(--surface-container)" }}>
              <button
                onClick={() => setViewMode("grid")}
                className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold transition-all"
                style={
                  viewMode === "grid"
                    ? { background: "var(--primary)", color: "#fff" }
                    : { color: "var(--on-surface-variant)" }
                }
              >
                ⊞ Grid
              </button>
              <button
                onClick={() => setViewMode("map")}
                className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold transition-all"
                style={
                  viewMode === "map"
                    ? { background: "var(--primary)", color: "#fff" }
                    : { color: "var(--on-surface-variant)" }
                }
              >
                🗺️ Map
              </button>
            </div>
          </div>
        </Reveal>

        {/* ── Property Grid or Map ── */}
        <div className="mt-5">
          {isLoading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-80 skeleton-shimmer rounded-2xl" />
              ))}
            </div>
          ) : propertiesQuery.isError ? (
            <div className="rounded-2xl p-12 text-center" style={{ background: "var(--error-container)", color: "#9f1239" }}>
              <p className="text-2xl">😕</p>
              <p className="mt-3 font-black text-lg">Unable to load listings</p>
              <p className="mt-1 text-sm opacity-70">Check your connection and try again</p>
              <button onClick={() => propertiesQuery.refetch()}
                className="mt-4 rounded-full px-5 py-2 text-sm font-bold"
                style={{ background: "var(--error)", color: "#fff" }}>
                Retry
              </button>
            </div>
          ) : viewMode === "map" ? (
            <Reveal>
              <div className="overflow-hidden rounded-3xl border" style={{ borderColor: "var(--glass-border)", height: "600px" }}>
                <div ref={mapRef} className="h-full w-full" />
              </div>
            </Reveal>
          ) : items.length === 0 ? (
            <div className="rounded-3xl p-16 text-center" style={{ background: "var(--surface-container-low)" }}>
              <p className="text-6xl">🏠</p>
              <p className="mt-4 text-xl font-black" style={{ color: "var(--on-surface)" }}>
                No listings match your filters
              </p>
              <p className="mt-2 text-sm" style={{ color: "var(--outline)" }}>
                Try adjusting your filters or expanding the search radius
              </p>
              <button onClick={clearFilters}
                className="mt-6 btn-primary !px-8 !py-3">
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {items.map((listing, i) => (
                <Reveal key={listing.property_id} delayMs={i * 30}>
                  <ListingCard listing={listing} />
                </Reveal>
              ))}
            </div>
          )}
        </div>

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <Reveal className="mt-10" delayMs={80}>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => { setPage((p) => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                disabled={page === 1}
                className="rounded-full px-5 py-2.5 text-sm font-bold transition-all disabled:opacity-40"
                style={{ background: "var(--surface-container)", color: "var(--on-surface)" }}
              >
                ← Prev
              </button>
              <div className="flex gap-1">
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  const p = i + 1;
                  return (
                    <button
                      key={p}
                      onClick={() => { setPage(p); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                      className="h-9 w-9 rounded-full text-sm font-bold transition-all"
                      style={
                        page === p
                          ? { background: "var(--gradient-amber)", color: "#fff" }
                          : { background: "var(--surface-container)", color: "var(--on-surface-variant)" }
                      }
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => { setPage((p) => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                disabled={page === totalPages}
                className="rounded-full px-5 py-2.5 text-sm font-bold transition-all disabled:opacity-40"
                style={{ background: "var(--surface-container)", color: "var(--on-surface)" }}
              >
                Next →
              </button>
            </div>
          </Reveal>
        )}

        <div className="pb-16" />
      </div>
    </div>
  );
}
