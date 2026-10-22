import i18n from '../i18n';
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from './aiTranslations';

export { SUPPORTED_LANGUAGES, type SupportedLanguage };

const STORAGE_KEY = 'foodcovering_language';
const I18N_STORAGE_KEY = 'i18nextLng';

/**
 * Get current platform language from storage, i18n, or browser
 */
export function getCurrentLanguage(): SupportedLanguage {
  const stored = (localStorage.getItem(STORAGE_KEY) || localStorage.getItem(I18N_STORAGE_KEY) || '').split('-')[0];
  const valid = SUPPORTED_LANGUAGES.find(l => l.code === stored);
  if (valid) return valid.code;
  
  const currentI18n = (i18n.language || '').split('-')[0];
  const validI18n = SUPPORTED_LANGUAGES.find(l => l.code === currentI18n);
  if (validI18n) return validI18n.code;

  return 'en';
}

/**
 * Sync Google Translate iframe/select element to match language code
 */
function syncGoogleTranslateElement(langCode: string) {
  try {
    if (langCode === 'en') {
      // Clear google translate cookie
      document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`;
    } else {
      // Set google translate cookie for entire site
      document.cookie = `googtrans=/en/${langCode}; path=/;`;
      document.cookie = `googtrans=/en/${langCode}; path=/; domain=${window.location.hostname};`;
    }

    // Also trigger the combo box if Google Translate has initialized
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
 * 4. Syncs with Google Translate DOM engine for full-platform translation
 * 5. Dispatches custom window event
 */
export function setGlobalLanguage(langCode: SupportedLanguage | string) {
  const code = (langCode || 'en').split('-')[0] as SupportedLanguage;
  const isSupported = SUPPORTED_LANGUAGES.some(l => l.code === code);
  const targetCode: SupportedLanguage = isSupported ? code : 'en';

  // 1. i18next update
  i18n.changeLanguage(targetCode);

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

  // 4. Google Translate Sync
  syncGoogleTranslateElement(targetCode);

  // 5. Broadcast custom event
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
  setGlobalLanguage(lang);

  // Re-sync Google Translate if it loads after DOM
  if (typeof window !== 'undefined') {
    window.addEventListener('load', () => {
      setTimeout(() => {
        syncGoogleTranslateElement(lang);
      }, 800);
    });
  }
}
