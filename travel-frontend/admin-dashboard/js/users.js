let userModalInstance;
let usersList = [];

document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('users-table')) return;

  // Initialize Bootstrap modal
  const modalEl = document.getElementById('userModal');
  userModalInstance = new bootstrap.Modal(modalEl);

  fetchUsers();

  // Form submit handler
  document.getElementById('user-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    await saveUser();
  });

  // Re-render rows when the language changes
  document.addEventListener('i18n:changed', () => {
    if (usersList.length) renderUsers();
  });
});

async function fetchUsers() {
  const tbody = document.getElementById('users-tbody');
  try {
    const response = await api.get('/users');
    usersList = response.data || [];
    renderUsers();
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center text-danger py-4">${t('users.error')}</td></tr>`;
  }
}

function renderUsers() {
  const tbody = document.getElementById('users-tbody');
  tbody.innerHTML = '';
  
  if (usersList.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-4">${t('users.empty')}</td></tr>`;
    return;
  }

  usersList.forEach(user => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="text-muted">#${user._id || user.id}</td>
      <td class="fw-semibold">${user.name || user.username || ''}</td>
      <td>${user.email}</td>
      <td>${getRoleBadge(user.role)}</td>
      <td class="text-end">
        <button class="btn btn-sm btn-icon btn-outline-primary me-1" title="${t('btn.edit')}" onclick="window.openUserModal('${user._id || user.id}')">
          <i class="bi bi-pencil"></i>
        </button>
        <button class="btn btn-sm btn-icon btn-outline-danger" title="${t('btn.delete')}" onclick="window.deleteUser('${user._id || user.id}')">
          <i class="bi bi-trash"></i>
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function getRoleBadge(role) {
  switch (role) {
    case 'ADMIN': return `<span class="badge badge-role-admin">${t('role.admin')}</span>`;
    case 'STAFF': return `<span class="badge badge-role-staff">${t('role.staff')}</span>`;
    default: return `<span class="badge badge-role-customer">${t('role.customer')}</span>`;
  }
}

window.openUserModal = (userId = null) => {
  const modalTitle = document.getElementById('userModalLabel');
  const errorDiv = document.getElementById('modal-error');
  
  errorDiv.classList.add('d-none');
  document.getElementById('user-form').reset();
  document.getElementById('userId').value = userId || '';

  if (userId) {
    modalTitle.textContent = t('modal.editTitle');
    const user = usersList.find(u => String(u._id || u.id) === String(userId));
    if (user) {
      document.getElementById('username').value = user.name || user.username || '';
      document.getElementById('userEmail').value = user.email;
      document.getElementById('userRole').value = user.role;
      document.getElementById('userPassword').required = false;
      document.getElementById('pwd-help').classList.remove('d-none');
    }
  } else {
    modalTitle.textContent = t('modal.addTitle');
    document.getElementById('userPassword').required = true;
    document.getElementById('pwd-help').classList.add('d-none');
  }

  userModalInstance.show();
};

async function saveUser() {
  const id = document.getElementById('userId').value;
  const username = document.getElementById('username').value;
  const email = document.getElementById('userEmail').value;
  const password = document.getElementById('userPassword').value;
  const role = document.getElementById('userRole').value;
  
  const btn = document.getElementById('save-user-btn');
  const errorDiv = document.getElementById('modal-error');
  
  const payload = { name: username, email, role };
  if (password) payload.password = password;

  try {
    btn.disabled = true;
    errorDiv.classList.add('d-none');

    if (id) {
      await api.put(`/users/${id}`, payload);
    } else {
      await api.post('/users', payload);
    }

    userModalInstance.hide();
    fetchUsers();
  } catch (err) {
    errorDiv.textContent = err.message || t('error.saveUser');
    errorDiv.classList.remove('d-none');
  } finally {
    btn.disabled = false;
  }
}

window.deleteUser = async (userId) => {
  const confirmed = await window.CustomAlert.confirm(t('confirm.deleteUser'));
  if (!confirmed) return;
  try {
    await api.delete(`/users/${userId}`);
    fetchUsers(); // Refresh
  } catch (err) {
    window.CustomAlert.alert(t('alert.deleteUserFail') + err.message);
  }
};
