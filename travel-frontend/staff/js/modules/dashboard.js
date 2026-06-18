import { BaseApi } from '../../services/BaseApi.js';
import { CONFIG } from '../../services/config.js';
import { TableRender } from '../../components/TableRender.js';
import { formatDate } from '../../utils/formatDate.js';
import { formatCurrency } from '../../utils/formatCurrency.js';
import { STATUS_MAPPINGS } from '../../utils/statusMappings.js';

const t = (k) => (window.StaffI18N && window.StaffI18N.t(k)) || k;

class DashboardModule {
  init() {
    this.tableRender = new TableRender({
      containerId: 'recent-bookings-table',
      emptyMessage: () => t('staff.dash.noBookings'),
      columns: [
        { label: () => t('staff.col.id'), key: 'id', render: item => `#${item.id}` },
        { label: () => t('staff.col.customer'), key: 'customer', render: item => item.user?.name || item.user?.email || 'Guest' },
        { label: () => t('staff.col.date'), key: 'createdAt', render: item => formatDate(item.createdAt, true) },
        { label: () => t('staff.col.amount'), key: 'totalPrice', render: item => formatCurrency(item.totalPrice) },
        { label: () => t('staff.col.status'), key: 'status', render: item => {
            let isExpired = false;
            let dateToCheck = null;
            if (item.checkOut) dateToCheck = item.checkOut;
            else if (item.checkout) dateToCheck = item.checkout;
            else if (item.bookingDate) dateToCheck = item.bookingDate;
            
            if (dateToCheck && new Date(dateToCheck).getTime() < new Date().getTime()) {
              isExpired = true;
            }

            if (item.status === 'cancelled' || item.status === 'CANCELLED') {
              return `<span class="badge bg-danger">Đã hủy</span>`;
            } else if (isExpired) {
              return `<span class="badge bg-secondary">Hết hiệu lực</span>`;
            } else {
              return `<span class="badge bg-success">Còn hiệu lực</span>`;
            }
        }}
      ]
    });
    
    this.loadStats();
    this.loadRecentBookings();
  }

  async loadStats() {
    try {
      // Try admin statistics endpoint first (admin role only)
      const statsRes = await BaseApi.get('/admin/statistics', { handleError: false }).catch(() => null);

      if (statsRes?.data) {
        const s = statsRes.data;
        document.getElementById('stat-bookings').textContent = s.totalBookings ?? 0;
        document.getElementById('stat-reviews').textContent = s.totalReviews ?? 0;
        document.getElementById('stat-contacts').textContent = s.totalContacts ?? 0;
        document.getElementById('stat-revenue').textContent = formatCurrency(s.totalRevenue ?? 0);
        return;
      }

      // Fallback for staff role: individual calls
      const [bookingsRes, contactsRes] = await Promise.all([
        BaseApi.get(`${CONFIG.ENDPOINTS.BOOKINGS.HOTEL}?limit=1`, { handleError: false }).catch(() => null),
        BaseApi.get(`${CONFIG.ENDPOINTS.CONTACT}?limit=1`, { handleError: false }).catch(() => null),
      ]);

      document.getElementById('stat-bookings').textContent = bookingsRes?.pagination?.total ?? 0;
      document.getElementById('stat-reviews').textContent = '—';
      document.getElementById('stat-contacts').textContent = contactsRes?.pagination?.totalItems ?? 0;
      document.getElementById('stat-revenue').textContent = '—';
    } catch (error) {
      console.warn('Could not load some statistics');
    }
  }

  async loadRecentBookings() {
    this.tableRender.renderLoading(5);
    try {
      const response = await BaseApi.get(`${CONFIG.ENDPOINTS.BOOKINGS.HOTEL}?limit=5`, { handleError: false });
      const data = response.data || response.bookings || response.items || response || [];
      this.tableRender.renderData(Array.isArray(data) ? data : []);
    } catch (error) {
      this.tableRender.renderData([]);
    }
  }

  destroy() {
    // cleanup if needed
  }
}

export default new DashboardModule();
