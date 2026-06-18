import { CONFIG } from './config.js';
import { SessionManager } from './SessionManager.js';
import { ApiErrorHandler } from './ApiErrorHandler.js';

export class BaseApi {
  static abortControllers = {};

  static async fetch(endpoint, options = {}, retries = 1, requestId = null) {
    if (requestId) {
      if (this.abortControllers[requestId]) {
        this.abortControllers[requestId].abort();
      }
      this.abortControllers[requestId] = new AbortController();
      options.signal = this.abortControllers[requestId].signal;
    }

    const headers = {
      ...options.headers
    };
    
    if (!(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
    }

    const token = SessionManager.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const url = `${CONFIG.API_BASE}${endpoint}`;
    
    try {
      const response = await fetch(url, { ...options, headers });
      
      if (response.status === 401) {
        // try refresh token
        const refreshToken = SessionManager.getRefreshToken();
        if (!refreshToken) {
          const err = new Error('Session expired');
          err.status = 401;
          throw err;
        }

        const refreshRes = await fetch(`${CONFIG.API_BASE}${CONFIG.ENDPOINTS.AUTH.REFRESH}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken })
        });

        if (!refreshRes.ok) {
          const err = new Error('Session expired');
          err.status = 401;
          throw err;
        }

        const refreshData = await refreshRes.json();
        SessionManager.saveTokens(refreshData.accessToken, refreshData.refreshToken);
        
        // Retry original request
        headers['Authorization'] = `Bearer ${refreshData.accessToken}`;
        const retryResponse = await fetch(url, { ...options, headers });
        if (!retryResponse.ok) {
           return this.handleErrorResponse(retryResponse);
        }
        return retryResponse.json();
      }

      if (!response.ok) {
         return this.handleErrorResponse(response);
      }
      return response.json();
    } catch (error) {
      if (error.name === 'AbortError') {
        throw error; // Let the caller handle or ignore
      }
      if (retries > 0 && this.isRetryableError(error)) {
        await new Promise(r => setTimeout(r, 1000));
        return this.fetch(endpoint, options, retries - 1, requestId);
      }
      if (options.handleError !== false) {
        ApiErrorHandler.handleError(error);
      }
      throw error;
    }
  }

  static async handleErrorResponse(response) {
      let msg = 'An error occurred';
      try {
          const data = await response.json();
          msg = data.message || msg;
          // Include field-level validation errors if present
          if (data.errors && Array.isArray(data.errors) && data.errors.length > 0) {
            const details = data.errors.map(e => `${e.field}: ${e.message}`).join('; ');
            msg = `${msg} — ${details}`;
          }
      } catch (e) {}
      const err = new Error(msg);
      err.status = response.status;
      throw err;
  }

  static isRetryableError(error) {
      // Retry on network failure (TypeError from fetch) or 5xx status
      return error instanceof TypeError || error.status >= 500;
  }

  static get(endpoint, options = {}, requestId = null) {
      return this.fetch(endpoint, { ...options, method: 'GET' }, options.retries || 1, requestId);
  }
  static post(endpoint, data, options = {}) {
      const reqOptions = { ...options, method: 'POST' };
      if (!(data instanceof FormData)) {
          reqOptions.body = JSON.stringify(data);
      } else {
          reqOptions.body = data;
      }
      return this.fetch(endpoint, reqOptions, options.retries || 0);
  }
  static put(endpoint, data, options = {}) {
      const reqOptions = { ...options, method: 'PUT' };
      if (!(data instanceof FormData)) {
          reqOptions.body = JSON.stringify(data);
      } else {
          reqOptions.body = data;
      }
      return this.fetch(endpoint, reqOptions, options.retries || 0);
  }
  static delete(endpoint, options = {}) {
      return this.fetch(endpoint, { ...options, method: 'DELETE' }, options.retries || 0);
  }
}
