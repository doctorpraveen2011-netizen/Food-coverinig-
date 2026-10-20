import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import { usePipelineStore } from '../../store/usePipelineStore';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom HTML Markers matching the requested rich design
const createRichIcon = (color: string, iconHtml: string) => {
  return new L.DivIcon({
    className: 'bg-transparent border-0',
    html: `
      <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
        <div style="position: absolute; bottom: -4px; width: 8px; height: 8px; background: rgba(0,0,0,0.3); border-radius: 50%; filter: blur(2px);"></div>
        <div style="
          background-color: ${color}; 
          width: 32px; height: 32px; 
          border-radius: 50% 50% 50% 0; 
          transform: rotate(-45deg); 
          display: flex; align-items: center; justify-content: center;
          border: 2px solid white;
          box-shadow: 0 4px 6px rgba(0,0,0,0.2);
        ">
          <div style="transform: rotate(45deg); color: white; display: flex; align-items: center; justify-content: center; font-size: 14px;">
            ${iconHtml}
          </div>
        </div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    tooltipAnchor: [16, -16]
  });
};

const createCheckpointIcon = (num: number) => {
  return new L.DivIcon({
    className: 'bg-transparent border-0',
    html: `
      <div style="
        background-color: #3B82F6; 
        color: white; 
        width: 18px; height: 18px; 
        border-radius: 50%; 
        display: flex; align-items: center; justify-content: center;
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        font-size: 10px; font-weight: bold;
      ">
        ${num}
      </div>
    `,
    iconSize: [18, 18],
    iconAnchor: [9, 9]
  });
};

const donorIcon = createRichIcon('#16A34A', '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>');
const volunteerIcon = createRichIcon('#3B82F6', '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>');
const facilityIcon = createRichIcon('#8B5CF6', '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><path d="M9 22v-4h6v4"></path><path d="M8 6h.01"></path><path d="M16 6h.01"></path><path d="M12 6h.01"></path><path d="M12 10h.01"></path><path d="M12 14h.01"></path><path d="M16 10h.01"></path><path d="M16 14h.01"></path><path d="M8 10h.01"></path><path d="M8 14h.01"></path></svg>');
const destinationIcon = createRichIcon('#DC2626', '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>');

export interface TrackingMapProps {
  donorPos?: [number, number];
  volunteerPos?: [number, number];
  facilityPos?: [number, number];
  destinationPos?: [number, number];
  donorName?: string;
  volunteerName?: string;
  facilityName?: string;
  destinationName?: string;
  routeColor?: string;
  zoom?: number;
}

// Helper component to update map view dynamically
function MapUpdater({ center, donor, dest }: { center: [number, number], donor: [number, number], dest: [number, number] }) {
  const map = useMap();
  const { mapAction, clearMapAction } = usePipelineStore();

  useEffect(() => {
    map.setView(center, 13, { animate: true });
  }, [center[0], center[1], map]);

  useEffect(() => {
    if (mapAction === 'recenter') {
      map.setView(center, 14, { animate: true });
      clearMapAction();
    } else if (mapAction === 'showFullRoute') {
      const bounds = L.latLngBounds([donor, dest]);
      map.fitBounds(bounds, { padding: [50, 50], animate: true });
      clearMapAction();
    }
  }, [mapAction, center, donor, dest, map, clearMapAction]);
  
  return null;
}

export default function TrackingMap(props: TrackingMapProps = {}) {
  const { tracking } = usePipelineStore();

  const donorPos: [number, number] = props.donorPos || tracking?.donorPos || [13.0827, 80.2707];
  const volunteerPos: [number, number] = props.volunteerPos || tracking?.volunteerPos || [13.0850, 80.2750];
  const facilityPos: [number, number] = props.facilityPos || tracking?.facilityPos || [13.0900, 80.2800];
  const destinationPos: [number, number] = props.destinationPos || tracking?.destinationPos || [13.0950, 80.2850];

  const donorLabel = props.donorName || 'Food Junction';
  const volunteerLabel = props.volunteerName || 'Karthik S';
  const facilityLabel = props.facilityName || 'NGO Distribution Center';
  const destinationLabel = props.destinationName || 'Anbu Illam';

  // Create a realistic-looking curved/segmented route instead of straight lines
  const routePositions: [number, number][] = [
    donorPos,
    [donorPos[0] + 0.001, donorPos[1] + 0.003],
    volunteerPos, // the live moving point
    [volunteerPos[0] + 0.002, volunteerPos[1] + 0.001],
    [facilityPos[0] - 0.001, facilityPos[1] - 0.002],
    facilityPos,
    [facilityPos[0] + 0.002, facilityPos[1] + 0.001],
    [destinationPos[0] - 0.001, destinationPos[1] - 0.003],
    destinationPos
  ];

  const tooltipClass = "bg-white border-0 shadow-lg rounded-xl px-3 py-1.5 font-bold text-gray-900";

  return (
    <div className="w-full h-full relative">
      <MapContainer 
        center={volunteerPos} 
        zoom={13} 
        style={{ height: '100%', width: '100%', borderRadius: '1rem' }}
        zoomControl={true}
        attributionControl={false}
      >
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}"
        />
        
        {/* Draw the main route line */}
        <Polyline positions={routePositions} color={props.routeColor || "#3B82F6"} weight={4} opacity={0.8} />

        {/* Checkpoints along the route to mimic the design */}
        <Marker position={[donorPos[0] + 0.0005, donorPos[1] + 0.0015]} icon={createCheckpointIcon(1)} />
        <Marker position={[volunteerPos[0] - 0.0005, volunteerPos[1] - 0.0015]} icon={createCheckpointIcon(2)} />
        <Marker position={[facilityPos[0] - 0.0005, facilityPos[1] - 0.001]} icon={createCheckpointIcon(3)} />
        <Marker position={[facilityPos[0] + 0.001, facilityPos[1] + 0.0005]} icon={createCheckpointIcon(4)} />
        <Marker position={[destinationPos[0] - 0.0005, destinationPos[1] - 0.0015]} icon={createCheckpointIcon(5)} />
        
        {/* Donor */}
        <Marker position={donorPos} icon={donorIcon}>
          <Tooltip direction="right" offset={[15, 0]} opacity={1} permanent className={tooltipClass}>
            <div className="flex flex-col">
              <span className="text-[9px] text-green-600 uppercase tracking-widest font-black">Donor</span>
              <span className="text-xs">{donorLabel} <span className="text-gray-400 font-medium">(Pickup)</span></span>
            </div>
          </Tooltip>
        </Marker>

        {/* Live Moving Volunteer */}
        <Marker position={volunteerPos} icon={volunteerIcon}>
          <Tooltip direction="top" offset={[0, -35]} opacity={1} permanent className={tooltipClass}>
            <div className="flex flex-col items-center">
              <span className="text-[9px] text-blue-600 uppercase tracking-widest font-black flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span> Volunteer
              </span>
              <span className="text-xs">{volunteerLabel}</span>
            </div>
          </Tooltip>
        </Marker>

        {/* Facility */}
        <Marker position={facilityPos} icon={facilityIcon}>
          <Tooltip direction="right" offset={[15, 0]} opacity={1} permanent className={tooltipClass}>
            <div className="flex flex-col">
              <span className="text-[9px] text-purple-600 uppercase tracking-widest font-black">Facility</span>
              <span className="text-xs">{facilityLabel}</span>
            </div>
          </Tooltip>
        </Marker>

        {/* Destination */}
        <Marker position={destinationPos} icon={destinationIcon}>
          <Tooltip direction="bottom" offset={[0, 15]} opacity={1} permanent className={tooltipClass}>
            <div className="flex flex-col">
              <span className="text-[9px] text-red-600 uppercase tracking-widest font-black">Recipient</span>
              <span className="text-xs">{destinationLabel}</span>
            </div>
          </Tooltip>
        </Marker>

        <MapUpdater center={volunteerPos} donor={donorPos} dest={destinationPos} />
      </MapContainer>
      
      {/* Absolute overlay for "Layers" button to perfectly match design */}
      <div className="absolute top-4 right-4 z-[400]">
        <button className="bg-white hover:bg-gray-50 text-gray-700 shadow-md rounded-lg px-3 py-2 text-xs font-bold flex items-center gap-2 border border-gray-100 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path></svg>
          Layers
          <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
        </button>
      </div>
    </div>
  );
}
