import { BaseApi } from '../../services/BaseApi.js';
import { CONFIG } from '../../services/config.js';
import { TableRender } from '../../components/TableRender.js';
import { ModalManager } from '../../components/ModalManager.js';
import { ToastManager } from '../../components/ToastManager.js';
import { PermissionManager } from '../../services/PermissionManager.js';
import { formatCurrency } from '../../utils/formatCurrency.js';
import { formatDate } from '../../utils/formatDate.js';
import { STATUS_MAPPINGS } from '../../utils/statusMappings.js';
import { debounce } from '../../utils/debounce.js';

const t = (k) => (window.StaffI18N && window.StaffI18N.t(k)) || k;

class PaymentsModule {
  init() {
    this.tableRender = new TableRender({
      containerId: 'payments-table',
      emptyMessage: () => t('staff.payments.none'),
      columns: [
        { label: () => `${t('staff.col.id')} (${t('staff.payments.title').split(' ')[0]})`, key: 'id', render: item => `#${item.id}` },
        { label: () => `Booking ID`, key: 'bookingId', render: item => `#${item.bookingId}` },
        { label: () => t('staff.col.user'), key: 'user', render: item => item.user?.email || 'N/A' },
        { label: () => t('staff.col.date'), key: 'createdAt', render: item => formatDate(item.createdAt, true) },
        { label: () => t('staff.col.amount'), key: 'amount', render: item => formatCurrency(item.amount) },
        { label: () => t('staff.col.status'), key: 'status', render: item => {
            const statusKey = (item.status || '').toUpperCase();
            const map = STATUS_MAPPINGS.PAYMENT[statusKey] || { label: item.status, badgeType: 'bg-secondary' };
            return `<span class="badge ${map.badgeType}">${map.label}</span>`;
        }}
      ],
      actions: [
        { id: 'refund', label: 'Refund', icon: 'bi-arrow-return-left', class: 'btn-warning', show: (item) => (item.status || '').toUpperCase() === 'COMPLETED' && PermissionManager.canRefundPayment() }
      ]
    });

    this.setupEvents();
    this.loadData();
  }

  setupEvents() {
    const searchInput = document.getElementById('search-input');
    searchInput.addEventListener('input', debounce(() => {
      this.loadData();
    }, 500));

    document.getElementById('status-filter').addEventListener('change', () => {
      this.loadData();
    });
  }

  async loadData() {
    this.tableRender.renderLoading();
    
    const search = document.getElementById('search-input').value;
    const status = document.getElementById('status-filter').value;
    
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (status) params.append('status', status);
    
    try {
      const response = await BaseApi.get(`${CONFIG.ENDPOINTS.PAYMENTS}/history?${params.toString()}`);
      const data = response.data || response || [];
      
      this.tableRender.renderData(Array.isArray(data) ? data : [], (action, item) => {
        if (action === 'refund') this.refundPayment(item);
      });
    } catch (error) {
      this.tableRender.renderData([]);
    }
  }

  refundPayment(item) {
    ModalManager.confirm(`Are you sure you want to refund payment #${item.id}? This action cannot be undone.`, async () => {
      try {
        await BaseApi.put(`${CONFIG.ENDPOINTS.PAYMENTS}/${item.id}/refund`);
        ToastManager.success('Payment refunded successfully');
        this.loadData();
      } catch (error) {
        console.error(error);
      }
    });
  }

  destroy() {
    // cleanup
  }
}

export default new PaymentsModule();
