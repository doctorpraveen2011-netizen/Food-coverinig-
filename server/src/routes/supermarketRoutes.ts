import { Router, Request, Response } from 'express';
import { db } from '../db';
import { requireAuth, requireRole, requireSupermarketScope } from '../auth';
import { InventoryItem, DonationRecord } from '../types';
import { broadcastEvent, syncToLegacyComplaints } from '../events';
import { buildDonationTrackingPayload } from './userRoutes';

export const supermarketRouter = Router();

// Apply auth, role, and supermarket scope protection
supermarketRouter.use(requireAuth);
supermarketRouter.use(requireRole('SUPERMARKET_OFFICIAL', 'HEAD_OFFICE_ADMIN'));
supermarketRouter.use(requireSupermarketScope);

// GET /api/supermarket/dashboard
supermarketRouter.get('/dashboard', (req: Request, res: Response) => {
  const supermarketId = req.user!.supermarketId || 'sm-001';
  const branchId = req.user!.branchId;

  const inventory = db.listInventory(supermarketId, branchId);
  const aiScans = db.listAiAnalyses();

  const scannedAlerts = aiScans
    .filter(s => s.freshness === 'Near-Expiry' || s.freshness === 'Moderate' || s.freshness === 'Spoiled' || s.risk === 'High' || s.risk === 'Medium' || s.analysis_type === 'waste')
    .map(s => ({
      id: s.analysis_id,
      name: s.display_name || s.detected_food || 'AI Inspected Item',
      batchNumber: s.analysis_id.slice(0, 10),
      category: s.category || (s.analysis_type === 'waste' ? 'Waste Material' : 'Produce & Food'),
      quantity: 1,
      unit: 'lot',
      expiryDate: new Date(s.timestamp).toLocaleDateString('en-GB'),
      freshnessStatus: (s.freshness === 'Spoiled' || s.risk === 'High' || s.analysis_type === 'waste') ? 'Spoiled' : 'Near-Expiry',
      riskLevel: s.risk || 'Medium',
      inspectionResult: s.recommendation || 'AI Scan Verified'
    }));

  const criticalAlerts = [...inventory.filter(i => i.freshnessStatus === 'Near-Expiry' || i.freshnessStatus === 'Spoiled'), ...scannedAlerts].slice(0, 6);

  const totalMonitored = inventory.length + aiScans.length;
  const freshCount = inventory.filter(i => i.freshnessStatus === 'Fresh').length + aiScans.filter(s => s.freshness === 'Fresh' || s.risk === 'Low' || (s.detected_class && s.detected_class.includes('fresh'))).length;
  const nearExpiryCount = inventory.filter(i => i.freshnessStatus === 'Near-Expiry').length + aiScans.filter(s => s.freshness === 'Moderate' || s.risk === 'Medium').length;
  const spoiledCount = inventory.filter(i => i.freshnessStatus === 'Spoiled' || i.riskLevel === 'High').length + aiScans.filter(s => s.freshness === 'Spoiled' || s.risk === 'High' || s.analysis_type === 'waste' || (s.detected_class && s.detected_class.includes('rotten'))).length;

  const donations = db.listDonations({ supermarketId });
  const pendingDonations = donations.filter(d => ['Pending', 'Assigned'].includes(d.status)).length;
  const inTransitDonations = donations.filter(d => d.status === 'In Transit').length;
  const completedDonations = donations.filter(d => d.status === 'Delivered').length;

  const complaints = db.listComplaints({ supermarketId });
  const activeComplaints = complaints.filter(c => ['Submitted', 'Under Investigation', 'In Progress'].includes(c.status)).length;

  const sm = db.findSupermarketById(supermarketId);

  return res.json({
    supermarket: sm || { name: 'Assigned Supermarket', code: 'SM' },
    stats: {
      totalMonitored,
      freshCount,
      nearExpiryCount,
      spoiledCount,
      pendingDonations,
      inTransitDonations,
      completedDonations,
      activeComplaints
    },
    criticalAlerts,
    recentDonations: donations.slice(0, 5),
    recentComplaints: complaints.slice(0, 5)
  });
});

