"use client";
// frontend/src/app/properties/[id]/edit/page.jsx
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { propertyApi } from "@/lib/api/properties";
import { Home, ArrowLeft, Loader2, AlertCircle, CheckCircle2, IndianRupee } from "lucide-react";

const inputClass = "w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all";

export default function EditPropertyPage() {
  const { id } = useParams();
  const { user, token } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [forbidden, setForbidden] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await propertyApi.getById(id, token);
        const p = res.data.property;
        if (user && p.ownerId !== user.id) {
          setForbidden(true);
          return;
        }
        setForm({
          title: p.title, description: p.description, price: p.price,
          city: p.city, locality: p.locality, address: p.address,
          propertyType: p.propertyType, listingType: p.listingType,
          bedrooms: p.bedrooms, bathrooms: p.bathrooms,
          area: p.area, areaUnit: p.areaUnit, furnished: p.furnished,
          isActive: p.isActive,
        });
      } catch (err) {
        setError(err.message || "Failed to load property");
      } finally {
        setLoading(false);
      }
    };
    if (user) load();
  }, [id, token, user]);

  const set = (key, value) => setForm((p) => ({ ...p, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await propertyApi.update(id, {
        ...form,
        price: Number(form.price),
        bedrooms: Number(form.bedrooms),
        bathrooms: Number(form.bathrooms),
        area: Number(form.area),
      }, token);
      router.push(`/properties/${id}`);
    } catch (err) {
      setError(err.message || "Failed to update listing");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>;
  }

  if (forbidden) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-3 px-4">
        <AlertCircle className="w-10 h-10 text-red-400" />
        <p className="text-slate-600">You don&apos;t have permission to edit this listing.</p>
        <Link href={`/properties/${id}`} className="text-indigo-600 font-medium text-sm">← Back to listing</Link>
      </div>
    );
  }

  if (!form) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <nav className="bg-white border-b border-slate-100 shadow-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Home className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-800">Nest<span className="text-indigo-600">Find</span></span>
          </Link>
          <button onClick={() => router.push(`/properties/${id}`)} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-slate-800 mb-6">Edit Listing</h1>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-md shadow-slate-100 border border-slate-100 p-8 space-y-5">
          {error && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Title</label>
            <input type="text" value={form.title} onChange={(e) => set("title", e.target.value)} className={inputClass} required minLength={10} maxLength={120} />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
            <textarea value={form.description} onChange={(e) => set("description", e.target.value)} className={`${inputClass} h-28 resize-none`} required minLength={20} maxLength={1000} />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Price (₹)</label>
            <div className="relative">
              <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="number" value={form.price} onChange={(e) => set("price", e.target.value)} className={`${inputClass} pl-9`} required min="1" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">City</label>
              <input type="text" value={form.city} onChange={(e) => set("city", e.target.value)} className={inputClass} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Locality</label>
              <input type="text" value={form.locality} onChange={(e) => set("locality", e.target.value)} className={inputClass} required />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Address</label>
            <textarea value={form.address} onChange={(e) => set("address", e.target.value)} className={`${inputClass} h-20 resize-none`} required />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Bedrooms</label>
              <input type="number" value={form.bedrooms} onChange={(e) => set("bedrooms", e.target.value)} className={inputClass} min="0" max="20" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Bathrooms</label>
              <input type="number" value={form.bathrooms} onChange={(e) => set("bathrooms", e.target.value)} className={inputClass} min="0" max="20" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Area</label>
              <input type="number" value={form.area} onChange={(e) => set("area", e.target.value)} className={inputClass} min="1" />
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={form.isActive} onChange={(e) => set("isActive", e.target.checked)} className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
              Listing is active (visible in search)
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button type="button" onClick={() => router.push(`/properties/${id}`)} className="px-5 py-2.5 text-sm text-slate-600 hover:bg-slate-50 rounded-xl transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-semibold rounded-xl shadow-md shadow-indigo-200 transition-colors">
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : <><CheckCircle2 className="w-4 h-4" /> Save Changes</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
