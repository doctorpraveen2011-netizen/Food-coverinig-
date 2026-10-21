/**
 * FoodCovering 2.0 Centralized API & Cloud Configuration
 * Handles seamless hybrid operation between Localhost, Live Deployed Backends, and Static GitHub Pages
 */

export function getBackendUrl(): string {
  // 1. Check custom user-configured backend URL stored in localStorage
  if (typeof window !== 'undefined') {
    const custom = localStorage.getItem('fc_backend_url');
    if (custom && custom.trim()) {
      return custom.trim().replace(/\/+$/, '');
    }
  }

  // 2. Check environment variable VITE_BACKEND_URL (set during build or in .env)
  if (import.meta.env.VITE_BACKEND_URL) {
    const envUrl = String(import.meta.env.VITE_BACKEND_URL).trim();
    if (envUrl && envUrl !== 'undefined') {
      if (envUrl.startsWith('http://') || envUrl.startsWith('https://')) {
        return envUrl.replace(/\/+$/, '');
      }
      return `https://${envUrl}`.replace(/\/+$/, '');
    }
  }

  // 3. Local development
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return 'http://localhost:5000';
    }
  }

  // 4. On public hosting (e.g. GitHub Pages) without an explicit backend URL:
  // Return empty string to prevent Mixed Content (HTTP on HTTPS) errors and fallback directly to client engine
  return '';
}

export function isLocalhost(): boolean {
  return typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
}

export function isBackendConfigured(): boolean {
  const url = getBackendUrl();
  return Boolean(url && url.length > 0);
}

export const hasLiveBackend = isBackendConfigured;

import { io, Socket } from 'socket.io-client';

/**
 * Creates a socket only if a real backend URL is available.
 * Prevents Mixed Content and continuous reconnect errors on GitHub Pages.
 */
export function createSafeSocket(options: any = {}): Socket | null {
  const url = getBackendUrl();
  if (!url) {
    return null;
  }
  try {
    return io(url, {
      reconnectionAttempts: 2,
      timeout: 3000,
      ...options
    });
  } catch (err) {
    console.warn('Socket connection skipped or failed:', err);
    return null;
  }
}


/**
 * Universal safe API fetch that:
 * 1. Checks if a valid backend URL exists (skips insecure Mixed Content calls on GitHub Pages)
 * 2. Attaches auth token
 * 3. Handles timeouts gracefully without hanging
 * 4. Calls fallback data provider if backend is offline or unconfigured
 */
export async function safeApiFetch<T>(
  path: string,
  options: RequestInit = {},
  fallbackFn?: () => T | Promise<T>,
  timeoutMs = 3000
): Promise<{ ok: boolean; data?: T; status?: number; isFallback?: boolean }> {
  const baseUrl = getBackendUrl();

  // If no backend URL configured on GitHub Pages, immediately use fallback
  if (!baseUrl) {
    if (fallbackFn) {
      try {
        const fallbackData = await fallbackFn();
        return { ok: true, data: fallbackData, isFallback: true };
      } catch {
        return { ok: false, isFallback: true };
      }
    }
    return { ok: false, isFallback: true };
  }

  // Prevent mixed content on HTTPS pages
  if (typeof window !== 'undefined' && window.location.protocol === 'https:' && baseUrl.startsWith('http://') && !baseUrl.includes('localhost')) {
    if (fallbackFn) {
      const fallbackData = await fallbackFn();
      return { ok: true, data: fallbackData, isFallback: true };
    }
    return { ok: false, isFallback: true };
  }

  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('fc_auth_token') : null;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers as Record<string, string> || {})
    };

    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    const fullUrl = `${baseUrl}${cleanPath}`;

    const res = await fetch(fullUrl, {
      ...options,
      headers,
      signal: AbortSignal.timeout(timeoutMs)
    });

    if (res.ok) {
      const data = await res.json();
      return { ok: true, data, status: res.status, isFallback: false };
    }
    throw new Error(`HTTP ${res.status}`);
  } catch {
    if (fallbackFn) {
      try {
        const fallbackData = await fallbackFn();
        return { ok: true, data: fallbackData, isFallback: true };
      } catch {
        return { ok: false, isFallback: true };
      }
    }
    return { ok: false, isFallback: true };
  }
}

export function setCustomBackendUrl(url: string): void {
  if (typeof window !== 'undefined') {
    if (!url || !url.trim()) {
      localStorage.removeItem('fc_backend_url');
    } else {
      localStorage.setItem('fc_backend_url', url.trim());
    }
    window.dispatchEvent(new Event('fc_backend_url_changed'));
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  fallback: () => T | Promise<T>,
  timeoutMs = 2500
): Promise<T> {
  const result = await safeApiFetch<T>(path, options, fallback, timeoutMs);
  if (result.ok && result.data !== undefined) {
    return result.data;
  }
  return await fallback();
}

/**
 * Tests live connection to any remote backend endpoint (Render, AWS, Ngrok, or Localhost)
 */
export async function testBackendConnection(url: string): Promise<{
  ok: boolean;
  latencyMs: number;
  error?: string;
  service?: string;
}> {
  const cleanUrl = url.trim().replace(/\/+$/, '');
  if (!cleanUrl) {
    return { ok: false, latencyMs: 0, error: 'Empty URL provided' };
  }
  const start = performance.now();
  try {
    const res = await fetch(`${cleanUrl}/api/v1/ml/status`, {
      method: 'GET',
      signal: AbortSignal.timeout(4000)
    });
    const latencyMs = Math.round(performance.now() - start);
    if (res.ok) {
      const data = await res.json();
      return { ok: true, latencyMs, service: data.service || 'FoodCovering PyTorch Inference Server' };
    }
    return { ok: true, latencyMs, service: `Connected (HTTP ${res.status})` };
  } catch (err: any) {
    return { ok: false, latencyMs: 0, error: err?.message || 'Network unreachable or CORS blocked' };
  }
}

