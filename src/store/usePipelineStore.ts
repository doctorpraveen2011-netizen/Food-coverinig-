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
  totalDonations: 0,
  activeVolunteers: 0,
  complaintsResolved: 0,
  foodSafetyScore: 0
};

const defaultTracking: MapTracking = {
  donorPos: [13.0827, 80.2707],
  volunteerPos: [13.0850, 80.2750],
  facilityPos: [13.0900, 80.2800],
  destinationPos: [13.0950, 80.2850],
  eta: 18,
  status: 'In Transit',
  contacts: {
    donor: '+919876543211',
    volunteer: '+919876543210',
    recipient: '+919876543212'
  }
};

export const usePipelineStore = create<PipelineState>((set, get) => ({
  socket: null,
  isConnected: false,
  kpi: defaultKPI,
  tracking: defaultTracking,
  activity: [],
  cityMap: { activeVolunteers: [], activeDonors: [], facilities: [] },
  systemMetrics: { cpuUsage: 0, memoryUsage: 0, latency: 0, activeConnections: 0, uptime: '0%' },
  mapAction: null,
  charts: {
    donationOverview: [],
    categoryData: [],
    processingData: [],
    foodQualityData: []
  },
  tables: {
    recentDonations: [],
    recentComplaints: []
  },

  triggerMapAction: (action) => set({ mapAction: action }),
  clearMapAction: () => set({ mapAction: null }),

  connect: () => {
    const backendUrl = window.location.hostname === 'localhost' ? 'http://localhost:5000' : `http://${window.location.hostname}:5000`;
    const socket = io(backendUrl);

    socket.on('connect', () => {
      set({ isConnected: true });
    });

    socket.on('disconnect', () => {
      set({ isConnected: false });
    });

    socket.on('pipelineData', (data: any) => {
      set({
        kpi: data.kpi,
        tracking: data.tracking,
        cityMap: data.cityMap,
        systemMetrics: data.systemMetrics,
        activity: data.activity,
        charts: data.charts,
        tables: data.tables
      });
    });

    set({ socket });
  },

  disconnect: () => {
    const socket = get().socket;
    if (socket) {
      socket.disconnect();
      set({ socket: null, isConnected: false });
    }
  }
}));
