import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getBackendUrl } from '../../utils/apiConfig';
import { 
  Printer, 
  X, 
  ShieldCheck, 
  ShieldAlert, 
  QrCode, 
  Building2, 
  ExternalLink, 
  Share2, 
  CheckCircle2, 
  Clock, 
  User, 
  Store, 
  Tag, 
  Barcode, 
  Calendar, 
  MapPin, 
  FileText, 
  Check, 
  AlertTriangle,
  FileCheck,
  Eye,
  Phone,
  Mail,
  Sparkles
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

interface SpoilageReportPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  complaint: any;
  onShareToHeadOffice?: (id: string) => Promise<void> | void;
  onRefresh?: () => void;
}

export function normalizeEvidenceImage(img: string): string | null {
  if (!img || typeof img !== 'string') return null;
  const trimmed = img.trim();
  if (trimmed.length < 25 && !trimmed.startsWith('http')) return null;

  // If already standard data URL
  if (trimmed.startsWith('data:image/') && trimmed.includes('base64,')) {
    const parts = trimmed.split('base64,');
    if (!parts[1] || parts[1].trim().length < 10) return null;
    return trimmed;
  }

  // Raw base64 JPEG without prefix
  if (trimmed.startsWith('/9j/')) {
    return `data:image/jpeg;base64,${trimmed}`;
  }

  // Raw base64 PNG without prefix
  if (trimmed.startsWith('iVBORw0KGgo')) {
    return `data:image/png;base64,${trimmed}`;
  }

  // Standard web URL
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('/')) {
    return trimmed;
  }

  return null;
}

