import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet marker icon issues in Vite
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
import { searchProperties, getPropertyDetail, getPropertyReviews, submitInquiry, submitReview, addShortlist, recordView, getOptimizedImageUrl } from "../lib/api";
import { Helmet } from "react-helmet-async";
import { Reveal } from "../components/ui/Reveal";
import { ListingCard } from "../components/listings/ListingCard";

export function PropertyDetailPage() {
  const { propertyId } = useParams<{ propertyId: string }>();
  const queryClient = useQueryClient();
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  const [selectedImg, setSelectedImg] = useState(0);
  const [showInquiry, setShowInquiry] = useState(false);
  const [inquiryForm, setInquiryForm] = useState({ name: "", phone: "", message: "Hi, I am interested in this property." });
  const [inquirySent, setInquirySent] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });

  const propertyQuery = useQuery({
    queryKey: ["property-detail", propertyId],
    queryFn: () => getPropertyDetail(propertyId!),
    enabled: Boolean(propertyId),
    retry: false, // Do not retry on 404
  });

  const reviewsQuery = useQuery({
    queryKey: ["property-reviews", propertyId],
    queryFn: () => getPropertyReviews(propertyId!),
    enabled: Boolean(propertyId),
  });

  const similarPropertiesQuery = useQuery({
    queryKey: ["similar-properties", propertyQuery.data?.primary_college_id, propertyQuery.data?.property_type],
    queryFn: () => searchProperties({ 
      college_id: propertyQuery.data!.primary_college_id, 
      property_type: propertyQuery.data!.property_type,
      limit: 4 
    }),
    enabled: Boolean(propertyQuery.data?.primary_college_id),
  });

  const inquiryMutation = useMutation({
    mutationFn: () => submitInquiry(propertyId!, inquiryForm),
    onSuccess: () => {
      setInquirySent(true);
      setTimeout(() => { setShowInquiry(false); setInquirySent(false); }, 2000);
    },
  });

  const reviewMutation = useMutation({
    mutationFn: () => submitReview(propertyId!, reviewForm),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["property-reviews", propertyId] });
      setShowReviewForm(false);
      setReviewForm({ rating: 5, comment: "" });
    },
  });

  const shortlistMutation = useMutation({
    mutationFn: () => addShortlist(propertyId!),
  });

  // Record view on mount
  useEffect(() => {
    if (propertyId) recordView(propertyId).catch(() => {});
  }, [propertyId]);

  // Map
  useEffect(() => {
    if (!mapRef.current || !propertyQuery.data) return;
    if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; }

    const { latitude, longitude, title } = propertyQuery.data;
    const map = L.map(mapRef.current).setView([latitude, longitude], 15);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
    }).addTo(map);
    L.marker([latitude, longitude]).addTo(map).bindPopup(title);
    mapInstanceRef.current = map;

    return () => { map.remove(); mapInstanceRef.current = null; };
  }, [propertyQuery.data]);

  const property = propertyQuery.data;
  const reviews = reviewsQuery.data ?? [];
  const similarProperties = similarPropertiesQuery.data?.items.filter((p: any) => p.property_id !== propertyId).slice(0, 3) ?? [];

  if (propertyQuery.isLoading) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="space-y-5">
          <div className="h-80 skeleton-shimmer rounded-3xl" />
          <div className="h-10 w-2/3 skeleton-shimmer" />
          <div className="h-6 w-1/2 skeleton-shimmer" />
        </div>
      </main>
    );
  }

  if (propertyQuery.isError) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-20 text-center">
        <div className="rounded-3xl p-32" style={{ background: "var(--surface-container-low)" }}>
          <p className="text-6xl">😕</p>
          <h1 className="mt-6 text-3xl font-black" style={{ color: "var(--on-surface)" }}>Property Not Found</h1>
          <p className="mt-4 text-slate-500">This property may have been removed or the link is invalid.</p>
        </div>
      </main>
    );
  }


  if (!property) return null;
  const images = property.image_urls?.length ? property.image_urls : (property.cover_image_url ? [property.cover_image_url] : []);
  const mainImage = property.image_urls?.[0] || property.cover_image_url || "";

  return (
    <main className="min-h-screen" style={{ background: "var(--surface)" }}>
      <Helmet>
        <title>{property.title} | NearMyColleges</title>
        <meta name="description" content={property.description || `View details for ${property.title} on NearMyColleges.`} />
        <meta property="og:title" content={`${property.title} - Rent: ₹${property.rent_min} to ₹${property.rent_max}`} />
        <meta property="og:description" content={property.description || `Looking for ${property.property_type.replace(/_/g, " ")}? View this listing.`} />
        <meta property="og:image" content={mainImage} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={property.title} />
        <meta name="twitter:description" content={`Rent: ₹${property.rent_min} to ₹${property.rent_max}. ${property.description || ""}`} />
        <meta name="twitter:image" content={mainImage} />
      </Helmet>
      
      {/* ── Photo Gallery Grid ── */}
      <Reveal>
        {images.length > 0 ? (
          <div className="space-y-3">
            <div className="overflow-hidden rounded-3xl" style={{ boxShadow: "var(--shadow-ambient)" }}>
              <img
                src={getOptimizedImageUrl(images[selectedImg], 1000, 700)}
                alt={property.title}
                className="h-80 w-full object-cover md:h-[440px] transition-all duration-500"
              />
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto py-1">
                {images.map((url, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImg(i)}
                    className="h-16 w-20 flex-shrink-0 overflow-hidden rounded-xl transition-all"
                    style={{
                      border: selectedImg === i ? "2px solid var(--primary-container)" : "2px solid transparent",
                      opacity: selectedImg === i ? 1 : 0.6,
                    }}
                  >
                    <img src={getOptimizedImageUrl(url, 200, 150)} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div
            className="flex h-64 items-center justify-center rounded-3xl"
            style={{ background: "linear-gradient(135deg, var(--surface-container) 0%, var(--surface-container-high) 100%)" }}
          >
            <span className="text-6xl opacity-50">🏠</span>
          </div>
        )}
      </Reveal>

      {/* Main content grid */}
      <div className="mt-8 grid gap-8 md:grid-cols-3">
        {/* Left: Details */}
        <div className="md:col-span-2 space-y-6">
          <Reveal delayMs={60}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="text-3xl font-black" style={{ color: "var(--on-surface)", letterSpacing: "-0.02em" }}>
                  {property.title}
                </h1>
                {property.address_text && (
                  <p className="mt-1 text-sm" style={{ color: "var(--outline)" }}>{property.address_text}</p>
                )}
              </div>
              <div className="flex gap-2">
                <span className="badge badge-amber">{property.property_type.replace(/_/g, " ")}</span>
                {property.gender && property.gender !== "any" && (
                  <span className="badge badge-violet">{property.gender}</span>
                )}
              </div>
            </div>
          </Reveal>

          {/* Price panel */}
          <Reveal delayMs={110}>
            <div
              className="grid grid-cols-3 gap-4 rounded-2xl p-6"
              style={{ background: "var(--surface-container-low)" }}
            >
              <div>
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--outline)", letterSpacing: "0.05em" }}>
                  Rent / month
                </p>
                <p className="mt-2 text-xl font-black" style={{ color: "var(--on-surface)" }}>
                  ₹{property.rent_min.toLocaleString()} – ₹{property.rent_max.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--outline)", letterSpacing: "0.05em" }}>
                  Deposit
                </p>
                <p className="mt-2 text-xl font-black" style={{ color: "var(--on-surface)" }}>
                  ₹{property.security_deposit.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--outline)", letterSpacing: "0.05em" }}>
                  Rating
                </p>
                <p className="mt-2 text-xl font-black" style={{ color: "var(--primary)" }}>
                  ★ {property.rating_avg.toFixed(1)}
                  <span className="text-sm font-normal" style={{ color: "var(--outline)" }}> ({property.review_count})</span>
                </p>
              </div>
            </div>
          </Reveal>

          {property.description && (
            <Reveal delayMs={160}>
              <div className="glass-card-static p-6">
                <h2 className="font-black" style={{ color: "var(--on-surface)" }}>About this property</h2>
                <p className="mt-3 text-sm leading-7" style={{ color: "var(--on-surface-variant)" }}>{property.description}</p>
              </div>
            </Reveal>
          )}

          {property.metadata && Object.keys(property.metadata).length > 0 && (
            <Reveal delayMs={180}>
              <div className="glass-card-static p-6">
                <h2 className="font-black" style={{ color: "var(--on-surface)" }}>Key Details</h2>
                <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {Object.entries(property.metadata).map(([key, value]) => {
                    if (value == null || value === "") return null;
                    const formatKey = (k: string) => k.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
                    const formatVal = (v: unknown) => typeof v === "boolean" ? (v ? "Yes" : "No") : String(v);
                    
                    return (
                      <div key={key}>
                        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--outline)" }}>
                          {formatKey(key)}
                        </p>
                        <p className="mt-1 text-sm font-semibold capitalize" style={{ color: "var(--on-surface-variant)" }}>
                          {formatVal(value)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Reveal>
          )}


          <Reveal delayMs={210}>
            <div className="glass-card-static p-6">
              <h2 className="font-black" style={{ color: "var(--on-surface)" }}>Amenities</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {property.amenities.map((a) => (
                  <span
                    key={a}
                    className="rounded-full px-4 py-2 text-sm font-semibold"
                    style={{ background: "var(--surface-container-low)", color: "var(--on-surface-variant)" }}
                  >
                    {a.replace(/_/g, " ")}
                  </span>
                ))}
              </div>
            </div>
          </Reveal>

          {property.food_available && property.food_menu && (
            <Reveal delayMs={260}>
              <div className="glass-card-static p-6">
                <h2 className="font-black" style={{ color: "var(--on-surface)" }}>🍽️ Food</h2>
                <p className="mt-3 text-sm leading-7" style={{ color: "var(--on-surface-variant)" }}>{property.food_menu}</p>
              </div>
            </Reveal>
          )}

          {property.rules && (
            <Reveal delayMs={310}>
              <div className="glass-card-static p-6">
                <h2 className="font-black" style={{ color: "var(--on-surface)" }}>📋 House Rules</h2>
                <p className="mt-3 text-sm leading-7" style={{ color: "var(--on-surface-variant)" }}>{property.rules}</p>
              </div>
            </Reveal>
          )}

          {/* Room Options */}
          {property.room_options && property.room_options.length > 0 && (
            <Reveal delayMs={330}>
              <div className="glass-card-static p-6">
                <h2 className="font-black" style={{ color: "var(--on-surface)" }}>Room Options</h2>
                <div className="mt-4 space-y-3">
                  {property.room_options.map((room, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-xl p-4"
                      style={{ background: "var(--surface-container-low)" }}
                    >
                      <span className="text-sm font-bold capitalize" style={{ color: "var(--on-surface)" }}>
                        {room.label}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-black" style={{ color: "var(--primary)" }}>
                          ₹{room.price.toLocaleString()}
                        </span>
                        <span
                          className="badge text-xs"
                          style={{
                            background: room.status === "available" ? "var(--success-container)" : "var(--surface-container-high)",
                            color: room.status === "available" ? "#065f46" : "var(--outline)",
                          }}
                        >
                          {room.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          )}

          {/* Map */}
          <Reveal delayMs={360}>
            <div className="overflow-hidden rounded-2xl" style={{ border: "1px solid var(--glass-border)" }}>
              <div ref={mapRef} className="h-72 w-full" />
            </div>
            <a 
              href={`https://www.google.com/maps/dir/?api=1&destination=${property.latitude},${property.longitude}`} 
              target="_blank" rel="noopener noreferrer"
              className="mt-3 block w-full rounded-2xl py-3 text-center text-sm font-bold transition-transform hover:scale-[1.02]"
              style={{ background: "var(--primary-container)", color: "var(--on-primary-container)" }}
            >
              🗺️ Open for Directions
            </a>
          </Reveal>

          {/* Reviews */}
          <Reveal delayMs={410}>
            <div className="glass-card-static p-6">
              <div className="flex items-center justify-between">
                <h2 className="font-black" style={{ color: "var(--on-surface)" }}>Reviews ({reviews.length})</h2>
                <button
                  onClick={() => setShowReviewForm(!showReviewForm)}
                  className="btn-ghost !px-4 !py-2 text-xs"
                >
                  Write Review
                </button>
              </div>

              {showReviewForm && (
                <div className="mt-4 rounded-xl p-5" style={{ background: "var(--surface-container-low)" }}>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                        className="text-2xl transition-transform hover:scale-110"
                        style={{ color: star <= reviewForm.rating ? "var(--primary-container)" : "var(--surface-container-high)" }}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={reviewForm.comment}
                    onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                    placeholder="Share your experience..."
                    className="input-field mt-3"
                    rows={3}
                  />
                  <button
                    onClick={() => reviewMutation.mutate()}
                    disabled={reviewMutation.isPending || !reviewForm.comment}
                    className="btn-primary mt-3 !text-xs disabled:opacity-50"
                  >
                    {reviewMutation.isPending ? "Submitting..." : "Submit Review"}
                  </button>
                </div>
              )}

              <div className="mt-5 space-y-3">
                {reviews.map((r) => (
                  <div key={r.review_id} className="rounded-xl p-4" style={{ background: "var(--surface-container-low)" }}>
                    <div className="flex items-center justify-between">
                      <span className="font-bold" style={{ color: "var(--on-surface)" }}>{r.user_name}</span>
                      <div className="flex">
                        {Array.from({ length: r.rating }).map((_, i) => (
                          <span key={i} style={{ color: "var(--primary-container)" }}>★</span>
                        ))}
                      </div>
                    </div>
                    <p className="mt-2 text-sm leading-6" style={{ color: "var(--on-surface-variant)" }}>{r.comment}</p>
                    <p className="mt-1 text-xs" style={{ color: "var(--outline)" }}>{new Date(r.created_at).toLocaleDateString()}</p>
                  </div>
                ))}
                {reviews.length === 0 && (
                  <p className="text-sm" style={{ color: "var(--outline)" }}>No reviews yet. Be the first!</p>
                )}
              </div>
            </div>
          </Reveal>
        </div>

        {/* Right: Action sidebar */}
        <div className="space-y-4">
          <Reveal delayMs={60}>
            <div className="sticky top-24 space-y-3">
              <button
                onClick={() => setShowInquiry(true)}
                className="btn-primary w-full"
              >
                Send Inquiry
              </button>
              <button
                onClick={() => shortlistMutation.mutate()}
                disabled={shortlistMutation.isPending}
                className="btn-ghost w-full"
              >
                {shortlistMutation.isSuccess ? "✓ Shortlisted" : "♥ Save to Shortlist"}
              </button>
              <a
                href={`https://wa.me/918152916235?text=${encodeURIComponent(`Hi, I saw "${property.title}" on NearMyColleges and I'm interested. Can you help me with more details?`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full rounded-full py-3.5 text-center text-sm font-bold transition"
                style={{
                  background: "rgba(34, 197, 94, 0.08)",
                  color: "#16a34a",
                  border: "1px solid rgba(34, 197, 94, 0.2)",
                }}
              >
                💬 WhatsApp Support
              </a>
            </div>
          </Reveal>
        </div>
      </div>

      {/* Similar Properties */}
      {similarProperties.length > 0 && (
        <Reveal delayMs={460} className="mt-16">
          <h2 className="text-2xl font-black" style={{ color: "var(--on-surface)" }}>Similar Properties</h2>
          <p className="mb-6 mt-1 text-sm" style={{ color: "var(--outline)" }}>
            Other {property.property_type.replace(/_/g, " ")} options nearby you might like
          </p>
          <div className="grid gap-6 md:grid-cols-3">
            {similarProperties.map((listing: any) => (
              <ListingCard key={listing.property_id} listing={listing} />
            ))}
          </div>
        </Reveal>
      )}

      {/* Inquiry Modal */}
      {showInquiry && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)" }}
          onClick={() => setShowInquiry(false)}
        >
          <div
            className="animate-scale-in mx-4 w-full max-w-md rounded-3xl p-7"
            style={{ background: "var(--surface-container-lowest)", boxShadow: "var(--shadow-ambient)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-black" style={{ color: "var(--on-surface)" }}>Send Inquiry</h2>
            <p className="mt-1 text-sm" style={{ color: "var(--outline)" }}>About: {property.title}</p>

            {inquirySent ? (
              <div
                className="mt-6 rounded-2xl p-6 text-center"
                style={{ background: "var(--success-container)", color: "#065f46" }}
              >
                <p className="text-3xl">✓</p>
                <p className="mt-2 font-bold">Inquiry sent successfully!</p>
              </div>
            ) : (
              <div className="mt-5 space-y-3">
                <input
                  value={inquiryForm.name}
                  onChange={(e) => setInquiryForm({ ...inquiryForm, name: e.target.value })}
                  placeholder="Your name"
                  className="input-field"
                />
                <input
                  value={inquiryForm.phone}
                  onChange={(e) => setInquiryForm({ ...inquiryForm, phone: e.target.value })}
                  placeholder="Phone number"
                  className="input-field"
                />
                <textarea
                  value={inquiryForm.message}
                  onChange={(e) => setInquiryForm({ ...inquiryForm, message: e.target.value })}
                  rows={3}
                  className="input-field"
                />
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => inquiryMutation.mutate()}
                    disabled={inquiryMutation.isPending}
                    className="btn-primary flex-1 disabled:opacity-50"
                  >
                    {inquiryMutation.isPending ? "Sending..." : "Send Inquiry"}
                  </button>
                  <button
                    onClick={() => setShowInquiry(false)}
                    className="btn-ghost"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
