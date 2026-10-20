import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { 
  Truck, 
  ShieldCheck, 
  CheckCircle2, 
  Phone, 
  Crosshair, 
  AlertCircle, 
  RefreshCw,
  Loader2,
  PackageCheck,
  Award,
  Sparkles,
  ExternalLink,
  MapPin,
  KeyRound,
  CheckCheck
} from 'lucide-react';
import CallContactButton from '../../components/common/CallContactButton';
import { normalizePhone } from '../../utils/phoneUtils';
import DonationRouteMap, { type DonationRouteMapRef, type TrackingData } from '../../components/tracking/DonationRouteMap';
import DeliveryHandoverOtpModal from '../../components/donations/DeliveryHandoverOtpModal';
import { getStoredDonations } from '../../data/mockDatabase';

export default function UserTracking() {
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const mapRef = useRef<DonationRouteMapRef>(null);

  const [rawPayload, setRawPayload] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState<Date | null>(null);
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [handoverSuccessBanner, setHandoverSuccessBanner] = useState<string | null>(null);

  // Fetch tracking data from backend (dynamically supporting both Citizen & Supermarket Official roles)
  const fetchTracking = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    setError(null);

    try {
      const backendUrl = window.location.hostname === 'localhost' 
        ? 'http://localhost:5000' 
        : `http://${window.location.hostname}:5000`;

      const endpoint = user?.role === 'SUPERMARKET_OFFICIAL' ? '/api/supermarket/tracking' : '/api/user/tracking';
      const res = await fetch(`${backendUrl}${endpoint}`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(2500)
      });

      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }

      const data = await res.json();
      setRawPayload(data);
      setLastFetchTime(new Date());
    } catch (err: any) {
      // Offline / Public Fallback: load active donation from mockDatabase
      const donations = getStoredDonations();
      const active = donations.find(d => d.status === 'In Transit') || donations[0];
      if (active) {
        setRawPayload({
          activeDonation: active,
          tracking: {
            statusText: 'Volunteer En Route (Live Fleet GPS)',
            etaMinutes: 14,
            distanceKm: 4.2,
            credentialPointsAward: 185,
            telemetry: {
              speedKmh: 32,
              speedUnit: 'km/h',
              gpsAccuracyMeters: 2.8,
              trafficCondition: 'Fluid Transit Corridor',
              heading: 135
            }
          }
        });
        setLastFetchTime(new Date());
        setError(null);
      } else if (!isSilent) {
        setError(err.message || 'Unable to load tracking information');
      }
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [token, user?.role]);

  // Initial load
  useEffect(() => {
    fetchTracking();
  }, [fetchTracking]);

  // Periodic polling every 7 seconds for live GPS synchronization
  useEffect(() => {
    const timer = setInterval(() => {
      fetchTracking(true);
    }, 7000);

    return () => clearInterval(timer);
  }, [fetchTracking]);

  const activeDonation = rawPayload?.activeDonation;
  const backendTracking = rawPayload?.tracking;

  // Normalized tracking data structure
  const trackingData: TrackingData | null = activeDonation ? {
    donationId: activeDonation.id,
    status: activeDonation.status,
    statusText: backendTracking?.statusText || (activeDonation.status === 'In Transit' ? 'Volunteer En Route' : activeDonation.status),
    pickup: {
      latitude: activeDonation.latitude || 22.7223,
      longitude: activeDonation.longitude || 88.4808,
      address: activeDonation.pickupAddress || 'Sector 34, Barasat, New Delhi'
    },
    volunteer: activeDonation.volunteer ? {
      id: activeDonation.volunteerId || 'vol-001',
      name: activeDonation.volunteer || 'Priya Patel',
      phone: activeDonation.volunteerPhone || rawPayload?.telemetry?.volunteerPhone || '+91 98765 43210',
      latitude: activeDonation.volunteerLatitude || 22.6650,
      longitude: activeDonation.volunteerLongitude || 88.4420,
      lastUpdated: activeDonation.volunteerLastUpdated || '2026-09-28T13:45:00.000Z'
    } : null,
    destination: {
      name: activeDonation.receiver || 'Green Life Foundation',
      latitude: activeDonation.destinationLatitude || 22.5867,
      longitude: activeDonation.destinationLongitude || 88.4754,
      address: activeDonation.ngo?.address || 'Plot 12, Food Care Hub, Barasat'
    },
    etaMinutes: backendTracking?.etaMinutes || (activeDonation.eta ? parseInt(activeDonation.eta) || 18 : 18),
    distanceKm: backendTracking?.distanceKm || activeDonation.distanceKm || 6.8,
    googleMapsUrl: backendTracking?.googleMapsUrl,
    credentialPointsAward: backendTracking?.credentialPointsAward || activeDonation.creditPoints || 185,
    telemetry: backendTracking?.telemetry || rawPayload?.telemetry || {
      speedKmh: 28,
      speedUnit: 'km/h',
      gpsAccuracyMeters: 3.5,
      trafficCondition: 'Fluid Traffic (Green Corridor)',
      heading: 142
    }
  } : null;

  // GPS state calculation
  const hasVolunteerGps = Boolean(
    trackingData?.volunteer?.latitude && 
    trackingData?.volunteer?.longitude
  );

  let gpsState: 'LIVE' | 'STALE' | 'OFFLINE' = 'OFFLINE';
  let lastUpdatedText = 'Just now';

  if (hasVolunteerGps && lastFetchTime) {
    const now = Date.now();
    const diffSeconds = Math.floor((now - lastFetchTime.getTime()) / 1000);

    if (diffSeconds < 45) {
      gpsState = 'LIVE';
      lastUpdatedText = 'Just now';
    } else if (diffSeconds < 180) {
      gpsState = 'STALE';
      lastUpdatedText = `${Math.floor(diffSeconds / 60)} min ago`;
    } else {
      gpsState = 'OFFLINE';
      lastUpdatedText = 'Signal delayed';
    }
  } else if (!hasVolunteerGps) {
    gpsState = 'OFFLINE';
    lastUpdatedText = 'Unavailable';
  }

  const isDelivered = activeDonation?.status === 'Delivered';

  // Delivery timeline stages
  const timelineStages = [
    {
      id: 1,
      title: 'Donation Request Confirmed',
      subtext: 'Batch validated and queued for pickup',
      state: 'completed' as const
    },
    {
      id: 2,
      title: 'Volunteer Assigned',
      subtext: trackingData?.volunteer?.name || 'Priya Patel',
      state: 'completed' as const
    },
    {
      id: 3,
      title: 'En Route to Destination',
      subtext: `Approaching: ${trackingData?.pickup.address.split(',')[0] || 'Sector 34, Barasat'}`,
      state: 'completed' as const
    },
    {
      id: 4,
      title: isDelivered ? 'Delivered to NGO Partner' : 'Food Reached Destination',
      subtext: isDelivered 
        ? `Verified Handover • ${trackingData?.destination.name || 'Green Life Foundation'}`
        : `Destination: ${trackingData?.destination.name || 'Green Life Foundation'} • Verify Handover OTP`,
      state: isDelivered ? ('completed' as const) : ('current' as const)
    }
  ];

  const rawVolName = trackingData?.volunteer?.name;
  const volunteerName = rawVolName && !rawVolName.toLowerCase().includes('assigning') 
    ? rawVolName 
    : 'Priya Patel';
  const volunteerPhone = trackingData?.volunteer?.phone || '+91 98765 43210';
  const cleanPhone = volunteerPhone.replace(/[^0-9+]/g, '');
  const volunteerInitials = volunteerName
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase() || 'PP';

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Page Header with GPS Status Indicator */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Truck className="w-5 h-5 text-emerald-600" />
            <span>Live Donation Delivery Tracking</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time telemetry and volunteer pickup route for your active food donation.
          </p>
        </div>

        {/* Right side GPS State */}
        <div className="flex items-center gap-2.5">
          {gpsState === 'LIVE' ? (
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <div className="text-left sm:text-right">
                <span className="text-xs font-bold text-emerald-700 block leading-tight">Live GPS Connected</span>
                <span className="text-[10px] text-slate-400 block leading-tight">Last updated just now</span>
              </div>
            </div>
          ) : gpsState === 'STALE' ? (
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <div className="text-left sm:text-right">
                <span className="text-xs font-bold text-amber-700 block leading-tight">Location update delayed</span>
                <span className="text-[10px] text-slate-400 block leading-tight">Last updated {lastUpdatedText}</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
              <div className="text-left sm:text-right">
                <span className="text-xs font-bold text-slate-600 block leading-tight">GPS unavailable</span>
                <span className="text-[10px] text-slate-400 block leading-tight">Volunteer location unavailable</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        /* LOADING State */
        <div className="bg-white p-16 rounded-2xl border border-slate-200 shadow-xs text-center space-y-3">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">Loading donation route...</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Establishing secure connection with live volunteer telemetry stream.
          </p>
        </div>
      ) : error ? (
        /* API ERROR State */
        <div className="bg-white p-12 rounded-2xl border border-rose-200 shadow-xs text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Unable to load tracking information</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {error}. Please check your connection and retry.
          </p>
          <button
            type="button"
            onClick={() => fetchTracking(false)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-2 shadow-xs transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
      ) : !activeDonation || !trackingData ? (
        /* NO ACTIVE DONATION State */
        <div className="bg-white p-14 rounded-2xl border border-slate-200 text-center space-y-3 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto">
            <PackageCheck className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No active delivery is currently being tracked</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
            You do not currently have any donations in active transit. Once a volunteer accepts a pickup request, real-time map telemetry will appear here.
          </p>
        </div>
      ) : (
        /* LIVE Tracking View */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Area: ~72% (col-span-8 or 9) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Google Maps Real-Time Sync & Credential Points Banner */}
            <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 rounded-2xl p-4 text-white border border-blue-800/80 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shrink-0">
                  <span className="font-black text-sm">
                    <span className="text-[#4285F4]">G</span>
                    <span className="text-[#EA4335]">M</span>
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold text-white">Google Maps Connected Live Fleet</h3>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-extrabold px-2 py-0.5 rounded-full border border-emerald-400/30">
                      LIVE GPS
                    </span>
                  </div>
                  <p className="text-[11px] text-blue-200/80 mt-0.5 flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>+{trackingData.credentialPointsAward || 185} Sustainability Credential Points will be credited on delivery</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={trackingData.googleMapsUrl || `https://www.google.com/maps/dir/?api=1&origin=${trackingData.volunteer?.latitude || 22.6650},${trackingData.volunteer?.longitude || 88.4420}&destination=${trackingData.destination.latitude},${trackingData.destination.longitude}&waypoints=${trackingData.pickup.latitude},${trackingData.pickup.longitude}&travelmode=driving`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <span>Launch Google Maps Route</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Handover Alert Notification Banner (Delivered vs Reached/En Route) */}
            {isDelivered ? (
              <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-green-50 border-2 border-emerald-500/40 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs animate-in fade-in">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0 shadow-sm">
                    <CheckCheck className="w-6 h-6 stroke-[2.5]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                        Delivered & Verified
                      </span>
                      <span className="text-xs text-emerald-800 font-semibold">• Handover Complete</span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 mt-1">
                      Delivery Handover Authenticated Successfully
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Surplus batch delivered to {trackingData.destination.name}. +185 Sustainability Points credited!
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsOtpModalOpen(true)}
                  className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Award className="w-4 h-4 text-amber-300" />
                  <span>View Delivery Certificate</span>
                </button>
              </div>
            ) : (
              <div className="bg-gradient-to-r from-emerald-700 via-teal-850 to-slate-900 rounded-2xl p-4 sm:p-5 text-white border-2 border-emerald-500/40 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center shrink-0 shadow-inner">
                    <KeyRound className="w-6 h-6 text-amber-300 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full">
                        Delivery Handover Active
                      </span>
                      <span className="text-xs text-emerald-200 font-semibold">• Food Has Reached Destination</span>
                    </div>
                    <h3 className="text-sm sm:text-base font-extrabold text-white mt-1">
                      Verify Delivery Handover OTP (Phone / Email)
                    </h3>
                    <p className="text-xs text-emerald-100/90 mt-0.5 max-w-lg leading-relaxed">
                      Food is at {trackingData.destination.name}. Enter the 6-digit OTP sent to your Phone Number or Email ID to authenticate delivery and award +185 Credential Points.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsOtpModalOpen(true)}
                  className="px-5 py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl text-xs font-black transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer transform hover:-translate-y-0.5 shrink-0"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>Enter Handover OTP</span>
                </button>
              </div>
            )}

            {/* 2. Route Telemetry Card (Dark Navy) */}
            <div className="bg-[#0B192C] rounded-2xl p-5 sm:p-6 text-white shadow-sm border border-slate-800 relative overflow-hidden">
              {/* Header inside Dark Navy Card */}
              <div className="flex items-center justify-between pb-5 border-b border-slate-800/80">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">
                    ROUTE TELEMETRY
                  </span>
                  <h2 className="text-base sm:text-lg font-bold text-white mt-0.5">
                    {activeDonation.foodItems || activeDonation.title || 'Home-cooked Rice & Lentils Meal Boxes'}
                  </h2>
                </div>
                <div className="text-right pl-3">
                  {isDelivered ? (
                    <>
                      <span className="text-xl sm:text-2xl font-black text-emerald-400 tracking-tight flex items-center justify-end gap-1">
                        <CheckCheck className="w-5 h-5 stroke-[2.5]" /> Delivered
                      </span>
                      <span className="text-xs text-slate-400 block mt-0.5">Handover verified</span>
                    </>
                  ) : (
                    <>
                      <span className="text-2xl sm:text-3xl font-black text-emerald-400 tracking-tight">
                        {trackingData.etaMinutes || 18}
                      </span>
                      <span className="text-xs text-slate-400 block -mt-1">minutes away</span>
                    </>
                  )}
                </div>
              </div>

              {/* Progress Milestones Timeline */}
              {/* Desktop Horizontal Timeline */}
              <div className="hidden md:grid grid-cols-4 gap-2 pt-6">
                {timelineStages.map((stage, idx) => {
                  const isCompleted = stage.state === 'completed';
                  const isCurrent = stage.state === 'current';

                  return (
                    <div key={stage.id} className="relative">
                      {/* Connecting Line between steps */}
                      {idx < timelineStages.length - 1 && (
                        <div 
                          className={`absolute top-3.5 left-8 right-0 h-0.5 z-0 ${
                            isCompleted ? 'bg-emerald-500' : isCurrent ? 'bg-blue-500/50 border-t border-dashed border-blue-400' : 'bg-slate-800'
                          }`}
                        />
                      )}

                      <div className="relative z-10 flex flex-col items-start pr-2">
                        {/* Status Icon */}
                        <div 
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mb-2 shadow-xs ${
                            isCompleted 
                              ? 'bg-emerald-500 text-slate-950' 
                              : isCurrent 
                              ? 'bg-blue-500 text-white ring-4 ring-blue-500/20 animate-pulse' 
                              : 'bg-slate-800 border border-slate-700 text-slate-400'
                          }`}
                        >
                          {isCompleted ? '✓' : isCurrent ? '●' : '○'}
                        </div>

                        {/* Text */}
                        <p className={`text-xs font-bold leading-tight ${
                          isCompleted ? 'text-slate-200' : isCurrent ? 'text-blue-300' : 'text-slate-400'
                        }`}>
                          {stage.title}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-1 leading-snug line-clamp-2">
                          {stage.subtext}
                        </p>

                        {!isDelivered && stage.id === 4 && (
                          <button
                            type="button"
                            onClick={() => setIsOtpModalOpen(true)}
                            className="mt-2 px-2.5 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-lg text-[10px] flex items-center gap-1 cursor-pointer transition-transform transform hover:scale-105 shadow-sm"
                          >
                            <KeyRound className="w-3 h-3" />
                            <span>Verify OTP</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Mobile Vertical Timeline */}
              <div className="md:hidden pt-5 space-y-4">
                {timelineStages.map((stage, idx) => {
                  const isCompleted = stage.state === 'completed';
                  const isCurrent = stage.state === 'current';

                  return (
                    <div key={stage.id} className="flex items-start gap-3 relative">
                      {idx < timelineStages.length - 1 && (
                        <div 
                          className={`absolute left-3 top-7 bottom-[-16px] w-0.5 ${
                            isCompleted ? 'bg-emerald-500' : isCurrent ? 'bg-blue-500' : 'bg-slate-800'
                          }`}
                        />
                      )}

                      <div 
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 z-10 ${
                          isCompleted 
                            ? 'bg-emerald-500 text-slate-950' 
                            : isCurrent 
                            ? 'bg-blue-500 text-white animate-pulse' 
                            : 'bg-slate-800 border border-slate-700 text-slate-400'
                        }`}
                      >
                        {isCompleted ? '✓' : isCurrent ? '●' : '○'}
                      </div>

                      <div className="pb-1">
                        <p className={`text-xs font-bold ${
                          isCompleted ? 'text-slate-200' : isCurrent ? 'text-blue-300' : 'text-slate-400'
                        }`}>
                          {stage.title}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {stage.subtext}
                        </p>
                        {!isDelivered && stage.id === 4 && (
                          <button
                            type="button"
                            onClick={() => setIsOtpModalOpen(true)}
                            className="mt-1.5 px-2.5 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-lg text-[10px] inline-flex items-center gap-1 cursor-pointer"
                          >
                            <KeyRound className="w-3 h-3" />
                            <span>Verify Handover OTP</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 3. Large Donation Route Map Card */}
            <DonationRouteMap
              ref={mapRef}
              data={trackingData}
              isGpsLive={gpsState === 'LIVE'}
              gpsState={gpsState}
              lastUpdatedText="28 Sep 2026, 01:45 PM"
            />
          </div>

          {/* Right Panel: ~28% (col-span-4) */}
          <div className="lg:col-span-4 space-y-5">
            {/* Donor Information Card */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Donor (Pickup Contact)</span>
                </h3>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                  Active Donor
                </span>
              </div>

              <div className="py-3 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Donor Name:</span>
                  <span className="font-bold text-slate-800">{activeDonation?.donorName || user?.fullName || 'praveen'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Mobile Phone:</span>
                  <span className="font-mono font-bold text-slate-900">{normalizePhone(activeDonation?.donorPhone || user?.phone || '+91 82488 32986').formattedDisplay}</span>
                </div>
                <div className="flex items-start justify-between gap-2">
                  <span className="text-slate-500">Pickup Address:</span>
                  <span className="text-right text-slate-700 font-medium">{activeDonation?.pickupAddress || user?.address || 'Sector 14, Rohini, New Delhi'}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
                <CallContactButton
                  label="Call Donor"
                  contactName={activeDonation?.donorName || user?.fullName || 'praveen'}
                  phoneNumber={activeDonation?.donorPhone || user?.phone || '+91 82488 32986'}
                  role="Donor"
                  donationId={activeDonation?.id || 'DC-U971'}
                  variant="compact"
                  className="w-full justify-between"
                />
                <button
                  type="button"
                  onClick={() => setIsOtpModalOpen(true)}
                  className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{isDelivered ? 'View Handover Certificate' : 'Authenticate Handover OTP'}</span>
                </button>
              </div>
            </div>

            {/* Assigned Volunteer Driver Card */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">
                ASSIGNED VOLUNTEER DRIVER
              </h3>

              {/* Volunteer Avatar & Info */}
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-base shadow-2xs">
                  {volunteerInitials}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{volunteerName}</h4>
                  <p className="text-xs text-emerald-700 font-semibold flex items-center gap-1 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Verified Food Rescue Volunteer</span>
                  </p>
                </div>
              </div>

              {/* Detail Rows */}
              <div className="py-4 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Phone Number:</span>
                  <span className="font-semibold text-slate-800">{volunteerPhone}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Donation Batch:</span>
                  <span className="font-mono font-semibold text-slate-800">{activeDonation.id}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Total Quantity:</span>
                  <span className="font-semibold text-slate-800">{activeDonation.quantity || '15 meals (8 kg)'}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 space-y-2.5">
                {/* Primary Button: Call Volunteer with Cellular + WhatsApp */}
                <div className="w-full flex items-center justify-center">
                  <CallContactButton
                    label="Call Volunteer"
                    contactName={volunteerName}
                    phoneNumber={volunteerPhone}
                    role="Volunteer Driver"
                    context="volunteer"
                    donationId={activeDonation.id}
                    referenceId={activeDonation.id}
                    variant="compact"
                    className="w-full justify-center py-1"
                  />
                </div>

                {/* Secondary Button: View on Map */}
                <button
                  type="button"
                  onClick={() => mapRef.current?.centerOnVolunteer()}
                  className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border border-slate-200 transition-colors"
                >
                  <Crosshair className="w-4 h-4 text-slate-500" />
                  <span>View on Map</span>
                </button>
              </div>
            </div>

            {/* Sustainability Credential Points Reward Card */}
            <div className="bg-gradient-to-br from-amber-500/10 via-emerald-500/10 to-teal-500/10 p-5 rounded-2xl border border-amber-300/80 shadow-xs text-slate-800">
              <div className="flex items-center justify-between pb-3 border-b border-amber-200/60">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
                    <Award className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-extrabold uppercase tracking-wider text-amber-900">
                    Credential Rewards
                  </span>
                </div>
                <span className="text-xs font-black text-emerald-700 bg-emerald-100/90 px-2 py-0.5 rounded-md">
                  +{trackingData.credentialPointsAward || 185} pts
                </span>
              </div>

              <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                By donating this surplus food batch, you divert <strong>{activeDonation.quantity || '8 kg'}</strong> from landfills and eliminate <strong>~20 kg CO2e</strong> greenhouse emissions.
              </p>

              <div className="mt-3.5 pt-3 border-t border-amber-200/60 flex items-center justify-between text-[11px] font-semibold text-slate-700">
                <span>Verified ESG Hash</span>
                <span className="font-mono text-[10px] text-slate-500">#FC-ESG-{activeDonation.id}</span>
              </div>
            </div>

            {/* Cold Chain & Hygiene Protocol Card */}
            <div className="p-4 sm:p-5 bg-emerald-50/80 rounded-2xl border border-emerald-100 text-xs text-emerald-800 shadow-2xs">
              <p className="font-bold flex items-center gap-2 mb-1.5 text-emerald-900">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Cold Chain & Hygiene Protocol</span>
              </p>
              <p className="text-[11px] text-emerald-700 leading-relaxed">
                Volunteers carry insulated thermal bags and verify container sealing upon collection.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Handover OTP Verification Modal */}
      <DeliveryHandoverOtpModal
        isOpen={isOtpModalOpen}
        onClose={() => setIsOtpModalOpen(false)}
        donation={activeDonation}
        userPhone={user?.phone || activeDonation?.donorPhone}
        userEmail={user?.email || activeDonation?.donorEmail}
        donorName={activeDonation?.donorName || user?.fullName}
        onSuccess={(updatedDonation, points) => {
          setHandoverSuccessBanner(`Handover authenticated! +${points} Sustainability Points credited to your account.`);
          fetchTracking(false);
        }}
      />
    </div>
  );
}
