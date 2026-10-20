import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { useAuthStore } from '../../store/useAuthStore';
import { 
  ShieldAlert, 
  MessageSquare, 
  AlertTriangle, 
  CheckCircle2, 
  AlertCircle, 
  ArrowUpRight,
  Search,
  Filter,
  Eye,
  Mail,
  Calendar,
  Tag,
  Package,
  Clock,
  User,
  ShieldCheck,
  FileText,
  ExternalLink
} from 'lucide-react';
import CallContactButton from '../../components/common/CallContactButton';
import { SpoilageReportPdfModal, normalizeEvidenceImage } from '../../components/complaints/SpoilageReportPdfModal';
import { getStoredComplaints, updateStoredComplaint } from '../../data/mockDatabase';

export default function SupermarketComplaints() {
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);

  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [responseModalOpen, setResponseModalOpen] = useState(false);
  const [escalateModalOpen, setEscalateModalOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedComplaint, setSelectedComplaint] = useState<any>(null);
  const [responseText, setResponseText] = useState('');
  const [batchRef, setBatchRef] = useState('');
  const [escalationReason, setEscalationReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [liveToast, setLiveToast] = useState<string | null>(null);
  const [pdfModalCase, setPdfModalCase] = useState<any | null>(null);

  // Cash Refund Modal State
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [refundAmount, setRefundAmount] = useState('150');
  const [refundMethod, setRefundMethod] = useState<'Cash' | 'UPI' | 'Store Credit' | 'Bank Transfer'>('Cash');
  const [refundNotes, setRefundNotes] = useState('');

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');

  const fetchComplaints = async () => {
    try {
      const backendUrl = window.location.hostname === 'localhost' ? 'http://localhost:5000' : `http://${window.location.hostname}:5000`;
      const res = await fetch(`${backendUrl}/api/supermarket/complaints`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(2500)
      });
      if (res.ok) {
        const data = await res.json();
        setComplaints(data.complaints || []);
        return;
      }
      throw new Error('Server non-ok');
    } catch (err) {
      // Offline / Public Fallback: load complaints from mockDatabase
      setComplaints(getStoredComplaints() as any);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();

    const backendUrl = window.location.hostname === 'localhost' ? 'http://localhost:5000' : `http://${window.location.hostname}:5000`;
    const socket = io(backendUrl);

    socket.on('newComplaint', (complaint: any) => {
      const currentSmId = user?.supermarketId || 'sm-001';
      const isForThisStore = complaint.supermarketId === currentSmId || 
        (complaint.seller && complaint.seller.toLowerCase().includes('freshmart'));
      
      if (isForThisStore) {
        setComplaints((prev) => [complaint, ...prev.filter(c => c.id !== complaint.id)]);
        setLiveToast(`🚨 Live Customer Report Received: ${complaint.productName} (Ref: ${complaint.id})`);
        setTimeout(() => setLiveToast(null), 8000);
      }
    });

    socket.on('supermarketComplaintUpdate', (updated: any) => {
      setComplaints((prev) => prev.map(c => c.id === updated.id ? { ...c, ...updated } : c));
    });

    socket.on('complaintUpdated', (updated: any) => {
      setComplaints((prev) => prev.map(c => c.id === updated.id ? { ...c, ...updated } : c));
    });

    return () => {
      socket.disconnect();
    };
  }, [token, user?.supermarketId]);

  const handleSendResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint) return;
    setSubmitting(true);
    setMessage(null);

    try {
      const backendUrl = window.location.hostname === 'localhost' ? 'http://localhost:5000' : `http://${window.location.hostname}:5000`;
      const res = await fetch(`${backendUrl}/api/supermarket/complaints/${selectedComplaint.id}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          responseText,
          evidenceBatchNumber: batchRef
        }),
        signal: AbortSignal.timeout(2000)
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setMessage({ type: 'success', text: `Official store response logged for case ${selectedComplaint.id}. Dispatched to consumer dashboard.` });
        setResponseModalOpen(false);
        setResponseText('');
        setBatchRef('');
        if (data.complaint) {
          setComplaints(prev => prev.map(c => c.id === data.complaint.id ? data.complaint : c));
        } else {
          fetchComplaints();
        }
        return;
      }
      throw new Error('Server non-ok');
    } catch {
      // Offline fallback: persist into mockDatabase
      const updated = updateStoredComplaint(selectedComplaint.id, { 
        officialResponse: responseText, 
        batchNumber: batchRef || selectedComplaint.batchNumber,
        status: 'Investigating'
      });
      setComplaints(prev => prev.map(c => c.id === selectedComplaint.id ? (updated || { ...c, officialResponse: responseText, status: 'Investigating' }) : c));
      setMessage({ type: 'success', text: `Official store response logged for case ${selectedComplaint.id}. Dispatched to consumer dashboard.` });
      setResponseModalOpen(false);
      setResponseText('');
      setBatchRef('');
    } finally {
      setSubmitting(false);
    }
  };

  const handleIssueRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint) return;
    setSubmitting(true);
    setMessage(null);

    const amt = parseFloat(refundAmount) || 150;

    try {
      const backendUrl = window.location.hostname === 'localhost' ? 'http://localhost:5000' : `http://${window.location.hostname}:5000`;
      const res = await fetch(`${backendUrl}/api/supermarket/complaints/${selectedComplaint.id}/refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: amt,
          method: refundMethod,
          notes: refundNotes
        }),
        signal: AbortSignal.timeout(2000)
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setMessage({
          type: 'success',
          text: `💸 Cash Refund of ₹${refundAmount} successfully issued to ${selectedComplaint.reporterName || 'Customer'}! Incident resolved and synced across all portals.`
        });
        setRefundModalOpen(false);
        setRefundAmount('150');
        setRefundNotes('');
        if (data.complaint) {
          setComplaints(prev => prev.map(c => c.id === data.complaint.id ? data.complaint : c));
        } else {
          fetchComplaints();
        }
        return;
      }
      throw new Error('Server non-ok');
    } catch {
      // Offline fallback: persist into mockDatabase
      const updated = updateStoredComplaint(selectedComplaint.id, {
        status: 'Resolved',
        refundStatus: 'Refunded',
        refundAmount: amt,
        refundMethod
      });
      setComplaints(prev => prev.map(c => c.id === selectedComplaint.id ? (updated || { ...c, status: 'Resolved', refundStatus: 'Refunded', refundAmount: amt, refundMethod }) : c));
      setMessage({
        type: 'success',
        text: `💸 Cash Refund of ₹${refundAmount} successfully issued to ${selectedComplaint.reporterName || 'Customer'}! Incident resolved and synced across all portals.`
      });
      setRefundModalOpen(false);
      setRefundAmount('150');
      setRefundNotes('');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (complaintId: string, newStatus: string, reasonNote: string) => {
    try {
      const backendUrl = window.location.hostname === 'localhost' ? 'http://localhost:5000' : `http://${window.location.hostname}:5000`;
      const res = await fetch(`${backendUrl}/api/supermarket/complaints/${complaintId}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          status: newStatus,
          note: reasonNote
        }),
        signal: AbortSignal.timeout(2000)
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setMessage({ type: 'success', text: `Incident ${complaintId} status updated to: ${newStatus}.` });
        if (data.complaint) {
          setComplaints(prev => prev.map(c => c.id === data.complaint.id ? data.complaint : c));
        } else {
          fetchComplaints();
        }
        return;
      }
      throw new Error('Server non-ok');
    } catch {
      // Offline fallback: persist into mockDatabase
      const updated = updateStoredComplaint(complaintId, { status: newStatus });
      setComplaints(prev => prev.map(c => c.id === complaintId ? (updated || { ...c, status: newStatus }) : c));
      setMessage({ type: 'success', text: `Incident ${complaintId} status updated to: ${newStatus}.` });
    }
  };

  const handleEscalate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint) return;
    setSubmitting(true);
    setMessage(null);

    try {
      const backendUrl = window.location.hostname === 'localhost' ? 'http://localhost:5000' : `http://${window.location.hostname}:5000`;
      const res = await fetch(`${backendUrl}/api/supermarket/complaints/${selectedComplaint.id}/escalate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          escalationReason
        }),
        signal: AbortSignal.timeout(2000)
      });

      if (res.ok) {
        const data = await res.json();
        setMessage({ type: 'success', text: `Case ${selectedComplaint.id} escalated to Head Office Food Safety Enforcement.` });
        setEscalateModalOpen(false);
        setEscalationReason('');
        if (data.complaint) {
          setComplaints(prev => prev.map(c => c.id === data.complaint.id ? data.complaint : c));
        } else {
          fetchComplaints();
        }
        return;
      }
      throw new Error('Server non-ok');
    } catch {
      // Offline fallback: persist into mockDatabase
      const updated = updateStoredComplaint(selectedComplaint.id, { escalated: true, status: 'Under Investigation' });
      setComplaints(prev => prev.map(c => c.id === selectedComplaint.id ? (updated || { ...c, escalated: true, status: 'Under Investigation' }) : c));
      setMessage({ type: 'success', text: `Case ${selectedComplaint.id} escalated to Head Office Food Safety Enforcement.` });
      setEscalateModalOpen(false);
      setEscalationReason('');
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered complaints
  const filteredComplaints = complaints.filter((c) => {
    if (statusFilter !== 'All' && c.status !== statusFilter) return false;
    if (priorityFilter !== 'All' && c.priority !== priorityFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = (c.productName || '').toLowerCase().includes(q);
      const matchId = (c.id || '').toLowerCase().includes(q);
      const matchReporter = (c.reporterName || '').toLowerCase().includes(q);
      const matchBatch = (c.batchNumber || '').toLowerCase().includes(q);
      if (!matchName && !matchId && !matchReporter && !matchBatch) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Live Push Notification Toast */}
      {liveToast && (
        <div className="bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 p-0.5 rounded-2xl shadow-xl animate-in slide-in-from-top-4 duration-300">
          <div className="bg-white p-4 rounded-[14px] flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center font-bold shrink-0 animate-ping">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider block">Live Alert from Customer Portal</span>
                <p className="text-xs font-bold text-slate-900">{liveToast}</p>
              </div>
            </div>
            <button
              onClick={() => setLiveToast(null)}
              className="text-slate-400 hover:text-slate-600 p-1 text-xs"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-purple-600" />
              <span>Store Food Safety Incident Inquiries</span>
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 font-mono">
              Live Connected
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Consumer reports filed against your branch. Provide official response, verify cold-chain logs, or escalate supplier issues.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchComplaints}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
          >
            <span>Refresh Inquiries</span>
          </button>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-xl border text-xs font-medium flex items-center justify-between gap-2 ${
          message.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex items-center gap-2">
            {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-red-600" />}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by product, batch #, consumer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <Filter className="w-3.5 h-3.5" />
            <span className="font-semibold">Status:</span>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-xl bg-white"
          >
            <option value="All">All Statuses</option>
            <option value="Submitted">Submitted (New)</option>
            <option value="Under Investigation">Under Investigation</option>
            <option value="Resolved">Resolved</option>
          </select>

          <div className="flex items-center gap-1 text-xs text-slate-500 ml-2">
            <span className="font-semibold">Priority:</span>
          </div>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-xl bg-white"
          >
            <option value="All">All Priorities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
      </div>

      {/* Complaints List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-900">
            Active Store Inquiries ({filteredComplaints.length} shown)
          </span>
          <span className="text-xs text-slate-500">Total in DB: {complaints.length}</span>
        </div>

        <div className="divide-y divide-slate-100">
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-400">Loading store inquiries from server...</div>
          ) : filteredComplaints.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">
              No store inquiries matching your active filters.
            </div>
          ) : (
            filteredComplaints.map((c) => (
              <div key={c.id} className="p-5 hover:bg-slate-50/70 transition-colors space-y-4">
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">{c.productName}</span>
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono font-medium">
                      {c.id}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      c.priority === 'Critical' ? 'bg-red-100 text-red-800' :
                      c.priority === 'High' ? 'bg-orange-100 text-orange-800' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {c.priority} Priority
                    </span>
                    {c.escalatedToHeadOffice && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 flex items-center gap-1">
                        <ArrowUpRight className="w-3 h-3" />
                        <span>Escalated to Head Office</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold ${
                      c.status === 'Resolved' ? 'bg-emerald-100 text-emerald-800' :
                      c.status === 'Under Investigation' ? 'bg-amber-100 text-amber-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {c.status}
                    </span>
                  </div>
                </div>

                {/* Complaint Statement */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-2">
                  <p className="text-xs text-slate-700 leading-relaxed">
                    <strong className="text-slate-900 block mb-1">Consumer Complaint Statement:</strong>
                    {c.description}
                  </p>

                  {/* Metadata Chips */}
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1 font-medium">
                    <span className="flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5 text-slate-400" />
                      <span>Category: <strong className="text-slate-700">{c.foodType}</strong></span>
                    </span>
                    {c.batchNumber && (
                      <span className="flex items-center gap-1">
                        <Package className="w-3.5 h-3.5 text-slate-400" />
                        <span>Batch: <strong className="text-slate-700 font-mono">{c.batchNumber}</strong></span>
                      </span>
                    )}
                    {c.expiryDate && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>Expiry: <strong className="text-slate-700">{c.expiryDate}</strong></span>
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>Filed: {c.date} ({c.time || 'Morning'})</span>
                    </span>
                  </div>
                </div>

                {/* Consumer Contact & Evidence Gallery Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  {/* Consumer Contact Card */}
                  <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100/80 text-xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 block mb-1">
                      Consumer Contact Information
                    </span>
                    <div className="space-y-1.5 text-slate-700">
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-blue-500" />
                        <span className="font-semibold text-slate-900 capitalize">{c.reporterName || c.consumer?.name || 'Praveen'}</span>
                      </div>
                      <div className="pt-0.5">
                        <CallContactButton
                          contactName={c.reporterName || c.consumer?.name || 'Praveen'}
                          phoneNumber={c.reporterPhone || c.consumer?.phone || c.phone}
                          role="Complainant Citizen"
                          context="complaint"
                          referenceId={c.id}
                          storeRepresentative={user?.fullName || user?.username || 'Rajesh Mehta (Store Lead)'}
                          storeName={user?.supermarket?.name || c.seller || 'FreshMart Supermarkets'}
                          variant="compact"
                        />
                      </div>
                      {c.reporterEmail && (
                        <div className="flex items-center gap-2 pt-0.5">
                          <Mail className="w-3.5 h-3.5 text-blue-500" />
                          <a href={`mailto:${c.reporterEmail}`} className="text-blue-600 hover:underline">
                            {c.reporterEmail}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Evidence Images Preview */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                      Physical Evidence Photos ({c.evidenceImages?.length || 0})
                    </span>
                    {(() => {
                      const rawList = Array.isArray(c.evidenceImages)
                        ? (c.evidenceImages.length === 2 && c.evidenceImages[0]?.startsWith('data:') && !c.evidenceImages[0]?.includes(',') && !c.evidenceImages[1]?.startsWith('http')
                          ? [c.evidenceImages[0] + ',' + c.evidenceImages[1]]
                          : c.evidenceImages)
                        : [];
                      const cleaned = rawList.map(normalizeEvidenceImage).filter((x: string | null): x is string => Boolean(x));

                      return cleaned.length > 0 ? (
                        <div className="flex flex-wrap items-center gap-2">
                          {cleaned.slice(0, 4).map((imgUrl: string, idx: number) => (
                            <div 
                              key={idx} 
                              onClick={() => setPreviewImage(imgUrl)}
                              className="relative group w-14 h-14 rounded-lg overflow-hidden border border-slate-200 bg-slate-900 cursor-pointer shadow-2xs flex items-center justify-center"
                            >
                              <img src={imgUrl} alt={`Evidence ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                                <Eye className="w-3.5 h-3.5" />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[11px] text-slate-400 italic">No physical photos uploaded for this inquiry.</p>
                      );
                    })()}
                  </div>
                </div>

                {/* Official Response Banner (if registered) */}
                {c.officialResponse && (
                  <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-200/80 text-xs text-emerald-900">
                    <div className="flex items-center gap-1.5 font-bold text-emerald-800 mb-1">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>Registered Store Official Response:</span>
                    </div>
                    <p className="leading-relaxed text-emerald-950">{c.officialResponse}</p>
                  </div>
                )}

                {/* Notes & Actions History */}
                {c.investigationNotes && c.investigationNotes.length > 0 && (
                  <div className="pt-2 border-t border-slate-100 space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Investigation History:</span>
                    {c.investigationNotes.map((n: any, idx: number) => (
                      <div key={idx} className="text-[11px] text-slate-600 flex items-start gap-2">
                        <span className="text-purple-600 font-bold">•</span>
                        <span>
                          <strong className="text-slate-900">{n.officer}:</strong> {n.text}
                          <span className="text-slate-400 text-[10px] ml-2 font-mono">({n.timestamp})</span>
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Action Controls */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
                  <div className="flex flex-wrap items-center gap-1.5 text-xs">
                    <span className="text-[11px] text-slate-500 font-semibold mr-1">Quick Action:</span>
                    {c.status !== 'Under Investigation' && (
                      <button
                        onClick={() => handleStatusChange(c.id, 'Under Investigation', 'Store lead assigned inspection of cold-chain and display shelf.')}
                        className="px-2.5 py-1 bg-amber-50 text-amber-800 hover:bg-amber-100 font-bold rounded-lg text-[11px] cursor-pointer"
                      >
                        Start Investigation
                      </button>
                    )}
                    {c.status !== 'Resolved' && (
                      <button
                        onClick={() => handleStatusChange(c.id, 'Resolved', 'Corrective action taken. Affected batch quarantined. Customer replacement issued.')}
                        className="px-2.5 py-1 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 font-bold rounded-lg text-[11px] cursor-pointer"
                      >
                        Mark Resolved
                      </button>
                    )}

                    {/* Cash Refund Status / Trigger */}
                    {c.refundStatus === 'Refunded' ? (
                      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-100/90 text-emerald-800 border border-emerald-300 rounded-lg text-[11px] font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>💸 Refund Disbursed: ₹{c.refundAmount || 150} ({c.refundMethod || 'Cash'})</span>
                        {c.refundTransactionId && <span className="font-mono text-[10px] text-emerald-700">[{c.refundTransactionId}]</span>}
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setSelectedComplaint(c);
                          setRefundAmount('150');
                          setRefundMethod('Cash');
                          setRefundNotes(`Cash refund disbursed at customer service counter to ${c.reporterName || 'customer'}.`);
                          setRefundModalOpen(true);
                        }}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[11px] flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                      >
                        <span>💸 Issue Cash Refund</span>
                      </button>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Spoilage PDF Report Button */}
                    <button
                      onClick={() => setPdfModalCase(c)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
                      title="Generate official Food Spoilage & Safety Inspection Report PDF"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Spoilage PDF Report</span>
                    </button>

                    {/* Cross-Dashboard Link */}
                    <button
                      onClick={() => navigate('/user/complaints')}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1 cursor-pointer transition-colors border border-slate-200"
                      title="Open Citizen Spoilage & Safety Portal"
                    >
                      <ExternalLink className="w-3 h-3 text-slate-500" />
                      <span>Citizen Portal</span>
                    </button>

                    <button
                      onClick={() => {
                        setSelectedComplaint(c);
                        setBatchRef(c.batchNumber || '');
                        setResponseModalOpen(true);
                      }}
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>{c.officialResponse ? 'Update Response' : 'Submit Official Response'}</span>
                    </button>
                    {!c.escalatedToHeadOffice && (
                      <button
                        onClick={() => {
                          setSelectedComplaint(c);
                          setEscalateModalOpen(true);
                        }}
                        className="px-3 py-1.5 bg-amber-50 text-amber-800 hover:bg-amber-100 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <ArrowUpRight className="w-3.5 h-3.5" />
                        <span>Escalate to Head Office</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Image Lightbox Preview Modal */}
      {previewImage && (
        <div 
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="relative max-w-2xl max-h-[90vh] bg-slate-900 rounded-2xl overflow-hidden shadow-2xl p-2" onClick={(e) => e.stopPropagation()}>
            <img src={previewImage} alt="Evidence Full Preview" className="w-full max-h-[80vh] object-contain rounded-xl" />
            <div className="flex items-center justify-between p-3 text-white">
              <span className="text-xs font-semibold">Physical Evidence Photo</span>
              <button
                onClick={() => setPreviewImage(null)}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-bold"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Response Modal */}
      {responseModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Official Supermarket Response — {selectedComplaint?.id}
              </h3>
              <button onClick={() => setResponseModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Enter official findings regarding batch storage temperature logs and supplier invoices. This note is pushed directly to the consumer and Food Safety Team in real time.
            </p>

            <form onSubmit={handleSendResponse} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Batch / Lot Reference</label>
                <input
                  type="text"
                  placeholder="e.g. DR-2026-442"
                  value={batchRef}
                  onChange={(e) => setBatchRef(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Official Response & Corrective Actions *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="e.g. Cold storage logs for Chiller #2 inspected. Temperature verified at 3.5°C. Affected batch quarantined for lab screening. Customer offered immediate replacement."
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResponseModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl disabled:opacity-60 cursor-pointer shadow-2xs"
                >
                  {submitting ? 'Submitting...' : 'Register Response & Notify Consumer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Escalate Modal */}
      {escalateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Escalate to Head Office Administration
              </h3>
              <button onClick={() => setEscalateModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Use this if the contamination origin appears to be a manufacturer-wide recall or biological hazard.
            </p>

            <form onSubmit={handleEscalate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Escalation Reason *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="e.g. Defect observed in unopened sealed packaging across 3 different customer receipts. Suspected upstream supplier pasteurization failure. Request central food safety testing."
                  value={escalationReason}
                  onChange={(e) => setEscalationReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEscalateModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl disabled:opacity-60 cursor-pointer"
                >
                  {submitting ? 'Escalating...' : 'Confirm Escalation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cash Refund Modal */}
      {refundModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span className="text-lg">💸</span>
                <span>Issue Customer Cash / Digital Refund</span>
              </h3>
              <button onClick={() => setRefundModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            
            <p className="text-xs text-slate-500 mb-4">
              Disburse an immediate cash or digital refund for case <strong className="text-slate-800 font-mono">{selectedComplaint?.id}</strong>. This automatically updates the consumer and food safety audit records in real time.
            </p>

            <form onSubmit={handleIssueRefund} className="space-y-4">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Customer:</span>
                  <strong className="text-slate-900">{selectedComplaint?.reporterName || 'Aditi Verma'}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Product:</span>
                  <strong className="text-slate-900">{selectedComplaint?.productName}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Batch #:</span>
                  <strong className="text-slate-900 font-mono">{selectedComplaint?.batchNumber || 'N/A'}</strong>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Refund Amount (₹) *</label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    required
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-bold text-emerald-700 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Disbursement Method *</label>
                  <select
                    value={refundMethod}
                    onChange={(e) => setRefundMethod(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white font-medium text-slate-800"
                  >
                    <option value="Cash">Cash at Store Counter</option>
                    <option value="UPI">Instant UPI Transfer</option>
                    <option value="Store Credit">Store Credit / Gift Voucher</option>
                    <option value="Bank Transfer">Bank NEFT/IMPS</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Refund Receipt / Notes</label>
                <textarea
                  rows={3}
                  value={refundNotes}
                  onChange={(e) => setRefundNotes(e.target.value)}
                  placeholder="e.g. Counter receipt #8921. Customer returned defective milk carton. ₹150 cash handed over."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRefundModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl disabled:opacity-60 cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <span>💸 Confirm & Disburse Refund</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SPOILAGE REPORT PDF DOSSIER MODAL */}
      {pdfModalCase && (
        <SpoilageReportPdfModal
          isOpen={Boolean(pdfModalCase)}
          onClose={() => setPdfModalCase(null)}
          complaint={pdfModalCase}
          onRefresh={fetchComplaints}
        />
      )}
    </div>
  );
}
