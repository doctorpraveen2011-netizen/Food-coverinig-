import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db';
import { requireAuth, requireRole } from '../auth';
import { Supermarket, SupermarketBranch, User } from '../types';
import { broadcastEvent, syncToLegacyComplaints } from '../events';

export const adminRouter = Router();

// Apply auth & Head Office Administrator role protection
adminRouter.use(requireAuth);
adminRouter.use(requireRole('HEAD_OFFICE_ADMIN'));

// GET /api/admin/dashboard
adminRouter.get('/dashboard', (req: Request, res: Response) => {
  db.reload();
  const supermarkets = db.listSupermarkets();
  const allDonations = db.listDonations();
  const allComplaints = db.listComplaints();
  const allUsers = db.listUsers();
  
  let totalMonitoredInventory = 0;
  supermarkets.forEach(sm => {
    const inv = db.listInventory(sm.id);
    totalMonitoredInventory += inv.length;
  });

  const resolvedComplaints = allComplaints.filter(c => ['Resolved', 'Closed'].includes(c.status)).length;
  const criticalComplaints = allComplaints.filter(c => c.priority === 'Critical' || c.escalatedToHeadOffice).length;

  const supermarketComparison = supermarkets.map(sm => {
    const inv = db.listInventory(sm.id);
    const smDonations = allDonations.filter(d => d.supermarketId === sm.id);
    const smComplaints = allComplaints.filter(c => c.supermarketId === sm.id);
    const branches = db.listBranches(sm.id);

    return {
      id: sm.id,
      name: sm.name,
      code: sm.code,
      city: sm.city,
      status: sm.status,
      branchesCount: branches.length,
      inventoryCount: inv.length,
      freshCount: inv.filter(i => i.freshnessStatus === 'Fresh').length,
      nearExpiryCount: inv.filter(i => i.freshnessStatus === 'Near-Expiry').length,
      spoiledCount: inv.filter(i => i.freshnessStatus === 'Spoiled').length,
      donationsCount: smDonations.length,
      complaintsCount: smComplaints.length,
      safetyScore: Math.max(70, 100 - smComplaints.length * 5)
    };
  });

  return res.json({
    kpis: {
      totalDonations: 248 + allDonations.length,
      activeSupermarkets: supermarkets.filter(s => s.status === 'Active').length,
      totalMonitoredInventory: totalMonitoredInventory + 450,
      activeVolunteers: 156,
      complaintsResolved: 92 + resolvedComplaints,
      foodSafetyScore: 94,
      criticalIncidents: criticalComplaints,
      wasteReductionKg: 1420 + allDonations.length * 20,
      totalUsers: allUsers.length + 156
    },
    userManagement: {
      totalStakeholders: allUsers.length + 156,
      activeUsers: allUsers.filter(u => u.isActive).length + 156,
      citizens: allUsers.filter(u => u.role === 'NORMAL_USER').length,
      supermarketOfficials: allUsers.filter(u => u.role === 'SUPERMARKET_OFFICIAL').length,
      administrators: allUsers.filter(u => u.role === 'HEAD_OFFICE_ADMIN').length,
      fieldVolunteers: 156,
      recentUsers: allUsers.slice(-6).reverse().map(u => {
        let smName = undefined;
        if (u.supermarketId) {
          const sm = supermarkets.find(s => s.id === u.supermarketId);
          if (sm) smName = sm.name;
        }
        return {
          id: u.id,
          name: u.fullName,
          email: u.email,
          phone: u.phone,
          role: u.role,
          supermarketName: smName,
          isActive: u.isActive,
          createdAt: u.createdAt
        };
      })
    },
    supermarketComparison,
    recentAudits: db.listAuditLogs().slice(0, 8),
    recentComplaints: allComplaints.slice(0, 6)
  });
});

// GET /api/admin/supermarkets
adminRouter.get('/supermarkets', (req: Request, res: Response) => {
  db.reload();
  const supermarkets = db.listSupermarkets();
  const full = supermarkets.map(sm => {
    const branches = db.listBranches(sm.id);
    const officials = db.listUsers('SUPERMARKET_OFFICIAL').filter(u => u.supermarketId === sm.id);
    const inv = db.listInventory(sm.id);
    return {
      ...sm,
      branches,
      officialsCount: officials.length,
      inventoryCount: inv.length
    };
  });

  return res.json({ supermarkets: full });
});

