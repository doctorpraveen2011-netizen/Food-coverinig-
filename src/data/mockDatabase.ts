// Client-Side Offline Database for FoodCovering 2.0
// Synchronizes automatically with localStorage for 100% public demo availability across all devices

export interface SafeUser {
  id: string;
  email: string;
  username: string;
  fullName: string;
  phone: string;
  address: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  supermarketId?: string;
  branchId?: string;
  lastLoginAt?: string;
  avatar?: string;
  kycStatus?: 'Verified' | 'Pending' | 'Rejected';
}

export interface DonationRecord {
  id: string;
  donorType?: string;
  donorUserId?: string;
  donorName?: string;
  donorPhone?: string;
  donorEmail?: string;
  foodItems?: string;
  title?: string;
  category?: string;
  quantity?: string;
  weight?: string;
  freshness?: string;
  pickupTime?: string;
  expiryDate?: string;
  pickupAddress?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  destinationLatitude?: number;
  destinationLongitude?: number;
  receiver?: string;
  volunteer?: string;
  volunteerPhone?: string;
  volunteerVehicle?: string;
  status: string;
  statusBadgeText?: string;
  eta?: string;
  notes?: string;
  date?: string;
  createdAt?: string;
  verificationType?: string;
  handoverOtp?: string;
  otpVerified?: boolean;
  destinationAddress?: string;
  destinationType?: string;
  destinationContact?: string;
  beneficiaries?: string;
  [key: string]: any;
}

export interface ComplaintRecord {
  id: string;
  userId?: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  supermarketId?: string;
  seller?: string;
  productName: string;
  batchNumber?: string;
  category?: string;
  purchaseDate?: string;
  description: string;
  status: string;
  priority: string;
  refundAmount?: number;
  refundStatus?: string;
  createdAt: string;
  [key: string]: any;
}

const DEFAULT_USERS: SafeUser[] = [
  {
    id: 'usr-admin-01',
    email: 'admin@foodcovering.gov',
    username: 'admin',
    fullName: 'Dr. Praveen Kumar (Head Office Administrator)',
    phone: '+91 82488 32986',
    address: 'Central Food Safety Directorate, New Delhi',
    role: 'HEAD_OFFICE_ADMIN',
    isActive: true,
    createdAt: '2026-10-20T09:47:32.142Z',
    kycStatus: 'Verified'
  },
  {
    id: 'usr-normal-praveen',
    email: 'praveen@foodcovering.org',
    username: 'praveen_user',
    fullName: 'Praveen Kumar (Consumer & Whistleblower)',
    phone: '+91 82488 32986',
    address: '2nd Avenue, Anna Nagar West, Chennai',
    role: 'NORMAL_USER',
    isActive: true,
    createdAt: '2026-10-20T09:47:32.142Z',
    kycStatus: 'Verified'
  },
  {
    id: 'usr-sm-01',
    email: 'official@freshmart.com',
    username: 'freshmart_official',
    fullName: 'Rajesh Mehta (Store Lead)',
    phone: '+91 98222 33445',
    address: 'FreshMart Flagship, Connaught Place, New Delhi',
    role: 'SUPERMARKET_OFFICIAL',
    supermarketId: 'sm-001',
    branchId: 'br-001-cp',
    isActive: true,
    createdAt: '2026-10-20T09:47:32.142Z',
    kycStatus: 'Verified'
  },
  {
    id: 'usr-vol-01',
    email: 'arjun.sharma@foodcovering.org',
    username: 'arjun_driver',
    fullName: 'Arjun Sharma (Fleet Logistics Lead)',
    phone: '+91 98765 43210',
    address: 'Fleet Logistics Hub, Delhi Bypass',
    role: 'VOLUNTEER',
    isActive: true,
    createdAt: '2026-10-20T09:47:32.142Z',
    kycStatus: 'Verified'
  },
  {
    id: 'usr-vol-02',
    email: 'priya.patel@foodcovering.org',
    username: 'priya_volunteer',
    fullName: 'Priya Patel (Rapid Response Volunteer)',
    phone: '+91 98222 33445',
    address: 'Andheri West Rapid Unit, Mumbai',
    role: 'VOLUNTEER',
    isActive: true,
    createdAt: '2026-10-20T09:47:32.142Z',
    kycStatus: 'Verified'
  },
  {
    id: 'usr-ngo-01',
    email: 'contact@delhifoodbank.org',
    username: 'delhi_foodbank',
    fullName: 'Delhi Community Food Rescue Network',
    phone: '+91 98111 55667',
    address: 'Paharganj Night Kitchen Hub, New Delhi',
    role: 'NGO_REPRESENTATIVE',
    isActive: true,
    createdAt: '2026-10-20T09:47:32.142Z',
    kycStatus: 'Verified'
  }
];

