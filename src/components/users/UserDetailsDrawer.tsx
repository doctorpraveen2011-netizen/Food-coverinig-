import React, { useState } from 'react';
import { 
  X, 
  MapPin, 
  Phone, 
  Mail, 
  MessageSquare, 
  Clock, 
  CheckCircle2, 
  Activity, 
  History, 
  Navigation 
} from 'lucide-react';
import { normalizePhone } from '../../utils/phoneUtils';

export interface VolunteerData {
  id: string;
  name: string;
  phone: string;
  email?: string;
  status: 'En Route' | 'Available' | 'Assigned' | 'Offline';
  lat: number;
  lng: number;
  assignedPickup?: string;
  assignedDonorName?: string;
  lastUpdated: string;
  nextAvailable?: string;
}

export interface DonorData {
  id: string;
  name: string;
  phone: string;
  email: string;
  foodCategory: string;
  quantity?: string;
  status: 'Ready' | 'Assigned' | 'Pending' | 'Completed';
  lat: number;
  lng: number;
  pickupTime: string;
  address?: string;
}

interface UserDetailsDrawerProps {
  volunteer?: VolunteerData | null;
  donor?: DonorData | null;
  isOpen: boolean;
  onClose: () => void;
  onViewMap?: (lat: number, lng: number) => void;
}