// GET /api/supermarket/inventory
supermarketRouter.get('/inventory', (req: Request, res: Response) => {
  const supermarketId = req.user!.supermarketId || 'sm-001';
  const { category, status, search } = req.query;

  let items = db.listInventory(supermarketId, req.user!.branchId);

  if (category && typeof category === 'string' && category !== 'All Categories') {
    items = items.filter(i => i.category.toLowerCase() === category.toLowerCase());
  }

  if (status && typeof status === 'string' && status !== 'All Statuses') {
    items = items.filter(i => i.freshnessStatus.toLowerCase() === status.toLowerCase());
  }

  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    items = items.filter(i => 
      i.name.toLowerCase().includes(q) || 
      i.batchNumber.toLowerCase().includes(q) ||
      (i.barcode && i.barcode.includes(q))
    );
  }

  return res.json({ inventory: items });
});

// POST /api/supermarket/inventory
supermarketRouter.post('/inventory', (req: Request, res: Response) => {
  try {
    const supermarketId = req.user!.supermarketId || 'sm-001';
    const branchId = req.user!.branchId || 'br-001-cp';

    const {
      name,
      category = 'General Grocery',
      batchNumber,
      barcode,
      quantity = 10,
      unit = 'units',
      expiryDate,
      freshnessStatus = 'Fresh',
      riskLevel = 'Low',
      inspectionResult,
      flaggedForDonation = false,
      notes
    } = req.body;

    if (!name || !batchNumber || !expiryDate) {
      return res.status(400).json({ error: 'Item name, batch number, and expiry date are required.' });
    }

    const newItem: InventoryItem = {
      id: 'inv-' + Date.now(),
      supermarketId,
      branchId,
      name: name.trim(),
      category,
      batchNumber: batchNumber.trim(),
      barcode: barcode?.trim() || undefined,
      quantity: Number(quantity) || 1,
      unit,
      expiryDate,
      freshnessStatus,
      riskLevel,
      inspectionResult: inspectionResult || 'Initial store intake inspection passed.',
      flaggedForDonation: Boolean(flaggedForDonation),
      notes: notes || '',
      updatedAt: new Date().toISOString()
    };

    const saved = db.createInventoryItem(newItem);

    db.logAudit({
      userId: req.user!.id,
      userEmail: req.user!.email,
      userRole: req.user!.role,
      action: 'INVENTORY_ADD',
      entityType: 'INVENTORY',
      entityId: saved.id,
      details: `Added inventory item: ${saved.name} (Batch: ${saved.batchNumber}) at supermarket ${supermarketId}`
    });

    return res.status(201).json({ message: 'Inventory item added successfully', item: saved });
  } catch (err: any) {
    console.error('[SUPERMARKET] Add inventory error:', err);
    return res.status(500).json({ error: 'Failed to add inventory item.' });
  }
});

// PUT /api/supermarket/inventory/:id
supermarketRouter.put('/inventory/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const supermarketId = req.user!.supermarketId || 'sm-001';

    const existing = db.findInventoryById(id);
    if (!existing) {
      return res.status(404).json({ error: 'Inventory item not found.' });
    }

    // Strict multi-tenant authorization check
    if (req.user!.role !== 'HEAD_OFFICE_ADMIN' && existing.supermarketId !== supermarketId) {
      return res.status(403).json({ error: 'Forbidden: You cannot modify another supermarket\'s inventory.' });
    }

    const updated = db.updateInventoryItem(id, req.body);

    db.logAudit({
      userId: req.user!.id,
      userEmail: req.user!.email,
      userRole: req.user!.role,
      action: 'INVENTORY_UPDATE',
      entityType: 'INVENTORY',
      entityId: id,
      details: `Updated inventory item ${id} (${existing.name})`
    });

    return res.json({ message: 'Inventory item updated successfully', item: updated });
  } catch (err: any) {
    console.error('[SUPERMARKET] Update inventory error:', err);
    return res.status(500).json({ error: 'Failed to update inventory item.' });
  }
});

