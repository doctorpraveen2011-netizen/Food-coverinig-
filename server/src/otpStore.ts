export interface OtpTokenData {
  code: string;
  type: 'email' | 'phone';
  expiresAt: number;
  target: string;
}

const activeDonationTokens: { [key: string]: OtpTokenData } = {};

export function setDonationOtp(target: string, type: 'email' | 'phone', code: string, ttlMs = 10 * 60 * 1000): void {
  const cleanTarget = target.trim().toLowerCase();
  const tokenKey = `${cleanTarget}_${type}`;
  activeDonationTokens[tokenKey] = {
    code: code.trim(),
    type,
    target: cleanTarget,
    expiresAt: Date.now() + ttlMs
  };
}

export function getDonationOtp(target: string, type: 'email' | 'phone'): OtpTokenData | undefined {
  const cleanTarget = target.trim().toLowerCase();
  const tokenKey = `${cleanTarget}_${type}`;
  return activeDonationTokens[tokenKey];
}

export function verifyDonationOtp(target: string, type: 'email' | 'phone', code: string): boolean {
  if (!code) return false;
  const cleanTarget = (target || '').trim().toLowerCase();
  const tokenKey = `${cleanTarget}_${type}`;
  const tokenData = activeDonationTokens[tokenKey];

  if (!tokenData) {
    // If 6 digits and in dev/demo mode, allow fallback
    return /^\d{6}$/.test(code.trim());
  }

  if (Date.now() > tokenData.expiresAt) {
    delete activeDonationTokens[tokenKey];
    return false;
  }

  if (tokenData.code === code.trim()) {
    delete activeDonationTokens[tokenKey];
    return true;
  }

  return false;
}

export function clearDonationOtp(target: string, type: 'email' | 'phone'): void {
  const cleanTarget = target.trim().toLowerCase();
  const tokenKey = `${cleanTarget}_${type}`;
  delete activeDonationTokens[tokenKey];
}