export const UserDetailsDrawer: React.FC<UserDetailsDrawerProps> = ({
  volunteer,
  donor,
  isOpen,
  onClose,
  onViewMap
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'assignments' | 'location' | 'history'>('overview');

  if (!isOpen || (!volunteer && !donor)) return null;

  const isVolunteer = Boolean(volunteer);
  const name = volunteer ? volunteer.name : donor!.name;
  const id = volunteer ? volunteer.id : donor!.id;
  const phone = volunteer ? volunteer.phone : donor!.phone;
  const email = volunteer ? volunteer.email || `${name.toLowerCase().replace(/\s+/g, '.')}@foodcovering.org` : donor!.email;
  const status = volunteer ? volunteer.status : donor!.status;
  const lat = volunteer ? volunteer.lat : donor!.lat;
  const lng = volunteer ? volunteer.lng : donor!.lng;

  // Initials for avatar
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const getStatusBadgeClass = (s: string) => {
    switch (s) {
      case 'En Route':
      case 'Ready':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Available':
      case 'Completed':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Assigned':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Pending':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusDotColor = (s: string) => {
    switch (s) {
      case 'En Route':
      case 'Ready':
        return 'bg-emerald-500';
      case 'Available':
      case 'Completed':
        return 'bg-blue-500';
      case 'Assigned':
        return 'bg-purple-500';
      case 'Pending':
        return 'bg-amber-500';
      default:
        return 'bg-gray-400';
    }
  };

  return (
    <div className="w-full lg:w-[350px] shrink-0 bg-white border border-gray-200/90 rounded-2xl shadow-sm flex flex-col overflow-hidden animate-in fade-in duration-200">
      {/* Header bar */}
      <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white">
        <h3 className="font-bold text-sm text-gray-900">
          {isVolunteer ? 'Volunteer Details' : 'Donor Details'}
        </h3>
        <button
          onClick={onClose}
          className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          title="Close profile drawer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Profile Overview Card */}
      <div className="p-5 border-b border-gray-100 flex items-start gap-4 bg-white">
        <div className="w-14 h-14 rounded-full bg-blue-100 border border-blue-200 text-blue-700 font-bold text-lg flex items-center justify-center shrink-0 shadow-2xs">
          {initials}
        </div>
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-bold text-base text-gray-900 truncate">{name}</h4>
          </div>
          <div>
            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${getStatusBadgeClass(status)}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${getStatusDotColor(status)}`}></span>
              {status}
            </span>
          </div>
          <p className="text-[11px] text-gray-500 font-medium">
            {isVolunteer ? `Volunteer ID: ${id}` : `Donor ID: ${id}`}
          </p>
          <p className="text-[11px] text-gray-600 font-mono">
            Phone: <span className="text-gray-900 font-semibold">{phone}</span>
          </p>
          <p className="text-[11px] text-gray-600 truncate">
            Email: <span className="text-gray-900 font-semibold">{email}</span>
          </p>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-gray-100 text-xs font-semibold px-4 bg-white">
        <button
          onClick={() => setActiveTab('overview')}
          className={`py-3 px-2 border-b-2 transition-colors ${
            activeTab === 'overview'
              ? 'border-emerald-600 text-emerald-800 font-bold'
              : 'border-transparent text-gray-400 hover:text-gray-700'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('assignments')}
          className={`py-3 px-2 border-b-2 transition-colors ${
            activeTab === 'assignments'
              ? 'border-emerald-600 text-emerald-800 font-bold'
              : 'border-transparent text-gray-400 hover:text-gray-700'
          }`}
        >
          {isVolunteer ? 'Assignments' : 'Donations'}
        </button>
        <button
          onClick={() => setActiveTab('location')}
          className={`py-3 px-2 border-b-2 transition-colors ${
            activeTab === 'location'
              ? 'border-emerald-600 text-emerald-800 font-bold'
              : 'border-transparent text-gray-400 hover:text-gray-700'
          }`}
        >
          Location
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`py-3 px-2 border-b-2 transition-colors ${
            activeTab === 'history'
              ? 'border-emerald-600 text-emerald-800 font-bold'
              : 'border-transparent text-gray-400 hover:text-gray-700'
          }`}
        >
          History
        </button>
      </div>

      {/* Scrollable Tab Content */}
      <div className="p-4 space-y-4 overflow-y-auto flex-1">
        {activeTab === 'overview' && (
          <>
            {/* Current Status Box */}
            <div className="bg-white rounded-xl p-3.5 border border-gray-200/80 shadow-2xs space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800 uppercase tracking-wider">
                <Activity className="w-3.5 h-3.5 text-emerald-600" />
                <span>Current Status</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStatusBadgeClass(status)}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${getStatusDotColor(status)}`}></span>
                  {status}
                </span>
              </div>
              {isVolunteer ? (
                <div className="text-xs text-gray-600 space-y-0.5">
                  <p>
                    <span className="text-gray-400 font-medium">Assigned Pickup: </span>
                    <strong className="text-gray-900">
                      {volunteer?.assignedPickup || 'None'} {volunteer?.assignedDonorName ? `(${volunteer.assignedDonorName})` : ''}
                    </strong>
                  </p>
                  <p className="text-[11px] text-gray-400">
                    Last Updated: {volunteer?.lastUpdated || 'Just now'}
                  </p>
                </div>
              ) : (
                <div className="text-xs text-gray-600 space-y-0.5">
                  <p>
                    <span className="text-gray-400 font-medium">Category: </span>
                    <strong className="text-gray-900">{donor?.foodCategory}</strong>
                  </p>
                  <p className="text-[11px] text-gray-400">
                    Pickup Window: {donor?.pickupTime}
                  </p>
                </div>
              )}
            </div>

            {/* Current Location Box with Map Preview */}
            <div className="bg-white rounded-xl p-3.5 border border-gray-200/80 shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800 uppercase tracking-wider">
                  <MapPin className="w-3.5 h-3.5 text-blue-600" />
                  <span>Current Location</span>
                </div>
                <button
                  type="button"
                  onClick={() => onViewMap && onViewMap(lat, lng)}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-900 hover:underline"
                >
                  <Navigation className="w-3 h-3" /> View on Map
                </button>
              </div>

              <p className="text-xs font-mono font-bold text-gray-700 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                {lat.toFixed(4)}, {lng.toFixed(4)}
              </p>

              {/* Graphical Mini Map Visual Preview */}
              <div className="relative h-24 rounded-xl overflow-hidden border border-gray-200 bg-[#E8ECEF] flex items-center justify-center">
                {/* Simulated Street Grid Lines */}
                <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#94A3B8_1px,transparent_1px)] [background-size:16px_16px]"></div>
                <div className="absolute top-1/2 left-0 right-0 h-2 bg-white/70 -translate-y-1/2"></div>
                <div className="absolute top-0 bottom-0 left-1/3 w-2 bg-white/70"></div>
                <div className="absolute top-0 bottom-0 right-1/4 w-1.5 bg-yellow-200/90"></div>
                <div className="absolute top-2/3 left-0 right-0 h-1.5 bg-yellow-200/90"></div>
                
                {/* Location Marker */}
                <div className="relative z-10 flex flex-col items-center">
                  <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-lg ring-4 ring-emerald-400/30 animate-pulse">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <span className="bg-white/95 text-[10px] font-bold text-gray-800 px-1.5 py-0.5 rounded shadow-xs mt-0.5 border border-gray-200">
                    {name.split(' ')[0]}
                  </span>
                </div>
              </div>
            </div>

            {/* Availability Box */}
            <div className="bg-white rounded-xl p-3.5 border border-gray-200/80 shadow-2xs space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800 uppercase tracking-wider">
                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                <span>Availability</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 text-[11px]">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Available
                </span>
                <span className="text-[11px] text-gray-500 font-medium">
                  {volunteer?.nextAvailable ? `Next available: ${volunteer.nextAvailable}` : 'Online on system'}
                </span>
              </div>
            </div>

            {/* Contact Action Buttons */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                Contact Actions
              </span>
              <div className="grid grid-cols-3 gap-2">
                <a
                  href={normalizePhone(phone).cellularHref}
                  className="bg-[#059669] hover:bg-emerald-700 text-white font-bold text-xs py-2.5 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
                  title="Direct Cellular Call"
                >
                  <Phone className="w-3.5 h-3.5" /> Call
                </a>
                <a
                  href={normalizePhone(phone, {
                    contactName: name,
                    role: isVolunteer ? 'Volunteer Driver' : 'Donor / Citizen',
                    context: 'user-support'
                  }).whatsappCallHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold text-xs py-2.5 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
                  title="WhatsApp Call / Chat"
                >
                  <Phone className="w-3.5 h-3.5 fill-current" /> WhatsApp
                </a>
                <a
                  href={`mailto:${email}`}
                  className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 font-bold text-xs py-2.5 rounded-xl transition-colors flex items-center justify-center gap-1.5"
                >
                  <Mail className="w-3.5 h-3.5 text-gray-500" /> Email
                </a>
              </div>
            </div>

            {/* Assignment History Box */}
            <div className="bg-gray-50/70 rounded-xl p-3.5 border border-gray-200/70 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800">
                <History className="w-3.5 h-3.5 text-gray-500" />
                <span>Assignment History</span>
              </div>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                View past assignments, completed pickups and performance records.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('history')}
                className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 hover:underline flex items-center gap-1 pt-0.5"
              >
                <span>View Full History</span>
                <span>→</span>
              </button>
            </div>
          </>
        )}

        {/* TAB 2: ASSIGNMENTS / DONATIONS */}
        {activeTab === 'assignments' && (
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
              {isVolunteer ? 'Active & Past Assignments' : 'Donation Registry'}
            </h4>
            <div className="space-y-2 text-xs">
              <div className="p-3 bg-white rounded-xl border border-gray-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-900">{isVolunteer ? 'DC-00326 • Bakery' : '30 kg Fresh Bread'}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700">En Route</span>
                </div>
                <p className="text-[11px] text-gray-500">Destination: Chennai Community Center</p>
                <p className="text-[10px] text-gray-400">Assigned: 28 Sep 2026, 10:30 AM</p>
              </div>

              <div className="p-3 bg-white rounded-xl border border-gray-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-900">{isVolunteer ? 'DC-00324 • Dairy' : '17 kg Chilled Milk'}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700">Completed</span>
                </div>
                <p className="text-[11px] text-gray-500">Destination: Coimbatore Distribution Hub</p>
                <p className="text-[10px] text-gray-400">Delivered: 27 Sep 2026, 04:15 PM</p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: LOCATION */}
        {activeTab === 'location' && (
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">GPS Telemetry</h4>
            <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 text-xs space-y-2 font-mono">
              <div className="flex justify-between">
                <span className="text-gray-500">Latitude:</span>
                <span className="font-bold text-gray-900">{lat}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Longitude:</span>
                <span className="font-bold text-gray-900">{lng}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Accuracy:</span>
                <span className="text-emerald-700 font-bold">± 4.2 meters</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Telemetry Rate:</span>
                <span className="text-blue-700 font-bold">1 sec live ping</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: HISTORY */}
        {activeTab === 'history' && (
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Activity Timeline</h4>
            <div className="relative pl-5 border-l-2 border-emerald-200 space-y-4 text-xs">
              <div className="relative">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-600 absolute -left-[26px] top-1"></div>
                <p className="font-bold text-gray-900">En Route to Destination</p>
                <p className="text-[11px] text-gray-500">Departed pickup facility • 2 mins ago</p>
              </div>
              <div className="relative">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-600 absolute -left-[26px] top-1"></div>
                <p className="font-bold text-gray-900">Pickup Confirmed & Weighed</p>
                <p className="text-[11px] text-gray-500">Logged 25 kg vegetables • 18 mins ago</p>
              </div>
              <div className="relative">
                <div className="w-2.5 h-2.5 rounded-full bg-gray-400 absolute -left-[26px] top-1"></div>
                <p className="font-bold text-gray-900">Duty Checked-In</p>
                <p className="text-[11px] text-gray-500">Started active shift • 1 hour ago</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
