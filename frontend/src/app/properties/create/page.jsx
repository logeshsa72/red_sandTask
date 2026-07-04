"use client";
// frontend/src/app/properties/create/page.jsx
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../../context/AuthContext";
import { propertyApi } from "../../../lib/api/properties";
import ImageUploader from "../../../components/ImageUploader";
import {
  Home, ArrowLeft, Loader2, CheckCircle2, AlertCircle,
  MapPin, IndianRupee, Bed, Bath, Maximize2, Info,
} from "lucide-react";

const STEPS = ["Basic Info", "Location", "Details", "Review"];

const INITIAL_FORM = {
  title: "",
  description: "",
  price: "",
  listingType: "SALE",
  propertyType: "APARTMENT",
  city: "",
  locality: "",
  address: "",
  bedrooms: "2",
  bathrooms: "1",
  area: "",
  areaUnit: "SQFT",
  furnished: "UNFURNISHED",
  amenities: [],
  images: [],
};

const AMENITY_OPTIONS = [
  "Parking", "Gym", "Swimming Pool", "Security", "Power Backup",
  "Lift", "Garden", "Clubhouse", "Play Area", "CCTV", "Gas Pipeline", "Intercom",
];

function StepIndicator({ step, current }) {
  const done = step < current;
  const active = step === current;
  return (
    <div className="flex items-center gap-2">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all
        ${done ? "bg-emerald-500 text-white" : active ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-400"}`}>
        {done ? <CheckCircle2 className="w-4 h-4" /> : step}
      </div>
      <span className={`text-sm font-medium hidden sm:block ${active ? "text-indigo-600" : done ? "text-emerald-600" : "text-slate-400"}`}>
        {STEPS[step - 1]}
      </span>
    </div>
  );
}

function FormField({ label, required, error, hint, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-slate-400 flex items-center gap-1"><Info className="w-3 h-3" />{hint}</p>}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

const inputClass = "w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all";
const selectClass = inputClass;

export default function CreatePropertyPage() {
  const { token, user } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  const set = (key, value) => {
    setForm((p) => ({ ...p, [key]: value }));
    if (errors[key]) setErrors((p) => ({ ...p, [key]: "" }));
  };

  const toggleAmenity = (a) => {
    setForm((p) => ({
      ...p,
      amenities: p.amenities.includes(a) ? p.amenities.filter((x) => x !== a) : [...p.amenities, a],
    }));
  };

  const validateStep = () => {
    const e = {};
    if (step === 1) {
      if (!form.title.trim()) e.title = "Title is required";
      else if (form.title.length < 10) e.title = "Title must be at least 10 characters";
      if (!form.description.trim()) e.description = "Description is required";
      else if (form.description.length < 20) e.description = "Description must be at least 20 characters";
      if (!form.price) e.price = "Price is required";
      else if (Number(form.price) < 1) e.price = "Enter a valid price";
    }
    if (step === 2) {
      if (!form.city.trim()) e.city = "City is required";
      if (!form.locality.trim()) e.locality = "Locality is required";
      if (!form.address.trim()) e.address = "Full address is required";
    }
if (step === 3) {
  if (!form.area) e.area = "Area is required";
  else if (Number(form.area) < 1) e.area = "Enter a valid area";
  if (form.images.length === 0) e.images = "At least 1 photo is required"; // ADD THIS
}
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => { if (validateStep()) setStep((s) => s + 1); };
  const back = () => setStep((s) => s - 1);

  const handleSubmit = async () => {
    setLoading(true);
    setApiError("");
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        bedrooms: Number(form.bedrooms),
        bathrooms: Number(form.bathrooms),
        area: Number(form.area),
      };
      const res = await propertyApi.create(payload, token);
      router.push(`/properties/${res.data.property.id}?created=1`);
    } catch (err) {
      setApiError(err.message || "Failed to create listing. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-100 shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Home className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-800">
              Nest<span className="text-indigo-600">Find</span>
            </span>
          </Link>
          <Link href="/properties" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to listings
          </Link>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-800 mb-1">List Your Property</h1>
          <p className="text-slate-500 text-sm">Fill in the details below to create your listing</p>
        </div>

        {/* Step Progress */}
        <div className="flex items-center gap-4 mb-8 bg-white rounded-2xl px-6 py-4 shadow-sm border border-slate-100">
          {[1, 2, 3, 4].map((s, i) => (
            <div key={s} className="flex items-center gap-3 flex-1">
              <StepIndicator step={s} current={step} />
              {i < 3 && <div className={`flex-1 h-0.5 rounded-full ${step > s ? "bg-emerald-300" : "bg-slate-100"}`} />}
            </div>
          ))}
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-md shadow-slate-100 border border-slate-100 p-8">
          {apiError && (
            <div className="mb-6 flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {apiError}
            </div>
          )}

          {/* STEP 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">Basic Information</h2>

              <div className="grid grid-cols-2 gap-4">
                <FormField label="Listing Type" required>
                  <select value={form.listingType} onChange={(e) => set("listingType", e.target.value)} className={selectClass}>
                    <option value="SALE">For Sale</option>
                    <option value="RENT">For Rent</option>
                  </select>
                </FormField>
                <FormField label="Property Type" required>
                  <select value={form.propertyType} onChange={(e) => set("propertyType", e.target.value)} className={selectClass}>
                    {["APARTMENT","VILLA","HOUSE","PLOT","COMMERCIAL","PG"].map(t => (
                      <option key={t} value={t}>{t.charAt(0) + t.slice(1).toLowerCase()}</option>
                    ))}
                  </select>
                </FormField>
              </div>

              <FormField label="Title" required error={errors.title} hint="Make it descriptive, e.g. '3 BHK Apartment in Bandra West'">
                <input type="text" value={form.title} onChange={(e) => set("title", e.target.value)}
                  placeholder="e.g. 3 BHK Apartment near Metro Station" className={inputClass} maxLength={120} />
              </FormField>

              <FormField label="Description" required error={errors.description}>
                <textarea value={form.description} onChange={(e) => set("description", e.target.value)}
                  placeholder="Describe the property, nearby landmarks, condition, etc."
                  className={`${inputClass} h-28 resize-none`} maxLength={1000} />
                <p className="mt-1 text-xs text-slate-400 text-right">{form.description.length}/1000</p>
              </FormField>

              <FormField label={`Price (₹) — ${form.listingType === "RENT" ? "per month" : "total"}`} required error={errors.price}>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="number" value={form.price} onChange={(e) => set("price", e.target.value)}
                    placeholder="e.g. 5000000" className={`${inputClass} pl-9`} min="0" />
                </div>
              </FormField>
            </div>
          )}

          {/* STEP 2: Location */}
          {step === 2 && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-indigo-500" /> Location Details
              </h2>

              <div className="grid grid-cols-2 gap-4">
                <FormField label="City" required error={errors.city}>
                  <input type="text" value={form.city} onChange={(e) => set("city", e.target.value)}
                    placeholder="e.g. Mumbai" className={inputClass} />
                </FormField>
                <FormField label="Locality" required error={errors.locality}>
                  <input type="text" value={form.locality} onChange={(e) => set("locality", e.target.value)}
                    placeholder="e.g. Bandra West" className={inputClass} />
                </FormField>
              </div>

              <FormField label="Full Address" required error={errors.address}>
                <textarea value={form.address} onChange={(e) => set("address", e.target.value)}
                  placeholder="Building name, street, landmark…"
                  className={`${inputClass} h-20 resize-none`} />
              </FormField>
            </div>
          )}

          {/* STEP 3: Details */}
          {step === 3 && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">Property Details</h2>

              <div className="grid grid-cols-3 gap-4">
                <FormField label="Bedrooms" required>
                  <div className="relative">
                    <Bed className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <select value={form.bedrooms} onChange={(e) => set("bedrooms", e.target.value)} className={`${selectClass} pl-9`}>
                      {[0,1,2,3,4,5,6].map(n => <option key={n} value={n}>{n === 0 ? "Studio" : `${n} BHK`}</option>)}
                    </select>
                  </div>
                </FormField>
                <FormField label="Bathrooms" required>
                  <div className="relative">
                    <Bath className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <select value={form.bathrooms} onChange={(e) => set("bathrooms", e.target.value)} className={`${selectClass} pl-9`}>
                      {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                </FormField>
                <FormField label="Furnishing">
                  <select value={form.furnished} onChange={(e) => set("furnished", e.target.value)} className={selectClass}>
                    <option value="UNFURNISHED">Unfurnished</option>
                    <option value="SEMI_FURNISHED">Semi Furnished</option>
                    <option value="FURNISHED">Furnished</option>
                  </select>
                </FormField>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField label="Area" required error={errors.area}>
                  <div className="relative">
                    <Maximize2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="number" value={form.area} onChange={(e) => set("area", e.target.value)}
                      placeholder="e.g. 1200" className={`${inputClass} pl-9`} min="0" />
                  </div>
                </FormField>
                <FormField label="Unit">
                  <select value={form.areaUnit} onChange={(e) => set("areaUnit", e.target.value)} className={selectClass}>
                    <option value="SQFT">Sq. Ft.</option>
                    <option value="SQMT">Sq. Mt.</option>
                    <option value="ACRES">Acres</option>
                  </select>
                </FormField>
              </div>

              <FormField label="Amenities">
                <div className="flex flex-wrap gap-2 mt-1">
                  {AMENITY_OPTIONS.map((a) => (
                    <button key={a} type="button" onClick={() => toggleAmenity(a)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all
                        ${form.amenities.includes(a) ? "bg-indigo-600 text-white border-indigo-600" : "bg-slate-50 text-slate-600 border-slate-200 hover:border-indigo-300"}`}>
                      {a}
                    </button>
                  ))}
                </div>
              </FormField>
<FormField label="Property Photos" required error={errors.images}>
  <ImageUploader
    images={form.images}
    onChange={(urls) => set("images", urls)}
  />
</FormField>
            </div>
          )}

          {/* STEP 4: Review */}
          {step === 4 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">Review & Submit</h2>

              <div className="bg-slate-50 rounded-xl p-4 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Title</span>
                  <span className="text-slate-800 font-medium text-right max-w-xs">{form.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Type</span>
                  <span className="text-slate-800">{form.listingType} — {form.propertyType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Price</span>
                  <span className="text-slate-800 font-semibold text-indigo-600">₹{Number(form.price).toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Location</span>
                  <span className="text-slate-800 text-right">{form.locality}, {form.city}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Size</span>
                  <span className="text-slate-800">{form.bedrooms} BHK · {form.area} {form.areaUnit}</span>
                </div>
                {form.amenities.length > 0 && (
                  <div className="flex justify-between items-start">
                    <span className="text-slate-500">Amenities</span>
                    <span className="text-slate-800 text-right max-w-xs">{form.amenities.join(", ")}</span>
                  </div>
                )}
                // Step 4 review section la, summary div kaala add pannu:
{form.images.length > 0 && (
  <div>
    <p className="text-xs text-slate-500 mb-2">Photos ({form.images.length})</p>
    <div className="grid grid-cols-4 gap-1.5 rounded-xl overflow-hidden">
      {form.images.slice(0, 4).map((url, i) => (
        <div key={url} className="relative aspect-square">
          <img src={url} className="w-full h-full object-cover rounded-lg" />
          {i === 0 && (
            <span className="absolute bottom-1 left-1 bg-indigo-600 text-white text-[9px] px-1 rounded">Cover</span>
          )}
          {i === 3 && form.images.length > 4 && (
            <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center text-white text-sm font-bold">
              +{form.images.length - 4}
            </div>
          )}
        </div>
      ))}
    </div>
  </div>
)}
              </div>

              <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3 text-sm text-indigo-700 flex items-start gap-2">
                <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                Your listing will go live immediately after submission. You can edit or delete it anytime from your dashboard.
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-100">
            {step > 1 ? (
              <button onClick={back} className="flex items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-50 rounded-xl transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
            ) : (
              <div />
            )}

            {step < 4 ? (
              <button onClick={next} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-indigo-200 transition-colors">
                Continue →
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={loading}
                className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl shadow-md shadow-emerald-200 transition-colors">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Publishing…</> : <><CheckCircle2 className="w-4 h-4" /> Publish Listing</>}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