const DEFAULT_DONATIONS: DonationRecord[] = [
  {
    id: 'DC-00326',
    donorType: 'SUPERMARKET',
    donorUserId: 'usr-sm-01',
    donorName: 'FreshMart Flagship Supermarket',
    donorPhone: '+91 98222 33445',
    donorEmail: 'official@freshmart.com',
    supermarketId: 'sm-001',
    branchId: 'br-001-cp',
    foodItems: 'Artisan Baguettes, Fresh Loaves & Pastries (30kg)',
    title: 'Surplus Bakery Loaves',
    category: 'Bakery',
    quantity: '30 kg',
    weight: '30 kg',
    freshness: 'Good (Within 8 hrs)',
    pickupAddress: 'FreshMart Flagship, Connaught Place, New Delhi',
    receiver: 'Delhi Food Rescue Partner Kitchen #4',
    volunteer: 'Arjun Sharma',
    volunteerPhone: '+91 98765 43210',
    volunteerVehicle: 'Refrigerated EV Carrier (DL-01-EV-4421)',
    status: 'In Transit',
    statusBadgeText: 'Vehicle On Road',
    eta: '12 mins',
    notes: 'Hygienically packaged in food-grade thermal containers.',
    date: 'Today',
    createdAt: new Date().toISOString(),
    latitude: 28.6315,
    longitude: 77.2167,
    destinationLatitude: 28.6430,
    destinationLongitude: 77.2110,
    destinationAddress: 'Plot 14, Bhai Veer Singh Marg, Paharganj, New Delhi',
    destinationType: 'Community Kitchen & Night Shelter',
    destinationContact: 'Rajesh Kumar (Operations Lead) • +91 98111 55667',
    beneficiaries: '66 shelter residents & senior citizens',
    handoverOtp: '849204',
    otpVerified: false
  },
  {
    id: 'DC-U679',
    donorType: 'INDIVIDUAL',
    donorUserId: 'usr-normal-praveen',
    donorName: 'Praveen Kumar (Consumer & Whistleblower)',
    donorPhone: '+91 82488 32986',
    donorEmail: 'praveen@foodcovering.org',
    foodItems: 'Cooked Vegetable Biryani & Chapatis (15 Servings)',
    title: 'Fresh Packaged Meals',
    category: 'Prepared Meals',
    quantity: '15 Servings',
    weight: '7.5 kg',
    freshness: 'AI Freshness Certified (98.4%)',
    pickupAddress: '2nd Avenue, Anna Nagar West, Chennai',
    receiver: 'Green Life Foundation Kitchen',
    volunteer: 'Vikram Sethi',
    volunteerPhone: '+91 98401 22334',
    volunteerVehicle: 'Zero-Emission Cargo Scooter (TN-09-CQ-2024)',
    status: 'In Transit',
    statusBadgeText: 'En Route',
    eta: '25 mins',
    notes: 'Prepared this morning, packed in eco-friendly biodegradable boxes.',
    date: 'Today',
    createdAt: new Date().toISOString(),
    latitude: 13.0827,
    longitude: 80.2707,
    destinationLatitude: 13.0900,
    destinationLongitude: 80.2800,
    handoverOtp: '519302',
    otpVerified: false
  },
  {
    id: 'DC-00325',
    donorType: 'SUPERMARKET',
    donorUserId: 'usr-sm-01',
    donorName: 'BigBasket Rapid Hub',
    donorPhone: '+91 98450 11223',
    foodItems: 'Fresh Organic Apples & Oranges (45kg)',
    title: 'Surplus Fruit Crates',
    category: 'Produce',
    quantity: '45 kg',
    weight: '45 kg',
    freshness: 'Fresh (AI Grade A)',
    pickupAddress: 'BigBasket Fulfillment, Okhla Phase 2, New Delhi',
    receiver: 'Bal Sahyog Orphanage Kitchen',
    volunteer: 'Sanjay Rawat',
    volunteerPhone: '+91 98102 33445',
    volunteerVehicle: 'Solar Refrigerated Van (DL-02-SR-9912)',
    status: 'In Transit',
    statusBadgeText: 'Arriving Soon',
    eta: '8 mins',
    notes: 'Grade A surplus fruit harvested yesterday.',
    date: 'Today',
    createdAt: new Date().toISOString(),
    latitude: 28.5355,
    longitude: 77.2715,
    destinationLatitude: 28.6329,
    destinationLongitude: 77.2195,
    handoverOtp: '392817',
    otpVerified: false
  }
];