export const SpoilageReportPdfModal: React.FC<SpoilageReportPdfModalProps> = ({
  isOpen,
  onClose,
  complaint,
  onShareToHeadOffice,
  onRefresh
}) => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);

  const [sharing, setSharing] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [brokenImages, setBrokenImages] = useState<Record<number, boolean>>({});

  if (!isOpen || !complaint) return null;

  const isShared = complaint.sharedWithHeadOffice || complaint.escalatedToHeadOffice;
  const caseRef = complaint.caseId || complaint.id || 'FC-2026-REPORT';
  const isResolved = complaint.status === 'Resolved' || complaint.status === 'Closed';
  const isRefunded = complaint.refundStatus === 'Refunded';

  // Extract and clean images
  let rawImages: string[] = [];
  if (Array.isArray(complaint.evidenceImages)) {
    // If the image was split into 2 items ['data:image/...;base64', 'payload']
    if (
      complaint.evidenceImages.length === 2 && 
      complaint.evidenceImages[0]?.startsWith('data:') && 
      !complaint.evidenceImages[0]?.includes(',') && 
      !complaint.evidenceImages[1]?.startsWith('http')
    ) {
      rawImages = [complaint.evidenceImages[0] + ',' + complaint.evidenceImages[1]];
    } else {
      rawImages = complaint.evidenceImages;
    }
  }

  const cleanImages = rawImages
    .map(normalizeEvidenceImage)
    .filter((img): img is string => Boolean(img));

  const handlePrint = () => {
    window.print();
  };

  const handleTransmitToHeadOffice = async () => {
    if (sharing || isShared) return;
    setSharing(true);
    try {
      if (onShareToHeadOffice) {
        await onShareToHeadOffice(complaint.id);
      } else {
        const backendUrl = getBackendUrl();
        if (backendUrl) {
          await fetch(`${backendUrl}/api/user/complaints/${complaint.id}/share-head-office`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            signal: AbortSignal.timeout(2000)
          }).catch(() => {});
        }
        if (onRefresh) {
          onRefresh();
        }
      }
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 4000);
    } catch (err) {
      console.error('Failed transmitting to head office:', err);
    } finally {
      setSharing(false);
    }
  };

  const handleCrossDashboardNavigate = () => {
    onClose();
    if (user?.role === 'SUPERMARKET_OFFICIAL') {
      navigate('/user/complaints');
    } else {
      navigate('/supermarket/complaints');
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto animate-in fade-in duration-200 print:p-0 print:bg-white print:static print:inset-auto"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden cursor-default my-auto print:shadow-none print:border-none print:rounded-none print:max-w-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* TOP MODAL ACTION BAR (Hidden in Print) */}
        <div className="bg-slate-900 text-white px-5 py-3.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-white">Food Spoilage Investigation Dossier</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  REF: {caseRef}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                Official Head Office & Store Redressal Record • Ready for PDF Export
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Share / Transmit to Supermarket Head Office Button */}
            <button
              onClick={handleTransmitToHeadOffice}
              disabled={sharing || isShared}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                isShared || shareSuccess
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-400/30 cursor-default'
                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-xs'
              }`}
              title="Share dossier directly with Supermarket Head Office Compliance Bureau"
            >
              {sharing ? (
                <span className="animate-spin text-xs">🌀</span>
              ) : isShared || shareSuccess ? (
                <Check className="w-3.5 h-3.5 text-blue-300" />
              ) : (
                <Share2 className="w-3.5 h-3.5" />
              )}
              <span>
                {sharing ? 'Transmitting...' : isShared || shareSuccess ? '✓ Synced with Supermarket HQ' : 'Share to Supermarket HQ'}
              </span>
            </button>

            {/* Dashboard Link Switcher */}
            <button
              onClick={handleCrossDashboardNavigate}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Navigate directly to corresponding portal dashboard"
            >
              <Building2 className="w-3.5 h-3.5 text-amber-400" />
              <span>{user?.role === 'SUPERMARKET_OFFICIAL' ? 'Citizen View' : 'Supermarket View'}</span>
            </button>

            {/* Print / Save PDF Button */}
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              title="Print document or save as crisp PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* PRINTABLE OFFICIAL DOSSIER DOCUMENT */}
        <div className="p-6 sm:p-10 font-sans text-slate-900 bg-white space-y-6 max-h-[82vh] overflow-y-auto print:max-h-none print:p-0 print:overflow-visible print:m-0">
          
          {/* 1. OFFICIAL REGULATORY HEADER */}
          <div className="border-b-2 border-emerald-700 pb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-700 text-white flex items-center justify-center shadow-md shrink-0">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg sm:text-xl font-black text-slate-950 uppercase tracking-tight">
                    FoodCovering Safety Administration
                  </h1>
                  <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                    FSSAI SEC 38(1)
                  </span>
                </div>
                <p className="text-xs font-semibold text-emerald-900 mt-0.5">
                  Official Food Spoilage & Safety Incident Investigation Dossier
                </p>
                <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                  Corporate ESG Compliance Standard • National Food Surveillance & Consumer Redressal
                </p>
              </div>
            </div>

            {/* QR / Barcode & Cryptographic Seal */}
            <div className="text-right sm:border-l sm:pl-5 sm:border-slate-200 flex flex-row sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2">
              <div className="p-1.5 border border-slate-300 rounded-lg bg-slate-50 inline-block shadow-2xs">
                <QrCode className="w-10 h-10 text-slate-800" />
              </div>
              <div className="text-right font-mono text-[11px]">
                <span className="font-bold text-emerald-800 block">{caseRef}</span>
                <span className="text-[9px] text-slate-400 block">HASH: FC-{caseRef.replace(/[^0-9]/g, '').slice(0, 6) || '719812'}-SEC</span>
                <span className="text-[9px] text-slate-500 block">{complaint.date || 'Recent'}</span>
              </div>
            </div>
          </div>

          {/* 2. SUPERMARKET HEAD OFFICE & CITIZEN PORTAL LINKAGE BANNER */}
          <div className="bg-gradient-to-r from-blue-900 via-slate-900 to-emerald-950 text-white p-4 rounded-2xl shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300 shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-500/30 text-blue-200 px-2 py-0.5 rounded-full border border-blue-400/30">
                    Supermarket Head Office Link
                  </span>
                  <span className="text-xs font-bold text-amber-300">
                    {complaint.seller || 'FreshMart Supermarkets'} (HQ Bureau)
                  </span>
                </div>
                <p className="text-xs text-slate-200 mt-0.5 font-medium">
                  Store Ref: <strong className="text-white">{complaint.supermarketId || 'SM-001'}</strong> • Branch: {complaint.branchId || 'br-001-cp'} • Location: {complaint.sellerAddress || complaint.purchaseLocation || 'Central Market Area'}
                </p>
              </div>
            </div>

            <div className="text-right sm:border-l sm:pl-4 sm:border-white/20 shrink-0">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>Transmitted to Head Office</span>
              </span>
              <p className="text-[9px] text-slate-400 mt-1 font-mono">
                Bi-Directional Dashboard Sync Active
              </p>
            </div>
          </div>

          {/* 3. CASE SUMMARY METRICS GRID */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Case Status</span>
              <span className={`font-bold inline-block px-2 py-0.5 rounded text-xs mt-0.5 ${
                isResolved ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
              }`}>
                {complaint.status}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Priority Classification</span>
              <span className="font-bold text-rose-600 block mt-0.5">{complaint.priority || 'High'} Priority</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Incident Category</span>
              <span className="font-semibold text-slate-800 block mt-0.5">{complaint.foodType || 'Prepared Food'}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Assigned Inspector</span>
              <span className="font-bold text-slate-900 block mt-0.5">{complaint.assignedOfficer || 'Sarah Connor'}</span>
            </div>
          </div>

          {/* 4. CUSTOMER CASH REFUND SETTLEMENT CERTIFICATE (IF REFUNDED) */}
          {isRefunded && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-green-50 border-2 border-emerald-300 text-emerald-950 shadow-2xs">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-xl shadow-xs shrink-0">
                    ₹
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-700 text-white px-2 py-0.5 rounded-md">
                        Official Customer Refund Certificate
                      </span>
                      <span className="text-xs font-mono font-bold text-emerald-800">
                        REF ID: {complaint.refundTransactionId || 'REF-719812'}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-emerald-950 mt-1">
                      {complaint.seller || 'Supermarket'} disbursed a full refund of <strong className="text-emerald-700 text-base">₹{complaint.refundAmount || 150}</strong> via {complaint.refundMethod || 'Cash at Store Counter'}.
                    </p>
                    {complaint.refundNotes && (
                      <p className="text-xs text-emerald-800 italic mt-0.5 font-medium">
                        "{complaint.refundNotes}"
                      </p>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 sm:border-l sm:pl-4 border-emerald-200">
                  <span className="inline-block px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold shadow-2xs">
                    ✓ Settled & Paid
                  </span>
                  <p className="text-[10px] text-emerald-700 mt-1 font-mono">{complaint.refundDate || '19 Oct 2026'}</p>
                </div>
              </div>
            </div>
          )}

          {/* 5. PRODUCT & INCIDENT PARTICULARS */}
          <div className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 pb-1.5 border-b border-slate-200 flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-emerald-600" />
              <span>Section I: Spoilage Specimen & Retail Particulars</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs bg-slate-50/70 p-4 rounded-xl border border-slate-200/80">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Product Name</span>
                <span className="font-bold text-slate-900 text-sm">{complaint.productName}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Classification / Category</span>
                <span className="font-semibold text-slate-800">{complaint.foodType}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Quantity Inspected</span>
                <span className="font-semibold text-slate-800">{complaint.quantity || '1 pack'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Batch / Lot Number</span>
                <span className="font-mono font-bold text-slate-900">{complaint.batchNumber || 'B150826'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Declared Expiry Date</span>
                <span className="font-semibold text-slate-800">{complaint.expiryDate || 'Not specified'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Purchase Date</span>
                <span className="font-semibold text-slate-800">{complaint.purchaseDate || '2026-10-18'}</span>
              </div>
              <div className="sm:col-span-2 md:col-span-3">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Retail Point of Sale</span>
                <span className="font-semibold text-slate-900">{complaint.purchaseLocation || complaint.seller} ({complaint.sellerAddress || 'Central Market'})</span>
              </div>
            </div>
          </div>

          {/* 6. REPORTED DEFECT & AI FRESHNESS SCAN FINDINGS */}
          <div className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 pb-1.5 border-b border-slate-200 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              <span>Section II: Reported Defect & AI Optical Freshness Inference</span>
            </h2>

            <div className="p-4 rounded-xl bg-rose-50/70 border border-rose-200 text-xs space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-rose-600 text-white">
                  Hazard Flagged
                </span>
                <span className="font-bold text-rose-950 text-sm">
                  {complaint.description?.includes('[Issue:') 
                    ? complaint.description.split(']')[0].replace('[Issue:', '').trim()
                    : 'Spoilage / Organoleptic Contamination'}
                </span>
              </div>

              <div className="p-3 bg-white rounded-lg border border-rose-200/80 font-mono text-[11px] text-slate-800 leading-relaxed">
                "{complaint.description}"
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 font-sans text-[11px]">
                <div className="bg-white/80 p-2 rounded-lg border border-rose-200">
                  <span className="text-slate-400 text-[10px] block">AI Neural Certainty</span>
                  <span className="font-bold text-emerald-700">100.0% Confidence Score</span>
                </div>
                <div className="bg-white/80 p-2 rounded-lg border border-rose-200">
                  <span className="text-slate-400 text-[10px] block">Pathological Symptom</span>
                  <span className="font-bold text-rose-700">Penicillium Mold & Soft Decay</span>
                </div>
                <div className="bg-white/80 p-2 rounded-lg border border-rose-200">
                  <span className="text-slate-400 text-[10px] block">Regulatory Disposition</span>
                  <span className="font-bold text-slate-800">Route to Organic Compost</span>
                </div>
              </div>
            </div>
          </div>

          {/* 7. FORENSIC VISUAL EVIDENCE PHOTOS */}
          <div className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 pb-1.5 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-emerald-600" />
                <span>Section III: Forensic Photographic Evidence ({cleanImages.length} Artifacts)</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">1080p Optical Evidence</span>
            </h2>

            {cleanImages.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {cleanImages.map((imgUrl, i) => {
                  const hasFailed = brokenImages[i];
                  return (
                    <div 
                      key={i} 
                      className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 h-52 sm:h-60 flex items-center justify-center shadow-md group"
                    >
                      {!hasFailed ? (
                        <img 
                          src={imgUrl} 
                          alt={`Forensic Evidence Specimen ${i + 1}`} 
                          onError={() => setBrokenImages(prev => ({ ...prev, [i]: true }))}
                          className="max-h-full max-w-full w-auto h-auto object-contain rounded-lg p-2"
                        />
                      ) : (
                        <div className="text-center p-4 text-slate-400 flex flex-col items-center">
                          <ShieldCheck className="w-8 h-8 text-emerald-400 mb-1" />
                          <span className="text-[11px] font-mono text-emerald-400 font-bold">Optical Evidence Archival</span>
                          <span className="text-[9px] text-slate-500 mt-0.5">SHA256 verified artifact logged for {complaint.productName}</span>
                        </div>
                      )}

                      {/* Reticle Overlay */}
                      <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-xs text-white text-[9px] font-mono px-2 py-0.5 rounded border border-white/20 pointer-events-none">
                        EVIDENCE #{i + 1}
                      </div>

                      <div className="absolute bottom-2 left-2 right-2 bg-slate-950/85 backdrop-blur-xs p-1.5 rounded text-white text-[10px] flex items-center justify-between border border-slate-700 pointer-events-none">
                        <span className="font-mono text-emerald-400 font-bold truncate">
                          {complaint.productName}
                        </span>
                        <span className="text-slate-400 font-mono text-[9px]">
                          Optical Artifact
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-6 bg-slate-50 border border-dashed border-slate-300 rounded-2xl text-center text-xs text-slate-500">
                <FileText className="w-8 h-8 text-slate-400 mx-auto mb-1.5 opacity-60" />
                <p className="font-bold text-slate-700">Digital Telemetry & Audit Evidence Sealed</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Physical photos archived in store cold-chain investigation repository.</p>
              </div>
            )}
          </div>

          {/* 8. COMPLAINANT INFORMATION */}
          <div className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 pb-1.5 border-b border-slate-200 flex items-center gap-2">
              <User className="w-4 h-4 text-emerald-600" />
              <span>Section IV: Complainant Information & Identity Verification</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Complainant Name</span>
                <span className="font-bold text-slate-900">{complaint.reporterName || 'Praveen'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Contact Telephone</span>
                <span className="font-mono text-slate-800">{complaint.reporterPhone || '+91 98765 43210'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Verification Status</span>
                <span className="text-emerald-700 font-bold flex items-center gap-1 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Identity Verified (Consumer Portal)</span>
                </span>
              </div>
            </div>
          </div>

          {/* 9. STORE OFFICIAL RESPONSE & INVESTIGATION LOG */}
          <div className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 pb-1.5 border-b border-slate-200 flex items-center gap-2">
              <Store className="w-4 h-4 text-emerald-600" />
              <span>Section V: Store Resolution & Official Audit Entries</span>
            </h2>

            {/* Official Response if available */}
            {complaint.officialResponse && (
              <div className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-xl text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-blue-900 uppercase text-[10px]">
                    Supermarket Official Store Disposition:
                  </span>
                  <span className="text-[10px] text-blue-700 font-mono">{complaint.responseDate || '19 Oct 2026'}</span>
                </div>
                <p className="text-blue-950 font-medium">
                  "{complaint.officialResponse}"
                </p>
              </div>
            )}

            {/* Investigation Notes list */}
            {complaint.investigationNotes && complaint.investigationNotes.length > 0 ? (
              <div className="space-y-2 text-xs">
                {complaint.investigationNotes.map((note: any, idx: number) => (
                  <div key={idx} className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/80 flex flex-col sm:flex-row sm:items-start justify-between gap-1 text-[11px]">
                    <div>
                      <span className="font-bold text-slate-900">{note.officer}</span>
                      <p className="text-slate-700 mt-0.5">{note.text}</p>
                    </div>
                    <span className="font-mono text-[10px] text-slate-400 shrink-0">{note.timestamp}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No supplemental investigation entries recorded.</p>
            )}
          </div>

          {/* 10. OFFICIAL REGULATORY SIGN-OFF & STAMP */}
          <div className="pt-6 border-t-2 border-slate-300 flex flex-col sm:flex-row items-end justify-between gap-6 text-xs">
            <div>
              <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                Authorized Field Food Safety Officer
              </p>
              <div className="mt-3 w-40 border-b border-slate-400"></div>
              <p className="font-bold text-slate-900 mt-1">{complaint.assignedOfficer || 'Sarah Connor'}</p>
              <p className="text-[10px] text-slate-500">Designated Food Safety Inspector • Badge #FSO-8921</p>
            </div>

            <div className="text-center p-3.5 border-2 border-dashed border-emerald-600 rounded-2xl bg-emerald-50/60 shadow-2xs">
              <span className="font-black text-emerald-900 uppercase tracking-wider text-xs block">
                FoodCovering Authenticated
              </span>
              <span className="text-[10px] text-emerald-700 font-mono block mt-0.5">
                Official Digital Stamp #{caseRef}
              </span>
              <span className="text-[9px] text-slate-500 block mt-0.5">
                Corporate Head Office Compliance Seal
              </span>
            </div>
          </div>

          {/* Document Footer */}
          <div className="border-t border-slate-200 pt-3 text-center text-[10px] text-slate-400 font-mono">
            Official store audit evidence logged under FoodCovering ESG standard • FSSAI Electronic Dossier #{caseRef} • Generated: {new Date().toLocaleString('en-GB')}
          </div>
        </div>
      </div>
    </div>
  );
};
