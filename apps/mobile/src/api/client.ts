export const API_BASE_URL =
  (process.env.EXPO_PUBLIC_API_URL || 'http://43.205.145.63:8003').replace(/\/$/, '');

async function handleResponse(res: Response) {
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data?.detail || data?.message || 'API request failed');
  }

  return data;
}

export async function apiGet(path: string) {
  const res = await fetch(`${API_BASE_URL}${path}`);
  return handleResponse(res);
}

export async function apiPost(path: string, body: unknown) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  return handleResponse(res);
}
