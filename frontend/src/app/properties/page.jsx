"use client";
// frontend/src/app/properties/page.jsx
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../context/AuthContext";
import { propertyApi } from "../../lib/api/properties";
import {
  Home, Search, SlidersHorizontal, MapPin, Bed, Bath,
  Maximize2, IndianRupee, ChevronLeft, ChevronRight,
  Loader2, AlertCircle, PlusCircle, LogOut, User, X,
} from "lucide-react";

const PROPERTY_TYPES = ["", "APARTMENT", "VILLA", "HOUSE", "PLOT", "COMMERCIAL", "PG"];
const LISTING_TYPES = ["", "SALE", "RENT"];
const BEDROOMS = ["", "1", "2", "3", "4", "5"];

function formatPrice(price) {
  const num = Number(price);
  if (num >= 10000000) return `₹${(num / 10000000).toFixed(1)}Cr`;
  if (num >= 100000) return `₹${(num / 100000).toFixed(1)}L`;
  return `₹${num.toLocaleString("en-IN")}`;
}

function PropertyCard({ property }) {
  const router = useRouter();
  return (
    <div
      onClick={() => router.push(`/properties/${property.id}`)}
      className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg hover:shadow-slate-100 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer overflow-hidden group"
    >
      {/* Image placeholder */}
      <div className="h-44 bg-gradient-to-br from-indigo-50 to-slate-100 relative overflow-hidden">
        {property.images?.[0] ? (
          <img src={property.images[0]} alt={property.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Home className="w-12 h-12 text-slate-300" />
          </div>
        )}
        <div className="absolute top-3 left-3">
          <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${property.listingType === "SALE" ? "bg-indigo-600 text-white" : "bg-emerald-600 text-white"}`}>
            {property.listingType === "SALE" ? "For Sale" : "For Rent"}
          </span>
        </div>
        <div className="absolute top-3 right-3">
          <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white/90 text-slate-700 shadow-sm">
            {property.propertyType}
          </span>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <h3 className="font-semibold text-slate-800 text-sm leading-snug line-clamp-1 flex-1">{property.title}</h3>
        </div>
        <div className="flex items-center gap-1 text-slate-500 text-xs mb-3">
          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="line-clamp-1">{property.locality}, {property.city}</span>
        </div>

        <div className="flex items-center gap-3 text-slate-600 text-xs mb-3 flex-wrap">
          {property.bedrooms > 0 && (
            <span className="flex items-center gap-1"><Bed className="w-3.5 h-3.5" />{property.bedrooms} BHK</span>
          )}
          {property.bathrooms > 0 && (
            <span className="flex items-center gap-1"><Bath className="w-3.5 h-3.5" />{property.bathrooms} Bath</span>
          )}
          <span className="flex items-center gap-1"><Maximize2 className="w-3.5 h-3.5" />{property.area} {property.areaUnit}</span>
        </div>

        <div className="flex items-center justify-between border-t border-slate-50 pt-3">
          <div className="font-bold text-slate-800 text-base flex items-center gap-0.5">
            <IndianRupee className="w-4 h-4" />
            {formatPrice(property.price)}
          </div>
          <span className="text-xs text-slate-400">{property.city}</span>
        </div>
      </div>
    </div>
  );
}

export default function PropertiesPage() {
  const { user, token, logout } = useAuth();
  const router = useRouter();

  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

  const [filters, setFilters] = useState({
    search: "",
    city: "",
    listingType: "",
    propertyType: "",
    bedrooms: "",
    minPrice: "",
    maxPrice: "",
    sortBy: "createdAt",
    sortOrder: "desc",
    page: 1,
    limit: 12,
  });

  const fetchProperties = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await propertyApi.getAll(filters, token);
      setProperties(res.data.properties);
      setPagination(res.data.pagination);
    } catch (err) {
      setError(err.message || "Failed to load properties");
    } finally {
      setLoading(false);
    }
  }, [filters, token]);

  useEffect(() => { fetchProperties(); }, [fetchProperties]);

  const updateFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const handleLogout = async () => { await logout(); router.push("/login"); };

  const clearFilters = () => {
    setFilters({ search: "", city: "", listingType: "", propertyType: "", bedrooms: "", minPrice: "", maxPrice: "", sortBy: "createdAt", sortOrder: "desc", page: 1, limit: 12 });
  };

  const hasActiveFilters = filters.city || filters.listingType || filters.propertyType || filters.bedrooms || filters.minPrice || filters.maxPrice;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-100 shadow-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <Link href="/dashboard" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Home className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-800 hidden sm:block">
              Nest<span className="text-indigo-600">Find</span>
            </span>
          </Link>

          {/* Search bar */}
          <div className="flex-1 max-w-md relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by city or location…"
              value={filters.search}
              onChange={(e) => updateFilter("search", e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            />
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => router.push("/properties/create")}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-xl transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:block">List Property</span>
            </button>
            <div className="flex items-center gap-2 text-sm text-slate-600 pl-2 border-l border-slate-100">
              <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-indigo-600" />
              </div>
            </div>
            <button onClick={handleLogout} className="text-slate-400 hover:text-red-500 transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Filter bar */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 mb-6">
          <div className="flex flex-wrap gap-3 items-center">
            <select value={filters.listingType} onChange={(e) => updateFilter("listingType", e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">Buy or Rent</option>
              <option value="SALE">For Sale</option>
              <option value="RENT">For Rent</option>
            </select>

            <select value={filters.propertyType} onChange={(e) => updateFilter("propertyType", e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">Property Type</option>
              {["APARTMENT","VILLA","HOUSE","PLOT","COMMERCIAL","PG"].map(t => (
                <option key={t} value={t}>{t.charAt(0) + t.slice(1).toLowerCase()}</option>
              ))}
            </select>

            <select value={filters.bedrooms} onChange={(e) => updateFilter("bedrooms", e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">Bedrooms</option>
              {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} BHK</option>)}
            </select>

            <input type="text" placeholder="City" value={filters.city} onChange={(e) => updateFilter("city", e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-32" />

            <input type="number" placeholder="Min ₹" value={filters.minPrice} onChange={(e) => updateFilter("minPrice", e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-28" />

            <input type="number" placeholder="Max ₹" value={filters.maxPrice} onChange={(e) => updateFilter("maxPrice", e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-28" />

            <select value={`${filters.sortBy}-${filters.sortOrder}`}
              onChange={(e) => { const [sortBy, sortOrder] = e.target.value.split("-"); setFilters(p => ({ ...p, sortBy, sortOrder, page: 1 })); }}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="createdAt-desc">Newest First</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="views-desc">Most Viewed</option>
            </select>

            {hasActiveFilters && (
              <button onClick={clearFilters} className="flex items-center gap-1 px-3 py-2 text-sm text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                <X className="w-3.5 h-3.5" /> Clear
              </button>
            )}
          </div>
        </div>

        {/* Results header */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-slate-600 text-sm">
            {loading ? "Loading…" : `${pagination.total} properties found`}
          </p>
        </div>

        {/* Content */}
        {error && (
          <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-6 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          </div>
        ) : properties.length === 0 ? (
          <div className="text-center py-24">
            <Home className="w-14 h-14 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-500 font-medium text-lg">No properties found</p>
            <p className="text-slate-400 text-sm mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {properties.map((p) => <PropertyCard key={p.id} property={p} />)}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                <button
                  disabled={filters.page <= 1}
                  onClick={() => setFilters(p => ({ ...p, page: p.page - 1 }))}
                  className="flex items-center gap-1 px-4 py-2 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" /> Prev
                </button>
                <span className="text-sm text-slate-600 px-2">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  disabled={filters.page >= pagination.totalPages}
                  onClick={() => setFilters(p => ({ ...p, page: p.page + 1 }))}
                  className="flex items-center gap-1 px-4 py-2 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
