document.addEventListener('DOMContentLoaded', function () {
  var params = new URLSearchParams(window.location.search);
  var tourId = params.get('id');
  var _currentTour = null;

  if (!tourId) {
    document.getElementById('tour-detail-content').innerHTML =
      '<p class="text-danger">' + t('ts.notFound') + ' <a href="tours.html">' + t('ts.back') + '</a></p>';
    return;
  }

  function formatPrice(p) { return Number(p).toLocaleString('vi-VN') + ' ₫'; }

  function renderStars(rating) {
    var full = Math.round(rating || 0), html = '';
    for (var i = 1; i <= 5; i++) {
      html += '<i class="' + (i <= full ? 'icon-star' : 'icon-star-o') + '" style="color:#F96D00"></i>';
    }
    return html;
  }

  function activateAnimate(root) {
    (root || document).querySelectorAll('.ftco-animate').forEach(function (el) {
      el.classList.add('ftco-animated', 'fadeInUp');
    });
    if (typeof Waypoint !== 'undefined') Waypoint.refreshAll();
  }

  function getImages(tour) {
    var seen = {}, imgs = [];
    if (tour.images && tour.images.length) {
      tour.images.forEach(function (img) {
        var u = api.resolveUrl(img.imageUrl);
        if (u && !seen[u]) { seen[u] = true; imgs.push(u); }
      });
    }
    if (!imgs.length && tour.thumbnail) imgs.push(api.resolveUrl(tour.thumbnail));
    if (tour.gallery && tour.gallery.length) {
      tour.gallery.forEach(function (url) {
        var u = api.resolveUrl(url);
        if (!seen[u]) { seen[u] = true; imgs.push(u); }
      });
    }
    if (!imgs.length) imgs.push('assets/images/image_1.jpg');
    return imgs;
  }

  function updatePricePreview(price) {
    var guestsInput = document.getElementById('booking-guests');
    var preview     = document.getElementById('booking-price-preview');
    if (!guestsInput || !preview) return;

    function refresh() {
      preview.style.display = 'none';
    }

    guestsInput.addEventListener('input', refresh);
    refresh();
  }

  api.get('/tours/' + tourId).then(function (res) {
    if (!res.success || !res.data) {
      document.getElementById('tour-detail-content').innerHTML =
        '<p class="text-danger">' + t('ts.notFound') + ' <a href="tours.html">' + t('ts.back') + '</a></p>';
      return;
    }

    var tour = res.data;
    _currentTour = tour;

    document.title = tour.title + ' - LumiForest';
    document.getElementById('hero-tour-name').textContent   = tour.title;
    document.getElementById('breadcrumb-name').textContent  = tour.title;
    document.getElementById('booking-tour-id').value        = tour.id;

    // Sidebar info
    document.getElementById('sidebar-tour-price').style.display = 'none';
    document.getElementById('info-location').textContent  = tour.location;
    document.getElementById('info-duration').textContent  = tour.duration;
    document.getElementById('info-guests').textContent    = tour.maxGuests + ' ' + t('tours.guestsWord');
    document.getElementById('info-rating').innerHTML      = renderStars(tour.rating) + ' ' + (tour.rating || 0).toFixed(1);
    document.getElementById('info-price').textContent     = formatPrice(tour.price) + ' ' + t('tours.perPerson');

    if (tour.status !== 'active') {
      var btn = document.getElementById('btn-book-submit');
      if (btn) { btn.disabled = true; btn.textContent = t('ts.paused'); }
    }

    var images  = getImages(tour);
    var slides  = images.map(function (url) {
      return '<div class="item"><div class="room-img" style="background-image:url(\'' + url + '\');"></div></div>';
    }).join('');

    // Gallery thumbnails
    var thumbsHtml = '';
    if (images.length > 1) {
      thumbsHtml = '<div class="d-flex flex-wrap mb-4" style="gap:8px">' +
        images.map(function (url) {
          return '<a href="' + url + '" class="image-popup" style="display:inline-block;width:80px;height:60px;' +
            'background:url(\'' + url + '\') center/cover;border-radius:4px;border:2px solid #eee"></a>';
        }).join('') +
      '</div>';
    }

    document.getElementById('tour-detail-content').innerHTML =
      '<div class="row">' +

        '<div class="col-md-12 ftco-animate">' +
          '<h2 class="mb-2">' + tour.title + '</h2>' +
          '<p class="mb-1">' + renderStars(tour.rating) +
            ' <strong class="ml-1">' + (tour.rating || 0).toFixed(1) + '</strong>' +
            ' <small class="text-muted ml-2">(' + (tour.bookingCount || 0) + ' ' + t('ts.bookings') + ')</small></p>' +
          '<p class="mb-3">' +
            '<small class="mr-3"><span class="ion-ios-location" style="color:#F96D00"></span> ' + tour.location + '</small>' +
            '<small class="mr-3"><span class="ion-ios-time" style="color:#F96D00"></span> ' + tour.duration + '</small>' +
            '<small><span class="ion-ios-people" style="color:#F96D00"></span> ' + t('tours.maxPrefix') + ' ' + tour.maxGuests + ' ' + t('tours.guestsWord') + '</small>' +
          '</p>' +
          '<div class="single-slider owl-carousel mb-3">' + slides + '</div>' +
          thumbsHtml +
        '</div>' +

        '<div class="col-md-12 room-single ftco-animate mb-4">' +
          '<h4 class="mb-3">' + t('ts.descTitle') + '</h4>' +
          '<p>' + tour.description + '</p>' +
        '</div>' +

        '<div class="col-md-12 ftco-animate mb-4">' +
          '<h4 class="mb-3">' + t('ts.overview') + '</h4>' +
          '<div class="d-flex flex-wrap" style="gap:16px">' +
            '<div class="text-center p-3 border rounded" style="min-width:110px">' +
              '<div style="font-size:26px;color:#F96D00"><span class="ion-ios-time"></span></div>' +
              '<div style="font-size:14px;font-weight:700">' + tour.duration + '</div>' +
              '<div style="font-size:12px;color:#999">' + t('ts.duration') + '</div>' +
            '</div>' +
            '<div class="text-center p-3 border rounded" style="min-width:110px">' +
              '<div style="font-size:26px;color:#F96D00"><span class="ion-ios-people"></span></div>' +
              '<div style="font-size:20px;font-weight:700">' + tour.maxGuests + '</div>' +
              '<div style="font-size:12px;color:#999">' + t('ts.maxGuestsLabel') + '</div>' +
            '</div>' +
            '<div class="text-center p-3 border rounded" style="min-width:110px">' +
              '<div style="font-size:26px;color:#F96D00"><span class="ion-ios-star"></span></div>' +
              '<div style="font-size:20px;font-weight:700">' + (tour.rating || 0).toFixed(1) + '</div>' +
              '<div style="font-size:12px;color:#999">' + t('ts.rating') + '</div>' +
            '</div>' +
            '<div class="text-center p-3 border rounded d-none" style="min-width:110px">' +
              '<div style="font-size:26px;color:#F96D00"><span class="ion-ios-pricetag"></span></div>' +
              '<div style="font-size:16px;font-weight:700;color:#F96D00">' + formatPrice(tour.price) + '</div>' +
              '<div style="font-size:12px;color:#999">' + t('tours.perPerson') + '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +

      '</div>';

    setTimeout(function () {
      if (typeof jQuery !== 'undefined' && jQuery.fn.owlCarousel) {
        var $s = jQuery('.single-slider');
        if ($s.length && !$s.hasClass('owl-loaded')) {
          $s.owlCarousel({ loop: images.length > 1, margin: 0, nav: true, dots: true, items: 1,
            navText: ['<i class="ion-ios-arrow-back"></i>', '<i class="ion-ios-arrow-forward"></i>'] });
        }
      }
      // Re-init magnific popup for thumbnails
      if (typeof jQuery !== 'undefined' && jQuery.fn.magnificPopup) {
        jQuery('.image-popup').magnificPopup({ type: 'image', gallery: { enabled: true } });
      }
    }, 50);

    activateAnimate(document.getElementById('tour-detail-content'));
    activateAnimate(document.querySelector('.col-lg-4.sidebar'));

    var wishBtn = document.getElementById('btn-wishlist');
    if (wishBtn && window.WishlistBtn) WishlistBtn.init(tour.id, 'TOUR', wishBtn);
    updatePricePreview(tour.price);
    loadRelated(tour.id, tour.location);

  }).catch(function () {
    document.getElementById('tour-detail-content').innerHTML =
      '<p class="text-danger">' + t('common.connFail') + '</p>';
  });

  function loadRelated(id, location) {
    var recContainer = document.getElementById('related-list');
    var recSection   = document.getElementById('related-section');
    if (!recContainer) return;

    api.get('/tours?limit=4&q=' + encodeURIComponent(location)).then(function (res) {
      if (!res.success || !res.data) return;
      var list = res.data.filter(function (t) { return t.id !== parseInt(id); }).slice(0, 3);
      if (!list.length) { if (recSection) recSection.style.display = 'none'; return; }

      recContainer.innerHTML = list.map(function (t) {
        var rawImg = t.thumbnail || (t.images && t.images.length ? t.images[0].imageUrl : '');
        var img = api.resolveUrl(rawImg) || 'assets/images/image_1.jpg';
        return (
          '<div class="col-sm-12 col-md-4 ftco-animate">' +
            '<div class="room">' +
              '<a href="tour-single.html?id=' + t.id + '" class="img d-flex justify-content-center align-items-center"' +
                ' style="background-image:url(\'' + img + '\');">' +
                '<div class="icon d-flex justify-content-center align-items-center"><span class="icon-search2"></span></div>' +
              '</a>' +
              '<div class="text p-3 text-center">' +
                '<h3 class="mb-1" style="font-size:15px"><a href="tour-single.html?id=' + t.id + '">' + t.title + '</a></h3>' +
                '<p class="mb-1"><small><span class="ion-ios-location"></span> ' + t.location + '</small></p>' +
                '<p class="mb-1"><small><span class="ion-ios-time"></span> ' + t.duration + '</small></p>' +
                '<p class="d-none"><span class="price mr-1">' + Number(t.price).toLocaleString('vi-VN') + ' ₫</span><span class="per">' + t('tours.perPerson') + '</span></p>' +
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
  var form = document.getElementById('tour-booking-form');
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
      var tId  = document.getElementById('booking-tour-id').value;
      var date = document.getElementById('booking-date').value;
      if (!date) { window.CustomAlert.alert(t('ts.selectDate')); return; }

      var btn = document.getElementById('btn-book-submit');
      btn.disabled = true;
      btn.textContent = t('hs.sending');

      var data = {
        tourId:      parseInt(tId),
        fullName:    form.querySelector('[name=fullName]').value,
        email:       form.querySelector('[name=email]').value,
        phone:       form.querySelector('[name=phone]').value,
        bookingDate: date,
        guests:      parseInt(form.querySelector('[name=guests]').value) || 1
      };

      api.authPost('/tour-bookings', data).then(function (res) {
        if (res.success) {
          var booking = res.data;
          var guests  = data.guests;
          var total   = booking.totalPrice || (_currentTour ? _currentTour.price * guests : 0);
          var bdown = _currentTour ?
            '<div class="d-flex justify-content-between mb-1"><span>Đơn giá:</span> <span>' + formatPrice(_currentTour.price) + ' / khách</span></div>' +
            '<div class="d-flex justify-content-between mb-1"><span>Số khách:</span> <span>' + guests + '</span></div>' : '';

          sessionStorage.setItem('pendingPayment', JSON.stringify({
            title:         _currentTour ? _currentTour.title : t('ts.bookTour'),
            subtitle:      t('ts.datePre') + ' ' + date,
            breakdown:     bdown,
            amount:        total,
            bookingType:   'TOUR',
            tourBookingId: booking.id
          }));
          window.location.href = 'payment.html';
        } else {
          var msg = res.message || t('ts.bookFail');
          if (res.errors && res.errors.length) {
            msg += '\n' + res.errors.map(function (e) { return '• ' + e.message; }).join('\n');
          }
          window.CustomAlert.alert(msg);
        }
      }).catch(function () {
        window.CustomAlert.alert(t('common.connFail'));
      }).finally(function () {
        btn.disabled = false;
        btn.textContent = t('ts.bookNow');
      });
    });
  }
});
