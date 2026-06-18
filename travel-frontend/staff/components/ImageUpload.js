import { compressImage } from '../utils/imageCompressor.js';

export class ImageUpload {
  constructor(config) {
    this.containerId = config.containerId;
    this.onFilesSelected = config.onFilesSelected;
    this.multiple = config.multiple || false;
    this.maxSizeMB = config.maxSizeMB || 5;
    
    this.files = [];
    this.init();
  }

  init() {
    const container = document.getElementById(this.containerId);
    if (!container) return;

    container.innerHTML = `
      <div class="drop-zone" id="${this.containerId}-dropzone">
        <i class="bi bi-cloud-arrow-up"></i>
        <h5>Drag & Drop images here</h5>
        <p class="text-muted mb-0">or click to browse</p>
        <input type="file" id="${this.containerId}-input" class="d-none" accept="image/*" ${this.multiple ? 'multiple' : ''}>
      </div>
      <div class="image-preview-container" id="${this.containerId}-preview"></div>
    `;

    this.dropzone = document.getElementById(`${this.containerId}-dropzone`);
    this.input = document.getElementById(`${this.containerId}-input`);
    this.previewContainer = document.getElementById(`${this.containerId}-preview`);

    this.setupEvents();
  }

  setupEvents() {
    this.dropzone.addEventListener('click', () => this.input.click());
    
    this.dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      this.dropzone.classList.add('dragover');
    });

    this.dropzone.addEventListener('dragleave', (e) => {
      e.preventDefault();
      this.dropzone.classList.remove('dragover');
    });

    this.dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      this.dropzone.classList.remove('dragover');
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        this.handleFiles(e.dataTransfer.files);
      }
    });

    this.input.addEventListener('change', () => {
      if (this.input.files && this.input.files.length > 0) {
        this.handleFiles(this.input.files);
      }
    });
  }

  async handleFiles(fileList) {
    let filesArray = Array.from(fileList);
    
    if (!this.multiple) {
      filesArray = [filesArray[0]];
      this.files = [];
      this.previewContainer.innerHTML = '';
    }

    for (let file of filesArray) {
      if (!file.type.startsWith('image/')) continue;
      if (file.size > this.maxSizeMB * 1024 * 1024) {
        window.CustomAlert.alert(`File ${file.name} is too large (max ${this.maxSizeMB}MB)`);
        continue;
      }
      
      const compressed = await compressImage(file);
      this.files.push(compressed);
    }
    
    this.reRenderPreviews();
    
    if (this.onFilesSelected) {
      this.onFilesSelected(this.files);
    }
    
    this.input.value = ''; // Reset input
  }

  renderPreview(file, index) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const item = document.createElement('div');
      item.className = 'image-preview-item';
      item.dataset.index = index;
      
      item.innerHTML = `
        <img src="${e.target.result}" alt="Preview">
        <button type="button" class="btn-remove"><i class="bi bi-x"></i></button>
      `;
      
      item.querySelector('.btn-remove').addEventListener('click', (evt) => {
        evt.stopPropagation();
        this.removeFile(index);
      });
      
      this.previewContainer.appendChild(item);
    };
    reader.readAsDataURL(file);
  }

  removeFile(index) {
    this.files.splice(index, 1);
    this.reRenderPreviews();
    if (this.onFilesSelected) {
      this.onFilesSelected(this.files);
    }
  }

  reRenderPreviews() {
    this.previewContainer.innerHTML = '';
    
    // Render existing images first
    if (this.existingImages && this.existingImages.length > 0) {
      this.existingImages.forEach((imgObj, index) => {
        const item = document.createElement('div');
        item.className = 'image-preview-item existing-image';
        item.innerHTML = `
          <img src="${imgObj.url}" alt="Existing Preview">
          <div style="position: absolute; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.5); color: white; text-align: center; font-size: 10px; padding: 2px;">Current</div>
          <button type="button" class="btn-remove" title="Remove existing image"><i class="bi bi-x"></i></button>
        `;
        
        item.querySelector('.btn-remove').addEventListener('click', (evt) => {
          evt.stopPropagation();
          this.removeExistingImage(index);
        });
        
        this.previewContainer.appendChild(item);
      });
    }

    this.files.forEach((file, index) => {
      this.renderPreview(file, index);
    });
  }
  
  setExistingImages(images) {
    const resolveUrl = (url) => {
      if (!url) return '';
      if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
      if (url.startsWith('/uploads/')) return 'http://localhost:3000' + url;
      return url;
    };

    if (!images) {
      this.existingImages = [];
    } else {
      // Map to { id, url } format
      this.existingImages = (Array.isArray(images) ? images : [images]).map(img => {
        if (typeof img === 'string') return { id: null, url: resolveUrl(img) };
        return { id: img.id, url: resolveUrl(img.imageUrl || img.url) };
      }).filter(img => img.url && img.url.trim().length > 0);
    }
    this.deletedImageIds = [];
    this.reRenderPreviews();
  }
  
  removeExistingImage(index) {
    if (this.existingImages) {
      const removed = this.existingImages.splice(index, 1)[0];
      if (removed && removed.id) {
        this.deletedImageIds = this.deletedImageIds || [];
        this.deletedImageIds.push(removed.id);
      }
      this.reRenderPreviews();
    }
  }

  clear() {
    this.files = [];
    this.existingImages = [];
    this.deletedImageIds = [];
    this.reRenderPreviews();
  }

  getFiles() {
    return this.files;
  }
  
  getExistingImages() {
    return this.existingImages || [];
  }

  getDeletedImageIds() {
    return this.deletedImageIds || [];
  }
}
