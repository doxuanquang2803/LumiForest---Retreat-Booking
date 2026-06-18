document.addEventListener('DOMContentLoaded', function () {
  var loading  = document.getElementById('wishlist-loading');
  var empty    = document.getElementById('wishlist-empty');
  var listEl   = document.getElementById('wishlist-list');
  if (!listEl) return;

  if (!Auth.isLoggedIn()) {
    loading.style.display = 'none';
    listEl.innerHTML = '<div class="alert alert-warning">' + t('wl.loginToView') + '</div>';
    return;
  }

  var typeMap = {
    HOTEL:     { label: t('wl.hotel'), color: '#F96D00', link: 'hotel-single.html' },
    TOUR:      { label: t('wl.tour'),      color: '#28a745', link: 'tour-single.html'  },
    APARTMENT: { label: t('wl.apartment'),   color: '#007bff', link: 'apartment-single.html' }
  };

  var endpointMap = { HOTEL: '/hotels', TOUR: '/tours', APARTMENT: '/apartments' };

  function formatPrice(p) { return Number(p).toLocaleString('vi-VN') + ' ₫'; }

  function getThumb(item) {
    if (item.thumbnail && item.thumbnail.startsWith('http')) return item.thumbnail;
    if (item.images && item.images.length) return item.images[0].imageUrl;
    return 'assets/images/image_1.jpg';
  }

  function getTitle(item) { return item.title || item.name || t('wl.noName'); }

  function getSubInfo(item, type) {
    if (type === 'HOTEL')     return item.location + ' · ' + (item.starRating || 0) + ' ' + t('wl.starsSuffix');
    if (type === 'TOUR')      return item.location + ' · ' + item.duration;
    if (type === 'APARTMENT') return item.location + ' · ' + item.bedrooms + ' ' + t('apt.bedroomsSuffix') + ' / ' + item.bathrooms + ' ' + t('apt.bathSuffix');
    return item.location || '';
  }

  function renderItem(wishId, itemData, type) {
    var meta   = typeMap[type] || { label: type, color: '#999', link: '#' };
    var thumb  = getThumb(itemData);
    var title  = getTitle(itemData);
    var sub    = getSubInfo(itemData, type);
    var price  = formatPrice(itemData.price);
    var detailLink = meta.link + '?id=' + itemData.id;

    var el = document.createElement('div');
    el.className = 'card wishlist-card border-0 shadow-sm mb-3';
    el.dataset.wishId = wishId;
    el.innerHTML =
      '<div class="d-flex">' +
        '<div class="thumb" style="background-image:url(\'' + thumb + '\')"></div>' +
        '<div class="card-body py-3 px-3 flex-grow-1">' +
          '<div class="d-flex justify-content-between align-items-start">' +
            '<div>' +
              '<span class="badge badge-type mr-2" style="background:' + meta.color + ';color:#fff">' + meta.label + '</span>' +
              '<a href="' + detailLink + '" class="text-dark font-weight-bold" style="font-size:15px">' + title + '</a>' +
            '</div>' +
            '<button class="btn-remove" data-wish-id="' + wishId + '" title="' + t('wl.removeTitle') + '">&#10005;</button>' +
          '</div>' +
          '<p class="text-muted mb-1 mt-1" style="font-size:13px"><span class="ion-ios-location"></span> ' + sub + '</p>' +
          '<p class="mb-0 d-none"><strong style="color:#F96D00">' + price + '</strong>' +
            '<span class="text-muted" style="font-size:12px"> / ' + (type === 'TOUR' ? t('as.people') : t('as.nights')) + '</span>' +
          '</p>' +
        '</div>' +
      '</div>';

    el.querySelector('.btn-remove').addEventListener('click', function () {
      removeItem(wishId, el);
    });

    return el;
  }

  function removeItem(wishId, el) {
    var btn = el.querySelector('.btn-remove');
    btn.disabled = true;
    btn.textContent = '...';

    api.authDelete('/wishlist/' + wishId).then(function (res) {
      console.log('[Wishlist delete]', wishId, res);
      if (res.success) {
        el.style.opacity = '0';
        el.style.transition = 'opacity .3s';
        setTimeout(function () {
          el.remove();
          if (!listEl.children.length) empty.style.display = 'block';
        }, 300);
      } else {
        window.CustomAlert.alert(t('wl.errPrefix') + (res.message || t('wl.deleteErr')));
        btn.disabled = false;
        btn.innerHTML = '&#10005;';
      }
    }).catch(function (err) {
      console.error('[Wishlist delete error]', err);
      window.CustomAlert.alert(t('common.connFail'));
      btn.disabled = false;
      btn.innerHTML = '&#10005;';
    });
  }

  // Load wishlist
  api.authGet('/wishlist').then(function (res) {
    loading.style.display = 'none';
    if (!res.success || !res.data || !res.data.length) {
      empty.style.display = 'block';
      return;
    }

    var items = res.data;

    // Nhóm theo type
    var grouped = { HOTEL: [], TOUR: [], APARTMENT: [] };
    items.forEach(function (item) {
      if (grouped[item.itemType]) grouped[item.itemType].push(item);
    });

    // Fetch chi tiết song song cho từng type
    var fetchPromises = [];
    ['HOTEL', 'TOUR', 'APARTMENT'].forEach(function (type) {
      grouped[type].forEach(function (wItem) {
        var endpoint = endpointMap[type];
        if (!endpoint) return;
        fetchPromises.push(
          api.get(endpoint + '/' + wItem.itemId)
            .then(function (r) {
              return r.success ? { wishId: wItem.id, data: r.data, type: type } : null;
            })
            .catch(function () { return null; })
        );
      });
    });

    Promise.all(fetchPromises).then(function (results) {
      var rendered = 0;
      results.forEach(function (result) {
        if (!result || !result.data) return;
        listEl.appendChild(renderItem(result.wishId, result.data, result.type));
        rendered++;
      });
      if (!rendered) empty.style.display = 'block';
    });

  }).catch(function () {
    loading.style.display = 'none';
    listEl.innerHTML = '<div class="alert alert-danger">' + t('wl.loadFail') + '</div>';
  });

  // document.addEventListener('i18n:changed', function () { location.reload(); });
});

