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

  var _config   = null;
  var _injected = false;

  var MODAL_HTML =
    '<style>' +
    '.payment-modal-header { border-bottom: none; padding-bottom: 0; }' +
    '.payment-modal-title { font-weight: 700; font-size: 1.25rem; }' +
    '.receipt-card { background: #fff; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); border-radius: 0.75rem; }' +
    '.receipt-card .border-top { border-top: 1px dashed #e2e8f0 !important; }' +
    '.payment-methods-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }' +
    '.payment-method-card { border: 1px solid #e2e8f0; border-radius: 0.5rem; padding: 12px; cursor: pointer; display: flex; align-items: center; transition: all 0.2s ease; position: relative; background: #fff; }' +
    '.payment-method-card:hover { border-color: #cbd5e1; background: #f8fafc; }' +
    '.payment-method-card.active { border-color: #f96d00; background: #fffaf0; box-shadow: 0 0 0 1px #f96d00; }' +
    '.payment-method-card.active::after { content: "\\f122"; font-family: "Ionicons"; position: absolute; top: 8px; right: 8px; color: #f96d00; font-size: 14px; }' +
    '.payment-icon { width: 32px; height: 32px; border-radius: 4px; display: flex; align-items: center; justify-content: center; background: #f1f5f9; margin-right: 12px; font-size: 18px; color: #475569; }' +
    '.payment-method-card.active .payment-icon { color: #f96d00; background: #ffedd5; }' +
    '.payment-label { font-size: 14px; font-weight: 600; color: #334155; margin: 0; line-height: 1.2; }' +
    '.btn-pay-now { background: linear-gradient(135deg, #f96d00 0%, #e85d00 100%); border: none; border-radius: 0.5rem; font-weight: 600; box-shadow: 0 4px 12px rgba(249, 109, 0, 0.3); transition: all 0.2s ease; color:#fff; }' +
    '.btn-pay-now:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(249, 109, 0, 0.4); color:#fff; }' +
    '.btn-pay-now:disabled { background: #cbd5e1; box-shadow: none; transform: none; color:#fff; }' +
    '.trust-badge { display: flex; align-items: center; justify-content: center; font-size: 12px; color: #64748b; margin-top: 16px; }' +
    '</style>' +
    '<div class="modal fade" id="payModal" tabindex="-1" role="dialog" data-backdrop="static">' +
      '<div class="modal-dialog" role="document">' +
        '<div class="modal-content" style="border-radius:1rem; border:none; box-shadow:0 10px 25px rgba(0,0,0,0.1)">' +
          '<div class="modal-header payment-modal-header">' +
            '<h5 class="modal-title payment-modal-title"><span class="ion-ios-card mr-2" style="color:#f96d00"></span>Thanh toán</h5>' +
            '<button type="button" class="close" id="pay-modal-x"><span>&times;</span></button>' +
          '</div>' +
          '<div class="modal-body px-4 pb-4">' +
            '<div class="receipt-card p-3 mb-4">' +
              '<h6 class="mb-1 font-weight-bold" id="pay-modal-title"></h6>' +
              '<p class="small text-muted mb-2" id="pay-modal-subtitle"></p>' +
              '<div id="pay-modal-breakdown" class="small text-muted mb-2 border-top pt-2 mt-2" style="display:none;"></div>' +
              '<div class="d-flex justify-content-between align-items-center border-top pt-2 mt-2">' +
                '<span class="text-muted font-weight-bold">Tổng tiền:</span>' +
                '<strong style="font-size:20px; color:#f96d00" id="pay-modal-amount"></strong>' +
              '</div>' +
            '</div>' +
            '<div class="form-group mb-4">' +
              '<label class="font-weight-bold mb-3" style="color:#334155">Phương thức thanh toán</label>' +
              '<input type="hidden" id="pay-modal-method" value="bank_transfer">' +
              '<div class="payment-methods-grid">' +
                '<div class="payment-method-card active" data-method="bank_transfer">' +
                  '<div class="payment-icon"><span class="ion-ios-business"></span></div>' +
                  '<p class="payment-label">Chuyển khoản</p>' +
                '</div>' +
                '<div class="payment-method-card" data-method="card">' +
                  '<div class="payment-icon"><span class="ion-ios-card"></span></div>' +
                  '<p class="payment-label">Thẻ tín dụng</p>' +
                '</div>' +
                '<div class="payment-method-card" data-method="momo">' +
                  '<div class="payment-icon"><span class="ion-ios-phone-portrait"></span></div>' +
                  '<p class="payment-label">Ví MoMo</p>' +
                '</div>' +
                '<div class="payment-method-card" data-method="vnpay">' +
                  '<div class="payment-icon"><span class="ion-ios-qr-scanner"></span></div>' +
                  '<p class="payment-label">VNPay</p>' +
                '</div>' +
              '</div>' +
            '</div>' +
            '<button id="pay-modal-btn" class="btn btn-block btn-pay-now py-3" style="font-size:16px"></button>' +
            '<div class="trust-badge">' +
              '<span class="ion-ios-lock mr-1"></span> Môi trường Demo — Thanh toán an toàn và bảo mật' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>' +
    '<div class="modal fade" id="paySuccessModal" tabindex="-1" role="dialog" data-backdrop="static">' +
      '<div class="modal-dialog modal-dialog-centered" role="document">' +
        '<div class="modal-content text-center border-0 p-4" style="border-radius:1.5rem; box-shadow:0 15px 35px rgba(0,0,0,0.2)">' +
          '<div class="modal-body py-5">' +
            '<div class="mb-4 d-inline-flex justify-content-center align-items-center" style="width:90px; height:90px; border-radius:50%; background:#d1e7dd; color:#0f5132;">' +
              '<span style="font-size:48px;" class="ion-ios-checkmark"></span>' +
            '</div>' +
            '<h4 class="font-weight-bold mb-2" style="color:#222">Thanh toán thành công!</h4>' +
            '<p class="text-muted mb-4" id="pay-success-subtitle">Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi.</p>' +
            '<div class="p-4 bg-light rounded text-left mb-4" style="border: 1px dashed #ced4da;">' +
              '<h6 class="font-weight-bold mb-3 pb-2 border-bottom" id="pay-success-title"></h6>' +
              '<div class="d-flex justify-content-between mb-2">' +
                '<span class="text-muted small">Mã giao dịch:</span>' +
                '<code class="text-primary font-weight-bold" id="pay-success-txid"></code>' +
              '</div>' +
              '<div class="d-flex justify-content-between mb-2">' +
                '<span class="text-muted small">Phương thức:</span>' +
                '<span id="pay-success-method" class="font-weight-bold" style="color:#444"></span>' +
              '</div>' +
              '<div class="d-flex justify-content-between mt-3 pt-3 border-top">' +
                '<span class="text-muted font-weight-bold">Tổng tiền:</span>' +
                '<strong class="text-success" style="font-size:20px" id="pay-success-amount"></strong>' +
              '</div>' +
            '</div>' +
            '<p class="small text-muted mb-4"><span class="ion-ios-mail mr-1"></span>Biên lai đã được gửi đến email của bạn.</p>' +
            '<button type="button" id="pay-success-close" class="btn btn-success btn-block py-3 font-weight-bold" style="border-radius:0.75rem; font-size:16px;">Hoàn tất</button>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>';

  function inject() {
    if (_injected) return;
    var wrap = document.createElement('div');
    wrap.innerHTML = MODAL_HTML;
    while (wrap.firstChild) document.body.appendChild(wrap.firstChild);
    _injected = true;

    document.getElementById('pay-modal-x').addEventListener('click', function () {
      $('#payModal').modal('hide');
    });
    document.getElementById('pay-modal-btn').addEventListener('click', handlePay);
    document.getElementById('pay-success-close').addEventListener('click', function () {
      $('#paySuccessModal').modal('hide');
      if (_config && typeof _config.onSuccess === 'function') _config.onSuccess();
      _config = null;
    });

    var methodCards = document.querySelectorAll('.payment-method-card');
    methodCards.forEach(function(card) {
      card.addEventListener('click', function() {
        methodCards.forEach(function(c) { c.classList.remove('active'); });
        this.classList.add('active');
        document.getElementById('pay-modal-method').value = this.getAttribute('data-method');
      });
    });
  }

  function handlePay() {
    var method = document.getElementById('pay-modal-method').value;
    var btn    = document.getElementById('pay-modal-btn');
    btn.disabled = true;
    btn.innerHTML = '<span class="ion-ios-sync"></span> Đang xử lý...';

    function showSuccess(txId) {
      document.getElementById('pay-success-title').textContent    = _config.title || '';
      document.getElementById('pay-success-subtitle').textContent = _config.subtitle || '';
      document.getElementById('pay-success-txid').textContent     = txId;
      document.getElementById('pay-success-method').textContent   = METHOD_LABELS[method] || method;
      document.getElementById('pay-success-amount').textContent   = fmt(_config.amount);
      $('#payModal').modal('hide');
      $('#paySuccessModal').modal('show');
      btn.disabled = false;
      btn.innerHTML = 'Thanh toán ' + fmt(_config.amount);
    }

    function onError(msg) {
      window.CustomAlert.alert(msg || 'Thanh toán thất bại. Vui lòng thử lại.');
      btn.disabled = false;
      btn.innerHTML = 'Thanh toán ' + fmt(_config.amount);
    }

    // Build create payload
    var payload = {
      bookingType: _config.bookingType || 'HOTEL',
      method:      method
    };
    if (_config.bookingId)          payload.bookingId          = _config.bookingId;
    if (_config.tourBookingId)      payload.tourBookingId      = _config.tourBookingId;
    if (_config.apartmentBookingId) payload.apartmentBookingId = _config.apartmentBookingId;
    if (_config.voucherOrderId)     payload.voucherOrderId     = _config.voucherOrderId;
    if (_config.corporateBatchId)   payload.corporateBatchId   = _config.corporateBatchId;
    if (_config.amount)             payload.amount             = _config.amount;

    api.authPost('/payments/create', payload)
      .then(function (res) {
        if (!res.success) throw new Error(res.message || 'Tạo giao dịch thất bại');
        var txId = res.data.transactionId;
        return api.post('/payments/callback', { transactionId: txId, status: 'completed' })
          .then(function (res2) {
            if (!res2.success) throw new Error(res2.message || 'Xác nhận thanh toán thất bại');
            showSuccess(txId);
          });
      })
      .catch(function (err) { onError(err && err.message); });
  }

  window.PaymentModal = {
    show: function (config) {
      _config = config;
      inject();
      document.getElementById('pay-modal-title').textContent    = config.title    || 'Chi tiết dịch vụ';
      document.getElementById('pay-modal-subtitle').textContent = config.subtitle || '';
      document.getElementById('pay-modal-amount').textContent   = fmt(config.amount);
      document.getElementById('pay-modal-method').value         = 'bank_transfer';
      var methodCards = document.querySelectorAll('.payment-method-card');
      if (methodCards.length) {
        methodCards.forEach(function(c) { c.classList.remove('active'); });
        methodCards[0].classList.add('active'); // Mặc định chọn chuyển khoản
      }
      var bdown = document.getElementById('pay-modal-breakdown');
      if (config.breakdown) {
        bdown.style.display = 'block';
        bdown.innerHTML = config.breakdown;
      } else {
        bdown.style.display = 'none';
      }
      var btn = document.getElementById('pay-modal-btn');
      btn.disabled = false;
      btn.innerHTML = 'Thanh toán ' + fmt(config.amount);
      $('#payModal').modal('show');
    }
  };
})();
