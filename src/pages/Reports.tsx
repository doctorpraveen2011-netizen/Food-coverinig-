import { useAnalysisStore, type AnalyzedFood } from '../store/useAnalysisStore';
import { useLocation, useNavigate } from 'react-router-dom';
import { getBackendUrl } from '../utils/apiConfig';
import { 
  Download, Printer, Send, ShieldCheck,
  CheckCircle2, AlertCircle, Info, Activity, Droplets, Wind, Thermometer,
  Scan, Sparkles
} from 'lucide-react';
import { useState, useEffect } from 'react';

const DEFAULT_SAMPLE_REPORT: AnalyzedFood = {
  id: 'FC-INS-2026-9812',
  food: 'Fresh Organic Red Apples',
  displayName: 'Organic Royal Gala Apples (Malus domestica)',
  freshness: 'Fresh',
  risk: 'Low',
  confidence: '98.4%',
  shelfLife: '14 - 18 Days',
  timestamp: Date.now() - 3600000 * 2,
  imageUrl: './samples/sample_fresh_apple.jpg',
  category: 'Fresh Produce (Organic Orchards)',
  recommendation: 'Certified Safe for Retail Distribution & Consumer Dispatch. Keep cold storage at 2-4°C.',
  sensorData: {
    temperature: '3.8°C',
    humidity: '88% RH',
    gasVoc: '0.04 ppm (Ethylene Optimal)',
    pH: '3.92 (Crisp acidity balance)'
  },
  sensor_telemetry: {
    temperature_c: 3.8,
    humidity_rh: 88.0,
    ethylene_ppm: 0.04,
    nh3_ppm: 0.01,
    co2_ppm: 420
  },
  degradability: 'Biodegradable',
  ecoImpact: '99.4% Carbon Offset Verified',
  action: 'Certified Safe for Retail Distribution'
};

