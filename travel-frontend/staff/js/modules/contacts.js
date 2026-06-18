import { BaseApi } from '../../services/BaseApi.js';
import { CONFIG } from '../../services/config.js';
import { TableRender } from '../../components/TableRender.js';
import { ModalManager } from '../../components/ModalManager.js';
import { ToastManager } from '../../components/ToastManager.js';
import { PermissionManager } from '../../services/PermissionManager.js';
import { formatDate } from '../../utils/formatDate.js';
import { debounce } from '../../utils/debounce.js';

const t = (k) => (window.StaffI18N && window.StaffI18N.t(k)) || k;

class ContactsModule {
  init() {
    this.tableRender = new TableRender({
      containerId: 'contacts-table',
      emptyMessage: () => t('staff.inquiries.none'),
      columns: [
        { label: () => t('staff.col.id'), key: 'id' },
        { label: 'Sender', key: 'name', render: item => `<strong>${item.name}</strong><br><small class="text-muted"><a href="mailto:${item.email}">${item.email}</a></small>` },
        { label: () => t('staff.col.message'), key: 'message', render: item => `<div class="text-truncate" style="max-width: 250px;" title="${item.message}">${item.message}</div>` },
        { label: () => t('staff.col.date'), key: 'createdAt', render: item => formatDate(item.createdAt, true) }
      ],
      actions: [
        { id: 'view', label: 'View', icon: 'bi-eye', class: 'btn-info text-white' },
        { id: 'delete', label: () => t('staff.delete'), icon: 'bi-trash', class: 'btn-danger', show: () => PermissionManager.canDeleteContact() }
      ]
    });

    this.setupEvents();
    this.loadData();
    this.initSettingsTab();
  }

  setupEvents() {
    const searchInput = document.getElementById('search-input');
    searchInput.addEventListener('input', debounce(() => {
      this.loadData();
    }, 500));
  }

  async loadData() {
    this.tableRender.renderLoading();
    
    const search = document.getElementById('search-input').value;
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    
    try {
      const response = await BaseApi.get(`${CONFIG.ENDPOINTS.CONTACT}?${params.toString()}`);
      const data = response.data || response || [];
      
      this.tableRender.renderData(Array.isArray(data) ? data : [], (action, item) => {
        if (action === 'view') this.viewContact(item);
        if (action === 'delete') this.deleteContact(item);
      });
    } catch (error) {
      this.tableRender.renderData([]);
    }
  }

  viewContact(item) {
    ModalManager.showDetail(`Message from ${item.name}`, `
      <p><strong>Email:</strong> <a href="mailto:${item.email}">${item.email}</a></p>
      <p><strong>Date:</strong> ${formatDate(item.createdAt, true)}</p>
      <hr>
      <div class="p-3 bg-light rounded" style="white-space: pre-wrap;">${item.message}</div>
    `);
  }

  deleteContact(item) {
    ModalManager.confirm(`Are you sure you want to delete this message from ${item.name}?`, async () => {
      try {
        await BaseApi.delete(`${CONFIG.ENDPOINTS.CONTACT}/${item.id}`);
        ToastManager.success('Message deleted successfully');
        this.loadData();
      } catch (error) {
        console.error(error);
      }
    });
  }

  destroy() {
    if (this.map) {
      this.map.remove();
    }
  }

  initSettingsTab() {
    const settingsTab = document.getElementById('settings-tab');
    if (!settingsTab) return;
    
    let mapInitialized = false;

    settingsTab.addEventListener('shown.bs.tab', () => {
      if (!mapInitialized) {
        this.initMap();
        this.loadSettings();
        mapInitialized = true;
      } else {
        if (this.map) {
          this.map.invalidateSize();
        }
      }
    });

    const form = document.getElementById('contact-info-form');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await this.saveSettings();
      });
    }
  }

  initMap() {
    const defaultLocation = [21.028511, 105.804817];
    
    this.map = L.map('contact-map').setView(defaultLocation, 13);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.map);

    this.marker = L.marker(defaultLocation, { draggable: true }).addTo(this.map);

    this.marker.on('dragend', (e) => {
      const pos = e.target.getLatLng();
      document.getElementById('contact-lat').value = pos.lat;
      document.getElementById('contact-lng').value = pos.lng;
    });

    this.map.on('click', (e) => {
      const pos = e.latlng;
      this.marker.setLatLng(pos);
      document.getElementById('contact-lat').value = pos.lat;
      document.getElementById('contact-lng').value = pos.lng;
    });
  }

  async loadSettings() {
    try {
      const response = await BaseApi.get(`${CONFIG.ENDPOINTS.SETTINGS}/contact_info`);
      if (response && response.data) {
        const info = response.data;
        document.getElementById('contact-address').value = info.address || '';
        document.getElementById('contact-phone').value = info.phone || '';
        document.getElementById('contact-email').value = info.email || '';
        
        if (info.mapLat && info.mapLng) {
          document.getElementById('contact-lat').value = info.mapLat;
          document.getElementById('contact-lng').value = info.mapLng;
          
          const pos = [parseFloat(info.mapLat), parseFloat(info.mapLng)];
          this.marker.setLatLng(pos);
          this.map.setView(pos, 15);
        }
      }
    } catch (error) {
      // 404 is fine if settings are not initialized yet
      if (error && error.status !== 404) {
        console.error('Error loading settings', error);
      }
    }
  }

  async saveSettings() {
    const info = {
      address: document.getElementById('contact-address').value,
      phone: document.getElementById('contact-phone').value,
      email: document.getElementById('contact-email').value,
      mapLat: document.getElementById('contact-lat').value,
      mapLng: document.getElementById('contact-lng').value
    };

    try {
      await BaseApi.put(CONFIG.ENDPOINTS.SETTINGS, {
        key: 'contact_info',
        value: info
      });
      ToastManager.success('Contact information saved successfully');
    } catch (error) {
      ToastManager.error('Failed to save contact information');
      console.error(error);
    }
  }
}

export default new ContactsModule();
