document.addEventListener('DOMContentLoaded', async () => {
  // Only run if we are on the dashboard index page
  if (!document.getElementById('registrationChart')) return;

  try {
    const [usersResponse, logsResponse, trashResponse] = await Promise.all([
      api.get('/users'),
      api.get('/admin/audit-logs'),
      api.get('/trash/all'),
    ]);

    const users = usersResponse.data || [];
    const logs = logsResponse.data || [];
    const trash = trashResponse.data || [];

    // Update DOM Stats — prefer pagination.totalItems for accurate totals
    document.getElementById('stat-users').textContent = usersResponse.pagination?.totalItems ?? users.length;
    document.getElementById('stat-logs').textContent = logsResponse.pagination?.totalItems ?? logs.length;
    document.getElementById('stat-deleted').textContent = trash.length;
    document.getElementById('stat-active').textContent = '—';

    // Process data for charts
    const rolesCount = { ADMIN: 0, STAFF: 0, CUSTOMER: 0 };
    users.forEach(u => {
      if (rolesCount[u.role] !== undefined) {
        rolesCount[u.role]++;
      }
    });

    // Initialize Roles Chart
    const ctxRoles = document.getElementById('rolesChart').getContext('2d');
    const rolesChart = new Chart(ctxRoles, {
      type: 'doughnut',
      data: {
        labels: [t('role.admin'), t('role.staff'), t('role.customer')],
        datasets: [{
          data: [rolesCount.ADMIN, rolesCount.STAFF, rolesCount.CUSTOMER],
          backgroundColor: ['#6366f1', '#0ea5e9', '#22c55e'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'bottom' }
        }
      }
    });

    // Initialize Registration Chart (Mock Data for now)
    const ctxReg = document.getElementById('registrationChart').getContext('2d');
    const regChart = new Chart(ctxReg, {
      type: 'line',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [{
          label: t('chart.newUsers'),
          data: [12, 19, 3, 5, 2, Math.max(users.length, 3)],
          borderColor: '#0ea5e9',
          backgroundColor: 'rgba(14, 165, 233, 0.15)',
          tension: 0.4,
          fill: true
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: { beginAtZero: true }
        }
      }
    });

    // Update chart labels when the language changes
    document.addEventListener('i18n:changed', () => {
      rolesChart.data.labels = [t('role.admin'), t('role.staff'), t('role.customer')];
      rolesChart.update();
      regChart.data.datasets[0].label = t('chart.newUsers');
      regChart.update();
    });

  } catch (error) {
    console.error('Error loading dashboard stats:', error);
  }
});
