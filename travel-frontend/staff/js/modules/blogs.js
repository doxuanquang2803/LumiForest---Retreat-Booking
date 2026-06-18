import { BaseApi } from '../../services/BaseApi.js';
import { CONFIG } from '../../services/config.js';
import { TableRender } from '../../components/TableRender.js';
import { ModalManager } from '../../components/ModalManager.js';
import { ToastManager } from '../../components/ToastManager.js';
import { PermissionManager } from '../../services/PermissionManager.js';
import { ImageUpload } from '../../components/ImageUpload.js';
import { formatDate } from '../../utils/formatDate.js';
import { debounce } from '../../utils/debounce.js';

const t = (k) => (window.StaffI18N && window.StaffI18N.t(k)) || k;
const tf = (k, p) => (window.StaffI18N && window.StaffI18N.tf(k, p)) || k;

class BlogsModule {
  constructor() {
    this.modal = null;
    this.imageUpload = null;
    this.currentBlogId = null;
    this.autoSaveInterval = null;
    this.quill = null;
  }

  init() {
    this.modal = new bootstrap.Modal(document.getElementById('blogModal'));
    
    this.imageUpload = new ImageUpload({
      containerId: 'image-upload-container',
      multiple: false,
      maxSizeMB: 5
    });

    this.tableRender = new TableRender({
      containerId: 'blogs-table',
      emptyMessage: () => t('staff.blogs.none'),
      columns: [
        { label: () => t('staff.col.id'), key: 'id' },
        { label: () => t('staff.col.title'), key: 'title', render: item => `<strong>${item.title}</strong><br><small class="text-muted">/${item.slug}</small>` },
        { label: () => t('staff.col.author'), key: 'author', render: item => item.author || 'Admin' },
        { label: () => t('staff.col.publishedAt'), key: 'created_at', render: item => formatDate(item.created_at || item.createdAt, true) }
      ],
      actions: [
        { id: 'edit', label: () => t('staff.edit'), icon: 'bi-pencil', class: 'btn-light' },
        { id: 'delete', label: () => t('staff.delete'), icon: 'bi-trash', class: 'btn-danger', show: () => PermissionManager.canDeleteBlog() }
      ]
    });

    this.initQuill();
    this.setupEvents();
    this.loadData();
  }

  initQuill() {
    if (this.quill) return;

    this.quill = new Quill('#blog-content-editor', {
      theme: 'snow',
      modules: {
        toolbar: {
          container: [
            [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            ['blockquote', 'code-block'],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            [{ 'script': 'sub'}, { 'script': 'super' }],
            [{ 'indent': '-1'}, { 'indent': '+1' }],
            [{ 'direction': 'rtl' }],
            [{ 'color': [] }, { 'background': [] }],
            [{ 'align': [] }],
            ['link', 'image', 'video'],
            ['clean']
          ],
          handlers: {
            image: this.imageHandler.bind(this)
          }
        }
      }
    });
  }

  imageHandler() {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = async () => {
      const file = input.files[0];
      if (file) {
        const formData = new FormData();
        formData.append('image', file);

        try {
          // ToastManager.info('Uploading image...');
          const response = await BaseApi.post(`${CONFIG.ENDPOINTS.BLOG}/upload-image`, formData);
          
          if (response.success && response.url) {
            const range = this.quill.getSelection();
            const index = range ? range.index : this.quill.getLength();
            // response.url is now a full Supabase public URL
            this.quill.insertEmbed(index, 'image', response.url);
            this.quill.setSelection(index + 1);
          } else {
            ToastManager.error('Failed to get image URL');
          }
        } catch (error) {
          console.error(error);
          ToastManager.error(error.message || 'Error uploading image');
        }
      }
    };
  }

  setupEvents() {
    document.getElementById('btn-add-blog').addEventListener('click', () => {
      this.currentBlogId = null;
      this._currentImageUrl = null;
      document.getElementById('blog-form').reset();
      this.imageUpload.clear();
      this.quill.root.innerHTML = ''; // clear editor
      document.getElementById('blogModalLabel').textContent = 'Write Blog';
      document.getElementById('draft-status').textContent = '';
      
      this.modal.show();
      this.startAutoSave();

      // Check if there is an existing draft
      const savedDraft = localStorage.getItem('blog_draft');
      if (savedDraft) {
        try {
          const draft = JSON.parse(savedDraft);
          if (draft.title || (draft.content && draft.content !== '<p><br></p>')) {
            ModalManager.confirm('We found an unsaved draft. Do you want to restore it?', () => {
              document.getElementById('blog-title').value = draft.title || '';
              document.getElementById('blog-slug').value = draft.slug || '';
              if (draft.content) {
                this.quill.clipboard.dangerouslyPasteHTML(draft.content);
              }
              document.getElementById('draft-status').textContent = 'Draft restored';
            });
          }
        } catch (e) {
          console.error('Error parsing draft:', e);
        }
      }
    });

    const titleInput = document.getElementById('blog-title');
    const slugInput = document.getElementById('blog-slug');
    
    titleInput.addEventListener('input', () => {
      if (!this.currentBlogId) {
        slugInput.value = this.generateSlug(titleInput.value);
      }
    });

    const searchInput = document.getElementById('search-input');
    searchInput.addEventListener('input', debounce(() => {
      this.loadData({ search: searchInput.value });
    }, 500));

    document.getElementById('btn-save-blog').addEventListener('click', () => {
      const form = document.getElementById('blog-form');
      if (form && !form.reportValidity()) return;
      this.saveBlog();
    });

    document.getElementById('blogModal').addEventListener('hidden.bs.modal', () => {
      this.stopAutoSave();
    });
  }

  generateSlug(text) {
    return text.toString().toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
  }

  startAutoSave() {
    this.stopAutoSave();
    
    // Auto save on input (debounced)
    const handleInput = debounce(() => {
      this.saveDraft();
    }, 2000);

    const titleInput = document.getElementById('blog-title');
    titleInput.addEventListener('input', handleInput);
    this.quill.on('text-change', handleInput);

    // Save references to remove listener later
    this._handleInput = handleInput;
    this._titleInputRef = titleInput;

    // Fallback interval
    this.autoSaveInterval = setInterval(() => {
      this.saveDraft();
    }, 15000); // 15 seconds
  }

  stopAutoSave() {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
    }
    if (this._handleInput) {
      if (this._titleInputRef) {
        this._titleInputRef.removeEventListener('input', this._handleInput);
      }
      if (this.quill) {
        this.quill.off('text-change', this._handleInput);
      }
      this._handleInput = null;
      this._titleInputRef = null;
    }
  }

