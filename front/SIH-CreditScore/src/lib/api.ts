const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

export async function fetchFromApi(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('credit-assist-token');
  const headers: HeadersInit = options.headers || {};

  // Only set Content-Type for JSON requests
  // For FormData, let the browser set it automatically with the boundary
  if (!(options.body instanceof FormData)) {
    (headers as any)['Content-Type'] = 'application/json';
  }

  if (token) {
    (headers as any)['Authorization'] = `Bearer ${token}`;
  }

  const fullUrl = `${API_URL}${endpoint}`;
  console.log(`Fetching: ${fullUrl}`, options);

  const response = await fetch(fullUrl, {
    ...options,
    headers,
    cache: 'no-store',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || `API call failed: ${response.statusText}`);
  }

  return response.json();
}