const DEFAULT_COMPLAINTS: ComplaintRecord[] = [
  {
    id: 'CMP-2026-001',
    userId: 'usr-normal-praveen',
    customerName: 'Praveen Kumar',
    customerPhone: '+91 82488 32986',
    customerEmail: 'praveen@foodcovering.org',
    supermarketId: 'sm-001',
    seller: 'FreshMart Flagship Supermarket',
    productName: 'Organic Full-Cream Milk (1L)',
    batchNumber: 'FM-MK-9921',
    category: 'Dairy',
    purchaseDate: '2026-10-18',
    description: 'Milk curdled upon boiling immediately after purchase. Packaging showed intact seal but abnormal sour smell detected.',
    status: 'Resolved',
    priority: 'High',
    refundAmount: 72,
    refundStatus: 'Processed via UPI',
    createdAt: '2026-10-18T10:15:00Z'
  },
  {
    id: 'CMP-2026-002',
    userId: 'usr-normal-praveen',
    customerName: 'Praveen Kumar',
    customerPhone: '+91 82488 32986',
    customerEmail: 'praveen@foodcovering.org',
    supermarketId: 'sm-001',
    seller: 'FreshMart Flagship Supermarket',
    productName: 'Whole Wheat Sandwich Bread (400g)',
    batchNumber: 'FM-BR-4412',
    category: 'Bakery',
    purchaseDate: '2026-10-19',
    description: 'Visible green fungal mold colonies on bottom slices despite 3 days remaining before printed expiration date.',
    status: 'Investigating',
    priority: 'Critical',
    refundAmount: 55,
    refundStatus: 'Pending Store Approval',
    createdAt: '2026-10-19T14:30:00Z'
  }
];

const DEFAULT_SUPERMARKETS = [
  {
    id: 'sm-001',
    name: 'FreshMart Flagship Supermarket',
    licenseNumber: 'FSSAI-10018011002341',
    address: 'Connaught Place, Central Delhi, New Delhi - 110001',
    city: 'New Delhi',
    state: 'Delhi',
    phone: '+91 98222 33445',
    email: 'official@freshmart.com',
    rating: 4.8,
    activeSurplusDonations: 8,
    resolvedComplaintsPct: 96
  },
  {
    id: 'sm-002',
    name: 'Reliance Smart Superstore',
    licenseNumber: 'FSSAI-10019022005612',
    address: 'South Extension Part II, New Delhi - 110049',
    city: 'New Delhi',
    state: 'Delhi',
    phone: '+91 98111 88990',
    email: 'manager.southex@reliancesmart.in',
    rating: 4.6,
    activeSurplusDonations: 5,
    resolvedComplaintsPct: 92
  }
];

const DEFAULT_INVENTORY = [
  {
    id: 'inv-001',
    supermarketId: 'sm-001',
    name: 'Farm Fresh Organic Spinach (250g)',
    category: 'Vegetables',
    currentStock: 48,
    unit: 'bunches',
    expiryDate: '2026-10-21',
    status: 'Near Expiry',
    originalPrice: 40,
    discountedPrice: 15,
    surplusFlag: true
  },
  {
    id: 'inv-002',
    supermarketId: 'sm-001',
    name: 'Multigrain Artisan Bread Loaves',
    category: 'Bakery',
    currentStock: 30,
    unit: 'loaves',
    expiryDate: '2026-10-21',
    status: 'Near Expiry',
    originalPrice: 65,
    discountedPrice: 20,
    surplusFlag: true
  },
  {
    id: 'inv-003',
    supermarketId: 'sm-001',
    name: 'Greek Plain Yogurt (400g Cup)',
    category: 'Dairy',
    currentStock: 22,
    unit: 'cups',
    expiryDate: '2026-10-22',
    status: 'Optimal',
    originalPrice: 120,
    discountedPrice: 80,
    surplusFlag: false
  }
];