  saveDraft() {
    // Only save draft if it's a new blog post (not editing an existing one)
    if (this.currentBlogId) return;

    const title = document.getElementById('blog-title').value;
    const content = this.quill.root.innerHTML;
    const slug = document.getElementById('blog-slug').value;
    
    if (title || (content && content !== '<p><br></p>')) {
      const draft = { title, content, slug };
      localStorage.setItem('blog_draft', JSON.stringify(draft));
      const draftStatus = document.getElementById('draft-status');
      if (draftStatus) {
        draftStatus.textContent = `Draft saved at ${new Date().toLocaleTimeString()}`;
      }
    }
  }

  async loadData(params = {}) {
    this.tableRender.renderLoading();
    try {
      const query = new URLSearchParams(params).toString();
      const response = await BaseApi.get(`${CONFIG.ENDPOINTS.BLOG}?${query}`);
      const data = response.data || response || [];
      
      this.tableRender.renderData(data, (action, item) => {
        if (action === 'edit') this.editBlog(item);
        if (action === 'delete') this.deleteBlog(item);
      });
    } catch (error) {
      this.tableRender.renderData([]);
    }
  }

  editBlog(item) {
    this.currentBlogId = item.id;
    this._currentImageUrl = item.image || null;

    document.getElementById('blog-title').value = item.title || '';
    document.getElementById('blog-slug').value = item.slug || '';

    // Paste HTML safely into Quill
    this.quill.clipboard.dangerouslyPasteHTML(item.content || '');

    document.getElementById('draft-status').textContent = '';

    // Show existing cover image in the preview (or clear if none)
    this.imageUpload.clear();
    if (item.image) {
      this.imageUpload.setExistingImages([{ id: null, url: item.image }]);
    }

    document.getElementById('blogModalLabel').textContent = 'Edit Blog';
    this.modal.show();
    this.startAutoSave();
  }

  async saveBlog() {
    const title = document.getElementById('blog-title').value;
    const slug = document.getElementById('blog-slug').value;
    let content = this.quill.root.innerHTML;

    // Handle empty Quill state
    if (content === '<p><br></p>') content = '';

    if (!title || !slug || !content) {
      ToastManager.error('Please fill in all required fields.');
      return;
    }

    // Upload cover image if a new file was selected
    let imageUrl = null;
    const coverFiles = this.imageUpload ? this.imageUpload.getFiles() : [];
    if (coverFiles.length > 0) {
      const btn = document.getElementById('btn-save-blog');
      btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Uploading image...';
      try {
        const formData = new FormData();
        formData.append('image', coverFiles[0]);
        const uploadRes = await BaseApi.post(`${CONFIG.ENDPOINTS.BLOG}/upload-image`, formData);
        if (uploadRes.success && uploadRes.url) {
          imageUrl = uploadRes.url;
        } else {
          ToastManager.error('Could not get image URL from server.');
        }
      } catch (e) {
        ToastManager.error('Cover image upload failed: ' + (e.message || 'Unknown error'));
        console.error('Cover image upload failed', e);
      }
    }

    // Keep existing image if no new file selected and no existing image cleared
    if (!imageUrl && this.currentBlogId && this._currentImageUrl) {
      imageUrl = this._currentImageUrl;
    }

    const data = {
      title,
      slug,
      content,
      category: 'general',
      published: true,
      ...(imageUrl && { image: imageUrl })
    };

    const btn = document.getElementById('btn-save-blog');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Publishing...';
    btn.disabled = true;

    try {
      if (this.currentBlogId) {
        await BaseApi.put(`${CONFIG.ENDPOINTS.BLOG}/${this.currentBlogId}`, data);
        ToastManager.success('Blog updated successfully');
      } else {
        await BaseApi.post(`${CONFIG.ENDPOINTS.BLOG}`, data);
        ToastManager.success('Blog published successfully');
      }

      localStorage.removeItem('blog_draft');
      this.stopAutoSave();
      this.modal.hide();
      this.loadData();
    } catch (error) {
      console.error(error);
      ToastManager.error(error.message || 'Failed to save blog');
    } finally {
      btn.innerHTML = originalText;
      btn.disabled = false;
    }
  }

  deleteBlog(item) {
    ModalManager.confirm(`Are you sure you want to delete ${item.title}?`, async () => {
      try {
        await BaseApi.delete(`${CONFIG.ENDPOINTS.BLOG}/${item.id}`);
        ToastManager.success('Blog deleted successfully');
        this.loadData();
      } catch (error) {
        console.error(error);
      }
    });
  }

  destroy() {
    this.stopAutoSave();
    if (this.modal) this.modal.dispose();
  }
}

export default new BlogsModule();

