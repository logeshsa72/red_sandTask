"use client";
// frontend/src/app/properties/[id]/page.jsx
import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../../context/AuthContext";
import { propertyApi } from "../../../lib/api/properties";
import { inquiryApi } from "../../../lib/api/inquiries";
import {
  Home, ArrowLeft, MapPin, Bed, Bath, Maximize2, IndianRupee, Eye,
  Loader2, AlertCircle, CheckCircle2, Phone, Mail, User, Trash2, Pencil,
  Sparkles,
} from "lucide-react";

function formatPrice(price) {
  const num = Number(price);
  if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`;
  if (num >= 100000) return `₹${(num / 100000).toFixed(2)} L`;
  return `₹${num.toLocaleString("en-IN")}`;
}

function SimilarCard({ property }) {
  const router = useRouter();
  return (
    <button
      onClick={() => router.push(`/properties/${property.id}`)}
      className="bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all text-left overflow-hidden flex-shrink-0 w-64"
    >
      <div className="h-32 bg-gradient-to-br from-indigo-50 to-slate-100 flex items-center justify-center overflow-hidden">
        {property.images?.[0] ? (
          <img src={property.images[0]} alt={property.title} className="w-full h-full object-cover" />
        ) : (
          <Home className="w-8 h-8 text-slate-300" />
        )}
      </div>
      <div className="p-3">
        <h4 className="text-sm font-semibold text-slate-800 line-clamp-1">{property.title}</h4>
        <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{property.locality}, {property.city}</p>
        <p className="text-sm font-bold text-indigo-600 mt-1.5">{formatPrice(property.price)}</p>
      </div>
    </button>
  );
}

export default function PropertyDetailPage() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const justCreated = searchParams.get("created") === "1";
  const { user, token } = useAuth();
  const router = useRouter();

  const [property, setProperty] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [inquiryError, setInquiryError] = useState("");
  const [inquirySent, setInquirySent] = useState(false);

  const [deleting, setDeleting] = useState(false);
  const [activeImg, setActiveImg] = useState(0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [propRes, similarRes] = await Promise.all([
        propertyApi.getById(id, token),
        propertyApi.getById ? Promise.resolve(null) : null,
      ]);
      setProperty(propRes.data.property);

      // Fetch similar properties separately (own endpoint)
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const simRes = await fetch(`${API_URL}/api/properties/${id}/similar`);
      const simJson = await simRes.json();
      if (simRes.ok) setSimilar(simJson.data.properties);
    } catch (err) {
      setError(err.message || "Failed to load property");
    } finally {
      setLoading(false);
    }
  }, [id, token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const isOwner = user && property && property.ownerId === user.id;

  const handleInquiry = async (e) => {
    e.preventDefault();
    if (!user) {
      router.push(`/login?redirect=/properties/${id}`);
      return;
    }
    setSending(true);
    setInquiryError("");
    try {
      await inquiryApi.create({ propertyId: id, message }, token);
      setInquirySent(true);
      setMessage("");
    } catch (err) {
      setInquiryError(err.message || "Failed to send inquiry");
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this listing permanently?")) return;
    setDeleting(true);
    try {
      await propertyApi.delete(id, token);
      router.push("/properties");
    } catch (err) {
      setError(err.message || "Failed to delete listing");
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4 px-4">
        <AlertCircle className="w-10 h-10 text-red-400" />
        <p className="text-slate-600">{error || "Property not found"}</p>
        <Link href="/properties" className="text-indigo-600 font-medium text-sm">← Back to listings</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-100 shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Home className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-800 hidden sm:block">
              Nest<span className="text-indigo-600">Find</span>
            </span>
          </Link>
          <button onClick={() => router.push("/properties")} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to listings
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {justCreated && (
          <div className="mb-6 flex items-center gap-2 text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            Your property is now live! Buyers can find it in search results.
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Images */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="h-80 bg-gradient-to-br from-indigo-50 to-slate-100 flex items-center justify-center">
                {property.images?.length > 0 ? (
                  <img src={property.images[activeImg]} alt={property.title} className="w-full h-full object-cover" />
                ) : (
                  <Home className="w-16 h-16 text-slate-300" />
                )}
              </div>
              {property.images?.length > 1 && (
                <div className="flex gap-2 p-3 overflow-x-auto">
                  {property.images.map((img, i) => (
                    <button key={i} onClick={() => setActiveImg(i)}
                      className={`w-16 h-16 rounded-lg overflow-hidden border-2 flex-shrink-0 ${activeImg === i ? "border-indigo-500" : "border-transparent"}`}>
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Header */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${property.listingType === "SALE" ? "bg-indigo-100 text-indigo-700" : "bg-emerald-100 text-emerald-700"}`}>
                      {property.listingType === "SALE" ? "For Sale" : "For Rent"}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-600">
                      {property.propertyType}
                    </span>
                  </div>
                  <h1 className="text-2xl font-bold text-slate-800">{property.title}</h1>
                  <p className="flex items-center gap-1 text-slate-500 text-sm mt-1.5">
                    <MapPin className="w-4 h-4" /> {property.address}, {property.locality}, {property.city}
                  </p>
                </div>

                {isOwner && (
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => router.push(`/properties/${id}/edit`)}
                      className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-xl transition-colors">
                      <Pencil className="w-4 h-4" /> Edit
                    </button>
                    <button onClick={handleDelete} disabled={deleting}
                      className="flex items-center gap-1.5 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-medium rounded-xl transition-colors disabled:opacity-50">
                      {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1 text-3xl font-bold text-indigo-600 mt-4">
                <IndianRupee className="w-6 h-6" />
                {formatPrice(property.price)}
                {property.listingType === "RENT" && <span className="text-sm text-slate-400 font-medium ml-1">/month</span>}
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100">
                {property.bedrooms > 0 && (
                  <div className="text-center">
                    <Bed className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                    <p className="text-sm font-semibold text-slate-800">{property.bedrooms} BHK</p>
                    <p className="text-xs text-slate-400">Bedrooms</p>
                  </div>
                )}
                <div className="text-center">
                  <Bath className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                  <p className="text-sm font-semibold text-slate-800">{property.bathrooms}</p>
                  <p className="text-xs text-slate-400">Bathrooms</p>
                </div>
                <div className="text-center">
                  <Maximize2 className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                  <p className="text-sm font-semibold text-slate-800">{property.area} {property.areaUnit}</p>
                  <p className="text-xs text-slate-400">Area</p>
                </div>
                <div className="text-center">
                  <Eye className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                  <p className="text-sm font-semibold text-slate-800">{property.views}</p>
                  <p className="text-xs text-slate-400">Views</p>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-3">Description</h2>
              <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">{property.description}</p>
            </div>

            {/* Amenities */}
            {property.amenities?.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <h2 className="text-lg font-semibold text-slate-800 mb-3">Amenities</h2>
                <div className="flex flex-wrap gap-2">
                  {property.amenities.map((a) => (
                    <span key={a} className="px-3 py-1.5 bg-indigo-50 text-indigo-700 text-xs font-medium rounded-lg">{a}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Similar Properties */}
            {similar.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <h2 className="text-lg font-semibold text-slate-800 mb-1 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-500" /> Similar Properties
                </h2>
                <p className="text-slate-400 text-xs mb-4">Based on location, type, and price range</p>
                <div className="flex gap-4 overflow-x-auto pb-2">
                  {similar.map((p) => <SimilarCard key={p.id} property={p} />)}
                </div>
              </div>
            )}
          </div>

          {/* Right: owner + inquiry */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sticky top-24">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">Contact Owner</h2>

              <div className="flex items-center gap-3 mb-5 pb-5 border-b border-slate-100">
                <div className="w-11 h-11 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <p className="font-semibold text-slate-800 text-sm">{property.owner?.name}</p>
                  <p className="text-xs text-slate-400">Property Owner</p>
                </div>
              </div>

              {isOwner ? (
                <p className="text-sm text-slate-500 bg-slate-50 rounded-xl px-4 py-3">This is your own listing.</p>
              ) : inquirySent ? (
                <div className="flex items-start gap-2 text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  Your inquiry has been sent. The owner will contact you soon.
                </div>
              ) : (
                <form onSubmit={handleInquiry} className="space-y-3">
                  {inquiryError && (
                    <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-xs">
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {inquiryError}
                    </div>
                  )}
                  <textarea
                    required
                    minLength={10}
                    maxLength={500}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Hi, I'm interested in this property. Please share more details…"
                    className="w-full h-24 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 placeholder-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                  />
                  <button
                    type="submit"
                    disabled={sending || message.length < 10}
                    className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed text-white font-semibold rounded-xl shadow-md shadow-indigo-200 transition-all flex items-center justify-center gap-2 text-sm"
                  >
                    {sending ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</> : !user ? "Login to inquire" : "Send Inquiry"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
