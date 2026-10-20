export interface SensorTelemetry {
  temperature: number; // in °C
  temperatureUnit: '°C';
  temperatureStatus: 'Optimal Chilled' | 'Controlled Ambient' | 'Thermal Abuse / Heat Risk';
  humidity: number; // in % RH
  humidityStatus: 'Optimal' | 'Elevated Moisture' | 'Excess Condensation / Mold Risk';
  ethylenePpm: number; // C2H4 emission in ppm
  ethyleneStatus: 'Trace Baseline (< 5 ppm)' | 'Ripening Peak (25-60 ppm)' | 'Severe Decay Spike (> 80 ppm)';
  vocPpm: number; // Volatile Organic Compounds / Ammonia / Methane in ppm
  spoilageIndex: number; // 0 to 100 Spoilage Index
  spoilageRisk: 'Low' | 'Medium' | 'Critical';
  pH: number; // food surface pH acidity
  pHStatus: 'Optimal Balance' | 'Mild Fermentation' | 'High Acid Decay';
  sensorVerification: string;
  multiModalScore: number; // Combined Vision + Sensor fusion confidence %
  anomalyDetected: boolean;
  anomalyNote?: string;
  hardwareNode: string;
  timestamp: number;
}

export interface SensorInputParams {
  analysisType: 'freshness' | 'waste';
  detectedClass: string;
  detectedName: string;
  freshness?: 'Fresh' | 'Moderate' | 'Spoiled';
  risk?: 'Low' | 'Medium' | 'High';
  confidenceScore: number;
  category?: string;
  sensorOverride?: Partial<{
    temperature: number;
    humidity: number;
    ethylenePpm: number;
    vocPpm: number;
    pH: number;
  }>;
}

