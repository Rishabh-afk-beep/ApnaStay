import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { adminListColleges, adminCreateCollege, adminUpdateCollege, adminDeleteCollege } from "../lib/api";
import { Reveal } from "../components/ui/Reveal";
import { AnimatedNumber } from "../components/ui/AnimatedNumber";

export function AdminCollegesPage() {
  const queryClient = useQueryClient();
  const collegesQuery = useQuery({ queryKey: ["admin-colleges"], queryFn: adminListColleges });

  const [form, setForm] = useState({
    name: "",
    short_name: "",
    address: "",
    city: "",
    state: "",
    latitude: "",
    longitude: "",
  });

  const [activeTab, setActiveTab] = useState<"single" | "bulk">("single");
  const [bulkInput, setBulkInput] = useState("");
  const [bulkError, setBulkError] = useState("");

  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", short_name: "", address: "", city: "", state: "" });

  const createMutation = useMutation({
    mutationFn: () =>
      adminCreateCollege({
        name: form.name,
        short_name: form.short_name || undefined,
        address: form.address || undefined,
        city: form.city,
        state: form.state,
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-colleges"] });
      setForm({ name: "", short_name: "", address: "", city: "", state: "", latitude: "", longitude: "" });
    },
  });

  const bulkCreateMutation = useMutation({
    mutationFn: async (colleges: any[]) => {
      for (const c of colleges) {
        await adminCreateCollege(c);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-colleges"] });
      setBulkInput("");
      setBulkError("");
      setActiveTab("single");
      alert("Bulk import completed successfully!");
    },
    onError: (err: any) => {
      setBulkError(err.message || "Failed during bulk import.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: () => adminUpdateCollege(editId!, editForm),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-colleges"] });
      setEditId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminDeleteCollege(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-colleges"] }),
  });

  const handleCreate = (e: FormEvent) => {
    e.preventDefault();
    createMutation.mutate();
  };

  const handleBulkSubmit = (e: FormEvent) => {
    e.preventDefault();
    setBulkError("");
    try {
      const parsed = JSON.parse(bulkInput);
      if (!Array.isArray(parsed)) throw new Error("Input must be a JSON array of colleges");
      bulkCreateMutation.mutate(parsed);
    } catch (err: any) {
      setBulkError("Invalid JSON: " + err.message);
    }
  };

  const startEdit = (college: any) => {
    setEditId(college.college_id);
    setEditForm({
      name: college.name,
      short_name: college.short_name || "",
      address: college.address || "",
      city: college.city,
      state: college.state,
    });
  };

  const colleges = collegesQuery.data ?? [];

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <Reveal>
        <section className="section-dark relative overflow-hidden">
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full opacity-15"
            style={{ background: "var(--primary-fixed-dim)", filter: "blur(60px)" }} />
          <div className="relative z-10">
            <p className="text-xs font-bold uppercase tracking-widest"
              style={{ color: "var(--primary-fixed-dim)", letterSpacing: "0.15em" }}>
              Admin
            </p>
            <h1 className="mt-2 text-3xl font-black text-white">
              College Management
            </h1>
            <p className="mt-2 text-sm text-slate-300">
              <AnimatedNumber value={colleges.length} /> colleges registered
            </p>
          </div>
        </section>
      </Reveal>

      {/* Create form */}
      <Reveal className="mt-8" delayMs={60}>
        <section className="glass-card-static p-7">
          <div className="flex items-center justify-between">
            <h2 className="font-black" style={{ color: "var(--on-surface)" }}>Add New College</h2>
            <div className="flex rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
              <button
                onClick={() => setActiveTab("single")}
                className={`rounded-md px-3 py-1.5 text-xs font-bold ${activeTab === "single" ? "bg-white text-slate-900 shadow dark:bg-slate-700 dark:text-white" : "text-slate-500 hover:text-slate-700 dark:text-slate-400"}`}
              >
                Single Entry
              </button>
              <button
                onClick={() => setActiveTab("bulk")}
                className={`rounded-md px-3 py-1.5 text-xs font-bold ${activeTab === "bulk" ? "bg-white text-slate-900 shadow dark:bg-slate-700 dark:text-white" : "text-slate-500 hover:text-slate-700 dark:text-slate-400"}`}
              >
                Bulk Import
              </button>
            </div>
          </div>
          
          {activeTab === "single" ? (
            <>
              {createMutation.isError && (
                <div className="mt-3 rounded-xl p-3 text-sm"
                  style={{ background: "rgba(186,26,26,0.08)", color: "var(--error)" }}>
                  {(createMutation.error as any)?.response?.data?.detail?.message
                    || (createMutation.error as any)?.message
                    || "Failed to create college"}
                </div>
              )}
              {createMutation.isSuccess && (
                <div className="mt-3 rounded-xl p-3 text-sm"
                  style={{ background: "var(--success-container)", color: "#065f46" }}>
                  ✅ College added successfully!
                </div>
              )}
              <form onSubmit={handleCreate} className="mt-5 grid gap-3 md:grid-cols-2">
                <input required className="input-field" placeholder="College Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                <input className="input-field" placeholder="Short Name (e.g. IIT-H)" value={form.short_name} onChange={(e) => setForm({ ...form, short_name: e.target.value })} />
                <input className="input-field md:col-span-2" placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
                <input required className="input-field" placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
                <input required className="input-field" placeholder="State" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
                <input required type="number" step="any" className="input-field" placeholder="Latitude (e.g. 13.0836)" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} />
                <input required type="number" step="any" className="input-field" placeholder="Longitude (e.g. 77.4827)" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} />
                <button type="submit" disabled={createMutation.isPending} className="btn-primary disabled:opacity-50">
                  {createMutation.isPending ? "Adding..." : "Add College"}
                </button>
              </form>
            </>
          ) : (
            <div className="mt-5">
              {bulkError && (
                <div className="mb-3 rounded-xl p-3 text-sm" style={{ background: "rgba(186,26,26,0.08)", color: "var(--error)" }}>
                  {bulkError}
                </div>
              )}
              <p className="text-xs text-slate-500 mb-2">Paste a JSON array of college objects. Required fields: name, city, state, latitude, longitude.</p>
              <textarea
                value={bulkInput}
                onChange={(e) => setBulkInput(e.target.value)}
                className="input-field min-h-[200px] font-mono text-xs"
                placeholder={'[\n  { "name": "IIT Delhi", "city": "New Delhi", "state": "Delhi", "latitude": 28.545, "longitude": 77.192 }\n]'}
              />
              <button onClick={handleBulkSubmit} disabled={bulkCreateMutation.isPending || !bulkInput.trim()} className="btn-primary mt-3 disabled:opacity-50">
                {bulkCreateMutation.isPending ? "Importing..." : "Run Bulk Import"}
              </button>
            </div>
          )}
        </section>
      </Reveal>

      {/* College list */}
      <Reveal className="mt-8" delayMs={110}>
        {collegesQuery.isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-24 skeleton-shimmer" />)}
          </div>
        )}
        <div className="space-y-3">
          {colleges.map((college) => (
            <article key={college.college_id} className="glass-card p-6">
              {editId === college.college_id ? (
                <div className="grid gap-3 md:grid-cols-2">
                  <input className="input-field" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                  <input className="input-field" value={editForm.short_name} onChange={(e) => setEditForm({ ...editForm, short_name: e.target.value })} placeholder="Short Name" />
                  <input className="input-field" value={editForm.city} onChange={(e) => setEditForm({ ...editForm, city: e.target.value })} />
                  <input className="input-field" value={editForm.state} onChange={(e) => setEditForm({ ...editForm, state: e.target.value })} />
                  <div className="flex gap-2 md:col-span-2">
                    <button
                      onClick={() => updateMutation.mutate()}
                      className="rounded-full px-5 py-2 text-sm font-bold"
                      style={{ background: "var(--success-container)", color: "#065f46" }}
                    >
                      Save
                    </button>
                    <button onClick={() => setEditId(null)} className="btn-ghost">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-black" style={{ color: "var(--on-surface)" }}>
                      {college.name}
                      {college.short_name && (
                        <span className="ml-2 text-sm font-normal" style={{ color: "var(--outline)" }}>
                          ({college.short_name})
                        </span>
                      )}
                    </p>
                    <p className="text-sm" style={{ color: "var(--outline)" }}>{college.city}, {college.state}</p>
                    {college.address && <p className="text-xs" style={{ color: "var(--outline)" }}>{college.address}</p>}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => startEdit(college)}
                      className="rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors"
                      style={{ background: "var(--surface-container)", color: "var(--on-surface)" }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => { if (confirm("Delete this college?")) deleteMutation.mutate(college.college_id); }}
                      className="rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors"
                      style={{ background: "rgba(186, 26, 26, 0.08)", color: "var(--error)" }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </article>
          ))}
        </div>
      </Reveal>
    </main>
  );
}
