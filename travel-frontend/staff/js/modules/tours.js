import { BaseApi } from '../../services/BaseApi.js';
import { CONFIG } from '../../services/config.js';
import { TableRender } from '../../components/TableRender.js';
import { ModalManager } from '../../components/ModalManager.js';
import { ToastManager } from '../../components/ToastManager.js';
import { PermissionManager } from '../../services/PermissionManager.js';
import { ImageUpload } from '../../components/ImageUpload.js';
import { formatCurrency } from '../../utils/formatCurrency.js';
import { formatDate } from '../../utils/formatDate.js';
import { debounce } from '../../utils/debounce.js';

const t = (k) => (window.StaffI18N && window.StaffI18N.t(k)) || k;
const tf = (k, p) => (window.StaffI18N && window.StaffI18N.tf(k, p)) || k;

class ToursModule {
  constructor() {
    this.modal = null;
    this.imageUpload = null;
    this.currentTourId = null;
  }

  init() {
    this.modal = new bootstrap.Modal(document.getElementById('tourModal'));
    
    this.imageUpload = new ImageUpload({
      containerId: 'image-upload-container',
      multiple: true,
      maxSizeMB: 5
    });

    this.tableRender = new TableRender({
      containerId: 'tours-table',
      emptyMessage: () => t('staff.tours.none'),
      columns: [
        { label: () => t('staff.col.id'), key: 'id' },
        { label: () => t('staff.col.name'), key: 'title', render: item => `<strong>${item.title}</strong><br><small class="text-muted">${item.location || ''}</small>` },
        { label: () => t('staff.col.duration'), key: 'duration', render: item => item.duration },
        { label: () => t('staff.col.capacity'), key: 'maxGuests' },
        { label: () => t('staff.col.price'), key: 'price', render: item => formatCurrency(item.price) }
      ],
      actions: [
        { id: 'edit', label: () => t('staff.edit'), icon: 'bi-pencil', class: 'btn-light' },
        { id: 'delete', label: () => t('staff.delete'), icon: 'bi-trash', class: 'btn-danger', show: () => PermissionManager.canDeleteTour() }
      ]
    });

    this.setupEvents();
    this.loadData();
  }

  setupEvents() {
    document.getElementById('btn-add-tour').addEventListener('click', () => {
      this.currentTourId = null;
      document.getElementById('tour-form').reset();
      this.imageUpload.clear();
      document.getElementById('tourModalLabel').textContent = t('staff.tours.addModal');
      this.modal.show();
    });

    const searchInput = document.getElementById('search-input');
    searchInput.addEventListener('input', debounce(() => {
      this.loadData({ search: searchInput.value });
    }, 500));

    document.getElementById('btn-save-tour').addEventListener('click', () => {
      const form = document.getElementById('tour-form');
      if (form && !form.reportValidity()) return;
      this.saveTour();
    });
  }

  async loadData(params = {}) {
    this.tableRender.renderLoading();
    try {
      const query = new URLSearchParams(params).toString();
      const response = await BaseApi.get(`${CONFIG.ENDPOINTS.TOURS}?${query}`);
      const data = response.data || response || [];
      
      this.tableRender.renderData(data, (action, item) => {
        if (action === 'edit') this.editTour(item);
        if (action === 'delete') this.deleteTour(item);
      });
    } catch (error) {
      this.tableRender.renderData([]);
    }
  }

  editTour(item) {
    this.currentTourId = item.id;
    document.getElementById('tour-name').value = item.title || '';
    document.getElementById('tour-destination').value = item.location || '';
    document.getElementById('tour-price').value = item.price || 0;
    document.getElementById('tour-duration').value = item.duration || '';
    if (item.createdAt) {
      document.getElementById('tour-date').value = new Date(item.createdAt).toISOString().split('T')[0];
    }
    document.getElementById('tour-desc').value = item.description || '';
    
    this.imageUpload.clear();
    
    if (item.images && Array.isArray(item.images)) {
      this.imageUpload.setExistingImages(item.images);
    } else {
      this.imageUpload.setExistingImages([]);
    }
    
    document.getElementById('tourModalLabel').textContent = t('staff.tours.editModal');
    this.modal.show();
  }

  async saveTour() {
    const title = document.getElementById('tour-name').value;
    const location = document.getElementById('tour-destination').value;
    const price = parseFloat(document.getElementById('tour-price').value);
    const duration = document.getElementById('tour-duration').value;
    const description = document.getElementById('tour-desc').value;

    if (!title || !location || isNaN(price) || !duration) {
      ToastManager.error(t('staff.required'));
      return;
    }

    const slug = title.toString().toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '').replace(/\-\-+/g, '-').replace(/^-+/, '').replace(/-+$/, '') + '-' + Date.now();

    const data = {
      title,
      slug,
      location,
      price,
      duration: String(duration),
      maxGuests: 20,
      description: description || 'No description provided'
    };
    
    // Always set placeholder if creating new to pass validation
    const files = this.imageUpload.getFiles();
    if (!this.currentTourId) {
      data.thumbnail = 'https://placehold.co/600x400?text=Tour';
    }

    const btn = document.getElementById('btn-save-tour');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Saving...';
    btn.disabled = true;

    try {
      let savedTour;
      if (this.currentTourId) {
        savedTour = await BaseApi.put(`${CONFIG.ENDPOINTS.TOURS}/${this.currentTourId}`, data);
        ToastManager.success(t('staff.tours.savedOk'));
      } else {
        savedTour = await BaseApi.post(`${CONFIG.ENDPOINTS.TOURS}`, data);
        ToastManager.success(t('staff.tours.createdOk'));
      }
      
      const files = this.imageUpload.getFiles();
      if (files.length > 0) {
          const targetId = this.currentTourId || (savedTour && savedTour.data && savedTour.data.id) || (savedTour && savedTour.id);
          if (targetId) {
            const hasExisting = this.imageUpload.getExistingImages().length > 0;
            for (let i = 0; i < files.length; i++) {
              const formData = new FormData();
              formData.append('tourId', targetId);
              formData.append('type', (i === 0 && !hasExisting) ? 'thumbnail' : 'gallery');
              formData.append('image', files[i]);
              await BaseApi.post(CONFIG.ENDPOINTS.TOUR_IMAGES, formData);
            }
          }
      }
      
      // Handle deleted existing images
      const deletedIds = this.imageUpload.getDeletedImageIds();
      for (const imgId of deletedIds) {
        if (imgId) {
          try {
            await BaseApi.delete(`${CONFIG.ENDPOINTS.TOUR_IMAGES}/${imgId}`);
          } catch(e) { console.error('Failed to delete image', e); }
        }
      }

      this.modal.hide();
      this.loadData();
    } catch (error) {
      console.error(error);
      ToastManager.error(error.message || t('staff.tours.saveFail'));
    } finally {
      btn.innerHTML = originalText;
      btn.disabled = false;
    }
  }

  deleteTour(item) {
    ModalManager.confirm(`Are you sure you want to delete ${item.title}?`, async () => {
      try {
        await BaseApi.delete(`${CONFIG.ENDPOINTS.TOURS}/${item.id}`);
        ToastManager.success(t('staff.tours.deletedOk'));
        this.loadData();
      } catch (error) {
        console.error(error);
      }
    });
  }

  destroy() {
    if (this.modal) this.modal.dispose();
  }
}

export default new ToursModule();

