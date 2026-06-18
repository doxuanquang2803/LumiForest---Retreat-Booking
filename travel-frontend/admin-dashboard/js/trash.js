let trashList = [];

document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('trash-table')) return;
  fetchTrash();

  // Re-render rows when the language changes
  document.addEventListener('i18n:changed', () => {
    if (trashList.length) renderTrash(trashList);
  });
});

async function fetchTrash() {
  const tbody = document.getElementById('trash-tbody');
  try {
    const response = await api.get('/trash/all');
    trashList = response.data || [];
    renderTrash(trashList);
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center text-danger py-4">${t('trash.error')}</td></tr>`;
  }
}

function renderTrash(items) {
  const tbody = document.getElementById('trash-tbody');
  tbody.innerHTML = '';
  
  if (items.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-4">${t('trash.empty')}</td></tr>`;
    return;
  }

  items.forEach(item => {
    // Format type to uppercase first letter
    const formattedType = item.type.charAt(0).toUpperCase() + item.type.slice(1);
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="text-muted">#${item.id}</td>
      <td><span class="badge badge-soft-info">${formattedType}</span></td>
      <td class="fw-semibold">${item.name || t('trash.unknown')}</td>
      <td>${new Date(item.deletedAt).toLocaleString(I18N.getLang() === 'vi' ? 'vi-VN' : 'en-US')}</td>
      <td class="text-end">
        <button class="btn btn-sm btn-outline-success" onclick="window.restoreItem('${item.type}', '${item.id}')">
          <i class="bi bi-arrow-counterclockwise me-1"></i> ${t('btn.restore')}
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

window.restoreItem = async (type, id) => {
  const confirmed = await window.CustomAlert.confirm(t('confirm.restore'));
  if (!confirmed) return;
  try {
    await api.post(`/trash/${type}/${id}/restore`);
    fetchTrash(); // Refresh
  } catch (err) {
    window.CustomAlert.alert(t('alert.restoreFail') + err.message);
  }
};
