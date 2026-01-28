/**
 * HTTP helpers for tests.
 * Utilities for server verification and HTTP requests.
 */

export interface HttpResponse {
  readonly status: number;
  readonly body: unknown;
}

/**
 * Wait for a server to respond at the given URL.
 */
export const waitForServer = async (
  url: string,
  timeoutSeconds = 30,
  intervalMs = 500
): Promise<boolean> => {
  const start = Date.now();
  while (Date.now() - start < timeoutSeconds * 1000) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(1000) });
      if (response.status < 500) return true;
    } catch {
      // Server not ready yet
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  return false;
};

/**
 * Make an HTTP GET request.
 */
export const httpGet = async (url: string, timeoutMs = 5000): Promise<HttpResponse> => {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
    const contentType = response.headers.get('content-type') ?? '';
    const body = contentType.includes('application/json')
      ? await response.json()
      : await response.text();
    return { status: response.status, body };
  } catch {
    return { status: 0, body: '' };
  }
};

/**
 * Make an HTTP POST request.
 */
export const httpPost = async (
  url: string,
  body: unknown,
  timeoutMs = 5000
): Promise<HttpResponse> => {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    });
    const contentType = response.headers.get('content-type') ?? '';
    const responseBody = contentType.includes('application/json')
      ? await response.json()
      : await response.text();
    return { status: response.status, body: responseBody };
  } catch {
    return { status: 0, body: '' };
  }
};
