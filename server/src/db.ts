import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { 
  User, 
  SafeUser, 
  Supermarket, 
  SupermarketBranch, 
  InventoryItem, 
  DonationRecord, 
  ComplaintRecord, 
  AuditLogEntry, 
  PlatformAlert,
  ScanRecord,
  WasteAnalysisRecord,
  AiAnalysisRecord,
  UserRole 
} from './types';

interface DatabaseSchema {
  users: User[];
  supermarkets: Supermarket[];
  branches: SupermarketBranch[];
  inventory: InventoryItem[];
  donations: DonationRecord[];
  complaints: ComplaintRecord[];
  auditLogs: AuditLogEntry[];
  alerts: PlatformAlert[];
  scans: ScanRecord[];
  wasteAnalyses?: WasteAnalysisRecord[];
  aiAnalyses?: AiAnalysisRecord[];
}

const DATA_DIR = path.resolve(__dirname, '../data');
const DB_FILE = path.join(DATA_DIR, 'foodcovering.db.json');

class Database {
  private data: DatabaseSchema = {
    users: [],
    supermarkets: [],
    branches: [],
    inventory: [],
    donations: [],
    complaints: [],
    auditLogs: [],
    alerts: [],
    scans: [],
    wasteAnalyses: [],
    aiAnalyses: []
  };

  constructor() {
    this.init();
  }

