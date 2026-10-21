import { useState, useEffect, useMemo } from 'react';
import { usePipelineStore } from '../store/usePipelineStore';
import { useAuthStore } from '../store/useAuthStore';
import TrackingMap from '../components/dashboard/TrackingMap';
import CallContactButton from '../components/common/CallContactButton';
import { normalizePhone } from '../utils/phoneUtils';
import { 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Truck, 
  ExternalLink, 
  Signal, 
  Navigation, 
  User, 
  Phone, 
  Crosshair, 
  AlertCircle, 
  Maximize, 
  Target, 
  ChevronDown,
  MessageSquare,
  Package,
  Layers,
  Activity,
  ShieldCheck,
  RefreshCw,
  Search,
  KeyRound
} from 'lucide-react';
import { DeliveryHandoverOtpModal } from '../components/donations/DeliveryHandoverOtpModal';
import { getStoredDonations } from '../data/mockDatabase';
import { getBackendUrl } from '../utils/apiConfig';

interface DonationItem {
  id: string;
  food: string;
  qty: string;
  donor: string;
  phone: string;
  email: string;
  receiver: string;
  volunteer?: string;
  volunteerPhone?: string;
  status: string;
  date?: string;
  eta?: string;
  region?: string;
  pickupAddress?: string;
  destinationAddress?: string;
  statusColor?: string;
}

const normalizeDonation = (raw: any): DonationItem => ({
  id: raw.id || 'DC-' + Math.floor(10000 + Math.random() * 90000),
  food: raw.food || raw.foodItems || raw.title || raw.foodName || 'Surplus Organic Produce',
  qty: raw.qty || raw.quantity || raw.weight || '10 kg',
  donor: raw.donor || raw.donorName || 'Food Donor',
  phone: raw.phone || raw.donorPhone || '+91 98222 33445',
  email: raw.email || raw.donorEmail || 'donor@foodcovering.org',
  receiver: raw.receiver || raw.recipient || raw.recipientName || 'Community Shelter Hub',
  volunteer: raw.volunteer || 'Arjun Sharma',
  volunteerPhone: raw.volunteerPhone || '+91 98765 43210',
  status: raw.status || 'In Transit',
  date: raw.date || 'Today',
  eta: raw.eta || '15 mins',
  region: raw.region || 'Delhi NCR',
  pickupAddress: raw.pickupAddress || raw.address || 'Connaught Place Volunteer Station, New Delhi',
  destinationAddress: raw.destinationAddress || 'Community Distribution Hub #4',
  statusColor: raw.statusColor || 'bg-emerald-100 text-emerald-800'
});

