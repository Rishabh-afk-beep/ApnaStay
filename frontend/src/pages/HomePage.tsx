import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";

import { SearchFilters } from "../components/filters/SearchFilters";
import { ListingCard } from "../components/listings/ListingCard";
import { Reveal } from "../components/ui/Reveal";
import { searchProperties } from "../lib/api";

export function HomePage() {
  const location = useLocation();
  const [filters, setFilters] = useState({
    collegeId: location.state?.collegeId || "sample-college-1",
    radius: 2,
    propertyType: undefined as string | undefined,
    gender: undefined as string | undefined,
    budgetMin: undefined as number | undefined,
    budgetMax: undefined as number | undefined,
    amenities: undefined as string[] | undefined,
    sort: "nearest",
  });

  const query = useQuery({
    queryKey: ["properties", filters],
    queryFn: () =>
      searchProperties({
        college_id: filters.collegeId,
        radius_km: filters.radius,
        property_type: filters.propertyType,
        gender: filters.gender,
        budget_min: filters.budgetMin,
        budget_max: filters.budgetMax,
        amenities: filters.amenities,
        sort: filters.sort,
        page: 1,
        limit: 20,
      }),
  });

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      {/* Hero header */}
      <Reveal>
        <section className="section-dark relative overflow-hidden">
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full opacity-15"
            style={{ background: "var(--primary-fixed-dim)", filter: "blur(60px)" }} />
          <div className="relative z-10">
            <p className="text-xs font-bold uppercase tracking-widest"
              style={{ color: "var(--primary-fixed-dim)", letterSpacing: "0.15em" }}>
              Discover
            </p>
            <h1 className="mt-2 text-3xl font-black md:text-4xl" style={{ color: "var(--inverse-on-surface)" }}>
              Find nearby rentals around your college
            </h1>
            <p className="mt-3 max-w-2xl text-sm md:text-base" style={{ color: "var(--inverse-on-surface)", opacity: 0.7 }}>
              Filter by radius, property type, and budget to find rooms that match your student lifestyle.
            </p>
          </div>
        </section>
      </Reveal>

      {/* Filters */}
      <Reveal className="mt-8" delayMs={60}>
        <div className="glass-card-static p-6">
          <SearchFilters onApply={(v) => setFilters({
            collegeId: v.collegeId,
            radius: v.radius,
            propertyType: v.propertyType,
            gender: v.gender,
            budgetMin: v.budgetMin,
            budgetMax: v.budgetMax,
            amenities: v.amenities,
            sort: v.sort || "nearest",
          })} />
        </div>
      </Reveal>

      {/* Results header */}
      <Reveal className="mt-8" delayMs={80}>
        <section className="flex items-center justify-between">
          <h2 className="text-xl font-black" style={{ color: "var(--on-surface)" }}>Available listings</h2>
          <p className="text-sm font-semibold" style={{ color: "var(--outline)" }}>{query.data?.total ?? 0} results</p>
        </section>
      </Reveal>

      {/* States */}
      {query.isLoading && (
        <div className="mt-5 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-80 skeleton-shimmer" />)}
        </div>
      )}
      {query.isError && (
        <div className="mt-5 rounded-2xl p-6 text-center" style={{ background: "var(--error-container)", color: "#9f1239" }}>
          <p className="font-black">Failed to load listings.</p>
        </div>
      )}
      {!query.isLoading && !query.isError && (query.data?.items.length ?? 0) === 0 && (
        <div className="mt-5 rounded-3xl p-12 text-center" style={{ background: "var(--surface-container-low)" }}>
          <p className="text-5xl">🔍</p>
          <p className="mt-4 text-lg font-black" style={{ color: "var(--on-surface)" }}>No listings found</p>
          <p className="mt-2 text-sm" style={{ color: "var(--outline)" }}>
            Try increasing radius or changing property type.
          </p>
        </div>
      )}

      {/* Listings Grid */}
      <section className="mt-5 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {query.data?.items.map((item) => (
          <Reveal key={item.property_id}>
            <ListingCard listing={item} />
          </Reveal>
        ))}
      </section>
    </main>
  );
}
