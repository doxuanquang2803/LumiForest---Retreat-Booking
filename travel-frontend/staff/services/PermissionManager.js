import { SessionManager } from './SessionManager.js';

export class PermissionManager {
  static getRole() {
    return SessionManager.getRole();
  }

  static isStaff() { return this.getRole() === 'STAFF'; }
  static isAdmin() { return this.getRole() === 'ADMIN'; }

  // Action-level permissions based on features.md
  static canDeleteHotel() { return this.isAdmin() || this.isStaff(); }
  static canDeleteRoom() { return this.isAdmin() || this.isStaff(); }
  static canDeleteApartment() { return this.isAdmin() || this.isStaff(); }
  static canDeleteTour() { return this.isAdmin() || this.isStaff(); }
  static canDeleteVoucher() { return this.isAdmin() || this.isStaff(); }
  static canDeleteBlog() { return this.isAdmin() || this.isStaff(); }
  static canDeleteContact() { return this.isAdmin() || this.isStaff(); }
  static canDeleteReview() { return this.isAdmin() || this.isStaff(); }
  static canDeleteBlogComment() { return this.isAdmin() || this.isStaff(); }

  static canRefundPayment() { return this.isAdmin(); }

  // Feature Flags
  static isFeatureEnabled(featureName) {
    const flags = {
      'advanced_filters': true,
      'image_compression': true,
      'blog_autosave': true
    };
    return !!flags[featureName];
  }
}
