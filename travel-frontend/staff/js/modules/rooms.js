import { BaseApi } from '../../services/BaseApi.js';
import { CONFIG } from '../../services/config.js';
import { TableRender } from '../../components/TableRender.js';
import { ModalManager } from '../../components/ModalManager.js';
import { ToastManager } from '../../components/ToastManager.js';
import { PermissionManager } from '../../services/PermissionManager.js';
import { ImageUpload } from '../../components/ImageUpload.js';
import { formatCurrency } from '../../utils/formatCurrency.js';

const t = (k) => (window.StaffI18N && window.StaffI18N.t(k)) || k;
const tf = (k, p) => (window.StaffI18N && window.StaffI18N.tf(k, p)) || k;

class RoomsModule {
  constructor() {
    this.modal = null;
    this.imageUpload = null;
    this.currentRoomId = null;
    this.hotels = [];
  }

  async init() {
    this.modal = new bootstrap.Modal(document.getElementById('roomModal'));
    
    this.imageUpload = new ImageUpload({
      containerId: 'image-upload-container',
      multiple: true,
      maxSizeMB: 5
    });

    this.tableRender = new TableRender({
      containerId: 'rooms-table',
      emptyMessage: () => t('staff.rooms.none'),
      columns: [
        { label: () => t('staff.col.id'), key: 'id' },
        { label: () => t('staff.col.hotelName'), key: 'hotelId', render: item => this.getHotelName(item.hotelId) },
        { label: () => t('staff.col.type'), key: 'type', render: item => `<strong>${item.type}</strong><br><small class="text-muted">Max: ${item.maxGuests || item.capacity} guests</small>` },
        { label: () => t('staff.col.price'), key: 'price', render: item => formatCurrency(item.price) },
        { label: () => t('staff.col.status'), key: 'status', render: item => `<span class="badge ${item.status === 'available' ? 'bg-success' : 'bg-secondary'}">${item.status || 'available'}</span>` }
      ],
      actions: [
        { id: 'edit', label: () => t('staff.edit'), icon: 'bi-pencil', class: 'btn-light' },
        { id: 'delete', label: () => t('staff.delete'), icon: 'bi-trash', class: 'btn-danger', show: () => PermissionManager.canDeleteRoom() }
      ]
    });

    await this.loadHotels();
    this.setupEvents();
    this.loadData();
  }

  async loadHotels() {
    try {
      const response = await BaseApi.get(CONFIG.ENDPOINTS.HOTELS);
      this.hotels = response.data || response || [];
      
      const filterSelect = document.getElementById('hotel-filter');
      const formSelect = document.getElementById('room-hotel');
      
      let optionsHtml = '';
      this.hotels.forEach(h => {
        optionsHtml += `<option value="${h.id}">${h.name}</option>`;
      });
      
      filterSelect.innerHTML += optionsHtml;
      formSelect.innerHTML = `<option value="">Select a hotel...</option>${optionsHtml}`;
    } catch (e) {
      console.error('Failed to load hotels for dropdown');
    }
  }

  getHotelName(id) {
    const hotel = this.hotels.find(h => h.id == id);
    return hotel ? hotel.name : 'Unknown';
  }

  setupEvents() {
    document.getElementById('btn-add-room').addEventListener('click', () => {
      this.currentRoomId = null;
      document.getElementById('room-form').reset();
      this.imageUpload.clear();
      document.getElementById('roomModalLabel').textContent = t('staff.rooms.addModal');
      this.modal.show();
    });

    document.getElementById('hotel-filter').addEventListener('change', (e) => {
      const hotelId = e.target.value;
      if (hotelId) {
        this.loadData({ hotelId });
      } else {
        this.loadData();
      }
    });

    document.getElementById('btn-save-room').addEventListener('click', () => {
      const form = document.getElementById('room-form');
      if (form && !form.reportValidity()) return;
      this.saveRoom();
    });
  }

  async loadData(params = {}) {
    this.tableRender.renderLoading();
    try {
      const query = new URLSearchParams(params).toString();
      const response = await BaseApi.get(`${CONFIG.ENDPOINTS.ROOMS}?${query}`);
      const data = response.data || response || [];
      
      this.tableRender.renderData(data, (action, item) => {
        if (action === 'edit') this.editRoom(item);
        if (action === 'delete') this.deleteRoom(item);
      });
    } catch (error) {
      this.tableRender.renderData([]);
    }
  }

