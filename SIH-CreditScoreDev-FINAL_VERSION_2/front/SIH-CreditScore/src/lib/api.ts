const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

export async function fetchFromApi(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('credit-assist-token');
  const headers: HeadersInit = options.headers || {};

  // Only set Content-Type for JSON requests if not already set
  // For FormData or form-urlencoded, let the browser/caller set it
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
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
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || `API call failed: ${response.statusText}`);
  }

  const jsonResponse = await response.json();

  // Extract data from ApiResponse wrapper if present
  if (jsonResponse && typeof jsonResponse === 'object' && 'data' in jsonResponse) {
    return jsonResponse.data;
  }

  return jsonResponse;
}

