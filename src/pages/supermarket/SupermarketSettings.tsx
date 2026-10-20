import { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { Store, ShieldCheck, Key, CheckCircle2, AlertCircle, Building2 } from 'lucide-react';

export default function SupermarketSettings() {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);

  const [settingsData, setSettingsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passSubmitting, setPassSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const backendUrl = window.location.hostname === 'localhost' ? 'http://localhost:5000' : `http://${window.location.hostname}:5000`;
        const res = await fetch(`${backendUrl}/api/supermarket/settings`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: AbortSignal.timeout(2000)
        });
        if (res.ok) {
          const data = await res.json();
          setSettingsData(data);
          return;
        }
        throw new Error('Server non-ok');
      } catch {
        // Offline fallback
        setSettingsData({
          user: user || {
            fullName: 'Rajesh Mehta',
            email: 'official@freshmart.com',
            phone: '+91 98222 33445',
            role: 'SUPERMARKET_OFFICIAL'
          },
          supermarket: {
            name: 'FreshMart Flagship Supermarkets',
            code: 'FM-01',
            address: 'Connaught Place, Central Delhi',
            city: 'New Delhi - 110001',
            contactPhone: '+91 98222 33445'
          },
          branches: [
            {
              id: 'br-01',
              branchName: 'Connaught Place Flagship Store',
              branchCode: 'FM-CP-01',
              address: 'Plot 14-B, Inner Circle, Connaught Place, New Delhi'
            },
            {
              id: 'br-02',
              branchName: 'South Extension Rapid Hub',
              branchCode: 'FM-SE-02',
              address: 'Main Ring Road, South Extension Part II, New Delhi'
            }
          ]
        });
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [token, user]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'New password must be at least 6 characters.' });
      return;
    }

    setPassSubmitting(true);
    setMessage(null);

    try {
      const backendUrl = window.location.hostname === 'localhost' ? 'http://localhost:5000' : `http://${window.location.hostname}:5000`;
      const res = await fetch(`${backendUrl}/api/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });

      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: 'Password changed successfully.' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to change password.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error updating password.' });
    } finally {
      setPassSubmitting(false);
    }
  };

  const sm = settingsData?.supermarket;
  const branches = settingsData?.branches || [];

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Store className="w-5 h-5 text-blue-600" />
          <span>Supermarket Store Profile & Credentials</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Branch authorization scope, store profile details, and account security.
        </p>
      </div>

      {message && (
        <div className={`p-4 rounded-xl border text-xs font-medium flex items-center gap-2 ${
          message.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-red-600" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Store Info */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-slate-500" />
          <span>Assigned Store & Branch Scope</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-slate-400 block mb-0.5">Supermarket Name:</span>
            <p className="font-bold text-slate-900 text-sm">{sm?.name || 'Loading...'}</p>
          </div>

          <div>
            <span className="text-slate-400 block mb-0.5">Store Code:</span>
            <p className="font-mono font-bold text-blue-700">{sm?.code || 'SM-001'}</p>
          </div>

          <div>
            <span className="text-slate-400 block mb-0.5">Registered Address:</span>
            <p className="font-medium text-slate-700">{sm?.address}, {sm?.city}</p>
          </div>

          <div>
            <span className="text-slate-400 block mb-0.5">Contact Phone:</span>
            <p className="font-medium text-slate-700">{sm?.contactPhone}</p>
          </div>
        </div>

        <div className="pt-2">
          <span className="text-xs font-bold text-slate-700 block mb-2">Authorized Branches:</span>
          <div className="space-y-2">
            {branches.map((b: any) => (
              <div key={b.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-900">{b.branchName}</span>
                  <span className="text-[10px] text-slate-400 font-mono ml-2">Code: {b.branchCode}</span>
                  <p className="text-[11px] text-slate-500 mt-0.5">{b.address}</p>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  {b.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
          <Key className="w-4 h-4 text-slate-500" />
          <span>Change Store Official Password</span>
        </h2>

        <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Current Password *</label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">New Password (Min 6 chars) *</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm New Password *</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
            />
          </div>

          <button
            type="submit"
            disabled={passSubmitting}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-60 cursor-pointer"
          >
            {passSubmitting ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
