import { BaseApi } from '../../services/BaseApi.js';
import { CONFIG } from '../../services/config.js';
import { TableRender } from '../../components/TableRender.js';
import { ModalManager } from '../../components/ModalManager.js';
import { ToastManager } from '../../components/ToastManager.js';
import { PermissionManager } from '../../services/PermissionManager.js';
import { formatDate } from '../../utils/formatDate.js';
import { debounce } from '../../utils/debounce.js';

const t = (k) => (window.StaffI18N && window.StaffI18N.t(k)) || k;

class BlogCommentsModule {
  constructor() {
    this.allPosts = [];
  }

  init() {
    this.tableRender = new TableRender({
      containerId: 'blog-comments-table',
      emptyMessage: () => t('staff.comments.none'),
      columns: [
        { label: () => t('staff.col.id'), key: 'id' },
        {
          label: () => t('staff.col.post'),
          key: 'blog',
          render: item => item.blog
            ? `<a href="../blog-single.html?id=${item.blog.id}" target="_blank" class="text-decoration-none fw-semibold text-truncate d-inline-block" style="max-width:180px" title="${item.blog.title}">${item.blog.title}</a>`
            : '<span class="text-muted">—</span>'
        },
        {
          label: () => t('staff.col.author'),
          key: 'authorName',
          render: item => `<strong>${item.authorName}</strong><br><small class="text-muted"><a href="mailto:${item.authorEmail}">${item.authorEmail}</a></small>`
        },
        {
          label: () => t('staff.col.content'),
          key: 'content',
          render: item => `<div class="text-truncate" style="max-width:260px" title="${item.content.replace(/"/g,'&quot;')}">${item.content}</div>` +
            (item.parentId ? '<span class="badge bg-secondary ms-1" style="font-size:10px">Reply</span>' : '')
        },
        { label: () => t('staff.col.date'), key: 'createdAt', render: item => formatDate(item.createdAt, true) }
      ],
      actions: [
        { id: 'view',   label: 'View',   icon: 'bi-eye',   class: 'btn-info text-white' },
        { id: 'delete', label: () => t('staff.delete'), icon: 'bi-trash', class: 'btn-danger', show: () => PermissionManager.canDeleteBlogComment() }
      ]
    });

    this.setupEvents();
    this.loadPosts();
    this.loadData();
  }

  setupEvents() {
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      searchInput.addEventListener('input', debounce(() => this.loadData(), 500));
    }

    const filterPost = document.getElementById('filter-post');
    if (filterPost) {
      filterPost.addEventListener('change', () => this.loadData());
    }
  }

  async loadPosts() {
    try {
      const res = await BaseApi.get(`${CONFIG.ENDPOINTS.BLOG}?limit=100`);
      this.allPosts = res.data || [];
      const sel = document.getElementById('filter-post');
      if (!sel) return;
      this.allPosts.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = p.title;
        sel.appendChild(opt);
      });
    } catch (_) {}
  }

  async loadData() {
    this.tableRender.renderLoading();

    const search  = (document.getElementById('search-input')?.value  || '').trim();
    const blogId  =  document.getElementById('filter-post')?.value  || '';

    const params = new URLSearchParams();
    if (blogId)  params.append('blogId', blogId);
    if (search)  params.append('search', search);

    try {
      const response = await BaseApi.get(`${CONFIG.ENDPOINTS.BLOG_COMMENTS}?${params.toString()}`);
      const data  = response.data  || [];
      const total = response.pagination?.total ?? data.length;

      const totalEl = document.getElementById('total-label');
      if (totalEl) totalEl.textContent = `${total} comment${total !== 1 ? 's' : ''}`;

      this.tableRender.renderData(data, (action, item) => {
        if (action === 'view')   this.viewComment(item);
        if (action === 'delete') this.deleteComment(item);
      });
    } catch (error) {
      this.tableRender.renderData([]);
    }
  }

  viewComment(item) {
    const postLink = item.blog
      ? `<a href="../blog-single.html?id=${item.blog.id}" target="_blank">${item.blog.title}</a>`
      : '—';
    const typeTag = item.parentId
      ? '<span class="badge bg-secondary">Reply</span>'
      : '<span class="badge bg-primary">Comment</span>';

    ModalManager.showDetail(`Comment #${item.id}`, `
      <p><strong>Post:</strong> ${postLink}</p>
      <p><strong>Author:</strong> ${item.authorName} &nbsp;|&nbsp; <a href="mailto:${item.authorEmail}">${item.authorEmail}</a></p>
      <p><strong>Date:</strong> ${formatDate(item.createdAt, true)} &nbsp; ${typeTag}</p>
      <hr>
      <div class="p-3 bg-light rounded" style="white-space:pre-wrap;word-break:break-word">${item.content}</div>
    `);
  }

  deleteComment(item) {
    const preview = item.content.length > 80 ? item.content.slice(0, 80) + '…' : item.content;
    ModalManager.confirm(`Delete this comment?\n\n"${preview}"`, async () => {
      try {
        await BaseApi.delete(`${CONFIG.ENDPOINTS.BLOG}/comments/${item.id}`);
        ToastManager.success('Comment deleted');
        this.loadData();
      } catch (error) {
        ToastManager.error(error.message || 'Failed to delete comment');
      }
    });
  }

  destroy() {}
}

export default new BlogCommentsModule();
