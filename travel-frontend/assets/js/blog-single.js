document.addEventListener('DOMContentLoaded', function () {
  var params = new URLSearchParams(window.location.search);
  var postId = params.get('id');
  var content = document.getElementById('post-content');
  if (!content) return;

  if (!postId) {
    content.innerHTML = '<p class="text-danger">Post not found. <a href="blog.html">Back to Blog</a></p>';
    return;
  }

  function getPostImage(post) {
    if (post.image) return api.resolveUrl(post.image);
    if (post.content) {
      var m = post.content.match(/<img[^>]+src=["']([^"']+)["']/i);
      // Only use real URLs, skip base64 data URIs
      if (m && m[1] && !m[1].startsWith('data:')) return m[1];
    }
    return null;
  }

  var locale = function () {
    return (window.I18N && I18N.getLang() === 'vi') ? 'vi-VN' : 'en-US';
  };

  function fmtDate(str) {
    if (!str) return '';
    return new Date(str).toLocaleDateString(locale(), { year: 'numeric', month: 'long', day: 'numeric' });
  }

  // ── Load main post ──────────────────────────────────────────
  function loadPost() {
    content.innerHTML = '<div class="text-center py-5"><p>' + (window.t ? t('common.loading') : 'Loading...') + '</p></div>';

    api.get('/blog/' + postId).then(function (res) {
      if (!res.success || !res.data) {
        content.innerHTML = '<p class="text-danger">Post not found. <a href="blog.html">Back to Blog</a></p>';
        return;
      }

      var post = res.data;

      // Update page title
      document.title = post.title + ' - LumiForest Blog';

      // Update hero breadcrumb
      var breadcrumbTitle = document.getElementById('breadcrumb-post-title');
      var heroTitle       = document.getElementById('hero-post-title');
      if (breadcrumbTitle) breadcrumbTitle.textContent = post.title;
      if (heroTitle)       heroTitle.textContent       = post.title;

      var postImg = getPostImage(post);

      // Tags
      var tagsHtml = '';
      if (post.tags && post.tags.length) {
        tagsHtml =
          '<div class="tag-widget post-tag-container mb-5 mt-5">' +
            '<div class="tagcloud">' +
              post.tags.map(function (tag) {
                return '<a href="blog.html" class="tag-cloud-link">' + tag + '</a>';
              }).join('') +
            '</div>' +
          '</div>';
      }

      // Sidebar tags update
      var sidebarTags = document.getElementById('sidebar-tags');
      if (sidebarTags && post.tags && post.tags.length) {
        sidebarTags.innerHTML =
          '<h3>' + (window.t ? t('bs.tagCloud') : 'Tag Cloud') + '</h3>' +
          '<div class="tagcloud">' +
            post.tags.map(function (tag) {
              return '<a href="blog.html" class="tag-cloud-link">' + tag + '</a>';
            }).join('') +
          '</div>';
      }

      content.innerHTML =
        // Title + meta
        '<h2 class="mb-3">' + post.title + '</h2>' +
        '<div class="meta-info d-flex flex-wrap align-items-center mb-4" style="gap:16px;font-size:13px;color:#888">' +
          (post.category ? '<span class="badge badge-warning text-dark px-2 py-1">' + post.category + '</span>' : '') +
          (post.published_at ? '<span><span class="icon-calendar mr-1"></span>' + fmtDate(post.published_at) + '</span>' : '') +
          '<span><span class="icon-person mr-1"></span>' + (post.author || 'Admin') + '</span>' +
          '<span><span class="icon-eye mr-1"></span>' + (post.views || 0) + ' views</span>' +
        '</div>' +

        // Featured image
        (postImg
          ? '<p><img src="' + postImg + '" alt="' + post.title + '" class="img-fluid rounded mb-4"></p>'
          : '') +

        // Summary
        (post.summary
          ? '<p class="lead">' + post.summary + '</p>'
          : '') +

        // Full content (HTML from Quill editor)
        '<div class="post-body">' + (post.content || '') + '</div>' +

        // Tags
        tagsHtml +

        // Author box
        '<div class="about-author d-flex p-4 bg-light mt-5">' +
          '<div class="bio align-self-md-center mr-4">' +
            '<div class="rounded-circle bg-secondary d-flex align-items-center justify-content-center" style="width:60px;height:60px;flex-shrink:0">' +
              '<span class="icon-person" style="font-size:28px;color:#fff"></span>' +
            '</div>' +
          '</div>' +
          '<div class="desc align-self-md-center">' +
            '<h3 class="mb-1">' + (post.author || 'Admin') + '</h3>' +
            (post.category ? '<p class="mb-0 text-muted" style="font-size:13px">' + post.category + '</p>' : '') +
          '</div>' +
        '</div>';

    }).catch(function () {
      content.innerHTML = '<p class="text-danger">' + (window.t ? t('common.connFail') : 'Unable to connect.') + '</p>';
    });
  }

  // ── Load recent posts in sidebar ────────────────────────────
  function loadRecent() {
    var sidebar = document.getElementById('sidebar-recent');
    if (!sidebar) return;

    api.get('/blog?limit=3').then(function (res) {
      if (!res.success || !res.data || !res.data.length) return;

      sidebar.innerHTML = res.data.map(function (post) {
        var imgUrl = getPostImage(post);
        return (
          '<div class="block-21 mb-4 d-flex">' +
            '<a class="blog-img mr-4" href="blog-single.html?id=' + post.id + '"' +
              ' style="background-image: url(\'' + imgUrl + '\');"></a>' +
            '<div class="text">' +
              '<h3 class="heading"><a href="blog-single.html?id=' + post.id + '">' + post.title + '</a></h3>' +
              '<div class="meta">' +
                '<div><a href="#"><span class="icon-calendar"></span> ' + fmtDate(post.published_at) + '</a></div>' +
                '<div><a href="#"><span class="icon-person"></span> ' + (post.author || 'Admin') + '</a></div>' +
              '</div>' +
            '</div>' +
          '</div>'
        );
      }).join('');
    }).catch(function () {});
  }

  // ── Comments ────────────────────────────────────────────────
  function getInitials(name) {
    return name.split(' ').map(function (w) { return w[0]; }).join('').toUpperCase().slice(0, 2);
  }

  function fmtCommentDate(str) {
    if (!str) return '';
    return new Date(str).toLocaleDateString(locale(), { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  function buildCommentHtml(c, isReply) {
    var replyLabel = window.t ? t('bs.reply') : 'Reply';
    return (
      '<li class="comment" data-comment-id="' + c.id + '">' +
        '<div class="vcard bio">' +
          '<div class="rounded-circle bg-secondary d-flex align-items-center justify-content-center" style="width:60px;height:60px;font-size:20px;font-weight:700;color:#fff;flex-shrink:0">' +
            getInitials(c.authorName) +
          '</div>' +
        '</div>' +
        '<div class="comment-body">' +
          '<h3>' + c.authorName + '</h3>' +
          '<div class="meta">' + fmtCommentDate(c.createdAt) + '</div>' +
          '<p>' + c.content.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>') + '</p>' +
          (!isReply ? '<p><a href="#comment-form" class="reply js-reply-btn" data-comment-id="' + c.id + '" data-author-name="' + c.authorName.replace(/"/g, '&quot;') + '">' + replyLabel + '</a></p>' : '') +
        '</div>' +
        (c.replies && c.replies.length
          ? '<ul class="children">' + c.replies.map(function (r) { return buildCommentHtml(r, true); }).join('') + '</ul>'
          : '') +
      '</li>'
    );
  }

  function loadComments() {
    var list = document.getElementById('comment-list');
    var heading = document.getElementById('comments-heading');
    if (!list) return;

    api.get('/blog/' + postId + '/comments').then(function (res) {
      if (!res.success) { list.innerHTML = ''; return; }

      var comments = res.data;
      var count = res.count || 0;

      if (heading) {
        var label = (window.t ? t('bs.commentsCount') : 'Comments') || 'Comments';
        heading.textContent = count + ' ' + label;
      }

      if (!comments.length) {
        list.innerHTML = '<li class="text-muted py-2" style="list-style:none">' + (window.t ? t('bs.noComments') : 'No comments yet. Be the first to comment!') + '</li>';
        return;
      }

      list.innerHTML = comments.map(function (c) { return buildCommentHtml(c, false); }).join('');

      list.querySelectorAll('.js-reply-btn').forEach(function (btn) {
        btn.addEventListener('click', function (e) {
          e.preventDefault();
          var cid = btn.dataset.commentId;
          var name = btn.dataset.authorName;
          document.getElementById('comment-parent-id').value = cid;
          var notice = document.getElementById('reply-notice');
          var nameEl = document.getElementById('reply-to-name');
          if (notice) notice.classList.remove('d-none');
          if (nameEl) nameEl.textContent = name;
          var form = document.getElementById('comment-form');
          if (form) {
            form.scrollIntoView({ behavior: 'smooth', block: 'start' });
            setTimeout(function () {
              var nameInput = document.getElementById('comment-name');
              if (nameInput) nameInput.focus();
            }, 400);
          }
        });
      });
    }).catch(function () {});
  }

  function initCommentForm() {
    var form = document.getElementById('comment-form');
    if (!form) return;

    var cancelReply = document.getElementById('cancel-reply');
    if (cancelReply) {
      cancelReply.addEventListener('click', function (e) {
        e.preventDefault();
        document.getElementById('comment-parent-id').value = '';
        document.getElementById('reply-notice').classList.add('d-none');
      });
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = document.getElementById('comment-submit');
      var alertBox = document.getElementById('comment-alert');
      var name = (document.getElementById('comment-name').value || '').trim();
      var email = (document.getElementById('comment-email').value || '').trim();
      var content = (document.getElementById('comment-message').value || '').trim();
      var parentId = document.getElementById('comment-parent-id').value;

      alertBox.className = 'd-none mb-3';
      alertBox.textContent = '';

      if (!name || !email || !content) {
        alertBox.className = 'alert alert-danger mb-3';
        alertBox.textContent = window.t ? t('bs.commentRequired') : 'Please fill in all required fields.';
        return;
      }

      btn.disabled = true;
      var origText = btn.textContent;
      btn.textContent = window.t ? t('common.loading') : 'Sending...';

      var payload = { authorName: name, authorEmail: email, content: content };
      if (parentId) payload.parentId = parentId;

      api.post('/blog/' + postId + '/comments', payload).then(function (res) {
        btn.disabled = false;
        btn.textContent = origText;
        if (res.success) {
          alertBox.className = 'alert alert-success mb-3';
          alertBox.textContent = window.t ? t('bs.commentSuccess') : 'Your comment has been posted!';
          form.reset();
          document.getElementById('comment-parent-id').value = '';
          var notice = document.getElementById('reply-notice');
          if (notice) notice.classList.add('d-none');
          loadComments();
        } else {
          alertBox.className = 'alert alert-danger mb-3';
          alertBox.textContent = res.message || (window.t ? t('bs.commentFail') : 'Failed to post comment.');
        }
      }).catch(function () {
        btn.disabled = false;
        btn.textContent = origText;
        alertBox.className = 'alert alert-danger mb-3';
        alertBox.textContent = window.t ? t('common.connFail') : 'Unable to connect to server.';
      });
    });
  }

  loadPost();
  loadRecent();
  loadComments();
  initCommentForm();

  document.addEventListener('i18n:changed', function () {
    loadPost();
    loadRecent();
    loadComments();
  });
});