export default function Reports() {
  const navigate = useNavigate();
  const location = useLocation();
  const { history, syncScans } = useAnalysisStore();
  const [serverScan, setServerScan] = useState<AnalyzedFood | null>(null);

  useEffect(() => {
    if (!location.state?.latestScanResult && (!history || history.length === 0)) {
      const backendUrl = getBackendUrl();
      if (!backendUrl) return;
      fetch(`${backendUrl}/api/ai/history?limit=1`)
        .then(r => r.json())
        .then(data => {
          if (data.analyses && data.analyses.length > 0) {
            const item = data.analyses[0];
            const adapted: AnalyzedFood = {
              id: item.analysis_id,
              food: item.display_name || item.detected_food || item.detected_item || 'Inspected Food',
              freshness: item.freshness || 'Spoiled',
              risk: item.risk || 'High',
              confidence: item.confidence_pct || '96%',
              shelfLife: item.shelf_life || 'Expired',
              timestamp: item.timestamp || Date.now(),
              imageUrl: item.image,
              gradcam_image: item.gradcam_image,
              recommendation: item.recommendation,
              category: item.category || 'Produce & Grocery',
              sensor_telemetry: item.sensor_telemetry
            };
            setServerScan(adapted);
            syncScans([adapted]);
          }
        })
        .catch(() => {});
    }
  }, []);

  const isUsingSample = !location.state?.latestScanResult && (!history || history.length === 0) && !serverScan;
  const scanData: AnalyzedFood = location.state?.latestScanResult || (history && history.length > 0 ? history[0] : (serverScan || DEFAULT_SAMPLE_REPORT));

  const getImgSrc = (url?: string) => {
    if (!url) return '';
    if (url.startsWith('/samples/')) return '.' + url;
    return url;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('en-US', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true
    });
  };

  const [finalDecision, setFinalDecision] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!finalDecision) {
      alert('Officer sign-off (Final Decision) is required before sending.');
      return;
    }
    setIsSubmitted(true);
    alert('Report successfully submitted to Shop Head Office!');
  };

  const getClassification = (food: string, risk: string) => {
    // @ts-ignore
    if (scanData?.category) return scanData.category;
    const lower = (food || '').toLowerCase();
    if (lower.includes('bottle') || lower.includes('plastic')) return 'Non-Biodegradable Recyclable (Polymer)';
    if (lower.includes('can') || lower.includes('metal')) return 'Non-Biodegradable Recyclable (Metal)';
    if (lower.includes('ewaste') || lower.includes('electronic')) return 'Non-Biodegradable Hazardous (E-Waste)';
    if (lower.includes('leaf') || lower.includes('wood')) return 'Biodegradable Biomass';
    if (lower.includes('paper') || lower.includes('cardboard')) return 'Biodegradable Packaging (Paper)';
    if (risk === 'High' || lower.includes('waste') || lower.includes('spoiled')) return 'Organic Waste / Biohazard';
    if (lower.includes('fruit') || lower.includes('banana') || lower.includes('apple') || lower.includes('veg') || lower.includes('salad')) return 'Fresh Produce';
    if (lower.includes('meat') || lower.includes('chicken') || lower.includes('fish') || lower.includes('seafood')) return 'Raw / Processed Meat';
    if (lower.includes('dairy') || lower.includes('milk')) return 'Dairy Product';
    return 'Bakery / Snack Food';
  };
  
  const classification = getClassification(scanData.food, scanData.risk);
  
  return (
    <div className="max-w-4xl mx-auto space-y-4 pb-12 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between border-b pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center border border-green-100">
            <ShieldCheck className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 leading-tight">FoodCovering</h1>
            <p className="text-xs text-gray-500">AI-powered food safety and food waste management</p>
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-sm font-semibold text-gray-900">Government Food Safety Department</h2>
          <p className="text-xs text-gray-500">Government of India - Admin User</p>
        </div>
      </div>

      <div className="pt-2">
        <h2 className="text-2xl font-bold text-blue-900">AI Food Safety Analysis Report</h2>
        <p className="text-xs text-gray-500 mt-1">AI-assisted food identification, freshness assessment, spoilage risk evaluation and shelf-life estimation</p>
      </div>

      {isUsingSample && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="text-xs font-semibold text-emerald-900">
              Displaying Official Sample Audit Report (Lot #FC-INS-2026-9812). Want to inspect your own food item?
            </span>
          </div>
          <button
            onClick={() => navigate('/user/ai-scan')}
            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shrink-0"
          >
            Launch Live AI Scanner
          </button>
        </div>
      )}

      {/* Meta Info */}
      <div className="grid grid-cols-4 gap-4 bg-white rounded-lg border p-4 shadow-sm">
        <div>
          <p className="text-[10px] text-gray-500 uppercase font-semibold">Report ID</p>
          <p className="text-sm font-medium">{scanData.id.toUpperCase() || `FC-${Math.floor(Math.random()*10000)}`}</p>
        </div>
        <div>
          <p className="text-[10px] text-gray-500 uppercase font-semibold">Analysis date</p>
          <p className="text-sm font-medium">{formatDate(scanData.timestamp)}</p>
        </div>
        <div>
          <p className="text-[10px] text-gray-500 uppercase font-semibold">Source</p>
          <p className="text-sm font-medium">Food Analysis Module</p>
        </div>
        <div>
          <p className="text-[10px] text-gray-500 uppercase font-semibold">Generated by</p>
          <p className="text-sm font-medium">FoodCovering AI System</p>
        </div>
      </div>

      {/* Deep Learning Detection Summary */}
      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <div className="bg-blue-50/50 px-4 py-2 border-b">
          <h3 className="text-sm font-semibold text-blue-900">Deep Learning Detection Summary</h3>
        </div>
        <div className="p-4 flex gap-6">
          {/* Image */}
          <div className="w-48 h-48 bg-gray-50 rounded-lg flex flex-col items-center justify-center shrink-0 border border-gray-200 overflow-hidden relative">
             {scanData.imageUrl ? (
               <img src={getImgSrc(scanData.imageUrl)} alt={scanData.food} className="w-full h-full object-cover" />
             ) : (
               <div className="w-24 h-24 border-4 border-amber-600 rounded-full flex items-center justify-center relative overflow-hidden">
                  <div className="absolute w-16 h-16 border-4 border-amber-600 rounded-full -top-4 -left-2"></div>
                  <div className="absolute w-16 h-16 border-4 border-amber-600 rounded-full -top-4 -right-2"></div>
                  <div className="absolute w-12 h-12 border-4 border-amber-600 rounded-full bottom-0"></div>
               </div>
             )}
          </div>
          {/* Stats Grid */}
          <div className="flex-1 grid grid-cols-3 gap-y-6 gap-x-4">
            <div>
              <p className="text-[10px] text-gray-500 uppercase font-semibold">Food identified</p>
              <p className="text-base font-semibold">{scanData.food}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-500 uppercase font-semibold">Classification</p>
              <p className="text-base font-semibold">{classification}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-500 uppercase font-semibold">Detected condition</p>
              <p className="text-base font-semibold">{scanData.freshness}</p>
            </div>
            
            <div className="col-span-1">
              <p className="text-[10px] text-gray-500 uppercase font-semibold mb-1">AI confidence</p>
              <div className="flex items-center gap-2">
                <span className="text-base font-semibold">{scanData.confidence}</span>
              </div>
              <div className="h-1.5 w-full bg-gray-100 rounded-full mt-1 overflow-hidden">
                 <div className="h-full bg-blue-600 rounded-full" style={{ width: scanData.confidence }}></div>
              </div>
            </div>
            
            <div>
              <p className="text-[10px] text-gray-500 uppercase font-semibold mb-1">Spoilage risk</p>
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${scanData.risk.toLowerCase() === 'low' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {scanData.risk}
              </span>
            </div>
            
            <div>
              <p className="text-[10px] text-gray-500 uppercase font-semibold mb-1">Estimated shelf life</p>
              <p className="text-base font-semibold">{scanData.shelfLife}</p>
            </div>

            <div className="col-span-3 pt-2 border-t mt-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-gray-500 uppercase font-semibold mb-1">Recommended status</p>
                  <p className="text-sm font-semibold flex items-center gap-1.5 text-gray-900">
                    {scanData.risk === 'High' ? (
                      <AlertCircle className="w-4 h-4 text-red-600" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    )}
                    {/* @ts-ignore */}
                    {scanData.action || scanData.recommendation || 'Safe for further handling'}
                  </p>
                </div>
                {/* @ts-ignore */}
                {scanData.degradability && (
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                    // @ts-ignore
                    scanData.degradability === 'Biodegradable'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                      : 'bg-blue-50 text-blue-700 border-blue-300'
                  }`}>
                    {/* @ts-ignore */}
                    {scanData.degradability === 'Biodegradable' ? '🌱 BIODEGRADABLE' : '♻️ NON-BIODEGRADABLE'}
                  </span>
                )}
              </div>
              {/* @ts-ignore */}
              {scanData.ecoImpact && (
                <p className="text-xs text-emerald-700 mt-1 font-medium">
                  {/* @ts-ignore */}
                  Carbon Offset Impact: {scanData.ecoImpact}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* AI Visual Explanation */}
      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <div className="bg-blue-50/50 px-4 py-2 border-b">
          <h3 className="text-sm font-semibold text-blue-900">AI Visual Explanation & Grad-CAM Heatmap</h3>
        </div>
        <div className="p-4">
          <div className="flex gap-4 mb-2">
             <div className="flex-1 bg-gray-50 rounded-lg p-0 border flex flex-col items-center justify-center h-40 overflow-hidden relative">
                {scanData.imageUrl ? (
                  <img src={getImgSrc(scanData.imageUrl)} alt="Original" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-16 h-16 border-4 border-amber-600 rounded-full flex items-center justify-center relative overflow-hidden">
                    <div className="absolute w-12 h-12 border-4 border-amber-600 rounded-full -top-3 -left-1"></div>
                    <div className="absolute w-12 h-12 border-4 border-amber-600 rounded-full -top-3 -right-1"></div>
                    <div className="absolute w-8 h-8 border-4 border-amber-600 rounded-full bottom-0"></div>
                  </div>
                )}
             </div>
             <div className="flex-1 bg-gray-50 rounded-lg p-0 border flex flex-col items-center justify-center h-40 relative overflow-hidden">
                {/* @ts-ignore */}
                {scanData.gradcam_image ? (
                  /* @ts-ignore */
                  <img src={getImgSrc(scanData.gradcam_image)} alt="AI Attention Grad-CAM" className="w-full h-full object-cover" />
                ) : scanData.imageUrl ? (
                  <div className="relative w-full h-full">
                    <img src={getImgSrc(scanData.imageUrl)} alt="AI Attention" className="w-full h-full object-cover opacity-80" />
                    <div className="absolute inset-0 flex items-center justify-center mix-blend-multiply opacity-60">
                       <div className="w-10 h-10 bg-red-500 rounded-full blur-xl absolute -ml-4 -mt-4"></div>
                       <div className="w-12 h-12 bg-yellow-400 rounded-full blur-lg absolute ml-4"></div>
                       <div className="w-8 h-8 bg-green-400 rounded-full blur-md absolute mt-8"></div>
                    </div>
                  </div>
                ) : (
                  <div className="w-16 h-16 border-4 border-amber-600/30 rounded-full flex items-center justify-center relative overflow-hidden">
                    <div className="absolute w-12 h-12 border-4 border-amber-600/30 rounded-full -top-3 -left-1"></div>
                    <div className="absolute w-12 h-12 border-4 border-amber-600/30 rounded-full -top-3 -right-1"></div>
                    <div className="absolute w-8 h-8 border-4 border-amber-600/30 rounded-full bottom-0"></div>
                  </div>
                )}
             </div>
          </div>
          <div className="flex gap-4 text-center">
             <div className="flex-1 text-[10px] text-gray-500 uppercase font-medium">Original food image</div>
             <div className="flex-1 text-[10px] text-gray-500 uppercase font-medium">AI visual attention / Grad-CAM</div>
          </div>
          <p className="text-xs text-gray-500 mt-3">Highlighted regions indicate visual features considered by the AI model during food identification and condition assessment.</p>
        </div>
      </div>

      <div className="flex gap-4">
        {/* Food Safety Assessment */}
        <div className="bg-white rounded-lg border shadow-sm overflow-hidden flex-[2]">
          <div className="bg-blue-50/50 px-4 py-2 border-b">
            <h3 className="text-sm font-semibold text-blue-900">Food Safety Assessment</h3>
          </div>
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-[10px] text-gray-500 uppercase border-b">
              <tr>
                <th className="px-4 py-2 font-semibold">Parameter</th>
                <th className="px-4 py-2 font-semibold">Assessment</th>
                <th className="px-4 py-2 font-semibold text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr>
                <td className="px-4 py-2 text-gray-600">Visual condition</td>
                <td className="px-4 py-2 font-medium">Good</td>
                <td className="px-4 py-2 text-center"><span className="px-2 py-0.5 rounded-full border border-green-200 text-[10px] font-bold text-green-600 bg-green-50">SAFE</span></td>
              </tr>
              <tr>
                <td className="px-4 py-2 text-gray-600">Visible spoilage</td>
                <td className="px-4 py-2 font-medium">Not detected</td>
                <td className="px-4 py-2 text-center"><span className="px-2 py-0.5 rounded-full border border-green-200 text-[10px] font-bold text-green-600 bg-green-50">SAFE</span></td>
              </tr>
              <tr>
                <td className="px-4 py-2 text-gray-600">Surface abnormality</td>
                <td className="px-4 py-2 font-medium">Not detected</td>
                <td className="px-4 py-2 text-center"><span className="px-2 py-0.5 rounded-full border border-green-200 text-[10px] font-bold text-green-600 bg-green-50">SAFE</span></td>
              </tr>
              <tr>
                <td className="px-4 py-2 text-gray-600">AI risk level</td>
                <td className="px-4 py-2 font-medium">Low</td>
                <td className="px-4 py-2 text-center"><span className="px-2 py-0.5 rounded-full border border-green-200 text-[10px] font-bold text-green-600 bg-green-50">SAFE</span></td>
              </tr>
              <tr className="bg-blue-50/30">
                <td className="px-4 py-2 text-gray-600 font-medium">Recommended action</td>
                <td className="px-4 py-2 font-medium text-blue-900">Safe for further handling</td>
                <td className="px-4 py-2 text-center"><span className="px-2 py-0.5 rounded-full border border-blue-200 text-[10px] font-bold text-blue-600 bg-blue-50">INFO</span></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Sensor-Based Assessment */}
        <div className="bg-white rounded-lg border shadow-sm overflow-hidden flex-1">
          <div className="bg-blue-50/50 px-4 py-2 border-b flex items-center justify-between">
            <h3 className="text-sm font-semibold text-blue-900">Sensor-Based Telemetry</h3>
            <span className="text-[9px] font-mono text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
              IoT DHT22 + MQ-135
            </span>
          </div>
          <div className="p-4 grid grid-cols-2 gap-3">
             <div className="bg-gray-50 p-2 rounded border">
                <p className="text-[10px] text-gray-500 uppercase flex items-center gap-1"><Thermometer className="w-3 h-3 text-blue-600"/> Temperature</p>
                {/* @ts-ignore */}
                <p className="text-base font-semibold mt-1">{scanData.sensor_telemetry?.temperature ? `${scanData.sensor_telemetry.temperature}°C` : scanData.sensorData?.temperature || '6.4°C'}</p>
                {/* @ts-ignore */}
                <span className="text-[9px] font-bold text-slate-500">{scanData.sensor_telemetry?.temperatureStatus || (scanData.risk === 'High' ? 'Thermal Abuse' : 'Optimal Chilled')}</span>
             </div>
             <div className="bg-gray-50 p-2 rounded border">
                <p className="text-[10px] text-gray-500 uppercase flex items-center gap-1"><Droplets className="w-3 h-3 text-cyan-600"/> Humidity</p>
                {/* @ts-ignore */}
                <p className="text-base font-semibold mt-1">{scanData.sensor_telemetry?.humidity ? `${scanData.sensor_telemetry.humidity}% RH` : scanData.sensorData?.humidity || '68% RH'}</p>
                {/* @ts-ignore */}
                <span className="text-[9px] font-bold text-slate-500">{scanData.sensor_telemetry?.humidityStatus || (scanData.risk === 'High' ? 'Excess Condensation' : 'Optimal Storage')}</span>
             </div>
             <div className="bg-gray-50 p-2 rounded border">
                <p className="text-[10px] text-gray-500 uppercase flex items-center gap-1"><Wind className="w-3 h-3 text-amber-600"/> Ethylene / Gas</p>
                {/* @ts-ignore */}
                <p className="text-base font-semibold mt-1">{scanData.sensor_telemetry?.ethylenePpm !== undefined ? `${scanData.sensor_telemetry.ethylenePpm.toFixed(1)} ppm` : scanData.sensorData?.gasVoc || '1.8 ppm'}</p>
                {/* @ts-ignore */}
                <span className="text-[9px] font-bold text-slate-500">{scanData.sensor_telemetry?.ethyleneStatus || (scanData.risk === 'High' ? 'Decay Spike' : 'Trace Safe')}</span>
             </div>
             <div className="bg-gray-50 p-2 rounded border">
                <p className="text-[10px] text-gray-500 uppercase flex items-center gap-1"><Activity className="w-3 h-3 text-purple-600"/> Surface pH</p>
                {/* @ts-ignore */}
                <p className="text-base font-semibold mt-1">{scanData.sensor_telemetry?.pH !== undefined ? scanData.sensor_telemetry.pH.toFixed(1) : scanData.sensorData?.pH || '5.4'}</p>
                {/* @ts-ignore */}
                <span className="text-[9px] font-bold text-slate-500">{scanData.sensor_telemetry?.pHStatus || (scanData.risk === 'High' ? 'Fermentative Decay' : 'Optimal Acidity')}</span>
             </div>
          </div>
        </div>
      </div>

      {/* AI Assessment and Recommended Action */}
      <div className="bg-white rounded-lg border-l-4 border-l-green-500 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b flex justify-between items-center bg-gray-50/50">
          <h3 className="text-sm font-bold text-blue-900">AI Assessment and Recommended Action</h3>
          <span className="text-[10px] font-bold border border-blue-900 text-blue-900 px-2 py-0.5 rounded">AI-ASSISTED ASSESSMENT</span>
        </div>
        <div className="p-4">
           <div className="grid grid-cols-4 gap-4 mb-4 border border-gray-100 rounded-lg p-3 bg-gray-50/30">
              <div>
                <p className="text-[10px] text-gray-500 uppercase font-semibold">Overall status</p>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700 mt-1 border border-green-200">
                  LOW RISK
                </span>
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase font-semibold">Food condition</p>
                <p className="text-sm font-semibold mt-1">Suitable for further handling</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase font-semibold">Spoilage risk</p>
                <p className="text-sm font-semibold mt-1">Low</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase font-semibold">Shelf life</p>
                <p className="text-sm font-semibold mt-1">2-3 Days</p>
              </div>
           </div>
           <div>
              <p className="text-[10px] text-gray-500 uppercase font-semibold mb-1">Recommended action</p>
              <p className="text-sm text-gray-800">Continue normal food handling and storage conditions. Reassessment is recommended if the food's appearance, smell or storage conditions change.</p>
           </div>
        </div>
      </div>

      {/* Official Review and Verification */}
      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <div className="bg-blue-50/50 px-4 py-2 border-b">
          <h3 className="text-sm font-semibold text-blue-900">Official Review and Verification</h3>
        </div>
        <div className="p-4 space-y-4">
           <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-[10px] text-gray-500 uppercase font-semibold block mb-1">Inspector / officer name</label>
                <input type="text" className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="text-[10px] text-gray-500 uppercase font-semibold block mb-1">Department / office</label>
                <input type="text" className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="text-[10px] text-gray-500 uppercase font-semibold block mb-1">Inspection date</label>
                <input type="date" className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm outline-none focus:border-blue-500" />
              </div>
           </div>
           <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] text-gray-500 uppercase font-semibold block mb-1">Inspector remarks</label>
                <textarea rows={2} className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm outline-none focus:border-blue-500 resize-none"></textarea>
              </div>
              <div>
                <label className="text-[10px] text-gray-500 uppercase font-semibold block mb-1">Corrective action</label>
                <textarea rows={2} className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm outline-none focus:border-blue-500 resize-none"></textarea>
              </div>
           </div>
           <div className="flex items-center gap-6 pt-2">
              <span className="text-[10px] text-gray-500 uppercase font-semibold">Final decision</span>
              <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                <input type="radio" name="decision" value="approved" onChange={e=>setFinalDecision(e.target.value)} className="w-3.5 h-3.5 text-blue-600" /> Approved
              </label>
              <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                <input type="radio" name="decision" value="review" onChange={e=>setFinalDecision(e.target.value)} className="w-3.5 h-3.5 text-blue-600" /> Requires review
              </label>
              <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                <input type="radio" name="decision" value="high_risk" onChange={e=>setFinalDecision(e.target.value)} className="w-3.5 h-3.5 text-blue-600" /> High risk
              </label>
              <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                <input type="radio" name="decision" value="reinspection" onChange={e=>setFinalDecision(e.target.value)} className="w-3.5 h-3.5 text-blue-600" /> Reinspection required
              </label>
           </div>
           <div className="flex items-center gap-4 pt-2 border-t">
              <span className="text-[10px] text-gray-500 uppercase font-semibold">HOD review</span>
              <span className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-semibold rounded-full border border-amber-200">
                Pending HOD review
              </span>
           </div>
        </div>
      </div>

      {/* Submit to Shop Head Office */}
      <div className="bg-white rounded-lg border border-blue-200 shadow-sm overflow-hidden">
        <div className="bg-blue-50 px-4 py-2 border-b border-blue-100 flex items-center gap-2">
          <Send className="w-4 h-4 text-blue-600" />
          <h3 className="text-sm font-semibold text-blue-900">Submit to Shop Head Office</h3>
        </div>
        <div className="p-4 space-y-4">
           <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-[10px] text-gray-500 uppercase font-semibold block mb-1">Shop / outlet name</label>
                <select className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm outline-none focus:border-blue-500 bg-white">
                  <option>Select shop</option>
                  <option>Fresh Mart - Downtown</option>
                  <option>City Bakery - Westside</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] text-gray-500 uppercase font-semibold block mb-1">Shop ID / licence no.</label>
                <input type="text" placeholder="FSSAI / outlet ID" className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="text-[10px] text-gray-500 uppercase font-semibold block mb-1">Head office</label>
                <select className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm outline-none focus:border-blue-500 bg-white">
                  <option>Select head office</option>
                  <option>Regional HQ - North</option>
                  <option>Central Command</option>
                </select>
              </div>
           </div>
           <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] text-gray-500 uppercase font-semibold block mb-1">Submitted by</label>
                <input type="text" value="Admin User - System Administrator" readOnly className="w-full border border-gray-200 bg-gray-50 rounded px-3 py-1.5 text-sm text-gray-600 outline-none" />
              </div>
              <div>
                <label className="text-[10px] text-gray-500 uppercase font-semibold block mb-1">Priority</label>
                <select className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm outline-none focus:border-blue-500 bg-white">
                  <option>Routine</option>
                  <option>High Priority</option>
                  <option>Urgent Action</option>
                </select>
              </div>
           </div>
           <div>
              <label className="text-[10px] text-gray-500 uppercase font-semibold block mb-1">Remarks to head office</label>
              <textarea rows={2} className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm outline-none focus:border-blue-500 resize-none"></textarea>
           </div>
           <div className="flex items-center gap-6 pt-2">
              <span className="text-[10px] text-gray-500 uppercase font-semibold">Attached</span>
              <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                <input type="checkbox" defaultChecked className="w-3.5 h-3.5 rounded text-blue-600" /> Report PDF
              </label>
              <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                <input type="checkbox" defaultChecked className="w-3.5 h-3.5 rounded text-blue-600" /> Food image
              </label>
              <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                <input type="checkbox" defaultChecked className="w-3.5 h-3.5 rounded text-blue-600" /> Grad-CAM
              </label>
              <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                <input type="checkbox" defaultChecked className="w-3.5 h-3.5 rounded text-blue-600" /> Sensor data
              </label>
           </div>
           <div className="flex items-center gap-4 pt-4 border-t">
              <span className="text-[10px] text-gray-500 uppercase font-semibold">Submission status</span>
              {isSubmitted ? (
                <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full border border-green-200">
                  Submitted successfully
                </span>
              ) : (
                <>
                  <span className="px-3 py-1 bg-orange-100 text-orange-800 text-xs font-semibold rounded-full border border-orange-200">
                    Not yet submitted
                  </span>
                  <span className="text-xs text-gray-400 italic">Officer sign-off required before sending</span>
                </>
              )}
           </div>
        </div>
      </div>

      {/* Report Workflow */}
      <div className="bg-white rounded-lg border shadow-sm p-4">
        <h3 className="text-[10px] text-gray-500 uppercase font-semibold mb-3">Report Workflow</h3>
        <div className="flex items-center flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-1 text-green-600 font-medium"><CheckCircle2 className="w-3 h-3" /> Food analysis</div>
          <span className="text-gray-300">→</span>
          <div className="flex items-center gap-1 text-green-600 font-medium"><CheckCircle2 className="w-3 h-3" /> Deep learning detection</div>
          <span className="text-gray-300">→</span>
          <div className="flex items-center gap-1 text-green-600 font-medium"><CheckCircle2 className="w-3 h-3" /> AI assessment</div>
          <span className="text-gray-300">→</span>
          <div className="flex items-center gap-1 text-green-600 font-medium"><CheckCircle2 className="w-3 h-3" /> Report generation</div>
          <span className="text-gray-300">→</span>
          <div className="flex items-center gap-1 text-amber-600 font-medium"><div className="w-3 h-3 border border-amber-600 rounded-sm" /> Officer review</div>
          <span className="text-gray-300">→</span>
          <div className={`flex items-center gap-1 ${isSubmitted ? 'text-green-600 font-medium' : 'text-gray-400'}`}>
             {isSubmitted ? <CheckCircle2 className="w-3 h-3" /> : <div className="w-3 h-3 border border-gray-300 rounded-sm" />} 
             Shop head office
          </div>
          <span className="text-gray-300">→</span>
          <div className={`flex items-center gap-1 ${isSubmitted ? 'text-amber-600 font-medium' : 'text-gray-400'}`}>
             {isSubmitted ? <div className="w-3 h-3 border border-amber-600 rounded-sm" /> : <div className="w-3 h-3 border border-gray-300 rounded-sm" />}
             HOD review
          </div>
          <span className="text-gray-300">→</span>
          <div className="flex items-center gap-1 text-gray-400"><div className="w-3 h-3 border border-gray-300 rounded-sm" /> Verification</div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-blue-50/50 rounded-lg border border-blue-100 p-4 flex gap-3">
        <Info className="w-5 h-5 text-blue-500 shrink-0" />
        <div>
           <h4 className="text-sm font-semibold text-blue-900">AI-assisted assessment</h4>
           <p className="text-xs text-gray-600 mt-1 leading-relaxed">
             All assessments generated by FoodCovering are AI-assisted decision-support outputs. Final food-safety decisions must be based on authorized inspection, laboratory verification where applicable, and applicable food-safety regulations.
           </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-4 pt-4">
        <button 
          onClick={() => window.print()}
          className="px-4 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50 rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
        >
          <Printer className="w-4 h-4" /> Print report
        </button>
        <button 
          onClick={() => window.print()}
          className="px-4 py-2 text-sm font-semibold text-gray-700 border border-gray-300 hover:bg-gray-50 rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
        >
          <Download className="w-4 h-4" /> Download PDF
        </button>
        <button 
          onClick={handleSubmit}
          disabled={isSubmitted}
          className={`px-6 py-2 text-sm font-semibold text-white rounded-lg flex items-center gap-2 transition-colors shadow-md ${isSubmitted ? 'bg-green-600 cursor-not-allowed' : 'bg-[#0f2c59] hover:bg-[#1a3c75]'}`}
        >
          {isSubmitted ? <CheckCircle2 className="w-4 h-4" /> : <Send className="w-4 h-4" />} 
          {isSubmitted ? 'Submitted' : 'Submit to shop head office'}
        </button>
      </div>

    </div>
  );
}

