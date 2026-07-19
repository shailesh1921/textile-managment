export const api = {
  setToken: (token) => {
    localStorage.setItem('textile_token', token);
  },
  getToken: () => {
    return localStorage.getItem('textile_token');
  },
  setUser: (user) => {
    localStorage.setItem('textile_user', JSON.stringify(user));
  },
  getUser: () => {
    const user = localStorage.getItem('textile_user');
    return user ? JSON.parse(user) : null;
  },
  logout: () => {
    localStorage.removeItem('textile_token');
    localStorage.removeItem('textile_user');
  },
  request: async (method, path, body) => {
    const token = api.getToken();
    const headers = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const apiBase = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://textile-managment.onrender.com' : '');
    const url = path.startsWith('http') ? path : `${apiBase}${path}`;
    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'Network request failure' }));
      throw new Error(err.error || 'Server error occurred');
    }
    return response.json();
  },
  get: (path) => api.request('GET', path),
  post: (path, body) => api.request('POST', path, body),
  put: (path, body) => api.request('PUT', path, body),
  delete: (path) => api.request('DELETE', path),
};
