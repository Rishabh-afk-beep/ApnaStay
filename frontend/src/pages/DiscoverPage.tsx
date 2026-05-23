import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, Link } from "react-router-dom";
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

import { SearchFilters } from "../components/filters/SearchFilters";
import { ListingCard } from "../components/listings/ListingCard";
import { Reveal } from "../components/ui/Reveal";
import { AnimatedNumber } from "../components/ui/AnimatedNumber";
import { searchProperties } from "../lib/api";

export function DiscoverPage() {
  const location = useLocation();
  const [params, setParams] = useState({
    college_id: location.state?.collegeId || "",
    radius_km: 2,
    property_type: undefined as string | undefined,
    gender: undefined as string | undefined,
    budget_min: undefined as number | undefined,
    budget_max: undefined as number | undefined,
    availability_status: undefined as string | undefined,
    amenities: undefined as string[] | undefined,
    sort: "nearest",
    page: 1,
    limit: 12,
  });

  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  const propertiesQuery = useQuery({
    queryKey: ["properties", params],
    queryFn: () => searchProperties(params),
    // Only fetch when a college has been selected
    enabled: Boolean(params.college_id),
  });

  const items = propertiesQuery.data?.items ?? [];
  const total = propertiesQuery.data?.total ?? 0;
  const totalPages = Math.ceil(total / params.limit);

  const handleApply = (filters: {
    collegeId: string;
    radius: number;
    propertyType?: string;
    gender?: string;
    budgetMin?: number;
    budgetMax?: number;
    availabilityStatus?: string;
    amenities?: string[];
    sort?: string;
  }) => {
    setParams({
      college_id: filters.collegeId,
      radius_km: filters.radius,
      property_type: filters.propertyType,
      gender: filters.gender,
      budget_min: filters.budgetMin,
      budget_max: filters.budgetMax,
      availability_status: filters.availabilityStatus,
      amenities: filters.amenities,
      sort: filters.sort || "nearest",
      page: 1,
      limit: 12,
    });
  };

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
            <span class="font-bold">₹${p.rent_min}</span>/mo<br/>
            <a href="/properties/${p.property_id}" target="_blank" class="mt-2 inline-block font-bold text-blue-600">View Details</a>
          </div>
        `);
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
  }, [viewMode, items]);

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      {/* Header */}
      <Reveal>
        <div className="mb-8">
          <p
            className="mb-2 text-xs font-bold uppercase tracking-widest"
            style={{ color: "var(--primary)", letterSpacing: "0.1em" }}
          >
            Browse Properties
          </p>
          <h1
            className="text-3xl font-black md:text-4xl"
            style={{ color: "var(--on-surface)", letterSpacing: "-0.02em" }}
          >
            Discover your next home
          </h1>
        </div>
      </Reveal>

      <Reveal delayMs={40}>
        <div className="glass-card-static p-6">
          <SearchFilters onApply={handleApply} />
        </div>
      </Reveal>

      <Reveal className="mt-8" delayMs={60}>
        <div className="mb-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <p className="text-sm font-semibold" style={{ color: "var(--on-surface-variant)" }}>
            <AnimatedNumber
              value={total}
              className="text-lg font-black"
              style={{ color: "var(--on-surface)" }}
            />{" "}
            listings found
            {totalPages > 1 && (
              <span className="ml-3 text-xs" style={{ color: "var(--outline)" }}>
                (Page {params.page} of {totalPages})
              </span>
            )}
          </p>

          <div className="flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all ${
                viewMode === "list"
                  ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white"
                  : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
              }`}
            >
              📋 List View
            </button>
            <button
              onClick={() => setViewMode("map")}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all ${
                viewMode === "map"
                  ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white"
                  : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
              }`}
            >
              🗺️ Map View
            </button>
          </div>
        </div>
      </Reveal>

      {/* No college selected yet — prompt user */}
      {!params.college_id && (
        <div
          className="mt-8 rounded-3xl p-12 text-center"
          style={{ background: "var(--surface-container-low)" }}
        >
          <p className="text-5xl">🎓</p>
          <p className="mt-4 text-xl font-black" style={{ color: "var(--on-surface)" }}>
            Select your college to get started
          </p>
          <p className="mt-2 text-sm" style={{ color: "var(--outline)" }}>
            Choose a city and campus above, then click <strong>Apply Filters</strong> to see listings nearby.
          </p>
        </div>
      )}

      {params.college_id && propertiesQuery.isLoading && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-80 skeleton-shimmer" />
          ))}
        </div>
      )}

      {params.college_id && propertiesQuery.isError && (
        <div
          className="rounded-2xl p-8 text-center"
          style={{
            background: "var(--error-container)",
            color: "#9f1239",
          }}
        >
          <p className="text-lg font-black">Unable to load listings</p>
          <p className="mt-1 text-sm opacity-70">Check your connection and try again</p>
        </div>
      )}

      {viewMode === "list" ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.map((listing) => (
            <Reveal key={listing.property_id}>
              <ListingCard listing={listing} />
            </Reveal>
          ))}
        </div>
      ) : (
        <Reveal delayMs={100}>
          <div className="overflow-hidden rounded-3xl border" style={{ borderColor: "var(--surface-container-high)" }}>
            <div ref={mapRef} className="h-[600px] w-full" />
          </div>
        </Reveal>
      )}

      {params.college_id && items.length === 0 && !propertiesQuery.isLoading && !propertiesQuery.isError && (
        <div
          className="mt-8 rounded-3xl p-12 text-center"
          style={{ background: "var(--surface-container-low)" }}
        >
          <p className="text-5xl">🔍</p>
          <p className="mt-4 text-xl font-black" style={{ color: "var(--on-surface)" }}>
            No listings match your filters
          </p>
          <p className="mt-2 text-sm" style={{ color: "var(--outline)" }}>
            Try adjusting the radius, budget, or property type
          </p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Reveal className="mt-10">
          <div className="flex items-center justify-center gap-2">
            <button
              disabled={params.page <= 1}
              onClick={() => setParams((prev) => ({ ...prev, page: prev.page - 1 }))}
              className="btn-ghost disabled:opacity-30"
            >
              ← Prev
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
              const pageNum = i + 1;
              return (
                <button
                  key={pageNum}
                  onClick={() => setParams((prev) => ({ ...prev, page: pageNum }))}
                  className="h-11 w-11 rounded-full text-sm font-bold transition-all"
                  style={
                    params.page === pageNum
                      ? { background: "var(--gradient-amber)", color: "var(--on-primary)" }
                      : { color: "var(--on-surface-variant)" }
                  }
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              disabled={params.page >= totalPages}
              onClick={() => setParams((prev) => ({ ...prev, page: prev.page + 1 }))}
              className="btn-ghost disabled:opacity-30"
            >
              Next →
            </button>
          </div>
        </Reveal>
      )}
    </main>
  );
}
