import i18n from '../i18n';
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from './aiTranslations';
import { initDOMTranslator, translateDOM } from './domTranslator';

export { SUPPORTED_LANGUAGES, type SupportedLanguage };

const STORAGE_KEY = 'foodcovering_language';
const I18N_STORAGE_KEY = 'i18nextLng';

/**
 * Get current platform language from storage, i18n, or browser
 */
export function getCurrentLanguage(): SupportedLanguage {
  try {
    const stored = (localStorage.getItem(STORAGE_KEY) || localStorage.getItem(I18N_STORAGE_KEY) || '').split('-')[0];
    const valid = SUPPORTED_LANGUAGES.find(l => l.code === stored);
    if (valid) return valid.code;
    
    const currentI18n = (i18n.language || '').split('-')[0];
    const validI18n = SUPPORTED_LANGUAGES.find(l => l.code === currentI18n);
    if (validI18n) return validI18n.code;
  } catch (e) {
    // ignore
  }

  return 'en';
}

/**
 * Sync Google Translate iframe/select element to match language code
 */
function syncGoogleTranslateElement(langCode: string) {
  try {
    const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
    const hasDot = hostname.includes('.');

    if (langCode === 'en') {
      // Clear google translate cookies safely
      document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      if (hasDot) {
        document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${hostname};`;
        document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${hostname};`;
      }
    } else {
      // Set google translate cookie without domain for localhost/single-label hosts
      document.cookie = `googtrans=/en/${langCode}; path=/;`;
      document.cookie = `googtrans=/auto/${langCode}; path=/;`;
      if (hasDot) {
        document.cookie = `googtrans=/en/${langCode}; path=/; domain=${hostname};`;
        document.cookie = `googtrans=/en/${langCode}; path=/; domain=.${hostname};`;
      }
    }

    // Trigger the Google Translate select element if initialized
    const combo = document.querySelector<HTMLSelectElement>('.goog-te-combo');
    if (combo) {
      if (combo.value !== langCode) {
        combo.value = langCode;
        combo.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
  } catch (e) {
    console.debug('[TranslateSync] Note:', e);
  }
}

/**
 * Universal language changer:
 * 1. Updates i18next instance reactively across all React components
 * 2. Saves to localStorage under both keys
 * 3. Updates HTML lang attribute
 * 4. Runs real-time DOM Omni-Translator for full dashboard & feature translation
 * 5. Syncs with Google Translate DOM engine for auxiliary translation
 * 6. Dispatches custom window event
 */
export function setGlobalLanguage(langCode: SupportedLanguage | string) {
  const code = (langCode || 'en').split('-')[0] as SupportedLanguage;
  const isSupported = SUPPORTED_LANGUAGES.some(l => l.code === code);
  const targetCode: SupportedLanguage = isSupported ? code : 'en';

  // 1. i18next update
  try {
    i18n.changeLanguage(targetCode);
  } catch (e) {
    console.debug('[LanguageCoordinator] i18n change error:', e);
  }

  // 2. Storage update
  try {
    localStorage.setItem(STORAGE_KEY, targetCode);
    localStorage.setItem(I18N_STORAGE_KEY, targetCode);
  } catch (err) {
    console.warn('Unable to persist language to localStorage', err);
  }

  // 3. Document attribute
  if (typeof document !== 'undefined') {
    document.documentElement.lang = targetCode;
  }

  // 4. Real-time DOM Omni-Translator (Translates all dashboards, cards, tables, modals)
  translateDOM(targetCode);

  // 5. Google Translate Sync
  syncGoogleTranslateElement(targetCode);

  // 6. Broadcast custom event
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('foodcovering-language-changed', {
        detail: { language: targetCode }
      })
    );
  }

  return targetCode;
}

/**
 * Initialize on application mount
 */
export function initLanguageCoordinator() {
  const lang = getCurrentLanguage();
  
  // Initialize Real-time DOM Omni-Translator
  initDOMTranslator(lang);
  
  setGlobalLanguage(lang);

  // Re-sync Google Translate if it loads after DOM
  if (typeof window !== 'undefined') {
    window.addEventListener('load', () => {
      setTimeout(() => {
        syncGoogleTranslateElement(lang);
      }, 500);
      setTimeout(() => {
        translateDOM(getCurrentLanguage());
      }, 800);
    });
  }
}
