import { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Package, 
  Leaf, 
  Utensils, 
  Clock, 
  CheckCircle, 
  Truck, 
  MapPin, 
  Calendar, 
  FileText, 
  Scale, 
  ShoppingBag, 
  HeartHandshake, 
  Phone, 
  Mail, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle,
  Sparkles,
  KeyRound,
  Eye,
  User
} from 'lucide-react';
import { usePipelineStore } from '../store/usePipelineStore';
import { DonationOtpModal } from '../components/donations/DonationOtpModal';
import { DonationDetailsModal, type DonationItem } from '../components/donations/DonationDetailsModal';

export default function Donations() {
  const { tables, connect, kpi } = usePipelineStore();

  // Form State with Mobile, Email, and Verification fields
  const [formData, setFormData] = useState({ 
    food: '', 
    qty: '', 
    donor: 'Live Donor', 
    phone: '+91 98765 43210',
    email: 'donor@example.com',
    phoneVerified: false,
    emailVerified: false,
    receiver: 'Community Center', 
    region: 'Chennai', 
    date: '', 
    desc: '' 
  });

  // OTP Modal State
  const [isOtpOpen, setIsOtpOpen] = useState(false);
  const [otpTarget, setOtpTarget] = useState({ target: '', type: 'phone' as 'phone' | 'email', donorName: '' });

  // Detail Modal State
  const [selectedDonation, setSelectedDonation] = useState<DonationItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Unverified Warning Prompt State
  const [showUnverifiedPrompt, setShowUnverifiedPrompt] = useState(false);

  // Success Feedback Banner
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    connect();
  }, [connect]);

  // Combine live socket donations with default rich list
  const defaultDonations: DonationItem[] = [
    { 
      id: 'DC-00326', 
      food: 'Bakery', 
      qty: '30 kg', 
      donor: 'Live Donor', 
      phone: '+91 98765 43210',
      email: 'donor@example.com',
      phoneVerified: true,
      emailVerified: true,
      verificationMethod: 'SMS & Email OTP',
      verificationDate: '28 Sep 2026 10:30 AM',
      receiver: 'NGO Partner', 
      region: 'Chennai', 
      expiryDate: '2026-09-30',
      description: 'Fresh bakery items and assorted bread',
      volunteer: 'Arjun Sharma',
      status: 'In Transit', 
      eta: '18 mins',
      statusColor: 'bg-orange-100 text-orange-700' 
    },
    { 
      id: 'DC-00325', 
      food: 'Bakery', 
      qty: '24 kg', 
      donor: 'Community Center', 
      phone: '+91 98111 22334',
      email: 'community@center.org',
      phoneVerified: true,
      emailVerified: false,
      verificationMethod: 'SMS OTP',
      verificationDate: '28 Sep 2026 09:15 AM',
      receiver: 'NGO Partner', 
      region: 'Coimbatore', 
      expiryDate: '2026-10-01',
      description: 'Whole wheat bread packages',
      volunteer: 'Priya Patel',
      status: 'In Transit', 
      eta: '25 mins',
      statusColor: 'bg-orange-100 text-orange-700' 
    },
    { 
      id: 'DC-00324', 
      food: 'Dairy', 
      qty: '17 kg', 
      donor: 'Live Donor', 
      phone: '+91 98222 33445',
      email: 'contact@freshmart.in',
      phoneVerified: true,
      emailVerified: true,
      verificationMethod: 'Email OTP',
      verificationDate: '28 Sep 2026 08:45 AM',
      receiver: 'NGO Partner', 
      region: 'Coimbatore', 
      expiryDate: '2026-09-29',
      description: 'Chilled milk containers',
      volunteer: 'Rahul Reddy',
      status: 'Picked Up', 
      eta: '32 mins',
      statusColor: 'bg-amber-100 text-amber-700' 
    },
    { 
      id: 'DC-00323', 
      food: 'Bakery', 
      qty: '39 kg', 
      donor: 'Community Center', 
      phone: '+91 98333 44556',
      email: 'sales@localbakery.com',
      phoneVerified: false,
      emailVerified: false,
      receiver: 'NGO Partner', 
      region: 'Coimbatore', 
      expiryDate: '2026-09-30',
      description: 'Surplus buns and tea cakes',
      volunteer: 'Anjali Das',
      status: 'In Transit', 
      eta: '45 mins',
      statusColor: 'bg-orange-100 text-orange-700' 
    },
    { 
      id: 'DC-00322', 
      food: 'Grains', 
      qty: '61 kg', 
      donor: 'Live Donor', 
      phone: '+91 98444 55667',
      email: 'info@greenbasket.org',
      phoneVerified: true,
      emailVerified: true,
      verificationMethod: 'SMS & Email OTP',
      verificationDate: '27 Sep 2026 04:20 PM',
      receiver: 'NGO Partner', 
      region: 'Trichy', 
      expiryDate: '2026-11-15',
      description: 'Rice and wheat bags',
      volunteer: 'Karthik Iyer',
      status: 'In Transit', 
      eta: '1 hr',
      statusColor: 'bg-orange-100 text-orange-700' 
    },
    { 
      id: 'DC-00321', 
      food: 'Dairy', 
      qty: '60 kg', 
      donor: 'Community Center', 
      phone: '+91 98555 66778',
      email: 'chennai.care@reach.org',
      phoneVerified: true,
      emailVerified: false,
      verificationMethod: 'SMS OTP',
      verificationDate: '27 Sep 2026 02:10 PM',
      receiver: 'NGO Partner', 
      region: 'Chennai', 
      expiryDate: '2026-09-29',
      description: 'Paneer and curd packages',
      volunteer: 'Sneha Rao',
      status: 'Picked Up', 
      eta: '40 mins',
      statusColor: 'bg-amber-100 text-amber-700' 
    },
    { 
      id: 'DC-00320', 
      food: 'Grains', 
      qty: '51 kg', 
      donor: 'City Market', 
      phone: '+91 98666 77889',
      email: 'citymarket@delhi.gov',
      phoneVerified: true,
      emailVerified: true,
      verificationMethod: 'Full Verification',
      verificationDate: '27 Sep 2026 11:00 AM',
      receiver: 'NGO Partner', 
      region: 'Coimbatore', 
      expiryDate: '2026-12-01',
      description: 'Wheat flour packages',
      volunteer: 'Amit Desai',
      status: 'In Transit', 
      eta: '55 mins',
      statusColor: 'bg-orange-100 text-orange-700' 
    },
    { 
      id: 'DC-00319', 
      food: 'Mixed Items', 
      qty: '60 kg', 
      donor: 'City Market', 
      phone: '+91 98777 88990',
      email: 'support@citymarket.in',
      phoneVerified: true,
      emailVerified: true,
      verificationMethod: 'SMS OTP',
      verificationDate: '26 Sep 2026 03:40 PM',
      receiver: 'NGO Partner', 
      region: 'Chennai', 
      expiryDate: '2026-10-05',
      description: 'Dry packaged foods and assorted fruits',
      volunteer: 'Pooja Joshi',
      status: 'Assigned', 
      eta: '2 hrs',
      statusColor: 'bg-orange-100 text-orange-700' 
    }
  ];

  const donations: DonationItem[] = tables.recentDonations.length > 0 
    ? tables.recentDonations.map((d: any, idx: number) => {
        const fallback = defaultDonations[idx % defaultDonations.length];
        return {
          id: d.id,
          food: d.food,
          qty: d.qty || fallback.qty,
          donor: d.donor,
          phone: d.phone || fallback.phone,
          email: d.email || fallback.email,
          phoneVerified: d.phoneVerified !== undefined ? d.phoneVerified : fallback.phoneVerified,
          emailVerified: d.emailVerified !== undefined ? d.emailVerified : fallback.emailVerified,
          verificationMethod: d.verificationMethod || fallback.verificationMethod,
          verificationDate: d.verificationDate || fallback.verificationDate,
          receiver: d.receiver || fallback.receiver,
          region: d.region || fallback.region,
          expiryDate: d.expiryDate || fallback.expiryDate,
          description: d.description || fallback.description,
          volunteer: d.volunteer || fallback.volunteer,
          status: d.status || fallback.status,
          eta: d.eta || fallback.eta,
          statusColor: d.statusColor || fallback.statusColor
        };
      })
    : defaultDonations;

  // Filtered donations list
  const filteredDonations = useMemo(() => {
    return donations.filter((d) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = 
        !searchQuery ||
        d.id.toLowerCase().includes(q) ||
        d.food.toLowerCase().includes(q) ||
        d.donor.toLowerCase().includes(q) ||
        (d.receiver && d.receiver.toLowerCase().includes(q)) ||
        (d.region && d.region.toLowerCase().includes(q)) ||
        (d.phone && d.phone.toLowerCase().includes(q)) ||
        (d.email && d.email.toLowerCase().includes(q));

      const matchesStatus = statusFilter === 'All' || d.status.toLowerCase() === statusFilter.toLowerCase();
      return matchesSearch && matchesStatus;
    });
  }, [donations, searchQuery, statusFilter]);

  // Open OTP Modal for Phone
  const handleOpenPhoneOtp = () => {
    if (!formData.phone.trim()) {
      alert('Please enter a mobile number first.');
      return;
    }
    setOtpTarget({ target: formData.phone, type: 'phone', donorName: formData.donor || 'Valued Donor' });
    setIsOtpOpen(true);
  };

  // Open OTP Modal for Email
  const handleOpenEmailOtp = () => {
    if (!formData.email.trim()) {
      alert('Please enter an email address first.');
      return;
    }
    setOtpTarget({ target: formData.email, type: 'email', donorName: formData.donor || 'Valued Donor' });
    setIsOtpOpen(true);
  };

  // Callback when OTP verification succeeds
  const handleVerifiedCallback = (type: 'phone' | 'email', _target: string, method?: string) => {
    if (type === 'phone') {
      setFormData((prev) => ({ ...prev, phoneVerified: true }));
      setSuccessBanner(`Mobile number successfully verified${method ? ` via ${method}` : ' via OTP'}!`);
    } else {
      setFormData((prev) => ({ ...prev, emailVerified: true }));
      setSuccessBanner(`Email address successfully verified${method ? ` via ${method}` : ' via OTP'}!`);
    }
    setTimeout(() => setSuccessBanner(null), 4000);
  };

  // Execute donation submission
  const executeDonationSubmission = async () => {
    try {
      const backendUrl = window.location.hostname === 'localhost' ? 'http://localhost:5000' : `http://${window.location.hostname}:5000`;
      const response = await fetch(`${backendUrl}/api/v1/donations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          food: formData.food,
          qty: formData.qty,
          donor: formData.donor,
          phone: formData.phone,
          email: formData.email,
          phoneVerified: formData.phoneVerified,
          emailVerified: formData.emailVerified,
          receiver: formData.receiver,
          region: formData.region,
          expiryDate: formData.date,
          desc: formData.desc
        })
      });

      if (response.ok) {
        setSuccessBanner(`Donation registered successfully! ${formData.phoneVerified || formData.emailVerified ? 'Authenticated with OTP verification.' : ''}`);
        setTimeout(() => setSuccessBanner(null), 5000);
        setFormData({ 
          food: '', 
          qty: '', 
          donor: 'Live Donor', 
          phone: '+91 98765 43210',
          email: 'donor@example.com',
          phoneVerified: false,
          emailVerified: false,
          receiver: 'Community Center', 
          region: 'Chennai', 
          date: '', 
          desc: '' 
        });
      }
    } catch (err) {
      console.error('Submission error:', err);
    }
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.food || !formData.qty) {
      alert('Please select a food type and enter the quantity.');
      return;
    }

    // Check if both contacts are unverified
    if (!formData.phoneVerified && !formData.emailVerified) {
      setShowUnverifiedPrompt(true);
      return;
    }

    await executeDonationSubmission();
  };

  // Detail Modal trigger
  const handleViewDetails = (donation: DonationItem) => {
    setSelectedDonation(donation);
    setIsDetailOpen(true);
  };

  // OTP Verification triggered from within Donation Details Modal
  const handleVerifyFromDetailModal = (type: 'phone' | 'email', targetValue: string, donorName: string) => {
    setOtpTarget({ target: targetValue, type, donorName });
    setIsOtpOpen(true);
  };

  const getFoodIcon = (foodType: string) => {
    const f = foodType.toLowerCase();
    if (f.includes('bakery') || f.includes('bread')) return '🥐';
    if (f.includes('produce') || f.includes('fruit') || f.includes('veg')) return '🍅';
    if (f.includes('dairy') || f.includes('milk')) return '🥛';
    if (f.includes('grain') || f.includes('rice') || f.includes('wheat')) return '🌾';
    return '📦';
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Notification Banner */}
      {successBanner && (
        <div className="bg-emerald-600 text-white px-5 py-3.5 rounded-2xl shadow-lg flex items-center justify-between animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-2.5 text-sm font-semibold">
            <CheckCircle2 className="w-5 h-5 text-emerald-200" />
            <span>{successBanner}</span>
          </div>
          <button onClick={() => setSuccessBanner(null)} className="text-emerald-200 hover:text-white text-xs font-bold uppercase tracking-wider">
            Dismiss
          </button>
        </div>
      )}

      {/* Top Banner Row */}
      <div className="flex flex-col xl:flex-row gap-6">
        <div className="flex-shrink-0 flex items-center xl:w-1/4">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-3 rounded-xl">
              <HeartHandshake className="w-8 h-8 text-green-700" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Donations</h1>
              <p className="text-sm text-gray-500 font-medium mt-0.5">Share surplus food. Nourish communities.</p>
            </div>
          </div>
        </div>

        <div className="flex-1 bg-gradient-to-r from-green-50 to-[#eef9f2] rounded-2xl p-5 border border-green-100 flex items-center justify-between shadow-sm relative overflow-hidden">
          <div className="flex items-center gap-6 relative z-10">
            <div className="hidden md:flex bg-white/60 p-4 rounded-xl shadow-sm border border-white">
              <Package className="w-10 h-10 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-green-900">Your donation <br className="hidden md:block"/>can make a real difference</h2>
              <p className="text-sm text-green-700 mt-2 max-w-md leading-relaxed hidden sm:block">
                Good food shouldn't go to waste. Connect surplus food with local communities through verified donor coordination.
              </p>
              <div className="flex items-center gap-4 mt-3 text-xs font-semibold text-green-800">
                <span className="flex items-center gap-1"><Leaf className="w-3 h-3"/> Save Food</span>
                <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-green-600"/> OTP Verified Security</span>
                <span className="flex items-center gap-1"><HeartHandshake className="w-3 h-3"/> Support Communities</span>
              </div>
            </div>
          </div>
          <div className="relative z-10 flex-shrink-0 ml-4">
            <button 
              onClick={() => document.getElementById('donation-form')?.focus()} 
              className="bg-[#0b8641] hover:bg-green-800 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-md hover:shadow-lg flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Donate Food
            </button>
          </div>
          {/* Decorative background circle */}
          <div className="absolute -right-12 -bottom-24 w-64 h-64 bg-green-200/40 rounded-full blur-3xl mix-blend-multiply"></div>
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div className="bg-green-100 p-2.5 rounded-lg"><Utensils className="w-5 h-5 text-green-600" /></div>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-bold text-gray-900">{kpi.totalDonations || 326}</p>
            <p className="text-sm font-medium text-gray-500 mt-1">Total Donations</p>
            <p className="text-xs font-semibold text-green-600 mt-2 flex items-center gap-1">↑ 12%</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div className="bg-blue-50 p-2.5 rounded-lg"><Clock className="w-5 h-5 text-blue-500" /></div>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-bold text-gray-900">12</p>
            <p className="text-sm font-medium text-gray-500 mt-1">Pending</p>
            <p className="text-xs font-semibold text-blue-500 mt-2 flex items-center gap-1">↓ 3%</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div className="bg-emerald-50 p-2.5 rounded-lg"><CheckCircle className="w-5 h-5 text-emerald-500" /></div>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-bold text-gray-900">45</p>
            <p className="text-sm font-medium text-gray-500 mt-1">Matched</p>
            <p className="text-xs font-semibold text-emerald-600 mt-2 flex items-center gap-1">↑ 18%</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div className="bg-purple-50 p-2.5 rounded-lg"><Truck className="w-5 h-5 text-purple-500" /></div>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-bold text-gray-900">24</p>
            <p className="text-sm font-medium text-gray-500 mt-1">In Transit</p>
            <p className="text-xs font-semibold text-purple-600 mt-2 flex items-center gap-1">↑ 8%</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div className="bg-green-50 p-2.5 rounded-lg"><CheckCircle className="w-5 h-5 text-green-600" /></div>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-bold text-gray-900">167</p>
            <p className="text-sm font-medium text-gray-500 mt-1">Completed</p>
            <p className="text-xs font-semibold text-green-600 mt-2 flex items-center gap-1">↑ 21%</p>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Recent Donations Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-white">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-green-50 rounded-lg">
                <Package className="w-5 h-5 text-[#0b8641]" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Recent Donations</h3>
                <span className="text-[11px] text-gray-400 font-medium">Real-time surplus food logistics with OTP authenticated donors</span>
              </div>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative w-full sm:w-60">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search donations, phone..."
                  className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
                />
              </div>
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="appearance-none flex items-center gap-2 pl-3 pr-8 py-2 border border-gray-200 rounded-xl text-xs font-medium text-gray-600 bg-white hover:bg-gray-50 transition-colors cursor-pointer outline-none"
                >
                  <option value="All">All Statuses</option>
                  <option value="In Transit">In Transit</option>
                  <option value="Picked Up">Picked Up</option>
                  <option value="Assigned">Assigned</option>
                  <option value="Completed">Completed</option>
                </select>
                <Filter className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider bg-gray-50/50 border-b border-gray-100">
                <tr>
                  <th className="px-5 py-4">ID</th>
                  <th className="px-5 py-4">Food Type</th>
                  <th className="px-5 py-4">Quantity</th>
                  <th className="px-5 py-4">Donor & Verification</th>
                  <th className="px-5 py-4">Receiver</th>
                  <th className="px-5 py-4">Region</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredDonations.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-gray-400 text-xs font-medium">
                      No donations match your filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredDonations.map((d: DonationItem) => {
                    const isVerified = d.phoneVerified || d.emailVerified;
                    return (
                      <tr key={d.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="px-5 py-4 font-semibold text-gray-800">{d.id}</td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{getFoodIcon(d.food)}</span>
                            <span className="font-medium text-gray-700">{d.food}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 font-medium text-gray-600">{d.qty}</td>
                        <td className="px-5 py-4">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className="font-medium text-gray-800">{d.donor}</span>
                              {isVerified ? (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 text-[10px] font-bold text-emerald-700 bg-emerald-50 rounded border border-emerald-200" title="Donor contact authenticated via OTP">
                                  <ShieldCheck className="w-3 h-3 text-emerald-600" /> Verified
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 text-[10px] font-medium text-amber-700 bg-amber-50 rounded border border-amber-200">
                                  Unverified
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-gray-400 font-mono">
                              {d.phone || '+91 98765 43210'}
                            </p>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-gray-600">{d.receiver || 'NGO Partner'}</td>
                        <td className="px-5 py-4 text-gray-600">{d.region || 'Chennai'}</td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide ${d.statusColor || 'bg-gray-100 text-gray-700'}`}>
                            {d.status}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button 
                            onClick={() => handleViewDetails(d)}
                            className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-900 font-semibold text-xs tracking-wide bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors border border-emerald-200/70"
                          >
                            <Eye className="w-3.5 h-3.5" /> View
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          
          <div className="p-4 border-t border-gray-100 flex justify-between items-center bg-gray-50/50">
            <span className="text-xs text-gray-500 font-medium">
              Showing 1–{filteredDonations.length} of {kpi.totalDonations || 326} donations
            </span>
            <div className="flex items-center gap-1">
              <button className="px-3 py-1 text-sm border border-gray-200 rounded-md bg-white text-gray-400 hover:bg-gray-50">&lt;</button>
              <button className="px-3 py-1 text-sm border border-[#0b8641] rounded-md bg-[#0b8641] text-white font-medium">1</button>
              <button className="px-3 py-1 text-sm border border-gray-200 rounded-md bg-white text-gray-600 hover:bg-gray-50 font-medium">2</button>
              <button className="px-3 py-1 text-sm border border-gray-200 rounded-md bg-white text-gray-600 hover:bg-gray-50 font-medium">3</button>
              <span className="px-2 text-gray-400">...</span>
              <button className="px-3 py-1 text-sm border border-gray-200 rounded-md bg-white text-gray-600 hover:bg-gray-50 font-medium">78</button>
              <button className="px-3 py-1 text-sm border border-gray-200 rounded-md bg-white text-gray-600 hover:bg-gray-50">&gt;</button>
            </div>
          </div>
        </div>

        {/* Right Column: Make a Donation Form & Impact */}
        <div className="space-y-6">
          {/* Make a Donation Form */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <div className="bg-green-100 p-1.5 rounded-full"><Plus className="w-4 h-4 text-[#0b8641]" /></div>
                <h3 className="font-bold text-gray-900 text-lg">Make a Donation</h3>
              </div>
              <span className="text-[10px] font-bold text-[#0b8641] bg-green-50 px-2 py-0.5 rounded-full border border-green-200 uppercase tracking-wider flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> OTP Protected
              </span>
            </div>
            <p className="text-xs text-gray-500 mb-5 font-medium">
              Donate surplus food to support communities in need with verified donor authentication.
            </p>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Food Type */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                  <ShoppingBag className="w-3.5 h-3.5 text-gray-500"/> Food Type
                </label>
                <div className="relative">
                  <select 
                    id="donation-form"
                    required 
                    value={formData.food} 
                    onChange={e => setFormData({...formData, food: e.target.value})} 
                    className="w-full appearance-none bg-white border border-gray-200 text-gray-700 py-2.5 px-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all font-medium"
                  >
                    <option value="" disabled>Select food type</option>
                    <option value="Bakery">🥐 Bakery</option>
                    <option value="Fresh Produce">🍅 Fresh Produce</option>
                    <option value="Dairy">🥛 Dairy Products</option>
                    <option value="Grains">🌾 Grains & Pulses</option>
                    <option value="Mixed Items">📦 Mixed Food Items</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                  </div>
                </div>
              </div>

              {/* Quantity */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                  <Scale className="w-3.5 h-3.5 text-gray-500"/> Quantity
                </label>
                <input 
                  required 
                  type="text" 
                  value={formData.qty} 
                  onChange={e => setFormData({...formData, qty: e.target.value})} 
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all font-medium placeholder:font-normal" 
                  placeholder="Enter quantity (kg/ltr/pcs)" 
                />
              </div>

              {/* Expiry Date */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-gray-500"/> Expiry Date
                </label>
                <input 
                  required 
                  type="date" 
                  value={formData.date} 
                  onChange={e => setFormData({...formData, date: e.target.value})} 
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all font-medium text-gray-700" 
                />
              </div>

              {/* Select Region */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-gray-500"/> Select Region
                </label>
                <div className="relative">
                  <select 
                    required 
                    value={formData.region} 
                    onChange={e => setFormData({...formData, region: e.target.value})} 
                    className="w-full appearance-none bg-white border border-gray-200 text-gray-700 py-2.5 px-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all font-medium"
                  >
                    <option value="" disabled>Choose region</option>
                    <option value="Chennai">Chennai</option>
                    <option value="Coimbatore">Coimbatore</option>
                    <option value="Madurai">Madurai</option>
                    <option value="Salem">Salem</option>
                    <option value="Trichy">Trichy</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                  </div>
                </div>
              </div>

              {/* Donor Contact Details & OTP Verification Section */}
              <div className="p-4 bg-gradient-to-br from-green-50/80 to-emerald-50/40 rounded-2xl border border-green-200/90 space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-green-900 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-[#0b8641]" />
                    Donor Contact & Verification
                  </span>
                  <span className="text-[10px] text-green-700 font-semibold bg-white px-2 py-0.5 rounded-full border border-green-200">
                    OTP Authentication
                  </span>
                </div>

                {/* Donor Name */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-gray-700 flex items-center gap-1">
                    <User className="w-3 h-3 text-gray-500" /> Donor / Entity Name
                  </label>
                  <input 
                    type="text" 
                    value={formData.donor} 
                    onChange={e => setFormData({ ...formData, donor: e.target.value })} 
                    placeholder="Enter donor name or business"
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none font-medium"
                  />
                </div>

                {/* Mobile Number with OTP Action */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-semibold text-gray-700 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-gray-500" /> Mobile Number
                    </label>
                    {formData.phoneVerified ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Verified ✓
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleOpenPhoneOtp}
                        className="inline-flex items-center gap-1 text-[10px] font-bold text-[#0b8641] hover:text-green-800 bg-white hover:bg-green-50 px-2 py-0.5 rounded-md border border-green-300 transition-colors shadow-2xs"
                      >
                        <KeyRound className="w-2.5 h-2.5" /> Verify Mobile (OTP)
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <input 
                      type="tel" 
                      required
                      value={formData.phone} 
                      onChange={e => setFormData({ ...formData, phone: e.target.value, phoneVerified: false })} 
                      placeholder="+91 98765 43210"
                      className={`w-full bg-white border rounded-xl px-3 py-2 text-xs font-mono font-medium focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all ${
                        formData.phoneVerified ? 'border-emerald-400 bg-emerald-50/20 text-emerald-950' : 'border-gray-200'
                      }`}
                    />
                  </div>
                </div>

                {/* Email Address with OTP Action */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-semibold text-gray-700 flex items-center gap-1">
                      <Mail className="w-3 h-3 text-gray-500" /> Email Address
                    </label>
                    {formData.emailVerified ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Verified ✓
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleOpenEmailOtp}
                        className="inline-flex items-center gap-1 text-[10px] font-bold text-[#0b8641] hover:text-green-800 bg-white hover:bg-green-50 px-2 py-0.5 rounded-md border border-green-300 transition-colors shadow-2xs"
                      >
                        <KeyRound className="w-2.5 h-2.5" /> Verify Email (OTP)
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <input 
                      type="email" 
                      required
                      value={formData.email} 
                      onChange={e => setFormData({ ...formData, email: e.target.value, emailVerified: false })} 
                      placeholder="donor@example.com"
                      className={`w-full bg-white border rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all ${
                        formData.emailVerified ? 'border-emerald-400 bg-emerald-50/20 text-emerald-950' : 'border-gray-200'
                      }`}
                    />
                  </div>
                </div>

                {/* Quick Helper Badge */}
                <div className="flex items-center gap-1.5 text-[10px] text-green-800 font-medium pt-1">
                  <Sparkles className="w-3.5 h-3.5 text-[#0b8641] shrink-0" />
                  <span>OTP authentication provides instant volunteer priority matching</span>
                </div>
              </div>

              {/* Description (Optional) */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-gray-500"/> Description (Optional)
                </label>
                <textarea 
                  value={formData.desc} 
                  onChange={e => setFormData({...formData, desc: e.target.value})} 
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all resize-none font-medium placeholder:font-normal" 
                  placeholder="Add any additional details (packaging, storage)..." 
                  rows={2}
                />
              </div>

              {/* Submit Button */}
              <button 
                type="submit" 
                className="w-full bg-[#0b8641] hover:bg-green-800 text-white py-3 rounded-xl text-sm font-bold tracking-wide transition-all shadow-sm hover:shadow-md flex justify-center items-center gap-2 mt-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                Submit Donation
              </button>
            </form>
          </div>

          {/* Food Donation Impact */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-green-100 p-1.5 rounded-full"><Leaf className="w-4 h-4 text-[#0b8641]" /></div>
              <h3 className="font-bold text-gray-900 text-sm">Food Donation Impact</h3>
            </div>
            
            <div className="flex justify-between items-center px-2">
              <div className="text-center">
                <div className="flex justify-center mb-1"><Leaf className="w-5 h-5 text-[#0b8641]" /></div>
                <p className="font-bold text-gray-900">5.2 Tons</p>
                <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mt-0.5">Food Saved</p>
              </div>
              <div className="w-px h-10 bg-gray-100"></div>
              <div className="text-center">
                <div className="flex justify-center mb-1"><HeartHandshake className="w-5 h-5 text-[#0b8641]" /></div>
                <p className="font-bold text-gray-900">3,480</p>
                <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mt-0.5">People Helped</p>
              </div>
              <div className="w-px h-10 bg-gray-100"></div>
              <div className="text-center">
                <div className="flex justify-center mb-1"><MapPin className="w-5 h-5 text-[#0b8641]" /></div>
                <p className="font-bold text-gray-900">12</p>
                <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mt-0.5">Regions</p>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Dedicated Donation OTP Verification Modal */}
      <DonationOtpModal
        isOpen={isOtpOpen}
        onClose={() => setIsOtpOpen(false)}
        target={otpTarget.target}
        type={otpTarget.type}
        donorName={otpTarget.donorName}
        onVerified={handleVerifiedCallback}
      />

      {/* Donation Details & Contact Verification Modal */}
      <DonationDetailsModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        donation={selectedDonation}
        onVerifyContact={handleVerifyFromDetailModal}
      />

      {/* Unverified Donor Contact Prompt Modal */}
      {showUnverifiedPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-gray-100 animate-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Authenticate Your Contact?</h3>
                <p className="text-xs text-gray-500">Fast 1-step OTP ensures seamless volunteer pickup</p>
              </div>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed bg-gray-50 p-3.5 rounded-xl border border-gray-200">
              Verifying your <strong>Mobile Number</strong> ({formData.phone}) or <strong>Email Address</strong> ({formData.email}) ensures prompt pickup coordination and prevents counterfeit entries.
            </p>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => {
                  setShowUnverifiedPrompt(false);
                  handleOpenPhoneOtp();
                }}
                className="w-full bg-[#0b8641] hover:bg-green-800 text-white py-3 rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2"
              >
                <Phone className="w-4 h-4" /> Verify Mobile Number via OTP
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowUnverifiedPrompt(false);
                  handleOpenEmailOtp();
                }}
                className="w-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
              >
                <Mail className="w-4 h-4" /> Verify Email Address via OTP
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowUnverifiedPrompt(false);
                  executeDonationSubmission();
                }}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-600 py-2.5 rounded-xl text-xs font-semibold transition-colors"
              >
                Continue without OTP Verification
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

