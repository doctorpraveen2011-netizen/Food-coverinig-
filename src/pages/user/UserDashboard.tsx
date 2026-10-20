import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { io } from 'socket.io-client';
import { useAuthStore } from '../../store/useAuthStore';
import { useAnalysisStore, type AnalyzedFood } from '../../store/useAnalysisStore';
import { 
  Gift, 
  ShieldAlert, 
  Scan, 
  MapPin, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  Sparkles,
  TrendingUp,
  HeartHandshake,
  AlertTriangle,
  AlertCircle,
  Upload,
  RefreshCw,
  Camera,
  Activity,
  Layers,
  Thermometer,
  Wind,
  Droplets,
  ExternalLink,
  Trash2,
  Plus,
  Truck,
  KeyRound,
  CheckCheck
} from 'lucide-react';
import { DeliveryHandoverOtpModal } from '../../components/donations/DeliveryHandoverOtpModal';

export default function UserDashboard() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);

  const { history: localScans, latestScan: localLatestScan, addAnalysis, getStats } = useAnalysisStore();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [quickScanning, setQuickScanning] = useState(false);
  const [quickScanSuccess, setQuickScanSuccess] = useState<string | null>(null);
  const [selectedDonationForOtp, setSelectedDonationForOtp] = useState<any | null>(null);
  const [isHandoverModalOpen, setIsHandoverModalOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDashboard = async () => {
    try {
      const backendUrl = window.location.hostname === 'localhost' ? 'http://localhost:5000' : `http://${window.location.hostname}:5000`;
      const res = await fetch(`${backendUrl}/api/user/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDashboardData(data);
        if (data.recentScans && data.recentScans.length > 0) {
          useAnalysisStore.getState().syncScans(data.recentScans);
        }
      }
    } catch (err) {
      console.error('Failed fetching user dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();

    const backendUrl = window.location.hostname === 'localhost' ? 'http://localhost:5000' : `http://${window.location.hostname}:5000`;
    const socket = io(backendUrl);

    socket.on('userComplaintUpdate', () => {
      fetchDashboard();
    });

    socket.on('customerRefundIssued', () => {
      fetchDashboard();
    });

    socket.on('complaintUpdated', () => {
      fetchDashboard();
    });

    socket.on('newComplaint', () => {
      fetchDashboard();
    });

    return () => {
      socket.disconnect();
    };
  }, [token]);

  // Derived scan metrics calculated strictly from real user scan events
  const userScansList: AnalyzedFood[] = localScans.length > 0 
    ? localScans 
    : (dashboardData?.recentScans || []);
  const activeLatestScan: AnalyzedFood | null = localLatestScan || userScansList[0] || dashboardData?.latestScan || null;

  const totalScans = userScansList.length;
  const freshScans = userScansList.filter((s) => s.freshness === 'Fresh' || s.risk === 'Low').length;
  const moderateScans = userScansList.filter((s) => s.freshness === 'Moderate' || s.risk === 'Medium').length;
  const spoiledScans = userScansList.filter((s) => s.freshness === 'Spoiled' || s.risk === 'High').length;
  const foodSafetyScore = totalScans > 0 
    ? Math.round(((freshScans * 1.0 + moderateScans * 0.6) / totalScans) * 100)
    : 100;

  const totalDonations = dashboardData?.stats?.totalDonations ?? 0;
  const mealsRescued = totalDonations * 15;
  const totalComplaints = dashboardData?.stats?.totalComplaints ?? 0;
  const resolvedComplaints = dashboardData?.stats?.resolvedComplaints ?? 0;

  // Cancel / Delete a personal donation
  const handleDeleteDonation = async (donationId: string) => {
    if (!window.confirm('Are you sure you want to cancel and remove this donation?')) {
      return;
    }
    try {
      const backendUrl = window.location.hostname === 'localhost' ? 'http://localhost:5000' : `http://${window.location.hostname}:5000`;
      const res = await fetch(`${backendUrl}/api/user/donations/${donationId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchDashboard();
      }
    } catch (err) {
      console.error('Failed to delete donation', err);
    }
  };

  // Quick scan trigger from dashboard
  const handleQuickUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      setQuickScanning(true);
      setQuickScanSuccess(null);
      try {
        const backendUrl = window.location.hostname === 'localhost' ? 'http://localhost:5000' : `http://${window.location.hostname}:5000`;
        const res = await fetch(`${backendUrl}/api/v1/analyze`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify({ image: dataUrl, filename: file.name, mode: 'general' })
        });
        if (res.ok) {
          const prediction = await res.json();
          const foodName = prediction.display_name || prediction.detected_food || prediction.food || 'Scanned Food';
          const freshnessVal = prediction.freshness || (prediction.prediction === 'fresh' ? 'Fresh' : prediction.prediction === 'spoiled' ? 'Spoiled' : 'Moderate');
          const riskVal = prediction.risk || (freshnessVal === 'Spoiled' ? 'High' : freshnessVal === 'Moderate' ? 'Medium' : 'Low');

          addAnalysis({
            food: foodName,
            displayName: foodName,
            freshness: freshnessVal,
            risk: riskVal,
            confidence: prediction.confidence_pct || `${Math.round((prediction.confidence || 0.95) * 100)}%`,
            shelfLife: prediction.shelf_life || prediction.shelfLife || (freshnessVal === 'Spoiled' ? 'Expired' : '3-4 days'),
            recommendation: prediction.recommendation || prediction.recommended_action || 'Inspected via FoodCovering AI model.',
            imageUrl: dataUrl,
            sensorData: prediction.sensorData,
            category: prediction.category,
            degradability: prediction.waste_group
          });
          setQuickScanSuccess(`AI Freshness Scan completed: ${foodName} (${freshnessVal})`);
          fetchDashboard();
        }
      } catch (err) {
        console.error('Quick scan failed:', err);
      } finally {
        setQuickScanning(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const isLatestSpoiled = activeLatestScan?.freshness === 'Spoiled' || activeLatestScan?.risk === 'High';
  const isLatestModerate = activeLatestScan?.freshness === 'Moderate' || activeLatestScan?.risk === 'Medium';

  return (
    <div className="space-y-6 pb-8">
      {/* Hidden File Input for Dashboard Quick Scanner */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleQuickUpload} 
        accept="image/*" 
        className="hidden" 
      />

      {/* Welcome Hero Banner with Freshness Intelligence Engine */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl shadow-emerald-950/20 border border-emerald-700/40">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 backdrop-blur-md border border-emerald-400/40 text-[11px] font-bold text-emerald-200 mb-3 tracking-wide">
            <Sparkles className="w-3.5 h-3.5 text-emerald-300 animate-pulse" />
            <span>AI FRESHNESS SCAN ACTIVE • LIVE FOOD SAFETY SHIELD</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {user?.fullName || 'Citizen'}
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
            Every feature in your dashboard is synchronized with our real-time AI Freshness Scanner. Verified fresh food can be shared with one click, while detected spoilage instantly triggers priority safety investigations.
          </p>

          <div className="mt-5 flex flex-wrap gap-2.5 sm:gap-3">
            <button
              onClick={() => navigate('/user/ai-scan?camera=true')}
              className="px-4 py-2.5 bg-emerald-400 hover:bg-emerald-300 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer transform hover:-translate-y-0.5"
            >
              <Camera className="w-4 h-4 text-slate-950" />
              <span>Live Camera Scan</span>
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all border border-white/20 backdrop-blur-xs flex items-center gap-2 cursor-pointer"
            >
              <Upload className="w-4 h-4 text-emerald-300" />
              <span>{quickScanning ? 'Analyzing with AI...' : 'Quick Upload Scan'}</span>
            </button>
            <button
              onClick={() => navigate('/user/ai-scan')}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all border border-white/20 backdrop-blur-xs flex items-center gap-2 cursor-pointer"
            >
              <Scan className="w-4 h-4 text-emerald-300" />
              <span>AI Hub Telemetry</span>
            </button>
            <button
              onClick={() => navigate('/user/donations')}
              className="px-4 py-2.5 bg-emerald-600/80 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all border border-emerald-400/30 flex items-center gap-2 cursor-pointer"
            >
              <Gift className="w-4 h-4 text-emerald-200" />
              <span>Donate Surplus</span>
            </button>
            <button
              onClick={() => navigate('/user/complaints')}
              className="px-4 py-2.5 bg-rose-900/50 hover:bg-rose-900/70 text-rose-100 rounded-xl text-xs font-bold transition-all border border-rose-500/30 flex items-center gap-2 cursor-pointer"
            >
              <ShieldAlert className="w-4 h-4 text-rose-300" />
              <span>Report Spoilage</span>
            </button>
          </div>
        </div>

        {/* Decorative Graphic Background */}
        <div className="absolute -bottom-8 -right-8 text-white/5 pointer-events-none select-none">
          <Scan className="w-72 h-72" />
        </div>
      </div>

      {quickScanSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs text-emerald-900 font-semibold shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{quickScanSuccess}</span>
          </div>
          <button 
            onClick={() => setQuickScanSuccess(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs font-bold ml-2 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 4 Core AI-Freshness-Powered KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* KPI 1: AI Food Safety Score */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Food Safety Score</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {totalScans > 0 ? `${foodSafetyScore}%` : '100%'}
            </p>
            <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded">
              {totalScans > 0 ? (foodSafetyScore >= 90 ? 'Grade A+' : foodSafetyScore >= 75 ? 'Grade B' : 'Grade C') : 'Active Shield'}
            </span>
          </div>
          <p className="text-[11px] text-purple-700 mt-1 font-medium flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            <span>Derived from AI Freshness Scans</span>
          </p>
        </div>

        {/* KPI 2: AI Scans Verified */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Scans Verified</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Scan className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            {totalScans}
          </p>
          <div className="flex items-center gap-2 mt-1 text-[11px] font-semibold text-slate-600">
            <span className="text-emerald-600 flex items-center gap-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              {freshScans} Fresh
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-rose-600 flex items-center gap-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
              {spoiledScans} Spoiled
            </span>
          </div>
        </div>

        {/* KPI 3: Meals Rescued via AI Verification */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Meals Rescued</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Gift className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            {mealsRescued}
          </p>
          <p className="text-[11px] text-emerald-700 mt-1 font-medium flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            <span>{totalDonations} donations approved</span>
          </p>
        </div>

        {/* KPI 4: Spoilage Violations Handled */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Spoilage Alerts</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            {totalComplaints}
          </p>
          <p className="text-[11px] text-rose-700 mt-1 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>{resolvedComplaints} resolved by authorities</span>
          </p>
        </div>
      </div>

      {/* CENTERPIECE: AI Freshness Scan Command Center Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-7 shadow-xs relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                AI Freshness Telemetry & Automated Action Hub
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Live inspection results dictate whether food is routed for community donation or flagged for food safety enforcement.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-emerald-600" />
              <span>Analyze New Image</span>
            </button>
            <button
              onClick={() => navigate('/user/ai-scan')}
              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
              <span>AI Scan Studio</span>
            </button>
          </div>
        </div>

        {activeLatestScan ? (
          <div className="mt-5 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Left 4 Cols: Image Visualizer & Confidence Meter */}
            <div className="lg:col-span-4 bg-slate-950 rounded-2xl p-4 text-white relative overflow-hidden flex flex-col items-center justify-center min-h-[220px] shadow-inner">
              {activeLatestScan.imageUrl ? (
                <img 
                  src={activeLatestScan.imageUrl} 
                  alt={activeLatestScan.food} 
                  className="absolute inset-0 w-full h-full object-cover opacity-45"
                />
              ) : null}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent"></div>

              {/* Confidence Graphic Ring */}
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-24 h-24 rounded-full border-[3px] border-emerald-400/30 flex items-center justify-center relative">
                  <div className={`w-full h-full rounded-full border-[3px] border-transparent ${
                    isLatestSpoiled ? 'border-t-rose-500 animate-[spin_4s_linear_infinite]' : 'border-t-emerald-400 animate-[spin_3s_linear_infinite]'
                  } absolute`}></div>
                  <div className="text-center">
                    <span className="text-2xl font-black block tracking-tight">{activeLatestScan.confidence}</span>
                    <span className="text-[9px] uppercase tracking-widest text-slate-300 font-bold">Confidence</span>
                  </div>
                </div>
                <p className="text-xs font-bold text-slate-200 mt-2 text-center max-w-[200px] truncate">
                  {activeLatestScan.food}
                </p>
                <span className="text-[10px] text-slate-400 font-mono mt-0.5">Ref: {activeLatestScan.id}</span>
              </div>
            </div>

            {/* Middle 5 Cols: Classification, Spoilage Risk & Sensor Telemetry */}
            <div className="lg:col-span-5 space-y-3.5">
              <div className="flex flex-wrap items-center gap-2">
                {isLatestSpoiled ? (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold bg-rose-100 text-rose-800 border border-rose-300 shadow-2xs">
                    <AlertCircle className="w-3.5 h-3.5 mr-1 text-rose-600" />
                    SPOILED / BIOHAZARD HAZARD
                  </span>
                ) : isLatestModerate ? (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold bg-amber-100 text-amber-800 border border-amber-300 shadow-2xs">
                    <AlertTriangle className="w-3.5 h-3.5 mr-1 text-amber-600" />
                    MODERATE FRESHNESS — CONSUME SOON
                  </span>
                ) : (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                    VERIFIED FRESH — APPROVED FOR SHARING
                  </span>
                )}
                <span className="text-[11px] text-slate-400 font-medium">Scanned Recently</span>
              </div>

              <div>
                <h3 className="text-lg font-extrabold text-slate-900 leading-snug">
                  {activeLatestScan.food}
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  {activeLatestScan.recommendation || 'Standard hygiene and food quality protocol applied.'}
                </p>
              </div>

              {/* Sensor Telemetry Pod */}
              <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-100">
                <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 text-center">
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase">Temp</span>
                  <span className="text-xs font-bold text-slate-800">
                    {activeLatestScan.sensorData?.temperature || '22°C'}
                  </span>
                </div>
                <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 text-center">
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase">Humidity</span>
                  <span className="text-xs font-bold text-slate-800">
                    {activeLatestScan.sensorData?.humidity || '47%'}
                  </span>
                </div>
                <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 text-center">
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase">Gas / VOC</span>
                  <span className={`text-xs font-extrabold ${isLatestSpoiled ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {activeLatestScan.sensorData?.gasVoc || (isLatestSpoiled ? 'Elevated' : 'Normal')}
                  </span>
                </div>
                <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 text-center">
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase">pH Level</span>
                  <span className="text-xs font-bold text-slate-800">
                    {activeLatestScan.sensorData?.pH || '5.4'}
                  </span>
                </div>
              </div>
            </div>

            {/* Right 3 Cols: Automated Dynamic Action Routing */}
            <div className="lg:col-span-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/80 flex flex-col justify-between h-full space-y-3">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Automated Routing Action</span>
                <p className="text-xs font-bold text-slate-800 mt-1">
                  {isLatestSpoiled ? 'Hazard Spoilage Protocol' : 'Surplus Food Recovery'}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                  {isLatestSpoiled 
                    ? 'Report vendor cold-chain failure with AI image proof directly to health inspectors.'
                    : '1-click send verified fresh meals to accredited community kitchens.'}
                </p>
              </div>

              {isLatestSpoiled ? (
                <button
                  onClick={() => navigate('/user/complaints', { state: { prefillScan: activeLatestScan } })}
                  className="w-full bg-rose-600 hover:bg-rose-700 text-white px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <ShieldAlert className="w-4 h-4" />
                  <span>Report Spoilage (1-Click)</span>
                </button>
              ) : (
                <button
                  onClick={() => navigate('/user/donations', { state: { prefillScan: activeLatestScan } })}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Gift className="w-4 h-4" />
                  <span>Donate Verified Food</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200 mt-4">
            <Scan className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-700">No AI Freshness Scans Recorded Yet</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Upload a food picture to evaluate freshness, shelf life, and spoilage hazard.</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="mt-3 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Scan First Food Item</span>
            </button>
          </div>
        )}
      </div>

      {/* Recent Scans Feed & Verification History */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Recent AI Freshness Scans</h2>
            <p className="text-xs text-slate-500">History of inspected food items and automated safety statuses</p>
          </div>
          <button 
            onClick={() => navigate('/user/ai-scan')}
            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
          >
            <span>Launch AI Food & Waste Scan →</span>
          </button>
        </div>

        {userScansList.length > 0 ? (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {userScansList.slice(0, 4).map((scan: AnalyzedFood) => {
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
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {scan.recommendation || 'Verified by FoodCovering AI inspection.'}
                    </p>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">Shelf: {scan.shelfLife}</span>
                    {isSp ? (
                      <button
                        onClick={() => navigate('/user/complaints', { state: { prefillScan: scan } })}
                        className="text-[11px] font-bold text-rose-600 hover:text-rose-700 cursor-pointer"
                      >
                        Report Spoilage →
                      </button>
                    ) : (
                      <button
                        onClick={() => navigate('/user/donations', { state: { prefillScan: scan } })}
                        className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 cursor-pointer"
                      >
                        Donate →
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200 mt-3">
            <Scan className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-700">No AI Scans Performed Yet</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Use the scanner above or launch AI Scan Studio to inspect food or waste.</p>
            <button
              onClick={() => navigate('/user/ai-scan')}
              className="mt-3 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Start First AI Scan</span>
            </button>
          </div>
        )}
      </div>

      {/* Active Live Food Tracking & Delivery Handover Banner */}
      {(() => {
        const activeDonation = dashboardData?.recentDonations?.find(
          (d: any) => ['In Transit', 'Destination Reached', 'Assigned', 'Picked Up', 'Pending'].includes(d.status)
        ) || dashboardData?.recentDonations?.[0];

        if (!activeDonation) return null;
        const isDelivered = activeDonation.status === 'Delivered';

        return (
          <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-teal-900 rounded-3xl p-5 sm:p-6 text-white border border-emerald-500/40 shadow-xl relative overflow-hidden animate-in fade-in">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shrink-0 shadow-inner">
                  <Truck className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500 text-slate-950 px-2 py-0.5 rounded-full">
                      Live Delivery Handover Tracking
                    </span>
                    <span className="font-mono text-xs font-bold text-emerald-300">#{activeDonation.id}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isDelivered ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                    }`}>
                      {activeDonation.status}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white">
                    {activeDonation.foodItems || activeDonation.title || 'Surplus Food Batch'} ({activeDonation.quantity || '8 kg'})
                  </h3>
                  <p className="text-xs text-emerald-200/90 mt-0.5">
                    Destination: <span className="font-semibold text-white">{activeDonation.receiver || 'Green Life Foundation'}</span> • Pickup: {activeDonation.pickupAddress}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDonationForOtp(activeDonation);
                    setIsHandoverModalOpen(true);
                  }}
                  className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl text-xs font-black transition-all shadow-md flex items-center gap-2 cursor-pointer transform hover:-translate-y-0.5"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>{isDelivered ? 'View Handover Certificate' : 'Verify Handover OTP'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/user/tracking')}
                  className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4 text-emerald-300" />
                  <span>Live Map</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Two Columns: Recent Donations & Complaints (Synchronized with AI Verification) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Personal Donations */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900">My Food Donations</h2>
              <p className="text-xs text-slate-500">Surplus meals certified fresh & dispatched</p>
            </div>
            <div className="flex items-center gap-2">
              <Link 
                to="/user/donations?new=true" 
                className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>New Donation</span>
              </Link>
              <Link to="/user/donations" className="text-xs font-bold text-emerald-600 hover:text-emerald-700">
                View All
              </Link>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {dashboardData?.recentDonations?.length ? (
              dashboardData.recentDonations.map((d: any) => (
                <div key={d.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      <Gift className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-bold text-slate-900">{d.foodItems}</p>
                        {d.verificationType === 'AI_CERTIFIED' || d.notes?.includes('AI Freshness Certified') ? (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" /> AI Certified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-blue-100 text-blue-800">
                            Manual Donation
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500">Qty: {d.quantity} • {d.pickupAddress}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-right">
                    <div className="flex flex-col items-end gap-1">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                        d.status === 'Delivered' ? 'bg-emerald-100 text-emerald-800' :
                        d.status === 'In Transit' ? 'bg-blue-100 text-blue-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {d.status}
                      </span>
                      {d.status === 'Delivered' ? (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedDonationForOtp(d);
                            setIsHandoverModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-bold hover:underline cursor-pointer"
                        >
                          <CheckCheck className="w-3 h-3 text-emerald-600" />
                          <span>Handover Verified</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedDonationForOtp(d);
                            setIsHandoverModalOpen(true);
                          }}
                          className="px-2 py-0.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded text-[10px] flex items-center gap-1 shadow-2xs transition-transform transform hover:scale-105 cursor-pointer"
                        >
                          <KeyRound className="w-2.5 h-2.5" />
                          <span>Verify Handover OTP</span>
                        </button>
                      )}
                      <p className="text-[10px] text-slate-400">{d.date}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteDonation(d.id)}
                      title="Cancel & Delete Donation"
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 px-4 bg-slate-50/70 rounded-2xl border border-dashed border-slate-200">
                <Gift className="w-7 h-7 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-700">No Food Donations Registered Yet</p>
                <p className="text-[11px] text-slate-500 mt-1 max-w-xs mx-auto">
                  You can register surplus food manually or scan fresh items with AI to automatically route them to accredited community kitchens.
                </p>
                <div className="mt-3 flex items-center justify-center gap-2">
                  <button
                    onClick={() => navigate('/user/donations?new=true')}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Create Manual Donation</span>
                  </button>
                  <button
                    onClick={() => navigate('/user/ai-scan')}
                    className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <Scan className="w-3.5 h-3.5" />
                    <span>Scan Food with AI</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recent Personal Complaints */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Food Safety & Spoilage Reports</h2>
              <p className="text-xs text-slate-500">Official investigations backed by AI scan evidence</p>
            </div>
            <Link to="/user/complaints" className="text-xs font-bold text-emerald-600 hover:text-emerald-700">
              View All
            </Link>
          </div>

          <div className="mt-4 space-y-3">
            {dashboardData?.recentComplaints?.length ? (
              dashboardData.recentComplaints.map((c: any) => (
                <div key={c.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      <ShieldAlert className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-bold text-slate-900">{c.productName}</p>
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-rose-100 text-rose-800">
                          <AlertCircle className="w-2.5 h-2.5 text-rose-600" /> AI Evidence
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">Vendor: {c.seller} • Case Ref: {c.id}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                      c.status === 'Resolved' ? 'bg-emerald-100 text-emerald-800' :
                      c.status === 'Under Investigation' ? 'bg-amber-100 text-amber-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {c.status}
                    </span>
                    {c.refundStatus === 'Refunded' && (
                      <span className="block mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        💸 Refund: ₹{c.refundAmount || 150}
                      </span>
                    )}
                    <p className="text-[10px] text-slate-400 mt-1">{c.date}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 px-4 bg-slate-50/70 rounded-2xl border border-dashed border-slate-200">
                <ShieldAlert className="w-7 h-7 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-700">No Food Safety Spoilage Cases Filed</p>
                <p className="text-[11px] text-slate-500 mt-1 max-w-xs mx-auto">
                  All clear! If our AI scanner flags spoiled or rotten produce, you can file an instant report with attached AI evidence here.
                </p>
                <button
                  onClick={() => navigate('/user/ai-scan')}
                  className="mt-3 px-3.5 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Scan className="w-3.5 h-3.5" />
                  <span>Scan Food for Safety</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Handover OTP Verification Modal in Dashboard */}
      {selectedDonationForOtp && (
        <DeliveryHandoverOtpModal
          isOpen={isHandoverModalOpen}
          onClose={() => {
            setIsHandoverModalOpen(false);
            setSelectedDonationForOtp(null);
          }}
          donation={selectedDonationForOtp}
          userPhone={user?.phone || selectedDonationForOtp.donorPhone}
          userEmail={user?.email || selectedDonationForOtp.donorEmail}
          donorName={user?.fullName || selectedDonationForOtp.donorName}
          onSuccess={(updatedDonation, points) => {
            setQuickScanSuccess(`Delivery Handover Verified! +${points} Sustainability Points credited to your balance.`);
            fetchDashboard();
          }}
        />
      )}
    </div>
  );
}
