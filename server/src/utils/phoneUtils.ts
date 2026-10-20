/**
 * Backend utility for robust phone normalization and sanitization.
 * Prevents URL-encoding corruption (e.g. '%20' turning into digits '20').
 */

export interface NormalizedPhone {
  raw: string;
  digits: string;             // 10 digits, e.g. "8248832986"
  cellularHref: string;       // "tel:+918248832986" (zero spaces, guaranteed no URL encoding artifacts)
  whatsappHref: string;       // "https://wa.me/918248832986"
  whatsappVoiceHref: string;  // "https://api.whatsapp.com/send?phone=918248832986"
  formattedDisplay: string;   // "+91 82488 32986" (human readable)
  cleanE164: string;          // "+918248832986"
  cleanDestination: string;   // "+918248832986"
  isValid: boolean;
}

export function normalizePhone(input?: string | null): NormalizedPhone {
  if (!input || typeof input !== 'string') {
    return {
      raw: '',
      digits: '',
      cellularHref: '',
      whatsappHref: '',
      whatsappVoiceHref: '',
      formattedDisplay: 'Unavailable',
      cleanE164: '',
      cleanDestination: '',
      isValid: false
    };
  }

  let decoded = input;
  try {
    decoded = decodeURIComponent(input);
  } catch {
    decoded = input;
  }

  let cleaned = decoded
    .replace(/%20/gi, '')
    .replace(/\s+/g, '')
    .replace(/[\(\)\-\.\/]/g, '');

  let allDigits = cleaned.replace(/[^0-9]/g, '');

  if (allDigits.length === 14 && allDigits.startsWith('9120') && /^[6-9]/.test(allDigits.slice(4))) {
    allDigits = '91' + allDigits.slice(4);
  } else if (allDigits.length === 12 && allDigits.startsWith('20') && /^[6-9]/.test(allDigits.slice(2))) {
    allDigits = allDigits.slice(2);
  }

  let base10 = '';
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

  const isValid = base10.length === 10 && /^[6-9]\d{9}$/.test(base10);
  const cleanE164 = isValid ? `+91${base10}` : (allDigits ? `+${allDigits}` : '');
  const cellularHref = isValid ? `tel:+91${base10}` : (allDigits.length >= 6 ? `tel:+${allDigits}` : '');
  const whatsappHref = isValid ? `https://wa.me/91${base10}` : '';
  const whatsappVoiceHref = isValid ? `https://api.whatsapp.com/send?phone=91${base10}` : '';
  const formattedDisplay = isValid 
    ? `+91 ${base10.slice(0, 5)} ${base10.slice(5)}`
    : input;

  return {
    raw: input,
    digits: base10,
    cellularHref,
    whatsappHref,
    whatsappVoiceHref,
    formattedDisplay,
    cleanE164,
    cleanDestination: cleanE164,
    isValid
  };
}
