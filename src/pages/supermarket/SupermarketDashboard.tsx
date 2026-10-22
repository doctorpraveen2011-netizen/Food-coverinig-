import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { getStoredSupermarketDashboard } from '../../data/mockDatabase';
import { getBackendUrl, createSafeSocket } from '../../utils/apiConfig';
import { 
  Store, 
  Package, 
  AlertTriangle, 
  Gift, 
  ShieldAlert, 
  Scan, 
  Plus, 
  CheckCircle2, 
  TrendingUp, 
  Clock, 
  ArrowRight,
  Flame,
  Radio,
  Sparkles,
  MapPin,
  Receipt,
  Barcode
} from 'lucide-react';
import { useAnalysisStore, type AnalyzedFood } from '../../store/useAnalysisStore';

export default function SupermarketDashboard() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const localScans = useAnalysisStore((state) => state.history);

  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [incomingAlert, setIncomingAlert] = useState<{ id: string; productName: string; priority: string; seller?: string } | null>(null);

  useEffect(() => {
    const fetchSupermarketDashboard = async () => {
      const backendUrl = getBackendUrl();
      if (backendUrl) {
        try {
          const res = await fetch(`${backendUrl}/api/supermarket/dashboard`, {
            headers: { Authorization: `Bearer ${token}` },
            signal: AbortSignal.timeout(2500)
          });
          if (res.ok) {
            const data = await res.json();
            setDashboardData(data);
            setLoading(false);
            return;
          }
        } catch (err) {
          // Fall through to offline fallback
        }
      }

      // Offline / Public Fallback: load supermarket data from mockDatabase
      const fallback = getStoredSupermarketDashboard(user?.supermarketId || 'sm-001');
      setDashboardData(fallback);
      setLoading(false);
    };
    fetchSupermarketDashboard();

    const socket = createSafeSocket();
    if (!socket) return;

    socket.on('newComplaint', (complaint: any) => {
      const currentSmId = user?.supermarketId || 'sm-001';
      const isForThisStore = complaint.supermarketId === currentSmId || 
        (complaint.seller && complaint.seller.toLowerCase().includes('freshmart'));
      
      if (isForThisStore) {
        setIncomingAlert({
          id: complaint.id,
          productName: complaint.productName,
          priority: complaint.priority,
          seller: complaint.seller
        });

        setDashboardData((prev: any) => {
          if (!prev) return prev;
          const filtered = (prev.recentComplaints || []).filter((c: any) => c.id !== complaint.id);
          return {
            ...prev,
            stats: {
              ...prev.stats,
              activeComplaints: (prev.stats?.activeComplaints || 0) + 1
            },
            recentComplaints: [complaint, ...filtered].slice(0, 5)
          };
        });
      }
    });

    socket.on('supermarketComplaintUpdate', (updated: any) => {
      setDashboardData((prev: any) => {
        if (!prev) return prev;
        const currentList = prev.recentComplaints || [];
        const exists = currentList.some((c: any) => c.id === updated.id);
        const updatedList = exists 
          ? currentList.map((c: any) => c.id === updated.id ? { ...c, ...updated } : c)
          : [updated, ...currentList].slice(0, 5);
        return {
          ...prev,
          recentComplaints: updatedList
        };
      });
    });

    socket.on('customerRefundIssued', (refund: any) => {
      setDashboardData((prev: any) => {
        if (!prev) return prev;
        const currentList = prev.recentComplaints || [];
        const updatedList = currentList.map((c: any) => {
          if (c.id === refund.complaintId) {
            return {
              ...c,
              status: 'Resolved',
              refundStatus: 'Refunded',
              refundAmount: refund.amount,
              refundMethod: refund.method,
              refundTransactionId: refund.refId
            };
          }
          return c;
        });
        return {
          ...prev,
          recentComplaints: updatedList
        };
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [token, user?.supermarketId]);

  const stats = dashboardData?.stats;
  const supermarket = dashboardData?.supermarket;
  const criticalAlerts = dashboardData?.criticalAlerts || [];

  return (
    <div className="space-y-6">
      {/* Live Incoming Alert Banner */}
      {incomingAlert && (
        <div className="bg-gradient-to-r from-red-500 via-rose-500 to-amber-500 p-0.5 rounded-2xl shadow-lg animate-in slide-in-from-top duration-300">
          <div className="bg-white p-4 rounded-[14px] flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0 animate-pulse">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-red-600 bg-red-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping"></span>
                    LIVE CUSTOMER FOOD REPORT
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-800">{incomingAlert.id}</span>
                </div>
                <p className="text-xs font-semibold text-slate-900 mt-1">
                  Customer reported: <strong className="text-rose-600">{incomingAlert.productName}</strong> ({incomingAlert.priority} Priority)
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/supermarket/complaints')}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <span>View & Respond</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIncomingAlert(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Header Store Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center font-bold text-xl shrink-0 shadow-2xs">
            <Store className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">
                {supermarket?.name || 'Supermarket Official Portal'}
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-100 text-blue-800">
                {supermarket?.code || 'STORE-01'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Store Lead: <strong className="text-slate-800">{user?.fullName}</strong> • Branch: {user?.branch?.name || 'Main Branch'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => navigate('/supermarket/inventory')}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Inventory</span>
          </button>
          <button
            onClick={() => navigate('/supermarket/ai-scan')}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Scan className="w-4 h-4 text-emerald-400" />
            <span>AI Food & Waste Scan</span>
          </button>
          <button
            onClick={() => navigate('/supermarket/donations')}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Gift className="w-4 h-4" />
            <span>Surplus Donation</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-medium text-slate-500 block mb-1">Monitored Items</span>
          <p className="text-2xl font-bold text-slate-900">{loading ? '...' : stats?.totalMonitored ?? 0}</p>
          <span className="text-[10px] text-slate-400">Total batches</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-medium text-emerald-700 block mb-1">Fresh Inventory</span>
          <p className="text-2xl font-bold text-emerald-600">{loading ? '...' : stats?.freshCount ?? 0}</p>
          <span className="text-[10px] text-emerald-600 font-medium">Safe for sale</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-medium text-amber-700 block mb-1">Near-Expiry</span>
          <p className="text-2xl font-bold text-amber-600">{loading ? '...' : stats?.nearExpiryCount ?? 0}</p>
          <span className="text-[10px] text-amber-600 font-medium">Donate / Discount</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-medium text-red-700 block mb-1">Spoiled Food</span>
          <p className="text-2xl font-bold text-red-600">{loading ? '...' : stats?.spoiledCount ?? 0}</p>
          <span className="text-[10px] text-red-600 font-medium">Quarantined</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-medium text-blue-700 block mb-1">Surplus Pickups</span>
          <p className="text-2xl font-bold text-blue-600">{loading ? '...' : stats?.pendingDonations ?? 0}</p>
          <span className="text-[10px] text-blue-600 font-medium">Awaiting volunteer</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-medium text-purple-700 block mb-1">Store Complaints</span>
          <p className="text-2xl font-bold text-purple-600">{loading ? '...' : stats?.activeComplaints ?? 0}</p>
          <span className="text-[10px] text-purple-600 font-medium">Active cases</span>
        </div>
      </div>

      {/* Critical Expiry & At-Risk Items Alert Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <h2 className="text-sm font-bold text-slate-900">Urgent Attention: Near-Expiry & Quarantined Batches</h2>
          </div>
          <Link to="/supermarket/inventory" className="text-xs font-semibold text-emerald-600 hover:text-emerald-700">
            Open Full Inventory →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200/80">
                <th className="py-2.5 px-3">Batch / Item</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Stock Qty</th>
                <th className="py-2.5 px-3">Expiry Date</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Recommended Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {criticalAlerts.length > 0 ? (
                criticalAlerts.map((item: any) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3 font-semibold text-slate-900">
                      <div>{item.name}</div>
                      <span className="text-[10px] text-slate-400 font-mono font-normal">Batch: {item.batchNumber}</span>
                    </td>
                    <td className="py-3 px-3 text-slate-600">{item.category}</td>
                    <td className="py-3 px-3 font-semibold text-slate-800">{item.quantity} {item.unit}</td>
                    <td className="py-3 px-3 text-slate-600 font-mono">{item.expiryDate}</td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        item.freshnessStatus === 'Near-Expiry' ? 'bg-amber-100 text-amber-800' :
                        item.freshnessStatus === 'Spoiled' ? 'bg-red-100 text-red-800' :
                        'bg-emerald-100 text-emerald-800'
                      }`}>
                        {item.freshnessStatus}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      {item.freshnessStatus === 'Near-Expiry' ? (
                        <button
                          onClick={() => navigate('/supermarket/donations')}
                          className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold rounded-lg transition-colors inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Gift className="w-3 h-3" />
                          <span>Queue for Donation</span>
                        </button>
                      ) : (
                        <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded">
                          Move to Bio-Waste
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-xs text-slate-400">
                    No critical near-expiry or spoiled items right now. Inventory is in prime condition.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Connected AI Quality Audits & Citizen Scans Stream */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 mb-4 gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <Scan className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>Live Store AI Quality Audits & Citizen Scans Stream</span>
                <span className="text-[10px] font-extrabold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                  {localScans.length} Scans Logged
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Connected AI vision stream tracking store landmark receipts, batch barcodes, and waste classification.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/supermarket/ai-scan')}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>New AI Food/Waste Scan</span>
          </button>
        </div>

        {localScans.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
            {localScans.slice(0, 4).map((scan: AnalyzedFood) => {
              const isSp = scan.freshness === 'Spoiled' || scan.risk === 'High';
              const isMod = scan.freshness === 'Moderate' || scan.risk === 'Medium';
              return (
                <div key={scan.id} className="p-3.5 rounded-2xl border border-slate-200/80 bg-slate-50/60 hover:bg-white hover:shadow-xs transition-all flex flex-col justify-between">
                  <div>
                    {scan.imageUrl ? (
                      <div className="w-full h-24 rounded-xl overflow-hidden bg-slate-900 mb-2 relative">
                        <img src={scan.imageUrl} alt={scan.food} className="w-full h-full object-cover" />
                        <span className={`absolute top-1.5 left-1.5 px-2 py-0.5 rounded-full text-[9px] font-extrabold ${
                          isSp ? 'bg-rose-100 text-rose-800' : isMod ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {scan.freshness}
                        </span>
                        {scan.wasteStream && (
                          <span className="absolute top-1.5 right-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-900/80 text-white backdrop-blur-md">
                            {scan.wasteStream}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center justify-between mb-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                          isSp ? 'bg-rose-100 text-rose-800' : isMod ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {scan.freshness}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono font-bold">{scan.confidence}</span>
                      </div>
                    )}

                    <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{scan.food}</h4>
                    
                    {scan.purchaseLandmark && (
                      <div className="mt-1 flex items-center gap-1 text-[10px] text-blue-700 font-semibold truncate">
                        <MapPin className="w-3 h-3 text-blue-500 shrink-0" />
                        <span className="truncate">{scan.purchaseLandmark}</span>
                      </div>
                    )}

                    <div className="mt-1 flex items-center justify-between text-[9px] font-mono text-slate-500">
                      <span>🧾 {scan.billNumber || 'BILL-AUTO'}</span>
                      {scan.barcode && <span>🏷️ {scan.barcode.slice(-6)}</span>}
                    </div>

                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {scan.recommendation || 'Scanned and verified through FoodCovering deep learning engine.'}
                    </p>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">Shelf: {scan.shelfLife || 'Active'}</span>
                    {isSp ? (
                      <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
                        Flagged for Quarantine
                      </span>
                    ) : (
                      <button
                        onClick={() => navigate('/supermarket/donations')}
                        className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 cursor-pointer flex items-center gap-1"
                      >
                        <Gift className="w-3 h-3" />
                        <span>Accept Surplus</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <Scan className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-700">No Store AI Scans In Stream Yet</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Scans made by citizens or store staff with this supermarket's landmark appear here automatically.</p>
            <button
              onClick={() => navigate('/supermarket/ai-scan')}
              className="mt-3 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Launch Store AI Scanner</span>
            </button>
          </div>
        )}
      </div>

      {/* Two columns: Store Surplus Donations & Store Complaints */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Store Surplus Donations */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Commercial Surplus Donations</h2>
              <p className="text-xs text-slate-500">Scheduled charity pickups from store loading dock</p>
            </div>
            <Link to="/supermarket/donations" className="text-xs font-semibold text-blue-600 hover:text-blue-700">
              Manage All →
            </Link>
          </div>

          <div className="space-y-3">
            {dashboardData?.recentDonations?.length ? (
              dashboardData.recentDonations.map((d: any) => (
                <div key={d.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-900">{d.foodItems}</p>
                    <p className="text-[11px] text-slate-500">
                      Qty: {d.quantity} • Volunteer: {d.volunteer || 'Assigning...'} •{' '}
                      <span className="font-semibold text-emerald-700">+{d.creditPoints || 125} pts</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      d.status === 'Delivered' ? 'bg-emerald-100 text-emerald-800' :
                      d.status === 'In Transit' ? 'bg-blue-100 text-blue-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {d.status}
                    </span>
                    <p className="text-[10px] text-slate-400 mt-1">{d.date}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-xs text-slate-400">No surplus donations logged yet.</div>
            )}
          </div>
        </div>

        {/* Complaints filed against this Store */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Store Incident Inquiries</h2>
              <p className="text-xs text-slate-500">Customer reports filed against this branch</p>
            </div>
            <Link to="/supermarket/complaints" className="text-xs font-semibold text-purple-600 hover:text-purple-700">
              View All Inquiries →
            </Link>
          </div>

          <div className="space-y-3">
            {dashboardData?.recentComplaints?.length ? (
              dashboardData.recentComplaints.map((c: any) => (
                <div key={c.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-900">{c.productName}</p>
                    <p className="text-[11px] text-slate-500">Ref: {c.id} • Priority: {c.priority}</p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      c.status === 'Resolved' ? 'bg-emerald-100 text-emerald-800' :
                      c.status === 'Under Investigation' ? 'bg-amber-100 text-amber-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {c.status}
                    </span>
                    {c.refundStatus === 'Refunded' && (
                      <span className="block mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        💸 Refunded: ₹{c.refundAmount || 150}
                      </span>
                    )}
                    <Link
                      to="/supermarket/complaints"
                      className="block text-[10px] font-bold text-blue-600 hover:underline mt-1"
                    >
                      {c.refundStatus === 'Refunded' ? 'View Settlement →' : 'Respond / Refund →'}
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-xs text-slate-400">No active complaints filed against this branch!</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