// POST /api/admin/supermarkets
adminRouter.post('/supermarkets', (req: Request, res: Response) => {
  try {
    const { name, code, contactPhone, contactEmail, address, city, region, branchName, managerName } = req.body;

    if (!name || !code) {
      return res.status(400).json({ error: 'Supermarket name and unique code are required.' });
    }

    const smId = 'sm-' + Date.now();
    const newSm: Supermarket = {
      id: smId,
      name: name.trim(),
      code: code.trim().toUpperCase(),
      contactPhone: contactPhone || '+91 98000 00000',
      contactEmail: contactEmail || 'support@supermarket.in',
      address: address || 'Main City Market',
      city: city || 'New Delhi',
      region: region || 'North Zone',
      status: 'Active',
      createdAt: new Date().toISOString()
    };

    const initialBranch: SupermarketBranch = {
      id: 'br-' + Date.now(),
      supermarketId: smId,
      branchName: branchName || `${name} Main Branch`,
      branchCode: `${code}-01`,
      address: address || 'Main City Market',
      city: city || 'New Delhi',
      region: region || 'North Zone',
      contactPhone: contactPhone || '+91 98000 00000',
      managerName: managerName || 'Branch In-charge',
      status: 'Active'
    };

    const saved = db.createSupermarket(newSm, initialBranch);

    db.logAudit({
      userId: req.user!.id,
      userEmail: req.user!.email,
      userRole: req.user!.role,
      action: 'SUPERMARKET_CREATE',
      entityType: 'SUPERMARKET',
      entityId: saved.id,
      details: `Registered new supermarket: ${saved.name} [Code: ${saved.code}]`
    });

    return res.status(201).json({ message: 'Supermarket and default branch registered successfully', supermarket: saved });
  } catch (err: any) {
    console.error('[ADMIN] Create supermarket error:', err);
    return res.status(500).json({ error: 'Failed to create supermarket.' });
  }
});

// PUT /api/admin/supermarkets/:id
adminRouter.put('/supermarkets/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updated = db.updateSupermarket(id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Supermarket not found.' });
    }

    db.logAudit({
      userId: req.user!.id,
      userEmail: req.user!.email,
      userRole: req.user!.role,
      action: 'SUPERMARKET_UPDATE',
      entityType: 'SUPERMARKET',
      entityId: id,
      details: `Updated supermarket ${updated.name}`
    });

    return res.json({ message: 'Supermarket updated successfully', supermarket: updated });
  } catch (err: any) {
    console.error('[ADMIN] Update supermarket error:', err);
    return res.status(500).json({ error: 'Failed to update supermarket.' });
  }
});

// POST /api/admin/supermarkets/:id/branches
adminRouter.post('/supermarkets/:id/branches', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { branchName, branchCode, address, city, region, contactPhone, managerName } = req.body;

    const sm = db.findSupermarketById(id);
    if (!sm) {
      return res.status(404).json({ error: 'Supermarket not found.' });
    }

    const newBranch: SupermarketBranch = {
      id: 'br-' + Date.now(),
      supermarketId: id,
      branchName: branchName || `${sm.name} Branch`,
      branchCode: branchCode || `${sm.code}-${Date.now().toString().slice(-2)}`,
      address: address || sm.address,
      city: city || sm.city,
      region: region || sm.region,
      contactPhone: contactPhone || sm.contactPhone,
      managerName: managerName || 'Branch Manager',
      status: 'Active'
    };

    const saved = db.addBranch(newBranch);

    db.logAudit({
      userId: req.user!.id,
      userEmail: req.user!.email,
      userRole: req.user!.role,
      action: 'BRANCH_CREATE',
      entityType: 'BRANCH',
      entityId: saved.id,
      details: `Added branch ${saved.branchName} to supermarket ${sm.name}`
    });

    return res.status(201).json({ message: 'Branch created successfully', branch: saved });
  } catch (err: any) {
    console.error('[ADMIN] Create branch error:', err);
    return res.status(500).json({ error: 'Failed to create branch.' });
  }
});

