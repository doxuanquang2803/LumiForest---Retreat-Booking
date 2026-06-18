import { BaseApi } from '../../services/BaseApi.js';
import { CONFIG } from '../../services/config.js';
import { TableRender } from '../../components/TableRender.js';
import { ModalManager } from '../../components/ModalManager.js';
import { ToastManager } from '../../components/ToastManager.js';
import { PermissionManager } from '../../services/PermissionManager.js';
import { ImageUpload } from '../../components/ImageUpload.js';
import { debounce } from '../../utils/debounce.js';

const t = (k) => (window.StaffI18N && window.StaffI18N.t(k)) || k;
const tf = (k, p) => (window.StaffI18N && window.StaffI18N.tf(k, p)) || k;

class HotelsModule {
  constructor() {
    this.modal = null;
    this.imageUpload = null;
    this.currentHotelId = null;
  }

  init() {
    this.modal = new bootstrap.Modal(document.getElementById('hotelModal'));
    
    this.imageUpload = new ImageUpload({
      containerId: 'image-upload-container',
      multiple: true,
      maxSizeMB: 5
    });

    this.tableRender = new TableRender({
      containerId: 'hotels-table',
      emptyMessage: () => t('staff.hotels.none'),
      columns: [
        { label: () => t('staff.col.id'), key: 'id' },
        { label: () => t('staff.col.hotelName'), key: 'name', render: item => `<strong>${item.name}</strong><br><small class="text-muted">${item.location || ''}</small>` },
        { label: () => t('staff.col.address'), key: 'address' },
        { label: () => t('staff.col.stars'), key: 'starRating', render: item => this.renderStars(item.starRating) }
      ],
      actions: [
        { id: 'edit', label: () => t('staff.edit'), icon: 'bi-pencil', class: 'btn-light' },
        { id: 'delete', label: () => t('staff.delete'), icon: 'bi-trash', class: 'btn-danger', show: () => PermissionManager.canDeleteHotel() }
      ]
    });

    this.setupEvents();
    this.loadData();
  }

  renderStars(rating) {
    let html = '<span class="text-warning">';
    for (let i = 0; i < rating; i++) html += '<i class="bi bi-star-fill"></i>';
    html += '</span>';
    return html;
  }

  setupEvents() {
    document.getElementById('btn-add-hotel').addEventListener('click', () => {
      this.currentHotelId = null;
      document.getElementById('hotel-form').reset();
      this.imageUpload.clear();
      document.getElementById('hotelModalLabel').textContent = t('staff.hotels.addModal');
      this.modal.show();
    });

    const searchInput = document.getElementById('search-input');
    searchInput.addEventListener('input', debounce(() => {
      this.loadData({ search: searchInput.value });
    }, 500));

    document.getElementById('btn-save-hotel').addEventListener('click', () => {
      const form = document.getElementById('hotel-form');
      if (form && !form.reportValidity()) return;
      this.saveHotel();
    });
  }

  async loadData(params = {}) {
    this.tableRender.renderLoading();
    try {
      const query = new URLSearchParams(params).toString();
      const response = await BaseApi.get(`${CONFIG.ENDPOINTS.HOTELS}?${query}`);
      const data = response.data || response || [];
      
      this.tableRender.renderData(data, (action, item) => {
        if (action === 'edit') this.editHotel(item);
        if (action === 'delete') this.deleteHotel(item);
      });
    } catch (error) {
      this.tableRender.renderData([]);
    }
  }

  editHotel(item) {
    this.currentHotelId = item.id;
    document.getElementById('hotel-name').value = item.name || '';
    document.getElementById('hotel-address').value = item.address || '';
    document.getElementById('hotel-city').value = item.location || '';
    document.getElementById('hotel-star').value = item.starRating || 5;
    document.getElementById('hotel-desc').value = item.description || '';
    
    this.imageUpload.clear();
    
    if (item.images && Array.isArray(item.images)) {
      this.imageUpload.setExistingImages(item.images);
    } else {
      this.imageUpload.setExistingImages([]);
    }
    
    document.getElementById('hotelModalLabel').textContent = t('staff.hotels.editModal');
    this.modal.show();
  }

  async saveHotel() {
    const name = document.getElementById('hotel-name').value;
    const address = document.getElementById('hotel-address').value;
    const location = document.getElementById('hotel-city').value;
    const starRating = parseInt(document.getElementById('hotel-star').value, 10);
    const description = document.getElementById('hotel-desc').value;

    if (!name || !address || !location || !starRating) {
      ToastManager.error(t('staff.required'));
      return;
    }

    const slug = name.toString().toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '').replace(/\-\-+/g, '-').replace(/^-+/, '').replace(/-+$/, '') + '-' + Date.now();

    const data = {
      name,
      slug,
      address,
      location,
      starRating,
      description: description || 'No description provided',
      price: 1
    };
    
    // Always set placeholder if creating new to pass validation
    const files = this.imageUpload.getFiles();
    if (!this.currentHotelId) {
      data.thumbnail = 'https://placehold.co/600x400?text=Hotel';
    }

    const btn = document.getElementById('btn-save-hotel');
    const originalText = btn.innerHTML;
    btn.innerHTML = `<span class="spinner-border spinner-border-sm"></span> ${t('staff.saving')}`;
    btn.disabled = true;

    try {
      let savedHotel;
      if (this.currentHotelId) {
        savedHotel = await BaseApi.put(`${CONFIG.ENDPOINTS.HOTELS}/${this.currentHotelId}`, data);
        ToastManager.success(t('staff.hotels.savedOk'));
      } else {
        savedHotel = await BaseApi.post(`${CONFIG.ENDPOINTS.HOTELS}`, data);
        ToastManager.success(t('staff.hotels.createdOk'));
      }
      
      // Upload images if any
      const files = this.imageUpload.getFiles();
      if (files.length > 0) {
          const targetId = this.currentHotelId || (savedHotel && savedHotel.data && savedHotel.data.id) || (savedHotel && savedHotel.id);
          if (targetId) {
            const hasExisting = this.imageUpload.getExistingImages().length > 0;
            for (let i = 0; i < files.length; i++) {
              const formData = new FormData();
              formData.append('hotelId', targetId);
              formData.append('type', (i === 0 && !hasExisting) ? 'thumbnail' : 'gallery');
              formData.append('image', files[i]);
              await BaseApi.post(CONFIG.ENDPOINTS.HOTEL_IMAGES, formData);
            }
          }
      }
      
      // Handle deleted existing images
      const deletedIds = this.imageUpload.getDeletedImageIds();
      for (const imgId of deletedIds) {
        if (imgId) {
          try {
            await BaseApi.delete(`${CONFIG.ENDPOINTS.HOTEL_IMAGES}/${imgId}`);
          } catch(e) { console.error('Failed to delete image', e); }
        }
      }

      this.modal.hide();
      this.loadData();
    } catch (error) {
      console.error(error);
      ToastManager.error(error.message || t('staff.hotels.saveFail'));
    } finally {
      btn.innerHTML = originalText;
      btn.disabled = false;
    }
  }

  deleteHotel(item) {
    ModalManager.confirm(tf('staff.hotels.confirmDelete', { name: item.name }), async () => {
      try {
        await BaseApi.delete(`${CONFIG.ENDPOINTS.HOTELS}/${item.id}`);
        ToastManager.success(t('staff.hotels.deletedOk'));
        this.loadData();
      } catch (error) {
        console.error(error);
      }
    });
  }

  destroy() {
    if (this.modal) {
        this.modal.dispose();
    }
  }
}

export default new HotelsModule();