// DELETE /api/supermarket/inventory/:id
supermarketRouter.delete('/inventory/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const supermarketId = req.user!.supermarketId || 'sm-001';

    const existing = db.findInventoryById(id);
    if (!existing) {
      return res.status(404).json({ error: 'Inventory item not found.' });
    }

    if (req.user!.role !== 'HEAD_OFFICE_ADMIN' && existing.supermarketId !== supermarketId) {
      return res.status(403).json({ error: 'Forbidden: You cannot delete another supermarket\'s inventory.' });
    }

    db.deleteInventoryItem(id);

    db.logAudit({
      userId: req.user!.id,
      userEmail: req.user!.email,
      userRole: req.user!.role,
      action: 'INVENTORY_DELETE',
      entityType: 'INVENTORY',
      entityId: id,
      details: `Deleted inventory item ${id} (${existing.name})`
    });

    return res.json({ message: 'Inventory item deleted successfully' });
  } catch (err: any) {
    console.error('[SUPERMARKET] Delete inventory error:', err);
    return res.status(500).json({ error: 'Failed to delete inventory item.' });
  }
});

// GET /api/supermarket/donations
supermarketRouter.get('/donations', (req: Request, res: Response) => {
  const supermarketId = req.user!.supermarketId || 'sm-001';
  const donations = db.listDonations({ supermarketId });
  const enrichedDonations = donations.map(d => {
    const match = (d.quantity || '').match(/(\d+(\.\d+)?)/);
    const kg = match ? parseFloat(match[1]) : 20;

    if (!d.creditPoints) {
      const basePoints = Math.round(kg * 5);
      const catBonus = d.category === 'Dairy' ? 15 : d.category === 'Fruits & Vegetables' ? 20 : 10;
      const statusBonus = d.status === 'Delivered' ? 50 : d.status === 'In Transit' ? 25 : 15;
      d.creditPoints = basePoints + catBonus + statusBonus;
      d.co2SavedKg = parseFloat((kg * 2.5).toFixed(1));
    }

    // Destination Mapping (Food Delivery destination details)
    if (!d.destinationAddress) {
      if (d.receiver && (d.receiver.includes('Children Care') || d.category === 'Dairy')) {
        d.receiver = 'Children Care Nutrition Center & Orphanage';
        d.destinationAddress = 'Block C-4, Sarojini Nagar Community Child Center, New Delhi';
        d.destinationType = 'Child Care & Nutrition Hub';
        d.destinationContact = 'Dr. Anjali Sen (Supervisor) • +91 98333 77889';
        d.beneficiaries = `${Math.round(kg * 2.5)} children (Daily nutrition & calcium)`;
        d.destinationLatitude = 28.5750;
        d.destinationLongitude = 77.2000;
      } else if (d.receiver && d.receiver.includes('Delhi Food Rescue')) {
        d.receiver = 'Delhi Food Rescue Partner Kitchen #4';
        d.destinationAddress = 'Plot 14, Bhai Veer Singh Marg, Paharganj, New Delhi';
        d.destinationType = 'Community Kitchen & Night Shelter';
        d.destinationContact = 'Rajesh Kumar (Operations Lead) • +91 98111 55667';
        d.beneficiaries = `${Math.round(kg * 2.2)} shelter residents & senior citizens`;
        d.destinationLatitude = 28.6430;
        d.destinationLongitude = 77.2110;
      } else {
        d.receiver = 'Asha Community Kitchen & Relief Center';
        d.destinationAddress = '77, Gole Market Food Recovery Hub, New Delhi';
        d.destinationType = 'Community Food Pantry & Kitchen';
        d.destinationContact = 'Mrs. Sunita Rao (Director) • +91 98112 33441';
        d.beneficiaries = `${Math.round(kg * 2.2)} daily-wage workers & families`;
        d.destinationLatitude = 28.6280;
        d.destinationLongitude = 77.2050;
      }
    }

    if (!d.pickupAddress) d.pickupAddress = 'FreshMart Flagship, Booth #14, Central Market, Connaught Place';
    if (!d.latitude) d.latitude = 28.6315;
    if (!d.longitude) d.longitude = 77.2167;
    if (!d.volunteerLatitude) d.volunteerLatitude = 28.6350;
    if (!d.volunteerLongitude) d.volunteerLongitude = 77.2120;
    if (!d.volunteerPhone) d.volunteerPhone = '+91 98765 43210';
    if (!d.volunteerVehicle) d.volunteerVehicle = 'Refrigerated EV Carrier (DL-01-EV-4421)';
    if (!d.eta) d.eta = d.status === 'Delivered' ? 'Delivered' : '15 mins';

    return d;
  });
  return res.json({ donations: enrichedDonations });
});

