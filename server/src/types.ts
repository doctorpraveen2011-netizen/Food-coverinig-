export type UserRole = 'NORMAL_USER' | 'SUPERMARKET_OFFICIAL' | 'HEAD_OFFICE_ADMIN';

export interface User {
  id: string;
  email: string;
  username: string;
  passwordHash: string;
  fullName: string;
  phone: string;
  address?: string;
  role: UserRole;
  supermarketId?: string;
  branchId?: string;
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

export type SafeUser = Omit<User, 'passwordHash'>;

export interface Supermarket {
  id: string;
  name: string;
  code: string;
  contactPhone: string;
  contactEmail: string;
  address: string;
  city: string;
  region: string;
  status: 'Active' | 'Inactive';
  createdAt: string;
}

export interface SupermarketBranch {
  id: string;
  supermarketId: string;
  branchName: string;
  branchCode: string;
  address: string;
  city: string;
  region: string;
  contactPhone: string;
  managerName: string;
  status: 'Active' | 'Inactive';
}

export interface ScanRecord {
  id: string;
  userId?: string;
  userName?: string;
  food: string;
  freshness: 'Fresh' | 'Moderate' | 'Spoiled';
  risk: 'Low' | 'Medium' | 'High';
  confidence: string;
  shelfLife: string;
  recommendation: string;
  imageUrl?: string;
  sensorData?: {
    temperature: string;
    humidity: string;
    gasVoc: string;
    pH: string;
  };
  actionTaken?: 'None' | 'Donated' | 'Reported';
  date: string;
  timestamp: number;
}

export interface InventoryItem {
  id: string;
  supermarketId: string;
  branchId: string;
  name: string;
  category: string;
  batchNumber: string;
  barcode?: string;
  quantity: number;
  unit: string;
  expiryDate: string;
  freshnessStatus: 'Fresh' | 'Moderate' | 'Near-Expiry' | 'Spoiled';
  riskLevel: 'Low' | 'Medium' | 'High';
  inspectionResult?: string;
  flaggedForDonation: boolean;
  notes?: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NGODetails {
  name: string;
  type: string;
  verificationStatus: string;
  address?: string;
  phone?: string;
}

export interface DonationTimelineStep {
  title: string;
  timestamp?: string;
  completed: boolean;
  active?: boolean;
}

export interface DonationRecord {
  id: string;
  donorType: 'INDIVIDUAL' | 'SUPERMARKET';
  donorUserId: string;
  donorName: string;
  donorPhone: string;
  donorEmail: string;
  supermarketId?: string;
  branchId?: string;
  foodItems: string;
  title?: string;
  category: string;
  quantity: string;
  weight?: string;
  freshness?: string;
  pickupTime?: string;
  expiryDate: string;
  pickupAddress: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  destinationLatitude?: number;
  destinationLongitude?: number;
  receiver: string;
  volunteer?: string;
  volunteerId?: string;
  volunteerPhone?: string;
  volunteerLatitude?: number;
  volunteerLongitude?: number;
  volunteerLastUpdated?: string;
  distanceKm?: number;
  status: 'Pending' | 'Verified' | 'Assigned' | 'Pickup Scheduled' | 'Picked Up' | 'In Transit' | 'In Progress' | 'Delivered' | 'Cancelled' | 'Rejected';
  statusBadgeText?: string;
  eta?: string;
  notes?: string;
  date: string;
  createdAt: string;
  creditPoints?: number;
  co2SavedKg?: number;
  destinationAddress?: string;
  destinationType?: string;
  destinationContact?: string;
  beneficiaries?: string;
  volunteerVehicle?: string;
  verificationType?: 'MANUAL' | 'AI_CERTIFIED';
  ngo?: NGODetails;
  timeline?: DonationTimelineStep[];
}

export interface ComplaintNote {
  id: string;
  officer: string;
  text: string;
  timestamp: string;
  type: 'note' | 'status_change' | 'supermarket_response' | 'verification';
}

export interface ComplaintAudit {
  timestamp: string;
  user: string;
  action: string;
  details: string;
}

export interface ComplaintTimelineStage {
  title: string;
  timestamp?: string;
  actor?: string;
  status: 'completed' | 'current' | 'pending';
}

export interface ComplaintRecord {
  id: string;
  caseId?: string;
  reporterUserId?: string;
  reporterName: string;
  reporterEmail: string;
  reporterPhone: string;
  foodType: string;
  productName: string;
  quantity?: string;
  batchNumber?: string;
  expiryDate?: string;
  seller: string;
  supermarketId?: string;
  branchId?: string;
  sellerAddress: string;
  purchaseLocation?: string;
  incidentLocation: string;
  purchaseDate?: string;
  description: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Submitted' | 'Under Review' | 'Under Investigation' | 'Sample Collected' | 'Lab Analysis' | 'In Progress' | 'Resolved' | 'Closed' | 'Rejected';
  assignedOfficer: string;
  officialResponse?: string;
  escalatedToHeadOffice?: boolean;
  evidenceImages: string[];
  investigationNotes: ComplaintNote[];
  auditLog: ComplaintAudit[];
  timeline?: ComplaintTimelineStage[];
  closureReason?: string;
  refundStatus?: 'None' | 'Requested' | 'Approved' | 'Refunded' | 'Rejected';
  refundAmount?: number | string;
  refundMethod?: 'Cash' | 'UPI' | 'Store Credit' | 'Bank Transfer';
  refundDate?: string;
  refundTransactionId?: string;
  refundNotes?: string;
  date: string;
  time: string;
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  userId: string;
  userEmail: string;
  userRole: string;
  action: string;
  entityType: string;
  entityId?: string;
  details: string;
  ipAddress?: string;
  timestamp: string;
}

export interface PlatformAlert {
  id: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  targetRole?: string;
  supermarketId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface AuthTokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  supermarketId?: string;
  branchId?: string;
}

export interface WasteAnalysisRecord {
  analysis_id: string;
  user_id?: string;
  user_name?: string;
  image: string;
  predicted_class: string;
  display_name: string;
  confidence: number;
  confidence_pct: string;
  waste_group: 'Biodegradable' | 'Non-Biodegradable';
  recommended_action: string;
  processing_route: string;
  facility_type: string;
  eco_impact: string;
  model_version: string;
  image_quality: string;
  probabilities: Record<string, number>;
  gradcam_image?: string;
  source?: 'manual_upload' | 'camera_capture';
  created_at: string;
  timestamp: number;
}

export interface AiAnalysisRecord {
  analysis_id: string;
  user_id?: string;
  user_name?: string;
  analysis_type: 'freshness' | 'waste';
  source: 'manual_upload' | 'camera_capture';
  image: string;
  detected_class: string;
  display_name: string;
  confidence: number;
  confidence_pct: string;
  recommendation: string;
  model_version: string;
  // Freshness details
  detected_food?: string;
  freshness?: 'Fresh' | 'Moderate' | 'Spoiled';
  risk?: 'Low' | 'Medium' | 'High';
  shelf_life?: string;
  // Waste details
  waste_group?: 'Biodegradable' | 'Non-Biodegradable';
  category?: string;
  processing_route?: string;
  facility_type?: string;
  eco_impact?: string;
  probabilities?: Record<string, number>;
  gradcam_image?: string;
  image_quality?: string;
  sensor_telemetry?: any;
  detected_objects?: Array<{
    id: string;
    label: string;
    detector_category?: string;
    confidence: number;
    confidence_pct: string;
    bbox: number[];
    bbox_norm?: number[];
    category: string;
    waste_group: string;
    processing_type: string;
    recommendation: string;
    is_food?: boolean;
    low_confidence?: boolean;
  }>;
  scene_summary?: {
    total_objects: number;
    distinct_categories: string[];
    waste_groups_present: string[];
    is_mixed_stream: boolean;
    segregation_guidance: string;
  };
  low_confidence?: boolean;
  guidance_note?: string;
  created_at: string;
  timestamp: number;
}

export interface AiFeedbackRecord {
  id: string;
  analysis_id: string;
  user_id?: string;
  is_correct: boolean;
  predicted_class: string;
  corrected_category?: string;
  notes?: string;
  image?: string;
  status: 'pending_review' | 'approved' | 'rejected';
  created_at: string;
}

