import { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { 
  Building2, 
  Plus, 
  UserPlus, 
  Store, 
  CheckCircle2, 
  AlertCircle, 
  MapPin, 
  Phone, 
  Mail, 
  ShieldCheck,
  TrendingUp,
  BarChart2
} from 'lucide-react';

export default function AdminSupermarkets() {
  const token = useAuthStore((state) => state.token);

  const [supermarkets, setSupermarkets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [smModalOpen, setSmModalOpen] = useState(false);
  const [officialModalOpen, setOfficialModalOpen] = useState(false);
  const [selectedSmId, setSelectedSmId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // New Supermarket Form
  const [smName, setSmName] = useState('');
  const [smCode, setSmCode] = useState('');
  const [smPhone, setSmPhone] = useState('');
  const [smEmail, setSmEmail] = useState('');
  const [smAddress, setSmAddress] = useState('');
  const [smCity, setSmCity] = useState('New Delhi');
  const [smRegion, setSmRegion] = useState('North Zone');
  const [branchName, setBranchName] = useState('');
  const [managerName, setManagerName] = useState('');

  // New Official Account Form
  const [offFullName, setOffFullName] = useState('');
  const [offEmail, setOffEmail] = useState('');
  const [offUsername, setOffUsername] = useState('');
  const [offPassword, setOffPassword] = useState('');
  const [offPhone, setOffPhone] = useState('');

  const fetchSupermarkets = async () => {
    try {
      const backendUrl = window.location.hostname === 'localhost' ? 'http://localhost:5000' : `http://${window.location.hostname}:5000`;
      const res = await fetch(`${backendUrl}/api/admin/supermarkets`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSupermarkets(data.supermarkets || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSupermarkets();
  }, [token]);

  const handleCreateSupermarket = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      const backendUrl = window.location.hostname === 'localhost' ? 'http://localhost:5000' : `http://${window.location.hostname}:5000`;
      const res = await fetch(`${backendUrl}/api/admin/supermarkets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: smName,
          code: smCode,
          contactPhone: smPhone,
          contactEmail: smEmail,
          address: smAddress,
          city: smCity,
          region: smRegion,
          branchName,
          managerName
        })
      });

      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: `Registered new supermarket: ${smName} [${smCode}].` });
        setSmModalOpen(false);
        setSmName('');
        setSmCode('');
        fetchSupermarkets();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to register supermarket.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error registering supermarket.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleProvisionOfficial = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      const backendUrl = window.location.hostname === 'localhost' ? 'http://localhost:5000' : `http://${window.location.hostname}:5000`;
      const res = await fetch(`${backendUrl}/api/admin/supermarket-officials`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          fullName: offFullName,
          email: offEmail,
          username: offUsername,
          password: offPassword,
          phone: offPhone,
          supermarketId: selectedSmId
        })
      });

      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: `Supermarket official account provisioned for ${offFullName} (${offEmail}).` });
        setOfficialModalOpen(false);
        setOffFullName('');
        setOffEmail('');
        setOffPassword('');
        fetchSupermarkets();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to provision official account.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error provisioning account.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-emerald-600" />
            <span>Central Supermarket & Branch Management</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Authorize commercial retail partners, provision store officials, and monitor branch compliance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (supermarkets.length > 0) setSelectedSmId(supermarkets[0].id);
              setOfficialModalOpen(true);
            }}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Provision Official Account</span>
          </button>
          <button
            onClick={() => setSmModalOpen(true)}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Register Supermarket</span>
          </button>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-xl border text-xs font-medium flex items-center gap-2 ${
          message.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-red-600" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Supermarkets Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-3 bg-white p-8 rounded-2xl text-center text-xs text-slate-400">
            Loading registered supermarkets...
          </div>
        ) : (
          supermarkets.map((sm) => (
            <div key={sm.id} className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center font-bold text-sm">
                      <Store className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{sm.name}</h3>
                      <span className="text-[10px] text-blue-700 font-mono font-bold bg-blue-50 px-1.5 py-0.2 rounded">
                        {sm.code}
                      </span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    {sm.status}
                  </span>
                </div>

                <div className="mt-4 space-y-2 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{sm.address}, {sm.city} ({sm.region})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{sm.contactPhone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{sm.contactEmail}</span>
                  </div>
                </div>

                {/* Branches Preview */}
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <span className="text-[11px] font-bold text-slate-700 block mb-1.5">
                    Authorized Branches ({sm.branches?.length || 0}):
                  </span>
                  <div className="space-y-1">
                    {sm.branches?.map((b: any) => (
                      <div key={b.id} className="text-[11px] text-slate-600 bg-slate-50 p-1.5 rounded-lg border border-slate-100 flex items-center justify-between">
                        <span className="font-medium text-slate-800">{b.branchName}</span>
                        <span className="text-[10px] font-mono text-slate-400">{b.branchCode}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500 text-[11px]">
                  Officials: <strong className="text-slate-800">{sm.officialsCount || 0}</strong> • Batches: <strong className="text-slate-800">{sm.inventoryCount || 0}</strong>
                </span>
                <button
                  onClick={() => {
                    setSelectedSmId(sm.id);
                    setOfficialModalOpen(true);
                  }}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
                >
                  + Add Official
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Register Supermarket Modal */}
      {smModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-slate-900 mb-1">Register Supermarket Retail Partner</h3>
            <p className="text-xs text-slate-500 mb-4">
              Enter supermarket corporate details and initial flagship branch.
            </p>

            <form onSubmit={handleCreateSupermarket} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Supermarket Business Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Hypermarket Ltd"
                  value={smName}
                  onChange={(e) => setSmName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Store Code (Unique) *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. APEX-DEL"
                    value={smCode}
                    onChange={(e) => setSmCode(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">City *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. New Delhi"
                    value={smCity}
                    onChange={(e) => setSmCity(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Phone</label>
                  <input
                    type="tel"
                    placeholder="+91 98..."
                    value={smPhone}
                    onChange={(e) => setSmPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Email</label>
                  <input
                    type="email"
                    placeholder="corporate@apex.in"
                    value={smEmail}
                    onChange={(e) => setSmEmail(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Store Address</label>
                <input
                  type="text"
                  placeholder="Street / Market Address"
                  value={smAddress}
                  onChange={(e) => setSmAddress(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Initial Branch Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Central Market Branch"
                    value={branchName}
                    onChange={(e) => setBranchName(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Branch Manager</label>
                  <input
                    type="text"
                    placeholder="e.g. Rajesh Mehta"
                    value={managerName}
                    onChange={(e) => setManagerName(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSmModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl disabled:opacity-60"
                >
                  {submitting ? 'Registering...' : 'Register Supermarket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Provision Official Account Modal */}
      {officialModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-slate-900 mb-1">Provision Supermarket Official Account</h3>
            <p className="text-xs text-slate-500 mb-4">
              Securely create an authorized store lead account with SUPERMARKET_OFFICIAL privileges.
            </p>

            <form onSubmit={handleProvisionOfficial} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Supermarket *</label>
                <select
                  value={selectedSmId}
                  onChange={(e) => setSelectedSmId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white"
                >
                  {supermarkets.map(sm => (
                    <option key={sm.id} value={sm.id}>{sm.name} ({sm.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Official's Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vikram Joshi (Store Lead)"
                  value={offFullName}
                  onChange={(e) => setOffFullName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="official@store.com"
                    value={offEmail}
                    onChange={(e) => setOffEmail(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Username (Optional)</label>
                  <input
                    type="text"
                    placeholder="vikram_lead"
                    value={offUsername}
                    onChange={(e) => setOffUsername(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Initial Password *</label>
                  <input
                    type="password"
                    required
                    placeholder="Min 6 characters"
                    value={offPassword}
                    onChange={(e) => setOffPassword(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Phone</label>
                  <input
                    type="tel"
                    placeholder="+91 98..."
                    value={offPhone}
                    onChange={(e) => setOffPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setOfficialModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl disabled:opacity-60"
                >
                  {submitting ? 'Creating...' : 'Provision Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
