import { BaseApi } from '../../services/BaseApi.js';
import { CONFIG } from '../../services/config.js';
import { TableRender } from '../../components/TableRender.js';
import { ToastManager } from '../../components/ToastManager.js';
import { formatCurrency } from '../../utils/formatCurrency.js';
import { formatDate } from '../../utils/formatDate.js';
import { STATUS_MAPPINGS } from '../../utils/statusMappings.js';
import { debounce } from '../../utils/debounce.js';

const t = (k) => (window.StaffI18N && window.StaffI18N.t(k)) || k;

class BookingsModule {
  constructor() {
    this.modal = null;
    this.currentBookingId = null;
    this.currentType = 'HOTEL';
  }

  isBookingExpired(item) {
    let dateToCheck = null;
    if (item.checkOut) dateToCheck = item.checkOut;
    else if (item.checkout) dateToCheck = item.checkout;
    else if (item.bookingDate) dateToCheck = item.bookingDate;
    
    if (dateToCheck && new Date(dateToCheck).getTime() < new Date().getTime()) {
      return true;
    }
    return false;
  }

  init() {
    this.detailModal = new bootstrap.Modal(document.getElementById('bookingDetailModal'));

    this.tableRender = new TableRender({
      containerId: 'bookings-table',
      emptyMessage: () => t('staff.bookings.none'),
      columns: [
        { label: () => t('staff.col.id'), key: 'id', render: item => `#${item.id}` },
        { label: () => t('staff.col.customer'), key: 'user', render: item => `<strong>${item.user?.name || item.user?.email || 'N/A'}</strong><br><small class="text-muted">${item.user?.phone || ''}</small>` },
        { label: () => t('staff.col.date'), key: 'createdAt', render: item => formatDate(item.createdAt, true) },
        { label: () => t('staff.col.amount'), key: 'totalPrice', render: item => formatCurrency(item.totalPrice) },
        { label: () => t('staff.col.status'), key: 'status', render: item => {
            let isExpired = this.isBookingExpired(item);

            if (item.status === 'cancelled' || item.status === 'CANCELLED') {
              return `<span class="badge bg-danger">Đã hủy</span>`;
            } else if (isExpired) {
              return `<span class="badge bg-secondary">Hết hiệu lực</span>`;
            } else {
              return `<span class="badge bg-success">Còn hiệu lực</span>`;
            }
        }}
      ],
      actions: [
        { id: 'view', label: () => t('staff.viewDetails') || 'Xem chi tiết', icon: 'bi-eye', class: 'btn-info text-white' },
        { 
          id: 'cancel', 
          label: () => t('staff.cancel') || 'Hủy', 
          icon: 'bi-trash', 
          class: 'btn-danger text-white',
          disabled: (item) => this.isBookingExpired(item) || item.status === 'cancelled' || item.status === 'CANCELLED'
        }
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

    document.getElementById('type-filter').addEventListener('change', (e) => {
      this.currentType = e.target.value;
      this.loadData();
    });

    document.getElementById('status-filter').addEventListener('change', () => {
      this.loadData();
    });

    document.getElementById('status-filter').addEventListener('change', () => {
      this.loadData();
    });
  }

  async loadData() {
    this.tableRender.renderLoading();
    
    const search = document.getElementById('search-input').value;
    const filterStatus = document.getElementById('status-filter').value;
    
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    
    try {
      let endpoint = CONFIG.ENDPOINTS.BOOKINGS.HOTEL;
      if (this.currentType === 'TOUR') {
        endpoint = CONFIG.ENDPOINTS.BOOKINGS.TOUR;
      } else if (this.currentType === 'APARTMENT') {
        endpoint = CONFIG.ENDPOINTS.BOOKINGS.APARTMENT;
      }
      const response = await BaseApi.get(`${endpoint}?${params.toString()}`);
      const data = response.data || response.bookings || response.items || response || [];
      let finalData = Array.isArray(data) ? data : [];
      
      if (filterStatus) {
        finalData = finalData.filter(item => {
          const isCancelled = (item.status === 'cancelled' || item.status === 'CANCELLED');
          const isExpired = this.isBookingExpired(item);
          
          if (filterStatus === 'CANCELLED') return isCancelled;
          if (filterStatus === 'EXPIRED') return !isCancelled && isExpired;
          if (filterStatus === 'ACTIVE') return !isCancelled && !isExpired;
          return true;
        });
      }
      
      this.tableRender.renderData(finalData, (action, item) => {
        if (action === 'cancel') this.cancelBooking(item);
        if (action === 'view') this.viewDetails(item);
      });
    } catch (error) {
      this.tableRender.renderData([]);
    }
  }

  async viewDetails(item) {
    this.detailModal.show();
    
    const detailBody = document.getElementById('booking-detail-body');
    const qrImg = document.getElementById('detail-modal-qr');
    const qrLoading = document.getElementById('detail-qr-loading');
    
    qrImg.style.display = 'none';
    qrLoading.style.display = '';
    qrLoading.innerHTML = `<span class="spinner-border spinner-border-sm text-warning" role="status"></span>`;
    detailBody.innerHTML = `<div class="text-center py-3"><span class="spinner-border spinner-border-sm text-warning"></span> Loading details...</div>`;
    
    const isHotel = this.currentType === 'HOTEL';
    let baseUrl = CONFIG.ENDPOINTS.BOOKINGS.HOTEL;
    let qrEndpoint = `/hotel-bookings/${item.id}/qr`;
    if (this.currentType === 'TOUR') {
      baseUrl = CONFIG.ENDPOINTS.BOOKINGS.TOUR;
      qrEndpoint = `/tour-bookings/${item.id}/qr`;
    } else if (this.currentType === 'APARTMENT') {
      baseUrl = CONFIG.ENDPOINTS.BOOKINGS.APARTMENT;
      qrEndpoint = `/bookings/apartment/${item.id}/qr`;
    }
    
    try {
      const detailsPromise = BaseApi.get(`${baseUrl}/${item.id}`);
      
      const token = localStorage.getItem('token');
      const qrUrl = `${CONFIG.API_BASE}${qrEndpoint}`;
      
      fetch(qrUrl, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })
      .then(r => {
        if (!r.ok) throw new Error();
        return r.blob();
      })
      .then(blob => {
        qrImg.src = URL.createObjectURL(blob);
        qrImg.style.display = 'block';
        qrLoading.style.display = 'none';
      })
      .catch(() => {
        qrLoading.innerHTML = '<span class="text-danger small">No QR available</span>';
      });

      const response = await detailsPromise;
      const detail = response.data || response;
      
      let detailsHtml = '';
      if (this.currentType === 'HOTEL') {
        const room = detail.room || {};
        const hotel = room.hotel || {};
        detailsHtml = `
          <div class="row g-3">
            <div class="col-6"><strong>ID:</strong> #${detail.id}</div>
            <div class="col-6"><strong>Status:</strong> ${detail.status === 'CANCELLED' || detail.status === 'cancelled' ? '<span class="badge bg-danger">Đã hủy</span>' : (detail.checkOut && new Date(detail.checkOut).getTime() < new Date().getTime() ? '<span class="badge bg-secondary">Hết hiệu lực</span>' : '<span class="badge bg-success">Còn hiệu lực</span>')}</div>
            <div class="col-6"><strong>Check-In:</strong> ${formatDate(detail.checkIn)}</div>
            <div class="col-6"><strong>Check-Out:</strong> ${formatDate(detail.checkOut)}</div>
            <div class="col-6"><strong>Total Price:</strong> ${formatCurrency(detail.totalPrice)}</div>
            <div class="col-6"><strong>Guests:</strong> ${detail.guests}</div>
            <div class="col-12"><strong>Room:</strong> ${room.name || 'N/A'} (${hotel.name || 'N/A'})</div>
            <div class="col-12"><strong>Customer:</strong> ${detail.user?.name || detail.fullName || 'N/A'}</div>
            <div class="col-12"><strong>Email:</strong> ${detail.user?.email || detail.email || 'N/A'}</div>
            <div class="col-12"><strong>Phone:</strong> ${detail.user?.phone || detail.phone || 'N/A'}</div>
            <div class="col-12"><strong>Notes:</strong> ${detail.notes || '-'}</div>
          </div>
        `;
      } else if (this.currentType === 'TOUR') {
        const tour = detail.tour || {};
        detailsHtml = `
          <div class="row g-3">
            <div class="col-6"><strong>ID:</strong> #${detail.id}</div>
            <div class="col-6"><strong>Status:</strong> ${detail.status === 'CANCELLED' || detail.status === 'cancelled' ? '<span class="badge bg-danger">Đã hủy</span>' : (detail.bookingDate && new Date(detail.bookingDate).getTime() < new Date().getTime() ? '<span class="badge bg-secondary">Hết hiệu lực</span>' : '<span class="badge bg-success">Còn hiệu lực</span>')}</div>
            <div class="col-6"><strong>Departure Date:</strong> ${formatDate(detail.bookingDate)}</div>
            <div class="col-6"><strong>Total Price:</strong> ${formatCurrency(detail.totalPrice)}</div>
            <div class="col-6"><strong>Guests:</strong> ${detail.guests}</div>
            <div class="col-12"><strong>Tour:</strong> ${tour.title || 'N/A'} (${tour.location || 'N/A'})</div>
            <div class="col-12"><strong>Customer:</strong> ${detail.user?.name || detail.fullName || 'N/A'}</div>
            <div class="col-12"><strong>Email:</strong> ${detail.user?.email || detail.email || 'N/A'}</div>
            <div class="col-12"><strong>Phone:</strong> ${detail.user?.phone || detail.phone || 'N/A'}</div>
          </div>
        `;
      } else if (this.currentType === 'APARTMENT') {
        const apt = detail.apartment || {};
        detailsHtml = `
          <div class="row g-3">
            <div class="col-6"><strong>ID:</strong> #${detail.id}</div>
            <div class="col-6"><strong>Status:</strong> ${detail.status === 'CANCELLED' || detail.status === 'cancelled' ? '<span class="badge bg-danger">Đã hủy</span>' : (detail.checkout && new Date(detail.checkout).getTime() < new Date().getTime() ? '<span class="badge bg-secondary">Hết hiệu lực</span>' : '<span class="badge bg-success">Còn hiệu lực</span>')}</div>
            <div class="col-6"><strong>Check-In:</strong> ${formatDate(detail.checkin)}</div>
            <div class="col-6"><strong>Check-Out:</strong> ${formatDate(detail.checkout)}</div>
            <div class="col-6"><strong>Total Price:</strong> ${formatCurrency(detail.totalPrice)}</div>
            <div class="col-6"><strong>Guests:</strong> ${detail.guests}</div>
            <div class="col-12"><strong>Apartment:</strong> ${apt.title || 'N/A'} (${apt.location || 'N/A'})</div>
            <div class="col-12"><strong>Customer:</strong> ${detail.user?.name || detail.name || 'N/A'}</div>
            <div class="col-12"><strong>Email:</strong> ${detail.user?.email || detail.email || 'N/A'}</div>
            <div class="col-12"><strong>Phone:</strong> ${detail.user?.phone || detail.phone || 'N/A'}</div>
          </div>
        `;
      }
      
      detailBody.innerHTML = detailsHtml;
    } catch (error) {
      console.error(error);
      detailBody.innerHTML = `<div class="alert alert-danger small">${error.message || 'Failed to load details'}</div>`;
    }
  }

  async cancelBooking(item) {
    if (item.status === 'cancelled' || item.status === 'CANCELLED') {
      ToastManager.warning('Đặt phòng này đã bị hủy.');
      return;
    }

    const confirmed = await window.CustomAlert.confirm('Bạn có chắc chắn muốn hủy đặt phòng này không?');
    if (!confirmed) return;
    
    try {
      let endpoint = CONFIG.ENDPOINTS.BOOKINGS.HOTEL;
      if (this.currentType === 'TOUR') {
        endpoint = CONFIG.ENDPOINTS.BOOKINGS.TOUR;
      } else if (this.currentType === 'APARTMENT') {
        endpoint = CONFIG.ENDPOINTS.BOOKINGS.APARTMENT;
      }
      
      await BaseApi.put(`${endpoint}/${item.id}/status`, { status: 'cancelled' });
      ToastManager.success('Hủy đặt phòng thành công');
      this.loadData();
    } catch (error) {
      console.error(error);
      ToastManager.error(error.message || 'Không thể hủy đặt phòng');
    }
  }

  destroy() {
  }
}

export default new BookingsModule();
