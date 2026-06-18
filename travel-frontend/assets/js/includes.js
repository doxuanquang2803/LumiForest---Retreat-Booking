// Footer only — header được quản lý bởi header.js
fetch('assets/includes/footer.html')
  .then(function (r) { return r.text(); })
  .then(function (html) {
    var el = document.getElementById('footer-placeholder');
    if (!el) return;
    el.innerHTML = html;

    // Fetch dynamic footer details from backend settings
    fetch('http://localhost:3000/api/settings/footer')
      .then(function (res) { return res.json(); })
      .then(function (resData) {
        if (resData.success && resData.data) {
          var footer = resData.data;
          
          var descEl = el.querySelector('#footer-desc');
          var addrEl = el.querySelector('#footer-address');
          var phoneEl = el.querySelector('#footer-phone');
          var emailEl = el.querySelector('#footer-email');

          if (descEl && footer.desc) {
            descEl.textContent = footer.desc;
            descEl.removeAttribute('data-i18n');
          }
          if (addrEl && footer.address) addrEl.textContent = footer.address;
          if (phoneEl && footer.phone) phoneEl.textContent = footer.phone;
          if (emailEl && footer.email) emailEl.textContent = footer.email;
        }
        if (window.I18N) window.I18N.apply();
      })
      .catch(function (e) {
        console.warn('Could not load dynamic footer details:', e);
        if (window.I18N) window.I18N.apply();
      });
  })
  .catch(function () {
    console.warn('Could not load footer');
  });

// Dynamic Category Banners loader
(function () {
  var heroWrap = document.querySelector('.hero-wrap');
  if (!heroWrap) return;

  var path = window.location.pathname;
  var page = path.split('/').pop().replace('.html', '');
  if (!page) page = 'index';

  var pageKey = '';
  if (page === 'hotels' || page === 'rooms' || page === 'hotel-single' || page === 'rooms-single') {
    pageKey = 'hotels';
  } else if (page === 'apartments' || page === 'apartment-single') {
    pageKey = 'apartments';
  } else if (page === 'tours' || page === 'tour-single') {
    pageKey = 'tours';
  } else if (page === 'vouchers') {
    pageKey = 'vouchers';
  } else if (page === 'blog' || page === 'blog-single') {
    pageKey = 'blog';
  } else if (page === 'about') {
    pageKey = 'about';
  } else if (page === 'contact') {
    pageKey = 'contact';
  }

  if (pageKey) {
    fetch('http://localhost:3000/api/settings/categoryBanners')
      .then(function (res) { return res.json(); })
      .then(function (resData) {
        if (resData.success && resData.data && resData.data[pageKey]) {
          var imgUrl = resData.data[pageKey];
          // Resolve relative assets or absolute backend URLs
          if (imgUrl.startsWith('/uploads/')) {
            imgUrl = 'http://localhost:3000' + imgUrl;
          }
          heroWrap.style.backgroundImage = "url('" + imgUrl + "')";
        }
      })
      .catch(function (err) {
        console.warn('Could not load dynamic category banner:', err);
      });
  }
})();

