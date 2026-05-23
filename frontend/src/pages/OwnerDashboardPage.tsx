import { FormEvent, useEffect, useState, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Reveal } from "../components/ui/Reveal";
import { AnimatedNumber } from "../components/ui/AnimatedNumber";
import {
  createOwnerProperty,
  listOwnerProperties,
  updateOwnerProperty,
  deleteOwnerProperty,
  listOwnerInquiries,
  getOwnerAnalytics,
  uploadImage,
  listColleges,
} from "../lib/api";
import { useAuth } from "../lib/AuthContext";
import type { InquiryOut } from "../types";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

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

// ── Constants ─────────────────────────────────────────────────────────────────

const PROPERTY_TYPES = [
  { value: "pg",          label: "PG",          icon: "🏠", desc: "Paying Guest" },
  { value: "flat",        label: "Flat",         icon: "🏢", desc: "Apartment / BHK" },
  { value: "hostel",      label: "Hostel",       icon: "🏨", desc: "Managed Hostel" },
  { value: "single_room", label: "Single Room",  icon: "🚪", desc: "Independent Room" },
  { value: "co_living",   label: "Co-living",    icon: "🤝", desc: "Shared Living" },
];

const AMENITY_CHIPS = [
  { key: "wifi",          label: "WiFi",          icon: "📶" },
  { key: "ac",            label: "AC",            icon: "❄️" },
  { key: "food",          label: "Food / Mess",   icon: "🍱" },
  { key: "laundry",       label: "Laundry",       icon: "👕" },
  { key: "gym",           label: "Gym",           icon: "💪" },
  { key: "parking",       label: "Parking",       icon: "🅿️" },
  { key: "geyser",        label: "Geyser",        icon: "🔥" },
  { key: "cctv",          label: "CCTV",          icon: "📷" },
  { key: "power_backup",  label: "Power Backup",  icon: "⚡" },
  { key: "water_24hr",    label: "24hr Water",    icon: "💧" },
  { key: "study_room",    label: "Study Room",    icon: "📚" },
  { key: "security",      label: "Security Guard",icon: "💂" },
  { key: "cleaning",      label: "Housekeeping",  icon: "🧹" },
  { key: "kitchen",       label: "Kitchen",       icon: "🍳" },
  { key: "terrace",       label: "Terrace",       icon: "🌇" },
  { key: "lift",          label: "Lift",          icon: "🛗" },
];

const ROOM_OPTION_LABELS: Record<string, string[]> = {
  pg:          ["Single (1-Sharing)", "2-Sharing", "3-Sharing", "4-Sharing", "5-Sharing"],
  flat:        ["1RK", "1BHK", "2BHK", "3BHK", "4BHK", "4BHK+"],
  hostel:      ["4-Bed Dorm", "6-Bed Dorm", "8-Bed Dorm", "Private Room"],
  co_living:   ["Studio", "Shared Room", "1BHK Private", "Private Suite"],
  single_room: [],
};

type RoomOption = {
  id: string;
  label: string;
  price: string;
  deposit: string;
  available_count: string;
  status: string;
};

// ── Component ─────────────────────────────────────────────────────────────────

