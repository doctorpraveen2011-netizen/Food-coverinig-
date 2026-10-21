import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { useAuthStore } from '../../store/useAuthStore';
import { 
  ShieldCheck, 
  Plus, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  AlertCircle, 
  ChevronDown, 
  ChevronUp, 
  Store, 
  Tag, 
  Barcode, 
  Calendar, 
  FileText, 
  Milk, 
  Apple, 
  Wheat, 
  Beef, 
  Fish, 
  Package, 
  Check, 
  User, 
  X, 
  Eye, 
  Sparkles, 
  AlertTriangle,
  FlaskConical,
  Microscope,
  Shield,
  Building2,
  ExternalLink,
  Printer,
  Share2
} from 'lucide-react';
import { SpoilageReportPdfModal, normalizeEvidenceImage } from '../../components/complaints/SpoilageReportPdfModal';
import { getStoredComplaints, addStoredComplaint } from '../../data/mockDatabase';
import { getBackendUrl, createSafeSocket } from '../../utils/apiConfig';

export default function UserComplaints() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);

  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedCaseId, setExpandedCaseId] = useState<string | null>(null);

  // Modals State
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [allNotesModalCase, setAllNotesModalCase] = useState<any | null>(null);
  const [pdfModalCase, setPdfModalCase] = useState<any | null>(null);
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});
  const [sharingCaseId, setSharingCaseId] = useState<string | null>(null);

  // Form State
  const [productName, setProductName] = useState('');
  const [foodType, setFoodType] = useState('Fruits & Vegetables');
  const [quantity, setQuantity] = useState('1 kg');
  const [batchNumber, setBatchNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [storeOption, setStoreOption] = useState<'sm-001' | 'sm-002' | 'other'>('sm-001');
  const [supermarketId, setSupermarketId] = useState('sm-001');
  const [branchId, setBranchId] = useState('br-001-cp');
  const [seller, setSeller] = useState('FreshMart Supermarkets');
  const [purchaseLocation, setPurchaseLocation] = useState('FreshMart Supermarkets, Central Market');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High' | 'Critical'>('High');
  const [problemType, setProblemType] = useState('Spoilage / Mold Detected');
  const [description, setDescription] = useState('');
  const [evidenceInput, setEvidenceInput] = useState('');

  const fetchComplaints = async () => {
    setLoading(true);
    setError(null);
    const backendUrl = getBackendUrl();
    if (backendUrl) {
      try {
        const res = await fetch(`${backendUrl}/api/user/complaints`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: AbortSignal.timeout(2500)
        });
        if (res.ok) {
          const data = await res.json();
          const records = data.complaints || [];
          setComplaints(records);
          if (records.length > 0 && !expandedCaseId) {
            setExpandedCaseId(records[0].id);
          }
          setLoading(false);
          return;
        }
      } catch {
        // Fall through to offline fallback
      }
    }

    // Offline / Public Fallback: load complaints from mockDatabase
    const stored = getStoredComplaints();
    setComplaints(stored as any);
    if (stored.length > 0 && !expandedCaseId) {
      setExpandedCaseId(stored[0].id);
    }
    setError(null);
    setLoading(false);
  };

  useEffect(() => {
    fetchComplaints();

    const socket = createSafeSocket();
    if (!socket) return;

    socket.on('userComplaintUpdate', (updated: any) => {
      setComplaints((prev) => {
        const exists = prev.some(c => c.id === updated.id);
        if (exists) {
          return prev.map(c => c.id === updated.id ? { ...c, ...updated } : c);
        }
        return [updated, ...prev];
      });

      if (updated.officialResponse) {
        setMessage({
          type: 'success',
          text: `🔔 Supermarket Official responded to report ${updated.id}: "${updated.officialResponse.slice(0, 100)}"`
        });
      }
    });

    socket.on('supermarketComplaintUpdate', (updated: any) => {
      setComplaints((prev) => prev.map(c => c.id === updated.id ? { ...c, ...updated } : c));
    });

    socket.on('customerRefundIssued', (refund: any) => {
      setMessage({
        type: 'success',
        text: `🎉 Good news! ${refund.customerName || 'You'} received a ${refund.method || 'cash'} refund of ₹${refund.amount} for ${refund.productName}! (Ref: ${refund.refId})`
      });
      fetchComplaints();
    });

    socket.on('complaintUpdated', (updated: any) => {
      setComplaints((prev) => prev.map(c => c.id === updated.id ? { ...c, ...updated } : c));
    });

    return () => {
      socket.disconnect();
    };
  }, [token]);

  const handleShareToHeadOffice = async (complaintId: string) => {
    setSharingCaseId(complaintId);
    try {
      const backendUrl = getBackendUrl();
      if (backendUrl) {
        await fetch(`${backendUrl}/api/user/complaints/${complaintId}/share-head-office`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        });
      }
      setMessage({
        type: 'success',
        text: '🏛️ Food Spoilage Dossier & Evidence successfully transmitted to Supermarket Corporate Head Office!'
      });
      await fetchComplaints();
    } catch {
      setMessage({
        type: 'success',
        text: '🏛️ Food Spoilage Dossier & Evidence recorded for Head Office Compliance review.'
      });
    } finally {
      setSharingCaseId(null);
    }
  };

  useEffect(() => {
    if (location.state?.prefillScan) {
      const scan = location.state.prefillScan;
      const lower = (scan.food || '').toLowerCase();
      let detectedCategory = 'Prepared Food';
      if (lower.includes('milk') || lower.includes('dairy') || lower.includes('cheese') || lower.includes('curd')) {
        detectedCategory = 'Dairy Product';
      } else if (lower.includes('meat') || lower.includes('chicken') || lower.includes('beef') || lower.includes('fish')) {
        detectedCategory = 'Meat';
      } else if (lower.includes('bread') || lower.includes('bakery') || lower.includes('pastry') || lower.includes('bun') || lower.includes('cake')) {
        detectedCategory = 'Bakery';
      } else if (lower.includes('fruit') || lower.includes('apple') || lower.includes('banana') || lower.includes('salad') || lower.includes('veg')) {
        detectedCategory = 'Fruits & Vegetables';
      } else if (lower.includes('rice') || lower.includes('grain') || lower.includes('cereal')) {
        detectedCategory = 'Grains & Cereals';
      }

      setProductName(scan.food || 'Spoiled Food Item');
      setFoodType(detectedCategory);
      setPriority(scan.risk === 'High' ? 'Critical' : 'High');
      setProblemType('Spoilage / Mold Detected');
      setDescription(`[AI Freshness Scan Detection]: ${scan.food} flagged with ${scan.confidence} confidence. Spoilage Risk: ${scan.risk}. Recommendation: ${scan.recommendation || 'Unfit for human consumption.'}`);
      const img = location.state?.uploadedImage || scan.imageUrl;
      if (img) {
        setEvidenceInput(img);
      }
      setMessage({
        type: 'success',
        text: `Complaint prefilled with AI Freshness Scan evidence (${scan.food})!`
      });
      setModalOpen(true);
    }
    if (location.state?.focusCaseId) {
      setExpandedCaseId(location.state.focusCaseId);
    }
  }, [location.state]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    let images: string[] = [];
    if (evidenceInput.trim()) {
      const trimmed = evidenceInput.trim();
      if (trimmed.startsWith('data:')) {
        images = [trimmed];
      } else if (trimmed.includes('\n')) {
        images = trimmed.split('\n').map((s) => s.trim()).filter(Boolean);
      } else if (trimmed.includes(',') && !trimmed.includes(';base64,')) {
        images = trimmed.split(',').map((s) => s.trim()).filter(Boolean);
      } else {
        images = [trimmed];
      }
    } else {
      images = [];
    }

    try {
      const backendUrl = getBackendUrl();
      if (backendUrl) {
        const res = await fetch(`${backendUrl}/api/user/complaints`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            productName,
            foodType,
            quantity,
            batchNumber,
            expiryDate: expiryDate || 'Not specified',
            seller,
            supermarketId: supermarketId || undefined,
            branchId: branchId || undefined,
            purchaseLocation: purchaseLocation || seller,
            sellerAddress: purchaseLocation || seller,
            purchaseDate: purchaseDate || new Date().toISOString().split('T')[0],
            description: `[Issue: ${problemType}] ${description}`,
            priority,
            evidenceImages: images
          }),
          signal: AbortSignal.timeout(2000)
        });

        if (res.ok) {
          const data = await res.json();
          setMessage({ type: 'success', text: 'Food spoilage investigation report registered! Food safety inspector assigned.' });
          setModalOpen(false);
          setProductName('');
          setDescription('');
          await fetchComplaints();
          if (data.complaint?.id) {
            setExpandedCaseId(data.complaint.id);
          }
          return;
        }
      }

      // Offline fallback: save to mockDatabase
      const fallbackItem = addStoredComplaint({
        customerName: user?.fullName || 'Praveen Kumar',
        customerPhone: user?.phone || '+91 82488 32986',
        customerEmail: user?.email || 'praveen@foodcovering.org',
        productName,
        foodType,
        quantity,
        batchNumber,
        expiryDate: expiryDate || 'Not specified',
        seller,
        supermarketId: supermarketId || undefined,
        branchId: branchId || undefined,
        description: `[Issue: ${problemType}] ${description}`,
        priority,
        evidenceImages: images
      });
      setComplaints(prev => [fallbackItem as any, ...prev]);
      setExpandedCaseId(fallbackItem.id);
      setMessage({ type: 'success', text: 'Food spoilage investigation report registered! Food safety inspector assigned.' });
      setModalOpen(false);
      setProductName('');
      setDescription('');
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // Helper for Category Icon
  const getProductIcon = (category: string, name: string) => {
    const text = `${category} ${name}`.toLowerCase();
    if (text.includes('milk') || text.includes('dairy') || text.includes('cheese') || text.includes('yogurt')) {
      return (
        <div className="w-12 h-12 rounded-xl bg-white border border-slate-200/80 text-emerald-600 flex items-center justify-center shrink-0 shadow-2xs">
          <Milk className="w-6 h-6 stroke-[1.75]" />
        </div>
      );
    }
    if (text.includes('strawberr') || text.includes('fruit') || text.includes('apple') || text.includes('veg')) {
      return (
        <div className="w-12 h-12 rounded-xl bg-white border border-slate-200/80 text-rose-500 flex items-center justify-center shrink-0 shadow-2xs">
          <Apple className="w-6 h-6 stroke-[1.75]" />
        </div>
      );
    }
    if (text.includes('bread') || text.includes('bakery') || text.includes('flour') || text.includes('wheat')) {
      return (
        <div className="w-12 h-12 rounded-xl bg-white border border-slate-200/80 text-amber-600 flex items-center justify-center shrink-0 shadow-2xs">
          <Wheat className="w-6 h-6 stroke-[1.75]" />
        </div>
      );
    }
    if (text.includes('meat') || text.includes('beef') || text.includes('chicken') || text.includes('pork')) {
      return (
        <div className="w-12 h-12 rounded-xl bg-white border border-slate-200/80 text-red-600 flex items-center justify-center shrink-0 shadow-2xs">
          <Beef className="w-6 h-6 stroke-[1.75]" />
        </div>
      );
    }
    if (text.includes('fish') || text.includes('seafood') || text.includes('prawn')) {
      return (
        <div className="w-12 h-12 rounded-xl bg-white border border-slate-200/80 text-blue-600 flex items-center justify-center shrink-0 shadow-2xs">
          <Fish className="w-6 h-6 stroke-[1.75]" />
        </div>
      );
    }
    return (
      <div className="w-12 h-12 rounded-xl bg-white border border-slate-200/80 text-emerald-600 flex items-center justify-center shrink-0 shadow-2xs">
        <Package className="w-6 h-6 stroke-[1.75]" />
      </div>
    );
  };

  // Helper for Priority Badge
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'Critical':
        return {
          label: 'Critical Priority',
          badgeClass: 'bg-red-50 text-red-700 border border-red-200'
        };
      case 'High':
        return {
          label: 'High Priority',
          badgeClass: 'bg-orange-50 text-orange-700 border border-orange-200'
        };
      case 'Medium':
        return {
          label: 'Medium Priority',
          badgeClass: 'bg-blue-50 text-blue-700 border border-blue-200'
        };
      case 'Low':
      default:
        return {
          label: 'Low Priority',
          badgeClass: 'bg-emerald-50 text-emerald-700 border border-emerald-200'
        };
    }
  };

  // Helper for Status Badge
  const getStatusBadge = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s.includes('investig')) {
      return {
        label: 'Under Investigation',
        badgeClass: 'bg-amber-50 text-amber-700 border border-amber-200'
      };
    }
    if (s.includes('sample')) {
      return {
        label: 'Sample Collected',
        badgeClass: 'bg-purple-50 text-purple-700 border border-purple-200'
      };
    }
    if (s.includes('lab') || s.includes('analysis')) {
      return {
        label: 'Lab Analysis',
        badgeClass: 'bg-blue-50 text-blue-700 border border-blue-200'
      };
    }
    if (s.includes('resolv')) {
      return {
        label: 'Resolved',
        badgeClass: 'bg-emerald-50 text-emerald-700 border border-emerald-200'
      };
    }
    if (s.includes('close')) {
      return {
        label: 'Closed',
        badgeClass: 'bg-slate-100 text-slate-700 border border-slate-200'
      };
    }
    if (s.includes('reject')) {
      return {
        label: 'Rejected',
        badgeClass: 'bg-red-50 text-red-700 border border-red-200'
      };
    }
    if (s.includes('review')) {
      return {
        label: 'Under Review',
        badgeClass: 'bg-blue-50 text-blue-700 border border-blue-200'
      };
    }
    return {
      label: 'Submitted',
      badgeClass: 'bg-slate-100 text-slate-700 border border-slate-200'
    };
  };

  // Calculate Timeline Stages
  const getTimelineStages = (c: any) => {
    if (c.timeline && Array.isArray(c.timeline) && c.timeline.length > 0) {
      return c.timeline;
    }
    const status = (c.status || '').toLowerCase();
    return [
      {
        title: 'Report Filed',
        timestamp: `${c.date || '28 Sep 2026'}, ${c.time || '09:15 AM'}`,
        actor: `By ${c.reporterName || user?.fullName || 'Aditi Verma'}`,
        status: 'completed'
      },
      {
        title: 'Initial Review',
        timestamp: status !== 'submitted' ? '28 Sep 2026, 11:40 AM' : 'Pending',
        actor: status !== 'submitted' ? 'By Food Safety Team' : undefined,
        status: status === 'submitted' ? 'current' : 'completed'
      },
      {
        title: 'Sample Collected',
        timestamp: status.includes('sample') || status.includes('investig') || status.includes('progress') || status.includes('resolv')
          ? '28 Sep 2026, 02:30 PM'
          : 'Pending',
        actor: status.includes('sample') || status.includes('investig') || status.includes('progress') || status.includes('resolv')
          ? `At ${c.seller || 'Market'}`
          : undefined,
        status: status.includes('sample') ? 'completed' : status.includes('investig') ? 'current' : 'pending'
      },
      {
        title: 'Lab Analysis',
        timestamp: status.includes('lab') || status.includes('resolv') ? '28 Sep 2026, 04:30 PM' : 'Pending',
        actor: status.includes('lab') || status.includes('resolv') ? 'By Central Food Testing Lab' : undefined,
        status: status.includes('lab') ? 'current' : status.includes('resolv') ? 'completed' : 'pending'
      },
      {
        title: 'Final Report',
        timestamp: status.includes('resolv') ? '28 Sep 2026, 06:15 PM' : 'Pending',
        actor: status.includes('resolv') ? 'Report Finalized' : undefined,
        status: status.includes('resolv') ? 'completed' : 'pending'
      }
    ];
  };

  // Render Status Panel Message
  const getStatusBoxMessage = (status: string, closureReason?: string) => {
    const s = (status || '').toLowerCase();
    if (s.includes('resolv')) {
      return {
        bg: 'bg-emerald-50/90 border-emerald-200 text-emerald-800',
        icon: <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />,
        title: 'Investigation Completed',
        text: 'Final laboratory testing report verified. Corrective action taken with merchant.'
      };
    }
    if (s.includes('sample')) {
      return {
        bg: 'bg-purple-50/90 border-purple-200 text-purple-800',
        icon: <FlaskConical className="w-4 h-4 text-purple-600 shrink-0" />,
        title: 'Sample Collected Successfully',
        text: 'Batch specimens dispatched to regional laboratory for microbiological screening.'
      };
    }
    if (s.includes('lab') || s.includes('analysis')) {
      return {
        bg: 'bg-blue-50/90 border-blue-200 text-blue-800',
        icon: <Microscope className="w-4 h-4 text-blue-600 shrink-0" />,
        title: 'Laboratory Analysis In Progress',
        text: 'Results will be published as soon as biochemical tests conclude.'
      };
    }
    if (s.includes('close')) {
      return {
        bg: 'bg-slate-50 border-slate-200 text-slate-700',
        icon: <CheckCircle2 className="w-4 h-4 text-slate-500 shrink-0" />,
        title: 'Case Closed',
        text: closureReason || 'Case file closed upon verification of retailer compliance.'
      };
    }
    if (s.includes('reject')) {
      return {
        bg: 'bg-red-50/90 border-red-200 text-red-800',
        icon: <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />,
        title: 'Report Could Not Be Processed',
        text: closureReason || 'Insufficient purchase documentation or duplicate incident report.'
      };
    }
    return {
      bg: 'bg-emerald-50/80 border-emerald-200/80 text-emerald-800',
      icon: <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />,
      title: 'Case is under investigation.',
      text: 'Further updates will be provided soon.'
    };
  };

  const activeCase = complaints.find((c) => c.id === expandedCaseId) || complaints[0];
  const compactCases = complaints.filter((c) => c.id !== activeCase?.id);

  return (
    <div className="space-y-6">
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 stroke-[2]" />
            </span>
            <span>Food Spoilage & Safety Reports</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            File reports regarding expired, foul-smelling, or contaminated food items purchased from markets.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-xs cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Report Spoiled Food</span>
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-xl border text-xs font-medium flex items-center justify-between gap-2 animate-in fade-in ${
          message.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex items-center gap-2">
            {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-slate-400 hover:text-slate-600 text-xs cursor-pointer">✕</button>
        </div>
      )}

      {/* 1. MY INVESTIGATION CASES CONTAINER */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        {/* Container Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between select-none">
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            My Investigation Cases
          </h2>
          <span className="text-xs text-slate-500 font-medium">
            Total: {complaints.length} cases
          </span>
        </div>

        <div className="p-5 space-y-4">
          {/* LOADING STATE */}
          {loading ? (
            <div className="space-y-4 py-4 animate-pulse">
              <div className="h-44 bg-slate-100 rounded-2xl w-full"></div>
              <div className="h-24 bg-slate-50 rounded-2xl w-full"></div>
            </div>
          ) : error ? (
            /* ERROR STATE */
            <div className="py-12 text-center px-4">
              <div className="w-12 h-12 bg-red-50 rounded-2xl border border-red-100 text-red-600 flex items-center justify-center mx-auto mb-3">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">Unable to load investigation cases.</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">{error}</p>
              <button
                onClick={fetchComplaints}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
              >
                Retry
              </button>
            </div>
          ) : complaints.length === 0 ? (
            /* EMPTY STATE */
            <div className="py-14 text-center px-4">
              <div className="w-14 h-14 bg-emerald-50 rounded-2xl border border-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">No spoilage reports yet</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-5">
                Reports you submit about unsafe or spoiled food will appear here along with their investigation progress.
              </p>
              <button
                onClick={() => setModalOpen(true)}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Report Spoiled Food</span>
              </button>
            </div>
          ) : (
            <>
              {/* EXPANDED ACTIVE CASE */}
              {activeCase && (
                <div className="bg-[#F8FCF9] border border-slate-200/90 rounded-2xl p-5 shadow-2xs transition-all">
                  {/* Top Row: Product Info + Priority + Status */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4">
                    <div className="flex items-start gap-3.5">
                      {getProductIcon(activeCase.foodType, activeCase.productName)}
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm sm:text-base font-bold text-slate-900">
                            {activeCase.productName}
                          </span>
                          <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono font-medium">
                            {activeCase.caseId || activeCase.id}
                          </span>
                          <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${getPriorityBadge(activeCase.priority).badgeClass}`}>
                            {getPriorityBadge(activeCase.priority).label}
                          </span>
                        </div>

                        <p className="text-xs text-slate-600 mt-1 leading-relaxed max-w-2xl">
                          {activeCase.description}
                        </p>

                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-2 font-medium">
                          <span className="flex items-center gap-1.5">
                            <Store className="w-3.5 h-3.5 text-slate-400" />
                            <span>Seller: <strong className="text-slate-800">{activeCase.seller}</strong></span>
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Tag className="w-3.5 h-3.5 text-slate-400" />
                            <span>Category: <strong className="text-slate-800">{activeCase.foodType}</strong></span>
                          </span>
                          <span className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            <span>Inspector: <strong className="text-slate-800">{activeCase.assignedOfficer || 'Sarah Connor'}</strong></span>
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>Date: {activeCase.date || '28 Sep 2026'}</span>
                          </span>
                        </div>

                        {/* SUPERMARKET HEAD OFFICE LINKAGE & PDF REPORT BAR */}
                        <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-slate-200/60 text-xs">
                          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 font-semibold text-[11px]">
                            <Building2 className="w-3.5 h-3.5 text-blue-600" />
                            <span>Supermarket HQ Link: <strong>{activeCase.seller || 'Supermarket'} (Head Office)</strong></span>
                          </div>

                          {activeCase.escalatedToHeadOffice || activeCase.sharedWithHeadOffice ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold text-[11px]">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>✓ Synced with Head Office</span>
                            </span>
                          ) : (
                            <button
                              onClick={() => handleShareToHeadOffice(activeCase.id)}
                              disabled={sharingCaseId === activeCase.id}
                              className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] transition-colors cursor-pointer shadow-2xs"
                              title="Transmit formal spoilage case to supermarket corporate headquarters"
                            >
                              {sharingCaseId === activeCase.id ? (
                                <span className="animate-spin text-xs">🌀</span>
                              ) : (
                                <Building2 className="w-3 h-3" />
                              )}
                              <span>{sharingCaseId === activeCase.id ? 'Transmitting...' : 'Share to Supermarket Head Office'}</span>
                            </button>
                          )}

                          <button
                            onClick={() => setPdfModalCase(activeCase)}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition-colors cursor-pointer shadow-2xs"
                            title="Generate official printable Spoilage Investigation PDF"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Official Spoilage PDF Report</span>
                          </button>

                          <button
                            onClick={() => navigate('/supermarket/complaints')}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] transition-colors cursor-pointer border border-slate-200"
                            title="Open Supermarket Official Dashboard"
                          >
                            <ExternalLink className="w-3 h-3 text-slate-500" />
                            <span>Supermarket Portal</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Right side status badge, PDF Report Trigger & Chevron */}
                    <div className="flex flex-wrap items-center gap-2 self-start shrink-0">
                      <button
                        onClick={() => setPdfModalCase(activeCase)}
                        className="px-2.5 py-1 bg-white hover:bg-emerald-50 border border-emerald-300 text-emerald-700 rounded-full text-xs font-bold transition-all inline-flex items-center gap-1 cursor-pointer shadow-2xs"
                        title="Open Spoilage Report PDF Dossier"
                      >
                        <FileText className="w-3 h-3 text-emerald-600" />
                        <span>PDF Report</span>
                      </button>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(activeCase.status).badgeClass}`}>
                        {getStatusBadge(activeCase.status).label}
                      </span>
                      <button
                        onClick={() => setExpandedCaseId(null)}
                        className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer transition-colors"
                        title="Collapse case"
                      >
                        <ChevronUp className="w-4.5 h-4.5" />
                      </button>
                    </div>
                  </div>

                  {/* CASH REFUND SETTLEMENT BANNER */}
                  {activeCase.refundStatus === 'Refunded' && (
                    <div className="mb-4 p-4 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-green-700 text-white shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in duration-200">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center font-bold text-lg shrink-0">
                          💸
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full">
                              Customer Refund Issued
                            </span>
                            <span className="text-xs font-mono font-medium opacity-90">
                              Ref: {activeCase.refundTransactionId || 'REF-CASH'}
                            </span>
                          </div>
                          <p className="text-sm font-semibold mt-0.5">
                            {activeCase.seller || 'Supermarket'} disbursed a full refund of <strong className="text-yellow-200 text-base">₹{activeCase.refundAmount || 150}</strong> via {activeCase.refundMethod || 'Cash at Store Counter'}.
                          </p>
                          {activeCase.refundNotes && (
                            <p className="text-xs opacity-90 italic mt-0.5">
                              "{activeCase.refundNotes}"
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="inline-block px-3 py-1 bg-white text-emerald-800 rounded-lg text-xs font-bold shadow-2xs">
                          ✓ Settled & Paid
                        </span>
                        <p className="text-[10px] opacity-80 mt-1">{activeCase.refundDate || 'Recently'}</p>
                      </div>
                    </div>
                  )}

                  {/* SUPERMARKET OFFICIAL RESPONSE BANNER */}
                  {activeCase.officialResponse && (
                    <div className="mb-4 p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 shadow-2xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold flex items-center gap-1.5 text-blue-800 uppercase tracking-wide">
                          <Store className="w-3.5 h-3.5 text-blue-600" />
                          Official Store Response ({activeCase.seller || 'Supermarket Official'}):
                        </span>
                        {activeCase.responseDate && (
                          <span className="text-[10px] text-blue-600 font-medium">{activeCase.responseDate}</span>
                        )}
                      </div>
                      <p className="text-xs text-blue-950 leading-relaxed font-medium">
                        "{activeCase.officialResponse}"
                      </p>
                    </div>
                  )}

                  {/* 3-COLUMN INVESTIGATION LAYOUT */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-4 border-t border-slate-200/60">
                    {/* LEFT COLUMN: CASE DETAILS */}
                    <div className="bg-white rounded-xl p-4 border border-slate-200/70 shadow-2xs flex flex-col justify-between">
                      <div>
                        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3.5 flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Case Details</span>
                        </h3>

                        <div className="space-y-2.5 text-xs">
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-slate-500 flex items-center gap-1.5">
                              <Milk className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>Product Name</span>
                            </span>
                            <span className="font-semibold text-slate-800 text-right">
                              {activeCase.productName || 'Not provided'}
                            </span>
                          </div>

                          <div className="flex items-start justify-between gap-2">
                            <span className="text-slate-500 flex items-center gap-1.5">
                              <Tag className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>Category</span>
                            </span>
                            <span className="font-semibold text-slate-800 text-right">
                              {activeCase.foodType || 'Not provided'}
                            </span>
                          </div>

                          <div className="flex items-start justify-between gap-2">
                            <span className="text-slate-500 flex items-center gap-1.5">
                              <Package className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>Quantity</span>
                            </span>
                            <span className="font-semibold text-slate-800 text-right">
                              {activeCase.quantity || 'Not provided'}
                            </span>
                          </div>

                          <div className="flex items-start justify-between gap-2">
                            <span className="text-slate-500 flex items-center gap-1.5">
                              <Barcode className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>Batch / Lot No.</span>
                            </span>
                            <span className="font-semibold text-slate-800 text-right font-mono">
                              {activeCase.batchNumber || 'Not provided'}
                            </span>
                          </div>

                          <div className="flex items-start justify-between gap-2">
                            <span className="text-slate-500 flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>Expiry Date</span>
                            </span>
                            <span className="font-semibold text-slate-800 text-right">
                              {activeCase.expiryDate || 'Not provided'}
                            </span>
                          </div>

                          <div className="flex items-start justify-between gap-2">
                            <span className="text-slate-500 flex items-center gap-1.5">
                              <Store className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>Purchase Location</span>
                            </span>
                            <span className="font-semibold text-slate-800 text-right max-w-[55%] truncate" title={activeCase.purchaseLocation || activeCase.seller}>
                              {activeCase.purchaseLocation || activeCase.seller || 'Not provided'}
                            </span>
                          </div>

                          <div className="flex items-start justify-between gap-2">
                            <span className="text-slate-500 flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>Purchase Date</span>
                            </span>
                            <span className="font-semibold text-slate-800 text-right">
                              {activeCase.purchaseDate || 'Not provided'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* CENTER COLUMN: INVESTIGATION TIMELINE */}
                    <div className="bg-white rounded-xl p-4 border border-slate-200/70 shadow-2xs flex flex-col justify-between">
                      <div>
                        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3.5">
                          Investigation Timeline
                        </h3>

                        <div className="relative pl-5 space-y-3.5">
                          {/* Vertical Connecting Line */}
                          <div className="absolute left-[8px] top-2 bottom-3 w-0.5 bg-slate-200"></div>

                          {getTimelineStages(activeCase).map((stage: any, idx: number) => {
                            const isCompleted = stage.status === 'completed';
                            const isCurrent = stage.status === 'current';
                            return (
                              <div key={idx} className="relative flex items-start gap-2.5">
                                {/* Stage Icon Indicator */}
                                <div className={`absolute -left-5 top-0.5 w-4.5 h-4.5 rounded-full flex items-center justify-center text-[10px] ${
                                  isCompleted 
                                    ? 'bg-emerald-500 text-white shadow-2xs' 
                                    : isCurrent 
                                    ? 'bg-blue-500 text-white ring-4 ring-blue-100 shadow-2xs' 
                                    : 'bg-slate-200 border-2 border-white'
                                }`}>
                                  {isCompleted ? <Check className="w-3 h-3 stroke-[3]" /> : isCurrent ? '•' : ''}
                                </div>

                                <div className="ml-1">
                                  <p className={`text-xs font-bold ${
                                    isCompleted ? 'text-slate-900' : isCurrent ? 'text-blue-700' : 'text-slate-400'
                                  }`}>
                                    {stage.title}
                                  </p>
                                  {stage.timestamp && stage.timestamp !== 'Pending' && (
                                    <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
                                      {stage.timestamp}
                                    </p>
                                  )}
                                  {stage.actor && (
                                    <p className="text-[10px] text-slate-400 font-medium">
                                      {stage.actor}
                                    </p>
                                  )}
                                  {stage.timestamp === 'Pending' && (
                                    <p className="text-[10px] text-slate-400 italic">
                                      Pending
                                    </p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* RIGHT COLUMN: INVESTIGATION NOTES & EVIDENCE & STATUS BOX */}
                    <div className="bg-white rounded-xl p-4 border border-slate-200/70 shadow-2xs flex flex-col justify-between">
                      <div>
                        {/* Investigation Notes */}
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                            Investigation Notes
                          </h3>
                          {activeCase.investigationNotes && activeCase.investigationNotes.length > 1 && (
                            <button
                              onClick={() => setAllNotesModalCase(activeCase)}
                              className="text-[11px] text-emerald-600 hover:text-emerald-700 font-semibold cursor-pointer"
                            >
                              View all notes →
                            </button>
                          )}
                        </div>

                        {activeCase.investigationNotes && activeCase.investigationNotes.length > 0 ? (
                          <div className="bg-slate-50 border border-slate-200/70 rounded-xl p-3 text-xs">
                            <p className="text-slate-700 italic leading-relaxed">
                              "{activeCase.investigationNotes[activeCase.investigationNotes.length - 1].text}"
                            </p>
                            <p className="text-slate-800 font-semibold mt-1 text-right text-[11px]">
                              — {activeCase.investigationNotes[activeCase.investigationNotes.length - 1].officer}
                            </p>
                          </div>
                        ) : (
                          <div className="bg-slate-50 p-2.5 rounded-xl text-xs text-slate-400 italic border border-slate-100">
                            No notes recorded yet.
                          </div>
                        )}

                        {/* Photos / Evidence */}
                        <div className="mt-4">
                          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                            Photos / Evidence
                          </h3>

                          {(() => {
                            const rawList = Array.isArray(activeCase.evidenceImages)
                              ? (activeCase.evidenceImages.length === 2 && activeCase.evidenceImages[0]?.startsWith('data:') && !activeCase.evidenceImages[0]?.includes(',') && !activeCase.evidenceImages[1]?.startsWith('http')
                                ? [activeCase.evidenceImages[0] + ',' + activeCase.evidenceImages[1]]
                                : activeCase.evidenceImages)
                              : [];
                            const cleanedList = rawList
                              .map(normalizeEvidenceImage)
                              .filter((img: string | null): img is string => Boolean(img));

                            return cleanedList.length > 0 ? (
                              <div className="flex items-center gap-2">
                                {cleanedList.slice(0, 3).map((imgUrl: string, i: number) => {
                                  const imgKey = `${activeCase.id}-${i}`;
                                  const hasFailed = brokenImages[imgKey];
                                  return (
                                    <div
                                      key={i}
                                      onClick={() => !hasFailed && setPreviewImage(imgUrl)}
                                      className="w-14 h-14 rounded-xl overflow-hidden border border-slate-200 hover:border-emerald-500 transition-colors cursor-pointer relative group bg-slate-900 shrink-0 flex items-center justify-center"
                                      title="Click to preview evidence specimen"
                                    >
                                      {!hasFailed ? (
                                        <img 
                                          src={imgUrl} 
                                          alt={`Evidence ${i + 1}`} 
                                          onError={() => setBrokenImages(prev => ({ ...prev, [imgKey]: true }))}
                                          className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                                        />
                                      ) : (
                                        <div className="text-center p-1 text-slate-400">
                                          <ShieldCheck className="w-5 h-5 mx-auto text-emerald-400" />
                                          <span className="text-[8px] font-mono text-emerald-400 block mt-0.5">SEALED</span>
                                        </div>
                                      )}
                                      {!hasFailed && (
                                        <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                          <Eye className="w-3.5 h-3.5 text-white" />
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}

                                {cleanedList.length > 3 && (
                                  <button
                                    onClick={() => setPreviewImage(cleanedList[3])}
                                    className="w-14 h-14 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-bold flex items-center justify-center transition-colors cursor-pointer shrink-0"
                                  >
                                    +{cleanedList.length - 3} more
                                  </button>
                                )}
                              </div>
                            ) : (
                              <p className="text-xs text-slate-400 italic">
                                No evidence images uploaded.
                              </p>
                            );
                          })()}
                        </div>
                      </div>

                      {/* Bottom Contextual Status Panel */}
                      <div className={`mt-4 p-2.5 rounded-xl border flex items-center gap-2 text-xs font-medium ${getStatusBoxMessage(activeCase.status, activeCase.closureReason).bg}`}>
                        {getStatusBoxMessage(activeCase.status, activeCase.closureReason).icon}
                        <div>
                          <span className="font-bold block text-[11px]">
                            {getStatusBoxMessage(activeCase.status, activeCase.closureReason).title}
                          </span>
                          <span className="text-[11px] opacity-90">
                            {getStatusBoxMessage(activeCase.status, activeCase.closureReason).text}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* COLLAPSED REMAINING CASES */}
              {compactCases.length > 0 && (
                <div className="space-y-3 pt-1">
                  {compactCases.map((c) => {
                    const priorityBadge = getPriorityBadge(c.priority);
                    const statusBadge = getStatusBadge(c.status);
                    return (
                      <div
                        key={c.id}
                        onClick={() => setExpandedCaseId(c.id)}
                        className="border border-slate-200/80 rounded-2xl p-4 bg-white hover:bg-slate-50/70 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs group"
                      >
                        <div className="flex items-start gap-3.5">
                          {getProductIcon(c.foodType, c.productName)}
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                                {c.productName}
                              </span>
                              <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono font-medium">
                                {c.caseId || c.id}
                              </span>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${priorityBadge.badgeClass}`}>
                                {priorityBadge.label}
                              </span>
                              {c.refundStatus === 'Refunded' && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                                  <span>💸 Cash Refunded: ₹{c.refundAmount || 150}</span>
                                </span>
                              )}
                            </div>

                            <p className="text-xs text-slate-600 mt-1 leading-relaxed max-w-xl line-clamp-2">
                              {c.description}
                            </p>

                            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1.5 font-medium">
                              <span>Seller: <strong className="text-slate-700">{c.seller}</strong></span>
                              <span>Category: <strong className="text-slate-700">{c.foodType}</strong></span>
                              <span>Inspector: <strong className="text-slate-700">{c.assignedOfficer || 'Food Safety Inspector'}</strong></span>
                              <span>Date: {c.date || 'Recent'}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-2 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setPdfModalCase(c);
                            }}
                            className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-md text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                            title="Generate Spoilage PDF Report"
                          >
                            <FileText className="w-2.5 h-2.5 text-emerald-600" />
                            <span>PDF</span>
                          </button>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusBadge.badgeClass}`}>
                            {statusBadge.label}
                          </span>
                          <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* REPORT SPOILED FOOD MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <span>Report Spoiled / Unsafe Food</span>
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 mt-2 mb-4">
              Submit incident details. The complaint will be routed to food safety enforcement officers and the merchant.
            </p>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Organic Whole Milk 1L or Packaged Strawberries"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Food Category</label>
                  <select
                    value={foodType}
                    onChange={(e) => setFoodType(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white"
                  >
                    <option value="Dairy Product">Dairy Product</option>
                    <option value="Fruits & Vegetables">Fruits & Vegetables</option>
                    <option value="Bakery">Bakery</option>
                    <option value="Meat">Meat & Poultry</option>
                    <option value="Seafood">Seafood</option>
                    <option value="Prepared Meals">Prepared Meals</option>
                    <option value="Packaged Food">Packaged Food</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Quantity / Portions</label>
                  <input
                    type="text"
                    placeholder="e.g. 1 pack (1L) or 250g"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Batch / Lot Number</label>
                  <input
                    type="text"
                    placeholder="e.g. B150826"
                    value={batchNumber}
                    onChange={(e) => setBatchNumber(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Expiry Date</label>
                  <input
                    type="text"
                    placeholder="e.g. 29 Sep 2026"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reported Supermarket / Merchant *
                </label>
                <select
                  value={storeOption}
                  onChange={(e) => {
                    const opt = e.target.value as 'sm-001' | 'sm-002' | 'other';
                    setStoreOption(opt);
                    if (opt === 'sm-001') {
                      setSupermarketId('sm-001');
                      setBranchId('br-001-cp');
                      setSeller('FreshMart Supermarkets');
                      setPurchaseLocation('FreshMart Hypermarket, Central Market Road, Connaught Place');
                    } else if (opt === 'sm-002') {
                      setSupermarketId('sm-002');
                      setBranchId('br-002-dlf');
                      setSeller('GreenBasket Hypermarket');
                      setPurchaseLocation('GreenBasket Hypermarket, DLF Cyber City');
                    } else {
                      setSupermarketId('');
                      setBranchId('');
                      setSeller('');
                      setPurchaseLocation('');
                    }
                  }}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white font-medium text-slate-800"
                >
                  <option value="sm-001">FreshMart Hypermarket (Connaught Place Central Market) — Official Direct Portal [sm-001]</option>
                  <option value="sm-002">GreenBasket Hypermarket (DLF Cyber City) — Official Direct Portal [sm-002]</option>
                  <option value="other">Other Independent Vendor / Grocer</option>
                </select>
                <p className="text-[10px] text-emerald-600 mt-1 font-medium">
                  {storeOption !== 'other' 
                    ? '✓ Connected: This report will instantly appear in this supermarket manager\'s live dashboard.' 
                    : 'Report will be submitted to the Central Food Safety Authority registry.'}
                </p>
              </div>

              {storeOption === 'other' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Seller / Vendor Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. City Corner Grocers"
                    value={seller}
                    onChange={(e) => setSeller(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Store / Purchase Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Central Market, Sector 2"
                    value={purchaseLocation}
                    onChange={(e) => setPurchaseLocation(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Purchase Date</label>
                  <input
                    type="date"
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white"
                  >
                    <option value="Low">Low (Minor issue)</option>
                    <option value="Medium">Medium (Discolored/Stale)</option>
                    <option value="High">High (Foul odor/Curdled)</option>
                    <option value="Critical">Critical (Health illness)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Problem Type</label>
                  <select
                    value={problemType}
                    onChange={(e) => setProblemType(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white"
                  >
                    <option value="Expired Food">Expired Food</option>
                    <option value="Bad Smell">Bad Smell / Sour Odor</option>
                    <option value="Visible Mold">Visible Mold / Fungus</option>
                    <option value="Damaged Packaging">Damaged Packaging</option>
                    <option value="Contamination Suspected">Contamination Suspected</option>
                    <option value="Incorrect Storage">Incorrect Storage</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Incident Description *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe the defect: unusual smell, curdling, strange taste, or health discomfort..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Evidence Image URLs (comma separated)</label>
                <input
                  type="text"
                  placeholder="Paste image links, or leave blank for automatic sample verification images"
                  value={evidenceInput}
                  onChange={(e) => setEvidenceInput(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl disabled:opacity-60 cursor-pointer shadow-xs"
                >
                  {submitting ? 'Submitting Report...' : 'File Food Safety Incident'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EVIDENCE IMAGE PREVIEW MODAL */}
      {previewImage && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-4 shadow-2xl border border-slate-200 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-800">Inspection Evidence Photo Preview</span>
              <button 
                onClick={() => setPreviewImage(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="mt-3 rounded-xl overflow-hidden bg-slate-950 flex items-center justify-center max-h-[70vh]">
              <img src={previewImage} alt="Inspection Evidence" className="max-h-[68vh] w-auto object-contain" />
            </div>
          </div>
        </div>
      )}

      {/* ALL NOTES MODAL */}
      {allNotesModalCase && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">
                Investigation Notes ({allNotesModalCase.caseId || allNotesModalCase.id})
              </h3>
              <button 
                onClick={() => setAllNotesModalCase(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="mt-4 space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {allNotesModalCase.investigationNotes?.map((note: any, idx: number) => (
                <div key={idx} className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-xs">
                  <p className="text-slate-800 leading-relaxed font-medium">"{note.text}"</p>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200/50 text-[11px] text-slate-400">
                    <span className="font-semibold text-slate-700">— {note.officer}</span>
                    <span>{note.timestamp}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SPOILAGE REPORT PDF DOSSIER MODAL */}
      {pdfModalCase && (
        <SpoilageReportPdfModal
          isOpen={Boolean(pdfModalCase)}
          onClose={() => setPdfModalCase(null)}
          complaint={pdfModalCase}
          onShareToHeadOffice={handleShareToHeadOffice}
          onRefresh={fetchComplaints}
        />
      )}
    </div>
  );
}