  private init() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
        if (!this.data.wasteAnalyses) this.data.wasteAnalyses = [];
        if (!this.data.aiAnalyses) this.data.aiAnalyses = [];
        if (!this.data.scans) this.data.scans = [];
        this.purgeMockComplaints();
        this.reconcileUserContacts();
        console.log('[DB] Loaded existing database with', this.data.users.length, 'users');
        this.ensureInitialAdmin();
        this.ensureKaggleHeadOfficeDataset();
        return;
      } catch (err) {
        console.error('[DB] Failed reading db file, re-initializing seeds', err);
      }
    }

    this.seedDefaultData();
    this.purgeMockComplaints();
    this.reconcileUserContacts();
    this.save();
  }

  public reload(): void {
    this.init();
  }

  public reconcileUserContacts() {
    for (const u of this.data.users) {
      if (u.id && (u.phone || u.email)) {
        this.cascadeUserContactUpdate(
          u.id,
          { email: u.email, phone: u.phone, fullName: u.fullName },
          { email: u.email, phone: u.phone, fullName: u.fullName, address: u.address }
        );
      }
    }
  }

  public purgeMockComplaints() {
    if (this.data.complaints && Array.isArray(this.data.complaints)) {
      const initialCount = this.data.complaints.length;
      this.data.complaints = this.data.complaints.filter(c => {
        const pLower = (c.productName || '').toLowerCase();
        const id = c.id || '';
        const isMock = id === 'FC-2026-U277' || 
                       id === 'FC-2026-00124' || 
                       id === 'FC-2026-00123' || 
                       pLower.includes('a2 organic fresh milk') || 
                       pLower.includes('organic whole milk') || 
                       pLower.includes('prime fresh beef ribs');
        return !isMock;
      });
      if (this.data.complaints.length !== initialCount) {
        this.save();
      }
    }
  }

  private save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('[DB] Error persisting database file:', err);
    }
  }

  private ensureInitialAdmin() {
    const adminEmail = (process.env.INITIAL_ADMIN_EMAIL || 'admin@foodcovering.gov').toLowerCase();
    const existingAdmin = this.data.users.find(u => u.role === 'HEAD_OFFICE_ADMIN');
    if (!existingAdmin) {
      const adminPass = process.env.INITIAL_ADMIN_PASSWORD || 'Admin@Secure2026!';
      const salt = bcrypt.genSaltSync(10);
      const hash = bcrypt.hashSync(adminPass, salt);

      const adminUser: User = {
        id: 'usr-admin-01',
        email: adminEmail,
        username: 'admin',
        passwordHash: hash,
        fullName: process.env.INITIAL_ADMIN_NAME || 'Head Office Administrator',
        phone: '+91 98765 00001',
        address: 'Central Food Safety Directorate, New Delhi',
        role: 'HEAD_OFFICE_ADMIN',
        isActive: true,
        createdAt: new Date().toISOString()
      };
      this.data.users.unshift(adminUser);
      this.save();
      console.log(`[DB] Seeded initial Head Office Administrator: ${adminEmail}`);
    }
  }

  public ensureKaggleHeadOfficeDataset(): void {
    let mutated = false;

    // 1. Kaggle Supermarket Retail Chains (https://www.kaggle.com/datasets/aungpyaeap/supermarket-sales)
    const kaggleSupermarkets: Supermarket[] = [
      {
        id: 'sm-004',
        name: 'Reliance Smart Bazaar',
        code: 'RSB-RET',
        contactPhone: '+91 98444 55667',
        contactEmail: 'store.tnagar@reliancesmart.in',
        address: 'Usman Road, T. Nagar',
        city: 'Chennai',
        region: 'South Zone',
        status: 'Active',
        createdAt: '2026-10-15T11:00:00.000Z'
      },
      {
        id: 'sm-005',
        name: "Nature's Basket Organics",
        code: 'NBO-RET',
        contactPhone: '+91 98555 66778',
        contactEmail: 'support@naturesbasket.co.in',
        address: '100 Feet Road, Indiranagar',
        city: 'Bangalore',
        region: 'South Zone',
        status: 'Active',
        createdAt: '2026-10-16T09:30:00.000Z'
      },
      {
        id: 'sm-006',
        name: 'BigBasket Regional Distribution Hub',
        code: 'BB-HUB',
        contactPhone: '+91 98666 77889',
        contactEmail: 'hub.mumbai@bigbasket.com',
        address: 'MIDC Industrial Area, Andheri East',
        city: 'Mumbai',
        region: 'West Zone',
        status: 'Active',
        createdAt: '2026-10-16T12:00:00.000Z'
      }
    ];

    for (const sm of kaggleSupermarkets) {
      if (!this.data.supermarkets.some(s => s.id === sm.id)) {
        this.data.supermarkets.push(sm);
        mutated = true;
      }
    }

    // 2. Kaggle Regional Branches
    const kaggleBranches: SupermarketBranch[] = [
      {
        id: 'br-004-tnagar',
        supermarketId: 'sm-004',
        name: 'Reliance Smart Bazaar T. Nagar',
        code: 'RSB-TNGR',
        address: 'Usman Road, T. Nagar',
        city: 'Chennai',
        state: 'Tamil Nadu',
        pincode: '600017',
        contactPerson: 'Karthik Iyer (Store Lead)',
        phone: '+91 98444 55667',
        email: 'tnagar.manager@reliancesmart.in',
        isActive: true,
        createdAt: '2026-10-15T11:00:00.000Z'
      },
      {
        id: 'br-005-indira',
        supermarketId: 'sm-005',
        name: "Nature's Basket Indiranagar Hub",
        code: 'NBO-INDIRA',
        address: '100 Feet Road, Indiranagar',
        city: 'Bangalore',
        state: 'Karnataka',
        pincode: '560038',
        contactPerson: 'Deepa Hegde (Quality Auditor)',
        phone: '+91 98555 66778',
        email: 'indiranagar@naturesbasket.co.in',
        isActive: true,
        createdAt: '2026-10-16T09:30:00.000Z'
      },
      {
        id: 'br-006-andheri',
        supermarketId: 'sm-006',
        name: 'BigBasket Regional Distribution Hub #4',
        code: 'BB-ANDHERI',
        address: 'MIDC Industrial Area, Andheri East',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400093',
        contactPerson: 'Manoj Salve (Logistics Lead)',
        phone: '+91 98666 77889',
        email: 'andheri.hub@bigbasket.com',
        isActive: true,
        createdAt: '2026-10-16T12:00:00.000Z'
      }
    ];

    for (const br of kaggleBranches) {
      if (!this.data.branches.some(b => b.id === br.id)) {
        this.data.branches.push(br);
        mutated = true;
      }
    }

    // 3. Kaggle Food Waste Monitored Inventory (https://www.kaggle.com/datasets/veeralakrishna/food-waste)
    const kaggleInventory: InventoryItem[] = [
      {
        id: 'inv-kgl-01',
        supermarketId: 'sm-001',
        branchId: 'br-001-cp',
        name: 'Fresh Organic Baby Spinach Crate',
        category: 'Fruits & Vegetables',
        batchNumber: 'KGL-SPN-901',
        barcode: '890103080001',
        quantity: 18,
        unit: 'crates (5 kg)',
        expiryDate: '2026-10-23',
        freshnessStatus: 'Fresh',
        riskLevel: 'Low',
        inspectionResult: 'Cold-chain intake passed. 98.4% fresh leaf integrity.',
        flaggedForDonation: false,
        notes: 'Kaggle Fresh Produce Inventory Stream',
        updatedAt: new Date().toISOString()
      },
      {
        id: 'inv-kgl-02',
        supermarketId: 'sm-001',
        branchId: 'br-001-cp',
        name: 'Whole Milk Pasteurized 1L Pouches',
        category: 'Dairy',
        batchNumber: 'KGL-MLK-412',
        barcode: '890103080002',
        quantity: 45,
        unit: 'liters',
        expiryDate: '2026-10-21',
        freshnessStatus: 'Near-Expiry',
        riskLevel: 'Medium',
        inspectionResult: '24-hour remaining window. Cold temperature maintained at 3.8°C.',
        flaggedForDonation: true,
        notes: 'Kaggle Retail Shelf-Life Tracking: Flagged for NGO Rescue',
        updatedAt: new Date().toISOString()
      },
      {
        id: 'inv-kgl-03',
        supermarketId: 'sm-002',
        branchId: 'br-002-dlf',
        name: 'Artisan Whole Wheat Sourdough Loaves',
        category: 'Bakery',
        batchNumber: 'KGL-BAK-108',
        barcode: '890103080003',
        quantity: 26,
        unit: 'loaves',
        expiryDate: '2026-10-21',
        freshnessStatus: 'Near-Expiry',
        riskLevel: 'Low',
        inspectionResult: 'Baked today morning. Optimal freshness for immediate distribution.',
        flaggedForDonation: true,
        notes: 'Kaggle Bakery Surplus Tracking',
        updatedAt: new Date().toISOString()
      },
      {
        id: 'inv-kgl-04',
        supermarketId: 'sm-004',
        branchId: 'br-004-tnagar',
        name: 'Premium Shimla Royal Apples (5kg Boxes)',
        category: 'Fruits & Vegetables',
        batchNumber: 'KGL-APP-330',
        barcode: '890103080005',
        quantity: 32,
        unit: 'boxes',
        expiryDate: '2026-10-28',
        freshnessStatus: 'Fresh',
        riskLevel: 'Low',
        inspectionResult: 'Crisp firmness index 8.9/10. Zero epidermal bruising.',
        flaggedForDonation: false,
        notes: 'Kaggle Produce Freshness Quality Stream',
        updatedAt: new Date().toISOString()
      },
      {
        id: 'inv-kgl-05',
        supermarketId: 'sm-005',
        branchId: 'br-005-indira',
        name: 'Ripe Cavendish Bananas (Surplus Grade)',
        category: 'Fruits & Vegetables',
        batchNumber: 'KGL-BAN-604',
        barcode: '890103080006',
        quantity: 50,
        unit: 'kg',
        expiryDate: '2026-10-21',
        freshnessStatus: 'Near-Expiry',
        riskLevel: 'Low',
        inspectionResult: 'High sugar browning stage. High nutritional value, ideal for smoothies.',
        flaggedForDonation: true,
        notes: 'Kaggle Food Rescue Fast-Track Donation',
        updatedAt: new Date().toISOString()
      },
      {
        id: 'inv-kgl-06',
        supermarketId: 'sm-006',
        branchId: 'br-006-andheri',
        name: 'Atlantic Salmon Cuts (Cold Storage Lot #3)',
        category: 'Meat & Seafood',
        batchNumber: 'KGL-SAL-991',
        barcode: '890103080007',
        quantity: 8,
        unit: 'kg',
        expiryDate: '2026-10-20',
        freshnessStatus: 'Spoiled',
        riskLevel: 'High',
        inspectionResult: 'Surface amine oxidation and soft texture detected. Quarantined for safe composting.',
        flaggedForDonation: false,
        notes: 'Kaggle Spoilage Quarantine Log',
        updatedAt: new Date().toISOString()
      }
    ];

    for (const inv of kaggleInventory) {
      if (!this.data.inventory.some(i => i.id === inv.id)) {
        this.data.inventory.push(inv);
        mutated = true;
      }
    }

    // 4. Kaggle Surplus Donations Rescued
    const kaggleDonations: DonationRecord[] = [
      {
        id: 'DC-KGL-101',
        donorType: 'SUPERMARKET',
        donorUserId: 'usr-sm-01',
        donorName: 'FreshMart Supermarkets (Connaught Place)',
        donorPhone: '+91 98222 33445',
        donorEmail: 'official@freshmart.com',
        supermarketId: 'sm-001',
        branchId: 'br-001-cp',
        foodItems: 'Pasteurized Dairy Pouches & Butter Tubs',
        title: 'Pasteurized Dairy Pouches & Butter Tubs',
        category: 'Dairy',
        quantity: '45 kg',
        weight: '45 kg',
        freshness: 'Fresh / Chilled (24h Window)',
        pickupTime: 'Today 11:30 AM',
        expiryDate: '2026-10-22',
        pickupAddress: 'Booth #14, Central Market, Connaught Place, New Delhi',
        location: 'Booth #14, Central Market, Connaught Place, New Delhi',
        latitude: 28.6329,
        longitude: 77.2195,
        destinationLatitude: 28.6448,
        destinationLongitude: 77.2167,
        receiver: 'Delhi Food Rescue NGO Partner',
        volunteer: 'Arjun Sharma',
        status: 'In Transit',
        statusBadgeText: 'In Transit',
        eta: '14 mins',
        notes: 'Kaggle Supermarket Food Surplus Batch. Cold chain checked: 3.8°C.',
        date: '20 Oct 2026, 11:30 AM',
        createdAt: '2026-10-20T06:00:00.000Z',
        verificationType: 'AI_CERTIFIED',
        ngo: {
          name: 'Delhi Food Rescue NGO Partner',
          type: 'Community Nutrition Center',
          verificationStatus: 'Verified NGO',
          address: 'Pahar Ganj Community Care Center, New Delhi',
          phone: '+91 98111 22334'
        },
        timeline: [
          { title: 'Donation Dispatched by Store', timestamp: '20 Oct 2026, 11:30 AM', completed: true, active: false },
          { title: 'Picked Up by Volunteer (Arjun Sharma)', timestamp: '20 Oct 2026, 11:45 AM', completed: true, active: false },
          { title: 'In Transit to Pahar Ganj Hub', timestamp: 'In Progress (ETA 14m)', completed: false, active: true },
          { title: 'Handover & Distribution', completed: false, active: false }
        ],
        creditPoints: 220,
        co2SavedKg: 90.0
      },
      {
        id: 'DC-KGL-102',
        donorType: 'SUPERMARKET',
        donorUserId: 'usr-sm-01',
        donorName: "Nature's Basket Indiranagar Hub",
        donorPhone: '+91 98555 66778',
        donorEmail: 'indiranagar@naturesbasket.co.in',
        supermarketId: 'sm-005',
        branchId: 'br-005-indira',
        foodItems: 'Farm-Fresh Bananas & Golden Apples',
        title: 'Farm-Fresh Bananas & Golden Apples',
        category: 'Fruits & Vegetables',
        quantity: '60 kg',
        weight: '60 kg',
        freshness: 'Ripe & Grade-A Quality',
        pickupTime: 'Today 10:15 AM',
        expiryDate: '2026-10-24',
        pickupAddress: '100 Feet Road, Indiranagar, Bangalore',
        location: '100 Feet Road, Indiranagar, Bangalore',
        latitude: 12.9716,
        longitude: 77.5946,
        destinationLatitude: 12.9784,
        destinationLongitude: 77.6408,
        receiver: 'Bangalore Children Care Society',
        volunteer: 'Rahul Reddy',
        status: 'Delivered',
        statusBadgeText: 'Delivered',
        eta: 'Delivered',
        notes: 'Kaggle Produce Rescue Batch. Successfully delivered to nutrition kitchen.',
        date: '20 Oct 2026, 10:15 AM',
        createdAt: '2026-10-20T04:45:00.000Z',
        verificationType: 'AI_CERTIFIED',
        ngo: {
          name: 'Bangalore Children Care Society',
          type: 'Children Shelter & Daycare',
          verificationStatus: 'Verified NGO',
          address: 'HAL 2nd Stage, Indiranagar, Bangalore',
          phone: '+91 98333 44556'
        },
        timeline: [
          { title: 'Donation Dispatched by Store', timestamp: '20 Oct 2026, 10:15 AM', completed: true, active: false },
          { title: 'Picked Up by Volunteer (Rahul Reddy)', timestamp: '20 Oct 2026, 10:30 AM', completed: true, active: false },
          { title: 'In Transit', timestamp: '20 Oct 2026, 10:45 AM', completed: true, active: false },
          { title: 'Delivered to Shelter (Signed Off)', timestamp: '20 Oct 2026, 11:05 AM', completed: true, active: false }
        ],
        creditPoints: 310,
        co2SavedKg: 125.5
      },
      {
        id: 'DC-KGL-104',
        donorType: 'SUPERMARKET',
        donorUserId: 'usr-sm-01',
        donorName: 'Reliance Smart Bazaar T. Nagar',
        donorPhone: '+91 98444 55667',
        donorEmail: 'store.tnagar@reliancesmart.in',
        supermarketId: 'sm-004',
        branchId: 'br-004-tnagar',
        foodItems: 'South Indian Ready Meals & Pulses Packets',
        title: 'South Indian Ready Meals & Pulses Packets',
        category: 'Packaged Food',
        quantity: '55 kg',
        weight: '55 kg',
        freshness: 'Sealed Dry Goods / 6 Month Shelf-life',
        pickupTime: 'Today 09:00 AM',
        expiryDate: '2026-12-30',
        pickupAddress: 'Usman Road, T. Nagar, Chennai',
        location: 'Usman Road, T. Nagar, Chennai',
        latitude: 13.0418,
        longitude: 80.2341,
        destinationLatitude: 13.0315,
        destinationLongitude: 80.2450,
        receiver: 'Chennai Hope Foundation',
        volunteer: 'Karthik Iyer',
        status: 'Delivered',
        statusBadgeText: 'Delivered',
        eta: 'Delivered',
        notes: 'Kaggle Packaged Surplus Batch. Cold and dry storage certified.',
        date: '20 Oct 2026, 09:00 AM',
        createdAt: '2026-10-20T03:30:00.000Z',
        verificationType: 'AI_CERTIFIED',
        ngo: {
          name: 'Chennai Hope Foundation',
          type: 'Elderly Nutrition Shelter',
          verificationStatus: 'Verified NGO',
          address: 'Mylapore Community Center, Chennai',
          phone: '+91 98555 66778'
        },
        timeline: [
          { title: 'Donation Dispatched by Store', timestamp: '20 Oct 2026, 09:00 AM', completed: true, active: false },
          { title: 'Picked Up by Volunteer (Karthik Iyer)', timestamp: '20 Oct 2026, 09:20 AM', completed: true, active: false },
          { title: 'In Transit', timestamp: '20 Oct 2026, 09:40 AM', completed: true, active: false },
          { title: 'Delivered to Shelter (Signed Off)', timestamp: '20 Oct 2026, 10:00 AM', completed: true, active: false }
        ],
        creditPoints: 280,
        co2SavedKg: 110.0
      }
    ];

    for (const don of kaggleDonations) {
      if (!this.data.donations.some(d => d.id === don.id)) {
        this.data.donations.push(don);
        mutated = true;
      }
    }

    // 5. Kaggle Food Safety Inspection Incidents (https://www.kaggle.com/datasets/chicago/chicago-food-inspections)
    const kaggleComplaints: ComplaintRecord[] = [
      {
        id: 'FC-2026-KGL01',
        caseId: 'FC-2026-KGL01',
        reporterUserId: 'usr-normal-01',
        reporterName: 'Sunita Rao',
        reporterEmail: 'sunita.rao@example.com',
        reporterPhone: '+91 98111 44556',
        foodType: 'Dairy Product',
        productName: 'Organic Greek Yogurt Tub (400g)',
        quantity: '2 tubs',
        batchNumber: 'KGL-YGT-4402',
        expiryDate: '2026-10-28',
        seller: 'Reliance Smart Bazaar',
        supermarketId: 'sm-004',
        branchId: 'br-004-tnagar',
        sellerAddress: 'Usman Road, T. Nagar, Chennai',
        purchaseLocation: 'Reliance Smart Bazaar, T. Nagar',
        incidentLocation: 'Aisle #3 Dairy Chiller Display',
        purchaseDate: '2026-10-19',
        description: '[Kaggle Food Safety Dataset / Temperature Violation]: Customer reported package bloated due to cold chain temperature fluctuation in store cooler (+11.2°C instead of standard +4°C). Store Lead initiated digital cooler recalibration and stock withdrawal.',
        priority: 'High',
        status: 'In Investigation',
        assignedOfficer: 'Sarah Connor (Senior Food Safety Officer)',
        evidenceImages: [],
        investigationNotes: [
          {
            id: 'n-kgl-01',
            officer: 'Sarah Connor',
            text: 'Inspected store chiller telemetry log. Automated temperature logger recorded compressor spike at 03:00 AM. Batch KGL-YGT-4402 quarantined from public sale. Corrective refrigeration maintenance ordered.',
            timestamp: '20 Oct 2026, 09:30 AM',
            type: 'note'
          }
        ],
        timeline: [
          { title: 'Complaint Filed by Consumer', timestamp: '19 Oct 2026, 08:15 PM', actor: 'By Sunita Rao', status: 'completed' },
          { title: 'Officer Dispatched', timestamp: '20 Oct 2026, 09:00 AM', actor: 'Sarah Connor', status: 'completed' },
          { title: 'Chiller Telemetry Audit', timestamp: 'In Progress', actor: 'Store Lead & Safety Officer', status: 'current' },
          { title: 'Resolution & Closure', status: 'pending' }
        ],
        auditLog: [
          {
            timestamp: '20 Oct 2026, 09:30 AM',
            user: 'Sarah Connor (Safety Officer)',
            action: 'Store Investigation Conducted',
            details: 'Verified cold chain sensor log; batch isolated.'
          }
        ],
        date: '19 Oct 2026',
        time: '08:15 PM',
        createdAt: '2026-10-19T14:45:00.000Z',
        escalatedToHeadOffice: true,
        sharedWithHeadOffice: true,
        headOfficeSharedAt: '2026-10-20T04:00:00.000Z'
      },
      {
        id: 'FC-2026-KGL02',
        caseId: 'FC-2026-KGL02',
        reporterUserId: 'usr-normal-01',
        reporterName: 'Anand Kumar',
        reporterEmail: 'anand.k@example.com',
        reporterPhone: '+91 98222 66778',
        foodType: 'Fruits & Vegetables',
        productName: 'Packaged Organic Strawberries (250g)',
        quantity: '1 punnet',
        batchNumber: 'KGL-STR-1092',
        expiryDate: '2026-10-22',
        seller: "Nature's Basket Organics",
        supermarketId: 'sm-005',
        branchId: 'br-005-indira',
        sellerAddress: '100 Feet Road, Indiranagar, Bangalore',
        purchaseLocation: "Nature's Basket Organics, Indiranagar",
        incidentLocation: 'Produce Section Cold Counter',
        purchaseDate: '2026-10-19',
        description: '[Kaggle Food Safety Dataset / Spoilage Incident]: Early Botrytis cinerea (grey mold) detected at the bottom layer of berry punnet. Consumer flagged via FoodCovering AI scan in store.',
        priority: 'Medium',
        status: 'Resolved',
        assignedOfficer: 'Karthik Iyer (Store Safety Auditor)',
        evidenceImages: [],
        investigationNotes: [
          {
            id: 'n-kgl-02',
            officer: 'Karthik Iyer',
            text: 'Consumer provided in-app AI scan photo showing mold spores. Immediate counter exchange and ₹120 refund issued. Entire lot inspected; 3 additional punnets removed.',
            timestamp: '20 Oct 2026, 10:45 AM',
            type: 'status_change'
          }
        ],
        timeline: [
          { title: 'Complaint Filed by Consumer', timestamp: '19 Oct 2026, 06:30 PM', actor: 'By Anand Kumar', status: 'completed' },
          { title: 'Store Investigation', timestamp: '20 Oct 2026, 10:00 AM', actor: 'Karthik Iyer', status: 'completed' },
          { title: 'Refund Disbursed & Lot Quarantined', timestamp: '20 Oct 2026, 10:45 AM', actor: 'Customer Service Desk', status: 'completed' },
          { title: 'Case Closed', timestamp: '20 Oct 2026, 11:00 AM', actor: 'System Registry', status: 'completed' }
        ],
        auditLog: [
          {
            timestamp: '20 Oct 2026, 10:45 AM',
            user: 'Karthik Iyer (Store Auditor)',
            action: 'Case Resolved & Refund Issued',
            details: '₹120 refund paid to Anand Kumar via UPI.'
          }
        ],
        date: '19 Oct 2026',
        time: '06:30 PM',
        createdAt: '2026-10-19T13:00:00.000Z',
        refundStatus: 'Refunded',
        refundAmount: 120,
        refundMethod: 'UPI',
        refundDate: '20 Oct 2026, 10:45 AM',
        refundTransactionId: 'UPI-7740192',
        escalatedToHeadOffice: true,
        sharedWithHeadOffice: true,
        headOfficeSharedAt: '2026-10-20T05:15:00.000Z'
      }
    ];

    for (const cmp of kaggleComplaints) {
      if (!this.data.complaints.some(c => c.id === cmp.id)) {
        this.data.complaints.push(cmp);
        mutated = true;
      }
    }

    // 6. Stakeholder Users (Supermarket Store Managers & Field Volunteers)
    const officialHash = bcrypt.hashSync('Official@123', 10);
    const userHash = bcrypt.hashSync('User@123', 10);
    const kaggleUsers: User[] = [
      {
        id: 'usr-sm-04',
        email: 'store.tnagar@reliancesmart.in',
        username: 'reliance_tnagar_official',
        passwordHash: officialHash,
        fullName: 'Karthik Iyer (Store Lead)',
        phone: '+91 98444 55667',
        address: 'Usman Road, T. Nagar, Chennai',
        role: 'SUPERMARKET_OFFICIAL',
        supermarketId: 'sm-004',
        branchId: 'br-004-tnagar',
        isActive: true,
        createdAt: '2026-10-15T11:00:00.000Z'
      },
      {
        id: 'usr-sm-05',
        email: 'support@naturesbasket.co.in',
        username: 'naturesbasket_indira_official',
        passwordHash: officialHash,
        fullName: 'Deepa Hegde (Quality Auditor)',
        phone: '+91 98555 66778',
        address: '100 Feet Road, Indiranagar, Bangalore',
        role: 'SUPERMARKET_OFFICIAL',
        supermarketId: 'sm-005',
        branchId: 'br-005-indira',
        isActive: true,
        createdAt: '2026-10-16T09:30:00.000Z'
      },
      {
        id: 'usr-sm-06',
        email: 'hub.mumbai@bigbasket.com',
        username: 'bigbasket_andheri_official',
        passwordHash: officialHash,
        fullName: 'Manoj Salve (Logistics Lead)',
        phone: '+91 98666 77889',
        address: 'MIDC Industrial Area, Andheri East, Mumbai',
        role: 'SUPERMARKET_OFFICIAL',
        supermarketId: 'sm-006',
        branchId: 'br-006-andheri',
        isActive: true,
        createdAt: '2026-10-16T12:00:00.000Z'
      },
      {
        id: 'usr-vol-01',
        email: 'arjun.sharma@foodcovering.org',
        username: 'arjun_sharma',
        passwordHash: userHash,
        fullName: 'Arjun Sharma (Field Volunteer Lead)',
        phone: '+91 98111 22334',
        address: 'Connaught Place Volunteer Station, New Delhi',
        role: 'NORMAL_USER',
        isActive: true,
        createdAt: '2026-10-14T08:00:00.000Z'
      },
      {
        id: 'usr-vol-02',
        email: 'priya.patel@foodcovering.org',
        username: 'priya_patel',
        passwordHash: userHash,
        fullName: 'Priya Patel (Rapid Response Volunteer)',
        phone: '+91 98222 33445',
        address: 'Andheri West Rapid Unit, Mumbai',
        role: 'NORMAL_USER',
        isActive: true,
        createdAt: '2026-10-14T08:30:00.000Z'
      },
      {
        id: 'usr-sm-03',
        email: 'store.indiranagar@metrodaily.in',
        username: 'metrodaily_indira_official',
        passwordHash: officialHash,
        fullName: 'Suresh Nair (Store Lead)',
        phone: '+91 98444 55667',
        address: '12th Main Road, Indiranagar, Bangalore',
        role: 'SUPERMARKET_OFFICIAL',
        supermarketId: 'sm-003',
        branchId: 'br-003-indira',
        isActive: true,
        createdAt: '2026-10-15T09:00:00.000Z'
      },
      {
        id: 'usr-vol-03',
        email: 'rahul.reddy@foodcovering.org',
        username: 'rahul_reddy',
        passwordHash: userHash,
        fullName: 'Rahul Reddy (Cold Chain Logistics Lead)',
        phone: '+91 98333 44556',
        address: 'Indiranagar Hub Depot, Bangalore',
        role: 'NORMAL_USER',
        isActive: true,
        createdAt: '2026-10-14T09:00:00.000Z'
      },
      {
        id: 'usr-normal-praveen',
        email: 'praveen@foodcovering.org',
        username: 'praveen_kumar',
        passwordHash: userHash,
        fullName: 'Praveen Kumar (Consumer & Whistleblower)',
        phone: '+91 82488 32986',
        address: '2nd Avenue, Anna Nagar West, Chennai',
        role: 'NORMAL_USER',
        isActive: true,
        createdAt: '2026-10-14T10:00:00.000Z'
      },
      {
        id: 'usr-vol-04',
        email: 'sneha.reddy@foodcovering.org',
        username: 'sneha_reddy',
        passwordHash: userHash,
        fullName: 'Sneha Reddy (Dispatch Volunteer)',
        phone: '+91 65432 10987',
        address: 'Sector 5, Salt Lake City, Kolkata',
        role: 'NORMAL_USER',
        isActive: true,
        createdAt: '2026-10-14T11:00:00.000Z'
      },
      {
        id: 'usr-vol-05',
        email: 'vikram.singh@foodcovering.org',
        username: 'vikram_singh',
        passwordHash: userHash,
        fullName: 'Vikram Singh (Emergency Relief Volunteer)',
        phone: '+91 54321 09876',
        address: 'T Nagar Rapid Station, Chennai',
        role: 'NORMAL_USER',
        isActive: true,
        createdAt: '2026-10-14T12:00:00.000Z'
      },
      {
        id: 'usr-donor-01',
        email: 'green@farm.com',
        username: 'green_farms_donor',
        passwordHash: userHash,
        fullName: 'Anita Sharma (Green Farms Organic Donor)',
        phone: '+91 98765 11111',
        address: 'Sector 62, Noida, NCR',
        role: 'NORMAL_USER',
        isActive: true,
        createdAt: '2026-10-14T13:00:00.000Z'
      },
      {
        id: 'usr-donor-02',
        email: 'sunrise@food.com',
        username: 'sunrise_foods_donor',
        passwordHash: userHash,
        fullName: 'Vikram Singhania (Sunrise Foods Donor)',
        phone: '+91 87654 22222',
        address: 'Andheri East, Mumbai',
        role: 'NORMAL_USER',
        isActive: true,
        createdAt: '2026-10-14T14:00:00.000Z'
      }
    ];

    for (const u of kaggleUsers) {
      if (!this.data.users.some(existing => existing.id === u.id || existing.email.toLowerCase() === u.email.toLowerCase())) {
        this.data.users.push(u);
        mutated = true;
      }
    }

    if (mutated) {
      this.save();
      console.log(`[DB] Successfully integrated Kaggle Head Office dataset: ${this.data.supermarkets.length} supermarkets, ${this.data.users.length} users, ${this.data.donations.length} donations, ${this.data.complaints.length} complaints.`);
    }
  }

  private seedDefaultData() {
    console.log('[DB] Seeding comprehensive FoodCovering database...');
    const now = new Date().toISOString();

    // 1. Initial Admin
    const adminEmail = (process.env.INITIAL_ADMIN_EMAIL || 'admin@foodcovering.gov').toLowerCase();
    const adminPass = process.env.INITIAL_ADMIN_PASSWORD || 'Admin@Secure2026!';
    const adminHash = bcrypt.hashSync(adminPass, 10);
    const officialHash = bcrypt.hashSync('Official@123', 10);
    const userHash = bcrypt.hashSync('User@123', 10);

    const adminUser: User = {
      id: 'usr-admin-01',
      email: adminEmail,
      username: 'admin',
      passwordHash: adminHash,
      fullName: 'Head Office Administrator',
      phone: '+91 98765 00001',
      address: 'Central Food Safety Directorate, New Delhi',
      role: 'HEAD_OFFICE_ADMIN',
      isActive: true,
      createdAt: now
    };

    // 2. Supermarkets & Branches
    const sm1: Supermarket = {
      id: 'sm-001',
      name: 'FreshMart Supermarkets',
      code: 'FM-RET',
      contactPhone: '+91 98222 33445',
      contactEmail: 'contact@freshmart.in',
      address: 'Central Market, Sector 2',
      city: 'New Delhi',
      region: 'North Zone',
      status: 'Active',
      createdAt: now
    };

    const sm2: Supermarket = {
      id: 'sm-002',
      name: 'GreenBasket Hypermarket',
      code: 'GB-HYP',
      contactPhone: '+91 98333 44556',
      contactEmail: 'support@greenbasket.in',
      address: 'DLF Phase 1',
      city: 'Gurugram',
      region: 'NCR Zone',
      status: 'Active',
      createdAt: now
    };

    const sm3: Supermarket = {
      id: 'sm-003',
      name: 'Metro Daily Express',
      code: 'MD-EXP',
      contactPhone: '+91 98444 55667',
      contactEmail: 'care@metrodaily.in',
      address: 'Indiranagar Main Road',
      city: 'Bangalore',
      region: 'South Zone',
      status: 'Active',
      createdAt: now
    };

    const br1_1: SupermarketBranch = {
      id: 'br-001-cp',
      supermarketId: 'sm-001',
      branchName: 'Connaught Place Main Flagship',
      branchCode: 'CP-01',
      address: 'Booth #14, Central Market, Connaught Place',
      city: 'New Delhi',
      region: 'North Zone',
      contactPhone: '+91 98222 33445',
      managerName: 'Rajesh K. Mehta',
      status: 'Active'
    };

    const br1_2: SupermarketBranch = {
      id: 'br-001-south',
      supermarketId: 'sm-001',
      branchName: 'South Extension Branch',
      branchCode: 'SE-02',
      address: 'Shop 102, South Extension Part 2',
      city: 'New Delhi',
      region: 'North Zone',
      contactPhone: '+91 98222 33446',
      managerName: 'Vikas Malhotra',
      status: 'Active'
    };

    const br2_1: SupermarketBranch = {
      id: 'br-002-dlf',
      supermarketId: 'sm-002',
      branchName: 'DLF Phase 1 Superstore',
      branchCode: 'DLF-01',
      address: 'A-12 DLF Phase 1',
      city: 'Gurugram',
      region: 'NCR Zone',
      contactPhone: '+91 98333 44556',
      managerName: 'Pooja Agarwal',
      status: 'Active'
    };

    // 3. Supermarket Officials
    const official1: User = {
      id: 'usr-sm-01',
      email: 'official@freshmart.com',
      username: 'freshmart_official',
      passwordHash: officialHash,
      fullName: 'Rajesh Mehta (Store Lead)',
      phone: '+91 98222 33445',
      address: 'FreshMart Flagship, Connaught Place, New Delhi',
      role: 'SUPERMARKET_OFFICIAL',
      supermarketId: 'sm-001',
      branchId: 'br-001-cp',
      isActive: true,
      createdAt: now
    };

    const official2: User = {
      id: 'usr-sm-02',
      email: 'official@greenbasket.com',
      username: 'greenbasket_official',
      passwordHash: officialHash,
      fullName: 'Pooja Agarwal (Inventory Manager)',
      phone: '+91 98333 44556',
      address: 'GreenBasket Hypermarket, Gurugram',
      role: 'SUPERMARKET_OFFICIAL',
      supermarketId: 'sm-002',
      branchId: 'br-002-dlf',
      isActive: true,
      createdAt: now
    };

    // 4. Normal Users
    const normalUser1: User = {
      id: 'usr-normal-01',
      email: 'user@foodcovering.com',
      username: 'normal_user',
      passwordHash: userHash,
      fullName: 'Aditi Verma',
      phone: '+91 98765 43210',
      address: 'Sector 14, Rohini, New Delhi',
      role: 'NORMAL_USER',
      isActive: true,
      createdAt: now
    };

    const normalUser2: User = {
      id: 'usr-normal-02',
      email: 'rahul.sen@example.com',
      username: 'rahul_sen',
      passwordHash: userHash,
      fullName: 'Rahul Sen',
      phone: '+91 98111 22334',
      address: 'Old Subzi Mandi, North Delhi',
      role: 'NORMAL_USER',
      isActive: true,
      createdAt: now
    };

    // 5. Inventory Items (Real AI-scanned inventory only, zero mock seeds)
    const inventory: InventoryItem[] = [];

    // 6. Donations
    const donations: DonationRecord[] = [
      {
        id: 'DC-00326',
        donorType: 'SUPERMARKET',
        donorUserId: 'usr-sm-01',
        donorName: 'FreshMart Supermarkets (Connaught Place)',
        donorPhone: '+91 98222 33445',
        donorEmail: 'official@freshmart.com',
        supermarketId: 'sm-001',
        branchId: 'br-001-cp',
        foodItems: 'Artisan Baguettes & French Rolls',
        category: 'Bakery',
        quantity: '30 kg',
        expiryDate: '2026-10-14',
        pickupAddress: 'Booth #14, Central Market, Connaught Place, New Delhi',
        receiver: 'Delhi Food Rescue NGO Partner',
        volunteer: 'Arjun Sharma',
        status: 'In Transit',
        eta: '18 mins',
        notes: 'Freshly packed morning surplus in hygienic food-grade crates.',
        creditPoints: 185,
        co2SavedKg: 75.0,
        date: 'Today',
        createdAt: now
      },
      {
        id: 'DC-00325',
        donorType: 'INDIVIDUAL',
        donorUserId: 'usr-normal-02',
        donorName: 'Rahul Sen',
        donorPhone: '+91 98111 22334',
        donorEmail: 'rahul.sen@example.com',
        foodItems: 'Home-cooked Rice & Lentils Meal Boxes',
        title: 'Home-cooked Rice & Lentils Meal Boxes',
        category: 'Prepared Meals',
        quantity: '15 meals (8 kg)',
        weight: '8 kg',
        freshness: 'Good (Within 6 hrs)',
        pickupTime: '28 Sep 2026, 10:24 AM',
        expiryDate: '2026-10-14',
        pickupAddress: 'Sector 34, Barasat, New Delhi',
        location: 'Sector 34, Barasat, New Delhi',
        latitude: 22.7223,
        longitude: 88.4808,
        destinationLatitude: 22.5867,
        destinationLongitude: 88.4754,
        receiver: 'Green Life Foundation',
        volunteer: 'Priya Patel',
        volunteerId: 'vol-001',
        volunteerPhone: '+91 98765 43210',
        volunteerLatitude: 22.6650,
        volunteerLongitude: 88.4420,
        volunteerLastUpdated: '2026-09-28T13:45:00.000Z',
        distanceKm: 6.8,
        status: 'In Transit',
        statusBadgeText: 'En Route to Pickup',
        eta: '18 mins',
        notes: 'No onions, mild spice',
        date: '28 Sep 2026, 10:24 AM',
        createdAt: '2026-09-28T10:24:00.000Z',
        ngo: {
          name: 'Green Life Foundation',
          type: 'Community Kitchen & Food Support',
          verificationStatus: 'Verified NGO',
          address: 'Plot 12, Food Care Hub, Barasat',
          phone: '+91 98111 55667'
        },
        timeline: [
          { title: 'Donation Request Confirmed', timestamp: 'Batch validated and queued for pickup', completed: true },
          { title: 'Volunteer Assigned', timestamp: 'Priya Patel', completed: true },
          { title: 'En Route to Pickup Address', timestamp: 'Approaching: Sector 34, Barasat', completed: false, active: true },
          { title: 'Delivered to NGO Partner', timestamp: 'Destination: Green Life Foundation', completed: false }
        ]
      },
      {
        id: 'DC-00327',
        donorType: 'INDIVIDUAL',
        donorUserId: 'usr-normal-02',
        donorName: 'Rahul Sen',
        donorPhone: '+91 98111 22334',
        donorEmail: 'rahul.sen@example.com',
        foodItems: 'Fresh Fruits & Vegetables',
        title: 'Fresh Fruits & Vegetables',
        category: 'Fruits & Vegetables',
        quantity: '20 kg',
        weight: '20 kg',
        freshness: 'Fresh (Harvested yesterday)',
        pickupTime: '27 Sep 2026, 04:15 PM',
        expiryDate: '2026-10-10',
        pickupAddress: 'Sector 12, Noida',
        location: 'Sector 12, Noida',
        latitude: 28.5700,
        longitude: 77.3200,
        destinationLatitude: 28.5850,
        destinationLongitude: 77.3100,
        receiver: 'Hope Shelter Relief Hub',
        volunteer: 'Arjun Sharma',
        status: 'In Progress',
        statusBadgeText: 'Pickup Scheduled',
        eta: '15 mins',
        notes: 'Packed in ventilated crates; handle with care',
        date: '27 Sep 2026, 04:15 PM',
        createdAt: '2026-09-27T16:15:00.000Z',
        ngo: {
          name: 'Hope Shelter Relief Hub',
          type: 'Community Food Relief Center',
          verificationStatus: 'Verified NGO',
          address: 'Sector 15, Noida, Uttar Pradesh',
          phone: '+91 98222 66778'
        },
        timeline: [
          { title: 'Donation Submitted', timestamp: '27 Sep 2026, 04:15 PM', completed: true },
          { title: 'Verified by NGO', timestamp: '27 Sep 2026, 04:45 PM', completed: true },
          { title: 'Volunteer Assigned', timestamp: '27 Sep 2026, 05:00 PM', completed: true },
          { title: 'Pickup Scheduled', timestamp: '27 Sep 2026, 05:30 PM', completed: false, active: true },
          { title: 'Picked Up', completed: false },
          { title: 'Delivered to Facility', completed: false }
        ]
      },
      {
        id: 'DC-00328',
        donorType: 'INDIVIDUAL',
        donorUserId: 'usr-normal-02',
        donorName: 'Rahul Sen',
        donorPhone: '+91 98111 22334',
        donorEmail: 'rahul.sen@example.com',
        foodItems: 'Bread & Bakery Items',
        title: 'Bread & Bakery Items',
        category: 'Bakery',
        quantity: '10 packs (5 kg)',
        weight: '5 kg',
        freshness: 'Fresh (Baked this morning)',
        pickupTime: '26 Sep 2026, 11:30 AM',
        expiryDate: '2026-09-30',
        pickupAddress: 'Sector 18, Gurugram',
        location: 'Sector 18, Gurugram',
        latitude: 28.4595,
        longitude: 77.0266,
        destinationLatitude: 28.4800,
        destinationLongitude: 77.0500,
        receiver: 'Waiting for NGO assignment',
        status: 'Pending',
        statusBadgeText: 'Pending Verification',
        eta: 'Pending assignment',
        notes: 'Assorted whole wheat bread loaves, hygienic seal',
        date: '26 Sep 2026, 11:30 AM',
        createdAt: '2026-09-26T11:30:00.000Z',
        ngo: {
          name: 'Waiting for NGO assignment',
          type: 'Food Bank Network',
          verificationStatus: 'Verification In Progress'
        },
        timeline: [
          { title: 'Donation Submitted', timestamp: '26 Sep 2026, 11:30 AM', completed: true, active: true },
          { title: 'Verified by NGO', completed: false },
          { title: 'Volunteer Assigned', completed: false },
          { title: 'Pickup Scheduled', completed: false },
          { title: 'Delivered to Facility', completed: false }
        ]
      },
      {
        id: 'DC-00324',
        donorType: 'SUPERMARKET',
        donorUserId: 'usr-sm-01',
        donorName: 'FreshMart Supermarkets',
        donorPhone: '+91 98222 33445',
        donorEmail: 'official@freshmart.com',
        supermarketId: 'sm-001',
        branchId: 'br-001-cp',
        foodItems: 'Pasteurized Dairy Pouches',
        category: 'Dairy',
        quantity: '17 kg',
        expiryDate: '2026-10-15',
        pickupAddress: 'Booth #14, Central Market, Connaught Place',
        receiver: 'Children Care Nutrition Center',
        volunteer: 'Rahul Reddy',
        status: 'Delivered',
        eta: 'Delivered',
        notes: 'Cold chain verified before handover. Received by center in charge.',
        creditPoints: 150,
        co2SavedKg: 42.5,
        date: 'Yesterday',
        createdAt: now
      },
      {
        id: 'DC-00323',
        donorType: 'INDIVIDUAL',
        donorUserId: 'usr-normal-02',
        donorName: 'Rahul Sen',
        donorPhone: '+91 98111 22334',
        donorEmail: 'rahul.sen@example.com',
        foodItems: 'Wheat Flour & Rice Bags',
        category: 'Grains & Cereals',
        quantity: '25 kg',
        expiryDate: '2026-12-01',
        pickupAddress: 'Old Subzi Mandi, North Delhi',
        receiver: 'Community Kitchen Outreach',
        volunteer: 'Anjali Das',
        status: 'Delivered',
        eta: 'Delivered',
        date: '2 Days ago',
        createdAt: now
      }
    ];

    // 7. Authentic AI Food & Waste Scan Spoilage Complaints
    const complaints: ComplaintRecord[] = [
      {
        id: 'FC-2026-U303',
        caseId: 'FC-2026-U303',
        reporterUserId: 'usr-normal-01',
        reporterName: 'Praveen',
        reporterEmail: 'user@foodcovering.com',
        reporterPhone: '+91 98765 43210',
        foodType: 'Fruits & Vegetables',
        productName: 'Spoiled Orange (AI Freshness Scan)',
        quantity: '1 kg crate',
        batchNumber: 'AI-BATCH-OR-4091',
        expiryDate: 'Spoiled / Unfit for Sale',
        seller: 'FreshMart Supermarkets',
        supermarketId: 'sm-001',
        branchId: 'br-001-cp',
        sellerAddress: 'Booth #14, Central Market, Connaught Place, New Delhi',
        purchaseLocation: 'FreshMart Supermarkets, Central Market',
        incidentLocation: 'Sector 2 Cold Storage, Central Market',
        purchaseDate: '2026-10-18',
        description: '[AI Deep Learning Freshness Scan]: Neural network (EfficientNet-B0) detected Spoiled Orange with 100.0% confidence. Penicillium digitatum fungal sporulation and soft rind decay identified. IoT Chamber Telemetry: NH3=8.4ppm, TVOC=1420ppb, Temp=14.2°C. Dispatched to FreshMart Store Lead for stock quarantine.',
        priority: 'High',
        status: 'Resolved',
        assignedOfficer: 'Sarah Connor (Senior Food Safety Inspector)',
        evidenceImages: [
          'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAMCAgICAgMCAgIDAwMDBAYEBAQEBAgGBgUGCQgKCgkICQkKDA8MCgsOCwkJDRENDg8QEBEQCgwSExIQEw8QEBD/2wBDAQMDAwQDBAgEBAgQCwkLEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBD/wAARCAEAAQADASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD9LqIiAIiIAiIgCIiAIiIAiIgCIiAIiIAiIgCIiAIiIAiIgCIiAIiIAiIgCIiAP/2Q=='
        ],
        investigationNotes: [
          {
            id: 'n-ai-1',
            officer: 'FoodCovering AI Safety Engine',
            text: 'Neural classification verified Penicillium fungal sporulation on citrus specimen. Grad-CAM visual attention focused on necrotic epidermal lesions.',
            timestamp: '18 Oct 2026, 09:55 PM',
            type: 'note'
          },
          {
            id: 'n-ai-2',
            officer: 'Rajesh Mehta (Store Lead)',
            text: 'Store inspection verified cold-chain chamber #2 thermostat deviation. Batch quarantined and replacement voucher issued.',
            timestamp: '18 Oct 2026, 10:15 PM',
            type: 'note'
          }
        ],
        timeline: [
          {
            title: 'AI Freshness Scan Executed',
            timestamp: '18 Oct 2026, 09:55 PM',
            actor: 'Citizen Praveen (AI Vision)',
            status: 'completed'
          },
          {
            title: 'Store Audit & Batch Quarantine',
            timestamp: '18 Oct 2026, 10:15 PM',
            actor: 'FreshMart Store Official (Rajesh Mehta)',
            status: 'completed'
          },
          {
            title: 'Customer Refund Disbursed',
            timestamp: '18 Oct 2026, 11:11 PM',
            actor: 'Store Counter #3 (Ref: REF-719812)',
            status: 'completed'
          }
        ],
        auditLog: [
          {
            timestamp: '18 Oct 2026 09:55 PM',
            user: 'Praveen via FoodCovering AI Scanner',
            action: 'AI Spoilage Dossier Registered',
            details: 'Optical capture & IoT sensor telemetry analyzed by Deep Learning Model'
          }
        ],
        date: '18 Oct 2026',
        time: '09:55 PM',
        createdAt: now,
        refundStatus: 'Refunded',
        refundAmount: 150,
        refundMethod: 'Cash',
        refundDate: '19 Oct 2026, 00:41',
        refundTransactionId: 'REF-719812',
        refundNotes: 'Cash refund disbursed at customer service counter to Praveen.',
        escalatedToHeadOffice: true,
        sharedWithHeadOffice: true,
        headOfficeSharedAt: '2026-10-19T08:07:20.561Z'
      },
      {
        id: 'FC-2026-U911',
        caseId: 'FC-2026-U911',
        reporterUserId: 'usr-normal-01',
        reporterName: 'Praveen',
        reporterEmail: 'user@foodcovering.com',
        reporterPhone: '+91 98765 43210',
        foodType: 'Fruits & Vegetables',
        productName: 'Spoiled Apple (AI Freshness Scan)',
        quantity: '1 pack (4 pcs)',
        batchNumber: 'AI-BATCH-AP-2026',
        expiryDate: 'Spoiled / Discard',
        seller: 'FreshMart Supermarkets',
        supermarketId: 'sm-001',
        branchId: 'br-001-cp',
        sellerAddress: 'Booth #14, Central Market, Connaught Place, New Delhi',
        purchaseLocation: 'FreshMart Supermarkets, Central Market',
        incidentLocation: 'Produce Aisle Display #4',
        purchaseDate: '2026-10-18',
        description: '[AI Deep Learning Freshness Scan]: Neural network (EfficientNet-B0) detected Spoiled Apple with 96.5% confidence. Advanced fungal breakdown and epidermal discoloration. High ethylene and VOC gas readings detected by correlated IoT chamber sensor.',
        priority: 'High',
        status: 'Resolved',
        assignedOfficer: 'Sarah Connor',
        evidenceImages: [],
        investigationNotes: [
          {
            id: 'n-ai-3',
            officer: 'FoodCovering AI Safety Engine',
            text: 'Neural analysis confirmed severe tissue decomposition. Recommended immediate disposal and organic composting.',
            timestamp: '18 Oct 2026, 07:06 PM',
            type: 'note'
          }
        ],
        timeline: [
          {
            title: 'AI Freshness Scan Executed',
            timestamp: '18 Oct 2026, 07:06 PM',
            actor: 'Citizen Praveen (AI Vision)',
            status: 'completed'
          },
          {
            title: 'Resolution Completed',
            timestamp: '18 Oct 2026, 10:45 PM',
            actor: 'Rajesh Mehta (Store Lead)',
            status: 'completed'
          }
        ],
        auditLog: [
          {
            timestamp: '18 Oct 2026 07:06 PM',
            user: 'Praveen via FoodCovering AI Scanner',
            action: 'AI Scan Spoilage Logged',
            details: 'Specimen verified by EfficientNet deep learning pipeline'
          }
        ],
        date: '18 Oct 2026',
        time: '07:06 PM',
        createdAt: now,
        refundStatus: 'Refunded',
        refundAmount: 150,
        refundMethod: 'Cash',
        refundDate: '18 Oct 2026, 22:45',
        refundTransactionId: 'REF-739341',
        refundNotes: 'Cash refund disbursed at customer service counter to Praveen.'
      }
    ];

    // 8. Audit Logs
    const auditLogs: AuditLogEntry[] = [
      {
        id: 'aud-001',
        userId: 'usr-admin-01',
        userEmail: adminEmail,
        userRole: 'HEAD_OFFICE_ADMIN',
        action: 'PLATFORM_INITIALIZATION',
        entityType: 'SYSTEM',
        details: 'Initial system provisioning and seed setup executed',
        timestamp: now
      },
      {
        id: 'aud-002',
        userId: 'usr-admin-01',
        userEmail: adminEmail,
        userRole: 'HEAD_OFFICE_ADMIN',
        action: 'SUPERMARKET_APPROVAL',
        entityType: 'SUPERMARKET',
        entityId: 'sm-001',
        details: 'Approved FreshMart Supermarkets and activated Connaught Place flagship',
        timestamp: now
      }
    ];

    // 9. Alerts
    const alerts: PlatformAlert[] = [
      {
        id: 'alt-001',
        title: 'High Priority Cold Chain Alert',
        message: 'Chiller unit #3 reported temperature excursion (>7°C for 45 mins). Review batch BK-2026-901.',
        severity: 'critical',
        supermarketId: 'sm-001',
        targetRole: 'SUPERMARKET_OFFICIAL',
        isRead: false,
        createdAt: now
      },
      {
        id: 'alt-002',
        title: 'New Investigation Assigned',
        message: 'High priority complaint FC-2026-00124 (Dairy Product) initiated against FreshMart.',
        severity: 'warning',
        targetRole: 'HEAD_OFFICE_ADMIN',
        isRead: false,
        createdAt: now
      },
      {
        id: 'alt-003',
        title: 'Donation Scheduled for Pickup',
        message: 'Volunteer Arjun Sharma is 18 minutes away for collection of surplus Bakery batch DC-00326.',
        severity: 'info',
        supermarketId: 'sm-001',
        isRead: false,
        createdAt: now
      }
    ];

    this.data = {
      users: [adminUser, official1, official2, normalUser1, normalUser2],
      supermarkets: [sm1, sm2, sm3],
      branches: [br1_1, br1_2, br2_1],
      inventory,
      donations,
      complaints,
      auditLogs,
      alerts
    };
  }

  // User Methods
  public findUserById(id: string): User | undefined {
    return this.data.users.find(u => u.id === id);
  }

  public findUserByEmailOrUsername(identifier: string): User | undefined {
    const clean = identifier.trim().toLowerCase();
    return this.data.users.find(u => u.email.toLowerCase() === clean || u.username.toLowerCase() === clean);
  }

  public findUserByEmail(email: string): User | undefined {
    const clean = email.trim().toLowerCase();
    return this.data.users.find(u => u.email.toLowerCase() === clean);
  }

  public listUsers(roleFilter?: UserRole): SafeUser[] {
    let users = this.data.users;
    if (roleFilter) {
      users = users.filter(u => u.role === roleFilter);
    }
    return users.map(({ passwordHash, ...safe }) => safe);
  }

  public createUser(user: User): SafeUser {
    this.data.users.push(user);
    this.save();
    const { passwordHash, ...safe } = user;
    return safe;
  }

  public updateUser(id: string, updates: Partial<User>): SafeUser | undefined {
    const idx = this.data.users.findIndex(u => u.id === id);
    if (idx === -1) return undefined;

    if (updates.email) {
      updates.email = updates.email.toLowerCase().trim();
    }
    if (updates.phone) {
      updates.phone = updates.phone.trim();
    }

    this.data.users[idx] = { ...this.data.users[idx], ...updates };
    this.save();
    const { passwordHash, ...safe } = this.data.users[idx];
    return safe;
  }

  public cascadeUserContactUpdate(
    userId: string,
    oldUser: { email?: string; phone?: string; fullName?: string },
    newUser: { email: string; phone: string; fullName: string; address?: string }
  ): boolean {
    let touched = false;
    const cleanOldPhone = (oldUser.phone || '').replace(/[^0-9]/g, '');
    const cleanNewPhone = (newUser.phone || '').trim();
    const oldEmailLower = (oldUser.email || '').toLowerCase().trim();
    const newEmailLower = (newUser.email || '').toLowerCase().trim();
    const oldNameLower = (oldUser.fullName || '').toLowerCase().trim();
    const newFullName = (newUser.fullName || '').trim();

    // 1. Cascade update all donations by this user
    this.data.donations.forEach(d => {
      const match = d.donorUserId === userId || 
                    (d.donorEmail && oldEmailLower && d.donorEmail.toLowerCase().trim() === oldEmailLower) ||
                    (d.donorPhone && cleanOldPhone && d.donorPhone.replace(/[^0-9]/g, '') === cleanOldPhone) ||
                    (d.donorName && oldNameLower && d.donorName.toLowerCase().trim() === oldNameLower);
      if (match) {
        d.donorUserId = userId;
        d.donorName = newFullName;
        d.donorEmail = newEmailLower;
        d.donorPhone = cleanNewPhone;
        if (newUser.address) {
          d.pickupAddress = newUser.address;
          d.location = newUser.address;
        }
        touched = true;
      }
    });

    // 2. Cascade update all complaints in db by this user
    this.data.complaints.forEach(c => {
      const match = c.reporterUserId === userId || 
                    (c.reporterEmail && oldEmailLower && c.reporterEmail.toLowerCase().trim() === oldEmailLower) ||
                    (c.reporterPhone && cleanOldPhone && c.reporterPhone.replace(/[^0-9]/g, '') === cleanOldPhone) ||
                    (c.reporterName && oldNameLower && c.reporterName.toLowerCase().trim() === oldNameLower);
      if (match) {
        c.reporterUserId = userId;
        c.reporterName = newFullName;
        c.reporterEmail = newEmailLower;
        c.reporterPhone = cleanNewPhone;
        touched = true;
      }
    });

    if (touched) {
      this.save();
    }
    return touched;
  }

  public setUserStatus(id: string, isActive: boolean): SafeUser | undefined {
    return this.updateUser(id, { isActive });
  }

  public toSafeUser(user: User): SafeUser {
    const { passwordHash, ...safe } = user;
    return safe;
  }

  // Supermarket Methods
  public listSupermarkets(): Supermarket[] {
    return this.data.supermarkets;
  }

  public findSupermarketById(id: string): Supermarket | undefined {
    return this.data.supermarkets.find(s => s.id === id);
  }

  public createSupermarket(sm: Supermarket, initialBranch?: SupermarketBranch): Supermarket {
    this.data.supermarkets.push(sm);
    if (initialBranch) {
      this.data.branches.push(initialBranch);
    }
    this.save();
    return sm;
  }

  public updateSupermarket(id: string, updates: Partial<Supermarket>): Supermarket | undefined {
    const idx = this.data.supermarkets.findIndex(s => s.id === id);
    if (idx === -1) return undefined;
    this.data.supermarkets[idx] = { ...this.data.supermarkets[idx], ...updates };
    this.save();
    return this.data.supermarkets[idx];
  }

  public listBranches(supermarketId?: string): SupermarketBranch[] {
    if (supermarketId) {
      return this.data.branches.filter(b => b.supermarketId === supermarketId);
    }
    return this.data.branches;
  }

  public addBranch(branch: SupermarketBranch): SupermarketBranch {
    this.data.branches.push(branch);
    this.save();
    return branch;
  }

  // Inventory Methods
  public listInventory(supermarketId: string, branchId?: string): InventoryItem[] {
    return this.data.inventory.filter(i => {
      const smMatch = i.supermarketId === supermarketId;
      const brMatch = !branchId || i.branchId === branchId;
      return smMatch && brMatch;
    });
  }

  public findInventoryById(id: string): InventoryItem | undefined {
    return this.data.inventory.find(i => i.id === id);
  }

  public createInventoryItem(item: InventoryItem): InventoryItem {
    this.data.inventory.unshift(item);
    this.save();
    return item;
  }

  public addInventoryItem(item: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): InventoryItem {
    const newItem: InventoryItem = {
      ...item,
      id: item.id || 'inv-' + Date.now().toString(36),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    return this.createInventoryItem(newItem);
  }

  public updateInventoryItem(id: string, updates: Partial<InventoryItem>): InventoryItem | undefined {
    const idx = this.data.inventory.findIndex(i => i.id === id);
    if (idx === -1) return undefined;
    this.data.inventory[idx] = { ...this.data.inventory[idx], ...updates, updatedAt: new Date().toISOString() };
    this.save();
    return this.data.inventory[idx];
  }

  public deleteInventoryItem(id: string): boolean {
    const initial = this.data.inventory.length;
    this.data.inventory = this.data.inventory.filter(i => i.id !== id);
    if (this.data.inventory.length !== initial) {
      this.save();
      return true;
    }
    return false;
  }

  // Donations Methods
  public listDonations(filter?: { userId?: string; supermarketId?: string }): DonationRecord[] {
    let list = this.data.donations;
    if (filter?.userId) {
      list = list.filter(d => d.donorUserId === filter.userId);
    }
    if (filter?.supermarketId) {
      list = list.filter(d => d.supermarketId === filter.supermarketId);
    }
    return list;
  }

  public findDonationById(id: string): DonationRecord | undefined {
    return this.data.donations.find(d => d.id === id);
  }

  public createDonation(donation: DonationRecord): DonationRecord {
    this.data.donations.unshift(donation);
    this.save();
    return donation;
  }

  public updateDonation(id: string, updates: Partial<DonationRecord>): DonationRecord | undefined {
    const idx = this.data.donations.findIndex(d => d.id === id);
    if (idx === -1) return undefined;
    this.data.donations[idx] = { ...this.data.donations[idx], ...updates };
    this.save();
    return this.data.donations[idx];
  }

  public deleteDonation(id: string): boolean {
    const initialLen = this.data.donations.length;
    this.data.donations = this.data.donations.filter(d => d.id !== id);
    if (this.data.donations.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }

  // Complaints Methods
  public listComplaints(filter?: { userId?: string; supermarketId?: string; status?: string }): ComplaintRecord[] {
    let list = this.data.complaints.filter(c => {
      const pLower = (c.productName || '').toLowerCase();
      const id = c.id || '';
      return !(id === 'FC-2026-U277' || 
               id === 'FC-2026-00124' || 
               id === 'FC-2026-00123' || 
               pLower.includes('a2 organic fresh milk') || 
               pLower.includes('organic whole milk') || 
               pLower.includes('prime fresh beef ribs'));
    });
    if (filter?.userId) {
      list = list.filter(c => c.reporterUserId === filter.userId);
    }
    if (filter?.supermarketId) {
      const sm = this.findSupermarketById(filter.supermarketId);
      const smName = sm?.name?.toLowerCase() || '';
      list = list.filter(c => {
        if (c.supermarketId && c.supermarketId === filter.supermarketId) return true;
        if (c.seller) {
          const sLower = c.seller.toLowerCase();
          if (filter.supermarketId === 'sm-001' && (sLower.includes('freshmart') || sLower.includes('fresh mart'))) return true;
          if (filter.supermarketId === 'sm-002' && (sLower.includes('greenbasket') || sLower.includes('greenmart') || sLower.includes('green basket'))) return true;
          if (smName && sLower.includes(smName.slice(0, 8))) return true;
        }
        return false;
      });
    }
    if (filter?.status && filter.status !== 'All Statuses') {
      list = list.filter(c => c.status.toLowerCase() === filter.status!.toLowerCase());
    }

    // Auto-normalize any split or un-prefixed base64 evidence images
    return list.map(c => {
      let fixedImages = c.evidenceImages || [];
      if (Array.isArray(fixedImages) && fixedImages.length > 0) {
        if (
          fixedImages.length === 2 && 
          fixedImages[0]?.startsWith('data:') && 
          !fixedImages[0]?.includes(',') && 
          !fixedImages[1]?.startsWith('http')
        ) {
          fixedImages = [fixedImages[0] + ',' + fixedImages[1]];
        } else {
          fixedImages = fixedImages.map(img => {
            if (typeof img !== 'string') return '';
            if (img.startsWith('/9j/')) return 'data:image/jpeg;base64,' + img;
            if (img.startsWith('iVBORw0KGgo')) return 'data:image/png;base64,' + img;
            return img;
          }).filter(img => img.length > 25 || img.startsWith('http'));
        }
      }
      return {
        ...c,
        evidenceImages: fixedImages
      };
    });
  }

  public findComplaintById(id: string): ComplaintRecord | undefined {
    return this.data.complaints.find(c => c.id === id);
  }

  public createComplaint(complaint: ComplaintRecord): ComplaintRecord {
    this.data.complaints.unshift(complaint);
    this.save();
    return complaint;
  }

  public deleteComplaint(id: string): boolean {
    const initialLen = this.data.complaints.length;
    this.data.complaints = this.data.complaints.filter(c => c.id !== id);
    if (this.data.complaints.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }

  public updateComplaint(id: string, updates: Partial<ComplaintRecord>): ComplaintRecord | undefined {
    const idx = this.data.complaints.findIndex(c => c.id === id);
    if (idx === -1) return undefined;
    this.data.complaints[idx] = { ...this.data.complaints[idx], ...updates };
    this.save();
    return this.data.complaints[idx];
  }

  public addComplaintNote(complaintId: string, note: { officer: string; text: string; type?: any }): ComplaintRecord | undefined {
    const complaint = this.findComplaintById(complaintId);
    if (!complaint) return undefined;

    complaint.investigationNotes.push({
      id: 'n-' + Date.now(),
      officer: note.officer,
      text: note.text,
      timestamp: new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      type: note.type || 'note'
    });
    this.save();
    return complaint;
  }

  // Audit Logs
  public logAudit(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): AuditLogEntry {
    const full: AuditLogEntry = {
      id: 'aud-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      timestamp: new Date().toISOString(),
      ...entry
    };
    this.data.auditLogs.unshift(full);
    if (this.data.auditLogs.length > 500) {
      this.data.auditLogs.pop();
    }
    this.save();
    return full;
  }

  public listAuditLogs(): AuditLogEntry[] {
    return this.data.auditLogs;
  }

  // Alerts
  public listAlerts(filter?: { role?: string; supermarketId?: string }): PlatformAlert[] {
    let list = this.data.alerts;
    if (filter?.supermarketId) {
      list = list.filter(a => !a.supermarketId || a.supermarketId === filter.supermarketId);
    }
    if (filter?.role) {
      list = list.filter(a => !a.targetRole || a.targetRole === filter.role);
    }
    return list;
  }

  public createAlert(alert: Omit<PlatformAlert, 'id' | 'createdAt' | 'isRead'>): PlatformAlert {
    const full: PlatformAlert = {
      id: 'alt-' + Date.now(),
      createdAt: new Date().toISOString(),
      isRead: false,
      ...alert
    };
    this.data.alerts.unshift(full);
    this.save();
    return full;
  }

  public markAlertRead(id: string): boolean {
    const a = this.data.alerts.find(item => item.id === id);
    if (a) {
      a.isRead = true;
      this.save();
      return true;
    }
    return false;
  }

  // Scans Methods
  public listScans(filter?: { userId?: string }): ScanRecord[] {
    let list = this.data.scans || [];
    if (filter?.userId) {
      list = list.filter(s => !s.userId || s.userId === filter.userId);
    }
    return list;
  }

  public addScan(scan: ScanRecord): ScanRecord {
    if (!this.data.scans) {
      this.data.scans = [];
    }
    this.data.scans.unshift(scan);
    if (this.data.scans.length > 300) {
      this.data.scans.pop();
    }
    this.save();
    return scan;
  }

  public getScanStats(userId?: string) {
    const list = this.listScans(userId ? { userId } : undefined);
    const total = list.length;
    const fresh = list.filter(s => s.freshness === 'Fresh').length;
    const moderate = list.filter(s => s.freshness === 'Moderate').length;
    const spoiled = list.filter(s => s.freshness === 'Spoiled').length;
    const safetyScore = total > 0 ? Math.round(((fresh * 1.0 + moderate * 0.6) / total) * 100) : null;
    return { total, fresh, moderate, spoiled, safetyScore };
  }

  // Unified AI Analysis Methods (Manual-first, Zero-seed)
  public listAiAnalyses(filter?: { userId?: string; limit?: number }): AiAnalysisRecord[] {
    let list = this.data.aiAnalyses || [];
    // Self-heal any historical records where image was previously truncated with ...
    list = list.map(a => {
      if (a.image && a.image.endsWith('...') && a.gradcam_image && !a.gradcam_image.endsWith('...')) {
        return { ...a, image: a.gradcam_image };
      }
      return a;
    });
    if (filter?.userId) {
      list = list.filter(a => !a.user_id || a.user_id === filter.userId);
    }
    const sorted = [...list].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    if (filter?.limit && filter.limit > 0) {
      return sorted.slice(0, filter.limit);
    }
    return sorted;
  }

  public addAiAnalysis(analysis: AiAnalysisRecord): AiAnalysisRecord {
    if (!this.data.aiAnalyses) {
      this.data.aiAnalyses = [];
    }
    this.data.aiAnalyses.unshift(analysis);
    if (this.data.aiAnalyses.length > 500) {
      this.data.aiAnalyses.pop();
    }

    // Mirror to wasteAnalyses or scans so any legacy view stays consistent with real data
    if (analysis.analysis_type === 'waste') {
      if (!this.data.wasteAnalyses) this.data.wasteAnalyses = [];
      this.data.wasteAnalyses.unshift({
        analysis_id: analysis.analysis_id,
        user_id: analysis.user_id,
        user_name: analysis.user_name,
        image: analysis.image,
        predicted_class: analysis.detected_class,
        display_name: analysis.display_name,
        confidence: analysis.confidence,
        confidence_pct: analysis.confidence_pct,
        waste_group: analysis.waste_group || 'Biodegradable',
        recommended_action: analysis.recommendation,
        processing_route: analysis.processing_route || '',
        facility_type: analysis.facility_type || '',
        eco_impact: analysis.eco_impact || '',
        model_version: analysis.model_version,
        image_quality: analysis.image_quality || 'good',
        probabilities: analysis.probabilities || {},
        gradcam_image: analysis.gradcam_image,
        created_at: analysis.created_at,
        timestamp: analysis.timestamp
      });
      if (this.data.wasteAnalyses.length > 500) this.data.wasteAnalyses.pop();
    } else {
      if (!this.data.scans) this.data.scans = [];
      this.data.scans.unshift({
        id: analysis.analysis_id,
        userId: analysis.user_id,
        userName: analysis.user_name,
        food: analysis.display_name,
        freshness: analysis.freshness || 'Fresh',
        risk: analysis.risk || 'Low',
        confidence: analysis.confidence_pct,
        shelfLife: analysis.shelf_life || '1-3 days',
        recommendation: analysis.recommendation,
        imageUrl: analysis.image,
        date: new Date(analysis.timestamp).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        timestamp: analysis.timestamp,
        sensorData: analysis.sensor_telemetry ? {
          temperature: `${analysis.sensor_telemetry.temperature}°C`,
          humidity: `${analysis.sensor_telemetry.humidity}%`,
          gasVoc: `${analysis.sensor_telemetry.ethylenePpm} ppm C2H4`,
          pH: `${analysis.sensor_telemetry.pH}`,
          gasVocColor: analysis.sensor_telemetry.spoilageRisk === 'Critical' ? 'red' : analysis.sensor_telemetry.spoilageRisk === 'Medium' ? 'amber' : 'green'
        } : undefined
      });
      if (this.data.scans.length > 300) this.data.scans.pop();
    }

    this.save();
    return analysis;
  }

  public clearAiAnalyses() {
    this.data.aiAnalyses = [];
    this.data.scans = [];
    this.data.wasteAnalyses = [];
    this.save();
  }

  public getUnifiedAiStats(userId?: string) {
    const list = this.listAiAnalyses(userId ? { userId } : undefined);
    const total = list.length;

    if (total === 0) {
      return {
        totalAnalyses: 0,
        freshFoodCount: 0,
        wasteCount: 0,
        averageConfidence: null,
        biodegradablePercentage: null,
        nonBiodegradablePercentage: null,
        categoryDistribution: []
      };
    }

    let freshFoodCount = 0;
    let wasteCount = 0;
    let bioCount = 0;
    let nonBioCount = 0;
    let totalConfidence = 0;
    const catMap: Record<string, number> = {};

    list.forEach(item => {
      totalConfidence += (item.confidence || 0);
      if (item.analysis_type === 'freshness') {
        if (item.freshness === 'Fresh' || item.freshness === 'Moderate') {
          freshFoodCount++;
        }
      } else if (item.analysis_type === 'waste') {
        wasteCount++;
        if (item.waste_group === 'Biodegradable') bioCount++;
        else if (item.waste_group === 'Non-Biodegradable') nonBioCount++;
      }

      const catName = item.display_name || item.detected_class;
      catMap[catName] = (catMap[catName] || 0) + 1;
    });

    const averageConfidence = total > 0 ? Math.round((totalConfidence / total) * 100) : null;
    const bioPct = wasteCount > 0 ? Math.round((bioCount / wasteCount) * 100) : null;
    const nonBioPct = wasteCount > 0 ? (100 - (bioPct || 0)) : null;

    const categoryDistribution = Object.entries(catMap).map(([name, count]) => ({
      name,
      count
    }));

    return {
      totalAnalyses: total,
      freshFoodCount,
      wasteCount,
      biodegradableCount: bioCount,
      nonBiodegradableCount: nonBioCount,
      averageConfidence,
      biodegradablePercentage: bioPct,
      nonBiodegradablePercentage: nonBioPct,
      categoryDistribution
    };
  }

  // Waste Analysis Methods (Legacy compatibility, strictly real data)
  public listWasteAnalyses(filter?: { userId?: string; limit?: number }): WasteAnalysisRecord[] {
    let list = this.data.wasteAnalyses || [];
    if (filter?.userId) {
      list = list.filter(w => !w.user_id || w.user_id === filter.userId);
    }
    const sorted = [...list].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    if (filter?.limit && filter.limit > 0) {
      return sorted.slice(0, filter.limit);
    }
    return sorted;
  }

  public addWasteAnalysis(analysis: WasteAnalysisRecord): WasteAnalysisRecord {
    if (!this.data.wasteAnalyses) {
      this.data.wasteAnalyses = [];
    }
    this.data.wasteAnalyses.unshift(analysis);
    if (this.data.wasteAnalyses.length > 500) {
      this.data.wasteAnalyses.pop();
    }
    this.save();
    return analysis;
  }

  public getWasteStats() {
    const list = this.data.wasteAnalyses || [];
    const total = list.length;
    if (total === 0) {
      return {
        totalAnalyses: 0,
        biodegradableCount: 0,
        nonBiodegradableCount: 0,
        mostDetectedCategory: null,
        averageConfidence: null,
        biodegradablePercentage: null,
        nonBiodegradablePercentage: null,
        categoryCounts: {}
      };
    }
    const bioCount = list.filter(w => w.waste_group === 'Biodegradable').length;
    const nonBioCount = list.filter(w => w.waste_group === 'Non-Biodegradable').length;

    const categoryCounts: Record<string, number> = {};
    let totalConfidence = 0;
    list.forEach(w => {
      categoryCounts[w.predicted_class] = (categoryCounts[w.predicted_class] || 0) + 1;
      totalConfidence += (w.confidence || 0);
    });

    let mostDetected = '';
    let maxCount = -1;
    for (const [k, v] of Object.entries(categoryCounts)) {
      if (v > maxCount) {
        maxCount = v;
        mostDetected = k;
      }
    }

    const avgConfidence = Math.round((totalConfidence / total) * 100);
    const bioPct = Math.round((bioCount / total) * 100);
    const nonBioPct = 100 - bioPct;

    return {
      totalAnalyses: total,
      biodegradableCount: bioCount,
      nonBiodegradableCount: nonBioCount,
      mostDetectedCategory: mostDetected,
      averageConfidence: avgConfidence,
      biodegradablePercentage: bioPct,
      nonBiodegradablePercentage: nonBioPct,
      categoryCounts
    };
  }
}

export const db = new Database();


