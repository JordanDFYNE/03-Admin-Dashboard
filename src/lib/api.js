const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

function getAuthHeaders() {
  const token = localStorage.getItem('warehouse_token');

  if (!token) {
    return {};
  }

  return {
    Authorization: `Bearer ${token}`,
  };
}

export async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
      ...(options.headers || {}),
    },
    ...options,
  });

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const payload = isJson ? await response.json() : null;

  if (!response.ok) {
    throw new Error(payload?.error?.message || 'Request failed');
  }

  return payload;
}

export async function fetchConsumables(search = '') {
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  const payload = await apiRequest(`/consumables?${params.toString()}`);
  return payload.items;
}

export async function fetchConsumablesSummary() {
  return apiRequest('/consumables/summary');
}
