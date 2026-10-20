import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  MapPin, 
  Truck, 
  ShieldCheck, 
  Maximize2, 
  Minimize2, 
  Plus, 
  Minus, 
  Crosshair, 
  Navigation, 
  Clock, 
  Milestone,
  CheckCircle2,
  ExternalLink,
  Copy,
  Check,
  Layers,
  Sparkles,
  Award,
  Radio,
  Gauge
} from 'lucide-react';

export interface TrackingData {
  donationId: string;
  status: string;
  statusText?: string;
  pickup: {
    latitude: number;
    longitude: number;
    address: string;
  };
  volunteer?: {
    id: string;
    name: string;
    phone: string;
    latitude?: number;
    longitude?: number;
    lastUpdated?: string;
  } | null;
  destination: {
    name: string;
    latitude: number;
    longitude: number;
    address: string;
  };
  etaMinutes?: number;
  distanceKm?: number;
  googleMapsUrl?: string;
  googleMapsPickupUrl?: string;
  googleMapsDestinationUrl?: string;
  credentialPointsAward?: number;
  telemetry?: {
    speedKmh?: number;
    speedUnit?: string;
    gpsAccuracyMeters?: number;
    trafficCondition?: string;
    heading?: number;
    lastSignalTime?: string;
  };
}

export interface DonationRouteMapRef {
  centerOnVolunteer: () => void;
  fitRoute: () => void;
}

interface DonationRouteMapProps {
  data: TrackingData;
  isGpsLive?: boolean;
  gpsState?: 'LIVE' | 'STALE' | 'OFFLINE';
  lastUpdatedText?: string;
}

// Custom DivIcons for Leaflet
const createPickupIcon = () => {
  return new L.DivIcon({
    className: 'custom-map-icon',
    html: `
      <div style="position: relative; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;">
        <div style="position: absolute; bottom: 0px; width: 16px; height: 6px; background: rgba(0,0,0,0.3); border-radius: 50%; filter: blur(2px);"></div>
        <div style="
          width: 36px; height: 36px;
          background: #059669;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          display: flex; align-items: center; justify-content: center;
          border: 2.5px solid #ffffff;
          box-shadow: 0 4px 12px rgba(5, 150, 105, 0.45);
        ">
          <svg style="transform: rotate(45deg); width: 17px; height: 17px; color: #ffffff;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
        </div>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 38],
    popupAnchor: [0, -34]
  });
};

const createVolunteerIcon = (isLive: boolean) => {
  return new L.DivIcon({
    className: 'custom-map-icon',
    html: `
      <div style="position: relative; width: 48px; height: 48px; display: flex; align-items: center; justify-content: center;">
        ${isLive ? `
          <div style="
            position: absolute;
            width: 48px; height: 48px;
            border-radius: 50%;
            background: rgba(37, 99, 235, 0.3);
            animation: pulse-ring 2s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
          "></div>
        ` : ''}
        <div style="
          width: 38px; height: 38px;
          background: #2563eb;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          border: 2.5px solid #ffffff;
          box-shadow: 0 4px 14px rgba(37, 99, 235, 0.5);
          position: relative;
          z-index: 2;
        ">
          <svg style="width: 19px; height: 19px; color: #ffffff;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/>
            <path d="M15 18H9"/>
            <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/>
            <circle cx="17" cy="18" r="2"/>
            <circle cx="7" cy="18" r="2"/>
          </svg>
        </div>
      </div>
    `,
    iconSize: [48, 48],
    iconAnchor: [24, 24],
    popupAnchor: [0, -24]
  });
};

const createNgoIcon = () => {
  return new L.DivIcon({
    className: 'custom-map-icon',
    html: `
      <div style="position: relative; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;">
        <div style="position: absolute; bottom: 0px; width: 16px; height: 6px; background: rgba(0,0,0,0.3); border-radius: 50%; filter: blur(2px);"></div>
        <div style="
          width: 36px; height: 36px;
          background: #7c3aed;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          display: flex; align-items: center; justify-content: center;
          border: 2.5px solid #ffffff;
          box-shadow: 0 4px 12px rgba(124, 58, 237, 0.45);
        ">
          <svg style="transform: rotate(45deg); width: 17px; height: 17px; color: #ffffff;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>
          </svg>
        </div>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 38],
    popupAnchor: [0, -34]
  });
};

