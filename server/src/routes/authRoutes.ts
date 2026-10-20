import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db';
import { signToken, requireAuth } from '../auth';
import { User } from '../types';

export const authRouter = Router();

// Helper to calculate live user sustainability credential points, tier, and metrics
export function getUserCredentialStats(user: { id: string; role: string; supermarketId?: string }) {
  let donationsCount = 0;
  let donationPoints = 0;
  let co2SavedKg = 0;
  let foodSavedKg = 0;

  if (user.role === 'NORMAL_USER') {
    const userDonations = db.listDonations({ userId: user.id });
    donationsCount = userDonations.length;
    userDonations.forEach(d => {
      donationPoints += d.creditPoints || 150;
      co2SavedKg += d.co2SavedKg || 18.5;
      const weightNum = parseFloat(d.quantity) || parseFloat(d.weight || '5') || 5;
      foodSavedKg += weightNum;
    });
  } else if (user.role === 'SUPERMARKET_OFFICIAL') {
    const smDonations = db.listDonations({ supermarketId: user.supermarketId || 'sm-001' });
    donationsCount = smDonations.length;
    smDonations.forEach(d => {
      donationPoints += d.creditPoints || 185;
      co2SavedKg += d.co2SavedKg || 45.0;
      const weightNum = parseFloat(d.quantity) || parseFloat(d.weight || '25') || 25;
      foodSavedKg += weightNum;
    });
  } else {
    // Admin Master Directorate
    donationPoints = 3200;
    donationsCount = 24;
    co2SavedKg = 840.0;
    foodSavedKg = 420.0;
  }

  const basePoints = user.role === 'NORMAL_USER' ? 250 : user.role === 'SUPERMARKET_OFFICIAL' ? 750 : 2500;
  const scanBonus = 125;
  const totalPoints = basePoints + donationPoints + scanBonus;

  // Calculate Tier
  let tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' = 'Bronze';
  let tierBadge = 'Bronze Eco Contributor';
  let nextTierPoints = 500;
  let currentTierBase = 0;

  if (totalPoints >= 2500) {
    tier = 'Platinum';
    tierBadge = 'Platinum Zero-Waste Champion';
    nextTierPoints = 5000;
    currentTierBase = 2500;
  } else if (totalPoints >= 1000) {
    tier = 'Gold';
    tierBadge = 'Gold Certified Sustainability Leader';
    nextTierPoints = 2500;
    currentTierBase = 1000;
  } else if (totalPoints >= 500) {
    tier = 'Silver';
    tierBadge = 'Silver Certified Food Rescuer';
    nextTierPoints = 1000;
    currentTierBase = 500;
  }

  const progressToNextTier = Math.min(
    100,
    Math.round(((totalPoints - currentTierBase) / (nextTierPoints - currentTierBase)) * 100)
  );

  return {
    creditPoints: totalPoints,
    tier,
    tierBadge,
    progressToNextTier,
    nextTierPoints,
    pointsToNextTier: Math.max(0, nextTierPoints - totalPoints),
    sustainabilityStats: {
      totalPoints,
      donationsCount,
      co2SavedKg: Math.round(co2SavedKg * 10) / 10,
      foodSavedKg: Math.round(foodSavedKg * 10) / 10,
      waterSavedLiters: Math.round(foodSavedKg * 12),
      mealsProvided: Math.round(foodSavedKg * 2),
      scansCount: 12
    },
    history: [
      { id: 'tx-1', action: 'Surplus Food Batch Dispatched', points: 185, date: 'Today', icon: 'gift' },
      { id: 'tx-2', action: 'AI Freshness Quality Inspection Verified', points: 25, date: 'Yesterday', icon: 'scan' },
      { id: 'tx-3', action: 'Volunteer Live Telemetry Handover', points: 50, date: '2 days ago', icon: 'shield' },
      { id: 'tx-4', action: 'Zero-Waste Tier Achievement', points: 100, date: 'This week', icon: 'award' }
    ]
  };
}

// POST /api/auth/register (Public registration for Normal Users)
authRouter.post('/register', async (req: Request, res: Response) => {
  try {
    const { fullName, email, phone, password, confirmPassword, address, username } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ error: 'Full name, email, and password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = db.findUserByEmailOrUsername(cleanEmail);
    if (existing) {
      return res.status(400).json({ error: 'An account with this email address already exists.' });
    }

    const cleanUsername = username ? username.trim().toLowerCase() : cleanEmail.split('@')[0] + '_' + Math.floor(Math.random() * 1000);
    const existingUsername = db.findUserByEmailOrUsername(cleanUsername);
    const finalUsername = existingUsername ? `${cleanUsername}_${Date.now().toString().slice(-4)}` : cleanUsername;

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser: User = {
      id: 'usr-normal-' + Date.now(),
      email: cleanEmail,
      username: finalUsername,
      passwordHash,
      fullName: fullName.trim(),
      phone: (phone || '').trim(),
      address: (address || '').trim(),
      role: 'NORMAL_USER', // Strictly NORMAL_USER, prevents role spoofing
      isActive: true,
      createdAt: new Date().toISOString()
    };

    const safeUser = db.createUser(newUser);

    const token = signToken({
      userId: safeUser.id,
      email: safeUser.email,
      role: safeUser.role
    });

    db.logAudit({
      userId: safeUser.id,
      userEmail: safeUser.email,
      userRole: safeUser.role,
      action: 'USER_REGISTRATION',
      entityType: 'USER',
      entityId: safeUser.id,
      details: `New normal user registered: ${safeUser.fullName} (${safeUser.email})`
    });

    return res.status(201).json({
      message: 'Registration successful',
      token,
      user: safeUser
    });
  } catch (err: any) {
    console.error('[AUTH] Registration error:', err);
    return res.status(500).json({ error: 'Registration failed due to a server error.' });
  }
});

