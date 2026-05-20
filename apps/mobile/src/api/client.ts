export const API_BASE_URL =
  (process.env.EXPO_PUBLIC_API_URL || 'http://43.205.145.63:8003').replace(/\/$/, '');

type RequestOptions = {
  timeout?: number;
};

async function withTimeout(fetchPromise: Promise<Response>, timeout = 8000) {
  const timeoutPromise = new Promise<Response>((_, reject) => {
    setTimeout(() => reject(new Error('Request timeout. Please try again.')), timeout);
  });

  return Promise.race([fetchPromise, timeoutPromise]);
}

async function handleResponse(res: Response) {
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data?.detail || data?.message || 'API request failed');
  }

  return data;
}

export async function apiGet(path: string, options?: RequestOptions) {
  const res = await withTimeout(
    fetch(`${API_BASE_URL}${path}`),
    options?.timeout
  );

  return handleResponse(res);
}

export async function apiPost(path: string, body: unknown, options?: RequestOptions) {
  const res = await withTimeout(
    fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    }),
    options?.timeout
  );

  return handleResponse(res);
}

export async function checkBackendHealth() {
  try {
    const res = await fetch(`${API_BASE_URL}/docs`);
    return res.ok;
  } catch {
    return false;
  }
}