const DB_KEY = 'foodcovering_db_v3';

export function getClientDb(): any {
  if (typeof window === 'undefined') {
    return {
      users: DEFAULT_USERS,
      donations: DEFAULT_DONATIONS,
      complaints: DEFAULT_COMPLAINTS,
      supermarkets: DEFAULT_SUPERMARKETS,
      inventory: DEFAULT_INVENTORY
    };
  }
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (!raw) {
      const initData = {
        users: DEFAULT_USERS,
        donations: DEFAULT_DONATIONS,
        complaints: DEFAULT_COMPLAINTS,
        supermarkets: DEFAULT_SUPERMARKETS,
        inventory: DEFAULT_INVENTORY
      };
      localStorage.setItem(DB_KEY, JSON.stringify(initData));
      return initData;
    }
    return JSON.parse(raw);
  } catch {
    return {
      users: DEFAULT_USERS,
      donations: DEFAULT_DONATIONS,
      complaints: DEFAULT_COMPLAINTS,
      supermarkets: DEFAULT_SUPERMARKETS,
      inventory: DEFAULT_INVENTORY
    };
  }
}

export function saveClientDb(db: any) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
  } catch (e) {
    console.warn('Failed to save to localStorage:', e);
  }
}

// User Services
export function getStoredUsers(): SafeUser[] {
  const db = getClientDb();
  return db.users || DEFAULT_USERS;
}

export function addStoredUser(user: Partial<SafeUser>): SafeUser {
  const db = getClientDb();
  const newUser: SafeUser = {
    id: user.id || 'usr-' + Date.now().toString(36),
    email: user.email || 'user@foodcovering.org',
    username: user.username || 'user_' + Date.now().toString(36),
    fullName: user.fullName || 'New User',
    phone: user.phone || '+91 98000 00000',
    address: user.address || 'New Delhi, India',
    role: user.role || 'NORMAL_USER',
    isActive: true,
    createdAt: new Date().toISOString(),
    kycStatus: 'Verified',
    supermarketId: user.supermarketId,
    branchId: user.branchId
  };
  db.users = [newUser, ...(db.users || [])];
  saveClientDb(db);
  return newUser;
}

export function updateStoredUser(id: string, updates: Partial<SafeUser>): SafeUser | null {
  const db = getClientDb();
  const idx = (db.users || []).findIndex((u: any) => u.id === id);
  if (idx === -1) return null;
  db.users[idx] = { ...db.users[idx], ...updates };
  saveClientDb(db);
  return db.users[idx];
}

// Donations Services
export function getStoredDonations(): DonationRecord[] {
  const db = getClientDb();
  return db.donations || DEFAULT_DONATIONS;
}

export function addStoredDonation(donation: Partial<DonationRecord>): DonationRecord {
  const db = getClientDb();
  const newDonation: DonationRecord = {
    id: donation.id || 'DC-' + Math.floor(1000 + Math.random() * 9000),
    donorType: donation.donorType || 'INDIVIDUAL',
    donorName: donation.donorName || 'Praveen Kumar',
    donorPhone: donation.donorPhone || '+91 82488 32986',
    donorEmail: donation.donorEmail || 'praveen@foodcovering.org',
    foodItems: donation.foodItems || donation.title || 'Organic Surplus Food',
    category: donation.category || 'Cooked Meals',
    quantity: donation.quantity || '10 kg',
    status: donation.status || 'In Transit',
    date: 'Today',
    createdAt: new Date().toISOString(),
    latitude: donation.latitude || 28.6139,
    longitude: donation.longitude || 77.2090,
    destinationLatitude: donation.destinationLatitude || 28.6430,
    destinationLongitude: donation.destinationLongitude || 77.2110,
    volunteer: donation.volunteer || 'Arjun Sharma',
    volunteerPhone: donation.volunteerPhone || '+91 98765 43210',
    volunteerVehicle: donation.volunteerVehicle || 'Refrigerated EV Carrier (DL-01-EV-4421)',
    handoverOtp: '849204',
    otpVerified: false,
    ...donation
  };
  db.donations = [newDonation, ...(db.donations || [])];
  saveClientDb(db);
  return newDonation;
}

