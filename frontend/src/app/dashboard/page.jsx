"use client";
// frontend/src/app/dashboard/page.jsx
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../context/AuthContext";
import { Home, PlusCircle, Search, LogOut, User, ChevronRight, Building2, TrendingUp } from "lucide-react";

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-100 shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Home className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-800">
              Nest<span className="text-indigo-600">Find</span>
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-indigo-600" />
              </div>
              <span className="font-medium hidden sm:block">{user?.name}</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-red-500 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-50"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:block">Logout</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="max-w-6xl mx-auto px-4 pt-12 pb-6">
        <div className="mb-2 text-indigo-600 font-medium text-sm">Welcome back 👋</div>
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-800 mb-2">
          Hello, {user?.name?.split(" ")[0]}!
        </h1>
        <p className="text-slate-500 text-lg">What would you like to do today?</p>
      </div>

      {/* Main Action Cards */}
      <div className="max-w-6xl mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {/* BUY Card */}
          <button
            onClick={() => router.push("/properties")}
            className="group bg-white rounded-2xl shadow-md shadow-slate-100 border border-slate-100 p-8 text-left hover:shadow-xl hover:shadow-indigo-100 hover:border-indigo-200 transition-all duration-300 hover:-translate-y-1"
          >
            <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-indigo-100 transition-colors">
              <Search className="w-7 h-7 text-indigo-600" />
            </div>
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Buy / Rent</h2>
                <p className="text-slate-500 text-sm leading-relaxed">
                  Browse thousands of verified properties. Filter by city, budget, type and more.
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all mt-1 flex-shrink-0" />
            </div>
            <div className="mt-5 flex gap-2 flex-wrap">
              {["Apartments", "Villas", "Plots", "PG"].map((tag) => (
                <span key={tag} className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs font-medium rounded-lg">
                  {tag}
                </span>
              ))}
            </div>
          </button>

          {/* SELL Card */}
          <button
            onClick={() => router.push("/properties/create")}
            className="group bg-white rounded-2xl shadow-md shadow-slate-100 border border-slate-100 p-8 text-left hover:shadow-xl hover:shadow-emerald-100 hover:border-emerald-200 transition-all duration-300 hover:-translate-y-1"
          >
            <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-emerald-100 transition-colors">
              <PlusCircle className="w-7 h-7 text-emerald-600" />
            </div>
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Sell / Rent Out</h2>
                <p className="text-slate-500 text-sm leading-relaxed">
                  List your property for free. Reach thousands of potential buyers and renters instantly.
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all mt-1 flex-shrink-0" />
            </div>
            <div className="mt-5 flex gap-2 flex-wrap">
              {["Free Listing", "Verified Buyers", "Fast Response", "Secure"].map((tag) => (
                <span key={tag} className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-lg">
                  {tag}
                </span>
              ))}
            </div>
          </button>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { icon: Building2, label: "Active Listings", value: "50,000+", color: "text-indigo-600 bg-indigo-50" },
            { icon: User, label: "Verified Users", value: "10,000+", color: "text-emerald-600 bg-emerald-50" },
            { icon: TrendingUp, label: "Cities Covered", value: "100+", color: "text-amber-600 bg-amber-50" },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm text-center">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mx-auto mb-2 ${color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="text-lg font-bold text-slate-800">{value}</div>
              <div className="text-xs text-slate-500 mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
