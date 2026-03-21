"use client";

import { useState, useEffect, useCallback, useRef } from "react";

const fmt = (n) => new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n || 0);
const fmtCurrency = (n) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n || 0);

function Loader() {
  return (
    <div className="flex items-center justify-center py-20 gap-2">
      <div className="w-2.5 h-2.5 rounded-full bg-brand-500 loader-dot" />
      <div className="w-2.5 h-2.5 rounded-full bg-brand-500 loader-dot" />
      <div className="w-2.5 h-2.5 rounded-full bg-brand-500 loader-dot" />
    </div>
  );
}

// ─── Login ───
function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Login failed");
      onLogin();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-stone-50 via-orange-50/30 to-stone-100 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl brand-gradient shadow-lg shadow-brand-500/25 mb-4">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="font-display text-2xl text-stone-800">Triveni Supermart</h1>
          <p className="text-stone-500 text-sm mt-1">Loyalty Points Admin</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-stone-100 p-6 space-y-4">
          {error && <div className="bg-red-50 text-red-600 text-sm rounded-lg px-4 py-2.5 border border-red-100">{error}</div>}
          <div>
            <label className="block text-xs font-medium text-stone-500 uppercase tracking-wider mb-1.5">Username</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm bg-stone-50/50" placeholder="admin" required />
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-500 uppercase tracking-wider mb-1.5">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm bg-stone-50/50" placeholder="••••••••" required />
          </div>
          <button type="submit" disabled={loading} className="w-full brand-gradient text-white font-medium py-2.5 rounded-xl shadow-sm shadow-brand-500/20 hover:shadow-md transition-all disabled:opacity-60">
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
        <p className="text-center text-xs text-stone-400 mt-4">Default: admin / admin123</p>
      </div>
    </div>
  );
}

// ─── Stat Card ───
function StatCard({ label, value, sub, icon, accent }) {
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-medium text-stone-400 uppercase tracking-wider">{label}</span>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${accent || "bg-brand-50 text-brand-600"}`}>{icon}</div>
      </div>
      <div className="font-display text-2xl text-stone-800">{value}</div>
      {sub && <div className="text-xs text-stone-400 mt-1">{sub}</div>}
    </div>
  );
}

