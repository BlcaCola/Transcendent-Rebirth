export function normalizeBackendUrl(input: string): string {
  if (!input) return '';
  let url = input.trim();
  if (!url) return '';
  url = url.replace(/\/api\/v1\/?$/i, '');
  url = url.replace(/\/+$/, '');
  return url;
}

function getRuntimeBackendUrl(): string {
  if (typeof window === 'undefined') return '';

  const win = window as Window & { __BACKEND_BASE_URL?: string };
  if (typeof win.__BACKEND_BASE_URL === 'string') {
    const value = win.__BACKEND_BASE_URL.trim();
    if (value) return normalizeBackendUrl(value);
  }

  const meta = document.querySelector('meta[name="backend-base-url"]') as HTMLMetaElement | null;
  if (meta?.content) {
    const value = meta.content.trim();
    if (value) return normalizeBackendUrl(value);
  }

  try {
    const stored = localStorage.getItem('BACKEND_BASE_URL');
    if (stored) {
      const value = stored.trim();
      if (value) return normalizeBackendUrl(value);
    }
  } catch {
    // ignore storage access errors
  }

  return '';
}

export function getBackendServerUrl(): string {
  const runtimeUrl = getRuntimeBackendUrl();
  if (runtimeUrl) return runtimeUrl;
  if (typeof BACKEND_BASE_URL === 'string') return normalizeBackendUrl(BACKEND_BASE_URL);
  return '';
}

export function isBackendConfigured(): boolean {
  return !!getBackendServerUrl();
}

export function buildBackendUrl(path: string): string {
  const baseUrl = getBackendServerUrl();
  if (!baseUrl) return '';
  const suffix = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${suffix}`;
}

export async function fetchBackendVersion(): Promise<string | null> {
  const baseUrl = getBackendServerUrl();
  if (!baseUrl) return null;
  try {
    const response = await fetch(`${baseUrl}/api/v1/version`, { method: 'GET' });
    if (!response.ok) return null;
    const data = await response.json();
    if (data && typeof data.version !== 'undefined') {
      return String(data.version);
    }
  } catch {
    return null;
  }
  return null;
}
