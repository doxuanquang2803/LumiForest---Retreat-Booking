const API_BASE_URL = 'http://localhost:3000/api';

const api = {
  // Helper to get headers with Authorization token
  getHeaders: () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
  },

  // Generic request handler
  request: async (endpoint, method = 'GET', body = null) => {
    try {
      const options = {
        method,
        headers: api.getHeaders(),
      };
      
      if (body) {
        options.body = JSON.stringify(body);
      }

      const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        // Handle 401 Unauthorized globally
        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          const path = window.location.pathname;
          if (path.includes('/admin-dashboard/pages/')) {
            window.location.replace('../../index.html');
          } else {
            window.location.replace('../index.html');
          }
        }
        throw new Error(data.message || 'Something went wrong');
      }

      return data;
    } catch (error) {
      console.error(`API Error (${method} ${endpoint}):`, error.message);
      throw error;
    }
  },

  get: (endpoint) => api.request(endpoint, 'GET'),
  post: (endpoint, body) => api.request(endpoint, 'POST', body),
  put: (endpoint, body) => api.request(endpoint, 'PUT', body),
  delete: (endpoint) => api.request(endpoint, 'DELETE'),
  resolveUrl: (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
    if (url.startsWith('/uploads/')) return 'http://localhost:3000' + url;
    if (url.startsWith('assets/')) return '../../' + url;
    return url;
  },
};