// ─── Customer Modal ───
function CustomerModal({ customerId, onClose, onRedeem }) {
  const [customer, setCustomer] = useState(null);
  const [redemptions, setRedemptions] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [redeemMode, setRedeemMode] = useState(false);
  const [redeemPoints, setRedeemPoints] = useState("");
  const [redeemNote, setRedeemNote] = useState("");
  const [redeeming, setRedeeming] = useState(false);
  const [redeemError, setRedeemError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/customers/${customerId}`);
        const data = await res.json();
        setCustomer(data.customer);
        setRedemptions(data.redemptions || []);
        setInvoices(data.invoices || []);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    })();
  }, [customerId]);

  const handleRedeem = async () => {
    const pts = parseInt(redeemPoints);
    if (!pts || pts <= 0) return;
    setRedeeming(true);
    setRedeemError("");
    try {
      const res = await fetch(`/api/customers/${customerId}/redeem`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ points: pts, note: redeemNote }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCustomer((prev) => ({
        ...prev,
        redeemed_points: data.customer.redeemed_points,
        available_points: data.customer.available_points,
        redemption_value: (customer.total_sales * 0.01).toFixed(2),
      }));
      setRedemptions((prev) => [
        { points: pts, rupee_value: (pts * 0.04).toFixed(2), note: redeemNote, redeemed_at: new Date().toISOString() },
        ...prev,
      ]);
      setRedeemMode(false);
      setRedeemPoints("");
      setRedeemNote("");
      if (onRedeem) onRedeem();
    } catch (err) { setRedeemError(err.message); }
    finally { setRedeeming(false); }
  };

  if (loading) return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-white rounded-2xl p-8" onClick={(e) => e.stopPropagation()}><Loader /></div>
    </div>
  );
  if (!customer) return null;

  const available = customer.available_points || 0;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[85vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="brand-gradient p-6 rounded-t-2xl text-white relative">
          <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
          <h3 className="font-display text-xl">{customer.name}</h3>
          <p className="text-white/70 text-sm mt-0.5">{customer.phone}</p>
          <div className="mt-4 flex gap-6">
            <div>
              <div className="text-white/60 text-xs uppercase tracking-wider">Available Points</div>
              <div className="text-2xl font-bold">{fmt(available)}</div>
            </div>
            <div>
              <div className="text-white/60 text-xs uppercase tracking-wider">Worth</div>
              <div className="text-2xl font-bold">{fmtCurrency(customer.total_sales * 0.01)}</div>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-stone-50 rounded-xl p-3 text-center">
              <div className="text-xs text-stone-400">Total Sales</div>
              <div className="font-semibold text-stone-700 text-sm mt-0.5">{fmtCurrency(customer.total_sales)}</div>
            </div>
            <div className="bg-stone-50 rounded-xl p-3 text-center">
              <div className="text-xs text-stone-400">Earned</div>
              <div className="font-semibold text-stone-700 text-sm mt-0.5">{fmt(customer.total_points)}</div>
            </div>
            <div className="bg-stone-50 rounded-xl p-3 text-center">
              <div className="text-xs text-stone-400">Redeemed</div>
              <div className="font-semibold text-stone-700 text-sm mt-0.5">{fmt(customer.redeemed_points)}</div>
            </div>
          </div>

          {/* Redeem */}
          {!redeemMode ? (
            <button onClick={() => setRedeemMode(true)} disabled={available <= 0}
              className="w-full py-2.5 rounded-xl font-medium text-sm bg-brand-500 text-white hover:bg-brand-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm">
              Redeem Points
            </button>
          ) : (
            <div className="bg-orange-50 rounded-xl p-4 border border-orange-100 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm text-stone-700">Redeem Points</span>
                <button onClick={() => { setRedeemMode(false); setRedeemError(""); }} className="text-xs text-stone-400 hover:text-stone-600">Cancel</button>
              </div>
              {redeemError && <div className="text-red-600 text-xs bg-red-50 rounded-lg px-3 py-2">{redeemError}</div>}
              <div>
                <input type="number" value={redeemPoints} onChange={(e) => setRedeemPoints(e.target.value)}
                  placeholder={`Max ${fmt(available)} points`} max={available} min={1}
                  className="w-full border border-orange-200 rounded-lg px-3 py-2 text-sm bg-white" />
                {redeemPoints && parseInt(redeemPoints) > 0 && (
                  <div className="text-xs text-stone-500 mt-1">= {fmtCurrency(parseInt(redeemPoints) * 0.04)} discount</div>
                )}
              </div>
              <input type="text" value={redeemNote} onChange={(e) => setRedeemNote(e.target.value)}
                placeholder="Note (optional)" className="w-full border border-orange-200 rounded-lg px-3 py-2 text-sm bg-white" />
              <button onClick={handleRedeem} disabled={redeeming || !redeemPoints || parseInt(redeemPoints) <= 0}
                className="w-full py-2 rounded-lg font-medium text-sm bg-brand-600 text-white hover:bg-brand-700 transition-colors disabled:opacity-40">
                {redeeming ? "Processing..." : "Confirm Redemption"}
              </button>
            </div>
          )}

          {/* Redemption history */}
          {redemptions.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-stone-400 uppercase tracking-wider mb-2">Redemption History</h4>
              <div className="space-y-2">
                {redemptions.map((r, i) => (
                  <div key={i} className="flex items-center justify-between bg-stone-50 rounded-lg px-3 py-2 text-sm">
                    <div>
                      <span className="font-medium text-stone-700">-{fmt(r.points)} pts</span>
                      <span className="text-stone-400 ml-2">({fmtCurrency(parseFloat(r.rupee_value))})</span>
                      {r.note && <span className="text-stone-400 ml-2 text-xs">— {r.note}</span>}
                    </div>
                    <span className="text-xs text-stone-400">{new Date(r.redeemed_at).toLocaleDateString("en-IN")}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Invoices from sync */}
          {invoices.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-stone-400 uppercase tracking-wider mb-2">Recent Transactions (from Sync)</h4>
              <div className="space-y-1.5 max-h-40 overflow-auto">
                {invoices.map((inv, i) => (
                  <div key={i} className="flex items-center justify-between text-sm px-3 py-1.5 bg-stone-50 rounded-lg">
                    <span className="text-stone-600">{inv.invoice_number}</span>
                    <span className="text-stone-500">{inv.invoice_date}</span>
                    <span className="font-medium text-stone-700">{fmtCurrency(inv.total)}</span>
                    <span className="text-brand-600 text-xs">+{fmt(inv.points)} pts</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Dashboard ───
function Dashboard({ onLogout }) {
  const [stats, setStats] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [sortBy, setSortBy] = useState("total_points");
  const [sortOrder, setSortOrder] = useState("desc");
  const [page, setPage] = useState(1);
  const searchTimer = useRef(null);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/stats");
      if (res.ok) setStats(await res.json());
    } catch (err) { console.error(err); }
  }, []);

  const fetchCustomers = useCallback(async () => {
    try {
      const params = new URLSearchParams({ search, page: page.toString(), limit: "25", sort: sortBy, order: sortOrder });
      const res = await fetch(`/api/customers?${params}`);
      if (res.ok) {
        const data = await res.json();
        setCustomers(data.customers);
        setPagination(data.pagination);
      }
    } catch (err) { console.error(err); }
  }, [search, page, sortBy, sortOrder]);

  useEffect(() => {
    Promise.all([fetchStats(), fetchCustomers()]).then(() => setLoading(false));
  }, [fetchStats, fetchCustomers]);

  const handleSearchInput = (val) => {
    setSearchInput(val);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => { setSearch(val); setPage(1); }, 400);
  };

  const handleSort = (col) => {
    if (sortBy === col) setSortOrder((o) => (o === "desc" ? "asc" : "desc"));
    else { setSortBy(col); setSortOrder("desc"); }
    setPage(1);
  };

  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch("/api/sync", { credentials: "include" });
      const text = await res.text();
      try {
        setSyncResult(JSON.parse(text));
      } catch {
        setSyncResult({ error: text.slice(0, 200) });
      }
      fetchStats();
      fetchCustomers();
    } catch (err) { setSyncResult({ error: err.message }); }
    finally { setSyncing(false); }
  };

  const SortIcon = ({ col }) => {
    if (sortBy !== col) return <span className="text-stone-300 ml-1">↕</span>;
    return <span className="text-brand-500 ml-1">{sortOrder === "desc" ? "↓" : "↑"}</span>;
  };

  if (loading) return <Loader />;
  const o = stats?.overview || {};

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-orange-50/20 to-stone-50">
      {/* Header */}
      <header className="brand-gradient">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div>
              <h1 className="text-white font-display text-lg leading-tight">Triveni Supermart</h1>
              <p className="text-white/60 text-xs">Loyalty Dashboard</p>
            </div>
          </div>
          <button onClick={onLogout} className="text-white/60 hover:text-white text-sm flex items-center gap-1.5 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Customers" value={fmt(o.total_customers)} sub={`${fmt(o.total_invoices)} invoices`}
            icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>} />
          <StatCard label="Total Sales" value={fmtCurrency(o.total_sales)} sub={`Avg ${fmtCurrency(o.avg_sales)}/customer`} accent="bg-emerald-50 text-emerald-600"
            icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" /></svg>} />
          <StatCard label="Points Outstanding" value={fmt(o.available_points)} sub={`Worth ${fmtCurrency(o.redemption_value)}`} accent="bg-amber-50 text-amber-600"
            icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>} />
          <StatCard label="Points Redeemed" value={fmt(o.total_redeemed)} sub={`${fmtCurrency(o.total_redeemed * 0.04)} given back`} accent="bg-violet-50 text-violet-600"
            icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
        </div>

        {/* Sync button */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <button onClick={handleSync} disabled={syncing}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-white border border-stone-200 text-stone-600 hover:bg-stone-50 transition-colors disabled:opacity-50">
            <svg className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {syncing ? "Syncing from Zoho..." : "Sync from Zoho POS"}
          </button>
          {syncResult && (
            <div className={`text-xs px-3 py-1.5 rounded-lg ${syncResult.error ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"}`}>
              {syncResult.error || syncResult.message || `Synced ${syncResult.newInvoices || 0} new invoices (${syncResult.dateFrom} → ${syncResult.dateTo})`}
            </div>
          )}
        </div>

        {/* Customers table */}
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-stone-100 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <h2 className="font-display text-lg text-stone-800">Customers</h2>
            <div className="relative w-full sm:w-72">
              <svg className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input type="text" value={searchInput} onChange={(e) => handleSearchInput(e.target.value)}
                placeholder="Search by name or phone..." className="w-full pl-10 pr-4 py-2 rounded-xl border border-stone-200 text-sm bg-stone-50/50" />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-stone-50/80">
                  <th className="text-left px-4 py-3 font-medium text-stone-500 text-xs uppercase tracking-wider">Customer</th>
                  <th className="text-left px-4 py-3 font-medium text-stone-500 text-xs uppercase tracking-wider hidden sm:table-cell">Phone</th>
                  <th className="text-right px-4 py-3 font-medium text-stone-500 text-xs uppercase tracking-wider cursor-pointer select-none" onClick={() => handleSort("total_sales")}>
                    Sales <SortIcon col="total_sales" />
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-stone-500 text-xs uppercase tracking-wider cursor-pointer select-none" onClick={() => handleSort("total_points")}>
                    Earned <SortIcon col="total_points" />
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-stone-500 text-xs uppercase tracking-wider hidden md:table-cell">Redeemed</th>
                  <th className="text-right px-4 py-3 font-medium text-stone-500 text-xs uppercase tracking-wider cursor-pointer select-none" onClick={() => handleSort("available_points")}>
                    Available <SortIcon col="available_points" />
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-stone-500 text-xs uppercase tracking-wider hidden lg:table-cell">Worth</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {customers.map((c) => (
                  <tr key={c._id} onClick={() => setSelectedCustomer(c._id)} className="table-row-hover cursor-pointer transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-stone-700">{c.name}</div>
                      <div className="text-xs text-stone-400 sm:hidden">{c.phone}</div>
                    </td>
                    <td className="px-4 py-3 text-stone-500 hidden sm:table-cell">{c.phone}</td>
                    <td className="px-4 py-3 text-right text-stone-600">{fmtCurrency(c.total_sales)}</td>
                    <td className="px-4 py-3 text-right text-stone-600">{fmt(c.total_points)}</td>
                    <td className="px-4 py-3 text-right text-stone-500 hidden md:table-cell">{fmt(c.redeemed_points)}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-brand-50 text-brand-700">{fmt(c.available_points)}</span>
                    </td>
                    <td className="px-4 py-3 text-right text-stone-500 hidden lg:table-cell">{fmtCurrency(c.redemption_value)}</td>
                  </tr>
                ))}
                {customers.length === 0 && (
                  <tr><td colSpan={7} className="text-center py-12 text-stone-400">
                    {search ? "No customers found" : "No customer data in database"}
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>

          {pagination.pages > 1 && (
            <div className="px-4 py-3 border-t border-stone-100 flex items-center justify-between text-sm">
              <span className="text-stone-400">{fmt(pagination.total)} customers • Page {pagination.page} of {pagination.pages}</span>
              <div className="flex gap-1">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                  className="px-3 py-1 rounded-lg bg-stone-100 text-stone-600 hover:bg-stone-200 disabled:opacity-40 transition-colors">← Prev</button>
                <button onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))} disabled={page >= pagination.pages}
                  className="px-3 py-1 rounded-lg bg-stone-100 text-stone-600 hover:bg-stone-200 disabled:opacity-40 transition-colors">Next →</button>
              </div>
            </div>
          )}
        </div>

        {/* Recent redemptions */}
        {stats?.recent_redemptions?.length > 0 && (
          <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-4">
            <h3 className="text-xs font-medium text-stone-400 uppercase tracking-wider mb-3">Recent Redemptions</h3>
            <div className="space-y-1.5">
              {stats.recent_redemptions.map((r, i) => (
                <div key={i} className="flex items-center justify-between text-sm text-stone-500 bg-stone-50 rounded-lg px-3 py-2">
                  <span className="font-medium text-stone-700">{r.customer_name}</span>
                  <span>-{fmt(r.points)} pts ({fmtCurrency(r.rupee_value)})</span>
                  <span className="text-xs text-stone-400">{new Date(r.redeemed_at).toLocaleString("en-IN")}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sync log */}
        {stats?.recent_syncs?.length > 0 && (
          <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-4">
            <h3 className="text-xs font-medium text-stone-400 uppercase tracking-wider mb-3">Sync History</h3>
            <div className="space-y-1.5">
              {stats.recent_syncs.map((s, i) => (
                <div key={i} className="flex items-center justify-between text-sm text-stone-500 bg-stone-50 rounded-lg px-3 py-2">
                  <span>{new Date(s.timestamp).toLocaleString("en-IN")}</span>
                  <span className={s.status === "success" ? "text-emerald-600" : "text-red-500"}>
                    {s.status === "success" ? `${s.new_invoices || 0} new invoices` : `Error`}
                  </span>
                  {s.sync_date_from && <span className="text-xs text-stone-400">{s.sync_date_from} → {s.sync_date_to}</span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {selectedCustomer && (
        <CustomerModal customerId={selectedCustomer} onClose={() => setSelectedCustomer(null)}
          onRedeem={() => { fetchStats(); fetchCustomers(); }} />
      )}
    </div>
  );
}

// ─── App Root ───
export default function Home() {
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    fetch("/api/stats").then((res) => { if (res.ok) setAuthed(true); }).finally(() => setChecking(false));
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth", { method: "DELETE" });
    setAuthed(false);
  };

  if (checking) return <Loader />;
  if (!authed) return <LoginScreen onLogin={() => setAuthed(true)} />;
  return <Dashboard onLogout={handleLogout} />;
}
