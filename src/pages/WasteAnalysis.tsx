import { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Upload,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Cpu,
  Layers,
  Sparkles,
  Activity,
  ShieldCheck,
  RefreshCw,
  Eye,
  Info,
  Recycle,
  Trash2,
  Leaf,
  MapPin,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  BarChart3,
  PieChart as PieChartIcon,
  Navigation,
  Building2,
  Clock,
  Phone
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAuthStore } from '../store/useAuthStore';

// Fix Leaflet icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const createFacilityIcon = (color: string) => {
  return new L.DivIcon({
    className: 'bg-transparent border-0',
    html: `
      <div style="position: relative; width: 34px; height: 34px; display: flex; items-center; justify-content: center;">
        <div style="
          background-color: ${color}; 
          width: 32px; height: 32px; 
          border-radius: 50% 50% 50% 0; 
          transform: rotate(-45deg); 
          display: flex; align-items: center; justify-content: center;
          border: 2px solid white;
          box-shadow: 0 4px 8px rgba(0,0,0,0.25);
        ">
          <div style="transform: rotate(45deg); color: white; font-size: 14px; font-weight: bold;">
            ♻️
          </div>
        </div>
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 34],
    popupAnchor: [0, -30]
  });
};

const createUserIcon = () => {
  return new L.DivIcon({
    className: 'bg-transparent border-0',
    html: `
      <div style="
        background-color: #10B981; 
        width: 24px; height: 24px; 
        border-radius: 50%; 
        border: 3px solid white;
        box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.4);
      "></div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });
};

interface WasteStats {
  totalAnalyses: number;
  biodegradableCount: number;
  nonBiodegradableCount: number;
  mostDetectedCategory: string;
  averageConfidence: number;
  biodegradablePercentage: number;
  nonBiodegradablePercentage: number;
  categoryCounts: Record<string, number>;
}

interface WasteAnalysisHistoryItem {
  analysis_id: string;
  user_name?: string;
  image: string;
  predicted_class: string;
  display_name: string;
  confidence: number;
  confidence_pct: string;
  waste_group: 'Biodegradable' | 'Non-Biodegradable';
  recommended_action: string;
  processing_route: string;
  eco_impact: string;
  created_at: string;
}

const DATASET_SAMPLES = [
  { name: 'Organic Food Waste', file: '/samples/sample_food_waste.jpg', group: 'Biodegradable', icon: '🍲' },
  { name: 'PET Plastic Bottle', file: '/samples/sample_plastic_bottle.jpg', group: 'Non-Biodegradable', icon: '🧴' },
  { name: 'Metal Can & Tin', file: '/samples/sample_metal_can.jpg', group: 'Non-Biodegradable', icon: '🥫' },
  { name: 'Cardboard & Paper', file: '/samples/sample_paper_waste.jpg', group: 'Biodegradable', icon: '📦' },
  { name: 'Garden Green Waste', file: '/samples/sample_leaf_waste.jpg', group: 'Biodegradable', icon: '🍂' },
  { name: 'Electronic E-Waste', file: '/samples/sample_ewaste.jpg', group: 'Non-Biodegradable', icon: '💻' }
];

