import { create } from 'zustand';

export interface AlertRule {
  id: string;
  name: string;
  trigger: string;
  condition: string;
  recipientGroup: string;
  enabled: boolean;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  lastTriggered?: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  category: 'Critical' | 'Operations' | 'Donation' | 'Volunteer' | 'Digest';
  body: string;
  variables: string[];
  lastModified: string;
}

export interface EmailLog {
  id: string;
  recipient: string;
  subject: string;
  status: 'Delivered' | 'Pending' | 'Failed' | 'Bounced';
  timestamp: string;
  ruleName: string;
  latencyMs: number;
}

export interface SmsTemplate {
  id: string;
  name: string;
  category: 'Urgent' | 'Verification' | 'Status' | 'Reminder';
  body: string;
  variables: string[];
  charCount: number;
  segments: number;
  lastModified: string;
}

export interface SmsLog {
  id: string;
  phone: string;
  recipientName: string;
  messagePreview: string;
  status: 'Delivered' | 'Sent' | 'Failed';
  timestamp: string;
  carrier: string;
  ruleName: string;
}

export interface AssignmentRule {
  id: string;
  name: string;
  description: string;
  priority: 'High' | 'Medium' | 'Low';
  enabled: boolean;
  conditionText: string;
}

export interface VolunteerProfile {
  id: string;
  name: string;
  phone: string;
  status: 'Available' | 'On Delivery' | 'Offline';
  currentZone: string;
  vehicleType: 'Motorcycle' | 'Van (Refrigerated)' | 'Car' | 'Bicycle';
  rating: number;
  completedTasks: number;
  activeTasks: number;
  distanceKm?: number;
  foodSafetyCertified: boolean;
}

export interface AssignmentRecord {
  id: string;
  requestTitle: string;
  donorOrSeller: string;
  location: string;
  assignedVolunteer: string;
  volunteerPhone: string;
  status: 'Accepted' | 'En Route' | 'Picked Up' | 'Completed' | 'Pending';
  etaMinutes: number;
  distanceKm: number;
  assignedAt: string;
  urgency: 'Immediate' | 'Standard' | 'Scheduled';
}

interface AlertsState {
  // Master Switches
  emailAlertsEnabled: boolean;
  smsAlertsEnabled: boolean;
  autoAssignEnabled: boolean;
  
  // Overview KPIs
  stats: {
    totalAlerts: number;
    emailsSent: number;
    smsSent: number;
    pendingAlerts: number;
  };

  // Email Configuration
  emailProvider: {
    name: string;
    host: string;
    port: number;
    authEmail: string;
    status: 'Connected' | 'Degraded' | 'Disconnected';
    tlsEnabled: boolean;
    uptime: string;
  };
  emailRules: AlertRule[];
  emailTemplates: EmailTemplate[];
  emailLogs: EmailLog[];

  // SMS Configuration
  smsProvider: {
    name: string;
    accountSid: string;
    senderId: string;
    status: 'Connected' | 'Degraded' | 'Disconnected';
    balance: string;
    uptime: string;
  };
  smsRules: AlertRule[];
  smsTemplates: SmsTemplate[];
  smsLogs: SmsLog[];

  // Auto-Assign Configuration
  autoAssignEngine: {
    status: 'Active' | 'Paused';
    algorithm: 'Proximity & Geofencing (Optimal ETA)' | 'Availability & Response Speed' | 'Balanced Workload';
    maxRadiusKm: number;
    maxActiveTasksPerVolunteer: number;
    urgencyPriorityWeight: number;
  };
  assignmentRules: AssignmentRule[];
  volunteerPool: VolunteerProfile[];
  assignmentHistory: AssignmentRecord[];

  // Actions
  toggleEmailAlerts: () => void;
  toggleSmsAlerts: () => void;
  toggleAutoAssign: () => void;
  setEngineStatus: (status: 'Active' | 'Paused') => void;
  setEngineAlgorithm: (algo: AlertsState['autoAssignEngine']['algorithm']) => void;
  setMaxRadius: (radius: number) => void;
  setMaxActiveTasks: (tasks: number) => void;

  toggleRuleEnabled: (type: 'email' | 'sms' | 'assign', id: string) => void;
  saveEmailTemplate: (template: EmailTemplate) => void;
  saveSmsTemplate: (template: SmsTemplate) => void;
  
  sendTestEmail: (recipient: string, templateId: string, subject?: string) => Promise<{ success: boolean; message: string }>;
  sendTestSms: (phone: string, templateId: string, text?: string) => Promise<{ success: boolean; message: string }>;
  triggerAutoAssignmentBatch: () => Promise<{ success: boolean; matchedCount: number; message: string }>;
  
  resendEmailLog: (logId: string) => void;
  retrySmsLog: (logId: string) => void;
}

