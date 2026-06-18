export class ModalManager {
  static confirm(message, onConfirm) {
    if (window.CustomAlert) {
      window.CustomAlert.confirm(message).then(confirmed => {
        if (confirmed && typeof onConfirm === 'function') onConfirm();
      });
      return;
    }
    // Fallback if CustomAlert is somehow not loaded
    if (window.confirm(message)) {
      if (typeof onConfirm === 'function') onConfirm();
    }
  }

  static showDetail(title, bodyHtml) {
    const modalEl = document.getElementById('globalDetailModal');
    if (!modalEl) return;
    const titleEl = document.getElementById('globalDetailModalTitle');
    const bodyEl  = document.getElementById('globalDetailModalBody');
    if (titleEl) titleEl.textContent = title;
    if (bodyEl)  bodyEl.innerHTML   = bodyHtml;
    new bootstrap.Modal(modalEl).show();
  }

  static previewImage(url) {
    const modalEl = document.getElementById('imagePreviewModal');
    if (!modalEl) return;
    
    const imgEl = document.getElementById('imagePreviewModalImg');
    if (imgEl) imgEl.src = url;
    
    const bsModal = new bootstrap.Modal(modalEl);
    bsModal.show();
  }
}
