export class EmptyState {
  static render(containerId, title = 'No data found', subtitle = 'Try adjusting your filters or search query.', icon = 'bi-inbox') {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = `
      <div class="empty-state">
        <i class="bi ${icon}"></i>
        <h4 class="font-heading mt-3">${title}</h4>
        <p class="text-muted mb-0">${subtitle}</p>
      </div>
    `;
  }
}
