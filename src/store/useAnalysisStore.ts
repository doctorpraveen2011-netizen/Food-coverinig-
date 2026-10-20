import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface SensorData {
  temperature: string;
  humidity: string;
  gasVoc: string;
  pH: string;
  gasVocColor?: string;
}

export interface AnalyzedFood {
  id: string;
  food: string;
  displayName?: string;
  freshness: 'Fresh' | 'Moderate' | 'Spoiled' | string;
  risk: 'Low' | 'Medium' | 'High' | string;
  confidence: string;
  shelfLife: string;
  timestamp: number;
  imageUrl?: string;
  recommendation?: string;
  sensorData?: SensorData;
  actionTaken?: 'None' | 'Donated' | 'Reported';
  degradability?: 'Biodegradable' | 'Non-Biodegradable' | string;
  category?: string;
  ecoImpact?: string;
  action?: string;
  gradcam_image?: string;
  probabilities?: Record<string, number>;
  mode?: string;
  sensor_telemetry?: any;
  bio_probability?: number;
  non_bio_probability?: number;
}

interface AnalysisStore {
  history: AnalyzedFood[];
  latestScan: AnalyzedFood | null;
  addAnalysis: (data: Omit<AnalyzedFood, 'id' | 'timestamp'>) => void;
  syncScans: (scans: AnalyzedFood[]) => void;
  updateActionTaken: (id: string, action: 'Donated' | 'Reported') => void;
  clearHistory: () => void;
  getStats: () => {
    total: number;
    fresh: number;
    moderate: number;
    spoiled: number;
    safetyScore: number;
    passRate: number;
  };
}

export const useAnalysisStore = create<AnalysisStore>()(
  persist(
    (set, get) => ({
      history: [],
      latestScan: null,
      addAnalysis: (data) => {
        const newRecord: AnalyzedFood = {
          ...data,
          id: `SC-${Math.floor(Math.random() * 90000) + 10000}`,
          timestamp: Date.now()
        };
        set((state) => ({
          latestScan: newRecord,
          history: [newRecord, ...state.history.filter(h => h.id !== newRecord.id)].slice(0, 50)
        }));
      },
      syncScans: (scans) => {
        if (!scans || scans.length === 0) return;
        set((state) => {
          // Merge server scans with local scans by ID
          const existingIds = new Set(scans.map(s => s.id));
          const uniqueLocal = state.history.filter(h => !existingIds.has(h.id));
          const merged = [...scans, ...uniqueLocal].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
          return {
            history: merged.slice(0, 50),
            latestScan: merged[0] || state.latestScan || null
          };
        });
      },
      updateActionTaken: (id, action) => {
        set((state) => ({
          history: state.history.map((item) =>
            item.id === id ? { ...item, actionTaken: action } : item
          ),
          latestScan:
            state.latestScan?.id === id
              ? { ...state.latestScan, actionTaken: action }
              : state.latestScan
        }));
      },
      clearHistory: () => set({ history: [], latestScan: null }),
      getStats: () => {
        const history = get().history || [];
        const total = history.length;
        const fresh = history.filter((h) => h.freshness === 'Fresh').length;
        const moderate = history.filter((h) => h.freshness === 'Moderate').length;
        const spoiled = history.filter((h) => h.freshness === 'Spoiled').length;
        const safetyScore = total > 0 ? Math.round(((fresh * 1.0 + moderate * 0.6) / total) * 100) : 100;
        const passRate = total > 0 ? Math.round(((fresh + moderate) / total) * 100) : 100;
        return { total, fresh, moderate, spoiled, safetyScore, passRate };
      }
    }),
    {
      name: 'foodcovering-ai-scans-v3'
    }
  )
);
