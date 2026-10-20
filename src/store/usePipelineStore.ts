import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';

interface KPI {
  totalDonations: number;
  activeVolunteers: number;
  complaintsResolved: number;
  foodSafetyScore: number;
}

interface MapTracking {
  donorPos: [number, number];
  volunteerPos: [number, number];
  facilityPos: [number, number];
  destinationPos: [number, number];
  eta: number;
  status: string;
  contacts?: {
    donor: string;
    volunteer: string;
    recipient: string;
  };
}

interface Activity {
  id: string;
  message: string;
  time: string;
  type: string;
}

interface Charts {
  donationOverview: any[];
  categoryData: any[];
  processingData: any[];
  foodQualityData: any[];
}

interface Tables {
  recentDonations: any[];
  recentComplaints: any[];
}

interface CityMap {
  activeVolunteers: { id: string; pos: [number, number] }[];
  activeDonors: { id: string; pos: [number, number] }[];
  facilities: { id: string; pos: [number, number] }[];
}

interface SystemMetrics {
  cpuUsage: number;
  memoryUsage: number;
  latency: number;
  activeConnections: number;
  uptime: string;
}

interface PipelineState {
  socket: Socket | null;
  isConnected: boolean;
  kpi: KPI;
  tracking: MapTracking;
  cityMap: CityMap;
  systemMetrics: SystemMetrics;
  activity: Activity[];
  charts: Charts;
  tables: Tables;
  mapAction: string | null;
  connect: () => void;
  disconnect: () => void;
  triggerMapAction: (action: string) => void;
  clearMapAction: () => void;
}

const defaultKPI: KPI = {
  totalDonations: 1248,
  activeVolunteers: 86,
  complaintsResolved: 172,
  foodSafetyScore: 98.4
};

const defaultTracking: MapTracking = {
  donorPos: [28.6315, 77.2167],
  volunteerPos: [28.6370, 77.2135],
  facilityPos: [28.5355, 77.2715],
  destinationPos: [28.6430, 77.2110],
  eta: 12,
  status: 'In Transit',
  contacts: {
    donor: '+91 98222 33445',
    volunteer: '+91 98765 43210',
    recipient: '+91 98111 55667'
  }
};

const defaultCharts: Charts = {
  donationOverview: [
    { name: '15 Oct', donations: 34, completed: 28 },
    { name: '16 Oct', donations: 48, completed: 42 },
    { name: '17 Oct', donations: 52, completed: 46 },
    { name: '18 Oct', donations: 61, completed: 55 },
    { name: '19 Oct', donations: 70, completed: 64 },
    { name: '20 Oct', donations: 85, completed: 79 },
    { name: 'Today', donations: 92, completed: 86 }
  ],
  categoryData: [
    { name: 'Fruits & Vegetables', value: 42, color: '#10B981' },
    { name: 'Dairy Products', value: 24, color: '#3B82F6' },
    { name: 'Bakery Items', value: 18, color: '#F59E0B' },
    { name: 'Grains & Pulses', value: 10, color: '#8B5CF6' },
    { name: 'Prepared Meals', value: 6, color: '#EC4899' }
  ],
  processingData: [
    { name: 'Packed & Ready', value: 78, color: '#3B82F6' },
    { name: 'Quality Sorted', value: 62, color: '#10B981' },
    { name: 'Cold-Chain Stored', value: 44, color: '#8B5CF6' },
    { name: 'Dispatched / In Transit', value: 31, color: '#F59E0B' }
  ],
  foodQualityData: [
    { name: 'Optimal (Fresh A+)', value: 94, color: '#10B981' },
    { name: 'Moderate (Near Expiry)', value: 5, color: '#F59E0B' },
    { name: 'Critical / Diverted', value: 1, color: '#EF4444' }
  ]
};

const defaultTables: Tables = {
  recentDonations: [
    {
      id: 'DC-00326',
      food: 'Surplus Bakery Loaves',
      qty: '30 kg',
      donor: 'FreshMart Flagship Supermarket',
      phone: '+91 98222 33445',
      email: 'official@freshmart.com',
      phoneVerified: true,
      emailVerified: true,
      receiver: 'Community Kitchen #4',
      region: 'Central Delhi',
      volunteer: 'Arjun Sharma',
      status: 'In Transit',
      date: 'Today',
      eta: '12 mins',
      statusColor: 'bg-emerald-100 text-emerald-800'
    },
    {
      id: 'DC-U679',
      food: 'Prepared Rice & Meals',
      qty: '15 Servings',
      donor: 'Praveen Kumar',
      phone: '+91 82488 32986',
      email: 'praveen@foodcovering.org',
      phoneVerified: true,
      emailVerified: true,
      receiver: 'Green Life Foundation Kitchen',
      region: 'Chennai',
      volunteer: 'Vikram Sethi',
      status: 'In Transit',
      date: 'Today',
      eta: '25 mins',
      statusColor: 'bg-emerald-100 text-emerald-800'
    },
    {
      id: 'DC-00325',
      food: 'Organic Apples & Oranges',
      qty: '45 kg',
      donor: 'BigBasket Rapid Hub',
      phone: '+91 98450 11223',
      email: 'logistics@bigbasket.com',
      phoneVerified: true,
      emailVerified: true,
      receiver: 'Bal Sahyog Shelter Kitchen',
      region: 'New Delhi',
      volunteer: 'Sanjay Rawat',
      status: 'In Transit',
      date: 'Today',
      eta: '8 mins',
      statusColor: 'bg-emerald-100 text-emerald-800'
    }
  ],
  recentComplaints: [
    {
      id: 'CMP-2026-001',
      food: 'Organic Full-Cream Milk (1L)',
      seller: 'FreshMart Flagship Supermarket',
      status: 'Resolved',
      date: '18 Oct 2026',
      officer: 'Senior Food Safety Officer',
      statusColor: 'bg-emerald-100 text-emerald-800'
    },
    {
      id: 'CMP-2026-002',
      food: 'Whole Wheat Bread (400g)',
      seller: 'FreshMart Flagship Supermarket',
      status: 'Under Investigation',
      date: '19 Oct 2026',
      officer: 'Store Quality Inspector',
      statusColor: 'bg-amber-100 text-amber-800'
    }
  ]
};

