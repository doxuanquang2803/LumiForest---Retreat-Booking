document.addEventListener('DOMContentLoaded', function () {
  var form = document.getElementById('contact-form');
  if (form) {
    if (typeof Auth !== 'undefined' && Auth.isLoggedIn()) {
      var user = Auth.getUser();
      if (user) {
        var emailInput = form.querySelector('[name=email]');
        if (emailInput && !emailInput.value) emailInput.value = user.email || '';
        var nameInput = form.querySelector('[name=fullName]') || form.querySelector('[name=name]');
        if (nameInput && !nameInput.value) nameInput.value = user.name || user.fullName || '';
        var phoneInput = form.querySelector('[name=phone]');
        if (phoneInput && !phoneInput.value) phoneInput.value = user.phone || '';
      }
    }
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var btn = form.querySelector('input[type=submit]');
      var msgBox = document.getElementById('contact-msg');

      btn.disabled = true;
      btn.value = t('contact.sending');

      var data = {
        name:    form.querySelector('[name=name]').value.trim(),
        email:   form.querySelector('[name=email]').value.trim(),
        subject: form.querySelector('[name=subject]').value.trim(),
        message: form.querySelector('[name=message]').value.trim()
      };

      api.post('/contact', data).then(function (res) {
        msgBox.className = 'alert alert-' + (res.success ? 'success' : 'danger') + ' mt-3';
        msgBox.textContent = res.success ? t('contact.sentOk') : res.message;
        msgBox.style.display = 'block';
        if (res.success) form.reset();
      }).catch(function () {
        msgBox.className = 'alert alert-danger mt-3';
        msgBox.textContent = t('contact.connRetry');
        msgBox.style.display = 'block';
      }).finally(function () {
        btn.disabled = false;
        btn.value = t('contact.send');
      });
    });
  }

  // Load Contact Information
  api.get('/settings/contact_info').then(function(res) {
    if (res.success && res.data) {
      var info = res.data;
      if (info.address) {
        document.getElementById('pub-contact-address').textContent = info.address;
      }
      if (info.phone) {
        var phoneEl = document.getElementById('pub-contact-phone');
        phoneEl.textContent = info.phone;
        phoneEl.href = 'tel:' + info.phone.replace(/[^0-9+]/g, '');
      }
      if (info.email) {
        var emailEl = document.getElementById('pub-contact-email');
        emailEl.textContent = info.email;
        emailEl.href = 'mailto:' + info.email;
      }
      if (info.website) {
        var websiteEl = document.getElementById('pub-contact-website');
        var displayUrl = info.website.replace(/^https?:\/\//, '');
        websiteEl.textContent = displayUrl;
        websiteEl.href = info.website.startsWith('http') ? info.website : 'https://' + info.website;
      }

      // Initialize Leaflet Map
      if (info.mapLat && info.mapLng && typeof L !== 'undefined') {
        var location = [parseFloat(info.mapLat), parseFloat(info.mapLng)];
        var mapElement = document.getElementById('contact-map');
        if (mapElement) {
          var map = L.map('contact-map').setView(location, 14);
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
          }).addTo(map);

          L.marker(location).addTo(map)
            .bindPopup(info.address || 'We are here!')
            .openPopup();
        }
      }
    }
  }).catch(function(err) {
    console.error('Error loading contact info:', err);
  });

  // document.addEventListener('i18n:changed', function () { location.reload(); });
});
