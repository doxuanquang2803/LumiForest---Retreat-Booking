(function () {
  'use strict';

  var voucherId = new URLSearchParams(window.location.search).get('id');
  if (!voucherId) {
    window.location.href = 'vouchers.html';
    return;
  }

  function formatPrice(p) {
    return Number(p).toLocaleString('vi-VN') + ' ₫';
  }

  function initCarousel() {
    if (typeof jQuery === 'undefined') return;
    var $slider = jQuery('.single-slider');
    if (!$slider.length) return;
    if ($slider.hasClass('owl-loaded')) $slider.trigger('destroy.owl.carousel');
    $slider.owlCarousel({
      loop: $slider.find('.item').length > 1,
      margin: 0,
      nav: true,
      dots: true,
      items: 1,
      navText: ['<i class="ion-ios-arrow-back"></i>', '<i class="ion-ios-arrow-forward"></i>']
    });
  }

  var currentVoucher = null;

  function loadVoucherDetail() {
    api.get('/vouchers/' + voucherId)
      .then(function (res) {
        if (!res.success) throw new Error(res.message);
        var v = res.data;
        currentVoucher = v;

        document.title = v.title + ' - LumiForest';
        document.getElementById('breadcrumb-name').textContent = v.title;
        document.getElementById('hero-voucher-name').textContent = v.title;
        
        var bg = v.image || 'assets/images/bg_1.jpg';
        document.getElementById('voucher-hero').style.backgroundImage = 'url(' + bg + ')';

        var discount = Math.round((1 - Number(v.salePrice) / Number(v.originalPrice)) * 100);
        var validDate = new Date(v.validUntil).toLocaleDateString('vi-VN', { year: 'numeric', month: 'short', day: 'numeric' });

        document.getElementById('sidebar-valid-date').textContent = validDate;
        document.getElementById('sidebar-remaining').textContent = v.remainingQuantity + ' ' + (window.t ? t('v.voucherWord') : 'voucher(s)');
        
        var priceCont = document.getElementById('sidebar-price-container');
        priceCont.classList.remove('d-none');
        document.getElementById('sidebar-original-price').textContent = formatPrice(v.originalPrice);
        document.getElementById('sidebar-sale-price').textContent = formatPrice(v.salePrice);

        var imageUrls = v.images && v.images.length ? v.images.map(function(img) { return img.imageUrl || img; }) : [v.image || 'assets/images/bg_1.jpg'];
        var gallerySlides = imageUrls.map(function (url) {
          return '<div class="item"><div class="room-img" style="background-image: url(\'' + url + '\'); height: 400px; background-size: cover; background-position: center; border-radius: 8px;"></div></div>';
        }).join('');

        var contentHtml = 
          '<h2 class="mb-4">' + v.title + '</h2>' +
          '<p class="text-muted"><span class="ion-ios-business mr-2"></span> ' + v.resortName + '</p>' +
          '<div class="mb-4"><span class="badge badge-warning p-2" style="font-size:16px;">' + discount + '% OFF</span></div>' +
          '<div class="single-slider owl-carousel mb-4">' + gallerySlides + '</div>' +
          '<div class="content-description" style="font-size:16px; line-height:1.8;">' +
            (v.description ? v.description.replace(/\n/g, '<br>') : '') +
          '</div>';
        
        document.getElementById('voucher-detail-content').innerHTML = contentHtml;
        setTimeout(initCarousel, 50);

        if (v.remainingQuantity <= 0) {
          var btn = document.getElementById('btn-buy-voucher');
          btn.disabled = true;
          btn.textContent = window.t ? t('v.soldOut') : 'Sold Out';
          btn.className = 'btn btn-secondary py-3 px-5 w-100';
        }

      })
      .catch(function () {
        document.getElementById('voucher-detail-content').innerHTML = '<div class="alert alert-danger">' + (window.t ? t('common.connFail') : 'Failed to load details.') + '</div>';
      });
  }

  // document.addEventListener('i18n:changed', function () {
  //   location.reload();
  // });

  // Modal logic similar to vouchers.js
  document.getElementById('btn-buy-voucher').addEventListener('click', function() {
    if (!currentVoucher) return;
    openOrderModal(
      currentVoucher.id,
      currentVoucher.title,
      currentVoucher.resortName,
      parseFloat(currentVoucher.salePrice)
    );
  });

  async function openOrderModal(voucherId, title, resort, unitPrice) {
    if (!Auth.isLoggedIn()) {
      const confirmed = await window.CustomAlert.confirm(window.t ? t('v.loginToBuy') : 'Please login to buy.');
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

    var user = Auth.getUser();
    if (user) {
      document.getElementById('order-fullName').value = user.name || '';
      document.getElementById('order-email').value = user.email || '';
      if (document.getElementById('order-phone')) document.getElementById('order-phone').value = user.phone || '';
    }

    document.getElementById('voucher-order-form').reset();
    document.getElementById('modal-voucher-id').value = voucherId;
    document.getElementById('modal-unit-price-val').value = unitPrice;
    document.getElementById('order-quantity').value = 1;
    document.getElementById('order-total-display').textContent = formatPrice(unitPrice);
    if (user) {
      document.getElementById('order-fullName').value = user.name || '';
      document.getElementById('order-email').value = user.email || '';
      if (document.getElementById('order-phone')) document.getElementById('order-phone').value = user.phone || '';
    }
    document.getElementById('order-voucher-title').textContent = title;
    document.getElementById('order-resort-name').textContent = resort;
    document.getElementById('order-unit-price').textContent = formatPrice(unitPrice);

    document.getElementById('is-corporate').checked = false;
    document.getElementById('personal-fields').style.display = 'block';
    document.getElementById('corporate-fields').style.display = 'none';
    document.getElementById('order-fullName').required = true;
    document.getElementById('order-email').required = true;
    document.getElementById('order-phone').required = true;
    document.getElementById('corporate-excel').required = false;
    document.getElementById('corporate-excel').value = '';

    if (typeof $ !== 'undefined') $('#voucherOrderModal').modal('show');
  }

  document.getElementById('order-quantity').addEventListener('input', function () {
    var qty = parseInt(this.value) || 1;
    var unit = parseFloat(document.getElementById('modal-unit-price-val').value) || 0;
    document.getElementById('order-total-display').textContent = formatPrice(unit * qty);
  });

  document.getElementById('is-corporate').addEventListener('change', function () {
    var isCorp = this.checked;
    document.getElementById('personal-fields').style.display = isCorp ? 'none' : 'block';
    document.getElementById('corporate-fields').style.display = isCorp ? 'block' : 'none';
    
    document.getElementById('order-fullName').required = !isCorp;
    document.getElementById('order-email').required = !isCorp;
    document.getElementById('order-phone').required = !isCorp;
    document.getElementById('corporate-excel').required = isCorp;
  });

  document.getElementById('voucher-order-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var btn = this.querySelector('button[type=submit]');
    var defaultText = btn.textContent;
    btn.disabled = true;
    btn.textContent = window.t ? t('v.processing') : 'Processing...';

    var quantity = parseInt(document.getElementById('order-quantity').value) || 1;
    var isCorp = document.getElementById('is-corporate').checked;

    if (isCorp) {
      var fileInput = document.getElementById('corporate-excel');
      var formData = new FormData();
      formData.append('voucherId', document.getElementById('modal-voucher-id').value);
      formData.append('totalQuantity', quantity);
      if (fileInput.files[0]) {
        formData.append('excel', fileInput.files[0]);
      } else {
        window.CustomAlert.alert('Vui lòng chọn file Excel');
        btn.disabled = false;
        btn.textContent = defaultText;
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
          var msg = err.message || (window.t ? t('common.connFail') : 'Fail');
          if (err.errors) msg += '\n' + err.errors.join('\n');
          window.CustomAlert.alert(msg);
        })
        .finally(function () {
          btn.disabled = false;
          btn.textContent = defaultText;
        });
    } else {
      var data = {
        voucherId: parseInt(document.getElementById('modal-voucher-id').value),
        fullName: document.getElementById('order-fullName').value.trim(),
        email: document.getElementById('order-email').value.trim(),
        phone: document.getElementById('order-phone').value.trim(),
        quantity: quantity
      };

      api.authPost('/voucher-orders', data).then(function (res) {
        if (!res.success) {
          window.CustomAlert.alert(res.message || (window.t ? t('v.orderFail') : 'Order fail'));
          return;
        }
        var order = res.data;
        $('#voucherOrderModal').modal('hide');
        openPayModal(order);
      }).catch(function () {
        window.CustomAlert.alert(window.t ? t('common.connFail') : 'Network error');
      }).finally(function () {
        btn.disabled = false;
        btn.textContent = defaultText;
      });
    }
  });

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
    var defaultHTML = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span class="ion-ios-sync"></span> ' + (window.t ? t('v.processing') : 'Processing...');

    api.authPost('/payments/create', {
      bookingType:   'VOUCHER',
      voucherOrderId: parseInt(orderId),
      method:        method
    }).then(function (res) {
      if (!res.success) throw new Error(res.message || (window.t ? t('v.txFail') : 'Fail'));
      var txId = res.data.transactionId;
      return api.post('/payments/callback', { transactionId: txId, status: 'completed' });
    }).then(function (res) {
      if (!res.success) throw new Error(res.message || (window.t ? t('v.payFail') : 'Fail'));
      var order = res.data.voucherOrder || res.data;
      $('#voucherPayModal').modal('hide');
      showSuccessModal(order);
    }).catch(function (err) {
      window.CustomAlert.alert((err && err.message) || (window.t ? t('common.connFail') : 'Network error'));
    }).finally(function () {
      btn.disabled = false;
      btn.innerHTML = defaultHTML;
    });
  });

  function showSuccessModal(order) {
    document.getElementById('success-voucher-name').textContent = order.voucher ? order.voucher.title : 'Voucher';
    document.getElementById('success-voucher-code').textContent = order.voucherCode;

    var qrImg = document.getElementById('success-qr');
    qrImg.src = '';
    api.authGetBlob('/voucher-orders/' + order.id + '/qr').then(function (blob) {
      qrImg.src = URL.createObjectURL(blob);
    }).catch(function () {
      qrImg.alt = window.t ? t('v.qrFail') : 'QR Fail';
    });

    $('#voucherSuccessModal').modal('show');
  }

  document.getElementById('btn-copy-code').addEventListener('click', function () {
    var code = document.getElementById('success-voucher-code').textContent;
    navigator.clipboard.writeText(code).then(function () {
      var btn = document.getElementById('btn-copy-code');
      btn.innerHTML = '<span class="ion-ios-checkmark"></span>';
      setTimeout(function () { btn.innerHTML = '<span class="ion-ios-copy"></span> Sao chép mã'; }, 1500);
    });
  });

  loadVoucherDetail();

})();