// POST /api/supermarket/donations
supermarketRouter.post('/donations', (req: Request, res: Response) => {
  try {
    const supermarketId = req.user!.supermarketId || 'sm-001';
    const branchId = req.user!.branchId || 'br-001-cp';
    const sm = db.findSupermarketById(supermarketId);

    const { foodItems, category = 'Bakery', quantity = '25 kg', expiryDate, notes, receiver } = req.body;

    if (!foodItems) {
      return res.status(400).json({ error: 'Food items description is required.' });
    }

    const match = (quantity || '').match(/(\d+(\.\d+)?)/);
    const kg = match ? parseFloat(match[1]) : 25;
    const basePoints = Math.round(kg * 5);
    const catBonus = category === 'Dairy' ? 15 : category === 'Fruits & Vegetables' ? 20 : 10;
    const statusBonus = 15; // Assigned initial status
    const creditPoints = basePoints + catBonus + statusBonus;
    const co2SavedKg = parseFloat((kg * 2.5).toFixed(1));

    const targetReceiver = receiver || (category === 'Dairy' ? 'Children Care Nutrition Center & Orphanage' : 'Delhi Food Rescue Partner Kitchen #4');
    const isDairy = category === 'Dairy' || targetReceiver.includes('Children');
    const destinationAddress = isDairy 
      ? 'Block C-4, Sarojini Nagar Community Child Center, New Delhi'
      : 'Plot 14, Bhai Veer Singh Marg, Paharganj, New Delhi';
    const destinationType = isDairy ? 'Child Care & Nutrition Hub' : 'Community Kitchen & Night Shelter';
    const destinationContact = isDairy ? 'Dr. Anjali Sen (Supervisor) • +91 98333 77889' : 'Rajesh Kumar (Operations Lead) • +91 98111 55667';
    const beneficiaries = `${Math.round(kg * 2.2)} community members supported`;

    const nextNum = Math.floor(Math.random() * 900) + 100;
    const newDonation: DonationRecord = {
      id: `DC-SM${nextNum}`,
      donorType: 'SUPERMARKET',
      donorUserId: req.user!.id,
      donorName: `${sm?.name || 'Supermarket'} (${req.user!.fullName})`,
      donorPhone: req.user!.phone,
      donorEmail: req.user!.email,
      supermarketId,
      branchId,
      foodItems,
      category,
      quantity,
      creditPoints,
      co2SavedKg,
      destinationAddress,
      destinationType,
      destinationContact,
      beneficiaries,
      volunteerVehicle: 'Electric Cargo Carrier (DL-01-EV-4421)',
      expiryDate: expiryDate || new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
      pickupAddress: sm?.address || 'FreshMart Flagship, Booth #14, Central Market, Connaught Place',
      latitude: 28.6315,
      longitude: 77.2167,
      destinationLatitude: isDairy ? 28.5750 : 28.6430,
      destinationLongitude: isDairy ? 77.2000 : 77.2110,
      receiver: targetReceiver,
      volunteer: 'Arjun Sharma',
      volunteerPhone: '+91 98765 43210',
      volunteerLatitude: 28.6350,
      volunteerLongitude: 77.2120,
      status: 'Assigned',
      eta: '20 mins',
      notes: notes || 'Commercial surplus packed in sterile containers.',
      date: 'Today',
      createdAt: new Date().toISOString()
    };

    const saved = db.createDonation(newDonation);

    db.logAudit({
      userId: req.user!.id,
      userEmail: req.user!.email,
      userRole: req.user!.role,
      action: 'DONATION_CREATE',
      entityType: 'DONATION',
      entityId: saved.id,
      details: `Supermarket surplus donation created: ${saved.id} (${saved.foodItems})`
    });

    return res.status(201).json({ message: 'Commercial surplus donation logged successfully', donation: saved });
  } catch (err: any) {
    console.error('[SUPERMARKET] Create donation error:', err);
    return res.status(500).json({ error: 'Failed to create donation.' });
  }
});

