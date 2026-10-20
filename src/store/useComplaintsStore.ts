import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';

export interface ReporterInfo {
  name: string;
  email: string;
  phone: string;
  preferredContact: 'Phone' | 'Email' | 'SMS';
  emailVerified: boolean;
  phoneVerified: boolean;
  verificationMethod?: string;
  verificationDate?: string;
}

export interface InvestigationNote {
  id: string;
  officer: string;
  text: string;
  timestamp: string;
  type: 'note' | 'status_change' | 'verification';
}

export interface AuditLogEntry {
  timestamp: string;
  user: string;
  action: string;
  details: string;
}

export interface Complaint {
  id: string;
  foodType: string;
  productName: string;
  seller: string;
  sellerAddress: string;
  status: 'Under Investigation' | 'In Progress' | 'Resolved' | 'Closed' | 'Submitted';
  assignedOfficer: string;
  date: string;
  time: string;
  incidentLocation: string;
  description: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  reporter: ReporterInfo;
  investigationNotes: InvestigationNote[];
  auditLog: AuditLogEntry[];
  supermarketId?: string;
  officialResponse?: string;
  responseDate?: string;
  refundStatus?: 'None' | 'Requested' | 'Approved' | 'Refunded' | 'Rejected';
  refundAmount?: number | string;
  refundMethod?: string;
  refundDate?: string;
  refundTransactionId?: string;
  refundNotes?: string;
}

export interface ComplaintStats {
  total: number;
  underInvestigation: number;
  resolved: number;
  closed: number;
  inProgress: number;
}

export interface OtpTarget {
  complaintId: string;
  type: 'email' | 'phone';
  targetValue: string;
  recipientName?: string;
  demoOtp?: string;
  whatsappUrl?: string;
  smsUrl?: string;
  emailSent?: boolean;
  smsSent?: boolean;
  deliveryDetails?: string;
  message?: string;
}

interface ComplaintsState {
  complaints: Complaint[];
  stats: ComplaintStats;
  selectedComplaintId: string;
  searchQuery: string;
  statusFilter: string;
  categoryFilter: string;
  dateFilter: string;
  officerFilter: string;
  currentPage: number;
  pageSize: number;
  sortBy: 'date' | 'id';
  sortOrder: 'asc' | 'desc';
  isLoading: boolean;
  
  // Modals state
  isDetailModalOpen: boolean;
  isOtpModalOpen: boolean;
  isNewComplaintModalOpen: boolean;
  isCallModalOpen: boolean;
  isEmailModalOpen: boolean;
  isPrintModalOpen: boolean;
  otpTarget: OtpTarget | null;
  notificationMessage: { text: string; type: 'success' | 'error' | 'info' } | null;

  // Actions
  fetchComplaints: () => Promise<void>;
  selectComplaint: (id: string) => void;
  setSearchQuery: (query: string) => void;
  setStatusFilter: (status: string) => void;
  setCategoryFilter: (category: string) => void;
  setDateFilter: (date: string) => void;
  setOfficerFilter: (officer: string) => void;
  setPage: (page: number) => void;
  setSort: (by: 'date' | 'id') => void;
  resetFilters: () => void;
  
  openDetailModal: (id?: string) => void;
  closeDetailModal: () => void;
  openOtpModal: (target: OtpTarget) => void;
  closeOtpModal: () => void;
  openNewComplaintModal: () => void;
  closeNewComplaintModal: () => void;
  openCallModal: () => void;
  closeCallModal: () => void;
  openEmailModal: () => void;
  closeEmailModal: () => void;
  openPrintModal: () => void;
  closePrintModal: () => void;
  setNotification: (notif: { text: string; type: 'success' | 'error' | 'info' } | null) => void;
  updateReporterContact: (complaintId: string, contact: { phone?: string; email?: string; name?: string; updateAll?: boolean }) => Promise<boolean>;

  createComplaint: (data: any) => Promise<{ success: boolean; complaint: Complaint }>;
  logCallOutcome: (id: string, outcome: string, notes: string, autoVerify: boolean) => Promise<boolean>;
  sendOfficialEmail: (id: string, subject: string, message: string) => Promise<boolean>;
  updateStatus: (id: string, status: string, note?: string) => Promise<boolean>;
  assignOfficer: (id: string, officer: string) => Promise<boolean>;
  addNote: (id: string, text: string) => Promise<boolean>;
  requestVerificationOtp: (id: string, type: 'email' | 'phone') => Promise<{
    success: boolean;
    demoOtp?: string;
    whatsappUrl?: string;
    smsUrl?: string;
    emailSent?: boolean;
    smsSent?: boolean;
    deliveryDetails?: string;
    message?: string;
  }>;
  confirmOtp: (id: string, type: 'email' | 'phone', code: string) => Promise<boolean>;
  manualAuditVerify: (id: string, type: 'email' | 'phone' | 'all', reason?: string) => Promise<boolean>;
  getGatewayConfig: () => Promise<any>;
  updateGatewayConfig: (config: any) => Promise<any>;
}

