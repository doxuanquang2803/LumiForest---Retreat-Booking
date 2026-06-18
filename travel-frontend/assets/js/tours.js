document.addEventListener('DOMContentLoaded', function () {
  var container      = document.getElementById('tours-list');
  var paginationWrap = document.getElementById('pagination-wrap');
  if (!container) return;

  var currentPage    = 1;
  var currentFilters = {};

  function formatPrice(p) { return Number(p).toLocaleString('vi-VN') + ' ₫'; }

  function activateAnimate(root) {
    (root || document).querySelectorAll('.ftco-animate').forEach(function (el) {
      el.classList.add('ftco-animated', 'fadeInUp');
    });
    if (typeof Waypoint !== 'undefined') Waypoint.refreshAll();
  }

  function getImageUrl(tour) {
    if (tour.thumbnail) return api.resolveUrl(tour.thumbnail);
    if (tour.images && tour.images.length) return api.resolveUrl(tour.images[0].imageUrl);
    return 'assets/images/image_1.jpg';
  }

  function renderStars(rating) {
    var full = Math.round(rating || 0);
    var html = '';
    for (var i = 1; i <= 5; i++) {
      html += '<i class="' + (i <= full ? 'icon-star' : 'icon-star-o') + '" style="color:#F96D00;font-size:12px"></i>';
    }
    return html;
  }

  function renderTours(list) {
    if (!list || !list.length) {
      container.innerHTML = '<div class="col-12"><p class="text-center py-4">' + t('tours.none') + '</p></div>';
      return;
    }

    container.innerHTML = list.map(function (tour) {
      var imgUrl  = getImageUrl(tour);
      var active  = tour.status === 'active';
      var badge   = !active
        ? '<span class="badge badge-secondary" style="position:absolute;top:10px;right:10px">' + t('tours.paused') + '</span>'
        : '';

      return (
        '<div class="col-sm-12 col-md-4 ftco-animate">' +
          '<div class="room" style="position:relative">' +
            badge +
            '<a href="tour-single.html?id=' + tour.id + '" class="img d-flex justify-content-center align-items-center"' +
              ' style="background-image:url(\'' + imgUrl + '\');">' +
              '<div class="icon d-flex justify-content-center align-items-center"><span class="icon-search2"></span></div>' +
            '</a>' +
            '<div class="text p-3 text-center">' +
              '<h3 class="mb-1" style="font-size:16px"><a href="tour-single.html?id=' + tour.id + '">' + tour.title + '</a></h3>' +
              '<p class="mb-1">' + renderStars(tour.rating) + ' <small class="text-muted">(' + (tour.bookingCount || 0) + ' ' + t('tours.bookedWord') + ')</small></p>' +
              '<p class="mb-1"><small><span class="ion-ios-location"></span> ' + tour.location + '</small></p>' +
              '<p class="mb-1"><small><span class="ion-ios-time"></span> ' + tour.duration + '</small>' +
              ' &nbsp; <small><span class="ion-ios-people"></span> ' + t('tours.maxPrefix') + ' ' + tour.maxGuests + ' ' + t('tours.guestsWord') + '</small></p>' +
              '<p class="d-none"><span class="price mr-2">' + formatPrice(tour.price) + '</span><span class="per">' + t('tours.perPerson') + '</span></p>' +
              '<hr>' +
              '<p class="pt-1">' +
                '<a href="tour-single.html?id=' + tour.id + '" class="btn-custom">' + t('common.viewDetails') + ' <span class="icon-long-arrow-right"></span></a>' +
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
        if (!isNaN(page) && page >= 1 && page <= pagination.totalPages) loadTours(page);
      });
    });
  }

  function buildQuery(page) {
    var p = new URLSearchParams();
    p.set('page', page);
    p.set('limit', 6);
    if (currentFilters.q)        p.set('q', currentFilters.q);
    if (currentFilters.location) p.set('location', currentFilters.location);
    if (currentFilters.minPrice) p.set('minPrice', currentFilters.minPrice);
    if (currentFilters.maxPrice) p.set('maxPrice', currentFilters.maxPrice);
    if (currentFilters.minRating) p.set('minRating', currentFilters.minRating);
    return '/tours?' + p.toString();
  }

  function loadTours(page) {
    currentPage = page;
    container.innerHTML = '<div class="col-12 text-center py-5"><p>' + t('common.loading') + '</p></div>';
    api.get(buildQuery(page)).then(function (res) {
      if (!res.success) {
        container.innerHTML = '<div class="col-12"><p class="text-danger text-center">' + t('tours.loadFail') + '</p></div>';
        return;
      }
      renderTours(res.data);
      renderPagination(res.pagination);
      activateAnimate(container);
    }).catch(function () {
      container.innerHTML = '<div class="col-12"><p class="text-danger text-center">' + t('common.connFail') + '</p></div>';
    });
  }

  document.addEventListener('i18n:changed', function () { loadTours(currentPage); });

  // Filter form
  document.getElementById('tour-filter-form').addEventListener('submit', function (e) {
    e.preventDefault();
    currentFilters = {
      q:        document.getElementById('filter-q').value.trim(),
      location: document.getElementById('filter-location').value.trim(),
      minPrice: document.getElementById('filter-min-price').value,
      maxPrice: document.getElementById('filter-max-price').value
    };
    loadTours(1);
  });

  document.getElementById('btn-reset').addEventListener('click', function () {
    document.getElementById('tour-filter-form').reset();
    document.querySelectorAll('.rating-check').forEach(function (cb) { cb.checked = false; });
    currentFilters = {};
    loadTours(1);
  });

  document.querySelectorAll('.rating-check').forEach(function (cb) {
    cb.addEventListener('change', function () {
      var checked = document.querySelector('.rating-check:checked');
      currentFilters.minRating = checked ? checked.value : '';
      loadTours(1);
    });
  });

  loadTours(1);
});