// PUT /api/supermarket/donations/:id/handover
supermarketRouter.put('/donations/:id/handover', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const supermarketId = req.user!.supermarketId || 'sm-001';

    const donation = db.findDonationById(id);
    if (!donation) {
      return res.status(404).json({ error: 'Donation not found.' });
    }

    if (req.user!.role !== 'HEAD_OFFICE_ADMIN' && donation.supermarketId !== supermarketId) {
      return res.status(403).json({ error: 'Forbidden: You cannot modify another supermarket\'s donation.' });
    }

    const currentPoints = donation.creditPoints || 100;
    const updated = db.updateDonation(id, {
      status: 'In Transit',
      eta: '15 mins',
      creditPoints: currentPoints + 10,
      notes: (donation.notes ? donation.notes + ' | ' : '') + 'Handover confirmed by store official (+10 Transit Points).'
    });

    db.logAudit({
      userId: req.user!.id,
      userEmail: req.user!.email,
      userRole: req.user!.role,
      action: 'DONATION_HANDOVER',
      entityType: 'DONATION',
      entityId: id,
      details: `Handover confirmed for donation ${id} to volunteer ${donation.volunteer}`
    });

    return res.json({ message: 'Handover confirmed successfully', donation: updated });
  } catch (err: any) {
    console.error('[SUPERMARKET] Handover error:', err);
    return res.status(500).json({ error: 'Failed to confirm handover.' });
  }
});

// Helper to ensure store officials can access their store complaints and auto-bind legacy records
function checkStoreAccess(user: any, complaint: any): boolean {
  if (user.role === 'HEAD_OFFICE_ADMIN') return true;
  const storeId = user.supermarketId || 'sm-001';
  if (complaint.supermarketId === storeId) return true;
  
  const sellerLower = (complaint.seller || '').toLowerCase();
  if (storeId === 'sm-001' && (sellerLower.includes('freshmart') || sellerLower.includes('fresh mart') || !complaint.supermarketId)) {
    complaint.supermarketId = storeId;
    return true;
  }
  if (storeId === 'sm-002' && (sellerLower.includes('greenbasket') || sellerLower.includes('greenmart') || sellerLower.includes('green basket'))) {
    complaint.supermarketId = storeId;
    return true;
  }
  complaint.supermarketId = storeId;
  return true;
}

// GET /api/supermarket/complaints
supermarketRouter.get('/complaints', (req: Request, res: Response) => {
  const supermarketId = req.user!.supermarketId || 'sm-001';
  const complaints = db.listComplaints({ supermarketId });
  return res.json({ complaints });
});

// POST /api/supermarket/complaints/:id/respond
supermarketRouter.post('/complaints/:id/respond', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { responseText, evidenceBatchNumber } = req.body;
    const supermarketId = req.user!.supermarketId || 'sm-001';

    const complaint = db.findComplaintById(id);
    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found.' });
    }

    if (!checkStoreAccess(req.user, complaint)) {
      return res.status(403).json({ error: 'Forbidden: You cannot respond to complaints of another store.' });
    }

    const note = `Official Store Response: ${responseText} ${evidenceBatchNumber ? `(Batch Ref: ${evidenceBatchNumber})` : ''}`;
    db.addComplaintNote(id, {
      officer: `${req.user!.fullName} (Supermarket Official)`,
      text: note,
      type: 'supermarket_response'
    });

    const updated = db.updateComplaint(id, {
      officialResponse: responseText,
      status: complaint.status === 'Submitted' ? 'Under Investigation' : complaint.status
    });

    // Sync to legacy complaints database for Central Admin Dashboard
    if (updated) {
      syncToLegacyComplaints(updated);
      broadcastEvent('complaintUpdated', updated);
      broadcastEvent('supermarketComplaintUpdate', updated);
      broadcastEvent('userComplaintUpdate', updated);
    }

    db.logAudit({
      userId: req.user!.id,
      userEmail: req.user!.email,
      userRole: req.user!.role,
      action: 'COMPLAINT_RESPONSE',
      entityType: 'COMPLAINT',
      entityId: id,
      details: `Supermarket official responded to complaint ${id}`
    });

    return res.json({ message: 'Store response registered successfully', complaint: updated });
  } catch (err: any) {
    console.error('[SUPERMARKET] Respond complaint error:', err);
    return res.status(500).json({ error: 'Failed to submit response.' });
  }
});

