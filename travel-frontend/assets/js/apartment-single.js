document.addEventListener('DOMContentLoaded', function () {
  var params = new URLSearchParams(window.location.search);
  var aptId  = params.get('id');
  var _currentApt = null;

  if (!aptId) {
    document.getElementById('apt-detail-content').innerHTML =
      '<p class="text-danger">' + t('as.notFound') + ' <a href="apartments.html">' + t('ts.back') + '</a></p>';
    return;
  }

  function formatPrice(p) { return Number(p).toLocaleString('vi-VN') + ' ₫'; }

  function makeBeforeShowDay(bookedRanges) {
    return function(date) {
      var y = date.getFullYear();
      var m = ('0' + (date.getMonth() + 1)).slice(-2);
      var d = ('0' + date.getDate()).slice(-2);
      var currentStr = y + '-' + m + '-' + d;
      
      for (var i = 0; i < bookedRanges.length; i++) {
        var startStr = bookedRanges[i].checkIn;
        var endStr   = bookedRanges[i].checkOut;
        
        if (currentStr >= startStr && currentStr < endStr) {
          return {
            enabled: false,
            classes: 'disabled-booked',
            tooltip: 'Đã được đặt trước'
          };
        }
      }
      return { enabled: true };
    };
  }

  function activateAnimate(root) {
    (root || document).querySelectorAll('.ftco-animate').forEach(function (el) {
      el.classList.add('ftco-animated', 'fadeInUp');
    });
    if (typeof Waypoint !== 'undefined') Waypoint.refreshAll();
  }

  function getImages(apt) {
    var seen = {}, imgs = [];
    if (apt.images && apt.images.length) {
      apt.images.forEach(function (img) {
        var u = api.resolveUrl(img.imageUrl);
        if (u && !seen[u]) { seen[u] = true; imgs.push(u); }
      });
    }
    if (!imgs.length && apt.thumbnail) imgs.push(api.resolveUrl(apt.thumbnail));
    if (!imgs.length) imgs.push('assets/images/image_1.jpg');
    return imgs;
  }

  function updatePricePreview(price) {
    var cin  = document.getElementById('booking-checkin');
    var cout = document.getElementById('booking-checkout');
    var prev = document.getElementById('booking-price-preview');
    if (!cin || !cout || !prev) return;

    function refresh() {
      prev.style.display = 'none';
    }

    cin.addEventListener('change', refresh);
    cout.addEventListener('change', refresh);
    if (typeof $ !== 'undefined') {
      $(cin).on('changeDate', refresh);
      $(cout).on('changeDate', refresh);
    }
  }

  api.get('/apartments/' + aptId).then(function (res) {
    if (!res.success || !res.data) {
      document.getElementById('apt-detail-content').innerHTML =
        '<p class="text-danger">' + t('as.notFound') + ' <a href="apartments.html">' + t('ts.back') + '</a></p>';
      return;
    }

    var apt = res.data;
    _currentApt = apt;

    // Tiêu đề & breadcrumb
    document.title = apt.title + ' - LumiForest';
    document.getElementById('hero-apt-name').textContent   = apt.title;
    document.getElementById('breadcrumb-name').textContent = apt.title;
    document.getElementById('booking-apt-id').value        = apt.id;

    // Sidebar info
    document.getElementById('sidebar-apt-price').style.display = 'none';
    document.getElementById('info-location').textContent   = apt.location;
    document.getElementById('info-bedrooms').textContent   = apt.bedrooms + ' ' + t('as.bedrooms');
    document.getElementById('info-bathrooms').textContent  = apt.bathrooms + ' ' + t('hs.baths');
    document.getElementById('info-guests').textContent     = apt.maxGuests + ' ' + t('as.people');
    document.getElementById('info-price').textContent      = formatPrice(apt.price) + ' ' + t('common.perNightSlash');

    // Disable form nếu không available
    if (apt.status !== 'available') {
      var btn = document.getElementById('btn-book-submit');
      if (btn) { btn.disabled = true; btn.textContent = t('as.booked'); }
    }

    // Gallery
    var images = getImages(apt);
    var slides = images.map(function (url) {
      return '<div class="item"><div class="room-img" style="background-image:url(\'' + url + '\');"></div></div>';
    }).join('');

    // Info boxes
    var infoBoxes =
      '<div class="d-flex flex-wrap mb-4" style="gap:16px">' +
        '<div class="text-center p-3 border rounded" style="min-width:90px">' +
          '<div style="font-size:26px;color:#F96D00"><span class="ion-ios-bed"></span></div>' +
          '<div style="font-size:20px;font-weight:700">' + apt.bedrooms + '</div>' +
          '<div style="font-size:12px;color:#999">' + t('as.bedroomsLabel') + '</div>' +
        '</div>' +
        '<div class="text-center p-3 border rounded" style="min-width:90px">' +
          '<div style="font-size:26px;color:#F96D00"><span class="ion-ios-water"></span></div>' +
          '<div style="font-size:20px;font-weight:700">' + apt.bathrooms + '</div>' +
          '<div style="font-size:12px;color:#999">' + t('as.bathroomsLabel') + '</div>' +
        '</div>' +
        '<div class="text-center p-3 border rounded" style="min-width:90px">' +
          '<div style="font-size:26px;color:#F96D00"><span class="ion-ios-people"></span></div>' +
          '<div style="font-size:20px;font-weight:700">' + apt.maxGuests + '</div>' +
          '<div style="font-size:12px;color:#999">' + t('ts.maxGuestsLabel') + '</div>' +
        '</div>' +
        '<div class="text-center p-3 border rounded d-none" style="min-width:120px">' +
          '<div style="font-size:26px;color:#F96D00"><span class="ion-ios-pricetag"></span></div>' +
          '<div style="font-size:16px;font-weight:700;color:#F96D00">' + formatPrice(apt.price) + '</div>' +
          '<div style="font-size:12px;color:#999">' + t('common.perNightSlash') + '</div>' +
        '</div>' +
      '</div>';

    // Status alert
    var statusHtml = apt.status !== 'available'
      ? '<div class="alert alert-warning py-2 mb-4" style="font-size:13px"><strong>' + t('as.note') + '</strong> ' + t('as.bookedAlert') + '</div>'
      : '';

    document.getElementById('apt-detail-content').innerHTML =
      '<div class="row">' +
        '<div class="col-md-12 ftco-animate">' +
          '<h2 class="mb-2">' + apt.title + '</h2>' +
          '<p class="mb-3"><small class="text-muted"><span class="ion-ios-location"></span> ' + apt.address + '</small></p>' +
          statusHtml +
          '<div class="single-slider owl-carousel mb-4">' + slides + '</div>' +
        '</div>' +
        '<div class="col-md-12 room-single ftco-animate mb-4">' +
          infoBoxes +
          '<h4 class="mb-3">' + t('as.descTitle') + '</h4>' +
          '<p>' + apt.description + '</p>' +
        '</div>' +
      '</div>';

    setTimeout(function () {
      if (typeof jQuery !== 'undefined' && jQuery.fn.owlCarousel) {
        var $s = jQuery('.single-slider');
        if ($s.length && !$s.hasClass('owl-loaded')) {
          $s.owlCarousel({
            loop: images.length > 1, margin: 0, nav: true, dots: true, items: 1,
            navText: ['<i class="ion-ios-arrow-back"></i>', '<i class="ion-ios-arrow-forward"></i>']
          });
        }
      }
    }, 50);

    activateAnimate(document.getElementById('apt-detail-content'));
    activateAnimate(document.querySelector('.col-lg-4.sidebar'));

    var wishBtn = document.getElementById('btn-wishlist');
    if (wishBtn && window.WishlistBtn) WishlistBtn.init(apt.id, 'APARTMENT', wishBtn);
    updatePricePreview(apt.price);
    loadRecommendations(apt.id, apt.location);

    api.get('/apartments/' + aptId + '/booked-dates').then(function (res2) {
      if (res2.success && res2.data && typeof jQuery !== 'undefined' && jQuery.fn.datepicker) {
        var bookedRanges = res2.data;
        var checkinEl = jQuery('#booking-checkin');
        var checkoutEl = jQuery('#booking-checkout');
        
        if (checkinEl.data('datepicker')) checkinEl.datepicker('remove');
        if (checkoutEl.data('datepicker')) checkoutEl.datepicker('remove');
        
        checkinEl.datepicker({
          format: 'm/d/yyyy',
          autoclose: true,
          beforeShowDay: makeBeforeShowDay(bookedRanges)
        });
        
        checkoutEl.datepicker({
          format: 'm/d/yyyy',
          autoclose: true,
          beforeShowDay: makeBeforeShowDay(bookedRanges)
        });
      }
    }).catch(function () {});

  }).catch(function () {
    document.getElementById('apt-detail-content').innerHTML =
      '<p class="text-danger">' + t('common.connFail') + '</p>';
  });

  function loadRecommendations(id, location) {
    var recContainer = document.getElementById('recommendations-list');
    var recSection   = document.getElementById('recommendations-section');
    if (!recContainer) return;

    api.get('/apartments?limit=4&q=' + encodeURIComponent(location)).then(function (res) {
      if (!res.success || !res.data) return;
      var list = res.data.filter(function (a) { return a.id !== parseInt(id); }).slice(0, 3);
      if (!list.length) { if (recSection) recSection.style.display = 'none'; return; }

      recContainer.innerHTML = list.map(function (apt) {
        var img = apt.thumbnail
          ? api.resolveUrl(apt.thumbnail)
          : (apt.images && apt.images.length ? api.resolveUrl(apt.images[0].imageUrl) : 'assets/images/image_1.jpg');
        return (
          '<div class="col-sm-12 col-md-4 ftco-animate">' +
            '<div class="room">' +
              '<a href="apartment-single.html?id=' + apt.id + '" class="img d-flex justify-content-center align-items-center"' +
                ' style="background-image:url(\'' + img + '\');">' +
                '<div class="icon d-flex justify-content-center align-items-center"><span class="icon-search2"></span></div>' +
              '</a>' +
              '<div class="text p-3 text-center">' +
                '<h3 class="mb-1" style="font-size:15px"><a href="apartment-single.html?id=' + apt.id + '">' + apt.title + '</a></h3>' +
                '<p class="mb-1"><small><span class="ion-ios-location"></span> ' + apt.location + '</small></p>' +
                '<p class="d-none"><span class="price mr-1">' + Number(apt.price).toLocaleString('vi-VN') + ' ₫</span><span class="per">' + t('common.perNightSlash') + '</span></p>' +
              '</div>' +
            '</div>' +
          '</div>'
        );
      }).join('');
      activateAnimate(recContainer);
    }).catch(function () {});
  }

  // document.addEventListener('i18n:changed', function () { location.reload(); });

  // Booking form
  var form = document.getElementById('apt-booking-form');
  if (form) {
    if (typeof Auth !== 'undefined' && Auth.isLoggedIn()) {
      var user = Auth.getUser();
      if (user) {
        var emailInput = form.querySelector('[name=email]');
        if (emailInput && !emailInput.value) emailInput.value = user.email || '';
        var nameInput = form.querySelector('[name=fullName]') || form.querySelector('[name=name]');
        if (nameInput && !nameInput.value) nameInput.value = user.name || user.fullName || '';
        var phoneInput = form.querySelector('[name=phone]');
        if (phoneInput && !phoneInput.value) phoneInput.value = user.phone || '';
      }
    }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!Auth.isLoggedIn()) {
        window.CustomAlert.alert(t('wl.loginToSave') || 'Vui lòng đăng nhập để thực hiện');
        window.location.href = 'login.html';
        return;
      }
      var aptId = document.getElementById('booking-apt-id').value;
      var checkIn  = document.getElementById('booking-checkin').value;
      var checkOut = document.getElementById('booking-checkout').value;

      if (!checkIn || !checkOut) { window.CustomAlert.alert(t('as.selectDates')); return; }

      var btn = document.getElementById('btn-book-submit');
      btn.disabled = true;
      btn.textContent = t('hs.sending');

      var data = {
        item_id:  aptId,
        name:     form.querySelector('[name=fullName]').value,
        email:    form.querySelector('[name=email]').value,
        phone:    form.querySelector('[name=phone]').value,
        checkin:  checkIn,
        checkout: checkOut,
        guests:   parseInt(form.querySelector('[name=guests]').value) || 1
      };

      api.authPost('/bookings/apartment', data).then(function (res) {
        if (res.success) {
          var booking = res.data;
          var d1 = new Date(checkIn), d2 = new Date(checkOut);
          var nights = Math.ceil((d2 - d1) / 86400000);
          var total  = _currentApt ? _currentApt.price * nights : 0;
          var bdown = _currentApt ?
            '<div class="d-flex justify-content-between mb-1"><span>Đơn giá:</span> <span>' + formatPrice(_currentApt.price) + ' / đêm</span></div>' +
            '<div class="d-flex justify-content-between mb-1"><span>Số đêm:</span> <span>' + nights + '</span></div>' : '';

          sessionStorage.setItem('pendingPayment', JSON.stringify({
            title:              _currentApt ? _currentApt.title : t('as.bookApt'),
            subtitle:           checkIn + ' → ' + checkOut,
            breakdown:          bdown,
            amount:             total,
            bookingType:        'APARTMENT',
            apartmentBookingId: booking ? booking.id : null
          }));
          window.location.href = 'payment.html';
        } else {
          var msg = res.message || t('as.bookFail');
          if (res.errors && res.errors.length) {
            msg += '\n' + res.errors.map(function (e) { return '• ' + e.message; }).join('\n');
          }
          window.CustomAlert.alert(msg);
        }
      }).catch(function () {
        window.CustomAlert.alert(t('common.connFail'));
      }).finally(function () {
        btn.disabled = false;
        btn.textContent = t('as.bookNow');
      });
    });
  }
});
