import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart, Home, MapPin, User, Utensils, Star, Flame, Sparkles } from "lucide-react";

import type { PropertyCard } from "../../types";
import { addShortlist, removeShortlist, listShortlists, getOptimizedImageUrl, getPropertyDetail } from "../../lib/api";
import { useAuth } from "../../lib/AuthContext";

export function ListingCard({ listing }: { listing: PropertyCard }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { firebaseUser } = useAuth();

  const shortlistsQuery = useQuery({
    queryKey: ["shortlists"],
    queryFn: listShortlists,
    enabled: Boolean(firebaseUser),
    staleTime: 60_000,
  });

  const shortlisted = Boolean(
    shortlistsQuery.data?.some((s) => s.property_id === listing.property_id)
  );

  const shortlistMutation = useMutation({
    mutationFn: async (currentlySaved: boolean) => {
      if (currentlySaved) {
        await removeShortlist(listing.property_id);
      } else {
        await addShortlist(listing.property_id);
      }
    },
    onSuccess: () => {
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
    if (!firebaseUser) {
      navigate("/login");
      return;
    }
    shortlistMutation.mutate(shortlisted);
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
            disabled={shortlistMutation.isPending}
            className={`absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full text-lg transition-all duration-300 hover:scale-110 active:scale-95 ${shortlisted ? "animate-heart-pop text-red-500 scale-105" : "text-white"}`}
            style={{
              background: "var(--glass-bg)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(255,255,255,0.2)",
            }}
            aria-label="Toggle shortlist"
          >
            <Heart className={`w-5 h-5 ${shortlisted ? "fill-current" : ""}`} />
          </button>
          {listing.featured ? (
            <span
              className="absolute left-3 top-3 rounded-full px-3 py-1.5 text-xs font-bold shadow-sm"
              style={{ background: "var(--gradient-amber)", color: "var(--on-primary)" }}
            >
              <Sparkles className="w-3 h-3 inline mr-1 fill-current" /> Featured
            </span>
          ) : listing.rating_avg >= 4.5 && listing.review_count >= 2 ? (
            <span
              className="absolute left-3 top-3 rounded-full px-3 py-1.5 text-xs font-bold shadow-sm"
              style={{ background: "var(--success)", color: "var(--on-primary)" }}
            >
              <Star className="w-3 h-3 inline mr-1 fill-current" /> Top Rated
            </span>
          ) : listing.review_count >= 5 ? (
            <span
              className="absolute left-3 top-3 rounded-full px-3 py-1.5 text-xs font-bold shadow-sm"
              style={{ background: "var(--error)", color: "var(--on-primary)" }}
            >
              <Flame className="w-3 h-3 inline mr-1 fill-current" /> High Demand
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
          <Home className="w-12 h-12 opacity-60 text-white" />
          <button
            onClick={handleShortlistClick}
            disabled={shortlistMutation.isPending}
            className={`absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full text-lg transition-all duration-300 hover:scale-110 active:scale-95 ${shortlisted ? "animate-heart-pop text-red-500 scale-105" : "text-white"}`}
            style={{
              background: "var(--glass-bg)",
              backdropFilter: "blur(12px)",
              border: "1px solid var(--glass-border)",
            }}
            aria-label="Toggle shortlist"
          >
            <Heart className={`w-5 h-5 ${shortlisted ? "fill-current" : ""}`} />
          </button>
          {listing.featured ? (
            <span
              className="absolute left-3 top-3 rounded-full px-3 py-1.5 text-xs font-bold shadow-sm"
              style={{ background: "var(--gradient-amber)", color: "var(--on-primary)" }}
            >
              <Sparkles className="w-3 h-3 inline mr-1 fill-current" /> Featured
            </span>
          ) : listing.rating_avg >= 4.5 && listing.review_count >= 2 ? (
            <span
              className="absolute left-3 top-3 rounded-full px-3 py-1.5 text-xs font-bold shadow-sm"
              style={{ background: "var(--success)", color: "var(--on-primary)" }}
            >
              <Star className="w-3 h-3 inline mr-1 fill-current" /> Top Rated
            </span>
          ) : listing.review_count >= 5 ? (
            <span
              className="absolute left-3 top-3 rounded-full px-3 py-1.5 text-xs font-bold shadow-sm"
              style={{ background: "var(--error)", color: "var(--on-primary)" }}
            >
              <Flame className="w-3 h-3 inline mr-1 fill-current" /> High Demand
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
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full" style={{ background: "var(--surface-container)" }}><MapPin className="w-3.5 h-3.5" /></span>
              {listing.distance_km < 1 ? `${Math.round(listing.distance_km * 1000)} m` : `${listing.distance_km.toFixed(1)} km`}
            </span>
          )}
          {listing.gender && listing.gender !== "any" && (
            <span className="flex items-center gap-1.5 font-semibold">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full" style={{ background: "var(--surface-container)" }}><User className="w-3.5 h-3.5" /></span>
              {listing.gender}
            </span>
          )}
          {listing.food_available && (
            <span className="flex items-center gap-1.5 font-semibold">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full" style={{ background: "var(--surface-container)" }}><Utensils className="w-3.5 h-3.5" /></span>
              Food
            </span>
          )}
          {listing.rating_avg > 0 && (
            <span className="flex items-center gap-1.5 font-semibold" style={{ color: "var(--primary)" }}>
              <Star className="w-3.5 h-3.5 fill-current" /> {listing.rating_avg.toFixed(1)}
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