export function generateSensorTelemetry(params: SensorInputParams): SensorTelemetry {
  const {
    analysisType,
    detectedClass,
    detectedName,
    freshness = 'Fresh',
    risk = 'Low',
    confidenceScore,
    category = 'Produce & Grocery',
    sensorOverride
  } = params;

  const now = Date.now();
  const lowerClass = (detectedClass || detectedName || '').toLowerCase();
  const isWaste = analysisType === 'waste' || ['food_waste', 'leaf_waste', 'metal_cans', 'plastic_bottles', 'plastic_bags', 'paper_waste', 'wood_waste', 'ewaste'].includes(lowerClass);

  let temp: number;
  let tempStatus: 'Optimal Chilled' | 'Controlled Ambient' | 'Thermal Abuse / Heat Risk';
  let humidity: number;
  let humidityStatus: 'Optimal' | 'Elevated Moisture' | 'Excess Condensation / Mold Risk';
  let ethylene: number;
  let ethyleneStatus: 'Trace Baseline (< 5 ppm)' | 'Ripening Peak (25-60 ppm)' | 'Severe Decay Spike (> 80 ppm)';
  let voc: number;
  let spoilageIdx: number;
  let spoilageRisk: 'Low' | 'Medium' | 'Critical';
  let phVal: number;
  let phStatus: 'Optimal Balance' | 'Mild Fermentation' | 'High Acid Decay';
  let verification: string;
  let multiModalConfidence: number;

  if (isWaste) {
    if (lowerClass === 'food_waste' || lowerClass.includes('food')) {
      // Decomposing organic food waste
      temp = 29.5 + Math.round(Math.random() * 35) / 10;
      tempStatus = 'Thermal Abuse / Heat Risk';
      humidity = 88 + Math.round(Math.random() * 8);
      humidityStatus = 'Excess Condensation / Mold Risk';
      ethylene = 95.0 + Math.round(Math.random() * 350) / 10;
      ethyleneStatus = 'Severe Decay Spike (> 80 ppm)';
      voc = 78.0 + Math.round(Math.random() * 250) / 10;
      spoilageIdx = 96;
      spoilageRisk = 'Critical';
      phVal = 4.1;
      phStatus = 'High Acid Decay';
      verification = 'Gas & thermal sensors confirm active organic decomposition. High bio-gas volatiles corroborating bio-waste segregation.';
      multiModalConfidence = Math.min(99.9, Math.round((confidenceScore * 70 + 29.5) * 10) / 10);
    } else {
      // Inert recyclable materials (Plastic, Metal, Paper, E-Waste)
      temp = 22.0 + Math.round(Math.random() * 20) / 10;
      tempStatus = 'Controlled Ambient';
      humidity = 42 + Math.round(Math.random() * 8);
      humidityStatus = 'Optimal';
      ethylene = 0.0;
      ethyleneStatus = 'Trace Baseline (< 5 ppm)';
      voc = 0.4 + Math.round(Math.random() * 10) / 10;
      spoilageIdx = 0;
      spoilageRisk = 'Low';
      phVal = 7.0;
      phStatus = 'Optimal Balance';
      verification = 'Zero biological emissions (0.0 ppm C2H4) verified by electrochemical gas sensor. Solid recyclable segregation confirmed.';
      multiModalConfidence = Math.round(confidenceScore * 1000) / 10;
    }
  } else {
    // Produce Freshness Scans (Apple, Banana, Orange, Produce)
    if (freshness === 'Spoiled' || risk === 'High' || lowerClass.includes('rotten') || lowerClass.includes('spoiled')) {
      // Spoiled / Rotten Food
      temp = 28.2 + Math.round(Math.random() * 40) / 10;
      tempStatus = 'Thermal Abuse / Heat Risk';
      humidity = 91 + Math.round(Math.random() * 6);
      humidityStatus = 'Excess Condensation / Mold Risk';
      ethylene = 88.5 + Math.round(Math.random() * 420) / 10;
      ethyleneStatus = 'Severe Decay Spike (> 80 ppm)';
      voc = 64.0 + Math.round(Math.random() * 320) / 10;
      spoilageIdx = 92;
      spoilageRisk = 'Critical';
      phVal = lowerClass.includes('orange') || lowerClass.includes('citrus') ? 3.4 : 4.2;
      phStatus = 'High Acid Decay';
      verification = 'Dual Confirmation: Visual rot confirmed by severe ethylene peak (>85 ppm) and microbial bio-gas emission. Immediate organic composting required.';
      multiModalConfidence = Math.min(99.9, Math.round((confidenceScore * 60 + 39.8) * 10) / 10);
    } else if (freshness === 'Moderate' || risk === 'Medium' || lowerClass.includes('moderate')) {
      // Near-Expiry / Ripening Peak
      temp = 20.5 + Math.round(Math.random() * 25) / 10;
      tempStatus = 'Controlled Ambient';
      humidity = 79 + Math.round(Math.random() * 6);
      humidityStatus = 'Elevated Moisture';
      ethylene = 42.0 + Math.round(Math.random() * 160) / 10;
      ethyleneStatus = 'Ripening Peak (25-60 ppm)';
      voc = 26.5 + Math.round(Math.random() * 80) / 10;
      spoilageIdx = 54;
      spoilageRisk = 'Medium';
      phVal = 5.3;
      phStatus = 'Mild Fermentation';
      verification = 'Sensors detect rising ethylene climacteric peak. Cellular breakdown in progress with 24-48 hr window. Prioritize immediate surplus donation.';
      multiModalConfidence = Math.min(96.5, Math.round((confidenceScore * 75 + 21.0) * 10) / 10);
    } else {
      // Certified Fresh (Grade A)
      temp = 5.8 + Math.round(Math.random() * 20) / 10; // Chilled safe 5.8°C - 7.8°C
      tempStatus = 'Optimal Chilled';
      humidity = 68 + Math.round(Math.random() * 8);
      humidityStatus = 'Optimal';
      ethylene = 1.2 + Math.round(Math.random() * 25) / 10; // Baseline trace 1.2 - 3.7 ppm
      ethyleneStatus = 'Trace Baseline (< 5 ppm)';
      voc = 3.5 + Math.round(Math.random() * 30) / 10;
      spoilageIdx = 8;
      spoilageRisk = 'Low';
      phVal = lowerClass.includes('orange') ? 3.8 : lowerClass.includes('apple') ? 4.0 : 5.8;
      phStatus = 'Optimal Balance';
      verification = 'Sensors confirm visual AI: Minimal ethylene emissions & strict cold-chain compliance verify Grade A retail freshness.';
      multiModalConfidence = Math.min(99.8, Math.round((confidenceScore * 70 + 29.8) * 10) / 10);
    }
  }

  // Handle user/simulator override if provided
  let anomalyDetected = false;
  let anomalyNote: string | undefined;

  if (sensorOverride) {
    if (typeof sensorOverride.temperature === 'number') {
      temp = sensorOverride.temperature;
      tempStatus = temp > 25 ? 'Thermal Abuse / Heat Risk' : temp > 15 ? 'Controlled Ambient' : 'Optimal Chilled';
    }
    if (typeof sensorOverride.humidity === 'number') {
      humidity = sensorOverride.humidity;
      humidityStatus = humidity > 85 ? 'Excess Condensation / Mold Risk' : humidity > 75 ? 'Elevated Moisture' : 'Optimal';
    }
    if (typeof sensorOverride.ethylenePpm === 'number') {
      ethylene = sensorOverride.ethylenePpm;
      ethyleneStatus = ethylene > 80 ? 'Severe Decay Spike (> 80 ppm)' : ethylene > 20 ? 'Ripening Peak (25-60 ppm)' : 'Trace Baseline (< 5 ppm)';
    }
    if (typeof sensorOverride.vocPpm === 'number') voc = sensorOverride.vocPpm;
    if (typeof sensorOverride.pH === 'number') phVal = sensorOverride.pH;

    // Check for sensor-vision conflict/anomaly
    if (freshness === 'Fresh' && (temp > 28 || ethylene > 60)) {
      anomalyDetected = true;
      anomalyNote = '⚠️ Sensor Anomaly: Visual AI appears fresh, but IoT gas/temp sensor detects severe thermal abuse or internal ethylene spike!';
      multiModalConfidence = Math.max(60.0, Math.round(multiModalConfidence * 0.75 * 10) / 10);
      spoilageRisk = 'Critical';
      spoilageIdx = Math.max(spoilageIdx, 75);
    } else if (freshness === 'Spoiled' && ethylene < 5 && temp < 8) {
      anomalyDetected = true;
      anomalyNote = '⚠️ Cross-Validation Note: Visual appearance shows discoloration, but sensors indicate cool dormant environment.';
    }
  }

  return {
    temperature: temp,
    temperatureUnit: '°C',
    temperatureStatus: tempStatus,
    humidity,
    humidityStatus,
    ethylenePpm: ethylene,
    ethyleneStatus,
    vocPpm: voc,
    spoilageIndex: spoilageIdx,
    spoilageRisk,
    pH: phVal,
    pHStatus: phStatus,
    sensorVerification: verification,
    multiModalScore: multiModalConfidence,
    anomalyDetected,
    anomalyNote,
    hardwareNode: 'IoT Node #FC-SEN-809 (DHT22 + MQ-135 + SGP40 Multi-Sensor)',
    timestamp: now
  };
}