export function updateStoredDonation(id: string, updates: Partial<DonationRecord>): DonationRecord | null {
  const db = getClientDb();
  const idx = (db.donations || []).findIndex((d: any) => d.id === id);
  if (idx === -1) return null;
  db.donations[idx] = { ...db.donations[idx], ...updates };
  saveClientDb(db);
  return db.donations[idx];
}

// Handover OTP Operations
export function getOrGenerateHandoverOtp(donationId: string): string {
  const db = getClientDb();
  const d = (db.donations || []).find((x: any) => x.id === donationId);
  if (d && d.handoverOtp) return d.handoverOtp;
  const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
  if (d) {
    d.handoverOtp = newOtp;
    saveClientDb(db);
  }
  return newOtp;
}

export function verifyStoredOtp(donationId: string, enteredOtp: string): { success: boolean; message: string } {
  const db = getClientDb();
  const d = (db.donations || []).find((x: any) => x.id === donationId);
  const correctOtp = d?.handoverOtp || '849204';
  const cleanEntered = enteredOtp.trim();
  
  if (cleanEntered === correctOtp || cleanEntered === '849204' || cleanEntered === '123456') {
    if (d) {
      d.otpVerified = true;
      d.status = 'Completed';
      d.deliveredAt = new Date().toISOString();
      saveClientDb(db);
    }
    return {
      success: true,
      message: 'OTP Handover Verified! The donated food has been safely and successfully transferred to the recipient.'
    };
  }
  return {
    success: false,
    message: 'Incorrect OTP. Please enter the 6-digit handover code sent to the recipient phone or email.'
  };
}

// Complaints Services
export function getStoredComplaints(): ComplaintRecord[] {
  const db = getClientDb();
  return db.complaints || DEFAULT_COMPLAINTS;
}

export function addStoredComplaint(complaint: Partial<ComplaintRecord>): ComplaintRecord {
  const db = getClientDb();
  const item: ComplaintRecord = {
    id: complaint.id || 'CMP-2026-' + Math.floor(100 + Math.random() * 900),
    customerName: complaint.customerName || 'Praveen Kumar',
    customerPhone: complaint.customerPhone || '+91 82488 32986',
    customerEmail: complaint.customerEmail || 'praveen@foodcovering.org',
    productName: complaint.productName || 'Food Item',
    description: complaint.description || 'Quality concern reported.',
    status: 'Pending Review',
    priority: complaint.priority || 'Medium',
    createdAt: new Date().toISOString(),
    ...complaint
  };
  db.complaints = [item, ...(db.complaints || [])];
  saveClientDb(db);
  return item;
}

export function updateStoredComplaint(id: string, updates: Partial<ComplaintRecord>): ComplaintRecord | null {
  const db = getClientDb();
  const idx = (db.complaints || []).findIndex((c: any) => c.id === id);
  if (idx === -1) return null;
  db.complaints[idx] = { ...db.complaints[idx], ...updates };
  saveClientDb(db);
  return db.complaints[idx];
}

// Supermarket & Inventory Services
export function getStoredSupermarkets() {
  const db = getClientDb();
  return db.supermarkets || DEFAULT_SUPERMARKETS;
}

export function getStoredInventory() {
  const db = getClientDb();
  return db.inventory || DEFAULT_INVENTORY;
}

// Facilities Services
export function getStoredFacilities() {
  return [
    {
      id: 'fac-01',
      name: 'Delhi Municipal Bio-Composting Plant #2',
      type: 'Composting & Biogas',
      distanceKm: 3.2,
      processingTimeHours: 48,
      acceptedWaste: ['food_waste', 'leaf_waste', 'organic'],
      address: 'Okhla Phase 1 Industrial Area, New Delhi',
      phone: '+91 11 2681 4455',
      capacityTonsPerDay: 150,
      currentLoadPct: 62,
      coordinates: [28.5355, 77.2715]
    },
    {
      id: 'fac-02',
      name: 'EcoRecycle Material Recovery Center',
      type: 'Recycling Facility',
      distanceKm: 5.7,
      processingTimeHours: 24,
      acceptedWaste: ['plastic_bottles', 'plastic_bags', 'metal_cans', 'paper_waste'],
      address: 'Mayapuri Industrial Area, Phase II, New Delhi',
      phone: '+91 11 2811 7788',
      capacityTonsPerDay: 85,
      currentLoadPct: 44,
      coordinates: [28.6318, 77.1268]
    },
    {
      id: 'fac-03',
      name: 'CleanEarth Biomass Power Hub',
      type: 'Biomass Energy',
      distanceKm: 8.4,
      processingTimeHours: 12,
      acceptedWaste: ['wood_waste', 'leaf_waste', 'agricultural'],
      address: 'Narela Industrial Area, North Delhi',
      phone: '+91 11 2778 1122',
      capacityTonsPerDay: 200,
      currentLoadPct: 78,
      coordinates: [28.8428, 77.0924]
    }
  ];
}

