import { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { getBackendUrl } from '../../utils/apiConfig';
import { getStoredAuditLogs } from '../../data/mockDatabase';
import { ShieldCheck, Search, Clock, User, Filter, AlertCircle } from 'lucide-react';

export default function AdminAuditLogs() {
  const token = useAuthStore((state) => state.token);

  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchAudits = async () => {
      try {
        const backendUrl = getBackendUrl();
        if (!backendUrl) {
          setAuditLogs(getStoredAuditLogs());
          return;
        }
        const res = await fetch(`${backendUrl}/api/admin/audit-logs`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: AbortSignal.timeout(2000)
        });
        if (res.ok) {
          const data = await res.json();
          setAuditLogs(data.auditLogs || []);
          return;
        }
        throw new Error('Server non-ok');
      } catch (err) {
        setAuditLogs(getStoredAuditLogs());
      } finally {
        setLoading(false);
      }
    };
    fetchAudits();
  }, [token]);

  const filtered = auditLogs.filter(log => {
    const q = search.toLowerCase();
    return (
      log.action.toLowerCase().includes(q) ||
      log.userEmail.toLowerCase().includes(q) ||
      log.details.toLowerCase().includes(q) ||
      log.entityType.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <span>Immutable Platform Audit Logs</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Complete security trail of administrative actions, account provisioning, status updates, and critical events.
          </p>
        </div>

        <div className="w-full sm:w-72 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search action, email, or details..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-900">Security Event Ledger</span>
          <span className="text-xs text-slate-500">Showing: {filtered.length} entries</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200/80">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Actor Email</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Entity Type</th>
                <th className="py-3 px-4">Event Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-xs text-slate-400">Loading audit ledger...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-xs text-slate-400">No matching audit logs found.</td>
                </tr>
              ) : (
                filtered.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString('en-GB')}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-[10px]">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-medium">{log.userEmail}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        log.userRole === 'HEAD_OFFICE_ADMIN' ? 'bg-purple-100 text-purple-800' :
                        log.userRole === 'SUPERMARKET_OFFICIAL' ? 'bg-blue-100 text-blue-800' :
                        'bg-emerald-100 text-emerald-800'
                      }`}>
                        {log.userRole}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500">{log.entityType}</td>
                    <td className="py-3 px-4 text-slate-700 max-w-md">{log.details}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