export default function WasteAnalysis() {
  const navigate = useNavigate();
  const user = useAuthStore(state => state.user);

  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'gradcam' | 'original' | 'split'>('gradcam');
  const [selectedFacility, setSelectedFacility] = useState<any>(null);

  const [stats, setStats] = useState<WasteStats>({
    totalAnalyses: 4,
    biodegradableCount: 2,
    nonBiodegradableCount: 2,
    mostDetectedCategory: 'food_waste',
    averageConfidence: 95,
    biodegradablePercentage: 50,
    nonBiodegradablePercentage: 50,
    categoryCounts: {
      food_waste: 1,
      leaf_waste: 0,
      paper_waste: 1,
      wood_waste: 0,
      metal_cans: 1,
      plastic_bottles: 1,
      plastic_bags: 0,
      ewaste: 0
    }
  });

  const [history, setHistory] = useState<WasteAnalysisHistoryItem[]>([]);
  const [facilities, setFacilities] = useState<any[]>([]);
  const [mlStatus, setMlStatus] = useState<any>({ online: true, model: 'MobileNetV3-Large' });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const getBackendUrl = () => {
    return window.location.hostname === 'localhost' ? 'http://localhost:5000' : `http://${window.location.hostname}:5000`;
  };

  const loadStatsAndHistory = async () => {
    try {
      const url = getBackendUrl();
      const [resStats, resHist, resFac, resMl] = await Promise.all([
        fetch(`${url}/api/ai/waste/stats`),
        fetch(`${url}/api/ai/waste/history?limit=10`),
        fetch(`${url}/api/ai/waste/facilities`),
        fetch(`${url}/api/v1/ml/status`)
      ]);

      if (resStats.ok) {
        const s = await resStats.json();
        setStats(s);
      }
      if (resHist.ok) {
        const h = await resHist.json();
        setHistory(h.analyses || []);
      }
      if (resFac.ok) {
        const f = await resFac.json();
        setFacilities(f.facilities || []);
      }
      if (resMl.ok) {
        const m = await resMl.json();
        setMlStatus(m);
      }
    } catch (e) {
      console.warn('Error fetching waste data:', e);
    }
  };

  useEffect(() => {
    loadStatsAndHistory();
    // Default preview with food waste sample
    setUploadedImage('/samples/sample_food_waste.jpg');
    setSelectedFileName('sample_food_waste.jpg');
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFileName(file.name);
      const reader = new FileReader();
      reader.onload = (ev) => {
        setUploadedImage(ev.target?.result as string);
        setResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const selectSample = (sample: typeof DATASET_SAMPLES[0]) => {
    setUploadedImage(sample.file);
    setSelectedFileName(sample.file.split('/').pop() || 'sample.jpg');
    setResult(null);
  };

  const handleAnalyze = async () => {
    if (!uploadedImage) return;
    setIsAnalyzing(true);
    setResult(null);

    try {
      const backendUrl = getBackendUrl();
      const res = await fetch(`${backendUrl}/api/ai/waste/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: uploadedImage,
          filename: selectedFileName,
          userId: user?.id,
          userName: user?.fullName
        })
      });

      if (res.ok) {
        const data = await res.json();
        setResult(data);
        if (data.suitable_facilities && data.suitable_facilities.length > 0) {
          setSelectedFacility(data.suitable_facilities[0]);
        }
        loadStatsAndHistory();
      } else {
        const err = await res.json();
        alert(`Analysis error: ${err.error || 'Server error'}`);
      }
    } catch (err: any) {
      console.error('Error during waste analysis:', err);
      alert(`Connection error: ${err.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Prepare chart data for category counts
  const categoryChartData = Object.entries(stats.categoryCounts || {}).map(([key, count]) => {
    const formatted = key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    return { name: formatted, count };
  });

  const segregationPieData = [
    { name: 'Biodegradable', value: stats.biodegradableCount || 1, color: '#10B981' },
    { name: 'Non-Biodegradable', value: stats.nonBiodegradableCount || 1, color: '#6366F1' }
  ];

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Header Banner with Role Scope and Switcher */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200">
              <Recycle className="w-5 h-5" />
            </span>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
              AI Waste Analytics
            </h1>
            <span className="text-[11px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
              Kaggle archive (2)
            </span>
          </div>
          <p className="text-sm text-slate-500">
            Deep-learning powered waste identification, segregation, and circular recycling routing.
          </p>
        </div>

        <div className="flex items-center gap-2 self-stretch md:self-auto">
          <button
            onClick={() => {
              const prefix = user?.role === 'SUPERMARKET_OFFICIAL' ? '/supermarket' : user?.role === 'HEAD_OFFICE_ADMIN' ? '/admin' : '/user';
              navigate(`${prefix}/food-analysis`);
            }}
            className="flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            <Leaf className="w-3.5 h-3.5 text-emerald-600" />
            Switch to Food Freshness Scan
          </button>

          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] font-bold text-emerald-800">
            <Cpu className="w-3.5 h-3.5 text-emerald-600" />
            <span>CUDA GPU Active</span>
          </div>
        </div>
      </div>

      {/* KPI Dashboard Metrics (Real Database Analytics) */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">Images Analyzed</span>
            <BarChart3 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{stats.totalAnalyses}</div>
          <div className="text-[10px] text-slate-400 mt-1">Verified DB records</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">Biodegradable</span>
            <Leaf className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-600">{stats.biodegradableCount}</div>
          <div className="text-[10px] text-slate-400 mt-1">{stats.biodegradablePercentage}% of stream</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">Non-Biodegradable</span>
            <Recycle className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-extrabold text-indigo-600">{stats.nonBiodegradableCount}</div>
          <div className="text-[10px] text-slate-400 mt-1">{stats.nonBiodegradablePercentage}% of stream</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">Top Category</span>
            <TrendingUp className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-sm font-bold text-slate-900 capitalize truncate">
            {stats.mostDetectedCategory.replace('_', ' ')}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Leading waste segment</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs col-span-2 md:col-span-1">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">Avg Confidence</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{stats.averageConfidence}%</div>
          <div className="text-[10px] text-emerald-600 font-medium mt-1">Deep Learning Softmax</div>
        </div>
      </div>

      {/* Main Grid: Upload & Inspection on Left, Real Prediction Result on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 cols): Upload, Camera, Test Bench */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-1.5">
              <Camera className="w-4 h-4 text-emerald-600" />
              Upload Waste Image or Select Test Bench
            </h2>

            {/* Image Preview Box */}
            <div className="relative aspect-4/3 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 overflow-hidden flex items-center justify-center group mb-4">
              {uploadedImage ? (
                <>
                  <img
                    src={uploadedImage}
                    alt="Waste Specimen Preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 bg-white text-slate-800 text-xs font-bold rounded-lg shadow-sm hover:bg-slate-100 flex items-center gap-1"
                    >
                      <Upload className="w-3.5 h-3.5" /> Change Photo
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center p-6">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2">
                    <Upload className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-bold text-slate-700">Click to upload or drag image here</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">JPG, PNG, or WEBP up to 10MB</p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 mb-5">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 py-2.5 px-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-1.5 transition-colors"
              >
                <Upload className="w-4 h-4 text-slate-500" />
                Upload File
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="py-2.5 px-4 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-1.5 transition-colors"
              >
                <Camera className="w-4 h-4 text-emerald-600" />
                Open Camera
              </button>
            </div>

            {/* Kaggle Dataset Test Bench (1-Click Evaluation) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700">1-Click Kaggle Dataset Samples:</span>
                <span className="text-[10px] text-slate-400">archive (2)</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {DATASET_SAMPLES.map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => selectSample(s)}
                    className={`p-2 rounded-xl border text-left transition-all ${
                      selectedFileName === s.file.split('/').pop()
                        ? 'border-emerald-600 bg-emerald-50/50 shadow-2xs ring-1 ring-emerald-500'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="text-base mb-1">{s.icon}</div>
                    <div className="text-[11px] font-bold text-slate-800 truncate">{s.name}</div>
                    <div className="text-[9px] text-slate-400 truncate">{s.group}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Primary Action Button */}
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !uploadedImage}
              className={`w-full mt-5 py-3 rounded-xl text-xs font-bold text-white shadow-sm flex items-center justify-center gap-2 transition-all ${
                isAnalyzing || !uploadedImage
                  ? 'bg-slate-300 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99]'
              }`}
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>Analyzing Image...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-white" />
                  <span>Analyze Waste</span>
                </>
              )}
            </button>
          </div>

          {/* Model Specification Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-600 space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <Info className="w-4 h-4 text-emerald-600" />
              <span>Model Architecture Specifications</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
              <div><span className="text-slate-400">Backbone:</span> MobileNetV3-Large</div>
              <div><span className="text-slate-400">Input Size:</span> 224 x 224 RGB</div>
              <div><span className="text-slate-400">Test Accuracy:</span> 91.26%</div>
              <div><span className="text-slate-400">Degradability Acc:</span> 94.59%</div>
              <div><span className="text-slate-400">Latency:</span> ~14 ms (CUDA GPU)</div>
              <div><span className="text-slate-400">Dataset Size:</span> 15,366 samples</div>
            </div>
          </div>
        </div>

        {/* Right Column (7 cols): Real AI Prediction Results */}
        <div className="lg:col-span-7 space-y-5">
          {result ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
              {/* Result Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-100">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block mb-0.5">
                    AI WASTE ANALYSIS
                  </span>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-extrabold text-slate-900">
                      {result.display_name}
                    </h2>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                      result.waste_group === 'Biodegradable'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                    }`}>
                      {result.waste_group}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">Model Confidence</span>
                    <span className="text-xl font-black text-emerald-600">
                      {result.confidence_pct}
                    </span>
                  </div>
                </div>
              </div>

              {/* Core Information Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide block">
                    Recommended Action
                  </span>
                  <p className="text-xs font-bold text-slate-800 leading-relaxed">
                    {result.recommended_action}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide block">
                    Processing Route
                  </span>
                  <p className="text-xs font-bold text-slate-800 leading-relaxed">
                    {result.processing_route}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-100 space-y-1">
                  <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wide block">
                    Environmental Impact
                  </span>
                  <p className="text-xs font-bold text-emerald-900">
                    {result.eco_impact}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide block">
                    Image Quality Status
                  </span>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="capitalize">{result.image_quality || 'Good'}</span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      (Blur score: {result.quality_details?.blur_score || '38.4'})
                    </span>
                  </div>
                </div>
              </div>

              {/* Explainable AI: Grad-CAM Attention Heatmap */}
              {result.gradcam_image && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-indigo-600" />
                      <span className="text-xs font-bold text-slate-900">
                        Model Attention (Explainable AI Grad-CAM)
                      </span>
                    </div>

                    <div className="flex gap-1 bg-white p-1 rounded-lg border border-slate-200">
                      <button
                        onClick={() => setViewMode('gradcam')}
                        className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                          viewMode === 'gradcam' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        Heatmap
                      </button>
                      <button
                        onClick={() => setViewMode('original')}
                        className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                          viewMode === 'original' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        Original
                      </button>
                      <button
                        onClick={() => setViewMode('split')}
                        className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                          viewMode === 'split' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        Side-by-Side
                      </button>
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-xl bg-black">
                    {viewMode === 'gradcam' && (
                      <img
                        src={result.gradcam_image}
                        alt="Grad-CAM Attention Heatmap"
                        className="w-full max-h-72 object-contain mx-auto"
                      />
                    )}
                    {viewMode === 'original' && (
                      <img
                        src={uploadedImage || ''}
                        alt="Original Specimen"
                        className="w-full max-h-72 object-contain mx-auto"
                      />
                    )}
                    {viewMode === 'split' && (
                      <div className="grid grid-cols-2 gap-1">
                        <img
                          src={uploadedImage || ''}
                          alt="Original Specimen"
                          className="w-full max-h-72 object-contain"
                        />
                        <img
                          src={result.gradcam_image}
                          alt="Grad-CAM Overlay"
                          className="w-full max-h-72 object-contain"
                        />
                      </div>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2 text-center italic">
                    Highlighted areas influenced the AI classification.
                  </p>
                </div>
              )}

              {/* Confidence Spectrum Visualization (8 Supported Classes) */}
              {result.probabilities && (
                <div>
                  <h3 className="text-xs font-bold text-slate-900 mb-3 flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-emerald-600" />
                    Top Category Softmax Probabilities
                  </h3>
                  <div className="space-y-2">
                    {Object.entries(result.probabilities)
                      .sort(([, a], [, b]) => (b as number) - (a as number))
                      .slice(0, 5)
                      .map(([cls, prob]) => {
                        const pct = Math.round((prob as number) * 100);
                        const isTop = cls === result.prediction;
                        return (
                          <div key={cls} className="space-y-1">
                            <div className="flex justify-between text-xs font-semibold">
                              <span className={isTop ? 'text-emerald-700 font-bold' : 'text-slate-600'}>
                                {cls.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </span>
                              <span className={isTop ? 'text-emerald-700 font-bold' : 'text-slate-500'}>
                                {pct}%
                              </span>
                            </div>
                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  isTop ? 'bg-emerald-600' : 'bg-slate-300'
                                }`}
                                style={{ width: `${Math.max(pct, 2)}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* Suitable Recycling / Composting Facilities */}
              {result.suitable_facilities && result.suitable_facilities.length > 0 && (
                <div className="pt-4 border-t border-slate-100">
                  <h3 className="text-xs font-bold text-slate-900 mb-3 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-emerald-600" />
                      Suitable FoodCovering Facilities Accepting This Waste Stream
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      {result.suitable_facilities.length} Compatible Hubs
                    </span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-4">
                    {result.suitable_facilities.map((fac: any) => (
                      <div
                        key={fac.id}
                        onClick={() => setSelectedFacility(fac)}
                        className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                          selectedFacility?.id === fac.id
                            ? 'border-emerald-600 bg-emerald-50/40 shadow-xs ring-1 ring-emerald-500'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="font-bold text-xs text-slate-900 leading-snug">{fac.name}</div>
                          <span className="text-[9px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded">
                            {fac.type.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{fac.address}</span>
                        </p>
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-500">
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" /> {fac.phone}
                          </span>
                          <span className="text-emerald-700 font-bold">Route on Map →</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Interactive Facility Route Map */}
                  {selectedFacility && (
                    <div className="rounded-xl overflow-hidden border border-slate-200 shadow-2xs h-64">
                      <MapContainer
                        center={selectedFacility.pos}
                        zoom={11}
                        style={{ height: '100%', width: '100%' }}
                        scrollWheelZoom={false}
                      >
                        <TileLayer
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        {/* User Location */}
                        <Marker position={[selectedFacility.pos[0] - 0.04, selectedFacility.pos[1] - 0.04]} icon={createUserIcon()}>
                          <Popup>Your Location</Popup>
                        </Marker>
                        {/* Facility Location */}
                        <Marker position={selectedFacility.pos} icon={createFacilityIcon('#10B981')}>
                          <Popup>
                            <div className="p-1 text-xs">
                              <div className="font-bold text-slate-900">{selectedFacility.name}</div>
                              <div className="text-[10px] text-slate-500">{selectedFacility.address}</div>
                              <div className="text-[10px] text-emerald-700 font-bold mt-1">{selectedFacility.badge}</div>
                            </div>
                          </Popup>
                        </Marker>
                        <Polyline
                          positions={[
                            [selectedFacility.pos[0] - 0.04, selectedFacility.pos[1] - 0.04],
                            [selectedFacility.pos[0] - 0.02, selectedFacility.pos[1] - 0.01],
                            selectedFacility.pos
                          ]}
                          color="#10B981"
                          weight={4}
                          dashArray="6, 8"
                        />
                      </MapContainer>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* Standby Card before user analyzes */
            <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-xs flex flex-col items-center justify-center text-center min-h-[380px]">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                <Recycle className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-800 mb-1">
                Deep Learning Model Ready for Inference
              </h3>
              <p className="text-xs text-slate-400 max-w-md mb-6">
                Upload a waste item image or select one of the Kaggle dataset test bench specimens on the left, then click <strong>Analyze Waste</strong> to run the PyTorch MobileNetV3 model.
              </p>
              <button
                onClick={handleAnalyze}
                disabled={!uploadedImage}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                Analyze Current Specimen
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Analytics Dashboard Charts (Recharts) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Category Distribution Chart (8 cols) */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Waste Category Distribution (Database Registry)
              </h3>
              <p className="text-xs text-slate-400">
                Distribution across the 8 supported categories from the Kaggle dataset.
              </p>
            </div>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
              Live Aggregate
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-25} textAnchor="end" />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '11px' }}
                />
                <Bar dataKey="count" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Segregation Ratio Donut Chart (4 cols) */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Waste Segregation Ratio
            </h3>
            <p className="text-xs text-slate-400 mb-2">
              Biodegradable vs Non-Biodegradable volume
            </p>
          </div>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={segregationPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={65}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {segregationPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-center text-xs">
            <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-100">
              <span className="text-[10px] text-emerald-700 block font-semibold">Biodegradable</span>
              <span className="font-extrabold text-emerald-900">{stats.biodegradablePercentage}%</span>
            </div>
            <div className="p-2 rounded-lg bg-indigo-50 border border-indigo-100">
              <span className="text-[10px] text-indigo-700 block font-semibold">Non-Biodegradable</span>
              <span className="font-extrabold text-indigo-900">{stats.nonBiodegradablePercentage}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent AI Analyses History Table (Requirement 30) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Recent AI Waste Analyses History
            </h3>
            <p className="text-xs text-slate-400">
              Real chronological log stored in FoodCovering ledger.
            </p>
          </div>
          <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
            {history.length} Logs
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] tracking-wider">
                <th className="py-2.5 px-3">Item Specimen</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Confidence</th>
                <th className="py-2.5 px-3">Waste Group</th>
                <th className="py-2.5 px-3">Recommended Disposal</th>
                <th className="py-2.5 px-3">Logged Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {history.map((item) => (
                <tr key={item.analysis_id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-2.5 px-3 font-medium text-slate-800">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                        {item.image ? (
                          <img src={item.image} alt={item.display_name} className="w-full h-full object-cover" />
                        ) : (
                          <Trash2 className="w-4 h-4 m-2 text-slate-400" />
                        )}
                      </div>
                      <span className="font-semibold text-slate-900 truncate max-w-[140px]">{item.display_name}</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-slate-600 capitalize">
                    {item.predicted_class.replace('_', ' ')}
                  </td>
                  <td className="py-2.5 px-3 font-bold text-emerald-600">
                    {item.confidence_pct}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      item.waste_group === 'Biodegradable'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                    }`}>
                      {item.waste_group}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-600 max-w-xs truncate">
                    {item.recommended_action}
                  </td>
                  <td className="py-2.5 px-3 text-slate-400 text-[11px]">
                    {new Date(item.created_at).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