// POST /api/admin/supermarket-officials (Secure official provisioning)
adminRouter.post('/supermarket-officials', async (req: Request, res: Response) => {
  try {
    const { fullName, email, username, password, phone, supermarketId, branchId } = req.body;

    if (!fullName || !email || !password || !supermarketId) {
      return res.status(400).json({ error: 'Full name, email, password, and assigned supermarket are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const sm = db.findSupermarketById(supermarketId);
    if (!sm) {
      return res.status(400).json({ error: 'Target supermarket does not exist.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = db.findUserByEmailOrUsername(cleanEmail);
    if (existing) {
      return res.status(400).json({ error: 'An account with this email address already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newOfficial: User = {
      id: 'usr-sm-' + Date.now(),
      email: cleanEmail,
      username: username ? username.trim().toLowerCase() : cleanEmail.split('@')[0],
      passwordHash,
      fullName: fullName.trim(),
      phone: phone || sm.contactPhone,
      address: `${sm.name}, ${sm.address}`,
      role: 'SUPERMARKET_OFFICIAL',
      supermarketId,
      branchId: branchId || undefined,
      isActive: true,
      createdAt: new Date().toISOString()
    };

    const saved = db.createUser(newOfficial);

    db.logAudit({
      userId: req.user!.id,
      userEmail: req.user!.email,
      userRole: req.user!.role,
      action: 'SUPERMARKET_OFFICIAL_PROVISION',
      entityType: 'USER',
      entityId: saved.id,
      details: `Admin provisioned supermarket official: ${saved.fullName} (${saved.email}) for ${sm.name}`
    });

    return res.status(201).json({ message: 'Supermarket official account created successfully', user: saved });
  } catch (err: any) {
    console.error('[ADMIN] Provision official error:', err);
    return res.status(500).json({ error: 'Failed to create supermarket official account.' });
  }
});

// GET /api/admin/users
adminRouter.get('/users', (req: Request, res: Response) => {
  db.reload();
  const { role, search } = req.query;
  const rawUsers = db.listUsers();
  const supermarkets = db.listSupermarkets();

  // Enrich with supermarket details
  const enrichedUsers = rawUsers.map(u => {
    let smName = undefined;
    let brName = undefined;
    if (u.supermarketId) {
      const sm = supermarkets.find(s => s.id === u.supermarketId);
      if (sm) smName = sm.name;
      if (u.branchId) {
        const branches = db.listBranches(u.supermarketId);
        const br = branches.find(b => b.id === u.branchId);
        if (br) brName = br.branchName;
      }
    }
    return {
      ...u,
      supermarketName: smName,
      branchName: brName
    };
  });

  let users = enrichedUsers;

  if (role && typeof role === 'string' && role !== 'ALL') {
    if (role === 'VOLUNTEER') {
      users = users.filter(u => u.id.startsWith('usr-vol-') || u.fullName.toLowerCase().includes('volunteer'));
    } else if (role === 'DONOR') {
      users = users.filter(u => u.id.startsWith('usr-donor-') || u.fullName.toLowerCase().includes('donor'));
    } else if (role === 'CITIZEN' || role === 'NORMAL_USER') {
      users = users.filter(u => u.role === 'NORMAL_USER' && !u.id.startsWith('usr-vol-') && !u.id.startsWith('usr-donor-') && !u.fullName.toLowerCase().includes('volunteer') && !u.fullName.toLowerCase().includes('donor'));
    } else {
      users = users.filter(u => u.role === role);
    }
  }

  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    users = users.filter(u => 
      u.fullName.toLowerCase().includes(q) || 
      u.email.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      (u.supermarketName && u.supermarketName.toLowerCase().includes(q)) ||
      (u.phone && u.phone.includes(q))
    );
  }

  const summary = {
    total: enrichedUsers.length,
    active: enrichedUsers.filter(u => u.isActive).length,
    supermarketOfficials: enrichedUsers.filter(u => u.role === 'SUPERMARKET_OFFICIAL').length,
    citizens: enrichedUsers.filter(u => u.role === 'NORMAL_USER' && !u.id.startsWith('usr-vol-') && !u.id.startsWith('usr-donor-') && !u.fullName.toLowerCase().includes('volunteer') && !u.fullName.toLowerCase().includes('donor')).length,
    volunteers: enrichedUsers.filter(u => u.id.startsWith('usr-vol-') || u.fullName.toLowerCase().includes('volunteer')).length,
    donors: enrichedUsers.filter(u => u.id.startsWith('usr-donor-') || u.fullName.toLowerCase().includes('donor')).length,
    administrators: enrichedUsers.filter(u => u.role === 'HEAD_OFFICE_ADMIN').length
  };

  return res.json({ users, summary });
});

// PUT /api/admin/users/:id/status
adminRouter.put('/users/:id/status', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (id === req.user!.id) {
      return res.status(400).json({ error: 'Cannot deactivate your own active administrator account.' });
    }

    const updated = db.setUserStatus(id, Boolean(isActive));
    if (!updated) {
      return res.status(404).json({ error: 'User not found.' });
    }

    db.logAudit({
      userId: req.user!.id,
      userEmail: req.user!.email,
      userRole: req.user!.role,
      action: 'USER_STATUS_CHANGE',
      entityType: 'USER',
      entityId: id,
      details: `Administrator set account ${updated.email} active status to ${isActive}`
    });

    return res.json({ message: `User account ${isActive ? 'activated' : 'deactivated'} successfully`, user: updated });
  } catch (err: any) {
    console.error('[ADMIN] Update user status error:', err);
    return res.status(500).json({ error: 'Failed to update user status.' });
  }
});

// GET /api/admin/complaints
adminRouter.get('/complaints', (req: Request, res: Response) => {
  const { status } = req.query;
  const complaints = db.listComplaints({ status: status as string });
  return res.json({ complaints });
});

// PUT /api/admin/complaints/:id
adminRouter.put('/complaints/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, assignedOfficer, noteText, priority } = req.body;

    const existing = db.findComplaintById(id);
    if (!existing) {
      return res.status(404).json({ error: 'Complaint not found.' });
    }

    if (noteText) {
      db.addComplaintNote(id, {
        officer: assignedOfficer || req.user!.fullName,
        text: noteText,
        type: 'status_change'
      });
    }

    const updated = db.updateComplaint(id, {
      status: status || existing.status,
      assignedOfficer: assignedOfficer || existing.assignedOfficer,
      priority: priority || existing.priority
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
      action: 'COMPLAINT_ADMIN_RULING',
      entityType: 'COMPLAINT',
      entityId: id,
      details: `Head Office updated complaint ${id} status to ${status || existing.status}`
    });

    return res.json({ message: 'Complaint updated successfully', complaint: updated });
  } catch (err: any) {
    console.error('[ADMIN] Update complaint error:', err);
    return res.status(500).json({ error: 'Failed to update complaint.' });
  }
});

// GET /api/admin/donations
adminRouter.get('/donations', (req: Request, res: Response) => {
  const donations = db.listDonations();
  return res.json({ donations });
});

// GET /api/admin/audit-logs
adminRouter.get('/audit-logs', (req: Request, res: Response) => {
  const auditLogs = db.listAuditLogs();
  return res.json({ auditLogs });
});

// GET /api/admin/alerts
adminRouter.get('/alerts', (req: Request, res: Response) => {
  const alerts = db.listAlerts();
  return res.json({ alerts });
});

// POST /api/admin/alerts
adminRouter.post('/alerts', (req: Request, res: Response) => {
  try {
    const { title, message, severity = 'warning', targetRole, supermarketId } = req.body;
    if (!title || !message) {
      return res.status(400).json({ error: 'Alert title and message are required.' });
    }

    const created = db.createAlert({
      title,
      message,
      severity,
      targetRole,
      supermarketId
    });

    db.logAudit({
      userId: req.user!.id,
      userEmail: req.user!.email,
      userRole: req.user!.role,
      action: 'ALERT_BROADCAST',
      entityType: 'ALERT',
      entityId: created.id,
      details: `Broadcast alert: ${title}`
    });

    return res.status(201).json({ message: 'Alert broadcasted successfully', alert: created });
  } catch (err: any) {
    console.error('[ADMIN] Create alert error:', err);
    return res.status(500).json({ error: 'Failed to broadcast alert.' });
  }
});

// GET /api/admin/system/health
adminRouter.get('/system/health', (req: Request, res: Response) => {
  return res.json({
    status: 'ONLINE',
    uptimeSeconds: process.uptime(),
    timestamp: new Date().toISOString(),
    nodeVersion: process.version,
    database: {
      usersCount: db.listUsers().length,
      supermarketsCount: db.listSupermarkets().length,
      donationsCount: db.listDonations().length,
      complaintsCount: db.listComplaints().length,
      auditLogsCount: db.listAuditLogs().length
    }
  });
});