export function OwnerDashboardPage() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  // ── Core form state ──────────────────────────────────────────────────────
  const [form, setForm] = useState({
    title: "",
    property_type: "pg",
    primary_college_id: "",
    description: "",
    address_text: "",
    latitude: "",
    longitude: "",
    rent_min: "",
    rent_max: "",
    security_deposit: "",
    gender: "any",
    food_available: false,
    food_menu: "",
    rules: "",
  });

  // ── Metadata state (type-specific extra fields) ──────────────────────────
  const [meta, setMeta] = useState({
    // PG / Hostel
    mess_timing: "",
    gate_timing: "",
    warden_contact: "",
    curfew_time: "",
    warden_on_site: false,
    total_capacity: "",
    study_hall: false,
    // Flat / Single Room / Co-living
    furnishing: "",
    floor: "",
    lift: false,
    society_name: "",
    bathroom_type: "",
    kitchen_access: false,
    // Co-living
    min_stay_duration: "",
    community_events: false,
    coworking: false,
  });

  // ── Amenity chips ────────────────────────────────────────────────────────
  const [selectedAmenities, setSelectedAmenities] = useState<Set<string>>(new Set());

  const toggleAmenity = (key: string) => {
    setSelectedAmenities((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  // ── Room options ─────────────────────────────────────────────────────────
  const [roomOptions, setRoomOptions] = useState<RoomOption[]>([]);

  const addRoomOption = (defaultLabel?: string) => {
    const labels = ROOM_OPTION_LABELS[form.property_type] ?? [];
    setRoomOptions((prev) => [
      ...prev,
      {
        id: `opt-${Date.now()}`,
        label: defaultLabel ?? (labels[prev.length] ?? labels[0] ?? "Option"),
        price: "",
        deposit: "",
        available_count: "1",
        status: "available",
      },
    ]);
  };

  const updateRoomOption = (id: string, key: keyof RoomOption, value: string) => {
    setRoomOptions((prev) => prev.map((o) => (o.id === id ? { ...o, [key]: value } : o)));
  };

  const removeRoomOption = (id: string) => {
    setRoomOptions((prev) => prev.filter((o) => o.id !== id));
  };

  // Auto-fill rent_min / rent_max from room option prices
  useEffect(() => {
    const prices = roomOptions.map((o) => Number(o.price)).filter(Boolean);
    if (prices.length === 0) return;
    setForm((prev) => ({
      ...prev,
      rent_min: String(Math.min(...prices)),
      rent_max: String(Math.max(...prices)),
    }));
  }, [roomOptions]);

  // Reset room options when property type changes
  useEffect(() => {
    setRoomOptions([]);
  }, [form.property_type]);

  // ── Geolocation ──────────────────────────────────────────────────────────
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState("");

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setGeoError("Geolocation is not supported by your browser.");
      return;
    }
    setGeoLoading(true);
    setGeoError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((prev) => ({
          ...prev,
          latitude: pos.coords.latitude.toFixed(6),
          longitude: pos.coords.longitude.toFixed(6),
        }));
        setGeoLoading(false);
      },
      () => {
        setGeoError("Could not get location. Please enter manually.");
        setGeoLoading(false);
      },
      { timeout: 8000 }
    );
  };

  // ── Map Picker Modal ──────────────────────────────────────────────────────
  const [showMapModal, setShowMapModal] = useState(false);
  const mapPickerRef = useRef<HTMLDivElement | null>(null);
  const pickerInstanceRef = useRef<L.Map | null>(null);
  const pickerMarkerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!showMapModal || !mapPickerRef.current) return;
    
    if (pickerInstanceRef.current) {
      pickerInstanceRef.current.remove();
      pickerInstanceRef.current = null;
    }

    const initialLat = Number(form.latitude) || 20.5937;
    const initialLng = Number(form.longitude) || 78.9629;
    const zoom = form.latitude ? 15 : 5;

    const map = L.map(mapPickerRef.current).setView([initialLat, initialLng], zoom);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
    }).addTo(map);

    const marker = L.marker([initialLat, initialLng]).addTo(map);
    pickerMarkerRef.current = marker;

    map.on("click", (e) => {
      const lat = e.latlng.lat;
      const lng = e.latlng.lng;
      marker.setLatLng([lat, lng]);
      setForm((prev) => ({
        ...prev,
        latitude: lat.toFixed(6),
        longitude: lng.toFixed(6),
      }));
    });

    pickerInstanceRef.current = map;

    // Fix map rendering issue in modal
    setTimeout(() => {
      map.invalidateSize();
    }, 100);

    return () => {
      map.remove();
      pickerInstanceRef.current = null;
      pickerMarkerRef.current = null;
    };
  }, [showMapModal]);

  // ── Image upload ─────────────────────────────────────────────────────────
  const [uploadingImages, setUploadingImages] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  const handleImageUpload = async (files: FileList) => {
    setUploadingImages(true);
    const urls: string[] = [...imageUrls];
    for (const file of Array.from(files)) {
      try {
        const result = await uploadImage(file);
        urls.push(result.url);
      } catch { /* skip failed */ }
    }
    setImageUrls(urls);
    setUploadingImages(false);
  };

  const removeImage = (idx: number) => {
    setImageUrls((prev) => prev.filter((_, i) => i !== idx));
  };

  // ── Editing state ────────────────────────────────────────────────────────
  const [editingPropertyId, setEditingPropertyId] = useState<string | null>(null);
  const [selectedPropertyInquiries, setSelectedPropertyInquiries] = useState<string | null>(null);
  const [inquiries, setInquiries] = useState<InquiryOut[]>([]);

  // ── Queries & mutations ──────────────────────────────────────────────────
  const propertiesQuery = useQuery({
    queryKey: ["owner-properties"],
    queryFn: () => listOwnerProperties(),
    enabled: Boolean(profile),
  });

  const analyticsQuery = useQuery({
    queryKey: ["owner-analytics"],
    queryFn: () => getOwnerAnalytics(),
    enabled: Boolean(profile),
  });

  const collegesQuery = useQuery({
    queryKey: ["colleges"],
    queryFn: () => listColleges(),
  });

  const createMutation = useMutation({
    mutationFn: createOwnerProperty,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-properties"] });
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ propertyId, data }: { propertyId: string; data: unknown }) =>
      updateOwnerProperty(propertyId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-properties"] });
      setEditingPropertyId(null);
      resetForm();
    },
  });

  const toggleAvailabilityMutation = useMutation({
    mutationFn: ({ propertyId, availability }: { propertyId: string; availability: string }) =>
      updateOwnerProperty(propertyId, { availability_status: availability }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["owner-properties"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteOwnerProperty,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["owner-properties"] }),
  });

  // ── Form helpers ─────────────────────────────────────────────────────────
  const resetForm = () => {
    setForm({ title: "", property_type: "pg", primary_college_id: "", description: "", address_text: "", latitude: "", longitude: "", rent_min: "", rent_max: "", security_deposit: "", gender: "any", food_available: false, food_menu: "", rules: "" });
    setMeta({ mess_timing: "", gate_timing: "", warden_contact: "", curfew_time: "", warden_on_site: false, total_capacity: "", study_hall: false, furnishing: "", floor: "", lift: false, society_name: "", bathroom_type: "", kitchen_access: false, min_stay_duration: "", community_events: false, coworking: false });
    setSelectedAmenities(new Set());
    setRoomOptions([]);
    setImageUrls([]);
    setEditingPropertyId(null);
  };

  const loadInquiries = async (propertyId: string) => {
    setSelectedPropertyInquiries((prev) => (prev === propertyId ? null : propertyId));
    try {
      const data = await listOwnerInquiries(propertyId);
      setInquiries(data);
    } catch {
      setInquiries([]);
    }
  };

  const buildMetadata = () => {
    const m: Record<string, unknown> = {};
    const pt = form.property_type;
    if (pt === "pg" || pt === "hostel") {
      if (meta.mess_timing)    m.mess_timing    = meta.mess_timing;
      if (meta.gate_timing)    m.gate_timing    = meta.gate_timing;
      if (meta.warden_contact) m.warden_contact = meta.warden_contact;
      if (meta.curfew_time)    m.curfew_time    = meta.curfew_time;
    }
    if (pt === "hostel") {
      m.warden_on_site = meta.warden_on_site;
      if (meta.total_capacity) m.total_capacity = Number(meta.total_capacity);
      m.study_hall = meta.study_hall;
    }
    if (pt === "flat" || pt === "single_room" || pt === "co_living") {
      if (meta.furnishing) m.furnishing = meta.furnishing;
      if (meta.floor)      m.floor      = Number(meta.floor);
      m.lift = meta.lift;
      if (meta.society_name) m.society_name = meta.society_name;
    }
    if (pt === "single_room") {
      if (meta.bathroom_type) m.bathroom_type = meta.bathroom_type;
      m.kitchen_access = meta.kitchen_access;
    }
    if (pt === "co_living") {
      if (meta.min_stay_duration) m.min_stay_duration = meta.min_stay_duration;
      m.community_events = meta.community_events;
      m.coworking        = meta.coworking;
    }
    return Object.keys(m).length > 0 ? m : undefined;
  };

  const submitCreate = (event: FormEvent) => {
    event.preventDefault();
    const amenitiesArr = Array.from(selectedAmenities);
    const builtRoomOptions = roomOptions
      .filter((o) => o.price)
      .map((o) => ({
        option_id:       o.id,
        label:           o.label,
        price:           Number(o.price),
        deposit:         o.deposit ? Number(o.deposit) : undefined,
        available_count: Number(o.available_count) || 0,
        status:          o.status,
      }));

    const payload = {
      title:               form.title,
      property_type:       form.property_type,
      primary_college_id:  form.primary_college_id,
      description:         form.description,
      address_text:        form.address_text,
      latitude:            Number(form.latitude)  || 0,
      longitude:           Number(form.longitude) || 0,
      rent_min:            Number(form.rent_min)  || 0,
      rent_max:            Number(form.rent_max)  || 0,
      security_deposit:    Number(form.security_deposit) || 0,
      amenities:           amenitiesArr,
      gender:              form.gender || undefined,
      food_available:      form.food_available,
      food_menu:           form.food_menu  || undefined,
      rules:               form.rules      || undefined,
      image_urls:          imageUrls,
      cover_image_url:     imageUrls[0]    || undefined,
      room_options:        builtRoomOptions.length > 0 ? builtRoomOptions : undefined,
      metadata:            buildMetadata(),
    };

    if (editingPropertyId) {
      updateMutation.mutate({ propertyId: editingPropertyId, data: payload });
    } else {
      createMutation.mutate(payload as Parameters<typeof createOwnerProperty>[0]);
    }
  };

  // ── Stats ────────────────────────────────────────────────────────────────
  const totalListings    = propertiesQuery.data?.length ?? 0;
  const approvedListings = propertiesQuery.data?.filter((i) => i.approval_status    === "approved").length ?? 0;
  const availableListings= propertiesQuery.data?.filter((i) => i.availability_status === "available").length ?? 0;

  const typeLabel = (t: string) => PROPERTY_TYPES.find((p) => p.value === t)?.label ?? t;
  const typeIcon  = (t: string) => PROPERTY_TYPES.find((p) => p.value === t)?.icon  ?? "🏠";

  // ── Access guard ─────────────────────────────────────────────────────────
  if (!profile || profile.role !== "owner") {
    return (
      <main className="mx-auto max-w-xl px-6 py-20 text-center">
        <div className="rounded-3xl p-16" style={{ background: "var(--surface-container-low)" }}>
          <p className="text-5xl">🔒</p>
          <h1 className="mt-6 text-2xl font-black" style={{ color: "var(--on-surface)" }}>Owner Access Required</h1>
          <p className="mt-4 text-sm" style={{ color: "var(--on-surface-variant)" }}>
            Please log in with an Owner account to manage property listings.
          </p>
        </div>
      </main>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <main className="mx-auto max-w-6xl px-4 py-10 md:px-6">

      {/* Header */}
      <Reveal>
        <section className="relative overflow-hidden rounded-3xl p-8" style={{ background: "var(--gradient-amber)" }}>
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full opacity-20"
            style={{ background: "var(--on-primary)", filter: "blur(40px)" }} />
          <div className="relative z-10">
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.60)", letterSpacing: "0.15em" }}>
              Owner Console
            </p>
            <h1 className="mt-2 text-3xl font-black" style={{ color: "var(--on-primary)" }}>
              {editingPropertyId ? "Edit your listing" : "List your property"}
            </h1>
            <p className="mt-2 max-w-2xl text-sm" style={{ color: "rgba(255,255,255,0.75)" }}>
              Publish PGs, flats, hostels, single rooms, or co-living spaces. Track approvals, inquiries, and availability — all in one place.
            </p>
          </div>
        </section>
      </Reveal>

      {/* Analytics Graph */}
      {analyticsQuery.data && (
        <Reveal className="mt-6" delayMs={60}>
          <section className="glass-card-static overflow-hidden">
            <div className="border-b p-6" style={{ borderColor: "var(--glass-border)" }}>
              <h2 className="text-xl font-black" style={{ color: "var(--on-surface)" }}>Performance Overview (30 Days)</h2>
              <div className="mt-4 flex gap-6">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--outline)" }}>Total Views</p>
                  <p className="text-2xl font-black" style={{ color: "var(--primary)" }}><AnimatedNumber value={analyticsQuery.data.total_views} /></p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--outline)" }}>Shortlists</p>
                  <p className="text-2xl font-black" style={{ color: "#eab308" }}><AnimatedNumber value={analyticsQuery.data.total_shortlists} /></p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--outline)" }}>Inquiries</p>
                  <p className="text-2xl font-black" style={{ color: "#22c55e" }}><AnimatedNumber value={analyticsQuery.data.total_inquiries} /></p>
                </div>
              </div>
            </div>
            <div className="h-72 w-full p-4 pl-0 pt-6">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analyticsQuery.data.daily_stats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--outline)" opacity={0.2} vertical={false} />
                  <XAxis dataKey="date" stroke="var(--outline)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => val.slice(5)} />
                  <YAxis stroke="var(--outline)" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ background: "var(--surface-container-high)", border: "none", borderRadius: "12px", color: "var(--on-surface)", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }}
                    itemStyle={{ fontSize: "12px", fontWeight: "bold" }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
                  <Line type="monotone" name="Views" dataKey="views" stroke="var(--primary)" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                  <Line type="monotone" name="Shortlists" dataKey="shortlists" stroke="#eab308" strokeWidth={3} dot={false} />
                  <Line type="monotone" name="Inquiries" dataKey="inquiries" stroke="#22c55e" strokeWidth={3} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>
        </Reveal>
      )}

      {/* Stats */}
      <Reveal className="mt-6" delayMs={100}>
        <section className="grid gap-4 sm:grid-cols-3">
          {[
            { label: "Total Listings",  value: totalListings,     icon: "🏠" },
            { label: "Approved",        value: approvedListings,  icon: "✅" },
            { label: "Available Now",   value: availableListings, icon: "🟢" },
          ].map((stat) => (
            <article key={stat.label} className="stat-card">
              <span className="text-2xl">{stat.icon}</span>
              <p className="mt-2 text-xs font-bold uppercase tracking-widest" style={{ color: "var(--outline)", letterSpacing: "0.05em" }}>
                {stat.label}
              </p>
              <p className="mt-1 text-3xl font-black" style={{ color: "var(--on-surface)" }}>
                <AnimatedNumber value={stat.value} />
              </p>
            </article>
          ))}
        </section>
      </Reveal>

      {/* ── Listing Form ──────────────────────────────────────────────────── */}
      <Reveal className="mt-6" delayMs={120}>
        <section className="glass-card-static p-6 md:p-8" id="listing-form">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black" style={{ color: "var(--on-surface)" }}>
              {editingPropertyId ? "✏️ Edit Listing" : "➕ New Listing"}
            </h2>
            {editingPropertyId && (
              <button type="button" onClick={resetForm}
                className="rounded-full px-4 py-2 text-xs font-bold"
                style={{ background: "var(--surface-container-high)", color: "var(--on-surface)" }}>
                Cancel Edit
              </button>
            )}
          </div>

          <form onSubmit={submitCreate} className="mt-6 space-y-7">

            {/* ── Step 1: Property Type Picker ── */}
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-widest" style={{ color: "var(--outline)" }}>
                Step 1 — What are you listing?
              </p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                {PROPERTY_TYPES.map((pt) => {
                  const active = form.property_type === pt.value;
                  return (
                    <button
                      key={pt.value}
                      type="button"
                      onClick={() => setForm({ ...form, property_type: pt.value })}
                      className="flex flex-col items-center gap-1 rounded-2xl p-4 text-center transition-all duration-200 hover:scale-105"
                      style={{
                        background: active ? "var(--primary-container)" : "var(--surface-container)",
                        border: `2px solid ${active ? "var(--primary)" : "transparent"}`,
                        color: active ? "var(--on-primary-container)" : "var(--on-surface)",
                      }}
                    >
                      <span className="text-2xl">{pt.icon}</span>
                      <span className="text-xs font-black">{pt.label}</span>
                      <span className="text-[10px] opacity-60">{pt.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── Step 2: Basic Info ── */}
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-widest" style={{ color: "var(--outline)" }}>
                Step 2 — Basic Details
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex flex-col gap-1 md:col-span-2">
                  <label className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--outline)" }}>Property Title *</label>
                  <input
                    className="input-field" required
                    placeholder={`e.g., Sunrise ${typeLabel(form.property_type)} near BITS Pilani`}
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                  />
                </div>

                <div className="flex flex-col gap-1 md:col-span-2">
                  <label className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--outline)" }}>Description *</label>
                  <textarea
                    className="input-field" rows={3} required
                    placeholder="Describe the property — nearby landmarks, highlights, what makes it special…"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </div>

                <div className="flex flex-col gap-1 md:col-span-2">
                  <label className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--outline)" }}>Full Address *</label>
                  <input
                    className="input-field" required
                    placeholder="e.g., Plot 45, Gachibowli Road, Hyderabad, Telangana 500032"
                    value={form.address_text}
                    onChange={(e) => setForm({ ...form, address_text: e.target.value })}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--outline)" }}>Nearest College</label>
                  <select className="input-field" value={form.primary_college_id} onChange={(e) => setForm({ ...form, primary_college_id: e.target.value })}>
                    <option value="">— Not specified —</option>
                    {collegesQuery.data?.map((c) => (
                      <option key={c.college_id} value={c.college_id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--outline)" }}>Allowed Gender</label>
                  <select className="input-field" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                    <option value="any">Any Gender</option>
                    <option value="male">Male Only</option>
                    <option value="female">Female Only</option>
                  </select>
                </div>

                {/* Lat/Long with geolocation */}
                <div className="flex flex-col gap-2 md:col-span-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--outline)" }}>Location (for Map)</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setShowMapModal(true)}
                        className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all hover:scale-105"
                        style={{ background: "var(--surface-container-high)", color: "var(--on-surface)" }}
                      >
                        🗺️ Pick on Map
                      </button>
                      <button
                        type="button"
                        onClick={handleUseMyLocation}
                        disabled={geoLoading}
                        className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all hover:scale-105 disabled:opacity-50"
                        style={{ background: "var(--surface-container-high)", color: "var(--primary)" }}
                      >
                        {geoLoading ? "⏳ Getting location…" : "📍 Use My Location"}
                      </button>
                    </div>
                  </div>
                  {geoError && <p className="text-xs" style={{ color: "var(--error)" }}>{geoError}</p>}
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      className="input-field text-xs"
                      placeholder="Latitude (e.g. 17.391)"
                      value={form.latitude}
                      onChange={(e) => setForm({ ...form, latitude: e.target.value })}
                    />
                    <input
                      className="input-field text-xs"
                      placeholder="Longitude (e.g. 78.491)"
                      value={form.longitude}
                      onChange={(e) => setForm({ ...form, longitude: e.target.value })}
                    />
                  </div>
                  {form.latitude && form.longitude && (
                    <p className="text-xs" style={{ color: "var(--outline)" }}>
                      📍 {form.latitude}, {form.longitude}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* ── Step 3: Room Options ── */}
            {ROOM_OPTION_LABELS[form.property_type]?.length > 0 && (
              <div>
                <p className="mb-3 text-xs font-bold uppercase tracking-widest" style={{ color: "var(--outline)" }}>
                  Step 3 — Room / Unit Options
                </p>
                <div className="rounded-2xl p-5 space-y-4" style={{ background: "var(--surface-container-low)" }}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-bold text-sm" style={{ color: "var(--on-surface)" }}>
                        {form.property_type === "pg" ? "Sharing Options" :
                         form.property_type === "flat" ? "Flat Units in Building" :
                         form.property_type === "hostel" ? "Bed / Room Types" :
                         "Unit Types"}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--on-surface-variant)" }}>
                        Add each option with its rent and availability
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {ROOM_OPTION_LABELS[form.property_type].map((lbl) => (
                        <button
                          key={lbl}
                          type="button"
                          onClick={() => addRoomOption(lbl)}
                          className="rounded-full px-3 py-1.5 text-xs font-bold transition-all hover:scale-105"
                          style={{ background: "var(--primary-fixed)", color: "var(--on-primary-container)" }}
                        >
                          + {lbl}
                        </button>
                      ))}
                    </div>
                  </div>

                  {roomOptions.length === 0 && (
                    <p className="text-center text-sm py-4" style={{ color: "var(--outline)" }}>
                      No options added yet. Click a type above to add one.
                    </p>
                  )}

                  <div className="space-y-3">
                    {roomOptions.map((opt, idx) => (
                      <div key={opt.id} className="rounded-xl p-4 space-y-3"
                        style={{ background: "var(--surface-container-lowest)", border: "1px solid var(--glass-border)" }}>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-black" style={{ color: "var(--on-surface)" }}>
                            #{idx + 1} — {opt.label}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeRoomOption(opt.id)}
                            className="rounded-lg px-2 py-1 text-xs font-bold"
                            style={{ background: "rgba(186,26,26,0.08)", color: "var(--error)" }}
                          >
                            ✕ Remove
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold uppercase" style={{ color: "var(--outline)" }}>Type</label>
                            <select
                              value={opt.label}
                              onChange={(e) => updateRoomOption(opt.id, "label", e.target.value)}
                              className="input-field !py-2 !px-3 !text-xs"
                            >
                              {ROOM_OPTION_LABELS[form.property_type].map((l) => (
                                <option key={l} value={l}>{l}</option>
                              ))}
                            </select>
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold uppercase" style={{ color: "var(--outline)" }}>Rent ₹/mo *</label>
                            <input
                              type="number" placeholder="e.g. 7500"
                              value={opt.price}
                              onChange={(e) => updateRoomOption(opt.id, "price", e.target.value)}
                              className="input-field !py-2 !px-3 !text-xs"
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold uppercase" style={{ color: "var(--outline)" }}>Deposit ₹</label>
                            <input
                              type="number" placeholder="e.g. 10000"
                              value={opt.deposit}
                              onChange={(e) => updateRoomOption(opt.id, "deposit", e.target.value)}
                              className="input-field !py-2 !px-3 !text-xs"
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold uppercase" style={{ color: "var(--outline)" }}>Available #</label>
                            <input
                              type="number" min="0" placeholder="e.g. 3"
                              value={opt.available_count}
                              onChange={(e) => updateRoomOption(opt.id, "available_count", e.target.value)}
                              className="input-field !py-2 !px-3 !text-xs"
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {["available", "occupied", "reserved"].map((s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => updateRoomOption(opt.id, "status", s)}
                              className="flex-1 rounded-full py-1.5 text-xs font-bold transition-all"
                              style={{
                                background: opt.status === s
                                  ? s === "available" ? "var(--success-container)"
                                  : s === "occupied" ? "var(--primary-fixed)"
                                  : "var(--surface-container-high)"
                                  : "var(--surface-container)",
                                color: opt.status === s
                                  ? s === "available" ? "#065f46"
                                  : s === "occupied" ? "var(--on-primary-container)"
                                  : "var(--on-surface)"
                                  : "var(--outline)",
                              }}
                            >
                              {s.charAt(0).toUpperCase() + s.slice(1)}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {roomOptions.length > 0 && (
                    <p className="text-xs" style={{ color: "var(--outline)" }}>
                      💡 Min/Max rent is auto-calculated from the prices above. You can override below.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* ── Step 4: Pricing ── */}
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-widest" style={{ color: "var(--outline)" }}>
                Step {ROOM_OPTION_LABELS[form.property_type]?.length > 0 ? "4" : "3"} — Pricing
              </p>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--outline)" }}>Min Rent ₹/mo *</label>
                  <input type="number" className="input-field" placeholder="e.g. 6000" required
                    value={form.rent_min} onChange={(e) => setForm({ ...form, rent_min: e.target.value })} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--outline)" }}>Max Rent ₹/mo *</label>
                  <input type="number" className="input-field" placeholder="e.g. 12000" required
                    value={form.rent_max} onChange={(e) => setForm({ ...form, rent_max: e.target.value })} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--outline)" }}>Security Deposit ₹ *</label>
                  <input type="number" className="input-field" placeholder="e.g. 10000" required
                    value={form.security_deposit} onChange={(e) => setForm({ ...form, security_deposit: e.target.value })} />
                </div>
              </div>
            </div>

            {/* ── Step 5: Amenities (Chips) ── */}
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-widest" style={{ color: "var(--outline)" }}>
                Step {ROOM_OPTION_LABELS[form.property_type]?.length > 0 ? "5" : "4"} — Amenities
              </p>
              <div className="flex flex-wrap gap-2">
                {AMENITY_CHIPS.map((chip) => {
                  const active = selectedAmenities.has(chip.key);
                  return (
                    <button
                      key={chip.key}
                      type="button"
                      onClick={() => toggleAmenity(chip.key)}
                      className="flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-bold transition-all hover:scale-105"
                      style={{
                        background: active ? "var(--primary-container)" : "var(--surface-container)",
                        border: `1.5px solid ${active ? "var(--primary)" : "transparent"}`,
                        color: active ? "var(--on-primary-container)" : "var(--on-surface-variant)",
                      }}
                    >
                      <span>{chip.icon}</span>
                      {chip.label}
                      {active && <span className="ml-0.5 text-[10px]">✓</span>}
                    </button>
                  );
                })}
              </div>
              {selectedAmenities.size === 0 && (
                <p className="mt-2 text-xs" style={{ color: "var(--outline)" }}>Tap to select amenities available at your property.</p>
              )}
            </div>

            {/* ── Step 6: Type-Specific Details ── */}
            {(form.property_type === "pg" || form.property_type === "hostel") && (
              <div>
                <p className="mb-3 text-xs font-bold uppercase tracking-widest" style={{ color: "var(--outline)" }}>
                  {form.property_type === "pg" ? "PG" : "Hostel"} Details
                </p>
                <div className="grid gap-4 md:grid-cols-2 rounded-2xl p-5" style={{ background: "var(--surface-container-low)" }}>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--outline)" }}>Mess / Meal Timings</label>
                    <input className="input-field" placeholder="e.g. 8AM–9AM, 1PM–2PM, 8PM–9PM"
                      value={meta.mess_timing} onChange={(e) => setMeta({ ...meta, mess_timing: e.target.value })} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--outline)" }}>Gate / Curfew Timing</label>
                    <input className="input-field" placeholder="e.g. Gate closes at 10 PM"
                      value={meta.gate_timing} onChange={(e) => setMeta({ ...meta, gate_timing: e.target.value })} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--outline)" }}>Warden / Caretaker Contact</label>
                    <input className="input-field" placeholder="e.g. 9876543210"
                      value={meta.warden_contact} onChange={(e) => setMeta({ ...meta, warden_contact: e.target.value })} />
                  </div>
                  {form.property_type === "hostel" && (
                    <>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--outline)" }}>Total Capacity (beds)</label>
                        <input type="number" className="input-field" placeholder="e.g. 60"
                          value={meta.total_capacity} onChange={(e) => setMeta({ ...meta, total_capacity: e.target.value })} />
                      </div>
                      <label className="flex items-center gap-2 text-sm font-semibold" style={{ color: "var(--on-surface-variant)" }}>
                        <input type="checkbox" checked={meta.warden_on_site} onChange={(e) => setMeta({ ...meta, warden_on_site: e.target.checked })} className="accent-amber-500 h-4 w-4" />
                        Warden lives on-site
                      </label>
                      <label className="flex items-center gap-2 text-sm font-semibold" style={{ color: "var(--on-surface-variant)" }}>
                        <input type="checkbox" checked={meta.study_hall} onChange={(e) => setMeta({ ...meta, study_hall: e.target.checked })} className="accent-amber-500 h-4 w-4" />
                        Study Hall available
                      </label>
                    </>
                  )}
                  <div className="flex flex-col justify-center gap-2 md:col-span-2">
                    <label className="flex items-center gap-2 text-sm font-semibold" style={{ color: "var(--on-surface-variant)" }}>
                      <input type="checkbox" checked={form.food_available} onChange={(e) => setForm({ ...form, food_available: e.target.checked })} className="accent-amber-500 h-4 w-4" />
                      Food / Mess is provided
                    </label>
                    {form.food_available && (
                      <input className="input-field" placeholder="e.g. Breakfast & Dinner included. Veg & Non-Veg options."
                        value={form.food_menu} onChange={(e) => setForm({ ...form, food_menu: e.target.value })} />
                    )}
                  </div>
                </div>
              </div>
            )}

            {(form.property_type === "flat" || form.property_type === "single_room" || form.property_type === "co_living") && (
              <div>
                <p className="mb-3 text-xs font-bold uppercase tracking-widest" style={{ color: "var(--outline)" }}>
                  {form.property_type === "flat" ? "Apartment" : form.property_type === "single_room" ? "Room" : "Co-living"} Details
                </p>
                <div className="grid gap-4 md:grid-cols-2 rounded-2xl p-5" style={{ background: "var(--surface-container-low)" }}>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--outline)" }}>Furnishing</label>
                    <select className="input-field" value={meta.furnishing} onChange={(e) => setMeta({ ...meta, furnishing: e.target.value })}>
                      <option value="">— Select —</option>
                      <option value="fully_furnished">Fully Furnished</option>
                      <option value="semi_furnished">Semi Furnished</option>
                      <option value="unfurnished">Unfurnished</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--outline)" }}>Floor Number</label>
                    <input type="number" className="input-field" placeholder="e.g. 3"
                      value={meta.floor} onChange={(e) => setMeta({ ...meta, floor: e.target.value })} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--outline)" }}>Society / Building Name</label>
                    <input className="input-field" placeholder="e.g. Sobha Daffodil Apartments"
                      value={meta.society_name} onChange={(e) => setMeta({ ...meta, society_name: e.target.value })} />
                  </div>
                  <label className="flex items-center gap-2 text-sm font-semibold" style={{ color: "var(--on-surface-variant)" }}>
                    <input type="checkbox" checked={meta.lift} onChange={(e) => setMeta({ ...meta, lift: e.target.checked })} className="accent-amber-500 h-4 w-4" />
                    Lift / Elevator available
                  </label>
                  {form.property_type === "single_room" && (
                    <>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--outline)" }}>Bathroom Type</label>
                        <select className="input-field" value={meta.bathroom_type} onChange={(e) => setMeta({ ...meta, bathroom_type: e.target.value })}>
                          <option value="">— Select —</option>
                          <option value="attached">Attached / Private</option>
                          <option value="shared">Shared</option>
                          <option value="common_floor">Common on Floor</option>
                        </select>
                      </div>
                      <label className="flex items-center gap-2 text-sm font-semibold" style={{ color: "var(--on-surface-variant)" }}>
                        <input type="checkbox" checked={meta.kitchen_access} onChange={(e) => setMeta({ ...meta, kitchen_access: e.target.checked })} className="accent-amber-500 h-4 w-4" />
                        Kitchen access available
                      </label>
                    </>
                  )}
                  {form.property_type === "co_living" && (
                    <>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--outline)" }}>Minimum Stay</label>
                        <select className="input-field" value={meta.min_stay_duration} onChange={(e) => setMeta({ ...meta, min_stay_duration: e.target.value })}>
                          <option value="">— Select —</option>
                          <option value="1_month">1 Month</option>
                          <option value="3_months">3 Months</option>
                          <option value="6_months">6 Months</option>
                          <option value="1_year">1 Year</option>
                        </select>
                      </div>
                      <label className="flex items-center gap-2 text-sm font-semibold" style={{ color: "var(--on-surface-variant)" }}>
                        <input type="checkbox" checked={meta.coworking} onChange={(e) => setMeta({ ...meta, coworking: e.target.checked })} className="accent-amber-500 h-4 w-4" />
                        Coworking / Work desk available
                      </label>
                      <label className="flex items-center gap-2 text-sm font-semibold" style={{ color: "var(--on-surface-variant)" }}>
                        <input type="checkbox" checked={meta.community_events} onChange={(e) => setMeta({ ...meta, community_events: e.target.checked })} className="accent-amber-500 h-4 w-4" />
                        Community events organized
                      </label>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* ── House Rules ── */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--outline)" }}>House Rules</label>
              <input className="input-field" placeholder="e.g. No smoking. Curfew at 10 PM. No pets allowed."
                value={form.rules} onChange={(e) => setForm({ ...form, rules: e.target.value })} />
            </div>

            {/* ── Photos ── */}
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-widest" style={{ color: "var(--outline)" }}>Photos</p>
              <label
                className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed py-8 text-center transition-colors hover:border-amber-400"
                style={{ borderColor: "var(--outline-variant)", background: "var(--surface-container-low)" }}
              >
                <span className="text-3xl">📸</span>
                <span className="text-sm font-bold" style={{ color: "var(--on-surface)" }}>
                  {uploadingImages ? "Uploading…" : "Click to upload photos"}
                </span>
                <span className="text-xs" style={{ color: "var(--outline)" }}>First photo becomes the cover image</span>
                <input type="file" multiple accept="image/*" className="hidden"
                  onChange={(e) => e.target.files && handleImageUpload(e.target.files)} />
              </label>
              {imageUrls.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {imageUrls.map((url, i) => (
                    <div key={i} className="relative group">
                      <img src={url} alt="" className="h-20 w-24 rounded-xl object-cover" />
                      {i === 0 && (
                        <span className="absolute bottom-1 left-1 rounded-lg px-1.5 py-0.5 text-[9px] font-black"
                          style={{ background: "var(--primary)", color: "var(--on-primary)" }}>
                          Cover
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        className="absolute right-1 top-1 hidden rounded-full p-1 text-xs font-black group-hover:flex"
                        style={{ background: "rgba(186,26,26,0.85)", color: "#fff" }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Submit ── */}
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="btn-primary w-full disabled:opacity-50 text-base py-4"
            >
              {editingPropertyId
                ? (updateMutation.isPending ? "Saving changes…" : "💾 Save Changes")
                : (createMutation.isPending ? "Submitting listing…" : `🚀 Submit ${typeLabel(form.property_type)} for Review`)}
            </button>

            {(createMutation.isError || updateMutation.isError) && (
              <p className="text-sm text-center" style={{ color: "var(--error)" }}>
                Something went wrong. Please check all required fields and try again.
              </p>
            )}
          </form>
        </section>
      </Reveal>

      {/* ── My Listings ───────────────────────────────────────────────────── */}
      <Reveal className="mt-10">
        <section>
          <h2 className="text-xl font-black" style={{ color: "var(--on-surface)" }}>My Listings</h2>

          {propertiesQuery.isLoading && (
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {[1, 2, 3].map((i) => <div key={i} className="h-48 skeleton-shimmer rounded-2xl" />)}
            </div>
          )}
          {propertiesQuery.isError && (
            <p className="mt-3 text-sm" style={{ color: "var(--error)" }}>Unable to load listings. Please try refreshing.</p>
          )}
          {!propertiesQuery.isLoading && (propertiesQuery.data?.length ?? 0) === 0 && !propertiesQuery.isError && (
            <div className="mt-6 rounded-3xl p-12 text-center" style={{ background: "var(--surface-container-low)" }}>
              <p className="text-5xl">📋</p>
              <p className="mt-4 text-lg font-black" style={{ color: "var(--on-surface)" }}>No listings yet</p>
              <p className="mt-2 text-sm" style={{ color: "var(--outline)" }}>Use the form above to post your first property.</p>
            </div>
          )}

          <div className="mt-4 grid gap-5 md:grid-cols-2">
            {propertiesQuery.data?.map((item) => (
              <article key={item.property_id} className="glass-card overflow-hidden p-0">
                {/* Cover image */}
                {item.cover_image_url ? (
                  <img src={item.cover_image_url} alt={item.title}
                    className="h-36 w-full object-cover" />
                ) : (
                  <div className="flex h-36 w-full items-center justify-center text-4xl"
                    style={{ background: "var(--surface-container)" }}>
                    {typeIcon(item.property_type)}
                  </div>
                )}

                <div className="p-5">
                  {/* Title + badges */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="truncate font-black" style={{ color: "var(--on-surface)" }}>{item.title}</p>
                      <p className="truncate text-xs mt-0.5" style={{ color: "var(--outline)" }}>
                        {item.address_text || item.property_id}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="badge text-[10px] px-2 py-1"
                        style={{
                          background: item.approval_status === "approved" ? "var(--success-container)" : "var(--primary-fixed)",
                          color: item.approval_status === "approved" ? "#065f46" : "var(--on-primary-container)",
                        }}>
                        {item.approval_status}
                      </span>
                      <span className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                        style={{ background: "var(--surface-container)", color: "var(--outline)" }}>
                        {typeIcon(item.property_type)} {typeLabel(item.property_type)}
                      </span>
                    </div>
                  </div>

                  {/* Rent */}
                  <p className="mt-2 text-sm font-bold" style={{ color: "var(--primary)" }}>
                    ₹{item.rent_min.toLocaleString()} – ₹{item.rent_max.toLocaleString()}/mo
                    <span className="ml-2 text-xs font-normal" style={{ color: "var(--outline)" }}>
                      · {item.availability_status}
                    </span>
                  </p>

                  {/* Action buttons */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      onClick={() => toggleAvailabilityMutation.mutate({ propertyId: item.property_id, availability: "available" })}
                      className="rounded-full px-3 py-1.5 text-xs font-bold transition-colors"
                      style={{ background: "var(--success-container)", color: "#065f46" }}>
                      ✅ Available
                    </button>
                    <button
                      onClick={() => toggleAvailabilityMutation.mutate({ propertyId: item.property_id, availability: "occupied" })}
                      className="rounded-full px-3 py-1.5 text-xs font-bold transition-colors"
                      style={{ background: "var(--primary-fixed)", color: "var(--on-primary-container)" }}>
                      🔒 Occupied
                    </button>
                    <button
                      onClick={() => {
                        setEditingPropertyId(item.property_id);
                        setForm({
                          title:              item.title,
                          property_type:      item.property_type,
                          primary_college_id: item.primary_college_id || "",
                          description:        item.description || "",
                          address_text:       item.address_text || "",
                          latitude:           String(item.latitude),
                          longitude:          String(item.longitude),
                          rent_min:           String(item.rent_min),
                          rent_max:           String(item.rent_max),
                          security_deposit:   String(item.security_deposit),
                          gender:             item.gender || "any",
                          food_available:     item.food_available,
                          food_menu:          item.food_menu || "",
                          rules:              item.rules || "",
                        });
                        setSelectedAmenities(new Set(item.amenities));
                        setImageUrls(item.image_urls);
                        document.getElementById("listing-form")?.scrollIntoView({ behavior: "smooth" });
                      }}
                      className="rounded-full px-3 py-1.5 text-xs font-bold transition-colors"
                      style={{ background: "var(--surface-container-low)", color: "var(--on-surface)" }}>
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => loadInquiries(item.property_id)}
                      className="rounded-full px-3 py-1.5 text-xs font-bold transition-colors"
                      style={{ background: "var(--surface-container-high)", color: "var(--on-surface)" }}>
                      💬 Inquiries
                    </button>
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(`Check out this property on NearMyColleges: ${item.title} — ₹${item.rent_min.toLocaleString()}/mo. See more at https://nearmycolleges.in`)}`}
                      target="_blank" rel="noopener noreferrer"
                      className="rounded-full px-3 py-1.5 text-xs font-bold transition-colors"
                      style={{ background: "rgba(34,197,94,0.1)", color: "#16a34a" }}>
                      📤 Share
                    </a>
                    <button
                      onClick={() => { if (confirm("Permanently delete this listing?")) deleteMutation.mutate(item.property_id); }}
                      className="rounded-full px-3 py-1.5 text-xs font-bold transition-colors"
                      style={{ background: "rgba(186,26,26,0.08)", color: "var(--error)" }}>
                      🗑️ Delete
                    </button>
                  </div>

                  {/* Inquiries panel */}
                  {selectedPropertyInquiries === item.property_id && (
                    <div className="mt-4 space-y-2 rounded-xl p-4" style={{ background: "var(--surface-container-low)" }}>
                      <h4 className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--outline)" }}>
                        Inquiries ({inquiries.length})
                      </h4>
                      {inquiries.length === 0 ? (
                        <p className="text-sm" style={{ color: "var(--outline)" }}>No inquiries yet for this listing.</p>
                      ) : (
                        inquiries.map((inq) => (
                          <div key={inq.inquiry_id} className="rounded-xl p-4 text-sm"
                            style={{ background: "var(--surface-container-lowest)" }}>
                            <div className="flex items-start justify-between gap-2">
                              <p className="font-bold" style={{ color: "var(--on-surface)" }}>{inq.name}</p>
                              <div className="flex gap-1.5 shrink-0">
                                <a href={`tel:${inq.phone}`}
                                  className="rounded-lg px-2 py-1 text-[10px] font-bold"
                                  style={{ background: "rgba(59,130,246,0.1)", color: "#2563eb" }}>
                                  📞 Call
                                </a>
                                <a href={`https://wa.me/91${inq.phone}?text=${encodeURIComponent(`Hi ${inq.name}, thanks for your inquiry about "${item.title}" on NearMyColleges!`)}`}
                                  target="_blank" rel="noopener noreferrer"
                                  className="rounded-lg px-2 py-1 text-[10px] font-bold"
                                  style={{ background: "rgba(34,197,94,0.1)", color: "#16a34a" }}>
                                  💬 WhatsApp
                                </a>
                              </div>
                            </div>
                            <p className="text-xs mt-0.5" style={{ color: "var(--outline)" }}>{inq.phone}</p>
                            {inq.message && <p className="mt-1" style={{ color: "var(--on-surface-variant)" }}>{inq.message}</p>}
                            <p className="mt-1 text-xs" style={{ color: "var(--outline)" }}>
                              {new Date(inq.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      </Reveal>


      {/* Map Picker Modal */}
      {showMapModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="w-full max-w-3xl overflow-hidden rounded-3xl shadow-2xl" style={{ background: "var(--surface)" }}>
            <div className="flex items-center justify-between p-4" style={{ borderBottom: "1px solid var(--glass-border)" }}>
              <h3 className="font-black" style={{ color: "var(--on-surface)" }}>Pick Location</h3>
              <button onClick={() => setShowMapModal(false)} className="text-xl hover:opacity-70">✕</button>
            </div>
            <div className="p-4">
              <p className="mb-3 text-xs" style={{ color: "var(--outline)" }}>
                Click anywhere on the map to place the pin. Drag the map to zoom and find the exact location.
              </p>
              <div ref={mapPickerRef} className="h-96 w-full rounded-2xl border" />
            </div>
            <div className="flex justify-end gap-3 p-4" style={{ borderTop: "1px solid var(--glass-border)" }}>
              <button onClick={() => setShowMapModal(false)} className="btn-primary !px-6">Done</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