const defaultActivity: Activity[] = [
  { id: 'act-1', message: 'Surplus Bakery Loaves (30 kg) dispatched via Refrigerated EV', time: '4 mins ago', type: 'donation' },
  { id: 'act-2', message: 'Food Safety Audit passed for FreshMart Connaught Place', time: '12 mins ago', type: 'audit' },
  { id: 'act-3', message: 'Handover OTP #849204 verified for Community Shelter Kitchen', time: '22 mins ago', type: 'donation' },
  { id: 'act-4', message: 'AI Freshness Scan: Organic Milk batch verified Grade A', time: '35 mins ago', type: 'donation' },
  { id: 'act-5', message: 'Consumer report CMP-2026-001 resolved with full UPI refund', time: '1 hour ago', type: 'complaint' }
];

const defaultCityMap: CityMap = {
  activeVolunteers: [
    { id: 'vol-1', pos: [28.6315, 77.2167] },
    { id: 'vol-2', pos: [28.6430, 77.2110] },
    { id: 'vol-3', pos: [28.5355, 77.2715] },
    { id: 'vol-4', pos: [28.6318, 77.1268] }
  ],
  activeDonors: [
    { id: 'don-1', pos: [28.6300, 77.2180] },
    { id: 'don-2', pos: [28.5390, 77.2700] }
  ],
  facilities: [
    { id: 'fac-1', pos: [28.5355, 77.2715] },
    { id: 'fac-2', pos: [28.6318, 77.1268] },
    { id: 'fac-3', pos: [28.8428, 77.0924] }
  ]
};

const defaultSystemMetrics: SystemMetrics = {
  cpuUsage: 18,
  memoryUsage: 42,
  latency: 38,
  activeConnections: 142,
  uptime: '99.98%'
};

let offlineSimulationTimer: any = null;

export const usePipelineStore = create<PipelineState>((set, get) => ({
  socket: null,
  isConnected: true, // Optimistically true for immediate full display
  kpi: defaultKPI,
  tracking: defaultTracking,
  activity: defaultActivity,
  cityMap: defaultCityMap,
  systemMetrics: defaultSystemMetrics,
  mapAction: null,
  charts: defaultCharts,
  tables: defaultTables,

  triggerMapAction: (action) => set({ mapAction: action }),
  clearMapAction: () => set({ mapAction: null }),

  connect: () => {
    // Only attempt real socket connection if running on localhost or custom live backend domain
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      try {
        const socket = io('http://localhost:5000', { reconnectionAttempts: 2, timeout: 2000 });

        socket.on('connect', () => {
          set({ isConnected: true });
          if (offlineSimulationTimer) {
            clearInterval(offlineSimulationTimer);
            offlineSimulationTimer = null;
          }
        });

        socket.on('disconnect', () => {
          set({ isConnected: false });
        });

        socket.on('pipelineData', (data: any) => {
          set({
            kpi: data.kpi || get().kpi,
            tracking: data.tracking || get().tracking,
            cityMap: data.cityMap || get().cityMap,
            systemMetrics: data.systemMetrics || get().systemMetrics,
            activity: data.activity || get().activity,
            charts: data.charts || get().charts,
            tables: data.tables || get().tables
          });
        });

        set({ socket });
        return;
      } catch {
        // Fall through to local animation pulse
      }
    }

    // Offline / Public Deployment Mode: Run smooth realistic coordinate and metric animation
    if (!offlineSimulationTimer) {
      offlineSimulationTimer = setInterval(() => {
        set((state) => {
          // Slight realistic telemetry jitter
          const newVolLat = state.tracking.volunteerPos[0] + (Math.random() - 0.49) * 0.0004;
          const newVolLng = state.tracking.volunteerPos[1] + (Math.random() - 0.49) * 0.0004;
          
          return {
            systemMetrics: {
              ...state.systemMetrics,
              cpuUsage: Math.min(65, Math.max(12, state.systemMetrics.cpuUsage + Math.floor((Math.random() - 0.5) * 6))),
              memoryUsage: Math.min(60, Math.max(35, state.systemMetrics.memoryUsage + Math.floor((Math.random() - 0.5) * 3))),
              latency: Math.min(80, Math.max(22, state.systemMetrics.latency + Math.floor((Math.random() - 0.5) * 8)))
            },
            tracking: {
              ...state.tracking,
              volunteerPos: [newVolLat, newVolLng]
            }
          };
        });
      }, 4000);
    }
  },

  disconnect: () => {
    if (offlineSimulationTimer) {
      clearInterval(offlineSimulationTimer);
      offlineSimulationTimer = null;
    }
    const socket = get().socket;
    if (socket) {
      socket.disconnect();
      set({ socket: null, isConnected: false });
    }
  }
}));
