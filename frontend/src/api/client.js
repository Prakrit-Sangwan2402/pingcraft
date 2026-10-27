const API_BASE = '/api';

function getToken() {
  return localStorage.getItem('pingcraft_token');
}

export function setToken(token) {
  if (token) {
    localStorage.setItem('pingcraft_token', token);
  } else {
    localStorage.removeItem('pingcraft_token');
  }
}

async function request(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers
    });
  } catch (netErr) {
    throw new Error(`Unable to reach API server (${netErr.message})`);
  }

  const contentType = response.headers.get('content-type') || '';
  let data = null;
  if (contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    const errorMsg = data?.message || data?.errors?.join(', ') || `HTTP ${response.status} ${response.statusText}`;
    const err = new Error(errorMsg);
    err.status = response.status;
    err.data = data;
    throw err;
  }

  return data;
}

export const api = {
  auth: {
    login: (credentials) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
    register: (userData) => request('/auth/register', { method: 'POST', body: JSON.stringify(userData) }),
    getMe: () => request('/auth/me')
  },

  monitors: {
    getAll: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/monitors${qs ? `?${qs}` : ''}`);
    },
    getById: (id) => request(`/monitors/${id}`),
    create: (data) => request('/monitors', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/monitors/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    togglePause: (id) => request(`/monitors/${id}/pause`, { method: 'PATCH' }),
    delete: (id) => request(`/monitors/${id}`, { method: 'DELETE' }),
    instantProbe: (probeData) => request('/monitors/instant-probe', { method: 'POST', body: JSON.stringify(probeData) }),
    seedDemo: () => request('/monitors/seed', { method: 'POST' }),
    getLogs: (id, params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/monitors/${id}/logs${qs ? `?${qs}` : ''}`);
    }
  },

  incidents: {
    getAll: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/incidents${qs ? `?${qs}` : ''}`);
    },
    getById: (id) => request(`/incidents/${id}`),
    updateStatus: (id, payload) => request(`/incidents/${id}/status`, { method: 'PATCH', body: JSON.stringify(payload) })
  },

  statusPages: {
    getPublic: (slug) => request(`/status-pages/public/${slug}`),
    getMy: () => request('/status-pages/me'),
    updateMy: (data) => request('/status-pages/me', { method: 'PUT', body: JSON.stringify(data) })
  },

  health: {
    check: () => request('/health')
  }
};
