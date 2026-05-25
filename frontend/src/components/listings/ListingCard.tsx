import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { PropertyCard } from "../../types";
import { addShortlist, removeShortlist, getOptimizedImageUrl, getPropertyDetail } from "../../lib/api";
import { useState } from "react";

export function ListingCard({ listing }: { listing: PropertyCard }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [shortlisted, setShortlisted] = useState(false);

  const shortlistMutation = useMutation({
    mutationFn: async () => {
      if (shortlisted) {
        await removeShortlist(listing.property_id);
      } else {
        await addShortlist(listing.property_id);
      }
    },
    onSuccess: () => {
      setShortlisted(!shortlisted);
      queryClient.invalidateQueries({ queryKey: ["shortlists"] });
    },
  });

  const handlePrefetch = () => {
    queryClient.prefetchQuery({
      queryKey: ["property-detail", listing.property_id],
      queryFn: () => getPropertyDetail(listing.property_id),
      staleTime: 60000,
    });
  };

  const handleCardClick = () => {
    navigate(`/properties/${listing.property_id}`);
  };

  const handleShortlistClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    shortlistMutation.mutate();
  };

  return (
    <article
      className="glass-card group overflow-hidden cursor-pointer"
      onMouseEnter={handlePrefetch}
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && handleCardClick()}
    >
      {/* Image */}
      {listing.cover_image_url ? (
        <div className="relative overflow-hidden rounded-t-[19px]">
          <img
            src={getOptimizedImageUrl(listing.cover_image_url, 600, 400)}
            alt={listing.title}
            className="h-52 w-full object-cover transition duration-500 group-hover:scale-110"
            loading="lazy"
          />
          {/* Gradient overlay */}
          <div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.5) 100%)",
            }}
          />
          <button
            onClick={handleShortlistClick}
            className={`absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full text-lg transition-all duration-300 hover:scale-110 active:scale-95 ${shortlisted ? "animate-heart-pop text-red-500 scale-105" : "text-white"}`}
            style={{
              background: "var(--glass-bg)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(255,255,255,0.2)",
            }}
            aria-label="Toggle shortlist"
          >
            {shortlisted ? "❤️" : "🤍"}
          </button>
          {listing.featured ? (
            <span
              className="absolute left-3 top-3 rounded-full px-3 py-1.5 text-xs font-bold shadow-sm"
              style={{ background: "var(--gradient-amber)", color: "var(--on-primary)" }}
            >
              ✦ Featured
            </span>
          ) : listing.rating_avg >= 4.5 && listing.review_count >= 2 ? (
            <span
              className="absolute left-3 top-3 rounded-full px-3 py-1.5 text-xs font-bold shadow-sm"
              style={{ background: "var(--success)", color: "var(--on-primary)" }}
            >
              ⭐ Top Rated
            </span>
          ) : listing.review_count >= 5 ? (
            <span
              className="absolute left-3 top-3 rounded-full px-3 py-1.5 text-xs font-bold shadow-sm"
              style={{ background: "var(--error)", color: "var(--on-primary)" }}
            >
              🔥 High Demand
            </span>
          ) : null}
          {/* Bottom rent overlay */}
          <div className="absolute bottom-3 left-4">
            <span className="text-2xl font-black text-white drop-shadow-lg">
              ₹{listing.rent_min.toLocaleString()}
            </span>
            <span className="text-sm text-white/80"> – ₹{listing.rent_max.toLocaleString()}/mo</span>
          </div>
        </div>
      ) : (
        <div
          className="relative flex h-52 items-center justify-center rounded-t-[19px]"
          style={{
            background: "linear-gradient(135deg, var(--surface-container) 0%, var(--surface-container-high) 100%)",
          }}
        >
          <span className="text-5xl opacity-60">🏠</span>
          <button
            onClick={handleShortlistClick}
            className={`absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full text-lg transition-all duration-300 hover:scale-110 active:scale-95 ${shortlisted ? "animate-heart-pop text-red-500 scale-105" : "text-white"}`}
            style={{
              background: "var(--glass-bg)",
              backdropFilter: "blur(12px)",
              border: "1px solid var(--glass-border)",
            }}
            aria-label="Toggle shortlist"
          >
            {shortlisted ? "❤️" : "🤍"}
          </button>
          {listing.featured ? (
            <span
              className="absolute left-3 top-3 rounded-full px-3 py-1.5 text-xs font-bold shadow-sm"
              style={{ background: "var(--gradient-amber)", color: "var(--on-primary)" }}
            >
              ✦ Featured
            </span>
          ) : listing.rating_avg >= 4.5 && listing.review_count >= 2 ? (
            <span
              className="absolute left-3 top-3 rounded-full px-3 py-1.5 text-xs font-bold shadow-sm"
              style={{ background: "var(--success)", color: "var(--on-primary)" }}
            >
              ⭐ Top Rated
            </span>
          ) : listing.review_count >= 5 ? (
            <span
              className="absolute left-3 top-3 rounded-full px-3 py-1.5 text-xs font-bold shadow-sm"
              style={{ background: "var(--error)", color: "var(--on-primary)" }}
            >
              🔥 High Demand
            </span>
          ) : null}
          {/* Bottom rent overlay */}
          <div className="absolute bottom-3 left-4">
            <span className="text-2xl font-black" style={{ color: "var(--on-surface)" }}>
              ₹{listing.rent_min.toLocaleString()}
            </span>
            <span className="text-sm" style={{ color: "var(--on-surface-variant)" }}>
              {" "}– ₹{listing.rent_max.toLocaleString()}/mo
            </span>
          </div>
        </div>
      )}

      <div className="p-5">
        <div className="mb-2 flex items-start justify-between gap-2">
          <h3 className="text-lg font-black leading-tight" style={{ color: "var(--on-surface)" }}>
            {listing.title}
          </h3>
          <span className="badge badge-amber flex-shrink-0">
            {listing.property_type.replace(/_/g, " ")}
          </span>
        </div>

        {listing.address_text && (
          <p className="text-sm" style={{ color: "var(--outline)" }}>
            {listing.address_text}
          </p>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm" style={{ color: "var(--on-surface-variant)" }}>
          {listing.distance_km != null && (
            <span className="flex items-center gap-1.5 font-semibold">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full text-xs" style={{ background: "var(--surface-container)" }}>📍</span>
              {listing.distance_km} km
            </span>
          )}
          {listing.gender && listing.gender !== "any" && (
            <span className="flex items-center gap-1.5 font-semibold">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full text-xs" style={{ background: "var(--surface-container)" }}>{listing.gender === "male" ? "♂" : "♀"}</span>
              {listing.gender}
            </span>
          )}
          {listing.food_available && (
            <span className="flex items-center gap-1.5 font-semibold">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full text-xs" style={{ background: "var(--surface-container)" }}>🍽️</span>
              Food
            </span>
          )}
          {listing.rating_avg > 0 && (
            <span className="flex items-center gap-1.5 font-semibold" style={{ color: "var(--primary)" }}>
              ★ {listing.rating_avg.toFixed(1)}
              <span style={{ color: "var(--outline)" }}>({listing.review_count})</span>
            </span>
          )}
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {listing.amenities.slice(0, 4).map((amenity) => (
            <span
              key={amenity}
              className="rounded-full px-2.5 py-1 text-xs font-semibold"
              style={{
                background: "var(--surface-container-low)",
                color: "var(--on-surface-variant)",
              }}
            >
              {amenity}
            </span>
          ))}
          {listing.amenities.length > 4 && (
            <span
              className="rounded-full px-2.5 py-1 text-xs font-semibold"
              style={{
                background: "var(--surface-container-low)",
                color: "var(--outline)",
              }}
            >
              +{listing.amenities.length - 4}
            </span>
          )}
        </div>

        <div
          className="mt-4 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-bold uppercase tracking-wider transition-all group-hover:gap-3"
          style={{
            background: "var(--surface-container)",
            color: "var(--on-surface)",
          }}
        >
          View Details
          <span style={{ fontSize: "10px" }}>→</span>
        </div>
      </div>
    </article>
  );
}