// Hàm dùng chung cho các trang detail để toggle wishlist
window.WishlistBtn = {
  init: function (itemId, itemType, btnEl) {
    if (!Auth.isLoggedIn()) {
      btnEl.title = t('wl.loginToSave');
      btnEl.addEventListener('click', function (e) {
        e.preventDefault();
        window.location.href = 'login.html';
      });
      return;
    }

    var wishId = null;

    // Kiểm tra xem đã trong wishlist chưa
    api.authGet('/wishlist').then(function (res) {
      if (!res.success) return;
      var found = res.data.find(function (w) {
        return String(w.itemId) === String(itemId) && w.itemType === itemType;
      });
      if (found) {
        wishId = found.id;
        btnEl.classList.add('wishlisted');
        btnEl.innerHTML = '<span class="ion-ios-heart" style="color:#F96D00"></span> ' + t('wl.saved');
      }
    });

    btnEl.addEventListener('click', function (e) {
      e.preventDefault();
      if (wishId) {
        // Xóa
        api.authDelete('/wishlist/' + wishId).then(function (res) {
          if (res.success) {
            wishId = null;
            btnEl.classList.remove('wishlisted');
            btnEl.innerHTML = '<span class="ion-ios-heart-empty"></span> ' + t('wl.save');
          }
        });
      } else {
        // Thêm
        api.authPost('/wishlist', { itemId: parseInt(itemId), itemType: itemType }).then(function (res) {
          if (res.success) {
            wishId = res.data.id;
            btnEl.classList.add('wishlisted');
            btnEl.innerHTML = '<span class="ion-ios-heart" style="color:#F96D00"></span> ' + t('wl.saved');
          } else {
            window.CustomAlert.alert(res.message || t('wl.addFail'));
          }
        });
      }
    });
  }
};
