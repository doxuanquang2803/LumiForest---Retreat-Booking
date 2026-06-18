document.addEventListener('DOMContentLoaded', function () {
  var params = new URLSearchParams(window.location.search);
  var hotelId = params.get('id');
  var _rooms = [];

  if (!hotelId) {
    document.getElementById('hotel-detail-content').innerHTML =
      '<p class="text-danger">' + t('hs.notFound') + ' <a href="hotels.html">' + t('hs.backToList') + '</a></p>';
    return;
  }

  function calcNights(checkIn, checkOut) {
    var d1 = new Date(checkIn), d2 = new Date(checkOut);
    if (isNaN(d1) || isNaN(d2) || d2 <= d1) return 0;
    return Math.ceil((d2 - d1) / 86400000);
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

  function updateBookedDatesForRoom(roomId) {
    if (!roomId) {
      var checkinEl = jQuery('#booking-checkin');
      var checkoutEl = jQuery('#booking-checkout');
      if (checkinEl.data('datepicker')) checkinEl.datepicker('remove');
      if (checkoutEl.data('datepicker')) checkoutEl.datepicker('remove');
      checkinEl.datepicker({ format: 'm/d/yyyy', autoclose: true });
      checkoutEl.datepicker({ format: 'm/d/yyyy', autoclose: true });
      return;
    }
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
  }

  function activateAnimate(root) {
    (root || document).querySelectorAll('.ftco-animate').forEach(function (el) {
      el.classList.add('ftco-animated', 'fadeInUp');
    });
    if (typeof Waypoint !== 'undefined') Waypoint.refreshAll();
  }

  function formatPrice(price) {
    return Number(price).toLocaleString('vi-VN') + ' ₫';
  }

  function renderStars(count) {
    var html = '';
    for (var i = 1; i <= 5; i++) {
      html += '<i class="' + (i <= count ? 'icon-star' : 'icon-star-o') + '" style="color:#F96D00"></i>';
    }
    return html;
  }

  function getFirstImage(obj) {
    if (obj.images && obj.images.length > 0) return obj.images[0].imageUrl;
    if (obj.thumbnail) return obj.thumbnail;
    return 'assets/images/room-1.jpg';
  }

  // Lấy danh sách ảnh không trùng từ hotel.images
  function getGalleryImages(hotel) {
    if (hotel.images && hotel.images.length > 0) {
      // Dùng images từ DB (đã include thumbnail + gallery)
      var seen = {};
      return hotel.images
        .map(function (img) { return img.imageUrl; })
        .filter(function (url) {
          if (!url || seen[url]) return false;
          seen[url] = true;
          return true;
        });
    }
    if (hotel.thumbnail) return [hotel.thumbnail];
    return ['assets/images/room-1.jpg'];
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

  function loadHotel() {
    api.get('/hotels/' + hotelId).then(function (res) {
      if (!res.success || !res.data) {
        document.getElementById('hotel-detail-content').innerHTML =
          '<p class="text-danger">' + t('hs.notFound') + ' <a href="hotels.html">' + t('hs.backToList') + '</a></p>';
        return;
      }

      var hotel = res.data;

      // Cập nhật tiêu đề trang & breadcrumb
      document.title = hotel.name + ' - LumiForest';
      document.getElementById('hero-hotel-name').textContent = hotel.name;
      document.getElementById('breadcrumb-name').textContent = hotel.name;
      document.getElementById('booking-hotel-id').value = hotel.id;

      // Sidebar info
      document.getElementById('info-location').textContent = hotel.location;
      document.getElementById('info-rating').innerHTML =
        '<strong>' + (hotel.rating || 0).toFixed(1) + '</strong>/5' +
        ' <small>(' + (hotel.reviewCount || 0) + ' ' + t('hs.reviews') + ')</small>';
      document.getElementById('info-star').innerHTML = renderStars(hotel.starRating || 0);
      document.getElementById('info-price').style.display = 'none';

      // Gallery carousel
      var images = getGalleryImages(hotel);
      var gallerySlides = images.map(function (url) {
        return '<div class="item"><div class="room-img" style="background-image: url(\'' + url + '\');"></div></div>';
      }).join('');

      // Amenities
      var amenitiesHtml = '';
      if (hotel.amenities && hotel.amenities.length) {
        amenitiesHtml =
          '<div class="col-md-12 ftco-animate mb-5">' +
            '<h4 class="mb-3">' + t('hs.amenities') + '</h4>' +
            '<ul class="list d-flex flex-wrap" style="list-style:none;padding:0">' +
              hotel.amenities.map(function (a) {
                return '<li class="mr-4 mb-2"><span class="ion-ios-checkmark-circle" style="color:#F96D00"></span> ' + a + '</li>';
              }).join('') +
            '</ul>' +
          '</div>';
      }

      document.getElementById('hotel-detail-content').innerHTML =
        '<div class="row">' +
          '<div class="col-md-12 ftco-animate">' +
            '<h2 class="mb-2">' + hotel.name + '</h2>' +
            '<p class="mb-3">' + renderStars(hotel.starRating || 0) +
              ' <small class="ml-2 text-muted">' + hotel.location + '</small></p>' +
            '<div class="single-slider owl-carousel mb-4">' + gallerySlides + '</div>' +
          '</div>' +
          '<div class="col-md-12 room-single mt-2 mb-4 ftco-animate">' +
            '<p>' + hotel.description + '</p>' +
            '<div class="d-md-flex mt-4 mb-3">' +
              '<ul class="list">' +
                '<li><span>' + t('hs.address') + '</span> ' + hotel.address + '</li>' +
                '<li><span>' + t('hs.area') + '</span> ' + hotel.location + '</li>' +
              '</ul>' +
              '<ul class="list ml-md-5">' +
                '<li><span>' + t('hs.rating') + '</span> ' + (hotel.rating || 0).toFixed(1) + ' / 5 ⭐</li>' +
                '<li><span>' + t('hs.reviewCount') + '</span> ' + (hotel.reviewCount || 0) + '</li>' +
              '</ul>' +
            '</div>' +
          '</div>' +
          amenitiesHtml +
          '<div class="col-md-12 ftco-animate">' +
            '<h4 class="mb-3">' + t('hs.availableRooms') + '</h4>' +
            '<div class="row" id="rooms-in-hotel">' +
              '<div class="col-12 text-center py-3"><p>' + t('common.loading') + '</p></div>' +
            '</div>' +
          '</div>' +
        '</div>';

      // Khởi tạo carousel sau khi DOM được cập nhật
      setTimeout(initCarousel, 50);
      activateAnimate(document.getElementById('hotel-detail-content'));
      activateAnimate(document.querySelector('.col-lg-4.sidebar'));

      var wishBtn = document.getElementById('btn-wishlist');
      if (wishBtn && window.WishlistBtn) WishlistBtn.init(hotel.id, 'HOTEL', wishBtn);

      loadRooms(hotel.id);
      loadRecommendations(hotel.id);
    }).catch(function (err) {
      document.getElementById('hotel-detail-content').innerHTML =
        '<p class="text-danger">' + t('common.connFail') + '</p>';
    });
  }

  function loadRooms(hId) {
    api.get('/rooms/hotel/' + hId).then(function (res) {
      var roomsContainer = document.getElementById('rooms-in-hotel');
      if (!roomsContainer) return;

      var rooms = (res.success && res.data) ? res.data : [];
      _rooms = rooms;

      // Điền select dropdown
      var select = document.getElementById('booking-room-select');
      if (select) {
        while (select.options.length > 1) select.remove(1);
        rooms.forEach(function (room) {
          if (room.status === 'available') {
            var opt = document.createElement('option');
            opt.value = room.id;
            opt.textContent = room.name;
            select.appendChild(opt);
          }
        });
      }

      if (!rooms.length) {
        roomsContainer.innerHTML = '<div class="col-12"><p class="text-muted">' + t('hs.noRooms') + '</p></div>';
        return;
      }

      roomsContainer.innerHTML = rooms.map(function (room) {
        var imgUrl = getFirstImage(room);
        var available = room.status === 'available';

        var statusLabel = available ? '' :
          (room.status === 'maintenance' ? t('hs.maintenance') : t('hs.booked'));
        var statusColor = room.status === 'maintenance' ? '#ffc107' : '#dc3545';
        var statusBadge = !available
          ? '<div style="position:absolute;top:12px;right:12px;background:' + statusColor + ';color:#fff;padding:4px 10px;border-radius:4px;font-size:12px;font-weight:600">' + statusLabel + '</div>'
          : '';

        var amenitiesHtml = '';
        if (room.amenities && room.amenities.length) {
          amenitiesHtml = '<div class="mt-2 mb-3" style="line-height:1.8">' +
            room.amenities.slice(0, 5).map(function (a) {
              return '<span class="badge badge-light border mr-1 mb-1" style="font-weight:400;font-size:11px">' +
                '<i class="ion-ios-checkmark" style="color:#F96D00"></i> ' + a + '</span>';
            }).join('') +
            (room.amenities.length > 5 ? '<span class="badge badge-light border" style="font-size:11px">+' + (room.amenities.length - 5) + ' ' + t('hs.more') + '</span>' : '') +
          '</div>';
        }

        var btn = available
          ? '<a href="rooms-single.html?id=' + room.id + '" class="btn btn-primary btn-sm px-3 py-2">' +
              '<span class="ion-ios-calendar"></span> ' + t('hs.book') + '</a>'
          : '<span class="text-muted" style="font-size:13px">' + t('hs.unavailable') + '</span>';

        return (
          '<div class="col-12 mb-4 ftco-animate">' +
            '<div class="card border-0 shadow-sm" style="border-radius:10px;overflow:hidden;position:relative">' +
              statusBadge +
              '<div class="row no-gutters">' +

                '<div class="col-md-4" style="min-height:220px">' +
                  '<div style="background-image:url(\'' + imgUrl + '\');background-size:cover;background-position:center;height:100%;min-height:220px"></div>' +
                '</div>' +

                '<div class="col-md-8">' +
                  '<div class="card-body p-4">' +
                    '<div class="d-flex justify-content-between align-items-start mb-1">' +
                      '<h4 class="mb-0" style="font-size:18px">' + room.name + '</h4>' +
                      '<span class="badge badge-secondary ml-2" style="white-space:nowrap;flex-shrink:0">' + room.type + '</span>' +
                    '</div>' +

                    '<p class="text-muted mb-2" style="font-size:13px;line-height:1.5">' +
                      (room.description.length > 120 ? room.description.slice(0, 120) + '…' : room.description) +
                    '</p>' +

                    '<div class="d-flex flex-wrap mb-2" style="gap:16px;font-size:13px">' +
                      '<span><i class="ion-ios-people" style="color:#F96D00"></i> ' + t('hs.maxGuestsPre') + ' <strong>' + room.maxGuests + '</strong> ' + t('hs.guests') + '</span>' +
                      '<span><i class="ion-ios-bed" style="color:#F96D00"></i> <strong>' + room.beds + '</strong> ' + t('hs.beds') + '</span>' +
                      '<span><i class="ion-ios-water" style="color:#F96D00"></i> <strong>' + room.bathrooms + '</strong> ' + t('hs.baths') + '</span>' +
                    '</div>' +

                    amenitiesHtml +

                    '<div class="d-flex align-items-center justify-content-between mt-2">' +
                      '<div class="d-none">' +
                        '<span class="price" style="font-size:20px">' + formatPrice(room.price) + '</span>' +
                        '<span class="text-muted ml-1" style="font-size:13px">' + t('common.perNightSlash') + '</span>' +
                      '</div>' +
                      '<div>' + btn + '</div>' +
                    '</div>' +
                  '</div>' +
                '</div>' +

              '</div>' +
            '</div>' +
          '</div>'
        );
      }).join('');

      activateAnimate(roomsContainer);

      var select = document.getElementById('booking-room-select');
      if (select && !select.dataset.listenerBound) {
        select.dataset.listenerBound = 'true';
        select.addEventListener('change', function () {
          updateBookedDatesForRoom(this.value);
        });
      }

      roomsContainer.querySelectorAll('.btn-book-room').forEach(function (btn) {
        btn.addEventListener('click', function (e) {
          e.preventDefault();
          var sel = document.getElementById('booking-room-select');
          if (sel) {
            sel.value = this.dataset.roomId;
            sel.dispatchEvent(new Event('change'));
          }
          var form = document.getElementById('hotel-booking-form');
          if (form) form.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      });

    }).catch(function () {
      var c = document.getElementById('rooms-in-hotel');
      if (c) c.innerHTML = '<div class="col-12"><p class="text-danger">' + t('hs.roomsLoadFail') + '</p></div>';
    });
  }

  function loadRecommendations(hId) {
    var recContainer = document.getElementById('recommendations-list');
    var recSection = document.getElementById('recommendations-section');
    if (!recContainer) return;

    api.get('/hotels/' + hId + '/recommendations').then(function (res) {
      var hotels = (res.success && res.data && res.data.length) ? res.data.slice(0, 3) : [];

      if (!hotels.length) {
        if (recSection) recSection.style.display = 'none';
        return;
      }

      recContainer.innerHTML = hotels.map(function (h) {
        var imgUrl = getFirstImage(h);
        return (
          '<div class="col-sm-12 col-md-4 ftco-animate">' +
            '<div class="room">' +
              '<a href="hotel-single.html?id=' + h.id + '" class="img d-flex justify-content-center align-items-center"' +
                ' style="background-image: url(\'' + imgUrl + '\');">' +
                '<div class="icon d-flex justify-content-center align-items-center"><span class="icon-search2"></span></div>' +
              '</a>' +
              '<div class="text p-3 text-center">' +
                '<h3 class="mb-1"><a href="hotel-single.html?id=' + h.id + '">' + h.name + '</a></h3>' +
                '<p class="mb-1"><small>' + renderStars(h.starRating || 0) + '</small></p>' +
                '<p class="mb-1"><small><span class="ion-ios-location"></span> ' + h.location + '</small></p>' +
                '<p class="d-none"><span class="price mr-1">' + formatPrice(h.price) + '</span><span class="per">' + t('common.perNightSlash') + '</span></p>' +
              '</div>' +
            '</div>' +
          '</div>'
        );
      }).join('');
      activateAnimate(recContainer);
    }).catch(function () {});
  }

  // Form đặt phòng
  var bookingForm = document.getElementById('hotel-booking-form');
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
      var roomId = bookingForm.querySelector('[name=roomId]').value;

      if (!roomId) {
        window.CustomAlert.alert(t('hs.selectRoom'));
        return;
      }

      var submitBtn = bookingForm.querySelector('button[type=submit]');
      submitBtn.disabled = true;
      submitBtn.textContent = t('hs.sending');

      var data = {
        roomId: parseInt(roomId),
        fullName: bookingForm.querySelector('[name=fullName]').value,
        email: bookingForm.querySelector('[name=email]').value,
        phone: bookingForm.querySelector('[name=phone]').value,
        checkIn: document.getElementById('booking-checkin').value,
        checkOut: document.getElementById('booking-checkout').value,
        guests: parseInt(bookingForm.querySelector('[name=guests]').value) || 1,
        notes: bookingForm.querySelector('[name=notes]').value
      };

      api.authPost('/hotel-bookings', data).then(function (res) {
        if (res.success) {
          var booking = res.data;
          var nights  = calcNights(new Date(data.checkIn), new Date(data.checkOut));
          var selectedRoom = _rooms.find(function (r) { return r.id === parseInt(roomId); });
          var total   = booking.totalPrice || (selectedRoom ? selectedRoom.price * nights : 0);
          
          var bdown = selectedRoom ?
            '<div class="d-flex justify-content-between mb-1"><span>Đơn giá:</span> <span>' + formatPrice(selectedRoom.price) + ' / đêm</span></div>' +
            '<div class="d-flex justify-content-between mb-1"><span>Số đêm:</span> <span>' + nights + '</span></div>' : '';

          sessionStorage.setItem('pendingPayment', JSON.stringify({
            title:     selectedRoom ? selectedRoom.name : t('rs.bookRoom'),
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

  loadHotel();
  document.addEventListener('i18n:changed', loadHotel);
});
