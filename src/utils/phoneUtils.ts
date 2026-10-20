/**
 * Utility for robust phone normalization, sanitization, and WhatsApp integration.
 * 
 * Prevents URL-encoding corruption (e.g. '%20' turning into digits '20').
 * Ensures cellular dialer ('tel:') and official WhatsApp click-to-chat ('https://wa.me/') work accurately.
 */

export interface PhoneNormalizationOptions {
  contactName?: string;
  role?: string;
  context?: 'donation' | 'complaint' | 'volunteer' | 'tracking' | 'supermarket' | 'general' | string;
  referenceId?: string;
}

export interface NormalizedPhone {
  raw: string;
  digits: string;             // 10 digits e.g. "8248832986" or clean digits
  cleanDestination: string;   // "+918248832986"
  cellularHref: string;       // "tel:+918248832986"
  whatsappHref: string;       // Direct WhatsApp chat
  whatsappVoiceHref: string;  // WhatsApp API send
  whatsappCallHref: string;   // Universal WhatsApp voice call link with dispatch message
  whatsappNativeAppHref: string; // whatsapp:// native app protocol for instant desktop/mobile call
  whatsappWebHref: string;    // https://web.whatsapp.com web client
  formattedDisplay: string;   // "+91 82488 32986" (human readable)
  callMessageText: string;    // Decoded call dispatch message
  qrCodeUrl: string;          // Direct QR code image for scanning with smartphone
  isValid: boolean;
}

/**
 * Normalizes any phone number into pure international digits for WhatsApp click-to-chat links:
 * https://wa.me/<international-number>
 * 
 * Rules:
 * - Strips '+', spaces, '-', '(', ')', '.', '/', '%20'.
 * - Does not blindly prepend 91 if the number already has an international country code.
 * - Handles 10-digit Indian local numbers [6-9]xxxxxxxxx -> prepends '91'.
 * - Handles 11-digit numbers starting with '0' (09876543210) -> strips 0 and prepends '91'.
 * - If already starts with '91' (12 digits), retains as is.
 * - Handles international numbers (e.g. +1, +44, etc.) without corrupting country codes.
 * - Validates length and returns null if invalid.
 */
export function normalizeWhatsAppNumber(phone?: string | null): string | null {
  if (!phone || typeof phone !== 'string') return null;
  let decoded = phone;
  try {
    decoded = decodeURIComponent(phone);
  } catch {
    decoded = phone;
  }
  const hadPlus = decoded.trim().startsWith('+');
  const cleaned = decoded
    .replace(/%20/gi, '')
    .replace(/\s+/g, '')
    .replace(/[()\-./]/g, '');
  let allDigits = cleaned.replace(/\D/g, '');

  // Strip stray '20' artifact if '%20' was previously converted to digits
  if (allDigits.length === 14 && allDigits.startsWith('9120') && /^[6-9]/.test(allDigits.slice(4))) {
    allDigits = '91' + allDigits.slice(4);
  } else if (allDigits.length === 12 && allDigits.startsWith('20') && /^[6-9]/.test(allDigits.slice(2))) {
    allDigits = allDigits.slice(2);
  }

  if (allDigits.length < 8) return null;

  if (hadPlus) {
    return allDigits.length <= 15 ? allDigits : null;
  }

  // Without plus:
  if (allDigits.length === 10 && /^[6-9]/.test(allDigits)) {
    return '91' + allDigits;
  }
  if (allDigits.length === 11 && allDigits.startsWith('0') && /^[6-9]/.test(allDigits.slice(1))) {
    return '91' + allDigits.slice(1);
  }
  if (allDigits.length === 12 && allDigits.startsWith('91') && /^[6-9]/.test(allDigits.slice(2))) {
    return allDigits;
  }
  if (allDigits.length >= 10 && allDigits.length <= 15) {
    return allDigits;
  }
  return null;
}

/**
 * Builds the professional, prefilled FoodCovering Store Complaints WhatsApp message.
 */
export function buildComplaintWhatsAppMessage(params: {
  consumerName?: string;
  storeRepresentative?: string;
  storeName?: string;
  complaintReference?: string;
}): string {
  const rawName = params.consumerName?.trim() || 'Citizen';
  const name = rawName.charAt(0).toUpperCase() + rawName.slice(1);
  const rep = params.storeRepresentative || 'Store Lead';
  const store = params.storeName || 'FreshMart Supermarkets';
  const ref = params.complaintReference || 'FC-Complaint';

  return `Hello ${name},\n\nThis is ${rep} from ${store} regarding your FoodCovering food-safety complaint ${ref}.\n\nWe would like to discuss your complaint and investigation details.\n\nThank you.`;
}

/**
 * Generates the real, official WhatsApp click-to-chat URL:
 * https://wa.me/<international-number>?text=<encoded-message>
 */
export function buildWhatsAppClickToChatUrl(params: {
  phone?: string | null;
  consumerName?: string;
  storeRepresentative?: string;
  storeName?: string;
  complaintReference?: string;
  customMessage?: string;
}): { url: string; normalizedNumber: string } | null {
  const normalizedNumber = normalizeWhatsAppNumber(params.phone);
  if (!normalizedNumber) return null;

  const message = params.customMessage || buildComplaintWhatsAppMessage(params);
  const url = `https://wa.me/${normalizedNumber}?text=${encodeURIComponent(message)}`;
  return { url, normalizedNumber };
}

