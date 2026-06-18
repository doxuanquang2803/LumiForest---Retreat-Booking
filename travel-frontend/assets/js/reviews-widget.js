/**
 * Widget đánh giá dùng chung cho hotel / tour / apartment single page.
 *
 * Cách dùng:
 *   ReviewsWidget.init({ mountId: 'reviews-section', targetType: 'HOTEL', targetId: 12 });
 *
 * Phụ thuộc: api (api.js), Auth (auth.js) — đã được include trước file này.
 */
(function (global) {
  'use strict';

  var PATH = { HOTEL: 'hotel', TOUR: 'tour', APARTMENT: 'apartment' };
  var LABEL = { HOTEL: 'khách sạn', TOUR: 'tour', APARTMENT: 'căn hộ' };

  function el(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function fmtDate(d) {
    try { return new Date(d).toLocaleDateString('vi-VN'); } catch (e) { return ''; }
  }
  function stars(n, interactive, idPrefix) {
    n = Math.round(n || 0);
    var html = '';
    for (var i = 1; i <= 5; i++) {
      var cls = i <= n ? 'icon-star' : 'icon-star-o';
      if (interactive) {
        html += '<i class="' + cls + ' rv-star-pick" data-val="' + i + '" ' +
          'style="color:#F96D00;cursor:pointer;font-size:22px;margin-right:2px"></i>';
      } else {
        html += '<i class="' + cls + '" style="color:#F96D00"></i>';
      }
    }
    return html;
  }

  function ReviewsWidget(opts) {
    this.mount = el(opts.mountId);
    this.targetType = opts.targetType;
    this.targetId = opts.targetId;
    this.page = 1;
    this.limit = opts.limit || 5;
    this.pickedRating = 0;
    this.editingId = null; // review id đang sửa (của chính user)
  }

  ReviewsWidget.prototype.endpoint = function () {
    return '/reviews/' + PATH[this.targetType] + '/' + this.targetId;
  };

  ReviewsWidget.prototype.currentUser = function () {
    try { return (global.Auth && Auth.getUser) ? Auth.getUser() : null; }
    catch (e) { return null; }
  };

  ReviewsWidget.prototype.render = function () {
    this.mount.innerHTML =
      '<div class="col-12">' +
        '<h4 class="mb-4" id="rv-title">Đánh giá</h4>' +
        '<div id="rv-summary" class="mb-4"></div>' +
        '<div id="rv-form-area" class="mb-4"></div>' +
        '<div id="rv-list">Đang tải đánh giá...</div>' +
        '<div id="rv-pagination" class="mt-3 text-center"></div>' +
      '</div>';
    this.load();
  };

  ReviewsWidget.prototype.load = function () {
    var self = this;
    api.get(self.endpoint() + '?page=' + self.page + '&limit=' + self.limit)
      .then(function (res) {
        if (!res || !res.success) { el('rv-list').innerHTML = '<p class="text-danger">Không tải được đánh giá.</p>'; return; }
        self.renderSummary(res.stats || { averageRating: 0, totalReviews: 0 });
        self.renderList(res.data || [], res.pagination || {});
        self.renderForm(res.data || []);
      })
      .catch(function () {
        el('rv-list').innerHTML = '<p class="text-danger">Không tải được đánh giá.</p>';
      });
  };

  ReviewsWidget.prototype.renderSummary = function (stats) {
    el('rv-summary').innerHTML =
      '<div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">' +
        '<span style="font-size:32px;font-weight:700">' + (stats.averageRating || 0).toFixed(1) + '</span>' +
        '<span>' + stars(stats.averageRating) + '</span>' +
        '<span class="text-muted">(' + (stats.totalReviews || 0) + ' đánh giá)</span>' +
      '</div>';
  };

  ReviewsWidget.prototype.renderList = function (reviews, pagination) {
    var self = this;
    var me = this.currentUser();
    var myId = me ? String(me.id) : null;

    if (!reviews.length) {
      el('rv-list').innerHTML = '<p class="text-muted">Chưa có đánh giá nào. Hãy là người đầu tiên!</p>';
    } else {
      el('rv-list').innerHTML = reviews.map(function (r) {
        var owner = myId && String(r.user && r.user.id) === myId;
        var actions = owner
          ? '<div class="mt-2">' +
              '<a href="#" class="rv-edit small mr-3" data-id="' + r.id + '" data-rating="' + r.rating + '">Sửa</a>' +
              '<a href="#" class="rv-delete small text-danger" data-id="' + r.id + '">Xóa</a>' +
            '</div>'
          : '';
        return '<div class="rv-item mb-3 pb-3" style="border-bottom:1px solid #eee">' +
          '<div style="display:flex;justify-content:space-between;align-items:center">' +
            '<strong>' + esc(r.user && (r.user.name || r.user.email) || 'Ẩn danh') + '</strong>' +
            '<small class="text-muted">' + fmtDate(r.createdAt) + '</small>' +
          '</div>' +
          '<div>' + stars(r.rating) + '</div>' +
          (r.comment ? '<p class="mb-0 mt-1">' + esc(r.comment) + '</p>' : '') +
          actions +
        '</div>';
      }).join('');

      // gắn sự kiện sửa / xóa
      Array.prototype.forEach.call(self.mount.querySelectorAll('.rv-edit'), function (a) {
        a.addEventListener('click', function (e) {
          e.preventDefault();
          self.editingId = a.getAttribute('data-id');
          self.pickedRating = parseInt(a.getAttribute('data-rating'), 10) || 0;
          self.renderForm([], true);
          el('rv-form-area').scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
      });
      Array.prototype.forEach.call(self.mount.querySelectorAll('.rv-delete'), function (a) {
        a.addEventListener('click', async function (e) {
          e.preventDefault();
          const confirmed = await window.CustomAlert.confirm('Xóa đánh giá này?');
          if (!confirmed) return;
          api.authDelete('/reviews/' + a.getAttribute('data-id')).then(function (res) {
            if (res && res.success) { self.page = 1; self.load(); }
            else window.CustomAlert.alert((res && res.message) || 'Xóa thất bại');
          });
        });
      });
    }

    self.renderPagination(pagination);
  };

  ReviewsWidget.prototype.renderPagination = function (p) {
    var self = this;
    var box = el('rv-pagination');
    if (!p || !p.totalPages || p.totalPages <= 1) { box.innerHTML = ''; return; }
    var html = '';
    if (p.page > 1) html += '<button class="btn btn-sm btn-outline-secondary mr-2" data-pg="' + (p.page - 1) + '">‹ Trước</button>';
    html += '<span class="mx-2">Trang ' + p.page + '/' + p.totalPages + '</span>';
    if (p.page < p.totalPages) html += '<button class="btn btn-sm btn-outline-secondary ml-2" data-pg="' + (p.page + 1) + '">Sau ›</button>';
    box.innerHTML = html;
    Array.prototype.forEach.call(box.querySelectorAll('button[data-pg]'), function (b) {
      b.addEventListener('click', function () { self.page = parseInt(b.getAttribute('data-pg'), 10); self.load(); });
    });
  };

  ReviewsWidget.prototype.renderForm = function (reviews, keepEditing) {
    var self = this;
    var area = el('rv-form-area');
    var me = this.currentUser();

    if (!me) {
      area.innerHTML = '<div class="alert alert-light border">Vui lòng <a href="login.html">đăng nhập</a> để viết đánh giá.</div>';
      return;
    }

    // Nếu user đã có đánh giá trên trang hiện tại và không đang sửa → ẩn form tạo mới
    var myId = String(me.id);
    var mine = (reviews || []).filter(function (r) { return String(r.user && r.user.id) === myId; })[0];
    if (mine && !keepEditing && !self.editingId) {
      area.innerHTML = '<div class="alert alert-light border">Bạn đã đánh giá ' + LABEL[self.targetType] +
        ' này. Bạn có thể sửa hoặc xóa đánh giá của mình bên dưới.</div>';
      return;
    }

    var editing = !!self.editingId;
    area.innerHTML =
      '<div class="p-3" style="background:#fafafa;border:1px solid #eee;border-radius:6px">' +
        '<h6 class="mb-3">' + (editing ? 'Sửa đánh giá của bạn' : 'Viết đánh giá') + '</h6>' +
        '<div class="mb-2" id="rv-star-input">' + stars(self.pickedRating, true) + '</div>' +
        '<textarea id="rv-comment" class="form-control mb-2" rows="3" placeholder="Chia sẻ trải nghiệm của bạn (tùy chọn)"></textarea>' +
        '<div id="rv-msg" class="small mb-2"></div>' +
        '<button id="rv-submit" class="btn btn-primary btn-sm">' + (editing ? 'Cập nhật' : 'Gửi đánh giá') + '</button>' +
        (editing ? '<button id="rv-cancel" class="btn btn-link btn-sm">Hủy</button>' : '') +
        (!editing ? '<small class="text-muted d-block mt-2">* Chỉ khách đã đặt và sử dụng dịch vụ mới gửi được đánh giá.</small>' : '') +
      '</div>';

    // chọn sao (gắn lại mỗi lần render lại dãy sao)
    function bindStars() {
      Array.prototype.forEach.call(el('rv-star-input').querySelectorAll('.rv-star-pick'), function (st) {
        st.addEventListener('click', function () {
          self.pickedRating = parseInt(st.getAttribute('data-val'), 10);
          el('rv-star-input').innerHTML = stars(self.pickedRating, true);
          bindStars();
        });
      });
    }
    bindStars();

    if (editing) {
      el('rv-cancel').addEventListener('click', function (e) {
        e.preventDefault();
        self.editingId = null; self.pickedRating = 0; self.load();
      });
    }

    el('rv-submit').addEventListener('click', function () {
      self.submit();
    });
  };

  ReviewsWidget.prototype.submit = function () {
    var self = this;
    var msg = el('rv-msg');
    var rating = self.pickedRating;
    var comment = (el('rv-comment').value || '').trim();

    if (!rating) { msg.innerHTML = '<span class="text-danger">Vui lòng chọn số sao.</span>'; return; }
    el('rv-submit').disabled = true;
    msg.innerHTML = 'Đang gửi...';

    var done = function (res) {
      el('rv-submit').disabled = false;
      if (res && res.success) {
        self.editingId = null; self.pickedRating = 0; self.page = 1; self.load();
      } else {
        msg.innerHTML = '<span class="text-danger">' + esc((res && res.message) || 'Gửi thất bại') + '</span>';
      }
    };

    if (self.editingId) {
      api.authPut('/reviews/' + self.editingId, { rating: rating, comment: comment }).then(done)
        .catch(function () { el('rv-submit').disabled = false; msg.innerHTML = '<span class="text-danger">Lỗi kết nối.</span>'; });
    } else {
      api.authPost('/reviews', {
        targetId: Number(self.targetId), targetType: self.targetType, rating: rating, comment: comment
      }).then(done)
        .catch(function () { el('rv-submit').disabled = false; msg.innerHTML = '<span class="text-danger">Lỗi kết nối.</span>'; });
    }
  };

  global.ReviewsWidget = {
    init: function (opts) {
      if (!el(opts.mountId) || !opts.targetId) return;
      var w = new ReviewsWidget(opts);
      w.render();
      return w;
    }
  };
})(window);
