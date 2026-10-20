import React, { useState } from 'react';
import {
  Thermometer,
  Droplets,
  Wind,
  Activity,
  Cpu,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Sliders,
  Radio,
  RefreshCw,
  Info
} from 'lucide-react';

export interface SensorTelemetryData {
  temperature: number;
  temperatureUnit?: string;
  temperatureStatus: string;
  humidity: number;
  humidityStatus: string;
  ethylenePpm: number;
  ethyleneStatus: string;
  vocPpm: number;
  spoilageIndex: number;
  spoilageRisk: 'Low' | 'Medium' | 'Critical';
  pH: number;
  pHStatus?: string;
  sensorVerification: string;
  multiModalScore: number;
  anomalyDetected?: boolean;
  anomalyNote?: string;
  hardwareNode?: string;
  timestamp?: number;
}

interface SensorTelemetryPanelProps {
  telemetry?: SensorTelemetryData;
  detectedName: string;
  freshness: string;
  confidence: string;
  onUpdateSensorOverride?: (override: { temperature: number; humidity: number; ethylenePpm: number; vocPpm: number; pH: number }) => void;
  isSimulating?: boolean;
}

export const SensorTelemetryPanel: React.FC<SensorTelemetryPanelProps> = ({
  telemetry,
  detectedName,
  freshness,
  confidence,
  onUpdateSensorOverride,
  isSimulating = false
}) => {
  const [showSimulator, setShowSimulator] = useState(false);
  const [customTemp, setCustomTemp] = useState<number>(telemetry?.temperature || 6.2);
  const [customHumidity, setCustomHumidity] = useState<number>(telemetry?.humidity || 68);
  const [customEthylene, setCustomEthylene] = useState<number>(telemetry?.ethylenePpm || 1.8);
  const [customVoc, setCustomVoc] = useState<number>(telemetry?.vocPpm || 3.5);
  const [customPh, setCustomPh] = useState<number>(telemetry?.pH || 5.2);

  if (!telemetry) {
    return (
      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center text-xs text-slate-500">
        Awaiting sensor telemetry synchronization...
      </div>
    );
  }

  const isSpoiled = freshness === 'Spoiled' || telemetry.spoilageRisk === 'Critical';
  const isModerate = freshness === 'Moderate' || telemetry.spoilageRisk === 'Medium';
  const isFresh = !isSpoiled && !isModerate;

  const tempVal = Number(telemetry.temperature ?? 6.2);
  const tempStatus = telemetry.temperatureStatus || (tempVal > 25 ? 'Thermal Abuse / Heat Risk' : tempVal > 15 ? 'Controlled Ambient' : 'Optimal Chilled');
  const humidityVal = Number(telemetry.humidity ?? 68);
  const humidityStatus = telemetry.humidityStatus || (humidityVal > 85 ? 'Excess Condensation / Mold Risk' : humidityVal > 75 ? 'Elevated Moisture' : 'Optimal');
  const ethyleneVal = Number(telemetry.ethylenePpm ?? 1.8);
  const ethyleneStatus = telemetry.ethyleneStatus || (ethyleneVal > 50 ? 'Severe Decay Spike (> 80 ppm)' : ethyleneVal > 5 ? 'Ripening Peak (25-60 ppm)' : 'Trace Baseline (< 5 ppm)');
  const vocVal = Number(telemetry.vocPpm ?? 3.5);
  const phVal = Number(telemetry.pH ?? 5.4);
  const spoilageRisk = telemetry.spoilageRisk || (isSpoiled ? 'Critical' : isModerate ? 'Medium' : 'Low');
  const spoilageIndex = telemetry.spoilageIndex ?? (isSpoiled ? 92 : isModerate ? 54 : 12);
  const multiModalScore = telemetry.multiModalScore ?? 96.5;
  const sensorVerification = telemetry.sensorVerification || `Multi-modal sensor validation verified (${tempVal.toFixed(1)}°C, ${Math.round(humidityVal)}% RH, ${ethyleneVal.toFixed(1)} ppm C2H4).`;

  const handleApplySimulator = () => {
    if (onUpdateSensorOverride) {
      onUpdateSensorOverride({
        temperature: Number(customTemp),
        humidity: Number(customHumidity),
        ethylenePpm: Number(customEthylene),
        vocPpm: Number(customVoc),
        pH: Number(customPh)
      });
    }
  };

  const handleResetToDetection = (preset: 'fresh' | 'moderate' | 'spoiled') => {
    if (preset === 'fresh') {
      setCustomTemp(6.2);
      setCustomHumidity(68);
      setCustomEthylene(1.8);
      setCustomVoc(3.2);
      setCustomPh(5.4);
    } else if (preset === 'moderate') {
      setCustomTemp(21.4);
      setCustomHumidity(81);
      setCustomEthylene(45.0);
      setCustomVoc(28.0);
      setCustomPh(5.0);
    } else {
      setCustomTemp(29.8);
      setCustomHumidity(92);
      setCustomEthylene(98.5);
      setCustomVoc(76.0);
      setCustomPh(3.8);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
      {/* 1. Header Bar with IoT Sync Status */}
      <div className="bg-linear-to-r from-slate-900 via-slate-800 to-indigo-950 p-4 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-mono font-bold tracking-wider text-emerald-400 uppercase">
              IoT Sensor Telemetry • Multi-Modal Fusion
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
              Live Edge Node
            </span>
          </div>
          <h3 className="text-sm font-bold text-white mt-1 flex items-center gap-1.5">
            <Radio className="w-4 h-4 text-emerald-400" />
            <span>Deep Learning Correlated Physical Sensors</span>
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowSimulator(!showSimulator)}
            className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer border border-white/15"
          >
            <Sliders className="w-3.5 h-3.5 text-indigo-300" />
            <span>{showSimulator ? 'Close Calibration' : 'Sensor Simulator'}</span>
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* 2. Sensor Metric Cards Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Card 1: Temperature */}
          <div className="p-3.5 rounded-xl border border-slate-200/90 bg-slate-50/60 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 text-slate-600">
                <Thermometer className="w-3.5 h-3.5 text-blue-600" />
                Temperature
              </span>
              <span className="text-[10px] font-mono text-slate-400">DHT22</span>
            </div>
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-slate-900 font-mono">
                  {tempVal.toFixed(1)}
                </span>
                <span className="text-xs font-bold text-slate-500">°C</span>
              </div>
              <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold mt-1 ${
                tempStatus.includes('Thermal Abuse') 
                  ? 'bg-rose-100 text-rose-800 border border-rose-200' 
                  : tempStatus.includes('Optimal') 
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                  : 'bg-amber-100 text-amber-800 border border-amber-200'
              }`}>
                {tempStatus}
              </span>
            </div>
          </div>

          {/* Card 2: Relative Humidity */}
          <div className="p-3.5 rounded-xl border border-slate-200/90 bg-slate-50/60 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 text-slate-600">
                <Droplets className="w-3.5 h-3.5 text-cyan-600" />
                Humidity
              </span>
              <span className="text-[10px] font-mono text-slate-400">RH%</span>
            </div>
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-slate-900 font-mono">
                  {Math.round(humidityVal)}
                </span>
                <span className="text-xs font-bold text-slate-500">% RH</span>
              </div>
              <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold mt-1 ${
                humidityStatus.includes('Excess') 
                  ? 'bg-rose-100 text-rose-800 border border-rose-200' 
                  : humidityStatus.includes('Optimal') 
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                  : 'bg-amber-100 text-amber-800 border border-amber-200'
              }`}>
                {humidityStatus}
              </span>
            </div>
          </div>

          {/* Card 3: Ethylene Gas (C2H4) */}
          <div className="p-3.5 rounded-xl border border-slate-200/90 bg-slate-50/60 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 text-slate-600">
                <Wind className="w-3.5 h-3.5 text-amber-600" />
                Ethylene (C₂H₄)
              </span>
              <span className="text-[10px] font-mono text-slate-400">MQ-135</span>
            </div>
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-slate-900 font-mono">
                  {ethyleneVal.toFixed(1)}
                </span>
                <span className="text-xs font-bold text-slate-500">ppm</span>
              </div>
              <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold mt-1 ${
                ethyleneStatus.includes('Severe') 
                  ? 'bg-rose-100 text-rose-800 border border-rose-200' 
                  : ethyleneStatus.includes('Trace') 
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                  : 'bg-amber-100 text-amber-800 border border-amber-200'
              }`}>
                {ethyleneStatus}
              </span>
            </div>
          </div>

          {/* Card 4: VOC / Spoilage Bio-Gas Index */}
          <div className="p-3.5 rounded-xl border border-slate-200/90 bg-slate-50/60 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 text-slate-600">
                <Activity className="w-3.5 h-3.5 text-purple-600" />
                Spoilage Gas
              </span>
              <span className="text-[10px] font-mono text-slate-400">SGP40</span>
            </div>
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-slate-900 font-mono">
                  {vocVal.toFixed(1)}
                </span>
                <span className="text-xs font-bold text-slate-500">ppm (pH {phVal.toFixed(1)})</span>
              </div>
              <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold mt-1 ${
                spoilageRisk === 'Critical' 
                  ? 'bg-rose-100 text-rose-800 border border-rose-200' 
                  : spoilageRisk === 'Low' 
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                  : 'bg-amber-100 text-amber-800 border border-amber-200'
              }`}>
                Index: {spoilageIndex}/100 • {spoilageRisk} Risk
              </span>
            </div>
          </div>
        </div>

        {/* 3. Multi-Modal Fusion Card: Deep Learning + Physical Telemetry Correlation */}
        <div className={`p-4 rounded-xl border ${
          isSpoiled
            ? 'bg-rose-50/70 border-rose-200 text-rose-950'
            : isModerate
            ? 'bg-amber-50/70 border-amber-200 text-amber-950'
            : 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
        }`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                isSpoiled ? 'bg-rose-200 text-rose-800' : isModerate ? 'bg-amber-200 text-amber-800' : 'bg-emerald-200 text-emerald-800'
              }`}>
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider">
                    Multi-Modal Vision + Sensor Fusion Verdict
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-black bg-white/80 shadow-2xs">
                    {multiModalScore}% Fused Confidence
                  </span>
                </div>
                <p className="text-xs mt-1 leading-relaxed font-medium">
                  {sensorVerification}
                </p>
                {telemetry.anomalyDetected && telemetry.anomalyNote && (
                  <div className="mt-2 p-2 rounded-lg bg-rose-100 border border-rose-300 text-rose-900 text-[11px] font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                    <span>{telemetry.anomalyNote}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="text-[10px] font-mono text-slate-500 block">AI Visual Inspection</span>
              <span className="text-xs font-bold text-slate-800">{detectedName} ({confidence})</span>
            </div>
          </div>
        </div>

        {/* 4. Interactive Sensor Simulator & Calibration Controls (Collapsible) */}
        {showSimulator && (
          <div className="p-4 bg-slate-900 text-white rounded-xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Hardware Sensor Calibration & Anomaly Simulator
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleResetToDetection('fresh')}
                  className="px-2 py-1 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 text-[10px] font-bold rounded border border-emerald-800 cursor-pointer"
                >
                  Preset: Fresh Cold
                </button>
                <button
                  type="button"
                  onClick={() => handleResetToDetection('moderate')}
                  className="px-2 py-1 bg-amber-950 hover:bg-amber-900 text-amber-300 text-[10px] font-bold rounded border border-amber-800 cursor-pointer"
                >
                  Preset: Near-Expiry
                </button>
                <button
                  type="button"
                  onClick={() => handleResetToDetection('spoiled')}
                  className="px-2 py-1 bg-rose-950 hover:bg-rose-900 text-rose-300 text-[10px] font-bold rounded border border-rose-800 cursor-pointer"
                >
                  Preset: Spoilage Spike
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              {/* Slider 1: Temperature */}
              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Temperature (°C)</span>
                  <span className="font-mono font-bold text-emerald-400">{customTemp}°C</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="40"
                  step="0.5"
                  value={customTemp}
                  onChange={(e) => setCustomTemp(parseFloat(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
                <span className="text-[10px] text-slate-400">Cold safe: 4-8°C • Abuse: &gt;25°C</span>
              </div>

              {/* Slider 2: Ethylene Gas */}
              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Ethylene (ppm C₂H₄)</span>
                  <span className="font-mono font-bold text-amber-400">{customEthylene} ppm</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="150"
                  step="1"
                  value={customEthylene}
                  onChange={(e) => setCustomEthylene(parseFloat(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
                <span className="text-[10px] text-slate-400">Normal: &lt;5 ppm • Decay: &gt;80 ppm</span>
              </div>

              {/* Slider 3: Humidity */}
              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Humidity (% RH)</span>
                  <span className="font-mono font-bold text-cyan-400">{customHumidity}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="100"
                  step="1"
                  value={customHumidity}
                  onChange={(e) => setCustomHumidity(parseFloat(e.target.value))}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
                <span className="text-[10px] text-slate-400">Optimal: 65-80% • Mold risk: &gt;90%</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <span className="text-[11px] text-slate-400">
                Adjust readings to simulate environmental stress or cold-chain sensor telemetry.
              </span>
              <button
                type="button"
                onClick={handleApplySimulator}
                disabled={isSimulating}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                {isSimulating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                <span>Recalculate Multi-Modal Fusion</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
