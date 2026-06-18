import { ToastManager } from '../components/ToastManager.js';
import { CONFIG } from './config.js';

export class SessionManager {
  static getToken() {
    return localStorage.getItem('token');
  }

  static getRefreshToken() {
    return localStorage.getItem('refreshToken');
  }

  static getUser() {
    const userStr = localStorage.getItem('user');
    try {
      return userStr ? JSON.parse(userStr) : null;
    } catch (e) {
      return null;
    }
  }

  static getRole() {
    const user = this.getUser();
    return user ? user.role : null;
  }

  static isLoggedIn() {
    return !!this.getToken();
  }

  static save(accessToken, user) {
    localStorage.setItem('token', accessToken);
    localStorage.setItem('user', JSON.stringify(user));
  }

  static saveTokens(accessToken, refreshToken) {
    localStorage.setItem('token', accessToken);
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    }
  }

  static logout(redirect = true) {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    if (this.expirationTimer) clearTimeout(this.expirationTimer);
    if (redirect) {
      window.location.replace('../index.html');
    }
  }

  static validateAccess() {
    if (!this.isLoggedIn()) {
      this.logout();
      return false;
    }
    
    const role = this.getRole();
    if (role !== 'STAFF' && role !== 'ADMIN') {
      this.logout();
      return false;
    }
    
    this.setupExpirationWarning();
    return true;
  }

  static parseJwt(token) {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (e) {
      return null;
    }
  }

  static setupExpirationWarning() {
    const token = this.getToken();
    if (!token) return;

    const decoded = this.parseJwt(token);
    if (!decoded || !decoded.exp) return;

    // exp is in seconds
    const expTimeMs = decoded.exp * 1000;
    const currentTimeMs = Date.now();
    const warningTimeMs = expTimeMs - (2 * 60 * 1000); // 2 minutes before

    if (this.expirationTimer) clearTimeout(this.expirationTimer);

    if (warningTimeMs > currentTimeMs) {
      this.expirationTimer = setTimeout(() => {
        ToastManager.warning('Your session will expire in 2 minutes. Please save your work.', 10000);
      }, warningTimeMs - currentTimeMs);
    }
  }
}
