document.addEventListener('DOMContentLoaded', function () {
  var container     = document.getElementById('apartments-list');
  var paginationWrap = document.getElementById('pagination-wrap');
  if (!container) return;

  var currentPage    = 1;
  var currentFilters = {};

  function formatPrice(p) {
    return Number(p).toLocaleString('vi-VN') + ' ₫';
  }

  function activateAnimate(root) {
    (root || document).querySelectorAll('.ftco-animate').forEach(function (el) {
      el.classList.add('ftco-animated', 'fadeInUp');
    });
    if (typeof Waypoint !== 'undefined') Waypoint.refreshAll();
  }

  function getImageUrl(apt) {
    if (apt.thumbnail) return api.resolveUrl(apt.thumbnail);
    if (apt.images && apt.images.length > 0 && apt.images[0].imageUrl) return api.resolveUrl(apt.images[0].imageUrl);
    return 'assets/images/image_1.jpg';
  }

  function renderApartments(list) {
    if (!list || !list.length) {
      container.innerHTML = '<div class="col-12"><p class="text-center py-4">' + t('apt.none') + '</p></div>';
      return;
    }

    container.innerHTML = list.map(function (apt) {
      var imgUrl    = getImageUrl(apt);
      var available = apt.status === 'available';
      var badge     = !available
        ? '<span class="badge badge-danger" style="position:absolute;top:10px;right:10px">' + t('apt.booked') + '</span>'
        : '';

      return (
        '<div class="col-sm-12 col-md-4 ftco-animate">' +
          '<div class="room" style="position:relative">' +
            badge +
            '<a href="apartment-single.html?id=' + apt.id + '" class="img d-flex justify-content-center align-items-center"' +
              ' style="background-image:url(\'' + imgUrl + '\');">' +
              '<div class="icon d-flex justify-content-center align-items-center"><span class="icon-search2"></span></div>' +
            '</a>' +
            '<div class="text p-3 text-center">' +
              '<h3 class="mb-1" style="font-size:16px"><a href="apartment-single.html?id=' + apt.id + '">' + apt.title + '</a></h3>' +
              '<p class="mb-1"><small><span class="ion-ios-location"></span> ' + apt.location + '</small></p>' +
              '<p class="mb-2" style="font-size:13px;color:#888">' +
                '<span class="mr-2"><i class="ion-ios-bed" style="color:#F96D00"></i> ' + apt.bedrooms + ' ' + t('apt.bedroomsSuffix') + '</span>' +
                '<span class="mr-2"><i class="ion-ios-water" style="color:#F96D00"></i> ' + apt.bathrooms + ' ' + t('apt.bathSuffix') + '</span>' +
                '<span><i class="ion-ios-people" style="color:#F96D00"></i> ' + apt.maxGuests + ' ' + t('apt.guestsSuffix') + '</span>' +
              '</p>' +
              '<p class="d-none"><span class="price mr-2">' + formatPrice(apt.price) + '</span><span class="per">' + t('apt.perNight') + '</span></p>' +
              '<hr>' +
              '<p class="pt-1">' +
                '<a href="apartment-single.html?id=' + apt.id + '" class="btn-custom">' + t('common.viewDetails') + ' <span class="icon-long-arrow-right"></span></a>' +
              '</p>' +
            '</div>' +
          '</div>' +
        '</div>'
      );
    }).join('');
  }

  function renderPagination(pagination) {
    if (!paginationWrap || !pagination || pagination.totalPages <= 1) {
      if (paginationWrap) paginationWrap.innerHTML = '';
      return;
    }

    var html = '<nav><ul class="pagination">';
    html += '<li class="page-item' + (pagination.page <= 1 ? ' disabled' : '') + '">' +
      '<a class="page-link" href="#" data-page="' + (pagination.page - 1) + '">&laquo;</a></li>';

    for (var i = 1; i <= pagination.totalPages; i++) {
      html += '<li class="page-item' + (i === pagination.page ? ' active' : '') + '">' +
        '<a class="page-link" href="#" data-page="' + i + '">' + i + '</a></li>';
    }

    html += '<li class="page-item' + (pagination.page >= pagination.totalPages ? ' disabled' : '') + '">' +
      '<a class="page-link" href="#" data-page="' + (pagination.page + 1) + '">&raquo;</a></li>';
    html += '</ul></nav>';

    paginationWrap.innerHTML = html;
    paginationWrap.querySelectorAll('.page-link').forEach(function (link) {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        var page = parseInt(this.dataset.page);
        if (!isNaN(page) && page >= 1 && page <= pagination.totalPages) loadApartments(page);
      });
    });
  }

  function buildQuery(page) {
    var p = new URLSearchParams();
    p.set('page', page);
    p.set('limit', 6);
    if (currentFilters.q)        p.set('q', currentFilters.q);
    if (currentFilters.bedrooms) p.set('bedrooms', currentFilters.bedrooms);
    if (currentFilters.minPrice) p.set('minPrice', currentFilters.minPrice);
    if (currentFilters.maxPrice) p.set('maxPrice', currentFilters.maxPrice);
    if (currentFilters.maxGuests) p.set('maxGuests', currentFilters.maxGuests);
    return '/apartments?' + p.toString();
  }

  function loadApartments(page) {
    currentPage = page;
    container.innerHTML = '<div class="col-12 text-center py-5"><p>' + t('common.loading') + '</p></div>';

    api.get(buildQuery(page)).then(function (res) {
      if (!res.success) {
        container.innerHTML = '<div class="col-12"><p class="text-danger text-center">' + t('tours.loadFail') + '</p></div>';
        return;
      }
      renderApartments(res.data);
      renderPagination(res.pagination);
      activateAnimate(container);
    }).catch(function () {
      container.innerHTML = '<div class="col-12"><p class="text-danger text-center">' + t('common.connFail') + '</p></div>';
    });
  }

  document.addEventListener('i18n:changed', function () { loadApartments(currentPage); });

  // Filter form
  document.getElementById('apartment-filter-form').addEventListener('submit', function (e) {
    e.preventDefault();
    currentFilters = {
      q:        document.getElementById('filter-q').value.trim(),
      bedrooms: document.getElementById('filter-bedrooms').value,
      minPrice: document.getElementById('filter-min-price').value,
      maxPrice: document.getElementById('filter-max-price').value
    };
    loadApartments(1);
  });

  document.getElementById('btn-reset').addEventListener('click', function () {
    document.getElementById('apartment-filter-form').reset();
    document.querySelectorAll('.guest-check').forEach(function (cb) { cb.checked = false; });
    currentFilters = {};
    loadApartments(1);
  });

  // Guest checkbox filter
  document.querySelectorAll('.guest-check').forEach(function (cb) {
    cb.addEventListener('change', function () {
      var checked = document.querySelector('.guest-check:checked');
      currentFilters.maxGuests = checked ? checked.value : '';
      loadApartments(1);
    });
  });

  loadApartments(1);
});
