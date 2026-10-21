import { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useAnalysisStore } from '../../store/useAnalysisStore';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Gift, 
  Plus, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  AlertCircle, 
  Calendar, 
  ChevronDown, 
  ChevronUp, 
  Utensils, 
  Package, 
  Phone, 
  FileText, 
  Check, 
  Building2, 
  Apple, 
  Wheat, 
  Sparkles,
  Trash2
} from 'lucide-react';
import CallContactButton from '../../components/common/CallContactButton';
import { normalizePhone } from '../../utils/phoneUtils';
import { getStoredDonations, addStoredDonation, getClientDb, saveClientDb } from '../../data/mockDatabase';
import { getBackendUrl } from '../../utils/apiConfig';
import { MapContainer, TileLayer, Marker, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom map markers matching the reference UI
const pickupIcon = new L.DivIcon({
  className: 'bg-transparent border-0',
  html: `
    <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
      <div style="
        background-color: #10B981; 
        width: 26px; height: 26px; 
        border-radius: 50%; 
        display: flex; align-items: center; justify-content: center; 
        border: 2px solid white; 
        box-shadow: 0 3px 6px rgba(0,0,0,0.25);
        color: white; font-size: 13px;
      ">
        🏠
      </div>
      <div style="background: white; border: 1px solid #E2E8F0; padding: 1px 5px; border-radius: 4px; font-size: 9px; font-weight: bold; color: #1E293B; margin-top: 2px; white-space: nowrap; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        Your Location
      </div>
    </div>
  `,
  iconSize: [80, 44],
  iconAnchor: [40, 13]
});

const destIcon = new L.DivIcon({
  className: 'bg-transparent border-0',
  html: `
    <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
      <div style="
        background-color: #EF4444; 
        width: 26px; height: 26px; 
        border-radius: 50%; 
        display: flex; align-items: center; justify-content: center; 
        border: 2px solid white; 
        box-shadow: 0 3px 6px rgba(0,0,0,0.25);
        color: white; font-size: 13px;
      ">
        🏢
      </div>
      <div style="background: white; border: 1px solid #E2E8F0; padding: 1px 5px; border-radius: 4px; font-size: 9px; font-weight: bold; color: #1E293B; margin-top: 2px; white-space: nowrap; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        NGO Facility
      </div>
    </div>
  `,
  iconSize: [80, 44],
  iconAnchor: [40, 13]
});

const truckIcon = new L.DivIcon({
  className: 'bg-transparent border-0',
  html: `
    <div style="
      background-color: #10B981; 
      width: 22px; height: 22px; 
      border-radius: 6px; 
      display: flex; align-items: center; justify-content: center; 
      border: 1.5px solid white; 
      box-shadow: 0 2px 5px rgba(0,0,0,0.25);
      color: white; font-size: 12px;
    ">
      🚚
    </div>
  `,
  iconSize: [22, 22],
  iconAnchor: [11, 11]
});

interface RouteMapProps {
  pickup: [number, number];
  destination: [number, number];
}

function MiniDeliveryRouteMap({ pickup, destination }: RouteMapProps) {
  const midpoint: [number, number] = [
    (pickup[0] + destination[0]) / 2,
    (pickup[1] + destination[1]) / 2
  ];

  return (
    <div className="h-32 w-full rounded-xl overflow-hidden border border-slate-200/80 shadow-inner relative z-0">
      <MapContainer
        center={midpoint}
        zoom={13}
        scrollWheelZoom={false}
        zoomControl={false}
        attributionControl={false}
        className="h-full w-full"
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Marker position={pickup} icon={pickupIcon} />
        <Marker position={midpoint} icon={truckIcon} />
        <Marker position={destination} icon={destIcon} />
        <Polyline
          positions={[pickup, midpoint, destination]}
          pathOptions={{ color: '#10B981', weight: 3.5, opacity: 0.9, dashArray: '4, 4' }}
        />
      </MapContainer>
    </div>
  );
}

export default function UserDonations() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const scanHistory = useAnalysisStore((state) => state.history);

  const [donations, setDonations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isListExpanded, setIsListExpanded] = useState(true);
  const [expandedDonationId, setExpandedDonationId] = useState<string | null>(null);

  // New Donation Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form Fields - Default to blank for clean manual entry
  const [foodItems, setFoodItems] = useState('');
  const [category, setCategory] = useState('Prepared Meals');
  const [quantity, setQuantity] = useState('');
  const [weight, setWeight] = useState('');
  const [freshness, setFreshness] = useState('Good (Safe to consume)');
  const [pickupTime, setPickupTime] = useState('');
  const [pickupAddress, setPickupAddress] = useState(user?.address || '');
  const [donorPhone, setDonorPhone] = useState(user?.phone || '');
  const [notes, setNotes] = useState('');
  const [isFromAiScan, setIsFromAiScan] = useState(false);

  useEffect(() => {
    if (user?.phone) {
      setDonorPhone(user.phone);
    }
    if (user?.address) {
      setPickupAddress(user.address);
    }
  }, [user]);

  // Latest AI Scan for quick autofill
  const latestScan = scanHistory && scanHistory.length > 0 ? scanHistory[0] : null;

  // Auto-fill from scan helper
  const applyScanData = (scan: any) => {
    if (!scan) return;
    setFoodItems(scan.food || 'AI Inspected Food Surplus');
    if (scan.food?.toLowerCase().includes('apple') || scan.food?.toLowerCase().includes('fruit') || scan.food?.toLowerCase().includes('veg')) {
      setCategory('Fruits & Vegetables');
    } else if (scan.food?.toLowerCase().includes('bread') || scan.food?.toLowerCase().includes('cake') || scan.food?.toLowerCase().includes('bakery')) {
      setCategory('Bakery');
    } else {
      setCategory('Prepared Meals');
    }
    const freshLevel = scan.freshness?.toLowerCase().includes('fresh') || scan.risk?.toLowerCase() === 'low'
      ? 'Good (Within 6 hrs)'
      : 'Consume within 12 hrs';
    setFreshness(freshLevel);
    setNotes(`AI Freshness Certified: ${scan.freshness || 'Verified'} | Risk: ${scan.risk || 'Low'} | Shelf-life: ${scan.shelfLife || '1-2 days'}`);
    setIsFromAiScan(true);
    setMessage({
      type: 'success',
      text: `Auto-filled details from AI Freshness Scanner (${scan.food})!`
    });
  };

  // Check if routed with prefilled scan or new donation request
  useEffect(() => {
    if (location.state?.prefillScan) {
      applyScanData(location.state.prefillScan);
      setModalOpen(true);
    } else if (location.search.includes('new=true') || location.state?.openModal) {
      setIsFromAiScan(false);
      setModalOpen(true);
    }
  }, [location.state, location.search]);

  const fetchDonations = async () => {
    const backendUrl = getBackendUrl();
    if (backendUrl) {
      try {
        const res = await fetch(`${backendUrl}/api/user/donations`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: AbortSignal.timeout(2500)
        });
        if (res.ok) {
          const data = await res.json();
          const records = data.donations || [];
          setDonations(records);
          if (records.length > 0 && !expandedDonationId) {
            setExpandedDonationId(records[0].id);
          }
          setLoading(false);
          return;
        }
      } catch (err) {
        // Fall through to offline fallback
      }
    }

    // Offline / Public Fallback: load donations from mockDatabase
    const stored = getStoredDonations();
    setDonations(stored as any);
    if (stored.length > 0 && !expandedDonationId) {
      setExpandedDonationId(stored[0].id);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDonations();
  }, [token]);

  // Cancel / Delete a donation
  const handleDeleteDonation = async (donationId: string) => {
    if (!window.confirm('Are you sure you want to cancel and remove this donation request?')) {
      return;
    }
    try {
      const backendUrl = getBackendUrl();
      if (backendUrl) {
        const res = await fetch(`${backendUrl}/api/user/donations/${donationId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
          signal: AbortSignal.timeout(2000)
        });
        if (res.ok) {
          setMessage({ type: 'success', text: 'Donation has been cancelled and removed.' });
          await fetchDonations();
          if (expandedDonationId === donationId) {
            setExpandedDonationId(null);
          }
          return;
        }
      }
    } catch {}

    // Offline fallback: delete from mockDatabase
    const db = getClientDb();
    db.donations = (db.donations || []).filter((d: any) => d.id !== donationId);
    saveClientDb(db);
    setMessage({ type: 'success', text: 'Donation has been cancelled and removed.' });
    await fetchDonations();
    if (expandedDonationId === donationId) {
      setExpandedDonationId(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    const donationData = {
      donorType: 'INDIVIDUAL',
      donorUserId: user?.id || 'usr-normal-praveen',
      donorName: user?.fullName || 'Praveen Kumar',
      donorPhone: donorPhone || user?.phone || '+91 82488 32986',
      donorEmail: user?.email || 'praveen@foodcovering.org',
      title: foodItems,
      foodItems,
      category,
      quantity,
      weight: weight || quantity,
      freshness,
      pickupTime: pickupTime || undefined,
      pickupAddress: pickupAddress || user?.address || 'City Center, New Delhi',
      notes,
      verificationType: isFromAiScan ? 'AI_CERTIFIED' : 'MANUAL',
      latitude: 28.6139,
      longitude: 77.2090,
      status: 'In Transit',
      statusBadgeText: 'En Route',
      volunteer: 'Vikram Sethi',
      volunteerPhone: '+91 98401 22334',
      volunteerVehicle: 'Zero-Emission Cargo Scooter (TN-09-CQ-2024)'
    };

    try {
      const backendUrl = getBackendUrl();
      if (backendUrl) {
        const res = await fetch(`${backendUrl}/api/user/donations`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(donationData),
          signal: AbortSignal.timeout(2000)
        });

        if (res.ok) {
          const data = await res.json();
          setMessage({ type: 'success', text: 'Surplus donation request registered! Volunteer assigned for pickup.' });
          setModalOpen(false);
          setFoodItems('');
          setQuantity('');
          setWeight('');
          setNotes('');
          setPickupTime('');
          setIsFromAiScan(false);
          await fetchDonations();
          if (data.donation?.id) {
            setExpandedDonationId(data.donation.id);
          }
          return;
        }
      }

      // Offline fallback: save into mockDatabase
      const created = addStoredDonation(donationData);
      setDonations(prev => [created as any, ...prev]);
      setExpandedDonationId(created.id);
      setMessage({ type: 'success', text: 'Surplus donation request registered! Volunteer assigned for pickup.' });
      setModalOpen(false);
      setFoodItems('');
      setQuantity('');
      setWeight('');
      setNotes('');
      setPickupTime('');
      setIsFromAiScan(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // Get Category Icon
  const getCategoryIcon = (cat: string, title?: string) => {
    const text = `${cat} ${title}`.toLowerCase();
    if (text.includes('fruit') || text.includes('vegetable') || text.includes('apple')) {
      return (
        <div className="w-12 h-12 rounded-xl bg-red-50/80 border border-red-100 flex items-center justify-center text-red-500 shrink-0">
          <Apple className="w-6 h-6" />
        </div>
      );
    }
    if (text.includes('bread') || text.includes('bakery') || text.includes('wheat') || text.includes('grain')) {
      return (
        <div className="w-12 h-12 rounded-xl bg-amber-50/80 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
          <Wheat className="w-6 h-6" />
        </div>
      );
    }
    if (text.includes('meal') || text.includes('cook') || text.includes('rice') || text.includes('curry')) {
      return (
        <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
          <Gift className="w-6 h-6" />
        </div>
      );
    }
    return (
      <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
        <Package className="w-6 h-6" />
      </div>
    );
  };

  // Status Badge Formatting
  const getStatusBadge = (status: string, statusBadgeText?: string) => {
    const text = statusBadgeText || status;
    const s = (status || '').toLowerCase();
    const st = (statusBadgeText || '').toLowerCase();

    if (s.includes('deliver') || st.includes('deliver')) {
      return {
        badgeClass: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
        pillClass: 'bg-emerald-50 text-emerald-700 border border-emerald-200/60',
        dotClass: 'bg-emerald-500',
        icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
        label: text || 'Delivered',
        subLabel: 'Received by NGO'
      };
    }
    if (s.includes('schedul') || st.includes('schedul') || s.includes('assign') || st.includes('assign')) {
      return {
        badgeClass: 'bg-purple-50 text-purple-700 border border-purple-200',
        pillClass: 'bg-purple-50 text-purple-700 border border-purple-200/60',
        dotClass: 'bg-purple-500',
        icon: <Clock className="w-4 h-4 text-purple-600" />,
        label: text || 'Pickup Scheduled',
        subLabel: 'Volunteer Assigned'
      };
    }
    if (s.includes('transit') || st.includes('transit') || s.includes('progress') || s.includes('picked')) {
      return {
        badgeClass: 'bg-blue-50 text-blue-700 border border-blue-200',
        pillClass: 'bg-blue-50 text-blue-700 border border-blue-200/60',
        dotClass: 'bg-blue-500',
        icon: <Clock className="w-4 h-4 text-blue-600" />,
        label: text || 'In Progress',
        subLabel: 'En Route to NGO'
      };
    }
    if (s.includes('reject') || s.includes('cancel')) {
      return {
        badgeClass: 'bg-red-50 text-red-700 border border-red-200',
        pillClass: 'bg-red-50 text-red-700 border border-red-200/60',
        dotClass: 'bg-red-500',
        icon: <AlertCircle className="w-4 h-4 text-red-600" />,
        label: text || 'Rejected',
        subLabel: 'Cancelled'
      };
    }
    return {
      badgeClass: 'bg-amber-50 text-amber-700 border border-amber-200',
      pillClass: 'bg-amber-50 text-amber-700 border border-amber-200/60',
      dotClass: 'bg-amber-500',
      icon: <Clock className="w-4 h-4 text-amber-600" />,
      label: text || 'Pending Verification',
      subLabel: 'Awaiting NGO Verification'
    };
  };

  // Find the currently expanded donation
  const activeDonation = donations.find((d) => d.id === expandedDonationId) || donations[0];
  const compactDonations = donations.filter((d) => d.id !== activeDonation?.id);

  return (
    <div className="space-y-6">
      {/* 1. TOP SECTION - Matches Reference Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <span className="text-2xl">🎁</span>
            <span>My Food Donations</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Submit surplus food for community pick-up and track delivery to verified NGOs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {latestScan && (
            <button
              onClick={() => {
                applyScanData(latestScan);
                setModalOpen(true);
              }}
              className="px-3.5 py-2.5 bg-emerald-50 hover:bg-emerald-100/80 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
              title="Pre-fill from latest AI scan"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Use AI Scan: {latestScan.food}</span>
            </button>
          )}

          <button
            onClick={() => setModalOpen(true)}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-xs cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>New Surplus Donation</span>
          </button>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-xl border text-xs font-medium flex items-center justify-between gap-2 animate-in fade-in ${
          message.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex items-center gap-2">
            {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-slate-400 hover:text-slate-600 text-xs">✕</button>
        </div>
      )}

      {/* 2. DONATION HISTORY & STATUS CONTAINER */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        {/* Header with Title and Chevron */}
        <div 
          onClick={() => setIsListExpanded(!isListExpanded)}
          className="p-5 border-b border-slate-100 flex items-center justify-between cursor-pointer select-none hover:bg-slate-50/50 transition-colors"
        >
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            Donation History & Status
          </h2>
          <button 
            type="button" 
            className="text-slate-400 hover:text-slate-600 transition-colors p-1"
            aria-label="Toggle history visibility"
          >
            {isListExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>

        {isListExpanded && (
          <div className="p-5 space-y-4">
            {loading ? (
              // Loading Skeleton
              <div className="space-y-4 py-4 animate-pulse">
                <div className="h-28 bg-slate-100 rounded-2xl w-full"></div>
                <div className="h-20 bg-slate-50 rounded-2xl w-full"></div>
                <div className="h-20 bg-slate-50 rounded-2xl w-full"></div>
              </div>
            ) : donations.length === 0 ? (
              // Empty State
              <div className="py-14 text-center px-4">
                <div className="w-14 h-14 bg-emerald-50 rounded-2xl border border-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                  <Gift className="w-7 h-7" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">No donations yet.</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-5">
                  Your surplus food donations and their delivery progress will appear here.
                </p>
                <button
                  onClick={() => setModalOpen(true)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create First Donation</span>
                </button>
              </div>
            ) : (
              <>
                {/* 3. EXPANDED DONATION CARD */}
                {activeDonation && (
                  <div className="border border-slate-200/90 rounded-2xl p-5 bg-white shadow-2xs transition-all">
                    {/* Top Row: Info + Status */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
                      <div className="flex items-start gap-3.5">
                        {getCategoryIcon(activeDonation.category, activeDonation.title || activeDonation.foodItems)}
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm sm:text-base font-bold text-slate-900">
                              {activeDonation.title || activeDonation.foodItems}
                            </span>
                            <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-medium ${getStatusBadge(activeDonation.status, activeDonation.statusBadgeText).pillClass}`}>
                              {activeDonation.statusBadgeText || activeDonation.status}
                            </span>
                          </div>

                          <p className="text-xs text-slate-500 mt-1">
                            Category: <span className="text-slate-700">{activeDonation.category}</span> • Quantity: <span className="font-semibold text-slate-700">{activeDonation.quantity}</span>
                          </p>

                          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 mt-1.5">
                            <span className="flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>{activeDonation.location || activeDonation.pickupAddress || 'Barasat, New Delhi'}</span>
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>{activeDonation.pickupTime || activeDonation.date || 'Today'}</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right Status Badge in Reference style */}
                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100 shrink-0">
                        <div className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 ${getStatusBadge(activeDonation.status, activeDonation.statusBadgeText).badgeClass}`}>
                          {getStatusBadge(activeDonation.status, activeDonation.statusBadgeText).icon}
                          <span>{getStatusBadge(activeDonation.status, activeDonation.statusBadgeText).label}</span>
                        </div>
                        <span className="text-[11px] text-slate-400 mt-1 font-medium">
                          {getStatusBadge(activeDonation.status, activeDonation.statusBadgeText).subLabel}
                        </span>
                      </div>
                    </div>

                    {/* Three Horizontal Columns for Desktop */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
                      {/* 4. PACKAGE DETAILS */}
                      <div className="bg-[#F8FAF9] border border-slate-100/90 rounded-2xl p-4 flex flex-col justify-between">
                        <div>
                          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
                            Package Details
                          </h3>
                          
                          <div className="space-y-2.5 text-xs">
                            <div className="flex items-start justify-between gap-2">
                              <span className="text-slate-500 flex items-center gap-2">
                                <Utensils className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span>Food Type</span>
                              </span>
                              <span className="font-semibold text-slate-800 text-right">
                                {activeDonation.title || activeDonation.foodItems || 'Not provided'}
                              </span>
                            </div>

                            <div className="flex items-start justify-between gap-2">
                              <span className="text-slate-500 flex items-center gap-2">
                                <Package className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span>Quantity</span>
                              </span>
                              <span className="font-semibold text-slate-800 text-right">
                                {activeDonation.quantity || 'Not provided'}
                              </span>
                            </div>

                            <div className="flex items-start justify-between gap-2">
                              <span className="text-slate-500 flex items-center gap-2">
                                <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span>Freshness</span>
                              </span>
                              <span className="font-semibold text-emerald-700 text-right flex items-center gap-1 justify-end">
                                {activeDonation.freshness || 'Good (Within 6 hrs)'}
                              </span>
                            </div>

                            <div className="flex items-start justify-between gap-2">
                              <span className="text-slate-500 flex items-center gap-2">
                                <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span>Pickup Time</span>
                              </span>
                              <span className="font-semibold text-slate-800 text-right">
                                {activeDonation.pickupTime || activeDonation.date || 'Not provided'}
                              </span>
                            </div>

                            <div className="flex flex-col gap-1.5 py-1 border-y border-slate-100">
                              <div className="flex items-start justify-between gap-2">
                                <span className="text-slate-500 flex items-center gap-2">
                                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                  <span>Donor Contact</span>
                                </span>
                                <span className="font-semibold text-slate-800 text-right font-mono">
                                  {normalizePhone(activeDonation.donorPhone || user?.phone).formattedDisplay}
                                </span>
                              </div>
                              <div className="flex justify-end pt-1">
                                <CallContactButton
                                  label="Call Donor"
                                  contactName={activeDonation?.donorName || user?.fullName || 'praveen'}
                                  phoneNumber={activeDonation?.donorPhone || user?.phone || '+91 82488 32986'}
                                  role="Donor"
                                  context="donation"
                                  donationId={activeDonation?.id || 'DC-U971'}
                                  referenceId={activeDonation?.id || 'DC-U971'}
                                  variant="compact"
                                />
                              </div>
                            </div>

                            <div className="flex items-start justify-between gap-2">
                              <span className="text-slate-500 flex items-center gap-2">
                                <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span>Special Notes</span>
                              </span>
                              <span className="font-semibold text-slate-800 text-right">
                                {activeDonation.notes || 'Hygienically prepared and safely packed.'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Verification Stamp & Action */}
                        <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
                          {activeDonation.verificationType === 'AI_CERTIFIED' || activeDonation.notes?.includes('AI Freshness Certified') ? (
                            <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                              AI Freshness Verified
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-blue-700 font-semibold">
                              <Package className="w-3.5 h-3.5 text-blue-600" />
                              Manual Donor Submission
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteDonation(activeDonation.id)}
                            className="text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Cancel & Remove</span>
                          </button>
                        </div>
                      </div>

                      {/* 5. DELIVERY & TRACKING TIMELINE */}
                      <div className="bg-[#F8FAF9] border border-slate-100/90 rounded-2xl p-4 flex flex-col justify-between">
                        <div>
                          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
                            Delivery & Tracking
                          </h3>

                          {/* Vertical Stepped Timeline */}
                          <div className="relative pl-5 space-y-4">
                            {/* Vertical Line */}
                            <div className="absolute left-[9px] top-2 bottom-2 w-0.5 bg-emerald-500"></div>

                            {(activeDonation.timeline || [
                              { title: 'Donation Submitted', timestamp: activeDonation.date || '28 Sep 2026, 10:24 AM', completed: true },
                              { title: 'Verified by NGO', timestamp: '28 Sep 2026, 01:12 PM', completed: true },
                              { title: 'Picked Up', timestamp: '28 Sep 2026, 03:45 PM', completed: true },
                              { title: 'Delivered to Facility', timestamp: '28 Sep 2026, 06:20 PM', completed: true }
                            ]).map((step: any, idx: number) => {
                              const isCompleted = step.completed !== false;
                              return (
                                <div key={idx} className="relative flex items-start gap-3">
                                  {/* Step Circle Indicator */}
                                  <div className={`absolute -left-5 top-0.5 w-4.5 h-4.5 rounded-full flex items-center justify-center text-[10px] ${
                                    isCompleted 
                                      ? 'bg-emerald-500 text-white shadow-xs' 
                                      : 'bg-white border-2 border-slate-300 text-transparent'
                                  }`}>
                                    {isCompleted ? <Check className="w-3 h-3 stroke-[3]" /> : '•'}
                                  </div>

                                  <div className="ml-1">
                                    <p className={`text-xs font-bold ${isCompleted ? 'text-slate-900' : 'text-slate-400'}`}>
                                      {step.title}
                                    </p>
                                    {step.timestamp && (
                                      <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
                                        {step.timestamp}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Success Box when Delivered */}
                        {(activeDonation.status === 'Delivered' || activeDonation.statusBadgeText === 'Delivered') && (
                          <div className="mt-4 bg-emerald-50/90 border border-emerald-200/80 text-emerald-800 text-[11px] p-2.5 rounded-xl flex items-center gap-2 font-medium">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>Your donation has been successfully delivered. Thank you for helping!</span>
                          </div>
                        )}
                      </div>

                      {/* 6. NGO DETAILS & 7. DELIVERY ROUTE */}
                      <div className="bg-[#F8FAF9] border border-slate-100/90 rounded-2xl p-4 flex flex-col justify-between">
                        <div>
                          {/* NGO Details */}
                          <div className="mb-4">
                            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                              <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>NGO Details</span>
                            </h3>

                            {activeDonation.ngo?.name && activeDonation.ngo.name !== 'Waiting for NGO assignment' ? (
                              <div className="flex items-start gap-3 bg-white p-3 rounded-xl border border-slate-100 shadow-2xs">
                                <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                                  <Building2 className="w-4.5 h-4.5" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-slate-900 truncate">
                                    {activeDonation.ngo.name}
                                  </p>
                                  <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                                    {activeDonation.ngo.type || 'Community Kitchen & Food Support'}
                                  </p>
                                  <p className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1 mt-1">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                    <span>Verified NGO</span>
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <div className="bg-white p-3 rounded-xl border border-slate-100 text-xs text-slate-500">
                                Waiting for NGO assignment
                              </div>
                            )}
                          </div>

                          {/* Delivery Route */}
                          <div>
                            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                              Delivery Route
                            </h3>

                            {activeDonation.latitude && activeDonation.destinationLatitude ? (
                              <MiniDeliveryRouteMap
                                pickup={[activeDonation.latitude, activeDonation.longitude]}
                                destination={[activeDonation.destinationLatitude, activeDonation.destinationLongitude]}
                              />
                            ) : (
                              <div className="h-28 bg-white border border-slate-200/80 rounded-xl flex items-center justify-center p-3 text-center text-xs text-slate-400">
                                Route information will appear after pickup and destination locations are confirmed.
                              </div>
                            )}
                          </div>
                        </div>

                        {/* View Full Route Navigation */}
                        <button
                          onClick={() => navigate('/user/tracking')}
                          className="mt-3 w-full py-2 px-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/80 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer group shadow-2xs"
                        >
                          <span className="flex items-center gap-1.5 text-slate-600">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            <span>View Full Route</span>
                          </span>
                          <span className="text-slate-400 group-hover:translate-x-0.5 transition-transform">→</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 8. COMPACT CARDS FOR OTHER DONATIONS */}
                {compactDonations.length > 0 && (
                  <div className="space-y-3 pt-1">
                    {compactDonations.map((d) => {
                      const badge = getStatusBadge(d.status, d.statusBadgeText);
                      return (
                        <div
                          key={d.id}
                          onClick={() => setExpandedDonationId(d.id)}
                          className="border border-slate-200/80 rounded-2xl p-4 bg-white hover:bg-slate-50/70 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs group"
                        >
                          <div className="flex items-start gap-3.5">
                            {getCategoryIcon(d.category, d.title || d.foodItems)}
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                                  {d.title || d.foodItems}
                                </span>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${badge.pillClass}`}>
                                  {d.statusBadgeText || d.status}
                                </span>
                              </div>

                              <p className="text-xs text-slate-500 mt-0.5">
                                Category: {d.category} • Quantity: <span className="font-semibold text-slate-700">{d.quantity}</span>
                              </p>

                              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1">
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3 text-slate-400" />
                                  <span>{d.location || d.pickupAddress || 'New Delhi'}</span>
                                </span>
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3 text-slate-400" />
                                  <span>{d.pickupTime || d.date || 'Today'}</span>
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${badge.badgeClass}`}>
                              {badge.icon}
                              <span>{badge.label}</span>
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteDonation(d.id);
                              }}
                              title="Cancel & Delete Donation"
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* 9. CREATE SURPLUS FOOD DONATION MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Gift className="w-5 h-5 text-emerald-600" />
                <span>Create Surplus Food Donation</span>
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* AI Freshness Scanner Integration Banner */}
            {latestScan && (
              <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-emerald-900">
                  <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-bold">AI Freshness Scanner Ready: </span>
                    <span>{latestScan.food} ({latestScan.freshness || 'Safe'})</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => applyScanData(latestScan)}
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold shrink-0 transition-colors cursor-pointer"
                >
                  Auto-fill Form
                </button>
              </div>
            )}

            <p className="text-xs text-slate-500 mt-2 mb-4">
              Enter surplus food details. The system matches nearby verified NGOs and automatically dispatches volunteer pickup.
            </p>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Donation Title / Food Items *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Home-cooked Rice & Lentils Meal Boxes"
                  value={foodItems}
                  onChange={(e) => setFoodItems(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white"
                  >
                    <option value="Prepared Meals">Prepared Meals</option>
                    <option value="Fruits & Vegetables">Fruits & Vegetables</option>
                    <option value="Bakery">Bakery</option>
                    <option value="Dairy Products">Dairy Products</option>
                    <option value="Grains & Cereals">Grains & Cereals</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Quantity / Portions *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 15 meals (8 kg)"
                    value={quantity}
                    onChange={(e) => {
                      setQuantity(e.target.value);
                      setWeight(e.target.value);
                    }}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Freshness Quality</label>
                  <input
                    type="text"
                    placeholder="e.g. Good (Within 6 hrs)"
                    value={freshness}
                    onChange={(e) => setFreshness(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Pickup Date & Time</label>
                  <input
                    type="text"
                    placeholder="e.g. 28 Sep 2026, 10:24 AM"
                    value={pickupTime}
                    onChange={(e) => setPickupTime(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Pickup Location / Address *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sector 34, Barasat, New Delhi"
                  value={pickupAddress}
                  onChange={(e) => setPickupAddress(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Donor Contact Phone</label>
                <input
                  type="text"
                  placeholder="+91 98765 43210"
                  value={donorPhone}
                  onChange={(e) => setDonorPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Special Notes / Packaging Details</label>
                <textarea
                  rows={2}
                  placeholder="e.g. No onions, mild spice; hygienically packed in food containers"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => navigate('/user/ai-scan')}
                  className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Scan Food with AI Scanner</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl disabled:opacity-60 cursor-pointer shadow-xs"
                  >
                    {submitting ? 'Submitting...' : 'Register Donation'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
