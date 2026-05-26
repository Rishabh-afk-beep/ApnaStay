import { useState } from "react";
import { useMutation, useQuery, useQueries, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";

import { listShortlists, removeShortlist, getPropertyDetail } from "../lib/api";
import { Reveal } from "../components/ui/Reveal";
import { AnimatedNumber } from "../components/ui/AnimatedNumber";
import { ListingCard } from "../components/listings/ListingCard";

export function ShortlistsPage() {
  const queryClient = useQueryClient();
  const shortlistQuery = useQuery({
    queryKey: ["shortlists"],
    queryFn: listShortlists,
  });

  const items = shortlistQuery.data ?? [];

  const propertyQueries = useQueries({
    queries: items.map(item => ({
      queryKey: ["property-detail", item.property_id],
      queryFn: () => getPropertyDetail(item.property_id),
      staleTime: 60000,
    })),
  });

  const properties = propertyQueries.map(q => q.data).filter(Boolean) as any[];

  const removeMutation = useMutation({
    mutationFn: (propertyId: string) => removeShortlist(propertyId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["shortlists"] }),
  });

  const [viewMode, setViewMode] = useState<"list" | "compare">("list");

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <Reveal>
        <section
          className="relative overflow-hidden rounded-3xl p-6 md:p-8"
          style={{ background: "linear-gradient(135deg, #451a03 0%, #78350f 60%, #92400e 100%)" }}
        >
          <div
            className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-20"
            style={{ background: "var(--on-primary)", filter: "blur(40px)" }}
          />
          <div className="relative z-10">
            <p
              className="text-xs font-bold uppercase tracking-widest"
              style={{ color: "rgba(255,255,255,0.60)", letterSpacing: "0.15em" }}
            >
              Your Collection
            </p>
            <h1 className="mt-2 text-3xl font-black" style={{ color: "var(--on-primary)" }}>
              Saved Listings
            </h1>
            <p className="mt-2 text-sm" style={{ color: "rgba(255,255,255,0.75)" }}>
              <AnimatedNumber value={items.length} /> properties you&apos;ve shortlisted
            </p>
          </div>
        </section>
      </Reveal>

      <Reveal className="mt-8" delayMs={60}>
        {shortlistQuery.isLoading && (
          <div className="grid gap-5 md:grid-cols-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-36 skeleton-shimmer" />
            ))}
          </div>
        )}

        {items.length === 0 && !shortlistQuery.isLoading && (
          <div
            className="rounded-3xl p-12 text-center"
            style={{ background: "var(--surface-container-low)" }}
          >
            <p className="text-5xl">🏠</p>
            <p className="mt-4 text-xl font-black" style={{ color: "var(--on-surface)" }}>
              No saved listings yet
            </p>
            <p className="mt-2 text-sm" style={{ color: "var(--outline)" }}>
              Browse and tap the heart icon to save listings
            </p>
            <Link to="/discover" className="btn-primary mt-6 inline-flex">
              Explore Listings
            </Link>
          </div>
        )}

        <div className="mb-6 mt-8 flex justify-end">
          <div className="flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all ${
                viewMode === "list"
                  ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white"
                  : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
              }`}
            >
              📋 Standard View
            </button>
            <button
              onClick={() => setViewMode("compare")}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all ${
                viewMode === "compare"
                  ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white"
                  : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
              }`}
            >
              ⚖️ Compare View
            </button>
          </div>
        </div>

        {viewMode === "list" ? (
          <div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {properties.map((item) => (
              <ListingCard key={item.property_id} listing={item} />
            ))}
          </div>
        ) : (
          <div className="mt-5 overflow-x-auto rounded-2xl border" style={{ borderColor: "var(--surface-container-high)", background: "var(--surface-container)" }}>
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead style={{ background: "var(--surface-container-high)" }}>
                <tr>
                  <th className="p-4 font-black">Feature</th>
                  {properties.map(p => (
                    <th key={p.property_id} className="p-4 font-black w-64">
                      {p.title}
                      <button 
                        onClick={() => removeMutation.mutate(p.property_id)}
                        className="ml-2 text-red-500 text-xs font-normal underline"
                      >
                        Remove
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: "var(--surface-container-high)" }}>
                <tr>
                  <td className="p-4 font-bold opacity-70">Type</td>
                  {properties.map(p => <td key={p.property_id} className="p-4 font-bold">{p.property_type.replace("_", " ")}</td>)}
                </tr>
                <tr>
                  <td className="p-4 font-bold opacity-70">Rent/Mo</td>
                  {properties.map(p => <td key={p.property_id} className="p-4 text-emerald-600 font-black dark:text-emerald-400">₹{p.rent_min} - ₹{p.rent_max}</td>)}
                </tr>
                <tr>
                  <td className="p-4 font-bold opacity-70">Deposit</td>
                  {properties.map(p => <td key={p.property_id} className="p-4">₹{p.security_deposit}</td>)}
                </tr>
                <tr>
                  <td className="p-4 font-bold opacity-70">Rating</td>
                  {properties.map(p => <td key={p.property_id} className="p-4">{p.rating_avg > 0 ? `⭐ ${p.rating_avg}` : "No ratings"}</td>)}
                </tr>
                <tr>
                  <td className="p-4 font-bold opacity-70">Gender</td>
                  {properties.map(p => <td key={p.property_id} className="p-4">{p.metadata?.gender || "Any"}</td>)}
                </tr>
                <tr>
                  <td className="p-4 font-bold opacity-70">Food</td>
                  {properties.map(p => <td key={p.property_id} className="p-4">{p.food_available ? "✅ Yes" : "❌ No"}</td>)}
                </tr>
                <tr>
                  <td className="p-4 font-bold opacity-70">Actions</td>
                  {properties.map(p => (
                    <td key={p.property_id} className="p-4">
                      <Link to={`/properties/${p.property_id}`} className="btn-primary text-xs w-full block text-center py-2">
                        View Detailed
                      </Link>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </Reveal>
    </main>
  );
}
