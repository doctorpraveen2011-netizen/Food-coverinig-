import React from 'react';
import { 
  X, 
  ShieldCheck, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Scale, 
  Package, 
  HeartHandshake, 
  CheckCircle2, 
  AlertCircle,
  Truck,
  User,
  BadgeCheck
} from 'lucide-react';

export interface DonationItem {
  id: string;
  food: string;
  qty: string;
  donor: string;
  phone?: string;
  email?: string;
  phoneVerified?: boolean;
  emailVerified?: boolean;
  verificationMethod?: string;
  verificationDate?: string;
  receiver?: string;
  region?: string;
  expiryDate?: string;
  description?: string;
  volunteer?: string;
  status: string;
  date?: string;
  eta?: string;
  statusColor?: string;
}

interface DonationDetailsModalProps {
  donation: DonationItem | null;
  isOpen: boolean;
  onClose: () => void;
  onVerifyContact: (type: 'phone' | 'email', targetValue: string, donorName: string) => void;
}

export const DonationDetailsModal: React.FC<DonationDetailsModalProps> = ({
  donation,
  isOpen,
  onClose,
  onVerifyContact
}) => {
  if (!isOpen || !donation) return null;

  const phone = donation.phone || '+91 98765 43210';
  const email = donation.email || 'donor@example.com';
  const isPhoneVerified = Boolean(donation.phoneVerified);
  const isEmailVerified = Boolean(donation.emailVerified);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-gray-100 transform transition-all animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-[#0b8641] text-white p-6 pb-6 relative shrink-0">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-wrap items-center justify-between gap-3 pr-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
                <HeartHandshake className="w-6 h-6 text-green-200" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-green-200 uppercase tracking-wider block">
                  Donation Record
                </span>
                <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  {donation.id}
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wide bg-white/20 text-white border border-white/30`}>
                    {donation.status}
                  </span>
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {(isPhoneVerified || isEmailVerified) ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-green-100 border border-green-300/30 text-xs font-semibold backdrop-blur-sm">
                  <BadgeCheck className="w-4 h-4 text-emerald-300" /> Verified Donor
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-200 border border-amber-300/30 text-xs font-semibold backdrop-blur-sm">
                  <AlertCircle className="w-4 h-4 text-amber-300" /> Pending Verification
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Donor Contact & Verification Card */}
          <div className="bg-gradient-to-br from-green-50/70 to-emerald-50/40 rounded-2xl p-5 border border-green-200/80 space-y-4">
            <div className="flex items-center justify-between border-b border-green-200/60 pb-3">
              <h3 className="text-xs font-bold text-green-900 uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#0b8641]" />
                Donor Contact & OTP Verification Details
              </h3>
              <span className="text-[11px] font-semibold text-green-800">
                {donation.donor}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Phone Verification Box */}
              <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-green-50 text-[#0b8641]">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-gray-400">Mobile Number</p>
                      <p className="text-xs font-bold text-gray-900 font-mono mt-0.5">{phone}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                  {isPhoneVerified ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5" /> OTP Verified
                    </span>
                  ) : (
                    <div className="flex items-center justify-between w-full">
                      <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        Unverified
                      </span>
                      <button
                        onClick={() => onVerifyContact('phone', phone, donation.donor)}
                        className="px-2.5 py-1 text-[11px] font-bold text-white bg-[#0b8641] hover:bg-green-800 rounded-lg shadow-sm transition-all"
                      >
                        Verify with OTP
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Email Verification Box */}
              <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-green-50 text-[#0b8641]">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-gray-400">Email Address</p>
                      <p className="text-xs font-bold text-gray-900 truncate max-w-[170px] mt-0.5">{email}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                  {isEmailVerified ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Email Verified
                    </span>
                  ) : (
                    <div className="flex items-center justify-between w-full">
                      <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        Unverified
                      </span>
                      <button
                        onClick={() => onVerifyContact('email', email, donation.donor)}
                        className="px-2.5 py-1 text-[11px] font-bold text-white bg-[#0b8641] hover:bg-green-800 rounded-lg shadow-sm transition-all"
                      >
                        Verify with OTP
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {donation.verificationMethod && (
              <div className="text-[11px] text-green-800 bg-white/80 p-2.5 rounded-xl border border-green-200 flex items-center justify-between">
                <span><strong>Authentication Method:</strong> {donation.verificationMethod}</span>
                {donation.verificationDate && <span className="text-green-700 font-mono text-[10px]">{donation.verificationDate}</span>}
              </div>
            )}
          </div>

          {/* Food Details Grid */}
          <div className="bg-gray-50/80 rounded-2xl p-5 border border-gray-200/80 space-y-4">
            <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-gray-200">
              <Package className="w-4 h-4 text-[#0b8641]" /> Food Surplus & Logistics
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-gray-400 block">Food Type</span>
                <p className="text-xs font-bold text-gray-900 mt-1 flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-green-600" /> {donation.food}
                </p>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-gray-400 block">Quantity</span>
                <p className="text-xs font-bold text-gray-900 mt-1 flex items-center gap-1.5">
                  <Scale className="w-3.5 h-3.5 text-blue-600" /> {donation.qty}
                </p>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-gray-400 block">Region</span>
                <p className="text-xs font-bold text-gray-900 mt-1 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-red-500" /> {donation.region || 'Chennai'}
                </p>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-gray-400 block">Expiry Date</span>
                <p className="text-xs font-bold text-gray-900 mt-1 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-amber-600" /> {donation.expiryDate || 'Within 48 hrs'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3 bg-white rounded-xl border border-gray-200">
                <span className="text-[10px] uppercase font-bold text-gray-400 block">Assigned Receiver</span>
                <p className="text-xs font-bold text-gray-900 mt-1 flex items-center gap-1.5">
                  <HeartHandshake className="w-3.5 h-3.5 text-[#0b8641]" /> {donation.receiver || 'NGO Partner'}
                </p>
              </div>

              <div className="p-3 bg-white rounded-xl border border-gray-200">
                <span className="text-[10px] uppercase font-bold text-gray-400 block">Volunteer</span>
                <p className="text-xs font-bold text-gray-900 mt-1 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-purple-600" /> {donation.volunteer || 'In Dispatch'}
                </p>
              </div>

              <div className="p-3 bg-white rounded-xl border border-gray-200">
                <span className="text-[10px] uppercase font-bold text-gray-400 block">Transit ETA</span>
                <p className="text-xs font-bold text-gray-900 mt-1 flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-orange-500" /> {donation.eta || '18 mins'}
                </p>
              </div>
            </div>

            {donation.description && (
              <div className="p-3 bg-white rounded-xl border border-gray-200">
                <span className="text-[10px] uppercase font-bold text-gray-400 block">Donor Remarks</span>
                <p className="text-xs text-gray-700 mt-1 leading-relaxed">{donation.description}</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/70 flex justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
