import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { io } from 'socket.io-client';
import { useAuthStore } from '../../store/useAuthStore';
import { getStoredSupermarketDashboard } from '../../data/mockDatabase';
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
  Radio
} from 'lucide-react';

export default function SupermarketDashboard() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);

  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [incomingAlert, setIncomingAlert] = useState<{ id: string; productName: string; priority: string; seller?: string } | null>(null);

  useEffect(() => {
    const fetchSupermarketDashboard = async () => {
      try {
        const backendUrl = window.location.hostname === 'localhost' ? 'http://localhost:5000' : `http://${window.location.hostname}:5000`;
        const res = await fetch(`${backendUrl}/api/supermarket/dashboard`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: AbortSignal.timeout(2500)
        });
        if (res.ok) {
          const data = await res.json();
          setDashboardData(data);
          return;
        }
        throw new Error('Server non-ok');
      } catch (err) {
        // Offline / Public Fallback: load supermarket data from mockDatabase
        const fallback = getStoredSupermarketDashboard(user?.supermarketId || 'sm-001');
        setDashboardData(fallback);
      } finally {
        setLoading(false);
      }
    };
    fetchSupermarketDashboard();

    const backendUrl = window.location.hostname === 'localhost' ? 'http://localhost:5000' : `http://${window.location.hostname}:5000`;
    const socket = io(backendUrl);

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
          <span className="text-[11px] font-medium text-red-700 block mb-1">Spoiled / Bio-Waste</span>
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
