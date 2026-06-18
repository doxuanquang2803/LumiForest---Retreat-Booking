const API_BASE     = 'http://localhost:3000/api';
const BACKEND_BASE = 'http://localhost:3000';

const api = {
  get: function (endpoint) {
    return fetch(API_BASE + endpoint).then(function (r) { return r.json(); });
  },
  post: function (endpoint, data) {
    return fetch(API_BASE + endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(function (r) { return r.json(); });
  },

  // Gửi request kèm Authorization header, tự động refresh token khi hết hạn
  _authFetch: function (endpoint, options) {
    var self = this;
    var headers = Object.assign({ 'Content-Type': 'application/json' }, options.headers || {});
    var token = Auth.getToken();
    if (token) headers['Authorization'] = 'Bearer ' + token;

    return fetch(API_BASE + endpoint, Object.assign({}, options, { headers: headers }))
      .then(function (r) {
        if (r.status !== 401) return r.json();

        var refreshToken = Auth.getRefreshToken();
        if (!refreshToken) { Auth.logout(); return Promise.reject(new Error('Session expired')); }

        return self.post('/auth/refresh-token', { refreshToken: refreshToken })
          .then(function (res) {
            if (!res.success) { Auth.logout(); return Promise.reject(new Error('Session expired')); }
            Auth.saveTokens(res.accessToken, res.refreshToken);
            headers['Authorization'] = 'Bearer ' + res.accessToken;
            return fetch(API_BASE + endpoint, Object.assign({}, options, { headers: headers }))
              .then(function (r2) { return r2.json(); });
          });
      });
  },

  authGet: function (endpoint) {
    return this._authFetch(endpoint, { method: 'GET' });
  },
  authPost: function (endpoint, data) {
    return this._authFetch(endpoint, { method: 'POST', body: JSON.stringify(data) });
  },
  authPostFormData: function (endpoint, formData) {
    var self = this;
    var headers = {};
    var token = Auth.getToken();
    if (token) headers['Authorization'] = 'Bearer ' + token;

    return fetch(API_BASE + endpoint, { method: 'POST', headers: headers, body: formData })
      .then(function (r) {
        if (r.status !== 401) return r.json();
        var refreshToken = Auth.getRefreshToken();
        if (!refreshToken) { Auth.logout(); return Promise.reject(new Error('Session expired')); }

        return self.post('/auth/refresh-token', { refreshToken: refreshToken })
          .then(function (res) {
            if (!res.success) { Auth.logout(); return Promise.reject(new Error('Session expired')); }
            Auth.saveTokens(res.accessToken, res.refreshToken);
            headers['Authorization'] = 'Bearer ' + res.accessToken;
            return fetch(API_BASE + endpoint, { method: 'POST', headers: headers, body: formData })
              .then(function (r2) { return r2.json(); });
          });
      });
  },
  authPut: function (endpoint, data) {
    return this._authFetch(endpoint, { method: 'PUT', body: JSON.stringify(data) });
  },
  authDelete: function (endpoint) {
    return this._authFetch(endpoint, { method: 'DELETE' });
  },

  resolveUrl: function (url) {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
    if (url.startsWith('/uploads/')) return BACKEND_BASE + url;
    return url;
  },

  authGetBlob: function (endpoint) {
    var headers = {};
    var token = Auth.getToken();
    if (token) headers['Authorization'] = 'Bearer ' + token;
    return fetch(API_BASE + endpoint, { method: 'GET', headers: headers })
      .then(function (r) {
        if (!r.ok) throw new Error('Request failed: ' + r.status);
        return r.blob();
      });
  }
};
