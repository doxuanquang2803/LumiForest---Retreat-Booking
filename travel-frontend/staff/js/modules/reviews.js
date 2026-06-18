import { BaseApi } from '../../services/BaseApi.js';
import { CONFIG } from '../../services/config.js';
import { TableRender } from '../../components/TableRender.js';
import { ModalManager } from '../../components/ModalManager.js';
import { ToastManager } from '../../components/ToastManager.js';
import { PermissionManager } from '../../services/PermissionManager.js';
import { formatDate } from '../../utils/formatDate.js';
import { debounce } from '../../utils/debounce.js';

const t = (k) => (window.StaffI18N && window.StaffI18N.t(k)) || k;

class ReviewsModule {
  init() {
    this.tableRender = new TableRender({
      containerId: 'reviews-table',
      emptyMessage: () => t('staff.reviews.none'),
      columns: [
        { label: () => t('staff.col.id'), key: 'id' },
        { label: () => t('staff.col.user'), key: 'user', render: item => `<strong>${item.user?.name || item.user?.email || 'N/A'}</strong>` },
        { label: 'Target', key: 'target', render: item => {
            return `${item.targetType || 'N/A'} #${item.targetId || ''}`;
        }},
        { label: () => t('staff.col.rating'), key: 'rating', render: item => this.renderStars(item.rating) },
        { label: () => t('staff.col.content'), key: 'content', render: item => {
            const val = item.comment || item.content || '';
            return `<div class="text-truncate" style="max-width: 200px;" title="${val}">${val}</div>`;
        }},
        { label: () => t('staff.col.date'), key: 'createdAt', render: item => formatDate(item.createdAt, true) }
      ],
      actions: [
        { id: 'delete', label: () => t('staff.delete'), icon: 'bi-trash', class: 'btn-danger', show: () => PermissionManager.canDeleteReview() }
      ]
    });

    this.setupEvents();
    this.loadData();
  }

  renderStars(rating) {
    let html = '<span class="text-warning">';
    for (let i = 0; i < rating; i++) html += '<i class="bi bi-star-fill"></i>';
    for (let i = rating; i < 5; i++) html += '<i class="bi bi-star"></i>';
    html += '</span>';
    return html;
  }

  setupEvents() {
    const searchInput = document.getElementById('search-input');
    searchInput.addEventListener('input', debounce(() => {
      this.loadData();
    }, 500));

    document.getElementById('rating-filter').addEventListener('change', () => {
      this.loadData();
    });
  }

  async loadData() {
    this.tableRender.renderLoading();
    
    const search = document.getElementById('search-input').value;
    const rating = document.getElementById('rating-filter').value;
    
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (rating) params.append('rating', rating);
    
    try {
      const response = await BaseApi.get(`${CONFIG.ENDPOINTS.REVIEWS}?${params.toString()}`);
      const data = response.data || response || [];
      
      this.tableRender.renderData(Array.isArray(data) ? data : [], (action, item) => {
        if (action === 'delete') this.deleteReview(item);
      });
    } catch (error) {
      this.tableRender.renderData([]);
    }
  }

  deleteReview(item) {
    ModalManager.confirm(`Are you sure you want to delete this review from ${item.user?.name || 'this user'}?`, async () => {
      try {
        await BaseApi.delete(`${CONFIG.ENDPOINTS.REVIEWS}/${item.id}`);
        ToastManager.success('Review deleted successfully');
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

export default new ReviewsModule();