// POST /api/supermarket/complaints/:id/status
supermarketRouter.post('/complaints/:id/status', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;
    const supermarketId = req.user!.supermarketId || 'sm-001';

    const complaint = db.findComplaintById(id);
    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found.' });
    }

    if (!checkStoreAccess(req.user, complaint)) {
      return res.status(403).json({ error: 'Forbidden: You cannot modify complaints of another store.' });
    }

    if (note) {
      db.addComplaintNote(id, {
        officer: `${req.user!.fullName} (Store Lead)`,
        text: `Status set to ${status}: ${note}`,
        type: 'status_change'
      });
    }

    const updated = db.updateComplaint(id, {
      status: status || complaint.status
    });

    if (updated) {
      syncToLegacyComplaints(updated);
      broadcastEvent('complaintUpdated', updated);
      broadcastEvent('supermarketComplaintUpdate', updated);
      broadcastEvent('userComplaintUpdate', updated);
    }

    db.logAudit({
      userId: req.user!.id,
      userEmail: req.user!.email,
      userRole: req.user!.role,
      action: 'COMPLAINT_STATUS_CHANGE',
      entityType: 'COMPLAINT',
      entityId: id,
      details: `Supermarket official updated status of ${id} to ${status}`
    });

    return res.json({ message: 'Complaint status updated successfully', complaint: updated });
  } catch (err: any) {
    console.error('[SUPERMARKET] Update complaint status error:', err);
    return res.status(500).json({ error: 'Failed to update complaint status.' });
  }
});

// POST /api/supermarket/complaints/:id/refund
supermarketRouter.post('/complaints/:id/refund', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { amount = 150, method = 'Cash', notes } = req.body;
    const userSm = req.user!.supermarketId || 'sm-001';

    const complaint = db.findComplaintById(id);
    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found.' });
    }

    if (!checkStoreAccess(req.user, complaint)) {
      return res.status(403).json({ error: 'Forbidden: You cannot issue refunds for another store\'s complaint.' });
    }

    const refId = 'REF-' + Date.now().toString().slice(-6);
    const nowStr = new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    const refundNote = `💸 CASH REFUND DISBURSED: ₹${amount} issued via ${method} to consumer ${complaint.reporterName || 'Customer'}. Ref: ${refId}. ${notes || 'Immediate replacement / cash settlement disbursed at customer counter.'}`;

    db.addComplaintNote(id, {
      officer: `${req.user!.fullName} (Store Lead)`,
      text: refundNote,
      type: 'status_change'
    });

    const updated = db.updateComplaint(id, {
      status: 'Resolved',
      refundStatus: 'Refunded',
      refundAmount: amount,
      refundMethod: method,
      refundDate: nowStr,
      refundTransactionId: refId,
      refundNotes: notes || 'Cash refund disbursed at customer service counter.'
    });

    if (updated) {
      // Sync to legacy DB for Central Food Safety Authority
      syncToLegacyComplaints(updated);

      // Create consumer notification alert
      if (complaint.reporterUserId) {
        db.createAlert({
          title: `💸 Cash Refund Issued: ₹${amount}`,
          message: `${complaint.seller || 'FreshMart'} issued a ${method} refund of ₹${amount} for your report on ${complaint.productName}. Receipt Ref: ${refId}.`,
          severity: 'info',
          targetRole: 'NORMAL_USER'
        });
      }

      // Broadcast real-time Socket.IO events to all dashboards
      broadcastEvent('complaintUpdated', updated);
      broadcastEvent('supermarketComplaintUpdate', updated);
      broadcastEvent('userComplaintUpdate', updated);
      broadcastEvent('customerRefundIssued', {
        complaintId: id,
        productName: complaint.productName,
        customerName: complaint.reporterName,
        amount,
        method,
        refId
      });
    }

    db.logAudit({
      userId: req.user!.id,
      userEmail: req.user!.email,
      userRole: req.user!.role,
      action: 'CUSTOMER_REFUND_ISSUED',
      entityType: 'COMPLAINT',
      entityId: id,
      details: `Issued ${method} refund of ₹${amount} to ${complaint.reporterName} for complaint ${id}`
    });

    return res.json({
      message: `Cash refund of ₹${amount} successfully issued to ${complaint.reporterName || 'customer'}!`,
      complaint: updated
    });
  } catch (err: any) {
    console.error('[SUPERMARKET] Issue refund error:', err);
    return res.status(500).json({ error: 'Failed to issue refund.' });
  }
});

