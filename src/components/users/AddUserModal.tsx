import React, { useState } from 'react';
import { 
  X, 
  UserPlus, 
  Users, 
  ShieldCheck, 
  Phone, 
  Mail, 
  MapPin, 
  CheckCircle2, 
  Package
} from 'lucide-react';
import type { VolunteerData, DonorData } from './UserDetailsDrawer';

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddVolunteer: (vol: VolunteerData) => void;
  onAddDonor: (donor: DonorData) => void;
  nextVolunteerId: string;
  nextDonorId: string;
}

export const AddUserModal: React.FC<AddUserModalProps> = ({
  isOpen,
  onClose,
  onAddVolunteer,
  onAddDonor,
  nextVolunteerId,
  nextDonorId
}) => {
  const [role, setRole] = useState<'volunteer' | 'donor'>('volunteer');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+91 ');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<string>('Available');
  const [city, setCity] = useState('Delhi');
  const [foodCategory, setFoodCategory] = useState('Fruits & Vegetables (20 kg)');
  const [assignedPickup, setAssignedPickup] = useState('');

  if (!isOpen) return null;

  const cityCoordinates: { [key: string]: [number, number] } = {
    'Delhi': [28.6139, 77.2090],
    'Mumbai': [19.0760, 72.8777],
    'Bangalore': [12.9716, 77.5946],
    'Chennai': [13.0827, 80.2707],
    'Kolkata': [22.5726, 88.3639],
    'Hyderabad': [17.3850, 78.4867]
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const [baseLat, baseLng] = cityCoordinates[city] || [28.6139, 77.2090];
    const lat = baseLat + (Math.random() - 0.5) * 0.05;
    const lng = baseLng + (Math.random() - 0.5) * 0.05;

    if (role === 'volunteer') {
      const newVol: VolunteerData = {
        id: nextVolunteerId,
        name: name.trim(),
        phone: phone.trim() || '+91 98000 00000',
        email: email.trim() || `${name.toLowerCase().replace(/\s+/g, '.')}@foodcovering.org`,
        status: status as any,
        lat,
        lng,
        assignedPickup: assignedPickup.trim() || '-',
        lastUpdated: 'Just now'
      };
      onAddVolunteer(newVol);
    } else {
      const newDonor: DonorData = {
        id: nextDonorId,
        name: name.trim(),
        phone: phone.trim() || '+91 99000 00000',
        email: email.trim() || `${name.toLowerCase().replace(/\s+/g, '.')}@donor.org`,
        foodCategory,
        status: (status === 'Available' ? 'Ready' : status) as any,
        lat,
        lng,
        pickupTime: 'Today 03:00 PM'
      };
      onAddDonor(newDonor);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-gray-100 transform transition-all animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-white border-b border-gray-100 text-gray-900 p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-600">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-gray-900">Add New User</h3>
              <p className="text-xs text-gray-500">Register new volunteer or active donor</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Role Switcher */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
              User Role
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setRole('volunteer');
                  setStatus('Available');
                }}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  role === 'volunteer'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/20'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Users className="w-4 h-4" /> Volunteer ({nextVolunteerId})
              </button>
              <button
                type="button"
                onClick={() => {
                  setRole('donor');
                  setStatus('Ready');
                }}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  role === 'donor'
                    ? 'bg-blue-50 border-blue-500 text-blue-800 ring-2 ring-blue-500/20'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <ShieldCheck className="w-4 h-4" /> Donor ({nextDonorId})
              </button>
            </div>
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
              {role === 'volunteer' ? 'Full Name' : 'Donor / Business Name'}
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={role === 'volunteer' ? 'e.g. Arjun Sharma' : 'e.g. Fresh Garden Foods'}
              className="w-full text-xs px-3.5 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          {/* Phone & Email */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Mobile Number
              </label>
              <div className="relative">
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full text-xs pl-8 pr-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-mono"
                />
                <Phone className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@email.com"
                  className="w-full text-xs pl-8 pr-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                />
                <Mail className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          </div>

          {/* City / Coordinates */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
              Base Region / City
            </label>
            <div className="relative">
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full text-xs pl-8 pr-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white font-medium"
              >
                <option value="Delhi">Delhi (28.6139, 77.2090)</option>
                <option value="Mumbai">Mumbai (19.0760, 72.8777)</option>
                <option value="Bangalore">Bangalore (12.9716, 77.5946)</option>
                <option value="Chennai">Chennai (13.0827, 80.2707)</option>
                <option value="Kolkata">Kolkata (22.5726, 88.3639)</option>
                <option value="Hyderabad">Hyderabad (17.3850, 78.4867)</option>
              </select>
              <MapPin className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* Role specific inputs */}
          {role === 'volunteer' ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full text-xs px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white font-medium"
                >
                  <option value="Available">Available</option>
                  <option value="En Route">En Route</option>
                  <option value="Assigned">Assigned</option>
                  <option value="Offline">Offline</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Assigned Pickup
                </label>
                <input
                  type="text"
                  value={assignedPickup}
                  onChange={(e) => setAssignedPickup(e.target.value)}
                  placeholder="e.g. D-3 (Optional)"
                  className="w-full text-xs px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Food Category & Quantity
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={foodCategory}
                  onChange={(e) => setFoodCategory(e.target.value)}
                  placeholder="e.g. Fruits & Vegetables (25 kg)"
                  className="w-full text-xs pl-8 pr-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                />
                <Package className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          )}

          {/* Submit Action */}
          <div className="pt-2 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#0b8641] hover:bg-green-800 text-white text-xs font-bold shadow-sm flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" /> Save {role === 'volunteer' ? 'Volunteer' : 'Donor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
