import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";

import { listColleges } from "../../lib/api";

type SearchFiltersProps = {
  onApply: (value: {
    collegeId: string;
    radius: number;
    propertyType?: string;
    gender?: string;
    budgetMin?: number;
    budgetMax?: number;
    amenities?: string[];
    sort?: string;
  }) => void;
};

const AMENITY_OPTIONS = ["wifi", "food", "ac", "parking", "laundry", "gym", "cctv", "geyser", "power_backup", "study_room"];

export function SearchFilters({ onApply }: SearchFiltersProps) {
  const location = useLocation();
  const [selectedCity, setSelectedCity] = useState(location.state?.city || "");
  const [collegeId, setCollegeId] = useState(location.state?.collegeId || "sample-college-1");
  const [radius, setRadius] = useState(2);
  const [propertyType, setPropertyType] = useState("");
  const [gender, setGender] = useState("");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [sort, setSort] = useState("nearest");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const collegesQuery = useQuery({ queryKey: ["colleges"], queryFn: listColleges });
  
  const uniqueCities = Array.from(new Set((collegesQuery.data ?? []).map((c) => c.city))).sort();
  const filteredColleges = (collegesQuery.data ?? []).filter((c) => !selectedCity || c.city === selectedCity);

  const toggleAmenity = (a: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]
    );
  };

  const handleApply = () => {
    onApply({
      collegeId,
      radius,
      propertyType: propertyType || undefined,
      gender: gender || undefined,
      budgetMin: budgetMin ? Number(budgetMin) : undefined,
      budgetMax: budgetMax ? Number(budgetMax) : undefined,
      amenities: selectedAmenities.length ? selectedAmenities : undefined,
      sort,
    });
  };

  return (
    <section>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
        <div>
          <p
            className="text-xs font-bold uppercase tracking-widest"
            style={{ color: "var(--outline)", letterSpacing: "0.05em" }}
          >
            Search Controls
          </p>
          <h3 className="mt-1 text-lg font-black" style={{ color: "var(--on-surface)" }}>
            Set your rental preferences
          </h3>
        </div>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-xs font-bold transition-colors"
          style={{ color: "var(--primary)" }}
        >
          {showAdvanced ? "Hide filters ↑" : "More filters ↓"}
        </button>
      </div>

      {/* Row 1: Main filters */}
      <div className="grid gap-3 md:grid-cols-5">
        <label className="block">
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--outline)", letterSpacing: "0.05em" }}>
            City
          </span>
          <select value={selectedCity} onChange={(e) => { setSelectedCity(e.target.value); setCollegeId(""); }} className="input-field mt-2">
            <option value="">Any City</option>
            {uniqueCities.map((city) => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--outline)", letterSpacing: "0.05em" }}>
            College
          </span>
          <select value={collegeId} onChange={(e) => setCollegeId(e.target.value)} className="input-field mt-2">
            <option value="">{selectedCity ? "Select a campus..." : "Select city first"}</option>
            {filteredColleges.map((c) => (
              <option key={c.college_id} value={c.college_id}>
                {c.short_name ? `${c.short_name} — ${c.name}` : c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--outline)", letterSpacing: "0.05em" }}>
            Radius
          </span>
          <select value={radius} onChange={(e) => setRadius(Number(e.target.value))} className="input-field mt-2">
            {[0.5, 1, 2, 5, 10].map((r) => (
              <option key={r} value={r}>{r} km</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--outline)", letterSpacing: "0.05em" }}>
            Property Type
          </span>
          <select value={propertyType} onChange={(e) => setPropertyType(e.target.value)} className="input-field mt-2">
            <option value="">All Types</option>
            <option value="pg">PG</option>
            <option value="flat">Flat</option>
            <option value="hostel">Hostel</option>
            <option value="single_room">Single Room</option>
            <option value="co_living">Co-living</option>
          </select>
        </label>
        <label className="block">
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--outline)", letterSpacing: "0.05em" }}>
            Sort By
          </span>
          <select value={sort} onChange={(e) => setSort(e.target.value)} className="input-field mt-2">
            <option value="nearest">Nearest First</option>
            <option value="lowest_price">Lowest Price</option>
            <option value="highest_rated">Highest Rated</option>
            <option value="newest">Newest First</option>
          </select>
        </label>
      </div>

      {/* Row 2: Advanced filters */}
      {showAdvanced && (
        <div
          className="mt-5 space-y-4 rounded-2xl p-5"
          style={{ background: "var(--surface-container-low)" }}
        >
          <div className="grid gap-3 md:grid-cols-3">
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--outline)", letterSpacing: "0.05em" }}>
                Gender
              </span>
              <select value={gender} onChange={(e) => setGender(e.target.value)} className="input-field mt-2">
                <option value="">Any</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="any">Co-ed</option>
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--outline)", letterSpacing: "0.05em" }}>
                Budget Min (₹)
              </span>
              <input
                type="number"
                placeholder="e.g. 3000"
                value={budgetMin}
                onChange={(e) => setBudgetMin(e.target.value)}
                className="input-field mt-2"
              />
            </label>
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--outline)", letterSpacing: "0.05em" }}>
                Budget Max (₹)
              </span>
              <input
                type="number"
                placeholder="e.g. 15000"
                value={budgetMax}
                onChange={(e) => setBudgetMax(e.target.value)}
                className="input-field mt-2"
              />
            </label>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--outline)", letterSpacing: "0.05em" }}>
              Amenities
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {AMENITY_OPTIONS.map((a) => (
                <button
                  key={a}
                  onClick={() => toggleAmenity(a)}
                  className="rounded-full px-3.5 py-1.5 text-xs font-bold transition-all"
                  style={
                    selectedAmenities.includes(a)
                      ? { background: "var(--gradient-amber)", color: "var(--on-primary)" }
                      : { background: "var(--surface-container)", color: "var(--on-surface-variant)" }
                  }
                >
                  {a.replace(/_/g, " ")}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <button onClick={handleApply} className="btn-primary mt-5">
        Apply Filters
      </button>
    </section>
  );
}
