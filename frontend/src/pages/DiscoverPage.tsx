import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";

import { SearchFilters } from "../components/filters/SearchFilters";
import { ListingCard } from "../components/listings/ListingCard";
import { Reveal } from "../components/ui/Reveal";
import { AnimatedNumber } from "../components/ui/AnimatedNumber";
import { searchProperties } from "../lib/api";

export function DiscoverPage() {
  const location = useLocation();
  const [params, setParams] = useState({
    college_id: location.state?.collegeId || "sample-college-1",
    radius_km: 2,
    property_type: undefined as string | undefined,
    gender: undefined as string | undefined,
    budget_min: undefined as number | undefined,
    budget_max: undefined as number | undefined,
    amenities: undefined as string[] | undefined,
    sort: "nearest",
    page: 1,
    limit: 12,
  });

  const propertiesQuery = useQuery({
    queryKey: ["properties", params],
    queryFn: () => searchProperties(params),
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
      amenities: filters.amenities,
      sort: filters.sort || "nearest",
      page: 1,
      limit: 12,
    });
  };

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
        <div className="mb-5 flex items-center justify-between">
          <p className="text-sm font-semibold" style={{ color: "var(--on-surface-variant)" }}>
            <AnimatedNumber
              value={total}
              className="text-lg font-black"
              style={{ color: "var(--on-surface)" }}
            />{" "}
            listings found
          </p>
          {totalPages > 1 && (
            <p className="text-sm" style={{ color: "var(--outline)" }}>
              Page {params.page} of {totalPages}
            </p>
          )}
        </div>
      </Reveal>

      {propertiesQuery.isLoading && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-80 skeleton-shimmer" />
          ))}
        </div>
      )}

      {propertiesQuery.isError && (
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

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {items.map((listing) => (
          <Reveal key={listing.property_id}>
            <ListingCard listing={listing} />
          </Reveal>
        ))}
      </div>

      {items.length === 0 && !propertiesQuery.isLoading && !propertiesQuery.isError && (
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
