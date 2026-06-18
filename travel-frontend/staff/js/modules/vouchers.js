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

class VouchersModule {
  constructor() {
    this.modal = null;
    this.imageUpload = null;
    this.currentVoucherId = null;
  }

  init() {
    this.modal = new bootstrap.Modal(document.getElementById('voucherModal'));

    this.imageUpload = new ImageUpload({
      containerId: 'image-upload-container',
      multiple: false,
      maxSizeMB: 5
    });

    this.tableRender = new TableRender({
      containerId: 'vouchers-table',
      emptyMessage: () => t('staff.vouchers.none'),
      columns: [
        { label: () => t('staff.col.id'), key: 'id' },
        { label: () => t('staff.col.title'), key: 'title', render: item => `<strong>${item.title}</strong><br><small class="text-muted">${item.resortName || ''}</small>` },
        { label: () => t('staff.label.price'), key: 'originalPrice', render: item => formatCurrency(item.originalPrice) },
        { label: () => t('staff.vouchers.labelValue'), key: 'salePrice', render: item => formatCurrency(item.salePrice) }
      ],
      actions: [
        { id: 'edit', label: () => t('staff.edit'), icon: 'bi-pencil', class: 'btn-light' },
        { id: 'delete', label: () => t('staff.delete'), icon: 'bi-trash', class: 'btn-danger', show: () => PermissionManager.canDeleteVoucher() }
      ]
    });

    this.setupEvents();
    this.loadData();
  }

  setupEvents() {
    document.getElementById('btn-add-voucher').addEventListener('click', () => {
      this.currentVoucherId = null;
      document.getElementById('voucher-form').reset();
      this.imageUpload.clear();
      document.getElementById('voucher-quantity').value = 999999;
      document.getElementById('voucher-remaining').value = 999999;
      document.getElementById('voucherModalLabel').textContent = 'Add Voucher';
      this.modal.show();
    });

    const searchInput = document.getElementById('search-input');
    searchInput.addEventListener('input', debounce(() => {
      this.loadData({ search: searchInput.value });
    }, 500));

    document.getElementById('btn-save-voucher').addEventListener('click', () => {
      const form = document.getElementById('voucher-form');
      if (form && !form.reportValidity()) return;
      this.saveVoucher();
    });
  }

  async loadData(params = {}) {
    this.tableRender.renderLoading();
    try {
      const query = new URLSearchParams(params).toString();
      const response = await BaseApi.get(`${CONFIG.ENDPOINTS.VOUCHERS}?${query}`);
      const data = response.data || response || [];
      
      this.tableRender.renderData(data, (action, item) => {
        if (action === 'edit') this.editVoucher(item);
        if (action === 'delete') this.deleteVoucher(item);
      });
    } catch (error) {
      this.tableRender.renderData([]);
    }
  }

  editVoucher(item) {
    this.currentVoucherId = item.id;
    document.getElementById('voucher-name').value = item.title || '';
    document.getElementById('voucher-price').value = item.originalPrice || 0;
    document.getElementById('voucher-value').value = item.salePrice || 0;
    document.getElementById('voucher-quantity').value = item.quantity || 100;
    document.getElementById('voucher-remaining').value = item.remainingQuantity !== undefined ? item.remainingQuantity : (item.quantity || 100);
    document.getElementById('voucher-desc').value = item.description || '';
    
    this.imageUpload.clear();
    if (item.image) {
      this.imageUpload.setExistingImages([{ id: item.id, url: item.image }]);
    }
    
    document.getElementById('voucherModalLabel').textContent = 'Edit Voucher';
    this.modal.show();
  }

  async saveVoucher() {
    const title = document.getElementById('voucher-name').value;
    const originalPrice = parseFloat(document.getElementById('voucher-price').value);
    const salePrice = parseFloat(document.getElementById('voucher-value').value);
    const description = document.getElementById('voucher-desc').value;

    const quantity = parseInt(document.getElementById('voucher-quantity').value, 10);
    const remainingVal = document.getElementById('voucher-remaining').value;
    const remainingQuantity = remainingVal ? parseInt(remainingVal, 10) : quantity;

    if (!title || isNaN(originalPrice) || originalPrice <= 0 || isNaN(salePrice) || salePrice <= 0) {
      ToastManager.error('Please fill in all required fields. Prices must be greater than 0.');
      return;
    }

    if (isNaN(quantity) || quantity <= 0) {
      ToastManager.error('Quantity must be greater than 0.');
      return;
    }

    if (remainingQuantity > quantity) {
      ToastManager.error('Remaining quantity cannot exceed total quantity.');
      return;
    }
    
    if (salePrice > originalPrice) {
      ToastManager.error('Sale price cannot be greater than original price.');
      return;
    }

    // validUntil defaults to 1 year from now
    const validUntil = new Date();
    validUntil.setFullYear(validUntil.getFullYear() + 1);

    const data = {
      title,
      description: description || 'No description provided',
      resortName: title,
      originalPrice,
      salePrice,
      validUntil: validUntil.toISOString(),
      quantity,
      remainingQuantity
    };

    const btn = document.getElementById('btn-save-voucher');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Saving...';
    btn.disabled = true;

    try {
      let savedVoucher;
      if (this.currentVoucherId) {
        savedVoucher = await BaseApi.put(`${CONFIG.ENDPOINTS.VOUCHERS}/${this.currentVoucherId}`, data);
        ToastManager.success('Voucher updated successfully');
      } else {
        savedVoucher = await BaseApi.post(`${CONFIG.ENDPOINTS.VOUCHERS}`, data);
        ToastManager.success('Voucher created successfully');
      }
      
      const files = this.imageUpload.getFiles();
      const targetId = this.currentVoucherId || (savedVoucher && savedVoucher.data && savedVoucher.data.id) || (savedVoucher && savedVoucher.id);
      
      if (targetId) {
        if (files.length > 0) {
          const formData = new FormData();
          formData.append('image', files[0]);
          await BaseApi.post(`${CONFIG.ENDPOINTS.VOUCHERS}/${targetId}/image`, formData);
        } else {
          // Check if existing image was removed
          const deletedIds = this.imageUpload.getDeletedImageIds();
          if (deletedIds.length > 0) {
            await BaseApi.delete(`${CONFIG.ENDPOINTS.VOUCHERS}/${targetId}/image`);
          }
        }
      }
      
      this.modal.hide();
      this.loadData();
    } catch (error) {
      console.error(error);
      ToastManager.error(error.message || 'Failed to save voucher');
    } finally {
      btn.innerHTML = originalText;
      btn.disabled = false;
    }
  }

  deleteVoucher(item) {
    ModalManager.confirm(`Are you sure you want to delete ${item.title}?`, async () => {
      try {
        await BaseApi.delete(`${CONFIG.ENDPOINTS.VOUCHERS}/${item.id}`);
        ToastManager.success('Voucher deleted successfully');
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

export default new VouchersModule();
