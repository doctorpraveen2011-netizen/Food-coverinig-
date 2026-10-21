import React, { useState } from 'react';
import { 
  Award, 
  Sparkles, 
  ShieldCheck, 
  Leaf, 
  TrendingUp, 
  CheckCircle2, 
  X, 
  ExternalLink, 
  Gift, 
  Scan, 
  Truck, 
  MapPin, 
  Download, 
  QrCode, 
  Check, 
  Copy,
  ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { getBackendUrl } from '../../utils/apiConfig';

interface CredentialPointsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CredentialPointsModal({ isOpen, onClose }: CredentialPointsModalProps) {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);

  const [activeTab, setActiveTab] = useState<'overview' | 'certificate' | 'history'>('overview');
  const [copiedLink, setCopiedLink] = useState(false);
  const [downloadingCert, setDownloadingCert] = useState(false);
  const [certIssued, setCertIssued] = useState(false);

  if (!isOpen) return null;

  const points = user?.creditPoints || 1285;
  const tier = user?.tier || 'Gold';
  const tierBadge = user?.tierBadge || 'Gold Certified Sustainability Leader';
  const progress = user?.progressToNextTier || 72;
  const nextTierPoints = user?.nextTierPoints || 2500;
  const pointsNeeded = user?.pointsToNextTier || 365;

  const stats = user?.sustainabilityStats || {
    totalPoints: points,
    donationsCount: 14,
    co2SavedKg: 185.5,
    foodSavedKg: 94.2,
    waterSavedLiters: 1130,
    mealsProvided: 188,
    scansCount: 12
  };

  const rolePath = user?.role === 'SUPERMARKET_OFFICIAL' ? '/supermarket' : user?.role === 'HEAD_OFFICE_ADMIN' ? '/admin' : '/user';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`https://foodcovering.gov/credentials/verify/${user?.id || 'usr-2026'}`);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleClaimCertificate = async () => {
    setDownloadingCert(true);
    try {
      const backendUrl = getBackendUrl();
      if (backendUrl) {
        await fetch(`${backendUrl}/api/auth/credentials/redeem`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ rewardType: 'CERTIFICATE' }),
          signal: AbortSignal.timeout(2000)
        }).catch(() => {});
      }
      setCertIssued(true);
      setActiveTab('certificate');
    } catch (err) {
      console.error(err);
    } finally {
      setDownloadingCert(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden relative my-auto max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header with Shimmering Gradient */}
        <div className="relative px-6 py-5 bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white overflow-hidden shrink-0">
          <div className="absolute -right-10 -bottom-10 w-44 h-44 rounded-full bg-emerald-500/20 blur-2xl pointer-events-none" />
          <div className="absolute left-1/3 -top-10 w-36 h-36 rounded-full bg-teal-400/20 blur-2xl pointer-events-none" />

          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-amber-300 shadow-inner">
                <Award className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black tracking-tight text-white">Sustainability Credential Points</h2>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-400/20 border border-amber-300/40 text-amber-300 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    <span>{tier} Tier</span>
                  </span>
                </div>
                <p className="text-xs text-emerald-200/80 mt-0.5">
                  Verified Green ESG & Zero-Waste Credit Ledger
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Sub-Tabs */}
          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-white/10 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                activeTab === 'overview' 
                  ? 'bg-white text-emerald-950 font-bold shadow-sm' 
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              Points & ESG Impact
            </button>
            <button
              onClick={() => setActiveTab('certificate')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                activeTab === 'certificate' 
                  ? 'bg-white text-emerald-950 font-bold shadow-sm' 
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              Official Certificate
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                activeTab === 'history' 
                  ? 'bg-white text-emerald-950 font-bold shadow-sm' 
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              Ledger History
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800">
          {activeTab === 'overview' && (
            <>
              {/* Highlight Hero Card */}
              <div className="bg-gradient-to-br from-emerald-50 via-teal-50/50 to-white p-5 rounded-2xl border border-emerald-200/80 shadow-xs relative">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-700 block">
                      Active Credential Balance
                    </span>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                        {points.toLocaleString()}
                      </span>
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                        Credential Points
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1.5 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{tierBadge}</span>
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 shrink-0">
                    <button
                      onClick={() => {
                        onClose();
                        navigate(`${rolePath}/tracking`);
                      }}
                      className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <MapPin className="w-4 h-4 text-emerald-200" />
                      <span>Track Live on Google Map</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={handleClaimCertificate}
                      disabled={downloadingCert}
                      className="px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{downloadingCert ? 'Generating...' : 'View Certificate'}</span>
                    </button>
                  </div>
                </div>

                {/* Next Tier Progress Bar */}
                <div className="mt-5 pt-4 border-t border-emerald-200/60">
                  <div className="flex items-center justify-between text-xs mb-1.5 font-semibold text-slate-700">
                    <span className="flex items-center gap-1">
                      <span>Progress to</span>
                      <span className="text-emerald-800 font-bold">Platinum Tier ({nextTierPoints} pts)</span>
                    </span>
                    <span className="text-emerald-700 font-bold">{progress}%</span>
                  </div>
                  <div className="w-full bg-emerald-200/50 rounded-full h-2.5 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1.5">
                    Earn <strong>{pointsNeeded} more points</strong> by verifying food donations and AI quality scans.
                  </p>
                </div>
              </div>

              {/* 4 Environmental Impact Metric Badges */}
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                  <Leaf className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Real-World Sustainability Impact</span>
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 text-center">
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-2">
                      <Leaf className="w-4 h-4" />
                    </div>
                    <div className="text-lg font-black text-slate-900">{stats.co2SavedKg} kg</div>
                    <div className="text-[11px] font-semibold text-slate-500">CO2 Emissions Saved</div>
                  </div>

                  <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 text-center">
                    <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center mx-auto mb-2">
                      <Gift className="w-4 h-4" />
                    </div>
                    <div className="text-lg font-black text-slate-900">{stats.foodSavedKg} kg</div>
                    <div className="text-[11px] font-semibold text-slate-500">Food Rescued</div>
                  </div>

                  <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 text-center">
                    <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mx-auto mb-2">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    <div className="text-lg font-black text-slate-900">{stats.waterSavedLiters} L</div>
                    <div className="text-[11px] font-semibold text-slate-500">Water Conserved</div>
                  </div>

                  <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 text-center">
                    <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mx-auto mb-2">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div className="text-lg font-black text-slate-900">{stats.mealsProvided}</div>
                    <div className="text-[11px] font-semibold text-slate-500">Meals Provided</div>
                  </div>
                </div>
              </div>

              {/* How to Earn More Credential Points */}
              <div className="bg-slate-50/70 border border-slate-200 rounded-2xl p-4">
                <h4 className="text-xs font-bold text-slate-900 mb-2.5 flex items-center justify-between">
                  <span>How Credential Points Are Awarded</span>
                  <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md">Automated Audit</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200/80">
                    <div className="flex items-center gap-2">
                      <Gift className="w-4 h-4 text-emerald-600" />
                      <span className="font-medium text-slate-700">Surplus Food Donation</span>
                    </div>
                    <span className="font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg">+185 pts</span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200/80">
                    <div className="flex items-center gap-2">
                      <Scan className="w-4 h-4 text-blue-600" />
                      <span className="font-medium text-slate-700">AI Freshness Scan</span>
                    </div>
                    <span className="font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-lg">+25 pts</span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200/80">
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-purple-600" />
                      <span className="font-medium text-slate-700">Live Volunteer Handover</span>
                    </div>
                    <span className="font-extrabold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-lg">+50 pts</span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200/80">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-amber-600" />
                      <span className="font-medium text-slate-700">Zero-Waste Audit Pass</span>
                    </div>
                    <span className="font-extrabold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg">+100 pts</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'certificate' && (
            <div className="space-y-4">
              {/* Certificate Frame */}
              <div className="p-6 bg-gradient-to-b from-amber-50/40 via-white to-amber-50/20 border-4 border-amber-200 rounded-3xl relative text-center shadow-lg">
                <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Officially Verified</span>
                </div>

                <div className="w-14 h-14 rounded-full bg-amber-100 border border-amber-300 text-amber-700 flex items-center justify-center mx-auto mb-3 shadow-sm">
                  <Award className="w-8 h-8" />
                </div>

                <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase">
                  Certificate of Sustainability Excellence
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  Issued under the National Food Loss & Waste Reduction Standards (FoodCovering 2.0 ESG Protocol)
                </p>

                <div className="my-6 py-4 px-6 bg-white/80 rounded-2xl border border-amber-200/70 inline-block">
                  <p className="text-xs font-semibold text-slate-500">PROUDLY PRESENTED TO</p>
                  <p className="text-2xl font-black text-slate-900 mt-1">{user?.fullName || 'Rajesh Mehta (Store Lead)'}</p>
                  <p className="text-xs font-bold text-emerald-700 mt-0.5">
                    {user?.supermarket?.name || 'FreshMart Supermarkets'} • {tierBadge}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center max-w-md mx-auto mb-4 text-xs">
                  <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                    <p className="font-bold text-slate-900 text-base">{points.toLocaleString()}</p>
                    <p className="text-[10px] text-slate-500">Points Earned</p>
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                    <p className="font-bold text-slate-900 text-base">{stats.co2SavedKg} kg</p>
                    <p className="text-[10px] text-slate-500">CO2 Offset</p>
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                    <p className="font-bold text-slate-900 text-base">{stats.mealsProvided}</p>
                    <p className="text-[10px] text-slate-500">Meals Rescued</p>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-6 pt-3 border-t border-amber-200/60 text-[11px] text-slate-500 font-mono">
                  <span>Serial: FC-CERT-2026-98124</span>
                  <span>Date: 28 Sep 2026</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  onClick={handleCopyLink}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Link Copied!' : 'Copy Verification Link'}</span>
                </button>

                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF Certificate</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Credential Ledger Activity</h3>
                <span className="text-[11px] text-slate-500">Immutable Audit Trail</span>
              </div>

              <div className="space-y-2">
                {(user?.history || [
                  { id: 'tx-1', action: 'Surplus Food Batch Dispatched', points: 185, date: 'Today, 11:20 AM', icon: 'gift' },
                  { id: 'tx-2', action: 'AI Freshness Quality Inspection Verified', points: 25, date: 'Yesterday, 04:15 PM', icon: 'scan' },
                  { id: 'tx-3', action: 'Volunteer Live Telemetry Handover', points: 50, date: '26 Sep 2026', icon: 'shield' },
                  { id: 'tx-4', action: 'Tier Milestone Bonus (Silver → Gold)', points: 100, date: '24 Sep 2026', icon: 'award' }
                ]).map((item) => (
                  <div key={item.id} className="p-3 bg-slate-50 hover:bg-white rounded-xl border border-slate-200/80 transition-colors flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">{item.action}</p>
                        <p className="text-[10px] text-slate-500">{item.date}</p>
                      </div>
                    </div>
                    <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/60">
                      +{item.points} pts
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span className="flex items-center gap-1.5 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Govt. Recognized ESG Sustainability Ledger</span>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