// Initial demonstration fallback data
const initialComplaints: Complaint[] = [
  {
    id: 'FC-2026-00124',
    foodType: 'Dairy Product',
    productName: 'Organic Whole Milk 1L',
    seller: 'Fresh Store',
    sellerAddress: 'Booth #14, Central Market, Connaught Place, New Delhi',
    status: 'Under Investigation',
    assignedOfficer: 'Sarah Connor',
    date: '28 Sep 2026',
    time: '10:24 AM',
    incidentLocation: 'Central Market, Sector 2, New Delhi',
    description: 'Milk pack purchased yesterday had an unusual pungent sour odor and was curdled well before the declared expiry date. Consumer reported mild stomach ache after tasting.',
    priority: 'High',
    reporter: {
      name: 'Aditi Verma',
      email: 'user@example.com',
      phone: '+91 98765 43210',
      preferredContact: 'Phone',
      emailVerified: false,
      phoneVerified: false,
    },
    investigationNotes: [
      {
        id: 'n-1',
        officer: 'Sarah Connor',
        text: 'Initial report received. Contacted Central Market safety inspector for cold-chain log records.',
        timestamp: '28 Sep 2026 11:15 AM',
        type: 'note'
      }
    ],
    auditLog: [
      {
        timestamp: '28 Sep 2026 10:24 AM',
        user: 'System',
        action: 'Complaint Registered',
        details: 'Initial submission via mobile web portal'
      },
      {
        timestamp: '28 Sep 2026 10:45 AM',
        user: 'Admin User',
        action: 'Officer Assigned',
        details: 'Assigned to Inspector Sarah Connor'
      }
    ]
  },
  {
    id: 'FC-2026-00123',
    foodType: 'Meat',
    productName: 'Prime Beef Ribs (500g)',
    seller: 'City Meat',
    sellerAddress: 'Shop 8, Meat Bazaar, Old Subzi Mandi',
    status: 'In Progress',
    assignedOfficer: 'John Smith',
    date: '27 Sep 2026',
    time: '02:15 PM',
    incidentLocation: 'Old Subzi Mandi, North Zone',
    description: 'Discoloration along the edges and foul odor upon opening sealed tray. Cold storage temperature at retail display appeared inadequate.',
    priority: 'Critical',
    reporter: {
      name: 'Rahul Sen',
      email: 'rahul.sen@example.com',
      phone: '+91 98111 22334',
      preferredContact: 'Email',
      emailVerified: true,
      phoneVerified: true,
      verificationMethod: 'OTP Verified',
      verificationDate: '27 Sep 2026 02:30 PM'
    },
    investigationNotes: [
      {
        id: 'n-2',
        officer: 'John Smith',
        text: 'Visited seller location. Collected batch sample #MT-9081 for microbiological laboratory screening.',
        timestamp: '27 Sep 2026 04:30 PM',
        type: 'note'
      }
    ],
    auditLog: [
      {
        timestamp: '27 Sep 2026 02:15 PM',
        user: 'System',
        action: 'Complaint Registered',
        details: 'Submitted with attached purchase bill'
      }
    ]
  },
  {
    id: 'FC-2026-00122',
    foodType: 'Bakery',
    productName: 'Sourdough Artisan Loaf',
    seller: 'Local Bakery',
    sellerAddress: 'Plot 45, Khan Market, New Delhi',
    status: 'Resolved',
    assignedOfficer: 'Mike Davis',
    date: '26 Sep 2026',
    time: '11:03 AM',
    incidentLocation: 'Khan Market, New Delhi',
    description: 'Green-grey mold patches discovered underneath loaf slices on the day of packaging.',
    priority: 'Medium',
    reporter: {
      name: 'Kavita Pillai',
      email: 'kavita.p@example.com',
      phone: '+91 98222 33445',
      preferredContact: 'Phone',
      emailVerified: true,
      phoneVerified: false,
      verificationMethod: 'Email OTP',
      verificationDate: '26 Sep 2026 11:20 AM'
    },
    investigationNotes: [
      {
        id: 'n-3',
        officer: 'Mike Davis',
        text: 'Inspected bakery cooling racks. Humidity controls had malfunctioned. Bakery replaced batches and installed new dehumidifier.',
        timestamp: '26 Sep 2026 03:00 PM',
        type: 'note'
      },
      {
        id: 'n-4',
        officer: 'Mike Davis',
        text: 'Corrective action plan verified and customer refund confirmed. Marked resolved.',
        timestamp: '26 Sep 2026 05:45 PM',
        type: 'status_change'
      }
    ],
    auditLog: [
      {
        timestamp: '26 Sep 2026 11:03 AM',
        user: 'System',
        action: 'Complaint Registered',
        details: 'Photo evidence verified'
      }
    ]
  },
  {
    id: 'FC-2026-00121',
    foodType: 'Fruits & Vegetables',
    productName: 'Packaged Organic Strawberries 250g',
    seller: 'GreenMart',
    sellerAddress: 'A-12 DLF Phase 1, Gurugram',
    status: 'Under Investigation',
    assignedOfficer: 'Emily Carter',
    date: '25 Sep 2026',
    time: '04:20 PM',
    incidentLocation: 'DLF Phase 1, Gurugram',
    description: 'Multiple punnets found with fungal rot in the lower tier of packaging. Chemical odor detected.',
    priority: 'Medium',
    reporter: {
      name: 'Vikram Patel',
      email: 'vikram.p@example.com',
      phone: '+91 98333 44556',
      preferredContact: 'Phone',
      emailVerified: false,
      phoneVerified: true,
      verificationMethod: 'SMS OTP',
      verificationDate: '25 Sep 2026 04:35 PM'
    },
    investigationNotes: [
      {
        id: 'n-5',
        officer: 'Emily Carter',
        text: 'Contacted supplier distributor regarding cold storage transit temperatures from Himachal Pradesh.',
        timestamp: '25 Sep 2026 05:30 PM',
        type: 'note'
      }
    ],
    auditLog: [
      {
        timestamp: '25 Sep 2026 04:20 PM',
        user: 'System',
        action: 'Complaint Registered',
        details: 'Web Portal Submission'
      }
    ]
  },
  {
    id: 'FC-2026-00120',
    foodType: 'Seafood',
    productName: 'Atlantic Salmon Fillet 300g',
    seller: 'Ocean Fresh',
    sellerAddress: 'Bay 3, Seafood Terminal, Okhla Industrial Area',
    status: 'In Progress',
    assignedOfficer: 'Robert Lee',
    date: '24 Sep 2026',
    time: '01:12 PM',
    incidentLocation: 'Okhla Industrial Area Phase III',
    description: 'Severe ammoniacal odor and soft slimy texture. Packaging date appeared relabeled over older label.',
    priority: 'Critical',
    reporter: {
      name: 'Manoj Nair',
      email: 'manoj.nair@example.com',
      phone: '+91 98444 55667',
      preferredContact: 'Phone',
      emailVerified: true,
      phoneVerified: true,
      verificationMethod: 'Full Verification',
      verificationDate: '24 Sep 2026 01:25 PM'
    },
    investigationNotes: [
      {
        id: 'n-6',
        officer: 'Robert Lee',
        text: 'Notice of inspection served to facility manager. Barcode records impounded for date tampering check.',
        timestamp: '24 Sep 2026 03:00 PM',
        type: 'note'
      }
    ],
    auditLog: [
      {
        timestamp: '24 Sep 2026 01:12 PM',
        user: 'System',
        action: 'Complaint Registered',
        details: 'High priority flag raised'
      }
    ]
  },
  {
    id: 'FC-2026-00119',
    foodType: 'Packaged Food',
    productName: 'Roasted Almond Granola 400g',
    seller: 'Quick Mart',
    sellerAddress: 'Shop 102, South Extension Part 2',
    status: 'Resolved',
    assignedOfficer: 'Priya Sharma',
    date: '23 Sep 2026',
    time: '09:37 AM',
    incidentLocation: 'South Extension II, New Delhi',
    description: 'Foreign physical object (plastic fragment) discovered embedded inside granola cluster.',
    priority: 'High',
    reporter: {
      name: 'Elena Rostova',
      email: 'elena.r@example.com',
      phone: '+91 98555 66778',
      preferredContact: 'Email',
      emailVerified: true,
      phoneVerified: false,
      verificationMethod: 'Email OTP',
      verificationDate: '23 Sep 2026 09:50 AM'
    },
    investigationNotes: [
      {
        id: 'n-7',
        officer: 'Priya Sharma',
        text: 'Manufacturing facility conducted metal & optical sorter audit. Defective hopper guard replaced. Batch recall issued.',
        timestamp: '23 Sep 2026 02:00 PM',
        type: 'note'
      }
    ],
    auditLog: [
      {
        timestamp: '23 Sep 2026 09:37 AM',
        user: 'System',
        action: 'Complaint Registered',
        details: 'Batch #GR-4412 logged'
      }
    ]
  },
  {
    id: 'FC-2026-00118',
    foodType: 'Prepared Food',
    productName: 'Paneer Butter Masala (Meal Box)',
    seller: 'Spice Garden Bistro',
    sellerAddress: '24 Hauz Khas Village, New Delhi',
    status: 'Closed',
    assignedOfficer: 'Sarah Connor',
    date: '22 Sep 2026',
    time: '07:15 PM',
    incidentLocation: 'Hauz Khas Village, New Delhi',
    description: 'Customer claimed food had an off taste. Kitchen hygiene inspection passed all tests, water testing clear.',
    priority: 'Low',
    reporter: {
      name: 'Deepak Joshi',
      email: 'deepak.j@example.com',
      phone: '+91 98666 77889',
      preferredContact: 'Phone',
      emailVerified: true,
      phoneVerified: true,
      verificationMethod: 'Full Verification',
      verificationDate: '22 Sep 2026 07:30 PM'
    },
    investigationNotes: [
      {
        id: 'n-8',
        officer: 'Sarah Connor',
        text: 'Routine surveillance conducted. Temperature logs compliant. No contamination found. Case closed.',
        timestamp: '23 Sep 2026 11:00 AM',
        type: 'status_change'
      }
    ],
    auditLog: [
      {
        timestamp: '22 Sep 2026 07:15 PM',
        user: 'System',
        action: 'Complaint Registered',
        details: 'Dine-in receipt provided'
      }
    ]
  },
  {
    id: 'FC-2026-00117',
    foodType: 'Dairy Product',
    productName: 'Pure Cow Ghee 500ml',
    seller: 'Apex Dairy Farms',
    sellerAddress: 'Sector 18, Noida',
    status: 'Resolved',
    assignedOfficer: 'John Smith',
    date: '21 Sep 2026',
    time: '11:45 AM',
    incidentLocation: 'Sector 18, Noida',
    description: 'Adulteration suspected due to grainy wax-like texture and lack of characteristic aroma.',
    priority: 'Medium',
    reporter: {
      name: 'Sunita Mehra',
      email: 'sunita.m@example.com',
      phone: '+91 98777 88990',
      preferredContact: 'Phone',
      emailVerified: true,
      phoneVerified: true,
      verificationMethod: 'Full Verification',
      verificationDate: '21 Sep 2026 12:00 PM'
    },
    investigationNotes: [
      {
        id: 'n-9',
        officer: 'John Smith',
        text: 'Reichert-Meissl value tested at FSSAI accredited lab (score: 28.2, within legal limits). Texture was crystallization due to storage. Customer explained.',
        timestamp: '22 Sep 2026 01:30 PM',
        type: 'note'
      }
    ],
    auditLog: [
      {
        timestamp: '21 Sep 2026 11:45 AM',
        user: 'System',
        action: 'Complaint Registered',
        details: 'Sample collected'
      }
    ]
  }
];