export const useAlertsStore = create<AlertsState>((set, get) => ({
  emailAlertsEnabled: true,
  smsAlertsEnabled: true,
  autoAssignEnabled: true,

  stats: {
    totalAlerts: 1248,
    emailsSent: 1032,
    smsSent: 892,
    pendingAlerts: 86
  },

  emailProvider: {
    name: 'SMTP (Connected)',
    host: 'smtp.foodcovering.org',
    port: 587,
    authEmail: 'notifications@foodcovering.org',
    status: 'Connected',
    tlsEnabled: true,
    uptime: '99.98%'
  },

  emailRules: [
    {
      id: 'er-1',
      name: 'Critical Food Quality Alert (<60%)',
      trigger: 'On Analysis Submission',
      condition: 'Quality Score < 60% OR High Bacteria Risk',
      recipientGroup: 'Quality Safety Officers & City Inspectors',
      enabled: true,
      severity: 'Critical',
      lastTriggered: '12 mins ago'
    },
    {
      id: 'er-2',
      name: 'Volunteer SLA Breach Warning (>30m)',
      trigger: 'Timer Exceeded',
      condition: 'Pickup unassigned after 30 minutes from creation',
      recipientGroup: 'Operations Supervisors',
      enabled: true,
      severity: 'High',
      lastTriggered: '45 mins ago'
    },
    {
      id: 'er-3',
      name: 'New Donation Intake Confirmation',
      trigger: 'Donation Created',
      condition: 'Weight > 5kg AND Expiry > 12h',
      recipientGroup: 'Donor & Local Food Bank',
      enabled: true,
      severity: 'Medium',
      lastTriggered: '1 hour ago'
    },
    {
      id: 'er-4',
      name: 'Urgent Spoilage Risk Notice',
      trigger: 'Temperature Exceeded',
      condition: 'Transit Sensor Temp > 8°C for Cold Storage items',
      recipientGroup: 'Assigned Courier & Inspection Team',
      enabled: true,
      severity: 'Critical',
      lastTriggered: '3 hours ago'
    },
    {
      id: 'er-5',
      name: 'Daily Operations Digest & Analytics',
      trigger: 'Cron Schedule (08:00 AM)',
      condition: 'Daily System Summary Generation',
      recipientGroup: 'System Administrators & NGO Leads',
      enabled: true,
      severity: 'Low',
      lastTriggered: 'Yesterday at 08:00 AM'
    },
    {
      id: 'er-6',
      name: 'Facility Storage Capacity Threshold (85%)',
      trigger: 'Inventory Update',
      condition: 'Warehouse Capacity > 85%',
      recipientGroup: 'Warehouse Logistics Managers',
      enabled: true,
      severity: 'High',
      lastTriggered: '2 days ago'
    },
    {
      id: 'er-7',
      name: 'Donor Handover Verification Receipt',
      trigger: 'Donation Marked Handed Over',
      condition: 'Recipient QR / OTP Validated',
      recipientGroup: 'Verified Donor Contact',
      enabled: true,
      severity: 'Medium',
      lastTriggered: '5 hours ago'
    },
    {
      id: 'er-8',
      name: 'Regulatory Compliance Flag',
      trigger: 'Complaint Category: Health Hazard',
      condition: 'Complaint verified with High Severity rating',
      recipientGroup: 'Municipal Health Directorate',
      enabled: true,
      severity: 'Critical',
      lastTriggered: 'Yesterday'
    }
  ],

  emailTemplates: [
    {
      id: 'et-1',
      name: 'Critical Food Quality Alert',
      subject: '[URGENT] Food Safety Violation Flagged: {{complaint_id}}',
      category: 'Critical',
      body: `Hello {{officer_name}},\n\nA food quality inspection was just logged with an unacceptable score of {{quality_score}}%.\n\n• Location: {{location}}\n• Food Category: {{food_type}}\n• Batch / Seller: {{seller_name}}\n• Critical Indicators: {{risk_factors}}\n\nPlease review the report immediately in the FoodCovering dispatch console.`,
      variables: ['complaint_id', 'officer_name', 'quality_score', 'location', 'food_type', 'seller_name', 'risk_factors'],
      lastModified: '2026-09-27'
    },
    {
      id: 'et-2',
      name: 'Volunteer Route Assignment',
      subject: 'New Food Pickup Assigned: {{pickup_code}} ({{eta_minutes}} mins)',
      category: 'Volunteer',
      body: `Hi {{volunteer_name}},\n\nYou have been assigned a pickup dispatch for {{donor_name}}.\n\n• Pickup Address: {{pickup_address}}\n• Destination: {{destination_shelter}}\n• Package: {{food_type}} (~{{quantity_kg}} kg)\n• Safe Consumption Window: {{expiry_window}} hours.\n\nPlease confirm pickup in the app.`,
      variables: ['volunteer_name', 'pickup_code', 'donor_name', 'pickup_address', 'destination_shelter', 'food_type', 'quantity_kg', 'expiry_window', 'eta_minutes'],
      lastModified: '2026-09-28'
    },
    {
      id: 'et-3',
      name: 'Donation Received & Confirmed',
      subject: 'Thank You! Your Food Donation {{donation_id}} Has Been Picked Up',
      category: 'Donation',
      body: `Dear {{donor_name}},\n\nYour contribution of {{food_type}} has been securely picked up by our certified volunteer {{volunteer_name}}.\n\nEstimated arrival at {{shelter_name}} is {{delivery_time}}. Together, we prevent food waste and feed hungry families!`,
      variables: ['donor_name', 'donation_id', 'food_type', 'volunteer_name', 'shelter_name', 'delivery_time'],
      lastModified: '2026-09-25'
    },
    {
      id: 'et-4',
      name: 'SLA Escalation Alert',
      subject: '[ATTENTION REQUIRED] Unassigned Food Batch Approaching Expiry',
      category: 'Operations',
      body: `Attention Logistics Lead,\n\nDonation Batch #{{batch_id}} in {{zone_name}} has remained unassigned for {{unassigned_duration_mins}} minutes.\n\nEstimated shelf-life remaining is {{remaining_hours}} hrs. Auto-reallocation triggered.`,
      variables: ['batch_id', 'zone_name', 'unassigned_duration_mins', 'remaining_hours'],
      lastModified: '2026-09-24'
    },
    {
      id: 'et-5',
      name: 'Daily Logistics & Safety Digest',
      subject: 'FoodCovering Daily Digest - {{report_date}} Summary',
      category: 'Digest',
      body: `Summary Report for {{report_date}}:\n\n• Total Meals Rescued: {{total_meals}}\n• Verified Compliant Rate: {{compliance_percent}}%\n• Active Couriers on Duty: {{couriers_active}}\n• Critical Flags Handled: {{critical_flags}}\n\nFull analytics are available in the web dashboard.`,
      variables: ['report_date', 'total_meals', 'compliance_percent', 'couriers_active', 'critical_flags'],
      lastModified: '2026-09-26'
    },
    {
      id: 'et-6',
      name: 'Complaint Resolution Notice',
      subject: 'Update Regarding Your Safety Complaint Ref #{{complaint_id}}',
      category: 'Operations',
      body: `Dear {{user_name}},\n\nYour reported complaint regarding {{subject}} has been investigated and resolved by the municipal health inspector team.\n\nResolution Details: {{resolution_notes}}.\n\nThank you for helping keep our food supply safe!`,
      variables: ['user_name', 'complaint_id', 'subject', 'resolution_notes'],
      lastModified: '2026-09-22'
    }
  ],

  emailLogs: [
    {
      id: 'el-101',
      recipient: 'dr.anand@healthdept.gov.in',
      subject: '[URGENT] Food Safety Violation Flagged: CMP-8921',
      status: 'Delivered',
      timestamp: 'Today, 20:54:12',
      ruleName: 'Critical Food Quality Alert (<60%)',
      latencyMs: 142
    },
    {
      id: 'el-102',
      recipient: 'kavitha.v@foodcovering.org',
      subject: 'New Food Pickup Assigned: PK-3902 (15 mins)',
      status: 'Delivered',
      timestamp: 'Today, 20:41:05',
      ruleName: 'Volunteer Route Assignment',
      latencyMs: 110
    },
    {
      id: 'el-103',
      recipient: 'manager@grandhotelchennai.com',
      subject: 'Thank You! Your Food Donation DON-7712 Has Been Picked Up',
      status: 'Delivered',
      timestamp: 'Today, 20:15:33',
      ruleName: 'Donation Intake Confirmation',
      latencyMs: 185
    },
    {
      id: 'el-104',
      recipient: 'dispatch-alert@foodcovering.org',
      subject: '[ATTENTION REQUIRED] Unassigned Food Batch Approaching Expiry',
      status: 'Delivered',
      timestamp: 'Today, 19:48:20',
      ruleName: 'Volunteer SLA Breach Warning (>30m)',
      latencyMs: 98
    },
    {
      id: 'el-105',
      recipient: 'safetyofficer3@citycouncil.gov',
      subject: '[URGENT] Food Safety Violation Flagged: CMP-8919',
      status: 'Delivered',
      timestamp: 'Today, 18:22:11',
      ruleName: 'Critical Food Quality Alert (<60%)',
      latencyMs: 135
    },
    {
      id: 'el-106',
      recipient: 'partner-care@foodnetwork.org',
      subject: 'Delivery confirmation: 250 Meals safely transferred to Shelter B',
      status: 'Delivered',
      timestamp: 'Today, 17:09:44',
      ruleName: 'Donor Handover Verification Receipt',
      latencyMs: 120
    },
    {
      id: 'el-107',
      recipient: 'ravi.kumar.volunteer@gmail.com',
      subject: 'Weekly Service Recognition & Safety Certificate',
      status: 'Pending',
      timestamp: 'Today, 16:55:01',
      ruleName: 'Daily Operations Digest & Analytics',
      latencyMs: 310
    },
    {
      id: 'el-108',
      recipient: 'inbox@invalid-restaurant-mail.xyz',
      subject: 'Verification Required: Health Notice',
      status: 'Bounced',
      timestamp: 'Today, 15:30:22',
      ruleName: 'Regulatory Compliance Flag',
      latencyMs: 450
    }
  ],

  smsProvider: {
    name: 'Twilio (Connected)',
    accountSid: 'AC8f92b771e421099e4b',
    senderId: 'FOODCOVER',
    status: 'Connected',
    balance: '$148.60',
    uptime: '99.99%'
  },

  smsRules: [
    {
      id: 'sr-1',
      name: 'Urgent Volunteer Pickup Request SMS',
      trigger: 'Automated Dispatch Match',
      condition: 'Pickup ETA <= 20 mins AND Status: Unassigned',
      recipientGroup: 'Nearest 3 Active Volunteers',
      enabled: true,
      severity: 'Critical',
      lastTriggered: '8 mins ago'
    },
    {
      id: 'sr-2',
      name: 'Pickup OTP Verification Code',
      trigger: 'Volunteer Arrived at Donor',
      condition: 'Handover Initiated',
      recipientGroup: 'Donor Phone Number',
      enabled: true,
      severity: 'High',
      lastTriggered: '19 mins ago'
    },
    {
      id: 'sr-3',
      name: 'Critical Food Inspection Alert',
      trigger: 'Inspector Severe Hazard Flag',
      condition: 'Immediate recall or contamination detected',
      recipientGroup: 'Regional On-Duty Field Inspector',
      enabled: true,
      severity: 'Critical',
      lastTriggered: '1 hour ago'
    },
    {
      id: 'sr-4',
      name: 'Delivery Destination ETA Warning',
      trigger: 'Courier within 1 km radius',
      condition: 'Distance < 1000m from Destination Shelter',
      recipientGroup: 'Receiving Shelter Coordinator',
      enabled: true,
      severity: 'Medium',
      lastTriggered: '2 hours ago'
    },
    {
      id: 'sr-5',
      name: 'Volunteer Reallocation Notification',
      trigger: 'Volunteer Declines or Timeout',
      condition: 'Response timeout > 3 minutes',
      recipientGroup: 'Next Tier Volunteer',
      enabled: true,
      severity: 'High',
      lastTriggered: '3 hours ago'
    },
    {
      id: 'sr-6',
      name: 'Donation Cancellation or Delay Alert',
      trigger: 'Donor or Volunteer Cancels',
      condition: 'Trip status updated to Cancelled',
      recipientGroup: 'Affected Parties',
      enabled: true,
      severity: 'Medium',
      lastTriggered: 'Yesterday'
    },
    {
      id: 'sr-7',
      name: 'Emergency Food Drive Broadcast',
      trigger: 'Disaster / High Volume Request',
      condition: 'Batch Size > 500 meals',
      recipientGroup: 'Zone Volunteer Fleet (Broadcast)',
      enabled: true,
      severity: 'High',
      lastTriggered: '3 days ago'
    }
  ],

  smsTemplates: [
    {
      id: 'st-1',
      name: 'Urgent Volunteer Dispatch Match',
      category: 'Urgent',
      body: 'FOODCOVER ALERT: New pickup nearby ({{dist_km}}km). {{food_type}} ({{qty}}kg) at {{location}}. Reply YES within 3 mins to claim. Call: +918005550199',
      variables: ['dist_km', 'food_type', 'qty', 'location'],
      charCount: 147,
      segments: 1,
      lastModified: '2026-09-28'
    },
    {
      id: 'st-2',
      name: 'Donor Handover Security PIN',
      category: 'Verification',
      body: 'FOODCOVER: Your pickup code for {{donor_name}} is {{otp_code}}. Share only with verified volunteer {{volunteer_name}}.',
      variables: ['donor_name', 'otp_code', 'volunteer_name'],
      charCount: 114,
      segments: 1,
      lastModified: '2026-09-26'
    },
    {
      id: 'st-3',
      name: 'Delivery Arrived at Shelter',
      category: 'Status',
      body: 'FOODCOVER: Volunteer {{volunteer_name}} has reached {{shelter_name}} with {{meals_count}} meals. Handover complete. Thank you!',
      variables: ['volunteer_name', 'shelter_name', 'meals_count'],
      charCount: 125,
      segments: 1,
      lastModified: '2026-09-24'
    },
    {
      id: 'st-4',
      name: 'Urgent Hazard Inspection Ping',
      category: 'Urgent',
      body: 'SAFETY ALERT: High bacterial spoilage flagged at {{shop_name}}, {{address}}. Priority inspection assigned to you. Case #{{complaint_id}}.',
      variables: ['shop_name', 'address', 'complaint_id'],
      charCount: 139,
      segments: 1,
      lastModified: '2026-09-25'
    },
    {
      id: 'st-5',
      name: 'Volunteer Shift Check-in Reminder',
      category: 'Reminder',
      body: 'Hi {{volunteer_name}}! Your evening volunteer standby shift starts at 6:00 PM. Toggle active status in FoodCovering app when ready.',
      variables: ['volunteer_name'],
      charCount: 133,
      segments: 1,
      lastModified: '2026-09-20'
    }
  ],

  smsLogs: [
    {
      id: 'sl-201',
      phone: '+91 98765 43210',
      recipientName: 'Kavitha V. (Volunteer)',
      messagePreview: 'FOODCOVER ALERT: New pickup nearby (1.8km). Cooked Meals (15kg) at Hotel Saravana...',
      status: 'Delivered',
      timestamp: 'Today, 20:56:40',
      carrier: 'Airtel / Twilio SMS',
      ruleName: 'Urgent Volunteer Pickup Request SMS'
    },
    {
      id: 'sl-202',
      phone: '+91 94440 12893',
      recipientName: 'Ramesh Sundaram (Donor)',
      messagePreview: 'FOODCOVER: Your pickup code for Annapoorna is 8492. Share only with verified...',
      status: 'Delivered',
      timestamp: 'Today, 20:44:12',
      carrier: 'Jio / Twilio SMS',
      ruleName: 'Pickup OTP Verification Code'
    },
    {
      id: 'sl-203',
      phone: '+91 98841 77201',
      recipientName: 'Dr. S. Anand (Inspector)',
      messagePreview: 'SAFETY ALERT: High bacterial spoilage flagged at Green Market Stall 4. Priority...',
      status: 'Delivered',
      timestamp: 'Today, 19:35:10',
      carrier: 'Vodafone / Twilio SMS',
      ruleName: 'Critical Food Inspection Alert'
    },
    {
      id: 'sl-204',
      phone: '+91 91760 33819',
      recipientName: 'Anitha Shelter Coordinator',
      messagePreview: 'FOODCOVER: Volunteer Karthik has reached Hope Home with 60 meals. Handover...',
      status: 'Delivered',
      timestamp: 'Today, 18:20:05',
      carrier: 'Airtel / Twilio SMS',
      ruleName: 'Delivery Destination ETA Warning'
    },
    {
      id: 'sl-205',
      phone: '+91 98402 99182',
      recipientName: 'Praveen G. (Volunteer)',
      messagePreview: 'FOODCOVER ALERT: New pickup nearby (2.4km). Fresh Produce (28kg)...',
      status: 'Sent',
      timestamp: 'Today, 17:15:30',
      carrier: 'BSNL / Twilio SMS',
      ruleName: 'Urgent Volunteer Pickup Request SMS'
    },
    {
      id: 'sl-206',
      phone: '+91 99620 00000',
      recipientName: 'Unknown Contact',
      messagePreview: 'FOODCOVER: Verification code 4910 for donation verification...',
      status: 'Failed',
      timestamp: 'Today, 14:12:18',
      carrier: 'Carrier Unreachable (30008)',
      ruleName: 'Pickup OTP Verification Code'
    }
  ],

  autoAssignEngine: {
    status: 'Active',
    algorithm: 'Proximity & Geofencing (Optimal ETA)',
    maxRadiusKm: 15,
    maxActiveTasksPerVolunteer: 3,
    urgencyPriorityWeight: 85
  },

  assignmentRules: [
    {
      id: 'ar-1',
      name: 'Proximity & Radius Geofence (<= 15km)',
      description: 'Prioritize volunteers within immediate transit distance to minimize response time.',
      priority: 'High',
      enabled: true,
      conditionText: 'Volunteer distance <= 15.0 km from donor location'
    },
    {
      id: 'ar-2',
      name: 'Refrigerated Vehicle Requirement for Perishables',
      description: 'Match dairy, meat, and cooked batches with temperature-controlled vehicles.',
      priority: 'High',
      enabled: true,
      conditionText: 'Category IN ("Dairy", "Meat", "Cooked") REQUIRES Vehicle = "Van (Refrigerated)"'
    },
    {
      id: 'ar-3',
      name: 'Food Safety Certification Level 2 Priority',
      description: 'Assign verified food hygiene trained volunteers for bulk charity distributions.',
      priority: 'Medium',
      enabled: true,
      conditionText: 'Meals > 50 REQUIRES FoodSafetyCertified == TRUE'
    },
    {
      id: 'ar-4',
      name: 'Workload Balancing & Max Concurrency Cap',
      description: 'Never assign more than 3 active pickups simultaneously to avoid delays.',
      priority: 'High',
      enabled: true,
      conditionText: 'Volunteer ActiveTasks < MaxActiveTasksPerVolunteer'
    },
    {
      id: 'ar-5',
      name: 'High Volunteer Rating Preference (>= 4.7)',
      description: 'Tier-1 expedited donors are matched first with highest-rated volunteers.',
      priority: 'Medium',
      enabled: true,
      conditionText: 'Match Score boosted by +20% for Volunteer Rating >= 4.7'
    },
    {
      id: 'ar-6',
      name: 'Auto-Escalation & Radius Expansion (After 10m)',
      description: 'Automatically expand search radius from 15km to 25km if unaccepted in 10 minutes.',
      priority: 'High',
      enabled: true,
      conditionText: 'Elapsed > 10m => Search Radius += 10km'
    },
    {
      id: 'ar-7',
      name: 'Night-Shift Transit Safeguard',
      description: 'Pair two volunteers or assign motorized vehicles for requests after 9:00 PM.',
      priority: 'Medium',
      enabled: true,
      conditionText: 'Time BETWEEN 21:00 AND 06:00 REQUIRES Motorized Vehicle'
    },
    {
      id: 'ar-8',
      name: 'Low Battery / Offline Exclusion Filter',
      description: 'Exclude volunteers whose GPS ping is stale (>5m) or battery < 15%.',
      priority: 'High',
      enabled: true,
      conditionText: 'LastGpsPing <= 5 mins ago AND Status == "Available"'
    },
    {
      id: 'ar-9',
      name: 'Zero-Waste Rapid Dispatch for Under 3-Hour Shelf Life',
      description: 'Immediate sound buzzer & top priority push when food expires in < 3 hours.',
      priority: 'High',
      enabled: true,
      conditionText: 'RemainingShelfLife < 3h => Bypass Queue & Auto-Dispatch Top 1 Match'
    },
    {
      id: 'ar-10',
      name: 'Volunteer Route Coincidence Multi-Drop Optimization',
      description: 'Combine multiple small donors along the identical path to same recipient.',
      priority: 'Low',
      enabled: true,
      conditionText: 'Route Deviation < 1.5km on active transit vector'
    }
  ],

  volunteerPool: [
    {
      id: 'vol-01',
      name: 'Kavitha Vijayakumar',
      phone: '+91 98765 43210',
      status: 'Available',
      currentZone: 'T. Nagar / Kodambakkam',
      vehicleType: 'Motorcycle',
      rating: 4.9,
      completedTasks: 184,
      activeTasks: 0,
      distanceKm: 2.1,
      foodSafetyCertified: true
    },
    {
      id: 'vol-02',
      name: 'Karthik Subramanian',
      phone: '+91 98401 22891',
      status: 'On Delivery',
      currentZone: 'Adyar / Guindy',
      vehicleType: 'Van (Refrigerated)',
      rating: 4.95,
      completedTasks: 312,
      activeTasks: 1,
      distanceKm: 4.5,
      foodSafetyCertified: true
    },
    {
      id: 'vol-03',
      name: 'Sneha Ramakrishnan',
      phone: '+91 97910 88412',
      status: 'Available',
      currentZone: 'Anna Nagar / Kilpauk',
      vehicleType: 'Car',
      rating: 4.8,
      completedTasks: 96,
      activeTasks: 0,
      distanceKm: 3.4,
      foodSafetyCertified: true
    },
    {
      id: 'vol-04',
      name: 'Mohammed Rizwan',
      phone: '+91 91765 33021',
      status: 'Available',
      currentZone: 'Mylapore / Royapettah',
      vehicleType: 'Motorcycle',
      rating: 4.85,
      completedTasks: 142,
      activeTasks: 0,
      distanceKm: 1.8,
      foodSafetyCertified: false
    },
    {
      id: 'vol-05',
      name: 'Deepak Narayanan',
      phone: '+91 94443 78190',
      status: 'On Delivery',
      currentZone: 'Velachery / OMR',
      vehicleType: 'Van (Refrigerated)',
      rating: 4.75,
      completedTasks: 210,
      activeTasks: 2,
      distanceKm: 6.2,
      foodSafetyCertified: true
    },
    {
      id: 'vol-06',
      name: 'Pooja Chandrasekar',
      phone: '+91 98845 11980',
      status: 'Offline',
      currentZone: 'Tambaram / Chromepet',
      vehicleType: 'Car',
      rating: 4.9,
      completedTasks: 78,
      activeTasks: 0,
      distanceKm: 14.0,
      foodSafetyCertified: true
    }
  ],

  assignmentHistory: [
    {
      id: 'asg-801',
      requestTitle: 'Surplus Banquet Buffet Meals (80 Servings)',
      donorOrSeller: 'ITC Grand Chola Catering',
      location: 'Guindy, Chennai',
      assignedVolunteer: 'Karthik Subramanian',
      volunteerPhone: '+91 98401 22891',
      status: 'En Route',
      etaMinutes: 12,
      distanceKm: 3.8,
      assignedAt: 'Today, 20:30',
      urgency: 'Immediate'
    },
    {
      id: 'asg-802',
      requestTitle: 'Fresh Bakery Pastries & Breads (25kg)',
      donorOrSeller: 'The French Loaf, Anna Nagar',
      location: 'Anna Nagar West',
      assignedVolunteer: 'Sneha Ramakrishnan',
      volunteerPhone: '+91 97910 88412',
      status: 'Completed',
      etaMinutes: 0,
      distanceKm: 4.2,
      assignedAt: 'Today, 19:15',
      urgency: 'Standard'
    },
    {
      id: 'asg-803',
      requestTitle: 'Prepared Meals from Corporate Cafeteria (120pk)',
      donorOrSeller: 'TCS Siruseri Campus',
      location: 'OMR, Navalur',
      assignedVolunteer: 'Deepak Narayanan',
      volunteerPhone: '+91 94443 78190',
      status: 'Picked Up',
      etaMinutes: 18,
      distanceKm: 7.5,
      assignedAt: 'Today, 18:40',
      urgency: 'Immediate'
    },
    {
      id: 'asg-804',
      requestTitle: 'Vegetable Crate Donations (45kg)',
      donorOrSeller: 'Koyambedu Wholesale Mandi',
      location: 'Koyambedu',
      assignedVolunteer: 'Kavitha Vijayakumar',
      volunteerPhone: '+91 98765 43210',
      status: 'Completed',
      etaMinutes: 0,
      distanceKm: 2.4,
      assignedAt: 'Today, 17:10',
      urgency: 'Standard'
    },
    {
      id: 'asg-805',
      requestTitle: 'Fresh Milk & Paneer Dairy Batch (15L)',
      donorOrSeller: 'Aavin Dairy Outpost',
      location: 'T. Nagar',
      assignedVolunteer: 'Mohammed Rizwan',
      volunteerPhone: '+91 91765 33021',
      status: 'Completed',
      etaMinutes: 0,
      distanceKm: 1.9,
      assignedAt: 'Today, 15:50',
      urgency: 'Immediate'
    }
  ],

  toggleEmailAlerts: () => set((state) => ({ emailAlertsEnabled: !state.emailAlertsEnabled })),
  toggleSmsAlerts: () => set((state) => ({ smsAlertsEnabled: !state.smsAlertsEnabled })),
  toggleAutoAssign: () => set((state) => ({ 
    autoAssignEnabled: !state.autoAssignEnabled,
    autoAssignEngine: {
      ...state.autoAssignEngine,
      status: !state.autoAssignEnabled ? 'Active' : 'Paused'
    }
  })),

  setEngineStatus: (status) => set((state) => ({
    autoAssignEngine: { ...state.autoAssignEngine, status }
  })),

  setEngineAlgorithm: (algorithm) => set((state) => ({
    autoAssignEngine: { ...state.autoAssignEngine, algorithm }
  })),

  setMaxRadius: (maxRadiusKm) => set((state) => ({
    autoAssignEngine: { ...state.autoAssignEngine, maxRadiusKm }
  })),

  setMaxActiveTasks: (maxActiveTasksPerVolunteer) => set((state) => ({
    autoAssignEngine: { ...state.autoAssignEngine, maxActiveTasksPerVolunteer }
  })),

  toggleRuleEnabled: (type, id) => set((state) => {
    if (type === 'email') {
      return {
        emailRules: state.emailRules.map((r) => r.id === id ? { ...r, enabled: !r.enabled } : r)
      };
    } else if (type === 'sms') {
      return {
        smsRules: state.smsRules.map((r) => r.id === id ? { ...r, enabled: !r.enabled } : r)
      };
    } else {
      return {
        assignmentRules: state.assignmentRules.map((r) => r.id === id ? { ...r, enabled: !r.enabled } : r)
      };
    }
  }),

  saveEmailTemplate: (template) => set((state) => {
    const exists = state.emailTemplates.some((t) => t.id === template.id);
    return {
      emailTemplates: exists
        ? state.emailTemplates.map((t) => t.id === template.id ? template : t)
        : [template, ...state.emailTemplates]
    };
  }),

  saveSmsTemplate: (template) => set((state) => {
    const exists = state.smsTemplates.some((t) => t.id === template.id);
    return {
      smsTemplates: exists
        ? state.smsTemplates.map((t) => t.id === template.id ? template : t)
        : [template, ...state.smsTemplates]
    };
  }),

  sendTestEmail: async (recipient, templateId, subject) => {
    const state = get();
    const template = state.emailTemplates.find((t) => t.id === templateId) || state.emailTemplates[0];
    
    // Simulate latency
    await new Promise((resolve) => setTimeout(resolve, 800));

    const newLog: EmailLog = {
      id: `el-${Date.now()}`,
      recipient,
      subject: subject || template.subject.replace('{{complaint_id}}', 'TEST-101').replace('{{pickup_code}}', 'TEST-PK'),
      status: 'Delivered',
      timestamp: 'Just now',
      ruleName: `Test Dispatch (${template.name})`,
      latencyMs: 124
    };

    set((s) => ({
      stats: {
        ...s.stats,
        totalAlerts: s.stats.totalAlerts + 1,
        emailsSent: s.stats.emailsSent + 1
      },
      emailLogs: [newLog, ...s.emailLogs]
    }));

    return { success: true, message: `Test email successfully sent to ${recipient}` };
  },

  sendTestSms: async (phone, templateId, text) => {
    const state = get();
    const template = state.smsTemplates.find((t) => t.id === templateId) || state.smsTemplates[0];

    await new Promise((resolve) => setTimeout(resolve, 800));

    const newLog: SmsLog = {
      id: `sl-${Date.now()}`,
      phone,
      recipientName: 'Test Recipient',
      messagePreview: text || template.body.replace('{{dist_km}}', '1.2').replace('{{otp_code}}', '9921'),
      status: 'Delivered',
      timestamp: 'Just now',
      carrier: 'Twilio SMS Gateway (Verified)',
      ruleName: `Test SMS (${template.name})`
    };

    set((s) => ({
      stats: {
        ...s.stats,
        totalAlerts: s.stats.totalAlerts + 1,
        smsSent: s.stats.smsSent + 1
      },
      smsLogs: [newLog, ...s.smsLogs]
    }));

    return { success: true, message: `Test SMS dispatched to ${phone}` };
  },

  triggerAutoAssignmentBatch: async () => {
    await new Promise((resolve) => setTimeout(resolve, 1100));

    const state = get();
    const available = state.volunteerPool.filter((v) => v.status === 'Available');
    const matchedVolunteer = available.length > 0 ? available[0] : state.volunteerPool[0];

    const newAssignment: AssignmentRecord = {
      id: `asg-${Math.floor(1000 + Math.random() * 9000)}`,
      requestTitle: 'Urgent Evening Surplus Cooked Meals (45 Packets)',
      donorOrSeller: 'Sangeetha Vegetarian Restaurant',
      location: 'Mylapore, Chennai',
      assignedVolunteer: matchedVolunteer.name,
      volunteerPhone: matchedVolunteer.phone,
      status: 'Accepted',
      etaMinutes: 9,
      distanceKm: 1.7,
      assignedAt: 'Just now',
      urgency: 'Immediate'
    };

    set((s) => ({
      stats: {
        ...s.stats,
        totalAlerts: s.stats.totalAlerts + 1,
        pendingAlerts: Math.max(0, s.stats.pendingAlerts - 1)
      },
      assignmentHistory: [newAssignment, ...s.assignmentHistory],
      volunteerPool: s.volunteerPool.map((v) => 
        v.id === matchedVolunteer.id ? { ...v, status: 'On Delivery', activeTasks: v.activeTasks + 1 } : v
      )
    }));

    return {
      success: true,
      matchedCount: 1,
      message: `Assigned request to ${matchedVolunteer.name} (${newAssignment.etaMinutes} mins ETA, ${newAssignment.distanceKm} km away)`
    };
  },

  resendEmailLog: (logId) => {
    set((state) => ({
      emailLogs: state.emailLogs.map((log) => 
        log.id === logId ? { ...log, status: 'Delivered', timestamp: 'Just now' } : log
      ),
      stats: {
        ...state.stats,
        emailsSent: state.stats.emailsSent + 1
      }
    }));
  },

  retrySmsLog: (logId) => {
    set((state) => ({
      smsLogs: state.smsLogs.map((log) => 
        log.id === logId ? { ...log, status: 'Delivered', timestamp: 'Just now' } : log
      ),
      stats: {
        ...state.stats,
        smsSent: state.stats.smsSent + 1
      }
    }));
  }
}));
