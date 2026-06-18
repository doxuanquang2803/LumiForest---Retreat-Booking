document.addEventListener('DOMContentLoaded', function () {
  var container = document.getElementById('hotels-list');
  var paginationWrap = document.getElementById('pagination-wrap');
  if (!container) return;

  var currentPage = 1;
  var currentFilters = {};

  function renderStars(count) {
    var html = '';
    for (var i = 1; i <= 5; i++) {
      html += i <= count
        ? '<i class="icon-star" style="color:#F96D00"></i>'
        : '<i class="icon-star-o" style="color:#F96D00"></i>';
    }
    return html;
  }

  function getImageUrl(hotel) {
    if (hotel.thumbnail) return api.resolveUrl(hotel.thumbnail);
    if (hotel.images && hotel.images.length > 0 && hotel.images[0].imageUrl) return api.resolveUrl(hotel.images[0].imageUrl);
    return 'assets/images/room-1.jpg';
  }

  function activateAnimate(root) {
    (root || document).querySelectorAll('.ftco-animate').forEach(function (el) {
      el.classList.add('ftco-animated', 'fadeInUp');
    });
    if (typeof Waypoint !== 'undefined') Waypoint.refreshAll();
  }

  function renderHotels(hotels) {
    if (!hotels || !hotels.length) {
      container.innerHTML = '<div class="col-12"><p class="text-center py-4">' + t('hotels.none') + '</p></div>';
      return;
    }

    container.innerHTML = hotels.map(function (hotel) {
      var imgUrl = getImageUrl(hotel);
      var stars = renderStars(hotel.starRating || 0);
      var badge = hotel.featured
        ? '<span class="badge badge-warning" style="position:absolute;top:10px;left:10px">' + t('common.featured') + '</span>'
        : '';

      return (
        '<div class="col-sm-12 col-md-4 ftco-animate">' +
          '<div class="room" style="position:relative">' +
            badge +
            '<a href="hotel-single.html?id=' + hotel.id + '" class="img d-flex justify-content-center align-items-center"' +
              ' style="background-image: url(\'' + imgUrl + '\');">' +
              '<div class="icon d-flex justify-content-center align-items-center"><span class="icon-search2"></span></div>' +
            '</a>' +
            '<div class="text p-3 text-center">' +
              '<h3 class="mb-1"><a href="hotel-single.html?id=' + hotel.id + '">' + hotel.name + '</a></h3>' +
              '<p class="mb-1">' + stars + '</p>' +
              '<p class="mb-1"><small><span class="ion-ios-location"></span> ' + hotel.location + '</small></p>' +
              // '<p><span class="price mr-2">$' + Number(hotel.price).toLocaleString() + '</span><span class="per">/ night</span></p>' +
              // '<hr>' +
              '<p class="pt-1">' +
                '<a href="hotel-single.html?id=' + hotel.id + '" class="btn-custom">' + t('common.viewDetails') + ' <span class="icon-long-arrow-right"></span></a>' +
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
        if (!isNaN(page) && page >= 1 && page <= pagination.totalPages) {
          loadHotels(page);
        }
      });
    });
  }

  function buildQuery(page) {
    var params = new URLSearchParams();
    params.set('page', page);
    params.set('limit', 6);
    if (currentFilters.q) params.set('q', currentFilters.q);
    if (currentFilters.starRating) params.set('starRating', currentFilters.starRating);
    if (currentFilters.minPrice) params.set('minPrice', currentFilters.minPrice);
    if (currentFilters.maxPrice) params.set('maxPrice', currentFilters.maxPrice);
    return '/hotels?' + params.toString();
  }

  function loadHotels(page) {
    currentPage = page;
    container.innerHTML = '<div class="col-12 text-center py-5"><p>' + t('common.loading') + '</p></div>';

    api.get(buildQuery(page)).then(function (res) {
      if (!res.success) {
        container.innerHTML = '<div class="col-12"><p class="text-danger text-center">' + t('hotels.loadFail') + '</p></div>';
        return;
      }
      renderHotels(res.data);
      renderPagination(res.pagination);
      activateAnimate(container);
    }).catch(function () {
      container.innerHTML = '<div class="col-12"><p class="text-danger text-center">' + t('common.connFail') + '</p></div>';
    });
  }

  // Re-render when language changes
  document.addEventListener('i18n:changed', function () { loadHotels(currentPage); });

  // Filter form
  var filterForm = document.getElementById('hotel-filter-form');
  if (filterForm) {
    filterForm.addEventListener('submit', function (e) {
      e.preventDefault();
      currentFilters = {
        q: document.getElementById('filter-q').value.trim(),
        starRating: document.getElementById('filter-star').value,
        minPrice: document.getElementById('filter-min-price').value,
        maxPrice: document.getElementById('filter-max-price').value
      };
      loadHotels(1);
    });
  }

  var btnReset = document.getElementById('btn-reset');
  if (btnReset) {
    btnReset.addEventListener('click', function () {
      filterForm.reset();
      currentFilters = {};
      loadHotels(1);
    });
  }

  // Star checkbox sidebar filter
  document.querySelectorAll('.star-check').forEach(function (cb) {
    cb.addEventListener('change', function () {
      var checked = document.querySelector('.star-check:checked');
      var star = document.getElementById('filter-star');
      if (star) star.value = checked ? checked.value : '';
      currentFilters.starRating = checked ? checked.value : '';
      loadHotels(1);
    });
  });

  loadHotels(1);
});
