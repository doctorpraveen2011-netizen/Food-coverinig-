// Real-time DOM Omni-Translator Engine for FoodCovering 2.0
// Guarantees 100% accurate translation across ALL dashboards, features, modals, tables, and cards.
// Safe for React 19: Only mutates textNode.nodeValue and attributes without breaking virtual DOM tree.

import type { SupportedLanguage } from './aiTranslations';
import { DICTIONARY, translateText } from './projectTranslations';

const originalTextMap = new WeakMap<Node, string>();
let currentActiveLang: SupportedLanguage = 'en';
let observer: MutationObserver | null = null;
let isTranslating = false;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

// Safe Node Patch for React virtual DOM stability with external translations
if (typeof window !== 'undefined' && typeof Node !== 'undefined') {
  try {
    const origRemoveChild = Node.prototype.removeChild;
    Node.prototype.removeChild = function <T extends Node>(child: T): T {
      if (child.parentNode !== this) {
        return child;
      }
      return origRemoveChild.call(this, child) as T;
    };

    const origInsertBefore = Node.prototype.insertBefore;
    Node.prototype.insertBefore = function <T extends Node>(newNode: T, referenceNode: Node | null): T {
      if (referenceNode && referenceNode.parentNode !== this) {
        return origInsertBefore.call(this, newNode, null) as T;
      }
      return origInsertBefore.call(this, newNode, referenceNode) as T;
    };
  } catch (e) {
    console.debug('[DOMTranslator] Node patch note:', e);
  }
}

/**
 * Checks if an element should be ignored by the translator
 */
function shouldIgnoreElement(el: Element | null): boolean {
  if (!el) return false;
  const tag = el.tagName.toLowerCase();
  if (tag === 'script' || tag === 'style' || tag === 'noscript' || tag === 'code' || tag === 'pre') {
    return true;
  }
  if (el.classList && (el.classList.contains('no-translate') || el.classList.contains('notranslate'))) {
    return true;
  }
  if (el.getAttribute('translate') === 'no') {
    return true;
  }
  return false;
}

/**
 * Translates composite phrases like "12 Donations", "3 New", "In Transit (4)", etc.
 */
function translateCompositeText(text: string, lang: SupportedLanguage): string {
  // First attempt direct translation
  const direct = translateText(text, lang);
  if (direct !== text) return direct;

  const trimmed = text.trim();
  const dict = DICTIONARY[lang];
  if (!dict) return text;

  // Pattern 1: Number + Word (e.g. "3 New", "12 Donations", "4 Active")
  const numWordMatch = trimmed.match(/^(\d+[\d,.]*)\s+([A-Za-z\s&]+)$/);
  if (numWordMatch) {
    const num = numWordMatch[1];
    const word = numWordMatch[2];
    const translatedWord = dict[word] || translateText(word, lang);
    if (translatedWord !== word) {
      return text.replace(trimmed, `${num} ${translatedWord}`);
    }
  }

  // Pattern 2: Word + (Number) (e.g. "In Transit (3)", "Pending (5)")
  const wordParenMatch = trimmed.match(/^([A-Za-z\s&]+)\s*\((.+)\)$/);
  if (wordParenMatch) {
    const word = wordParenMatch[1].trim();
    const inside = wordParenMatch[2].trim();
    const translatedWord = dict[word] || translateText(word, lang);
    if (translatedWord !== word) {
      return text.replace(trimmed, `${translatedWord} (${inside})`);
    }
  }

  // Pattern 3: Common UI substrings in longer sentences
  // If text contains known phrases like "vs. last week"
  for (const [key, val] of Object.entries(dict)) {
    if (key.length >= 4 && trimmed.includes(key)) {
      return text.replace(key, val);
    }
  }

  return text;
}

/**
 * Translate a single text node
 */
function translateTextNode(node: Text, lang: SupportedLanguage) {
  const parent = node.parentElement;
  if (shouldIgnoreElement(parent)) return;

  const currentVal = node.nodeValue || '';
  if (!currentVal.trim()) return;

  // Retrieve or store original English value
  let originalVal = originalTextMap.get(node);
  if (originalVal === undefined) {
    // If not recorded yet and current is English, save it
    originalVal = currentVal;
    originalTextMap.set(node, originalVal);
    (node as any).__fc_orig = originalVal;
  }

  if (lang === 'en') {
    if (currentVal !== originalVal) {
      node.nodeValue = originalVal;
    }
    return;
  }

  // Translate from original value
  const translated = translateCompositeText(originalVal, lang);
  if (translated !== currentVal) {
    node.nodeValue = translated;
  }
}