// Dynamic Services loader
(function () {
  var servicesContainer = document.getElementById('dynamic-services-container');
  if (!servicesContainer) return;

  fetch('http://localhost:3000/api/settings/services')
    .then(function (res) { return res.json(); })
    .then(function (resData) {
      if (resData.success && resData.data && resData.data.length > 0) {
        // Lấy tối đa 4 dịch vụ mới nhất (nằm ở cuối danh sách)
        var services = resData.data.slice(-4);
        var html = '';
        services.forEach(function (svc) {
          var iconVal = svc.icon || 'flaticon-reception-bell';
          var isImage = iconVal.indexOf('/') !== -1 || iconVal.indexOf('.') !== -1;
          var iconHtml = '';
          if (isImage) {
            var imgUrl = iconVal;
            if (imgUrl.startsWith('/uploads/')) {
              imgUrl = 'http://localhost:3000' + imgUrl;
            }
            iconHtml = '<img src="' + imgUrl + '" style="width: 42px; height: 42px; object-fit: contain;" alt="Service Icon">';
          } else {
            iconHtml = '<span class="' + iconVal + '"></span>';
          }

          var titleVal = svc.title || '';
          var descVal = svc.desc || '';
          var titleAttr = '';
          var descAttr = '';

          // Map known default titles to their translation keys
          if (titleVal === '24/7 Front Desk' || titleVal === '25/7 Front Desk' || titleVal === 'Lễ tân 25/7' || titleVal === 'Lễ tân 24/7') {
            titleAttr = ' data-i18n="svc.frontdesk"';
          } else if (titleVal === 'Restaurant Bar' || titleVal === 'Nhà hàng & Quầy bar') {
            titleAttr = ' data-i18n="svc.restaurant"';
          } else if (titleVal === 'Transfer Services' || titleVal === 'Dịch vụ đưa đón') {
            titleAttr = ' data-i18n="svc.transfer"';
          } else if (titleVal === 'Spa Suites' || titleVal === 'Phòng Spa') {
            titleAttr = ' data-i18n="svc.spa"';
          }

          // Map known default description to translation key
          if (descVal === 'Thoughtful amenities and attentive service for a truly relaxing getaway.' ||
              descVal === 'Tiện nghi chu đáo và dịch vụ tận tâm cho một kỳ nghỉ thư giãn trọn vẹn.' ||
              descVal === 'A small river named Duden flows by their place and supplies.') {
            descAttr = ' data-i18n="svc.desc"';
          }

          html += '<div class="col-md-3 d-flex align-self-stretch ftco-animate fadeInUp ftco-animated">';
          html += '  <div class="media block-6 services py-4 d-block text-center">';
          html += '    <div class="d-flex justify-content-center">';
          html += '      <div class="icon d-flex align-items-center justify-content-center">';
          html += '        ' + iconHtml;
          html += '      </div>';
          html += '    </div>';
          html += '    <div class="media-body p-2 mt-2">';
          html += '      <h3 class="heading mb-3"' + titleAttr + '>' + titleVal + '</h3>';
          html += '      <p' + descAttr + '>' + descVal + '</p>';
          html += '    </div>';
          html += '  </div>';
          html += '</div>';
        });
        servicesContainer.innerHTML = html;
        if (window.I18N) window.I18N.applyI18n(servicesContainer);
      } else {
        renderDefaultServices(servicesContainer);
      }
    })
    .catch(function (err) {
      console.warn('Could not load dynamic services:', err);
      renderDefaultServices(servicesContainer);
    });

  function renderDefaultServices(container) {
    var defaultServices = [
      { icon: 'flaticon-reception-bell', title: '24/7 Front Desk', desc: 'A small river named Duden flows by their place and supplies.', i18nKey: 'svc.frontdesk' },
      { icon: 'flaticon-serving-dish', title: 'Restaurant Bar', desc: 'A small river named Duden flows by their place and supplies.', i18nKey: 'svc.restaurant' },
      { icon: 'flaticon-car', title: 'Transfer Services', desc: 'A small river named Duden flows by their place and supplies.', i18nKey: 'svc.transfer' },
      { icon: 'flaticon-spa', title: 'Spa Suites', desc: 'A small river named Duden flows by their place and supplies.', i18nKey: 'svc.spa' }
    ];
    var html = '';
    defaultServices.forEach(function (svc) {
      html += '<div class="col-md-3 d-flex align-self-stretch ftco-animate fadeInUp ftco-animated">';
      html += '  <div class="media block-6 services py-4 d-block text-center">';
      html += '    <div class="d-flex justify-content-center">';
      html += '      <div class="icon d-flex align-items-center justify-content-center">';
      html += '        <span class="' + svc.icon + '"></span>';
      html += '      </div>';
      html += '    </div>';
      html += '    <div class="media-body p-2 mt-2">';
      html += '      <h3 class="heading mb-3" data-i18n="' + svc.i18nKey + '">' + svc.title + '</h3>';
      html += '      <p data-i18n="svc.desc">' + svc.desc + '</p>';
      html += '      <p></p>'; // empty placeholder or keep standard styling
      html += '    </div>';
      html += '  </div>';
      html += '</div>';
    });
    container.innerHTML = html;
    if (window.I18N) window.I18N.applyI18n(container);
  }
})();

