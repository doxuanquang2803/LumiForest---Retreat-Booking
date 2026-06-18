document.addEventListener('DOMContentLoaded', function () {
  var container    = document.getElementById('blog-list');
  var paginWrap    = document.getElementById('pagination-wrap');
  if (!container) return;

  var currentPage = 1;

  function getPostImage(post) {
    if (post.image) return api.resolveUrl(post.image);
    if (post.content) {
      var m = post.content.match(/<img[^>]+src=["']([^"']+)["']/i);
      if (m && m[1] && !m[1].startsWith('data:')) return m[1];
    }
    return 'assets/images/image_1.jpg';
  }

  function loadBlog(page) {
    currentPage = page || 1;
    container.innerHTML = '<div class="col-12 text-center py-5"><p>' + t('common.loading') + '</p></div>';

    api.get('/blog?page=' + currentPage + '&limit=8').then(function (res) {
      if (!res.success || !res.data || !res.data.length) {
        container.innerHTML = '<div class="col-12 text-center py-5"><p class="text-muted">' + t('blog.none') + '</p></div>';
        renderPagination(null);
        return;
      }

      var locale = (window.I18N && I18N.getLang() === 'vi') ? 'vi-VN' : 'en-US';

      container.innerHTML = res.data.map(function (post) {
        var date = post.published_at
          ? new Date(post.published_at).toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' })
          : '';

        var imgUrl = getPostImage(post);

        return (
          '<div class="col-md-6 col-lg-3 d-flex ftco-animate">' +
            '<div class="blog-entry align-self-stretch">' +
              '<a href="blog-single.html?id=' + post.id + '" class="block-20"' +
                ' style="background-image: url(\'' + imgUrl + '\');"></a>' +
              '<div class="text mt-3 d-block">' +
                (post.category
                  ? '<div class="meta mb-2"><span class="badge badge-warning text-dark px-2 py-1" style="font-size:11px">' + post.category + '</span></div>'
                  : '') +
                '<h3 class="heading mt-2"><a href="blog-single.html?id=' + post.id + '">' + post.title + '</a></h3>' +
                (post.summary
                  ? '<p class="text-muted" style="font-size:13px;line-height:1.5">' + post.summary.substring(0, 100) + (post.summary.length > 100 ? '…' : '') + '</p>'
                  : '') +
                '<div class="meta mb-2">' +
                  (date ? '<div><a href="#"><span class="icon-calendar mr-1"></span>' + date + '</a></div>' : '') +
                  '<div><a href="#"><span class="icon-person mr-1"></span>' + (post.author || 'Admin') + '</a></div>' +
                  '<div><span class="icon-eye mr-1"></span>' + (post.views || 0) + '</div>' +
                '</div>' +
              '</div>' +
            '</div>' +
          '</div>'
        );
      }).join('');

      renderPagination(res.pagination);

      // Animate cards
      container.querySelectorAll('.ftco-animate').forEach(function (el) {
        el.classList.add('ftco-animated', 'fadeInUp');
      });

    }).catch(function () {
      container.innerHTML = '<div class="col-12 text-center py-5"><p class="text-danger">' + t('common.connFail') + '</p></div>';
    });
  }

  function renderPagination(pagination) {
    if (!paginWrap) return;
    if (!pagination || pagination.totalPages <= 1) { paginWrap.innerHTML = ''; return; }

    var html = '<div class="block-27"><ul>';
    html += '<li' + (pagination.page <= 1 ? ' class="disabled"' : '') + '><a href="#" data-page="' + (pagination.page - 1) + '">&lt;</a></li>';
    for (var i = 1; i <= pagination.totalPages; i++) {
      html += i === pagination.page
        ? '<li class="active"><span>' + i + '</span></li>'
        : '<li><a href="#" data-page="' + i + '">' + i + '</a></li>';
    }
    html += '<li' + (pagination.page >= pagination.totalPages ? ' class="disabled"' : '') + '><a href="#" data-page="' + (pagination.page + 1) + '">&gt;</a></li>';
    html += '</ul></div>';
    paginWrap.innerHTML = html;

    paginWrap.querySelectorAll('a[data-page]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        var p = parseInt(this.dataset.page);
        if (!isNaN(p) && p >= 1 && p <= pagination.totalPages) loadBlog(p);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });
  }

  loadBlog(1);
  document.addEventListener('i18n:changed', function () { loadBlog(currentPage); });
});