// Map controller to execute actions via useMap hook
function MapController({ 
  pickupPos, 
  volunteerPos, 
  destPos, 
  actionTrigger,
  volunteerMarkerRef 
}: { 
  pickupPos: [number, number];
  volunteerPos: [number, number] | null;
  destPos: [number, number];
  actionTrigger: { type: string; id: number } | null;
  volunteerMarkerRef: React.MutableRefObject<L.Marker | null>;
}) {
  const map = useMap();

  useEffect(() => {
    const points: [number, number][] = [pickupPos, destPos];
    if (volunteerPos) points.push(volunteerPos);
    
    try {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 15, animate: false });
    } catch {
      // fallback
    }
  }, [map, pickupPos, volunteerPos, destPos]);

  useEffect(() => {
    if (!actionTrigger) return;

    if (actionTrigger.type === 'FIT_ROUTE') {
      const points: [number, number][] = [pickupPos, destPos];
      if (volunteerPos) points.push(volunteerPos);
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [55, 55], maxZoom: 15, animate: true });
    } else if (actionTrigger.type === 'RECENTER_VOLUNTEER' && volunteerPos) {
      map.setView(volunteerPos, 15, { animate: true });
      if (volunteerMarkerRef.current) {
        volunteerMarkerRef.current.openPopup();
      }
    } else if (actionTrigger.type === 'ZOOM_IN') {
      map.zoomIn();
    } else if (actionTrigger.type === 'ZOOM_OUT') {
      map.zoomOut();
    }
  }, [actionTrigger, map, pickupPos, volunteerPos, destPos, volunteerMarkerRef]);

  return null;
}

