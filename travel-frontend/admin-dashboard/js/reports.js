document.addEventListener('DOMContentLoaded', function () {
  var currentYear = new Date().getFullYear();
  var yearSelector = document.getElementById('yearSelector');
  var monthSelector = document.getElementById('monthSelector');
  var typeSelector = document.getElementById('typeSelector');

  function reloadData() {
    var y = yearSelector ? yearSelector.value : currentYear;
    var m = monthSelector ? monthSelector.value : 'all';
    var t = typeSelector ? typeSelector.value : 'all';
    loadRevenueChart(y, m, t);
  }

  if (yearSelector) yearSelector.addEventListener('change', reloadData);
  if (monthSelector) monthSelector.addEventListener('change', reloadData);
  if (typeSelector) typeSelector.addEventListener('change', reloadData);

  var revenueChartInstance = null;

  function loadRevenueChart(year, month, type) {
    var endpoint = '/admin/reports/charts?year=' + year;
    if (month) endpoint += '&month=' + month;
    if (type) endpoint += '&type=' + type;
    
    api.get(endpoint, { requiresAuth: true })
      .then(function (res) {
        if (res.success && res.data) {
          renderChart(res.data);
        }
      })
      .catch(function (err) {
        console.error('Error loading chart data', err);
      });
  }

  function renderChart(dataObj) {
    var ctx = document.getElementById('monthlyRevenueChart').getContext('2d');
    
    if (revenueChartInstance) {
      revenueChartInstance.destroy();
    }

    var isEN = document.documentElement.lang === 'en' || !document.documentElement.lang;
    var isDaily = dataObj.isDaily;
    var dataArr = dataObj.chartData;
    var chartLabels = [];

    if (isDaily) {
      for (var i = 1; i <= dataArr.length; i++) {
        chartLabels.push(i);
      }
    } else {
      chartLabels = isEN 
        ? ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        : ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];
    }

    var gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(13, 110, 253, 0.5)');
    gradient.addColorStop(1, 'rgba(13, 110, 253, 0.05)');

    revenueChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: chartLabels,
        datasets: [{
          label: isEN ? 'Revenue (VND)' : 'Doanh thu (VNĐ)',
          data: dataArr,
          borderColor: '#0d6efd',
          backgroundColor: gradient,
          borderWidth: 3,
          pointBackgroundColor: '#fff',
          pointBorderColor: '#0d6efd',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function(context) {
                var value = context.parsed.y || 0;
                return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: '#f1f5f9',
              drawBorder: false
            },
            ticks: {
              callback: function(value) {
                if (value >= 1000000) {
                  return (value / 1000000) + 'M';
                }
                if (value >= 1000) {
                  return (value / 1000) + 'K';
                }
                return value;
              }
            }
          },
          x: {
            grid: { display: false, drawBorder: false }
          }
        }
      }
    });
  }

  function loadTopLocations() {
    api.get('/admin/reports/top-locations', { requiresAuth: true })
      .then(function (res) {
        if (res.success && res.data) {
          renderTopLocations(res.data.topLocations);
          renderTopHotels(res.data.topHotels);
        }
      })
      .catch(function (err) {
        console.error('Error loading top locations', err);
        document.getElementById('topLocationsContainer').innerHTML = '<div class="text-danger p-3">Failed to load data</div>';
      });
  }

  function renderTopLocations(locations) {
    var container = document.getElementById('topLocationsContainer');
    if (!locations || locations.length === 0) {
      container.innerHTML = '<div class="text-center text-muted py-4">No data available</div>';
      return;
    }

    var html = '';
    locations.forEach(function (loc, index) {
      var rankClass = index < 3 ? 'rank-' + (index + 1) : '';
      html += `
        <div class="top-item-row">
          <div class="d-flex align-items-center">
            <div class="item-rank ${rankClass}">${index + 1}</div>
            <div class="item-name">${loc.name || 'Unknown'}</div>
          </div>
          <div class="item-count">${loc.bookings} <span class="text-muted small fw-normal ms-1">bookings</span></div>
        </div>
      `;
    });
    container.innerHTML = html;
  }

  function renderTopHotels(hotels) {
    var container = document.getElementById('topHotelsContainer');
    if (!hotels || hotels.length === 0) {
      container.innerHTML = '<div class="text-center text-muted py-4">No data available</div>';
      return;
    }

    var html = '';
    hotels.forEach(function (hotel, index) {
      var rankClass = index < 3 ? 'rank-' + (index + 1) : '';
      html += `
        <div class="top-item-row">
          <div class="d-flex align-items-center">
            <div class="item-rank ${rankClass}">${index + 1}</div>
            <div class="item-name">${hotel.name || 'Unknown'}</div>
          </div>
          <div class="item-count">${hotel.bookings} <span class="text-muted small fw-normal ms-1">bookings</span></div>
        </div>
      `;
    });
    container.innerHTML = html;
  }

  // Initial load
  reloadData();
  loadTopLocations();
});
