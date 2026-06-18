export class ToastManager {
  static container = null;

  static init() {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.className = 'toast-container position-fixed bottom-0 end-0 p-3';
      this.container.style.zIndex = '9999';
      document.body.appendChild(this.container);
    }
  }

  static show(message, type = 'info', duration = 5000) {
    this.init();
    
    const toastEl = document.createElement('div');
    toastEl.className = `toast align-items-center text-white bg-${type} border-0 show`;
    toastEl.setAttribute('role', 'alert');
    toastEl.setAttribute('aria-live', 'assertive');
    toastEl.setAttribute('aria-atomic', 'true');
    
    // Smooth entry animation
    toastEl.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    toastEl.style.opacity = '0';
    toastEl.style.transform = 'translateY(20px)';
    
    toastEl.innerHTML = `
      <div class="d-flex">
        <div class="toast-body fw-medium">
          ${message}
        </div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" aria-label="Close"></button>
      </div>
    `;

    this.container.appendChild(toastEl);
    
    // Trigger animation
    requestAnimationFrame(() => {
      toastEl.style.opacity = '1';
      toastEl.style.transform = 'translateY(0)';
    });

    const closeBtn = toastEl.querySelector('.btn-close');
    
    const removeToast = () => {
      toastEl.style.opacity = '0';
      toastEl.style.transform = 'translateY(20px)';
      setTimeout(() => {
        if (toastEl.parentNode) {
          toastEl.parentNode.removeChild(toastEl);
        }
      }, 300);
    };

    closeBtn.addEventListener('click', removeToast);

    if (duration > 0) {
      setTimeout(removeToast, duration);
    }
  }

  static success(message, duration) { this.show(message, 'success', duration); }
  static error(message, duration) { this.show(message, 'danger', duration); }
  static warning(message, duration) { this.show(message, 'warning', duration); }
  static info(message, duration) { this.show(message, 'primary', duration); }
}