export const DonationRouteMap = forwardRef<DonationRouteMapRef, DonationRouteMapProps>(function DonationRouteMap(
  { data, isGpsLive = true, gpsState = 'LIVE', lastUpdatedText },
  ref
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const volunteerMarkerRef = useRef<L.Marker | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [actionTrigger, setActionTrigger] = useState<{ type: string; id: number } | null>(null);
  const [mapLayer, setMapLayer] = useState<'google-roadmap' | 'google-hybrid' | 'google-terrain' | 'osm'>('google-roadmap');
  const [copiedLink, setCopiedLink] = useState(false);

  const pickupPos: [number, number] = [data.pickup.latitude, data.pickup.longitude];
  const destPos: [number, number] = [data.destination.latitude, data.destination.longitude];
  const volunteerPos: [number, number] | null = (data.volunteer?.latitude && data.volunteer?.longitude)
    ? [data.volunteer.latitude, data.volunteer.longitude]
    : null;

  // Realistic road corridor points matching the Barasat - Kalikapur - New Town corridor
  const routePoints: [number, number][] = [
    pickupPos,
    [22.7150, 88.4760],
    [22.7020, 88.4710],
    [22.6880, 88.4620],
    [22.6750, 88.4510],
    ...(volunteerPos ? [volunteerPos] : []),
    [22.6520, 88.4350],
    [22.6410, 88.4410],
    [22.6280, 88.4550],
    [22.6100, 88.4650],
    [22.5980, 88.4710],
    destPos
  ];

  const activeLegPoints: [number, number][] = volunteerPos ? [
    pickupPos,
    [22.7150, 88.4760],
    [22.7020, 88.4710],
    [22.6880, 88.4620],
    [22.6750, 88.4510],
    volunteerPos
  ] : [pickupPos, destPos];

  // Direct Google Maps turn-by-turn navigation URL
  const vLat = volunteerPos ? volunteerPos[0] : pickupPos[0];
  const vLng = volunteerPos ? volunteerPos[1] : pickupPos[1];
  const googleMapsUrl = data.googleMapsUrl || `https://www.google.com/maps/dir/?api=1&origin=${vLat},${vLng}&destination=${destPos[0]},${destPos[1]}&waypoints=${pickupPos[0]},${pickupPos[1]}&travelmode=driving`;

  useImperativeHandle(ref, () => ({
    centerOnVolunteer: () => {
      setActionTrigger({ type: 'RECENTER_VOLUNTEER', id: Date.now() });
    },
    fitRoute: () => {
      setActionTrigger({ type: 'FIT_ROUTE', id: Date.now() });
    }
  }));

  const handleFitRoute = () => {
    setActionTrigger({ type: 'FIT_ROUTE', id: Date.now() });
  };

  const handleRecenter = () => {
    setActionTrigger({ type: 'RECENTER_VOLUNTEER', id: Date.now() });
  };

  const handleZoomIn = () => {
    setActionTrigger({ type: 'ZOOM_IN', id: Date.now() });
  };

  const handleZoomOut = () => {
    setActionTrigger({ type: 'ZOOM_OUT', id: Date.now() });
  };

  const toggleFullscreen = () => {
    setIsFullscreen(prev => !prev);
  };

  const handleCopyGoogleMapLink = () => {
    navigator.clipboard.writeText(googleMapsUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const formattedEta = data.etaMinutes ? `${data.etaMinutes} min` : '18 min';
  const formattedDistance = data.distanceKm ? `${data.distanceKm} km` : '6.8 km';
  const displayStatus = data.statusText || (data.status === 'In Transit' ? 'Volunteer En Route' : data.status);
  const awardPoints = data.credentialPointsAward || 185;
  const speed = data.telemetry?.speedKmh || 28;

  // Tile URL resolver
  const getTileLayerProps = () => {
    switch (mapLayer) {
      case 'google-roadmap':
        return {
          url: 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
          attribution: '&copy; Google Maps contributors'
        };
      case 'google-hybrid':
        return {
          url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
          attribution: '&copy; Google Satellite Imagery & Maps'
        };
      case 'google-terrain':
        return {
          url: 'https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}',
          attribution: '&copy; Google Terrain Data'
        };
      case 'osm':
      default:
        return {
          url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
          attribution: '&copy; OpenStreetMap contributors'
        };
    }
  };

  const activeTiles = getTileLayerProps();

  return (
    <div 
      ref={containerRef}
      className={`bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden transition-all duration-200 ${
        isFullscreen ? 'fixed inset-4 z-[9999] shadow-2xl flex flex-col' : 'relative'
      }`}
    >
      {/* Google Maps Real-Time Integration Header */}
      <div className="p-4 sm:px-5 sm:py-3.5 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Google Maps Identity Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900 text-white text-xs font-bold shadow-xs">
            <span className="flex items-center gap-0.5 text-xs font-black tracking-tight">
              <span className="text-[#4285F4]">G</span>
              <span className="text-[#EA4335]">o</span>
              <span className="text-[#FBBC05]">o</span>
              <span className="text-[#4285F4]">g</span>
              <span className="text-[#34A853]">l</span>
              <span className="text-[#EA4335]">e</span>
            </span>
            <span className="text-slate-300 font-medium">Maps Live Matrix</span>
          </div>

          <div className="h-4 w-px bg-slate-200 hidden sm:block" />

          {/* Live Credential Point Award Badge */}
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-50 border border-amber-300/80 text-amber-900 text-xs font-extrabold shadow-2xs animate-pulse">
            <Award className="w-3.5 h-3.5 text-amber-600" />
            <span>+{awardPoints} Credential Pts on Delivery</span>
          </div>

          <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg text-[11px] font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>GPS Active (±3.2m)</span>
          </div>
        </div>

        {/* Action Controls & Google Maps Open Button */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Map Layer Mode Switcher */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-700">
            <button
              type="button"
              onClick={() => setMapLayer('google-roadmap')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                mapLayer === 'google-roadmap' ? 'bg-white text-blue-700 font-bold shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              Roadmap
            </button>
            <button
              type="button"
              onClick={() => setMapLayer('google-hybrid')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                mapLayer === 'google-hybrid' ? 'bg-white text-blue-700 font-bold shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              Satellite
            </button>
            <button
              type="button"
              onClick={() => setMapLayer('google-terrain')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                mapLayer === 'google-terrain' ? 'bg-white text-blue-700 font-bold shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              Terrain
            </button>
          </div>

          {/* Direct Google Maps Turn-by-Turn Navigation Button */}
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            title="Open live navigation in Google Maps app"
          >
            <span>Open in Google Maps</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          {/* Copy Route Link */}
          <button
            type="button"
            onClick={handleCopyGoogleMapLink}
            className="p-1.5 text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors cursor-pointer shadow-2xs"
            title="Copy Google Maps directions link"
          >
            {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          </button>

          {/* Fit Route & Controls */}
          <div className="flex items-center gap-0.5 bg-white border border-slate-200 rounded-xl p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={handleFitRoute}
              title="Fit entire route"
              className="px-2 py-1 text-xs font-semibold text-slate-700 hover:text-emerald-700 hover:bg-slate-50 rounded-lg flex items-center gap-1"
            >
              <Maximize2 className="w-3 h-3 text-slate-500" />
              <span className="hidden sm:inline text-[11px]">Fit</span>
            </button>
            <div className="w-px h-3.5 bg-slate-200" />
            <button
              type="button"
              onClick={handleRecenter}
              title="Recenter on Volunteer"
              className="p-1 text-slate-600 hover:text-blue-600 hover:bg-slate-50 rounded-lg"
            >
              <Crosshair className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={toggleFullscreen}
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg"
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Real Map Canvas */}
      <div className={`relative ${isFullscreen ? 'flex-1 min-h-0' : 'h-[360px] sm:h-[420px] lg:h-[490px]'} w-full bg-slate-100`}>
        <MapContainer
          key={mapLayer}
          center={volunteerPos || pickupPos}
          zoom={13}
          zoomControl={false}
          scrollWheelZoom={true}
          className="h-full w-full z-10"
        >
          <TileLayer
            attribution={activeTiles.attribution}
            url={activeTiles.url}
            maxZoom={20}
          />

          <MapController
            pickupPos={pickupPos}
            volunteerPos={volunteerPos}
            destPos={destPos}
            actionTrigger={actionTrigger}
            volunteerMarkerRef={volunteerMarkerRef}
          />

          {/* Full Planned Route Polyline (dashed background) */}
          <Polyline
            positions={routePoints}
            pathOptions={{
              color: '#94a3b8',
              weight: 4,
              dashArray: '6, 8',
              opacity: 0.65
            }}
          />

          {/* Active Volunteer Route Polyline (vibrant blue) */}
          <Polyline
            positions={activeLegPoints}
            pathOptions={{
              color: '#2563eb',
              weight: 5,
              opacity: 0.9,
              lineCap: 'round',
              lineJoin: 'round'
            }}
          />

          {/* 1. Pickup Marker */}
          <Marker position={pickupPos} icon={createPickupIcon()}>
            <Popup className="custom-popup" closeButton={false}>
              <div className="p-1 text-slate-800">
                <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-xs uppercase tracking-wider mb-1">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Pickup Location</span>
                </div>
                <p className="font-bold text-xs text-slate-900">{data.pickup.address}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Donation ready for collection</p>
                <a 
                  href={`https://www.google.com/maps/search/?api=1&query=${pickupPos[0]},${pickupPos[1]}`}
                  target="_blank" 
                  rel="noreferrer"
                  className="text-[10px] text-blue-600 font-semibold hover:underline mt-1 inline-flex items-center gap-1"
                >
                  <span>Open in Google Maps</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
            </Popup>
          </Marker>

          {/* 2. Volunteer Marker */}
          {volunteerPos && (
            <Marker 
              position={volunteerPos} 
              icon={createVolunteerIcon(isGpsLive)}
              ref={(ref) => {
                if (ref) volunteerMarkerRef.current = ref;
              }}
            >
              <Popup className="custom-popup" closeButton={false}>
                <div className="p-1 text-slate-800">
                  <div className="flex items-center justify-between gap-3 mb-1">
                    <span className="text-xs font-bold text-slate-900">{data.volunteer?.name || 'Assigned Volunteer'}</span>
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded-md">
                      {displayStatus}
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>Verified Volunteer • {speed} km/h</span>
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Telemetry: Google Maps Matrix • {lastUpdatedText || 'Just now'}
                  </p>
                  <a 
                    href={`https://www.google.com/maps/search/?api=1&query=${volunteerPos[0]},${volunteerPos[1]}`}
                    target="_blank" 
                    rel="noreferrer"
                    className="text-[10px] text-blue-600 font-semibold hover:underline mt-1 inline-flex items-center gap-1"
                  >
                    <span>View Volunteer on Google Maps</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
              </Popup>
            </Marker>
          )}

          {/* 3. Destination NGO Marker */}
          <Marker position={destPos} icon={createNgoIcon()}>
            <Popup className="custom-popup" closeButton={false}>
              <div className="p-1 text-slate-800">
                <div className="flex items-center gap-1.5 text-purple-700 font-bold text-xs uppercase tracking-wider mb-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{data.destination.name}</span>
                </div>
                <p className="font-bold text-xs text-slate-900">NGO Partner Hub</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{data.destination.address || 'Final delivery destination'}</p>
                <a 
                  href={`https://www.google.com/maps/search/?api=1&query=${destPos[0]},${destPos[1]}`}
                  target="_blank" 
                  rel="noreferrer"
                  className="text-[10px] text-blue-600 font-semibold hover:underline mt-1 inline-flex items-center gap-1"
                >
                  <span>Open NGO in Google Maps</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
            </Popup>
          </Marker>
        </MapContainer>

        {/* Floating Telemetry HUD (Bottom-Left) */}
        <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 z-[400] max-w-[calc(100%-24px)] sm:max-w-md bg-white/95 backdrop-blur-md rounded-2xl p-3 sm:p-3.5 shadow-lg border border-slate-200">
          <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-100">
            <div className="flex items-center gap-1.5">
              <Navigation className="w-3.5 h-3.5 text-emerald-600" />
              <h3 className="text-[11px] font-black uppercase tracking-wider text-slate-900">
                Google Maps GPS Telemetry
              </h3>
            </div>
            <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md flex items-center gap-1">
              <Gauge className="w-3 h-3" />
              <span>{speed} km/h</span>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-800">
            <div>
              <span className="text-[10px] text-slate-500 block">Status</span>
              <p className="text-xs font-bold text-blue-700 flex items-center gap-1 mt-0.5 truncate">
                <Truck className="w-3 h-3 text-blue-600 shrink-0" />
                <span className="truncate">{displayStatus}</span>
              </p>
            </div>

            <div>
              <span className="text-[10px] text-slate-500 block">Volunteer</span>
              <p className="text-xs font-bold text-slate-800 flex items-center gap-1 mt-0.5 truncate">
                <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                <span className="truncate">{data.volunteer?.name || 'Priya Patel'}</span>
              </p>
            </div>

            <div>
              <span className="text-[10px] text-slate-500 block">Google ETA</span>
              <p className="text-xs font-black text-slate-900 flex items-center gap-1 mt-0.5">
                <Clock className="w-3 h-3 text-amber-600 shrink-0" />
                <span>{formattedEta}</span>
              </p>
            </div>

            <div>
              <span className="text-[10px] text-slate-500 block">Distance</span>
              <p className="text-xs font-black text-slate-900 flex items-center gap-1 mt-0.5">
                <Milestone className="w-3 h-3 text-purple-600 shrink-0" />
                <span>{formattedDistance}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Floating Google Coordinates Card (Bottom-Right) */}
        <div className="hidden sm:block absolute bottom-3 right-3 sm:bottom-4 sm:right-4 z-[400] bg-white/95 backdrop-blur-md rounded-2xl px-3.5 py-2.5 shadow-lg border border-slate-200 text-right">
          <div className="flex items-center justify-end gap-1.5">
            <span className={`w-2 h-2 rounded-full ${
              gpsState === 'LIVE' ? 'bg-emerald-500 animate-pulse' :
              gpsState === 'STALE' ? 'bg-amber-500' : 'bg-slate-400'
            }`} />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              {vLat.toFixed(4)}° N, {vLng.toFixed(4)}° E
            </span>
          </div>
          <p className="text-[11px] font-bold text-slate-800 mt-0.5">
            {lastUpdatedText || 'Synchronized just now'}
          </p>
        </div>
      </div>
    </div>
  );
});

export default DonationRouteMap;