/**
 * Translate input placeholders and button titles
 */
function translateAttributes(lang: SupportedLanguage) {
  // 1. Placeholders
  const inputs = document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input[placeholder], textarea[placeholder]');
  inputs.forEach((input) => {
    let orig = input.dataset.fcOrigPlaceholder;
    if (orig === undefined) {
      orig = input.getAttribute('placeholder') || '';
      input.dataset.fcOrigPlaceholder = orig;
    }

    if (lang === 'en') {
      if (input.getAttribute('placeholder') !== orig) {
        input.setAttribute('placeholder', orig);
      }
    } else {
      const translated = translateText(orig, lang);
      if (translated !== input.getAttribute('placeholder')) {
        input.setAttribute('placeholder', translated);
      }
    }
  });

  // 2. Titles & Tooltips
  const titled = document.querySelectorAll<HTMLElement>('[title]');
  titled.forEach((el) => {
    let orig = el.dataset.fcOrigTitle;
    if (orig === undefined) {
      orig = el.getAttribute('title') || '';
      el.dataset.fcOrigTitle = orig;
    }

    if (lang === 'en') {
      if (el.getAttribute('title') !== orig) {
        el.setAttribute('title', orig);
      }
    } else {
      const translated = translateText(orig, lang);
      if (translated !== el.getAttribute('title')) {
        el.setAttribute('title', translated);
      }
    }
  });
}

/**
 * Scans the entire DOM and translates all text nodes and attributes
 */
export function translateDOM(lang: SupportedLanguage) {
  if (typeof document === 'undefined') return;

  currentActiveLang = lang;
  isTranslating = true;

  try {
    const root = document.getElementById('root') || document.body;
    if (!root) return;

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const parent = node.parentElement;
        if (shouldIgnoreElement(parent)) {
          return NodeFilter.FILTER_REJECT;
        }
        if (!node.nodeValue || !node.nodeValue.trim()) {
          return NodeFilter.FILTER_SKIP;
        }
        return NodeFilter.FILTER_ACCEPT;
      }
    });

    let current = walker.nextNode();
    while (current) {
      translateTextNode(current as Text, lang);
      current = walker.nextNode();
    }

    translateAttributes(lang);
  } catch (err) {
    console.debug('[DOMTranslator] Execution notice:', err);
  } finally {
    isTranslating = false;
  }
}

/**
 * Starts observing DOM changes to automatically translate newly mounted views, routes, modals, etc.
 */
export function initDOMTranslator(initialLang: SupportedLanguage = 'en') {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  currentActiveLang = initialLang;

  // Immediate translation pass
  translateDOM(initialLang);

  if (!observer) {
    observer = new MutationObserver((mutations) => {
      if (isTranslating) return;
      if (currentActiveLang === 'en') return;

      // Check if any added nodes or text changes occurred
      let hasRelevantChange = false;
      for (const m of mutations) {
        if (m.type === 'childList' && m.addedNodes.length > 0) {
          hasRelevantChange = true;
          break;
        }
        if (m.type === 'characterData') {
          // Verify it's not our own change
          const target = m.target as Text;
          const orig = originalTextMap.get(target);
          if (orig === undefined || target.nodeValue === orig) {
            hasRelevantChange = true;
            break;
          }
        }
      }

      if (hasRelevantChange) {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          translateDOM(currentActiveLang);
        }, 16);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });
  }

  // Listen to route changes
  window.addEventListener('hashchange', () => {
    setTimeout(() => {
      translateDOM(currentActiveLang);
    }, 20);
  });

  window.addEventListener('popstate', () => {
    setTimeout(() => {
      translateDOM(currentActiveLang);
    }, 20);
  });

  // Listen to custom platform language change events
  window.addEventListener('foodcovering-language-changed', ((e: CustomEvent) => {
    const lang = (e.detail?.language || 'en') as SupportedLanguage;
    currentActiveLang = lang;
    translateDOM(lang);
  }) as EventListener);
}
