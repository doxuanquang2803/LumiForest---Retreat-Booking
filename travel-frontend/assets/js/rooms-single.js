document.addEventListener('DOMContentLoaded', function () {
  var params = new URLSearchParams(window.location.search);
  var roomId = params.get('id');
  var _currentRoom = null;

  if (!roomId) {
    document.getElementById('room-main-content').innerHTML =
      '<p class="text-danger">' + t('rs.notFound') + ' <a href="hotels.html">' + t('ts.back') + '</a></p>';
    return;
  }

  function formatPrice(price) {
    return Number(price).toLocaleString('vi-VN') + ' ₫';
  }

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

  function renderStars(count) {
    var s = '';
    for (var i = 1; i <= 5; i++) {
      s += '<i class="' + (i <= count ? 'icon-star' : 'icon-star-o') + '" style="color:#F96D00"></i>';
    }
    return s;
  }

  function activateAnimate(root) {
    (root || document).querySelectorAll('.ftco-animate').forEach(function (el) {
      el.classList.add('ftco-animated', 'fadeInUp');
    });
    if (typeof Waypoint !== 'undefined') Waypoint.refreshAll();
  }

  function calcNights(checkIn, checkOut) {
    var d1 = new Date(checkIn), d2 = new Date(checkOut);
    if (isNaN(d1) || isNaN(d2) || d2 <= d1) return 0;
    return Math.ceil((d2 - d1) / 86400000);
  }

  // Tính tiền preview khi chọn ngày
  function updatePricePreview(roomPrice) {
    var checkin  = document.getElementById('booking-checkin');
    var checkout = document.getElementById('booking-checkout');
    var preview  = document.getElementById('booking-price-preview');
    if (!checkin || !checkout || !preview) return;

    function refresh() {
      preview.style.display = 'none';
    }

    checkin.addEventListener('change', refresh);
    checkout.addEventListener('change', refresh);
    refresh();
    // datepicker sự kiện
    if (typeof $ !== 'undefined') {
      $(checkin).on('changeDate', refresh);
      $(checkout).on('changeDate', refresh);
    }
  }

  api.get('/rooms/' + roomId).then(function (res) {
    if (!res.success || !res.data) {
      document.getElementById('room-main-content').innerHTML =
        '<p class="text-danger">' + t('rs.notFound') + ' <a href="hotels.html">' + t('ts.back') + '</a></p>';
      return;
    }

    var room  = res.data;
    _currentRoom = room;
    var hotel = room.hotel;

    // Tiêu đề & breadcrumb
    document.title = room.name + ' - LumiForest';
    document.getElementById('hero-room-name').textContent  = room.name;
    document.getElementById('breadcrumb-room').textContent = room.name;
    if (hotel) {
      var hotelLink = document.getElementById('breadcrumb-hotel');
      hotelLink.textContent = hotel.name;
      hotelLink.href = 'hotel-single.html?id=' + hotel.id;
    }

    // Sidebar
    document.getElementById('booking-room-id').value       = room.id;
    document.getElementById('sidebar-room-name').textContent = room.name;
    document.getElementById('sidebar-room-price').style.display = 'none';

    // Thông tin khách sạn
    if (hotel) {
      var infoBox = document.getElementById('hotel-info-box');
      infoBox.style.display = 'block';
      var link = document.getElementById('hotel-info-link');
      link.textContent = hotel.name;
      link.href = 'hotel-single.html?id=' + hotel.id;
      document.getElementById('hotel-info-location').textContent = hotel.location;
      document.getElementById('hotel-info-star').innerHTML = renderStars(hotel.starRating || 0);
    }

    // Gallery
    var images = [];
    if (room.images && room.images.length) {
      var seen = {};
      room.images.forEach(function (img) {
        if (img.imageUrl && !seen[img.imageUrl]) { seen[img.imageUrl] = true; images.push(img.imageUrl); }
      });
    }
    if (!images.length && room.thumbnail) images.push(api.resolveUrl(room.thumbnail));
    if (!images.length) images.push('assets/images/room-1.jpg');

    var slides = images.map(function (url) {
      return '<div class="item"><div class="room-img" style="background-image:url(\'' + url + '\');"></div></div>';
    }).join('');

    // Amenities
    var amenitiesHtml = '';
    if (room.amenities && room.amenities.length) {
      amenitiesHtml =
        '<div class="col-md-12 ftco-animate mb-5">' +
          '<h4 class="mb-3">' + t('hs.amenities') + '</h4>' +
          '<div class="d-flex flex-wrap" style="gap:8px">' +
            room.amenities.map(function (a) {
              return '<span class="badge badge-light border py-2 px-3" style="font-size:13px;font-weight:400">' +
                '<i class="ion-ios-checkmark-circle" style="color:#F96D00"></i> ' + a + '</span>';
            }).join('') +
          '</div>' +
        '</div>';
    }

    // Status badge
    var statusHtml = '';
    if (room.status !== 'available') {
      var label = room.status === 'maintenance' ? t('rs.maintLabel') : t('as.booked');
      var color = room.status === 'maintenance' ? 'warning' : 'danger';
      statusHtml = '<div class="alert alert-' + color + ' py-2 mb-4" style="font-size:13px">' +
        '<strong>' + t('as.note') + '</strong> ' + tf('rs.roomStatus', { status: label }) + '</div>';

      // Disable form nếu phòng không available
      var submitBtn = document.getElementById('btn-book-submit');
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = t('rs.unavailable'); }
    }

    document.getElementById('room-main-content').innerHTML =
      '<div class="row">' +

        '<div class="col-md-12 ftco-animate mb-4">' +
          '<h2 class="mb-1">' + room.name + '</h2>' +
          '<p class="mb-3">' +
            '<span class="badge badge-secondary mr-2">' + room.type + '</span>' +
            (hotel ? '<small class="text-muted"><span class="ion-ios-business"></span> ' + hotel.name + '</small>' : '') +
          '</p>' +
          statusHtml +
          '<div class="single-slider owl-carousel mb-4">' + slides + '</div>' +
        '</div>' +

        '<div class="col-md-12 room-single ftco-animate mb-4">' +
          '<h4 class="mb-3">' + t('as.descTitle') + '</h4>' +
          '<p>' + room.description + '</p>' +
        '</div>' +

        '<div class="col-md-12 ftco-animate mb-4">' +
          '<h4 class="mb-3">' + t('rs.roomInfo') + '</h4>' +
          '<div class="d-flex flex-wrap" style="gap:24px">' +
            '<div class="text-center p-3 border rounded" style="min-width:100px">' +
              '<div style="font-size:28px;color:#F96D00"><span class="ion-ios-people"></span></div>' +
              '<div style="font-size:22px;font-weight:700">' + room.maxGuests + '</div>' +
              '<div style="font-size:12px;color:#999">' + t('ts.maxGuestsLabel') + '</div>' +
            '</div>' +
            '<div class="text-center p-3 border rounded" style="min-width:100px">' +
              '<div style="font-size:28px;color:#F96D00"><span class="ion-ios-bed"></span></div>' +
              '<div style="font-size:22px;font-weight:700">' + room.beds + '</div>' +
              '<div style="font-size:12px;color:#999">' + t('rs.beds') + '</div>' +
            '</div>' +
            '<div class="text-center p-3 border rounded" style="min-width:100px">' +
              '<div style="font-size:28px;color:#F96D00"><span class="ion-ios-water"></span></div>' +
              '<div style="font-size:22px;font-weight:700">' + room.bathrooms + '</div>' +
              '<div style="font-size:12px;color:#999">' + t('as.bathroomsLabel') + '</div>' +
            '</div>' +
            '<div class="text-center p-3 border rounded d-none" style="min-width:100px">' +
              '<div style="font-size:28px;color:#F96D00"><span class="ion-ios-pricetag"></span></div>' +
              '<div style="font-size:18px;font-weight:700;color:#F96D00">' + formatPrice(room.price) + '</div>' +
              '<div style="font-size:12px;color:#999">' + t('common.perNightSlash') + '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +

        amenitiesHtml +

      '</div>';

    // Init carousel
    setTimeout(function () {
      if (typeof jQuery !== 'undefined' && jQuery.fn.owlCarousel) {
        var $s = jQuery('.single-slider');
        if ($s.length && !$s.hasClass('owl-loaded')) {
          $s.owlCarousel({
            loop: images.length > 1,
            margin: 0,
            nav: true,
            dots: true,
            items: 1,
            navText: ['<i class="ion-ios-arrow-back"></i>', '<i class="ion-ios-arrow-forward"></i>']
          });
        }
      }
    }, 50);

    activateAnimate(document.getElementById('room-main-content'));
    activateAnimate(document.querySelector('.col-lg-4.sidebar'));

    updatePricePreview(room.price);

    api.get('/rooms/' + roomId + '/booked-dates').then(function (res2) {
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
    document.getElementById('room-main-content').innerHTML =
      '<p class="text-danger">' + t('common.connFail') + '</p>';
  });

  // document.addEventListener('i18n:changed', function () { location.reload(); });

  // Submit form đặt phòng
  var bookingForm = document.getElementById('room-booking-form');
  if (bookingForm) {
    if (typeof Auth !== 'undefined' && Auth.isLoggedIn()) {
      var user = Auth.getUser();
      if (user) {
        var emailInput = bookingForm.querySelector('[name=email]');
        if (emailInput && !emailInput.value) emailInput.value = user.email || '';
        var nameInput = bookingForm.querySelector('[name=fullName]') || bookingForm.querySelector('[name=name]');
        if (nameInput && !nameInput.value) nameInput.value = user.name || user.fullName || '';
        var phoneInput = bookingForm.querySelector('[name=phone]');
        if (phoneInput && !phoneInput.value) phoneInput.value = user.phone || '';
      }
    }
    bookingForm.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!Auth.isLoggedIn()) {
        window.CustomAlert.alert(t('wl.loginToSave') || 'Vui lòng đăng nhập để thực hiện');
        window.location.href = 'login.html';
        return;
      }
      var rId = document.getElementById('booking-room-id').value;
      if (!rId) return;

      var checkIn  = document.getElementById('booking-checkin').value;
      var checkOut = document.getElementById('booking-checkout').value;
      if (!checkIn || !checkOut) { window.CustomAlert.alert(t('rs.selectDates')); return; }

      var submitBtn = document.getElementById('btn-book-submit');
      submitBtn.disabled = true;
      submitBtn.textContent = t('hs.sending');

      var data = {
        roomId:   parseInt(rId),
        fullName: bookingForm.querySelector('[name=fullName]').value,
        email:    bookingForm.querySelector('[name=email]').value,
        phone:    bookingForm.querySelector('[name=phone]').value,
        checkIn:  checkIn,
        checkOut: checkOut,
        guests:   parseInt(bookingForm.querySelector('[name=guests]').value) || 1,
        notes:    bookingForm.querySelector('[name=notes]').value
      };

      api.authPost('/hotel-bookings', data).then(function (res) {
        if (res.success) {
          var booking = res.data;
          var nights  = calcNights(new Date(data.checkIn), new Date(data.checkOut));
          var total   = booking.totalPrice || (_currentRoom ? _currentRoom.price * nights : 0);
          var bdown = _currentRoom ?
            '<div class="d-flex justify-content-between mb-1"><span>Đơn giá:</span> <span>' + formatPrice(_currentRoom.price) + ' / đêm</span></div>' +
            '<div class="d-flex justify-content-between mb-1"><span>Số đêm:</span> <span>' + nights + '</span></div>' : '';

          sessionStorage.setItem('pendingPayment', JSON.stringify({
            title:     _currentRoom ? 'Phòng ' + _currentRoom.name + (_currentRoom.hotel ? ' - Khách sạn ' + _currentRoom.hotel.name : '') : t('rs.bookRoom'),
            subtitle:  data.checkIn + ' → ' + data.checkOut,
            breakdown: bdown,
            amount:    total,
            bookingId: booking.id,
            bookingType: 'HOTEL'
          }));
          window.location.href = 'payment.html';
        } else {
          var msg = res.message || t('hs.bookFail');
          if (res.errors && res.errors.length) {
            msg += '\n' + res.errors.map(function (e) { return '• ' + e.message; }).join('\n');
          }
          window.CustomAlert.alert(msg);
        }
      }).catch(function () {
        window.CustomAlert.alert(t('common.connFail'));
      }).finally(function () {
        submitBtn.disabled = false;
        submitBtn.textContent = t('hs.bookNow');
      });
    });
  }
});