export default function Tracking() {
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportSubmitted, setReportSubmitted] = useState(false);
  const [donationsList, setDonationsList] = useState<DonationItem[]>([]);
  const [selectedDonationId, setSelectedDonationId] = useState<string>('');
  const [fleetSearch, setFleetSearch] = useState<string>('');
  const [fleetFilter, setFleetFilter] = useState<'ALL' | 'IN_TRANSIT' | 'PICKED_UP' | 'ASSIGNED'>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [isHandoverOtpOpen, setIsHandoverOtpOpen] = useState(false);

  const { tracking, triggerMapAction, connect } = usePipelineStore();
  const { user } = useAuthStore();

  // Connect live pipeline socket on mount
  useEffect(() => {
    connect();
  }, [connect]);

  // Fetch all active donations for real-time fleet tracking
  const fetchDonations = async () => {
    setIsLoading(true);
    const backendUrl = getBackendUrl();
    if (backendUrl) {
      try {
        const res = await fetch(`${backendUrl}/api/v1/donations`, { signal: AbortSignal.timeout(2500) });
        const data = await res.json();
        if (data.donations && data.donations.length > 0) {
          const normalized = data.donations.map(normalizeDonation);
          setDonationsList(normalized);
          const params = new URLSearchParams(window.location.search);
          const qId = params.get('donationId');
          if (qId && normalized.some((d: DonationItem) => d.id === qId)) {
            setSelectedDonationId(qId);
          } else if (!selectedDonationId) {
            setSelectedDonationId(normalized[0].id);
          }
          setIsLoading(false);
          return;
        }
      } catch (err) {
        // Fall through to offline fallback
      }
    }

    // Offline / Public Fallback: load complete fleet donations from mockDatabase
    const stored = getStoredDonations();
    const normalized = (stored || []).map(normalizeDonation);
    setDonationsList(normalized);
    if (normalized.length > 0 && !selectedDonationId) {
      setSelectedDonationId(normalized[0].id);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchDonations();
  }, []);

  // Current active donation / fleet delivery
  const activeDonation: DonationItem | null = useMemo(() => {
    return donationsList.find(d => d.id === selectedDonationId) || donationsList[0] || null;
  }, [donationsList, selectedDonationId]);

  const donationId = activeDonation?.id || 'DC-00326';
  const donationDisplayId = donationId;

  // Donor attributes
  const donorName = activeDonation?.donor || user?.fullName || 'Food Donor';
  const donorPhone = activeDonation?.phone || user?.phone || tracking?.contacts?.donor || '+91 98222 33445';
  const donorAddress = activeDonation?.pickupAddress || user?.address || 'Connaught Place Volunteer Station, New Delhi';

  // Recipient attributes
  const recipientName = activeDonation?.receiver || 'Green Life Foundation Care Center';
  const recipientPhone = tracking?.contacts?.recipient || '+91 98765 43212';
  const recipientAddress = activeDonation?.destinationAddress || 'Community Distribution Center #4';

  // Volunteer attributes
  const volunteerName = activeDonation?.volunteer || 'Arjun Sharma';
  const volunteerPhone = activeDonation?.volunteerPhone || tracking?.contacts?.volunteer || '+91 98111 22334';

  const currentEta = activeDonation?.eta ? parseInt(activeDonation.eta) || tracking?.eta || 18 : (tracking?.eta || 18);
  const status = activeDonation?.status || tracking?.status || 'In Transit';

  // Dynamic Geolocation based on address / city
  const positions = useMemo(() => {
    if (!activeDonation) {
      return {
        donorPos: [13.0827, 80.2707] as [number, number],
        volunteerPos: [13.0850, 80.2750] as [number, number],
        facilityPos: [13.0900, 80.2800] as [number, number],
        destinationPos: [13.0950, 80.2850] as [number, number]
      };
    }

    const text = `${activeDonation.region || ''} ${activeDonation.pickupAddress || ''} ${activeDonation.destinationAddress || ''} ${activeDonation.receiver || ''}`.toLowerCase();
    
    let baseLat = 13.0827, baseLng = 80.2707; // Chennai default
    if (text.includes('delhi') || text.includes('noida') || text.includes('rohini') || text.includes('connaught') || text.includes('cp') || text.includes('ncr')) {
      baseLat = 28.6139; baseLng = 77.2090; // Delhi
    } else if (text.includes('mumbai') || text.includes('andheri') || text.includes('bandra') || text.includes('midc')) {
      baseLat = 19.0760; baseLng = 72.8777; // Mumbai
    } else if (text.includes('bangalore') || text.includes('bengaluru') || text.includes('indiranagar') || text.includes('koramangala')) {
      baseLat = 12.9716; baseLng = 77.5946; // Bangalore
    } else if (text.includes('kolkata') || text.includes('salt lake')) {
      baseLat = 22.5726; baseLng = 88.3639; // Kolkata
    }

    return {
      donorPos: [baseLat, baseLng] as [number, number],
      volunteerPos: [baseLat + 0.0035, baseLng + 0.0042] as [number, number],
      facilityPos: [baseLat + 0.0075, baseLng + 0.0090] as [number, number],
      destinationPos: [baseLat + 0.0120, baseLng + 0.0145] as [number, number]
    };
  }, [activeDonation]);

  // Make timeline dynamic
  const isReached = status === 'Destination Reached' || status === 'Completed' || status === 'Delivered';
  const isCompleted = status === 'Completed' || status === 'Delivered';

  const timelineSteps = [
    { label: 'Created', subtext: 'Donation request created', status: 'completed', time: '09:12 AM', date: '28 Sep 2026' },
    { label: 'Verified', subtext: 'Food safety verified by AI', status: 'completed', time: '09:18 AM', date: '28 Sep 2026' },
    { label: 'Matched', subtext: `Assigned to ${volunteerName}`, status: 'completed', time: '09:25 AM', date: '28 Sep 2026' },
    { label: 'Pickup Started', subtext: 'Volunteer picked up food', status: 'completed', time: '09:42 AM', date: '28 Sep 2026' },
    { label: 'In Transit', subtext: 'On the way to recipient', status: isReached ? 'completed' : 'active', time: '10:15 AM', date: '28 Sep 2026' },
    { label: 'Destination Reached', subtext: 'Food arrived at recipient hub', status: isCompleted ? 'completed' : (isReached ? 'active' : 'pending'), time: isReached ? '10:35 AM' : '-', date: isReached ? '28 Sep 2026' : '-' },
    { label: 'Completed', subtext: 'Verified delivery handover', status: isCompleted ? 'completed' : 'pending', time: isCompleted ? '10:36 AM' : '-', date: isCompleted ? '28 Sep 2026' : '-' },
  ];

  // Direct WhatsApp opener
  const handleOpenWhatsApp = (name: string, phone: string, roleTitle: string) => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const message = encodeURIComponent(
      `Hello ${name},\n\nThis is FoodCovering Fleet Dispatch regarding Delivery #${donationId} (${activeDonation?.food || 'Surplus Food'}).\n\nStatus: ${status} | ETA: ${currentEta} mins.\n\nBest regards,\nFoodCovering Control Room`
    );
    window.open(`https://api.whatsapp.com/send/?phone=${cleanPhone}&text=${message}`, '_blank');
  };

  // Filtered donations list for the Fleet selector
  const filteredFleet = useMemo(() => {
    return donationsList.filter(d => {
      if (fleetFilter === 'IN_TRANSIT' && d.status !== 'In Transit') return false;
      if (fleetFilter === 'PICKED_UP' && d.status !== 'Picked Up') return false;
      if (fleetFilter === 'ASSIGNED' && d.status !== 'Assigned' && d.status !== 'New') return false;

      if (!fleetSearch) return true;
      const q = fleetSearch.toLowerCase();
      return (
        (d.id || '').toLowerCase().includes(q) ||
        (d.food || '').toLowerCase().includes(q) ||
        (d.donor || '').toLowerCase().includes(q) ||
        (d.volunteer && d.volunteer.toLowerCase().includes(q)) ||
        (d.receiver && d.receiver.toLowerCase().includes(q))
      );
    });
  }, [donationsList, fleetFilter, fleetSearch]);

  return (
    <div className="space-y-4 pb-12 w-full">
      {/* 1. Fleet Top KPI Overview Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl p-3.5 border border-gray-200/90 shadow-2xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Tracked Deliveries</p>
              <h3 className="text-xl font-bold text-gray-900 leading-tight">{donationsList.length || 29}</h3>
              <p className="text-[11px] text-emerald-600 font-medium mt-0.5">Live fleet stream</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-3.5 border border-gray-200/90 shadow-2xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
              <Navigation className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">In Transit Units</p>
              <h3 className="text-xl font-bold text-gray-900 leading-tight">
                {donationsList.filter(d => d.status === 'In Transit').length || 8}
              </h3>
              <p className="text-[11px] text-amber-600 font-medium mt-0.5">En route to recipient</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-3.5 border border-gray-200/90 shadow-2xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              <User className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Active Volunteers</p>
              <h3 className="text-xl font-bold text-gray-900 leading-tight">10 Drivers</h3>
              <p className="text-[11px] text-blue-600 font-medium mt-0.5">GPS synced</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-3.5 border border-gray-200/90 shadow-2xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Active Cargo</p>
              <h3 className="text-xl font-bold text-gray-900 leading-tight">1,420 kg</h3>
              <p className="text-[11px] text-purple-600 font-medium mt-0.5">Perishable surplus</p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Top Live Status Banner with Active Vehicle Selector */}
      <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-6 divide-x divide-gray-100">
          <div className="flex items-center gap-3">
            <div>
              <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded-full inline-block mb-1 border border-emerald-100">
                Active Fleet Delivery
              </p>
              <div className="flex items-center gap-2">
                {donationsList.length > 0 ? (
                  <div className="relative">
                    <select
                      value={selectedDonationId}
                      onChange={(e) => setSelectedDonationId(e.target.value)}
                      className="text-base font-bold text-gray-900 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1 focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer pr-8"
                    >
                      {donationsList.map(d => (
                        <option key={d.id} value={d.id}>
                          {d.id} — {d.donor || 'Donor'} ({(d.food || 'Surplus Produce').slice(0, 22)})
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <h2 className="text-xl font-black text-gray-900 tracking-tight">{donationDisplayId}</h2>
                )}
              </div>
            </div>
            <div className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> LIVE GPS
            </div>
          </div>

          <div className="px-6 flex items-center gap-3">
            <div className="bg-blue-50 p-2 rounded-full"><Clock className="w-4 h-4 text-blue-600" /></div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">ETA</p>
              <p className="text-sm font-bold text-gray-900">{currentEta} min</p>
            </div>
          </div>

          <div className="px-6 flex items-center gap-3">
            <div className="bg-purple-50 p-2 rounded-full"><MapPin className="w-4 h-4 text-purple-600" /></div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Distance</p>
              <p className="text-sm font-bold text-gray-900">4.2 km</p>
            </div>
          </div>

          <div className="px-6 flex items-center gap-3">
            <div className="bg-emerald-50 p-2 rounded-full"><Signal className="w-4 h-4 text-emerald-600" /></div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">GPS Signal</p>
              <p className="text-sm font-bold text-gray-900">100% Active</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6 divide-x divide-gray-100">
          <div className="flex items-center gap-3">
            <div className="bg-gray-50 p-2 rounded-full"><User className="w-4 h-4 text-gray-600" /></div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Driver / Volunteer</p>
              <p className="text-sm font-bold text-gray-900 flex items-center gap-1">{volunteerName}</p>
            </div>
          </div>
          <div className="pl-6 flex items-center gap-3 hidden lg:flex">
             <div className="bg-orange-50 p-2 rounded-full"><Navigation className="w-4 h-4 text-orange-600" /></div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Speed</p>
              <p className="text-sm font-bold text-gray-900">32 km/h</p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Quick Fleet Deliveries Carousel / Selector */}
      <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Fleet In-Transit Deliveries</h3>
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-100">
              {filteredFleet.length} Units
            </span>
          </div>

          {/* Quick Filter buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setFleetFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                fleetFilter === 'ALL' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All ({donationsList.length})
            </button>
            <button
              onClick={() => setFleetFilter('IN_TRANSIT')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                fleetFilter === 'IN_TRANSIT' ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              In Transit
            </button>
            <button
              onClick={() => setFleetFilter('PICKED_UP')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                fleetFilter === 'PICKED_UP' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Picked Up
            </button>
          </div>
        </div>

        {/* Horizontal Scroll of Fleet Cards */}
        <div className="flex gap-2.5 overflow-x-auto pt-2.5 pb-1">
          {filteredFleet.slice(0, 10).map((d) => {
            const isSelected = d.id === donationId;
            return (
              <div
                key={d.id}
                onClick={() => setSelectedDonationId(d.id)}
                className={`min-w-[240px] max-w-[260px] p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-emerald-50/80 border-emerald-400 shadow-xs ring-1 ring-emerald-300'
                    : 'bg-gray-50/60 hover:bg-gray-100/80 border-gray-200'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-blue-700 font-mono text-[11px]">{d.id}</span>
                    <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                      d.status === 'In Transit' ? 'bg-amber-100 text-amber-800' :
                      d.status === 'Picked Up' ? 'bg-blue-100 text-blue-800' :
                      'bg-emerald-100 text-emerald-800'
                    }`}>
                      {d.status}
                    </span>
                  </div>
                  <p className="font-bold text-gray-900 text-xs truncate">{d.food}</p>
                  <p className="text-[11px] text-gray-500 truncate mt-0.5">Driver: {d.volunteer || 'Assigned Driver'}</p>
                </div>
                <div className="flex items-center justify-between pt-1.5 mt-1 border-t border-gray-200/60 text-[10px] text-gray-400">
                  <span className="truncate max-w-[140px]">{d.donor}</span>
                  <span className="font-semibold text-emerald-700">{d.qty}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Main Body: Live GPS Map + Delivery Control Console */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        
        {/* Main Map Area */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-200/90 shadow-2xs overflow-hidden flex flex-col h-[750px]">
          <div className="flex-1 bg-gray-100 relative">
            <TrackingMap 
              donorPos={positions.donorPos}
              volunteerPos={positions.volunteerPos}
              facilityPos={positions.facilityPos}
              destinationPos={positions.destinationPos}
              donorName={donorName}
              volunteerName={volunteerName}
              facilityName={activeDonation?.region ? `${activeDonation.region} Hub` : 'Distribution Facility'}
              destinationName={recipientName}
            />
          </div>
          
          {/* Map Legend & Controls */}
          <div className="bg-white border-t border-gray-100 p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex flex-wrap justify-center items-center gap-3.5 text-xs font-semibold text-gray-600">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-emerald-600 fill-emerald-600 bg-emerald-100 rounded-full p-0.5" /> 
                <span>Donor ({(donorName || 'Donor').split(' ')[0]})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-blue-600 fill-blue-600 bg-blue-100 rounded-full p-0.5" /> 
                <span>Volunteer ({(volunteerName || 'Driver').split(' ')[0]})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-purple-600 fill-purple-600 bg-purple-100 rounded-full p-0.5" /> 
                <span>Distribution Hub</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-red-600 fill-red-600 bg-red-100 rounded-full p-0.5" /> 
                <span>Recipient</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={() => triggerMapAction('recenter')} 
                className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors shadow-2xs"
              >
                <Target className="w-3.5 h-3.5" /> Recenter
              </button>
              <button 
                onClick={() => triggerMapAction('showFullRoute')} 
                className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors shadow-2xs"
              >
                <Maximize className="w-3.5 h-3.5" /> Full Route
              </button>
              <button 
                onClick={() => setIsReportModalOpen(true)} 
                className="flex items-center gap-1.5 px-3 py-1.5 border border-red-200 bg-red-50 text-red-700 rounded-lg text-xs font-semibold hover:bg-red-100 transition-colors shadow-2xs"
              >
                <AlertCircle className="w-3.5 h-3.5" /> Report Issue
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar: Details & Telemetry */}
        <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-5 overflow-y-auto h-[750px] flex flex-col space-y-6 relative scrollbar-hide">
          
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div>
              <h3 className="text-base font-bold text-gray-900">Delivery Telemetry</h3>
              <p className="text-xs text-gray-500 mt-0.5">Live donor pickup & dispatch controls</p>
            </div>
            <span className="bg-emerald-100 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
               <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> {status}
            </span>
          </div>

          {/* Details Section */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Route Waypoints</h4>
            
            <div className="flex gap-3">
              <div className="mt-0.5 flex flex-col items-center">
                <MapPin className="w-4 h-4 text-emerald-600 fill-emerald-100 shrink-0" />
                <div className="w-px h-28 bg-gray-200 my-1"></div>
                <MapPin className="w-4 h-4 text-red-600 fill-red-100 shrink-0" />
              </div>
              <div className="flex-1 space-y-5 text-xs">
                {/* Donor Pickup */}
                <div>
                  <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wide">Pickup Point (Donor)</p>
                  <p className="text-sm font-semibold text-gray-900 mt-0.5">{donorName}</p>
                  <p className="text-xs text-gray-500 mb-1.5">{donorAddress}</p>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenWhatsApp(donorName, donorPhone, 'Donor')}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold transition-colors"
                      title="Open WhatsApp chat with donor"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                      <span>WhatsApp</span>
                    </button>
                    <CallContactButton
                      label="Call Donor"
                      contactName={donorName}
                      phoneNumber={donorPhone}
                      role="Surplus Food Donor"
                      context="donation"
                      referenceId={donationId}
                      variant="compact"
                    />
                  </div>
                </div>

                {/* Recipient Destination */}
                <div>
                  <p className="text-[10px] font-bold text-red-700 uppercase tracking-wide">Delivery Destination (Recipient)</p>
                  <p className="text-sm font-semibold text-gray-900 mt-0.5">{recipientName}</p>
                  <p className="text-xs text-gray-500 mb-1.5">{recipientAddress}</p>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenWhatsApp(recipientName, recipientPhone, 'Recipient')}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold transition-colors"
                      title="Open WhatsApp chat with receiver"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                      <span>WhatsApp</span>
                    </button>
                    <CallContactButton
                      label="Call Receiver"
                      contactName={recipientName}
                      phoneNumber={recipientPhone}
                      role="Charity Recipient"
                      context="donation"
                      referenceId={donationId}
                      variant="compact"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Assigned Volunteer Card */}
          <div className="space-y-2">
            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Assigned Delivery Volunteer</h4>
            <div className="border border-gray-200/90 rounded-xl p-3.5 flex flex-col gap-2.5 bg-gray-50/60">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs ring-2 ring-white">
                    {volunteerName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'VK'}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900">{volunteerName}</p>
                    <p className="text-[11px] font-mono text-gray-500">{volunteerPhone}</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded">
                  On Duty
                </span>
              </div>
              <div className="pt-2 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  onClick={() => handleOpenWhatsApp(volunteerName, volunteerPhone, 'Volunteer')}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                  <span>WhatsApp</span>
                </button>
                <CallContactButton
                  label="Call Volunteer"
                  contactName={volunteerName}
                  phoneNumber={volunteerPhone}
                  role="Delivery Volunteer"
                  context="volunteer"
                  referenceId={donationId}
                  variant="compact"
                />
              </div>
            </div>
          </div>

          {/* Route Progress Bar */}
          <div className="space-y-3">
            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Route Progress</h4>
            <div className="relative">
              <div className="absolute top-2 left-4 right-4 h-1 bg-gray-100 rounded-full z-0"></div>
              <div className={`absolute top-2 left-4 h-1 bg-emerald-500 rounded-full z-0 transition-all duration-1000 ${isCompleted ? 'w-[100%]' : isReached ? 'w-[85%]' : 'w-[60%]'}`}></div>
              
              <div className="flex justify-between relative z-10 text-[9px] font-bold uppercase text-gray-600">
                <div className="flex flex-col items-center">
                  <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center border-2 border-white"><CheckCircle2 className="w-3 h-3" /></div>
                  <span className="mt-1">Pickup</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center border-2 border-white"><CheckCircle2 className="w-3 h-3" /></div>
                  <span className="mt-1">In Transit</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className={`w-5 h-5 rounded-full ${isReached ? 'bg-emerald-500' : 'bg-blue-500 shadow-xs'} text-white flex items-center justify-center border-2 border-white`}><Truck className="w-2.5 h-2.5" /></div>
                  <span className="mt-1">Hub</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className={`w-5 h-5 rounded-full ${isCompleted ? 'bg-emerald-500' : 'bg-gray-200'} text-white flex items-center justify-center border-2 border-white`}>{isCompleted ? <CheckCircle2 className="w-3 h-3" /> : null}</div>
                  <span className="mt-1">Arrived</span>
                </div>
              </div>
            </div>
          </div>

          {/* Delivery Handover OTP Verification Action */}
          <div className="pt-0.5">
            {isCompleted ? (
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between text-xs shadow-2xs">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <div>
                    <p className="font-bold text-emerald-900 leading-tight">Handover Authenticated</p>
                    <p className="text-[10px] text-emerald-700">Delivered to recipient</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsHandoverOtpOpen(true)}
                  className="px-2.5 py-1 bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-[10px] font-bold cursor-pointer"
                >
                  View Receipt
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsHandoverOtpOpen(true)}
                className="w-full py-2.5 px-3 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-xl text-xs font-black transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer transform hover:-translate-y-0.5"
              >
                <KeyRound className="w-3.5 h-3.5 text-amber-300" />
                <span>Verify Handover OTP (Phone / Email)</span>
              </button>
            )}
          </div>

          {/* Timeline */}
          <div className="space-y-3 flex-1">
            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Telemetry Log</h4>
            <div className="relative pl-3 space-y-0 border-l border-gray-200 pb-2">
              {timelineSteps.map((step, index) => {
                const isStepCompleted = step.status === 'completed';
                const isStepActive = step.status === 'active';
                const isStepPending = step.status === 'pending';
                
                return (
                  <div key={index} className="relative pl-5 pb-4 last:pb-0">
                    <div className={`absolute -left-[7px] top-1 w-3 h-3 rounded-full border-2 border-white ${isStepCompleted ? 'bg-emerald-500' : isStepActive ? 'bg-blue-500 ring-2 ring-blue-100' : 'bg-gray-300'}`}></div>
                    <div className="flex justify-between items-start -mt-0.5">
                      <div>
                        <h5 className={`text-xs font-bold ${isStepPending ? 'text-gray-400' : isStepActive ? 'text-blue-600' : 'text-gray-800'}`}>{step.label}</h5>
                        <p className={`text-[10px] font-medium mt-0.5 ${isStepPending ? 'text-gray-300' : 'text-gray-500'}`}>{step.subtext}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-[10px] font-bold ${isStepPending ? 'text-gray-300' : 'text-gray-700'}`}>{step.time}</p>
                        <p className={`text-[9px] font-medium ${isStepPending ? 'text-gray-300' : 'text-gray-400'}`}>{step.date}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>

      {/* Report Issue Modal */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm transition-opacity">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-red-50 px-6 py-5 border-b border-red-100 flex items-start gap-4">
              <div className="bg-white rounded-full p-2 shadow-sm shrink-0">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-red-900">Report Fleet Telemetry Issue</h3>
                <p className="text-xs font-medium text-red-600 mt-0.5">Escalate route deviation or vehicle delay to Control Room</p>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              {!reportSubmitted ? (
                <>
                  <div className="bg-blue-50/50 rounded-xl p-3.5 border border-blue-100/50">
                    <p className="text-xs text-gray-700 leading-relaxed">
                      Submitting a report alerts the FoodCovering Logistics Dispatcher to intercept the GPS feed and contact volunteer <span className="font-bold">({volunteerName})</span>.
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">Issue Category</label>
                      <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs bg-gray-50 focus:bg-white outline-none focus:ring-1 focus:ring-red-500">
                        <option>Volunteer Delay / Route Deviation</option>
                        <option>Food Spoiled / High Temperature Warning</option>
                        <option>Incorrect Destination Address</option>
                        <option>Vehicle Breakdown / Cold Chain Failure</option>
                        <option>Other Operational Issue</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">Additional Details</label>
                      <textarea rows={3} placeholder="Describe the issue..." className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs bg-gray-50 focus:bg-white outline-none focus:ring-1 focus:ring-red-500 resize-none"></textarea>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 pt-2">
                    <button onClick={() => setIsReportModalOpen(false)} className="flex-1 px-4 py-2 bg-white border border-gray-200 text-gray-700 text-xs font-bold rounded-lg hover:bg-gray-50 transition-colors">
                      Cancel
                    </button>
                    <button onClick={() => setReportSubmitted(true)} className="flex-1 px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 transition-colors shadow-sm">
                      Submit Escalation
                    </button>
                  </div>
                </>
              ) : (
                <div className="py-4 text-center space-y-3">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2 shadow-sm">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className="text-base font-bold text-gray-900">Escalation Logged</h4>
                  <p className="text-xs text-gray-500 max-w-[280px] mx-auto">
                    Control room agents have been notified and assigned to Delivery #{donationId}.
                  </p>
                  <button onClick={() => { setIsReportModalOpen(false); setTimeout(() => setReportSubmitted(false), 500); }} className="mt-3 px-4 py-2 bg-gray-900 text-white text-xs font-bold rounded-lg hover:bg-gray-800 transition-colors w-full">
                    Close Window
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Handover OTP Verification Modal */}
      {activeDonation && (
        <DeliveryHandoverOtpModal
          isOpen={isHandoverOtpOpen}
          onClose={() => setIsHandoverOtpOpen(false)}
          donation={{
            id: activeDonation.id,
            foodItems: activeDonation.food,
            quantity: activeDonation.qty,
            receiver: activeDonation.receiver,
            volunteer: activeDonation.volunteer,
            donorPhone: activeDonation.phone,
            donorEmail: activeDonation.email,
            donorName: activeDonation.donor
          }}
          userPhone={activeDonation.phone}
          userEmail={activeDonation.email}
          donorName={activeDonation.donor}
          onSuccess={() => {
            fetchDonations();
          }}
        />
      )}
    </div>
  );
}
