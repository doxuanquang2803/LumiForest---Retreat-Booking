document.addEventListener('DOMContentLoaded', function () {
  var container = document.getElementById('rooms-list');
  if (!container) return;

  var params = new URLSearchParams(window.location.search);

  // Pre-populate search fields from URL params
  var checkInVal = params.get('checkIn') || '';
  var checkOutVal = params.get('checkOut') || '';
  var typeVal = params.get('type') || '';
  var maxGuestsVal = params.get('maxGuests') || '';

  var checkInInput = document.getElementById('rooms-search-checkin');
  var checkOutInput = document.getElementById('rooms-search-checkout');
  var typeSelect = document.getElementById('rooms-search-type');
  var guestsSelect = document.getElementById('rooms-search-guests');

  if (checkInInput) checkInInput.value = checkInVal;
  if (checkOutInput) checkOutInput.value = checkOutVal;
  if (typeSelect) typeSelect.value = typeVal;
  if (guestsSelect) guestsSelect.value = maxGuestsVal;

  // Render rooms list
  container.innerHTML = '<div class="col-12 text-center py-5"><p>' + (window.t ? t('common.loading') : 'Loading...') + '</p></div>';

  var apiPath = '/rooms';
  var queryStr = params.toString();
  if (queryStr) {
    apiPath += '?' + queryStr;
  }

  function formatPrice(price) {
    return Number(price).toLocaleString('vi-VN') + ' ₫';
  }

  api.get(apiPath).then(function (res) {
    if (!res.success || !res.data || !res.data.length) {
      container.innerHTML = '<div class="col-12 text-center py-5"><p class="text-muted">' + (window.t ? t('rooms.none') : 'No rooms available.') + '</p></div>';
      return;
    }

    container.innerHTML = res.data.map(function (room) {
      var isAvailable = room.status === 'available';
      var badge = isAvailable
        ? ''
        : '<span class="badge badge-danger" style="position:absolute;top:10px;right:10px">' + room.status + '</span>';
      
      var btn = isAvailable
        ? '<a href="rooms-single.html?id=' + room.id + '" class="btn-custom">' + (window.t ? t('rooms.viewDetails') : 'Book Now') + ' <span class="icon-long-arrow-right"></span></a>'
        : '<span class="text-muted">' + room.status + '</span>';

      var imgUrl = room.thumbnail ? api.resolveUrl(room.thumbnail) : 'assets/images/room-1.jpg';
      var priceFormatted = formatPrice(room.price);
      var perNightText = window.t ? t('rooms.perNight') : 'per night';

      return (
        '<div class="col-sm col-md-6 col-lg-4 ftco-animate">' +
          '<div class="room" style="position:relative">' +
            badge +
            '<a href="rooms-single.html?id=' + room.id + '" class="img d-flex justify-content-center align-items-center" style="background-image: url(' + imgUrl + ');">' +
              '<div class="icon d-flex justify-content-center align-items-center"><span class="icon-search2"></span></div>' +
            '</a>' +
            '<div class="text p-3 text-center">' +
              '<h3 class="mb-3"><a href="rooms-single.html?id=' + room.id + '">' + room.name + '</a></h3>' +
              '<p class="d-none"><span class="price mr-2">' + priceFormatted + '</span> <span class="per" data-i18n="rooms.perNight">' + perNightText + '</span></p>' +
              '<ul class="list">' +
                '<li><span>Max:</span> ' + room.maxGuests + ' Persons</li>' +
              '</ul>' +
              '<hr>' +
              '<p class="pt-1">' + btn + '</p>' +
            '</div>' +
          '</div>' +
        '</div>'
      );
    }).join('');

    // Apply translations
    if (window.I18N) window.I18N.applyI18n(container);

    // Trigger animations
    container.querySelectorAll('.ftco-animate').forEach(function (el) {
      el.classList.add('ftco-animated', 'fadeInUp');
    });
  }).catch(function (err) {
    console.error('Error loading rooms:', err);
    container.innerHTML = '<div class="col-12 text-center py-5"><p class="text-danger">' + (window.t ? t('common.connFail') : 'Unable to connect to server.') + '</p></div>';
  });

  // Handle advanced search form submission
  var searchForm = document.getElementById('rooms-sidebar-search-form');
  if (searchForm) {
    searchForm.addEventListener('submit', function (e) {
      e.preventDefault();

      var checkIn = checkInInput ? checkInInput.value : '';
      var checkOut = checkOutInput ? checkOutInput.value : '';
      var type = typeSelect ? typeSelect.value : '';
      var maxGuests = guestsSelect ? guestsSelect.value : '';

      var newParams = new URLSearchParams();
      if (checkIn) newParams.append('checkIn', checkIn);
      if (checkOut) newParams.append('checkOut', checkOut);
      if (type) newParams.append('type', type);
      if (maxGuests && maxGuests !== '0') newParams.append('maxGuests', maxGuests);

      window.location.search = newParams.toString();
    });
  }

  // document.addEventListener('i18n:changed', function () { location.reload(); });
});
