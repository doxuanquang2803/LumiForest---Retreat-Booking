(function () {
  'use strict';

  function fmt(amount) {
    return Number(amount).toLocaleString('vi-VN') + ' ₫';
  }

  var METHOD_LABELS = {
    bank_transfer: 'Chuyển khoản ngân hàng',
    card:          'Thẻ tín dụng / Ghi nợ',
    momo:          'Ví MoMo',
    vnpay:         'VNPay'
  };

  document.addEventListener('DOMContentLoaded', function() {
    var paymentDataStr = sessionStorage.getItem('pendingPayment');
    if (!paymentDataStr) {
      window.location.href = 'index.html';
      return;
    }

    var config = JSON.parse(paymentDataStr);

    document.getElementById('pay-title').textContent = config.title || 'Chi tiết thanh toán';
    document.getElementById('pay-subtitle').textContent = config.subtitle || '';
    
    var bdown = document.getElementById('pay-breakdown');
    if (config.breakdown) {
      bdown.style.display = 'block';
      bdown.innerHTML = config.breakdown;
    }

    document.getElementById('pay-amount').textContent = fmt(config.amount);
    
    // Điền thông tin liên hệ đặt chỗ nếu người dùng đã đăng nhập
    if (typeof Auth !== 'undefined') {
      var user = Auth.getUser();
      if (user) {
        var nameEl = document.getElementById('cust-name');
        var emailEl = document.getElementById('cust-email');
        var roleEl = document.getElementById('cust-role');
        if (nameEl) nameEl.value = user.name || user.fullName || '';
        if (emailEl) emailEl.value = user.email || '';
        if (roleEl) roleEl.value = user.role === 'ADMIN' ? 'Quản trị viên' : (user.role === 'STAFF' ? 'Nhân viên' : 'Khách hàng');
      } else {
        var block = document.getElementById('contact-info-block');
        if (block) block.style.display = 'none';
      }
    }
    
    var btn = document.getElementById('pay-btn');
    btn.innerHTML = 'Thanh toán ' + fmt(config.amount);

    var methodCards = document.querySelectorAll('.payment-method-card');
    methodCards.forEach(function(card) {
      card.addEventListener('click', function() {
        methodCards.forEach(function(c) { c.classList.remove('active'); });
        this.classList.add('active');
        document.getElementById('pay-method').value = this.getAttribute('data-method');
      });
    });

    btn.addEventListener('click', function() {
      var method = document.getElementById('pay-method').value;
      btn.disabled = true;
      btn.innerHTML = '<span class="ion-ios-sync"></span> Đang xử lý...';

      var payload = {
        bookingType: config.bookingType || 'HOTEL',
        method: method
      };
      if (config.bookingId) payload.bookingId = config.bookingId;
      if (config.tourBookingId) payload.tourBookingId = config.tourBookingId;
      if (config.apartmentBookingId) payload.apartmentBookingId = config.apartmentBookingId;
      if (config.voucherOrderId) payload.voucherOrderId = config.voucherOrderId;
      if (config.corporateBatchId) payload.corporateBatchId = config.corporateBatchId;
      if (config.amount) payload.amount = config.amount;

      api.authPost('/payments/create', payload)
        .then(function (res) {
          if (!res.success) throw new Error(res.message || 'Tạo giao dịch thất bại');
          var txId = res.data.transactionId;
          return api.post('/payments/callback', { transactionId: txId, status: 'completed' })
            .then(function (res2) {
              if (!res2.success) throw new Error(res2.message || 'Xác nhận thanh toán thất bại');
              
              // Remove pending payment to avoid resubmission
              sessionStorage.removeItem('pendingPayment');

              // Show success view
              document.getElementById('payment-form-view').style.display = 'none';
              
              if (typeof $ !== 'undefined') {
                $('#paymentSuccessModal').modal({ backdrop: 'static', keyboard: false });
                $('#paymentSuccessModal').modal('show');
              }
              
              document.getElementById('pay-success-title').textContent = config.title || 'Thanh toán thành công';
              document.getElementById('pay-success-subtitle').textContent = config.subtitle || '';
              document.getElementById('pay-success-txid').textContent = txId;
              
              // Thiết lập thời gian thanh toán hiện tại
              var now = new Date();
              var timeStr = now.toLocaleTimeString('vi-VN') + ' ' + now.toLocaleDateString('vi-VN');
              document.getElementById('pay-success-time').textContent = timeStr;

              // Thiết lập liên kết động đến đúng tab lịch sử đặt chỗ trên trang profile
              var historyBtn = document.getElementById('pay-success-history-btn');
              if (historyBtn) {
                var tab = 'hotel-bookings';
                if (config.bookingType === 'APARTMENT') tab = 'apartment-bookings';
                else if (config.bookingType === 'TOUR') tab = 'tour-bookings';
                else if (config.bookingType === 'VOUCHER') tab = 'vouchers';
                historyBtn.setAttribute('href', 'profile.html#' + tab);
              }

              document.getElementById('pay-success-method').textContent = METHOD_LABELS[method] || method;
              document.getElementById('pay-success-amount').textContent = fmt(config.amount);
              
              // Handle close button
              var closeBtn = document.getElementById('btn-close-success');
              if (closeBtn) {
                closeBtn.addEventListener('click', function() {
                  window.location.href = 'index.html';
                });
              }

              // Cuộn lên đầu trang
              window.scrollTo(0, 0);
            });
        })
        .catch(function (err) {
          window.CustomAlert.alert(err && err.message ? err.message : 'Thanh toán thất bại. Vui lòng thử lại.');
          btn.disabled = false;
          btn.innerHTML = 'Thanh toán ' + fmt(config.amount);
        });
    });
  });

  // document.addEventListener('i18n:changed', function () { location.reload(); });

})();