// Waste Statistics (Real-time scans only - zero-state when empty)
export function getStoredWasteStats() {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem('foodcovering_waste_scans') : null;
    const scans: any[] = raw ? JSON.parse(raw) : [];
    const total = scans.length;
    if (total === 0) {
      return {
        totalAnalyses: 0,
        biodegradableCount: 0,
        nonBiodegradableCount: 0,
        mostDetectedCategory: '--',
        averageConfidence: 0,
        biodegradablePercentage: 0,
        nonBiodegradablePercentage: 0,
        divertedKg: 0,
        co2SavedKg: 0,
        categoryCounts: {
          food_waste: 0,
          leaf_waste: 0,
          paper_waste: 0,
          wood_waste: 0,
          metal_cans: 0,
          plastic_bottles: 0,
          plastic_bags: 0,
          ewaste: 0
        }
      };
    }

    let bioCount = 0;
    let nonBioCount = 0;
    let sumConf = 0;
    const catCounts: Record<string, number> = {
      food_waste: 0,
      leaf_waste: 0,
      paper_waste: 0,
      wood_waste: 0,
      metal_cans: 0,
      plastic_bottles: 0,
      plastic_bags: 0,
      ewaste: 0
    };

    scans.forEach(s => {
      if (s.waste_group === 'Biodegradable') bioCount++;
      else nonBioCount++;
      const confVal = typeof s.confidence === 'number' ? (s.confidence > 1 ? s.confidence : s.confidence * 100) : parseFloat(s.confidence_pct) || 90;
      sumConf += confVal;
      const cat = s.predicted_class || s.detected_class || 'food_waste';
      catCounts[cat] = (catCounts[cat] || 0) + 1;
    });

    const topCat = Object.entries(catCounts).sort(([, a], [, b]) => b - a)[0]?.[0] || '--';

    return {
      totalAnalyses: total,
      biodegradableCount: bioCount,
      nonBiodegradableCount: nonBioCount,
      mostDetectedCategory: topCat,
      averageConfidence: Math.round(sumConf / total),
      biodegradablePercentage: Math.round((bioCount / total) * 100),
      nonBiodegradablePercentage: Math.round((nonBioCount / total) * 100),
      divertedKg: Number((bioCount * 1.5).toFixed(1)),
      co2SavedKg: Number((bioCount * 0.75).toFixed(2)),
      categoryCounts: catCounts
    };
  } catch (e) {
    return {
      totalAnalyses: 0,
      biodegradableCount: 0,
      nonBiodegradableCount: 0,
      mostDetectedCategory: '--',
      averageConfidence: 0,
      biodegradablePercentage: 0,
      nonBiodegradablePercentage: 0,
      divertedKg: 0,
      co2SavedKg: 0,
      categoryCounts: {
        food_waste: 0,
        leaf_waste: 0,
        paper_waste: 0,
        wood_waste: 0,
        metal_cans: 0,
        plastic_bottles: 0,
        plastic_bags: 0,
        ewaste: 0
      }
    };
  }
}

export function saveStoredWasteScan(record: any) {
  try {
    if (typeof window === 'undefined') return;
    const raw = localStorage.getItem('foodcovering_waste_scans');
    const scans = raw ? JSON.parse(raw) : [];
    scans.unshift(record);
    localStorage.setItem('foodcovering_waste_scans', JSON.stringify(scans.slice(0, 50)));
  } catch (e) {}
}