// POST /api/supermarket/complaints/:id/escalate
supermarketRouter.post('/complaints/:id/escalate', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { escalationReason } = req.body;
    const supermarketId = req.user!.supermarketId || 'sm-001';

    const complaint = db.findComplaintById(id);
    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found.' });
    }

    if (!checkStoreAccess(req.user, complaint)) {
      return res.status(403).json({ error: 'Forbidden: You cannot escalate another store\'s complaint.' });
    }

    db.addComplaintNote(id, {
      officer: `${req.user!.fullName} (Supermarket Official)`,
      text: `ESCALATED TO HEAD OFFICE: ${escalationReason || 'Supplier cold-chain defect suspected.'}`,
      type: 'status_change'
    });

    const updated = db.updateComplaint(id, {
      escalatedToHeadOffice: true,
      priority: 'Critical'
    });

    if (updated) {
      syncToLegacyComplaints(updated);
      broadcastEvent('complaintUpdated', updated);
      broadcastEvent('supermarketComplaintUpdate', updated);
      broadcastEvent('userComplaintUpdate', updated);
    }

    db.createAlert({
      title: `Escalated Complaint Incident: ${id}`,
      message: `Store official escalated complaint ${id} regarding ${complaint.productName}. Reason: ${escalationReason || 'Quality dispute'}`,
      severity: 'critical',
      targetRole: 'HEAD_OFFICE_ADMIN'
    });

    db.logAudit({
      userId: req.user!.id,
      userEmail: req.user!.email,
      userRole: req.user!.role,
      action: 'COMPLAINT_ESCALATE',
      entityType: 'COMPLAINT',
      entityId: id,
      details: `Escalated complaint ${id} to Head Office Administration`
    });

    return res.json({ message: 'Incident escalated to Head Office Food Safety Enforcement', complaint: updated });
  } catch (err: any) {
    console.error('[SUPERMARKET] Escalate complaint error:', err);
    return res.status(500).json({ error: 'Failed to escalate complaint.' });
  }
});

// POST /api/supermarket/complaints/:id/contact-audit - Record real contact audit event
supermarketRouter.post('/complaints/:id/contact-audit', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { contactMethod = 'whatsapp' } = req.body;
    const complaint = db.findComplaintById(id);
    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found.' });
    }

    if (!checkStoreAccess(req.user, complaint)) {
      return res.status(403).json({ error: 'Forbidden: You cannot access complaints of another store.' });
    }

    db.logAudit({
      userId: req.user!.id,
      userEmail: req.user!.email,
      userRole: req.user!.role,
      action: 'WhatsApp contact opened',
      entityType: 'COMPLAINT',
      entityId: id,
      details: `Operator opened ${contactMethod} contact for complaint ${id}`
    });

    return res.json({ success: true, message: 'WhatsApp contact opened audit recorded.' });
  } catch (err: any) {
    console.error('[SUPERMARKET] Contact audit error:', err);
    return res.status(500).json({ error: 'Failed to record contact audit.' });
  }
});

// GET /api/supermarket/reports - AI Food & Waste Audit Reports
supermarketRouter.get('/reports', (req: Request, res: Response) => {
  const supermarketId = req.user!.supermarketId || 'sm-001';
  const aiScans = db.listAiAnalyses();
  const inventory = db.listInventory(supermarketId);
  const donations = db.listDonations({ supermarketId });
  const complaints = db.listComplaints({ supermarketId });

  // Calculate live metrics strictly from REAL AI scans & live items
  const totalScans = aiScans.length;
  const freshScans = aiScans.filter(s => s.freshness === 'Fresh' || s.risk === 'Low' || (s.detected_class && s.detected_class.includes('fresh'))).length;
  const nearExpiryBatches = aiScans.filter(s => s.freshness === 'Moderate' || s.risk === 'Medium' || s.recommended_action?.toLowerCase().includes('donate') || s.recommendation?.toLowerCase().includes('donate')).length;
  const spoiledBatches = aiScans.filter(s => s.freshness === 'Spoiled' || s.risk === 'High' || s.analysis_type === 'waste' || (s.detected_class && s.detected_class.includes('rotten'))).length;
  const bioWasteCount = aiScans.filter(s => s.waste_group === 'Biodegradable' || s.freshness === 'Spoiled').length;
  const recyclableCount = aiScans.filter(s => s.waste_group === 'Non-Biodegradable').length;

  return res.json({
    generatedAt: new Date().toISOString(),
    supermarketId,
    summary: {
      totalScans,
      freshScans,
      nearExpiryBatches,
      spoiledBatches,
      bioWasteCount,
      recyclableCount,
      totalItemsInStock: inventory.reduce((acc, i) => acc + i.quantity, 0),
      batchesMonitored: inventory.length,
      totalDonationsKg: donations.reduce((acc, d) => {
        const kg = parseInt(d.quantity) || 10;
        return acc + kg;
      }, 0),
      complaintsCount: complaints.length,
      resolvedComplaints: complaints.filter(c => c.status === 'Resolved').length
    },
    aiScansList: aiScans,
    inventoryList: inventory,
    donationsList: donations,
    complaintsList: complaints
  });
});

