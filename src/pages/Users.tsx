import { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Users as UsersIcon, 
  ShieldCheck, 
  Truck, 
  AlertTriangle, 
  ChevronRight, 
  Search, 
  Download, 
  Filter, 
  Plus, 
  MoreHorizontal, 
  MapPin, 
  ChevronLeft, 
  ChevronDown,
  Check,
  Building2,
  ExternalLink,
  Phone,
  MessageSquare,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Store,
  UserCheck,
  X,
  Radio
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { UserDetailsDrawer, type VolunteerData, type DonorData } from '../components/users/UserDetailsDrawer';
import { AddUserModal } from '../components/users/AddUserModal';
import { useAuthStore } from '../store/useAuthStore';
import CallContactButton from '../components/common/CallContactButton';
import { getStoredUsers, updateStoredUser } from '../data/mockDatabase';

export interface StakeholderUser {
  id: string;
  email: string;
  username: string;
  fullName: string;
  phone: string;
  address?: string;
  role: 'NORMAL_USER' | 'SUPERMARKET_OFFICIAL' | 'HEAD_OFFICE_ADMIN';
  supermarketId?: string;
  supermarketName?: string;
  branchId?: string;
  branchName?: string;
  isActive: boolean;
  createdAt: string;
}

// Initial Volunteers matching Image 1 exactly
const INITIAL_VOLUNTEERS: VolunteerData[] = [
  {
    id: 'V1',
    name: 'Rahul Sharma',
    phone: '+91 98765 43210',
    email: 'rahul.sharma@foodcovering.org',
    status: 'En Route',
    lat: 28.6158,
    lng: 77.2052,
    assignedPickup: 'D-3',
    assignedDonorName: 'Green Farms',
    lastUpdated: '2 mins ago',
    nextAvailable: '3:00 PM'
  },
  {
    id: 'V2',
    name: 'Priya Nair',
    phone: '+91 87654 32109',
    email: 'priya.nair@foodcovering.org',
    status: 'En Route',
    lat: 19.0766,
    lng: 72.8925,
    assignedPickup: 'D-1',
    assignedDonorName: 'Green Farms',
    lastUpdated: '5 mins ago',
    nextAvailable: '4:30 PM'
  },
  {
    id: 'V3',
    name: 'Amit Kumar',
    phone: '+91 76543 21098',
    email: 'amit.kumar@foodcovering.org',
    status: 'En Route',
    lat: 12.9788,
    lng: 77.5958,
    assignedPickup: 'D-2',
    assignedDonorName: 'Sunrise Foods',
    lastUpdated: '8 mins ago',
    nextAvailable: '5:00 PM'
  },
  {
    id: 'V4',
    name: 'Sneha Reddy',
    phone: '+91 65432 10987',
    email: 'sneha.reddy@foodcovering.org',
    status: 'Available',
    lat: 22.5798,
    lng: 88.3569,
    assignedPickup: '-',
    lastUpdated: '15 mins ago',
    nextAvailable: 'Immediate'
  },
  {
    id: 'V5',
    name: 'Vikram Singh',
    phone: '+91 54321 09876',
    email: 'vikram.singh@foodcovering.org',
    status: 'Available',
    lat: 13.0952,
    lng: 80.2777,
    assignedPickup: '-',
    lastUpdated: '18 mins ago',
    nextAvailable: 'Immediate'
  },
  {
    id: 'V6',
    name: 'Anjali Mehta',
    phone: '+91 43210 98765',
    email: 'anjali.mehta@foodcovering.org',
    status: 'Assigned',
    lat: 17.3950,
    lng: 78.4904,
    assignedPickup: 'D-4',
    assignedDonorName: 'City Kitchen',
    lastUpdated: '25 mins ago',
    nextAvailable: '6:00 PM'
  },
  {
    id: 'V7',
    name: 'Rohit Joshi',
    phone: '+91 32109 87654',
    email: 'rohit.joshi@foodcovering.org',
    status: 'En Route',
    lat: 23.0147,
    lng: 72.5538,
    assignedPickup: 'D-5',
    assignedDonorName: 'Healthy Bites',
    lastUpdated: '32 mins ago',
    nextAvailable: '4:00 PM'
  },
  {
    id: 'V8',
    name: 'Neha Kulkarni',
    phone: '+91 21098 76543',
    email: 'neha.kulkarni@foodcovering.org',
    status: 'Available',
    lat: 18.5272,
    lng: 73.8690,
    assignedPickup: '-',
    lastUpdated: '40 mins ago',
    nextAvailable: 'Immediate'
  },
  {
    id: 'V9',
    name: 'Suresh Patel',
    phone: '+91 10987 65432',
    email: 'suresh.patel@foodcovering.org',
    status: 'Offline',
    lat: 26.9199,
    lng: 75.8033,
    assignedPickup: '-',
    lastUpdated: '1 hour ago',
    nextAvailable: 'Tomorrow 9:00 AM'
  },
  {
    id: 'V10',
    name: 'Pooja Verma',
    phone: '+91 09876 54321',
    email: 'pooja.verma@foodcovering.org',
    status: 'En Route',
    lat: 21.1915,
    lng: 72.8327,
    assignedPickup: 'D-6',
    assignedDonorName: 'City Kitchen',
    lastUpdated: '1 hour ago',
    nextAvailable: '5:30 PM'
  }
];

// Initial Donors matching Image 1 exactly
const INITIAL_DONORS: DonorData[] = [
  {
    id: 'D1',
    name: 'Green Farms',
    email: 'green@farm.com',
    phone: '+91 98765 11111',
    foodCategory: 'Fruits & Vegetables',
    quantity: '25 kg',
    status: 'Ready',
    lat: 28.5355,
    lng: 77.2410,
    pickupTime: 'Today 10:00 AM',
    address: 'Sector 62, Noida, NCR'
  },
  {
    id: 'D2',
    name: 'Sunrise Foods',
    email: 'sunrise@food.com',
    phone: '+91 87654 22222',
    foodCategory: 'Cooked Food',
    quantity: '15 kg',
    status: 'Assigned',
    lat: 19.1136,
    lng: 72.8697,
    pickupTime: 'Today 12:00 PM',
    address: 'Andheri East, Mumbai'
  },
  {
    id: 'D3',
    name: 'Fresh Mart',
    email: 'fresh@mart.com',
    phone: '+91 76543 33333',
    foodCategory: 'Bakery Items',
    quantity: '10 kg',
    status: 'Ready',
    lat: 12.9229,
    lng: 77.6253,
    pickupTime: 'Today 02:00 PM',
    address: 'Koramangala, Bangalore'
  },
  {
    id: 'D4',
    name: 'City Kitchen',
    email: 'city@kitchen.com',
    phone: '+91 65432 44444',
    foodCategory: 'Grains & Staples',
    quantity: '20 kg',
    status: 'Pending',
    lat: 22.5180,
    lng: 88.3832,
    pickupTime: 'Tomorrow 09:00 AM',
    address: 'Salt Lake City, Kolkata'
  },
  {
    id: 'D5',
    name: 'Healthy Bites',
    email: 'healthy@bites.com',
    phone: '+91 54321 55555',
    foodCategory: 'Dairy Products',
    quantity: '12 kg',
    status: 'Completed',
    lat: 13.0418,
    lng: 80.2341,
    pickupTime: '28 Sep 04:00 PM',
    address: 'T Nagar, Chennai'
  }
];

export type UserTab = 'all' | 'officials' | 'citizens' | 'volunteers' | 'donors';

export default function Users() {
  const navigate = useNavigate();

  // Dynamic DB Users & Summary State
  const [dbUsers, setDbUsers] = useState<StakeholderUser[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Volunteers & Donors
  const [volunteers, setVolunteers] = useState<VolunteerData[]>(INITIAL_VOLUNTEERS);
  const [donors, setDonors] = useState<DonorData[]>(INITIAL_DONORS);

  // Tabs: All Stakeholders | Supermarket Officials | Citizens | Volunteers | Donors
  const [activeTab, setActiveTab] = useState<UserTab>('all');

  // Selected for Right Drawer
  const [selectedDbUser, setSelectedDbUser] = useState<StakeholderUser | null>(null);
  const [selectedVolunteer, setSelectedVolunteer] = useState<VolunteerData | null>(null);
  const [selectedDonor, setSelectedDonor] = useState<DonorData | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  // Export menu state
  const [isExportOpen, setIsExportOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  // Add User Modal
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);

  // Action Menu dropdown state for table rows
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Fetch real users from backend
  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const token = useAuthStore.getState().token;
      const backendUrl = typeof window !== 'undefined' && window.location.hostname === 'localhost' 
        ? 'http://localhost:5000' 
        : `http://${window.location.hostname}:5000`;
      
      const res = await fetch(`${backendUrl}/api/admin/users`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        signal: AbortSignal.timeout(2500)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.users && data.users.length > 0) {
          setDbUsers(data.users);
          setSummary(data.summary || null);
          return;
        }
      }
      throw new Error('Server returned empty');
    } catch (err) {
      // Offline / Public Fallback: Load complete stakeholder database
      const stored = getStoredUsers();
      setDbUsers(stored as any);
      setSummary({
        total: stored.length,
        active: stored.filter(u => u.isActive).length,
        admins: stored.filter(u => u.role === 'HEAD_OFFICE_ADMIN').length,
        supermarkets: stored.filter(u => u.role === 'SUPERMARKET_OFFICIAL').length,
        citizens: stored.filter(u => u.role === 'NORMAL_USER').length,
        volunteers: stored.filter(u => u.role === 'VOLUNTEER').length
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Set default selection once DB users load
  useEffect(() => {
    if (dbUsers.length > 0 && !selectedDbUser && !selectedVolunteer && !selectedDonor) {
      // Pick first supermarket lead or citizen by default
      const defaultUser = dbUsers.find(u => u.role === 'SUPERMARKET_OFFICIAL') || dbUsers[0];
      setSelectedDbUser(defaultUser);
      setIsDrawerOpen(true);
    }
  }, [dbUsers]);

  // Click outside listener for dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setIsFilterOpen(false);
      }
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setIsExportOpen(false);
      }
      if (activeMenuId && !(e.target as HTMLElement).closest('.row-actions-btn')) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeMenuId]);

  // Toggle user active / inactive status
  const handleToggleStatus = async (user: StakeholderUser, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const newStatus = !user.isActive;
    try {
      const token = useAuthStore.getState().token;
      const backendUrl = typeof window !== 'undefined' && window.location.hostname === 'localhost' 
        ? 'http://localhost:5000' 
        : `http://${window.location.hostname}:5000`;
      
      fetch(`${backendUrl}/api/admin/users/${user.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ isActive: newStatus }),
        signal: AbortSignal.timeout(2000)
      }).catch(() => {});
    } catch (err) {}
    
    // Always persist to client-side store
    updateStoredUser(user.id, { isActive: newStatus });
    setDbUsers(prev => prev.map(u => u.id === user.id ? { ...u, isActive: newStatus } : u));
    if (selectedDbUser?.id === user.id) {
      setSelectedDbUser({ ...selectedDbUser, isActive: newStatus });
    }
  };

  // Direct WhatsApp contact launcher
  const handleOpenWhatsApp = (user: { fullName: string; phone: string; role?: string; supermarketName?: string }, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const cleanPhone = (user.phone || '').replace(/[^0-9]/g, '');
    const message = encodeURIComponent(
      `Hello ${user.fullName},\n\nThis is the FoodCovering 2.0 Head Office Administration team regarding your account.\n\nBest regards,\nHead Office Administrator`
    );
    window.open(`https://api.whatsapp.com/send/?phone=${cleanPhone}&text=${message}`, '_blank');
  };

  // Filtered DB Users according to tab, search query, and status
  const filteredDbUsers = useMemo(() => {
    return dbUsers.filter((u) => {
      // Tab filter
      if (activeTab === 'officials' && u.role !== 'SUPERMARKET_OFFICIAL') return false;
      if (activeTab === 'citizens' && (u.role !== 'NORMAL_USER' || u.id.startsWith('usr-vol-') || u.id.startsWith('usr-donor-'))) return false;

      // Status filter
      if (statusFilter === 'Active' && !u.isActive) return false;
      if (statusFilter === 'Inactive' && u.isActive) return false;

      // Search query
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        u.fullName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.phone.includes(q) ||
        (u.supermarketName && u.supermarketName.toLowerCase().includes(q)) ||
        (u.address && u.address.toLowerCase().includes(q))
      );
    });
  }, [dbUsers, activeTab, statusFilter, searchQuery]);

  // Filtered Volunteers
  const filteredVolunteers = useMemo(() => {
    return volunteers.filter((vol) => {
      const matchSearch =
        vol.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vol.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vol.phone.includes(searchQuery) ||
        (vol.assignedPickup && vol.assignedPickup.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchStatus = statusFilter === 'All' || vol.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [volunteers, searchQuery, statusFilter]);

  // Filtered Donors
  const filteredDonors = useMemo(() => {
    return donors.filter((donor) => {
      const matchSearch =
        donor.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        donor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        donor.phone.includes(searchQuery) ||
        donor.foodCategory.toLowerCase().includes(searchQuery.toLowerCase());

      const matchStatus = statusFilter === 'All' || donor.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [donors, searchQuery, statusFilter]);

  // Add User handlers
  const handleAddVolunteer = (newVol: VolunteerData) => {
    setVolunteers((prev) => [newVol, ...prev]);
    setSelectedVolunteer(newVol);
    setSelectedDonor(null);
    setSelectedDbUser(null);
    setIsDrawerOpen(true);
  };

  const handleAddDonor = (newDonor: DonorData) => {
    setDonors((prev) => [newDonor, ...prev]);
    setSelectedDonor(newDonor);
    setSelectedVolunteer(null);
    setSelectedDbUser(null);
    setIsDrawerOpen(true);
  };

  // CSV Export feature
  const exportToCSV = (type: 'all' | 'officials' | 'citizens' | 'volunteers' | 'donors') => {
    let rows: string[][] = [];
    rows.push(['Type', 'ID', 'Name', 'Phone', 'Email', 'Role / Details', 'Status', 'Affiliation / Location']);
    
    dbUsers.forEach((u) => {
      rows.push(['Database User', u.id, u.fullName, u.phone, u.email, u.role, u.isActive ? 'Active' : 'Inactive', u.supermarketName || u.address || 'Central']);
    });
    volunteers.forEach((v) => {
      rows.push(['Volunteer', v.id, v.name, v.phone, v.email || '', 'Volunteer', v.status, v.assignedPickup || 'Available']);
    });
    donors.forEach((d) => {
      rows.push(['Donor', d.id, d.name, d.phone, d.email, d.foodCategory, d.status, d.address || 'Registered']);
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.map(item => `"${item}"`).join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `foodcovering_users_${type}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsExportOpen(false);
  };

  const getRoleBadge = (u: StakeholderUser) => {
    if (u.role === 'SUPERMARKET_OFFICIAL') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
          <Store className="w-3 h-3 text-blue-600" />
          Store Lead
        </span>
      );
    } else if (u.role === 'HEAD_OFFICE_ADMIN') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
          <ShieldCheck className="w-3 h-3 text-purple-600" />
          Admin
        </span>
      );
    } else if (u.id.startsWith('usr-vol-') || u.fullName.toLowerCase().includes('volunteer')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <Truck className="w-3 h-3 text-emerald-600" />
          Volunteer
        </span>
      );
    } else if (u.id.startsWith('usr-donor-') || u.fullName.toLowerCase().includes('donor')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
          <CheckCircle2 className="w-3 h-3 text-amber-600" />
          Donor
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
          <UsersIcon className="w-3 h-3 text-indigo-600" />
          Citizen
        </span>
      );
    }
  };

  return (
    <div className="space-y-4 w-full">
      {/* 1. Header & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">User Management</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Coordinate supermarket store leads, citizen whistleblowers, and field logistics fleet across zones.
          </p>
        </div>

        {/* Action Buttons: Refresh, Export, Filter, Add User */}
        <div className="flex items-center gap-2">
          {/* Refresh Live Users */}
          <button
            onClick={fetchUsers}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-semibold shadow-2xs transition-all disabled:opacity-50"
            title="Refresh database users"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-gray-500 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {/* Export Menu */}
          <div className="relative" ref={exportRef}>
            <button
              onClick={() => setIsExportOpen(!isExportOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-semibold shadow-2xs transition-all"
            >
              <Download className="w-3.5 h-3.5 text-gray-500" />
              <span>Export</span>
              <ChevronDown className="w-3 h-3 text-gray-400" />
            </button>

            {isExportOpen && (
              <div className="absolute right-0 mt-1.5 w-44 bg-white border border-gray-200 rounded-xl shadow-xl p-1.5 z-30 text-xs animate-in fade-in">
                <button
                  onClick={() => exportToCSV('all')}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
                >
                  Export All Stakeholders
                </button>
                <button
                  onClick={() => exportToCSV('officials')}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
                >
                  Export Store Officials
                </button>
                <button
                  onClick={() => exportToCSV('volunteers')}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
                >
                  Export Volunteers (.CSV)
                </button>
                <button
                  onClick={() => exportToCSV('donors')}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
                >
                  Export Donors (.CSV)
                </button>
              </div>
            )}
          </div>

          {/* Filter Dropdown */}
          <div className="relative" ref={filterRef}>
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-xl text-xs font-semibold shadow-2xs transition-all ${
                statusFilter !== 'All'
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                  : 'bg-white hover:bg-gray-50 border-gray-200 text-gray-700'
              }`}
            >
              <Filter className="w-3.5 h-3.5 text-gray-500" />
              <span>{statusFilter === 'All' ? 'Status' : statusFilter}</span>
              <ChevronDown className="w-3 h-3 text-gray-400" />
            </button>

            {isFilterOpen && (
              <div className="absolute right-0 mt-1.5 w-44 bg-white border border-gray-200 rounded-xl shadow-xl p-1.5 z-30 text-xs animate-in fade-in">
                <div className="px-2.5 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Filter by Status
                </div>
                {['All', 'Active', 'Inactive', 'En Route', 'Available', 'Ready', 'Assigned'].map((st) => (
                  <button
                    key={st}
                    onClick={() => {
                      setStatusFilter(st);
                      setIsFilterOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors ${
                      statusFilter === st
                        ? 'bg-emerald-50 text-emerald-800 font-bold'
                        : 'text-gray-700 hover:bg-gray-50 font-medium'
                    }`}
                  >
                    <span>{st}</span>
                    {statusFilter === st && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Add User Button */}
          <button
            onClick={() => setIsAddUserOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-2xs transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add User</span>
          </button>
        </div>
      </div>

      {/* 2. Sub-Tabs Header */}
      <div className="flex border-b border-gray-200 text-xs font-bold gap-1 sm:gap-2 overflow-x-auto pb-0.5">
        <button
          onClick={() => setActiveTab('all')}
          className={`pb-3 px-3 transition-colors relative flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'all'
              ? 'text-emerald-800'
              : 'text-gray-400 hover:text-gray-700 font-medium'
          }`}
        >
          <span>All Stakeholders</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-gray-100 text-gray-700">
            {dbUsers.length || 17}
          </span>
          {activeTab === 'all' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('officials')}
          className={`pb-3 px-3 transition-colors relative flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'officials'
              ? 'text-emerald-800'
              : 'text-gray-400 hover:text-gray-700 font-medium'
          }`}
        >
          <Store className="w-3.5 h-3.5 text-blue-600" />
          <span>Supermarket Store Leads</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-50 text-blue-700 font-bold">
            {summary?.supermarketOfficials || 6}
          </span>
          {activeTab === 'officials' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('citizens')}
          className={`pb-3 px-3 transition-colors relative flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'citizens'
              ? 'text-emerald-800'
              : 'text-gray-400 hover:text-gray-700 font-medium'
          }`}
        >
          <UsersIcon className="w-3.5 h-3.5 text-indigo-600" />
          <span>Citizens & Whistleblowers</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-indigo-50 text-indigo-700 font-bold">
            {summary?.citizens || 3}
          </span>
          {activeTab === 'citizens' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('volunteers')}
          className={`pb-3 px-3 transition-colors relative flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'volunteers'
              ? 'text-emerald-800'
              : 'text-gray-400 hover:text-gray-700 font-medium'
          }`}
        >
          <Truck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Volunteers Fleet</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-50 text-emerald-700 font-bold">
            {volunteers.length}
          </span>
          {activeTab === 'volunteers' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('donors')}
          className={`pb-3 px-3 transition-colors relative flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'donors'
              ? 'text-emerald-800'
              : 'text-gray-400 hover:text-gray-700 font-medium'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
          <span>Donors</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-50 text-amber-700 font-bold">
            {donors.length}
          </span>
          {activeTab === 'donors' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 rounded-full" />
          )}
        </button>
      </div>

      {/* 3. 4 KPI Summary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {/* Card 1: Total Stakeholders */}
        <div 
          onClick={() => setActiveTab('all')}
          className="bg-white rounded-2xl p-3.5 border border-gray-200/90 shadow-2xs hover:shadow-xs transition-shadow flex items-center justify-between cursor-pointer group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 group-hover:scale-105 transition-transform">
              <UsersIcon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Total Stakeholders</p>
              <h3 className="text-xl font-bold text-gray-900 leading-tight">
                {summary?.total || dbUsers.length || 17}
              </h3>
              <p className="text-[11px] text-emerald-600 font-medium mt-0.5">
                {summary?.active || dbUsers.filter(u => u.isActive).length || 17} active accounts
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-indigo-600 transition-colors" />
        </div>

        {/* Card 2: Supermarket Store Leads */}
        <div 
          onClick={() => setActiveTab('officials')}
          className="bg-white rounded-2xl p-3.5 border border-gray-200/90 shadow-2xs hover:shadow-xs transition-shadow flex items-center justify-between cursor-pointer group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 group-hover:scale-105 transition-transform">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Supermarket Store Leads</p>
              <h3 className="text-xl font-bold text-gray-900 leading-tight">
                {summary?.supermarketOfficials || 6} Chains
              </h3>
              <p className="text-[11px] text-blue-600 font-medium mt-0.5">Store managers provisioned</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-600 transition-colors" />
        </div>

        {/* Card 3: Active Volunteers */}
        <div 
          onClick={() => setActiveTab('volunteers')}
          className="bg-white rounded-2xl p-3.5 border border-gray-200/90 shadow-2xs hover:shadow-xs transition-shadow flex items-center justify-between cursor-pointer group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 group-hover:scale-105 transition-transform">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Field Volunteers</p>
              <h3 className="text-xl font-bold text-gray-900 leading-tight">
                {summary?.volunteers || volunteers.length || 10}
              </h3>
              <p className="text-[11px] text-gray-400 mt-0.5">Rapid dispatch & logistics</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-emerald-600 transition-colors" />
        </div>

        {/* Card 4: Citizens & Donors */}
        <div 
          onClick={() => setActiveTab('citizens')}
          className="bg-white rounded-2xl p-3.5 border border-gray-200/90 shadow-2xs hover:shadow-xs transition-shadow flex items-center justify-between cursor-pointer group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 group-hover:scale-105 transition-transform">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Citizens & Whistleblowers</p>
              <h3 className="text-xl font-bold text-gray-900 leading-tight">
                {(summary?.citizens || 3) + (summary?.donors || 2)}
              </h3>
              <p className="text-[11px] text-gray-400 mt-0.5">Registered community members</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-amber-600 transition-colors" />
        </div>
      </div>

      {/* 4. Main Body: Stakeholders Table + Docked Drawer */}
      <div className="flex flex-col 2xl:flex-row items-start gap-4">
        {/* Main Content Area */}
        <div className="flex-1 w-full min-w-0">
          
          {/* Case 1: All Stakeholders / Officials / Citizens (Database Users) */}
          {(activeTab === 'all' || activeTab === 'officials' || activeTab === 'citizens') && (
            <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs overflow-hidden flex flex-col">
              {/* Table Header with Search */}
              <div className="p-3.5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                    <UsersIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-gray-900">
                      {activeTab === 'officials' ? 'Supermarket Store Leads' :
                       activeTab === 'citizens' ? 'Registered Citizens & Whistleblowers' :
                       'All Registered Stakeholders'}
                    </h3>
                    <p className="text-[11px] text-gray-400">
                      {filteredDbUsers.length} accounts matching filters
                    </p>
                  </div>
                </div>

                {/* Table search bar */}
                <div className="relative w-full sm:w-64">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name, phone, email, store..."
                    className="w-full pl-8 pr-3 py-1.5 bg-gray-50/70 border border-gray-200 rounded-lg text-xs placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white transition-all"
                  />
                  <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* Stakeholders Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead className="bg-[#FAFBFD] text-gray-400 text-[10px] font-bold uppercase tracking-wider border-b border-gray-100">
                    <tr>
                      <th className="px-3.5 py-2.5">Stakeholder</th>
                      <th className="px-3.5 py-2.5">Role</th>
                      <th className="px-3.5 py-2.5">Affiliation / Supermarket</th>
                      <th className="px-3.5 py-2.5">Contact & WhatsApp</th>
                      <th className="px-3.5 py-2.5">Status</th>
                      <th className="px-3.5 py-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100/80">
                    {filteredDbUsers.map((u) => {
                      const isSelected = selectedDbUser?.id === u.id && isDrawerOpen;
                      return (
                        <tr
                          key={u.id}
                          onClick={() => {
                            setSelectedDbUser(u);
                            setSelectedVolunteer(null);
                            setSelectedDonor(null);
                            setIsDrawerOpen(true);
                          }}
                          className={`cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-indigo-50/70 hover:bg-indigo-50'
                              : 'hover:bg-gray-50/70'
                          }`}
                        >
                          {/* Name & ID */}
                          <td className="px-3.5 py-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
                                {u.fullName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                              </div>
                              <div className="leading-tight">
                                <span className="font-bold text-gray-900 block">{u.fullName}</span>
                                <span className="text-[10px] text-gray-400 font-mono block mt-0.5">
                                  {u.id} • {u.email}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Role */}
                          <td className="px-3.5 py-3">
                            {getRoleBadge(u)}
                          </td>

                          {/* Supermarket / Affiliation */}
                          <td className="px-3.5 py-3">
                            {u.supermarketName ? (
                              <div className="leading-tight">
                                <span className="font-semibold text-gray-800 flex items-center gap-1">
                                  <Store className="w-3 h-3 text-blue-500 shrink-0" />
                                  {u.supermarketName}
                                </span>
                                {u.branchName && (
                                  <span className="text-[10px] text-gray-400 block mt-0.5">
                                    {u.branchName}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-500 text-[11px] flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                                {u.address || 'Chennai Central Hub'}
                              </span>
                            )}
                          </td>

                          {/* Contact & WhatsApp */}
                          <td className="px-3.5 py-3">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[11px] text-gray-700 font-medium">
                                {u.phone}
                              </span>
                              {/* Open in WhatsApp Button */}
                              <button
                                onClick={(e) => handleOpenWhatsApp(u, e)}
                                title={`Open WhatsApp chat with ${u.fullName}`}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors"
                              >
                                <MessageSquare className="w-3 h-3 text-emerald-600" />
                                <span>WhatsApp</span>
                              </button>
                            </div>
                          </td>

                          {/* Status & Toggle */}
                          <td className="px-3.5 py-3">
                            <button
                              onClick={(e) => handleToggleStatus(u, e)}
                              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border transition-colors ${
                                u.isActive
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                  : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                              }`}
                              title="Click to toggle account status"
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${u.isActive ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                              <span>{u.isActive ? 'Active' : 'Inactive'}</span>
                            </button>
                          </td>

                          {/* Actions */}
                          <td className="px-3.5 py-3 text-right">
                            <button
                              onClick={() => {
                                setSelectedDbUser(u);
                                setSelectedVolunteer(null);
                                setSelectedDonor(null);
                                setIsDrawerOpen(true);
                              }}
                              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5 justify-end"
                            >
                              Profile →
                            </button>
                          </td>
                        </tr>
                      );
                    })}

                    {filteredDbUsers.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-gray-400 text-xs">
                          No stakeholders match the filter criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Table Footer */}
              <div className="p-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400 bg-white">
                <span>Showing {filteredDbUsers.length} of {dbUsers.length} total registered accounts</span>
                <span className="text-[11px] text-emerald-600 font-medium">Synced with FoodCovering 2.0 DB</span>
              </div>
            </div>
          )}

          {/* Case 2: Volunteers Fleet Tab */}
          {activeTab === 'volunteers' && (
            <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs overflow-hidden flex flex-col">
              <div className="p-3.5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <Truck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-gray-900">Field Volunteers Logistics Fleet</h3>
                    <p className="text-[11px] text-gray-400">{filteredVolunteers.length} active units on field</p>
                  </div>
                </div>

                <div className="relative w-full sm:w-64">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search volunteers..."
                    className="w-full pl-8 pr-3 py-1.5 bg-gray-50/70 border border-gray-200 rounded-lg text-xs placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white transition-all"
                  />
                  <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead className="bg-[#FAFBFD] text-gray-400 text-[10px] font-bold uppercase tracking-wider border-b border-gray-100">
                    <tr>
                      <th className="px-3.5 py-2.5">ID</th>
                      <th className="px-3.5 py-2.5">Name</th>
                      <th className="px-3.5 py-2.5">Status</th>
                      <th className="px-3.5 py-2.5">Last Location</th>
                      <th className="px-3.5 py-2.5">Assigned Pickup</th>
                      <th className="px-3.5 py-2.5">Contact & WhatsApp</th>
                      <th className="px-3.5 py-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100/80">
                    {filteredVolunteers.map((vol) => (
                      <tr
                        key={vol.id}
                        onClick={() => {
                          setSelectedVolunteer(vol);
                          setSelectedDbUser(null);
                          setSelectedDonor(null);
                          setIsDrawerOpen(true);
                        }}
                        className={`cursor-pointer transition-colors ${
                          selectedVolunteer?.id === vol.id && isDrawerOpen
                            ? 'bg-emerald-50/70 hover:bg-emerald-50'
                            : 'hover:bg-gray-50/70'
                        }`}
                      >
                        <td className="px-3.5 py-3 font-semibold text-blue-700">
                          <span className="px-2 py-0.5 bg-blue-50/80 rounded font-mono text-[11px]">{vol.id}</span>
                        </td>
                        <td className="px-3.5 py-3">
                          <span className="font-bold text-gray-900 block">{vol.name}</span>
                          <span className="text-[10px] text-gray-400 font-mono">{vol.phone}</span>
                        </td>
                        <td className="px-3.5 py-3">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            {vol.status}
                          </span>
                        </td>
                        <td className="px-3.5 py-3 text-gray-600 font-mono text-[11px]">
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                            {vol.lat.toFixed(4)}, {vol.lng.toFixed(4)}
                          </span>
                        </td>
                        <td className="px-3.5 py-3 text-gray-700 font-medium">
                          {vol.assignedPickup || '-'}
                        </td>
                        <td className="px-3.5 py-3">
                          <button
                            onClick={(e) => handleOpenWhatsApp({ fullName: vol.name, phone: vol.phone }, e)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200"
                          >
                            <MessageSquare className="w-3 h-3 text-emerald-600" />
                            <span>WhatsApp</span>
                          </button>
                        </td>
                        <td className="px-3.5 py-3 text-right">
                          <button
                            onClick={() => {
                              setSelectedVolunteer(vol);
                              setSelectedDbUser(null);
                              setSelectedDonor(null);
                              setIsDrawerOpen(true);
                            }}
                            className="text-xs font-semibold text-emerald-600 hover:text-emerald-800"
                          >
                            Profile →
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Case 3: Donors Tab */}
          {activeTab === 'donors' && (
            <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs overflow-hidden flex flex-col">
              <div className="p-3.5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-gray-900">Registered Food Donors</h3>
                    <p className="text-[11px] text-gray-400">{filteredDonors.length} active donors</p>
                  </div>
                </div>

                <div className="relative w-full sm:w-64">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search donors..."
                    className="w-full pl-8 pr-3 py-1.5 bg-gray-50/70 border border-gray-200 rounded-lg text-xs placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white transition-all"
                  />
                  <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead className="bg-[#FAFBFD] text-gray-400 text-[10px] font-bold uppercase tracking-wider border-b border-gray-100">
                    <tr>
                      <th className="px-3.5 py-2.5">ID</th>
                      <th className="px-3.5 py-2.5">Name</th>
                      <th className="px-3.5 py-2.5">Contact</th>
                      <th className="px-3.5 py-2.5">Food Category</th>
                      <th className="px-3.5 py-2.5">Status</th>
                      <th className="px-3.5 py-2.5">Pickup Time</th>
                      <th className="px-3.5 py-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100/80">
                    {filteredDonors.map((donor) => (
                      <tr
                        key={donor.id}
                        onClick={() => {
                          setSelectedDonor(donor);
                          setSelectedDbUser(null);
                          setSelectedVolunteer(null);
                          setIsDrawerOpen(true);
                        }}
                        className={`cursor-pointer transition-colors ${
                          selectedDonor?.id === donor.id && isDrawerOpen
                            ? 'bg-blue-50/70 hover:bg-blue-50'
                            : 'hover:bg-gray-50/70'
                        }`}
                      >
                        <td className="px-3.5 py-3 font-semibold text-blue-700">
                          <span className="px-2 py-0.5 bg-blue-50/80 rounded font-mono text-[11px]">{donor.id}</span>
                        </td>
                        <td className="px-3.5 py-3 font-bold text-gray-900">{donor.name}</td>
                        <td className="px-3.5 py-3">
                          <span className="text-[10px] text-gray-500 block">{donor.email}</span>
                          <span className="text-[10px] text-gray-400 font-mono">{donor.phone}</span>
                        </td>
                        <td className="px-3.5 py-3 text-gray-700 font-medium">
                          {donor.foodCategory} {donor.quantity ? `(${donor.quantity})` : ''}
                        </td>
                        <td className="px-3.5 py-3">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                            {donor.status}
                          </span>
                        </td>
                        <td className="px-3.5 py-3 text-gray-600">{donor.pickupTime}</td>
                        <td className="px-3.5 py-3 text-right">
                          <button
                            onClick={() => {
                              setSelectedDonor(donor);
                              setSelectedDbUser(null);
                              setSelectedVolunteer(null);
                              setIsDrawerOpen(true);
                            }}
                            className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                          >
                            Profile →
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* ================= RIGHT PROFILE DRAWER (Docked on 2xl / Stacked) ================= */}
        {isDrawerOpen && (
          <div className="w-full 2xl:w-[350px] shrink-0 sticky top-4">
            {/* 1. DB User Details Card */}
            {selectedDbUser && (
              <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-slate-50/60">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Stakeholder Profile</span>
                    {getRoleBadge(selectedDbUser)}
                  </div>
                  <button
                    onClick={() => setIsDrawerOpen(false)}
                    className="p-1 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Body */}
                <div className="p-4 space-y-4">
                  {/* Avatar & Name */}
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold text-base flex items-center justify-center shrink-0">
                      {selectedDbUser.fullName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-gray-900 leading-tight">
                        {selectedDbUser.fullName}
                      </h3>
                      <p className="text-xs text-gray-400 font-mono mt-0.5">
                        ID: {selectedDbUser.id}
                      </p>
                    </div>
                  </div>

                  {/* Supermarket Information (if official) */}
                  {selectedDbUser.supermarketName && (
                    <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-3">
                      <p className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">Assigned Supermarket</p>
                      <p className="text-sm font-bold text-gray-900 mt-0.5">{selectedDbUser.supermarketName}</p>
                      {selectedDbUser.branchName && (
                        <p className="text-xs text-blue-600 mt-0.5">{selectedDbUser.branchName}</p>
                      )}
                    </div>
                  )}

                  {/* Contact Information */}
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 border border-gray-100">
                      <span className="text-gray-500 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-gray-400" /> Phone
                      </span>
                      <span className="font-mono font-bold text-gray-900">{selectedDbUser.phone}</span>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 border border-gray-100">
                      <span className="text-gray-500 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-gray-400" /> Email
                      </span>
                      <span className="font-medium text-gray-900 truncate max-w-[180px]">{selectedDbUser.email}</span>
                    </div>

                    <div className="p-2 rounded-lg bg-gray-50 border border-gray-100">
                      <span className="text-gray-500 flex items-center gap-1.5 mb-1">
                        <MapPin className="w-3.5 h-3.5 text-gray-400" /> Address / Zone
                      </span>
                      <span className="font-medium text-gray-900 text-xs block">
                        {selectedDbUser.address || 'Chennai Central Hub Depot, Tamil Nadu'}
                      </span>
                    </div>
                  </div>

                  {/* Quick Action Buttons */}
                  <div className="space-y-2 pt-1">
                    {/* Real WhatsApp Contact Button */}
                    <button
                      onClick={() => handleOpenWhatsApp(selectedDbUser)}
                      className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-2xs transition-colors"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>Open WhatsApp Conversation</span>
                    </button>

                    {/* Status Toggle Switch */}
                    <button
                      onClick={() => handleToggleStatus(selectedDbUser)}
                      className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold border transition-colors ${
                        selectedDbUser.isActive
                          ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                      }`}
                    >
                      <Radio className="w-3.5 h-3.5" />
                      <span>{selectedDbUser.isActive ? 'Deactivate Account' : 'Activate Account'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 2. Volunteer or Donor Drawer */}
            {(selectedVolunteer || selectedDonor) && (
              <UserDetailsDrawer
                volunteer={selectedVolunteer}
                donor={selectedDonor}
                isOpen={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                onViewMap={() => navigate('/map')}
              />
            )}
          </div>
        )}
      </div>

      {/* Add User Modal */}
      <AddUserModal
        isOpen={isAddUserOpen}
        onClose={() => setIsAddUserOpen(false)}
        onAddVolunteer={handleAddVolunteer}
        onAddDonor={handleAddDonor}
        nextVolunteerId={`V${volunteers.length + 1}`}
        nextDonorId={`D${donors.length + 1}`}
      />
    </div>
  );
}
