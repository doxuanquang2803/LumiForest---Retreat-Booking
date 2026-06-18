document.addEventListener('DOMContentLoaded', function () {
  var loading     = document.getElementById('notif-loading');
  var empty       = document.getElementById('notif-empty');
  var listEl      = document.getElementById('notif-list');
  var paginWrap   = document.getElementById('pagination-wrap');
  var unreadBadge = document.getElementById('unread-badge');
  var btnMarkAll  = document.getElementById('btn-mark-all');
  if (!listEl) return;

  if (!Auth.isLoggedIn()) {
    loading.style.display = 'none';
    listEl.innerHTML = '<div class="alert alert-warning">' + t('nf.loginToView') + '</div>';
    return;
  }

  var typeLabels = {
    BOOKING_SUCCESS:    { label: t('nf.type.booking'), color: '#28a745', icon: 'ion-ios-checkmark-circle' },
    PAYMENT_SUCCESS:    { label: t('nf.type.payment'), color: '#007bff', icon: 'ion-ios-card'           },
    BOOKING_CANCELLED:  { label: t('nf.type.cancelled'),      color: '#dc3545', icon: 'ion-ios-close-circle'    },
    VOUCHER_NOTIFICATION:{ label: t('nf.type.voucher'),             color: '#F96D00', icon: 'ion-ios-pricetag'        }
  };

  function timeAgo(dateStr) {
    var diff = Date.now() - new Date(dateStr).getTime();
    var m = Math.floor(diff / 60000);
    if (m < 1)  return t('nf.justNow');
    if (m < 60) return m + ' ' + t('nf.minutesAgo');
    var h = Math.floor(m / 60);
    if (h < 24) return h + ' ' + t('nf.hoursAgo');
    var d = Math.floor(h / 24);
    if (d < 30) return d + ' ' + t('nf.daysAgo');
    return new Date(dateStr).toLocaleDateString(I18N.getLang() === 'vi' ? 'vi-VN' : 'en-US');
  }

  var currentPage = 1;
  var unreadCount = 0;

  function renderNotifications(notifications) {
    if (!notifications.length) {
      empty.style.display = 'block';
      listEl.innerHTML = '';
      return;
    }
    empty.style.display = 'none';

    listEl.innerHTML = notifications.map(function (n) {
      var meta = typeLabels[n.type] || { label: n.type, color: '#999', icon: 'ion-ios-notifications' };
      return (
        '<div class="card border-0 shadow-sm mb-2 notif-item ' + (n.isRead ? '' : 'unread') + '" data-id="' + n.id + '" data-read="' + n.isRead + '">' +
          '<div class="card-body py-3 px-4">' +
            '<div class="d-flex align-items-start">' +
              (!n.isRead ? '<div class="notif-dot mr-3 mt-1"></div>' : '<div style="width:22px" class="mr-3"></div>') +
              '<div class="flex-grow-1">' +
                '<div class="d-flex justify-content-between align-items-start">' +
                  '<div>' +
                    '<span class="badge mr-2" style="background:' + meta.color + ';color:#fff;font-size:11px">' +
                      '<i class="' + meta.icon + '"></i> ' + meta.label +
                    '</span>' +
                    '<strong>' + n.title + '</strong>' +
                  '</div>' +
                  '<div class="d-flex align-items-center ml-2" style="flex-shrink:0;gap:8px">' +
                    '<small class="text-muted">' + timeAgo(n.createdAt) + '</small>' +
                    (!n.isRead
                      ? '<button class="btn-mark-read" data-id="' + n.id + '" title="' + t('nf.markReadTitle') + '">' + t('nf.markRead') + '</button>'
                      : '') +
                    '<button class="btn-delete-notif" data-id="' + n.id + '" title="' + t('nf.deleteTitle') + '" style="border:none;background:none;color:#999;font-size:16px">&#10005;</button>' +
                  '</div>' +
                '</div>' +
                '<p class="mb-0 mt-1 text-muted" style="font-size:14px">' + n.message + '</p>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>'
      );
    }).join('');

    // Sự kiện mark as read
    listEl.querySelectorAll('.btn-mark-read').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        markRead(this.dataset.id);
      });
    });

    // Sự kiện xóa
    listEl.querySelectorAll('.btn-delete-notif').forEach(function (btn) {
      btn.addEventListener('click', async function (e) {
        e.stopPropagation();
        const id = this.dataset.id;
        const confirmed = await window.CustomAlert.confirm(t('nf.deleteConfirm') || 'Bạn có chắc chắn muốn xóa thông báo này không?');
        if (confirmed) {
          deleteNotif(id);
        }
      });
    });

    // Click vào item → mark read
    listEl.querySelectorAll('.notif-item.unread').forEach(function (item) {
      item.addEventListener('click', function () {
        markRead(this.dataset.id);
      });
    });
  }

  function markRead(id) {
    api.authPut('/notifications/' + id + '/read', {}).then(function (res) {
      if (!res.success) return;
      var item = listEl.querySelector('.notif-item[data-id="' + id + '"]');
      if (!item) return;
      item.classList.remove('unread');
      item.dataset.read = 'true';
      var dot = item.querySelector('.notif-dot');
      if (dot) { dot.style.background = 'transparent'; }
      var markBtn = item.querySelector('.btn-mark-read');
      if (markBtn) markBtn.remove();
      unreadCount = Math.max(0, unreadCount - 1);
      updateUnreadUI();
    });
  }

  function deleteNotif(id) {
    api.authDelete('/notifications/' + id).then(function (res) {
      if (!res.success) return;
      var item = listEl.querySelector('.notif-item[data-id="' + id + '"]');
      if (!item) return;
      var wasUnread = item.classList.contains('unread');
      item.style.opacity = '0';
      item.style.transition = 'opacity .25s';
      setTimeout(function () {
        item.remove();
        if (wasUnread) { unreadCount = Math.max(0, unreadCount - 1); updateUnreadUI(); }
        if (!listEl.querySelectorAll('.notif-item').length) empty.style.display = 'block';
      }, 250);
    });
  }

  function markAllRead() {
    var unreadItems = listEl.querySelectorAll('.notif-item.unread');
    unreadItems.forEach(function (item) { markRead(item.dataset.id); });
  }

  function updateUnreadUI() {
    if (unreadBadge) {
      if (unreadCount > 0) {
        unreadBadge.textContent = unreadCount;
        unreadBadge.style.display = 'inline-block';
        if (btnMarkAll) btnMarkAll.style.display = 'inline-block';
      } else {
        unreadBadge.style.display = 'none';
        if (btnMarkAll) btnMarkAll.style.display = 'none';
      }
    }
    // Cập nhật bell trong header
    var headerBell = document.getElementById('notif-bell-count');
    if (headerBell) {
      headerBell.textContent = unreadCount > 0 ? unreadCount : '';
      headerBell.style.display = unreadCount > 0 ? 'inline-block' : 'none';
    }
  }

  function renderPagination(pagination) {
    if (!paginWrap || !pagination || pagination.totalPages <= 1) {
      if (paginWrap) paginWrap.innerHTML = '';
      return;
    }
    var html = '<nav><ul class="pagination justify-content-center">';
    html += '<li class="page-item' + (pagination.page <= 1 ? ' disabled' : '') + '">' +
      '<a class="page-link" href="#" data-page="' + (pagination.page - 1) + '">&laquo;</a></li>';
    for (var i = 1; i <= pagination.totalPages; i++) {
      html += '<li class="page-item' + (i === pagination.page ? ' active' : '') + '">' +
        '<a class="page-link" href="#" data-page="' + i + '">' + i + '</a></li>';
    }
    html += '<li class="page-item' + (pagination.page >= pagination.totalPages ? ' disabled' : '') + '">' +
      '<a class="page-link" href="#" data-page="' + (pagination.page + 1) + '">&raquo;</a></li>';
    html += '</ul></nav>';
    paginWrap.innerHTML = html;
    paginWrap.querySelectorAll('.page-link').forEach(function (link) {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        var page = parseInt(this.dataset.page);
        if (!isNaN(page)) loadNotifications(page);
      });
    });
  }

  function loadNotifications(page) {
    currentPage = page;
    api.authGet('/notifications?page=' + page + '&limit=10').then(function (res) {
      loading.style.display = 'none';
      if (!res.success) {
        listEl.innerHTML = '<div class="alert alert-danger">' + t('nf.loadFail') + '</div>';
        return;
      }
      unreadCount = (res.data || []).filter(function (n) { return !n.isRead; }).length;
      updateUnreadUI();
      renderNotifications(res.data || []);
      renderPagination(res.pagination);
    }).catch(function () {
      loading.style.display = 'none';
      listEl.innerHTML = '<div class="alert alert-danger">' + t('common.connFail') + '</div>';
    });
  }

  if (btnMarkAll) btnMarkAll.addEventListener('click', markAllRead);

  loadNotifications(1);
  document.addEventListener('i18n:changed', function () { loadNotifications(currentPage); });
});