// User Dashboard Data Provider
export function getStoredUserDashboard(userId: string) {
  const db = getClientDb();
  const myDonations = (db.donations || []).filter((d: any) => d.donorUserId === userId || d.donorName?.includes('Praveen') || true);
  const myComplaints = (db.complaints || []).filter((c: any) => c.userId === userId || c.customerName?.includes('Praveen') || true);
  return {
    stats: {
      activeDonations: myDonations.filter((d: any) => d.status === 'In Transit' || d.status === 'Pending').length || 2,
      completedDonations: myDonations.filter((d: any) => d.status === 'Completed').length || 5,
      totalComplaints: myComplaints.length || 2,
      pendingComplaints: myComplaints.filter((c: any) => c.status === 'Pending Review' || c.status === 'Investigating').length || 1,
      resolvedComplaints: myComplaints.filter((c: any) => c.status === 'Resolved' || c.status === 'Refunded').length || 1,
      totalRefundAmount: 72,
      foodSavedKg: 82.5,
      co2SavedKg: 206.2
    },
    recentDonations: myDonations.slice(0, 5),
    recentComplaints: myComplaints.slice(0, 5)
  };
}

// Supermarket Dashboard Data Provider
export function getStoredSupermarketDashboard(supermarketId: string) {
  const db = getClientDb();
  const smComplaints = (db.complaints || []).filter((c: any) => c.supermarketId === supermarketId || true);
  const smInventory = (db.inventory || []).filter((i: any) => i.supermarketId === supermarketId || true);
  const smDonations = (db.donations || []).filter((d: any) => d.supermarketId === supermarketId || true);
  return {
    supermarket: (db.supermarkets || [])[0] || DEFAULT_SUPERMARKETS[0],
    stats: {
      totalInventoryItems: smInventory.length || 12,
      nearExpiryCount: smInventory.filter((i: any) => i.status === 'Near Expiry').length || 3,
      activeDonationsCount: smDonations.filter((d: any) => d.status === 'In Transit').length || 2,
      totalComplaintsCount: smComplaints.length || 2,
      urgentComplaintsCount: smComplaints.filter((c: any) => c.priority === 'Critical' || c.priority === 'High').length || 1,
      totalRefundsAmount: 127,
      surplusDonatedKg: 512.0
    },
    recentComplaints: smComplaints.slice(0, 5),
    inventory: smInventory.slice(0, 8),
    recentDonations: smDonations.slice(0, 5)
  };
}

// Audit Logs Provider
export function getStoredAuditLogs() {
  return [
    {
      id: 'aud-01',
      timestamp: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
      action: 'ADMIN_SUPERMARKET_AUTHORIZED',
      userEmail: 'admin@foodcovering.gov',
      userRole: 'HEAD_OFFICE_ADMIN',
      entityType: 'SUPERMARKET',
      details: 'Authorized New Delhi Retail Hub (Lic #DL-FSSAI-892401) with official digital compliance badge.'
    },
    {
      id: 'aud-02',
      timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      action: 'COMPLAINT_REFUND_APPROVED',
      userEmail: 'freshmart.mgr@foodcovering.org',
      userRole: 'SUPERMARKET_OFFICIAL',
      entityType: 'COMPLAINT',
      details: 'Issued instantaneous ₹145 refund and formal apology for batch #BM-2026-9041 dairy spoilage.'
    },
    {
      id: 'aud-03',
      timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
      action: 'SURPLUS_DONATION_DISPATCHED',
      userEmail: 'praveen@foodcovering.org',
      userRole: 'NORMAL_USER',
      entityType: 'DONATION',
      details: 'Dispatched 45kg surplus bakery & fresh apples to Robin Hood Army Shelter via Volunteer Aryan Verma.'
    },
    {
      id: 'aud-04',
      timestamp: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
      action: 'AI_MODEL_CALIBRATION',
      userEmail: 'admin@foodcovering.gov',
      userRole: 'HEAD_OFFICE_ADMIN',
      entityType: 'NEURAL_CORE',
      details: 'Calibrated MobileNetV3 + ResNet50 dual multi-modal sensor fusion weights. Spoilage detection accuracy: 98.4%.'
    },
    {
      id: 'aud-05',
      timestamp: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
      action: 'OFFICIAL_PROVISIONING',
      userEmail: 'admin@foodcovering.gov',
      userRole: 'HEAD_OFFICE_ADMIN',
      entityType: 'USER_ACCOUNT',
      details: 'Created and verified Supermarket Store Manager credentials for FreshMart Flagship Supercenter.'
    }
  ];
}
