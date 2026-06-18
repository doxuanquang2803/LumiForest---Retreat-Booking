import { BaseApi } from '../../services/BaseApi.js';
import { CONFIG } from '../../services/config.js';
import { TableRender } from '../../components/TableRender.js';
import { ModalManager } from '../../components/ModalManager.js';
import { ToastManager } from '../../components/ToastManager.js';
import { PermissionManager } from '../../services/PermissionManager.js';
import { ImageUpload } from '../../components/ImageUpload.js';
import { formatCurrency } from '../../utils/formatCurrency.js';
import { debounce } from '../../utils/debounce.js';

const t = (k) => (window.StaffI18N && window.StaffI18N.t(k)) || k;
const tf = (k, p) => (window.StaffI18N && window.StaffI18N.tf(k, p)) || k;

class ApartmentsModule {
  constructor() {
    this.modal = null;
    this.imageUpload = null;
    this.currentAptId = null;
  }

  init() {
    this.modal = new bootstrap.Modal(document.getElementById('aptModal'));
    
    this.imageUpload = new ImageUpload({
      containerId: 'image-upload-container',
      multiple: true,
      maxSizeMB: 5
    });

    this.tableRender = new TableRender({
      containerId: 'apartments-table',
      emptyMessage: () => t('staff.apts.none'),
      columns: [
        { label: () => t('staff.col.id'), key: 'id' },
        { label: () => t('staff.col.name'), key: 'title', render: item => `<strong>${item.title}</strong><br><small class="text-muted">${item.location || ''}</small>` },
        { label: () => t('staff.col.address'), key: 'address' },
        { label: () => t('staff.col.price'), key: 'price', render: item => formatCurrency(item.price) },
        { label: () => t('staff.col.capacity'), key: 'maxGuests', render: item => `${item.maxGuests} guests` }
      ],
      actions: [
        { id: 'edit', label: () => t('staff.edit'), icon: 'bi-pencil', class: 'btn-light' },
        { id: 'delete', label: () => t('staff.delete'), icon: 'bi-trash', class: 'btn-danger', show: () => PermissionManager.canDeleteApartment() }
      ]
    });

    this.setupEvents();
    this.loadData();
  }

  setupEvents() {
    document.getElementById('btn-add-apt').addEventListener('click', () => {
      this.currentAptId = null;
      document.getElementById('apt-form').reset();
      this.imageUpload.clear();
      document.getElementById('aptModalLabel').textContent = t('staff.apts.addModal');
      this.modal.show();
    });

    const searchInput = document.getElementById('search-input');
    searchInput.addEventListener('input', debounce(() => {
      this.loadData({ search: searchInput.value });
    }, 500));

    document.getElementById('btn-save-apt').addEventListener('click', () => {
      const form = document.getElementById('apt-form');
      if (form && !form.reportValidity()) return;
      this.saveApt();
    });
  }

  async loadData(params = {}) {
    this.tableRender.renderLoading();
    try {
      const query = new URLSearchParams(params).toString();
      const response = await BaseApi.get(`${CONFIG.ENDPOINTS.APARTMENTS}?${query}`);
      const data = response.data || response || [];
      
      this.tableRender.renderData(data, (action, item) => {
        if (action === 'edit') this.editApt(item);
        if (action === 'delete') this.deleteApt(item);
      });
    } catch (error) {
      this.tableRender.renderData([]);
    }
  }

  editApt(item) {
    this.currentAptId = item.id;
    document.getElementById('apt-name').value = item.title || '';
    document.getElementById('apt-address').value = item.address || '';
    document.getElementById('apt-city').value = item.location || '';
    document.getElementById('apt-price').value = item.price || 0;
    document.getElementById('apt-capacity').value = item.maxGuests || 1;
    document.getElementById('apt-desc').value = item.description || '';
    
    this.imageUpload.clear();
    
    if (item.images && Array.isArray(item.images)) {
      this.imageUpload.setExistingImages(item.images);
    } else {
      this.imageUpload.setExistingImages([]);
    }
    
    document.getElementById('aptModalLabel').textContent = t('staff.apts.editModal');
    this.modal.show();
  }

  async saveApt() {
    const title = document.getElementById('apt-name').value;
    const address = document.getElementById('apt-address').value;
    const location = document.getElementById('apt-city').value;
    const price = parseFloat(document.getElementById('apt-price').value);
    const maxGuests = parseInt(document.getElementById('apt-capacity').value, 10);
    const description = document.getElementById('apt-desc').value;

    if (!title || !address || !location || isNaN(price) || price <= 0 || isNaN(maxGuests) || maxGuests <= 0) {
      ToastManager.error(t('staff.required'));
      return;
    }

    const data = {
      title,
      address,
      location,
      price,
      maxGuests,
      bedrooms: 1,
      bathrooms: 1,
      description: description || 'No description provided'
    };
    
    // Always set placeholder if creating new to pass validation
    const files = this.imageUpload.getFiles();
    if (!this.currentAptId) {
      data.thumbnail = 'https://placehold.co/600x400?text=Apartment';
    }

    const btn = document.getElementById('btn-save-apt');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Saving...';
    btn.disabled = true;

    try {
      let savedApt;
      if (this.currentAptId) {
        savedApt = await BaseApi.put(`${CONFIG.ENDPOINTS.APARTMENTS}/${this.currentAptId}`, data);
        ToastManager.success(t('staff.apts.savedOk'));
      } else {
        savedApt = await BaseApi.post(`${CONFIG.ENDPOINTS.APARTMENTS}`, data);
        ToastManager.success(t('staff.apts.createdOk'));
      }
      
      const files = this.imageUpload.getFiles();
      if (files.length > 0) {
          const targetId = this.currentAptId || (savedApt && savedApt.data && savedApt.data.id) || (savedApt && savedApt.id);
          if (targetId) {
            const hasExisting = this.imageUpload.getExistingImages().length > 0;
            for (let i = 0; i < files.length; i++) {
              const formData = new FormData();
              formData.append('apartmentId', targetId);
              formData.append('type', (i === 0 && !hasExisting) ? 'thumbnail' : 'gallery');
              formData.append('image', files[i]);
              await BaseApi.post(CONFIG.ENDPOINTS.APARTMENT_IMAGES, formData);
            }
          }
      }
      
      // Handle deleted existing images
      const deletedIds = this.imageUpload.getDeletedImageIds();
      for (const imgId of deletedIds) {
        if (imgId) {
          try {
            await BaseApi.delete(`${CONFIG.ENDPOINTS.APARTMENT_IMAGES}/${imgId}`);
          } catch(e) { console.error('Failed to delete image', e); }
        }
      }

      this.modal.hide();
      this.loadData();
    } catch (error) {
      console.error(error);
      ToastManager.error(error.message || t('staff.apts.saveFail'));
    } finally {
      btn.innerHTML = originalText;
      btn.disabled = false;
    }
  }

  deleteApt(item) {
    ModalManager.confirm(`Are you sure you want to delete ${item.title}?`, async () => {
      try {
        await BaseApi.delete(`${CONFIG.ENDPOINTS.APARTMENTS}/${item.id}`);
        ToastManager.success(t('staff.apts.deletedOk'));
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

export default new ApartmentsModule();