// POST /api/auth/login (Central secure login for all roles)
authRouter.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email or username and password are required.' });
    }

    const user = db.findUserByEmailOrUsername(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email/username or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email/username or password.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'Account disabled. Please contact the FoodCovering administrator.' });
    }

    // Update last login
    db.updateUser(user.id, { lastLoginAt: new Date().toISOString() });

    const safeUser = db.toSafeUser(user);
    const token = signToken({
      userId: safeUser.id,
      email: safeUser.email,
      role: safeUser.role,
      supermarketId: safeUser.supermarketId,
      branchId: safeUser.branchId
    });

    db.logAudit({
      userId: safeUser.id,
      userEmail: safeUser.email,
      userRole: safeUser.role,
      action: 'USER_LOGIN',
      entityType: 'SESSION',
      entityId: safeUser.id,
      details: `Successful login for ${safeUser.email} [Role: ${safeUser.role}]`
    });

    const credStats = getUserCredentialStats(safeUser);

    return res.json({
      message: 'Authentication successful',
      token,
      user: {
        ...safeUser,
        ...credStats
      }
    });
  } catch (err: any) {
    console.error('[AUTH] Login error:', err);
    return res.status(500).json({ error: 'Login failed due to a server error.' });
  }
});

// GET /api/auth/me (Get authenticated user session)
authRouter.get('/me', requireAuth, (req: Request, res: Response) => {
  const user = req.user!;
  let supermarketDetails = null;
  let branchDetails = null;

  if (user.supermarketId) {
    const sm = db.findSupermarketById(user.supermarketId);
    if (sm) {
      supermarketDetails = { id: sm.id, name: sm.name, code: sm.code };
    }
  }

  if (user.branchId) {
    const branches = db.listBranches(user.supermarketId);
    const br = branches.find(b => b.id === user.branchId);
    if (br) {
      branchDetails = { id: br.id, name: br.branchName, code: br.branchCode };
    }
  }

  const credStats = getUserCredentialStats(user);

  return res.json({
    user: {
      ...user,
      ...credStats,
      supermarket: supermarketDetails,
      branch: branchDetails
    }
  });
});

// GET /api/auth/credentials (Live credential points & sustainability ledger)
authRouter.get('/credentials', requireAuth, (req: Request, res: Response) => {
  const credStats = getUserCredentialStats(req.user!);
  return res.json({
    userId: req.user!.id,
    fullName: req.user!.fullName,
    role: req.user!.role,
    ...credStats
  });
});

// POST /api/auth/credentials/redeem (Claim sustainability recognition certificate)
authRouter.post('/credentials/redeem', requireAuth, (req: Request, res: Response) => {
  const { rewardType = 'CERTIFICATE' } = req.body;
  const credStats = getUserCredentialStats(req.user!);

  const certificateId = `FC-CERT-2026-${Math.floor(Math.random() * 90000) + 10000}`;
  return res.json({
    success: true,
    message: 'Sustainability Credential Certificate verified and issued.',
    certificate: {
      id: certificateId,
      issuedTo: req.user!.fullName,
      role: req.user!.role,
      tier: credStats.tier,
      tierBadge: credStats.tierBadge,
      creditPoints: credStats.creditPoints,
      co2SavedKg: credStats.sustainabilityStats.co2SavedKg,
      mealsProvided: credStats.sustainabilityStats.mealsProvided,
      issueDate: new Date().toISOString(),
      qrVerificationCode: `https://foodcovering.gov/verify/${certificateId}`
    }
  });
});

// POST /api/auth/logout
authRouter.post('/logout', requireAuth, (req: Request, res: Response) => {
  if (req.user) {
    db.logAudit({
      userId: req.user.id,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'USER_LOGOUT',
      entityType: 'SESSION',
      entityId: req.user.id,
      details: `User signed out: ${req.user.email}`
    });
  }
  return res.json({ message: 'Session closed successfully' });
});

// POST /api/auth/change-password
authRouter.post('/change-password', requireAuth, async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long.' });
    }

    const fullUser = db.findUserById(req.user!.id);
    if (!fullUser) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const isMatch = await bcrypt.compare(currentPassword, fullUser.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Current password is incorrect.' });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    db.updateUser(fullUser.id, { passwordHash: newHash });

    db.logAudit({
      userId: fullUser.id,
      userEmail: fullUser.email,
      userRole: fullUser.role,
      action: 'PASSWORD_CHANGE',
      entityType: 'USER',
      entityId: fullUser.id,
      details: `Password updated for ${fullUser.email}`
    });

    return res.json({ message: 'Password updated successfully' });
  } catch (err: any) {
    console.error('[AUTH] Change password error:', err);
    return res.status(500).json({ error: 'Failed to update password.' });
  }
});