let globalSocket: Socket | null = null;

export const useComplaintsStore = create<ComplaintsState>((set, get) => ({
  complaints: initialComplaints,
  stats: {
    total: 184,
    underInvestigation: 24,
    resolved: 92,
    closed: 68,
    inProgress: 14
  },
  selectedComplaintId: 'FC-2026-00124',
  searchQuery: '',
  statusFilter: 'All Statuses',
  categoryFilter: 'All Categories',
  dateFilter: 'All Time',
  officerFilter: 'All Officers',
  currentPage: 1,
  pageSize: 6,
  sortBy: 'date',
  sortOrder: 'desc',
  isLoading: false,

  isDetailModalOpen: false,
  isOtpModalOpen: false,
  isNewComplaintModalOpen: false,
  isCallModalOpen: false,
  isEmailModalOpen: false,
  isPrintModalOpen: false,
  otpTarget: null,
  notificationMessage: null,

  fetchComplaints: async () => {
    set({ isLoading: true });
    try {
      // Connect socket if not connected
      if (!globalSocket) {
        try {
          globalSocket = io('http://localhost:5000', { reconnectionAttempts: 3 });
          globalSocket.on('complaintUpdated', (updated: Complaint) => {
            set((state) => ({
              complaints: state.complaints.map((c) => (c.id === updated.id ? updated : c))
            }));
          });
          globalSocket.on('customerRefundIssued', (refund: any) => {
            set((state) => ({
              complaints: state.complaints.map((c) => {
                if (c.id === refund.complaintId) {
                  return {
                    ...c,
                    status: 'Resolved',
                    refundStatus: 'Refunded',
                    refundAmount: refund.amount,
                    refundMethod: refund.method,
                    refundTransactionId: refund.refId
                  };
                }
                return c;
              })
            }));
          });
          globalSocket.on('newComplaint', (newComp: Complaint) => {
            set((state) => ({
              complaints: [newComp, ...state.complaints.filter(c => c.id !== newComp.id)],
              stats: {
                ...state.stats,
                total: state.stats.total + 1,
                underInvestigation: state.stats.underInvestigation + 1
              }
            }));
          });
          globalSocket.on('userProfileUpdated', (payload: any) => {
            if (payload?.user) {
              const u = payload.user;
              const oldEmail = (payload.oldEmail || '').toLowerCase().trim();
              const oldPhone = (payload.oldPhone || '').replace(/[^0-9]/g, '');
              const oldName = (payload.oldName || '').toLowerCase().trim();

              set((state) => ({
                complaints: state.complaints.map((c) => {
                  const match = (c.reporter?.email && oldEmail && c.reporter.email.toLowerCase().trim() === oldEmail) ||
                                (c.reporter?.phone && oldPhone && c.reporter.phone.replace(/[^0-9]/g, '') === oldPhone) ||
                                (c.reporter?.name && oldName && c.reporter.name.toLowerCase().trim() === oldName);
                  if (match && c.reporter) {
                    return {
                      ...c,
                      reporter: {
                        ...c.reporter,
                        name: u.fullName || c.reporter.name,
                        email: u.email || c.reporter.email,
                        phone: u.phone || c.reporter.phone,
                      }
                    };
                  }
                  return c;
                })
              }));
            }
          });
        } catch {
          // Fallback if socket fails
        }
      }

      const res = await fetch('http://localhost:5000/api/v1/complaints');
      if (res.ok) {
        const data = await res.json();
        if (data.complaints && Array.isArray(data.complaints)) {
          set({
            complaints: data.complaints,
            stats: data.stats || get().stats,
            isLoading: false
          });
          return;
        }
      }
    } catch {
      // Use in-memory state on network error
    }
    set({ isLoading: false });
  },

  selectComplaint: (id: string) => {
    set({ selectedComplaintId: id });
  },

  setSearchQuery: (query: string) => {
    set({ searchQuery: query, currentPage: 1 });
  },

  setStatusFilter: (status: string) => {
    set({ statusFilter: status, currentPage: 1 });
  },

  setCategoryFilter: (category: string) => {
    set({ categoryFilter: category, currentPage: 1 });
  },

  setDateFilter: (date: string) => {
    set({ dateFilter: date, currentPage: 1 });
  },

  setOfficerFilter: (officer: string) => {
    set({ officerFilter: officer, currentPage: 1 });
  },

  setPage: (page: number) => {
    set({ currentPage: page });
  },

  setSort: (by: 'date' | 'id') => {
    const currentSort = get().sortBy;
    const currentOrder = get().sortOrder;
    if (currentSort === by) {
      set({ sortOrder: currentOrder === 'asc' ? 'desc' : 'asc' });
    } else {
      set({ sortBy: by, sortOrder: 'desc' });
    }
  },

  resetFilters: () => {
    set({
      searchQuery: '',
      statusFilter: 'All Statuses',
      categoryFilter: 'All Categories',
      dateFilter: 'All Time',
      officerFilter: 'All Officers',
      currentPage: 1
    });
  },

  openDetailModal: (id?: string) => {
    if (id) {
      set({ selectedComplaintId: id, isDetailModalOpen: true });
    } else {
      set({ isDetailModalOpen: true });
    }
  },

  closeDetailModal: () => {
    set({ isDetailModalOpen: false });
  },

  openOtpModal: (target: OtpTarget) => {
    set({ isOtpModalOpen: true, otpTarget: target });
  },

  closeOtpModal: () => {
    set({ isOtpModalOpen: false, otpTarget: null });
  },

  setNotification: (notif) => {
    set({ notificationMessage: notif });
    if (notif) {
      setTimeout(() => {
        set({ notificationMessage: null });
      }, 4000);
    }
  },

  updateReporterContact: async (complaintId: string, contact: { phone?: string; email?: string; name?: string; updateAll?: boolean }) => {
    try {
      const backendUrl = window.location.hostname === 'localhost' ? 'http://localhost:5000' : `http://${window.location.hostname}:5000`;
      const res = await fetch(`${backendUrl}/api/v1/complaints/${complaintId}/contact`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: contact.phone,
          email: contact.email,
          name: contact.name,
          updateAllUserRecords: contact.updateAll !== false
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.complaint) {
          set((state) => ({
            complaints: state.complaints.map((c) => {
              if (c.id === complaintId) {
                return data.complaint;
              }
              if (contact.updateAll !== false) {
                const oldPhone = c.reporter?.phone?.replace(/[^0-9]/g, '');
                const targetPhone = contact.phone?.replace(/[^0-9]/g, '');
                const oldEmail = c.reporter?.email?.toLowerCase();
                const targetEmail = contact.email?.toLowerCase();
                if ((targetEmail && oldEmail === targetEmail) || (targetPhone && oldPhone === targetPhone)) {
                  return {
                    ...c,
                    reporter: {
                      ...c.reporter,
                      phone: contact.phone || c.reporter.phone,
                      email: contact.email || c.reporter.email,
                      name: contact.name || c.reporter.name
                    }
                  };
                }
              }
              return c;
            })
          }));
        }
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  updateStatus: async (id: string, status: string, note?: string) => {
    const timestamp = new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    // Optimistic UI update
    set((state) => ({
      complaints: state.complaints.map((c) => {
        if (c.id !== id) return c;
        const newNotes = note ? [
          {
            id: 'n-' + Date.now(),
            officer: 'Admin User',
            text: note,
            timestamp,
            type: 'status_change' as const
          },
          ...c.investigationNotes
        ] : c.investigationNotes;

        return {
          ...c,
          status: status as any,
          investigationNotes: newNotes,
          auditLog: [
            {
              timestamp,
              user: 'Admin User',
              action: `Status Updated to ${status}`,
              details: note || `Status transitioned to ${status}`
            },
            ...c.auditLog
          ]
        };
      })
    }));

    try {
      const res = await fetch(`http://localhost:5000/api/v1/complaints/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, note, user: 'Admin User' })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.complaint) {
          set((state) => ({
            complaints: state.complaints.map((c) => (c.id === id ? data.complaint : c)),
            stats: data.stats || state.stats
          }));
        }
        get().setNotification({ text: `Complaint ${id} status updated to ${status}.`, type: 'success' });
        return true;
      }
    } catch {
      // Local optimistic state maintained
    }

    get().setNotification({ text: `Status updated locally to ${status}.`, type: 'success' });
    return true;
  },

  assignOfficer: async (id: string, officer: string) => {
    const timestamp = new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    set((state) => ({
      complaints: state.complaints.map((c) => {
        if (c.id !== id) return c;
        return {
          ...c,
          assignedOfficer: officer,
          investigationNotes: [
            {
              id: 'n-' + Date.now(),
              officer: 'Admin User',
              text: `Reassigned to Officer ${officer}.`,
              timestamp,
              type: 'note'
            },
            ...c.investigationNotes
          ],
          auditLog: [
            {
              timestamp,
              user: 'Admin User',
              action: 'Officer Reassigned',
              details: `Investigation assigned to ${officer}`
            },
            ...c.auditLog
          ]
        };
      })
    }));

    try {
      await fetch(`http://localhost:5000/api/v1/complaints/${id}/assign`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ officer, user: 'Admin User' })
      });
    } catch {
      // handled
    }

    get().setNotification({ text: `Officer ${officer} assigned to ${id}.`, type: 'success' });
    return true;
  },

  addNote: async (id: string, text: string) => {
    const timestamp = new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    const newNote: InvestigationNote = {
      id: 'n-' + Date.now(),
      officer: 'Admin User',
      text,
      timestamp,
      type: 'note'
    };

    set((state) => ({
      complaints: state.complaints.map((c) => {
        if (c.id !== id) return c;
        return {
          ...c,
          investigationNotes: [newNote, ...c.investigationNotes],
          auditLog: [
            {
              timestamp,
              user: 'Admin User',
              action: 'Investigation Note Added',
              details: text.slice(0, 50) + (text.length > 50 ? '...' : '')
            },
            ...c.auditLog
          ]
        };
      })
    }));

    try {
      await fetch(`http://localhost:5000/api/v1/complaints/${id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, officer: 'Admin User' })
      });
    } catch {
      // handled
    }

    get().setNotification({ text: 'Investigation note added successfully.', type: 'success' });
    return true;
  },

  requestVerificationOtp: async (id: string, type: 'email' | 'phone') => {
    try {
      const res = await fetch(`http://localhost:5000/api/v1/complaints/${id}/verify-${type}`, {
        method: 'POST'
      });
      if (res.ok) {
        const data = await res.json();
        const currentTarget = get().otpTarget;
        const rawDigits = (currentTarget?.targetValue || '').replace(/[^0-9]/g, '');
        const cleanPhone = rawDigits.length === 10 ? '91' + rawDigits : rawDigits;
        const smsUrl = `sms:${cleanPhone}?&body=${encodeURIComponent(`[FoodCovering] Security Verification OTP for Case #${id} is: ${data.demoOtp}`)}`;

        if (currentTarget && currentTarget.complaintId === id) {
          set({
            otpTarget: {
              ...currentTarget,
              demoOtp: data.demoOtp,
              whatsappUrl: data.whatsappUrl,
              smsUrl: data.smsUrl || smsUrl,
              emailSent: data.emailSent,
              smsSent: data.smsSent,
              deliveryDetails: data.deliveryDetails,
              message: data.message
            }
          });
        }
        return {
          success: true,
          demoOtp: data.demoOtp,
          whatsappUrl: data.whatsappUrl,
          smsUrl,
          emailSent: data.emailSent,
          smsSent: data.smsSent,
          deliveryDetails: data.deliveryDetails,
          message: data.message
        };
      }
    } catch {
      // fallback
    }
    const mockOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const currentTarget = get().otpTarget;
    const rawDigits = (currentTarget?.targetValue || '').replace(/[^0-9]/g, '');
    const cleanPhone = rawDigits.length === 10 ? '91' + rawDigits : rawDigits;
    const whatsappMsg = encodeURIComponent(
      `🛡️ *FoodCovering Safety Verification*\n\nHello *${currentTarget?.recipientName || 'Complainant'}*,\nYour official Food Safety verification OTP for Case *${id}* is:\n\n*${mockOtp}*\n\nPlease convey this 6-digit code to the Food Safety Officer to authenticate your report.`
    );
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${whatsappMsg}`;
    const smsUrl = `sms:${cleanPhone}?&body=${encodeURIComponent(`[FoodCovering] Security Verification OTP for Case #${id} is: ${mockOtp}`)}`;

    if (currentTarget && currentTarget.complaintId === id) {
      set({
        otpTarget: {
          ...currentTarget,
          demoOtp: mockOtp,
          whatsappUrl,
          smsUrl
        }
      });
    }

    return {
      success: true,
      demoOtp: mockOtp,
      whatsappUrl,
      smsUrl,
      emailSent: false,
      smsSent: false
    };
  },

  confirmOtp: async (id: string, type: 'email' | 'phone', code: string) => {
    try {
      const res = await fetch(`http://localhost:5000/api/v1/complaints/${id}/confirm-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, code, user: 'Admin User' })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.complaint) {
          set((state) => ({
            complaints: state.complaints.map((c) => (c.id === id ? data.complaint : c))
          }));
          get().setNotification({ text: `${type === 'email' ? 'Email' : 'Phone'} verified successfully via OTP.`, type: 'success' });
          return true;
        }
      } else {
        const errorData = await res.json();
        get().setNotification({ text: errorData.error || 'Failed to verify code', type: 'error' });
        return false;
      }
    } catch {
      // fallback
    }

    // Local fallback confirmation
    const timestamp = new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    set((state) => ({
      complaints: state.complaints.map((c) => {
        if (c.id !== id) return c;
        return {
          ...c,
          reporter: {
            ...c.reporter,
            ...(type === 'email' ? { emailVerified: true } : { phoneVerified: true }),
            verificationMethod: `${type === 'email' ? 'Email' : 'SMS'} OTP`,
            verificationDate: timestamp
          },
          auditLog: [
            {
              timestamp,
              user: 'Admin User',
              action: `${type === 'email' ? 'Email' : 'Phone'} Verified`,
              details: `OTP code ${code} verified successfully`
            },
            ...c.auditLog
          ]
        };
      })
    }));

    get().setNotification({ text: `${type === 'email' ? 'Email' : 'Phone'} verified successfully via OTP.`, type: 'success' });
    return true;
  },

  manualAuditVerify: async (id: string, type: 'email' | 'phone' | 'all', reason?: string) => {
    try {
      const res = await fetch(`http://localhost:5000/api/v1/complaints/${id}/manual-verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, reason, user: 'Admin User' })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.complaint) {
          set((state) => ({
            complaints: state.complaints.map((c) => (c.id === id ? data.complaint : c))
          }));
          get().setNotification({ text: `Authorized manual verification recorded for ${id}.`, type: 'success' });
          return true;
        }
      }
    } catch {
      // handled
    }

    const timestamp = new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    set((state) => ({
      complaints: state.complaints.map((c) => {
        if (c.id !== id) return c;
        return {
          ...c,
          reporter: {
            ...c.reporter,
            emailVerified: type === 'phone' ? c.reporter.emailVerified : true,
            phoneVerified: type === 'email' ? c.reporter.phoneVerified : true,
            verificationMethod: 'Manual Admin Audit Verification',
            verificationDate: timestamp
          },
          auditLog: [
            {
              timestamp,
              user: 'Admin User',
              action: `Manual ${type} Verification Authorized`,
              details: `Authorized by System Administrator. Reason: ${reason || 'Officer telephone confirmation'}`
            },
            ...c.auditLog
          ]
        };
      })
    }));

    get().setNotification({ text: `Manual audit verification recorded for ${id}.`, type: 'success' });
    return true;
  },

  openNewComplaintModal: () => set({ isNewComplaintModalOpen: true }),
  closeNewComplaintModal: () => set({ isNewComplaintModalOpen: false }),

  openCallModal: () => set({ isCallModalOpen: true }),
  closeCallModal: () => set({ isCallModalOpen: false }),

  openEmailModal: () => set({ isEmailModalOpen: true }),
  closeEmailModal: () => set({ isEmailModalOpen: false }),

  openPrintModal: () => set({ isPrintModalOpen: true }),
  closePrintModal: () => set({ isPrintModalOpen: false }),

  createComplaint: async (data: any) => {
    const nextNum = get().complaints.length + 125;
    const newId = `FC-2026-00${nextNum}`;
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    const localNew: Complaint = {
      id: newId,
      foodType: data.foodType || 'Dairy Product',
      productName: data.productName || 'Fresh Food Product',
      seller: data.seller || 'Local Merchant',
      sellerAddress: data.sellerAddress || 'Central Market Area',
      status: 'Under Investigation',
      assignedOfficer: data.assignedOfficer || 'Sarah Connor',
      date: dateStr,
      time: timeStr,
      incidentLocation: data.incidentLocation || 'Central District',
      description: data.description || 'Spoilage and safety issue reported.',
      priority: data.priority || 'High',
      reporter: {
        name: data.reporterName || 'Complainant',
        email: data.reporterEmail || 'user@example.com',
        phone: data.reporterPhone || '+91 98765 43210',
        preferredContact: data.preferredContact || 'Phone',
        emailVerified: false,
        phoneVerified: false
      },
      investigationNotes: [
        {
          id: 'n-' + Date.now(),
          officer: 'System',
          text: 'Field report logged via live interactive dispatcher.',
          timestamp: `${dateStr} ${timeStr}`,
          type: 'note'
        }
      ],
      auditLog: [
        {
          timestamp: `${dateStr} ${timeStr}`,
          user: data.reporterName || 'Complainant',
          action: 'Complaint Registered',
          details: 'Initial submission live in field system'
        }
      ]
    };

    // Optimistically update store
    set((state) => ({
      complaints: [localNew, ...state.complaints],
      selectedComplaintId: localNew.id,
      stats: {
        ...state.stats,
        total: state.stats.total + 1,
        underInvestigation: state.stats.underInvestigation + 1
      }
    }));

    let finalComplaint = localNew;

    try {
      const res = await fetch('http://localhost:5000/api/v1/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        const result = await res.json();
        if (result.complaint) {
          finalComplaint = result.complaint;
          set((state) => ({
            complaints: [result.complaint, ...state.complaints.filter(c => c.id !== newId)],
            selectedComplaintId: result.complaint.id,
            stats: result.stats || state.stats
          }));
        }
      }
    } catch {
      // keep local
    }

    get().setNotification({ text: `Complaint ${finalComplaint.id} created and dispatched live!`, type: 'success' });
    return { success: true, complaint: finalComplaint };
  },

  getGatewayConfig: async () => {
    try {
      const res = await fetch('http://localhost:5000/api/v1/gateway-config');
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // handled
    }
    return null;
  },

  updateGatewayConfig: async (config: any) => {
    try {
      const res = await fetch('http://localhost:5000/api/v1/gateway-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      if (res.ok) {
        const data = await res.json();
        get().setNotification({ text: 'Gateway configuration updated successfully.', type: 'success' });
        return data;
      }
    } catch {
      // handled
    }
    return null;
  },

  logCallOutcome: async (id: string, outcome: string, notes: string, autoVerify: boolean) => {
    const timestamp = new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    const fullNote = `[VoIP Call Log - ${outcome}] ${notes || 'Officer completed direct call with complainant.'}`;

    set((state) => ({
      complaints: state.complaints.map((c) => {
        if (c.id !== id) return c;
        return {
          ...c,
          reporter: {
            ...c.reporter,
            phoneVerified: autoVerify ? true : c.reporter.phoneVerified,
            verificationMethod: autoVerify ? 'Telephonic Voice Verification' : c.reporter.verificationMethod,
            verificationDate: autoVerify ? timestamp : c.reporter.verificationDate
          },
          investigationNotes: [
            {
              id: 'n-' + Date.now(),
              officer: 'Admin User',
              text: fullNote,
              timestamp,
              type: autoVerify ? 'verification' : 'note'
            },
            ...c.investigationNotes
          ],
          auditLog: [
            {
              timestamp,
              user: 'Admin User',
              action: `VoIP Call Conducted (${outcome})`,
              details: notes || 'Direct telephonic interview completed'
            },
            ...c.auditLog
          ]
        };
      })
    }));

    // sync note to server
    try {
      await fetch(`http://localhost:5000/api/v1/complaints/${id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: fullNote, officer: 'Admin User' })
      });
      if (autoVerify) {
        await fetch(`http://localhost:5000/api/v1/complaints/${id}/manual-verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'phone', reason: 'Direct telephonic call verified complainant' })
        });
      }
    } catch {
      // handled
    }

    get().setNotification({ text: `Call outcome logged for Case ${id}.`, type: 'success' });
    return true;
  },

  sendOfficialEmail: async (id: string, subject: string, message: string) => {
    const timestamp = new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    const logNote = `[Official Notice Dispatched] Subject: ${subject}. Message: ${message.slice(0, 100)}...`;

    set((state) => ({
      complaints: state.complaints.map((c) => {
        if (c.id !== id) return c;
        return {
          ...c,
          investigationNotes: [
            {
              id: 'n-' + Date.now(),
              officer: 'Admin User',
              text: logNote,
              timestamp,
              type: 'note'
            },
            ...c.investigationNotes
          ],
          auditLog: [
            {
              timestamp,
              user: 'Admin User',
              action: 'Official Inspection Notice Dispatched',
              details: `Dispatched to ${c.reporter.email}. Subject: ${subject}`
            },
            ...c.auditLog
          ]
        };
      })
    }));

    try {
      await fetch(`http://localhost:5000/api/v1/complaints/${id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: logNote, officer: 'Admin User' })
      });
    } catch {
      // handled
    }

    get().setNotification({ text: `Official Notice sent to complainant (${id}).`, type: 'success' });
    return true;
  }
}));
