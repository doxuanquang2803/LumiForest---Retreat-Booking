document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('audit-table')) return;

  fetchAuditLogs();

  document.getElementById('audit-filter-form').addEventListener('submit', (e) => {
    e.preventDefault();
    fetchAuditLogs();
  });

  // Re-render with the current filters when the language changes
  document.addEventListener('i18n:changed', () => fetchAuditLogs());
});

async function fetchAuditLogs() {
  const tbody = document.getElementById('audit-tbody');
  const action = document.getElementById('filter-action').value;
  const entity = document.getElementById('filter-entity').value.trim().toUpperCase();

  try {
    const response = await api.get('/admin/audit-logs');
    let logs = response.data || [];
    
    // Filter on frontend for instant, responsive results
    if (action) {
      logs = logs.filter(log => log.action === action);
    }
    if (entity) {
      logs = logs.filter(log => {
        const resource = (log.targetResource || '').toUpperCase();
        return resource.includes(entity) || 
               (entity === 'MEMBER' && resource === 'USER') ||
               (entity === 'USER' && resource === 'USER');
      });
    }
    
    renderAuditLogs(logs);
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center text-danger py-4">${t('audit.error')}</td></tr>`;
  }
}

function renderAuditLogs(logs) {
  const tbody = document.getElementById('audit-tbody');
  tbody.innerHTML = '';
  
  if (logs.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-4">${t('audit.empty')}</td></tr>`;
    return;
  }

  logs.forEach(log => {
    // 1. Format action badge
    let actionBadge = `<span class="badge bg-secondary">${log.action}</span>`;
    if (log.action === 'CREATE') actionBadge = `<span class="badge bg-success">CREATE</span>`;
    else if (log.action === 'UPDATE' || log.action === 'UPDATE_SETTINGS') actionBadge = `<span class="badge bg-info text-dark">UPDATE</span>`;
    else if (log.action === 'DELETE') actionBadge = `<span class="badge bg-danger">DELETE</span>`;
    else if (log.action === 'RESTORE') actionBadge = `<span class="badge bg-warning text-dark">RESTORE</span>`;

    // 2. Format entity type
    let entityName = log.targetResource || 'N/A';
    if (log.targetResource === 'USER') entityName = t('audit.entity.user');
    else if (log.targetResource === 'SystemSetting' || log.targetResource === 'SETTING' || log.targetResource === 'SETTINGS') entityName = t('audit.entity.setting');

    // 3. Format detailed action descriptions
    const details = log.details || {};
    let detailsHtml = '';
    if (log.action === 'CREATE') {
      detailsHtml = tf('audit.detail.create', { name: details.name || 'N/A', email: details.email || '', role: details.role || 'CUSTOMER' });
    } else if (log.action === 'UPDATE') {
      detailsHtml = tf('audit.detail.update', { id: log.targetId || 'N/A', name: details.name || 'N/A', email: details.email || '', role: details.role || '' });
    } else if (log.action === 'UPDATE_SETTINGS') {
      const key = details.key || 'unknown';
      detailsHtml = tf('audit.detail.updateSetting', { key: key });
    } else if (log.action === 'DELETE') {
      detailsHtml = tf('audit.detail.delete', { id: log.targetId || 'N/A' });
    } else if (log.action === 'RESTORE') {
      detailsHtml = tf('audit.detail.restore', { id: log.targetId || 'N/A', name: details.name || '' });
    } else {
      detailsHtml = `<span class="text-muted">${JSON.stringify(details)}</span>`;
    }

    const locale = I18N.getLang() === 'vi' ? 'vi-VN' : 'en-US';
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${new Date(log.createdAt || log.created_at).toLocaleString(locale)}</td>
      <td><strong>${tf('audit.performedBy', { id: log.actorId || 'System' })}</strong></td>
      <td>${actionBadge}</td>
      <td>${entityName}</td>
      <td>${detailsHtml}</td>
    `;
    tbody.appendChild(tr);
  });
}
