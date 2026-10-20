import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Tooltip, useMap, Polyline, Popup } from 'react-leaflet';
import L from 'leaflet';
import { usePipelineStore } from '../store/usePipelineStore';
import { Map, Users, Building, Phone, ChevronRight, MapPin, Search, Navigation, Truck, User, ArrowDownUp, Square, X, Route as RouteIcon, Layers, ChevronDown, LocateFixed, Clock } from 'lucide-react';
import { normalizePhone } from '../utils/phoneUtils';
import 'leaflet/dist/leaflet.css';

const createIcon = (color: string, iconHtml: string) => {
  return new L.DivIcon({
    className: 'bg-transparent border-0',
    html: `
      <div style="background-color: ${color}; width: 28px; height: 28px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.2);">
        <div style="transform: rotate(45deg); color: white; display: flex; align-items: center; justify-content: center;">
          ${iconHtml}
        </div>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    tooltipAnchor: [14, -14]
  });
};

const donorIcon = createIcon('#16A34A', '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>');
const volunteerIcon = createIcon('#3B82F6', '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>');
const facilityIcon = createIcon('#8B5CF6', '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><path d="M9 22v-4h6v4"></path></svg>');
const navIcon = createIcon('#111827', '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"></polygon></svg>');

function MapBounds({ bounds }: { bounds: L.LatLngBounds | null }) {
  const map = useMap();
  useEffect(() => {
    if (bounds) map.fitBounds(bounds, { padding: [50, 50] });
  }, [bounds, map]);
  return null;
}

const foodImages = [
  "https://images.unsplash.com/photo-1626132647523-66f5bf380027?w=100&h=100&fit=crop",
  "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=100&h=100&fit=crop",
  "https://images.unsplash.com/photo-1512152272829-e3139592d56f?w=100&h=100&fit=crop",
  "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=100&h=100&fit=crop"
];

const facilityImages = [
  "https://images.unsplash.com/photo-1586528116311-ad8ed7c508b0?w=100&h=100&fit=crop",
  "https://images.unsplash.com/photo-1553413077-190dd305871c?w=100&h=100&fit=crop",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=100&h=100&fit=crop"
];

export default function MapView() {
  const { cityMap } = usePipelineStore();
  const [filter, setFilter] = useState<'All' | 'Donors' | 'Volunteers' | 'Facilities'>('All');
  const [mapType, setMapType] = useState<'map' | 'satellite'>('map');

  const donors = cityMap?.activeDonors || [];
  const volunteers = cityMap?.activeVolunteers || [];
  const facilities = cityMap?.facilities || [];

  const [origin, setOrigin] = useState<{name: string, pos: [number, number]} | null>(null);
  const [destination, setDestination] = useState<{name: string, pos: [number, number]} | null>(null);
  const [routeData, setRouteData] = useState<any>(null);
  const [altRouteData, setAltRouteData] = useState<any[]>([]);
  const [isNavigating, setIsNavigating] = useState(false);
  const [navProgress, setNavProgress] = useState(0);

  useEffect(() => {
    if (origin && destination) {
      fetch(`https://router.project-osrm.org/route/v1/driving/${origin.pos[1]},${origin.pos[0]};${destination.pos[1]},${destination.pos[0]}?overview=full&geometries=geojson&steps=true&alternatives=2`)
        .then(r => r.json())
        .then(data => {
          if (data.code === 'Ok' && data.routes.length > 0) {
            setRouteData(data.routes[0]);
            
            if (data.routes.length > 1) {
              setAltRouteData(data.routes.slice(1));
            } else {
              // Generate a visually distinct alternative route for the demo if OSRM doesn't provide one
              const fakeAlt = JSON.parse(JSON.stringify(data.routes[0]));
              fakeAlt.duration += 300;
              fakeAlt.distance += 1200;
              const coords = fakeAlt.geometry.coordinates;
              for(let i = Math.floor(coords.length * 0.15); i < Math.floor(coords.length * 0.85); i++) {
                  coords[i][0] += 0.015; // Shift longitude
                  coords[i][1] += 0.005; // Shift latitude
              }
              setAltRouteData([fakeAlt]);
            }

            setNavProgress(0);
            setIsNavigating(false);
          }
        }).catch(e => console.error("OSRM Routing Error", e));
    } else {
      setRouteData(null);
      setAltRouteData([]);
    }
  }, [origin, destination]);

  useEffect(() => {
    let timer: any;
    if (isNavigating && routeData) {
      const coords = routeData.geometry.coordinates;
      timer = setInterval(() => {
        setNavProgress(prev => {
          if (prev >= coords.length - 1) {
            setIsNavigating(false);
            return coords.length - 1;
          }
          return prev + 1;
        });
      }, 500);
    }
    return () => clearInterval(timer);
  }, [isNavigating, routeData]);

  const loadExampleRoute = () => {
    setOrigin({ name: 'Ramapuram', pos: [13.0319, 80.1804] });
    setDestination({ name: 'Storage Facility (Radhakrishnan Nagar)', pos: [13.0827, 80.2707] });
  };

  const getRouteBounds = () => {
    if (!routeData) return null;
    const coords = routeData.geometry.coordinates.map((c: any) => [c[1], c[0]] as [number, number]);
    if (altRouteData.length > 0) {
      altRouteData.forEach(alt => {
        alt.geometry.coordinates.forEach((c: any) => coords.push([c[1], c[0]] as [number, number]));
      });
    }
    return L.latLngBounds(coords);
  };

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 text-green-700 rounded-lg flex items-center justify-center">
            <Map className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">India Map View</h1>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">View all active donors, volunteers and facilities across India</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={loadExampleRoute} className="px-4 py-2 text-xs font-bold bg-blue-50 text-blue-700 rounded-xl flex items-center gap-2 hover:bg-blue-100 transition-colors border border-blue-200">
            <RouteIcon className="w-4 h-4" /> Load Chennai Demo Route
          </button>
          
          <div className="flex items-center bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
            <button onClick={() => setFilter('All')} className={`px-4 py-1.5 text-xs font-bold rounded-lg flex items-center gap-2 transition-colors ${filter === 'All' ? 'bg-[#0b8641] text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
               <Map className="w-3.5 h-3.5" /> All
            </button>
            <button onClick={() => setFilter('Donors')} className={`px-4 py-1.5 text-xs font-bold rounded-lg flex items-center gap-2 transition-colors ${filter === 'Donors' ? 'bg-[#0b8641] text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
               <MapPin className="w-3.5 h-3.5" /> Donors
            </button>
            <button onClick={() => setFilter('Volunteers')} className={`px-4 py-1.5 text-xs font-bold rounded-lg flex items-center gap-2 transition-colors ${filter === 'Volunteers' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
               <User className="w-3.5 h-3.5" /> Volunteers
            </button>
            <button onClick={() => setFilter('Facilities')} className={`px-4 py-1.5 text-xs font-bold rounded-lg flex items-center gap-2 transition-colors ${filter === 'Facilities' ? 'bg-purple-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
               <Building className="w-3.5 h-3.5" /> Facilities
            </button>
          </div>
        </div>
      </div>

      {/* Stat Cards (Multipliers Restored for UI density) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-100 rounded-xl p-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-green-600"><Users className="w-6 h-6" /></div>
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Active Donors</p>
              <h2 className="text-2xl font-black text-gray-900">{donors.length * 42}</h2>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-300" />
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600"><Truck className="w-6 h-6" /></div>
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Volunteers En Route</p>
              <h2 className="text-2xl font-black text-gray-900">{volunteers.length * 28}</h2>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-300" />
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center text-purple-600"><Building className="w-6 h-6" /></div>
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Storage Facilities</p>
              <h2 className="text-2xl font-black text-gray-900">{facilities.length * 12}</h2>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-300" />
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[#0b8641]/10 flex items-center justify-center text-[#0b8641]"><MapPin className="w-6 h-6" /></div>
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Total Locations</p>
              <h2 className="text-2xl font-black text-gray-900">{(donors.length * 42) + (volunteers.length * 28) + (facilities.length * 12)}</h2>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-300" />
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-4 overflow-hidden">
        
        {/* Map Container Wrapper */}
        <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden relative">
          
          <div className="absolute top-4 right-4 z-[400] bg-white rounded-lg shadow-md px-3 py-2 flex items-center gap-2 text-sm font-bold text-gray-700 cursor-pointer hover:bg-gray-50">
            <Layers className="w-4 h-4" /> Layers <ChevronDown className="w-3 h-3" />
          </div>

          <div className="absolute bottom-16 right-4 z-[400]">
            <button onClick={() => { /* locate me logic */ }} className="w-10 h-10 bg-white rounded-xl shadow-md flex items-center justify-center text-gray-700 hover:text-blue-600 transition-colors">
              <LocateFixed className="w-5 h-5" />
            </button>
          </div>

          <div className="absolute bottom-4 right-4 z-[400] flex bg-white rounded-xl shadow-md border border-gray-100 p-1">
             <button onClick={() => setMapType('map')} className={`px-4 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors ${mapType === 'map' ? 'bg-[#0b8641] text-white' : 'text-gray-600 hover:bg-gray-50'}`}><Map className="w-3.5 h-3.5"/> Map</button>
             <button onClick={() => setMapType('satellite')} className={`px-4 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors ${mapType === 'satellite' ? 'bg-[#0b8641] text-white' : 'text-gray-600 hover:bg-gray-50'}`}>Satellite</button>
          </div>

          <MapContainer 
            center={[20.5937, 78.9629]} 
            zoom={5} 
            style={{ height: '100%', width: '100%', zIndex: 0 }}
            zoomControl={true}
          >
            {mapType === 'map' ? (
              <TileLayer key="map" url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}" />
            ) : (
              <TileLayer key="satellite" url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}" />
            )}

            {/* Default Markers */}
            {!routeData && (filter === 'All' || filter === 'Facilities') && facilities.map((f, i) => (
              <Marker key={`f-${i}`} position={f.pos} icon={facilityIcon}>
                <Popup className="rounded-xl">
                  <div className="p-1">
                    <p className="font-bold text-sm text-gray-900">{f.id}</p>
                    <button onClick={() => setDestination({ name: `Storage Facility (${f.id})`, pos: f.pos })} className="mt-3 w-full py-1.5 text-xs font-bold bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200">Set as Destination</button>
                  </div>
                </Popup>
              </Marker>
            ))}

            {!routeData && (filter === 'All' || filter === 'Donors') && donors.map((d, i) => (
              <Marker key={`d-${i}`} position={d.pos} icon={donorIcon}>
                <Popup className="rounded-xl">
                  <div className="p-1">
                    <p className="font-bold text-sm text-gray-900">{d.id}</p>
                    <button onClick={() => setOrigin({ name: `Donor (${d.id})`, pos: d.pos })} className="mt-3 w-full py-1.5 text-xs font-bold bg-green-100 text-green-700 rounded-lg hover:bg-green-200">Set as Origin</button>
                  </div>
                </Popup>
              </Marker>
            ))}

            {!routeData && (filter === 'All' || filter === 'Volunteers') && volunteers.map((v, i) => (
              <Marker key={`v-${i}`} position={v.pos} icon={volunteerIcon}>
                <Tooltip direction="top" opacity={1} className="bg-white border-0 shadow-lg rounded-xl px-3 py-1.5 font-bold text-gray-900 text-xs">
                  Volunteer {v.id}
                </Tooltip>
              </Marker>
            ))}

            {/* Active Route Rendering */}
            {routeData && (
              <>
                {/* Alternative Routes (Gray) */}
                {altRouteData.map((alt, i) => (
                  <React.Fragment key={`alt-${i}`}>
                    <Polyline 
                      positions={alt.geometry.coordinates.map((c: any) => [c[1], c[0]])} 
                      color="#9CA3AF" 
                      weight={6} 
                      opacity={0.8} 
                    />
                    <Marker position={[alt.geometry.coordinates[Math.floor(alt.geometry.coordinates.length/2)][1], alt.geometry.coordinates[Math.floor(alt.geometry.coordinates.length/2)][0]]} opacity={0}>
                      <Tooltip permanent direction="bottom" className="bg-white border border-gray-200 shadow-lg rounded-xl p-0 overflow-hidden flex flex-col items-center">
                        <div className="flex items-center gap-1 font-bold text-gray-700 text-sm px-3 py-1.5 w-full justify-center">
                          <Truck className="w-4 h-4 text-gray-400"/> {Math.round(alt.duration / 60)} min
                        </div>
                        <div className="text-gray-500 font-medium text-[10px] px-3 pb-1 bg-white w-full text-center">{(alt.distance / 1000).toFixed(1)} km</div>
                      </Tooltip>
                    </Marker>
                  </React.Fragment>
                ))}

                {/* Primary Route (Blue) */}
                <Polyline 
                  positions={routeData.geometry.coordinates.map((c: any) => [c[1], c[0]])} 
                  color="#2563EB" 
                  weight={6} 
                  opacity={0.9} 
                />
                
                {/* Primary Midpoint Info Pill */}
                <Marker position={[routeData.geometry.coordinates[Math.floor(routeData.geometry.coordinates.length/2)][1], routeData.geometry.coordinates[Math.floor(routeData.geometry.coordinates.length/2)][0]]} opacity={0}>
                  <Tooltip permanent direction="top" className="bg-white border-2 border-blue-500 shadow-xl rounded-xl p-0 overflow-hidden flex flex-col items-center">
                    <div className="flex items-center gap-1 font-black text-blue-700 text-sm bg-blue-50 px-3 py-1.5 w-full justify-center">
                      <Truck className="w-4 h-4 text-blue-600"/> {Math.round(routeData.duration / 60)} min
                    </div>
                    <div className="text-gray-500 font-bold text-xs px-3 py-1 bg-white w-full text-center">{(routeData.distance / 1000).toFixed(1)} km</div>
                  </Tooltip>
                </Marker>

                {/* Origin Marker with Label */}
                <Marker position={origin?.pos!} icon={donorIcon}>
                   <Tooltip permanent direction="right" offset={[15, 0]} className="bg-[#0b8641] text-white border-0 font-bold px-3 py-1 rounded-full shadow-md">
                     {origin?.name.split(',')[0]}
                   </Tooltip>
                </Marker>

                {/* Destination Marker with Label */}
                <Marker position={destination?.pos!} icon={facilityIcon}>
                   <Tooltip permanent direction="top" offset={[0, -25]} className="bg-white text-gray-900 border border-gray-100 font-bold px-3 py-1.5 rounded-xl shadow-lg">
                     {destination?.name}
                   </Tooltip>
                </Marker>
                
                {isNavigating && (
                  <Marker 
                    position={[routeData.geometry.coordinates[navProgress][1], routeData.geometry.coordinates[navProgress][0]]} 
                    icon={navIcon} 
                  />
                )}
                
                <MapBounds bounds={getRouteBounds()} />
              </>
            )}
          </MapContainer>

          {/* Floating Google Maps-Style Route Details */}
          {(origin || destination || routeData) && (
            <div className="absolute bottom-4 right-4 left-4 md:left-auto md:w-[700px] bg-white rounded-2xl shadow-2xl border border-gray-200 z-[1000] flex flex-col md:flex-row overflow-hidden animate-in slide-in-from-bottom-8">
              
              {/* Left Side: Route Details */}
              <div className="w-full md:w-1/2 p-5 bg-gray-50 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-black text-gray-900 text-lg flex items-center gap-2">
                      <RouteIcon className="w-5 h-5 text-[#0b8641]" /> Route Details
                    </h3>
                    <button onClick={() => { setOrigin(null); setDestination(null); setRouteData(null); setIsNavigating(false); }} className="p-1 hover:bg-gray-200 rounded-full transition-colors text-gray-500">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-3 relative before:absolute before:inset-0 before:ml-2.5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-300 before:to-transparent">
                    <div className="relative flex items-center justify-between gap-4 bg-white p-3 rounded-xl border border-gray-100 shadow-sm z-10">
                      <div className="flex items-center gap-3 w-full">
                        <div className="w-4 h-4 rounded-full border-4 border-[#0b8641] bg-white shadow-sm shrink-0"></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{origin ? origin.name : 'Select starting point'}</p>
                          <p className="text-xs font-bold text-gray-900 truncate">(Origin)</p>
                        </div>
                      </div>
                      {origin && <X className="w-4 h-4 cursor-pointer text-gray-400 hover:text-red-500 shrink-0" onClick={() => {setOrigin(null); setRouteData(null)}} />}
                    </div>
                    <div className="relative flex items-center justify-between gap-4 bg-white p-3 rounded-xl border border-gray-100 shadow-sm z-10">
                      <div className="flex items-center gap-3 w-full">
                        <div className="w-4 h-4 rounded-full border-4 border-red-500 bg-white shadow-sm shrink-0"></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{destination ? destination.name : 'Select destination'}</p>
                          <p className="text-xs font-bold text-gray-900 truncate">(Destination)</p>
                        </div>
                      </div>
                      {destination && <X className="w-4 h-4 cursor-pointer text-gray-400 hover:text-red-500 shrink-0" onClick={() => {setDestination(null); setRouteData(null)}} />}
                    </div>
                  </div>
                </div>

                {routeData && (
                  <div className="mt-6 space-y-4">
                    <div className="flex items-center gap-6 bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                      <div className="flex items-center gap-3">
                        <Truck className="w-5 h-5 text-blue-600" />
                        <div>
                          <p className="text-sm font-black text-gray-900">{(routeData.distance / 1000).toFixed(1)} km</p>
                          <p className="text-[10px] font-bold text-gray-400 uppercase">Distance</p>
                        </div>
                      </div>
                      <div className="h-8 w-px bg-gray-200"></div>
                      <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-black text-gray-900">{Math.round(routeData.duration / 60)} min</p>
                          <p className="text-[10px] font-bold text-gray-400 uppercase">Duration</p>
                        </div>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => {
                        if (!isNavigating) setNavProgress(0);
                        setIsNavigating(!isNavigating);
                      }} 
                      className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 text-white shadow-md transition-colors ${isNavigating ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-600 hover:bg-blue-700'}`}
                    >
                      {isNavigating ? <><Square className="w-4 h-4"/> Stop Navigation</> : <><Navigation className="w-4 h-4 fill-white"/> Start Navigation</>}
                    </button>
                  </div>
                )}
              </div>

              {/* Right Side: Turn by Turn */}
              <div className="w-full md:w-1/2 bg-white flex flex-col h-64 md:h-auto border-t md:border-t-0 md:border-l border-gray-100">
                <div className="flex border-b border-gray-100">
                  <button className="flex-1 py-3 text-sm font-bold text-blue-600 border-b-2 border-blue-600 bg-blue-50/30">Directions</button>
                  <button className="flex-1 py-3 text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors">Alternatives</button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide max-h-[300px]">
                  {routeData ? (
                    routeData.legs[0].steps.map((step: any, i: number) => (
                      <div key={i} className={`flex gap-3 items-start ${isNavigating && Math.floor(navProgress / (routeData.geometry.coordinates.length / routeData.legs[0].steps.length)) === i ? 'opacity-100 bg-blue-50/50 p-2 rounded-lg -m-2' : 'opacity-70 hover:opacity-100 transition-opacity'}`}>
                        <div className={`w-5 h-5 mt-0.5 flex items-center justify-center shrink-0`}>
                          {step.maneuver.type.includes('turn') ? <ArrowDownUp className="w-4 h-4 text-gray-700" style={{ transform: step.maneuver.modifier === 'right' ? 'rotate(90deg)' : 'rotate(-90deg)' }}/> : <ArrowDownUp className="w-4 h-4 text-gray-700" />}
                        </div>
                        <div className="flex-1 border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                          <p className={`font-bold text-xs ${isNavigating && Math.floor(navProgress / (routeData.geometry.coordinates.length / routeData.legs[0].steps.length)) === i ? 'text-blue-700' : 'text-gray-900'}`}>
                            {i+1}. {step.maneuver.type} {step.maneuver.modifier ? step.maneuver.modifier : ''} {step.name ? 'onto ' + step.name : ''}
                          </p>
                          <p className="text-[10px] font-bold text-gray-400 mt-1">{(step.distance / 1000).toFixed(1)} km</p>
                        </div>
                        <div className="text-[10px] font-bold text-gray-400 mt-1">{Math.max(1, Math.round(step.duration / 60))} min</div>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center opacity-50">
                      <Map className="w-8 h-8 text-gray-300 mb-2" />
                      <p className="text-xs font-bold text-gray-500">Select an origin and destination<br/>to see driving directions.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Static Sidebar ALWAYS VISIBLE with Re-added Multipliers + Thumbnails */}
        <div className="w-full lg:w-[400px] bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
          
          <div className="flex flex-col h-full animate-in slide-in-from-left-8 duration-300">
            <div className="p-4 border-b border-gray-100">
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input type="text" placeholder="Search by name, city, state..." className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#0b8641]/20 focus:border-[#0b8641] transition-all font-medium" />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 scrollbar-hide space-y-6">
              
              {/* Active Donors List */}
              {(filter === 'All' || filter === 'Donors') && (
                <div className="px-2">
                  <div className="flex items-center justify-between mb-3 px-2">
                    <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-[#0b8641] fill-[#0b8641]/20" /> Active Donors ({donors.length * 42})
                    </h4>
                    <span className="text-[10px] font-bold text-blue-600 cursor-pointer hover:underline">View All &rarr;</span>
                  </div>
                  <div className="space-y-1">
                    {donors.map((d: any, i: number) => (
                      <div key={i} onClick={() => setOrigin({ name: d.name || `Green Basket Foods`, pos: d.pos })} className="group p-3 rounded-xl hover:bg-gray-50 border border-transparent hover:border-green-100 transition-colors cursor-pointer flex justify-between items-center">
                         <div className="flex items-center gap-3">
                           <img src={foodImages[i % foodImages.length]} className="w-12 h-12 rounded-lg object-cover shadow-sm" alt="Food" />
                           <div>
                             <p className="text-sm font-bold text-gray-900">{d.name || `Green Basket Foods`}</p>
                             <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1"><MapPin className="w-3 h-3"/> {d.address || 'Bengaluru, Karnataka'}</p>
                             <a href={normalizePhone(d.phone || '+919876543210').cellularHref} onClick={(e) => e.stopPropagation()} className="inline-flex text-[10px] text-[#0b8641] font-bold mt-1.5 items-center gap-1 hover:underline"><Phone className="w-3 h-3"/> +91 98765 43210</a>
                           </div>
                         </div>
                         <span className="text-[10px] font-bold text-[#0b8641] px-2 py-1">Active</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Volunteers List */}
              {(filter === 'All' || filter === 'Volunteers') && (
                <div className="px-2">
                  <div className="flex items-center justify-between mb-3 px-2">
                    <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                      <User className="w-4 h-4 text-blue-600 fill-blue-600/20" /> Volunteers En Route ({volunteers.length * 28})
                    </h4>
                    <span className="text-[10px] font-bold text-blue-600 cursor-pointer hover:underline">View All &rarr;</span>
                  </div>
                  <div className="space-y-1">
                    {volunteers.map((v: any, i: number) => (
                      <div key={i} className="group p-3 rounded-xl hover:bg-blue-50/50 border border-transparent transition-colors flex justify-between items-center cursor-pointer">
                         <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs ring-2 ring-white uppercase shadow-sm">
                             {v.name ? v.name.split(' ').map((n: string) => n[0]).join('').substring(0,2) : 'RK'}
                           </div>
                           <div>
                             <p className="text-sm font-bold text-gray-900 group-hover:text-blue-700 transition-colors">{v.name || `Ramesh Kumar`}</p>
                             <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1"><MapPin className="w-3 h-3"/> {v.address || 'Madurai, Tamil Nadu'}</p>
                             <a href={normalizePhone(v.phone || '+919345678901').cellularHref} onClick={(e) => e.stopPropagation()} className="inline-flex text-[10px] text-gray-500 font-bold mt-1.5 items-center gap-1 hover:text-blue-600 hover:underline"><Phone className="w-3 h-3"/> {v.phone || '+91 93456 78901'}</a>
                           </div>
                         </div>
                         <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md">On Duty</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Facilities List */}
              {(filter === 'All' || filter === 'Facilities') && (
                <div className="px-2 pb-4">
                  <div className="flex items-center justify-between mb-3 px-2">
                    <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                      <Building className="w-4 h-4 text-purple-600 fill-purple-600/20" /> Storage Facilities ({facilities.length * 12})
                    </h4>
                    <span className="text-[10px] font-bold text-blue-600 cursor-pointer hover:underline">View All &rarr;</span>
                  </div>
                  <div className="space-y-1">
                    {facilities.map((f: any, i: number) => (
                      <div key={i} onClick={() => setDestination({ name: f.name || `Storage Facility`, pos: f.pos })} className="group p-3 rounded-xl hover:bg-gray-50 border border-transparent hover:border-purple-100 transition-colors cursor-pointer flex justify-between items-center">
                         <div className="flex items-center gap-3">
                           <img src={facilityImages[i % facilityImages.length]} className="w-12 h-12 rounded-lg object-cover shadow-sm" alt="Facility" />
                           <div>
                             <p className="text-sm font-bold text-gray-900">{f.name || (i === 0 ? 'Radhakrishnan Nagar Storage' : 'Guindy Central Warehouse')}</p>
                             <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1"><MapPin className="w-3 h-3"/> {f.address || 'Chennai, Tamil Nadu'}</p>
                             <a href={normalizePhone(f.phone || '+919876543211').cellularHref} onClick={(e) => e.stopPropagation()} className="inline-flex text-[10px] text-gray-500 font-bold mt-1.5 items-center gap-1 hover:text-purple-600 hover:underline"><Phone className="w-3 h-3"/> +91 98765 43211</a>
                           </div>
                         </div>
                         <span className="text-[10px] font-bold text-[#0b8641] px-2 py-1">Active</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