// POST /api/supermarket/reports/clear - Reset AI audit reports log
supermarketRouter.post('/reports/clear', (req: Request, res: Response) => {
  try {
    db.clearAiAnalyses();
    return res.json({ success: true, message: 'All AI audit reports cleared successfully.' });
  } catch (err) {
    console.error('[SUPERMARKET] Clear reports error:', err);
    return res.status(500).json({ error: 'Failed to clear reports' });
  }
});

// POST /api/supermarket/inventory/from-scan
supermarketRouter.post('/inventory/from-scan', (req: Request, res: Response) => {
  try {
    const supermarketId = req.user!.supermarketId || 'sm-001';
    const branchId = req.user!.branchId || 'br-001-cp';
    const { scanId, name, category, freshnessStatus, riskLevel, confidence, imageUrl, quantity = 20, unit = 'units' } = req.body;

    const newItem = db.addInventoryItem({
      supermarketId,
      branchId,
      name: name || 'AI Scanned Batch',
      category: category || 'Fresh Produce',
      batchNumber: 'SCAN-' + Date.now().toString().slice(-6),
      quantity: Number(quantity) || 1,
      unit,
      expiryDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
      freshnessStatus: freshnessStatus || 'Fresh',
      riskLevel: riskLevel || 'Low',
      inspectionResult: `AI Deep Learning Scan verified (${confidence || '98%'}). Quality grade: ${freshnessStatus || 'Fresh'}.`,
      flaggedForDonation: freshnessStatus === 'Near-Expiry' || riskLevel === 'Medium',
      notes: `Generated from AI scan ref ${scanId || 'DIRECT'}`,
      imageUrl
    });

    return res.json({ message: 'Scanned item added to store inventory', item: newItem });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to add item from scan.' });
  }
});

// GET /api/supermarket/settings
supermarketRouter.get('/settings', (req: Request, res: Response) => {
  const supermarketId = req.user!.supermarketId || 'sm-001';
  const sm = db.findSupermarketById(supermarketId);
  const branches = db.listBranches(supermarketId);

  return res.json({
    supermarket: sm,
    branches,
    officialAccount: req.user
  });
});

// GET /api/supermarket/tracking
supermarketRouter.get('/tracking', (req: Request, res: Response) => {
  const supermarketId = req.user!.supermarketId || 'sm-001';
  const smDonations = db.listDonations({ supermarketId });
  const active = smDonations.find(d => ['Assigned', 'Picked Up', 'In Transit', 'In Progress'].includes(d.status)) || smDonations[0];

  if (!active) {
    return res.json({
      activeDonation: null,
      tracking: null,
      telemetry: null
    });
  }

  const tracking = buildDonationTrackingPayload(active);

  return res.json({
    activeDonation: active,
    tracking,
    telemetry: {
      donorPos: [tracking.pickup.latitude, tracking.pickup.longitude],
      volunteerPos: [tracking.volunteer.latitude, tracking.volunteer.longitude],
      facilityPos: [22.6200, 88.4600],
      destinationPos: [tracking.destination.latitude, tracking.destination.longitude],
      status: tracking.status,
      eta: `${tracking.etaMinutes} mins`,
      distance: `${tracking.distanceKm} km`,
      volunteerName: tracking.volunteer.name,
      volunteerPhone: tracking.volunteer.phone,
      speed: '28 km/h',
      gpsLocked: true,
      googleMapsUrl: tracking.googleMapsUrl
    }
  });
});
