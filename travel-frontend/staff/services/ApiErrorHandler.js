import { ToastManager } from '../components/ToastManager.js';
import { SessionManager } from './SessionManager.js';

export class ApiErrorHandler {
  static handleError(error, showToast = true) {
    // Ignore aborted requests
    if (error.name === 'AbortError') return;

    if (error.status === 401) {
      if (showToast) ToastManager.error('Session expired. Please log in again.');
      SessionManager.logout();
    } else if (error.status === 403) {
      if (showToast) ToastManager.error('You do not have permission to perform this action.');
    } else if (error.status >= 500) {
      if (showToast) ToastManager.error('Server error. Please try again later.');
    } else {
      if (showToast) ToastManager.error(error.message || 'An error occurred.');
    }
  }
}