export function normalizePhone(
  input?: string | null,
  options?: PhoneNormalizationOptions
): NormalizedPhone {
  if (!input || typeof input !== 'string') {
    return {
      raw: '',
      digits: '',
      cleanDestination: '',
      cellularHref: '',
      whatsappHref: '',
      whatsappVoiceHref: '',
      whatsappCallHref: '',
      whatsappNativeAppHref: '',
      whatsappWebHref: '',
      formattedDisplay: 'Unavailable',
      callMessageText: '',
      qrCodeUrl: '',
      isValid: false
    };
  }

  // 1. Decode any URI components
  let decoded = input;
  try {
    decoded = decodeURIComponent(input);
  } catch {
    decoded = input;
  }

  // 2. Remove literal '%20', '+', spaces, hyphens, brackets, dots, slashes
  let cleaned = decoded
    .replace(/%20/gi, '')
    .replace(/\s+/g, '')
    .replace(/[()\-./]/g, '');

  // 3. Extract pure digits
  let allDigits = cleaned.replace(/[^0-9]/g, '');

  // 4. Strip stray '20' artifacts
  if (allDigits.length === 14 && allDigits.startsWith('9120') && /^[6-9]/.test(allDigits.slice(4))) {
    allDigits = '91' + allDigits.slice(4);
  } else if (allDigits.length === 12 && allDigits.startsWith('20') && /^[6-9]/.test(allDigits.slice(2))) {
    allDigits = allDigits.slice(2);
  }

  // 5. Extract local 10-digit number or international digits
  let base10 = '';
  let waNumber = normalizeWhatsAppNumber(input) || '';
  if (allDigits.length === 12 && allDigits.startsWith('91')) {
    base10 = allDigits.slice(2);
  } else if (allDigits.length === 11 && allDigits.startsWith('0')) {
    base10 = allDigits.slice(1);
  } else if (allDigits.length === 10) {
    base10 = allDigits;
  } else if (allDigits.length > 10) {
    base10 = allDigits.slice(-10);
  } else {
    base10 = allDigits;
  }

  // Consider valid if we have at least 8 digits
  const isValid = allDigits.length >= 8;

  // Build clean destination for telecom
  const cleanDestination = base10.length === 10 && /^[6-9]\d{9}$/.test(base10)
    ? `+91${base10}`
    : (allDigits ? `+${allDigits}` : '');

  const cellularHref = cleanDestination ? `tel:${cleanDestination}` : '';

  // Formatted display
  const formattedDisplay = base10.length === 10
    ? `+91 ${base10.slice(0, 5)} ${base10.slice(5)}`
    : (allDigits ? `+${allDigits}` : input);

  // Generate dynamic, context-aware call dispatch message
  const rawName = options?.contactName?.trim();
  const cleanName = rawName && !rawName.toLowerCase().includes('assigning')
    ? rawName
    : (options?.role ? `${options.role}` : 'Dispatch Team');

  let callMessageText = `📞 INCOMING FOODCOVERING CALL DISPATCH\nHello ${cleanName}!`;
  if (options?.context === 'complaint') {
    callMessageText += `\nCalling you regarding Food Safety Incident Report ${options.referenceId ? '#' + options.referenceId : ''}.\n👉 Please tap the 📞 Call icon at the top of this chat to speak with our officer now!`;
  } else if (options?.context === 'volunteer' || options?.context === 'tracking') {
    callMessageText += `\nCalling you regarding Food Rescue Volunteer Delivery ${options.referenceId ? '#' + options.referenceId : ''}.\n👉 Please tap the 📞 Call icon at the top of this chat to coordinate live pickup now!`;
  } else if (options?.context === 'donation') {
    callMessageText += `\nCalling you regarding Food Donation Batch ${options.referenceId ? '#' + options.referenceId : ''}.\n👉 Please tap the 📞 Call icon at the top of this chat to coordinate handover now!`;
  } else {
    callMessageText += `\nCalling you in real-time via FoodCovering Voice Channel.\n👉 Please tap the 📞 Call icon at the top of this chat to speak live now!`;
  }

  const encodedMsg = encodeURIComponent(callMessageText);

  // WhatsApp URLs
  const whatsappHref = waNumber ? `https://wa.me/${waNumber}` : '';
  const whatsappVoiceHref = waNumber ? `https://api.whatsapp.com/send?phone=${waNumber}` : '';
  const whatsappCallHref = waNumber ? `https://wa.me/${waNumber}?text=${encodedMsg}` : '';
  const whatsappNativeAppHref = waNumber ? `whatsapp://send?phone=${waNumber}&text=${encodedMsg}` : '';
  const whatsappWebHref = waNumber ? `https://web.whatsapp.com/send?phone=${waNumber}&text=${encodedMsg}` : '';

  // Dynamic QR Code for instant phone scan
  const qrCodeUrl = whatsappCallHref
    ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(whatsappCallHref)}`
    : '';

  return {
    raw: input,
    digits: base10,
    cleanDestination,
    cellularHref,
    whatsappHref,
    whatsappVoiceHref,
    whatsappCallHref,
    whatsappNativeAppHref,
    whatsappWebHref,
    formattedDisplay,
    callMessageText,
    qrCodeUrl,
    isValid
  };
}
