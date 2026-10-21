import { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { 
  Gift, 
  Plus, 
  CheckCircle2, 
  AlertCircle, 
  Award, 
  Sparkles, 
  Leaf, 
  Users, 
  MapPin, 
  Truck, 
  Phone, 
  Navigation, 
  X, 
  Clock, 
  Building2, 
  HeartHandshake,
  Check
} from 'lucide-react';
import CallContactButton from '../../components/common/CallContactButton';
import { normalizePhone } from '../../utils/phoneUtils';
import DonationRouteMap, { type TrackingData } from '../../components/tracking/DonationRouteMap';
import { getStoredDonations, addStoredDonation, updateStoredDonation } from '../../data/mockDatabase';
import { getBackendUrl } from '../../utils/apiConfig';

export default function SupermarketDonations() {
  const token = useAuthStore((state) => state.token);

  const [donations, setDonations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [trackingDonation, setTrackingDonation] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form State
  const [foodItems, setFoodItems] = useState('');
  const [category, setCategory] = useState('Bakery');
  const [quantity, setQuantity] = useState('25 kg');
  const [receiver, setReceiver] = useState('Delhi Food Rescue Partner Kitchen #4');
  const [expiryDate, setExpiryDate] = useState('');
  const [notes, setNotes] = useState('');

  const fetchDonations = async () => {
    const backendUrl = getBackendUrl();
    if (backendUrl) {
      try {
        const res = await fetch(`${backendUrl}/api/supermarket/donations`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: AbortSignal.timeout(2500)
        });
        if (res.ok) {
          const data = await res.json();
          setDonations(data.donations || []);
          setLoading(false);
          return;
        }
      } catch (err) {
        // Fall through to offline fallback
      }
    }

    // Offline / Public Fallback: load donations from mockDatabase
    setDonations(getStoredDonations() as any);
    setLoading(false);
  };

  useEffect(() => {
    fetchDonations();
  }, [token]);

  const calculateBatchPoints = (d: any) => {
    if (d.creditPoints) return d.creditPoints;
    const match = (d.quantity || '').match(/(\d+(\.\d+)?)/);
    const kg = match ? parseFloat(match[1]) : 20;
    const base = Math.round(kg * 5);
    const catBonus = d.category === 'Dairy' ? 15 : d.category === 'Fruits & Vegetables' ? 20 : 10;
    const statusBonus = d.status === 'Delivered' ? 50 : d.status === 'In Transit' ? 25 : 15;
    return base + catBonus + statusBonus;
  };

  // Computed Aggregated Credential Points & Sustainability Metrics
  const totalCreditPoints = donations.reduce((acc, d) => acc + calculateBatchPoints(d), 0);

  const totalKgRescued = donations.reduce((acc, d) => {
    const match = (d.quantity || '').match(/(\d+(\.\d+)?)/);
    return acc + (match ? parseFloat(match[1]) : 20);
  }, 0);

  const totalCo2Saved = (totalKgRescued * 2.5).toFixed(1);
  const totalMealsProvided = Math.round(totalKgRescued * 2.2);

  // Preview points calculation for the donation modal
  const previewKg = parseFloat((quantity.match(/(\d+(\.\d+)?)/)?.[1]) || '25');
  const previewCategoryBonus = category === 'Dairy' ? 15 : category === 'Fruits & Vegetables' ? 20 : 10;
  const previewPoints = Math.round(previewKg * 5) + previewCategoryBonus + 15;

  const handleCreateDonation = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    const donationPayload = {
      donorType: 'SUPERMARKET',
      foodItems,
      title: foodItems,
      category,
      quantity,
      weight: quantity,
      receiver,
      expiryDate,
      notes,
      creditPoints: previewPoints,
      donorName: 'FreshMart Flagship Supermarket',
      status: 'In Transit',
      statusBadgeText: 'Vehicle On Road',
      volunteer: 'Arjun Sharma',
      volunteerPhone: '+91 98765 43210',
      volunteerVehicle: 'Refrigerated EV Carrier (DL-01-EV-4421)'
    };

    try {
      const backendUrl = getBackendUrl();
      if (backendUrl) {
        const res = await fetch(`${backendUrl}/api/supermarket/donations`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(donationPayload),
          signal: AbortSignal.timeout(2000)
        });

        if (res.ok) {
          const data = await res.json();
          setMessage({ 
            type: 'success', 
            text: `Surplus donation created! Routing to ${receiver}. +${data.donation?.creditPoints || previewPoints} Sustainability Credit Points added to your store credentials.` 
          });
          setModalOpen(false);
          setFoodItems('');
          setNotes('');
          fetchDonations();
          return;
        }
      }
    } catch {}

    // Offline fallback: save to mockDatabase
    const created = addStoredDonation(donationPayload);
    setDonations(prev => [created, ...prev]);
    setMessage({ 
      type: 'success', 
      text: `Surplus donation created! Routing to ${receiver}. +${previewPoints} Sustainability Credit Points added to your store credentials.` 
    });
    setModalOpen(false);
    setFoodItems('');
    setNotes('');
    setSubmitting(false);
  };

  const handleHandover = async (donationId: string) => {
    try {
      const backendUrl = getBackendUrl();
      if (backendUrl) {
        const res = await fetch(`${backendUrl}/api/supermarket/donations/${donationId}/handover`, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}` },
          signal: AbortSignal.timeout(2000)
        });

        if (res.ok) {
          setMessage({ 
            type: 'success', 
            text: `Handover confirmed for batch ${donationId}! Volunteer is now Out for Delivery (+10 Transit Bonus Points credited).` 
          });
          fetchDonations();
          return;
        }
      }
    } catch {}

    // Offline fallback: update stored donation
    updateStoredDonation(donationId, { status: 'In Transit', statusBadgeText: 'Vehicle On Road' });
    setDonations(prev => prev.map(d => d.id === donationId ? { ...d, status: 'In Transit', statusBadgeText: 'Vehicle On Road' } : d));
    setMessage({ 
      type: 'success', 
      text: `Handover confirmed for batch ${donationId}! Volunteer is now Out for Delivery (+10 Transit Bonus Points credited).` 
    });
  };

  // Helper to build normalized tracking data for the food-delivery map & timeline
  const buildTrackingData = (d: any): TrackingData => {
    const isDairy = d.category === 'Dairy' || (d.receiver && d.receiver.includes('Children'));
    const isDelivered = d.status === 'Delivered';
    const pickupLat = d.latitude || 28.6315;
    const pickupLng = d.longitude || 77.2167;
    const destLat = d.destinationLatitude || (isDairy ? 28.5750 : 28.6430);
    const destLng = d.destinationLongitude || (isDairy ? 77.2000 : 77.2110);
    const volLat = isDelivered ? destLat : (d.volunteerLatitude || (pickupLat + (destLat - pickupLat) * 0.55));
    const volLng = isDelivered ? destLng : (d.volunteerLongitude || (pickupLng + (destLng - pickupLng) * 0.55));

    return {
      donationId: d.id,
      status: d.status,
      statusText: isDelivered 
        ? 'Delivered to Charity Destination' 
        : d.status === 'In Transit' 
          ? 'Out for Delivery (On the way)' 
          : 'Volunteer Courier Assigned',
      pickup: {
        latitude: pickupLat,
        longitude: pickupLng,
        address: d.pickupAddress || 'FreshMart Flagship, Booth #14, Central Market, Connaught Place'
      },
      volunteer: d.volunteer ? {
        id: d.volunteerId || 'vol-001',
        name: d.volunteer,
        phone: d.volunteerPhone || '+91 98765 43210',
        latitude: volLat,
        longitude: volLng,
        lastUpdated: isDelivered ? 'Delivered' : 'Live GPS (30s ago)'
      } : null,
      destination: {
        name: d.receiver || 'Delhi Food Rescue Partner Kitchen #4',
        latitude: destLat,
        longitude: destLng,
        address: d.destinationAddress || (isDairy ? 'Block C-4, Sarojini Nagar Community Child Center, New Delhi' : 'Plot 14, Bhai Veer Singh Marg, Paharganj, New Delhi')
      },
      etaMinutes: isDelivered ? 0 : 15,
      distanceKm: 3.4
    };
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Gift className="w-5 h-5 text-blue-600" />
              <span>Store Surplus Donations & Charity Pickups</span>
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
              <Award className="w-3 h-3 text-amber-600" />
              <span>CSR Credential Certified</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Dispatch expiring supermarket inventory to accredited NGOs with real-time food delivery tracking & ESG Credential Points.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Surplus Batch</span>
        </button>
      </div>

      {/* Credential Points & Sustainability Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Credential Points */}
        <div className="bg-gradient-to-br from-emerald-500/10 via-white to-white p-4 rounded-2xl border border-emerald-200/80 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-emerald-600" />
              <span>Credential Points</span>
            </span>
            <span className="text-[10px] font-extrabold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">
              Tier 1 Gold
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-950 font-mono">
              {loading ? '...' : totalCreditPoints}
            </span>
            <span className="text-xs font-bold text-emerald-600">pts earned</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-emerald-500 shrink-0" />
            <span>Store Sustainability & Food Rescue Credits</span>
          </p>
        </div>

        {/* Card 2: Food Rescued */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-800 flex items-center gap-1.5">
              <Gift className="w-4 h-4 text-blue-600" />
              <span>Surplus Food Rescued</span>
            </span>
            <span className="text-[10px] font-semibold text-slate-500">
              {donations.length} batches
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 font-mono">
              {loading ? '...' : totalKgRescued}
            </span>
            <span className="text-xs font-bold text-blue-600">kg diverted</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">
            Safe edible surplus prevented from waste stream
          </p>
        </div>

        {/* Card 3: CO2 Emissions Prevented */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800 flex items-center gap-1.5">
              <Leaf className="w-4 h-4 text-teal-600" />
              <span>GHG Offset</span>
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 bg-teal-50 text-teal-700 rounded border border-teal-200">
              CO₂e
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 font-mono">
              {loading ? '...' : totalCo2Saved}
            </span>
            <span className="text-xs font-bold text-teal-600">kg avoided</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">
            Calculated at 2.5 kg CO₂e per kg food saved
          </p>
        </div>

        {/* Card 4: Community Meals */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-800 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-indigo-600" />
              <span>Meals Provided</span>
            </span>
            <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
              Verified NGO
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 font-mono">
              {loading ? '...' : totalMealsProvided}
            </span>
            <span className="text-xs font-bold text-indigo-600">meals served</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">
            Directly distributed to local community kitchens
          </p>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-xl border text-xs font-medium flex items-center gap-2 ${
          message.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Commercial Donation Log Table with Food Delivery Tracking */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-900">Commercial Surplus & Food Delivery Tracking Log</span>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              +{totalCreditPoints} Credential Pts
            </span>
          </div>
          <span className="text-xs text-slate-500">Total: {donations.length} batches logged</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200/80">
                <th className="py-3 px-4">Batch ID</th>
                <th className="py-3 px-4">Food Items</th>
                <th className="py-3 px-4">Qty / Category</th>
                <th className="py-3 px-4">Where It Reaches (Destination Facility)</th>
                <th className="py-3 px-4">Delivery Journey</th>
                <th className="py-3 px-4">Credential Points</th>
                <th className="py-3 px-4 text-right">Handover Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-xs text-slate-400">Loading donation records...</td>
                </tr>
              ) : donations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-xs text-slate-400">No surplus donations logged yet.</td>
                </tr>
              ) : (
                donations.map((d) => {
                  const pts = calculateBatchPoints(d);
                  const isDelivered = d.status === 'Delivered';
                  const isInTransit = d.status === 'In Transit';

                  return (
                    <tr key={d.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Batch ID */}
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-700">
                        {d.id}
                      </td>

                      {/* Food Items */}
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        <div>{d.foodItems}</div>
                        <span className="text-[10px] text-slate-400 font-normal">
                          Packaged in sterile crates
                        </span>
                      </td>

                      {/* Qty & Category */}
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900 block">{d.quantity}</span>
                        <span className="text-[10px] text-slate-500">{d.category}</span>
                      </td>

                      {/* WHERE IT REACHES (Food Delivery Destination) */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="flex items-start gap-1.5">
                          <Building2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold text-slate-900 text-xs block leading-snug">
                              {d.receiver || 'Delhi Food Rescue Partner Kitchen'}
                            </span>
                            <span className="text-[10px] text-slate-500 block">
                              📍 {d.destinationAddress || 'Plot 14, Bhai Veer Singh Marg, Paharganj'}
                            </span>
                            <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded text-[9px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                              <HeartHandshake className="w-2.5 h-2.5" />
                              <span>{d.beneficiaries || 'Feeds local community shelter'}</span>
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* FOOD DELIVERY STYLE TRACKING ACTION */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1.5">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isDelivered ? 'bg-emerald-100 text-emerald-800' :
                              isInTransit ? 'bg-blue-100 text-blue-800' :
                              'bg-purple-100 text-purple-800'
                            }`}>
                              {isInTransit && (
                                <span className="relative flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
                                </span>
                              )}
                              <span>{isDelivered ? 'Delivered' : isInTransit ? 'Out for Delivery' : d.status}</span>
                            </span>
                            {d.eta && !isDelivered && (
                              <span className="text-[10px] font-semibold text-slate-500">
                                ~{d.eta}
                              </span>
                            )}
                          </div>

                          {/* Food Delivery App "Track Delivery" Button */}
                          <button
                            type="button"
                            onClick={() => setTrackingDonation(d)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-900 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold transition-all shadow-2xs cursor-pointer group"
                          >
                            <Truck className="w-3.5 h-3.5 text-blue-400 group-hover:translate-x-0.5 transition-transform" />
                            <span>Track Delivery 🛵</span>
                          </button>
                        </div>
                      </td>

                      {/* Credential Points */}
                      <td className="py-3.5 px-4">
                        <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200/80 font-bold text-xs">
                          <Award className="w-3.5 h-3.5 text-emerald-600" />
                          <span>+{pts} pts</span>
                        </div>
                        <span className="text-[10px] text-slate-400 block mt-0.5 font-medium">
                          {isDelivered ? 'Verified & Credited' : isInTransit ? 'In Transit (+10 on drop)' : 'Committed'}
                        </span>
                      </td>

                      {/* Handover Action */}
                      <td className="py-3.5 px-4 text-right">
                        {d.status === 'Assigned' || d.status === 'Pending' ? (
                          <button
                            onClick={() => handleHandover(d.id)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer shadow-2xs"
                          >
                            Confirm Handover
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic font-medium">
                            Handed Over
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* FOOD DELIVERY STYLE LIVE TRACKING MODAL (SWIGGY / ZOMATO PATTERN)          */}
      {/* ========================================================================= */}
      {trackingDonation && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            
            {/* 1. Food Delivery Header */}
            <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white p-5 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-500/30 text-blue-200 border border-blue-400/30 text-[10px] font-extrabold uppercase tracking-wider">
                    Live Surplus Food Delivery
                  </span>
                  <span className="font-mono text-xs text-blue-200 font-bold">
                    {trackingDonation.id}
                  </span>
                </div>
                <h2 className="text-lg font-black text-white mt-1 flex items-center gap-2">
                  {trackingDonation.status === 'Delivered' ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      <span>Delivered to {trackingDonation.receiver}</span>
                    </>
                  ) : trackingDonation.status === 'In Transit' ? (
                    <>
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                      </span>
                      <span>Out for Delivery • Arriving in ~{trackingDonation.eta || '15 mins'}</span>
                    </>
                  ) : (
                    <>
                      <Clock className="w-5 h-5 text-amber-400" />
                      <span>Volunteer Courier Assigned & Heading to Store Bay</span>
                    </>
                  )}
                </h2>
                <p className="text-xs text-blue-200/80 mt-0.5">
                  Consignment: {trackingDonation.quantity} {trackingDonation.category} ({trackingDonation.foodItems})
                </p>
              </div>

              <button
                type="button"
                onClick={() => setTrackingDonation(null)}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Close delivery tracker"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="overflow-y-auto p-5 space-y-5 flex-1">
              
              {/* 2. Interactive Route Map (Store -> Courier -> Destination Charity) */}
              <div className="bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 relative shadow-inner">
                <div className="h-64 sm:h-72 w-full">
                  <DonationRouteMap 
                    data={buildTrackingData(trackingDonation)} 
                    isGpsLive={trackingDonation.status === 'In Transit'}
                    gpsState={trackingDonation.status === 'Delivered' ? 'OFFLINE' : 'LIVE'}
                    lastUpdatedText={trackingDonation.status === 'Delivered' ? 'Delivered' : 'Live GPS (30s ago)'}
                  />
                </div>
                <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200/80 shadow-sm text-[11px] font-bold text-slate-800 flex items-center gap-1.5 z-[1000]">
                  <Navigation className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
                  <span>Route: Store Loading Dock ➔ {trackingDonation.receiver}</span>
                </div>
              </div>

              {/* 3. Two Columns: Delivery Stepper & Destination Recipient Card */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Column A: Food Delivery Stepper (Zomato / Swiggy style) */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-blue-600" />
                    <span>Food Delivery Progress</span>
                  </h3>

                  <div className="relative pl-6 space-y-4 border-l-2 border-emerald-500 ml-2">
                    {/* Step 1 */}
                    <div className="relative">
                      <div className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[9px] font-bold shadow-xs">
                        <Check className="w-3 h-3" />
                      </div>
                      <p className="text-xs font-bold text-slate-900">Surplus Packed & Safety Certified</p>
                      <p className="text-[10px] text-slate-500">FreshMart Loading Dock • Hygiene certified crates</p>
                    </div>

                    {/* Step 2 */}
                    <div className="relative">
                      <div className={`absolute -left-[31px] top-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold shadow-xs ${
                        trackingDonation.status !== 'Assigned' && trackingDonation.status !== 'Pending'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-amber-500 text-white'
                      }`}>
                        {trackingDonation.status !== 'Assigned' && trackingDonation.status !== 'Pending' ? (
                          <Check className="w-3 h-3" />
                        ) : (
                          '2'
                        )}
                      </div>
                      <p className="text-xs font-bold text-slate-900">Volunteer Courier Handover</p>
                      <p className="text-[10px] text-slate-500">
                        {trackingDonation.volunteer || 'Arjun Sharma'} collected batch (+10 Handover Bonus)
                      </p>
                    </div>

                    {/* Step 3 */}
                    <div className="relative">
                      <div className={`absolute -left-[31px] top-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold shadow-xs ${
                        trackingDonation.status === 'Delivered'
                          ? 'bg-emerald-600 text-white'
                          : trackingDonation.status === 'In Transit'
                          ? 'bg-blue-600 text-white ring-4 ring-blue-100 animate-pulse'
                          : 'bg-slate-300 text-slate-600'
                      }`}>
                        {trackingDonation.status === 'Delivered' ? (
                          <Check className="w-3 h-3" />
                        ) : (
                          '3'
                        )}
                      </div>
                      <p className="text-xs font-bold text-slate-900">Out for Delivery (On the Way)</p>
                      <p className="text-[10px] text-slate-500">
                        Live GPS tracking active • Cold-chain checked: 4.1°C
                      </p>
                    </div>

                    {/* Step 4 */}
                    <div className="relative">
                      <div className={`absolute -left-[31px] top-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold shadow-xs ${
                        trackingDonation.status === 'Delivered'
                          ? 'bg-emerald-600 text-white ring-4 ring-emerald-100'
                          : 'bg-slate-300 text-slate-600'
                      }`}>
                        {trackingDonation.status === 'Delivered' ? (
                          <Check className="w-3 h-3" />
                        ) : (
                          '4'
                        )}
                      </div>
                      <p className="text-xs font-bold text-slate-900">Delivered & Distributed</p>
                      <p className="text-[10px] text-slate-500">
                        Signed off at charity kitchen • +{calculateBatchPoints(trackingDonation)} Credential Points awarded
                      </p>
                    </div>
                  </div>
                </div>

                {/* Column B: "WHERE IT REACHES" (Destination Facility & Beneficiaries) */}
                <div className="bg-indigo-50/60 p-4 rounded-2xl border border-indigo-200/80 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
                        <Building2 className="w-4 h-4 text-indigo-600" />
                        <span>Where This Surplus Reaches</span>
                      </span>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">
                        Verified Charity
                      </span>
                    </div>

                    <div className="space-y-2 mt-3">
                      <div>
                        <span className="text-sm font-extrabold text-slate-900 block leading-snug">
                          {trackingDonation.receiver || 'Delhi Food Rescue Partner Kitchen #4'}
                        </span>
                        <span className="text-xs text-indigo-900 font-semibold block mt-0.5">
                          {trackingDonation.destinationType || 'Community Food Relief Kitchen & Night Shelter'}
                        </span>
                      </div>

                      <div className="p-2.5 bg-white/80 rounded-xl border border-indigo-100 text-xs space-y-1">
                        <div className="flex items-start gap-1.5 text-slate-600">
                          <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                          <span>{trackingDonation.destinationAddress || 'Plot 14, Bhai Veer Singh Marg, Paharganj, New Delhi'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <Users className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                          <span className="font-bold text-indigo-900">
                            {trackingDonation.beneficiaries || 'Supports 80 shelter residents & senior citizens'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>In-Charge: {trackingDonation.destinationContact || 'Rajesh Kumar • +91 98111 55667'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Impact Summary Pill */}
                  <div className="mt-3 p-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs flex items-center justify-between shadow-xs">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-yellow-300" />
                      <span className="font-bold">Zero-Waste Verified Impact</span>
                    </div>
                    <span className="font-mono font-extrabold bg-white/20 px-2 py-0.5 rounded">
                      +{calculateBatchPoints(trackingDonation)} pts
                    </span>
                  </div>
                </div>
              </div>

              {/* 4. Courier Details Card (Driver info) */}
              <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center font-bold text-base shrink-0 shadow-xs">
                    {trackingDonation.volunteer ? trackingDonation.volunteer.slice(0, 2).toUpperCase() : 'AS'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">
                        {trackingDonation.volunteer || 'Arjun Sharma'}
                      </span>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Accredited Volunteer Courier
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Vehicle: {trackingDonation.volunteerVehicle || 'Electric Cargo Carrier (DL-01-EV-4421)'} • Cold Chain Inspected
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <CallContactButton
                    label="Call Courier"
                    contactName={trackingDonation.volunteer || 'Courier'}
                    phoneNumber={trackingDonation.volunteerPhone || '+919876543210'}
                    role="Courier / Volunteer"
                    context="donation"
                    referenceId={trackingDonation.id}
                    variant="compact"
                  />
                  <button
                    type="button"
                    onClick={() => setTrackingDonation(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
                  >
                    Done
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CREATE SURPLUS BATCH MODAL                                                */}
      {/* ========================================================================= */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Gift className="w-4 h-4 text-blue-600" />
                <span>Create Commercial Surplus Donation</span>
              </h3>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                +{previewPoints} Points Expected
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Schedule surplus inventory for collection at the store loading bay and select destination charity.
            </p>

            <form onSubmit={handleCreateDonation} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Surplus Items Description *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 50 Packs Artisan Baguettes & Sourdough Rolls"
                  value={foodItems}
                  onChange={(e) => setFoodItems(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="Bakery">Bakery (+10 pts bonus)</option>
                    <option value="Dairy">Dairy (+15 pts bonus)</option>
                    <option value="Fruits & Vegetables">Fruits & Vegetables (+20 pts bonus)</option>
                    <option value="Packaged Foods">Packaged Foods (+10 pts bonus)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Total Quantity / Weight *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 35 kg"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Destination Partner Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Destination Charity Partner (Where It Reaches) *
                </label>
                <select
                  value={receiver}
                  onChange={(e) => setReceiver(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                >
                  <option value="Delhi Food Rescue Partner Kitchen #4">
                    Delhi Food Rescue Partner Kitchen #4 (Paharganj Shelter - 3.4 km)
                  </option>
                  <option value="Children Care Nutrition Center & Orphanage">
                    Children Care Nutrition Center & Orphanage (Sarojini Nagar - 4.1 km)
                  </option>
                  <option value="Asha Community Kitchen & Relief Center">
                    Asha Community Kitchen & Relief Center (Gole Market - 1.8 km)
                  </option>
                </select>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Courier will be automatically routed along verified corridors to this destination.
                </span>
              </div>

              {/* Dynamic Credential Points Preview Pill */}
              <div className="p-3 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-emerald-600 text-white">
                    <Award className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-emerald-950 block">Credential Reward Calculation</span>
                    <span className="text-[10px] text-emerald-700">
                      {previewKg} kg × 5 pts + {previewCategoryBonus} {category} bonus + 15 dispatch pts
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-black text-emerald-800 font-mono">
                    +{previewPoints} pts
                  </span>
                  <span className="block text-[9px] text-emerald-600 font-medium">To Store Credits</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Expiry / Best Before</label>
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Packaging & Handling Notes</label>
                <textarea
                  rows={2}
                  placeholder="e.g. In food grade crates, kept in cold room until volunteer arrival."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl disabled:opacity-60 transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  {submitting ? 'Creating...' : `Confirm Surplus Donation (+${previewPoints} pts)`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


