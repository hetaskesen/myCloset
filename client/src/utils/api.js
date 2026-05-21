// In dev: Vite proxies /api → http://localhost:3001/api
// In prod: Express serves everything on the same port, no proxy needed
const SECRET = import.meta.env.VITE_API_SECRET || '';

async function apiFetch(path, options = {}) {
  const res = await fetch(`/api${path}`, {
    ...options,
    headers: {
      'x-api-secret': SECRET,
      ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...options.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'API error');
  }
  return res.json();
}

export const api = {
  getItems: (params = {}) => apiFetch('/items?' + new URLSearchParams(params)),
  getItem: (id) => apiFetch(`/items/${id}`),
  createItem: (formData) => apiFetch('/items', { method: 'POST', body: formData }),
  updateItem: (id, formData) => apiFetch(`/items/${id}`, { method: 'PATCH', body: formData }),
  deleteItem: (id) => apiFetch(`/items/${id}`, { method: 'DELETE' }),

  getOutfits: () => apiFetch('/outfits'),
  getOutfit: (id) => apiFetch(`/outfits/${id}`),
  createOutfit: (data) => apiFetch('/outfits', { method: 'POST', body: JSON.stringify(data) }),
  updateOutfit: (id, data) => apiFetch(`/outfits/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteOutfit: (id) => apiFetch(`/outfits/${id}`, { method: 'DELETE' }),

  getLogs: (params = {}) => apiFetch('/logs?' + new URLSearchParams(params)),
  getTodayLog: () => apiFetch('/logs/today'),
  logOutfit: (data) => apiFetch('/logs', { method: 'POST', body: JSON.stringify(data) }),
  deleteLog: (id) => apiFetch(`/logs/${id}`, { method: 'DELETE' }),

  getStats: () => apiFetch('/stats'),

  getVapidKey: () => apiFetch('/notifications/vapid-public-key'),
  subscribe: (sub) => apiFetch('/notifications/subscribe', { method: 'POST', body: JSON.stringify({ subscription: sub }) }),
  unsubscribe: (endpoint) => apiFetch('/notifications/unsubscribe', { method: 'POST', body: JSON.stringify({ endpoint }) }),
};
