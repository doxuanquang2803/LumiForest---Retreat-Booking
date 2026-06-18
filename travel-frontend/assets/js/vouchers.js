document.addEventListener('DOMContentLoaded', function () {
  var API_BASE = 'http://localhost:3000/api';

  function formatPrice(price) {
    return Number(price).toLocaleString('vi-VN') + ' ₫';
  }

  // ============================================================
  // Tab switching
  // ============================================================
  var tabBrowse = document.getElementById('tab-browse');
  var tabMy = document.getElementById('tab-my');
  var secBrowse = document.getElementById('sec-browse');
  var secMy = document.getElementById('sec-my');

  tabBrowse.addEventListener('click', function (e) {
    e.preventDefault();
    tabBrowse.classList.add('active');
    tabMy.classList.remove('active');
    secBrowse.style.display = '';
    secMy.style.display = 'none';
  });

  tabMy.addEventListener('click', function (e) {
    e.preventDefault();
    if (!Auth.isLoggedIn()) {
      window.CustomAlert.alert(t('v.loginRequired'));
      window.location.href = 'login.html';
      return;
    }
    tabMy.classList.add('active');
    tabBrowse.classList.remove('active');
    secBrowse.style.display = 'none';
    secMy.style.display = '';
    loadMyVouchers();
  });

  // ============================================================
  // Load danh sách voucher đang bán
  // ============================================================
  function loadVouchers() {
    var container = document.getElementById('vouchers-list');
    container.innerHTML = '<div class="col-12 text-center py-5"><p>' + t('common.loading') + '</p></div>';

    api.get('/vouchers/active').then(function (res) {
      var vouchers = res.success ? res.data : [];
      if (!vouchers.length) {
        container.innerHTML = '<div class="col-12 text-center"><p class="text-muted">' + t('v.none') + '</p></div>';
        return;
      }

      container.innerHTML = vouchers.map(function (v) {
        var discount = Math.round((1 - Number(v.salePrice) / Number(v.originalPrice)) * 100);
        var isSoldOut = v.remainingQuantity <= 0;
        var imgUrl = v.image ? v.image : 'assets/images/image_1.jpg';
        var validDate = new Date(v.validUntil).toLocaleDateString('vi-VN', { year: 'numeric', month: 'short', day: 'numeric' });

        var btn = isSoldOut
          ? '<span class="text-muted">' + t('v.soldOut') + '</span>'
          : '<a href="#" class="btn-custom btn-buy-voucher"' +
              ' data-id="' + v.id + '"' +
              ' data-title="' + encodeURIComponent(v.title) + '"' +
              ' data-resort="' + encodeURIComponent(v.resortName) + '"' +
              ' data-price="' + Number(v.salePrice) + '">' +
              t('v.buyNow') + ' <span class="icon-long-arrow-right"></span>' +
            '</a>';

        return (
          '<div class="col-sm-12 col-md-6 col-lg-4 ftco-animate d-flex">' +
            '<div class="room w-100 d-flex flex-column" style="position:relative">' +
              '<span class="badge badge-warning" style="position:absolute;top:10px;left:10px;z-index:1">' + discount + '% OFF</span>' +
              '<a href="voucher-single.html?id=' + v.id + '" class="img d-flex justify-content-center align-items-center" style="background-image:url(' + imgUrl + ');">' +
                '<div class="icon d-flex justify-content-center align-items-center"><span class="icon-search2"></span></div>' +
              '</a>' +
              '<div class="text p-3 text-center d-flex flex-column flex-grow-1">' +
                '<h3 class="mb-2"><a href="voucher-single.html?id=' + v.id + '">' + v.title + '</a></h3>' +
                '<p class="mb-1"><i class="ion-ios-business"></i> ' + v.resortName + '</p>' +
                '<p class="mb-1 d-none">' +
                  '<del class="text-muted mr-2">' + formatPrice(v.originalPrice) + '</del>' +
                  '<span class="price">' + formatPrice(v.salePrice) + '</span>' +
                '</p>' +
                '<p class="small text-muted mb-2">' + t('v.exp') + ' ' + validDate + ' &bull; ' + t('v.remainingPre') + ' ' + v.remainingQuantity + ' ' + t('v.voucherWord') + '</p>' +
                '<p class="small mb-2 flex-grow-1" style="color:#555">' + (v.description || '') + '</p>' +
                '<hr class="w-100">' +
                '<p class="pt-1 mb-0">' + btn + '</p>' +
              '</div>' +
            '</div>' +
          '</div>'
        );
      }).join('');

      // Kích hoạt animation (ftco-animate mặc định opacity:0 visibility:hidden)
      document.querySelectorAll('#vouchers-list .ftco-animate').forEach(function (el) {
        el.classList.add('ftco-animated', 'fadeInUp');
      });

      // Gán sự kiện cho nút mua
      document.querySelectorAll('.btn-buy-voucher').forEach(function (btn) {
        btn.addEventListener('click', function (e) {
          e.preventDefault();
          openOrderModal(
            this.dataset.id,
            decodeURIComponent(this.dataset.title),
            decodeURIComponent(this.dataset.resort),
            parseFloat(this.dataset.price)
          );
        });
      });

    }).catch(function () {
      document.getElementById('vouchers-list').innerHTML =
        '<div class="col-12"><p class="text-danger">' + t('common.connFail') + '</p></div>';
    });
  }

  document.addEventListener('i18n:changed', function () {
    loadVouchers();
    if (secMy && secMy.style.display !== 'none') loadMyVouchers();
  });

  // ============================================================
  // Modal 1: Form đặt mua
  // ============================================================
  async function openOrderModal(voucherId, title, resort, unitPrice) {
    if (!Auth.isLoggedIn()) {
      const confirmed = await window.CustomAlert.confirm(t('v.loginToBuy'));
      if (confirmed) {
        window.location.href = 'login.html';
      }
      return;
    }

    document.getElementById('modal-voucher-id').value = voucherId;
    document.getElementById('modal-unit-price-val').value = unitPrice;
    document.getElementById('modal-voucher-name').textContent = title;
    document.getElementById('order-voucher-title').textContent = title;
    document.getElementById('order-resort-name').textContent = resort;
    document.getElementById('order-unit-price').textContent = formatPrice(unitPrice);
    document.getElementById('order-quantity').value = 1;
    document.getElementById('order-total-display').textContent = formatPrice(unitPrice);

    // Pre-fill từ thông tin user đã đăng nhập
    var user = Auth.getUser();
    if (user) {
      document.getElementById('order-fullName').value = user.name || '';
      document.getElementById('order-email').value = user.email || '';
    }

    document.getElementById('voucher-order-form').reset();
    // Restore hidden + pre-filled
    document.getElementById('modal-voucher-id').value = voucherId;
    document.getElementById('modal-unit-price-val').value = unitPrice;
    document.getElementById('order-quantity').value = 1;
    document.getElementById('order-total-display').textContent = formatPrice(unitPrice);
    if (user) {
      document.getElementById('order-fullName').value = user.name || '';
      document.getElementById('order-email').value = user.email || '';
    }
    document.getElementById('order-voucher-title').textContent = title;
    document.getElementById('order-resort-name').textContent = resort;
    document.getElementById('order-unit-price').textContent = formatPrice(unitPrice);

    // Reset corporate checkbox and fields
    document.getElementById('is-corporate').checked = false;
    document.getElementById('personal-fields').style.display = 'block';
    document.getElementById('corporate-fields').style.display = 'none';
    document.getElementById('order-fullName').required = true;
    document.getElementById('order-email').required = true;
    document.getElementById('order-phone').required = true;
    document.getElementById('corporate-excel').required = false;
    document.getElementById('corporate-excel').value = '';

    $('#voucherOrderModal').modal('show');
  }

  // Cập nhật tổng tiền khi đổi số lượng
  document.getElementById('order-quantity').addEventListener('input', function () {
    var qty = parseInt(this.value) || 1;
    var unit = parseFloat(document.getElementById('modal-unit-price-val').value) || 0;
    document.getElementById('order-total-display').textContent = formatPrice(unit * qty);
  });

  // Handle Corporate Checkbox Toggle
  document.getElementById('is-corporate').addEventListener('change', function () {
    var isCorp = this.checked;
    document.getElementById('personal-fields').style.display = isCorp ? 'none' : 'block';
    document.getElementById('corporate-fields').style.display = isCorp ? 'block' : 'none';
    
    document.getElementById('order-fullName').required = !isCorp;
    document.getElementById('order-email').required = !isCorp;
    document.getElementById('order-phone').required = !isCorp;
    document.getElementById('corporate-excel').required = isCorp;
  });

  // Submit form tạo đơn hàng
  document.getElementById('voucher-order-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var btn = this.querySelector('button[type=submit]');
    btn.disabled = true;
    btn.textContent = t('v.processing');

    var quantity = parseInt(document.getElementById('order-quantity').value) || 1;
    var isCorp = document.getElementById('is-corporate').checked;

    if (isCorp) {
      // 1. Corporate: Purchase batch and upload excel
      var fileInput = document.getElementById('corporate-excel');
      var formData = new FormData();
      formData.append('voucherId', document.getElementById('modal-voucher-id').value);
      formData.append('totalQuantity', quantity);
      if (fileInput.files[0]) {
        formData.append('excel', fileInput.files[0]);
      } else {
        window.CustomAlert.alert('Vui lòng chọn file Excel');
        btn.disabled = false;
        btn.textContent = t('v.continueBuy');
        return;
      }
      
      api.authPostFormData('/corporate-vouchers/purchase', formData)
        .then(function (res) {
          if (!res.success) throw new Error(res.message || 'Lỗi khi tạo lô voucher');
          var batch = res.data;
          batch.voucher = { title: document.getElementById('modal-voucher-name').textContent, resortName: document.getElementById('order-resort-name').textContent };
          
          $('#voucherOrderModal').modal('hide');
          openPayModal(batch, 'CORPORATE_BATCH');
        })
        .catch(function (err) {
          var msg = err.message || t('common.connFail');
          if (err.errors) msg += '\n' + err.errors.join('\n');
          window.CustomAlert.alert(msg);
        })
        .finally(function () {
          btn.disabled = false;
          btn.textContent = t('v.continueBuy');
        });
    } else {
      // Normal purchase
      var data = {
        voucherId: parseInt(document.getElementById('modal-voucher-id').value),
        fullName: document.getElementById('order-fullName').value.trim(),
        email: document.getElementById('order-email').value.trim(),
        phone: document.getElementById('order-phone').value.trim(),
        quantity: quantity
      };

      api.authPost('/voucher-orders', data).then(function (res) {
        if (!res.success) {
          window.CustomAlert.alert(res.message || t('v.orderFail'));
          return;
        }
        var order = res.data;
        $('#voucherOrderModal').modal('hide');
        openPayModal(order);
      }).catch(function () {
        window.CustomAlert.alert(t('common.connFail'));
      }).finally(function () {
        btn.disabled = false;
        btn.textContent = t('v.continueBuy');
      });
    }
  });

  // ============================================================
  // Modal 2: Thanh toán
  // ============================================================
  function openPayModal(order, bookingType) {
    var type = bookingType || 'VOUCHER';
    var title = order.voucher ? order.voucher.title : 'Voucher';
    if (type === 'CORPORATE_BATCH') {
      title = 'Lô Voucher: ' + title;
    }
    var resort = order.voucher ? order.voucher.resortName : '';
    var quantity = order.quantity || order.totalQuantity || 1;
    var bdown = 
      '<div class="d-flex justify-content-between mb-1"><span>Số lượng:</span> <span>' + quantity + '</span></div>' +
      (type === 'CORPORATE_BATCH' ? '<div class="d-flex justify-content-between mb-1"><span class="badge badge-primary">Mua cho doanh nghiệp</span></div>' : '');
      
    var paymentData = {
      title: title,
      subtitle: resort,
      breakdown: bdown,
      amount: order.totalPrice,
      bookingType: type,
    };

    if (type === 'CORPORATE_BATCH') {
      paymentData.corporateBatchId = order.id;
    } else {
      paymentData.voucherOrderId = order.id;
    }

    sessionStorage.setItem('pendingPayment', JSON.stringify(paymentData));
    window.location.href = 'payment.html';
  }

  document.getElementById('btn-confirm-pay').addEventListener('click', function () {
    var orderId = document.getElementById('pay-order-id').value;
    var method  = document.getElementById('pay-method').value;
    var btn = this;
    btn.disabled = true;
    btn.innerHTML = '<span class="ion-ios-sync"></span> ' + t('v.processing');

    api.authPost('/payments/create', {
      bookingType:   'VOUCHER',
      voucherOrderId: parseInt(orderId),
      method:        method
    }).then(function (res) {
      if (!res.success) throw new Error(res.message || t('v.txFail'));
      var txId = res.data.transactionId;
      return api.post('/payments/callback', { transactionId: txId, status: 'completed' });
    }).then(function (res) {
      if (!res.success) throw new Error(res.message || t('v.payFail'));
      var order = res.data.voucherOrder || res.data;
      $('#voucherPayModal').modal('hide');
      showSuccessModal(order);
    }).catch(function (err) {
      window.CustomAlert.alert((err && err.message) || t('common.connFail'));
    }).finally(function () {
      btn.disabled = false;
      btn.innerHTML = '<span class="ion-ios-card"></span> ' + t('v.payNow');
    });
  });

  // ============================================================
  // Modal 3: Thành công
  // ============================================================
  function showSuccessModal(order) {
    document.getElementById('success-voucher-name').textContent = order.voucher ? order.voucher.title : 'Voucher';
    document.getElementById('success-voucher-code').textContent = order.voucherCode;

    var qrImg = document.getElementById('success-qr');
    qrImg.src = '';
    api.authGetBlob('/voucher-orders/' + order.id + '/qr').then(function (blob) {
      qrImg.src = URL.createObjectURL(blob);
    }).catch(function () {
      qrImg.alt = t('v.qrFail');
    });

    $('#voucherSuccessModal').modal('show');
  }

  document.getElementById('btn-copy-code').addEventListener('click', function () {
    var code = document.getElementById('success-voucher-code').textContent;
    navigator.clipboard.writeText(code).then(function () {
      var btn = document.getElementById('btn-copy-code');
      btn.innerHTML = '<span class="ion-ios-checkmark"></span>';
      setTimeout(function () { btn.innerHTML = '<span class="ion-ios-copy"></span>'; }, 1500);
    });
  });

  // ============================================================
  // Tab "Voucher của tôi"
  // ============================================================
  function loadMyVouchers() {
    var container = document.getElementById('my-vouchers-list');
    container.innerHTML = '<div class="col-12 text-center py-5"><p>' + t('common.loading') + '</p></div>';

    api.authGet('/voucher-orders/my').then(function (res) {
      var orders = res.success ? res.data : [];
      if (!orders.length) {
        container.innerHTML = '<div class="col-12 text-center py-4"><p class="text-muted">' + t('v.myNone') + '</p></div>';
        return;
      }

      var statusMap = {
        PENDING_PAYMENT: { label: t('v.status.pending'), cls: 'warning' },
        PAID: { label: t('v.status.paid'), cls: 'success' },
        CANCELLED: { label: t('v.status.cancelled'), cls: 'secondary' },
        USED: { label: t('v.status.used'), cls: 'info' },
        EXPIRED: { label: t('v.status.expired'), cls: 'danger' }
      };

      container.innerHTML = orders.map(function (order) {
        var s = statusMap[order.status] || { label: order.status, cls: 'secondary' };
        var title = order.voucher ? order.voucher.title : 'Voucher #' + order.id;
        var resort = order.voucher ? order.voucher.resortName : '';
        var date = new Date(order.createdAt).toLocaleDateString('vi-VN');

        var actionsHtml = '';
        if (order.status === 'PENDING_PAYMENT') {
          actionsHtml =
            '<button class="btn btn-success btn-sm btn-pay-order mr-2" data-id="' + order.id + '" data-order=\'' + JSON.stringify(order) + '\'>' +
              '<span class="ion-ios-card"></span> ' + t('v.pay') +
            '</button>' +
            '<button class="btn btn-outline-secondary btn-sm btn-cancel-order" data-id="' + order.id + '">' +
              t('v.cancel') +
            '</button>';
        }

        var codeHtml = '';
        if (order.voucherCode) {
          codeHtml =
            '<div class="mt-2 p-2 bg-light rounded d-inline-block">' +
              '<small class="text-muted">' + t('v.code') + ' </small>' +
              '<code class="text-primary font-weight-bold">' + order.voucherCode + '</code>' +
            '</div>' +
            '<div class="mt-2">' +
              '<img id="qr-img-' + order.id + '" src="" style="width:70px;height:70px;border:1px solid #ddd;border-radius:4px" alt="QR">' +
            '</div>';
        }

        return (
          '<div class="col-12 mb-3">' +
            '<div class="card border-0 shadow-sm" style="border-radius:10px">' +
              '<div class="card-body p-4">' +
                '<div class="d-flex justify-content-between align-items-start mb-2">' +
                  '<div>' +
                    '<h5 class="mb-0">' + title + '</h5>' +
                    '<p class="text-muted small mb-0"><span class="ion-ios-business"></span> ' + resort + '</p>' +
                  '</div>' +
                  '<span class="badge badge-' + s.cls + ' px-3 py-2">' + s.label + '</span>' +
                '</div>' +
                '<p class="mb-1 small">' +
                  '<strong>' + t('v.qty') + '</strong> ' + order.quantity +
                  ' &nbsp;&bull;&nbsp; <strong>' + t('v.total') + '</strong> ' + formatPrice(order.totalPrice) +
                  ' &nbsp;&bull;&nbsp; <span class="text-muted">' + t('v.purchaseDate') + ' ' + date + '</span>' +
                '</p>' +
                codeHtml +
                (actionsHtml ? '<div class="mt-3">' + actionsHtml + '</div>' : '') +
              '</div>' +
            '</div>' +
          '</div>'
        );
      }).join('');

      // Kích hoạt animation
      container.querySelectorAll('.ftco-animate').forEach(function (el) {
        el.classList.add('ftco-animated', 'fadeInUp');
      });

      // Load QR codes bằng Blob vì endpoint yêu cầu xác thực
      orders.forEach(function (order) {
        if (order.voucherCode) {
          api.authGetBlob('/voucher-orders/' + order.id + '/qr').then(function (blob) {
            var img = document.getElementById('qr-img-' + order.id);
            if (img) img.src = URL.createObjectURL(blob);
          }).catch(function () {});
        }
      });

      // Nút thanh toán từ tab "Voucher của tôi"
      container.querySelectorAll('.btn-pay-order').forEach(function (btn) {
        btn.addEventListener('click', function () {
          try {
            var order = JSON.parse(this.dataset.order);
            openPayModal(order);
          } catch (err) {
            window.CustomAlert.alert(t('v.genericErr'));
          }
        });
      });

      // Nút hủy
      container.querySelectorAll('.btn-cancel-order').forEach(function (btn) {
        btn.addEventListener('click', async function () {
          var orderId = this.dataset.id;
          const confirmed = await window.CustomAlert.confirm(t('v.cancelConfirm'));
          if (!confirmed) return;
          var self = this;
          self.disabled = true;
          self.textContent = t('v.cancelling');
          api.authPut('/voucher-orders/' + orderId + '/cancel', {}).then(function (res) {
            if (!res.success) {
              window.CustomAlert.alert(res.message || t('v.cancelFail'));
              self.disabled = false;
              self.textContent = t('v.cancel');
              return;
            }
            loadMyVouchers();
          }).catch(function () {
            window.CustomAlert.alert(t('common.connFail'));
            self.disabled = false;
            self.textContent = t('v.cancel');
          });
        });
      });

    }).catch(function () {
      document.getElementById('my-vouchers-list').innerHTML =
        '<div class="col-12"><p class="text-danger">' + t('v.myLoadFail') + '</p></div>';
    });
  }

  // Sau khi đóng modal success → reload danh sách nếu đang ở tab "my"
  document.getElementById('voucherSuccessModal').addEventListener('hidden.bs.modal', function () {
    if (secMy.style.display !== 'none') loadMyVouchers();
  });

  // ============================================================
  // Khởi tạo
  // ============================================================
  loadVouchers();
});