  editRoom(item) {
    this.currentRoomId = item.id;
    document.getElementById('room-hotel').value = item.hotelId || '';
    document.getElementById('room-type').value = item.type || '';
    document.getElementById('room-price').value = item.price || 0;
    document.getElementById('room-capacity').value = item.maxGuests || item.capacity || 1;
    document.getElementById('room-count').value = item.beds || 1;
    document.getElementById('room-amenities').value = (item.amenities || []).join(', ');
    document.getElementById('room-desc').value = item.description || '';
    
    this.imageUpload.clear();
    
    if (item.images && Array.isArray(item.images)) {
      this.imageUpload.setExistingImages(item.images);
    } else {
      this.imageUpload.setExistingImages([]);
    }
    
    document.getElementById('roomModalLabel').textContent = t('staff.rooms.editModal');
    this.modal.show();
  }

  async saveRoom() {
    const amenitiesInput = document.getElementById('room-amenities').value;
    const amenities = amenitiesInput.split(',').map(s => s.trim()).filter(s => s);

    const hotelId = parseInt(document.getElementById('room-hotel').value, 10);
    const type = document.getElementById('room-type').value;
    const price = parseFloat(document.getElementById('room-price').value);
    const maxGuests = parseInt(document.getElementById('room-capacity').value, 10);
    const beds = parseInt(document.getElementById('room-count').value, 10) || 1;
    const description = document.getElementById('room-desc').value;

    if (!hotelId || !type || isNaN(price) || price <= 0 || isNaN(maxGuests) || maxGuests <= 0) {
      ToastManager.error(t('staff.required'));
      return;
    }

    const data = {
      hotelId,
      name: type,
      type,
      price,
      maxGuests,
      beds,
      bathrooms: 1,
      amenities,
      description: description || 'No description provided'
    };
    
    // Always set placeholder if creating new to pass validation
    const files = this.imageUpload.getFiles();
    if (!this.currentRoomId) {
      data.thumbnail = 'https://placehold.co/600x400?text=Room';
    }

    const btn = document.getElementById('btn-save-room');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Saving...';
    btn.disabled = true;

    try {
      let savedRoom;
      if (this.currentRoomId) {
        savedRoom = await BaseApi.put(`${CONFIG.ENDPOINTS.ROOMS}/${this.currentRoomId}`, data);
        ToastManager.success(t('staff.rooms.savedOk'));
      } else {
        savedRoom = await BaseApi.post(`${CONFIG.ENDPOINTS.ROOMS}`, data);
        ToastManager.success(t('staff.rooms.createdOk'));
      }
      
      const files = this.imageUpload.getFiles();
      if (files.length > 0) {
          const targetId = this.currentRoomId || (savedRoom && savedRoom.data && savedRoom.data.id) || (savedRoom && savedRoom.id);
          if (targetId) {
            const hasExisting = this.imageUpload.getExistingImages().length > 0;
            for (let i = 0; i < files.length; i++) {
              const formData = new FormData();
              formData.append('roomId', targetId);
              formData.append('type', (i === 0 && !hasExisting) ? 'thumbnail' : 'gallery');
              formData.append('image', files[i]);
              await BaseApi.post(CONFIG.ENDPOINTS.ROOM_IMAGES, formData);
            }
          }
      }
      
      // Handle deleted existing images
      const deletedIds = this.imageUpload.getDeletedImageIds();
      for (const imgId of deletedIds) {
        if (imgId) {
          try {
            await BaseApi.delete(`${CONFIG.ENDPOINTS.ROOM_IMAGES}/${imgId}`);
          } catch(e) { console.error('Failed to delete image', e); }
        }
      }

      this.modal.hide();
      this.loadData();
    } catch (error) {
      console.error(error);
      ToastManager.error(error.message || t('staff.rooms.saveFail'));
    } finally {
      btn.innerHTML = originalText;
      btn.disabled = false;
    }
  }

  deleteRoom(item) {
    ModalManager.confirm(`Are you sure you want to delete this ${item.type}?`, async () => {
      try {
        await BaseApi.delete(`${CONFIG.ENDPOINTS.ROOMS}/${item.id}`);
        ToastManager.success(t('staff.rooms.deletedOk'));
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

export default new RoomsModule();
