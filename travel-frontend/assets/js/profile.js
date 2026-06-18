document.addEventListener('DOMContentLoaded', function () {
  if (!Auth.isLoggedIn()) {
    window.location.href = 'login.html';
    return;
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  function fmt(amount) {
    return Number(amount).toLocaleString('vi-VN') + ' ₫';
  }

  function fmtDate(str) {
    if (!str) return '-';
    return new Date(str).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  function fmtDateTime(str) {
    if (!str) return '-';
    return new Date(str).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  var STATUS_LABEL = {
    pending:     { label: t('pj.status.pending'), cls: 'pending' },
    confirmed:   { label: t('pj.status.confirmed'),  cls: 'confirmed' },
    cancelled:   { label: t('pj.status.cancelled'),        cls: 'cancelled' },
    checked_in:  { label: t('pj.status.checked_in'), cls: 'checked_in' },
    checked_out: { label: t('pj.status.checked_out'), cls: 'checked_out' },
    completed:   { label: t('pj.status.completed'),   cls: 'completed' },
    failed:      { label: t('pj.status.failed'),      cls: 'failed' },
    refunded:    { label: t('pj.status.refunded'), cls: 'refunded' },
    paid:        { label: t('pj.status.paid'),cls: 'paid' },
    unpaid:      { label: t('pj.status.unpaid'),       cls: 'unpaid' },
    PAID:             { label: t('pj.status.PAID'),         cls: 'PAID' },
    PENDING_PAYMENT:  { label: t('pj.status.PENDING_PAYMENT'),cls: 'PENDING_PAYMENT' },
    USED:             { label: t('pj.status.USED'),       cls: 'USED' },
    EXPIRED:          { label: t('pj.status.EXPIRED'),       cls: 'EXPIRED' },
    CANCELLED:        { label: t('pj.status.cancelled'),        cls: 'cancelled' },
  };

  function statusBadge(key) {
    var s = STATUS_LABEL[key] || { label: key, cls: 'secondary' };
    return '<span class="status-badge badge-' + s.cls + '">' + s.label + '</span>';
  }

  var METHOD_LABEL = {
    bank_transfer: t('pj.method.bank_transfer'),
    card:          t('pj.method.card'),
    momo:          'MoMo',
    vnpay:         'VNPay',
    cash:          t('pj.method.cash'),
  };

  var BOOKING_TYPE_LABEL = {
    HOTEL:     { label: t('pj.type.HOTEL'), icon: 'ion-ios-bed' },
    TOUR:      { label: t('pj.type.TOUR'),    icon: 'ion-ios-map' },
    APARTMENT: { label: t('pj.type.APARTMENT'),          icon: 'ion-ios-home' },
    VOUCHER:   { label: t('pj.type.VOUCHER'),          icon: 'ion-ios-pricetag' },
  };

  function emptyState(icon, msg) {
    return '<div class="empty-state"><span class="ion ' + icon + '"></span><p class="mb-0">' + msg + '</p></div>';
  }

  // ── Tab switching ─────────────────────────────────────────────────────────

  var loaded = {};
  var hotelBookings = [];
  var apartmentBookings = [];
  var tourBookings = [];
  var voucherOrders = [];

  document.querySelectorAll('#profile-tabs .nav-link').forEach(function (link) {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      var tab = this.dataset.tab;
      document.querySelectorAll('#profile-tabs .nav-link').forEach(function (l) { l.classList.remove('active'); });
      document.querySelectorAll('.tab-section').forEach(function (s) { s.classList.remove('active'); });
      this.classList.add('active');
      document.getElementById('tab-' + tab).classList.add('active');
      if (!loaded[tab]) {
        loaded[tab] = true;
        if (tab === 'hotel-bookings')     loadHotelBookings();
        if (tab === 'apartment-bookings') loadApartmentBookings();
        if (tab === 'tour-bookings')      loadTourBookings();
        if (tab === 'payments')           loadPayments();
        if (tab === 'vouchers')           loadVouchers();
      }
    });
  });

  // document.addEventListener('i18n:changed', function () { location.reload(); });

  // Check if URL hash points to a tab
  var hash = window.location.hash.replace('#', '');
  if (hash && document.getElementById('tab-' + hash)) {
    document.querySelector('[data-tab="' + hash + '"]').click();
  }

  // Preload all remaining tabs so badges update immediately
  ['hotel-bookings', 'apartment-bookings', 'tour-bookings', 'payments', 'vouchers'].forEach(function(tab) {
    if (!loaded[tab]) {
      loaded[tab] = true;
      if (tab === 'hotel-bookings')     loadHotelBookings();
      if (tab === 'apartment-bookings') loadApartmentBookings();
      if (tab === 'tour-bookings')      loadTourBookings();
      if (tab === 'payments')           loadPayments();
      if (tab === 'vouchers')           loadVouchers();
    }
  });

  // ── Account info ──────────────────────────────────────────────────────────

  api.authGet('/auth/profile').then(function (res) {
    document.getElementById('profile-loading').style.display = 'none';
    if (!res.success) {
      var err = document.getElementById('profile-error');
      err.textContent = res.message || t('pj.loadInfoFail');
      err.style.display = 'block';
      return;
    }
    var u = res.user;
    document.getElementById('hero-username').textContent = t('pj.greeting') + u.name;
    document.getElementById('profile-name').textContent    = u.name;
    document.getElementById('profile-email').textContent   = u.email;
    document.getElementById('profile-role').textContent    = { ADMIN: t('role.admin'), STAFF: t('role.staff'), CUSTOMER: t('role.customer') }[u.role] || u.role;
    document.getElementById('profile-created').textContent = fmtDate(u.created_at);
    document.getElementById('profile-info').style.display  = 'block';
  }).catch(function () {
    document.getElementById('profile-loading').style.display = 'none';
    var err = document.getElementById('profile-error');
    err.textContent = t('common.connFail');
    err.style.display = 'block';
  });

  // ── Change password ───────────────────────────────────────────────────────

  document.getElementById('change-password-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var btn  = this.querySelector('button[type=submit]');
    var msg  = document.getElementById('password-msg');
    var newPw    = this.querySelector('[name=newPassword]').value;
    var confirm  = this.querySelector('[name=confirmPassword]').value;

    if (newPw !== confirm) {
      msg.className = 'alert alert-danger small';
      msg.textContent = t('pj.pwMismatch');
      msg.style.display = 'block';
      return;
    }

    btn.disabled = true;
    btn.textContent = t('pj.updating');

    api.authPut('/auth/change-password', {
      currentPassword: this.querySelector('[name=currentPassword]').value,
      newPassword: newPw
    }).then(function (res) {
      msg.className = 'alert alert-' + (res.success ? 'success' : 'danger') + ' small';
      msg.textContent = res.success ? t('pj.pwSuccess') : (res.message || t('pj.failShort'));
      msg.style.display = 'block';
      if (res.success) document.getElementById('change-password-form').reset();
    }).catch(function () {
      msg.className = 'alert alert-danger small';
      msg.textContent = t('common.connFail');
      msg.style.display = 'block';
    }).finally(function () {
      btn.disabled = false;
      btn.textContent = t('pf.updatePassword');
    });
  });

  // ── Hotel bookings ────────────────────────────────────────────────────────

  function loadHotelBookings() {
    var container = document.getElementById('hotel-bookings-list');
    api.authGet('/hotel-bookings/my?limit=50').then(function (res) {
      var list = res.success ? res.data : [];
      hotelBookings = list;
      var badge = document.getElementById('badge-hotel');
      if (list.length) { badge.textContent = list.length; badge.style.display = ''; }

      if (!list.length) {
        container.innerHTML = emptyState('ion-ios-bed', t('pj.emptyHotel'));
        return;
      }

      container.innerHTML = list.map(function (b) {
        var room   = b.room || {};
        var hotel  = room.hotel || {};
        var nights = b.checkIn && b.checkOut
          ? Math.ceil((new Date(b.checkOut) - new Date(b.checkIn)) / 86400000) : 0;
        var canCancel = b.status !== 'cancelled' && b.status !== 'checked_out' && b.status !== 'checked_in';
        var isExpired = b.checkOut && new Date(b.checkOut).getTime() < new Date().getTime();
        var cardStyle = isExpired ? ' opacity: 0.6;' : '';
        
        var displayStatus = '';
        if (b.status === 'cancelled' || b.status === 'CANCELLED') {
          displayStatus = '<span class="badge badge-danger">Đã hủy</span>';
        } else if (isExpired) {
          displayStatus = '<span class="badge badge-secondary">Hết hiệu lực</span>';
        } else {
          displayStatus = '<span class="badge badge-success">Còn hiệu lực</span>';
        }

        return (
          '<div class="card history-card" style="' + cardStyle + '">' +
            '<div class="card-body">' +
              '<div class="d-flex justify-content-between align-items-start mb-2">' +
                '<div>' +
                  '<div class="history-title">' +
                    '<span class="ion-ios-bed mr-1" style="color:#F96D00"></span>' + (room.name || t('pj.roomPrefix') + b.roomId) +
                  '</div>' +
                  '<div class="history-meta">' +
                    '<span class="ion-ios-business mr-1"></span>' + (hotel.name || '-') +
                    (hotel.location ? ' &bull; ' + hotel.location : '') +
                  '</div>' +
                '</div>' +
                '<div class="text-right">' +
                  displayStatus +
                '</div>' +
              '</div>' +
              '<div class="row history-meta mt-2">' +
                '<div class="col-6 col-md-3 mb-2"><strong>Check-in</strong><br>' + fmtDate(b.checkIn) + '</div>' +
                '<div class="col-6 col-md-3 mb-2"><strong>Check-out</strong><br>' + fmtDate(b.checkOut) + '</div>' +
                '<div class="col-6 col-md-3 mb-2"><strong>' + t('pj.nights') + '</strong><br>' + nights + ' ' + t('pj.nightWord') + '</div>' +
                '<div class="col-6 col-md-3 mb-2"><strong>' + t('pj.total') + '</strong><br><span style="color:#F96D00;font-weight:600">' + fmt(b.totalPrice) + '</span></div>' +
              '</div>' +
              '<div class="d-flex justify-content-between align-items-center mt-1">' +
                '<small class="text-muted">' + t('pj.bookedOn') + ' ' + fmtDate(b.createdAt) + ' &bull; ' + t('pj.guestsLabel') + ': ' + b.guests + '</small>' +
                '<div style="gap:6px" class="d-flex">' +
                  '<button class="btn btn-outline-warning btn-sm btn-view-hotel" data-id="' + b.id + '">' + t('pf.viewDetails') + '</button>' +
                '</div>' +
              '</div>' +
            '</div>' +
          '</div>'
        );
      }).join('');

      // View Details handlers
      container.querySelectorAll('.btn-view-hotel').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var id = parseInt(this.dataset.id, 10);
          showBookingDetails(id, 'hotel');
        });
      });

      // Cancel handlers
      container.querySelectorAll('.btn-cancel-hotel').forEach(function (btn) {
        btn.addEventListener('click', async function () {
          const confirmed = await window.CustomAlert.confirm(t('pj.cancelConfirmHotel'));
          if (!confirmed) return;
          var id = this.dataset.id;
          var self = this;
          self.disabled = true; self.textContent = t('pj.cancelling');
          api.authPut('/hotel-bookings/' + id + '/cancel', {}).then(function (res) {
            if (res.success) { loaded['hotel-bookings'] = false; loadHotelBookings(); }
            else { window.CustomAlert.alert(res.message || t('pj.cancelFail')); self.disabled = false; self.textContent = t('pj.cancelHotel'); }
          }).catch(function () { window.CustomAlert.alert(t('pj.connShort')); self.disabled = false; self.textContent = t('pj.cancelHotel'); });
        });
      });
    }).catch(function () {
      container.innerHTML = '<p class="text-danger">' + t('tours.loadFail') + '</p>';
    });
  }

  // ── Apartment bookings ───────────────────────────────────────────────────

  function loadApartmentBookings() {
    var container = document.getElementById('apartment-bookings-list');
    api.authGet('/bookings/apartment/my').then(function (res) {
      var list = res.success ? res.data : [];
      apartmentBookings = list;
      var badge = document.getElementById('badge-apt');
      if (list.length) { badge.textContent = list.length; badge.style.display = ''; }

      if (!list.length) {
        container.innerHTML = emptyState('ion-ios-home', t('pj.emptyApt'));
        return;
      }

      container.innerHTML = list.map(function (b) {
        var apt    = b.apartment || {};
        var nights = b.checkin && b.checkout
          ? Math.ceil((new Date(b.checkout) - new Date(b.checkin)) / 86400000) : 0;
        var canCancel = b.status !== 'cancelled';
        var isExpired = b.checkout && new Date(b.checkout).getTime() < new Date().getTime();
        var cardStyle = isExpired ? ' opacity: 0.6;' : '';
        var thumb  = apt.thumbnail ? api.resolveUrl(apt.thumbnail) : 'assets/images/image_1.jpg';
        
        var displayStatus = '';
        if (b.status === 'cancelled' || b.status === 'CANCELLED') {
          displayStatus = '<span class="badge badge-danger">Đã hủy</span>';
        } else if (isExpired) {
          displayStatus = '<span class="badge badge-secondary">Hết hiệu lực</span>';
        } else {
          displayStatus = '<span class="badge badge-success">Còn hiệu lực</span>';
        }

        return (
          '<div class="card history-card" style="' + cardStyle + '">' +
            '<div class="card-body">' +
              '<div class="d-flex justify-content-between align-items-start mb-2">' +
                '<div class="d-flex align-items-center" style="gap:12px">' +
                  '<img src="' + thumb + '" style="width:56px;height:56px;object-fit:cover;border-radius:6px;flex-shrink:0" alt="">' +
                  '<div>' +
                    '<div class="history-title">' +
                      '<span class="ion-ios-home mr-1" style="color:#F96D00"></span>' + (apt.title || t('pj.aptPrefix') + b.item_id) +
                    '</div>' +
                    '<div class="history-meta"><span class="ion-ios-location mr-1"></span>' + (apt.location || '-') + '</div>' +
                  '</div>' +
                '</div>' +
                '<div class="text-right">' +
                  displayStatus +
                '</div>' +
              '</div>' +
              '<div class="row history-meta mt-2">' +
                '<div class="col-6 col-md-3 mb-2"><strong>' + t('pj.checkinApt') + '</strong><br>' + fmtDate(b.checkin) + '</div>' +
                '<div class="col-6 col-md-3 mb-2"><strong>' + t('pj.checkoutApt') + '</strong><br>' + fmtDate(b.checkout) + '</div>' +
                '<div class="col-6 col-md-3 mb-2"><strong>' + t('pj.nights') + '</strong><br>' + nights + ' ' + t('pj.nightWord') + '</div>' +
                '<div class="col-6 col-md-3 mb-2"><strong>' + t('pj.total') + '</strong><br><span style="color:#F96D00;font-weight:600">' + fmt(b.total_price) + '</span></div>' +
              '</div>' +
              '<div class="d-flex justify-content-between align-items-center mt-1">' +
                '<small class="text-muted">' + t('pj.bookedOn') + ' ' + fmtDate(b.created_at) + ' &bull; ' + b.guests + ' ' + t('pj.guestsLabel') + '</small>' +
                '<div style="gap:6px" class="d-flex">' +
                  '<button class="btn btn-outline-warning btn-sm btn-view-apt" data-id="' + b.id + '">' + t('pf.viewDetails') + '</button>' +
                '</div>' +
              '</div>' +
            '</div>' +
          '</div>'
        );
      }).join('');

      // View Details handlers
      container.querySelectorAll('.btn-view-apt').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var id = this.dataset.id;
          showBookingDetails(id, 'apt');
        });
      });

      container.querySelectorAll('.btn-cancel-apt').forEach(function (btn) {
        btn.addEventListener('click', async function () {
          const confirmed = await window.CustomAlert.confirm(t('pj.cancelConfirmApt'));
          if (!confirmed) return;
          var id = this.dataset.id;
          var self = this;
          self.disabled = true; self.textContent = t('pj.cancelling');
          api.authPut('/bookings/apartment/' + id + '/cancel', {}).then(function (res) {
            if (res.success) { loaded['apartment-bookings'] = false; loadApartmentBookings(); }
            else { window.CustomAlert.alert(res.message || t('pj.cancelFail')); self.disabled = false; self.textContent = t('pj.cancelApt'); }
          }).catch(function () { window.CustomAlert.alert(t('pj.connShort')); self.disabled = false; self.textContent = t('pj.cancelApt'); });
        });
      });
    }).catch(function () {
      container.innerHTML = '<p class="text-danger">' + t('tours.loadFail') + '</p>';
    });
  }

  // ── Tour bookings ─────────────────────────────────────────────────────────

  function loadTourBookings() {
    var container = document.getElementById('tour-bookings-list');
    api.authGet('/tour-bookings/my?limit=50').then(function (res) {
      var list = res.success ? res.data : [];
      tourBookings = list;
      var badge = document.getElementById('badge-tour');
      if (list.length) { badge.textContent = list.length; badge.style.display = ''; }

      if (!list.length) {
        container.innerHTML = emptyState('ion-ios-map', t('pj.emptyTour'));
        return;
      }

      container.innerHTML = list.map(function (b) {
        var tour = b.tour || {};
        var canCancel = b.status !== 'cancelled';
        var isExpired = b.bookingDate && new Date(b.bookingDate).getTime() < new Date().getTime();
        var cardStyle = isExpired ? ' opacity: 0.6;' : '';
        
        var displayStatus = '';
        if (b.status === 'cancelled' || b.status === 'CANCELLED') {
          displayStatus = '<span class="badge badge-danger">Đã hủy</span>';
        } else if (isExpired) {
          displayStatus = '<span class="badge badge-secondary">Hết hiệu lực</span>';
        } else {
          displayStatus = '<span class="badge badge-success">Còn hiệu lực</span>';
        }

        return (
          '<div class="card history-card" style="' + cardStyle + '">' +
            '<div class="card-body">' +
              '<div class="d-flex justify-content-between align-items-start mb-2">' +
                '<div>' +
                  '<div class="history-title">' +
                    '<span class="ion-ios-map mr-1" style="color:#F96D00"></span>' + (tour.title || t('pj.tourPrefix') + b.tourId) +
                  '</div>' +
                  '<div class="history-meta">' +
                    '<span class="ion-ios-location mr-1"></span>' + (tour.location || '-') +
                    (tour.duration ? ' &bull; ' + tour.duration : '') +
                  '</div>' +
                '</div>' +
                '<div class="text-right">' +
                  displayStatus +
                '</div>' +
              '</div>' +
              '<div class="row history-meta mt-2">' +
                '<div class="col-6 col-md-3 mb-2"><strong>' + t('pj.departure') + '</strong><br>' + fmtDate(b.bookingDate) + '</div>' +
                '<div class="col-6 col-md-3 mb-2"><strong>' + t('pj.numGuests') + '</strong><br>' + b.guests + ' ' + t('pj.peopleWord') + '</div>' +
                '<div class="col-6 col-md-3 mb-2"><strong>' + t('pj.total') + '</strong><br><span style="color:#F96D00;font-weight:600">' + fmt(b.totalPrice) + '</span></div>' +
                '<div class="col-6 col-md-3 mb-2"><strong>' + t('pj.bookDate') + '</strong><br>' + fmtDate(b.createdAt) + '</div>' +
              '</div>' +
              '<div class="d-flex justify-content-between align-items-center mt-1">' +
                '<small class="text-muted">' + t('pj.bookedOn') + ' ' + fmtDate(b.createdAt) + '</small>' +
                '<div style="gap:6px" class="d-flex">' +
                  '<button class="btn btn-outline-warning btn-sm btn-view-tour" data-id="' + b.id + '">' + t('pf.viewDetails') + '</button>' +
                '</div>' +
              '</div>' +
            '</div>' +
          '</div>'
        );
      }).join('');

      // View Details handlers
      container.querySelectorAll('.btn-view-tour').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var id = parseInt(this.dataset.id, 10);
          showBookingDetails(id, 'tour');
        });
      });

      container.querySelectorAll('.btn-cancel-tour').forEach(function (btn) {
        btn.addEventListener('click', async function () {
          const confirmed = await window.CustomAlert.confirm(t('pj.cancelConfirmTour'));
          if (!confirmed) return;
          var id = this.dataset.id;
          var self = this;
          self.disabled = true; self.textContent = t('pj.cancelling');
          api.authPut('/tour-bookings/' + id + '/cancel', {}).then(function (res) {
            if (res.success) { loaded['tour-bookings'] = false; loadTourBookings(); }
            else { window.CustomAlert.alert(res.message || t('pj.cancelFail')); self.disabled = false; self.textContent = t('pj.cancelTour'); }
          }).catch(function () { window.CustomAlert.alert(t('pj.connShort')); self.disabled = false; self.textContent = t('pj.cancelTour'); });
        });
      });
    }).catch(function () {
      container.innerHTML = '<p class="text-danger">' + t('tours.loadFail') + '</p>';
    });
  }

  // ── Payment history ───────────────────────────────────────────────────────

  function loadPayments() {
    var container = document.getElementById('payments-list');
    api.authGet('/payments/my?limit=50').then(function (res) {
      var list = res.success ? res.data : [];
      var badge = document.getElementById('badge-payment');
      if (list.length) { badge.textContent = list.length; badge.style.display = ''; }

      if (!list.length) {
        container.innerHTML = emptyState('ion-ios-card', t('pj.emptyPayment'));
        return;
      }

      container.innerHTML = list.map(function (p) {
        var typeInfo = BOOKING_TYPE_LABEL[p.bookingType] || { label: p.bookingType, icon: 'ion-ios-card' };

        // Build detail line based on booking type
        var detail = '';
        if (p.booking && p.booking.room) {
          detail = (p.booking.room.name || '') + (p.booking.room.hotel ? ' — ' + p.booking.room.hotel.name : '');
        } else if (p.tourBooking && p.tourBooking.tour) {
          detail = p.tourBooking.tour.title + ' &bull; ' + fmtDate(p.tourBooking.bookingDate);
        } else if (p.voucherOrder && p.voucherOrder.voucher) {
          detail = p.voucherOrder.voucher.title + ' — ' + p.voucherOrder.voucher.resortName;
        } else if (p.bookingType === 'APARTMENT') {
          detail = t('pj.aptBookingLabel');
        }

        return (
          '<div class="card history-card">' +
            '<div class="card-body">' +
              '<div class="d-flex justify-content-between align-items-start mb-2">' +
                '<div>' +
                  '<div class="history-title">' +
                    '<span class="' + typeInfo.icon + ' mr-1" style="color:#F96D00"></span>' + typeInfo.label +
                  '</div>' +
                  (detail ? '<div class="history-meta">' + detail + '</div>' : '') +
                '</div>' +
                '<div class="text-right">' + statusBadge(p.status) + '</div>' +
              '</div>' +
              '<div class="row history-meta mt-2">' +
                '<div class="col-6 col-md-3 mb-2"><strong>' + t('pj.txId') + '</strong><br><code style="font-size:11px">' + (p.transactionId || '-').substring(0, 16) + '...</code></div>' +
                '<div class="col-6 col-md-3 mb-2"><strong>' + t('pj.methodLabel') + '</strong><br>' + (METHOD_LABEL[p.method] || p.method) + '</div>' +
                '<div class="col-6 col-md-3 mb-2"><strong>' + t('pj.amount') + '</strong><br><span style="color:#F96D00;font-weight:600">' + fmt(p.amount) + '</span></div>' +
                '<div class="col-6 col-md-3 mb-2"><strong>' + t('pj.time') + '</strong><br>' + fmtDateTime(p.paidAt || p.createdAt) + '</div>' +
              '</div>' +
            '</div>' +
          '</div>'
        );
      }).join('');
    }).catch(function () {
      container.innerHTML = '<p class="text-danger">' + t('tours.loadFail') + '</p>';
    });
  }

  // ── Voucher history ───────────────────────────────────────────────────────

  function loadVouchers() {
    var container = document.getElementById('vouchers-list');
    api.authGet('/voucher-orders/my?limit=50').then(function (res) {
      var list = res.success ? res.data : [];
      
      var now = new Date().getTime();
      list = list.filter(function(order) {
        if (order.status === 'PENDING_PAYMENT') {
          var createdTime = new Date(order.createdAt).getTime();
          if (now - createdTime > 10 * 60 * 1000) return false;
        }
        return true;
      });
      
      voucherOrders = list;
      var badge = document.getElementById('badge-voucher');
      if (list.length) { badge.textContent = list.length; badge.style.display = ''; }

      if (!list.length) {
        container.innerHTML = emptyState('ion-ios-pricetag', t('pj.emptyVoucher'));
        return;
      }

      container.innerHTML = list.map(function (order) {
        var v = order.voucher || {};
        var s = STATUS_LABEL[order.status] || { label: order.status, cls: 'secondary' };
        var canPay    = order.status === 'PENDING_PAYMENT';
        var hasCode   = !!order.voucherCode;
        var isExpired = v.validUntil && new Date(v.validUntil).getTime() < new Date().getTime();
        var cardStyle = isExpired ? ' opacity: 0.6;' : '';
        
        var displayStatus = '';
        if (order.status === 'cancelled' || order.status === 'CANCELLED') {
          displayStatus = '<span class="badge badge-danger">Đã hủy</span>';
        } else if (isExpired) {
          displayStatus = '<span class="badge badge-secondary">Hết hiệu lực</span>';
        } else {
          displayStatus = '<span class="badge badge-success">Còn hiệu lực</span>';
        }

        return (
          '<div class="card history-card" style="' + cardStyle + '">' +
            '<div class="card-body">' +
              '<div class="d-flex justify-content-between align-items-start mb-2">' +
                '<div>' +
                  '<div class="history-title">' +
                    '<span class="ion-ios-pricetag mr-1" style="color:#F96D00"></span>' + (v.title || 'Voucher') +
                  '</div>' +
                  '<div class="history-meta"><span class="ion-ios-business mr-1"></span>' + (v.resortName || '') + '</div>' +
                '</div>' +
                '<div class="text-right">' + displayStatus + '</div>' +
              '</div>' +
              '<div class="row history-meta mt-2">' +
                '<div class="col-6 col-md-3 mb-2"><strong>' + t('pj.quantity') + '</strong><br>' + order.quantity + ' ' + t('v.voucherWord') + '</div>' +
                '<div class="col-6 col-md-3 mb-2"><strong>' + t('pj.total') + '</strong><br><span style="color:#F96D00;font-weight:600">' + fmt(order.totalPrice) + '</span></div>' +
                '<div class="col-6 col-md-3 mb-2"><strong>' + t('pj.purchaseDate') + '</strong><br>' + fmtDate(order.createdAt) + '</div>' +
                '<div class="col-6 col-md-3 mb-2"><strong>' + t('pj.expiry') + '</strong><br>' + (v.validUntil ? fmtDate(v.validUntil) : '-') + '</div>' +
              '</div>' +
              '<div class="d-flex justify-content-between align-items-center mt-1">' +
                '<small class="text-muted"></small>' +
                '<div style="gap:6px" class="d-flex">' +
                  '<button class="btn btn-outline-warning btn-sm btn-view-voucher" data-id="' + order.id + '">' + t('pf.viewDetails') + '</button>' +
                  (canPay ? '<a href="vouchers.html" class="btn btn-success btn-sm"><span class="ion-ios-card"></span> ' + t('v.payNow') + '</a>' : '') +
                '</div>' +
              '</div>' +
            '</div>' +
          '</div>'
        );
      }).join('');
      
      container.querySelectorAll('.btn-view-voucher').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var id = this.dataset.id;
          showBookingDetails(id, 'voucher');
        });
      });
    }).catch(function () {
      container.innerHTML = '<p class="text-danger">' + t('tours.loadFail') + '</p>';
    });
  }

  function showBookingDetails(id, type) {
    $('#bookingDetailModal').modal('show');

    var detailBody = document.getElementById('booking-detail-body');
    var qrImg = document.getElementById('detail-modal-qr');
    var qrLoading = document.getElementById('detail-qr-loading');

    qrImg.style.display = 'none';
    qrLoading.style.display = 'inline-block';
    qrLoading.innerHTML = '<span class="spinner-border spinner-border-sm text-warning" role="status"></span>';
    detailBody.innerHTML = '<div class="text-center py-3"><span class="spinner-border spinner-border-sm text-warning"></span> ' + t('common.loading') + '</div>';

    var booking = null;
    var qrEndpoint = '';

    if (type === 'hotel') {
      booking = hotelBookings.find(function (b) { return b.id === id; });
      qrEndpoint = '/hotel-bookings/' + id + '/qr';
    } else if (type === 'apt') {
      booking = apartmentBookings.find(function (b) { return String(b.id) === String(id); });
      qrEndpoint = '/bookings/apartment/' + id + '/qr';
    } else if (type === 'tour') {
      booking = tourBookings.find(function (b) { return b.id === id; });
      qrEndpoint = '/tour-bookings/' + id + '/qr';
    } else if (type === 'voucher') {
      booking = voucherOrders.find(function (b) { return String(b.id) === String(id); });
      qrEndpoint = '/voucher-orders/' + id + '/qr';
    }

    if (!booking) {
      detailBody.innerHTML = '<div class="alert alert-danger">Không tìm thấy thông tin chi tiết / Detail not found</div>';
      qrLoading.style.display = 'none';
      return;
    }

    // Tải thông tin thanh toán của khách hàng để lấy thời gian thanh toán thực tế
    api.authGet('/payments/my?limit=100').then(function (res) {
      var paymentsList = res.success ? res.data : [];
      var match = paymentsList.find(function (p) {
        var statusStr = (p.status || '').toLowerCase();
        if (statusStr !== 'completed' && statusStr !== 'paid') return false;
        if (type === 'hotel') {
          return String(p.bookingId) === String(id) && p.bookingType === 'HOTEL';
        } else if (type === 'apt') {
          return String(p.apartmentBookingId) === String(id) && p.bookingType === 'APARTMENT';
        } else if (type === 'tour') {
          return String(p.tourBookingId) === String(id) && p.bookingType === 'TOUR';
        } else if (type === 'voucher') {
          return String(p.voucherOrderId) === String(id) && p.bookingType === 'VOUCHER';
        }
        return false;
      });

      var paymentTimeStr = match ? fmtDateTime(match.paidAt || match.createdAt) : null;

      // Render details
      var html = '';
      if (type === 'hotel') {
        var room = booking.room || {};
        var hotel = room.hotel || {};
        html = 
          // Section 1: Hóa đơn & Đơn hàng
          '<div class="detail-card-section">' +
            '<div class="detail-section-title"><span class="ion-ios-barcode mr-2"></span>Thông tin giao dịch</div>' +
            '<div class="booking-details-grid">' +
              '<div class="detail-field">' +
                '<span class="detail-field-label">Mã đặt phòng / Booking ID</span>' +
                '<strong class="detail-field-value text-primary">#' + booking.id + '</strong>' +
              '</div>' +
              '<div class="detail-field">' +
                '<span class="detail-field-label">Trạng thái / Status</span>' +
                '<div class="mt-1">' + statusBadge(booking.status) + ' ' + statusBadge(booking.paymentStatus) + '</div>' +
              '</div>' +
              '<div class="detail-field">' +
                '<span class="detail-field-label">Tổng thanh toán / Total Price</span>' +
                '<strong class="detail-field-value text-danger" style="font-size: 16px;">' + fmt(booking.totalPrice) + '</strong>' +
              '</div>' +
              (paymentTimeStr ? 
              '<div class="detail-field">' +
                '<span class="detail-field-label">Thời gian thanh toán / Payment Time</span>' +
                '<strong class="detail-field-value text-success"><span class="ion-ios-checkmark-circle mr-1"></span>' + paymentTimeStr + '</strong>' +
              '</div>' : '') +
            '</div>' +
          '</div>' +
          
          // Section 2: Khách sạn & Phòng
          '<div class="detail-card-section">' +
            '<div class="detail-section-title"><span class="ion-ios-bed mr-2"></span>Dịch vụ lưu trú</div>' +
            '<div class="detail-field mb-3">' +
              '<span class="detail-field-label">Khách sạn / Hotel</span>' +
              '<strong class="detail-field-value text-dark">' + (hotel.name || 'N/A') + '</strong>' +
              (hotel.location ? '<span class="text-muted small d-block mt-1"><span class="ion-ios-pin mr-1"></span>' + hotel.location + '</span>' : '') +
            '</div>' +
            '<div class="detail-field mb-3">' +
              '<span class="detail-field-label">Phòng / Room</span>' +
              '<strong class="detail-field-value text-dark">' + (room.name || 'N/A') + '</strong>' +
            '</div>' +
            '<div class="booking-details-grid">' +
              '<div class="detail-field">' +
                '<span class="detail-field-label">Nhận phòng / Check-in</span>' +
                '<strong class="detail-field-value text-dark">' + fmtDate(booking.checkIn) + '</strong>' +
              '</div>' +
              '<div class="detail-field">' +
                '<span class="detail-field-label">Trả phòng / Check-out</span>' +
                '<strong class="detail-field-value text-dark">' + fmtDate(booking.checkOut) + '</strong>' +
              '</div>' +
              '<div class="detail-field">' +
                '<span class="detail-field-label">Số khách / Guests</span>' +
                '<strong class="detail-field-value text-dark">' + booking.guests + ' khách</strong>' +
              '</div>' +
            '</div>' +
          '</div>' +
          
          // Section 3: Khách hàng
          '<div class="detail-card-section">' +
            '<div class="detail-section-title"><span class="ion-ios-contact mr-2"></span>Thông tin liên hệ</div>' +
            '<div class="booking-details-grid">' +
              '<div class="detail-field">' +
                '<span class="detail-field-label">Khách hàng / Customer</span>' +
                '<strong class="detail-field-value text-dark">' + (booking.fullName || 'N/A') + '</strong>' +
              '</div>' +
              '<div class="detail-field">' +
                '<span class="detail-field-label">Số điện thoại / Phone</span>' +
                '<strong class="detail-field-value text-dark">' + (booking.phone || 'N/A') + '</strong>' +
              '</div>' +
            '</div>' +
            (booking.notes ? 
              '<div class="detail-field mt-3">' +
                '<span class="detail-field-label">Yêu cầu đặc biệt / Special Requests</span>' +
                '<p class="text-dark mb-0 bg-light p-2 rounded small" style="border: 1px solid #f0f0f0;">' + booking.notes + '</p>' +
              '</div>' : '') +
          '</div>';
      } else if (type === 'apt') {
        var apt = booking.apartment || {};
        html = 
          // Section 1: Hóa đơn & Đơn hàng
          '<div class="detail-card-section">' +
            '<div class="detail-section-title"><span class="ion-ios-barcode mr-2"></span>Thông tin giao dịch</div>' +
            '<div class="booking-details-grid">' +
              '<div class="detail-field">' +
                '<span class="detail-field-label">Mã đặt phòng / Booking ID</span>' +
                '<strong class="detail-field-value text-primary">#' + booking.id + '</strong>' +
              '</div>' +
              '<div class="detail-field">' +
                '<span class="detail-field-label">Trạng thái / Status</span>' +
                '<div class="mt-1">' + statusBadge(booking.status) + ' ' + statusBadge(booking.payment_status) + '</div>' +
              '</div>' +
              '<div class="detail-field">' +
                '<span class="detail-field-label">Tổng thanh toán / Total Price</span>' +
                '<strong class="detail-field-value text-danger" style="font-size: 16px;">' + fmt(booking.total_price) + '</strong>' +
              '</div>' +
              (paymentTimeStr ? 
              '<div class="detail-field">' +
                '<span class="detail-field-label">Thời gian thanh toán / Payment Time</span>' +
                '<strong class="detail-field-value text-success"><span class="ion-ios-checkmark-circle mr-1"></span>' + paymentTimeStr + '</strong>' +
              '</div>' : '') +
            '</div>' +
          '</div>' +
          
          // Section 2: Căn hộ
          '<div class="detail-card-section">' +
            '<div class="detail-section-title"><span class="ion-ios-home mr-2"></span>Dịch vụ căn hộ</div>' +
            '<div class="detail-field mb-3">' +
              '<span class="detail-field-label">Căn hộ / Apartment</span>' +
              '<strong class="detail-field-value text-dark">' + (apt.title || 'N/A') + '</strong>' +
              (apt.location ? '<span class="text-muted small d-block mt-1"><span class="ion-ios-pin mr-1"></span>' + apt.location + '</span>' : '') +
            '</div>' +
            '<div class="booking-details-grid">' +
              '<div class="detail-field">' +
                '<span class="detail-field-label">Nhận phòng / Check-in</span>' +
                '<strong class="detail-field-value text-dark">' + fmtDate(booking.checkin) + '</strong>' +
              '</div>' +
              '<div class="detail-field">' +
                '<span class="detail-field-label">Trả phòng / Check-out</span>' +
                '<strong class="detail-field-value text-dark">' + fmtDate(booking.checkout) + '</strong>' +
              '</div>' +
              '<div class="detail-field">' +
                '<span class="detail-field-label">Số khách / Guests</span>' +
                '<strong class="detail-field-value text-dark">' + booking.guests + ' khách</strong>' +
              '</div>' +
            '</div>' +
          '</div>' +
          
          // Section 3: Khách hàng
          '<div class="detail-card-section">' +
            '<div class="detail-section-title"><span class="ion-ios-contact mr-2"></span>Thông tin liên hệ</div>' +
            '<div class="booking-details-grid">' +
              '<div class="detail-field">' +
                '<span class="detail-field-label">Khách hàng / Customer</span>' +
                '<strong class="detail-field-value text-dark">' + (booking.name || 'N/A') + '</strong>' +
              '</div>' +
              '<div class="detail-field">' +
                '<span class="detail-field-label">Số điện thoại / Phone</span>' +
                '<strong class="detail-field-value text-dark">' + (booking.phone || 'N/A') + '</strong>' +
              '</div>' +
            '</div>' +
          '</div>';
      } else if (type === 'tour') {
        var tour = booking.tour || {};
        html = 
          // Section 1: Hóa đơn & Đơn hàng
          '<div class="detail-card-section">' +
            '<div class="detail-section-title"><span class="ion-ios-barcode mr-2"></span>Thông tin giao dịch</div>' +
            '<div class="booking-details-grid">' +
              '<div class="detail-field">' +
                '<span class="detail-field-label">Mã đặt phòng / Booking ID</span>' +
                '<strong class="detail-field-value text-primary">#' + booking.id + '</strong>' +
              '</div>' +
              '<div class="detail-field">' +
                '<span class="detail-field-label">Trạng thái / Status</span>' +
                '<div class="mt-1">' + statusBadge(booking.status) + ' ' + statusBadge(booking.paymentStatus) + '</div>' +
              '</div>' +
              '<div class="detail-field">' +
                '<span class="detail-field-label">Tổng thanh toán / Total Price</span>' +
                '<strong class="detail-field-value text-danger" style="font-size: 16px;">' + fmt(booking.totalPrice) + '</strong>' +
              '</div>' +
              (paymentTimeStr ? 
              '<div class="detail-field">' +
                '<span class="detail-field-label">Thời gian thanh toán / Payment Time</span>' +
                '<strong class="detail-field-value text-success"><span class="ion-ios-checkmark-circle mr-1"></span>' + paymentTimeStr + '</strong>' +
              '</div>' : '') +
              '<div class="detail-field">' +
                '<span class="detail-field-label">Ngày đặt / Booking Date</span>' +
                '<strong class="detail-field-value text-dark">' + fmtDate(booking.createdAt) + '</strong>' +
              '</div>' +
            '</div>' +
          '</div>' +
          
          // Section 2: Tour du lịch
          '<div class="detail-card-section">' +
            '<div class="detail-section-title"><span class="ion-ios-map mr-2"></span>Thông tin tour du lịch</div>' +
            '<div class="detail-field mb-3">' +
              '<span class="detail-field-label">Tour / Tour</span>' +
              '<strong class="detail-field-value text-dark">' + (tour.title || 'N/A') + '</strong>' +
              (tour.location ? '<span class="text-muted small d-block mt-1"><span class="ion-ios-pin mr-1"></span>' + tour.location + '</span>' : '') +
            '</div>' +
            '<div class="booking-details-grid">' +
              '<div class="detail-field">' +
                '<span class="detail-field-label">Ngày khởi hành / Departure</span>' +
                '<strong class="detail-field-value text-dark">' + fmtDate(booking.bookingDate) + '</strong>' +
              '</div>' +
              '<div class="detail-field">' +
                '<span class="detail-field-label">Số khách / Guests</span>' +
                '<strong class="detail-field-value text-dark">' + booking.guests + ' khách</strong>' +
              '</div>' +
            '</div>' +
          '</div>' +
          
          // Section 3: Khách hàng
          '<div class="detail-card-section">' +
            '<div class="detail-section-title"><span class="ion-ios-contact mr-2"></span>Thông tin liên hệ</div>' +
            '<div class="booking-details-grid">' +
              '<div class="detail-field">' +
                '<span class="detail-field-label">Khách hàng / Customer</span>' +
                '<strong class="detail-field-value text-dark">' + (booking.fullName || 'N/A') + '</strong>' +
              '</div>' +
              '<div class="detail-field">' +
                '<span class="detail-field-label">Số điện thoại / Phone</span>' +
                '<strong class="detail-field-value text-dark">' + (booking.phone || 'N/A') + '</strong>' +
              '</div>' +
            '</div>' +
          '</div>';
      } else if (type === 'voucher') {
        var v = booking.voucher || {};
        html = 
          // Section 1: Hóa đơn & Đơn hàng
          '<div class="detail-card-section">' +
            '<div class="detail-section-title"><span class="ion-ios-barcode mr-2"></span>Thông tin giao dịch</div>' +
            '<div class="booking-details-grid">' +
              '<div class="detail-field">' +
                '<span class="detail-field-label">Mã đơn / Order ID</span>' +
                '<strong class="detail-field-value text-primary">#' + booking.id + '</strong>' +
              '</div>' +
              '<div class="detail-field">' +
                '<span class="detail-field-label">Trạng thái / Status</span>' +
                '<div class="mt-1">' + statusBadge(booking.status) + '</div>' +
              '</div>' +
              '<div class="detail-field">' +
                '<span class="detail-field-label">Tổng thanh toán / Total Price</span>' +
                '<strong class="detail-field-value text-danger" style="font-size: 16px;">' + fmt(booking.totalPrice) + '</strong>' +
              '</div>' +
              (paymentTimeStr ? 
              '<div class="detail-field">' +
                '<span class="detail-field-label">Thời gian thanh toán / Payment Time</span>' +
                '<strong class="detail-field-value text-success"><span class="ion-ios-checkmark-circle mr-1"></span>' + paymentTimeStr + '</strong>' +
              '</div>' : '') +
              '<div class="detail-field">' +
                '<span class="detail-field-label">Ngày mua / Purchase Date</span>' +
                '<strong class="detail-field-value text-dark">' + fmtDate(booking.createdAt) + '</strong>' +
              '</div>' +
            '</div>' +
          '</div>' +
          
          // Section 2: Thông tin Voucher
          '<div class="detail-card-section">' +
            '<div class="detail-section-title"><span class="ion-ios-pricetag mr-2"></span>Thông tin Voucher</div>' +
            '<div class="detail-field mb-3">' +
              '<span class="detail-field-label">Voucher</span>' +
              '<strong class="detail-field-value text-dark">' + (v.title || 'N/A') + '</strong>' +
              (v.resortName ? '<span class="text-muted small d-block mt-1"><span class="ion-ios-business mr-1"></span>' + v.resortName + '</span>' : '') +
            '</div>' +
            '<div class="booking-details-grid">' +
              '<div class="detail-field">' +
                '<span class="detail-field-label">Số lượng / Quantity</span>' +
                '<strong class="detail-field-value text-dark">' + booking.quantity + '</strong>' +
              '</div>' +
              '<div class="detail-field">' +
                '<span class="detail-field-label">Đơn giá / Unit Price</span>' +
                '<strong class="detail-field-value text-dark">' + fmt(v.salePrice || 0) + '</strong>' +
              '</div>' +
              '<div class="detail-field">' +
                '<span class="detail-field-label">Hạn sử dụng / Valid Until</span>' +
                '<strong class="detail-field-value text-dark">' + (v.validUntil ? fmtDate(v.validUntil) : '-') + '</strong>' +
              '</div>' +
            '</div>' +
            ((booking.items && booking.items.length > 0) ? 
              '<div class="mt-4"><h6 class="font-weight-bold mb-3 border-bottom pb-2">Danh sách Mã Voucher</h6>' +
              booking.items.map(function(item, index) {
                return '<div class="d-flex align-items-center mb-3 p-3 bg-light rounded" style="border: 1px dashed #ddd;">' +
                  '<div class="mr-3">' +
                    '<img src="" id="qr-item-' + item.id + '" style="width:80px;height:80px;border-radius:4px;display:none;" alt="QR">' +
                    '<div id="qr-loading-item-' + item.id + '" class="text-center" style="width:80px;height:80px;line-height:80px;"><span class="spinner-border spinner-border-sm text-warning"></span></div>' +
                  '</div>' +
                  '<div>' +
                    '<div class="mb-1"><small class="text-muted">Mã #' + (index + 1) + '</small></div>' +
                    '<div class="mb-1"><strong class="text-primary" style="letter-spacing:1px;font-size:16px;">' + item.voucherCode + '</strong></div>' +
                    '<div>' + statusBadge(item.status) + '</div>' +
                  '</div>' +
                '</div>';
              }).join('') +
              '</div>'
            : '') +
          '</div>' +
          
          // Section 3: Khách hàng
          '<div class="detail-card-section">' +
            '<div class="detail-section-title"><span class="ion-ios-contact mr-2"></span>Thông tin liên hệ</div>' +
            '<div class="booking-details-grid">' +
              '<div class="detail-field">' +
                '<span class="detail-field-label">Khách hàng / Customer</span>' +
                '<strong class="detail-field-value text-dark">' + (booking.fullName || 'N/A') + '</strong>' +
              '</div>' +
              '<div class="detail-field">' +
                '<span class="detail-field-label">Số điện thoại / Phone</span>' +
                '<strong class="detail-field-value text-dark">' + (booking.phone || 'N/A') + '</strong>' +
              '</div>' +
            '</div>' +
          '</div>';
      }

      detailBody.innerHTML = html;

      var qrWrapper = document.getElementById('qr-header-wrapper');
      if (type === 'voucher') {
        if (qrWrapper) qrWrapper.style.display = 'none';
        // Load each item's QR
        if (booking.items && booking.items.length > 0) {
          booking.items.forEach(function(item) {
            api.authGetBlob('/voucher-orders/qr/' + item.voucherCode).then(function(blob) {
              var iImg = document.getElementById('qr-item-' + item.id);
              var iLoading = document.getElementById('qr-loading-item-' + item.id);
              if (iImg && iLoading) {
                iImg.src = URL.createObjectURL(blob);
                iImg.style.display = 'block';
                iLoading.style.display = 'none';
              }
            }).catch(function(err) {
              var iLoading = document.getElementById('qr-loading-item-' + item.id);
              if (iLoading) iLoading.innerHTML = '<span class="text-danger small"><i class="ion-ios-warning"></i> Lỗi</span>';
            });
          });
        }
      } else {
        if (qrWrapper) qrWrapper.style.display = 'block';
        // Load single QR code for hotel/apt/tour
        api.authGetBlob(qrEndpoint).then(function (blob) {
          qrImg.src = URL.createObjectURL(blob);
          qrImg.style.display = 'inline-block';
          qrLoading.style.display = 'none';
        }).catch(function (err) {
          console.error(err);
          qrLoading.innerHTML = '<span class="text-danger small">' + t('v.qrFail') + '</span>';
        });
      }
    }).catch(function (err) {
      console.error(err);
      detailBody.innerHTML = '<div class="alert alert-danger">Lỗi tải dữ liệu chi tiết / error loading details</div>';
      qrLoading.style.display = 'none';
    });
  }
});
